# 🤖 Documentação de Uso de Inteligência Artificial (IA)

Este documento regista como a Inteligência Artificial foi utilizada como assistente de copiloto ao longo do ciclo de desenvolvimento do projeto **Decozy** — desde o planeamento até à garantia de qualidade.

---

## 🛠️ Ferramentas Utilizadas

| Ferramenta | Contexto de uso |
|---|---|
| Google Gemini | Copiloto principal — arquitetura, debugging, documentação |
| Kiro (Claude) | Revisão de código, refactoring e otimização de prompts |

**Papel geral:** Copiloto de Engenharia de Software, DevOps e QA — acelerar decisões técnicas, resolver bloqueios e manter qualidade de código.

---

## 🗺️ Contextos de Utilização & Soluções

### 1. Planeamento e Arquitetura

| Entregável | Contribuição da IA |
|---|---|
| `README.md` com diagramas Mermaid | Estruturação do ER diagram, sequence diagram e architecture graph |
| Divisão de tasks do MVP | Mapeamento de dependências entre features (auth → projetos → geração) |
| Modelagem da base de dados | Definição das relações entre `USER`, `SUBSCRIPTION`, `PROJECT`, `GENERATION` e `ITEM` |

A IA ajudou a definir a separação modular entre autenticação (`USER_IDENTITY`), dados operacionais (`PROJECT`, `GENERATION`) e pagamentos (`SUBSCRIPTION`, `STRIPE_EVENT`), o que facilita a evolução futura do sistema.

---

### 2. Infraestrutura e DevOps

#### Docker Compose

O ambiente local corre com 5 serviços (`nginx`, `api`, `frontend`, `database`, `adminer`). A IA assistiu na resolução dos seguintes problemas:

- **Conflitos de portas:** identificação de processos a bloquear portas com `lsof -i :3000` e `lsof -i :8000`
- **Health checks do PostgreSQL:** configuração do `pg_isready` para garantir que a API só arranca quando a base de dados está pronta
- **Volumes e persistência:** mapeamento correto entre o Docker Volume e a pasta `static/uploads` para servir imagens geradas

#### CI/CD (GitHub Actions)

- Pipeline com `ruff check` e `ruff format --check` para linting automático
- Configuração do `uv sync` para instalação de dependências no CI

---

### 3. Backend — API e Lógica de Negócio

#### Rotas e Endpoints (FastAPI)

- Depuração de erros em endpoints protegidos por JWT (`app/api/deps.py`)
- Implementação do fluxo de upload multipart com validação MIME (`image/jpeg`, `image/png`)
- Lógica de quota diária: validação de `daily_generations_count` e `last_generation_date` antes de enviar tasks para a OpenAI

#### Integração CrewAI (`services/crewai_service.py`)

A IA foi fundamental na arquitetura do sistema multi-agente:

- **Agente 1 — Prompt Architect:** valida se o pedido é sobre decoração, extrai intent (`add`/`remove`/`none`) e gera um prompt otimizado para o modelo de geração de imagem
- **Agente 2 — Asset Specialist:** cria assets e-commerce fictícios (nome, categoria, preço, URL) e persiste-os na base de dados via `DatabaseTool`
- **LLM customizado (`LangChainGroqLLM`):** wrapper sobre a API da Groq que integra com o framework CrewAI, com tracking de token usage e tratamento de erros

A IA ajudou a resolver problemas específicos como:
- Normalização de mensagens entre formatos CrewAI e LangChain
- Parsing estrito de JSON nas respostas dos agentes (`_extract_strict_json`)
- Validação de output com Pydantic (`PromptArchitectureResult`, `SavedItemResult`)

#### Serviço de Geração de Imagem (`services/ai_service.py`)

- Orquestração do fluxo assíncrono: criação do registo → background task → polling do frontend
- Integração com a API da NVIDIA/OpenAI para geração de imagens
- Fallback de imagem do item quando a geração individual falha

---

### 4. Pagamentos (Stripe)

- Configuração do webhook endpoint com idempotência via tabela `STRIPE_EVENT`
- Lógica de prevenção de duplicação: verificar `stripe_event_id` antes de processar alterações de plano

---

### 5. Garantia de Qualidade (QA)

#### Testes Automatizados (Pytest)

| Ficheiro | Cobertura |
|---|---|
| `tests/conftest.py` | Fixtures com SQLite in-memory, override de dependências, geração de JWT para testes autenticados |
| `tests/test_integration.py` | Testes end-to-end das rotas da API |
| `tests/test_routers.py` | Testes unitários dos handlers |
| `tests/test_upload_service.py` | Validação de MIME types e persistência de ficheiros |
| `tests/test_payments.py` | Fluxo de webhooks Stripe |

A IA ajudou a configurar o monkey-patch de `JSONB → JSON` para correr testes PostgreSQL sobre SQLite, e a implementar a fixture `auth_headers` com geração de JWT válido.

#### Documentação de Código (JSDoc)

- Estruturação de comentários padronizados nas funções do frontend para facilitar manutenção futura

#### Linting e Formatação

- Configuração do Ruff como linter e formatter único para o backend Python
- Integração com pre-commit hooks (`.pre-commit-config.yaml`)
