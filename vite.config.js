import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/results': {
        target: 'https://results.elections.ab.ca',
        changeOrigin: true,
        rewrite: () => '/data/8486?version=3.0.0&wards=23',
      },
    },
  },
})
