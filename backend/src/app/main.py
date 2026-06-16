import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router
from app.core.settings import settings
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Decozy API")

os.makedirs(settings.upload_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

origins = [
    "http://localhost:3000",    
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Permite pedidos apenas destas origens
    allow_credentials=True,           # Permite cookies e headers de autenticação (essencial para o OAuth/JWT)
    allow_methods=["*"],              # Permite todos os métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],              # Permite todos os cabeçalhos (Headers)
)

app.include_router(api_router, prefix="/api/v1")
