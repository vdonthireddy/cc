from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..llm import llm
from ..auth import get_current_user
import traceback

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str

@router.post("/")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Pass user name/role as context to personalize response
        full_prompt = f"System: You are an advisor on 'Pathfinder', a college admissions platform. User is {current_user['name']} ({current_user['role']}).\nUser: {request.prompt}"
        
        response = await llm.generate_content(full_prompt)
        return {"response": response}
    except Exception as e:
        print(f"[CHAT] Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
