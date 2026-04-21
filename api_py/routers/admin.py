from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query, execute_commit
from ..auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import json

router = APIRouter()

class SystemConfigUpdate(BaseModel):
    agentConfig: Optional[dict] = None
    featureFlags: Optional[dict] = None
    dataRetentionMonths: Optional[int] = None

@router.get("/config/")
async def get_config(current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    config = execute_query("SELECT * FROM SystemConfig WHERE id = 1", fetch_one=True)
    if not config:
        # Initialize default if missing
        execute_commit("INSERT INTO SystemConfig (id, encryptionKey) VALUES (1, 'default-key')")
        config = execute_query("SELECT * FROM SystemConfig WHERE id = 1", fetch_one=True)
        
    # Handle JSON parsing
    if config["agentConfig"] and isinstance(config["agentConfig"], str):
        config["agentConfig"] = json.loads(config["agentConfig"])
    if config["featureFlags"] and isinstance(config["featureFlags"], str):
        config["featureFlags"] = json.loads(config["featureFlags"])
        
    return config

@router.patch("/config/")
async def update_config(update: SystemConfigUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    query = "UPDATE SystemConfig SET updatedBy = %s"
    params = [current_user["id"]]
    
    if update.agentConfig is not None:
        query += ", agentConfig = %s"
        params.append(json.dumps(update.agentConfig))
    if update.featureFlags is not None:
        query += ", featureFlags = %s"
        params.append(json.dumps(update.featureFlags))
    if update.dataRetentionMonths is not None:
        query += ", dataRetentionMonths = %s"
        params.append(update.dataRetentionMonths)
        
    query += " WHERE id = 1"
    execute_commit(query, tuple(params))
    return {"success": True}

@router.get("/counselors/")
async def get_counselors(active_only: Optional[bool] = False, current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    query = "SELECT id, name, email, isActive FROM User WHERE role = 'COUNSELOR'"
    if active_only:
        query += " AND isActive = TRUE"
    
    counselors = execute_query(query)
    return counselors

class CounselorCreate(BaseModel):
    email: str
    name: str
    password: str

@router.post("/counselors/")
async def create_counselor(counselor: CounselorCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    existing = execute_query("SELECT id FROM User WHERE email = %s", (counselor.email,), fetch_one=True)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    counselor_id = execute_commit(
        "INSERT INTO User (email, name, role, passwordHash, isActive) VALUES (%s, %s, 'COUNSELOR', %s, TRUE)",
        (counselor.email, counselor.name, counselor.password)
    )
    return {"id": counselor_id, "message": "Counselor created"}

class PasswordReset(BaseModel):
    newPassword: str

@router.patch("/counselors/{id}/reset-password/")
async def reset_counselor_password(id: int, reset: PasswordReset, current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    user = execute_query("SELECT id FROM User WHERE id = %s AND role = 'COUNSELOR'", (id,), fetch_one=True)
    if not user:
        raise HTTPException(status_code=404, detail="Counselor not found")
        
    execute_commit("UPDATE User SET passwordHash = %s WHERE id = %s", (reset.newPassword, id))
    return {"success": True, "message": "Password reset successfully"}

@router.patch("/counselors/{id}/toggle-active/")
async def toggle_counselor_active(id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # Get current status
    user = execute_query("SELECT isActive FROM User WHERE id = %s AND role = 'COUNSELOR'", (id,), fetch_one=True)
    if not user:
        raise HTTPException(status_code=404, detail="Counselor not found")
        
    new_status = not user["isActive"]
    execute_commit("UPDATE User SET isActive = %s WHERE id = %s", (new_status, id))
    return {"isActive": new_status}

# Parent Management
@router.get("/parents/")
async def get_parents(current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    parents = execute_query("SELECT id, name, email, isActive FROM User WHERE role = 'PARENT'")
    return parents

class ParentCreate(BaseModel):
    email: str
    name: str
    password: str
    studentIds: Optional[list[int]] = []

@router.post("/parents/")
async def create_parent(parent: ParentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    existing = execute_query("SELECT id FROM User WHERE email = %s", (parent.email,), fetch_one=True)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # 1. Create User
    parent_id = execute_commit(
        "INSERT INTO User (email, name, role, passwordHash, isActive) VALUES (%s, %s, 'PARENT', %s, TRUE)",
        (parent.email, parent.name, parent.password)
    )
    
    # 2. Link to students if provided
    if parent.studentIds:
        for sid in parent.studentIds:
            execute_commit(
                "INSERT INTO StudentParent (studentId, parentId, permissions) VALUES (%s, %s, %s)",
                (sid, parent_id, json.dumps({"viewGrades": True, "viewRoadmap": True}))
            )
        
    return {"id": parent_id, "message": "Parent created"}

@router.patch("/parents/{id}/toggle-active/")
async def toggle_parent_active(id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    user = execute_query("SELECT isActive FROM User WHERE id = %s AND role = 'PARENT'", (id,), fetch_one=True)
    if not user:
        raise HTTPException(status_code=404, detail="Parent not found")
        
    new_status = not user["isActive"]
    execute_commit("UPDATE User SET isActive = %s WHERE id = %s", (new_status, id))
    return {"isActive": new_status}

# Student Management
class StudentCreate(BaseModel):
    email: str
    name: str
    grade: int
    zipCode: str
    majorInterest: Optional[str] = None
    counselorId: Optional[int] = None
    parentId: Optional[int] = None

@router.post("/students/")
async def create_student(student: StudentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # 1. Create User
    user_id = execute_commit(
        "INSERT INTO User (email, name, role, passwordHash) VALUES (%s, %s, 'STUDENT', 'abc123')",
        (student.email, student.name)
    )
    
    # 2. Create Student
    student_id = execute_commit(
        "INSERT INTO Student (userId, grade, zipCode, majorInterest, counselorId) VALUES (%s, %s, %s, %s, %s)",
        (user_id, student.grade, student.zipCode, student.majorInterest, student.counselorId)
    )
    
    # 3. Link parent if provided
    if student.parentId:
        execute_commit(
            "INSERT INTO StudentParent (studentId, parentId, permissions) VALUES (%s, %s, %s)",
            (student_id, student.parentId, json.dumps({"viewGrades": True, "viewRoadmap": True}))
        )
    
    return {"id": user_id, "studentId": student_id, "message": "Student created"}

@router.patch("/students/{id}/")
async def update_student(id: int, update: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    query = "UPDATE Student SET id = id"
    params = []
    
    if "counselorId" in update:
        query += ", counselorId = %s"
        params.append(update["counselorId"] if update["counselorId"] else None)
    if "grade" in update:
        query += ", grade = %s"
        params.append(update["grade"])
    if "zipCode" in update:
        query += ", zipCode = %s"
        params.append(update["zipCode"])
    if "majorInterest" in update:
        query += ", majorInterest = %s"
        params.append(update["majorInterest"])
        
    query += " WHERE id = %s"
    params.append(id)
    execute_commit(query, tuple(params))

    # Handle parent link update
    if "parentId" in update:
        # Delete existing links first for simplicity
        execute_commit("DELETE FROM StudentParent WHERE studentId = %s", (id,))
        if update["parentId"]:
            execute_commit(
                "INSERT INTO StudentParent (studentId, parentId, permissions) VALUES (%s, %s, %s)",
                (id, update["parentId"], json.dumps({"viewGrades": True, "viewRoadmap": True}))
            )
            
    return {"success": True}

@router.get("/reports/")
async def get_admin_reports(current_user: dict = Depends(get_current_user)):
    if current_user["role"].upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # 1. Enrollment by Grade
    enrollment = execute_query("SELECT grade, COUNT(*) as count FROM Student GROUP BY grade ORDER BY grade")
    
    # 2. Counselor Workload
    workload = execute_query("""
        SELECT u.name, COUNT(s.id) as studentCount 
        FROM User u 
        LEFT JOIN Student s ON u.id = s.counselorId 
        WHERE u.role = 'COUNSELOR' 
        GROUP BY u.id
    """)
    
    # 3. Popular Majors
    majors = execute_query("""
        SELECT majorInterest as major, COUNT(*) as count 
        FROM Student 
        WHERE majorInterest IS NOT NULL 
        GROUP BY majorInterest 
        ORDER BY count DESC 
        LIMIT 5
    """)
    
    return {
        "enrollment": enrollment,
        "workload": workload,
        "popularMajors": majors
    }
