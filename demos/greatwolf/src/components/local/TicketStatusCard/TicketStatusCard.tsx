import { cn } from '@anvil/lib/utils'
import { Badge } from '@anvil/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { ProgressSteps, ProgressStep } from '@anvil/components/anvil/progress-steps'

export type TicketStage = 'requested' | 'reviewing' | 'resolved'

interface Props {
  title: string
  reference: string
  stage: TicketStage
  /** One plain sentence on what happens next, or what happened. */
  message: string
  className?: string
}

const STEPS: { id: TicketStage; label: string }[] = [
  { id: 'requested', label: 'Requested' },
  { id: 'reviewing', label: 'With the front desk' },
  { id: 'resolved', label: 'Refunded' },
]

// ANVIL-CANDIDATE: the status of a thing the agent filed for the guest. Three steps, one sentence, a reference.
// Closest Anvil option checked: TaskCard (an agent's own run, not a request to a person), ProgressSteps (no message).
export function TicketStatusCard({ title, reference, stage, message, className }: Props) {
  const at = STEPS.findIndex((s) => s.id === stage)
  return (
    <Card size="sm" className={cn('w-full', className)} data-slot="ticket-status-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{title}</span>
          <Badge variant="subtle" tone={stage === 'resolved' ? 'success' : 'warning'} size="sm" indicator>
            {stage === 'resolved' ? 'Resolved' : 'In progress'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ProgressSteps aria-label="Ticket progress">
          {STEPS.map((s, i) => (
            <ProgressStep key={s.id} status={i < at || stage === 'resolved' ? 'done' : i === at ? 'current' : 'upcoming'} label={s.label} />
          ))}
        </ProgressSteps>
        <p className="type-text-sm-normal text-foreground" aria-live="polite">{message}</p>
        <p className="type-text-xs-normal text-muted-foreground">Reference {reference}</p>
      </CardContent>
    </Card>
  )
}
