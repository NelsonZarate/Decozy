from datetime import datetime, timedelta, timezone
import hashlib
from typing import Optional

import bcrypt
from jose import jwt

from app.core.settings import settings

PASSWORD_HASH_PREFIX = "sha256_bcrypt$"


class SecurityUtils:
    @staticmethod
    def _password_bytes(password: str) -> bytes:
        return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("ascii")

    @staticmethod
    def hash_password(password: str) -> str:
        hashed = bcrypt.hashpw(SecurityUtils._password_bytes(password), bcrypt.gensalt())
        return f"{PASSWORD_HASH_PREFIX}{hashed.decode('ascii')}"

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        if hashed_password.startswith(PASSWORD_HASH_PREFIX):
            stored_hash = hashed_password.removeprefix(PASSWORD_HASH_PREFIX)
            return bcrypt.checkpw(
                SecurityUtils._password_bytes(plain_password),
                stored_hash.encode("ascii"),
            )

        if len(plain_password.encode("utf-8")) > 72:
            return False

        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("ascii")
        )

    @staticmethod
    def create_access_token(
        user_id: int, expires_delta: Optional[timedelta] = None
    ) -> str:
        """Gera o JWT Token do Decozy para mandar ao Frontend"""
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=settings.access_token_expire_minutes
            )

        to_encode = {"sub": str(user_id), "exp": expire}
        encoded_jwt = jwt.encode(
            to_encode, settings.secret_key, algorithm=settings.algorithm
        )
        return encoded_jwt
