from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query, execute_commit
from ..auth import get_current_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class LORRequest(BaseModel):
    studentId: int
    teacherName: str
    teacherEmail: str
    deadline: Optional[str] = None

@router.post("/request")
async def request_lor(req: LORRequest, current_user: dict = Depends(get_current_user)):
    deadline_date = datetime.fromisoformat(req.deadline) if req.deadline else None
    query = """
        INSERT INTO RecommendationRequest (studentId, teacherName, teacherEmail, status, deadline)
        VALUES (%s, %s, %s, 'requested', %s)
    """
    params = (req.studentId, req.teacherName, req.teacherEmail, deadline_date)
    lor_id = execute_commit(query, params)
    print(f"Mock email sent to {req.teacherEmail} for LoR request")
    return {"id": lor_id, "status": "requested"}

@router.get("/")
async def get_lors(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user["role"].upper()
    
    query = "SELECT r.*, s.id as studentTableId, u.name as studentName FROM RecommendationRequest r JOIN Student s ON r.studentId = s.id JOIN User u ON s.userId = u.id"
    params = []
    
    if user_role == "STUDENT":
        student = execute_query("SELECT id FROM Student WHERE userId = %s", (user_id,), fetch_one=True)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        query += " WHERE r.studentId = %s"
        params.append(student["id"])
    elif studentId:
        query += " WHERE r.studentId = %s"
        params.append(int(studentId))
        
    lors = execute_query(query, tuple(params))
    # Nest student data for frontend compatibility
    for lor in lors:
        lor["student"] = {"user": {"name": lor["studentName"]}}
    return lors
