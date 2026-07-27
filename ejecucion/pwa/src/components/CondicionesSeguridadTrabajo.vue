<template>
  <div>
    <v-alert v-if="showIntroHeader" type="info" variant="tonal" density="compact" class="mb-3 intro-alert">
      Marca <strong>Aplica</strong> o <strong>No aplica</strong> por bloque. Si el bloque aplica, evalua cada item con
      <strong>NA / C / I / RI</strong>. En <strong>I</strong> o <strong>RI</strong> debes indicar severidad y observacion.
      En item <strong>OTROS</strong>, la observacion es obligatoria.
    </v-alert>

    <v-card v-if="showIntroHeader" variant="outlined" class="rounded-lg mb-3 legend-card">
      <v-card-text class="py-2 px-3">
        <div class="text-caption font-weight-bold mb-1">LEYENDA</div>
        <div class="d-flex flex-wrap ga-2 text-caption">
          <v-chip size="x-small" label>NA: No aplica</v-chip>
          <v-chip size="x-small" label>C: Correcta</v-chip>
          <v-chip size="x-small" label>I: Incorrecto</v-chip>
          <v-chip size="x-small" label>RI: Resuelto in situ</v-chip>
          <v-chip size="x-small" label>L/G/MG: Tipificacion</v-chip>
        </div>
      </v-card-text>
    </v-card>

    <v-card variant="outlined" class="rounded-lg mb-4">
      <v-card-title class="py-3 parent-group-header">
        <div class="d-flex align-center justify-space-between w-100">
          <div class="text-subtitle-1 font-weight-bold block-header-title">
            {{ groupTitle }}
          </div>
          <v-btn
            icon
            size="x-small"
            variant="text"
            class="block-header-toggle"
            :title="isGroupCollapsed ? 'Expandir' : 'Colapsar'"
            @click="toggleGroup"
          >
            <v-icon :icon="isGroupCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'" />
          </v-btn>
        </div>
      </v-card-title>

      <v-expand-transition>
        <div v-show="!isGroupCollapsed" class="px-2 pb-2">
          <div
            v-for="(block, bIdx) in blocks"
            :key="`cst-block-${bIdx}`"
            class="mb-4"
          >
            <v-card variant="outlined" class="rounded-lg">
              <v-card-title class="py-3">
                <div v-if="block.sectionTitle" class="block-section-title mb-2">
                  {{ block.sectionTitle }}
                </div>
                <div class="d-flex align-center justify-space-between w-100">
                  <div class="text-subtitle-2 font-weight-bold block-header-title">{{ block.title }}</div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    class="block-header-toggle"
                    :title="block.__collapsed ? 'Expandir' : 'Colapsar'"
                    @click="toggleBlock(block)"
                  >
                    <v-icon :icon="block.__collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'" />
                  </v-btn>
                </div>
                <v-btn-toggle
                  :model-value="block.aplica"
                  density="compact"
                  class="mt-2 apply-toggle"
                  :disabled="disabled || isSuperiorMode"
                  @update:model-value="(val) => onBlockApplyChange(block, val)"
                >
                  <v-btn value="aplica" size="small" class="apply-btn apply-btn--ok">Aplica</v-btn>
                  <v-btn value="no_aplica" size="small" class="apply-btn apply-btn--na">No aplica</v-btn>
                </v-btn-toggle>
                <v-alert
                  v-if="block.infoText"
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mt-2 block-info-alert"
                >
                  {{ block.infoText }}
                </v-alert>
              </v-card-title>

              <v-card-text v-show="!block.__collapsed" class="pt-0">
                <v-alert
                  v-if="block.aplica === 'no_aplica'"
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mb-2"
                >
                  Bloque marcado como no aplica. Los items quedan en estado NA.
                </v-alert>

                <div
                  v-for="(item, iIdx) in block.items"
                  :key="`cst-item-${bIdx}-${iIdx}`"
                  class="item-row mb-3"
                >
                  <div class="d-flex align-start justify-space-between flex-wrap ga-2">
                    <div class="item-title">
                      <strong>{{ item.codigo }}</strong> - {{ item.label }}
                    </div>
                    <v-btn-toggle
                      :model-value="item.estado"
                      density="compact"
                      mandatory
                      class="estado-toggle state-group"
                      :disabled="disabled || block.aplica === 'no_aplica' || isSuperiorMode"
                      @update:model-value="(val) => onEstadoChange(block, item, val)"
                    >
                      <v-btn
                        v-for="estado in estadoOptions"
                        :key="estado"
                        :value="estado"
                        size="x-small"
                        class="state-btn"
                        :class="`state-btn--${String(estado).toLowerCase()}`"
                      >
                        {{ estado }}
                      </v-btn>
                    </v-btn-toggle>
                  </div>

                  <div class="mt-2">
                    <div class="text-caption mb-1">Tipificacion (L / G / MG)</div>
                    <v-btn-toggle
                      :model-value="item.severidad"
                      density="compact"
                      class="severidad-toggle"
                      :disabled="disabled || block.aplica === 'no_aplica' || !requiresSeveridad(item) || isSuperiorMode"
                      @update:model-value="(val) => onSeveridadChange(item, val)"
                    >
                      <v-btn
                        v-for="sev in severidadOptions"
                        :key="sev"
                        :value="sev"
                        size="x-small"
                        class="sev-btn"
                        :class="[`sev-btn--${String(sev).toLowerCase()}`, { 'sev-forbidden': !isSeveridadAllowed(item, sev) }]"
                        :disabled="!isSeveridadAllowed(item, sev)"
                      >
                        {{ sev }}
                      </v-btn>
                    </v-btn-toggle>
                  </div>

                  <v-textarea
                    v-model="item.observacion"
                    class="mt-2"
                    variant="outlined"
                    density="compact"
                    rows="2"
                    auto-grow
                    :disabled="disabled || block.aplica === 'no_aplica' || isSuperiorMode"
                    :label="getObsLabel(item)"
                    :error="isObsInvalid(item)"
                    :hint="getObsHint(item)"
                    persistent-hint
                    @update:model-value="touch()"
                  />
                </div>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </v-expand-transition>
    </v-card>

    <!-- Sección de Cierre de Desviaciones (Solo si hay desviaciones o Modo Superior) -->
    <v-card v-if="hasDesviacion || isSuperiorMode" variant="outlined" class="rounded-lg mb-4 mt-2 border-red-input-container">
      <v-card-title class="py-3 bg-red-darken-4 text-white rounded-t-lg">
        <div class="text-subtitle-1 font-weight-bold">
          CIERRE DE DESVIACIÓN / CONDICIÓN
        </div>
      </v-card-title>
      <v-card-text class="pt-3">
        <v-row dense>
          <!-- Si no está en modo superior, le preguntamos si desea cerrar in situ -->
          <v-col cols="12" v-if="!isSuperiorMode">
            <v-select
              :model-value="attr.cerrarInSitu"
              :items="[ { value: 'SI', label: 'SÍ (Cerrar Desviación In Situ)' }, { value: 'NO', label: 'NO (Derivar a un Superior)' } ]"
              item-title="label"
              item-value="value"
              label="¿DESEA CERRAR LA DESVIACIÓN IN SITU AHORA?"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              :class="!attr.cerrarInSitu ? 'border-red-input' : ''"
              @update:model-value="(value) => setField('cerrarInSitu', value)"
            />
          </v-col>

          <!-- Caso 1: Cierre In Situ (o Modo Superior) -->
          <template v-if="attr.cerrarInSitu === 'SI' || isSuperiorMode">
            <v-col cols="12" class="mt-2">
              <div class="font-weight-medium mb-1">Evidencia Fotográfica de Cierre <span class="text-red">*</span></div>
              <FotoCapture
                label="Adjuntar Foto de Cierre"
                :max-fotos="1"
                :obligatorio-fotos="1"
                :compression="50"
                :galeria="attr.fotosCierre"
                :disabled="disabled && !isSuperiorMode"
                @update:galeria="(val) => setField('fotosCierre', val)"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                :model-value="attr.comentariosCierre"
                label="COMENTARIOS DE CIERRE"
                variant="outlined"
                density="compact"
                rows="3"
                auto-grow
                hide-details
                :disabled="disabled && !isSuperiorMode"
                :class="(!attr.comentariosCierre || !attr.comentariosCierre.trim()) ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('comentariosCierre', value)"
              />
            </v-col>
          </template>

          <!-- Caso 2: Derivación a Superior (solo si no está en modo superior y eligió NO) -->
          <template v-if="attr.cerrarInSitu === 'NO' && !isSuperiorMode">
            <v-col cols="12" class="mt-2">
              <div class="font-weight-medium mb-1">
                Fotos de Evidencia de Desviación / Hallazgo <span class="text-red">* (Mínimo 2, Máximo 8)</span>
              </div>
              <FotoCapture
                label="Adjuntar Fotos de Desviación"
                :max-fotos="8"
                :obligatorio-fotos="2"
                :compression="50"
                :galeria="attr.fotosHallazgo || []"
                :disabled="disabled || isSuperiorMode"
                @update:galeria="(val) => setField('fotosHallazgo', val)"
              />
            </v-col>
            <v-col cols="12" sm="6" class="mt-2">
              <v-autocomplete
                :model-value="attr.superiorDerivado"
                :items="usuariosItems"
                item-title="label"
                item-value="value"
                label="SUPERIOR RESPONSABLE"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                :class="!attr.superiorDerivado ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('superiorDerivado', value)"
              />
            </v-col>
            <v-col cols="12" sm="6" class="mt-2">
              <v-text-field
                :model-value="attr.fechaCompromiso"
                label="FECHA COMPROMISO CIERRE"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                :class="!attr.fechaCompromiso ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('fechaCompromiso', value)"
              />
            </v-col>
          </template>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
