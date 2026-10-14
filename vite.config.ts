import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Tauri devUrl target (see src-tauri/tauri.conf.json).
  server: {
    port: 1420,
    strictPort: true,
  },
})
