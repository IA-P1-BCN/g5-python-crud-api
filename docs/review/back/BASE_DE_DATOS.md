# Revisión de la capa de datos

Agente: `database-reviewer`. Rama revisada: `docs/review-back` (mismo código que `develop`). No se modificó nada.

La migración tiene una sola cabeza: `alembic heads` y `alembic current` dan `0bcfcbd7da99`. La cadena es lineal: `11f302616e11 → 2a3b4c5d6e7f → bf04056e1973 → 3b4c5d6e7f80 → 4c5d6e7f8091 → 0bcfcbd7da99`.

## 🔴 Bloqueantes

No se encontró ningún bloqueante demostrado. El doble booking (BR-B8) está protegido por la base de datos. Lo más grave está en la sección 🟠.

## 🟠 Importantes

**1. Sin índices en claves foráneas ni en columnas de filtro**
- Dónde: `back/app/models/booking.py:51-58`, `back/app/models/time_slot.py:20-31`, `back/app/models/room.py:42`. Ninguna migración crea un índice normal.
- Problema: PostgreSQL no indexa las FK solas.
  - Faltan `bookings.user_id` (filtro de "mis reservas") y `bookings.time_slot_id` para todos los estados.
  - El único índice sobre `time_slot_id` es el parcial, que solo cubre PENDING, CONFIRMED e IN_PROGRESS.
  - Faltan `time_slots(room_id, starts_at)`, usado en el listado, el tablero del día, la comprobación de solapes, la generación en bloque y `deactivate_room`.
  - Falta `rooms.status`.
- Por qué importa: hoy con pocas filas no se nota. Con miles de reservas y slots, cada consulta recorre la tabla entera ("seq scan"), y `selectinload(TimeSlot.bookings)` también. No se pudo medir (ver "No verificado").
- Arreglo: una migración nueva con `Index("ix_bookings_user_id", "user_id")`, `Index("ix_bookings_time_slot_id", "time_slot_id")` e `Index("ix_time_slots_room_starts", "room_id", "starts_at")`. Primero la columna con igualdad (`room_id`), después la de rango (`starts_at`).

**2. N+1 en el listado de salas**
- Dónde: `back/app/models/room.py:112-123` (`has_upcoming_slots`), usado en `schemas/room.py:74`, junto con `controllers/room.py:~209` (`list_rooms`).
- Problema: `GET /rooms` hace 1 consulta para las salas y, por cada sala, otra para `room.time_slots`. Con la página por defecto son 21 consultas. Además carga todos los slots históricos solo para saber si existe uno futuro.
- Por qué importa: es la pantalla principal (el pasillo 3D) y cada slot nuevo la hace más lenta.
- Arreglo: calcular el dato en SQL con `EXISTS(select 1 from time_slots where room_id = rooms.id and status='available' and starts_at > now())`. Alternativa: `selectinload(Room.time_slots)` en `list_rooms` (2 consultas, pero sigue trayendo todos los slots).

**3. Los solapes de slots (BR-S3) solo se comprueban en Python**
- Dónde: `controllers/time_slot.py:37-48` y `:99-111`, y `controllers/room.py:~181-222` (generación en bloque).
- Problema: es "leer y luego insertar" sin bloqueo ni restricción. Dos peticiones simultáneas (dos admins, o un doble clic en "generar") pasan el chequeo a la vez y crean slots solapados o duplicados.
- Por qué importa: es la misma clase de fallo que el doble booking, pero aquí no hay red de seguridad en la base de datos.
- Arreglo: en PostgreSQL, una restricción de exclusión (necesita `CREATE EXTENSION btree_gist`):
  `EXCLUDE USING gist (room_id WITH =, tstzrange(starts_at, ends_at) WITH &&)`.
  SQLite no la soporta: crearla solo para el dialecto `postgresql` y capturar el `IntegrityError` para devolver 409 `SLOT_OVERLAP`.

