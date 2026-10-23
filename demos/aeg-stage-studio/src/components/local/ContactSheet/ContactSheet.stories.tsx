import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { stageArt } from '~/mocks/art'
import { ContactSheetGroup, ContactSheetTile } from './ContactSheet'

const SHAPES = ['arch', 'monolith', 'ribbons', 'halo'] as const
const CAPTIONS = ['As designed', 'Slimmer, warm light', 'Cool light, in haze', 'Gold light, brighter']

/** Two batches, with one image open and a chosen look. */
function Sheet({ pending = 0 }: { pending?: number }) {
  const [focused, setFocused] = useState('5')
  const tile = (n: number) => {
    const id = String(n)
    return (
      <ContactSheetTile
        key={id}
        label={`#${n}`}
        caption={CAPTIONS[n % 4]!}
        src={stageArt(`sheet-${n}`, SHAPES[n % 4]!, 'golden-hour')}
        alt={`#${n}`}
        focused={focused === id}
        chosen={n === 5 ? 'Look' : undefined}
        dismissed={n === 3}
        onOpen={() => setFocused(id)}
      />
    )
  }
  return (
    <div className="@container flex w-[720px] flex-col gap-5">
      <ContactSheetGroup title="More like #2" meta="3 images · you asked" pending={pending}>
        {[5, 6, 7].map(tile)}
      </ContactSheetGroup>
      <ContactSheetGroup title="New directions" meta="4 images · the agent explored">
        {[1, 2, 3, 4].map(tile)}
      </ContactSheetGroup>
    </div>
  )
}

const meta = {
  title: 'Local/ContactSheet',
  component: Sheet,
} satisfies Meta<typeof Sheet>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Rendering: Story = { args: { pending: 1 } }
