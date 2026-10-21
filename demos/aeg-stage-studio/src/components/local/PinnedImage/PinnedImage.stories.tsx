import type { Meta, StoryObj } from '@storybook/react-vite'
import { stageArt } from '~/mocks/art'
import { PinnedImage } from './PinnedImage'

const pins = [
  { id: 'a', number: 1, x: 28, y: 38 },
  { id: 'b', number: 2, x: 62, y: 55 },
  { id: 'c', number: 3, x: 80, y: 22 },
]

const meta = {
  title: 'Local/PinnedImage',
  component: PinnedImage,
  args: { src: stageArt('story', 'arch', 'golden-hour'), alt: 'Stage concept', pins },
  decorators: [(Story) => <div className="w-130"><Story /></div>],
} satisfies Meta<typeof PinnedImage>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const ActivePin: Story = { args: { activeId: 'b' } }
export const SomeResolved: Story = { args: { resolvedIds: ['a'] } }
