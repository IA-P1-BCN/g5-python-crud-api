# CONTRIBUTING

## Branch model

```
main      <- only receives PRs from develop, when develop works
develop   <- integration branch, ALL feature PRs target this
feat/...  <- one branch per ticket, created from develop
```

**Rule: PRs always go to `develop`. Never push directly to `develop` or `main`.**
`develop` -> `main` only for a working delivery (end of each sprint), reviewed by the whole team.

## Branch names

`<type>/<ticket-id>-<short-description>`, type matches Conventional Commits.

| Type | Use | Example |
|------|-----|---------|
| `feat` | new feature | `feat/US-06-create-room` |
| `fix` | bug fix | `fix/US-15-cancel-24h-rule` |
| `test` | tests only | `test/US-12-booking-rules` |
| `docs` | documentation | `docs/project-documentation` |
| `chore` | tooling, config | `chore/TECH-03-ci-pipeline` |
| `refactor` | no behaviour change | `refactor/slots-service` |

## Commits - Conventional Commits

`<type>(<scope>): <description>` - lowercase, imperative, no final period. Scope = resource.

```
test(rooms): add failing tests for create room
feat(rooms): implement create room endpoint
docs(api): document room endpoints
```

TDD leaves a readable history: a `test` commit (red) followed by a `feat` commit (green).

## TDD workflow per ticket

1. `git checkout develop && git pull && git checkout -b feat/US-xx-name`
2. Write tests first. Run `pytest`: they must FAIL (RED).
3. Write the minimum code to pass. Run `pytest`: GREEN.
4. Refactor if needed, tests still green.
5. `ruff check . && ruff format .`
6. Push, open PR **to `develop`**, link the issue (`Closes #n`).

## Pull requests

- Target: `develop`.
- At least **1 review** from another teammate before merge.
- CI (pytest + ruff) must be green.
- Author does not merge their own PR without approval.
- Small PRs: one ticket per PR.
- Fill the PR template checklist.

## Definition of Done

- [ ] Tests written first, now green, covering success + each business-rule error
- [ ] Endpoint visible and documented in Swagger (`summary`, `description`, responses)
- [ ] Business rules referenced by ID (`BR-xx`) in tests
- [ ] No secrets committed, new env vars added to `.env.example`
- [ ] Logging and error format respected (BR-X1, BR-X3)
- [ ] Reviewed and approved by a teammate
- [ ] Ticket moved to Done on the board

## Board

Project `escape_room_project`. Columns: Backlog -> Ready -> In progress -> In review -> Done.
Every issue has: Epic, Sprint, Kind, Size, Assignee and Milestone. Move your own card when its state changes.
