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

from . import google, csvtools, ptx, reports, tables
from .content import objectives, resources, namespace


def cmd_pull_plans(args: argparse.Namespace) -> None:
    ids = google.load_ids_config()
    folder_id = ids.get("lesson_plans_folder_id")
    if not folder_id:
        print(f"lesson_plans_folder_id not found in {google.CONFIG_PATH}")
        return
    service = google.get_drive_service()
    # simple replication of old script's behaviour
    from googleapiclient.http import MediaIoBaseDownload
    import io
    
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

    download_folder(folder_id, Path("../assets/lesson_plans"), only_missing=args.only_missing)


def cmd_validate_paths(args: argparse.Namespace) -> None:
    base = Path(args.base_dir) if args.base_dir else Path(".")
    if args.from_sheet:
        rows = reports.fetch_links_from_sheet()
    else:
        rows = csvtools.read_links_csv()
    validated = reports.validate_paths(rows, base)
    # write back to cache and also mirror to current working directory
    csvtools.write_links_csv(validated)
    # optionally keep a copy in cwd for convenience
    csvtools.write_links_csv(validated, Path("Automatic Links.csv"))
    if args.write_sheet:
        reports.write_validated_to_sheet(validated)


def cmd_add_objectives(_: argparse.Namespace) -> None:
    # read csv, compute numbering, iterate
    import pandas as pd
    df = pd.read_csv('Automatic Links.csv', encoding='utf-8')
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


def cmd_add_resources(_: argparse.Namespace) -> None:
    import pandas as pd
    df = pd.read_csv('Automatic Links.csv', encoding='utf-8')
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


def cmd_audit_pdfs(_: argparse.Namespace) -> None:
    base = Path('.')
    unref = reports.find_unreferenced_pdfs(base)
    if unref:
        print('Unreferenced PDFs:')
        for p in unref:
            print(p)
    else:
        print('All PDFs are referenced.')


def cmd_namespace(_: argparse.Namespace) -> None:
    base = Path('.')
    count=0
    for path in base.joinpath('source').rglob('*.ptx'):
        changed = namespace.process_file(path)
        count += changed
    print(f"Updated {count} tags.")


def cmd_generate_syllabus(_: argparse.Namespace) -> None:
    rows = csvtools.read_links_csv()
    data = tables.parse_links(rows, Path('source'))
    tables.generate_syllabus_ptx(data, Path('source/syllabus-alignment.ptx'))


def cmd_generate_lo(_: argparse.Namespace) -> None:
    lo_rows = []
    with open('Learning Outcomes.csv', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        lo_rows = [row for row in reader]
    rows = csvtools.read_links_csv()
    fmv = tables.parse_file_matching_validated(rows)
    lo_data = tables.parse_learning_outcomes(lo_rows)
    tables.generate_lo_coverage_ptx(lo_data, fmv, Path('source/lo-coverage-table.ptx'))


def main(argv=None):
    parser = argparse.ArgumentParser(description="Utility commands for the project")
    sub = parser.add_subparsers(dest='command')

    sub.add_parser('pull-plans', help='download lesson plans from Drive').add_argument(
        '--only-missing', action='store_true', help='skip files that already exist locally'
    )
    vparser = sub.add_parser('validate-paths', help='verify and annotate CSV rows with file existence')
    vparser.add_argument('--base-dir', help='root of repo (defaults to current working directory)')
    vparser.add_argument(
        '--from-sheet', action='store_true', help='fetch data from Google Sheets instead of local CSV'
    )
    vparser.add_argument(
        '--write-sheet', action='store_true', help='upload validation results back to a sheet'
    )
    sub.add_parser('add-objectives', help='insert objectives blocks into PTX files')
    sub.add_parser('add-resources', help='insert/upgrade resource boxes for lesson plans')
    sub.add_parser('audit-pdfs', help='report lesson-plan PDFs not referenced by any source file')
    sub.add_parser('namespace', help='add xmlns:xi attribute to subsection/subsubsection tags')
    sub.add_parser('generate-syllabus', help='create syllabus-alignment.ptx from CSV data')
    sub.add_parser('generate-lo', help='create lo-coverage-table.ptx from CSV and outcome data')
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
