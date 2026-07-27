<template>
  <div class="space-y-6">
    <!-- 🔵 INDICADORES POR PROYECTO (Exacto Terracon) -->
    <div class="glass-card rounded-2xl overflow-hidden border border-white/10">
      <div 
        @click="mostrarProyectos = !mostrarProyectos"
        class="bg-white/5 px-4 py-3 flex items-center justify-between cursor-pointer border-b border-white/5 hover:bg-white/10 transition-colors"
      >
        <div class="flex items-center gap-2">
          <ChevronUp v-if="mostrarProyectos" class="w-4 h-4 text-emerald-500" />
          <ChevronDown v-else class="w-4 h-4 text-emerald-500" />
          <span class="text-xs font-bold uppercase tracking-widest text-emerald-500">Resumen de Usuarios por Proyecto</span>
        </div>
        <div class="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Click para colapsar</div>
      </div>
      
      <div v-show="mostrarProyectos" class="p-4 bg-white/[0.02]">
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <div 
            v-for="stat in proyectosConUsuarios" 
            :key="stat.id_proyecto"
            @click="toggleFiltroProyecto(stat.id_proyecto)"
            class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between"
            :class="[filtroProyectoId === stat.id_proyecto ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/5 hover:border-white/20']"
          >
            <span class="text-[10px] font-bold text-white/70 truncate mr-2" :title="stat.nombre_proyecto">
              {{ stat.nombre_proyecto }}
            </span>
            <span class="text-lg font-black text-white leading-none">{{ stat.total_usuarios }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 🟢 INDICADORES HERO (Exacto Terracon) -->
    <div class="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
      <div 
        @click="toggleFiltro('activos')"
        class="flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all border border-transparent"
        :class="{ 'bg-emerald-500/20 border-emerald-500/30': filtroActual === 'activos' }"
      >
        <div class="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
          <UserCheck class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xl font-black text-emerald-500 leading-none">{{ stats.activos }}</p>
          <p class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Activos</p>
        </div>
      </div>

      <div 
        @click="toggleFiltro('pendientes')"
        class="flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all border border-transparent"
        :class="{ 'bg-amber-500/20 border-amber-500/30': filtroActual === 'pendientes' }"
      >
        <div class="p-2 rounded-lg bg-amber-500/20 text-amber-500">
          <PenTool class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xl font-black text-amber-500 leading-none">{{ stats.pendientes }}</p>
          <p class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">PIN FES Pendiente</p>
        </div>
      </div>

      <div 
        @click="toggleFiltro('con-pin')"
        class="flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all border border-transparent"
        :class="{ 'bg-blue-500/20 border-blue-500/30': filtroActual === 'con-pin' }"
      >
        <div class="p-2 rounded-lg bg-blue-500/20 text-blue-500">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xl font-black text-blue-500 leading-none">{{ stats.conPin }}</p>
          <p class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Con PIN FES</p>
        </div>
      </div>

      <div class="flex-1"></div>

      <!-- Controles de Paginación y Carga (Exacto Terracon) -->
      <div class="flex items-center gap-4">
        <select 
          v-model="itemsPerPage" 
          class="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none"
        >
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="-1">Todos</option>
        </select>
        
        <div class="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
          <button @click="page--" :disabled="page <= 1" class="text-white disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
          <span class="text-[10px] font-bold text-white">{{ page }}/{{ pageCount || 1 }}</span>
          <button @click="page++" :disabled="page >= pageCount" class="text-white disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
        </div>

        <button 
          @click="cargarTodo"
          class="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all border border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          :class="{ 'animate-spin': cargando }"
        >
          <RefreshCw class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 🔵 TABLA DE USUARIOS (Columnas Exactas Terracon) -->
    <div class="glass-card rounded-2xl overflow-hidden border border-white/10">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-white/5 border-b border-white/5">
              <th 
                v-for="h in headers" 
                :key="h.key" 
                @click="h.key && toggleSort(h.key)"
                :class="['px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground select-none', h.key ? 'cursor-pointer hover:bg-white/5' : '']"
              >
                <div class="flex items-center gap-1">
                  <span>{{ h.title }}</span>
                  <template v-if="h.key && sortBy === h.key">
                    <ChevronUp v-if="!sortDesc" class="w-3 h-3 text-emerald-500" />
                    <ChevronDown v-else class="w-3 h-3 text-emerald-500" />
                  </template>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="u in usuariosPaginados" :key="u.id_user" class="hover:bg-white/[0.02] transition-colors group">
              <td class="px-4 py-4 text-[10px] font-mono font-bold text-zinc-500">#{{ u.id_user }}</td>
              <td class="px-4 py-4 text-[10px] text-white/50 truncate max-w-[120px]" :title="u.email">{{ u.email }}</td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-bold border border-emerald-500/20">
                    {{ (u.name_frst || '?')[0].toUpperCase() }}
                  </div>
                  <span class="text-xs font-bold text-white">{{ u.name_frst }} {{ u.apellido_pat }} {{ u.apellido_mat }}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-xs font-medium text-white/80">{{ u.rut }}</td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-1">
                  <span v-for="pId in userProjectsIdsMatch[u.id_user]" :key="pId" class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase border border-emerald-500/20">
                    {{ getProjectName(pId) }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-4 text-[10px] text-white/60">{{ getCompanyName(u.id_empresa) }}</td>
              <td class="px-4 py-4">
                <span :class="['px-1.5 py-0.5 rounded text-[8px] font-black uppercase', u.activo ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-zinc-500']">
                  {{ u.activo ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </td>
              <td class="px-4 py-4 text-[10px] text-white/50 truncate max-w-[100px]">{{ getJsonValue(u.json_data, 'cargo') }}</td>
              <td class="px-4 py-4 text-[10px] text-white/50">{{ formatFecha(getJsonValue(u.json_data, 'fechaNacimiento')) }}</td>
              <td class="px-4 py-4 text-center">
                <div v-if="u.pass_hash_fes" class="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <Check class="w-3 h-3 text-emerald-500" />
                </div>
                <div v-else class="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                  <X class="w-3 h-3 text-destructive" />
                </div>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button @click="openEdit(u)" class="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white" title="Editar"><Pencil class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dialogs Portados -->
    <EditUsuarioDialog
      v-model:show="editDialog"
      :usuario="usuarioEdit"
      :roles="roles"
      :permisos="permisos"
      @guardar="guardarUsuario"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import apiAxios from '@/services/api'
import EditUsuarioDialog from '@/components/EditUsuarioDialog.vue'
import { 
  UserCheck, PenTool, ShieldCheck, ChevronUp, ChevronDown, 
  ChevronLeft, ChevronRight, RefreshCw, Check, X, Pencil 
} from 'lucide-vue-next'

const props = defineProps({
  search: { type: String, default: '' },
})

/* ================= STATE ================= */
const cargando = ref(false)
const usuarios = ref([])
const roles = ref([])
const empresas = ref([])
const userMemberships = ref([])
const permisos = ref([])
const proyectoStats = ref([])

const mostrarProyectos = ref(true)
const filtroActual = ref(null) 
const filtroProyectoId = ref(null)
const page = ref(1)
const itemsPerPage = ref(25)

const sortBy = ref('id_user')
const sortDesc = ref(false)

const editDialog = ref(false)
const usuarioEdit = ref(null)

const headers = [
  { title: 'ID', key: 'id_user' },
  { title: 'EMAIL', key: 'email' },
  { title: 'NOMBRE', key: 'nombre' },
  { title: 'RUT', key: 'rut' },
  { title: 'PROYECTOS', key: 'proyectos' },
  { title: 'EMPRESA', key: 'id_empresa' },
  { title: 'ESTADO', key: 'activo' },
  { title: 'CARGO', key: 'cargo' },
  { title: 'NACIMIENTO', key: 'fecha_nac' },
  { title: 'FES', key: 'fes' },
  { title: '', key: 'actions' },
]

function toggleSort(key) {
  if (sortBy.value === key) {
    sortDesc.value = !sortDesc.value
  } else {
    sortBy.value = key
    sortDesc.value = false
  }
}

/* ================= COMPUTED ================= */
const stats = computed(() => {
  const list = usuarios.value || []
  return {
    activos: list.filter(u => u.activo === true || u.activo === 1).length,
    pendientes: list.filter(u => u.flag_proc_enrol === true || u.flag_proc_enrol === 1).length,
    conPin: list.filter(u => u.pass_hash_fes != null).length
  }
})

const usuariosFiltrados = computed(() => {
  let list = usuarios.value || []
  if (filtroActual.value === 'activos') list = list.filter(u => u.activo === true || u.activo === 1)
  else if (filtroActual.value === 'pendientes') list = list.filter(u => u.flag_proc_enrol === true || u.flag_proc_enrol === 1)
  else if (filtroActual.value === 'con-pin') list = list.filter(u => u.pass_hash_fes != null)

  if (filtroProyectoId.value) {
    const uidsInProject = userMemberships.value
      .filter(m => m.id_proyecto === filtroProyectoId.value && m.activo)
      .map(m => m.id_user)
    const set = new Set(uidsInProject)
    list = list.filter(u => set.has(u.id_user))
  }

  const q = (props.search || '').trim().toLowerCase()
  if (q) {
    list = list.filter(u => `${u.id_user} ${u.email} ${u.rut} ${u.name_frst} ${u.apellido_pat}`.toLowerCase().includes(q))
  }

  // Ordenamiento interactivo por columnas
  if (sortBy.value) {
    list = [...list].sort((a, b) => {
      let valA = a[sortBy.value]
      let valB = b[sortBy.value]

      if (sortBy.value === 'nombre') {
        valA = `${a.name_frst || ''} ${a.apellido_pat || ''} ${a.apellido_mat || ''}`.trim().toLowerCase()
        valB = `${b.name_frst || ''} ${b.apellido_pat || ''} ${b.apellido_mat || ''}`.trim().toLowerCase()
      } else if (sortBy.value === 'cargo') {
        valA = getJsonValue(a.json_data, 'cargo').toLowerCase()
        valB = getJsonValue(b.json_data, 'cargo').toLowerCase()
      } else if (sortBy.value === 'fecha_nac') {
        valA = getJsonValue(a.json_data, 'fechaNacimiento')
        valB = getJsonValue(b.json_data, 'fechaNacimiento')
      } else if (sortBy.value === 'fes') {
        valA = a.pass_hash_fes ? 1 : 0
        valB = b.pass_hash_fes ? 1 : 0
      } else {
        if (typeof valA === 'string') valA = valA.toLowerCase()
        if (typeof valB === 'string') valB = valB.toLowerCase()
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDesc.value ? valB - valA : valA - valB
        }
      }

      if (valA < valB) return sortDesc.value ? 1 : -1
      if (valA > valB) return sortDesc.value ? -1 : 1
      return 0
    })
  }

  return list
})

const usuariosPaginados = computed(() => {
  if (itemsPerPage.value === -1) return usuariosFiltrados.value
  const start = (page.value - 1) * itemsPerPage.value
  return usuariosFiltrados.value.slice(start, start + itemsPerPage.value)
})

const pageCount = computed(() => Math.ceil(usuariosFiltrados.value.length / itemsPerPage.value))

const userProjectsIdsMatch = computed(() => {
  const map = {}
  userMemberships.value.forEach(m => {
    if (!m.activo || !m.id_user) return
    if (!map[m.id_user]) map[m.id_user] = new Set()
    map[m.id_user].add(m.id_proyecto)
  })
  const res = {}; for (const k in map) res[k] = Array.from(map[k]); return res
})

const proyectosConUsuarios = computed(() => proyectoStats.value.filter(stat => Number(stat.total_usuarios) > 0))

/* ================= ACTIONS ================= */
function openEdit(u) {
  const uMemberships = (userMemberships.value || [])
    .filter(m => Number(m.id_user) === Number(u.id_user) && m.activo)
    .map(m => ({
      id_proyecto: Number(m.id_proyecto),
      id_equipo_proyecto: Number(m.id_equipo_proyecto)
    }))

  usuarioEdit.value = {
    ...u,
    rolesIds: rolesPorUsuario.value[Number(u.id_user)] || [],
    memberships: uMemberships
  }
  editDialog.value = true
}



async function guardarUsuario(u) {
  try {
    await apiAxios.post('/usuarios/updUsuario', u)
    await cargarTodo()
  } catch (e) {
    console.error('Error al guardar usuario:', e)
  }
}

/* ================= RBAC MAPPING LOGIC (Portado de Terracon) ================= */
const roleById = computed(() => {
  const map = new Map()
  for (const r of roles.value || []) map.set(Number(r.id_rol), r)
  return map
})

const roleIdByCode = computed(() => {
  const map = new Map()
  for (const r of roles.value || []) {
    const code = getRoleCode(r)
    if (code) map.set(code.toUpperCase(), Number(r.id_rol))
  }
  return map
})

const rbacRoleCodeSet = computed(() => {
  const set = new Set()
  const functionCodes = ['ADMIN', 'PROG', 'EJEC', 'APROB']
  const modulesList = ['TMAC', 'CDLC_DMH', 'CDLC_DCH', 'CDLC_SPOT', 'AMSA_MLP', 'TMAC_CALM', 'TMAC_LAND', 'RENTMAC']
  modulesList.forEach(m => {
    functionCodes.forEach(f => {
      set.add(`${m}_${f}`)
    })
  })
  set.add('ADMIN')

  for (const p of permisos.value || []) {
    const modCode = inferModuleCodeFromText(p?.description)
    const fnCode = String(p?.code_perm || '').trim().toUpperCase()
    if (!modCode || !fnCode) continue
    set.add(`${modCode}_${fnCode}`)
  }
  return set
})

function getRoleCode(r) {
  const raw = r?.codi_rol ?? r?.codigo ?? r?.code ?? r?.name_rol ?? ''
  return String(raw).trim()
}

function isCnxRoleCode(code) {
  return String(code || '').trim().toUpperCase().startsWith('CNX')
}

function inferModuleCodeFromText(text) {
  const s = String(text || '').toUpperCase()
  const m = s.match(/M[ÓO]DULO\s+([A-Z0-9_]+)/i)
  return m?.[1] ? String(m[1]).toUpperCase() : ''
}

const rolesPorUsuario = computed(() => {
  // Necesitamos cargar la relación usuarios-roles para que esto funcione
  const map = {}
  ;(usuariosRoles.value || []).forEach(ur => {
    const uid = Number(ur.id_user)
    const rid = Number(ur.id_rol)
    if (!map[uid]) map[uid] = []
    map[uid].push(rid)
  })
  return map
})

function rbacRoleCodesPorUsuario(uid) {
  const ids = rolesPorUsuario.value[Number(uid)] || []
  return ids
    .map(id => getRoleCode(roleById.value.get(Number(id))))
    .filter(Boolean)
    .map(c => c.toUpperCase())
    .filter(code => rbacRoleCodeSet.value.has(code))
    .sort()
}

function accessMatrixRoleCodesPorUsuario(uid) {
  const ids = rolesPorUsuario.value[Number(uid)] || []
  return ids
    .map(id => getRoleCode(roleById.value.get(Number(id))))
    .filter(Boolean)
    .map(c => c.toUpperCase())
    .filter(code => rbacRoleCodeSet.value.has(code) || isCnxRoleCode(code))
    .sort()
}

/* ================= API ================= */
const usuariosRoles = ref([])

async function cargarTodo() {
  cargando.value = true
  try {
    const [u, r, e, m, s, p, ur] = await Promise.all([
      apiAxios.get('/servicio/leanglobal/obtenerUsuarios'),
      apiAxios.get('/servicio/leanglobal/obtenerRoles'),
      apiAxios.get('/servicio/leanglobal/obtenerEmpresas'),
      apiAxios.get('/servicio/leanglobal/obtenerEquiposProyectosMiembros'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuariosPorProyecto'),
      apiAxios.get('/servicio/leanglobal/obtenerPermisos'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles')
    ])
    
    usuarios.value = Array.isArray(u.data?.data) ? u.data.data : (Array.isArray(u.data) ? u.data : [])
    roles.value = (Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])).map(rx => ({
      ...rx,
      id_rol: Number(rx.id_rol ?? rx.id),
      name_rol: rx.name_rol ?? rx.name
    }))
    empresas.value = Array.isArray(e.data) ? e.data : (Array.isArray(e.data?.data) ? e.data.data : [])
    userMemberships.value = Array.isArray(m.data?.data) ? m.data.data : (Array.isArray(m.data) ? m.data : [])
    proyectoStats.value = Array.isArray(s.data?.data) ? s.data.data : (Array.isArray(s.data) ? s.data : [])
    permisos.value = Array.isArray(p.data) ? p.data : (Array.isArray(p.data?.data) ? p.data.data : [])
    usuariosRoles.value = Array.isArray(ur.data?.data) ? ur.data.data : (Array.isArray(ur.data) ? ur.data : [])
    
  } catch (err) {
    console.error('Error cargando datos:', err)
  } finally {
    cargando.value = false
  }
}

onMounted(cargarTodo)

/* ================= HELPERS ================= */
function toggleFiltro(tipo) { page.value = 1; filtroProyectoId.value = null; filtroActual.value = filtroActual.value === tipo ? null : tipo }
function toggleFiltroProyecto(idPrj) { page.value = 1; filtroActual.value = null; filtroProyectoId.value = filtroProyectoId.value === idPrj ? null : idPrj }
function getCompanyName(id) { return empresas.value.find(ex => Number(ex.id_empresa) === Number(id))?.name_empresa || `E-${id}` }
function getProjectName(id) { return proyectoStats.value.find(sx => Number(sx.id_proyecto) === Number(id))?.nombre_proyecto || `P-${id}` }
function getJsonValue(json, key) { if (!json) return '-'; try { const d = typeof json === 'string' ? JSON.parse(json) : json; return d?.[key] || '-' } catch { return '-' } }
function formatFecha(val) { if (!val || val === '-') return '-'; return val.split('-').reverse().join('/') }
</script>
