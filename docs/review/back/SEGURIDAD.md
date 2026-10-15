# Revisión de seguridad del back

Agente: `security-reviewer`. Solo lectura. Se revisó `back/` completo.

**Resumen:** no hay ningún fallo bloqueante. La validación del JWT, los controles de rol y el aislamiento de las reservas de cada cliente están bien hechos. Hay dos fallos importantes: el admin por email no comprueba que el email esté verificado, y un solo cliente puede reservar todos los huecos de horario. El resto son fallos menores de configuración y robustez.

## 🔴 Bloqueantes

Ninguno. No se encontró nada explotable hoy que deje a un usuario leer o cambiar datos de otro, o subirse de rol sin condiciones previas.

## 🟠 Importantes

### 1. El admin por email (`ADMIN_EMAILS`) no comprueba que el email esté verificado
- Dónde: `back/app/dependencies/auth.py:64-72` y `:104-110`.
  ```python
  email_claim = payload.get("email")
  ...
  role = "admin" if email.lower() in admin_emails else "client"
  ```
- Ataque: `ADMIN_EMAILS=jefa@escape.com` y la jefa todavía no ha entrado nunca. Si en el proyecto Supabase está activo el login con email y contraseña sin "Confirm email", o hay otro proveedor que no verifica emails, un atacante hace `signUp("jefa@escape.com", "loquesea")`, recibe un JWT válido con `email=jefa@escape.com`, llama a cualquier endpoint (por ejemplo `GET /api/v1/users/me`) y la API le crea la cuenta con `role=admin`. Desde ahí controla usuarios, roles y salas.
- Por qué importa: la API se fía del claim `email` para dar el rol más alto, pero que un email aparezca en el token no prueba que esa persona sea la dueña del buzón; solo lo prueba si Supabase lo verificó. Hoy la seguridad depende de un ajuste del panel de Supabase que el código no controla. Es la única vía de escalada a admin que se vio.
- Arreglo: dar admin solo si el login es con Google y el email está verificado, leyendo el proveedor de `app_metadata` (que el usuario no puede editar). **No** usar `user_metadata` para decisiones de seguridad: el propio usuario lo puede modificar con `supabase.auth.updateUser({ data })`.
  ```python
  app_meta = payload.get("app_metadata") or {}
  is_trusted = app_meta.get("provider") == "google" and metadata.get("email_verified") is True
  role = "admin" if is_trusted and email in admin_emails else "client"
  ```
  Además, desactivar en Supabase los proveedores que no se usan (email/contraseña, login anónimo). Test: un token con email admin y `provider="email"` debe dar `role == "client"`.

### 2. Un solo cliente puede bloquear todos los huecos de horario
- Dónde: `back/app/controllers/booking.py:115-175` (`create_booking`).
- Ataque: un cliente con cualquier cuenta de Google ejecuta un bucle de `POST /api/v1/bookings` sobre todos los ids de `GET /time-slots?available=true`. No hay límite de reservas activas por usuario ni de peticiones. Todas las salas quedan "llenas" (en PENDING) y los clientes reales no pueden reservar. Además `create_booking` no comprueba que el hueco sea futuro, así que también acepta huecos ya pasados; esas reservas no se pueden cancelar (TOO_LATE_TO_CANCEL) y ensucian las estadísticas.
- Por qué importa: no roba datos, pero tumba el negocio con un script de 5 líneas. BR-B8 impide reservar dos veces el mismo hueco, no que una persona se quede con todos.
- Arreglo mínimo:
  - En `create_booking`, si el rol es `client`, contar sus reservas activas (`ACTIVE_STATUSES`) y devolver 409 por encima de N. La N la decide el equipo: es una regla de negocio nueva.
  - Rechazar con 409 los huecos cuyo `starts_at` sea igual o anterior a `_utcnow()` (se puede reutilizar `_slot_start_utc`).
  - Un límite de peticiones en Nginx (`limit_req`) para `/api/v1/bookings` cubre el resto.

## 🟡 Menores

