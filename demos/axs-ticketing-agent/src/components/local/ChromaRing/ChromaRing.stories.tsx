import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@anvil/components/ui/button'
import { Icon, SparklesIcon } from '@anvil/components/ui/icon'
import { ChromaRing } from './ChromaRing'

const meta = {
  title: 'Local/ChromaRing',
  component: ChromaRing,
  args: {
    children: (
      <Button intent="brand" size="lg" className="rounded-full">
        <Icon icon={SparklesIcon} />
        Ask AXS
      </Button>
    ),
  },
  decorators: [(Story) => <div className="p-8"><Story /></div>],
} satisfies Meta<typeof ChromaRing>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Slow: Story = { args: { duration: 12 } }
export const NoGlow: Story = { args: { blur: 0 } }
