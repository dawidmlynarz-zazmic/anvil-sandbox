import type { Meta, StoryObj } from '@storybook/react-vite'
import { TripPill } from './TripPill'

const meta: Meta<typeof TripPill> = { title: 'Local/TripPill', component: TripPill, args: { onClick: () => {} } }
export default meta

export const Filled: StoryObj<typeof TripPill> = {
  args: { segments: [{ label: 'Amalfi Coast' }, { label: 'May 12–17' }, { label: '2 adults' }] },
}
export const Empty: StoryObj<typeof TripPill> = {
  args: { segments: [{ label: 'Where to?', unset: true }, { label: 'Dates', unset: true }, { label: 'Travelers', unset: true }] },
}
