<template>
  <div class="h-full flex flex-col">
    <!-- VISOR IFRAME RESPONSIVO -->
    <div class="flex-1 min-h-0 bg-[#030712] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
      <iframe
        ref="iframeRef"
        :src="urlDocCompleta"
        class="w-full h-full border-0"
        title="Visor de Documentación Oficial"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, ExternalLink, RotateCw } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const iframeRef = ref(null)
const recargando = ref(false)

const baseUrl = import.meta.env.BASE_URL || '/'

const accesosRapidos = [
  { file: 'centro_documentacion_gsp.html', label: 'Catálogo', icono: '🌐', title: 'Centro de Documentación del Sistema (Portal Maestro)' },
  { file: 'bpmn_proceso_servicio_gsp.html', label: 'Modelo BPMN 2.0', icono: '🔀', title: 'Modelo de Procesos BPMN 2.0 (Ciclo Completo Granular & Asíncrono)' },
  { file: 'presentacion_pipeline_interactivo.html', label: 'Plano E2E', icono: '📐', title: 'Plano Maestro de Procesos & Linaje E2E' },
  { file: 'tratamiento_riggers_y_prevencionistas_estructurador.html', label: 'Riggers & Estructurador', icono: '⚙️', title: 'Tratamiento de Riggers y Prevencionistas en el Estructurador' },
  { file: 'manual_contabilidad_edp_y_facturacion_gsp.html', label: 'Contabilidad & EDP', icono: '💳', title: 'Manual Oficial: Contabilidad, Circuito EDP (3 Firmas FES) y Facturación Inmediata' },
  { file: 'infografia_taller_bodega.html', label: 'Taller & Pañol', icono: '🔧', title: 'Infografía Operativa: Taller & Pañol Temuco' },
  { file: 'manual_operador_terreno_gsp.html', label: 'Operador Terreno', icono: '🚜', title: 'Manual Oficial del Operador en Terreno' },
  { file: 'manual_entrega_y_retorno_plataformas_bsm.html', label: 'Plataformas 360°', icono: '📋', title: 'Manual Plataformas 360°: Entrega, Retiro & Actas' },
  { file: 'manual_operativo_inventario_wms_gsp.html', label: 'Inventario WMS', icono: '📦', title: 'Manual Operativo de Inventario & WMS' },
  { file: 'presentacion_pipeline_interactivo.html', label: 'Plano E2E', icono: '📐', title: 'Plano Maestro de Procesos & Linaje E2E' }
]

const docActual = computed(() => {
  return route.query.doc || 'centro_documentacion_gsp.html'
})

const urlDocCompleta = computed(() => {
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${cleanBase}${docActual.value}`
})

const tituloDocActivo = computed(() => {
  const match = accesosRapidos.find(a => a.file === docActual.value)
  if (match) return match.title
  return docActual.value.replace(/_/g, ' ').replace('.html', '').toUpperCase()
})

const seleccionarDoc = (doc) => {
  router.push({
    name: 'documentacion',
    query: { doc }
  })
}

const recargarIframe = () => {
  recargando.value = true
  if (iframeRef.value) {
    iframeRef.value.src = urlDocCompleta.value
  }
  setTimeout(() => {
    recargando.value = false
  }, 500)
}

watch(() => route.query.doc, () => {
  recargarIframe()
})
</script>
