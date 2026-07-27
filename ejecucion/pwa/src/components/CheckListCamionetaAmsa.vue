<template>
  <div class="checklist-camioneta-amsa">
    <v-row dense class="mb-3">
      <v-col v-for="field in headerFields" :key="field.key" cols="12" sm="6">
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

    <section class="section-block">
      <button type="button" class="section-title" @click="toggleSection('fotosCamioneta')">
        <span>Fotos camioneta</span>
        <span class="section-actions">
          <span class="answered-count">{{ getFotosAnswered() }}/{{ photoSlots.length }}</span>
          <v-icon size="18">{{ isOpen('fotosCamioneta') ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </span>
      </button>

      <div v-show="isOpen('fotosCamioneta')" class="section-body">
        <div class="photo-grid">
          <div v-for="slot in photoSlots" :key="slot.key" class="photo-slot">
            <div class="photo-slot__head">
              <div class="photo-slot__title">{{ slot.label }}</div>
              <div class="photo-slot__actions">
                <button type="button" class="photo-action" :disabled="disabled" @click="triggerPhotoInput(slot.key, 'camera')">
                  <v-icon icon="mdi-camera" size="16" />
                </button>
                <button type="button" class="photo-action" :disabled="disabled" @click="triggerPhotoInput(slot.key, 'gallery')">
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

            <button type="button" class="photo-preview" :disabled="!fotoSrc(slot.key)" @click="openPreview(fotoSrc(slot.key))">
              <img v-if="fotoSrc(slot.key)" :src="fotoSrc(slot.key)" :alt="slot.label" class="photo-preview__img" />
              <span v-else class="photo-placeholder">
                <v-icon icon="mdi-car-side" size="28" />
                <span>{{ slot.placeholder }}</span>
              </span>
            </button>

            <v-text-field
              :model-value="getFotoSlot(slot.key).observacion"
              label="Observacion foto"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setPhotoObs(slot.key, value)"
            />

            <input :ref="(el) => setPhotoInputRef(slot.key, 'camera', el)" type="file" accept="image/*" capture="environment" class="photo-input" @change="(event) => onPhotoFileChange(event, slot.key)" />
            <input :ref="(el) => setPhotoInputRef(slot.key, 'gallery', el)" type="file" accept="image/*" class="photo-input" @change="(event) => onPhotoFileChange(event, slot.key)" />
          </div>
        </div>
      </div>
    </section>

    <section v-for="group in mainGroups" :key="group.id" class="section-block">
      <button type="button" class="section-title" @click="toggleSection(group.id)">
        <span>{{ group.title }}</span>
        <span class="section-actions">
          <span class="answered-count">{{ getGroupAnswered(group.id) }}/{{ group.items.length }}</span>
          <v-icon size="18">{{ isOpen(group.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </span>
      </button>

      <div v-show="isOpen(group.id)" class="section-body">
        <article v-for="item in group.items" :key="item.id" class="item-card">
          <strong>{{ item.label }}</strong>
          <div class="state-row">
            <button
              v-for="state in statesSiNo"
              :key="state.value"
              type="button"
              :disabled="disabled"
              :class="['state-toggle', getItemValue(group.id, item.id) === state.value ? `state-toggle--${state.value}` : '']"
              @click="setItemValue(group.id, item.id, state.value)"
            >
              {{ state.label }}
            </button>
          </div>
          <v-textarea
            :model-value="getItemObservation(group.id, item.id)"
            label="Observacion"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            hide-details
            :disabled="disabled"
            @update:model-value="(value) => setItemObservation(group.id, item.id, value)"
          />
        </article>
      </div>
    </section>

    <div class="double-header">Cierre de inspeccion</div>

    <v-row dense class="mb-3">
      <v-col v-for="field in footerFields" :key="field.key" cols="12" sm="4">
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

    <v-textarea
      :model-value="getGeneralObservation()"
      label="Que observaciones detecto"
      variant="outlined"
      density="compact"
      rows="3"
      auto-grow
      hide-details
      :disabled="disabled"
      @update:model-value="setGeneralObservation"
    />

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
const renderTick = ref(0)
const photoInputs = ref({})
const previewOpen = ref(false)
const previewSrc = ref('')

const headerFields = [
  { key: 'nombreConductor', label: 'Nombre conductor' },
  { key: 'kilometros', label: 'Kilometros' },
  { key: 'patente', label: 'Patente' },
  { key: 'fecha', label: 'Fecha', type: 'date' }
]

const footerFields = [
  { key: 'obra', label: 'Obra' },
  { key: 'realizadoPor', label: 'Realizado por' },
  { key: 'fechaRealizado', label: 'Fecha', type: 'date' }
]

const statesSiNo = [
  { value: 'si', label: 'SI' },
  { value: 'no', label: 'NO' }
]

const photoSlots = [
  { key: 'ladoPasajero', label: 'Lado pasajero', placeholder: 'Foto lado pasajero' },
  { key: 'ladoConductor', label: 'Lado conductor', placeholder: 'Foto lado conductor' },
  { key: 'vistaFrontal', label: 'Vista frontal', placeholder: 'Foto vista frontal' },
  { key: 'vistaPosterior', label: 'Vista posterior', placeholder: 'Foto vista posterior' }
]

const mainGroups = [
  group('documentacionEquipo', '1. Chequeo de documentacion del equipo', [
    'Permiso de circulacion al dia',
    'Seguro obligatorio al dia',
    'Certificado de revision tecnica',
    'Certificado de gases',
    'Existe programa de mantencion de equipo',
    'Ver registro'
  ]),
  group('condicionesVehiculo', '2. Verificacion de las condiciones del vehiculo', [
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
  ]),
  group('equiposEmergencia', '3. Equipos de emergencia', [
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
  ]),
  group('documentacionConductor', '4. Chequeo de documentacion de conductor y/o operador', [
    'Licencia de conducir municipal al dia',
    'Licencia interna al dia',
    'Pase empresa mandante',
    'Sensor de sueno'
  ]),
  group('revision', '5. Revision', [
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
  ])
]

const openSections = ref([
  'fotosCamioneta',
  'documentacionEquipo',
  'condicionesVehiculo',
  'equiposEmergencia'
])

onMounted(() => {
  ensureBody()
})

function group(id, title, labels) {
  return {
    id,
    title,
    items: labels.map((label, index) => item(index + 1, label))
  }
}

function item(numero, label) {
  return {
    id: `item-${numero}`,
    numero,
    label
  }
}

function ensureBody() {
  const attr = attrRef.value
  if (!attr.datos || typeof attr.datos !== 'object') attr.datos = {}
  if (!Array.isArray(attr.grupos)) attr.grupos = []
  ensureFotos()

  mainGroups.forEach((groupDef) => {
    let groupData = attr.grupos.find((candidate) => candidate?.id === groupDef.id)
    if (!groupData) {
      groupData = { id: groupDef.id, title: groupDef.title, items: [] }
      attr.grupos.push(groupData)
    }
    if (!Array.isArray(groupData.items)) groupData.items = []
    groupDef.items.forEach((itemDef) => {
      if (!groupData.items.some((candidate) => candidate?.id === itemDef.id)) {
        groupData.items.push({ id: itemDef.id, label: itemDef.label, estado: '', observacion: '' })
      }
    })
  })
}

function ensureFotos() {
  const attr = attrRef.value
  if (!attr.fotos || typeof attr.fotos !== 'object' || Array.isArray(attr.fotos)) attr.fotos = {}
  photoSlots.forEach((slot) => {
    const current = attr.fotos[slot.key]
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      attr.fotos[slot.key] = { label: slot.label, observacion: '', galeria: [] }
      return
    }
    if (current.label !== slot.label) current.label = slot.label
    if (typeof current.observacion !== 'string') current.observacion = String(current.observacion ?? '')
    if (!Array.isArray(current.galeria)) current.galeria = []
    if (current.galeria.length > 1) current.galeria = current.galeria.slice(0, 1)
  })
}

function touch() {
  renderTick.value += 1
  emit('change')
}

function isOpen(id) {
  return openSections.value.includes(id)
}

function toggleSection(id) {
  openSections.value = isOpen(id)
    ? openSections.value.filter((section) => section !== id)
    : [...openSections.value, id]
}

function getDato(key) {
  renderTick.value
  ensureBody()
  return attrRef.value.datos?.[key] ?? ''
}

function setDato(key, value) {
  ensureBody()
  attrRef.value.datos[key] = value ?? ''
  touch()
}

function findGroup(groupId) {
  ensureBody()
  return attrRef.value.grupos.find((group) => group?.id === groupId)
}

function findGroupItem(groupId, itemId) {
  const groupData = findGroup(groupId)
  return groupData?.items?.find((itemData) => itemData?.id === itemId)
}

function getItemValue(groupId, itemId) {
  renderTick.value
  return findGroupItem(groupId, itemId)?.estado ?? ''
}

function setItemValue(groupId, itemId, value) {
  const itemData = findGroupItem(groupId, itemId)
  if (!itemData) return
  itemData.estado = itemData.estado === value ? '' : value
  touch()
}

function getItemObservation(groupId, itemId) {
  renderTick.value
  return findGroupItem(groupId, itemId)?.observacion ?? ''
}

function setItemObservation(groupId, itemId, value) {
  const itemData = findGroupItem(groupId, itemId)
  if (!itemData) return
  itemData.observacion = value ?? ''
  touch()
}

function getGroupAnswered(groupId) {
  renderTick.value
  const groupData = findGroup(groupId)
  return (groupData?.items || []).filter((itemData) => String(itemData?.estado ?? '').trim() !== '').length
}

function getGeneralObservation() {
  renderTick.value
  ensureBody()
  return attrRef.value.observacionesGenerales ?? ''
}

function setGeneralObservation(value) {
  attrRef.value.observacionesGenerales = value ?? ''
  touch()
}

function getFotoSlot(slotKey) {
  ensureFotos()
  return attrRef.value.fotos[slotKey]
}

function fotoSrc(slotKey) {
  const foto = getFotoSlot(slotKey).galeria[0]
  return foto?.url || foto?.base64 || ''
}

function setPhotoObs(slotKey, value) {
  getFotoSlot(slotKey).observacion = value ?? ''
  touch()
}

function getFotosAnswered() {
  renderTick.value
  ensureFotos()
  return photoSlots.filter((slot) => {
    const foto = getFotoSlot(slot.key)
    return foto.galeria.length > 0 || String(foto.observacion ?? '').trim() !== ''
  }).length
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
    getFotoSlot(slotKey).galeria = [{
      base64: '',
      url: dataArchivo?.archivo?.name_doc_interno ? `${API_BASE}/archivo/transmac/${dataArchivo.archivo.name_doc_interno}` : compressedDataUrl,
      nombre: dataArchivo?.archivo?.name_doc_interno || file.name
    }]
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
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
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

async function uploadFileFromBase64(base64, filename, mime) {
  const formData = new FormData()
  formData.append('archivo', base64ToFile(base64, filename || 'camioneta.jpg', mime || 'image/jpeg'))
  const response = await apiAxios.post('/archivo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return response?.data || response
}
</script>

<style scoped>
.checklist-camioneta-amsa {
  color: #e5e7eb;
}

.section-block {
  border: 1px solid rgba(34, 211, 238, 0.38);
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.72);
}

.section-title {
  align-items: center;
  background: #1f2937;
  border: 0;
  color: #f8fafc;
  cursor: pointer;
  display: flex;
  font-weight: 800;
  justify-content: space-between;
  letter-spacing: 0;
  min-height: 44px;
  padding: 10px 14px;
  text-align: left;
  text-transform: uppercase;
  width: 100%;
}

.section-actions {
  align-items: center;
  display: inline-flex;
  gap: 8px;
  margin-left: 10px;
}

.answered-count {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.55);
  border-radius: 999px;
  color: #a7f3d0;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 2px 8px;
  white-space: nowrap;
}

.section-body {
  display: grid;
  gap: 10px;
  padding: 10px;
}

.photo-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.photo-slot {
  background: rgba(15, 23, 42, 0.2);
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  padding: 10px;
}

.photo-slot__head {
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.photo-slot__title {
  color: #e5eefb;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.15;
  text-transform: uppercase;
}

.photo-slot__actions {
  display: flex;
  gap: 6px;
}

.photo-action {
  align-items: center;
  background: rgba(71, 85, 105, 0.36);
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  color: #dbeafe;
  display: inline-flex;
  height: 30px;
  justify-content: center;
  width: 30px;
}

.photo-action:disabled {
  cursor: default;
  opacity: 0.65;
}

.photo-action--danger {
  background: rgba(127, 29, 29, 0.42);
  border-color: rgba(239, 68, 68, 0.65);
  color: #fee2e2;
}

.photo-preview {
  aspect-ratio: 4 / 3;
  background: rgba(2, 6, 23, 0.56);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  color: #cbd5e1;
  display: block;
  overflow: hidden;
  width: 100%;
}

.photo-preview__img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.photo-placeholder {
  align-content: center;
  color: #94a3b8;
  display: grid;
  font-size: 11px;
  font-weight: 800;
  gap: 6px;
  height: 100%;
  place-items: center;
  text-align: center;
}

.photo-input {
  display: none;
}

.item-card {
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  padding: 10px;
}

.state-row {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.state-toggle {
  background: #1f2937;
  border: 1px solid #475569;
  border-radius: 7px;
  color: #f8fafc;
  font-size: 0.8rem;
  font-weight: 900;
  min-height: 34px;
  padding: 7px 8px;
}

.state-toggle:disabled {
  cursor: default;
  opacity: 0.7;
}

.state-toggle--si {
  background: #064e3b;
  border-color: #10b981;
}

.state-toggle--no {
  background: #7f1d1d;
  border-color: #ef4444;
}

.double-header {
  background: #0f766e;
  border: 1px solid rgba(45, 212, 191, 0.7);
  border-radius: 8px;
  color: #ecfeff;
  font-weight: 900;
  margin: 14px 0 10px;
  padding: 10px 14px;
  text-transform: uppercase;
}

@media (max-width: 600px) {
  .photo-grid {
    grid-template-columns: 1fr;
  }

  .state-row {
    gap: 4px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .state-toggle {
    font-size: 0.68rem;
    min-height: 32px;
    padding: 6px 4px;
  }
}
</style>
