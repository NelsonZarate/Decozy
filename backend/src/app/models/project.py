from datetime import datetime
from typing import List
from sqlalchemy import ForeignKey, String, DateTime, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base

class ProjectModel(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamentos
    user: Mapped["UserModel"] = relationship(back_populates="projects")
    images: Mapped[List["ProjectImageModel"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    generations: Mapped[List["GenerationModel"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class ProjectImageModel(Base):
    __tablename__ = "project_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    image_type: Mapped[str] = mapped_column(String, nullable=False)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project: Mapped["ProjectModel"] = relationship(back_populates="images")


class GenerationModel(Base):
    __tablename__ = "generations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    prompt: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="queued", nullable=False)
    provider: Mapped[str] = mapped_column(String, default="openai", nullable=False)
    provider_job_id: Mapped[str] = mapped_column(String, nullable=True)
    output_url: Mapped[str] = mapped_column(String, nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project: Mapped["ProjectModel"] = relationship(back_populates="generations")