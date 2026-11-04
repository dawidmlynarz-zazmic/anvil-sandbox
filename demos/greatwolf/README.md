# Great Wolf Lodge · AI journey (demo prototype)

A clickable, mocked demo of the "AI-first Great Wolf Lodge" vision from the *Great Wolf Lodge AI Roadmap, Q4 2026*
deck (slide 5). It follows one family, the Martinez family, from booking Mia's 7th birthday weekend to a return offer,
and shows the staff side of the same moments. No model, no backend, no real booking or payment. Names, prices and
figures are fictional samples (see "Sample values" below). Built against Anvil `16e2b76`.

## Run it

`pnpm greatwolf`, then use **Next moment** (top right) to walk the storyline in about 10 minutes, or the journey rail
and the **Guest / Staff** toggle to move around.

| # | Moment | Surface | Stage | Roadmap |
| --- | --- | --- | --- | --- |
| 1 | Personalized homepage + booking agent | Desktop | Discover & book | P2 |
| 2 | App booking with (simulated) voice, handoff to the existing checkout | Phone | Plan | P2 |
| 3 | In-app concierge: push, Saturday plan, sensory-friendly plan, Q&A, handoff to a person | Phone | Stay | P3 |
| 4 | Charge explainer: duplicate cabana charge, refund request | Phone | Stay | P2 |
| 5 | Staff assistant: cited answer, limit check, refund | Desktop | Inside the lodge | P2 |
| 6 | Demand forecast with recommended actions | Desktop | Inside the lodge | P3 |
| 7 | Post-stay check-in and return offer, which loops back to the homepage | Phone + email | After | P3 |

Shared state links the screens: a refund approved in 5 resolves the ticket in 4; feedback given in 7 appears under
Feedback insights in 5; accepting the return offer in 7 changes the homepage in 1. **Reset the demo** is in the ⋯ menu.

## Try this

- Homepage agent: "Add dining", "Change dates", then **Book**. The page cards follow the agent.
- App: tap the mic (it plays a pre-written request; there is no speech recognition), then "Book this suite".
- Concierge: flip **Sensory-friendly**, ask "Where are the towels?", "Move the party to 12:00", "Talk to a person".
- Anything unscripted gets a short fallback that offers what the screen can do.

## Decisions

- **Dates corrected.** The deck pairs "Fri, Mar 14" with 2027, but Mar 14, 2027 is a Sunday. The stay is Fri Mar 12 to
  Sun Mar 14, and Mia's birthday is Sat Mar 13.
- **Duplicate charge.** The cabana is charged twice after the app confirms it a second time; the bill in 4 is seeded
  that way whatever you do in 1 and 2. The agent in 2 confirms the cabana without claiming it fixed anything.
- **Not built:** screens 8 (AI-platform booking) and 9 (phone booking), the plan's stretch items.
- **Folder:** `demos/greatwolf` (the plan said `great-wolf-lodge/`; the repo keeps demos under `demos/`).
- **Fixtures** are TypeScript modules in `src/data/` (the plan said JSON), conversation scripts live in each screen.
- **Brand:** Anvil with Great Wolf Lodge's colors and shadows from the GWL Denkit Figma file (`src/styles/gwl-theme.css`, with each mapping noted). Typography, spacing and radius stay Anvil's. Denkit has no dark mode and no purple, so the dark palette and the assistant's teal accent are derived from its blues and teal. A text wordmark, no logo assets.
- **Next moment** is a secondary-weight header button; the one primary action on a screen is the product's own
  (for example **Book for $1,122**).

## Sample values to replace

All prices come from the deck except the dining plan ($160) and the cabana's second charge, which are invented for the
story. Forecast numbers, the 97% peak and "+12 pts" are the deck's; the daily series around them is invented.

## Setup

Same as the other demos: Anvil is read from `../../../anvil-ui` (override with `ANVIL_PATH`). `pnpm --filter greatwolf
typecheck` and `build`. The optional password screen turns on when `VITE_DEMO_GATE` is set at build. Local components
have stories (`pnpm --filter greatwolf storybook`); see `docs/`.
