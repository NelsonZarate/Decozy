"""Set a local image as the AI-generated image of an existing project.

Defaults: copies ``image.png`` (staged at the backend root) into the served
uploads folder as ``ai_generated_image.png`` and points project id=3's
``generated`` image (and its latest generation's ``output_url``) at it.

Run from the host with the stack up:
    docker compose exec api uv run python set_project_image.py
    # optional args:  set_project_image.py <project_id> <source_file>
    #   e.g.           set_project_image.py 3 image.png

Does not modify any backend application code.
"""

from __future__ import annotations

import os
import shutil
import sys

from app.database.session import SessionLocal
from app.core.settings import settings
from app.models.project import GenerationModel, ProjectImageModel, ProjectModel

PROJECT_ID = int(sys.argv[1]) if len(sys.argv) > 1 else 3
SOURCE_FILE = sys.argv[2] if len(sys.argv) > 2 else "image.png"
DEST_FILENAME = "ai_generated_image.png"


def main() -> None:
    if not os.path.exists(SOURCE_FILE):
        print(f"❌ Source image '{SOURCE_FILE}' not found in {os.getcwd()}.")
        sys.exit(1)

    os.makedirs(settings.upload_dir, exist_ok=True)
    dest_path = os.path.join(settings.upload_dir, DEST_FILENAME)
    shutil.copyfile(SOURCE_FILE, dest_path)
    image_url = f"/static/uploads/{DEST_FILENAME}"
    print(f"Copied '{SOURCE_FILE}' -> '{dest_path}'  (served at {image_url})")

    db = SessionLocal()
    try:
        project = db.query(ProjectModel).filter(ProjectModel.id == PROJECT_ID).first()
        if not project:
            existing = [p.id for p in db.query(ProjectModel).all()]
            print(f"❌ Project id={PROJECT_ID} not found. Existing project ids: {existing}")
            sys.exit(1)

        # Update (or create) the project's "generated" image.
        generated = (
            db.query(ProjectImageModel)
            .filter(
                ProjectImageModel.project_id == PROJECT_ID,
                ProjectImageModel.image_type == "generated",
            )
            .first()
        )
        if generated:
            generated.image_url = image_url
            print(f"Updated existing generated image (image id={generated.id}).")
        else:
            db.add(
                ProjectImageModel(
                    project_id=PROJECT_ID, image_type="generated", image_url=image_url
                )
            )
            print("No generated image existed; created a new one.")

        # Keep the latest generation's output_url consistent.
        generation = (
            db.query(GenerationModel)
            .filter(GenerationModel.project_id == PROJECT_ID)
            .order_by(GenerationModel.created_at.desc())
            .first()
        )
        if generation:
            generation.output_url = image_url
            if generation.status != "completed":
                generation.status = "completed"
            print(f"Updated generation id={generation.id} (status={generation.status}).")

        db.commit()
        print(f"✅ Project id={PROJECT_ID} now uses {image_url} as its AI-generated image.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
