<template>
  <div>
    <v-alert type="info" variant="tonal" density="compact" class="mb-2">
      Puedes agregar uno o más extintores usando el botón <strong>+</strong>.
    </v-alert>

    <div v-if="!rows.length" class="text-center mb-3">
      <v-btn color="primary" variant="tonal" :disabled="disabled" @click="add()">
        <v-icon class="mr-2" icon="mdi-plus" />
        Agregar extintor
      </v-btn>
    </div>

    <div v-for="(it, idx) in rows" :key="'ext-' + idx" class="mb-4">
        <v-card variant="outlined" class="rounded-lg">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-2">EXTINTOR {{ idx + 1 }}</span>
            <div class="d-flex align-center ga-4">
              <v-btn icon size="x-small" color="red" title="Eliminar" :disabled="disabled" @click="remove(idx)">
                <v-icon icon="mdi-delete-outline" />
              </v-btn>
              <v-btn
                icon
                size="x-small"
                variant="text"
                :title="it.__collapsed ? 'Abrir' : 'Cerrar'"
                @click="toggleCollapse(it)"
              >
                <v-icon :icon="it.__collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'" />
              </v-btn>
            </div>
          </v-card-title>

        <v-card-text v-show="!it.__collapsed" class="pt-0 ext-card-text">
          <div class="table-wrap">
            <table class="ext-table">
              <thead>
                <tr>
                  <th class="col-concepto">CONCEPTO</th>
                  <th class="col-check">C</th>
                  <th class="col-check">NC</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td class="concepto-cell">Capacidad nominal del extintor (KG)</td>
                  <td colspan="2">
                    <v-text-field
                      v-model="it.capacidadNominal"
                      density="compact"
                      variant="underlined"
                      hide-details
                      :disabled="disabled"
                      @update:model-value="touch()"
                    />
                  </td>
                </tr>

                <tr>
                  <td class="concepto-cell">Potencial de extinción</td>
                  <td colspan="2">
                    <v-text-field
                      v-model="it.potencialExtincion"
                      density="compact"
                      variant="underlined"
                      hide-details
                      :disabled="disabled"
                      @update:model-value="touch()"
                    />
                  </td>
                </tr>

                <tr v-for="(label, cIdx) in checkLabels" :key="'chk-' + idx + '-' + cIdx">
                  <td class="concepto-cell">{{ label }}</td>
                  <td class="text-center">
                    <v-btn
                      size="x-small"
                      :color="getCheck(it, cIdx) === 'C' ? 'success' : undefined"
                      :variant="getCheck(it, cIdx) === 'C' ? 'flat' : 'outlined'"
                      :disabled="disabled"
                      @click="setCheck(it, cIdx, 'C')"
                    >
                      C
                    </v-btn>
                  </td>
                  <td class="text-center">
                    <v-btn
                      size="x-small"
                      :color="getCheck(it, cIdx) === 'NC' ? 'error' : undefined"
                      :variant="getCheck(it, cIdx) === 'NC' ? 'flat' : 'outlined'"
                      :disabled="disabled"
                      @click="setCheck(it, cIdx, 'NC')"
                    >
                      NC
                    </v-btn>
                  </td>
                </tr>

                <tr>
                  <td class="concepto-cell">Clase del extintor</td>
                  <td colspan="2">
                    <v-text-field
                      v-model="it.claseExtintor"
                      density="compact"
                      variant="underlined"
                      hide-details
                      :disabled="disabled"
                      @update:model-value="touch()"
                    />
                  </td>
                </tr>

                <tr>
                  <td class="concepto-cell">Ubicación</td>
                  <td colspan="2">
                    <v-text-field
                      v-model="it.ubicacion"
                      density="compact"
                      variant="underlined"
                      hide-details
                      :disabled="disabled"
                      @update:model-value="touch()"
                    />
                  </td>
                </tr>

                <tr>
                  <td class="concepto-cell">N° de sello</td>
                  <td colspan="2">
                    <v-text-field
                      v-model="it.nroSello"
                      density="compact"
                      variant="underlined"
                      hide-details
                      :disabled="disabled"
                      @update:model-value="touch()"
                    />
                  </td>
                </tr>

                <tr>
                  <td class="concepto-cell">Fecha de vencimiento</td>
                  <td colspan="2">
                    <input
                      v-model="it.fechaVencimiento"
                      type="date"
                      class="date-native"
                      :disabled="disabled"
                      @click="openNativeDatePicker"
                      @change="touch()"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </v-card-text>
      </v-card>
    </div>

    <div v-if="rows.length" class="text-center mt-2">
      <v-btn icon size="x-small" color="green" title="Agregar extintor" :disabled="disabled" @click="add()">
        <v-icon icon="mdi-plus" />
      </v-btn>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable vue/no-mutating-props */
