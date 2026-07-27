<template>
  <div class="checklist-arnes-respirador">
    <v-row dense class="date-row">
      <v-col cols="12" sm="4">
        <v-text-field
          v-model="fechaInicioModel"
          type="date"
          label="Fecha de inspeccion"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          class="date-field"
          @update:model-value="onFechaInicioChange"
        />
      </v-col>

      <v-col cols="12" sm="8">
        <div class="day-date-grid">
          <div
            v-for="day in days"
            :key="day.key"
            class="day-date-card"
          >
            <span class="day-letter">{{ day.label }}</span>
            <input
              :value="getDayDateValue(day.key)"
              type="date"
              :disabled="disabled"
              class="day-date-input"
              @input="setDayDate(day.key, $event.target.value)"
            />
          </div>
        </div>
      </v-col>
    </v-row>

    <v-expansion-panels v-model="openSections" multiple class="main-panels">
      <v-expansion-panel value="arnes" class="main-card">
        <v-expansion-panel-title class="main-title">
          ARNES DE SEGURIDAD
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-expansion-panels v-model="openGroups" multiple class="group-panels">
            <v-expansion-panel
              v-for="group in arnesGroups"
              :key="group.id"
              :value="group.id"
              class="group-card"
            >
              <v-expansion-panel-title class="group-title">
                <span>{{ group.title }}</span>
                <span class="group-count">{{ getGroupSiCount(group) }}/{{ group.items.length }}</span>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <div
                  v-for="item in group.items"
                  :key="item.id"
                  class="item-card"
                >
                  <div class="item-question">
                    <span class="item-number">{{ item.numero }}.</span>
                    <span>{{ item.label }}</span>
                  </div>

                  <div class="item-days">
                    <button
                      v-for="day in days"
                      :key="`${item.id}-${day.key}`"
                      type="button"
                      :disabled="disabled"
                      :class="[
                        'day-toggle',
                        getDayValue(item, day.key) === 'si' ? 'day-toggle--si' : 'day-toggle--no'
                      ]"
                      @click="toggleDay(item, day.key)"
                    >
                      <span>{{ day.label }}</span>
                      <strong>{{ getDayValue(item, day.key).toUpperCase() }}</strong>
                    </button>
                  </div>

                  <v-textarea
                    :model-value="item.observacion"
                    label="Observaciones"
                    variant="outlined"
                    density="compact"
                    rows="1"
                    auto-grow
                    hide-details
                    :disabled="disabled"
                    class="item-observation"
                    @update:model-value="(value) => setObservation(item, value)"
                  />
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-card class="info-card" elevation="0">
      <v-card-title class="info-title">
        DATOS DEL ARNES
      </v-card-title>

      <v-card-text class="info-body">
        <v-row dense>
          <v-col
            v-for="field in equipoFields"
            :key="field.key"
            cols="12"
            sm="6"
          >
            <v-text-field
              :model-value="getEquipoValue(field.key)"
              :label="field.label"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setEquipoValue(field.key, value)"
            />
          </v-col>
        </v-row>

        <div class="arnes-image-wrap">
          <img
            :src="arnesImageSrc"
            alt="Partes del arnes de seguridad"
            class="arnes-image"
          />
        </div>
      </v-card-text>
    </v-card>

    <v-expansion-panels v-model="openSections" multiple class="main-panels">
      <v-expansion-panel value="respirador" class="main-card">
        <v-expansion-panel-title class="main-title">
          RESPIRADOR (EPR)
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div
            v-for="item in respiradorItems"
            :key="item.id"
            class="item-card"
          >
            <div class="item-question">
              <span class="item-number">{{ item.numero }}.</span>
              <span>{{ item.label }}</span>
            </div>

            <div class="item-days">
              <button
                v-for="day in days"
                :key="`${item.id}-${day.key}`"
                type="button"
                :disabled="disabled"
                :class="[
                  'day-toggle',
                  `day-toggle--${getDayValue(item, day.key, 'respirador')}`
                ]"
                @click="toggleRespiradorDay(item, day.key)"
              >
                <span>{{ day.label }}</span>
                <strong>{{ getDayValue(item, day.key, 'respirador').toUpperCase() }}</strong>
              </button>
            </div>

            <v-textarea
              :model-value="item.observacion"
              label="Observaciones"
              variant="outlined"
              density="compact"
              rows="1"
              auto-grow
              hide-details
              :disabled="disabled"
              class="item-observation"
              @update:model-value="(value) => setObservation(item, value)"
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-card class="info-card" elevation="0">
      <v-card-title class="info-title">
        NOTA: Cualquier deterioro del equipo debe ser desechado inmediatamente
      </v-card-title>
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
const arnesImageSrc = `${process.env.BASE_URL || '/'}checklist-assets/image1.jpeg`

