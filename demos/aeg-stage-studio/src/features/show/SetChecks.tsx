import { Badge } from '@anvil/components/ui/badge'
import { CheckRow } from '@anvil/components/anvil/check-row'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { isCovered, venueOf } from '~/mocks/venues'
import { footprint, holdsTo, venueChecks, type CheckStatus } from '~/services/venueCheck'
import type { Brief, StillSpec } from '~/state/types'

const ROW: Record<CheckStatus, { status: 'included' | 'pending' | 'excluded'; label: string }> = {
  pass: { status: 'included', label: 'Passes' },
  warn: { status: 'pending', label: 'Needs a plan' },
  fail: { status: 'excluded', label: 'Fails' },
}

interface SetChecksProps {
  spec: StillSpec
  brief: Brief
  reworked?: boolean
  /** Checks only, without the footprint. */
  compact?: boolean
  /** The set is locked: a fix means unlocking it first. */
  locked?: boolean
}

/**
 * A set (or a design about to become the set) against the venue: its footprint and every check, with numbers.
 * Everything here is a sample estimate, and says so.
 */
export function SetChecks({ spec, brief, reworked, compact, locked }: SetChecksProps) {
  const venue = venueOf(brief.venueId)
  const fp = footprint(spec)
  const checks = venueChecks(spec, brief, reworked)
  const open = checks.filter((c) => c.status !== 'pass')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="type-text-sm-semibold">At {venue.name}</span>
        <Badge tone={open.some((c) => c.status === 'fail') ? 'destructive' : open.length ? 'warning' : 'success'} variant="subtle" size="sm">
          {open.length ? `${open.length} ${open.length === 1 ? 'issue' : 'issues'}` : 'Passes every check'}
        </Badge>
        <Badge tone="warning" variant="outline" size="xs">
          Sample estimates
        </Badge>
      </div>
      {!compact && (
        <KeyValueList>
          <KeyValueRow label="Footprint">
            {fp.width} m wide, {fp.height} m tall
          </KeyValueRow>
          <KeyValueRow label="Weight">
            {fp.weight} t, {fp.flown} t of it hung from the {venue.covered ? 'grid' : 'roof'}
          </KeyValueRow>
          {!isCovered(venue.id) && venue.limits.gusts && <KeyValueRow label="Wind">Holds to {holdsTo(fp)} m/s</KeyValueRow>}
        </KeyValueList>
      )}
      <ul className="flex flex-col gap-2">
        {checks.map((c) => (
          <li key={c.label} className="flex flex-col gap-0.5">
            <CheckRow status={ROW[c.status].status} statusLabel={ROW[c.status].label}>
              <span className="type-text-xs-semibold">{c.label}</span>
            </CheckRow>
            <span className="text-muted-foreground ps-5 type-text-xs-normal">
              {c.detail}
              {c.fix && c.status !== 'pass' ? (locked ? ` To fix it, unlock the stage set and try “${c.fix}” on its look.` : ` Try “${c.fix}”.`) : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
