import type { Meta, StoryObj } from '@storybook/react-vite'
import { PromptInput } from '@anvil/components/agent/prompt-input'
import { BorderBeam } from './BorderBeam'

const meta = {
  title: 'Local/BorderBeam',
  component: BorderBeam,
  args: {
    children: <PromptInput aria-label="Message" size="compact" placeholder="Ask about shows, dates or seats" />,
  },
  decorators: [(Story) => <div className="w-88 p-4"><Story /></div>],
} satisfies Meta<typeof BorderBeam>
export default meta
type Story = StoryObj<typeof meta>

/** At rest. Focus the field or type and the beam steps aside. */
export const Default: Story = {}
export const Slow: Story = { args: { duration: 8, beamLength: 100 } }
export const NoGlow: Story = { args: { glow: 0, ambient: 0 } }
export const OtherColour: Story = { args: { color: 'var(--success)' } }
