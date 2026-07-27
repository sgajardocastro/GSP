<template>
  <div class="checklist-camion-pluma-amsa">
    <v-row dense class="mb-3">
      <v-col v-for="field in headerFields" :key="field.key" cols="12" sm="6">
        <v-text-field
          :model-value="getDato(field.key)"
          :type="field.type || 'text'"
          :label="field.label"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="(value) => setDato(field.key, value)"
        />
      </v-col>
    </v-row>

    <section v-for="group in mainGroups" :key="group.id" class="section-block">
      <button type="button" class="section-title" @click="toggleSection(group.id)">
        <span>{{ group.title }}</span>
        <span class="section-actions">
          <span class="answered-count">{{ getGroupAnswered(group.id) }}/{{ group.items.length }}</span>
          <v-icon size="18">{{ isOpen(group.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </span>
      </button>

      <div v-show="isOpen(group.id)" class="section-body">
        <article v-for="item in group.items" :key="item.id" class="item-card">
          <strong>{{ item.label }}</strong>
          <div class="state-row">
            <button
              v-for="state in getStates(group.stateType)"
              :key="state.value"
              type="button"
              :disabled="disabled"
              :class="['state-toggle', getItemValue(group.id, item.id) === state.value ? `state-toggle--${state.value}` : '']"
              @click="setItemValue(group.id, item.id, state.value)"
            >
              {{ state.label }}
            </button>
          </div>
          <v-textarea
            :model-value="getItemObservation(group.id, item.id)"
            label="Observacion"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            hide-details
            :disabled="disabled"
            @update:model-value="(value) => setItemObservation(group.id, item.id, value)"
          />
        </article>
      </div>
    </section>

    <div class="double-header">Registro pruebas operacionales</div>

    <section v-for="test in testSections" :key="test.id" class="section-block">
      <button type="button" class="section-title" @click="toggleSection(test.id)">
        <span>{{ test.title }}</span>
        <span class="section-actions">
          <span class="answered-count">{{ getTestAnswered(test.id) }}/{{ test.items.length }}</span>
          <v-icon size="18">{{ isOpen(test.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </span>
      </button>

      <div v-show="isOpen(test.id)" class="section-body">
        <article v-for="item in test.items" :key="item.id" class="item-card">
          <strong>{{ item.label }}</strong>
          <p v-if="item.help" class="help-text">{{ item.help }}</p>
          <div class="state-row">
            <button
              v-for="state in statesBmna"
              :key="state.value"
              type="button"
              :disabled="disabled"
              :class="['state-toggle', getTestValue(test.id, item.id) === state.value ? `state-toggle--${state.value}` : '']"
              @click="setTestValue(test.id, item.id, state.value)"
            >
              {{ state.label }}
            </button>
          </div>
        </article>

        <v-textarea
          :model-value="getTestObservation(test.id)"
          label="Observaciones"
          variant="outlined"
          density="compact"
          rows="2"
          auto-grow
          hide-details
          :disabled="disabled"
          @update:model-value="(value) => setTestObservation(test.id, value)"
        />
      </div>
    </section>

    <section class="section-block">
      <button type="button" class="section-title" @click="toggleSection('surcos')">
        <span>Registro estado y medicion de surcos de neumaticos</span>
        <span class="section-actions">
          <span class="answered-count">{{ tireAnswered }}/{{ tireTotal }}</span>
          <v-icon size="18">{{ isOpen('surcos') ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </span>
      </button>

      <div v-show="isOpen('surcos')" class="section-body">
        <article class="item-card">
          <strong>Inspeccion visual de los neumaticos.</strong>
          <div class="state-row">
            <button
              v-for="state in statesBmna"
              :key="state.value"
              type="button"
              :disabled="disabled"
              :class="['state-toggle', getTireState() === state.value ? `state-toggle--${state.value}` : '']"
              @click="setTireState(state.value)"
            >
              {{ state.label }}
            </button>
          </div>
        </article>

        <div class="tire-grid">
          <v-text-field
            v-for="position in tirePositions"
            :key="position.key"
            :model-value="getTireDepth(position.key)"
            :label="position.label"
            suffix="mm"
            variant="outlined"
            density="compact"
            hide-details
            :disabled="disabled"
            @update:model-value="(value) => setTireDepth(position.key, value)"
          />
        </div>

        <v-textarea
          :model-value="getTireObservation()"
          label="Observaciones"
          variant="outlined"
          density="compact"
          rows="2"
          auto-grow
          hide-details
          :disabled="disabled"
          @update:model-value="setTireObservation"
        />
      </div>
    </section>

    <v-textarea
      :model-value="getGeneralObservation()"
      label="Observaciones generales"
      variant="outlined"
      density="compact"
      rows="3"
      auto-grow
      hide-details
      :disabled="disabled"
      class="mt-3"
      @update:model-value="setGeneralObservation"
    />
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

const headerFields = [
  { key: 'contrato', label: 'Contrato' },
  { key: 'modelo', label: 'Modelo' },
  { key: 'marca', label: 'Marca' },
  { key: 'patente', label: 'Patente' },
  { key: 'fecha', label: 'Fecha', type: 'date' },
  { key: 'area', label: 'Area' },
  { key: 'kilometraje', label: 'Kilometraje' },
  { key: 'nombreOperador', label: 'Nombre operador' },
  { key: 'nombreRigger', label: 'Nombre rigger' },
  { key: 'vencCertificacionCliente', label: 'Venc. certificacion cliente', type: 'date' },
  { key: 'horometro', label: 'Horometro' },
  { key: 'vencCertificacionGps', label: 'Venc. certificacion GPS', type: 'date' }
]

const statesBmna = [
  { value: 'bueno', label: 'BUENO' },
  { value: 'malo', label: 'MALO' },
  { value: 'na', label: 'N/A' }
]

const statesSiNo = [
  { value: 'si', label: 'SI' },
  { value: 'no', label: 'NO' }
]

const mainGroups = [
  group('accesorios', 'Accesorios', 'bmna', [
    'Extintor.',
    'Botiquin.',
    'Triangulos o conos.',
    'Alarma retroceso.',
    'Cinta reflectante.',
    'Pertiga.',
    'Juego de cuñas.',
    'Logo empresa en puertas.',
    'Panel de control.',
    'Baliza.',
    'Limpia parabrisas.',
    'Radio base y/o handy.',
    'Almohadillas para cada estabilizador.',
    'Seguro barandas.',
    'Barandas.'
  ]),
  group('sistemaElectrico', 'Sistema electrico', 'bmna', [
    'Bateria y bornes.',
    'Motor de partida.',
    'Alternador.',
    'Lineas electricas.',
    'Corta corriente.'
  ]),
  group('luces', 'Luces', 'bmna', [
    'Luces altas.',
    'Luces bajas.',
    'Interior cabina.',
    'Luces de retroceso.',
    'Luces de viraje.',
    'Luces emergencia (gatos).',
    'Luz de freno.',
    'Tercera luz de freno.',
    'Luces de estacionamiento.',
    'Luz patente.',
    'Luz pertiga.',
    'Luz tablero.',
    'Neblineros.',
    'Foco faenero.',
    'Luces estanque.'
  ]),
  group('documentacion', 'Documentacion', 'bmna', [
    'Licencia municipal al dia.',
    'Licencia interna al dia.',
    'Permiso de circulacion al dia.',
    'Seguro obligatorio vigente.',
    'Certificado de revision tecnica.',
    'Certificado revision de gases.'
  ]),
  group('sistemasFrenos', 'Sistemas de frenos', 'bmna', [
    'Frenos de servicio.',
    'Frenos estacionamiento.',
    'Frenos de aire.',
    'Frenos de motor.'
  ]),
  group('operacionInvierno', 'Operacion invierno', 'bmna', [
    'Tensores.',
    'Grilletes.',
    'Linterna con pilas.',
    'Estrobo.',
    'Cadenas.',
    'Buzo de papel desechable.',
    'Saco arpillero (papero).',
    'Alicate.',
    'Destornillador paleta.',
    'Destornillador cruz.',
    'Pala.',
    'Frazada.'
  ]),
  group('direccion', 'Direccion', 'bmna', [
    'Mecanica.',
    'Hidraulica.',
    'Vibraciones.'
  ]),
  group('marcadores', 'Marcadores', 'bmna', [
    'Velocimetro.',
    'Tacometro.',
    'Cuenta kilometro.',
    'Marcador temperatura.'
  ]),
  group('espejos', 'Espejos', 'bmna', [
    'Retrovisor derecho.',
    'Retrovisor izquierdo.',
    'Interior.'
  ]),
  group('vidrios', 'Vidrios', 'bmna', [
    'Parabrisas delantero.',
    'Lateral derecho.',
    'Lateral izquierdo.',
    'Luneta (vidrio trasero).'
  ]),
  group('general', 'General', 'bmna', [
    'Cajon para guardar accesorios.',
    'Tubo de escape.',
    'Chasis.',
    'Estado de puertas.',
    'Escala de acceso.',
    'Cinturon de seguridad.',
    'Bocina.',
    'Asientos.',
    'Aseo interior.',
    'Aseo exterior.',
    'Filtros de aire.',
    'Fugas / filtraciones.',
    'Barra antivuelcos.',
    'Estado de la pluma.',
    'Mangueras.',
    'Valvulas.',
    'Aire acondicionado / calefaccion.',
    'Tablas de carga.',
    'Gancho cuenta con seguro.',
    'Control remoto de pluma.',
    'Estado del cable la pluma.',
    'Cuenta con limite swich el gancho.',
    'Estabilizadores.',
    'Amortiguadores.'
  ]),
  group('neumaticos', 'Neumaticos', 'bmna', [
    'Primer eje.',
    'Segundo eje.',
    'Tercer eje.',
    'Repuestos.',
    'Llave de rueda.',
    'Gata hidraulica.',
    'Desgaste de neumaticos.',
    'Presion de aire (PSI).',
    'Pernos neumaticos.'
  ]),
  group('niveles', 'Niveles', 'bmna', [
    'Nivel aceite sist. hidraulico.',
    'Nivel de agua.',
    'Nivel de combustible.',
    'Nivel de liquido frenos.',
    'Nivel de aceite motor.'
  ]),
  group('comunicaciones', 'Comunicaciones', 'sino', [
    'Existe comunicacion.',
    'Se realiza prueba.',
    'Se define canal.',
    'Comunicacion interna.',
    'Radio MLP.',
    'Canal.'
  ]),
  group('consultas', 'Consultas', 'sino', [
    'Estado fisico y psicologico / durmio mal.',
    'Sufrio enfermedad durante la noche.',
    'Tiene algun problema familiar.',
    'Toma medicamentos que produzca somnolencia.',
    'Ha consumido alcohol / drogas.',
    'Tiene problema fisico.',
    'Puede conducir?'
  ])
]

const testSections = [
  {
    id: 'pruebaFrenos',
    title: 'Registro prueba de frenos',
    items: [
      item(1, 'Pisar y presionar el pedal de freno y corroborar la profundidad.', 'Si el pedal se hunde poco a poco y toca fondo, es indicio de posible falla.'),
      item(2, 'Comprobar la capacidad de frenado al iniciar un movimiento leve del vehiculo.'),
      item(3, 'Intentar un pequeño desplazamiento con el freno de mano puesto.')
    ]
  },
  {
    id: 'pruebaDireccion',
    title: 'Registro prueba de direccion',
    items: [
      item(1, 'Mover la direccion en ambos sentidos, corroborando su buen funcionamiento en el desplazamiento.', 'Verificar ruidos, resistencia al movimiento, llegada a tope, etc.')
    ]
  }
]

const tirePositions = [
  { key: 'delanteroIzquierdo', label: 'Delantero izquierdo' },
  { key: 'delanteroDerecho', label: 'Delantero derecho' },
  { key: 'primerEjeIzquierdoExterior', label: '1er eje trasero izquierdo exterior' },
  { key: 'primerEjeIzquierdoInterior', label: '1er eje trasero izquierdo interior' },
  { key: 'primerEjeDerechoExterior', label: '1er eje trasero derecho exterior' },
  { key: 'primerEjeDerechoInterior', label: '1er eje trasero derecho interior' },
  { key: 'segundoEjeIzquierdoExterior', label: '2do eje trasero izquierdo exterior' },
  { key: 'segundoEjeIzquierdoInterior', label: '2do eje trasero izquierdo interior' },
  { key: 'segundoEjeDerechoExterior', label: '2do eje trasero derecho exterior' },
  { key: 'segundoEjeDerechoInterior', label: '2do eje trasero derecho interior' }
]

const openSections = ref([
  'accesorios',
  'sistemaElectrico',
  'pruebaFrenos',
  'pruebaDireccion',
  'surcos'
])

const tireAnswered = computed(() => {
  renderTick.value
  const hasState = String(attrRef.value?.neumaticosSurcos?.estado ?? '').trim() !== ''
  const depths = tirePositions.filter((position) => String(attrRef.value?.neumaticosSurcos?.profundidades?.[position.key] ?? '').trim() !== '').length
  return (hasState ? 1 : 0) + depths
})

const tireTotal = computed(() => tirePositions.length + 1)

onMounted(() => {
  ensureBody()
})

function group(id, title, stateType, labels) {
  return {
    id,
    title,
    stateType,
    items: labels.map((label, index) => item(index + 1, label))
  }
}

function item(numero, label, help = '') {
  return {
    id: `item-${numero}`,
    numero,
    label,
    help
  }
}

function ensureBody() {
  const attr = attrRef.value
  if (!attr.datos || typeof attr.datos !== 'object') attr.datos = {}
  if (!attr.datos.contrato) attr.datos.contrato = '4644009479'
  if (!Array.isArray(attr.grupos)) attr.grupos = []
  if (!attr.pruebas || typeof attr.pruebas !== 'object') attr.pruebas = {}
  if (!attr.neumaticosSurcos || typeof attr.neumaticosSurcos !== 'object') attr.neumaticosSurcos = {}
  if (!attr.neumaticosSurcos.profundidades || typeof attr.neumaticosSurcos.profundidades !== 'object') attr.neumaticosSurcos.profundidades = {}

  mainGroups.forEach((groupDef) => {
    let groupData = attr.grupos.find((candidate) => candidate?.id === groupDef.id)
    if (!groupData) {
      groupData = { id: groupDef.id, title: groupDef.title, items: [] }
      attr.grupos.push(groupData)
    }
    if (!Array.isArray(groupData.items)) groupData.items = []
    groupDef.items.forEach((itemDef) => {
      if (!groupData.items.some((candidate) => candidate?.id === itemDef.id)) {
        groupData.items.push({ id: itemDef.id, label: itemDef.label, estado: '', observacion: '' })
      }
    })
  })

  testSections.forEach((test) => {
    if (!attr.pruebas[test.id] || typeof attr.pruebas[test.id] !== 'object') {
      attr.pruebas[test.id] = { items: [], observacion: '' }
    }
    if (!Array.isArray(attr.pruebas[test.id].items)) attr.pruebas[test.id].items = []
    test.items.forEach((itemDef) => {
      if (!attr.pruebas[test.id].items.some((candidate) => candidate?.id === itemDef.id)) {
        attr.pruebas[test.id].items.push({ id: itemDef.id, label: itemDef.label, estado: '' })
      }
    })
  })
}

function touch() {
  renderTick.value += 1
  emit('change')
}

function getStates(type) {
  return type === 'sino' ? statesSiNo : statesBmna
}

function isOpen(id) {
  return openSections.value.includes(id)
}

function toggleSection(id) {
  openSections.value = isOpen(id)
    ? openSections.value.filter((section) => section !== id)
    : [...openSections.value, id]
}

function getDato(key) {
  renderTick.value
  ensureBody()
  return attrRef.value.datos?.[key] ?? ''
}

function setDato(key, value) {
  ensureBody()
  attrRef.value.datos[key] = value ?? ''
  touch()
}

function findGroup(groupId) {
  ensureBody()
  return attrRef.value.grupos.find((group) => group?.id === groupId)
}

function findGroupItem(groupId, itemId) {
  const groupData = findGroup(groupId)
  return groupData?.items?.find((itemData) => itemData?.id === itemId)
}

function getItemValue(groupId, itemId) {
  renderTick.value
  return findGroupItem(groupId, itemId)?.estado ?? ''
}

function setItemValue(groupId, itemId, value) {
  const itemData = findGroupItem(groupId, itemId)
  if (!itemData) return
  itemData.estado = itemData.estado === value ? '' : value
  touch()
}

function getItemObservation(groupId, itemId) {
  renderTick.value
  return findGroupItem(groupId, itemId)?.observacion ?? ''
}

function setItemObservation(groupId, itemId, value) {
  const itemData = findGroupItem(groupId, itemId)
  if (!itemData) return
  itemData.observacion = value ?? ''
  touch()
}

function getGroupAnswered(groupId) {
  renderTick.value
  const groupData = findGroup(groupId)
  return (groupData?.items || []).filter((itemData) => String(itemData?.estado ?? '').trim() !== '').length
}

function getTestData(testId) {
  ensureBody()
  return attrRef.value.pruebas[testId]
}

function findTestItem(testId, itemId) {
  return getTestData(testId)?.items?.find((itemData) => itemData?.id === itemId)
}

function getTestValue(testId, itemId) {
  renderTick.value
  return findTestItem(testId, itemId)?.estado ?? ''
}

function setTestValue(testId, itemId, value) {
  const itemData = findTestItem(testId, itemId)
  if (!itemData) return
  itemData.estado = itemData.estado === value ? '' : value
  touch()
}

function getTestAnswered(testId) {
  renderTick.value
  return (getTestData(testId)?.items || []).filter((itemData) => String(itemData?.estado ?? '').trim() !== '').length
}

function getTestObservation(testId) {
  renderTick.value
  return getTestData(testId)?.observacion ?? ''
}

function setTestObservation(testId, value) {
  getTestData(testId).observacion = value ?? ''
  touch()
}

function getTireState() {
  renderTick.value
  ensureBody()
  return attrRef.value.neumaticosSurcos?.estado ?? ''
}

function setTireState(value) {
  ensureBody()
  attrRef.value.neumaticosSurcos.estado = attrRef.value.neumaticosSurcos.estado === value ? '' : value
  touch()
}

function getTireDepth(key) {
  renderTick.value
  ensureBody()
  return attrRef.value.neumaticosSurcos.profundidades?.[key] ?? ''
}

function setTireDepth(key, value) {
  ensureBody()
  attrRef.value.neumaticosSurcos.profundidades[key] = value ?? ''
  touch()
}

function getTireObservation() {
  renderTick.value
  ensureBody()
  return attrRef.value.neumaticosSurcos?.observacion ?? ''
}

function setTireObservation(value) {
  ensureBody()
  attrRef.value.neumaticosSurcos.observacion = value ?? ''
  touch()
}

function getGeneralObservation() {
  renderTick.value
  ensureBody()
  return attrRef.value.observacionesGenerales ?? ''
}

function setGeneralObservation(value) {
  attrRef.value.observacionesGenerales = value ?? ''
  touch()
}
</script>

<style scoped>
.checklist-camion-pluma-amsa {
  color: #e5e7eb;
}

.section-block {
  border: 1px solid rgba(34, 211, 238, 0.38);
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.72);
}

.section-title {
  align-items: center;
  background: #1f2937;
  border: 0;
  color: #f8fafc;
  cursor: pointer;
  display: flex;
  font-weight: 800;
  justify-content: space-between;
  letter-spacing: 0;
  min-height: 44px;
  padding: 10px 14px;
  text-align: left;
  text-transform: uppercase;
  width: 100%;
}

.section-actions {
  align-items: center;
  display: inline-flex;
  gap: 8px;
  margin-left: 10px;
}

.answered-count {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.55);
  border-radius: 999px;
  color: #a7f3d0;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 2px 8px;
  white-space: nowrap;
}

.section-body {
  display: grid;
  gap: 10px;
  padding: 10px;
}

.item-card {
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  padding: 10px;
}

.help-text {
  color: #cbd5e1;
  font-size: 0.82rem;
  margin: 0;
}

.state-row {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.state-toggle {
  background: #1f2937;
  border: 1px solid #475569;
  border-radius: 7px;
  color: #f8fafc;
  font-size: 0.8rem;
  font-weight: 900;
  min-height: 34px;
  padding: 7px 8px;
}

.state-toggle:disabled {
  cursor: default;
  opacity: 0.7;
}

.state-toggle--bueno,
.state-toggle--si {
  background: #064e3b;
  border-color: #10b981;
}

.state-toggle--malo,
.state-toggle--no {
  background: #7f1d1d;
  border-color: #ef4444;
}

.state-toggle--na {
  background: #374151;
  border-color: #94a3b8;
}

.double-header {
  background: #0f766e;
  border: 1px solid rgba(45, 212, 191, 0.7);
  border-radius: 8px;
  color: #ecfeff;
  font-weight: 900;
  margin: 14px 0 10px;
  padding: 10px 14px;
  text-transform: uppercase;
}

.tire-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 600px) {
  .tire-grid {
    grid-template-columns: 1fr;
  }

  .state-row {
    gap: 4px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .state-toggle {
    font-size: 0.68rem;
    min-height: 32px;
    padding: 6px 4px;
  }
}
</style>
