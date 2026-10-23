// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#concept-card
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@anvil/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@anvil/components/ui/dropdown-menu'
import {
  CircleAlertIcon,
  CircleCheckIcon,
  ColumnsIcon,
  EllipsisIcon,
  HistoryIcon,
  Icon,
  LayersIcon,
  PencilIcon,
  RefreshCwIcon,
  SparklesIcon,
  ThumbsDownIcon,
  UndoIcon,
  XIcon,
  type LucideIcon,
} from '@anvil/components/ui/icon'
import { Checkbox } from '@anvil/components/ui/checkbox'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@anvil/components/ui/input-group'
import { Label } from '@anvil/components/ui/label'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@anvil/components/ui/popover'
import { Skeleton } from '@anvil/components/ui/skeleton'
import { Spinner } from '@anvil/components/ui/spinner'
import { CheckRow } from '@anvil/components/anvil/check-row'
import { cn } from '@anvil/lib/utils'
import { PinnedImage } from '~/components/local/PinnedImage/PinnedImage'
import { reveal } from '~/lib/reveal'

export interface ConceptCheck {
  label: string
  ok: boolean
  detail: string
}

export interface ConceptCardProps {
  title: string
  /** One line on why the agent made this concept. */
  rationale?: string
  version: number
  /** What produced the current version, e.g. “Sharper top edge”. */
  change?: string
  /** The current image's URL. */
  /** Undefined while the image is still rendering: the card shows a placeholder. */
  mediaSrc?: string
  mediaAlt: string
  /** The previous version: enables Compare (a dialog with both, side by side) and Revert. */
  previous?: {
    version: number
    src?: string
    /** The changes that turned it into the current version; pinned ones are shown on its image. */
    changes?: { number: number; text: string; x?: number; y?: number }[]
  }
  /** The brief and venue check: every item passes, or some need a look. */
  checks?: ConceptCheck[]
  selected: boolean
  onSelectedChange: (selected: boolean) => void
  /** “Not this direction”: greyed out, can be brought back. */
  dismissed?: boolean
  /** Shown over the image while the agent works on this concept, e.g. “Refining…”. */
  busy?: string
  /** “More like this”: candidates to pick from, or 'generating'. */
  variants?: ReactNode[] | 'generating'
  /** What differs in each variation, in a few words, shown under it. */
  variantCaptions?: string[]
  onPickVariant?: (index: number) => void
  onCloseVariants?: () => void
  /** Changes noted but not applied: pinned to a spot (x, y: 0–100) or about the whole concept. */
  annotations?: { number: number; text: string; x?: number; y?: number }[]
  onAddAnnotation?: (text: string, at?: { x: number; y: number }) => void
  onRemoveAnnotation?: (number: number) => void
  /** Makes the next version from every noted change. */
  onApplyAnnotations?: () => void
  onMoreLikeThis?: () => void
  onRegenerate?: () => void
  /** Makes the previous version current again (as a new version; nothing is lost). */
  onRevert?: () => void
  onToggleDismissed?: () => void
  /** Looking back at an earlier round: select only, no edits. */
  readOnly?: boolean
  /** How the version is written: “v” (v3, the default) or “#” (#12, for images numbered in a series). */
  versionPrefix?: string
  /** The footer toggle's label, e.g. “Select” (default) or “Pin”. */
  selectLabel?: string
  /** The menu item that makes a new take, e.g. “Regenerate this concept” (default) or “Another take”. */
  regenerateLabel?: string
  /** Under “Apply changes”: what applying makes. Default: “Makes v4. v3 is kept.” */
  applyHint?: string
  /** Shown over the image's bottom-left corner, e.g. the model that made it. */
  mediaBadge?: ReactNode
  /** Shown after the version in the title, e.g. a “Look” badge. */
  titleBadge?: ReactNode
  /** Compare with the previous version from the menu instead of a line under the image (a leaner card). */
  compareInMenu?: boolean
  /** More items for the “More actions” menu, before “Not this direction”. */
  menuItems?: { label: string; icon: LucideIcon; onSelect: () => void }[]
  /** Extra content under the image, e.g. lineage or a call to action. */
  children?: ReactNode
  className?: string
}

/**
 * One generated stage concept, with everything you can do to it on the card itself: select it, annotate what should
 * change (numbered pins on the image, applied together as the next version), ask for more like it, compare with the
 * previous version, or set it aside.
 */
