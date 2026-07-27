<template>
  <div class="checklist-visibilidad-dmh">
    <v-row dense class="mb-3">
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="fechaInicioModel"
          type="date"
          label="Inspeccion desde"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="onFechaInicioChange"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          :model-value="fechaTerminoModel"
          type="date"
          label="Inspeccion hasta"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="onFechaTerminoChange"
        />
      </v-col>
    </v-row>

    <v-expansion-panels v-model="openDays" multiple class="day-panels">
      <v-expansion-panel
        v-for="day in days"
        :key="day.key"
        :value="day.key"
        class="day-card"
      >
        <v-expansion-panel-title class="day-title">
          <div class="title-content">
            <span class="day-name">
              <span>{{ day.label }}</span>
              <span class="day-date">{{ getDayDate(day.index) }}</span>
            </span>
            <span class="answered-count">{{ getAnsweredCount(day.key) }}/{{ totalItems }}</span>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <section
            v-for="group in groups"
            :key="`${day.key}-${group.id}`"
            class="group-block"
          >
            <div class="group-title">
              <span>{{ group.title }}</span>
              <span class="group-count">{{ getGroupAnsweredCount(group, day.key) }}/{{ group.items.length }}</span>
            </div>

            <div
              v-for="item in group.items"
              :key="`${day.key}-${item.id}`"
              class="item-row"
            >
              <div class="item-question">
                <span class="item-number">{{ item.numero }}.</span>
                <span>{{ item.label }}</span>
              </div>

              <div class="state-row">
                <button
                  v-for="state in getStates(group)"
                  :key="`${day.key}-${item.id}-${state.value}`"
                  type="button"
                  :disabled="disabled"
                  :class="['state-toggle', getDayValue(item, day.key) === state.value ? `state-toggle--${state.value}` : '']"
                  @click="setDayValue(item, day.key, state.value)"
                >
                  {{ state.label }}
                </button>
              </div>
            </div>
          </section>

          <v-textarea
            :model-value="getObservation(day.key)"
            label="Observacion y/o acciones correctivas"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            hide-details
            :disabled="disabled"
            @update:model-value="(value) => setObservation(day.key, value)"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
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
  { key: 'miercoles', label: 'Miercoles', index: 0 },
  { key: 'jueves', label: 'Jueves', index: 1 },
  { key: 'viernes', label: 'Viernes', index: 2 },
  { key: 'sabado', label: 'Sabado', index: 3 },
  { key: 'domingo', label: 'Domingo', index: 4 },
  { key: 'lunes', label: 'Lunes', index: 5 },
  { key: 'martes', label: 'Martes', index: 6 }
]

const openDays = ref(days.map((day) => day.key))

const statesBM = [
  { value: 'b', label: 'B' },
  { value: 'm', label: 'M' }
]

const statesSiNo = [
  { value: 'si', label: 'SI' },
  { value: 'no', label: 'NO' }
]

const groups = [
  {
    id: 'ropa',
    title: 'Ropa de Alta Visibilidad Fluorescente Retroreflectante',
    stateType: 'bm',
    items: [
      item(1, 'Ropa color fluorescente (naranjo o amarillo).'),
      item(2, 'Revisar que las bandas reflectantes esten intactas y bien adheridas.'),
      item(3, 'Comprobar que las bandas no esten desgastadas o dañadas.'),
      item(4, 'Asegurarse de que en la ropa no haya decoloracion significativa.'),
      item(5, 'Verificar que la ropa este limpia y libre de suciedad excesiva.'),
      item(6, 'Inspeccionar por desgarros, agujeros o rasguños en la tela.')
    ]
  },
  {
    id: 'cintas',
    title: 'Cintas reflectantes, Pertiga y Baliza',
    stateType: 'sino',
    items: [
      item(7, 'Color del vehiculo liviano de alta visibilidad.'),
      item(8, 'Cintas reflectantes reglamentarias en vehiculos/equipos segun altura. Confirmar visibilidad lateral y posterior. Validar cumplimiento de numero visible.')
    ]
  },
  {
    id: 'mina',
    title: 'Exclusivo Area Mina',
    stateType: 'sino',
    items: [
      item(9, 'Pertiga con banderin reflectante y luz intermitente visible. Confirmar altura minima (>= 4,60 m) y que se encuentra encendida en zonas mina.'),
      item(10, 'Baliza instaladas con visibilidad 360°. Confirmar encendido continuo durante operacion (area mina - escoltas).')
    ]
  }
]

const totalItems = groups.reduce((acc, group) => acc + group.items.length, 0)

const fechaInicioModel = computed({
  get() {
    return normalizeDate(attrRef.value?.fechaInicio) || todayIso()
  },
  set(value) {
    attrRef.value.fechaInicio = normalizeDate(value) || todayIso()
  }
})

const fechaTerminoModel = computed(() => {
  return normalizeDate(attrRef.value?.fechaTermino) || addDaysIso(fechaInicioModel.value, 6)
})

onMounted(() => {
  ensureBody()
})

function item(numero, label) {
  return {
    id: `item-${numero}`,
    numero,
    label
  }
}

function todayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDate(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return raw
  const local = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  if (local) return `${local[3]}-${local[2]}-${local[1]}`
  return ''
}

function parseDate(value) {
  const normalized = normalizeDate(value)
  const parts = normalized.split('-').map(Number)
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null
  const [year, month, day] = parts
  return new Date(year, month - 1, day)
}

