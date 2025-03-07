from typing import Dict, List
from app.models import User, Message

# In-memory database
users_db: Dict[str, User] = {
    "vishal.d": {
        "id": 1,
        "username": "vishal.d",
        "name": "Vishal Dalvi",
        "avatar": None,
        "password_hash": "$2b$12$m8cQzeS7ri.lpzESMP78Yu9Vx/JTJvd88BXBW1Y2prSxSCNNAegii",
        "status": "offline",
    }
}
messages_db: List[Message] = []
