<template>
  <div>
    <v-alert type="info" variant="tonal" density="compact" class="mb-2">
      Puedes agregar uno o más eventos usando el botón <strong>+</strong>.
    </v-alert>

    <div v-if="!rows.length" class="text-center mb-3">
      <v-btn color="primary" variant="tonal" @click="add()">
        <v-icon class="mr-2" icon="mdi-plus" />
        Agregar primer evento
      </v-btn>
    </div>

    <div v-for="(it, idx) in rows" :key="'evt-' + idx" class="mb-4">
      <v-card variant="outlined" class="rounded-lg">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="text-subtitle-2 font-weight-bold">
            {{ tituloEvento(it, idx) }}
          </div>

          <v-btn icon size="x-small" @click="remove(idx)" color="red" title="Eliminar evento">
            <v-icon icon="mdi-delete-outline" />
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-0">
          <v-table density="compact" class="tabla-evt">
            <tbody>
              <!-- Comentario inicial -->
              <tr>
                <td class="campo-col">
                  <div class="field-block pt-2">
                    <v-textarea
                      v-model="it.comentarioInicial"
                      label="Comentario inicial:"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="bg-white"
                      auto-grow
                      rows="2"
                      @update:model-value="touch()"
                    />
                  </div>
                </td>
              </tr>

              <!-- Hora -->
              <tr>
                <td class="campo-col">
                  <div class="field-block pt-2">
                    <v-text-field
                      v-model="it.hora"
                      label="Hora:"
                      type="time"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="bg-white"
                      @update:model-value="touch()"
                    />
                  </div>
                </td>
              </tr>

              <!-- Geoloc -->
              <tr>
                <td class="campo-col">
                  <div class="geo-wrap">
                    <div class="geo-title">Geolocalización (sistema)</div>

                    <div class="geo-grid">
                      <div class="geo-item">
                        <div class="geo-label">Lat</div>
                        <div class="geo-value">{{ fmtNum(it.geo?.lat) }}</div>
                      </div>

                      <div class="geo-item">
                        <div class="geo-label">Lng</div>
                        <div class="geo-value">{{ fmtNum(it.geo?.lng) }}</div>
                      </div>

                      <div class="geo-item">
                        <div class="geo-label">Precisión</div>
                        <div class="geo-value">
                          {{ it.geo?.accuracy ? `${Math.round(it.geo.accuracy)} m` : '—' }}
                        </div>
                      </div>
                    </div>

                    <div class="d-flex align-center gap-2 mt-2">
                      <v-btn
                        size="small"
                        variant="tonal"
                        @click="capturarGeo(idx)"
                        :loading="geoLoadingIndex === idx"
                        :disabled="!canGeo"
                      >
                        <v-icon start icon="mdi-crosshairs-gps" />
                        Actualizar ubicación
                      </v-btn>

                      <v-chip v-if="!canGeo" size="small" color="grey" variant="tonal">
                        Geoloc no disponible
                      </v-chip>

                      <v-chip v-if="it.geo?.ts" size="small" color="blue" variant="tonal">
                        {{ new Date(it.geo.ts).toLocaleString() }}
                      </v-chip>
                    </div>

                    <div v-if="it.geoError" class="geo-error">
                      {{ it.geoError }}
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Fotos -->
              <tr>
                <td class="campo-col">
                  <div class="photo-block">
                    <div class="photo-title">Fotos (máx. {{ maxFotos }})</div>

                    <FotoCapture
                      :max-fotos="maxFotos"
                      :obligatorio-fotos="0"
                      :compression="compression"
                      v-model:galeria="it.galeria"
                      v-model:observacion="it.fotoObs"
                      @update:galeria="touch()"
                      @update:observacion="touch()"
                    />
                  </div>
                </td>
              </tr>

              <!-- Observaciones -->
              <tr>
                <td class="campo-col">
                  <div class="field-block pt-2">
                    <v-textarea
                      v-model="it.observaciones"
                      label="Observaciones:"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="bg-white"
                      auto-grow
                      rows="2"
                      @update:model-value="touch()"
                    />
                  </div>
                </td>
              </tr>

              <!-- ✅ Adjuntar documentos (MISMO PATRÓN QUE TU EJEMPLO) -->
              <tr>
                <td class="campo-col">
                  <div class="docs-wrap">
                    <div class="docs-title">Adjuntar documentos (máx. {{ maxDocs }})</div>

                    <!-- input oculto -->
                    <v-file-input
                      :ref="(el) => setFileInputRef(idx, el)"
                      accept="*/*"
                      label="Seleccionar archivos"
                      prepend-icon="mdi-paperclip"
                      @change="(e) => onFileChange(idx, e)"
                      show-size
                      outlined
                      multiple
                      hide-details
                      class="flex-grow-1 d-none"
                    />

                    <v-btn
                      icon
                      variant="tonal"
                      @click="triggerInput(idx)"
                      :disabled="(it.documentos?.length || 0) >= maxDocs"
                      :loading="uploadingIndex === idx"
                      title="Adjuntar documentos"
                    >
                      <v-icon>mdi-paperclip</v-icon>
                    </v-btn>

                    <v-list v-if="it.documentos?.length" class="mt-3 docs-list">
                      <v-list-item
                        v-for="(archivo, aidx) in it.documentos"
                        :key="'evt-doc-' + idx + '-' + aidx"
                      >
                        <div class="d-flex align-center justify-space-between">
                          <div class="flex-grow-1">
                            <a :href="archivo.url" target="_blank" rel="noopener noreferrer">
                              {{ archivo.nombre || archivo.name }}
                            </a>

                            <div v-if="archivo.name_doc_orig" class="text-caption text-grey">
                              {{ archivo.name_doc_orig }}
                            </div>
                          </div>

                          <v-btn
                            icon
                            size="small"
                            color="red"
                            variant="text"
                            @click="removeArchivo(idx, aidx)"
                            title="Quitar"
                          >
                            <v-icon>mdi-close</v-icon>
                          </v-btn>
                        </div>
                      </v-list-item>
                    </v-list>

                    <!-- opcional: comentario docs por evento -->
                    <v-textarea
                      v-model="it.docsObs"
                      label="Comentario documentos (opcional)"
                      auto-grow
                      variant="outlined"
                      class="mt-3 bg-white"
                      density="compact"
                      hide-details
                      @update:model-value="touch()"
                    />
                  </div>
                </td>
              </tr>

              <!-- + -->
              <tr>
                <td class="campo-col text-center">
                  <v-btn icon size="x-small" color="green" @click="add()" title="Agregar nuevo evento">
                    <v-icon icon="mdi-plus" />
                  </v-btn>
                </td>
              </tr>

            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable vue/no-mutating-props */
