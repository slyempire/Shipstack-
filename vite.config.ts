import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const isBuild = process.argv.includes('build') || mode === 'production';
    
    return {
      base: isBuild ? '/assets/shipstack/dist/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        VitePWA({
          scope: '/shipstack/',
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'Shipstack Logistics',
            short_name: 'Shipstack',
            description: 'Logistics operating system for East Africa — dispatch, tracking, payments and invoicing.',
            theme_color: '#0F2A44',
            background_color: '#0F2A44',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      optimizeDeps: {
        esbuildOptions: {
          target: 'es2022'
        }
      },
      esbuild: {
        target: 'es2022'
      },
      build: {
        target: 'es2022',
        outDir: path.resolve(__dirname, 'shipstack_frappe/shipstack/public/dist'),
        emptyOutDir: true,
        manifest: true
      },
      // NOTE: Never inject GEMINI_API_KEY (or any server secret) via `define` —
      // it would be baked into the client bundle. AI calls are server-side only.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
