# Escape Room Management

Web platform for managing escape rooms, bookings, teams, and customer experiences.

## Documentation

| Doc                                      | Content                                    |
| ---------------------------------------- | ------------------------------------------ |
| [PRD](docs/PRD.md)                       | Context, scope per sprint                  |
| [Stack](docs/STACK.md)                   | FastAPI, PostgreSQL, Supabase Auth, pytest |
| [Architecture](docs/ARCHI.md)            | Structure, layers, tests                   |
| [Business rules](docs/BUSINESS_RULES.md) | Rules Sprint 1 and 2, permissions          |
| [User stories](docs/STORIES.md)          | Stories and acceptance criteria            |
| [Tickets](docs/TICKETS.md)               | Tickets and timeline                       |
| [Work split](docs/WORK_SPLIT.md)         | 4 parts to choose from, by resource        |
| [API contract](docs/API_CONTRACT.md)     | Endpoints and error format                 |
| [Diagrams](docs/DIAGRAMS.md)             | ER, flows, state machine (Mermaid)         |
| [Contributing](docs/CONTRIBUTING.md)     | Git flow, PR rules                         |

## Tech Stack

* Python 3.12
* FastAPI
* Pydantic v2
* SQLAlchemy 2.x
* Alembic
* PostgreSQL 16
* Docker Compose
* Supabase PostgreSQL for shared team development
* pytest + httpx
* Ruff

## Prerequisites

* Git
* Docker Desktop
* Docker Compose

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/IA-P1-BCN/g5-python-crud-api.git
cd g5-python-crud-api
```

### 2. Configure environment variables

Create your local `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Review the values in `.env` before starting the application.

### Local development

By default, the project can run against the PostgreSQL 16 database provided by Docker Compose.

The local configuration uses:

```text
DATABASE_URL
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_HOST
POSTGRES_PORT
```

### Shared team database

For shared team development, the project can also use the common PostgreSQL database hosted in Supabase.

Add the following variable to your local `.env`:

```text
SHARED_DATABASE_URL=<your-supabase-postgresql-connection-string>
```

When `SHARED_DATABASE_URL` is configured, the application uses the shared Supabase PostgreSQL database instead of the local Docker PostgreSQL database.

The Supabase connection string must be copied from the project's Supabase dashboard.

Do not commit the real Supabase connection string or any other credentials.

**Important:** `.env` is local-only and must never be committed to Git.

### Alembic database override

Alembic can optionally use a separate database connection through:

```text
ALEMBIC_DATABASE_URL=<database-connection-string>
```

When `ALEMBIC_DATABASE_URL` is not defined, Alembic uses the application's effective database connection.

This should only be used when a specific migration target is required.

### 3. Build and start the environment

Make sure Docker Desktop is running, then execute:

```bash
docker compose up -d --build
```

This starts:

* FastAPI application
* PostgreSQL 16 database

The PostgreSQL service includes a healthcheck using `pg_isready`.

The API depends on PostgreSQL being healthy before it starts.

When shared Supabase mode is enabled, the local PostgreSQL container may still start because it is part of the Docker Compose environment. The application can nevertheless use the shared database configured through `SHARED_DATABASE_URL`.

### 4. Apply database migrations

Run the latest Alembic migrations:

```bash
docker compose exec api alembic upgrade head
```

Check the current migration:

```bash
docker compose exec api alembic current
```

**Shared database warning:** migrations against the shared Supabase database affect the entire team. Coordinate schema changes with the team before applying migrations to the shared database.

### 5. Verify the containers

```bash
docker compose ps
```

Expected result:

```text
api    Up
db     Up (healthy)
```

The `db` service may still be running even when the application is configured to use the shared Supabase database.

### 6. Access the API

The API is available at:

* API: http://localhost:8000
* Swagger UI: http://localhost:8000/docs
* ReDoc: http://localhost:8000/redoc

### 7. Verify the API

From PowerShell:

```powershell
Invoke-WebRequest http://localhost:8000/ -UseBasicParsing
```

Expected response:

```text
StatusCode : 200
Content    : {"message":"Escape Room API"}
```

### 8. Verify the database connection

To verify that the API container can connect to its configured PostgreSQL database through SQLAlchemy:

```bash
docker compose exec api python -c "from sqlalchemy import text; from back.app.database import engine; conn = engine.connect(); print(conn.execute(text('SELECT 1')).scalar()); conn.close()"
```

Expected output:

```text
1
```

This confirms that the API container can successfully connect to the currently configured database.

To check which database is actually being used:

```bash
docker compose exec api python -c "from sqlalchemy import text; from back.app.database import engine; conn = engine.connect(); print(conn.execute(text('SELECT current_database(), current_user')).one()); conn.close()"
```

