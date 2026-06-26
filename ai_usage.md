# 🤖 Artificial Intelligence Usage Documentation

This document transparently records how AI was used as a copilot throughout the development of the **Decozy** project — from planning and design to implementation and quality assurance.

AI served as an **assistant**: it helped structure ideas, proposed approaches, and contributed to code and interface. All work was reviewed, adjusted, and finalized manually.

---

## Tools Used

| Tool | Usage Context |
|---|---|
| Google Gemini | Main copilot — architecture, frontend/backend code, debugging, documentation |
| Kiro (Claude) | Code review, refactoring, and prompt optimization |
| Stitch AI | Visual concepts, layouts, and UI prototyping |
| Google AI Studio | Design exploration and color palette |

---

## 1. Planning and Architecture

| Deliverable | AI Contribution |
|---|---|
| `README.md` with Mermaid diagrams | Structuring the ER diagram, sequence diagram, and architecture graph |
| MVP task breakdown | Mapping dependencies between features (auth → projects → generation) |
| Database modeling | Defining relationships between `USER`, `SUBSCRIPTION`, `PROJECT`, `GENERATION`, and `ITEM` |

AI helped define the modular separation between authentication (`USER_IDENTITY`), operational data (`PROJECT`, `GENERATION`), and payments (`SUBSCRIPTION`, `STRIPE_EVENT`).

---

## 2. Design and UI/UX

The following visual decisions were created with AI tool support (Stitch AI + Google AI Studio):

- **Color system and theme** — palette defined in `globals.css` ("navy", "sage", "warm" tones, surfaces, error states)
- **Typography** — pairing of *Manrope* (body) and *EB Garamond* (serif)
- **Screen layouts** — mobile-first structure with desktop adaptation (`lg:`): landing/hero, upload/design, gallery, favorites, authentication, modals
- **Iconography** — inline SVG icons following design tool direction
- **Visual components** — bottom/top navigation, badges, cards, "before/after" slider

---

## 3. Infrastructure and DevOps

### Docker Compose

The local environment runs with 5 services (`nginx`, `api`, `frontend`, `database`, `adminer`). AI assisted with:

- **Port conflicts** — identifying blocking processes with `lsof -i :3000` and `lsof -i :8000`
- **PostgreSQL health checks** — configuring `pg_isready` for startup orchestration
- **Volumes and persistence** — mapping between Docker Volume and `static/uploads`

### CI/CD (GitHub Actions)

- Pipeline with `ruff check` and `ruff format --check` for automatic linting
- `uv sync` configuration for dependency installation in CI

---

## 4. Backend — API and Business Logic

### Routes and Endpoints (FastAPI)

- Debugging errors in JWT-protected endpoints (`app/api/deps.py`)
- Multipart upload flow with MIME validation (`image/jpeg`, `image/png`)
- Daily quota logic: validating `daily_generations_count` and `last_generation_date`

### CrewAI Integration (`services/crewai_service.py`)

- **Agent 1 — Prompt Architect:** validates the request, extracts intent (`add`/`remove`/`none`), and generates an optimized prompt
- **Agent 2 — Asset Specialist:** creates fictional e-commerce assets and persists them via `DatabaseTool`
- **Custom LLM (`LangChainGroqLLM`):** wrapper over the Groq API with token tracking and error handling
- Problem solving: CrewAI/LangChain message normalization, strict JSON parsing, Pydantic validation

### Image Generation Service (`services/ai_service.py`)

- Async flow orchestration: record creation → background task → polling
- NVIDIA/OpenAI API integration for image generation
- Image fallback when individual generation fails

### Payments (Stripe)

- Webhook endpoint with idempotency via `STRIPE_EVENT` table
- Duplication prevention: checking `stripe_event_id` before processing plan changes

---

## 5. Frontend — Code (Next.js + TypeScript)

### Configuration and app root

- `layout.tsx` — root layout, fonts, metadata, `AuthProvider`
- `globals.css` — Tailwind v4 variables, utilities (`scrollbar-hide`)
- `next.config.ts` — remote images and turbopack

### API layer (`src/lib/`)

- `api.ts` — central client for FastAPI: JWT handling, `request<T>()`, error handling (`ApiError`), all endpoints and TypeScript interfaces
- `credits.ts` — credit packages and utilities
- `mockBackend.ts` — simulated backend for the design flow

### Authentication (`src/components/auth/`)

- `AuthProvider.tsx` — auth context, localStorage hydration, `signIn`/`signOut`
- `SignInPage.tsx` / `SignUpPage.tsx` — forms with validation and Google sign-in

### Layout and navigation (`src/components/layout/`)

- Header, BottomNav, DesktopNav, HamburgerMenu, CreditsBadge

### Design and upload flow (`src/components/ui/`)

- `UploadContext.tsx` — core generation flow: state, jobs, polling (`pollUntilDone`), object-URL management
- `UploadArea.tsx` — upload with camera/gallery via `getUserMedia` and canvas
- `StyleSelector.tsx`, `CustomInstructions.tsx`, `GenerateButton.tsx`, `ProcessingTray.tsx`
- `BeforeAfterSlider.tsx` — interactive slider with pointer events

### Projects and gallery

- `ProjectsContext.tsx` — projects context with backend loading
- `GalleryPage.tsx` — search, inline editing, furniture expansion

### Favorites

- `FavoritesContext.tsx` — backend sync, local cache, fallback catalog
- `MyItemsPage.tsx` — item grid and add-to-cart

### Cart and checkout

- `CartContext.tsx` — cart context, price parsing, totals
- `CartCheckoutModal.tsx` — bottom-sheet with Stripe integration
- Post-payment verification pages

### Credits / tokens

- `CreditsContext.tsx` — balance and backend refresh
- `CreditsModal.tsx` — package purchase menu

### Folder structure

Gemini suggested the organization into `src/app` (routes), `src/lib` (API and utilities), and `src/components` grouped by domain (`auth`, `cart`, `credits`, `favorites`, `layout`, `landing`, `projects`, `ui`).

### Commit messages

Gemini helped write clear and descriptive commit messages.

---

## 6. Quality Assurance (QA)

### Automated Tests (Pytest)

| File | Coverage |
|---|---|
| `tests/conftest.py` | Fixtures with SQLite in-memory, dependency overrides, JWT generation |
| `tests/test_integration.py` | End-to-end API route tests |
| `tests/test_routers.py` | Unit tests for handlers |
| `tests/test_upload_service.py` | MIME type validation and file persistence |
| `tests/test_payments.py` | Stripe webhook flow |

AI helped configure the `JSONB → JSON` monkey-patch to run PostgreSQL tests on SQLite, and the `auth_headers` fixture with valid JWT.

### Linting and Formatting

- Ruff as the single linter and formatter for the backend
- Pre-commit hooks (`.pre-commit-config.yaml`)
- Standardized JSDoc in frontend functions

---

## Final Note

All code and design produced with AI assistance was reviewed, integrated, and manually adjusted to ensure consistency, correct behavior, and proper connection between frontend and backend. The application itself uses AI at runtime to generate interior redesigns.
