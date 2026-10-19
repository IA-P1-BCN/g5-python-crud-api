## Jueves 15 de octubre de 2026

### Leandro

- **Hoy:** Ticket 077: implementación del login con Google mediante Supabase en el frontend, integración del proveedor de autenticación y manejo de JWT/errores 401. Configuración de variables de entorno y documentación de Supabase. PR #180 abierta para revisión.
- **Resultado (tarde):** Cambios subidos a `feature/ticket-077-google-login`; PR #180 abierta contra `develop`. Pendiente la revisión y la verificación manual del flujo OAuth.
- **Bloqueos:** Pendiente completar la verificación manual de Google OAuth y la revisión del PR.

### Isbel

**Hoy:** Revisión de restricciones de arquitectura (Feature-Sliced Design) y corrección de reglas de importación con ESLint.
- **Resultado (tarde):** Refactorización del componente compartido `Toast.jsx` y adaptación de rutas absolutas y relativas.
- **Bloqueos:** Ajustes menores en la resolución de módulos de prueba.

### Carolay

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

### Marie-Charlotte

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

---

## Miércoles 14 de octubre de 2026

### Leandro

- **Hoy:** Seguimiento del Ticket 039 y sincronización de la rama `develop` tras la integración del PR #168.
- **Resultado (tarde):** PR #168 del Ticket 039 integrada. Rama local `develop` actualizada y verificada con el remoto en el commit `779bc27`.
- **Bloqueos:** Ninguno conocido.

### Isbel

- **Hoy:** Construcción de los componentes visuales de la pantalla de confirmación (`Stamp.jsx`, `Ticket.jsx`) y la página `ConfirmationPage.jsx`.
- **Resultado (tarde):** Implementación de la animación del sello y pruebas de integración para el pase de acceso.
- **Bloqueos:** Ninguno.

### Carolay

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

### Marie-Charlotte

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

---
# Dailies

Cada día, por la mañana cada persona rellena **Hoy**; por la tarde rellena **Resultado**.
Si hay algo que bloquea, se anota en **Bloqueos**.
Nuevo día = nuevo bloque añadido arriba (el más reciente primero).

---

## Martes 13 de octubre de 2026

### Leandro

