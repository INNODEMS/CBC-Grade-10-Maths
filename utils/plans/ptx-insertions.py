#!/usr/bin/env python3
"""Generate and insert an <insertions> tag for lesson-plan page breaks.

This module reads the CSV at utils/cached-csv/Automatic Links.csv and builds
an ordered list of xmlids for all subsubsections and for subsections that
have no subsubsections. It writes a single
  <insertions pagebreaks="id1 id2 ..." />
between the markers in publication/publication-lesson-plans.ptx.
"""
import argparse
import csv
import os
from typing import List


def read_rows(csv_path: str):
    with open(csv_path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def basename_xmlid(ptx_path: str | None) -> str | None:
    if not ptx_path:
        return None
    name = os.path.basename(ptx_path)
    if name.lower().endswith('.ptx'):
        name = name[:-4]
    return name


def build_xmlids(rows: List[dict]) -> List[str]:
    """Return a list of xml:id strings representing every section, subsection,
    and subsubsection seen in the CSV.

    The CSV doesn't contain explicit rows for sections, so we synthesise the
    section-level xmlid from the ``Section Filecase`` (or falling back to the
    name if the filecase is missing).  Subsections and subsubsections are
    handled similarly, but the CSV rows themselves correspond naturally to
    those levels.  The output list preserves the order in which the sections
    and their children appear in the CSV and filters out duplicates.
    """
    xmlids: List[str] = []
    seen = set()

    def make_id(prefix: str, filecase: str | None, name: str | None,
                ptx_path: str | None) -> str | None:
        # prefer explicit filecase from CSV, otherwise fall back to the path
        # basename or the name text
        if filecase:
            return f"{prefix}{filecase}"
        if ptx_path:
            base = basename_xmlid(ptx_path)
            if base:
                return base
        if name:
            cleaned = name.strip().lower().replace(' ', '-')
            if cleaned:
                return f"{prefix}{cleaned}"
        return None

    for r in rows:
        section_fc = r.get('Section Filecase','').strip()
        subsection_fc = r.get('Subsection Filecase','').strip()
        subsub_fc = r.get('Subsubsection Filecase','').strip()
        section_name = r.get('Section','').strip()
        subsection_name = r.get('Subsection','').strip()
        subsub_name = r.get('Subsubsection','').strip()
        ptx_path = (r.get('PTX Path') or '').strip()

        # section level
        sec_id = make_id('sec-', section_fc, section_name, ptx_path)
        if sec_id and sec_id not in seen:
            seen.add(sec_id)
            xmlids.append(sec_id)

        # subsection level
        subsec_id = make_id('subsec-', subsection_fc, subsection_name, ptx_path)
        if subsec_id and subsec_id not in seen:
            seen.add(subsec_id)
            xmlids.append(subsec_id)

        # subsubsection level
        subsub_id = make_id('subsubsec-', subsub_fc, subsub_name, ptx_path)
        if subsub_id and subsub_id not in seen:
            seen.add(subsub_id)
            xmlids.append(subsub_id)

    return xmlids


def make_insertions_tag(xmlids: List[str]) -> str:
    joined = ' '.join(xmlids)
    return f'<insertions pagebreaks="{joined}" />'


def replace_in_publication(pub_path: str, tag: str) -> None:
    start_marker = '<!-- LESSON_PLAN_INSERTIONS_START -->'
    end_marker = '<!-- LESSON_PLAN_INSERTIONS_END -->'

    with open(pub_path, 'r', encoding='utf-8') as f:
        text = f.read()

    if start_marker not in text or end_marker not in text:
        raise RuntimeError('Markers not found in publication file; please add them before running this script.')

    before, rest = text.split(start_marker, 1)
    _, after = rest.split(end_marker, 1)

    new_block = f"{start_marker}\n    {tag}\n    {end_marker}"
    new_text = before + new_block + after

    with open(pub_path, 'w', encoding='utf-8') as f:
        f.write(new_text)


def generate_and_insert(csv_path: str, pub_path: str) -> str:
    rows = read_rows(csv_path)
    xmlids = build_xmlids(rows)
    tag = make_insertions_tag(xmlids)
    replace_in_publication(pub_path, tag)
    return tag


def main():
    parser = argparse.ArgumentParser(description='Insert lesson-plan pagebreaks into publication file')
    parser.add_argument('--csv', default=os.path.join('utils', 'cached-csv', 'Automatic Links.csv'))
    parser.add_argument('--pub', default=os.path.join('publication', 'publication-lesson-plans.ptx'))
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    generate_and_insert(args.csv, args.pub)
    print('Wrote insertions to', args.pub)


if __name__ == '__main__':
    main()
