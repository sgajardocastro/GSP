<template>
  <div class="checklist-suelo-dmh">
    <v-row dense>
      <v-col
        v-for="field in datosFields"
        :key="field.key"
        cols="12"
        sm="6"
      >
        <v-text-field
          :model-value="getDato(field.key)"
          :label="field.label"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="(value) => setDato(field.key, value)"
        />
      </v-col>
    </v-row>

    <div class="item-list">
      <section
        v-for="item in items"
        :key="item.id"
        class="item-card"
      >
        <div class="item-question">
          <span class="item-number">{{ item.numero }}.</span>
          <span>{{ item.label }}</span>
        </div>

        <div class="state-row">
          <button
            v-for="state in states"
            :key="`${item.id}-${state.value}`"
            type="button"
            :disabled="disabled"
            :class="['state-toggle', item.estado === state.value ? `state-toggle--${state.value}` : '']"
            @click="setEstado(item, state.value)"
          >
            {{ state.label }}
          </button>
        </div>

        <v-textarea
          :model-value="item.observaciones"
          label="Observaciones"
          variant="outlined"
          density="compact"
          rows="1"
          auto-grow
          hide-details
          :disabled="disabled"
          @update:model-value="(value) => setObservacionesItem(item, value)"
        />
      </section>
    </div>

    <v-card class="result-card" elevation="0">
      <v-card-title class="result-title">
        Resultado final
      </v-card-title>

      <v-card-text class="result-body">
        <div class="result-options">
          <button
            v-for="option in resultOptions"
            :key="option.value"
            type="button"
            :disabled="disabled"
            :class="['result-toggle', resultadoFinal.resultado === option.value ? 'result-toggle--active' : '']"
            @click="setResultado(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <v-textarea
          :model-value="resultadoFinal.observaciones"
          label="Observaciones"
          variant="outlined"
          density="compact"
          rows="2"
          auto-grow
          hide-details
          :disabled="disabled"
          @update:model-value="setObservacionesFinal"
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

const datosFields = [
  { key: 'tarea', label: 'Tarea' },
  { key: 'modeloGrua', label: 'Modelo grua' },
  { key: 'sectorUbicacion', label: 'Sector / ubicacion' },
  { key: 'operadorGrua', label: 'Operador de grua' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'rigger', label: 'Rigger' }
]

const states = [
  { value: 'segura', label: 'Condicion segura' },
  { value: 'riesgosa', label: 'Condicion riesgosa' },
  { value: 'na', label: 'No aplica' }
]

const baseItems = [
  'Nivelacion del suelo',
  'Suelo cementado y/o asfaltado',
  'Terreno firme, homogeneo y sin hundimientos visibles.',
  'Terreno seco, sin agua superficial, barro o saturacion.',
  'Sin grietas, cavidades, pozos o zonas erosionadas.',
  'El pie no se hunde mas de 2 cm al caminar.',
  'El suelo no se desplaza facilmente (no arena suelta).',
  'Pendiente dentro de tolerancia del fabricante (+3°).',
  'No existen bordes, taludes o rellenos blandos sin verificar.',
  'Capacidad portante del terreno compatible con las cargas de estabilizadores',
  'Compactacion verificada mediante herramientas manuales (pala/barreta) solo cuando las condiciones sean criticas.',
  'Revision de informacion previa del area (layout, tuberias, camaras, rellenos).',
  'Autorizacion para posicionar equipos de alto tonelaje en el sector.',
  'Almohadillas en buen estado.',
  'Prueba progresiva de estabilizadores sin asentamientos.',
  'Sin señales de inestabilidad: fisuras, desplazamientos o agua emergente.'
]

const resultOptions = [
  { value: 'apto', label: 'APTO para operacion' },
  { value: 'aptoControl', label: 'APTO con medidas de control' },
  { value: 'noApto', label: 'NO APTO para operacion' }
]

const items = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value?.items) ? attrRef.value.items : []
})

const resultadoFinal = computed(() => {
  renderTick.value
  ensureResultado()
  return attrRef.value.resultadoFinal
})

onMounted(() => {
  ensureBody()
})

