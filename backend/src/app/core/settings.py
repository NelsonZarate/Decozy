from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int

    database_driver: str
    database_username: str
    database_password: str
    database_host: str
    database_port: int
    database_name: str

    environment: str
    port: int
    
    class Config:
        env_file = ".env"

@lru_cache
def get_settings():
    """
    Função para obter as configurações, com cache para performance.
    """
    return Settings()

settings = get_settings()