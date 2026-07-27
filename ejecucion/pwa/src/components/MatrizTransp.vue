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
              <v-text-field
                v-model="attr.__draftBody[rIdx][cIdx].value"
                density="compact"
                variant="underlined"
                hide-details
                @input="recomputeTotal()"
              />
            </template>
            <template v-else>
              {{ cell?.value ?? '' }}
            </template>
          </td>
        </tr>
      </tbody>

      <!-- FOOTER: 'TOTAL METRO LINEALES' -->
      <tfoot>
        <tr>
          <td
            :colspan="Math.max(1, headerCount - 1)"
            class="text-right font-weight-bold"
            style="vertical-align: middle;"
          >
            {{ footerLabel }}
          </td>
          <td class="text-right font-weight-bold">
            {{ footerTotal }}
          </td>
        </tr>
      </tfoot>
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
import { toRef, computed } from 'vue'

const props = defineProps({
  attr: { type: Object, required: true }
})
const attr = toRef(props, 'attr')

/* ======== Utilidades ======== */
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()

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

const idxLargo = computed(() =>
  findColIndex(['largo (m', 'largo', '(m)'])
)

const headerCount = computed(() => leafHeaderLabels().length)

const footerLabel = computed(() => {
  ensureFooter()
  // Usa el label que venga o el default
  return attr.value.footer?.[0]?.label || 'TOTAL METRO LINEALES ='
})

const footerTotal = computed(() => {
  ensureFooter()
  return attr.value.footer?.[0]?.value ?? 0
})

function toNum(v) {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function round(n, d = 2) {
  const p = Math.pow(10, d)
  return Math.round(n * p) / p
}

function ensureFooter() {
  if (!attr.value.footer || !Array.isArray(attr.value.footer) || attr.value.footer.length === 0) {
    attr.value.footer = [{
      label: 'TOTAL METRO LINEALES = ',
      value: 0,
      totalLargo: 0
    }]
  }
}

/* ======== Normalización tabla ======== */
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

/* ======== Cálculo total ======== */
function recomputeTotal() {
  ensureFooter()
  const col = idxLargo.value
  if (col < 0) return

  const rows = attr.value.__editing ? (attr.value.__draftBody || []) : (attr.value.body || [])
  const total = rows.reduce((acc, row) => acc + toNum(row?.[col]?.value), 0)

  attr.value.footer[0].totalLargo = round(total, 2)
  attr.value.footer[0].value = round(total, 2) // lo mostramos aquí mismo
}

/* ======== Acciones ======== */
function startInlineUpdate () {
  const width = tableWidth()
  const base = Array.isArray(attr.value.body) ? attr.value.body : []

  // Draft sin insertar filas nuevas
  attr.value.__draftBody = normalizeBodyRows(JSON.parse(JSON.stringify(base)), width)

  // ❌ Quita estas dos líneas que agregaban la primera fila
  // if (attr.value.__draftBody.length === 0) {
  //   attr.value.__draftBody.push(makeEmptyRow(width))
  // }

  attr.value.__editing = true
  recomputeTotal()
}

function acceptInlineUpdate () {
  const draft = Array.isArray(attr.value.__draftBody) ? attr.value.__draftBody : []
  const width = getLeafColCount(attr.value.headers, draft)
  const safeDraft = normalizeBodyRows(draft, width)

  // aseguro último cálculo antes de guardar
  recomputeTotal()
  attr.value.body = JSON.parse(JSON.stringify(safeDraft))

  delete attr.value.__draftBody
  delete attr.value.__editing
}

function cancelInlineUpdate () {
  delete attr.value.__draftBody
  delete attr.value.__editing
  // recalcula desde body por si había valores
  recomputeTotalFromBody()
}

function openAgregarFila () {
  if (!attr.value.__editing) startInlineUpdate()

  const width = getLeafColCount(attr.value.headers, attr.value.__draftBody)
  attr.value.__draftBody ||= []
  attr.value.__draftBody = normalizeBodyRows(attr.value.__draftBody, width)
  attr.value.__draftBody.push(makeEmptyRow(width))  // ← agrega 1 sola
  recomputeTotal()
}

function recomputeTotalFromBody() {
  const col = idxLargo.value
  if (col < 0) return
  const total = (attr.value.body || []).reduce((acc, row) => acc + toNum(row?.[col]?.value), 0)
  ensureFooter()
  attr.value.footer[0].totalLargo = round(total, 2)
  attr.value.footer[0].value = round(total, 2)
}

// calcula una vez por si ya viene data en body
recomputeTotalFromBody()
</script>
