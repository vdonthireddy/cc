from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..agents import get_interview_feedback
from ..auth import get_current_user
from ..database import execute_query
import traceback

router = APIRouter()

class InterviewRequest(BaseModel):
    question: str
    answer: str

@router.post("/feedback")
async def interview_feedback(data: InterviewRequest, current_user: dict = Depends(get_current_user)):
    try:
        student_id = None
        if current_user["role"] == "STUDENT":
            student = execute_query("SELECT id FROM Student WHERE userId = %s", (current_user["id"],), fetch_one=True)
            if student: student_id = student["id"]
        
        if not student_id:
            raise HTTPException(status_code=400, detail="Only students can get feedback.")
            
        return await get_interview_feedback(student_id, data.question, data.answer)
    except Exception as e:
        print(f"[INTERVIEW] Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
