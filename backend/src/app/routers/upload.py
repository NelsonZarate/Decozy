from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.services.upload import UploadService

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