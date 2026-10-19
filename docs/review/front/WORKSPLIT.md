# Front work split for the demo (Oct 20)

Source: `AUDIT.md` and the five detail reports (`react.md`, `security.md`, `silent-failures.md`, `styles-threejs.md`, `gaps.md`). Statistics and CSV are out of scope.

Ticket ids here are `FR-xx` (draft names). The team gives the real GitHub numbers when creating the issues (remember: issue number is not ticket number).

## How the split avoids conflicts

Each **owner** gets whole folders. Two owners never edit the same file. If a ticket needs a file owned by someone else, it says so and the change goes through that owner.

| Owner | Folders / files they own (only they edit) |
|---|---|
| **A: Booking flow** | `features/booking/**`, `i18n/es/booking.js`, `test/mocks/handlers/booking.js` |
| **B: App shell and auth** | `app/**` (`routes.jsx`, `providers.jsx`, `layout/NavBar.jsx`, `App.jsx`), `features/auth/**`, `features/dashboard/**`, `features/rooms/pages/RoomPage.jsx`, `features/rooms/components/RoomHero.jsx`, `shared/api/errors.js`, `i18n/es/common.js`, `i18n/es/auth.js`, `i18n/es/rooms.js` |
| **C: My bookings** | `features/my-bookings/**`, `features/profile/**`, `features/staff/**`, their `i18n/es/*.js` and `test/mocks/handlers/*.js` |
| **D: Admin rooms** | `features/admin-rooms/**`, `features/admin-users/**`, `i18n/es/adminRooms.js`, `i18n/es/adminUsers.js`, `test/mocks/handlers/adminRooms.js` |
| **Anyone (small, separate PRs)** | root config: `.gitignore`, `front/nginx.conf`, `docs/*.md` (see FR-13, FR-14) |

Tickets of the same owner touch the same files: **they are done one after the other by the same person**, in the order shown. Nothing here needs two people on the same ticket.

Cross-owner dependency (only one): FR-04 (owner C) needs the logged-in user id. It reads it through the public API of auth (`@/features/auth`). If `index.js` does not export it yet, ask B for one line in `features/auth/index.js` (FR-06 does it).

## Order and priority

| Priority | Meaning |
|---|---|
| **P0** | Must be merged before the demo: visible bug or broken flow |
| **P1** | Do it if time allows, or right after the demo |

| Owner | Tickets in order |
|---|---|
| A | **FR-00 (P0, first, blocks everything)**, FR-01 (P0), FR-02 (P0), FR-03 (P1) |
| B | FR-06 (P0), FR-07 (P0), FR-08 (P0), FR-09 (P1) |
| C | FR-04 (P0), FR-05 (P0), FR-10 (P1) |
| D | FR-11 (P0), FR-12 (P0), FR-15 (P1) |
| Anyone | FR-13, FR-14 (P1) |

## Rules for every ticket (project CONTRIBUTING)

- Branch from `develop`: `fix/<ticket>-<desc>`. PR to `develop` with `Closes #n`. Conventional Commits.
- Tests together with the code, one per acceptance criterion; at least one test must fail without the fix.
- End of ticket: `docker compose run --rm front-tools`, then `git status` and `git restore` the files that are not yours (prettier reformats the whole `front/`).
- Visible texts in `i18n/es/<feature>.js`, tokens only (no default Tailwind palette), `shared/ui` components before raw HTML.
- Before the PR: `/codex:review --base develop`.

---

## Owner A: Booking flow

### FR-00 (P0, URGENT) The whole front is blank on `develop`
Found while starting the browser test (console: `SyntaxError: The requested module '/src/features/booking/pages/ConfirmationPage.jsx' does not provide an export named 'ConfirmationPage'`).
**Problem.** `booking/routes.js` imports `{ ConfirmationPage }` (named) but `ConfirmationPage.jsx` only has `export default`. Vite fails to load the route module, so every page (even `/login`) is white. Vitest probably does not notice because tests import the component directly.
**Files.** `booking/pages/ConfirmationPage.jsx` (or `booking/routes.js`).
**Do.** One line: make `ConfirmationPage.jsx` export the function by name too (like `CheckoutPage.jsx`), or import it as default in `routes.js`.
**Acceptance.** `http://localhost:3000/login` renders; `docker compose run --rm front-tools` green. Merge this first: nobody can see the app before it.

