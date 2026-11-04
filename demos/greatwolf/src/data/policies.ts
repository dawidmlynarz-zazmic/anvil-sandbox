export interface Source {
  id: string
  index: number
  title: string
  kind: string
  excerpt: string
}

export const sources: Record<string, Source> = {
  sop: {
    id: 'sop',
    index: 1,
    title: 'Billing SOP, section 4.2',
    kind: 'Policy',
    excerpt:
      'A charge posted twice for the same item, time and guest is a duplicate. Front desk can refund a duplicate up to $500 without manager approval. Log it with reason code DUP.',
  },
  folio: {
    id: 'folio',
    index: 2,
    title: 'Folio MZ-0312, Suite 412',
    kind: 'Guest record',
    excerpt: 'Cabana 12, Sat 1–3 pm, $95 posted twice, two minutes apart. The second posting has no separate booking behind it.',
  },
  forecast: {
    id: 'forecast',
    index: 1,
    title: 'Occupancy forecast, Mar 8–21',
    kind: 'Report',
    excerpt: 'Spring break dates line up across the largest feeder markets this year, and last year’s did not. Booking pace is ahead for Saturday, Mar 13.',
  },
}
