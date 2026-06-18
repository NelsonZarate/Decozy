"""AI service for image generation and editing via OpenAI API."""

import base64
import io

import requests
from PIL import Image

from app.core.logging import get_logger
from app.core.settings import settings

logger = get_logger(__name__)

OPENAI_API_URL = "https://api.openai.com/v1/images"


class AIService:
    """Service for AI-powered image generation and editing."""

    OUTPUT_IMAGE_SIZE: int = 1024

    @staticmethod
    def _openai_headers() -> dict[str, str]:
        """Return authorization headers for OpenAI API."""
        return {"Authorization": f"Bearer {settings.openai_api_key}"}

    @staticmethod
    def _to_png_bytes(image_bytes: bytes) -> bytes:
        """Convert any image bytes to PNG format.

        Args:
            image_bytes: Raw image bytes in any supported format.

        Returns:
            Image bytes in PNG format.
        """
        with Image.open(io.BytesIO(image_bytes)) as img:
            output = io.BytesIO()
            img.save(output, format="PNG")
            return output.getvalue()

    @staticmethod
    def generate_image_with_flux(
        input_image_path: str,
        optimized_prompt: str,
    ) -> bytes:
        """Edit an image using OpenAI gpt-image-1.

        Args:
            input_image_path: Path to the input image file.
            optimized_prompt: Optimized prompt for image editing.

        Returns:
            Generated image as PNG bytes.

        Raises:
            ValueError: If prompt is empty.
            requests.exceptions.HTTPError: On API failure.
        """
        if not optimized_prompt or not optimized_prompt.strip():
            raise ValueError("O prompt otimizado é obrigatório.")

        with open(input_image_path, "rb") as f:
            raw_bytes = f.read()
        png_bytes = AIService._to_png_bytes(raw_bytes)

        logger.info("Calling OpenAI image edit API")
        response = requests.post(
            f"{OPENAI_API_URL}/edits",
            headers=AIService._openai_headers(),
            files={"image": ("image.png", png_bytes, "image/png")},
            data={
                "prompt": optimized_prompt,
                "model": "gpt-image-1",
                "size": f"{AIService.OUTPUT_IMAGE_SIZE}x{AIService.OUTPUT_IMAGE_SIZE}",
            },
            timeout=180,
        )
        response.raise_for_status()
        result = response.json()
        b64 = result["data"][0]["b64_json"]
        logger.info("OpenAI image edit completed successfully")
        return AIService._to_png_bytes(base64.b64decode(b64))

    @staticmethod
    def generate_item_image(item_description: str) -> bytes:
        """Generate a product image for a furniture item.

        Args:
            item_description: Description of the item to generate.

        Returns:
            Generated product image as PNG bytes.

        Raises:
            requests.exceptions.HTTPError: On API failure.
        """
        prompt = (
            f"Product photo of {item_description}, "
            "studio lighting, white background, high quality, e-commerce style"
        )
        logger.info("Generating item image: %s", item_description)
        response = requests.post(
            f"{OPENAI_API_URL}/generations",
            headers={
                **AIService._openai_headers(),
                "Content-Type": "application/json",
            },
            json={
                "prompt": prompt,
                "model": "gpt-image-1",
                "n": 1,
                "size": f"{AIService.OUTPUT_IMAGE_SIZE}x{AIService.OUTPUT_IMAGE_SIZE}",
            },
            timeout=180,
        )
        response.raise_for_status()
        result = response.json()
        b64 = result["data"][0]["b64_json"]
        logger.info("Item image generated successfully")
        return AIService._to_png_bytes(base64.b64decode(b64))

    @staticmethod
    def remove_furniture_from_image(
        input_image_path: str,
        prompt_instruction: str | None = None,
    ) -> bytes:
        """Remove furniture from an image.

        Args:
            input_image_path: Path to the input image.
            prompt_instruction: Custom removal prompt, or uses default.

        Returns:
            Edited image as PNG bytes.
        """
        prompt = prompt_instruction or (
            "Remove all furniture, sofas, tables and decorations. "
            "Keep walls, windows, doors and room structure unchanged. "
            "Return an empty clean room."
        )
        return AIService.generate_image_with_flux(input_image_path, prompt)
