import abba from '~/assets/covers/abba-voyage.jpg'
import aew from '~/assets/covers/aew-dynamite-collision.jpg'
import c2c from '~/assets/covers/country-to-country.jpg'
import fight from '~/assets/covers/dazn-fight-night.jpg'
import jarre from '~/assets/covers/jean-michel-jarre.jpg'
import kol from '~/assets/covers/kings-of-leon.jpg'
import type { Show } from '~/services/types'

// Sample listings. Titles are the ones on each show's cover art. For Kings of Leon, Jean-Michel Jarre, the fight night
// and AEW, the venue and date are printed on the cover too. ABBA Voyage and Country to Country show their usual London
// venues (ABBA Arena, The O2), but their dates are invented. Ticket prices, seats, availability and times are invented
// for every show, and the screens say so.

const d = (showId: string, date: string, time: string, doors: string, level: Show['dates'][number]['level'] = 'available') => ({
  id: `${showId}:${date}`,
  date,
  time,
  doors,
  level,
})

export const SHOWS: Show[] = [
  {
    id: 'kings-of-leon',
    title: 'Kings of Leon',
    venue: 'The O2',
    city: 'London',
    category: 'music',
    keywords: ['kings of leon', 'kol', 'rock', 'band', 'gig', 'concert'],
    tags: ['rock', 'live music'],
    cover: kol,
    coverAlt: 'Kings of Leon, Friday 2 and Saturday 3 July, The O2, London',
    dates: [d('kings-of-leon', '2027-07-02', '19:30', '18:30', 'limited'), d('kings-of-leon', '2027-07-03', '19:30', '18:30')],
    prices: { floor: 118, lower: 86, upper: 62 },
  },
  {
    id: 'jean-michel-jarre',
    title: 'Jean-Michel Jarre',
    subtitle: 'Oxygène & Beyond Tour',
    venue: 'The O2',
    city: 'London',
    category: 'music',
    keywords: ['jarre', 'jean-michel jarre', 'oxygene', 'electronic', 'synth', 'concert'],
    tags: ['electronic', 'live music'],
    cover: jarre,
    coverAlt: 'Jean-Michel Jarre, Oxygène & Beyond Tour, 19 October 2027, The O2, London',
    dates: [d('jean-michel-jarre', '2027-10-19', '19:30', '18:30')],
    prices: { floor: 104, lower: 79, upper: 54 },
  },
  {
    id: 'dazn-fight-night',
    title: 'DAZN Saturday Fight Night',
    subtitle: 'Barrett v Gwynne',
    venue: 'OVO Arena Wembley',
    city: 'London',
    category: 'sport',
    keywords: ['boxing', 'fight', 'fight night', 'dazn', 'wembley', 'sport', 'barrett', 'gwynne'],
    tags: ['sport', 'boxing'],
    cover: fight,
    coverAlt: 'DAZN Saturday Fight Night, Saturday 14 November, OVO Arena Wembley, London',
    dates: [d('dazn-fight-night', '2026-11-14', '17:00', '16:00', 'limited')],
    prices: { floor: 96, lower: 62, upper: 38 },
  },
  {
    id: 'aew-dynamite-collision',
    title: 'AEW: Dynamite & Collision',
    venue: 'The O2',
    city: 'London',
    category: 'wrestling',
    keywords: ['aew', 'wrestling', 'dynamite', 'collision', 'sport'],
    tags: ['sport', 'wrestling'],
    cover: aew,
    coverAlt: 'AEW Dynamite and Collision, London, 10 February, The O2',
    dates: [d('aew-dynamite-collision', '2027-02-10', '18:30', '17:30')],
    prices: { floor: 88, lower: 58, upper: 34 },
  },
  {
    id: 'abba-voyage',
    title: 'ABBA Voyage',
    venue: 'ABBA Arena',
    city: 'London',
    category: 'music',
    keywords: ['abba', 'abba voyage', 'voyage', 'pop', 'concert'],
    tags: ['pop', 'live music'],
    cover: abba,
    coverAlt: 'ABBA Voyage, a concert like no other, ABBA Arena, London',
    dates: [
      d('abba-voyage', '2027-06-04', '19:30', '18:30'),
      d('abba-voyage', '2027-06-05', '19:30', '18:30', 'limited'),
      d('abba-voyage', '2027-06-11', '19:30', '18:30'),
      d('abba-voyage', '2027-06-12', '19:30', '18:30'),
      d('abba-voyage', '2027-06-18', '19:30', '18:30'),
    ],
    prices: { floor: 96, lower: 74, upper: 48 },
  },
  {
    id: 'country-to-country',
    title: 'Country to Country',
    subtitle: 'C2C',
    venue: 'The O2',
    city: 'London',
    category: 'music',
    keywords: ['country to country', 'c2c', 'country', 'festival'],
    tags: ['country', 'live music'],
    cover: c2c,
    coverAlt: 'Country to Country, C2C, The O2, London',
    dates: [
      d('country-to-country', '2027-03-12', '17:00', '16:00'),
      d('country-to-country', '2027-03-13', '17:00', '16:00'),
      d('country-to-country', '2027-03-14', '17:00', '16:00', 'limited'),
    ],
    prices: { floor: 112, lower: 82, upper: 56 },
  },
]

/** The sample fan's history, used only after they allow personalisation. */
export const SAMPLE_INTERESTS = ['rock', 'electronic', 'live music']

/** The all-in fee on every ticket: AXS shows prices with fees included. */
export const FEE_RATE = 0.14
