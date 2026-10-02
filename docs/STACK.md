# STACK

Source of truth for technology choices. Changes need team agreement.

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | Python 3.12 | |
| API framework | FastAPI | Swagger UI at `/docs`, ReDoc at `/redoc` (free) |
| Validation | Pydantic v2 | Request/response schemas |
| ORM | SQLAlchemy 2.x | |
| Migrations | Alembic | One migration per schema change, committed |
| Database | PostgreSQL on Supabase | Relational, matches the ER |
| Auth (Sprint 2) | Supabase Auth | Google social login, JWT validated by the API |
| Tests | pytest + httpx (`TestClient`) | Unit + API integration |
| Test DB | SQLite in-memory by default | Fast, no credentials. Postgres service in CI is optional (Sprint 2) |
| Lint/format | ruff | `ruff check` + `ruff format` |
| CI | GitHub Actions | Runs pytest + ruff on every PR to `develop` and `main` |
| Config | `.env` + pydantic-settings | `.env` never committed, `.env.example` always |
| Container (Sprint 2, optional) | Docker | |

## Test frameworks (TDD)

- **pytest** for everything.
- **TestClient (httpx)** for endpoint tests.
- Rule: tests are written BEFORE the code, must fail first (RED), then pass (GREEN).

## Environment variables

See `back/.env.example` (created in TECH-01):

```
DATABASE_URL=
SUPABASE_URL=            # Sprint 2
SUPABASE_JWT_SECRET=     # Sprint 2
LOG_LEVEL=INFO
```

Secrets go in `.env` only. The repo is **public**, so never commit keys.
