# Battleship by Raja

A deliberately simple, single-page Battleship game: you against a computer
opponent, in the browser, with no backend. Built as the subject of a
software-engineering empathy exercise, so the development bug log
([BUGS.md](BUGS.md)) is part of the deliverable.

## Rules implemented

- Two 10×10 boards; standard fleet (Carrier 5, Battleship 4, Cruiser 3,
  Submarine 3, Destroyer 2), placed randomly, horizontal or vertical, fully
  on the board, never overlapping (ships may touch).
- Your ships are shown; the enemy's are hidden until sunk.
- Click a cell in **Enemy waters** to fire. The AI fires back automatically
  half a second later.
- Cell feedback: miss = ring, hit = orange ✕, sunk = red ✕ on every cell of the
  ship. Each board title carries a `ships remaining / 5` badge and a fleet list
  (your own list also shows damage per ship; the enemy's shows only
  Afloat/Sunk).
- Neither side can fire at the same cell twice. The game locks when one fleet
  is fully sunk; **New Game** resets everything.

## Architecture

Vite + React 19 + TypeScript. Everything runs client-side; the build is static
files.

```
src/
  game/            pure, framework-free logic (all unit tested)
    types.ts       Board, Ship, Coord, GameState, FLEET constants
    board.ts       placeFleetRandomly, receiveAttack (immutable), isSunk, allSunk
    ai.ts          chooseAiTarget: hunt (random untried cell) → target
                   (untried neighbours of a hit on an unsunk ship)
    engine.ts      newGame, humanAttack, aiAttack: turn order, duplicate-shot
                   rejection, win detection, move log
    quips.ts       deadpan one-liner per shot outcome
  components/
    BoardView.tsx  one 10×10 grid of <button> cells (+ shared Legend)
    FleetStatus.tsx ship name + Afloat/Sunk rows
  App.tsx          holds the GameState, schedules the AI turn, renders layout
```

The React layer contains no rules: it calls `humanAttack` / `aiAttack` and
renders whatever `GameState` comes back. Randomness is injected (`rng`
parameter) so placement, the AI and quips are deterministic in tests.

## Run locally

Requires Node 22 (see `.nvmrc`; Node ≥ 20.19 also works).

```sh
nvm use            # or: nvm install 22
npm install
npm run dev        # http://localhost:5173
```

## Test, lint, build

```sh
npm test           # Vitest: 27 tests (placement over 500 seeds, attacks,
                   # sinking, AI never repeats a cell, turn/win logic, UI)
npm run lint       # oxlint
npm run typecheck  # tsc -b
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
```

## Deployment

The app is static, so any static host works. The repo ships with a GitHub
Pages workflow, `.github/workflows/deploy.yml`, which on every push to `main`
runs tests, lint and build, then publishes `dist/` to Pages. The public URL is
`https://<user>.github.io/<repo>/`.

Vite needs to know the base path when the site is not served from `/`; the
workflow sets `BASE_PATH=/<repo>/` and `vite.config.ts` reads it. Vercel and
Netlify serve from `/` and need no extra config: build command `npm run
build`, output directory `dist`.

To enable Pages once: repository **Settings → Pages → Build and deployment →
Source: GitHub Actions**. After that the workflow deploys on each push to
`main`.

## Bug log

See [BUGS.md](BUGS.md) for every real bug hit during development: symptom,
expected behaviour, root cause, fix and how it was verified.
