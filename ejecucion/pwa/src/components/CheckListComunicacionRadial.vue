<template>
  <div class="checklist-comunicacion-radial">
    <v-row dense class="mb-3">
      <v-col cols="12">
        <v-text-field
          v-model="fechaInicioModel"
          type="date"
          label="Fecha inicio"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          class="fecha-inicio-field"
          @update:model-value="onFechaInicioChange"
        />
      </v-col>
    </v-row>

    <v-expansion-panels v-model="openDays" multiple class="radial-panels">
      <v-expansion-panel
        v-for="day in days"
        :key="day.key"
        :value="day.key"
        class="radial-card"
      >
        <v-expansion-panel-title class="radial-card-title">
          <div class="title-content">
            <span class="day-title-text">
              <span>{{ day.label }}</span>
              <span v-if="getDayDate(day.index)" class="day-date">{{ getDayDate(day.index) }}</span>
            </span>
            <span class="answered-count">{{ getAnsweredCount(day.key) }}/{{ itemRows.length }}</span>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div
            v-for="(row, index) in itemRows"
            :key="`${day.key}-${row.id || index}`"
            class="question-row"
          >
            <div class="question-text">
              <span class="question-number">{{ String(index + 1).padStart(2, '0') }}.</span>
              <span>{{ row.label }}</span>
            </div>

            <div class="answer-checks">
              <button
                v-for="option in options"
                :key="option.value"
                type="button"
                :disabled="disabled"
                :class="[
                  'answer-check',
                  `answer-check--${option.value}`,
                  getDayValue(row, day.key) === option.value ? 'answer-check--active' : ''
                ]"
                @click="onDayValueChange(row, day.key, option.value)"
              >
                <span class="check-box">
                  <v-icon v-if="getDayValue(row, day.key) === option.value" size="14">
                    mdi-check-bold
                  </v-icon>
                </span>
                <span>{{ option.label }}</span>
              </button>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-card class="color-card" elevation="0">
      <v-card-title class="color-card-title">
        CODIFICACION DE COLORES PARA INSPECCION MENSUAL
      </v-card-title>

      <v-card-text class="color-card-body">
        <div class="color-legend">
          <div
            v-for="color in colorConfig"
            :key="color.key"
            class="color-label"
            :class="`color-label--${color.key}`"
          >
            {{ color.label }}
          </div>
        </div>

        <v-textarea
          :model-value="colorCoding.observacion"
          label="Observacion"
          variant="outlined"
          density="compact"
          rows="1"
          auto-grow
          hide-details
          :disabled="disabled"
          class="color-observation"
          @update:model-value="setColorObservation"
        />

        <div class="month-grid">
          <button
            v-for="month in months"
            :key="month.key"
            type="button"
            :disabled="disabled"
            :class="[
              'month-cycle-button',
              getMonthColor(month.key) ? `month-cycle-button--${getMonthColor(month.key)}` : ''
            ]"
            @click="cycleMonthColor(month.key)"
          >
            <span>{{ month.label }}</span>
            <span class="month-color-name">
              {{ getMonthColorLabel(month.key) }}
            </span>
          </button>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, toRef } from 'vue'

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
const attrRef = toRef(props, 'attr')
const renderTick = ref(0)

const days = [
  { key: 'd1', label: 'Dia 1', index: 0 },
  { key: 'd2', label: 'Dia 2', index: 1 },
  { key: 'd3', label: 'Dia 3', index: 2 },
  { key: 'd4', label: 'Dia 4', index: 3 },
  { key: 'd5', label: 'Dia 5', index: 4 },
  { key: 'd6', label: 'Dia 6', index: 5 },
  { key: 'd7', label: 'Dia 7', index: 6 }
]

const openDays = ref([])

const options = [
  { value: 'si', label: 'SI', color: 'success' },
  { value: 'no', label: 'NO', color: 'error' },
  { value: 'na', label: 'NA', color: 'blue-grey' }
]

