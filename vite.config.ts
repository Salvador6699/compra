import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      },
      manifest: {
        name: "Libreta de la Compra",
        short_name: "La Compra",
        description: "Lista de la compra familiar en tiempo real, rápida y estilo libreta de papel.",
        theme_color: "#faf8f5",
        background_color: "#faf8f5",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/favicon.png",
            type: "image/png",
            sizes: "192x192",
          },
          {
            src: "/favicon.png",
            type: "image/png",
            sizes: "512x512",
          },
          {
            src: "/favicon.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    host: true,
  },
  build: {
    outDir: "dist",
  },
});
