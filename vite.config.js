import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages sirve el sitio en https://<usuario>.github.io/gym-tracker/
  base: '/gym-tracker/',
})
