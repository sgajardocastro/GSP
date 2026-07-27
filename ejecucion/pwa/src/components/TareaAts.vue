<template>
  <div>
    <v-alert type="info" variant="tonal" density="compact" class="mb-2">
      Puedes crear muchos <strong>Peligros</strong> y dentro de cada uno muchos <strong>Riesgos</strong> con los botones <strong>+</strong>.
    </v-alert>

    <div v-if="!rows.length" class="text-center mb-3">
      <v-btn color="primary" variant="tonal" :disabled="disabled" @click="add()">
        <v-icon class="mr-2" icon="mdi-plus" />
        Agregar primera tarea
      </v-btn>
    </div>

    <div v-for="(it, idx) in rows" :key="'tarea-' + idx" class="mb-4">
      <v-card variant="outlined" class="rounded-lg">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="text-subtitle-2 font-weight-bold">
            {{ it.tareaEtapa?.trim() ? it.tareaEtapa : `Tarea ${idx + 1}` }}
          </div>

          <v-btn
            icon
            size="x-small"
            color="red"
            title="Eliminar tarea"
            :disabled="disabled"
            @click="remove(idx)"
          >
            <v-icon icon="mdi-delete-outline" />
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-0">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="it.tareaEtapa"
                label="Tarea o Etapas del Trabajo a Realizar"
                density="compact"
                variant="outlined"
                hide-details
                class="bg-white"
                :disabled="disabled"
                @update:model-value="touch()"
              />
            </v-col>
          </v-row>

          <v-card variant="outlined" class="rounded-lg pa-3 mt-3 danger-risk-wrap">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-subtitle-2 font-weight-bold">
                Peligros y Riesgos
              </div>
              <v-btn
                size="x-small"
                color="primary"
                variant="tonal"
                :disabled="disabled"
                @click="addPeligro(it)"
              >
                <v-icon icon="mdi-plus" class="mr-1" />
                Peligro
              </v-btn>
            </div>

            <div
              v-for="(p, pIdx) in it.peligros"
              :key="`p-${idx}-${pIdx}`"
              class="mb-3"
            >
              <v-card variant="outlined" class="rounded-lg pa-2">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="text-caption font-weight-bold">
                    Peligro {{ pIdx + 1 }}
                  </div>
                  <div class="d-flex ga-1">
                    <v-btn
                      size="x-small"
                      color="indigo"
                      variant="tonal"
                      :disabled="disabled"
                      @click="addRiesgo(p, it)"
                    >
                      <v-icon icon="mdi-plus" class="mr-1" />
                      Riesgo
                    </v-btn>
                    <v-btn
                      icon
                      size="x-small"
                      color="red"
                      variant="text"
                      title="Eliminar peligro"
                      :disabled="disabled || it.peligros.length <= 1"
                      @click="removePeligro(it, pIdx)"
                    >
                      <v-icon icon="mdi-delete-outline" />
                    </v-btn>
                  </div>
                </div>

                <v-text-field
                  v-model="p.peligro"
                  label="Peligro"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="bg-white mb-2"
                  :disabled="disabled"
                  @update:model-value="touchRow(it)"
                />

                <div
                  v-for="(r, rIdx) in p.riesgos"
                  :key="`r-${idx}-${pIdx}-${rIdx}`"
                  class="d-flex align-center ga-2 mb-2"
                >
                  <v-text-field
                    v-model="r.riesgo"
                    :label="`Riesgo ${rIdx + 1} (ver Tabla N°1)`"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="bg-white flex-grow-1"
                    :disabled="disabled"
                    @update:model-value="touchRow(it)"
                  />
                  <v-btn
                    icon
                    size="x-small"
                    color="red"
                    variant="text"
                    title="Eliminar riesgo"
                    :disabled="disabled || p.riesgos.length <= 1"
                    @click="removeRiesgo(p, rIdx, it)"
                  >
                    <v-icon icon="mdi-delete-outline" />
                  </v-btn>
                </div>
              </v-card>
            </div>
          </v-card>

          <v-row dense class="mt-1">
            <v-col cols="4" md="2">
              <v-select
                v-model="it.po"
                :items="scoreOptions"
                label="P.O"
                density="compact"
                variant="outlined"
                hide-details
                class="bg-white"
                :disabled="disabled"
                @update:model-value="onScoreChanged(it)"
              />
            </v-col>

            <v-col cols="4" md="2">
              <v-select
                v-model="it.cp"
                :items="scoreOptions"
                label="C.P"
                density="compact"
                variant="outlined"
                hide-details
                class="bg-white"
                :disabled="disabled"
                @update:model-value="onScoreChanged(it)"
              />
            </v-col>

            <v-col cols="4" md="2">
              <v-text-field
                v-model="it.ponderacion"
                label="Ponderación"
                density="compact"
                variant="outlined"
                hide-details
                class="bg-white"
                type="number"
                readonly
                :disabled="disabled"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="it.medidasControl"
                label="Medidas de Control Propuestas"
                density="compact"
                variant="outlined"
                hide-details
                class="bg-white"
                auto-grow
                rows="2"
                :disabled="disabled"
                @update:model-value="touch()"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>

    <div v-if="rows.length" class="text-center mt-2">
      <v-btn
        icon
        size="x-small"
        color="green"
        title="Agregar tarea"
        :disabled="disabled"
        @click="add()"
      >
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
const scoreOptions = ['1', '2', '3']

