import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base '/'：Playwright preview 在本机 127.0.0.1:4173 提供已构建页面。
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { port: 5173, host: '127.0.0.1' },
  preview: { port: 4173, host: '127.0.0.1', strictPort: true },
})