**4. Borrar un slot que tuvo reservas canceladas o completadas puede dar 500**
- Dónde: `controllers/time_slot.py:125-143` y `models/time_slot.py:52-54` (relación `bookings` sin `cascade`).
- Problema: solo se comprueba que no haya reservas activas. Si el slot tiene una reserva CANCELLED o COMPLETED, `db.delete(slot)` hace que SQLAlchemy intente poner `time_slot_id = NULL` en esa reserva, lo que viola el `NOT NULL` y lanza un `IntegrityError` que nadie captura. (Deducido leyendo el código, no ejecutado.)
- Por qué importa: el admin no puede borrar un slot cancelado y recibe un 500 en lugar de un 409 claro.
- Arreglo: capturar `IntegrityError` y devolver 409. Definir la política con `ondelete="RESTRICT"` explícito en las FK.

**5. Se puede reservar un slot pasado, y un slot COMPLETED vuelve a quedar libre**
- Dónde: `controllers/booking.py:115-175` (`create_booking`) y `models/booking.py:19` (`ACTIVE_STATUSES`).
- Problema: `create_booking` no comprueba que el slot sea futuro (`update_booking` sí). El índice parcial solo cuenta PENDING, CONFIRMED e IN_PROGRESS, así que al pasar a COMPLETED el slot queda "libre" y se puede reservar otra vez.
- Por qué importa: por la API se puede reservar una partida ya jugada, y el historial y las estadísticas se contaminan. El front lo oculta con `state="past"`, pero la API es la autoridad.
- Arreglo: en `create_booking`, rechazar si `slot.ends_at <= now`. Conviene validarlo con el equipo, porque BR-S5 no menciona "pasado".

**6. Falta el CHECK sobre `users.role` (BR-U3)**
- Dónde: `models/user.py:25-29` y migración `11f302616e11` (tabla `users`).
- Problema: las demás columnas con valores fijos tienen CHECK, pero `role` no. Solo lo protege Pydantic.
- Por qué importa: un valor como `"superadmin"` insertado por script o SQL manual se aceptaría en silencio.
- Arreglo: migración con `CheckConstraint("role IN ('client','staff','admin')", name="ck_users_role")` y el mismo CHECK en el modelo.

**7. Cambios de estado sin bloqueo (carreras)**
- Dónde: `controllers/booking.py:304-359` (`cancel`, `confirm`, `start`, `finish`) y `:250-301` (`update`).
- Problema: cada función lee la reserva, comprueba el estado y escribe sin `SELECT … FOR UPDATE`. Si dos peticiones llegan a la vez (cancelar y empezar), gana la última. Caso concreto: una reserva cancelada cuyo slot se vuelve a reservar mientras otro proceso la pasa a IN_PROGRESS choca con el índice único; como `cancel`, `confirm`, `start` y `finish` no capturan `IntegrityError`, el resultado es un 500.
- Arreglo: `db.get(Booking, id, with_for_update=True)` (o `UPDATE … WHERE id=:id AND status=:old` y comprobar `rowcount`). SQLite lo ignora, así que los tests no lo ven.

## 🟡 Menores

**8. Las FK no declaran `ON DELETE`** (`models/booking.py:51`, `models/time_slot.py:20`, `models/game_result.py:18`). Usan NO ACTION, que en la práctica es RESTRICT pero implícito. Arreglo: `ondelete="RESTRICT"` explícito (junto con el punto 4).

**9. `downgrade()` de los estados puede fallar o perder datos** (`20261013_allow_completed_status.py:30`, `20261013_allow_in_progress_status.py:30`). Convierte COMPLETED en IN_PROGRESS y IN_PROGRESS en CONFIRMED (el histórico se pierde) y, si un slot COMPLETED se volvió a reservar (punto 5), el UPDATE viola `uq_bookings_active_time_slot` y el downgrade falla a mitad. Arreglo: avisarlo en el docstring, o lanzar `NotImplementedError` con la explicación.

**10. Cabecera de migración incoherente** (`bf04056e1973_add_auth_id_to_users.py:4`). El docstring dice "Revises: 11f302616e11" pero `down_revision` es `2a3b4c5d6e7f`. El código es correcto; corregir el comentario.

