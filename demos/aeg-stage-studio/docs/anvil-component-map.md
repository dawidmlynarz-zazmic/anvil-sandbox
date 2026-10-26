# Anvil component map

Started with the Brief screen; extended per screen. Since the moments-first loop (Phase 1, see `plan-moments.md`) the
Stills and Motion screens below are replaced by the Show board and the Moment page; their tables stay as a record.

| Wireframe element | Anvil component | Props | Gap? |
| --- | --- | --- | --- |
| Stepper (Brief, Stills, Motion, Review) | `anvil/progress-steps` | `status` done · current · upcoming | No (`anvil/stepper` is a quantity control) |
| Round badge, working-name tag | `ui/badge` | `tone`, `variant` | No |
| Breadcrumb | `ui/breadcrumb` | | No |
| Agent panel / workspace split (drag to resize, width remembered) | `ui/resizable` | `ResizableHandle withHandle`; panel sizes in px (`defaultSize`, `minSize`, `maxSize`), `onLayoutChanged` `isUserInteraction` to save | No |
| Agent chat messages | `agent/message-row` | `role`, `status`, `widget` | No |
| Mood-board thumbs, setlist PDF | `ui/attachment` | `size`, `orientation`, `AttachmentMedia variant="image"` | No |
| Clarifying chips | `agent/quick-reply` | `QuickReplyGroup` | No |
| Composer | `agent/prompt-input` | `onSubmit`, `onAttach` | No |
| Venue select, budget band | `ui/select` + `ui/field` | | No |
| Venue spec grid | `anvil/key-value-row` | | No |
| Keyword chips | `anvil/chip` | `onRemove` | No |
| Set-list tiles | `ui/card` + `ui/badge` | `size="sm"` | No |
| Daylight timeline | local `DaylightTimeline` | | **Yes** (see candidates) |

## Stills (`/stills`)

| Wireframe element | Anvil component | Props | Gap? |
| --- | --- | --- | --- |
| Concept card (image, title, actions) | `agent/image-generation-card` | `status` ready · generating, `prompt`, `actions`, `primaryAction` | No |
| Pin, Comment actions | `agent/message-actions` `MessageAction` | `pressed` for Pin | No |
| Comment box | `ui/popover` + `ui/textarea` | | No |
| Skeleton while re-rendering | `image-generation-card` `status="generating"` | | No |
| Time of day / Crowd / Camera view | `ui/toggle-group` | `type="single"` `variant="outline"` `size="sm"` | No |
| Round history | `ui/item` | `variant="outline"`, `selected` | No |
| Compare pinned | `ui/dialog` | | No |
| Metrics row | `agent/widget-metric-card` + `WidgetMetricGroup` | | No |
| Pinned badge | `ui/badge` | `tone="brand"` | No |

## Motion (`/motion`)

| Wireframe element | Anvil component | Props | Gap? |
| --- | --- | --- | --- |
| Video player with scrubber | local `ClipPlayer` (on `ui/button`, `ui/slider`) | | **Yes** |
| Compare night toggle | `ui/switch` + `ui/label` | | No |
| Cue panel | `ui/card` + `anvil/key-value-row` | `layout="aligned"` | No |
| Edit in plain words | `ui/input` | `label`, `hint` | No |
| Model label | `ui/badge` | `tone="neutral" variant="outline"` | No |
| Set-list clip tiles | local `ClipTile` (on `ui/card`, `ui/badge`, `ui/spinner`) | | **Yes** |
| Agent reasoning in chat | `agent/thinking-panel`, `agent/tool-call-item` | | No |

## App shell

| Element | Anvil component | Gap? |
| --- | --- | --- |
| Progress rail (vertical stepper with status lines and links) | `anvil/timeline` (`marker="tile"`) | No |
| "Next" hint under the rail | `ui/alert` `size="xs"` `tone="agent"` | No |
| Show/hide agent and progress | `ui/button` `aria-pressed` | No |
| Invite artist | `ui/dialog` + `ui/input` + `ui/alert` | No |
| Brief provenance ("From the agent" / "Edited by you") | `ui/badge` in `CardAction` | No |
| Keyword add field | `ui/input-group` | No |
| Selectable concept | `ui/checkbox` on `agent/image-generation-card` | No |
| List / grid layout of concepts | `ui/toggle-group` | No |
| "Brief changed since round N" | `ui/alert` `tone="warning"` with action | No |
| Note on a concept (saved / editing / applied) | `ui/alert` `size="xs"`, `ui/textarea` | No |
| Scene dropdowns | `ui/select` | No |
| Review waiting state | `ui/card` + `ui/spinner` | No |
| Request changes (pick comments) | `ui/dialog` + `ui/checkbox` | No |
| Approve with open comments | `ui/alert-dialog` | No |

