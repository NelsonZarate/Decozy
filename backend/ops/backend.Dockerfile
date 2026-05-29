FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uv/bin/uv

ENV PATH="/uv/bin:${PATH}"
ENV PYTHONPATH=/app/backend/src

WORKDIR /app

COPY pyproject.toml uv.lock ./


COPY backend/ ./backend/

RUN uv sync --frozen --no-cache

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]