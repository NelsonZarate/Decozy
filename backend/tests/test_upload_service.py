"""Tests for the UploadService."""

import os
import tempfile
from unittest.mock import MagicMock, patch

import pytest

from app.services.upload import ALLOWED_EXTENSIONS, MAX_FILE_SIZE, UploadService


class TestSaveUploadedFile:
    """Unit tests for UploadService.save_uploaded_file."""

    def test_rejects_invalid_content_type(self):
        file = MagicMock()
        file.content_type = "application/pdf"
        file.size = 1000
        file.filename = "test.pdf"

        with pytest.raises(ValueError, match="Formato inválido"):
            UploadService.save_uploaded_file(file)

    def test_rejects_oversized_file(self):
        file = MagicMock()
        file.content_type = "image/png"
        file.size = MAX_FILE_SIZE + 1
        file.filename = "big.png"

        with pytest.raises(ValueError, match="demasiado grande"):
            UploadService.save_uploaded_file(file)

    # @patch("app.services.upload.settings")
    # def test_saves_valid_file(self, mock_settings):
    #     with tempfile.TemporaryDirectory() as tmpdir:
    #         mock_settings.upload_dir = tmpdir

    #         file = MagicMock()
    #         file.content_type = "image/png"
    #         file.size = 1000
    #         file.filename = "room.png"
    #         file.file = MagicMock()
    #         file.file.read = MagicMock(return_value=b"fake png data")

    #         filename = UploadService.save_uploaded_file(file)

    #         assert filename.endswith(".png")
    #         assert os.path.exists(os.path.join(tmpdir, filename))


class TestSaveBytesToFile:
    """Unit tests for UploadService.save_bytes_to_file."""

    @patch("app.services.upload.settings")
    def test_saves_bytes_with_prefix(self, mock_settings):
        with tempfile.TemporaryDirectory() as tmpdir:
            mock_settings.upload_dir = tmpdir

            filename = UploadService.save_bytes_to_file(b"fake image", prefix="item_")

            assert filename.startswith("item_")
            assert filename.endswith(".png")
            assert os.path.exists(os.path.join(tmpdir, filename))
