# Browser test (client, staff, admin)

Date: 2026-10-19. `develop` after merging #198 to #205 (FR-00, 01, 02, 04, 05, 06, 07, 08, 11, 12). Real Chrome on http://localhost:3000, API in Docker on the **shared Supabase database**, three real Supabase Auth accounts. Charlotte logged in herself; Claude drove the page.

## Verdict

**The demo flow works end to end.** A client books, the booking is PENDING, staff and admin confirm it, staff starts and finishes the game and registers the result. No blocking bug in the front. What can hurt the demo is the **environment** (database not migrated, roles, accounts without a name) and a few small things listed below.

## Answer: can staff and admin confirm a booking?

**Yes, proven live.**
- Client booked "El Faro" 17:30 -> `Pendiente` -> staff clicked **Confirmar** -> `Confirmada` -> **Iniciar partida** -> `En curso` -> **Terminar partida** -> `Terminada` -> result saved (completed, 2400 s).
- Staff booked 19:00 -> `Pendiente` -> **admin** clicked **Confirmar** -> `Confirmada`.
- Limit: `/staff` lists only bookings of **today (UTC day)**. A booking for tomorrow cannot be confirmed until tomorrow.

## What was checked and works

| Area | Result |
|---|---|
| Login with the 3 accounts | OK. Names show ("Hola, Staff Test") once the accounts have a name in Supabase |
| Navbar by role | OK. Client: Salas, Mis reservas, Historial, Perfil. Staff adds Planning de hoy. Admin adds Gestión de salas and Usuarios |
| `/` redirect, 404 page | OK. `/` goes to `/salas`; unknown path shows "Página no encontrada" |
| Guards | OK. Staff on `/admin/salas` and `/admin/usuarios` sees "Acceso denegado" |
| Admin: create room | OK. Empty "Público" shows "El público es obligatorio"; saved room appears in the table |
| Admin: generate slots (FR-12) | OK. 2026-10-20 to 24, 09:00 to 17:00 UTC: "30 creadas, 0 omitidas". Today 14:00 to 19:00 UTC: 4 created |
| Client: book (FR-01, FR-02) | OK. Checkout shows the room, players, price per player, total; confirmation shows the real holder name and date/time (not hard-coded) |
| Client: slot taken | OK. The booked slot is greyed out in the grid afterwards |
| Client: "Mis reservas" (FR-04, FR-05) | OK. Only the client's own booking, local time (17:30), 24 h message "No se puede modificar ni cancelar con menos de 24 horas" |
| Staff: full cycle | OK (see above). Empty time shows "Indica el tiempo en segundos" |
| Admin: Usuarios | OK. 4 users, roles Cliente/Staff/Administrador, Desactivar |

## Problems found

### Environment (could have broken the demo, fixed or to do)

| # | Problem | Status |
|---|---|---|
| E1 | The shared Supabase DB was at the first migration (`11f302616e11`): `GET /rooms` returned 500 `column rooms.slug does not exist`. | **Fixed**: `alembic upgrade head` run once on the shared DB (now `6e7f8091a2b3`). The team must not run it again |
| E2 | Every new account is created with role `client`, so staff/admin looked like clients (same navbar). Roles live in our `users` table, not in Supabase. | Workaround: `update users set role=...` in the Supabase SQL Editor after the first login. Must be redone on any new database |
| E3 | Accounts without a name in Supabase `user_metadata` (`full_name` or `name`): the API answers 401 and the front logs the user out with no explanation. | Workaround: name set in Supabase for the 3 accounts. Real fix is a front/back message (see FR-16) |
| E4 | Register error is vague on 400/429. | Not fixed (FR-16) |
| E5 | Calls to the shared DB are slow from the Docker container (saving a room kept the spinner for a few seconds). | Be patient in the demo; do not click twice |
| E6 | `.env.example` has no `SHARED_DATABASE_URL` line for colleagues. | To do (small PR) |

### Front

| # | Severity | Problem | Ticket |
|---|---|---|---|
| B1 | Medium | The slot form says "Las horas son UTC", but the table shows local time: input 09:00 appears as 11:00 (Barcelona is UTC+2). Not a bug, but confusing on stage | FR-16 |
| B2 | Medium | `/admin/estadisticas` does not exist (`adminStatsRoutes = []`) while `ARCHI.md` still lists the stats files and page. Statistics are out of scope, so the docs are wrong, not the code | FR-14 |
| B3 | Low | Admin rooms table shows SLUG, GÉNERO, ESTADO but not the room **name** | FR-16 |
| B4 | Low | Checkout does not show the chosen date and time (only room, players, price). The time appears only on the confirmation page | FR-16 |
| B5 | Low | No success message after "Confirmar" or after saving a result: the row just changes. Easy to think nothing happened with slow DB calls | FR-10 |
| B6 | Low | The day picker offered only 3 days (19, 20, 21) although slots exist until the 24th. To check if it is a deliberate window | FR-16 |
| B7 | Info | `/staff` shows only today's bookings (UTC day): bookings for tomorrow cannot be confirmed until then. Known (gaps.md G-06) | after demo |

## Not tested (say so in the demo if asked)

Cancel, modify players and change slot (blocked by the 24 h rule for today's slots; needs a booking 24 h ahead), `SLOT_TAKEN` race between two clients, client "Historial" showing the finished game, "Perfil", Google login, register form, deactivate a user, change a role from the UI, deactivate a room.

## Data left in the shared database

1 room (El Faro, slug `faro`), 34 slots (19 to 24 Oct), booking #1 (Cliente Test, 17:30, completed, 2400 s), booking #2 (Staff Test, 19:00, confirmed), user `test.ticket005@example.com` (old test row, no `auth_id`). For tomorrow's demo, book a slot on 20 Oct: the staff board will show it that day.
