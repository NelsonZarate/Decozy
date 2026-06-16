# app/models/user.py
from datetime import date, datetime
from typing import List

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    plan: Mapped[str] = mapped_column(String, default="free", nullable=False)  # free, monthly, annual
    daily_generations_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_generation_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamentos (Instruções em Python, não alteram a DB física)
    identities: Mapped[List["UserIdentityModel"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    projects: Mapped[List["ProjectModel"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    subscription: Mapped["SubscriptionModel"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    saved_items: Mapped[List["UserSavedItemModel"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserIdentityModel(Base):
    __tablename__ = "user_identities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)  # local, google
    provider_user_id: Mapped[str] = mapped_column(String, nullable=True) # ID que vem do Google (vazio se for local)
    password_hash: Mapped[str] = mapped_column(String, nullable=True) # Hash da password (vazio se for google)

    # Relacionamento inverso
    user: Mapped["UserModel"] = relationship(back_populates="identities")