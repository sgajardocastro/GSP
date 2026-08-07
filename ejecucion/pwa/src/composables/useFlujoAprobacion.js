// src/composables/useFlujoAprobacion.js
import { ref } from 'vue'
import apiAxios from '@/services/api'
import { DateTime } from 'luxon'
import { useUserDetailStore } from '@/store/userDetail'

/* eslint-disable */

export function useFlujoAprobacion() {
  const local = ref({ lat: null, lng: null })


  function normalizeBodyExec(bodyExec) {
    // Si viene string, úsalo como JSON "real"
    if (typeof bodyExec === 'string') {
      const t = bodyExec.trim()
      if (!t) return 'null'
      JSON.parse(t)      // valida que sea JSON real
      return t
    }

    // Si viene objeto/array
    return JSON.stringify(bodyExec ?? null)
  }

  async function obtenerUbicacion() {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            local.value.lat = pos.coords.latitude
            local.value.lng = pos.coords.longitude
            console.log('✅ Coordenadas obtenidas (flujo):', local.value)
            resolve()
          },
          (err) => {
            console.error('❌ Error al obtener ubicación (flujo):', err.message)
            local.value.lat = ''
            local.value.lng = ''
            resolve()
          }
        )
      } else {
        console.warn('⚠️ Geolocalización no soportada (flujo).')
        local.value.lat = ''
        local.value.lng = ''
        resolve()
      }
    })
  }

  async function exportarInspeccion(idInspeccion) {
    const userDetailStore = useUserDetailStore()

    const formData = new FormData()
    formData.append('idInspeccion', idInspeccion)
    formData.append('tipo_doc', 'DOCUMENTO')
    formData.append('mimetype', 'application/pdf')
    formData.append('name_doc_orig', '')
    formData.append('name_doc_interno', '')
    formData.append('tenant_code', 'transmac')
    formData.append('modulo', 'inspecciones')
    formData.append('id_user', userDetailStore.userDetail.id_user)
    formData.append('estado', '1')

    const { data } = await apiAxios.post(
      '/exportar/generar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    console.log('✅ Exportación exitosa (flujo):', data)
    return data
  }

  /**
   * Termina el survey (VERIFICACION) + exporta PDF.
   * Se basa SIEMPRE en lo que devuelve procesosSurveyDetail (como InspeccionBHP).
   *
   * @param {number|string} idSurvey
   */
  async function terminarSurveyYExportar(idSurvey) {
    // 1) Traer el survey desde el backend (igual que getSurvey de Inspeccion)
    const { data } = await apiAxios.get(
      `/servicio/leanglobal/procesosSurveyDetail?id_survey=${idSurvey}`
    )

    const survey = data?.[0] ?? {}
    console.log('🧾 Survey para flujo:', survey)

    // 2) Ubicación
    await obtenerUbicacion()

    // 3) Fecha local CL
    const localCL = DateTime
      .fromISO(DateTime.now().toISO())
      .setZone('America/Santiago')
      .toSQL({ includeOffset: false })

    const formData = new FormData()
    formData.append('estado_srv', 'VERIFICACION')
    formData.append('body_exec', JSON.stringify(survey.body_exec))
    formData.append('fecha_real_ini', localCL)
    formData.append('fecha_ejec_fin', localCL)
    formData.append('latitud', local.value.lat || '')
    formData.append('longitud', local.value.lng || '')

    console.log('FD flujo:', Array.from(formData.entries()))

    console.log('body_exec tipo:', typeof survey.body_exec)
    console.log('body_exec preview:', String(survey.body_exec).slice(0, 120))

    // 4) Actualizar estado + fechas
    const resp = await apiAxios.put(
      `/survey/UpdFechaEjecFin/${idSurvey}`,
      formData
    )

    console.log('✅ Survey actualizado en flujo:', resp.data)

    // 5) Exportar PDF
    await exportarInspeccion(idSurvey)
  }

  return {
    terminarSurveyYExportar,
  }
}
