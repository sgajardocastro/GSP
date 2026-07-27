<template>
  <div class="checklist-cama-baja">
    <v-expansion-panels v-model="openSections" multiple class="cb-panels">
      <v-expansion-panel
        v-for="section in sections"
        :key="section.key"
        :value="section.key"
        class="cb-card"
      >
        <v-expansion-panel-title class="cb-title">
          {{ section.title }}
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="item-list">
            <div
              v-for="item in getSectionItems(section.key)"
              :key="item.key"
              class="item-card"
            >
              <div class="item-card__content">
                <div class="check-item">{{ item.item }}</div>
                <div class="check-verification">{{ item.verificacion }}</div>
              </div>

              <div class="state-row">
                <div class="state-buttons">
                  <button
                    type="button"
                    :class="['state-toggle', item.estado === 'ok' ? 'state-toggle--ok' : '']"
                    :disabled="disabled"
                    @click="setEstado(item, 'ok')"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    :class="['state-toggle', item.estado === 'no' ? 'state-toggle--no' : '']"
                    :disabled="disabled"
                    @click="setEstado(item, 'no')"
                  >
                    NO
                  </button>
                  <button
                    type="button"
                    :class="['state-toggle', item.estado === 'na' ? 'state-toggle--na' : '']"
                    :disabled="disabled"
                    @click="setEstado(item, 'na')"
                  >
                    N/A
                  </button>
                </div>
              </div>

              <div class="observation-field">
                <v-text-field
                  :model-value="item.observaciones"
                  label="Observaciones"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  @update:model-value="(value) => setObservaciones(item, value)"
                />
              </div>
            </div>
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

const sections = [
  {
    key: 'condicionesGeneralesVehiculo',
    title: '1.-CONDICIONES GENERALES DEL VEHICULO (CAMA BAJA)',
    items: [
      { item: 'Estado general de la cama baja', verificacion: 'Sin danos estructurales visibles' },
      { item: 'Superficie de apoyo', verificacion: 'Limpia, seca, sin aceite ni material suelto' },
      { item: 'Barandas / topes', verificacion: 'En buen estado y firmes' },
      { item: 'Puntos de anclaje', verificacion: 'Integros, sin fisuras ni deformaciones' },
      { item: 'Ejes y suspension', verificacion: 'Sin fugas ni ruidos anormales' },
      { item: 'Neumaticos', verificacion: 'Presion adecuada, sin cortes ni desgaste excesivo' },
      { item: 'Sistema de frenos', verificacion: 'Operativos y probados' },
      { item: 'Luces y senalizacion', verificacion: 'Operativas (posicion, freno, intermitentes)' },
      { item: 'Balizas y reflectantes', verificacion: 'Presentes y operativos' }
    ]
  },
  {
    key: 'posicionamientoCarga',
    title: '2. POSICIONAMIENTO DE LA CARGA SOBRE CAMA BAJA',
    items: [
      { item: 'Carga centrada', verificacion: 'Distribucion uniforme del peso' },
      { item: 'Altura de carga', verificacion: 'Dentro de limites permitidos' },
      { item: 'Apoyos', verificacion: 'Uso de durmientes / cunas / tacos' },
      { item: 'Contacto carga-superficie', verificacion: 'Sin cantos vivos directos' },
      { item: 'Proteccion', verificacion: 'Uso de goma, madera o proteccion antideslizante' }
    ]
  },
  {
    key: 'trinquetes',
    title: '3. CHECK LIST ESPECIFICO - AMARRE DE CARGAS (TRINQUETES / CADENAS) - 3.1 TRINQUETES',
    items: [
      { item: 'Certificacion', verificacion: 'Trinquetes certificados y legibles' },
      { item: 'Capacidad (WLL)', verificacion: 'Adecuada al peso de la carga' },
      { item: 'Estado cinta', verificacion: 'Sin cortes, deshilachados ni desgaste' },
      { item: 'Mecanismo', verificacion: 'Trinquete acciona y bloquea correctamente' },
      { item: 'Cantidad', verificacion: 'Numero suficiente segun peso y geometria' },
      { item: 'Tension', verificacion: 'Carga firmemente asegurada, sin holguras' },
      { item: 'Proteccion', verificacion: 'Uso de protectores en zonas de roce' },
      { item: 'Direccion del amarre', verificacion: 'En X, cruzado o directo segun diseno' }
    ]
  },
  {
    key: 'cadenasEslingas',
    title: '4.-CADENAS / ESLINGAS (SI APLICA)',
    items: [
      { item: 'Tipo y grado', verificacion: 'Grado adecuado (ej. G80 / G100)' },
      { item: 'Identificacion', verificacion: 'Etiqueta o marcaje visible' },
      { item: 'Estado', verificacion: 'Sin elongacion, fisuras o corrosion' },
      { item: 'Ganchos', verificacion: 'Con seguro y sin deformacion' },
      { item: 'Puntos de anclaje', verificacion: 'Disenados para amarre de carga' }
    ]
  },
  {
    key: 'seguridadOperacional',
    title: '5. SEGURIDAD OPERACIONAL',
    items: [
      { item: 'ART / AST', verificacion: 'Realizado y firmado' },
      { item: 'EPP', verificacion: 'Casco, chaleco, guantes, calzado' },
      { item: 'Area despejada', verificacion: 'Sin personas en zona de riesgo' },
      { item: 'Senalizacion', verificacion: 'Conos, cinta, banderilleros' },
      { item: 'Comunicacion', verificacion: 'Coordinacion operador-rigger-conductor' }
    ]
  },
  {
    key: 'verificacionFinal',
    title: '6. VERIFICACION FINAL ANTES DE SALIDA',
    items: [
      { item: 'Revision final de amarres', verificacion: 'Reapriete realizado' },
      { item: 'Carga estable', verificacion: 'Sin desplazamiento' },
      { item: 'Documentacion', verificacion: 'Guia / permisos / escolta' },
      { item: 'Ruta definida', verificacion: 'Considera altura, peso y radios de giro' }
    ]
  }
]

