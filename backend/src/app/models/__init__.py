# src/app/models/__init__.py

from app.database.session import Base  # Garante que a Base é importada primeiro
from app.models.item import ItemModel, UserSavedItemModel
from app.models.order import OrderItemModel, OrderModel
from app.models.project import GenerationModel, ProjectImageModel, ProjectModel
from app.models.subscription import SubscriptionModel
from app.models.user import UserIdentityModel, UserModel

__all__ = [
    "Base",
    "UserModel",
    "UserIdentityModel",
    "SubscriptionModel",
    "ProjectModel",
    "ProjectImageModel",
    "GenerationModel",
    "ItemModel",
    "UserSavedItemModel",
    "OrderModel",
    "OrderItemModel",
]
