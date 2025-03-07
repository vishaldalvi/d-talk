
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import os
import uuid
from dotenv import load_dotenv

from app.models import User, UserCreate, UserOut, Token
from app.database import users_db
from app.auth import (
    authenticate_user, create_access_token, get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES, get_user
)
from app.centrifugo import generate_centrifugo_token

# Load environment variables
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
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Update user status
    user.status = "online"
    
    # Generate Centrifugo token
    centrifugo_token = await generate_centrifugo_token(user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut(
            id=user.id,
            username=user.username,
            name=user.name,
            avatar=user.avatar,
            status=user.status
        ),
        "centrifugo_token": centrifugo_token,
        "centrifugo_ws_url": os.getenv("CENTRIFUGO_WS_URL")
    }

@router.post("/register", response_model=UserOut)
async def register_user(user_data: UserCreate):
    if get_user(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        id=user_id,
        username=user_data.username,
        name=user_data.name,
        avatar=user_data.avatar,
        password_hash=hashed_password,
        status="online"
    )
    
    users_db[user_data.username] = new_user
    
    return UserOut(
        id=new_user.id,
        username=new_user.username,
        name=new_user.name,
        avatar=new_user.avatar,
        status=new_user.status
    )
