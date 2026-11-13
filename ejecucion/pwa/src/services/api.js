// src/services/api.js
import axios from 'axios'

const resolveApiBase = () => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/pwa-gsp-prod') || window.location.pathname.startsWith('/lg-gsp-prod')) {
      return 'https://servidor.leanglobal.cl/lg-gsp-prod/api'
    }
    if (window.location.pathname.startsWith('/pwa-gsp-dev') || window.location.pathname.startsWith('/lg-gsp-dev')) {
      return 'https://servidor.leanglobal.cl/lg-gsp-dev/api'
    }
  }
  return process.env.VUE_APP_API_BASE_URL || 'https://servidor.leanglobal.cl/lg-gsp-dev/api'
}

const api = axios.create({
  baseURL: resolveApiBase()
})

// Interceptor de request: adjunta JWT y X-User-Id desde la sesión activa de la PWA
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    const perfilRaw = localStorage.getItem('perfil')
    if (perfilRaw) {
      const perfil = JSON.parse(perfilRaw)
      const idUser = perfil?.ID_USUARIO || perfil?.id_user || null
      if (idUser) {
        config.headers['X-User-Id'] = String(idUser)
      }
    }
  } catch (e) {
    // Ignorar error de lectura de storage
  }
  return config
})

// TRANSAMAC_REMOVE_CONEXION_20260428: desactiva llamadas realtime de conexion.
// Volver a false si se restaura el modulo CNX.
const DISABLE_CNX_REALTIME_TOUCH = true

function shouldTouchConexionRealtime() {
  if (DISABLE_CNX_REALTIME_TOUCH) return false

  return false
}

function extractSurveyIdFromConfig(config = {}) {
  try {
    const url = String(config.url || '')
    const byPath = url.match(/\/survey\/(\d+)/)
    if (byPath) return Number(byPath[1]) || null

    const data = config?.data
    if (!data) return null
    const obj = typeof data === 'string' ? JSON.parse(data) : data
    const id = Number(obj?.id_survey || 0)
    return id > 0 ? id : null
  } catch {
    return null
  }
}

api.interceptors.response.use(
  (response) => {
    if (shouldTouchConexionRealtime(response?.config)) {
      const idSurvey = extractSurveyIdFromConfig(response?.config)
      api.post('', {
        eventName: 'pwa.survey.updated',
        id_survey: idSurvey
      }).catch((err) => {
        console.error('No se pudo tocar la version realtime de conexion:', err)
      })
    }

    return response
  },
  (error) => Promise.reject(error)
)

export default api
