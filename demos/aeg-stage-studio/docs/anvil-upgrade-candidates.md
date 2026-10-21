# Anvil upgrade candidates

Local components built in `src/components/local/` that Anvil doesn't have. Dawid decides what goes into Anvil.

## daylight-timeline
- Type: new component
- Needed for: `/brief` (performance time slot card)
- Closest Anvil option checked: `agent/widget-metric-card`, `anvil/timeline`, `anvil/progress-steps`, `ui/progress`: none plots a time range against the phases of the day
- Proposed API: `start`, `end`, `sunset` (minutes after midnight), optional `from`, `to`
- Built from: tokens only (`bg-primary`, `bg-info-subtle`, `bg-warning-subtle`, `bg-agent-subtle`, `bg-background-inverse`, `stroke-warning-medium`)
- States covered: sunset set, afternoon set, after-dark set
- Accessibility notes: the chart is `role="img"` with a full text alternative; the same summary is visible as a caption
- Story: `src/components/local/DaylightTimeline/DaylightTimeline.stories.tsx`
- Recommendation: keep app-specific (scheduling content), but the phase bar could become a general "range on a scale" part

## clip-player
- Type: new component
- Needed for: `/motion` (and later `/review` motion tab)
- Closest Anvil option checked: `agent/widget-media` (audio player: play, waveform, duration) and `ui/slider` — no video preview with a scrubber and a before/after comparison
- Proposed API: `poster`, `comparePoster`, `compare`, `seconds`, `label`, `busy`
- Built from: `ui/button`, `ui/slider`, tokens only
- States covered: default, compare, busy
- Accessibility notes: frame is `role="img"` with `label`; Play/Pause/Replay button changes its name; scrubber has `aria-label`; time is an `<output>`
- Story: `src/components/local/ClipPlayer/ClipPlayer.stories.tsx`
- Recommendation: add to Anvil (swap `poster` for a `<video>` source)

## clip-tile
- Type: new component
- Needed for: `/motion` set-list strip
- Closest Anvil option checked: `anvil/choice-card`, `ui/card` interactive, `agent/task-card` — none is a selectable thumbnail with a render status
- Proposed API: `song`, `title`, `status` ready · generating · not-started, `poster`, `selected`
- Built from: `ui/card` (asChild button), `ui/badge`, `ui/spinner`
- States covered: ready, selected, generating, not started
- Accessibility notes: `aria-pressed` for selection; status is visible text
- Story: `src/components/local/ClipTile/ClipTile.stories.tsx`
- Recommendation: add as variant of a media/choice card

## pinned-image
- Type: new component
- Needed for: `/review` (stills tab)
- Closest Anvil option checked: `agent/element-spotlight`, `agent/widget-media`, `agent/media-gallery` — none places numbered markers on an image or links them to a comment list
- Proposed API: `src`, `alt`, `pins` (`id`, `number`, `x`, `y`), `activeId`, `onActiveChange`, `resolvedIds`
- Built from: `ui/button` (circle, icon-xs), tokens only
- States covered: default, active pin, resolved pins
- Accessibility notes: each pin is a toggle button named "Comment N"; resolved is part of the name; the comment list is the keyboard-friendly equivalent
- Story: `src/components/local/PinnedImage/PinnedImage.stories.tsx`
- Recommendation: add to Anvil

## Anvil issues found
- `MessageAction` used as a `PopoverTrigger asChild` works, but needs a `TooltipProvider` above it (the app provides one).
- `ui/sidebar` `SidebarMenuButton size="lg"` sets `p-0!` when collapsed (`collapsible="icon"`), so anything smaller than a
  32px avatar sits in the top-left corner instead of centred. Workaround: `className="group-data-[collapsible=icon]:p-2!"`.
- `ui/sidebar` pads `SidebarHeader` 12px but `SidebarContent` and `SidebarFooter` 8px, so header and content icons sit 4px
  apart, expanded and collapsed (only 12px centres a 32px button in the 56px icon rail). Workaround: `className="px-3"`
  on content and footer. Suggest one padding value for all three.
- `ui/sidebar` menu text hidden in the collapsed state also drops the link's accessible name; links need an
  `aria-label` (or Anvil could keep the label as `sr-only`).
