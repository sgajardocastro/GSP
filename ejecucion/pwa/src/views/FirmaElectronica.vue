<!-- FirmaElectronica.vue -->
<template>
  <v-container>
    <!-- TABS -->
    <v-row dense class="mb-2">
      <v-col cols="12">
        <v-tabs v-model="tab" grow>
          <v-tab value="firmas">Firmas</v-tab>
          <v-tab value="cierres">Cierre Docs. Colectivos</v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- CONTENIDO DE LOS TABS -->
    <v-window v-model="tab">
      <!-- TAB FIRMAS -->
      <v-window-item value="firmas">
        <v-row dense style="padding: 10px;">
          <v-col
            cols="12"
            md="4"
            xl="3"
            v-for="survey in flujosDocumentos"
            :key="survey.id_survey"
          >
            <v-card
              class="mx-auto sombra-resaltada"
              :subtitle="`${survey.name_empresa_cliente} / ${survey.nombre_proyecto}`"
              :title="`${survey.desc_template_srv}: ${survey.name_template_srv}`"
            >
              <template #append>
                <v-icon
                  v-if="hasNotif(survey.id_survey)"
                  color="red-darken-2"
                  icon="mdi-bell-ring"
                  size="30"
                />
              </template>

              <v-chip
                :color="getEstadoColor(survey.estado_srv).color"
                label
                size="large"
                class="ml-2 text-white"
                variant="flat"
              >
                {{ getEstadoColor(survey.estado_srv).texto }}
              </v-chip>

              <v-card-text>
                <div class="d-flex justify-space-between">
                  <!-- Texto izquierdo -->
                  <div>
                    {{ `${survey.name_area} - ${survey.name_tipo_srv}` }}<br>
                    {{ `${survey.codi_template_srv} (Id ${survey.id_survey})` }}<br>
                    Fecha Plan Fin: {{ survey.fecha_plan_ini }}
                  </div>

                  <!-- Acciones derecha: PDF arriba, FIRMAR abajo -->
                  <div class="d-flex flex-column align-end">
                    <!-- Botón PDF pequeño -->
                    <v-btn
                      icon
                      variant="text"
                      color="red-darken-2"
                      @click="abrirPdf(survey)"
                      :disabled="!tieneDocumento(survey) || !isOnline"
                    >
                      <v-icon>mdi-file-pdf-box</v-icon>
                    </v-btn>

                    <!-- Botón FIRMAR morado -->
                    <v-btn
                      color="deep-purple-accent-4"
                      variant="outlined"
                      size="small"
                      class="text-uppercase font-weight-bold"
                      @click="abrirModal(survey, notifPrimaryId(survey.id_survey))"
                    >
                      <v-icon start>mdi-pen</v-icon>
                      {{ textoBotonFirmar(survey) }}
                    </v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- DIALOG DE FIRMA REUTILIZABLE -->
        <FirmaDialog
          v-model="dialogFirma"
          :pdf-url="pdfUrlFirma"
          :detalle-flujo="detalleCrearFirma"
          @firmado="onFirmado"
        />
      </v-window-item>

      <!-- TAB CIERRES -->
      <v-window-item value="cierres">
        <CierreFirmas
          :flujos="flujos"
          @refrescarFlujos="obtenerFlujos"
        />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiAxios from '@/services/api'
import { useUserDetailStore } from '@/store/userDetail'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import CierreFirmas from '@/components/CierreFirmas.vue'
import FirmaDialog from '@/components/FirmaDialog.vue'

/* eslint-disable */

const route = useRoute()
const router = useRouter()

// ✅ Lee id_survey desde URL: ?id_survey=1147  (o ?idInspeccion=1147)
const idSurveyFromUrl = computed(() => {
  const q = route.query.id_survey ?? route.query.idInspeccion ?? null
  const n = Number(q)
  return Number.isFinite(n) && n > 0 ? n : null
})

// ✅ Evita auto-abrir más de una vez
const autoOpenDone = ref(false)

// si cambia el query, permite auto-open de nuevo
watch(idSurveyFromUrl, () => {
  autoOpenDone.value = false
})

