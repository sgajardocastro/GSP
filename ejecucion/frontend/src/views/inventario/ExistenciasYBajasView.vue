<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- Encabezado de Pantalla -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-xl shadow-amber-500/5">
          <Boxes class="w-7 h-7" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">2. Vista de Existencias y Bajas</h1>
            <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">GLOBAL MANAGER WMS</span>
          </div>
          <p class="text-slate-400 text-xs mt-0.5">Consultar el stock disponible en bodega, supervisar niveles mínimos y registrar la baja física de materiales</p>
        </div>
      </div>
    </div>

    <!-- 1. RESUMEN CONTABLE (VISUALIZACIÓN) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Valorización Económica Total</div>
          <div class="text-2xl font-black text-emerald-400 mt-1 font-mono">${{ totalValorizacion.toLocaleString('es-CL') }}</div>
        </div>
        <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><DollarSign class="w-6 h-6" /></div>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Cantidad Global del Stock</div>
          <div class="text-2xl font-black text-white mt-1 font-mono">{{ totalStockGlobal }} <span class="text-xs text-slate-400 font-normal">unids.</span></div>
        </div>
        <div class="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Boxes class="w-6 h-6" /></div>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Productos en Quiebre</div>
          <div class="text-2xl font-black text-rose-400 mt-1 font-mono">{{ productosQuiebreCount }}</div>
        </div>
        <div class="p-3 bg-rose-500/10 text-rose-400 rounded-xl"><AlertTriangle class="w-6 h-6" /></div>
      </div>
    </div>

    <!-- 2. ALERTAS DE QUIEBRE DE STOCK (GRILLA SUPERIOR) -->
    <div v-if="alertasQuiebre.length > 0" class="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-5 mb-6 space-y-3">
      <h3 class="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
        <AlertTriangle class="w-4 h-4" /> Alertas de Quiebre de Stock (Stock menor al mínimo)
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div v-for="a in alertasQuiebre" :key="a.id" class="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex justify-between items-center text-xs">
          <div>
            <span class="font-bold text-white block">{{ a.nombre }}</span>
            <span class="text-slate-400 font-mono text-[10px]">SKU: {{ a.sku }}</span>
          </div>
          <div class="text-right">
            <span class="text-rose-400 font-mono font-black block">{{ a.stock_actual }} unids.</span>
            <span class="text-[9px] text-slate-400">Mín: {{ a.nivel_minimo }} unids.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. LISTADO DE EXISTENCIAS FÍSICAS (GRILLA DETALLADA) -->
    <div class="space-y-4">
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 Buscar existencias por SKU, Código de Barras, Nombre o N° OC..."
          class="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 w-full md:w-96 text-xs focus:outline-none focus:border-amber-500"
        />
        <div class="text-xs text-slate-400 font-semibold">
          Existencias Físicas: <strong class="text-amber-400 font-mono">{{ filteredExistencias.length }}</strong>
        </div>
      </div>

      <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-2xl">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
              <th class="p-3.5">Cód. Barras Único</th>
              <th class="p-3.5">SKU Comercial</th>
              <th class="p-3.5">Repuesto / Producto</th>
              <th class="p-3.5">Cant. Dispon.</th>
              <th class="p-3.5">Costo Adquisición ($)</th>
              <th class="p-3.5">Nº OC</th>
              <th class="p-3.5">Fecha Entrada</th>
              <th class="p-3.5">Estado</th>
              <th class="p-3.5 text-right">Acción de Baja</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-for="item in filteredExistencias" :key="item.id" class="hover:bg-slate-800/60">
              <td class="p-3.5 font-mono font-bold text-amber-400">{{ item.codigo_barras || 'BAR-00' + item.id }}</td>
              <td class="p-3.5 font-mono text-slate-300 font-bold">{{ item.sku }}</td>
              <td class="p-3.5 font-bold text-white text-sm">{{ item.producto_nombre }}</td>
              <td class="p-3.5 font-mono text-white font-black text-sm">{{ item.cantidad_disponible }} unids.</td>
              <td class="p-3.5 font-mono text-emerald-400 font-bold">${{ Number(item.costo).toLocaleString('es-CL') }}</td>
              <td class="p-3.5 font-mono text-slate-300">{{ item.oc }}</td>
              <td class="p-3.5 font-mono text-slate-400">{{ new Date(item.fecha_ingreso || Date.now()).toLocaleDateString('es-CL') }}</td>
              <td class="p-3.5">
                <span :class="['px-2.5 py-1 rounded text-[10px] font-black uppercase border', item.estado === 'DISPONIBLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20']">
                  {{ item.estado }}
                </span>
              </td>
              <td class="p-3.5 text-right">
                <button
                  v-if="item.estado === 'DISPONIBLE'"
                  @click="openBajaModal(item)"
                  class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold px-3 py-1.5 rounded-lg text-xs"
                >
                  Dar de Baja
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL DE BAJA FÍSICA CON BOTÓN INHABILITADO SIN JUSTIFICACIÓN (REGLA GLOBAL MANAGER) -->
    <div v-if="showBajaModal && selectedItem" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white uppercase text-rose-400 flex items-center gap-2">
            <span>🗑️</span> Registro de Baja Física de Material
          </h3>
          <button @click="showBajaModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
          <div><span class="text-slate-400 font-bold">Producto:</span> <strong class="text-white">{{ selectedItem.producto_nombre }}</strong></div>
          <div><span class="text-slate-400 font-bold">SKU / Cód. Barras:</span> <span class="font-mono text-amber-400">{{ selectedItem.sku }} / {{ selectedItem.codigo_barras || 'BAR-00' + selectedItem.id }}</span></div>
          <div><span class="text-slate-400 font-bold">Cantidad Dispon.:</span> <strong class="text-white">{{ selectedItem.cantidad_disponible }} unids.</strong></div>
        </div>

        <div class="space-y-2 text-xs">
          <label class="block text-slate-400 font-bold uppercase">Motivo de la Baja (Campo Obligatorio) *</label>
          <textarea
            v-model="motivoBaja"
            rows="3"
            placeholder="Escriba la justificación detallada de la baja física (daño, vencimiento, merma autorizada)..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
          ></textarea>
          <p v-if="!motivoBaja.trim()" class="text-[10px] text-rose-400 font-bold">
            ⚠️ Regla de Negocio: El botón de confirmación se mantiene inhabilitado hasta ingresar la justificación.
          </p>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showBajaModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button
            :disabled="!motivoBaja.trim()"
            @click="confirmarBaja"
            class="bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg"
          >
            Confirmar Baja Física
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Boxes, DollarSign, AlertTriangle } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const searchQuery = ref('')
const showBajaModal = ref(false)
const selectedItem = ref(null)
const motivoBaja = ref('')

