# Revisión del back

Rama `docs/review-back`, código de `develop` (15 de octubre de 2026). Alcance: solo `back/` (FastAPI, SQLAlchemy, Alembic, tests). El front queda fuera.

Contenido: 1. Plan · 2. Cómo se leen los informes · 3. Resumen de hallazgos · 4. Índice de informes.

## 1. Plan: qué hicimos y por qué

Los tickets del back están terminados. Antes de seguir queríamos saber si falta algo o si hay errores, con revisiones independientes por especialidad, y dejar documentado cómo funciona el sistema para el resto del equipo.

| Agente | Por qué | Informe |
|---|---|---|
| `python-reviewer` | Estilo Python, type hints, manejo de errores, calidad de los tests pytest | `PYTHON.md` |
| `fastapi-reviewer` | Rutas, esquemas Pydantic, formato de error BR-X1, códigos HTTP, cumplimiento de `API_CONTRACT.md` | `FASTAPI.md` |
| `security-reviewer` | JWT, `require_role`, matriz de permisos, inyección SQL, secretos | `SEGURIDAD.md` |
| `database-reviewer` | Modelos SQLAlchemy, migraciones Alembic, índice único parcial (BR-B8) | `BASE_DE_DATOS.md` |
| `silent-failure-hunter` | Excepciones tragadas, tests que nunca pueden fallar | `FALLOS_SILENCIOSOS.md` |
| Codex (solo lectura) | Segunda opinión independiente, con otro modelo, sobre seguridad y autenticación | `CODEX.md` |
| `code-explorer` | Documentar el flujo real y las funcionalidades, con diagramas | `FLUJOS.md` |

No se usó `react-reviewer` (el front está fuera de alcance) ni `docs-freshness` (ya se hizo).

## 2. Cómo se leen los informes

- 🔴 **Bloqueante**: hay que corregirlo sí o sí antes de entregar.
- 🟠 **Importante**: debería corregirse pronto.
- 🟡 **Menor**: mejora recomendable, no urgente.
- 🟢 **Correcto**: lo que está bien hecho.

Los informes proponen la corrección pero **no tocan el código**. Arreglar es un paso aparte, con tickets y PR.

## 3. Resumen de hallazgos

Estado de las pruebas durante la revisión: `pytest` 375 en verde y `ruff check` limpio. Los informes se centran en lo que los tests no cubren.

### Qué hay que arreglar primero

Ningún agente encontró una fuga de datos entre usuarios ni una forma directa de subirse de rol. Pero tres problemas los señalaron varios agentes a la vez, así que son los más seguros de confirmar:

| # | Problema | Quién lo vio | Dónde |
|---|---|---|---|
| 🔴 1 | **Se puede reservar un slot que ya pasó.** `create_booking` no comprueba que el slot sea futuro. Reproducido: `201 PENDING` sobre un slot de hace 3 días. | python, fastapi, fallos silenciosos, base de datos, seguridad, Codex | `back/app/controllers/booking.py:115-175` |
| 🔴 2 | **Los errores 422 y 404 no llevan `code`.** No cumplen BR-X1 y el front, que traduce por `code`, no sabe qué mostrar. Reproducido con `curl`. | python, fastapi, fallos silenciosos, seguridad, Codex | `back/app/main.py:40-83` |
| 🔴 3 | **Un usuario creado con `POST /users` nunca podrá iniciar sesión.** En su primer login con Google recibe siempre 409 `DUPLICATE`. | fastapi, python, seguridad | `back/app/dependencies/auth.py:93-102` |
| 🔴 4 | **Cualquier `IntegrityError` se presenta como `SLOT_TAKEN`.** Un fallo de FK o CHECK se disfraza de "horario ocupado". | fallos silenciosos | `back/app/controllers/booking.py:169-173`, `:295-299` |

Los hallazgos 1 a 3 aparecen clasificados como bloqueantes en al menos un informe. Los demás agentes los pusieron como 🟠 importantes: la severidad exacta es una decisión del equipo.

### Importantes (🟠), por tema

- **Seguridad:**
  - `ADMIN_EMAILS` no exige email verificado: se vuelve explotable si Supabase permite registro con email sin confirmar. Hay que revisar el panel de Supabase.
  - Un cliente puede reservar todos los slots (no hay límite por usuario).
  - Las salas inactivas se ven públicamente (BR-R4).
  - Un admin puede quitarse el rol y dejar el sistema sin admins.
- **Datos y concurrencia (solo se ve con PostgreSQL, no con los tests en SQLite):**
  - Faltan índices en `bookings.user_id`, `bookings.time_slot_id` y `time_slots(room_id, starts_at)`.
  - Los cambios de estado de una reserva no bloquean la fila (cancelar y confirmar a la vez).
  - Los solapes de slots (BR-S3) solo se comprueban en Python.
  - Borrar un slot con reservas canceladas puede dar 500.
  - Falta el CHECK de `users.role`.
- **Rendimiento:** `has_upcoming_slots` hace una consulta por sala en `GET /rooms` (N+1).
- **Contrato:** faltan `GET /bookings/export.csv` y `GET /stats/overview` (BR-L3, BR-L4); `/api/v1/time-slots` responde 307 en lugar de servir directo; `PUT /users/me` borra el teléfono si no se envía.
- **Tests:** ningún test ejercita de verdad el índice anti doble reserva (BR-B8); hay reglas sin test (BR-S1, S2, S3 y S6 al editar, BR-U2, BR-U3, BR-R2).

## 4. Informes

| Archivo | Agente | Tema |
|---|---|---|
| [`PYTHON.md`](PYTHON.md) | `python-reviewer` | Idiomas, estructura, tests |
| [`FASTAPI.md`](FASTAPI.md) | `fastapi-reviewer` | Rutas, contrato, errores, reglas de negocio |
| [`SEGURIDAD.md`](SEGURIDAD.md) | `security-reviewer` | JWT, roles, permisos, configuración |
| [`BASE_DE_DATOS.md`](BASE_DE_DATOS.md) | `database-reviewer` | Modelos, migraciones, índices, concurrencia |
| [`FALLOS_SILENCIOSOS.md`](FALLOS_SILENCIOSOS.md) | `silent-failure-hunter` | Errores tragados, tests que no pueden fallar, reglas sin test |
| [`CODEX.md`](CODEX.md) | Codex | Segunda opinión de seguridad |
| [`FLUJOS.md`](FLUJOS.md) | `code-explorer` | Flujos y funcionalidades con diagramas |

## Nota

Varios agentes coinciden en los mismos hallazgos, lo cual es buena señal, pero conviene verificar cada 🔴 antes de crear el ticket. Los informes proponen arreglos pero no modifican código: arreglar es un paso aparte, con su ticket y su PR.
