import type { StorybookConfig } from '@storybook/react-vite'

// Dev-only: documents the local (Anvil-candidate) components, not Anvil itself.
const config: StorybookConfig = {
  stories: ['../src/components/local/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-themes', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
}
export default config
