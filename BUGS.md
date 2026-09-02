# Bug log

Every meaningful problem hit while building and testing the game, in the order
it was found. Only real issues are recorded here; nothing was added for show.

| # | Pass | Bug | Kind | Regression test |
|---|------|-----|------|-----------------|
| 1 | v1 | Dev server/linter crash: missing native binding | tooling | `.nvmrc`, CI uses Node 22 |
| 2 | v1 | Boards stacked vertically on desktop | layout | manual (Playwright layout check) |
| 3 | v1 | Newest-first log rendered as numbered list | UI | — |
| 4 | v1 | Component tests leaked DOM between tests | tests | `test-setup.ts` cleanup |
| 5 | 2 | Enemy fleet panel revealed per-ship damage | game info leak | `App.test.tsx` |
| 6 | 2 | Enemy board ~800px below the fold on phones | mobile layout | manual (375/320px check) |
| — | 3 | Sink behaviour questioned; verified correct, no bug | verification | `engine.test.ts` sink walkthrough |

---

## Pass 1 — first working version

## 1. Dev server and linter crashed: "Cannot find native binding"

- **Observed:** `npm run dev` and `npm run lint` both died immediately with
  `Cannot find native binding … Cannot find module '@rolldown/binding-linux-x64-gnu'`
  (and the same for `@oxlint/binding-linux-x64-gnu`). `tsc` was fine.
