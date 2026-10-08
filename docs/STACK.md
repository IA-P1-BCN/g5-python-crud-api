# STACK

Source of truth for technology choices. Changes need team agreement.

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | Python 3.12 | |
| API framework | FastAPI | Swagger UI at `/docs`, ReDoc at `/redoc` (free) |
| Validation | Pydantic v2 | Request/response schemas |
| ORM | SQLAlchemy 2.x | |
| Migrations | Alembic | One migration per schema change, committed |
| Database | PostgreSQL in Docker | Relational, matches the ER. Container started by `docker-compose`, same DB on every computer |
| Auth (Sprint 2) | Supabase Auth | Used **only** for authentication: Google social login, JWT validated by the API. Supabase does not host our data |
| Tests | pytest + httpx (`TestClient`) | Unit + API integration |
| Test DB | SQLite in-memory by default | Fast, no credentials. |
| Lint/format | ruff | `ruff check` + `ruff format` |
| Config | `.env` + pydantic-settings | `.env` never committed, `.env.example` always |
| Container (Sprint 1, Ticket 002) | Docker + docker-compose | Starts the API and the PostgreSQL database with one command |

## Test frameworks

- **pytest** for everything.
- **TestClient (httpx)** for endpoint tests.
- Rule: tests are written together with the code, in the same ticket.

## Environment variables

See `.env.example` at the project root:

```
DATABASE_URL=            # the only variable the API reads for the database
POSTGRES_USER=           # read by the PostgreSQL container (docker-compose) only
POSTGRES_PASSWORD=       # same
POSTGRES_DB=             # same
POSTGRES_HOST=           # not read by the API
POSTGRES_PORT=           # not read by the API
SUPABASE_URL=            # Sprint 2
SUPABASE_JWT_SECRET=     # Sprint 2
```

The log level is fixed to `INFO` in `back/app/config/logging.py` (no `LOG_LEVEL` variable for now).

Secrets go in `.env` only. The repo is **public**, so never commit keys.
