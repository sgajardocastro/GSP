<template>
  <div class="cbi-wrap">
    <v-card
      v-for="(block, bIdx) in normalizedBlocks"
      :key="'cbi-block-' + bIdx"
      class="cbi-block"
      variant="outlined"
    >
      <div class="cbi-title-row">
        <div class="cbi-title">
          {{ block.title }}
        </div>
        <v-btn
          icon
          size="small"
          variant="text"
          class="cbi-collapse-btn"
          :disabled="disabled"
          @click="toggleBlock(bIdx)"
        >
          <v-icon>{{ isBlockCollapsed(bIdx) ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
        </v-btn>
      </div>

      <div v-show="!isBlockCollapsed(bIdx)">
        <div
          v-for="(item, iIdx) in block.items"
          :key="'cbi-item-' + bIdx + '-' + iIdx"
          class="cbi-item"
        >
          <div class="cbi-row-top">
            <div class="cbi-q">
              <span class="cbi-num">{{ item.numero }}.</span>
              <span class="cbi-text">{{ item.pregunta }}</span>
            </div>

            <v-btn-toggle
              v-model="item.estado"
              class="cbi-toggle"
              density="compact"
              divided
              :disabled="disabled"
              @update:modelValue="emitChange"
            >
              <v-btn value="SI" size="small">SI</v-btn>
              <v-btn value="NO" size="small">NO</v-btn>
              <v-btn value="NA" size="small">N.A.</v-btn>
            </v-btn-toggle>
          </div>

          <div class="cbi-row-bottom">
            <v-text-field
              v-model="item.observacion"
              label="Observación"
              density="compact"
              variant="outlined"
              hide-details
              :disabled="disabled"
              @update:modelValue="emitChange"
            />
            <v-text-field
              v-model="item.fechaCorreccion"
              label="Fecha Corrección"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              :disabled="disabled"
              @update:modelValue="emitChange"
            />
          </div>
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
  if (!item || typeof item !== 'object') return {
    numero: idx + 1,
    pregunta: '',
    estado: '',
    observacion: '',
    fechaCorreccion: ''
  }

  item.numero = item.numero ?? (idx + 1)
  item.pregunta = item.pregunta ?? ''
  item.estado = (item.estado ?? '').toString().toUpperCase()
  if (!['SI', 'NO', 'NA', ''].includes(item.estado)) item.estado = ''
  item.observacion = item.observacion ?? ''
  item.fechaCorreccion = item.fechaCorreccion ?? ''
  return item
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
.cbi-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cbi-block {
  padding: 10px;
}

.cbi-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid #d6dbe6;
  padding-bottom: 6px;
  margin-bottom: 8px;
}

.cbi-title {
  font-weight: 700;
  text-transform: uppercase;
}

.cbi-collapse-btn {
  flex: 0 0 auto;
}

.cbi-item {
  border-bottom: 1px dashed #d6dbe6;
  padding: 8px 0;
}

.cbi-item:last-child {
  border-bottom: 0;
}

.cbi-row-top {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.cbi-q {
  display: flex;
  gap: 6px;
  min-width: 0;
  background: #f6f8fc;
  border: 1px solid #e2e8f4;
  border-radius: 8px;
  padding: 6px 8px;
}

.cbi-num {
  font-weight: 700;
  min-width: 22px;
}

.cbi-text {
  font-size: 0.96rem;
  font-weight: 500;
  line-height: 1.25;
  word-break: break-word;
}

.cbi-toggle :deep(.v-btn) {
  min-width: 54px;
}

.cbi-row-bottom {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 10px;
}

@media (max-width: 800px) {
  .cbi-row-top {
    grid-template-columns: 1fr;
  }

  .cbi-row-bottom {
    grid-template-columns: 1fr;
  }
}
</style>
