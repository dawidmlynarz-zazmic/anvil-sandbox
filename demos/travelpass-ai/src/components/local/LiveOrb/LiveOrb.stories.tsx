import type { Meta, StoryObj } from '@storybook/react-vite'
import { LiveOrb } from './LiveOrb'

const meta: Meta<typeof LiveOrb> = { title: 'Local/LiveOrb', component: LiveOrb, args: { onToggle: () => {} } }
export default meta

export const Idle: StoryObj<typeof LiveOrb> = { args: { state: 'idle' } }
export const Listening: StoryObj<typeof LiveOrb> = { args: { state: 'listening' } }
export const Muted: StoryObj<typeof LiveOrb> = { args: { state: 'muted' } }
