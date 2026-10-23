import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@anvil/components/ui/button'
import { HoldCountdown } from './HoldCountdown'

const meta = {
  title: 'Local/HoldCountdown',
  component: HoldCountdown,
  args: { expiresAt: Date.now() + 10 * 60_000, duration: 600 },
  decorators: [(Story) => <div className="w-96 overflow-hidden rounded-xl border"><Story /></div>],
} satisfies Meta<typeof HoldCountdown>
export default meta
type Story = StoryObj<typeof meta>

export const Counting: Story = {
  args: {
    action: (
      <Button variant="ghost" intent="neutral" size="xs">
        Release
      </Button>
    ),
  },
}
export const LastMinute: Story = { args: { expiresAt: Date.now() + 50_000 } }
export const Expired: Story = {
  args: {
    expiresAt: Date.now() - 1000,
    expiredAction: (
      <Button variant="outline" intent="neutral" size="xs">
        Hold again
      </Button>
    ),
  },
}
