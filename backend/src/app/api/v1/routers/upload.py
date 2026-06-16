import os
import time

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.core.settings import settings
from app.database.session import SessionLocal, get_db
from app.models.project import GenerationModel, ProjectImageModel, ProjectModel
from app.services.ai_service import AIService
from app.services.upload import UploadService

router = APIRouter(prefix="/uploads", tags=["Uploads"])


def process_image_with_ai_background(
    project_id: int, generation_id: int, filename: str
):
    """
    Função em background: Executa a IA e guarda o resultado fisicamente e na DB.
    """
    # IMPORTANTE: Abrir uma nova sessão DB dentro da Background Task
    db: Session = SessionLocal()

    input_path = os.path.join(settings.upload_dir, filename)
    output_filename = f"ai_empty_{filename}"
    output_path = os.path.join(settings.upload_dir, output_filename)
    output_url = f"/static/uploads/{output_filename}"
    
    #Processamento da imagem com dados MOCKS
    try:
        print(f"[Project {project_id}] 🛑 MOCK ATIVADO: A simular IA para poupar créditos da NVIDIA...")
        
        # ⏳ Simula que a IA demora 3 segundos a processar a imagem
        time.sleep(3)

        # 💸 COMENTADO PARA POUPAR CRÉDITOS:
        # image_bytes = AIService.remove_furniture_from_image(input_path)

        # 🛠️ MOCK: Em vez de chamar a IA, lemos a imagem original que fizeste upload
        # e guardamo-la como se fosse o resultado da IA (assim o teu disco continua a ter o ficheiro!)
        with open(input_path, "rb") as f_in:
            image_bytes = f_in.read()

        # 1. Grava o resultado simulado com o prefixo 'ai_empty_' no disco
        with open(output_path, "wb") as f_out:
            f_out.write(image_bytes)

        # 2. Grava a nova imagem na BD (image_type = 'generated')
        new_image = ProjectImageModel(
            project_id=project_id, image_type="generated", image_url=output_url
        )
        db.add(new_image)

        # 3. Atualiza a Geração para completed
        generation = (
            db.query(GenerationModel)
            .filter(GenerationModel.id == generation_id)
            .first()
        )
        if generation:
            generation.status = "completed"
            generation.output_url = output_url

        db.commit()
        print(f"🎉 [MOCK SUCCESS] Imagem gravada e BD atualizada com sucesso: {output_url}")

    # Tenta processar a imagem com a IA
    # try:
    #     print(f"[Project {project_id}] A iniciar IA para o ficheiro {filename}...")
    #     image_bytes = AIService.remove_furniture_from_image(input_path)

    #     # 1. Grava o resultado com o prefixo 'ai_empty_' no disco
    #     with open(output_path, "wb") as f:
    #         f.write(image_bytes)

    #     # 2. Grava a nova imagem na BD (image_type = 'generated')
    #     new_image = ProjectImageModel(
    #         project_id=project_id, image_type="generated", image_url=output_url
    #     )
    #     db.add(new_image)

    #     # 3. Atualiza a Geração para completed
    #     generation = (
    #         db.query(GenerationModel)
    #         .filter(GenerationModel.id == generation_id)
    #         .first()
    #     )
    #     if generation:
    #         generation.status = "completed"
    #         generation.output_url = output_url

    #     db.commit()
    #     print(f"Sucesso! Imagem gravada e BD atualizada: {output_url}")

    except Exception as e:
        db.rollback()
        print(f"Falha ao processar {filename} em background: {str(e)}")
        # Em caso de falha, marca como failed na BD
        generation = (
            db.query(GenerationModel)
            .filter(GenerationModel.id == generation_id)
            .first()
        )
        if generation:
            generation.status = "failed"
            generation.error_message = str(e)
            db.commit()
    finally:
        db.close()  # Garante que a sessão DB fecha


@router.post("/")
async def upload_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_prompt: str = Form(...),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    try:
        # 1. Valida e guarda a imagem original fisicamente
        filename = UploadService.save_uploaded_file(file)
        original_url = f"/static/uploads/{filename}"

        # 2. Criar o Projeto na Base de Dados
        new_project = ProjectModel(user_id=current_user_id, title="Novo Projeto Decozy")
        db.add(new_project)
        db.commit()
        db.refresh(new_project)

        # 3. Criar a Imagem Original na Base de Dados
        original_image = ProjectImageModel(
            project_id=new_project.id, image_type="original", image_url=original_url
        )
        db.add(original_image)

        # 4. Criar a Geração com status processing
        new_generation = GenerationModel(
            project_id=new_project.id,
            prompt=user_prompt,
            status="processing",
            provider="nvidia-flux",
        )
        db.add(new_generation)
        db.commit()
        db.refresh(new_generation)

        # 5. Despacha o processamento da IA para segundo plano
        background_tasks.add_task(
            process_image_with_ai_background,
            project_id=new_project.id,
            generation_id=new_generation.id,
            filename=filename,
        )

        # 6. Responde imediatamente ao Frontend com o ID do projeto
        return {
            "message": "Upload efetuado. Em processamento...",
            "project_id": new_project.id,
            "status": "processing",
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
    finally:
        file.file.close()
