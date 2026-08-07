<template>
  <div class="checklist-grua-horquilla-dmh">
    <v-expansion-panels v-model="openSections" multiple class="dmh-panels">
      <v-expansion-panel value="datos" class="dmh-card">
        <v-expansion-panel-title class="dmh-title">
          DATOS
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="attrRef.datos?.patente"
                label="Patente"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('patente', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="attrRef.datos?.proximaMantencion"
                label="Proxima mantencion"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('proximaMantencion', normalizeDate(value))"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="fotos" class="dmh-card">
        <v-expansion-panel-title class="dmh-title">
          FOTOS GRUA HORQUILLA
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
                  <v-icon icon="mdi-forklift" size="28" />
                  <span>{{ slot.placeholder }}</span>
                </span>
              </button>

              <input :ref="(el) => setPhotoInputRef(slot.key, 'camera', el)" type="file" accept="image/*" capture="environment" class="photo-input" @change="(event) => onPhotoFileChange(event, slot.key)" />
              <input :ref="(el) => setPhotoInputRef(slot.key, 'gallery', el)" type="file" accept="image/*" class="photo-input" @change="(event) => onPhotoFileChange(event, slot.key)" />
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="inspeccion" class="dmh-card">
        <v-expansion-panel-title class="dmh-title">
          INSPECCION DIARIA
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="day-tabs">
            <button
              v-for="day in dayKeys"
              :key="day.key"
              type="button"
              :class="['day-tab', selectedDay === day.key ? 'day-tab--active' : '']"
              @click="selectDay(day.key)"
            >
              {{ day.short }}
            </button>
          </div>

          <v-row dense class="day-metrics">
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDayDate(selectedDay)"
                :label="`Fecha ${currentDayLabel}`"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDayDate(selectedDay, normalizeDate(value))"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDayMetric(selectedDay, 'horometro')"
                label="Horometro"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDayMetric(selectedDay, 'horometro', value)"
              />
            </v-col>
          </v-row>

          <div class="group-list">
            <section v-for="group in groups" :key="group.key" class="group-block">
              <h4 class="group-title">{{ group.title }}</h4>

              <div class="item-list">
                <div v-for="item in group.items" :key="item.key" class="item-card">
                  <div class="item-card__content">
                    <div class="check-code">{{ item.code }}</div>
                    <div class="check-item">{{ item.label }}</div>
                  </div>

                  <div class="state-buttons">
                    <button
                      v-for="option in optionsFor(group.mode)"
                      :key="option.value"
                      type="button"
                      :class="['state-toggle', getItemDayState(item.key, selectedDay) === option.value ? `state-toggle--${option.value}` : '']"
                      :disabled="disabled"
                      @click="setItemDayState(item.key, selectedDay, option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="observaciones" class="dmh-card">
        <v-expansion-panel-title class="dmh-title">
          OBSERVACIONES Y CIERRE
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-textarea
            :model-value="attrRef.observacionesDanos"
            label="Observaciones y/o danos"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            hide-details
            :disabled="disabled"
            @update:model-value="setObservacionesDanos"
          />

          <div class="note-box">
            B = BUENO, M = MALO.
          </div>
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
import { computed, onMounted, ref, toRef } from 'vue'
import apiAxios from '@/services/api'

const API_BASE = (process.env.VUE_APP_API_BASE_URL || '').replace(/\/$/, '')

const props = defineProps({
  attr: { type: Object, required: true },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['change'])
const attrRef = toRef(props, 'attr')

const dayKeys = [
  { key: 'miercoles', label: 'Miercoles', short: 'Mie' },
  { key: 'jueves', label: 'Jueves', short: 'Jue' },
  { key: 'viernes', label: 'Viernes', short: 'Vie' },
  { key: 'sabado', label: 'Sabado', short: 'Sab' },
  { key: 'domingo', label: 'Domingo', short: 'Dom' },
  { key: 'lunes', label: 'Lunes', short: 'Lun' },
  { key: 'martes', label: 'Martes', short: 'Mar' }
]

const photoSlots = [
  { key: 'adelante', label: 'Adelante', placeholder: 'Foto adelante' },
  { key: 'atras', label: 'Atras', placeholder: 'Foto atras' },
  { key: 'derecha', label: 'Derecha', placeholder: 'Foto derecha' },
  { key: 'izquierda', label: 'Izquierda', placeholder: 'Foto izquierda' }
]

const groups = [
  group('documentos', 'Documentos', 'sino', [
    item('1.1', 'Documentacion del Equipo (critico)')
  ]),
  group('identificacion', 'Identificacion', 'bm', [
    item('2.1', 'Logos y numero de identificacion')
  ]),
  group('luces', 'Sistemas de Seguridad Activa - Luces', 'bm', [
    item('3.1', 'Luces interiores'),
    item('3.3', 'Luces Intermitentes'),
    item('3.4', 'Luces Altas y bajas (critico)'),
    item('3.5', 'Luz de freno (critico)'),
    item('3.6', 'Estado de baliza'),
    item('3.7', 'Alarma de retroceso (critico)')
  ]),
  group('neumaticos', 'Neumaticos', 'sino', [
    item('4.1', 'Desgaste de banda (critico)'),
    item('4.2', 'Corte lateral (critico)'),
    item('4.3', 'Dibujo de neumatico'),
    item('4.4', 'Seguro de Traba Tuercas de Ruedas (critico)')
  ]),
  group('esp', 'Estabilidad (ESP)', 'sino', [
    item('5.1', 'Se advierte algun tipo de falla en sensor de tablero')
  ]),
  group('frenos', 'Frenos', 'bm', [
    item('6.1', 'Freno de mano (critico)'),
    item('6.2', 'Freno de pedal (critico)')
  ]),
  group('cabina', 'Cabina', 'bm', [
    item('7.1', 'Espejo retrovisor (critico)'),
    item('7.2', 'Estado de puertas'),
    item('7.3', 'Estado de manillas'),
    item('7.4', 'Estado de Chapa'),
    item('7.5', 'Estado de cadena torre'),
    item('7.6', 'Estado de manguera'),
    item('7.7', 'Asientos'),
    item('7.8', 'Bocina (critico)'),
    item('7.9', 'Aire acondicionado-calefaccion (critico)'),
    item('7.10', 'Alza vidrio'),
    item('7.11', 'Camara de Retroceso (critico)'),
    item('7.12', 'Mando de Operacion'),
    item('7.13', 'Escalera de acceso, peldanos')
  ]),
  group('seguridadPasiva', 'Sistemas de Seguridad Pasiva - Cabina', 'bm', [
    item('8.1', 'Cinturon de seguridad (critico)'),
    item('8.2', 'Parabrisas (critico)'),
    item('8.3', 'Asiento (apoyacabezas)')
  ]),
  group('equipamientoSeguridad', 'Sistemas Complementarios - Equipamiento de Seguridad', 'bm', [
    item('10.1', 'Triangulos'),
    item('10.2', 'Llave Rueda'),
    item('10.3', 'Botiquin'),
    item('10.4', 'Extintor y tarjeta'),
    item('10.5', 'Cunas (critico)')
  ]),
  group('equipoExterior', 'Equipo / Exterior', 'bm', [
    item('11.1', 'Engrase en general'),
    item('11.2', 'Nivel de aceite'),
    item('11.3', 'Parada de emergencia (critico)'),
    item('11.4', 'Corta corriente (critico)'),
    item('11.5', 'Pasadores sujecion de torre'),
    item('11.6', 'Cilindro de inclinacion'),
    item('11.7', 'Flexibles de Torres'),
    item('11.8', 'Escala de acceso'),
    item('11.9', 'Estado de chasis en general')
  ]),
  group('direccion', 'Direccion', 'sino', [
    item('12.1', 'Volante duro/con juego (critico)'),
    item('12.2', 'Vibracion (critico)')
  ]),
  group('suspension', 'Suspension', 'sino', [
    item('13.1', 'Vehiculo desnivelado'),
    item('13.2', 'Ruidos extranos al frenar'),
    item('13.3', 'Vehiculo se recarga hacia un lado')
  ])
]

const openSections = ref(['datos', 'fotos', 'inspeccion', 'observaciones'])
const selectedDay = ref('miercoles')
const photoInputs = ref({})
const previewOpen = ref(false)
const previewSrc = ref('')
const currentDayLabel = computed(() => dayKeys.find((d) => d.key === selectedDay.value)?.label || '')

onMounted(ensureBody)

function group(key, title, mode, items) {
  return { key, title, mode, items }
}

function item(code, label) {
  return {
    code,
    label,
    key: `${code}-${label}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function normalizeDate(value) {
  const raw = String(value ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const match = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : raw
}

function ensureBody() {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') attrRef.value.datos = {}
  attrRef.value.datos.patente ??= ''
  attrRef.value.datos.proximaMantencion ??= todayIso()

  if (!attrRef.value.fotos || typeof attrRef.value.fotos !== 'object' || Array.isArray(attrRef.value.fotos)) attrRef.value.fotos = {}
  photoSlots.forEach((slot) => {
    const current = attrRef.value.fotos[slot.key]
    attrRef.value.fotos[slot.key] = {
      label: slot.label,
      galeria: Array.isArray(current?.galeria) ? current.galeria.slice(0, 1) : []
    }
  })

  if (!attrRef.value.fechas || typeof attrRef.value.fechas !== 'object' || Array.isArray(attrRef.value.fechas)) attrRef.value.fechas = {}
  dayKeys.forEach((day, index) => {
    attrRef.value.fechas[day.key] ??= index === 0 ? todayIso() : ''
  })

  if (!attrRef.value.mediciones || typeof attrRef.value.mediciones !== 'object' || Array.isArray(attrRef.value.mediciones)) attrRef.value.mediciones = {}
  dayKeys.forEach((day) => {
    if (!attrRef.value.mediciones[day.key] || typeof attrRef.value.mediciones[day.key] !== 'object') {
      attrRef.value.mediciones[day.key] = {}
    }
    attrRef.value.mediciones[day.key].horometro ??= ''
  })

  if (!attrRef.value.respuestas || typeof attrRef.value.respuestas !== 'object' || Array.isArray(attrRef.value.respuestas)) attrRef.value.respuestas = {}
  groups.forEach((grp) => {
    grp.items.forEach((it) => {
      if (!attrRef.value.respuestas[it.key] || typeof attrRef.value.respuestas[it.key] !== 'object') attrRef.value.respuestas[it.key] = {}
      dayKeys.forEach((day) => {
        attrRef.value.respuestas[it.key][day.key] = normalizeState(attrRef.value.respuestas[it.key][day.key], grp.mode)
      })
    })
  })

  if (typeof attrRef.value.observacionesDanos !== 'string') attrRef.value.observacionesDanos = ''
}

function normalizeState(value, mode) {
  const v = String(value ?? '').trim().toLowerCase()
  if (mode === 'bm') return ['b', 'm'].includes(v) ? v : ''
  return ['si', 'no'].includes(v) ? v : ''
}

function optionsFor(mode) {
  return mode === 'bm'
    ? [{ value: 'b', label: 'B' }, { value: 'm', label: 'M' }]
    : [{ value: 'si', label: 'SI' }, { value: 'no', label: 'NO' }]
}

function selectDay(dayKey) {
  selectedDay.value = dayKey
  if (!getDayDate(dayKey)) setDayDate(dayKey, todayIso())
}

function getDayDate(dayKey) {
  return attrRef.value.fechas?.[dayKey] ?? ''
}

function setDayDate(dayKey, value) {
  attrRef.value.fechas ||= {}
  attrRef.value.fechas[dayKey] = value
  touch()
}

function getDayMetric(dayKey, key) {
  return attrRef.value.mediciones?.[dayKey]?.[key] ?? ''
}

function setDayMetric(dayKey, key, value) {
  attrRef.value.mediciones ||= {}
  attrRef.value.mediciones[dayKey] ||= {}
  attrRef.value.mediciones[dayKey][key] = value
  touch()
}

function setDato(key, value) {
  attrRef.value.datos ||= {}
  attrRef.value.datos[key] = value
  touch()
}

function getItemDayState(itemKey, dayKey) {
  return attrRef.value.respuestas?.[itemKey]?.[dayKey] ?? ''
}

function setItemDayState(itemKey, dayKey, value) {
  attrRef.value.respuestas ||= {}
  attrRef.value.respuestas[itemKey] ||= {}
  attrRef.value.respuestas[itemKey][dayKey] = attrRef.value.respuestas[itemKey][dayKey] === value ? '' : value
  touch()
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

async function uploadFileFromBase64(base64Data, originalName, mimeType) {
  const file = base64ToFile(base64Data, originalName, mimeType)
  const formData = new FormData()
  formData.append('archivo', file)
  formData.append('tipo_doc', 'DOCUMENTO')
  formData.append('mimetype', file.type)
  formData.append('name_doc_orig', file.name)
  formData.append('name_doc_interno', '')
  formData.append('tenant_code', 'transmac')
  formData.append('modulo', 'inspecciones')
  formData.append('id_user', 1)
  formData.append('estado', '1')
  const response = await apiAxios.post('/v1/storage/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

function setObservacionesDanos(value) {
  attrRef.value.observacionesDanos = value
  touch()
}

function touch() {
  attrRef.value.__touched = Date.now()
  emit('change')
}
</script>

<style scoped>
.checklist-grua-horquilla-dmh {
  width: 100%;
}

.dmh-panels,
.group-list,
.item-list {
  display: grid;
  gap: 10px;
}

.dmh-card {
  width: 100%;
  max-width: none !important;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.52) !important;
}

.dmh-title {
  min-height: 46px;
  padding: 10px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: 0;
  white-space: normal;
}

.dmh-card :deep(.v-expansion-panel-text__wrapper) {
  padding: 10px !important;
}

.checklist-grua-horquilla-dmh :deep(.v-field) {
  background: rgba(2, 6, 23, 0.56) !important;
  border-radius: 8px;
}

.checklist-grua-horquilla-dmh :deep(.v-field__outline) {
  color: rgba(148, 163, 184, 0.48) !important;
}

.checklist-grua-horquilla-dmh :deep(.v-label),
.checklist-grua-horquilla-dmh :deep(.v-field__input),
.checklist-grua-horquilla-dmh :deep(input),
.checklist-grua-horquilla-dmh :deep(textarea) {
  color: #e5eefb !important;
  opacity: 1 !important;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.photo-slot,
.group-block,
.item-card {
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.2);
}

.photo-slot {
  display: grid;
  gap: 8px;
  padding: 10px;
}

.photo-slot__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.photo-slot__title {
  color: #e5eefb;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.15;
}

.photo-slot__actions {
  display: flex;
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

.photo-action--danger {
  border-color: rgba(239, 68, 68, 0.65);
  background: rgba(127, 29, 29, 0.42);
  color: #fee2e2;
}

.photo-preview {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.56);
  color: #cbd5e1;
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

.day-tabs {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 10px;
}

.day-tab,
.state-toggle {
  min-height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  background: rgba(71, 85, 105, 0.36);
  color: #dbeafe;
  font-size: 11px;
  font-weight: 900;
}

.day-tab--active,
.state-toggle--si,
.state-toggle--b {
  background: rgba(6, 95, 70, 0.5);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.state-toggle--no,
.state-toggle--m {
  background: rgba(127, 29, 29, 0.42);
  border-color: rgba(239, 68, 68, 0.65);
  color: #fee2e2;
}

.day-metrics {
  margin-bottom: 10px;
}

.group-block {
  padding: 10px;
}

.group-title {
  margin: 0 0 10px;
  color: #e5eefb;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.15;
  text-transform: uppercase;
}

.item-card {
  display: grid;
  gap: 10px;
  padding: 10px;
}

.item-card__content {
  display: grid;
  gap: 3px;
}

.check-code {
  color: #5eead4;
  font-size: 11px;
  font-weight: 900;
}

.check-item {
  color: #e5eefb;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
}

.state-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.note-box {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.38);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.35;
}

@media (min-width: 760px) {
  .item-card {
    grid-template-columns: minmax(0, 1fr) 140px;
    align-items: center;
  }
}

@media (max-width: 620px) {
  .day-tabs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .photo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
