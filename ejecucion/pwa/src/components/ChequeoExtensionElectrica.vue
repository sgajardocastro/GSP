<template>
  <div class="chequeo-ext">
    <v-row dense class="mb-2">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="nuevoNumero"
          label="Nro extension electrica"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @keyup.enter="agregarExtension"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-btn
          color="primary"
          :disabled="disabled || !nuevoNumero"
          @click="agregarExtension"
        >
          Agregar extension
        </v-btn>
      </v-col>
    </v-row>

    <v-expansion-panels multiple>
      <v-expansion-panel
        v-for="day in days"
        :key="day.key"
        class="mb-3"
      >
        <v-expansion-panel-title class="font-weight-bold">
          {{ getDaySegmentTitle(day.title) }}
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-card
            v-for="(bloque, bIdx) in bloques"
            :key="`${day.key}-${bloque.uid || bIdx}`"
            variant="outlined"
            class="mb-3"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="font-weight-bold">EXTENSION ELECTRICA NRO {{ bloque.numero }}</div>
                <v-btn
                  size="x-small"
                  color="error"
                  variant="text"
                  :disabled="disabled"
                  @click="eliminarExtension(bIdx)"
                >
                  Quitar
                </v-btn>
              </div>

              <div
                v-for="(item, iIdx) in bloque.items"
                :key="`${day.key}-${bIdx}-${iIdx}`"
                class="d-flex align-center justify-space-between py-1 day-row"
              >
                <div class="question-text pr-3">{{ item.label }}</div>
                <div class="check-col">
                  <v-checkbox
                    :model-value="Boolean(item.days?.[day.key])"
                    :disabled="disabled"
                    density="compact"
                    hide-details
                    @update:model-value="(val) => onToggleDia(bIdx, iIdx, day.key, val)"
                  />
                </div>
              </div>
            </v-card-text>
          </v-card>

          <div v-if="!bloques.length" class="text-medium-emphasis">Sin extensiones registradas.</div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-card variant="outlined" class="mt-4">
      <v-card-title class="text-subtitle-2 font-weight-bold">
        Resumen Semanal
      </v-card-title>

      <v-card-text>
        <div
          v-for="(bloque, bIdx) in bloques"
          :key="`summary-${bloque.uid || bIdx}`"
          class="mb-5"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="font-weight-bold">EXTENSION ELECTRICA NRO {{ bloque.numero }}</div>
            <v-btn
              size="x-small"
              color="error"
              variant="text"
              :disabled="disabled"
              @click="eliminarExtension(bIdx)"
            >
              Quitar
            </v-btn>
          </div>

          <div
            v-for="(item, iIdx) in bloque.items"
            :key="`summary-item-${bIdx}-${iIdx}`"
            class="mb-3"
          >
            <div class="font-weight-medium mb-1">{{ item.label }}</div>
            <div class="d-flex flex-wrap" style="gap: 6px;">
              <v-chip
                v-for="day in days"
                :key="`chip-${bIdx}-${iIdx}-${day.key}`"
                size="small"
                :color="item.days?.[day.key] ? 'primary' : undefined"
                :variant="item.days?.[day.key] ? 'flat' : 'outlined'"
              >
                {{ day.title }}
              </v-chip>
            </div>
          </div>

          <div class="d-flex align-center flex-wrap ga-3 mb-2">
            <span class="font-weight-medium">Estado:</span>
            <v-btn-toggle
              :model-value="bloque.estado"
              :disabled="disabled"
              mandatory
              density="compact"
              @update:model-value="(val) => onEstadoChange(bIdx, val)"
            >
              <v-btn value="aprobado" size="small">APROBADO</v-btn>
              <v-btn value="rechazado" size="small">RECHAZADO</v-btn>
            </v-btn-toggle>
          </div>

          <v-textarea
            v-model="bloque.observaciones"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            hide-details
            :disabled="disabled"
            placeholder="Observaciones"
            @update:model-value="emitChange"
          />
        </div>

        <div v-if="!bloques.length" class="text-medium-emphasis">Sin extensiones registradas.</div>
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
const attr = toRef(props, 'attr')
const nuevoNumero = ref('')

