<template>
  <div class="checklist-amarre">
    <v-expansion-panels v-model="openSections" multiple class="amarre-panels">
      <v-expansion-panel value="datos" class="amarre-card">
        <v-expansion-panel-title class="amarre-title">
          DATOS ACCESORIOS DE AMARRE
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense>
            <v-col
              v-for="field in datosFields"
              :key="field.key"
              cols="12"
              sm="6"
            >
              <v-text-field
                :model-value="getDato(field.key)"
                :type="field.type || 'text'"
                :label="field.label"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato(field.key, field.type === 'date' ? normalizeDate(value) : value)"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel
        v-for="group in groups"
        :key="group.key"
        :value="group.key"
        class="amarre-card"
      >
        <v-expansion-panel-title class="amarre-title">
          {{ group.title }}
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="reference-image-wrap">
            <img
              :src="assetUrl(group.image)"
              :alt="group.title"
              class="reference-image"
            />
          </div>

          <div class="item-actions">
            <v-btn
              size="small"
              variant="tonal"
              color="success"
              prepend-icon="mdi-plus"
              :disabled="disabled"
              @click="addItem(group)"
            >
              Agregar
            </v-btn>
          </div>

          <div
            v-for="item in getGroupItems(group.key)"
            :key="item.id"
            class="item-card"
          >
            <div class="item-head">
              <div class="item-number">Item {{ item.numero }}</div>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="tonal"
                color="error"
                class="delete-btn"
                :disabled="disabled || getGroupItems(group.key).length <= 1"
                @click="removeItem(group, item)"
              />
            </div>

            <div
              v-for="check in group.checks"
              :key="`${item.id}-${check.key}`"
              class="check-row"
            >
              <div class="check-label">{{ check.label }}</div>
              <div class="state-row">
                <button
                  type="button"
                  :disabled="disabled"
                  :class="['state-toggle', item.respuestas?.[check.key] === 'si' ? 'state-toggle--si' : '']"
                  @click="setRespuesta(item, check.key, 'si')"
                >
                  SI
                </button>
                <button
                  type="button"
                  :disabled="disabled"
                  :class="['state-toggle', item.respuestas?.[check.key] === 'no' ? 'state-toggle--no' : '']"
                  @click="setRespuesta(item, check.key, 'no')"
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="observaciones" class="amarre-card">
        <v-expansion-panel-title class="amarre-title">
          OBSERVACIONES
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-textarea
            :model-value="attrRef.observaciones"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            hide-details
            :disabled="disabled"
            @update:model-value="setObservaciones"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="nota" class="amarre-card">
        <v-expansion-panel-title class="amarre-title">
          NOTA
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="note-card">
            Nota: en caso de una respuesta afirmativa "SI" al criterio de revision, no se debera utilizar ese elemento.
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { onMounted, ref, toRef } from 'vue'

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

const datosFields = [
  { key: 'nombre', label: 'NOMBRE' },
  { key: 'cargo', label: 'CARGO' },
  { key: 'rut', label: 'RUT' },
  { key: 'fecha', label: 'FECHA', type: 'date' },
  { key: 'hora', label: 'HORA', type: 'time' },
  { key: 'equipo', label: 'EQUIPO' },
  { key: 'marca', label: 'MARCA' },
  { key: 'modelo', label: 'MODELO' },
  { key: 'patente', label: 'PATENTE' }
]

