# USER STORIES

Unified from the team's two drafts (HU-01..08 and HU01..21). Each story is delivered as one ticket, see `TICKETS.md`.
`b` suffix = second part of the story delivered in Sprint 2.

## E1 Users

### US-01 - Create user (registration, basic)  (Sprint 1)

**As a** visitor, **I want** register with my data, **so that** I can book escape rooms.

Acceptance criteria:
- `POST /users` with `name`, `email`, optional `phone` returns 201
- Role defaults to `client`; `is_active` defaults to true
- Duplicate email returns 409 `DUPLICATE`; invalid email returns 422
- Tests: success, duplicate email, invalid email, missing name

Rules: BR-U1, BR-U2, BR-U3

### US-04 - View and update user profile  (Sprint 1)

**As a** client, **I want** see and edit my profile, **so that** my contact data stays correct.

Acceptance criteria:
- `GET /users/{id}` returns the user, 404 if missing
- `PUT /users/{id}` updates `name` and `phone`; email cannot be changed here
- Tests: get ok, get 404, update ok, update with invalid data

Rules: BR-U2

### US-05 - List and deactivate users  (Sprint 1)

**As a** administrator, **I want** list and deactivate users, **so that** I control who can use the system.

Acceptance criteria:
- `GET /users` lists users
- `PATCH /users/{id}/deactivate` sets `is_active=false`, never deletes the row
- Deactivating twice is idempotent (200)
- Tests: list, deactivate, deactivate unknown id (404)

Rules: BR-U4

### US-02 - Login with Supabase (Google)  (Sprint 2)

**As a** user, **I want** sign in with my Google account, **so that** I do not need another password.

Acceptance criteria:
- Client app logs in with Google through Supabase and receives a JWT
- API validates the JWT on protected endpoints; invalid or missing token returns 401
- First login creates a `users` row with role `client` and stores `auth_id`
- Tests with a signed test JWT (no real Supabase call)

Rules: BR-A1, BR-A2

### US-03 - Roles and permissions  (Sprint 2)

**As a** administrator, **I want** manage roles, **so that** each person only accesses what they need.

Acceptance criteria:
- Dependency `require_role(...)` protects endpoints following the matrix in BUSINESS_RULES.md
- Wrong role returns 403 `FORBIDDEN`
- `PATCH /users/{id}/role` only for admin
- Clients only see and cancel their own bookings
- Tests: each role against each protected endpoint group

Rules: BR-A3, BR-A4

### US-04b - Own profile with /users/me  (Sprint 2)

**As a** client, **I want** see and edit my own profile, **so that** I do not need to know my id.

Acceptance criteria:
- `GET /users/me` and `PUT /users/me` use the JWT identity
- Tests: with token, without token

Rules: -

## E2 Rooms & Slots

### US-06 - Create room  (Sprint 1)

**As a** administrator, **I want** create a room, **so that** the room can be offered to clients.

Acceptance criteria:
- `POST /rooms` with `name`, `capacity`, `duration`, `base_price` returns 201, `status=active`
- Duplicate name returns 409; `capacity` < 1, `duration` <= 0 or negative price returns 422
- Tests: success, duplicate name, each invalid field

Rules: BR-R1, BR-R2

### US-07 - Edit room  (Sprint 1)

**As a** administrator, **I want** edit a room, **so that** the offer stays up to date.

Acceptance criteria:
- `PUT /rooms/{id}` updates name, capacity, duration, base_price
- 404 if missing; same validations as creation
- Renaming to an existing name returns 409
- Tests: success, 404, duplicate name, invalid values

Rules: BR-R1, BR-R2

### US-08 - Deactivate room  (Sprint 1)

**As a** administrator, **I want** deactivate a room, **so that** it is no longer offered without losing its history.

Acceptance criteria:
- `PATCH /rooms/{id}/deactivate` sets `status=inactive`
- A room with future active bookings returns 409 (to validate, D-03)
- Inactive room accepts no new slots or bookings (tested in US-10 / US-12)
- Tests: deactivate ok, with future bookings, unknown id

Rules: BR-R3, BR-R4, BR-R5

### US-09 - List and get rooms  (Sprint 1)

**As a** client, **I want** see the available rooms, **so that** I can choose an experience.

Acceptance criteria:
- `GET /rooms` lists rooms, `?status=active` filters
- `GET /rooms/{id}` returns the room, 404 if missing
- Tests: list all, filter by status, get ok, get 404

Rules: BR-R4

### US-10 - Configure time slots (create, edit, delete)  (Sprint 1)

**As a** administrator, **I want** define the time slots of each room, **so that** I control when bookings can happen.

Acceptance criteria:
- `POST /time-slots` with `room_id`, `starts_at`, `ends_at` returns 201
- 422 if `ends_at` <= `starts_at` or start in the past; 409 if it overlaps another slot of the room; 409 if the room is inactive
- `PUT /time-slots/{id}` edits times or status (`available`/`blocked`); `DELETE` returns 204
- Edit/delete of a slot with an active booking returns 409
- Tests: each rule above, success and failure

Rules: BR-S1, BR-S2, BR-S3, BR-S4, BR-S6, BR-R4

### US-11 - Check availability  (Sprint 1)

**As a** client, **I want** see the rooms and times that are free, **so that** I can pick when to play.

Acceptance criteria:
- `GET /time-slots?room_id=&date=&available=true` returns only bookable slots
- Each slot exposes computed `is_bookable` (BR-S5)
- Booked or blocked slots are not returned when `available=true`
- `GET /time-slots/{id}` returns one slot, 404 if missing
- Tests: filters, booked slot hidden, blocked slot hidden, 404

Rules: BR-S5

## E3 Bookings

