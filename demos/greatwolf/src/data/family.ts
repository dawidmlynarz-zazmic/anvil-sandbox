// Fictional family for the story. Dates are corrected from the deck: Mar 14, 2027 is a Sunday, so the stay is
// Fri Mar 12 to Sun Mar 14 and Mia's birthday is Saturday Mar 13.
export const family = {
  name: 'Martinez',
  guest: 'Dana',
  kids: [
    { name: 'Mia', age: 7, birthday: 'Sat, Mar 13' },
    { name: 'Leo', age: 4 },
  ],
  favoriteSuite: 'Wolf Den Suite',
  pastStays: ['Summer 2024', 'Winter 2025'],
  suite: '412',
} as const

export const stay = {
  spring: { label: 'Fri, Mar 12 – Sun, Mar 14, 2027', short: 'Mar 12–14', nights: 2 },
  springLong: { label: 'Fri, Mar 12 – Mon, Mar 15, 2027', short: 'Mar 12–15', nights: 3 },
  summer: { label: 'Fri, Jul 23 – Sun, Jul 25, 2027', short: 'Jul 23–25', nights: 2 },
} as const
