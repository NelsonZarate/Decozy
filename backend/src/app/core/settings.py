from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Variáveis da Base de Dados ---
    database_driver: str = "postgresql+psycopg2"
    database_username: str
    database_password: str
    database_host: str = "database"
    database_port: int = 5432
    database_name: str

    # --- Variáveis com Valores Padrão AUTH  ---
    secret_key: str = "super_secret_key_de_desenvolvimento_123"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 dia

    environment: str = "development"
    port: int = 8000
    upload_dir: str = "static/uploads"
    # Variaveis para o Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str

    # API KEY
    nvidia_api_key: str
    openai_api_key: str
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    frontend_url: str = "http://localhost:3000"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "case_sensitive": False,
    }


@lru_cache
def get_settings():
    """
    Função para obter as configurações, com cache para performance.
    """
    return Settings()


settings = get_settings()
