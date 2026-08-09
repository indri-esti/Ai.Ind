import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",

      manifest: {
        name: "AI.Ind",
        short_name: "AI.Ind",
        description: "Asisten AI buatan Indonesia.",
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#081420",
        theme_color: "#081420",
        lang: "id",

        
        icons: [
  {
    src: "/icon-192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
],
      },
    }),
  ],
});