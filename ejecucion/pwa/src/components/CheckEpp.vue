<template>
  <div>
    <v-alert type="info" variant="tonal" density="compact" class="mb-2">
      Puedes agregar uno o más registros usando el botón <strong>+</strong>.
    </v-alert>

    <div v-if="!rows.length" class="text-center mb-3">
      <v-btn color="primary" variant="tonal" :disabled="disabled" @click="add()">
        <v-icon class="mr-2" icon="mdi-plus" />
        Agregar primer registro
      </v-btn>
    </div>

    <div v-for="(it, idx) in rows" :key="'epp-' + idx" class="mb-4">
        <v-card variant="outlined" class="rounded-lg">
        <v-card-title class="d-flex align-start justify-space-between">
          <span class="text-subtitle-2 registro-title">
            Registro {{ idx + 1 }}<template v-if="String(it.nombre || '').trim()"> - {{ it.nombre }}</template>
          </span>
          <div class="d-flex align-center ga-4 registro-actions">
            <v-btn icon size="x-small" color="red" title="Eliminar" :disabled="disabled" @click="remove(idx)">
              <v-icon icon="mdi-delete-outline" />
            </v-btn>
            <v-btn icon size="x-small" variant="text" :title="it.__collapsed ? 'Abrir' : 'Cerrar'" @click="toggleCollapse(it)">
              <v-icon :icon="it.__collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'" />
            </v-btn>
          </div>
        </v-card-title>

        <v-card-text v-show="!it.__collapsed" class="pt-0">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="it.nombre"
                label="Nombre"
                density="compact"
                variant="outlined"
                hide-details
                :disabled="disabled"
                @update:model-value="touch()"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="it.cargo"
                label="Cargo"
                density="compact"
                variant="outlined"
                hide-details
                :disabled="disabled"
                @update:model-value="touch()"
              />
            </v-col>
          </v-row>

          <div class="table-wrap mt-3">
            <table class="epp-table">
              <thead>
                <tr>
                  <th class="col-item">Elemento</th>
                  <th class="col-estado">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, iIdx) in it.items" :key="'item-' + idx + '-' + iIdx">
                  <td class="item-cell">{{ item.label }}</td>
                  <td>
                    <v-btn-toggle
                      v-model="item.estado"
                      mandatory
                      density="compact"
                      class="epp-toggle"
                      :disabled="disabled"
                      @update:model-value="touch()"
                    >
                      <v-btn v-for="op in estadoOptions" :key="op" :value="op" size="x-small">{{ op }}</v-btn>
                    </v-btn-toggle>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-3">
            <v-textarea
              v-model="it.observacionGeneral"
              label="Observación"
              rows="2"
              auto-grow
              density="compact"
              variant="outlined"
              hide-details
              :disabled="disabled"
              @update:model-value="touch()"
            />
          </div>

          <div class="mt-3">
            <div class="text-subtitle-2 mb-2">Foto (1)</div>
            <div class="foto-wrap">
              <FotoCapture
                :max-fotos="1"
                :obligatorio-fotos="0"
                :compression="compression"
                :show-observacion="false"
                :compact="true"
                :disabled="disabled"
                v-model:galeria="it.galeria"
                v-model:observacion="it.fotoObs"
                @update:galeria="touch()"
                @update:observacion="touch()"
              />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <div v-if="rows.length" class="text-center mt-2">
      <v-btn icon size="x-small" color="green" title="Agregar registro" :disabled="disabled" @click="add()">
        <v-icon icon="mdi-plus" />
      </v-btn>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable vue/no-mutating-props */
import { computed, watch } from 'vue'
import FotoCapture from '@/components/FotoCapture.vue'