const days = [
  { key: 'l', title: 'LUN' },
  { key: 'ma', title: 'MAR' },
  { key: 'mi', title: 'MIE' },
  { key: 'j', title: 'JUE' },
  { key: 'v', title: 'VIE' }
]

const baseItems = [
  'Estado enchufe macho',
  'Estado enchufe hembra',
  'Estado y continuidad del cable (cordon y conductores)',
  'Proteccion a tierra'
]

const bloques = computed(() => {
  return Array.isArray(attr.value?.body) ? attr.value.body : []
})

onMounted(() => {
  ensureBody()
})

function getDaySegmentTitle(dayName) {
  return `Chequeo Extension Electrica (${dayName})`
}

function ensureBody() {
  if (!Array.isArray(attr.value.body)) attr.value.body = []
  attr.value.body = attr.value.body.map((block, idx) => normalizeBloque(block, idx))
  ordenarBloques()
  return attr.value.body
}

function normalizeBloque(block, idx) {
  const items = Array.isArray(block?.items) ? block.items : []
  return {
    uid: block?.uid || `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
    numero: String(block?.numero ?? idx + 1),
    estado: (block?.estado ?? '').toString().trim().toLowerCase(),
    observaciones: (block?.observaciones ?? '').toString(),
    items: baseItems.map((label, itemIdx) => {
      const src = items[itemIdx] || {}
      return {
        label: src?.label || label,
        days: {
          l: Boolean(src?.days?.l),
          ma: Boolean(src?.days?.ma),
          mi: Boolean(src?.days?.mi),
          j: Boolean(src?.days?.j),
          v: Boolean(src?.days?.v)
        }
      }
    })
  }
}

function nuevoBloque(numero) {
  return {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    numero: String(numero),
    estado: '',
    observaciones: '',
    items: baseItems.map((label) => ({
      label,
      days: { l: false, ma: false, mi: false, j: false, v: false }
    }))
  }
}

function agregarExtension() {
  const body = ensureBody()
  const numero = String(nuevoNumero.value || '').trim()
  if (!numero) return

  const idx = body.findIndex((b) => String(b?.numero) === numero)
  if (idx >= 0) {
    alert(`La extension Nro ${numero} ya existe.`)
    return
  }

  body.push(nuevoBloque(numero))
  nuevoNumero.value = ''
  ordenarBloques()
  emitChange()
}

function eliminarExtension(index) {
  const body = ensureBody()
  body.splice(index, 1)
  emitChange()
}

function onToggleDia(bIdx, iIdx, day, val) {
  const block = bloques.value?.[bIdx]
  const item = block?.items?.[iIdx]
  if (!item) return
  if (!item.days || typeof item.days !== 'object') {
    item.days = { l: false, ma: false, mi: false, j: false, v: false }
  }
  item.days[day] = Boolean(val)
  emitChange()
}

function onEstadoChange(bIdx, val) {
  const block = bloques.value?.[bIdx]
  if (!block) return
  block.estado = (val ?? '').toString().trim().toLowerCase()
  emitChange()
}

function ordenarBloques() {
  const body = ensureBodyRaw()
  body.sort((a, b) => {
    const na = Number(a?.numero)
    const nb = Number(b?.numero)
    const bothNum = Number.isFinite(na) && Number.isFinite(nb)
    if (bothNum) return na - nb
    return String(a?.numero || '').localeCompare(String(b?.numero || ''), 'es')
  })
}

function ensureBodyRaw() {
  if (!Array.isArray(attr.value.body)) attr.value.body = []
  return attr.value.body
}

function emitChange() {
  emit('change')
}
</script>

<style scoped>
.day-row {
  border-bottom: 1px solid #e5e7eb;
  min-height: 56px;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.day-row:last-child {
  border-bottom: none;
}

.question-text {
  flex: 1;
  line-height: 1.45;
  padding-right: 20px;
}

.check-col {
  min-width: 56px;
  display: flex;
  justify-content: flex-end;
}

.check-col :deep(.v-selection-control) {
  justify-content: flex-end;
}
</style>
