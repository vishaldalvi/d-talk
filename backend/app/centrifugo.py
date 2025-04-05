import httpx
import os
import json
from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from cent import Client, PublishRequest

# Load environment variables
load_dotenv()

from config_loader import load_config

config = load_config(
    CONFIG_FILE_PATH="/home/neuralit/Music/NextJS/chattt/d-talk/backend/config.ini"
)
CENTRIFUGO = config.get("CENTRIFUGO")

# Centrifugo settings
CENTRIFUGO_API_KEY = CENTRIFUGO.get("api_key", "104fdd55-fd2d-4094-b92e-9aba9da3c5bc")
CENTRIFUGO_API_URL = CENTRIFUGO.get("api_url", "http://10.10.7.28:8001/api")
JWT_SECRET = CENTRIFUGO.get("jwt_secret", "e036b446-a43f-4966-ba22-4cd6506e2580")
JWT_ALGORITHM = CENTRIFUGO.get("jwt_algorithm", "HS256")


async def publish_to_centrifugo(channel: str, data: dict):
    try:
        print("channel: ", channel)
        with Client(CENTRIFUGO_API_URL, CENTRIFUGO_API_KEY) as client:
            request = PublishRequest(channel=channel, data=data)
            result = client.publish(request=request)
            print("Centrifugo error response: ", result)

            return result
    except Exception as e:
        print("Status code:", e)
        return {"error": "Invalid response"}


async def generate_centrifugo_token(user_id: str):
    expire = datetime.utcnow() + timedelta(days=1)

    claims = {"sub": user_id, "exp": expire.timestamp()}

    token = jwt.encode(claims, JWT_SECRET, algorithm=JWT_ALGORITHM)

    print("token", token)
    return token
