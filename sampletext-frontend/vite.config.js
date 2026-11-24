import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: { allowedHosts: ['tecweb-2026-2-projeto3-frontend-8mg5.onrender.com'] },
  preview: { allowedHosts: ['tecweb-2026-2-projeto3-frontend-8mg5.onrender.com'] },
})