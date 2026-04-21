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
    role = user["role"].upper()
    if role == "STUDENT":
        student = execute_query("SELECT id FROM Student WHERE userId = %s", (user["id"],), fetch_one=True)
        return student["id"] if student else None
    
    if role == "PARENT":
        # If studentId provided, verify it's their child
        if requested_student_id:
            link = execute_query("SELECT studentId FROM StudentParent WHERE studentId = %s AND parentId = %s", (requested_student_id, user["id"]), fetch_one=True)
            return int(requested_student_id) if link else None
        # Otherwise default to first child
        student = execute_query("SELECT studentId FROM StudentParent WHERE parentId = %s LIMIT 1", (user["id"],), fetch_one=True)
        return student["studentId"] if student else None

    if (role in ["ADMIN", "COUNSELOR"]) and requested_student_id:
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

@router.get("/readiness/")
async def get_student_readiness(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    target_id = await get_target_student_id(current_user, studentId)
    if not target_id:
        raise HTTPException(status_code=400, detail="Student ID required")
        
    student = execute_query("SELECT grade FROM Student WHERE id = %s", (target_id,), fetch_one=True)
    records = execute_query("SELECT grade, credits, isAP, isHonors FROM AcademicRecord WHERE studentId = %s", (target_id,))
    current_gpa = calculate_gpa(records)
    
    # 1. Milestone Progress
    grade = student["grade"]
    milestones = []
    if grade == 9:
        milestones = [{"task": "Join 2 ECs", "status": "Done"}, {"task": "Course Selection", "status": "Todo"}]
    elif grade == 10:
        milestones = [{"task": "PSAT Prep", "status": "Done"}, {"task": "Summer Internships", "status": "Todo"}]
    elif grade == 11:
        milestones = [{"task": "SAT/ACT", "status": "Todo"}, {"task": "College List", "status": "Todo"}]
    else:
        milestones = [{"task": "Apply", "status": "Todo"}, {"task": "Scholarships", "status": "Todo"}]
        
    # 2. Benchmarks (Simulated target college data)
    benchmarks = [
        {"college": "Reach (Ivy)", "medianGpa": 3.9, "diff": round(current_gpa - 3.9, 2)},
        {"college": "Match (State)", "medianGpa": 3.5, "diff": round(current_gpa - 3.5, 2)},
        {"college": "Safety", "medianGpa": 3.0, "diff": round(current_gpa - 3.0, 2)}
    ]
    
    # 3. Dynamic Readiness Score (Formula: GPA weight 60% + Course Load weight 40%)
    readiness = (current_gpa / 4.0 * 60) + (min(len(records), 10) * 4)
    
    return {
        "currentGpa": current_gpa,
        "milestones": milestones,
        "benchmarks": benchmarks,
        "readinessScore": round(min(readiness, 100))
    }
