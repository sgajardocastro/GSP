<template>
  <div class="space-y-6 min-h-[600px]">
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-bold text-white tracking-tight">Matriz RBAC</h3>
        <p class="text-xs text-muted-foreground italic">Configura roles por usuario (Módulo × Función).</p>
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
                  v-for="code in rbacRoleCodesPorUsuario(u.id_user).slice(0, 8)" 
                  :key="code"
                  class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/60 uppercase"
                >
                  {{ code }}
                </span>
                <span v-if="rbacRoleCodesPorUsuario(u.id_user).length > 8" class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[9px] font-black">
                  +{{ rbacRoleCodesPorUsuario(u.id_user).length - 8 }}
                </span>
              </template>
              <span v-else class="text-[10px] text-zinc-600 italic">Sin roles RBAC configurados</span>
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

const dialog = reactive({
  open: false,
  user: null,
})

/* ================= HELPERS ================= */
function nombreCompleto(u) {
  const parts = [u.name_frst, u.name_sec, u.apellido_pat, u.apellido_mat].filter(Boolean)
  return parts.join(' ').trim()
}

function isActivo(u) {
  return u.activo === true || u.activo === 1 || u.activo === 't' || u.activo === 'true'
}

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
  const set = new Set()
  for (const p of permisos.value || []) {
    const modCode = inferModuleCodeFromText(p?.description)
    const fnCode = String(p?.code_perm || '').trim().toUpperCase()
    if (!modCode || !fnCode) continue
    set.add(`${modCode}_${fnCode}`)
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
  return ids.map(id => getRoleCode(roleById.value.get(id))).filter(Boolean).map(c => c.toUpperCase())
}

function rbacRoleCodesPorUsuario(uid) {
  return roleCodesUsuario(uid).filter(code => rbacRoleCodeSet.value.has(code)).sort()
}

function accessMatrixRoleCodesPorUsuario(uid) {
  return roleCodesUsuario(uid).filter(code => rbacRoleCodeSet.value.has(code) || isCnxRoleCode(code)).sort()
}

/* ================= COMPUTED ================= */
const usuariosFiltrados = computed(() => {
  const q = (props.search || '').trim().toLowerCase()
  if (!q) return usuarios.value
  return usuarios.value.filter(u => {
    const txt = `${u.id_user} ${u.email} ${u.rut} ${u.nombre_user} ${nombreCompleto(u)}`.toLowerCase()
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

  const currentAllRoleIds = rolesPorUsuario.value.get(uid) || []
  const currentNonRbacIds = currentAllRoleIds.filter(rid => {
    const code = getRoleCode(roleById.value.get(rid)).toUpperCase()
    return !rbacRoleCodeSet.value.has(code) && !isCnxRoleCode(code)
  })

  const selectedCodes = (payload.rolesCodes || []).map(c => c.toUpperCase())
  const selectedRbacIds = selectedCodes.map(code => roleIdByCode.value.get(code)).filter(Boolean)
  const finalRoleIds = Array.from(new Set([...currentNonRbacIds, ...selectedRbacIds]))

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
