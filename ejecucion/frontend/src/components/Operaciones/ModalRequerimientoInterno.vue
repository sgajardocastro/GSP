<template>
  <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn text-left">
    <div class="bg-[#0b1021] border-2 border-dashed border-amber-400/70 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-black">
      
      <!-- CABECERA CORPORATIVA TEMA OSCURO GSP -->
      <div class="bg-[#050810] px-5 py-3.5 border-b border-amber-500/20 flex justify-between items-center shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-xl shadow-inner">
            🔁
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-sm sm:text-base font-black text-white uppercase tracking-wider font-mono">
                Ingresar Requerimiento Interno al Flujo
              </h3>
              <span class="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                🚫 NO FACTURABLE · COSTO PROPIO
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">
              Ingresa una Orden Interna (<span class="text-amber-400 font-mono font-bold">INT-YYMM-XXX</span>) directo a la etapa de <strong>Asignación de Recursos</strong> en el Kanban.
            </p>
          </div>
        </div>
        <button
          @click="cerrar"
          type="button"
          class="text-slate-400 hover:text-white text-xl p-1.5 font-bold cursor-pointer transition-colors leading-none rounded-lg hover:bg-white/5"
          title="Cerrar modal"
        >
          ✕
        </button>
      </div>

      <!-- FORMULARIO DE INGRESO AL FLUJO -->
      <form @submit.prevent="guardarRequerimientoInterno" class="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-200">
        
        <div v-if="errorMsg" class="bg-red-500/15 border border-red-500/40 text-red-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
          <span>⚠️ {{ errorMsg }}</span>
          <button type="button" @click="errorMsg = ''" class="text-red-300 hover:text-white">✕</button>
        </div>

        <!-- FILA 1: EMPRESA INTERNA Y TIPO DE MOVIMIENTO -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              1. Empresa / Razón Social Interna *
            </label>
            <select
              v-model="form.id_empresa"
              required
              class="w-full bg-[#050810] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option v-for="emp in empresasHolding" :key="emp.id" :value="emp.id">
                {{ emp.nombre }} ({{ emp.rut }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              2. Tipo de Movimiento Interno *
            </label>
            <select
              v-model="form.tipo_movimiento_interno"
              required
              class="w-full bg-[#050810] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option v-for="t in tiposMovimiento" :key="t.code" :value="t.code">
                {{ t.label }}
              </option>
            </select>
            <div v-if="form.tipo_movimiento_interno === 'OTRO_INTERNO'" class="mt-2">
              <input
                v-model="form.otro_tipo_movimiento"
                type="text"
                required
                placeholder="Escriba el tipo de movimiento interno..."
                class="w-full bg-[#050810] border border-amber-400/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        <!-- FILA 2: RUTA ABIERTA (ORIGEN ➔ DESTINO SOLO TEXTO) Y MODALIDAD -->
        <div class="bg-[#070b14] border border-amber-500/25 rounded-xl p-3.5 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <span>📍</span> Ruta (Origen ➔ Destino)
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div class="sm:col-span-4">
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Origen *</label>
              <input
                v-model="form.sucursal_origen"
                @input="actualizarTituloSugerido"
                type="text"
                required
                placeholder="Escriba lugar de origen..."
                class="w-full bg-[#050810] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div class="sm:col-span-4">
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Destino *</label>
              <input
                v-model="form.sucursal_destino"
                @input="actualizarTituloSugerido"
                type="text"
                required
                placeholder="Escriba lugar de destino..."
                class="w-full bg-[#050810] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div class="sm:col-span-4">
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Modalidad de Viaje *</label>
              <select
                v-model="form.modalidad_trayecto"
                class="w-full bg-[#050810] border border-white/15 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="IDA_Y_VUELTA">🔄 Ida y Vuelta</option>
                <option value="SOLO_IDA">➡️ Solo Ida</option>
              </select>
            </div>
          </div>
        </div>

        <!-- FILA 3: CATEGORÍA DE RECURSO A ASIGNAR EN KANBAN Y FECHAS -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div class="sm:col-span-6">
            <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              3. Tipo de Equipo Requerido (Para Asignación) *
            </label>
            <select
              v-model="form.categoria_requerida"
              required
              class="w-full bg-[#050810] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
            >
              <option v-for="cat in categoriasEquipoRequerido" :key="cat.code" :value="cat.code">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <div class="sm:col-span-3">
            <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              4. Fecha Salida *
            </label>
            <input
              v-model="form.fecha_plan_ini"
              type="date"
              required
              class="w-full bg-[#050810] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="sm:col-span-3">
            <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              5. Fecha Retorno *
            </label>
            <input
              v-model="form.fecha_plan_fin"
              type="date"
              required
              class="w-full bg-[#050810] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <!-- FILA 4: TÍTULO Y MOTIVO OPERATIVO -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              6. Descripción del Requerimiento *
            </label>
            <input
              v-model="form.nombre_proyecto"
              type="text"
              required
              placeholder="Ej: Movimiento de equipo Temuco ➔ Valdivia"
              class="w-full bg-[#050810] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              7. Motivo / Instrucción para Operaciones *
            </label>
            <input
              v-model="form.motivo"
              type="text"
              required
              placeholder="Ej: Traslado entre sucursales / Envío a taller"
              class="w-full bg-[#050810] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <!-- NOTA INFORMATIVA DEL FLUJO -->
        <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-slate-300">
          <span class="text-base leading-none mt-0.5">ℹ️</span>
          <div>
            Este requerimiento ingresará directamente a la columna <strong class="text-amber-300">3. En Asignación Recursos</strong> del Kanban para que Operaciones asigne el <strong>equipo (patente)</strong> y el <strong>conductor/operador</strong>, quien registrará el viaje de <strong>Ida y Vuelta</strong> en terreno.
          </div>
        </div>

        <!-- BOTONERA DE ACCIÓN -->
        <div class="flex items-center justify-between pt-3 border-t border-white/10">
          <div class="text-[11px] text-slate-400 font-mono">
            Destino en Kanban: <strong class="text-amber-400">Columna 3 · En Asignación Recursos</strong>
          </div>
          <div class="flex items-center gap-2.5">
            <button
              type="button"
              @click="cerrar"
              class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="guardando"
              class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <span v-if="guardando" class="animate-spin">⏳</span>
              <span v-else>🔁</span>
              <span>{{ guardando ? 'Ingresando al Kanban...' : 'Ingresar a Asignación' }}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import apiAxios from '../../services/api'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  flotaEquipos: {
    type: Array,
    default: () => []
  },
  usuariosMap: {
    type: Object,
    default: () => new Map()
  }
})

