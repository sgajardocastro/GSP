const { defineConfig } = require('@vue/cli-service')

function resolvePublicPath() {
  const rawBaseUrl = process.env.VUE_APP_BASE_URL || process.env.VITE_APP_BASE_URL || '/'

  try {
    const parsedUrl = new URL(rawBaseUrl)
    const path = parsedUrl.pathname || '/'
    return path.endsWith('/') ? path : `${path}/`
  } catch (error) {
    const normalized = rawBaseUrl.startsWith('/') ? rawBaseUrl : `/${rawBaseUrl}`
    return normalized.endsWith('/') ? normalized : `${normalized}/`
  }
}

const publicPath = resolvePublicPath()

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath,
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'GSP - Operaciones (PWA)';
      return args;
    });
  },

  /* ==========================
   * DEV SERVER (FIX ResizeObserver)
   * ========================== */
  devServer: {
    port: 5173,
    client: {
      overlay: {
        warnings: false, // 👈 silencia ResizeObserver loop
        errors: true     // 👈 errores reales siguen apareciendo
      }
    }
  },

  /* ==========================
   * PWA CONFIG
   * ========================== */
  pwa: {
    name: 'LgGsp',
    appleMobileWebAppTitle: 'LgGsp',
    themeColor: '#18181b',
    msTileColor: '#000000',

    // Sigue usando GenerateSW
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,

      // Asegura que las rutas SPA sigan funcionando offline
      navigateFallback: `${publicPath}index.html`,

      // 👇 MAGIA OFFLINE
      runtimeCaching: [
        // 1) API principal (GET) -> NetworkFirst
        {
          urlPattern: /^https:\/\/servidor\.leanglobal\.cl\/lg-gsp\/api\/.*$/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-lean-cache',
            networkTimeoutSeconds: 10,
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },

        // 2) Imágenes
        {
          urlPattern: /^https:\/\/servidor\.leanglobal\.cl\/storage\/.*$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'imagenes-lean-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },

        // 3) Fuentes Google
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 365 * 24 * 60 * 60,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
  },
})
