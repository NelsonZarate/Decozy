import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.security import SecurityUtils
from app.core.settings import settings
from app.database.session import get_db
from app.models.user import UserIdentityModel, UserModel
from fastapi.security import OAuth2PasswordRequestForm
router = APIRouter(prefix="/auth", tags=["Autenticação"])


# ---- SCHEMAS DE ENTRADA (Pydantic) ----
class LocalRegisterSchema(BaseModel):
    email: EmailStr
    password: str


class LocalLoginSchema(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginSchema(BaseModel):
    id_token: str  # Token que o teu Frontend Next.js recebe da Google


# ---- ENDPOINTS ----


@router.post("/register")
def register_local(data: LocalRegisterSchema, db: Session = Depends(get_db)):
    """Registo tradicional com Email e Password"""
    # 1. Verificar se o email já existe
    user_exists = db.query(UserModel).filter(UserModel.email == data.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Este email já está registado.")

    # 2. Criar o utilizador base
    new_user = UserModel(email=data.email, plan="free")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3. Criar a identidade local (com password em hash)
    hashed_pwd = SecurityUtils.hash_password(data.password)
    identity = UserIdentityModel(
        user_id=new_user.id, provider="local", password_hash=hashed_pwd
    )
    db.add(identity)
    db.commit()

    # 4. Devolve o token de acesso imediato
    token = SecurityUtils.create_access_token(user_id=new_user.id)
    return {"access_token": token, "token_type": "bearer", "user_id": new_user.id}


@router.post("/login")
def login_local(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login tradicional com Email e Password"""
    user_email = form_data.username
    user_password = form_data.password

    user = db.query(UserModel).filter(UserModel.email == user_email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Credenciais inválidas.")

    # Procurar a identidade local deste utilizador
    identity = (
        db.query(UserIdentityModel)
        .filter(
            UserIdentityModel.user_id == user.id, UserIdentityModel.provider == "local"
        )
        .first()
    )

    if not identity or not SecurityUtils.verify_password(
        user_password, identity.password_hash
    ):
        raise HTTPException(status_code=400, detail="Credenciais inválidas.")

    token = SecurityUtils.create_access_token(user_id=user.id)
    return {"access_token": token, "token_type": "bearer", "user_id": user.id}


@router.post("/google")
def login_google(data: GoogleLoginSchema, db: Session = Depends(get_db)):
    """Login / Registo automático via Google OAuth2"""
    # 1. Validar o token diretamente com a API da Google
    google_verify_url = (
        f"https://oauth2.googleapis.com/tokeninfo?id_token={data.id_token}"
    )
    response = requests.get(google_verify_url)

    if response.status_code != 200:
        raise HTTPException(
            status_code=400, detail="Token do Google inválido ou expirado."
        )

    google_user = response.json()

    # Segurança: Verificar se o token foi gerado para o teu Client ID
    if google_user.get("aud") != settings.NEXT_PUBLIC_GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=400, detail="Audience do Token inválida (Fraude)."
        )

    email = google_user.get("email")
    google_id = google_user.get("sub")  # ID único do utilizador no Google

    # 2. Verificar se o utilizador já existe no teu sistema
    user = db.query(UserModel).filter(UserModel.email == email).first()

    if not user:
        # Se não existe, cria um novo utilizador automático
        user = UserModel(email=email, plan="free")
        db.add(user)
        db.commit()
        db.refresh(user)

    # 3. Verificar se já existe a identidade Google para este utilizador
    identity = (
        db.query(UserIdentityModel)
        .filter(
            UserIdentityModel.user_id == user.id, UserIdentityModel.provider == "google"
        )
        .first()
    )

    if not identity:
        # Se ele era local e agora entrou com o Google (ou é 100% novo), cria a identidade Google
        identity = UserIdentityModel(
            user_id=user.id, provider="google", provider_user_id=google_id
        )
        db.add(identity)
        db.commit()

    # 4. Emite o JWT do Decozy
    token = SecurityUtils.create_access_token(user_id=user.id)
    return {"access_token": token, "token_type": "bearer", "user_id": user.id}
