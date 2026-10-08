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
| `chore` | tooling, config | `chore/project-skeleton` |
| `refactor` | no behaviour change | `refactor/slots-service` |

## Commits - Conventional Commits

`<type>(<scope>): <description>` - lowercase, imperative, no final period. Scope = resource.

```
feat(rooms): implement create room endpoint
test(rooms): add tests for create room
docs(api): document room endpoints
```

Code and its tests can be in the same commit or in two, as you prefer.

## Workflow per ticket - back

For tickets in `back/`. Front tickets (`front/`) follow the next section instead.

1. `git checkout develop && git pull && git checkout -b feat/<ticket>-<desc>`
2. Write the code and its tests together: one test per acceptance criterion of the User Story.
3. Run `pytest`: everything must be green.
4. Refactor if needed, tests still green.
5. `ruff check . && ruff format .`
6. Push, open PR **to `develop`**, link the issue (`Closes #n`).

Front equivalent of steps 3 and 5: see "Workflow per ticket - front" below (`docker compose run --rm front-tools`).

## Workflow per ticket - front

Same git flow as above (branch from `develop`, PR to `develop`). Differences:

1. Branch from `develop`, e.g. `feat/071-day-picker-slot-grid`. Commit scope: the feature (`feat(booking): ...`).
2. Write the tests first for pure logic (prices, slot states, 24h rule, game transitions, mappers, schemas): they must fail, then write the minimum code. Component tests use Testing Library + MSW.
3. Texts go in `front/src/i18n/es/<feature>.js` (Spanish), never hard-coded in components.
4. Respect the import rules (`ARCHI.md`, Frontend): use `@/...`, another feature only through its `index.js`. ESLint fails otherwise.
5. At the **end of the ticket, before the PR**, from the project root:

   ```bash
   docker compose run --rm front-tools
   ```

   It formats the code (Prettier), runs the linter (ESLint) and the tests (Vitest): the front equivalent of `ruff format` + `ruff check` + `pytest`. It rewrites badly formatted files: commit what it changed with your ticket (check `git status`). Variants: `... front-tools npm run format` (format only), `... front-tools npm run check` (verify only, changes nothing).
6. Open the PR to `develop` and link the issue.

The style (100 characters per line, no semicolons, single quotes) lives in the repo, so personal editor settings do not matter. VS Code: accept the recommended extensions (Prettier, ESLint, Ruff); the shared `.vscode/settings.json` formats on save.

## Pull requests

- Target: `develop`.
- At least **1 review** from another teammate before merge.
- Run `pytest` and `ruff check` locally before opening the PR: both must pass (no CI pipeline for now). Front PRs: `docker compose run --rm front-tools` must pass.
- Author does not merge their own PR without approval.
- Small PRs: one ticket per PR.
- Fill the PR template checklist.

## Definition of Done

- [ ] Tests written with the code, green, covering success + each business-rule error
- [ ] Endpoint visible and documented in Swagger (`summary`, `description`, responses)
- [ ] Business rules referenced by ID (`BR-xx`) in tests
- [ ] No secrets committed, new env vars added to `.env.example`
- [ ] Logging and error format respected (BR-X1, BR-X3)
- [ ] Reviewed and approved by a teammate
- [ ] Front tickets: `docker compose run --rm front-tools` passes (format, lint, tests) and texts are in `i18n/es/`
- [ ] Ticket moved to Done on the board

## Board

Project `escape_room_project`. Columns: Backlog -> Ready -> In progress -> In review -> Done.
Every issue has: Epic, Sprint, Kind, Size, Assignee and Milestone. Move your own card when its state changes.
