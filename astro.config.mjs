// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import compressor from 'astro-compressor';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    compressor({
      gzip: true,
      brotli: true,
    }),
    AstroPWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico'],
      manifest: {
        name: 'AllTools',
        short_name: 'AllTools',
        description: 'Free PDF, Image, and AI tools for everyone.',
        theme_color: '#ffffff',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mjs,json}'],
        navigateFallback: '/404',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },
      devOptions: {
        enabled: true
      }
    })
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});