import type { Meta, StoryObj } from '@storybook/react-vite'
import { stageArt } from '~/mocks/art'
import { ClipPlayer } from './ClipPlayer'

const meta = {
  title: 'Local/ClipPlayer',
  component: ClipPlayer,
  args: { poster: stageArt('story', 'monolith', 'golden-hour'), label: 'Song 14 · Crowd split', seconds: 8 },
  decorators: [(Story) => <div className="w-130"><Story /></div>],
} satisfies Meta<typeof ClipPlayer>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const CompareNight: Story = { args: { compare: true, comparePoster: stageArt('story', 'monolith', 'night') } }
export const Busy: Story = { args: { busy: true } }
