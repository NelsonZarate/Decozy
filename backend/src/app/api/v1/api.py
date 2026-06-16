from fastapi import APIRouter
from app.api.v1.routers import upload  # Importa o teu router de uploads
# from app.api.v1.routers import project, item (futuros)

api_router = APIRouter()

# Aqui incluis o router de uploads. 
# Lembras-te que ele já tem o prefix="/uploads"?
api_router.include_router(upload.router) 

# No futuro farias:
# api_router.include_router(project.router)