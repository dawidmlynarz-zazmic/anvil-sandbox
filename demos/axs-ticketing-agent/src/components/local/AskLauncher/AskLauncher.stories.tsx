import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AskLauncher } from './AskLauncher'

const meta = {
  title: 'Local/AskLauncher',
  component: AskLauncher,
  args: { open: false, onOpenChange: () => {}, children: null },
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="relative h-150 w-97.5 border"><Story /></div>],
} satisfies Meta<typeof AskLauncher>
export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}
export const Interactive: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <AskLauncher {...args} open={open} onOpenChange={setOpen}>
        <p className="p-6">The chat goes here.</p>
      </AskLauncher>
    )
  },
}
