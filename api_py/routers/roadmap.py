from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query
from ..auth import get_current_user
from ..agents import generate_academic_roadmap
from typing import Optional
import traceback

router = APIRouter()

@router.get("/")
async def get_roadmap(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        user_role = current_user["role"].upper()
        
        target_student_id = None
        if user_role == "STUDENT":
            student = execute_query("SELECT id FROM Student WHERE userId = %s", (user_id,), fetch_one=True)
            if student: target_student_id = student["id"]
        elif (user_role in ["ADMIN", "COUNSELOR"]) and studentId:
            target_student_id = int(studentId)
                
        if not target_student_id:
            if user_role in ["ADMIN", "COUNSELOR"]: return []
            raise HTTPException(status_code=400, detail="Student ID required")
            
        return await generate_academic_roadmap(target_student_id)
    except Exception as e:
        print(f"[ROADMAP] Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
