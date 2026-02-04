from sqlalchemy import Column, Integer, String, Date, Time, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Cadet(Base):
    __tablename__ = "cadets"

    enrollment_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    rank = Column(String)
    year = Column(String) # '1st Year', '2nd Year', '3rd Year'
    department = Column(String, nullable=True)
    pu_roll_number = Column(String, nullable=True)
    sd_sw = Column(String, nullable=True) # 'SD' or 'SW'
    mobile_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)

class Event(Base):
    __tablename__ = "events"

    event_id = Column(String, primary_key=True, index=True)
    title = Column(String)
    event_type = Column(String)
    date = Column(Date)
    time = Column(Time)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.now)

    attendance_logs = relationship("AttendanceLog", back_populates="event")

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("events.event_id"))
    enrollment_id = Column(String, ForeignKey("cadets.enrollment_id"))
    status = Column(String) # 'Present', 'OD', '1, 2, 3...'
    timestamp = Column(DateTime, default=datetime.now)

    event = relationship("Event", back_populates="attendance_logs")
    cadet = relationship("Cadet")

class AttendanceSummary(Base):
    __tablename__ = 'attendance_summary_view'
    
    # We map to the view, treating it as read-only
    enrollment_id = Column(String, primary_key=True)
    sr_no = Column(Integer)
    rank = Column(String)
    year = Column(String)
    name = Column(String)
    dept = Column(String)
    pu_roll_number = Column(String)
    mandatory_parade = Column(Integer)
    social_drives = Column(Integer)
    college_events = Column(Integer)
    others = Column(Integer)
    total = Column(Integer)
