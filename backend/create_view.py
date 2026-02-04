from sqlalchemy import text
from database import engine

def create_attendance_summary_view():
    # Try to drop as view first, then table. Handle errors gracefully.
    try:
        with engine.connect() as conn:
            conn.execute(text("DROP VIEW IF EXISTS attendance_summary_view CASCADE"))
            conn.commit()
    except Exception as e:
        print(f"Note: Could not drop view: {e}")

    try:
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS attendance_summary_view CASCADE"))
            conn.commit()
    except Exception as e:
        print(f"Note: Could not drop table: {e}")

    sql = """
    CREATE OR REPLACE VIEW attendance_summary_view AS
    SELECT 
        row_number() OVER (ORDER BY c.enrollment_id) as sr_no,
        c.enrollment_id,
        c.rank,
        c.year,
        c.name,
        c.department as dept,
        c.pu_roll_number,
        COUNT(CASE WHEN (LOWER(e.event_type) LIKE '%%mandatory%%' OR LOWER(e.event_type) LIKE '%%parade%%') AND (l.status = 'Present' OR l.status IS NOT NULL) THEN 1 END) as mandatory_parade,
        COUNT(CASE WHEN LOWER(e.event_type) LIKE '%%social%%' AND (l.status = 'Present' OR l.status IS NOT NULL) THEN 1 END) as social_drives,
        COUNT(CASE WHEN LOWER(e.event_type) LIKE '%%college%%' AND (l.status = 'Present' OR l.status IS NOT NULL) THEN 1 END) as college_events,
        COUNT(CASE WHEN 
            (LOWER(e.event_type) NOT LIKE '%%mandatory%%' 
             AND LOWER(e.event_type) NOT LIKE '%%parade%%' 
             AND LOWER(e.event_type) NOT LIKE '%%social%%' 
             AND LOWER(e.event_type) NOT LIKE '%%college%%') 
            AND (l.status = 'Present' OR l.status IS NOT NULL) THEN 1 END) as others,
        COUNT(l.id) as total
    FROM cadets c
    LEFT JOIN attendance_logs l ON c.enrollment_id = l.enrollment_id
    LEFT JOIN events e ON l.event_id = e.event_id
    GROUP BY c.enrollment_id, c.rank, c.year, c.name, c.department, c.pu_roll_number;
    """
    
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    print("View 'attendance_summary_view' created successfully.")

if __name__ == "__main__":
    create_attendance_summary_view()
