<template>
  <div class="photo-check-wrapper py-2 px-1 mb-2">
    <!-- 1. Enunciado de la Pregunta a 100% de ancho -->
    <div class="question-title text-body-1 font-weight-bold text-white mb-2 leading-snug break-words">
      {{ localLabel }}
    </div>

    <!-- 2. Fila Única Horizontal de Acciones (Opciones + Cantidad/Unidad + Fecha Vencimiento + Cámara + Comentario) -->
    <div class="d-flex align-center flex-wrap" style="gap: 8px;">
      <!-- Grupo de Botones de Opción (SI / NO / B / R / M / NA) -->
      <div v-if="options && options.length" class="d-flex align-center" style="gap: 6px;">
        <button 
          v-for="option in options" 
          :key="option.id" 
          type="button"
          class="check-option-btn"
          :class="checkActivo === option.id ? 'active-check-btn' : 'inactive-check-btn'"
          @click="selectOption(option.id)"
        >
          {{ option.label }}
        </button>
      </div>

      <!-- Campo Compacto de Cantidad con Unidad Incrustada (Opción 1) -->
      <div v-if="hasCantidad || cantidad !== undefined" class="d-flex align-center cantidad-pill">
        <input 
          type="number" 
          v-model="localCantidad" 
          placeholder="Cant." 
          class="cantidad-input"
          min="0"
        />
        <span v-if="unit" class="unit-text">{{ unit }}</span>
      </div>

      <!-- Selector Táctil de Fecha de Vencimiento (Datepicker Nativo) -->
      <div v-if="hasVencimiento || fechaVencimiento !== undefined" class="date-picker-wrapper">
        <button 
          type="button"
          class="date-pill-btn" 
          :class="{ 'has-date': localFechaVencimiento }"
          @click="openDatePicker"
          title="Seleccionar fecha de vencimiento"
        >
          <v-icon size="15" :color="localFechaVencimiento ? '#10b981' : '#94a3b8'" class="mr-1">mdi-calendar-clock</v-icon>
          <span>{{ formatFechaDisplay(localFechaVencimiento) }}</span>
        </button>
        <input 
          ref="dateInputRef"
          type="date" 
          v-model="localFechaVencimiento" 
          class="hidden-native-date-input" 
        />
        <button 
          v-if="localFechaVencimiento" 
          type="button" 
          class="clear-date-btn" 
          @click.stop="localFechaVencimiento = ''"
          title="Limpiar fecha"
        >
          <v-icon size="12">mdi-close</v-icon>
        </button>
      </div>

      <!-- Botón Compacto de Foto -->
      <button 
        v-if="galeria !== undefined"
        type="button" 
        class="action-btn-compact camera-btn" 
        :disabled="props.bloquearFoto"
        @click="triggerInput"
        title="Tomar o adjuntar fotografía"
      >
        <v-icon size="18" color="#10b981">mdi-camera</v-icon>
        <span v-if="galeria && galeria.length" class="badge-count">{{ galeria.length }}</span>
      </button>
      <input ref="fileInput" type="file" accept="image/*" capture="environment" @change="onFileChange" hidden />

      <!-- Botón Compacto de Comentario (Toggle) -->
      <button 
        type="button" 
        class="action-btn-compact comment-btn"
        :class="{ 'has-comment': (localObs && localObs.trim() !== '') || showCommentBox }"
        @click="toggleComment"
        title="Agregar o ver comentario"
      >
        <v-icon size="18" :color="(localObs && localObs.trim() !== '') ? '#38bdf8' : '#94a3b8'">mdi-comment-text-outline</v-icon>
      </button>
    </div>

    <!-- 3. Galería de Fotos (miniaturas compactas) -->
    <div v-if="galeria && galeria.length" class="mt-3 mb-2 d-flex flex-wrap" style="gap: 8px;">
      <div
        v-for="(foto, idx) in galeria"
        :key="`foto-check-${idx}`"
        class="photo-thumb-container"
      >
        <v-img :src="foto.url || foto.base64" cover class="rounded-lg border border-white/10" width="76" height="76" />
        <button
          type="button"
          class="remove-photo-badge"
          @click.stop="removeImage(idx)"
          title="Eliminar foto"
        >
          <v-icon size="12" color="#ffffff">mdi-close</v-icon>
        </button>
      </div>
    </div>

    <!-- 4. Cuadro de Comentario Bajo Demanda (solo si se abre o tiene texto) -->
    <div v-if="showCommentBox || (localObs && localObs.trim() !== '')" class="mt-3">
      <v-textarea 
        v-model="localObs" 
        placeholder="Escriba un comentario u observación..." 
        rows="2" 
        auto-grow
        variant="outlined" 
        density="compact"
        hide-details 
        class="comment-input bg-[#0f172a]" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import apiAxios from '@/services/api'

