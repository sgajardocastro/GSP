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
              <!-- 🔒 No editable: texto -->
              <span v-if="cell?.editable === false">{{ cell?.value ?? '' }}</span>

              <!-- ✏️ Editable (o no definido): input -->
              <v-text-field
                v-else
                v-model="attr.__draftBody[rIdx][cIdx].value"
                density="compact"
                variant="underlined"
                hide-details
                :autofocus="rIdx === 0 && cIdx === 0"
              />
            </template>

            <template v-else>
              {{ cell?.value ?? '' }}
            </template>
          </td>
        </tr>
      </tbody>

      <!-- PIE (opcional) -->
      <tfoot v-if="attr.footer && attr.footer.length">
        <tr v-for="(footRow, frIdx) in attr.footer" :key="'ftr-' + frIdx">
          <td
            v-for="(cell, fcIdx) in footRow"
            :key="'ftr-cell-' + frIdx + '-' + fcIdx"
            class="text-center"
            :rowspan="cell.rowspan || 1"
            :colspan="cell.colspan || 1"
            style="vertical-align: middle; font-weight: 600;"
          >
            {{
              cell.label !== undefined && cell.label !== null
                ? cell.label
                : (cell.value !== undefined && cell.value !== null ? cell.value : '')
            }}
          </td>
        </tr>
      </tfoot>
    </v-table>

    <!-- BOTONES -->
    <div class="mt-2 d-flex ga-2">
      <template v-if="attr.__editing">
        <v-btn size="small" variant="text" @click="cancelInlineUpdate()">Cancelar</v-btn>
        <v-btn size="small" color="primary" @click="acceptInlineUpdate()">Aceptar</v-btn>
      </template>

      <template v-else>
        <v-btn size="small" color="primary" @click="startInlineUpdate()">
          Actualizar
        </v-btn>

        <v-btn size="small" @click="openAgregarFila()">
          Agregar fila
        </v-btn>
      </template>
    </div>
  </div>
</template>

<script setup>
import { toRef } from 'vue'

const props = defineProps({
  // Recibe el objeto attr de la matriz (reactivo, se muta en sitio)
  attr: { type: Object, required: true }
})

// Trabajamos directo sobre el mismo objeto para no romper nada
const attr = toRef(props, 'attr')

/* ===================== Helpers ===================== */

function sumCols(row = []) {
  return row.reduce((acc, c) => acc + (Number(c?.colspan) || 1), 0)
}

/**
 * Cuenta las columnas "hoja" considerando headers y body.
 * Si hay diferencia, toma el máximo para evitar cortes.
 */
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
  // Por defecto las nuevas celdas son editables
  return Array.from({ length: width }, () => ({ value: '' }))
}

function normalizeBodyRows(body = [], width) {
  return body.map(r => {
    const row = Array.isArray(r) ? r.slice() : []
    if (row.length < width) {
      return row.concat(
        Array.from({ length: width - row.length }, () => ({ value: '' }))
      )
    } else if (row.length > width) {
      return row.slice(0, width)
    }
    return row
  })
}

/* ===================== Acciones ===================== */

function startInlineUpdate () {
  const width = tableWidth()
  const base = Array.isArray(attr.value.body) ? attr.value.body : []

  attr.value.__draftBody = normalizeBodyRows(
    JSON.parse(JSON.stringify(base)),
    width
  )

  // Si no hay filas, parte con una vacía
  if (attr.value.__draftBody.length === 0) {
    attr.value.__draftBody.push(makeEmptyRow(width))
  }

  attr.value.__editing = true
}

function acceptInlineUpdate () {
  const draft = Array.isArray(attr.value.__draftBody) ? attr.value.__draftBody : []
  const original = Array.isArray(attr.value.body) ? attr.value.body : []

  // Asegurar que draft tenga el ancho correcto (por si cambió header en caliente)
  const width = getLeafColCount(attr.value.headers, draft)
  const safeDraft = normalizeBodyRows(draft, width)
  const safeOriginal = normalizeBodyRows(original, width)

  const merged = safeDraft.map((row, rIdx) =>
    row.map((cell, cIdx) => {
      const wasEditable =
        !(safeOriginal?.[rIdx]?.[cIdx]) || safeOriginal[rIdx][cIdx].editable !== false
      return wasEditable ? cell : safeOriginal[rIdx][cIdx]
    })
  )

  attr.value.body = merged
  delete attr.value.__draftBody
  delete attr.value.__editing
}

function cancelInlineUpdate () {
  delete attr.value.__draftBody
  delete attr.value.__editing
}

function openAgregarFila () {
  const width = tableWidth()

  if (attr.value.__editing) {
    attr.value.__draftBody ||= []
    attr.value.__draftBody = normalizeBodyRows(attr.value.__draftBody, width)
    attr.value.__draftBody.push(makeEmptyRow(width))
  } else {
    attr.value.body ||= []
    attr.value.body = normalizeBodyRows(attr.value.body, width)
    attr.value.body.push(makeEmptyRow(width))
  }
}
</script>