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
              <!-- La penúltima columna (ΔT) es calculada: no editable -->
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
  // Recibe el objeto attr del JSON (reactivo)
  attr: { type: Object, required: true }
})
const attr = toRef(props, 'attr')

/* =============== Utils de columnas ================= */

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
  const idxHR    = findColIndex(['% de húmedad', '% de humedad', '(hr)'])
  const idxTs    = findColIndex(['temperatura de superficie', '(ts)'])
  const idxTa    = findColIndex(['temperatura aire', '(ta)'])
  const idxTd    = findColIndex(['punto de rocío', 'punto de rocio', '(td)'])
  const idxDelta = findColIndex(['diferencia', '(t∆)', 't∆'])
  const idxHora  = findColIndex(['hora de medición', 'hora de medicion'])
  return { idxHR, idxTs, idxTa, idxTd, idxDelta, idxHora }
}

function isComputedCol(cIdx) {
  const { idxDelta } = columnMap()
  return cIdx === idxDelta
}

/* =============== Helpers de tabla ================= */

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
    if (row.length < width) {
      return row.concat(Array.from({ length: width - row.length }, () => ({ value: '' })))
    } else if (row.length > width) {
      return row.slice(0, width)
    }
    return row
  })
}

function toNum(v) {
  const n = parseFloat(String(v).toString().replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function round(n, d = 2) {
  const p = Math.pow(10, d)
  return Math.round(n * p) / p
}

/* =============== Cálculo ================= */

// ΔT = Ts − Td
function recomputeAll() {
  const { idxTs, idxTd, idxDelta } = columnMap()
  if ([idxTs, idxTd, idxDelta].some(i => i < 0)) return

  const rows = attr.value.__editing ? (attr.value.__draftBody || []) : (attr.value.body || [])

  rows.forEach(row => {
    const Ts = toNum(row[idxTs]?.value)
    const Td = toNum(row[idxTd]?.value)
    const delta = Ts - Td
    if (row[idxDelta]) row[idxDelta].value = round(delta, 2)
  })
}

/* =============== Acciones ================= */

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

  // Asegura último recálculo antes de guardar
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
