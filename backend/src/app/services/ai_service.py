import base64
import io

import requests
from PIL import Image

from app.core.settings import settings
from app.database.session import SessionLocal
from app.services.crewai_service import (
    build_prompt_architect_crew, 
    parse_prompt_architect_result,
    build_asset_crew
)

class AIService:
    FLUX_INVOKE_URL = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b"
    OUTPUT_IMAGE_SIZE = 1024

    @staticmethod
    def _nvidia_json_headers() -> dict[str, str]:
        return {
            "Authorization": f"Bearer {settings.nvidia_api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    @staticmethod
    def _raise_nvidia_http_error(error: requests.exceptions.HTTPError) -> None:
        response = error.response
        error_detail: object = "Sem detalhes na resposta"

        if response is not None and response.text:
            try:
                error_detail = response.json()
            except ValueError:
                error_detail = response.text

        print(f"Erro HTTP na API da NVIDIA: {error}")
        print(f"Detalhes do erro: {error_detail}")
        raise RuntimeError(f"Falha na IA HTTP: {error} - Detalhes: {error_detail}") from error

    @staticmethod
    def _extract_generated_image_base64(response_body: object) -> str:
        if not isinstance(response_body, dict):
            extracted = AIService._extract_base64_candidate(response_body)
            if extracted:
                return extracted
            raise RuntimeError(f"Resposta NVIDIA sem imagem gerada em Base64: {response_body}")

        finish_reason = AIService._extract_finish_reason(response_body)
        if finish_reason and finish_reason != "SUCCESS":
            raise RuntimeError(f"NVIDIA Flux não gerou imagem. finishReason={finish_reason}")

        candidates: list[object] = [
            response_body.get("image"),
            response_body.get("b64_json"),
            response_body.get("images"),
            response_body.get("artifacts"),
            response_body.get("data"),
        ]

        for candidate in candidates:
            extracted = AIService._extract_base64_candidate(candidate)
            if extracted:
                return extracted

        raise RuntimeError(f"Resposta NVIDIA sem imagem gerada em Base64: {response_body}")

    @staticmethod
    def _extract_finish_reason(response_body: dict) -> str | None:
        artifacts = response_body.get("artifacts")
        if isinstance(artifacts, list) and artifacts:
            artifact = artifacts[0]
            if isinstance(artifact, dict):
                finish_reason = artifact.get("finishReason")
                if isinstance(finish_reason, str):
                    return finish_reason

        return None

    @staticmethod
    def _extract_base64_candidate(candidate: object) -> str | None:
        if isinstance(candidate, str):
            return candidate

        if isinstance(candidate, list) and candidate:
            return AIService._extract_base64_candidate(candidate[0])

        if isinstance(candidate, dict):
            for key in ("base64", "b64_json", "image", "data"):
                extracted = AIService._extract_base64_candidate(candidate.get(key))
                if extracted:
                    return extracted

        return None

    @staticmethod
    def _decode_base64_image(image_b64: str) -> bytes:
        if "," in image_b64 and image_b64.startswith("data:"):
            image_b64 = image_b64.split(",", 1)[1]

        return base64.b64decode(image_b64)

    @staticmethod
    def _to_png_bytes(image_bytes: bytes) -> bytes:
        with Image.open(io.BytesIO(image_bytes)) as img:
            output = io.BytesIO()
            img.save(output, format="PNG")
            return output.getvalue()

    @staticmethod
    def _sanitize_flux_prompt(prompt: str) -> str:
        sanitized = prompt
        replacements = {
            "bedroom": "private residential room",
            "master bedroom": "large private residential room",
            "bed": "large furniture item",
            "where the large furniture item used to be": "with open floor space",
            "where the bed used to be": "with open floor space",
        }

        for old, new in replacements.items():
            sanitized = sanitized.replace(old, new)
            sanitized = sanitized.replace(old.title(), new)

        return (
            f"{sanitized}. Photorealistic empty interior, no people, no body, "
            "no personal scene, no intimate context."
        )

    @staticmethod
    def _call_flux_text_to_image(prompt: str) -> dict:
        payload = {
            "prompt": prompt,
            "width": AIService.OUTPUT_IMAGE_SIZE,
            "height": AIService.OUTPUT_IMAGE_SIZE,
            "seed": 0,
            "steps": 4,
        }

        response = requests.post(
            AIService.FLUX_INVOKE_URL,
            headers=AIService._nvidia_json_headers(),
            json=payload,
            timeout=180,
        )
        response.raise_for_status()
        return response.json()

    @staticmethod
    def generate_image_with_flux(
        input_image_path: str,
        optimized_prompt: str,
    ) -> bytes:
        if not optimized_prompt or not optimized_prompt.strip():
            raise ValueError("O prompt otimizado para o Flux é obrigatório.")

        try:
            try:
                response_body = AIService._call_flux_text_to_image(optimized_prompt)
                generated_b64 = AIService._extract_generated_image_base64(response_body)
            except RuntimeError as e:
                if "finishReason=CONTENT_FILTERED" not in str(e):
                    raise

                sanitized_prompt = AIService._sanitize_flux_prompt(optimized_prompt)
                response_body = AIService._call_flux_text_to_image(sanitized_prompt)
                generated_b64 = AIService._extract_generated_image_base64(response_body)

            return AIService._to_png_bytes(AIService._decode_base64_image(generated_b64))

        except requests.exceptions.HTTPError as e:
            AIService._raise_nvidia_http_error(e)

    @staticmethod
    def remove_furniture_from_image(
        input_image_path: str,
        prompt_instruction: str | None = None,
    ) -> bytes:

        prompt = prompt_instruction or (
            "Remove all furniture, sofas, tables and decorations. "
            "Keep walls, windows, doors and room structure unchanged. "
            "Return an empty clean room."
        )

        return AIService.generate_image_with_flux(
            input_image_path,
            prompt,
        )
    @staticmethod
    def process_generation_job(
        generation_id: int, 
        project_id: int, 
        user_prompt: str, 
        original_image_url: str,
        input_image_path: str
    ) -> None:
        """
        Orquestra o fluxo completo:
        1. Avalia a intenção do utilizador.
        2. Gera nova imagem se necessário.
        3. Cria assets na base de dados se o utilizador pediu novos itens.
        """
        # Inicia a ligação à BD (se precisares de atualizar o estado da Generation)
        db = SessionLocal()
        
        try:
            print(f"[Orquestrador] A iniciar geração {generation_id} para o projeto {project_id}")

            # 1. ORQUESTRAÇÃO: Corre o primeiro agente
            architect_crew = build_prompt_architect_crew()
            architect_result_raw = architect_crew.kickoff(inputs={"user_prompt": user_prompt})
            architect_result = parse_prompt_architect_result(architect_result_raw)

            # 2. DECISÃO
            if architect_result.status == "rejected":
                print(f"[Orquestrador] Pedido inválido: {architect_result.reason}")
                # Exemplo: atualiza a BD para falha
                # db.execute(...) 
                return

            if architect_result.intent == "none":
                print("[Orquestrador] O utilizador não pediu alterações. A manter imagem original.")
                # Exemplo: atualiza a BD para sucesso, mantendo o original_image_url
                # db.execute(...)
                return

            # 3. GERAÇÃO DE IMAGEM
            print(f"[Orquestrador] A gerar imagem com prompt: {architect_result.optimized_prompt}")
            
            # Chama o método que já tens na classe
            imagem_bytes = AIService.generate_image_with_flux(
                input_image_path=input_image_path,
                optimized_prompt=architect_result.optimized_prompt
            )
            
            # TODO: Fazer upload do `imagem_bytes` para o teu S3/Cloudinary e obter o novo URL
            # nova_image_url = teu_servico_de_upload(imagem_bytes)
            nova_image_url = "https://url-temporario.com/imagem.png" 

            # 4. CRIAÇÃO DE ASSETS
            if architect_result.intent == "add" and architect_result.items_to_add:
                print(f"[Orquestrador] A criar assets para os itens: {architect_result.items_to_add}")
                
                asset_crew = build_asset_crew(project_id, nova_image_url)
                asset_crew.kickoff(inputs={
                    "optimized_prompt": architect_result.optimized_prompt,
                    "generated_image_url": nova_image_url,
                    "items_to_create": ", ".join(architect_result.items_to_add)
                })

            # Exemplo: Atualiza a BD para concluído com o novo URL
            # db.commit()
            print(f"[Orquestrador] Processo concluído com sucesso!")

        except Exception as e:
            print(f"[Orquestrador] Erro crítico no processamento: {e}")
            db.rollback()
            raise
        finally:
            db.close()