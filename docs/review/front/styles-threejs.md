# Tailwind, Sass, Three.js, ESLint boundaries, Vite/Docker/nginx review

Date: 2026-10-19. Branch up to date with `develop`. Static read-only pass: build, tests and ESLint were not run.

## Findings

| ID | Severity | File:line | Description | Fix idea |
|---|---|---|---|---|
| S1 | High | `features/admin-rooms/components/RoomForm.jsx:35,52,72,167` (whole file) | The whole form hard-codes Spanish (labels Slug, Nombre, Duración (min)..., "Guardar Sala") instead of `i18n/es/adminRooms.js`; uses raw `<input>`/`<textarea>`/`<label>` with a local `inputClass` instead of `shared/ui/Field` | Move texts to `es.adminRooms.form` (`SlotForm` already uses `t.form`); use `<Field label error {...register()} />` |
| S2 | High | `features/admin-rooms/components/RoomsTable.jsx:6,13-16` | Hard-coded texts (empty message, headers Slug, Género, Estado, Acciones); `EmptyState` exists but is not used | Use `es.adminRooms.*` and `EmptyState` |
| S3 | Medium | `features/admin-rooms/pages/AdminRoomsPage.jsx:55` | `<Spinner label="Cargando salas..." />` hard-coded | i18n key (`es.common.loading` or `es.adminRooms.loading`) |
| S4 | Medium | `app/routes.jsx:21` | `<h1>Escape rooms</h1>` hard-coded, unstyled placeholder for `/` (no `heading-title`) | i18n key, or redirect `/` to `/salas` or `/dashboard` |
| S5 | Medium | `admin-rooms/components/SlotsTable.jsx:12-14,43,49-55`, `SlotForm.jsx:~53,70-74`, `AdminSlotsPage.jsx:48` | Styling bypasses the design system: `border`, `border-b`, `rounded`, `shadow` with no token colour (Tailwind 4 default border colour is `currentColor`, so light lines on the dark theme); raw `<button className="rounded border px-4 py-2">` instead of `shared/ui/Button`; inputs without `border-line`, `bg-surface-2`, `min-h-11`. `tokensOnly.test.js` misses it because no palette class is used | `border-line`, `rounded-md`, `shadow-glow`/none; `Button variant="secondary\|ghost"` and `Field` |
| S6 | Medium | `features/corridor/components/CorridorView.jsx:10` vs `index.css` (`--breakpoint-md: 50rem`) | `SMALL_SCREEN_QUERY = '(max-width: 767px)'`, comment says "Tailwind's md (768px)"; in this project `md` is 800px. Between 768 and 799px the page is mobile but the 3D corridor stays on | `(max-width: 799px)`, fix the comment, or derive both from one constant |
| S7 | Medium | `features/corridor/scene/createCorridor.js:~19-34, 100-109` | No `webglcontextlost` listener: if the GPU drops the context after start-up the canvas goes blank and the fallback never triggers (`try/catch` in `Corridor.jsx` only covers construction) | Listen for `webglcontextlost` (with `preventDefault`) and call a new `onContextLost`; `Corridor` forwards it to `onError` |
| S8 | Medium | `createCorridor.js:18-42` + `Corridor.jsx:23-33` | If anything throws after `container.appendChild(canvas)` (e.g. in `buildDoors`/`createLabel`), renderer and canvas are never disposed; the `catch` in `Corridor` returns without cleanup: leaked WebGL context and an orphan canvas next to the fallback | `try { ... } catch (e) { dispose(); throw e }`, or append the canvas last |
| S9 | Medium | `features/corridor/scene/doorsBuilder.js:~52` | One `PointLight` per door + `MeshStandardMaterial`; with about 9 rooms that is up to 9 dynamic lights per fragment (heavy on integrated GPUs; shader recompile on add/remove). Not a leak | Fewer lights, or `MeshBasicMaterial`/emissive glow; cap active lights; add a perf check to the manual checklist |
| S10 | Low | `scene/labelTexture.js:9-24` | Text drawn once, font never awaited: if "Big Shoulders Display" is not loaded yet the sign shows Impact for the session | `await document.fonts.load('900 72px "Big Shoulders Display"')` before building, or `texture.needsUpdate = true` after `document.fonts.ready` |
| S11 | Low | `createCorridor.js:~20` | `setPixelRatio` read once; moving to another monitor or zooming keeps the old ratio | Re-apply in `resize()` |
| S12 | Low | `features/booking/components/Stamp.jsx:~14-40` | Inline `<style>` with own `@keyframes` inside the component (re-rendered per instance) instead of `src/styles/*.scss`; reduced motion handled; `mix-blend-multiply` on dark `bg-bg` nearly invisible | Move to `styles/stamp.scss`; check the blend mode visually |
| S13 | Low | `features/corridor/components/Corridor.jsx:35` | `h-screen` (100vh) in a page that also has a NavBar adds a vertical scrollbar | `h-dvh` minus the navbar, or `min-h-0 flex-1` in a flex layout |
| S14 | Low | `features/rooms/components/RoomsCorridor.jsx:16` | `eslint-disable react-hooks/exhaustive-deps` to keep the array reference stable by key; works and is documented but hides the rule | Optional: small helper hook memoizing on the key |
| S15 | Medium | `front/nginx.conf` | Minimal: no `X-Forwarded-For`/`X-Real-IP`/`X-Forwarded-Proto` (API sees nginx IP); no `gzip` (Three.js bundle uncompressed); no long cache for hashed `/assets/*`, no `no-cache` for `index.html`; no security headers; `proxy_pass http://api:8000` resolves at start-up so nginx fails if the API is not up | `gzip on`, `location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }`, `proxy_set_header` lines, security headers (see `security.md` F-3) |
| S16 | Low | `front/Dockerfile` | Final nginx image runs as root; `ARCHI.md` says "Node 20 build" while Dockerfile/compose use `node:22-alpine` | Fix the doc line (22); optionally `nginxinc/nginx-unprivileged` + `HEALTHCHECK` |
| S17 | Low | `front/vite.config.js:11-14` | Proxy string form with no `changeOrigin` (works with Docker/localhost); no `build` config, so Three.js ships in the main bundle even for users who get the fallback | Lazy-load `Corridor` (`React.lazy` + Suspense) so Three.js is its own chunk |
| S18 | Low | `eslint.config.js` | `shared` block does not forbid relative imports reaching `features`/`app` (`../../features/...`); only the `@/` form is blocked; same for `app` | Add `'../**/features/**'` to the patterns, or leave (low risk) |
| S19 | Info | `booking/components/{SlotGrid,DayPicker,PlayersDial}.jsx`, `staff/components/ResultForm.jsx:29` | Raw `<button>`/`<input type=checkbox>` instead of `shared/ui` (checkbox is documented as not built yet) | No action unless the team wants consistency |

