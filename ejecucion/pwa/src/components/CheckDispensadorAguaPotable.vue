<template>
  <div class="check-dispensador">
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
            :key="`${day.key}-${row.id || idx}`"
            class="d-flex align-center justify-space-between py-1 day-row"
          >
            <div class="question-text pr-3">
              {{ row.codigo }} {{ row.label }}
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
          :key="`summary-${row.id || idx}`"
          class="mb-4"
        >
          <div class="font-weight-medium mb-2">
            {{ row.codigo }} {{ row.label }}
          </div>

          <div class="d-flex flex-wrap mb-2" style="gap: 6px;">
            <v-chip
              v-for="day in days"
              :key="`chip-${idx}-${day.key}`"
              size="small"
              :color="row.days?.[day.key] ? 'primary' : undefined"
              :variant="row.days?.[day.key] ? 'flat' : 'outlined'"
            >
              {{ day.title }}
            </v-chip>
          </div>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                :model-value="row.responsableId"
                :items="responsables"
                item-title="label"
                item-value="value"
                label="Responsable"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(val) => onResponsableChange(idx, val)"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                :model-value="row.fecha"
                label="Fecha"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(val) => onFechaChange(idx, val)"
              />
            </v-col>
          </v-row>
        </div>

        <v-textarea
          v-model="attrRef.observacionGeneral"
          label="Observacion general"
          variant="outlined"
          rows="4"
          auto-grow
          class="mt-2"
          :disabled="disabled"
          @update:model-value="emitChange"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, toRef } from 'vue'
import apiAxios from '@/services/api'

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
const responsables = ref([])

const days = [
  { key: 'l', title: 'LUN' },
  { key: 'ma', title: 'MAR' },
  { key: 'mi', title: 'MIE' },
  { key: 'j', title: 'JUE' },
  { key: 'v', title: 'VIE' }
]

const defaultRows = [
  { codigo: '1.1', label: 'Letrero con leyenda Agua Potable' },
  { codigo: '1.2', label: 'Llave exterior para evitar contaminacion' },
  { codigo: '1.3', label: 'Vasos desechables para un solo uso' },
  { codigo: '1.4', label: 'Basurero para botar vasos usados' },
  { codigo: '1.5', label: 'Mantenimiento diario de dispensadores' },
  { codigo: '1.6', label: 'Ubicacion adecuada del dispensador' },
  { codigo: '1.7', label: 'Persona responsable del dispensador' },
  { codigo: '1.8', label: 'Plano de ubicacion y distribucion' },
  { codigo: '1.9', label: 'Otros' }
]

const attrRef = computed(() => attr.value || {})
const rows = computed(() => (Array.isArray(attrRef.value.body) ? attrRef.value.body : []))

onMounted(async () => {
  ensureBody()
  await loadResponsables()
})

function getDaySegmentTitle(dayName) {
  return `Check Dispensador Agua Potable (${dayName})`
}

function todayLocal() {
  const now = new Date()
  const tzOffset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10)
}

function ensureBody() {
  if (!Array.isArray(attrRef.value.body)) attrRef.value.body = []
  if (attrRef.value.observacionGeneral === undefined || attrRef.value.observacionGeneral === null) {
    attrRef.value.observacionGeneral = ''
  }

  if (!attrRef.value.body.length) {
    attrRef.value.body = defaultRows.map((row, idx) => ({
      id: `${idx + 1}`,
      codigo: row.codigo,
      label: row.label,
      days: { l: false, ma: false, mi: false, j: false, v: false },
      responsableId: null,
      responsable: '',
      fecha: todayLocal()
    }))
    return
  }

  attrRef.value.body = attrRef.value.body.map((row, idx) => ({
    id: row?.id || `${idx + 1}`,
    codigo: row?.codigo || defaultRows[idx]?.codigo || `${idx + 1}`,
    label: row?.label || defaultRows[idx]?.label || `Item ${idx + 1}`,
    days: {
      l: Boolean(row?.days?.l),
      ma: Boolean(row?.days?.ma),
      mi: Boolean(row?.days?.mi),
      j: Boolean(row?.days?.j),
      v: Boolean(row?.days?.v)
    },
    responsableId: row?.responsableId ?? null,
    responsable: (row?.responsable ?? '').toString(),
    fecha: (row?.fecha ?? todayLocal()).toString().slice(0, 10)
  }))
}

async function loadResponsables() {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
    const list = Array.isArray(data) ? data : []
    responsables.value = list.map((u) => ({
      value: u.id_user,
      label: buildUserName(u)
    }))
  } catch (error) {
    console.error('Error cargando usuarios:', error)
    responsables.value = []
  }
}

function buildUserName(user) {
  const name = [
    user?.name_frst,
    user?.name_sond,
    user?.apellido_pat,
    user?.apellido_mat
  ].filter(Boolean).join(' ').trim()
  return name || user?.nombre_user || `Usuario ${user?.id_user ?? ''}`.trim()
}

function onResponsableChange(rowIdx, val) {
  const row = rows.value?.[rowIdx]
  if (!row) return
  row.responsableId = val
  const selected = responsables.value.find((r) => String(r.value) === String(val))
  row.responsable = selected?.label || ''
  emitChange()
}

function onFechaChange(rowIdx, val) {
  const row = rows.value?.[rowIdx]
  if (!row) return
  row.fecha = (val ?? '').toString()
  emitChange()
}

function onToggleDay(rowIdx, dayKey, val) {
  const row = rows.value?.[rowIdx]
  if (!row) return
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

