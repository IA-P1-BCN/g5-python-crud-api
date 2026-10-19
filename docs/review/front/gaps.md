# Front gap analysis (what is missing)

Date: 2026-10-19. Branch `docs/project-documentation`, up to date with `develop`. Read-only analysis (code and docs read, app not run).

## Key findings

1. **The booking status flow is fully built in the front.** Staff and admin run PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED and register the result from `/staff` (tickets 081/082, PRs #174 and #176). A client cannot confirm, start or finish.
2. **Slot generation has no UI.** The API `POST /rooms/{id}/time-slots/generate` exists (ticket 058 is back-only). A new room stays invisible to clients until an admin creates slots one by one.
3. **Pages without a navigation link**: `/mis-reservas`, `/admin/usuarios`. `/dashboard` and `/` are placeholders.
4. **Backend error codes only partly mapped to Spanish**: e.g. `BOOKING_LIMIT_REACHED`, `ROOM_HAS_BOOKINGS`.

## Status flow by role

| Step | API endpoint | Who the API allows | UI | Who sees the button |
|---|---|---|---|---|
| Create (PENDING) | `POST /bookings` | any logged-in user; a client only for self | `/reservar/:slug` -> checkout -> confirmation | everyone |
| PENDING -> CONFIRMED | `PUT /bookings/{id}/confirm` | staff, admin | `GameActions` "confirm" in `/staff` | staff, admin |
| CONFIRMED -> IN_PROGRESS | `PUT /bookings/{id}/start` | staff, admin (only on the slot day, BR-G3) | `GameActions` "start" | staff, admin |
| IN_PROGRESS -> COMPLETED | `PUT /bookings/{id}/finish` | staff, admin | `GameActions` "finish" | staff, admin |
| Register result | `POST /bookings/{id}/result` | staff, admin | `ResultForm` (COMPLETED, no result yet) | staff, admin |
| Cancel | `PUT /bookings/{id}/cancel` | logged-in user; clients only own bookings + 24h rule | `/mis-reservas` `CancelDialog` | client only |
| Client sees result | `GET /users/me/history` | owner, staff, admin | `/historial` and `/perfil` | client |

Limits of the staff board: `GET /bookings/today` excludes cancelled and lists only today (staff cannot confirm a PENDING booking for tomorrow). Staff/admin have no screen to cancel a booking for a client, although the matrix and the API allow it.

## Endpoint coverage

| Endpoint | Front caller | Status |
|---|---|---|
| `POST /users` (admin) | none | Missing (low: registration goes through Supabase) |
| `GET /users` | `adminUsersApi` | OK |
| `PUT /users/{id}` (name, phone) | none | Missing (admin editing a user) |
| `PUT /users/{id}/deactivate`, `/role` | `UsersTable` | OK |
| `GET/PUT /users/me`, `GET /users/me/history` | profile, history | OK |
| `GET /users/{id}/history` | none | Missing (staff/admin viewing a player) |
| Rooms CRUD, activate/deactivate | admin-rooms | OK |
| `POST /rooms/{id}/time-slots/generate` | none | **Missing** |
| Time slots list/create/update/delete | booking, admin-slots | OK |
| Bookings create/list/update/cancel | booking, my-bookings | OK (list uses `size=100` only) |
| confirm / start / finish / result / today | staff | OK |

## Permission matrix vs UI

| Action | Role | UI |
|---|---|---|
| Rooms and slots CRUD | admin | OK, except bulk generation (G-03) |
| Create / view / modify / cancel own booking | client | OK |
| View all bookings | staff, admin | Missing (G-06) |
| Cancel a client's booking | staff, admin | Missing (G-06) |
| Today's bookings, start, finish, result | staff, admin | OK |
| Manage users and roles | admin | OK (list, deactivate, role); no reactivate endpoint |

## Specific checks

- **Cancelled and past tabs**: exist in `bookingFilters.js` / `BookingTabs`, but filter client-side over `GET /bookings?size=100`. A client with more than 100 bookings loses the oldest. The contract says the tabs use `date_from` / `date_to` / `status` on the server.
- **Error codes**: `mapApiError` falls back to `es.common.errors` (only `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `unknown`).

| Screen | Missing codes |
|---|---|
| Checkout | Only `SLOT_TAKEN` handled. `BOOKING_LIMIT_REACHED`, `ROOM_INACTIVE`, `SLOT_NOT_AVAILABLE`, `USER_INACTIVE`, `INVALID_PLAYERS` fall to "unexpected" |
| Admin rooms | `ROOM_HAS_BOOKINGS` (BR-R5) |
| Common | `INTERNAL_ERROR`, `USER_INACTIVE` |

`API_CONTRACT.md` also lacks the codes `LAST_ADMIN`, `ROOM_HAS_BOOKINGS`, `BOOKING_LIMIT_REACHED` (docs drift).

## Gap table

Severity: High = blocks the demo or the permission matrix. Med = a feature is incomplete. Low = polish.

| ID | Sev | Area | What is missing | What must be implemented | Acceptance criteria | Suggested ticket title | Files likely touched | Ticket status |
|---|---|---|---|---|---|---|---|---|
| G-03 | High | Admin, slots | No UI for bulk slot generation (API exists, 058) | Form on `/admin/salas/:id/horarios`: `date_from`, `date_to`, `first_start`, `last_start`, 90-day limit; show `created_count` / `skipped_count`; invalidate slots list | Generating creates slots and shows counts; past/overlapping skipped; `ROOM_INACTIVE` and `VALIDATION_ERROR` shown; admin only | "Admin: bulk generate time slots from the slots page" | `adminSlotsApi.js`, new `GenerateSlotsForm.jsx` + hook, `AdminSlotsPage.jsx`, `i18n/es/adminRooms.js`, MSW | **No ticket** |
| G-04 | Med | Navigation | `NavBar` lacks `/mis-reservas`, `/admin/usuarios`, `/admin/estadisticas`; `/dashboard` and `/` are placeholders | Links by role; useful dashboard shortcuts; replace `/` placeholder | Each role sees only its links; every route reachable without typing the URL; update `NavBar.test.jsx` | "Complete role-based navigation and dashboard shortcuts" | `NavBar.jsx`, `NavBar.test.jsx`, `i18n/es/common.js`, `DashboardPage.jsx`, `app/routes.jsx` | **No ticket** |
| G-05 | Med | Errors | Backend codes not mapped (see above) | Map every contract code in `es.common.errors` and per feature; use `mapApiError` in checkout and admin-rooms; add 3 codes to `API_CONTRACT.md` | Each code gives its Spanish message in a test; a unit test enumerates all contract codes against the map | "Map all backend error codes to Spanish messages" | `shared/api/errors.js`, `i18n/es/*`, `CheckoutPage.jsx`, `admin-rooms/hooks/*`, `docs/API_CONTRACT.md` | **No ticket** |
| G-06 | Med | Staff/admin, bookings | No screen to see all bookings (filters) or cancel a client's booking | "Bookings" page using `GET /bookings` with filters + pagination; cancel action for staff/admin | Staff finds a booking for any date and confirms/cancels it; pagination works; clients cannot reach it | "Staff/admin: all bookings list with filters and cancel" | new `staff/pages/AllBookingsPage.jsx`, `staffApi.js`, `routes.js`, nav, i18n, MSW | **No ticket** |
| G-07 | Low | Client bookings | Tabs filtered client-side over `size=100` | Pass filters to the API per tab, add pagination | Past tab calls `date_to=yesterday`, cancelled `status=CANCELLED`; more than 20 bookings paginate | "My bookings: server-side tab filters and pagination" | `myBookingsApi.js`, `useMyBookings.js`, `bookingFilters.js`, `MyBookingsPage.jsx` | Partial: 074 done, pagination not done |
| G-08 | Low | Admin, users | Cannot edit a user, view a user's history; no reactivate endpoint | Optional row action or detail drawer; decide with team if reactivation is needed | Decision recorded; if built, same validation as profile form | "Admin users: edit user and view history" | `admin-users/*`, `adminUsersApi.js`; reactivation: `routes/user.py` | **No ticket** |
| G-09 | Low | Staff board | No refresh/polling; no hint when `start` is not allowed today (BR-G3) | Refresh control; clear message on `INVALID_TRANSITION` | A new booking appears without full reload | "Staff board: refresh and disabled-state hints" | `useTodayBookings.js`, `StaffPlanningPage.jsx` | **No ticket** (081 done) |
| G-10 | Low | Docs | `API_CONTRACT.md` lacks 3 codes; `GET /users/me` still "not built yet"; `NavBar` comments stale | Fix the docs | Docs match the code | "Sync API_CONTRACT and ARCHI with the code" | `API_CONTRACT.md`, `ARCHI.md`, `NavBar.jsx` | **No ticket** |

## Summary

- **No ticket**: G-03 and G-04 to G-10. G-03 (slot generation) matters most: an admin cannot make a new room visible without it.
- **Not a gap**: status flow, staff board (081/082), game history (083), users admin (080), profile (079), manual rooms/slots (069/070), booking flow (071-073), my-bookings (074-076).
- **Suggested order** (Sprint 2 ends today, presentation Oct 20): G-03, then G-04 and G-05.
