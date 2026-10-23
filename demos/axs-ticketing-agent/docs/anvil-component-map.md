# Anvil component map

Phase 1 inventory for the Ask AXS demo: every element of the agreed scenario, mapped to the Anvil component that
covers it. Read against `~/anvil-ui` `main` (`16e2b76`), `docs/component-status.md` and the component source headers.
Stories are in Anvil's Storybook (`pnpm storybook` in `~/anvil-ui`); paths below are under `src/components/`.

**Ladder** (from CLAUDE.md): 1 Anvil as is · 2 Anvil through its props or variants · 3 a screen-specific arrangement
of Anvil parts · 4 a local component, logged as an Anvil candidate (`anvil-upgrade-candidates.md`).

**Skin.** Everything wears the AXS skin from `src/styles/axs-brand.css` (re-pointed colour variables, pill buttons and
chips). The skin never changes what a component is, only its tokens. Where a mapping needs more than that, it says so.

Status is Anvil's own (`component-status.md`). Everything used below is listed as built; I'll re-check each row's status
when its screen is built and say so here if one is still work in progress.

## Scenario

Fan opens the AXS mobile site → opens Ask AXS → asks for something live in London this Saturday, 2 tickets, under £80
→ compares 3 shows → picks a date and time → picks seats → holds them → finishes on AXS. Stretch: sold out → AXS
Official Resale; personalisation consent.

## 0 · Host page: the AXS mobile site the agent sits in (`/`)

The agent is "embedded" in AXS, so the demo opens on a minimal mock of the AXS mobile site (from the screenshots). It is
a backdrop, built as little as possible.

