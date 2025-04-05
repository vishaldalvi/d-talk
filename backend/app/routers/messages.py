from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
import uuid

from app.models import User, Message, MessageCreate
from app.database import get_messages_from_db, save_message_to_db, MessageDB
from app.auth import get_current_user
from app.centrifugo import publish_to_centrifugo

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("", response_model=Message)
async def send_message(
    message_data: MessageCreate, current_user: User = Depends(get_current_user)
):
    message_id = str(uuid.uuid4())
    new_message = MessageDB(
        id=message_id,
        sender_id=current_user.get("id"),
        receiver_id=message_data.receiver_id,
        content=message_data.content,
        timestamp=datetime.utcnow(),
        status="sent",
    )

    # Save message to the database
    save_message_to_db(new_message)

    sender_channel = f"user-{current_user.get('id')}"
    receiver_channel = f"user-{message_data.receiver_id}"

    message_dict = {
        "id": new_message.id,
        "sender_id": new_message.sender_id,
        "receiver_id": new_message.receiver_id,
        "content": new_message.content,
        "timestamp": new_message.timestamp.isoformat(),
        "status": new_message.status,
        "isSent": bool(new_message.sender_id != current_user.get("id")),
    }

    # Send real-time message update via Centrifugo
    await publish_to_centrifugo(
        sender_channel, {"type": "message_sent", "data": message_dict}
    )

    message_dict.update({"isSent": True})
    await publish_to_centrifugo(
        receiver_channel, {"type": "message_received", "data": message_dict}
    )

    return Message(**message_dict)


@router.get("/{contact_id}", response_model=List[Message])
async def get_messages(contact_id: str, current_user: User = Depends(get_current_user)):
    try:
        messages = get_messages_from_db(current_user.get("id"), contact_id)
        return messages
    except Exception as e:
        raise ValueError(f"Exception in get_messages : {e}")


# @router.post("/{message_id}/status")
# async def update_message_status(
#     message_id: str, status: str, current_user: User = Depends(get_current_user)
# ):
#     session = SessionLocal()
#     message = session.query(MessageDB).filter(MessageDB.id == message_id).first()

#     if not message:
#         session.close()
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="Message not found"
#         )

#     # Update status in MySQL
#     message.status = status
#     session.commit()
#     session.close()

#     # Update Redis cache
#     redis_key = f"messages:{message.sender_id}:{message.receiver_id}"
#     cached_messages = redis_client.get(redis_key)

#     if cached_messages:
#         messages_list = json.loads(cached_messages)
#         for msg in messages_list:
#             if msg["id"] == message_id:
#                 msg["status"] = status
#         redis_client.setex(redis_key, 3600, json.dumps(messages_list))  # Update cache

#     # Notify sender about status change
#     sender_channel = f"user:{message.sender_id}"

#     await publish_to_centrifugo(
#         sender_channel,
#         {
#             "type": "message_status_updated",
#             "data": {"message_id": message_id, "status": status},
#         },
#     )

#     return {"status": "updated"}
