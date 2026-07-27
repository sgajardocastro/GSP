<template>
  <div class="izaje-checklist">
    <div class="section-list">
      <section
        v-for="group in checklistGroups"
        :key="group.key"
        class="section-group"
      >
        <button type="button" class="section-title" @click="toggleGroup(group.key)">
          <span>{{ group.title }}</span>
          <v-icon :icon="isGroupOpen(group.key) ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="18" />
        </button>

        <div v-show="isGroupOpen(group.key)" class="section-body">
          <div class="condition-grid">
            <article
              v-for="item in group.items"
              :key="item.code"
              class="condition-card"
            >
              <div class="condition-title">
                <span class="check-code">{{ item.code }}</span>
                <span>{{ item.label }}</span>
              </div>

              <div class="state-buttons">
                <button
                  v-for="state in states"
                  :key="`${item.code}-${state.value}`"
                  type="button"
                  :disabled="disabled"
                  :class="['state-toggle', getChecklistValue(item.code, 'cumplimiento') === state.value ? `state-toggle--${state.value}` : '']"
                  @click="setChecklistValue(item.code, 'cumplimiento', state.value)"
                >
                  {{ state.label }}
                </button>
              </div>

              <v-textarea
                :model-value="getChecklistValue(item.code, 'situacion')"
                label="Situacion detectada / condicion subestandar"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setChecklistValue(item.code, 'situacion', value)"
              />

              <v-textarea
                :model-value="getChecklistValue(item.code, 'medidas')"
                label="Medidas correctivas"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setChecklistValue(item.code, 'medidas', value)"
              />
            </article>
          </div>
        </div>
      </section>
    </div>

    <section class="izaje-section">
      <div class="section-head">
        <div>
          <div class="section-kicker">FOR-SGI-CDMH-01-SST-011</div>
          <h3>Elementos de izaje</h3>
        </div>
      </div>

      <article
        v-for="(item, index) in elementos"
        :key="item.id"
        class="entry-card"
      >
        <div class="entry-head">
          <strong>Elemento {{ index + 1 }}</strong>
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="tonal"
            color="error"
            class="delete-btn"
            :disabled="disabled"
            @click="removeElemento(item)"
          />
        </div>

        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              :model-value="item.descripcion"
              label="Describa elemento de izaje"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setElemento(item, 'descripcion', value)"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              :model-value="item.codigoInterno"
              label="Codigo interno"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setElemento(item, 'codigoInterno', value)"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              :model-value="item.colorMes"
              label="Color del mes"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setElemento(item, 'colorMes', value)"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-textarea
              :model-value="item.observacion"
              label="Observacion"
              variant="outlined"
              density="compact"
              rows="1"
              auto-grow
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setElemento(item, 'observacion', value)"
            />
          </v-col>
        </v-row>
      </article>

      <div v-if="elementos.length === 0" class="empty-state">
        Sin elementos registrados.
      </div>

      <div class="add-row">
        <v-btn
          size="small"
          variant="tonal"
          color="success"
          prepend-icon="mdi-plus"
          :disabled="disabled"
          @click="addElemento"
        >
          Agregar elemento
        </v-btn>
      </div>
    </section>

    <section class="izaje-section">
      <div class="section-head">
        <div>
          <div class="section-kicker">Registro de fallas</div>
          <h3>Fallas</h3>
        </div>
      </div>

      <article
        v-for="(item, index) in fallas"
        :key="item.id"
        class="entry-card"
      >
        <div class="entry-head">
          <strong>Falla {{ index + 1 }}</strong>
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="tonal"
            color="error"
            class="delete-btn"
            :disabled="disabled"
            @click="removeFalla(item)"
          />
        </div>

        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              :model-value="item.codigoFalla"
              label="Codigo de falla"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setFalla(item, 'codigoFalla', value)"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              :model-value="item.fechaDeteccion"
              type="date"
              label="Fecha deteccion"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setFalla(item, 'fechaDeteccion', normalizeDate(value))"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              :model-value="item.fechaReparacion"
              type="date"
              label="Fecha reparacion"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setFalla(item, 'fechaReparacion', normalizeDate(value))"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-textarea
              :model-value="item.observacion"
              label="Observacion"
              variant="outlined"
              density="compact"
              rows="1"
              auto-grow
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setFalla(item, 'observacion', value)"
            />
          </v-col>
        </v-row>
      </article>

      <div v-if="fallas.length === 0" class="empty-state">
        Sin fallas registradas.
      </div>

      <div class="add-row">
        <v-btn
          size="small"
          variant="tonal"
          color="success"
          prepend-icon="mdi-plus"
          :disabled="disabled"
          @click="addFalla"
        >
          Agregar falla
        </v-btn>
      </div>
    </section>
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
const openGroups = ref({})

const states = [
  { value: 'si', label: 'SI' },
  { value: 'no', label: 'NO' },
  { value: 'na', label: 'N/A' }
]

