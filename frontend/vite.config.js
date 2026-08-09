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
        theme_color: "#081420",
        background_color: "#081420",
        display: "standalone",
        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "/logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],
});