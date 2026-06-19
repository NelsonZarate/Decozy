"""Comprehensive integration tests for Decozy backend.

Covers: Auth flow, Project CRUD, AI Generation pipeline (mocked),
Stripe checkout + webhook, and E2E simulation.
"""

import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.item import ItemModel, UserSavedItemModel
from app.models.order import OrderModel
from app.models.project import GenerationModel, ProjectImageModel, ProjectModel


# ─── AUTH FLOW ────────────────────────────────────────────────────────────────


class TestAuthFlow:
    """Full registration and login flow."""

    def test_register_returns_token(self, client: TestClient):
        resp = client.post("/api/v1/auth/register", json={"email": "new@test.com", "password": "Str0ng!"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user_id" in data

    def test_register_duplicate_email_fails(self, client: TestClient):
        client.post("/api/v1/auth/register", json={"email": "dup@test.com", "password": "pass123"})
        resp = client.post("/api/v1/auth/register", json={"email": "dup@test.com", "password": "pass456"})
        assert resp.status_code == 400

    def test_login_after_register(self, client: TestClient):
        client.post("/api/v1/auth/register", json={"email": "login@test.com", "password": "MyPass1"})
        resp = client.post("/api/v1/auth/login", data={"username": "login@test.com", "password": "MyPass1"})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_login_wrong_password(self, client: TestClient):
        client.post("/api/v1/auth/register", json={"email": "wrong@test.com", "password": "correct"})
        resp = client.post("/api/v1/auth/login", data={"username": "wrong@test.com", "password": "incorrect"})
        assert resp.status_code == 400

    def test_login_nonexistent_user(self, client: TestClient):
        resp = client.post("/api/v1/auth/login", data={"username": "ghost@test.com", "password": "x"})
        assert resp.status_code == 400

    def test_protected_endpoint_without_token(self, client: TestClient):
        resp = client.get("/api/v1/User/get_user_info")
        assert resp.status_code == 401

    def test_protected_endpoint_with_invalid_token(self, client: TestClient):
        resp = client.get("/api/v1/User/get_user_info", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code == 401


# ─── PROJECT CRUD ─────────────────────────────────────────────────────────────


class TestProjectCRUD:
    """Full project lifecycle tests."""

    def test_create_and_list_project(self, client: TestClient, auth_headers: dict):
        resp = client.post("/api/v1/projects/create_project?title=MyRoom", headers=auth_headers)
        assert resp.status_code == 201
        project_id = resp.json()["id"]

        resp = client.get("/api/v1/projects/list_projects", headers=auth_headers)
        assert resp.status_code == 200
        assert any(p["id"] == project_id for p in resp.json())

    def test_get_project_details(self, client: TestClient, auth_headers: dict, db_session: Session):
        project = ProjectModel(user_id=1, title="Detail")
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        resp = client.get(f"/api/v1/projects/get_project/{project.id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Detail"

    def test_change_project_title(self, client: TestClient, auth_headers: dict, db_session: Session):
        project = ProjectModel(user_id=1, title="Old")
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        resp = client.put(
            f"/api/v1/projects/change_project_title/{project.id}?new_title=New",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "New"

    def test_delete_project_cascades(self, client: TestClient, auth_headers: dict, db_session: Session):
        project = ProjectModel(user_id=1, title="Del")
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Add related data
        db_session.add(ItemModel(project_id=project.id, name="Sofa", category="furniture", image_url="/x"))
        db_session.add(ProjectImageModel(project_id=project.id, image_type="original", image_url="/y"))
        db_session.add(GenerationModel(project_id=project.id, prompt="test", status="completed"))
        db_session.commit()

        resp = client.delete(f"/api/v1/projects/delete_project/{project.id}", headers=auth_headers)
        assert resp.status_code == 200

        # Verify cascade
        assert db_session.query(ItemModel).filter(ItemModel.project_id == project.id).count() == 0
        assert db_session.query(GenerationModel).filter(GenerationModel.project_id == project.id).count() == 0

    def test_cannot_access_other_users_project(self, client: TestClient, auth_headers: dict, db_session: Session):
        # auth_headers belong to user_id=1, create project for a different user
        from app.models.user import UserModel
        other_user = UserModel(email="other@test.com", plan="free")
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        project = ProjectModel(user_id=other_user.id, title="NotMine")
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        resp = client.get(f"/api/v1/projects/get_project/{project.id}", headers=auth_headers)
        assert resp.status_code == 404


# ─── AI GENERATION PIPELINE (MOCKED) ─────────────────────────────────────────


class TestGenerationPipeline:
    """Test upload + background generation with mocked external APIs."""

    @patch("app.api.v1.routers.upload.process_image_with_ai_background")
    @patch("app.services.upload.UploadService.save_uploaded_file")
    def test_upload_creates_project_and_generation(
        self, mock_save, mock_bg_task, client: TestClient, auth_headers: dict, db_session: Session
    ):
        """Upload should create project, image record, generation record, and dispatch background task."""
        mock_save.return_value = "fake_uuid.png"

        resp = client.post(
            "/api/v1/uploads/",
            headers=auth_headers,
            files={"file": ("room.png", b"fake image data", "image/png")},
            data={"user_prompt": "Make it modern"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "processing"
        assert "project_id" in data

        # Verify DB state
        project = db_session.query(ProjectModel).filter(ProjectModel.id == data["project_id"]).first()
        assert project is not None
        assert project.user_id == 1

        generation = db_session.query(GenerationModel).filter(GenerationModel.project_id == project.id).first()
        assert generation is not None
        assert generation.status == "processing"
        assert generation.prompt == "Make it modern"

    @patch("app.api.v1.routers.upload.process_image_with_ai_background")
    @patch("app.services.upload.UploadService.save_uploaded_file")
    def test_upload_rejects_invalid_file(self, mock_save, mock_bg, client: TestClient, auth_headers: dict):
        """Upload should reject non-image files."""
        mock_save.side_effect = ValueError("Formato inválido. Apenas JPG, PNG e WEBP são permitidos.")

        resp = client.post(
            "/api/v1/uploads/",
            headers=auth_headers,
            files={"file": ("doc.pdf", b"pdf data", "application/pdf")},
            data={"user_prompt": "test"},
        )
        assert resp.status_code == 400

    def test_items_not_auto_saved_to_favorites(self, client: TestClient, auth_headers: dict, db_session: Session):
        """CRITICAL: Items from generation must NOT be in user_saved_items automatically."""
        project = ProjectModel(user_id=1, title="GenTest")
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Simulate items created by AI (as the asset crew would do)
        item1 = ItemModel(project_id=project.id, name="Modern Sofa", category="sofa", image_url="/img1")
        item2 = ItemModel(project_id=project.id, name="Oak Table", category="table", image_url="/img2")
        db_session.add_all([item1, item2])
        db_session.commit()

        # Verify items exist in project
        resp = client.get(f"/api/v1/projects/get_project_items/{project.id}", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

        # CRITICAL: Verify items are NOT in user_saved_items
        saved = db_session.query(UserSavedItemModel).filter(UserSavedItemModel.user_id == 1).all()
        assert len(saved) == 0

        # Also verify via API
        resp = client.get("/api/v1/User/list_saved_items", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_generation_status_polling(self, client: TestClient, auth_headers: dict, db_session: Session):
        """Frontend polls project details to check generation status."""
        project = ProjectModel(user_id=1, title="Poll")
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        gen = GenerationModel(project_id=project.id, prompt="test", status="processing")
        db_session.add(gen)
        db_session.commit()

        resp = client.get(f"/api/v1/projects/get_project/{project.id}", headers=auth_headers)
        assert resp.json()["generation_status"] == "processing"

        # Simulate completion
        gen.status = "completed"
        gen.output_url = "/static/uploads/result.png"
        db_session.commit()

        resp = client.get(f"/api/v1/projects/get_project/{project.id}", headers=auth_headers)
        assert resp.json()["generation_status"] == "completed"


# ─── STRIPE PAYMENTS ──────────────────────────────────────────────────────────


class TestStripePayments:
    """Stripe checkout and webhook tests."""

    @patch("app.api.v1.routers.payments.stripe.checkout.Session.create")
    def test_create_checkout_session(self, mock_stripe, client: TestClient, auth_headers: dict, db_session: Session):
        """Checkout should calculate total from items and create Stripe session."""
        project = ProjectModel(user_id=1, title="Shop")
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        item1 = ItemModel(project_id=project.id, name="Chair", category="chair", price="€49.99", image_url="/c")
        item2 = ItemModel(project_id=project.id, name="Lamp", category="lamp", price="€29.99", image_url="/l")
        db_session.add_all([item1, item2])
        db_session.commit()
        db_session.refresh(item1)
        db_session.refresh(item2)

        mock_stripe.return_value = MagicMock(id="cs_test_123", url="https://checkout.stripe.com/test")

        resp = client.post(
            "/api/v1/payments/create-checkout-session",
            headers=auth_headers,
            json={"project_id": project.id, "item_ids": [item1.id, item2.id]},
        )
        assert resp.status_code == 200
        assert resp.json()["checkout_url"] == "https://checkout.stripe.com/test"

        # Verify order in DB
        order = db_session.query(OrderModel).first()
        assert order is not None
        assert order.status == "pending"
        assert order.total_cents == 4999 + 2999  # €49.99 + €29.99
        assert order.stripe_session_id == "cs_test_123"

    @patch("app.api.v1.routers.payments.stripe.checkout.Session.create")
    def test_checkout_rejects_empty_items(self, mock_stripe, client: TestClient, auth_headers: dict, db_session: Session):
        """Checkout should fail if no valid items."""
        project = ProjectModel(user_id=1, title="Empty")
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        resp = client.post(
            "/api/v1/payments/create-checkout-session",
            headers=auth_headers,
            json={"project_id": project.id, "item_ids": [999]},
        )
        assert resp.status_code == 400

    @patch("app.api.v1.routers.payments.stripe.Webhook.construct_event")
    def test_webhook_marks_order_paid(self, mock_construct, client: TestClient, auth_headers: dict, db_session: Session):
        """Webhook with checkout.session.completed should mark order as paid."""
        # Create order (user_id=1 from auth_headers fixture)
        project = ProjectModel(user_id=1, title="WH")
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        order = OrderModel(user_id=1, project_id=project.id, status="pending", total_cents=5000, stripe_session_id="cs_test_456")
        db_session.add(order)
        db_session.commit()
        db_session.refresh(order)

        # Mock Stripe event
        mock_construct.return_value = {
            "type": "checkout.session.completed",
            "data": {"object": {"metadata": {"order_id": str(order.id), "project_id": str(project.id)}}},
        }

        resp = client.post(
            "/api/v1/payments/webhook",
            content=b'{"fake": "payload"}',
            headers={"stripe-signature": "fake_sig"},
        )
        assert resp.status_code == 200
        assert resp.json() == {"received": True}

        # Verify order status updated
        db_session.refresh(order)
        assert order.status == "paid"

    @patch("app.api.v1.routers.payments.stripe.Webhook.construct_event")
    def test_webhook_invalid_signature(self, mock_construct, client: TestClient):
        """Webhook should reject invalid Stripe signature."""
        from stripe import SignatureVerificationError
        mock_construct.side_effect = SignatureVerificationError("bad sig", "header")

        resp = client.post(
            "/api/v1/payments/webhook",
            content=b"bad",
            headers={"stripe-signature": "invalid"},
        )
        assert resp.status_code == 400

    @patch("app.api.v1.routers.payments.stripe.Webhook.construct_event")
    def test_webhook_ignores_other_events(self, mock_construct, client: TestClient, db_session: Session):
        """Webhook should ignore non-checkout events."""
        mock_construct.return_value = {"type": "payment_intent.succeeded", "data": {"object": {}}}

        resp = client.post(
            "/api/v1/payments/webhook",
            content=b'{"type": "payment_intent.succeeded"}',
            headers={"stripe-signature": "sig"},
        )
        assert resp.status_code == 200


# ─── E2E SIMULATION ──────────────────────────────────────────────────────────


class TestE2EFlow:
    """End-to-end simulation: register → upload → generate → checkout → webhook → paid."""

    @patch("app.api.v1.routers.payments.stripe.Webhook.construct_event")
    @patch("app.api.v1.routers.payments.stripe.checkout.Session.create")
    @patch("app.api.v1.routers.upload.process_image_with_ai_background")
    @patch("app.services.upload.UploadService.save_uploaded_file")
    def test_full_user_journey(
        self,
        mock_save_file,
        mock_bg_task,
        mock_stripe_checkout,
        mock_stripe_webhook,
        client: TestClient,
        db_session: Session,
    ):
        """Simulate complete user journey from registration to payment."""
        # 1. Register
        resp = client.post("/api/v1/auth/register", json={"email": "e2e@test.com", "password": "E2ePass1!"})
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Upload image (triggers generation)
        mock_save_file.return_value = "e2e_room.png"
        resp = client.post(
            "/api/v1/uploads/",
            headers=headers,
            files={"file": ("room.png", b"fake png", "image/png")},
            data={"user_prompt": "Add a modern sofa and coffee table"},
        )
        assert resp.status_code == 200
        project_id = resp.json()["project_id"]

        # 3. Check generation is processing
        resp = client.get(f"/api/v1/projects/get_project/{project_id}", headers=headers)
        assert resp.json()["generation_status"] == "processing"

        # 4. Simulate background task completing (directly update DB)
        generation = db_session.query(GenerationModel).filter(GenerationModel.project_id == project_id).first()
        generation.status = "completed"
        generation.output_url = "/static/uploads/ai_e2e_room.png"

        # Add generated image
        db_session.add(ProjectImageModel(project_id=project_id, image_type="generated", image_url="/static/uploads/ai_e2e_room.png"))

        # Simulate AI creating items (asset crew)
        item1 = ItemModel(project_id=project_id, name="Modern Sofa", category="sofa", price="€899.99", image_url="/sofa.png")
        item2 = ItemModel(project_id=project_id, name="Coffee Table", category="table", price="€249.99", image_url="/table.png")
        db_session.add_all([item1, item2])
        db_session.commit()
        db_session.refresh(item1)
        db_session.refresh(item2)

        # 5. Verify generation completed
        resp = client.get(f"/api/v1/projects/get_project/{project_id}", headers=headers)
        assert resp.json()["generation_status"] == "completed"

        # 6. CRITICAL: Items NOT in favorites
        resp = client.get("/api/v1/User/list_saved_items", headers=headers)
        assert resp.json() == []

        # 7. Get project items
        resp = client.get(f"/api/v1/projects/get_project_items/{project_id}", headers=headers)
        assert resp.status_code == 200
        items = resp.json()
        assert len(items) == 2

        # 8. Create checkout session
        mock_stripe_checkout.return_value = MagicMock(id="cs_e2e_001", url="https://checkout.stripe.com/e2e")
        resp = client.post(
            "/api/v1/payments/create-checkout-session",
            headers=headers,
            json={"project_id": project_id, "item_ids": [item1.id, item2.id]},
        )
        assert resp.status_code == 200
        assert "checkout_url" in resp.json()

        # 9. Verify order is pending
        order = db_session.query(OrderModel).filter(OrderModel.stripe_session_id == "cs_e2e_001").first()
        assert order is not None
        assert order.status == "pending"
        assert order.total_cents == 89999 + 24999  # €899.99 + €249.99

        # 10. Simulate Stripe webhook (payment completed)
        mock_stripe_webhook.return_value = {
            "type": "checkout.session.completed",
            "data": {"object": {"metadata": {"order_id": str(order.id), "project_id": str(project_id)}}},
        }
        resp = client.post(
            "/api/v1/payments/webhook",
            content=b'{"id": "evt_e2e"}',
            headers={"stripe-signature": "whsec_e2e"},
        )
        assert resp.status_code == 200

        # 11. Verify order is now paid
        db_session.refresh(order)
        assert order.status == "paid"
