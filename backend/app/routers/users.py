from fastapi import APIRouter, Depends
from typing import List

from app.models import User, UserOut
from app.database import users_db
from app.auth import get_current_user
from app.centrifugo import publish_to_centrifugo

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        username=current_user.username,
        name=current_user.name,
        avatar=current_user.avatar,
        status=current_user.status,
    )


@router.get("", response_model=List[UserOut])
async def get_users(current_user: User = Depends(get_current_user)):
    return [
        UserOut(
            id=user.get("id", None),
            username=user.get("username", None),
            name=user.get("name", None),
            avatar=user.get("avatar", None),
            status=user.get("status", None),
        )
        for user in list(users_db.values())
        if user.get("id", None) != current_user.get("id", None)
    ]


@router.post("/status")
async def update_user_status(
    status: str, current_user: User = Depends(get_current_user)
):
    # Update user status
    user = users_db[current_user.username]
    user.status = status

    # Broadcast status change to all users
    await publish_to_centrifugo(
        "user:all",
        {"type": "user_status_changed", "data": {"user_id": user.id, "status": status}},
    )

    return {"status": "updated"}
