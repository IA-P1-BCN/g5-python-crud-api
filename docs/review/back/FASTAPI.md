# Revisión del back FastAPI

Agente: `fastapi-reviewer`. Se revisó `back/app` completo (no un diff) frente a `docs/API_CONTRACT.md` y `docs/BUSINESS_RULES.md`. Misma base de código que `develop`. Se ejecutó `pytest` (375 pasan) y `ruff check` (limpio) en Docker, y se probó la API en vivo con `curl`; los fallos 1 y 4 se reprodujeron así.

## 🔴 Bloqueantes

**1. Los errores 422 de validación y los 404/405 de ruta no usan el formato BR-X1**
- Dónde: `back/app/main.py:40-83`. Hay handlers para `AppError`, `HTTPException` (solo el 401) y `Exception`, pero ninguno para `RequestValidationError`.
- Prueba: `GET /api/v1/rooms?size=0` devuelve `{"detail":[{"type":"greater_than_equal",...}]}` sin `code`. `GET /api/v1/nope` devuelve `{"detail":"Not Found"}` sin `code`.
- Por qué importa: BR-X1 dice que todos los errores tienen la forma `{detail, code}`. El front elige el mensaje en español según `code`; con un 422 de Pydantic `detail` es una lista y no hay `code`, así que no sabe qué mostrar. `VALIDATION_ERROR` está en el contrato pero solo se emite en chequeos manuales.
- Arreglo: añadir `@app.exception_handler(RequestValidationError)` que devuelva 422 con `{"detail": "<resumen legible>", "code": "VALIDATION_ERROR"}`. Hacer que el handler de `HTTPException` devuelva siempre `code` (`NOT_FOUND` para 404, `FORBIDDEN` para 403, genérico para el resto) y usar `StarletteHTTPException` para atrapar también los 404/405 del router.

**2. Un usuario creado por el admin (`POST /users`) nunca podrá iniciar sesión**
- Dónde: `back/app/dependencies/auth.py:93-102` y `back/app/controllers/user.py:24`.
- Problema: `POST /users` crea una fila sin `auth_id`. En el primer login con Google, `get_current_user` busca por `auth_id` y no la encuentra; luego busca por email, encuentra esa fila y lanza 409 `DUPLICATE`.
- Por qué importa: esa persona queda bloqueada para siempre. BR-A2 dice que el primer login crea o enlaza la fila.
- Arreglo: si el usuario existente por email tiene `auth_id IS NULL`, enlazarlo (`user.auth_id = auth_id`, commit) y devolverlo; mantener el 409 solo si ya tiene otro `auth_id`. Alternativa: documentar que `POST /users` solo sirve para datos de prueba.

**3. Se puede reservar un slot que ya pasó**
- Dónde: `back/app/controllers/booking.py:122-157` (`create_booking`).
- Problema: comprueba sala activa, `status == available` y que no esté ocupado, pero no que el slot no haya empezado. La regla de 24 h solo existe en el cambio de slot (`_ensure_slot_can_receive_booking`).
- Por qué importa: el contrato dice que un slot `past` no es reservable. Quien llame a la API directo (Swagger, Postman) puede reservar ayer, y luego esa reserva no se puede cancelar por la regla de 24 h (BR-B6).
- Arreglo: si `slot.state in ("past", "blocked")`, lanzar 409 `SLOT_NOT_AVAILABLE`.

## 🟠 Importantes

**4. `/api/v1/time-slots` responde 307 con redirect; el contrato dice sin barra final**
- Dónde: `back/app/routes/time_slot.py:24,37,97` (`prefix="/api/v1/time-slots"` con rutas `"/"`).
- Prueba: `GET /api/v1/time-slots` devuelve 307 con `Location: http://localhost:8000/api/v1/time-slots/`.
- Por qué importa: detrás de Nginx el redirect puede apuntar al host interno (`api:8000`) y romperse en el navegador; en POST/PUT se puede perder la cabecera `Authorization`. Los tests usan la barra, así que no se ve.
- Arreglo: cambiar `"/"` por `""` en las rutas de lista y creación y mover el prefijo a `include_router(..., prefix="/api/v1/time-slots")`, como los demás routers.

