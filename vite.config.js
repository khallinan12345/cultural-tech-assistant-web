import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/cultural-appropriate-technology-trainer/', // Your repo name
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});