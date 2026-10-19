
# Retrospectiva del Proyecto: g5-python-crud-api

## 1. Resumen Ejecutivo

El proyecto `g5-python-crud-api` consistió en el diseño, desarrollo e implementación integral de una plataforma de gestión para *escape rooms*, basada en una API REST de alto rendimiento (FastAPI, PostgreSQL, SQLAlchemy y Alembic) y un frontend modular y reactivo (Vite, React). El ciclo de vida del desarrollo se rigió por estrictos estándares de arquitectura limpia, validación rigurosa de esquemas y pruebas automatizadas exhaustivas.

## 2. Evaluación de Objetivos y Alcance

- **Cumplimiento Funcional y Épicas:** Ejecución exitosa de las cuatro épicas principales del proyecto, abarcando desde la infraestructura base y la autenticación segura con Supabase hasta la gestión avanzada de reservas, salas y paneles de control.
- **Calidad y Mantenimiento de Código:** Adopción de pruebas unitarias y de integración mediante `Pytest` y `Vitest`, acompañadas de análisis estático estricto de estilo y *linting* (`Ruff`, `ESLint`).
- **Integridad Arquitectónica:** Respeto riguroso de las fronteras de dependencias definidas en la documentación técnica (`ARCHI.md`), desacoplando de manera limpia la capa de persistencia de los enrutadores de la API y de los componentes de la interfaz de usuario.

## 3. Dinámica de Trabajo y Asistencia por Inteligencia Artificial

El desarrollo se apoyó en un uso diversificado y avanzado de herramientas de IA (Gemini Advanced/Plus, OpenCode, Claude Code, Claude Sonnet y ChatGPT), adoptando metodologías de colaboración basadas en:

- **Volcado Contextual Basado en Evidencia:** Uso de scripts y herramientas CLI para alimentar a los modelos con el código real del repositorio en lugar de descripciones abstractas.
- **Validación por Capas:** Ninguna sugerencia de código generada por IA fue integrada sin la verificación local en contenedores Docker, ejecución de pruebas unitarias y revisiones cruzadas automatizadas (Codex) y humanas.
- **Mitigación de Alucinaciones:** Control de bucles y desviaciones estructurales mediante la redefinición estricta de restricciones contextuales, anotación inmediata de reglas en archivos de configuración locales (`CLAUDE.md`) y uso de trazas de consola reales.

### Participación y Asignación de Épicas del Equipo

- **Isbel (Épica E2):** Soporte en diseño arquitectónico, modelado de sistemas, validación de dependencias y desarrollo de componentes de backend y flujos lógicos mediante Gemini Advanced (Plus) y OpenCode.
- **Leandro (Épica E1 - Users):** Implementación de la gestión de usuarios, autenticación segura con Supabase y vistas de interfaz, asistido por ChatGPT y Claude Sonnet 5.5, con validación local estricta en Docker.
- **Carolay (Épica E3):** Desarrollo de endpoints clave en backend, tickets de frontend (como el selector de fechas y parrilla de slots), control de versiones y diagnóstico de trazas de pruebas, apoyada en asistencia conversacional.
- **Marie-Charlotte (Épica E4):** Desarrollo guiado por TDD (backend y frontend), conversión de mockups a componentes, documentación, auditorías y control de PRs mediante Claude Code y Codex.

## 4. Desafíos Técnicos y Decisiones de Diseño

- **Gestión de Concurrencia y Transacciones:** Resolución de conflictos en el aislamiento de pruebas y control de estados concurrentes en bases de datos relacionales.
- **Estandarización y Reutilización:** Alineación del diseño de interfaz con los componentes compartidos (`shared/ui`) para prevenir rupturas en la arquitectura de dependencias.
- **Optimización de Consultas:** Mitigación de problemas de rendimiento (como consultas N+1) mediante el uso estratégico de técnicas de carga optimizada (`joinedload` / `contains_eager`) en SQLAlchemy.

## 5. Conclusiones y Próximos Pasos

- Consolidación de un flujo de desarrollo robusto donde la asistencia de IA actúa como un acelerador de alta eficiencia bajo la supervisión, validación formal y revisión cruzada humana.
- Oportunidades claras de mejora en la escalabilidad asíncrona de los servicios y la optimización continua de los *pipelines* de integración continua (CI/CD) en GitHub Actions.
