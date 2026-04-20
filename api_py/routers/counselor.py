from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query
from ..auth import get_current_user

router = APIRouter()

@router.get("/students")
async def get_students(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user["role"].upper()
    
    if user_role not in ["COUNSELOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    query = """
        SELECT s.*, u.name, u.email, c.name as counselorName
        FROM Student s
        JOIN User u ON s.userId = u.id
        LEFT JOIN User c ON s.counselorId = c.id
    """
    params = []
    
    if user_role == "COUNSELOR":
        query += " WHERE s.counselorId = %s"
        params.append(user_id)
        
    students = execute_query(query, tuple(params))
    
    # Enrich with GPA (Raw SQL way)
    for student in students:
        # Simplified GPA calculation logic ported to SQL
        academic_query = "SELECT grade, credits, isAP, isHonors FROM AcademicRecord WHERE studentId = %s"
        records = execute_query(academic_query, (student["id"],))
        
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
            
        student["gpa"] = round(total_points / total_credits, 2) if total_credits > 0 else 0.0
        
        # Risk level
        if student["gpa"] < 2.0:
            student["riskLevel"] = "High"
        elif student["gpa"] < 3.0:
            student["riskLevel"] = "Medium"
        else:
            student["riskLevel"] = "Low"
            
    return students

@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user["role"].upper()
    
    if user_role not in ["COUNSELOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # Simplified stats for demo
    query = "SELECT id FROM Student"
    params = []
    if user_role == "COUNSELOR":
        query += " WHERE counselorId = %s"
        params.append(user_id)
        
    students = execute_query(query, tuple(params))
    
    return {
        "avgGpa": 3.85, # Mocked for speed, can be calculated like above
        "totalStudents": len(students),
        "distribution": [
            {"range": "0-1", "count": 0},
            {"range": "1-2", "count": 0},
            {"range": "2-3", "count": 1},
            {"range": "3-4", "count": 5},
            {"range": "4+", "count": 2},
        ]
    }
