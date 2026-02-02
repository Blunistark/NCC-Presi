from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import face_recognition
import pickle
import numpy as np
import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import shutil

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
DATA_DIR = "data"
ENCODINGS_FILE = os.path.join(DATA_DIR, "encodings.pickle")
CREDENTIALS_FILE = os.path.join(DATA_DIR, "credentials.json")

# Global variable to hold known faces
# Structure: {"encodings": [array], "names": ["Name1"], "reg_nos": ["123"]}
known_data = {"encodings": [], "names": [], "reg_nos": []}
# todays_attendance = set()

def load_encodings():
    global known_data
    if os.path.exists(ENCODINGS_FILE):
        print(f"Loading encodings from {ENCODINGS_FILE}...")
        try:
            with open(ENCODINGS_FILE, "rb") as f:
                data = pickle.load(f)
                if "reg_nos" not in data:
                    data["reg_nos"] = ["Unknown"] * len(data["names"])
                known_data = data
            print(f"Loaded {len(known_data['names'])} faces.")
        except Exception as e:
            print(f"Error loading encodings: {e}")
            known_data = {"encodings": [], "names": [], "reg_nos": []}
    else:
        print("No encodings file found. Starting with empty database.")
        known_data = {"encodings": [], "names": [], "reg_nos": []}

# Old load function removed


@app.on_event("startup")
async def startup_event():
    print("--- STARTUP: Beginning startup_event ---")
    global session_attendance_cache
    os.makedirs(DATA_DIR, exist_ok=True)
    
    print("--- STARTUP: Loading encodings ---")
    load_encodings()
    
    print("--- STARTUP: Loading todays attendance ---")
    try:
        load_todays_attendance()
        print("--- STARTUP: todays attendance loaded ---")
    except Exception as e:
        print(f"--- STARTUP ERROR: Failed to load attendance: {e} ---")
    
    print("--- STARTUP: Complete ---")

def load_todays_attendance():
    print("DEBUG: Inside load_todays_attendance")
    global session_attendance_cache
    if not os.path.exists(CREDENTIALS_FILE):
        print("DEBUG: Credentials file not found")
        return

    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        print("DEBUG: Authorizing GSpread...")
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        
        print("DEBUG: Opening Spreadsheet...")
        spreadsheet = client.open_by_key('11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE')
        
        print("DEBUG: Fetching Attendance_Logs...")
        logs_ws = spreadsheet.worksheet("Attendance_Logs")
        logs = logs_ws.get_all_records()
        
        print(f"DEBUG: Processing {len(logs)} logs...")
        for log in logs:
            eid = str(log.get("Event ID", "")).strip()
            enr = str(log.get("Enrollment ID", "")).strip()
            if eid and enr:
                session_attendance_cache.add((eid, enr))
                
        print(f"DEBUG: Cache size: {len(session_attendance_cache)}")

    except Exception as e:
        print(f"DEBUG: Error in load_todays_attendance: {e}")
        # Don't raise, just log



@app.get("/")
def read_root():
    return {"message": "Face Attendance API is running"}

