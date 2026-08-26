<template>
  <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-fadeIn">
    <div class="bg-[#0b1021] border border-amber-500/40 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl shadow-black">
      
      <!-- CABECERA -->
      <div class="bg-[#050810] px-6 py-4 border-b border-white/10 flex justify-between items-center flex-shrink-0">
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
            📑
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h3 class="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                Carátula de Estado de Pago (EDP) — {{ edpData?.proyecto?.codi_proyecto || 'GSP-OT' }}
              </h3>
              <span 
                :class="esFacturado 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'" 
                class="text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded-md border"
              >
                {{ esFacturado ? '✅ Facturado Conforme' : '⏳ Pendiente Emisión Factura' }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Liquidación y conciliación de horas operadas, sobretiempos y fletes respaldados con firma mandante.
            </p>
          </div>
        </div>
        <button @click="cerrar" class="text-slate-400 hover:text-white text-2xl p-1 font-bold cursor-pointer transition-colors">✕</button>
      </div>

      <!-- CONTENIDO CON SCROLL -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200" id="caratula-edp-imprimible">
        
        <!-- MEMBRETE & DATOS DEL MANDANTE -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#080d1a] border border-white/15 rounded-xl p-5 shadow-sm">
          <!-- Datos Emisor GSP -->
          <div class="space-y-1 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4">
            <div class="flex items-center gap-2">
              <span class="text-xl">🏗️</span>
              <span class="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">Emisor del Servicio</span>
            </div>
            <h4 class="text-base font-black text-white">ARRIENDO DE GRÚAS SAN PABLO SPA</h4>
            <div class="text-xs text-slate-400 space-y-0.5">
              <div>RUT: <strong class="text-slate-200 font-mono">76.849.230-1</strong></div>
              <div>Giro: Arriendo de Maquinaria y Grúas para la Construcción y Minería</div>
              <div>Teléfono: +56 9 9842 1094 • Temuco, Chile</div>
            </div>
          </div>

          <!-- Datos Cliente Mandante -->
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xl">🏢</span>
              <span class="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">Cliente Mandante</span>
            </div>
            <h4 class="text-base font-black text-white">{{ edpData?.proyecto?.cliente_nombre || 'Cliente Mandante' }}</h4>
            <div class="text-xs text-slate-400 space-y-0.5">
              <div>RUT: <strong class="text-slate-200 font-mono">{{ edpData?.proyecto?.cliente_rut || 'S/R' }}</strong></div>
              <div>Faena / Obra: <strong class="text-slate-200">{{ edpData?.proyecto?.obra_nombre || 'En Terreno' }}</strong></div>
              <div class="truncate">Ubicación: {{ edpData?.proyecto?.obra_direccion || 'Faena' }}</div>
            </div>
          </div>
        </div>

        <!-- TARJETAS TOTALES DE COBRO -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-1">
            <span class="text-xs text-slate-400 font-bold uppercase font-mono block">Días Operados</span>
            <div class="text-2xl font-black font-mono text-white">
              {{ edpData?.resumen_financiero?.dias_totales || 0 }} <span class="text-xs text-slate-400 font-normal">DÍAS</span>
            </div>
            <span class="text-xs text-emerald-400 block font-medium">100% Respaldados</span>
          </div>

          <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-1">
            <span class="text-xs text-slate-400 font-bold uppercase font-mono block">Horas Facturables</span>
            <div class="text-2xl font-black font-mono text-white">
              {{ edpData?.resumen_financiero?.horas_facturables_totales || 0 }} <span class="text-xs text-slate-400 font-normal">HRS</span>
            </div>
            <span class="text-xs text-slate-400 block">Netas a cobrar</span>
          </div>

          <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-1">
            <span class="text-xs text-slate-400 font-bold uppercase font-mono block">Sobretiempo Extra</span>
            <div class="text-2xl font-black font-mono text-yellow-400">
              +{{ edpData?.resumen_financiero?.horas_sobretiempo_totales || 0 }} <span class="text-xs text-yellow-500 font-normal">HRS</span>
            </div>
            <span class="text-xs text-slate-400 block font-mono">{{ formatMoneda(edpData?.resumen_financiero?.monto_sobretiempo_neto) }}</span>
          </div>

          <div class="bg-amber-950/20 border border-amber-500/50 rounded-xl p-4 space-y-1 shadow-lg shadow-amber-500/5">
            <span class="text-xs text-amber-300 font-black uppercase font-mono block">💰 TOTAL NETO A COBRAR</span>
            <div class="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              {{ formatMoneda(edpData?.resumen_financiero?.total_neto) }}
            </div>
            <span class="text-xs text-slate-300 block font-mono">Total Bruto: {{ formatMoneda(edpData?.resumen_financiero?.total_bruto) }}</span>
          </div>
        </div>

        <!-- TABLA DE DESGLOSE DE LÍNEAS COTIZADAS Y CONCILIADAS -->
        <div class="bg-[#050810] border border-white/15 rounded-xl overflow-hidden shadow-md">
          <div class="px-4 py-3 bg-[#080d1a] border-b border-white/10 flex justify-between items-center">
            <h5 class="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>📋 Detalle de Servicios & Tarifas Conciliadas</span>
            </h5>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr class="bg-[#0b1021] text-slate-300 border-b border-white/10 font-bold uppercase font-mono">
                  <th class="py-2.5 px-3.5">Línea / Concepto</th>
                  <th class="py-2.5 px-3.5">Categoría</th>
                  <th class="py-2.5 px-3 text-center">Unidad</th>
                  <th class="py-2.5 px-3 text-center">Cant.</th>
                  <th class="py-2.5 px-3.5 text-right">Tarifa Pactada</th>
                  <th class="py-2.5 px-3.5 text-right text-amber-400">Subtotal Neto</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10 text-slate-200">
                <tr v-for="(l, idx) in edpData?.lineas_cotizadas || []" :key="idx" class="hover:bg-white/[0.02]">
                  <td class="py-3 px-3.5 font-bold text-white">
                    {{ l.descripcion || l.subcategoria || l.tipo }}
                  </td>
                  <td class="py-3 px-3.5 text-slate-400 font-mono">
                    {{ l.tipo }}
                  </td>
                  <td class="py-3 px-3 text-center font-mono text-slate-300">
                    {{ l.unidad }}
                  </td>
                  <td class="py-3 px-3 text-center font-mono font-bold text-white">
                    {{ l.cantidad }}
                  </td>
                  <td class="py-3 px-3.5 text-right font-mono text-slate-300">
                    {{ formatMoneda(l.valorUnitario) }}
                  </td>
                  <td class="py-3 px-3.5 text-right font-mono font-bold text-amber-300">
                    {{ formatMoneda(l.subtotal_calculado) }}
                  </td>
                </tr>

                <!-- Fila de Sobretiempos si aplica -->
                <tr v-if="Number(edpData?.resumen_financiero?.horas_sobretiempo_totales) > 0" class="bg-yellow-500/5">
                  <td class="py-3 px-3.5 font-bold text-yellow-300">
                    ⏱️ Sobretiempo de Izaje en Terreno
                  </td>
                  <td class="py-3 px-3.5 text-slate-400 font-mono">
                    HORAS EXTRA
                  </td>
                  <td class="py-3 px-3 text-center font-mono text-slate-300">
                    Horas
                  </td>
                  <td class="py-3 px-3 text-center font-mono font-bold text-yellow-300">
                    {{ edpData?.resumen_financiero?.horas_sobretiempo_totales }}h
                  </td>
                  <td class="py-3 px-3.5 text-right font-mono text-slate-300">
                    Tarifa Recargo
                  </td>
                  <td class="py-3 px-3.5 text-right font-mono font-bold text-yellow-300">
                    {{ formatMoneda(edpData?.resumen_financiero?.monto_sobretiempo_neto) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-[#0b1021] text-slate-200 border-t-2 border-white/20 font-mono font-bold">
                  <td colspan="5" class="py-2.5 px-3.5 text-right text-slate-400 uppercase">SUBTOTAL NETO:</td>
                  <td class="py-2.5 px-3.5 text-right text-white font-black">{{ formatMoneda(edpData?.resumen_financiero?.total_neto) }}</td>
                </tr>
                <tr class="bg-[#0b1021] text-slate-200 font-mono">
                  <td colspan="5" class="py-1.5 px-3.5 text-right text-slate-400 uppercase">IVA (19%):</td>
                  <td class="py-1.5 px-3.5 text-right text-slate-300">{{ formatMoneda(edpData?.resumen_financiero?.iva_19) }}</td>
                </tr>
                <tr class="bg-[#080d1a] text-amber-400 font-mono font-black text-sm border-t border-amber-500/30">
                  <td colspan="5" class="py-2.5 px-3.5 text-right uppercase">TOTAL GENERAL A FACTURAR (BRUTO):</td>
                  <td class="py-2.5 px-3.5 text-right text-amber-300 text-base">{{ formatMoneda(edpData?.resumen_financiero?.total_bruto) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- RESUMEN DE FIRMAS Y RESPALDOS DE TERRENO -->
        <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-3">
          <h5 class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>✍️ Respaldos de Terreno Firmados por el Mandante ({{ edpData?.reports_validados?.length || 0 }} Jornadas)</span>
          </h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div 
              v-for="rep in edpData?.reports_validados || []" 
              :key="rep.id_reporte_avance"
              class="bg-[#080d1a] border border-white/10 rounded-lg p-3 space-y-2"
            >
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-amber-400 font-mono">Día {{ rep.dia_correlativo }} • {{ formatearFecha(rep.fecha_reporte) }}</span>
                <span class="text-emerald-400 font-mono font-bold">{{ rep.horas_facturables }} hrs</span>
              </div>
              <div class="text-[11px] text-slate-400">
                Grúa: <strong class="text-slate-200 font-mono">{{ rep.equipo_patente }}</strong> ({{ rep.equipo_modelo }})
              </div>
              <!-- Miniatura Firma -->
              <div class="bg-white rounded p-1 flex items-center justify-center h-16 overflow-hidden">
                <img 
                  v-if="rep.cliente_firma_canvas_base64" 
                  :src="rep.cliente_firma_canvas_base64" 
                  alt="Firma Mandante" 
                  class="max-h-full object-contain filter contrast-125"
                />
                <span v-else class="text-slate-400 text-xs italic">Sin imagen de firma</span>
              </div>
              <div class="text-[10px] text-slate-400 text-center truncate">
                Firmó: <strong class="text-slate-200">{{ rep.cliente_nombre || 'Mandante' }}</strong> ({{ rep.cliente_cargo || 'Supervisor' }})
              </div>
            </div>
          </div>
        </div>

        <!-- DATOS DE FACTURACIÓN SI YA FUE CERRADA -->
        <div v-if="esFacturado" class="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 space-y-2">
          <h5 class="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <span>✅ Registro de Facturación Oficial</span>
          </h5>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span class="text-slate-400 block">N° Factura:</span>
              <strong class="text-white font-mono text-sm">{{ edpData?.liquidacion_guardada?.factura_numero }}</strong>
            </div>
            <div>
              <span class="text-slate-400 block">N° HES / OC:</span>
              <strong class="text-white font-mono text-sm">{{ edpData?.liquidacion_guardada?.hes_oc_numero || 'N/A' }}</strong>
            </div>
            <div>
              <span class="text-slate-400 block">Fecha Facturación:</span>
              <strong class="text-white">{{ formatearFecha(edpData?.liquidacion_guardada?.fecha_facturacion) }}</strong>
            </div>
            <div>
              <span class="text-slate-400 block">Monto Facturado:</span>
              <strong class="text-emerald-400 font-mono text-sm">{{ formatMoneda(edpData?.liquidacion_guardada?.monto_facturado_neto) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER ACCIONES -->
      <div class="bg-[#050810] px-6 py-4 border-t border-white/10 flex justify-between items-center flex-shrink-0">
        <div class="text-xs text-slate-400">
          Documento válido para tramitación de HES y Facturación Electrónica.
        </div>
        <div class="flex items-center gap-3">
          <button 
            @click="imprimirCaratula" 
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>🖨️</span>
            <span>Imprimir / PDF</span>
          </button>
          <button 
            @click="cerrar" 
            class="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  edpData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

const esFacturado = computed(() => {
  return props.edpData?.proyecto?.id_proyecto_estado === 7 || props.edpData?.liquidacion_guardada !== null
})

const cerrar = () => {
  emit('close')
}

const formatMoneda = (val) => {
  if (!val && val !== 0) return '$0'
  return '$' + Number(val).toLocaleString('es-CL')
}

const formatearFecha = (fStr) => {
  if (!fStr) return '---'
  try {
    const d = new Date(fStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return fStr
  }
}

const imprimirCaratula = () => {
  window.print()
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
