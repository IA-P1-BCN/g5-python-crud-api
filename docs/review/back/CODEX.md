# Segunda opinión de Codex: seguridad y autorización

Agente: Codex (OpenAI), en solo lectura. Revisión estática de rutas, controladores, modelos, migraciones, JWT y pruebas. No ejecutó tests ni se conectó a Supabase o PostgreSQL. No modificó ningún archivo.

## 🔴 Bloqueantes

Ninguno confirmado. Un cliente anónimo no puede falsificar un JWT, y un cliente o un miembro de staff no puede cambiar roles.

## 🟠 Importantes

**1. Un cliente puede crear una reserva para un slot ya pasado**
- Dónde: `back/app/controllers/booking.py:122-175`.
- Escenario: un cliente autenticado envía `POST /api/v1/bookings` con el ID de un slot que empezó ayer o esta mañana y cuyo estado sigue en `available`. Si no tiene reserva activa, la API crea la reserva como `PENDING`.
- Por qué importa: aparecen reservas históricas inválidas. En un slot pasado del mismo día, un miembro de staff podría iniciarla y completarla, contaminando resultados e informes.
- Arreglo: rechazar la creación cuando `slot.starts_at <= _utcnow()`. Lo ideal es una sola comprobación de "slot reservable" (futuro, sala activa, estado disponible, sin reserva activa).

**2. Una carrera entre cancelar y confirmar, iniciar o finalizar puede saltarse la máquina de estados**
- Dónde: `back/app/controllers/booking.py:304-318`, `322-329`, `333-348`, `351-359`.
- Escenario: un cliente y un miembro de staff actúan a la vez sobre una reserva `PENDING`. Ambos leen `PENDING`; el cliente cancela y el staff confirma. El último `commit` puede sobrescribir el estado y dejar una reserva cancelada como `CONFIRMED`.
- Por qué importa: BR-B6 y BR-G2 dejan de ser fiables bajo concurrencia; puede haber partidas o cobros sobre reservas canceladas.
- Arreglo: `SELECT ... FOR UPDATE` antes de validar y cambiar de estado, o un `UPDATE` condicionado al estado esperado comprobando que se actualizó exactamente una fila. Aplicarlo a todas las transiciones.

**3. Las salas y los slots inactivos se exponen públicamente**
- Dónde: `back/app/controllers/room.py:208-231`; `back/app/routes/time_slot.py:64-80`, `89-93`.
- Escenario: cualquier persona, sin token, llama a `GET /api/v1/rooms?status=inactive` o a `GET /api/v1/rooms/{id-inactivo}`, y puede listar o consultar slots de una sala inactiva.
- Por qué importa: contradice BR-R4 (las salas inactivas se ocultan a los clientes). Puede revelar catálogo retirado, textos internos y horarios.
- Arreglo: en los endpoints públicos forzar `Room.status == "active"` y filtrar los slots por sala activa. La vista de inactivos debe ir en un endpoint de administración protegido.

**4. El bootstrap del primer admin no exige un email verificado (hipótesis)**
- Dónde: `back/app/dependencies/auth.py:65-117`.
- Escenario: si la configuración de Supabase permite obtener un access token antes de confirmar el correo, alguien registra `admin@empresa.com`, recibe un JWT válido y su primer acceso le asigna `role="admin"` por coincidir con `ADMIN_EMAILS`.
- Por qué importa: una simple coincidencia de correo da privilegios máximos.
- Arreglo: exigir y validar el claim de correo verificado que use el proveedor configurado, restringir en Supabase los proveedores y flujos permitidos, y mantener `ADMIN_EMAILS` en secretos.
- Nota: depende de la configuración real de Supabase. El código sí valida firma, `iss`, `aud`, `exp` y `sub`.