/* eslint-disable vue/no-mutating-props */
import { computed, watch } from 'vue'
import FotoCapture from '@/components/FotoCapture.vue'

const props = defineProps({
  attr: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  usuarios: { type: Object, default: () => ({}) },
  isSuperiorMode: { type: Boolean, default: false }
})

const emit = defineEmits(['change'])

const estadoOptions = ['NA', 'C', 'I', 'RI']
const severidadOptions = ['L', 'G', 'MG']

const COMMON_DEFAULT_BLOCKS = [
  {
    id: 'bloque-1000',
    title: 'DOCUMENTACION EN EL LUGAR DE TRABAJO',
    aplica: '',
    items: [
      { codigo: '1000', label: 'EVALUACION DE RIESGOS Y PLANIFICACION DE MEDIDAS PREVENTIVAS' },
      { codigo: '1001', label: 'PLAN DE SEGURIDAD Y SALUD (OBRAS DE CONSTRUCCION)' },
      { codigo: '1002', label: 'CONTROL PREVIO INICIO TRABAJOS' },
      { codigo: '1003', label: 'PERMISO DE TRABAJO / ORDEN DE TRABAJO / ENCARGO EJECUCION' },
      { codigo: '1004', label: 'AUTORIZACION DE SUBCONTRATACION' },
      { codigo: '1005', label: 'PERSONAL IDENTIFICADO EN LA OBRA / TRABAJO / ACTIVIDAD INCLUIDO EN LISTADO' },
      { codigo: '1006', label: 'VEHICULOS / MAQUINARIA IDENTIFICADOS EN OBRA / TRABAJO / ACTIVIDAD INCLUIDOS EN RELACION' },
      { codigo: '1007', label: 'DESIGNACION Y PRESENCIA DE LOS RECURSOS PREVENTIVOS' },
      { codigo: '1099', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-1100',
    title: 'ZONA DE TRABAJO Y EQUIPOS DE PROTECCION COLECTIVA',
    aplica: '',
    items: [
      { codigo: '1100', label: 'DELIMITACION/SENALIZACION DE RIESGOS (ZONA TRABAJO, ACOPIO, TRAFICO, ANCLADO, ETC.)' },
      { codigo: '1101', label: 'ORDEN Y LIMPIEZA' },
      { codigo: '1102', label: 'ALMACENAMIENTO DE MATERIALES' },
      { codigo: '1103', label: 'ILUMINACION FIJA / PORTATIL / DE EMERGENCIA / CONDICIONES DE VISIBILIDAD' },
      { codigo: '1104', label: 'PROTECCION DE HUECOS Y/O DE ZONAS DE CAIDA' },
      { codigo: '1105', label: 'ALIMENTACIONES ELECTRICAS AUXILIARES / PROVISIONALES' },
      { codigo: '1106', label: 'PROTECCIONES DE BORDES CORTANTES O PUNTIAGUDOS, TAPONES DE PLASTICO' },
      { codigo: '1107', label: 'PROTECCION DE TRABAJOS EN LA MISMA VERTICAL / CONCURRENCIA / INTERFERENCIA' },
      { codigo: '1108', label: 'ELEMENTOS DE PROTECCION CONTRA INCENDIOS (DISPONIBLES Y ACCESIBLES)' },
      { codigo: '1109', label: 'BOTIQUIN' },
      { codigo: '1110', label: 'ACCESOS SEGUROS A ZONAS DE TRABAJO (PASARELAS, ESCALERAS, RAMPAS, REDES, ETC.)' },
      { codigo: '1111', label: 'ENVASADO, IDENTIFICACION Y USO DE PRODUCTOS QUIMICOS' },
      { codigo: '1112', label: 'CLIMATOLOGIA ADECUADA EN TRABAJOS REALIZADOS EN EXTERIOR' },
      { codigo: '1199', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-1200',
    title: 'EQUIPOS DE PROTECCION INDIVIDUAL (EPI) / PERSONAL (EPP)',
    aplica: '',
    items: [
      { codigo: '1200', label: 'CASCO DE SEGURIDAD' },
      { codigo: '1201', label: 'CALZADO DE SEGURIDAD MECANICA, QUIMICA, ...' },
      { codigo: '1202', label: 'ROPA DE TRABAJO: IGNIFUGA, QUIMICA, ANTIESTATICA, ARCO, INACTINICA, ...' },
      { codigo: '1203', label: 'PANTALLA DE PROTECCION FACIAL / GAFAS DE PROTECCION OCULAR' },
      { codigo: '1204', label: 'ROPA / CHALECO CON ELEMENTOS REFLECTANTES' },
      { codigo: '1205', label: 'PROTECCION RESPIRATORIA' },
      { codigo: '1206', label: 'PROTECCION AUDITIVA' },
      { codigo: '1207', label: 'GUANTES DE PROTECCION MECANICA, QUIMICA, IGNIFUGA, SOLDADURA, ...' },
      { codigo: '1208', label: 'EQUIPO DE RESPIRACION ASISTIDA' },
      { codigo: '1299', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-1300',
    title: 'HERRAMIENTAS, EQUIPOS Y ELEMENTOS AUXILIARES',
    aplica: '',
    items: [
      { codigo: '1300', label: 'HERRAMIENTAS MANUALES / AISLADAS' },
      { codigo: '1301', label: 'BOLSA / CINTURON PORTAHERRAMIENTAS' },
      { codigo: '1302', label: 'HERRAMIENTAS PORTATILES' },
      { codigo: '1303', label: 'ESTADO / BUEN USO DE ESCALERAS MANUALES' },
      { codigo: '1304', label: 'VERIFICACION APARATOS DE MEDIDA PORTATILES (DETECTORES, ANALIZADORES, ETC.)' },
      { codigo: '1305', label: 'MARCADO HOMOLOGADO DE ACUERDO CON LEGISLACION DEL PAIS' },
      { codigo: '1306', label: 'RESGUARDOS DE SEGURIDAD DE HERRAMIENTAS Y OTROS DISPOSITIVOS DE PROTECCION' },
      { codigo: '1307', label: 'ESTADO / BUEN USO DE ANDAMIOS' },
      { codigo: '1399', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-1400',
    title: 'VEHICULOS, CAMIONES Y MAQUINARIA',
    aplica: '',
    items: [
      { codigo: '1400', label: 'COMPROBACION EN GESTOR DOCUMENTAL DE SITUACION DE MAQUINARIA' },
      { codigo: '1401', label: 'ESTADO / USO GENERAL' },
      { codigo: '1402', label: 'CINTURON DE SEGURIDAD' },
      { codigo: '1403', label: 'BOTIQUIN' },
      { codigo: '1404', label: 'CARNET / LICENCIA / PERMISO DE CONDUCIR DEL CONDUCTOR' },
      { codigo: '1405', label: 'SEPARACION HOMBRE / CARGA (NO MOTOS)' },
      { codigo: '1406', label: 'SUJECION DE CAJA PORTAHERRAMIENTAS, UTILES, RECAMBIO, ETC. EN MOTOS' },
      { codigo: '1407', label: 'ORDENACION Y SUJECION DE LA CARGA' },
      { codigo: '1408', label: 'EQUIPAMIENTO CONDUCTORES DE MOTOS' },
      { codigo: '1409', label: 'CALZADO DE MAQUINARIA ESTACIONADA EN PENDIENTE' },
      { codigo: '1410', label: 'SENALES ACUSTICA Y LUMINOSA DE MARCHA ATRAS' },
      { codigo: '1411', label: 'EXTINTOR' },
      { codigo: '1412', label: 'UBICACION DE LA MAQUINARIA' },
      { codigo: '1413', label: 'ZONA DE TRABAJO DE LA MAQUINARIA DESPEJADA' },
      { codigo: '1414', label: 'ELEMENTOS MOVILES RECOGIDOS CUANDO MAQUINARIA ESTA PARADA' },
      { codigo: '1415', label: 'MARCADO HOMOLOGADO DE ACUERDO CON LEGISLACION DEL PAIS' },
      { codigo: '1416', label: 'RESGUARDOS DE LA MAQUINARIA' },
      { codigo: '1417', label: 'MAQUINARIA PUESTA A TIERRA' },
      { codigo: '1418', label: 'ESTADO Y POSICIONAMIENTO DE LOS ESTABILIZADORES' },
      { codigo: '1499', label: 'OTROS', isOtros: true }
    ]
  }
]

const SPECIAL_DEFAULT_BLOCKS = [
  {
    id: 'bloque-1500',
    title: 'TRABAJOS DE TALA, PODA, DESBROCE',
    infoText: 'Aquel en el que se realizan actividades de tala, poda o desbroce, bien sea con medios mecanicos o manuales.',
    aplica: '',
    items: [
      { codigo: '1500', label: 'PROTECCIONES RESISTENTES AL CORTE EN TRONCO, BRAZOS Y PIERNAS' },
      { codigo: '1501', label: 'SENALIZACION Y BALIZAMIENTO DE LA ZONA' },
      { codigo: '1502', label: 'MEDIOS DE EXTINCION DE INCENDIOS' },
      { codigo: '1503', label: 'MOTOSIERRAS PARADAS Y BLOQUEADAS EN DESPLAZAMIENTOS Y PAUSAS' },
      { codigo: '1504', label: 'RADIO DE SEGURIDAD EN USO DE MOTOSIERRAS, DESBROZADORA Y TRACTOR' },
      { codigo: '1505', label: 'TALA GUIADA CON TENSE O EMPUJE CON MEDIO MECANICO' },
      { codigo: '1506', label: 'AUSENCIA DE PERSONAL EN PERIMETRO DE SEGURIDAD DE CAIDA/PROYECCIONES' },
      { codigo: '1507', label: 'NO DERRIBAR ARBOLES SOBRE OTROS YA TUMBADOS' },
      { codigo: '1599', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-1600',
    title: 'TRABAJOS DE MANIPULACION DE CARGAS POR MEDIOS MECANICOS',
    infoText: 'Aquellos en los que se manipulan equipos de movimiento de cargas, o que se realizan en sus proximidades.',
    aplica: '',
    items: [
      { codigo: '1600', label: 'MOVIMIENTO DE CARGA POR PERSONA QUE DIRIGE EL MEDIO MECANICO' },
      { codigo: '1601', label: 'BALIZAMIENTO DE LA ZONA DE MANIOBRA' },
      { codigo: '1602', label: 'ESTADO DE ACCESORIOS PARA MANIPULACION (GANCHOS, ESLINGAS, CABLES, ETC.)' },
      { codigo: '1603', label: 'ZONA DE INFLUENCIA DEL EQUIPO DESPEJADA DE PERSONAL' },
      { codigo: '1604', label: 'ASEGURAMIENTO / ESTABILIDAD DE LA CARGA' },
      { codigo: '1605', label: 'EMPLEO DE CUERDAS PARA RETENCION Y GUIADO DE LA CARGA' },
      { codigo: '1699', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-1700',
    title: 'TRABAJOS ELECTRICOS EN TENSION',
    aplica: '',
    items: [
      { codigo: '1700', label: 'CERTIFICADO ULTIMA REVISION PEMP PARA TRABAJOS EN TENSION' },
      { codigo: '1701', label: 'ESTADO/USO Y CERTIFICADO DE MATERIAL DE SEGURIDAD' },
      { codigo: '1702', label: 'PROCEDIMIENTO ESPECIFICO DE TRABAJOS EN TENSION EN CAMPO' },
      { codigo: '1703', label: 'EXISTENCIA DE APANTALLAMIENTOS REQUERIDOS' },
      { codigo: '1704', label: 'TRAJE DE FARADAY EN TRABAJOS A POTENCIAL' },
      { codigo: '1705', label: 'HERRAMIENTA AISLADA HASTA 1000V (EN BT)' },
      { codigo: '1706', label: 'RETIRADA DE REENGANCHES ANTES DEL INICIO DE TRABAJOS' },
      { codigo: '1707', label: 'DIRECCION Y VIGILANCIA POR PERSONAL CUALIFICADO' },
      { codigo: '1799', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-1800',
    title: 'TRABAJOS ELECTRICOS EN PROXIMIDAD DE TENSION',
    aplica: '',
    items: [
      { codigo: '1800', label: 'DELIMITACION DE ZONA DE TRABAJO SEGUN DISTANCIA DE PROXIMIDAD' },
      { codigo: '1801', label: 'SENALIZACION DE ELEMENTOS EN TENSION PROXIMOS' },
      { codigo: '1802', label: 'INFORMACION DE RIESGOS A BRIGADA' },
      { codigo: '1803', label: 'PERSONAL Y MAQUINARIA DENTRO DE ZONA DELIMITADA/SENALIZADA' },
      { codigo: '1804', label: 'PREPARACION Y VIGILANCIA POR PERSONAL CUALIFICADO/AUTORIZADO' },
      { codigo: '1805', label: 'AUSENCIA DE MATERIALES QUE INVADAN ZONA DE PELIGRO' },
      { codigo: '1806', label: 'RETIRADA DE REENGANCHES ANTES DEL INICIO' },
      { codigo: '1899', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-1900',
    title: 'OPERACIONES PARA LA REALIZACION DE TRABAJOS ELECTRICOS SIN TENSION',
    infoText: 'Aquel que se realiza en instalaciones electricas despues de haber tomado todas las medidas necesarias para mantener la instalacion sin tension.',
    aplica: '',
    items: [
      { codigo: '1900', label: 'ESTADO/USO DE EPI Y EPC ADECUADOS AL NIVEL DE TENSION' },
      { codigo: '1901', label: 'DESCONEXION DE FUENTES DE TENSION' },
      { codigo: '1902', label: 'BLOQUEO/ENCLAVAMIENTO DE APARATOS DE CORTE' },
      { codigo: '1903', label: 'SENALIZACION DE ZONA DE DESCARGO/ZONA DE TRABAJO' },
      { codigo: '1904', label: 'VERIFICACION DE AUSENCIA DE TENSION' },
      { codigo: '1905', label: 'INSTALACION/SENALIZACION DE PUESTA A TIERRA EN ZD/ZT' },
      { codigo: '1906', label: 'DELIMITACION DE LA ZONA DE TRABAJO' },
      { codigo: '1907', label: 'DOCUMENTACION ESPECIFICA DE TRABAJOS SIN TENSION' },
      { codigo: '1908', label: 'PROCEDIMIENTO PARA RETIRADA TEMPORAL DE TIERRAS EN ZD O ZT' },
      { codigo: '1999', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-2400',
    title: 'OPERACIONES ESPECIALES EN REDES DE TRANSPORTE Y DISTRIBUCION DE GAS - COMUNES A LAS DOS OPERACIONES',
    infoText: 'Tendran la consideracion de operaciones especiales: taladro en tuberia de acero en carga y obturacion en tuberia de acero en carga.',
    aplica: '',
    items: [
      { codigo: '2400', label: 'MANIOBRABILIDAD DE VALVULAS' },
      { codigo: '2401', label: 'PERSONAL CUALIFICADO' },
      { codigo: '2402', label: 'UBICACION CORRECTA DEL PERSONAL' },
      { codigo: '2403', label: 'VIGILANCIA DE INTERFERENCIAS DE OTROS TRABAJOS' },
      { codigo: '2404', label: 'RECURSO PREVENTIVO' },
      { codigo: '2419', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-2420',
    title: 'OPERACIONES ESPECIALES EN REDES DE TRANSPORTE Y DISTRIBUCION DE GAS - OPERACION DE TALADRO',
    aplica: '',
    items: [
      { codigo: '2420', label: 'ESTADO DEL TAPON INTERIOR DE CIERRE' },
      { codigo: '2429', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-2430',
    title: 'OPERACIONES ESPECIALES EN REDES DE TRANSPORTE Y DISTRIBUCION DE GAS - OPERACION DE OBTURACION',
    aplica: '',
    items: [
      { codigo: '2430', label: 'MAQUINARIA' },
      { codigo: '2431', label: 'COPELAS DE RECAMBIO' },
      { codigo: '2432', label: 'EXISTENCIA DE PICAJES' },
      { codigo: '2433', label: 'ESTANQUEIDAD TAPONES INTERIORES' },
      { codigo: '2434', label: 'COLOCACION CHIMENEA' },
      { codigo: '2439', label: 'OTROS', isOtros: true }
    ]
  }
]

const SPECIAL_WORKPLACE_DEFAULT_BLOCKS = [
  {
    id: 'bloque-2600',
    title: 'TRABAJOS EN ZANJAS, EXCAVACIONES, MINADOS',
    infoText: 'Aquellos que se realizan en el interior o en la proximidad de zanjas o excavaciones.',
    aplica: '',
    items: [
      { codigo: '2600', label: 'PENDIENTE DE LOS TALUDES' },
      { codigo: '2601', label: 'ACUMULACION DE TIERRAS SEPARADAS Y CONSOLIDADA DE EXCAVACION' },
      { codigo: '2602', label: 'IDENTIFICACION PREVIA POSIBLES SERVICIOS AFECTADOS' },
      { codigo: '2603', label: 'ENTIBACION DE ZANJAS / MINAS / POZOS' },
      { codigo: '2604', label: 'CIRCULACION DE VEHICULOS Y MAQUINARIA RESPECTO AL BORDE DE EXCAVACION' },
      { codigo: '2699', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-2700',
    title: 'TRABAJOS EN RECINTOS CON GEOMETRIA ESPECIAL NO CONFINADOS',
    infoText: 'Recintos con geometria especial y no confinados: tuneles, galerias de servicios, arquetas, cajas de empalme, etc.',
    aplica: '',
    items: [
      { codigo: '2700', label: 'CONTROL DE ACCESO DE LAS PERSONAS EN EL INTERIOR' },
      { codigo: '2701', label: 'ILUMINACION ADECUADA (DE TRABAJO Y EMERGENCIA)' },
      { codigo: '2702', label: 'COMPROBACION PERMANENTE DE ATMOSFERA INTERIOR' },
      { codigo: '2703', label: 'VENTILACION Y/O ACONDICIONAMIENTO DEL RECINTO' },
      { codigo: '2704', label: 'MEDIOS DE RESCATE Y EVACUACION DISPONIBLES' },
      { codigo: '2705', label: 'SISTEMA DE COMUNICACIONES EN EL INTERIOR' },
      { codigo: '2799', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-2800',
    title: 'TRABAJOS EN ALTURA',
    infoText: 'Se considera trabajo en altura cualquier actividad con diferencia de cota superior a 1,8 metros entre pies y nivel de posible caida.',
    aplica: '',
    items: [
      { codigo: '2800', label: 'USO DE BARBOQUEJO' },
      { codigo: '2801', label: 'ARNES ANTICAIDAS / BANDA DE POSICIONAMIENTO' },
      { codigo: '2802', label: 'PUNTOS FIJOS DE ANCLAJE' },
      { codigo: '2803', label: 'UTILIZACION DE DOBLE CABO' },
      { codigo: '2804', label: 'EQUIPOS DE PROTECCION ANTICAIDA CERTIFICADOS' },
      { codigo: '2805', label: 'LINEAS DE VIDA (ESTADO/USO)' },
      { codigo: '2806', label: 'PLAN / EQUIPAMIENTO DE RESCATE Y EVACUACION' },
      { codigo: '2807', label: 'BALIZAMIENTO ZONA DE TRABAJO BAJO LA VERTICAL' },
      { codigo: '2808', label: 'BRIGADA DE MINIMO DOS TRABAJADORES DURANTE LOS TRABAJOS' },
      { codigo: '2899', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-2900',
    title: 'TRABAJOS EN ESPACIOS CONFINADOS',
    infoText: 'Se considera espacio confinado a recintos con aperturas limitadas y ventilacion natural desfavorable donde pueden acumularse contaminantes.',
    aplica: '',
    items: [
      { codigo: '2900', label: 'EXISTENCIA DE PERMISO ESPECIFICO DE TRABAJOS EN ESPACIOS CONFINADOS' },
      { codigo: '2901', label: 'PRESENCIA DE VIGILANCIA EXTERIOR' },
      { codigo: '2902', label: 'SENALIZACION DE ESPACIO CONFINADO' },
      { codigo: '2903', label: 'CONTROL DE ACCESO Y REGISTRO DE PERSONAS EN INTERIOR' },
      { codigo: '2904', label: 'COMPROBACION PERMANENTE DE ATMOSFERA INTERIOR' },
      { codigo: '2905', label: 'VENTILACION DEL RECINTO' },
      { codigo: '2906', label: 'PLAN DE RESCATE Y EVACUACION' },
      { codigo: '2907', label: 'MEDIOS DE RESCATE Y EVACUACION DISPONIBLES' },
      { codigo: '2908', label: 'MEDIOS DE COMUNICACION PERMANENTE INTERIOR/EXTERIOR' },
      { codigo: '2909', label: 'ILUMINACION ADECUADA (TRABAJO Y EMERGENCIA)' },
      { codigo: '2999', label: 'OTROS', isOtros: true }
    ]
  },
  {
    id: 'bloque-3000',
    title: 'TRABAJOS EN ATMOSFERAS EXPLOSIVAS (ATEX)',
    infoText: 'Trabajos con riesgo de incendio/explosion por presencia de mezcla con aire de sustancias inflamables (gases, vapores, nieblas o polvos).',
    aplica: '',
    items: [
      { codigo: '3000', label: 'UTILIZACION DE EQUIPOS DE DETECCION DE ATMOSFERA EXPLOSIVA EN CONTINUO' },
      { codigo: '3001', label: 'UTILIZACION DE HERRAMIENTAS APROPIADAS' },
      { codigo: '3002', label: 'EQUIPOS ADECUADOS Y CERTIFICADOS A ZONA ATEX' },
      { codigo: '3003', label: 'CALIBRACION DE EQUIPOS DE DETECCION DE GASES' },
      { codigo: '3004', label: 'CONTROL POSIBLES FOCOS DE IGNICION' },
      { codigo: '3005', label: 'VIGILANCIA DE INTERFERENCIAS DE OTROS TRABAJOS' },
      { codigo: '3099', label: 'OTROS', isOtros: true }
    ]
  }
]

const blocks = computed(() => (Array.isArray(props.attr?.blocks) ? props.attr.blocks : []))
const isGroupCollapsed = computed(() => Boolean(props.attr?.__collapsedAll))
const groupTitle = computed(() => {
  const fromGroup = String(props.attr?.groupTitle ?? '').trim()
  const fromLabel = String(props.attr?.label ?? '').trim()
  return fromGroup || fromLabel || 'BLOQUES COMUNES PARA TODAS LAS IIDD'
})
const showIntroHeader = computed(() => {
  const explicit = props.attr?.showIntroHeader
  if (explicit === false) return false
  if (explicit === true) return true
  const t = String(groupTitle.value || '').toLowerCase()
  return !t.includes('bloque de trabajos especiales')
})

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

function normalizeSeveridad(v) {
  const val = String(v ?? '').trim().toUpperCase()
  return severidadOptions.includes(val) ? val : ''
}

function normalizeEstado(v) {
  const val = String(v ?? '').trim().toUpperCase()
  return estadoOptions.includes(val) ? val : 'NA'
}

function normalizeItem(item) {
  const normalized = item && typeof item === 'object' ? item : {}
  const severityOptions = Array.isArray(normalized.severityOptions) && normalized.severityOptions.length
    ? normalized.severityOptions.map((x) => String(x ?? '').trim().toUpperCase()).filter((x) => severidadOptions.includes(x))
    : [...severidadOptions]

  const estado = normalizeEstado(normalized.estado)
  const base = {
    codigo: String(normalized.codigo ?? ''),
    label: String(normalized.label ?? ''),
    isOtros: Boolean(normalized.isOtros || String(normalized.codigo ?? '').endsWith('99')),
    estado,
    severidad: normalizeSeveridad(normalized.severidad),
    observacion: String(normalized.observacion ?? ''),
    severityOptions
  }

  if (!requiresSeveridad(base)) {
    base.severidad = ''
  } else if (!isSeveridadAllowed(base, base.severidad)) {
    base.severidad = ''
  }

  return base
}

function normalizeBlock(block) {
  const source = block && typeof block === 'object' ? block : {}
  const aplicaRaw = String(source.aplica ?? '').trim().toLowerCase()
  const aplica = ['aplica', 'no_aplica'].includes(aplicaRaw) ? aplicaRaw : ''
  const items = (Array.isArray(source.items) ? source.items : []).map((it) => normalizeItem(it))
  const rawTitle = String(source.title ?? '')
  const titleParts = rawTitle.split(/\s-\s(.+)/)
  const sectionTitle = titleParts.length >= 3 ? String(titleParts[0] ?? '').trim() : ''
  const title = titleParts.length >= 3 ? String(titleParts[1] ?? '').trim() : rawTitle
  return {
    id: String(source.id ?? ''),
    title,
    sectionTitle,
    infoText: String(source.infoText ?? source.descripcion ?? '').trim(),
    aplica,
    items,
    __collapsed: Boolean(source.__collapsed)
  }
}

function getPresetBlocks() {
  const key = String(props.attr?.preset ?? props.attr?.groupKey ?? '').trim().toLowerCase()
  const title = String(props.attr?.groupTitle ?? props.attr?.label ?? '').toLowerCase()
  if (
    key === 'lugares_especiales' ||
    key === 'actividades_lugares_especiales' ||
    title.includes('lugares de trabajo con caracteristicas especiales')
  ) return SPECIAL_WORKPLACE_DEFAULT_BLOCKS
  if (key === 'especiales' || title.includes('trabajos especiales')) return SPECIAL_DEFAULT_BLOCKS
  return COMMON_DEFAULT_BLOCKS
}

function ensureStructure() {
  if (!props.attr || typeof props.attr !== 'object') return
  if (!Array.isArray(props.attr.blocks) || props.attr.blocks.length === 0) {
    props.attr.blocks = clone(getPresetBlocks()).map((b) => normalizeBlock(b))
  } else {
    props.attr.blocks = props.attr.blocks.map((b) => normalizeBlock(b))
  }

  props.attr.blocks.forEach((block) => {
    if (block.aplica === 'no_aplica') {
      block.items.forEach((item) => {
        item.estado = 'NA'
        item.severidad = ''
      })
    }
  })

  // Inicializar propiedades de cierre y derivación a nivel del atributo
  props.attr.cerrarInSitu = props.attr.cerrarInSitu ?? null
  if (!Array.isArray(props.attr.fotosCierre)) {
    props.attr.fotosCierre = []
  }
  if (!Array.isArray(props.attr.fotosHallazgo)) {
    props.attr.fotosHallazgo = []
  }
  props.attr.comentariosCierre = props.attr.comentariosCierre ?? ''
  props.attr.superiorDerivado = props.attr.superiorDerivado ?? null
  props.attr.fechaCompromiso = props.attr.fechaCompromiso ?? ''
}

function requiresSeveridad(item) {
  const estado = String(item?.estado ?? '').toUpperCase()
  return estado === 'I' || estado === 'RI'
}

function isSeveridadAllowed(item, sev) {
  const opts = Array.isArray(item?.severityOptions) && item.severityOptions.length
    ? item.severityOptions
    : severidadOptions
  return opts.includes(String(sev ?? '').toUpperCase())
}

function requiresObs(item) {
  return Boolean(item?.isOtros) || requiresSeveridad(item)
}

function isObsInvalid(item) {
  if (!requiresObs(item)) return false
  return String(item?.observacion ?? '').trim() === ''
}

function getObsLabel(item) {
  return requiresObs(item) ? 'Observacion (obligatoria)' : 'Observacion (opcional)'
}

function getObsHint(item) {
  if (item?.isOtros) return 'En OTROS debes describir el aspecto inspeccionado.'
  if (requiresSeveridad(item)) return 'Para I o RI debes justificar la desviacion.'
  return ''
}

function onBlockApplyChange(block, value) {
  block.aplica = value === 'no_aplica' ? 'no_aplica' : 'aplica'
  if (block.aplica === 'no_aplica') {
    block.items.forEach((item) => {
      item.estado = 'NA'
      item.severidad = ''
    })
  }
  touch()
}

function onEstadoChange(block, item, value) {
  item.estado = normalizeEstado(value)
  if (!requiresSeveridad(item)) item.severidad = ''
  if (block.aplica !== 'aplica') block.aplica = 'aplica'
  touch()
}

function onSeveridadChange(item, value) {
  const next = normalizeSeveridad(value)
  item.severidad = isSeveridadAllowed(item, next) ? next : ''
  touch()
}

function toggleBlock(block) {
  if (!block) return
  block.__collapsed = !block.__collapsed
  touch()
}

function toggleGroup() {
  props.attr.__collapsedAll = !props.attr.__collapsedAll
  touch()
}

function touch() {
  props.attr.__touched = Date.now()
  emit('change')
}

function setField(key, value) {
  props.attr[key] = value
  touch()
}

const hasDesviacion = computed(() => {
  const blks = props.attr?.blocks || []
  return blks.some(block =>
    block.aplica === 'aplica' &&
    (block.items || []).some(item => item.estado === 'I')
  )
})

const usuariosItems = computed(() => {
  return Object.entries(props.usuarios || {}).map(([id, nombre]) => ({
    value: Number(id),
    label: nombre
  }))
})

watch(hasDesviacion, (newVal) => {
  if (!newVal && props.attr) {
    props.attr.cerrarInSitu = null
    props.attr.fotosCierre = []
    props.attr.comentariosCierre = ''
    props.attr.superiorDerivado = null
    props.attr.fechaCompromiso = ''
    touch()
  }
})

watch(() => props.attr?.cerrarInSitu, (newVal) => {
  if (props.attr) {
    if (newVal === 'SI') {
      props.attr.superiorDerivado = null
      props.attr.fechaCompromiso = ''
    } else if (newVal === 'NO') {
      props.attr.fotosCierre = []
      props.attr.comentariosCierre = ''
    }
    touch()
  }
})

watch(
  () => props.attr,
  () => ensureStructure(),
  { immediate: true, deep: false }
)
</script>

<style scoped>
.legend-card {
  border-color: #cbd5e1 !important;
  background: #f8fafc;
}

.item-row {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  background: #ffffff;
}

.item-title {
  font-size: 13px;
  line-height: 1.25rem;
  color: #1e293b;
  max-width: 100%;
}

.block-section-title {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 800;
  color: #1e3a8a;
  background: #eff6ff;
  line-height: 1.15;
  white-space: normal;
  word-break: break-word;
}

.block-header-title {
  width: 90%;
  white-space: normal;
  line-height: 1.15rem;
  word-break: break-word;
  font-size: 14px;
}

.block-header-toggle {
  width: 10%;
  justify-content: flex-end;
}

.estado-toggle :deep(.v-btn),
.severidad-toggle :deep(.v-btn) {
  min-width: 34px;
}

.apply-toggle :deep(.v-btn) {
  border: 1px solid #94a3b8 !important;
  color: #334155 !important;
  font-weight: 700 !important;
}

.apply-toggle :deep(.apply-btn--ok.v-btn--active) {
  background: #16a34a !important;
  border-color: #15803d !important;
  color: #ffffff !important;
}

.apply-toggle :deep(.apply-btn--na.v-btn--active) {
  background: #475569 !important;
  border-color: #334155 !important;
  color: #ffffff !important;
}

.state-group :deep(.state-btn.v-btn) {
  border: 1px solid #94a3b8 !important;
  color: #334155 !important;
  font-weight: 700 !important;
}

.state-group :deep(.state-btn--na.v-btn--active) {
  background: #64748b !important;
  border-color: #475569 !important;
  color: #ffffff !important;
}

.state-group :deep(.state-btn--c.v-btn--active) {
  background: #16a34a !important;
  border-color: #15803d !important;
  color: #ffffff !important;
}

.state-group :deep(.state-btn--i.v-btn--active) {
  background: #dc2626 !important;
  border-color: #b91c1c !important;
  color: #ffffff !important;
}

.state-group :deep(.state-btn--ri.v-btn--active) {
  background: #2563eb !important;
  border-color: #1d4ed8 !important;
  color: #ffffff !important;
}

.severidad-toggle :deep(.sev-btn.v-btn) {
  border: 1px solid #94a3b8 !important;
  color: #334155 !important;
  font-weight: 700 !important;
}

.severidad-toggle :deep(.sev-btn--l.v-btn--active) {
  background: #f59e0b !important;
  border-color: #d97706 !important;
  color: #ffffff !important;
}

.severidad-toggle :deep(.sev-btn--g.v-btn--active) {
  background: #f97316 !important;
  border-color: #ea580c !important;
  color: #ffffff !important;
}

.severidad-toggle :deep(.sev-btn--mg.v-btn--active) {
  background: #7f1d1d !important;
  border-color: #7f1d1d !important;
  color: #ffffff !important;
}

.sev-forbidden {
  opacity: 0.45 !important;
}

.intro-alert :deep(.v-alert__content),
.block-info-alert :deep(.v-alert__content) {
  font-size: 12px;
  line-height: 1.25;
  white-space: normal;
  word-break: break-word;
}

.intro-alert :deep(.v-alert__prepend),
.block-info-alert :deep(.v-alert__prepend) {
  margin-inline-end: 8px;
}

.block-info-alert {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}
</style>
