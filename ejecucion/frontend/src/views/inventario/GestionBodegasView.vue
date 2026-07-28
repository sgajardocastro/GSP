<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- Encabezado de Pantalla -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-xl shadow-amber-500/5">
          <Warehouse class="w-7 h-7" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">1. Gestión de Bodegas</h1>
            <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">GLOBAL MANAGER WMS</span>
          </div>
          <p class="text-slate-400 text-xs mt-0.5">Dar de alta nuevas bodegas operativas, definir su pertenencia geográfica y habilitar la consolidación de stock</p>
        </div>
      </div>

      <button
        @click="showCrearModal = true"
        class="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
      >
        <PlusCircle class="w-4 h-4" />
        + Crear Nueva Bodega
      </button>
    </div>

    <!-- Regla de Negocio / Panel de Control -->
    <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="flex items-center gap-3 w-full md:w-auto">
        <input
          v-model="searchBodega"
          type="text"
          placeholder="🔍 Buscar por Nombre de Bodega o Sucursal..."
          class="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 w-full md:w-96 text-xs focus:outline-none focus:border-amber-500"
        />
        <select v-model="filterSucursal" class="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold">
          <option value="">Todas las Sucursales</option>
          <option value="Santiago Central">Santiago Central</option>
          <option value="Norte Grande">Norte Grande (Antofagasta)</option>
          <option value="San Bernardo">San Bernardo</option>
          <option value="Calama">Calama</option>
        </select>
      </div>
      <div class="text-xs text-slate-400 font-semibold">
        Bodegas Operativas: <strong class="text-amber-400 font-mono">{{ filteredBodegas.length }}</strong>
      </div>
    </div>

    <!-- Tabla Principal de Bodegas -->
    <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-2xl">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
            <th class="p-3.5">Cód. Bodega</th>
            <th class="p-3.5">Nombre de la Bodega</th>
            <th class="p-3.5">Sucursal Pertenencia</th>
            <th class="p-3.5">Consolidación de Stock</th>
            <th class="p-3.5">Estado Operativo</th>
            <th class="p-3.5 text-right">Fecha Creación</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-medium">
          <tr v-for="b in filteredBodegas" :key="b.id" class="hover:bg-slate-800/60 transition-colors">
            <td class="p-3.5 font-mono font-bold text-amber-400">#BOD-00{{ b.id }}</td>
            <td class="p-3.5 font-bold text-white text-sm">{{ b.nombre }}</td>
            <td class="p-3.5 text-slate-300">📍 {{ b.sucursal_nombre }}</td>
            <td class="p-3.5">
              <span :class="['px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border', b.consolida_stock ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700']">
                {{ b.consolida_stock ? '✔ SI (Agrupa por Marca)' : 'NO' }}
              </span>
            </td>
            <td class="p-3.5">
              <span class="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {{ b.estado }}
              </span>
            </td>
            <td class="p-3.5 text-right font-mono text-slate-400">{{ new Date(b.created_at || Date.now()).toLocaleDateString('es-CL') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL CREAR BODEGA (SEMANA GLOBAL MANAGER) -->
    <div v-if="showCrearModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white uppercase flex items-center gap-2">
            <Warehouse class="w-5 h-5 text-amber-400" /> Crear Nueva Bodega Operativa
          </h3>
          <button @click="showCrearModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="modalError" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold">
          ⚠️ {{ modalError }}
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Sucursal (Menú de Selección - Obligatorio) *</label>
            <select v-model="formBodega.sucursal_nombre" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white">
              <option value="Santiago Central">Santiago Central</option>
              <option value="Norte Grande">Norte Grande (Antofagasta)</option>
              <option value="San Bernardo">San Bernardo</option>
              <option value="Calama">Calama</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Nombre de Bodega (Campo de Texto - Obligatorio) *</label>
            <input v-model="formBodega.nombre" type="text" placeholder="Ej: Bodega Taller Central" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" />
          </div>

          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
            <input v-model="formBodega.consolida_stock" type="checkbox" id="consolida" class="w-4 h-4 accent-amber-500 rounded cursor-pointer" />
            <label for="consolida" class="text-slate-300 font-bold uppercase text-xs cursor-pointer">
              Consolidación de Stock (Agrupa existencias por marca y tipo)
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showCrearModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="guardarBodega" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
            Crear Bodega
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Warehouse, PlusCircle } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const searchBodega = ref('')
const filterSucursal = ref('')
const showCrearModal = ref(false)
const modalError = ref('')

const bodegas = ref([
  { id: 1, nombre: 'Bodega Principal Santiago', sucursal_nombre: 'Santiago Central', estado: 'ACTIVA', consolida_stock: true },
  { id: 2, nombre: 'Bodega Faena Antofagasta', sucursal_nombre: 'Norte Grande', estado: 'ACTIVA', consolida_stock: true },
  { id: 3, nombre: 'Bodega Taller Móvil San Bernardo', sucursal_nombre: 'San Bernardo', estado: 'ACTIVA', consolida_stock: false }
])

const formBodega = ref({
  nombre: '',
  sucursal_nombre: 'Santiago Central',
  consolida_stock: true
})

const filteredBodegas = computed(() => {
  return bodegas.value.filter(b => {
    const matchesSearch = !searchBodega.value || b.nombre.toLowerCase().includes(searchBodega.value.toLowerCase()) || b.sucursal_nombre.toLowerCase().includes(searchBodega.value.toLowerCase())
    const matchesSucursal = !filterSucursal.value || b.sucursal_nombre === filterSucursal.value
    return matchesSearch && matchesSucursal
  })
})

const fetchBodegas = async () => {
  try {
    const { data } = await apiAxios.get('/inventario/bodegas')
    if (data && Array.isArray(data) && data.length > 0) {
      bodegas.value = data
    }
  } catch (err) {
    console.log('Error cargando bodegas:', err.message)
  }
}

const guardarBodega = async () => {
  modalError.value = ''
  if (!formBodega.value.nombre) {
    modalError.value = 'El nombre de la bodega es obligatorio.'
    return
  }

  try {
    const { data } = await apiAxios.post('/inventario/bodegas', formBodega.value)
    bodegas.value.unshift(data)
    showCrearModal.value = false
    formBodega.value.nombre = ''
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Error guardando bodega en PostgreSQL'
  }
}

onMounted(fetchBodegas)
</script>