**5. La exportación CSV no existe, así que no hay protección ni test contra inyección CSV**
- Dónde: `back/app/routes/booking.py:1-270`; contrato en `docs/API_CONTRACT.md:75`.
- Escenario: `GET /api/v1/bookings/export.csv` no está registrado; FastAPI lo interpreta como `/{booking_id}` y responde 422. BR-L3 queda sin cumplir.
- Por qué importa: hoy no hay superficie de inyección CSV, pero si se implementa sin sanitizar, una celda que empiece por `=`, `+`, `-` o `@` (por ejemplo `=HYPERLINK(...)`) se ejecutaría como fórmula en Excel.
- Arreglo: crear una ruta solo para admin, reutilizar los filtros autorizados y neutralizar esos prefijos en cada celda controlada por usuarios.

## 🟡 Menores

1. **El límite de 24 horas tiene una ventana TOCTOU** (comprobar y usar en momentos distintos). `back/app/controllers/booking.py:262-267`, `309-314`. Una cancelación o modificación pasa la comprobación con 24 horas exactas, espera una transacción concurrente y hace `commit` cuando ya cruzó el límite. Raro. Arreglo: bloquear la fila y reevaluar el límite justo antes de persistir, o actualización condicional en SQL.
2. **Dos administradores pueden crear slots solapados a la vez.** `back/app/controllers/time_slot.py:37-58`, `98-121`; `back/app/models/time_slot.py:38-47`. Se rompe BR-S3 y se podrían vender dos sesiones simultáneas de la misma sala. Arreglo: exclusion constraint en PostgreSQL por `room_id` y rango temporal, conservando la validación de aplicación para dar un error legible.
3. **Se pueden enumerar reservas ajenas por la diferencia entre 404 y 403.** `back/app/controllers/booking.py:40-44`, `92-99`, `244-247`, `250-254`, `304-306`. Probando IDs consecutivos, una reserva inexistente da 404 y la de otra persona 403. Revela volumen y existencia, no detalles. Arreglo: para clientes, buscar la reserva ya acotada a su usuario, o devolver siempre 404 si no es suya.
4. **El formato de error no es uniforme fuera de `AppError` y 401.** `back/app/main.py:52-67`. Los errores de validación y otros `HTTPException` conservan el formato de FastAPI, distinto del `{"detail","code"}` de BR-X1. Arreglo: normalizar `RequestValidationError` y los `HTTPException` que no sean 401, sin detalles internos.

## 🟢 Correcto

- La validación JWT usa la JWK del emisor configurado, fija `ES256`, el `issuer` y la audiencia `authenticated`, y exige `exp`, `sub`, `aud` e `iss` (`back/app/core/security.py:12-25`).
- Una identidad nueva no se asocia automáticamente a un usuario existente por email, lo que evita el robo de cuentas preexistentes (`back/app/dependencies/auth.py:91-108`).
- El rol se lee de la tabla local, no del JWT, y los usuarios desactivados no pueden autenticarse (`back/app/dependencies/auth.py:55-63`, `155-169`).
- El cambio de rol es solo para admin (`back/app/routes/user.py:170-190`); los tests cubren a un cliente y a un staff intentando subirse el rol.
- No se encontró IDOR de lectura, modificación ni cancelación de reservas: los clientes quedan limitados a las suyas en lista, detalle, edición y cancelación (`back/app/controllers/booking.py:92-112`, `118-121`, `244-254`, `304-306`).
- El historial aplica bien "propio para cliente, cualquiera para staff/admin" (`back/app/controllers/booking.py:390-400`).
- Las rutas administrativas de usuarios, salas y slots llevan `require_role("admin")`; las operaciones de staff usan `require_role("staff", "admin")`.
- La doble reserva concurrente del mismo slot está cubierta en PostgreSQL por el índice parcial único, y el `IntegrityError` se convierte en 409 (`back/app/models/booking.py:75-91`, `back/app/controllers/booking.py:141-175`).
- La regla de 24 horas usa `>= 24h`, así que exactamente 24 horas es válido, como indican los tests.

## Por confirmar en el entorno real

- La política de verificación de email de Supabase (hallazgo 4).
- Que las migraciones estén aplicadas.
