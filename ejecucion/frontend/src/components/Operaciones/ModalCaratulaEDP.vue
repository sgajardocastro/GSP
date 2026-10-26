<template>
  <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-fadeIn">
    <div class="bg-[#0b1021] border border-amber-500/40 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl shadow-black">
      
      <!-- CABECERA -->
      <div class="bg-[#050810] px-6 py-4 border-b border-white/10 flex flex-wrap justify-between items-center gap-3 flex-shrink-0">
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
            📑
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h3 class="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                Carátula de Estado de Pago (EDP) — {{ edpData?.proyecto?.codi_proyecto || 'GSP-OT' }}
              </h3>
              <span 
                :class="esFacturado 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : (habilitadoFacturarInmediato ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40')" 
                class="text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded-md border"
              >
                {{ esFacturado ? '✅ Facturado Conforme' : (habilitadoFacturarInmediato ? '🟢 Habilitado Facturación Inmediata' : etiquetaEstadoFlujoEdp) }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Documento Comercial (Prefactura Cliente) independiente del ITS interno — Circuito de 3 Firmas FES.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="abrirModalPinFes(pasoSugeridoFirma)"
            class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-900/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>🔏</span>
            <span>Firmar Paso {{ pasoSugeridoFirma }} (FES)</span>
          </button>

          <button
            type="button"
            @click="descargarDossierPdf"
            :disabled="descargandoPdf"
            class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white text-xs font-bold border border-red-500/40 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Ver PDF Oficial del EDP"
          >
            <span>📄 {{ descargandoPdf ? 'Generando...' : 'PDF Oficial ↗' }}</span>
          </button>

          <button @click="cerrar" class="text-slate-400 hover:text-white text-2xl p-1 font-bold cursor-pointer transition-colors ml-1">✕</button>
        </div>
      </div>

      <!-- CONTENIDO CON SCROLL -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200" id="caratula-edp-imprimible">

        <!-- CIRCUITO DE 3 HITOS / FIRMAS FES DEL ESTADO DE PAGO + REGLA DE FACTURACIÓN INMEDIATA -->
        <div class="bg-[#070c1a] border border-emerald-500/30 rounded-xl p-4 space-y-4 shadow-lg">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-black uppercase tracking-wider text-emerald-400">
                  ⚡ Circuito Oficial de Estado de Pago (Desacoplado de ITS)
                </span>
                <span
                  :class="requiereOcProyecto ? (tieneOcCargada ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40') : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'"
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                >
                  {{ !requiereOcProyecto ? '✓ No Requiere OC (Facturación Directa)' : (tieneOcCargada ? `✓ Requiere OC — Cargada (${formOC.numero_oc || 'OC'})` : '⚠️ Requiere OC — Pendiente Subir OC') }}
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                1° Control de Gestión (Yara) genera y firma EDP ➔ 2° Contabilidad valida y firma ➔ 3° Comercial firma y envía al Cliente.
              </p>
            </div>

            <!-- Semáforo de Habilitación Inmediata para Facturar -->
            <div
              :class="esFacturado
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                : (habilitadoFacturarInmediato ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-amber-500/15 border-amber-500/40 text-amber-300')"
              class="px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2"
            >
              <span>{{ esFacturado ? '✅ FACTURADO CONFORME' : (habilitadoFacturarInmediato ? '🟢 HABILITADO PARA FACTURAR INMEDIATAMENTE' : (requiereOcProyecto && !tieneOcCargada ? '🟠 ESPERANDO OC DEL CLIENTE PARA FACTURAR' : '⏳ PENDIENTE FIRMA DE VALIDACIÓN EDP')) }}</span>
            </div>
          </div>

          <!-- Alerta si Contabilidad devolvió el EDP con observaciones -->
          <div v-if="flujoEdp?.observacion_devolucion" class="bg-red-950/60 border border-red-500/50 rounded-lg p-3 text-xs text-red-200 flex items-start justify-between gap-3">
            <div>
              <div class="font-bold text-red-300 uppercase font-mono text-[11px]">
                ⚠️ EDP Devuelto con Observaciones por Contabilidad ({{ flujoEdp.observacion_devolucion.nombre_usuario }} — {{ formatearFechaHora(flujoEdp.observacion_devolucion.fecha) }})
              </div>
              <div class="mt-1 text-white">{{ flujoEdp.observacion_devolucion.motivo }}</div>
            </div>
          </div>

          <!-- 3 Tarjetas de Hitos y Estado de Facturación Desacoplado -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <!-- HITO 1: CONTROL DE GESTIÓN (YARA) -->
            <div :class="flujoEdp?.firma_1_analista ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-[#0b1224] border-white/10'" class="border rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-mono font-black text-[11px] uppercase text-amber-400">Hito 1 • Control de Gestión</span>
                  <span v-if="flujoEdp?.firma_1_analista" class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">✓ Firmado FES</span>
                  <span v-else class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">Pendiente</span>
                </div>
                <p class="text-[11px] text-slate-400 mt-1">Verifica 100% de Reports Diarios de faena y libera el EDP con Firma FES.</p>
                <div v-if="flujoEdp?.firma_1_analista" class="mt-2 pt-2 border-t border-white/10 text-[11px] space-y-0.5">
                  <div class="text-white font-bold">{{ flujoEdp.firma_1_analista.nombre_firmante }}</div>
                  <div class="font-mono text-emerald-400 text-[10px]">{{ flujoEdp.firma_1_analista.codigo_fes }}</div>
                  <div class="text-slate-400 text-[10px]">{{ formatearFechaHora(flujoEdp.firma_1_analista.fecha_firma) }}</div>
                </div>
              </div>
              <button
                type="button"
                @click="abrirModalPinFes(1)"
                class="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider cursor-pointer transition-colors"
              >
                {{ flujoEdp?.firma_1_analista ? '🔄 Re-Firmar Hito 1 (Analista)' : '🔏 Validar Reports y Emitir EDP (Yara)' }}
              </button>
            </div>

            <!-- HITO 2: DESPACHO COMERCIAL (RESPONSABLE) -->
            <div :class="flujoEdp?.firma_3_comercial || edpFeriaFirmado ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-[#0b1224] border-white/10'" class="border rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-mono font-black text-[11px] uppercase text-emerald-400">Hito 2 • Comercial</span>
                  <span v-if="flujoEdp?.firma_3_comercial || edpFeriaFirmado" class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">✓ Despachado</span>
                  <span v-else class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">Pendiente Envío</span>
                </div>
                <p class="text-[11px] text-slate-400 mt-1">Visación ejecutiva y despacho formal del dossier al Mandante.</p>
                <div v-if="flujoEdp?.firma_3_comercial || edpFeriaFirmado" class="mt-2 pt-2 border-t border-white/10 text-[11px] space-y-0.5">
                  <div class="text-white font-bold">{{ (flujoEdp?.firma_3_comercial || edpFeriaFirmado).nombre_firmante }}</div>
                  <div class="font-mono text-emerald-400 text-[10px]">{{ (flujoEdp?.firma_3_comercial || edpFeriaFirmado).codigo_fes }}</div>
                  <div class="text-slate-400 text-[10px]">{{ formatearFechaHora((flujoEdp?.firma_3_comercial || edpFeriaFirmado).fecha_firma) }}</div>
                </div>
              </div>
              <button
                type="button"
                @click="abrirModalPinFes(2)"
                :disabled="!flujoEdp?.firma_1_analista"
                class="w-full py-1.5 px-3 rounded-lg font-black text-[11px] uppercase tracking-wider transition-colors"
                :class="!flujoEdp?.firma_1_analista ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'"
              >
                {{ (flujoEdp?.firma_3_comercial || edpFeriaFirmado) ? '🔄 Re-Enviar EDP al Cliente' : '🚀 Firmar y Despachar al Cliente' }}
              </button>
            </div>

            <!-- ESTADO DE FACTURACIÓN (CONTABILIDAD DESACOPLADA) -->
            <div :class="habilitadoFacturarInmediato ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-orange-950/20 border-orange-500/40'" class="border rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-mono font-black text-[11px] uppercase" :class="habilitadoFacturarInmediato ? 'text-emerald-400' : 'text-orange-400'">Facturación Contable</span>
                  <span v-if="esFacturado" class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">DTE Emitido</span>
                  <span v-else-if="habilitadoFacturarInmediato" class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">🟢 Listo para Facturar</span>
                  <span v-else class="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono text-[10px] font-bold">⏳ Falta OC</span>
                </div>
                <p class="text-[11px] text-slate-400 mt-1">Desacople total: Contabilidad factura directamente sin requerir firmas intermedias en el EDP.</p>
                <div class="mt-2 pt-2 border-t border-white/10 text-[11px] space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">Condición OC:</span>
                    <span class="font-mono font-bold" :class="tieneOcCargada ? 'text-emerald-400' : (requiereOcProyecto ? 'text-orange-400' : 'text-slate-300')">
                      {{ tieneOcCargada ? '✓ OC Cargada' : (requiereOcProyecto ? '⚠️ Requiere OC' : 'Exenta OC') }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">Firma Contabilidad:</span>
                    <span class="font-mono text-emerald-400 font-bold">No requerida (SoD)</span>
                  </div>
                </div>
              </div>
              <div class="py-1 px-2.5 rounded-lg bg-white/5 border border-white/10 text-center font-mono text-[10px] text-slate-300">
                {{ habilitadoFacturarInmediato ? '✅ Habilitado en Bandeja "Por Facturar"' : '⏳ En espera de gestión comercial de OC' }}
              </div>
            </div>
          </div>
        </div>

        <!-- BANNER DE GOBERNANZA: TESORERÍA (PAMELA) Y ADMINISTRACIÓN (SERGIO GAJARDO) / MODO SOLO LECTURA KANBAN -->
        <div v-if="soloLectura" class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">ℹ️</span>
            <div>
              <span class="font-bold text-blue-300">Modo Consulta / Auditoría (Kanban):</span>
              <span class="text-slate-300 ml-1">Visualización de tarifas y respaldos en modo solo lectura. La edición de tarifas, carga documental de OC y registro de Facturación DTE se realizan exclusivamente desde la <strong>Torre de Control PMO</strong>.</span>
            </div>
          </div>
          <span class="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg font-mono font-bold text-[10px] uppercase">
            Solo Lectura
          </span>
        </div>
        <div v-else-if="esHabilitadoEdicion" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">⭐</span>
            <div>
              <span class="font-bold text-amber-300">{{ tituloRolHabilitado }}:</span>
              <span class="text-slate-300 ml-1">{{ descripcionRolHabilitado }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button 
              type="button" 
              @click="toggleModoAjusteTesoreria"
              :class="modoAjusteTesoreria ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold'"
              class="px-3.5 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow"
            >
              <span>{{ modoAjusteTesoreria ? '✕ Salir Edición' : '✏️ Ajustar Tarifas / Descuentos' }}</span>
            </button>
            <button
              v-if="modoAjusteTesoreria"
              type="button"
              @click="guardarAjustesTesoreria"
              :disabled="guardandoAjustes"
              class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg font-mono text-xs cursor-pointer transition-colors shadow flex items-center gap-1.5"
            >
              <span>💾</span>
              <span>{{ guardandoAjustes ? 'Guardando...' : 'Guardar Cambios' }}</span>
            </button>
          </div>
        </div>
        <div v-else class="bg-slate-900/60 border border-white/10 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div class="flex items-center gap-2.5">
            <span class="text-lg">🔒</span>
            <span>
              <strong>Gobernanza de EDP:</strong> La edición de tarifas, recargos y notas de descuento es exclusiva de <strong>Tesorería (Pamela)</strong> y <strong>Administración</strong>. Tu perfil opera en modo de solo lectura y certificación FES.
            </span>
          </div>
          <button 
            type="button" 
            @click="abrirModalSolicitudRFC"
            class="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Generar Solicitud de Modificación (RFC) y notificar a Tesorería y Administración por Correo y WhatsApp"
          >
            <span>📝 Solicitar Modificación de EDP</span>
          </button>
        </div>

        <!-- BANDEJA DE REQUERIMIENTOS DE CAMBIO (RFC) PENDIENTES / HISTORIAL -->
        <div v-if="solicitudesAjuste.length > 0" class="bg-[#0f1629] border border-amber-500/30 rounded-xl p-4 space-y-3 shadow-md">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-amber-400 font-bold text-xs uppercase tracking-wider">📬 Requerimientos de Modificación (RFC)</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                {{ solicitudesAjuste.filter(s => s.estado === 'PENDIENTE').length }} Pendientes
              </span>
            </div>
            <button 
              v-if="!esHabilitadoEdicion && !soloLectura"
              @click="abrirModalSolicitudRFC" 
              class="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>+ Nueva Solicitud</span>
            </button>
          </div>

          <div class="space-y-2">
            <div 
              v-for="s in solicitudesAjuste" 
              :key="s.id_solicitud"
              class="bg-[#0a0f1e] border rounded-lg p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
              :class="s.estado === 'PENDIENTE' ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5 opacity-75'"
            >
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span 
                    class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono"
                    :class="s.estado === 'PENDIENTE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' : (s.estado === 'APLICADA' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400')"
                  >
                    {{ s.estado }}
                  </span>
                  <span class="font-bold text-white">{{ s.tipo_modificacion }}</span>
                  <span class="text-slate-400 text-[10px]">• Solicitado por <strong class="text-slate-200">{{ s.nombre_solicitante }}</strong> ({{ s.rol_solicitante }}) el {{ formatearFechaHora(s.fecha_solicitud) }}</span>
                </div>
                <p class="text-slate-300 italic">"{{ s.descripcion }}"</p>
                <div v-if="s.monto_estimado" class="text-emerald-400 font-mono text-[11px] font-bold">
                  Monto Estimado: {{ formatMoneda(s.monto_estimado) }}
                </div>
                <div v-if="s.resuelto_por" class="text-slate-500 text-[10px]">
                  ✓ Resuelto por {{ s.resuelto_por }} el {{ formatearFechaHora(s.fecha_resolucion) }}
                  <span v-if="s.comentario_resolucion"> — {{ s.comentario_resolucion }}</span>
                </div>
              </div>

              <!-- Acciones exclusivas para Pamela / Admin -->
              <div v-if="esHabilitadoEdicion && s.estado === 'PENDIENTE'" class="flex items-center gap-2 shrink-0">
                <button 
                  @click="aplicarRfc(s)"
                  class="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-[11px] transition-colors cursor-pointer"
                  title="Activar modo de edición para atender este ajuste"
                >
                  ✏️ Aplicar Ajuste
                </button>
                <button 
                  @click="resolverRfc(s.id_solicitud, 'APLICADA')"
                  class="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded text-[11px] font-bold transition-colors cursor-pointer"
                  title="Marcar requerimiento como resuelto"
                >
                  ✓ Resuelto
                </button>
                <button 
                  @click="resolverRfc(s.id_solicitud, 'DESCARTADA')"
                  class="px-2 py-1 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 border border-white/10 rounded text-[11px] transition-colors cursor-pointer"
                  title="Descartar solicitud"
                >
                  ✕ Descartar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- BANNER DE FIRMA FES / DESPACHO CONDICIONAL -->
        <div v-if="edpFeriaFirmado" class="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl flex-shrink-0">
              🔏
            </div>
            <div>
              <span class="font-bold text-emerald-300 block text-sm font-mono">EDP Certificado con Firma Electrónica Simple (FES)</span>
              <span class="text-slate-300 block font-mono text-[11px] mt-0.5">
                Firmante: <strong class="text-white">{{ edpFeriaFirmado.nombre_firmante }}</strong> • RUT: {{ edpFeriaFirmado.rut_firmante || 'Enrolado' }} • Código: <strong class="text-emerald-400">{{ edpFeriaFirmado.codigo_fes }}</strong>
              </span>
            </div>
          </div>
          <span class="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md font-mono font-bold text-xs">
            {{ edpFeriaFirmado.estado_despacho === 'INTERNO_PAGO_PREVIO' ? '🏦 EXPEDIENTE INTERNO (PAGO PREVIO)' : '✉️ DESPACHADO AL MANDANTE' }}
          </span>
        </div>
        <div v-else-if="esPagoAnticipado" class="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-lg">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🏦</span>
            <div>
              <span class="font-bold text-emerald-300 block text-sm font-mono">Mandante con Pago Previo / Contado</span>
              <span class="text-slate-300 block mt-0.5">
                El cliente ya efectuó el pago. Este Estado de Pago se valida y firma como respaldo administrativo y contable interno (no se envía cobro al mandante). El flujo avanza directamente a Facturación DTE.
              </span>
            </div>
          </div>
          <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded">
            {{ soloLectura ? 'Firma en PMO' : 'Pendiente Firma FES en Cabecera' }}
          </span>
        </div>
        <div v-else class="bg-blue-950/30 border border-blue-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-lg">
          <div class="flex items-center gap-3">
            <span class="text-2xl">💳</span>
            <div>
              <span class="font-bold text-blue-300 block text-sm font-mono">Mandante con Facturación a Crédito</span>
              <span class="text-slate-300 block mt-0.5">
                Al visar con tu PIN FES comercial, se remitirá la carátula oficial y dossier por correo al mandante ({{ clienteEmail || 'Contacto Mandante' }}) con copia obligatoria (CC) a Gerencia General, Contabilidad y Operaciones.
              </span>
            </div>
          </div>
          <span class="text-xs font-mono text-blue-300 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded">
            {{ soloLectura ? 'Firma en PMO' : 'Pendiente Firma FES en Cabecera' }}
          </span>
        </div>
        
        <!-- MEMBRETE & DATOS DEL MANDANTE -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#080d1a] border border-white/15 rounded-xl p-5 shadow-sm">
          <!-- Datos Emisor GSP -->
          <div class="space-y-1 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4">
            <div class="flex items-center gap-2">
              <span class="text-xl">🏢</span>
              <span class="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">Emisor del Servicio</span>
            </div>
            <h4 class="text-base font-black text-white">ARRIENDO DE GRÚAS SAN PABLO SPA</h4>
            <div class="text-xs text-slate-400 space-y-0.5">
              <div>RUT: <strong class="text-slate-200 font-mono">76.849.230-1</strong></div>
              <div>Giro: Arriendo de Maquinaria y Grúas para la Construcción y Minería</div>
              <div>Teléfono: +56 9 9842 1094 • Temuco, Chile</div>
            </div>
          </div>

          <!-- Datos Cliente Mandante -->
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xl">🏢</span>
              <span class="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">Cliente Mandante</span>
            </div>
            <h4 class="text-base font-black text-white">{{ edpData?.proyecto?.cliente_nombre || 'Cliente Mandante' }}</h4>
            <div class="text-xs text-slate-400 space-y-0.5">
              <div>RUT: <strong class="text-slate-200 font-mono">{{ edpData?.proyecto?.cliente_rut || 'S/R' }}</strong></div>
              <div>Faena / Obra: <strong class="text-slate-200">{{ edpData?.proyecto?.obra_nombre || 'En Terreno' }}</strong></div>
              <div class="truncate">Ubicación: {{ edpData?.proyecto?.obra_direccion || 'Faena' }}</div>
              <div>Condición de Pago: <strong class="text-amber-300 font-mono">{{ formaPagoTexto }}</strong></div>
            </div>
          </div>
        </div>

        <!-- TARJETAS TOTALES DE COBRO -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-1">
            <span class="text-xs text-slate-400 font-bold uppercase font-mono block">Días Operados</span>
            <div class="text-2xl font-black font-mono text-white">
              {{ edpData?.resumen_financiero?.dias_totales || 0 }} <span class="text-xs text-slate-400 font-normal">DÍAS</span>
            </div>
            <span class="text-xs text-emerald-400 block font-medium">100% Respaldados</span>
          </div>

          <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-1">
            <span class="text-xs text-slate-400 font-bold uppercase font-mono block">Horas Facturables</span>
            <div class="text-2xl font-black font-mono text-white">
              {{ edpData?.resumen_financiero?.horas_facturables_totales || 0 }} <span class="text-xs text-slate-400 font-normal">HRS</span>
            </div>
            <span class="text-xs text-slate-400 block">Netas a cobrar</span>
          </div>

          <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-1">
            <span class="text-xs text-slate-400 font-bold uppercase font-mono block">Sobretiempo Extra</span>
            <div class="text-2xl font-black font-mono text-yellow-400">
              +{{ edpData?.resumen_financiero?.horas_sobretiempo_totales || 0 }} <span class="text-xs text-yellow-500 font-normal">HRS</span>
            </div>
            <span class="text-xs text-slate-400 block font-mono">{{ formatMoneda(edpData?.resumen_financiero?.monto_sobretiempo_neto) }}</span>
          </div>

          <div class="bg-amber-950/20 border border-amber-500/50 rounded-xl p-4 space-y-1 shadow-lg shadow-amber-500/5">
            <span class="text-xs text-amber-300 font-black uppercase font-mono block">💰 TOTAL NETO A COBRAR</span>
            <div class="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              {{ formatMoneda(totalNetoCalculado) }}
            </div>
            <span class="text-xs text-slate-300 block font-mono">Total Bruto: {{ formatMoneda(totalBrutoCalculado) }}</span>
          </div>
        </div>

        <!-- TABLA DE DESGLOSE DE LÍNEAS COTIZADAS Y CONCILIADAS -->
        <div class="bg-[#050810] border border-white/15 rounded-xl overflow-hidden shadow-md">
          <div class="px-4 py-3 bg-[#080d1a] border-b border-white/10 flex justify-between items-center">
            <h5 class="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>📋 Detalle de Servicios & Tarifas Conciliadas</span>
            </h5>
            <span v-if="modoAjusteTesoreria" class="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded">
              MODO EDICIÓN TESORERÍA ACTIVO
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr class="bg-[#0b1021] text-slate-300 border-b border-white/10 font-bold uppercase font-mono">
                  <th class="py-2.5 px-3.5">Línea / Concepto</th>
                  <th class="py-2.5 px-3.5">Categoría</th>
                  <th class="py-2.5 px-3 text-center">Unidad</th>
                  <th class="py-2.5 px-3 text-center">Cant.</th>
                  <th class="py-2.5 px-3.5 text-right">Tarifa Pactada</th>
                  <th class="py-2.5 px-3.5 text-right text-amber-400">Subtotal Neto</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10 text-slate-200">
                <tr v-for="(l, idx) in lineasEditables" :key="idx" class="hover:bg-white/[0.02]">
                  <td class="py-3 px-3.5 font-bold text-white">
                    {{ l.descripcion || l.subcategoria || l.tipo }}
                  </td>
                  <td class="py-3 px-3.5 text-slate-400 font-mono">
                    {{ l.tipo }}
                  </td>
                  <td class="py-3 px-3 text-center font-mono text-slate-300">
                    {{ l.unidad }}
                  </td>
                  <td class="py-3 px-3 text-center font-mono font-bold text-white">
                    {{ l.cantidad }}
                  </td>
                  <td class="py-3 px-3.5 text-right font-mono text-slate-300">
                    <input 
                      v-if="modoAjusteTesoreria"
                      v-model.number="l.valorUnitario"
                      type="number"
                      class="w-28 bg-[#080d1a] border border-amber-500/50 rounded px-2 py-1 text-right text-white font-mono outline-none focus:border-amber-400"
                    />
                    <span v-else>{{ formatMoneda(l.valorUnitario) }}</span>
                  </td>
                  <td class="py-3 px-3.5 text-right font-mono font-bold text-amber-300">
                    {{ formatMoneda(calcularSubtotalLinea(l)) }}
                  </td>
                </tr>

                <!-- Fila de Sobretiempos si aplica -->
                <tr v-if="Number(edpData?.resumen_financiero?.horas_sobretiempo_totales) > 0" class="bg-yellow-500/5">
                  <td class="py-3 px-3.5 font-bold text-yellow-300">
                    ⏱️ Sobretiempo de Izaje en Terreno
                  </td>
                  <td class="py-3 px-3.5 text-slate-400 font-mono">
                    HORAS EXTRA
                  </td>
                  <td class="py-3 px-3 text-center font-mono text-slate-300">
                    Horas
                  </td>
                  <td class="py-3 px-3 text-center font-mono font-bold text-yellow-300">
                    {{ edpData?.resumen_financiero?.horas_sobretiempo_totales }}h
                  </td>
                  <td class="py-3 px-3.5 text-right font-mono text-slate-300">
                    Tarifa Recargo
                  </td>
                  <td class="py-3 px-3.5 text-right font-mono font-bold text-yellow-300">
                    {{ formatMoneda(edpData?.resumen_financiero?.monto_sobretiempo_neto) }}
                  </td>
                </tr>

                <!-- Fila de Descuento de Tesorería si aplica -->
                <tr v-if="modoAjusteTesoreria || descuentoTesoreria > 0" class="bg-red-500/5">
                  <td class="py-3 px-3.5 font-bold text-red-300">
                    🔻 Descuento / Ajuste Especial (Tesorería)
                  </td>
                  <td colspan="3" class="py-3 px-3.5 text-slate-400 font-mono">
                    <input 
                      v-if="modoAjusteTesoreria"
                      v-model="motivoDescuentoTesoreria"
                      type="text"
                      placeholder="Motivo del ajuste o descuento..."
                      class="w-full bg-[#080d1a] border border-red-500/40 rounded px-2 py-1 text-white text-xs outline-none"
                    />
                    <span v-else>{{ motivoDescuentoTesoreria || 'Ajuste comercial aplicado' }}</span>
                  </td>
                  <td class="py-3 px-3.5 text-right font-mono text-slate-400">
                    Monto Descuento:
                  </td>
                  <td class="py-3 px-3.5 text-right font-mono font-bold text-red-400">
                    <input 
                      v-if="modoAjusteTesoreria"
                      v-model.number="descuentoTesoreria"
                      type="number"
                      placeholder="0"
                      class="w-28 bg-[#080d1a] border border-red-500/50 rounded px-2 py-1 text-right text-red-300 font-mono outline-none"
                    />
                    <span v-else>-{{ formatMoneda(descuentoTesoreria) }}</span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-[#0b1021] text-slate-200 border-t-2 border-white/20 font-mono font-bold">
                  <td colspan="5" class="py-2.5 px-3.5 text-right text-slate-400 uppercase">SUBTOTAL NETO:</td>
                  <td class="py-2.5 px-3.5 text-right text-white font-black">{{ formatMoneda(totalNetoCalculado) }}</td>
                </tr>
                <tr class="bg-[#0b1021] text-slate-200 font-mono">
                  <td colspan="5" class="py-1.5 px-3.5 text-right text-slate-400 uppercase">IVA (19%):</td>
                  <td class="py-1.5 px-3.5 text-right text-slate-300">{{ formatMoneda(ivaCalculado) }}</td>
                </tr>
                <tr class="bg-[#080d1a] text-amber-400 font-mono font-black text-sm border-t border-amber-500/30">
                  <td colspan="5" class="py-2.5 px-3.5 text-right uppercase">TOTAL GENERAL A FACTURAR (BRUTO):</td>
                  <td class="py-2.5 px-3.5 text-right text-amber-300 text-base">{{ formatMoneda(totalBrutoCalculado) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- RESUMEN DE FIRMAS Y RESPALDOS DE TERRENO -->
        <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-3">
          <h5 class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>✍️ Respaldos de Terreno Firmados por el Mandante ({{ edpData?.reports_validados?.length || 0 }} Jornadas)</span>
          </h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div 
              v-for="rep in edpData?.reports_validados || []" 
              :key="rep.id_reporte_avance"
              class="bg-[#080d1a] border border-white/10 rounded-lg p-3 space-y-2"
            >
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-amber-400 font-mono">Día {{ rep.dia_correlativo }} • {{ formatearFecha(rep.fecha_reporte) }}</span>
                <span class="text-emerald-400 font-mono font-bold">{{ rep.horas_facturables }} hrs</span>
              </div>
              <div class="text-[11px] text-slate-400">
                Grúa: <strong class="text-slate-200 font-mono">{{ rep.equipo_patente }}</strong> ({{ rep.equipo_modelo }})
              </div>
              <!-- Miniatura Firma -->
              <div class="bg-white rounded p-1 flex items-center justify-center h-16 overflow-hidden">
                <img 
                  v-if="rep.cliente_firma_canvas_base64" 
                  :src="rep.cliente_firma_canvas_base64" 
                  alt="Firma Mandante" 
                  class="max-h-full object-contain filter contrast-125"
                />
                <span v-else class="text-slate-400 text-xs italic">Sin imagen de firma</span>
              </div>
              <div class="text-[10px] text-slate-400 text-center truncate">
                Firmó: <strong class="text-slate-200">{{ rep.cliente_nombre || 'Mandante' }}</strong> ({{ rep.cliente_cargo || 'Supervisor' }})
              </div>
            </div>
          </div>
        </div>

        <!-- MÓDULO: SOPORTE DOCUMENTAL - ORDEN DE COMPRA (OC) Y FACTURACIÓN OFICIAL (Spec 60 / REQ-038) -->
        <div class="bg-[#0b1021] border border-blue-500/30 rounded-xl p-5 space-y-4 shadow-xl">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">📑</span>
              <div>
                <h4 class="text-sm font-black text-white uppercase tracking-wider">Soporte Documental: Orden de Compra (OC) y Facturación</h4>
                <p class="text-[11px] text-slate-400">Adjunta la Orden de Compra del mandante y el PDF de la Factura oficial emitida.</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span 
                v-if="esFacturado" 
                class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-bold flex items-center gap-1"
              >
                <span>✓</span>
                <span>OT FACTURADA</span>
              </span>
              <span 
                v-else-if="formOC.numero_oc" 
                class="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono text-[11px] font-bold"
              >
                OC INGRESADA
              </span>
              <span 
                v-else 
                class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-bold"
              >
                PENDIENTE OC / FACTURA
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            <!-- BLOQUE 1: ORDEN DE COMPRA (OC / HES MANDANTE) — HABILITADO PARA COMERCIAL Y CONTABILIDAD -->
            <div class="bg-[#050810] border border-white/10 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span>📄</span>
                  <span>1. Orden de Compra (OC / HES) — Carga Comercial</span>
                </span>
                <button
                  type="button"
                  @click="asumirSinOcModal"
                  class="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition-colors cursor-pointer"
                  title="Marcar cliente sin OC formal y asumir el monto del EDP"
                >
                  ⚖️ Sin OC (Asumir EDP)
                </button>
              </div>

              <!-- FORMULARIO CARGA OC (Siempre habilitado para Comercial y PMO) -->
              <div class="space-y-2.5">
                <div>
                  <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">N° Orden de Compra / HES Mandante *</label>
                  <input
                    v-model="formOC.numero_oc"
                    type="text"
                    placeholder="ej. OC-7748 o HES-9921"
                    class="w-full bg-[#080d1a] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-400"
                  />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Fecha Emisión OC</label>
                    <input
                      v-model="formOC.fecha_emision"
                      type="date"
                      class="w-full bg-[#080d1a] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Monto Neto OC ($)</label>
                    <input
                      v-model.number="formOC.monto_neto"
                      type="number"
                      placeholder="0"
                      class="w-full bg-[#080d1a] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <!-- Adjunto de OC -->
                <div>
                  <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Archivo Adjunto de la OC (PDF o Imagen)</label>
                  <input 
                    type="file" 
                    ref="fileInputOC" 
                    @change="onArchivoOCSeleccionado" 
                    accept=".pdf,.png,.jpg,.jpeg" 
                    class="hidden" 
                  />
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      @click="triggerFileInputOC"
                      :disabled="subiendoArchivoOC"
                      class="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>📎</span>
                      <span>{{ subiendoArchivoOC ? 'Subiendo...' : (formOC.archivo ? 'Cambiar Adjunto OC' : 'Subir Archivo OC') }}</span>
                    </button>
                    
                    <div v-if="formOC.archivo" class="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 max-w-[220px]">
                      <a 
                        :href="getUrlArchivoAdjunto(formOC.archivo)" 
                        target="_blank" 
                        class="text-blue-400 hover:underline truncate font-mono text-[11px]" 
                        :title="formOC.archivo.nombre"
                      >
                        📄 {{ formOC.archivo.nombre }}
                      </a>
                      <button 
                        type="button" 
                        @click="formOC.archivo = null" 
                        class="text-slate-400 hover:text-red-400 text-xs font-bold ml-1 cursor-pointer"
                        title="Quitar archivo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-[10px] text-blue-300">
                  📩 Al guardar la OC, el sistema envía automáticamente una copia y constancia formal de recepción a <strong>Contabilidad</strong>.
                </div>

                <div class="pt-1 flex justify-end">
                  <button
                    type="button"
                    @click="guardarOcDirecta"
                    :disabled="guardandoOC || !formOC.numero_oc"
                    class="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <span>💾</span>
                    <span>{{ guardandoOC ? 'Enviando a Contabilidad...' : 'Guardar OC y Enviar a Contabilidad' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- BLOQUE 2: FACTURA ELECTRÓNICA (DTE ERP) -->
            <div class="bg-[#050810] border border-white/10 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span>🧾</span>
                  <span>2. Factura Electrónica (DTE)</span>
                </span>
                <span v-if="esFacturado" class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Registrada
                </span>
              </div>

              <!-- MODO EDICIÓN PMO -->
              <div v-if="!soloLectura" class="space-y-2.5">
                <div>
                  <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">N° de Factura Emitida *</label>
                  <input
                    v-model="formFactura.factura_numero"
                    type="text"
                    placeholder="ej. 14250"
                    class="w-full bg-[#080d1a] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-emerald-400"
                  />
                </div>

                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Fecha Factura</label>
                    <input
                      v-model="formFactura.fecha_facturacion"
                      type="date"
                      class="w-full bg-[#080d1a] border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Monto Neto ($)</label>
                    <input
                      v-model.number="formFactura.monto_neto"
                      type="number"
                      class="w-full bg-[#080d1a] border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Monto Bruto ($)</label>
                    <input
                      v-model.number="formFactura.monto_bruto"
                      type="number"
                      class="w-full bg-[#080d1a] border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <!-- Adjunto de Factura -->
                <div>
                  <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Archivo Adjunto de la Factura (PDF)</label>
                  <input 
                    type="file" 
                    ref="fileInputFactura" 
                    @change="onArchivoFacturaSeleccionado" 
                    accept=".pdf,.png,.jpg,.jpeg" 
                    class="hidden" 
                  />
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      @click="triggerFileInputFactura"
                      :disabled="subiendoArchivoFactura"
                      class="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>📎</span>
                      <span>{{ subiendoArchivoFactura ? 'Subiendo...' : (formFactura.archivo ? 'Cambiar Factura PDF' : 'Subir Factura PDF') }}</span>
                    </button>
                    
                    <div v-if="formFactura.archivo" class="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 max-w-[220px]">
                      <a 
                        :href="getUrlArchivoAdjunto(formFactura.archivo)" 
                        target="_blank" 
                        class="text-emerald-400 hover:underline truncate font-mono text-[11px]" 
                        :title="formFactura.archivo.nombre"
                      >
                        📄 {{ formFactura.archivo.nombre }}
                      </a>
                      <button 
                        type="button" 
                        @click="formFactura.archivo = null" 
                        class="text-slate-400 hover:text-red-400 text-xs font-bold ml-1 cursor-pointer"
                        title="Quitar archivo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Observaciones de Facturación</label>
                  <input
                    v-model="formFactura.observaciones"
                    type="text"
                    placeholder="ej. Facturado vía Laudus ERP, crédito 30 días..."
                    class="w-full bg-[#080d1a] border border-white/15 rounded-lg px-3 py-1 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div class="pt-1 flex justify-end gap-2">
                  <button
                    type="button"
                    @click="guardarFacturaYConcluir(false)"
                    :disabled="guardandoFactura || !formFactura.factura_numero"
                    class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    title="Guardar datos de la factura sin concluir la OT"
                  >
                    Guardar Datos
                  </button>
                  <button
                    type="button"
                    @click="guardarFacturaYConcluir(true)"
                    :disabled="guardandoFactura || !formFactura.factura_numero"
                    class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <span>🏁</span>
                    <span>{{ guardandoFactura ? 'Registrando...' : (esFacturado ? 'Actualizar Factura' : 'Declarar Facturado & Concluir') }}</span>
                  </button>
                </div>
              </div>

              <!-- MODO SOLO LECTURA KANBAN -->
              <div v-else class="space-y-3">
                <div v-if="formFactura.factura_numero" class="space-y-2">
                  <div class="flex justify-between items-center bg-[#080d1a] border border-white/5 rounded-lg p-2.5">
                    <div>
                      <span class="text-[10px] text-slate-400 font-bold block uppercase font-mono">N° Factura Emitida</span>
                      <span class="text-sm font-mono font-black text-emerald-400">F-{{ formFactura.factura_numero }}</span>
                    </div>
                    <div v-if="formFactura.monto_neto || formFactura.monto_bruto">
                      <span class="text-[10px] text-slate-400 font-bold block uppercase text-right font-mono">Total Facturado</span>
                      <span class="text-xs font-mono font-bold text-emerald-300">{{ formatMoneda(formFactura.monto_bruto || formFactura.monto_neto) }}</span>
                    </div>
                  </div>
                  <div v-if="formFactura.fecha_facturacion" class="text-[11px] text-slate-400">
                    Fecha Facturación: <strong class="text-slate-300 font-mono">{{ formFactura.fecha_facturacion }}</strong>
                  </div>
                  <div v-if="formFactura.observaciones" class="text-[11px] text-slate-400 italic">
                    "{{ formFactura.observaciones }}"
                  </div>
                  <div v-if="formFactura.archivo" class="pt-1">
                    <a :href="getUrlArchivoAdjunto(formFactura.archivo)" target="_blank" class="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 no-underline transition-colors">
                      <span>🧾 Ver DTE Factura (PDF)</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
                <div v-else class="py-5 text-center text-slate-500 italic text-xs">
                  Pendiente de facturación contable. Emisión y registro DTE administrados en PMO.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER ACCIONES -->
      <div class="bg-[#050810] px-6 py-4 border-t border-white/10 flex justify-between items-center flex-shrink-0">
        <div class="text-xs text-slate-400">
          Documento válido para tramitación de HES y Facturación Electrónica.
        </div>
        <div class="flex items-center gap-3">
          <button 
            @click="descargarDossierPdf" 
            :disabled="descargandoPdf"
            class="px-3.5 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white text-xs font-bold border border-red-500/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>📄 {{ descargandoPdf ? 'Generando PDF...' : 'PDF Oficial ↗' }}</span>
          </button>
          <button 
            @click="cerrar" 
            class="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

    </div>

    <!-- SUBMODAL FIRMA PIN FES (CIRCUITO 3 PASOS EDP) -->
    <div v-if="modalFesAbierto" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="bg-[#080d1a] border border-blue-500/40 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl text-slate-200">
        <div class="flex justify-between items-center border-b border-white/10 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🔏</span>
            <div>
              <h4 class="text-base font-black text-white font-mono uppercase">Firma Electrónica Simple (FES)</h4>
              <p class="text-xs text-emerald-400 font-bold">{{ tituloPasoFirmaActual }}</p>
            </div>
          </div>
          <button @click="modalFesAbierto = false" class="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-mono font-bold uppercase text-slate-300 block">
            Ingresa tu PIN FES de 4 Dígitos
          </label>
          <div class="flex justify-center gap-3">
            <input
              v-for="i in 4"
              :key="i"
              :ref="el => pinInputs[i - 1] = el"
              v-model="pinDigits[i - 1]"
              type="password"
              maxlength="1"
              @input="onPinInput(i - 1, $event)"
              @keydown.backspace="onPinBackspace(i - 1, $event)"
              class="w-12 h-14 bg-[#050810] border-2 border-white/20 focus:border-blue-400 rounded-xl text-center text-2xl font-black text-white font-mono outline-none"
            />
          </div>
          <span v-if="pinError" class="text-xs text-red-400 font-mono text-center block">
            {{ pinError }}
          </span>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-mono text-slate-400 block">Observaciones / Notas de Despacho (Opcional)</label>
          <input
            v-model="observacionesFirma"
            type="text"
            placeholder="ej. Aprobado conforme para emisión de factura..."
            class="w-full bg-[#050810] border border-white/20 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-400"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="modalFesAbierto = false"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="procesarFirmaComercial"
            :disabled="procesandoFirma || pinDigits.join('').length < 4"
            class="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
          >
            <span>{{ procesandoFirma ? 'Certificando...' : 'Confirmar Firma' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- SUBMODAL: SOLICITUD DE MODIFICACIÓN DE EDP (RFC) (Spec 59 / REQ-037) -->
    <div v-if="modalSolicitudRfcAbierto" class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div class="bg-[#0b1021] border border-amber-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
        <div class="flex justify-between items-start border-b border-white/10 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl">📝</span>
              <h3 class="text-base font-black text-white uppercase tracking-wider">Solicitud de Modificación en EDP</h3>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              {{ edpData?.proyecto?.codi_proyecto || 'OT' }} — {{ edpData?.proyecto?.cliente_nombre || 'Mandante' }}
            </p>
          </div>
          <button @click="modalSolicitudRfcAbierto = false" class="text-slate-400 hover:text-white text-xl font-bold cursor-pointer">✕</button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Tipo de Modificación -->
          <div>
            <label class="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
              Tipo de Ajuste Requerido *
            </label>
            <select 
              v-model="formRfc.tipo_modificacion"
              class="w-full bg-[#050810] border border-white/20 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="Tarifa / Precio Unitario">Tarifa / Precio Unitario (Grúa, Camión, Equipos)</option>
              <option value="Jornadas / Horas Faena">Jornadas / Horas Faena / Sobretiempos</option>
              <option value="Fletes y Traslados">Fletes y Traslados de Faena</option>
              <option value="Descuento Comercial">Descuento Comercial / Liquidación Especial</option>
              <option value="Otro Requerimiento Financiero">Otro Requerimiento Financiero</option>
            </select>
          </div>

          <!-- Detalle / Justificación -->
          <div>
            <label class="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
              Detalle y Justificación del Cambio *
            </label>
            <textarea 
              v-model="formRfc.descripcion"
              rows="4"
              placeholder="Explica qué tarifa o valor se debe modificar y por qué motivo (ej. 'Favor aplicar descuento de $50.000 pactado con cliente por espera de portón o ajustar horas grúa 70T de $90.000 a $85.000')..."
              class="w-full bg-[#050810] border border-white/20 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-400 resize-none"
            ></textarea>
          </div>

          <!-- Monto Estimado -->
          <div>
            <label class="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
              Monto Estimado del Ajuste o Descuento ($ Neto - Opcional)
            </label>
            <input 
              v-model.number="formRfc.monto_estimado"
              type="number"
              placeholder="ej. 50000"
              class="w-full bg-[#050810] border border-white/20 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
            />
          </div>

          <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-[11px] text-blue-300 flex items-start gap-2">
            <span>ℹ️</span>
            <span>Al enviar este requerimiento, se notificará de inmediato a <strong>Pamela Seguel (Gerente de Tesorería)</strong> y <strong>Sergio Gajardo (Administrador)</strong> vía <strong>Email Transaccional</strong> y <strong>WhatsApp</strong> con un enlace directo a este EDP.</span>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="modalSolicitudRfcAbierto = false"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="enviarSolicitudModificacion"
            :disabled="enviandoRfc || !formRfc.descripcion.trim()"
            class="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <span>{{ enviandoRfc ? 'Enviando...' : '🚀 Enviar a Tesorería y Administración' }}</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import apiAxios from '../../services/api'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  edpData: {
    type: Object,
    default: () => ({})
  },
  soloLectura: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'edp-actualizado'])

const descargandoPdf = ref(false)
const modoAjusteTesoreria = ref(false)
const guardandoAjustes = ref(false)
const lineasEditables = ref([])
const descuentoTesoreria = ref(0)
const motivoDescuentoTesoreria = ref('')

// Requerimientos de Modificación (RFC de EDP) (Spec 59 / REQ-037)
const modalSolicitudRfcAbierto = ref(false)
const formRfc = ref({
  tipo_modificacion: 'Tarifa / Precio Unitario',
  descripcion: '',
  monto_estimado: null
})
const enviandoRfc = ref(false)

const abrirModalSolicitudRFC = () => {
  formRfc.value = {
    tipo_modificacion: 'Tarifa / Precio Unitario',
    descripcion: '',
    monto_estimado: null
  }
  modalSolicitudRfcAbierto.value = true
}

// Soporte Documental: OC y Factura (Spec 60 / REQ-038)
const fileInputOC = ref(null)
const subiendoArchivoOC = ref(false)
const guardandoOC = ref(false)
const formOC = ref({
  numero_oc: '',
  fecha_emision: new Date().toISOString().split('T')[0],
  monto_neto: 0,
  archivo: null,
  observaciones: ''
})

const fileInputFactura = ref(null)
const subiendoArchivoFactura = ref(false)
const guardandoFactura = ref(false)
const formFactura = ref({
  factura_numero: '',
  fecha_facturacion: new Date().toISOString().split('T')[0],
  monto_neto: 0,
  monto_bruto: 0,
  archivo: null,
  observaciones: ''
})

// FES Circuito 3 Hitos EDP
const modalFesAbierto = ref(false)
const pasoFirmaSeleccionado = ref(1)
const pinDigits = ref(['', '', '', ''])
const pinInputs = ref([])
const pinError = ref('')
const observacionesFirma = ref('')
const procesandoFirma = ref(false)

const currentUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
})

// Validación de rol Administrador (Sergio Gajardo / Admin) (Spec 59 / REQ-037)
const esAdminGlobal = computed(() => {
  const u = currentUser.value
  const email = (u.email || '').toLowerCase()
  const rol = (u.name_rol || u.rol || '').toLowerCase()
  const idRol = Number(u.id_rol)
  return email.includes('sgajardo') || email.includes('admin') || idRol === 1 || rol.includes('admin') || Boolean(u.es_admin) || Boolean(u.isAdmin)
})

// Validación de rol Pamela / Tesorería (Spec 57 / REQ-028)
const esPamelaTesoreria = computed(() => {
  const u = currentUser.value
  const nombre = `${u.name_frst || ''} ${u.apellido_pat || ''}`.toLowerCase()
  const email = (u.email || '').toLowerCase()
  const rol = (u.name_rol || u.rol || '').toLowerCase()
  const idRol = Number(u.id_rol)
  return nombre.includes('pamela') || email.includes('pamela') || idRol === 33 || rol.includes('conta') || rol.includes('tesor')
})

// Permiso integral de edición (Admin o Tesorería)
const esHabilitadoEdicion = computed(() => {
  return esAdminGlobal.value || esPamelaTesoreria.value
})

const tituloRolHabilitado = computed(() => {
  if (esAdminGlobal.value) return 'Perfil Administrador del Sistema (Sergio Gajardo)'
  if (esPamelaTesoreria.value) return 'Perfil Gerencia de Tesorería (Pamela Seguel)'
  return 'Usuario Autorizado'
})

const descripcionRolHabilitado = computed(() => {
  if (esAdminGlobal.value) return 'Tienes acceso global de auditoría y edición para corregir tarifas, sobretiempos y aplicar notas de ajuste sobre este EDP.'
  if (esPamelaTesoreria.value) return 'Tienes autorización exclusiva para editar tarifas pactadas, corregir sobretiempos y aplicar notas de ajuste sobre este EDP.'
  return 'Autorizado para modificar tarifas y notas de ajuste.'
})

const solicitudesAjuste = computed(() => {
  return props.edpData?.proyecto?.json_field?.edp_solicitudes_ajuste || []
})

const esFacturado = computed(() => {
  return props.edpData?.proyecto?.id_proyecto_estado === 7 || props.edpData?.liquidacion_guardada !== null
})

const formaPagoTexto = computed(() => {
  return props.edpData?.proyecto?.forma_pago || props.edpData?.proyecto?.json_field?.crm_v1?.condiciones_comerciales?.forma_pago || 'Crédito 30 Días'
})

const esPagoAnticipado = computed(() => {
  const fp = formaPagoTexto.value.toUpperCase()
  return fp.includes('CONTADO') || fp.includes('ANTICIP') || fp.includes('PAGADO') || props.edpData?.proyecto?.cliente_ya_pago === true
})

const clienteEmail = computed(() => {
  return props.edpData?.proyecto?.contacto_email || props.edpData?.proyecto?.json_field?.crm_v1?.contacto_email || ''
})

const edpFeriaFirmado = computed(() => {
  return props.edpData?.proyecto?.json_field?.edp_firma_comercial || props.edpData?.proyecto?.json_field?.edp_flujo_v1?.firma_3_comercial || null
})

const flujoEdp = computed(() => {
  return props.edpData?.edp_flujo_v1 || props.edpData?.proyecto?.json_field?.edp_flujo_v1 || null
})

const requiereOcProyecto = computed(() => {
  if (props.edpData?.requiere_oc_hes !== undefined) return Boolean(props.edpData.requiere_oc_hes)
  const jf = props.edpData?.proyecto?.json_field || {}
  return Boolean(jf.crm_v1?.requiere_oc_hes ?? jf.datos_generales?.requiere_oc_hes ?? false)
})

const tieneOcCargada = computed(() => {
  if (formOC.value?.numero_oc) return true
  if (props.edpData?.tiene_oc !== undefined) return Boolean(props.edpData.tiene_oc)
  const jf = props.edpData?.proyecto?.json_field || {}
  return Boolean((jf.ordenes_compra && jf.ordenes_compra.length > 0) || (jf.crm_v1?.ordenes_compra && jf.crm_v1.ordenes_compra.length > 0) || jf.oc_v1?.numero_oc)
})

const habilitadoFacturarInmediato = computed(() => {
  if (esFacturado.value) return true
  const f = flujoEdp.value
  const edpValidado = Boolean(f?.firma_2_contabilidad || f?.firma_1_analista || edpFeriaFirmado.value)
  return Boolean(edpValidado && (!requiereOcProyecto.value || tieneOcCargada.value))
})

const etiquetaEstadoFlujoEdp = computed(() => {
  const f = flujoEdp.value
  if (!f) return '⏳ Paso 1: Pendiente Emisión Control de Gestión'
  if (f.estado === 'OBSERVADO_CONTABILIDAD') return '⚠️ Observado por Contabilidad'
  if (f.firma_3_comercial) return '🚀 Despachado al Cliente'
  if (f.firma_1_analista) return '🟢 EDP Liberado (Control de Gestión)'
  return '⏳ Paso 1: Pendiente Emisión Control de Gestión'
})

const pasoSugeridoFirma = computed(() => {
  const f = flujoEdp.value
  if (!f || !f.firma_1_analista) return 1
  return 2 // Despacho Comercial
})

const tituloPasoFirmaActual = computed(() => {
  if (pasoFirmaSeleccionado.value === 1) return 'Hito 1: Control de Gestión (Yara) — Validar Reports y Emitir EDP'
  return 'Hito 2: Comercial — Firmar y Despachar EDP al Cliente Mandante'
})

const calcularSubtotalLinea = (linea) => {
  if (!linea) return 0
  const valUnit = Number(linea.valorUnitario ?? linea.precio_unitario ?? linea.tarifa ?? 0)
  const cant = Number(linea.cantidad ?? 1)
  if (linea.unidad === 'Diario') {
    const diasFaena = Math.max(1, props.edpData?.reports_validados?.length || 1)
    return valUnit * diasFaena * cant
  } else if (linea.tipo?.includes('GRUA')) {
    const hrs = Number(props.edpData?.resumen_financiero?.horas_facturables_totales) || (cant * 8)
    return valUnit * hrs
  }
  return valUnit * cant
}

const totalNetoCalculado = computed(() => {
  let sub = 0
  for (const l of (lineasEditables.value || [])) {
    sub += calcularSubtotalLinea(l)
  }
  const sobretiempo = Number(props.edpData?.resumen_financiero?.monto_sobretiempo_neto) || 0
  sub += sobretiempo
  sub -= Number(descuentoTesoreria.value) || 0
  return Math.max(0, sub)
})

const ivaCalculado = computed(() => Math.round(totalNetoCalculado.value * 0.19))
const totalBrutoCalculado = computed(() => totalNetoCalculado.value + ivaCalculado.value)

// Sincronizar líneas editables, OC y Factura
watch(() => props.edpData, (nuevo) => {
  if (nuevo?.lineas_cotizadas) {
    lineasEditables.value = JSON.parse(JSON.stringify(nuevo.lineas_cotizadas))
  }
  const ajustesPrevios = nuevo?.proyecto?.json_field?.edp_ajustes_v1
  if (ajustesPrevios) {
    descuentoTesoreria.value = Number(ajustesPrevios.descuento_global) || 0
    motivoDescuentoTesoreria.value = ajustesPrevios.motivo_ajuste || ''
    if (Array.isArray(ajustesPrevios.lineas_ajustadas) && ajustesPrevios.lineas_ajustadas.length > 0) {
      lineasEditables.value = JSON.parse(JSON.stringify(ajustesPrevios.lineas_ajustadas))
    }
  }

  // Sincronizar OC existente
  const ocGuardada = nuevo?.proyecto?.json_field?.oc_v1 || nuevo?.proyecto?.json_field?.ordenes_compra?.[0]
  if (ocGuardada) {
    formOC.value = {
      numero_oc: ocGuardada.numero_oc || '',
      fecha_emision: ocGuardada.fecha_emision ? String(ocGuardada.fecha_emision).split('T')[0] : new Date().toISOString().split('T')[0],
      monto_neto: ocGuardada.monto_neto || 0,
      archivo: ocGuardada.archivo || null,
      observaciones: ocGuardada.observaciones || ''
    }
  } else if (!formOC.value.numero_oc) {
    formOC.value.monto_neto = totalNetoCalculado.value || 0
  }

  // Sincronizar Factura existente
  const liqGuardada = nuevo?.proyecto?.json_field?.liquidacion_v1 || nuevo?.liquidacion_guardada
  if (liqGuardada) {
    formFactura.value = {
      factura_numero: liqGuardada.factura_numero || '',
      fecha_facturacion: liqGuardada.fecha_facturacion ? String(liqGuardada.fecha_facturacion).split('T')[0] : new Date().toISOString().split('T')[0],
      monto_neto: liqGuardada.monto_facturado_neto || totalNetoCalculado.value || 0,
      monto_bruto: liqGuardada.monto_facturado_bruto || totalBrutoCalculado.value || 0,
      archivo: liqGuardada.archivo_factura || null,
      observaciones: liqGuardada.observaciones_facturacion || ''
    }
    if (liqGuardada.archivo_oc && !formOC.value.archivo) {
      formOC.value.archivo = liqGuardada.archivo_oc
    }
    if (liqGuardada.hes_oc_numero && !formOC.value.numero_oc) {
      formOC.value.numero_oc = liqGuardada.hes_oc_numero
    }
  } else if (!formFactura.value.factura_numero) {
    formFactura.value.monto_neto = totalNetoCalculado.value || 0
    formFactura.value.monto_bruto = totalBrutoCalculado.value || 0
  }
}, { immediate: true })

const toggleModoAjusteTesoreria = () => {
  if (props.soloLectura) return
  if (!esHabilitadoEdicion.value) {
    alert('🔒 Acceso Denegado: La edición de tarifas en el EDP solo está permitida para Tesorería (Pamela) o Administradores del Sistema.')
    return
  }
  modoAjusteTesoreria.value = !modoAjusteTesoreria.value
}

// Guardar ajustes de Tesorería o Administrador (Spec 57 / Spec 59)
const guardarAjustesTesoreria = async () => {
  const idProyecto = props.edpData?.proyecto?.id_proyecto || props.edpData?.id_proyecto
  if (!idProyecto) return

  guardandoAjustes.value = true
  try {
    const { data } = await apiAxios.post('/operaciones/edp/ajustes-tesoreria', {
      id_proyecto: idProyecto,
      id_user: currentUser.value.id_user || 1,
      lineas_ajustadas: lineasEditables.value,
      descuento_global: descuentoTesoreria.value,
      motivo_ajuste: motivoDescuentoTesoreria.value
    })
    if (data?.success) {
      alert(`✅ ${data.message || 'Ajustes de tarifas y descuentos guardados exitosamente.'}`)
      modoAjusteTesoreria.value = false
      emit('edp-actualizado')
    } else {
      alert(`⚠️ ${data?.message || 'No se pudieron guardar los ajustes'}`)
    }
  } catch (e) {
    console.error('Error guardando ajustes:', e)
    alert('Error al guardar ajustes: ' + (e.response?.data?.message || e.message))
  } finally {
    guardandoAjustes.value = false
  }
}

// Métodos de Solicitud de Modificación (RFC de EDP) (Spec 59 / REQ-037)
const enviarSolicitudModificacion = async () => {
  if (!formRfc.value.descripcion.trim()) {
    alert('Por favor ingresa el detalle y justificación del cambio requerido.')
    return
  }
  const idProyecto = props.edpData?.proyecto?.id_proyecto || props.edpData?.id_proyecto
  if (!idProyecto) return

  enviandoRfc.value = true
  try {
    const { data } = await apiAxios.post('/operaciones/edp/solicitar-modificacion', {
      id_proyecto: idProyecto,
      id_user: currentUser.value.id_user || 1,
      tipo_modificacion: formRfc.value.tipo_modificacion,
      descripcion: formRfc.value.descripcion,
      monto_estimado: formRfc.value.monto_estimado
    })
    if (data?.success) {
      alert('🚀 Solicitud de modificación enviada exitosamente.\nSe ha notificado de inmediato a Tesorería (Pamela Seguel) y Administración (Sergio Gajardo) vía Correo y WhatsApp.')
      modalSolicitudRfcAbierto.value = false
      formRfc.value.descripcion = ''
      formRfc.value.monto_estimado = null
      emit('edp-actualizado')
    } else {
      alert('⚠️ ' + (data?.message || 'Error al enviar solicitud'))
    }
  } catch (e) {
    console.error('Error enviando RFC:', e)
    alert('Error al enviar solicitud: ' + (e.response?.data?.message || e.message))
  } finally {
    enviandoRfc.value = false
  }
}

const aplicarRfc = (s) => {
  modoAjusteTesoreria.value = true
  if (s.monto_estimado && !descuentoTesoreria.value) {
    descuentoTesoreria.value = s.monto_estimado
  }
  if (!motivoDescuentoTesoreria.value) {
    motivoDescuentoTesoreria.value = `Ajuste según RFC por ${s.nombre_solicitante}: ${s.descripcion}`
  }
}

const resolverRfc = async (idSolicitud, accion) => {
  const idProyecto = props.edpData?.proyecto?.id_proyecto || props.edpData?.id_proyecto
  if (!idProyecto) return
  const comentario = prompt(`Comentario o justificación de resolución (${accion}):`, accion === 'APLICADA' ? 'Ajuste procesado' : 'No procede ajuste')
  if (comentario === null) return

  try {
    const { data } = await apiAxios.post('/operaciones/edp/resolver-solicitud-modificacion', {
      id_proyecto: idProyecto,
      id_solicitud: idSolicitud,
      id_user: currentUser.value.id_user || 1,
      accion: accion,
      comentario_resolucion: comentario
    })
    if (data?.success) {
      alert(`✅ Requerimiento marcado como ${accion}`)
      emit('edp-actualizado')
    } else {
      alert(`⚠️ ${data?.message}`)
    }
  } catch (e) {
    console.error('Error resolviendo RFC:', e)
    alert('Error al resolver requerimiento: ' + (e.response?.data?.message || e.message))
  }
}

// Métodos de Soporte Documental: OC y Factura (Spec 60 / REQ-038)
const triggerFileInputOC = () => fileInputOC.value?.click()
const triggerFileInputFactura = () => fileInputFactura.value?.click()

const onArchivoOCSeleccionado = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  subiendoArchivoOC.value = true
  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'ordenes_compra')
    formData.append('tipo_doc', 'ORDEN_COMPRA')
    formData.append('name_doc_orig', file.name)
    formData.append('id_user', currentUser.value?.id_user || 1)

    const { data } = await apiAxios.post('/v1/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const doc = data?.data || data?.documento || {}
    formOC.value.archivo = {
      id_doc: doc.id_doc,
      nombre: doc.name_doc_orig || file.name,
      url: doc.url || `/api/v1/storage/view/${doc.id_doc}`
    }
    alert('✅ Archivo de Orden de Compra cargado exitosamente.')
  } catch (err) {
    console.error('Error al subir archivo de OC:', err)
    alert('Error al subir archivo de OC: ' + (err.response?.data?.message || err.message))
  } finally {
    subiendoArchivoOC.value = false
  }
}

const onArchivoFacturaSeleccionado = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  subiendoArchivoFactura.value = true
  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'facturas')
    formData.append('tipo_doc', 'FACTURA_DTE')
    formData.append('name_doc_orig', file.name)
    formData.append('id_user', currentUser.value?.id_user || 1)

    const { data } = await apiAxios.post('/v1/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const doc = data?.data || data?.documento || {}
    formFactura.value.archivo = {
      id_doc: doc.id_doc,
      nombre: doc.name_doc_orig || file.name,
      url: doc.url || `/api/v1/storage/view/${doc.id_doc}`
    }
    alert('✅ Archivo PDF de Factura cargado exitosamente.')
  } catch (err) {
    console.error('Error al subir archivo de Factura:', err)
    alert('Error al subir archivo de Factura: ' + (err.response?.data?.message || err.message))
  } finally {
    subiendoArchivoFactura.value = false
  }
}

const asumirSinOcModal = () => {
  formOC.value.numero_oc = 'S/OC - ASUME EDP'
  formOC.value.monto_neto = totalNetoCalculado.value || 0
  formOC.value.observaciones = 'Cliente sin OC formal. Se asume monto íntegro del EDP'
}

const guardarOcDirecta = async () => {
  if (!formOC.value.numero_oc) {
    alert('Por favor ingresa el N° de la Orden de Compra o pulsa "Sin OC (Asumir EDP)".')
    return
  }
  const idProyecto = props.edpData?.proyecto?.id_proyecto || props.edpData?.id_proyecto
  if (!idProyecto) return

  guardandoOC.value = true
  try {
    const { data } = await apiAxios.post('/operaciones/edp/soporte-documental', {
      id_proyecto: idProyecto,
      id_user: currentUser.value?.id_user || 1,
      oc: {
        numero_oc: formOC.value.numero_oc,
        fecha_emision: formOC.value.fecha_emision,
        monto_neto: formOC.value.monto_neto,
        archivo: formOC.value.archivo,
        asumido_sin_oc: formOC.value.numero_oc.includes('S/OC')
      }
    })
    if (data?.success) {
      alert('✅ Orden de Compra guardada exitosamente.')
      emit('edp-actualizado')
    }
  } catch (e) {
    console.error('Error guardando OC:', e)
    alert('Error al guardar OC: ' + (e.response?.data?.message || e.message))
  } finally {
    guardandoOC.value = false
  }
}

const guardarFacturaYConcluir = async (declararCerrado = true) => {
  if (!formFactura.value.factura_numero) {
    alert('Por favor ingresa el N° de Factura Emitida.')
    return
  }
  const idProyecto = props.edpData?.proyecto?.id_proyecto || props.edpData?.id_proyecto
  if (!idProyecto) return

  if (declararCerrado && !window.confirm(`¿Confirmas declarar la OT como FACTURADA con Factura N° ${formFactura.value.factura_numero} y concluir el servicio?`)) {
    return
  }

  guardandoFactura.value = true
  try {
    const { data } = await apiAxios.post('/operaciones/edp/soporte-documental', {
      id_proyecto: idProyecto,
      id_user: currentUser.value?.id_user || 1,
      oc: formOC.value.numero_oc ? {
        numero_oc: formOC.value.numero_oc,
        fecha_emision: formOC.value.fecha_emision,
        monto_neto: formOC.value.monto_neto,
        archivo: formOC.value.archivo
      } : null,
      factura: {
        factura_numero: formFactura.value.factura_numero,
        fecha_facturacion: formFactura.value.fecha_facturacion,
        monto_neto: formFactura.value.monto_neto || totalNetoCalculado.value,
        monto_bruto: formFactura.value.monto_bruto || totalBrutoCalculado.value,
        observaciones: formFactura.value.observaciones,
        archivo: formFactura.value.archivo
      },
      declarar_facturado: declararCerrado
    })
    if (data?.success) {
      alert(`🎉 ${data.message || 'Facturación registrada exitosamente'}`)
      emit('edp-actualizado')
    }
  } catch (e) {
    console.error('Error guardando Factura:', e)
    alert('Error al guardar Factura: ' + (e.response?.data?.message || e.message))
  } finally {
    guardandoFactura.value = false
  }
}

const getUrlArchivoAdjunto = (archivo) => {
  if (!archivo) return '#'
  const baseApi = (apiAxios.defaults.baseURL || '').replace(/\/$/, '')
  const prefix = baseApi.replace(/\/api$/, '')
  if (archivo.url) {
    if (archivo.url.startsWith('http')) return archivo.url
    return `${prefix}${archivo.url.startsWith('/') ? '' : '/'}${archivo.url}`
  }
  if (archivo.id_doc) {
    return `${baseApi}/archivo/ver/${archivo.id_doc}`
  }
  return '#'
}

// Submodal PIN FES (Circuito 3 Pasos EDP)
const abrirModalPinFes = (paso = null) => {
  pasoFirmaSeleccionado.value = Number(paso) || pasoSugeridoFirma.value || 1
  pinDigits.value = ['', '', '', '']
  pinError.value = ''
  observacionesFirma.value = ''
  modalFesAbierto.value = true
  setTimeout(() => {
    if (pinInputs.value[0]) pinInputs.value[0].focus()
  }, 100)
}

const devolverEdpConObservaciones = async () => {
  const obs = window.prompt('Indica las observaciones de Contabilidad para devolver el EDP a Control de Gestión (Yara):')
  if (!obs || !obs.trim()) return

  const idProyecto = props.edpData?.proyecto?.id_proyecto || props.edpData?.id_proyecto
  if (!idProyecto) return

  try {
    const res = await apiAxios.post('/operaciones/edp/firmar-paso', {
      id_proyecto: idProyecto,
      id_user: currentUser.value.id_user || 1,
      paso: 2,
      accion: 'DEVOLVER',
      observaciones: obs.trim()
    })
    if (res.data?.success) {
      alert(`⚠️ ${res.data.message}`)
      emit('edp-actualizado')
    }
  } catch (err) {
    console.error('Error al devolver EDP con observaciones:', err)
    alert('Error al devolver EDP: ' + (err.response?.data?.message || err.message))
  }
}

const onPinInput = (index, event) => {
  const val = event.target.value.replace(/\D/g, '')
  pinDigits.value[index] = val ? val[val.length - 1] : ''
  if (val && index < 3) {
    pinInputs.value[index + 1]?.focus()
  }
}

const onPinBackspace = (index, event) => {
  if (!pinDigits.value[index] && index > 0) {
    pinInputs.value[index - 1]?.focus()
  }
}

async function sha256Hex(plainText) {
  const enc = new TextEncoder().encode(plainText)
  const hashBuf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const procesarFirmaComercial = async () => {
  const pin = pinDigits.value.join('')
  if (pin.length < 4) {
    pinError.value = 'Debes ingresar los 4 dígitos del PIN.'
    return
  }

  procesandoFirma.value = true
  pinError.value = ''

  try {
    const pinHash = await sha256Hex(pin)
    const idProyecto = props.edpData?.proyecto?.id_proyecto || props.edpData?.id_proyecto

    const res = await apiAxios.post('/operaciones/edp/firmar-paso', {
      id_proyecto: idProyecto,
      id_user: currentUser.value.id_user || 1,
      paso: pasoFirmaSeleccionado.value || 1,
      accion: 'FIRMAR',
      pass_fes: pinHash,
      es_pago_anticipado: esPagoAnticipado.value,
      observaciones: observacionesFirma.value,
      monto_edp_neto: totalNetoCalculado.value || 0
    })

    const json = res.data
    if (json.success) {
      modalFesAbierto.value = false
      alert(`✅ ${json.message}\nCódigo FES: ${json.codigo_fes}`)
      emit('edp-actualizado')
    } else {
      pinError.value = json.message || 'PIN FES incorrecto'
    }
  } catch (err) {
    console.error('Error al firmar EDP:', err)
    pinError.value = 'Error al procesar firma: ' + (err.response?.data?.message || err.message)
  } finally {
    procesandoFirma.value = false
  }
}

const cerrar = () => {
  emit('close')
}

const formatMoneda = (val) => {
  if (!val && val !== 0) return '$0'
  return '$' + Number(val).toLocaleString('es-CL')
}

const formatearFecha = (fStr) => {
  if (!fStr) return '---'
  try {
    const d = new Date(fStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return fStr
  }
}

const formatearFechaHora = (fStr) => {
  if (!fStr) return '---'
  try {
    const d = new Date(fStr)
    if (isNaN(d.getTime())) return fStr
    return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return fStr
  }
}

const imprimirCaratula = () => {
  window.print()
}

const descargarDossierPdf = () => {
  const idProyecto = props.edpData?.proyecto?.id_proyecto || props.edpData?.id_proyecto || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id_proyecto') : null)
  if (!idProyecto) {
    alert('No se identificó el proyecto para descargar el EDP.')
    return
  }
  const baseApi = (apiAxios.defaults.baseURL || '').replace(/\/$/, '')
  const pdfUrl = `${baseApi}/operaciones/edp/proyecto/${idProyecto}/pdf`
  
  descargandoPdf.value = true
  window.open(pdfUrl, '_blank', 'noopener')
  setTimeout(() => {
    descargandoPdf.value = false
  }, 1500)
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
