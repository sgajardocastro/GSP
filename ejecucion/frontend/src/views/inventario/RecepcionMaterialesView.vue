<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-xl shadow-amber-500/5">
          <Download class="w-7 h-7" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">3. Recepción e Ingreso de Materiales</h1>
            <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">GLOBAL MANAGER WMS</span>
          </div>
          <p class="text-slate-400 text-xs mt-0.5">Registrar el ingreso físico de repuestos nuevos provenientes de compras o confirmar llegada de materiales en tránsito</p>
        </div>
      </div>
    </div>

    <!-- FORMULARIO PRINCIPAL PANTALLA 3 GLOBAL MANAGER -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h2 class="text-base font-bold text-white uppercase border-b border-slate-800 pb-3 flex items-center gap-2">
          <span>📋</span> Formulario de Recepción y Alta de Materiales
        </h2>

        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold">
          ⚠️ {{ errorMessage }}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <!-- 1. BUSCADOR DE PRODUCTOS (CATÁLOGO) -->
          <div class="md:col-span-2">
            <label class="block text-slate-400 mb-1 font-bold uppercase">Buscador de Productos (Catálogo Maestro) *</label>
            <select v-model="form.id_producto" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white">
              <option v-for="p in productos" :key="p.id" :value="p.id">
                [{{ p.prefijo_sku }}] {{ p.nombre }} — {{ p.marca }}
              </option>
            </select>
          </div>

          <!-- Bodega Destino -->
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Bodega Destino *</label>
            <select v-model="form.id_bodega" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white">
              <option :value="1">Bodega Principal Santiago</option>
              <option :value="2">Bodega Faena Antofagasta</option>
              <option :value="3">Bodega Taller Móvil San Bernardo</option>
            </select>
          </div>

          <!-- 2. UBICACIÓN FÍSICA -->
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Ubicación Física (Estantería/Pasillo) *</label>
            <input v-model="form.ubicacion_fisica" type="text" placeholder="Ej: Pasillo 3, Estante B" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" />
          </div>

          <!-- Cantidad a Ingresar -->
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Cantidad a Ingresar *</label>
            <input v-model.number="form.cantidad" type="number" min="1" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono" />
          </div>

          <!-- 2. COSTO DE ADQUISICIÓN (REGLA: COSTO > 0) -->
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Costo Adquisición Neto ($ CLP - Obligatorio > 0) *</label>
            <input v-model.number="form.costo" type="number" min="1" placeholder="Ej: 18500" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono" />
          </div>

          <!-- 3. DOCUMENTOS DE RESPALDO (OC / FACTURA / GUÍA) -->
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Nº Orden de Compra (OC) *</label>
            <input v-model="form.oc" type="text" placeholder="Ej: OC-88210" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono" />
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Nº Factura / Guía Despacho</label>
            <input v-model="form.numero_factura" type="text" placeholder="Ej: F-993821" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono" />
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-800">
          <button @click="procesarIngreso" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2">
            <Printer class="w-4 h-4" /> Ingresar y Generar Código de Barras
          </button>
        </div>
      </div>

      <!-- VISTA PREVIA CÓDIGO DE BARRAS TÉRMICO -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">Vista Previa Etiqueta Térmica</h3>

        <div class="bg-white text-slate-950 p-4 rounded-xl border-2 border-slate-300 font-mono text-center space-y-2 shadow-inner">
          <div class="text-[9px] font-black uppercase tracking-widest text-slate-600">GRÚAS SAN PABLO — WMS LITE</div>
          <div class="text-sm font-black tracking-tight leading-none text-black">{{ selectedProductoObj?.nombre || 'Mascarillas N95' }}</div>
          <div class="text-[11px] font-bold text-slate-700">SKU: {{ generatedSku }}</div>

          <div class="py-2 flex flex-col items-center justify-center">
            <div class="h-12 w-48 bg-slate-950 flex items-center justify-center p-1 rounded">
              <div class="w-full h-full bg-white flex justify-around items-center px-1">
                <div v-for="n in 26" :key="n" :class="['h-full', n % 3 === 0 ? 'w-1 bg-black' : n % 2 === 0 ? 'w-0.5 bg-black' : 'w-1.5 bg-black']"></div>
              </div>
            </div>
            <span class="text-xs font-bold tracking-widest mt-1 text-black font-mono">{{ generatedBarcode }}</span>
          </div>

          <div class="flex justify-between text-[9px] text-slate-600 border-t border-slate-300 pt-1 font-bold">
            <span>OC: {{ form.oc || 'OC-88210' }}</span>
            <span>FECHA: {{ new Date().toLocaleDateString('es-CL') }}</span>
          </div>
        </div>

        <button @click="imprimirEtiqueta" class="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 rounded-xl border border-slate-700 text-xs uppercase tracking-wider flex items-center justify-center gap-2">
          <Printer class="w-4 h-4" /> Imprimir en Impresora Térmica
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Download, Printer } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const errorMessage = ref('')

const productos = ref([
  { id: 1, prefijo_sku: 'MASC', nombre: 'Mascarillas de Protección N95 (Caja x20 unids)', marca: '3M Safety' },
  { id: 2, prefijo_sku: 'FILT', nombre: 'Filtro de Aceite Motorcraft FL-400S', marca: 'Motorcraft' },
  { id: 3, prefijo_sku: 'PAST', nombre: 'Pastillas de Freno Cerámicas Brembo', marca: 'Brembo' }
])

const form = ref({
  id_bodega: 1,
  id_producto: 1,
  cantidad: 10,
  costo: 18500,
  oc: 'OC-88210',
  numero_factura: 'F-99382',
  ubicacion_fisica: 'Pasillo 3, Estante B'
})

const selectedProductoObj = computed(() => productos.value.find(p => p.id === form.value.id_producto))
const generatedSku = computed(() => `${selectedProductoObj.value?.prefijo_sku || 'FILT'}-000101`)
const generatedBarcode = computed(() => `BAR-101-${Date.now().toString().slice(-4)}`)

const procesarIngreso = async () => {
  errorMessage.value = ''

  if (!form.value.costo || form.value.costo <= 0) {
    errorMessage.value = 'Regla de Negocio (COSTO_CERO_NO_PERMITIDO): El costo de adquisición debe ser mayor a 0.'
    return
  }

  if (!form.value.oc || !form.value.oc.trim()) {
    errorMessage.value = 'Regla de Negocio (OC_REQUERIDA): El número de Orden de Compra (OC) es obligatorio.'
    return
  }

  try {
    await apiAxios.post('/inventario/existencias/ingresar', form.value)
    alert(`Material ingresado exitosamente a la bodega. Código de Barras generado: ${generatedBarcode.value}`)
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Error registrando ingreso'
  }
}

const imprimirEtiqueta = () => {
  window.print()
}
</script>
