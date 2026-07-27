import { createApp } from 'vue'

// Pinia
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './assets/tailwind.css'
import './assets/styles/sakai-vuetify.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import './registerServiceWorker'
import router from './router'
import { VOtpInput } from 'vuetify/components'

// 1) Crear app
const app = createApp(App)

// 2) Crear Pinia + plugin
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 3) Crear Vuetify
const vuetify = createVuetify({
  components: {
    ...components,
    VOtpInput,
  },
  directives,
  icons: {
    defaultSet: 'mdi',
  },
})

// 4) Instalar plugins en la app
app.use(pinia)
app.use(router)
app.use(vuetify)
// 6) Montar app
app.mount('#app')

// Manejar actualización del service worker
document.addEventListener('swUpdated', (event) => {
  const registration = event.detail

  if (confirm('New content is available, would you like to refresh the page?')) {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })

      registration.waiting.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') {
          window.location.reload()
        }
      })
    }
  }
})
