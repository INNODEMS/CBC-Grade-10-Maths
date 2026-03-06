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
from googleapiclient.http import MediaIoBaseDownload
import io
import shutil

from .helpers import google, csvtools
from .audits import reports, audit_questions
from .content import syllabus_tables, add_labels
from .content import objectives, resources, namespace

# path to the automatic links CSV; use cached location
AUTOMATIC_LINKS_PATH = csvtools.cached_file("Automatic Links.csv")
# path to the learning outcomes CSV (always cached)
LEARNING_OUTCOMES_PATH = csvtools.cached_file("Learning Outcomes.csv")


@google.retry_on_auth_failure

def cmd_pull_plans(args: argparse.Namespace) -> None:
    print("pull-plans: starting")
    ids = google.load_ids_config()
    folder_id = ids.get("lesson_plans_folder_id")
    if not folder_id:
        print(f"lesson_plans_folder_id not found in {google.CONFIG_PATH}")
        return
    service = google.get_drive_service()
    
    def sanitize_filename(name: str) -> str:
        cleaned = name.rstrip().lower()
        import re
        cleaned = re.sub(r"[,';:]", "", cleaned)
        cleaned = re.sub(r"\s+", "-", cleaned)
        return cleaned

    def download_folder(folder_id: str, local_path: Path, only_missing: bool, fileType: str) -> None:
        if fileType == ".pdf":
            mimeType = 'application/pdf'
        elif fileType == ".md":
            mimeType = 'text/markdown'
        else:
            raise ValueError(f"Unsupported file type: {fileType}")
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
                download_folder(item['id'], path, only_missing, fileType)
            elif item['mimeType'] == 'application/vnd.google-apps.document':
                downloaded_path = path.with_suffix(fileType)
                if only_missing and downloaded_path.exists():
                    print(f"Skipping (already exists): {downloaded_path}")
                    continue
                request = service.files().export_media(fileId=item['id'], mimeType=mimeType)
                fh = io.FileIO(str(downloaded_path), 'wb')
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                print(f"Downloaded: {downloaded_path.name}")

    dest = Path(getattr(args, 'dest', "assets/lesson_plans"))
    clean = getattr(args, 'clean', False)
    if clean and dest.exists():
        print(f"pull-plans: cleaning {dest}")
        shutil.rmtree(dest)
    download_folder(folder_id, dest, only_missing=getattr(args, 'new', False), fileType=getattr(args, 'file_type', '.pdf'))
    print("pull-plans: done")


def cmd_validate_paths(args: argparse.Namespace) -> None:
    print("validate-paths: starting")
    base_dir = getattr(args, 'base_dir', None)
    base = Path(base_dir) if base_dir else Path(".")

    if getattr(args, 'cached', False):
        print("validate-paths: reading cached CSV")
        rows = csvtools.read_links_csv()
    else:
        print("validate-paths: fetching from sheet")
        rows = reports.fetch_links_from_sheet()
    validated = reports.validate_paths(rows, base)
    # write back to cache (the default location in utils/cached-csv)
    csvtools.write_links_csv(validated)
    print(f"validate-paths: processed {len(rows)} rows")
    if getattr(args, 'no_write', False):
        print("validate-paths: skipped sheet upload")
    else:
        reports.write_validated_to_sheet(validated)
        print("validate-paths: uploaded results to sheet")
    print("validate-paths: done")


def cmd_add_objectives(_: argparse.Namespace) -> None:
    # read csv, compute numbering, iterate
    df = pd.read_csv(AUTOMATIC_LINKS_PATH, encoding='utf-8', na_filter=False)
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



# this helper builds the parser so tests can exercise argument parsing without
# triggering any of the command actions.
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Utility commands for the project")
    sub = parser.add_subparsers(dest='command')

    # parent parsers expose flags that are shared with the 'all' command.
    pull_parent = argparse.ArgumentParser(add_help=False)
    pull_parent.add_argument(
        '--new', action='store_true', help='only download plans that are not already present'
    )
    pull_parent.add_argument(
        '--clean', action='store_true', help='remove existing lesson plans before downloading'
    )

    validate_parent = argparse.ArgumentParser(add_help=False)
    validate_parent.add_argument('--base-dir', help='root of repo (defaults to current working directory)')
    validate_parent.add_argument(
        '--cached', action='store_true', help='use locally cached Automatic Links.csv instead of fetching from sheet'
    )
    # by default we upload results back to the sheet; use --no-write-sheet to
    # suppress this behaviour
    validate_parent.add_argument(
        '--no-write-sheet', action='store_true', dest='no_write',
        help='do not upload validation results back to a sheet (default is to write)'
    )

    pull_parser = sub.add_parser('pull-plans', parents=[pull_parent],
                                help='download lesson plans from Drive')
    pull_parser.add_argument(
        '--dest', default='assets/lesson_plans',
        help='destination directory for downloaded lesson plans (default: assets/lesson_plans)'
    )
    pull_parser.add_argument(
        '--file-type', default='.pdf', choices=['.pdf', '.md'], help='file type to download (default: .pdf)'
    )
    vparser = sub.add_parser('validate-paths', parents=[validate_parent],
                             help='verify and annotate CSV rows with file existence')

    sub.add_parser('add-objectives', help='insert objectives blocks into PTX files')
    sub.add_parser('add-resources', help='insert/upgrade resource boxes for lesson plans')
    sub.add_parser('audit-pdfs', help='report lesson-plan PDFs not referenced by any source file')
    sub.add_parser('namespace', help='add xmlns:xi attribute to subsection/subsubsection tags')
    sub.add_parser('generate-syllabus', help='create syllabus-alignment.ptx from CSV data')
    sub.add_parser('generate-lo', help='create lo-coverage-table.ptx from CSV and outcome data')
    sub.add_parser('syllabus-tables', help='generate both syllabus and LO coverage tables')

    # bring the standalone helpers into the official CLI
    sub.add_parser('audit-questions', help='run the STACK/image/pdf audit routines')
    addlabels_parser = sub.add_parser('add-labels', help='add xml:id labels to PTX elements')
    addlabels_parser.add_argument(
        "--search-dir", dest="search_dir", default="source",
        help="Directory or file to process (defaults to ./source).",
    )

    sub.add_parser('all', parents=[pull_parent, validate_parent],
                    help='execute the typical workflow in order')
    return parser


def main(argv=None):
    parser = build_parser()

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
    # elif args.command == 'insert-plan-breaks':
    #     # delegate to the content module
    #     csv = 'utils/cached-csv/Automatic Links.csv'
    #     pub = 'publication/publication-lesson-plans.ptx'
    #     try:
    #         lesson_plan_breaks.generate_and_insert(csv, pub, dry_run=False)
    #         print('insert-plan-breaks: done')
    #     except Exception as exc:
    #         print('insert-plan-breaks: failed:', exc)
    #     # optionally run the PDF splitter on the generated publication
    #     if getattr(args, 'split', False):
    #         try:
    #             split_plans.split_pdf_by_leaves('output/plans/main.pdf', 'output/plans')
    #             print('insert-plan-breaks: PDF split complete')
    #         except Exception as exc:
    #             print('insert-plan-breaks: PDF split failed:', exc)
    elif args.command == 'audit-questions':
        # run the helper script logic
        audit_questions.run_audit()
    elif args.command == 'add-labels':
        # delegate to the module; it handles printing itself
        add_labels.main(search_dir=getattr(args, 'search_dir', None))
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
        # run the audit/questions step here too
        audit_questions.run_audit()
    else:
        parser.error(f"unknown command {args.command}")


if __name__ == '__main__':
    main()
