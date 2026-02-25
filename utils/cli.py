"""Command‑line interface tying together the various utilities.

Usage examples:

    python -m utils.cli pull-plans
    python -m utils.cli validate-paths
    python -m utils.cli add-objectives
    python -m utils.cli all

The commands mostly mirror the behaviour of the original standalone helpers.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import sys
import csv
import pandas as pd

from . import google, csvtools, ptx, reports
from .content import syllabus_tables
from .content import objectives, resources, namespace

# path to the automatic links CSV; use cached location
AUTOMATIC_LINKS_PATH = csvtools.cached_file("Automatic Links.csv")
# path to the learning outcomes CSV (always cached)
LEARNING_OUTCOMES_PATH = csvtools.cached_file("Learning Outcomes.csv")


def cmd_pull_plans(args: argparse.Namespace) -> None:
    print("pull-plans: starting")
    ids = google.load_ids_config()
    folder_id = ids.get("lesson_plans_folder_id")
    if not folder_id:
        print(f"lesson_plans_folder_id not found in {google.CONFIG_PATH}")
        return
    service = google.get_drive_service()
    # simple replication of old script's behaviour
    from googleapiclient.http import MediaIoBaseDownload
    import io
    import shutil
    
    def sanitize_filename(name: str) -> str:
        cleaned = name.rstrip().lower()
        import re
        cleaned = re.sub(r"[,';:]", "", cleaned)
        cleaned = re.sub(r"\s+", "-", cleaned)
        return cleaned

    def download_folder(folder_id: str, local_path: Path, only_missing: bool) -> None:
        if not local_path.exists():
            local_path.mkdir(parents=True)
        results = service.files().list(
            q=f"'{folder_id}' in parents and trashed = false",
            fields="files(id, name, mimeType)",
        ).execute()
        items = results.get('files', [])
        for item in items:
            cleaned = sanitize_filename(item['name'])
            path = local_path / cleaned
            if item['mimeType'] == 'application/vnd.google-apps.folder':
                download_folder(item['id'], path, only_missing)
            elif item['mimeType'] == 'application/vnd.google-apps.document':
                pdf_path = path.with_suffix('.pdf')
                if only_missing and pdf_path.exists():
                    print(f"Skipping (already exists): {pdf_path}")
                    continue
                request = service.files().export_media(fileId=item['id'], mimeType='application/pdf')
                fh = io.FileIO(str(pdf_path), 'wb')
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                print(f"Downloaded: {pdf_path.name}")

    dest = Path("assets/lesson_plans")
    if args.clean and dest.exists():
        print(f"pull-plans: cleaning {dest}")
        shutil.rmtree(dest)
    download_folder(folder_id, dest, only_missing=args.new)
    print("pull-plans: done")


def cmd_validate_paths(args: argparse.Namespace) -> None:
    print("validate-paths: starting")
    base = Path(args.base_dir) if args.base_dir else Path(".")
    if args.cached:
        print("validate-paths: reading cached CSV")
        rows = csvtools.read_links_csv()
    else:
        print("validate-paths: fetching from sheet")
        rows = reports.fetch_links_from_sheet()
    validated = reports.validate_paths(rows, base)
    # write back to cache (the default location in utils/cached-csv)
    csvtools.write_links_csv(validated)
    print(f"validate-paths: processed {len(rows)} rows")
    if args.no_write:
        print("validate-paths: skipped sheet upload")
    else:
        reports.write_validated_to_sheet(validated)
        print("validate-paths: uploaded results to sheet")
    print("validate-paths: done")


def cmd_add_objectives(_: argparse.Namespace) -> None:
    # read csv, compute numbering, iterate
    df = pd.read_csv(AUTOMATIC_LINKS_PATH, encoding='utf-8')
    numbering = objectives.build_numbering(df)
    chap_map = numbering['chapter_num']
    sec_map = numbering['section_num']
    added = skipped = 0
    for row in df.to_dict(orient='records'):
        if row.get('PTX Exists') != 'YES':
            continue
        ptx_rel = row.get('PTX Path','').strip()
        chapter = (row.get('Chapter') or '').strip()
        section = (row.get('Section') or '').strip()
        if not chapter or not section:
            continue
        los = [row.get(f'LO {i}','').strip() for i in range(1,5) if row.get(f'LO {i}')]
        los = [lo for lo in los if lo]
        if not los:
            continue
        ch_num = chap_map.get(chapter,'?.0')
        sec_num = sec_map.get((chapter, section),'?.?')
        path = Path('source') / ptx_rel
        text = path.read_text(encoding='utf-8')
        new = objectives.insert_objectives(text, chapter, section, ch_num, sec_num, los)
        if new is not None:
            path.write_text(new, encoding='utf-8')
            added += 1
        else:
            skipped += 1
    print(f"objectives added: {added}, skipped-existing: {skipped}")
    print("add-objectives: done")


def cmd_add_resources(_: argparse.Namespace) -> None:
    print("add-resources: starting")
    import pandas as pd
    df = pd.read_csv(AUTOMATIC_LINKS_PATH, encoding='utf-8')
    added=removed=upgraded=onlylesson=0
    base=Path('.')
    for row in df.to_dict(orient='records'):
        if row.get('PTX Exists')!='YES' or row.get('Lesson Plan Exists')!='YES':
            continue
        ptx_rel=row.get('PTX Path','').strip()
        lesson_plan=f"lesson_plans/{row.get('Lesson Plan Path','').strip()}"
        step=None
        if row.get('Step By Step Guide Exists')=='YES':
            step=f"lesson_plans/{row.get('Step By Step Guide Path','').strip()}"
        path=Path('source')/ptx_rel
        content_text=path.read_text(encoding='utf-8')
        orig=content_text
        content_text, r=resources.remove_old_resource_boxes(content_text)
        removed+=r
        content_text, u=resources.upgrade_lesson_only_resource_boxes(content_text, lesson_plan, step)
        upgraded+=u
        new=resources.insert_axiom_if_missing(content_text, lesson_plan, step)
        if new is not None:
            content_text=new
            added+=1
            if step is None:
                onlylesson+=1
        if content_text!=orig:
            path.write_text(content_text, encoding='utf-8')
    print(f"resources added: {added}, only lesson: {onlylesson}, removed old: {removed}, upgraded: {upgraded}")
    print("add-resources: done")


def cmd_audit_pdfs(_: argparse.Namespace) -> None:
    print("audit-pdfs: starting")
    base = Path('.')
    unref = reports.find_unreferenced_pdfs(base)
    if unref:
        print('Unreferenced PDFs:')
        for p in unref:
            print(p)
    else:
        print('All PDFs are referenced.')
    print("audit-pdfs: done")


def cmd_namespace(_: argparse.Namespace) -> None:
    print("namespace: starting")
    base = Path('.')
    count=0
    for path in base.joinpath('source').rglob('*.ptx'):
        changed = namespace.process_file(path)
        count += changed
    print(f"Updated {count} tags.")
    print("namespace: done")


def cmd_generate_syllabus(_: argparse.Namespace) -> None:
    print("generate-syllabus: starting")
    rows = csvtools.read_links_csv()
    data = syllabus_tables.parse_links(rows, Path('source'))
    syllabus_tables.generate_syllabus_ptx(data, Path('source/syllabus-alignment.ptx'))
    print("generate-syllabus: done")


def cmd_generate_lo(_: argparse.Namespace) -> None:
    print("generate-lo: starting")
    lo_rows = []
    lo_path = LEARNING_OUTCOMES_PATH
    if not lo_path.is_file():
        print(f"generate-lo: no learning outcomes CSV found at {lo_path}")
    else:
        print(f"generate-lo: reading outcomes from {lo_path}")
        with open(lo_path, encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            lo_rows = [row for row in reader]
    print(f"generate-lo: read {len(lo_rows)} learning outcomes rows")
    rows = csvtools.read_links_csv()
    fmv = syllabus_tables.parse_file_matching_validated(rows)
    lo_data = syllabus_tables.parse_learning_outcomes(lo_rows)
    print(f"generate-lo: generated lo_data with {sum(len(v) for d in lo_data.values() for v in d.values())} entries")
    syllabus_tables.generate_lo_coverage_ptx(lo_data, fmv, Path('source/lo-coverage-table.ptx'))
    print("generate-lo: done")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Utility commands for the project")
    sub = parser.add_subparsers(dest='command')

    pull_parser = sub.add_parser('pull-plans', help='download lesson plans from Drive')
    pull_parser.add_argument(
        '--new', action='store_true', help='only download plans that are not already present'
    )
    pull_parser.add_argument(
        '--clean', action='store_true', help='remove existing lesson plans before downloading'
    )
    vparser = sub.add_parser('validate-paths', help='verify and annotate CSV rows with file existence')
    vparser.add_argument('--base-dir', help='root of repo (defaults to current working directory)')
    vparser.add_argument(
        '--cached', action='store_true', help='use locally cached Automatic Links.csv instead of fetching from sheet'
    )
    # by default we upload results back to the sheet; use --no-write-sheet to
    # suppress this behaviour
    vparser.add_argument(
        '--no-write-sheet', action='store_true', dest='no_write',
        help='do not upload validation results back to a sheet (default is to write)'
    )
    sub.add_parser('add-objectives', help='insert objectives blocks into PTX files')
    sub.add_parser('add-resources', help='insert/upgrade resource boxes for lesson plans')
    sub.add_parser('audit-pdfs', help='report lesson-plan PDFs not referenced by any source file')
    sub.add_parser('namespace', help='add xmlns:xi attribute to subsection/subsubsection tags')
    sub.add_parser('generate-syllabus', help='create syllabus-alignment.ptx from CSV data')
    sub.add_parser('generate-lo', help='create lo-coverage-table.ptx from CSV and outcome data')
    sub.add_parser('syllabus-tables', help='generate both syllabus and LO coverage tables')
    sub.add_parser('all', help='execute the typical workflow in order')

    args = parser.parse_args(argv)
    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == 'pull-plans':
        cmd_pull_plans(args)
    elif args.command == 'validate-paths':
        cmd_validate_paths(args)
    elif args.command == 'add-objectives':
        cmd_add_objectives(args)
    elif args.command == 'add-resources':
        cmd_add_resources(args)
    elif args.command == 'audit-pdfs':
        cmd_audit_pdfs(args)
    elif args.command == 'namespace':
        cmd_namespace(args)
    elif args.command == 'generate-syllabus':
        cmd_generate_syllabus(args)
    elif args.command == 'generate-lo':
        cmd_generate_lo(args)
    elif args.command == 'syllabus-tables':
        # convenience wrapper that runs both generators
        cmd_generate_syllabus(args)
        cmd_generate_lo(args)
    elif args.command == 'all':
        # chain typical workflow
        cmd_pull_plans(args)
        cmd_validate_paths(args)
        cmd_add_objectives(args)
        cmd_add_resources(args)
        cmd_audit_pdfs(args)
        cmd_namespace(args)
        cmd_generate_syllabus(args)
        cmd_generate_lo(args)
    else:
        parser.error(f"unknown command {args.command}")


if __name__ == '__main__':
    main()
