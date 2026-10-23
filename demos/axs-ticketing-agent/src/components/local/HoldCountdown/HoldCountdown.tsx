// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#hold-countdown
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ActionStatus } from '@anvil/components/agent/action-status'
import { mmss } from '~/lib/format'

export interface HoldCountdownProps {
  /** Epoch ms when the hold ends. */
  expiresAt: number
  /** Length of the whole hold, in seconds: sets how far the bar has drained. */
  duration: number
  /** "Seats held" */
  label?: string
  /** What the strip says when time is up. */
  expiredLabel?: string
  /** An xs Button shown while counting (e.g. Release). */
  action?: ReactNode
  /** An xs Button shown after expiry (e.g. Hold again). */
  expiredAction?: ReactNode
  onExpire?: () => void
}

/** Times that are announced to screen readers; the visible clock ticks every second but is silent. */
const ANNOUNCE_AT = [300, 60, 30]

/**
 * A hold that runs out: Anvil's Action Status (executing, with the bar draining) until time is up, then its expired
 * state. The clock is a `role="timer"` that screen readers don't read every second; a separate polite message says the
 * time left at 5:00, 1:00 and 0:30, and when it ends.
 */
export function HoldCountdown({
  expiresAt,
  duration,
  label = 'Seats held',
  expiredLabel = 'Hold expired',
  action,
  expiredAction,
  onExpire,
}: HoldCountdownProps) {
  const [now, setNow] = useState(() => Date.now())
  const left = Math.max(0, (expiresAt - now) / 1000)
  const expired = left <= 0
  const fired = useRef(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (expired) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [expired, expiresAt])

  useEffect(() => {
    if (expired && !fired.current) {
      fired.current = true
      onExpireRef.current?.()
    }
    if (!expired) fired.current = false
  }, [expired])

  // The last announced threshold the clock has passed: changes (and so is announced) only three times.
  const passed = ANNOUNCE_AT.filter((s) => left <= s && left > 0).at(-1)
  const spoken = expired
    ? expiredLabel
    : passed
      ? `${passed >= 60 ? `${passed / 60} ${passed === 60 ? 'minute' : 'minutes'}` : `${passed} seconds`} left on your hold`
      : ''

  return (
    <>
      <ActionStatus
        status={expired ? 'expired' : 'executing'}
        progress={expired ? undefined : Math.min(100, (left / duration) * 100)}
        action={expired ? expiredAction : action}
        // A timer, not a status: the clock must not be announced every second.
        role="timer"
        aria-live="off"
        aria-label={expired ? expiredLabel : `${label}, ${mmss(left)} left`}
      >
        {expired ? expiredLabel : (
          <>
            {label} <span className="tabular-nums">{mmss(left)}</span>
          </>
        )}
      </ActionStatus>
      <span role="status" className="sr-only">
        {spoken}
      </span>
    </>
  )
}