**11. Desajuste de nombres entre modelo y migración** (`models/user.py:20`, `models/game_result.py:18` frente a `uq_users_auth_id` en `bf04056e1973`). `Base` no tiene `naming_convention`, así que el autogenerate puede proponer renombrar o recrear restricciones. Arreglo: `naming_convention` en `Base.metadata` o nombres explícitos. No se pudo confirmar con `alembic check`.

**12. Emails sensibles a mayúsculas** (`users.email`, `controllers/user.py:11-18`, `dependencies/auth.py`). `create_user` pasa a minúsculas, pero el UNIQUE distingue mayúsculas; si el JWT trae otro formato puede haber duplicados. Arreglo: índice único sobre `lower(email)`. Además `create_user` no captura `IntegrityError` en una carrera y devuelve 500 en vez de 409.

**13. Engine sin `pool_pre_ping`** (`back/app/database.py:8`). Con la base compartida (Supabase) las conexiones inactivas se cierran y la primera petición después puede fallar. Arreglo: `create_engine(url, pool_pre_ping=True)`.

**14. IDs `Integer` (int4)** en `bookings` y `time_slots`: llegan a 2.100 millones de filas. Suficiente para este proyecto.

## 🟢 Correcto

- **BR-B8 (doble booking):** el índice parcial único `uq_bookings_active_time_slot` está en el modelo (`booking.py:85-91`) y en la migración inicial (`11f302616e11:73`), con los mismos tres estados. `create_booking` y `update_booking` capturan `IntegrityError`, hacen `rollback` y devuelven 409 `SLOT_TAKEN`.
- **Resultado duplicado (BR-G4):** `game_results.booking_id` es UNIQUE y `register_result` captura `IntegrityError`.
- **Primer login concurrente:** `dependencies/auth.py:121-150` gestiona la carrera con `rollback` y re-lectura.
- **Sala duplicada:** `create_room` y `update_room` convierten el choque de nombre o slug en 409.
- **Modelo contra migraciones:** los CHECK de rooms, time_slots y bookings coinciden.
- **Tipos:** `timestamptz` en todas las fechas (BR-X5), `Numeric(10,2)` para dinero, sin floats.
- **Migración de catálogo (`2a3b4c5d`):** patrón correcto (columna con `server_default`, relleno, `NOT NULL`, quitar el default), con `downgrade` simétrico.
- **Listados:** `_bookings_stmt` usa `joinedload` (sin N+1 en reservas); la generación en bloque carga los slots existentes de una vez; todos los listados usan `paginate` con `ORDER BY` estable.
- **Sesiones:** `get_db` cierra en `finally`, transacciones cortas, sin llamadas externas dentro.
- **SQL:** sin SQL crudo ni concatenación de cadenas.

## Tests con SQLite que pueden ocultar fallos de PostgreSQL

- Las carreras de los puntos 3 y 7 no se pueden probar con SQLite en memoria: `with_for_update` se ignora, no hay transacciones concurrentes y no existe `EXCLUDE`.
- SQLite devuelve datetimes sin zona horaria; por eso hay helpers `_as_utc` repetidos en cuatro sitios (`booking.py:28`, `room.py:29`, `time_slot.py:14`, `core/datetimes.py`). Conviene dejar uno solo.
- SQLite no impone FK por defecto (sin `PRAGMA foreign_keys=ON`), así que no se prueba la política de borrado del punto 4. Los tests crean las tablas con `Base.metadata.create_all`, no con Alembic: ningún test detecta una migración con errores.
- `_is_unique_violation` (`room.py:36-45`) se apoya en textos de error de SQLite y PostgreSQL; es frágil si cambia el nombre de la restricción.

## No verificado

- **Rendimiento:** no hay EXPLAIN ANALYZE. Para medir el punto 1: `EXPLAIN (ANALYZE, BUFFERS)` sobre la consulta de `GET /bookings?user_id=...` con datos realistas.
- **Migraciones:** no se ejecutó `upgrade` ni `downgrade`. `alembic heads` y `alembic current` sí funcionaron.
- **Deriva modelo-BD:** no se corrió `alembic check`; la comparación es por lectura.
- **Punto 4:** es una deducción del comportamiento de SQLAlchemy, no una ejecución.
- **Carreras:** no se probó ninguna contra PostgreSQL real.
