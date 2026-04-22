from fastapi import FastAPI, Request, Response, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import execute_query
from .auth import create_access_token, verify_password, get_current_user
from .routers import counselor, academic, admin, ec, lor, roadmap, scholarships, parent, documents
import os
import traceback

app = FastAPI(title="Pathfinder API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["set-cookie"]
)

# Simplified Login using standard FastAPI patterns
from pydantic import BaseModel
class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login(data: LoginRequest, response: Response):
    try:
        user = execute_query("SELECT * FROM User WHERE email = %s", (data.email,), fetch_one=True)
        if not user or not verify_password(data.password, user["passwordHash"]):
            raise HTTPException(status_code=400, detail="Invalid email or password")
            
        access_token = create_access_token(data={"sub": str(user["id"])})
        
        response.set_cookie(
            key="auth_session",
            value=access_token,
            httponly=True,
            max_age=60*60*24,
            samesite="lax"
        )
        
        student_id = None
        if user["role"].upper() == "STUDENT":
            student = execute_query("SELECT id FROM Student WHERE userId = %s", (user["id"],), fetch_one=True)
            if student:
                student_id = student["id"]
                
        user_data = {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"].upper(),
        }
        if student_id:
            user_data["studentId"] = student_id
            
        return {"user": user_data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Login Exception: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/me")
def me(current_user: dict = Depends(get_current_user)):
    try:
        user = current_user
        student_id = None
        if user["role"].upper() == "STUDENT":
            student = execute_query("SELECT id FROM Student WHERE userId = %s", (user["id"],), fetch_one=True)
            if student:
                student_id = student["id"]
                
        user_data = {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"].upper(),
        }
        if student_id:
            user_data["studentId"] = student_id
            
        return {"user": user_data}
    except Exception as e:
        print(f"[AUTH] Me Exception: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("auth_session")
    return {"success": True}

@app.get("/api/health")
def health():
    return {"status": "ok"}

# Include routers
app.include_router(counselor.router, prefix="/api/counselor", tags=["counselor"])
app.include_router(academic.router, prefix="/api/academic", tags=["academic"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(ec.router, prefix="/api/ec", tags=["ec"])
app.include_router(lor.router, prefix="/api/lor", tags=["lor"])
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["roadmap"])
app.include_router(scholarships.router, prefix="/api/scholarships", tags=["scholarships"])
app.include_router(parent.router, prefix="/api/parent", tags=["parent"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
