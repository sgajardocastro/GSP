<template>
  <div class="segregacion-checklist">
    <article
      v-for="(actividad, index) in actividades"
      :key="actividad.id"
      class="activity-card"
    >
      <div class="activity-head">
        <strong>Actividad {{ index + 1 }}</strong>
        <div class="activity-actions">
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="tonal"
            color="error"
            class="delete-btn"
            :disabled="disabled"
            @click="removeActividad(actividad)"
          />
          <v-btn
            :icon="actividad.cerrada ? 'mdi-chevron-down' : 'mdi-chevron-up'"
            size="small"
            variant="tonal"
            class="collapse-btn"
            @click="toggleActividad(actividad)"
          />
        </div>
      </div>

      <div v-show="!actividad.cerrada" class="activity-body">
        <v-row dense>
          <v-col cols="12" sm="8">
            <v-text-field
              :model-value="actividad.nombreActividad"
              label="Nombre de la actividad inspeccionada"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setActividadField(actividad, 'nombreActividad', value)"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              :model-value="actividad.fecha"
              type="date"
              label="Fecha"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setActividadField(actividad, 'fecha', normalizeDate(value))"
            />
          </v-col>
        </v-row>

        <div class="question-list">
          <section
            v-for="question in questions"
            :key="question.code"
            class="question-card"
          >
            <div class="question-title">
              <span class="question-code">{{ question.code }}</span>
              <span>{{ question.label }}</span>
            </div>

            <div v-if="question.kind !== 'observacion'" class="state-buttons">
              <button
                v-for="state in states"
                :key="`${actividad.id}-${question.code}-${state.value}`"
                type="button"
                :disabled="disabled"
                :class="['state-toggle', getRespuesta(actividad, question.code) === state.value ? `state-toggle--${state.value}` : '']"
                @click="setRespuesta(actividad, question.code, state.value)"
              >
                {{ state.label }}
              </button>
            </div>

            <v-textarea
              v-else
              :model-value="actividad.observacion"
              label="Observacion y/o acciones correctivas"
              variant="outlined"
              density="compact"
              rows="2"
              auto-grow
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setActividadField(actividad, 'observacion', value)"
            />
          </section>
        </div>
      </div>
    </article>

    <div v-if="actividades.length === 0" class="empty-state">
      Sin actividades registradas.
    </div>

    <div class="add-row">
      <v-btn
        size="small"
        variant="tonal"
        color="success"
        prepend-icon="mdi-plus"
        :disabled="disabled"
        @click="addActividad"
      >
        Agregar actividad
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

const states = [
  { value: 'si', label: 'SI' },
  { value: 'no', label: 'NO' }
]

const questions = [
  {
    code: '1',
    label: 'La segregacion perimetral es la correcta y restringe el acceso de terceros por todos los puntos de acceso a dicha area?'
  },
  {
    code: '2',
    label: 'El texto o leyenda del letrero de segregacion es claro, preciso, conciso y sin ambiguedades?'
  },
  {
    code: '3',
    label: 'Los letreros de segregacion identifican los antecedentes del supervisor a cargo de la actividad, frecuencia radial, N° telefonico celular.'
  },
  {
    code: '4',
    label: 'Los conos de segregacion cumplen el estandar minimo, con altura igual o mayor a 70 cm, con cinta reflectante de color blanco?'
  },
  {
    code: '5',
    label: 'La cantidad de conos o barreras es la adecuada y logra cubrir el area de operacion; estos deben ser unidos con cadenas o bastones.'
  },
  {
    code: '6',
    label: 'Los letreros advierten el peligro y riesgo de la actividad?'
  },
  {
    code: '7',
    label: 'La ubicacion de la segregacion es visible, legible y asegurada contra la accion de terceros?'
  },
  {
    code: '8',
    label: 'Los elementos de segregacion se encuentran en buenas condiciones?'
  },
  {
    code: '9',
    label: 'Considera que la segregacion cumple con los estandares establecidos en el procedimiento de segregacion?'
  },
  {
    code: '10',
    kind: 'observacion',
    label: 'Observacion y/o acciones correctivas'
  }
]

const actividades = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value.actividades) ? attrRef.value.actividades : []
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

function uid() {
  return `segregacion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createActividad() {
  return {
    id: uid(),
    cerrada: false,
    nombreActividad: '',
    fecha: todayIso(),
    respuestas: {},
    observacion: ''
  }
}

function normalizeRespuesta(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return ['si', 'no'].includes(normalized) ? normalized : ''
}

function normalizeActividad(saved) {
  const respuestas = {}
  questions
    .filter((question) => question.kind !== 'observacion')
    .forEach((question) => {
      respuestas[question.code] = normalizeRespuesta(saved?.respuestas?.[question.code])
    })

  return {
    ...createActividad(),
    ...saved,
    id: saved?.id || uid(),
    cerrada: saved?.cerrada === true,
    nombreActividad: String(saved?.nombreActividad ?? ''),
    fecha: normalizeDate(saved?.fecha) || todayIso(),
    respuestas,
    observacion: String(saved?.observacion ?? '')
  }
}

function ensureBody(withDefault = true) {
  if (!Array.isArray(attrRef.value.actividades)) {
    attrRef.value.actividades = []
  }

  attrRef.value.actividades = attrRef.value.actividades.map(normalizeActividad)

  if (withDefault && attrRef.value.actividades.length === 0) {
    attrRef.value.actividades.push(createActividad())
  }
}

function changed() {
  renderTick.value += 1
  emit('change')
}

function findActividad(actividad) {
  if (!actividad?.id || !Array.isArray(attrRef.value.actividades)) return actividad
  return attrRef.value.actividades.find((current) => current.id === actividad.id) || actividad
}

function setActividadField(actividad, key, value) {
  if (props.disabled || !actividad) return
  ensureBody(false)
  const current = findActividad(actividad)
  current[key] = value || ''
  changed()
}

function getRespuesta(actividad, code) {
  renderTick.value
  return normalizeRespuesta(actividad?.respuestas?.[code])
}

function setRespuesta(actividad, code, value) {
  if (props.disabled || !actividad) return
  ensureBody(false)
  const current = findActividad(actividad)
  if (!current.respuestas || typeof current.respuestas !== 'object') {
    current.respuestas = {}
  }
  current.respuestas[code] = current.respuestas[code] === value ? '' : value
  changed()
}

function toggleActividad(actividad) {
  if (!actividad) return
  ensureBody(false)
  const current = findActividad(actividad)
  current.cerrada = current.cerrada !== true
  changed()
}

function addActividad() {
  if (props.disabled) return
  ensureBody(false)
  attrRef.value.actividades.push(createActividad())
  changed()
}

function removeActividad(actividad) {
  if (props.disabled) return
  ensureBody(false)
  const index = attrRef.value.actividades.findIndex((current) => current.id === actividad.id)
  if (index >= 0) attrRef.value.actividades.splice(index, 1)
  changed()
}
</script>

<style scoped>
.segregacion-checklist {
  display: grid;
  gap: 10px;
  width: 100%;
}

.activity-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.55);
  border-radius: 7px;
  background: rgba(15, 23, 42, 0.26);
}

.activity-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.activity-head strong {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
}

.activity-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.activity-body {
  display: grid;
  gap: 10px;
}

.question-list {
  display: grid;
  gap: 8px;
}

.question-card {
  display: grid;
  gap: 8px;
  padding: 9px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 7px;
  background: rgba(2, 6, 23, 0.18);
}

.question-title {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 850;
  line-height: 1.25;
}

.question-code {
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

.state-buttons {
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
