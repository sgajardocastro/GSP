<template>
  <div class="checklist-epr">
    <v-row dense class="header-fields">
      <v-col cols="12" sm="4">
        <v-text-field
          :model-value="getDato('nombreTrabajador')"
          label="Nombre trabajador"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="(value) => setDato('nombreTrabajador', value)"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field
          :model-value="getDato('rut')"
          label="Rut"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="(value) => setDato('rut', value)"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field
          :model-value="getDato('cargo')"
          label="Cargo"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="(value) => setDato('cargo', value)"
        />
      </v-col>
    </v-row>

    <article
      v-for="(inspeccion, index) in inspecciones"
      :key="inspeccion.id"
      class="inspection-card"
    >
      <div class="inspection-head">
        <strong>Inspeccion {{ index + 1 }}</strong>
        <div class="inspection-actions">
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="tonal"
            color="error"
            class="delete-btn"
            :disabled="disabled"
            @click="removeInspeccion(inspeccion)"
          />
          <v-btn
            :icon="inspeccion.cerrada ? 'mdi-chevron-down' : 'mdi-chevron-up'"
            size="small"
            variant="tonal"
            class="collapse-btn"
            @click="toggleInspeccion(inspeccion)"
          />
        </div>
      </div>

      <div v-show="!inspeccion.cerrada" class="inspection-body">
        <v-text-field
          :model-value="inspeccion.fecha"
          type="date"
          label="Fecha"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="(value) => setInspeccionField(inspeccion, 'fecha', normalizeDate(value))"
        />

        <section
          v-for="group in inspeccion.grupos"
          :key="`${inspeccion.id}-${group.id}`"
          class="group-card"
        >
          <div class="group-title">
            <span>{{ group.title }}</span>
            <span class="answered-count">{{ getGroupAnsweredCount(group) }}</span>
          </div>

          <div
            v-for="item in group.items"
            :key="item.id"
            class="item-card"
          >
            <div class="item-question">
              <span class="item-number">{{ item.numero }}.</span>
              <span>{{ item.label }}</span>
            </div>

            <div class="state-buttons">
              <button
                v-for="state in states"
                :key="`${item.id}-${state.value}`"
                type="button"
                :disabled="disabled"
                :class="['state-toggle', item.respuesta === state.value ? `state-toggle--${state.value}` : '']"
                @click="setRespuesta(inspeccion, item, state.value)"
              >
                {{ state.label }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </article>

    <div v-if="inspecciones.length === 0" class="empty-state">
      Sin inspecciones registradas.
    </div>

    <div class="add-row">
      <v-btn
        size="small"
        variant="tonal"
        color="success"
        prepend-icon="mdi-plus"
        :disabled="disabled"
        @click="addInspeccion"
      >
        Agregar inspeccion
      </v-btn>
    </div>

    <v-card
      v-for="block in infoBlocks"
      :key="block.id"
      class="info-card"
      elevation="0"
    >
      <v-card-title class="info-title">
        {{ block.title }}
      </v-card-title>

      <v-card-text class="info-body">
        <div class="steps-list">
          <div
            v-for="step in block.steps"
            :key="`${block.id}-${step.numero}`"
            class="step-row"
          >
            <span class="step-number">{{ step.numero }}</span>
            <span>{{ step.text }}</span>
          </div>
        </div>

        <div class="image-grid">
          <img
            v-for="image in block.images"
            :key="image.src"
            :src="image.src"
            :alt="image.alt"
            class="info-image"
          />
        </div>
      </v-card-text>
    </v-card>

    <v-card class="info-card" elevation="0">
      <v-card-title class="info-title">
        Observaciones
      </v-card-title>
      <v-card-text class="info-body">
        <v-textarea
          :model-value="attrRef.observaciones"
          label="Observaciones"
          variant="outlined"
          density="compact"
          rows="2"
          auto-grow
          hide-details
          :disabled="disabled"
          @update:model-value="setObservaciones"
        />
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
const assetBase = `${process.env.BASE_URL || '/'}checklist-assets/epr/`

const states = [
  { value: 'si', label: 'SI' },
  { value: 'no', label: 'NO' },
  { value: 'na', label: 'N/A' }
]

const groupsDefinition = [
  {
    id: 'piezaFacial',
    title: 'Pieza Facial',
    items: [
      'Suciedad en la pieza facial',
      'Grietas, desgarros, perforaciones, deformacion.',
      'Inflexibilidad de la pieza facial.',
      'Quiebre en el conector de los filtros',
      'Para rostro completo: visor excesivamente rayado.'
    ]
  },
  {
    id: 'arnesElasticos',
    title: 'Arnes y elasticos de sujecion',
    items: [
      'Quebrados.',
      'Grietas, desgarros, perforaciones, deformacion.',
      'Correas pierden elasticidad',
      'Correas originales'
    ]
  },
  {
    id: 'valvula',
    title: 'Valvula de exhalacion e inhalacion',
    items: [
      'Obstruidas, atascadas.',
      'Presencia de material externo como: particulado, cabellos, residuos de detergente.',
      'Quiebre o perforacion de material de las valvulas.',
      'Inapropiada insercion al cuerpo de la valvula.',
      'Ragadura o quiebre del cuerpo de la valvula.',
      'Perdida o desperfecto del cubre valvula'
    ]
  },
  {
    id: 'filtros',
    title: 'Filtros',
    items: [
      'El filtro es el adecuado para el area de trabajo 3M 60923, 3M 7093, Honeywell 7583 P100',
      'Conexiones sueltas o dañadas',
      'Fecha de expiracion no vencidas.',
      'Filtros adecuados a la mascara.'
    ]
  }
]

const infoBlocks = [
  {
    id: 'negativa',
    title: 'Pasos para el chequeo de Presion Negativa',
    steps: [
      { numero: 1, text: 'Tapar los filtros sin deformar la mascara.' },
      { numero: 2, text: 'Al inhalar la mascara debe doblarse un poco hacia adentro.' },
      { numero: 3, text: 'Contener la respiracion por 10 segundos y escuchar para verificar si hay escape de aire.' }
    ],
    images: [
      { src: `${assetBase}presion-negativa-1.png`, alt: 'Chequeo de presion negativa uno' },
      { src: `${assetBase}presion-negativa-2.png`, alt: 'Chequeo de presion negativa dos' }
    ]
  },
  {
    id: 'positiva',
    title: 'Pasos para el chequeo de Presion Positiva',
    steps: [
      { numero: 1, text: 'Tapar la valvula de exhalacion sin deformar la mascara.' },
      { numero: 2, text: 'Al exhalar la mascara debe ensancharse un poco hacia afuera.' },
      { numero: 3, text: 'Contener la respiracion por 10 segundos y escuchar para verificar si hay escape de aire.' }
    ],
    images: [
      { src: `${assetBase}presion-positiva-1.png`, alt: 'Chequeo de presion positiva uno' },
      { src: `${assetBase}presion-positiva-2.png`, alt: 'Chequeo de presion positiva dos' }
    ]
  }
]

const inspecciones = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value?.inspecciones) ? attrRef.value.inspecciones : []
})

