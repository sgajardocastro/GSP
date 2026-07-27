<template>
  <div class="check-herramientas-manuales">
    <v-expansion-panels multiple>
      <v-expansion-panel
        v-for="day in days"
        :key="day.key"
        class="mb-3"
      >
        <v-expansion-panel-title class="font-weight-bold">
          {{ getDaySegmentTitle(day.title) }}
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div v-for="(row, idx) in rows" :key="`${day.key}-${row.id || idx}`" class="day-row-wrap">
            <div v-if="row.kind === 'group'" class="group-row">
              {{ row.label }}
            </div>

            <div v-else-if="row.kind === 'note'" class="note-row">
              {{ row.label }}
            </div>

            <div v-else class="day-row">
              <div class="question-text">
                {{ row.label }}
              </div>
              <div class="check-col">
                <v-checkbox
                  :model-value="getDayChecked(row, day.key)"
                  :disabled="disabled"
                  density="compact"
                  hide-details
                  @update:model-value="(val) => onDayCheck(row, day.key, val)"
                />
              </div>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-card variant="outlined" class="mt-4">
      <v-card-title class="text-subtitle-2 font-weight-bold">
        Resumen Semanal
      </v-card-title>

      <v-card-text>
        <div
          v-for="(row, idx) in itemRows"
          :key="`summary-${row.id || idx}`"
          class="mb-4"
        >
          <div class="font-weight-medium mb-2">
            {{ row.label }}
          </div>

          <div class="d-flex flex-wrap mb-2" style="gap: 6px;">
            <v-chip
              v-for="day in days"
              :key="`sum-${row.id || idx}-${day.key}`"
              size="small"
              :color="row.days?.[day.key] ? 'primary' : undefined"
              :variant="row.days?.[day.key] ? 'flat' : 'outlined'"
            >
              {{ day.title }}
            </v-chip>
          </div>

          <v-textarea
            v-model="row.observacion"
            :disabled="disabled"
            variant="outlined"
            rows="2"
            auto-grow
            hide-details
            label="Observacion"
            @update:model-value="emitChange"
          />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, toRef } from 'vue'

