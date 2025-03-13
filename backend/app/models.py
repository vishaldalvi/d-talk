from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime


# User models
class User(BaseModel):
    id: str
    username: str
    name: str
    avatar: str = None
    password_hash: str
    status: int = 1


class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    avatar: Optional[str] = None


class UserOut(BaseModel):
    id: str
    username: str
    name: str
    avatar: Optional[str] = None
    status: int


# Auth models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class TokenData(BaseModel):
    username: str


# Message models
class Message(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    timestamp: datetime
    status: str = "sent"


class MessageCreate(BaseModel):
    receiver_id: str
    content: str


# Call models
class CallSignal(BaseModel):
    call_id: str
    caller_id: str
    callee_id: str
    call_type: str  # "audio" or "video"
    signal_type: str  # "offer", "answer", "ice-candidate", "hangup"
    payload: dict