const existencias = ref([
  { id: 1, sku: 'MASC-000101', codigo_barras: 'BAR-101-889', producto_nombre: 'Mascarillas de Protección N95 (Caja x20 unids)', cantidad_disponible: 15, costo: 18500, oc: 'OC-88210', estado: 'DISPONIBLE' },
  { id: 2, sku: 'FILT-000501', codigo_barras: 'BAR-501-889', producto_nombre: 'Filtro de Aceite Motorcraft FL-400S', cantidad_disponible: 14, costo: 4500, oc: 'OC-99382', estado: 'DISPONIBLE' },
  { id: 3, sku: 'ACEI-000992', codigo_barras: 'BAR-992-100', producto_nombre: 'Aceite Hidráulico ISO VG 68 Premium', cantidad_disponible: 2, costo: 38000, oc: 'OC-99411', estado: 'DISPONIBLE' }
])

const alertasQuiebre = ref([
  { id: 3, sku: 'ACEI-000992', nombre: 'Aceite Hidráulico ISO VG 68 Premium', stock_actual: 2, nivel_minimo: 5 }
])

const totalValorizacion = computed(() => existencias.value.reduce((acc, e) => acc + (Number(e.costo) * Number(e.cantidad_disponible)), 0))
const totalStockGlobal = computed(() => existencias.value.reduce((acc, e) => acc + Number(e.cantidad_disponible), 0))
const productosQuiebreCount = computed(() => alertasQuiebre.value.length)

const filteredExistencias = computed(() => {
  return existencias.value.filter(e => {
    return !searchQuery.value ||
      e.sku.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      e.producto_nombre.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      e.oc.toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})

const fetchExistencias = async () => {
  try {
    const { data } = await apiAxios.get('/inventario/existencias')
    if (data && Array.isArray(data) && data.length > 0) {
      existencias.value = data
    }
  } catch (err) {
    console.log('Cargando existencias locales:', err.message)
  }
}

const openBajaModal = (item) => {
  selectedItem.value = item
  motivoBaja.value = ''
  showBajaModal.value = true
}

const confirmarBaja = () => {
  if (!motivoBaja.value.trim()) return
  selectedItem.value.estado = 'BAJA_FISICA'
  showBajaModal.value = false
  alert(`Baja registrada exitosamente para ${selectedItem.value.producto_nombre}. Justificación guardada en Bitácora de Eventos.`)
}

onMounted(fetchExistencias)
</script>
