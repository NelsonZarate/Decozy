"""Shared pytest fixtures for the Decozy test suite."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.database.session import Base, get_db
from app.main import app

SQLALCHEMY_TEST_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})

# Map PostgreSQL JSONB to SQLite JSON at DDL level
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import JSON

@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

# Monkey-patch JSONB columns to use JSON for SQLite tests
for table in Base.metadata.tables.values():
    for col in table.columns:
        if isinstance(col.type, JSONB):
            col.type = JSON()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def db_session() -> Session:
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    """FastAPI test client with overridden DB dependency."""

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(db_session: Session) -> dict[str, str]:
    """Create a test user and return auth headers with valid JWT."""
    from app.models.user import UserModel, UserIdentityModel
    from jose import jwt
    from app.core.settings import settings

    user = UserModel(email="test@example.com", plan="free")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    identity = UserIdentityModel(user_id=user.id, provider="local", password_hash="fake")
    db_session.add(identity)
    db_session.commit()

    token = jwt.encode({"sub": str(user.id)}, settings.secret_key, algorithm=settings.algorithm)
    return {"Authorization": f"Bearer {token}"}
