# BUSINESS RULES

What the system must enforce. Every rule has an ID so tests and tickets can reference it.
Status: **Sprint 1** = delivery Fri Oct 9. **Sprint 2** = delivery Mon Oct 19.
Items marked **(to validate)** are proposals the team has not confirmed yet.

## Sprint 1 - CRUD without authentication

### Users (E1)
| ID | Rule | Error |
|----|------|-------|
| BR-U1 | `email` is required, valid format, unique | 422 invalid, 409 duplicate |
| BR-U2 | `name` required, 1-100 chars. `phone` optional | 422 |
| BR-U3 | `role` is `client`, `staff` or `admin`. Default `client` | 422 |
| BR-U4 | Users are deactivated (`is_active=false`), never hard-deleted | - |
| BR-U5 | An inactive user cannot create bookings | 409 |

### Rooms (E2)
| ID | Rule | Error |
|----|------|-------|
| BR-R1 | `name` required and unique | 409 duplicate |
| BR-R2 | `capacity` (max players) >= 1, `duration` (minutes) > 0, `base_price` >= 0 | 422 |
| BR-R3 | Rooms are deactivated (`status=inactive`), never hard-deleted | - |
| BR-R4 | Inactive rooms are hidden from client listings and accept no new slots or bookings | 409 |
| BR-R5 | A room with future active bookings cannot be deactivated **(to validate)** | 409 |

### Time slots (E2)
| ID | Rule | Error |
|----|------|-------|
| BR-S1 | `ends_at` must be after `starts_at` | 422 |
| BR-S2 | A slot cannot start in the past | 422 |
| BR-S3 | Slots of the same room cannot overlap | 409 |
| BR-S4 | Slot `status` is `available` or `blocked` (admin-managed) | 422 |
| BR-S5 | A slot is **bookable** when `status=available` AND it has no active booking. This is computed, not stored | - |
| BR-S6 | A slot with an active booking cannot be deleted or edited | 409 |

### Bookings (E3)
| ID | Rule | Error |
|----|------|-------|
| BR-B1 | The slot must be bookable (BR-S5) and its room active | 409 |
| BR-B2 | `players` between 1 and room `capacity` | 422 |
| BR-B3 | Initial status is `PENDING` (assigned by the system) | - |
| BR-B4 | `total_price = room.base_price x players` (price per player) **(to validate)** | - |
| BR-B5 | Statuses in Sprint 1: `PENDING`, `CONFIRMED`, `CANCELLED` | 422 on invalid change |
| BR-B6 | **Cancel**: only `PENDING`/`CONFIRMED`, and only if the slot starts in **24h or more**. Cancelling frees the slot | 409 |
| BR-B7 | **Modify**: only `players`, only while `PENDING`/`CONFIRMED` and 24h or more before start. Changing slot comes in Sprint 2 | 409 |
| BR-B8 | Double booking is impossible: DB partial unique index on `bookings(time_slot_id)` where status in (`PENDING`,`CONFIRMED`,`IN_PROGRESS`) | 409 |

### Cross-cutting (technical)
| ID | Rule |
|----|------|
| BR-X1 | All errors use one JSON shape: `{"detail": "...", "code": "SLOT_TAKEN"}` |
| BR-X2 | HTTP codes: 200/201/204 ok, 404 not found, 409 business conflict, 422 validation |
| BR-X3 | Every request is logged (method, path, status). Errors logged with stack trace |
| BR-X4 | Secrets only via environment variables |
| BR-X5 | All datetimes stored in UTC, ISO 8601 in the API |

## Sprint 2 - Auth, games, reporting

### Auth and roles (E1)
| ID | Rule |
|----|------|
| BR-A1 | Login via Supabase Auth (Google). The API validates the Supabase JWT |
| BR-A2 | First login creates a `users` row with `role=client` and stores `auth_id` (Supabase user id) |
| BR-A3 | Role lives in OUR `users` table, not in Supabase **(to validate)** |
| BR-A4 | Only `admin` can change a user's role |

### Permission matrix
| Action | Client | Staff | Admin |
|--------|:------:|:-----:|:-----:|
| List rooms / available slots | yes | yes | yes |
| Create / edit / deactivate rooms | - | - | yes |
| Create / edit slots | - | - | yes |
| Create booking | own | yes | yes |
| View bookings | own only | all | all |
| Cancel booking | own, 24h rule | yes | yes |
| Today's bookings | - | yes | yes |
| Start / finish game, register result | - | yes | yes |
| Manage users and roles | - | - | yes |
| Statistics, CSV export | - | - | yes |

### Games (E4)
| ID | Rule |
|----|------|
| BR-G1 | Booking statuses add `IN_PROGRESS` and `COMPLETED` |
| BR-G2 | Allowed transitions: `PENDING`->`CONFIRMED`->`IN_PROGRESS`->`COMPLETED`. `PENDING`/`CONFIRMED`->`CANCELLED`. Anything else is 409 |
| BR-G3 | A game can only start on the booking's date, from `CONFIRMED` |
| BR-G4 | A result (`completed` bool, `completion_time` seconds) can be registered once, only when `COMPLETED` |
| BR-G5 | Client can see the result of their own booking |

### Lists and reporting (E5)
| ID | Rule |
|----|------|
| BR-L1 | List endpoints support `page` and `size` (default 1/20, max size 100) |
| BR-L2 | Bookings filter by `status`, `room_id`, `date_from`, `date_to`. Slots by `room_id`, `date`, `available` |
| BR-L3 | Admin exports bookings to CSV with the same filters |
| BR-L4 | Statistics: bookings per room, occupancy %, revenue per period |
| BR-L5 | BR-B7 extended: client can change slot if the new slot is bookable and 24h or more away |

## Out of scope (Phase 3, not committed)
Payments, discounts, loyalty points, `booking_players` (team members), pending-booking expiry, websockets, cloud deployment.

## Open decisions
| # | Question | Default we use until decided |
|---|----------|------------------------------|
| D-01 | Price per player or per room? | Per player (BR-B4) |
| D-02 | Where does the role live? | Our `users` table (BR-A3) |
| D-03 | Room with future bookings: block deactivation or cancel them? | Block (BR-R5) |
| D-04 | Do we need a minimum number of players? | No, only max `capacity` |
