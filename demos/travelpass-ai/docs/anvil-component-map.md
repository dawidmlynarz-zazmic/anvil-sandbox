# TravelPass AI: component map

Source: the audit of the live TravelPass AI POC (29 Oct 2026). Every screen element is mapped to an Anvil component
before building. "Local" means built in `src/components/local/` (marked `// ANVIL-CANDIDATE`, see
`anvil-upgrade-candidates.md`). Nothing was added to Anvil.

## Layout

| Original | Here | Anvil |
|---|---|---|
| Chat in a right panel, over a forest photo | Chat **always open on the left**, the page beside it (our standard) | `ChatShell` (`side-panel`), `ChatShellHeader` / `Thread` / `Composer` |
| Top bar: logo, ambiguous panel toggle | Header in the shape travel sites use (Kayak, Tripadvisor): logo, **search pill** (where, dates, travelers) in the middle, saved heart and Live Mode on the right. The pill opens the full trip in a side sheet | Local `TripPill`, `Sheet`, `Button` |
| Mobile: not defined | Chat and Trip as two tabs below 768px | plain tab buttons (`role="tab"`) |

## Screens

| Element (audit §3) | Component | Notes |
|---|---|---|
| **A. Home**: hero video, headline, two pills | Local `HeroBackdrop` (start-aligned headline) with a search card (`Select`, date `Input`s, `Button`), `QuickReplyGroup`, three `Card`s | The search card says the same as typing: it sends a message to the assistant. | Pause button, fixed scrim for contrast, no motion for reduced-motion. The two pills go: chat is always open; **Start Live Mode** is the header's primary action |
| Debug `Status: Idle` | Removed. State shown with `Badge` (`indicator`) on Live Mode | Defect 12 |
| **B. Chat**: bubbles, input, send, share a file | `MessageRow` (user / assistant), `MessageActions` + `MessageFeedback`, `PromptInput` (attach, voice, send/stop), `QuickReply`, `StarterPromptCard`, `WelcomeState` | Streaming state = `PromptInput status="streaming"` (field off, Stop) |
| Typing indicator | `ToolLogLine status="running"` ("Thinking…") | Defect 17 |
| Agent log lines | `ToolLogLine status="done"` | "Updated trip details", "Searched stays" |
| **C. Hotel results**: breadcrumb, list, summary bar | `Breadcrumb` (real links), local **`StayCard`** (photo with save heart, score, why line, perks, price column), a filter row (`Select` sort and price, `DropdownMenu` amenities, saved toggle), `MapView` with price pins from 1280px, `ComparisonTable` in a `Dialog` (up to three stays), `EmptyState` | Budget fit as a `Badge` on each card. Layout follows Kayak's results page |
| Trip summary | The header `TripPill`, plus a subtitle under the page title (dates, nights, rooms, adults, budget) | Replaces the right-hand trip panel |
| **D. Hotel detail**: hero image, about, amenities | `MediaGallery layout="grid"` (lightbox, "+N photos"), `Card`, `Icon` | Original had one image, no gallery |
| Room rows | Local **`RoomRow`**, `Badge` (scarcity, over budget, too small), `Price`, `Button outline` | Scarcity: "Last room" / "N rooms left" with proper plurals |
| **E. Booking modal** | `Dialog` (`DialogHeader` → `DialogBody` → `DialogFooter`), `Input`, `KeyValueList`, `Alert` | Route-based (`/hotels/:id/book/:room`). Not modal, so the chat stays usable. **No card fields** (see below) |
| Confirmation (unseen in the original) | `Alert tone="success"`, `Card`, `KeyValueList` | Designed here |
| **F. Live Mode**: forest image, orb, mic, speaker | Local **`LiveOrb`** (ring + `VoiceWaveform` + mic button), `Badge`, `QuickReplyGroup`, `ScrollArea` (transcript, `role="log"`), `Alert` | Simulated mic: pick a phrase to "say" it |
| **G. Travel Memory** (hidden) | Local **`TripContextCard`**, `KeyValueRow`, `Progress`, `Dialog` + `Select` + `Input` (edit) | Visible and editable. The agent fills it; edits are reported back to the agent |
| Photos ("show me photos", never worked) | `MediaGallery` as a chat message (carousel) and as a page (`/photos/:area`) | Defect 6 |
| Empty and error states | `EmptyState`, `EmptyStateMedia` | No stays yet; no match for the filters |
| Theme | Anvil tokens, light by default, dark works | The original's blue, green, orange and cream are not copied; see decisions |

## Decisions that differ from the audit

- **Chat commands drive the page.** The audit's agent-drives-the-canvas model is kept and made explicit: what you type
  (or click, or "say") goes through one scripted agent (`src/services/agent.ts`) that changes the trip, filters, route
  and booking. UI clicks are sent to the same agent, which narrates them, as in the original.
- **No payment fields.** The original collected raw card numbers. A public preview shouldn't, so the dialog says
  nothing is charged and no card details are collected.
- **Colours.** Anvil tokens only. Brand tokens (blue, green, orange, cream `rgb(255,250,243)`) are a decision for the
  client; a `data-brand` file like Ask AXS has would carry them.
- **Photography.** Illustrations drawn in code (`src/lib/scenic.ts`) stand in for photos; swap `photo()` for real URLs.
- **Mock only.** No WebSocket, so no reconnect or network-error states; those belong with the real backend.
