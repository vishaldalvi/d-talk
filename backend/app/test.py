from datetime import datetime, timedelta
import jwt


def generate_centrifugo_token1(user_id: str):
    expire = datetime.utcnow() + timedelta(days=1)

    claims = {"sub": user_id, "exp": expire.timestamp()}

    token = jwt.encode(
        claims,
        "kvaXAImTS4A95m2PtJyfdZcNgtl8-_8Wg6ar9aPaCoNWIKj2bvzHomLYatwhceeAAnAVzwQz4a37PqeHt9vdQg",
        algorithm="HS256",
    )

    print("token", token)
    return token


generate_centrifugo_token1("shubham.po")
