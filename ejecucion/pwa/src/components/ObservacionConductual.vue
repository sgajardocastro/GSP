<template>
  <div class="observacion-conductual-sst">
    <v-expansion-panels v-model="openSections" multiple class="obs-panels">
      
      <!-- Sección 1: Datos Generales -->
      <v-expansion-panel value="generales" class="obs-card">
        <v-expansion-panel-title class="obs-title bg-indigo-darken-3">
          1.- DATOS GENERALES
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row dense class="py-2">
            <v-col cols="12" sm="6">
              <v-select
                :model-value="attrRef.datos.centro"
                :items="centrosOptions"
                label="CENTRO"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled || isSuperiorMode"
                :class="!attrRef.datos.centro ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('centro', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="attrRef.datos.servicio"
                label="SERVICIO"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled || isSuperiorMode"
                :class="!attrRef.datos.servicio ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('servicio', value)"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                :model-value="attrRef.datos.lugarTarea"
                label="LUGAR DE TAREA"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled || isSuperiorMode"
                :class="!attrRef.datos.lugarTarea ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('lugarTarea', value)"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Sección 2: Detalles de la Observación -->
      <v-expansion-panel value="detalles" class="obs-card">
        <v-expansion-panel-title class="obs-title bg-indigo-darken-3">
          2.- DETALLES DE LA OBSERVACIÓN
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row dense class="py-2">
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="attrRef.datos.cantidadPersonas"
                label="CANTIDAD DE PERSONAS OBSERVADAS"
                type="number"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled || isSuperiorMode"
                :class="attrRef.datos.cantidadPersonas === '' || attrRef.datos.cantidadPersonas === null ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('cantidadPersonas', value)"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                :model-value="attrRef.datos.tipoConducta"
                :items="tipoConductaOptions"
                label="TIPO DE CONDUCTA"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled || isSuperiorMode"
                :class="!attrRef.datos.tipoConducta ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('tipoConducta', value)"
              />
            </v-col>

            <!-- Campo Condicional: Causa de Conducta Riesgosa -->
            <v-col cols="12" v-if="attrRef.datos.tipoConducta === 'RIESGOSA'">
              <v-select
                :model-value="attrRef.datos.causaRiesgosa"
                :items="causasOptions"
                label="CAUSA DE CONDUCTA RIESGOSA"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled || isSuperiorMode"
                :class="!attrRef.datos.causaRiesgosa ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('causaRiesgosa', value)"
              />
            </v-col>

            <!-- Campo Condicional: Otra Causa -->
            <v-col cols="12" v-if="attrRef.datos.tipoConducta === 'RIESGOSA' && attrRef.datos.causaRiesgosa === 'Otros'">
              <v-textarea
                :model-value="attrRef.datos.otraCausa"
                label="OTRA CAUSA (ESPECIFIQUE)"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details
                :disabled="disabled || isSuperiorMode"
                :class="!attrRef.datos.otraCausa || !attrRef.datos.otraCausa.trim() ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('otraCausa', value)"
              />
            </v-col>

            <!-- Fotos del Hallazgo / Desviación (user1) -->
            <v-col cols="12" v-if="attrRef.datos.tipoConducta === 'RIESGOSA'" class="mt-2">
              <div class="font-weight-medium mb-1">
                Fotos de Evidencia de Desviación / Hallazgo
                <span class="text-muted" v-if="attrRef.datos.cerrarInSitu === 'NO'"> (Máximo 8)</span>
              </div>
              <FotoCapture
                label="Adjuntar Fotos de Desviación"
                :max-fotos="8"
                :obligatorio-fotos="0"
                :compression="50"
                v-model:galeria="attrRef.datos.fotosHallazgo"
                :disabled="disabled || isSuperiorMode"
                @update:galeria="emit('change')"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                :model-value="attrRef.datos.descripcion"
                label="DESCRIPCION OBSERVACION/INSPECCION"
                variant="outlined"
                density="compact"
                rows="3"
                auto-grow
                hide-details
                :disabled="disabled || isSuperiorMode"
                :class="!attrRef.datos.descripcion || !attrRef.datos.descripcion.trim() ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('descripcion', value)"
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                :model-value="attrRef.datos.medidasControl"
                label="MEDIDAS DE CONTROL"
                variant="outlined"
                density="compact"
                rows="3"
                auto-grow
                hide-details
                :disabled="disabled || isSuperiorMode"
                :class="!attrRef.datos.medidasControl || !attrRef.datos.medidasControl.trim() ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('medidasControl', value)"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Sección 3: Ubicación GPS -->
      <v-expansion-panel value="gps" class="obs-card">
        <v-expansion-panel-title class="obs-title bg-indigo-darken-3">
          3.- UBICACIÓN GPS
        </v-expansion-panel-title>
        <v-expansion-panel-text class="py-2">
          <GeoLocation
            label="Capturar Coordenadas"
            :modelValue="attrRef.datos.gps"
            :disabled="disabled || isSuperiorMode"
            @update:modelValue="(val) => setField('gps', val)"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Sección 4: Cierre de Desviación (Condicional o Modo Superior) -->
      <v-expansion-panel v-if="attrRef.datos.tipoConducta === 'RIESGOSA' || isSuperiorMode" value="cierre" class="obs-card">
        <v-expansion-panel-title class="obs-title bg-indigo-darken-3">
          4.- CIERRE DE DESVIACIÓN / DERIVACIÓN
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row dense class="py-2">
            <!-- Si no está en modo superior, le preguntamos si desea cerrar in situ -->
            <v-col cols="12" v-if="!isSuperiorMode">
              <v-select
                :model-value="attrRef.datos.cerrarInSitu"
                :items="[ { value: 'SI', label: 'SÍ (Cerrar Desviación In Situ)' }, { value: 'NO', label: 'NO (Derivar a un Superior)' } ]"
                item-title="label"
                item-value="value"
                label="¿DESEA CERRAR LA DESVIACIÓN IN SITU AHORA?"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                :class="!attrRef.datos.cerrarInSitu ? 'border-red-input' : ''"
                @update:model-value="(value) => setField('cerrarInSitu', value)"
              />
            </v-col>

            <!-- Caso 1: Cierre In Situ (o Modo Superior) -->
            <template v-if="attrRef.datos.cerrarInSitu === 'SI' || isSuperiorMode">
              <v-col cols="12" class="mt-2">
                <div class="font-weight-medium mb-1">Evidencia Fotográfica de Cierre</div>
                <FotoCapture
                  label="Adjuntar Foto de Cierre"
                  :max-fotos="1"
                  :obligatorio-fotos="0"
                  :compression="50"
                  v-model:galeria="attrRef.datos.fotosCierre"
                  :disabled="disabled && !isSuperiorMode"
                  @update:galeria="emit('change')"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  :model-value="attrRef.datos.comentariosCierre"
                  label="COMENTARIOS DE CIERRE"
                  variant="outlined"
                  density="compact"
                  rows="3"
                  auto-grow
                  hide-details
                  :disabled="disabled && !isSuperiorMode"
                  :class="(!attrRef.datos.comentariosCierre || !attrRef.datos.comentariosCierre.trim()) ? 'border-red-input' : ''"
                  @update:model-value="(value) => setField('comentariosCierre', value)"
                />
              </v-col>
            </template>

            <!-- Caso 2: Derivación a Superior (solo si no está en modo superior y eligió NO) -->
            <template v-if="attrRef.datos.cerrarInSitu === 'NO' && !isSuperiorMode">
              <v-col cols="12" sm="6" class="mt-2">
                <v-autocomplete
                  :model-value="attrRef.datos.superiorDerivado"
                  :items="usuariosItems"
                  item-title="label"
                  item-value="value"
                  label="SUPERIOR RESPONSABLE"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  :class="!attrRef.datos.superiorDerivado ? 'border-red-input' : ''"
                  @update:model-value="(value) => setField('superiorDerivado', value)"
                />
              </v-col>
              <v-col cols="12" sm="6" class="mt-2">
                <v-text-field
                  :model-value="attrRef.datos.fechaCompromiso"
                  label="FECHA COMPROMISO CIERRE"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  :class="!attrRef.datos.fechaCompromiso ? 'border-red-input' : ''"
                  @update:model-value="(value) => setField('fechaCompromiso', value)"
                />
              </v-col>
            </template>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

    </v-expansion-panels>
  </div>
