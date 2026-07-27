<template>
  <div class="checklist-arnes-seguridad-dmh">
    <v-card class="dmh-card datos-card" variant="outlined">
      <button type="button" class="dmh-title dmh-title-toggle" @click="datosOpen = !datosOpen">
        <span>DATOS GENERALES</span>
        <v-icon :icon="datosOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="18" />
      </button>
      <v-card-text v-show="datosOpen" class="datos-body">
        <v-row dense class="datos-grid">
          <v-col cols="12" sm="6">
            <v-text-field :model-value="attrRef.datos?.faenaContrato" label="Faena o contrato" variant="outlined" density="compact" hide-details :disabled="disabled" @update:model-value="(value) => setDato('faenaContrato', value)" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field :model-value="attrRef.datos?.area" label="Area" variant="outlined" density="compact" hide-details :disabled="disabled" @update:model-value="(value) => setDato('area', value)" />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field :model-value="attrRef.datos?.codigoCertArnes" label="Codigo cert. arnes" variant="outlined" density="compact" hide-details :disabled="disabled" @update:model-value="(value) => setDato('codigoCertArnes', value)" />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field :model-value="attrRef.datos?.codigoCertColas" label="Codigo cert. colas" variant="outlined" density="compact" hide-details :disabled="disabled" @update:model-value="(value) => setDato('codigoCertColas', value)" />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field :model-value="attrRef.datos?.codigoSpdcArnes" label="Codigo SPDC arnes" variant="outlined" density="compact" hide-details :disabled="disabled" @update:model-value="(value) => setDato('codigoSpdcArnes', value)" />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field :model-value="attrRef.datos?.codigoSpdcColas" label="Codigo SPDC colas" variant="outlined" density="compact" hide-details :disabled="disabled" @update:model-value="(value) => setDato('codigoSpdcColas', value)" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <div v-for="block in blocks" :key="block.uid" class="block-card">
      <div class="section-list">
        <section v-for="section in sections" :key="section.key" class="section-group">
          <button type="button" class="section-title" @click="toggleSection(section.key)">
            <span>{{ section.title }}</span>
            <v-icon :icon="isSectionOpen(section.key) ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="18" />
          </button>

          <div v-show="isSectionOpen(section.key)" class="section-body">
            <div class="condition-grid">
            <article v-for="item in section.items" :key="item.key" class="condition-card">
              <div class="condition-head">
                <div class="condition-title">{{ item.label }}</div>
                <div class="state-buttons">
                  <button
                    v-for="option in stateOptions"
                    :key="option.value"
                    type="button"
                    :class="['state-toggle', getCondition(block, item.key).estado === option.value ? `state-toggle--${option.value}` : '']"
                    :disabled="disabled"
                    @click="setConditionState(block, item.key, option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <v-textarea
                :model-value="getCondition(block, item.key).accion"
                label="Accion a realizar"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setConditionField(block, item.key, 'accion', value)"
              />

              <v-row dense>
                <v-col cols="12" md="7">
                  <v-select
                    :model-value="getCondition(block, item.key).responsableId"
                    :items="responsables"
                    item-title="label"
                    item-value="value"
                    label="Responsable"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    :disabled="disabled"
                    @update:model-value="(value) => setConditionResponsable(block, item.key, value)"
                  />
                </v-col>
                <v-col cols="12" md="5">
                  <v-text-field
                    :model-value="getCondition(block, item.key).fecha"
                    label="Fecha"
                    type="date"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :disabled="disabled"
                    @update:model-value="(value) => setConditionField(block, item.key, 'fecha', normalizeDate(value) || todayIso())"
                  />
                </v-col>
              </v-row>
            </article>
            </div>
          </div>
        </section>
      </div>

      <v-textarea
        class="mt-3"
        :model-value="block.observaciones"
        label="Observaciones"
        variant="outlined"
        density="compact"
        rows="2"
        auto-grow
        hide-details
        :disabled="disabled"
        @update:model-value="(value) => setBlockField(block, 'observaciones', value)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, toRef } from 'vue'
import apiAxios from '@/services/api'

