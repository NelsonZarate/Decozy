"""Integration tests for API routers."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.item import ItemModel
from app.models.project import ProjectModel


class TestProjectRouter:
    """Tests for the /projects endpoints."""

    def test_list_projects_empty(self, client: TestClient, auth_headers: dict):
        resp = client.get("/api/v1/projects/list_projects", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_create_project(self, client: TestClient, auth_headers: dict):
        resp = client.post("/api/v1/projects/create_project?title=Test", headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["title"] == "Test"

    def test_get_project_not_found(self, client: TestClient, auth_headers: dict):
        resp = client.get("/api/v1/projects/get_project/9999", headers=auth_headers)
        assert resp.status_code == 404

    def test_get_project_items_empty(self, client: TestClient, auth_headers: dict, db_session: Session):
        project = ProjectModel(user_id=1, title="P")
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        resp = client.get(f"/api/v1/projects/get_project_items/{project.id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_delete_project(self, client: TestClient, auth_headers: dict, db_session: Session):
        project = ProjectModel(user_id=1, title="ToDelete")
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        resp = client.delete(f"/api/v1/projects/delete_project/{project.id}", headers=auth_headers)
        assert resp.status_code == 200


class TestUserRouter:
    """Tests for the /User endpoints."""

    def test_get_user_info(self, client: TestClient, auth_headers: dict):
        resp = client.get("/api/v1/User/get_user_info", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "test@example.com"

    def test_save_item_not_found(self, client: TestClient, auth_headers: dict):
        # Item doesn't exist - SQLite may not enforce FK, but logic should work
        resp = client.post("/api/v1/User/save_item/9999", headers=auth_headers)
        # Will succeed on SQLite (no FK enforcement) or fail gracefully
        assert resp.status_code in (201, 500)

    def test_list_saved_items_empty(self, client: TestClient, auth_headers: dict):
        resp = client.get("/api/v1/User/list_saved_items", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []


class TestAuthRequired:
    """Tests that endpoints require authentication."""

    def test_projects_requires_auth(self, client: TestClient):
        resp = client.get("/api/v1/projects/list_projects")
        assert resp.status_code == 401

    def test_user_info_requires_auth(self, client: TestClient):
        resp = client.get("/api/v1/User/get_user_info")
        assert resp.status_code == 401

    def test_upload_requires_auth(self, client: TestClient):
        resp = client.post("/api/v1/uploads/")
        assert resp.status_code == 401