| Dónde | Problema | Escenario | Arreglo |
|---|---|---|---|
| `back/app/routes/user.py:170-209` y `controllers/user.py:78-111` | El admin puede quitarse su propio rol o desactivarse, aunque sea el último admin | El único admin hace `PUT /users/{su_id}/role {"role":"client"}`. Ya no queda ningún admin y `ADMIN_EMAILS` no ayuda porque solo actúa en el primer login. Solo se arregla tocando la base de datos | En `update_user_role` y `deactivate_user`: 409 si quitaría el último admin activo |
| `back/app/core/security.py:9-13` | Un token con un `kid` inventado obliga a descargar el JWKS en cada petición | PyJWKClient vuelve a descargar las claves cuando no encuentra el `kid`. Un atacante sin cuenta envía miles de tokens falsos y cada uno es una llamada HTTP bloqueante a Supabase (hasta 30 s de timeout), y puede agotar los hilos de la API | `PyJWKClient(url, cache_keys=True, lifespan=..., timeout=5)` y límite de peticiones en Nginx |
| `back/app/controllers/room.py:208-212`, `routes/room.py:74-102` | `GET /rooms` y `GET /rooms/{slug}` son públicos y devuelven también las salas inactivas | Cualquiera ve las salas desactivadas, que según BR-R4 deben estar ocultas para los clientes. Filtra el front, no la API | Por defecto `status="active"` para quien no sea admin, o documentar que es intencionado |
| `back/app/main.py:14-17` | `/docs`, `/redoc` y `/openapi.json` están abiertos siempre | En producción, cualquiera ve el mapa completo de la API | `FastAPI(docs_url=None if prod else "/docs", ...)` con una variable de entorno |
| `docker-compose.yml:12, 31-32`; `Dockerfile:10, 18` | Configuración de desarrollo: `--reload`, Postgres publicado en el `5432` del host, contenedor como root, dependencias de dev en la imagen | En una red compartida (wifi del bootcamp), el puerto 5432 queda accesible con la contraseña del `.env` | Para producción: no publicar 5432, `USER app` en el Dockerfile, no instalar `[dev]`. En local vale |
| `pyproject.toml:6-23` | Dependencias sin versión fija y sin fichero de bloqueo (lock) | Cada build puede instalar otra versión. Por ejemplo, PyJWT 2.10.0 tenía CVE-2024-53861 (comprobación parcial del `iss`) | Fijar versiones (`PyJWT>=2.10.1`, etc.) o usar un lock; ejecutar `pip-audit` y pegar el resultado |
| `back/app/main.py:51-66` | Los 404/405/422 por defecto de FastAPI no siguen BR-X1 (sin `code`), y los 422 devuelven el `input` enviado | Nada sensible hoy, pero rompe el contrato de errores | Handler para `RequestValidationError` con `{"detail","code":"VALIDATION_ERROR"}` |
| `docs/STACK.md:77` frente a `core/security.py` | La doc pide `SUPABASE_JWT_SECRET`, pero el código usa JWKS con ES256 y no necesita ningún secreto | Alguien podría poner el secreto en el `.env` sin que sirva, o "arreglar" el código pasando a HS256 | Quitar la variable de la doc. Además `API_CONTRACT.md` dice que `GET /users/me` "not built yet", y ya existe |

No son de seguridad, pero se vieron:
- `controllers/time_slot.py:81, 140` devuelve `code="SLOT_OVERLAP"` cuando el hueco tiene una reserva activa.
- Un usuario creado con `POST /users` no tiene `auth_id`: cuando haga login con Google recibirá siempre 409 DUPLICATE (`auth.py:93-102`). Es la decisión segura (no vincular cuentas solas), pero hay que tenerla en cuenta.

## 🟢 Correcto

- **JWT** (`core/security.py:15-24`): algoritmo fijado a `ES256` (no caben `alg=none` ni HS256). Se valida firma, `exp`, `aud="authenticated"` e `iss`, y se exige `sub`. Los errores de PyJWT/JWKS dan 401 sin detalles internos.
- **Usuario desactivado:** se comprueba `is_active` en cada petición (`auth.py:58-59`), así que el bloqueo es inmediato aunque el token siga vigente.
- **Sin vinculación automática por email** (`auth.py:91-102`): un token nuevo con el email de una cuenta existente no se la apropia (409).
- **Bootstrap del admin solo en el primer login:** si se degrada a un admin, no vuelve a serlo al entrar otra vez.
- **Reservas, cada cliente solo ve y toca las suyas:** `_ensure_can_access` en GET, PUT y cancel (`booking.py:92-99`); `resolve_user_filter` obliga a `user_id=self` en el listado (`:102-112`); `create_booking` impide reservar para otro (`:118-121`).
- **Historial:** `list_user_history` da 403 a un cliente que pide el de otro (`booking.py:394-397`), y `/me/history` va declarado antes que `/{user_id}/history`.
- **Endpoints de staff y admin:** todos con `require_role` y conformes a la matriz de permisos (today, confirm, start, finish y result para staff y admin; salas, huecos, generación masiva, CRUD de usuarios y cambio de rol solo admin).
- **Asignación masiva (mass assignment):** `UserCreate`, `UserUpdate`, `UserRoleUpdate` y `RoomUpdate` usan `extra="forbid"`; un cliente no puede enviar `role` ni `is_active` en `PUT /users/me`. `BookingCreate` se copia campo a campo y el estado y el precio los pone el servidor.
- **Exposición de datos:** `BookingDetail.user` solo expone `name`; `UserResponse` no incluye `auth_id`; los huecos públicos no exponen reservas ni usuarios.
- **Inyección SQL:** todo pasa por el ORM con parámetros; solo hay `text()` con literales fijos y, en la migración, con bindings. Ningún f-string llega a SQL.
- **Paginación:** `size` de 1 a 100; generación masiva limitada a 90 días.
- **Concurrencia:** el índice único parcial impide la doble reserva (BR-B8) y otro índice único el doble resultado; el código captura `IntegrityError` y devuelve 409.
- **Errores y logs:** los 500 son genéricos y la traza solo va al log del servidor; el log registra método, ruta y estado, sin query string ni tokens.
- **Secretos:** ninguna credencial en el código (se buscaron URLs de conexión con contraseña, JWT `eyJ...` y `service_role`). `.env` está en `.gitignore` y la configuración sale de variables de entorno.
- **Exportación CSV:** `/bookings/export.csv` y `/stats` todavía no existen, así que hoy no hay riesgo de inyección de fórmulas. Al construirlo: solo admin; en cada celda que empiece por `= + - @ \t \r` (nombres de sala o de usuario) anteponer `'`; usar el módulo `csv` y un test con un nombre `=HYPERLINK(...)`.

## No se pudo comprobar

- `.env.example`: la lectura está denegada por permisos, así que no se sabe si contiene valores reales.
- Historial de git: verifica que `.env` nunca se subió con `git log --all --oneline -- .env`. Si sale algo, hay que rotar esas credenciales.
- Configuración del proyecto Supabase: si están activos el login con email/contraseña o el anónimo, o si "Confirm email" está desactivado. Eso decide si el fallo 1 es explotable hoy.
