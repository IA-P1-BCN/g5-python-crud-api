# TICKETS

Board `escape_room_project`:

- **Backlog**: user stories (`US01`...), each with its acceptance criteria and the list of its tickets.
- **Ready**: tickets (`Ticket 001`...) with Size, and labels for the Epic (`E1 - Users`) and the User Story (`US01`) they belong to. Ticket 003 (CI) was dropped: no CI pipeline for now.
- **Labels `back` / `front`**: every ticket says which side it touches. Front tickets (064 to 085) build the React client in `front/` (see `ARCHI.md`, section Frontend).

Pick a ticket by epic (filter the board by `Epic`). Assignment is decided by the team when taking a ticket.
Each story has one **Implement ... + tests** ticket: code and tests are done together. Workflow: `CONTRIBUTING.md`.

## Sprint 1 timeline (Fri Oct 2 - Fri Oct 9, presentation Oct 12-13)

| Days | Goal |
|------|------|
| Fri 2 - Mon 5 | Foundation tickets (E0) on `develop`. Others write failing tests against `API_CONTRACT.md` |
| Mon 5 - Wed 7 | Users, rooms, slots implemented with their tests, PRs to `develop` |
| Wed 7 - Thu 8 | Bookings (needs the others), integration, bug fixes |
| Thu 8 - Fri 9 | README, PR `develop` to `main`, demo rehearsal |

## Sprint 1 tickets back

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
| 040 | Implement change slot of a booking + tests | E3 Bookings | US17 | Feature | M |
| 060 | Enrich booking responses (room, slot, user, result, can_modify) + tests | E3 Bookings | US14 | Feature | M |
| 032 | README with setup instructions and Swagger check | E0 Foundation | - | Docs | S |
| 033 | Release Sprint 1: PR develop to main | E0 Foundation | - | Tech | S |
| 064 | Front setup: Vite, Tailwind, providers, routes, Docker with Nginx (`front`) | E0 Foundation | - | Tech | M |

## Sprint 2 tickets back (Tue Oct 13 - Mon Oct 19, presentation Oct 20)

| Ticket | Title | Epic | User Story | Size |
|--------|-------|------|------------|------|
| 035 | Implement login with Supabase (Google) + tests | E1 Users | US04 | S |
| 036 | Implement first login creates the user row (role client, stores auth_id) + tests | E1 Users | US04 | S |
| 037 | Implement roles and permissions + tests | E1 Users | US05 | M |
| 038 | Implement role checks on the existing routes (matrix in BUSINESS_RULES.md) + tests | E1 Users | US05 | M |
| 039 | Implement own profile with /users/me + tests | E1 Users | US06 | S |
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
| 052 | Add IN_PROGRESS / COMPLETED booking statuses and central transition table | E4 Games | US19 | M |
| 053 | Bootstrap the first admin (seed script or ADMIN_EMAILS) | E1 Users | US05 | S |
| 054 | Set up Supabase project: Google provider, JWT secret, env vars | E1 Users | US04 | S |
| 056 | Extend room with catalog fields (slug, genre, min players, difficulty, hook, story, audience) | E2 Rooms & Slots | US10 | M |
| 057 | Implement reactivate room (admin) + tests | E2 Rooms & Slots | US09 | S |
| 058 | Implement bulk generation of time slots for a room (admin) + tests | E2 Rooms & Slots | US11 | M |
| 059 | Expose slot state (free / taken / blocked / past) and day board across rooms + tests | E2 Rooms & Slots | US12 | M |
| 061 | Implement personal stats (games played, escaped, best time) + tests | E4 Games | US22 | S |
| 062 | Expose room success rate in room responses + tests | E4 Games | US22 | S |
| 063 | Demo seed: 4 rooms, slots, users and sample bookings | E0 Foundation | - | M |

## Front tickets (Sprint 2, label `front`)

React client in `front/`. Ticket 064 (setup) belongs to Sprint 1 and is listed above; the rest are Sprint 2. Each ticket owns its own feature folder, so they can be taken in parallel (see `WORK_SPLIT.md`). Pure logic (prices, slot states, 24h rule, game transitions, door state machine) gets unit tests written with the code.

| Ticket | Title | Epic | User Story | Size | Feature folder |
|--------|-------|------|------------|------|----------------|
| 065 | Shared front base: Tailwind theme, room theme registry, MSW, common UI components + tests | E0 Foundation | - | M | `shared/`, `rooms/model`, `test/` |
| 066 | Port the 3D corridor: createCorridor, Corridor component, no-WebGL fallback + tests | E2 Rooms & Slots | US10 | L | `corridor/` |
| 067 | Rooms page with posters and room detail page + tests | E2 Rooms & Slots | US10 | M | `rooms/` |
| 068 | Room entry transitions and atmosphere effects + tests | E2 Rooms & Slots | US10 | M | `rooms/`, `styles/` |
| 069 | Admin: rooms form and activate / deactivate + tests | E2 Rooms & Slots | US07, US08, US09 | M | `admin-rooms/` |
| 070 | Admin: time slots management (create, edit, block, delete) + tests | E2 Rooms & Slots | US11 | M | `admin-rooms/` |
| 071 | Day picker and slot grid with states + tests | E3 Bookings | US12 | M | `booking/` |
| 072 | Players dial, price and checkout + tests | E3 Bookings | US13 | M | `booking/` |
| 073 | Booking confirmation, SLOT_TAKEN handling and draft store + tests | E3 Bookings | US13 | M | `booking/` |
| 074 | My bookings: list and tab filters + tests | E3 Bookings | US14 | M | `my-bookings/` |
| 075 | My bookings: modify players and cancel (24h rule) + tests | E3 Bookings | US15, US16 | M | `my-bookings/` |
| 076 | My bookings: change slot + tests | E3 Bookings | US17 | S | `my-bookings/` |
| 077 | Login with Google (Supabase) and AuthProvider with JWT interceptor + tests | E1 Users | US04 | M | `auth/`, `shared/api` |
| 078 | RequireRole guard and role-based navigation + tests | E1 Users | US05 | S | `auth/`, `app/layout` |
| 079 | Own profile page (/users/me) + tests | E1 Users | US06 | S | `profile/` |
| 080 | Admin: users list and role change + tests | E1 Users | US03, US05 | M | `admin-users/` |
| 081 | Staff: today's games board + tests | E4 Games | US18 | S | `staff/` |
| 082 | Staff: start, finish and register game result + tests | E4 Games | US19, US20, US21 | M | `staff/` |
| 083 | Client game history + tests | E4 Games | US22 | S | `my-bookings/` |
| 084 | Admin: statistics dashboard + tests | E5 Admin | US23 | M | `admin-stats/` |
| 085 | Admin: CSV export and pagination on lists + tests | E5 Admin | US24, US25 | S | `admin-stats/`, `shared/ui` |

Dependencies: the front tickets consume the back endpoints of the same epic (`API_CONTRACT.md`). Login, roles, games, statistics and CSV (tickets 035 to 047) are Sprint 2 back tickets, so their front tickets can start with MSW mocks and switch to the real API when the endpoint is merged.
