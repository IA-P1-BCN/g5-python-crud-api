# Fallos silenciosos en `back/` (app y tests)

Agente: `silent-failure-hunter`. Solo lectura. Se revisaron `main.py`, `dependencies/auth.py`, `core/`, todos los `controllers/`, `routes/`, `models/`, `schemas/` y los tests (`conftest`, bookings, rooms, time_slot, users, auth, permissions, game_results, main, database).

Visión general: no hay `except: pass`, `suppress` ni tareas en segundo plano sin observar. Los problemas están en las respuestas de error, en lo que se acepta en silencio y en los tests.

## 🔴 Bloqueantes

**1. Un 422 de validación no cumple el contrato BR-X1 (no lleva `code`)**
- Dónde: `back/app/main.py:51-66`. Solo se personaliza el 401; no hay handler para `RequestValidationError`.
- Problema: un 422 de Pydantic (`players: 0`, `size=0`, email inválido) responde `{"detail":[{...}]}` sin `code`. Un 404 de ruta o un 405 responden `{"detail":"Not Found"}`, también sin `code`.
- Por qué importa: `API_CONTRACT.md` promete `{detail, code}` y el front traduce el `code` a un mensaje en español. Sin `code` muestra un error genérico o nada, y como `detail` es una lista puede romperse al leerlo.
- Los tests no lo detectan: `test_users.py:102`, `test_bookings.py:163` y `:178` solo comprueban `status_code == 422`.
- Arreglo: añadir `@app.exception_handler(RequestValidationError)` que devuelva `{"detail": "...", "code": "VALIDATION_ERROR"}`, y hacer que el handler de `HTTPException` ponga `code` para todos los status. Añadir un test que compruebe `code` en un 422 y en un 404 de ruta.

**2. Cualquier `IntegrityError` se convierte en "SLOT_TAKEN" (409)**
- Dónde: `back/app/controllers/booking.py:169-173` (crear) y `:295-299` (cambiar).
- Problema: se captura `IntegrityError` sin mirar qué restricción falló y se responde "el horario ya está reservado", sin log y sin `from exc`.
- Por qué importa: un fallo de FK, de CHECK (`players >= 1`) o de estado se presenta como "slot ocupado" y el equipo pierde horas buscando un doble booking que no existe.
- Arreglo: mirar `exc.orig` (nombre de la restricción `uq_bookings_active_time_slot`, como ya hace `_is_unique_violation` en `controllers/room.py:36`); en cualquier otro caso, `raise` para que salga como `INTERNAL_ERROR` con traza. Añadir `logger.warning` y `from exc`.
- Los tests `test_bookings.py:147` y `:562` simulan el fallo con `Exception("unique violation")` y exigen 409: fijan el comportamiento erróneo.

**3. Se puede reservar un horario que ya pasó**
- Dónde: `back/app/controllers/booking.py:133-139`. `create_booking` no comprueba que `starts_at` sea futuro; solo `update_booking` exige 24 h (`:262`, `:73`).
- Problema: un slot pasado sigue siendo `available` y sin reserva, así que el POST devuelve 201. El modelo ya lo llama `state == "past"` (`models/time_slot.py:74`) pero `create_booking` no lo usa.
- Por qué importa: se cobra por una sesión que ya ocurrió y una reserva `PENDING` en el pasado no se puede cancelar (regla de 24 h).
- Arreglo: en `create_booking`, rechazar con 409 si `slot.state != "free"` o `_slot_start_utc(slot) <= _utcnow()`. Añadir un test.

## 🟠 Importantes

**4. `PUT /time-slots/{id}` ignora los `null` y responde 200**
- Dónde: `back/app/controllers/time_slot.py:83`, `{k: v ... if v is not None}`.
- Problema: `{"status": null}` o `{}` devuelve 200 con el slot sin cambios. `rooms` sí rechaza los `null` con 422 (`controllers/room.py:133-139`).
- Por qué importa: éxito falso; el admin cree que cambió algo.
- Arreglo: copiar la lógica de `update_room` (422 con `null` o con body vacío).

