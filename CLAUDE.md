# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Acknowledgment rule

When this file is read or used to inform a response, you MUST include the following line at the very start of your response (before any other content):

> **[CLAUDE.md used]**

## Commands

```bash
npm run dev          # Vite dev server at http://localhost:3000 (HMR)
npm run build        # Production build → dist/
npm run preview      # Preview the production build locally
npm test             # Run all unit tests once (Vitest + happy-dom)
npm run test:watch   # Tests in watch mode
npm run test:coverage
npm run lint         # ESLint over src/ and tests/
npm run format       # Prettier (writes)
```

Single test file:

```bash
npx vitest run tests/utils/swipe-detector.test.js
```

Mobile builds (after `npm run build`):

```bash
npm run cap:sync       # Sync web assets to native projects
npm run cap:android    # Open Android Studio
npm run cap:ios        # Open Xcode
```

`android/` and `ios/` directories are gitignored — initialise them on a new
machine with `npx cap add android` / `npx cap add ios`.

## Stack

**Vanilla JS** + **Vite** + **Capacitor**. The whole UI is **DOM elements
with CSS animations** — no canvas, no game-engine frame loop. Everything
lives in CSS pixels, so the safe-zone box (`layout.safe.*`) and the visible
DOM share one coordinate system.

When a game needs physics, install **`matter-js`** standalone
(`npm i matter-js`) and run a `requestAnimationFrame` loop inside the scene
that needs it. The template intentionally does not bundle a renderer or a
physics engine: pay only for what your game uses.

JavaScript only (no TypeScript). Use JSDoc for types.

## Git Conventions

This project follows **Conventional Commits** standard for commit messages:

```
type(scope): description
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `refactor` — code changes without feature or bug changes
- `style` — formatting, missing semicolons, etc.
- `test` — adding or updating tests
- `docs` — documentation changes
- `chore` — build process, dependencies, tooling
- `perf` — performance improvements

**Scope (optional):**
Any module area: `modal`, `manager`, `scene`, `entity`, etc.

**Examples:**
```
feat(modal): add close animation
fix(input): prevent double-swipe detection
refactor(layout): extract safe-zone calculation
test(swipe-detector): add edge case coverage
docs(architecture): update guide
```

## Orientation

The active orientation is a **single constant** in
[src/configs/constants.js](src/configs/constants.js):

```js
export const ORIENTATION = ORIENTATIONS.PORTRAIT;
```

Change that one line to switch the entire game. The constant drives:

- `LayoutManager` — picks the right `SAFE_ZONE.MAX_WIDTH_*` /
  `MAX_HEIGHT_*` caps. The safe-zone box is **always centered on both
  axes** within the available viewport, regardless of orientation.
- `[data-orientation]` attribute on `<html>` — CSS can target via
  `:root[data-orientation='portrait']` etc.

Avoid hardcoding "portrait" anywhere else — branch on `ORIENTATION` instead.

## Visual identity

The template ships **no theme system**. The whole game uses a single set
of design tokens defined in [src/styles/tokens.css](src/styles/tokens.css)
(colors, radii, shadows, spacing, typography). To rebrand, edit those
values once. There is intentionally no `data-theme` switcher and no
`themeManager` — keeping the visual identity unique is part of the goal.

CSS code must always reach for `var(--gt-…)` tokens; never hardcode hex
colors or pixel radii in component stylesheets.

## Dev affordances

Two dev-only affordances ship with the template and are tree-shaken from
production builds:

- **Safe-zone overlay** — a dashed outline of the current safe-zone box
  with a live width × height readout, useful while iterating on layout.
  Installed by `src/utils/dev-overlay.js`, dynamically imported from
  `main.js` behind `import.meta.env.DEV`.
- **Style guide scene** — a visual library that demonstrates every UI
  primitive (color tokens, button variants, toggles, sample modal,
  keyframes). Use it to develop new components in isolation: build the
  primitive against this scene first; once it looks right here, it will
  look right everywhere because every other view goes through the same
  primitives. Reach it via the dev nav bar (visible only in DEV builds).
  Implementation in
  [src/scenes/styleguide-scene.js](src/scenes/styleguide-scene.js); the
  scene is dynamically imported from `main.js` so it never enters the
  production bundle.

## Architecture

### Layer separation

| Layer            | Location              | Rule                                                               |
| ---------------- | --------------------- | ------------------------------------------------------------------ |
| **Configs**      | `src/configs/`        | All constants live in `constants.js` — never hardcode magic values |
| **Entities**     | `src/entities/`       | Pure data/logic, **zero** DOM dependency                           |
| **Managers**     | `src/managers/`       | Singletons for cross-cutting concerns                              |
| **Controllers**  | `src/controllers/`    | Orchestrate managers for one play session — keep scenes thin       |
| **Components**   | `src/components/`     | DOM-based UI overlays (modals, HUD)                                |
| **Scenes**       | `src/scenes/`         | Plain classes with `mount(root)` / `destroy()` — delegate to controllers |
| **Utils**        | `src/utils/`          | Pure helpers and small reusable classes                            |
| **Locales**      | `src/locales/`        | Translation dictionaries — `en.js`, `fr.js`                        |
| **Styles**       | `src/styles/`         | One CSS file per component — imported from `index.css`             |

### Boot + scene flow

`main.js` wires `LayoutManager` to `window.resize`, warms the audio pool,
instantiates a `SceneRouter` on `#game-container`, and starts `TitleScene`.
The title scene listens for the first user gesture, unlocks audio, and asks
the router to start `GameScene`. `GameScene` is intentionally a few-line
shell that delegates everything to `GameController`.

