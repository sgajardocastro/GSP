<template>
  <div class="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans relative selection:bg-amber-500 selection:text-black pb-36">
    <!-- Ambient Glows -->
    <div class="fixed top-[-10%] left-[-10%] w-[60%] h-[40%] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none"></div>
    <div class="fixed bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none"></div>

    <!-- Header Móvil Ejecutivo (Estilo RindeGastos) -->
    <header class="w-full border-b border-white/10 bg-[#0b1120]/95 backdrop-blur-md px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-lg">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-xs font-black uppercase tracking-wider text-white leading-tight">Aprobador Móvil Gerencia</h1>
          <p class="text-[10px] text-slate-400 font-medium">Visación Ejecutiva 1-Toque · {{ tokenData.empresa_emisora_corto || 'Grupo GSP' }}</p>
        </div>
      </div>
      <div v-if="tokenData.folio_referencia" class="text-right">
        <span class="inline-block text-[11px] font-mono font-black bg-amber-500/15 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg">
          {{ tokenData.folio_referencia }}
        </span>
      </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 w-full max-w-xl mx-auto p-4 relative z-10 space-y-4">
      <!-- ESTADO 1: Cargando -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 class="w-9 h-9 text-amber-500 animate-spin" />
        <p class="text-xs text-slate-400 font-semibold">Cargando resumen ejecutivo...</p>
      </div>

      <!-- ESTADO 2: Error o Token Inválido/Expirado -->
      <div v-else-if="errorFatal" class="bg-red-950/40 border border-red-500/30 rounded-2xl p-6 text-center shadow-2xl mt-6">
        <div class="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3 border border-red-500/30">
          <AlertTriangle class="w-7 h-7" />
        </div>
        <h2 class="text-sm font-black text-white uppercase tracking-wider mb-1">Enlace No Disponible</h2>
        <p class="text-xs text-red-200 leading-relaxed mb-4">{{ errorFatal }}</p>
        <p class="text-[11px] text-slate-400">Solicite el reenvío de un nuevo enlace de aprobación desde el CRM, Torre de Control o Adquisiciones.</p>
      </div>

      <!-- CONTENIDO DEL REQUERIMIENTO / OC -->
      <template v-else>
        <!-- BANNER COMPROBANTE SELLADO (Cuando el Token de 1 Solo Uso ya fue consumido) -->
        <div
          v-if="yaResuelto"
          class="rounded-2xl p-5 border shadow-2xl transition-all"
          :class="comprobanteCardClasses"
        >
          <div class="flex items-start gap-3.5">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border" :class="comprobanteIconClasses">
              <CheckCircle2 v-if="tokenData.estado_token === 'APROBADO'" class="w-7 h-7" />
              <AlertCircle v-else-if="tokenData.estado_token === 'APROBADO_CON_OBS'" class="w-7 h-7" />
              <XCircle v-else class="w-7 h-7" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-black/30 border border-white/10">
                  🔒 TOKEN 1 SOLO USO CONSUMIDO
                </span>
                <span class="text-[10px] font-mono text-slate-300">
                  {{ formatDateTime(tokenData.fecha_resolucion) }}
                </span>
              </div>
              <h2 class="text-base font-black uppercase tracking-wide text-white mt-1.5">
                {{ tituloResolucion }}
              </h2>
              <p class="text-xs text-slate-200 mt-0.5">
                Firmado por: <strong class="text-white">{{ tokenData.nombre_aprueba || 'Luis Omar Ghisellini Jara' }}</strong>
              </p>
            </div>
          </div>

          <!-- Observación de Omar Sellada -->
          <div v-if="tokenData.observacion_omar" class="mt-4 bg-black/40 border border-white/15 rounded-xl p-3.5">
            <div class="text-[10px] font-black uppercase tracking-wider text-amber-300 mb-1">
              📝 Instrucción / Observación de Gerencia:
            </div>
            <p class="text-xs font-semibold text-white leading-relaxed">
              "{{ tokenData.observacion_omar }}"
            </p>
          </div>

          <!-- Metadatos Criptográficos FES -->
          <div class="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
            <span>IP: {{ tokenData.ip_resolucion || 'Registrada' }}</span>
            <span v-if="tokenData.firma_hash_fes" class="truncate max-w-[230px]" :title="tokenData.firma_hash_fes">
              FES SHA256: {{ tokenData.firma_hash_fes.slice(0, 20) }}...
            </span>
          </div>
        </div>

        <!-- 1. CABECERA DE CLASIFICACIÓN -->
        <div class="bg-[#0f172a]/95 border border-white/10 rounded-2xl p-4 shadow-xl">
          <div class="flex items-center justify-between gap-2 flex-wrap mb-3">
            <span
              class="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border"
              :class="badgeClasificacion.classes"
            >
              <span>{{ badgeClasificacion.icon }}</span>
              <span>{{ badgeClasificacion.label }}</span>
            </span>

            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10">
              {{ tokenData.empresa_emisora_corto || 'Grúas San Pablo' }}
            </span>
          </div>

          <h2 class="text-sm sm:text-base font-black text-white leading-snug">
            {{ tituloRequerimiento }}
          </h2>

          <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
            <div>
              <span class="text-[10px] uppercase tracking-wider text-slate-400 block">Confirmado por</span>
              <span class="font-bold text-slate-100">{{ tokenData.nombre_solicita || variables.solicitante || 'Operaciones GSP' }}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase tracking-wider text-slate-400 block">Fecha / Hora</span>
              <span class="font-semibold text-slate-200">{{ formatDateTime(tokenData.fecha_creacion) }}</span>
            </div>
          </div>

          <!-- LINKS DIRECTOS A LA COTIZACIÓN Y A LA OT -->
          <div v-if="!esOrdenCompra" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3.5 pt-3.5 border-t border-white/10">
            <a
              v-if="urlCotizacionMostrar && !esRequerimientoInterno"
              :href="urlCotizacionMostrar"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-400/40 text-blue-200 font-black text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              <span>📄</span>
              <span>Ver Cotización (PDF)</span>
            </a>
            <a
              v-if="urlOtMostrar"
              :href="urlOtMostrar"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-black text-xs uppercase tracking-wider transition-all shadow-sm"
              :class="(esRequerimientoInterno || !urlCotizacionMostrar) ? 'sm:col-span-2' : ''"
            >
              <span>🛠️</span>
              <span>Ver Orden de Trabajo / OT (PDF)</span>
            </a>
          </div>
        </div>

        <!-- 2. BLOQUE CLIENTE / PROVEEDOR & CONDICIÓN COMERCIAL -->
        <div class="bg-[#0f172a]/95 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <span class="text-[10px] font-black uppercase tracking-widest text-amber-400">
              {{ esOrdenCompra ? 'Datos del Proveedor y OC' : (esRequerimientoInterno ? 'Ruta y Movimiento Interno' : 'Cliente, Recursos Asignados & Condición') }}
            </span>
            <span
              v-if="esRequerimientoInterno"
              class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30"
            >
              🚫 NO FACTURABLE
            </span>
          </div>

          <!-- Caso OC -->
          <div v-if="esOrdenCompra" class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="bg-black/30 p-3 rounded-xl border border-white/5">
              <span class="text-[10px] text-slate-400 uppercase block">Proveedor</span>
              <span class="font-black text-white text-sm block mt-0.5">{{ ocDetalle.razon_social_proveedor || variables.razon_social_proveedor || 'Proveedor' }}</span>
              <span class="text-[11px] font-mono text-slate-400">RUT: {{ ocDetalle.rut_proveedor || variables.rut_proveedor || '—' }}</span>
            </div>
            <div class="bg-black/30 p-3 rounded-xl border border-white/5">
              <span class="text-[10px] text-slate-400 uppercase block">Condición de Pago & Rubro</span>
              <span class="font-bold text-amber-300 block mt-0.5">{{ ocDetalle.condicion_pago || variables.condicion_pago || 'Crédito 30 días' }}</span>
              <span class="text-[11px] text-slate-300">Rubro ITS: {{ ocDetalle.rubro_its || variables.rubro_its || 'GASTO_EXTRA' }}</span>
            </div>
            <div v-if="ocDetalle.codi_proyecto || variables.folio_proyecto" class="sm:col-span-2 bg-blue-950/30 border border-blue-500/20 p-2.5 rounded-xl flex items-center justify-between">
              <span class="text-[11px] text-blue-300 font-semibold">Imputado a OT / Proyecto:</span>
              <span class="text-xs font-mono font-black text-white">{{ ocDetalle.codi_proyecto || variables.folio_proyecto }}</span>
            </div>
          </div>

          <!-- Caso Requerimiento Interno o Negocio Comercial -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="bg-black/30 p-3 rounded-xl border border-white/5">
              <span class="text-[10px] text-slate-400 uppercase block">{{ esRequerimientoInterno ? 'Tipo Movimiento' : 'Cliente Mandante' }}</span>
              <span class="font-black text-white text-sm block mt-0.5">
                {{ esRequerimientoInterno ? (variables.tipo_movimiento_interno || 'TRASLADO INTERNO').replace(/_/g, ' ') : (variables.cliente_nombre || 'Cliente Mandante') }}
              </span>
              <span class="text-[11px] font-mono text-slate-400">
                {{ esRequerimientoInterno ? 'Centro Costo Propio GSP' : `RUT: ${variables.cliente_rut || '—'}` }}
              </span>
            </div>

            <div class="bg-black/30 p-3 rounded-xl border border-white/5">
              <span class="text-[10px] text-slate-400 uppercase block">Condición de Pago</span>
              <span class="font-bold text-emerald-300 block mt-0.5">
                {{ variables.condicion_pago || 'Crédito 30 días' }}
              </span>
              <span class="text-[11px] text-slate-400">
                {{ variables.requiere_oc_hes ? 'Exige OC / HES previa' : 'Estándar comercial' }}
              </span>
            </div>

            <div class="sm:col-span-2 bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span class="text-[10px] text-slate-400 uppercase block">{{ esRequerimientoInterno ? 'Ruta Origen ➔ Destino' : 'Ubicación Obra / Faena' }}</span>
                <span class="font-bold text-white text-xs">📍 {{ variables.ubicacion_obra || 'Por definir' }}</span>
              </div>
              <div class="sm:text-right">
                <span class="text-[10px] text-slate-400 uppercase block">Fecha / Duración</span>
                <span class="font-semibold text-amber-300 text-xs">{{ variables.fecha_servicio || 'Inmediato' }} · {{ variables.duracion_estimada || '1 jornada' }}</span>
              </div>
            </div>

            <!-- RECURSOS ASIGNADOS EN LA OT (EQUIPOS Y PERSONAS) -->
            <div v-if="equiposAsignadosTexto || personalAsignadoTexto" class="sm:col-span-2 bg-emerald-950/25 border border-emerald-500/30 p-3 rounded-xl space-y-1.5">
              <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                🚜 Recursos Asignados en Orden de Trabajo (OT)
              </span>
              <div v-if="equiposAsignadosTexto" class="text-xs text-white">
                <strong class="text-slate-300">Equipo(s):</strong> {{ equiposAsignadosTexto }}
              </div>
              <div v-if="personalAsignadoTexto" class="text-xs text-white">
                <strong class="text-slate-300">Personal:</strong> {{ personalAsignadoTexto }}
              </div>
            </div>
          </div>
        </div>

        <!-- 3. GRILLA EJECUTIVA DE TARIFAS Y COSTOS (TARJETAS DE ALTO CONTRASTE) -->
        <div class="bg-[#0f172a]/95 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Variables Económicas Clave
            </span>
            <span class="text-[10px] font-mono text-slate-400">Resumen para toma de decisión</span>
          </div>

          <!-- Grilla para Negocio Comercial / Requerimiento Interno -->
          <div v-if="!esOrdenCompra" class="grid grid-cols-2 gap-2.5">
            <!-- Valor Hora -->
            <div class="bg-[#090e1a] border border-white/10 rounded-xl p-3">
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Valor por Hora</span>
              <span class="text-base font-black text-amber-400 block mt-0.5">
                {{ esRequerimientoInterno ? '$0 (Interno)' : `${formatCLP(variables.valor_hora)} / hr` }}
              </span>
              <span class="text-[10px] text-slate-400 block mt-0.5 truncate">
                {{ variables.piso_minimo || '8 hrs mín.' }} · {{ variables.equipo_categoria || 'Equipo GSP' }}
              </span>
            </div>

            <!-- Costo Flete / Traslado -->
            <div class="bg-[#090e1a] border border-white/10 rounded-xl p-3">
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Flete / Traslado</span>
              <span class="text-base font-black text-cyan-400 block mt-0.5">
                {{ formatCLP(variables.costo_flete) }}
              </span>
              <span class="text-[10px] text-slate-400 block mt-0.5 truncate">
                {{ variables.modalidad_flete || 'Estándar' }} ({{ variables.distancia_km || 0 }} km)
              </span>
            </div>

            <!-- Combustible y Viáticos -->
            <div class="bg-[#090e1a] border border-white/10 rounded-xl p-3">
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Combustible / Pensión</span>
              <span class="text-xs font-bold text-white block mt-1">
                ⛽ Comb.: {{ variables.combustible_cargo || 'GSP' }}
              </span>
              <span class="text-[10px] text-slate-300 block mt-0.5">
                🏨 Pensión: {{ variables.alojamiento_viatico_cargo || 'Según cotización' }}
              </span>
            </div>

            <!-- Total Neto del Requerimiento -->
            <div class="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex flex-col justify-between">
              <span class="text-[10px] font-black uppercase text-emerald-300 block">Total Neto Requerimiento</span>
              <span v-if="esRequerimientoInterno" class="text-xs font-black text-amber-300 block mt-1">
                🚫 NO FACTURABLE ($0)
              </span>
              <span v-else class="text-lg font-black text-emerald-400 block mt-0.5">
                {{ formatCLP(tokenData.monto_neto_ref || variables.monto_neto_total) }}
              </span>
              <span class="text-[10px] text-emerald-200/70 block">Valores netos + IVA</span>
            </div>
          </div>

          <!-- Detalle de Líneas para Orden de Compra -->
          <div v-else class="space-y-3">
            <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
              <div
                v-for="(item, idx) in lineasOcMostrar"
                :key="idx"
                class="bg-[#090e1a] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div class="min-w-0 flex-1">
                  <span class="font-bold text-white block truncate">{{ idx + 1 }}. {{ item.descripcion }}</span>
                  <span class="text-[11px] text-slate-400">
                    Cant: {{ Number(item.cantidad || 1) }} {{ item.unidad_medida || 'UN' }} × {{ formatCLP(item.precio_unitario) }}
                  </span>
                </div>
                <div class="text-right font-mono font-bold text-amber-300 shrink-0">
                  {{ formatCLP(item.subtotal_neto ?? (Number(item.cantidad || 1) * Number(item.precio_unitario || 0))) }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
              <div class="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span class="text-[10px] text-slate-400 uppercase block">Monto Neto</span>
                <span class="text-xs font-black text-white">{{ formatCLP(ocDetalle.monto_neto || tokenData.monto_neto_ref) }}</span>
              </div>
              <div class="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span class="text-[10px] text-slate-400 uppercase block">IVA (19%)</span>
                <span class="text-xs font-bold text-slate-300">{{ formatCLP(ocDetalle.monto_iva || Math.round((tokenData.monto_neto_ref || 0) * 0.19)) }}</span>
              </div>
              <div class="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30">
                <span class="text-[10px] text-emerald-300 font-bold uppercase block">Total Bruto</span>
                <span class="text-sm font-black text-emerald-400">{{ formatCLP(ocDetalle.monto_total || Math.round((tokenData.monto_neto_ref || 0) * 1.19)) }}</span>
              </div>
            </div>
          </div>

          <!-- Motivo / Justificación si existe -->
          <div v-if="variables.motivo_solicitud || ocDetalle.glosa_general" class="bg-black/30 border border-white/10 rounded-xl p-3 text-xs">
            <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Justificación / Nota del Solicitante:</span>
            <p class="text-slate-200 leading-relaxed">{{ variables.motivo_solicitud || ocDetalle.glosa_general }}</p>
          </div>
        </div>

        <!-- 4. CAJA DE OBSERVACIONES DE GERENCIA (Con Chips Rápidos en 1 Toque) -->
        <div v-if="!yaResuelto" class="bg-[#0f172a]/95 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-[11px] font-black uppercase tracking-wider text-amber-400">
              💬 Observación / Instrucción de Gerencia (Omar)
            </label>
            <span class="text-[10px] text-slate-400">Toque un chip rápido o escriba</span>
          </div>

          <!-- Chips rápidos 1 toque -->
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="chip in chipsRapidos"
              :key="chip"
              type="button"
              @click="seleccionarChip(chip)"
              class="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all active:scale-95"
              :class="observacionInput === chip
                ? 'bg-amber-500 text-black border-amber-400 font-bold'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'"
            >
              {{ chip }}
            </button>
          </div>

          <textarea
            v-model="observacionInput"
            rows="2"
            placeholder="Escriba aquí una condición comercial, ajuste de tarifa o motivo de rechazo..."
            class="w-full bg-[#070b14] border border-white/15 focus:border-amber-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition-colors"
          ></textarea>

          <p v-if="validationError" class="text-xs font-bold text-red-400 flex items-center gap-1.5">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ validationError }}</span>
          </p>
        </div>
      </template>
    </main>

    <!-- 5. BOTONERA TRIPARTITA ESTILO RINDEGASTOS (FIJA AL PIE DE PANTALLA) -->
    <div
      v-if="!loading && !errorFatal && !yaResuelto"
      class="fixed bottom-0 inset-x-0 z-40 bg-[#0b1120]/95 backdrop-blur-lg border-t border-white/15 p-3 shadow-2xl"
    >
      <div class="max-w-xl mx-auto grid grid-cols-3 gap-2">
        <!-- BOTÓN 1: APROBAR -->
        <button
          type="button"
          :disabled="procesando"
          @click="enviarDecision('APROBADO')"
          class="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/60 border border-emerald-400/40 disabled:opacity-50 transition-all"
        >
          <span class="text-base leading-none">🟢</span>
          <span>APROBAR</span>
        </button>

        <!-- BOTÓN 2: APROBAR CON OBS. -->
        <button
          type="button"
          :disabled="procesando"
          @click="enviarDecision('APROBADO_CON_OBS')"
          class="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/60 border border-amber-300/60 disabled:opacity-50 transition-all"
        >
          <span class="text-base leading-none">🟡</span>
          <span class="text-[10px] sm:text-xs leading-tight text-center">APROBAR CON OBS.</span>
        </button>

        <!-- BOTÓN 3: RECHAZAR -->
        <button
          type="button"
          :disabled="procesando"
          @click="enviarDecision('RECHAZADO')"
          class="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/60 border border-red-400/40 disabled:opacity-50 transition-all"
        >
          <span class="text-base leading-none">🔴</span>
          <span>RECHAZAR</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-vue-next'