import { computed, watch, ref } from 'vue'
import apiAxios from '@/services/api'
import FotoCapture from '@/components/FotoCapture.vue'

// ✅ Base URL como tu ejemplo
const API_BASE =
  (import.meta?.env?.VITE_API_BASE_URL ||
   import.meta?.env?.VUE_APP_API_BASE_URL ||
   process?.env?.VUE_APP_API_BASE_URL ||
   '')
  .replace(/\/$/, '')

const props = defineProps({
  attr: { type: Object, required: true }
})

watch(
  () => props.attr,
  (a) => {
    if (!a) return
    if (!Array.isArray(a.body)) a.body = []
  },
  { immediate: true, deep: false }
)

const rows = computed(() => (Array.isArray(props.attr?.body) ? props.attr.body : []))

const compression = computed(() => {
  const c = Number(props.attr?.compression ?? 0.25)
  return Number.isFinite(c) ? c : 0.25
})

const maxFotos = computed(() => {
  const n = Number(props.attr?.maxFotos ?? 3)
  return Number.isFinite(n) && n > 0 ? n : 3
})

const maxDocs = computed(() => {
  const n = Number(props.attr?.maxDocs ?? 5)
  return Number.isFinite(n) && n > 0 ? n : 5
})

// ====== GEO ======
const canGeo = computed(() => typeof navigator !== 'undefined' && !!navigator.geolocation)
const geoLoadingIndex = ref(-1)

function nowHHMM () {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function blankRow () {
  return {
    comentarioInicial: '',
    hora: nowHHMM(),
    geo: null,
    geoError: '',
    galeria: [],
    fotoObs: '',
    observaciones: '',

    // ✅ documentos por evento (como tu ejemplo)
    documentos: [], // [{url,nombre,name_doc_orig,id_doc,...}]
    docsObs: '',

    // interno (no se persiste)
    __fileInput: null
  }
}

async function add () {
  if (!Array.isArray(props.attr.body)) props.attr.body = []
  props.attr.body.push(blankRow())
  touch()

  // intenta geoloc al crear
  const idx = props.attr.body.length - 1
  if (canGeo.value) await capturarGeo(idx)
}

function remove (idx) {
  if (!Array.isArray(props.attr.body)) props.attr.body = []
  props.attr.body.splice(idx, 1)
  touch()
}

function touch () {
  props.attr.__touched = Date.now()
}

function tituloEvento (it, idx) {
  const h = it?.hora ? ` (${it.hora})` : ''
  return `Evento ${idx + 1}${h}`
}

function capturarGeo (idx) {
  return new Promise((resolve) => {
    if (!canGeo.value) return resolve(false)
    geoLoadingIndex.value = idx

    const row = rows.value[idx]
    if (!row) {
      geoLoadingIndex.value = -1
      return resolve(false)
    }

    row.geoError = ''
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        row.geo = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          ts: Date.now()
        }
        touch()
        geoLoadingIndex.value = -1
        resolve(true)
      },
      (err) => {
        row.geoError = err?.message || 'No se pudo obtener la ubicación'
        touch()
        geoLoadingIndex.value = -1
        resolve(false)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  })
}

