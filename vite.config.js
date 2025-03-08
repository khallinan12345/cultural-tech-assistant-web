export default defineConfig({
  plugins: [react()],
  base: '/cultural-tech-assistant-web/',
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' 
        ? '/.netlify/functions'  // Netlify Functions path
        : 'http://localhost:3001/api'
    )
  }
});