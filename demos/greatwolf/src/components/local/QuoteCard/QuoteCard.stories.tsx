import type { Meta, StoryObj } from '@storybook/react-vite'
import { QuoteCard } from './QuoteCard'

const lines = [
  { id: 'a', label: 'Wolf Den Suite', detail: '2 nights, Mar 12–14', amount: 778 },
  { id: 'b', label: 'Birthday party package', detail: 'Saturday, Mar 13', amount: 249 },
  { id: 'c', label: 'Cabana', detail: 'Saturday, 1–3 pm', amount: 95 },
]
const meta: Meta<typeof QuoteCard> = { title: 'Local/QuoteCard', component: QuoteCard, args: { lines, total: 1122, actionLabel: 'Book for $1,122' } }
export default meta
export const Default: StoryObj<typeof QuoteCard> = {}
export const Booked: StoryObj<typeof QuoteCard> = { args: { doneLabel: 'Booked. Confirmation MZ-0312' } }