// ====== DOCS (MISMO PATRÓN) ======
const fileInputs = ref({}) // { [idx]: componentRef }
const uploadingIndex = ref(-1)

function setFileInputRef (idx, el) {
  if (!el) return
  fileInputs.value[idx] = el
}

function triggerInput (idx) {
  const comp = fileInputs.value[idx]
  comp?.$el?.querySelector('input')?.click()
}

async function onFileChange (idx, event) {
  const row = rows.value[idx]
  if (!row) return

  const files = event?.target?.files
  if (!files || !files.length) return

  if (!Array.isArray(row.documentos)) row.documentos = []

  uploadingIndex.value = idx

  try {
    for (const file of files) {
      if (row.documentos.length >= maxDocs.value) break

      const deviceUploadedAt = new Date().toISOString()

      const dataArchivo = await uploadFile(file)
      if (!dataArchivo?.archivo) continue

      const interno = dataArchivo.archivo.name_doc_interno || ''
      const url = interno ? `${API_BASE}/archivo/transmac/${interno}` : ''

      const serverUploadedAt = dataArchivo.server_uploaded_at || null

      const uploadedDate = serverUploadedAt
        ? String(serverUploadedAt).slice(0, 10)
        : deviceUploadedAt.slice(0, 10)

      const nuevoObjeto = {
        name: file.name,
        name_doc_orig: dataArchivo.archivo.name_doc_orig || file.name,
        nombre: dataArchivo.archivo.name_doc_interno || file.name,
        url,

        mimetype: file.type,
        size: file.size,
        id_doc: dataArchivo.archivo.id_doc ?? dataArchivo.archivo.id_archivo ?? null,

        device_uploaded_at: deviceUploadedAt,
        server_uploaded_at: serverUploadedAt,
        uploaded_date: uploadedDate
      }

      row.documentos.push(nuevoObjeto)
      touch()
    }
  } finally {
    uploadingIndex.value = -1
    event.target.value = ''
  }
}

function removeArchivo (idx, archivoIndex) {
  const row = rows.value[idx]
  if (!row) return
  if (!Array.isArray(row.documentos)) row.documentos = []
  row.documentos.splice(archivoIndex, 1)
  touch()
}

async function uploadFile (file) {
  const formData = new FormData()
  formData.append('archivo', file)

  // mismos campos que tu ejemplo
  formData.append('tipo_doc', 'DOCUMENTO')
  formData.append('mimetype', file.type || 'application/octet-stream')
  formData.append('name_doc_orig', file.name)
  formData.append('name_doc_interno', '')
  formData.append('path_doc', '/u05/LeanDocs/transmac')

  // ⚠️ ojo: ideal tomarlo de tu sesión/store, pero lo dejo igual a tu ejemplo
  formData.append('id_user', 1)
  formData.append('estado', '1')

  try {
    const response = await apiAxios.post('/archivo/imagen', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  } catch (error) {
    console.error('Error al subir archivo:', error)
    return null
  }
}

// ====== FORMAT ======
function fmtNum (n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  return x.toFixed(6)
}
</script>

<style scoped>
.tabla-evt {
  border: 1px solid #d7dde3;
}
.tabla-evt td {
  border-bottom: 1px solid #e3e7eb;
  vertical-align: top;
  padding: 12px;
}
.campo-col {
  background: #ffffff;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.photo-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.photo-title {
  font-weight: 700;
  color: #1f2937;
}

.geo-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.geo-title {
  font-weight: 700;
  color: #1f2937;
}
.geo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.geo-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
}
.geo-label {
  font-size: 12px;
  color: #6b7280;
}
.geo-value {
  font-weight: 700;
  color: #111827;
  font-size: 13px;
  margin-top: 2px;
}
.geo-error {
  color: #b91c1c;
  font-size: 12px;
}

.docs-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.docs-title {
  font-weight: 700;
  color: #1f2937;
}
.docs-list {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
</style>
