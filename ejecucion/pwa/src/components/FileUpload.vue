<template>
  <div class="p-4">
    <div class="d-flex align-center gap-4">
      <v-file-input ref="fileInput" accept="*/*" label="Seleccionar archivos" prepend-icon="mdi-paperclip"
        @change="onFileChange" show-size outlined multiple hide-details class="flex-grow-1 d-none" />

      <v-btn icon @click="triggerInput" :disabled="archivos.length >= maxArchivos || disabled">
        <v-icon>mdi-paperclip</v-icon>
      </v-btn>
    </div>

    <v-list v-if="archivos.length" class="mt-4">
      <v-list-item v-for="(archivo, index) in archivos" :key="index">
        <div class="d-flex align-center justify-space-between">
          <div class="flex-grow-1">
            <a :href="archivo.url" target="_blank" rel="noopener noreferrer">
              {{ archivo.nombre || archivo.name }}
            </a>

            <!-- Opcional: mostrar nombre original chico -->
            <div v-if="archivo.name_doc_orig" class="text-caption text-grey">
              {{ archivo.name_doc_orig }}
            </div>
          </div>

          <v-btn v-if="!disabled" icon size="small" color="red" @click="removeArchivo(index)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-list-item>
    </v-list>

    <v-textarea v-model="localObs" label="Comentario General" auto-grow variant="outlined" class="mt-4 bg-white"
      :disabled="disabled" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import apiAxios from '@/services/api'

const API_BASE = (process.env.VUE_APP_API_BASE_URL || '').replace(/\/$/, '')

const props = defineProps({
  maxArchivos: { type: Number, default: 5 },
  observacion: String,
  archivos: {
    type: Array,
    default: () => [] // Array de objetos (subidos) con url + nombre
  },
  disabled: Boolean,
})

const emit = defineEmits(['update:archivos', 'update:observacion'])

const fileInput = ref(null)
const localObs = ref(props.observacion || '')

// Sync observación como en FotoCapture
watch(() => props.observacion, (val) => {
  if (val !== localObs.value) localObs.value = val ?? ''
})
watch(localObs, (val) => {
  emit('update:observacion', val ?? '')
})

async function onFileChange(event) {
  const files = event.target.files
  if (!files || !files.length) return

  for (const file of files) {
    if (props.archivos.length >= props.maxArchivos) break

    // ✅ Hora del dispositivo (cuando el usuario selecciona/sube)
    const deviceUploadedAt = new Date().toISOString()

    // ✅ Subimos el archivo
    const dataArchivo = await uploadFile(file)
    if (!dataArchivo?.archivo) continue

    const interno = dataArchivo.archivo.name_doc_interno || ''
    const url = interno ? `${API_BASE}/archivo/transmac/${interno}` : ''

    // ✅ Hora del servidor (viene del controller)
    const serverUploadedAt = dataArchivo.server_uploaded_at || null

    // ✅ Fecha de subida (mejor basada en server, si existe)
    const uploadedDate = serverUploadedAt
      ? serverUploadedAt.slice(0, 10) // "YYYY-MM-DD"
      : deviceUploadedAt.slice(0, 10)

    const nuevoObjeto = {
      // Mantengo compatibilidad con tu UI
      name: file.name,
      name_doc_orig: dataArchivo.archivo.name_doc_orig || file.name,
      nombre: dataArchivo.archivo.name_doc_interno || file.name,
      url,

      mimetype: file.type,
      size: file.size,
      id_doc: dataArchivo.archivo.id_doc ?? dataArchivo.archivo.id_archivo ?? null,

      // ✅ NUEVO: guardados junto al archivo
      device_uploaded_at: deviceUploadedAt,
      server_uploaded_at: serverUploadedAt,
      uploaded_date: uploadedDate,
    }

    emit('update:archivos', [...props.archivos, nuevoObjeto].slice(0, props.maxArchivos))
  }

  event.target.value = ''
}

function triggerInput() {
  fileInput.value?.$el?.querySelector('input')?.click()
}

function removeArchivo(index) {
  const nuevaLista = [...props.archivos]
  nuevaLista.splice(index, 1)
  emit('update:archivos', nuevaLista)
}

async function uploadFile(file) {
  const formData = new FormData()
  formData.append('archivo', file)

  // 👇 estos campos son iguales a tu FotoCapture
  formData.append('tipo_doc', 'DOCUMENTO')
  formData.append('mimetype', file.type || 'application/octet-stream')
  formData.append('name_doc_orig', file.name)
  formData.append('name_doc_interno', '')
  formData.append('path_doc', '/u05/LeanDocs/transmac')
  formData.append('id_user', 1)
  formData.append('estado', '1')

  try {
    // ⚠️ Si tu backend tiene otra ruta para documentos, cambia aquí.
    const response = await apiAxios.post('/archivo/imagen', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    console.error('Error al subir archivo:', error)
    return null
  }
}
</script>