const props = defineProps({
  attr: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['change'])
const attr = toRef(props, 'attr')

const days = [
  { key: 'l', title: 'LUN' },
  { key: 'ma', title: 'MAR' },
  { key: 'mi', title: 'MIE' },
  { key: 'j', title: 'JUE' },
  { key: 'v', title: 'VIE' }
]

const defaultRows = [
  { kind: 'group', label: 'HERRAMIENTAS MANUALES' },
  { kind: 'item', label: 'CHUZOS' },
  { kind: 'item', label: 'CARRETILLAS' },
  { kind: 'item', label: 'MARTILLO' },
  { kind: 'item', label: 'MAZO' },
  { kind: 'item', label: 'CINCELES' },
  { kind: 'item', label: 'HOJAS DE LOS SERRUCHOS' },
  { kind: 'item', label: 'LIMAS' },
  { kind: 'item', label: 'ALICATES' },
  { kind: 'item', label: 'PALAS' },
  { kind: 'item', label: 'CUCHILLOS CARTONEROS' },
  { kind: 'item', label: 'LIENZA' },
  { kind: 'item', label: 'PICOTAS' },
  { kind: 'item', label: 'DESTORNILLADORES' },
  { kind: 'item', label: 'LLAVES PUNTA CORONA' },
  { kind: 'item', label: 'LLAVE ALLEN' },
  { kind: 'item', label: 'LLAVE STILSON' },
  { kind: 'item', label: 'DADOS' },
  { kind: 'item', label: 'LLAVE PICO DE LORO' },
  { kind: 'item', label: 'PELA CABLES' },
  { kind: 'item', label: 'LLAVES PUNTA ESTRELLA' },
  { kind: 'item', label: 'HOJAS DE CIERRAS' },
  { kind: 'note', label: 'NOTA: VERIFICAR AISLACION DE ESTAS HERRAMIENTAS' },
  { kind: 'group', label: 'TRABAJOS MECANICOS' },
  { kind: 'item', label: 'DESTORNILLADORES (PRESENTAN DESGASTE)' },
  { kind: 'item', label: 'LLAVES PUNTA CORONA' },
  { kind: 'item', label: 'LLAVE ALLEN' },
  { kind: 'item', label: 'LLAVE STILSON' },
  { kind: 'item', label: 'DADOS' },
  { kind: 'item', label: 'LLAVE PICO DE LORO' },
  { kind: 'item', label: 'LLAVES DE CADENA' },
  { kind: 'item', label: 'ALICATES' },
  { kind: 'item', label: 'LLAVE AJUSTABLE' },
  { kind: 'note', label: 'NOTA: ELIMINAR Y REQUISAR HERRAMIENTAS HECHIZAS ESTAN PROHIBIDAS EN LA EMPRESA' }
]

const rows = computed(() => {
  const list = Array.isArray(attr.value?.body) ? attr.value.body : []
  return list
})

const itemRows = computed(() => rows.value.filter((row) => row?.kind === 'item'))

onMounted(() => {
  ensureBody()
})

function getDaySegmentTitle(dayName) {
  return `CheckList Herramientas Manuales (${dayName})`
}

function ensureBody() {
  if (!Array.isArray(attr.value.body)) attr.value.body = []

  if (!attr.value.body.length) {
    attr.value.body = defaultRows.map((row, idx) => ({
      id: `${idx + 1}`,
      kind: row.kind,
      label: row.label,
      days: row.kind === 'item'
        ? { l: false, ma: false, mi: false, j: false, v: false }
        : undefined,
      observacion: row.kind === 'item' ? '' : undefined
    }))
    return
  }

  attr.value.body = attr.value.body.map((row, idx) => {
    const base = defaultRows[idx]
    const kind = row?.kind || base?.kind || 'item'
    return {
      id: row?.id || `${idx + 1}`,
      kind,
      label: row?.label || base?.label || `ITEM ${idx + 1}`,
      days: kind === 'item'
        ? {
          l: Boolean(row?.days?.l),
          ma: Boolean(row?.days?.ma),
          mi: Boolean(row?.days?.mi),
          j: Boolean(row?.days?.j),
          v: Boolean(row?.days?.v)
        }
        : undefined,
      observacion: kind === 'item' ? (row?.observacion ?? '').toString() : undefined
    }
  })
}

function getDayChecked(row, dayKey) {
  if (!row || row.kind !== 'item') return false
  if (!row.days || typeof row.days !== 'object') {
    row.days = { l: false, ma: false, mi: false, j: false, v: false }
  }
  return Boolean(row.days[dayKey])
}

function onDayCheck(row, dayKey, val) {
  if (!row || row.kind !== 'item') return
  if (!row.days || typeof row.days !== 'object') {
    row.days = { l: false, ma: false, mi: false, j: false, v: false }
  }
  row.days[dayKey] = Boolean(val)
  emitChange()
}

function emitChange() {
  emit('change')
}
</script>

<style scoped>
.day-row-wrap {
  border-bottom: 1px solid #e5e7eb;
}

.day-row-wrap:last-child {
  border-bottom: none;
}

.group-row {
  font-weight: 700;
  font-size: 13px;
  padding: 12px 0 8px 0;
  color: #111827;
}

.note-row {
  font-weight: 700;
  font-size: 12px;
  padding: 10px 0;
  color: #b91c1c;
  text-transform: uppercase;
}

.day-row {
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.question-text {
  flex: 1;
  line-height: 1.35;
  padding: 8px 16px 8px 0;
}

.check-col {
  min-width: 48px;
  display: flex;
  justify-content: flex-end;
}

.check-col :deep(.v-selection-control) {
  justify-content: flex-end;
}
</style>
