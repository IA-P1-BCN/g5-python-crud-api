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
| Container (Sprint 1, Ticket 002) | Docker + docker-compose | Starts the API, the PostgreSQL database and the front (Nginx, port 3000) with one command |

## Frontend stack

React client in `front/`, JavaScript (no TypeScript: the team's language; data is validated with Zod where it enters the app). Versions are the ones in `front/package.json`.

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 19 + Vite 8 | No SSR needed: the API is a separate FastAPI server |
| Routing | React Router 6 | Deep links (`/salas/faro`) and a predictable Back button. Each feature owns its routes |
| Server data | TanStack Query + Axios | One Axios instance (`/api/v1`, JWT interceptor from Sprint 2); cache and invalidation after a booking |
| Client state | Zustand (booking draft), Context (logged-in user), URL (navigation) | Each kind of state has one home |
| Forms | React Hook Form + Zod | Zod schemas also give the validation messages |
| Styling | Tailwind CSS 4 + Sass (SCSS) | Tailwind for layout in the JSX; design tokens in `@theme` (see `DESIGN.md`); room themes are CSS variables switched by `data-room`; Sass only for bespoke animated effects. No MUI |
| Fonts | `@fontsource` (self-hosted) | Big Shoulders Display, Hanken Grotesk and Share Tech Mono, bundled by Vite: no request to Google, works offline |
| UI primitives | shadcn/ui (Dialog, Select) on Radix | Copied into `shared/ui` as JavaScript and themed with our tokens; accessible keyboard and focus handling. `tw-animate-css` provides their `animate-in` / `fade-in-0` classes |
| 3D | Three.js 0.128 (pinned) | The corridor is a plain JS module wrapped by one React component, with a poster-grid fallback when WebGL is missing |
| Texts | `i18n/es/<feature>.js` | All user-facing text is Spanish, one namespace per feature |
| Auth (Sprint 2) | Supabase JS | Google login; the JWT is sent to the API |
| Tests | Vitest + Testing Library + MSW | MSW imitates the FastAPI so components are tested without the back |
| Lint | ESLint 10 (+ react-hooks, react-refresh) | Also enforces the architecture boundaries (see `ARCHI.md`) |
| Format | Prettier (+ Tailwind class sorting) | 100 characters per line, no semicolons, single quotes |
| Container | Docker: Node build, then Nginx | Nginx serves `dist/` and proxies `/api/` to the API (no CORS) |

Not installed yet: `@supabase/supabase-js` (ticket 077). More shadcn/ui primitives are added when a screen needs them (`DESIGN.md`).

Known limit: `eslint-plugin-react` and `eslint-plugin-jsx-a11y` do not support ESLint 10 yet, so they are not installed. Rules of hooks and Fast Refresh are covered.

## Frontend tooling

Same idea as `ruff` in the back: the style lives in the repo (`front/.prettierrc`, `.editorconfig`, `front/eslint.config.js`, shared `.vscode/settings.json`), so personal editor settings do not matter.

| Back | Front |
|------|-------|
| `ruff format` | `prettier --write` (`npm run format`) |
| `ruff check` | `eslint` (`npm run lint`) |
| `pytest` | `vitest run` (`npm run test:run`) |

One command runs the three in Docker (Node 22) at the end of each ticket: `docker compose run --rm front-tools` (service `front-tools`, compose profile `tools`: `docker compose up` does not start it).

## Test frameworks

- **pytest** for everything in the back.
- **TestClient (httpx)** for endpoint tests.
- **Vitest + Testing Library + MSW** for the front (`front/`).
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
