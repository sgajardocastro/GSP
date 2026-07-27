<template>
  <div class="checklist-suelo">
    <v-expansion-panels v-model="openSections" multiple class="soil-panels">
      <v-expansion-panel value="datos" class="soil-card">
        <v-expansion-panel-title class="soil-title">
          DATOS VERIFICACION DEL SUELO
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDato('fecha')"
                type="date"
                label="FECHA"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('fecha', normalizeDate(value))"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDato('faenaDivision')"
                label="FAENA / DIVISION"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('faenaDivision', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDato('sectorUbicacion')"
                label="SECTOR / UBICACION EXACTA"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('sectorUbicacion', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDato('modeloGrua')"
                label="MODELO DE GRUA"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('modeloGrua', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDato('supervisorTransmac')"
                label="SUPERVISOR TRANSMAC"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('supervisorTransmac', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDato('operadorGrua')"
                label="OPERADOR DE GRUA"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('operadorGrua', value)"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                :model-value="getDato('riggerSenalero')"
                label="RIGGER / SENALERO"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('riggerSenalero', value)"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="items" class="soil-card">
        <v-expansion-panel-title class="soil-title">
          CHECK LIST DE VERIFICACION DEL SUELO
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div
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
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="resultado" class="soil-card">
        <v-expansion-panel-title class="soil-title">
          RESULTADO FINAL
        </v-expansion-panel-title>

        <v-expansion-panel-text>
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
const openSections = ref(['datos', 'items', 'resultado'])

const states = [
  { value: 'si', label: 'SI' },
  { value: 'no', label: 'NO' },
  { value: 'na', label: 'N/A' }
]

const baseItems = [
  { numero: 1, label: 'Terreno plano y nivelado' },
  { numero: 2, label: 'Pendiente dentro de limites del fabricante' },
  { numero: 3, label: 'Terreno compactado y estable' },
  { numero: 4, label: 'Sin grietas, hundimientos o socavaciones' },
  { numero: 5, label: 'Capacidad del suelo adecuada a presion de estabilizadores' },
  { numero: 6, label: 'Sin interferencias subterraneas' },
  { numero: 7, label: 'Suelo seco, sin barro o humedad excesiva' },
  { numero: 8, label: 'Area delimitada y senalizada' },
  { numero: 9, label: 'Area delimitada y senalizada' }
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

function ensureBody() {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') {
    attrRef.value.datos = {}
  }
  attrRef.value.datos = {
    "fecha": normalizeDate(attrRef.value.datos.fecha) || todayIso(),
    "faenaDivision": String(attrRef.value.datos.faenaDivision ?? ''),
    "sectorUbicacion": String(attrRef.value.datos.sectorUbicacion ?? ''),
    "modeloGrua": String(attrRef.value.datos.modeloGrua ?? ''),
    "supervisorTransmac": String(attrRef.value.datos.supervisorTransmac ?? ''),
    "operadorGrua": String(attrRef.value.datos.operadorGrua ?? ''),
    "riggerSenalero": String(attrRef.value.datos.riggerSenalero ?? '')
  }

  const savedItems = Array.isArray(attrRef.value.items) ? attrRef.value.items : []
  attrRef.value.items = baseItems.map((base, index) => {
    const saved = savedItems.find((item) => Number(item?.numero) === base.numero) || savedItems[index] || {}
    return {
      "id": saved.id || `suelo-${base.numero}`,
      "numero": base.numero,
      "label": saved.label || base.label,
      "estado": normalizeEstado(saved.estado),
      "observaciones": String(saved.observaciones ?? '')
    }
  })

  ensureResultado()
  renderTick.value += 1
}

function ensureResultado() {
  if (!attrRef.value.resultadoFinal || typeof attrRef.value.resultadoFinal !== 'object') {
    attrRef.value.resultadoFinal = {}
  }
  attrRef.value.resultadoFinal = {
    "resultado": normalizeResultado(attrRef.value.resultadoFinal.resultado),
    "observaciones": String(attrRef.value.resultadoFinal.observaciones ?? '')
  }
}

function normalizeEstado(value) {
  const state = String(value ?? '').trim().toLowerCase()
  return ['si', 'no', 'na', 'n/a'].includes(state) ? (state === 'n/a' ? 'na' : state) : 'na'
}

function normalizeResultado(value) {
  const result = String(value ?? '').trim()
  return resultOptions.some((option) => option.value === result) ? result : ''
}

function getDato(key) {
  renderTick.value
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') attrRef.value.datos = {}
  return attrRef.value.datos[key] || ''
}

function setDato(key, value) {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') attrRef.value.datos = {}
  attrRef.value.datos[key] = value || ''
  renderTick.value += 1
  emit('change')
}

function setEstado(item, value) {
  if (props.disabled || !item) return
  item.estado = value
  renderTick.value += 1
  emit('change')
}

function setObservacionesItem(item, value) {
  if (!item) return
  item.observaciones = value || ''
  renderTick.value += 1
  emit('change')
}

function setResultado(value) {
  if (props.disabled) return
  ensureResultado()
  attrRef.value.resultadoFinal.resultado = attrRef.value.resultadoFinal.resultado === value ? '' : value
  renderTick.value += 1
  emit('change')
}

function setObservacionesFinal(value) {
  ensureResultado()
  attrRef.value.resultadoFinal.observaciones = value || ''
  renderTick.value += 1
  emit('change')
}
</script>

<style scoped>
.checklist-suelo {
  width: 100%;
}

.soil-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  width: 100%;
}

.soil-panels :deep(.v-expansion-panel),
.soil-panels :deep(.v-expansion-panel-title),
.soil-panels :deep(.v-expansion-panel-text) {
  width: 100%;
  max-width: none;
}

.soil-card {
  width: 100%;
  max-width: none !important;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  overflow: hidden;
}

.soil-title {
  min-height: 46px;
  padding: 10px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  white-space: normal;
}

.item-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.2);
}

.item-card + .item-card {
  margin-top: 10px;
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

.state-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.state-toggle,
.result-toggle {
  min-height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  background: rgba(71, 85, 105, 0.36);
  color: #dbeafe;
  font-size: 11px;
  font-weight: 900;
}

.state-toggle--si {
  background: rgba(6, 95, 70, 0.5);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.state-toggle--no {
  background: rgba(127, 29, 29, 0.42);
  border-color: rgba(239, 68, 68, 0.65);
  color: #fee2e2;
}

.state-toggle--na {
  background: rgba(113, 63, 18, 0.5);
  border-color: rgba(245, 158, 11, 0.72);
  color: #fef3c7;
}

.result-options {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.result-toggle {
  min-height: 36px;
  text-align: left;
  padding: 0 12px;
}

.result-toggle--active {
  background: rgba(6, 95, 70, 0.5);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}
</style>
