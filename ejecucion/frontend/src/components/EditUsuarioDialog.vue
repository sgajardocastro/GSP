<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm" @click="cerrar"></div>

      <!-- Modal Content (Exacto Terracon) -->
      <div class="relative w-full max-w-5xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-emerald-500/20 text-emerald-500">
              <UserEdit class="w-5 h-5" />
            </div>
            <h3 class="text-xl font-bold text-white">Editar Perfil de Usuario</h3>
          </div>
          <button @click="cerrar" class="p-2 rounded-xl hover:bg-white/10 text-muted-foreground transition-all">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body / Form -->
        <div class="flex-1 overflow-auto p-8 scroll-smooth space-y-8">
          <div v-if="localUser" class="text-[10px] text-muted-foreground uppercase font-black tracking-widest border-l-2 border-emerald-500 pl-3">
            Editando ID <span class="text-white">#{{ localUser.id_user }}</span> — <span class="text-white">{{ localUser.email }}</span>
          </div>

          <!-- Sección 1: Datos Básicos (Clon de Terracon) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Email</label>
              <input v-model="localUser.email" type="email" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">RUT</label>
              <input v-model="localUser.rut" placeholder="12.345.678-k" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Primer Nombre</label>
              <input v-model="localUser.name_frst" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Segundo Nombre</label>
              <input v-model="localUser.name_sec" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Apellido Paterno</label>
              <input v-model="localUser.apellido_pat" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Apellido Materno</label>
              <input v-model="localUser.apellido_mat" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Móvil</label>
              <input v-model="localUser.movil" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
            </div>
            <div class="flex items-center gap-4 pt-4">
               <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="localUser.activo" class="sr-only peer">
                <div class="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span class="ml-3 text-[10px] font-black uppercase text-white/50">Usuario Activo</span>
              </label>
            </div>
          </div>

          <!-- Sección 2: Información RRHH (Clon de Terracon con los 22 cargos) -->
          <div class="space-y-4 pt-4 border-t border-white/5">
            <h4 class="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <Building2 class="w-4 h-4" /> Información RR.HH
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Cargo Transmac</label>
                <select v-model="jsonData.cargo" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
                  <option v-for="c in CARGOS_LIST" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Género</label>
                <select v-model="jsonData.genero" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
                  <option value="H">Hombre</option>
                  <option value="M">Mujer</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Fec. Nacimiento</label>
                <input v-model="jsonData.fechaNacimiento" type="date" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
              </div>
            </div>
          </div>

          <!-- Matriz RBAC embebida (Clon de Terracon) -->
          <RbacMatrixTable 
            v-model="selectedRolesCodes" 
            :roles-catalog="roles" 
            :permissions="permisos" 
          />

          <!-- Pertenencia a Proyectos (Exacto Terracon) -->
          <div class="space-y-4 pt-4 border-t border-white/5">
            <div class="flex justify-between items-center">
               <h4 class="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <Layers class="w-4 h-4" /> Nómina y Proyectos
              </h4>
              <button @click="agregarNuevaPertenencia" class="px-3 py-1 bg-white/10 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase transition-all">+ Vincular Proyecto</button>
            </div>
            
            <div v-if="pertenencias.length" class="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
              <table class="w-full text-left text-xs">
                <thead class="bg-white/5 text-[10px] font-black text-muted-foreground uppercase uppercase tracking-widest">
                  <tr>
                    <th class="px-4 py-3">Proyecto</th>
                    <th class="px-4 py-3">Equipo</th>
                    <th class="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr v-for="(p, i) in pertenencias" :key="i" class="hover:bg-white/5">
                    <td class="px-4 py-2">
                      <select v-model="p.id_proyecto" class="w-full bg-transparent border-none text-xs text-white focus:ring-0">
                        <option v-for="pr in proyectos" :key="pr.id_proyecto" :value="pr.id_proyecto">{{ pr.nombre_proyecto }}</option>
                      </select>
                    </td>
                    <td class="px-4 py-2">
                      <select v-model="p.id_equipo_proyecto" class="w-full bg-transparent border-none text-xs text-white focus:ring-0">
                        <option v-for="e in getEquiposDelProyecto(p.id_proyecto)" :key="e.id_equipo_proyecto" :value="e.id_equipo_proyecto">{{ e.nombre_equipo }}</option>
                      </select>
                    </td>
                    <td class="px-4 py-2 text-right">
                      <button @click="pertenencias.splice(i, 1)" class="p-1.5 text-red-500 hover:bg-white/10 rounded-lg"><Trash2 class="w-4 h-4" /></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="text-[10px] text-zinc-600 italic">El usuario no tiene proyectos asignados actualmente.</p>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
          <button @click="cerrar" class="px-4 py-2 text-xs font-black text-white/50 hover:text-white transition-all uppercase tracking-widest">Cancelar</button>
          <button @click="guardar" class="px-8 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2">
            <Save class="w-4 h-4" /> Guardar Perfil
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import apiAxios from '@/services/api'
import RbacMatrixTable from './mantenedores/RbacMatrixTable.vue'
import { X, UserPlus as UserEdit, Building2, Layers, Trash2, Save } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  usuario: { type: Object, default: null },
  roles: { type: Array, default: () => [] },
  permisos: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:show', 'guardar'])

