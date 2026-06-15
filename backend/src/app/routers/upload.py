import os
from fastapi import APIRouter, UploadFile, File, HTTPException, status, BackgroundTasks
from app.services.upload import UploadService
from app.services.ai_service import AIService
from app.core.settings import settings


router = APIRouter(prefix="/uploads", tags=["Uploads"])

@router.post("/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Chama o serviço para tratar do ficheiro
        filename = UploadService.save_uploaded_file(file)
        
        return {
            "message": "Upload efetuado com sucesso!",
            "filename": filename,
            "url": f"/static/uploads/{filename}"
        }
    except ValueError as e:
        # Se o serviço lançar um erro de validação (ex: formato inválido)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Qualquer outro erro inesperado
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Erro interno: {str(e)}"
        )
    finally:
        file.file.close()

def process_image_with_ai_background(filename: str):
    """
    Função que corre em background: 
    1. Lê a imagem original.
    2. Envia para a IA.
    3. Grava o resultado com o prefixo 'ai_empty_'.
    """
    input_path = os.path.join(settings.upload_dir, filename)
    output_filename = f"ai_empty_{filename}"
    output_path = os.path.join(settings.upload_dir, output_filename)
    
    try:
        # 1. Pede à IA para limpar os móveis
        print(f"A iniciar IA para o ficheiro {filename}...")
        image_bytes = AIService.remove_furniture_from_image(input_path)
        
        # 2. Grava os bytes devolvidos no volume do Docker
        with open(output_path, "wb") as f:
            f.write(image_bytes)
            
        print(f"Sucesso! Imagem sem móveis gravada em: {output_path}")
        
    except Exception as e:
        print(f"Falha ao processar {filename} em background: {str(e)}")

@router.post("/")
async def upload_image(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    try:
        # 1. Valida e guarda a imagem original (Rápido)
        filename = UploadService.save_uploaded_file(file)
        
        # 2. Despacha o processamento da IA para segundo plano (Não bloqueia)
        background_tasks.add_task(process_image_with_ai_background, filename)
        
        # 3. Responde imediatamente ao Frontend
        return {
            "message": "Upload efetuado com sucesso! A imagem está a ser processada pela IA.",
            "original_filename": filename,
            "original_url": f"/static/uploads/{filename}",
            "status": "processing" # Indica ao frontend que ainda não terminou
        }
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    finally:
        file.file.close()