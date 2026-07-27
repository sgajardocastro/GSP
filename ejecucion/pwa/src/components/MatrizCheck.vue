<template>
  <div class="py-2">
    <!-- CUERPO COMO TARJETAS -->
    <v-row dense>
      <v-col cols="12" v-for="(row, rIdx) in (attr.body || [])" :key="'row-' + rIdx">
        <v-card class="mcheck-card" variant="outlined">
          <!-- Pregunta numerada -->
          <div class="mcheck-question">
            <span class="mcheck-num">{{ rIdx + 1 }}.</span>
            <span class="mcheck-text">
              {{ getPreguntaValue(attr, rIdx) }}
            </span>
          </div>

          <v-row dense class="mt-2">
            <!-- IZQUIERDA: SI/NO/N/A + Observación -->
            <v-col cols="8" class="d-flex flex-column ga-2">
              <!-- Botones SI / NO / N/A -->
              <div class="mcheck-toggle-wrapper">
                <v-btn-toggle v-if="hasCheckCell(attr, rIdx)" v-model="attr.body[rIdx][getCheckIndex(attr)].value"
                  class="mcheck-toggle" density="compact" divided mandatory @update:modelValue="val => {
                    onCheckChange(attr.body[rIdx][getCheckIndex(attr)], val)
                    recomputeAndPersistMCheck(attr)
                    emit('change')
                  }">
                  <v-btn value="SI" size="small" class="mcheck-opt mcheck-opt-si">SI</v-btn>
                  <v-btn value="NO" size="small" class="mcheck-opt mcheck-opt-no">NO</v-btn>
                  <v-btn value="N/A" size="small" class="mcheck-opt mcheck-opt-na">N/A</v-btn>
                </v-btn-toggle>
              </div>

              <!-- Observación -->
              <v-text-field v-if="hasObsCell(attr, rIdx)" v-model="attr.body[rIdx][getObsIndex(attr)].value"
                label="Observación" density="compact" variant="underlined" hide-details />
            </v-col>

            <!-- DERECHA: Imagen -->
            <v-col cols="4" class="d-flex flex-column align-center justify-center">
              <template v-if="getImageCell(attr, rIdx)?.galeria?.length">
                <v-img :src="getImageCell(attr, rIdx).galeria[0].url || getImageCell(attr, rIdx).galeria[0].base64"
                  aspect-ratio="1" cover class="rounded-lg" style="width: 110px; height: 110px;">
                  <template #default>
                    <v-btn icon size="small" color="red" class="ma-2" style="position:absolute;top:0;right:0;z-index:2;"
                      @click.stop="removeImageMatriz(attr, rIdx, getImageIndex(attr))">
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </template>
                </v-img>

                <div class="mcheck-image-actions">
                  <v-btn icon size="small" variant="text" :disabled="!!getImageCell(attr, rIdx)?.galeria?.length"
                    @click="openCameraForCell(rIdx, getImageIndex(attr))" title="Tomar foto">
                    <v-icon>mdi-camera</v-icon>
                  </v-btn>

                  <v-btn icon size="small" variant="text" :disabled="!!getImageCell(attr, rIdx)?.galeria?.length"
                    @click="openGalleryForCell(rIdx, getImageIndex(attr))" title="Subir archivo">
                    <v-icon>mdi-image-outline</v-icon>
                  </v-btn>
                </div>

                <input :id="imageInputId(rIdx, getImageIndex(attr))" type="file" accept="image/*" capture="environment"
                  style="display:none" @change="e => onPickImageMatriz(e, attr, rIdx, getImageIndex(attr))" />
                <input :id="imageInputIdGallery(rIdx, getImageIndex(attr))" type="file" accept="image/*"
                  style="display:none" @change="e => onPickImageMatriz(e, attr, rIdx, getImageIndex(attr))" />
              </template>

              <template v-else>
                <div v-if="getImageIndex(attr) >= 0" class="mcheck-image-actions">
                  <v-btn icon size="small" variant="text"
                    @click="openCameraForCell(rIdx, getImageIndex(attr))" title="Tomar foto">
                    <v-icon>mdi-camera</v-icon>
                  </v-btn>
                  <v-btn icon size="small" variant="text"
                    @click="openGalleryForCell(rIdx, getImageIndex(attr))" title="Subir archivo">
                    <v-icon>mdi-image-outline</v-icon>
                  </v-btn>
                </div>
                <input v-if="getImageIndex(attr) >= 0" :id="imageInputId(rIdx, getImageIndex(attr))" type="file"
                  accept="image/*" capture="environment" style="display:none"
                  @change="e => onPickImageMatriz(e, attr, rIdx, getImageIndex(attr))" />
                <input v-if="getImageIndex(attr) >= 0" :id="imageInputIdGallery(rIdx, getImageIndex(attr))" type="file"
                  accept="image/*" style="display:none"
                  @change="e => onPickImageMatriz(e, attr, rIdx, getImageIndex(attr))" />
              </template>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- FOOTER DE PUNTAJE (resumen) -->
    <div class="mcheck-footer-summary">
      <div><strong>Puntaje Obtenido:</strong> {{ mcheckMetrics(attr).obtenido }}</div>
      <div><strong>Puntaje Máximo:</strong> {{ mcheckMetrics(attr).maximo }}</div>
      <div><strong>Desempeño:</strong> {{ mcheckMetrics(attr).desempeno }}</div>
    </div>
  </div>
