import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['three/webgpu'],
  },
  server: {
    proxy: {
      '/api/tago': {
        target: 'https://apis.data.go.kr/1613000/TrainInfo',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/tago/, ''),
      },
      '/api/models': {
        target:
          'https://github.com/MaSeungHyun/twin/releases/download/v0.0.0',
        changeOrigin: true,
        followRedirects: true,
        rewrite: (p) => p.replace(/^\/api\/models/, ''),
      },
    },
  },
})