## Home (`/`)

| Element | Anvil component | Props | Gap? |
| --- | --- | --- | --- |
| Project card (thumbnail, show, venue, status) | `ui/card` `asChild` (a link) | interactive card | No |
| Status pill | `ui/badge` | `shape="pill"`, `indicator`, `variant="subtle"` | No |
| New project card | `ui/card` `asChild` (a button) + `NewProjectDialog` | | No |
| All projects link | `ui/sidebar` `SidebarMenuButton` `asChild` | `isActive` | No |

## Show board (`/show`)

| Element | Anvil component | Props | Gap? |
| --- | --- | --- | --- |
| Running metrics | `agent/widget-metric-card` + `WidgetMetricGroup` | | No |
| Moment card (look, light, status, clip) | `ui/card` `size="sm"`, `ui/badge` | | No |
| Add a key moment | `ui/card` + `ui/input` | | No |
| Send the show | `ui/dialog` (SendDialog) | | No |
| Preview (the show's clips in order) | `ui/dialog` + local `ClipPlayer` (`autoPlay`, `onEnded`) + local `ClipTile` | | Yes (local parts) |
| Kit status on a moment card | `ui/badge` | `variant="outline"` | No |

## Moment page (`/m/:song`)

| Element | Anvil component | Props | Gap? |
| --- | --- | --- | --- |
| Focus panel | local `ConceptCard` | `versionPrefix="#"`, `compareInMenu`, `menuItems` | **Yes** (see candidates) |
| Lineage (#2 → #6 → #12) | `ui/breadcrumb` | `BreadcrumbLink asChild` buttons | No |
| Batch toolbar | `ui/button-group` + `ui/button` | outline, sm; icon-only when narrow | No |
| Contact sheet | local `ContactSheet` | | **Yes** (see candidates) |
| Venue checks per look (footprint and checks) | `anvil/key-value-row` + `anvil/check-row` (included · pending · excluded) + `ui/badge` | | No |
| Motion | `ui/card` + local `ClipPlayer` + `anvil/key-value-row` + `ui/input` | | Yes (ClipPlayer) |
| Previous / next moment | `ui/button` `size="icon-sm"` | | No |
| Describe the stage (empty song) | `agent/prompt-input` + `agent/quick-reply` suggestions that fill it | | No |
| Explore / Asset kit | `ui/tabs` `variant="line"` | in the URL (`?tab=assets`) | No |
| The look in motion, first on the page | `ui/card` + local `ClipPlayer` + `anvil/key-value-row` + `ui/input` | | Yes (ClipPlayer) |
| Asset kit (stills, motion variants, pilot-only items) | `ui/card`, local `ClipPlayer` + `ClipTile`, `anvil/check-row` | | Yes (ClipPlayer, ClipTile) |
| Kit out of date | `ui/alert` `tone="warning"` with action | | No |
| Provenance on every image and asset | `ui/popover` + `anvil/key-value-row` + `anvil/check-row` | | No |

## Review (`/review`), moments-first

| Element | Anvil component | Props | Gap? |
| --- | --- | --- | --- |
| A tab per moment, with open-comment count | `ui/tabs` `variant="line"` + `ui/badge` | | No |
| Look with the artist's pins | local `PinnedImage` | | Yes |
| Approve the show (one sign-off) | `ui/alert-dialog` | | No |

## Handoff (`/handoff`), by trade

| Element | Anvil component | Props | Gap? |
| --- | --- | --- | --- |
| A tab per trade | `ui/tabs` `variant="line"` | in the URL (`?trade=`) | No |
| Credits (who decided what) | `ui/card` + `anvil/key-value-row` | | No |
| Per-moment rows for a trade | `ui/card`, `anvil/key-value-row`, kit thumbnails | | No |
| Decision log | `anvil/timeline` | | No |

## Header (after the reduction audit)

The progress rail was removed; its parts live where they're used.

| Element | Anvil component | Props | Gap? |
| --- | --- | --- | --- |
| Steps with a status dot | `ui/button` `variant="ghost"` `asChild` (NavLink), `aria-current="page"` | | No |
| Model on generated media | `ui/badge` `tone="neutral"` `size="xs"`, 75% opacity, over the corner | | No |
| Running numbers | One line of text on the show board | | No |
| Explore (split button) | `ui/button-group` + `ui/dropdown-menu` | | No |
| Venue checks summary | `ui/badge` in a `ui/popover` trigger | | No |
| Add a key moment | `ui/dialog` with `ui/input` | | No |
| Venue details | `ui/collapsible` | | No |