## Confirmed OK

**Tailwind 4 and tokens**
- `index.css` has a coherent `@theme` block, a second `@theme inline` block for the shadcn aliases, and `@utility` entries for the type scale.
- No default-palette class, no `dark:` variant, no arbitrary colour, no `text-white`/`bg-black` in non-test files (`[#...]` only in `scene/` and `roomThemes`, which is data).
- Every colour-like utility in use maps to a token (`bg-primary`, `border-border`, `bg-muted/20`, `bg-input/30`, `bg-accent`, `bg-scrim`, `text-on-room`, state colours): no class is silently ignored.
- `shared/ui` is used by auth, booking, my-bookings, staff and dashboard; texts come from `es.*` almost everywhere except S1-S4.
- No bare `fetch(` and no `dangerouslySetInnerHTML`.

**Sass**
- `atmosphere.scss` and `gate.scss` contain only bespoke animated effects (`var(--rc)`/`var(--rd)`, no `@apply`, no `@theme`).
- Reduced motion handled in both (`animation: none`); `GateTransition` returns `null` and still calls `onDone`, so navigation is not blocked; `onAnimationEnd` filtered to the gate's own animation.

**Three.js (0.128)**
- `dispose()` cancels `requestAnimationFrame`, disconnects the `ResizeObserver`, aborts the canvas listeners (one `AbortController`), disposes geometries, materials and `material.map`, then `renderer.dispose()`, `forceContextLoss()`, `canvas.remove()`: no leak after normal unmount.
- Only named imports (tree-shaking); no API newer than 0.128.
- The WebGL probe context is released. Fallback chain: no WebGL / reduced motion / small screen -> `CorridorFallback`; construction failure -> `onError` -> `sceneFailed`. Canvas is `aria-hidden`; poster list stays in `sr-only`.
- `rooms` memoized by key (a refetch does not rebuild the scene); callbacks through refs; `dt` clamped, glow uses lerp.

**ESLint boundaries**
- `shared` cannot import `features`/`app`; a feature cannot import `app`; other features only through `index.js`; `app` only imports a feature's `index.js`. No violation found by grep.

**Vite, Docker, nginx**
- Vite alias `@` matches `jsconfig.json`; `/api` proxy target from `VITE_API_PROXY_TARGET`; polling via `VITE_USE_POLLING`; Vitest configured.
- `nginx.conf` has the SPA fallback and a correct `/api/` proxy. Dockerfile is a clean multi-stage build; `.dockerignore` excludes `node_modules`, `dist`, `.git`.

## Suggested order

S1-S2-S3-S5 as one small admin-rooms ticket (i18n + tokens + shared/ui). Then S6, S7, S8 (corridor), then S15 and S17 (nginx and bundle).
