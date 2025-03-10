
import httpx
import os
from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Centrifugo settings
CENTRIFUGO_API_KEY = os.getenv("CENTRIFUGO_API_KEY", "")
CENTRIFUGO_API_URL = os.getenv("CENTRIFUGO_API_URL", "http://localhost:8001/api")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Centrifugo functions
async def publish_to_centrifugo(channel: str, data: dict):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"apikey {CENTRIFUGO_API_KEY}"
    }
    payload = {
        "method": "publish",
        "params": {
            "channel": channel,
            "data": data
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            CENTRIFUGO_API_URL,
            headers=headers,
            json=payload
        )
        if response.status_code != 200:
            print(f"Failed to publish to Centrifugo: {response.text}")
            return False
        return True

async def generate_centrifugo_token(user_id: str):
    expire = datetime.utcnow() + timedelta(days=1)
    
    claims = {
        "sub": user_id,
        "exp": expire.timestamp()
    }
    
    token = jwt.encode(claims, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token
