import type { Meta, StoryObj } from '@storybook/react-vite'
import { HOTELS, hotelCover } from '~/mocks/hotels'
import { StayCard } from './StayCard'

const hotel = HOTELS[0]

const meta: Meta<typeof StayCard> = {
  title: 'Local/StayCard',
  component: StayCard,
  args: {
    hotel,
    score: 9.6,
    media: <img src={hotelCover(hotel)} alt="" className="size-full object-cover" />,
    night: 320,
    total: 1600,
    perks: ['Free cancellation', 'Breakfast included'],
    fit: 'within',
    saved: false,
    compared: false,
    onSave: () => {},
    onCompare: () => {},
    onOpen: () => {},
  },
  parameters: { layout: 'padded' },
}
export default meta

export const Default: StoryObj<typeof StayCard> = {}
export const SavedOverBudget: StoryObj<typeof StayCard> = { args: { saved: true, fit: 'over', compared: true } }
