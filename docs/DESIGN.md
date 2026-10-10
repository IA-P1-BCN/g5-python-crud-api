# Design system (front)

Source of truth: the mockup `mockups/F-inmersivo.html` and `.css`. Ticket 086 (#150) turned it into tokens and shared components. Rule for everyone: **use the tokens, never the default Tailwind palette** (`bg-zinc-700`, `text-red-300`...). `src/styles/tokensOnly.test.js` fails if any file under `src/` does.

## Start here

**What it is.** The colours, fonts, sizes and basic components every screen shares, taken from the mockup `docs/mockups/F-inmersivo.html`. Every page is already dark with the right font and text size, so you never set a background, a font or a colour by hand.

**How it is organised**
- `front/src/index.css`: the tokens (`@theme`), the page defaults and the type scale.
- `front/src/main.jsx`: loads the fonts.
- `front/src/shared/ui/`: the components. Each one has a `.test.jsx` next to it that also shows how to use it.
- `front/src/i18n/es/<feature>.js`: all visible texts, used as `es.<feature>.key`.
- Guard tests in `front/src/styles/`: they fail if a colour, font or alias is wrong.

**How to use it from a screen**
```jsx
import Button from '@/shared/ui/Button.jsx'
import Badge from '@/shared/ui/Badge.jsx'
import Field from '@/shared/ui/Field.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import es from '@/i18n/es.js'

<h1 className="heading-title">{es.rooms.corridorLabel}</h1>
<Badge tone="confirmed">{es.booking.confirmed}</Badge>
<Button>{es.booking.reserve}</Button>
<Field label={es.auth.email} error={errors.email?.message} {...register('email')} />
<EmptyState title={es.rooms.empty} action={<Button>...</Button>} />
```
The `es.booking.*` and `es.auth.*` keys are examples: add yours to your feature file.

**What you can reuse**
- Styles: `bg-surface`, `text-muted`, `border-line`, `rounded-lg`, `font-display`, `heading-hero`, `heading-title`, `label-caps`, `dimmed`. Inside a room: `text-room`, `bg-room`, `bg-room-dark`.
- Components: `Button`, `Badge`, `Alert`, `Field`, `Spinner`, `EmptyState`, `Skeleton`, `Chip`, `Pagination`, `Toast`, `dialog`, `select` (details below).
- Hooks `useMediaQuery` and `useReducedMotion` in `shared/hooks/`, and the `cn` helper in `shared/lib/cn.js`.

**Where to find more**
- Where files go and import rules: `ARCHI.md`. Tools and libraries: `STACK.md`.
- Steps per ticket and Definition of Done: `CONTRIBUTING.md`. Who owns what: `WORK_SPLIT.md`.

**Watch out**
- A class that does not exist is ignored without any error. If a style does nothing, check the name in the tokens table.
- `className` adds or overrides styles (`<Button className="w-full">`).
- Not built yet: textarea, checkbox/switch, radio, `format.js` (prices and dates), `useCountdown`, `usePagination`, `mapApiError`. They come with the first ticket that needs them.
- Before the PR: `docker compose run --rm front-tools`. After pulling new dependencies: `docker compose restart front`.

## Tokens (`front/src/index.css`, block `@theme`)

| Group | Tokens | Use |
|---|---|---|
| Surfaces and text | `bg`, `surface`, `surface-2`, `line`, `text`, `muted` | `bg-surface`, `text-muted`, `border-line` |
| Primary action | `exit` (green), `on-exit` (text on it) | CTA button, selected slot |
| Room accent text, scrim | `on-room` (black text on `bg-room`), `scrim` (dark layer behind dialogs) | `Button room`, `Chip` selected, `Dialog` overlay |
| Booking states | `pending`, `confirmed`, `in-progress`, `done`, `cancelled` | `Badge` tones |
| Feedback | `error` | `Alert`, `Field`, `Toast` |
| Shapes | `radius-xs` 4, `sm` 6, `md` 8, `lg` 10, `pill` | `rounded-sm`, `rounded-lg`, `rounded-pill` |
| Glow | `shadow-glow` | CTA |
| Fonts | `font-display`, `font-sans`, `font-mono` | titles, body (default), codes and labels |
| Breakpoint | `md` = 800px (written `50rem`) | `md:flex-row` |
| Room theme | `room`, `room-dark` (from `data-room`) | accents inside a room |

## Page defaults and type scale

- `body` already has the dark background, `text` colour and `font-sans` at 17px/1.55: a page needs no setup.
- Headings and labels use utilities, not hand-made font classes: `heading-hero` (display, 38-72px), `heading-title` (display, 28px) and `label-caps` (11px, uppercase). `dimmed` greys out an inactive or full room (`opacity .38`, `grayscale .7`). Body text is the default; code and numbers use `font-mono`.
- The `md:` breakpoint is 800px (the only one in the mockup): below it, the mobile layout.

`contrast.test.js` checks the text/background pairs are at least 4.5:1 (WCAG AA): the base ones, the Badge tints, and each room theme (accent, dark, `on-room`). When you change a colour, that test tells you if it is still readable.

## Fonts

Self-hosted with `@fontsource`, imported in `main.jsx`. Import without `.css` (`@fontsource/big-shoulders-display/latin-700`): some packages do not export the `.css` form and the build breaks. The 3D door signs (`labelTexture.js`) use the display font, but a canvas does not trigger font loading: if a sign shows Impact, the font was not ready yet.

## Components (`front/src/shared/ui`)

| Component | Notes |
|---|---|
| `Button` | `primary` is the CTA (green, glow); `room` uses the room colour; `secondary`, `ghost`; `loading` blocks double submits |
| `Badge` | tones `neutral`, the five booking states and `error` |
| `Alert` | tones `error` (`role="alert"`), `success`, `info` (`role="status"`) |
| `Field` | label + input + error for React Hook Form: `<Field label="Email" error={errors.email?.message} {...register('email')} />` |
| `Spinner`, `EmptyState` | `Spinner label={es.common.loading}` is a status; without a label it is decoration (a loading `Button` shows one). `EmptyState` takes `title`, `description` and an `action` |
| `Toast`, `Chip`, `Pagination`, `Skeleton` | use the tokens; `Skeleton` respects `prefers-reduced-motion` |
| `dialog`, `select` | shadcn/ui, lowercase file names so `shadcn add` can update them |

## Adding a shadcn/ui component

1. From `front/`, in Docker: `npx shadcn@latest add <name>` (`components.json` is already set up for JavaScript).
2. Fix what the CLI gets wrong here: `import { cn } from "cn"` must be `../lib/cn.js` (and remove the fake `cn` package from `package.json`); use our `Button` (default export, variants above) instead of its own; remove `import * as React` if unused; texts come from `i18n`, not hardcoded English.
3. The shadcn class names (`bg-background`, `text-muted-foreground`, `ring-ring`...) already point to our tokens in the second `@theme inline` block of `index.css`. Careful: shadcn's `bg-muted` is a background, but our `text-muted` is a text colour, so use `bg-surface-2` for muted backgrounds. `shadcn.test.js` fails if a new alias is missing.
4. Write a render test next to it, like `dialog.test.jsx`.

Not built yet (the mockup has none; add them with the first screen that needs them, with shadcn): textarea, checkbox/switch, radio.

## Team rules

- **Colours:** only the tokens above (`bg-surface`, `text-muted`, `border-line`...), never the Tailwind palette (`bg-zinc-700`), `black`/`white` (`text-white`) or arbitrary values (`text-[#fff]`). `src/styles/tokensOnly.test.js` fails on every file under `src/`. No `dark:` variants: the site is always dark.
- **Components:** use the ones in `shared/ui` before writing your own. If your screen needs a new generic one, add it there with its test.
- **Texts:** visible texts come from `i18n/es/<feature>.js` (`es.<feature>.key`), never hard-coded in JSX. Generic ones go in `es.common`.
