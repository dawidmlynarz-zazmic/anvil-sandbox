import { Link, useParams } from 'react-router-dom'
import { Alert, AlertDescription } from '@anvil/components/ui/alert'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Icon, InfoIcon } from '@anvil/components/ui/icon'
import { KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { AxsLogo } from '~/components/AxsLogo'
import { gbp, showDateLine } from '~/lib/format'
import { findDate, optionById } from '~/services/axsTools'
import { useSession } from '~/state/session'

/** Where "Continue on AXS" lands: a labelled stub. The real sale completes on AXS, never in the assistant. */
export function CheckoutStub() {
  const { holdId } = useParams()
  const { session } = useSession()
  const hold = session.hold?.holdId === holdId ? session.hold : undefined
  const found = hold && findDate(hold.dateId)
  const option = hold && optionById(hold.optionId)

  return (
    <>
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-4 text-card-foreground">
        <AxsLogo className="h-7" />
        <span className="type-text-sm-medium text-muted-foreground">Checkout</span>
      </header>
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
        <Alert tone="info" size="sm">
          <Icon icon={InfoIcon} />
          <AlertDescription>This is a stub. In the real flow, you pay on AXS and the demo's job ends at this hand-off.</AlertDescription>
        </Alert>
        {hold && found && option ? (
          <Card className="gap-3 rounded-xl py-4">
            <CardHeader className="px-4">
              <CardTitle>{found.show.title}</CardTitle>
              <CardDescription>
                {found.show.venue}, {found.show.city} · {showDateLine(found.date.date, found.date.time)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4">
              <KeyValueRow label="Seats">
                {hold.qty} × {option.sectionLabel}, row {option.row}
              </KeyValueRow>
              <KeyValueRow label="Tickets">
                {hold.qty} × {gbp(option.face)}
              </KeyValueRow>
              <KeyValueRow label="Fees">
                {hold.qty} × {gbp(option.fee)}
              </KeyValueRow>
              <KeyValueRow label="Total, all-in">{gbp(hold.total)}</KeyValueRow>
              <KeyValueRow label="Hold">{hold.holdId}</KeyValueRow>
            </CardContent>
          </Card>
        ) : (
          <p className="type-text-sm-normal text-muted-foreground">This hold is not in this demo session. Start again from Ask AXS.</p>
        )}
        <Button intent="brand" size="lg" className="self-end" asChild>
          <Link to="/ask">Back to Ask AXS</Link>
        </Button>
      </main>
    </>
  )
}
