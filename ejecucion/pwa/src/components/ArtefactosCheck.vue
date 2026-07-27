<template>
  <div class="artefactos-check py-2">
    <v-card
      v-for="(grupo, gIdx) in grupos"
      :key="`grupo-${gIdx}`"
      class="mb-3"
      variant="outlined"
    >
      <v-card-title class="text-subtitle-2 font-weight-bold py-2">
        {{ grupo.label }}
      </v-card-title>

      <v-card-text class="pt-1">
        <v-table density="compact" class="artefactos-table">
          <thead>
            <tr>
              <th>Artefacto</th>
              <th class="text-center">Si / No</th>
              <th class="text-center">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, iIdx) in grupo.items" :key="`item-${gIdx}-${iIdx}`">
              <td class="font-weight-medium">{{ item.label }}</td>
              <td class="text-center">
                <v-btn-toggle
                  v-model="item.respuesta"
                  mandatory
                  density="compact"
                  @update:model-value="(val) => onRespuestaChange(item, val)"
                >
                  <v-btn value="SI" size="small">Si</v-btn>
                  <v-btn value="NO" size="small">No</v-btn>
                </v-btn-toggle>
              </td>
              <td class="text-center" style="max-width: 140px;">
                <v-text-field
                  v-model="item.cantidad"
                  type="number"
                  min="0"
                  density="compact"
                  variant="underlined"
                  hide-details
                  placeholder="0"
                  :disabled="item.respuesta !== 'SI'"
                  @update:model-value="touch"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
/* eslint-disable vue/no-mutating-props */
import { computed, onMounted } from 'vue'

const props = defineProps({
  attr: { type: Object, required: true }
})

const ITEMS_BASE = ['Calefont', 'Caldera', 'Cocina', 'Encimera', 'Secadora', 'Otros']

const grupos = computed(() => {
  if (!Array.isArray(props.attr?.groups)) return []
  return props.attr.groups
})

function normalizeRespuesta(value) {
  const v = (value ?? '').toString().trim().toUpperCase()
  return v === 'SI' ? 'SI' : 'NO'
}

function normalizeCantidad(value) {
  if (value === '' || value === null || value === undefined) return ''
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return ''
  return String(Math.trunc(n))
}

function buildDefaultGroup(label) {
  return {
    label,
    items: ITEMS_BASE.map((itemLabel) => ({
      label: itemLabel,
      respuesta: 'NO',
      cantidad: ''
    }))
  }
}

function ensureShape() {
  if (!Array.isArray(props.attr.groups) || !props.attr.groups.length) {
    props.attr.groups = [
      buildDefaultGroup('Conversión de Artefactos'),
      buildDefaultGroup('Artefactos en Comodato')
    ]
    return
  }

  props.attr.groups = props.attr.groups.map((group, idx) => {
    const groupLabel = (group?.label ?? '').toString().trim() ||
      (idx === 0 ? 'Conversión de Artefactos' : 'Artefactos en Comodato')

    let items = Array.isArray(group?.items) ? group.items : []
    if (!items.length) {
      items = ITEMS_BASE.map((itemLabel) => ({
        label: itemLabel,
        respuesta: 'NO',
        cantidad: ''
      }))
    }

    items = items.map((item) => ({
      label: (item?.label ?? '').toString().trim() || 'Item',
      respuesta: normalizeRespuesta(item?.respuesta),
      cantidad: normalizeCantidad(item?.cantidad)
    }))

    return {
      ...group,
      label: groupLabel,
      items
    }
  })
}

function onRespuestaChange(item, value) {
  item.respuesta = normalizeRespuesta(value)
  if (item.respuesta !== 'SI') item.cantidad = ''
  touch()
}

function touch() {
  props.attr.__touched = Date.now()
}

onMounted(() => {
  ensureShape()
})
</script>

<style scoped>
.artefactos-table :deep(th) {
  font-size: 0.75rem;
  color: #475569;
}
</style>