const route = useRoute()
const tokenParam = computed(() => String(route.params.token || route.query.token || '').trim())

const loading = ref(true)
const procesando = ref(false)
const errorFatal = ref('')
const validationError = ref('')
const observacionInput = ref('')
const tokenData = ref({})

const resolveApiBase = () => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/lg-gsp-prod')) {
      return 'https://servidor.leanglobal.cl/lg-gsp-prod/api'
    }
    if (window.location.pathname.startsWith('/lg-gsp-dev')) {
      return 'https://servidor.leanglobal.cl/lg-gsp-dev/api'
    }
  }
  return (import.meta.env.VITE_API_URL || 'https://servidor.leanglobal.cl/lg-gsp-dev/api').replace(/\/$/, '')
}

const variables = computed(() => {
  const rv = tokenData.value?.resumen_variables
  if (!rv) return {}
  if (typeof rv === 'string') {
    try { return JSON.parse(rv) } catch (_) { return {} }
  }
  return rv
})

const esOrdenCompra = computed(() => tokenData.value?.tipo_entidad === 'ORDEN_COMPRA')
const esRequerimientoInterno = computed(() => tokenData.value?.tipo_entidad === 'REQUERIMIENTO_INTERNO')
const yaResuelto = computed(() => Boolean(tokenData.value?.ya_utilizado || (tokenData.value?.estado_token && tokenData.value.estado_token !== 'PENDIENTE')))