</template>

<script setup>
import { ref, toRef, watch, onMounted, computed } from 'vue'
import GeoLocation from '@/components/GeoLocation.vue'
import FotoCapture from '@/components/FotoCapture.vue'

const props = defineProps({
  attr: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  usuarios: {
    type: Object,
    default: () => ({})
  },
  isSuperiorMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['change'])
const attrRef = toRef(props, 'attr')

const openSections = ref(['generales', 'detalles', 'gps', 'cierre'])

const centrosOptions = [
  'MINA',
  'PLANTA',
  'TALLER LOS ANDES',
  'TALLER CALAMA',
  'SPA',
  'OTRAS'
]

const tipoConductaOptions = [
  'RIESGOSA',
  'SEGURA'
]

const causasOptions = [
  'No identifica el peligro.',
  'Subestima o minimiza el riesgo.',
  'Ahorro de Tiempo.',
  'No es cómodo.',
  'Procedimiento no actualizado / Sin Procedimiento.',
  'No recibió entrenamiento / Instrucción / Capacitación.',
  'Alta Presión de Trabajo.',
  'Diseño de Instalaciones (Layout).',
  'Falta de Recursos (Personal y/o material).',
  'Otros'
]

// Mapear el catálogo de usuarios a items para v-autocomplete
const usuariosItems = computed(() => {
  return Object.entries(props.usuarios || {}).map(([id, nombre]) => ({
    value: Number(id),
    label: nombre
  }))
})

// Asegurar que la estructura 'datos' exista con todos los valores esperados
function ensureDatos() {
  if (!attrRef.value.datos || typeof attrRef.value.datos !== 'object') {
    attrRef.value.datos = {}
  }
  
  const d = attrRef.value.datos
  d.centro = d.centro ?? null
  d.servicio = d.servicio ?? ''
  d.lugarTarea = d.lugarTarea ?? ''
  d.cantidadPersonas = d.cantidadPersonas ?? ''
  d.tipoConducta = d.tipoConducta ?? null
  d.causaRiesgosa = d.causaRiesgosa ?? null
  d.otraCausa = d.otraCausa ?? ''
  d.descripcion = d.descripcion ?? ''
  d.medidasControl = d.medidasControl ?? ''
  
  // Inicialización de campos de cierre y derivación
  d.cerrarInSitu = d.cerrarInSitu ?? null
  if (!Array.isArray(d.fotosCierre)) {
    d.fotosCierre = []
  }
  if (!Array.isArray(d.fotosHallazgo)) {
    d.fotosHallazgo = []
  }
  d.comentariosCierre = d.comentariosCierre ?? ''
  d.superiorDerivado = d.superiorDerivado ?? null
  d.fechaCompromiso = d.fechaCompromiso ?? ''
  
  if (!d.gps || typeof d.gps !== 'object') {
    d.gps = { lat: null, lng: null }
  }
}

onMounted(() => {
  ensureDatos()
})

// Setear campo de datos y notificar cambios
function setField(key, value) {
  ensureDatos()
  attrRef.value.datos[key] = value
  emit('change')
}

// Limpieza reactiva de campos condicionales
watch(() => attrRef.value?.datos?.tipoConducta, (newVal) => {
  if (newVal !== 'RIESGOSA' && attrRef.value?.datos) {
    attrRef.value.datos.causaRiesgosa = null
    attrRef.value.datos.otraCausa = ''
    attrRef.value.datos.cerrarInSitu = null
    attrRef.value.datos.fotosCierre = []
    attrRef.value.datos.comentariosCierre = ''
    attrRef.value.datos.superiorDerivado = null
    attrRef.value.datos.fechaCompromiso = ''
    emit('change')
  }
})

watch(() => attrRef.value?.datos?.causaRiesgosa, (newVal) => {
  if (newVal !== 'Otros' && attrRef.value?.datos) {
    attrRef.value.datos.otraCausa = ''
    emit('change')
  }
})

watch(() => attrRef.value?.datos?.cerrarInSitu, (newVal) => {
  if (attrRef.value?.datos) {
    if (newVal === 'SI') {
      attrRef.value.datos.superiorDerivado = null
      attrRef.value.datos.fechaCompromiso = ''
    } else if (newVal === 'NO') {
      attrRef.value.datos.fotosCierre = []
      attrRef.value.datos.comentariosCierre = ''
    }
    emit('change')
  }
})
</script>

<style scoped>
.observacion-conductual-sst {
  width: 100%;
}

.obs-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  width: 100%;
}

.obs-card {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.25) !important;
  border-radius: 8px !important;
  overflow: hidden;
}

.obs-title {
  min-height: 48px;
  padding: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

/* Indicador de error visual similar al global */
:deep(.border-red-input .v-field__outline) {
  --v-field-border-color: rgb(239, 68, 68) !important;
  --v-field-border-width: 2px !important;
}
</style>
