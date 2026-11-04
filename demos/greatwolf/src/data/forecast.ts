// A 14-day occupancy series. Illustrative numbers, not real figures.
export interface Day {
  label: string
  forecast: number
  lastYear: number
}

const rows: [string, number, number][] = [
  ['Mon 8', 61, 55], ['Tue 9', 58, 52], ['Wed 10', 66, 59], ['Thu 11', 74, 68], ['Fri 12', 95, 84],
  ['Sat 13', 97, 85], ['Sun 14', 88, 79], ['Mon 15', 70, 66], ['Tue 16', 64, 60], ['Wed 17', 69, 63],
  ['Thu 18', 77, 71], ['Fri 19', 90, 82], ['Sat 20', 94, 86], ['Sun 21', 82, 76],
]

export const days: Day[] = rows.map(([label, forecast, lastYear]) => ({ label, forecast, lastYear }))

export const peak = { label: 'Sat, Mar 13', value: 97, delta: 12 }

export const recommendations = [
  { id: 'price', title: 'Raise the day-pass price by $10 for the weekend', why: 'Day-pass demand is above capacity on Saturday.', impact: 'Sample impact: [revenue estimate]' },
  { id: 'lifeguards', title: 'Add 6 lifeguard shifts on Saturday', why: 'Peak attendance needs more pool coverage from 10 am to 6 pm.', impact: 'Keeps the water park fully open' },
  { id: 'rain', title: 'Rain on Saturday: open extra indoor activities', why: 'Rain moves outdoor guests inside the resort.', impact: 'Spreads crowds across the arcade and party rooms' },
] as const

export type RecId = (typeof recommendations)[number]['id']
