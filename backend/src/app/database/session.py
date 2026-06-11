import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://decozy_user:decozy_password@db:5432/decozy_dev_db"
)

engine = create_engine(
    DATABASE_URL,
    echo=True, 
)

SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

Base = declarative_base()

def get_db() -> Generator:
    """
    Cria uma sessão de base de dados para um pedido específico,
    e garante que ela é fechada após a conclusão do pedido.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()