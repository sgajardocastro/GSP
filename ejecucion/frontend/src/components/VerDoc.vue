<template>
  <div class="ver-doc-container">
    <!-- Encabezado con título y botones -->
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-subtitle-2 text-truncate mr-2">
        {{ displayLabel }}
      </div>
      <div>
        <v-btn
          color="deep-purple-accent-3"
          variant="text"
          size="small"
          prepend-icon="mdi-download"
          :disabled="loading || !downloadUrl"
          :href="downloadUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Descargar
        </v-btn>
      </div>
    </div>

    <!-- Alerta de error -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-2"
    >
      {{ error }}
    </v-alert>

    <!-- Visualizador (Iframe) -->
    <v-expand-transition>
      <div
        v-if="downloadUrl"
        class="preview-box"
      >
        <template v-if="loading">
          <div class="d-flex align-center justify-center py-5">
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>
        </template>

        <template v-else>
          <!-- Viewer para Office (Excel, Word) -->
          <iframe
            v-if="isOffice"
            :src="officeViewerUrl"
            width="100%"
            height="800px"
            frameborder="0"
            class="rounded border"
          />

          <!-- Contenido HTML Puro (sin iframe para evitar scroll si es posible) -->
          <div
            v-else-if="isHtml"
            class="html-embedded"
            v-html="htmlContent"
          />

          <!-- Viewer directo (PDF, TXT en iframe) -->
          <iframe
            v-else-if="isPdf || isText"
            :src="downloadUrl"
            width="100%"
            height="800px"
            frameborder="0"
            class="rounded border"
          />

          <!-- Imagen directa -->
          <v-img
            v-else-if="isImage"
            :src="downloadUrl"
            max-height="800"
            contain
            class="rounded border bg-grey-lighten-4"
          />

          <!-- Fallback para desconocidos -->
          <div
            v-else
            class="text-center py-5 text-grey"
          >
            <v-icon
              size="40"
              class="mb-2"
            >
              mdi-file-question
            </v-icon>
            <div>No hay vista previa disponible para este formato.</div>
          </div>
        </template>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import apiAxios from '@/services/api'

const props = defineProps({
    attr: {
        type: Object,
        required: true
    }
})

// Estado local
const loading = ref(false)
const error = ref('')
const meta = ref(null)
const downloadUrl = ref('')
const htmlContent = ref('')

// Base URL

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

// Computed para el texto
const displayLabel = computed(() => {
    if (meta.value?.name_doc_orig) return meta.value.name_doc_orig
    if (props.attr.label) return props.attr.label
    return 'Documento'
})

// Detección de tipos
const extension = computed(() => {
    if (!downloadUrl.value) return ''
    const parts = downloadUrl.value.split('.')
    if (parts.length < 2) return ''
    return parts.pop().toLowerCase()
})

const isOffice = computed(() => ['xls', 'xlsx', 'doc', 'docx', 'ppt', 'pptx'].includes(extension.value))
const isPdf = computed(() => extension.value === 'pdf')
const isImage = computed(() => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension.value))
const isText = computed(() => ['txt'].includes(extension.value))
const isHtml = computed(() => ['html', 'htm'].includes(extension.value))

