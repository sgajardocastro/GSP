<template>
  <div class="checklist-camion-grua-dmh">
    <v-expansion-panels v-model="openSections" multiple class="dmh-panels">
      <v-expansion-panel value="datos" class="dmh-card">
        <v-expansion-panel-title class="dmh-title">
          DATOS
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="attrRef.datos?.patente"
                label="Patente"
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
        <v-expansion-panel-title class="dmh-title">
          INSPECCION DIARIA
        </v-expansion-panel-title>

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
                :model-value="getDayMetric(selectedDay, 'kilometraje')"
                label="Kilometraje"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setDayMetric(selectedDay, 'kilometraje', value)"
              />
            </v-col>
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

                  <div class="state-buttons" :class="group.mode === 'bm' ? 'state-buttons--bm' : ''">
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
        <v-expansion-panel-title class="dmh-title">
          OBSERVACIONES Y NOTAS
        </v-expansion-panel-title>

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
          <div class="note-box">
            En caso de declarar alguna condicion critica, el conductor esta obligado a detener el vehiculo, no iniciar sus servicios e informar tal condicion a su supervisor. Sera obligacion del supervisor chequear la condicion informada y derivar al vehiculo al taller correspondiente.
          </div>
          <div class="note-box note-box--compact">
            B = BUENO, M = MALO.
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, toRef } from 'vue'

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
  {
    key: 'documentos',
    title: 'Documentos',
    mode: 'sino',
    items: [
      item('1.1', 'Documentacion del Camion (critico)')
    ]
  },
  {
    key: 'identificacion',
    title: 'Identificacion',
    mode: 'bm',
    items: [item('2.1', 'Logos y numero de identificacion')]
  },
  {
    key: 'luces',
    title: 'Sistemas de Seguridad Activa - Luces',
    mode: 'bm',
    items: [
      item('3.1', 'Luces interiores'),
      item('3.2', 'Luces Intermitentes'),
      item('3.3', 'Luces Altas y bajas (critico)'),
      item('3.4', 'Luz de freno (critico)'),
      item('3.5', 'Luces de Trocha'),
      item('3.6', 'Alarma de retroceso (critico)')
    ]
  },
  {
    key: 'neumaticos',
    title: 'Neumaticos',
    mode: 'sino',
    items: [
      item('4.1', 'Desgaste de banda (critico)'),
      item('4.2', 'Corte lateral (critico)'),
      item('4.3', 'Dibujo de neumatico'),
      item('4.4', 'Neumatico de repuesto'),
      item('4.5', 'Seguro de Traba Tuercas de Ruedas (critico)')
    ]
  },
  {
    key: 'esp',
    title: 'Estabilidad (ESP)',
    mode: 'sino',
    items: [
      item('5.1', 'Se advierte algun tipo de falla en sensor de tablero')
    ]
  },
  {
    key: 'frenos',
    title: 'Frenos',
    mode: 'bm',
    items: [
      item('6.1', 'Freno de mano (critico)'),
      item('6.2', 'Freno de pedal (critico)'),
      item('6.3', 'Freno de Aire (critico)'),
      item('6.4', 'Freno manual de motor retardado')
    ]
  },
  {
    key: 'cabinaActiva',
    title: 'Cabina',
    mode: 'bm',
    items: [
      item('7.2', 'Espejo retrovisor (critico)'),
      item('7.3', 'Desempanador de vidrio'),
      item('7.4', 'Asientos'),
      item('7.5', 'Bocina (critico)'),
      item('7.6', 'Aire acondicionado-calefaccion (critico)'),
      item('7.7', 'Alza vidrio'),
      item('7.8', 'Marcador de temperatura (critico)'),
      item('7.9', 'Marcador de combustible'),
      item('7.10', 'Camara de Retroceso (critico)')
    ]
  },
  {
    key: 'seguridadPasiva',
    title: 'Sistemas de Seguridad Pasiva - Cabina',
    mode: 'bm',
    items: [
      item('8.1', 'Cinturones de seguridad (critico)'),
      item('8.2', 'Parabrisas (critico)'),
      item('8.3', 'Air Bag'),
      item('8.4', 'Asientos (apoyacabezas)')
    ]
  },
  {
    key: 'equipamientoSeguridad',
    title: 'Sistemas Complementarios - Equipamiento de Seguridad',
    mode: 'bm',
    items: [
      item('10.1', 'Triangulos'),
      item('10.2', 'Llave Rueda'),
      item('10.3', 'Botiquin'),
      item('10.4', 'Extintor y tarjeta'),
      item('10.5', 'Cunas (critico)')
    ]
  },
  {
    key: 'equipoExterior',
    title: 'Equipo / Exterior / Izaje',
    mode: 'bm',
    items: [
      item('11.1', 'Nivel de liquido refrigerante'),
      item('11.2', 'Nivel de aceite'),
      item('11.3', 'Nivel de Adblue'),
      item('11.4', 'Corta corriente (critico)'),
      item('11.5', 'Parada de emergencia (critico)'),
      item('11.6', 'Carroceria en general'),
      item('11.7', 'Peldanos acceso cabina'),
      item('11.8', 'Escala Acceso a Plataforma'),
      item('11.9', 'Portalones, pilares y seguros'),
      item('11.10', 'Parachoques'),
      item('11.11', 'Estado de almohadillas'),
      item('11.12', 'Estado de estabilizadores'),
      item('11.13', 'Estado del gancho'),
      item('11.14', 'Estado y funcionamiento PAT o LMI'),
      item('11.15', 'Alarma de giro de la pluma'),
      item('11.16', 'Condicion del cable de elevacion'),
      item('11.17', 'Limitador de giro de pluma/jaula virtual'),
      item('11.18', 'Limitador de carrera'),
      item('11.19', 'Estabilizadores senalizados con cinta reflectante'),
      item('11.20', 'Largo del cordel del doble de longitud de la altura de la carga'),
      item('11.21', 'Teflon y guia'),
      item('11.22', 'Posicion cable de elevacion con guias y poleas'),
      item('11.23', 'Pilares de soporte')
    ]
  },
  {
    key: 'direccion',
    title: 'Direccion',
    mode: 'sino',
    items: [
      item('12.1', 'Volante duro/con juego (critico)'),
      item('12.2', 'Vibracion (critico)')
    ]
  },
  {
    key: 'suspension',
    title: 'Suspension',
    mode: 'sino',
    items: [
      item('13.1', 'Vehiculo desnivelado'),
      item('13.2', 'Ruidos extranos al frenar'),
      item('13.3', 'Vehiculo se recarga hacia un lado')
    ]
  }
]

