from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query
from ..auth import get_current_user
from ..utils import calculate_weighted_gpa
from typing import Optional

router = APIRouter()

@router.get("/")
async def get_scholarships(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    scholarships = execute_query("SELECT * FROM Scholarship")
    
    if studentId:
        student_id = int(studentId)
        # Fetch academic records to calculate GPA for matching
        records = execute_query("SELECT grade, credits, isAP, isHonors FROM AcademicRecord WHERE studentId = %s", (student_id,))
        
        gpa = calculate_weighted_gpa(records)
        
        matched = []
        for s in scholarships:
            if s["minGpa"] and gpa < s["minGpa"]:
                continue
            # Logic: Academic Excellence Scholarship requires GPA > 3.5
            if s["name"] == "Academic Excellence Scholarship" and gpa <= 3.5:
                continue
            matched.append(s)
        return matched
        
    return scholarships
