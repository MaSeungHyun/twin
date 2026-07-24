import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],
      manifest: {
        name: "Station Twin",
        short_name: "Twin",
        description: "역사 디지털 트윈 뷰어",
        theme_color: "#0066b3",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: /^\/api\/models\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^\/api\/tago\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "tago-api",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 32,
                maxAgeSeconds: 60 * 5,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  optimizeDeps: {
    exclude: ["three/webgpu"],
  },
  assetsInclude: ["**/*.glb", "**/*.gltf"],
  server: {
    proxy: {
      "/api/tago": {
        target: "https://apis.data.go.kr/1613000/TrainInfo",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/tago/, ""),
      },
      "/api/models": {
        target: "https://github.com/MaSeungHyun/twin/releases/download/v0.0.0",
        changeOrigin: true,
        followRedirects: true,
        rewrite: (p) => p.replace(/^\/api\/models/, ""),
      },
    },
  },
});
