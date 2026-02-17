import csv
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow

# pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib

# Setup the Sheets API
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
SPREADSHEET_ID = '14-7SwFKHwpMllwl3pbQaYu_FUTGekDMu8DP6gZsEJ50'
RANGE_NAME = "'File Matching'"  # Sheet/tab name

flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
creds = flow.run_local_server(port=0)
service = build('sheets', 'v4', credentials=creds)

def save_file_matching_tab(output_path: str = 'file_matching.csv') -> None:
    sheet = service.spreadsheets()
    result = sheet.values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=RANGE_NAME
    ).execute()
    values = result.get('values', [])

    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(values)

    print(f"Saved {len(values)} rows to {output_path}")


if __name__ == '__main__':
    save_file_matching_tab()