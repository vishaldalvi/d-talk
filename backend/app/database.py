import redis
import json
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session, aliased
from sqlalchemy.sql import func
from datetime import datetime
from app.models import User
from config_loader import load_config

config = load_config(
    CONFIG_FILE_PATH="/home/neuralit/Music/NextJS/chattt/d-talk/backend/config.ini"
)

DATABASE = config.get("DATABASE")
DATABASE_URL = f"mysql+pymysql://{DATABASE['username']}:{DATABASE['password']}@{DATABASE['host']}/{DATABASE['database']}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()
Base = declarative_base()

REDIS = config.get("REDIS")
redis_client = redis.Redis(
    host=REDIS["host"], port=REDIS["port"], db=REDIS["db"], decode_responses=True
)


class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    status = Column(Integer, default=1)


class MessageDB(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="sent")


def get_user_from_db(username: str = None):
    """Fetch a user by username or get all users."""
    try:
        if not username:
            redis_key = "user:all"
            cached_users = redis_client.get(redis_key)

            if cached_users:
                return json.loads(cached_users)

            users = db.query(UserDB).order_by(UserDB.name).all()
            user_list = [
                {
                    key: str(getattr(user, key))
                    for key in vars(user)
                    if not key.startswith("_")
                }
                for user in users
            ]

            redis_client.setex(redis_key, 3600, json.dumps(user_list))
            return user_list

        redis_key = f"user:{username}"
        cached_user = redis_client.get(redis_key)

        if cached_user:
            return json.loads(cached_user)

        user = db.query(UserDB).filter(UserDB.username == username).first()

        if user:
            user_dict = {
                key: str(getattr(user, key))
                for key in vars(user)
                if not key.startswith("_")
            }
            redis_client.setex(redis_key, 3600, json.dumps(user_dict))
            return user_dict

        return None

    except Exception as e:
        raise ValueError(f"Exception in get_user_from_db: {e}")


def save_user_to_db(user_data: UserDB):
    """Save a new user to the database."""
    try:
        db.add(user_data)
        db.commit()
        db.refresh(user_data)

        redis_key = f"user:{user_data.username}"
        redis_client.setex(
            redis_key,
            3600,
            json.dumps(
                {
                    key: str(getattr(user_data, key))
                    for key in vars(user_data)
                    if not key.startswith("_")
                }
            ),
        )

        return {"message": "User created successfully."}

    except Exception as e:
        raise ValueError(f"Exception in save _user_in_db: {e}")


def get_messages_from_db(user_id: str, contact_id: str):
    """Fetch messages between two users."""
    try:
        # redis_key = f"messages:{user_id}:{contact_id}"
        # cached_messages = redis_client.get(redis_key)

        # if cached_messages:
        #     return json.loads(cached_messages)

        messages = (
            db.query(MessageDB)
            .filter(
                (
                    (MessageDB.sender_id == user_id)
                    & (MessageDB.receiver_id == contact_id)
                )
                | (
                    (MessageDB.sender_id == contact_id)
                    & (MessageDB.receiver_id == user_id)
                )
            )
            .order_by(MessageDB.timestamp)
            .distinct(MessageDB.id)
            .all()
        )

        messages_list = [
            {
                "id": msg.id,
                "sender_id": msg.sender_id,
                "receiver_id": msg.receiver_id,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat(),
                "status": msg.status,
                "isSent": bool(msg.sender_id == user_id),
            }
            for msg in messages
        ]

        # redis_client.setex(redis_key, 3600, json.dumps(messages_list))

        return messages_list

    except Exception as e:
        print(f"Exception in get_messages_from_db: {e}")
        return []


def save_message_to_db(message: MessageDB):
    """Save a message and update cache."""
    try:
        db.add(message)
        db.commit()
        db.refresh(message)

        redis_key = f"messages:{message.sender_id}:{message.receiver_id}"
        messages = get_messages_from_db(message.sender_id, message.receiver_id)
        messages.append(
            {
                key: str(getattr(message, key))
                for key in vars(message)
                if not key.startswith("_")
            }
        )
        redis_client.setex(redis_key, 3600, json.dumps(messages))

    except Exception as e:
        raise ValueError(f"Exception in save_messages_to_db: {e}")


def get_all_contacts():
    """Fetch all contacts from DB or Redis cache."""
    try:
        redis_key = "contacts:all"
        cached_contacts = redis_client.get(redis_key)

        if cached_contacts:
            return json.loads(cached_contacts)

        contacts = db.query(UserDB).all()

        formatted_contacts = [
            {
                "id": str(contact.id),
                "name": contact.name,
                "avatar": contact.avatar if contact.avatar else None,
                "status": contact.status,
                "lastMessage": getattr(contact, "last_message", None),
                "lastMessageTime": getattr(contact, "last_message_time", None),
                "unreadCount": getattr(contact, "unread_count", 0),
            }
            for contact in contacts
        ]

        redis_client.setex(redis_key, 3600, json.dumps(formatted_contacts))
        return formatted_contacts

    except Exception as e:
        raise ValueError(f"Exception in get_all_contacts: {e}")


def get_users_with_last_message(sender_id: str):
    """Fetch all users with their latest message using ORM query, filtered by sender_id."""
    try:
        latest_msg_subquery = (
            db.query(
                MessageDB.receiver_id,
                func.max(MessageDB.timestamp).label("latest_timestamp"),
            )
            .filter(MessageDB.sender_id == sender_id)
            .group_by(MessageDB.receiver_id)
            .subquery()
        )

        latest_message = aliased(MessageDB)

        results = (
            db.query(
                UserDB.id,
                UserDB.name,
                UserDB.username,
                UserDB.avatar,
                UserDB.status,
                latest_message.content.label("last_message"),
                latest_message.timestamp.label("last_message_time"),
            )
            .outerjoin(
                latest_msg_subquery, UserDB.id == latest_msg_subquery.c.receiver_id
            )
            .outerjoin(
                latest_message,
                (UserDB.id == latest_message.receiver_id)
                & (latest_msg_subquery.c.latest_timestamp == latest_message.timestamp),
            )
            .filter(latest_message.sender_id == sender_id)
            .order_by(latest_message.timestamp.desc())
            .all()
        )

        db.close()

        users_with_messages = [
            {
                "id": str(user.id),
                "username": user.username,
                "name": user.name,
                "avatar": user.avatar if user.avatar else None,
                "status": user.status,
                "lastMessage": user.last_message if user.last_message else None,
                "lastMessageTime": (
                    user.last_message_time.isoformat()
                    if user.last_message_time
                    else None
                ),
            }
            for user in results
        ]

        return users_with_messages

    except Exception as e:
        raise ValueError(f"Exception in get_users_with_last_message: {e}")
