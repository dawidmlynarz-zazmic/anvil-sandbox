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
- Needed for: the Motion card on a moment page, and the show preview
- Closest Anvil option checked: `agent/widget-media` (audio player: play, waveform, duration) and `ui/slider` — no video preview with a scrubber and a before/after comparison
- Proposed API: `poster`, `comparePoster`, `compare`, `seconds`, `label`, `busy`, `renderFrame(t, variant)` (draws the frame live, e.g. a 3D scene), `compareLabels`, `autoPlay` and `onEnded` (play clips in sequence, as the show preview does), `model` (names the model over the clip)
- Built from: `ui/button`, `ui/slider`, tokens only
- States covered: default, compare, busy
- Accessibility notes: frame is `role="img"` with `label`; Play/Pause/Replay button changes its name; scrubber has `aria-label`; time is an `<output>`
- Story: `src/components/local/ClipPlayer/ClipPlayer.stories.tsx`
- Recommendation: add to Anvil (swap `poster` for a `<video>` source)

## clip-tile
- Type: new component
- Needed for: the show preview's moment strip
- Closest Anvil option checked: `anvil/choice-card`, `ui/card` interactive, `agent/task-card` — none is a selectable thumbnail with a render status
- Proposed API: `song`, `title`, `status` ready · generating · not-started, `poster`, `selected`
- Built from: `ui/card` (asChild button), `ui/badge`, `ui/spinner`
- States covered: ready, selected, generating, not started
- Accessibility notes: `aria-pressed` for selection; status is visible text
- Story: `src/components/local/ClipTile/ClipTile.stories.tsx`
- Recommendation: add as variant of a media/choice card

## pinned-image
- Type: new component
- Needed for: notes pinned on an image in `ConceptCard` (Annotate); first built for the review step, since removed
- Closest Anvil option checked: `agent/element-spotlight`, `agent/widget-media`, `agent/media-gallery` — none places numbered markers on an image or links them to a comment list
- Proposed API: `src`, `alt`, `pins` (`id`, `number`, `x`, `y`), `activeId`, `onActiveChange`, `resolvedIds`
- Built from: `ui/button` (circle, icon-xs), tokens only
- States covered: default, active pin, resolved pins
- Accessibility notes: each pin is a toggle button named "Comment N"; resolved is part of the name; the comment list is the keyboard-friendly equivalent
- Story: `src/components/local/PinnedImage/PinnedImage.stories.tsx`
- Recommendation: add to Anvil

## concept-card
- Type: new component (replaces using `agent/image-generation-card` on Stills)
- Needed for: `/stills`
- Closest Anvil option checked: `agent/image-generation-card` (one prompt row, actions as icon buttons, no place for
  versions, a description field, a check result or selection) and `ui/card` with `ui/checkbox`: selection and
  feedback were hard to find and the note rendered outside the card
