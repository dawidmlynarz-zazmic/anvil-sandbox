import { withThemeByClassName } from '@storybook/addon-themes'
import type { Preview } from '@storybook/react-vite'
import '../src/styles/app.css'

// Stories wear the AXS skin the app wears, so a local component is reviewed the way it ships.
document.documentElement.dataset.brand = 'axs'

const preview: Preview = {
  decorators: [withThemeByClassName({ themes: { light: '', dark: 'dark' }, defaultTheme: 'dark' })],
  parameters: { layout: 'centered' },
}
export default preview
