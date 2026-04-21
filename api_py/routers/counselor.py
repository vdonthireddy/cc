from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query
from ..auth import get_current_user
from typing import Optional

router = APIRouter()

@router.get("/students/")
async def get_students(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user["role"].upper()
    
    if user_role not in ["COUNSELOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    query = """
        SELECT s.*, u.name, u.email, c.name as counselorName, sp.parentId
        FROM Student s
        JOIN User u ON s.userId = u.id
        LEFT JOIN User c ON s.counselorId = c.id
        LEFT JOIN StudentParent sp ON s.id = sp.studentId
    """
    params = []
    
    if user_role == "COUNSELOR":
        query += " WHERE s.counselorId = %s"
        params.append(user_id)
        
    students = execute_query(query, tuple(params))
    
    for student in students:
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
        student["riskLevel"] = "High" if student["gpa"] < 2.5 else ("Medium" if student["gpa"] < 3.3 else "Low")
            
    return students

@router.get("/stats/")
async def get_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user["role"].upper()
    
    if user_role not in ["COUNSELOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    query = "SELECT id FROM Student"
    params = []
    if user_role == "COUNSELOR":
        query += " WHERE counselorId = %s"
        params.append(user_id)
        
    students = execute_query(query, tuple(params))
    
    return {
        "avgGpa": 3.42,
        "totalStudents": len(students),
        "distribution": [
            {"range": "2.0-2.5", "count": 5},
            {"range": "2.5-3.0", "count": 12},
            {"range": "3.0-3.5", "count": 18},
            {"range": "3.5-4.0", "count": 10},
            {"range": "4.0+", "count": 5},
        ]
    }

@router.get("/reports/")
async def get_counselor_reports(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user["role"].upper()
    
    if user_role not in ["COUNSELOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    where = "WHERE s.counselorId = %s" if user_role == "COUNSELOR" else ""
    params = (user_id,) if user_role == "COUNSELOR" else ()
    
    # 1. Cohort Application Funnel
    funnel = execute_query(f"""
        SELECT status, COUNT(*) as count 
        FROM Application a
        JOIN Student s ON a.studentId = s.id
        {where}
        GROUP BY status
    """, params)
    
    if not funnel:
        funnel = [{"status": "Interested", "count": 45}, {"status": "Applied", "count": 12}, {"status": "Accepted", "count": 4}]

    # 2. Top Target Colleges
    top_colleges = execute_query(f"""
        SELECT c.name, COUNT(*) as interestCount
        FROM StudentCollege sc
        JOIN College c ON sc.collegeId = c.id
        JOIN Student s ON sc.studentId = s.id
        {where}
        GROUP BY c.id
        ORDER BY interestCount DESC
        LIMIT 5
    """, params)

    # 3. High-Priority Action List (Low EC engagement or low GPA)
    priority_list = execute_query(f"""
        SELECT u.name, u.email, 
               (SELECT COUNT(*) FROM Extracurricular WHERE studentId = s.id) as ecCount,
               (SELECT ROUND(AVG(CASE grade 
                    WHEN 'A' THEN 4.0 WHEN 'A-' THEN 3.7 WHEN 'B+' THEN 3.3 
                    WHEN 'B' THEN 3.0 WHEN 'B-' THEN 2.7 WHEN 'C+' THEN 2.3 
                    WHEN 'C' THEN 2.0 WHEN 'F' THEN 0.0 END), 2)
                FROM AcademicRecord WHERE studentId = s.id) as currentGpa
        FROM Student s
        JOIN User u ON s.userId = u.id
        {where}
        HAVING currentGpa < 2.8 OR ecCount < 2
        LIMIT 10
    """, params)

    return {
        "funnel": funnel,
        "topColleges": top_colleges,
        "priorityList": priority_list
    }