const openSections = ref(sections.map((section) => section.key))

onMounted(() => {
  ensureBody()
})

function toKey(label, index) {
  return `${index + 1}-${label}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeEstado(value) {
  const v = String(value ?? '').trim().toLowerCase()
  if (v === 'n/a') return 'na'
  return ['ok', 'no', 'na'].includes(v) ? v : ''
}

function ensureBody() {
  if (!attrRef.value.secciones || typeof attrRef.value.secciones !== 'object' || Array.isArray(attrRef.value.secciones)) {
    attrRef.value.secciones = {}
  }

  sections.forEach((section) => {
    const saved = Array.isArray(attrRef.value.secciones[section.key]) ? attrRef.value.secciones[section.key] : []
    attrRef.value.secciones[section.key] = section.items.map((base, index) => {
      const key = toKey(base.item, index)
      const current = saved.find((item) => item?.key === key || item?.item === base.item) || {}
      return {
        key,
        item: base.item,
        verificacion: base.verificacion,
        estado: normalizeEstado(current.estado),
        observaciones: String(current.observaciones ?? current.observacion ?? '')
      }
    })
  })
}

function getSectionItems(sectionKey) {
  return Array.isArray(attrRef.value.secciones?.[sectionKey]) ? attrRef.value.secciones[sectionKey] : []
}

function setEstado(item, estado) {
  item.estado = item.estado === estado ? '' : estado
  touch()
}

function setObservaciones(item, value) {
  item.observaciones = value
  touch()
}

function touch() {
  attrRef.value.__touched = Date.now()
  emit('change')
}
</script>

<style scoped>
.checklist-cama-baja {
  width: 100%;
}

.cb-panels {
  display: grid;
  gap: 10px;
}

.cb-card {
  width: 100%;
  max-width: none !important;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  border-radius: 10px !important;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.52) !important;
}

.cb-title {
  min-height: 46px;
  padding: 10px 12px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: 0;
  white-space: normal;
}

.cb-card :deep(.v-expansion-panel-text__wrapper) {
  padding: 10px !important;
}

.item-list {
  display: grid;
  gap: 10px;
}

.item-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(20, 184, 166, 0.42);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.2);
}

.item-card__content {
  display: grid;
  gap: 4px;
}

.check-item,
.check-verification {
  color: #e5eefb;
  font-size: 13px;
  line-height: 1.25;
}

.check-item {
  font-weight: 800;
}

.check-verification {
  color: #cbd5e1;
  font-size: 12px;
}

.state-row {
  display: flex;
  justify-content: flex-start;
}

.state-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
}

.state-toggle {
  min-width: 0;
  min-height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 7px;
  background: rgba(71, 85, 105, 0.36);
  color: #dbeafe;
  font-size: 11px;
  font-weight: 900;
}

.observation-field {
  width: 100%;
}

.observation-field :deep(.v-field) {
  background: rgba(2, 6, 23, 0.56) !important;
  border-radius: 8px;
}

.observation-field :deep(.v-field__outline) {
  color: rgba(148, 163, 184, 0.48) !important;
}

.observation-field :deep(.v-label),
.observation-field :deep(.v-field__input),
.observation-field :deep(input) {
  color: #e5eefb !important;
  opacity: 1 !important;
}

.state-toggle:disabled {
  opacity: 0.55;
}

.state-toggle--ok {
  background: rgba(6, 95, 70, 0.5);
  border-color: rgba(16, 185, 129, 0.75);
  color: #dcfce7;
}

.state-toggle--no {
  background: rgba(127, 29, 29, 0.42);
  border-color: rgba(239, 68, 68, 0.65);
  color: #fee2e2;
}

.state-toggle--na {
  background: rgba(113, 63, 18, 0.5);
  border-color: rgba(245, 158, 11, 0.72);
  color: #fef3c7;
}

@media (min-width: 760px) {
  .item-card {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .item-card__content {
    grid-column: 1;
  }

  .state-row {
    grid-column: 2;
    grid-row: 1;
    justify-content: flex-end;
  }

  .state-buttons {
    width: 270px;
  }

  .observation-field {
    grid-column: 1 / -1;
  }
}
</style>