const props = defineProps({
  label: String,
  modelValue: {
    type: String,
    default: ''
  },
  cantidad: {
    type: [Number, String],
    default: undefined
  },
  unit: {
    type: String,
    default: ''
  },
  hasCantidad: {
    type: Boolean,
    default: false
  },
  fechaVencimiento: {
    type: String,
    default: undefined
  },
  hasVencimiento: {
    type: Boolean,
    default: false
  },
  galeria: Array,
  observacion: String,
  compression: Number,
  options: {
    type: Array,
    default: () => [
      { id: 'SI', label: 'SI' },
      { id: 'NO', label: 'NO' }
    ]
  },
  bloquearFoto: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue', 
  'update:cantidad', 
  'update:fechaVencimiento', 
  'update:galeria', 
  'update:observacion'
])

const localObs = ref(props.observacion || '')
const localLabel = ref(props.label || '')
const fileInput = ref(null)
const dateInputRef = ref(null)
const checkActivo = ref(props.modelValue || '')
const localCantidad = ref(props.cantidad !== undefined ? props.cantidad : '')
const localFechaVencimiento = ref(props.fechaVencimiento || '')
const showCommentBox = ref(Boolean(props.observacion && props.observacion.trim() !== ''))

const openDatePicker = () => {
  if (dateInputRef.value) {
    if (typeof dateInputRef.value.showPicker === 'function') {
      try {
        dateInputRef.value.showPicker()
        return
      } catch (e) {
        // fallback
      }
    }
    dateInputRef.value.focus()
    dateInputRef.value.click()
  }
}

const API_BASE = (apiAxios.defaults?.baseURL || '').replace(/\/$/, '')

watch(checkActivo, (val) => emit('update:modelValue', val))
watch(localCantidad, (val) => emit('update:cantidad', val))
watch(localFechaVencimiento, (val) => emit('update:fechaVencimiento', val))
watch(localObs, (val) => emit('update:observacion', val))

watch(() => props.modelValue, (val) => {
  if (val !== checkActivo.value) checkActivo.value = val || ''
})

watch(() => props.cantidad, (val) => {
  if (val !== localCantidad.value) localCantidad.value = val !== undefined ? val : ''
})

watch(() => props.fechaVencimiento, (val) => {
  if (val !== localFechaVencimiento.value) localFechaVencimiento.value = val || ''
})

watch(() => props.observacion, (val) => {
  if (val !== localObs.value) {
    localObs.value = val || ''
    if (val && val.trim() !== '') showCommentBox.value = true
  }
})

const formatFechaDisplay = (isoStr) => {
  if (!isoStr) return 'Vencimiento'
  const parts = isoStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return isoStr
}

const selectOption = (id) => {
  if (checkActivo.value === id) {
    checkActivo.value = ''
  } else {
    checkActivo.value = id
  }
}

const toggleComment = () => {
  showCommentBox.value = !showCommentBox.value
}

function triggerInput() {
  fileInput.value?.click()
}

