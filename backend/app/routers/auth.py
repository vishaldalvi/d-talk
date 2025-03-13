from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import os
import uuid
from dotenv import load_dotenv

from app.models import User, UserCreate, UserOut, Token
from app.database import get_user_from_db, save_user_to_db, UserDB
from app.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    generate_uuid,
)
from app.centrifugo import generate_centrifugo_token

load_dotenv()

router = APIRouter(tags=["authentication"])


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.get("username")}, expires_delta=access_token_expires
    )

    centrifugo_token = await generate_centrifugo_token(user.get("id", None))

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut(
            id=user.get("id", None),
            username=user.get("username", None),
            name=user.get("name", None),
            avatar=user.get("avatar", None),
            status=user.get("status", None),
        ),
        "centrifugo_token": centrifugo_token,
        "centrifugo_ws_url": os.getenv("CENTRIFUGO_WS_URL"),
    }


@router.post("/register", response_model=UserOut)
async def register_user(user_data: UserCreate):
    try:
        existing_user = get_user_from_db(user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )

        user_id = generate_uuid()
        hashed_password = get_password_hash(user_data.password)

        new_user = UserDB(
            id=user_id,
            username=user_data.username,
            name=user_data.name,
            avatar=str(user_data.avatar) if user_data.avatar else "",
            password_hash=hashed_password,
            status=1,
        )

        save_user_to_db(new_user)

        return UserOut(
            id=new_user.id,
            username=new_user.username,
            name=new_user.name,
            avatar=new_user.avatar,
            status=new_user.status,
        )
    except Exception as e:
        raise ValueError(f"Exception in register_user: {e}")
