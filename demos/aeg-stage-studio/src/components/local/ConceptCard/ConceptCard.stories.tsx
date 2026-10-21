import type { Meta, StoryObj } from '@storybook/react-vite'
import { stageArt } from '~/mocks/art'
import { ConceptCard } from './ConceptCard'

const img = (seed: string, time: 'golden-hour' | 'night' = 'golden-hour') => <img src={stageArt(seed, 'monolith', time)} alt="" />
const src = (seed: string) => stageArt(seed, 'monolith', 'golden-hour')
const checks = [
  { label: 'Rigging', ok: true, detail: 'Within the venue’s rigging limit.' },
  { label: 'Sightlines', ok: false, detail: 'Hides part of the screen from the back of the field.' },
]

const meta = {
  title: 'Local/ConceptCard',
  component: ConceptCard,
  args: {
    title: 'B1 · Stone monolith',
    rationale: 'Strongest silhouette against the sunset.',
    version: 1,
    mediaSrc: src('a'),
    mediaAlt: 'Stage concept B1',
    checks,
    selected: false,
    onSelectedChange: () => undefined,
    onAddAnnotation: () => undefined,
    onRemoveAnnotation: () => undefined,
    onApplyAnnotations: () => undefined,
    onMoreLikeThis: () => undefined,
    onRegenerate: () => undefined,
    onToggleDismissed: () => undefined,
  },
  decorators: [(Story) => <div className="w-130"><Story /></div>],
} satisfies Meta<typeof ConceptCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Selected: Story = { args: { selected: true } }
export const WithAnnotations: Story = {
  args: { annotations: [{ number: 1, text: 'Sharper top edge', x: 50, y: 25 }, { number: 2, text: 'Warmer overall' }] },
}
export const SecondVersion: Story = {
  args: {
    version: 2,
    change: '2 changes: sharper top edge; warmer overall',
    previous: { version: 1, src: src('a'), changes: [{ number: 1, text: 'Sharper top edge', x: 50, y: 25 }, { number: 2, text: 'Warmer overall' }] },
    mediaSrc: src('b'),
    onRevert: () => undefined,
    checks: checks.map((c) => ({ ...c, ok: true })),
  },
}
export const Refining: Story = { args: { busy: 'Refining…' } }
export const Variations: Story = { args: { variants: [img('x'), img('y'), img('z')] } }
export const VariationsLoading: Story = { args: { variants: 'generating' } }
export const Dismissed: Story = { args: { dismissed: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
