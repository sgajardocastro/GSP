<template>
  <div class="space-y-6">
    <!-- CABECERA -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-5 gap-4">
      <div>
        <h2 class="text-xl font-black text-white uppercase tracking-wider font-display">Acreditación Personal</h2>
        <p class="text-xs text-slate-400 mt-1">Monitoreo en tiempo real de pases vigentes de operadores y riggers para ingreso a plantas industriales.</p>
      </div>
      
      <!-- BOTÓN EXPORTAR -->
      <button 
        @click="exportToExcel"
        class="shrink-0 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Exportar a Excel
      </button>
    </div>

    <!-- CARDS DE KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="kpi in kpis" :key="kpi.id" class="bg-[#0f1629] border border-white/5 rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-white/10 hover:bg-white/[0.01]">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0" :class="kpi.iconClass">
          <component :is="kpi.icon" class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[10px] uppercase font-bold tracking-wider text-slate-400">{{ kpi.title }}</p>
          <p class="text-2xl font-black text-white mt-1 font-mono">{{ kpi.value }}</p>
        </div>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="bg-[#0f1629] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center gap-4">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg class="h-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input 
          id="acred-search"
          type="text" 
          v-model="filters.query"
          @input="handleFilterChange"
          placeholder="BUSCAR POR NOMBRE, CARGO O RUT..." 
          class="w-full bg-black/20 border border-white/5 hover:border-white/10 focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white uppercase font-bold tracking-wider placeholder:text-slate-500 focus:outline-none transition-all"
        />
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-3">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap">Desde:</span>
          <input 
            id="acred-date-from"
            type="date" 
            v-model="filters.dateFrom"
            @change="handleFilterChange"
            class="bg-black/20 border border-white/5 hover:border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all w-full sm:w-auto"
          />
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap">Hasta:</span>
          <input 
            id="acred-date-to"
            type="date" 
            v-model="filters.dateTo"
            @change="handleFilterChange"
            class="bg-black/20 border border-white/5 hover:border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all w-full sm:w-auto"
          />
        </div>

        <button 
          v-if="hasActiveFilters"
          id="acred-reset"
          @click="resetFilters"
          class="w-full sm:w-auto px-4 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
        >
          Limpiar
        </button>
      </div>
    </div>

    <!-- TABLA COMPACTA EN UNA SOLA LÍNEA -->
    <div class="bg-[#0f1629] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table id="acred-table" class="w-full text-xs text-slate-300">
          <thead>
            <tr class="bg-black/35 text-slate-400 text-[10px] uppercase tracking-widest border-b border-white/5">
              <th class="p-4 text-left font-black">Especialista / Nombre</th>
              <th class="p-4 text-left font-black">RUT</th>
              <th class="p-4 text-left font-black">Cargo</th>
              <th class="p-4 text-left font-black">Correo Electrónico</th>
              <th class="p-4 text-center font-black">Control</th>
              <th class="p-4 text-center font-black">Estado</th>
              <th class="p-4 text-center font-black">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr 
              v-for="user in personal" 
              :key="user.id_user" 
              @click="openEditModal(user.id_user)"
              class="hover:bg-blue-500/[0.05] cursor-pointer transition-all group h-12"
            >
              <!-- Nombre -->
              <td class="p-4">
                <p class="font-bold text-white uppercase tracking-tight text-sm">{{ user.nombre }}</p>
              </td>
              <!-- RUT -->
              <td class="p-4 font-mono uppercase tracking-widest text-slate-300">
                {{ formatRut(user.rut) }}
              </td>
              <!-- Cargo -->
              <td class="p-4 uppercase text-slate-300 font-semibold">{{ user.rol }}</td>
              <!-- Correo -->
              <td class="p-4 text-slate-400 font-mono">{{ user.email }}</td>
              <!-- Control -->
              <td class="p-4 text-center font-mono text-[10px] text-slate-400">{{ formatDate(user.fechaControl) }}</td>
              
              <!-- Semáforo / Icono Único (Idéntico a Equipos) -->
              <td class="p-4 text-center">
                <span 
                  :class="[
                    'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border inline-flex items-center gap-1.5',
                    user.estado === 'habilitado' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : user.estado === 'por_vencer'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : user.estado === 'bloqueado'
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-white/5 border-white/10 text-slate-500'
                  ]"
                >
                  <span 
                    class="w-1.5 h-1.5 rounded-full" 
                    :class="[
                      user.estado === 'habilitado' 
                        ? 'bg-emerald-400' 
                        : user.estado === 'por_vencer'
                          ? 'bg-amber-400'
                          : user.estado === 'bloqueado'
                            ? 'bg-red-400 animate-pulse'
                            : 'bg-slate-500'
                    ]"
                  ></span>
                  {{ 
                    user.estado === 'habilitado' 
                      ? 'Habilitado' 
                      : user.estado === 'por_vencer'
                        ? 'Por Vencer'
                        : user.estado === 'bloqueado'
                          ? 'Bloqueado'
                          : 'Sin Documentos' 
                  }}
                </span>
              </td>

              <!-- Acción Chevron (Idéntico a Equipos) -->
              <td class="p-4 text-right">
                <svg class="w-4 h-4 text-slate-400 group-hover:text-white transition-all ml-auto font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </td>
            </tr>
            <tr v-if="personal.length === 0">
              <td colspan="7" class="p-8 text-center text-slate-400">
                No se encontraron trabajadores con los filtros aplicados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL INTEGRADO -->
    <ModalCrearEditarPersonal
      v-if="modal.show"
      :user-id="modal.userId"
      @close="closeEditModal"
      @saved="fetchAcreditacion"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import apiAxios from '@/services/api'
