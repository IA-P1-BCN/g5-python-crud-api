# Front security review

Date: 2026-10-19. Scope: `front/` only, read-only. No CRITICAL or HIGH issue found. The API is the real authority on every check traced (admin, staff, booking ownership, list filter). No secret needs to be rotated.

## Findings

| ID | Severity | Where | Issue | Exploit scenario | Fix idea |
|---|---|---|---|---|---|
| F-1 | MEDIUM | `front/src/features/admin-rooms/routes.js:4-13` | `/admin/salas` and `/admin/salas/:id/horarios` have no `RequireRole` (only `RequireAuth`), and `AdminRoomsPage` has no role check. Does not match the permission matrix (rooms/slots: admin only) | A client types `/admin/salas` and sees the whole admin UI (room form, toggles, slot management). Writes are refused by the API (`require_role("admin")`), so no data changes, but the UI leaks and shows confusing 403 errors | Wrap both routes like `admin-users/routes.js:10`: `createElement(RequireRole, { role: 'admin' }, ...)`. Add a test: a client on `/admin/salas` sees the 403 screen |
| F-2 | MEDIUM | `front/src/features/my-bookings/api/myBookingsApi.js:9-13` | `fetchMyBookings` calls `GET /bookings` without `user_id`, assuming "the API scopes it from the JWT". True only for clients: `resolve_user_filter` (`back/app/controllers/booking.py:155-157`) leaves it empty for staff and admin | Staff/admin opens `/mis-reservas` (allowed) and sees up to 100 bookings of all customers as "mine", with Cancel / Modify / Change-slot buttons acting on other people's bookings. Not privilege escalation (matrix allows it) but a data-handling/integrity bug | Send the caller's own id (`/users/me` or cached `meQueryKey`): `params: { user_id: me.id, size: 100 }`. Add an MSW test that the request includes `user_id` |
| F-3 | LOW | `front/nginx.conf:1-13` | No security headers (CSP, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`); `server_tokens` on. Matters because the Supabase JWT is in localStorage (F-4) | No XSS sink today; a future `dangerouslySetInnerHTML` or compromised dependency could read the token with no CSP to stop it. Site can be framed (clickjacking on cancel buttons) | Add `X-Content-Type-Options nosniff`, `X-Frame-Options DENY`, `Referrer-Policy strict-origin-when-cross-origin`, `server_tokens off`, and a CSP (`'self'`, Supabase URL in `connect-src`, Google OAuth); test CSP in report-only first |
| F-4 | LOW (tradeoff) | `front/src/features/auth/model/supabaseClient.js:12` | supabase-js default `persistSession: true`: tokens in `localStorage`. Usual choice for a SPA with Bearer auth, avoids CSRF; cost: any XSS can steal them | Only together with an XSS (none found) | Keep it, keep XSS defences strict (F-3 CSP, no `dangerouslySetInnerHTML`), note the tradeoff in `ARCHI.md` |
| F-5 | LOW | `front/src/app/layout/NavBar.jsx:9-18` | NavBar does not match existing routes: no link to `/mis-reservas` nor `/admin/usuarios`; the comment saying they are empty is stale. Functional, not a vulnerability | None | Add both links by role, update the comment; add `/admin/salas` only after F-1 |
| F-6 | LOW | `.gitignore:3,57` | `.env` and `*.local` ignored, but `front/.env.development`, `.env.production`, `.env.staging` are not | Someone commits `front/.env.production` with real `VITE_*` values on a public repo | Add `.env.*` and `!.env.example` to `.gitignore` |
| F-7 | LOW (verify outside code) | `front/src/features/auth/components/AuthProvider.jsx:65` | OAuth `redirectTo` = `window.location.origin + '/dashboard'`: fine in code. Safety depends on the Supabase "Redirect URLs" allowlist | A broad wildcard (e.g. `https://*`) lets an attacker get tokens returned to their own origin | In Supabase > Auth > URL Configuration allow only `http://localhost:3000/**` and the real production origin |

## Confirmed OK

- **Axios interceptor** (`shared/api/client.js:23-35`): single instance with relative `baseURL: '/api/v1'` (token only goes to our origin), token read fresh from `supabase.auth.getSession()`, a 401 signs out, clears the `me` cache and redirects to `/login`. No absolute URL passed to `api`.
- **XSS**: no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `window.open`; no `href`/`src` built from API data; texts rendered as React text; 3D signs use canvas `fillText`.
- **Open redirect**: none. `state.from` is stored but never read; login/register always go to `/dashboard`; no `?next=`/`?redirect=` parameter.
- **Keys/secrets in the bundle**: only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (public by design). No `eyJ...`, `sb_secret_`, `service_role` found. `front/.env.local` ignored. Dockerfile copies only `dist/`.
- **Role source**: from `GET /users/me` (our DB, BR-A3), not from the Supabase JWT or `user_metadata`. `hasRole` fails closed. `RequireRole` shows a spinner while loading (no flash of protected content).
- **Guards vs matrix (except F-1)**: all routes but `/login` and `/register` under `RequireAuth`; `/staff` needs staff; `/admin/usuarios` needs admin; `/perfil`, `/historial`, `/mis-reservas` need client (any logged-in role); NavBar filtered with the same `hasRole`.
- **API authority**: `POST /bookings` rejects a client sending another `user_id`; clients forced onto own bookings in `GET /bookings`; staff and admin endpoints use `require_role`.
- **CORS/CSRF**: single origin via proxy; Bearer header, not cookie, so CSRF does not apply.

## Dependencies

No install run. `three` is pinned to `0.128.0` (2021) on purpose and only renders our own data. To check: `docker compose run --rm front-tools npm audit --omit=dev`.

## Suggested order

1. F-1 (one line per route + test). 2. F-2 (`user_id` + test). 3. F-3 and F-6 (config only, one small PR). 4. F-5 with the F-1 PR. 5. F-7: manual check in the Supabase dashboard.
