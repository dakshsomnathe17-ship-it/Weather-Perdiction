import uuid
from fastapi import APIRouter, Depends
from datetime import datetime
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistory
from app.services.chat.rule_based import RuleBasedProvider

router = APIRouter(prefix="/weather/chat", tags=["Chat"])
chat_provider = RuleBasedProvider()

@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    reply = await chat_provider.generate(req.message, [])
    return ChatResponse(
        reply=reply,
        session_id=session_id,
        timestamp=datetime.utcnow()
    )

@router.get("/history", response_model=ChatHistory)
async def get_chat_history(session_id: str):
    return ChatHistory(
        session_id=session_id,
        messages=[]
    )
