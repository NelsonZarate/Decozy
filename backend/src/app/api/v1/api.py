from fastapi import APIRouter

from app.api.v1.routers import auth, upload, project, user, payments, tokens

api_router = APIRouter()

api_router.include_router(user.router)
api_router.include_router(upload.router)
api_router.include_router(auth.router)
api_router.include_router(project.router)
api_router.include_router(payments.router)
api_router.include_router(tokens.router)

