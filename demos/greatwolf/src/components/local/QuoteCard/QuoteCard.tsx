import type { ReactNode } from 'react'
import { cn } from '@anvil/lib/utils'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Button } from '@anvil/components/ui/button'
import { Icon, CheckIcon } from '@anvil/components/ui/icon'
import { Badge } from '@anvil/components/ui/badge'
import { money } from '~/lib/format'

export interface QuoteLineItem {
  id: string
  label: string
  detail?: string
  amount: number
}

interface Props {
  title?: string
  lines: QuoteLineItem[]
  total: number
  totalLabel?: string
  /** The one action: "Book for $1,122". */
  actionLabel?: string
  onAction?: () => void
  /** Replaces the action once it's done (e.g. "Booked"). */
  doneLabel?: string
  /** Shown under the lines (e.g. a note on what changed). */
  note?: ReactNode
  className?: string
}

// ANVIL-CANDIDATE: an itemized quote an agent builds in a conversation. Line items, a total and one primary action.
// Closest Anvil option checked: OfferCard (one product, not a list), KeyValueRow (no total, no action). See
// docs/anvil-upgrade-candidates.md.
export function QuoteCard({ title = 'Your trip', lines, total, totalLabel = 'Total', actionLabel, onAction, doneLabel, note, className }: Props) {
  return (
    <Card size="sm" className={cn('w-full', className)} data-slot="quote-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          {lines.map((l) => (
            <li key={l.id} className="type-text-sm-normal flex items-start justify-between gap-3">
              <span className="flex min-w-0 flex-col">
                <span className="text-foreground">{l.label}</span>
                {l.detail && <span className="type-text-xs-normal text-muted-foreground">{l.detail}</span>}
              </span>
              <span className="shrink-0 tabular-nums text-foreground">{money(l.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="type-text-sm-semibold flex items-center justify-between border-t pt-3">
          <span>{totalLabel}</span>
          <span className="tabular-nums" aria-live="polite">{money(total)}</span>
        </div>
        {note}
      </CardContent>
      {(actionLabel || doneLabel) && (
        <CardFooter>
          {doneLabel ? (
            <Badge variant="subtle" tone="success" size="default"><Icon icon={CheckIcon} />{doneLabel}</Badge>
          ) : (
            <Button className="w-full" onClick={onAction}>{actionLabel}</Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
