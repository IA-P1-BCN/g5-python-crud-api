# DIAGRAMS

All diagrams are Mermaid: GitHub renders them directly.

## 1. ER diagram - MVP (Sprint 1)

Matches the models and Alembic migrations on `develop`. Changes vs the team's full ER: `users` gets `role` + `is_active` + `auth_id` (Supabase id, nullable until first login); `rooms` gets the catalog fields (`slug`, `genre`, `min_players`, `difficulty`, `hook`, `story`, `audience`, ticket 056); `time_slots.status` is only `available`/`blocked` (booked is computed, see BR-S5). Sprint 2 adds the `game_results` table and the booking statuses `IN_PROGRESS` / `COMPLETED`.

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : makes
    ROOMS ||--o{ TIME_SLOTS : has
    TIME_SLOTS ||--o{ BOOKINGS : "is booked in"
    BOOKINGS ||--o| GAME_RESULTS : "ends with"

    USERS {
        int id PK
        string name
        string email UK
        string phone
        string role "client | staff | admin"
        bool is_active
        string auth_id UK "nullable, Supabase user id"
        datetime created_at
    }
    ROOMS {
        int id PK
        string name UK
        int capacity "max players"
        int duration "minutes"
        decimal base_price "per player"
        string status "active | inactive"
        string slug UK "immutable, URL id"
        string genre
        int min_players "1..capacity"
        int difficulty "1..5"
        text hook
        text story
        string audience
    }
    TIME_SLOTS {
        int id PK
        int room_id FK
        datetime starts_at
        datetime ends_at
        string status "available | blocked"
    }
    BOOKINGS {
        int id PK
        int user_id FK
        int time_slot_id FK
        int players
        decimal total_price
        string status "PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED"
        datetime created_at
    }
    GAME_RESULTS {
        int id PK
        int booking_id FK "UK"
        bool completed
        int completion_time "seconds, >= 0"
        datetime created_at
    }
```

Constraints and indexes the diagram cannot show:
- `bookings`: partial unique index on `time_slot_id` where status is `PENDING`, `CONFIRMED` or `IN_PROGRESS` (BR-B8); indexes on `user_id` and `time_slot_id`; `players >= 1`.
- `time_slots`: PostgreSQL exclusion constraint `ex_time_slots_no_overlap` (same room, overlapping time range, BR-S3); `ends_at > starts_at`; index on (`room_id`, `starts_at`).
- `rooms`: checks `capacity >= 1`, `duration > 0`, `base_price >= 0`, `min_players` between 1 and `capacity`, `difficulty` between 1 and 5.
- `users`: check `role IN ('client', 'staff', 'admin')`.

## 2. ER diagram - full vision (Phase 2/3)

The team's complete model. Tables with a Sprint tag are in scope, the rest are not committed.

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : makes
    ROOMS ||--o{ TIME_SLOTS : has
    TIME_SLOTS ||--o{ BOOKINGS : "is booked in"
    BOOKINGS ||--o| GAME_RESULTS : "ends with (implemented, Sprint 2)"
    BOOKINGS ||--o{ PAYMENTS : "paid by"
    BOOKINGS ||--o{ BOOKING_PLAYERS : includes
    USERS ||--o{ BOOKING_PLAYERS : "plays as"
    BOOKINGS ||--o{ BOOKING_DISCOUNTS : applies
    DISCOUNTS ||--o{ BOOKING_DISCOUNTS : "used in"
    USERS ||--o{ LOYALTY_TRANSACTIONS : earns
    BOOKINGS ||--o{ LOYALTY_TRANSACTIONS : generates

    GAME_RESULTS {
        int id PK
        int booking_id FK "UK"
        bool completed
        int completion_time "seconds"
        datetime created_at
    }
    PAYMENTS {
        int id PK
        int booking_id FK
        decimal amount
        string status
    }
    BOOKING_PLAYERS {
        int id PK
        int booking_id FK
        int user_id FK
    }
    DISCOUNTS {
        int id PK
        string name
        decimal value
        string type
    }
    BOOKING_DISCOUNTS {
        int id PK
        int booking_id FK
        int discount_id FK
    }
    LOYALTY_TRANSACTIONS {
        int id PK
        int user_id FK
        int booking_id FK
        int points
        string type
    }
```

## 3. Booking state machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: client creates booking
    PENDING --> CONFIRMED: staff/admin confirms
    PENDING --> CANCELLED: cancel (24h or more before)
    CONFIRMED --> CANCELLED: cancel (24h or more before)
    CONFIRMED --> IN_PROGRESS: staff starts game (Sprint 2)
    IN_PROGRESS --> COMPLETED: staff finishes game (Sprint 2)
    COMPLETED --> [*]
    CANCELLED --> [*]
```

## 4. User flow - client booking

```mermaid
flowchart TD
    A[Client opens app] --> B[List active rooms]
    B --> C[Pick a room]
    C --> D[See available slots]
    D --> E{Slot free?}
    E -- no --> D
    E -- yes --> F[Enter number of players]
    F --> G{Players <= capacity?}
    G -- no --> F
    G -- yes --> H[Booking created: PENDING]
    H --> I[Staff confirms: CONFIRMED]
    I --> J{Wants to cancel?}
    J -- "24h or more left" --> K[CANCELLED, slot freed]
    J -- "less than 24h" --> L[Rejected 409]
    J -- no --> M[Plays the game]
```

## 5. User flow - staff on game day (Sprint 2)

```mermaid
flowchart LR
    A[Staff logs in] --> B[Today's bookings]
    B --> C[Pick CONFIRMED booking]
    C --> D[Start game: IN_PROGRESS]
    D --> E[Finish game: COMPLETED]
    E --> F[Register result: completed + time]
```

## 6. Booking creation sequence

```mermaid
sequenceDiagram
    actor C as Client
    participant R as Router
    participant S as BookingService
    participant DB as PostgreSQL
    C->>R: POST /bookings {time_slot_id, user_id, players}
    R->>S: validate and create
    S->>DB: load slot + room
    alt room inactive or players > capacity
        S-->>C: 422 / 409
    end
    S->>DB: INSERT booking (PENDING)
    alt unique index violated (slot already taken)
        DB-->>S: IntegrityError
        S-->>C: 409 SLOT_TAKEN
    else ok
        DB-->>S: booking
        S-->>C: 201 booking
    end
```

## 7. Auth flow (Sprint 2)

```mermaid
sequenceDiagram
    actor U as User
    participant F as Client app
    participant SB as Supabase Auth
    participant API as FastAPI
    participant DB as PostgreSQL
    U->>F: Login with Google
    F->>SB: OAuth
    SB-->>F: JWT
    F->>API: request + Bearer JWT
    API->>API: verify JWT signature
    API->>DB: find user by auth_id (create as client if missing)
    API-->>F: response (role checked per endpoint)
```