import ModalCrearEditarPersonal from '@/components/ModalCrearEditarPersonal.vue'

// Filtros Reactivos
const filters = reactive({
  query: '',
  dateFrom: '',
  dateTo: ''
})

const rawPersonal = ref([])
const personal = ref([])

// Estado Modal
const modal = reactive({
  show: false,
  userId: null
})

// Habilitar botón limpiar
const hasActiveFilters = computed(() => {
  return filters.query.trim() !== '' || filters.dateFrom !== '' || filters.dateTo !== ''
})

// Cargar filtros guardados y fetch inicial
onMounted(() => {
  const saved = localStorage.getItem('gsp_acred_filters')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      filters.query = parsed.query || ''
      filters.dateFrom = parsed.dateFrom || ''
      filters.dateTo = parsed.dateTo || ''
    } catch (e) {}
  }
  fetchAcreditacion()
})

// Consulta API
const fetchAcreditacion = async () => {
  try {
    const params = {}
    if (filters.query) params.q = filters.query
    if (filters.dateFrom) params.from = filters.dateFrom
    if (filters.dateTo) params.to = filters.dateTo

    const res = await apiAxios.get('/acreditacion/personal', { params })
    rawPersonal.value = res.data.data || []
    personal.value = rawPersonal.value
  } catch (err) {
    console.error("Error al obtener acreditación:", err)
  }
}

// Guardar filtros y disparar query
const handleFilterChange = () => {
  localStorage.setItem('gsp_acred_filters', JSON.stringify({
    query: filters.query,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo
  }))
  fetchAcreditacion()
}

// Restablecer filtros
const resetFilters = () => {
  filters.query = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  localStorage.removeItem('gsp_acred_filters')
  fetchAcreditacion()
}

// KPIs Computados (Actualizado con los 4 estados)
const kpis = computed(() => {
  const total = personal.value.length
  const habilitados = personal.value.filter(u => u.estado === 'habilitado').length
  const bloqueados = personal.value.filter(u => u.estado === 'bloqueado').length
  const porVencer = personal.value.filter(u => u.estado === 'por_vencer').length
  const tasa = total > 0 ? Math.round((habilitados / total) * 100) : 0

  return [
    {
      id: 'total',
      title: 'Total Personal',
      value: total,
      icon: {
        template: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>'
      },
      iconClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
    },
    {
      id: 'habilitados',
      title: 'Habilitados',
      value: habilitados,
      icon: {
        template: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
      },
      iconClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    },
    {
      id: 'bloqueados',
      title: 'Bloqueados',
      value: bloqueados,
      icon: {
        template: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>'
      },
      iconClass: 'bg-red-500/10 border-red-500/20 text-red-400'
    },
    {
      id: 'por_vencer',
      title: 'Por Vencer (30d)',
      value: porVencer,
      icon: {
        template: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>'
      },
      iconClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    }
  ]
})

// Control Modal
const openEditModal = (userId) => {
  modal.userId = userId
  modal.show = true
}

const closeEditModal = () => {
  modal.show = false
  modal.userId = null
}

// Utilidades Visuales
const formatRut = (rut) => {
  if (!rut) return 'S/I'
  if (rut.includes('-')) return rut
  const clean = rut.replace(/[^0-9kK]/g, '')
  if (clean.length < 2) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1).toUpperCase()
  return `${body}-${dv}`
}

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 'S/I') return 'S/I'
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return dateStr
  } catch (e) {
    return dateStr
  }
}

// Exportación a Excel
const exportToExcel = () => {
  if (personal.value.length === 0) return

  let csvContent = '\uFEFF' // UTF-8 BOM
  
  const headers = [
    'Especialista',
    'RUT',
    'Cargo',
    'Correo Electrónico',
    'Fecha Control',
    'Estado Pase'
  ]
  csvContent += headers.join(';') + '\n'

  personal.value.forEach(row => {
    const data = [
      row.nombre,
      formatRut(row.rut),
      row.rol,
      row.email,
      formatDate(row.fechaControl),
      row.estado === 'habilitado' ? 'Habilitado' : 'Bloqueado'
    ]
    csvContent += data.join(';') + '\n'
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'Acreditacion_Personal_GSP.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
