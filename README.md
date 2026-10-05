# Escape Room Management

Web platform for managing escape rooms, bookings, teams, and customer experiences.

## Documentation

| Doc                                      | Content                                             |
| ---------------------------------------- | --------------------------------------------------- |
| [PRD](docs/PRD.md)                       | Context, scope per sprint                           |
| [Stack](docs/STACK.md)                   | FastAPI, PostgreSQL (Docker), Supabase Auth, pytest |
| [Architecture](docs/ARCHI.md)            | Structure, layers, tests                            |
| [Business rules](docs/BUSINESS_RULES.md) | Rules Sprint 1 and 2, permissions                   |
| [User stories](docs/STORIES.md)          | Stories and acceptance criteria                     |
| [Tickets](docs/TICKETS.md)               | Tickets and timeline                                |
| [Work split](docs/WORK_SPLIT.md)         | 4 parts to choose from, by resource                 |
| [API contract](docs/API_CONTRACT.md)     | Endpoints and error format                          |
| [Diagrams](docs/DIAGRAMS.md)             | ER, flows, state machine (Mermaid)                  |
| [Contributing](docs/CONTRIBUTING.md)     | Git flow, PR rules                                  |

## Tech Stack

* Python 3.12
* FastAPI
* Pydantic v2
* SQLAlchemy 2.x
* Alembic
* PostgreSQL 16
* Docker Compose
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

The application uses:

```text
DATABASE_URL
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_HOST
POSTGRES_PORT
```

**Important:** Never commit `.env` or other files containing secrets.

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

### 4. Apply database migrations

Run the latest Alembic migrations:

```bash
docker compose exec api alembic upgrade head
```

Check the current migration:

```bash
docker compose exec api alembic current
```

### 5. Verify the containers

```bash
docker compose ps
```

Expected result:

```text
api    Up
db     Up (healthy)
```

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

To verify that the API container can connect to PostgreSQL through SQLAlchemy:

```bash
docker compose exec api python -c "from sqlalchemy import text; from back.app.database import engine; conn = engine.connect(); print(conn.execute(text('SELECT 1')).scalar()); conn.close()"
```

Expected output:

```text
1
```

This confirms that the API container can successfully connect to PostgreSQL.

## Database

PostgreSQL runs locally in Docker.

The database schema is managed with SQLAlchemy models and Alembic migrations.

### Current Sprint 1 models

* `users`
* `rooms`
* `time_slots`
* `bookings`

### Run migrations

Apply all pending migrations:

```bash
docker compose exec api alembic upgrade head
```

Show the current migration:

```bash
docker compose exec api alembic current
```

Generate a new migration after model changes:

```bash
docker compose exec api alembic revision --autogenerate -m "describe the change"
```

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
