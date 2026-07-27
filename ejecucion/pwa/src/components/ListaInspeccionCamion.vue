<template>
  <div class="lista-inspeccion-camion">
    <v-row dense class="mb-2">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="attrRef.month"
          type="month"
          label="Mes"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="emitChange"
        />
      </v-col>
    </v-row>

    <v-expansion-panels multiple>
      <v-expansion-panel
        v-for="week in weeks"
        :key="week.key"
        class="mb-3"
      >
        <v-expansion-panel-title class="font-weight-bold">
          {{ getWeekTitle(week.label) }}
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div
            v-for="(row, idx) in rows"
            :key="`${week.key}-${row.id || idx}`"
            class="day-row-wrap"
          >
            <div v-if="row.kind === 'group'" class="group-row">
              {{ row.label }}
            </div>

            <div v-else class="day-row">
              <div class="question-text">
                {{ row.label }}
              </div>
              <div class="check-col">
                <v-btn-toggle
                  :model-value="normalizeVal(row.weeks?.[week.key])"
                  :disabled="disabled"
                  mandatory
                  density="compact"
                  @update:model-value="(val) => onWeekValueChange(row, week.key, val)"
                >
                  <v-btn value="si" size="x-small">SI</v-btn>
                  <v-btn value="no" size="x-small">NO</v-btn>
                  <v-btn value="na" size="x-small">NA</v-btn>
                </v-btn-toggle>
              </div>
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
          v-for="(w, wIdx) in attrRef.resumenSemanal"
          :key="`res-${w.week || wIdx}`"
          class="mb-4"
        >
          <div class="font-weight-bold mb-2">
            Semana {{ w.week }}
          </div>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-textarea
                v-model="w.observacion"
                :disabled="disabled"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details
                label="Causas o motivos de observaciones"
                @update:model-value="emitChange"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-textarea
                v-model="w.accionResponsable"
                :disabled="disabled"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details
                label="Accion a realizar / Responsable"
                @update:model-value="emitChange"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model="w.fecha"
                :disabled="disabled"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                label="Fecha"
                @update:model-value="emitChange"
              />
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, toRef } from 'vue'

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

const weeks = [
  { key: 's1', label: '1ra semana' },
  { key: 's2', label: '2da semana' },
  { key: 's3', label: '3ra semana' },
  { key: 's4', label: '4ta semana' }
]

const defaultRows = [
  { kind: 'group', label: 'DOCUMENTACION' },
  { kind: 'item', label: 'Licencia Conducir' },
  { kind: 'item', label: 'Revision Tecnica' },
  { kind: 'item', label: 'Seguro Obligatorio' },
  { kind: 'item', label: 'Control de Gases' },
  { kind: 'item', label: 'Permiso de Circulacion' },

  { kind: 'group', label: 'HOJA DE VIDA' },
  { kind: 'item', label: 'Fecha Ultima Mantencion Preventiva' },
  { kind: 'item', label: 'Kilometraje' },

  { kind: 'group', label: 'FUNCIONAMIENTO' },
  { kind: 'item', label: 'Nivel Aceite de Motor' },
  { kind: 'item', label: 'Nivel Aceite Hidraulico' },
  { kind: 'item', label: 'Pasadores de los Cilindros en Buen Estado' },
  { kind: 'item', label: 'Relojes de Temperatura, Aceite y Petroleo en Buen Estado' },
  { kind: 'item', label: 'Nivel Aceite Transmision' },
  { kind: 'item', label: 'Nivel de Refrigerante' },
  { kind: 'item', label: 'Luces (altas, bajas, estacionamiento, etc.)' },
  { kind: 'item', label: 'Cabina en Buen Estado' },
  { kind: 'item', label: 'Frenos (estacionamiento, servicio, etc.)' },
  { kind: 'item', label: 'Vidrios (parabrisas, puertas, etc.)' },
  { kind: 'item', label: 'Fugas de Aceite (hidraulico, motor, etc.)' },
  { kind: 'item', label: 'Fugas de Agua (radiador, mangueras, etc.)' },
  { kind: 'item', label: 'Direccion' },
  { kind: 'item', label: 'Transmision' },

  { kind: 'group', label: 'ACCESORIOS' },
  { kind: 'item', label: 'Gata y Llave de Rueda' },
  { kind: 'item', label: 'Bocina' },
  { kind: 'item', label: 'Alarma de Retroceso' },
  { kind: 'item', label: 'Limpia Parabrisas' },
  { kind: 'item', label: 'Espejos Retrovisores' },
  { kind: 'item', label: 'Sistema de Ventilacion' },
  { kind: 'item', label: 'Triangulos' },
  { kind: 'item', label: 'Extintor' },
  { kind: 'item', label: 'Botiquin' },
  { kind: 'item', label: 'Cinturon de Seguridad' },
  { kind: 'item', label: 'Conos' }
]