const CARGOS_LIST = [
  'Administrador de Contrato de terreno', 'Asistente Administrativo', 'Encargado Adquisiones',
  'Encargado Calidad', 'Encargado Control de Proyectos', 'Encargado Logística',
  'Encargado Prevención de Riesgos', 'Encargado RR.HH', 'Jefe de Terreno',
  'Lider en Prevencion de Riesgos', 'Maestro Mayor Piping', 'Maestro Primera Piping',
  'Operador Camión Pluma', 'Operador de Maquinaria', 'Operador de Terreno',
  'Supervisor Terreno'
].sort()

const localUser = ref(null)
const selectedRolesCodes = ref([])
const jsonData = ref({ cargo: null, genero: null, fechaNacimiento: null })
const pertenencias = ref([])
const proyectos = ref([])
const equipos = ref([])

function cerrar() { emit('update:show', false) }

async function cargarData() {
  const [{ data: prjs }, { data: eqs }] = await Promise.all([
    apiAxios.get('/servicio/leanglobal/obtenerProyectos'),
    apiAxios.get('/servicio/leanglobal/obtenerEquiposProyectos')
  ])
  proyectos.value = prjs; equipos.value = eqs
}

function getEquiposDelProyecto(idPrj) {
  return equipos.value.filter(e => Number(e.id_proyecto) === Number(idPrj))
}

function agregarNuevaPertenencia() { pertenencias.value.push({ id_proyecto: null, id_equipo_proyecto: null }) }

/* --- MAPS Y LOGICA DE PERMISOS --- */
const rbacRoleCodeSet = computed(() => {
  const set = new Set()
  // Permisos dinámicos en base a la matriz del cliente
  const functionCodes = ['ADMIN', 'PROG', 'EJEC', 'APROB']
  const modulesList = ['TMAC', 'CDLC_DMH', 'CDLC_DCH', 'CDLC_SPOT', 'AMSA_MLP', 'TMAC_CALM', 'TMAC_LAND', 'RENTMAC']
  
  modulesList.forEach(m => {
    functionCodes.forEach(f => {
      set.add(`${m}_${f}`)
    })
  })
  // También soportar 'ADMIN' global
  set.add('ADMIN')
  return set
})

function isCnxRoleCode(code) {
  return String(code || '').trim().toUpperCase().startsWith('CNX')
}

watch(() => props.usuario, (val) => {
  if (val) {
    localUser.value = { ...val }
    try {
      const parsed = typeof val.json_data === 'string' ? JSON.parse(val.json_data) : val.json_data
      jsonData.value = { cargo: parsed?.cargo || null, genero: parsed?.genero || null, fechaNacimiento: parsed?.fechaNacimiento || null }
    } catch { jsonData.value = { cargo: null, genero: null, fechaNacimiento: null } }
    
    // Poblar roles seleccionados del usuario
    const ids = val.rolesIds || []
    selectedRolesCodes.value = ids
      .map(id => {
        const r = props.roles.find(x => Number(x.id_rol) === Number(id))
        const raw = r?.codi_rol ?? r?.codigo ?? r?.code ?? r?.name_rol ?? ''
        return String(raw).trim().toUpperCase()
      })
      .filter(Boolean)
      .filter(code => rbacRoleCodeSet.value.has(code) || isCnxRoleCode(code))

    // Poblar pertenencias de proyecto
    pertenencias.value = val.memberships ? JSON.parse(JSON.stringify(val.memberships)) : []
  }
}, { immediate: true })