</template>

<script setup>
import { toRef, onMounted, toRaw } from 'vue'
import apiAxios from '@/services/api'

const uniqueId = Math.random().toString(36).slice(2)

/* eslint-disable */

// ✅ Base de la API (misma que usa axios)
const API_BASE = (apiAxios.defaults?.baseURL || '').replace(/\/$/, '')
console.log('[MatrizCheck] API_BASE =', API_BASE)

/* ===== Props ===== */
const props = defineProps({
  attr: { type: Object, required: true }
})
const emit = defineEmits(['change'])
const attr = toRef(props, 'attr')

/* ===== Helpers visuales ===== */
const checkItems = ['SI', 'NO', 'N/A']
const isFalseyEditFlag = (v) => v === false || v === 'false' || v === 0 || v === '0'
const isEditable = (cell) => !isFalseyEditFlag(cell?.editable)

function onCheckChange(cell, val) {
  cell.value = (val ?? '').toString().trim().toUpperCase()
}

function onlyNumberKeypress(e) {
  const ch = e.key
  const ok = /[0-9.,]/.test(ch) || ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(ch)
  if (!ok) e.preventDefault()
}

function sanitizeNumber(cell) {
  let s = String(cell?.value ?? '').trim()
  if (s === '') { cell.value = ''; return }
  s = s.replace(/\s+/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(s)
  cell.value = Number.isFinite(n) ? n : ''
}
function cellAlign(cell) {
  const v = cell?.['text-align'] ?? cell?.textAlign ?? cell?.['text-aling']
  if (v === 'left') return 'left'
  if (v === 'right') return 'right'
  return 'center'
}

/* ===== Cálculo columnas / ancho ===== */
function sumCols(row = []) { return row.reduce((acc, c) => acc + (Number(c?.colspan) || 1), 0) }
function getLeafColCount(headers = [], body = []) {
  if (!Array.isArray(headers)) headers = []
  if (!Array.isArray(body)) body = []
  const first = headers[0] ? sumCols(headers[0]) : 0
  const last = headers[headers.length - 1] ? sumCols(headers[headers.length - 1]) : 0
  const byBody = body[0]?.length || 0
  return Math.max(first, last, byBody)
}
function makeEmptyRow(w) { return Array.from({ length: w }, () => ({ value: '' })) }
function normalizeBodyRows(body = [], w) {
  return body.map(r => {
    const row = Array.isArray(r) ? r.slice() : []
    if (row.length < w) return row.concat(Array.from({ length: w - row.length }, () => ({ value: '' })))
    if (row.length > w) return row.slice(0, w)
    return row
  })
}

/* ========== OCULTAR “Puntaje” (robusto con colspans) ========== */
// Expande la fila hoja del header a labels por índice de columna real
function leafLabels(localAttr) {
  const hdrs = localAttr?.headers || []
  const leaf = hdrs[hdrs.length - 1] || []
  const labels = []
  for (const c of leaf) {
    const span = Number(c?.colspan ?? 1) || 1
    const label = (c?.label ?? '').toString().trim().toLowerCase()
    for (let i = 0; i < span; i++) labels.push(label)
  }
  return labels
}
// Índices hoja a ocultar (todas las columnas “puntaje”)
function puntajeLeafIndexes(localAttr) {
  const labels = leafLabels(localAttr)
  const idxs = []
  labels.forEach((l, i) => { if (l === 'puntaje') idxs.push(i) })
  return idxs
}
function isHiddenLeafIndex(localAttr, idx) {
  const set = new Set(puntajeLeafIndexes(localAttr))
  return set.has(idx)
}
function hasPuntajeHeader(localAttr) {
  return puntajeLeafIndexes(localAttr).length > 0
}
function puntajeColIndex(localAttr) {
  const arr = puntajeLeafIndexes(localAttr)
  return arr.length ? arr[0] : -1
}
function puntajeColIndexVisible(localAttr) {
  return Math.max(puntajeColIndex(localAttr), 0)
}
function getVisibleColCount(localAttr) {
  const totalLeaf = leafLabels(localAttr).length
  const hidden = puntajeLeafIndexes(localAttr).length
  return Math.max(totalLeaf - hidden, 0)
}
// Para header (celda con label “puntaje”, sin importar colspan)
function isPuntajeHeaderCell(cell) {
  const lbl = (cell?.label ?? '').toString().trim().toLowerCase()
  return lbl === 'puntaje'
}
// Colgroup basado en la fila hoja, omitiendo “puntaje”
function columnWidths(localAttr) {
  const hdrs = localAttr?.headers || []
  const leaf = hdrs[hdrs.length - 1] || []
  const widths = []
  for (const cell of leaf) {
    const span = Number(cell?.colspan ?? 1) || 1
    const w = cell?.width || ''
    const lbl = (cell?.label ?? '').toString().trim().toLowerCase()
    if (lbl === 'puntaje') continue // omite todas sus “slots”
    for (let i = 0; i < span; i++) widths.push(w)
  }
  return widths
}

/* ===== IMAGEN ===== */
const imageInputId = (rIdx, cIdx) => `matrizcheck-img-input-${uniqueId}-${rIdx}-${cIdx}`
const imageInputIdGallery = (rIdx, cIdx) => `matrizcheck-img-gallery-input-${uniqueId}-${rIdx}-${cIdx}`
function openCameraForCell(rIdx, cIdx) {
  const el = document.getElementById(imageInputId(rIdx, cIdx))
  if (el) el.click()
}
function openGalleryForCell(rIdx, cIdx) {
  const el = document.getElementById(imageInputIdGallery(rIdx, cIdx))
  if (el) el.click()
}
function removeImageMatriz(localAttr, rIdx, cIdx) {
  const cell = localAttr.__editing ? localAttr.__draftBody?.[rIdx]?.[cIdx] : localAttr.body?.[rIdx]?.[cIdx]
  if (!cell) return
  cell.galeria = []
  cell.value = ''
}
async function onPickImageMatriz(event, localAttr, rIdx, cIdx) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || !file.type.startsWith('image/')) return
  const cell = localAttr.__editing ? localAttr.__draftBody?.[rIdx]?.[cIdx] : localAttr.body?.[rIdx]?.[cIdx]
  if (!cell) return
  const quality = (() => {
    const q = Number(cell.compression ?? 0.1)
    if (q <= 1) return Math.max(0.1, Math.min(1, q))
    return Math.max(0.1, Math.min(1, q / 100))
  })()
  try {
    const dataUrl = await compressImageToDataURL(file, quality, 800, 800)
    const dataArchivo = await uploadFileFromBase64(dataUrl, file.name, file.type)
    if (dataArchivo?.archivo?.name_doc_interno) {
      const interno = dataArchivo.archivo.name_doc_interno

      const obj = {
        // 🔹 guardamos el base64 por si la URL externa falla o para mostrar altiro
        base64: dataUrl,
        // 🔹 URL absoluta usando el mismo backend que apiAxios
        url: `${API_BASE}/archivo/transmac/${interno}`,
        nombre: interno
      }

      console.log('[MatrizCheck] URL FINAL FOTO =', obj.url)

      cell.galeria = [obj]
      // No escribir en value para no afectar "observación" si comparten col o visualizar texto feo
      // cell.value = obj.nombre || 'foto'
    }
  } catch (e) { console.error(e) }
}
function compressImageToDataURL(file, quality = 0.1, maxW = 800, maxH = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img
        const scale = Math.min(1, maxW / width, maxH / height)
        const w = Math.round(width * scale), h = Math.round(height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
function base64ToFile(base64, filename, mime) {
  const arr = base64.split(',')
  const bstr = atob(arr[1] || '')
  const u8 = new Uint8Array(bstr.length)
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
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
  formData.append('path_doc', '/u05/LeanDocs/transmac/')
  formData.append('id_user', 1)
  formData.append('estado', '1')
  try {
    const { data } = await apiAxios.post(
      '/archivo/imagen',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  } catch (e) { console.error('Upload error:', e); return null }
}

/* ===== Métricas (SI=10, NO=0, N/A no cuenta) ===== */
const MCHECK_MAX_PER_ITEM = 10
function normalizeCheck(v) {
  const s = (v ?? '').toString().trim().toLowerCase()
  if (['si', 'sí'].includes(s)) return 'si'
  if (s === 'no') return 'no'
  if (s === 'n/a' || s === 'na') return 'n/a'
  return s
}
function toNumber(val) {
  if (val === null || val === undefined) return 0
  const s = String(val).trim().replace(/\./g, '').replace(',', '.')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}
function mcheckMetrics(localAttr) {
  const rows = localAttr?.__editing ? (localAttr.__draftBody || []) : (localAttr?.body || [])
  const firstRow = rows?.[0] || []
  let checkIdx = firstRow.findIndex(c => (c?.type || '').toLowerCase() === 'check')
  if (checkIdx < 0) checkIdx = 0

  const maxPorItem = Number(localAttr.maxScore ?? localAttr.maxPuntaje ?? MCHECK_MAX_PER_ITEM)

  let obtenido = 0, maximo = 0
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    const chk = normalizeCheck(row?.[checkIdx]?.value)
    if (chk === 'si') {
      obtenido += maxPorItem
      maximo += maxPorItem
    } else if (chk === 'no') {
      maximo += maxPorItem
    }
  }
  const desempeno = maximo > 0 ? `${Math.round((obtenido / maximo) * 100)}%` : '0%'
  return { obtenido, maximo, desempeno }
}
function getMCheckColCount(localAttr) {
  const leafCount = leafLabels(localAttr).length
  return leafCount
}
// Compatibilidad
function getMCheckIndexes(localAttr) {
  const firstRow = (localAttr.__editing ? localAttr.__draftBody : localAttr.body)?.[0] || []
  let checkIdx = firstRow.findIndex(c => (c?.type || '').toLowerCase() === 'check')
  let numIdx = -1
  if (checkIdx < 0) checkIdx = 2
  return { checkIdx, numIdx }
}
function ensureFooter(localAttr) {
  if (!Array.isArray(localAttr.footer)) localAttr.footer = []
  const def = [
    { label: 'Puntaje Obtenido', value: 0, colspan: 2, puntajeObtenido: 0 },
    { label: 'Puntaje Máximo', value: 0, colspan: 2, puntajeMaximo: 0 },
    { label: 'Desempeño', value: '0%', colspan: 2, desempeno: '0%' }
  ]
  for (let i = 0; i < def.length; i++) {
    if (!localAttr.footer[i]) localAttr.footer[i] = { ...def[i] }
    localAttr.footer[i] = { ...def[i], ...localAttr.footer[i] }
  }
  return localAttr.footer
}
function recomputeAndPersistMCheck(localAttr) {
  const rows = localAttr?.__editing ? (localAttr.__draftBody || []) : (localAttr?.body || [])
  const firstRow = rows?.[0] || []
  let checkIdx = firstRow.findIndex(c => (c?.type || '').toLowerCase() === 'check')
  if (checkIdx < 0) checkIdx = 0
  const maxPorItem = Number(localAttr.maxPuntaje || localAttr.maxScore || 10)

  let obtenido = 0, maximo = 0
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    const c = (row?.[checkIdx]?.value ?? '').toString().trim().toUpperCase()
    if (c === 'SI') {
      obtenido += maxPorItem
      maximo += maxPorItem
    } else if (c === 'NO') {
      maximo += maxPorItem
    }
  }

  const porc = maximo > 0 ? Math.round((obtenido / maximo) * 100) : 0
  const f = ensureFooter(localAttr)
  f[0].value = obtenido; f[0].puntajeObtenido = obtenido
  f[1].value = maximo; f[1].puntajeMaximo = maximo
  f[2].value = `${porc}%`; f[2].desempeno = `${porc}%`; f[2].desempenoNum = porc
}

/* ===== Edición inline ===== */
function deepClone(o) { return o ? JSON.parse(JSON.stringify(o)) : o }
function ensureDraftForAttr(localAttr) {
  const body = Array.isArray(localAttr.body) ? localAttr.body : []
  localAttr.__draftBody = body.map(row =>
    (Array.isArray(row) ? row : []).map(cell => ({
      ...cell, value: cell?.value ?? ''
    }))
  )
  if (localAttr.__draftBody.length === 0) {
    localAttr.__draftBody = [[{ value: '', type: 'text', editable: true }]]
  }
}
function startInlineUpdate(localAttr) { ensureDraftForAttr(localAttr); localAttr.__editing = true }
function cancelInlineUpdate(localAttr) { localAttr.__editing = false; delete localAttr.__draftBody }
function acceptInlineUpdate(localAttr) {
  localAttr.body = deepClone(localAttr.__draftBody)
  localAttr.__editing = false
  delete localAttr.__draftBody
  recomputeAndPersistMCheck(localAttr)
}
function openAgregarFila(localAttr) {
  const w = getLeafColCount(localAttr.headers, localAttr.__editing ? localAttr.__draftBody : localAttr.body)
  if (localAttr.__editing) {
    localAttr.__draftBody ||= []
    localAttr.__draftBody = normalizeBodyRows(localAttr.__draftBody, w)
    localAttr.__draftBody.push(makeEmptyRow(w))
  } else {
    localAttr.body ||= []
    localAttr.body = normalizeBodyRows(localAttr.body, w)
    localAttr.body.push(makeEmptyRow(w))
  }
  recomputeAndPersistMCheck(localAttr)
}

// 2) helper para stringify seguro (evita ciclos y BigInt)
function safeStringify(obj) {
  const seen = new WeakSet()
  return JSON.stringify(
    obj,
    (k, v) => {
      if (typeof v === 'bigint') return v.toString()
      if (v && typeof v === 'object') {
        if (seen.has(v)) return '[Circular]'
        seen.add(v)
      }
      return v
    },
    2 // pretty print
  )
}

// --- helpers para limpiar el JSON sin tocar el template ---
function normLabel(x) {
  return (x ?? '')
    .toString()
    .replace(/\s+/g, ' ') // colapsa espacios / saltos
    .trim()
    .toLowerCase()
}

function findHeaderPuntajeIndex(localAttr) {
  const row0 = Array.isArray(localAttr?.headers?.[0]) ? localAttr.headers[0] : []
  return row0.findIndex(c => normLabel(c?.label) === 'puntaje')
}

function findHeaderNumeroIndex(localAttr) {
  const row0 = Array.isArray(localAttr?.headers?.[0]) ? localAttr.headers[0] : []
  return row0.findIndex(c => {
    const lbl = normLabel(c?.label)
    return (
      lbl === 'n°' ||
      lbl === 'nº' ||
      lbl === 'nro' ||
      lbl === 'número' ||
      lbl === 'n' ||
      lbl === 'no'
    )
  })
}

function stripNumeroColFromJson(localAttr) {
  if (!localAttr || typeof localAttr !== 'object') return

  const idx = findHeaderNumeroIndex(localAttr)
  if (idx < 0) return

  // 1) headers: quitamos la celda en ese índice en cada fila de header
  if (Array.isArray(localAttr.headers)) {
    localAttr.headers = localAttr.headers.map(row => {
      if (!Array.isArray(row)) return row
      const clone = row.slice()
      if (idx >= 0 && idx < clone.length) clone.splice(idx, 1)
      return clone
    })
  }

  // 2) body / draft: quitamos la columna idx en cada fila
  const removeIdxFromRows = (rows) => {
    if (!Array.isArray(rows)) return rows
    return rows.map(r =>
      Array.isArray(r) ? r.filter((_, i) => i !== idx) : r
    )
  }

  localAttr.body = removeIdxFromRows(localAttr.body)
  localAttr.__draftBody = removeIdxFromRows(localAttr.__draftBody)
}

function findNumberColIndex(localAttr) {
  const pick = (rows) => Array.isArray(rows) && rows[0]
    ? rows[0].findIndex(c => (c?.type || '').toLowerCase() === 'number')
    : -1
  const i1 = pick(localAttr?.body)
  if (i1 >= 0) return i1
  const i2 = pick(localAttr?.__draftBody)
  return i2
}

/** Quita "Puntaje" del header y la col "number" del body/draft (si existen). */
function stripPuntajeFromJson(localAttr) {
  if (!localAttr || typeof localAttr !== 'object') return

  // 1) header
  const hIdx = findHeaderPuntajeIndex(localAttr)
  if (hIdx >= 0 && Array.isArray(localAttr.headers?.[0])) {
    localAttr.headers[0].splice(hIdx, 1)
  }

  // 2) body / draft: por índice del header si existe; si no, por 1ra columna "number"
  const colIdx = hIdx >= 0 ? hIdx : findNumberColIndex(localAttr)
  if (colIdx >= 0) {
    if (Array.isArray(localAttr.body)) {
      localAttr.body = localAttr.body.map(r => Array.isArray(r) ? r.filter((_, i) => i !== colIdx) : r)
    }
    if (Array.isArray(localAttr.__draftBody)) {
      localAttr.__draftBody = localAttr.__draftBody.map(r => Array.isArray(r) ? r.filter((_, i) => i !== colIdx) : r)
    }
  }
}

function findPreguntaColIndex(localAttr) {
  const labels = leafLabels(localAttr) // ya existe
  const idx = labels.findIndex(l => l === 'elementos a inspeccionar')
  return idx >= 0 ? idx : 0  // fallback a 0 si no lo encuentra
}

function isPreguntaCol(localAttr, idx) {
  return idx === findPreguntaColIndex(localAttr)
}

function findObsColIndex(localAttr) {
  const labels = leafLabels(localAttr)
  // busca “observación” o “observacion”
  let idx = labels.findIndex(l => l === 'observación')
  if (idx < 0) idx = labels.findIndex(l => l === 'observacion')
  return idx
}

function findImageColIndex(localAttr) {
  const firstRow = localAttr?.body?.[0] || []
  // 1) por type: 'image'
  let idx = firstRow.findIndex(c => (c?.type || '').toLowerCase() === 'image')
  if (idx >= 0) return idx

  // 2) por label de header
  const labels = leafLabels(localAttr)
  idx = labels.findIndex(l => l === 'imagen')
  return idx
}

// índices reutilizables
function getCheckIndex(localAttr) {
  const { checkIdx } = getMCheckIndexes(localAttr)
  return checkIdx >= 0 ? checkIdx : 0
}
function getObsIndex(localAttr) {
  const idx = findObsColIndex(localAttr)
  return idx >= 0 ? idx : -1
}
function getImageIndex(localAttr) {
  const idx = findImageColIndex(localAttr)
  return idx >= 0 ? idx : -1
}

// ¿existe realmente la celda de check en esta fila?
function hasCheckCell(localAttr, rIdx) {
  const idx = getCheckIndex(localAttr)
  const row = localAttr.body?.[rIdx]
  return Array.isArray(row) && row[idx]
}

// ¿existe la celda de observación?
function hasObsCell(localAttr, rIdx) {
  const idx = getObsIndex(localAttr)
  if (idx < 0) return false
  const row = localAttr.body?.[rIdx]
  return Array.isArray(row) && row[idx]
}

// valor de pregunta para el texto de arriba
function getPreguntaValue(localAttr, rIdx) {
  const pIdx = findPreguntaColIndex(localAttr)
  const row = localAttr.body?.[rIdx]
  const cell = Array.isArray(row) ? row[pIdx] : null
  return cell?.value ?? ''
}

// celda de imagen para el template
function getImageCell(localAttr, rIdx) {
  const idx = getImageIndex(localAttr)
  if (idx < 0) return null
  const row = localAttr.body?.[rIdx]
  return Array.isArray(row) ? row[idx] || null : null
}

/* ===== Init ===== */
onMounted(() => {
  const rawAttr = toRaw(attr.value)
  console.log('MatrizCheck mounted (raw JSON):\n', safeStringify(rawAttr))

  stripNumeroColFromJson(attr.value)
  stripPuntajeFromJson(attr.value)
  ensureFooter(attr.value)
  recomputeAndPersistMCheck(attr.value)
  // no usamos startInlineUpdate, editamos directo sobre body
})
</script>

<style scoped>
.img-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.img-empty {
  display: flex;
  justify-content: center;
}

.mcheck-card {
  margin-bottom: 8px;
  padding: 8px 12px;
}

.mcheck-question {
  display: flex;
  gap: 4px;
  font-size: 0.9rem;
  font-weight: 500;
}

.mcheck-num {
  font-weight: 700;
}

.mcheck-text {
  flex: 1;
}

.mcheck-toggle-wrapper {
  display: flex;
  justify-content: flex-start;
}

.mcheck-toggle {
  display: flex;
  justify-content: flex-start;
  gap: 4px;
  border: 1px solid #c7d2e5;
  border-radius: 10px;
  background: #e9eef8;
  padding: 2px;
}

.mcheck-toggle :deep(.v-btn) {
  min-width: 56px;
  font-weight: 700;
  color: #25334d;
  background: #ffffff;
  border: 1px solid #d5dcea;
  border-radius: 8px;
  text-transform: none;
}

.mcheck-toggle :deep(.v-btn--active) {
  color: #ffffff !important;
  border-color: transparent !important;
}

.mcheck-toggle :deep(.mcheck-opt-si.v-btn--active) {
  background: #15803d !important;
}

.mcheck-toggle :deep(.mcheck-opt-no.v-btn--active) {
  background: #b91c1c !important;
}

.mcheck-toggle :deep(.mcheck-opt-na.v-btn--active) {
  background: #334155 !important;
}

.mcheck-footer-summary {
  margin-top: 12px;
  font-size: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 4px 12px;
}

.mcheck-image-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
