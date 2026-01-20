import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/api": path.resolve(__dirname, "./api")
    },
  },
  server: {
    port: 3000,
    open: true
  }
})