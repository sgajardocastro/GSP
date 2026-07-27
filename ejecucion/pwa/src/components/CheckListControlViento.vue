<template>
  <div class="checklist-viento">
    <v-expansion-panels v-model="openSections" multiple class="wind-panels">
      <v-expansion-panel value="datos" class="wind-card">
        <v-expansion-panel-title class="wind-title">
          DATOS CONTROL DE VIENTO
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDato('equipo')"
                label="EQUIPO"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('equipo', value)"
              />
            </v-col>
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
                :model-value="getDato('operador')"
                label="OPERADOR"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('operador', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDato('tarea')"
                label="TAREA"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('tarea', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDato('rigger')"
                label="RIGGER"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('rigger', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDato('firma')"
                label="FIRMA"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('firma', value)"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="lecturas" class="wind-card">
        <v-expansion-panel-title class="wind-title">
          LECTURAS DE VIENTO
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="reading-actions">
            <v-btn
              size="small"
              variant="tonal"
              color="success"
              prepend-icon="mdi-plus"
              :disabled="disabled"
              @click="addLectura"
            >
              Agregar
            </v-btn>
          </div>

          <div
            v-for="row in lecturas"
            :key="row.id"
            class="reading-card"
          >
            <div class="reading-head">
              <div class="reading-number">Item {{ row.item }}</div>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="tonal"
                color="error"
                class="delete-btn"
                :disabled="disabled || lecturas.length <= 1"
                @click="removeLectura(row)"
              />
            </div>

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="row.lecturas"
                  label="LECTURAS"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  @update:model-value="(value) => setLectura(row, 'lecturas', value)"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="row.hora"
                  type="time"
                  label="HORA"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  @update:model-value="(value) => setLectura(row, 'hora', value)"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="row.constante"
                  label="CONSTANTE km/h"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  @update:model-value="(value) => setLectura(row, 'constante', value)"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="row.rafaga"
                  label="RAFAGA km/h"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  @update:model-value="(value) => setLectura(row, 'rafaga', value)"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="row.horaSuspension"
                  type="time"
                  label="HORA SUSPENSION"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  @update:model-value="(value) => setLectura(row, 'horaSuspension', value)"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="row.horaReanudacion"
                  type="time"
                  label="HORA REANUDACION"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  @update:model-value="(value) => setLectura(row, 'horaReanudacion', value)"
                />
              </v-col>
            </v-row>

            <v-textarea
              :model-value="row.observaciones"
              label="Observaciones"
              variant="outlined"
              density="compact"
              rows="1"
              auto-grow
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setLectura(row, 'observaciones', value)"
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="consulta" class="wind-card">
        <v-expansion-panel-title class="wind-title">
          CONVERSION DE REFERENCIA
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="conversion-card">
            <div class="conversion-note">Constante 3,6 metros por segundo a km/h</div>
            <div
              v-for="row in conversionRows"
              :key="row.ms"
              class="conversion-row"
            >
              <strong>{{ row.ms }} m/s</strong>
              <span>=</span>
              <strong>{{ row.kmh }} km/h</strong>
            </div>
          </div>
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
const openSections = ref(['datos', 'lecturas', 'consulta'])

const conversionRows = [
  { ms: 6, kmh: 21.6 },
  { ms: 7, kmh: 25.2 },
  { ms: 8, kmh: 28.8 },
  { ms: 9, kmh: 32.4 },
  { ms: 10, kmh: 36 },
  { ms: 11, kmh: 39.6 },
  { ms: 12, kmh: 43.2 },
  { ms: 13, kmh: 46.8 },
  { ms: 14, kmh: 50.4 }
]

const lecturas = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value?.lecturas) ? attrRef.value.lecturas : []
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
    "equipo": String(attrRef.value.datos.equipo ?? ''),
    "fecha": normalizeDate(attrRef.value.datos.fecha) || todayIso(),
    "operador": String(attrRef.value.datos.operador ?? ''),
    "tarea": String(attrRef.value.datos.tarea ?? ''),
    "rigger": String(attrRef.value.datos.rigger ?? ''),
    "firma": String(attrRef.value.datos.firma ?? '')
  }

  const savedLecturas = Array.isArray(attrRef.value.lecturas) ? attrRef.value.lecturas : []
  attrRef.value.lecturas = (savedLecturas.length > 0 ? savedLecturas : [createEmptyLectura(1)])
    .map((saved, index) => normalizeLectura(saved, index + 1))

  renderTick.value += 1
}