const groups = [
  {
    key: 'dobleGancho',
    title: 'DOBLE GANCHO',
    image: 'doble-gancho.jpeg',
    checks: [
      { key: 'deformacionGanchos', label: 'Deformacion de ganchos' },
      { key: 'corteMellaSoldadura', label: 'Corte, mella o soldadura' },
      { key: 'bordesAbrasivosUnionCinta', label: 'Bordes abrasivos en union a cinta' },
      { key: 'fisurasVisibles', label: 'Fisuras visibles' }
    ]
  },
  {
    key: 'cintaPoliester',
    title: 'CINTA DE POLIESTER',
    image: 'cinta-poliester.jpeg',
    checks: [
      { key: 'desgasteAbrasion', label: 'Desgaste o abrasion' },
      { key: 'quemadura', label: 'Quemadura por temperatura o quimica' },
      { key: 'corteRoturas', label: 'Corte o roturas' },
      { key: 'tejidoGastadoDescocidas', label: 'Tejido gastado o partes descocidas' }
    ]
  },
  {
    key: 'trinqueteCinta',
    title: 'TRINQUETE CINTA DE AMARRE',
    image: 'trinquete-cinta.jpeg',
    checks: [
      { key: 'malFuncionSeguroRetractil', label: 'Mal funcion de seguro retractil' },
      { key: 'pernosPasadoresDanados', label: 'Pernos y pasadores danados' },
      { key: 'asaSujecionManualDanada', label: 'Asa de sujecion manual danada' },
      { key: 'ruedaDentadaGatilloDanados', label: 'Rueda dentada y gatillo danados' }
    ]
  },
  {
    key: 'cadenaAmarre',
    title: 'CADENA PARA AMARRE DE CARGA',
    image: 'cadena-amarre.png',
    checks: [
      { key: 'eslabonDilatadoDeformado', label: 'Eslabon dilatado o deformado' },
      { key: 'eslabonCortado', label: 'Eslabon cortado' },
      { key: 'desgasteAbrasion', label: 'Desgaste o abrasion' },
      { key: 'eslabonMellaEstria', label: 'Eslabon con mella o estria' }
    ]
  },
  {
    key: 'ganchoCadena',
    title: 'GANCHO AMARRE PARA CADENA',
    image: 'gancho-cadena.png',
    checks: [
      { key: 'aperturaGarganta', label: 'Apertura de garganta' },
      { key: 'fisuraMellaCorte', label: 'Fisura, mella o corte' },
      { key: 'deformacionLateral', label: 'Deformacion lateral' },
      { key: 'soldadura', label: 'Soldadura' }
    ]
  },
  {
    key: 'trinqueteCadena',
    title: 'TRINQUETE CADENA',
    image: 'trinquete-cadena.png',
    checks: [
      { key: 'ganchosExternosDanados', label: 'Ganchos externos danados' },
      { key: 'tornilloHiloDanados', label: 'Tornillo e hilo danados' },
      { key: 'asaSujecionManualDanada', label: 'Asa de sujecion manual danada' },
      { key: 'ruedaDentadaSeguroGatilloDanados', label: 'Rueda dentada, seguro y gatillo danados' }
    ]
  }
]

const openSections = ref(['datos', ...groups.map((group) => group.key), 'observaciones', 'nota'])

onMounted(() => {
  ensureBody()
})

function assetUrl(filename) {
  return `${process.env.BASE_URL || '/'}checklist-assets/accesorios-amarre/${filename}`
}

function todayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

function ensureBody() {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') {
    attrRef.value.datos = {}
  }

  attrRef.value.datos = datosFields.reduce((acc, field) => {
    acc[field.key] = field.key === 'fecha'
      ? (normalizeDate(attrRef.value.datos[field.key]) || todayIso())
      : String(attrRef.value.datos[field.key] ?? '')
    return acc
  }, {})

  if (!attrRef.value.grupos || typeof attrRef.value.grupos !== 'object') {
    attrRef.value.grupos = {}
  }

  groups.forEach((group) => {
    const savedItems = Array.isArray(attrRef.value.grupos[group.key]) ? attrRef.value.grupos[group.key] : []
    attrRef.value.grupos[group.key] = (savedItems.length > 0 ? savedItems : [createEmptyItem(group, 1)])
      .map((saved, index) => normalizeItem(group, saved, index + 1))
  })

  if (attrRef.value.observaciones === undefined || attrRef.value.observaciones === null) {
    attrRef.value.observaciones = ''
  }

  renderTick.value += 1
}

