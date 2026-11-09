# TravelPass AI: Anvil upgrade candidates

Local components in `src/components/local/`, each with a story and a `// ANVIL-CANDIDATE` marker. Recommendation is
for Dawid to decide; nothing here was added to Anvil.

## RoomRow

- **Type:** pattern (agent catalog).
- **Closest Anvil option checked:** Offer Card `horizontal` (built around a poster and one CTA, no rate or scarcity
  row); Item (no price column).
- **Proposed API:** `room` data (name, sleeps, size, left, features), `nights`, `total`, `cancellation`,
  `overBudgetBy`, `tooSmall`, `action` slot.
- **A11y:** one `article` with the room name as a heading; scarcity and budget are text badges (never colour alone);
  the disabled action keeps its label.
- **Recommendation:** promote. Any bookable-option list (rooms, fares, ticket tiers) needs the same row.

## TripContextCard

- **Type:** agent pattern (task context).
- **Closest Anvil option checked:** Memory Manager (long-lived memories, search, delete), Task Brief (a brief the
  user writes). Neither shows live fields the agent fills in from the conversation.
- **Proposed API:** `fields` (label, value, unset state), `onEdit`, optional `progress` (value against a limit),
  `footer` ("Updated 3:58 PM").
- **A11y:** a description list; the progress bar is labelled and has the number in text.
- **Recommendation:** promote. It makes what the agent understood visible and correctable, a recurring need.

## LiveOrb

- **Type:** agent control (voice).
- **Closest Anvil option checked:** Voice Waveform (bars only), Prompt Input's voice button (inline in the composer).
- **Proposed API:** `state` idle · listening · muted, `onToggle`; levels from the mic would feed the waveform.
- **A11y:** the state is named (`Listening`, `Muted`, `Not listening`); the button toggles with text, not only an
  icon. The waveform stops under reduced motion (Anvil's own).
- **Recommendation:** promote with a permission-request state, once the real mic is wired.

## HeroBackdrop

- **Type:** layout.
- **Closest Anvil option checked:** none (Media Gallery and Widget Media are content media, not backgrounds).
- **Proposed API:** `image`, `video`, `align`, children; pause control built in.
- **A11y:** the video is decorative and hidden under reduced motion; a fixed dark scrim keeps white text readable on
  any frame; a pause button (`aria-pressed`).
- **Recommendation:** keep local unless a second demo needs it.

## StayCard

- **Type:** pattern (agent catalog, results list).
- **Closest Anvil option checked:** Offer Card `horizontal` (one poster, one price line, one button; no save heart, compare toggle or score); Item (no price column).
- **Proposed API:** `media`, `score` with label, `why` line, `perks`, `night` / `total`, `fit` (within / over a budget), `saved`, `compared`, and handlers.
- **A11y:** the heart and Compare are toggle buttons with names (`aria-pressed`); stars are an image with a text label; budget fit is text.
- **Recommendation:** promote, or extend Offer Card with these slots; both Kayak and Tripadvisor use this shape.

## TripPill

- **Type:** navigation (search summary).
- **Closest Anvil option checked:** Button Group, Toolbar (no segmented summary), Combobox (a picker).
- **Proposed API:** `segments` (label, unset), `onClick`; one button with a descriptive name.
- **A11y:** one tab stop whose name lists every segment, so a screen reader doesn't hear three separate buttons.
- **Recommendation:** promote with the trip context pattern.

## Logo

A text wordmark, not a candidate. Replace with the client's logo file.
