<template>
  <div class="space-y-6 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 relative">
    
    <!-- HEADER -->
    <div class="glass-card p-6 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#101114]">
      <div>
        <h2 class="text-xl font-black text-amber-500 uppercase tracking-widest font-display">Maestro de Clientes B2B</h2>
        <p class="text-xs text-muted-foreground mt-1">Directorio de empresas, clientes mandantes e integración con CRM / Facturación.</p>
      </div>
      <button 
        @click="abrirNuevoCliente" 
        class="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95 group"
      >
        <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        Registrar Cliente
      </button>
    </div>

    <!-- BUSCADOR -->
    <div class="flex flex-col sm:flex-row gap-4 mb-2">
      <div class="relative flex-1 group">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg class="h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input 
          v-model="filtro"
          type="text" 
          class="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl leading-5 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all" 
          placeholder="Buscar cliente por RUT, Razón Social o Giro..." 
        />
      </div>
    </div>

    <!-- TABLA DE CLIENTES -->
    <div class="overflow-x-auto rounded-3xl border border-white/10 bg-[#101114] shadow-2xl relative">
      
      <div v-if="cargando" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#101114]/80 backdrop-blur-sm">
        <div class="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <p class="mt-4 text-[10px] font-black uppercase tracking-widest text-amber-500/70 animate-pulse">Cargando maestro de clientes...</p>
      </div>

      <table class="w-full text-xs text-left text-slate-300">
        <thead class="bg-black/40 text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10">
          <tr>
            <th class="px-6 py-4 font-black">RUT</th>
            <th class="px-6 py-4 font-black">Razón Social / Giro</th>
            <th class="px-6 py-4 font-black">Dirección Comercial</th>
            <th class="px-6 py-4 font-black">Datos Facturación</th>
            <th class="px-6 py-4 font-black text-center">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-if="empresasFiltradas.length === 0 && !cargando">
            <td colspan="5" class="px-6 py-12 text-center text-slate-500 italic">No se encontraron clientes registrados en el sistema.</td>
          </tr>
          <tr v-for="empresa in empresasFiltradas" :key="empresa.id_empresa" class="hover:bg-white/[0.02] transition-colors group">
            
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="font-mono text-amber-500/80">{{ empresa.rut_empresa || 'S/N' }}</span>
            </td>
            
            <td class="px-6 py-4">
              <div class="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">{{ empresa.razon_social || empresa.name_empresa }}</div>
              <div class="text-[10px] text-slate-500 mt-1 uppercase tracking-wider max-w-xs truncate" :title="empresa.giro">
                {{ empresa.giro || 'Sin giro registrado' }}
              </div>
            </td>
            
            <td class="px-6 py-4">
              <div class="text-slate-300 max-w-xs truncate" :title="empresa.direccion">{{ empresa.direccion || '-' }}</div>
              <div class="text-[10px] text-slate-500 mt-1">{{ empresa.fono_contacto || 'Sin teléfono' }}</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap">
              <div v-if="empresa.comuna_facturacion || empresa.region_facturacion" class="inline-flex flex-col gap-1">
                <span class="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                  {{ empresa.comuna_facturacion || 'N/A' }}, {{ empresa.region_facturacion || 'N/A' }}
                </span>
                <span class="text-[10px] text-slate-400 truncate max-w-[150px]" :title="empresa.direccion_facturacion">
                  {{ empresa.direccion_facturacion || 'Sin dir.' }}
                </span>
              </div>
              <div v-else class="text-[10px] text-slate-500 italic">No configurados</div>
            </td>
            
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <div class="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                <button @click="abrirEditar(empresa)" class="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm" title="Editar Cliente">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button @click="eliminarEmpresa(empresa)" class="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm" title="Eliminar Cliente">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </td>

          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL DE CLIENTE (Reutilizando Modal CRM) -->
    <ModalNuevoCliente 
      v-if="mostrarModal" 
      :clienteAEditar="clienteSeleccionado"
      @close="cerrarModal" 
      @cliente-creado="alGuardar"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiAxios from '@/services/api'
import ModalNuevoCliente from '@/components/CRM/ModalNuevoCliente.vue'

const empresas = ref([])
const cargando = ref(false)
const filtro = ref('')

const mostrarModal = ref(false)
const clienteSeleccionado = ref(null)

const empresasFiltradas = computed(() => {
  const f = filtro.value.toLowerCase().trim()
  if (!f) return empresas.value
  return empresas.value.filter(e => 
    (e.rut_empresa && e.rut_empresa.toLowerCase().includes(f)) ||
    (e.razon_social && e.razon_social.toLowerCase().includes(f)) ||
    (e.name_empresa && e.name_empresa.toLowerCase().includes(f)) ||
    (e.giro && e.giro.toLowerCase().includes(f))
  )
})

async function cargarEmpresas() {
  cargando.value = true
  try {
    const { data } = await apiAxios.get('/empresas')
    empresas.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error cargando empresas:', error)
  } finally {
    cargando.value = false
  }
}

function abrirNuevoCliente() {
  clienteSeleccionado.value = null
  mostrarModal.value = true
}

function abrirEditar(empresa) {
  clienteSeleccionado.value = { ...empresa }
  mostrarModal.value = true
}

function cerrarModal() {
  mostrarModal.value = false
  clienteSeleccionado.value = null
}

function alGuardar() {
  cerrarModal()
  cargarEmpresas() // Recargar grilla
}

async function eliminarEmpresa(empresa) {
  if (!confirm(`¿Está seguro de eliminar al cliente ${empresa.razon_social || empresa.name_empresa}?`)) return
  try {
    await apiAxios.delete(`/empresas/${empresa.id_empresa}`)
    cargarEmpresas()
  } catch (err) {
    console.error('Error eliminando cliente:', err)
    alert('No se pudo eliminar. Es posible que el cliente tenga cotizaciones, proyectos u OTs vinculadas (integridad referencial).')
  }
}

onMounted(() => {
  cargarEmpresas()
})
</script>
