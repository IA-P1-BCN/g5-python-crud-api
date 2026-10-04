# TICKETS

Board `escape_room_project`:

- **Backlog**: user stories (`US01`...), each with its acceptance criteria and the list of its tickets.
- **Ready**: tickets (`Ticket 001`...) with Size, and labels for the Epic (`E1 - Users`) and the User Story (`US01`) they belong to. Ticket 003 (CI) was dropped: no CI pipeline for now.

Pick a ticket by epic (filter the board by `Epic`). Assignment is decided by the team when taking a ticket.
Each story has one **Implement ... + tests** ticket: code and tests are done together. Workflow: `CONTRIBUTING.md`.

## Sprint 1 timeline (Fri Oct 2 - Fri Oct 9, presentation Oct 12-13)

| Days | Goal |
|------|------|
| Fri 2 - Mon 5 | Foundation tickets (E0) on `develop`. Others write failing tests against `API_CONTRACT.md` |
| Mon 5 - Wed 7 | Users, rooms, slots implemented with their tests, PRs to `develop` |
| Wed 7 - Thu 8 | Bookings (needs the others), integration, bug fixes |
| Thu 8 - Fri 9 | README, PR `develop` to `main`, demo rehearsal |

## Sprint 1 tickets

| Ticket | Title | Epic | User Story | Kind | Size |
|--------|-------|------|------------|------|------|
| 001 | Project skeleton, config, logging, error handling | E0 Foundation | - | Tech | M |
| 002 | Database setup and Docker: SQLAlchemy, Alembic, 4 models, first migration | E0 Foundation | - | Tech | L |
| 005 | Implement create user (registration, basic) + tests | E1 Users | US01 | Feature | S |
| 007 | Implement view and update user profile + tests | E1 Users | US02 | Feature | S |
| 009 | Implement list and deactivate users + tests | E1 Users | US03 | Feature | S |
| 011 | Implement create room + tests | E2 Rooms & Slots | US07 | Feature | S |
| 013 | Implement edit room + tests | E2 Rooms & Slots | US08 | Feature | S |
| 015 | Implement deactivate room + tests | E2 Rooms & Slots | US09 | Feature | S |
| 017 | Implement list and get rooms + tests | E2 Rooms & Slots | US10 | Feature | S |
| 019 | Implement configure time slots (create, edit, delete) + tests | E2 Rooms & Slots | US11 | Feature | M |
| 020 | Implement time rules (past, overlap, inactive room) + tests | E2 Rooms & Slots | US11 | Feature | S |
| 022 | Implement check availability + tests | E2 Rooms & Slots | US12 | Feature | M |
| 024 | Implement create booking + tests | E3 Bookings | US13 | Feature | L |
| 025 | Implement double-booking guard (IntegrityError to 409 SLOT_TAKEN) + concurrency test + tests | E3 Bookings | US13 | Feature | S |
| 027 | Implement view bookings + tests | E3 Bookings | US14 | Feature | S |
| 029 | Implement modify booking (players) + tests | E3 Bookings | US15 | Feature | S |
| 031 | Implement cancel and confirm booking + tests | E3 Bookings | US16 | Feature | M |
| 032 | README with setup instructions and Swagger check | E0 Foundation | - | Docs | S |
| 033 | Release Sprint 1: PR develop to main | E0 Foundation | - | Tech | S |

## Sprint 2 tickets (Tue Oct 13 - Mon Oct 19, presentation Oct 20)

| Ticket | Title | Epic | User Story | Size |
|--------|-------|------|------------|------|
| 035 | Implement login with Supabase (Google) + tests | E1 Users | US04 | S |
| 036 | Implement first login creates the user row (role client, stores auth_id) + tests | E1 Users | US04 | S |
| 037 | Implement roles and permissions + tests | E1 Users | US05 | M |
| 038 | Implement role checks on the existing routes (matrix in BUSINESS_RULES.md) + tests | E1 Users | US05 | M |
| 039 | Implement own profile with /users/me + tests | E1 Users | US06 | S |
| 040 | Implement change slot of a booking + tests | E3 Bookings | US17 | M |
| 041 | Implement today's bookings (staff) + tests | E4 Games | US18 | S |
| 042 | Implement start game + tests | E4 Games | US19 | S |
| 043 | Implement finish game + tests | E4 Games | US20 | S |
| 044 | Implement register game result + tests | E4 Games | US21 | S |
| 045 | Implement game history + tests | E4 Games | US22 | S |
| 046 | Implement business statistics + tests | E5 Admin | US23 | M |
| 047 | Implement export bookings to CSV + tests | E5 Admin | US24 | S |
| 048 | Implement pagination and filters on list endpoints + tests | E5 Admin | US25 | M |
| 049 | Implement page/size and filters on the bookings and time slots lists + tests | E5 Admin | US25 | M |
| 050 | Retrospective, final ER and documentation review | E0 Foundation | - | M |
| 051 | Release Sprint 2: PR develop to main | E0 Foundation | - | S |
