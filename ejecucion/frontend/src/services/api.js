import axios from 'axios'
import { navStore } from '../stores/navStore'

const apiAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL_CORE || import.meta.env.VITE_API_BASE_URL || 'https://servidor.leanglobal.cl/lean-services-transmac-dev/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor: adjunta token y user data de localStorage en cada request
apiAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const userRaw = localStorage.getItem('user')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  // Priorizar navStore.activeEmpresa para que las peticiones se filtren por la empresa seleccionada reactivamente
  const activeEmp = navStore.activeEmpresa !== undefined ? navStore.activeEmpresa : null
  if (activeEmp !== null) {
    config.params = { ...config.params, _id_empresa: activeEmp }
  } else if (userRaw) {
    try {
      const user = JSON.parse(userRaw)
      // Pasar id_empresa como query param de fallback para bypass de dev
      if (user?.id_empresa && !config.params?.id_empresa) {
        config.params = { ...config.params, _id_empresa: user.id_empresa }
      }
    } catch (e) {}
  }
  return config
})

const sstAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL_SST || 'https://servidor.leanglobal.cl/transmac-api/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export { apiAxios, sstAxios }
export default apiAxios
