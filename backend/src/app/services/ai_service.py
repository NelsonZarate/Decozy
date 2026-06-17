import base64

from openai import OpenAI

from app.core.settings import settings


class AIService:
    @staticmethod
    def generate_image_with_flux(input_image_path: str, optimized_prompt: str) -> bytes:
        """
        Lê a imagem local, envia para o Flux com o prompt otimizado e retorna os bytes da imagem gerada.
        """
        if not optimized_prompt or not optimized_prompt.strip():
            raise ValueError("O prompt otimizado para o Flux é obrigatório.")

        client = OpenAI(
            api_key=settings.nvidia_api_key,
            base_url="https://integrate.api.nvidia.com/v1",
        )

        try:
            with open(input_image_path, "rb") as image_file:
                response = client.images.edit(
                    model="black-forest-labs/flux-2-klein-4b",
                    image=image_file,
                    prompt=optimized_prompt,
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

    @staticmethod
    def remove_furniture_from_image(input_image_path: str, prompt_instruction: str | None = None) -> bytes:
        """
        Compatibilidade com chamadas antigas. O fluxo novo deve passar sempre um prompt otimizado.
        """
        prompt = prompt_instruction or (
            "Remove all furniture, sofas, tables, and decorations. "
            "Keep the original walls, windows, and structure. "
            "The room must look completely empty with clean floors."
        )
        return AIService.generate_image_with_flux(input_image_path, prompt)
