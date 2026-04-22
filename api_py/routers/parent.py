from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query
from ..auth import get_current_user
from ..utils import calculate_weighted_gpa
from typing import Optional
import traceback

router = APIRouter()

@router.get("/students/")
def get_parent_students(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        if current_user["role"].upper() not in ["PARENT", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        students = execute_query("""
            SELECT s.id, u.name
            FROM Student s
            JOIN User u ON s.userId = u.id
            JOIN StudentParent sp ON s.id = sp.studentId
            WHERE sp.parentId = %s
        """, (user_id,))
        return students
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PARENT] Exception in GET /students/: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def get_student_detail(studentId: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        user_role = current_user["role"].upper()
        
        if user_role not in ["PARENT", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        # Verify ownership
        if studentId:
            link = execute_query("SELECT studentId FROM StudentParent WHERE studentId = %s AND parentId = %s", (studentId, user_id), fetch_one=True)
            if not link and user_role != "ADMIN":
                raise HTTPException(status_code=403, detail="Access denied")
            target_id = studentId
        else:
            student = execute_query("SELECT studentId FROM StudentParent WHERE parentId = %s LIMIT 1", (user_id,), fetch_one=True)
            if not student:
                student = execute_query("SELECT id as studentId FROM Student LIMIT 1", fetch_one=True)
            if not student:
                raise HTTPException(status_code=404, detail="No student found")
            target_id = student["studentId"]

        student_data = execute_query("SELECT s.*, u.name, u.email FROM Student s JOIN User u ON s.userId = u.id WHERE s.id = %s", (target_id,), fetch_one=True)
        
        # 1. Academics for GPA Trend (Weighted)
        raw_academics = execute_query("""
            SELECT semester, year, grade, courseName, credits, isAP, isHonors
            FROM AcademicRecord 
            WHERE studentId = %s 
            ORDER BY year ASC, CASE WHEN semester='Fall' THEN 1 WHEN semester='Spring' THEN 2 ELSE 3 END ASC
        """, (target_id,))
        
        # Group by semester to show average GPA over time
        semester_groups = {}
        for r in raw_academics:
            key = f"{r['semester']} {r['year']}"
            if key not in semester_groups:
                semester_groups[key] = []
            semester_groups[key].append(r)
        
        trend = []
        for key, group_records in semester_groups.items():
            avg = calculate_weighted_gpa(group_records)
            trend.append({"semester": key, "grade": avg})

        # 2. Dynamic Deadlines
        deadlines = execute_query("""
            SELECT a.deadline as date, c.name as title 
            FROM Application a
            JOIN College c ON a.collegeId = c.id
            WHERE a.studentId = %s AND a.deadline IS NOT NULL
            ORDER BY a.deadline ASC
        """, (target_id,))
        
        if not deadlines:
            deadlines = [
                {"date": "2024-11-01", "title": "Early Action Task"},
                {"date": "2024-12-15", "title": "FAFSA Priority"}
            ]

        # 3. Dynamic Readiness Score
        current_gpa = calculate_weighted_gpa(raw_academics)
        readiness = (current_gpa / 4.0 * 60) + (min(len(raw_academics), 10) * 4)
        
        return {
            "id": student_data["id"],
            "name": student_data["name"],
            "email": student_data["email"],
            "readinessScore": round(min(readiness, 100)),
            "academics": trend,
            "deadlines": deadlines
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PARENT] Exception in GET /: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
