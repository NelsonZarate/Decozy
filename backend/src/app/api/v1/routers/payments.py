"""Stripe payments router for checkout and session verification."""

import stripe
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.core.logging import get_logger
from app.core.settings import settings
from app.database.session import get_db
from app.models.item import ItemModel
from app.models.order import OrderItemModel, OrderModel
from app.models.project import ProjectModel

logger = get_logger(__name__)

stripe.api_key = settings.stripe_secret_key

router = APIRouter(prefix="/payments", tags=["Payments"])


class CheckoutRequest(BaseModel):
    """Request body for creating a checkout session.

    Attributes:
        project_id: ID of the project containing the items.
        item_ids: List of item IDs to purchase.
    """

    project_id: int
    item_ids: list[int]


def _parse_price_to_cents(price: str | None) -> int:
    """Convert a price string to integer cents.

    Handles both US format (299.99) and European format (1.299,99).

    Args:
        price: Price string with optional currency symbol.

    Returns:
        Price in cents, or 0 if invalid.
    """
    if not price:
        return 0
    cleaned = "".join(c for c in price if c.isdigit() or c in ".,")
    if "," in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    try:
        return int(float(cleaned) * 100)
    except ValueError:
        return 0


@router.post("/create-checkout-session")
async def create_checkout_session(
    body: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    """Create a Stripe Checkout Session for item purchase.

    Args:
        body: Checkout request with project_id and item_ids.
        db: Database session.
        current_user_id: Authenticated user ID.

    Returns:
        Dict with checkout_url for frontend redirect.

    Raises:
        HTTPException: On validation errors or missing items.
    """
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == body.project_id, ProjectModel.user_id == current_user_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")

    items = (
        db.query(ItemModel)
        .filter(ItemModel.id.in_(body.item_ids), ItemModel.project_id == body.project_id)
        .all()
    )
    if not items:
        raise HTTPException(status_code=400, detail="Nenhum item válido encontrado.")

    order = OrderModel(
        user_id=current_user_id,
        project_id=body.project_id,
        status="pending",
        total_cents=0,
    )
    db.add(order)
    db.flush()

    total_cents = 0
    line_items: list[dict] = []
    for item in items:
        price_cents = _parse_price_to_cents(item.price)
        if price_cents <= 0:
            continue
        total_cents += price_cents
        order.items.append(OrderItemModel(name=item.name, item_id=item.id, price_cents=price_cents))
        line_items.append({
            "price_data": {
                "currency": "eur",
                "unit_amount": price_cents,
                "product_data": {"name": item.name},
            },
            "quantity": 1,
        })

    if not line_items:
        db.rollback()
        raise HTTPException(status_code=400, detail="Nenhum item com preço válido.")

    order.total_cents = total_cents

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=line_items,
        metadata={"order_id": str(order.id), "project_id": str(body.project_id)},
        success_url=f"{settings.frontend_url}/projects/{body.project_id}?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.frontend_url}/projects/{body.project_id}?payment=cancel",
    )

    order.stripe_session_id = session.id
    db.commit()
    logger.info("Checkout session created for order %d", order.id)

    return {"checkout_url": session.url}


@router.get("/verify-session/{session_id}")
async def verify_checkout_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    """Verify a Stripe Checkout Session payment status.

    Called by the frontend after redirect from Stripe. Marks the order
    as paid if the session payment_status is 'paid'.
    """
    order = (
        db.query(OrderModel)
        .filter(OrderModel.stripe_session_id == session_id, OrderModel.user_id == current_user_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    if order.status == "paid":
        return {"status": "paid", "order_id": order.id}

    session = stripe.checkout.Session.retrieve(session_id)

    if session.payment_status == "paid":
        order.status = "paid"
        db.commit()
        logger.info("Order %d marked as paid via session verify", order.id)

    return {"status": order.status, "order_id": order.id}
