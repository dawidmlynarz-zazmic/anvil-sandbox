import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// Anvil is a read-only sibling clone (see README). `@` is Anvil's own internal alias; the app's `src` is `~`.
const anvil = path.resolve(dirname, process.env.ANVIL_PATH ?? '../../../anvil-ui', 'src')

export default defineConfig({
  // Local dev serves from /. The GitHub Pages build sets BASE_PATH to the demo's folder on the site.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '~': path.resolve(dirname, 'src'), '@anvil': anvil, '@': anvil },
    dedupe: ['react', 'react-dom'],
  },
  server: { fs: { allow: [path.resolve(dirname, '../../..')] } },
})
