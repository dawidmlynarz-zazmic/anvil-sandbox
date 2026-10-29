import type { ReactNode } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { GitCompareIcon, HeartIcon, Icon, StarIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { usd } from '~/lib/format'
import { scoreLabel, type Hotel } from '~/mocks/hotels'

// ANVIL-CANDIDATE: a results row in the shape travel sites use: photo with a save heart, name and area, score,
// a "why" line, perks, and a price column with the action. Closest Anvil option checked: Offer Card (horizontal),
// which has one poster, one price line and one button, and no save, compare or score. See
// docs/anvil-upgrade-candidates.md.

export function StayCard({
  hotel,
  score,
  media,
  night,
  total,
  perks,
  fit,
  saved,
  compared,
  active,
  onSave,
  onCompare,
  onOpen,
  className,
}: {
  hotel: Hotel
  score: number
  media: ReactNode
  /** Price for one night, in USD. */
  night: number
  /** Price for the whole stay, in USD. */
  total: number
  perks: string[]
  /** Budget fit, when there is a budget. */
  fit?: 'within' | 'over'
  saved: boolean
  compared: boolean
  /** Highlighted (its map pin is selected). */
  active?: boolean
  onSave: () => void
  onCompare: () => void
  onOpen: () => void
  className?: string
}) {
  return (
    <Card className={cn('w-full flex-col gap-0 overflow-hidden p-0 sm:flex-row', active && 'ring-2 ring-border-action', className)}>
      <div className="relative h-44 shrink-0 sm:h-auto sm:w-52">
        {media}
        <Button
          variant="outline"
          intent="neutral"
          size="icon-sm"
          shape="circle"
          className="absolute top-2 left-2 bg-background"
          aria-label={saved ? `Remove ${hotel.name} from saved` : `Save ${hotel.name}`}
          aria-pressed={saved}
          onClick={onSave}
        >
          <Icon icon={HeartIcon} className={cn(saved && 'fill-current text-danger')} />
        </Button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="type-text-base-semibold">{hotel.name}</h3>
            <p className="type-text-sm-normal text-muted-foreground">{hotel.area}</p>
          </div>
          <Button variant="outline" intent="neutral" size="sm" aria-pressed={compared} className={cn(compared && 'bg-accent')} onClick={onCompare}>
            <Icon icon={GitCompareIcon} />
            Compare
          </Button>
        </div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge tone="neutral">{score.toFixed(1)}</Badge>
          <span className="type-text-sm-medium">{scoreLabel(score)}</span>
          <span className="type-text-sm-normal text-muted-foreground">({hotel.reviews.toLocaleString('en-US')} reviews)</span>
          <span className="inline-flex" role="img" aria-label={`${hotel.stars}-star hotel`}>
            {Array.from({ length: hotel.stars }, (_, i) => <Icon key={i} icon={StarIcon} size="xs" className="fill-current text-warning" />)}
          </span>
        </p>
        <p className="type-text-sm-normal text-muted-foreground">{hotel.why}</p>
        {perks.length > 0 && <p className="type-text-sm-medium text-success-strong">{perks.join(' · ')}</p>}
      </div>
      <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t p-4 sm:w-44 sm:flex-col sm:items-stretch sm:justify-center sm:border-t-0 sm:border-l">
        <div className="flex flex-col sm:items-end">
          <span className="type-heading-xl">{usd(night)}</span>
          <span className="type-text-xs-normal text-muted-foreground">a night, cheapest room</span>
          <span className="type-text-sm-medium">{usd(total)} total</span>
          {fit && <Badge tone={fit === 'within' ? 'success' : 'destructive'} variant="subtle" className="mt-1">{fit === 'within' ? 'Within budget' : 'Over budget'}</Badge>}
        </div>
        <Button variant="outline" intent="neutral" onClick={onOpen}>View rooms</Button>
      </div>
    </Card>
  )
}
