<template>
  <div class="checklist-camioneta">
    <v-expansion-panels v-model="openSections" multiple class="cl-panels">
      <v-expansion-panel value="datos" class="cl-card">
        <v-expansion-panel-title class="cl-title">
          DATOS GENERALES
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense>
            <v-col
              v-for="field in datosFields"
              :key="field.key"
              cols="12"
              sm="6"
            >
              <v-text-field
                :model-value="getDato(field.key)"
                :type="field.type || 'text'"
                :label="field.label"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato(field.key, value)"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="fotos" class="cl-card">
        <v-expansion-panel-title class="cl-title">
          FOTOS CAMIONETA
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="photo-grid">
            <div
              v-for="slot in photoSlots"
              :key="slot.key"
              class="photo-slot"
            >
              <div class="photo-slot__head">
                <div class="photo-slot__title">{{ slot.label }}</div>
                <div class="photo-slot__actions">
                  <button
                    type="button"
                    class="photo-action"
                    :disabled="disabled"
                    @click="triggerPhotoInput(slot.key, 'camera')"
                  >
                    <v-icon icon="mdi-camera" size="16" />
                  </button>
                  <button
                    type="button"
                    class="photo-action"
                    :disabled="disabled"
                    @click="triggerPhotoInput(slot.key, 'gallery')"
                  >
                    <v-icon icon="mdi-image" size="16" />
                  </button>
                  <button
                    v-if="fotoSrc(slot.key)"
                    type="button"
                    class="photo-action photo-action--danger"
                    :disabled="disabled"
                    @click="removePhoto(slot.key)"
                  >
                    <v-icon icon="mdi-close" size="16" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                class="photo-preview"
                :disabled="!fotoSrc(slot.key)"
                @click="openPreview(fotoSrc(slot.key))"
              >
                <img
                  v-if="fotoSrc(slot.key)"
                  :src="fotoSrc(slot.key)"
                  :alt="slot.label"
                  class="photo-preview__img"
                />
                <span v-else class="photo-placeholder">
                  <v-icon icon="mdi-car-side" size="28" />
                  <span>{{ slot.placeholder }}</span>
                </span>
              </button>

              <input
                :ref="(el) => setPhotoInputRef(slot.key, 'camera', el)"
                type="file"
                accept="image/*"
                capture="environment"
                class="photo-input"
                @change="(event) => onPhotoFileChange(event, slot.key)"
              />
              <input
                :ref="(el) => setPhotoInputRef(slot.key, 'gallery', el)"
                type="file"
                accept="image/*"
                class="photo-input"
                @change="(event) => onPhotoFileChange(event, slot.key)"
              />
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel
        v-for="section in sections"
        :key="section.key"
        :value="section.key"
        class="cl-card"
      >
        <v-expansion-panel-title class="cl-title">
          {{ section.title }}
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="item-list">
            <div
              v-for="item in getSectionItems(section.key)"
              :key="item.key"
              class="item-card"
            >
              <div class="item-card__content">
                <div class="check-item">{{ item.label }}</div>
              </div>

              <div class="state-row">
                <div class="state-buttons">
                  <button
                    type="button"
                    :class="['state-toggle', item.estado === 'si' ? 'state-toggle--si' : '']"
                    :disabled="disabled"
                    @click="setEstado(item, 'si')"
                  >
                    SI
                  </button>
                  <button
                    type="button"
                    :class="['state-toggle', item.estado === 'no' ? 'state-toggle--no' : '']"
                    :disabled="disabled"
                    @click="setEstado(item, 'no')"
                  >
                    NO
                  </button>
                </div>
              </div>

              <div class="observation-field">
                <v-text-field
                  :model-value="item.observacion"
                  label="Observacion"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  @update:model-value="(value) => setObservacion(item, value)"
                />
              </div>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="cierre" class="cl-card">
        <v-expansion-panel-title class="cl-title">
          CIERRE
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense>
            <v-col
              v-for="field in cierreFields"
              :key="field.key"
              cols="12"
              sm="6"
            >
              <v-text-field
                :model-value="getCierre(field.key)"
                :type="field.type || 'text'"
                :label="field.label"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setCierre(field.key, value)"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                :model-value="attrRef.observacionesDetectadas"
                label="Que observaciones detecto"
                variant="outlined"
                density="compact"
                rows="3"
                auto-grow
                hide-details
                :disabled="disabled"
                @update:model-value="setObservacionesDetectadas"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-dialog v-model="previewOpen" max-width="820">
      <v-card class="preview-card">
        <v-card-actions class="justify-end py-2">
          <v-btn icon="mdi-close" variant="text" @click="previewOpen = false" />
        </v-card-actions>
        <v-card-text class="pt-0">
          <v-img :src="previewSrc" max-height="70vh" contain class="rounded" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, toRef } from 'vue'