const officeViewerUrl = computed(() => {
    // Microsoft Office Viewer requiere URL codificada
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl.value)}`
})

function badEncodingScore(text) {
    const replacement = (text.match(/\uFFFD/g) || []).length
    const mojibake = (text.match(/Ã.|Â|â€|â€™|â€œ|â€“|â€”/g) || []).length
    return replacement * 3 + mojibake
}

function decodeBytes(bytes, encoding) {
    try {
        return new TextDecoder(encoding).decode(bytes)
    } catch (e) {
        return ''
    }
}

function detectCharsetFromHead(bytes) {
    const head = new TextDecoder('utf-8').decode(bytes.slice(0, 4096))
    const m = head.match(/charset\s*=\s*["']?\s*([a-zA-Z0-9._-]+)/i)
    return m?.[1]?.toLowerCase?.() || ''
}

function sanitizeHtmlForEmbed(rawHtml) {
    let html = String(rawHtml || '').replace(/^\uFEFF/, '')
    html = html.replace(/^\s*\?+\s*(?=<|$)/, '')

    try {
        const doc = new DOMParser().parseFromString(html, 'text/html')
        const headStyles = Array.from(doc?.head?.querySelectorAll('style, link[rel="stylesheet"]') || [])
            .map(node => node.outerHTML)
            .join('\n')
        const bodyHtml = doc?.body?.innerHTML?.trim()
        if (bodyHtml) {
            return `${headStyles}\n${bodyHtml}`
        }
    } catch (_) {
        // fallback al contenido original saneado
    }

    return html
}

async function fetchHtmlWithBestDecoding(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Error cargando contenido HTML')

    const buffer = await res.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    const headerType = (res.headers.get('content-type') || '').toLowerCase()
    const headerCharsetMatch = headerType.match(/charset=([a-z0-9._-]+)/i)
    const headerCharset = headerCharsetMatch?.[1]?.toLowerCase?.() || ''
    const metaCharset = detectCharsetFromHead(bytes)

    const candidateEncodings = [
        headerCharset,
        metaCharset,
        'utf-8',
        'windows-1252',
        'iso-8859-1'
    ].filter(Boolean)

    const uniqueEncodings = [...new Set(candidateEncodings)]
    let bestText = ''
    let bestScore = Number.POSITIVE_INFINITY

    for (const enc of uniqueEncodings) {
        const decoded = decodeBytes(bytes, enc)
        if (!decoded) continue
        const score = badEncodingScore(decoded)
        if (score < bestScore) {
            bestScore = score
            bestText = decoded
        }
    }

    return bestText || decodeBytes(bytes, 'utf-8')
}

// const canView = computed(() => isOffice.value || isPdf.value || isImage.value || isText.value)

async function fetchDoc() {
    const id = Number(props.attr.id_doc || 0)
    if (!id) return

    loading.value = true
    error.value = ''
    meta.value = null
    downloadUrl.value = ''

    try {
        const resp = await apiAxios.get(`/servicio/leanglobal/obtenerTFMGFile?id_doc=${id}`)
        const row = Array.isArray(resp.data) ? resp.data[0] : resp.data

        if (!row) throw new Error('Documento no encontrado')
        if (!row.name_doc_interno) throw new Error('Documento sin name_doc_interno')

        // Construye URL
        const finalUrl = `${API_BASE}/archivo/transmac/${row.name_doc_interno}`
        downloadUrl.value = finalUrl
        meta.value = row

        // Obtener extension para chequear HTML
        const ext = row.name_doc_interno?.split('.').pop()?.toLowerCase() || ''

        // Si es HTML, realizar fetch del contenido
        if (['html', 'htm'].includes(ext)) {
            try {
                const rawHtml = await fetchHtmlWithBestDecoding(finalUrl)
                htmlContent.value = sanitizeHtmlForEmbed(rawHtml)
            } catch (err) {
                console.error("No se pudo cargar HTML raw", err);
                // Fallback?
            }
        }

    } catch (e) {
        error.value = e?.message || 'Error obteniendo documento'
    } finally {
        loading.value = false
    }
}

// Cargar al montar
onMounted(() => {
    fetchDoc()
})

// Recargar si cambia el id_doc
watch(() => props.attr.id_doc, (newId) => {
    if (newId) {
        fetchDoc()
    }
})
</script>

<style scoped>
.preview-box {
    background-color: #f5f5f5;
    padding: 8px;
    border-radius: 8px;
    margin-top: 8px;
}

@media print {
    .ver-doc-container {
        break-after: auto;
        page-break-after: auto;
        break-inside: auto;
        page-break-inside: auto;
        display: block;
    }

    .preview-box {
        break-inside: auto;
        page-break-inside: auto;
    }

    iframe {
        height: 680px !important;
    }
}
</style>
