
# Bitácora de Inteligencia Artificial (AI Log) — g5-python-crud-api

Este documento registra y analiza de manera formal el uso de herramientas y asistentes basados en Inteligencia Artificial durante el ciclo de vida del desarrollo del proyecto `g5-python-crud-api`. Su propósito es mantener la trazabilidad técnica, documentar los patrones de interacción, evaluar la gestión de riesgos y alucinaciones, y establecer directrices metodológicas replicables.

## 1. Fundamentos Teóricos, Patrones de Interacción y Gestión de Alucinaciones

### 1.1 Paradigma de Colaboración Humano-IA

El desarrollo de sistemas de software complejos mediante modelos de lenguaje (LLMs) requiere un cambio de paradigma: la IA no actúa como un sustituto autónomo del desarrollador, sino como un **copiloto cognitivo y de ejecución**. Para garantizar la integridad del código fuente y el respeto estricto por la arquitectura limpia del repositorio (`ARCHI.md`), se adoptaron patrones de interacción basados en evidencia y gobernanza estricta:

- **Volcado Contextual Basado en Código Real:** Se evitó el uso de descripciones conceptuales abstractas. La práctica estándar consistió en suministrar el estado real de los archivos del repositorio mediante scripts automatizados o herramientas de línea de comandos (CLI), asegurando que el modelo razonara sobre el entorno de código verídico.
- **Desarrollo Guiado por Pruebas (TDD) Asistido:** La generación de código se acopló sistemáticamente a la escritura previa de pruebas unitarias y de integración (Pytest y Vitest), estableciendo una correspondencia de un test por cada criterio de aceptación.
- **Segunda Opinión Automatizada (Revisión Cruzada):** Se implementó un flujo donde un agente o modelo genera la solución (por ejemplo, Claude o Claude Code), mientras que otro modelo o bot de repositorio (como Codex) audita los cambios mediante revisiones automatizadas previas a la apertura de los *Pull Requests*.

### 1.2 Gestión de Alucinaciones y Desviaciones Técnicas

Durante el proceso de desarrollo, los modelos experimentaron diversas alucinaciones e incidencias típicas de los LLMs (como suposición de estructuras de directorios genéricas, invención de rutas o contratos de API desalineados, y formateos de código masivos e indeseados). Las estrategias adoptadas para salir de estos bucles y reconducir el flujo fueron:

1. **Restablecimiento estricto del contexto (*Context Reset*):** Ante la degradación del razonamiento del modelo en sesiones prolongadas, se interrumpió el flujo aportando explícitamente el estado actual del repositorio y los contratos vigentes.
2. **Anotación Inmediata de Reglas en Documentación:** Cada error recurrente (como el orden de rutas en FastAPI, la conversión de tipos vacíos en esquemas de validación Zod, o problemas con sintaxis de variables en scripts de PowerShell) se formalizó de inmediato en archivos de directrices locales (`CLAUDE.md`), previniendo su repetición.
3. **Validación Empírica Obligatoria:** Ninguna sugerencia generada por la IA se aceptó a ciegas. La ejecución local de contenedores Docker, linters (`Ruff`, `ESLint`) y validaciones en entorno de pruebas actuó como el filtro definitivo de verdad.

## 2. Consolidación de Herramientas, Modelos y Experiencia del Equipo

A continuación se presenta la tabla consolidada que detalla las herramientas, modelos, épicas y lecciones de cada integrante del equipo en el proyecto:

| Miembro | Épica / Ámbito | Modelo de IA Utilizado | Uso de IA en el Proyecto | Experiencia y Lecciones |
|---|---|---|---|---|
| **Isbel** | **E2** | Gemini Advanced (Plus) y OpenCode | Soporte en diseño arquitectónico, modelado de sistemas, validación de dependencias y desarrollo de componentes de backend y flujos lógicos. | Control riguroso de restricciones contextuales para mitigar desviaciones estructurales, priorizando la validación formal y el cumplimiento estricto de las reglas del repositorio (`ARCHI.md`). |
| **Leandro** | **E1** (Users) | ChatGPT (gratuito) y Claude Sonnet 5.5 | Implementación de la épica E1 (gestión de usuarios, autenticación con Supabase y vistas de interfaz), además de revisión automática mediante Codex. | Éxito en el uso de scripts de volcado de contexto automatizados y validación estricta local en contenedores Docker, apoyándose en la revisión cruzada de modelos. |
| **Carolay** | **E3** | Asistente de IA conversacional | Soporte en tickets de backend (031, 040, 060), frontend (071), flujos de control de versiones y diagnóstico de trazas de pruebas y linters. | Necesidad de contrastar empíricamente cualquier afirmación del modelo con la salida real de la terminal, evidenciando que las predicciones de pruebas no sustituyen a la ejecución local. |
| **Marie-Charlotte** | **E4** | Claude Code (CLI / Sonnet 5.5) y Codex (OpenAI) | Desarrollo guiado por TDD (backend y frontend), conversión de mockups a componentes, documentación, auditorías y control de PRs mediante agentes y skills especializados. | Las reglas se documentan inmediatamente en `CLAUDE.md` ante cualquier error repetitivo; la IA no sustituye la verificación con tests, auditorías en navegador y revisión cruzada de agentes. |

## 3. Registro de Incidencias y Mitigaciones Relevantes

| # | Incidencia / Alucinación | Contexto | Causa Raíz | Acción Correctiva Implementada |
|---|---|---|---|---|
| **1** | **Conflictos de Enrutamiento (FastAPI)** | Backend (Tickets de reservas) | Declaración de rutas dinámicas antes de las fijas (ej. `/{booking_id}` antes de `/today`). | Reordenamiento de endpoints prioritarios al inicio del router y validación con pruebas de integración. |
| **2** | **Formateo Global Indeseado** | Control de Estilo (Ruff / Prettier) | Ejecución de comandos de formato a nivel de directorio raíz (`.` o carpetas enteras). | Uso estricto de rutas de archivos específicos y restauración de hunks ajenos mediante `git restore`. |
| **3** | **Validación Errónea de Tipos (Zod)** | Frontend (Formularios) | Uso de `z.coerce.number()` convirtiendo campos vacíos (`""`) en ceros. | Incorporación previa de validaciones de cadena no vacía (`z.string().trim().min(1)`) y uso de atributos `noValidate`. |
| **4** | **Comparativas contra Rama Equivocada** | Revisión con Codex | Ejecución predeterminada de comandos comparando contra `main` en lugar de `develop`. | Especificación explícita del parámetro `--base develop` e incorporación como regla de trabajo. |
