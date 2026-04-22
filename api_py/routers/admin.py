from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query, execute_commit
from ..auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import json
import traceback

router = APIRouter()

class AdminConfig(BaseModel):
    agentConfig: Optional[dict] = None
    featureFlags: Optional[dict] = None
    dataRetentionMonths: Optional[int] = None

@router.get("/config/")
def get_config(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"].upper() != "ADMIN":
            raise HTTPException(status_code=403, detail="Forbidden")
            
        config = execute_query("SELECT * FROM SystemConfig LIMIT 1", fetch_one=True)
        if config:
            # Parse JSON strings
            config["agentConfig"] = json.loads(config["agentConfig"]) if isinstance(config["agentConfig"], str) else config["agentConfig"]
            config["featureFlags"] = json.loads(config["featureFlags"]) if isinstance(config["featureFlags"], str) else config["featureFlags"]
        return config
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN] Exception in GET /config/: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/config/")
def update_config(data: AdminConfig, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"].upper() != "ADMIN":
            raise HTTPException(status_code=403, detail="Forbidden")
            
        # Get existing
        config = execute_query("SELECT id FROM SystemConfig LIMIT 1", fetch_one=True)
        if not config:
            raise HTTPException(status_code=404, detail="Config not found")
            
        updates = []
        params = []
        if data.agentConfig is not None:
            updates.append("agentConfig = %s")
            params.append(json.dumps(data.agentConfig))
        if data.featureFlags is not None:
            updates.append("featureFlags = %s")
            params.append(json.dumps(data.featureFlags))
        if data.dataRetentionMonths is not None:
            updates.append("dataRetentionMonths = %s")
            params.append(data.dataRetentionMonths)
            
        if updates:
            query = f"UPDATE SystemConfig SET {', '.join(updates)} WHERE id = %s"
            params.append(config["id"])
            execute_commit(query, tuple(params))
            
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN] Exception in PATCH /config/: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/counselors/")
def get_counselors(active_only: bool = False, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"].upper() != "ADMIN":
            raise HTTPException(status_code=403, detail="Forbidden")
            
        query = "SELECT id, email, name, isActive FROM User WHERE role = 'COUNSELOR'"
        if active_only:
            query += " AND isActive = 1"
        return execute_query(query)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN] Exception in GET /counselors/: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/")
def get_admin_reports(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"].upper() != "ADMIN":
            raise HTTPException(status_code=403, detail="Forbidden")
            
        # 1. Monthly Enrollment
        enrollment = [
            {"month": "Jan", "count": 45}, {"month": "Feb", "count": 52},
            {"month": "Mar", "count": 61}, {"month": "Apr", "count": 78}
        ]
        
        # 2. Counselor Workload
        workload = execute_query("""
            SELECT u.name as counselor, COUNT(s.id) as studentCount
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN] Exception in GET /reports/: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
