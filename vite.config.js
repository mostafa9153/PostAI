import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/n8n-proxy': {
        target: 'https://n8n.srv1106977.hstgr.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n-proxy/, '')
      }
    }
  }
})
