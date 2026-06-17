import os
import shutil
import uuid

from fastapi import UploadFile

from app.core.settings import settings

ALLOWED_EXTENSIONS = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024


class UploadService:
    @staticmethod
    def save_uploaded_file(file: UploadFile) -> str:
        """Valida e guarda um ficheiro no disco, retornando o nome único gerado."""
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
