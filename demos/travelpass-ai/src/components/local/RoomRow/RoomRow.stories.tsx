import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@anvil/components/ui/button'
import { RoomRow } from './RoomRow'

const room = { id: 'deluxe', name: 'Deluxe Garden View', sleeps: 2, sizeM2: 32, left: 3, night: 320, freeCancelDays: 7, features: ['King bed', 'Garden terrace'] }

const meta: Meta<typeof RoomRow> = {
  title: 'Local/RoomRow',
  component: RoomRow,
  args: { room, nights: 5, total: 1600, cancellation: 'Free cancellation until May 5, 2027', action: <Button variant="outline" intent="neutral">Book room</Button> },
}
export default meta

export const Default: StoryObj<typeof RoomRow> = {}
export const LastRoom: StoryObj<typeof RoomRow> = { args: { room: { ...room, left: 1 } } }
export const OverBudget: StoryObj<typeof RoomRow> = { args: { overBudgetBy: 1250, total: 4250 } }