function createEmptyItem(group, numero) {
  return {
    "id": `${group.key}-${Date.now()}-${numero}`,
    "numero": numero,
    "respuestas": {}
  }
}

function normalizeItem(group, saved, numero) {
  const respuestas = {}
  group.checks.forEach((check) => {
    respuestas[check.key] = normalizeRespuesta(saved?.respuestas?.[check.key])
  })

  return {
    "id": saved.id || `${group.key}-${Date.now()}-${numero}`,
    "numero": numero,
    "respuestas": respuestas
  }
}

function normalizeRespuesta(value) {
  const state = String(value ?? '').trim().toLowerCase()
  return state === 'si' || state === 'no' ? state : ''
}

function getDato(key) {
  renderTick.value
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') attrRef.value.datos = {}
  return attrRef.value.datos[key] || ''
}

function setDato(key, value) {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') attrRef.value.datos = {}
  attrRef.value.datos[key] = value || ''
  renderTick.value += 1
  emit('change')
}

function getGroupItems(groupKey) {
  renderTick.value
  if (!attrRef.value.grupos || typeof attrRef.value.grupos !== 'object') attrRef.value.grupos = {}
  if (!Array.isArray(attrRef.value.grupos[groupKey])) attrRef.value.grupos[groupKey] = []
  return attrRef.value.grupos[groupKey]
}

function setRespuesta(item, checkKey, value) {
  if (props.disabled || !item) return
  if (!item.respuestas || typeof item.respuestas !== 'object') item.respuestas = {}
  item.respuestas[checkKey] = item.respuestas[checkKey] === value ? '' : value
  renderTick.value += 1
  emit('change')
}

function renumberItems(groupKey) {
  getGroupItems(groupKey).forEach((item, index) => {
    item.numero = index + 1
  })
}

function addItem(group) {
  if (props.disabled) return
  const items = getGroupItems(group.key)
  items.push(normalizeItem(group, createEmptyItem(group, items.length + 1), items.length + 1))
  renumberItems(group.key)
  renderTick.value += 1
  emit('change')
}

function removeItem(group, item) {
  if (props.disabled) return
  const items = getGroupItems(group.key)
  if (items.length <= 1) return
  const index = items.findIndex((current) => current.id === item.id)
  if (index < 0) return
  items.splice(index, 1)
  renumberItems(group.key)
  renderTick.value += 1
  emit('change')
}

function setObservaciones(value) {
  attrRef.value.observaciones = value || ''
  renderTick.value += 1
  emit('change')
}
</script>

<style scoped>
.checklist-amarre {
  width: 100%;
}

.amarre-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  width: 100%;
}

.amarre-panels :deep(.v-expansion-panel),
.amarre-panels :deep(.v-expansion-panel-title),
.amarre-panels :deep(.v-expansion-panel-text) {
  width: 100%;
  max-width: none;
}

.amarre-card {
  width: 100%;
  max-width: none !important;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  overflow: hidden;
}

.amarre-title {
  min-height: 46px;
  padding: 10px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  white-space: normal;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  margin-bottom: 10px;
}

.item-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.2);
}

.item-card + .item-card {
  margin-top: 10px;
}

.item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-number {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
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

.reference-image-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  background: #fff;
}

.reference-image {
  display: block;
  max-width: 220px;
  width: 100%;
  max-height: 160px;
  object-fit: contain;
}

.check-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  gap: 8px;
  align-items: center;
}

.check-label {
  color: #e5eefb;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
}

.state-row {
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
  background: rgba(127, 29, 29, 0.42);
  border-color: rgba(239, 68, 68, 0.65);
  color: #fee2e2;
}

.state-toggle--no {
  background: rgba(6, 95, 70, 0.5);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.note-card {
  padding: 10px;
  border: 1px solid rgba(245, 158, 11, 0.55);
  border-radius: 8px;
  background: rgba(113, 63, 18, 0.22);
  color: #fef3c7;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
}

@media (max-width: 600px) {
  .check-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
