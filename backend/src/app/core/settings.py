from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
# --- Variáveis da Base de Dados (Ajustadas para bater com o teu .env) ---
    database_driver: str = "postgresql+psycopg2"
    database_username: str  # 👈 Mudado de 'database_user' para 'database_username'
    database_password: str
    database_host: str = "database"
    database_port: int = 5432
    database_name: str

    # --- Variáveis com Valores Padrão ---
    secret_key: str = "super_secret_key_de_desenvolvimento_123"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    environment: str = "development"
    port: int = 8000
    upload_dir: str = "static/uploads"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "case_sensitive": False  # 👈 ISTO FAZ O PYDANTIC ACEITAR TANTO 'UPLOAD_DIR' COMO 'upload_dir'!
    }

@lru_cache
def get_settings():
    """
    Função para obter as configurações, com cache para performance.
    """
    return Settings()

settings = get_settings()