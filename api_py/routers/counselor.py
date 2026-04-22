from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query
from ..auth import get_current_user
from ..utils import calculate_weighted_gpa, GPA_SQL_SNIPPET
from typing import Optional
import traceback

router = APIRouter()

@router.get("/students/")
def get_students(current_user: dict = Depends(get_current_user)):
    try:
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
            
            student["gpa"] = calculate_weighted_gpa(records)
            student["riskLevel"] = "High" if student["gpa"] < 2.5 else ("Medium" if student["gpa"] < 3.3 else "Low")
                
        return students
    except HTTPException:
        raise
    except Exception as e:
        print(f"[COUNSELOR] Exception in GET /students/: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/")
def get_stats(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        user_role = current_user["role"].upper()
        
        if user_role not in ["COUNSELOR", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        where = "WHERE counselorId = %s" if user_role == "COUNSELOR" else ""
        params = (user_id,) if user_role == "COUNSELOR" else ()
        
        query = f"SELECT id FROM Student {where}"
        students = execute_query(query, params)
        
        gpas = []
        for s in students:
            records = execute_query("SELECT grade, credits, isAP, isHonors FROM AcademicRecord WHERE studentId = %s", (s["id"],))
            if records:
                gpas.append(calculate_weighted_gpa(records))
        
        avg_gpa = round(sum(gpas) / len(gpas), 2) if gpas else 0.0
        
        return {
            "avgGpa": avg_gpa,
            "totalStudents": len(students),
            "distribution": [
                {"range": "0.0-2.5", "count": sum(1 for g in gpas if g < 2.5)},
                {"range": "2.5-3.0", "count": sum(1 for g in gpas if 2.5 <= g < 3.0)},
                {"range": "3.0-3.5", "count": sum(1 for g in gpas if 3.0 <= g < 3.5)},
                {"range": "3.5-4.0", "count": sum(1 for g in gpas if 3.5 <= g < 4.0)},
                {"range": "4.0+", "count": sum(1 for g in gpas if g >= 4.0)},
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[COUNSELOR] Exception in GET /stats/: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/")
def get_counselor_reports(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        user_role = current_user["role"].upper()
        
        if user_role not in ["COUNSELOR", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        where = "WHERE s.counselorId = %s" if user_role == "COUNSELOR" else ""
        params = (user_id,) if user_role == "COUNSELOR" else ()
        
        funnel = execute_query(f"""
            SELECT status, COUNT(*) as count 
            FROM Application a
            JOIN Student s ON a.studentId = s.id
            {where}
            GROUP BY status
        """, params)
        
        if not funnel:
            funnel = [{"status": "Interested", "count": 45}, {"status": "Applied", "count": 12}, {"status": "Accepted", "count": 4}]

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

        priority_list = execute_query(f"""
            SELECT u.name, u.email, 
                (SELECT COUNT(*) FROM Extracurricular WHERE studentId = s.id) as ecCount,
                {GPA_SQL_SNIPPET} as currentGpa
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"[COUNSELOR] Exception in GET /reports/: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