A scene is a plain JS class with this contract:

```js
class MyScene {
  constructor(router, data) { … }
  mount(rootElement) { … }   // build/append DOM
  destroy()         { … }   // tear it all down (idempotent)
}
```

The router (`src/scenes/scene-router.js`) owns one DOM child of
`#game-container` per active scene and disposes the previous one before
mounting the next. There is no shared game loop; if a scene needs
`requestAnimationFrame` (gameplay, animation, Matter.js), it runs its own
loop and stops it from `destroy()` via the scene's `ListenerBag`.

### Managers (singletons)

All managers are imported as lowercase named exports — for example
`import { layout } from './managers/layout-manager.js'`.

- **`layout`** — computes safe-zone metrics from the viewport on every
  resize, publishes them as CSS custom properties (`--gt-safe-top`, etc.) so
  stylesheets stay free of hardcoded values. Subscribers register via
  `layout.onChange(cb)` and receive the manager itself.
- **`i18n`** — translation lookup (`i18n.t('key')`) with `{var}`
  interpolation, locale persistence in `localStorage`, and a `setLocale()`
  / `onChange()` API. Default locale is sniffed from `navigator.language`
  and falls back to `en`.
- **`optionsManager`** — single source of truth for user preferences
  (music, sound, animSkip, …) persisted under one localStorage key.
  Side-effecting managers like `audioManager` subscribe via
  `optionsManager.on('change:music', …)` — they never write a different
  source of truth.
- **`audioManager`** — HTML5 Audio for music + SFX. Reads music/sound
  toggles from `optionsManager`, gates playback until `unlock()` is called
  on the first user gesture (browser autoplay policy). Adds a global
  `pointerdown` delegate on `.gt-btn` / `.gt-clickable` for click SFX —
  add `data-no-sfx` to opt out.
- **`saveManager`** — generic persistence: `saveAuto`/`loadAuto`,
  `saveSlot`/`loadSlot` (fixed-size slot array), `addRanking`/`getRankings`
  (per-mode top-N), and `resetAll`.
- **`InputManager`** — non-singleton (one per scene). Handles keyboard
  (arrows / WASD / Escape) directly on `window` and delegates touch to
  `SwipeDetector`. Touches on UI elements matching
  `InputManager.UI_SELECTOR` fall through to the browser.

### Input / swipe

The swipe detector uses a **detect-on-move** architecture:

- Direction fires during `touchmove` as soon as the finger crosses
  `SWIPE_THRESHOLD` px from the start position.
- A `#fired` flag enforces **one direction per gesture** (no time-based
  cooldown).
- Ghost events from Android WebView / Capacitor are rejected structurally:
  their near-zero displacement never crosses the threshold.
- A `touchend` fallback covers the case where `touchmove` was throttled.

The implementation lives in `src/utils/swipe-detector.js` and is **fully
unit-testable** in happy-dom. `InputManager` only adapts it to keyboard
input.

### ListenerBag — the listener-leak rule

Every component that adds DOM listeners owns a `ListenerBag` and calls
`bag.dispose()` from its `destroy()` method. Wrapped APIs:

- `bag.on(target, type, handler, options?)` — adds and queues removal
- `bag.add(unsubscribeFn)` — for any teardown function
- `bag.timeout(fn, ms)` / `bag.interval(fn, ms)` — auto-cancelled
- `bag.raf(fn)` — auto-cancelled

Code review checklist: any `addEventListener` that is not routed through a
`ListenerBag` is a bug. Same rule for `setTimeout`, `setInterval`, and
`requestAnimationFrame` inside a destroyable object.

### Modals — BaseModal

Every modal extends `BaseModal` (`src/components/modal-base.js`). It
provides:

- The `.gt-modal-overlay > .gt-modal` shell, mounted directly on
  `document.body` (overlay is `position: fixed`).
- Lifecycle (`open`, `close`, `destroy`) and idempotent `dispose`.
- Backdrop / Escape close.
- Keyboard navigation via `enableKeyboardNav`.
- Auto-refresh on locale change.
- A pre-wired `ListenerBag` on `this.bag` for subclasses.

