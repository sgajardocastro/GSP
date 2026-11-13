<template>
  <div v-if="visible" class="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-fadeIn">
    <div class="bg-[#0b1021] border border-emerald-500/40 rounded-2xl w-full max-w-xl flex flex-col overflow-hidden shadow-2xl shadow-black">
      
      <!-- CABECERA -->
      <div class="bg-[#050810] px-5 py-4 border-b border-white/10 flex justify-between items-center flex-shrink-0">
        <div class="flex items-center gap-3">
          <span class="text-2xl">{{ datos?.tipo === 'REPORTE' ? '📋' : '🚛' }}</span>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-black text-white uppercase tracking-wider font-mono">
                {{ datos?.tipo === 'REPORTE' ? 'Recordatorio Report Diario (WhatsApp)' : 'Despacho Hoja de Ruta (WhatsApp)' }}
              </h3>
              <span class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                {{ datos?.tipo === 'REPORTE' ? 'Faena' : 'Ruta Convoy' }}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">
              Envío directo al teléfono del operador vía servicio oficial WhatsApp LeanGlobal GSP
            </p>
          </div>
        </div>
        <button @click="cerrar" class="text-slate-400 hover:text-white text-xl p-1 font-bold cursor-pointer transition-colors">✕</button>
      </div>

      <!-- CUERPO DEL MODAL -->
      <div class="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
        
        <!-- RESUMEN OPERACIONAL DEL RECEPTOR -->
        <div class="bg-[#050810] border border-white/10 rounded-xl p-3.5 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">👷 Conductor / Operador</span>
            <span class="text-white font-bold block truncate mt-0.5">{{ datos?.operador_nombre || 'No asignado' }}</span>
            <span class="text-[10px] text-slate-500 font-mono">{{ datos?.cargo || 'Operador de Maquinaria' }}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">🚜 Equipo & Patente</span>
            <span class="text-amber-400 font-bold font-mono block mt-0.5">{{ datos?.patente || 'S/P' }}</span>
            <span class="text-[10px] text-slate-400 truncate block">{{ datos?.modelo || 'Equipo GSP' }}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">📋 Orden de Trabajo</span>
            <span class="text-blue-400 font-bold font-mono block mt-0.5">{{ datos?.codi_proyecto || 'OT-GSP' }}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">🏢 Mandante / Cliente</span>
            <span class="text-slate-300 font-semibold block truncate mt-0.5">{{ datos?.nombre_cliente || 'Cliente General' }}</span>
          </div>
        </div>

        <!-- SECCIÓN DE TELÉFONO / FALLBACK ASISTIDO -->
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>📱 Teléfono Móvil WhatsApp:</span>
              <span v-if="tieneTelefonoInicial" class="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                ✓ Registrado
              </span>
              <span v-else class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold animate-pulse">
                ⚠️ Sin Fono en Ficha
              </span>
            </label>
            <span class="text-[10px] text-slate-400 font-mono">Formato: +56 9 XXXXXXXX</span>
          </div>

          <!-- ALERTA SI NO TIENE TELÉFONO REGISTRADO -->
          <div v-if="!tieneTelefonoInicial" class="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2.5">
            <span class="text-lg">⚠️</span>
            <div class="text-[11px] text-amber-200 leading-snug">
              <strong class="text-amber-400 font-bold block">Operador sin número móvil registrado</strong>
              Ingrese el número de celular del operador para realizar el despacho ahora. Puede guardarlo en su ficha para los siguientes servicios.
            </div>
          </div>

          <!-- INPUT DE TELÉFONO -->
          <div class="relative flex items-center">
            <span class="absolute left-3 text-xs font-mono font-bold text-slate-400 select-none">🇨🇱 +56</span>
            <input 
              v-model="telefonoInput" 
              type="tel" 
              placeholder="9 1234 5678" 
              maxlength="15"
              class="w-full bg-[#050810] border rounded-xl pl-16 pr-4 py-2.5 text-sm text-white font-mono font-bold outline-none transition-all"
              :class="telefonoValido ? 'border-emerald-500/50 focus:border-emerald-400' : 'border-amber-500/50 focus:border-amber-400'"
            />
          </div>

          <!-- OPCIÓN GUARDAR EN FICHA -->
          <div v-if="!tieneTelefonoInicial && datos?.operador_id" class="flex items-center gap-2 pt-1 pl-1">
            <input 
              type="checkbox" 
              id="guardarFonoFicha" 
              v-model="guardarEnFicha" 
              class="accent-emerald-500 w-3.5 h-3.5 cursor-pointer rounded"
            />
            <label for="guardarFonoFicha" class="text-[11px] text-slate-300 cursor-pointer select-none">
              Guardar este teléfono en la ficha del operador para futuros despachos
            </label>
          </div>
        </div>

        <!-- VISTA PREVIA DEL MENSAJE WHATSAPP -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <label class="text-xs font-bold text-slate-300">💬 Vista Previa del Mensaje:</label>
            <span class="text-[10px] text-slate-500">Formato WhatsApp (Markdown)</span>
          </div>
          <div class="bg-[#050810] border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner max-h-44 overflow-y-auto selection:bg-emerald-500 selection:text-slate-950">
            {{ mensajeGenerado }}
          </div>
        </div>

        <!-- ENLACE DIRECTO WEB & BOTÓN COPIAR -->
        <div class="bg-black/40 border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-3">
          <div class="min-w-0 flex-1">
            <span class="text-[9px] font-mono text-slate-500 block uppercase">Enlace Web Móvil Directo:</span>
            <span class="text-[11px] font-mono text-blue-400 truncate block">{{ urlCompleta }}</span>
          </div>
          <button 
            @click="copiarEnlace" 
            type="button" 
            class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all flex-shrink-0"
            title="Copiar link al portapapeles"
          >
            <span>{{ enlaceCopiado ? '✓ Copiado' : '📋 Copiar' }}</span>
          </button>
        </div>

        <!-- NOTIFICACIONES DE ESTADO -->
        <div v-if="errorEnvio" class="bg-red-950/40 border border-red-500/50 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
          <span>❌</span>
          <span>{{ errorEnvio }}</span>
        </div>

        <div v-if="exitoEnvio" class="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <span>✅</span>
          <span>{{ exitoEnvio }}</span>
        </div>

      </div>

      <!-- FOOTER DE ACCIONES -->
      <div class="bg-[#050810] px-5 py-3.5 border-t border-white/10 flex justify-between items-center flex-shrink-0">
        <button 
          @click="cerrar" 
          type="button" 
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Cerrar
        </button>

        <div class="flex items-center gap-2">
          <button 
            @click="enviarMensajeWhatsApp" 
            :disabled="enviando || !telefonoValido" 
            type="button" 
            class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <span v-if="enviando" class="animate-spin">⏳</span>
            <span v-else>📲</span>
            <span>{{ enviando ? 'Despachando a WhatsApp...' : (datos?.tipo === 'REPORTE' ? 'Enviar Recordatorio WhatsApp' : 'Despachar Viaje por WhatsApp') }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import apiAxios from '../../services/api'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  datos: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['cerrar', 'enviado'])