const emit = defineEmits(['close', 'creado'])

const sucursalesGsp = [
  'Temuco',
  'Valdivia',
  'Puerto Montt',
  'Los Ángeles'
]

const empresasHolding = [
  { id: 9, nombre: 'Grúas San Pablo SpA', rut: '52.004.162-1', corto: 'Grúas San Pablo' },
  { id: 11, nombre: 'Royal Rental SpA', rut: '78.254.535-3', corto: 'Royal Rental' },
  { id: 7, nombre: 'Bestmaq SpA', rut: '76.209.534-3', corto: 'Bestmaq' },
  { id: 8, nombre: 'Logística del Sur SpA', rut: '76.218.576-8', corto: 'Logística del Sur' }
]

const tiposMovimiento = [
  { code: 'TRASLADO_SUCURSAL', label: '🔁 Traslado entre Sucursales GSP' },
  { code: 'MOVIMIENTO_TALLER', label: '🔧 Envío / Retiro de Taller o Mantención' },
  { code: 'APOYO_LOGISTICO', label: '🚚 Apoyo Logístico / Movimiento de Contrapesos' },
  { code: 'OTRO_INTERNO', label: '📋 Otro Movimiento Operativo Interno' }
]

const categoriasEquipoRequerido = [
  { code: 'GRUAS TELESCOPICAS', sub: 'GRÚA TELESCÓPICA', label: '🚜 Grúa Telescópica' },
  { code: 'CAMIONES', sub: 'CAMIÓN PLUMA', label: '🚛 Camión Pluma' },
  { code: 'TRASLADOS', sub: 'CAMA BAJA / TRACTO CAMIÓN', label: '🚚 Tracto Camión / Cama Baja / Rampla' },
  { code: 'MANIPULADOR TELESCOPICO', sub: 'MANIPULADOR TELESCÓPICO', label: '🚜 Manipulador Telescópico' },
  { code: 'GRUA HORQUILLA', sub: 'GRÚA HORQUILLA', label: '🚜 Grúa Horquilla' },
  { code: 'PLATAFORMAS', sub: 'PLATAFORMA ELEVADORA', label: '🚜 Plataforma Elevadora' },
  { code: 'VEHICULOS LIVIANOS', sub: 'CAMIONETA / ESCOLTA', label: '🛻 Camioneta / Vehículo Liviano' }
]