function addDaysIso(value, daysToAdd) {
  const base = parseDate(value) || parseDate(todayIso())
  const date = new Date(base)
  date.setDate(base.getDate() + Number(daysToAdd || 0))
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDayDate(index) {
  renderTick.value
  const value = addDaysIso(attrRef.value?.fechaInicio || todayIso(), index)
  const date = parseDate(value)
  return date
    ? date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''
}

function normalizeValue(value, stateType) {
  const normalized = String(value ?? '').trim().toLowerCase()
  const allowed = stateType === 'bm' ? ['b', 'm'] : ['si', 'no']
  return allowed.includes(normalized) ? normalized : ''
}

function ensureBody() {
  if (!attrRef.value || typeof attrRef.value !== 'object') return
  attrRef.value.fechaInicio = normalizeDate(attrRef.value.fechaInicio) || todayIso()
  attrRef.value.fechaTermino = normalizeDate(attrRef.value.fechaTermino) || addDaysIso(attrRef.value.fechaInicio, 6)

  if (!Array.isArray(attrRef.value.items)) attrRef.value.items = []
  const savedItems = attrRef.value.items
  attrRef.value.items = groups.flatMap((group) =>
    group.items.map((base) => {
      const saved = savedItems.find((current) => Number(current?.numero) === base.numero) || {}
      const daysValue = {}
      days.forEach((day) => {
        daysValue[day.key] = normalizeValue(saved?.days?.[day.key], group.stateType)
      })
      return {
        id: saved.id || base.id,
        numero: base.numero,
        label: saved.label || base.label,
        groupId: group.id,
        stateType: group.stateType,
        days: daysValue
      }
    })
  )

  if (!attrRef.value.observaciones || typeof attrRef.value.observaciones !== 'object') {
    attrRef.value.observaciones = {}
  }
  days.forEach((day) => {
    attrRef.value.observaciones[day.key] = String(attrRef.value.observaciones[day.key] ?? '')
  })

  renderTick.value += 1
}

function changed() {
  renderTick.value += 1
  emit('change')
}

function getStates(group) {
  return group.stateType === 'bm' ? statesBM : statesSiNo
}

function getSavedItem(base) {
  return (attrRef.value.items || []).find((current) => Number(current.numero) === base.numero) || base
}

function getDayValue(base, dayKey) {
  renderTick.value
  const saved = getSavedItem(base)
  return normalizeValue(saved?.days?.[dayKey], saved?.stateType || 'sino')
}

function setDayValue(base, dayKey, value) {
  if (props.disabled) return
  ensureBody()
  const saved = getSavedItem(base)
  if (!saved.days || typeof saved.days !== 'object') saved.days = {}
  saved.days[dayKey] = saved.days[dayKey] === value ? '' : value
  changed()
}

function getGroupAnsweredCount(group, dayKey) {
  renderTick.value
  return group.items.filter((base) => getDayValue(base, dayKey)).length
}

function getAnsweredCount(dayKey) {
  renderTick.value
  return groups.reduce((acc, group) => acc + getGroupAnsweredCount(group, dayKey), 0)
}

function getObservation(dayKey) {
  renderTick.value
  return attrRef.value?.observaciones?.[dayKey] || ''
}

function setObservation(dayKey, value) {
  if (props.disabled) return
  if (!attrRef.value.observaciones || typeof attrRef.value.observaciones !== 'object') {
    attrRef.value.observaciones = {}
  }
  attrRef.value.observaciones[dayKey] = value || ''
  changed()
}

function onFechaInicioChange(value) {
  attrRef.value.fechaInicio = normalizeDate(value) || todayIso()
  attrRef.value.fechaTermino = addDaysIso(attrRef.value.fechaInicio, 6)
  changed()
}

function onFechaTerminoChange(value) {
  attrRef.value.fechaTermino = normalizeDate(value) || addDaysIso(attrRef.value.fechaInicio, 6)
  changed()
}
</script>

<style scoped>
.checklist-visibilidad-dmh {
  display: grid;
  gap: 12px;
  width: 100%;
}

.day-panels {
  display: grid;
  gap: 10px;
  width: 100%;
}

.day-card {
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  overflow: hidden;
}

.day-title {
  min-height: 46px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 900;
}

.title-content,
.group-title {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.day-name {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.day-date,
.answered-count,
.group-count {
  flex: 0 0 auto;
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 999px;
  padding: 2px 8px;
  color: #a7f3d0;
  font-size: 11px;
  font-weight: 900;
}

.group-block {
  overflow: hidden;
  margin-bottom: 10px;
  border: 1px solid rgba(20, 184, 166, 0.45);
  border-radius: 7px;
  background: rgba(2, 6, 23, 0.12);
}

.group-title {
  min-height: 40px;
  padding: 9px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  background: rgba(30, 41, 59, 0.86);
}

.item-row {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.18);
}

.item-question {
  display: flex;
  gap: 7px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 850;
  line-height: 1.25;
}

.item-number {
  flex: 0 0 auto;
  color: #fde68a;
  font-weight: 900;
}

.state-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.state-toggle {
  min-height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  background: rgba(71, 85, 105, 0.32);
  color: #dbeafe;
  font-size: 11px;
  font-weight: 900;
}

.state-toggle--b,
.state-toggle--si {
  background: rgba(6, 95, 70, 0.52);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.state-toggle--m,
.state-toggle--no {
  background: rgba(127, 29, 29, 0.45);
  border-color: rgba(239, 68, 68, 0.72);
  color: #fee2e2;
}
</style>
