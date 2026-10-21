/** "7:40 pm", "7pm", "19:40" → minutes after midnight. Falls back to the given default when it can't be read. */
export function parseClock(text: string, fallback: number) {
  const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/i.exec(text)
  if (!m) return fallback
  let hours = Number(m[1])
  const minutes = Number(m[2] ?? 0)
  const meridiem = m[3]?.toLowerCase()
  if (meridiem === 'pm' && hours < 12) hours += 12
  if (meridiem === 'am' && hours === 12) hours = 0
  if (hours > 23 || minutes > 59) return fallback
  return hours * 60 + minutes
}

/** "75 min", "90", "1.5 hours" → minutes. */
export function parseLength(text: string, fallback: number) {
  const m = /(\d+(?:\.\d+)?)/.exec(text)
  if (!m) return fallback
  const value = Number(m[1])
  return /h/i.test(text) && !/min/i.test(text) ? Math.round(value * 60) : value
}
