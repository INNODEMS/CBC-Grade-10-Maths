import os
import io
import re
import json
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

def download_folder(folder_id, local_path):
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
            download_folder(item['id'], item_path)
            
        elif item['mimeType'] == 'application/vnd.google-apps.document':
            # Export Google Doc as PDF
            request = service.files().export_media(fileId=item['id'], mimeType='application/pdf')
            fh = io.FileIO(f"{item_path}.pdf", 'wb')
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
            print(f"Downloaded: {cleaned_name}.pdf")

# Start the process
download_folder(LESSON_PLANS_FOLDER_ID, '../assets/lesson_plans')