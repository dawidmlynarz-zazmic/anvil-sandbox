import { fmtDate, fmtDateTime, relDay, relTime } from '@/lib/dates'

/** Relative text with the exact date on hover. */
export function RelDate({ value, time = false, className }: { value: string | Date; time?: boolean; className?: string }) {
  const isDay = typeof value === 'string' && value.length === 10
  const text = time && !isDay ? relTime(value) : relDay(value)
  const exact = isDay ? fmtDate(value) : fmtDateTime(value)
  return (
    <time dateTime={typeof value === 'string' ? value : value.toISOString()} title={exact} className={className}>
      {text}
    </time>
  )
}
