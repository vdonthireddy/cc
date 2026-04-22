from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query
from ..auth import get_current_user
from typing import Optional
import traceback

router = APIRouter()

@router.get("/")
async def get_roadmap(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        user_role = current_user["role"].upper()
        print(f"[ROADMAP] User: {user_id}, Role: {user_role}, Requested studentId: {studentId}")
        
        target_student_id = None
        major_interest = "Other"
        current_grade = 9
        
        if user_role == "STUDENT":
            student = execute_query("SELECT id, grade, majorInterest FROM Student WHERE userId = %s", (user_id,), fetch_one=True)
            if student:
                target_student_id = student["id"]
                current_grade = student["grade"]
                major_interest = student["majorInterest"]
        elif (user_role in ["ADMIN", "COUNSELOR"]) and studentId:
            try:
                target_student_id = int(studentId)
                student = execute_query("SELECT grade, majorInterest FROM Student WHERE id = %s", (target_student_id,), fetch_one=True)
                if student:
                    current_grade = student["grade"]
                    major_interest = student["majorInterest"]
                else:
                    print(f"[ROADMAP] Student with ID {target_student_id} not found in database.")
                    raise HTTPException(status_code=404, detail=f"Student with ID {target_student_id} not found")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid student ID format")
                
        if not target_student_id:
            if user_role in ["ADMIN", "COUNSELOR"]:
                 return [] # Return empty for staff if no student selected yet
            print(f"[ROADMAP] No target_student_id resolved for user {user_id}")
            raise HTTPException(status_code=400, detail="Student ID required")
            
        recommendations = []
        if major_interest == "CS" and current_grade == 10:
            recommendations.append({
                "year": 11,
                "course": "AP Computer Science A",
                "reason": "To strengthen your CS foundation for college applications."
            })
            
        roadmap = [
            {"year": 9, "courses": ["Algebra II Honors", "English 9 Honors", "Biology Honors", "Spanish I", "World History"]},
            {"year": 10, "courses": ["Pre-Calculus Honors", "English 10 Honors", "Chemistry Honors", "Spanish II", "AP World History"]},
            {"year": 11, "courses": ["AP Calculus AB", "AP Physics 1", "English 11 AP Lang", "Spanish III", "AP US History"]},
            {"year": 12, "courses": ["AP Calculus BC", "AP Physics C", "English 12 AP Lit", "Spanish IV Honors", "AP Gov/Econ"]}
        ]
        
        for rec in recommendations:
            for r in roadmap:
                if r["year"] == rec["year"]:
                    r["courses"].append(f"* {rec['course']} (Recommended)")
                    
        return roadmap
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ROADMAP] Exception in GET /: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