const colorConfig = [
  {
    key: 'amarillo',
    label: 'AMARILLO'
  },
  {
    key: 'rojo',
    label: 'ROJO'
  },
  {
    key: 'azul',
    label: 'AZUL'
  },
  {
    key: 'verde',
    label: 'VERDE'
  }
]

const months = [
  { key: 'enero', label: 'Enero' },
  { key: 'febrero', label: 'Febrero' },
  { key: 'marzo', label: 'Marzo' },
  { key: 'abril', label: 'Abril' },
  { key: 'mayo', label: 'Mayo' },
  { key: 'junio', label: 'Junio' },
  { key: 'julio', label: 'Julio' },
  { key: 'agosto', label: 'Agosto' },
  { key: 'septiembre', label: 'Septiembre' },
  { key: 'octubre', label: 'Octubre' },
  { key: 'noviembre', label: 'Noviembre' },
  { key: 'diciembre', label: 'Diciembre' }
]

const defaultRows = [
  'Radio transmisor se encuentra con bateria cargada.',
  'Se verifico que el canal de comunicacion este libre de interferencias e intervenciones.',
  'La prueba de comunicacion entre emisor y receptor con radio transmisor es efectiva.',
  'Se encuentran en buen estado botones y perillas de la radio.',
  'La antena se encuentra en buen estado.',
  'Radio transmisor se encuentra codificado segun codigo de color.',
  'Radio transmisor cuenta con accesorio para poder portarla (pinza de sujecion).',
  'El emisor y receptor conoce el canal de radio para ejecutar las maniobras.',
  'Otros.'
]

const fechaInicioModel = computed({
  get() {
    const normalized = normalizeDateForInput(attrRef.value?.fechaInicio)
    return normalized || todayIso()
  },
  set(value) {
    attrRef.value.fechaInicio = normalizeDateForInput(value) || todayIso()
  }
})

const itemRows = computed(() => {
  const rows = Array.isArray(attrRef.value?.body) ? attrRef.value.body : []
  return rows.filter((row) => row?.kind !== 'group')
})

const colorCoding = computed(() => {
  renderTick.value
  return normalizeColorCoding(attrRef.value?.codificacionColores)
})

onMounted(() => {
  ensureBody()
})

function emptyDays() {
  return days.reduce((acc, day) => {
    acc[day.key] = ''
    return acc
  }, {})
}

function normalizeValue(value) {
  const current = String(value ?? '').trim().toLowerCase()
  if (current === 'n/a') return 'na'
  if (current === 'si' || current === 'no' || current === 'na') return current
  return ''
}

function getAnsweredCount(dayKey) {
  renderTick.value
  return (attrRef.value?.body || []).filter((row) => normalizeValue(row?.days?.[dayKey]) !== '').length
}

function getDayValue(row, dayKey) {
  renderTick.value
  return normalizeValue(row?.days?.[dayKey])
}

function normalizeDateForInput(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return raw

  match = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    return `${year}-${month}-${day}`
  }

  return ''
}

function parseLocalDate(value) {
  const normalized = normalizeDateForInput(value)
  const parts = normalized.split('-').map(Number)
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null
  const [year, month, day] = parts
  return new Date(year, month - 1, day)
}

function todayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDayDate(dayIndex) {
  renderTick.value
  const base = parseLocalDate(attrRef.value?.fechaInicio)
  if (!base) return ''

  const date = new Date(base)
  date.setDate(base.getDate() + Number(dayIndex || 0))

  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function onFechaInicioChange(value) {
  attrRef.value.fechaInicio = normalizeDateForInput(value) || todayIso()
  renderTick.value += 1
  emit('change')
}

function ensureDays(row) {
  if (!row.days || typeof row.days !== 'object') row.days = emptyDays()

  for (const day of days) {
    row.days[day.key] = normalizeValue(row.days[day.key])
  }
}

function ensureBody() {
  if (!attrRef.value || typeof attrRef.value !== 'object') return

  if (!Array.isArray(attrRef.value.body)) attrRef.value.body = []
  const normalizedFechaInicio = normalizeDateForInput(attrRef.value.fechaInicio)
  attrRef.value.fechaInicio = normalizedFechaInicio || todayIso()
  ensureColorCoding()

  if (!attrRef.value.body.length && Array.isArray(attrRef.value.checkBoby) && attrRef.value.checkBoby.length) {
    attrRef.value.body = attrRef.value.checkBoby.map((item, index) => ({
      id: item?.id || `${index + 1}`,
      kind: 'item',
      label: item?.label || defaultRows[index] || `Item ${index + 1}`,
      days: item?.days && typeof item.days === 'object' ? { ...item.days } : emptyDays()
    }))
  }

  if (!attrRef.value.body.length) {
    attrRef.value.body = defaultRows.map((label, index) => ({
      id: `${index + 1}`,
      kind: 'item',
      label,
      days: emptyDays()
    }))
  }

  attrRef.value.body = attrRef.value.body.map((row, index) => normalizeRow(row, index))
  renderTick.value += 1
}

function ensureColorCoding() {
  attrRef.value.codificacionColores = normalizeColorCoding(attrRef.value.codificacionColores)
}

function normalizeColorCoding(saved) {
  const legacyRows = Array.isArray(saved) ? saved : []
  const source = saved && !Array.isArray(saved) && typeof saved === 'object' ? saved : {}
  const sourceMonths = source.meses && typeof source.meses === 'object' ? source.meses : {}

  const meses = months.reduce((acc, month) => {
    const legacyColor = legacyRows.find((row) => row?.meses?.[month.key])?.key || ''
    const value = sourceMonths[month.key] || legacyColor || ''
    acc[month.key] = colorConfig.some((color) => color.key === value) ? value : ''
    return acc
  }, {})

  return {
    observacion: source.observacion || legacyRows.find((row) => row?.observacion)?.observacion || '',
    meses
  }
}

function normalizeRow(row, index) {
  const normalized = {
    id: row?.id || `${index + 1}`,
    kind: row?.kind || 'item',
    label: row?.label || defaultRows[index] || `Item ${index + 1}`,
    days: row?.days && typeof row.days === 'object' ? { ...row.days } : emptyDays()
  }
  ensureDays(normalized)
  return normalized
}

function onDayValueChange(row, dayKey, value) {
  if (!row || row.kind === 'group') return
  const body = Array.isArray(attrRef.value.body) ? attrRef.value.body : []
  attrRef.value.body = body.map((currentRow, index) => {
    const normalized = normalizeRow(currentRow, index)
    if ((normalized.id || `${index + 1}`) !== (row.id || `${index + 1}`)) return normalized
    return {
      ...normalized,
      days: {
        ...normalized.days,
        [dayKey]: normalizeValue(value)
      }
    }
  })
  renderTick.value += 1
  emit('change')
}

function getMonthColor(monthKey) {
  renderTick.value
  return colorCoding.value?.meses?.[monthKey] || ''
}

function getMonthColorLabel(monthKey) {
  const colorKey = getMonthColor(monthKey)
  return colorConfig.find((color) => color.key === colorKey)?.label || 'SIN COLOR'
}

function cycleMonthColor(monthKey) {
  if (props.disabled) return
  ensureColorCoding()
  const current = attrRef.value.codificacionColores?.meses?.[monthKey] || ''
  const colorKeys = colorConfig.map((color) => color.key)
  const currentIndex = colorKeys.indexOf(current)
  const nextColor = currentIndex === -1
    ? colorKeys[0]
    : colorKeys[(currentIndex + 1) % colorKeys.length]

  attrRef.value.codificacionColores = {
    ...attrRef.value.codificacionColores,
    meses: {
      ...(attrRef.value.codificacionColores?.meses || {}),
      [monthKey]: current && currentIndex === colorKeys.length - 1 ? '' : nextColor
    }
  }
  renderTick.value += 1
  emit('change')
}

function setColorObservation(value) {
  ensureColorCoding()
  attrRef.value.codificacionColores = {
    ...attrRef.value.codificacionColores,
    observacion: value || ''
  }
  renderTick.value += 1
  emit('change')
}
</script>

<style scoped>
.radial-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: stretch;
  align-items: stretch;
  gap: 10px;
  width: 100%;
}