const props = defineProps({
  attr: { type: Object, required: true },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['change'])
const attrRef = toRef(props, 'attr')
const responsables = ref([])
const openSections = ref({})
const datosOpen = ref(true)

const stateOptions = [
  { value: 'si', label: 'SI' },
  { value: 'no', label: 'NO' }
]

const sections = [
  section('tejidoCorrea', 'CONDICION DEL TEJIDO O CORREA', [
    'Fibras externas cortadas',
    'Costuras o cortes rotura del tejido',
    'Estiramiento excesivo',
    'Deterioro general',
    'Corrosion por exposicion a acidos o prod quimicos',
    'Quemaduras'
  ]),
  section('argollas', 'ARGOLLAS', [
    'Desgaste excesivo o deformados',
    'Picaduras grietas trizaduras',
    'Deterioro general',
    'Corrosion',
    'Otros'
  ]),
  section('hebillas', 'HEBILLAS', [
    'Desgaste excesivo o deformados',
    'Picaduras grietas trizaduras',
    'Deterioro general',
    'Corrosion',
    'Otros'
  ]),
  section('colaVida', 'COLA DE VIDA', [
    'Fibras externas cortadas',
    'Abrasion o quemaduras',
    'Estiramiento excesivo',
    'Seguro de mosquetones',
    'Mosquetones presentan corrosion',
    'Mosquetones presentan deformaciones'
  ])
]

ensureBody()
sections.forEach((sec) => { openSections.value[sec.key] = true })

const blocks = computed(() => {
  ensureBody()
  return attrRef.value.bloques
})

onMounted(loadUsuarios)

function section(key, title, labels) {
  return {
    key,
    title,
    items: labels.map((label) => ({ key: toKey(`${key}-${label}`), label }))
  }
}

function toKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function normalizeDate(value) {
  const raw = String(value ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const match = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : raw
}

function normalizeState(value) {
  const current = String(value ?? '').trim().toLowerCase()
  return current === 'si' ? 'si' : (current === 'no' ? 'no' : '')
}

function blankCondition() {
  return {
    estado: '',
    accion: '',
    responsableId: null,
    responsable: '',
    fecha: todayIso()
  }
}

function blankBlock() {
  return {
    uid: `arnes-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    identificacion: '',
    condiciones: sections.reduce((acc, sec) => {
      sec.items.forEach((item) => { acc[item.key] = blankCondition() })
      return acc
    }, {}),
    observaciones: ''
  }
}

function ensureBody() {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') attrRef.value.datos = {}
  const datos = attrRef.value.datos
  datos.faenaContrato ??= ''
  datos.area ??= ''
  datos.codigoCertArnes ??= ''
  datos.codigoCertColas ??= ''
  datos.codigoSpdcArnes ??= ''
  datos.codigoSpdcColas ??= ''

  if (!Array.isArray(attrRef.value.bloques)) {
    attrRef.value.bloques = migrateLegacyBlocks()
  }
  if (!attrRef.value.bloques.length) attrRef.value.bloques.push(blankBlock())
  attrRef.value.bloques = attrRef.value.bloques.map(normalizeBlock)
}

function migrateLegacyBlocks() {
  const legacy = Array.isArray(attrRef.value.identificaciones) ? attrRef.value.identificaciones : []
  if (!legacy.length) return []
  return legacy.map((old) => ({
    uid: old.uid,
    identificacion: old.identificacion || '',
    condiciones: Object.entries(old.respuestas || {}).reduce((acc, [key, estado]) => {
      acc[key] = {
        estado: normalizeState(estado),
        accion: old.accion || '',
        responsableId: old.responsableId ?? null,
        responsable: old.responsable || '',
        fecha: normalizeDate(old.fecha) || todayIso()
      }
      return acc
    }, {}),
    observaciones: old.observaciones || ''
  }))
}

function normalizeBlock(block) {
  const next = block && typeof block === 'object' ? block : {}
  next.uid ||= `arnes-${Date.now()}-${Math.random().toString(16).slice(2)}`
  next.identificacion ??= ''
  next.observaciones ??= ''
  if (!next.condiciones || typeof next.condiciones !== 'object' || Array.isArray(next.condiciones)) next.condiciones = {}
  sections.forEach((sec) => {
    sec.items.forEach((item) => {
      next.condiciones[item.key] = normalizeCondition(next.condiciones[item.key])
    })
  })
  return next
}

function normalizeCondition(condition) {
  const next = condition && typeof condition === 'object' ? condition : {}
  next.estado = normalizeState(next.estado)
  next.accion ??= ''
  next.responsableId ??= null
  next.responsable ??= ''
  next.fecha = normalizeDate(next.fecha) || todayIso()
  return next
}

async function loadUsuarios() {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
    responsables.value = (Array.isArray(data) ? data : [])
      .map((u) => ({
        value: u.id_user,
        label: getUserName(u)
      }))
      .filter((u) => String(u.label || '').trim() !== '')
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
  } catch (error) {
    responsables.value = []
  }
}

function getUserName(user) {
  return [
    user?.nombre_user,
    [user?.name_frst, user?.name_sec, user?.apellido_pat, user?.apellido_mat].filter(Boolean).join(' '),
    user?.nombre,
    user?.email_user
  ].find((name) => String(name || '').trim()) || `Usuario ${user?.id_user ?? ''}`.trim()
}

function setDato(key, value) {
  attrRef.value.datos ||= {}
  attrRef.value.datos[key] = value
  touch()
}

function setBlockField(block, key, value) {
  block[key] = value
  touch()
}

function isSectionOpen(sectionKey) {
  return openSections.value[sectionKey] !== false
}

function toggleSection(sectionKey) {
  openSections.value[sectionKey] = !isSectionOpen(sectionKey)
}

function getCondition(block, itemKey) {
  block.condiciones ||= {}
  block.condiciones[itemKey] = normalizeCondition(block.condiciones[itemKey])
  return block.condiciones[itemKey]
}

function setConditionState(block, itemKey, value) {
  const condition = getCondition(block, itemKey)
  condition.estado = condition.estado === value ? '' : value
  touch()
}

function setConditionField(block, itemKey, key, value) {
  const condition = getCondition(block, itemKey)
  condition[key] = value
  touch()
}

function setConditionResponsable(block, itemKey, value) {
  const condition = getCondition(block, itemKey)
  condition.responsableId = value
  const selected = responsables.value.find((item) => String(item.value) === String(value))
  condition.responsable = selected?.label || ''
  touch()
}

function touch() {
  attrRef.value.__touched = Date.now()
  emit('change')
}
</script>

<style scoped>
.checklist-arnes-seguridad-dmh {
  display: grid;
  gap: 12px;
  width: 100%;
}

.dmh-card {
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  background: rgba(15, 23, 42, 0.52) !important;
  color: #e5eefb;
}

.dmh-title,
.block-title-row,
.cards-title {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.datos-card {
  overflow: hidden;
}

.dmh-title-toggle {
  width: 100%;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(30, 41, 59, 0.88);
  text-align: left;
  cursor: pointer;
}

.dmh-title-toggle :deep(.v-icon) {
  color: #e5eefb;
  flex: 0 0 auto;
}

.datos-body {
  padding: 10px !important;
}

.datos-grid {
  row-gap: 8px;
}

.block-title-row,
.cards-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.checklist-arnes-seguridad-dmh :deep(.v-field) {
  background: rgba(2, 6, 23, 0.56) !important;
  border-radius: 8px;
}

.checklist-arnes-seguridad-dmh :deep(.v-field__outline) {
  color: rgba(148, 163, 184, 0.48) !important;
}

.checklist-arnes-seguridad-dmh :deep(.v-label),
.checklist-arnes-seguridad-dmh :deep(.v-field__input),
.checklist-arnes-seguridad-dmh :deep(input),
.checklist-arnes-seguridad-dmh :deep(textarea) {
  color: #e5eefb !important;
  opacity: 1 !important;
}

.block-card {
  page-break-inside: avoid;
}

.section-list {
  display: grid;
  gap: 12px;
  margin-top: 0;
}

.section-group {
  display: grid;
  gap: 0;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.52);
}

.section-title {
  width: 100%;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 0;
  background: rgba(30, 41, 59, 0.88);
  color: #e5eefb;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-align: left;
  text-transform: uppercase;
  cursor: pointer;
}

.section-title :deep(.v-icon) {
  color: #e5eefb;
  flex: 0 0 auto;
}

.section-body {
  padding: 10px;
}

.condition-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}

.condition-card {
  display: grid;
  gap: 9px;
  padding: 11px;
  border: 1px solid rgba(20, 184, 166, 0.46);
  border-radius: 8px;
  background: rgba(8, 17, 31, 0.72);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.08);
}

.condition-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 118px;
  gap: 8px;
  align-items: center;
}

.condition-title {
  color: #e5eefb;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
}

.state-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
}

.state-toggle {
  min-height: 30px;
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

@media (max-width: 640px) {
  .condition-head {
    grid-template-columns: 1fr;
  }
}
</style>
