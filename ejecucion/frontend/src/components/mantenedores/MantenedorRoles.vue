<template>
  <div class="space-y-6 min-h-[600px]">
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-bold text-white tracking-tight">Matriz de Roles y Perfiles RBAC — GSP</h3>
        <p class="text-xs text-muted-foreground italic">Asignación y auditoría de roles operativos, comerciales, taller, bodega y terreno por usuario.</p>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total: {{ usuariosFiltrados.length }}</span>
        <button 
          @click="cargarTodo"
          :disabled="cargando"
          class="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': cargando }" />
        </button>
      </div>
    </div>

    <!-- Filtros Rápidos por Área / Perfil RBAC -->
    <div class="flex flex-wrap items-center gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/10">
      <button
        v-for="f in areaFilters"
        :key="f.id"
        @click="filtroArea = f.id"
        :class="[
          'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5',
          filtroArea === f.id
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
            : 'bg-white/5 text-zinc-400 border-white/5 hover:border-white/20 hover:text-white'
        ]"
      >
        <span>{{ f.label }}</span>
        <span class="px-1.5 py-0.2 rounded-full bg-black/30 text-[9px] font-mono">{{ f.count }}</span>
      </button>
    </div>

    <div v-if="cargando" class="flex justify-center py-20">
      <RefreshCw class="w-10 h-10 text-emerald-500 animate-spin" />
    </div>

    <div v-else class="grid grid-cols-1 gap-4">
      <div v-for="u in usuariosFiltrados" :key="u.id_user" class="glass-card rounded-2xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all group">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex-1 space-y-3">
            <div class="flex items-center gap-3">
              <span class="px-2 py-1 rounded bg-zinc-800 text-[10px] font-black text-white border border-white/5 uppercase">#{{ u.id_user }}</span>
              <h4 class="text-base font-bold text-white">{{ u.nombre_user || nombreCompleto(u) || '(Sin nombre)' }}</h4>
              <span v-if="getCargo(u)" class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] font-bold uppercase">
                {{ getCargo(u) }}
              </span>
              <span :class="['px-2 py-0.5 rounded text-[9px] font-black uppercase', isActivo(u) ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/10 text-zinc-500']">
                {{ isActivo(u) ? 'Activo' : 'Inactivo' }}
              </span>
            </div>

            <div class="flex flex-wrap gap-6 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              <div class="flex items-center gap-2"><Mail class="w-3 h-3" /> {{ u.email || 'Sin correo' }}</div>
              <div class="flex items-center gap-2"><Fingerprint class="w-3 h-3" /> Rut: {{ u.rut || '—' }}</div>
              <div class="flex items-center gap-2"><Smartphone class="w-3 h-3" /> Móvil: {{ u.movil || '—' }}</div>
            </div>

            <!-- Chips RBAC -->
            <div class="flex flex-wrap gap-1.5 pt-2">
              <template v-if="rbacRoleCodesPorUsuario(u.id_user).length">
                <span 
                  v-for="code in rbacRoleCodesPorUsuario(u.id_user)" 
                  :key="code"
                  :class="['px-2.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider', getRoleBadgeClass(code)]"
                >
                  {{ code }} — {{ getRoleLabel(code) }}
                </span>
              </template>
              <span v-else class="px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[9px] font-bold text-amber-400 uppercase">
                Sin rol funcional asignado (Solo Consentimiento / Vacío)
              </span>
            </div>
          </div>

          <button 
            @click="abrirMatriz(u)" 
            class="px-5 py-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-glow-sm"
          >
            Matriz <Grid3X3 class="w-4 h-4 inline ml-1.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Matriz Dialog -->
    <RbacMatrixDialog
      v-model:show="dialog.open"
      :usuario="dialog.user"
      :roles-codes="accessMatrixRoleCodesPorUsuario(dialog.user?.id_user)"
      :roles-catalog="roles"
      :permissions="permisos"
      @guardar="onGuardarRbac"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { RefreshCw, Mail, Fingerprint, Smartphone, Grid3X3 } from 'lucide-vue-next'
