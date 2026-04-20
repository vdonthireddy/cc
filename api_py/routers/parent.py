from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import execute_query
from ..auth import get_current_user
from typing import Optional

router = APIRouter()

@router.get("/student")
async def get_parent_student(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user["role"].upper()
    
    if user_role not in ["PARENT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # For demo, take the first student in the system
    # In production, this would join on StudentParent table
    student = execute_query("""
        SELECT s.*, u.name, u.email
        FROM Student s
        JOIN User u ON s.userId = u.id
        LIMIT 1
    """, fetch_one=True)
    
    if not student:
        raise HTTPException(status_code=404, detail="No student found")
        
    # Fetch academics
    academics = execute_query("""
        SELECT semester, grade, courseName
        FROM AcademicRecord
        WHERE studentId = %s
        ORDER BY year DESC, semester DESC
    """, (student["id"],))
    
    return {
        "id": student["id"],
        "name": student["name"],
        "email": student["email"],
        "readinessScore": 82,
        "academics": academics,
        "deadlines": [
            {"date": "2023-11-01", "title": "Stanford Early Decision"},
            {"date": "2023-12-15", "title": "UC Application"}
        ]
    }
