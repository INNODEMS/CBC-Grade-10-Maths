
import os
import io
import re
import json
import argparse
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google_auth_oauthlib.flow import InstalledAppFlow

# pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib

# Setup the Drive API
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'google_ids.json')
with open(CONFIG_PATH, encoding='utf-8') as cfg_file:
    _ids_config = json.load(cfg_file)

LESSON_PLANS_FOLDER_ID = _ids_config['lesson_plans_folder_id']

flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
creds = flow.run_local_server(port=0)
service = build('drive', 'v3', credentials=creds)

def sanitize_filename(name):
    cleaned = name.rstrip().lower()
    cleaned = re.sub(r"[';:]", "", cleaned)
    cleaned = re.sub(r"\s+", "-", cleaned)
    return cleaned

def download_folder(folder_id, local_path, only_missing=False):
    if not os.path.exists(local_path):
        os.makedirs(local_path)

    # List files and subfolders
    results = service.files().list(
        q=f"'{folder_id}' in parents and trashed = false",
        fields="files(id, name, mimeType)").execute()
    items = results.get('files', [])

    for item in items:
        cleaned_name = sanitize_filename(item['name'])
        item_path = os.path.join(local_path, cleaned_name)

        if item['mimeType'] == 'application/vnd.google-apps.folder':
            # Recursive call for subfolders
            download_folder(item['id'], item_path, only_missing=only_missing)

        elif item['mimeType'] == 'application/vnd.google-apps.document':
            pdf_path = f"{item_path}.pdf"
            if only_missing and os.path.exists(pdf_path):
                print(f"Skipping (already exists): {pdf_path}")
                continue
            # Export Google Doc as PDF
            request = service.files().export_media(fileId=item['id'], mimeType='application/pdf')
            fh = io.FileIO(pdf_path, 'wb')
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
            print(f"Downloaded: {cleaned_name}.pdf")

# Start the process
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download lesson plans from Google Drive.")
    parser.add_argument('--only-missing', action='store_true', help='Only download PDFs that are not already present')
    args = parser.parse_args()
    download_folder(LESSON_PLANS_FOLDER_ID, '../assets/lesson_plans', only_missing=args.only_missing)