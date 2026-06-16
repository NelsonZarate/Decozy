import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.core.settings import settings

# Importar e incluir os routers
from app.api.v1.api import api_router

app = FastAPI(title="Decozy API")

# 🛠️ Configurar a pasta de ficheiros estáticos
os.makedirs(settings.upload_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(api_router, prefix="/api/v1")