const urlCotizacionMostrar = computed(() => {
  if (tokenData.value?.url_cotizacion_completa) return tokenData.value.url_cotizacion_completa
  if (tokenData.value?.url_cotizacion) return tokenData.value.url_cotizacion
  if (tokenParam.value) return `${resolveApiBase()}/aprobaciones-gerencia/public/${tokenParam.value}/cotizacion`
  return ''
})

const urlOtMostrar = computed(() => {
  if (tokenData.value?.url_ot_completa) return tokenData.value.url_ot_completa
  if (tokenData.value?.url_ot) return tokenData.value.url_ot
  if (tokenParam.value) return `${resolveApiBase()}/aprobaciones-gerencia/public/${tokenParam.value}/ot`
  return ''
})

const equiposAsignadosTexto = computed(() => {
  if (variables.value?.equipos_asignados_texto) return variables.value.equipos_asignados_texto
  if (Array.isArray(variables.value?.equipos_asignados) && variables.value.equipos_asignados.length > 0) {
    return variables.value.equipos_asignados.map(e => `${e.patente || ''} (${e.nombre_equipo || e.rol || 'Equipo'})`.trim()).join(' · ')
  }
  return ''
})

const personalAsignadoTexto = computed(() => {
  if (variables.value?.personal_asignado_texto) return variables.value.personal_asignado_texto
  if (Array.isArray(variables.value?.personal_asignado) && variables.value.personal_asignado.length > 0) {
    return variables.value.personal_asignado.map(p => `${p.nombre || ''} (${p.rol || 'Tripulante'})`.trim()).join(' · ')
  }
  return ''
})

