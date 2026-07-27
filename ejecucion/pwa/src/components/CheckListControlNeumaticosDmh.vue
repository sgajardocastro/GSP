<template>
  <div class="checklist-neumaticos-dmh">
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
        <v-row dense>
          <v-col
            v-for="field in headerFields"
            :key="field.key"
            cols="12"
            sm="6"
          >
            <v-text-field
              :model-value="control[field.key]"
              :type="field.type || 'text'"
              :label="field.label"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setControlField(control, field.key, field.type === 'date' ? normalizeDate(value) : value)"
            />
          </v-col>
        </v-row>

        <section
          v-for="equipo in control.equipos"
          :key="equipo.id"
          class="equipment-block"
        >
          <div class="equipment-head">
            <strong>{{ equipo.tipo }}</strong>
            <div class="equipment-actions">
              <span class="answered-count">{{ getEquipmentAnsweredCount(equipo) }}/{{ equipo.neumaticos.length }}</span>
              <v-btn
                :icon="equipo.cerrado ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                size="x-small"
                variant="tonal"
                class="collapse-btn"
                @click="toggleEquipo(control, equipo)"
              />
            </div>
          </div>

          <div v-show="!equipo.cerrado" class="equipment-body">
            <v-text-field
              :model-value="equipo.descripcion"
              :label="equipo.tipo"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setEquipoField(control, equipo, 'descripcion', value)"
            />

            <div
              v-for="row in equipo.neumaticos"
              :key="row.id"
              class="tire-row"
            >
              <div class="tire-title">
                Posicion {{ row.posicion }}
              </div>

              <v-row dense>
                <v-col
                  v-for="field in tireFields"
                  :key="`${row.id}-${field.key}`"
                  cols="12"
                  sm="6"
                >
                  <v-textarea
                    v-if="field.key === 'observaciones'"
                    :model-value="row[field.key]"
                    :label="field.label"
                    variant="outlined"
                    density="compact"
                    rows="1"
                    auto-grow
                    hide-details
                    :disabled="disabled"
                    @update:model-value="(value) => setTireField(control, equipo, row, field.key, value)"
                  />
                  <v-text-field
                    v-else
                    :model-value="row[field.key]"
                    :label="field.label"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :disabled="disabled"
                    @update:model-value="(value) => setTireField(control, equipo, row, field.key, value)"
                  />
                </v-col>
              </v-row>
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

const headerFields = [
  { key: 'ejecutante', label: 'Ejecutante' },
  { key: 'profundidadNeumatico', label: 'Profundidad neumatico (mm)' },
  { key: 'fecha', label: 'Fecha', type: 'date' }
]

const tireFields = [
  { key: 'marcaNeumatico', label: 'Marca neumatico' },
  { key: 'modeloNeumatico', label: 'Modelo neumatico' },
  { key: 'medida', label: 'Medida' },
  { key: 'numeroArcajeFuegoSerie', label: 'N° arcaje fuego/serie' },
  { key: 'presionInicial', label: 'Presion inicial' },
  { key: 'presionFinal', label: 'Presion final' },
  { key: 'torqueAplicado', label: 'Torque aplicado' },
  { key: 'observaciones', label: 'Observaciones' }
]

const controles = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value?.controles) ? attrRef.value.controles : []
})

onMounted(() => {
  ensureBody()
})

