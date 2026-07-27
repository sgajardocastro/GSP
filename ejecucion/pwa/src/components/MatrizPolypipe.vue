<!-- src/components/MatrizPolypipe.vue -->
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
              <!-- (T∆) calculado, no editable -->
              <span v-if="isDeltaCol(cIdx)">{{ cell?.value ?? '' }}</span>

              <!-- Otros campos editables (números para HR, Ts, Ta, Td; texto libre para Hora) -->
              <v-text-field
                v-else
                v-model="attr.__draftBody[rIdx][cIdx].value"
                type="text"
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

/* ===== Utils de columnas ===== */
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
  idxHR:     findColIndex(['(hr)','humedad relativa','húmedad relativa']),
  idxTs:     findColIndex(['(ts)','temperatura de superficie']),
  idxTa:     findColIndex(['(ta)','temperatura aire']),
  idxTd:     findColIndex(['(td)','punto de rocío','rocio']),
  idxDelta:  findColIndex(['(t∆)','(t∆)','diferencia']),
  idxHora:   findColIndex(['hora de medición','hora de medicion','hora'])
})
function isDeltaCol(cIdx){ return cIdx === colIdx().idxDelta }
/*function isNumericCol(cIdx){
  const { idxHR, idxTs, idxTa, idxTd } = colIdx()
  return [idxHR, idxTs, idxTa, idxTd].includes(cIdx)
}*/

/* ===== Helpers tabla ===== */
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
function toNum(v){
  const s = String(v ?? '').replace(',', '.').trim()
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
function round(n, d=2){ const p=10**d; return Math.round(n*p)/p }

/* ===== Cálculo: T∆ = Td - Ts (por fila) ===== */
function recomputeAll(){
  const { idxTs, idxTd, idxDelta } = colIdx()
  if ([idxTs, idxTd, idxDelta].some(i=>i<0)) return

  const rows = attr.value.__editing ? (attr.value.__draftBody||[]) : (attr.value.body||[])
  rows.forEach(row=>{
    const ts = toNum(row?.[idxTs]?.value)
    const td = toNum(row?.[idxTd]?.value)
    row[idxDelta] && (row[idxDelta].value = (ts!==null && td!==null) ? round(td - ts, 2) : '')
  })
}

/* ===== Acciones ===== */
function ensureDraft(){
  const base = Array.isArray(attr.value.body) ? attr.value.body : []
  const w = getLeafColCount(attr.value.headers, base)
  attr.value.__draftBody = normalizeBodyRows(JSON.parse(JSON.stringify(base)), w)
  if (attr.value.__draftBody.length === 0) attr.value.__draftBody.push(makeEmptyRow(w))
}
function startInlineUpdate(){ ensureDraft(); attr.value.__editing = true; recomputeAll() }
function acceptInlineUpdate(){
  // último recálculo y guardar
  recomputeAll()
  attr.value.body = JSON.parse(JSON.stringify(attr.value.__draftBody || []))
  delete attr.value.__draftBody
  delete attr.value.__editing
}
function cancelInlineUpdate(){ delete attr.value.__draftBody; delete attr.value.__editing }
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
