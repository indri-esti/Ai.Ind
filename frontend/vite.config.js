import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "AI.Ind",
        short_name: "AI.Ind",
        description: "AI Buatan Indonesia",
        theme_color: "#081420",
        background_color: "#081420",
        display: "standalone",

        icons: [
          {
            src: "/logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
})