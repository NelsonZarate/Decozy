"""One-off seed script: insert a fake "generated" project for a given user.

Why this exists
---------------
We don't have the OpenAI / Groq keys to actually run the generation pipeline,
but we still want a realistic, fully-populated project in the database so the
frontend can fetch it from the backend exactly as if it had been generated.

What it does
------------
1. Downloads a "before" (original room) photo and an "after" (redesigned) photo
   into the SAME uploads folder the API serves from (``settings.upload_dir``),
   so the images are reachable at ``/static/uploads/<file>`` — just like a real
   generation.
2. Inserts the matching rows: ``projects`` + two ``project_images`` (original /
   generated) + a completed ``generations`` row + a few ``items`` (furniture).
3. Associates everything with the target user.

How to run (from the host, with the stack up)
---------------------------------------------
    docker compose exec api uv run python seed_demo.py
    # or target another user:  docker compose exec api uv run python seed_demo.py 5

Nothing in the backend application code is modified by this script.
"""

from __future__ import annotations

import os
import sys
import uuid

import requests

from app.core.settings import settings
from app.database.session import SessionLocal
from app.models.project import GenerationModel, ProjectImageModel, ProjectModel
from app.models.item import ItemModel
from app.models.user import UserModel

# Target user id (default 2, overridable via CLI arg).
TARGET_USER_ID = int(sys.argv[1]) if len(sys.argv) > 1 else 2

# Public, royalty-free photos used to fake the before/after render.
BEFORE_PHOTO_URL = "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1280&q=80"
AFTER_PHOTO_URL = "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1280&q=80"

# Furniture "detected" in the design. Items can point at remote image URLs; the
# frontend leaves absolute http(s) URLs untouched.
DEMO_ITEMS = [
    {
        "name": "Linen Modular Sofa",
        "category": "Seating",
        "price": "$1,490",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop",
        "buy_url": "https://example.com/linen-modular-sofa",
    },
    {
        "name": "Arc Floor Lamp",
        "category": "Lighting",
        "price": "$320",
        "image_url": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop",
        "buy_url": "https://example.com/arc-floor-lamp",
    },
    {
        "name": "Oak Coffee Table",
        "category": "Tables",
        "price": "$540",
        "image_url": "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop",
        "buy_url": "https://example.com/oak-coffee-table",
    },
]


def download_image(url: str, prefix: str) -> str:
    """Download `url` into the served uploads dir; return its `/static/...` path."""
    os.makedirs(settings.upload_dir, exist_ok=True)
    filename = f"{prefix}_{uuid.uuid4().hex}.jpg"
    dest = os.path.join(settings.upload_dir, filename)
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    with open(dest, "wb") as fh:
        fh.write(resp.content)
    print(f"  saved {dest} ({len(resp.content)} bytes)")
    return f"/static/uploads/{filename}"


def main() -> None:
    db = SessionLocal()
    try:
        user = db.query(UserModel).filter(UserModel.id == TARGET_USER_ID).first()
        if not user:
            existing = [u.id for u in db.query(UserModel).all()]
            print(f"❌ User id={TARGET_USER_ID} not found. Existing user ids: {existing}")
            sys.exit(1)

        print(f"Seeding demo project for user id={user.id} ({user.email})...")

        print("Downloading photos into the uploads folder...")
        original_url = download_image(BEFORE_PHOTO_URL, "original")
        generated_url = download_image(AFTER_PHOTO_URL, "ai_generated")

        # 1) Project
        project = ProjectModel(user_id=user.id, title="Scandinavian Living Room Redesign")
        db.add(project)
        db.flush()  # assigns project.id

        # 2) Images (original + generated)
        db.add(
            ProjectImageModel(
                project_id=project.id, image_type="original", image_url=original_url
            )
        )
        db.add(
            ProjectImageModel(
                project_id=project.id, image_type="generated", image_url=generated_url
            )
        )

        # 3) Completed generation record (as if the OpenAI pipeline finished)
        db.add(
            GenerationModel(
                project_id=project.id,
                prompt="Style: Scandinavian. Brighten the room, light oak floors, "
                "neutral linen sofa, warm minimal decor.",
                status="completed",
                provider="openai",
                output_url=generated_url,
                error_message=None,
            )
        )

        # 4) Furniture items detected in the design
        for item in DEMO_ITEMS:
            db.add(ItemModel(project_id=project.id, **item))

        db.commit()

        print("✅ Done.")
        print(f"   project_id      = {project.id}")
        print(f"   original_url    = {original_url}")
        print(f"   generated_url   = {generated_url}")
        print(f"   items           = {len(DEMO_ITEMS)}")
        print("   Open the frontend signed in as this user to see it in the Gallery.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
