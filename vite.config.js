import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages / genel dağıtım için relative base
export default defineConfig({
  base: './',
  plugins: [react()],
})
