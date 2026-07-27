<template>
  <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl mt-6">
    <div class="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <FileSpreadsheet class="w-5 h-5 text-emerald-500" />
        <h3 class="text-sm font-bold uppercase text-white tracking-widest">Enrolamiento Masivo desde Excel</h3>
      </div>
    </div>

    <div class="p-6 space-y-6">
      <!-- File Input Custom -->
      <div class="flex items-center justify-center w-full">
        <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all">
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload class="w-8 h-8 text-muted-foreground mb-3" />
            <p class="mb-2 text-sm text-white"><span class="font-bold">Haga clic para subir</span> o arrastre y suelte</p>
            <p class="text-xs text-muted-foreground">XLSX o XLS (Máx. 10MB)</p>
          </div>
          <input type="file" class="hidden" accept=".xlsx,.xls" @change="onFileChange" />
        </label>
      </div>

      <div v-if="fileName" class="flex items-center justify-between px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <div class="flex items-center gap-2">
          <FileSpreadsheet class="w-4 h-4 text-emerald-500" />
          <span class="text-xs font-bold text-white">{{ fileName }}</span>
        </div>
        <button @click="resetFile" class="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <X class="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <!-- Resumen resultado -->
      <div v-if="resumen.mostrable" :class="['p-4 rounded-xl border', resumen.tipoClass]">
        <div class="flex items-start gap-3">
          <component :is="resumen.icon" class="w-5 h-5 mt-0.5" />
          <div class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider">Resultado del Proceso</p>
            <div class="text-[11px] font-medium">
              OK: <span class="font-bold">{{ resumen.ok }}</span> · 
              Error: <span class="font-bold text-red-400">{{ resumen.err }}</span> · 
              Omitidos: <span class="font-bold text-amber-400">{{ resumen.skip }}</span>
            </div>
            
            <div v-if="resumen.err && resumen.detalles.length" class="mt-2 space-y-1 border-t border-white/10 pt-2">
              <p class="text-[10px] font-bold uppercase text-red-400">Detalle de errores:</p>
              <ul class="text-[10px] list-disc pl-4 space-y-0.5 text-red-300/70">
                <li v-for="(d, i) in resumen.detalles" :key="i">
                  {{ d.rut || '—' }} / {{ d.correo || '—' }} — {{ d.motivo }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div v-if="warning" class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 flex items-center gap-3">
        <AlertTriangle class="w-5 h-5" />
        <span class="text-xs font-bold">{{ warning }}</span>
      </div>

      <!-- Preview Table -->
      <div v-if="filas.length" class="overflow-x-auto border border-white/10 rounded-2xl">
        <table class="w-full text-left">
          <thead class="bg-white/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-white/5">
            <tr>
              <th class="px-4 py-3">Rut</th>
              <th class="px-4 py-3">Nombre</th>
              <th class="px-4 py-3">Correo</th>
              <th class="px-4 py-3 min-w-[200px]">Roles</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="(row, i) in filas" :key="i" class="text-[11px] text-white/80 hover:bg-white/[0.02]">
              <td class="px-4 py-3 font-mono">{{ row.rut }}</td>
              <td class="px-4 py-3">{{ row.nombre }}</td>
              <td class="px-4 py-3">{{ row.correo }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span v-for="rid in row.rolesIds" :key="rid" class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase">
                    {{ getRoleName(rid) }}
                  </span>
                  <span v-for="rInv in row.rolesInvalidos" :key="rInv" class="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black uppercase" title="Rol no encontrado">
                    {{ rInv }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span v-if="row._estado" :class="['px-1.5 py-0.5 rounded text-[9px] font-black uppercase', row._estado === 'OK' ? 'bg-emerald-500 text-white' : (row._estado === 'ERROR' ? 'bg-red-500 text-white' : 'bg-zinc-600 text-white')]">
                  {{ row._estado }}
                </span>
                <span v-else class="text-zinc-600">—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span v-if="row._error" class="text-red-400 font-medium">{{ row._error }}</span>
                <span v-else class="text-zinc-600">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filas.length" class="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
        <Info class="w-4 h-4 text-muted-foreground" />
        <p class="text-[10px] text-muted-foreground">
          Formato esperado: <strong class="text-white">rut, nombre, correo, roles</strong> (Roles separados por coma).
        </p>
      </div>

      <div class="flex justify-end pt-4">
        <button 
          @click="enviarMasivo"
          :disabled="!filas.length || loading"
          class="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50"
        >
          <Send class="w-4 h-4" />
          {{ loading ? 'Procesando...' : 'Iniciar Enrolamiento Masivo' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import * as XLSX from 'xlsx'
import apiAxios from '@/services/api'
import { 
  FileSpreadsheet, Upload, X, AlertTriangle, Info, 
  Send, CheckCircle2, XCircle, AlertCircle 
} from 'lucide-vue-next'

const props = defineProps({
  roles: { type: Array, required: true },
})

const emit = defineEmits(['finalizado'])

const fileName = ref('')
const filas = ref([])
const loading = ref(false)
const warning = ref('')

const bulkResult = ref({
  ok: 0, err: 0, skip: 0, detalles: [], listo: false
})

const resumen = computed(() => ({
  mostrable: bulkResult.value.listo,
  tipoClass: bulkResult.value.err ? 'bg-red-500/10 border-red-500/20 text-red-400' : (bulkResult.value.skip ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'),
  icon: bulkResult.value.err ? XCircle : (bulkResult.value.skip ? AlertCircle : CheckCircle2),
  ok: bulkResult.value.ok,
  err: bulkResult.value.err,
  skip: bulkResult.value.skip,
  detalles: bulkResult.value.detalles,
}))

function resetFile() {
  fileName.value = ''
  filas.value = []
  warning.value = ''
  resetBulk()
}

function resetBulk() {
  bulkResult.value = { ok: 0, err: 0, skip: 0, detalles: [], listo: false }
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  fileName.value = file.name
  leerExcel(file)
}

function leerExcel(file) {
  warning.value = ''
  filas.value = []
  resetBulk()

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      if (!json.length) {
        warning.value = 'El Excel viene vacío o no tiene encabezados.'
        return
      }

      filas.value = json.map(raw => {
        const rut = pick(raw, ['rut', 'Rut', 'RUT'])
        const nombre = pick(raw, ['nombre', 'Nombre', 'NOMBRE'])
        const correo = pick(raw, ['correo', 'Correo', 'CORREO', 'email', 'Email', 'EMAIL'])
        const rolesRaw = pick(raw, ['roles', 'Roles', 'ROLES'])

        const { rolesIds, rolesInvalidos } = mapearRolesPorNombre(rolesRaw)

        return {
          rut: normalizarRut(rut),
          nombre: String(nombre ?? '').trim(),
          correo: String(correo ?? '').trim(),
          rolesIds,
          rolesInvalidos,
          _estado: null,
          _error: ''
        }
      }).filter(r => r.rut || r.nombre || r.correo)

      if (!filas.value.length) warning.value = 'No encontré filas válidas.'
    } catch (err) {
      console.error('Error parseando Excel', err)
      warning.value = 'No pude interpretar el Excel.'
    }
  }
  reader.readAsArrayBuffer(file)
}

function pick(obj, keys) {
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k]
  return ''
}

function normalizarRut(val) {
  if (!val) return ''
  const v = String(val).replace(/[^0-9Kk]/g, '').toUpperCase()
  if (v.length < 2) return v
  return `${v.slice(0, -1)}-${v.slice(-1)}`
}

function mapearRolesPorNombre(rolesRaw) {
  if (!rolesRaw) return { rolesIds: [], rolesInvalidos: [] }
  const tokens = String(rolesRaw).split(',').map(x => x.trim()).filter(Boolean)
  const rolesMap = new Map(props.roles.map(r => [String(r.name_rol || '').trim().toUpperCase(), Number(r.id_rol)]))
  const rolesIds = []
  const rolesInvalidos = []
  for (const t of tokens) {
    const key = t.toUpperCase()
    const id = rolesMap.get(key)
    if (id) rolesIds.push(id)
    else rolesInvalidos.push(t)
  }
  return { rolesIds: Array.from(new Set(rolesIds)), rolesInvalidos }
}

function getRoleName(id) {
  return props.roles.find(r => Number(r.id_rol) === Number(id))?.name_rol || `Rol ${id}`
}

async function enviarMasivo() {
  loading.value = true
  resetBulk()
  try {
    for (const row of filas.value) {
      if (!row.correo || !row.rolesIds.length) {
        row._estado = 'OMITIDO'
        row._error = !row.correo ? 'Falta correo' : 'Sin roles'
        bulkResult.value.skip++
        continue
      }
      try {
        await apiAxios.post('/usuarios/inicioEnrolamiento/', {
          rut: row.rut, nombre: row.nombre, correo: row.correo, roles: row.rolesIds
        })
        row._estado = 'OK'
        bulkResult.value.ok++
      } catch (e) {
        row._estado = 'ERROR'
        row._error = e?.response?.data?.message || 'Error en servidor'
        bulkResult.value.err++
        bulkResult.value.detalles.push({ rut: row.rut, correo: row.correo, motivo: row._error })
      }
    }
    bulkResult.value.listo = true
    emit('finalizado')
  } finally {
    loading.value = false
  }
}
</script>
