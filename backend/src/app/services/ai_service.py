import base64

from openai import OpenAI

from app.core.settings import settings


class AIService:
    @staticmethod
    def remove_furniture_from_image(input_image_path: str) -> bytes:
        """
        Lê a imagem local, envia para o FLUX.2-klein-4B (NVIDIA) e retorna os bytes da imagem vazia.
        """
        client = OpenAI(
            api_key=settings.nvidia_api_key,
            base_url="https://integrate.api.nvidia.com/v1",
        )

        prompt_instruction = (
            "Remove all furniture, sofas, tables, and decorations. "
            "Keep the original walls, windows, and structure. "
            "The room must look completely empty with clean floors."
        )

        try:
            response = client.images.edit(
                model="black-forest-labs/flux-2-klein-4b",
                image=open(input_image_path, "rb"),
                prompt=prompt_instruction,
                n=1,
                size="1024x1024",
                response_format="b64_json",
            )

            # Extrair a string Base64 e convertê-la de volta para bytes binários
            image_b64 = response.data[0].b64_json
            image_bytes = base64.b64decode(image_b64)

            return image_bytes

        except Exception as e:
            # Num ambiente real, podes usar um logger em vez de print
            print(f"Erro na comunicação com a API da NVIDIA: {str(e)}")
            raise RuntimeError(f"Falha na IA: {str(e)}")