const days = [
  { key: 'm1', label: 'M', index: 0 },
  { key: 'm2', label: 'M', index: 1 },
  { key: 'j', label: 'J', index: 2 },
  { key: 'v', label: 'V', index: 3 },
  { key: 's', label: 'S', index: 4 },
  { key: 'd', label: 'D', index: 5 },
  { key: 'l', label: 'L', index: 6 }
]

const defaultGroups = [
  {
    id: 'correas',
    title: 'Correas, cintas o tirantes sinteticas presentan:',
    items: [
      'Cortes, deshilachadas, rasgaduras, desgarros, abrasiones.',
      'Corrosion por exposicion a: acido, productos quimicos, aceites, grasas.',
      'Senales de quemaduras o exposicion al calor.',
      'Estiramiento excesivo'
    ]
  },
  {
    id: 'accesorios',
    title: 'Accesorios metalicos, argolla tipo D y mosquetones',
    items: [
      'Presentan torceduras, aplastamiento, dobladuras, fisuras'
    ]
  },
  {
    id: 'hebillas',
    title: 'Hebillas de ajuste, de fijacion presentan:',
    items: [
      'Desgaste o deformaciones (Dobladuras, torceduras).',
      'Picaduras, grietas, fisuras, trisaduras, roturas parciales.',
      'Corrosion (presencia visible de oxido).',
      'Sistema antitrauma esta en buen estado'
    ]
  },
  {
    id: 'cola-vida',
    title: 'Cola de vida presenta:',
    items: [
      'Quemaduras, corrosion, picaduras, cortes.',
      'Estiramiento excesivo',
      'Los mosquetones de enganche estan en buen estado'
    ]
  },
  {
    id: 'estrobos',
    title: 'Estrobos o lineas de conexion y amortiguador de impacto',
    items: [
      'Los estrobos y/o lineas de conexion estan en buen estado',
      'Linea de vida esta en buen estado',
      'Linea de vida esta en buen estado'
    ]
  }
]

const defaultRespiradorItems = [
  'Cuerpo del respirador encuentran en buen estado',
  'Valvula de inhalacion y exhalacion encuentran en buen estado',
  'Arnes encuentran en buen estado',
  'Filtros encuentran en buen estado',
  'Realizo prueba de ajuste sello',
  'Respirador se encuentra limpio'
]

const equipoFields = [
  { key: 'marcaModelo', label: 'MARCA / MODELO' },
  { key: 'codigoArnes', label: 'CODIGO ARNES' },
  { key: 'codigoColas', label: 'CODIGO COLAS' },
  { key: 'codigoAbsImpac', label: 'CODIGO ABS IMPAC' },
  { key: 'codigoRetractil', label: 'CODIGO RETRACTIL' }
]

const openSections = ref(['arnes'])
const openGroups = ref([])

const fechaInicioModel = computed({
  get() {
    const normalized = normalizeDateForInput(attrRef.value?.fechaInicio)
    return normalized || todayIso()
  },
  set(value) {
    attrRef.value.fechaInicio = normalizeDateForInput(value) || todayIso()
  }
})

const arnesGroups = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value?.arnes?.groups) ? attrRef.value.arnes.groups : []
})

const respiradorItems = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value?.respirador?.items) ? attrRef.value.respirador.items : []
})

onMounted(() => {
  ensureBody()
})

function emptyDays(value = 'no') {
  return days.reduce((acc, day) => {
    acc[day.key] = value
    return acc
  }, {})
}

function normalizeValue(value) {
  return String(value ?? '').trim().toLowerCase() === 'si' ? 'si' : 'no'
}

