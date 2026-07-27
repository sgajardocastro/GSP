<template>
  <div class="space-y-6 min-h-[600px]">
    <!-- Breadcrumbs (Navegación Multinivel) -->
    <div v-if="viewMode !== 'projects'" class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-4">
      <button @click="goBackToProjects" class="text-muted-foreground hover:text-emerald-500 transition-colors">Proyectos</button>
      <ChevronRight class="w-3 h-3 text-muted-foreground" />
      <button v-if="viewMode === 'members'" @click="viewMode = 'teams'" class="text-muted-foreground hover:text-emerald-500 transition-colors">
        {{ selectedProject?.nombre_proyecto }}
      </button>
      <ChevronRight v-if="viewMode === 'members'" class="w-3 h-3 text-muted-foreground" />
      <span class="text-emerald-500">{{ viewMode === 'members' ? selectedTeam?.name : selectedProject?.nombre_proyecto }}</span>
    </div>

    <!-- 1) VISTA DE PROYECTOS -->
    <div v-if="viewMode === 'projects'" class="space-y-4">
      <div class="flex justify-between items-center">
        <p class="text-sm text-muted-foreground italic">Cartera de proyectos activos y contratos Transmac.</p>
        <button @click="openProjectDialog" class="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
          <Plus class="w-4 h-4" /> Nuevo Proyecto
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div v-if="cargando" class="flex justify-center py-12">
          <RefreshCw class="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
        <div v-else v-for="prj in projects" :key="prj.id_proyecto" class="glass-card rounded-2xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all group">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex-1 space-y-3">
              <div class="flex items-center gap-3">
                <span class="px-2 py-1 rounded bg-zinc-800 text-[10px] font-black text-white border border-white/5 uppercase">
                  {{ prj.codi_proyecto }}
                </span>
                <h3 class="text-lg font-bold text-white">{{ prj.nombre_proyecto }}</h3>
                <span :class="['px-2 py-0.5 rounded text-[10px] font-black uppercase', getStatusStyle(prj.id_proyecto_estado)]">
                  {{ getStatusName(prj.id_proyecto_estado) }}
                </span>
              </div>
              
              <div class="flex flex-wrap gap-6 text-[11px] text-muted-foreground font-medium">
                <div class="flex items-center gap-2">
                  <User class="w-3 h-3" /> Jefe: {{ getUserName(prj.id_usuario_jefe_proyecto) }}
                </div>
                <div class="flex items-center gap-2">
                  <Building2 class="w-3 h-3" /> Cliente: {{ getCompanyName(prj.id_empresa_cliente) }}
                </div>
                <div class="flex items-center gap-2">
                  <Calendar class="w-3 h-3" /> Fin: {{ prj.fecha_plan_fin || 'Sin fecha' }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button @click="goToTeams(prj)" class="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all">
                Equipos <ChevronRight class="w-4 h-4 inline ml-1" />
              </button>
              <button @click="openEditProject(prj)" class="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-white border border-white/5"><Pencil class="w-4 h-4" /></button>
              <button @click="confirmDeleteProject(prj)" class="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20"><Trash2 class="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2) VISTA DE EQUIPOS -->
    <div v-else-if="viewMode === 'teams'" class="space-y-6">
      <div class="glass-card rounded-2xl p-6 bg-emerald-500/5 border-emerald-500/20 flex justify-between items-center">
        <div>
          <p class="text-[10px] uppercase font-bold text-emerald-500 tracking-tighter">Proyecto Activo</p>
          <h3 class="text-xl font-black text-white">{{ selectedProject?.nombre_proyecto }}</h3>
        </div>
        <button @click="openTeamDialog" class="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest">Crear Equipo</button>
      </div>

      <div v-if="cargandoEquipos" class="flex justify-center py-12">
        <RefreshCw class="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
      <div v-else-if="filteredTeams.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="team in filteredTeams" :key="team.id" @click="goToMembers(team)" class="glass-card rounded-2xl p-6 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group">
          <div class="flex justify-between items-start mb-4">
            <h4 class="text-base font-bold text-white">{{ team.name }}</h4>
            <div :class="['w-2 h-2 rounded-full', team.status === 'Activo' ? 'bg-emerald-500' : 'bg-destructive']"></div>
          </div>
          <p class="text-xs text-muted-foreground line-clamp-2 h-8">{{ team.description || 'Sin descripción' }}</p>
          <div class="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
            <span class="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{{ getMemberCount(team.id) }} Miembros</span>
            <ChevronRight class="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 glass-card rounded-2xl border border-white/5">
        <p class="text-muted-foreground">No hay equipos registrados en este proyecto.</p>
      </div>
    </div>

    <!-- 3) VISTA DE MIEMBROS -->
    <div v-else-if="viewMode === 'members'" class="space-y-4">
       <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div class="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div>
              <p class="text-[10px] uppercase font-bold text-emerald-500 tracking-tighter">Gestionando Equipo</p>
              <h3 class="text-lg font-black text-white uppercase tracking-widest">{{ selectedTeam?.name }}</h3>
            </div>
            <button @click="openMemberDialog" class="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-black uppercase rounded-xl hover:bg-emerald-500 hover:text-white transition-all">Asignar Miembro</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-white/5">
                  <th class="px-6 py-4">Usuario</th>
                  <th class="px-6 py-4">Rol</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr v-for="member in filteredMembers" :key="member.id" class="text-xs group hover:bg-white/[0.02] transition-colors">
                  <td class="px-6 py-4 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold border border-emerald-500/20">
                      {{ getUserInitials(member.userId) }}
                    </div>
                    <div>
                      <span class="block font-bold text-white">{{ getUserName(member.userId) }}</span>
                      <span class="text-[10px] text-muted-foreground">ID: #{{ member.userId }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-0.5 rounded bg-zinc-800 border border-white/10 text-[9px] font-black uppercase text-white/70">{{ getRoleName(member.roleId) }}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button @click="removeMember(member)" class="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-destructive/20 rounded-lg">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
       </div>
    </div>

    <!-- TODO: Diálogos de creación/edición (Portar lógica 1:1) -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  ChevronRight, Plus, User, Building2, Calendar, 
  Pencil, Trash2, RefreshCw
} from 'lucide-vue-next'
import apiAxios from '@/services/api'

