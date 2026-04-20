from fastapi import FastAPI, Request, Response, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import execute_query
from .auth import create_access_token, verify_password, get_current_user
from .routers import counselor, academic, admin, ec, lor, roadmap, scholarships, parent
import os

app = FastAPI(title="Pathfinder API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["set-cookie"]
)

# Authentication Router
@app.post("/api/auth/login")
async def login(request: Request, response: Response):
    body = await request.json()
    email = body.get("email")
    password = body.get("password")
    
    user = execute_query("SELECT * FROM User WHERE email = %s", (email,), fetch_one=True)
    if not user or not verify_password(password, user["passwordHash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    access_token = create_access_token(data={"sub": str(user["id"])})
    
    # Set cookie for Lucia compatibility
    response.set_cookie(
        key="auth_session",
        value=access_token,
        httponly=True,
        max_age=60*60*24,
        samesite="lax"
    )
    
    # Check if student
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

@app.get("/api/auth/me")
async def me(request: Request):
    token = request.cookies.get("auth_session")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    try:
        from jose import jwt
        from .auth import SECRET_KEY, ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")
        
    user = execute_query("SELECT * FROM User WHERE id = %s", (user_id,), fetch_one=True)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
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

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("auth_session")
    return {"success": True}

@app.get("/api/health")
async def health():
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
