import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/chat': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/api/promotions': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/api/tryon': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/api/auth': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/api/orders': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