async function onFileChange(event) {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, 1024 / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const compressed = canvas.toDataURL('image/jpeg', props.compression ? (props.compression / 100) : 0.6)

        // Subimos el archivo al endpoint de storage oficial
        const dataArchivo = await uploadFileFromBase64(compressed, file.name, file.type)

        const fileObj = dataArchivo?.data || dataArchivo?.archivo
        if (fileObj) {
          const interno = fileObj.name_doc_interno || ''
          const idDoc = fileObj.id_doc || null

          const nuevoObjeto = {
            base64: compressed,
            id_doc: idDoc,
            url: idDoc ? `${API_BASE}/v1/storage/view/${idDoc}` : (interno ? `${API_BASE}/archivo/gsp/${interno}` : compressed),
            nombre: interno || file.name
          }

          console.log('[PhotoCheck] Foto subida exitosamente:', nuevoObjeto)
          emit('update:galeria', [...(Array.isArray(props.galeria) ? props.galeria : []), nuevoObjeto])
        } else {
          // Fallback con base64 para que no se pierda la foto si el servidor tarda
          const nuevoObjeto = {
            base64: compressed,
            url: compressed,
            nombre: file.name
          }
          emit('update:galeria', [...(Array.isArray(props.galeria) ? props.galeria : []), nuevoObjeto])
        }
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }
  event.target.value = ''
}

function base64ToFile(base64, filename, mime) {
  const arr = base64.split(',')
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

async function uploadFileFromBase64(base64Data, originalName, mimeType) {
  const file = base64ToFile(base64Data, originalName, mimeType)

  const formData = new FormData()
  formData.append('archivo', file)
  formData.append('tipo_doc', 'FOTOGRAFIA')
  formData.append('mimetype', file.type)
  formData.append('name_doc_orig', file.name)
  formData.append('tenant_code', 'gsp')
  formData.append('modulo', 'inspecciones')
  formData.append('id_user', 1)
  formData.append('estado', 'A')

  try {
    const response = await apiAxios.post('/v1/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error al subir archivo:', error)
    return null
  }
}

function removeImage(index) {
  const current = Array.isArray(props.galeria) ? [...props.galeria] : []
  if (index < 0 || index >= current.length) return
  current.splice(index, 1)
  emit('update:galeria', current)
}
</script>

<style scoped>
.photo-check-wrapper {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.question-title {
  color: #f8fafc;
  font-size: 0.875rem;
  letter-spacing: 0.01em;
}

.check-option-btn {
  min-width: 60px;
  height: 32px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  outline: none;
}

.inactive-check-btn {
  background-color: #1e293b !important;
  color: #94a3b8 !important;
  border: 1px solid #334155 !important;
}

.inactive-check-btn:hover {
  background-color: #334155 !important;
  color: #f8fafc !important;
}

.active-check-btn {
  background-color: #0284c7 !important;
  color: #ffffff !important;
  font-weight: 900 !important;
  border: 1px solid #38bdf8 !important;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.action-btn-compact {
  position: relative;
  width: 34px;
  height: 32px;
  border-radius: 8px;
  background-color: #1e293b;
  border: 1px solid #334155;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.action-btn-compact:hover {
  background-color: #334155;
  border-color: #475569;
}

.action-btn-compact.has-comment {
  border-color: #38bdf8;
  background-color: rgba(56, 189, 248, 0.1);
}

.badge-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #10b981;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 900;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-thumb-container {
  position: relative;
  width: 76px;
  height: 76px;
}

.remove-photo-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: #ef4444;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}

.comment-input :deep(.v-field__outline) {
  border-color: rgba(255, 255, 255, 0.15) !important;
}

.comment-input :deep(textarea) {
  color: #ffffff !important;
  font-size: 0.85rem !important;
}

.cantidad-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 2px 8px;
  height: 36px;
}

.cantidad-input {
  width: 50px;
  background: transparent;
  color: #ffffff;
  font-size: 13px;
  font-family: monospace;
  font-weight: bold;
  border: none;
  outline: none;
  text-align: center;
}

.unit-text {
  font-size: 11px;
  font-family: monospace;
  font-weight: bold;
  color: #38bdf8;
  padding-left: 2px;
  user-select: none;
}

.date-picker-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.date-pill-btn {
  display: inline-flex;
  align-items: center;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
  cursor: pointer;
  height: 36px;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}

.date-pill-btn.has-date {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
  color: #34d399;
  font-weight: bold;
}

.hidden-native-date-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
  border: none;
  padding: 0;
  margin: 0;
}

.clear-date-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  margin-left: 4px;
  cursor: pointer;
}
</style>