const props = defineProps({
  attr: { type: Object, required: true },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['change'])

const DEFAULT_ITEMS = [
  'Casco',
  'Barbiquejo',
  'Legionario',
  'Lentes',
  'Buzo',
  'Chaleco reflectante',
  'Calzado',
  'Protector auditivo',
  'Guantes de cabritilla',
  'Guantes de cabritilla largos',
  'Guantes anti vibración',
  'Guantes nitrilo',
  'Guantes soldador',
  'Traje soldador',
  'Mascara de soldador',
  'Careta Facial',
  'Buzo desechable',
  'Botas',
  'Mascara rostro completo',
  'Mascara medio rostro',
  'Mascar Full Face',
  'Filtros',
  'Escafandra',
  'Mica gruesa',
  'Mica delgada',
  'Arnés de seguridad',
  'Cabos de vida',
  'Coipa'
]

const rows = computed(() => (Array.isArray(props.attr?.body) ? props.attr.body : []))

const estadoOptions = computed(() => {
  const ops = Array.isArray(props.attr?.condicionesOptions) && props.attr.condicionesOptions.length
    ? props.attr.condicionesOptions
    : ['B', 'M', 'N/A']
  return ops.map((x) => String(x ?? '').trim()).filter(Boolean)
})

const compression = computed(() => {
  const c = Number(props.attr?.compression ?? 0.25)
  return Number.isFinite(c) ? c : 0.25
})

const itemsLabels = computed(() => {
  const fromCatalog = Array.isArray(props.attr?.itemsCatalogo) ? props.attr.itemsCatalogo : []
  const labels = fromCatalog
    .map((it) => String(it?.nombre ?? '').trim())
    .filter(Boolean)
  return labels.length ? labels : DEFAULT_ITEMS
})

function blankItems() {
  const first = estadoOptions.value[0] ?? 'B'
  return itemsLabels.value.map((label) => ({
    label,
    estado: first
  }))
}

function normalizeEstado(v) {
  const raw = String(v ?? '').trim().toLowerCase()
  if (['bueno', 'b'].includes(raw)) return 'B'
  if (['malo', 'm'].includes(raw)) return 'M'
  if (['n/a', 'na'].includes(raw)) return 'N/A'
  return String(v ?? '').trim()
}

function blankRow() {
  return {
    nombre: '',
    cargo: '',
    items: blankItems(),
    galeria: [],
    fotoObs: '',
    __collapsed: false
  }
}

function ensureStructure() {
  if (!Array.isArray(props.attr.body)) props.attr.body = []
  props.attr.body = props.attr.body.map((row) => {
    const base = row && typeof row === 'object' ? row : {}
    const byLabel = new Map((Array.isArray(base.items) ? base.items : []).map((x) => [String(x?.label ?? ''), x]))
    const items = itemsLabels.value.map((label) => {
      const prev = byLabel.get(label) || {}
      return {
        label,
        estado: normalizeEstado(prev?.estado || (estadoOptions.value[0] ?? 'B'))
      }
    })
    return {
      nombre: String(base.nombre ?? ''),
      cargo: String(base.cargo ?? ''),
      observacionGeneral: String(base.observacionGeneral ?? ''),
      items,
      galeria: Array.isArray(base.galeria) ? base.galeria : [],
      fotoObs: String(base.fotoObs ?? ''),
      __collapsed: Boolean(base.__collapsed)
    }
  })
}

function add() {
  if (props.disabled) return
  if (!Array.isArray(props.attr.body)) props.attr.body = []
  props.attr.body.push(blankRow())
  touch()
}

function remove(idx) {
  if (props.disabled) return
  if (!Array.isArray(props.attr.body)) props.attr.body = []
  props.attr.body.splice(idx, 1)
  touch()
}

function toggleCollapse(row) {
  if (!row) return
  row.__collapsed = !row.__collapsed
  touch()
}

function touch() {
  props.attr.__touched = Date.now()
  emit('change')
}

watch(
  () => [props.attr, itemsLabels.value.length, estadoOptions.value.length],
  () => ensureStructure(),
  { immediate: true }
)
</script>

<style scoped>
.table-wrap {
  overflow-x: auto;
  border: 1px solid #d7dde3;
  border-radius: 8px;
}

.epp-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.epp-table th,
.epp-table td {
  border: 1px solid #2f2f2f;
  padding: 6px;
  font-size: 12px;
  vertical-align: top;
}

.col-item {
  width: 60%;
}

.col-estado {
  width: 40%;
}

.item-cell {
  font-weight: 500;
}

.registro-title {
  flex: 1 1 auto;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.2;
}

.registro-actions {
  flex: 0 0 auto;
}

.epp-toggle {
  width: 100%;
}

.epp-toggle :deep(.v-btn) {
  flex: 1;
  min-width: 0;
}

.foto-wrap {
  width: 100%;
}

.foto-wrap :deep(.photo-capture-card) {
  border: none;
  box-shadow: none;
  padding: 0;
  background: transparent;
}

.foto-wrap :deep(.photo-head-row) {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 4px;
}

.foto-wrap :deep(.photo-head-actions) {
  justify-content: flex-start;
}

.foto-wrap :deep(.v-row) {
  margin: 0;
}

.foto-wrap :deep(.v-col) {
  flex: 0 0 110px;
  max-width: 110px;
  padding: 4px;
}

.foto-wrap :deep(.photo-thumb) {
  height: 100px;
}
</style>
