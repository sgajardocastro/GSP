import api from '@/services/api'

/**
 * Pipeline de Compresión Fotográfica Industrial PWA (SPEC-133)
 * - Escalamiento proporcional a máx 1024px
 * - Codificación JPEG a calidad 0.70
 * - Retorno de Blob binario optimizado (peso medio: 80 KB - 140 KB)
 * 
 * @param {File|Blob|string} fileOrDataUrl - Archivo, Blob o DataURL Base64
 * @param {number} maxDimension - Dimensión máxima en píxeles (default: 1024)
 * @param {number} quality - Calidad JPEG (default: 0.70)
 * @returns {Promise<Blob|null>}
 */
export async function comprimirImagenABlob(fileOrDataUrl, maxDimension = 1024, quality = 0.70) {
  if (!fileOrDataUrl) return null

  // Si ya es un Blob/File y no es string, verificar si es imagen
  return new Promise((resolve, reject) => {
    const img = new Image()

    const procesarImagen = () => {
      let width = img.naturalWidth || img.width
      let height = img.naturalHeight || img.height

      if (!width || !height) {
        return reject(new Error('Dimensiones inválidas en la imagen'))
      }

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      // Dibujar fondo blanco por si hay transparencias PNG
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Fallo al generar Blob de imagen comprimida'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onload = procesarImagen
    img.onerror = () => reject(new Error('Error al cargar la imagen para compresión'))

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(fileOrDataUrl)
    } else {
      resolve(null)
    }
  })
}

/**
 * Convierte un Blob en una DataURL (Base64) para previsualización inmediata en UI
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
export function blobADataUrl(blob) {
  return new Promise((resolve, reject) => {
    if (!blob) return resolve('')
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(blob)
  })
}

/**
 * Sube una fotografía o Blob a /api/v1/storage/upload retornando el id_doc numérico
 * @param {Blob|File} blob 
 * @param {Object} meta 
 * @returns {Promise<number>}
 */
export async function subirFotoAStorage(blob, meta = {}) {
  if (!blob) return null

  // Si ya es un id_doc numérico
  if (typeof blob === 'number') return blob
  if (typeof blob === 'string' && /^\d+$/.test(blob.trim())) return Number(blob.trim())

  const {
    modulo = 'reports',
    tipo_doc = 'FOTO_HOROMETRO',
    name_doc_orig = `foto_${Date.now()}.jpg`,
    tenant_code = 'GSP'
  } = meta

  const app_env = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/pwa-gsp-prod') || 
    window.location.pathname.startsWith('/lg-gsp-prod')
  ) ? 'prod' : 'dev'

  const formData = new FormData()
  formData.append('archivo', blob, name_doc_orig)
  formData.append('tenant_code', tenant_code)
  formData.append('modulo', modulo)
  formData.append('app_env', app_env)
  formData.append('tipo_doc', tipo_doc)
  formData.append('name_doc_orig', name_doc_orig)

  try {
    const res = await api.post('/v1/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    const idDoc = res.data?.data?.id_doc
    if (!idDoc) {
      throw new Error(res.data?.message || 'No se obtuvo id_doc del storage')
    }

    return Number(idDoc)
  } catch (err) {
    console.error(`[PWA Storage Helper] Error al subir archivo (${tipo_doc}):`, err)
    throw err
  }
}

/**
 * Pipeline Integrado: Comprime imagen y la sube al storage devolviendo id_doc
 * @param {File|Blob|string} fileOrDataUrl 
 * @param {Object} meta 
 * @returns {Promise<number|null>}
 */
export async function procesarYSubirFoto(fileOrDataUrl, meta = {}) {
  if (!fileOrDataUrl) return null

  // Si ya es un número o id_doc existente
  if (typeof fileOrDataUrl === 'number') return fileOrDataUrl
  if (typeof fileOrDataUrl === 'string' && /^\d+$/.test(fileOrDataUrl.trim())) {
    return Number(fileOrDataUrl.trim())
  }

  // Si es una URL http externa o ya en storage (/api/v1/storage/view/...)
  if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.includes('/storage/view/')) {
    const match = fileOrDataUrl.match(/\/storage\/view\/(\d+)/)
    if (match) return Number(match[1])
  }

  // Comprimir imagen a JPEG 1024px @ 0.70
  const blob = await comprimirImagenABlob(fileOrDataUrl, meta.maxDimension || 1024, meta.quality || 0.70)
  if (!blob) return null

  // Subir Blob multipart
  const idDoc = await subirFotoAStorage(blob, meta)
  return idDoc
}

export default {
  comprimirImagenABlob,
  blobADataUrl,
  subirFotoAStorage,
  procesarYSubirFoto
}
