# PRD - Escape Room Management API

## Context

A local escape room business runs reservations by hand (messages, spreadsheet). This project delivers a REST API and relational database to manage rooms, time slots, users and bookings, ready to grow into full game management.

Course deliverables: ER diagram, GitHub repo, API docs (Swagger), passing test suite, retrospective, Kanban board with user stories.

## Problems solved

| Pain today | Solution |
|------------|----------|
| Double bookings | One active booking per slot, enforced by the DB (BR-B8) |
| No view of availability | Slots with computed `is_bookable` |
| Group size mistakes | Players validated against room capacity |
| Late cancellations | 24h cancellation rule (BR-B6) |
| No data to decide | Statistics and CSV export (Sprint 2) |
| No access control | Roles client / staff / admin with Supabase login (Sprint 2) |

## Users

| Role | Needs |
|------|-------|
| Client | Find rooms and free slots, book, change, cancel, see history |
| Staff | See today's bookings, start and finish games, register results |
| Admin | Manage users, rooms, slots, see statistics |

## Scope by sprint

Client (course professor) asked to **start simple: users, bookings, rooms with CRUD**, then grow.

| Sprint | Dates | Scope | Course level |
|--------|-------|-------|--------------|
| 1 | Fri Oct 2 - Fri Oct 9 (presentation Oct 12-13) | CRUD users, rooms, time slots, bookings. Business rules, tests, Swagger, env vars, logging, error handling, CI | Essential + part of Medium |
| 2 | Tue Oct 13 - Mon Oct 19 (presentation Oct 20) | Supabase login, roles, games (start/finish/result), pagination, filters, CSV, statistics, Docker, retrospective | Medium + Advanced + part of Expert |

Out of scope for now: payments, discounts, loyalty, team members per booking, websockets, cloud deployment, UI. They stay in the full ER (DIAGRAMS.md section 2) as the long-term vision.

## Success criteria

- Every endpoint has automated tests, all green in CI.
- A full demo works: create room and slots, register, book, confirm, cancel, play, register result.
- No secrets in the repository.
- Board and docs match what is delivered.

## Documents

| File | Purpose |
|------|---------|
| `STACK.md` | Technology choices |
| `ARCHI.md` | Folder structure, layers, test strategy |
| `BUSINESS_RULES.md` | Rules per sprint, permissions, open decisions |
| `STORIES.md` | User stories with acceptance criteria |
| `TICKETS.md` | Tickets, work split, timeline |
| `API_CONTRACT.md` | Endpoint contract and error format |
| `DIAGRAMS.md` | ER, state machine, user flows, sequences (Mermaid) |
| `CONTRIBUTING.md` | Git flow, TDD, PR rules, Definition of Done |
