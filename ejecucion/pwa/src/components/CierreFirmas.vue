<template>
  <v-container>
    <v-row dense>
      <v-col
        cols="12"
        md="4"
        xl="3"
        v-for="flujo in flujosCierre"
        :key="flujo.id_flow"
      >
        <v-card
          class="mx-auto sombra-resaltada"
          :subtitle="`${flujo.name_empresa_cliente} / ${flujo.nombre_proyecto}`"
          :title="`${flujo.desc_template_srv}: ${flujo.name_template_srv}`"
        >
          <!-- Chip de estado -->
          <v-chip
            :color="getEstadoColor(flujo.cierreStep.estado).color"
            label
            size="large"
            class="ml-2 text-white"
            variant="flat"
          >
            {{ getEstadoColor(flujo.cierreStep.estado).texto }}
          </v-chip>

          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <!-- Info básica del flujo -->
                <div>
                  {{ `${flujo.name_area} - ${flujo.name_tipo_srv}` }}
                </div>
                <div>
                  {{ `${flujo.codi_template_srv} (Id ${flujo.id_survey})` }}
                </div>
                <div>
                  Cierre por: {{ flujo.cierreStep.nombre_user }}
                  <span v-if="flujo.cierreStep.name_rol">
                    ({{ flujo.cierreStep.name_rol }})
                  </span>
                </div>
                <div v-if="flujo.cierreStep.fecha_event">
                  Fecha cierre:
                  {{ new Date(flujo.cierreStep.fecha_event).toLocaleString() }}
                </div>
              </div>

              <!-- Botones acciones -->
              <div class="d-flex flex-column align-end" style="gap: 4px;">
                <!-- Ver PDF -->
                <v-btn
                  icon
                  variant="text"
                  color="red-darken-2"
                  @click="abrirCierre(flujo)"
                  :disabled="!flujo.tieneDocumento"
                >
                  <v-icon>mdi-file-pdf-box</v-icon>
                </v-btn>

                <!-- Firmar Cierre -->
                <v-btn
                  color="primary"
                  size="small"
                  variant="outlined"
                  @click="abrirDialogFirma(flujo)"
                >
                  <v-icon start>mdi-pen</v-icon>
                  Firmar
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog visor PDF solo lectura -->
    <v-dialog v-model="dialogVerPdf" width="1200">
      <v-card>
        <v-card-title class="text-h6">
          Cierre autónomo
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <div v-if="cierreSeleccionado">
                <p><strong>Usuario cierre:</strong> {{ cierreSeleccionado.nombre_user }}</p>
                <p v-if="cierreSeleccionado.name_rol">
                  <strong>Rol:</strong> {{ cierreSeleccionado.name_rol }}</p>
                <p v-if="cierreSeleccionado.fecha_event">
                  <strong>Fecha:</strong>
                  {{ new Date(cierreSeleccionado.fecha_event).toLocaleString() }}
                </p>
                <p v-if="cierreSeleccionado.flow_step_obs">
                  <strong>Observaciones:</strong><br>
                  {{ cierreSeleccionado.flow_step_obs }}
                </p>
              </div>
            </v-col>

            <v-col cols="12" md="8">
              <PdfViewer v-if="pdfUrl" :url="pdfUrl" />
              <div v-else class="text-center">
                No se encontró documento para este cierre.
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text @click="dialogVerPdf = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de firma reutilizable -->
    <FirmaDialog
      v-model="dialogFirma"
      :pdf-url="pdfUrlFirma"
      :detalle-flujo="flujoSeleccionadoFirma"
      @firmado="onFirmado"
    />
  </v-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import PdfViewer from '@/components/PdfViewer.vue'
import FirmaDialog from '@/components/FirmaDialog.vue'

const props = defineProps({
  flujos: {
    type: Array,
    default: () => []
  }
})

const dialogVerPdf = ref(false)
const pdfUrl = ref('')
const flujoSeleccionado = ref(null)
const cierreSeleccionado = ref(null)

// Para firma
const dialogFirma = ref(false)
const pdfUrlFirma = ref('')
const flujoSeleccionadoFirma = ref(null)

// Si quieres avisar al padre para que refresque flujos
const emit = defineEmits(['refrescarFlujos'])

/**
 * flujosCierre:
 * - Toma todos los flujos que tengan un detalle con estado = 'CIERRE AUTONOMO'
 * - Guarda ese paso de cierre en cierreStep
 * - Marca si tiene algún documento disponible para mostrar
 */
const flujosCierre = computed(() => {
  const result = []

  for (const flujo of props.flujos || []) {
    if (!Array.isArray(flujo.detalles)) continue

    const cierreStep = flujo.detalles.find(d => d.estado === 'CIERRE AUTONOMO')
    if (!cierreStep) continue

    // ¿Hay algún documento disponible en el flujo?
    const tieneDocEnCierre =
      cierreStep.name_doc_interno_out || cierreStep.name_doc_interno_in

    const pasoConDocumento = [...flujo.detalles]
      .sort(
        (a, b) =>
          Number(b.flow_tmpl_step_orden ?? 0) -
          Number(a.flow_tmpl_step_orden ?? 0)
      )
      .find(d => d.name_doc_interno_out || d.name_doc_interno_in)

    const tieneDocumento = !!(
      tieneDocEnCierre ||
      (pasoConDocumento &&
        (pasoConDocumento.name_doc_interno_out ||
          pasoConDocumento.name_doc_interno_in))
    )

    result.push({
      ...flujo,
      cierreStep,
      tieneDocumento
    })
  }

  // Ordenar por id_survey desc si existe
  result.sort((a, b) => Number(b.id_survey ?? 0) - Number(a.id_survey ?? 0))

  return result
})

function resolverDocumento (flujo) {
  // 1) Intentar con el propio paso de cierre
  let docName =
    flujo.cierreStep.name_doc_interno_out ||
    flujo.cierreStep.name_doc_interno_in

  // 2) Si no tiene documento el cierre, buscamos el último paso con doc
  if (!docName && Array.isArray(flujo.detalles)) {
    const pasoConDocumento = [...flujo.detalles]
      .sort(
        (a, b) =>
          Number(b.flow_tmpl_step_orden ?? 0) -
          Number(a.flow_tmpl_step_orden ?? 0)
      )
      .find(d => d.name_doc_interno_out || d.name_doc_interno_in)

    docName =
      pasoConDocumento?.name_doc_interno_out ||
      pasoConDocumento?.name_doc_interno_in
  }

  return docName
}

function abrirCierre (flujo) {
  flujoSeleccionado.value = flujo
  cierreSeleccionado.value = flujo.cierreStep

  const docName = resolverDocumento(flujo)

  pdfUrl.value = docName
    ? `/archivo/transmac/${docName}`
    : ''

  dialogVerPdf.value = true
}

function abrirDialogFirma (flujo) {
  flujoSeleccionadoFirma.value = flujo
  const docName = resolverDocumento(flujo)
  pdfUrlFirma.value = docName
    ? `/archivo/transmac/${docName}`
    : ''

  dialogFirma.value = true
}

function onFirmado () {
  // Si quieres que el padre recargue los flujos:
  emit('refrescarFlujos')
}

function getEstadoColor (estado) {
  switch (estado) {
    case 'CIERRE AUTONOMO':
      return { color: 'green-darken-2', texto: 'Cierre autónomo' }
    default:
      return { color: 'grey', texto: estado || 'Desconocido' }
  }
}
</script>

<style scoped>
.sombra-resaltada {
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3) !important;
  border-radius: 12px;
}
</style>
