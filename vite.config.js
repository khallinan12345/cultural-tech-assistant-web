import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/cultural-tech-assistant-web/',
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' 
        ? '/.netlify/functions'
        : 'http://localhost:3001/api'
    )
  },
  server: {
    port: 5173,
    open: true,
    cors: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true
  }
})