export function ConceptCard({
  title,
  rationale,
  version,
  change,
  mediaSrc,
  mediaAlt,
  previous,
  checks,
  selected,
  onSelectedChange,
  dismissed,
  busy,
  variants,
  variantCaptions,
  onPickVariant,
  onCloseVariants,
  annotations = [],
  onAddAnnotation,
  onRemoveAnnotation,
  onApplyAnnotations,
  onMoreLikeThis,
  onRegenerate,
  onRevert,
  onToggleDismissed,
  readOnly,
  versionPrefix = 'v',
  selectLabel = 'Select',
  regenerateLabel = 'Regenerate this concept',
  applyHint,
  mediaBadge,
  titleBadge,
  compareInMenu,
  menuItems = [],
  children,
  className,
}: ConceptCardProps) {
  const v = (n: number) => `${versionPrefix}${n}`
  const [annotating, setAnnotating] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null)
  const [text, setText] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const firstVersion = useRef(version)
  // A new version (applied changes, a pick, a refine from the chat): bring the card back into view to show it.
  useEffect(() => {
    if (version === firstVersion.current) return
    firstVersion.current = version
    reveal(cardRef.current)
  }, [version])
  // After placing a pin, type straight away.
  useEffect(() => {
    if (pin) inputRef.current?.focus()
  }, [pin])
  const issues = checks?.filter((c) => !c.ok) ?? []
  const editable = !readOnly && !dismissed && !busy
  const nextNumber = (annotations.at(-1)?.number ?? 0) + 1
  const pins = annotations.flatMap((a) => (a.x !== undefined && a.y !== undefined ? [{ id: String(a.number), number: a.number, x: a.x, y: a.y }] : []))
  const addNote = () => {
    const value = text.trim()
    if (!value) return
    onAddAnnotation?.(value, pin ?? undefined)
    setText('')
    setPin(null)
  }

  return (
    <Card ref={cardRef} className={cn('@container/card scroll-mt-4 gap-3', selected && 'ring-2 ring-border-action', dismissed && 'opacity-60', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge tone="neutral" variant="outline" size="xs">
            {v(version)}
          </Badge>
          {titleBadge}
        </CardTitle>
        {rationale && <CardDescription>{rationale}</CardDescription>}
        {checks && (
          <CardAction>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="focus-visible:focus-ring rounded-full outline-none" aria-label={`Brief check: ${issues.length ? `${issues.length} to look at` : 'fits the brief'}`}>
                  <Badge tone={issues.length ? 'warning' : 'success'} variant="subtle" size="sm">
                    <Icon icon={issues.length ? CircleAlertIcon : CircleCheckIcon} />
                    {issues.length ? `${issues.length} to look at` : 'Fits brief'}
                  </Badge>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <PopoverHeader>
                  <PopoverTitle>Brief and venue check</PopoverTitle>
                  <PopoverDescription>The agent checks every image against the venue’s limits (sample specs), the no-go list and the budget.</PopoverDescription>
                </PopoverHeader>
                <ul className="flex flex-col gap-2">
                  {checks.map((c) => (
                    <li key={c.label} className="flex flex-col gap-0.5">
                      <CheckRow status={c.ok ? 'included' : 'pending'} statusLabel={c.ok ? 'Passes' : 'Needs a look'}>
                        <span className="type-text-xs-semibold">{c.label}</span>
                      </CheckRow>
                      <span className="text-muted-foreground ps-5 type-text-xs-normal">{c.detail}</span>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="relative">
          <PinnedImage
            src={mediaSrc}
            alt={mediaAlt}
            pins={pins}
            draft={annotating && pin ? { ...pin, number: nextNumber } : null}
            onPlace={annotating && editable ? (x, y) => setPin({ x, y }) : undefined}
            className="rounded-lg"
          />
          {mediaBadge}
          {busy && (
            <div className="bg-background/70 absolute inset-0 flex items-center justify-center gap-2 type-text-sm-medium" role="status">
              <Spinner />
              {busy}
            </div>
          )}
        </div>

        {previous && compareInMenu && (
          <CompareVersions
            title={title}
            prefix={versionPrefix}
            version={version}
            current={{ src: mediaSrc, alt: mediaAlt }}
            previous={previous}
            change={change}
            open={comparing}
            onOpenChange={setComparing}
          />
        )}
        {!compareInMenu && (previous || (version > 1 && versionPrefix === 'v')) && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground flex min-w-0 items-center gap-1.5 type-text-xs-normal">
              <Icon icon={HistoryIcon} size="xs" />
              <span className="truncate">
                {v(version)}
                {change ? `: ${change}` : ''}
              </span>
            </p>
            {previous && (
              <CompareVersions
                title={title}
                prefix={versionPrefix}
                version={version}
                current={{ src: mediaSrc, alt: mediaAlt }}
                previous={previous}
                change={change}
                onRevert={editable ? onRevert : undefined}
              />
            )}
          </div>
        )}

        {variants && (
          <section aria-label="Variations" className="bg-muted flex flex-col gap-2 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <span className="type-text-xs-semibold">{variants === 'generating' ? 'Making three variations…' : 'Pick a variation to make it the next version'}</span>
              {variants !== 'generating' && (
                <Button variant="ghost" intent="neutral" size="xs" onClick={onCloseVariants}>
                  Keep current
                </Button>
              )}
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {variants === 'generating'
                ? [0, 1, 2].map((i) => (
                    <li key={i}>
                      <Skeleton className="aspect-video w-full rounded-md" />
                    </li>
                  ))
                : variants.map((v, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => onPickVariant?.(i)}
                        className="focus-visible:focus-ring block w-full overflow-hidden rounded-md outline-none hover:ring-2 hover:ring-border-action *:aspect-video *:w-full *:object-cover"
                        aria-label={`Use variation ${i + 1}${variantCaptions?.[i] ? `: ${variantCaptions[i]}` : ''}`}
                      >
                        {v}
                      </button>
                      {variantCaptions?.[i] && <span className="text-muted-foreground mt-1 block type-text-2xs-medium">{variantCaptions[i]}</span>}
                    </li>
                  ))}
            </ul>
          </section>
        )}

        {(annotating || annotations.length > 0) && (
          <section aria-label="Changes to make" className="bg-muted flex flex-col gap-2 rounded-lg p-3">
            <div className="flex flex-col gap-0.5">
              <span className="type-text-xs-semibold">Changes to make</span>
              {annotating && (
                <span className="text-muted-foreground type-text-xs-normal">
                  Click the image to pin a change to a spot, or describe one for the whole concept.
                </span>
              )}
            </div>
            {annotations.length > 0 && (
              <ol className="flex flex-col gap-1.5">
                {annotations.map((a) => (
                  <li key={a.number} className="flex items-start gap-2 type-text-sm-normal">
                    <Badge tone={a.x !== undefined ? 'brand' : 'neutral'} variant={a.x !== undefined ? 'default' : 'outline'} size="xs" className="mt-0.5">
                      {a.x !== undefined ? a.number : 'All'}
                    </Badge>
                    <span className="min-w-0 flex-1">{a.text}</span>
                    {editable && (
                      <Button variant="ghost" intent="neutral" size="icon-xs" aria-label={`Remove change ${a.number}`} onClick={() => onRemoveAnnotation?.(a.number)}>
                        <Icon icon={XIcon} />
                      </Button>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {annotating && editable && (
              <form
                className="flex flex-col gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault()
                  addNote()
                }}
              >
                <Label htmlFor={`${title}-change`}>{pin ? `What should change at ${nextNumber}?` : 'Change for the whole concept'}</Label>
                <InputGroup className="bg-background">
                  <InputGroupInput
                    ref={inputRef}
                    id={`${title}-change`}
                    autoFocus
                    placeholder={pin ? 'e.g. narrower here' : 'e.g. warmer overall'}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton type="submit" disabled={!text.trim()}>
                      Add
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </form>
            )}
            {annotations.length > 0 && editable && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  intent="neutral"
                  size="sm"
                  onClick={() => {
                    onApplyAnnotations?.()
                    setAnnotating(false)
                    setPin(null)
                  }}
                >
                  <Icon icon={SparklesIcon} />
                  Apply {annotations.length === 1 ? 'change' : `${annotations.length} changes`}
                </Button>
                <span className="text-muted-foreground type-text-xs-normal">{applyHint ?? `Makes ${v(version + 1)}. ${v(version)} is kept.`}</span>
              </div>
            )}
          </section>
        )}
        {children}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2">
        <label className="flex shrink-0 items-center gap-2 type-text-sm-medium">
          <Checkbox checked={selected} onCheckedChange={(on) => onSelectedChange(on === true)} disabled={dismissed} aria-label={`${selectLabel} ${title}`} />
          {selectLabel}
        </label>
        <div className="flex items-center gap-1">
          {editable && onAddAnnotation && (
            <Button
              variant="ghost"
              intent="neutral"
              size="sm"
              aria-pressed={annotating}
              onClick={() => {
                setAnnotating((v) => !v)
                setPin(null)
              }}
            >
              <Icon icon={PencilIcon} />
              {annotating ? 'Done' : annotations.length ? `Annotate (${annotations.length})` : 'Annotate'}
            </Button>
          )}
          {editable && onMoreLikeThis && (
            <Button variant="ghost" intent="neutral" size="sm" onClick={onMoreLikeThis} disabled={!!variants}>
              <Icon icon={LayersIcon} />
              {/* Icon-only when the card is narrow (beside the agent on a narrow window); still named for screen readers. */}
              <span className="sr-only @sm/card:not-sr-only">More like this</span>
            </Button>
          )}
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" intent="neutral" size="icon-sm" aria-label={`More actions for ${title}`}>
                  <Icon icon={EllipsisIcon} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={!editable} onSelect={onRegenerate}>
                  <Icon icon={RefreshCwIcon} />
                  {regenerateLabel}
                </DropdownMenuItem>
                {previous && onRevert && (
                  <DropdownMenuItem disabled={!editable} onSelect={onRevert}>
                    <Icon icon={HistoryIcon} />
                    Revert to {v(previous.version)}
                  </DropdownMenuItem>
                )}
                {previous && compareInMenu && (
                  <DropdownMenuItem onSelect={() => setComparing(true)}>
                    <Icon icon={ColumnsIcon} />
                    Compare with {v(previous.version)}
                  </DropdownMenuItem>
                )}
                {menuItems.map((item) => (
                  <DropdownMenuItem key={item.label} onSelect={item.onSelect}>
                    <Icon icon={item.icon} />
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onToggleDismissed}>
                  <Icon icon={dismissed ? UndoIcon : ThumbsDownIcon} />
                  {dismissed ? 'Bring back' : 'Not this direction'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

/** Both versions side by side, with what changed between them, and the choice to keep or revert. */
function CompareVersions({
  title,
  prefix,
  version,
  current,
  previous,
  change,
  onRevert,
  open,
  onOpenChange,
}: {
  /** Controlled from outside (e.g. a menu item): no trigger button is rendered. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  prefix: string
  version: number
  current: { src?: string; alt: string }
  previous: NonNullable<ConceptCardProps['previous']>
  change?: string
  onRevert?: () => void
}) {
  const changes = previous.changes ?? []
  const pins = changes.flatMap((c) => (c.x !== undefined && c.y !== undefined ? [{ id: String(c.number), number: c.number, x: c.x, y: c.y }] : []))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open === undefined && (
        <DialogTrigger asChild>
          <Button variant="ghost" intent="neutral" size="xs">
            <Icon icon={ColumnsIcon} />
            Compare with {prefix}{previous.version}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {title}: {prefix}{previous.version} and {prefix}{version}
          </DialogTitle>
          <DialogDescription>Both in the same view, with what changed between them.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-2 gap-4">
            <figure className="flex flex-col gap-2">
              <PinnedImage src={previous.src} alt={`${title}, ${prefix}${previous.version}`} pins={pins} className="rounded-lg" />
              <figcaption className="type-text-sm-semibold">
                {prefix}{previous.version} · before
              </figcaption>
            </figure>
            <figure className="flex flex-col gap-2">
              <PinnedImage src={current.src} alt={current.alt} pins={[]} className="rounded-lg" />
              <figcaption className="type-text-sm-semibold">
                {prefix}{version} · now
              </figcaption>
            </figure>
          </div>
          <section aria-label="What changed" className="flex flex-col gap-2">
            <span className="type-text-sm-semibold">What changed</span>
            {changes.length ? (
              <ol className="flex flex-col gap-1.5">
                {changes.map((c) => (
                  <li key={c.number} className="flex items-start gap-2 type-text-sm-normal">
                    <Badge tone={c.x !== undefined ? 'brand' : 'neutral'} variant={c.x !== undefined ? 'default' : 'outline'} size="xs" className="mt-0.5">
                      {c.x !== undefined ? c.number : 'All'}
                    </Badge>
                    {c.text}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground type-text-sm-normal">{change ?? 'A new take on the same concept.'}</p>
            )}
          </section>
        </DialogBody>
        <DialogFooter>
          {onRevert && (
            <DialogClose asChild>
              <Button variant="outline" intent="neutral" onClick={onRevert}>
                <Icon icon={HistoryIcon} />
                Revert to {prefix}{previous.version}
              </Button>
            </DialogClose>
          )}
          <DialogClose asChild>
            <Button>Keep {prefix}{version}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The card while its concept is still being generated. */
export function ConceptCardPending({ title }: { title: string }) {
  return (
    <Card className="gap-3" aria-busy>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Rendering…</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}
