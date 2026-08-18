from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatMessageSchema(BaseModel):
    role: str
    content: str
    timestamp: datetime

class ChatHistory(BaseModel):
    session_id: str
    messages: List[ChatMessageSchema]