import apiAxios from '@/services/api'

const API_BASE = (process.env.VUE_APP_API_BASE_URL || '').replace(/\/$/, '')

const props = defineProps({
  attr: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['change'])
const attrRef = toRef(props, 'attr')

const datosFields = [
  { key: 'nombreConductor', label: 'Nombre conductor' },
  { key: 'kilometros', label: 'Kilometros', type: 'number' },
  { key: 'patente', label: 'Patente' },
  { key: 'fecha', label: 'Fecha', type: 'date' }
]

const cierreFields = [
  { key: 'obra', label: 'Obra' },
  { key: 'realizadoPor', label: 'Realizado por' },
  { key: 'fecha', label: 'Fecha', type: 'date' },
  { key: 'firmaRealiza', label: 'Firma quien realiza' },
  { key: 'tomaConocimiento', label: 'Toma conocimiento' }
]

const photoSlots = [
  { key: 'frontal', label: 'Frontal', placeholder: 'Foto frontal' },
  { key: 'trasera', label: 'Trasera', placeholder: 'Foto trasera' },
  { key: 'lateralIzquierda', label: 'Lateral izquierda', placeholder: 'Foto lateral izquierda' },
  { key: 'lateralDerecha', label: 'Lateral derecha', placeholder: 'Foto lateral derecha' }
]

const sections = [
  {
    key: 'documentacionEquipo',
    title: '1. CHEQUEO DE DOCUMENTACION DEL EQUIPO',
    items: [
      'Permiso de circulacion al dia',
      'Seguro obligatorio al dia',
      'Certificado de revision tecnica',
      'Certificado de gases',
      'Existe programa de mantencion de equipo (ver registro)'
    ]
  },
  {
    key: 'condicionesVehiculo',
    title: '2. VERIFICACION DE LAS CONDICIONES DEL VEHICULO',
    items: [
      'Frenos de estacionamiento',
      'Bocina',
      'Direccion',
      'Alarma de retroceso',
      'Luces altas',
      'Luces bajas',
      'Luces de freno',
      'Luces de retroceso',
      'Luces intermitentes',
      'Luces de estacionamiento',
      'Espejos laterales',
      'Condiciones del tablero indicador',
      'Velocimetro',
      'Espejo retrovisor',
      'Parabrisas',
      'Balizas'
    ]
  },
  {
    key: 'equiposEmergencia',
    title: '3. EQUIPOS DE EMERGENCIA',
    items: [
      'Triangulos',
      'Extintor',
      'Botiquin',
      'Neumatico de repuesto',
      'Llave de rueda',
      'Gata hidraulica',
      'Luces auxiliares',
      'Pertiga',
      'Baliza',
      'Cunas de estacionamiento'
    ]
  },
  {
    key: 'documentacionConductor',
    title: '4. CHEQUEO DE DOCUMENTACION DE CONDUCTOR Y/O OPERADOR',
    items: [
      'Licencia de conducir municipal al dia',
      'Licencia interna al dia',
      'Pase empresa mandante',
      'Sensor de sueno'
    ]
  },
  {
    key: 'revision',
    title: '5. REVISION',
    items: [
      'Nivel de aceite del motor',
      'Estado del motor',
      'Nivel de liquido de freno',
      'Nivel de combustible',
      'Condiciones de los neumaticos',
      'Caja de cambio',
      'Radiador',
      'Filtro de aire',
      'Filtro de aceite',
      'Filtro de combustible',
      'Tercera luz de freno',
      'Barra antivuelco',
      'Limpieza interior',
      'Estado general carroceria',
      'Cinturon de seguridad',
      'Sanitizacion COVID-19',
      'Otros',
      'Otros'
    ]
  }
]

const openSections = ref(['datos', 'fotos', ...sections.map((section) => section.key), 'cierre'])
const photoInputs = ref({})
const previewOpen = ref(false)
const previewSrc = ref('')

onMounted(() => {
  ensureBody()
})

function toKey(label, index) {
  return `${index + 1}-${label}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeEstado(value) {
  const v = String(value ?? '').trim().toLowerCase()
  return ['si', 'no'].includes(v) ? v : ''
}

function normalizeDate(value) {
  const raw = String(value ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const match = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  return raw
}

function ensureBody() {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') attrRef.value.datos = {}
  if (!attrRef.value.cierre || typeof attrRef.value.cierre !== 'object') attrRef.value.cierre = {}
  if (!attrRef.value.fotos || typeof attrRef.value.fotos !== 'object' || Array.isArray(attrRef.value.fotos)) {
    attrRef.value.fotos = {}
  }
  if (!attrRef.value.secciones || typeof attrRef.value.secciones !== 'object' || Array.isArray(attrRef.value.secciones)) {
    attrRef.value.secciones = {}
  }
  if (typeof attrRef.value.observacionesDetectadas !== 'string') attrRef.value.observacionesDetectadas = ''

  photoSlots.forEach((slot) => {
    const current = attrRef.value.fotos[slot.key]
    attrRef.value.fotos[slot.key] = {
      label: slot.label,
      galeria: Array.isArray(current?.galeria) ? current.galeria.slice(0, 1) : []
    }
  })

  sections.forEach((section) => {
    const saved = Array.isArray(attrRef.value.secciones[section.key]) ? attrRef.value.secciones[section.key] : []
    attrRef.value.secciones[section.key] = section.items.map((label, index) => {
      const key = toKey(label, index)
      const current = saved.find((item) => item?.key === key || item?.label === label) || {}
      return {
        key,
        label,
        estado: normalizeEstado(current.estado),
        observacion: String(current.observacion ?? current.observaciones ?? '')
      }
    })
  })
}

function getDato(key) {
  return attrRef.value.datos?.[key] ?? ''
}

function setDato(key, value) {
  attrRef.value.datos ||= {}
  attrRef.value.datos[key] = key === 'fecha' ? normalizeDate(value) : value
  touch()
}

function getCierre(key) {
  return attrRef.value.cierre?.[key] ?? ''
}

function setCierre(key, value) {
  attrRef.value.cierre ||= {}
  attrRef.value.cierre[key] = key === 'fecha' ? normalizeDate(value) : value
  touch()
}

function getSectionItems(sectionKey) {
  return Array.isArray(attrRef.value.secciones?.[sectionKey]) ? attrRef.value.secciones[sectionKey] : []
}

function getFotoSlot(slotKey) {
  if (!attrRef.value.fotos || typeof attrRef.value.fotos !== 'object') attrRef.value.fotos = {}
  if (!attrRef.value.fotos[slotKey]) {
    const slot = photoSlots.find((s) => s.key === slotKey)
    attrRef.value.fotos[slotKey] = { label: slot?.label || slotKey, galeria: [] }
  }
  if (!Array.isArray(attrRef.value.fotos[slotKey].galeria)) attrRef.value.fotos[slotKey].galeria = []
  return attrRef.value.fotos[slotKey]
}

function fotoSrc(slotKey) {
  const foto = getFotoSlot(slotKey).galeria[0]
  return foto?.url || foto?.base64 || ''
}

function setPhotoInputRef(slotKey, source, el) {
  if (!photoInputs.value[slotKey]) photoInputs.value[slotKey] = {}
  photoInputs.value[slotKey][source] = el
}

function triggerPhotoInput(slotKey, source) {
  if (props.disabled) return
  photoInputs.value?.[slotKey]?.[source]?.click()
}

async function onPhotoFileChange(event, slotKey) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || !file.type.startsWith('image/')) return

  try {
    const compressedDataUrl = await compressImage(file)
    const dataArchivo = await uploadFileFromBase64(compressedDataUrl, file.name, file.type)
    const nuevoObjeto = {
      base64: '',
      url: dataArchivo?.archivo?.name_doc_interno
        ? `${API_BASE}/archivo/transmac/${dataArchivo.archivo.name_doc_interno}`
        : compressedDataUrl,
      nombre: dataArchivo?.archivo?.name_doc_interno || file.name
    }
    getFotoSlot(slotKey).galeria = [nuevoObjeto]
    touch()
  } catch {
    return
  }
}

function removePhoto(slotKey) {
  getFotoSlot(slotKey).galeria = []
  touch()
}

function openPreview(src) {
  if (!src) return
  previewSrc.value = src
  previewOpen.value = true
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 1000
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.25))
      }
      img.onerror = reject
      img.src = event.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function base64ToFile(base64, filename, mime) {
  const arr = base64.split(',')
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8 = new Uint8Array(n)
  while (n--) u8[n] = bstr.charCodeAt(n)
  return new File([u8], filename, { type: mime || 'image/jpeg' })
}

async function uploadFileFromBase64(base64Data, originalName, mimeType) {
  const file = base64ToFile(base64Data, originalName, mimeType)
  const formData = new FormData()
  formData.append('archivo', file)
  formData.append('tipo_doc', 'DOCUMENTO')
  formData.append('mimetype', file.type)
  formData.append('name_doc_orig', file.name)
  formData.append('name_doc_interno', '')
  formData.append('path_doc', '/u05/LeanDocs/transmac')
  formData.append('id_user', 1)
  formData.append('estado', '1')

  const response = await apiAxios.post('/archivo/imagen', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

function setEstado(item, estado) {
  item.estado = item.estado === estado ? '' : estado
  touch()
}

function setObservacion(item, value) {
  item.observacion = value
  touch()
}

function setObservacionesDetectadas(value) {
  attrRef.value.observacionesDetectadas = value
  touch()
}

function touch() {
  attrRef.value.__touched = Date.now()
  emit('change')
}
</script>

<style scoped>
.checklist-camioneta {
  width: 100%;
}

.cl-panels {
  display: grid;
  gap: 10px;
}

.cl-card {
  width: 100%;
  max-width: none !important;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.52) !important;
}

.cl-title {
  min-height: 46px;
  padding: 10px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: 0;
  white-space: normal;
}

.cl-card :deep(.v-expansion-panel-text__wrapper) {
  padding: 10px !important;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.photo-slot {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.2);
}

.photo-slot__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.photo-slot__title {
  min-width: 0;
  color: #e5eefb;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.15;
}

.photo-slot__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
}

.photo-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  background: rgba(71, 85, 105, 0.36);
  color: #dbeafe;
}

.photo-action:disabled {
  opacity: 0.55;
}

.photo-action--danger {
  border-color: rgba(239, 68, 68, 0.65);
  background: rgba(127, 29, 29, 0.42);
  color: #fee2e2;
}

.photo-preview {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.56);
  color: #cbd5e1;
}

.photo-preview:disabled {
  cursor: default;
}

.photo-preview__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 6px;
  height: 100%;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
}

.photo-input {
  display: none;
}

.item-list {
  display: grid;
  gap: 10px;
}

.item-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.2);
}

.item-card__content {
  display: grid;
  gap: 4px;
}

.check-item {
  color: #e5eefb;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
}

.state-row {
  display: flex;
  justify-content: flex-start;
}

.state-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
}

.state-toggle {
  min-width: 0;
  min-height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  background: rgba(71, 85, 105, 0.36);
  color: #dbeafe;
  font-size: 11px;
  font-weight: 900;
}

.observation-field {
  width: 100%;
}

.observation-field :deep(.v-field),
.checklist-camioneta :deep(.v-field) {
  background: rgba(2, 6, 23, 0.56) !important;
  border-radius: 8px;
}

.observation-field :deep(.v-field__outline),
.checklist-camioneta :deep(.v-field__outline) {
  color: rgba(148, 163, 184, 0.48) !important;
}

.observation-field :deep(.v-label),
.observation-field :deep(.v-field__input),
.observation-field :deep(input),
.checklist-camioneta :deep(.v-label),
.checklist-camioneta :deep(.v-field__input),
.checklist-camioneta :deep(input),
.checklist-camioneta :deep(textarea) {
  color: #e5eefb !important;
  opacity: 1 !important;
}

.state-toggle:disabled {
  opacity: 0.55;
}

.state-toggle--si {
  background: rgba(6, 95, 70, 0.5);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.state-toggle--no {
  background: rgba(127, 29, 29, 0.42);
  border-color: rgba(239, 68, 68, 0.65);
  color: #fee2e2;
}

@media (min-width: 760px) {
  .item-card {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .item-card__content {
    grid-column: 1;
  }

  .state-row {
    grid-column: 2;
    grid-row: 1;
    justify-content: flex-end;
  }

  .state-buttons {
    width: 180px;
  }

  .observation-field {
    grid-column: 1 / -1;
  }
}

@media (max-width: 520px) {
  .photo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
