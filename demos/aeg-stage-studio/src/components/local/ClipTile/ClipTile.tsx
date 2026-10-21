// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#clip-tile
import { Badge } from '@anvil/components/ui/badge'
import { Card } from '@anvil/components/ui/card'
import { ClapperboardIcon, Icon } from '@anvil/components/ui/icon'
import { Spinner } from '@anvil/components/ui/spinner'
import { cn } from '@anvil/lib/utils'

export type ClipStatus = 'ready' | 'generating' | 'not-started'

export interface ClipTileProps extends Omit<React.ComponentProps<'button'>, 'children'> {
  song: number
  title: string
  status: ClipStatus
  poster?: string
  selected?: boolean
}

/** One song in the set-list strip: a thumbnail, the song, and where its clip is. Select it to open the clip. */
export function ClipTile({ song, title, status, poster, selected, className, ...props }: ClipTileProps) {
  return (
    <Card asChild size="sm" className={cn('w-full min-w-0 gap-2 p-2 text-start', selected && 'ring-2 ring-border-action', className)}>
      <button type="button" aria-pressed={selected} {...props}>
        <span className="bg-muted relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md">
          {status === 'not-started' ? (
            <Icon icon={ClapperboardIcon} className="text-muted-foreground" />
          ) : poster ? (
            <img src={poster} alt="" className="size-full object-cover" />
          ) : (
            // Thumbnail still rendering: a quiet placeholder rather than stand-in art.
            <span aria-hidden className="size-full animate-pulse" />
          )}
        </span>
        <span className="flex flex-col gap-1">
          <span className="type-text-xs-semibold">Song {song}</span>
          <span className="text-muted-foreground truncate type-text-xs-normal">{title}</span>
          {status === 'ready' && (
            <Badge tone="success" variant="subtle" size="xs" className="self-start">
              Ready
            </Badge>
          )}
          {status === 'generating' && (
            <Badge tone="agent" variant="subtle" size="xs" className="self-start">
              <Spinner />
              Generating…
            </Badge>
          )}
          {status === 'not-started' && (
            <Badge tone="neutral" variant="outline" size="xs" className="self-start">
              Not started
            </Badge>
          )}
        </span>
      </button>
    </Card>
  )
}
