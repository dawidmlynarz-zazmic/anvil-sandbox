// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#pinned-image
import { Button } from '@anvil/components/ui/button'
import { cn } from '@anvil/lib/utils'

export interface ImagePin {
  id: string
  /** The number shown on the pin, matching the comment list. */
  number: number
  /** Position on the image, 0–100 from the top-left. */
  x: number
  y: number
}

export interface PinnedImageProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  src: string
  alt: string
  pins: ImagePin[]
  activeId?: string | null
  onActiveChange?: (id: string | null) => void
  /** Pins that have been dealt with are drawn quieter. */
  resolvedIds?: string[]
  /** Lets the viewer drop a new pin by clicking the image; called with the spot (0–100 from the top-left). */
  onPlace?: (x: number, y: number) => void
  /** A pin being placed, not yet saved: drawn as an outlined marker. */
  draft?: { x: number; y: number; number: number } | null
}

/** An image with numbered comment pins. Choosing a pin (or its comment) highlights the other. */
export function PinnedImage({ src, alt, pins, activeId, onActiveChange, resolvedIds = [], onPlace, draft, className, ...props }: PinnedImageProps) {
  return (
    <div className={cn('bg-muted relative aspect-video overflow-hidden rounded-xl', onPlace && 'cursor-crosshair', className)} {...props}>
      <img
        src={src}
        alt={alt}
        className="size-full object-cover"
        onClick={
          onPlace
            ? (e) => {
                const r = e.currentTarget.getBoundingClientRect()
                onPlace(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100)
              }
            : undefined
        }
      />
      {draft && (
        <span
          aria-hidden
          className="border-primary bg-background text-primary absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed type-text-xs-semibold"
          style={{ insetInlineStart: `${draft.x}%`, top: `${draft.y}%` }}
        >
          {draft.number}
        </span>
      )}
      {pins.map((pin) => {
        const active = pin.id === activeId
        const resolved = resolvedIds.includes(pin.id)
        return (
          <Button
            key={pin.id}
            variant={active ? 'default' : 'outline'}
            intent={active ? 'brand' : 'neutral'}
            shape="circle"
            size="icon-xs"
            aria-label={`Comment ${pin.number}${resolved ? ' (resolved)' : ''}`}
            aria-pressed={active}
            className={cn('absolute -translate-x-1/2 -translate-y-1/2 shadow-sm', resolved && !active && 'opacity-60')}
            style={{ insetInlineStart: `${pin.x}%`, top: `${pin.y}%` }}
            onClick={() => onActiveChange?.(active ? null : pin.id)}
          >
            {pin.number}
          </Button>
        )
      })}
    </div>
  )
}