const checklistGroups = [
  {
    key: 'eslingas',
    cdf: '1.',
    title: 'ESLINGAS',
    items: [
      { code: '1.1', label: '¿Eslingas presentan desgastes?' },
      { code: '1.2', label: '¿Eslinga presenta estiramiento o alargamiento?' },
      { code: '1.3', label: '¿Eslinga presenta picaduras?' },
      { code: '1.4', label: '¿Etiqueta o sello de certificación se encuentran en buen estado?' },
      { code: '1.5', label: '¿Eslingas se encuentran expuestas a temperaturas extremas?' }
    ]
  },
  {
    key: 'fajas',
    cdf: '2',
    title: 'FAJAS',
    items: [
      { code: '2.1', label: '¿Fajas presentan desgaste?' },
      { code: '2.2', label: '¿Fajas presentan estiramiento o alargamiento?' },
      { code: '2.3', label: '¿Fajas presentan picaduras?' },
      { code: '2.4', label: '¿Etiqueta o sello de certificación se encuentran en buen estado?' }
    ]
  },
  {
    key: 'grilletes',
    cdf: '3',
    title: 'GRILLETES',
    items: [
      { code: '3.1', label: '¿Grilletes presentan desgaste?' },
      { code: '3.2', label: '¿Grilletes presentan corrosión?' },
      { code: '3.3', label: '¿Grilletes presentan falta de lubricación? (sequedad)' },
      { code: '3.4', label: '¿Grilletes presentan torcimiento?' },
      { code: '3.5', label: '¿Grilletes presentan abuso mecánico?' },
      { code: '3.6', label: '¿Pasador de grillete se encuentra en buen estado?' },
      { code: '3.7', label: '¿Etiqueta o sello de certificación se encuentran en buen estado?' }
    ]
  },
  {
    key: 'cadenas',
    cdf: '4',
    title: 'CADENAS',
    items: [
      { code: '4.1', label: '¿Cadena presenta desgaste?' },
      { code: '4.2', label: '¿Cadena presenta corrosión?' },
      { code: '4.3', label: '¿Cadena presenta falta de lubricación?' },
      { code: '4.4', label: '¿Cadena presenta torcimiento?' },
      { code: '4.5', label: '¿Cadena presenta ruptura de gancho y eslabón?' },
      { code: '4.6', label: '¿Cadena se encuentra expuesta a temperaturas extremas?' },
      { code: '4.7', label: '¿Etiqueta o sello de certificación se encuentran en buen estado?' },
      { code: '4.8', label: '¿Cadena presentan abuso mecánico?' }
    ]
  }
]

const elementos = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value.elementos) ? attrRef.value.elementos : []
})

const fallas = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value.fallas) ? attrRef.value.fallas : []
})

onMounted(() => {
  ensureBody()
  checklistGroups.forEach((group) => {
    openGroups.value[group.key] = true
  })
})

function ensureBody(withDefaults = true) {
  if (!attrRef.value.checklist || typeof attrRef.value.checklist !== 'object') {
    attrRef.value.checklist = {}
  }
  checklistGroups.forEach((group) => {
    group.items.forEach((item) => {
      attrRef.value.checklist[item.code] = normalizeChecklistRow(attrRef.value.checklist[item.code])
    })
  })

  if (!Array.isArray(attrRef.value.elementos)) {
    attrRef.value.elementos = []
  }
  if (!Array.isArray(attrRef.value.fallas)) {
    attrRef.value.fallas = []
  }

  attrRef.value.elementos = attrRef.value.elementos.map(normalizeElemento)
  attrRef.value.fallas = attrRef.value.fallas.map(normalizeFalla)

  if (withDefaults) {
    if (attrRef.value.elementos.length === 0) attrRef.value.elementos.push(createElemento())
    if (attrRef.value.fallas.length === 0) attrRef.value.fallas.push(createFalla())
  }
}

