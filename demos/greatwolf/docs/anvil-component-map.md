# Great Wolf Lodge Journeys v2: component map

Build-script element → what renders it. "Local" is in `src/components/local/` (see `anvil-upgrade-candidates.md`).

| Script element | Steps | Component |
| --- | --- | --- |
| Wiley thread, bubbles, author | all chat steps | Anvil `ChatShell` + `MessageRow` |
| Composer idle / live (waveform, LIVE tag) | all chat steps | Anvil `PromptInput` compact (`onVoice`, `listening`, `leading`) |
| Voice · transcribed, Wiley reacted, Source tags | J1·2, J1·4, J2·2–4 | Anvil `Badge` |
| Typing | all chat steps | Anvil `ToolLogLine` running |
| Answer chips | J2·2 | Local `AnswerChip` |
| AI prompt chips | all chat steps, J2·1 | Local `AiChip` |
| Wiley sheet (peek / half / full) and sidebar with context bar | all chat steps | Local `WileyPanel` on Anvil `ChatShell` |
| Ask Wiley pill (active state, plan count) | header | Local `AskWileyPill` with Anvil `Badge` |
| Launcher: mobile bar, floating pill | J1·1, J1·5, J1·6, J2·1 | Local `Launcher` with Anvil `Button` |
| Filter chips (removable) | J1·2, J2·2 | Anvil `Chip` (`onRemove`, pill) |
| Set / Filtered / Saved / Built by Wiley | J1·2, J1·4, J2·2, J2·4, J2·6 | Local `WileyTag` on Anvil `Badge` |
| Suite card, gallery, rate cards | J1·2, J1·3, J2·2, J2·5 | Local `SuiteCard`, `Gallery`, `RateCard`, `CompactRates` |
| Quote card | J1·3, J1·5 | Local `TripQuote` on Anvil `Card` |
| Timeline item with status | J1·4 | Local `PlanRow` |
| Day tabs | J1·4 mobile | Anvil `ToggleGroup` |
| Attraction spotlight ("Wiley is showing you this") | J2·3 | Anvil `ElementSpotlight` |
| Activity cards, highlighted / dimmed | J2·4 | Anvil `Card` + `Badge` |
| Question card | J2·2 | Local `QuestionsCard` |
| Capture card | J2·6 | Local `CaptureCard` with Anvil `Input`, `Checkbox`, `Button` |
| Checkout progress | J1·5 | Anvil `Progress` |
| Apple Pay, share, Voyagers join sheets | J1·5, J2·5, J2·6 | Local `Overlays` (mocks of native UI) |
| Toast | J1·4, J2·4, J2·6 | Local `Toast` |
| Presenter bar | all | `app/Shell.tsx` with Anvil `ToggleGroup`, `Button` |

## Trip Builder (J1·3 and J2·5 once a rate is chosen)

| Element | Anvil component | Notes |
|---|---|---|
| Trip progress (Suite, Birthday, Passes, Dining, Extras) | `ProgressSteps` (bars) | Done when the section has an item; current is the one Wiley suggests next. |
| Passes, birthday, dining and extra cards | `OfferCard` (horizontal) | Media is an illustrated `Photo` tile; Add or Remove as the card's button. Added cards keep the selected border, but Remove stays outline so the page keeps one primary action. |
| Your suite, trip so far, weekend plan | `Card`, `Badge`, `TripQuote` | The quote and plan preview read the same cart as Wiley. |
| "Wiley suggests" | `WileyTag` + ring | Follows `highlight`, set by Wiley's next suggestion. |

## Journey 3: the Great Wolf app during the stay (phone only)

Drawn after the client's iOS screenshots (Home, Things To Do, Events, ride and event pages, Shopping, the locked
Concierge chat, More).

| Element | Anvil component | Notes |
|---|---|---|
| Status bar, logo header, tab bar, pushed-screen header | Local app chrome (`pages/j3/App.tsx`) | Status bar only in the framed phone; a real phone draws its own. |
| iOS notification | Local `Banner` | Tapping it (or Next) opens the Chat tab and Wiley carries on. |
| Concierge thread | `ChatShell`, `MessageRow` (assistant, user, system), `PromptInput`, `TextShimmer` | Wiley and the lodge team in one thread; the person is tagged "Person" with a warm bubble. |
| Talk to a person | `Button` (outline) | In the participants row; starts the handover from any step. |
| Check-in, today, handover summary, rides, bill cards | `Card`, `ToggleGroup`, `Badge`, `Button` | Rendered inside the thread; Next submits them with the scripted answer. |
| Rating | `Rating` (stars) | After-stay feedback in the thread. |
| Ask Wiley sheet | Local `WileySheet` | Same thread as the Chat tab, over any screen. |
| Ride and event pages, lists, Home sections | `Photo` tiles, `Badge`, `Button`, `AiChip` | "Fits Mia and Leo" badges, Wiley's reasons in violet, reminders as bell toggles. |