const userDetailStore = useUserDetailStore()
const { isOnline } = useNetworkStatus()

// id_user seguro
const idUser = computed(() => userDetailStore.userDetail?.id_user ?? null)

const tab = ref('firmas')

const flujos = ref([])
const flujosDocumentos = ref([])
const notificaciones = ref([])

const dialogFirma = ref(false)
const pdfUrlFirma = ref('')
const detalleCrearFirma = ref(null)

// ✅ Función dedicada para auto-open (más confiable que depender solo del watcher)
async function tryAutoOpenFromUrl () {
  if (autoOpenDone.value) return

  const sid = idSurveyFromUrl.value
  if (!sid) return

  // si aún no hay data, no hacemos nada
  const docs = flujosDocumentos.value || []
  const all  = flujos.value || []
  if (!docs.length && !all.length) return

  // siempre fuerza a tab firmas
  tab.value = 'firmas'

  // 1) primero intenta en flujosDocumentos
  let detalle = docs.find(f => Number(f.id_survey) === Number(sid))

  // 2) si no está, fallback a flujos (por si no está “pendiente”)
  if (!detalle) {
    detalle = all.find(f => Number(f.id_survey) === Number(sid))
  }

  if (!detalle) {
    console.warn('[Firmas] id_survey en URL no encontrado en flujos/flujosDocumentos:', sid)
    return
  }

  abrirModal(detalle, notifPrimaryId(sid))
  await nextTick()
  autoOpenDone.value = true
}

// ✅ Watch: cuando cambien datos relevantes, intenta auto-open
watch(
  [idSurveyFromUrl, flujosDocumentos, flujos, notificaciones, isOnline],
  () => {
    tryAutoOpenFromUrl()
  },
  { immediate: true, flush: 'post' }
)

onMounted(async () => {
  await obtenerFlujos()
  await cargarNotificaciones()
  await tryAutoOpenFromUrl()
})