**5. SQL y lógica dentro de la ruta de slots**
- Dónde: `back/app/routes/time_slot.py:61-80` (el `select`, los filtros y la subconsulta `exists`) y `:90-92` (importa `AppError` y modelos).
- Por qué importa: `ARCHI.md` dice que las rutas solo llaman al controller. Esa lógica no se puede probar sin HTTP y se duplica con `get_day_board`.
- Arreglo: crear `controller.list_time_slots(...)` y `controller.get_time_slot(...)`; la ruta se queda en 3 líneas.

**6. Código de error equivocado: `SLOT_OVERLAP` para "slot con reserva activa"**
- Dónde: `back/app/controllers/time_slot.py:81` (editar) y `:140` (borrar).
- Por qué importa: BR-S6 dice 409 cuando el slot tiene una reserva, pero no es un solapamiento; el front mostrará "los horarios se solapan".
- Arreglo: usar `SLOT_TAKEN` o añadir un código nuevo y documentarlo en `API_CONTRACT.md`.

**7. Faltan endpoints del contrato (BR-L3 y BR-L4)**
- `GET /bookings/export.csv` (admin, mismos filtros que la lista) no existe en `routes/booking.py`.
- `GET /stats/overview` (admin) no existe en ningún router.
- Ojo: al añadir `export.csv`, declararlo antes de `/{booking_id}`, o FastAPI lo leerá como un id y dará 422.

**8. `GET /rooms` es público y no oculta las salas inactivas**
- Dónde: `back/app/routes/room.py:74-88` y `back/app/controllers/room.py:208-212`.
- Problema: devuelve todas las salas (también `inactive`) salvo que se pase `?status=active`. `status` es un `str` libre: `?status=banana` devuelve lista vacía sin error.
- Por qué importa: BR-R4 y BR-R6 dicen que las salas inactivas se ocultan a los clientes; hoy depende de que el front filtre.
- Arreglo: `status: Literal["active","inactive"] | None`; si no hay token de admin o staff, forzar `active` (requiere una dependencia de usuario opcional).

**9. `has_upcoming_slots` carga todos los slots de cada sala (N+1)**
- Dónde: `back/app/models/room.py` (propiedad `has_upcoming_slots`, que recorre `self.time_slots`), usada en `RoomResponse` en cada listado.
- Por qué importa: una consulta extra por sala y trae su historial completo de slots; con 90 días de slots por sala se vuelve lento en la pantalla principal.
- Arreglo: como mínimo `selectinload(Room.time_slots)` en `list_rooms`; mejor una subconsulta `exists()` o una columna calculada.

**10. `PUT /users/{id}` y `PUT /users/me` borran el teléfono si no se envía**
- Dónde: `back/app/controllers/user.py:69-70` y `back/app/schemas/user.py:15-19`.
- Problema: `UserUpdate.name` es obligatorio y `user.phone = user_in.phone` se ejecuta siempre; con `{"name": "Ana"}`, `phone` pasa a `None`.
- Por qué importa: el front de perfil puede borrar el teléfono sin querer. Las salas sí usan `exclude_unset`; es inconsistente.
- Arreglo: campos opcionales y `model_dump(exclude_unset=True)`.

**11. Un admin puede quitarse el rol o desactivarse a sí mismo**
- Dónde: `back/app/controllers/user.py:78-111`.
- Por qué importa: si se baja el rol o se desactiva el último admin, nadie puede gestionar salas ni usuarios; solo se arregla desde la base de datos.
- Arreglo: si `user_id == current_user.id` (o es el último admin activo), lanzar 409. Hay que pasar `current_user` al controller.

## 🟡 Menores

