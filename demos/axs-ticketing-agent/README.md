# AEG × AXS · Ask AXS (demo prototype)

Clickable, mocked, mobile-first prototype of an agent inside the AXS app: find a London show, pick a date and seats, hold
them, then finish on AXS. Built with Anvil UI. No real model calls, no AXS APIs; shows and prices are fictional samples.

Status: **Phase 3 (screens) done**, except the sold-out and AXS Official Resale stretch, which is left out on purpose
(see Sample data). `/lab` (development only) still drives the scripted agent with no screens.

## Run the demo

`pnpm ask-axs`, then open the app. It opens on a mock AXS mobile page (`/`); **Ask AXS** opens the agent (`/ask`). Try:
1. a starter prompt, then **Allow** on the consent card (the shows re-order, "Ranked for you");
2. **View dates** on Kings of Leon, pick Saturday 3 July, then **Choose these seats**, **Hold these 2 seats**;
3. watch the countdown, **Continue on AXS** (a stub), or let it run out and **Hold again**.

3b. after a hold, **Refund and transfer rules**, then **Talk to a person** (a placeholder answer and a hand-over summary; nothing is sent).

The ⋯ menu has the light/dark switch and **Reset the demo**. Voice input is not in the demo.

## Sample data

- `src/mocks/shows.ts`: six London shows (the last two, ABBA Voyage and Country to Country, show their usual venues with invented dates). **Titles, venues and dates are the ones printed on each show's cover art**
  (supplied by Dawid, 2026-10-23). **Prices, seats, availability and show times are invented** and every screen must say
  "sample". The covers show real artists, by Dawid's decision: this repo and its previews are public.
- The demo's "today" is fixed at Friday 23 October 2026 (`src/lib/format.ts`), so "this Saturday" never goes stale.
- Prices are all-in (face value plus a 14% fee, in 50p steps), as AXS shows them.

## How the pieces fit

- `src/services/axsTools.ts`: the mock of the planned AXS tool layer (`findEvents`, `getSeats`, `getResale`,
  `holdSeats`, `checkoutUrl`). Screens and the agent call only this.
- `src/services/agent.ts`: the scripted agent. It reads a few words (how many, how much, when, which show), calls the
  tools and replies with canned sentences and typed blocks (shows, dates, seats, hold). Anything else gets a polite
  fallback with starter prompts.
- `src/state/session.tsx`: one store in `sessionStorage` (turns, criteria, consent, selection, hold); `reset()` restores
  the seeded start.

## Anvil version

Consumed read-only from the sibling clone `~/anvil-ui` (override the path with `ANVIL_PATH`).

- **Anvil:** follows `main` (last checked against `16e2b76`, 2026-10-23).

## Conventions

- Same setup as `demos/aeg-stage-studio`: `@anvil/*` and `@/*` → Anvil's `src`; the app's own code uses `~/*`.
- **The AXS skin** is `src/styles/axs-brand.css` only: it re-points Anvil's colour variables under `[data-brand='axs']`
  and makes buttons and chips pills via `data-slot`. Nothing in Anvil changes, and Storybook stays the reference.
  Colours are sampled from screenshots (`docs/reference/`, gitignored: they show real events), so confirm them with AXS.
- Dark by default (the AXS app is dark); light works too. The choice is kept in `localStorage`.
- Missing pieces go in `src/components/local/` with a story, marked `// ANVIL-CANDIDATE`, and are logged in
  `docs/anvil-upgrade-candidates.md`.

## Run

```bash
pnpm ask-axs                                  # from the repo root, http://localhost:5174
pnpm --filter axs-ticketing-agent storybook   # local components only
```
