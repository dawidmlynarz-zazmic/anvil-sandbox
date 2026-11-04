# Great Wolf Lodge: Anvil upgrade candidates

Local components in `src/components/local/`, each with a story. Recommendation is for Dawid to decide; nothing here was
added to Anvil. Fewer pieces are missing than the plan expected: Anvil already has Timeline, Voice Waveform (via Prompt
Input), Citation Chip and Approval Card, which cover the plan's timeline, voice, cited-answer and suggested-action items.

## QuoteCard

- **Type:** agent pattern (itemized quote). Used in screen 1.
- **Closest Anvil option checked:** Offer Card (one product, no line items), Key Value Row (no total or action).
- **Proposed API:** `lines` (label, detail, amount), `total`, `actionLabel` / `onAction`, `doneLabel`, `note`.
- **A11y:** list of lines; total is an `aria-live` region so changes are announced.
- **Recommendation:** promote. Any agent that builds a basket (trips, tickets, orders) needs it.

## HandoffCard

- **Type:** agent pattern (human handoff). Used in screen 3.
- **Closest Anvil option checked:** Approval Card (asks a decision; does not show who joins or what was passed on).
- **Proposed API:** `to`, `eta`, `context` (label and value rows).
- **A11y:** heading names who is joining; context is a description list.
- **Recommendation:** promote. The "no need to repeat yourself" proof is the point of a good handoff.

## TicketStatusCard

- **Type:** agent pattern (status of something filed for the user). Used in screens 4 and 5.
- **Closest Anvil option checked:** Task Card (an agent's own run), Progress Steps (no message or reference).
- **Proposed API:** `title`, `reference`, `stage` (requested · reviewing · resolved), `message`.
- **A11y:** steps are an ordered list with state words; the message is `aria-live`.
- **Recommendation:** promote, medium confidence. Stage names are specific here; the API should take a step list.

## ForecastChart

- **Type:** data viz. Used in screen 6.
- **Closest Anvil option checked:** Widget Metric Card (a number, no series); no chart component in Anvil.
- **Proposed API:** `days` (label, forecast, lastYear), `highlight`, `callout`.
- **A11y:** `role="img"` with a label, plus a screen-reader table of the same data. Hand-drawn SVG; a real build would
  likely use Recharts behind the same props.
- **Recommendation:** needs a decision on a chart library first. Not worth promoting as SVG.

## Demo-only (not candidates)

`DeviceFrame` (desktop and phone frames), `LockScreen` (a push notification on a lock screen), `AgentChat` (a thin
wrapper around Chat Shell, Message Row, Quick Reply and Prompt Input that this demo reuses on every screen),
`Citations` (source chips that open the passage).