function uid() {
  return `neumaticos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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

function createTires(positions, savedRows = []) {
  return positions.map((posicion, index) => {
    const saved = savedRows.find((row) => Number(row?.posicion) === posicion) || savedRows[index] || {}
    return {
      id: saved.id || `neumatico-${posicion}`,
      posicion,
      marcaNeumatico: String(saved.marcaNeumatico ?? ''),
      modeloNeumatico: String(saved.modeloNeumatico ?? ''),
      medida: String(saved.medida ?? ''),
      numeroArcajeFuegoSerie: String(saved.numeroArcajeFuegoSerie ?? ''),
      presionInicial: String(saved.presionInicial ?? ''),
      presionFinal: String(saved.presionFinal ?? ''),
      torqueAplicado: String(saved.torqueAplicado ?? ''),
      observaciones: String(saved.observaciones ?? '')
    }
  })
}

function createEquipo(tipo, positions, saved = {}) {
  return {
    id: saved?.id || uid(),
    tipo,
    cerrado: saved?.cerrado === true,
    descripcion: String(saved?.descripcion ?? ''),
    neumaticos: createTires(positions, Array.isArray(saved?.neumaticos) ? saved.neumaticos : [])
  }
}

function defaultEquipos(savedEquipos = [], legacyControl = {}) {
  if (savedEquipos.length) {
    return savedEquipos.map((equipo, index) => {
      const tipo = equipo?.tipo || (index === 0 ? 'N° Interno' : 'Km')
      const positions = tipo === 'Km' ? [5, 6, 7, 8] : [1, 2, 3, 4]
      return createEquipo(tipo, positions, equipo)
    })
  }

  const legacyRows = Array.isArray(legacyControl?.neumaticos) ? legacyControl.neumaticos : []
  return [
    createEquipo('N° Interno', [1, 2, 3, 4], {
      descripcion: legacyControl?.numeroInterno,
      neumaticos: legacyRows.filter((row) => Number(row?.posicion) <= 4)
    }),
    createEquipo('Km', [5, 6, 7, 8], {
      descripcion: legacyControl?.km,
      neumaticos: legacyRows.filter((row) => Number(row?.posicion) >= 5)
    })
  ]
}

function createControl() {
  return {
    id: uid(),
    cerrado: false,
    ejecutante: '',
    profundidadNeumatico: '',
    fecha: todayIso(),
    equipos: defaultEquipos()
  }
}

function normalizeControl(saved) {
  return {
    id: saved?.id || uid(),
    cerrado: saved?.cerrado === true,
    ejecutante: String(saved?.ejecutante ?? ''),
    profundidadNeumatico: String(saved?.profundidadNeumatico ?? ''),
    fecha: normalizeDate(saved?.fecha) || todayIso(),
    equipos: defaultEquipos(Array.isArray(saved?.equipos) ? saved.equipos : [], saved)
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

function findEquipo(control, equipo) {
  const current = findControl(control)
  return (current?.equipos || []).find((candidate) => candidate.id === equipo.id) || equipo
}

function setEquipoField(control, equipo, key, value) {
  if (props.disabled || !control || !equipo) return
  ensureBody(false)
  findEquipo(control, equipo)[key] = value || ''
  changed()
}

function toggleEquipo(control, equipo) {
  if (!control || !equipo) return
  ensureBody(false)
  const current = findEquipo(control, equipo)
  current.cerrado = current.cerrado !== true
  changed()
}

function findTire(control, equipo, row) {
  const currentEquipo = findEquipo(control, equipo)
  return (currentEquipo?.neumaticos || []).find((candidate) => candidate.id === row.id) || row
}

function setTireField(control, equipo, row, key, value) {
  if (props.disabled || !control || !equipo || !row) return
  ensureBody(false)
  findTire(control, equipo, row)[key] = value || ''
  changed()
}

function getEquipmentAnsweredCount(equipo) {
  renderTick.value
  return (equipo?.neumaticos || []).filter((row) =>
    tireFields.some((field) => String(row?.[field.key] ?? '').trim() !== '')
  ).length
}
</script>

<style scoped>
.checklist-neumaticos-dmh {
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

.equipment-block {
  overflow: hidden;
  border: 1px solid rgba(20, 184, 166, 0.45);
  border-radius: 7px;
  background: rgba(2, 6, 23, 0.12);
}

.equipment-head {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  background: rgba(30, 41, 59, 0.86);
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

.equipment-head strong {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.equipment-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.equipment-body {
  display: grid;
  gap: 8px;
  padding: 10px;
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

.tire-row {
  display: grid;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.18);
}

.tire-title {
  color: #fde68a;
  font-size: 12px;
  font-weight: 900;
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
