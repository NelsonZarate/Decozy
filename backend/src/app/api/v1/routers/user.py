from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import UserModel
from app.models.item import UserSavedItemModel
from app.api.deps import get_current_user_id

router = APIRouter(prefix="/User", tags=["User"])

@router.get("/list_saved_items", status_code=status.HTTP_200_OK)
async def list_saved_items(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Lista todos os itens guardados do utilizador autenticado.
    """
    saved_items = (
        db.query(UserSavedItemModel)
        .filter(UserSavedItemModel.user_id == current_user_id)
        .all()
    )
    return saved_items

@router.post("/save_item/{item_id}", status_code=status.HTTP_201_CREATED)
async def save_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Guarda um item para o utilizador autenticado.
    """
    user = db.query(UserModel).filter(UserModel.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilizador não encontrado.",
        )

    # Verifica se o item já está guardado
    if any(saved_item.id == item_id for saved_item in user.saved_items):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item já está guardado.",
        )

    # Adiciona o item à lista de itens guardados do utilizador
    user.saved_items.append(item_id)
    db.commit()
    return {"detail": "Item guardado com sucesso."}


@router.get("/get_user_info", status_code=status.HTTP_200_OK)
async def get_user_info(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Obtém informações do utilizador autenticado.
    """
    user = db.query(UserModel).filter(UserModel.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilizador não encontrado.",
        )
    return {
        "id": user.id,
        "email": user.email,
        "plan": user.plan,
        "daily_generations_count": user.daily_generations_count,
        "last_generation_date": user.last_generation_date,
        "created_at": user.created_at,
    }

@router.delete("/delete_saved_item/{item_id}", status_code=status.HTTP_200_OK)
async def delete_saved_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Remove um item guardado do utilizador autenticado.
    """
    saved_item = (
        db.query(UserModel.saved_items)
        .filter(UserModel.id == current_user_id, UserModel.saved_items.any(id=item_id))
        .first()
    )
    if not saved_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item guardado não encontrado para este utilizador.",
        )

    db.delete(saved_item)
    db.commit()
    return {"detail": "Item guardado removido com sucesso."}
