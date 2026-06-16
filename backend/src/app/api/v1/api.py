from fastapi import APIRouter

from app.api.v1.routers import auth, upload, project  # Importa o teu router de uploads e auth

api_router = APIRouter()

# Aqui incluis o router de uploads.
# Lembras-te que ele já tem o prefix="/uploads"?
api_router.include_router(upload.router)
api_router.include_router(auth.router)
api_router.include_router(project.router)

