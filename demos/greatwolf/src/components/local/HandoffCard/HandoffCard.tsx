import { cn } from '@anvil/lib/utils'
import { Badge } from '@anvil/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Icon, UserRoundIcon } from '@anvil/components/ui/icon'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'

interface Props {
  /** Who picks it up. */
  to: string
  /** What the person already knows, so the guest doesn't repeat it. */
  context: { label: string; value: string }[]
  eta?: string
  className?: string
}

// ANVIL-CANDIDATE: the moment an agent hands the conversation to a person. Shows who is coming, the wait, and exactly
// what was passed along. Closest Anvil option checked: ApprovalCard (asks for a decision, doesn't hand over context).
export function HandoffCard({ to, context, eta, className }: Props) {
  return (
    <Card size="sm" className={cn('w-full', className)} data-slot="handoff-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-full bg-muted"><Icon icon={UserRoundIcon} /></span>
          <span>{to} is joining</span>
          {eta && <Badge variant="subtle" tone="warning" size="sm" className="ml-auto">{eta}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="type-text-xs-medium text-muted-foreground">Shared with them, so you don’t have to repeat it</p>
        <KeyValueList>
          {context.map((c) => (
            <KeyValueRow key={c.label} label={c.label}>{c.value}</KeyValueRow>
          ))}
        </KeyValueList>
      </CardContent>
    </Card>
  )
}
