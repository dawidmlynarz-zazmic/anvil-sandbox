import type { Meta, StoryObj } from '@storybook/react-vite'
import { stageArt } from '~/mocks/art'
import { ClipTile } from './ClipTile'

const meta = {
  title: 'Local/ClipTile',
  component: ClipTile,
  args: { song: 14, title: 'Crowd split', status: 'ready', poster: stageArt('tile', 'halo', 'golden-hour') },
  decorators: [(Story) => <div className="w-40"><Story /></div>],
} satisfies Meta<typeof ClipTile>
export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {}
export const Selected: Story = { args: { selected: true } }
export const Generating: Story = { args: { status: 'generating' } }
export const NotStarted: Story = { args: { status: 'not-started' } }
