# Great Wolf Lodge · Journeys v2 (clickable prototype)

Wiley, Great Wolf Lodge's AI planner, built into the current greatwolf.com experience and upgraded with Anvil UI. Two
journeys at the Colorado Springs lodge, mobile first, with the desktop layout from the same components. Built from the
Journeys v2 build script and the Figma page "Demo" (file `[INTERNAL] Great Wolf Lodge`, frames `Screen J… · mobile /
desktop`). Scripted and mocked: no model, booking, payment or account behind it.

## Run it

`pnpm greatwolf`, then pick a journey. The demo bar at the top is for the presenter:

- **Next** plays each step's happy path (it picks the scripted chip when the presenter hasn't), and fast-forwards while
  Wiley is still talking ("Skip ahead"). Journey 1 takes about 10 presses, Journey 2 about 13.
- **Device:** Auto (768px switches sheet ↔ sidebar), **Mobile 390** (a 390 × 844 phone on a laptop), Desktop.
- Keys: → / ← step · R reset · D device · 1 / 2 journey · H hides the bar.

| Step | Journey 1 · Martinez family, signed in | Journey 2 · first-time visitor, signed out |
| --- | --- | --- |
| 1 | Personalized lodge home; Wiley in the launcher | Landing: "Describe your trip" beside dates & guests |
| 2 | Voice; the suites page filters, ranks and highlights | Two questions; suites re-rank |
| 3 | Member rates only, Flexible selected, party add-on | Guided water park tour (Element Spotlight) |
| 4 | Weekend plan in and around the lodge | Things to do nearby, highlighted and dimmed |
| 5 | Checkout prefilled, Apple Pay sheet (mock) | Rates: join Voyagers free or book as guest |
| 6 | Booked; the plan moves to the app | Save the plan, send it, share it |

## How it is built

- **It should read as greatwolf.com:** Montserrat throughout the site and Wiley (the site's typeface), the site's suite
  photography, cards and Plan Your Stay form, and Wiley styled as the site's existing AI Planner (pale-blue panel, navy
  user bubbles, outlined agent bubbles, outlined suggestions, Clear chat, the "Howls!" welcome, the AI Mode notice).
- **The host page is GWL's** (header, lodge bar, Book Now, the live suite card with gallery, Starting Rate and View /
  Hide Rates, rate cards with "Join for Free"), styled with the Denkit colors in `src/styles/gwl-theme.css`, Montserrat
  for page headings and pill buttons, as on the live site. **Wiley is Anvil:** Chat Shell, Message Row, Prompt Input
  (voice, live waveform), Badge, Element Spotlight, Card, Chip, Toggle Group.
- **Wiley docks, it never covers:** a bottom sheet with peek / half / full below 768px (the page shrinks above it, so
  what Wiley changed stays in view) and a 420px sidebar that pushes the page from 768px, with a context bar.
- **Every Wiley action shows on the page** ("Set by Wiley", "Filtered by Wiley", highlight ring, spotlight) and can be
  undone there (remove a filter chip, Hide Rates, Back to suites).
- **Engine:** `src/state/demo.tsx` plays the beats in `src/wiley/scripts/` (user line, voice, agent line with typing
  time, chips, card, page effect). Typed words match a few keywords per step; anything else gets "I'm a demo version of
  Wiley. Try one of these:" with that step's chips, so free text never dead-ends.
- **State** (rate, add-ons, plan, sign-in, filters) carries across steps; Reset restores the start of the journey.

## Real and sample values

- **Real (greatwolf.com):** lodge name and contact, suite names and descriptions for Deluxe Queen and Junior Wolf Pup Den,
  the $109 and $119 starting rates, Deluxe Queen's four rates and cancellation dates, water park, attraction and nearby
  place names.
- **Sample (labeled "sample" in the UI or the quote):** Junior Wolf Pup Den's March rates other than $119 ($125 / $123 /
  $128), KidCabin's rate, the birthday party package ($249), MagiQuest ("from $—"). Sample rates print `[date]` for
  cancellation deadlines. Suite photos, floor plans, the logo and the Voyagers Club logo come from greatwolf.com (supplied); the water park, attractions and nearby places still use labeled placeholders.
- **Fictional people:** the Martinez family. Confirmation GWL-48213 is invented.

## Decisions

- **Folder:** `demos/greatwolf` (the script says `great-wolf-lodge/`); the previous demo in this folder was replaced.
- **Docs:** the script's `ANVIL-CANDIDATES.md` is `docs/anvil-upgrade-candidates.md`, as in the other demos.
- **Dates:** the script's 2027 dates (the J1·1 wireframe says 2026). Mar 12, 2027 and Mar 5, 2027 are Fridays.
- **Water park:** only Cub Paw Pool has a description in the script; Fort Mackenzie and Howlin' Tornado show their type
  only, and the rest of the park is listed by name. Nothing about ride rules beyond "height minimums" is claimed.
- **Suites:** only the three the script describes (Deluxe Queen, Junior Wolf Pup Den, KidCabin). The others on the site
  need their real descriptions before they're added.
- **Figma over the build script where they differ** (checked against all 24 frames, mobile and desktop, on 2026-11-09):
  the header has no lodge bar or Book Now on mobile and the utility bar of the live site on desktop; the Ask Wiley pill
  has no "AI" tag; J2·1 offers the live site's three prompts ("What's the best deal for my stay?", "Suite for my family
  vacation", "Things to do nearby"); J2·2 sets the filters and Wiley's pick before asking the two questions; J1·1 desktop
  is a hero card with "See other dates" and "Popular at this lodge"; J1·5 and J1·6 desktop use the frames' layouts.

## Setup

Anvil is read from `../../../anvil-ui` (override with `ANVIL_PATH`). `pnpm --filter greatwolf typecheck` and `build`.
The optional password screen turns on when `VITE_DEMO_GATE` is set at build. Local components with stories:
`pnpm --filter greatwolf storybook`.