watch(
  () => props.attr,
  (a) => {
    if (!a) return
    if (!Array.isArray(a.body)) a.body = []
    ensureRowsSchema()
  },
  { immediate: true, deep: false }
)

const rows = computed(() => (Array.isArray(props.attr?.body) ? props.attr.body : []))

function blankRow() {
  return {
    tareaEtapa: '',
    peligro: '',
    riesgo: '',
    peligros: [blankPeligro()],
    po: '',
    cp: '',
    ponderacion: '',
    medidasControl: ''
  }
}

function blankPeligro() {
  return {
    peligro: '',
    riesgos: [blankRiesgo()]
  }
}

function blankRiesgo() {
  return {
    riesgo: ''
  }
}

function ensureRowsSchema() {
  if (!Array.isArray(props.attr?.body)) return
  props.attr.body.forEach((row) => normalizeRow(row))
}

function normalizeRow(row) {
  if (!row || typeof row !== 'object') return
  if (!Array.isArray(row.peligros) || row.peligros.length === 0) {
    row.peligros = [
      {
        peligro: String(row.peligro ?? '').trim(),
        riesgos: [{ riesgo: String(row.riesgo ?? '').trim() }]
      }
    ]
  }

  row.peligros.forEach((p) => {
    if (!p || typeof p !== 'object') return
    if (!Array.isArray(p.riesgos) || p.riesgos.length === 0) {
      p.riesgos = [blankRiesgo()]
    } else {
      p.riesgos = p.riesgos.map((r) => {
        if (typeof r === 'string') return { riesgo: r }
        return { riesgo: String(r?.riesgo ?? '') }
      })
    }
    p.peligro = String(p.peligro ?? '')
  })

  recalcPonderacion(row)
  syncLegacyFields(row)
}

function normalizeScore(v) {
  const val = String(v ?? '').trim()
  return scoreOptions.includes(val) ? val : ''
}

function recalcPonderacion(row) {
  if (!row || typeof row !== 'object') return
  row.po = normalizeScore(row.po)
  row.cp = normalizeScore(row.cp)
  row.ponderacion = row.po && row.cp ? String(Number(row.po) * Number(row.cp)) : ''
}

function onScoreChanged(row) {
  recalcPonderacion(row)
  touch()
}

function syncLegacyFields(row) {
  const primerPeligro = row?.peligros?.[0]
  row.peligro = String(primerPeligro?.peligro ?? '')
  row.riesgo = String(primerPeligro?.riesgos?.[0]?.riesgo ?? '')
}

function add() {
  if (!Array.isArray(props.attr.body)) props.attr.body = []
  props.attr.body.push(blankRow())
  touch()
}

function remove(idx) {
  if (!Array.isArray(props.attr.body)) props.attr.body = []
  props.attr.body.splice(idx, 1)
  touch()
}

function addPeligro(row) {
  normalizeRow(row)
  row.peligros.push(blankPeligro())
  touchRow(row)
}

function removePeligro(row, pIdx) {
  normalizeRow(row)
  if (row.peligros.length <= 1) return
  row.peligros.splice(pIdx, 1)
  touchRow(row)
}

function addRiesgo(peligro, row) {
  if (!Array.isArray(peligro.riesgos)) peligro.riesgos = []
  peligro.riesgos.push(blankRiesgo())
  touchRow(row)
}

function removeRiesgo(peligro, rIdx, row) {
  if (!Array.isArray(peligro.riesgos) || peligro.riesgos.length <= 1) return
  peligro.riesgos.splice(rIdx, 1)
  touchRow(row)
}

function touchRow(row) {
  syncLegacyFields(row)
  touch()
}

function touch() {
  props.attr.__touched = Date.now()
  emit('change')
}
</script>

<style scoped>
.danger-risk-wrap {
  border-color: #cbd5e1 !important;
  background: #f8fafc;
}
</style>
