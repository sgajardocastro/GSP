<template>
  <div class="checklist-eslingas">
    <v-expansion-panels v-model="openSections" multiple class="esl-panels">
      <v-expansion-panel value="descripcion" class="esl-card">
        <v-expansion-panel-title class="esl-title">
          DATOS DE LA ESLINGA TUBULAR
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense>
            <v-col cols="12" sm="4">
              <v-text-field
                :model-value="getDescripcion('largo')"
                label="LARGO"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDescripcion('largo', value)"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                :model-value="getDescripcion('factorSeguridad')"
                label="FACTOR DE SEGURIDAD"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDescripcion('factorSeguridad', value)"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                :model-value="getDescripcion('cargaSeguraTrabajo')"
                label="CARGA SEGURA DE TRABAJO (SWL)"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDescripcion('cargaSeguraTrabajo', value)"
              />
            </v-col>
          </v-row>

          <div class="esl-images">
            <div
              v-for="image in images"
              :key="image.src"
              class="esl-image-wrap"
            >
              <img
                :src="image.src"
                :alt="image.alt"
                class="esl-image"
              />
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="condiciones" class="esl-card">
        <v-expansion-panel-title class="esl-title">
          CONDICION A INSPECCIONAR
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div
            v-for="item in items"
            :key="item.id"
            class="item-card"
          >
            <div class="item-question">
              <span class="item-number">{{ item.numero }}.</span>
              <span>{{ item.label }}</span>
            </div>

            <div class="state-row">
              <button
                type="button"
                :disabled="disabled"
                :class="['state-toggle', item.estado === 'si' ? 'state-toggle--si' : '']"
                @click="setEstado(item, 'si')"
              >
                SI
              </button>
              <button
                type="button"
                :disabled="disabled"
                :class="['state-toggle', item.estado === 'no' ? 'state-toggle--no' : '']"
                @click="setEstado(item, 'no')"
              >
                NO
              </button>
            </div>

            <v-textarea
              :model-value="item.comentarios"
              label="Comentarios"
              variant="outlined"
              density="compact"
              rows="1"
              auto-grow
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setComentarios(item, value)"
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="desviaciones" class="esl-card">
        <v-expansion-panel-title class="esl-title">
          DESVIACIONES DETECTADAS
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="deviation-actions">
            <v-btn
              size="small"
              variant="tonal"
              color="success"
              prepend-icon="mdi-plus"
              :disabled="disabled"
              @click="addDesviacion"
            >
              Agregar
            </v-btn>
          </div>

          <div
            v-for="row in desviaciones"
            :key="row.id"
            class="deviation-card"
          >
            <div class="deviation-head">
              <div class="deviation-number">Item {{ row.item }}</div>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="tonal"
                color="error"
                class="delete-btn"
                :disabled="disabled || desviaciones.length <= 1"
                @click="removeDesviacion(row)"
              />
            </div>
            <v-textarea
              :model-value="row.desviacion"
              label="Desviaciones detectadas"
              variant="outlined"
              density="compact"
              rows="1"
              auto-grow
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setDesviacion(row, 'desviacion', value)"
            />
            <v-textarea
              :model-value="row.accionCorrectiva"
              label="Accion correctiva"
              variant="outlined"
              density="compact"
              rows="1"
              auto-grow
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setDesviacion(row, 'accionCorrectiva', value)"
            />
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="row.responsable"
                  label="RESPONSABLE"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  @update:model-value="(value) => setDesviacion(row, 'responsable', value)"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="row.fechaEjecucion"
                  type="date"
                  label="FECHA DE EJECUCION"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  @update:model-value="(value) => setDesviacion(row, 'fechaEjecucion', normalizeDate(value))"
                />
              </v-col>
            </v-row>
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
const openSections = ref(['descripcion', 'condiciones', 'desviaciones'])