### US-12 - Create booking  (Sprint 1)

**As a** client, **I want** book a room for a date and time, **so that** my experience is guaranteed.

Acceptance criteria:
- `POST /bookings` with `user_id`, `time_slot_id`, `players` returns 201 with status `PENDING`
- `total_price` is computed by the system (BR-B4)
- 409 if slot not bookable, room inactive, or user inactive; 404 if user or slot missing
- 422 if `players` < 1 or > room capacity
- Two simultaneous requests for one slot: exactly one succeeds (DB index, BR-B8)
- Tests: success, each error, double booking

Rules: BR-B1, BR-B2, BR-B3, BR-B4, BR-B8, BR-U5

### US-13 - View bookings  (Sprint 1)

**As a** client, **I want** see my bookings, **so that** I know when I am playing.

Acceptance criteria:
- `GET /bookings` lists bookings, filter `?user_id=&status=`
- `GET /bookings/{id}` returns the booking with room and slot info, 404 if missing
- Tests: list, filters, get ok, get 404

Rules: -

### US-14 - Modify booking (players)  (Sprint 1)

**As a** client, **I want** change the number of players, **so that** I can adapt to my group.

Acceptance criteria:
- `PATCH /bookings/{id}` changes `players`; `total_price` is recalculated
- Only while `PENDING`/`CONFIRMED` and 24h or more before the slot starts, otherwise 409
- 422 if the new `players` exceeds capacity
- Tests: success, too late, cancelled booking, over capacity

Rules: BR-B2, BR-B4, BR-B7

### US-15 - Cancel and confirm booking  (Sprint 1)

**As a** client, **I want** cancel a reservation, **so that** I can change my plans.

Acceptance criteria:
- `PATCH /bookings/{id}/cancel` sets `CANCELLED` when the slot starts in 24h or more; the slot becomes bookable again
- Less than 24h returns 409 `TOO_LATE_TO_CANCEL`; already cancelled returns 409 `INVALID_TRANSITION`
- `PATCH /bookings/{id}/confirm` moves `PENDING` to `CONFIRMED`
- Tests: cancel ok, exactly 24h boundary, under 24h, double cancel, confirm ok, confirm from cancelled

Rules: BR-B5, BR-B6

### US-14b - Change slot of a booking  (Sprint 2)

**As a** client, **I want** move my booking to another time, **so that** I do not need to cancel and rebook.

Acceptance criteria:
- `PATCH /bookings/{id}` accepts `time_slot_id`
- New slot must be bookable and 24h or more away; the old slot becomes free
- Tests: success, new slot taken, too late, other room

Rules: BR-L5, BR-B7

## E4 Games

### US-16 - Today's bookings (staff)  (Sprint 2)

**As a** staff member, **I want** see today's bookings, **so that** I can organise the games.

Acceptance criteria:
- `GET /bookings/today` returns bookings whose slot starts today, ordered by time
- Allowed for staff and admin only
- Tests: today only, ordering, role check

Rules: -

### US-17 - Start game  (Sprint 2)

**As a** staff member, **I want** start a game, **so that** the status shows it is running.

Acceptance criteria:
- `PATCH /bookings/{id}/start` moves `CONFIRMED` to `IN_PROGRESS`
- Only on the booking's date; other states return 409 `INVALID_TRANSITION`
- Tests: ok, wrong state, wrong day

Rules: BR-G1, BR-G2, BR-G3

### US-18 - Finish game  (Sprint 2)

**As a** staff member, **I want** finish a game, **so that** the booking is closed.

Acceptance criteria:
- `PATCH /bookings/{id}/finish` moves `IN_PROGRESS` to `COMPLETED`
- Tests: ok, wrong state

Rules: BR-G2

### US-19 - Register game result  (Sprint 2)

**As a** staff member, **I want** record the result of the experience, **so that** the team can see how they did.

Acceptance criteria:
- New table `game_results` (`booking_id` unique, `completed`, `completion_time` seconds) with migration
- `POST /bookings/{id}/result` only when booking is `COMPLETED`; second result returns 409
- Tests: ok, not completed, duplicate, invalid time

Rules: BR-G4

### US-20 - Game history  (Sprint 2)

**As a** client, **I want** see my past experiences, **so that** I remember how I did.

Acceptance criteria:
- `GET /users/{id}/history` (and `/users/me/history`) lists past bookings with results
- Client only sees their own history
- Tests: with results, without, other user's history returns 403

Rules: BR-G5

## E5 Admin

### US-21 - Business statistics  (Sprint 2)

**As a** administrator, **I want** see business statistics, **so that** I can make decisions.

Acceptance criteria:
- `GET /stats/overview?date_from=&date_to=` returns bookings per room, occupancy % and revenue
- Cancelled bookings excluded from revenue
- Admin only; tests with known fixtures and exact numbers

Rules: BR-L4

### US-22 - Export bookings to CSV  (Sprint 2)

**As a** administrator, **I want** export bookings to CSV, **so that** I can analyse them in a spreadsheet.

Acceptance criteria:
- `GET /bookings/export.csv` honours the same filters as the list
- Header row, UTF-8, `Content-Disposition: attachment`
- Admin only; tests parse the CSV output

Rules: BR-L3

### US-23 - Pagination and filters on list endpoints  (Sprint 2)

**As a** API consumer, **I want** paginate and filter lists, **so that** responses stay fast and relevant.

Acceptance criteria:
- All GET lists accept `page` and `size` and return `{items,total,page,size}`
- Filters from BR-L2 implemented for bookings and time slots
- Invalid `page`/`size` returns 422; `size` max 100
- Tests per list endpoint (coordinate with endpoint owners, shared helper)

Rules: BR-L1, BR-L2
