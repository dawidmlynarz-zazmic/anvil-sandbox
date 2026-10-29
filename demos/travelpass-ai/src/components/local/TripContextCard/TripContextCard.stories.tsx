import type { Meta, StoryObj } from '@storybook/react-vite'
import { TripContextCard } from './TripContextCard'

const meta: Meta<typeof TripContextCard> = {
  title: 'Local/TripContextCard',
  component: TripContextCard,
  args: { trip: {}, nights: 0, onEdit: () => {} },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
}
export default meta

export const Empty: StoryObj<typeof TripContextCard> = {}
export const Filled: StoryObj<typeof TripContextCard> = {
  args: { trip: { destination: 'amalfi', checkIn: '2027-05-12', checkOut: '2027-05-17', adults: 2, budget: 3000 }, nights: 5, spend: 1600 },
}
export const OverBudget: StoryObj<typeof TripContextCard> = {
  args: { trip: { destination: 'amalfi', checkIn: '2027-05-12', checkOut: '2027-05-17', adults: 2, budget: 3000 }, nights: 5, spend: 4250 },
}
