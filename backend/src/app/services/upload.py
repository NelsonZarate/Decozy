"""Upload service for file storage operations."""

import os
import shutil
import uuid

from fastapi import UploadFile

from app.core.settings import settings

ALLOWED_EXTENSIONS: set[str] = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB


class UploadService:
    """Service for handling file uploads and storage."""

    @staticmethod
    def save_uploaded_file(file: UploadFile) -> str:
        """Validate and save an uploaded file to disk.

        Args:
            file: FastAPI UploadFile object.

        Returns:
            Generated unique filename.

        Raises:
            ValueError: If file format is invalid or too large.
        """
        if file.content_type not in ALLOWED_EXTENSIONS:
            raise ValueError("Formato inválido. Apenas JPG, PNG e WEBP são permitidos.")

        if file.size and file.size > MAX_FILE_SIZE:
            raise ValueError("O ficheiro é demasiado grande. O limite máximo é de 5MB.")

        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(settings.upload_dir, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return unique_filename

    @staticmethod
    def save_bytes_to_file(data: bytes, prefix: str = "") -> str:
        """Save raw bytes to disk as a PNG file.

        Args:
            data: Image bytes to save.
            prefix: Optional filename prefix.

        Returns:
            Generated unique filename.
        """
        unique_filename = f"{prefix}{uuid.uuid4()}.png"
        file_path = os.path.join(settings.upload_dir, unique_filename)
        with open(file_path, "wb") as f:
            f.write(data)
        return unique_filename