@app.post("/register")
async def register_user(name: str = Form(...), regimental_number: str = Form(...), file: UploadFile = File(...)):
    global known_data
    
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        image = face_recognition.load_image_file(temp_filename)
        encodings = face_recognition.face_encodings(image)
        
        if not encodings:
            os.remove(temp_filename)
            raise HTTPException(status_code=400, detail="No face found in image")
            
        encoding = encodings[0]
        
        known_data["encodings"].append(encoding)
        known_data["names"].append(name)
        known_data["reg_nos"].append(regimental_number)
        
        with open(ENCODINGS_FILE, "wb") as f:
            pickle.dump(known_data, f)
            
        return {"message": f"Successfully registered {name} ({regimental_number})"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

    # ... (existing imports)
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# ... (existing code)

def get_drive_service():
    if not os.path.exists(CREDENTIALS_FILE):
        return None
    try:
        scope = ['https://www.googleapis.com/auth/drive.file'] 
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        service = build('drive', 'v3', credentials=creds)
        return service
    except Exception as e:
        print(f"Error creating Drive service: {e}")
        return None

def create_or_get_folder(service, folder_name, parent_id=None):
    query = f"mimeType='application/vnd.google-apps.folder' and name='{folder_name}' and trashed=false"
    if parent_id:
        query += f" and '{parent_id}' in parents"
    
    try:
        results = service.files().list(q=query, fields="files(id, name)").execute()
        files = results.get('files', [])
        
        if files:
            return files[0]['id']
        
        # Create folder
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent_id:
            file_metadata['parents'] = [parent_id]
            
        file = service.files().create(body=file_metadata, fields='id').execute()
        return file.get('id')
    except Exception as e:
        print(f"Error creating/getting folder {folder_name}: {e}")
        return None

def upload_image_to_drive(image_path, filename):
    service = get_drive_service()
    if not service:
        return

    try:
        now = datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%B") # Full month name
        day = now.strftime("%d-%m-%Y")
        
        # Hierarchy: Year -> Month -> Day
        year_folder = create_or_get_folder(service, year)
        if not year_folder: return
        
        month_folder = create_or_get_folder(service, month, year_folder)
        if not month_folder: return
        
        day_folder = create_or_get_folder(service, day, month_folder)
        if not day_folder: return
        
        file_metadata = {
            'name': filename,
            'parents': [day_folder]
        }
        media = MediaFileUpload(image_path, mimetype='image/jpeg')
        
        file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        print(f"Uploaded {filename} to Drive (ID: {file.get('id')})")
        
    except Exception as e:
        print(f"Error uploading to Drive: {e}")

@app.post("/recognize")
async def recognize_face(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    global known_data, todays_attendance
    
    if not known_data["encodings"]:
         return {"name": "Unknown", "reg_no": "", "match": False, "detail": "No registered faces"}
    
    # Generate unique filename for upload
    timestamp = datetime.now().strftime("%H-%M-%S")
    original_filename = file.filename
    temp_filename = f"temp_rec_{timestamp}_{original_filename}"
    
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        image = face_recognition.load_image_file(temp_filename)
        encodings = face_recognition.face_encodings(image)
        
        if not encodings:
            if os.path.exists(temp_filename): os.remove(temp_filename)
            return {"name": "Unknown", "reg_no": "", "match": False, "detail": "No face detected"}
            
        unknown_encoding = encodings[0]
        matches = face_recognition.compare_faces(known_data["encodings"], unknown_encoding)
        name = "Unknown"
        reg_no = ""
        
        face_distances = face_recognition.face_distance(known_data["encodings"], unknown_encoding)
        if len(face_distances) > 0:
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                name = known_data["names"][best_match_index]
                if "reg_nos" in known_data and len(known_data["reg_nos"]) > best_match_index:
                     reg_no = known_data["reg_nos"][best_match_index]
        
        # already_marked = name in todays_attendance if name != "Unknown" else False
        # Defer duplicate check to log_attendance which serves the authoritative logic
        already_marked = False
        
        # Trigger background upload
        upload_name = f"{name}_{timestamp}.jpg"
        
        def background_upload_and_clean(path, fname):
            upload_image_to_drive(path, fname)
            if os.path.exists(path):
                os.remove(path)
                
        background_tasks.add_task(background_upload_and_clean, temp_filename, upload_name)
        
        return {"name": name, "reg_no": reg_no, "match": name != "Unknown", "already_marked": already_marked}
        
    except Exception as e:
        print(f"Error during recognition: {e}")
        if os.path.exists(temp_filename): os.remove(temp_filename)
        raise HTTPException(status_code=500, detail=str(e))

# ... imports remain same ...

# New Models
from pydantic import BaseModel

class EventCreate(BaseModel):
    title: str
    type: str # 'Parade', 'Social', 'Camp', 'Other'
    date: str # YYYY-MM-DD
    time: str # HH:MM

@app.post("/create_event")
async def create_event(event: EventCreate):
    """
    Creates a new event in the 'Event_Master' sheet.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        raise HTTPException(status_code=500, detail="Credentials file not found")
        
    SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'
    
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        
        spreadsheet = client.open_by_key(SHEET_ID)
        
        # Ensure Event_Master tab exists (basic check)
        try:
            worksheet = spreadsheet.worksheet("Event_Master")
        except gspread.exceptions.WorksheetNotFound:
            worksheet = spreadsheet.add_worksheet(title="Event_Master", rows=1000, cols=7)
            worksheet.append_row(["Event ID", "Title", "Type", "Date", "Time", "Created At", "Status"])
            
        # Generate Event ID
        event_id = f"EVT-{int(datetime.now().timestamp())}"
        
        worksheet.append_row([
            event_id,
            event.title,
            event.type,
            event.date,
            event.time,
            event.time,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "Active" # Status
        ])
        
        return {"message": "Event created successfully", "event_id": event_id}
        
    except Exception as e:
        print(f"Error creating event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/active_event")
def get_active_event():
    """
    Fetches the most recent 'Active' event AND its live stats from 'Event_Strength'.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        return None
        
    SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'
    
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(SHEET_ID)
        
        # 1. Fetch Event Master
        events_ws = spreadsheet.worksheet("Event_Master")
        # Use get_all_values to avoid header issues
        raw_events = events_ws.get_all_values()
        
        if len(raw_events) < 2: return None
        
        headers = raw_events[0]
        # Helper to find column index safely
        def get_col_idx(name):
            try: return headers.index(name)
            except: return -1

        status_idx = get_col_idx("Status")
        id_idx = get_col_idx("Event ID")
        title_idx = get_col_idx("Title")
        
        if status_idx == -1 or id_idx == -1: return None # Critical columns missing

        active_event = None
        
        # Iterate backwards to find latest active
        for i in range(len(raw_events) - 1, 0, -1):
            row = raw_events[i]
            # Ensure row has enough columns
            if len(row) <= status_idx: continue
            
            if str(row[status_idx]).strip().lower() == "active":
                active_event = {
                    "Event ID": row[id_idx],
                    "Title": row[title_idx] if title_idx != -1 and len(row) > title_idx else "Unknown Event",
                    "Status": "Active"
                }
                break
        
        if not active_event:
            return None

        # 2. Fetch Live Stats from Event_Strength
        # Structure: Event ID, Date, Total, 3rd Year, 2nd Year, 1st Year
        try:
            strength_ws = spreadsheet.worksheet("Event_Strength")
            strength_data = strength_ws.get_all_values()
            
            # Find row for this Event ID
            stats = {"total": 0, "year1": 0, "year2": 0, "year3": 0}
            
            # Assuming headers row 1
            # Col 0: Event ID, Col 2: Total, Col 3: 3rd, 4: 2nd, 5: 1st (Based on Apps Script)
            # Apps Script: [eventId, date, total, y3, y2, y1]
            
            for row in strength_data:
                if len(row) > 0 and str(row[0]).strip() == active_event["Event ID"]:
                    try:
                        stats["total"] = int(row[2]) if len(row) > 2 and row[2] else 0
                        stats["year3"] = int(row[3]) if len(row) > 3 and row[3] else 0
                        stats["year2"] = int(row[4]) if len(row) > 4 and row[4] else 0
                        stats["year1"] = int(row[5]) if len(row) > 5 and row[5] else 0
                    except:
                        pass # keep 0s
                    break
            
            active_event["stats"] = stats
            
        except gspread.exceptions.WorksheetNotFound:
            active_event["stats"] = {"total": 0, "year1": 0, "year2": 0, "year3": 0}

        return active_event
        
    except Exception as e:
        print(f"Error fetching active event: {e}")
        return None

@app.post("/end_event")
def end_event():
    """
    Marks the currently active event as 'Ended'.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        raise HTTPException(status_code=500, detail="Credentials missing")
        
    SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'
    
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(SHEET_ID)
        worksheet = spreadsheet.worksheet("Event_Master")
        
        # Use get_all_values to be safe
        raw_data = worksheet.get_all_values()
        headers = raw_data[0] if raw_data else []
        
        try:
            status_idx = headers.index("Status")
        except ValueError:
             # Try to find it loosely or default to col 6 (G)
             status_idx = 6 
        
        # Find last active
        row_index = -1
        # Start from end
        for i in range(len(raw_data) - 1, 0, -1):
            row = raw_data[i]
            if len(row) > status_idx and str(row[status_idx]).lower() == "active":
                row_index = i + 1 # 1-based index
                break
        
        if row_index != -1:
            worksheet.update_cell(row_index, status_idx + 1, "Ended")
            return {"message": "Event ended successfully"}
            
        return {"message": "No active event found"}

    except Exception as e:
        print(f"Error ending event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events")
def get_events():
    """
    Fetches list of events from 'Event_Master'.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        return []
        
    SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'
    
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        
        spreadsheet = client.open_by_key(SHEET_ID)
        try:
            worksheet = spreadsheet.worksheet("Event_Master")
        except gspread.exceptions.WorksheetNotFound:
            return []
            
        # Use get_all_values + list of dicts manual creation
        raw_rows = worksheet.get_all_values()
        if not raw_rows: return []
        
        headers = raw_rows[0]
        events = []
        
        for i in range(1, len(raw_rows)):
            row = raw_rows[i]
            event = {}
            # Map by index to avoid missing key errors
            for col_idx, header in enumerate(headers):
                if header and col_idx < len(row):
                    event[header] = row[col_idx]
            events.append(event)
            
        return list(reversed(events))
        
    except Exception as e:
        print(f"Error fetching events: {e}")
        return []

@app.get("/strength")
def get_strength():
    """
    Fetches strength statistics from the 'Strength' sheet.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        raise HTTPException(status_code=500, detail="Credentials file not found")

    SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'
    
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        
        spreadsheet = client.open_by_key(SHEET_ID)
        
        try:
            worksheet = spreadsheet.worksheet("Strength")
        except gspread.exceptions.WorksheetNotFound:
            return {"total": 0, "breakdown": []}
            
        # Use get_all_values 
        raw_rows = worksheet.get_all_values()
        if not raw_rows: return {"total": 0, "breakdown": []}
        
        headers = raw_rows[0]
        # Helper indices
        try:
             # Flexible matching
             year_idx = next(i for i, h in enumerate(headers) if "year" in h.lower())
             total_idx = next(i for i, h in enumerate(headers) if "total" in h.lower())
             # SD/SW might be separate or combined?
             # Assuming Headers: Year | SD | SW | Total
             sd_idx = next((i for i, h in enumerate(headers) if "sd" in h.lower()), -1)
             sw_idx = next((i for i, h in enumerate(headers) if "sw" in h.lower()), -1)
        except StopIteration:
             # Headers completely wrong?
             return {"total": 0, "breakdown": []}

        total_strength = 0
        breakdown = []
        
        for i in range(1, len(raw_rows)):
            row = raw_rows[i]
            # Guard bounds
            if len(row) <= year_idx: continue
            
            row_year = str(row[year_idx]).strip()
            row_total = int(row[total_idx]) if total_idx < len(row) and row[total_idx] else 0
            row_sd = int(row[sd_idx]) if sd_idx != -1 and sd_idx < len(row) and row[sd_idx] else 0
            row_sw = int(row[sw_idx]) if sw_idx != -1 and sw_idx < len(row) and row[sw_idx] else 0
            
            record = {
                "Year": row_year,
                "Total": row_total,
                "SD": row_sd,
                "SW": row_sw
            }

            if row_year.lower() == "total":
                total_strength = row_total
            else:
                breakdown.append(record)
                
        return {"total": total_strength, "breakdown": breakdown}

    except Exception as e:
        print(f"Error fetching strength: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/attendance-summary")
def get_attendance_summary():
    """
    Fetches the full attendance summary from the 'Attendance' sheet.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        return []
        
    SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'
    
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        
        spreadsheet = client.open_by_key(SHEET_ID)
        try:
            worksheet = spreadsheet.worksheet("Attendance")
        except gspread.exceptions.WorksheetNotFound:
            return []
            
        records = worksheet.get_all_records()
        return records
        
    except Exception as e:
        print(f"Error fetching attendance summary: {e}")
        return []

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/login")
def login(login_data: LoginRequest):
    """
    Verifies username and password against 'Credentials' sheet.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        raise HTTPException(status_code=500, detail="Credentials file not found")

    SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'
    
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        
        spreadsheet = client.open_by_key(SHEET_ID)
        try:
            worksheet = spreadsheet.worksheet("Credentials")
        except gspread.exceptions.WorksheetNotFound:
            raise HTTPException(status_code=500, detail="Credentials sheet not found")
            
        records = worksheet.get_all_records()
        
        for user in records:
            if str(user.get("Username")) == login_data.username and str(user.get("Password")) == login_data.password:
                return {
                    "success": True,
                    "role": user.get("Role"),
                    "name": user.get("Name"),
                    "username": user.get("Username")
                }
                
        raise HTTPException(status_code=401, detail="Invalid credentials")

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error logging in: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/refresh_sheet")
def refresh_sheet():
    """
    Manually triggers the recalculation of the Attendance sheet based on Logs.
    Replicates the Google Apps Script logic in Python.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        raise HTTPException(status_code=500, detail="Credentials missing")
        
    SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'
    
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(SHEET_ID)
        
        # 1. Fetch Data
        try:
            logs_ws = spreadsheet.worksheet("Attendance_Logs")
            events_ws = spreadsheet.worksheet("Event_Master")
            att_ws = spreadsheet.worksheet("Attendance")
        except gspread.exceptions.WorksheetNotFound as wne:
            raise HTTPException(status_code=500, detail=f"Missing worksheet: {wne}")

        logs_data = logs_ws.get_all_records()
        events_data = events_ws.get_all_records()
        att_data = att_ws.get_all_values() # get_all_values to keep list of lists for easy update
        
        # 2. Map Event ID -> Type
        # Store as { 'EVT-123': 'Mandatory Parade' }
        event_type_map = {}
        for event in events_data:
            eid = str(event.get("Event ID", "")).strip()
            etype = str(event.get("Type", "")).strip()
            if eid:
                event_type_map[eid] = etype
                
        # 3. Aggregate Logs
        # { 'KA/22/SD/123': { 'Mandatory Parade': 5, ... } }
        cadet_stats = {}
        
        for log in logs_data:
            enrollment_id = str(log.get("Enrollment ID", "")).strip()
            event_id = str(log.get("Event ID", "")).strip()
            # status = str(log.get("Status", "Present")).strip() # Could use status for weighting later
            
            if not enrollment_id or not event_id:
                continue
                
            etype = event_type_map.get(event_id, "Others")
            
            if enrollment_id not in cadet_stats:
                cadet_stats[enrollment_id] = {
                    'Mandatory Parade': 0, 'Social Service': 0, 'College Events': 0, 'Others': 0, 'Total': 0
                }
            
            # Count logic (simple count for now)
            cadet_stats[enrollment_id][etype] = cadet_stats[enrollment_id].get(etype, 0) + 1
            cadet_stats[enrollment_id]['Total'] += 1
            
        # 4. Update Attendance Sheet Data (In Memory)
        # Headers are likely row 0 (1st row). 
        # Map headers to indices
        headers = att_data[0]
        try:
            col_enr = headers.index("Enrollment ID")
            col_man = headers.index("Mandatory Parade")
            col_soc = headers.index("Social Drives")
            col_col = headers.index("College Events")
            col_oth = headers.index("Others")
            col_tot = headers.index("Total")
        except ValueError as ve:
             # Fallback if headers not found exactly? Or error out?
             # Let's try erroring out to be safe, or assume standard positions if critical
             raise HTTPException(status_code=500, detail=f"Column missing in Attendance sheet: {ve}")

        updated_rows = []
        # Start from row 1 (2nd row)
        for i in range(1, len(att_data)):
            row = att_data[i]
            # Ensure row has enough columns
            while len(row) <= max(col_man, col_soc, col_col, col_oth, col_tot):
                row.append("")
                
            enr_id = str(row[col_enr]).strip()
            
            if enr_id in cadet_stats:
                stat = cadet_stats[enr_id]
                row[col_man] = stat.get('Mandatory Parade', 0)
                row[col_soc] = stat.get('Social Service', 0)
                row[col_col] = stat.get('College Events', 0)
                row[col_oth] = stat.get('Others', 0)
                row[col_tot] = stat['Total']
                
            updated_rows.append(row)
            
        # 5. Batch Update
        # Update everything from A2 to end
        # range_start = "A2"
        # Since we modified att_data in place (except header), we can write att_data back? 
        # Actually we iterated index.
        # Let's construct the update range.
        
        # att_ws.update(range_name, values)
        # Writing the whole sheet might be slow but safe.
        att_ws.update(att_data) 
        
        return {"message": "Sheet refreshed successfully", "stats_processed": len(cadet_stats)}

    except Exception as e:
        print(f"Error refreshing sheet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cadets")
def get_cadets():
    """
    Fetches cadet list from the NCC Data Sheet.
    Sheet ID: 11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE
    Tabs: '3rd Year', '2nd Year', '1st Year'
    """
    if not os.path.exists(CREDENTIALS_FILE):
        raise HTTPException(status_code=500, detail="Credentials file not found")

    SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'
    TARGET_SHEETS = ['3rd Year', '2nd Year', '1st Year']

    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        
        spreadsheet = client.open_by_key(SHEET_ID)
        
        cadets = []
        global_id_counter = 1

        for sheet_name in TARGET_SHEETS:
            try:
                sheet = spreadsheet.worksheet(sheet_name)
                records = sheet.get_all_records()
                print(f"Loaded {len(records)} records from {sheet_name}")

                for row in records:
                    # Safe get utility
                    def get_val(key, default=""):
                        return str(row.get(key, default)).strip()

                    # Skip empty rows if any
                    if not get_val("Name") and not get_val("Enrollment ID"):
                        continue

                    cadets.append({
                        "id": global_id_counter,
                        "enrollmentId": get_val("Enrollment ID"),
                        "regimentalNumber": get_val("Enrollment ID"), 
                        "rank": get_val("RANK"),
                        "year": sheet_name, # Use sheet name as source of truth for Year if needed, or row data
                        "department": get_val("DEPT"),
                        "name": get_val("Name"),
                        "puRollNumber": get_val("PU ROLL NUMBER"),
                        "sdSw": get_val("SD/SW"),
                        "mobileNumber": get_val("Mobile number"),
                        "email": get_val("Email id"),
                        "dob": get_val("Date of birth"),
                        "bloodGroup": get_val("Blood Group"),
                        "photo": "/images/profile/user-1.jpg", 
                        "rankHolder": False, 
                        "attendedParades": 0,
                        "totalParades": 0,
                    })
                    global_id_counter += 1

            except gspread.exceptions.WorksheetNotFound:
                print(f"Warning: Sheet '{sheet_name}' not found.")
                continue
            except Exception as inner_e:
                print(f"Error processing sheet {sheet_name}: {inner_e}")
                continue
            
        return cadets

    except Exception as e:
        print(f"Error fetching cadets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/strength")
def get_strength():
    """
    Fetches strength statistics from the 'Strength' sheet.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        raise HTTPException(status_code=500, detail="Credentials file not found")

    SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'
    
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        
        spreadsheet = client.open_by_key(SHEET_ID)
        
        try:
            worksheet = spreadsheet.worksheet("Strength")
        except gspread.exceptions.WorksheetNotFound:
            return {"total": 0, "breakdown": []}
            
        # Use get_all_values to avoid duplicates error
        raw_rows = worksheet.get_all_values()
        if not raw_rows: return {"total": 0, "breakdown": []}
        
        headers = raw_rows[0]
        # Helper indices
        try:
             # Flexible matching
             year_idx = next(i for i, h in enumerate(headers) if "year" in h.lower())
             total_idx = next(i for i, h in enumerate(headers) if "total" in h.lower())
             # SD/SW might be separate or combined?
             # Assuming Headers: Year | SD | SW | Total
             # Optional: Try to find SD/SW if they exist
             sd_idx = next((i for i, h in enumerate(headers) if "sd" in h.lower()), -1)
             sw_idx = next((i for i, h in enumerate(headers) if "sw" in h.lower()), -1)
        except StopIteration:
             # Headers completely wrong?
             return {"total": 0, "breakdown": []}

        total_strength = 0
        breakdown = []
        
        for i in range(1, len(raw_rows)):
            row = raw_rows[i]
            # Guard bounds
            if len(row) <= year_idx: continue
            
            row_year = str(row[year_idx]).strip()
            # Handle short rows
            def get_cell(idx):
                return int(row[idx]) if idx < len(row) and row[idx].isdigit() else 0

            row_total = get_cell(total_idx)
            row_sd = get_cell(sd_idx) if sd_idx != -1 else 0
            row_sw = get_cell(sw_idx) if sw_idx != -1 else 0
            
            record = {
                "Year": row_year,
                "Total": row_total,
                "SD": row_sd,
                "SW": row_sw
            }

            if row_year.lower() == "total":
                total_strength = row_total
            else:
                breakdown.append(record)
                
        return {"total": total_strength, "breakdown": breakdown}

    except Exception as e:
        print(f"Error fetching strength: {e}")
        raise HTTPException(status_code=500, detail=str(e))
