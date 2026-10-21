import type { Meta, StoryObj } from '@storybook/react-vite'
import { DaylightTimeline } from './DaylightTimeline'

const meta = {
  title: 'Local/DaylightTimeline',
  component: DaylightTimeline,
  args: { start: 19 * 60 + 40, end: 20 * 60 + 55, sunset: 19 * 60 + 14 },
  decorators: [(Story) => <div className="w-130"><Story /></div>],
} satisfies Meta<typeof DaylightTimeline>
export default meta
type Story = StoryObj<typeof meta>

export const Sunset: Story = {}
export const Afternoon: Story = { args: { start: 16 * 60 + 30, end: 17 * 60 + 45 } }
export const AfterDark: Story = { args: { start: 21 * 60, end: 22 * 60 + 30 } }
