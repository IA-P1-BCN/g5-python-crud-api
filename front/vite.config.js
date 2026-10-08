import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    // Outside Docker the API is on localhost; in `front-dev` compose sets VITE_API_PROXY_TARGET=http://api:8000
    proxy: { '/api': process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000' },
    // Docker bind mounts do not always forward file events: compose enables polling for front-dev
    watch: process.env.VITE_USE_POLLING ? { usePolling: true } : undefined,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
