import { CastleIcon, DropletsIcon, FishIcon, MountainIcon, MusicIcon, PaletteIcon, PawPrintIcon, SparklesIcon, TornadoIcon, TreesIcon, WandSparklesIcon, WavesIcon, BookOpenIcon, FlowerIcon, type LucideIcon } from '@anvil/components/ui/icon'

// Journey 3: what the Great Wolf app shows at the Colorado Springs lodge. Ride heights and thrill levels are from the
// lodge's water park page (read 2026-11-12, see docs/colorado-springs-offering.md). Event times and park hours aren't
// published for this lodge: the times here are samples, in the pattern the current app shows.

export interface Ride {
  id: string
  name: string
  thrill: 'Mild' | 'Moderate' | 'High'
  /** Inches. */
  min?: number
  max?: number
  blurb: string
  icon: LucideIcon
  tone: 'lake' | 'forest' | 'dusk' | 'den'
}

export const rides: Ride[] = [
  { id: 'alberta-falls', name: 'Alberta Falls', thrill: 'Moderate', min: 42, blurb: 'A four-story tube ride for two, side by side in one raft.', icon: WavesIcon, tone: 'lake' },
  { id: 'howlin-tornado', name: 'Howlin’ Tornado', thrill: 'High', min: 48, blurb: 'A raft drops into a giant funnel and swings up the walls.', icon: TornadoIcon, tone: 'dusk' },
  { id: 'wolf-tail', name: 'Wolf Tail', thrill: 'High', min: 48, blurb: 'Stand on a trap door, wait for the countdown, then drop.', icon: PawPrintIcon, tone: 'den' },
  { id: 'mountain-edge', name: 'Mountain Edge Raceway', thrill: 'Moderate', min: 42, blurb: 'Race the family head first on mats, side by side.', icon: MountainIcon, tone: 'forest' },
  { id: 'fort-mackenzie', name: 'Fort Mackenzie', thrill: 'Moderate', min: 42, blurb: 'A treehouse of nets, sprays and slides under a giant tipping bucket.', icon: CastleIcon, tone: 'den' },
  { id: 'cub-paw', name: 'Cub Paw Pool', thrill: 'Mild', max: 52, blurb: 'Shallow water, small slides and sprays for the littlest cubs.', icon: DropletsIcon, tone: 'lake' },
  { id: 'whooping-hollow', name: 'Whooping Hollow', thrill: 'Mild', max: 52, blurb: 'Small slides and splash play, just for kids.', icon: TreesIcon, tone: 'forest' },
  { id: 'big-foot-pass', name: 'Big Foot Pass', thrill: 'Mild', blurb: 'Hop across floating lily pads, holding the rope above.', icon: FlowerIcon, tone: 'forest' },
  { id: 'chinook-cove', name: 'Chinook Cove', thrill: 'Mild', blurb: 'A pool with basketball hoops for a family game.', icon: FishIcon, tone: 'lake' },
]

export const rideById = (id: string) => rides.find((r) => r.id === id) ?? rides[0]

/** Whether a kid of this height can ride (both limits are the lodge's posted ones). */
export const fits = (r: Ride, inches: number) => (r.min === undefined || inches >= r.min) && (r.max === undefined || inches <= r.max)

export const heightRule = (r: Ride) => (r.min ? `${r.min}" and up` : r.max ? `${r.max}" and under` : 'No height limit')

export interface LodgeEvent {
  id: string
  name: string
  blurb: string
  /** Sample times: the lodge doesn't publish them. */
  times: string[]
  /** For sorting and "next up". */
  at: number
  where: string
  icon: LucideIcon
  tone: 'lake' | 'forest' | 'dusk' | 'den'
  best: string[]
}

export const events: LodgeEvent[] = [
  { id: 'yoga', name: 'Yoga Tails', blurb: 'Stretch and breathe together, made for kids.', times: ['9:00 am'], at: 9, where: 'Grand Lobby', icon: FlowerIcon, tone: 'forest', best: ['Family', 'Children'] },
  { id: 'ceremony', name: 'MagiQuest Ceremony', blurb: 'New players join the order of the Magi.', times: ['9:30 am', '6:15 pm'], at: 9.5, where: 'MagiQuest entrance', icon: WandSparklesIcon, tone: 'den', best: ['Family', 'Children'] },
  { id: 'pack', name: 'Meet the Great Wolf Pack', blurb: 'Say hi to Wiley and friends around the lodge.', times: ['10:20 am', '12:30 pm'], at: 10.3, where: 'Around the lodge', icon: PawPrintIcon, tone: 'dusk', best: ['Family', 'Children'] },
  { id: 'crafts', name: 'Arts & Crafts', blurb: 'Make something to take home.', times: ['11:30 am', '2:00 pm'], at: 11.5, where: 'Craft corner', icon: PaletteIcon, tone: 'lake', best: ['Children'] },
  { id: 'dance', name: 'Family Dance Party', blurb: 'The lodge’s late-night dance party, every night.', times: ['7:00 pm', '9:00 pm'], at: 19, where: 'Grand Lobby', icon: MusicIcon, tone: 'dusk', best: ['Family', 'Teens', 'Children'] },
  { id: 'story', name: 'Epic Story Time', blurb: 'A tale of Wiley and the Great Wolf Pack before bed.', times: ['8:15 pm'], at: 20.25, where: 'Grand Lobby fireplace', icon: BookOpenIcon, tone: 'forest', best: ['Children'] },
]

export const eventById = (id: string) => events.find((e) => e.id === id) ?? events[0]

export const dining = [
  { id: 'hungry', name: 'Hungry As A Wolf', blurb: 'Pizza and pasta. Order ahead in the app for pickup.', order: true },
  { id: 'loose-moose', name: 'Loose Moose Family Kitchen', blurb: 'Breakfast and dinner for the whole family.', order: false },
  { id: 'buckets', name: 'Buckets Burgers & Bites', blurb: 'Burgers and bites in the water park.', order: false },
  { id: 'creamery', name: 'Wood’s End Creamery', blurb: 'Ice cream and treats.', order: false },
  { id: 'dunkin', name: 'Dunkin’', blurb: 'Coffee and donuts.', order: false },
]

/** The person on the lodge team who joins the chat (fictional). */
export const staff = { name: 'Jordan', role: 'Guest Services', initials: 'J' }

/** The family's suite in the story (fictional room number). */
export const ROOM = '2214'
export const WILEY_ICON = SparklesIcon
