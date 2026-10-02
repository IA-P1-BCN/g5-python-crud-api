# TICKETS

Every ticket is a GitHub issue on the `escape_room_project` board with Epic, Sprint, Kind, Size, Milestone and assignee.
Workflow: `docs/CONTRIBUTING.md` (TDD, PRs to `develop`).

## Work split (proposed, one vertical per person)

| Person | Sprint 1 | Sprint 2 |
|--------|----------|----------|
| Charlotte | Foundation (TECH-01..03), Users, README, release | Supabase login, roles, `/users/me`, retrospective, release |
| Leandro | Rooms CRUD | Statistics, CSV export |
| Isbela | Time slots + availability | Pagination and filters, Docker |
| Carolina | Bookings (create, view, modify, cancel) | Change slot, games (start, finish, result, history) |

Ownership means: model, endpoints, tests and Swagger for that resource, start to finish. Anyone can swap, tell the team.

## Sprint 1 timeline (Fri Oct 2 - Fri Oct 9, presentation Oct 12-13)

| Days | Goal |
|------|------|
| Fri 2 - Mon 5 | Charlotte: TECH-01..03 on `develop`. Others: write their failing tests against `API_CONTRACT.md` |
| Mon 5 - Wed 7 | Rooms, users, slots implemented (tests GREEN), PRs to `develop` |
| Wed 7 - Thu 8 | Bookings (needs the others), integration, bug fixes |
| Thu 8 - Fri 9 | DOC-01, REL-01 PR `develop` to `main`, demo rehearsal |

## Sprint 2 (Tue Oct 13 - Mon Oct 19, presentation Oct 20)

Auth and roles first (they unlock the permission checks of games and admin), then games, statistics, CSV, pagination, Docker, retrospective.

## Sprint 1 tickets (due 2026-10-09)

| ID | Title | Epic | Kind | Size | Owner | Depends on |
|----|-------|------|------|------|-------|------------|
| TECH-01 | Project skeleton, config, logging, error handling | E0 Foundation | Tech | M | Charlotte | - |
| TECH-02 | Database setup: SQLAlchemy, Alembic, 4 models, first migration | E0 Foundation | Tech | L | Charlotte | TECH-01 |
| TECH-03 | Test infrastructure and CI on GitHub Actions | E0 Foundation | Tech | M | Charlotte | TECH-01 |
| US-01 | Create user (registration, basic) | E1 Users | Feature | S | Charlotte | TECH-02 |
| US-04 | View and update user profile | E1 Users | Feature | S | Charlotte | US-01 |
| US-05 | List and deactivate users | E1 Users | Feature | S | Charlotte | US-01 |
| US-06 | Create room | E2 Rooms & Slots | Feature | S | Leandro | TECH-02 |
| US-07 | Edit room | E2 Rooms & Slots | Feature | S | Leandro | US-06 |
| US-08 | Deactivate room | E2 Rooms & Slots | Feature | S | Leandro | US-06 |
| US-09 | List and get rooms | E2 Rooms & Slots | Feature | S | Leandro | US-06 |
| US-10 | Configure time slots (create, edit, delete) | E2 Rooms & Slots | Feature | M | Isbela | US-06 |
| US-11 | Check availability | E2 Rooms & Slots | Feature | M | Isbela | US-10 |
| US-12 | Create booking | E3 Bookings | Feature | L | Carolina | TECH-02, US-01, US-06, US-10 |
| US-13 | View bookings | E3 Bookings | Feature | S | Carolina | US-12 |
| US-14 | Modify booking (players) | E3 Bookings | Feature | S | Carolina | US-12 |
| US-15 | Cancel and confirm booking | E3 Bookings | Feature | M | Carolina | US-12 |
| DOC-01 | README with setup instructions and Swagger check | E0 Foundation | Docs | S | Charlotte | US-15 |
| REL-01 | Release Sprint 1: PR develop to main | E0 Foundation | Tech | S | Charlotte | DOC-01 |

## Sprint 2 tickets (due 2026-10-19)

| ID | Title | Epic | Kind | Size | Owner | Depends on |
|----|-------|------|------|------|-------|------------|
| US-02 | Login with Supabase (Google) | E1 Users | Feature | L | Charlotte | - |
| US-03 | Roles and permissions | E1 Users | Feature | L | Charlotte | US-02 |
| US-04b | Own profile with /users/me | E1 Users | Feature | S | Charlotte | US-02 |
| US-14b | Change slot of a booking | E3 Bookings | Feature | M | Carolina | US-14 |
| US-16 | Today's bookings (staff) | E4 Games | Feature | S | Carolina | US-03 |
| US-17 | Start game | E4 Games | Feature | M | Carolina | US-16 |
| US-18 | Finish game | E4 Games | Feature | S | Carolina | US-17 |
| US-19 | Register game result | E4 Games | Feature | M | Carolina | US-18 |
| US-20 | Game history | E4 Games | Feature | S | Carolina | US-19 |
| US-21 | Business statistics | E5 Admin | Feature | M | Leandro | US-03 |
| US-22 | Export bookings to CSV | E5 Admin | Feature | M | Leandro | US-03 |
| US-23 | Pagination and filters on list endpoints | E5 Admin | Feature | L | Isbela | - |
| TECH-04 | Dockerfile and docker-compose | E0 Foundation | Tech | M | Isbela | - |
| DOC-02 | Retrospective, final ER and documentation review | E0 Foundation | Docs | M | Charlotte | - |
| REL-02 | Release Sprint 2: PR develop to main | E0 Foundation | Tech | S | Charlotte | DOC-02 |
