import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // сайт лежит в подпути https://kasstel.github.io/LoveMap/ — иначе бандл ищет ассеты в корне домена
  base: '/LoveMap/',
  plugins: [react(), tailwindcss()],
})