const hoyStr = new Date().toISOString().split('T')[0]

const form = ref({
  id_empresa: 9,
  tipo_movimiento_interno: 'TRASLADO_SUCURSAL',
  otro_tipo_movimiento: '',
  sucursal_origen: '',
  sucursal_destino: '',
  modalidad_trayecto: 'IDA_Y_VUELTA',
  categoria_requerida: 'GRUAS TELESCOPICAS',
  nombre_proyecto: '',
  motivo: '',
  fecha_plan_ini: hoyStr,
  fecha_plan_fin: hoyStr
})

const guardando = ref(false)
const errorMsg = ref('')

const actualizarTituloSugerido = () => {
  const orig = (form.value.sucursal_origen || '').trim()
  const dest = (form.value.sucursal_destino || '').trim()
  if (!form.value.nombre_proyecto || form.value.nombre_proyecto.startsWith('Movimiento Interno:')) {
    if (orig && dest) {
      form.value.nombre_proyecto = `Movimiento Interno: ${orig} ➔ ${dest}`
    } else if (orig || dest) {
      form.value.nombre_proyecto = `Movimiento Interno: ${orig || 'Origen'} ➔ ${dest || 'Destino'}`
    } else {
      form.value.nombre_proyecto = ''
    }
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    errorMsg.value = ''
    form.value = {
      id_empresa: 9,
      tipo_movimiento_interno: 'TRASLADO_SUCURSAL',
      otro_tipo_movimiento: '',
      sucursal_origen: '',
      sucursal_destino: '',
      modalidad_trayecto: 'IDA_Y_VUELTA',
      categoria_requerida: 'GRUAS TELESCOPICAS',
      nombre_proyecto: '',
      motivo: '',
      fecha_plan_ini: hoyStr,
      fecha_plan_fin: hoyStr
    }
  }
})

const generarFolioInternoLocal = () => {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const rnd = String(Math.floor(100 + Math.random() * 900))
  return `INT-${yy}${mm}-${rnd}`
}

