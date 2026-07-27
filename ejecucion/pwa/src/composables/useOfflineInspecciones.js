// src/composables/useOfflineInspecciones.js
import { ref, onMounted, onBeforeUnmount } from 'vue'
import apiAxios from '@/services/api'   // 👈 usa tu cliente con baseURL

const COLA_KEY = 'cola_inspecciones_v1'

function cargarCola () {
  try {
    const raw = localStorage.getItem(COLA_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error('Error cargando cola inspecciones:', e)
    return []
  }
}

function guardarCola (cola) {
  try {
    localStorage.setItem(COLA_KEY, JSON.stringify(cola))
  } catch (e) {
    console.error('Error guardando cola inspecciones:', e)
  }
}

export function useOfflineInspecciones () {
  const cola = ref(cargarCola())
  const sincronizando = ref(false)
  const ultimoError = ref(null)

  function agregarATabla (config, meta = {}) {
    const item = {
      id_local: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      config,              // { method, url, data, headers }
      meta,                // { tipo, id_survey, ... }
      createdAt: new Date().toISOString()
    }
    cola.value.push(item)
    guardarCola(cola.value)
    console.log('[OFFLINE-INSPECCIONES] agregado a cola', item)
  }

  async function sincronizarAhora () {
    if (sincronizando.value) return
    if (!navigator.onLine) {
      console.log('[OFFLINE-INSPECCIONES] sin conexión, no sincroniza')
      return
    }

    sincronizando.value = true
    ultimoError.value = null

    try {
      const copia = [...cola.value]

      for (const item of copia) {
        try {
          console.log('[OFFLINE-INSPECCIONES] enviando', item)
          // 👇 antes: await axios(item.config)
          await apiAxios(item.config)

          // si llegó OK, lo saco de la cola
          cola.value = cola.value.filter(i => i.id_local !== item.id_local)
          guardarCola(cola.value)
        } catch (err) {
          console.error('[OFFLINE-INSPECCIONES] error item', item, err)
          ultimoError.value = err
          // se reintenta en la próxima conexión
        }
      }
    } finally {
      sincronizando.value = false
    }
  }

  function enviarOACola (config, meta = {}) {
    if (navigator.onLine) {
      // 👇 modo online normal: usamos el mismo cliente
      return apiAxios(config)    // antes: axios(config)
    } else {
      // guardar en cola y simular respuesta
      agregarATabla(config, meta)
      return Promise.resolve({
        data: {
          offlineQueued: true
        }
      })
    }
  }

  function limpiarCola () {
    cola.value = []
    guardarCola(cola.value)
  }

  onMounted(() => {
    window.addEventListener('online', sincronizarAhora)
    if (navigator.onLine && cola.value.length > 0) {
      sincronizarAhora()
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', sincronizarAhora)
  })

  return {
    cola,
    sincronizando,
    ultimoError,
    enviarOACola,
    sincronizarAhora,
    limpiarCola
  }
}
