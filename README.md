# Decozy Architecture & Documentation

Este ficheiro funciona como referência técnica do MVP da plataforma Decozy, desenvolvido para o projeto final de Web Programming da ETIC_Algarve.

## Conteúdo

1. [Visão geral](#visão-geral)
2. [Base de dados](#base-de-dados)
3. [Arquitetura do sistema](#arquitetura-do-sistema)
4. [Fluxo assíncrono de geração por IA](#fluxo-assíncrono-de-geração-por-ia)
5. [Core stack e deploy](#core-stack-e-deploy)
6. [Regras de negócio](#regras-de-negócio)

## Visão geral

A solução foi desenhada para equilibrar velocidade de desenvolvimento com uma base técnica sólida. O foco está em três áreas:

- geração assíncrona de imagens com IA;
- separação clara entre autenticação, projetos e subscrições;
- base preparada para evoluir de MVP local para uma arquitetura cloud.

## Base de dados

O modelo utiliza PostgreSQL e segue uma separação modular entre o utilizador, as credenciais de autenticação e os dados operacionais do produto.

```mermaid
erDiagram
    USER {
        int id PK
        string email UK
        string plan "free | monthly | annual"
        int daily_generations_count
        date last_generation_date
        timestamp created_at
    }

    USER_IDENTITY {
        int id PK
        int user_id FK
        string provider "local | google"
        string provider_user_id
        string password_hash
    }

    SUBSCRIPTION {
        int id PK
        int user_id FK
        string provider "stripe"
        string external_id UK
        string plan "premium"
        string status "active | canceled"
        timestamp current_period_end
        timestamp created_at
    }

    PROJECT {
        int id PK
        int user_id FK
        string title
        timestamp created_at
    }

    PROJECT_IMAGE {
        int id PK
        int project_id FK
        string image_type "original | generated"
        string image_url
        timestamp created_at
    }

    GENERATION {
        int id PK
        int project_id FK
        string prompt
        string status "queued | processing | completed | failed"
        string provider "openai"
        string provider_job_id
        string output_url
        text error_message
        timestamp created_at
    }

    ITEM {
        int id PK
        string name
        string category
        string image_url
    }

    USER_SAVED_ITEM {
        int id PK
        int user_id FK
        int item_id FK
        timestamp created_at
    }

    STRIPE_EVENT {
        int id PK
        string stripe_event_id UK
        string event_type
        json payload
        timestamp processed_at
    }

    USER ||--o{ USER_IDENTITY : has
    USER ||--o| SUBSCRIPTION : owns
    USER ||--o{ PROJECT : creates
    USER ||--o{ USER_SAVED_ITEM : saves

    PROJECT ||--o{ PROJECT_IMAGE : contains
    PROJECT ||--o{ GENERATION : generates

    ITEM ||--o{ USER_SAVED_ITEM : bookmarked
```

## Arquitetura do sistema

O sistema é composto por um frontend Next.js, um backend FastAPI e serviços externos para autenticação, pagamentos e geração de imagens. Em ambiente local, tudo corre dentro de Docker Compose.

```mermaid
graph TD
    subgraph Client_Side [Client Side]
        Browser["Web App (Next.js)"]
    end

    subgraph Docker_Container_Network [Docker Compose Environment]
        API["FastAPI App Server<br>Port 8000"]
        DB[("PostgreSQL Database<br>Port 5432")]
        Adminer["Adminer (DB Admin)<br>Port 8080"]
        StorageVolume[("Local Docker Volume<br>/app/static/uploads")]
    end

    subgraph External_APIs [External Services]
        Google["Google OAuth 2.0"]
        Stripe["Stripe API<br>(Test Mode)"]
        OpenAI["OpenAI API<br>(DALL-E 3 / Vision)"]
    end

    Browser <-->|HTTP / JSON / JWT| API
    API <-->|SQLAlchemy / Alembic| DB
    Adminer -.->|DB Visual Management| DB
    API <-->|Read / Write Images| StorageVolume
    Browser ---->|Serve Uploads / HTTP Static| StorageVolume

    Browser --> Google
    Google --> API

    API --> OpenAI
    API ---->|Create Checkout| Stripe
    Stripe ---->|Async Webhooks| API
```

## Fluxo assíncrono de geração por IA

A geração de imagem pode demorar entre 20 e 30 segundos, por isso o processo não bloqueia a resposta da API. O backend cria o registo, dispara a task em segundo plano e o frontend faz polling até receber o resultado final.

```mermaid
sequenceDiagram
    participant User as Utilizador
    participant Frontend as Next.js App
    participant API as FastAPI Server
    participant BG as Background Task
    participant OpenAI as OpenAI API
    participant DB as PostgreSQL

    User->>Frontend: Faz upload da foto + escreve prompt
    Frontend->>API: POST /api/v1/generations (multipart/form-data)

    API->>API: Guarda foto original no Docker Volume
    API->>DB: Cria registo com status = 'queued'
    API-->>Frontend: Devolve Generation_ID (status: queued)

    Note over API, BG: Dispara processo em segundo plano (Background Task)

    BG->>DB: Atualiza status = 'processing'
    BG->>OpenAI: Envia imagem original + prompt otimizado (CrewAI)

    activate OpenAI
    Note over Frontend, API: Frontend inicia polling de 3 em 3 segundos
    Frontend->>API: GET /api/v1/generations/{id}
    API-->>Frontend: Status = 'processing' (mostra loading)

    OpenAI-->>BG: Devolve nova imagem gerada
    deactivate OpenAI

    BG->>BG: Guarda imagem gerada no Docker Volume
    BG->>DB: Atualiza status = 'completed' e guarda as URLs das imagens

    Frontend->>API: GET /api/v1/generations/{id} (próximo ciclo)
    API-->>Frontend: Status = 'completed' + URLs das imagens
    Frontend->>User: Renderiza o componente slider (antes / depois)
```

## Core stack e deploy

A escolha dos componentes foi feita para manter o MVP simples de operar, mas com uma linha de evolução clara para produção.

- Frontend: Next.js (TypeScript)
  - MVP: App Router e Tailwind CSS
  - Produção: Vercel (plano Hobby)
- Backend: FastAPI (Python 3.12)
  - MVP: Orquestração da API e CrewAI
  - Produção: Render ou Railway
- Base de dados: PostgreSQL
  - MVP: container Docker oficial
  - Produção: Neon.tech ou Supabase
- ORM e migrations: SQLAlchemy e Alembic
  - MVP: gestão e versionamento local da base de dados
- Fila e workers: FastAPI BackgroundTasks
  - MVP: assíncrono nativo em memória do Python
  - Produção: Celery + Redis, caso o projeto escale
- Armazenamento: Docker Volumes
  - MVP: file system local dentro da pasta /static
  - Produção: Cloudflare R2 ou AWS S3
- Autenticação: Google OAuth + JWT
  - MVP: login social integrado à base de dados local
  - Produção: NextAuth ou Clerk
- Pagamentos: Stripe API
  - MVP: simulação em ambiente de testes
  - Produção: Stripe Live Mode

## Regras de negócio

### Quota diária

O utilizador com plano `free` tem limite de 1 geração por dia. A validação acontece no backend antes de a task ser enviada para a OpenAI, verificando `daily_generations_count` e `last_generation_date`.

### Idempotência de pagamentos

O endpoint de webhooks da Stripe regista o `stripe_event_id` na tabela `STRIPE_EVENT` antes de processar qualquer alteração de plano. Se o evento já existir, é ignorado para evitar duplicações de faturação ou créditos.

### Segurança de ficheiros

O upload de imagens valida o MIME type de forma estrita no backend, permitindo apenas `image/jpeg` e `image/png` para reduzir o risco de execução remota de scripts.
