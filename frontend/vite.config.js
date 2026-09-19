import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/static/',       // Django serves static files under /static/
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})