const baseItems = [
  { numero: 1, label: 'Existen cortes en la funda de la eslinga tubular u otro dano similar?' },
  { numero: 2, label: 'Existen abrasiones concretas, distintas de un desgaste general causadas por cargas con bordes agudos o vivos?' },
  { numero: 3, label: 'Con un uso normal, se produce un frotamiento interno de las fibras superficiales debajo de la funda. Si esta abrasion se intensifica, los danos aparecen. Existe esta condicion?' },
  { numero: 4, label: 'Existen nudos en cualquier parte de la eslinga? Los nudos reducen la capacidad de carga de 25 a 100%.' },
  { numero: 5, label: 'Existen agujeros, roturas, particulas incrustadas, deshilachada o cortes en la funda?' },
  { numero: 6, label: 'Existen cortes en cruz, longitudinales o danos por rozadura en los bordes de la eslinga?' },
  { numero: 7, label: 'Existe presencia de quemaduras acidas o alcalinas, soda caustica? El quimico produce un debilitamiento general del material de la eslinga.' },
  { numero: 9, label: 'La etiqueta de identificacion se ha perdido o es ilegible?' },
  { numero: 10, label: 'Los ganchos o conectores demasiado grandes para el borde de la eslinga pueden causar danos y destruir la eslinga?' },
  { numero: 11, label: 'El calor o la friccion quedan marcados en la funda con un tono esmaltado caracteristico y, en caso extremo, la fusion de las fibras interiores puede provocar su debilitamiento. Existe esta condicion?' },
  { numero: 12, label: 'Dano por calor, derretimiento o chispa de soldadura en cualquier parte de la eslinga?' },
  { numero: 13, label: 'Decolorada, quebradiza o zonas tiesas por luz solar, U.V. o quimico?' },
  { numero: 14, label: 'Inspeccion mensual. Color del mes' }
]

const images = computed(() => {
  const base = process.env.BASE_URL || '/'
  return [
    {
      src: `${base}checklist-assets/eslingas/eslinga-tubular.jpeg`,
      alt: 'Eslinga tubular'
    },
    {
      src: `${base}checklist-assets/eslingas/danos-eslinga.jpeg`,
      alt: 'Danos en eslinga tubular'
    },
    {
      src: `${base}checklist-assets/eslingas/colores-eslingas.jpeg`,
      alt: 'Colores de eslingas tubulares'
    }
  ]
})

const items = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value?.condiciones) ? attrRef.value.condiciones : []
})

const desviaciones = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value?.desviaciones) ? attrRef.value.desviaciones : []
})

onMounted(() => {
  ensureBody()
})

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
  if (!attrRef.value.descripcion || typeof attrRef.value.descripcion !== 'object') {
    attrRef.value.descripcion = {}
  }
  attrRef.value.descripcion = {
    "largo": String(attrRef.value.descripcion.largo ?? ''),
    "factorSeguridad": String(attrRef.value.descripcion.factorSeguridad ?? ''),
    "cargaSeguraTrabajo": String(attrRef.value.descripcion.cargaSeguraTrabajo ?? '')
  }

  const savedItems = Array.isArray(attrRef.value.condiciones) ? attrRef.value.condiciones : []
  attrRef.value.condiciones = baseItems.map((base, index) => {
    const saved = savedItems.find((item) => Number(item?.numero) === base.numero) || savedItems[index] || {}
    const estado = normalizeEstado(saved.estado)
    return {
      "id": saved.id || `esl-${base.numero}`,
      "numero": base.numero,
      "label": saved.label || base.label,
      "estado": estado || 'no',
      "comentarios": String(saved.comentarios ?? '')
    }
  })

  const savedDesviaciones = Array.isArray(attrRef.value.desviaciones) ? attrRef.value.desviaciones : []
  attrRef.value.desviaciones = (savedDesviaciones.length > 0 ? savedDesviaciones : [createEmptyDesviacion(1)])
    .map((saved, index) => normalizeDesviacion(saved, index + 1))

  renderTick.value += 1
}

function createEmptyDesviacion(item) {
  return {
    "id": `desv-${Date.now()}-${item}`,
    "item": item,
    "desviacion": "",
    "accionCorrectiva": "",
    "responsable": "",
    "fechaEjecucion": ""
  }
}

