<template>
  <v-container class="py-6">
    <v-card variant="outlined" class="main-card">
      <v-card-title class="d-flex flex-wrap align-center ga-3">
        <span class="text-h6">Equipos Moviles</span>
        <v-spacer />
        <v-text-field
          v-model="q"
          density="compact"
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-magnify"
          placeholder="Filtrar por vehiculo o patente"
          style="max-width: 360px"
        />
      </v-card-title>

      <v-card-text class="pa-0">
        <div v-if="smAndDown" class="pa-3">
          <div v-if="loading" class="text-center py-6">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <div v-else-if="!equiposFiltrados.length" class="text-center text-medium-emphasis py-6">
            No hay equipos moviles donde seas creador o responsable.
          </div>

          <v-row v-else>
            <v-col v-for="eq in equiposFiltrados" :key="eq.id_equipo" cols="12">
              <v-card variant="outlined">
                <v-card-title class="d-flex justify-space-between align-center ga-2">
                  <div class="d-flex flex-column">
                    <span class="text-subtitle-1">{{ eq.nombre_vehiculo || '-' }}</span>
                    <span class="text-caption text-medium-emphasis">Responsable: {{ eq.nombre_responsable || '-' }}</span>
                  </div>
                  <v-btn icon variant="text" size="small" @click.stop="toggleExpand(eq.id_equipo)">
                    <v-icon>
                      {{ isExpanded(eq.id_equipo) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                    </v-icon>
                  </v-btn>
                </v-card-title>

                <v-card-text class="pt-0">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <v-chip size="x-small" variant="outlined">Patente: {{ eq.patente || '-' }}</v-chip>
                    <v-chip size="small" variant="tonal" :color="chipColorGlobal(eq.id_equipo)">
                      {{ chipLabelGlobal(eq.id_equipo) }}
                    </v-chip>
                  </div>

                  <div class="d-flex align-center ga-3 mb-3">
                    <v-img
                      :src="getVehiculoQrImage(eq)"
                      width="72"
                      height="72"
                      class="qr-thumb"
                    />
                  </div>

                  <div class="estado-grid">
                    <div class="estado-item">
                      <div class="estado-line">
                        <span class="text-caption text-medium-emphasis">Revision Tecnica</span>
                        <ResumenEstado :doc="getDocSummary(eq.id_equipo, 'Revision Tecnica')" />
                      </div>
                    </div>
                    <div class="estado-item">
                      <div class="estado-line">
                        <span class="text-caption text-medium-emphasis">Permiso Circulacion</span>
                        <ResumenEstado :doc="getDocSummary(eq.id_equipo, 'Permiso de Circulacion')" />
                      </div>
                    </div>
                    <div class="estado-item">
                      <div class="estado-line">
                        <span class="text-caption text-medium-emphasis">Seguro Obligatorio</span>
                        <ResumenEstado :doc="getDocSummary(eq.id_equipo, 'Seguro Obligatorio')" />
                      </div>
                    </div>
                    <div class="estado-item">
                      <div class="estado-line">
                        <span class="text-caption text-medium-emphasis">Cert Gases</span>
                        <ResumenEstado :doc="getDocSummary(eq.id_equipo, 'Certificado de Gases')" />
                      </div>
                    </div>
                    <div class="estado-item">
                      <div class="estado-line">
                        <span class="text-caption text-medium-emphasis">Poliza</span>
                        <ResumenEstado :doc="getDocSummary(eq.id_equipo, 'Poliza')" />
                      </div>
                    </div>
                  </div>

                  <div v-if="isExpanded(eq.id_equipo)" class="mt-4">
                    <v-divider class="mb-3" />
                    <div class="text-subtitle-2 mb-2">Detalle documentos</div>

                    <template v-for="(group, type) in getGroupedDocs(eq.id_equipo)" :key="type">
                      <v-card variant="tonal" class="mb-2">
                        <v-card-title class="text-body-2 font-weight-bold py-2">{{ type }}</v-card-title>
                        <v-card-text class="pt-0">
                          <div v-for="doc in group" :key="doc.id_acreditacion" class="mb-2">
                            <div class="d-flex align-center ga-2 flex-wrap">
                              <v-img
                                v-if="getDocPreviewUrl(doc)"
                                :src="getDocPreviewUrl(doc)"
                                width="32"
                                height="128"
                                cover
                                class="doc-thumb"
                                @click="openImagePreview(doc)"
                              />
                              <span v-else class="text-medium-emphasis text-caption">Sin imagen</span>
                            </div>
                          </div>
                        </v-card-text>
                      </v-card>
                    </template>

                    <div v-if="!Object.keys(getGroupedDocs(eq.id_equipo)).length" class="text-medium-emphasis text-caption">
                      Sin documentos.
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <v-table v-else density="comfortable" fixed-header height="70vh">
          <thead>
            <tr>
              <th style="width: 56px"></th>
              <th>Vehiculo</th>
              <th>Responsable</th>
              <th>Patente</th>
              <th>Revision Tecnica</th>
              <th>Permiso Circulacion</th>
              <th>Seguro Obligatorio</th>
              <th>Cert Gases</th>
              <th>Poliza</th>
              <th>QR</th>
              <th class="text-center">Documentacion</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="eq in equiposFiltrados" :key="eq.id_equipo">
              <tr class="cursor-pointer" @click="toggleExpand(eq.id_equipo)">
                <td class="text-center">
                  <v-btn icon variant="text" size="small">
                    <v-icon>
                      {{ isExpanded(eq.id_equipo) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                    </v-icon>
                  </v-btn>
                </td>
                <td>{{ eq.nombre_vehiculo || '-' }}</td>
                <td>{{ eq.nombre_responsable || '-' }}</td>
                <td>
                  <v-chip size="x-small" variant="outlined">{{ eq.patente || '-' }}</v-chip>
                </td>
                <td><ResumenEstado :doc="getDocSummary(eq.id_equipo, 'Revision Tecnica')" /></td>
                <td><ResumenEstado :doc="getDocSummary(eq.id_equipo, 'Permiso de Circulacion')" /></td>
                <td><ResumenEstado :doc="getDocSummary(eq.id_equipo, 'Seguro Obligatorio')" /></td>
                <td><ResumenEstado :doc="getDocSummary(eq.id_equipo, 'Certificado de Gases')" /></td>
                <td><ResumenEstado :doc="getDocSummary(eq.id_equipo, 'Poliza')" /></td>
                <td>
                  <v-img
                    :src="getVehiculoQrImage(eq)"
                    width="64"
                    height="64"
                    class="qr-thumb"
                  />
                </td>
                <td class="text-center">
                  <v-chip size="small" variant="tonal" :color="chipColorGlobal(eq.id_equipo)">
                    {{ chipLabelGlobal(eq.id_equipo) }}
                  </v-chip>
                </td>
              </tr>

              <tr v-if="isExpanded(eq.id_equipo)" class="bg-grey-lighten-5">
                <td colspan="11" class="pa-4">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="text-subtitle-2">
                      Detalle documentos - {{ eq.patente || ('Equipo #' + eq.id_equipo) }}
                    </div>
                  </div>

                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Imagen</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="(group, type) in getGroupedDocs(eq.id_equipo)" :key="type">
                        <tr class="bg-grey-lighten-4">
                          <td colspan="2" class="font-weight-bold">{{ type }}</td>
                        </tr>
                        <tr v-for="doc in group" :key="doc.id_acreditacion">
                          <td>{{ doc.registro_acreditacion || '-' }}</td>
                          <td>
                            <v-img
                              v-if="getDocPreviewUrl(doc)"
                              :src="getDocPreviewUrl(doc)"
                              width="32"
                              height="128"
                              cover
                              class="doc-thumb"
                              @click="openImagePreview(doc)"
                            />
                            <span v-else class="text-medium-emphasis">Sin imagen</span>
                          </td>
                        </tr>
                      </template>
                      <tr v-if="!Object.keys(getGroupedDocs(eq.id_equipo)).length">
                        <td colspan="2" class="text-center text-medium-emphasis">Sin documentos.</td>
                      </tr>
                    </tbody>
                  </v-table>
                </td>
              </tr>
            </template>

            <tr v-if="!loading && !equiposFiltrados.length">
              <td colspan="11" class="text-center text-medium-emphasis py-6">
                No hay equipos moviles donde seas creador o responsable.
              </td>
            </tr>

            <tr v-if="loading">
              <td colspan="11" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="previewDialog" max-width="900">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-subtitle-1">{{ previewImageName || 'Vista previa' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="previewDialog = false" />
        </v-card-title>
        <v-card-text class="d-flex justify-center">
          <v-img
            v-if="previewImageUrl"
            :src="previewImageUrl"
            max-width="100%"
            max-height="75vh"
            contain
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import apiAxios from '@/services/api'
import { useUserDetailStore } from '@/store/userDetail'

/* eslint-disable */

const userDetailStore = useUserDetailStore()

const q = ref('')
const loading = ref(false)
const showOnlyLatest = ref(true)
const { smAndDown } = useDisplay()

const equipos = ref([])
const docsResumen = ref([])
const docsDetail = ref({})
const expanded = ref([])
const docMetaById = ref({})
const previewDialog = ref(false)
const previewImageUrl = ref('')
const previewImageName = ref('')

const idUser = computed(() => userDetailStore.userDetail?.id_user ?? null)
const API_BASE = (process.env.VUE_APP_API_BASE_URL || '').replace(/\/$/, '')
const WEB_BASE_URL = (
  process.env.VUE_APP_BASE_URL ||
  process.env.VITE_APP_BASE_URL ||
  'https://servidor.leanglobal.cl/pwa-transmac-dev/' ||
  `${window.location.origin}${window.location.pathname}`
).replace(/\/$/, '')

const docTypes = [
  'Revision Tecnica',
  'Permiso de Circulacion',
  'Seguro Obligatorio',
  'Certificado de Gases',
  'Poliza'
]

onMounted(async () => {
  await fetchData()
})

function normalizeText(v) {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function toNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

async function fetchData() {
  loading.value = true
  try {
    const [equiposRes, movilesRes, resumenRes] = await Promise.all([
      apiAxios.get('/tequ-equipos'),
      apiAxios.get('/servicio/leanglobal/obtenerEquiposMoviles'),
      apiAxios.get('/servicio/leanglobal/obtenerDocumentacionResumen')
    ])

    const equiposRaw = Array.isArray(equiposRes?.data?.data) ? equiposRes.data.data : []
    const movilesRaw = Array.isArray(movilesRes?.data) ? movilesRes.data : []
    docsResumen.value = Array.isArray(resumenRes?.data) ? resumenRes.data : []

    const movilesMap = new Map(movilesRaw.map(m => [Number(m.id_equipo), m]))

    const rows = equiposRaw
      .filter((e) => normalizeText(e?.tipo_equipo).includes('equipo movil') || normalizeText(e?.elemento).includes('equipo movil'))
      .map((e) => {
        const idEquipo = Number(e.id_equipo)
        const m = movilesMap.get(idEquipo) || {}
        const responsableId = toNum(m.id_usuario_asignado ?? e?.json_data?.id_usuario_asignado)
        return {
          id_equipo: idEquipo,
          nombre_vehiculo: m?.json_data?.nombre || m?.elemento || e?.json_data?.nombre || '',
          patente: m?.patente || m?.json_data?.patente || e?.json_data?.patente || e?.numero_serie || '',
          nombre_responsable: m?.nombre || '',
          id_usuario_asignado: responsableId,
          id_usuario_creacion: toNum(e?.id_usuario_creacion)
        }
      })

    const userId = toNum(idUser.value)
    equipos.value = rows
      .filter((r) => {
        if (!userId) return false
        return r.id_usuario_creacion === userId || r.id_usuario_asignado === userId
      })
      .sort((a, b) => a.id_equipo - b.id_equipo)

    console.log('[EquiposMoviles] Lista vehiculos en pantalla:', equipos.value)
  } catch (error) {
    console.error('Error cargando equipos moviles:', error)
    equipos.value = []
    docsResumen.value = []
  } finally {
    loading.value = false
  }
}

const equiposFiltrados = computed(() => {
  const s = normalizeText(q.value)
  if (!s) return equipos.value

  return equipos.value.filter((e) => {
    const txt = [e.nombre_vehiculo, e.patente, e.nombre_responsable, e.id_equipo].map(normalizeText).join(' ')
    return txt.includes(s)
  })
})

function toggleExpand(idEquipo) {
  if (expanded.value.includes(idEquipo)) {
    expanded.value = expanded.value.filter((x) => x !== idEquipo)
    return
  }

  expanded.value.push(idEquipo)
  fetchDocsDetail(idEquipo)
}

function isExpanded(idEquipo) {
  return expanded.value.includes(idEquipo)
}

async function fetchDocsDetail(idEquipo) {
  if (docsDetail.value[idEquipo]) return
  try {
    const { data } = await apiAxios.get(`/tequ-documentacion/${idEquipo}`)
    docsDetail.value[idEquipo] = Array.isArray(data?.data) ? data.data : []
    await hydrateDocMeta(docsDetail.value[idEquipo])
  } catch (error) {
    console.error(`Error cargando detalle docs equipo ${idEquipo}:`, error)
    docsDetail.value[idEquipo] = []
  }
}

function getDocId(doc) {
  return Number(doc?.json_data?.id_doc || 0) || null
}

function isImageFile(name) {
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(String(name || ''))
}

async function hydrateDocMeta(docs) {
  const ids = [...new Set((docs || []).map(getDocId).filter(Boolean))]
  const missing = ids.filter(id => !docMetaById.value[id])
  if (!missing.length) return

  await Promise.all(
    missing.map(async (id) => {
      try {
        const { data } = await apiAxios.get(`/servicio/leanglobal/obtenerTFMGFile?id_doc=${id}`)
        const row = Array.isArray(data) ? data[0] : data
        if (row) {
          docMetaById.value[id] = row
        }
      } catch (error) {
        console.warn(`No se pudo obtener metadata de id_doc ${id}`)
      }
    })
  )
}

function getDocPreviewUrl(doc) {
  const idDoc = getDocId(doc)
  if (!idDoc) return ''

  const meta = docMetaById.value[idDoc]
  const nameOrig = meta?.name_doc_orig || doc?.json_data?.name_doc_orig || doc?.name_doc_orig
  const nameInterno = meta?.name_doc_interno

  if (!isImageFile(nameOrig) || !nameInterno || !API_BASE) return ''
  return `${API_BASE}/archivo/transmac/${nameInterno}`
}

function openImagePreview(doc) {
  const url = getDocPreviewUrl(doc)
  if (!url) return

  const idDoc = getDocId(doc)
  const meta = docMetaById.value[idDoc] || {}
  previewImageUrl.value = url
  previewImageName.value = meta?.name_doc_orig || doc?.json_data?.name_doc_orig || 'Imagen'
  previewDialog.value = true
}

function getVehiculoUrl(eq) {
  const id = Number(eq?.id_equipo || 0)
  return `${WEB_BASE_URL}/vehiculos?id=${id}`
}

function getVehiculoQrImage(eq) {
  const data = encodeURIComponent(getVehiculoUrl(eq))
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${data}`
}

function formatDate(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('es-CL')
}

function getDocsForEquipo(idEquipo) {
  const detail = docsDetail.value[idEquipo]
  const docs = Array.isArray(detail) ? detail : docsResumen.value.filter((d) => Number(d.id_equipo) === Number(idEquipo))
  return [...docs].sort((a, b) => Number(b.id_acreditacion || 0) - Number(a.id_acreditacion || 0))
}

function getGroupedDocs(idEquipo) {
  const groups = {}
  for (const doc of getDocsForEquipo(idEquipo)) {
    const type = doc?.registro_acreditacion || 'Otros'
    if (!groups[type]) groups[type] = []
    groups[type].push(doc)
  }

  if (showOnlyLatest.value) {
    for (const k of Object.keys(groups)) {
      groups[k] = groups[k].slice(0, 1)
    }
  }

  return groups
}

function getDocSummary(idEquipo, tipo) {
  const tipoNorm = normalizeText(tipo)
  const docs = docsResumen.value
    .filter((d) => Number(d.id_equipo) === Number(idEquipo) && normalizeText(d.registro_acreditacion) === tipoNorm)
    .sort((a, b) => Number(b.id_acreditacion || 0) - Number(a.id_acreditacion || 0))
  return docs[0] || null
}

function getEstadoText(fechaVence) {
  if (!fechaVence) return 'NA'
  const hoy = new Date()
  const venc = new Date(fechaVence)
  if (Number.isNaN(venc.getTime())) return 'NA'

  const diffMs = venc.getTime() - hoy.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'VENCIDO'
  if (diffDays <= 30) return 'POR VENCER'
  return 'VIGENTE'
}

function getEstadoColor(fechaVence) {
  const status = getEstadoText(fechaVence)
  if (status === 'VENCIDO') return 'error'
  if (status === 'POR VENCER') return 'warning'
  if (status === 'VIGENTE') return 'success'
  return 'grey'
}

function chipColorGlobal(idEquipo) {
  const docs = docsResumen.value.filter((d) => Number(d.id_equipo) === Number(idEquipo))

  let hasAlert = false
  let hasWarning = false

  for (const type of docTypes) {
    const doc = docs
      .filter((d) => normalizeText(d.registro_acreditacion) === normalizeText(type))
      .sort((a, b) => Number(b.id_acreditacion || 0) - Number(a.id_acreditacion || 0))[0]

    if (!doc) return 'grey'

    const st = getEstadoText(doc.fecha_prox_calibracion)
    if (st === 'VENCIDO') hasAlert = true
    if (st === 'POR VENCER') hasWarning = true
  }

  if (hasAlert) return 'error'
  if (hasWarning) return 'warning'
  return 'success'
}

function chipLabelGlobal(idEquipo) {
  const c = chipColorGlobal(idEquipo)
  if (c === 'error') return 'Revisar'
  if (c === 'warning') return 'Atencion'
  if (c === 'grey') return 'Incompleto'
  return 'Completo'
}

const ResumenEstado = defineComponent({
  props: {
    doc: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    return () => {
      if (!props.doc) {
        return h('span', { class: 'text-medium-emphasis text-caption' }, 'NA')
      }

      const status = getEstadoText(props.doc.fecha_prox_calibracion)
      const colorClass =
        status === 'VIGENTE'
          ? 'text-success'
          : status === 'POR VENCER'
            ? 'text-warning'
            : status === 'VENCIDO'
              ? 'text-error'
              : 'text-medium-emphasis'

      return h('div', { class: 'd-flex align-center flex-wrap' }, [
        h('span', { class: `text-caption font-weight-bold ${colorClass}` }, status),
        h(
          'span',
          { class: 'text-caption text-medium-emphasis', style: 'margin-left: 8px; white-space: nowrap;' },
          formatDate(props.doc.fecha_prox_calibracion)
        )
      ])
    }
  }
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.estado-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.estado-item {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 8px;
}

.estado-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: nowrap;
}

.doc-thumb {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  cursor: pointer;
}

.qr-thumb {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
}

.main-card {
  border-color: #e2e8f0 !important;
}

</style>
