import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Lista de la Compra',
        short_name: 'ListaCompra',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/favicon.png',
            type: 'image/png',
            sizes: '192x192'
          },
          {
            src: '/favicon.png',
            type: 'image/png',
            sizes: '512x512'
          },
          {
            src: '/favicon.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
  },
  build: {
    outDir: "dist",
  },
});
