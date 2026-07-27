<template>
  <div class="p-4">
    <div style="display: flex; gap: 1rem;">
      <div style="flex: 1;" class="font-weight-medium mb-1">
        {{ localLabel }}
      </div>
      <div style="flex: 2;">
        <div style="display: flex; gap: 8px;" class="mb-2">
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
      </div>
    </div>

    <div v-if="galeria">
      <br>
      <v-btn icon @click="triggerInput" :disabled="props.bloquearFoto" class="mb-3">
        <v-icon>mdi-camera</v-icon>
      </v-btn>

      <input ref="fileInput" type="file" accept="image/*" capture="environment" @change="onFileChange" hidden />

      <div v-if="galeria.length" class="mb-3 d-flex flex-wrap" style="gap: 8px;">
        <div
          v-for="(foto, idx) in galeria"
          :key="`foto-check-${idx}`"
          style="position: relative; width: 96px; height: 96px;"
        >
          <v-img :src="foto.url || foto.base64" cover class="rounded-lg" width="96" height="96" />
          <v-btn
            icon
            size="x-small"
            color="red"
            style="position: absolute; top: 2px; right: 2px; z-index: 2;"
            @click.stop="removeImage(idx)"
          >
            <v-icon size="14">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <v-textarea v-if="props.observacion !== undefined" v-model="localObs" label="Comentario" rows="2" auto-grow
      variant="outlined" hide-details class="bg-white" />
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
  galeria: Array,
  observacion: String,
  compression: Number,
  options: {
    type: Array,
    default: () => []
  },
  bloquearFoto: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update:galeria', 'update:observacion'])

const localObs = ref(props.observacion || '')
const localLabel = ref(props.label || '')
const fileInput = ref(null)
const checkActivo = ref(props.modelValue || '')

// ✅ Tomamos el baseURL real de la API (Vue CLI + axios)
const API_BASE = (apiAxios.defaults?.baseURL || '').replace(/\/$/, '')
console.log('[PhotoCheck] API_BASE =', API_BASE)

// watches
watch(checkActivo, (val) => emit('update:modelValue', val))

const selectOption = (id) => {
  if (checkActivo.value === id) {
    checkActivo.value = ''
  } else {
    checkActivo.value = id
  }
}
watch(localObs, (val) => emit('update:observacion', val))

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
        const scale = Math.min(1, 800 / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const compressed = canvas.toDataURL('image/jpeg', props.compression || 0.1)

        // Subimos el archivo y esperamos la respuesta
        const dataArchivo = await uploadFileFromBase64(compressed, file.name, file.type)

        if (dataArchivo?.archivo?.name_doc_interno) {
          const interno = dataArchivo.archivo.name_doc_interno

          const nuevoObjeto = {
            // dejamos el base64 por si la URL falla / para vista inmediata
            base64: compressed,
            // 🔹 URL absoluta usando el mismo backend que apiAxios
            url: `${API_BASE}/archivo/transmac/${interno}`,
            nombre: interno
          }

          console.log('[PhotoCheck] URL FINAL =', nuevoObjeto.url)
          emit('update:galeria', [...(Array.isArray(props.galeria) ? props.galeria : []), nuevoObjeto])
        } else {
          console.error('No se pudo subir el archivo correctamente.')
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
  formData.append('tipo_doc', 'DOCUMENTO')
  formData.append('mimetype', file.type)
  formData.append('name_doc_orig', file.name)
  formData.append('name_doc_interno', '')
  formData.append('path_doc', '/u05/LeanDocs/transmac/')
  formData.append('id_user', 1)
  formData.append('estado', '1')

  try {
    const response = await apiAxios.post('/archivo/imagen', formData, {
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
.check-option-btn {
  min-width: 60px;
  height: 30px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  outline: none;
  box-shadow: none;
}

.inactive-check-btn {
  background-color: #1e293b !important;
  color: #94a3b8 !important;
  border: 1px solid #475569 !important;
}

.inactive-check-btn:hover {
  background-color: #334155 !important;
  color: #f1f5f9 !important;
}

.active-check-btn {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: #ffffff !important;
  font-weight: 900 !important;
  border: 1px solid rgb(var(--v-theme-primary)) !important;
}
</style>
