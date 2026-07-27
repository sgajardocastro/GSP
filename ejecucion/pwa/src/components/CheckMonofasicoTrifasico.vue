<template>
  <div class="check-mono-tri">
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
          <div
            v-for="(row, idx) in rows"
            :key="`${day.key}-${row.uid || idx}`"
            class="d-flex align-center justify-space-between py-1 day-row"
          >
            <div class="question-text pr-3">
              {{ row.label }}
            </div>

            <div class="check-col">
              <v-checkbox
                :model-value="Boolean(row.days?.[day.key])"
                :disabled="disabled"
                density="compact"
                hide-details
                @update:model-value="(val) => onToggleDay(idx, day.key, val)"
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
          v-for="(row, idx) in rows"
          :key="`summary-${row.uid || idx}`"
          class="mb-4"
        >
          <div class="font-weight-medium mb-2">
            {{ row.label }}
          </div>

          <div class="d-flex flex-wrap mb-2" style="gap: 6px;">
            <v-chip
              v-for="day in dayKeys"
              :key="`chip-${idx}-${day}`"
              size="small"
              :color="row.days?.[day] ? 'primary' : undefined"
              :variant="row.days?.[day] ? 'flat' : 'outlined'"
            >
              {{ dayLabel(day) }}
            </v-chip>
          </div>

          <v-text-field
            v-model="row.fecha_reparacion"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            label="Fecha reparacion"
            class="mb-2"
            :disabled="disabled"
            @update:model-value="emitChange"
          />

          <v-textarea
            v-model="row.observaciones"
            :disabled="disabled"
            variant="outlined"
            rows="2"
            auto-grow
            hide-details
            label="Observaciones"
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
const dayKeys = ['l', 'ma', 'mi', 'j', 'v']
const days = [
  { key: 'l', title: 'LUNES' },
  { key: 'ma', title: 'MARTES' },
  { key: 'mi', title: 'MIERCOLES' },
  { key: 'j', title: 'JUEVES' },
  { key: 'v', title: 'VIERNES' }
]

const defaultItems = [
  'CABLE FLEXIBLE DANADO O DESILACHADO',
  'CONEXIONES SUELTAS',
  'NUMERO DE REGISTRO CONECTADA',
  'CONEXIONES BIEN HECHAS',
  'CABLE FLEXIBLE ASEGURADO A LA ENTRADA DEL ENCHUFE',
  'DANADOS O TRIZADOS',
  'ESTAR OPERABLES',
  'ESTAR DANADAS, EXPONIENDO CONEXIONES VIVAS',
  'PRUEBA DE PERDIDA DE AISLACION (FUGA A TIERRA)',
  'CODIGO DE COLOR DEL MES'
]

const rows = computed(() => (Array.isArray(attr.value?.body) ? attr.value.body : []))

onMounted(() => {
  ensureBody()
})

function getDaySegmentTitle(dayName) {
  return `Check Monofasico Trifasico (${dayName})`
}

function todayLocal() {
  const now = new Date()
  const tzOffset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10)
}

function ensureBody() {
  if (!Array.isArray(attr.value.body)) attr.value.body = []

  const today = todayLocal()
  if (!attr.value.body.length) {
    attr.value.body = defaultItems.map((label) => ({
      uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      days: { l: false, ma: false, mi: false, j: false, v: false },
      fecha_reparacion: today,
      observaciones: ''
    }))
    return
  }

  attr.value.body = attr.value.body.map((row, idx) => ({
    uid: row?.uid || `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
    label: row?.label || defaultItems[idx] || `ITEM ${idx + 1}`,
    days: {
      l: Boolean(row?.days?.l),
      ma: Boolean(row?.days?.ma),
      mi: Boolean(row?.days?.mi),
      j: Boolean(row?.days?.j),
      v: Boolean(row?.days?.v)
    },
    fecha_reparacion: row?.fecha_reparacion || today,
    observaciones: row?.observaciones || ''
  }))
}

function onToggleDay(rowIdx, day, val) {
  const row = rows.value?.[rowIdx]
  if (!row) return
  if (!row.days || typeof row.days !== 'object') {
    row.days = { l: false, ma: false, mi: false, j: false, v: false }
  }
  row.days[day] = Boolean(val)
  emitChange()
}

function dayLabel(day) {
  if (day === 'l') return 'LUN'
  if (day === 'ma') return 'MAR'
  if (day === 'mi') return 'MIE'
  if (day === 'j') return 'JUE'
  return 'VIE'
}

function emitChange() {
  emit('change')
}
</script>

<style scoped>
.day-row {
  border-bottom: 1px solid #e5e7eb;
  min-height: 56px;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.day-row:last-child {
  border-bottom: none;
}

.question-text {
  flex: 1;
  line-height: 1.45;
  padding-right: 20px;
}

.check-col {
  min-width: 56px;
  display: flex;
  justify-content: flex-end;
}

.check-col :deep(.v-selection-control) {
  justify-content: flex-end;
}
</style>

