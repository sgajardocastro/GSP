<template>
  <div v-if="show" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
      <!-- Header -->
      <div class="bg-slate-950 p-5 border-b border-slate-800 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Mail class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-lg font-black text-white uppercase tracking-wider font-mono">Enviar Cotización por Email</h3>
            <p class="text-sm text-slate-400 mt-0.5">Versión: <strong class="text-amber-400 font-mono font-bold">{{ versionData?.version_codigo || 'v1.0' }}</strong> — <span class="font-mono text-white font-bold">{{ proyecto?.codigo_maestro || proyecto?.codigo_proyecto || 'GSP-2607-001' }}</span></p>
          </div>
        </div>
        <button @click="close" class="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-9 h-9 rounded-full font-bold text-base transition-colors">✕</button>
      </div>

      <!-- Body Form -->
      <div class="p-6 space-y-6 overflow-y-auto flex-1 text-sm scrollbar-hide">
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl font-bold text-xs">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- Remitente Emisor -->
        <div>
          <label class="block text-xs text-slate-300 font-black uppercase mb-1.5 tracking-wider">Remitente Emisor (Fijo)</label>
          <input
            type="text"
            readonly
            value="notificaciones.gsp@leanglobal.cl"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-amber-400 font-mono font-bold cursor-not-allowed"
          />
        </div>

        <!-- GRILLA SUPERIOR 2 COLUMNAS (IZQ: CLIENTE / DER: USUARIOS ENROLADOS GSP REALES) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Columna Izquierda: Destinatarios del Cliente -->
          <div class="space-y-3 flex flex-col justify-between">
            <div>
              <label class="block text-xs text-slate-300 font-black uppercase tracking-wider mb-1.5">Destinatarios del Cliente *</label>
              <div class="flex gap-2">
                <input
                  v-model="newEmailInput"
                  @keyup.enter="addEmailCliente"
                  type="email"
                  placeholder="Agregar otro correo cliente + Enter..."
                  class="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
                />
                <button @click="addEmailCliente" class="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-4 py-2.5 rounded-xl border border-slate-700 text-xs uppercase">
                  + Agregar
                </button>
              </div>
            </div>

            <!-- Tags de Correos Cliente (Tipografía Legible) -->
            <div class="flex flex-wrap gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 min-h-[100px] max-h-40 overflow-y-auto">
              <span
                v-for="(email, idx) in destinatariosCliente"
                :key="idx"
                class="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-2 font-bold h-fit"
              >
                ✉️ {{ email }}
                <button @click="removeEmailCliente(idx)" class="hover:text-rose-400 font-bold ml-1 text-sm">✕</button>
              </span>
              <span v-if="destinatariosCliente.length === 0" class="text-slate-500 italic text-xs py-1">Sin destinatarios asignados</span>
            </div>
          </div>

          <!-- Columna Derecha: Copia Interna Usuarios GSP Enrolados Reales del Backend -->
          <div class="space-y-2">
            <div class="flex justify-between items-center mb-1">
              <label class="block text-xs text-slate-300 font-black uppercase tracking-wider">Copia Interna Usuarios GSP (Enrolados)</label>
              <span class="text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{{ equipoGSP.length }} Usuarios</span>
            </div>

            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3 max-h-44 overflow-y-auto space-y-2 scrollbar-hide min-h-[100px]">
              <label
                v-for="user in equipoGSP"
                :key="user.email"
                class="flex items-center justify-between p-2 hover:bg-slate-900 rounded-xl text-slate-200 cursor-pointer transition-colors border border-transparent hover:border-slate-800"
              >
                <div class="flex items-center gap-2.5 truncate">
                  <input type="checkbox" :value="user.email" v-model="destinatariosGSP" class="w-4 h-4 accent-amber-500 rounded cursor-pointer" />
                  <span class="font-bold text-white text-xs truncate">{{ user.nombre }}</span>
                </div>
                <span class="text-xs text-amber-400 font-mono ml-2 flex-shrink-0 font-semibold">{{ user.email }}</span>
              </label>

              <div v-if="loadingUsers" class="text-slate-400 italic text-xs text-center py-3">
                ⏳ Cargando usuarios enrolados desde el servidor...
              </div>
              <div v-else-if="equipoGSP.length === 0" class="text-slate-500 italic text-xs text-center py-3">
                Sin usuarios activos enrolados en la base de datos.
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN INFERIOR A ANCHO COMPLETO: SCRIPT COMERCIAL EDITABLE CON TEXTO AMPLIADO -->
        <div class="space-y-3 border-t border-slate-800/80 pt-5">
          <div>
            <label class="block text-xs text-slate-300 font-black uppercase mb-1.5 tracking-wider">Asunto del Correo (Editable) *</label>
            <input
              v-model="asunto"
              type="text"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-bold focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label class="block text-xs text-slate-300 font-black uppercase mb-1.5 tracking-wider">Script Comercial de Propuesta (Editable) *</label>
            <textarea
              v-model="cuerpoMensaje"
              rows="6"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 font-sans text-xs leading-relaxed focus:outline-none focus:border-amber-500 font-medium"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center">
        <span class="text-xs text-slate-400 font-mono">📎 Adjunto: <strong class="text-amber-400 font-bold">{{ versionData?.version_codigo || 'v1.0' }}.pdf</strong></span>
        <div class="flex gap-3">
          <button @click="close" class="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider">Cancelar</button>
          <button
            :disabled="loading || destinatariosCliente.length === 0"
            @click="sendEmail"
            class="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
          >
            <Send v-if="!loading" class="w-4 h-4" />
            <span v-else class="animate-spin text-sm">⏳</span>
            {{ loading ? 'Enviando Correo...' : 'Enviar Cotización por Email' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Mail, Send } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const props = defineProps({
  show: Boolean,
  proyectoId: [Number, String],
  proyecto: Object,
  cliente: Object,
  versionData: Object
})

const emit = defineEmits(['close', 'sent'])

const loading = ref(false)
const loadingUsers = ref(false)
const errorMessage = ref('')
const newEmailInput = ref('')
const destinatariosCliente = ref([])
const destinatariosGSP = ref([])
const asunto = ref('')
const cuerpoMensaje = ref('')
const equipoGSP = ref([])

const fetchEnrolledUsers = async () => {
  loadingUsers.value = true
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
    const rawList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : (data?.usuarios || []))

    if (rawList && rawList.length > 0) {
      let enrolled = rawList.filter(u => u.activo !== false && u.email && u.pass_hash_fes !== null && u.pass_hash_fes !== '')

      if (enrolled.length === 0) {
        enrolled = rawList.filter(u => u.activo !== false && u.email && u.flag_proc_enrol === false)
      }

      const mapped = enrolled.map(u => ({
        nombre: u.nombre_user || `${u.name_frst || ''} ${u.apellido_pat || ''}`.trim() || u.email,
        email: u.email.trim(),
        hasFesPin: !!u.pass_hash_fes
      }))

      if (mapped.length > 0) {
        equipoGSP.value = mapped
        destinatariosGSP.value = mapped.map(u => u.email)
      }
    }
  } catch (err) {
    console.error('Error fetching enrolled users with FES PIN:', err)
  } finally {
    loadingUsers.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    errorMessage.value = ''
    newEmailInput.value = ''
    fetchEnrolledUsers()

    // Auto-cargar correo del cliente
    const emailContacto = props.cliente?.email || props.proyecto?.email_contacto || props.proyecto?.cliente_email || 'sgajardoc@gmail.com'
    destinatariosCliente.value = [emailContacto]

    const codProj = props.proyecto?.codigo_maestro || props.proyecto?.codigo_proyecto || props.proyecto?.codi_proyecto || 'GSP-2607-001'
    const clienteName = props.cliente?.razon_social || props.cliente?.name_empresa || props.proyecto?.razon_social || props.proyecto?.cliente_nombre || 'Cliente Mandante'
    const verCod = props.versionData?.version_codigo || (props.versionData?.version ? `v${props.versionData.version}` : 'v1.0')
    const obra = props.proyecto?.json_field?.crm_v1?.obra_nombre || props.proyecto?.obra_nombre || props.proyecto?.nombre_obra || props.proyecto?.nombre_proyecto || props.proyecto?.body_exec?.nombre_obra || 'Obra Principal'

    asunto.value = `Cotización Grúas San Pablo: ${codProj} - ${clienteName}`
    cuerpoMensaje.value = `Estimado(a) ${clienteName},\n\nJunto con saludar, adjuntamos la propuesta de cotización oficial ${verCod} (Código: ${codProj}) correspondiente al servicio solicitado para la obra "${obra}".\n\nQuedamos atentos a sus comentarios para coordinar los detalles operativos de la faena.\n\nSaludos cordiales,\nEquipo Comercial — Grúas San Pablo`
  }
})

