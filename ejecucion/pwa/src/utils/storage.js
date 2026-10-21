import api from '@/services/api'

export function getStorageUrl(idDoc) {
  if (!idDoc) return '#'
  const rawBase = api.defaults.baseURL || 'https://servidor.leanglobal.cl/lg-gsp-dev/api'
  const cleanBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
  return `${cleanBase}/v1/storage/view/${idDoc}`
}

export function resolverFotoUrl(f) {
  if (!f) return ''
  if (typeof f === 'number' || (typeof f === 'string' && !isNaN(f) && f.trim() !== '')) {
    return getStorageUrl(f)
  }
  const url = typeof f === 'string' ? f : (f.url || '')
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (typeof f === 'object' && f.id_doc) {
    return getStorageUrl(f.id_doc)
  }
  const rawBase = api.defaults.baseURL || 'https://servidor.leanglobal.cl/lg-gsp-dev/api'
  const cleanBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
  if (url.startsWith('/api/')) {
    return cleanBase + url.substring(4)
  }
  if (url.startsWith('/v1/')) {
    return `${cleanBase}${url}`
  }
  return url
}
