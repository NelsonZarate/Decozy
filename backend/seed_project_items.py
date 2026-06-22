"""Attach real furniture `items` to existing projects (default ids 1..4).

Why: the frontend can only persist a favorite for an item that exists in the
`items` table (FK `user_saved_items.item_id -> items.id`). Projects without
items fall back to placeholder furniture with non-numeric ids, which never
persist. This script inserts a couple of real items per project so favoriting
them from the gallery saves to the database.

Run from the host with the stack up:
    docker compose exec api uv run python seed_project_items.py
    # custom project ids:
    #   docker compose exec api uv run python seed_project_items.py 1 2 3 4

Idempotent: a project that already has items is left untouched. Does not modify
any backend application code.
"""

from __future__ import annotations

import sys

from app.database.session import SessionLocal
from app.models.item import ItemModel
from app.models.project import ProjectModel

PROJECT_IDS = [int(a) for a in sys.argv[1:]] or [1, 2, 3, 4]

# Two furniture items per project (name, category, price, image_url).
ITEMS_BY_PROJECT: dict[int, list[tuple[str, str, str, str]]] = {
    1: [
        ("Scandi Oak Frame Sofa", "Seating", "$1,249", "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop"),
        ("Arc Minimalist Floor Lamp", "Lighting", "$320", "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop"),
    ],
    2: [
        ("Walnut Office Chair", "Seating", "$185", "https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=600&fit=crop"),
        ("Whitewash Coffee Table", "Tables", "$520", "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop"),
    ],
    3: [
        ("Low Platform Oak Bed", "Bedroom", "$890", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=600&fit=crop"),
        ("Paper Lantern Nightstand", "Tables", "$140", "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop"),
    ],
    4: [
        ("Rattan Accent Chair", "Seating", "$410", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop"),
        ("Carrara Marble Coffee Table", "Tables", "$650", "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop"),
    ],
}

# Fallback furniture for any project id not explicitly listed above.
DEFAULT_ITEMS = [
    ("Accent Lounge Chair", "Seating", "$390", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop"),
    ("Oak Coffee Table", "Tables", "$540", "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop"),
]


def main() -> None:
    db = SessionLocal()
    try:
        for project_id in PROJECT_IDS:
            project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
            if not project:
                print(f"⚠️  Project id={project_id} not found — skipping.")
                continue

            existing = db.query(ItemModel).filter(ItemModel.project_id == project_id).count()
            if existing > 0:
                print(f"↪️  Project id={project_id} already has {existing} item(s) — skipping.")
                continue

            items = ITEMS_BY_PROJECT.get(project_id, DEFAULT_ITEMS)
            created_ids = []
            for name, category, price, image_url in items:
                row = ItemModel(
                    project_id=project_id,
                    name=name,
                    category=category,
                    price=price,
                    image_url=image_url,
                    buy_url=None,
                )
                db.add(row)
                db.flush()  # assign id
                created_ids.append(row.id)

            print(
                f"✅ Project id={project_id} (user_id={project.user_id}): "
                f"added items {created_ids}"
            )

        db.commit()
        print("Done. Favorite these from the gallery and they persist in user_saved_items.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