- **Hoy:** Revisión del estado del repositorio G5, comprobación de la integridad de Git y sincronización de `develop` con `origin/develop`. Seguimiento de la integración del Ticket 036 (primer inicio de sesión y creación de usuarios, PR #153).
- **Resultado (tarde):** Entorno Docker y servicios de API, PostgreSQL y frontend verificados. Suite de tests del backend ejecutada correctamente: 162 tests pasados.
- **Bloqueos:** Ninguno conocido.

### Isbel

**Hoy:** Desarrollo de la página de pago (`CheckoutPage.jsx`), el hook `useCreateBooking.js` y las pruebas de aceptación correspondientes.
- **Resultado (tarde):** Verificación del flujo de éxito y de la correcta visualización del error cuando un horario es ocupado por otro usuario.
- **Bloqueos:** Ninguno.

### Carolay

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

### Marie-Charlotte

- **Hoy:**
  - Back de la partida (Sprint 2, rol staff/admin): tickets 041 a 045.
  - Ticket 060 "Enrich booking responses" (slug de la sala guardado, relaciones cargadas de una vez, rango de fechas invertido rechazado).
- **Resultado (tarde):**
- **Bloqueos:** Ninguno.

---

## Viernes 9 de octubre de 2026

### Leandro

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

### Isbel

**Hoy:** Implementación del store de Zustand para el borrador (`bookingDraft.store.js`) asegurando la persistencia ante cambios de paso.
- **Resultado (tarde):** Creación y validación exitosa de los tests unitarios del store (`bookingDraft.store.test.js`).
- **Bloqueos:** Ninguno.

### Carolay

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

### Marie-Charlotte

- **Hoy:**
  - Ticket 066 "Port 3D corridor": portar el pasillo 3D con alternativa sin WebGL.
  - Ticket 086 "Design system" del front (tokens, componentes compartidos).
- **Resultado (tarde):**
  - Ticket 066 hecho ✅ (PR #149 integrada): pasillo 3D dividido en módulos con sus tests, lista accesible de salas, fallback si falla WebGL, `useRooms` con las salas visibles.
  - Ticket 086 hecho ✅ (PR #151 integrada): tokens de diseño, fuentes autoalojadas, `Button`, `Badge`, `Alert`, `Field`, `Spinner`, `EmptyState`, `Dialog` y `Select` de shadcn/ui, y guía "Start here" para el equipo en `DESIGN.md`.
  - Correcciones: etiqueta Swagger duplicada de time-slots (PR #152) y cadena de migraciones del `auth_id`.
- **Bloqueos:** Ninguno.

---

## Jueves 8 de octubre de 2026

### Leandro

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

### Isbel

- **Hoy:** Planificación inicial de las tareas de la épica E3 Bookings (Sprint 2) y análisis técnico de los requisitos del Ticket 073 para el flujo de reservas.
- **Resultado (tarde):** Definición de la arquitectura del borrador de reserva y estructuración de los componentes necesarios.
- **Bloqueos:** Ninguno.

### Carolay

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

### Marie-Charlotte

- **Hoy:**
  - Ticket 064 "Front setup: Vite, Tailwind, providers, routes, Docker with Nginx" (en curso 🔄): scaffold del front, servicio `front` en docker-compose (Nginx), esqueleto de carpetas por feature (rutas, i18n y mocks MSW por feature), reglas ESLint de arquitectura.
  - Herramientas de estilo del front (Prettier + ESLint + Vitest) y comando de fin de ticket `docker compose run --rm front-tools`.
  - Documentación del front: tickets 064 a 085, STACK, ARCHI, WORK_SPLIT, CONTRIBUTING, PRD.
- **Resultado (tarde):**
*Ramarización de la rama `feature/front-setup` y PR enviada para revisión.
*Ticket 065 hecho 
*Rama documentación del front al dia
- **Bloqueos:**

---

## Miércoles 7 de octubre de 2026

### Leandro

- **Hoy:** Ticket 005 "Create user" (en curso 🔄). Implementación del endpoint de creación de usuarios, normalización de emails y tests de duplicados case-insensitive. PR actualizada y enviada para revisión.
- **Resultado (tarde):**
- **Bloqueos:** Esperando el merge del PR 005 para continuar con el Ticket 007 desde `develop`.

### Isbel

- **Hoy:** Sincronización del repositorio con develop y resolución de conflictos de merge en la rama del Ticket 019.
  Corrección de validaciones de negocio (BR-S6, BR-R4, BR-S2) y estandarización del prefijo de rutas a /api/v1/time-slots/ junto con su registro en main.py.
  Refactorización de la arquitectura para mover la lógica de negocio a controladores (controllers/time_slot.py) y actualización de esquemas a Pydantic v2.
  Ejecución y validación exitosa de toda la suite de tests unitarios e integración.
  Creación del commit y subida de los cambios al repositorio remoto.

- **Resultado (tarde):** Pull Request del Ticket 019 actualizado y listo para la revisión final del equipo.
- **Bloqueos:** Ninguno.

### Carolay

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

### Marie-Charlotte

- **Hoy:**
  Front
- **Resultado (tarde):**
  Deseno de los mockups de la aplicación web
  Deseno de la arquitectura del front (carpetas por feature, rutas, i18n, mocks MSW por feature)
- **Bloqueos:**

---

## Martes 6 de octubre de 2026

### Leandro

- **Hoy:** Evento de la base de datos + ticket 0-05 "Create user" (en curso 🔄)
- **Resultado (tarde):**
- **Bloqueos:**

### Isbel

- **Hoy:** Ticket 013 completado (endpoints de habitaciones, tests y linter limpios). PR integrada en develop.
- **Resultado (tarde):** PR integrada y rama develop actualizada.
- **Bloqueos:** Ninguno.
- **Siguiente:** Empezar el Ticket 015 (desactivación de habitaciones).

### Carolay

- **Hoy:** En standby
- **Resultado (tarde):**
- **Bloqueos:**

### Marie-Charlotte

- **Hoy:**
- Ticket 0-24 "Implement create booking + test" (done ✅)
- **Resultado (tarde):**
- Ticket 025 - Implement double-booking guard (IntegrityError to 409 SLOT_TAKEN) + tests (done ✅)
- Ticket 027 - Implement view bookings + tests (done ✅)
- Ticket 029 - Implement modify booking (players) + tests (empieza el ticket 🔄)
- **Bloqueos:**