const rows = computed(() => (Array.isArray(attrRef.value?.body) ? attrRef.value.body : []))

onMounted(() => {
  ensureBody()
  ensureMonth()
  ensureResumen()
})

function getWeekTitle(label) {
  return `Lista Inspeccion Camion (${label})`
}

function currentMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function ensureMonth() {
  if (!attrRef.value.month || String(attrRef.value.month).trim() === '') {
    attrRef.value.month = currentMonth()
  }
}

function ensureResumen() {
  if (!Array.isArray(attrRef.value.resumenSemanal)) {
    attrRef.value.resumenSemanal = []
  }

  attrRef.value.resumenSemanal = [1, 2, 3, 4].map((n, idx) => {
    const src = attrRef.value.resumenSemanal[idx] || {}
    return {
      week: String(n),
      observacion: (src?.observacion ?? '').toString(),
      accionResponsable: (src?.accionResponsable ?? '').toString(),
      fecha: (src?.fecha ?? '').toString()
    }
  })
}

function ensureBody() {
  if (!Array.isArray(attrRef.value.body)) attrRef.value.body = []

  if (!attrRef.value.body.length) {
    attrRef.value.body = defaultRows.map((row, idx) => ({
      id: `${idx + 1}`,
      kind: row.kind,
      label: row.label,
      weeks: row.kind === 'item'
        ? { s1: '', s2: '', s3: '', s4: '' }
        : undefined
    }))
    return
  }

  attrRef.value.body = attrRef.value.body.map((row, idx) => {
    const base = defaultRows[idx]
    const kind = row?.kind || base?.kind || 'item'
    return {
      id: row?.id || `${idx + 1}`,
      kind,
      label: row?.label || base?.label || `ITEM ${idx + 1}`,
      weeks: kind === 'item'
        ? {
          s1: normalizeVal(row?.weeks?.s1),
          s2: normalizeVal(row?.weeks?.s2),
          s3: normalizeVal(row?.weeks?.s3),
          s4: normalizeVal(row?.weeks?.s4)
        }
        : undefined
    }
  })
}

function normalizeVal(v) {
  const n = String(v ?? '').trim().toLowerCase()
  if (n === 'n/a') return 'na'
  if (n === 'si' || n === 'no' || n === 'na') return n
  return ''
}

function onWeekValueChange(row, weekKey, val) {
  if (!row || row.kind !== 'item') return
  if (!row.weeks || typeof row.weeks !== 'object') {
    row.weeks = { s1: '', s2: '', s3: '', s4: '' }
  }
  row.weeks[weekKey] = normalizeVal(val)
  emitChange()
}

function emitChange() {
  emit('change')
}
</script>

<style scoped>
.day-row-wrap {
  border-bottom: 1px solid #e5e7eb;
}

.day-row-wrap:last-child {
  border-bottom: none;
}

.group-row {
  font-weight: 700;
  font-size: 13px;
  padding: 12px 0 8px 0;
  color: #111827;
}

.day-row {
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.question-text {
  flex: 1;
  line-height: 1.35;
  padding: 8px 16px 8px 0;
}

.check-col {
  min-width: 190px;
  display: flex;
  justify-content: flex-end;
}
</style>
