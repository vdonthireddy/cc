from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import FileResponse
from ..database import execute_query
from ..auth import get_current_user
from typing import List, Optional
import os
import shutil
import uuid
import traceback

router = APIRouter()
UPLOAD_DIR = "uploads"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def get_student_id(user: dict):
    if user["role"].upper() == "STUDENT":
        student = execute_query("SELECT id FROM Student WHERE userId = %s", (user["id"],), fetch_one=True)
        if not student:
            raise HTTPException(status_code=404, detail="Student record not found")
        return student["id"]
    return None

@router.get("/")
def get_documents(studentId: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        user_role = current_user["role"].upper()
        
        target_student_id = studentId
        if user_role == "STUDENT":
            target_student_id = get_student_id(current_user)
        elif not target_student_id:
             # Staff must provide studentId
             return []
             
        query = "SELECT * FROM Document WHERE studentId = %s ORDER BY createdAt DESC"
        documents = execute_query(query, (target_student_id,))
        return documents
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DOCUMENTS] Exception in GET /: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"].upper() != "STUDENT":
             raise HTTPException(status_code=403, detail="Only students can upload documents")
             
        student_id = get_student_id(current_user)
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Save metadata to DB
        query = """
            INSERT INTO Document (studentId, name, type, url)
            VALUES (%s, %s, %s, %s)
        """
        params = (student_id, file.filename, file.content_type, unique_filename)
        doc_id = execute_query(query, params)
        
        return {"id": doc_id, "name": file.filename, "success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DOCUMENTS] Exception in POST /upload: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/share/{doc_id}")
def share_document(doc_id: int, current_user: dict = Depends(get_current_user)):
    # Simple stub for sharing - in a real app, this would generate a signed/temporary link
    # For now, just return a fake link to simulate the UI behavior
    return {"shareLink": f"http://localhost:4000/api/documents/download-direct/{doc_id}?token={uuid.uuid4()}"}

@router.get("/download-direct/{doc_id}")
def download_document(doc_id: int, current_user: dict = Depends(get_current_user)):
    try:
        # Check permissions
        user_id = current_user["id"]
        user_role = current_user["role"].upper()
        
        doc = execute_query("SELECT * FROM Document WHERE id = %s", (doc_id,), fetch_one=True)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
            
        # For simplicity, allow if it's the student's own document or if user is staff
        if user_role == "STUDENT":
            student_id = get_student_id(current_user)
            if doc["studentId"] != student_id:
                raise HTTPException(status_code=403, detail="Forbidden")
        elif user_role not in ["COUNSELOR", "ADMIN"]:
             raise HTTPException(status_code=403, detail="Forbidden")
             
        file_path = os.path.join(UPLOAD_DIR, doc["url"])
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on disk")
            
        return FileResponse(path=file_path, filename=doc["name"], media_type=doc["type"])
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DOCUMENTS] Exception in GET /download-direct/{doc_id}: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