function guardar() {
  const uid = Number(localUser.value.id_user)
  
  // Filtrar los roles actuales que no forman parte de la matriz RBAC de este mantenedor ni son de conectividad CNX
  const currentAllRoleIds = localUser.value.rolesIds || []
  const currentNonRbacIds = currentAllRoleIds.filter(rid => {
    const r = props.roles.find(x => Number(x.id_rol) === Number(rid))
    const raw = r?.codi_rol ?? r?.codigo ?? r?.code ?? r?.name_rol ?? ''
    const code = String(raw).trim().toUpperCase()
    return !rbacRoleCodeSet.value.has(code) && !isCnxRoleCode(code)
  })

  // Convertir los códigos seleccionados en la matriz de vuelta a IDs de roles
  const selectedCodes = selectedRolesCodes.value.map(c => c.toUpperCase())
  const selectedRbacIds = selectedCodes.map(code => {
    const r = props.roles.find(x => {
      const raw = x.codi_rol ?? x.codigo ?? x.code ?? x.name_rol ?? ''
      return String(raw).trim().toUpperCase() === code
    })
    return r ? Number(r.id_rol) : null
  }).filter(Boolean)

  // Combinar ambos conjuntos
  const finalRoleIds = Array.from(new Set([...currentNonRbacIds, ...selectedRbacIds]))

  // Auto-asignación de proyectos basados en roles específicos de cliente
  const calmProject = proyectos.value.find(p => p.nombre_proyecto === 'Suc. Calama')
  const calmTeam = equipos.value.find(e => e.nombre_equipo === 'Equipo Proyecto Suc. Calama')

  const landProject = proyectos.value.find(p => p.nombre_proyecto === 'Suc. Los Andes')
  const landTeam = equipos.value.find(e => e.nombre_equipo === 'Equipo Proyecto Suc. Los Andes')

  const clientProjects = {
    'TMAC': { id_proyecto: 6, id_equipo_proyecto: 5 },
    'CDLC_DMH': { id_proyecto: 2, id_equipo_proyecto: 2 },
    'CDLC_DCH': { id_proyecto: 1, id_equipo_proyecto: 1 },
    'CDLC_SPOT': { id_proyecto: 4, id_equipo_proyecto: 4 },
    'AMSA_MLP': { id_proyecto: 3, id_equipo_proyecto: 3 },
    'RENTMAC': { id_proyecto: 4, id_equipo_proyecto: 4 }, // SPOT
    'TMAC_CALM': calmProject && calmTeam ? { id_proyecto: Number(calmProject.id_proyecto), id_equipo_proyecto: Number(calmTeam.id_equipo_proyecto) } : null,
    'TMAC_LAND': landProject && landTeam ? { id_proyecto: Number(landProject.id_proyecto), id_equipo_proyecto: Number(landTeam.id_equipo_proyecto) } : null
  }

  selectedCodes.forEach(code => {
    const parts = code.split('_')
    const clientKey = parts.slice(0, -1).join('_')
    if (clientProjects[clientKey]) {
      const { id_proyecto, id_equipo_proyecto } = clientProjects[clientKey]
      const exists = pertenencias.value.some(p => Number(p.id_proyecto) === id_proyecto && Number(p.id_equipo_proyecto) === id_equipo_proyecto)
      if (!exists) {
        pertenencias.value.push({ id_proyecto, id_equipo_proyecto })
      }
    }
  })

  const cleanPertenencias = pertenencias.value
    .filter(p => p.id_proyecto && p.id_equipo_proyecto)
    .map(p => ({
      id_proyecto: Number(p.id_proyecto),
      id_equipo_proyecto: Number(p.id_equipo_proyecto)
    }))

  emit('guardar', { 
    ...localUser.value, 
    roles: finalRoleIds, 
    json_data: { ...jsonData.value },
    teams: cleanPertenencias
  })
  cerrar()
}

onMounted(cargarData)
</script>

