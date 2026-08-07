<template>
  <!-- Dialog principal de firma -->
  <v-dialog v-model="internalModel" width="1200">
    <v-card>
      <v-card-title class="text-h6">
        Confirmar firma
      </v-card-title>

      <v-card-text>
        <v-row>
          <!-- Columna izquierda: inputs -->
          <v-col cols="12" md="4">
            <!-- Observaciones -->
            <v-textarea
              v-model="observaciones"
              label="Observaciones"
              variant="outlined"
              density="compact"
              rows="2"
              class="mb-4"
            ></v-textarea>

            <!-- Aprueba/Rechaza -->
            <v-radio-group
              v-if="!esPaso1Inspector"
              v-model="decision"
              label="¿Aprueba o Rechaza?"
              class="mb-4"
            >
              <v-radio label="Aprueba" value="APRUEBA"></v-radio>
              <v-radio label="Rechaza" value="RECHAZA"></v-radio>
            </v-radio-group>

            <!-- Mensaje Informativo para el Paso 1 (Inspector) -->
            <div v-else class="mb-4">
              <v-alert
                type="info"
                variant="tonal"
                density="compact"
                :color="tieneDesviacionDerivada ? 'warning' : 'success'"
              >
                <strong>Modo de firma:</strong> 
                {{ tieneDesviacionDerivada ? 'Con Observaciones (Desviación derivada al superior)' : 'Aprueba (Inspección Segura o Cierre in situ)' }}
              </v-alert>
            </div>

            <!-- Motivo de rechazo -->
            <v-select
              v-if="!esPaso1Inspector && decision === 'RECHAZA'"
              v-model="motivoRechazo"
              :items="motivosRechazo"
              item-title="motivo_rechazo"
              item-value="id_motivo_rechazo"
              label="Motivo de Rechazo"
              variant="outlined"
              density="compact"
              class="mb-4"
            />

            <div>Contraseña FES</div>
            <div>
              <v-otp-input
                length="4"
                v-model="passFes"
                type="password"
                inputmode="numeric"
                class="fes-otp-mask"
              ></v-otp-input>
              <a
                href="#"
                class="mt-1"
                @click.prevent="abrirDialogFES"
              >
                ¿Olvidaste tu FES?
              </a>
            </div>

            <br>

            <div v-if="detallesFlujo.length" class="mb-4">
              <div class="text-subtitle-2 mb-1">Estructura de firmas</div>
              <v-table density="compact" class="text-caption">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Rol</th>
                    <th>Firmante</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="st in detallesFlujo"
                    :key="`stp-${st.id_flow_stp}`"
                    :style="pasoActual && st.id_flow_stp === pasoActual.id_flow_stp ? 'background:#e3f2fd;' : ''"
                  >
                    <td>{{ st.flow_tmpl_step_orden ?? '-' }}</td>
                    <td>{{ st.name_rol || '-' }}</td>
                    <td>{{ st.nombre_user || 'Sin asignar' }}</td>
                    <td>{{ estadoPasoLabel(st.estado) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <div class="text-center">
              <v-btn text @click="cerrar">
                Cancelar
              </v-btn>

              <v-btn
                class="ml-2"
                :color="colorBotonFirmar"
                @click="crearFirmaSurvey"
              >
                {{ textoBotonFirmar }}
              </v-btn>
            </div>
          </v-col>

          <!-- Columna derecha: visor PDF -->
          <v-col cols="12" md="8">
            <PdfViewer v-if="pdfUrl" :url="pdfUrl" />
            <div v-else class="text-center">
              No se encontró documento para firmar.
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="justify-end">
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog de loading -->
  <v-dialog v-model="loadingFirma" persistent width="300">
    <v-card color="primary" dark>
      <v-card-text class="text-center">
        <v-progress-circular
          indeterminate
          color="white"
          class="mb-4"
        />
        <div>Procesando firma...</div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <DialogCambiarFES
    v-model="dialogCambiarFes"
    @fes-cambiada="onFesCambiada"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import apiAxios from '@/services/api'
import { v4 as uuidv4 } from 'uuid'
import PdfViewer from '@/components/PdfViewer.vue'
import DialogCambiarFES from '@/components/DialogCambiarFES.vue'
import { useUserDetailStore } from '@/store/userDetail'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  pdfUrl: {
    type: String,
    default: ''
  },
  // flujo completo (con .detalles y opcionalmente .cierreStep)
  detalleFlujo: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'firmado'])

const userDetailStore = useUserDetailStore()
const currentUserId = computed(() => Number(userDetailStore.userDetail?.id_user))

const internalModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const observaciones = ref('')
const decision = ref('APRUEBA')
const motivoRechazo = ref(null)
const motivosRechazo = ref([])
const passFes = ref('')
const trazoFirmaBase64 = ref('')
const loadingFirma = ref(false)
const dialogCambiarFes = ref(false)

const detallesFlujo = computed(() =>
  Array.isArray(props.detalleFlujo?.detalles_flujo)
    ? props.detalleFlujo.detalles_flujo
    : (Array.isArray(props.detalleFlujo?.detalles) ? props.detalleFlujo.detalles : [])
)