function normalizeChecklistRow(row) {
  return {
    cumplimiento: ['si', 'no', 'na'].includes(String(row?.cumplimiento ?? '').trim().toLowerCase())
      ? String(row.cumplimiento).trim().toLowerCase()
      : '',
    situacion: String(row?.situacion ?? ''),
    medidas: String(row?.medidas ?? '')
  }
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createElemento() {
  return {
    id: uid('elemento-izaje'),
    descripcion: '',
    codigoInterno: '',
    colorMes: '',
    observacion: ''
  }
}

function createFalla() {
  return {
    id: uid('falla-izaje'),
    codigoFalla: '',
    fechaDeteccion: '',
    fechaReparacion: '',
    observacion: ''
  }
}

function normalizeElemento(item) {
  return {
    ...createElemento(),
    ...item,
    id: item?.id || uid('elemento-izaje'),
    descripcion: String(item?.descripcion ?? ''),
    codigoInterno: String(item?.codigoInterno ?? ''),
    colorMes: String(item?.colorMes ?? ''),
    observacion: String(item?.observacion ?? '')
  }
}

function normalizeFalla(item) {
  return {
    ...createFalla(),
    ...item,
    id: item?.id || uid('falla-izaje'),
    codigoFalla: String(item?.codigoFalla ?? ''),
    fechaDeteccion: normalizeDate(item?.fechaDeteccion),
    fechaReparacion: normalizeDate(item?.fechaReparacion),
    observacion: String(item?.observacion ?? '')
  }
}

function normalizeDate(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return raw
  const local = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  if (local) return `${local[3]}-${local[2]}-${local[1]}`
  return ''
}

function changed() {
  renderTick.value += 1
  emit('change')
}

function isGroupOpen(groupKey) {
  return openGroups.value[groupKey] !== false
}

function toggleGroup(groupKey) {
  openGroups.value[groupKey] = !isGroupOpen(groupKey)
}

function getChecklistValue(code, key) {
  renderTick.value
  const row = attrRef.value.checklist?.[code]
  return row?.[key] || ''
}

function setChecklistValue(code, key, value) {
  if (props.disabled) return
  ensureBody(false)
  if (!attrRef.value.checklist[code]) attrRef.value.checklist[code] = normalizeChecklistRow({})
  const nextValue = key === 'cumplimiento' && attrRef.value.checklist[code][key] === value ? '' : value
  attrRef.value.checklist[code][key] = nextValue || ''
  changed()
}

function setElemento(item, key, value) {
  if (props.disabled || !item) return
  ensureBody(false)
  item[key] = value || ''
  changed()
}

function setFalla(item, key, value) {
  if (props.disabled || !item) return
  ensureBody(false)
  item[key] = value || ''
  changed()
}

function addElemento() {
  if (props.disabled) return
  ensureBody(false)
  attrRef.value.elementos.push(createElemento())
  changed()
}

function addFalla() {
  if (props.disabled) return
  ensureBody(false)
  attrRef.value.fallas.push(createFalla())
  changed()
}

function removeElemento(item) {
  if (props.disabled) return
  ensureBody(false)
  const index = attrRef.value.elementos.findIndex((current) => current.id === item.id)
  if (index >= 0) attrRef.value.elementos.splice(index, 1)
  changed()
}

function removeFalla(item) {
  if (props.disabled) return
  ensureBody(false)
  const index = attrRef.value.fallas.findIndex((current) => current.id === item.id)
  if (index >= 0) attrRef.value.fallas.splice(index, 1)
  changed()
}
</script>

<style scoped>
.izaje-checklist {
  display: grid;
  gap: 12px;
  width: 100%;
}

.izaje-section {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.18);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.section-kicker {
  color: #93c5fd;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
}

.section-head h3 {
  margin: 2px 0 0;
  color: #f8fafc;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.15;
}

.section-list {
  display: grid;
  gap: 8px;
}

.section-group {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.2);
}

.section-title {
  width: 100%;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border: 0;
  background: rgba(30, 41, 59, 0.72);
  color: #e5e7eb;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-align: left;
}

.section-body {
  padding: 8px;
}

.condition-grid {
  display: grid;
  gap: 8px;
}

.condition-card {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.55);
  border-radius: 7px;
  background: rgba(15, 23, 42, 0.3);
}

.condition-title {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
}

.state-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
}

.entry-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(250, 204, 21, 0.5);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.22);
}

.check-code {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  border-radius: 7px;
  background: rgba(15, 23, 42, 0.5);
  color: #fde68a;
  font-size: 12px;
  font-weight: 900;
}

.state-toggle {
  min-height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  background: rgba(71, 85, 105, 0.32);
  color: #dbeafe;
  font-size: 11px;
  font-weight: 900;
}

.state-toggle--si {
  background: rgba(6, 95, 70, 0.52);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.state-toggle--no {
  background: rgba(127, 29, 29, 0.45);
  border-color: rgba(239, 68, 68, 0.72);
  color: #fee2e2;
}

.state-toggle--na {
  background: rgba(30, 64, 175, 0.48);
  border-color: rgba(96, 165, 250, 0.72);
  color: #dbeafe;
}

.entry-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.entry-head strong {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
}

.delete-btn {
  background: rgba(220, 38, 38, 0.26) !important;
  border: 1px solid rgba(248, 113, 113, 0.65);
  color: #fecaca !important;
}

.delete-btn :deep(.v-icon) {
  color: #fecaca !important;
  opacity: 1;
}

.empty-state {
  min-height: 38px;
  display: grid;
  place-items: center;
  border: 1px dashed rgba(148, 163, 184, 0.42);
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
}

.add-row {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 600px) {
  .izaje-section {
    padding: 10px;
  }

  .add-row {
    justify-content: stretch;
  }

  .add-row :deep(.v-btn) {
    width: 100%;
  }
}
</style>
