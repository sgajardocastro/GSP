<template>
  <div class="checklist-aseo-dmh">
    <article
      v-for="(control, index) in controles"
      :key="control.id"
      class="control-card"
    >
      <div class="control-head">
        <strong>Control {{ index + 1 }}</strong>
        <div class="control-actions">
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="tonal"
            color="error"
            class="delete-btn"
            :disabled="disabled"
            @click="removeControl(control)"
          />
          <v-btn
            :icon="control.cerrado ? 'mdi-chevron-down' : 'mdi-chevron-up'"
            size="small"
            variant="tonal"
            class="collapse-btn"
            @click="toggleControl(control)"
          />
        </div>
      </div>

      <div v-show="!control.cerrado" class="control-body">
        <v-text-field
          :model-value="control.fecha"
          type="date"
          label="Dia"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="(value) => setControlField(control, 'fecha', normalizeDate(value))"
        />

        <section
          v-for="group in control.grupos"
          :key="`${control.id}-${group.id}`"
          :class="['group-block', { 'group-block--closed': group.cerrado }]"
        >
          <button
            type="button"
            class="group-title"
            @click="toggleGroup(control, group)"
          >
            <span>{{ group.title }}</span>
            <span class="group-actions">
              <span class="answered-count">{{ getGroupAnsweredCount(group) }}</span>
              <v-icon size="18" :icon="group.cerrado ? 'mdi-chevron-down' : 'mdi-chevron-up'" />
            </span>
          </button>

          <div v-show="!group.cerrado" class="group-body">
            <div
              v-for="item in group.items"
              :key="item.id"
              class="item-row"
            >
              <div class="item-question">
                <span>{{ item.label }}</span>
              </div>

              <div class="state-row">
                <button
                  v-for="state in getStates(item)"
                  :key="`${item.id}-${state.value}`"
                  type="button"
                  :disabled="disabled"
                  :class="['state-toggle', item.estado === state.value ? `state-toggle--${state.value}` : '']"
                  @click="setEstado(control, item, state.value)"
                >
                  {{ state.label }}
                </button>
              </div>

              <v-textarea
                :model-value="item.observacion"
                label="Observacion"
                variant="outlined"
                density="compact"
                rows="1"
                auto-grow
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setObservacion(control, item, value)"
              />
            </div>
          </div>
        </section>
      </div>
    </article>

    <div v-if="controles.length === 0" class="empty-state">
      Sin controles registrados.
    </div>

    <div class="add-row">
      <v-btn
        size="small"
        variant="tonal"
        color="success"
        prepend-icon="mdi-plus"
        :disabled="disabled"
        @click="addControl"
      >
        Agregar control
      </v-btn>
    </div>
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

const cleanStates = [
  { value: 'si', label: 'SI' },
  { value: 'no', label: 'NO' },
  { value: 'na', label: 'N/A' }
]

const evaluationStates = [
  { value: 'c', label: 'C' },
  { value: 'nc', label: 'NC' },
  { value: 'nr', label: 'NR' }
]