### FR-01 (P0) Booking draft must not leak between rooms and must handle a missing room
Reports: R-2, SF-4, R-9, SF-5.
**Problem.** The Zustand draft (`selectedSlot`, `slotId`, `selectedDate`) is global. Pick a slot in room A, open room B: "Continuar" is enabled and the booking is created for room A's slot while B's name and price are shown. Also, an unknown/inactive room leaves "loading slots" forever because `useRoom` errors are ignored.
**Files.** `booking/pages/BookingPage.jsx`, `booking/model/bookingDraft.store.js`, `i18n/es/booking.js`, tests.
**Do.**
1. Store the `roomSlug` in the draft; reset the draft when `:slug` differs (or on mount of `BookingPage` with a new slug).
2. "Continuar" is enabled only if `selectedSlot` is in the slots currently displayed.
3. Handle `useRoom` states before the slot grid: loading (Spinner), 404/inactive (EmptyState "room not found"), other error (Alert). Use `isLoading`, not `isPending`, for the slots query.
**Acceptance.**
- Select a slot in room A, navigate to `/reservar/b`: no slot selected, "Continuar" disabled.
- `/reservar/does-not-exist` shows "not found", not an endless spinner.
- Tests: store reset on slug change; BookingPage with MSW 404 for the room.

### FR-02 (P0) Checkout and confirmation use real data and show real errors
Reports: R-8, SF-2, SF-3, SF-6, R-7, SF-7, SF-8.
**Problem.** Checkout falls back to a fake room (price 0, min 1) while loading or after a reload; `players` starts from the fallback; the confirmation date is always "—" (code reads `starts_at`, the store has `startsAt`); a reload of `/confirmacion` still shows "confirmed"; only `SLOT_TAKEN`/`SLOT_NOT_AVAILABLE` are mapped, others show "unexpected"; name/email/phone are validated but never sent.
**Files.** `booking/pages/CheckoutPage.jsx`, `ConfirmationPage.jsx`, `booking/api/bookingApi.js`, `booking/hooks/useCreateBooking.js`, `booking/model/errors.js`, `i18n/es/booking.js`, tests and `test/mocks/handlers/booking.js`.
**Do.**
1. Remove `DEFAULT_ROOM`: show loading/error until the room is loaded; redirect to `/reservar/:slug` if the draft is empty.
2. Initialise `players` from the real `min_players` (keyed child or effect when the room arrives).
3. Read `selectedSlot?.startsAt`; seed the test with the output of `toSlot`.
4. `ConfirmationPage`: redirect to `/mis-reservas` when `location.state.booking` is missing.
5. `useCreateBooking`: `useMutation` + `mapApiError`; add `INVALID_PLAYERS`, `ROOM_INACTIVE`, `USER_INACTIVE`, `BOOKING_LIMIT_REACHED`, `UNAUTHORIZED` to `model/errors.js`; invalidate `['slots']` and `['bookings','me']`; take the user id from the auth query instead of calling `GET /users/me` on every submit.
6. Contact fields: remove them from the form (the user is already logged in) or prefill from the profile. Team decision; the simple choice is removing them.
**Acceptance.**
- Reload of checkout never shows "0,00 €".
- Confirmation ticket shows the real date; direct URL of confirmation redirects.
- Each error code above shows its own Spanish message.
- Tests: one per point 1 to 5.

### FR-03 (P1) Accessibility of slot grid and day picker
Reports: R-13, R-14 (booking part).
**Files.** `booking/components/SlotGrid.jsx`, `DayPicker.jsx`, `ConfirmationTicket.jsx`, `i18n/es/booking.js`.
**Do.** `aria-pressed` on selected slot/day; hidden state text ("(ocupado)", "(pasado)"); `aria-label` with full date/time on day buttons; heading levels (h1 then h2).
**Acceptance.** Testing Library `getByRole('button', {name: /…/, pressed: true})` finds the selected slot.

---

## Owner B: App shell and auth

### FR-06 (P0) Clear the whole cache on logout and 401 (and export the user key)
Reports: R-1, SF-15, R-17.
**Problem.** Logout only removes `['auth','me']`. Next user sees the previous user's bookings, history, profile, admin lists for a moment.
**Files.** `features/auth/components/AuthProvider.jsx`, `features/auth/index.js`, `features/auth/api/authApi.js`, tests.
**Do.**
1. `queryClient.clear()` in `logout`, in the 401 handler and on `onAuthStateChange` `SIGNED_OUT`.
2. `getSession().then(...)`: add `.catch` + `finally` so `initializing` always ends; `try/catch` around `signOut()`.
3. Export the `me` query key and a way to read the current user id from `@/features/auth` (needed by FR-04).
**Acceptance.**
- Test: log in as A with cached bookings, logout, log in as B: the first render shows no data of A.
- `getSession` rejecting does not leave an endless spinner.

