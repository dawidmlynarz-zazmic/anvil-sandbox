import type { Meta, StoryObj } from '@storybook/react-vite'
import { days } from '~/data/forecast'
import { ForecastChart } from './ForecastChart'

const meta: Meta<typeof ForecastChart> = { title: 'Local/ForecastChart', component: ForecastChart, args: { days, highlight: 5, callout: 'Sat, Mar 13: 97%, +12 pts' }, parameters: { layout: 'padded' } }
export default meta
export const Default: StoryObj<typeof ForecastChart> = {}