const telefonoInput = ref('')
const tieneTelefonoInicial = ref(false)
const guardarEnFicha = ref(true)
const enviando = ref(false)
const errorEnvio = ref('')
const exitoEnvio = ref('')
const enlaceCopiado = ref(false)

// Normalizar y formatear el teléfono ingresado
const telefonoLimpio = computed(() => {
  let num = String(telefonoInput.value || '').replace(/\D/g, '')
  if (num.startsWith('56') && num.length > 9) {
    num = num.substring(2)
  }
  return num
})

const telefonoFormateadoCompleto = computed(() => {
  const num = telefonoLimpio.value
  if (!num) return ''
  return `+56${num}`
})

const telefonoValido = computed(() => {
  // En Chile los móviles tienen 9 dígitos (ej. 9 1234 5678)
  const num = telefonoLimpio.value
  return num.length === 9 && num.startsWith('9')
})

const urlCompleta = computed(() => {
  if (props.datos?.url) return props.datos.url
  const isProd = window.location.pathname.includes('-prod')
  const base = isProd 
    ? 'https://servidor.leanglobal.cl/lg-gsp-prod/viaje/' 
    : 'https://servidor.leanglobal.cl/lg-gsp-dev/viaje/'
  const token = props.datos?.token || 'vj-demo-1234'
  if (props.datos?.tipo === 'REPORTE') {
    return `${base}${token}?fase=reporte`
  }
  return `${base}${token}`
})

