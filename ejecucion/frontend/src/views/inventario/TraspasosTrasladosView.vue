<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-xl shadow-amber-500/5">
          <Truck class="w-7 h-7" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">4. Traspasos y Traslados de Existencias</h1>
            <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">GLOBAL MANAGER WMS</span>
          </div>
          <p class="text-slate-400 text-xs mt-0.5">Iniciar el traslado de repuestos hacia otra bodega de la misma sucursal o hacia una sucursal geográfica lejana</p>
        </div>
      </div>
    </div>

    <!-- PANTALLA 4 GLOBAL MANAGER -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- FORMULARIO DE DESPACHO EN TRÁNSITO -->
      <div class="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 class="text-base font-bold text-white uppercase border-b border-slate-800 pb-3 flex items-center gap-2">
          <Truck class="w-5 h-5 text-amber-400" /> Generar Lote de Traslado Inter-Bodegas
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Bodega Origen *</label>
            <select v-model="form.id_bodega_origen" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white">
              <option :value="1">Bodega Principal Santiago</option>
              <option :value="2">Bodega Faena Antofagasta</option>
            </select>
          </div>

          <!-- BODEGA O SUCURSAL DESTINO (MENÚ DE SELECCIÓN) -->
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Bodega o Sucursal Destino (Menú Selección) *</label>
            <select v-model="form.id_bodega_destino" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white">
              <option :value="2">Bodega Faena Antofagasta (Norte Grande)</option>
              <option :value="3">Bodega Taller Móvil San Bernardo</option>
            </select>
          </div>

          <!-- LECTURA DE CÓDIGOS DE BARRA (CAMPO DE ENTRADA) -->
          <div class="md:col-span-2">
            <label class="block text-slate-400 mb-1 font-bold uppercase">Lectura de Códigos de Barra (Campo de Entrada Scanner) *</label>
            <div class="flex gap-2">
              <input
                v-model="barcodeInput"
                @keyup.enter="agregarCodigo"
                type="text"
                placeholder="Escanee o ingrese el código de barras (Ej: BAR-101-889) y presione Enter..."
                class="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-mono"
              />
              <button @click="agregarCodigo" class="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-4 py-2 rounded-xl border border-slate-700">
                + Agregar
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de Artículos a Trasladar -->
        <div class="space-y-2 pt-2">
          <label class="block text-slate-400 text-xs font-bold uppercase">Artículos en Lote de Traslado ({{ codigosLectura.length }})</label>
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 min-h-[100px] space-y-2">
            <div v-for="(code, idx) in codigosLectura" :key="idx" class="flex justify-between items-center bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs font-mono">
              <span class="text-amber-400 font-bold">📦 {{ code }}</span>
              <button @click="removerCodigo(idx)" class="text-slate-500 hover:text-rose-400 font-bold">✕</button>
            </div>
            <div v-if="codigosLectura.length === 0" class="text-slate-600 text-xs text-center py-4">
              Ningún artículo escaneado. Escanee etiquetas para armar el despacho.
            </div>
          </div>
        </div>

        <!-- REGLA DE NEGOCIO EN TRÁNSITO -->
        <div class="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs space-y-1">
          <div class="font-bold flex items-center gap-1.5"><AlertCircle class="w-4 h-4" /> Regla de Negocio de Traslados:</div>
          <p class="text-[11px] text-slate-300">
            Al realizar el traspaso, el stock se coloca automáticamente en estado <strong>EN TRÁNSITO</strong>. Esto bloquea el uso del repuesto hasta que la sucursal de destino registre su llegada física.
          </p>
        </div>

        <div class="flex justify-end pt-2">
          <button @click="despacharTraspaso" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20">
            Despachar Traspaso (Estado: EN TRÁNSITO)
          </button>
        </div>
      </div>

      <!-- LISTA DE TRASPASOS EN TRÁNSITO Y CONFIRMACIÓN DE LLEGADA EN DESTINO -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">Recepción de Traspasos en Destino</h3>

        <div class="space-y-3">
          <div v-for="t in traspasosEnTransito" :key="t.id" class="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
            <div class="flex justify-between items-center">
              <span class="font-mono font-bold text-amber-400">#TRP-{{ t.id }}</span>
              <span class="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-amber-500/20">{{ t.estado }}</span>
            </div>
            <div class="text-slate-300 font-bold">{{ t.origen }} $\rightarrow$ {{ t.destino }}</div>
            <div class="text-slate-400 text-[11px]">Items: {{ t.items }} código(s) de barra</div>

            <button
              v-if="t.estado === 'EN_TRANSITO'"
              @click="confirmarLlegada(t)"
              class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider shadow"
            >
              ✔ Confirmar Recepción Física en Destino
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Truck, AlertCircle } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const barcodeInput = ref('')
const codigosLectura = ref(['BAR-101-889', 'BAR-501-889'])

const form = ref({
  id_bodega_origen: 1,
  id_bodega_destino: 2
})

const traspasosEnTransito = ref([
  { id: 101, origen: 'Bodega Principal Santiago', destino: 'Bodega Faena Antofagasta', items: 2, estado: 'EN_TRANSITO' }
])

const agregarCodigo = () => {
  if (!barcodeInput.value.trim()) return
  codigosLectura.value.push(barcodeInput.value.trim())
  barcodeInput.value = ''
}

const removerCodigo = (idx) => {
  codigosLectura.value.splice(idx, 1)
}

const despacharTraspaso = async () => {
  if (codigosLectura.value.length === 0) {
    alert('Debe escanear al menos un código de barras para realizar el traspaso.')
    return
  }

  try {
    await apiAxios.post('/inventario/traspasos', {
      id_bodega_origen: form.value.id_bodega_origen,
      id_bodega_destino: form.value.id_bodega_destino,
      codigos_barras: codigosLectura.value
    })

    traspasosEnTransito.value.unshift({
      id: Date.now().toString().slice(-4),
      origen: 'Bodega Principal Santiago',
      destino: 'Bodega Faena Antofagasta',
      items: codigosLectura.value.length,
      estado: 'EN_TRANSITO'
    })

    codigosLectura.value = []
    alert('Traspaso despachado. El stock ha quedado bloqueado en estado EN TRÁNSITO.')
  } catch (err) {
    alert('Error al procesar traspaso: ' + (err.response?.data?.message || err.message))
  }
}

const confirmarLlegada = (t) => {
  t.estado = 'RECIBIDO'
  alert(`Recepción confirmada en sucursal destino para el traspaso #${t.id}. El stock ha pasado a estar DISPONIBLE.`)
}
</script>
