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

The show is designed one key moment (a song) at a time. See `docs/plan-moments.md`.

- **Home** (`/`): every project as a card, plus **New project**. The sidebar keeps the projects at hand inside a
  project; **Reset the demo** at its bottom restores the seeded start.
- **Brief**: Gemini (the agent in the chat) asks three questions in one card (stage, roughly when, the look), then any no-gos. Venues are
  real AEG venues and festival stages, with the facts aegworldwide.com publishes; technical specs are labelled samples.
  **Generate show** (top right) drafts the key moments from the setlist, opens the show board and starts exploring the first.
- **Show board** (`/show`): one line of running numbers (with a link back to the brief), every key moment in setlist
  order (its look, one status and one line of detail). Top right: **Preview** and **Generate handoff** (once every song
  is in motion). After a handoff, the board also offers **Save** (keep the edits, leave the handoff as it was) and says
  when the show no longer matches the latest handoff.
- **Moment page** (`/m/:song`). A song with no images opens on a prompt: describe the stage (or start from a
  suggestion) and the agent makes four images from it; naming a design or a colour, size, haze or brightness steers
  them, and the agent says what the preview couldn't show. Then the images: new directions, or more like / other angles / other light of the
  open image from one menu; change an image in words (each change is a new image; its lineage,
  provenance and compare-with-parent are in the card's menu); **Generate motion** (on the open image's card) makes it the moment's look, scrolls up to
  its clip and the clip leads the page from then on (cues, plain-word edits).
- Key moments are numbered 1, 2, 3… in setlist order. Each one's light comes from where it falls in the set (the
  moments are spread across the slot), so the first moments of a sunset set play in golden hour and the last at night.
- **Preview** (on the show board) plays every moment's clip in setlist order.
- **Venue checks**: every design's footprint (size, weight, flown load, wind area) is checked against the venue's
  sample limits: stage width, trim, rigging, sightlines, no-gos and, for open-air stages, evening gusts. The checks show
  on each image's badge, on the show board and in Handoff (`src/services/venueCheck.ts`).
- **Handoff** (`/handoff`): the package as it was generated (a snapshot; versions v1, v2…), organised by trade: an
  overview (every song's look and what the package contains), then staging and rigging, lighting, video and LED,
  camera, and rights with the credits. Top right: **Edit show** (back to the show board), **Preview** and **Export package**.
- There is no review step: the team hands the show off directly. The header holds the project, its status (In progress
  or Handed off) and **Share** (invite collaborators). Generated media carries a small badge naming its model: Nano
  Banana Pro on stills, Veo 3.1 on clips.
- The screens were simplified after a UX reduction audit (23 Oct 2026): one place per fact, three regions (agent,
  work, projects), detail one click away.
- State is kept in `sessionStorage` (key `stage-studio:v7`): a reload keeps the demo where it was; a new tab starts fresh.

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
