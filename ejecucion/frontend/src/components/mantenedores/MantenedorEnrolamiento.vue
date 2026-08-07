<template>
  <div class="space-y-6 min-h-[600px]">
    <!-- Filtros / Alta Rápida -->
    <div class="glass-card p-6 rounded-2xl border border-white/10 space-y-4 bg-white/[0.03]">
      <div class="flex items-center gap-2 mb-2">
        <UserPlus class="w-5 h-5 text-emerald-500" />
        <h3 class="text-sm font-bold uppercase text-white tracking-widest">Alta de Usuario Individual</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="space-y-1">
          <label class="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Rut</label>
          <input v-model="rut" type="text" placeholder="12345678-9" class="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
        </div>
        <div class="space-y-1 md:col-span-1 lg:col-span-2">
          <label class="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Nombre Completo</label>
          <input v-model="nombre" type="text" placeholder="Ej: Juan Pérez" class="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
        </div>
        <div class="space-y-1 md:col-span-1 lg:col-span-3">
          <label class="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Correo Electrónico</label>
          <input v-model="correo" type="email" placeholder="usuario@correo.cl" class="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
        </div>
      </div>

      <!-- Empresa (Solo si hay rol externo) -->
      <div v-if="showEmpresas" class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/5">
        <div class="space-y-1">
          <label class="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Empresa Externa</label>
          <select v-model="empresaSeleccionada" class="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
            <option :value="null">Seleccionar empresa...</option>
            <option v-for="e in empresas" :key="e.id_empresa" :value="e.id_empresa">{{ e.name_empresa }}</option>
          </select>
        </div>
      </div>

      <div v-if="errorMessage" class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
        <AlertCircle class="w-4 h-4" />
        {{ errorMessage }}
      </div>

      <div class="flex justify-end pt-2">
        <button 
          @click="enviarIniciarEnrolamiento"
          :disabled="loadingEnroll"
          class="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50"
        >
          <Send class="w-4 h-4" />
          {{ loadingEnroll ? 'Enviando...' : 'Enviar Enrolamiento' }}
        </button>
      </div>
    </div>

    <!-- Importación Masiva -->
    <EnrolamientoExcel :roles="roles" @finalizado="reloadAll" />

    <!-- Tabla de Estado de Enrolamiento -->
    <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div class="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <h3 class="text-sm font-bold uppercase text-white tracking-widest">Estado General de Usuarios</h3>
        <button @click="reloadAll" class="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
      <div class="overflow-x-auto max-h-[500px]">
        <table class="w-full text-left">
          <thead class="bg-white/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest sticky top-0 z-10 border-b border-white/5">
            <tr>
              <th class="px-4 py-4">ID</th>
              <th class="px-4 py-4">Roles</th>
              <th class="px-4 py-4">Usuario / Correo</th>
              <th class="px-4 py-4">Rut</th>
              <th class="px-4 py-4 text-center">Estado</th>
              <th class="px-4 py-4">En Enrolamiento</th>
              <th class="px-4 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="item in usuariosFiltrados" :key="item.id_user" class="text-[11px] group hover:bg-white/[0.02] transition-colors">
              <td class="px-4 py-4 font-mono text-zinc-500">#{{ item.id_user }}</td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-1 max-w-[200px]">
                  <span v-for="rolName in obtenerNombresRolesUsuario(item.id_user)" :key="rolName" class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase">
                    {{ rolName }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex flex-col">
                  <span class="font-bold text-white">{{ item.name_frst }} {{ item.apellido_pat }}</span>
                  <span class="text-[9px] text-muted-foreground">{{ item.email }}</span>
                </div>
              </td>
              <td class="px-4 py-4 font-medium">{{ item.rut }}</td>
              <td class="px-4 py-4 text-center">
                <div v-if="item.activo" class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <Check class="w-3 h-3 text-emerald-500" />
                </div>
                <div v-else class="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mx-auto border border-red-500/30">
                  <X class="w-3 h-3 text-red-500" />
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <span :class="['px-1.5 py-0.5 rounded text-[8px] font-black uppercase', item.flag_proc_enrol ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-500']">
                  {{ item.flag_proc_enrol ? 'SÍ' : 'NO' }}
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <button @click="abrirDialogEdicion(item)" class="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-white border border-white/5 opacity-0 group-hover:opacity-100 transition-all">
                  <Pencil class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dialog de edición -->
    <EditUsuarioDialog
      v-model:show="dialogEditar"
      :usuario="usuarioSeleccionado"
      :roles="roles"
      :permisos="permisos"
      @guardar="guardarUsuarioEditado"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { UserPlus, ChevronDown, Send, RefreshCw, Check, X, Pencil, AlertCircle } from 'lucide-vue-next'
import apiAxios from '@/services/api'
import EnrolamientoExcel from '@/components/EnrolamientoExcel.vue'
import EditUsuarioDialog from '@/components/EditUsuarioDialog.vue'

const props = defineProps({
  search: { type: String, default: '' },
  refreshKey: { type: Number, default: 0 },
})

const emit = defineEmits(['refresh'])

/* ================= STATE ================= */
const rut = ref('')
const nombre = ref('')
const correo = ref('')
const rolesSeleccionados = ref([])
const showRoleSelector = ref(false)

const usuarios = ref([])
const usuariosRoles = ref([])
const roles = ref([])
const empresas = ref([])
const permisos = ref([])
const empresaSeleccionada = ref(null)

const loading = ref(false)
const loadingEnroll = ref(false)
const errorMessage = ref('')

const dialogEditar = ref(false)
const usuarioSeleccionado = ref(null)

const showEmpresas = computed(() => {
  return rolesSeleccionados.value.some(id => {
    const r = roles.value.find(rx => rx.id_rol === id)
    return r?.name_rol?.startsWith('CNX-CON')
  })
})

const ROLES_EXCLUIDOS = ['Eq-FESCOL', 'SUP', 'JTRR', 'ADCO']
const rolesFiltrados = computed(() => roles.value.filter(r => !ROLES_EXCLUIDOS.includes(r.name_rol)))

/* ================= HELPERS ================= */
function toggleRole(id) {
  const idx = rolesSeleccionados.value.indexOf(id)
  if (idx > -1) rolesSeleccionados.value.splice(idx, 1)
  else rolesSeleccionados.value.push(id)
}

const rolesPorUsuario = computed(() => {
  const map = {}
  usuariosRoles.value.forEach(ur => {
    if (!map[ur.id_user]) map[ur.id_user] = []
    map[ur.id_user].push(ur.id_rol)
  })
  return map
})

function obtenerNombresRolesUsuario(uid) {
  const ids = rolesPorUsuario.value[uid] || []
  return ids.map(rid => roles.value.find(rx => rx.id_rol === rid)?.name_rol).filter(Boolean)
}

const usuariosFiltrados = computed(() => {
  const q = props.search.toLowerCase()
  if (!q) return usuarios.value
  return usuarios.value.filter(u => `${u.id_user} ${u.email} ${u.name_frst} ${u.rut}`.toLowerCase().includes(q))
})

/* ================= API ================= */
async function reloadAll() {
  loading.value = true
  try {
    const [u, r, ur, e, p] = await Promise.all([
      apiAxios.get('/servicio/leanglobal/obtenerUsuarios'),
      apiAxios.get('/servicio/leanglobal/obtenerRoles'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles'),
      apiAxios.get('/servicio/leanglobal/obtenerEmpresas'),
      apiAxios.get('/servicio/leanglobal/obtenerPermisos')
    ])
    usuarios.value = (Array.isArray(u.data?.data) ? u.data.data : (Array.isArray(u.data) ? u.data : [])).sort((a,b) => b.id_user - a.id_user)
    roles.value = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])
    usuariosRoles.value = Array.isArray(ur.data?.data) ? ur.data.data : (Array.isArray(ur.data) ? ur.data : [])
    empresas.value = (Array.isArray(e.data) ? e.data : (Array.isArray(e.data?.data) ? e.data.data : [])).filter(ex => ex.flag_externo)
    permisos.value = Array.isArray(p.data) ? p.data : (Array.isArray(p.data?.data) ? p.data.data : [])
  } finally {
    loading.value = false
  }
}