function normalizeDesviacion(saved, item) {
  return {
    "id": saved.id || `desv-${Date.now()}-${item}`,
    "item": item,
    "desviacion": String(saved.desviacion ?? ''),
    "accionCorrectiva": String(saved.accionCorrectiva ?? ''),
    "responsable": String(saved.responsable ?? ''),
    "fechaEjecucion": normalizeDate(saved.fechaEjecucion)
  }
}

function renumberDesviaciones() {
  if (!Array.isArray(attrRef.value.desviaciones)) attrRef.value.desviaciones = []
  attrRef.value.desviaciones.forEach((row, index) => {
    row.item = index + 1
  })
}

function normalizeEstado(value) {
  const state = String(value ?? '').trim().toLowerCase()
  return state === 'si' || state === 'no' ? state : ''
}

function getDescripcion(key) {
  renderTick.value
  if (!attrRef.value.descripcion || typeof attrRef.value.descripcion !== 'object') {
    attrRef.value.descripcion = {}
  }
  return attrRef.value.descripcion[key] || ''
}

function setDescripcion(key, value) {
  if (!attrRef.value.descripcion || typeof attrRef.value.descripcion !== 'object') {
    attrRef.value.descripcion = {}
  }
  attrRef.value.descripcion[key] = value || ''
  renderTick.value += 1
  emit('change')
}

function setEstado(item, value) {
  if (props.disabled || !item) return
  item.estado = item.estado === value ? '' : value
  renderTick.value += 1
  emit('change')
}

function setComentarios(item, value) {
  if (!item) return
  item.comentarios = value || ''
  renderTick.value += 1
  emit('change')
}

function setDesviacion(row, key, value) {
  if (!row) return
  row[key] = value || ''
  renderTick.value += 1
  emit('change')
}

function addDesviacion() {
  if (props.disabled) return
  if (!Array.isArray(attrRef.value.desviaciones)) attrRef.value.desviaciones = []
  attrRef.value.desviaciones.push(createEmptyDesviacion(attrRef.value.desviaciones.length + 1))
  renumberDesviaciones()
  renderTick.value += 1
  emit('change')
}

function removeDesviacion(row) {
  if (props.disabled || !Array.isArray(attrRef.value.desviaciones) || attrRef.value.desviaciones.length <= 1) return
  const index = attrRef.value.desviaciones.findIndex((item) => item.id === row.id)
  if (index < 0) return
  attrRef.value.desviaciones.splice(index, 1)
  renumberDesviaciones()
  renderTick.value += 1
  emit('change')
}
</script>

<style scoped>
.checklist-eslingas {
  width: 100%;
}

.esl-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  width: 100%;
}

.esl-panels :deep(.v-expansion-panel),
.esl-panels :deep(.v-expansion-panel-title),
.esl-panels :deep(.v-expansion-panel-text) {
  width: 100%;
  max-width: none;
}

.esl-card {
  width: 100%;
  max-width: none !important;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  overflow: hidden;
}

.esl-title {
  min-height: 46px;
  padding: 10px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  white-space: normal;
}

.esl-images {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  margin-top: 12px;
}

.esl-image-wrap {
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  background: #fff;
}

.esl-image {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  height: auto;
  object-fit: contain;
}

.item-card,
.deviation-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.2);
}

.deviation-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  margin-bottom: 10px;
}

.deviation-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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

.item-card:last-child,
.deviation-card:last-child {
  border-bottom: none;
}

.item-question {
  display: flex;
  gap: 6px;
  color: #e5eefb;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
}

.item-number {
  flex: 0 0 auto;
}

.state-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.state-toggle {
  min-height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  background: rgba(71, 85, 105, 0.36);
  color: #dbeafe;
  font-size: 11px;
  font-weight: 900;
}

.state-toggle--si {
  background: rgba(6, 95, 70, 0.5);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.state-toggle--no {
  background: rgba(127, 29, 29, 0.42);
  border-color: rgba(239, 68, 68, 0.65);
  color: #fee2e2;
}

.deviation-number {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
}
</style>
