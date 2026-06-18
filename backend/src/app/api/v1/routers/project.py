"""Project management router."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database.session import get_db
from app.models.item import ItemModel
from app.models.project import GenerationModel, ProjectImageModel, ProjectModel

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/list_projects", status_code=status.HTTP_200_OK)
async def list_projects(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> list:
    """List all projects for the authenticated user.

    Args:
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        List of project objects.
    """
    return db.query(ProjectModel).filter(ProjectModel.user_id == current_user_id).all()


@router.get("/get_project/{project_id}", status_code=status.HTTP_200_OK)
async def get_project_details(
    project_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    """Get project details including generation status and images.

    Args:
        project_id: Target project ID.
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        Project details with generation status and image list.

    Raises:
        HTTPException: If project not found or unauthorized.
    """
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == project_id, ProjectModel.user_id == current_user_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")

    generation = (
        db.query(GenerationModel)
        .filter(GenerationModel.project_id == project_id)
        .order_by(GenerationModel.created_at.desc())
        .first()
    )

    images = db.query(ProjectImageModel).filter(ProjectImageModel.project_id == project_id).all()

    return {
        "id": project.id,
        "title": project.title,
        "is_favorite": project.is_favorite,
        "created_at": project.created_at,
        "generation_status": generation.status if generation else "unknown",
        "generation_error": generation.error_message if generation else None,
        "images": [{"id": img.id, "type": img.image_type, "url": img.image_url} for img in images],
    }


@router.post("/create_project", status_code=status.HTTP_201_CREATED)
async def create_project(
    title: str,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> ProjectModel:
    """Create a new project.

    Args:
        title: Project title.
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        Created project object.
    """
    new_project = ProjectModel(user_id=current_user_id, title=title)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.get("/get_project_items/{project_id}", status_code=status.HTTP_200_OK)
async def get_project_items(
    project_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> list[dict]:
    """List all items for a project.

    Args:
        project_id: Target project ID.
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        List of item dicts with id, name, category, price, image_url, buy_url.

    Raises:
        HTTPException: If project not found or unauthorized.
    """
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == project_id, ProjectModel.user_id == current_user_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")

    items = db.query(ItemModel).filter(ItemModel.project_id == project_id).all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "price": item.price,
            "image_url": item.image_url,
            "buy_url": item.buy_url,
        }
        for item in items
    ]


@router.put("/change_project_title/{project_id}", status_code=status.HTTP_200_OK)
async def change_project_title(
    project_id: int,
    new_title: str,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> ProjectModel:
    """Update a project's title.

    Args:
        project_id: Target project ID.
        new_title: New title string.
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        Updated project object.

    Raises:
        HTTPException: If project not found or unauthorized.
    """
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == project_id, ProjectModel.user_id == current_user_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")

    project.title = new_title
    db.commit()
    db.refresh(project)
    return project


@router.delete("/delete_project/{project_id}", status_code=status.HTTP_200_OK)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    """Delete a project and all associated data.

    Args:
        project_id: Target project ID.
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        Success message.

    Raises:
        HTTPException: If project not found or unauthorized.
    """
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == project_id, ProjectModel.user_id == current_user_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")

    db.query(ItemModel).filter(ItemModel.project_id == project_id).delete()
    db.query(ProjectImageModel).filter(ProjectImageModel.project_id == project_id).delete()
    db.query(GenerationModel).filter(GenerationModel.project_id == project_id).delete()
    db.delete(project)
    db.commit()

    return {"detail": "Projeto e todos os dados associados foram apagados com sucesso."}
