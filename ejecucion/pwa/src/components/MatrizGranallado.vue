<template>
  <div>
    <v-table density="compact" class="text-caption" fixed-header>
      <!-- CABECERA -->
      <thead>
        <tr v-for="(hdrRow, rIdx) in (attr.headers || [])" :key="'hdr-' + rIdx">
          <th
            v-for="(cell, cIdx) in hdrRow"
            :key="'hdr-cell-' + rIdx + '-' + cIdx"
            class="text-center"
            :rowspan="cell.rowspan || 1"
            :colspan="cell.colspan || 1"
            style="vertical-align: middle; font-weight: 600;"
          >
            {{ cell.label }}
          </th>
        </tr>
      </thead>

      <!-- CUERPO -->
      <tbody>
        <tr
          v-for="(row, rIdx) in (attr.__editing ? attr.__draftBody : (attr.body || []))"
          :key="'row-' + rIdx"
        >
          <td
            v-for="(cell, cIdx) in row"
            :key="'cell-' + rIdx + '-' + cIdx"
            class="text-center"
          >
            <template v-if="attr.__editing">
              <!-- Promedio: calculado, no editable -->
              <span v-if="isComputedCol(cIdx)">{{ cell?.value ?? '' }}</span>

              <!-- Otras columnas editables -->
              <v-text-field
                v-else
                v-model="attr.__draftBody[rIdx][cIdx].value"
                density="compact"
                variant="underlined"
                hide-details
                @input="recomputeAll()"
              />
            </template>

            <template v-else>
              {{ cell?.value ?? '' }}
            </template>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- ACCIONES -->
    <div class="mt-2 d-flex ga-2">
      <template v-if="attr.__editing">
        <v-btn size="small" variant="text" @click="cancelInlineUpdate()">Cancelar</v-btn>
        <v-btn size="small" color="primary" @click="acceptInlineUpdate()">Aceptar</v-btn>
      </template>

      <template v-else>
        <v-btn size="small" color="primary" @click="startInlineUpdate()">Editar</v-btn>
        <v-btn size="small" @click="openAgregarFila()">Agregar fila</v-btn>
      </template>
    </div>
  </div>
</template>

<script setup>
import { toRef } from 'vue'

const props = defineProps({
  attr: { type: Object, required: true }
})
const attr = toRef(props, 'attr')

/* ================= Utils columnas ================= */

function norm(s = '') {
  return String(s).toLowerCase().replace(/\s+/g, ' ').trim()
}

function leafHeaderLabels() {
  const hs = Array.isArray(attr.value.headers) ? attr.value.headers : []
  const last = hs[hs.length - 1] || []
  return last.map(c => c?.label ?? '')
}

function findColIndex(aliasList) {
  const lbls = leafHeaderLabels().map(norm)
  for (let i = 0; i < lbls.length; i++) {
    const lbl = lbls[i]
    if (aliasList.some(a => lbl.includes(a))) return i
  }
  return -1
}

function columnMap() {
  const idxN    = findColIndex(['n° de medición', 'n° de medicion', 'n de medicion'])
  const idx0    = findColIndex(['0°', '0 º', '0 '])
  const idx90   = findColIndex(['90°', '90 º', '90 '])
  const idx180  = findColIndex(['180°', '180 º', '180'])
  const idx270  = findColIndex(['270°', '270 º', '270'])
  const idxProm = findColIndex(['promedio'])
  return { idxN, idx0, idx90, idx180, idx270, idxProm }
}

function isComputedCol(cIdx) {
  const { idxProm } = columnMap()
  return cIdx === idxProm
}

/* ================= Helpers tabla ================= */

function sumCols(row = []) {
  return row.reduce((acc, c) => acc + (Number(c?.colspan) || 1), 0)
}
function getLeafColCount(headers = [], body = []) {
  if (!Array.isArray(headers)) headers = []
  if (!Array.isArray(body)) body = []
  const first = headers[0] ? sumCols(headers[0]) : 0
  const last  = headers[headers.length - 1] ? sumCols(headers[headers.length - 1]) : 0
  const byBody = body[0]?.length || 0
  return Math.max(first, last, byBody)
}
function tableWidth() {
  return getLeafColCount(attr.value.headers, attr.value.body)
}
function makeEmptyRow(width) {
  return Array.from({ length: width }, () => ({ value: '' }))
}
function normalizeBodyRows(body = [], width) {
  return body.map(r => {
    const row = Array.isArray(r) ? r.slice() : []
    if (row.length < width) return row.concat(Array.from({ length: width - row.length }, () => ({ value: '' })))
    if (row.length > width) return row.slice(0, width)
    return row
  })
}
function toNum(v) {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return isNaN(n) ? null : n
}
function round(n, d = 2) {
  const p = Math.pow(10, d)
  return Math.round(n * p) / p
}

/* ================= Cálculo ================= */

// Promedio por fila: media de valores válidos en 0°, 90°, 180°, 270°
function recomputeAll() {
  const { idx0, idx90, idx180, idx270, idxProm } = columnMap()
  if ([idx0, idx90, idx180, idx270, idxProm].some(i => i < 0)) return

  const rows = attr.value.__editing ? (attr.value.__draftBody || []) : (attr.value.body || [])

  rows.forEach(row => {
    const vals = [row[idx0]?.value, row[idx90]?.value, row[idx180]?.value, row[idx270]?.value]
      .map(toNum)
      .filter(v => v !== null)

    const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0
    if (row[idxProm]) row[idxProm].value = round(avg, 2)
  })
}

/* ================= Acciones ================= */

function startInlineUpdate () {
  const width = tableWidth()
  const base = Array.isArray(attr.value.body) ? attr.value.body : []

  attr.value.__draftBody = normalizeBodyRows(JSON.parse(JSON.stringify(base)), width)
  if (attr.value.__draftBody.length === 0) {
    attr.value.__draftBody.push(makeEmptyRow(width))
  }

  attr.value.__editing = true
  recomputeAll()
}

function acceptInlineUpdate () {
  const draft = Array.isArray(attr.value.__draftBody) ? attr.value.__draftBody : []
  const width = getLeafColCount(attr.value.headers, draft)
  const safeDraft = normalizeBodyRows(draft, width)

  // último recálculo antes de guardar
  recomputeAll()
  attr.value.body = JSON.parse(JSON.stringify(safeDraft))

  delete attr.value.__draftBody
  delete attr.value.__editing
}

function cancelInlineUpdate () {
  delete attr.value.__draftBody
  delete attr.value.__editing
}

function openAgregarFila () {
  // Detecta si el body estaba vacío ANTES de entrar en edición
  const wasEmpty = !Array.isArray(attr.value.body) || attr.value.body.length === 0

  // si no está editando, entra a edición (aquí se crea la 1ª fila si estaba vacío)
  if (!attr.value.__editing) startInlineUpdate()

  const width = getLeafColCount(attr.value.headers, attr.value.__draftBody)
  attr.value.__draftBody ||= []
  attr.value.__draftBody = normalizeBodyRows(attr.value.__draftBody, width)

  // 👉 Solo agrega una fila extra si NO era la primera vez
  if (!wasEmpty) {
    attr.value.__draftBody.push(makeEmptyRow(width))
  }

  // Recalcular luego de agregar
  recomputeAll()
}
</script>