**5. `PUT /users/me` y `PUT /users/{id}` borran el teléfono si no se envía**
- Dónde: `back/app/controllers/user.py:69-70`. `UserUpdate.phone` tiene `default=None` y se asigna siempre.
- Problema: con solo `{"name":"Ana"}`, `phone = NULL` sin avisar. El test `test_users.py:667` no cubre "sin phone".
- Arreglo: `model_dump(exclude_unset=True)` y aplicar solo los campos enviados, con un test que verifique que el teléfono se conserva.

**6. Un fallo de JWKS/Supabase se muestra como "token inválido"**
- Dónde: `back/app/dependencies/auth.py:44-45` y `core/security.py:13`.
- Problema: `PyJWKClientConnectionError` (Supabase caído o sin red) hereda de `PyJWTError`; se captura con `from None`, sin log, y el usuario recibe 401 "Invalid or expired token".
- Por qué importa: si Supabase falla, todos quedan "deslogueados" y nadie sabe por qué.
- Arreglo: capturar `PyJWKClientConnectionError` aparte, con `logger.error(...)` y 503. Para los demás errores JWT, un `logger.info` con el tipo de error (sin el token). Test con un `jwks_client` que lance ese error.

**7. Códigos de error equivocados que ocultan la causa**
- `controllers/time_slot.py:81` y `:140`: "slot con reserva activa" devuelve `SLOT_OVERLAP`; debería ser `SLOT_TAKEN`. Los tests `test_time_slot.py:211` lo fijan igual.
- `controllers/room.py:195`: usa `CONFLICT`, que no existe en el contrato.
- Por qué importa: el front diría "los horarios se solapan" cuando en realidad hay una reserva.
- Arreglo: corregir códigos y tests, o añadir los códigos nuevos al contrato.

**8. Los tests del doble booking nunca ejercitan el índice real (BR-B8)**
- Dónde: `test_bookings.py:147` y `:562` sustituyen `db.commit` por una función que lanza `IntegrityError`; `test_database.py:15` solo compara el texto del `where`.
- Problema: nada prueba que la base de datos rechace dos reservas activas del mismo slot. SQLite tiene `sqlite_where` en el índice (`models/booking.py:90`), así que se podría probar de verdad.
- Por qué importa: es la única barrera ante una carrera. Si alguien quita el índice, todos los tests siguen en verde.
- Arreglo: un test que inserte dos `Booking` `PENDING` del mismo slot y espere `IntegrityError`, y que con la primera `CANCELLED` el segundo sí entre.

**9. BR-S3 (sin solapes) solo se comprueba en la aplicación**
- Dónde: `controllers/time_slot.py:37-48` y `:99-111`; el modelo no tiene restricción de exclusión.
- Problema: dos peticiones simultáneas pasan la comprobación y crean slots solapados.
- Arreglo: en una migración, `EXCLUDE USING gist (room_id WITH =, tstzrange(starts_at, ends_at) WITH &&)` y capturar `IntegrityError` al crear.

**10. Reglas de negocio sin implementar o sin test**
- **Sin implementar:** BR-L3 (CSV `GET /bookings/export.csv`) y BR-L4 (`/stats/overview`). Un `grep` de `export` y `stats` en `back/` no encuentra nada, y el front tiene `admin-stats`, que llamaría a un endpoint inexistente.
- **Sin test:**
  - BR-S1: `ends_at <= starts_at` en crear y en editar.
  - BR-S2 al editar (`starts_at` en el pasado).
  - BR-S3 al editar.
  - BR-S4: estado inválido al crear (solo se prueba al editar, `:367`).
  - BR-S6: editar un slot con reserva activa (solo se prueba el borrado, `:171`).
  - BR-U2: nombre de más de 100 caracteres en `POST /users`.
  - BR-U3: rol inválido en `PUT /users/{id}/role` (422).
  - BR-R2: capacity/duration/base_price inválidos al crear (solo `capacity: 0` al actualizar, `test_room.py:99`).
  - BR-B2: el mínimo de jugadores de la sala no se aplica en la reserva (decisión D-04): hay que decidir si es regla o no.
- **Con test correcto:** BR-U1, U4, U5; R1, R3, R4, R5, R6, R7; S5, S7, S8; B1 a B8 (salvo lo dicho); G1 a G5; A1 a A4; L1, L2, L5; X1 a X3.

## 🟡 Menores

