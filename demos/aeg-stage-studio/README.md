# AEG · Stage Studio (demo prototype)

Clickable, mocked prototype of AEG "Idea 2: Generative Stage Design", built with Anvil UI. No real model calls.
Build plan: `docs/` (wireframes, Anvil component map, upgrade candidates).

## Anvil version

Consumed read-only from the sibling clone `~/anvil-ui` (override the path with `ANVIL_PATH`).

- **Anvil commit:** `ff85dba` (main, 2026-10-21)

## Conventions

- `@anvil/*` and `@/*` → Anvil's `src` (Anvil's own imports use `@/`). The app's own code uses `~/*`.
- Never edit, branch or commit in `~/anvil-ui`. Missing pieces are built in `src/components/local/` and logged in
  `docs/anvil-upgrade-candidates.md`.
- Tailwind `@source` in `src/styles/app.css` points at Anvil so its classes are generated.
- `tsconfig.app.json` pins `react` types to the app's copy, otherwise two `@types/react` copies break typechecking.

## How the app is organised

- **Projects** (left, collapsible like a chat history): one per show. Each has its own brief, loop and conversation.
  Three sample projects are seeded in different states; **Reset the demo** at the bottom of the list restores them.
- **New project** starts with the agent's brief interview (six questions). The brief fills in as you answer;
  **Start project** generates round 1.
- **The loop**: Stills → Motion → Review → Handoff, repeated version after version. The right rail shows where the
  project stands, the next step and the history.
- State is kept in `sessionStorage`: a reload keeps the demo where it was; a new tab starts fresh.

## Concept images

Concepts are rendered in the browser as real 3D scenes (three.js via React Three Fiber, in `src/scene/`): the stage,
its concept (arch, monolith, ribbons, halo), sky, haze, light beams and a crowd, lit for the chosen time of day and
seen from the chosen camera view. Stills are rendered once off-screen and cached for the session; Motion renders the
scene live, with the cue's camera move. No API key or network is needed. Without WebGL the app falls back to flat 2D
art. `/lab` (development only) shows the scenes side by side for tuning.

## Demo script

1. **New project**: click *New project* and answer the agent with the suggestion chips. Point out the brief filling in
   and the “From the agent” labels. Click *Start project*: round 1 renders, with the agent's reasoning in the chat.
2. **Stills** ([Artist A] · Coachella 2027): tick B1, type “B1: sharper top edge” in the chat, then *Put into motion*.
3. **Motion**: on song 14, type “slow the split” in the chat and watch the clip update to v2. *Send to artist*.
4. **Review**: the waiting state, then the artist's comments arrive. Click a pin, then *Request changes* or *Approve*.
5. **Handoff** ([Artist C] · Crypto.com Arena): the approved design, cue sheet, decision log and *Export package*.
6. Jump to [Artist B] · The O2 to show a project waiting on sign-off.

## Run

```bash
pnpm install        # from the repo root
pnpm stage-studio   # dev server
pnpm --filter aeg-stage-studio storybook   # local components only
```