async function enviarIniciarEnrolamiento() {
  errorMessage.value = ''
  if (!correo.value) {
    errorMessage.value = 'Debe ingresar un correo electrónico'
    return
  }
  loadingEnroll.value = true
  try {
    const idRolConsent = roles.value.find(r => r.name_rol === 'USR-CONSENT' || r.id_rol === 3)?.id_rol || 3
    const finalRoles = Array.from(new Set([...rolesSeleccionados.value, idRolConsent]))

    const response = await apiAxios.post('/usuarios/inicioEnrolamiento/', {
      rut: rut.value,
      nombre: nombre.value,
      correo: correo.value,
      roles: finalRoles,
      id_empresa: showEmpresas.value ? empresaSeleccionada.value : null,
    })
    
    // Limpiar campos
    rut.value = ''
    nombre.value = ''
    correo.value = ''
    rolesSeleccionados.value = []
    errorMessage.value = ''
    
    await reloadAll()
    emit('refresh')
  } catch (err) {
    console.error('Error enrolamiento', err)
    const msg = err.response?.data?.message || err.message || 'Error desconocido'
    errorMessage.value = 'Error al iniciar enrolamiento: ' + msg
  } finally {
    loadingEnroll.value = false
  }
}

function abrirDialogEdicion(u) {
  usuarioSeleccionado.value = {
    ...u,
    rolesIds: rolesPorUsuario.value[u.id_user] || [],
  }
  dialogEditar.value = true
}

async function guardarUsuarioEditado(payload) {
  try {
    await apiAxios.post('/usuarios/updUsuario', payload)
    await reloadAll()
    emit('refresh')
  } catch (err) {
    console.error('Error guardarUsuarioEditado', err)
  }
}

watch(() => props.refreshKey, reloadAll)
onMounted(reloadAll)
</script>