Subclasses implement only `renderBody()`, `onAction(name, event)`, and
optionally `onMount()`. See `MenuModal` and `OptionsModal` for the canonical
patterns. Modals do not depend on the active scene — `new MyModal(opts)`
opens directly.

### Controllers — keeping scenes thin

`GameScene` exists to instantiate `GameController` and pass it the DOM
root + router. All gameplay logic — input wiring, manager subscriptions,
sub-modal opening, layout reactions — lives on the controller, which owns
its own `ListenerBag`. **If `GameScene` grows past ~150 lines, push the
new behaviour into the controller or a new manager.**

### Styles — one file per concern

Avoid the giant-monolithic-stylesheet trap. The CSS is split:

```
src/styles/
├── index.css            # imports each module
├── tokens.css           # design tokens (colors, radii, shadows, spacing)
├── base.css             # reset, fonts, html/body, safe-area bridge
├── layout.css           # safe-zone container, .gt-stack, .gt-row
├── animations.css       # keyframes only
├── dev.css              # dev-only overlays (only mounted in DEV)
└── components/
    ├── button.css
    ├── modal.css
    ├── toggle.css
    ├── title.css
    └── styleguide.css   # dev-only Styleguide scene
```

Adding a new component? Add `components/<name>.css` and `@import` it from
`index.css`. A component's stylesheet should never reach above ~250 lines —
if it does, split by sub-feature.

CSS comments are single-line only (`/* --- Section title --- */`); no
multi-line block comments. Always use `var(--gt-…)` tokens — no hex codes.

### Persistence

Storage keys are namespaced with `APP_ID` via the `STORAGE_KEYS` map in
`constants.js`. **Never** call `localStorage.setItem` with a literal key —
always go through `STORAGE_KEYS` (and ideally through `saveManager` /
`optionsManager`).

## Opus workflow

When **Claude Opus** is selected for a task, follow this checklist for each request:

1. **Re-read the project documentation** — review relevant sections of this CLAUDE.md and understand the existing patterns
2. **Reflect on the request** — think deeply about the best approach and architecture before starting
3. **Create unit tests** — write comprehensive tests first to define expected behavior
4. **Create the code** — implement based on the test specifications
5. **Validate with tests** — ensure all tests pass and code is correct
6. **Update documentation** — modify md files and/or code comments as needed

This workflow ensures quality, maintainability, and alignment with project standards.

## Command approval rules

The agent can execute the following command categories **without requesting user consent**:

- **File utilities**: `cp`, `mv`, `rm`, `ls`, `cat`, `mkdir`, `find`, `du`, etc.
- **Text processing**: `sed`, `grep`, `awk`, `cut`, `sort`, `uniq`, `tr`, etc.
- **Build & package management**: `npm`, `npm run`, `npx`, `npm test`, `npm run build`, etc.
- **Dev server**: `npm run dev`, `npm run preview`
- **Linting & formatting**: `npm run lint`, `npm run format`
- **Testing**: `npm test`, `npm run test:watch`, `npx vitest`, etc.

**Requires user approval:**

- **All Git commands**: `git commit`, `git push`, `git pull`, `git reset`, `git checkout`, `git branch`, etc.

## Code conventions

- **JavaScript only** — no TypeScript. Use JSDoc for types.
- **File names**: kebab-case (`game-controller.js`). Exported class names
  stay PascalCase.
- `const` over `let`, never `var`. ES2022+ (private class fields, optional
  chaining, nullish coalescing).
- **No barrel files** — there are no `index.js` re-export files. Always import
  directly from the source file: `import { layout } from '../managers/layout-manager.js'`,
  never `import { layout } from '../managers/index.js'`. This keeps dependency
  paths explicit and avoids circular-reference risks.
- Tests live under `tests/` mirroring `src/`. Test files are
  `<name>.test.js`.
- All code, comments and documentation in English. CSS comments are
  single-line.
- CSS class prefix: `gt-` (game template). Rename project-wide if you fork.

## Adding new things

| Need                | Where it goes                                                    |
| ------------------- | ---------------------------------------------------------------- |
| A constant          | `src/configs/constants.js`                                       |
| A pure helper       | `src/utils/<name>.js` (+ test in `tests/utils/`)                 |
| A cross-cutting svc | `src/managers/<name>-manager.js` (singleton, EventEmitter-based) |
| A modal             | `src/components/<name>-modal.js` extending `BaseModal`           |
| A UI primitive      | `src/components/ui/<name>.js` (HTML-string builder)              |
| A keyframe          | `src/styles/animations.css`                                      |
| A locale string     | Add the key to **both** `src/locales/en.js` and `fr.js`          |
| A new scene         | `src/scenes/<name>-scene.js` (plain class with `mount/destroy`) — start it via `router.start(MyScene)` |
| A new UI primitive  | Add it to `src/components/ui/`, then add a sample to `StyleguideScene` so it can be developed in isolation. |
