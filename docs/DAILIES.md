# Dailies

Cada día, por la mañana cada persona rellena **Hoy**; por la tarde rellena **Resultado**.
Si hay algo que bloquea, se anota en **Bloqueos**.
Nuevo día = nuevo bloque añadido arriba (el más reciente primero).

---

## Jueves 8 de octubre de 2026

### Leandro

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

### Isbel

- **Hoy:**
- **Resultado (tarde):**
- **Bloqueos:**

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
