import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Local preview only: the SPA calls relative /api/*; without a local backend
    // proxy those reads to production so pages render with real data.
    proxy: {
      '/api': { target: 'https://www.extrafun.pl', changeOrigin: true },
    },
  },
})
