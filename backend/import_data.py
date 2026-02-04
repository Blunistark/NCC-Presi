import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from datetime import datetime
import os

# Setup DB
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Paths
DATA_DIR = "data"
CREDENTIALS_FILE = os.path.join(DATA_DIR, "credentials.json")
EXCEL_FILE = "../Sheets data/NCC Data.xlsx" # Relative to backend dir if running from there, or ABS?
# Docker path: /app/Sheets data/NCC Data.xlsx? No, simpler to run this locally or mount.
# User said "d:\NCC\NCC-Presi\Sheets data\NCC Data.xlsx"
# If running inside docker, I need to mount "Sheets data" folder or copy file.
# For now, I'll assume we run this from HOST or copy it to backend/data.
# Let's assume standard path for now, handle docker mounting later.
# Actually, I'll use the absolute path provided by user if running locally?
# Or clearer: I will read from "data/NCC Data.xlsx" and ask user to copy it there.

def import_cadets():
    print("--- Importing Cadets from Excel ---")
    try:
        # Load Excel (multiple sheets)
        xls = pd.ExcelFile("data/NCC_Data.xlsx") 
        # I will ask user to place it in backend/data/NCC_Data.xlsx to be safe inside Docker
        
        for sheet_name in ['3rd Year', '2nd Year', '1st Year']:
            if sheet_name not in xls.sheet_names:
                print(f"Skipping {sheet_name} (Not found)")
                continue
                
            df = pd.read_excel(xls, sheet_name=sheet_name)
            # Normalize Headers
            # Expected: Enrollment ID, Name, RANK, DEPT, PU ROLL NUMBER, etc.
            
            count = 0
            for index, row in df.iterrows():
                # Map columns safely
                def get_val(col):
                    val = row.get(col)
                    return str(val).strip() if pd.notna(val) else ""

                eid = get_val("Enrollment ID")
                if not eid: continue

                cadet = models.Cadet(
                    enrollment_id=eid,
                    name=get_val("Name"),
                    rank=get_val("RANK"),
                    year=sheet_name,
                    department=get_val("DEPT"),
                    pu_roll_number=get_val("PU ROLL NUMBER"),
                    sd_sw=get_val("SD/SW"),
                    mobile_number=get_val("Mobile number"),
                    email=get_val("Email id"),
                    dob=get_val("Date of birth"),
                    blood_group=get_val("Blood Group")
                )
                
                # Upsert
                existing = db.query(models.Cadet).filter_by(enrollment_id=eid).first()
                if not existing:
                    db.add(cadet)
                    count += 1
            
            db.commit()
            print(f"Imported {count} cadets from {sheet_name}")

    except Exception as e:
        print(f"Error importing cadets: {e}")

def import_sheets_data():
    print("--- Importing Events & Logs from Google Sheets ---")
    if not os.path.exists(CREDENTIALS_FILE):
        print("No credentials.json found, skipping Sheets sync.")
        return

    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key('11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE')
        
        # 1. Events
        try:
            ws = spreadsheet.worksheet("Event_Master")
            records = ws.get_all_records()
            count = 0
            for row in records:
                eid = row.get("Event ID")
                if not eid: continue
                
                # Check exist
                if db.query(models.Event).filter_by(event_id=eid).first():
                    continue

                # Parse dates
                date_str = str(row.get("Date"))
                time_str = str(row.get("Time"))
                try:
                    d = datetime.strptime(date_str, "%Y-%m-%d").date()
                except:
                    d = datetime.now().date() # Fallback
                try:
                    t = datetime.strptime(time_str, "%H:%M:%S").time() # GSheets often sends seconds
                    # or handle %H:%M
                except:
                     try:
                        t = datetime.strptime(time_str, "%H:%M").time()
                     except:
                        t = datetime.now().time()

                event = models.Event(
                    event_id=eid,
                    title=row.get("Title"),
                    event_type=row.get("Type"),
                    date=d,
                    time=t,
                    status=row.get("Status", "Ended")
                )
                db.add(event)
                count += 1
            db.commit()
            print(f"Imported {count} events.")
        except Exception as e:
            print(f"Events import error: {e}")

        # 2. Logs
        try:
            ws = spreadsheet.worksheet("Attendance_Logs")
            records = ws.get_all_records()
            count = 0
            for row in records:
                eid = row.get("Event ID")
                enr = row.get("Enrollment ID")
                if not eid or not enr: continue
                
                # Check exist
                if db.query(models.AttendanceLog).filter_by(event_id=eid, enrollment_id=enr).first():
                    continue
                    
                log = models.AttendanceLog(
                    event_id=eid,
                    enrollment_id=enr,
                    status=row.get("Status"),
                    timestamp=datetime.now() # Approximate if timestamp parsing fails
                )
                # Try parse timestamp
                ts_str = str(row.get("Timestamp"))
                try:
                    log.timestamp = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
                except:
                    pass

                db.add(log)
                count += 1
            db.commit()
            print(f"Imported {count} logs.")

        except Exception as e:
            print(f"Logs import error: {e}")

    except Exception as e:
        print(f"Sheets sync error: {e}")

if __name__ == "__main__":
    import_cadets()
    import_sheets_data()
    print("Migration Complete.")