const mensajeGenerado = computed(() => {
  const chofer = props.datos?.operador_nombre || 'Conductor'
  const ot = props.datos?.codi_proyecto || 'OT-GSP'
  const cliente = props.datos?.nombre_cliente || 'Mandante'
  const patente = props.datos?.patente || 'S/P'
  const modelo = props.datos?.modelo || 'Grúa'
  const url = urlCompleta.value

  const isDev = window.location.pathname.includes('-dev') || window.location.hostname === 'localhost'
  const prefijoEnv = isDev ? '🟡 *[SIMULACIÓN DEV / PRUEBAS]*\n_Este mensaje es una prueba de desarrollo. No corresponde a una faena real._\n\n' : ''

  if (props.datos?.tipo === 'REPORTE') {
    return `${prefijoEnv}📋 *GRÚAS SAN PABLO - RECORDATORIO REPORT DIARIO*\n\nEstimado(a) *${chofer}*:\nFavor recuerde ingresar y solicitar la firma del Report Diario de hoy en faena.\n\n📋 *OT:* ${ot} - ${cliente}\n🚚 *Equipo:* ${patente} (${modelo})\n\n👉 *Ingrese aquí para registrar horómetros y firma:*\n${url}\n\n_Recuerde validar horas antes del cierre del turno._`
  }

  return `${prefijoEnv}🚛 *GRÚAS SAN PABLO - HOJA DE RUTA OPERACIONAL*\n\nEstimado(a) *${chofer}*:\nSe ha generado su Hoja de Ruta para el servicio:\n\n📋 *OT:* ${ot}\n🚚 *Equipo:* ${patente} (${modelo})\n🏢 *Cliente:* ${cliente}\n\n👉 *Inicie su viaje y registre odómetro inicial aquí:*\n${url}\n\n_Buen viaje y conduzca con precaución._`
})

watch(() => props.visible, (val) => {
  if (val) {
    errorEnvio.value = ''
    exitoEnvio.value = ''
    enlaceCopiado.value = false
    
    // Inicializar teléfono desde datos
    const fonoOriginal = String(props.datos?.telefono || '').replace(/\D/g, '')
    if (fonoOriginal) {
      tieneTelefonoInicial.value = true
      let num = fonoOriginal
      if (num.startsWith('56') && num.length > 9) num = num.substring(2)
      telefonoInput.value = num
    } else {
      tieneTelefonoInicial.value = false
      telefonoInput.value = ''
    }
  }
})

const copiarEnlace = async () => {
  try {
    await navigator.clipboard.writeText(urlCompleta.value)
    enlaceCopiado.value = true
    setTimeout(() => {
      enlaceCopiado.value = false
    }, 2500)
  } catch (err) {
    console.error('Error al copiar:', err)
  }
}

const enviarMensajeWhatsApp = async () => {
  if (!telefonoValido.value) {
    errorEnvio.value = 'Por favor ingrese un número de celular chileno válido de 9 dígitos (ej: 912345678).'
    return
  }

  enviando.value = true
  errorEnvio.value = ''
  exitoEnvio.value = ''

  try {
    const payload = {
      numero: telefonoFormateadoCompleto.value,
      mensaje: mensajeGenerado.value
    }

    // Llamada directa al proxy del microservicio de WhatsApp
    const isProd = typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/lg-gsp-prod') ||
      window.location.pathname.startsWith('/pwa-gsp-prod')
    )
    const wspEndpoint = isProd 
      ? 'https://servidor.leanglobal.cl/lg-gsp-prod/whatsapp/enviar'
      : 'https://servidor.leanglobal.cl/lg-gsp-dev/whatsapp/enviar'

    const resp = await axios.post(wspEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    })

    if (resp.data?.ok) {
      exitoEnvio.value = `¡Mensaje enviado exitosamente a ${telefonoFormateadoCompleto.value}!`
      
      // Opcional: Si el usuario marcó guardar en ficha y hay operador_id
      if (guardarEnFicha.value && !tieneTelefonoInicial.value && props.datos?.operador_id) {
        try {
          await apiAxios.post('/servicio/leanglobal/actualizarTelefonoUsuario', {
            id_user: props.datos.operador_id,
            movil: telefonoFormateadoCompleto.value
          })
        } catch (e) {
          console.warn('Nota: No se pudo persistir fono en DB central, pero el mensaje fue despachado.', e)
        }
      }

      emit('enviado', {
        tipo: props.datos?.tipo,
        numero: telefonoFormateadoCompleto.value,
        token: props.datos?.token,
        fecha: new Date().toISOString()
      })

      // Cerrar modal tras 2 segundos de confirmación
      setTimeout(() => {
        cerrar()
      }, 2000)
    } else {
      errorEnvio.value = resp.data?.error || 'No se pudo enviar el mensaje por WhatsApp.'
    }
  } catch (err) {
    console.error('Error al despachar WhatsApp:', err)
    errorEnvio.value = err.response?.data?.error || err.message || 'Error de conexión con el servicio de WhatsApp.'
  } finally {
    enviando.value = false
  }
}

const cerrar = () => {
  emit('cerrar')
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.15s ease-out forwards;
}
</style>
