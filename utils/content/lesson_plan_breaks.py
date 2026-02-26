#!/usr/bin/env python3
"""Generate and insert an <insertions> tag for lesson-plan page breaks.

This module reads the CSV at utils/cached-csv/Automatic Links.csv and builds
an ordered list of xmlids for all subsubsections and for subsections that
have no subsubsections. It writes a single
  <insertions pagebreaks="id1 id2 ..." />
between the markers in publication/publication-lesson-plans.ptx.

Unlike the standalone script, this module does not create a .bak file.
It exposes `generate_and_insert(csv_path, pub_path, dry_run)` for reuse by
the project's CLI.
"""

from __future__ import annotations
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
    subsections_with_subsubs = set()
    for r in rows:
        subsub = (r.get('Subsubsection') or '').strip()
        if subsub:
            key = (r.get('Chapter','').strip(), r.get('Section','').strip(), r.get('Subsection','').strip())
            subsections_with_subsubs.add(key)

    xmlids: List[str] = []
    seen = set()
    for r in rows:
        chapter = r.get('Chapter','').strip()
        section = r.get('Section','').strip()
        subsection = r.get('Subsection','').strip()
        subsub = (r.get('Subsubsection') or '').strip()
        ptx_path = (r.get('PTX Path') or '').strip()

        if subsub:
            xid = basename_xmlid(ptx_path) or subsub
        else:
            key = (chapter, section, subsection)
            if key in subsections_with_subsubs:
                continue
            xid = basename_xmlid(ptx_path) or ('subsec-' + subsection.replace(' ', '-').lower())

        if not xid or xid in seen:
            continue
        seen.add(xid)
        xmlids.append(xid)

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


def generate_and_insert(csv_path: str, pub_path: str, dry_run: bool = False) -> str:
    rows = read_rows(csv_path)
    xmlids = build_xmlids(rows)
    tag = make_insertions_tag(xmlids)
    if dry_run:
        return tag
    replace_in_publication(pub_path, tag)
    return tag


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Insert lesson-plan pagebreaks into publication file')
    parser.add_argument('--csv', default=os.path.join('utils', 'cached-csv', 'Automatic Links.csv'))
    parser.add_argument('--pub', default=os.path.join('publication', 'publication-lesson-plans.ptx'))
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    out = generate_and_insert(args.csv, args.pub, dry_run=args.dry_run)
    if args.dry_run:
        print(out)
    else:
        print('Wrote insertions to', args.pub)


if __name__ == '__main__':
    main()