const groupsDefinition = [
  {
    id: 'banosHombres',
    title: 'Baños Hombres',
    items: [
      'Limpieza y desinfeccion de pisos',
      'Limpieza y desinfeccion de paredes',
      'Limpieza puertas',
      'Limpieza Espejos',
      'Limpieza lavamanos',
      'Limpieza sanitarios y urinarios'
    ]
  },
  {
    id: 'banoCamarinMujeres',
    title: 'Baño y camarin Mujeres',
    items: [
      'Limpieza y desinfeccion de pisos',
      'Limpieza y desinfeccion de paredes',
      'Limpieza puertas',
      'Limpieza Espejos',
      'Limpieza lavamanos',
      'Limpieza sanitarios y urinarios',
      'Limpieza de Duchas'
    ]
  },
  {
    id: 'camarinesHombre',
    title: 'Camarines Hombre',
    items: [
      'Limpieza y desinfeccion de pisos',
      'Limpieza y desinfeccion de paredes',
      'Limpieza puertas',
      'Limpieza de Duchas'
    ]
  },
  {
    id: 'salaHidratacion',
    title: 'Sala de Hidratacion',
    items: [
      'Limpieza y desinfeccion de pisos',
      'Limpieza y desinfeccion de paredes',
      'Limpieza de mesas, sillas y mobiliaria en general',
      'Limpieza de neveras y dispensador de agua embotellada',
      'Limpieza de area de lavado'
    ]
  },
  {
    id: 'salaReuniones',
    title: 'Sala de Reuniones',
    items: [
      'Limpieza y desinfeccion de pisos',
      'Limpieza de mobiliaria',
      'Limpieza de vidrios',
      'Limpieza general muros, puertas y polvo.'
    ]
  },
  {
    id: 'oficinaAdministrador',
    title: 'Oficina Administrador',
    items: [
      'Limpieza y desinfeccion de pisos',
      'Limpieza de mobiliaria',
      'Limpieza de vidrios',
      'Limpieza general muros, puertas y polvo.'
    ]
  },
  {
    id: 'oficinaPrevencion',
    title: 'Oficina Prevencion de Riesgos',
    items: [
      'Limpieza y desinfeccion de pisos',
      'Limpieza de mobiliaria',
      'Limpieza de vidrios',
      'Limpieza general muros, puertas y polvo.'
    ]
  },
  {
    id: 'oficinaRecursosLaborales',
    title: 'Oficina Recursos laborales',
    items: [
      'Limpieza y desinfeccion de pisos',
      'Limpieza de mobiliaria',
      'Limpieza de vidrios',
      'Limpieza general muros, puertas y polvo.'
    ]
  },
  {
    id: 'oficinaJefeOperaciones',
    title: 'Oficina Jefe de Operaciones',
    items: [
      'Limpieza y desinfeccion de pisos',
      'Limpieza de mobiliaria',
      'Limpieza de vidrios',
      'Limpieza general muros, puertas y polvo.'
    ]
  },
  {
    id: 'oficinaBodeguero',
    title: 'Oficina Bodeguero',
    items: [
      'Limpieza y desinfeccion de pisos',
      'Limpieza de mobiliaria',
      'Limpieza de vidrios',
      'Limpieza general muros, puertas y polvo.'
    ]
  },
  {
    id: 'oficinaMecanico',
    title: 'Oficina Mecanico',
    items: [
      'Limpieza y desinfeccion de pisos',
      'Limpieza de mobiliaria',
      'Limpieza de vidrios',
      'Limpieza general muros, puertas y polvo.'
    ]
  },
  {
    id: 'patioInterior',
    title: 'Patio Interior Instalacion de faena',
    items: [
      'Limpieza y desinfeccion de pasillos y areas en comun',
      'Limpieza de pisos'
    ]
  },
  {
    id: 'patioFrontis',
    title: 'Patio Frontis Instalaciones de faena',
    items: [
      'Limpieza y desinfeccion de pasillos y areas en comun',
      'Limpieza de pisos'
    ]
  },
  {
    id: 'kitLimpieza',
    title: 'Kit de limpieza y desinfeccion',
    items: [
      'Guantes',
      'Escoba, pala, balde escurridor, trapero, mopa',
      'Desinfectante de baños',
      'Hisopo limpia sanitarios',
      'Limpiador de Pisos y paredes',
      'Limpiador multiuso',
      'Toalla Nova',
      'Lustra muebles',
      'Desodorante ambiental',
      'Esponjas',
      'Bolsas de basura',
      'Señaletica de advertencia',
      'Aspiradora',
      'Carro Porta elementos de aseo'
    ]
  },
  {
    id: 'elementosSeguridad',
    title: 'Elementos de Seguridad',
    items: [
      'Uso de Buzo de Papel',
      'Uso de guantes de proteccion',
      'Uso de zapatos antideslizante',
      'Uso de elementos de Bioseguridad'
    ]
  },
  {
    id: 'evaluacion',
    title: 'Evaluacion y validacion de ejecucion del servicio',
    stateType: 'evaluation',
    items: [
      'Evaluacion y validacion de ejecucion del servicio'
    ]
  }
]

const controles = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value?.controles) ? attrRef.value.controles : []
})

onMounted(() => {
  ensureBody()
})

