import os
import io
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google_auth_oauthlib.flow import InstalledAppFlow

# pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib

# Setup the Drive API
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
creds = flow.run_local_server(port=0)
service = build('drive', 'v3', credentials=creds)

def download_folder(folder_id, local_path):
    if not os.path.exists(local_path):
        os.makedirs(local_path)

    # List files and subfolders
    results = service.files().list(
        q=f"'{folder_id}' in parents and trashed = false",
        fields="files(id, name, mimeType)").execute()
    items = results.get('files', [])

    for item in items:
        item_path = os.path.join(local_path, item['name'])
        
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
            print(f"Downloaded: {item['name']}.pdf")

# Start the process
download_folder('1MTb9yVfGdDhaAuRB3XZBFeP-u5fQU3FR', './assets/lesson_plans')