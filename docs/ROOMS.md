# ROOMS

Initial catalogue of the escape rooms, ready to be inserted in the database (ticket 063, demo seed). Source: the validated mockup (`docs/mockups/shared.js`). Texts are in Spanish because they are shown to customers as they are.

## Summary

| # | Name | Slug | Genre | Players (min-max) | Duration | Price / player | Difficulty (1-5) | Status |
|---|------|------|-------|-------------------|----------|----------------|------------------|--------|
| 1 | El Relojero | `relojero` | Misterio victoriano | 2-5 | 60 min | 22 EUR | 2 | active |
| 2 | La Biblioteca Prohibida | `biblioteca` | Fantasía oscura | 3-6 | 75 min | 25 EUR | 4 | active |
| 3 | Faro 1923 | `faro` | Terror marítimo | 2-4 | 60 min | 20 EUR | 3 | active |
| 4 | El Gran Atraco | `atraco` | Robo y espionaje | 4-8 | 90 min | 30 EUR | 5 | active |
| 5 | Laboratorio Zero | `lab` | Ciencia ficción | 3-5 | 60 min | 24 EUR | 3 | **inactive** (archived) |

Example total (rule BR-B4, `total_price = base_price x players`): El Relojero for 3 players = 3 x 22 = 66 EUR.

## Mapping to the database

| Field in this document | Column in `rooms` | Available today | Note |
|------------------------|-------------------|-----------------|------|
| Name | `name` (unique, max 100) | yes | |
| Players max | `capacity` (>= 1) | yes | |
| Duration | `duration` (minutes, > 0) | yes | |
| Price / player | `base_price` (Numeric 10,2, >= 0) | yes | Price per player: rule BR-B4, still marked "to validate" (D-01) |
| Status | `status` (`active` / `inactive`) | yes | |
| Slug, genre, players min, difficulty, hook, story, audience | new columns | **ticket 056** | Column names are proposed here; ticket 056 decides the final ones |
| Success rate | - | - | **Not stored**: computed from finished games (ticket 062). The percentages of the mockup are fake |

Until ticket 056 is merged, only the first five rows can be inserted. The rest of this document is the data for the new columns.

## Rooms

### 1. El Relojero

| Field | Value |
|-------|-------|
| `name` | El Relojero |
| `slug` | relojero |
| `genre` | Misterio victoriano |
| `min_players` / `capacity` | 2 / 5 |
| `duration` | 60 |
| `base_price` | 22.00 |
| `difficulty` | 2 |
| `audience` | Para empezar y jugar en familia |
| `status` | active |
| `hook` | El maestro relojero desapareció. Su taller sigue sonando. |
| `story` | Londres, 1887. El maestro Aldous Vane lleva tres días sin salir de su taller y los relojes de la calle marcan horas distintas. Tenéis una hora para encontrar su rastro antes de que el último engranaje se detenga. |

### 2. La Biblioteca Prohibida

| Field | Value |
|-------|-------|
| `name` | La Biblioteca Prohibida |
| `slug` | biblioteca |
| `genre` | Fantasía oscura |
| `min_players` / `capacity` | 3 / 6 |
| `duration` | 75 |
| `base_price` | 25.00 |
| `difficulty` | 4 |
| `audience` | Para jugadores con experiencia |
| `status` | active |
| `hook` | Un libro falta en el índice. Nadie admite haberlo tocado. |
| `story` | Los archivos de un monasterio guardan lo que la Iglesia nunca quiso leer en voz alta. Alguien arrancó una ficha del catálogo. Si el volumen se abre a medianoche, la biblioteca se cierra para siempre... con vosotros dentro. |

### 3. Faro 1923

| Field | Value |
|-------|-------|
| `name` | Faro 1923 |
| `slug` | faro |
| `genre` | Terror marítimo |
| `min_players` / `capacity` | 2 / 4 |
| `duration` | 60 |
| `base_price` | 20.00 |
| `difficulty` | 3 |
| `audience` | Para quien busca sustos |
| `status` | active |
| `hook` | El diario del farero se interrumpe a mitad de frase. |
| `story` | Cabo de Creus, una noche de temporal. El farero no responde por radio y la luz gira sola. Subid la escalera, leed su diario y apagad lo que lleva encendido desde hace cien años. |

### 4. El Gran Atraco

| Field | Value |
|-------|-------|
| `name` | El Gran Atraco |
| `slug` | atraco |
| `genre` | Robo y espionaje |
| `min_players` / `capacity` | 4 / 8 |
| `duration` | 90 |
| `base_price` | 30.00 |
| `difficulty` | 5 |
| `audience` | Para equipos grandes y competitivos |
| `status` | active |
| `hook` | Una cámara acorazada, ocho minutos de ventana y cero errores. |
| `story` | El banco más vigilado de la ciudad guarda un cuadro que no figura en ningún inventario. Sois un equipo de especialistas: láseres, códigos y un guardia que da la ronda cada ocho minutos. Salid con el botín o no salgáis. |

### 5. Laboratorio Zero (inactive)

Archived room, kept to test deactivation and reactivation (ticket 057). Not shown to customers.

| Field | Value |
|-------|-------|
| `name` | Laboratorio Zero |
| `slug` | lab |
| `genre` | Ciencia ficción |
| `min_players` / `capacity` | 3 / 5 |
| `duration` | 60 |
| `base_price` | 24.00 |
| `difficulty` | 3 |
| `audience` | (empty) |
| `status` | inactive |
| `hook` | Archivada. |
| `story` | (empty) |

## Time slots

In the mockup, each room's start times are spaced by `duration + 30 min` (room reset), from 10:00 to 20:30 at the latest. This is a demo convention, not a business rule: real slots are created by the admin (tickets 019, 058).

| Room | Step | Start times |
|------|------|-------------|
| El Relojero | 90 min | 10:00, 11:30, 13:00, 14:30, 16:00, 17:30, 19:00, 20:30 |
| La Biblioteca Prohibida | 105 min | 10:00, 11:45, 13:30, 15:15, 17:00, 18:45, 20:30 |
| Faro 1923 | 90 min | 10:00, 11:30, 13:00, 14:30, 16:00, 17:30, 19:00, 20:30 |
| El Gran Atraco | 120 min | 10:00, 12:00, 14:00, 16:00, 18:00, 20:00 |

## Open points

- Price per player or per room: rule BR-B4 says per player, still "to validate" (D-01). The mockup and the prices above assume per player.
- Difficulty scale 1 (easy) to 5 (very hard) comes from the mockup; ticket 056 must say if it is stored as an integer with a 1-5 check.
