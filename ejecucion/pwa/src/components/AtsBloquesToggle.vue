<template>
  <div class="ats-wrap">
    <v-card
      v-for="(block, bIdx) in normalizedBlocks"
      :key="'ats-block-' + bIdx"
      class="ats-block"
      variant="outlined"
    >
      <div class="ats-title-row">
        <div class="ats-title">
          {{ block.title }}
        </div>
        <v-btn
          icon
          size="small"
          variant="text"
          :disabled="disabled"
          @click="toggleBlock(bIdx)"
        >
          <v-icon>{{ isBlockCollapsed(bIdx) ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
        </v-btn>
      </div>

      <div v-show="!isBlockCollapsed(bIdx)">
        <div
          v-for="(item, iIdx) in block.items"
          :key="'ats-item-' + bIdx + '-' + iIdx"
          class="ats-item"
        >
          <div class="ats-item-label">
            <span class="ats-num">{{ item.numero }}.</span>
            <span>{{ item.label }}</span>
          </div>

          <v-switch
            v-model="item.tick"
            :disabled="disabled"
            color="success"
            density="compact"
            hide-details
            inset
            @update:model-value="emitChange"
          />

          <v-text-field
            v-if="isOtrosItem(item) && item.tick"
            v-model="item.otro_texto"
            class="ats-otros-input"
            :disabled="disabled"
            label="Especificar otro"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="emitChange"
          />
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, toRef } from 'vue'

const props = defineProps({
  attr: { type: Object, required: true },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['change'])
const attr = toRef(props, 'attr')
const collapsedBlocks = ref({})

const normalizedBlocks = computed(() => {
  if (!Array.isArray(attr.value?.blocks)) return []
  return attr.value.blocks
})

function normalizeItem(item, idx) {
  if (!item || typeof item !== 'object') {
    return { numero: idx + 1, label: '', tick: false }
  }

  item.numero = item.numero ?? (idx + 1)
  item.label = item.label ?? item.pregunta ?? ''
  item.tick = Boolean(item.tick)
  item.otro_texto = item.otro_texto ?? item.detalle ?? item.observacion ?? ''
  return item
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function isOtrosItem(item) {
  const label = normalizeText(item?.label ?? item?.pregunta ?? '')
  return label.startsWith('otros')
}

function normalizeAttr() {
  if (!Array.isArray(attr.value.blocks)) attr.value.blocks = []

  attr.value.blocks = attr.value.blocks.map((block, bIdx) => {
    const next = (block && typeof block === 'object') ? block : {}
    next.title = next.title ?? `Bloque ${bIdx + 1}`
    next.items = Array.isArray(next.items) ? next.items : []
    next.items = next.items.map((item, iIdx) => normalizeItem(item, iIdx))
    return next
  })
}

function emitChange() {
  emit('change')
}

function isBlockCollapsed(index) {
  return !!collapsedBlocks.value[index]
}

function toggleBlock(index) {
  collapsedBlocks.value = {
    ...collapsedBlocks.value,
    [index]: !collapsedBlocks.value[index]
  }
}

onMounted(() => {
  normalizeAttr()
})
</script>

<style scoped>
.ats-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ats-block {
  padding: 10px;
}

.ats-title {
  font-weight: 700;
  text-transform: uppercase;
}

.ats-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid #d6dbe6;
  padding-bottom: 6px;
  margin-bottom: 8px;
}

.ats-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  border-bottom: 1px dashed #d6dbe6;
  padding: 6px 0;
}

.ats-item:last-child {
  border-bottom: 0;
}

.ats-item-label {
  display: flex;
  gap: 6px;
  min-width: 0;
}

.ats-num {
  font-weight: 700;
  min-width: 20px;
}

.ats-otros-input {
  grid-column: 1 / -1;
  margin-top: 4px;
}
</style>