- Proposed API: `title`, `rationale`, `version`, `change`, `mediaSrc`, `mediaAlt`, `previousMedia`, `checks`,
  `selected` + `onSelectedChange`, `dismissed`, `busy`, `variants` + `onPickVariant` / `onCloseVariants`,
  `annotations` + `onAddAnnotation(text, at?)` / `onRemoveAnnotation` / `onApplyAnnotations`, `onMoreLikeThis`,
  `onRegenerate`, `onRestorePrevious`, `onToggleDismissed`, `readOnly`, `primaryAction` (the card's main action, on the
  footer's left in place of Select, e.g. “Generate motion”)
- Built from: `ui/card` (+ `CardAction`, `CardFooter`), `ui/checkbox`, `ui/input`, local `PinnedImage`, `ui/dropdown-menu`, `ui/popover`,
  `anvil/check-row`, `ui/badge`, `ui/skeleton`, `ui/spinner`
- States covered: default, selected, annotating with pinned and whole-concept changes, v2 with compare, refining,
  variations (loading and ready), dismissed, read-only, with a primary action;
  plus `ConceptCardPending` while generating
- Accessibility notes: Select is a checkbox named per concept; Annotate is a toggle (`aria-pressed`); the change field
  is labelled with the pin number or “whole concept”; pins are numbered buttons; the
  brief-check badge is a button with its result in its name; variations are buttons named “Use variation N”
- Story: `src/components/local/ConceptCard/ConceptCard.stories.tsx`
- Since the reduction audit: `mediaBadge` (e.g. the model, over the image), `titleBadge`, `compareInMenu` (compare
  with the previous version from the menu, for a leaner card) and `menuItems` (e.g. Provenance)
- Since Phase 1: also the focus panel on a moment page, numbered as a series (`versionPrefix="#"`, `selectLabel="Pin"`,
  `regenerateLabel="Another take"`, `applyHint`, and `children` for lineage under the image)
- Recommendation: add to Anvil as a generated-asset card (it isn't stage-specific)

## profile-questions
- Type: extension of `agent/clarifying-question` (two more answer types)
- Needed for: the chat's opening questions on a new brief
- Closest Anvil option checked: `agent/clarifying-question` (option buttons only: no dropdown for a long list like
  every stage, no free-text answer) and `agent/question-set` (chips, all questions at once)
- Proposed API: on each question, `kind: 'options' | 'select'` and `allowOther` (a "describe your own" field under
  the options); everything else as Clarifying Question (steps, Back, Skip, Submit, number keys,
  `ClarifyingAnswers` for the reply)
- Built from: the same parts as Clarifying Question (`anvil/shell` header and footer, `anvil/icon-tile`, `ui/progress`,
  `ui/button` + `ui/kbd` options) plus `ui/select` and `ui/input-group`
- States covered: options, dropdown, options + own answer, answered, skipped, last step with Submit
- Accessibility notes: the card is named by the question; the dropdown is named by the question; the own-answer field
  has a label; number keys pick options except while typing
- Story: none yet (used in `ChatPanel.tsx`)
- Recommendation: add `kind` and `allowOther` to Anvil's Clarifying Question rather than a new component

## tag-input
- Type: new component
- Needed for: `/brief` (Visual direction keywords)
- Closest Anvil option checked: `anvil/chip` (the tag itself, with `onRemove`) next to `ui/input-group` with an Add
  button: it needed a separate field and button, and tags sat outside the field
- Proposed API: `label`, `value` + `onValueChange` (string[]), `placeholder`, `hint`; a comma or Enter adds a tag,
  pasted "a, b, c" adds three, Backspace in an empty field removes the last
- Built from: `anvil/chip` (outline, sm) inside a box styled like `ui/input` (same inset ring, hover and focus ring)
- States covered: empty with placeholder, tags with typing, focus
- Accessibility notes: the label names the text field; the tag list is named with its count; each tag's remove button
  is named “Remove <tag>”; the hint is linked with `aria-describedby`
- Story: none yet (used in `BriefCards.tsx`)
- Recommendation: add to Anvil as `ui/tag-input` (or a `multiple` mode for Input)

## contact-sheet
- Type: new component (`ContactSheetGroup` + `ContactSheetTile`)
- Needed for: `/m/:song` (a key moment's exploration: every image, grouped by batch)
- Closest Anvil option checked: `agent/media-gallery` (a gallery to view, not to triage: no pin, no compare tick, no
  status per image), `agent/image-generation-card` (one image per card, too big for 20+ images) and local `ClipTile`
  (one selection, no pin or compare)
- Proposed API: group `title`, `meta`, `pending` (placeholder count); tile `label`, `caption`, `src`, `alt`,
  `focused`, `chosen` (a badge, e.g. “Look”), `dismissed`, `onOpen` (pinning and comparing were removed: the open
  image's own actions cover them)
- Built from: `ui/badge`, `ui/button` (icon-xs), `ui/skeleton`, tokens only
- States covered: default, focused, chosen, set aside, rendering
- Accessibility notes: each image is a button named with its number, caption and state (`aria-pressed` when open);
  each batch is a named section with a heading
- Story: `src/components/local/ContactSheet/ContactSheet.stories.tsx`
- Recommendation: add to Anvil as a generated-asset grid; it pairs with `concept-card` (the focus view)

## Anvil issues found
- `MessageAction` used as a `PopoverTrigger asChild` works, but needs a `TooltipProvider` above it (the app provides one).
- `ui/sidebar` `SidebarMenuButton size="lg"` sets `p-0!` when collapsed (`collapsible="icon"`), so anything smaller than a
  32px avatar sits in the top-left corner instead of centred. Workaround: `className="group-data-[collapsible=icon]:p-2!"`.
- `ui/sidebar` pads `SidebarHeader` 12px but `SidebarContent` and `SidebarFooter` 8px, so header and content icons sit 4px
  apart, expanded and collapsed (only 12px centres a 32px button in the 56px icon rail). Workaround: `className="px-3"`
  on content and footer. Suggest one padding value for all three.
- `ui/sidebar` menu text hidden in the collapsed state also drops the link's accessible name; links need an
  `aria-label` (or Anvil could keep the label as `sr-only`).
