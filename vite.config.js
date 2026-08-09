import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages / genel dağıtım için relative base
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Görselleri (logo vb.) base64 gömerek tek dosya önizlemede de çalışsın
    assetsInlineLimit: 20 * 1024 * 1024,
  },
})
