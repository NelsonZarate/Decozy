"""Seed the frontend's mock furniture into the `items` table with FIXED ids.

The backend enforces a foreign key `user_saved_items.item_id -> items.id`, so a
furniture item can only be favorited if it exists in `items`. The frontend mock
data uses these same fixed ids, so once this runs, favoriting any mock item
persists to the database via POST /User/save_item/{id}.

Run from the host with the stack up:
    docker compose exec api uv run python seed_catalog.py
    # optional: attach the catalog project to another user
    #   docker compose exec api uv run python seed_catalog.py <user_id>

Idempotent: re-running skips items whose id already exists. Does not modify any
backend application code.
"""

from __future__ import annotations

import sys

from app.database.session import SessionLocal
from app.models.item import ItemModel
from app.models.project import ProjectModel
from app.models.user import UserModel

TARGET_USER_ID = int(sys.argv[1]) if len(sys.argv) > 1 else 2
CATALOG_TITLE = "__catalog_demo__"

# Fixed-id catalog mirroring the frontend mock furniture.
# (id, name, category, price, image_url)
CATALOG_ITEMS = [
    # gallery-mock.json furniture
    (9001, "Scandi Oak Frame Sofa", "Seating", "$1,249", "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop"),
    (9002, "Arc Minimalist Floor Lamp", "Lighting", "$320", "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop"),
    (9003, "Walnut Office Chair", "Seating", "$185", "https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=600&fit=crop"),
    (9004, "Low Platform Oak Bed", "Bedroom", "$890", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=600&fit=crop"),
    (9005, "Paper Lantern Nightstand", "Tables", "$140", "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop"),
    (9006, "Rattan Accent Chair", "Seating", "$410", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop"),
    (9007, "Whitewash Coffee Table", "Tables", "$520", "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop"),
    # FavoritesContext seed favorites
    (9011, "Scandi Oak Frame Sofa", "Seating", "$1,249", "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop"),
    (9012, "Arc Minimalist Floor Lamp", "Lighting", "$320", "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop"),
    (9013, "Walnut Dining Chair", "Seating", "$185", "https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=600&fit=crop"),
    (9014, "Carrara Marble Coffee Table", "Tables", "$650", "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=600&fit=crop"),
]


def main() -> None:
    db = SessionLocal()
    try:
        user = db.query(UserModel).filter(UserModel.id == TARGET_USER_ID).first()
        if not user:
            existing = [u.id for u in db.query(UserModel).all()]
            print(f"❌ User id={TARGET_USER_ID} not found. Existing user ids: {existing}")
            sys.exit(1)

        # Dedicated project to attach the catalog items to (items.project_id is
        # NOT NULL). Reused across runs.
        catalog = (
            db.query(ProjectModel)
            .filter(ProjectModel.user_id == user.id, ProjectModel.title == CATALOG_TITLE)
            .first()
        )
        if not catalog:
            catalog = ProjectModel(user_id=user.id, title=CATALOG_TITLE)
            db.add(catalog)
            db.flush()
            print(f"Created catalog project id={catalog.id} for user id={user.id}")
        else:
            print(f"Reusing catalog project id={catalog.id}")

        created, skipped = 0, 0
        for item_id, name, category, price, image_url in CATALOG_ITEMS:
            if db.query(ItemModel).filter(ItemModel.id == item_id).first():
                skipped += 1
                continue
            db.add(
                ItemModel(
                    id=item_id,
                    project_id=catalog.id,
                    name=name,
                    category=category,
                    price=price,
                    image_url=image_url,
                    buy_url=None,
                )
            )
            created += 1

        db.commit()
        print(f"✅ Catalog ready. items created={created}, skipped(existing)={skipped}")
        print("   Mock furniture can now be favorited and will persist in user_saved_items.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
