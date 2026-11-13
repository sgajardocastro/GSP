<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- ENCABEZADO CANÓNICO WMS -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/5">
            <Boxes class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">Existencias Físicas & Bajas WMS</h1>
              <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">
                Resuelve: C3 · Multi-ubicación & Estados de Stock
              </span>
            </div>
            <p class="text-slate-400 text-xs mt-0.5">
              Auditoría granular de existencias físicas por celda/rack, segregación por estado y gestión de bajas
            </p>
          </div>
        </div>
      </div>

      <button
        @click="showBajaModal = true"
        class="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all self-start lg:self-auto"
      >
        <Trash2 class="w-4 h-4" /> + Dar de Baja Físico
      </button>
    </div>

    <!-- PESTAÑAS: EXISTENCIAS POR ESTADO vs HISTORIAL DE BAJAS -->
    <div class="flex gap-2 mb-6 border-b border-slate-800/80 pb-3">
      <button
        @click="activeTab = 'existencias'"
        :class="[
          'px-4 py-2 font-black text-xs rounded-xl uppercase tracking-wider transition-all',
          activeTab === 'existencias' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        Existencias Físicas por Ubicación ({{ filteredExistencias.length }})
      </button>
      <button
        @click="activeTab = 'bajas'"
        :class="[
          'px-4 py-2 font-black text-xs rounded-xl uppercase tracking-wider transition-all',
          activeTab === 'bajas' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        Bitácora de Bajas & Desincorporaciones
      </button>
    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 1: EXISTENCIAS FÍSICAS CANÓNICAS                              -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'existencias'" class="space-y-4">
      <!-- Filtros rápidos por estado contable/operativo -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <button
            v-for="st in stockFilters"
            :key="st.key"
            @click="selectedState = st.key"
            :class="[
              'px-3.5 py-1.5 rounded-xl font-bold transition-all uppercase tracking-wider',
              selectedState === st.key ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            ]"
          >
            {{ st.label }}
          </button>
        </div>

        <div class="flex items-center gap-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por SKU, repuesto o rack..."
            class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 font-mono w-64"
          />
          <div class="text-xs text-slate-400 font-mono shrink-0">
            Valorizado Total: <strong class="text-emerald-400 font-bold">${{ totalValorizado.toLocaleString('es-CL') }}</strong>
          </div>
        </div>
      </div>

      <!-- Tabla de Existencias Granulares -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase">
                <th class="p-3">Producto / Repuesto</th>
                <th class="p-3">Ubicación Rack</th>
                <th class="p-3">Lote / Serie</th>
                <th class="p-3">Estado Físico</th>
                <th class="p-3">Stock Físico</th>
                <th class="p-3">Reservado</th>
                <th class="p-3">En Tránsito</th>
                <th class="p-3">Disponible</th>
                <th class="p-3 text-right">Valor PMP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono">
              <tr v-for="e in filteredExistencias.slice(0, 100)" :key="e.id" class="hover:bg-slate-800/30 transition-colors">
                <td class="p-3 font-sans">
                  <div class="font-bold text-white">{{ e.producto_nombre }}</div>
                  <div class="text-[11px] text-amber-400/90 font-mono">{{ e.sku }} · {{ e.codigo_legado || '—' }}</div>
                </td>
                <td class="p-3 font-bold" :class="e.ubicacion_codigo === 'SIN-UBICAR' ? 'text-rose-400' : 'text-slate-200'">
                  📍 {{ e.ubicacion_codigo }}
                </td>
                <td class="p-3 text-[11px]">
                  <span v-if="e.numero_lote" class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                    Lote {{ e.numero_lote }}
                  </span>
                  <span v-else-if="e.numero_serie" class="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold">
                    SN {{ e.numero_serie }}
                  </span>
                  <span v-else class="text-slate-500">—</span>
                </td>
                <td class="p-3">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-black uppercase border',
                      e.estado_stock === 'LIBRE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      e.estado_stock === 'CALIDAD_CUARENTENA' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      e.estado_stock === 'EN_REPARACION' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                      'bg-slate-800 text-slate-300'
                    ]"
                  >
                    {{ e.estado_stock || 'LIBRE' }}
                  </span>
                </td>
                <td class="p-3 text-white font-bold">{{ e.cantidad_fisica }} {{ e.uom || 'UN' }}</td>
                <td class="p-3 text-slate-400">{{ e.cantidad_reservada || 0 }} {{ e.uom || 'UN' }}</td>
                <td class="p-3 text-slate-400">0</td>
                <td class="p-3 text-emerald-400 font-black">{{ e.cantidad_disponible || e.cantidad_fisica }} {{ e.uom || 'UN' }}</td>
                <td class="p-3 text-right text-emerald-400 font-bold">
                  ${{ Math.round(Number(e.valorizacion_total || (Number(e.pmp || 0) * Number(e.cantidad_fisica || 0)))).toLocaleString('es-CL') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-400 font-sans">
          💡 <strong>Regla WMS:</strong> Una fila = Producto × Ubicación × (Lote/Serie si aplica). Un mismo repuesto puede estar fraccionado en varias ubicaciones simultáneas.
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 2: BITÁCORA DE BAJAS & DESINCORPORACIONES                     -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'bajas'" class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
        <div>
          <h2 class="text-xs font-bold text-white uppercase font-mono tracking-wider">Bitácora Oficial de Bajas y Mermas</h2>
          <p class="text-[11px] text-slate-400">Desincorporación física de repuestos por daño irreparable, obsolescencia o scrap</p>
        </div>
        <span class="text-xs font-mono text-rose-400 font-bold">{{ bajasLog.length }} actas de baja</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase">
              <th class="p-3"># Acta</th>
              <th class="p-3">Fecha</th>
              <th class="p-3">Repuesto Insumo</th>
              <th class="p-3">Ubicación Origen</th>
              <th class="p-3">Cantidad Dada de Baja</th>
              <th class="p-3">Motivo Tipificado</th>
              <th class="p-3">Usuario Auditor</th>
              <th class="p-3 text-right">Pérdida Contable</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-mono">
            <tr v-for="b in bajasLog" :key="b.id" class="hover:bg-slate-800/30 transition-colors">
              <td class="p-3 font-bold text-amber-400">#{{ b.id }}</td>
              <td class="p-3 text-slate-400 text-[11px]">{{ b.fecha }}</td>
              <td class="p-3 font-sans">
                <div class="font-bold text-white">{{ b.nombre }}</div>
                <div class="text-[11px] text-slate-400 font-mono">{{ b.sku }}</div>
              </td>
              <td class="p-3 font-bold text-amber-300">📍 {{ b.ubicacion }}</td>
              <td class="p-3 text-rose-400 font-black font-mono">−{{ b.cantidad }} UN</td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                  {{ b.motivo }}
                </span>
              </td>
              <td class="p-3 text-slate-300 text-[11px]">{{ b.usuario }}</td>
              <td class="p-3 text-right text-rose-400 font-bold font-mono">
                −${{ b.valor.toLocaleString('es-CL') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Boxes, Trash2 } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const activeTab = ref('existencias')
const selectedState = ref('TODOS')
const searchQuery = ref('')
const showBajaModal = ref(false)

const stockFilters = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'LIBRE', label: 'Libre' },
  { key: 'CALIDAD_CUARENTENA', label: 'Cuarentena' },
  { key: 'EN_REPARACION', label: 'En Reparación' },
  { key: 'TRANSITO', label: 'En Tránsito' }
]

const existencias = ref([])

const bajasLog = ref([
  { id: 'BAJA-2026-004', fecha: '11-10-2026 15:40', sku: 'GSP-000977', nombre: 'Ampolleta H4 24V 75/70W', ubicacion: 'E3-B2', cantidad: 2, motivo: 'DAÑO_OPERACIONAL', usuario: 'supervisor.aprob', valor: 5800 },
  { id: 'BAJA-2026-003', fecha: '08-10-2026 11:20', sku: 'GSP-000618', nombre: 'Grasa multipropósito EP2 (Balde)', ubicacion: 'PAÑOL', cantidad: 1, motivo: 'VENCIMIENTO', usuario: 'supervisor.aprob', valor: 75600 }
])

const filteredExistencias = computed(() => {
  let list = existencias.value
  if (selectedState.value !== 'TODOS') {
    list = list.filter(e => (e.estado_stock || 'LIBRE') === selectedState.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(e =>
      (e.sku && e.sku.toLowerCase().includes(q)) ||
      (e.producto_nombre && e.producto_nombre.toLowerCase().includes(q)) ||
      (e.ubicacion_codigo && e.ubicacion_codigo.toLowerCase().includes(q))
    )
  }
  return list
})

const totalValorizado = computed(() => {
  return filteredExistencias.value.reduce((acc, e) => {
    const v = Number(e.valorizacion_total) || (Number(e.pmp || 0) * Number(e.cantidad_fisica || 0))
    return acc + (isNaN(v) ? 0 : v)
  }, 0)
})

onMounted(async () => {
  try {
    const res = await apiAxios.get('/inventario/existencias')
    const data = res.data?.data || res.data
    if (Array.isArray(data)) {
      existencias.value = data
    }
  } catch (err) {}
})
</script>