To list the current public tables:

```bash
docker compose exec api python -c "from sqlalchemy import text; from back.app.database import engine; conn = engine.connect(); print(conn.execute(text(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name\")).fetchall()); conn.close()"
```

## Database

The project supports two database modes.

### Local database

The default local environment uses PostgreSQL 16 running in Docker.

```text
FastAPI
   ↓
DATABASE_URL
   ↓
Docker PostgreSQL
```

Each developer can have an independent local database.

### Shared database

For team development, the API can use the shared Supabase PostgreSQL database.

```text
FastAPI
   ↓
SHARED_DATABASE_URL
   ↓
Supabase PostgreSQL
   ↓
Shared team database
```

This mode allows the team to work with the same database state, including shared records such as users, rooms, time slots, and bookings.

**Important:** avoid destructive database operations against the shared database unless they have been explicitly coordinated with the team.

### Current Sprint 1 models

* `users`
* `rooms`
* `time_slots`
* `bookings`

## Database Migrations

The database schema is managed with SQLAlchemy models and Alembic migrations.

### Apply migrations

```bash
docker compose exec api alembic upgrade head
```

### Show the current migration

```bash
docker compose exec api alembic current
```

### Generate a new migration

After changing SQLAlchemy models:

```bash
docker compose exec api alembic revision --autogenerate -m "describe the change"
```

Review the generated migration before applying it.

### Reset the local database

To stop the environment:

```bash
docker compose down
```

To stop the environment and remove the PostgreSQL volume:

```bash
docker compose down -v
```

Then recreate the environment:

```bash
docker compose up -d --build
docker compose exec api alembic upgrade head
```

**Warning:** `docker compose down -v` permanently deletes the local PostgreSQL data stored in the Docker volume.

Do not use this command as a way to reset the shared Supabase database.

## Development Commands

### Run the test suite

```bash
docker compose exec api pytest
```

### Check code quality

```bash
docker compose exec api ruff check .
```

### Format code

```bash
docker compose exec api ruff format .
```

### Check formatting without changing files

```bash
docker compose exec api ruff format --check .
```

## Frontend Development

### See your changes as you code (hot reload)

```bash
docker compose up
```

Starts `db`, `api` and `front`. The `front` container runs the Vite dev server on
http://localhost:3000: save a file in `front/` and the browser updates by itself. Calls to
`/api` are proxied to the API container.

`front` waits for the API healthcheck (`/health`) before starting. The first start runs
`npm install`, so give it a few seconds. The production image (Nginx) is `front/Dockerfile`.

## Frontend Development Commands

Lint, formatting and tests for the front run in Docker (Node 22), so everyone gets the
same result whatever their editor settings. The style lives in the repo:
`front/.prettierrc`, `.editorconfig`, `front/eslint.config.js` (100 characters per line).

### End of ticket, before the PR

```bash
docker compose run --rm front-tools
```

This single command formats the code (Prettier), runs the linter (ESLint) and the tests
(Vitest). It is the front equivalent of `ruff format` + `ruff check` + `pytest`.
Commit the files it reformats along with your ticket.

### Other commands

```bash
docker compose run --rm front-tools npm run format        # format only
docker compose run --rm front-tools npm run check         # verify only (no changes), as in CI
```

`docker compose up` does not start `front-tools`: it only runs on demand.

### VS Code

Open the repo and accept the recommended extensions (Prettier, ESLint, Ruff). The shared
`.vscode/settings.json` formats on save with the project rules.

## Project Documentation

| Document                                 | Description                            |
| ---------------------------------------- | -------------------------------------- |
| [PRD](docs/PRD.md)                       | Context and sprint scope               |
| [Stack](docs/STACK.md)                   | Technology decisions                   |
| [Architecture](docs/ARCHI.md)            | Structure, layers, and testing         |
| [Business Rules](docs/BUSINESS_RULES.md) | Business rules and permissions         |
| [User Stories](docs/STORIES.md)          | Stories and acceptance criteria        |
| [Tickets](docs/TICKETS.md)               | Work distribution and timeline         |
| [Work Split](docs/WORK_SPLIT.md)         | Work distribution by resource          |
| [API Contract](docs/API_CONTRACT.md)     | Endpoints and error format             |
| [Diagrams](docs/DIAGRAMS.md)             | ER diagrams, flows, and state machines |
| [Contributing](docs/CONTRIBUTING.md)     | Git workflow, TDD, and PR rules        |

## Project Board

GitHub Projects: `escape_room_project`

## Authentication

Authentication and authorization are planned for Sprint 2.

See [STACK.md](docs/STACK.md) for the current technology decisions.