12. **`AppError` tiene valores por defecto sin sentido** (`back/app/core/errors.py:6-7`): `code="BR-X1"` y `status_code=400` no son códigos del contrato. Hacer `code` obligatorio o usar `INTERNAL_ERROR`.
13. **Código `CONFLICT` fuera de la lista del contrato** (`back/app/controllers/room.py:197`, BR-R5). Añadirlo al contrato o usar uno propio, por ejemplo `ROOM_HAS_BOOKINGS`.
14. **Un slot con `starts_at: null` se ignora en silencio** (`back/app/controllers/time_slot.py:83`, filtro `if v is not None`). Las salas devuelven 422 con `null`; es inconsistente.
15. **Un slot de sala inactiva no se puede bloquear ni desbloquear** (`back/app/controllers/time_slot.py:67-69`). BR-R4 prohíbe crear slots nuevos en salas inactivas, no editar los existentes.
16. **Estilos mezclados en las dependencias** (`back/app/routes/booking.py` usa `Depends(get_db)` y los demás `Annotated`). Solo estilo.
17. **Un nombre de token de más de 100 caracteres da 401** (`back/app/dependencies/auth.py:88`). Un nombre largo de Google bloquea el login; mejor recortarlo a 100.
18. **Un usuario inactivo recibe 401 `UNAUTHORIZED`** (`back/app/dependencies/auth.py:59`). El contrato tiene `USER_INACTIVE` y `FORBIDDEN`; el front no distingue "token caducado" de "cuenta desactivada".
19. **Swagger incompleto en algunas rutas:** faltan respuestas 404 en `PUT /rooms/{id}/deactivate`, 404/422 en `POST /time-slots/` y 422 en `POST /rooms`; `FastAPI(...)` no tiene `description`; los routers de rooms y users declaran `tags` dos veces; el de time-slots no tiene `tags` propios.
20. **`ACTIVE_STATUSES` duplicado** (`back/app/controllers/room.py:18` y `back/app/models/booking.py:19`). Si cambia uno, el índice y la comprobación dejan de coincidir. Importar el del modelo.
21. **`IntegrityError` sin capturar** (`back/app/controllers/user.py:31-33`): dos creaciones concurrentes con el mismo email dan 500 `INTERNAL_ERROR` en vez de 409 `DUPLICATE`. Probabilidad baja.

## 🟢 Correcto

- **Orden de rutas:** `/bookings/today` antes de `/{booking_id}`; `/users/me`, `/me/history` y `/{id}/history` antes de `/{user_id}`; las rutas de salas no chocan.
- **Estados HTTP:** 201 al crear, 204 en el DELETE de slots, 200 en `generate`. Todos los endpoints del contrato existentes tienen el método y el estado correctos.
- **Paginación BR-L1:** `PageParams` con `ge=1` y `le=100`, orden estable; `/bookings/today`, los historiales y el tablero del día no se paginan, como dice el contrato.
- **Errores BR-X1** vía `AppError`, con `INTERNAL_ERROR` y log de excepciones inesperadas.
- **Roles:** `require_role` en todas las rutas de admin y staff, con 401/403 según el contrato; los clientes solo ven sus reservas e historial.
- **Salas:** `exclude_unset` y `extra="forbid"` en `RoomUpdate` (`slug` inmutable); BR-R7 validada al crear y actualizar con los valores efectivos.
- **Reservas:** transiciones BR-G2 centralizadas en `ensure_transition`; regla de 24 h con un único `_utcnow`; el índice parcial BR-B8 se convierte en `SLOT_TAKEN`; el cambio de slot entre salas recalcula el precio (BR-L5).
- **Esquemas seguros:** `UserResponse` no expone `auth_id`; `BookingDetail.user` solo muestra el nombre.
- **Sync vs async:** no hay `async def` con bloqueo; sesión de BD siempre por `Depends(get_db)`.
- **JWT:** validación de firma (ES256 por JWKS), `aud`, `iss` y `exp`.
- **Tests:** 375 pasan y `ruff` está limpio.

## Falta / no implementado

| Contrato o regla | Estado |
|---|---|
| `GET /bookings/export.csv` (admin) · BR-L3 | No existe. |
| `GET /stats/overview` (admin) · BR-L4 | No existe. |
| `RequestValidationError` con `code=VALIDATION_ERROR` · BR-X1 | Sin handler (bloqueante 1). |
| BR-A2: el primer login enlaza a un usuario ya existente por email | Solo crea; si ya existe, 409 (bloqueante 2). |
| BR-R4 y BR-R6: ocultar salas inactivas a clientes en la API | Solo lo hace el front con `?status=active`. |
| `INVALID_PLAYERS` para `players < 1` | Pydantic lo rechaza con 422 sin código (cubierto por el bloqueante 1). |
| Código propio para BR-S6 | Se usa `SLOT_OVERLAP`, que no corresponde. |

## Contrato desactualizado

`API_CONTRACT.md` dice que `GET /users/me` está "not built yet", pero ya existe. `PUT /users/me` existe en el código y no figura en el contrato.

## Riesgo residual

No se revisaron los modelos fuera de lo citado ni las migraciones (eso lo cubre `BASE_DE_DATOS.md`). Los tests usan SQLite en memoria, así que no se probó la concurrencia en Postgres real. El front no se revisó.
