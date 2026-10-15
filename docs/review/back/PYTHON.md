# Revisión de Python (`back/app` y `back/tests`)

Agente: `python-reviewer`. Solo lectura. Se revisó el código completo, no un diff.

**Verificado:** `ruff check .` pasa sin errores y `pytest` da 375 tests en verde (`CLAUDE.md` dice 252: está desactualizado).

**Veredicto del agente: BLOCK**, por el bloqueante 1, que tiene prueba reproducible.

## 🔴 Bloqueantes

**1. Se puede reservar un slot que ya pasó** · `back/app/controllers/booking.py:115-175` (`create_booking`)
- Qué pasa: `create_booking` comprueba sala activa, slot `available` y que no esté ocupado, pero nunca que el slot empiece en el futuro.
- Prueba: se creó un slot de hace 3 días y `POST /api/v1/bookings` respondió `201 PENDING`.
- Por qué importa: BR-S2 solo impide *crear* slots en el pasado. Un slot pasado sigue con `status="available"`, así que es reservable para siempre. Un cliente puede reservar partidas ya jugadas y eso ensucia las estadísticas y los ingresos.
- Arreglo:
  - En `create_booking`, antes de `already_booked`: `if _slot_start_utc(slot) <= _utcnow(): raise AppError(..., code="SLOT_NOT_AVAILABLE", status_code=409)`.
  - Mejor: extraer las comprobaciones comunes (ver Menores, duplicación) para que `update_booking` y `create_booking` compartan la regla.
  - Añadir un test: hoy no hay ninguno (`grep past` en `test_bookings.py` no devuelve nada).

## 🟠 Importantes

**2. Los errores 422 y 404 no siguen el formato BR-X1** · `back/app/main.py:40-83`
- Qué pasa: hay handlers para `AppError`, 401 y `Exception`, pero no para `RequestValidationError`.
- Prueba: un body inválido devuelve `{"detail":[{"type":"int_parsing",...}]}` sin `code`; una ruta inexistente devuelve `{"detail":"Not Found"}`.
- Por qué importa: `API_CONTRACT.md` promete `{"detail","code"}` en todos los errores, con `VALIDATION_ERROR` para los 422, y el front mapea mensajes por `code`.
- Arreglo: `@app.exception_handler(RequestValidationError)` con `code="VALIDATION_ERROR"` y un `detail` legible; que el handler de `HTTPException` añada `code` también para 404 y 405; un test del formato.

**3. Un admin puede quitarse el rol o desactivarse, y dejar el sistema sin admins** · `back/app/controllers/user.py:78-111`
- Prueba: un admin hizo `PUT /users/{su_id}/role` con `client` y recibió `200`.
- Por qué importa: sin admins nadie puede gestionar salas ni roles. Solo se arregla tocando la base de datos o con `ADMIN_EMAILS`, que solo se usa en el *primer* login.
- Arreglo: pasar `current_user` a `update_user_role` y `deactivate_user`; 409 si `user_id == current_user.id` y se pierde el rol admin, o si es el último admin activo. Con tests.

**4. Los usuarios creados por `POST /users` nunca podrán iniciar sesión** · `back/app/dependencies/auth.py:93-102` y `back/app/controllers/user.py:10-35`
- Qué pasa: `create_user` guarda el usuario sin `auth_id`. En su primer login con Google, `get_current_user` no encuentra ese `auth_id`, encuentra el email ya existente y lanza `409 DUPLICATE`, siempre. (Deducido leyendo el código, no ejecutado.)
- Por qué importa: es un callejón sin salida. Afecta al endpoint de admin y a cualquier fila sembrada sin `auth_id`.
- Arreglo (decisión de equipo, BR-A2): si el email del JWT está verificado y la fila existente tiene `auth_id IS NULL`, vincularla; o dejar de ofrecer `POST /users` si crea cuentas inutilizables.

