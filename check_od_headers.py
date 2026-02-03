import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os

CREDENTIALS_FILE = 'data/credentials.json'
SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'

def check_headers():
    if not os.path.exists(CREDENTIALS_FILE):
        print("Credentials file not found")
        return

    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
    client = gspread.authorize(creds)
    spreadsheet = client.open_by_key(SHEET_ID)
    
    try:
        od_ws = spreadsheet.worksheet("OD_List")
        headers = od_ws.row_values(1)
        print("Headers found in OD_List:", headers)
        
        records = od_ws.get_all_records()
        if records:
            print("First record keys:", list(records[0].keys()))
        else:
            print("No records found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_headers()
