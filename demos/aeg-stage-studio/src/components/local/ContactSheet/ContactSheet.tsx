// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#contact-sheet
import type { ReactNode } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Checkbox } from '@anvil/components/ui/checkbox'
import { CheckIcon, Icon, PinIcon, PinOffIcon } from '@anvil/components/ui/icon'
import { Skeleton } from '@anvil/components/ui/skeleton'
import { cn } from '@anvil/lib/utils'

/** A batch of images on the sheet: a heading and its tiles. */
export function ContactSheetGroup({ title, meta, children, pending = 0 }: { title: string; meta?: string; children: ReactNode; pending?: number }) {
  return (
    <section className="flex flex-col gap-2" aria-label={title}>
      <div className="flex items-baseline gap-2">
        <h3 className="type-text-sm-semibold">{title}</h3>
        {meta && <span className="text-muted-foreground type-text-xs-normal">{meta}</span>}
      </div>
      <ul className="grid grid-cols-2 gap-3 @xl:grid-cols-4">
        {children}
        {Array.from({ length: pending }, (_, i) => (
          <li key={`pending-${i}`} aria-hidden>
            <Skeleton className="aspect-video w-full rounded-md" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export interface ContactSheetTileProps {
  /** “#12”: the image's number in the series. */
  label: string
  caption: string
  /** Undefined while the image renders: a quiet placeholder. */
  src?: string
  alt: string
  /** The image open in the focus panel. */
  focused?: boolean
  pinned?: boolean
  /** Ticked for comparing. */
  comparing?: boolean
  /** Comparing is full (four ticked): unticked tiles can't be added. */
  compareFull?: boolean
  /** Shown with a tick: e.g. “Look”. */
  chosen?: string
  /** Set aside: greyed out. */
  dismissed?: boolean
  onOpen: () => void
  onTogglePin: () => void
  onToggleCompare: () => void
}

/**
 * One image on a contact sheet. Click it to open it; pin it to keep it in view; tick it to compare. Built for many
 * images at once: small, scannable, with the image number and what's different about it.
 */
export function ContactSheetTile({ label, caption, src, alt, focused, pinned, comparing, compareFull, chosen, dismissed, onOpen, onTogglePin, onToggleCompare }: ContactSheetTileProps) {
  return (
    <li className={cn('group/tile relative flex min-w-0 flex-col gap-1.5', dismissed && 'opacity-50')}>
      <button
        type="button"
        onClick={onOpen}
        aria-pressed={focused}
        aria-label={`Open ${label}: ${caption}${chosen ? `, ${chosen.toLowerCase()}` : ''}${pinned ? ', pinned' : ''}`}
        className={cn(
          'bg-muted focus-visible:focus-ring relative block aspect-video w-full overflow-hidden rounded-md outline-none hover:ring-2 hover:ring-border-action',
          focused && 'ring-2 ring-border-action',
        )}
      >
        {src ? <img src={src} alt={alt} className="size-full object-cover" /> : <span aria-hidden className="block size-full animate-pulse" />}
        <span className="absolute start-1.5 top-1.5 flex gap-1">
          <Badge tone="neutral" variant="default" size="xs">
            {label}
          </Badge>
          {chosen && (
            <Badge tone="success" variant="default" size="xs">
              <Icon icon={CheckIcon} />
              {chosen}
            </Badge>
          )}
        </span>
      </button>
      <div className="flex items-center gap-1">
        <Checkbox checked={!!comparing} disabled={!comparing && compareFull} onCheckedChange={onToggleCompare} aria-label={`Compare ${label}`} />
        <span className="text-muted-foreground min-w-0 flex-1 truncate type-text-xs-normal" title={caption}>
          {caption}
        </span>
        <Button variant="ghost" intent="neutral" size="icon-xs" aria-pressed={pinned} aria-label={pinned ? `Unpin ${label}` : `Pin ${label}`} onClick={onTogglePin} disabled={dismissed && !pinned}>
          <Icon icon={pinned ? PinOffIcon : PinIcon} className={cn(pinned && 'text-primary')} />
        </Button>
      </div>
    </li>
  )
}
