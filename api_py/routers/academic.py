from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query, execute_commit
from ..auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class AcademicRecord(BaseModel):
    courseName: str
    grade: Optional[str] = "A"
    credits: float = 4.0
    semester: str = "Fall"
    year: int = 2023
    isAP: bool = False
    isHonors: bool = False
    studentId: Optional[int] = None

def calculate_gpa(records):
    grade_points = {
        "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
        "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "F": 0.0
    }
    total_points = 0.0
    total_credits = 0.0
    for r in records:
        base = grade_points.get(r["grade"] or "", 0.0)
        weight = 1.0 if r["isAP"] else (0.5 if r["isHonors"] else 0.0)
        credits = r["credits"] or 1.0
        total_points += (base + weight) * credits
        total_credits += credits
    return round(total_points / total_credits, 2) if total_credits > 0 else 0.0

async def get_target_student_id(user, requested_student_id):
    if user["role"].upper() == "STUDENT":
        student = execute_query("SELECT id FROM Student WHERE userId = %s", (user["id"],), fetch_one=True)
        return student["id"] if student else None
    if (user["role"].upper() in ["ADMIN", "COUNSELOR"]) and requested_student_id:
        return int(requested_student_id)
    return None

@router.get("/")
async def get_academics(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    target_id = await get_target_student_id(current_user, studentId)
    if not target_id:
        raise HTTPException(status_code=400, detail="Student ID required")
    
    records = execute_query("SELECT * FROM AcademicRecord WHERE studentId = %s ORDER BY year DESC, semester DESC", (target_id,))
    return records

@router.post("/")
async def add_academic(record: AcademicRecord, current_user: dict = Depends(get_current_user)):
    target_id = await get_target_student_id(current_user, record.studentId)
    if not target_id:
        raise HTTPException(status_code=400, detail="Student ID required")
    
    query = """
        INSERT INTO AcademicRecord (studentId, courseName, grade, credits, semester, year, isAP, isHonors)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    params = (target_id, record.courseName, record.grade, record.credits, record.semester, record.year, record.isAP, record.isHonors)
    record_id = execute_commit(query, params)
    return {"id": record_id, **record.dict()}

@router.get("/gpa")
async def get_gpa(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    target_id = await get_target_student_id(current_user, studentId)
    if not target_id:
        raise HTTPException(status_code=400, detail="Student ID required")
        
    records = execute_query("SELECT * FROM AcademicRecord WHERE studentId = %s", (target_id,))
    current_gpa = calculate_gpa(records)
    return {"currentGPA": current_gpa, "potentialGPA": current_gpa}

@router.get("/report-data")
async def get_report_data(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    target_id = await get_target_student_id(current_user, studentId)
    if not target_id:
        raise HTTPException(status_code=400, detail="Student ID required")
        
    records = execute_query("SELECT * FROM AcademicRecord WHERE studentId = %s ORDER BY year ASC, semester ASC", (target_id,))
    
    grade_points = {
        "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
        "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "F": 0.0
    }
    
    trend = []
    for r in records:
        trend.append({
            "semester": f"{r['semester']} {r['year']}",
            "gpa": grade_points.get(r["grade"] or "", 0.0),
            "course": r["courseName"]
        })
    return trend
