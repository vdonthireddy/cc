from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query
from ..auth import get_current_user
from typing import Optional

router = APIRouter()

@router.get("/")
async def get_roadmap(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user["role"].upper()
    
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
        target_student_id = int(studentId)
        student = execute_query("SELECT grade, majorInterest FROM Student WHERE id = %s", (target_student_id,), fetch_one=True)
        if student:
            current_grade = student["grade"]
            major_interest = student["majorInterest"]
            
    if not target_student_id:
        raise HTTPException(status_code=404, detail="Student not found")
        
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
