import jwt

from back.app.config.settings import settings


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.supabase_jwt_secret,
        algorithms=["HS256"],
        audience="authenticated",
        options={
            "require": ["exp", "sub"],
        },
    )
