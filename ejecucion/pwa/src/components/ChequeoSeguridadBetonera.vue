<template>
  <div class="betonera-check">
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
              {{ idx + 1 }}. {{ row.label }}
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
            {{ idx + 1 }}. {{ row.label }}
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

    <v-card variant="outlined" class="mt-3 estado-card">
      <v-card-text class="d-flex align-center flex-wrap" style="gap: 8px;">
        <span class="estado-label">Estado:</span>
        <v-btn-toggle
          :model-value="getEstado()"
          :disabled="disabled"
          mandatory
          density="compact"
          @update:model-value="setEstado"
        >
          <v-btn value="aprobada" size="small">APROBADA</v-btn>
          <v-btn value="reprobada" size="small">REPROBADA</v-btn>
        </v-btn-toggle>
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
  'La carcaza de proteccion partes moviles (correas y engranajes) se hayan en buen estado?',
  'Cable de conexionado (macho) en buen estado',
  'Las extensiones, si las hay, estan en buen estado?',
  'Los engranajes, se hayan en buen estado?',
  'Posee plataforma o banco metalico para instalar?',
  'Ruedas, infladas y en buen estado?',
  'Posee conexion a tierra?',
  'El mezclador, se encuentra en buenas condiciones?',
  'Las aspas, se encuentran en buenas condiciones?',
  'La plataforma, se encuentra en buenas condiciones?',
  'Interruptor encendido/apagado se encuentra operativo?',
  'El operador, posee plataforma para vaciado?',
  'El operador, esta capacitado para su uso?'
]

const rows = computed(() => (Array.isArray(attr.value?.body) ? attr.value.body : []))

onMounted(() => {
  ensureBody()
})

function getDaySegmentTitle(dayName) {
  return `Chequeo Seguridad Betonera (${dayName})`
}

function ensureBody() {
  if (!Array.isArray(attr.value.body)) attr.value.body = []
  if (!attr.value.estado) attr.value.estado = ''

  if (!attr.value.body.length) {
    attr.value.body = defaultItems.map((label) => ({
      uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      days: { l: false, ma: false, mi: false, j: false, v: false },
      observacion: ''
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
    observacion: row?.observacion || ''
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

function getEstado() {
  return (attr.value?.estado ?? '').toString().trim().toLowerCase()
}

function setEstado(val) {
  attr.value.estado = (val ?? '').toString().trim().toLowerCase()
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

.estado-label {
  font-weight: 600;
}
</style>
