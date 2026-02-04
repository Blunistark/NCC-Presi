from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
import face_recognition
import pickle
import numpy as np
import os
from datetime import datetime
import shutil
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import engine, get_db
import models

# Google API Imports
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from oauth2client.service_account import ServiceAccountCredentials
import gspread

# Create Tables
models.Base.metadata.create_all(bind=engine)

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
known_data = {"encodings": [], "names": [], "reg_nos": []}

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

@app.on_event("startup")
async def startup_event():
    print("--- STARTUP: Beginning startup_event ---")
    os.makedirs(DATA_DIR, exist_ok=True)
    
    print("--- STARTUP: Loading encodings ---")
    load_encodings()
    
    # DB initialization happens via create_all above
    print("--- STARTUP: Database Tables Created (if not exist) ---")
    print("--- STARTUP: Complete ---")

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

# --- Drive Integration for Image Upload ---

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
    print("--- RECOGNIZE ENDPOINT CALLED ---")
    global known_data
    
    try:
        if not known_data:
            print("known_data is None or empty structure")
            known_data = {"encodings": [], "names": [], "reg_nos": []}

        print(f"Known faces count: {len(known_data.get('encodings', []))}")

        if not known_data.get("encodings"):
             print("No encodings, returning early.")
             return {"name": "Unknown", "reg_no": "", "match": False, "detail": "No registered faces"}
        
        # Generate unique filename for upload
        timestamp = datetime.now().strftime("%H-%M-%S")
        original_filename = file.filename
        temp_filename = f"temp_rec_{timestamp}_{original_filename}"
        print(f"Saving temp file: {temp_filename}")
        
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print("File saved. Loading image...")
        image = face_recognition.load_image_file(temp_filename)
        print("Image loaded. Generating encodings...")
        encodings = face_recognition.face_encodings(image)
        print(f"Encodings found: {len(encodings)}")
        
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
        
        print(f"Match result: {name}")
        already_marked = False
        
        # Trigger background upload
        upload_name = f"{name}_{timestamp}.jpg"
        
        def background_upload_and_clean(path, fname):
            print(f"Background upload starting: {fname}")
            try:
                upload_image_to_drive(path, fname)
            except Exception as bg_e:
                print(f"Background upload failed: {bg_e}")
            if os.path.exists(path):
                os.remove(path)
                
        background_tasks.add_task(background_upload_and_clean, temp_filename, upload_name)
        
        return {"name": name, "reg_no": reg_no, "match": name != "Unknown", "already_marked": already_marked}
        
    except Exception as e:
        print(f"Error during recognition: {e}")
        import traceback
        traceback.print_exc()
        if 'temp_filename' in locals() and os.path.exists(temp_filename): 
            os.remove(temp_filename)
        raise HTTPException(status_code=500, detail=str(e))

# Models
from pydantic import BaseModel

class EventCreate(BaseModel):
    title: str
    type: str # 'Parade', 'Social', 'Camp', 'Other'
    date: str # YYYY-MM-DD
    time: str # HH:MM

class LogAttendanceRequest(BaseModel):
    name: str
    reg_no: str
    event_id: str
    status: str

# API Endpoints (DB Refactored)

