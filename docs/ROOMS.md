# ROOMS

Initial catalogue of the escape rooms, ready to be inserted in the database (ticket 063, demo seed). Source: the validated mockup (`docs/mockups/F-inmersivo.js`). Texts are in Spanish because they are shown to customers as they are.

## Summary

| # | Name | Slug | Genre | Players (min-max) | Duration | Price / player | Difficulty (1-5) | Status |
|---|------|------|-------|-------------------|----------|----------------|------------------|--------|
| 1 | El Relojero | `relojero` | Misterio victoriano | 2-5 | 60 min | 15 EUR | 2 | active |
| 2 | La Biblioteca Prohibida | `biblioteca` | Fantasía oscura | 3-6 | 75 min | 17 EUR | 4 | active |
| 3 | Faro 1923 | `faro` | Terror marítimo | 2-4 | 60 min | 14 EUR | 3 | active |
| 4 | El Gran Atraco | `atraco` | Robo y espionaje | 4-8 | 90 min | 19 EUR | 5 | active |
| 5 | Laboratorio Zero | `lab` | Ciencia ficción | 3-5 | 60 min | 16 EUR | 3 | **inactive** (archived) |

Example total (rule BR-B4, `total_price = base_price x players`): El Relojero for 3 players = 3 x 15 = 45 EUR.

## Mapping to the database

| Field in this document | Column in `rooms` | Available today | Note |
|------------------------|-------------------|-----------------|------|
| Name | `name` (unique, max 100) | yes | |
| Players max | `capacity` (>= 1) | yes | |
| Duration | `duration` (minutes, > 0) | yes | |
| Price / player | `base_price` (Numeric 10,2, >= 0) | yes | Price per player: rule BR-B4, still marked "to validate" (D-01) |
| Status | `status` (`active` / `inactive`) | yes | |
| Slug, genre, players min, difficulty, hook, story, audience | `slug`, `genre`, `min_players`, `difficulty`, `hook`, `story`, `audience` | yes | Added by ticket 056 (#105); `slug` is unique, `min_players` 1..`capacity`, `difficulty` 1..5 |
| Success rate | - | - | **Not stored**: computed from finished games (ticket 062). The percentages of the mockup are fake |

All the fields in this document can be inserted: the catalog columns from ticket 056 are merged.

## Rooms

### 1. El Relojero

| Field | Value |
|-------|-------|
| `name` | El Relojero |
| `slug` | relojero |
| `genre` | Misterio victoriano |
| `min_players` / `capacity` | 2 / 5 |
| `duration` | 60 |
| `base_price` | 15.00 |
| `difficulty` | 2 |
| `audience` | Para empezar y jugar en familia |
| `status` | active |
| `hook` | El maestro relojero desapareció. Su taller sigue sonando. |
| `story` | Londres, 1887. El maestro relojero lleva tres días sin salir de su taller y los relojes de la calle marcan horas distintas. Seguid sus pistas entre engranajes y péndulos antes de que el último reloj se pare. |

### 2. La Biblioteca Prohibida

| Field | Value |
|-------|-------|
| `name` | La Biblioteca Prohibida |
| `slug` | biblioteca |
| `genre` | Fantasía oscura |
| `min_players` / `capacity` | 3 / 6 |
| `duration` | 75 |
| `base_price` | 17.00 |
| `difficulty` | 4 |
| `audience` | Para jugadores con experiencia |
| `status` | active |
| `hook` | Un libro falta en el índice. Nadie admite haberlo tocado. |
| `story` | Un monasterio guarda libros que nadie debía leer. Alguien ha arrancado una ficha del catálogo y, a medianoche, las puertas se cerrarán. Encontrad el volumen que falta antes de quedaros dentro. |

### 3. Faro 1923

| Field | Value |
|-------|-------|
| `name` | Faro 1923 |
| `slug` | faro |
| `genre` | Terror marítimo |
| `min_players` / `capacity` | 2 / 4 |
| `duration` | 60 |
| `base_price` | 14.00 |
| `difficulty` | 3 |
| `audience` | Para quien busca sustos |
| `status` | active |
| `hook` | El diario del farero se interrumpe a mitad de frase. |
| `story` | Cabo de Creus, 1923. El farero no responde por radio y la luz del faro gira sola. Subid la escalera, leed su diario y descubrid qué ocurrió en esa torre antes de que se apague la luz. |

### 4. El Gran Atraco

| Field | Value |
|-------|-------|
| `name` | El Gran Atraco |
| `slug` | atraco |
| `genre` | Robo y espionaje |
| `min_players` / `capacity` | 4 / 8 |
| `duration` | 90 |
| `base_price` | 19.00 |
| `difficulty` | 5 |
| `audience` | Para equipos grandes y competitivos |
| `status` | active |
| `hook` | Una cámara acorazada, ocho minutos de ventana y cero errores. |
| `story` | Una cámara acorazada, un cuadro que no figura en ningún inventario y un guardia que pasa cada ocho minutos. Sois el equipo: desactivad los láseres y salid con el botín. |

### 5. Laboratorio Zero (inactive)

Archived room, kept to test deactivation and reactivation (ticket 057). Not shown to customers.

| Field | Value |
|-------|-------|
| `name` | Laboratorio Zero |
| `slug` | lab |
| `genre` | Ciencia ficción |
| `min_players` / `capacity` | 3 / 5 |
| `duration` | 60 |
| `base_price` | 16.00 |
| `difficulty` | 3 |
| `audience` | Para equipos experimentados |
| `status` | inactive |
| `hook` | Archivada. |
| `story` | Un experimento salió mal y el laboratorio quedó sellado. Descifrad los registros y encontrad la salida antes de que el sistema se reinicie. |

## Time slots

Each room's start times are spaced by `duration + 30 min` (room reset), from 10:00 to 20:30 at the latest. The admin creates real slots through `POST /rooms/{id}/time-slots/generate` (tickets 019, 058), which follows the same step (BR-S7).

| Room | Step | Start times |
|------|------|-------------|
| El Relojero | 90 min | 10:00, 11:30, 13:00, 14:30, 16:00, 17:30, 19:00, 20:30 |
| La Biblioteca Prohibida | 105 min | 10:00, 11:45, 13:30, 15:15, 17:00, 18:45, 20:30 |
| Faro 1923 | 90 min | 10:00, 11:30, 13:00, 14:30, 16:00, 17:30, 19:00, 20:30 |
| El Gran Atraco | 120 min | 10:00, 12:00, 14:00, 16:00, 18:00, 20:00 |

## Open points

- Price per player or per room: rule BR-B4 says per player, still "to validate" (D-01). The mockup and the prices above assume per player.
- Difficulty scale 1 (easy) to 5 (very hard) comes from the mockup; ticket 056 stores it as an integer with a 1-5 CHECK (BR-R2 does not cover it).