/* ================= STATE ================= */
const viewMode = ref('projects') // 'projects', 'teams', 'members'
const cargando = ref(false)
const cargandoEquipos = ref(false)
const projects = ref([])
const companies = ref([])
const users = ref([])
const roles = ref([])

const selectedProject = ref(null)
const selectedTeam = ref(null)

const teams = ref([]) // Equipos del proyecto seleccionado
const memberships = ref([]) // Miembros (user-team relationships)

/* ================= API ================= */
async function cargarProyectos() {
  cargando.value = true
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerProyectos')
    projects.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Error cargarProyectos', e)
  } finally {
    cargando.value = false
  }
}

async function cargarEquipos(idPrj) {
  cargandoEquipos.value = true
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerEquiposProyectosMiembros', {
      params: { id_proyecto: idPrj }
    })
    // Mapear el formato de la API al formato local
    const rawData = Array.isArray(data) ? data : []
    
    // Agrupar por equipo
    const teamMap = new Map()
    rawData.forEach(f => {
      const id = f.id_equipo_proyecto
      if (!teamMap.has(id)) {
        teamMap.set(id, {
          id,
          name: f.nombre_equipo || `Equipo #${id}`,
          description: f.descripcion_equipo || '',
          status: 'Activo',
          members: []
        })
      }
      if (f.id_user) {
        teamMap.get(id).members.push({
          id: f.id_user_equipo_miembro,
          userId: f.id_user,
          roleId: f.id_rol
        })
      }
    })
    
    teams.value = Array.from(teamMap.values())
  } catch (e) {
    console.error('Error cargarEquipos', e)
  } finally {
    cargandoEquipos.value = false
  }
}

async function cargarCatalogos() {
  try {
    const [c, u, r] = await Promise.all([
      apiAxios.get('/servicio/leanglobal/obtenerEmpresas'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuarios'),
      apiAxios.get('/servicio/leanglobal/obtenerRoles')
    ])
    companies.value = Array.isArray(c.data) ? c.data : []
    users.value = Array.isArray(u.data?.data) ? u.data.data : (Array.isArray(u.data) ? u.data : [])
    roles.value = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])
  } catch (e) {
    console.error('Error cargarCatalogos', e)
  }
}

onMounted(() => {
  cargarProyectos()
  cargarCatalogos()
})

/* ================= NAVIGATION ================= */
async function goToTeams(prj) {
  selectedProject.value = prj
  viewMode.value = 'teams'
  await cargarEquipos(prj.id_proyecto)
}

function goToMembers(team) {
  selectedTeam.value = team
  viewMode.value = 'members'
}

function goBackToProjects() {
  selectedProject.value = null
  selectedTeam.value = null
  viewMode.value = 'projects'
}

/* ================= HELPERS ================= */
const filteredTeams = computed(() => teams.value)
const filteredMembers = computed(() => selectedTeam.value?.members || [])

function getStatusName(id) {
  if (Number(id) === 3) return 'En Ejecución'
  if (Number(id) === 2) return 'Planificación'
  return 'Activo'
}

function getStatusStyle(id) {
  if (Number(id) === 3) return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
  if (Number(id) === 2) return 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
  return 'bg-zinc-500/10 text-zinc-500 border border-white/5'
}

function getCompanyName(id) {
  return companies.value.find(c => Number(c.id_empresa) === Number(id))?.name_empresa || `Empresa ${id}`
}

function getUserName(id) {
  const u = users.value.find(ux => Number(ux.id_user) === Number(id))
  return u ? `${u.name_frst} ${u.apellido_pat}` : `ID: ${id}`
}

function getUserInitials(id) {
  const u = users.value.find(ux => Number(ux.id_user) === Number(id))
  return u ? (u.name_frst[0] || '?').toUpperCase() : '?'
}

function getRoleName(id) {
  return roles.value.find(rx => Number(rx.id_rol) === Number(id))?.name_rol || `Rol ${id}`
}

function getMemberCount(teamId) {
  return teams.value.find(t => t.id === teamId)?.members.length || 0
}

/* ================= ACTIONS ================= */
function openProjectDialog() { /* TODO */ }
function openEditProject(prj) { /* TODO */ }
function confirmDeleteProject(prj) { /* TODO */ }
function openTeamDialog() { /* TODO */ }
function openMemberDialog() { /* TODO */ }
function removeMember(member) { /* TODO */ }

</script>
