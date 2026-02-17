""" Check that the paths in the File Matching sheet of the spreadsheet point to actual files in the source and assets folders (i.e. that the part of the book exists and the lesson plans and step by step guides were downloaded correctly) """

import csv
import json
import os
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow


OUTPUT_CSV = 'File Matching Validated.csv'

PTX_COL = 'PTX Path'
LP_COL = 'Lesson Plan Path'
STEP_COL = 'Step By Step Guide Path'


# pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib

# Setup the Sheets API (read/write so we can add a sheet)
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'google_ids.json')
with open(CONFIG_PATH, encoding='utf-8') as cfg_file:
    _ids_config = json.load(cfg_file)

SPREADSHEET_ID = _ids_config['file_matching_spreadsheet_id']
RANGE_NAME = "'File Matching'"  # Sheet/tab name

flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
creds = flow.run_local_server(port=0)
service = build('sheets', 'v4', credentials=creds)


def get_file_matching_rows():
    sheet = service.spreadsheets()
    result = sheet.values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=RANGE_NAME
    ).execute()
    values = result.get('values', [])
    return values


def validate_paths(base_dir: str = '..') -> None:
    values = get_file_matching_rows()

    if not values:
        print("No data found in File Matching sheet")
        return

    headers = values[0]
    rows_data = values[1:]

    rows = [dict(zip(headers, row)) for row in rows_data]

    total = len(rows)
    syllabus_total = sum(1 for row in rows if row['In Syllabus'].strip().upper() == 'YES')
    ptx_ok = lp_ok = step_ok = 0

    output_path = os.path.join(OUTPUT_CSV)

    # Ensure we always start from a clean file
    if os.path.exists(output_path):
        os.remove(output_path)
    sheet_rows = []  # data to send back to Google Sheets

    with open(output_path, 'w', newline='', encoding='utf-8') as f_out:
        writer = csv.DictWriter(f_out, fieldnames=headers)
        writer.writeheader()

        for row in rows:
            ptx_rel = (row.get(PTX_COL) or '').strip()
            lp_rel = (row.get(LP_COL) or '').strip()
            step_rel = (row.get(STEP_COL) or '').strip()

            ptx_path = os.path.join(base_dir, 'source', ptx_rel) if ptx_rel else ''
            lp_path = os.path.join(base_dir, 'assets', 'lesson_plans', lp_rel) if lp_rel else ''
            step_path = os.path.join(base_dir, 'assets', 'lesson_plans', step_rel) if step_rel else ''

            ptx_exists = bool(ptx_path and os.path.isfile(ptx_path))
            lp_exists = bool(lp_path and os.path.isfile(lp_path))
            step_exists = bool(step_path and os.path.isfile(step_path))
            
            in_syllabus = row['In Syllabus'].strip().upper() == 'YES'
            
            ptx_ok += int(ptx_exists)
            row['PTX Exists'] = 'YES' if ptx_exists else 'NO'
                
            if not in_syllabus:
                row['Lesson Plan Exists'] = 'EXTENSION'
                row['Step By Step Guide Exists'] = 'EXTENSION'
            else:
                row['Lesson Plan Exists'] = 'YES' if lp_exists else 'NO'
                row['Step By Step Guide Exists'] = 'YES' if step_exists else 'NO'
                lp_ok += int(lp_exists)
                step_ok += int(step_exists)
                
            print(list(row.keys()))
                    
            writer.writerow(row)

            # Collect row for Sheets in the same column order
            sheet_rows.append([row.get(col, '') for col in headers])

    def pct(count: int, total=total) -> str:
        return f"{(count / total * 100):.1f}%" if total else 'N/A'

    print(f"PTX Exists: {ptx_ok}/{total} ({pct(ptx_ok)})")
    print(f"Lesson Plan Exists: {lp_ok}/{syllabus_total} ({pct(lp_ok, syllabus_total)})")
    print(f"Step By Step Exists: {step_ok}/{syllabus_total} ({pct(step_ok, syllabus_total)})")
    print(f"Total rows: {total}, In Syllabus: {syllabus_total}")
    print(f"Wrote validation results to {OUTPUT_CSV}")

    write_validated_to_sheet(headers, sheet_rows)


def write_validated_to_sheet(headers, rows, sheet_name: str = 'File Matching Validated') -> None:
    """Write validated data into a dedicated sheet, overwriting only that sheet."""
    sheet = service.spreadsheets()

    # Check existing sheet names
    metadata = sheet.get(spreadsheetId=SPREADSHEET_ID).execute()
    existing_titles = [s['properties']['title'] for s in metadata.get('sheets', [])]

    if sheet_name not in existing_titles:
        # Add new sheet if it doesn't exist yet
        body = {
            'requests': [
                {
                    'addSheet': {
                        'properties': {
                            'title': sheet_name
                        }
                    }
                }
            ]
        }
        sheet.batchUpdate(spreadsheetId=SPREADSHEET_ID, body=body).execute()

    # Clear existing contents of the target sheet (but only that sheet)
    sheet.values().clear(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{sheet_name}'!A:Z",
    ).execute()

    # Prepare values: header row + data rows
    values = [headers] + rows

    sheet.values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{sheet_name}'!A1",
        valueInputOption='RAW',
        body={'values': values},
    ).execute()

    print(f"Wrote validation results to sheet '{sheet_name}'")


if __name__ == '__main__':
    validate_paths()