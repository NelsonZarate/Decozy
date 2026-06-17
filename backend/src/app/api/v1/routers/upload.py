import os

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
from app.services.crewai_service import (
    build_asset_crew,
    build_prompt_architect_crew,
    parse_asset_crew_result,
    parse_prompt_architect_result,
)
from app.services.upload import UploadService

router = APIRouter(prefix="/uploads", tags=["Uploads"])


def process_image_with_ai_background(
    project_id: int,
    generation_id: int,
    filename: str,
    user_prompt: str,
):
    """
    Função em background: otimiza o prompt, gera a imagem com Flux e guarda assets.
    """
    db: Session = SessionLocal()

    input_path = os.path.join(settings.upload_dir, filename)
    output_filename = f"ai_empty_{filename}"
    output_path = os.path.join(settings.upload_dir, output_filename)
    output_url = f"/static/uploads/{output_filename}"

    try:
        print(f"[Project {project_id}] A iniciar CrewAI para otimizar o prompt...")
        prompt_crew = build_prompt_architect_crew()
        prompt_crew_result = prompt_crew.kickoff(inputs={"user_prompt": user_prompt})
        print(f"[Project {project_id}] CrewAI Prompt Architect terminou: {prompt_crew_result}")

        prompt_result = parse_prompt_architect_result(prompt_crew_result)
        print(f"[Project {project_id}] Prompt Architect JSON validado: {prompt_result.model_dump()}")

        if prompt_result.status == "rejected":
            raise ValueError(f"Prompt rejeitado pelo agente de prompts: {prompt_result.reason}")

        optimized_prompt = prompt_result.optimized_prompt
        if not optimized_prompt:
            raise ValueError("O Agente 1 não devolveu optimized_prompt.")

        print(f"[Project {project_id}] A chamar Flux com optimized_prompt: {optimized_prompt}")
        image_bytes = AIService.generate_image_with_flux(
            input_image_path=input_path,
            optimized_prompt=optimized_prompt,
        )

        with open(output_path, "wb") as f_out:
            f_out.write(image_bytes)

        new_image = ProjectImageModel(
            project_id=project_id,
            image_type="generated",
            image_url=output_url,
        )
        db.add(new_image)
        db.commit()
        print(f"[Project {project_id}] Imagem Flux guardada: {output_url}")

        print(f"[Project {project_id}] A iniciar CrewAI para assets com a nova imagem...")
        asset_crew = build_asset_crew(
            project_id=project_id,
            generated_image_url=output_url,
        )

        print(f"[Project {project_id}] A executar Asset Specialist crew.kickoff()...")
        asset_crew_result = asset_crew.kickoff(
            inputs={
                "optimized_prompt": optimized_prompt,
                "generated_image_url": output_url,
            }
        )
        print(f"[Project {project_id}] CrewAI Asset Specialist terminou: {asset_crew_result}")

        asset_result = parse_asset_crew_result(asset_crew_result)
        print(f"[Project {project_id}] Asset Specialist JSON validado: {asset_result.model_dump()}")

        generation = db.query(GenerationModel).filter(GenerationModel.id == generation_id).first()
        if generation:
            generation.status = "completed"
            generation.output_url = output_url
            generation.error_message = None

        db.commit()
        print(f"🎉 [CrewAI SUCCESS] Imagem e asset guardados com sucesso: {output_url}")

    except Exception as e:
        db.rollback()
        print(f"Falha ao processar {filename} em background: {str(e)}")
        generation = db.query(GenerationModel).filter(GenerationModel.id == generation_id).first()
        if generation:
            generation.status = "failed"
            generation.error_message = str(e)
            db.commit()
    finally:
        db.close()


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
            project_id=new_project.id,
            image_type="original",
            image_url=original_url,
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
            user_prompt=user_prompt,
        )

        # 6. Responde imediatamente ao Frontend com o ID do projeto
        return {
            "message": "Upload efetuado. Em processamento...",
            "project_id": new_project.id,
            "status": "processing",
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e
    finally:
        file.file.close()
