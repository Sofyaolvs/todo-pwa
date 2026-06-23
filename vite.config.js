import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Lista de Compras',
        short_name: 'Compras',
        description: 'Lista de compras',
        theme_color: '#2d6a4f',
        background_color: '#f3ede4',
        display: 'standalone',
        start_url: '/?app=1',
        share_target: {
          action: '/?app=1',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
        shortcuts: [
          {
            name: 'Abrir lista',
            short_name: 'Lista',
            url: '/?app=1',
            icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
          },
        ],
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
})
