import os
import time

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.core.settings import settings
from app.database.session import SessionLocal, get_db
from app.models.project import GenerationModel, ProjectImageModel, ProjectModel
from app.services.ai_service import AIService
from app.services.upload import UploadService

router = APIRouter(prefix="/uploads", tags=["Uploads"])


def process_image_with_ai_background(
    project_id: int, generation_id: int, filename: str
):
    """
    Função em background: Executa a IA e guarda o resultado fisicamente e na DB.
    """
    # IMPORTANTE: Abrir uma nova sessão DB dentro da Background Task
    db: Session = SessionLocal()

    input_path = os.path.join(settings.upload_dir, filename)
    output_filename = f"ai_empty_{filename}"
    output_path = os.path.join(settings.upload_dir, output_filename)
    output_url = f"/static/uploads/{output_filename}"
    
    #Processamento da imagem com dados MOCKS
    try:
        print(f"[Project {project_id}] A simular IA de Imagem e Texto...")
        time.sleep(3) # Simula o tempo da IA

        # 1. 🖼️ MOCK DA IMAGEM: Copia a imagem (como já tinhas)
        with open(input_path, "rb") as f_in:
            image_bytes = f_in.read()
        with open(output_path, "wb") as f_out:
            f_out.write(image_bytes)

        # 2. 🧠 MOCK DO LLM: Aqui é onde chamarias o teu GPT/Claude
        # Em vez de devolver um texto normal, tu pedes à IA para devolver um JSON!
        # Exemplo do que a função AIService.generate_item_details(user_prompt) devolveria:
        ia_json_response = """
        {
            "name": "Cadeira Velvet Azul Escuro",
            "category": "Cadeiras e Poltronas",
            "price": "149.99 €",
            "buy_url": "https://decozy.com/search?q=cadeira+velvet+azul"
        }
        """
        
        # 3. 🧩 Transforma a string JSON num dicionário Python real
        item_data = json.loads(ia_json_response)


        new_image = ProjectImageModel(
            project_id=project_id, image_type="generated", image_url=output_url
        )
        db.add(new_image)
        
        new_item = ItemModel(
            project_id=project_id,
            name=item_data["name"],           # Vem do JSON da IA
            category=item_data["category"],   # Vem do JSON da IA
            price=item_data["price"],         # Vem do JSON da IA
            image_url=output_url,             # Usamos a imagem gerada
            buy_url=item_data["buy_url"]      # Vem do JSON da IA
        )
        db.add(new_item)
        db.commit()

        # 3. Atualiza a Geração para completed
        generation = (
            db.query(GenerationModel)
            .filter(GenerationModel.id == generation_id)
            .first()
        )
        if generation:
            generation.status = "completed"
            generation.output_url = output_url

        db.commit()
        print(f"🎉 [MOCK SUCCESS] Imagem gravada e BD atualizada com sucesso: {output_url}")

    # Tenta processar a imagem com a IA
    # try:
        # print(f"[Project {project_id}] A iniciar IA (Imagem) para o ficheiro {filename}...")
        
        # 1. 🖼️ IA GERA A IMAGEM (A tua chamada à NVIDIA)
        # image_bytes = AIService.remove_furniture_from_image(input_path)

        # Grava o resultado com o prefixo 'ai_empty_' no disco
        # with open(output_path, "wb") as f:
        #     f.write(image_bytes)

        # 2. 🧠 IA GERA O TEXTO/MÓVEL (A chamada ao LLM - ChatGPT/Claude/etc)
        # print(f"[Project {project_id}] A inventar detalhes do móvel com LLM...")
        
        # NOTA: Vais ter de criar este método no teu ficheiro ai_service.py!
        # Ele vai receber o prompt do utilizador e devolver aquela string JSON.
        # ia_json_response = AIService.generate_item_details(user_prompt)
        # item_data = json.loads(ia_json_response)

        # 3. 💾 GRAVA TUDO NA BASE DE DADOS
        
        # A) Grava a nova imagem gerada pela NVIDIA
        # new_image = ProjectImageModel(
        #     project_id=project_id, image_type="generated", image_url=output_url
        # )
        # db.add(new_image)

        # B) Grava o Item inventado pelo LLM
        # new_item = ItemModel(
        #     project_id=project_id,
        #     name=item_data["name"],
        #     category=item_data["category"],
        #     price=item_data["price"],
        #     image_url=output_url,          # Usamos a mesma imagem gerada pela IA
        #     buy_url=item_data["buy_url"]
        # )
        # db.add(new_item)

        # 4. ✅ ATUALIZA A GERAÇÃO PARA COMPLETED
        # generation = (
        #     db.query(GenerationModel)
        #     .filter(GenerationModel.id == generation_id)
        #     .first()
        # )
        # if generation:
        #     generation.status = "completed"
        #     generation.output_url = output_url

        # Comita TUDO (Imagem, Item e Status) de uma só vez
        # db.commit()
        # print(f"Sucesso Absoluto! Imagem {output_url} e Item '{item_data['name']}' guardados!")
    
    except Exception as e:
        db.rollback()
        print(f"Falha ao processar {filename} em background: {str(e)}")
        # Em caso de falha, marca como failed na BD
        generation = (
            db.query(GenerationModel)
            .filter(GenerationModel.id == generation_id)
            .first()
        )
        if generation:
            generation.status = "failed"
            generation.error_message = str(e)
            db.commit()
    finally:
        db.close()  # Garante que a sessão DB fecha


@router.post("/")
async def upload_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_prompt: str = Form(...),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    try:
        # 1. Valida e guarda a imagem original fisicamente
        filename = UploadService.save_uploaded_file(file)
        original_url = f"/static/uploads/{filename}"

        # 2. Criar o Projeto na Base de Dados
        new_project = ProjectModel(user_id=current_user_id, title="Novo Projeto Decozy")
        db.add(new_project)
        db.commit()
        db.refresh(new_project)

        # 3. Criar a Imagem Original na Base de Dados
        original_image = ProjectImageModel(
            project_id=new_project.id, image_type="original", image_url=original_url
        )
        db.add(original_image)

        # 4. Criar a Geração com status processing
        new_generation = GenerationModel(
            project_id=new_project.id,
            prompt=user_prompt,
            status="processing",
            provider="nvidia-flux",
        )
        db.add(new_generation)
        db.commit()
        db.refresh(new_generation)

        # 5. Despacha o processamento da IA para segundo plano
        background_tasks.add_task(
            process_image_with_ai_background,
            project_id=new_project.id,
            generation_id=new_generation.id,
            filename=filename,
            user_prompt=user_prompt
        )

        # 6. Responde imediatamente ao Frontend com o ID do projeto
        return {
            "message": "Upload efetuado. Em processamento...",
            "project_id": new_project.id,
            "status": "processing",
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
    finally:
        file.file.close()
