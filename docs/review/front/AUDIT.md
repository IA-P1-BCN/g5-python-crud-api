# Front audit (general)

Date: 2026-10-19. Branch `docs/project-documentation`, up to date with `develop` (ea0ac82). Scope: `front/` only. Method: 5 read-only agents reading the code, deduplicated here. Nothing was run in a browser yet.

## Detail files

| File | Agent | Topic |
|---|---|---|
| [react.md](react.md) | react-reviewer | hooks, state, forms, guards, a11y, tests (R-1 to R-20) |
| [styles-threejs.md](styles-threejs.md) | general-purpose | Tailwind, Sass, Three.js, ESLint boundaries, Vite/Docker/nginx (S1 to S19) |
| [security.md](security.md) | security-reviewer | token, XSS, guards vs permission matrix (F-1 to F-7) |
| [silent-failures.md](silent-failures.md) | silent-failure-hunter | errors with no feedback, tests that cannot fail (SF-1 to SF-22) |
| [gaps.md](gaps.md) | general-purpose | what is missing vs API, docs and roles (G-03 to G-10; statistics and CSV were dropped from scope) |
| browser-test.md | verifier + Chrome | **not done yet**: waiting for client, staff and admin test accounts |

## Verdict

**Do not demo as is.** The status flow (PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED, by staff/admin) is built and role-guarded. But there are 4 real bugs in the booking flow, no bulk slot generation UI, and no navigation to the main client pages.

Security: no Critical or High finding in the front. The API is the authority everywhere that was traced.

## Answer to "can staff and admin confirm a booking?"

Yes in the code: `PUT /bookings/{id}/confirm` is `require_role("staff","admin")` and `/staff` has a "confirm" button (tickets 081/082 merged). A client cannot. To be proven live in the browser test.
Limits: `/staff` lists today's bookings only (PENDING for tomorrow cannot be confirmed), and staff/admin cannot cancel a client's booking (G-06).

## Priority 1: fix before the demo (bugs)

**0. The app is blank on `develop`**: `booking/routes.js` imports `{ ConfirmationPage }` but the file only has a default export, so Vite fails and every page is white. One-line fix, ticket FR-00 in `WORKSPLIT.md`. Found by the browser test, not by the code reviews.

| # | Problem | Detail | Ticket idea |
|---|---|---|---|
| 1 | Booking draft is shared between rooms: a slot of room A can be booked while looking at room B | R-2, SF-4 | "booking: reset the draft when the room changes" |
| 2 | Checkout uses a fake room (price 0, min 1) while loading or after reload; minimum players ignored; confirmation date always "—" (`starts_at` vs `startsAt`); reload shows a "confirmed" ticket with no booking | R-8, SF-2, SF-3, SF-6 | "booking: checkout loading state, real room data, correct date" |
| 3 | "Mis reservas" shows UTC times, everything else local (2h off in summer) | R-3, SF-13 | "front: one time zone for all displayed dates" |
| 4 | Staff/admin opening `/mis-reservas` see everyone's bookings and can cancel them | F-2 (security.md) | "my-bookings: send `user_id` of the caller" |
| 5 | `/admin/salas` has no role guard (any logged-in user sees the admin UI) | F-1, R-4, SF-10 | "admin-rooms: RequireRole admin + test" |
| 6 | Cache not cleared on logout: next user briefly sees the previous user's data | R-1 | "auth: `queryClient.clear()` on logout/401" |
| 7 | Admin room form fails silently (no error shown for most failures, number fields with no message, wrong error codes for slots) | SF-1, SF-9, SF-12, R-5 | "admin-rooms: show every error, map real codes" |

## Priority 2: missing features

| # | Missing | Detail | Ticket |
|---|---|---|---|
| 8 | Bulk slot generation has no UI (API exists): a new room stays invisible until slots are created one by one | G-03 | **no ticket**: create one |
| 9 | No link to `/reservar/:slug` (no "Reserve" button on a room), `/mis-reservas`, `/admin/usuarios`; `/` and `/dashboard` are placeholders | G-04, R-11, F-5 | **no ticket**: create one |
| 10 | Backend error codes not mapped to Spanish (`BOOKING_LIMIT_REACHED`, `ROOM_HAS_BOOKINGS`, `ROOM_INACTIVE`, ...) | G-05, SF-8, R-7 | **no ticket** |
| 11 | Staff/admin: no all-bookings list with filters, no cancel for a client | G-06 | **no ticket** |

## Priority 3: quality and polish

- Admin-rooms is the least clean feature: hard-coded Spanish, raw inputs/buttons, borders without tokens, hand-rolled fetch instead of TanStack Query, only 20 rooms shown (S1, S2, S3, S5, R-6, SF-11). One ticket "admin-rooms: align with the design system and the architecture".
- Tests that cannot fail: admin-rooms toggle test (wrong HTTP method in the mock, regex matches "Desactivar"), `CheckoutPage` seeded with the wrong slot shape, mocks using invented error codes (SF-14, R-12, SF-3, SF-9).
- No catch-all 404 route, no ErrorBoundary, no lazy loading of Three.js, QueryClient retries 3 times on 404 (R-10, S17).
- Corridor: no `webglcontextlost` handling, leak if the scene throws during setup, 9 point lights, md breakpoint mismatch 767 vs 800 px, sign font may not be loaded (S6 to S11).
- nginx: no gzip, no cache headers, no forwarded headers, no security headers (S15, F-3). `.gitignore` misses `.env.*` (F-6).
- Accessibility: no `aria-pressed` on slots/days, identical buttons without context, heading levels, `sr-only` list with focusable buttons (R-13, R-14).
- Docs drift: `API_CONTRACT.md` lacks `LAST_ADMIN`, `ROOM_HAS_BOOKINGS`, `BOOKING_LIMIT_REACHED` and marks `/users/me` as not built; `ARCHI.md` says Node 20 (G-10, S16).

## To check outside the code

- Supabase > Auth > URL Configuration: only `http://localhost:3000/**` and the production origin allowed (F-7).
- `docker compose run --rm front-tools npm audit --omit=dev` (dependencies not audited).
- Vitest could not run fully with the local `node_modules` (react.md, Not verified): run `docker compose run --rm front-tools`, then `git restore` files that are not yours.

## What is solid

Axios single instance with token interceptor; no XSS sink; role comes from our DB, not from Supabase metadata; guards fail closed; server data in TanStack Query, draft in Zustand; Three.js dispose is complete after a normal unmount; tokens-only styling respected outside admin-rooms; reduced motion handled; ESLint boundaries respected.

## Next steps

1. Browser test with 3 accounts (client, staff, admin): confirms or refutes items 1 to 7 and the confirm flow.
2. Charlotte decides which items become tickets; drafts are in `gaps.md` (G-03 to G-10; statistics and CSV were dropped from scope) and the fix ideas in each detail file.