- **Expected:** Fresh `npm install` followed by `npm run dev` should start Vite.
- **Root cause:** The machine had Node 20.18.1 / npm 10.8.2. Vite 8 (rolldown)
  and oxlint declare `engines.node: ^20.19.0 || >=22.12.0`, and with the older
  npm the platform-specific optional dependencies that hold the native binaries
  were silently skipped during install (npm/cli#4828). Installing the binding
  by hand "fixed" oxlint but not rolldown, which confirmed the install itself
  was the problem rather than one package.
- **Fix:** Use Node 22 (`nvm use 22`), delete `node_modules` +
  `package-lock.json`, reinstall. Added `.nvmrc` (`22`) so the version is
  explicit for contributors and CI.
- **Verified:** `npm run dev`, `npm run lint`, `npm run build` all succeed on
  Node 22.23; `package-lock.json` now lists the linux-x64 bindings.

## 2. The two boards stacked vertically instead of side by side

- **Observed:** On a 1568px-wide window, "Enemy waters" rendered *below*
  "Your fleet" (screenshot: `Your fleet` top at y=86, `Enemy waters` at y=584),
  forcing the player to scroll between their board and the target board.
- **Expected:** Both 10×10 boards side by side on any desktop-width screen;
  wrap only on narrow screens.
- **Root cause:** Each column wrapper's intrinsic width was decided by its
  widest child. The fleet legend (`Carrier (5) Battleship (4) …`) is a flex row
  with `flex-wrap: wrap`, whose *max-content* width (~480px, all names on one
  line) is wider than the board (~380px). Two 480px columns plus the gap
  exceeded the 1000px container, so `flex-wrap` on `.boards` kicked in.
- **Fix:** `.boards > div { width: min-content }` so the column is sized by the
  board, and `.fleet { width: 100% }` so the legend fills and wraps inside
  that width instead of dictating it.
- **Verified:** Re-ran the Playwright layout check: both board tops now at
  y=86. Legend wraps to two lines under each board as intended.

## 3. Move log numbering was misleading

- **Observed:** The log shows newest events first, but was rendered as an
  ordered list, so the most recent shot was labelled "1." and older shots got
  higher numbers — reading like reversed turn numbers.
- **Expected:** No implied ordering that contradicts the actual sequence.
- **Root cause:** `<ol>` used for a newest-first list.
- **Fix:** Switched to `<ul>` with `list-style: none`; the list is newest-first
  and the latest shot is also echoed in the status row.
- **Verified:** Visual check in the browser.

## 4. Component tests failed with "Found multiple elements"

- **Observed:** Second and third `App` tests failed:
  `getByRole('heading', { name: 'Enemy waters' })` found several headings.
- **Expected:** Each test renders one fresh `<App />`.
- **Root cause:** `@testing-library/react` auto-cleans between tests only when
  a global `afterEach` exists; Vitest was configured without `globals: true`,
  so previous renders stayed mounted in the shared jsdom document.
- **Fix:** `src/test-setup.ts` now registers `afterEach(cleanup)` explicitly.
- **Verified:** `npm test` — 22/22 tests pass, run twice to confirm stability.

---

## Pass 2 — battle-feedback polish (hits/misses/sunk, fleet status, mobile)

## 5. Enemy fleet legend would have leaked per-ship damage

- **Observed:** While adding hit "pips" and a `hits/length` readout to the
  fleet legend, the first version showed the same data for the enemy fleet.
  After one hit you could read *which* enemy ship you had hit (e.g.
  "Carrier 1/5"), which the real game never reveals and which makes the AI's
  hidden board far easier to solve.
- **Expected:** Enemy legend reveals only Sunk / Afloat; your own legend can
  show damage.
- **Root cause:** One shared `FleetStatus` component rendered identical
  detail for both boards.
- **Fix:** Added a `showDamage` prop; the enemy legend passes `false`, so pips
  stay neutral and the state reads "Afloat" until a ship is sunk.
- **Verified:** New `App` test asserts the enemy legend shows five "Afloat"
  rows and no `n/5 hit` text at game start; the own-fleet legend shows
  `0/5 hit`. Visually confirmed mid-game (screenshot: enemy shows
  Sunk/Afloat only while own fleet shows `2/5 HIT`).

## 6. Enemy board below the fold on phones

- **Observed:** At 375px wide the boards stack (as intended), but "Your fleet"
  came first, so the board you actually click was ~800px down the page and
  every turn required scrolling past your own board.
- **Expected:** On narrow screens, the enemy board (the interactive one) is
  first; on desktop the conventional own-left / enemy-right layout stays.
- **Root cause:** DOM order matched the desktop layout; no responsive
  reordering.
- **Fix:** `@media (max-width: 850px) { .boards > div:last-child { order: -1 } }`.
  The breakpoint is the width at which the two columns stop fitting
  side-by-side (measured: side-by-side at 860px, wrapped at 850px), so the
  swap only happens when the boards actually stack.
- **Verified:** Playwright check at 1280/900/860 → side by side, own fleet
  left; at 850/840/375/320 → stacked, enemy first; `scrollWidth` ≤ viewport
  at every width (no horizontal scroll). Screenshot at 375×812 confirms the
  full enemy board and legend are visible without scrolling.

### Not bugs, but checked in this pass

- Full game played in the browser (sequential targeting, AI won 58 shots to
  58). At every turn: `Enemy ships remaining` equalled `5 − sunk rows`, and
  the number of sunk-styled cells equalled the total length of the ships listed
  as sunk. Cell glyph always matched its class (miss / hit / sunk; at the time
  ○ / ✕ / ☠, simplified in pass 3 to ring / ✕ / red ✕).
- 0 clickable enemy cells after game over; no console or page errors.
- Board cell size is `min(2.2rem, (100vw − 3rem)/11)` so a 10×10 grid fits
  down to 320px.

---

## Pass 3 — UI simplification, quips, explicit sink verification (no bug found)

Question raised: a test game accumulated many enemy hits while the enemy
count stayed at 5/5. Verified rather than assumed.

- **Method:** temporary `?reveal` query flag (since removed) rendered the
  enemy ships so one could be targeted deliberately. A Playwright script read
  the revealed cells, chose the ship at A7–A10 (the Battleship), and fired at
  each cell in turn while the AI replied between shots.
- **Result:** shots 1–3 → aria-label `hit`, class `cell hit`, badge `5 / 5`;
  shot 4 → `A10: hit, Battleship sunk`, class `cell sunk`, badge `4 / 5`, fleet
  row `Battleship → SUNK`; all four cells (and only those four) switched to the
  sunk style; sunk cells stay disabled; the next shot on water registered a
  miss with the badge still `4 / 5`; no console errors.
- **Regression test:** `engine.test.ts › sinking one known enemy ship` — hits
  the seeded Cruiser cell by cell and asserts `hit`/`hit`/`sunk`, quip,
  remaining 5→4, other ships undamaged, game continues.
- **Why 5/5 earlier was plausible:** ships may be placed adjacent to each
  other (only overlap is forbidden). Hits spread over several ships — e.g.
  9 hits as 1+2+2+2+2 across all five — sink nothing, since a ship sinks only
  when *all* of its cells are hit. In the revealed board above, two ships were
  adjacent (D2/E2 next to D4–F4), which makes scattered hits common.

### Also checked in this pass

- Game without reveal until the first sink (Carrier): badge always equalled
  `5 − sunk rows`; a quip appeared after every one of 17 shots; sunk cells = 5.
- Layout at 1280 (side by side), 375 and 320 (stacked, enemy first, 0px
  horizontal overflow); single legend; title `Battleship`.