@app.post("/log_attendance")
def log_attendance(
    name: str = Form(...),
    reg_no: str = Form(...),
    event_id: str = Form(...),
    status: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Logs a single attendance record to DB.
    """
    print(f"--- LOG ATTENDANCE CALLED ---")
    print(f"Name: {name}, RegNo: {reg_no}, EventID: {event_id}, Status: {status}")
    try:
        # Check duplicate
        existing = db.query(models.AttendanceLog).filter(
            models.AttendanceLog.event_id == event_id,
            models.AttendanceLog.enrollment_id == reg_no
        ).first()
        
        if existing:
             return {"message": "Already marked", "duplicate": True}

        new_log = models.AttendanceLog(
            event_id=event_id,
            enrollment_id=reg_no,
            status=status,
            timestamp=datetime.now()
        )
        
        db.add(new_log)
        db.commit()
        
        return {"message": "Attendance logged successfully", "duplicate": False}
        
    except Exception as e:
        print(f"Error logging attendance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create_event")
async def create_event(event: EventCreate, db: Session = Depends(get_db)):
    """
    Creates a new event in the database.
    """
    try:
        # Generate Event ID
        event_id = f"EVT-{int(datetime.now().timestamp())}"
        
        new_event = models.Event(
            event_id=event_id,
            title=event.title,
            event_type=event.type,
            date=datetime.strptime(event.date, "%Y-%m-%d").date(),
            time=datetime.strptime(event.time, "%H:%M").time(),
            status="Active"
        )
        
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        
        return {"message": "Event created successfully", "event_id": event_id}
        
    except Exception as e:
        print(f"Error creating event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/active_event")
async def active_event(db: Session = Depends(get_db)):
    """
    Checks if there is an active event (DB Version).
    """
    try:
        # Find active event
        # Find active event for TODAY
        today = datetime.now().date()
        event = db.query(models.Event).filter(
            models.Event.status == "Active",
            models.Event.date == today
        ).first()
        
        if not event:
             return {"active": False, "message": "No active event"}
        
        # Calculate Stats
        total_count = db.query(models.AttendanceLog).filter(models.AttendanceLog.event_id == event.event_id).count()
        
        # Year-wise counts
        def count_year(y):
            return db.query(models.AttendanceLog).join(models.Cadet).filter(
                models.AttendanceLog.event_id == event.event_id,
                models.Cadet.year == y
            ).count()

        return {
            "active": True,
            "event": {
                "id": event.event_id,
                "title": event.title,
                "type": event.event_type,
                "date": str(event.date),
                "time": str(event.time)
            },
            "stats": {
                "total": total_count,
                "year1": count_year("1st Year"),
                "year2": count_year("2nd Year"),
                "year3": count_year("3rd Year")
            }
        }

    except Exception as e:
        print(f"Error checking active event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/end_event")
async def end_event(db: Session = Depends(get_db)):
    """
    Ends the currently active event (DB Version).
    """
    try:
        # Find active event
        event = db.query(models.Event).filter(models.Event.status == "Active").first()
        
        if not event:
            return {"message": "No active event to end"}
            
        event.status = "Ended"
        db.commit()
        
        return {"message": "Event ended successfully", "event_id": event.event_id}

    except Exception as e:
         print(f"Error ending event: {e}")
         raise HTTPException(status_code=500, detail=str(e))

@app.get("/events")
async def get_events(limit: int = 5, db: Session = Depends(get_db)):
    """
    Fetches list of events from DB.
    """
    try:
        events = db.query(models.Event).order_by(models.Event.created_at.desc()).limit(limit).all()
        
        result = []
        for ev in events:
            # Count attendance
            count = db.query(models.AttendanceLog).filter(models.AttendanceLog.event_id == ev.event_id).count()
            
            result.append({
                "id": ev.event_id,
                "title": ev.title,
                "date": str(ev.date),
                "time": str(ev.time) if ev.time else None,
                "type": ev.event_type,
                "status": ev.status,
                "attendance": count
            })
            
        return result

    except Exception as e:
        print(f"Error getting events: {e}")
        return []

@app.get("/strength")
def get_strength(db: Session = Depends(get_db)):
    """
    Fetches strength statistics for the entire unit (Cadet Table).
    Returns Year-wise breakdown and Total.
    """
    try:
        # Calculate stats from Cadet table
        total = db.query(models.Cadet).count()
        
        def count_year(y):
            return db.query(models.Cadet).filter(models.Cadet.year == y).count()
            
        def count_sd_sw(y, sd_sw):
            return db.query(models.Cadet).filter(models.Cadet.year == y, models.Cadet.sd_sw == sd_sw).count()

        years = ["3rd Year", "2nd Year", "1st Year"]
        breakdown = []
        
        for yr in years:
            breakdown.append({
                "Year": yr,
                "SD": count_sd_sw(yr, "SD"),
                "SW": count_sd_sw(yr, "SW"),
                "Total": count_year(yr)
            })

        return {"total": total, "breakdown": breakdown}

    except Exception as e:
        print(f"Error fetching strength: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cadets")
def get_cadets(db: Session = Depends(get_db)):
    """
    Fetches cadet list from the database.
    """
    try:
        cadets = db.query(models.Cadet).all()
        
        result = []
        for cadet in cadets:
            result.append({
                "id": cadet.enrollment_id,
                "enrollmentId": cadet.enrollment_id,
                "regimentalNumber": cadet.enrollment_id,
                "rank": cadet.rank,
                "year": cadet.year,
                "department": cadet.department,
                "name": cadet.name,
                "puRollNumber": cadet.pu_roll_number,
                "sdSw": cadet.sd_sw,
                "mobileNumber": cadet.mobile_number,
                "email": cadet.email,
                "dob": cadet.dob,
                "bloodGroup": cadet.blood_group,
                "photo": "/images/profile/user-1.jpg", 
                "rankHolder": False,
                "attendedParades": 0,
                "totalParades": 0,
            })
            
        return result

    except Exception as e:
        print(f"Error fetching cadets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events/{event_id}")
def get_event_details(event_id: str, db: Session = Depends(get_db)):
    """
    Fetches details of a single event.
    """
    try:
        event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        count = db.query(models.AttendanceLog).filter(models.AttendanceLog.event_id == event_id).count()
        total_strength = db.query(models.Cadet).count()
        
        return {
            "id": event.event_id,
            "title": event.title,
            "date": str(event.date),
            "time": str(event.time) if event.time else None,
            "type": event.event_type,
            "status": event.status,
            "attended": count,
            "totalStrength": total_strength
        }
    except Exception as e:
        print(f"Error fetching event details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/event_attendance/{event_id}")
def get_event_attendance(event_id: str, db: Session = Depends(get_db)):
    """
    Fetches list of all cadets with their attendance status for a specific event.
    """
    try:
        # Fetch all cadets
        cadets = db.query(models.Cadet).all()
        
        # Fetch logs for this event
        logs = db.query(models.AttendanceLog).filter(models.AttendanceLog.event_id == event_id).all()
        log_map = {log.enrollment_id: log.status for log in logs}
        
        result = []
        for cadet in cadets:
            status = log_map.get(cadet.enrollment_id, "Absent")
            result.append({
                "id": cadet.enrollment_id,
                "regimentalNumber": cadet.enrollment_id,
                "rank": cadet.rank,
                "name": cadet.name,
                "year": cadet.year,
                "status": status
            })
            
        return result

    except Exception as e:
        print(f"Error fetching event attendance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/event_ods")
def get_event_ods(event_id: str, db: Session = Depends(get_db)):
    """
    Fetches OD list for a specific event (Status != 'Present').
    """
    try:
        logs = db.query(models.AttendanceLog).filter(
            models.AttendanceLog.event_id == event_id,
            models.AttendanceLog.status != "Present"
        ).all()
        
        result = []
        for i, log in enumerate(logs):
            cadet = db.query(models.Cadet).filter(models.Cadet.enrollment_id == log.enrollment_id).first()
            if not cadet: continue
            
            result.append({
                "Sr no": i + 1,
                "Enrollment no": cadet.enrollment_id,
                "Rank": cadet.rank,
                "Year": cadet.year,
                "Dept": cadet.department,
                "Name": cadet.name,
                "PU Roll nuber": cadet.pu_roll_number,
                "Hours": log.status,
                "Event ID": event_id
            })
            
        return result

    except Exception as e:
        print(f"Error fetching event ODs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recent_events")
async def get_recent_events_endpoint(limit: int = 5, db: Session = Depends(get_db)):
    """
    Fetches the last 5 events (Alias for /events).
    """
    return await get_events(limit, db)

@app.get("/attendance-summary")
def get_attendance_summary(db: Session = Depends(get_db)):
    """
    aggregated attendance for each cadet.
    """
    try:
        # Fetch from the View which already has aggregated data
        summary = db.query(models.AttendanceSummary).all()
        
        result = []
        for s in summary:
            result.append({
                "Sr No": s.sr_no,
                "Enrollment ID": s.enrollment_id,
                "RANK": s.rank,
                "Year": s.year,
                "Name": s.name,
                "DEPT": s.dept,
                "PU ROLL NUMBER": s.pu_roll_number,
                "Mandatory Parade": s.mandatory_parade or 0,
                "Social Drives": s.social_drives or 0,
                "College Events": s.college_events or 0,
                "Others": s.others or 0,
                "Total": s.total or 0
            })
            
        return result

    except Exception as e:
        print(f"Error fetching attendance summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Keep Login using GSpread as User table is not migrated
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