const ocDetalle = computed(() => {
  if (!esOrdenCompra.value) return {}
  return tokenData.value?.entidad_detalle || variables.value || {}
})

const lineasOcMostrar = computed(() => {
  if (Array.isArray(ocDetalle.value?.lineas) && ocDetalle.value.lineas.length > 0) {
    return ocDetalle.value.lineas
  }
  if (Array.isArray(variables.value?.lineas) && variables.value.lineas.length > 0) {
    return variables.value.lineas
  }
  return []
})

const badgeClasificacion = computed(() => {
  if (esOrdenCompra.value) {
    return {
      icon: '🛒',
      label: 'ORDEN DE COMPRA',
      classes: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    }
  }
  if (esRequerimientoInterno.value) {
    return {
      icon: '🔁',
      label: 'REQUERIMIENTO INTERNO · COSTO PROPIO',
      classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    }
  }
  if (tokenData.value?.es_monetario === false) {
    return {
      icon: '🟣',
      label: 'NEGOCIO NO MONETARIO / ESPECIAL',
      classes: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    }
  }
  return {
    icon: '🟢',
    label: 'NEGOCIO MONETARIO',
    classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  }
})

const tituloRequerimiento = computed(() => {
  if (esOrdenCompra.value) {
    return `Orden de Compra ${tokenData.value.folio_referencia} — ${ocDetalle.value.razon_social_proveedor || variables.value.razon_social_proveedor || 'Proveedor'}`
  }
  if (esRequerimientoInterno.value) {
    return variables.value.nombre_proyecto || `Movimiento Interno: ${variables.value.ubicacion_obra || tokenData.value.folio_referencia}`
  }
  return variables.value.nombre_proyecto || `${variables.value.cliente_nombre || 'Cliente'} — ${variables.value.equipo_categoria || tokenData.value.folio_referencia}`
})

