from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.orm import Session

from app.core.settings import settings
from app.database.session import get_db
from app.models.user import UserModel

# Define onde o FastAPI deve procurar o token em caso de documentação no Swagger
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """Dependência Global para extrair apenas o ID do utilizador do JWT"""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: ID ausente.",
            )
        return int(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )


def get_current_user(
    user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)
) -> UserModel:
    """
    (Opcional, mas super útil!)
    Dependência que vai à DB buscar o objeto User completo.
    Útil para quando precisas de validar o plano (free/premium) numa rota.
    """
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilizador não encontrado.",
        )
    return user
