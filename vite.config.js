import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks: a deploy only invalidates the app chunk, so
        // returning visitors keep react/supabase cached (assets are immutable, 1y).
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'wouter', 'react-helmet-async'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    // Local preview only: the SPA calls relative /api/*; without a local backend
    // proxy those reads to production so pages render with real data.
    proxy: {
      '/api': { target: 'https://www.extrafun.pl', changeOrigin: true },
    },
  },
})
