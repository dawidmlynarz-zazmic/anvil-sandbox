# AEG · Stage Studio (demo prototype)

Clickable, mocked prototype of AEG "Idea 2: Generative Stage Design", built with Anvil UI. No real model calls.
Build plan: `docs/` (wireframes, Anvil component map, upgrade candidates).

## Anvil version

Consumed read-only from the sibling clone `~/anvil-ui` (override the path with `ANVIL_PATH`).

- **Anvil:** follows `main` (last checked against `16e2b76`, 2026-10-22). Locally it reads your `../anvil-ui` clone;
  the hosted preview builds against Anvil's `main` on every deploy.

## Conventions

- `@anvil/*` and `@/*` → Anvil's `src` (Anvil's own imports use `@/`). The app's own code uses `~/*`.
- Never edit, branch or commit in `~/anvil-ui`. Missing pieces are built in `src/components/local/` and logged in
  `docs/anvil-upgrade-candidates.md`.
- Tailwind `@source` in `src/styles/app.css` points at Anvil so its classes are generated.
- `tsconfig.app.json` pins `react` types to the app's copy, otherwise two `@types/react` copies break typechecking.

## How the app is organised

The show is designed one key moment (a song) at a time, on one shared set. See `docs/plan-moments.md`.

- **Home** (`/`): every project as a card, plus **New project**. The sidebar keeps the projects at hand inside a
  project; **Reset the demo** at its bottom restores the seeded start.
- **Brief**: the agent asks three questions in one card (stage, roughly when, the look), then any no-gos. Venues are
  real AEG venues and festival stages, with the facts aegworldwide.com publishes; technical specs are labelled samples.
  **Build the show** drafts the key moments from the setlist and starts exploring the first.
- **Show board** (`/show`): the set, every key moment in setlist order (its light, look and status), running metrics,
  and **Send the show to the artist** once every moment has a look.
- **Moment page** (`/m/:song`): explore in batches (new directions, more like this, other angles, other light), pin,
  compare any two to four, change an image in words or with pinned notes (each change is a new image, with its
  lineage), choose the look, lock the set from it, and check the moment's clip. The **Assets** tab builds the moment's
  kit from its look: angles, light states and motion variants, each with its provenance (LED loops and performer
  stand-ins are listed as coming with the pilot models).
- **Preview the show** (on the show board) plays every moment's clip in setlist order.
- **Venue checks**: every design's footprint (size, weight, flown load, wind area) is checked against the venue's
  sample limits: stage width, trim, rigging, sightlines, no-gos and, for open-air stages, evening gusts. The checks show
  on each image's badge, before locking the set, on the show board and in Handoff (`src/services/venueCheck.ts`).
- **Review**: the artist comments per moment (on the look or the clip) and approves the show once. **Request changes**
  starts new looks for the moments they commented on.
- **Handoff**, organised by trade: an overview with the value to prove and the credits (who decided what), then
  staging and rigging, lighting, video and LED, camera, and rights with the decision log.
- The progress rail shows the loop, each key moment, and a running **So far** (looks, images, kits, reviews, days).
- State is kept in `sessionStorage` (key `stage-studio:v3`): a reload keeps the demo where it was; a new tab starts fresh.

## Concept images

Stage images are rendered in the browser as real 3D scenes (three.js via React Three Fiber, in `src/scene/`): the stage,
its concept (arch, monolith, ribbons, halo), sky, haze, light beams and a crowd, lit for the light each moment plays in and
seen from the chosen camera view. Images are rendered once off-screen and cached for the session; clips render the
scene live, with the cue's camera move. No API key or network is needed. Without WebGL the app falls back to flat 2D
art. `/lab` (development only) shows the scenes side by side for tuning.

## Demo script

See [docs/demo-script.md](docs/demo-script.md): about three minutes, following deck slide 6.

## Run

```bash
pnpm install        # from the repo root
pnpm stage-studio   # dev server
pnpm --filter aeg-stage-studio storybook   # local components only
```