import { computed, watch } from 'vue'

const props = defineProps({
  attr: { type: Object, required: true },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['change'])

const checkLabels = [
  'El extintor está completamente cargado y operable',
  'Las calcomanías y las placas de instrucción están legibles y en el frente del extintor (Tipo/Fecha)',
  'El extintor tiene el sello de seguridad',
  'El extintor tienen el pasador o pin de seguridad',
  'La pintura del cilindro está en buen estado',
  'El cilindro está en buen estado, sin oxidación, roturas, abolladuras, golpes o deformaciones',
  'La manguera del extintor está en buen estado, sin roturas, poros, agrietamientos u obstrucciones con papel, insectos, entre otros.',
  'Las uniones de manguera o boquilla se encuentran firme y en buen estado',
  'La válvula no presenta oxidación, daños en la manija, deformaciones que impidan su funcionamiento',
  'Manómetro en buen estado',
  'La lectura de presión está dentro del rango operable',
  'El extintor se encuentra bien ubicado, señalizado, libre de obstáculos',
  'En el caso de encontrarse ubicado en la intemperie, se encuentra protegido del ambiente con gabinete cerrado o funda'
]

const rows = computed(() => (Array.isArray(props.attr?.body) ? props.attr.body : []))

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeCheck(v) {
  const raw = String(v ?? '').trim().toUpperCase()
  if (raw === 'CN') return 'NC'
  return raw === 'C' || raw === 'NC' ? raw : ''
}

function blankRow() {
  const checks = {}
  for (let i = 0; i < checkLabels.length; i += 1) {
    checks[`c_${i}`] = ''
  }
  return {
    capacidadNominal: '',
    potencialExtincion: '',
    checks,
    claseExtintor: '',
    ubicacion: '',
    nroSello: '',
    fechaVencimiento: todayIso(),
    __collapsed: false
  }
}

function ensureStructure() {
  if (!Array.isArray(props.attr.body)) props.attr.body = []
  props.attr.body = props.attr.body.map((row) => {
    const base = row && typeof row === 'object' ? row : {}
    const checks = {}
    for (let i = 0; i < checkLabels.length; i += 1) {
      checks[`c_${i}`] = normalizeCheck(base?.checks?.[`c_${i}`])
    }
    return {
      capacidadNominal: String(base.capacidadNominal ?? ''),
      potencialExtincion: String(base.potencialExtincion ?? ''),
      checks,
      claseExtintor: String(base.claseExtintor ?? ''),
      ubicacion: String(base.ubicacion ?? ''),
      nroSello: String(base.nroSello ?? ''),
      fechaVencimiento: String(base.fechaVencimiento ?? todayIso()),
      __collapsed: Boolean(base.__collapsed)
    }
  })
}

function getCheck(row, idx) {
  return normalizeCheck(row?.checks?.[`c_${idx}`])
}

function setCheck(row, idx, value) {
  if (props.disabled || !row) return
  if (!row.checks || typeof row.checks !== 'object') row.checks = {}
  row.checks[`c_${idx}`] = value
  touch()
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

function openNativeDatePicker(event) {
  try {
    const el = event?.target
    if (el && typeof el.showPicker === 'function') {
      el.showPicker()
    }
  } catch (e) {
    // Fallback silencioso: en algunos navegadores showPicker requiere gesto explícito.
  }
}

watch(
  () => props.attr,
  () => ensureStructure(),
  { immediate: true, deep: false }
)
</script>

<style scoped>
.table-wrap {
  overflow-x: auto;
  border: 1px solid #d7dde3;
  border-radius: 8px;
}

.ext-table {
  border-collapse: collapse;
  width: 100%;
  background: #fff;
  table-layout: fixed;
}

.ext-table th,
.ext-table td {
  border: 1px solid #2f2f2f;
  padding: 6px;
  font-size: 12px;
}

.col-concepto {
  width: 70%;
}

.col-check {
  width: 15%;
  text-align: center;
}

.concepto-cell {
  font-weight: 500;
  vertical-align: top;
}

.ext-card-text {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.date-native {
  width: 100%;
  border: none;
  border-bottom: 1px solid #9ca3af;
  outline: none;
  font-size: 14px;
  padding: 8px 4px;
  background: transparent;
}
</style>
