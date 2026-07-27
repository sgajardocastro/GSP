// useApiWatcher.js
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

/**
 * Vigila una URL de API y notifica cuando hay cambios.
 * - Usa If-None-Match (ETag) y If-Modified-Since (Last-Modified) si el server los soporta.
 * - Si no, compara por "hash" (JSON.stringify por defecto).
 */
export function useApiWatcher({
  url,
  method = 'get',
  params,
  baseHeaders = {},
  intervalMs = 5000,           // intervalo normal
  maxIntervalMs = 60000,       // tope de backoff
  backoffFactor = 2,           // multiplicador del backoff
  immediate = true,            // dispara al montar
  axiosInstance = axios,
  computeHash = (data) => JSON.stringify(data), // comparar por contenido si no hay ETag/Last-Modified
  enabled = true,              // permite encender/apagar desde fuera
} = {}) {
  const isRunning = ref(false)
  const data = ref(null)
  const changed = ref(false)
  const error = ref(null)
  const lastETag = ref(null)
  const lastModified = ref(null)
  const lastHash = ref(null)

  let timer = null
  let delay = intervalMs
  let controller = null
  let pageHidden = document.visibilityState === 'hidden'

  function schedule(nextDelay) {
    clearTimeout(timer)
    timer = setTimeout(tick, nextDelay)
  }

  async function tick() {
    if (!enabled || pageHidden) {
      // Reintenta cuando vuelva a estar visible/enable
      schedule(intervalMs)
      return
    }

    controller?.abort()
    controller = new AbortController()

    const headers = { ...baseHeaders }
    if (lastETag.value) headers['If-None-Match'] = lastETag.value
    if (lastModified.value) headers['If-Modified-Since'] = lastModified.value

    try {
      changed.value = false
      const res = await axiosInstance.request({
        url,
        method,
        params,
        headers,
        signal: controller.signal,
        // Aceptamos 304 para no tratarlo como error
        validateStatus: (s) => (s >= 200 && s < 300) || s === 304 || s === 429 || s === 503,
      })

      if (res.status === 304) {
        // No hay cambios
        error.value = null
        delay = intervalMs
        schedule(delay)
        return
      }

      if (res.status === 429 || res.status === 503) {
        // Respetar Retry-After si viene
        const ra = res.headers?.['retry-after']
        const retryAfterMs = ra ? Number(ra) * 1000 : null
        delay = Math.min(retryAfterMs || delay * backoffFactor, maxIntervalMs)
        error.value = new Error(`Reintentar más tarde (${res.status})`)
        schedule(delay)
        return
      }

      // 200 OK
      error.value = null
      delay = intervalMs

      const newETag = res.headers?.etag || null
      const newLastMod = res.headers?.['last-modified'] || null
      const body = res.data
      const newHash = computeHash(body)

      const etagChanged = newETag && lastETag.value && newETag !== lastETag.value
      const lmChanged = newLastMod && lastModified.value && newLastMod !== lastModified.value
      const hashChanged = !newETag && !newLastMod && lastHash.value && newHash !== lastHash.value

      // Si es la primera vez, consideramos "cambio" para inicializar datos
      const isFirst = data.value === null
      changed.value = isFirst || etagChanged || lmChanged || hashChanged

      // Actualizar referencias y data
      lastETag.value = newETag || lastETag.value
      lastModified.value = newLastMod || lastModified.value
      lastHash.value = newHash
      data.value = body

      schedule(delay)
    } catch (err) {
      if (axiosInstance.isCancel?.(err)) return
      error.value = err
      // Backoff en errores de red
      delay = Math.min(delay * backoffFactor, maxIntervalMs)
      schedule(delay)
    }
  }

  function start() {
    if (isRunning.value) return
    isRunning.value = true
    delay = intervalMs
    immediate ? tick() : schedule(delay)
  }

  function stop() {
    isRunning.value = false
    clearTimeout(timer)
    controller?.abort()
  }

  async function checkNow() {
    // Fuerza una verificación inmediata sin esperar el timer
    clearTimeout(timer)
    await tick()
  }

  // Pausar cuando la pestaña no está visible
  function onVisibility() {
    pageHidden = document.visibilityState === 'hidden'
    if (!pageHidden && isRunning.value) {
      // Al volver a visible, chequeo inmediato
      checkNow()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  onMounted(() => {
    if (enabled) start()
  })

  onBeforeUnmount(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
  })

  return {
    // state
    isRunning,
    data,
    changed,
    error,
    // controls
    start,
    stop,
    checkNow,
    // meta
    lastETag,
    lastModified,
  }
}
