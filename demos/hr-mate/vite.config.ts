import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// This demo uses shadcn/ui, not Anvil: components live in src/components/ui and `@` is its own src.
export default defineConfig({
  // Local dev serves from /. The GitHub Pages build sets BASE_PATH to the demo's folder on the site.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(dirname, 'src') },
    dedupe: ['react', 'react-dom'],
  },
})
