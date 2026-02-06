import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimizaciones de build
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    // Dividir chunks para mejor caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks separados
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'zustand': ['zustand'],
          'ui': ['lucide-react', 'recharts', 'date-fns']
        }
      }
    },
    // Reducir tamaño de chunks
    chunkSizeWarningLimit: 600
  },
  // Optimizar deps
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', 'zustand']
  }
})
