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

    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe não está configurado (STRIPE_SECRET_KEY em falta).",
        )

    try:
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
    except stripe.error.StripeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Erro ao criar a sessão de pagamento: {exc.user_message or str(exc)}",
        )

    return {"checkout_url": session.url}


@router.get("/verify-session/{session_id}")
async def verify_token_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    """Verify a token purchase Checkout Session and credit tokens."""
    try:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except stripe.error.StripeError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Erro ao obter a sessão de pagamento: {exc.user_message or str(exc)}",
            )

        # Stripe resource objects use attribute access (not dict .get()).
        metadata = session.metadata or {}
        session_type = getattr(metadata, "type", None)
        session_user_id = getattr(metadata, "user_id", 0)
        session_tokens = getattr(metadata, "tokens", 0)

        if session_type != "token_purchase":
            raise HTTPException(status_code=400, detail="Sessão inválida.")

        if int(session_user_id or 0) != current_user_id:
            raise HTTPException(status_code=403, detail="Sessão não pertence a este utilizador.")

        if session.payment_status != "paid":
            return {"status": "unpaid", "tokens_credited": 0}

        user = db.query(UserModel).filter(UserModel.id == current_user_id).first()
        if user is None:
            raise HTTPException(status_code=404, detail="Utilizador não encontrado.")

        # Idempotency: only credit a given session once.
        if user.last_credited_session == session.id:
            return {"status": "paid", "tokens_credited": 0, "balance": user.tokens or 0}

        tokens_to_add = int(session_tokens or 0)
        user.tokens = (user.tokens or 0) + tokens_to_add
        user.last_credited_session = session.id
        db.commit()

        return {"status": "paid", "tokens_credited": tokens_to_add, "balance": user.tokens}
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"verify-session falhou: {type(exc).__name__}: {exc}",
        )
