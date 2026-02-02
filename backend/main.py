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
todays_attendance = set()

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

def load_todays_attendance():
    global todays_attendance
    if not os.path.exists(CREDENTIALS_FILE):
        return

    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        sheet = client.open("FaceAttendance").sheet1
        
        today = datetime.now().strftime("%Y-%m-%d")
        records = sheet.get_all_records()
        
        current_names = set()
        for record in records:
            if str(record.get("Date")) == today:
                current_names.add(record.get("Name"))
        
        todays_attendance = current_names
        print(f"Loaded {len(todays_attendance)} attendance records for today.")
    except Exception as e:
        print(f"Error loading today's attendance: {e}")

@app.on_event("startup")
async def startup_event():
    os.makedirs(DATA_DIR, exist_ok=True)
    load_encodings()
    load_todays_attendance()

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
        
        already_marked = name in todays_attendance if name != "Unknown" else False
        
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
            worksheet = spreadsheet.add_worksheet(title="Event_Master", rows=1000, cols=6)
            worksheet.append_row(["Event ID", "Title", "Type", "Date", "Time", "Created At"])
            
        # Generate Event ID
        event_id = f"EVT-{int(datetime.now().timestamp())}"
        
        worksheet.append_row([
            event_id,
            event.title,
            event.type,
            event.date,
            event.time,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ])
        
        return {"message": "Event created successfully", "event_id": event_id}
        
    except Exception as e:
        print(f"Error creating event: {e}")
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
            
        records = worksheet.get_all_records()
        # Filter logic if needed (e.g., only future events or recent ones)
        # For now, return all reversed (newest first)
        return list(reversed(records))
        
    except Exception as e:
        print(f"Error fetching events: {e}")
        return []

def log_to_sheet_raw(enrollment_id, name, event_id, status="Present"):
    """
    Logs raw attendance scan to 'Attendance_Logs' sheet.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        return

    SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'

    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(SHEET_ID)
        
        try:
            worksheet = spreadsheet.worksheet("Attendance_Logs")
        except gspread.exceptions.WorksheetNotFound:
            worksheet = spreadsheet.add_worksheet(title="Attendance_Logs", rows=1000, cols=5)
            worksheet.append_row(["Timestamp", "Event ID", "Enrollment ID", "Name", "Status"])

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        worksheet.append_row([timestamp, event_id, enrollment_id, name, status])
        print(f"Logged raw attendance for {name} (Event: {event_id})")
        
    except Exception as e:
        print(f"Error logging to sheet: {e}")

@app.post("/log_attendance")
async def log_attendance_endpoint(
    name: str = Form(...), 
    reg_no: str = Form(None), 
    event_id: str = Form(...), # Changed from od_status/hours for generic flow
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    global todays_attendance
    
    # Simple deduplication per session instace (optional, sheet likely handles it better via script or unique index)
    # Removing blocking check to allow multiple events same day if needed
    
    background_tasks.add_task(log_to_sheet_raw, reg_no, name, event_id)
    return {"message": f"Attendance logged for {name}"}

@app.get("/parade-stats")
def get_parade_stats(date: str = None):
    """
    Fetches the pre-generated Parade Report from the 'paradecount' Google Sheet.
    Args:
        date: Format 'YYYY-MM-DD'. Defaults to today.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        raise HTTPException(status_code=500, detail="Credentials file not found")

    target_date = date if date else datetime.now().strftime("%Y-%m-%d")
    
    # The sheet ID provided by the user for 'paradecount'
    PARADE_SHEET_ID = '1FNzOUCf13xCzdH2S3t2y_M5nn0jZrlFGKWNNczcMrFc'

    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        
        # Open by ID since name might be ambiguous or user specific
        sheet = client.open_by_key(PARADE_SHEET_ID)
        
        # Try to find the worksheet for the specific date
        # The Apps Script names tabs as "YYYY-MM-DD"
        try:
            worksheet = sheet.worksheet(target_date)
        except gspread.exceptions.WorksheetNotFound:
            return {"found": False, "message": f"Report for {target_date} not generated yet.", "date": target_date}

        # Read the table data (assuming standard size from Apps Script)
        # It usually writes 6 rows (DateHeader + Header + 3 Years + Total)
        data = worksheet.get_all_values()
        
        return {"found": True, "data": data, "date": target_date}

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error fetching parade stats: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")
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
            
        records = worksheet.get_all_records()
        
        total_strength = 0
        breakdown = []
        
        for record in records:
            if str(record.get("Year")).lower() == "total":
                # Ensure we handle string/int conversion safely
                try:
                    total_strength = int(record.get("Total", 0))
                except:
                    total_strength = 0
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



