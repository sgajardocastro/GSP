<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/30 shadow-xl shadow-rose-500/5">
          <AlertTriangle class="w-7 h-7" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">Alertas & Quiebres de Stock</h1>
            <span class="text-xs bg-rose-500/10 text-rose-400 font-bold px-2.5 py-0.5 rounded border border-rose-500/20">CONTROL MÍNIMOS WMS</span>
          </div>
          <p class="text-slate-400 text-xs mt-0.5">Monitoreo de niveles críticos de insumos, quiebres de stock y sugerencias de compra</p>
        </div>
      </div>
    </div>

    <!-- KPIs de Quiebre -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Quiebres Críticos</div>
          <div class="text-2xl font-black text-rose-400 mt-1 font-mono">{{ quiebresCriticosCount }}</div>
        </div>
        <div class="p-3 bg-rose-500/10 text-rose-400 rounded-xl"><AlertTriangle class="w-6 h-6" /></div>
      </div>
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Punto de Reorden</div>
          <div class="text-2xl font-black text-amber-400 mt-1 font-mono">{{ puntoReordenCount }}</div>
        </div>
        <div class="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><RefreshCw class="w-6 h-6" /></div>
      </div>
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Nivel Normal</div>
          <div class="text-2xl font-black text-emerald-400 mt-1 font-mono">{{ nivelNormalCount }}</div>
        </div>
        <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><CheckCircle2 class="w-6 h-6" /></div>
      </div>
    </div>

    <!-- Tabla de Alertas de Stock -->
    <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-2xl">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase">
            <th class="p-3.5">SKU</th>
            <th class="p-3.5">Repuesto / Producto</th>
            <th class="p-3.5">Marca</th>
            <th class="p-3.5">Stock Actual</th>
            <th class="p-3.5">Stock Mínimo</th>
            <th class="p-3.5">Punto Reorden</th>
            <th class="p-3.5">Estado Alerta</th>
            <th class="p-3.5 text-right">Acción Sugerida</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-medium">
          <tr v-for="item in alertas" :key="item.id" class="hover:bg-slate-800/60">
            <td class="p-3.5 font-mono font-bold text-amber-400">{{ item.sku }}</td>
            <td class="p-3.5 font-bold text-white text-sm">{{ item.nombre }}</td>
            <td class="p-3.5 text-slate-300 font-semibold">{{ item.marca }}</td>
            <td class="p-3.5 font-mono text-white font-black text-sm">{{ item.stock_actual }} unids.</td>
            <td class="p-3.5 font-mono text-rose-400 font-bold">{{ item.nivel_minimo }} unids.</td>
            <td class="p-3.5 font-mono text-amber-400 font-bold">{{ item.punto_reorden }} unids.</td>
            <td class="p-3.5">
              <span :class="[
                'px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border',
                item.estado_alerta === 'QUIEBRE_CRITICO' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                item.estado_alerta === 'PUNTO_REORDEN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              ]">
                {{ item.estado_alerta === 'QUIEBRE_CRITICO' ? 'QUIEBRE CRÍTICO' : item.estado_alerta === 'PUNTO_REORDEN' ? 'REORDEN REQUERIDO' : 'NORMAL' }}
              </span>
            </td>
            <td class="p-3.5 text-right">
              <button
                v-if="item.estado_alerta !== 'NORMAL'"
                @click="generarSolicitudCompra(item)"
                class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider inline-flex shadow-md"
              >
                + Generar Solicitud OC
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const alertas = ref([
  { id: 1, sku: 'FILT-000501', nombre: 'Filtro de Aceite Motorcraft FL-400S', marca: 'Motorcraft', stock_actual: 2, nivel_minimo: 5, punto_reorden: 10, estado_alerta: 'QUIEBRE_CRITICO' },
  { id: 2, sku: 'PAST-000882', nombre: 'Pastillas de Freno Cerámicas Delanteras', marca: 'Brembo', stock_actual: 6, nivel_minimo: 2, punto_reorden: 8, estado_alerta: 'PUNTO_REORDEN' },
  { id: 3, sku: 'ACEI-000992', nombre: 'Aceite Hidráulico ISO VG 68 Premium', marca: 'Shell Tellus', stock_actual: 15, nivel_minimo: 5, punto_reorden: 10, estado_alerta: 'NORMAL' }
])

const quiebresCriticosCount = computed(() => alertas.value.filter(a => a.estado_alerta === 'QUIEBRE_CRITICO').length)
const puntoReordenCount = computed(() => alertas.value.filter(a => a.estado_alerta === 'PUNTO_REORDEN').length)
const nivelNormalCount = computed(() => alertas.value.filter(a => a.estado_alerta === 'NORMAL').length)

const fetchAlertas = async () => {
  try {
    const { data } = await apiAxios.get('/inventario/alertas/quiebres')
    if (data && Array.isArray(data) && data.length > 0) {
      alertas.value = data
    }
  } catch (err) {
    console.log('Cargando alertas locales:', err.message)
  }
}

const generarSolicitudCompra = (item) => {
  alert(`Solicitud de compra generada para ${item.nombre} (${item.sku}). Cantidad sugerida a comprar: ${item.punto_reorden * 2} unids.`)
}

onMounted(fetchAlertas)
</script>