**5. Lógica de consulta dentro de una ruta** · `back/app/routes/time_slot.py:52-93`
- Qué pasa: `list_time_slots` construye el SQL a mano (`select`, `selectinload`, filtro de fechas y el `EXISTS` de BR-S5); `get_time_slot` busca en la BD y lanza `AppError`; la ruta importa `models`.
- Por qué importa: `ARCHI.md` dice que las rutas solo hacen HTTP. Además la regla `is_bookable` queda escrita dos veces (modelo y SQL de la ruta): si cambia una, la otra se desfasa.
- Arreglo: mover el bloque a `controllers/time_slot.py` (`list_time_slots(db, params, room_id, date, available)` y `get_time_slot`).

**6. Consultas N+1 al calcular `has_upcoming_slots`** · `back/app/models/room.py:112-124`, usado por `RoomResponse` en `controllers/room.py:208-212`
- Qué pasa: la propiedad itera `self.time_slots` (relación *lazy*). Listar 100 salas lanza 100 consultas extra, y cada una carga todos los slots, incluido el histórico. (Deducido, no medido.)
- Por qué importa: con generación masiva de 90 días cada sala acumula cientos de slots y el listado público del pasillo 3D se vuelve lento.
- Arreglo: `selectinload(Room.time_slots)` en `list_rooms`, o mejor un `EXISTS` en SQL calculado una sola vez.

**7. Solapes de slots solo se comprueban en Python (carrera en Postgres)** · `back/app/controllers/time_slot.py:37-59` y `controllers/room.py:300-347`
- Qué pasa: "consulto si hay solape y luego inserto". Dos peticiones simultáneas pueden crear slots solapados; con SQLite en tests no se ve.
- Por qué importa: BR-S3 queda sin garantía en la base de datos, mientras que las reservas sí tienen índice único (BR-B8).
- Arreglo: en Postgres, `EXCLUDE USING gist (room_id WITH =, tstzrange(starts_at, ends_at) WITH &&)` en una migración, y capturar el `IntegrityError` como en reservas. Si el equipo lo considera demasiado, documentar el límite conocido.

## 🟡 Menores

- **Redirección 307 en la lista de slots** (`routes/time_slot.py:24,37,97`): las rutas usan `"/"` con prefijo, y `GET /api/v1/time-slots` (la URL del contrato) devuelve `307 → http://testserver/api/v1/time-slots/`. Detrás de Nginx el redirect puede salir con un host interno. Arreglo: path `""` y prefijo en `main.py`, como las demás.
- **Código de error incorrecto** (`controllers/time_slot.py:81,140`): editar o borrar un slot con reserva activa devuelve `SLOT_OVERLAP`; debería ser `SLOT_TAKEN`, que sí está en el contrato.
- **Código de error fuera del contrato** (`controllers/room.py:196`): `deactivate_room` usa `code="CONFLICT"`. Cambiarlo o añadirlo al contrato.
- **Helpers duplicados:** `as_utc` está 4 veces (`core/datetimes.py:4`, `controllers/room.py:29`, `controllers/time_slot.py:14`, `controllers/booking.py:28`) y `ACTIVE_STATUSES` se repite en `controllers/room.py:18` aunque ya existe en `models/booking.py:19`. Usar siempre los de `core/` y `models/`.
- **Bloque duplicado** (`controllers/booking.py:63-89` y `133-150`): las comprobaciones de sala activa, slot `available` y slot ocupado están copiadas entre `_ensure_slot_can_receive_booking` y `create_booking`, y ya divergieron (una tiene la regla de 24 h y la otra nada): de ahí sale el bloqueante 1.
- **Código sin formatear** (`controllers/time_slot.py`, `models/user.py:43`, `schemas/user.py:37`): `ruff format --check back` marca 3 archivos; `time_slot.py` tiene líneas muy largas (`E501` no está activo). Cuidado con la regla del `CLAUDE.md`: formatear solo tus archivos, no el repo entero.
- **Capas, dependencias cruzadas:** `core/pagination.py` importa `fastapi.Query` y los controladores lo usan, así que dependen de FastAPI de forma indirecta (contra `ARCHI.md`); `models/booking.py:31` importa `AppError` (`ensure_transition` es lógica de negocio dentro de un modelo).
- **Fallos de JWKS invisibles** (`core/security.py:12-24`, `dependencies/auth.py:42-45`): si Supabase no responde, `PyJWKClientConnectionError` es un `PyJWTError` y todos reciben "Invalid or expired token" con 401 y sin log (`from None`). Arreglo: `logger.warning` con la causa y valorar 503 para errores de red.
- **Documentación desfasada:** `STACK.md` lista `SUPABASE_JWT_SECRET` pero el código valida con JWKS y `ES256` fijo (un proyecto Supabase con HS256 heredado daría 401 en todo); `ADMIN_EMAILS` (leído en `settings.py:8`) no aparece en `STACK.md`; `CLAUDE.md` dice 252 tests y hay 375.
- **Nombres inconsistentes:** `create_time_slot_controller` / `update_time_slot_controller` frente a `create_room`, `create_user`; `SessionDep` y `ADMIN_ERRORS` están redefinidos en 3 archivos de rutas.
- **Tests:**
  - `tests/test_main.py:20,45` registran rutas en la `app` global (`@app.get("/test-app-error")`); quedan en el Swagger y afectan a otros tests. Usar una `FastAPI()` local.
  - Todos los tests usan SQLite en memoria, que no cubre cosas de Postgres como la detección de unicidad por nombre de constraint (`_is_unique_violation`, `controllers/room.py:36-45`) ni las zonas horarias.
  - Faltan tests para los importantes 2, 3 y 4.