const chipsRapidos = computed(() => {
  if (esOrdenCompra.value) {
    return [
      'OK compra autorizada',
      'Negociar descuento con proveedor',
      'Imputar costo a OT del proyecto',
      'Cotizar segunda alternativa'
    ]
  }
  if (esRequerimientoInterno.value) {
    return [
      'OK traslado interno autorizado',
      'Controlar rendimientos Copec en ruta',
      'Coordinar retorno con carga comercial',
      'Reprogramar fecha de salida'
    ]
  }
  return [
    'OK autorizado',
    'Ajustar tarifa hora',
    'Cobrar flete ida y vuelta',
    'Exigir OC antes de salir'
  ]
})

const tituloResolucion = computed(() => {
  const est = tokenData.value?.estado_token
  if (est === 'APROBADO') return '✅ APROBADO POR GERENCIA'
  if (est === 'APROBADO_CON_OBS') return '⚠️ APROBADO CON OBSERVACIÓN'
  if (est === 'RECHAZADO') return '❌ RECHAZADO POR GERENCIA'
  return `ESTADO: ${est}`
})

const comprobanteCardClasses = computed(() => {
  const est = tokenData.value?.estado_token
  if (est === 'APROBADO') return 'bg-emerald-950/50 border-emerald-500/40'
  if (est === 'APROBADO_CON_OBS') return 'bg-amber-950/50 border-amber-500/40'
  return 'bg-red-950/50 border-red-500/40'
})

