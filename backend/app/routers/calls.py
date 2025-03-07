
from fastapi import APIRouter, Depends, HTTPException, status

from app.models import User, CallSignal
from app.auth import get_current_user
from app.centrifugo import publish_to_centrifugo

router = APIRouter(
    prefix="/call",
    tags=["calls"]
)

@router.post("/signal")
async def call_signal(
    signal: CallSignal,
    current_user: User = Depends(get_current_user)
):
    # Check if current user is either caller or callee
    if current_user.id != signal.caller_id and current_user.id != signal.callee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to send this signal"
        )
    
    # Determine the recipient
    recipient_id = signal.callee_id if current_user.id == signal.caller_id else signal.caller_id
    recipient_channel = f"user:{recipient_id}"
    
    # Publish signal to recipient's channel
    await publish_to_centrifugo(recipient_channel, {
        "type": "call_signal",
        "data": {
            "call_id": signal.call_id,
            "caller_id": signal.caller_id,
            "callee_id": signal.callee_id,
            "call_type": signal.call_type,
            "signal_type": signal.signal_type,
            "payload": signal.payload
        }
    })
    
    return {"status": "signal_sent"}
