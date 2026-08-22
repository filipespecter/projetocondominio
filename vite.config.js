import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      includeAssets: [
        "favicon.svg",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-maskable-512x512.png",
        "apple-touch-icon.png",
      ],

      manifest: {
        id: "/",
        name: "InfinityCondo",
        short_name: "InfinityCondo",
        description:
          "Gestão condominial inteligente da Star Infinity Code.",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#ffffff",
        theme_color: "#6d28d9",

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        // O bundle principal da Central Star passou de 2 MiB.
        // Elevamos o limite do precache para 3 MiB.
        maximumFileSizeToCacheInBytes:
          3 * 1024 * 1024,

        navigateFallback:
          "/index.html",

        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,woff,woff2}",
        ],

        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith(
                "/api/"
              ),
            handler:
              "NetworkOnly",
          },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],
});