.radial-panels :deep(.v-expansion-panels),
.radial-panels :deep(.v-expansion-panel),
.radial-panels :deep(.v-expansion-panel-title),
.radial-panels :deep(.v-expansion-panel-text) {
  width: 100%;
  max-width: none;
}

.radial-panels :deep(.v-expansion-panel) {
  flex: 1 1 100%;
}

.fecha-inicio-field :deep(.v-field) {
  min-height: 48px;
}

.fecha-inicio-field :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 14px;
  padding-bottom: 4px;
  font-size: 15px;
  font-weight: 800;
}

.fecha-inicio-field :deep(.v-field-label) {
  font-size: 12px;
  font-weight: 800;
}

.radial-card {
  width: 100%;
  max-width: none !important;
  justify-self: stretch;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  overflow: hidden;
}

.radial-card-title {
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  font-weight: 800;
}

.radial-card :deep(.v-expansion-panel-title__overlay),
.radial-card :deep(.v-expansion-panel-title__icon) {
  flex: 0 0 auto;
}

.title-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.day-title-text {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.day-date {
  flex: 0 0 auto;
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 999px;
  padding: 2px 8px;
  color: #a7f3d0;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.1;
  background: rgba(6, 78, 59, 0.32);
}

.answered-count {
  flex: 0 0 auto;
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 999px;
  padding: 2px 8px;
  color: #a7f3d0;
  font-size: 12px;
  font-weight: 800;
}

.question-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.question-row:last-child {
  border-bottom: none;
}

.question-text {
  display: flex;
  min-width: 0;
  gap: 6px;
  color: #e5eefb;
  font-size: 14px;
  line-height: 1.25;
}

.question-number {
  flex: 0 0 auto;
  font-weight: 700;
}

.answer-checks {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
  min-width: 150px;
}

.answer-check {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 7px;
  background: rgba(15, 23, 42, 0.72);
  color: #dbeafe;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}

.answer-check:disabled {
  opacity: 0.65;
}

.answer-check--active.answer-check--si {
  background: rgba(21, 128, 61, 0.32);
  border-color: #22c55e;
  color: #dcfce7;
}

.answer-check--active.answer-check--no {
  background: rgba(185, 28, 28, 0.32);
  border-color: #ef4444;
  color: #fee2e2;
}

.answer-check--active.answer-check--na {
  background: rgba(71, 85, 105, 0.36);
  border-color: #94a3b8;
  color: #f8fafc;
}

.check-box {
  width: 13px;
  height: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid currentColor;
  border-radius: 3px;
  flex: 0 0 auto;
}

.color-card {
  margin-top: 14px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.72);
}

.color-card-title {
  min-height: 44px;
  padding: 12px;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  background: rgba(30, 41, 59, 0.86);
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
}

.color-card-body {
  display: grid;
  gap: 12px;
  padding: 12px;
}

.color-legend {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.color-label {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
}

.color-label--amarillo {
  background: #facc15;
}

.color-label--rojo {
  background: #ef4444;
  color: #fff;
}

.color-label--azul {
  background: #0ea5e9;
  color: #fff;
}

.color-label--verde {
  background: #22c55e;
}

.color-observation {
  width: 100%;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.month-cycle-button {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 7px;
  background: rgba(15, 23, 42, 0.72);
  color: #dbeafe;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.1;
}

.month-cycle-button span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.month-color-name {
  flex: 0 0 auto;
  font-size: 9px;
}

.month-cycle-button--amarillo {
  background: #facc15;
  border-color: #facc15;
  color: #0f172a;
}

.month-cycle-button--rojo {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}

.month-cycle-button--azul {
  background: #0ea5e9;
  border-color: #38bdf8;
  color: #fff;
}

.month-cycle-button--verde {
  background: #22c55e;
  border-color: #22c55e;
  color: #0f172a;
}

@media (max-width: 600px) {
  .question-row {
    grid-template-columns: 1fr;
    gap: 8px;
    align-items: stretch;
  }

  .answer-checks {
    width: 100%;
    min-width: 0;
  }

  .color-legend {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .month-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
