import type { Meta, StoryObj } from '@storybook/react-vite'
import { HandoffCard } from './HandoffCard'

const meta: Meta<typeof HandoffCard> = {
  title: 'Local/HandoffCard',
  component: HandoffCard,
  args: {
    to: 'The front desk',
    eta: 'About 2 minutes',
    context: [
      { label: 'Guest', value: 'Dana Martinez, Suite 412' },
      { label: 'Plan', value: 'Sensory-friendly Saturday' },
    ],
  },
}
export default meta
export const Default: StoryObj<typeof HandoffCard> = {}
