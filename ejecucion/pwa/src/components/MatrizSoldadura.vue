<!-- src/components/MatrizSoldadura.vue -->
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
              <!-- Columna 'TIPO DEFECTO' -> combo -->
              <v-select
                v-if="isDefectCol(cIdx)"
                v-model="attr.__draftBody[rIdx][cIdx].value"
                :items="defectItems()"
                item-title="label"
                item-value="value"
                density="compact"
                hide-details
                variant="underlined"
                clearable
              />

              <!-- Otras columnas -->
              <v-text-field
                v-else
                v-model="attr.__draftBody[rIdx][cIdx].value"
                :type="isNumericCol(cIdx) ? 'number' : 'text'"
                inputmode="decimal"
                step="any"
                density="compact"
                variant="underlined"
                hide-details
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

/* ====== Column helpers ====== */
function norm(s=''){ return String(s).toLowerCase().replace(/\s+/g,' ').trim() }
function leafHeaderLabels(){
  const hs = Array.isArray(attr.value.headers) ? attr.value.headers : []
  const last = hs[hs.length - 1] || []
  return last.map(c => c?.label ?? '')
}
function findColIndex(aliases){
  const lbls = leafHeaderLabels().map(norm)
  for (let i=0;i<lbls.length;i++){
    if (aliases.some(a => lbls[i].includes(a))) return i
  }
  return -1
}
const colIdx = () => ({
  idxSector: findColIndex(['sector']),
  idxEsp: findColIndex(['espesor']),
  idxIqiReq: findColIndex(['iqi requerido']),
  idxIqiObt: findColIndex(['iqi obtenido']),
  idxDen: findColIndex(['densidad']),
  idxDef: findColIndex(['tipo defecto']),
  idxCalif: findColIndex(['calif']),
  idxObs: findColIndex(['observaciones'])
})
function isDefectCol(cIdx){ return cIdx === colIdx().idxDef }
function isNumericCol(cIdx){
  const { idxEsp, idxIqiReq, idxIqiObt, idxDen } = colIdx()
  return [idxEsp, idxIqiReq, idxIqiObt, idxDen].includes(cIdx)
}

/* ====== Defect options ======
   Si colocas opciones en headers[0][colDef].options, se usan esas.
   Si no, se usan estas por defecto (código -> descripción). */
const DEFAULT_DEFECTS = [
  { value: 'P',    label: 'P — POROS' },
  { value: 'HB',   label: 'HB — POROS VERMICULARES' },
  { value: 'CP',   label: 'CP — POROS AGRUPADOS' },
  { value: 'ESI',  label: 'ESI — ESCORIA ALINEADA' },
  { value: 'ISI',  label: 'ISI — ESCORIA IRREGULAR' },
  { value: 'IF',   label: 'IF — FALTA DE FUSIÓN' },
  { value: 'IP',   label: 'IP — FALTA DE PENETRACIÓN' },
  { value: 'C-GL', label: 'C — GRIETA LONGITUDINAL' },
  { value: 'C-GT', label: 'C — GRIETA TRANSVERSAL' },
  { value: 'EU',   label: 'EU — MORDEDURA EXTERNA' },
  { value: 'IU',   label: 'IU — MORDEDURA INTERNA' },
  { value: 'H/O',  label: 'H/O — INCLUSIÓN FLUX' },
  { value: 'IC',   label: 'IC — CRÁTER / RECHUPE' },
  { value: 'OT',   label: 'OT — OTROS DEFECTOS' },
  { value: 'BT',   label: 'BT — RECALENTÓN' },
]
function defectItems(){
  const { idxDef } = colIdx()
  const headerDef = attr.value?.headers?.[0]?.[idxDef]
  const opts = headerDef?.options
  if (Array.isArray(opts) && opts.length){
    // Normaliza a {label, value}
    return opts.map(o => ({
      value: o.value ?? o.id ?? o.code ?? o,
      label: o.label ?? o.text ?? o.name ?? String(o)
    }))
  }
  return DEFAULT_DEFECTS
}

/* ====== Table helpers ====== */
function sumCols(row=[]){ return row.reduce((a,c)=>a+(Number(c?.colspan)||1),0) }
function getLeafColCount(headers=[], body=[]){
  if (!Array.isArray(headers)) headers=[]
  if (!Array.isArray(body)) body=[]
  const first = headers[0] ? sumCols(headers[0]) : 0
  const last  = headers[headers.length-1] ? sumCols(headers[headers.length-1]) : 0
  const byBody = body[0]?.length || 0
  return Math.max(first, last, byBody)
}
function makeEmptyRow(w){ return Array.from({length:w},()=>({ value:'' })) }
function normalizeBodyRows(body=[], w){
  return body.map(r=>{
    const row = Array.isArray(r) ? r.slice() : []
    if (row.length < w) return row.concat(Array.from({length:w-row.length},()=>({ value:'' })))
    if (row.length > w) return row.slice(0, w)
    return row
  })
}

/* ====== Edit actions ====== */
function ensureDraft () {
  const base = Array.isArray(attr.value.body) ? attr.value.body : []
  const w = getLeafColCount(attr.value.headers, base)
  attr.value.__draftBody = normalizeBodyRows(JSON.parse(JSON.stringify(base)), w)
  // 👇 NO crear fila aquí (que la cree openAgregarFila)
}
function startInlineUpdate(){ ensureDraft(); attr.value.__editing = true }
function acceptInlineUpdate(){
  attr.value.body = JSON.parse(JSON.stringify(attr.value.__draftBody || []))
  delete attr.value.__draftBody
  delete attr.value.__editing
}
function cancelInlineUpdate(){ delete attr.value.__draftBody; delete attr.value.__editing }
function openAgregarFila () {
  if (!attr.value.__editing) startInlineUpdate()

  const w = getLeafColCount(attr.value.headers, attr.value.__draftBody)
  attr.value.__draftBody ||= []
  attr.value.__draftBody = normalizeBodyRows(attr.value.__draftBody, w)

  // 👉 agrega solo una fila nueva
  attr.value.__draftBody.push(makeEmptyRow(w))
}
</script>
