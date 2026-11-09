# TravelPass · AI travel assistant (demo prototype)

A clickable, mocked rebuild of the TravelPass AI front end with Anvil UI. **The chat drives the page**: what you type
(or click, or "say" in Live Mode) goes to one scripted assistant that updates the trip, the hotel list, the open
hotel and the booking. No real model, no backend, no real payment. Hotels, prices and reviews are fictional samples.

## Run the demo

`pnpm travelpass-ai`, then open the app. Try, in the chat:

1. **"We want five days in May for two, about $3,000. We love food and coastal towns."** The Trip panel fills in and
   the assistant suggests two places.
2. **"Amalfi Coast"**, then **"May 12 to 17"**: the hotel list opens, with budget fit on each card.
3. **"Only hotels with a pool, cheapest first"**, **"open the first hotel"**, **"show photos"**.
4. **"Book the executive suite"**: the booking opens. Type **"My name is Ana Lopez, email ana@example.com, phone
   +1 555 010 0199"** and the form fills in, then **"confirm"**.

The home page also has a search form that does the same as typing. Also: **"Save the first hotel"**, **"Compare these hotels"**, **"Show my saved stays"**, **"Start Live Mode"** (simulated mic: pick a phrase to say), **"Hotels in Cinque Terre"**, **"Under $250 a
night"**, **"start over"**. Clicking on the page works too, and the assistant narrates it. The ⋯ menu has the
light/dark switch and **Reset the demo**.

## Notes

- The layout follows Kayak's (and Tripadvisor's) AI search: chat beside the results, a search pill in the header, result cards with a price column, filters above the list, a map beside it, compare and save. Colours and spacing are Anvil's.
- Every screen has its own URL (`/hotels`, `/hotels/:id`, `/hotels/:id/book/:room`, `/photos/:area`, `/live`,
  `/confirmed`), so Back, links and breadcrumbs work.
- The demo's "today" is fixed at 29 October 2026 (`src/lib/format.ts`). Dates are always shown in one format.
- Photos are illustrations drawn in code (`src/lib/scenic.ts`); the hero is a still with a slow drift.
- `docs/anvil-component-map.md` maps every element to Anvil; `docs/anvil-upgrade-candidates.md` lists the local
  components.

## Defects from the audit, and what this demo does

| Audit defect | Here |
|---|---|
| 1 Dates wrong and in three formats | Fixed demo date, one format |
| 2 "Adults: 20" | Travelers is a validated number (1 to 6), editable |
| 3 Random review counts | Stable sample data |
| 4 Raw markdown in messages | Assistant text is plain, no markdown |
| 6 No photos | Photos as a chat message and as a page |
| 8 Budget ignored | Budget fit on cards and rooms, progress bar in the Trip panel |
| 9 "1 rooms left" | "Last room" / "N rooms left" |
| 10, 11 No routing, ambiguous toggle | Real routes and links; the Trip panel is labelled |
| 12 Debug status text | Removed; Live Mode shows a status badge |
| 13, 14 Contrast and motion | Fixed scrim, pause button, reduced motion respected |
| 15 Mic starts at once | Live Mode explains first, then listening is an explicit action |
| 16 Raw card fields | No card fields |
| 17 No loading state | "Thinking…" line, composer shows Stop while the assistant works |

Not covered (mock): reconnect and network error states, real file reading ("Share a file" says plainly it can't read
files yet), the real audio and WebSocket protocol.