function normalizeEstado(value) {
  const state = String(value ?? '').trim().toLowerCase()
  return ['segura', 'riesgosa', 'na', 'n/a'].includes(state) ? (state === 'n/a' ? 'na' : state) : ''
}

function normalizeResultado(value) {
  const result = String(value ?? '').trim()
  return resultOptions.some((option) => option.value === result) ? result : ''
}

function ensureDatos() {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') {
    attrRef.value.datos = {}
  }

  datosFields.forEach((field) => {
    attrRef.value.datos[field.key] = String(attrRef.value.datos[field.key] ?? '')
  })
}

function ensureResultado() {
  if (!attrRef.value.resultadoFinal || typeof attrRef.value.resultadoFinal !== 'object') {
    attrRef.value.resultadoFinal = {}
  }
  attrRef.value.resultadoFinal = {
    resultado: normalizeResultado(attrRef.value.resultadoFinal.resultado),
    observaciones: String(attrRef.value.resultadoFinal.observaciones ?? '')
  }
}

function ensureBody() {
  if (!attrRef.value || typeof attrRef.value !== 'object') return
  ensureDatos()

  const savedItems = Array.isArray(attrRef.value.items) ? attrRef.value.items : []
  attrRef.value.items = baseItems.map((label, index) => {
    const numero = index + 1
    const saved = savedItems.find((item) => Number(item?.numero) === numero) || savedItems[index] || {}
    return {
      id: saved.id || `suelo-dmh-${numero}`,
      numero,
      label: saved.label || label,
      estado: normalizeEstado(saved.estado),
      observaciones: String(saved.observaciones ?? '')
    }
  })

  ensureResultado()
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

function setEstado(item, value) {
  if (props.disabled || !item) return
  item.estado = item.estado === value ? '' : value
  changed()
}

function setObservacionesItem(item, value) {
  if (props.disabled || !item) return
  item.observaciones = value || ''
  changed()
}

function setResultado(value) {
  if (props.disabled) return
  ensureResultado()
  attrRef.value.resultadoFinal.resultado = attrRef.value.resultadoFinal.resultado === value ? '' : value
  changed()
}

function setObservacionesFinal(value) {
  if (props.disabled) return
  ensureResultado()
  attrRef.value.resultadoFinal.observaciones = value || ''
  changed()
}
</script>

<style scoped>
.checklist-suelo-dmh {
  display: grid;
  gap: 12px;
  width: 100%;
}

.item-list {
  display: grid;
  gap: 8px;
}

.item-card {
  display: grid;
  gap: 8px;
  padding: 9px;
  border: 1px solid rgba(20, 184, 166, 0.46);
  border-radius: 7px;
  background: rgba(2, 6, 23, 0.18);
}

.item-question {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 850;
  line-height: 1.25;
}

.item-number {
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.55);
  color: #fde68a;
  font-size: 12px;
  font-weight: 900;
}

.state-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.state-toggle,
.result-toggle {
  min-height: 34px;
  padding: 0 8px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  background: rgba(71, 85, 105, 0.32);
  color: #dbeafe;
  font-size: 10px;
  font-weight: 900;
  line-height: 1.1;
}

.state-toggle--segura {
  background: rgba(6, 95, 70, 0.52);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.state-toggle--riesgosa {
  background: rgba(127, 29, 29, 0.45);
  border-color: rgba(239, 68, 68, 0.72);
  color: #fee2e2;
}

.state-toggle--na {
  background: rgba(100, 116, 139, 0.72);
  border-color: rgba(203, 213, 225, 0.9);
  color: #f8fafc;
  box-shadow: inset 0 0 0 1px rgba(248, 250, 252, 0.16);
}

.result-card {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.72);
}

.result-title {
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

.result-body {
  display: grid;
  gap: 12px;
  padding: 12px;
}

.result-options {
  display: grid;
  gap: 8px;
}

.result-toggle {
  min-height: 36px;
  text-align: left;
  padding: 0 12px;
}

.result-toggle--active {
  background: rgba(6, 95, 70, 0.52);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

@media (max-width: 600px) {
  .state-row {
    grid-template-columns: 1fr;
  }
}
</style>
