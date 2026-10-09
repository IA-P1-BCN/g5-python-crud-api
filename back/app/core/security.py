import jwt
from jwt import PyJWKClient

from back.app.config.settings import settings

SUPABASE_ISSUER = f"{settings.supabase_url.rstrip('/')}/auth/v1"
SUPABASE_JWKS_URL = f"{SUPABASE_ISSUER}/.well-known/jwks.json"

jwks_client = PyJWKClient(SUPABASE_JWKS_URL)


def decode_access_token(token: str) -> dict:
    signing_key = jwks_client.get_signing_key_from_jwt(token)

    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["ES256"],
        audience="authenticated",
        issuer=SUPABASE_ISSUER,
        options={
            "require": ["exp", "sub", "aud", "iss"],
        },
    )
