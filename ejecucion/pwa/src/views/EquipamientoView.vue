<template>
  <v-container class="py-6">
    <v-card class="sakai-table-card" variant="outlined" elevation="0">
      <v-card-title class="d-flex flex-wrap align-center ga-3">
        <span class="text-h6">Equipamiento</span>
        <v-spacer />
        <v-text-field
          v-model="q"
          density="compact"
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-magnify"
          placeholder="Filtrar por marca, serie, tipo o usuario"
          style="max-width: 360px"
        />
      </v-card-title>

      <v-card-text class="pa-0">
        <div v-if="smAndDown" class="pa-3">
          <div v-if="loading" class="text-center py-6">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <div v-else-if="!filteredItems.length" class="text-center text-medium-emphasis py-6">
            No hay registros disponibles.
          </div>

          <v-row v-else>
            <v-col v-for="item in filteredItems" :key="item.id_equipo" cols="12">
              <v-card variant="outlined">
                <v-card-title class="d-flex justify-space-between align-center ga-2">
                  <div class="d-flex flex-column">
                    <span class="text-subtitle-2 font-weight-bold">{{ item.marca || '-' }}</span>
                    <span class="text-caption text-medium-emphasis">Serie: {{ item.serie || '-' }}</span>
                  </div>
                  <v-btn icon variant="text" size="small" @click.stop="toggleExpand(item)">
                    <v-icon>{{ isExpanded(item) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </v-btn>
                </v-card-title>

                <v-card-text class="pt-0">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption text-medium-emphasis">Tipo: {{ item.tipo || '-' }}</span>
                    <v-chip size="x-small" :color="getDisplayEstadoColor(item)" class="font-weight-bold text-white" variant="flat">
                      {{ getDisplayEstado(item) }}
                    </v-chip>
                  </div>

                  <div class="text-caption mb-1">Presion: {{ getDisplayPresion(item) }}</div>
                  <div class="text-caption mb-1">F. Registro: {{ item.fechaRegistro }}</div>
                  <div class="text-caption mb-1">Ult. Calib: {{ getDisplayUltCalib(item) }}</div>
                  <div class="text-caption mb-1">Prox. Calib: {{ getDisplayProxCalib(item) }}</div>
                  <div class="text-caption mb-1">Usuario: {{ getDisplayUsuario(item) }}</div>
                  <div class="text-caption">Certificaciones: {{ getCertCount(item) }}</div>
                  <div class="d-flex align-center ga-3 mt-2">
                    <v-img
                      :src="getEquipamientoQrImage(item)"
                      width="72"
                      height="72"
                      class="qr-thumb"
                    />
                  </div>

                  <div v-if="isExpanded(item)" class="mt-3">
                    <v-divider class="mb-2" />
                    <div class="text-subtitle-2 mb-2">Historial</div>

                    <v-table density="compact" class="bg-transparent text-caption" v-if="!loadingCerts[item.id_equipo]">
                      <thead>
                        <tr>
                          <th class="text-left">Fecha Calibracion</th>
                          <th class="text-left">Prox. Calib</th>
                          <th class="text-left">Presion</th>
                          <th class="text-left">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(hist, hIdx) in getHistory(item)" :key="hIdx">
                          <td>{{ getCertDate(hist.fecha_ult_calibracion) }}</td>
                          <td>{{ getCertDate(hist.fecha_prox_calibracion) }}</td>
                          <td>{{ hist.json_data?.presion || '-' }}</td>
                          <td>
                            <v-chip size="x-small" :color="getCalibrationStatusColor(hist.fecha_prox_calibracion)" class="font-weight-bold text-white" variant="flat">
                              {{ getCalibrationStateLabel(hist.fecha_prox_calibracion) }}
                            </v-chip>
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <v-table v-else class="tabla-manometro text-caption" density="comfortable" hover>
          <thead>
            <tr>
              <th class="text-left" style="width: 50px"></th>
              <th class="text-left">Marca</th>
              <th class="text-left">Serie</th>
              <th class="text-left">Tipo</th>
              <th class="text-left">Estado</th>
              <th class="text-left">Presion</th>
              <th class="text-left">F. Registro</th>
              <th class="text-left">Ult. Calib</th>
              <th class="text-left">Prox. Calib</th>
              <th class="text-left">Usuario</th>
              <th class="text-left">QR</th>
              <th class="text-center">Cant.</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="item in filteredItems" :key="item.id_equipo">
              <tr class="row-hover cursor-pointer" @click="toggleExpand(item)">
                <td class="text-center">
                  <v-btn icon variant="text" size="small" :color="isExpanded(item) ? 'primary' : 'medium-emphasis'">
                    <v-icon>{{ isExpanded(item) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
                  </v-btn>
                </td>

                <td class="text-body-2 font-weight-bold">{{ item.marca }}</td>
                <td class="text-body-2">
                  <v-chip size="x-small" variant="outlined" class="bg-grey-lighten-5">{{ item.serie }}</v-chip>
                </td>
                <td class="text-caption">{{ item.tipo }}</td>
                <td class="text-caption">
                  <v-chip size="x-small" :color="getDisplayEstadoColor(item)" class="font-weight-bold text-white" variant="flat">
                    {{ getDisplayEstado(item) }}
                  </v-chip>
                </td>
                <td class="text-body-2">{{ getDisplayPresion(item) }}</td>
                <td class="text-body-2 text-medium-emphasis">{{ item.fechaRegistro }}</td>
                <td class="text-body-2 text-medium-emphasis">{{ getDisplayUltCalib(item) }}</td>
                <td class="text-body-2 text-medium-emphasis">{{ getDisplayProxCalib(item) }}</td>
                <td class="text-caption">{{ getDisplayUsuario(item) }}</td>
                <td>
                  <v-img
                    :src="getEquipamientoQrImage(item)"
                    width="64"
                    height="64"
                    class="qr-thumb"
                  />
                </td>
                <td class="text-center text-caption">{{ getCertCount(item) }}</td>
              </tr>

              <tr v-if="isExpanded(item)" class="bg-grey-lighten-5">
                <td colspan="12" class="pa-4">
                  <div class="px-4 py-3 border rounded-lg bg-white elevation-1">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="primary" class="mr-2" size="20">mdi-history</v-icon>
                      <span class="text-subtitle-2 font-weight-bold text-medium-emphasis">
                        Historial de Certificaciones:
                        <span class="text-primary">{{ item.marca }} {{ item.serie }}</span>
                      </span>
                    </div>

                    <v-table density="compact" class="bg-transparent text-caption" v-if="!loadingCerts[item.id_equipo]">
                      <thead>
                        <tr>
                          <th class="text-left">Fecha Calibracion</th>
                          <th class="text-left">Prox. Calib</th>
                          <th class="text-left">Presion</th>
                          <th class="text-left">Estado</th>
                          <th class="text-left">Certificado</th>
                          <th class="text-left">Responsable</th>
                          <th class="text-center">Fotos</th>
                          <th class="text-center">Documentos</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(hist, hIdx) in getHistory(item)" :key="hIdx">
                          <td>{{ getCertDate(hist.fecha_ult_calibracion) }}</td>
                          <td>{{ getCertDate(hist.fecha_prox_calibracion) }}</td>
                          <td>{{ hist.json_data?.presion || '-' }}</td>
                          <td>
                            <v-chip size="x-small" :color="getCalibrationStatusColor(hist.fecha_prox_calibracion)" class="font-weight-bold text-white" variant="flat">
                              {{ getCalibrationStateLabel(hist.fecha_prox_calibracion) }}
                            </v-chip>
                          </td>
                          <td>{{ hist.registro_acreditacion || '-' }}</td>
                          <td>{{ getUserName(hist.id_usuario_responsable) }}</td>

                          <td class="text-center">
                            <div v-if="getParsedDocs(hist.fotografias).length > 0" class="d-flex flex-wrap justify-center ga-2">
                              <template v-for="(photo, idx) in getParsedDocs(hist.fotografias)" :key="idx">
                                <v-avatar size="32" class="cursor-pointer" style="border: 1px solid #e2e8f0" color="grey-lighten-4" @click="verFotoGrande(photo)">
                                  <v-img :src="getFileUrl(photo)" cover />
                                </v-avatar>
                              </template>
                            </div>
                            <span v-else class="text-grey">-</span>
                          </td>

                          <td class="text-center">
                            <div v-if="getParsedDocs(hist.documentos_adjuntos).length > 0" class="d-flex flex-wrap justify-center ga-1">
                              <v-btn
                                v-for="(doc, idx) in getParsedDocs(hist.documentos_adjuntos)"
                                :key="idx"
                                icon="mdi-file-document-outline"
                                size="small"
                                density="compact"
                                variant="text"
                                color="primary"
                                :href="getFileUrl(doc)"
                                target="_blank"
                                title="Descargar Documento"
                              />
                            </div>
                            <span v-else class="text-grey">-</span>
                          </td>
                        </tr>

                        <tr v-if="getHistory(item).length === 0">
                          <td colspan="8" class="text-center text-grey py-4">No hay certificaciones registradas</td>
                        </tr>
                      </tbody>
                    </v-table>

                    <div v-else class="d-flex justify-center pa-4">
                      <v-progress-circular indeterminate color="primary" size="24" />
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="!loading && !filteredItems.length">
              <td colspan="12" class="text-center text-grey py-8">
                <div class="d-flex flex-column align-center">
                  <v-icon size="40" color="grey-lighten-2" class="mb-2">mdi-database-off</v-icon>
                  <div>No hay registros disponibles</div>
                </div>
              </td>
            </tr>

            <tr v-if="loading">
              <td colspan="12" class="text-center py-8">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-dialog v-model="dialogFoto" max-width="800">
        <v-card class="bg-black">
          <v-card-title class="d-flex justify-end pa-2">
            <v-btn icon="mdi-close" variant="text" color="white" @click="dialogFoto = false" />
          </v-card-title>
          <v-img :src="fotoUrl" contain max-height="80vh" />
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDisplay } from 'vuetify'
import apiAxios from '@/services/api'
import { useUserDetailStore } from '@/store/userDetail'

const loading = ref(false)
const equipos = ref([])
const certificationsMap = ref({})
const usersMap = ref({})
const usersCatalog = ref([])
const loadingCerts = ref({})
const q = ref('')
const expanded = ref([])
const dialogFoto = ref(false)
const fotoUrl = ref('')

const API_BASE = (process.env.VUE_APP_API_BASE_URL || '').replace(/\/$/, '')
const { smAndDown } = useDisplay()
const userDetailStore = useUserDetailStore()
const idUser = computed(() => {
  const n = Number(userDetailStore.userDetail?.id_user)
  return Number.isFinite(n) ? n : null
})
const currentUserTokens = computed(() => {
  const u = userDetailStore.userDetail || {}
  return [
    u?.nombre_user,
    [u?.name_frst, u?.name_sec, u?.apellido_pat, u?.apellido_mat].filter(Boolean).join(' '),
    u?.codi_user,
    u?.email
  ]
    .map(normalizeText)
    .filter(Boolean)
})

const equivalentUserIds = computed(() => {
  const u = userDetailStore.userDetail || {}
  const myId = toNum(idUser.value)
  const identifiers = [
    u?.email,
    u?.codi_user,
    u?.nombre_user,
    [u?.name_frst, u?.name_sec, u?.apellido_pat, u?.apellido_mat].filter(Boolean).join(' ')
  ]
    .map(normalizeText)
    .filter(Boolean)

  const out = new Set()
  if (myId) out.add(myId)

  for (const user of usersCatalog.value || []) {
    const uid = toNum(user?.id_user)
    if (!uid) continue
    const userTokens = [
      user?.email,
      user?.codi_user,
      user?.nombre_user,
      [user?.name_frst, user?.name_sond, user?.name_sec, user?.apellido_pat, user?.apellido_mat].filter(Boolean).join(' ')
    ]
      .map(normalizeText)
      .filter(Boolean)

    const match = userTokens.some((ut) => identifiers.includes(ut))
    if (match) out.add(uid)
  }

  return out
})
const WEB_BASE_URL = (
  process.env.VUE_APP_BASE_URL ||
  process.env.VITE_APP_BASE_URL ||
  `${window.location.origin}${window.location.pathname}`
).replace(/\/$/, '')

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function toNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function buildUserTokens(allowedIds) {
  const tokens = [...currentUserTokens.value]
  for (const uid of allowedIds || []) {
    const mappedName = normalizeText(usersMap.value?.[uid] || '')
    if (mappedName) tokens.push(mappedName)
  }
  return tokens
}

function matchItemByOwnerBase(item, allowedIds, tokens) {
  const matchById =
    allowedIds.has(toNum(item?.id_usuario_asignado)) ||
    allowedIds.has(toNum(item?.id_usuario_creacion)) ||
    allowedIds.has(toNum(item?.id_usuario_responsable))
  if (matchById) return true

  const nombrePool = [item?.nombre_responsable]
    .map(normalizeText)
    .filter(Boolean)
    .join(' ')
  if (!nombrePool || !tokens.length) return false
  return tokens.some((t) => t && nombrePool.includes(t))
}

const equiposScope = computed(() => {
  // fetchEquipos ya filtra por id_usuario_responsable del usuario objetivo.
  // Aqui no volvemos a aplicar filtro por owner para no ocultar resultados validos.
  return equipos.value
})

const filteredItems = computed(() => {
  return equiposScope.value
    .filter((item) => {
      const s = normalizeText(q.value)
      if (!s) return true
      const txt = [
        item.marca,
        item.serie,
        item.tipo,
        getDisplayUsuario(item),
        item.id_equipo
      ]
        .map(normalizeText)
        .join(' ')
      return txt.includes(s)
    })
    .sort((a, b) => (b.id_equipo || 0) - (a.id_equipo || 0))
})

onMounted(async () => {
  await Promise.all([fetchUsers(), fetchEquipos()])
  await loadAllCerts()
})

async function fetchUsers() {
  try {
    const response = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
    const rows = Array.isArray(response?.data) ? response.data : []
    usersCatalog.value = rows
    rows.forEach((u) => {
      usersMap.value[u.id_user] = `${u.name_frst || ''} ${u.apellido_pat || ''}`.trim() || `Usuario ${u.id_user}`
    })
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

async function fetchEquipos() {
  loading.value = true
  try {
    const response = await apiAxios.get('/servicio/leanglobal/obtenerEquipoAcreditacion')
    console.log('[EquipamientoView] Response /obtenerEquipoAcreditacion:', response?.data)

    const equiposRaw = Array.isArray(response?.data?.data)
      ? response.data.data
      : (Array.isArray(response?.data) ? response.data : [])
    const currentUserId = toNum(idUser.value)

    const rows = equiposRaw
      .filter((e) => {
        const tipo = normalizeText(e?.tipo_equipo || e?.elemento || '')
        const notMobile = !(tipo.includes('equipo movil') || tipo.includes('vehiculo'))
        if (!notMobile) return false
        if (!currentUserId) return false
        return toNum(e?.id_usuario_responsable) === currentUserId
      })
      .map((e) => {
        const idEquipo = Number(e.id_equipo)
        const marca = e?.marca || e?.json_data?.marca || '-'
        const serie = e?.numero_serie || e?.json_data?.serie || '-'
        const tipo = e?.tipo_equipo || e?.elemento || '-'
        const fechaRegistroIso = e?.fecha_registro ? String(e.fecha_registro).slice(0, 10) : ''

        return {
          id_equipo: idEquipo,
          marca,
          serie,
          tipo,
          presion: e?.json_data?.presion ?? 'NA',
          fechaRegistroIso,
          fechaRegistro: fechaRegistroIso ? getCertDate(fechaRegistroIso) : '-',
          nombre_responsable: usersMap.value?.[toNum(e?.id_usuario_responsable)] || e?.json_data?.nombre_responsable || '-',
          id_usuario_asignado: toNum(e?.id_usuario_asignado ?? e?.json_data?.id_usuario_asignado),
          id_usuario_responsable: toNum(e?.id_usuario_responsable ?? e?.json_data?.id_usuario_responsable),
          id_usuario_creacion: toNum(e?.id_usuario_creacion)
        }
      })

    console.log('[EquipamientoView] Rows mapeadas para cards/tabla:', rows)
    equipos.value = rows
    console.log('[EquipamientoView] Equipos renderizados (cards/tabla):', equipos.value)
  } catch (error) {
    console.error('Error al cargar equipos:', error)
    equipos.value = []
  } finally {
    loading.value = false
  }
}

async function loadAllCerts() {
  if (!equipos.value.length) return
  const allowedIds = equivalentUserIds.value
  const tokens = buildUserTokens(allowedIds)
  const preScope = equipos.value.filter((item) => matchItemByOwnerBase(item, allowedIds, tokens))
  const target = preScope.length ? preScope : equipos.value

  for (const item of target) {
    if (item.id_equipo && !certificationsMap.value[item.id_equipo]) {
      fetchCertifications(item.id_equipo).catch((e) => console.error(e))
      await new Promise((r) => setTimeout(r, 40))
    }
  }
}

async function fetchCertifications(equipoId) {
  if (certificationsMap.value[equipoId]) return

  loadingCerts.value[equipoId] = true
  try {
    const response = await apiAxios.get(`/tequ-documentacion/${equipoId}`)
    console.log(`[EquipamientoView] Response /tequ-documentacion/${equipoId}:`, response?.data)
    const certs = response.data?.data || []

    for (const cert of certs) {
      cert.fotografias = await hydrateDocField(cert.fotografias)
      cert.documentos_adjuntos = await hydrateDocField(cert.documentos_adjuntos)
    }

    certificationsMap.value[equipoId] = certs
    console.log(`[EquipamientoView] Certificaciones mapeadas para equipo ${equipoId}:`, certificationsMap.value[equipoId])
  } catch (error) {
    console.error(`Error fetching certs for equipment ${equipoId}:`, error)
    certificationsMap.value[equipoId] = []
  } finally {
    loadingCerts.value[equipoId] = false
  }
}

async function hydrateDocField(fieldValue) {
  if (!fieldValue) return []

  let docs = []
  try {
    docs = typeof fieldValue === 'string' ? JSON.parse(fieldValue) : fieldValue
  } catch {
    return []
  }

  if (!Array.isArray(docs)) return []

  return Promise.all(
    docs.map(async (doc) => {
      if (doc.name_doc_interno) return doc

      if (doc.id || doc.id_doc) {
        try {
          const id = doc.id || doc.id_doc
          const res = await apiAxios.get(`/archivo/id/${id}`)
          if (res.data?.data) {
            return {
              ...doc,
              name_doc_interno: res.data.data.name_doc_interno
            }
          }
          return doc
        } catch {
          return doc
        }
      }

      return doc
    })
  )
}

function toggleExpand(item) {
  const id = Number(item?.id_equipo)
  if (!id) return

  if (expanded.value.includes(id)) {
    expanded.value = expanded.value.filter((i) => i !== id)
  } else {
    expanded.value.push(id)
    fetchCertifications(id)
  }
}

function isExpanded(item) {
  const id = Number(item?.id_equipo)
  return id ? expanded.value.includes(id) : false
}

function getUserName(userId) {
  if (!userId) return '-'
  return usersMap.value[userId] || `Usuario ${userId}`
}

function getCertDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('es-CL')
}

function getCalibrationStatusColor(dateStr) {
  if (!dateStr) return 'grey'

  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'red'
  if (diffDays <= 14) return 'amber'
  return 'green'
}

function getCalibrationStateLabel(dateStr) {
  if (!dateStr) return 'NA'
  const color = getCalibrationStatusColor(dateStr)
  if (color === 'red') return 'Vencido'
  if (color === 'amber') return 'Por Vencer'
  return 'Vigente'
}

function getLatestHistoryData(item) {
  const certs = certificationsMap.value[item.id_equipo]
  if (!certs || !certs.length) return null
  return [...certs].sort((a, b) => (b.id_acreditacion || 0) - (a.id_acreditacion || 0))[0]
}

function getDisplayPresion(item) {
  const last = getLatestHistoryData(item)
  if (last?.json_data?.presion) return last.json_data.presion
  return item.presion || 'NA'
}

function getDisplayEstado(item) {
  const last = getLatestHistoryData(item)
  if (last?.fecha_prox_calibracion) return getCalibrationStateLabel(last.fecha_prox_calibracion)
  return 'NA'
}

function getDisplayEstadoColor(item) {
  const last = getLatestHistoryData(item)
  if (last?.fecha_prox_calibracion) return getCalibrationStatusColor(last.fecha_prox_calibracion)
  return 'grey'
}

function getDisplayUsuario(item) {
  const last = getLatestHistoryData(item)
  if (last?.id_usuario_responsable) return getUserName(last.id_usuario_responsable)
  if (item.id_usuario_asignado) return getUserName(item.id_usuario_asignado)
  if (item.id_usuario_creacion) return getUserName(item.id_usuario_creacion)
  return item.nombre_responsable || '-'
}

function getDisplayUltCalib(item) {
  const last = getLatestHistoryData(item)
  if (last?.fecha_ult_calibracion) return getCertDate(last.fecha_ult_calibracion)
  return '-'
}

function getDisplayProxCalib(item) {
  const last = getLatestHistoryData(item)
  if (last?.fecha_prox_calibracion) return getCertDate(last.fecha_prox_calibracion)
  return '-'
}

function getCertCount(item) {
  const list = certificationsMap.value[item.id_equipo]
  return list ? list.length : 0
}

function getParsedDocs(docs) {
  if (!docs) return []
  if (Array.isArray(docs)) return docs
  try {
    const parsed = JSON.parse(docs)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getHistory(item) {
  const list = certificationsMap.value[item.id_equipo] || []
  return [...list].sort((a, b) => (b.id_acreditacion || 0) - (a.id_acreditacion || 0))
}

function getFileUrl(doc) {
  if (!doc || !API_BASE) return '#'
  const filename = typeof doc === 'string' ? doc : doc.name_doc_interno || doc.filename || doc.file
  if (!filename) return '#'
  return `${API_BASE}/archivo/transmac/${filename}`
}

function getEquipamientoUrl(item) {
  const id = Number(item?.id_equipo || 0)
  return `${WEB_BASE_URL}/equipamiento?id=${id}`
}

function getEquipamientoQrImage(item) {
  const data = encodeURIComponent(getEquipamientoUrl(item))
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${data}`
}

function verFotoGrande(doc) {
  const url = getFileUrl(doc)
  if (!url || url === '#') return
  fotoUrl.value = url
  dialogFoto.value = true
}
</script>

<style scoped>
.sakai-table-card {
  border-color: #e2e8f0;
  border-radius: 12px;
  background-color: white;
}

.tabla-manometro :deep(thead th) {
  background: #f8fafc;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  height: 52px;
  border-bottom: 2px solid #e2e8f0;
}

.tabla-manometro :deep(tbody td) {
  height: 54px;
  border-bottom: 1px solid #f1f5f9;
}

.tabla-manometro :deep(tbody tr.row-hover:hover) {
  background-color: #f8fafc !important;
}

.cursor-pointer {
  cursor: pointer;
}

.qr-thumb {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
}
</style>
