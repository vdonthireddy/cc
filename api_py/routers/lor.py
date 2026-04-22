from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query, execute_commit
from ..auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import traceback

router = APIRouter()

class LORRequest(BaseModel):
    teacherName: str
    subject: str
    status: Optional[str] = "Requested"
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
def get_lors(studentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    try:
        target_id = get_target_student_id(current_user, studentId)
        if not target_id:
            if current_user["role"].upper() in ["ADMIN", "COUNSELOR"]:
                return []
            raise HTTPException(status_code=400, detail="Student ID required")
            
        lors = execute_query("SELECT * FROM LORRequest WHERE studentId = %s ORDER BY createdAt DESC", (target_id,))
        return lors
    except HTTPException:
        raise
    except Exception as e:
        print(f"[LOR] Exception in GET /: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def add_lor(lor: LORRequest, current_user: dict = Depends(get_current_user)):
    try:
        target_id = get_target_student_id(current_user, lor.studentId)
        if not target_id:
            raise HTTPException(status_code=400, detail="Student ID required")
            
        query = """
            INSERT INTO LORRequest (studentId, teacherName, subject, status)
            VALUES (%s, %s, %s, %s)
        """
        params = (target_id, lor.teacherName, lor.subject, lor.status)
        lor_id = execute_commit(query, params)
        return {"id": lor_id, **lor.dict()}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[LOR] Exception in POST /: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