function normalizeRespiradorValue(value) {
  const current = String(value ?? '').trim().toLowerCase()
  if (current === 'si' || current === 'no') return current
  return '-'
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

function addDaysIso(baseDate, offset) {
  const base = parseLocalDate(baseDate)
  if (!base) return todayIso()
  const next = new Date(base)
  next.setDate(base.getDate() + Number(offset || 0))
  const year = next.getFullYear()
  const month = String(next.getMonth() + 1).padStart(2, '0')
  const day = String(next.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ensureDatesFromStart(force = false) {
  if (!attrRef.value.fechasPorDia || typeof attrRef.value.fechasPorDia !== 'object') {
    attrRef.value.fechasPorDia = {}
  }

  for (const day of days) {
    if (force || !normalizeDateForInput(attrRef.value.fechasPorDia[day.key])) {
      attrRef.value.fechasPorDia[day.key] = addDaysIso(attrRef.value.fechaInicio, day.index)
    }
  }
}

function ensureBody() {
  if (!attrRef.value || typeof attrRef.value !== 'object') return

  attrRef.value.fechaInicio = normalizeDateForInput(attrRef.value.fechaInicio) || todayIso()
  ensureDatesFromStart(false)
  ensureEquipo()
  ensureRespirador()
  if (!attrRef.value.arnes || typeof attrRef.value.arnes !== 'object') attrRef.value.arnes = {}
  if (!Array.isArray(attrRef.value.arnes.groups) || !attrRef.value.arnes.groups.length) {
    let number = 1
    attrRef.value.arnes.groups = defaultGroups.map((group) => ({
      id: group.id,
      title: group.title,
      items: group.items.map((label) => ({
        id: `${number}`,
        numero: number++,
        label,
        days: emptyDays('no'),
        observacion: ''
      }))
    }))
    renderTick.value += 1
    return
  }

  let number = 1
  attrRef.value.arnes.groups = defaultGroups.map((group, groupIndex) => {
    const savedGroup = attrRef.value.arnes.groups.find((item) => item?.id === group.id) ||
      attrRef.value.arnes.groups[groupIndex] ||
      {}
    const savedItems = Array.isArray(savedGroup.items) ? savedGroup.items : []

    return {
      id: group.id,
      title: savedGroup.title || group.title,
      items: group.items.map((label, itemIndex) => {
        const savedItem = savedItems[itemIndex] || {}
        return {
          id: savedItem.id || `${number}`,
          numero: number++,
          label: savedItem.label || label,
          days: days.reduce((acc, day) => {
            acc[day.key] = normalizeValue(savedItem?.days?.[day.key])
            return acc
          }, {}),
          observacion: savedItem.observacion || ''
        }
      })
    }
  })
  renderTick.value += 1
}

function ensureEquipo() {
  if (!attrRef.value.equipo || typeof attrRef.value.equipo !== 'object') attrRef.value.equipo = {}
  for (const field of equipoFields) {
    if (attrRef.value.equipo[field.key] === undefined || attrRef.value.equipo[field.key] === null) {
      attrRef.value.equipo[field.key] = ''
    }
  }
}

function ensureRespirador() {
  if (!attrRef.value.respirador || typeof attrRef.value.respirador !== 'object') attrRef.value.respirador = {}
  const savedItems = Array.isArray(attrRef.value.respirador.items) ? attrRef.value.respirador.items : []
  const migrateInitialNoToDash = attrRef.value.respirador.estadoInicialMigrado !== true

  attrRef.value.respirador.items = defaultRespiradorItems.map((label, index) => {
    const savedItem = savedItems[index] || {}
    return {
      id: savedItem.id || `resp-${index + 12}`,
      numero: savedItem.numero || index + 12,
      label: savedItem.label || label,
      days: days.reduce((acc, day) => {
        const normalized = normalizeRespiradorValue(savedItem?.days?.[day.key])
        acc[day.key] = migrateInitialNoToDash && normalized === 'no' ? '-' : normalized
        return acc
      }, {}),
      observacion: savedItem.observacion || ''
    }
  })
  attrRef.value.respirador.estadoInicialMigrado = true
}

function onFechaInicioChange(value) {
  attrRef.value.fechaInicio = normalizeDateForInput(value) || todayIso()
  ensureDatesFromStart(true)
  renderTick.value += 1
  emit('change')
}

function getDayDateValue(dayKey) {
  renderTick.value
  ensureDatesFromStart(false)
  return normalizeDateForInput(attrRef.value?.fechasPorDia?.[dayKey]) || todayIso()
}

function setDayDate(dayKey, value) {
  ensureDatesFromStart(false)
  attrRef.value.fechasPorDia[dayKey] = normalizeDateForInput(value) || todayIso()
  renderTick.value += 1
  emit('change')
}

function getDayValue(item, dayKey, mode = 'arnes') {
  renderTick.value
  const defaultValue = mode === 'respirador' ? '-' : 'no'
  if (!item.days || typeof item.days !== 'object') item.days = emptyDays(defaultValue)
  item.days[dayKey] = mode === 'respirador'
    ? normalizeRespiradorValue(item.days[dayKey])
    : normalizeValue(item.days[dayKey])
  return item.days[dayKey]
}

function toggleDay(item, dayKey) {
  if (props.disabled || !item) return
  if (!item.days || typeof item.days !== 'object') item.days = emptyDays('no')
  item.days[dayKey] = getDayValue(item, dayKey) === 'si' ? 'no' : 'si'
  renderTick.value += 1
  emit('change')
}

function toggleRespiradorDay(item, dayKey) {
  if (props.disabled || !item) return
  if (!item.days || typeof item.days !== 'object') item.days = emptyDays('-')
  const current = getDayValue(item, dayKey, 'respirador')
  item.days[dayKey] = current === '-' ? 'si' : (current === 'si' ? 'no' : '-')
  renderTick.value += 1
  emit('change')
}

function setObservation(item, value) {
  if (!item) return
  item.observacion = value || ''
  renderTick.value += 1
  emit('change')
}

function getEquipoValue(key) {
  renderTick.value
  ensureEquipo()
  return attrRef.value.equipo[key] || ''
}

function setEquipoValue(key, value) {
  ensureEquipo()
  attrRef.value.equipo[key] = value || ''
  renderTick.value += 1
  emit('change')
}

function getGroupSiCount(group) {
  renderTick.value
  return (group?.items || []).filter((item) =>
    days.some((day) => getDayValue(item, day.key) === 'si')
  ).length
}
</script>

<style scoped>
.checklist-arnes-respirador {
  display: grid;
  gap: 12px;
}

.date-field :deep(.v-field) {
  min-height: 48px;
}

.date-field :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 14px;
  padding-bottom: 4px;
  font-size: 15px;
  font-weight: 800;
}

.day-date-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}

.day-date-card {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.day-letter {
  display: inline-flex;
  justify-content: center;
  border-radius: 6px;
  padding: 2px 0;
  background: #facc15;
  color: #111827;
  font-size: 12px;
  font-weight: 900;
}

.day-date-input {
  width: 100%;
  min-width: 0;
  height: 30px;
  padding: 0 4px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.72);
  color: #e5eefb;
  font-size: 10px;
  font-weight: 800;
}

.main-panels,
.group-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: stretch;
  align-items: stretch;
  gap: 10px;
  width: 100%;
}

