<template>
  <div class="check-equipos-iluminacion">
    <v-expansion-panels multiple>
      <v-expansion-panel v-for="day in days" :key="day.key" class="mb-3">
        <v-expansion-panel-title class="font-weight-bold">
          {{ getDaySegmentTitle(day.title) }}
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div v-for="(row, index) in rows" :key="row.id || index" class="day-row-wrap">
            <div v-if="row.kind === 'group'" class="group-row">
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

            <div v-if="row.kind !== 'group'" class="obs-row">
              <v-textarea
                :model-value="getDayObs(row, day.key)"
                :disabled="disabled"
                variant="outlined"
                rows="2"
                auto-grow
                hide-details
                label="Observacion"
                @update:model-value="(val) => onDayObs(row, day.key, val)"
              />
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
          v-for="(row, index) in rows.filter(isItemRow)"
          :key="`summary-${row.id || index}`"
          class="mb-4"
        >
          <div class="font-weight-medium mb-2">
            {{ row.label }}
          </div>

          <div class="d-flex flex-wrap mb-2" style="gap: 6px;">
            <v-chip
              v-for="day in days"
              :key="`sum-${row.id || index}-${day.key}`"
              size="small"
              :color="row.days?.[day.key] ? 'primary' : undefined"
              :variant="row.days?.[day.key] ? 'flat' : 'outlined'"
            >
              {{ day.title }}
            </v-chip>
          </div>

          <div class="text-body-2">
            <strong>Observacion:</strong> {{ summaryObservation(row) || '—' }}
          </div>
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
  { kind: 'group', label: 'MOTOR' },
  { kind: 'item', label: 'FILTRACIONES' },
  { kind: 'item', label: 'ALTERNADOR' },
  { kind: 'item', label: 'MOTOR DE PARTIDA' },
  { kind: 'item', label: 'RADIADOR / ANTICONGELANTE' },
  { kind: 'item', label: 'ESTADO DE CORREA' },
  { kind: 'item', label: 'RUIDOS ANORMALES' },
  { kind: 'item', label: 'FILTRO DE AIRE' },
  { kind: 'item', label: 'PERDIDAS DE PETROLEO' },
  { kind: 'item', label: 'TUBO ESCAPE' },
  { kind: 'group', label: 'LUMINARIA Y SISTEMA ELECTRICO' },
  { kind: 'item', label: 'INSTRUMENTOS' },
  { kind: 'item', label: 'CABLEADO Y CONEXIONES' },
  { kind: 'item', label: 'BATERIA' },
  { kind: 'item', label: 'UNIDAD GENERADORA' },
  { kind: 'item', label: 'FOCOS' },
  { kind: 'item', label: 'CAJA DISTRIBUIDORA DE LA TORRE' },
  { kind: 'item', label: 'CABLES ALIMENTACION FOCOS' },
  { kind: 'item', label: 'LUCES PILOTO' },
  { kind: 'group', label: 'CHASSIS' },
  { kind: 'item', label: 'PUERTAS' },
  { kind: 'item', label: 'TECHO' },
  { kind: 'item', label: 'PINTURA' },
  { kind: 'item', label: 'NEUMATICOS' },
  { kind: 'item', label: 'BARRA DE TIRO' },
  { kind: 'item', label: 'ESTABILIZADORES' },
  { kind: 'item', label: 'LEVANTE DE TORRE' },
  { kind: 'item', label: 'SOPORTES FOCOS' },
  { kind: 'item', label: 'SEGUROS' }
]

const rows = computed(() => {
  const list = Array.isArray(attr.value?.body) ? attr.value.body : []
  return list
})

onMounted(() => {
  ensureBody()
})

function getDaySegmentTitle(dayName) {
  return `Check Equipos Iluminacion (${dayName})`
}

function isItemRow(row) {
  return row?.kind !== 'group'
}

function ensureBody() {
  if (!Array.isArray(attr.value.body)) attr.value.body = []

  if (!attr.value.body.length) {
    attr.value.body = defaultRows.map((row, idx) => ({
      id: `${idx + 1}`,
      kind: row.kind,
      label: row.label,
      days: row.kind === 'group'
        ? undefined
        : { l: false, ma: false, mi: false, j: false, v: false },
      obsByDay: row.kind === 'group'
        ? undefined
        : { l: '', ma: '', mi: '', j: '', v: '' }
    }))
    return
  }

  attr.value.body = attr.value.body.map((row, idx) => {
    const kind = row?.kind === 'group' ? 'group' : 'item'
    return {
      id: row?.id || `${idx + 1}`,
      kind,
      label: row?.label || defaultRows[idx]?.label || `ITEM ${idx + 1}`,
      days: kind === 'group'
        ? undefined
        : {
          l: Boolean(row?.days?.l),
          ma: Boolean(row?.days?.ma),
          mi: Boolean(row?.days?.mi),
          j: Boolean(row?.days?.j),
          v: Boolean(row?.days?.v)
        },
      obsByDay: kind === 'group'
        ? undefined
        : {
          l: (row?.obsByDay?.l ?? row?.obs ?? '').toString(),
          ma: (row?.obsByDay?.ma ?? '').toString(),
          mi: (row?.obsByDay?.mi ?? '').toString(),
          j: (row?.obsByDay?.j ?? '').toString(),
          v: (row?.obsByDay?.v ?? '').toString()
        }
    }
  })
}

function getDayChecked(row, dayKey) {
  if (!row || row.kind === 'group') return false
  if (!row.days || typeof row.days !== 'object') {
    row.days = { l: false, ma: false, mi: false, j: false, v: false }
  }
  return Boolean(row.days[dayKey])
}

function onDayCheck(row, dayKey, val) {
  if (!row || row.kind === 'group') return
  if (!row.days || typeof row.days !== 'object') {
    row.days = { l: false, ma: false, mi: false, j: false, v: false }
  }
  row.days[dayKey] = Boolean(val)
  emitChange()
}

function getDayObs(row, dayKey) {
  if (!row || row.kind === 'group') return ''
  if (!row.obsByDay || typeof row.obsByDay !== 'object') {
    row.obsByDay = { l: '', ma: '', mi: '', j: '', v: '' }
  }
  return row.obsByDay[dayKey] || ''
}

function onDayObs(row, dayKey, val) {
  if (!row || row.kind === 'group') return
  if (!row.obsByDay || typeof row.obsByDay !== 'object') {
    row.obsByDay = { l: '', ma: '', mi: '', j: '', v: '' }
  }
  row.obsByDay[dayKey] = (val ?? '').toString()
  emitChange()
}

function summaryObservation(row) {
  if (!row || row.kind === 'group') return ''
  const obs = row.obsByDay || {}
  const values = days
    .map((day) => (obs?.[day.key] ?? '').toString().trim())
    .filter(Boolean)
  return values.join(' | ')
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

.obs-row {
  padding: 0 0 10px 0;
}
</style>
