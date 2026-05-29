.PHONY: env

install: 
	@cd frontend
	@uv sync

up:
	docker-compose up -d

build:
	docker-compose up -d --build

migrate:
	docker-compose exec backend alembic upgrade head

seed:
	docker-compose exec backend python app/seed.py

logs:
	docker-compose logs -f


env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ .env criado"; \
	else \
		echo "ℹ️  .env já existe"; \
	fi