.main-panels :deep(.v-expansion-panels),
.main-panels :deep(.v-expansion-panel),
.main-panels :deep(.v-expansion-panel-title),
.main-panels :deep(.v-expansion-panel-text),
.group-panels :deep(.v-expansion-panels),
.group-panels :deep(.v-expansion-panel),
.group-panels :deep(.v-expansion-panel-title),
.group-panels :deep(.v-expansion-panel-text) {
  width: 100%;
  max-width: none;
}

.main-panels :deep(.v-expansion-panel),
.group-panels :deep(.v-expansion-panel) {
  flex: 1 1 100%;
}

.main-card,
.group-card {
  width: 100%;
  max-width: none !important;
  justify-self: stretch;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  background: rgba(15, 23, 42, 0.72);
}

.main-title,
.group-title {
  min-height: 46px;
  padding: 10px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  white-space: normal;
}

.group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.group-count {
  flex: 0 0 auto;
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 999px;
  padding: 2px 8px;
  background: rgba(6, 78, 59, 0.32);
  color: #a7f3d0;
  font-size: 11px;
  font-weight: 900;
}

.item-card {
  display: grid;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.item-card:last-child {
  border-bottom: none;
}

.item-question {
  display: flex;
  gap: 6px;
  color: #e5eefb;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
}

.item-number {
  flex: 0 0 auto;
}

.item-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}

.day-toggle {
  min-height: 34px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 7px;
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
}

.day-toggle--no {
  background: rgba(127, 29, 29, 0.34);
  border-color: rgba(239, 68, 68, 0.58);
  color: #fee2e2;
}

.day-toggle--si {
  background: rgba(6, 95, 70, 0.42);
  border-color: rgba(16, 185, 129, 0.7);
  color: #dcfce7;
}

.day-toggle--- {
  background: rgba(250, 204, 21, 0.32);
  border-color: rgba(250, 204, 21, 0.78);
  color: #fef9c3;
}

.item-observation {
  width: 100%;
}

.info-card {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.72);
}

.info-title {
  min-height: 44px;
  padding: 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  white-space: normal;
  background: rgba(30, 41, 59, 0.86);
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
}

.info-body {
  display: grid;
  gap: 12px;
}

.arnes-image-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  background: #fff;
}

.arnes-image {
  display: block;
  width: 100%;
  max-width: 520px;
  height: auto;
  object-fit: contain;
}

@media (max-width: 600px) {
  .day-date-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .item-days {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
