<template>
  <div class="checklist-extintor-cdch">
    <v-expansion-panels v-model="openSections" multiple class="ext-panels">
      <v-expansion-panel value="identificacion" class="ext-card">
        <v-expansion-panel-title class="ext-title">
          1.- IDENTIFICACION
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getField('identificacion', 'lugar')"
                label="LUGAR"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setField('identificacion', 'lugar', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getField('identificacion', 'colorMes')"
                label="COLOR DEL MES"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setField('identificacion', 'colorMes', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getField('identificacion', 'fechaInspeccion')"
                type="date"
                label="FECHA INSPECCION"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setField('identificacion', 'fechaInspeccion', normalizeDateForInput(value))"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getField('identificacion', 'fechaTermino')"
                type="date"
                label="FECHA DE TERMINO"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setField('identificacion', 'fechaTermino', normalizeDateForInput(value))"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="descripcion" class="ext-card">
        <v-expansion-panel-title class="ext-title">
          2.- DESCRIPCION DEL EQUIPO
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getField('descripcionEquipo', config.descripcionFields[0].key)"
                :label="config.descripcionFields[0].label"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setField('descripcionEquipo', config.descripcionFields[0].key, value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getField('descripcionEquipo', config.descripcionFields[1].key)"
                :label="config.descripcionFields[1].label"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setField('descripcionEquipo', config.descripcionFields[1].key, value)"
              />
            </v-col>
          </v-row>

          <div class="ext-image-wrap">
            <img
              :src="imageSrc"
              :alt="config.imageAlt"
              class="ext-image"
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="componentes" class="ext-card">
        <v-expansion-panel-title class="ext-title">
          3.- COMPONENTES A INSPECCIONAR
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

            <div class="item-days">
              <button
                v-for="day in days"
                :key="`${item.id}-${day.key}`"
                type="button"
                :disabled="disabled"
                :class="[
                  'day-toggle',
                  `day-toggle--${getDayValue(item, day.key)}`
                ]"
                @click="cycleDay(item, day.key)"
              >
                <span>{{ day.label }}</span>
                <strong>{{ getDayValue(item, day.key).toUpperCase() }}</strong>
              </button>
            </div>

            <v-textarea
              :model-value="item.medidaCorrectiva"
              label="Medidas correctivas"
              variant="outlined"
              density="compact"
              rows="1"
              auto-grow
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setCorrectiveMeasure(item, value)"
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="observaciones" class="ext-card">
        <v-expansion-panel-title class="ext-title">
          4.- OBS. HERRAMIENTA / MAQUINA / EQUIPO INSPECCIONADO
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

const openSections = ref(['identificacion', 'descripcion', 'componentes', 'observaciones'])

const days = [
  { key: 'lunes', label: 'LUN' },
  { key: 'martes', label: 'MAR' },
  { key: 'miercoles', label: 'MIE' },
  { key: 'jueves', label: 'JUE' },
  { key: 'viernes', label: 'VIE' },
  { key: 'sabado', label: 'SAB' },
  { key: 'domingo', label: 'DOM' }
]

const checklistConfigs = {
  extintor: {
    imagePath: 'checklist-assets/extintor/extintor.jpeg',
    imageAlt: 'Partes de un extintor',
    descripcionFields: [
      { key: 'numeroInterno', label: 'N INTERNO' },
      { key: 'capacidadKg', label: 'CAPACIDAD KG' }
    ],
    items: [
      { numero: 1, label: 'ESTA CLASIFICADO SEGUN LOS TIPOS DE FUEGO' },
      { numero: 2, label: 'SE ENCUENTRA CODIFICADO' },
      { numero: 4, label: 'ESTA UBICADO EN EL LUGAR DESIGNADO Y EN POSICION CORRECTA' },
      { numero: 5, label: 'SE ENCUENTRA CLARAMENTE VISIBLE' },
      { numero: 6, label: 'EL ACCESO AL EXTINTOR SE ENCUENTRA LIBRE DE OBSTACULOS' },
      { numero: 7, label: 'EL SOPORTE DEL EXTINTOR SE ENCUENTRA EN BUENAS CONDICIONES' },
      { numero: 8, label: 'NO PRESENTA SENALES NI SIGNOS DE CORROSION' },
      { numero: 9, label: 'ESTA LIBRE DE FUGAS O FILTRACIONES' },
      { numero: 10, label: 'ESTADO DE EXTINTOR (GOLPES, ABOLLADURAS, CORROSION, PINTURA)' },
      { numero: 13, label: 'EL CONJUNTO DE MANGUERAS Y ACOPLES ESTAN EN BUENAS CONDICIONES' },
      { numero: 14, label: 'LA BOQUILLA DE DESCARGA ESTA EN BUENAS CONDICIONES' },
      { numero: 15, label: 'LA PALANCA DE DESCARGA ESTA EN BUENAS CONDICIONES DE USO' },
      { numero: 16, label: 'LA MANILLA DE TRANSPORTE SE ENCUENTRA EN BUENAS CONDICIONES DE USO' },
      { numero: 18, label: 'EL MANOMETRO DE PRESION (INDICADOR DE CARGA) SE ENCUENTRA EN BUENAS CONDICIONES' },
      { numero: 19, label: 'TIENE VISIBLE Y LEGIBLE LA ETIQUETA DE REVISION MENSUAL' },
      { numero: 20, label: 'SE ENCUENTRA DEBIDAMENTE SENALIZADO' }
    ]
  },
  grillete: {
    imagePath: 'checklist-assets/grillete/grillete.jpeg',
    imageAlt: 'Partes de un grillete',
    descripcionFields: [
      { key: 'medida', label: 'MEDIDA' },
      { key: 'codificacion', label: 'CODIFICACION' }
    ],
    items: [
      { numero: 1, label: 'CUERPO' },
      { numero: 2, label: 'CORONA' },
      { numero: 3, label: 'PASADOR' },
      { numero: 4, label: 'ENTRADA' },
      { numero: 5, label: 'HILOS DEL PASADOR' }
    ]
  },
  retractil: {
    imagePath: 'checklist-assets/retractil/retractil.jpg',
    imageAlt: 'Linea de vida retractil',
    descripcionFields: [
      { key: 'marca', label: 'MARCA' },
      { key: 'modelo', label: 'MODELO' }
    ],
    items: [
      { numero: 1, label: 'MANIJA DE ANCLAJE' },
      { numero: 2, label: 'ESTADO DE LA CARCASA' },
      { numero: 3, label: 'LINEA DE VIDA ACERO GALVANIZADO' },
      { numero: 4, label: 'TOPE' },
      { numero: 5, label: 'GANCHO DE SEGURIDAD DE CIERRE AUTOMATICO' },
      { numero: 6, label: 'MOSQUETON' },
      { numero: 7, label: 'ASA DE TRANSPORTE' },
      { numero: 8, label: 'INDICADOR DE IMPACTO' },
      { numero: 9, label: 'ESTADO DE RETRACTIL' },
      { numero: 10, label: 'ETIQUETAS DE INFORMACION' },
      { numero: 11, label: 'CODIFICACION DE COLOR' }
    ]
  }
}

const configKey = computed(() =>
  String(attrRef.value?.type || '').toLowerCase().includes('grillete')
    ? 'grillete'
    : (String(attrRef.value?.type || '').toLowerCase().includes('retractil') ? 'retractil' : 'extintor')
)

const config = computed(() => checklistConfigs[configKey.value])
const imageSrc = computed(() => `${process.env.BASE_URL || '/'}${config.value.imagePath}`)

const items = computed(() => {
  renderTick.value
  return Array.isArray(attrRef.value?.componentes) ? attrRef.value.componentes : []
})

onMounted(() => {
  ensureBody()
})

function todayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDateForInput(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return raw

  match = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    return `${year}-${month}-${day}`
  }

  return ''
}

function emptyDays() {
  return days.reduce((acc, day) => {
    acc[day.key] = 'na'
    return acc
  }, {})
}

function normalizeValue(value) {
  const current = String(value ?? '').trim().toLowerCase()
  if (current === 'si' || current === 'no') return current
  return 'na'
}

function ensureBody() {
  if (!attrRef.value.identificacion || typeof attrRef.value.identificacion !== 'object') {
    attrRef.value.identificacion = {}
  }
  attrRef.value.identificacion = {
    "lugar": String(attrRef.value.identificacion.lugar ?? ''),
    "fechaInspeccion": normalizeDateForInput(attrRef.value.identificacion.fechaInspeccion) || todayIso(),
    "fechaTermino": normalizeDateForInput(attrRef.value.identificacion.fechaTermino),
    "colorMes": String(attrRef.value.identificacion.colorMes ?? '')
  }

  if (!attrRef.value.descripcionEquipo || typeof attrRef.value.descripcionEquipo !== 'object') {
    attrRef.value.descripcionEquipo = {}
  }
  attrRef.value.descripcionEquipo = config.value.descripcionFields.reduce((acc, field) => {
    acc[field.key] = String(attrRef.value.descripcionEquipo[field.key] ?? '')
    return acc
  }, {})

  const savedItems = Array.isArray(attrRef.value.componentes) ? attrRef.value.componentes : []
  attrRef.value.componentes = config.value.items.map((base, index) => {
    const saved = savedItems.find((item) => Number(item?.numero) === base.numero) || savedItems[index] || {}
    return {
      "id": saved.id || `ext-${base.numero}`,
      "numero": base.numero,
      "label": saved.label || base.label,
      "days": days.reduce((acc, day) => {
        acc[day.key] = normalizeValue(saved?.days?.[day.key])
        return acc
      }, {}),
      "medidaCorrectiva": saved.medidaCorrectiva || ''
    }
  })

  if (attrRef.value.observaciones === undefined || attrRef.value.observaciones === null) {
    attrRef.value.observaciones = ''
  }

  renderTick.value += 1
}

function getField(section, key) {
  renderTick.value
  ensureSection(section)
  return attrRef.value[section]?.[key] || ''
}

function setField(section, key, value) {
  ensureSection(section)
  attrRef.value[section][key] = value || ''
  renderTick.value += 1
  emit('change')
}

function ensureSection(section) {
  if (!attrRef.value[section] || typeof attrRef.value[section] !== 'object') {
    attrRef.value[section] = {}
  }
}

function getDayValue(item, dayKey) {
  renderTick.value
  if (!item.days || typeof item.days !== 'object') item.days = emptyDays()
  item.days[dayKey] = normalizeValue(item.days[dayKey])
  return item.days[dayKey]
}

function cycleDay(item, dayKey) {
  if (props.disabled || !item) return
  if (!item.days || typeof item.days !== 'object') item.days = emptyDays()
  const current = getDayValue(item, dayKey)
  item.days[dayKey] = current === 'na' ? 'si' : (current === 'si' ? 'no' : 'na')
  renderTick.value += 1
  emit('change')
}

function setCorrectiveMeasure(item, value) {
  if (!item) return
  item.medidaCorrectiva = value || ''
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
.checklist-extintor-cdch {
  width: 100%;
}

.ext-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  width: 100%;
}

.ext-panels :deep(.v-expansion-panel),
.ext-panels :deep(.v-expansion-panel-title),
.ext-panels :deep(.v-expansion-panel-text) {
  width: 100%;
  max-width: none;
}

.ext-card {
  width: 100%;
  max-width: none !important;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  overflow: hidden;
}

.ext-title {
  min-height: 46px;
  padding: 10px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  white-space: normal;
}

.ext-image-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 12px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  background: #fff;
}

.ext-image {
  display: block;
  width: 100%;
  max-width: 360px;
  height: auto;
  object-fit: contain;
}

.item-card {
  display: grid;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.item-card:last-child {
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

.item-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}

.day-toggle {
  min-height: 34px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 7px;
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
}

.day-toggle--na {
  background: rgba(71, 85, 105, 0.36);
  border-color: rgba(148, 163, 184, 0.72);
  color: #f8fafc;
}

.day-toggle--si {
  background: rgba(6, 95, 70, 0.42);
  border-color: rgba(16, 185, 129, 0.7);
  color: #dcfce7;
}

.day-toggle--no {
  background: rgba(127, 29, 29, 0.34);
  border-color: rgba(239, 68, 68, 0.58);
  color: #fee2e2;
}

@media (max-width: 600px) {
  .item-days {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
