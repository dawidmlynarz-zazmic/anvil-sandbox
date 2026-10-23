# Stage Studio v2: moments-first plan

Agreed 23 Oct 2026, after validating the demo against Anyma's ÆDEN (Coachella 2026) and the Coachella × Google DeepMind
stage-design prototype. The demo converged too early, didn't scale to many iterations, and treated key moments as a
brief field. In a real show the song is the unit the artist thinks in.

## Decisions

1. **One shared set, a look per moment.** The set (structure, LED surfaces, rig) is built once and must clear the
   venue's limits; each key moment gives it a different life (LED content, light, camera, performers, effects).
2. **The Show board is home after the brief**, and a **Homepage** lists every project as a card (the sidebar keeps them
   for quick access), so the main area is free for the agent's work and the core loop.
3. **Single approval.** The artist signs off the show once; the outcome is every moment with its look and motion.
4. **Real AEG content.** Venues and festivals as named on aegworldwide.com, with the facts it gives (city, capacity,
   year, description). Technical specs stay labelled samples until Phase 3.
5. **Scope:** Phases 1–2 before the pitch; 3–4 if time allows.

## The model

| Layer | What it is | How many |
| --- | --- | --- |
| Set | The physical stage: structure, LED surfaces, rig. Chosen, then locked | One per show |
| Moment | One song: how the set looks and moves then | 4–8 per show |
| Generation | One image explored for a moment, with its parent (lineage), source, author and provenance | Many per moment |

Before the set is locked, explorations may try any structure. Locking it from a chosen look is the one deliberate
convergence: afterwards every new exploration keeps the structure and varies the look.

## Flow

Brief (stage, slot, look, references, no-gos) → **Show board** (moments in setlist order, each with its light, look and
status; set status; running metrics) → **Moment workspace** (Explore: contact sheet, batches, pinboard, compare any,
lineage and branching; Assets in Phase 2) → **Review** (the show, one approval) → **Handoff**.

## Phases

1. **Moments-first core.** *Built 23 Oct 2026* (not yet committed). New model; Homepage; slimmer brief; Show board; Moment Explore (contact sheet, batches of
   new directions / more like pinned / angles / light, pinboard, compare any 2–4, lineage and branch from here); choose
   a moment's look; lock the set; motion per chosen look; Review and Handoff adapted to moments; real AEG venues.
2. **Asset kits.** *Built 23 Oct 2026* (not yet committed). Assets tab per moment: angle set, light states, motion
   variants (the other camera moves); LED loop and performer stand-ins listed as pilot-only (the preview can't render
   them, so they aren't faked); show preview (clips in setlist order); provenance panel on every image and asset.
3. **Venue grounding.** *Built 23 Oct 2026* (not yet committed). Every venue has numeric sample limits (stage width,
   trim, rigging, LED wall, evening gusts for open air; the Coachella Stage is the modelled one). Each design's
   footprint (size, weight, flown load, wind area) is estimated and checked on every image, before locking the set (a
   confirm step), on the show board, in Handoff and in the chat, with the change that would clear each issue. Changing
   the venue under a locked set says how it fits there. Sightlines from AXS seats stays on the roadmap.
4. **Review, handoff, polish.** *Built 23 Oct 2026* (not yet committed). Handoff tabs per trade (overview with
   credits, staging and rigging, lighting, video and LED, camera, rights and log); a running “So far” block in the
   progress rail; authorship pass (people choose, lock, send and approve; the agent explores, builds and checks; the
   agent's messages and the About panel say so); clips interrupted by a reload re-render on their own; demo script.

Roadmap only (pitch slides): collaborator roles, per-trade sign-off, a guided mode for smaller acts, a portfolio view.
