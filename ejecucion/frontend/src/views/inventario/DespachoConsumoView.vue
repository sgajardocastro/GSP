<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-xl shadow-amber-500/5">
          <Send class="w-7 h-7" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">5. Despacho y Consumo (Directo / OT)</h1>
            <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">GLOBAL MANAGER WMS</span>
          </div>
          <p class="text-slate-400 text-xs mt-0.5">Imputar existencias a Órdenes de Trabajo (OT) de mantenimiento o Centros de Costo operacionales</p>
        </div>
      </div>
    </div>

    <!-- PANTALLA 5 GLOBAL MANAGER -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 class="text-base font-bold text-white uppercase border-b border-slate-800 pb-3 flex items-center gap-2">
          <span>📦</span> Despacho de Materiales por Lectura de Código de Barras
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <!-- Tipo de Imputación -->
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Tipo de Imputación *</label>
            <select v-model="tipoImputacion" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white">
              <option value="OT">Órden de Trabajo (Mantenimiento)</option>
              <option value="CC">Centro de Costos Directo</option>
            </select>
          </div>

          <!-- Folio OT o Centro de Costos -->
          <div v-if="tipoImputacion === 'OT'">
            <label class="block text-slate-400 mb-1 font-bold uppercase">Folio Órden de Trabajo (OT) *</label>
            <input v-model="formDespacho.folio_ot" type="text" placeholder="Ej: OT-10045" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono" />
          </div>
          <div v-else>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Centro de Costo *</label>
            <select v-model="formDespacho.centro_costo" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white">
              <option value="CC-101">CC-101 (Grúas Telescópicas Santiago)</option>
              <option value="CC-102">CC-102 (Operaciones Minería Antofagasta)</option>
              <option value="CC-103">CC-103 (Taller San Bernardo)</option>
            </select>
          </div>

          <!-- Lectura de Códigos de Barra -->
          <div class="md:col-span-2">
            <label class="block text-slate-400 mb-1 font-bold uppercase">Escanear Código de Barras a Despachar *</label>
            <div class="flex gap-2">
              <input
                v-model="barcodeScan"
                @keyup.enter="scanBarcode"
                type="text"
                placeholder="Escanee la etiqueta del artículo (Ej: BAR-501-889) y presione Enter..."
                class="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-mono"
              />
              <button @click="scanBarcode" class="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-4 py-2 rounded-xl border border-slate-700">
                + Imputar
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de Artículos Imputados -->
        <div class="space-y-2 pt-2">
          <label class="block text-slate-400 text-xs font-bold uppercase">Materiales Imputados al Despacho ({{ itemsDespacho.length }})</label>
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 min-h-[120px] space-y-2">
            <div v-for="(item, idx) in itemsDespacho" :key="idx" class="flex justify-between items-center bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs font-mono">
              <div>
                <span class="text-amber-400 font-bold block">{{ item.barcode }}</span>
                <span class="text-slate-300 text-[11px] font-sans font-bold">{{ item.nombre }}</span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-emerald-400 font-bold">${{ item.costo.toLocaleString('es-CL') }}</span>
                <button @click="removerItem(idx)" class="text-slate-500 hover:text-rose-400 font-bold">✕</button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-slate-800">
          <div>
            <span class="text-slate-400 text-xs font-bold uppercase block">Costo Total Imputado</span>
            <span class="text-2xl font-black text-amber-400 font-mono">${{ totalCostoDespacho.toLocaleString('es-CL') }}</span>
          </div>
          <button @click="confirmarDespacho" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20">
            Confirmar Despacho & Imputación
          </button>
        </div>
      </div>

      <!-- RESUMEN DE HISTORIAL DE DESPACHOS -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">Últimos Despachos Realizados</h3>
        <div class="space-y-3">
          <div v-for="d in historialDespachos" :key="d.id" class="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1 text-xs font-mono">
            <div class="flex justify-between items-center font-bold">
              <span class="text-amber-400">#DSP-{{ d.id }}</span>
              <span class="text-slate-400 text-[10px]">{{ d.fecha }}</span>
            </div>
            <div class="text-white font-bold font-sans">Destino: {{ d.destino }}</div>
            <div class="text-slate-400 text-[11px]">Items: {{ d.itemsCount }} unids — ${{ d.totalCosto.toLocaleString('es-CL') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Send } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const tipoImputacion = ref('OT')
const barcodeScan = ref('')

const formDespacho = ref({
  folio_ot: 'OT-10045',
  centro_costo: 'CC-101'
})

const itemsDespacho = ref([
  { barcode: 'BAR-501-889', nombre: 'Filtro de Aceite Motorcraft FL-400S', costo: 4500 }
])

const historialDespachos = ref([
  { id: 991, fecha: new Date().toLocaleDateString('es-CL'), destino: 'OT-10045 (Plataforma Articulada XGA16E)', itemsCount: 1, totalCosto: 4500 }
])

const totalCostoDespacho = computed(() => itemsDespacho.value.reduce((acc, i) => acc + i.costo, 0))

const scanBarcode = () => {
  if (!barcodeScan.value.trim()) return
  itemsDespacho.value.push({
    barcode: barcodeScan.value.trim(),
    nombre: 'Pastillas de Freno Cerámicas Brembo',
    costo: 32000
  })
  barcodeScan.value = ''
}

const removerItem = (idx) => {
  itemsDespacho.value.splice(idx, 1)
}

const confirmarDespacho = async () => {
  if (itemsDespacho.value.length === 0) {
    alert('Debe tener al menos un artículo escaneado para imputar.')
    return
  }

  try {
    const destino = tipoImputacion.value === 'OT' ? formDespacho.value.folio_ot : formDespacho.value.centro_costo
    await apiAxios.post('/inventario/despacho', {
      folio_ot: formDespacho.value.folio_ot,
      codigos_barras: itemsDespacho.value.map(i => i.barcode)
    })

    historialDespachos.value.unshift({
      id: Date.now().toString().slice(-4),
      fecha: new Date().toLocaleDateString('es-CL'),
      destino: destino,
      itemsCount: itemsDespacho.value.length,
      totalCosto: totalCostoDespacho.value
    })

    itemsDespacho.value = []
    alert(`Despacho e imputación contable registrada correctamente para ${destino}. Kardex de movimientos actualizado.`)
  } catch (err) {
    alert('Error registrando despacho: ' + (err.response?.data?.message || err.message))
  }
}
</script>