- **Filtros que se ignoran sin avisar:** `routes/room.py:86` acepta `?status=cualquier-cosa` y devuelve lista vacía (debería ser `Literal["active","inactive"]`); en `routes/time_slot.py:73`, `available=false` se trata como "sin filtro"; en `controllers/booking.py:398`, el historial de un `user_id` inexistente devuelve `[]` en vez de 404 `USER_NOT_FOUND`.
- **Sin captura de `IntegrityError`:** `create_user` (`controllers/user.py:31-33`), `create_time_slot` y `bulk_generate`. Dos peticiones a la vez con el mismo email dan 500 en lugar de 409 `DUPLICATE`.
- **Errores 4xx sin log** (`main.py:40-48`): un 409 o 403 no deja el motivo en el log, solo el status, y los logs no llevan id de usuario ni de petición. Un `logger.warning` con el `code` ayudaría.
- **`test_permissions.py:66`** acepta como correcto "cualquier cosa que no sea 401/403" para los roles permitidos; un 500 o un 422 por un bug pasa. Comprobar el status esperado en al menos un endpoint por grupo.
- **`test_time_slot.py:138`** (`test_update_time_slot_success`) solo asserta `status == "blocked"`; no comprueba que `ends_at` cambió ni que se guardó.
- **`test_main.py:20` y `:45`** registran rutas en la `app` real en tiempo de test y no las quitan; contaminan el resto de la ejecución. Mejor una `FastAPI()` aparte con los mismos handlers.
- **SQLite oculta comportamiento de Postgres:** no hace cumplir las FK por defecto; los datetimes salen sin zona horaria (de ahí `_as_utc`, `_slot_start_utc`, `_ensure_utc`); la rama de `_is_unique_violation` con `exc.orig.diag.constraint_name` (`controllers/room.py:38-45`), la de Postgres, nunca se ejecuta en tests. Arreglo: un job de CI con Postgres, o al menos `PRAGMA foreign_keys=ON` en el `conftest`.
- **Tests de auth** (`test_auth.py`) llaman a `get_current_user` directamente; el camino HTTP completo (cabecera `WWW-Authenticate`, `code=UNAUTHORIZED`) solo lo prueba `test_permissions.py:50`.

## 🟢 Correcto

- **Sin errores tragados:** un `grep` de `except`, `suppress`, `create_task` y `pass` en `app/` no encuentra nada que oculte un fallo. Los `IntegrityError` capturados en `controllers/room.py` hacen `rollback()` y re-lanzan si no son de duplicado (`:109-110`, `:162-163`).
- **Handler global de 500** (`main.py:69-83`): `logger.exception` con traza, `INTERNAL_ERROR` sin filtrar detalles; `test_main.py:44` comprueba el log con traza.
- **Registro de peticiones** (`main.py:24-37`): el `finally` registra el 500 aunque haya excepción.
- **Auth:** el registro concurrente en el primer login (`dependencies/auth.py:119-150`) hace rollback, relee y re-lanza si el error no es una de las dos colisiones conocidas, con tests de los tres escenarios (`test_auth.py:260`, `:400`, `:451`). Los tests rechazan `alg` HS256, `kid` desconocido y firma mala.
- **Transiciones de estado** (`models/booking.py:22-38`): tabla única, con tests de permitidas y prohibidas.
- **Regla de 24 h** probada en el límite exacto (`test_bookings.py:325` y `:335`, reloj congelado).
- **Resultado de partida:** el duplicado se controla con comprobación y restricción unique (`controllers/booking.py:373-385`), con test de 409 `DUPLICATE`.
- **Permisos:** `test_permissions.py` recorre cada endpoint protegido con 401 y con cada rol, y comprueba el `code`.
- **Paginación:** `Query(ge, le)` da 422 por sí sola, con tests; `total` cuenta las filas filtradas.
- **`.get(x, default)`:** los usos en `controllers/room.py:146-147` son legítimos; ningún `or []` esconde un fallo.

## Orden de arreglo sugerido

1. Handler de validación con `code` (punto 1).
2. `IntegrityError` específico y rechazo de slots pasados (puntos 2 y 3).
3. Teléfono y `null` en updates (puntos 4 y 5).
4. Los tests que faltan (puntos 8 y 10).
