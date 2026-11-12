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

`Brand` (the GWL logo from the supplied SVG, photo placeholders, sample label, Wiley avatar, "Set by Wiley" tag), `AppHeader`, `Overlays`
(launcher bar, mock Apple Pay, Voyagers join and share sheets, toast, end cards).

## Rearrangeable day plan (PlanRow with drag and Move menu) · `pages/weekend.tsx`, `pages/shared.tsx`

- **Type:** new pattern (itinerary board).
- **Closest Anvil option checked:** `Timeline`, `TaskPlan`, `SlotList`. None reorders, and Anvil has no drag and drop.
- **Proposed API:** `<ItineraryBoard days={[{ id, label, items }]} onMove={(id, day, index) => …} locked={(item) => …} />` with `ItineraryItem` slots (time, title, status, sub). Drop line between items, columns on wide screens and tabs on narrow ones (tabs take drops), plus a per-item Move menu.
- **A11y:** the Move menu is the keyboard and screen-reader path (another day, 30 minutes earlier or later); the grip is pointer and touch only. Moves are announced (dnd-kit live region) and confirmed in the chat. Locked items say why ("Set by the lodge").
- **Recommendation:** worth adding if more demos plan days. Built here on `@dnd-kit/core` 6.3.1 (touch long-press, mouse distance threshold).

## Stay bar (StayBar) · `components/local/StayBar/StayBar.tsx`

- **Type:** new pattern (sticky booking context, like greatwolf.com's booking bar).
- **Closest Anvil option checked:** `DatePicker` (a single trigger, no clear button or stay range), `QuantitySelector` (priced rows, no per-child ages), `Collapsible`, `AnnouncementBar`. Built from `Popover`, `Calendar`, `Stepper`, `Select` and `Collapsible`.
- **Proposed API:** `<StayBar dates={{ start, nights }} guests={{ adults, kids: ages[] }} onDatesChange onGuestsChange onClear summary={{ total, lines, flash }} />`. Desktop: labelled fields in a sticky row. Phone: compact chips plus the basket total, opening to its lines.
- **A11y:** a named region ("Your stay"); triggers say the value and the action ("Dates: Mar 12 – 14. Change dates"); a separate Clear dates button; steppers and age selects are labelled; the total is a polite live region, so "Added" is announced.
- **Recommendation:** adopt for any booking or ordering demo. It replaces the separate pinned trip summary, so a phone never shows two pinned bars.

## Concierge thread (AI and people in one chat) · `pages/j3/Concierge.tsx`

- **Type:** new pattern (human handover inside an agent chat).
- **Closest Anvil option checked:** `MessageRow` (roles user, assistant, system, tool: no human agent role), `ChatShell`, `ApprovalCard`. No component marks a message as written by a person or shows who is in the chat.
- **Proposed API:** `MessageRow role="assistant" author={{ name, role, kind: 'ai' | 'person', avatar }}`, a `ChatParticipants` header (who's here, "Talk to a person"), and a `HandoverSummary` card (what was shared with the person).
- **A11y:** authors are text, not only color ("Person", "AI" badges); joins and leaves are system lines read in order; the typing state names who is typing.
- **Recommendation:** worth adding: any assistant with a service team behind it needs it.

## Native app chrome (iOS) · `pages/j3/App.tsx`

- **Type:** demo-only. Anvil is web-first; the status bar, tab bar, notification and sheet imitate the client's iOS app for the prototype.
