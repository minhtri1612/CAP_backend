import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/odata': {
        target: 'http://localhost:4004',
        changeOrigin: true,
      },
    },
  },
})
