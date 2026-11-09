# Great Wolf Lodge Journeys v2: Anvil upgrade candidates

Built locally in `src/components/local/` and marked `// ANVIL-CANDIDATE`. Nothing here was added to Anvil; the
recommendation is for Dawid to decide.

## Docked assistant sheet / sidebar (`WileyPanel`)

- **Type:** surface. Used on every chat step.
- **Closest Anvil option checked:** Chat Shell `mobile` and `side-panel` (the content, used inside), Drawer (a modal
  bottom sheet that covers the page), Launcher (a popover).
- **Proposed API:** `snap` (`peek` · `half` · `full`), `onSnapChange`, `docked` (`sheet` · `sidebar`, or by breakpoint),
  `context` (the context bar), `open` / `onOpenChange`. The host page shrinks or is pushed; never covered.
- **A11y:** a labeled region, not a dialog (the page stays usable); the handle is a button that resizes with Arrow
  Up / Down and says the current snap.
- **Recommendation:** promote. "The assistant changed the page and you can see it" needs a container that never hides
  the page.

## Nav entry pill (`AskWileyPill`)

- **Type:** entry point. Header on every page.
- **Closest Anvil option checked:** Launcher (floating only), Button.
- **Proposed API:** `active`, `count`, `badge` (the "AI" tag), `onClick`.
- **A11y:** `aria-pressed` for the open state; the count has its own label ("1 saved to your plan").
- **Recommendation:** promote as a Launcher variant (`placement="inline"`).

## AI prompt chip (`AiChip`)

- **Type:** agent pattern. Suggested next prompts in the thread and on the landing page.
- **Closest Anvil option checked:** Quick Reply (one style for answers and prompts).
- **Proposed API:** Quick Reply `variant="prompt"`: dashed outline and a sparkle, solid on hover.
- **A11y:** a button; the label is the full prompt.
- **Recommendation:** promote as a Quick Reply variant. Telling "answer this" from "ask the AI this" helps.

## Suite card and rate card (`SuiteCard`, `RateCard`, `Gallery`, `CompactRates`)

- **Type:** domain pattern (hospitality). J1·2, J1·3, J2·2, J2·5.
- **Closest Anvil option checked:** Offer Card (one product, one CTA), Media Gallery, Price.
- **Proposed API:** `media`, `tier`, `title`, `meta`, `description`, `info`, `price` (`from`, `note`, `promo`),
  `rates[]` (`plan`, `policy`, `audience`, `price`, `selected`), `expanded`, `tag`, `highlighted`.
- **A11y:** View / Hide Rates is `aria-expanded`; Select is `aria-pressed`; the gallery counter is a polite live region.
- **Recommendation:** keep local. It reproduces GWL's live card on purpose; a generic "expandable offer with rates"
  could come later from Offer Card.

## Plan row (`PlanRow`)

- **Type:** itinerary item with a status tag; "Suggested" is dashed until accepted.
- **Closest Anvil option checked:** Timeline item (time, title, detail, trailing), which fits except for the dashed
  suggested state.
- **Recommendation:** propose a `suggested` state on Timeline item instead of a new component.

## Questions card and capture card (`QuestionsCard`, `CaptureCard`)

- **Closest Anvil option checked:** Clarifying Question (one question at a time, numbered options). The wireframe asks
  two at once on desktop, with pill answers.
- **Recommendation:** extend Clarifying Question with `layout="all"`; the capture card is an ordinary form in a Card.

## Demo-only (not candidates)

`Brand` (text wordmark, photo placeholders, sample label, Wiley avatar, "Set by Wiley" tag), `AppHeader`, `Overlays`
(launcher bar, mock Apple Pay, Voyagers join and share sheets, toast, end cards).