### FR-07 (P0) Navigation: links, Reserve button, home page, 404
Reports: G-04, R-11, F-5, R-10, S4, SF-17.
**Problem.** Nothing links to `/reservar/:slug`, `/mis-reservas` or `/admin/usuarios`; `/` and `/dashboard` are placeholders; unknown URL is a blank page.
**Files.** `app/layout/NavBar.jsx`, `app/routes.jsx`, `app/App.jsx`, `features/rooms/pages/RoomPage.jsx`, `features/rooms/components/RoomHero.jsx`, `features/dashboard/pages/DashboardPage.jsx`, `i18n/es/common.js`, `i18n/es/rooms.js`, tests.
**Do.**
1. NavBar by role: all logged-in: Salas, Mis reservas; staff/admin: Staff; admin: Usuarios (and Salas admin once FR-11 is merged). Fix the stale comment.
2. "Reservar" button on `RoomPage` (and `RoomHero`) linking to `/reservar/:slug`.
3. `/` redirects to `/salas` (or `/dashboard` with links to the same pages).
4. Catch-all `*` route with a "page not found" EmptyState; an Error Boundary around the routes.
**Acceptance.**
- A client sees exactly the links of their role; each link renders its page.
- Click path: Salas, room, Reservar, grid. Unknown URL shows the 404 page.
- Tests with MSW for each role.

### FR-08 (P0) Map all backend error codes to Spanish
Reports: G-05, SF-8 (shared part), SF-9 (shared part).
**Files.** `shared/api/errors.js`, `i18n/es/common.js`, `shared/api/errors.test.js`.
**Do.** Add `BOOKING_LIMIT_REACHED`, `ROOM_HAS_BOOKINGS`, `LAST_ADMIN`, `ROOM_INACTIVE`, `USER_INACTIVE`, `INVALID_PLAYERS`, `SLOT_OVERLAP`, `AUTH_UNAVAILABLE`, `METHOD_NOT_ALLOWED`, `HTTP_ERROR` with Spanish texts; unknown code keeps the generic message and a network error has its own text.
**Acceptance.** One test per code. Other owners (A, D) use these in their tickets and may keep their own per-feature tables.

### FR-09 (P1) QueryClient and lazy loading
Reports: R-10, S17.
**Files.** `app/providers.jsx`, `app/routes.jsx` (after FR-07 is merged, same owner).
**Do.** `retry` false on 4xx; `React.lazy` + `Suspense` for corridor, admin and staff pages so Three.js is its own chunk.
**Acceptance.** `/salas/xxx` shows "not found" in under 1 s; build output has a separate Three.js chunk.

---

## Owner C: My bookings, profile, staff

### FR-04 (P0) "Mis reservas" shows only my bookings
Reports: F-2.
**Problem.** `fetchMyBookings` calls `GET /bookings` without `user_id`. For staff and admin the API returns everyone's bookings, shown as "mine" with cancel/modify buttons.
**Files.** `my-bookings/api/myBookingsApi.js`, `hooks/useMyBookings.js`, tests and `test/mocks/handlers/myBookings.js`.
**Do.** Send `params: { user_id: me.id, size: 100 }`, with `me` from the auth query (depends on FR-06 point 3; until it is merged, use `GET /users/me`).
**Acceptance.** MSW test: the request contains `user_id`; a staff user sees only their own bookings.

### FR-05 (P0) One time zone for displayed dates
Reports: R-3, SF-13.
**Problem.** `BookingCard` formats in UTC, everything else in local time: a booking at 12:00 shows as 10:00 in "Mis reservas".
**Files.** `my-bookings/components/BookingCard.jsx` (and its test). The slot grid, ticket and staff table already use local time; do not touch them.
**Do.** Remove `timeZone: 'UTC'` in `BookingCard`; check `ChangeSlotDialog` uses the same format.
**Acceptance.** Test with `TZ=Europe/Madrid`: a slot at `2026-10-20T10:00:00Z` shows 12:00. Note in the PR that the 24h rule and the back use UTC and are unaffected.

### FR-10 (P1) Staff polish
Reports: SF-20, SF-21, R-19, G-06 (first step).
**Files.** `staff/hooks/*` (`onSettled` invalidation), `my-bookings/components/ChangeSlotDialog.jsx` (show rooms error), `staff/components/GameActions.jsx`.
**Do.** `onSettled` instead of `onSuccess` only; surface the `useRooms` error; one mutation hook for all rows.
**Not in this ticket.** "All bookings list with filters and cancel for staff" (G-06) is a new feature: separate ticket after the demo.
**Acceptance.** After `INVALID_TRANSITION` the row refreshes.

---

## Owner D: Admin rooms and users

