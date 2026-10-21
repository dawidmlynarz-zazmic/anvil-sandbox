# Anvil component map

Started with the Brief screen; extended per screen.

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
