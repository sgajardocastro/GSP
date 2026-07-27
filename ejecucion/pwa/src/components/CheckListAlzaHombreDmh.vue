<template>
  <div class="checklist-alza-hombre-dmh">
    <v-expansion-panels v-model="openSections" multiple class="dmh-panels">
      <v-expansion-panel value="datos" class="dmh-card">
        <v-expansion-panel-title class="dmh-title">DATOS</v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="attrRef.datos?.patente"
                label="Patente / Equipo"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('patente', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="attrRef.datos?.proximaMantencion"
                label="Proxima mantencion"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDato('proximaMantencion', normalizeDate(value))"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="inspeccion" class="dmh-card">
        <v-expansion-panel-title class="dmh-title">INSPECCION DIARIA</v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="day-tabs">
            <button
              v-for="day in dayKeys"
              :key="day.key"
              type="button"
              :class="['day-tab', selectedDay === day.key ? 'day-tab--active' : '']"
              @click="selectDay(day.key)"
            >
              {{ day.short }}
            </button>
          </div>

          <v-text-field
            class="day-date"
            :model-value="getDayDate(selectedDay)"
            :label="`Fecha ${currentDayLabel}`"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            :disabled="disabled"
            @update:model-value="(value) => setDayDate(selectedDay, normalizeDate(value))"
          />

          <v-row dense class="day-metrics">
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="getDayMetric(selectedDay, 'horometro')"
                label="Horometro"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDayMetric(selectedDay, 'horometro', value)"
              />
            </v-col>
          </v-row>

          <div class="group-list">
            <section v-for="group in groups" :key="group.key" class="group-block">
              <h4 class="group-title">{{ group.title }}</h4>
              <div class="item-list">
                <div v-for="item in group.items" :key="item.key" class="item-card">
                  <div class="item-card__content">
                    <div class="check-code">{{ item.code }}</div>
                    <div class="check-item">{{ item.label }}</div>
                  </div>
                  <div class="state-buttons">
                    <button
                      v-for="option in optionsFor(group.mode)"
                      :key="option.value"
                      type="button"
                      :class="['state-toggle', getItemDayState(item.key, selectedDay) === option.value ? `state-toggle--${option.value}` : '']"
                      :disabled="disabled"
                      @click="setItemDayState(item.key, selectedDay, option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel value="observaciones" class="dmh-card">
        <v-expansion-panel-title class="dmh-title">OBSERVACIONES Y NOTAS</v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-textarea
            :model-value="attrRef.observacionesDanos"
            label="Observaciones y/o danos"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            hide-details
            :disabled="disabled"
            @update:model-value="setObservacionesDanos"
          />

          <div class="photo-block">
            <div class="photo-title">Imagen de referencia</div>
            <img
              :src="referenceImageSrc"
              alt="Diagrama de referencia alza hombre"
              class="reference-image"
            >
          </div>

          <div class="note-box">
            B = BUENO, M = MALO.
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { computed, ref, toRef } from 'vue'

const props = defineProps({
  attr: { type: Object, required: true },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['change'])
const attrRef = toRef(props, 'attr')

const dayKeys = [
  { key: 'miercoles', label: 'Miercoles', short: 'Mie' },
  { key: 'jueves', label: 'Jueves', short: 'Jue' },
  { key: 'viernes', label: 'Viernes', short: 'Vie' },
  { key: 'sabado', label: 'Sabado', short: 'Sab' },
  { key: 'domingo', label: 'Domingo', short: 'Dom' },
  { key: 'lunes', label: 'Lunes', short: 'Lun' },
  { key: 'martes', label: 'Martes', short: 'Mar' }
]

const groups = [
  group('documentos', 'Documentos', 'sino', [
    item('1.1', 'Documentacion del Equipo (critico)')
  ]),
  group('identificacion', 'Identificacion', 'bm', [
    item('2.1', 'Logos y numero de identificacion')
  ]),
  group('ruedas', 'Sistemas de Seguridad Activa - Ruedas', 'sino', [
    item('3.1', 'Desgaste de banda (critico)'),
    item('3.2', 'Corte lateral (critico)'),
    item('3.3', 'Dibujo de neumatico'),
    item('3.4', 'Seguro de Traba Tuercas de Ruedas (critico)')
  ]),
  group('estabilidad', 'Estabilidad (ESP)', 'bm', [
    item('4.1', 'Sensor de inclinacion y desnivel')
  ]),
  group('frenos', 'Frenos', 'bm', [
    item('5.1', 'Mando de Frenado (critico)'),
    item('5.2', 'Sistema de velocidad')
  ]),
  group('equipamientoSeguridad', 'Sistemas Complementarios - Equipamiento de Seguridad', 'bm', [
    item('6.1', 'Triangulos'),
    item('6.2', 'Botiquin'),
    item('6.3', 'Extintor y tarjeta'),
    item('6.4', 'Cunas (critico)')
  ]),
  group('equipoExterior', 'Equipo / Exterior', 'bm', [
    item('7.1', 'Alarma de retroceso (critico)'),
    item('7.2', 'Bocina (critico)'),
    item('7.3', 'Nivel de liquido refrigerante'),
    item('7.4', 'Nivel de aceite'),
    item('7.5', 'Parada de emergencia (critico)'),
    item('7.6', 'Estructura en general'),
    item('7.7', 'Estado de Bateria'),
    item('7.8', 'Cables de conexion y cables electricos'),
    item('7.9', 'Tubos hidraulicos, piezas de conexion'),
    item('7.10', 'Cilindros y Distribuidores'),
    item('7.11', 'Canerias, mangueras terminales y niples'),
    item('7.12', 'Tanques hidraulicos y de combustible'),
    item('7.13', 'Baliza'),
    item('7.14', 'Seguro de la Torreta'),
    item('7.15', 'Rejilla de Piso'),
    item('7.16', 'Perfiles de soporte en piso'),
    item('7.17', 'Barandas laterales'),
    item('7.18', 'Puerta o barandilla central de entrada a plataforma'),
    item('7.19', 'Puntos de anclaje'),
    item('7.20', 'Panel de Control'),
    item('7.21', 'Levante y extension de brazos primarios y secundarios'),
    item('7.22', 'Bomba Auxiliar'),
    item('7.23', 'Extension Pluma y Plumin'),
    item('7.24', 'Pastillas de friccion de la pluma'),
    item('7.25', 'Prueba de los ejes extensibles (AH 40 Mts.)'),
    item('7.26', 'Conmutador de Pedal')
  ]),
  group('direccion', 'Direccion', 'bm', [
    item('8.1', 'Comprobacion de la direccion')
  ])
]

const openSections = ref(['datos', 'inspeccion', 'observaciones'])
const selectedDay = ref('miercoles')
const currentDayLabel = computed(() => dayKeys.find((d) => d.key === selectedDay.value)?.label || '')
const referenceImageSrc = `${process.env.BASE_URL || '/'}checklist-assets/alza-hombre/observacion-alza-hombre.png`

ensureBody()

function group(key, title, mode, items) {
  return { key, title, mode, items }
}

function item(code, label) {
  return {
    code,
    label,
    key: `${code}-${label}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
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

function ensureBody() {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') attrRef.value.datos = {}
  attrRef.value.datos.patente ??= ''
  attrRef.value.datos.proximaMantencion ??= todayIso()

  if (!attrRef.value.fechas || typeof attrRef.value.fechas !== 'object' || Array.isArray(attrRef.value.fechas)) attrRef.value.fechas = {}
  dayKeys.forEach((day, index) => {
    attrRef.value.fechas[day.key] ??= index === 0 ? todayIso() : ''
  })

  if (!attrRef.value.mediciones || typeof attrRef.value.mediciones !== 'object' || Array.isArray(attrRef.value.mediciones)) attrRef.value.mediciones = {}
  dayKeys.forEach((day) => {
    if (!attrRef.value.mediciones[day.key] || typeof attrRef.value.mediciones[day.key] !== 'object') attrRef.value.mediciones[day.key] = {}
    attrRef.value.mediciones[day.key].horometro ??= ''
  })

  if (!attrRef.value.respuestas || typeof attrRef.value.respuestas !== 'object' || Array.isArray(attrRef.value.respuestas)) attrRef.value.respuestas = {}
  groups.forEach((grp) => {
    grp.items.forEach((it) => {
      if (!attrRef.value.respuestas[it.key] || typeof attrRef.value.respuestas[it.key] !== 'object') attrRef.value.respuestas[it.key] = {}
      dayKeys.forEach((day) => {
        attrRef.value.respuestas[it.key][day.key] = normalizeState(attrRef.value.respuestas[it.key][day.key], grp.mode)
      })
    })
  })

  if (typeof attrRef.value.observacionesDanos !== 'string') attrRef.value.observacionesDanos = ''
}

function normalizeState(value, mode) {
  const v = String(value ?? '').trim().toLowerCase()
  if (mode === 'bm') return ['b', 'm'].includes(v) ? v : ''
  return ['si', 'no'].includes(v) ? v : ''
}

function optionsFor(mode) {
  return mode === 'bm'
    ? [{ value: 'b', label: 'B' }, { value: 'm', label: 'M' }]
    : [{ value: 'si', label: 'SI' }, { value: 'no', label: 'NO' }]
}

function selectDay(dayKey) {
  selectedDay.value = dayKey
  if (!getDayDate(dayKey)) setDayDate(dayKey, todayIso())
}

function getDayDate(dayKey) {
  return attrRef.value.fechas?.[dayKey] ?? ''
}

function setDayDate(dayKey, value) {
  attrRef.value.fechas ||= {}
  attrRef.value.fechas[dayKey] = value
  touch()
}

function getDayMetric(dayKey, key) {
  return attrRef.value.mediciones?.[dayKey]?.[key] ?? ''
}

function setDayMetric(dayKey, key, value) {
  attrRef.value.mediciones ||= {}
  attrRef.value.mediciones[dayKey] ||= {}
  attrRef.value.mediciones[dayKey][key] = value
  touch()
}

function setDato(key, value) {
  attrRef.value.datos ||= {}
  attrRef.value.datos[key] = value
  touch()
}

function getItemDayState(itemKey, dayKey) {
  return attrRef.value.respuestas?.[itemKey]?.[dayKey] ?? ''
}

function setItemDayState(itemKey, dayKey, value) {
  attrRef.value.respuestas ||= {}
  attrRef.value.respuestas[itemKey] ||= {}
  attrRef.value.respuestas[itemKey][dayKey] = attrRef.value.respuestas[itemKey][dayKey] === value ? '' : value
  touch()
}

function setObservacionesDanos(value) {
  attrRef.value.observacionesDanos = value
  touch()
}

function touch() {
  attrRef.value.__touched = Date.now()
  emit('change')
}
</script>

<style scoped>
.checklist-alza-hombre-dmh {
  width: 100%;
}

.dmh-panels,
.group-list,
.item-list {
  display: grid;
  gap: 10px;
}

.dmh-card {
  width: 100%;
  max-width: none !important;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.52) !important;
}

.dmh-title {
  min-height: 46px;
  padding: 10px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: 0;
  white-space: normal;
}

.dmh-card :deep(.v-expansion-panel-text__wrapper) {
  padding: 10px !important;
}

.checklist-alza-hombre-dmh :deep(.v-field) {
  background: rgba(2, 6, 23, 0.56) !important;
  border-radius: 8px;
}

.checklist-alza-hombre-dmh :deep(.v-field__outline) {
  color: rgba(148, 163, 184, 0.48) !important;
}

.checklist-alza-hombre-dmh :deep(.v-label),
.checklist-alza-hombre-dmh :deep(.v-field__input),
.checklist-alza-hombre-dmh :deep(input),
.checklist-alza-hombre-dmh :deep(textarea) {
  color: #e5eefb !important;
  opacity: 1 !important;
}

.day-tabs {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 10px;
}

.day-tab,
.state-toggle {
  min-height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  background: rgba(71, 85, 105, 0.36);
  color: #dbeafe;
  font-size: 11px;
  font-weight: 900;
}

.day-tab--active,
.state-toggle--si,
.state-toggle--b {
  background: rgba(6, 95, 70, 0.5);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.state-toggle--no,
.state-toggle--m {
  background: rgba(127, 29, 29, 0.42);
  border-color: rgba(239, 68, 68, 0.65);
  color: #fee2e2;
}

.day-date,
.day-metrics {
  margin-bottom: 10px;
}

.group-block,
.item-card {
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.2);
}

.group-block {
  padding: 10px;
}

.group-title {
  margin: 0 0 10px;
  color: #e5eefb;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.15;
  text-transform: uppercase;
}

.item-card {
  display: grid;
  gap: 10px;
  padding: 10px;
}

.item-card__content {
  display: grid;
  gap: 3px;
}

.check-code {
  color: #5eead4;
  font-size: 11px;
  font-weight: 900;
}

.check-item {
  color: #e5eefb;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
}

.state-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.photo-block {
  display: grid;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.2);
}

.photo-title {
  color: #e5eefb;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.reference-image {
  display: block;
  width: 100%;
  min-height: 180px;
  max-height: 360px;
  object-fit: contain;
  border-radius: 8px;
  background: #ffffff;
}

.note-box {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
}

@media (min-width: 720px) {
  .item-card {
    grid-template-columns: 1fr 140px;
    align-items: center;
  }
}
</style>