// Paso actual a firmar:
// - Si viene cierreStep, usamos ese.
// - Si no, usamos el primer detalle (como en Firmas original).
const pasoActual = computed(() => {
  const flujo = props.detalleFlujo
  if (!flujo) return null

  if (flujo.cierreStep) return flujo.cierreStep

  const detalles = detallesFlujo.value
  if (!detalles.length) return null

  // Prioriza el paso asignado al usuario logueado (firmas individuales).
  const pasoUsuario = detalles.find(det => {
    if (det?.flag_equipo) return false
    const stepUserId = Number(det?.id_user)
    return Number.isFinite(stepUserId) && stepUserId === currentUserId.value
  })
  if (pasoUsuario) return pasoUsuario

  // Si es firma de equipo, usa ese paso.
  const pasoEquipo = detalles.find(det => det?.flag_equipo === true)
  if (pasoEquipo) return pasoEquipo

  // Fallback defensivo
  return detalles[0]
})

const esUltimoPaso = computed(() => {
  if (!pasoActual.value || !detallesFlujo.value.length) return false

  const ordenPasoActual = Number(pasoActual.value.flow_tmpl_step_orden)
  if (!Number.isFinite(ordenPasoActual)) return false

  const ordenMaximo = Math.max(
    ...detallesFlujo.value.map(det => Number(det?.flow_tmpl_step_orden || 0))
  )

  return ordenPasoActual === ordenMaximo
})

const esPasoDelUsuarioLogeado = computed(() => {
  if (!pasoActual.value) return false
  const stepUserId = Number(pasoActual.value?.id_user)
  return Number.isFinite(stepUserId) && stepUserId === currentUserId.value
})

const esUltimoFirmanteUsuario = computed(() =>
  esUltimoPaso.value && esPasoDelUsuarioLogeado.value
)

const colorBotonFirmar = computed(() =>
  esUltimoPaso.value ? 'deep-purple-accent-4' : 'primary'
)

const textoBotonFirmar = computed(() =>
  esUltimoFirmanteUsuario.value ? 'Firmar (Último)' : 'Firmar'
)

const esPaso1Inspector = computed(() => {
  return Number(pasoActual.value?.flow_tmpl_step_orden) === 1
})

const tieneDesviacionDerivada = ref(false)

const verificarDesviacion = async () => {
  const flujo = props.detalleFlujo
  if (!flujo) return
  try {
    const { data } = await apiAxios.get(
      `/servicio/leanglobal/procesosSurveyDetail?id_survey=${flujo.id_survey}`
    )
    const survey = data?.[0]
    if (!survey) return

    const bodyExec = typeof survey.body_exec === 'string'
      ? JSON.parse(survey.body_exec)
      : (survey.body_exec || {})

    const segmentos = Array.isArray(bodyExec.segmentos) ? bodyExec.segmentos : []
    const idTemplate = Number(survey.id_template || flujo.id_template)

    let desviacion = false
    if (idTemplate === 70) {
      for (const seg of segmentos) {
        const attr = (seg.attributes || []).find(a => a.type === 'checkListObservacionConductual')
        if (attr) {
          const d = attr.datos || {}
          desviacion = d.tipoConducta === 'RIESGOSA' && d.cerrarInSitu === 'NO'
          if (desviacion) break
        }
      }
    } else if (idTemplate === 80) {
      for (const seg of segmentos) {
        const attr = (seg.attributes || []).find(a => a.type === 'condicionesSeguridadTrabajo')
        if (attr) {
          const blocks = Array.isArray(attr.blocks) ? attr.blocks : []
          const hasDesviacion = blocks.some(block =>
            block.aplica === 'aplica' &&
            (block.items || []).some(item => item.estado === 'I')
          )
          desviacion = hasDesviacion && attr.cerrarInSitu === 'NO'
          if (desviacion) break
        }
      }
    }
    tieneDesviacionDerivada.value = desviacion
    
    if (pasoActual.value && Number(pasoActual.value.flow_tmpl_step_orden) === 1) {
      if (tieneDesviacionDerivada.value) {
        decision.value = 'CON_OBSERVACIONES'
      } else {
        decision.value = 'APRUEBA'
      }
    }
  } catch (err) {
    console.error('Error al verificar desviacion:', err)
  }
}

onMounted(() => {
  obtenerMotivoRechazo()
})

// Cada vez que se abre el dialog, limpiamos campos y configuramos decision por defecto
watch(
  [() => props.modelValue, pasoActual],
  async ([isOpen]) => {
    if (isOpen) {
      observaciones.value = ''
      passFes.value = ''
      trazoFirmaBase64.value = ''
      motivoRechazo.value = null
      tieneDesviacionDerivada.value = false
      decision.value = 'APRUEBA'
      
      await verificarDesviacion()
    }
  },
  { immediate: true }
)

const obtenerMotivoRechazo = async () => {
  try {
    const response = await apiAxios.get(
      '/servicio/leanglobal/obtnerMotivosRechazo'
    )
    motivosRechazo.value = response.data || []
  } catch (err) {
    console.error('Error al obtener Motivos:', err)
  }
}

