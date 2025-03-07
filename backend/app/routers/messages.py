
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
import uuid

from app.models import User, Message, MessageCreate
from app.database import messages_db
from app.auth import get_current_user
from app.centrifugo import publish_to_centrifugo

router = APIRouter(
    prefix="/messages",
    tags=["messages"]
)

@router.post("", response_model=Message)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    # Create new message
    message_id = str(uuid.uuid4())
    new_message = Message(
        id=message_id,
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        content=message_data.content,
        timestamp=datetime.utcnow(),
        status="sent"
    )
    
    # Save to database
    messages_db.append(new_message)
    
    # Publish to both sender and receiver channels
    sender_channel = f"user:{current_user.id}"
    receiver_channel = f"user:{message_data.receiver_id}"
    
    message_dict = {
        "id": new_message.id,
        "sender_id": new_message.sender_id,
        "receiver_id": new_message.receiver_id,
        "content": new_message.content,
        "timestamp": new_message.timestamp.isoformat(),
        "status": new_message.status
    }
    
    # Publish to sender's channel
    await publish_to_centrifugo(sender_channel, {
        "type": "message_sent",
        "data": message_dict
    })
    
    # Publish to receiver's channel
    await publish_to_centrifugo(receiver_channel, {
        "type": "message_received",
        "data": message_dict
    })
    
    return new_message

@router.get("/{contact_id}", response_model=List[Message])
async def get_messages(
    contact_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get messages between current user and contact
    user_messages = [
        message for message in messages_db
        if (message.sender_id == current_user.id and message.receiver_id == contact_id) or
           (message.sender_id == contact_id and message.receiver_id == current_user.id)
    ]
    
    # Sort by timestamp
    user_messages.sort(key=lambda x: x.timestamp)
    
    return user_messages

@router.post("/{message_id}/status")
async def update_message_status(
    message_id: str,
    status: str,
    current_user: User = Depends(get_current_user)
):
    # Find message
    message = next((m for m in messages_db if m.id == message_id), None)
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Update status
    message.status = status
    
    # Notify sender about status change
    sender_channel = f"user:{message.sender_id}"
    
    await publish_to_centrifugo(sender_channel, {
        "type": "message_status_updated",
        "data": {
            "message_id": message_id,
            "status": status
        }
    })
    
    return {"status": "updated"}
