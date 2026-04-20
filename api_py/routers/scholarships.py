from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query
from ..auth import get_current_user
from typing import Optional

router = APIRouter()

@router.get("/")
async def get_scholarships(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    scholarships = execute_query("SELECT * FROM Scholarship")
    
    if studentId:
        student_id = int(studentId)
        # Fetch academic records to calculate GPA for matching
        records = execute_query("SELECT grade, credits, isAP, isHonors FROM AcademicRecord WHERE studentId = %s", (student_id,))
        
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
            
        gpa = total_points / total_credits if total_credits > 0 else 0.0
        
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
