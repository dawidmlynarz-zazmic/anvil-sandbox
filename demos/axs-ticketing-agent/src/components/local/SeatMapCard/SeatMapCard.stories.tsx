import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ARENA } from '~/mocks/arena'
import { SeatMapCard } from './SeatMapCard'

const meta = {
  title: 'Local/SeatMapCard',
  component: SeatMapCard,
  args: {
    sections: ARENA,
    highlighted: ['lower-118', 'upper-402', 'upper-418'],
    caption: 'Highlighted: pairs under £80 each, all-in',
  },
  decorators: [(Story) => <div className="w-88"><Story /></div>],
} satisfies Meta<typeof SeatMapCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Selected: Story = { args: { selected: 'upper-402' } }
export const NothingMatches: Story = { args: { highlighted: [], caption: 'No sections match this ask' } }
export const Interactive: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string>()
    return <SeatMapCard {...args} selected={selected} onSelect={setSelected} />
  },
}