function createEmptyLectura(item) {
  return {
    "id": `viento-${Date.now()}-${item}`,
    "item": item,
    "lecturas": "",
    "hora": "",
    "constante": "",
    "rafaga": "",
    "horaSuspension": "",
    "horaReanudacion": "",
    "observaciones": ""
  }
}

function normalizeLectura(saved, item) {
  return {
    "id": saved.id || `viento-${Date.now()}-${item}`,
    "item": item,
    "lecturas": String(saved.lecturas ?? ''),
    "hora": String(saved.hora ?? ''),
    "constante": String(saved.constante ?? ''),
    "rafaga": String(saved.rafaga ?? ''),
    "horaSuspension": String(saved.horaSuspension ?? ''),
    "horaReanudacion": String(saved.horaReanudacion ?? ''),
    "observaciones": String(saved.observaciones ?? '')
  }
}

function renumberLecturas() {
  if (!Array.isArray(attrRef.value.lecturas)) attrRef.value.lecturas = []
  attrRef.value.lecturas.forEach((row, index) => {
    row.item = index + 1
  })
}

function getDato(key) {
  renderTick.value
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') {
    attrRef.value.datos = {}
  }
  return attrRef.value.datos[key] || ''
}

function setDato(key, value) {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') {
    attrRef.value.datos = {}
  }
  attrRef.value.datos[key] = value || ''
  renderTick.value += 1
  emit('change')
}

function setLectura(row, key, value) {
  if (!row) return
  row[key] = value || ''
  renderTick.value += 1
  emit('change')
}

function addLectura() {
  if (props.disabled) return
  if (!Array.isArray(attrRef.value.lecturas)) attrRef.value.lecturas = []
  attrRef.value.lecturas.push(createEmptyLectura(attrRef.value.lecturas.length + 1))
  renumberLecturas()
  renderTick.value += 1
  emit('change')
}

function removeLectura(row) {
  if (props.disabled || !Array.isArray(attrRef.value.lecturas) || attrRef.value.lecturas.length <= 1) return
  const index = attrRef.value.lecturas.findIndex((item) => item.id === row.id)
  if (index < 0) return
  attrRef.value.lecturas.splice(index, 1)
  renumberLecturas()
  renderTick.value += 1
  emit('change')
}
</script>

<style scoped>
.checklist-viento {
  width: 100%;
}

.wind-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  width: 100%;
}

.wind-panels :deep(.v-expansion-panel),
.wind-panels :deep(.v-expansion-panel-title),
.wind-panels :deep(.v-expansion-panel-text) {
  width: 100%;
  max-width: none;
}

.wind-card {
  width: 100%;
  max-width: none !important;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  overflow: hidden;
}

.wind-title {
  min-height: 46px;
  padding: 10px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  white-space: normal;
}

.reading-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  margin-bottom: 10px;
}

.reading-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.2);
}

.reading-card + .reading-card {
  margin-top: 10px;
}

.reading-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.reading-number {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
}

.delete-btn {
  background: rgba(220, 38, 38, 0.28) !important;
  border: 1px solid rgba(248, 113, 113, 0.7);
  color: #fecaca !important;
}

.delete-btn :deep(.v-icon) {
  color: #fecaca !important;
  opacity: 1;
}

.conversion-card {
  overflow: hidden;
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
}

.conversion-note,
.conversion-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
  padding: 7px 10px;
  color: #e5eefb;
  font-size: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.conversion-note {
  display: block;
  color: #f8fafc;
  font-weight: 900;
  background: rgba(20, 184, 166, 0.14);
}

.conversion-row:last-child {
  border-bottom: none;
}
</style>