async function hashSHA256 (texto) {
  const encoder = new TextEncoder()
  const data = encoder.encode(texto)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

function cerrar () {
  internalModel.value = false
}

function estadoPasoLabel (estado) {
  const e = String(estado || '').toUpperCase()
  if (!e) return 'PENDIENTE'
  return e
}

const abrirDialogFES = () => {
  dialogCambiarFes.value = true
}

const onFesCambiada = () => {
  console.log('✅ FES actualizada (desde PWA FirmaDialog)')
}


const crearFirmaSurvey = async () => {
  try {
    if (!props.detalleFlujo || !pasoActual.value) {
      console.error('❌ No hay flujo/paso para firmar')
      return
    }

    const hash = await hashSHA256(passFes.value)

    if (!decision.value) {
      console.error('❌ Debes seleccionar Aprueba o Rechaza.')
      return
    }

    if (decision.value === 'RECHAZA' && !motivoRechazo.value) {
      console.error('❌ Debes seleccionar un motivo de rechazo.')
      return
    }

    if (!hash || !hash.trim()) {
      console.error('❌ Debes ingresar tu clave FES.')
      return
    }

    const filenameQr = uuidv4() + '.pdf'
    const flujo = props.detalleFlujo
    const paso = pasoActual.value

    let finalDecision = decision.value
    if (decision.value === 'APRUEBA' && tieneDesviacionDerivada.value) {
      if (paso.flag_flow_fin !== true) {
        finalDecision = 'CON_OBSERVACIONES'
      }
    }

    // 1) Actualizar ApprovalExec
    const dataApproval = {
      id_survey: flujo.id_survey,
      nuevaFirma: {
        firma: {
          nombre:
            userDetailStore.userDetail.name_frst + ' ' +
            userDetailStore.userDetail.name_sec + ' ' +
            userDetailStore.userDetail.apellido_pat + ' ' +
            userDetailStore.userDetail.apellido_mat,
          rut: userDetailStore.userDetail.rut,
          rol: paso.name_rol || null,
          fecha: null,
          metodo_autenticacion: 'OTP',
          aprueba_rechaza: finalDecision,
          observaciones: observaciones.value || 'Sin observaciones',
          id_user: userDetailStore.userDetail.id_user,
          ip_firma: 'DESCONOCIDA',
          user_agent: 'DESCONOCIDO',
          geo_latitude: -33.456,
          geo_longitude: -70.648,
          qrUrl: filenameQr,
          firma_img: trazoFirmaBase64.value || null,
          firma_base64: trazoFirmaBase64.value || null
        }
      }
    }

    console.log('✅ Datos para actualizar Approval Exec:', dataApproval)

    loadingFirma.value = true

    await apiAxios.post(
      '/signature/UpdApprovalExec',
      dataApproval
    )

    // 2) Crear registro de firma
    const hashPdfGenerado = 'SHA256_1234567890ABCDEF'
    const codigoValidacion = uuidv4()

    const textMotivo = motivoRechazo.value
      ? (motivosRechazo.value.find(m => m.id_motivo_rechazo === motivoRechazo.value)?.motivo_rechazo || null)
      : null



    const data = {
      tenant_code: 'transmac',
      modulo: 'firmas',
      id_flow_stp: paso.id_flow_stp,
      id_flow: flujo.id_flow,
      id_user: userDetailStore.userDetail.id_user,
      id_doc: paso.id_doc_in,
      hash_pdf: hashPdfGenerado,
      codigo_validacion: codigoValidacion,
      observaciones: observaciones.value,
      aprueba_rechaza: finalDecision,
      id_motivo_rechazo: motivoRechazo.value,
      text_motivo_rechazo: textMotivo,
      geo_latitude: -33.456,
      geo_longitude: -70.648,
      metodo_autenticacion: 'OTP',
      rol: paso.id_rol || null,
      rol_nombre: paso.name_rol || null,
      rut: userDetailStore.userDetail.rut,
      nombre:
        userDetailStore.userDetail.name_frst + ' ' +
        userDetailStore.userDetail.name_sec + ' ' +
        userDetailStore.userDetail.apellido_pat + ' ' +
        userDetailStore.userDetail.apellido_mat,
      id_survey: flujo.id_survey,
      pass_fes: hash,
      filenameQr: filenameQr,
      firma_base64: trazoFirmaBase64.value || null
    }

    console.log('✅ Datos para crear firma:', data)

    await apiAxios.post(
      '/signature/',
      data
    )

    console.log('✅ Firma creada correctamente')


    emit('firmado')          // para que el padre refresque flujos
    internalModel.value = false
  } catch (error) {
    console.error('❌ Error al crear la firma:', error)
    alert(error?.response?.data?.error || 'Error desconocido')
  } finally {
    loadingFirma.value = false
  }
}
</script>

<style scoped>
.fes-otp-mask :deep(input) {
  -webkit-text-security: disc;
  text-security: disc;
}
</style>