| Element | Anvil component | Props / use | Rung | Gap? |
| --- | --- | --- | --- | --- |
| Search pill (events, performers, venues) with search button | `ui/input-group` | `InputGroup` + `InputGroupInput` + trailing `InputGroupButton` (icon) | 2 | No (skin: pill) |
| "Today / This Weekend / Next 30 Days" switcher | `ui/toggle-group` | `type="single"`, `variant="outline"` | 2 | No (skin: pill) |
| Event tiles (poster, date, title, venue) | `ui/carousel` + `ui/card` | `Carousel`, `CarouselItem`, `Card` with local poster art as media | 3 | No |
| Poster art (typographic, fictional) | none | `PosterArt`, an image-less poster drawn in CSS/SVG | 4 | **App-specific** (not an Anvil candidate) |
| AXS header (wordmark, sign in) and floating tab bar (Discover, Tickets, Sell) | `anvil/shell`, `ui/button` | `ShellHeader variant="bar"`; tab bar is a `ToggleGroup`-like pill, local `AxsTabBar` | 4 | **App-specific** (AXS chrome, not Ask AXS) |
| Floating "Ask AXS" button | `agent/launcher` | Launcher opens a **popover** (400 × 640), which is a desktop pattern. On mobile it must open a full-height Drawer | 4 | **Yes**: Launcher mobile variant (see candidates) |
| Ask AXS surface (full height, from the bottom) | `ui/drawer` + `agent/chat-shell` | `Drawer direction="bottom"` holding `ChatShell surface="mobile"` (Anvil's chat-shell story does the same) | 2 | No |
| Proactive nudge on the host page ("Ask AXS: find a show for this weekend") | `agent/announcement-bar` | `position="bottom"`, `tone="agent"`; optional, only if it helps the scenario | 2 | No |

## 1 · Chat surface and discovery

| Element | Anvil component | Props / use | Rung | Gap? |
| --- | --- | --- | --- | --- |
| Chat column: header, thread, composer | `agent/chat-shell` | `surface="mobile"`; `ChatShellHeader` (title "Ask AXS", subtitle, `online`, actions), `ChatShellThread`, `ChatShellComposer` with `disclaimer` | 1 | No |
| Welcome screen with starter prompts | `agent/welcome-state` + `agent/starter-prompt-card` | greeting, `subtitle`, `composer`, three cards as `children` (one column on mobile) | 1 | No |
| Composer with voice | `agent/prompt-input` | `size="compact"`, `onVoice`, `listening` (shows `agent/voice-waveform`) | 1 | No (the voice input is mocked) |
| User and agent messages | `agent/message-row` | `role="user" \| "assistant"`, `status`, `timestamp` | 1 | No |
| "Searching AXS…" tool steps (`findEvents`, `getSeats`) | `agent/tool-log-line` | `status` running → done; one line per tool call | 1 | No |
| Optional reasoning detail | `agent/thinking-panel` | `status`; collapsed by default | 1 | No |
| Follow-up chips ("Step-free seats", "Closer to the stage", "Sunday instead") | `agent/quick-reply` | `QuickReplyGroup`, `QuickReply` | 1 | No (skin note below) |
| Applied filter chips ("Under £80", "2 tickets") | `agent/quick-reply` | `QuickReplyFilter` (pressed, removable) | 1 | No |
| Clarifying question when the ask is vague ("Which day?") | `agent/clarifying-question` | one question, options as numbered rows | 1 | No |
| Show results, 3 cards | `agent/offer-carousel` + `agent/offer-card` | `title`, `count`, `OfferCard layout="vertical"` slides, `media` = poster art, `badge`, `meta` (date line), `subtitle` (venue), `price` ("From £[price]"), `ctaLabel="View dates"` | 1 | No (the card is 220px wide: prices must be short) |
| Compact result row (when one match) | `agent/offer-card` | `layout="horizontal"` | 1 | No |
| "Ranked for you" label | `agent/memory-notice` | `status="used"`, `title`, `description`, `actions` (popover explains what was used) | 1 | No |
| Personalisation consent ("Use your AXS history to rank shows?") | `agent/approval-card` | `status="pending"` tile, `ApprovalCardField` rows (what is used), footer `note`, Allow / Not now | 2 | No |
| Sample-data note | `ui/alert` or `ui/marker` | neutral, size xs | 1 | No |
| Toast ("We'll tell you if seats appear") | `ui/sonner` | `toast()` | 1 | No |

Skin note: Anvil's `QuickReply` has `data-slot="quick-reply"` (radius md, changed from a pill by design on 2026-10-14),
so it is not covered by the pill rule for chips. Making it a pill for AXS is one more selector in `axs-brand.css`. Say
if you want it.

## 2 · Dates and quantity

| Element | Anvil component | Props / use | Rung | Gap? |
| --- | --- | --- | --- | --- |
| Date picker with lowest price per day and "few left" | `agent/availability-calendar` | `availability` map (`yyyy-MM-dd` → `{ level, price }`), selection callback, `anvil/legend-item` legend | 1 | No |
| Showtimes for the chosen date (and doors-open note) | `agent/slot-list` | `slots` (`time`, `label`, `price`, `availability`, `availabilityLabel`), `Marker` note "Doors open 6:30 PM" | 1 | No |
| How many tickets | `agent/quantity-selector` | one type "Ticket", `maxTotal` (AXS limit per order), summary line, confirm | 1 | No |
| "Doors open" fact | `ui/badge` or `ui/marker` | `variant="subtle"` | 1 | No |

## 3 · Seats

| Element | Anvil component | Props / use | Rung | Gap? |
| --- | --- | --- | --- | --- |
| Seat map with sections, highlighted matches, selectable | none (`agent/map-view` draws a geographic map with pins) | `SeatMapCard` | 4 | **Yes**: seat map |
| "Best value" and "Closest" seat options (section, row, seats, all-in price, badges) | `anvil/choice-card` in `ui/radio-group`, `anvil/price` | `ChoiceCard control="radio"` with `detail`, trailing value; `Badge` for "Best value", `Marker` for view notes | 3 | No (revisit in Phase 3: only a candidate if the row needs more than this) |
| All-in price breakdown (tickets, booking fee, total, "includes fees") | `ui/card` + `anvil/key-value-row` + `anvil/price` | `size="lg"` for the total; fee lines as rows | 3 | **Maybe**: a reusable price breakdown (see candidates) |
| Compare the two options | `agent/comparison-table` | two `options`, `best` per row, `chooseLabel` | 2 | No (optional) |
| Refinements ("Closer to the stage", "Step-free access") | `agent/quick-reply` | re-run the scripted search | 1 | No |

## 4 · Hold and hand-off

| Element | Anvil component | Props / use | Rung | Gap? |
| --- | --- | --- | --- | --- |
| "Hold these 2 seats" confirmation | `agent/approval-card` | `status="pending"`, `ApprovalCardField` rows (event, seats, all-in total), footer `note` "Payment completes on AXS" | 1 | No |
| Seats held, with a 10:00 countdown | `agent/approval-card` + `agent/action-status` | `status="executing"`-style strip with `progress` from time left. A live countdown that screen readers don't announce every second is not what `ActionStatus` (`role="status"`) does | 3, then 4 | **Probably**: countdown variant (see candidates) |
| Hold expired, "Hold again" | `agent/action-status` | `status="expired"`, `action` = Hold again | 1 | No |
| "Continue on AXS" | `ui/button` | brand, one primary per screen, pinned bottom-right of the card footer | 1 | No |
| AXS checkout stub (event summary, sticky "Select Offer") | `ui/card`, `anvil/shell` (footer), `ui/button` | a plain AXS-styled page, labelled as a stub | 3 | No (app-specific) |

## 5 · Stretch: sold out and AXS Official Resale

| Element | Anvil component | Props / use | Rung | Gap? |
| --- | --- | --- | --- | --- |
| Sold-out show card with alternatives | `agent/offer-card` | `unavailable`, `soldOutLabel`, `alternativesLabel` (Anvil built this in) | 1 | No |
| Resale listings (section, row, "Verified", all-in price) | `anvil/choice-card` or `agent/offer-card layout="compact"` | same pattern as seat options, with `Badge` "Verified" | 3 | No |
| "Notify me" | `ui/button` + `ui/sonner` | outline button, toast | 1 | No |

## Cross-cutting

| Element | Anvil component | Props / use | Rung | Gap? |
| --- | --- | --- | --- | --- |
| Theme toggle (dark default, light) | `ui/button` | `variant="ghost"`, `size="icon-sm"` (built in Phase 0) | 1 | No |
| "Reset the demo" | `ui/dropdown-menu` | in the chat header actions | 1 | No |
| Loading and empty states | `ui/skeleton`, `ui/empty-state`, `agent/widget-error`, `agent/streaming-placeholder` | per card | 1 | No |
| Icons | `ui/icon` | `Icon`, glyphs re-exported from Anvil | 1 | No |

## Expected candidates (details in `anvil-upgrade-candidates.md`)

1. **Seat map card** — new component. Certain.
2. **Launcher, mobile variant** — new variant of `Launcher` (opens a full-height drawer, not a popover). Likely.
3. **Hold countdown** — variant of `ActionStatus` (a countdown that doesn't announce every second). Likely; decided
   when the screen is built.
4. **Price breakdown** — new component, only if the `Card` + `KeyValueRow` + `Price` arrangement turns out to repeat
   across seats, resale and checkout. Possible.

App-specific, not candidates: `PosterArt`, `AxsTabBar`, the host-page header and the checkout stub.

## Anvil observations so far (not blockers)

- `Launcher` is popover-only (400 × 640); there is no mobile launcher pattern.
- `OfferCard` vertical is a fixed 220px, so long price text clips the button. Keep price text short, or add a
  `price` that wraps.
- `QuickReply` is a medium-radius chip by design; AXS draws pills.

## As built (Phase 3)

What the screens actually use, where it differs from the map above.

- **Host page:** `InputGroup` (search), `Card` tiles with the cover art, and the local `AskLauncher` (floating button + Drawer). No toggle group and no tab bar: both would be dead controls.
- **Chat:** `ChatShell surface="mobile"`, `WelcomeState` + `StarterPromptCard`, `MessageRow`, `ToolLogLine`, `QuickReply`, `PromptInput` (compact). **Voice is left out:** the mock can't listen, and the screen must not claim it can.
- **Results:** local `ShowCarousel` (Anvil's `OfferCarousel` with free scrolling: it can't take Embla options) + `OfferCard`; consent is an `ApprovalCard` (pending → approved or denied).
- **Dates:** `AvailabilityCalendar`, shown only when a show has two or more dates (Kings of Leon). One-date shows go straight to seats, and the agent says the date.
- **Quantity:** `QuantitySelector` (a stepper), shown only when the ask didn't say how many tickets, before the search ("Anything live at The O2 next summer?") or after a date is picked.
- **Showtimes:** `SlotList` is **not used**: every date has one showtime in the sample data.
- **Seats:** local `SeatMapCard` + `RadioGroup` of `ChoiceCard`s with `Badge`s ("Best value", "Closest").
- **Hold:** `ApprovalCard` (confirm → held → expired) with the local `HoldCountdown` in its footer; "Continue on AXS" is a link to the checkout stub (`/checkout/:holdId`).
- **Skin:** brand colours, pill buttons, chips and quick replies, and the agent colour family re-tinted from purple to AXS blue, all in `axs-brand.css`.
- **Fan support (Phase 4):** a refund-and-transfer question gets a placeholder answer (`[AXS refund, transfer and resale wording goes here.]`), and "Talk to a person" shows an `ApprovalCard` listing what a person would see (last message, show, seats, hold). It says plainly that the preview isn't connected to a team.
- **Tap targets (Phase 4):** primary actions are `size="lg"` (48px). The header icon buttons are Anvil's `icon-sm` (32px, as in the Chat Shell story) with an invisible 44px tap area (`.touch-target` in `axs-brand.css`); a first attempt at `icon-lg` made them look padded. Other Anvil-sized controls (carousel arrows, "View dates", send, month arrows) stay at 32px with no extra tap area: see the review report.
- **Launch (Phase 5):** Ask AXS opens as a full-screen modal (the Drawer at full height, no handle, `handleOnly`); its close button or Escape closes it.