onMounted(() => {
  ensureBody()
})

function uid() {
  return `epr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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

function normalizeRespuesta(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'n/a') return 'na'
  return ['si', 'no', 'na'].includes(normalized) ? normalized : ''
}

function createGroups(savedGroups = []) {
  return groupsDefinition.map((definition) => {
    const savedGroup = savedGroups.find((group) => group?.id === definition.id) || {}
    const savedItems = Array.isArray(savedGroup.items) ? savedGroup.items : []
    return {
      id: definition.id,
      title: savedGroup.title || definition.title,
      items: definition.items.map((label, index) => {
        const savedItem = savedItems[index] || {}
        return {
          id: savedItem.id || `${definition.id}-${index + 1}`,
          numero: savedItem.numero || index + 1,
          label: savedItem.label || label,
          respuesta: normalizeRespuesta(savedItem.respuesta)
        }
      })
    }
  })
}

function createInspeccion() {
  return {
    id: uid(),
    cerrada: false,
    fecha: todayIso(),
    grupos: createGroups()
  }
}

function normalizeInspeccion(saved) {
  return {
    id: saved?.id || uid(),
    cerrada: saved?.cerrada === true,
    fecha: normalizeDate(saved?.fecha) || todayIso(),
    grupos: createGroups(Array.isArray(saved?.grupos) ? saved.grupos : [])
  }
}

function migrateFromOldDays() {
  const oldGroups = Array.isArray(attrRef.value.grupos) ? attrRef.value.grupos : []
  const oldDates = attrRef.value.fechas && typeof attrRef.value.fechas === 'object' ? attrRef.value.fechas : {}
  const dayKeys = Object.keys(oldDates)

  if (!oldGroups.length || !dayKeys.length) return []

  return dayKeys.map((dayKey) => ({
    id: uid(),
    cerrada: false,
    fecha: normalizeDate(oldDates[dayKey]) || todayIso(),
    grupos: groupsDefinition.map((definition) => {
      const oldGroup = oldGroups.find((group) => group?.id === definition.id) || {}
      const oldItems = Array.isArray(oldGroup.items) ? oldGroup.items : []
      return {
        id: definition.id,
        title: definition.title,
        items: definition.items.map((label, index) => {
          const oldItem = oldItems[index] || {}
          return {
            id: `${definition.id}-${index + 1}`,
            numero: index + 1,
            label,
            respuesta: normalizeRespuesta(oldItem?.days?.[dayKey])
          }
        })
      }
    })
  }))
}

function ensureDatos() {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') {
    attrRef.value.datos = {}
  }
  const keys = ['nombreTrabajador', 'rut', 'cargo']
  keys.forEach((key) => {
    attrRef.value.datos[key] = String(attrRef.value.datos[key] ?? '')
  })
}

function ensureBody(withDefault = true) {
  if (!attrRef.value || typeof attrRef.value !== 'object') return
  ensureDatos()

  if (!Array.isArray(attrRef.value.inspecciones)) {
    const migrated = migrateFromOldDays()
    attrRef.value.inspecciones = migrated.length ? migrated : []
  }

  attrRef.value.inspecciones = attrRef.value.inspecciones.map(normalizeInspeccion)

  if (withDefault && attrRef.value.inspecciones.length === 0) {
    attrRef.value.inspecciones.push(createInspeccion())
  }

  attrRef.value.observaciones = String(attrRef.value.observaciones ?? '')
  renderTick.value += 1
}

function changed() {
  renderTick.value += 1
  emit('change')
}

function getDato(key) {
  renderTick.value
  return attrRef.value?.datos?.[key] || ''
}

function setDato(key, value) {
  if (props.disabled) return
  ensureDatos()
  attrRef.value.datos[key] = value || ''
  changed()
}

function findInspeccion(inspeccion) {
  if (!inspeccion?.id || !Array.isArray(attrRef.value.inspecciones)) return inspeccion
  return attrRef.value.inspecciones.find((current) => current.id === inspeccion.id) || inspeccion
}

function setInspeccionField(inspeccion, key, value) {
  if (props.disabled || !inspeccion) return
  ensureBody(false)
  findInspeccion(inspeccion)[key] = value || ''
  changed()
}

function toggleInspeccion(inspeccion) {
  if (!inspeccion) return
  ensureBody(false)
  const current = findInspeccion(inspeccion)
  current.cerrada = current.cerrada !== true
  changed()
}

function addInspeccion() {
  if (props.disabled) return
  ensureBody(false)
  attrRef.value.inspecciones.push(createInspeccion())
  changed()
}

function removeInspeccion(inspeccion) {
  if (props.disabled) return
  ensureBody(false)
  const index = attrRef.value.inspecciones.findIndex((current) => current.id === inspeccion.id)
  if (index >= 0) attrRef.value.inspecciones.splice(index, 1)
  changed()
}

function setRespuesta(inspeccion, item, value) {
  if (props.disabled || !inspeccion || !item) return
  ensureBody(false)
  const current = findInspeccion(inspeccion)
  for (const group of current.grupos || []) {
    const currentItem = (group.items || []).find((candidate) => candidate.id === item.id)
    if (!currentItem) continue
    currentItem.respuesta = currentItem.respuesta === value ? '' : value
    changed()
    return
  }
}

function getGroupAnsweredCount(group) {
  renderTick.value
  const items = Array.isArray(group?.items) ? group.items : []
  const answered = items.filter((item) => normalizeRespuesta(item?.respuesta)).length
  return `${answered}/${items.length}`
}

function setObservaciones(value) {
  if (props.disabled) return
  attrRef.value.observaciones = value || ''
  changed()
}
</script>

<style scoped>
.checklist-epr {
  display: grid;
  gap: 12px;
  width: 100%;
}

.inspection-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.55);
  border-radius: 7px;
  background: rgba(15, 23, 42, 0.26);
}

.inspection-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.inspection-head strong {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
}

.inspection-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.inspection-body {
  display: grid;
  gap: 10px;
}

.group-card {
  display: grid;
  gap: 8px;
  padding: 9px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 7px;
  background: rgba(2, 6, 23, 0.18);
}

.group-title {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
  border-radius: 7px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  background: rgba(30, 41, 59, 0.72);
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

.item-card {
  display: grid;
  gap: 8px;
  padding: 9px;
  border: 1px solid rgba(20, 184, 166, 0.34);
  border-radius: 7px;
  background: rgba(15, 23, 42, 0.32);
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

.state-buttons {
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

.state-toggle--si {
  background: rgba(6, 95, 70, 0.52);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.state-toggle--no {
  background: rgba(127, 29, 29, 0.45);
  border-color: rgba(239, 68, 68, 0.72);
  color: #fee2e2;
}

.state-toggle--na {
  background: rgba(30, 41, 59, 0.82);
  border-color: rgba(148, 163, 184, 0.62);
  color: #f8fafc;
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

.info-card {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.72);
}

.info-title {
  min-height: 42px;
  padding: 11px 12px;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.2;
  white-space: normal;
  background: rgba(30, 41, 59, 0.86);
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
}

.info-body {
  display: grid;
  gap: 12px;
  padding: 12px;
}

.steps-list {
  display: grid;
  gap: 6px;
}

.step-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 7px;
  color: #e5eefb;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
  background: rgba(2, 6, 23, 0.2);
}

.step-number {
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.62);
  color: #fde68a;
  font-size: 12px;
  font-weight: 900;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 150px));
  gap: 10px;
  justify-content: center;
}

.info-image {
  width: 100%;
  max-width: 150px;
  aspect-ratio: 1;
  object-fit: contain;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  background: #fff;
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
