<template>
  <div class="ingreso-zanja">
    <v-row dense>
      <v-col cols="12" md="6">
        <v-select
          v-model="form.trabajadorId"
          :items="trabajadores"
          item-title="label"
          item-value="value"
          label="Trabajador"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
        />
      </v-col>

      <v-col cols="9" md="4">
        <v-select
          v-model="form.acceso"
          :items="accessItems"
          label="Acceso"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
        />
      </v-col>

      <v-col cols="3" md="2">
        <v-btn
          color="primary"
          variant="outlined"
          block
          :disabled="disabled"
          @click="addAccessOption"
        >
          + Acceso
        </v-btn>
      </v-col>

      <v-col cols="12" md="4">
        <v-text-field
          v-model="form.fecha"
          type="date"
          label="Fecha"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
        />
      </v-col>

      <v-col cols="6" md="4">
        <v-text-field
          v-model="form.horaEntrada"
          type="time"
          label="Hora entrada"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
        />
      </v-col>

      <v-col cols="6" md="4">
        <v-text-field
          v-model="form.horaSalida"
          type="time"
          label="Hora salida"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
        />
      </v-col>

      <v-col cols="12">
        <v-btn
          color="primary"
          :disabled="disabled"
          @click="addRow"
        >
          Agregar
        </v-btn>
      </v-col>
    </v-row>

    <v-table density="compact" class="mt-3">
      <thead>
        <tr>
          <th>Trabajador</th>
          <th>Acceso</th>
          <th>Hora entrada</th>
          <th>Hora salida</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in sortedRows" :key="row.uid || idx">
          <td>{{ row.trabajadorNombre }}</td>
          <td>Acceso {{ row.acceso }}</td>
          <td>{{ row.horaEntrada || '--:--' }}</td>
          <td>{{ row.horaSalida || '--:--' }}</td>
        </tr>
        <tr v-if="!sortedRows.length">
          <td colspan="4" class="text-medium-emphasis">Sin registros.</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, toRef } from 'vue'
import apiAxios from '@/services/api'

const props = defineProps({
  attr: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['change'])
const attr = toRef(props, 'attr')

const trabajadores = ref([])
const maxAccess = ref(Number(attr.value?.maxAccess || 8))

const form = reactive({
  trabajadorId: null,
  acceso: 1,
  fecha: getTodayLocalDate(),
  horaEntrada: '',
  horaSalida: ''
})

const accessItems = computed(() => {
  const list = []
  for (let i = 1; i <= maxAccess.value; i++) list.push(i)
  return list
})

const sortedRows = computed(() => {
  const rows = Array.isArray(attr.value?.body) ? [...attr.value.body] : []
  return rows.sort((a, b) => {
    const workerA = (a?.trabajadorNombre || '').toString().toLowerCase()
    const workerB = (b?.trabajadorNombre || '').toString().toLowerCase()
    if (workerA < workerB) return -1
    if (workerA > workerB) return 1
    return Number(a?.acceso || 0) - Number(b?.acceso || 0)
  })
})

onMounted(async () => {
  ensureAttrStructure()
  await loadTrabajadores()
})

function ensureAttrStructure() {
  if (!Array.isArray(attr.value.body)) attr.value.body = []
  if (!attr.value.maxAccess || Number(attr.value.maxAccess) < 8) {
    attr.value.maxAccess = 8
  }
  maxAccess.value = Number(attr.value.maxAccess)
}

async function loadTrabajadores() {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
    const rows = Array.isArray(data) ? data : []
    trabajadores.value = rows.map((u) => ({
      value: u.id_user,
      label: buildUserName(u)
    }))
  } catch (error) {
    console.error('Error cargando usuarios:', error)
    trabajadores.value = []
  }
}

function buildUserName(user) {
  const name = [
    user?.name_frst,
    user?.name_sond,
    user?.apellido_pat,
    user?.apellido_mat
  ].filter(Boolean).join(' ').trim()
  return name || user?.nombre_user || `Usuario ${user?.id_user ?? ''}`.trim()
}

function addAccessOption() {
  maxAccess.value += 1
  attr.value.maxAccess = maxAccess.value
  form.acceso = maxAccess.value
}

function getTodayLocalDate() {
  const now = new Date()
  const tzOffset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10)
}

function addRow() {
  if (!form.trabajadorId || !form.acceso) {
    alert('Completa Trabajador y Acceso.')
    return
  }

  if (!form.fecha) {
    form.fecha = getTodayLocalDate()
  }

  const selectedWorker = trabajadores.value.find(t => String(t.value) === String(form.trabajadorId))
  const row = {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    trabajadorId: form.trabajadorId,
    trabajadorNombre: selectedWorker?.label || `Usuario ${form.trabajadorId}`,
    acceso: Number(form.acceso),
    fecha: form.fecha,
    horaEntrada: form.horaEntrada || '',
    horaSalida: form.horaSalida || ''
  }

  if (!Array.isArray(attr.value.body)) attr.value.body = []
  const idx = attr.value.body.findIndex((r) =>
    String(r?.trabajadorId) === String(row.trabajadorId) &&
    Number(r?.acceso) === Number(row.acceso)
  )

  if (idx >= 0) {
    const prev = attr.value.body[idx] || {}
    attr.value.body[idx] = {
      ...prev,
      ...row,
      // Mantiene horas existentes si la nueva viene vacía
      horaEntrada: row.horaEntrada || prev.horaEntrada || '',
      horaSalida: row.horaSalida || prev.horaSalida || '',
      // Conserva uid para que no cambie la clave visual
      uid: prev.uid || row.uid
    }
  } else {
    attr.value.body.push(row)
  }

  attr.value.body = [...sortedRows.value]

  resetForm()
  emit('change')
}

function resetForm() {
  form.trabajadorId = null
  form.acceso = 1
  form.fecha = getTodayLocalDate()
  form.horaEntrada = ''
  form.horaSalida = ''
}
</script>

<style scoped>
.ingreso-zanja {
  width: 100%;
}
</style>