## 🟢 Correcto

- `ruff check` limpio y 375 tests en verde.
- **Doble reserva:** índice único parcial `uq_bookings_active_time_slot` (BR-B8) más captura de `IntegrityError` al crear y al cambiar de slot, con tests de la carrera con `monkeypatch`.
- **Regla de 24 h:** tests de frontera (24 h exactas permitido, 24 h menos 1 segundo rechazado) con el reloj congelado mediante `_utcnow`.
- **Autenticación:** `exp`, `sub`, `aud` e `iss` obligatorios y algoritmo comprobado; el rol viene de la BD, no del JWT; no se vincula un email existente a otra identidad automáticamente; se maneja la carrera del primer login.
- **Autorización:** `require_role` y `_ensure_can_access` cubren client, staff y admin, con `test_permissions.py`.
- **Rutas fijas antes de las dinámicas:** `/bookings/today` y `/users/me` van antes de `/{id}`.
- **Dinero:** `Decimal`/`Numeric(10,2)`, nunca `float`.
- **Fechas:** UTC con zona horaria (BR-X5), con helper para los datetimes naive de SQLite.
- **Paginación:** reutilizable, con validación `ge`/`le` y el `ORDER BY` fuera del `COUNT`.
- **Errores inesperados:** el handler genérico registra la traza y no filtra detalles; hay middleware de log de peticiones (BR-X3).
- **Sesión de BD:** `get_db` cierra siempre la sesión.
- **BR-R7 y BR-S8:** validaciones coherentes con constraints `CHECK` en el modelo.
- **Generación masiva de slots:** evita el bucle infinito al cruzar medianoche trabajando con `datetime` completos y carga los slots existentes una sola vez.

## No verificado

- No se leyó `.env.example` (permiso denegado).
- No se probó nada contra PostgreSQL real.
- Los importantes 4, 6 y 7 salen de leer el código, no de ejecutarlo.
- No se revisó `alembic/` ni `front/` (la capa de datos la cubre `BASE_DE_DATOS.md`).

## Nota de limpieza

El agente dejó un script de prueba, `/tmp/probe.py`, dentro del contenedor `api` (el hook de seguridad bloqueó el `rm`). Es inofensivo y desaparece al recrear el contenedor.
