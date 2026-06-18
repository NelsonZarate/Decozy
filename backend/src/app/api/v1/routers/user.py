"""User management router."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database.session import get_db
from app.models.item import UserSavedItemModel
from app.models.user import UserModel

router = APIRouter(prefix="/User", tags=["User"])


@router.get("/list_saved_items", status_code=status.HTTP_200_OK)
async def list_saved_items(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> list:
    """List all saved items for the authenticated user.

    Args:
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        List of saved item records.
    """
    return (
        db.query(UserSavedItemModel)
        .filter(UserSavedItemModel.user_id == current_user_id)
        .all()
    )


@router.post("/save_item/{item_id}", status_code=status.HTTP_201_CREATED)
async def save_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    """Save an item to the user's favorites.

    Args:
        item_id: ID of the item to save.
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        Success message.

    Raises:
        HTTPException: If item already saved.
    """
    existing = (
        db.query(UserSavedItemModel)
        .filter(UserSavedItemModel.user_id == current_user_id, UserSavedItemModel.item_id == item_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item já está guardado.")

    db.add(UserSavedItemModel(user_id=current_user_id, item_id=item_id))
    db.commit()
    return {"detail": "Item guardado com sucesso."}


@router.get("/get_user_info", status_code=status.HTTP_200_OK)
async def get_user_info(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    """Get authenticated user info.

    Args:
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        User details dict.

    Raises:
        HTTPException: If user not found.
    """
    user = db.query(UserModel).filter(UserModel.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilizador não encontrado.")
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
) -> dict:
    """Remove a saved item from user's favorites.

    Args:
        item_id: ID of the item to remove.
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        Success message.

    Raises:
        HTTPException: If saved item not found.
    """
    saved = (
        db.query(UserSavedItemModel)
        .filter(UserSavedItemModel.user_id == current_user_id, UserSavedItemModel.item_id == item_id)
        .first()
    )
    if not saved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item guardado não encontrado.")

    db.delete(saved)
    db.commit()
    return {"detail": "Item guardado removido com sucesso."}
