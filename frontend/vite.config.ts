import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // FE luôn gọi /api trên cùng origin (5173); Vite dev server chuyển tiếp
      // sang backend — nhờ vậy browser không thấy cross-origin, né CORS trong dev.
      // Lưu ý máy này: backend chạy 8090 (xem GUIDE §3 — 8080 bị app Caris chiếm).
      '/api': 'http://localhost:8090',
    },
  },
})
