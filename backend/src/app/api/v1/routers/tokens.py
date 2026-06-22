"""Token packages purchase router."""

import stripe
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.core.settings import settings
from app.database.session import get_db
from app.models.user import UserModel

stripe.api_key = settings.stripe_secret_key

router = APIRouter(prefix="/tokens", tags=["Tokens"])

# package_id -> (tokens, price_cents)
TOKEN_PACKAGES = {
    "5_tokens": (5, 1000),
    "10_tokens": (10, 1500),
    "15_tokens": (15, 2000),
}


class TokenCheckoutRequest(BaseModel):
    package_id: str


@router.get("/balance")
async def get_token_balance(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    user = db.query(UserModel).filter(UserModel.id == current_user_id).first()
    return {"tokens": user.tokens, "email": user.email}


@router.get("/packages")
async def list_packages() -> list[dict]:
    return [
        {"id": k, "tokens": v[0], "price_eur": v[1] / 100}
        for k, v in TOKEN_PACKAGES.items()
    ]


@router.post("/purchase")
async def purchase_tokens(
    body: TokenCheckoutRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    package = TOKEN_PACKAGES.get(body.package_id)
    if not package:
        raise HTTPException(status_code=400, detail="Pacote inválido.")

    tokens, price_cents = package

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "eur",
                "unit_amount": price_cents,
                "product_data": {"name": f"{tokens} Tokens Decozy"},
            },
            "quantity": 1,
        }],
        metadata={"user_id": str(current_user_id), "tokens": str(tokens), "type": "token_purchase"},
        success_url=f"{settings.frontend_url}/tokens?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.frontend_url}/tokens?payment=cancel",
    )

    return {"checkout_url": session.url}


@router.get("/verify-session/{session_id}")
async def verify_token_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    """Verify a token purchase Checkout Session and credit tokens."""
    session = stripe.checkout.Session.retrieve(session_id)

    metadata = session.get("metadata", {})
    if metadata.get("type") != "token_purchase":
        raise HTTPException(status_code=400, detail="Sessão inválida.")

    if int(metadata.get("user_id", 0)) != current_user_id:
        raise HTTPException(status_code=403, detail="Sessão não pertence a este utilizador.")

    if session.payment_status != "paid":
        return {"status": "unpaid", "tokens_credited": 0}

    user = db.query(UserModel).filter(UserModel.id == current_user_id).first()

    # Idempotency: check if we already credited this session
    if hasattr(session, "id") and db.query(UserModel).filter(
        UserModel.id == current_user_id,
        UserModel.last_credited_session == session.id,
    ).first():
        return {"status": "paid", "tokens_credited": 0, "balance": user.tokens}

    tokens_to_add = int(metadata["tokens"])
    user.tokens += tokens_to_add
    user.last_credited_session = session.id
    db.commit()

    return {"status": "paid", "tokens_credited": tokens_to_add, "balance": user.tokens}