const addEmailCliente = () => {
  if (!newEmailInput.value.trim()) return
  if (!newEmailInput.value.includes('@')) {
    errorMessage.value = 'El correo ingresado no es válido.'
    return
  }
  destinatariosCliente.value.push(newEmailInput.value.trim())
  newEmailInput.value = ''
  errorMessage.value = ''
}

const removeEmailCliente = (idx) => {
  destinatariosCliente.value.splice(idx, 1)
}

const close = () => {
  emit('close')
}

const generateCommercialHtmlEmail = ({ clienteNombre, codProyecto, verCodigo, obraNombre, cuerpoTexto, pdfUrl }) => {
  const formattedBody = (cuerpoTexto || '').replace(/\n/g, '<br>')

  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f1116; border: 1px solid #f59e0b; border-radius: 16px; overflow: hidden; padding: 25px; color: #e2e8f0;"><div style="text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 15px; margin-bottom: 20px;"><h2 style="color: #f59e0b; margin: 0; font-size: 20px;">🏗️ GRÚAS SAN PABLO S.A.</h2><p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">COTIZACIÓN OFICIAL DE SERVICIOS DE IZAJE</p></div><div style="font-size: 14px; line-height: 1.6;"><div style="margin: 15px 0;">${formattedBody}</div><div style="background-color: #14171f; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;"><div style="color: #f59e0b; font-weight: bold; margin-bottom: 5px;">📋 FICHA RESUMEN DE LA COTIZACIÓN</div><div>Código Proyecto: <strong>${codProyecto || 'GSP-2607-001'}</strong></div><div>Versión Documento: <strong>${verCodigo || 'v1.0'}</strong></div><div>Obra / Destino: <strong>${obraNombre || 'Obra Principal'}</strong></div></div>${pdfUrl ? `<div style="text-align: center; margin: 25px 0;"><a href="${pdfUrl}" target="_blank" style="background-color: #f59e0b; color: #020617; font-weight: bold; text-decoration: none; padding: 12px 26px; border-radius: 8px; font-size: 13px; display: inline-block;">📄 DESCARGAR PROPUESTA PDF (${verCodigo || 'v1.0'})</a></div>` : ''}</div><div style="border-top: 1px solid #1e293b; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b; margin-top: 20px;">Grúas San Pablo S.A. | notificaciones.gsp@leanglobal.cl</div></div>`
}

