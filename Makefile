BACKEND_DIR = backend
.PHONY: env

install: 
	@cd frontend
	@uv sync

start:
	@$(MAKE) env
	@$(MAKE) build
	@echo "Waiting for api..."
	@until docker compose exec api true >/dev/null 2>&1; do \
		sleep 2; \
	done
	@$(MAKE) db-upgrade
	@$(MAKE) tests

up:
	docker compose up -d

build:
	docker compose up -d --build

db-migrate:
	@if [ -z "$(m)" ]; then \
		echo "Erro: Tens de passar uma mensagem. Exemplo: make db-migrate m='add_user_avatar'"; \
		exit 1; \
	fi
	@docker compose exec api \
		uv run alembic -c alembic.ini revision --autogenerate -m "$(m)"

db-upgrade:
	@docker compose exec api \
		uv run alembic -c alembic.ini upgrade head

db-downgrade:
	@docker compose exec api \
		uv run alembic -c backend/alembic.ini downgrade -1


logs:
	docker compose logs -f


env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ .env criado"; \
	else \
		echo "ℹ️  .env já existe"; \
	fi

tests:
	@docker compose exec api uv run pytest -v --disable-warnings --maxfail=1