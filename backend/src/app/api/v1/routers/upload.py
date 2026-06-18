"""Upload router for image processing and AI generation."""

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
from app.core.logging import get_logger
from app.core.settings import settings
from app.database.session import SessionLocal, get_db
from app.models.project import GenerationModel, ProjectImageModel, ProjectModel
from app.services.ai_service import AIService
from app.services.crewai_service import (
    build_asset_crew,
    build_prompt_architect_crew,
    parse_prompt_architect_result,
)
from app.services.upload import UploadService

logger = get_logger(__name__)

router = APIRouter(prefix="/uploads", tags=["Uploads"])


def process_image_with_ai_background(
    project_id: int,
    generation_id: int,
    filename: str,
    user_prompt: str,
) -> None:
    """Background task: optimize prompt, generate image, create assets.

    Args:
        project_id: ID of the project being processed.
        generation_id: ID of the generation record.
        filename: Uploaded image filename.
        user_prompt: Original user prompt text.
    """
    db: Session = SessionLocal()

    input_path = os.path.join(settings.upload_dir, filename)
    output_filename = f"ai_empty_{filename}"
    output_path = os.path.join(settings.upload_dir, output_filename)
    output_url = f"/static/uploads/{output_filename}"

    try:
        logger.info("Project %d: Starting prompt optimization", project_id)
        prompt_crew = build_prompt_architect_crew()
        prompt_crew_result = prompt_crew.kickoff(inputs={"user_prompt": user_prompt})
        logger.info("Project %d: Prompt Architect finished", project_id)

        prompt_result = parse_prompt_architect_result(prompt_crew_result)
        logger.debug("Project %d: Architect result: %s", project_id, prompt_result.model_dump())

        if prompt_result.status == "rejected":
            raise ValueError(f"Prompt rejeitado: {prompt_result.reason}")
        optimized_prompt = prompt_result.optimized_prompt
        if not optimized_prompt:
            raise ValueError("O Agente 1 não devolveu optimized_prompt.")

        logger.info("Project %d: Generating image with prompt: %s", project_id, optimized_prompt)
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
        logger.info("Project %d: Generated image saved: %s", project_id, output_url)

        # Create items for each requested addition
        if prompt_result.intent == "add" and prompt_result.items_to_add:
            for item_name in prompt_result.items_to_add:
                logger.info("Project %d: Creating asset for: %s", project_id, item_name)
                try:
                    asset_crew = build_asset_crew(
                        project_id=project_id,
                        generated_image_url=output_url,
                    )
                    asset_crew.kickoff(
                        inputs={
                            "optimized_prompt": optimized_prompt,
                            "generated_image_url": output_url,
                            "items_to_create": item_name,
                        }
                    )
                except Exception as asset_err:
                    logger.error("Project %d: Failed to create asset '%s': %s", project_id, item_name, asset_err)
            logger.info("Project %d: Item creation completed", project_id)
        else:
            logger.info("Project %d: Intent is '%s', skipping item creation", project_id, prompt_result.intent)

        generation = db.query(GenerationModel).filter(GenerationModel.id == generation_id).first()
        if generation:
            generation.status = "completed"
            generation.output_url = output_url
            generation.error_message = None

        db.commit()
        logger.info("Project %d: Processing completed successfully", project_id)

    except Exception as e:
        db.rollback()
        logger.error("Failed to process %s: %s", filename, e)
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
) -> dict:
    """Upload an image and start AI background processing.

    Args:
        background_tasks: FastAPI background tasks.
        file: Uploaded image file.
        user_prompt: User's text instruction.
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        Dict with project_id and processing status.

    Raises:
        HTTPException: On validation or server errors.
    """
    try:
        filename = UploadService.save_uploaded_file(file)
        original_url = f"/static/uploads/{filename}"

        new_project = ProjectModel(user_id=current_user_id, title="Novo Projeto Decozy")
        db.add(new_project)
        db.commit()
        db.refresh(new_project)

        original_image = ProjectImageModel(
            project_id=new_project.id,
            image_type="original",
            image_url=original_url,
        )
        db.add(original_image)

        new_generation = GenerationModel(
            project_id=new_project.id,
            prompt=user_prompt,
            status="processing",
            provider="openai",
        )
        db.add(new_generation)
        db.commit()
        db.refresh(new_generation)

        background_tasks.add_task(
            process_image_with_ai_background,
            project_id=new_project.id,
            generation_id=new_generation.id,
            filename=filename,
            user_prompt=user_prompt,
        )

        logger.info("Upload accepted for project %d", new_project.id)
        return {
            "message": "Upload efetuado. Em processamento...",
            "project_id": new_project.id,
            "status": "processing",
            "user_prompt": user_prompt,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except Exception as e:
        db.rollback()
        logger.error("Upload failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e
    finally:
        file.file.close()
