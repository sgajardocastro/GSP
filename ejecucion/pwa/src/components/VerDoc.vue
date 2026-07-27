<template>
    <div>
        <!-- Botón de descarga -->
        <div class="d-flex justify-start">
            <v-btn color="deep-purple-accent-3" variant="tonal" size="small" class="text-uppercase"
                :disabled="loading || opening || !downloadUrl" @click="openDocument">
                <v-icon start icon="mdi-download" />
                {{ displayLabel }}
            </v-btn>
        </div>

        <!-- Alerta de error -->
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2">
            {{ error }}
        </v-alert>
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
const opening = ref(false)
const error = ref('')
const meta = ref(null)
const downloadUrl = ref('')

// Computed para el texto del botón
const displayLabel = computed(() => {
    if (meta.value?.name_doc_orig) return meta.value.name_doc_orig
    if (props.attr.label) return props.attr.label
    return 'DESCARGAR'
})

// Base URL (igual que en InspeccionBHP)
const API_BASE =
    (import.meta?.env?.VITE_API_BASE_URL ||
        import.meta?.env?.VUE_APP_API_BASE_URL ||
        process?.env?.VUE_APP_API_BASE_URL ||
        '')
        .replace(/\/$/, '')

function badEncodingScore(text) {
    const replacements = (text.match(/\uFFFD/g) || []).length
    const suspicious = (text.match(/[ÃÂ�]/g) || []).length
    return replacements * 5 + suspicious
}

function detectCharsetFromHead(bytes) {
    const head = new TextDecoder('latin1').decode(bytes.slice(0, 4096))
    const charsetMatch = head.match(/<meta[^>]*charset\s*=\s*["']?\s*([a-zA-Z0-9._-]+)/i)
    if (charsetMatch?.[1]) return charsetMatch[1].toLowerCase()

    const httpEquivMatch = head.match(/<meta[^>]*http-equiv=["']content-type["'][^>]*content=["'][^"']*charset=([a-zA-Z0-9._-]+)/i)
    return httpEquivMatch?.[1]?.toLowerCase() || ''
}

function decodeWithBestCharset(bytes, contentType = '') {
    const headerCharset = (contentType.match(/charset=([a-zA-Z0-9._-]+)/i)?.[1] || '').toLowerCase()
    const metaCharset = detectCharsetFromHead(bytes)

    const candidates = [...new Set([headerCharset, metaCharset, 'utf-8', 'windows-1252', 'iso-8859-1'].filter(Boolean))]
    let bestText = ''
    let bestScore = Number.POSITIVE_INFINITY

    for (const charset of candidates) {
        try {
            const decoded = new TextDecoder(charset, { fatal: false }).decode(bytes)
            const score = badEncodingScore(decoded)
            if (score < bestScore) {
                bestScore = score
                bestText = decoded
            }
        } catch (_) {
            // Intentamos con el siguiente charset
        }
    }

    return bestText || new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

function forceUtf8Meta(html) {
    if (/<meta[^>]*charset=/i.test(html)) {
        return html.replace(/<meta[^>]*charset\s*=\s*["']?[a-zA-Z0-9._-]+["']?[^>]*>/i, '<meta charset="utf-8">')
    }

    if (/<head[^>]*>/i.test(html)) {
        return html.replace(/<head[^>]*>/i, (m) => `${m}<meta charset="utf-8">`)
    }

    return `<meta charset="utf-8">${html}`
}

function getFileName() {
    return String(meta.value?.name_doc_interno || meta.value?.name_doc_orig || '')
}

function isHtmlFile() {
    const filename = getFileName().toLowerCase()
    return filename.endsWith('.html') || filename.endsWith('.htm')
}

async function openDocument() {
    if (!downloadUrl.value) return

    error.value = ''
    if (!isHtmlFile()) {
        window.open(downloadUrl.value, '_blank', 'noopener,noreferrer')
        return
    }

    opening.value = true
    try {
        const response = await apiAxios.get(downloadUrl.value, { responseType: 'arraybuffer' })
        const bytes = new Uint8Array(response.data)
        const decodedHtml = decodeWithBestCharset(bytes, response.headers?.['content-type'] || '')
        const htmlUtf8 = forceUtf8Meta(decodedHtml)
        const blob = new Blob([htmlUtf8], { type: 'text/html;charset=utf-8' })
        const blobUrl = URL.createObjectURL(blob)

        window.open(blobUrl, '_blank', 'noopener,noreferrer')
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60 * 1000)
    } catch (e) {
        error.value = 'No se pudo abrir el documento HTML'
    } finally {
        opening.value = false
    }
}

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

        // URL Absoluta
        downloadUrl.value = `${API_BASE}/archivo/transmac/${row.name_doc_interno}`
        meta.value = row
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
watch(
    () => props.attr.id_doc,
    (newId) => {
        if (newId) fetchDoc()
    }
)
</script>
