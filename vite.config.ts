import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'Friend Initiative Organization',
          short_name: 'F I O',
          description:
            'Comprehensive cooperative society management platform for tracking member savings kisti, loans, project investments, and committee task workflows.',
          theme_color: '#064e3b',
          background_color: '#064e3b',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          lang: 'bn',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true, // Enables service worker in development / AI Studio preview
          type: 'module',
        },
      }),
      {
        name: 'suppress-vite-hmr-websocket',
        transformIndexHtml: {
          order: 'pre' as const,
          handler() {
            return [
              {
                tag: 'script',
                attrs: { type: 'text/javascript' },
                children: `
(function() {
  var OriginalWebSocket = window.WebSocket;
  if (!OriginalWebSocket) return;
  window.WebSocket = function(url, protocols) {
    if (
      protocols === 'vite-hmr' ||
      protocols === 'vite-ping' ||
      (typeof url === 'string' && (url.indexOf('token=') !== -1 || url.indexOf('24678') !== -1))
    ) {
      var dummy = new EventTarget();
      dummy.close = function() {};
      dummy.send = function() {};
      dummy.readyState = 1; // OPEN
      dummy.addEventListener = EventTarget.prototype.addEventListener.bind(dummy);
      dummy.removeEventListener = EventTarget.prototype.removeEventListener.bind(dummy);
      dummy.dispatchEvent = EventTarget.prototype.dispatchEvent.bind(dummy);
      setTimeout(function() {
        dummy.dispatchEvent(new Event('open'));
      }, 5);
      return dummy;
    }
    return new OriginalWebSocket(url, protocols);
  };
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  window.WebSocket.CONNECTING = 0;
  window.WebSocket.OPEN = 1;
  window.WebSocket.CLOSING = 2;
  window.WebSocket.CLOSED = 3;
})();
`,
                injectTo: 'head-prepend' as const,
              },
            ];
          },
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio per environment constraints.
      hmr: false,
      watch: null,
    },
  };
});
