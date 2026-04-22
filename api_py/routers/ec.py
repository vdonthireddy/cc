from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query, execute_commit
from ..auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import traceback

router = APIRouter()

class ECRecord(BaseModel):
    name: str
    role: Optional[str] = None
    impactDescription: Optional[str] = None
    hoursPerWeek: Optional[int] = 0
    weeksPerYear: Optional[int] = 0
    studentId: Optional[int] = None

def get_target_student_id(user, requested_student_id):
    role = user["role"].upper()
    if role == "STUDENT":
        student = execute_query("SELECT id FROM Student WHERE userId = %s", (user["id"],), fetch_one=True)
        return student["id"] if student else None
    if (role in ["ADMIN", "COUNSELOR"]):
        if requested_student_id:
            return int(requested_student_id)
        return None
    return None

@router.get("/")
def get_ecs(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    try:
        target_id = get_target_student_id(current_user, studentId)
        if not target_id:
            if current_user["role"].upper() in ["ADMIN", "COUNSELOR"]:
                return []
            raise HTTPException(status_code=400, detail="Student ID required")
            
        ecs = execute_query("SELECT * FROM Extracurricular WHERE studentId = %s ORDER BY createdAt DESC", (target_id,))
        return ecs
    except HTTPException:
        raise
    except Exception as e:
        print(f"[EC] Exception in GET /: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def add_ec(ec: ECRecord, current_user: dict = Depends(get_current_user)):
    try:
        target_id = get_target_student_id(current_user, ec.studentId)
        if not target_id:
            raise HTTPException(status_code=400, detail="Student ID required")
            
        query = """
            INSERT INTO Extracurricular (studentId, name, role, impactDescription, hoursPerWeek, weeksPerYear)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = (target_id, ec.name, ec.role, ec.impactDescription, ec.hoursPerWeek, ec.weeksPerYear)
        ec_id = execute_commit(query, params)
        return {"id": ec_id, **ec.dict()}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[EC] Exception in POST /: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}/")
def delete_ec(id: int, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        user_role = current_user["role"].upper()
        
        if user_role == "STUDENT":
            student = execute_query("SELECT id FROM Student WHERE userId = %s", (user_id,), fetch_one=True)
            if not student:
                raise HTTPException(status_code=404, detail="Student record not found")
            
            record = execute_query("SELECT studentId FROM Extracurricular WHERE id = %s", (id,), fetch_one=True)
            if not record or record["studentId"] != student["id"]:
                raise HTTPException(status_code=403, detail="Forbidden")
                
        execute_commit("DELETE FROM Extracurricular WHERE id = %s", (id,))
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[EC] Exception in DELETE /{id}: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/find-clubs")
def find_clubs(studentId: int, current_user: dict = Depends(get_current_user)):
    return {"message": "Scout agent triggered (Simulated)", "studentId": studentId}