const comprobanteIconClasses = computed(() => {
  const est = tokenData.value?.estado_token
  if (est === 'APROBADO') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  if (est === 'APROBADO_CON_OBS') return 'bg-amber-500/20 text-amber-400 border-amber-500/40'
  return 'bg-red-500/20 text-red-400 border-red-500/40'
})

const formatCLP = (val) => {
  const n = Number(val || 0)
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n)
}

const formatDateTime = (dStr) => {
  if (!dStr) return '—'
  try {
    return new Date(dStr).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (_) {
    return String(dStr)
  }
}

const seleccionarChip = (chip) => {
  validationError.value = ''
  observacionInput.value = chip
}

const cargarToken = async () => {
  if (!tokenParam.value) {
    errorFatal.value = 'No se proporcionó un identificador de token válido.'
    loading.value = false
    return
  }

  loading.value = true
  errorFatal.value = ''
  try {
    const apiBase = resolveApiBase()
    const { data } = await axios.get(`${apiBase}/aprobaciones-gerencia/public/${tokenParam.value}`)
    if (data && data.token) {
      tokenData.value = data.token
    } else {
      errorFatal.value = 'No se encontró información asociada a este token.'
    }
  } catch (err) {
    errorFatal.value = err.response?.data?.error || 'El enlace de aprobación no existe o ha expirado.'
  } finally {
    loading.value = false
  }
}

const enviarDecision = async (decision) => {
  validationError.value = ''
  const obs = observacionInput.value.trim()

  if (decision === 'RECHAZADO' && !obs) {
    validationError.value = 'Para rechazar, indique brevemente el motivo o seleccione un chip arriba.'
    return
  }
  if (decision === 'APROBADO_CON_OBS' && !obs) {
    validationError.value = 'Ingrese la observación o condición para aprobar con observación.'
    return
  }

  procesando.value = true
  try {
    const apiBase = resolveApiBase()
    const { data } = await axios.post(`${apiBase}/aprobaciones-gerencia/public/${tokenParam.value}/resolver`, {
      decision,
      observacion: obs || (decision === 'APROBADO' ? 'OK autorizado por Gerencia' : '')
    })

    if (data && data.token) {
      tokenData.value = {
        ...tokenData.value,
        ...data.token,
        ya_utilizado: true
      }
    }
  } catch (err) {
    if (err.response?.status === 409 && err.response?.data?.token) {
      tokenData.value = {
        ...tokenData.value,
        ...err.response.data.token,
        ya_utilizado: true
      }
    } else {
      validationError.value = err.response?.data?.error || 'Error al registrar la decisión. Intente nuevamente.'
    }
  } finally {
    procesando.value = false
  }
}

onMounted(() => {
  cargarToken()
})
</script>
