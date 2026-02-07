// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import compressor from 'astro-compressor';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  site: process.env.NODE_ENV === 'production' ? 'https://sarthakworks.github.io' : undefined,
  base: '/',
  build: {
    assets: 'astro'
  },
  integrations: [
    react(),
    compressor({
      gzip: true,
      brotli: true,
    }),
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // Automatically inject the registration script
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
        mode: 'production',
        cacheId: 'alltools',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mjs,json,woff,woff2,eot,ttf,otf}'],
        navigateFallback: '/404',
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 10MB (increased from 5MB for large PDF libraries)
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
            },
          },

          // Special caching for critical PDF processing modules
          {
            urlPattern: /pdfjs-dist|pdf-lib|jszip|@pdfsmaller/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pdf-modules',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
            },
          },
          // Cache JavaScript modules for offline dynamic imports
          {
            urlPattern: /\.(?:js|mjs)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'js-modules',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true
      }
    })
  ],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@pdfsmaller/pdf-encrypt-lite',
        'pdfjs-dist',
        'jszip',
        '@dnd-kit/core',
        '@dnd-kit/sortable',
        '@dnd-kit/utilities',
        '@huggingface/transformers'
      ]
    },
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      }
    },
    build: {
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Priority 1: Specific vendor buckets
              if (id.includes('lucide-react')) {
                return 'lucide-icons';
              }
              if (id.includes('pdfjs-dist') || id.includes('pdf-lib') || id.includes('jszip') || id.includes('@pdfsmaller')) {
                return 'pdf-vendor';
              }
              if (id.includes('@huggingface/transformers')) {
                return 'ai-vendor';
              }
              // Priority 2: Everything else (including React)
              return 'vendor';
            }
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
          passes: 3,
        },
        format: {
          comments: false,
        },
      },
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en", "hi", "de", "fr", "it", "ar"],
    routing: {
      prefixDefaultLocale: false
    }
  }
});
// eslint-disable-next-line no-undef