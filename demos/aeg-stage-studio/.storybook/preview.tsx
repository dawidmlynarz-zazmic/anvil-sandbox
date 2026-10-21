import { withThemeByClassName } from '@storybook/addon-themes'
import type { Preview } from '@storybook/react-vite'
import '../src/styles/app.css'

const preview: Preview = {
  decorators: [
    withThemeByClassName({ themes: { light: '', dark: 'dark' }, defaultTheme: 'dark' }),
  ],
  parameters: { layout: 'centered' },
}
export default preview
