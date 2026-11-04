// Sample prices for the demo, not the lodge's rates. Replace with the client's figures.
export const inventory = {
  suites: {
    'wolf-den': { name: 'Wolf Den Suite', nightly: 389, sleeps: 6, note: 'Bunk nook for the kids, a separate living area' },
    kidkamp: { name: 'KidKamp Suite', nightly: 389, sleeps: 6, note: 'Tent-style kids’ area, water park passes included' },
  },
  party: { name: 'Birthday party package', price: 249, note: 'Party room for 90 minutes, host and cake' },
  cabana: { name: 'Cabana 12', slot: 'Saturday, 1–3 pm', price: 95 },
  dining: { name: 'Dining plan, 2 days', price: 160 },
} as const

export type SuiteId = keyof typeof inventory.suites