const openSections = ref(['datos', 'inspeccion', 'observaciones'])
const selectedDay = ref('miercoles')

const currentDayLabel = computed(() => dayKeys.find((d) => d.key === selectedDay.value)?.label || '')

onMounted(() => {
  ensureBody()
})

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
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  return raw
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
    if (!attrRef.value.mediciones[day.key] || typeof attrRef.value.mediciones[day.key] !== 'object') {
      attrRef.value.mediciones[day.key] = {}
    }
    attrRef.value.mediciones[day.key].kilometraje ??= ''
    attrRef.value.mediciones[day.key].horometro ??= ''
  })

  if (!attrRef.value.respuestas || typeof attrRef.value.respuestas !== 'object' || Array.isArray(attrRef.value.respuestas)) attrRef.value.respuestas = {}
  groups.forEach((group) => {
    group.items.forEach((it) => {
      if (!attrRef.value.respuestas[it.key] || typeof attrRef.value.respuestas[it.key] !== 'object') attrRef.value.respuestas[it.key] = {}
      dayKeys.forEach((day) => {
        attrRef.value.respuestas[it.key][day.key] = normalizeState(attrRef.value.respuestas[it.key][day.key], group.mode)
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
.checklist-camion-grua-dmh {
  width: 100%;
}

.dmh-panels {
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

.checklist-camion-grua-dmh :deep(.v-field) {
  background: rgba(2, 6, 23, 0.56) !important;
  border-radius: 8px;
}

.checklist-camion-grua-dmh :deep(.v-field__outline) {
  color: rgba(148, 163, 184, 0.48) !important;
}

.checklist-camion-grua-dmh :deep(.v-label),
.checklist-camion-grua-dmh :deep(.v-field__input),
.checklist-camion-grua-dmh :deep(input),
.checklist-camion-grua-dmh :deep(textarea) {
  color: #e5eefb !important;
  opacity: 1 !important;
}

.item-card,
.group-block {
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.2);
}

.group-title {
  color: #e5eefb;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.15;
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

.day-date {
  margin-bottom: 10px;
}

.group-list,
.item-list {
  display: grid;
  gap: 10px;
}

.group-block {
  padding: 10px;
}

.group-title {
  margin: 0 0 10px;
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

.note-box {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.38);
  color: #cbd5e1;
  font-size: 12px;
  line-height: 1.35;
}

.note-box--compact {
  font-weight: 900;
}

@media (min-width: 760px) {
  .item-card {
    grid-template-columns: minmax(0, 1fr) 140px;
    align-items: center;
  }
}

@media (max-width: 620px) {
  .day-tabs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>

