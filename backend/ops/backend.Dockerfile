FROM python:3.12-slim

# 1. Instalar dependências de sistema necessárias
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Instalar o UV globalmente
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uv/bin/uv
ENV PATH="/uv/bin:${PATH}"

# 3. Mudar o WORKDIR para a pasta real do backend dentro do container!
WORKDIR /app/backend/

# 4. Copiar os ficheiros de configuração (estando o contexto na pasta backend)
COPY pyproject.toml ./
COPY uv.lock ./
# 5. Sincronizar as dependências de forma limpa
RUN uv sync --frozen --no-cache

# 6. Copiar o resto do código do backend
COPY . .

# 7. Diz ao Python onde encontrar a pasta 'app' (dentro de src)
ENV PYTHONPATH=/app/backend/src

EXPOSE 8000

# 8. Chamar o uvicorn através do 'uv run' a partir de dentro de /app/backend
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]