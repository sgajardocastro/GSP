import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import pkg from './package.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawBaseUrl = env.VITE_APP_BASE_URL || '/'
  let base = '/'

  try {
    const parsed = new URL(rawBaseUrl)
    base = parsed.pathname || '/'
  } catch {
    base = rawBaseUrl.startsWith('/') ? rawBaseUrl : `/${rawBaseUrl}`
  }

  if (!base.endsWith('/')) base = `${base}/`

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: 'https://servidor.leanglobal.cl/lg-gsp',
          changeOrigin: true,
          secure: false,
        }
      }
    }

  }
})