function uid() {
  return `aseo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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

function normalizeEstado(value, stateType = 'clean') {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'n/a') return 'na'
  const allowed = stateType === 'evaluation' ? ['c', 'nc', 'nr'] : ['si', 'no', 'na']
  return allowed.includes(normalized) ? normalized : ''
}

function getStates(item) {
  return item?.stateType === 'evaluation' ? evaluationStates : cleanStates
}

function createGroups(savedGroups = []) {
  return groupsDefinition.map((definition) => {
    const savedGroup = savedGroups.find((group) => group?.id === definition.id) || {}
    const savedItems = Array.isArray(savedGroup.items) ? savedGroup.items : []
    return {
      id: definition.id,
      title: savedGroup.title || definition.title,
      stateType: definition.stateType || 'clean',
      cerrado: savedGroup.cerrado === true,
      items: definition.items.map((label, index) => {
        const savedItem = savedItems[index] || {}
        return {
          id: savedItem.id || `${definition.id}-${index + 1}`,
          label: savedItem.label || label,
          stateType: definition.stateType || 'clean',
          estado: normalizeEstado(savedItem.estado, definition.stateType || 'clean'),
          observacion: String(savedItem.observacion ?? '')
        }
      })
    }
  })
}

function createControl() {
  return {
    id: uid(),
    cerrado: false,
    fecha: todayIso(),
    grupos: createGroups()
  }
}

function normalizeControl(saved) {
  return {
    id: saved?.id || uid(),
    cerrado: saved?.cerrado === true,
    fecha: normalizeDate(saved?.fecha) || todayIso(),
    grupos: createGroups(Array.isArray(saved?.grupos) ? saved.grupos : [])
  }
}

function ensureBody(withDefault = true) {
  if (!attrRef.value || typeof attrRef.value !== 'object') return
  if (!Array.isArray(attrRef.value.controles)) {
    attrRef.value.controles = []
  }

  attrRef.value.controles = attrRef.value.controles.map(normalizeControl)

  if (withDefault && attrRef.value.controles.length === 0) {
    attrRef.value.controles.push(createControl())
  }

  renderTick.value += 1
}

function changed() {
  renderTick.value += 1
  emit('change')
}

function findControl(control) {
  if (!control?.id || !Array.isArray(attrRef.value.controles)) return control
  return attrRef.value.controles.find((current) => current.id === control.id) || control
}

function setControlField(control, key, value) {
  if (props.disabled || !control) return
  ensureBody(false)
  findControl(control)[key] = value || ''
  changed()
}

function toggleControl(control) {
  if (!control) return
  ensureBody(false)
  const current = findControl(control)
  current.cerrado = current.cerrado !== true
  changed()
}

function addControl() {
  if (props.disabled) return
  ensureBody(false)
  attrRef.value.controles.push(createControl())
  changed()
}

function removeControl(control) {
  if (props.disabled) return
  ensureBody(false)
  const index = attrRef.value.controles.findIndex((current) => current.id === control.id)
  if (index >= 0) attrRef.value.controles.splice(index, 1)
  changed()
}

function findItem(control, item) {
  const current = findControl(control)
  for (const group of current?.grupos || []) {
    const found = (group.items || []).find((candidate) => candidate.id === item.id)
    if (found) return found
  }
  return item
}

function toggleGroup(control, group) {
  if (!control || !group) return
  ensureBody(false)
  const current = findControl(control)
  const currentGroup = (current?.grupos || []).find((candidate) => candidate.id === group.id)
  if (!currentGroup) return
  currentGroup.cerrado = currentGroup.cerrado !== true
  changed()
}

function setEstado(control, item, value) {
  if (props.disabled || !control || !item) return
  ensureBody(false)
  const currentItem = findItem(control, item)
  currentItem.estado = currentItem.estado === value ? '' : value
  changed()
}

function setObservacion(control, item, value) {
  if (props.disabled || !control || !item) return
  ensureBody(false)
  findItem(control, item).observacion = value || ''
  changed()
}

function getGroupAnsweredCount(group) {
  renderTick.value
  const items = Array.isArray(group?.items) ? group.items : []
  const answered = items.filter((item) => normalizeEstado(item?.estado, item?.stateType)).length
  return `${answered}/${items.length}`
}
</script>

<style scoped>
.checklist-aseo-dmh {
  display: grid;
  gap: 12px;
  width: 100%;
}

.control-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.55);
  border-radius: 7px;
  background: rgba(15, 23, 42, 0.26);
}

.control-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.control-head strong {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
}

.control-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.control-body {
  display: grid;
  gap: 10px;
}

.group-block {
  display: grid;
  gap: 0;
  padding: 0;
  border: 1px solid rgba(20, 184, 166, 0.45);
  border-radius: 7px;
  background: rgba(2, 6, 23, 0.12);
  overflow: hidden;
}

.group-title {
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 10px;
  border: 0;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  text-align: left;
  background: rgba(30, 41, 59, 0.72);
}

.group-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #cbd5e1;
}

.group-body {
  display: grid;
  gap: 0;
}

.answered-count {
  flex: 0 0 auto;
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 999px;
  padding: 2px 8px;
  color: #a7f3d0;
  font-size: 11px;
  font-weight: 900;
}

.item-row {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.18);
}

.item-question {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 850;
  line-height: 1.25;
}

.state-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.state-toggle--si,
.state-toggle--c {
  background: rgba(6, 95, 70, 0.52);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.state-toggle--no,
.state-toggle--nc {
  background: rgba(127, 29, 29, 0.45);
  border-color: rgba(239, 68, 68, 0.72);
  color: #fee2e2;
}

.state-toggle--na,
.state-toggle--nr {
  background: rgba(100, 116, 139, 0.72);
  border-color: rgba(203, 213, 225, 0.9);
  color: #f8fafc;
  box-shadow: inset 0 0 0 1px rgba(248, 250, 252, 0.16);
}

.delete-btn {
  background: rgba(220, 38, 38, 0.26) !important;
  border: 1px solid rgba(248, 113, 113, 0.65);
  color: #fecaca !important;
}

.delete-btn :deep(.v-icon) {
  color: #fecaca !important;
  opacity: 1;
}

.collapse-btn {
  background: rgba(30, 41, 59, 0.72) !important;
  border: 1px solid rgba(148, 163, 184, 0.45);
  color: #dbeafe !important;
}

.collapse-btn :deep(.v-icon) {
  color: #dbeafe !important;
  opacity: 1;
}

.empty-state {
  min-height: 38px;
  display: grid;
  place-items: center;
  border: 1px dashed rgba(148, 163, 184, 0.42);
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
}

.add-row {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 600px) {
  .add-row {
    justify-content: stretch;
  }

  .add-row :deep(.v-btn) {
    width: 100%;
  }
}
</style>
