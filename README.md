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

Clone the project from the team's GitHub repository:

```bash
git clone https://github.com/IA-P1-BCN/g5-python-crud-api.git
cd g5-python-crud-api
```

### 2. Get the Docker environment branch

The current Docker infrastructure is available in the `feature/docker-environment` branch.

Fetch the latest branches:

```bash
git fetch origin
```

Switch to the Docker environment branch:

```bash
git checkout feature/docker-environment
```

Pull the latest changes:

```bash
git pull origin feature/docker-environment
```

If the branch does not exist locally, use:

```bash
git fetch origin
git checkout -b feature/docker-environment origin/feature/docker-environment
```

### 3. Configure environment variables

Create your local `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Review the values in `.env` before starting the application.

**Important:** Never commit `.env` or other files containing secrets.

### 4. Build and start the environment

Make sure Docker Desktop is running, then execute:

```bash
docker compose up --build
```

This starts:

* FastAPI application
* PostgreSQL database

The PostgreSQL service includes a healthcheck using `pg_isready`.

The API depends on PostgreSQL being healthy before it starts. This prevents the API from starting before the database is ready to accept connections.

### 5. Verify the containers

Open another terminal and run:

```bash
docker compose ps
```

Expected result:

```text
api    Up
db     Up (healthy)
```

The database should appear with the status:

```text
Up (healthy)
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
docker compose run --rm api python -c "from sqlalchemy import text; from back.app.database import engine; conn = engine.connect(); print(conn.execute(text('SELECT 1')).scalar()); conn.close()"
```

Expected output:

```text
1
```

This confirms that the API container can successfully connect to PostgreSQL.

## Development Commands

### Run the test suite

```bash
docker compose run --rm api pytest
```

### Check code quality

```bash
docker compose run --rm api ruff check .
```

### Format code

```bash
docker compose run --rm api ruff format .
```

## Stop the Environment

To stop the containers:

```bash
docker compose down
```

To stop the environment and remove the local database volume:

```bash
docker compose down -v
```

**Warning:** The second command permanently deletes the PostgreSQL data stored in the Docker volume.

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