const guardarRequerimientoInterno = async () => {
  const origenClean = (form.value.sucursal_origen || '').trim()
  const destinoClean = (form.value.sucursal_destino || '').trim()
  const otroMovClean = (form.value.otro_tipo_movimiento || '').trim()

  if (!origenClean || !destinoClean) {
    errorMsg.value = 'Debe indicar el Origen y el Destino de la ruta.'
    return
  }

  if (form.value.tipo_movimiento_interno === 'OTRO_INTERNO' && !otroMovClean) {
    errorMsg.value = 'Debe escribir el detalle del tipo de movimiento interno.'
    return
  }

  guardando.value = true
  errorMsg.value = ''
  try {
    const empObj = empresasHolding.find(e => Number(e.id) === Number(form.value.id_empresa)) || empresasHolding[0]
    const catObj = categoriasEquipoRequerido.find(c => c.code === form.value.categoria_requerida) || categoriasEquipoRequerido[0]
    const folioSugerido = generarFolioInternoLocal()

    const modalidadLabel = form.value.modalidad_trayecto === 'IDA_Y_VUELTA' ? 'Ida y Vuelta' : 'Solo Ida'
    const esLogistica = form.value.categoria_requerida === 'TRASLADOS'
    const tipoMovimientoFinal = form.value.tipo_movimiento_interno === 'OTRO_INTERNO'
      ? otroMovClean
      : form.value.tipo_movimiento_interno

    // Línea base para que aparezca de inmediato en la tabla de Asignación de Recursos (Pestaña C)
    const lineaBasePrincipal = {
      id: 1,
      _uid: `int-base-${Date.now()}`,
      is_linea_base: true,
      tipo: esLogistica ? 'CAMIONES' : catObj.code,
      subcategoria: catObj.sub,
      descripcion: `Ruta ${origenClean} ➔ ${destinoClean} (${modalidadLabel})`,
      cantidad: 1,
      unidad: modalidadLabel,
      valor_unitario: 0,
      valorUnitario: 0,
      subtotal: 0,
      equipo_asignado_id: '',
      operador_asignado_id: '',
      fecha_plan_ini: form.value.fecha_plan_ini,
      fecha_plan_fin: form.value.fecha_plan_fin
    }

    const payload = {
      id_empresa: Number(form.value.id_empresa),
      razon_social_interna: empObj.nombre,
      nombre_cliente: `INTERNO · ${empObj.corto}`,
      rut_cliente: empObj.rut,
      codi_proyecto: folioSugerido,
      nombre_proyecto: form.value.nombre_proyecto.trim(),
      objetivo_proyecto: form.value.motivo.trim(),
      id_proyecto_estado: 4, // Entra directo a Columna 3: En Asignación Recursos
      es_interno: true,
      tipo_movimiento_interno: tipoMovimientoFinal,
      sucursal_origen: origenClean,
      sucursal_destino: destinoClean,
      modalidad_trayecto: form.value.modalidad_trayecto,
      categoria_requerida: catObj.code,
      subcategoria_requerida: catObj.sub,
      motivo: form.value.motivo.trim(),
      fecha_plan_ini: form.value.fecha_plan_ini,
      fecha_plan_fin: form.value.fecha_plan_fin,
      monto_neto: 0,
      requiere_vb_gerencia: false,
      estado_vb_gerencia: 'NO_REQUERIDO',
      json_field: {
        crm_v1: {
          es_requerimiento_interno: true,
          es_interno: true,
          no_facturable: true,
          tipo_movimiento_interno: tipoMovimientoFinal,
          otro_tipo_movimiento: otroMovClean || null,
          modalidad_trayecto: form.value.modalidad_trayecto,
          familia_servicio: 'MOVIMIENTO INTERNO · COSTO PROPIO',
          sucursal_origen: origenClean,
          sucursal_destino: destinoClean,
          motivo_interno: form.value.motivo.trim(),
          obra_nombre: destinoClean,
          obra_direccion: destinoClean,
          obra_ciudad: destinoClean,
          razon_social: `INTERNO · ${empObj.nombre}`,
          rut_cliente: empObj.rut,
          monto_neto: 0,
          total_neto: 0,
          condicion_pago: 'NO FACTURABLE (C. COSTO INTERNO)',
          requiere_acreditacion: false,
          requiere_oc_hes: false,
          requiere_vb_gerencia: false,
          estado_vb_gerencia: 'NO_REQUERIDO',
          lineas_servicio: [lineaBasePrincipal]
        },
        ejecucion_v1: {
          es_requerimiento_interno: true,
          estado_requerimiento: 'APROBADO',
          decision: 'APROBADO',
          subtab_activa: 'asignacion',
          sucursal_origen: origenClean,
          sucursal_destino: destinoClean,
          modalidad_trayecto: form.value.modalidad_trayecto,
          fecha_salida_plan: form.value.fecha_plan_ini,
          hora_salida_plan: '08:00',
          fecha_fin_plan: form.value.fecha_plan_fin,
          hora_fin_plan: '18:00'
        }
      }
    }

    let proyectoCreado = null
    try {
      const { data } = await apiAxios.post('/proyectos/requerimiento-interno', payload)
      proyectoCreado = data?.proyecto || data?.data || data
    } catch (_) {
      const { data: fallbackData } = await apiAxios.post('/proyectos', payload)
      proyectoCreado = fallbackData?.proyecto || fallbackData?.data || fallbackData
    }

    emit('creado', {
      ...(proyectoCreado || payload),
      codi_proyecto: proyectoCreado?.codi_proyecto || folioSugerido,
      nombre_proyecto: form.value.nombre_proyecto
    })
    emit('close')
  } catch (err) {
    console.error('Error creando requerimiento interno:', err)
    errorMsg.value = err.response?.data?.error || err.response?.data?.message || err.message || 'No se pudo registrar el requerimiento interno'
  } finally {
    guardando.value = false
  }
}

const cerrar = () => {
  emit('close')
}
</script>