const sendEmail = async () => {
  if (destinatariosCliente.value.length === 0) {
    errorMessage.value = 'Debe especificar al menos un correo del cliente como destinatario.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const rawPdfUrl = props.versionData?.url || ''
    let pdfUrl = ''
    if (rawPdfUrl) {
      if (rawPdfUrl.startsWith('http')) {
        pdfUrl = rawPdfUrl
      } else {
        const cleanPath = rawPdfUrl.startsWith('/lg-gsp') ? rawPdfUrl.replace(/^\/lg-gsp/, '') : rawPdfUrl
        pdfUrl = `https://servidor.leanglobal.cl/lg-gsp${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`
      }
    }
    const codProj = props.proyecto?.codigo_maestro || props.proyecto?.codigo_proyecto || props.proyecto?.codi_proyecto || 'GSP-2607-001'
    const clienteName = props.cliente?.razon_social || props.cliente?.name_empresa || props.proyecto?.razon_social || props.proyecto?.cliente_nombre || 'Cliente Mandante'
    const verCod = props.versionData?.version_codigo || (props.versionData?.version ? `v${props.versionData.version}` : 'v1.0')
    const obra = props.proyecto?.json_field?.crm_v1?.obra_nombre || props.proyecto?.obra_nombre || props.proyecto?.nombre_obra || props.proyecto?.nombre_proyecto || props.proyecto?.body_exec?.nombre_obra || 'Obra Principal'

    const htmlContent = generateCommercialHtmlEmail({
      clienteNombre: clienteName,
      codProyecto: codProj,
      verCodigo: verCod,
      obraNombre: obra,
      cuerpoTexto: cuerpoMensaje.value,
      pdfUrl: pdfUrl
    })

    const cuerpoTextFallback = pdfUrl
      ? `${cuerpoMensaje.value}\n\n--------------------------------------------------\n📄 DESCARGAR PROPUESTA PDF OFICIAL (${verCod}):\n${pdfUrl}\n--------------------------------------------------\n\nSaludos cordiales,\nEquipo Comercial — Grúas San Pablo\nnotificaciones.gsp@leanglobal.cl`
      : cuerpoMensaje.value

    await apiAxios.post('/message', {
      para: destinatariosCliente.value.join(', '),
      cc: destinatariosGSP.value.join(', '),
      asunto: `${asunto.value} [${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}]`,
      cuerpo: htmlContent
    })

    const eventoEnvio = {
      fecha_envio: new Date().toISOString(),
      usuario_envio: 'Sergio Gajardo',
      destinatarios_cliente: [...destinatariosCliente.value],
      destinatarios_cc: [...destinatariosGSP.value]
    }

    emit('sent', eventoEnvio)
    alert(`✉️ Correo comercial formal enviado exitosamente a ${destinatariosCliente.value.join(', ')}.`)
    close()
  } catch (err) {
    console.error('Error al despachar correo:', err)
    errorMessage.value = err.response?.data?.message || 'Error al enviar el correo desde el servidor.'
  } finally {
    loading.value = false
  }
}
</script>
