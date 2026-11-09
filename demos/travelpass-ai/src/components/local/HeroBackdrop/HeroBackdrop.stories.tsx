import type { Meta, StoryObj } from '@storybook/react-vite'
import { photo } from '~/lib/scenic'
import { HeroBackdrop } from './HeroBackdrop'

const meta: Meta<typeof HeroBackdrop> = {
  title: 'Local/HeroBackdrop',
  component: HeroBackdrop,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-[480px] p-4"><Story /></div>],
}
export default meta

export const Still: StoryObj<typeof HeroBackdrop> = {
  args: { image: photo('coast', 3, 24), children: <h1 className="type-heading-3xl">Tell me what you wish for your trip</h1> },
}
