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

      <!-- Selector de Roles RBAC Iniciales -->
      <div class="space-y-1.5 pt-2 border-t border-white/5">
        <label class="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">
          Roles RBAC Iniciales <span class="text-emerald-400 font-mono">({{ rolesSeleccionados.length }} seleccionados)</span>
        </label>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="r in rolesFiltrados"
            :key="r.id_rol"
            type="button"
            @click="toggleRole(r.id_rol)"
            :class="[
              'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all',
              rolesSeleccionados.includes(r.id_rol)
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
            ]"
          >
            {{ r.codi_rol || r.name_rol }}
          </button>
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

      <!-- Feedback Reenvío Enlace -->
      <div v-if="feedbackMsg" class="px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs text-emerald-400 font-medium">
        <div class="flex items-center gap-2">
          <Check class="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{{ feedbackMsg }}</span>
        </div>
        <button @click="feedbackMsg = ''" class="text-zinc-400 hover:text-white text-xs px-1">✕</button>
      </div>
      <div v-if="feedbackError" class="px-6 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between text-xs text-red-400 font-medium">
        <div class="flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
          <span>{{ feedbackError }}</span>
        </div>
        <button @click="feedbackError = ''" class="text-zinc-400 hover:text-white text-xs px-1">✕</button>
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
              <th class="px-4 py-4 text-center">En Enrolamiento</th>
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
                <div class="flex items-center justify-end gap-2">
                  <!-- Botón Reenviar Enlace (1-Clic) para usuarios pendientes -->
                  <button 
                    v-if="item.flag_proc_enrol || !item.pass_hash_fes"
                    @click="reenviarEnlace(item)"
                    :disabled="resendingId === item.id_user"
                    class="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold tracking-wide flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
                    :title="'Reenviar enlace oficial de enrolamiento y FES a ' + (item.email || 'usuario')"
                  >
                    <RefreshCw v-if="resendingId === item.id_user" class="w-3 h-3 animate-spin text-amber-400" />
                    <Check v-else-if="sentSuccessId === item.id_user" class="w-3 h-3 text-emerald-400" />
                    <Mail v-else class="w-3 h-3 text-amber-400" />
                    <span>
                      {{ resendingId === item.id_user ? 'Enviando...' : (sentSuccessId === item.id_user ? '¡Enviado!' : 'Reenviar Enlace') }}
                    </span>
                  </button>

                  <button @click="abrirDialogEdicion(item)" title="Editar usuario" class="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-white border border-white/5 opacity-0 group-hover:opacity-100 transition-all">
                    <Pencil class="w-4 h-4" />
                  </button>
                </div>
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
import { UserPlus, ChevronDown, Send, RefreshCw, Check, X, Pencil, AlertCircle, Mail } from 'lucide-vue-next'
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

const resendingId = ref(null)
const sentSuccessId = ref(null)
const feedbackMsg = ref('')
const feedbackError = ref('')

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

async function reenviarEnlace(item) {
  if (!item || !item.id_user) return
  resendingId.value = item.id_user
  feedbackMsg.value = ''
  feedbackError.value = ''

  try {
    const res = await apiAxios.post('/usuarios/reenviarEnrolamiento', {
      id_user: item.id_user
    })

    sentSuccessId.value = item.id_user
    const canales = res.data?.data?.canales || []
    const canalesTexto = canales.length ? ` vía ${canales.join(' y ')}` : ''
    const nombre = item.name_frst ? `${item.name_frst} ${item.apellido_pat || ''}`.trim() : (item.email || 'usuario')
    feedbackMsg.value = `Enlace oficial de enrolamiento reenviado exitosamente a ${nombre} (${item.email})${canalesTexto}.`

    // Reset temporal de feedback visual en botón
    setTimeout(() => {
      if (sentSuccessId.value === item.id_user) {
        sentSuccessId.value = null
      }
    }, 4000)

    // Ocultar banner tras 8 segundos
    setTimeout(() => {
      if (feedbackMsg.value) {
        feedbackMsg.value = ''
      }
    }, 8000)

    // Refrescar estado local
    item.flag_proc_enrol = true
  } catch (err) {
    console.error('Error al reenviar enlace de enrolamiento:', err)
    const errText = err.response?.data?.message || err.response?.data?.error || err.message || 'Error al reenviar enlace'
    feedbackError.value = `Error al reenviar enlace a ${item.email || 'usuario'}: ${errText}`
  } finally {
    resendingId.value = null
  }
}

watch(() => props.refreshKey, reloadAll)
onMounted(reloadAll)
</script>