import apiAxios from '@/services/api'
import RbacMatrixDialog from '@/components/mantenedores/RbacMatrixDialog.vue'

const props = defineProps({
  search: { type: String, default: '' },
  refreshKey: { type: Number, default: 0 },
})

/* ================= STATE ================= */
const cargando = ref(false)
const usuarios = ref([])
const roles = ref([])
const usuariosRoles = ref([])
const permisos = ref([])
const filtroArea = ref('TODOS')

const dialog = reactive({
  open: false,
  user: null,
})

const GSP_ROLE_META = {
  ADMIN: { label: 'Admin Global', area: 'ADMIN', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  ADM_COM: { label: 'Admin Comercial', area: 'COMERCIAL', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  COMERCIAL: { label: 'Ejecutivo Comercial', area: 'COMERCIAL', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  COORD: { label: 'Coordinador Op.', area: 'OPERACIONES', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  GSP_APROB: { label: 'Jefe Operaciones', area: 'OPERACIONES', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  GSP_PROG: { label: 'Control de Gestión', area: 'OPERACIONES', cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  SECRETARIA: { label: 'Secretaría', area: 'OPERACIONES', cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  GSP_PREV: { label: 'Prevención & Docs', area: 'PREVENCION', cls: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
  GSP_CONTA: { label: 'Contabilidad', area: 'FINANZAS', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  GSP_TALLER_APROB: { label: 'Jefe de Taller', area: 'TALLER_BODEGA', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  GSP_TALLER_PROG: { label: 'Planif. Taller', area: 'TALLER_BODEGA', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  GSP_TALLER_EJEC: { label: 'Mecánico Taller', area: 'TALLER_BODEGA', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  GSP_BODEGA: { label: 'Inventario WMS', area: 'TALLER_BODEGA', cls: 'bg-lime-500/10 text-lime-400 border-lime-500/30' },
  GSP_EJEC: { label: 'Operador / Rigger PWA', area: 'TERRENO', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  'USR-CONSENT': { label: 'Consentimiento FES', area: 'CONSENT', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/30' }
}

/* ================= HELPERS ================= */
function nombreCompleto(u) {
  const parts = [u.name_frst, u.name_sec, u.apellido_pat, u.apellido_mat].filter(Boolean)
  return parts.join(' ').trim()
}

function getCargo(u) {
  if (!u?.json_data) return ''
  try {
    const parsed = typeof u.json_data === 'string' ? JSON.parse(u.json_data) : u.json_data
    return parsed?.cargo || ''
  } catch {
    return ''
  }
}

function isActivo(u) {
  return u.activo === true || u.activo === 1 || u.activo === 't' || u.activo === 'true'
}

function getRoleCode(r) {
  const raw = r?.codi_rol ?? r?.codigo ?? r?.code ?? r?.name_rol ?? ''
  return String(raw).trim().toUpperCase()
}

function getRoleLabel(code) {
  const norm = String(code || '').trim().toUpperCase()
  return GSP_ROLE_META[norm]?.label || norm
}

function getRoleBadgeClass(code) {
  const norm = String(code || '').trim().toUpperCase()
  return GSP_ROLE_META[norm]?.cls || 'bg-white/5 border-white/10 text-white/70'
}

/* ================= MAPS ================= */
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
  const set = new Set(Object.keys(GSP_ROLE_META))
  for (const r of roles.value || []) {
    const code = getRoleCode(r)
    if (code) set.add(code)
  }
  return set
})

const rolesPorUsuario = computed(() => {
  const map = new Map()
  for (const ur of usuariosRoles.value || []) {
    const uid = Number(ur.id_user)
    if (!map.has(uid)) map.set(uid, [])
    map.get(uid).push(Number(ur.id_rol))
  }
  return map
})

function roleCodesUsuario(uid) {
  const ids = rolesPorUsuario.value.get(Number(uid)) || []
  return ids.map(id => getRoleCode(roleById.value.get(id))).filter(Boolean)
}

function rbacRoleCodesPorUsuario(uid) {
  return roleCodesUsuario(uid).filter(code => code !== 'USR-CONSENT' && rbacRoleCodeSet.value.has(code))
}

function accessMatrixRoleCodesPorUsuario(uid) {
  return roleCodesUsuario(uid).filter(code => rbacRoleCodeSet.value.has(code))
}

function matchesArea(uid, areaId) {
  if (areaId === 'TODOS') return true
  const functionalCodes = rbacRoleCodesPorUsuario(uid)
  if (areaId === 'SIN_ROL') return functionalCodes.length === 0
  return functionalCodes.some(code => GSP_ROLE_META[code]?.area === areaId)
}

const areaFilters = computed(() => {
  const list = usuarios.value || []
  const defs = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'SIN_ROL', label: 'Sin Rol Funcional' },
    { id: 'ADMIN', label: 'Dirección / Admin' },
    { id: 'COMERCIAL', label: 'Comercial' },
    { id: 'OPERACIONES', label: 'Operaciones & Control Gestión' },
    { id: 'PREVENCION', label: 'Prevención & Docs' },
    { id: 'FINANZAS', label: 'Contabilidad' },
    { id: 'TALLER_BODEGA', label: 'Taller & Bodega WMS' },
    { id: 'TERRENO', label: 'Terreno PWA (Op/Rigger)' }
  ]
  return defs.map(d => ({
    ...d,
    count: list.filter(u => matchesArea(u.id_user, d.id)).length
  }))
})

/* ================= COMPUTED ================= */
const usuariosFiltrados = computed(() => {
  const q = (props.search || '').trim().toLowerCase()
  return (usuarios.value || []).filter(u => {
    if (!matchesArea(u.id_user, filtroArea.value)) return false
    if (!q) return true
    const rolesTxt = rbacRoleCodesPorUsuario(u.id_user).join(' ')
    const txt = `${u.id_user} ${u.email} ${u.rut} ${u.nombre_user} ${nombreCompleto(u)} ${getCargo(u)} ${rolesTxt}`.toLowerCase()
    return txt.includes(q)
  })
})

/* ================= API ================= */
async function cargarTodo() {
  cargando.value = true
  try {
    const [u, r, ur, p] = await Promise.all([
      apiAxios.get('/servicio/leanglobal/obtenerUsuarios'),
      apiAxios.get('/servicio/leanglobal/obtenerRoles'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles'),
      apiAxios.get('/servicio/leanglobal/obtenerPermisos')
    ])
    usuarios.value = (Array.isArray(u.data?.data) ? u.data.data : (Array.isArray(u.data) ? u.data : [])).sort((a,b) => b.id_user - a.id_user)
    roles.value = (Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []))
    usuariosRoles.value = (Array.isArray(ur.data?.data) ? ur.data.data : (Array.isArray(ur.data) ? ur.data : []))
    permisos.value = (Array.isArray(p.data?.data) ? p.data.data : (Array.isArray(p.data) ? p.data : []))
  } catch (err) {
    console.error('Error cargarTodo', err)
  } finally {
    cargando.value = false
  }
}

/* ================= ACTIONS ================= */
function abrirMatriz(u) {
  dialog.user = u
  dialog.open = true
}

async function onGuardarRbac(payload) {
  const uid = Number(payload.id_user)
  const user = usuarios.value.find(x => Number(x.id_user) === uid)
  if (!user) return

  const selectedCodes = (payload.rolesCodes || []).map(c => String(c || '').trim().toUpperCase()).filter(Boolean)
  const selectedRbacIds = selectedCodes.map(code => roleIdByCode.value.get(code)).filter(Boolean)
  const finalRoleIds = Array.from(new Set(selectedRbacIds))

  try {
    await apiAxios.post('/usuarios/updUsuario', { ...user, roles: finalRoleIds })
    await cargarTodo()
    dialog.open = false
  } catch (err) {
    console.error('Error onGuardarRbac', err)
  }
}

watch(() => props.refreshKey, cargarTodo)
onMounted(cargarTodo)
</script>
