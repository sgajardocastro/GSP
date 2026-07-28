<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-xl shadow-amber-500/5">
          <ArrowLeftRight class="w-7 h-7" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">Procesos & Kardex de Auditoría WMS-Lite</h1>
            <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">AUDITORÍA KARDEX</span>
          </div>
          <p class="text-slate-400 text-xs mt-0.5">Ingresos por OC, impresión térmica de códigos de barra, traspasos y trazabilidad total del Kardex físico</p>
        </div>
      </div>
    </div>

    <!-- Pestañas de Procesos -->
    <div class="flex border-b border-slate-800 mb-6 gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80 overflow-x-auto">
      <button
        v-for="tab in procesosTabs"
        :key="tab.id"
        @click="activeProcesoTab = tab.id"
        :class="[
          'px-5 py-2.5 font-black text-xs rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider whitespace-nowrap',
          activeProcesoTab === tab.id ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'
        ]"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- PROCESO 1: RECEPCIÓN E INGRESO DE MATERIAL (OC + ETIQUETA TÉRMICA) -->
    <div v-if="activeProcesoTab === 'ingresos'" class="space-y-6">
      <div class="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h2 class="text-lg font-bold text-white uppercase flex items-center gap-2">
          <span>📥</span> Recepción de Materiales con Orden de Compra (OC)
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Bodega Destino *</label>
            <select v-model="formIngreso.id_bodega" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white">
              <option :value="1">Bodega Principal Santiago</option>
              <option :value="2">Bodega Faena Antofagasta</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Seleccionar Producto del Catálogo *</label>
            <select v-model="formIngreso.id_producto" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white">
              <option :value="1">Mascarillas N95 (Caja x20 unids)</option>
              <option :value="2">Filtro de Aceite Motorcraft FL-400S</option>
              <option :value="3">Pastillas de Freno Brembo</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Cantidad a Ingresar *</label>
            <input v-model.number="formIngreso.cantidad" type="number" min="1" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Costo Neto ($) *</label>
            <input v-model.number="formIngreso.costo" type="number" min="1" placeholder="Ej: 4500" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-slate-400 mb-1 font-bold uppercase">Nº Orden de Compra (OC) *</label>
            <input v-model="formIngreso.oc" type="text" placeholder="Ej: OC-993821" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono" />
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button @click="procesarIngreso" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20">
            Ingresar e Imprimir Barcode
          </button>
        </div>
      </div>
    </div>

    <!-- PROCESO 2: TRASPASOS INTER-BODEGA -->
    <div v-if="activeProcesoTab === 'traspasos'" class="space-y-6">
      <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-2xl">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase">
              <th class="p-3.5">ID Traspaso</th>
              <th class="p-3.5">Bodega Origen</th>
              <th class="p-3.5">Bodega Destino</th>
              <th class="p-3.5">Repuesto / SKU</th>
              <th class="p-3.5">Cantidad</th>
              <th class="p-3.5">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-for="t in traspasos" :key="t.id">
              <td class="p-3.5 font-mono font-bold text-amber-400">#TRP-{{ t.id }}</td>
              <td class="p-3.5 text-slate-300">{{ t.origen }}</td>
              <td class="p-3.5 text-slate-300">{{ t.destino }}</td>
              <td class="p-3.5 font-bold text-white">{{ t.producto }}</td>
              <td class="p-3.5 font-mono text-white font-bold">{{ t.cantidad }} unids.</td>
              <td class="p-3.5"><span class="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-amber-500/20">{{ t.estado }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PROCESO 3: TABLA DE AUDITORÍA KARDEX DE MOVIMIENTOS (POSTGRESQL) -->
    <div v-if="activeProcesoTab === 'kardex'" class="space-y-6">
      <div class="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
        <div>
          <h3 class="font-bold text-white text-sm uppercase">Kardex Físico & Registro de Auditoría</h3>
          <p class="text-xs text-slate-400">Historial inmutable de movimientos almacenados en PostgreSQL (tinv_movimiento)</p>
        </div>
        <div class="text-xs text-slate-400 font-semibold">
          Movimientos Registrados: <strong class="text-amber-400 font-mono">{{ movimientos.length }}</strong>
        </div>
      </div>

      <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-2xl">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
              <th class="p-3.5">Fecha / Hora</th>
              <th class="p-3.5">Usuario Auditor</th>
              <th class="p-3.5">Tipo Movimiento</th>
              <th class="p-3.5">Bodega</th>
              <th class="p-3.5">SKU / Producto</th>
              <th class="p-3.5">Cant. Movida</th>
              <th class="p-3.5">Stock Antes $\rightarrow$ Después</th>
              <th class="p-3.5">Referencia Doc</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-for="m in movimientos" :key="m.id" class="hover:bg-slate-800/60">
              <td class="p-3.5 text-slate-300 font-mono">{{ new Date(m.fecha_movimiento).toLocaleString('es-CL') }}</td>
              <td class="p-3.5 text-white font-bold">{{ m.usuario_registro }}</td>
              <td class="p-3.5">
                <span :class="[
                  'px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border',
                  m.tipo_movimiento.includes('INGRESO') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                ]">
                  {{ m.tipo_movimiento }}
                </span>
              </td>
              <td class="p-3.5 text-slate-300">{{ m.bodega_nombre }}</td>
              <td class="p-3.5 font-bold text-white">
                <div>{{ m.producto_nombre }}</div>
                <div class="text-[10px] text-amber-400 font-mono">{{ m.sku }}</div>
              </td>
              <td class="p-3.5 font-mono text-white font-black text-sm">{{ m.cantidad }} unids.</td>
              <td class="p-3.5 font-mono text-slate-300 font-bold">{{ m.stock_anterior }} $\rightarrow$ {{ m.stock_nuevo }}</td>
              <td class="p-3.5 font-mono text-amber-400 font-bold">{{ m.referencia }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowLeftRight } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const activeProcesoTab = ref('ingresos')

