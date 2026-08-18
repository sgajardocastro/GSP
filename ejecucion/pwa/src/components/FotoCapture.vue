<template>
  <div class="photo-capture-card" :class="{ 'photo-capture-card--compact': props.compact }">
    <div class="photo-head-row">
      <div v-if="props.label" class="photo-capture-title">
        {{ props.label }}
      </div>
      <div class="photo-head-actions">
        <!-- Botón cámara -->
        <v-btn icon size="small" class="photo-action-btn" @click="triggerInput('camera')"
          :disabled="galeria.length >= maxFotos || disabled">
          <v-icon>mdi-camera</v-icon>
        </v-btn>

        <!-- Botón galería -->
        <v-btn icon size="small" class="photo-action-btn" @click="triggerInput('gallery')"
          :disabled="galeria.length >= maxFotos || disabled">
          <v-icon>mdi-image</v-icon>
        </v-btn>
      </div>
    </div>

    <div class="d-flex align-center gap-4">
      <!-- INPUT SOLO CÁMARA -->
      <v-file-input ref="fileInputCamera" accept="image/*" label="Tomar foto" prepend-icon="mdi-camera"
        @change="onFileChange" capture="environment" show-size outlined multiple hide-details
        class="flex-grow-1 d-none" />

      <!-- INPUT GALERÍA / ARCHIVOS -->
      <v-file-input ref="fileInputGallery" accept="image/*" label="Seleccionar desde galería" prepend-icon="mdi-image"
        @change="onFileChange" show-size outlined multiple hide-details class="flex-grow-1 d-none" />

      <div class="my-1 d-flex" style="gap: 6px;"></div>
    </div>

    <v-row>
      <v-col v-for="(image, index) in galeria" :key="index" class="d-flex child-flex" cols="3">
        <v-img :src="image.base64 || image.url" aspect-ratio="1" class="bg-grey-lighten-2 photo-thumb" cover
          @click="openPreview(image.base64 || image.url)">
          <!-- Loader mientras carga -->
          <template #placeholder>
            <v-row class="fill-height ma-0" justify="center" align="center">
              <v-progress-circular color="grey-lighten-5" indeterminate />
            </v-row>
          </template>

          <!-- Botón de eliminar -->
          <template #default>
            <v-btn v-if="!disabled" icon size="x-small" color="red" class="ma-1 photo-remove-btn"
              style="position: absolute; top: 0; right: 0; z-index: 2;" @click.stop="removeImage(index)">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-img>
      </v-col>
    </v-row>
    <!-- Seccion de comentario -->
    <v-textarea v-if="showObservacion" v-model="localObs" label="Comentario General" rows="2" max-rows="3" auto-grow
      density="compact" variant="outlined" class="mt-2 bg-white compact-comment" :disabled="disabled" />

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
import { ref, watch } from 'vue'
import apiAxios from '@/services/api'

const API_BASE = (process.env.VUE_APP_API_BASE_URL || '').replace(/\/$/, '')

const props = defineProps({
  label: String,
  maxFotos: Number,
  obligatorioFotos: {
    type: Number,
    default: 0,   // 🔹 mínimo 0 por defecto
  },
  compression: Number,
  observacion: String,
  showObservacion: {
    type: Boolean,
    default: true,
  },
  galeria: {
    type: Array,
    default: () => []
  },
  disabled: Boolean,
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:galeria', 'update:observacion'])

// 👉 Dos refs: uno para cámara, otro para galería
const fileInputCamera = ref(null)
const fileInputGallery = ref(null)

const localObs = ref(props.observacion || '') // Ref local para comentario
const previewOpen = ref(false)
const previewSrc = ref('')

// 👉 Si cambia la prop desde el padre, reflejar en el campo local
watch(() => props.observacion, (val) => {
  if (val !== localObs.value) localObs.value = val ?? ''
})

// 👉 Cuando el usuario escribe, emite al padre
watch(localObs, (val) => {
  emit('update:observacion', val ?? '')
})

async function onFileChange(event) {
  const files = event.target.files
  if (!files || !files.length) return

  // Si quieres soportar múltiples archivos:
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue

    const reader = new FileReader()
    reader.onload = async (e) => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 800
        const scale = Math.min(1, maxWidth / img.width)

        canvas.width = img.width * scale
        canvas.height = img.height * scale

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const compressedDataUrl = canvas.toDataURL('image/jpeg', props.compression || 0.6)

        // Subimos el archivo primero y esperamos la respuesta
        const dataArchivo = await uploadFileFromBase64(compressedDataUrl, file.name, file.type)
        console.log('Archivo subido:', dataArchivo)
        const fileObj = dataArchivo?.data || dataArchivo?.archivo
        const idDoc = fileObj?.id_doc || null
        const interno = fileObj?.name_doc_interno || ''

        const nuevoObjeto = {
          base64: compressedDataUrl,
          id_doc: idDoc,
          url: idDoc
            ? `${API_BASE}/v1/storage/view/${idDoc}`
            : (interno ? `${API_BASE}/archivo/gsp/${interno}` : compressedDataUrl),
          nombre: interno || file.name,
        }

        if (props.galeria.length < props.maxFotos) {
          emit('update:galeria', [...props.galeria, nuevoObjeto])
        }
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  // Limpia el input para poder volver a seleccionar la misma foto si se quiere
  event.target.value = ''
}

function triggerInput(tipo) {
  // tipo: 'camera' o 'gallery'
  const wrapper =
    tipo === 'camera' ? fileInputCamera.value : fileInputGallery.value

  wrapper?.$el?.querySelector('input')?.click()
}

function removeImage(index) {
  const nuevaGaleria = [...props.galeria]
  nuevaGaleria.splice(index, 1)
  emit('update:galeria', nuevaGaleria)
}

function openPreview(src) {
  if (!src) return
  previewSrc.value = src
  previewOpen.value = true
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

    console.log('Archivo subido correctamente:', response.data)
    return response.data;
  } catch (error) {
    console.error('Error al subir archivo:', error)
    return null;
  }
}
</script>

<style scoped>
.photo-capture-title {
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 0;
  color: #2f3a45;
}

.photo-capture-card {
  border: 1px solid #c5d0dc;
  border-radius: 10px;
  background: #fff;
  padding: 8px;
  box-shadow: inset 0 0 0 1px #edf2f7;
}

.photo-action-btn {
  width: 30px;
  height: 30px;
}

.photo-head-row {
  display: grid;
  grid-template-columns: 3fr 1fr;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.photo-head-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.photo-thumb {
  border-radius: 8px;
  cursor: zoom-in;
}

.compact-comment :deep(textarea) {
  min-height: 70px !important;
}

.preview-card {
  border-radius: 12px;
}

.photo-remove-btn :deep(.v-icon) {
  font-size: 14px;
}

.photo-capture-card--compact {
  padding: 6px;
}

.photo-capture-card--compact .photo-head-row {
  margin-bottom: 4px;
}

.photo-capture-card--compact .photo-capture-title {
  font-size: 0.88rem;
}

.photo-capture-card--compact :deep(.v-row) {
  margin-top: 2px;
  margin-bottom: 2px;
}

input[type="file"] {
  display: block;
}
</style>