const obtenerFlujos = async () => {
  if (!idUser.value) {
    console.warn('[Firmas] No hay id_user disponible, no se cargan flujos.')
    return
  }

  try {
    const [respFlujos, respDetalles, respUsuariosRoles] = await Promise.all([
      apiAxios.get(
        '/servicio/leanglobal/flujosAprobacion' +
          '?fecha_desde=' +
          '&fecha_hasta=' +
          '&ts.id_empresa_cliente=' +
          '&ts.id_proyecto='
      ),
      apiAxios.get('/servicio/leanglobal/flujosAprobacionSteps'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles')
    ])

    const flujosData = respFlujos.data.datos || []
    const detallesData = respDetalles.data || []

    if (!Array.isArray(detallesData)) return

    const rolesUsuario = respUsuariosRoles.data
      .filter(ur => String(ur.id_user) === String(idUser.value))
      .map(ur => ur.id_rol)

    const flujosConDetalles = flujosData.map(flujo => ({
      ...flujo,
      detalles: detallesData.filter(det => det.id_flow === flujo.id_flow)
    }))

    // Cargar body_exec de forma paralela para los surveys de SST en VERIFICACION o con Paso 2 pendiente
    const sstFlujosPendientes = flujosConDetalles.filter(f => 
      [70, 80].includes(Number(f.id_template)) &&
      (f.estado_srv === 'VERIFICACION' || f.detalles.some(det => Number(det.flow_tmpl_step_orden) === 2 && ['PENDIENTE', 'VERIFICACION'].includes(det.estado)))
    )

    if (sstFlujosPendientes.length > 0) {
      await Promise.all(
        sstFlujosPendientes.map(async (flujo) => {
          try {
            const { data } = await apiAxios.get(
              `/servicio/leanglobal/procesosSurveyDetail?id_survey=${flujo.id_survey}`
            )
            const s = data?.[0]
            if (s) {
              flujo.body_exec = s.body_exec
            }
          } catch (err) {
            console.warn('Error al cargar body_exec para flujo', flujo.id_survey, err)
          }
        })
      )
    }

    // Inyectar paso virtual si falta el Paso 2 en base de datos para encuestas en VERIFICACION
    for (const flujo of flujosConDetalles) {
      const idTemplate = Number(flujo.id_template)
      if ([70, 80].includes(idTemplate) && flujo.estado_srv === 'VERIFICACION') {
        let superiorId = null
        try {
          const bodyExec = typeof flujo.body_exec === 'string' ? JSON.parse(flujo.body_exec) : (flujo.body_exec || {})
          const segmentos = Array.isArray(bodyExec.segmentos) ? bodyExec.segmentos : []
          
          for (const s of segmentos) {
            const attrs = Array.isArray(s.attributes) ? s.attributes : []
            for (const a of attrs) {
              if (a.type === 'checkListObservacionConductual') {
                superiorId = a.datos?.superiorDerivado
              } else if (a.type === 'condicionesSeguridadTrabajo') {
                superiorId = a.superiorDerivado
              }
              if (superiorId) break
            }
            if (superiorId) break
          }
        } catch (err) {
          console.warn('Error parseando body_exec para paso virtual:', err)
        }

        if (superiorId) {
          const tienePaso2 = flujo.detalles.some(d => Number(d.flow_tmpl_step_orden) === 2)
          if (!tienePaso2) {
            console.log(`[Resiliencia] Inyectando paso virtual de superior (Paso 2) para survey ${flujo.id_survey}`)
            flujo.detalles.push({
              id_flow_stp: null,
              id_flow: flujo.id_flow,
              flow_tmpl_step_orden: 2,
              estado: 'VERIFICACION',
              id_user: Number(superiorId),
              id_rol: 0,
              name_rol: 'Superior Cierre',
              name_doc_interno_in: flujo.id_doc,
              id_doc_in: flujo.id_doc,
              flag_equipo: false
            })
          }
        }
      }
    }

    flujosConDetalles.sort((a, b) => Number(b.id_survey) - Number(a.id_survey))

    flujos.value = flujosConDetalles.filter(f => f.estado_srv !== 'Pre Creado')

    const isStepForCurrentUser = (det) => {
      if (det?.flag_equipo === true) return true
      if (det?.id_user == null) return true
      return Number(det.id_user) === Number(idUser.value)
    }

    const canCurrentUserSign = (det, flujo) => {
      const byEstado = ['PENDIENTE', 'VERIFICACION'].includes(det.estado)
      const isAssignedToMe = det.id_user != null && Number(det.id_user) === Number(idUser.value)
      const byRol = isAssignedToMe || rolesUsuario.includes(det.id_rol) || det.id_rol === 0
      let byUsuario = isStepForCurrentUser(det)

      // Restricción para superior responsable en Paso 2 de SST
      const idTemplate = Number(flujo?.id_template)
      const ordenPaso = Number(det?.flow_tmpl_step_orden)
      if ([70, 80].includes(idTemplate) && ordenPaso === 2) {
        const bodyExec = typeof flujo.body_exec === 'string' ? JSON.parse(flujo.body_exec) : (flujo.body_exec || {})
        const segmentos = Array.isArray(bodyExec.segmentos) ? bodyExec.segmentos : []
        let superiorId = null
        if (idTemplate === 70) {
          const attr = segmentos.flatMap(s => s.attributes || []).find(a => a.type === 'checkListObservacionConductual')
          superiorId = attr?.datos?.superiorDerivado
        } else if (idTemplate === 80) {
          const attr = segmentos.flatMap(s => s.attributes || []).find(a => a.type === 'condicionesSeguridadTrabajo')
          superiorId = attr?.superiorDerivado
        }
        if (superiorId) {
          byUsuario = Number(superiorId) === Number(idUser.value)
        }
      }

      return byEstado && byRol && byUsuario
    }

    flujosDocumentos.value = flujosConDetalles
      .filter(flujo => flujo.detalles.some(det => canCurrentUserSign(det, flujo)))
      .map(flujo => ({
        ...flujo,
        detalles_flujo: [...(flujo.detalles || [])].sort(
          (a, b) =>
            Number(a?.flow_tmpl_step_orden ?? Number.MAX_SAFE_INTEGER) -
            Number(b?.flow_tmpl_step_orden ?? Number.MAX_SAFE_INTEGER)
        ),
        detalles: flujo.detalles.filter(det => canCurrentUserSign(det, flujo))
      }))

    flujosDocumentos.value.sort((a, b) => Number(b.id_survey) - Number(a.id_survey))
  } catch (error) {
    console.error('❌ Error al obtener flujos:', error)
  }
}

async function cargarNotificaciones () {
  if (!idUser.value) return
  try {
    const { data } = await apiAxios.get(
      `/servicio/leanglobal/obtenerNortificaciones?id_user_target=${idUser.value}`
    )
    notificaciones.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('❌ Error al cargar notificaciones:', error)
  }
}

const notifSet = computed(() => {
  const s = new Set()
  for (const n of notificaciones.value) {
    const id = Number(n?.json_data?.id_survey)
    if (!Number.isNaN(id)) s.add(id)
  }
  return s
})

const hasNotif = id => notifSet.value.has(Number(id))

const notifBySurvey = computed(() => {
  const m = new Map()
  for (const n of notificaciones.value) {
    const sid = Number(n?.json_data?.id_survey)
    if (!Number.isNaN(sid)) {
      if (!m.has(sid)) m.set(sid, [])
      m.get(sid).push(n)
    }
  }
  return m
})

const notifPrimaryId = sid => {
  const arr = notifBySurvey.value.get(Number(sid))
  return arr?.[0]?.id_notification ?? null
}

function resolverPasoActualFirma (detalle) {
  const detalles = Array.isArray(detalle?.detalles_flujo)
    ? detalle.detalles_flujo
    : (Array.isArray(detalle?.detalles) ? detalle.detalles : [])

  if (!detalles.length) return null

  const currentUserId = Number(idUser.value)

  const pasoUsuario = detalles.find(det => {
    if (det?.flag_equipo) return false
    const stepUserId = Number(det?.id_user)
    return Number.isFinite(stepUserId) && stepUserId === currentUserId
  })
  if (pasoUsuario) return pasoUsuario

  const pasoEquipo = detalles.find(det => det?.flag_equipo === true)
  if (pasoEquipo) return pasoEquipo

  return detalles[0]
}

function esUltimoFirmanteUsuario (detalle) {
  const pasoActual = resolverPasoActualFirma(detalle)
  const detalles = Array.isArray(detalle?.detalles_flujo)
    ? detalle.detalles_flujo
    : (Array.isArray(detalle?.detalles) ? detalle.detalles : [])

  if (!pasoActual || !detalles.length) return false

  const stepUserId = Number(pasoActual?.id_user)
  const isStepForCurrentUser =
    Number.isFinite(stepUserId) && stepUserId === Number(idUser.value)
  if (!isStepForCurrentUser) return false

  const ordenPasoActual = Number(pasoActual?.flow_tmpl_step_orden)
  if (!Number.isFinite(ordenPasoActual)) return false

  const ordenMaximo = Math.max(
    ...detalles.map(det => Number(det?.flow_tmpl_step_orden || 0))
  )

  return ordenPasoActual === ordenMaximo
}

function textoBotonFirmar (detalle) {
  const idTemplate = Number(detalle.id_template)
  const paso = resolverPasoActualFirma(detalle)
  const ordenPaso = Number(paso?.flow_tmpl_step_orden)

  if ([70, 80].includes(idTemplate) && ordenPaso === 2) {
    return 'Verificar y Cerrar'
  }

  return esUltimoFirmanteUsuario(detalle) ? 'Firmar (Último)' : 'Firmar'
}

function resolverDocumentoFirmas (detalle) {
  const step = detalle.detalles?.[0] || null
  if (!step) return null
  return step.name_doc_interno_in || step.name_doc_interno_out || null
}

function tieneDocumento (detalle) {
  return !!resolverDocumentoFirmas(detalle)
}

const BASE_API = (process.env.VUE_APP_API_BASE_URL || '').replace(/\/$/, '')

function abrirPdf (detalle) {
  const docName = resolverDocumentoFirmas(detalle)
  if (!docName || !isOnline.value) return
  const url = `${BASE_API}/v1/storage/view/${docName}`
  window.open(url, '_blank')
}

async function abrirModal (detalle, notifMeta) {
  const idTemplate = Number(detalle.id_template)
  const paso = resolverPasoActualFirma(detalle)
  const ordenPaso = Number(paso?.flow_tmpl_step_orden)

  // Si es template 70 o 80 y es el paso del superior (orden 2)
  if ([70, 80].includes(idTemplate) && ordenPaso === 2) {
    try {
      const { data } = await apiAxios.get(
        `/servicio/leanglobal/procesosSurveyDetail?id_survey=${detalle.id_survey}`
      )
      const survey = data?.[0]
      if (survey) {
        const bodyExec = typeof survey.body_exec === 'string' ? JSON.parse(survey.body_exec) : (survey.body_exec || {})
        const segmentos = Array.isArray(bodyExec.segmentos) ? bodyExec.segmentos : []
        
        let tieneCierre = false
        if (idTemplate === 70) {
          const attr = segmentos.flatMap(s => s.attributes || []).find(a => a.type === 'checkListObservacionConductual')
          const d = attr?.datos || {}
          tieneCierre = Array.isArray(d.fotosCierre) && d.fotosCierre.length > 0 && String(d.comentariosCierre || '').trim() !== ''
        } else if (idTemplate === 80) {
          const attr = segmentos.flatMap(s => s.attributes || []).find(a => a.type === 'condicionesSeguridadTrabajo')
          tieneCierre = Array.isArray(attr?.fotosCierre) && attr.fotosCierre.length > 0 && String(attr?.comentariosCierre || '').trim() !== ''
        }

        if (!tieneCierre) {
          // Redirigir al superior para que complete la evidencia de cierre en el formulario
          router.push({
            path: '/inspeccion',
            query: { idInspeccion: String(detalle.id_survey) }
          })
          return
        }
      }
    } catch (err) {
      console.error('Error al verificar evidencia de cierre antes de abrir modal:', err)
    }
  }

  // marca notificación DONE si hay internet
  if (notifMeta && isOnline.value) {
    apiAxios.put('/notfqueue/updNotfqueue', {
      id_notifcation: notifMeta,
      estado: 'DONE'
    }).catch(() => {})
  }

  const docName = resolverDocumentoFirmas(detalle)
  const API_BASE_URL = apiAxios.defaults.baseURL || process.env.VUE_APP_API_BASE_URL || ''
  const pdfUrl = docName ? `${API_BASE_URL}/v1/storage/view/${docName}` : ''

  pdfUrlFirma.value = pdfUrl
  detalleCrearFirma.value = detalle
  dialogFirma.value = true
}

function getEstadoColor (estadoSrv) {
  const est = String(estadoSrv || '').trim().toUpperCase();
  switch (est) {
    case 'TERMINADO':
    case 'APROBADO':
      return { color: 'green-darken-2', texto: 'Aprobado' }
    case 'VERIFICACION':
    case 'VERIFICACIÓN':
    case 'VERIFICANDO':
      return { color: 'purple-darken-2', texto: 'En Verificación' }
    case 'EJECUCION':
    case 'EJECUCIÓN':
      return { color: 'blue-darken-2', texto: 'En Ejecución' }
    case 'CREADO':
      return { color: 'amber-darken-2', texto: 'Pendiente' }
    case 'RECHAZADO':
    case 'RECHAZADA':
      return { color: 'red-darken-2', texto: 'Rechazado' }
    case 'PRE CREADO':
    case 'PRE-CREADO':
    case 'PLANIFICADO':
      return { color: 'grey', texto: 'Planificado' }
    default:
      return { color: 'grey', texto: estadoSrv || 'Desconocido' }
  }
}

function onFirmado () {
  obtenerFlujos()
}
</script>

<style scoped>
tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}
.sombra-resaltada {
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3) !important;
  border-radius: 12px;
}
.pdf-btn {
  min-width: auto;
  padding: 0 8px;
  height: 22px;
  font-size: 11px;
  line-height: 1;
}
</style>
