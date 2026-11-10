// Builds an .ics calendar file in the browser and downloads it. No server: the file is made from the demo's plan.

export interface CalendarEvent {
  title: string
  /** YYYY-MM-DD */
  date: string
  /** "3:00 pm", "9:30" (no suffix: am, except 12:xx which is noon). */
  time: string
  minutes?: number
  location?: string
  description?: string
}

function toStamp(date: string, time: string, addMinutes = 0) {
  const m = /(\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(time)
  let h = m ? Number(m[1]) : 9
  const min = m ? Number(m[2]) : 0
  const suffix = m?.[3]?.toLowerCase()
  if (suffix === 'pm' && h < 12) h += 12
  if (suffix === 'am' && h === 12) h = 0
  const total = h * 60 + min + addMinutes
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  // Floating local time: the event shows at the same clock time wherever it's opened, like a printed itinerary.
  return `${date.replaceAll('-', '')}T${hh}${mm}00`
}

const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

export function downloadCalendar(fileName: string, events: CalendarEvent[]) {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Great Wolf Lodge demo//Weekend plan//EN',
    'CALSCALE:GREGORIAN',
    ...events.flatMap((e, i) => [
      'BEGIN:VEVENT',
      `UID:gwl-demo-${i}-${e.date}@example.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${toStamp(e.date, e.time)}`,
      `DTEND:${toStamp(e.date, e.time, e.minutes ?? 60)}`,
      `SUMMARY:${escape(e.title)}`,
      ...(e.location ? [`LOCATION:${escape(e.location)}`] : []),
      ...(e.description ? [`DESCRIPTION:${escape(e.description)}`] : []),
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
