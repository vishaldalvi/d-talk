from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from datetime import timedelta
from app.routers import auth, users, messages, calls

from app.auth import get_user, get_password_hash, create_access_token

# Load environment variables
load_dotenv()

app = FastAPI(title="Chat API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(messages.router)
app.include_router(calls.router)


@app.get("/get_token")
def hello():
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": "vishal.d"}, expires_delta=access_token_expires
    )

    return {"token": access_token}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
