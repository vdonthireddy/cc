from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query, execute_commit
from ..auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ECRecord(BaseModel):
    name: str
    role: Optional[str] = None
    impactDescription: Optional[str] = None
    hoursPerWeek: Optional[int] = 0
    weeksPerYear: Optional[int] = 0
    studentId: Optional[int] = None

async def get_target_student_id(user, requested_student_id):
    if user["role"].upper() == "STUDENT":
        student = execute_query("SELECT id FROM Student WHERE userId = %s", (user["id"],), fetch_one=True)
        return student["id"] if student else None
    if (user["role"].upper() in ["ADMIN", "COUNSELOR"]) and requested_student_id:
        return int(requested_student_id)
    return None

@router.get("/")
async def get_ecs(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    target_id = await get_target_student_id(current_user, studentId)
    if not target_id:
        raise HTTPException(status_code=400, detail="Student ID required")
        
    ecs = execute_query("SELECT * FROM Extracurricular WHERE studentId = %s ORDER BY createdAt DESC", (target_id,))
    return ecs

@router.post("/")
async def add_ec(ec: ECRecord, current_user: dict = Depends(get_current_user)):
    target_id = await get_target_student_id(current_user, ec.studentId)
    if not target_id:
        raise HTTPException(status_code=400, detail="Student ID required")
        
    query = """
        INSERT INTO Extracurricular (studentId, name, role, impactDescription, hoursPerWeek, weeksPerYear)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    params = (target_id, ec.name, ec.role, ec.impactDescription, ec.hoursPerWeek, ec.weeksPerYear)
    ec_id = execute_commit(query, params)
    return {"id": ec_id, **ec.dict()}

@router.post("/find-clubs")
async def find_clubs(studentId: int, current_user: dict = Depends(get_current_user)):
    # Mock club discovery logic (previously triggered an agent)
    return {"message": "Scout agent triggered (Simulated)", "studentId": studentId}
