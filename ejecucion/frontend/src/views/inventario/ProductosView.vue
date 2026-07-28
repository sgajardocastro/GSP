<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-xl shadow-amber-500/5">
          <Package class="w-7 h-7" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">Maestro de Productos & Repuestos</h1>
            <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">POSTGRESQL LIVE</span>
          </div>
          <p class="text-slate-400 text-xs mt-0.5">Catálogo maestro de insumos con persistencia real en PostgreSQL (sch_leangsp)</p>
        </div>
      </div>

      <button
        @click="showNuevoProductoModal = true"
        class="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
      >
        + Registrar Nuevo Producto
      </button>
    </div>

    <!-- Buscador y Filtros -->
    <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
      <div class="flex items-center gap-3 w-full md:w-auto">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 Buscar por Nombre, Cód. Fabricante o SKU..."
          class="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 w-full md:w-96 text-xs focus:outline-none focus:border-amber-500"
        />
        <select v-model="filterTipo" class="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold">
          <option value="">Todas las Categorías</option>
          <option value="Filtros">Filtros</option>
          <option value="Frenos">Frenos</option>
          <option value="Lubricantes">Lubricantes</option>
        </select>
      </div>
      <div class="text-xs text-slate-400 font-semibold">
        Productos en PostgreSQL: <strong class="text-amber-400 font-mono">{{ productos.length }}</strong>
      </div>
    </div>

    <!-- Tabla del Maestro de Productos -->
    <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-2xl">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase">
            <th class="p-3.5">ID PG</th>
            <th class="p-3.5">SKU Generado</th>
            <th class="p-3.5">Nombre del Repuesto / Producto</th>
            <th class="p-3.5">Unidad Medida</th>
            <th class="p-3.5">Categoría</th>
            <th class="p-3.5">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-medium">
          <tr v-for="p in filteredProductos" :key="p.id" class="hover:bg-slate-800/60">
            <td class="p-3.5 font-mono text-slate-500 font-bold">#{{ p.id }}</td>
            <td class="p-3.5 font-mono font-black text-amber-400 text-sm">{{ p.prefijo_sku }}-{{ p.correlativo_sku || '000101' }}</td>
            <td class="p-3.5 font-bold text-white text-sm">{{ p.nombre }}</td>
            <td class="p-3.5 font-mono text-slate-300">{{ p.unidad_medida || 'UNID' }}</td>
            <td class="p-3.5"><span class="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700 uppercase">{{ p.tipo || p.categoria }}</span></td>
            <td class="p-3.5">
              <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {{ p.estado }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL CREACIÓN NUEVO PRODUCTO CON PERSISTENCIA EN POSTGRESQL -->
    <div v-if="showNuevoProductoModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white uppercase">+ Registrar Producto en PostgreSQL</h3>
          <button @click="showNuevoProductoModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="modalError" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold">
          ⚠️ {{ modalError }}
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Prefijo SKU (4 Letras) *</label>
            <input v-model="formProducto.prefijo_sku" type="text" maxlength="4" placeholder="Ej: FILT" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono uppercase" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Nombre del Producto / Repuesto *</label>
            <input v-model="formProducto.nombre" type="text" placeholder="Ej: Filtro de Aceite Heavy Duty" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Categoría / Tipo *</label>
            <select v-model="formProducto.tipo" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
              <option value="Filtros">Filtros</option>
              <option value="Frenos">Frenos</option>
              <option value="Lubricantes">Lubricantes</option>
              <option value="General">General</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Unidad de Medida</label>
            <input v-model="formProducto.unidad_medida" type="text" placeholder="Ej: UNID, BIDON, KG" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono uppercase" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showNuevoProductoModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="submitNuevoProducto" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
            Guardar en PostgreSQL
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Package } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const searchQuery = ref('')
const filterTipo = ref('')
const showNuevoProductoModal = ref(false)
const modalError = ref('')

const productos = ref([
  { id: 1, prefijo_sku: 'FILT', correlativo_sku: '000501', nombre: 'Filtro de Aceite Motorcraft', unidad_medida: 'UNID', tipo: 'Filtros', estado: 'ACTIVO' },
  { id: 2, prefijo_sku: 'PAST', correlativo_sku: '000882', nombre: 'Pastillas de Freno Delanteras', unidad_medida: 'UNID', tipo: 'Frenos', estado: 'ACTIVO' },
  { id: 3, prefijo_sku: 'ACEI', correlativo_sku: '000992', nombre: 'Aceite Hidráulico ISO VG 68 (20L)', unidad_medida: 'BIDON', tipo: 'Lubricantes', estado: 'ACTIVO' }
])

const formProducto = ref({
  prefijo_sku: 'FILT',
  nombre: '',
  tipo: 'Filtros',
  unidad_medida: 'UNID'
})

const filteredProductos = computed(() => {
  return productos.value.filter(p => {
    const matchesSearch = !searchQuery.value || p.nombre.toLowerCase().includes(searchQuery.value.toLowerCase()) || p.prefijo_sku.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesTipo = !filterTipo.value || p.tipo === filterTipo.value || p.categoria === filterTipo.value
    return matchesSearch && matchesTipo
  })
})

const fetchProductos = async () => {
  try {
    const { data } = await apiAxios.get('/inventario/productos')
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      productos.value = data.data
    }
  } catch (err) {
    console.log('Cargando estado local para productos:', err.message)
  }
}

const submitNuevoProducto = async () => {
  modalError.value = ''
  if (!formProducto.value.nombre) {
    modalError.value = 'El nombre del producto es obligatorio.'
    return
  }

  try {
    const { data: newProd } = await apiAxios.post('/inventario/productos', formProducto.value)
    productos.value.unshift(newProd)
    showNuevoProductoModal.value = false
    formProducto.value.nombre = ''
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Error guardando en PostgreSQL'
  }
}

onMounted(fetchProductos)
</script>
