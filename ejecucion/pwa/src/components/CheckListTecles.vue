<template>
  <div class="checklist-tecles">
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
            v-for="(item, index) in checklistItems"
            :key="`${day.key}-${item.id || index}`"
            class="d-flex align-center justify-space-between py-1 day-row"
          >
            <div class="question-text pr-3">
              {{ index + 1 }}. {{ item.label || `Item ${index + 1}` }}
            </div>

            <div class="check-col">
              <v-checkbox
                :model-value="getDayChecked(item, day.key)"
                :disabled="disabled"
                density="compact"
                hide-details
                @update:model-value="(val) => onDayCheck(item, day.key, val)"
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
          v-for="(item, index) in checklistItems"
          :key="`summary-${item.id || index}`"
          class="mb-4"
        >
          <div class="font-weight-medium mb-2">
            {{ index + 1 }}. {{ item.label || `Item ${index + 1}` }}
          </div>

          <v-btn-toggle
            :model-value="getSummaryValue(item)"
            :disabled="disabled"
            mandatory
            density="compact"
            class="mb-2"
            @update:model-value="(val) => onSummaryToggle(item, val)"
          >
            <v-btn
              v-for="option in getOptions(item)"
              :key="option.id || option.value"
              :value="normalizeValue(option.id || option.value)"
              size="small"
            >
              {{ option.label || option.value }}
            </v-btn>
          </v-btn-toggle>

          <v-textarea
            v-model="item.obs"
            :disabled="disabled"
            variant="outlined"
            rows="2"
            auto-grow
            hide-details
            :label="requiresObservation(getSummaryValue(item)) ? 'Observaciones (obligatorio)' : 'Observaciones'"
            :placeholder="requiresObservation(getSummaryValue(item))
              ? 'Debe ingresar observacion para NO o N/A'
              : 'Observacion opcional'"
            @update:model-value="emitChange"
          />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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

const defaultOptions = [
  { id: 'si', label: 'SI' },
  { id: 'no', label: 'NO' },
  { id: 'n/a', label: 'N/A' }
]

const days = [
  { key: 'l', title: 'LUNES' },
  { key: 'ma', title: 'MARTES' },
  { key: 'mi', title: 'MIERCOLES' },
  { key: 'j', title: 'JUEVES' },
  { key: 'v', title: 'VIERNES' }
]

const checklistItems = computed(() => {
  const items = props.attr?.checkBoby || props.attr?.checkBody || []
  return Array.isArray(items) ? items : []
})

function getDaySegmentTitle(dayName) {
  const base = 'Chack List Tecles'
  return `${base} (${dayName})`
}

function normalizeValue(val) {
  const current = (val ?? '').toString().trim().toLowerCase()
  if (current === 'na') return 'n/a'
  return current
}

function toBoolean(val) {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return val.trim() !== ''
  if (typeof val === 'number') return val === 1
  return false
}

function requiresObservation(val) {
  const current = normalizeValue(val)
  return current === 'no' || current === 'n/a'
}

function ensureDays(item) {
  if (!item.days || typeof item.days !== 'object') {
    item.days = { l: false, ma: false, mi: false, j: false, v: false }
  }

  for (const day of days) {
    item.days[day.key] = toBoolean(item.days[day.key])
  }
}

function ensureItemDefaults(item) {
  ensureDays(item)
  if (item.default === undefined || item.default === null) item.default = ''
  item.default = normalizeValue(item.default)
  if (item.obs === undefined || item.obs === null) item.obs = ''
}

function getOptions(item) {
  return item?.options?.length
    ? item.options
    : (props.attr?.options?.length ? props.attr.options : defaultOptions)
}

function getDayChecked(item, key) {
  ensureItemDefaults(item)
  return !!item.days[key]
}

function getSummaryValue(item) {
  ensureItemDefaults(item)
  return item.default
}

function onDayCheck(item, dayKey, val) {
  ensureItemDefaults(item)
  item.days[dayKey] = !!val
  emitChange()
}

function onSummaryToggle(item, val) {
  ensureItemDefaults(item)
  item.default = normalizeValue(val)

  if (item.default === 'n/a') {
    for (const day of days) item.days[day.key] = false
  }

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
