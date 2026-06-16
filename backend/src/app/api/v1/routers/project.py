from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.project import ProjectModel, GenerationModel, ProjectImageModel
from app.api.deps import get_current_user_id

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/list_projects", status_code=status.HTTP_201_CREATED)
async def list_projects(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Lista todos os projetos do utilizador autenticado.
    """
    projects = (
        db.query(ProjectModel)
        .filter(ProjectModel.user_id == current_user_id)
        .all()
    )
    return projects

@router.get("/get_project/{project_id}", status_code=status.HTTP_200_OK)
async def get_project_details(
    project_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Retorna os detalhes de um projeto específico, incluindo o estado da geração
    e todas as imagens associadas (original e gerada).
    """
    # 1. Procura o projeto na BD e garante que pertence ao utilizador autenticado
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == project_id, ProjectModel.user_id == current_user_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado ou não tem permissão para aceder.",
        )

    # 2. Procura o estado da última geração deste projeto
    generation = (
        db.query(GenerationModel)
        .filter(GenerationModel.project_id == project_id)
        .order_by(GenerationModel.created_at.desc())
        .first()
    )

    # 3. Procura todas as imagens associadas a este projeto
    images = (
        db.query(ProjectImageModel)
        .filter(ProjectImageModel.project_id == project_id)
        .all()
    )

    # 4. Organiza a resposta para o Frontend ficar super feliz
    return {
        "id": project.id,
        "title": project.title,
        "is_favorite": project.is_favorite,
        "created_at": project.created_at,
        "generation_status": generation.status if generation else "unknown",
        "generation_error": generation.error_message if generation else None,
        "images": [
            {
                "id": img.id,
                "type": img.image_type,  # 'original' ou 'generated'
                "url": img.image_url     # ex: '/static/uploads/ai_empty_...'
            }
            for img in images
        ]
    }

@router.post("/create_project", status_code=status.HTTP_201_CREATED)
async def create_project(
    title: str,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Cria um novo projeto para o utilizador autenticado.
    """
    new_project = ProjectModel(user_id=current_user_id, title=title)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.put("/change_project_title/{project_id}", status_code=status.HTTP_200_OK)
async def change_project_title(
    project_id: int,
    new_title: str,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Altera o título de um projeto específico.
    """
    # 1. Procura o projeto na BD e garante que pertence ao utilizador autenticado
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == project_id, ProjectModel.user_id == current_user_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado ou não tem permissão para alterar.",
        )

    # 2. Atualiza o título do projeto
    project.title = new_title
    db.commit()
    db.refresh(project)

    return project


@router.delete("/delete_project/{project_id}", status_code=status.HTTP_200_OK)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Apaga um projeto específico, incluindo todas as imagens associadas.
    """
    # 1. Procura o projeto na BD e garante que pertence ao utilizador autenticado
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == project_id, ProjectModel.user_id == current_user_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado ou não tem permissão para apagar.",
        )

    # 2. Apaga todas as imagens associadas a este projeto
    db.query(ProjectImageModel).filter(ProjectImageModel.project_id == project_id).delete()

    # 3. Apaga todas as gerações associadas a este projeto
    db.query(GenerationModel).filter(GenerationModel.project_id == project_id).delete()

    # 4. Apaga o próprio projeto
    db.delete(project)
    db.commit()

    return {"detail": "Projeto e todos os dados associados foram apagados com sucesso."}
