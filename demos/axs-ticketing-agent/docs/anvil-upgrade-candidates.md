# Anvil upgrade candidates

Local components built in `src/components/local/` that Anvil doesn't have. Dawid decides what goes into Anvil.

**Status after Phase 3.** Three candidates are built (each with a story and an `// ANVIL-CANDIDATE` marker); the fourth
(price breakdown) was not needed. Ordered by how sure I am.

## seat-map-card
- Status: **built** (`src/components/local/SeatMapCard/`). Sections are drawn from `src/mocks/arena.ts`; the component takes any list of rectangles.
- Type: new component
- Needed for: seats step (and resale, in the stretch)
- Closest Anvil option checked: `agent/map-view` (a geographic frame with price pins, clusters and a route: it has no
  sections, rows or seat state), `agent/location-list` (rows, no spatial view), `agent/availability-calendar` (the
  closest in feel: a grid of available, limited and unavailable cells)
- Proposed API: `sections` (`id`, `label`, `path`, `level` available · limited · unavailable, `price`), `highlighted`
  (ids that match the ask), `selected`, `onSelect`, `stage` (position label), `caption`
- Built from: tokens only (`--success`, `--warning`, `--muted`, `--primary`, `--border`), `Legend Item` for the key
- States covered: default, highlighted matches, selected, unavailable, loading (skeleton)
- Accessibility notes: an SVG `role="group"` with each section a real button (`aria-pressed`, label "Section 112, from
  £[price], 2 seats together"); the same options are always listed as radio cards under it, so the map is never the only
  way in
- Story: `src/components/local/SeatMapCard/SeatMapCard.stories.tsx`
- Recommendation: add to Anvil (any seated venue, travel or cinema)

## launcher-mobile
- Status: **built** as `AskLauncher` (`src/components/local/AskLauncher/`): the floating button plus a bottom Drawer. What Anvil's Drawer needed: `showCloseButton={false}` (the chat has its own close), `handleOnly` plus a hidden handle (so nothing drags it closed), and `!` overrides for height, margin, corners and position, which Anvil sets with attribute selectors. A `variant="fullscreen"` on `DrawerContent` would remove all of that. The demo portals the Drawer into its device frame (Vaul's `container`, with the frame as the containing block via a transform), so on a desktop the modal, its dimming and its slide-in stay inside the frame instead of sweeping across the browser window; `AskLauncher` takes that as a `container` prop. The demo's desktop device frame needs the Drawer aligned to it (`--frame-h`); a real phone doesn't.
- Type: new variant of `Launcher` (`surface="mobile"`)
- Needed for: the floating "Ask AXS" button on the host page
- Closest Anvil option checked: `agent/launcher` (a 56px circle that opens a popover Chat Shell, 400 × 640, above the
  button, right-aligned; fine on desktop, wrong on a phone); `agent/proactive-drawer` (a drawer, but it peeks a message
  and isn't a persistent launcher)
- Proposed API: `surface` popover · mobile; with mobile, `children` open as a full-screen modal in a bottom-sliding `Drawer` (no grab handle, not draggable, closed by the chat's own close button or Escape); same
  `unread`, `preview`, `offline` states
- Built from: `agent/launcher` button, `ui/drawer`, `agent/chat-shell surface="mobile"`
- States covered: idle, attention (`preview`), open, offline
- Accessibility notes: the button names the surface ("Ask AXS"); Drawer traps focus and returns it to the button on close
- Story: `src/components/local/AskLauncher/AskLauncher.stories.tsx`
- Recommendation: add as variant

## hold-countdown
- Status: **built** (`src/components/local/HoldCountdown/`): wraps `ActionStatus` (`role="timer"`, `aria-live="off"`) and announces only at 5:00, 1:00, 0:30 and expiry. Used inside an Approval Card's footer.
- Type: new variant/prop of `ActionStatus` (`countdown`)
- Needed for: "Seats held" (10:00), and the expired state
- Closest Anvil option checked: `agent/action-status` (`executing` with a `progress` bar, `expired` with an action) and
  `agent/approval-card`. Both cover the look. Neither is a timer: `role="status"` would announce every tick
- Proposed API: `expiresAt`, `onExpire`; renders the time left, drives `progress`, switches to `expired` at zero;
  announces at 5:00, 1:00 and expiry, not every second
- Built from: `agent/action-status`, `ui/progress` tokens
- States covered: counting, last minute (warning tone), expired, stopped
- Accessibility notes: `role="timer"` with `aria-live="off"`, plus a separate polite announcement at set points
- Story: `src/components/local/HoldCountdown/HoldCountdown.stories.tsx`
- Recommendation: add as variant

## price-breakdown (not needed)
- Status: **not built.** The tickets, fees and total are `ApprovalCardField` rows in the confirm card, and `KeyValueRow` on the checkout stub: two uses, no shared component. Revisit if resale adds a third.
- Type: new component
- Needed for: seat option detail, resale option, checkout stub
- Closest Anvil option checked: `anvil/price` (one price), `anvil/key-value-row`, `ui/card`, `agent/quantity-selector`
  footer (a running total). The arrangement `Card` + `KeyValueRow` + `Price size="lg"` works once
- Proposed API: `lines` (`label`, `amount`), `total`, `currency`, `note` ("Includes all fees")
- Built from: `ui/card`, `anvil/key-value-row`, `anvil/price`
- States covered: default, with discount, loading
- Accessibility notes: a description list; the total is named "Total, includes fees"
- Story: only if it is built
- Recommendation: keep as a composition unless it repeats across three screens; then add to Anvil

## offer-carousel-free-scroll
- Status: **built** as `ShowCarousel` (`src/components/local/ShowCarousel/`).
- Type: new prop of `OfferCarousel` (`opts` / `plugins` pass-through, or a `scroll="free"` option)
- Needed for: the show results (6 cards)
- Closest Anvil option checked: `agent/offer-carousel` (fixes Embla's options to `{ align: 'start' }` and takes no plugins, so a swipe always snaps to a card and a trackpad or mouse wheel can't scroll it sideways)
- Proposed API: `scroll` snap · free; with `free`, `dragFree` plus a wheel-gestures plugin
- Built from: `ui/carousel` (`Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`), `ui/card`, `embla-carousel-wheel-gestures` 8.1.0 (the demo's only added dependency; Anvil would need it too)
- States covered: many cards, two cards
- Accessibility notes: same as Offer Carousel (labelled region, arrow keys and Previous / Next step card by card); the swipe and the wheel are extras, not the only way
- Story: `src/components/local/ShowCarousel/ShowCarousel.stories.tsx`
- Recommendation: add as a prop of `OfferCarousel`

## border-beam
- Status: **built** (`src/components/local/BorderBeam/`), used on the Ask AXS composer.
- Type: new component (an effect around any field)
- Needed for: the composer at rest
- Closest Anvil option checked: none. `Prompt Input` has focus and streaming strokes but no ambient motion; `pulse-dot` and `text-shimmer` are the only moving parts. Reacticx's Border Beam is React Native (Skia and Reanimated), so it can't be used on the web: this recreates the effect in CSS
- Proposed API: `radius` (read from the field by default), `borderWidth`, `duration`, `beamLength` (px), `glow`, `ambient`, `color` (defaults to `var(--primary)`), named after Reacticx's props
- Built from: a thin gradient strip riding `offset-path: inset(... round <field radius>)`, so the beam moves at a constant speed along the edge; a mask cuts the layer to the border band, flush on the field's own 1px stroke (one border, not two); the glow is the same cut ring, blurred from a wrapper. The colour is Anvil's primary token, so it follows both themes
- States covered: resting (animating), focused or has text (steps aside for Anvil's focus ring), reduced motion (holds still), no glow
- Accessibility notes: decorative (`aria-hidden`, no pointer events); stops under `prefers-reduced-motion`; hides on focus so it never competes with the focus indicator. The beam is not the only cue that the field is ready
- Browser support: `offset-path: inset()` needs Chrome 116, Safari 17.2 or Firefox 122; older browsers show the field without the beam
- Story: `src/components/local/BorderBeam/BorderBeam.stories.tsx`
- Recommendation: keep app-specific, or add to Anvil as an optional agent-composer effect once Anvil has a motion guideline for ambient animation

## chroma-ring
- Status: **built** (`src/components/local/ChromaRing/`), used on the floating Ask AXS button.
- Type: new component (an attention effect around a button or field)
- Needed for: the Ask AXS launcher at rest
- Closest Anvil option checked: none. `Launcher` has an `attention` state (a pulse ring that stops under reduced motion) but no flowing ring; Reacticx's Chroma Ring is React Native (Skia and Reanimated), so this recreates the idea in CSS
- Proposed API: `radius` (read from the child by default), `borderWidth`, `duration`, `blur`, `base`, `colors` (three tones), named after Reacticx's props
- Built from: a conic gradient with two opposite highlights, cut down to the ring with a mask, plus a blurred copy behind for the glow; the tones default to Anvil's primary blue and `--primary-foreground`, so it follows both themes
- States covered: animating, no glow, reduced motion (holds still)
- Accessibility notes: decorative (`aria-hidden`, no pointer events); stops under `prefers-reduced-motion`; the button keeps its own focus ring and name
- Story: `src/components/local/ChromaRing/ChromaRing.stories.tsx`
- Recommendation: add to Anvil as an optional effect for `Launcher`'s `attention` state, or keep app-specific

## Not candidates (app-specific)

- `PosterArt`: typographic placeholder posters for fictional shows (no real artwork). Passed to `OfferCard` `media`.
- `AxsTabBar`, host-page header and event tiles: AXS site chrome, only there so the agent has a page to sit in.
- Checkout stub: a labelled placeholder page.

## Anvil issues found

- Anvil's radius scale stops at `2xl`, so `rounded-3xl` generates no class and fails silently (it left the demo's device frame square-cornered). An app needing a larger radius must define its own value.

None blocking; each has a local workaround.

- `Launcher` is popover-only (400 × 640): see `launcher-mobile`.
- `OfferCard` vertical is a fixed 220px, and `OfferCarousel` gives it a 13rem slide minus a 1rem gutter, so a 12rem card: the price and "View dates" clip when the price is long. `ShowCarousel` makes the slide 16rem (a 15rem, 240px card) and tells the card to fill it. A card that fills its slide, and a wider default slide, would fix it in Anvil.
- `DrawerContent` sets `max-height`, `margin`, `bottom` and the corner radius with `data-[vaul-drawer-direction=bottom]:` selectors, so a `className` override needs `!`. The handle can't be turned off by a prop. It also always renders a portal to `body`, so it can't be contained in a device frame without those overrides.
- `ChatShellThread` always opens at the end of the thread, so a tall `WelcomeState` opens scrolled past its heading on a phone. Worked around with `scrollToStart` while the thread is empty. A `defaultScrollPosition` prop on `ChatShellThread` would fix it.
- `WelcomeState` with three `StarterPromptCard`s is about 1.4 screens tall on a phone (the top padding is `--space-3xl`), so the third starter is below the fold.
- `QuickReply` is a medium-radius chip by design; AXS draws pills, handled in the skin (`axs-brand.css`).
- `ApprovalCard` always draws a warning-coloured shield tile and an amber "Needs your approval" badge while pending. The demo overrides the badge text ("Your choice") but not the tile, so a ticket hold looks like a risky action. A `tone` or `icon` prop would let it read as neutral.