const procesosTabs = [
  { id: 'ingresos', name: '1. Recepción & Barcode' },
  { id: 'traspasos', name: '2. Traspasos Inter-Bodega' },
  { id: 'kardex', name: '3. Auditoría Kardex Físico' }
]

const formIngreso = ref({ id_bodega: 1, id_producto: 1, cantidad: 10, costo: 4500, oc: 'OC-993821' })

const traspasos = ref([
  { id: 101, origen: 'Bodega Principal Santiago', destino: 'Bodega Faena Antofagasta', producto: 'Filtro de Aceite Motorcraft (FILT-000501)', cantidad: 4, estado: 'EN_TRANSITO' }
])

const movimientos = ref([
  { id: 1, fecha_movimiento: new Date().toISOString(), usuario_registro: 'Sergio Gajardo', tipo_movimiento: 'INGRESO_OC', bodega_nombre: 'Bodega Principal Santiago', producto_nombre: 'Mascarillas de Protección N95 (Caja x20 unids)', sku: 'MASC-000101', cantidad: 15, stock_anterior: 0, stock_nuevo: 15, referencia: 'OC-88210' }
])

const fetchKardex = async () => {
  try {
    const { data } = await apiAxios.get('/inventario/movimientos')
    if (data && Array.isArray(data) && data.length > 0) {
      movimientos.value = data
    }
  } catch (err) {
    console.log('Cargando Kardex local:', err.message)
  }
}

const procesarIngreso = async () => {
  try {
    await apiAxios.post('/inventario/existencias/ingresar', formIngreso.value)
    alert('Recepción registrada e inyectada al Kardex de Auditoría con OC ' + formIngreso.value.oc)
    fetchKardex()
  } catch (err) {
    alert('Error al registrar ingreso: ' + (err.response?.data?.message || err.message))
  }
}

onMounted(fetchKardex)
</script>
