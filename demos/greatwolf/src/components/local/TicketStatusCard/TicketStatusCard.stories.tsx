import type { Meta, StoryObj } from '@storybook/react-vite'
import { TicketStatusCard } from './TicketStatusCard'

const meta: Meta<typeof TicketStatusCard> = {
  title: 'Local/TicketStatusCard',
  component: TicketStatusCard,
  args: { title: 'Refund for the second cabana charge', reference: 'GW-4821', stage: 'reviewing', message: 'The front desk has your request. This usually takes a few minutes.' },
}
export default meta
export const Reviewing: StoryObj<typeof TicketStatusCard> = {}
export const Resolved: StoryObj<typeof TicketStatusCard> = { args: { stage: 'resolved', message: 'Refunded $95. The credit is on your bill.' } }
