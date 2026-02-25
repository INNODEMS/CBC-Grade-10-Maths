"""CSV utilities for the CBC‑Grade‑10‑Maths project.

This module knows about the field names used in the various spreadsheets and
provides simple helpers for reading and writing the "Automatic Links" data.
Other scripts should import from here instead of spelling the column names
explicitly or opening files themselves.
"""

from __future__ import annotations
from pathlib import Path
from typing import Iterable, Mapping
import csv

# common column names used in the CSV produced by compare_with_sheet_structure.py
PTX_COL = "PTX Path"
LP_COL = "Lesson Plan Path"
STEP_COL = "Step By Step Guide Path"
CHAPTER_COL = "Chapter"
SECTION_COL = "Section"


# ------------------------------------------------------------------
# cached‑csv folder helpers
# ------------------------------------------------------------------

def cached_dir() -> Path:
    """Return the path to the `utils/cached-csv` directory, creating it if
    necessary."""
    d = Path(__file__).resolve().parent / "cached-csv"
    d.mkdir(exist_ok=True)
    return d


def cached_file(name: str) -> Path:
    """Return the path to a file inside the cached directory."""
    return cached_dir() / name

EXTRA_COLUMNS = ["PTX Exists", "Lesson Plan Exists", "Step By Step Guide Exists"]


def read_links_csv(path: Path | str | None = None) -> list[dict[str, str]]:
    """Read a CSV and return a list of rows as dictionaries.

    If *path* is omitted the file `Automatic Links.csv` in the cached directory
    is used.  The input file is assumed to use UTF‑8 encoding.  Leading/
    trailing whitespace is stripped from each value.
    """
    if path is None:
        path = cached_file("Automatic Links.csv")
    path = Path(path)
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows: list[dict[str, str]] = []
        for row in reader:
            clean = {k: v.strip() for k, v in row.items()}
            rows.append(clean)  # type: ignore[assignment]
        return rows


def write_links_csv(rows: Iterable[Mapping[str, str]], path: Path | str | None = None) -> None:
    """Write a list of dictionaries to a CSV file.

    If *path* is omitted the `Automatic Links.csv` in the cached directory is
    used.  The fieldnames will be taken from the keys of the first row.
    Existing files are overwritten.
    """
    rows = list(rows)
    if not rows:
        raise ValueError("no rows to write")
    if path is None:
        path = cached_file("Automatic Links.csv")
    path = Path(path)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def augment_with_existence(rows: Iterable[Mapping[str, str]], base_dir: Path) -> list[dict[str, str]]:
    """Return a new list of rows where the three "Exists" columns are populated.

    The function mimics the behaviour of the old `validate_paths` helper, but
    it does *not* contact Google Sheets.  It simply checks the filesystem using
    ``base_dir`` as the root of `source/` and `assets/lesson_plans/`.
    """
    out: list[dict[str, str]] = []
    for row in rows:
        r = dict(row)
        ptx_rel = r.get(PTX_COL, "")
        lp_rel = r.get(LP_COL, "")
        step_rel = r.get(STEP_COL, "")
        ptx_path = base_dir / "source" / ptx_rel if ptx_rel else None
        lp_path = base_dir / "assets" / "lesson_plans" / lp_rel if lp_rel else None
        step_path = base_dir / "assets" / "lesson_plans" / step_rel if step_rel else None
        r["PTX Exists"] = "YES" if ptx_path and ptx_path.is_file() else "NO"
        r["Lesson Plan Exists"] = "YES" if lp_path and lp_path.is_file() else "NO"
        r["Step By Step Guide Exists"] = "YES" if step_path and step_path.is_file() else "NO"
        out.append(r)
    return out
