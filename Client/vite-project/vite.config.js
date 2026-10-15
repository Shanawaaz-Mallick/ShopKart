import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Vercel serves files from the repository-root public directory through
    // its CDN. Keeping the build here also lets the Express app serve the same
    // frontend on traditional Node hosts such as Render.
    outDir: '../../public',
    emptyOutDir: true,
  },
})