### FR-11 (P0) Admin rooms: guard, visible errors, form that validates
Reports: F-1, R-4, SF-1, SF-10, SF-12, R-5, R-6 (errors/paging part), S1, S2, S3, S5, SF-9, SF-11.
**Problem.** Any logged-in user opens `/admin/salas`; save and toggle errors are invisible (the form only renders `DUPLICATE`); capacity/difficulty errors are not shown; only the first 20 rooms; the feature is hard-coded Spanish with raw inputs and no tokens; slot error codes in `i18n` are invented (`SLOT_ACTIVE_BOOKING`, `SLOT_NOT_FOUND`).
**Files.** everything in `features/admin-rooms/**`, `i18n/es/adminRooms.js`, `test/mocks/handlers/adminRooms.js`.
**Do.**
1. `RequireRole role="admin"` on both routes; test that a client gets the 403 screen.
2. Show `apiError` in an `Alert` for every error with `mapApiError`; same for toggle errors; load error in Spanish.
3. `RoomForm`: use `Field`, `noValidate`, error under every field (capacity, difficulty, min_players), `loading` button, `reset()` after success; do not send empty `genre/hook/story/audience`.
4. Move every hard-coded text to `i18n/es/adminRooms.js`; use `Button`, `EmptyState`, `border-line` tokens in `RoomsTable`, `SlotsTable`, `SlotForm`.
5. Paginate the rooms table with `Pagination` (or at least pass `size=100`).
6. Map the real slot codes: `SLOT_TAKEN`, `NOT_FOUND`, `ROOM_INACTIVE`, `SLOT_OVERLAP`; change the mocks to match.
**Acceptance.**
- A client on `/admin/salas` sees "forbidden".
- Forcing a 422 or 500 from the mock shows a message; empty capacity shows a field error.
- Tests: the toggle test must fail if the request is wrong (see FR-15).

### FR-12 (P0) Admin slot generation screen
Reports: G-03.
**Problem.** The API `POST /rooms/{id}/time-slots/generate` exists, there is no screen. A new room stays invisible to clients until an admin creates slots one by one.
**Files.** `admin-rooms/pages/AdminSlotsPage.jsx`, new `admin-rooms/components/GenerateSlotsForm.jsx`, `admin-rooms/api/adminSlotsApi.js`, `model/slotSchema.js` (or a new schema file), `i18n/es/adminRooms.js`, mocks and tests. Same owner as FR-11, so do it right after.
**Do.** Form with `date_from`, `date_to` (max 90 days apart), `first_start`, `last_start` (Zod, `noValidate`, empty-field check); on success show `created_count` and `skipped_count`; refresh the slots table; map `NOT_FOUND`, `ROOM_INACTIVE`, `VALIDATION_ERROR`.
**Acceptance.**
- Generating for a new room makes its slots appear and the room appears in the corridor.
- Range over 90 days or `first_start` after `last_start` shows a field error without calling the API.
- Tests with MSW for success, `ROOM_INACTIVE` and validation.

### FR-15 (P1) Admin tests that can really fail and small admin fixes
Reports: SF-14, R-12, R-15, SF-21 (slots part), R-19 (users part).
**Files.** same folders as FR-11.
**Do.** Use the shared MSW server (`onUnhandledRequest: 'error'`); add `PUT /rooms/:id/(de)activate` and paginated `GET /rooms` to the mock; anchor `/^activar$/i`; remove the `Array.isArray` hack; cancel stale responses in `useAdminSlots`; confirm dialog before deactivating a user and before deleting a slot.
**Acceptance.** Break the call (wrong method) and the test fails.

---

## Anyone: small separate PRs (P1)

### FR-13 Repo and nginx hygiene
Reports: F-3, F-6, S15, S16.
**Files.** `.gitignore`, `front/nginx.conf`, `docs/ARCHI.md` (Node 22 line).
**Do.** `.env.*` and `!.env.example` in `.gitignore`; in nginx: `gzip on`, long cache for `/assets/`, `no-cache` for `index.html`, `X-Forwarded-*` headers, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `server_tokens off`. Do not add a CSP the day before the demo.
**Acceptance.** `docker compose up --build` still serves the app and `/api` works.

### FR-14 Docs in sync with the code
Reports: G-10.
**Files.** `docs/API_CONTRACT.md` (already lists the new codes after the last pull: check only), `docs/ARCHI.md` (remove stats/CSV files from the tree), `NavBar.jsx` comment is covered by FR-07.
**Acceptance.** `docs-freshness` agent reports no drift for the front.

---

## After the demo (not scheduled)

- Corridor robustness: `webglcontextlost`, dispose when setup throws, 767 vs 800 px breakpoint, font loading for signs, fewer point lights (S6 to S11). Owner: whoever owns `corridor/`.
- All-bookings list for staff/admin with filters and cancel (G-06).
- Server-side tab filters and pagination in "Mis reservas" (G-07).
- Accessibility of tables and headings (R-14), `Stamp` inline styles (S12), CSP (F-3), Supabase redirect allowlist check (F-7).

## Checks outside the code (Charlotte or whoever has access)

- Supabase > Auth > URL Configuration: only `http://localhost:3000/**` and the production origin (F-7).
- Test accounts for the browser run (client, staff, admin) are still needed.
