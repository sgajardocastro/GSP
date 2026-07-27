<template>
  <div>
    <v-alert type="info" variant="tonal" density="compact" class="mb-2">
      Puedes agregar una o mas tarjetas con observaciones, recomendaciones y fotos.
    </v-alert>

    <div v-if="!rows.length" class="text-center mb-3">
      <v-btn color="primary" variant="tonal" @click="add()">
        <v-icon class="mr-2" icon="mdi-plus" />
        Agregar primera tarjeta
      </v-btn>
    </div>

    <div v-for="(it, idx) in rows" :key="'maobs-' + idx" class="mb-4">
      <v-card variant="outlined" class="rounded-lg">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="text-subtitle-2 font-weight-bold">
            {{ `Tarjeta ${idx + 1}` }}
          </div>

          <v-btn icon size="x-small" @click="remove(idx)" color="red" title="Eliminar tarjeta">
            <v-icon icon="mdi-delete-outline" />
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-0">
          <v-table density="compact" class="tabla-maobs">
            <tbody>
              <tr>
                <td class="campo-col">
                  <div class="field-block pt-2">
                    <v-textarea
                      v-model="it.observaciones"
                      label="Observaciones"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="bg-white"
                      auto-grow
                      rows="2"
                      @update:model-value="touch()"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td class="campo-col">
                  <div class="field-block pt-2">
                    <v-textarea
                      v-model="it.recomendaciones"
                      label="Recomendaciones"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="bg-white"
                      auto-grow
                      rows="2"
                      @update:model-value="touch()"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td class="campo-col">
                  <div class="photo-block">
                    <div class="photo-title">Fotos o galeria (max. {{ maxFotos }})</div>

                    <FotoCapture
                      :max-fotos="maxFotos"
                      :obligatorio-fotos="0"
                      :compression="compression"
                      :show-observacion="false"
                      v-model:galeria="it.galeria"
                      v-model:observacion="it.fotoObs"
                      @update:galeria="touch()"
                      @update:observacion="touch()"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td class="campo-col text-center">
                  <v-btn icon size="x-small" color="green" @click="add()" title="Agregar tarjeta">
                    <v-icon icon="mdi-plus" />
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable vue/no-mutating-props */
import { computed, watch } from 'vue'
import FotoCapture from '@/components/FotoCapture.vue'

const props = defineProps({
  attr: { type: Object, required: true }
})

watch(
  () => props.attr,
  (a) => {
    if (!a) return
    if (!Array.isArray(a.body)) a.body = []
  },
  { immediate: true, deep: false }
)

const rows = computed(() => (Array.isArray(props.attr?.body) ? props.attr.body : []))

const compression = computed(() => {
  const c = Number(props.attr?.compression ?? 0.25)
  return Number.isFinite(c) ? c : 0.25
})

const maxFotos = computed(() => {
  const n = Number(props.attr?.maxFotos ?? 3)
  return Number.isFinite(n) && n > 0 ? n : 3
})

function blankRow () {
  return {
    observaciones: '',
    recomendaciones: '',
    galeria: [],
    fotoObs: ''
  }
}

function add () {
  if (!Array.isArray(props.attr.body)) props.attr.body = []
  props.attr.body.push(blankRow())
  touch()
}

function remove (idx) {
  if (!Array.isArray(props.attr.body)) props.attr.body = []
  props.attr.body.splice(idx, 1)
  touch()
}

function touch () {
  props.attr.__touched = Date.now()
}
</script>

<style scoped>
.tabla-maobs {
  border: 1px solid #d7dde3;
}

.tabla-maobs td {
  border-bottom: 1px solid #e3e7eb;
  vertical-align: top;
  padding: 12px;
}

.campo-col {
  background: #ffffff;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.photo-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.photo-title {
  font-weight: 700;
  color: #1f2937;
}
</style>
