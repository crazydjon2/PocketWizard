import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@game': resolve(__dirname, 'src/game'),
      '@scene': resolve(__dirname, 'src/pixi'),
      '@store': resolve(__dirname, 'src/store'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@tg': resolve(__dirname, 'src/tg'),
      '@hooks': resolve(__dirname, 'src/hooks'),
    },
  },
  test: {
    environment: 'node',
  },
})
