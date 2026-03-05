"""Reporting and validation helpers.

This module collects the various audit/validation routines that were
previously scattered across standalone scripts.  All functions are pure
(save for writing to a sheet) and accept explicit path arguments so they can
be tested.
"""
from __future__ import annotations
import os
import re
import csv
from pathlib import Path
from typing import Iterable, Tuple, List, Dict, Any

from ..helpers import csvtools, google


# --- sheet interaction --------------------------------------------------

@google.retry_on_auth_failure

def fetch_links_from_sheet() -> list[dict[str, str]]:
    """Download the "Automatic Links" sheet and return its rows.

    The caller must have a valid ``credentials.json`` in the ``utils/secret``
    directory (same behaviour as the old helper scripts, but moved to a
    dedicated secret folder).
    """
    service = google.get_sheets_service()
    ids = google.load_ids_config()
    spreadsheet_id = ids["automatic_links_spreadsheet_id"]
    sheet = service.spreadsheets()
    result = sheet.values().get(
        spreadsheetId=spreadsheet_id,
        range="'Automatic Links'",
    ).execute()
    values = result.get("values", [])
    if not values:
        return []
    headers = values[0]
    rows_data = values[1:]
    return [dict(zip(headers, row)) for row in rows_data]


@google.retry_on_auth_failure

def write_validated_to_sheet(
    rows: Iterable[Dict[str, str]],
    sheet_name: str = "Automatic Links Upload"
) -> None:
    """Write *rows* back to a (possibly new) sheet in the same workbook.

    This mirrors the behaviour of the original helper, but operates purely on
    the row data provided.
    """
    rows = list(rows)
    if not rows:
        return
    service = google.get_sheets_service()
    ids = google.load_ids_config()
    spreadsheet_id = ids["automatic_links_spreadsheet_id"]
    sheet = service.spreadsheets()

    # ensure sheet exists
    metadata = sheet.get(spreadsheetId=spreadsheet_id).execute()
    existing_titles = [s["properties"]["title"] for s in metadata.get("sheets", [])]
    if sheet_name not in existing_titles:
        body = {"requests": [{"addSheet": {"properties": {"title": sheet_name}}}]}
        sheet.batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()

    # clear
    sheet.values().clear(spreadsheetId=spreadsheet_id, range=f"'{sheet_name}'!A:Z").execute()
    values = [list(rows[0].keys())] + [[row.get(col, "") for col in rows[0].keys()] for row in rows]
    sheet.values().update(
        spreadsheetId=spreadsheet_id,
        range=f"'{sheet_name}'!A1",
        valueInputOption="RAW",
        body={"values": values},
    ).execute()


# --- validation / auditing ---------------------------------------------

def validate_paths(rows: Iterable[Dict[str, str]], base_dir: Path) -> list[Dict[str, str]]:
    """Return a new list of rows with the existence columns populated.

    ``base_dir`` is expected to be the repository root (parent of
    ``source``/``assets``).
    """
    return csvtools.augment_with_existence(rows, base_dir)


def find_unreferenced_pdfs(base_dir: Path) -> List[str]:
    """Return a list of PDF paths (relative to lesson_plans/) that aren't
    mentioned in any source file.
    """
    assets_dir = base_dir / "assets" / "lesson_plans"
    source_dir = base_dir / "source"
    pdfs: List[str] = []
    for root, _, files in os.walk(assets_dir):
        for f in files:
            if f.lower().endswith(".pdf"):
                rel = os.path.relpath(os.path.join(root, f), assets_dir)
                pdfs.append(rel)

    source_text = ""
    for root, _, files in os.walk(source_dir):
        for f in files:
            if f.endswith(('.ptx', '.xml', '.txt')):
                path = os.path.join(root, f)
                with open(path, encoding='utf-8') as fh:
                    source_text += fh.read().lower() + '\n'

    unreferenced: List[str] = []
    for pdf in pdfs:
        pdf_name = os.path.basename(pdf).lower()
        pdf_path = pdf.replace('\\', '/').lower()
        if pdf_name not in source_text and pdf_path not in source_text:
            unreferenced.append(pdf)
    return unreferenced


def audit_xml_ids(csv_path: Path, source_dir: Path) -> Tuple[Dict[str, Any], Dict[str, str]]:
    """Re‑implement the logic from ``helpers/audit_xml_ids.py``.

    Returns ``(results, id_mapping)`` as the original script did.  The
    caller may choose to write the mapping to disk using
    :func:`save_id_mapping`.
    """
    results = {
        'matches': [],
        'mismatches': [],
        'missing_files': [],
        'no_xml_id': [],
    }
    id_mapping: Dict[str, str] = {}

    def get_expected_xml_id(section_filecase, subsection_filecase, subsubsection_filecase):
        if subsubsection_filecase:
            return f"subsubsec-{subsubsection_filecase}"
        elif subsection_filecase:
            return f"subsec-{subsection_filecase}"
        else:
            return f"sec-{section_filecase}"

    def extract_xml_id_from_file(filepath: Path) -> Tuple[Optional[str], Optional[str]]:
        try:
            content = filepath.read_text(encoding='utf-8')[:2000]
        except Exception as e:
            print(f"  Error reading {filepath}: {e}")
            return None, None
        pattern = r'<(section|subsection|subsubsection)\s+[^>]*xml:id\s*=\s*["\']([^"\']+)["\']'
        match = re.search(pattern, content)
        if match:
            return match.group(2), match.group(1)
        pattern2 = r'<(section|subsection|subsubsection)\s+xml:id\s*=\s*["\']([^"\']+)["\']'
        match2 = re.search(pattern2, content)
        if match2:
            return match2.group(2), match2.group(1)
        return None, None

    with csv_path.open(encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            chapter = row['Chapter'].strip()
            ptx_exists = row['PTX Exists'].strip()
            ptx_path = row['PTX Path'].strip()
            if not chapter or not ptx_path or ptx_exists != 'YES':
                continue
            expected_id = get_expected_xml_id(
                row['Section Filecase'].strip(),
                row['Subsection Filecase'].strip(),
                row['Subsubsection Filecase'].strip(),
            )
            full_path = source_dir / ptx_path
            if not full_path.is_file():
                results['missing_files'].append({'ptx_path': ptx_path, 'expected_id': expected_id})
                continue
            actual_id, element_type = extract_xml_id_from_file(full_path)
            if actual_id is None:
                results['no_xml_id'].append({'ptx_path': ptx_path, 'expected_id': expected_id})
                continue
            if actual_id == expected_id:
                results['matches'].append({'ptx_path': ptx_path, 'xml_id': actual_id})
            else:
                results['mismatches'].append({
                    'ptx_path': ptx_path,
                    'expected_id': expected_id,
                    'actual_id': actual_id,
                    'element_type': element_type,
                })
            id_mapping[expected_id] = actual_id
    return results, id_mapping


def save_id_mapping(id_mapping: Dict[str, str], output_path: Path) -> None:
    """Persist *id_mapping* to *output_path* (CSV format)."""
    with output_path.open('w', encoding='utf-8') as f:
        f.write("# Mapping of expected xml:ids to actual xml:ids\n")
        f.write("# Format: expected_id,actual_id\n")
        for expected, actual in sorted(id_mapping.items()):
            f.write(f"{expected},{actual}\n")
    print(f"\nID mapping saved to: {output_path}")
