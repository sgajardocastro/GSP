// controllers/notificaciones.controller.js
const crypto = require('crypto')

// 🔧 Estado en memoria (arranca con tus valores actuales)
const estado = {
  counts: { calidad: 3, documentos: 0, enrolamiento: 2, medioAmbiente: 7 },
  updatedAt: new Date(),
  version: 1,
}
const categorias = Object.keys(estado.counts)

// 🧮 ETag (cambia cuando cambian los datos)
function calcETag() {
  const payload = JSON.stringify(estado.counts) + '|' + estado.version
  return `W/"${crypto.createHash('sha1').update(payload).digest('hex')}"` // weak ETag ok
}
let currentETag = calcETag()

// ⏱️ Simulación: +1 a una categoría al azar cada 5 minutos
if (process.env.SIMULAR_NOTIFICACIONES !== 'false') {
  setInterval(() => {
    const k = categorias[Math.floor(Math.random() * categorias.length)]
    estado.counts[k] += 1
    estado.version += 1
    estado.updatedAt = new Date()
    currentETag = calcETag()
    console.log(`[notificaciones] +1 en ${k} ->`, estado.counts[k])
  }, 5 * 60 * 1000)
}

module.exports = {
  // GET /api/notificaciones
  getNotificaciones: async (req, res) => {
    try {
      const ifNoneMatch = req.headers['if-none-match']
      const ifModifiedSince = req.headers['if-modified-since']
      const lastModHttp = estado.updatedAt.toUTCString()

      // Cache control y validadores
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('ETag', currentETag)
      res.setHeader('Last-Modified', lastModHttp)

      const notModifiedByEtag = ifNoneMatch && ifNoneMatch === currentETag
      const notModifiedByDate =
        ifModifiedSince && new Date(ifModifiedSince) >= estado.updatedAt

      if (notModifiedByEtag || notModifiedByDate) {
        return res.status(304).end()
      }

      return res.json({
        counts: estado.counts,
        version: estado.version,
        updatedAt: estado.updatedAt.toISOString(),
      })
    } catch (err) {
      console.error('getNotificaciones error', err)
      res.status(500).json({ error: 'Error al obtener notificaciones' })
    }
  },

  // POST /api/notificaciones/tick  (opcional, para pruebas)
  tick: (req, res) => {
    const k = categorias[Math.floor(Math.random() * categorias.length)]
    estado.counts[k] += 1
    estado.version += 1
    estado.updatedAt = new Date()
    currentETag = calcETag()
    res.json({ ok: true, incremented: k, counts: estado.counts })
  },
}
