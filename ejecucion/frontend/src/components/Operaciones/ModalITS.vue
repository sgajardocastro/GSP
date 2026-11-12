<template>
  <div v-if="visible" :class="embedded ? 'w-full animate-fadeIn' : 'fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fadeIn'">
    <div :class="embedded ? 'bg-[#0b1021] border border-blue-500/30 rounded-2xl w-full flex flex-col shadow-xl text-slate-200' : ['bg-[#0b1021] border border-blue-500/40 rounded-2xl w-full max-w-[98vw] 2xl:max-w-[1750px] flex flex-col overflow-hidden shadow-2xl shadow-black text-slate-200', esModoRevisionEjecutiva && vistaRevisionActiva === 'PDF' ? 'h-[94vh]' : 'max-h-[96vh]']">
      
      <!-- HEADER / ACCIONES GLOBALES -->
      <header class="bg-[#050810] px-5 py-3.5 border-b border-white/10 flex flex-wrap justify-between items-center gap-3 flex-shrink-0" :class="embedded ? 'rounded-t-2xl' : ''">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-xl text-blue-400 font-bold">
            📑
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                Informe Término de Servicio (ITS)
              </h2>
              <span class="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-mono font-bold px-2.5 py-0.5 rounded-md">
                {{ its.folio_its || 'ITS-BORRADOR' }} (v{{ its.version || '1.0' }})
              </span>
              <span :class="badgeEstadoClass" class="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-md border">
                {{ its.estado_its || 'BORRADOR' }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>OT: <strong class="text-slate-200 font-mono">{{ proyecto.codi_proyecto || 'S/C' }}</strong></span>
              <span>•</span>
              <span>Cliente: <strong class="text-slate-200">{{ proyecto.cliente_nombre || 'Cliente' }}</strong></span>
            </p>
          </div>
        </div>

        <!-- Botones de Acción Globales -->
        <div class="flex items-center gap-2">
          <!-- Selector de Contexto Urbano / Rural -->
          <div class="flex items-center bg-slate-900 border border-white/15 rounded-lg p-0.5 text-xs font-mono">
            <button 
              type="button"
              @click="cambiarContexto('URBANO')" 
              :class="its.tipo_contexto === 'URBANO' ? 'bg-blue-600 text-white shadow font-bold' : 'text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 rounded transition-colors"
            >
              🏢 Urbano
            </button>
            <button 
              type="button"
              @click="cambiarContexto('RURAL')" 
              :disabled="readonly"
              :class="its.tipo_contexto === 'RURAL' ? 'bg-amber-600 text-white shadow font-bold' : 'text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 rounded transition-colors"
            >
              🌲 Rural
            </button>
          </div>

          <!-- MODO REVISIÓN EJECUTIVA (SPEC-116 / REQ-1127): Jefaturas y Contabilidad -->
          <template v-if="esModoRevisionEjecutiva">
            <div class="flex items-center bg-slate-900 border border-white/10 rounded-lg p-0.5">
              <button 
                type="button"
                @click="vistaRevisionActiva = 'PDF'"
                :class="vistaRevisionActiva === 'PDF' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
                class="px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer"
              >
                📄 PDF Firmado
              </button>
              <button 
                type="button"
                @click="vistaRevisionActiva = 'NUMEROS'"
                :class="vistaRevisionActiva === 'NUMEROS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
                class="px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer"
              >
                👁️ Desglose Técnico
              </button>
            </div>
          </template>

          <!-- Si NO es modo ejecutivo ni readonly (Cockpit PMO / Yara Paso 1) -->
          <template v-else-if="!readonly">
            <button 
              type="button"
              @click="guardar(false)" 
              :disabled="guardando"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>💾</span>
              <span>{{ guardando ? 'Guardando...' : 'Guardar Avances' }}</span>
            </button>

            <button 
              v-if="embedded"
              type="button"
              @click="guardarYPasarEDP" 
              :disabled="guardando"
              class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>➔</span>
              <span>Guardar y Pasar a EDP</span>
            </button>

            <button 
              v-else
              type="button"
              @click="guardar(true)" 
              :disabled="guardando"
              class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>✅</span>
              <span>Guardar y Salir</span>
            </button>
          </template>

          <!-- Si ES readonly (Kanban de Operaciones sin modo ejecutivo) -->
          <template v-else>
            <button 
              v-if="embedded"
              type="button"
              @click="$emit('avanzar-edp')" 
              class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>➔</span>
              <span>Ver EDP Mandante</span>
            </button>
          </template>

          <button 
            v-if="puedeFirmarPasoActual && !esModoRevisionEjecutiva"
            type="button"
            @click="abrirModalFes('APRUEBA')"
            class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-900/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>🔏</span>
            <span>Firmar ITS (Paso {{ pasoPendienteActual?.orden || 1 }})</span>
          </button>

          <a 
            :href="urlPdfOficial"
            target="_blank"
            rel="noopener"
            class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white text-xs font-bold border border-red-500/40 flex items-center gap-1.5 transition-colors cursor-pointer no-underline"
            title="Ver PDF Oficial"
          >
            <span>📄 PDF Oficial ↗</span>
          </a>

          <button 
            v-if="!embedded"
            type="button"
            @click="cerrar" 
            class="text-slate-400 hover:text-white text-2xl p-1 font-bold cursor-pointer transition-colors ml-1"
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </header>

      <!-- BANNER READONLY EN KANBAN (Spec 57 / REQ-023) -->
      <div v-if="readonly" class="bg-blue-950/40 border-b border-blue-500/30 px-5 py-2.5 flex items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2 text-blue-300 font-mono font-bold">
          <span>🔒</span>
          <span>MODO CONSULTA EN KANBAN</span>
        </div>
        <span class="text-slate-300 text-[11px]">
          La formulación, edición de costos y firma del ITS se realiza exclusivamente por el Analista de Control de Gestión en el <strong>Cockpit PMO (Torre de Control)</strong>.
        </span>
      </div>

      <!-- BANNER STEPPER DE FLUJO FES (SPEC 47) -->
      <div class="bg-[#070b16] border-b border-white/10 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono flex-shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Flujo FES:</span>
          <span :class="badgeEstadoClass" class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase">
            {{ its.estado_its || 'BORRADOR' }}
          </span>
        </div>

        <!-- 3 Pasos Visuales -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px]" :class="pasoStyle(1)">
            <span>{{ pasoIcon(1) }}</span>
            <span class="font-bold">1. Elaboración</span>
            <span class="text-[10px] opacity-75 hidden sm:inline">({{ pasoResponsable(1, 'Analista') }})</span>
          </div>
          <span class="text-slate-600 text-xs">➔</span>

          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px]" :class="pasoStyle(2)">
            <span>{{ pasoIcon(2) }}</span>
            <span class="font-bold">2. V°B° Jefatura</span>
            <span class="text-[10px] opacity-75 hidden sm:inline">({{ pasoResponsable(2, 'Jefe Oper.') }})</span>
          </div>
          <span class="text-slate-600 text-xs">➔</span>

          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px]" :class="pasoStyle(3)">
            <span>{{ pasoIcon(3) }}</span>
            <span class="font-bold">3. Contabilidad</span>
            <span class="text-[10px] opacity-75 hidden sm:inline">({{ pasoResponsable(3, 'Contabilidad') }})</span>
          </div>
        </div>

        <!-- Acciones FES del Stepper (solo devolución cuando aplica; firma principal está en cabecera) -->
        <div v-if="puedeFirmarPasoActual && pasoPendienteActual?.orden > 1" class="flex items-center gap-1.5">
          <button 
            type="button"
            @click="abrirModalFes('RECHAZA')"
            class="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/50 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>❌</span> <span>Devolver</span>
          </button>
        </div>
      </div>

      <!-- CUERPO PRINCIPAL CON SCROLL -->
      <div v-if="cargando" class="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
        <div class="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3"></div>
        <p class="text-sm font-mono">Cargando datos relacionales del ITS...</p>
      </div>

      <!-- CUERPO EN MODO REVISIÓN EJECUTIVA: LAYOUT DE DOS PANELES (PDF NORMAL + PANEL LATERAL DE FIRMA Y OBSERVACIONES) -->
      <div v-else-if="esModoRevisionEjecutiva && vistaRevisionActiva === 'PDF'" class="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden bg-slate-950">
        
        <!-- PANEL IZQUIERDO: VISOR DOCUMENTAL EXPANDIDO (PDF NORMAL) -->
        <div class="flex-1 flex flex-col min-w-0 bg-[#0c1222] border-r border-white/10 relative overflow-hidden">
          <div class="bg-slate-900/90 border-b border-white/10 px-4 py-2 flex items-center justify-between text-xs font-mono shrink-0">
            <span class="text-slate-300 flex items-center gap-2">
              <span class="text-blue-400">📄</span> 
              <span class="font-bold text-white">Documento Oficial ITS Formalizado</span>
              <span class="text-slate-500">·</span>
              <span class="text-slate-400">Firmado con PIN FES en Paso 1 (Control de Gestión)</span>
            </span>
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                @click="recargarPreviewPdf" 
                class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                title="Recargar visualización del documento"
              >
                <span>🔄</span> <span>Actualizar</span>
              </button>
              <a 
                :href="urlPdfOficial"
                target="_blank"
                rel="noopener"
                class="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white text-xs border border-blue-500/40 flex items-center gap-1 cursor-pointer no-underline transition-colors"
                title="Abrir PDF en pestaña completa"
              >
                <span>↗</span> <span>Abrir en Pestaña</span>
              </a>
            </div>
          </div>

          <!-- Contenedor del PDF con Altura Completa y Aspecto de Hoja -->
          <div class="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center p-2">
            <iframe 
              v-if="urlPdfPreviewIframe" 
              :src="urlPdfPreviewIframe" 
              class="w-full h-full rounded border border-white/10 shadow-2xl bg-white"
              title="Documento Oficial ITS"
            ></iframe>
            <div v-else class="flex-1 flex items-center justify-center text-slate-500 text-xs font-mono p-8 text-center">
              No se pudo cargar el documento PDF.
            </div>
          </div>
        </div>

        <!-- PANEL DERECHO LATERAL: FIRMA Y OBSERVACIONES A UN COSTADO -->
        <aside class="w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-[#050810] border-t lg:border-t-0 border-white/10 shrink-0 overflow-y-auto custom-scrollbar">
          <div class="p-5 space-y-4 flex-1 flex flex-col">
            <!-- 1. Cabecera del Panel de Control -->
            <div class="border-b border-white/10 pb-3">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <span>⚖️</span> Revisión Ejecutiva
                </span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                  Paso {{ pasoPendienteActual?.orden || 2 }} de {{ flujoData?.pasos?.length || 3 }}
                </span>
              </div>
              <h3 class="text-sm font-extrabold text-white mt-1">
                {{ pasoPendienteActual?.nombre_paso || 'Supervisión Directiva' }}
              </h3>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Revise el documento a la izquierda y aplique su resolución mediante firma digital FES.
              </p>
            </div>

            <!-- 2. Tarjeta Resumen del Trámite -->
            <div class="bg-slate-900/60 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs font-mono">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Folio ITS:</span>
                <span class="font-bold text-white">{{ its.folio_its || 'ITS-S/F' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Versión:</span>
                <span class="text-cyan-300 font-bold">v{{ its.version || '1.0' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Total Venta Neta:</span>
                <span class="text-emerald-400 font-black">{{ formatMoneda(its.total_venta_neta) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Costos Operacionales:</span>
                <span class="text-amber-400 font-black">{{ formatMoneda(its.total_costos_operacionales) }}</span>
              </div>
              <div class="flex items-center justify-between pt-1 border-t border-white/10">
                <span class="text-slate-400">Margen Bruto:</span>
                <span :class="Number(its.margen_operacional_porcentaje || 0) >= 60 ? 'text-emerald-400' : 'text-amber-400'" class="font-black">
                  {{ Number(its.margen_operacional_porcentaje || 0).toFixed(1) }}%
                </span>
              </div>
            </div>

            <!-- 3. Observaciones de Revisión y Devolución -->
            <div class="space-y-2">
              <label class="block text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <span>💬</span> Observaciones de Revisión:
                </span>
                <span class="text-[10px] text-slate-500 font-normal">Auditoría / Devolución</span>
              </label>
              <textarea 
                v-model="obsRevisionDirecta"
                rows="3"
                placeholder="Escriba aquí sus observaciones o motivo en caso de requerir correcciones en faena..."
                class="w-full bg-slate-900 border border-white/15 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
              ></textarea>
            </div>

            <!-- Spacer -->
            <div class="flex-1"></div>

            <!-- 4. Botones de Decisión Ejecutiva -->
            <div v-if="puedeFirmarPasoActual" class="pt-3 border-t border-white/10 space-y-2.5">
              <button 
                type="button"
                @click="ejecutarAprobacionDirecta"
                class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black font-mono flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xl shadow-emerald-950/60"
              >
                <span>🔏</span> <span>Aprobar ITS con PIN FES (Paso {{ pasoPendienteActual?.orden || 2 }})</span>
              </button>

              <button 
                v-if="pasoPendienteActual?.orden > 1"
                type="button"
                @click="ejecutarDevolucionDirecta"
                class="w-full py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 text-xs font-bold font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
              >
                <span>❌</span> <span>Devolver con Observaciones</span>
              </button>
            </div>
            <div v-else class="pt-3 border-t border-white/10 text-center text-xs font-mono text-slate-500">
              🔒 Modo Inspección: Usted no cuenta con rol de firma asignado para este paso.
            </div>
          </div>
        </aside>
      </div>

      <div v-else class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
        <!-- Banner informativo si está en Desglose Técnico Solo Lectura -->
        <div v-if="esModoRevisionEjecutiva" class="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200 flex items-center justify-between">
          <span class="flex items-center gap-2 font-mono">
            <span>🔒</span> <span>Modo Inspección Solo Lectura: Valores conciliados por Control de Gestión en Paso 1. Para solicitar correcciones, use "Devolver con Observaciones".</span>
          </span>
          <div v-if="puedeFirmarPasoActual" class="flex items-center gap-2">
            <button 
              v-if="pasoPendienteActual?.orden > 1"
              type="button"
              @click="abrirModalFes('RECHAZA')"
              class="px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-mono font-bold cursor-pointer"
            >
              ❌ Devolver
            </button>
            <button 
              type="button"
              @click="abrirModalFes('APRUEBA')"
              class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer"
            >
              🔏 Aprobar (Paso {{ pasoPendienteActual?.orden || 2 }})
            </button>
          </div>
        </div>
        
        <!-- SECCIÓN 1: DATOS DEL SERVICIO INTEGRAL & ASIGNACIÓN -->
        <section class="bg-[#080d1a] border border-white/15 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3.5">
            <h3 class="text-xs font-mono font-bold uppercase text-blue-400 tracking-wider flex items-center gap-2">
              <span>📋</span> Sección 1: Datos del Servicio Integral & Parámetros Comerciales
            </h3>
            <span class="text-[11px] text-slate-400">Razón Social: <strong class="text-slate-200">{{ proyecto.empresa_facturacion }}</strong></span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs mb-4">
            <div class="bg-slate-900/80 p-2.5 rounded-lg border border-white/10">
              <span class="text-[10px] text-slate-400 uppercase font-mono block">Cliente</span>
              <strong class="text-slate-200 truncate block">{{ proyecto.cliente_nombre }}</strong>
              <span class="text-[11px] font-mono text-slate-400 block">RUT: {{ proyecto.cliente_rut || 'S/R' }}</span>
            </div>

            <div class="bg-slate-900/80 p-2.5 rounded-lg border border-white/10">
              <span class="text-[10px] text-slate-400 uppercase font-mono block">Obra / Faena</span>
              <strong class="text-slate-200 truncate block">{{ proyecto.obra_nombre || 'Faena' }}</strong>
              <span class="text-[11px] text-slate-400 block">{{ proyecto.obra_ciudad || 'Santiago' }}</span>
            </div>

            <div class="bg-slate-900/80 p-2.5 rounded-lg border border-white/10">
              <label class="text-[10px] text-slate-400 uppercase font-mono block">Horas Mínimas Base</label>
              <div v-if="esServicioValorFijo" class="mt-1">
                <span class="inline-flex items-center px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                  No Aplica (Valor Fijo - 0 hrs)
                </span>
              </div>
              <div v-else class="flex items-center gap-1 mt-0.5">
                <input 
                  type="number" 
                  step="0.5" 
                  v-model.number="its.horas_minimas_pactadas" 
                  @input="recalcularTotales"
                  class="w-full bg-slate-950 border border-white/20 rounded px-2 py-1 font-mono font-bold text-white text-xs"
                />
                <span class="text-slate-400 font-mono text-[11px]">hrs</span>
              </div>
            </div>

            <div class="bg-slate-900/80 p-2.5 rounded-lg border border-white/10">
              <template v-if="esServicioValorFijo">
                <label class="text-[10px] text-purple-300 uppercase font-mono font-bold block flex items-center gap-1">
                  <span>💰</span> Valor Fijo Pactado ($)
                </label>
                <input 
                  type="number" 
                  step="10000" 
                  v-model.number="its.valor_fijo_pactado" 
                  @input="recalcularTotales"
                  class="w-full bg-slate-950 border border-purple-500/50 rounded px-2 py-1 font-mono font-bold text-purple-300 text-xs mt-0.5"
                />
              </template>
              <template v-else>
                <label class="text-[10px] text-slate-400 uppercase font-mono block">Valor Hora Pactado ($/hr)</label>
                <input 
                  type="number" 
                  step="1000" 
                  v-model.number="its.valor_hora_pactado" 
                  @input="recalcularTotales"
                  class="w-full bg-slate-950 border border-blue-500/40 rounded px-2 py-1 font-mono font-bold text-blue-300 text-xs mt-0.5"
                />
              </template>
            </div>

            <div class="bg-slate-900/80 p-2.5 rounded-lg border border-white/10">
              <label class="text-[10px] text-slate-400 uppercase font-mono block">Valor Flete / Traslado ($)</label>
              <input 
                type="number" 
                step="5000" 
                v-model.number="its.valor_flete_pactado" 
                @input="recalcularTotales"
                class="w-full bg-slate-950 border border-cyan-500/40 rounded px-2 py-1 font-mono font-bold text-cyan-300 text-xs mt-0.5"
              />
              <span class="text-[9px] text-cyan-400/80 block mt-0.5 font-mono">{{ etiquetaModalidadFlete }}</span>
            </div>

            <div class="bg-slate-900/80 p-2.5 rounded-lg border border-white/10">
              <span class="text-[10px] text-slate-400 uppercase font-mono block">Venta Neta Proyectada</span>
              <strong class="text-emerald-400 font-mono text-sm block mt-1">
                {{ formatMoneda(ventaNetaProyectadaComercial) }}
              </strong>
            </div>
          </div>

          <!-- Distancia Comercial y Responsabilidad de Pensiones Pactada en Cotización -->
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-3 text-xs mb-3">
            <div class="bg-slate-900/80 p-2.5 rounded-lg border border-amber-500/30">
              <span class="text-[10px] text-amber-400 uppercase font-mono font-bold block">Distancia Estimada Comercial</span>
              <strong class="text-white font-mono text-sm block mt-0.5">
                {{ (proyecto.distancia_km || proyecto.json_field?.crm_v1?.distancia_km) ? `${proyecto.distancia_km || proyecto.json_field?.crm_v1?.distancia_km} km (Ida desde Base)` : 'No especificada' }}
              </strong>
              <span class="text-[10px] text-slate-400 font-mono block">
                {{ Number(proyecto.distancia_km || proyecto.json_field?.crm_v1?.distancia_km || 0) > 30 ? '🌲 Régimen Rural (> 30 km)' : '🏢 Régimen Urbano (≤ 30 km)' }}
              </span>
            </div>
            <div class="lg:col-span-3 bg-slate-900/80 p-2.5 rounded-lg border border-white/10">
              <span class="text-[10px] text-amber-400 uppercase font-mono font-bold block mb-1.5">
                Responsabilidad de Pensiones Pactada en Cotización
              </span>
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                <div class="bg-slate-950/70 px-2 py-1 rounded border border-white/10">
                  <span class="text-slate-400 block text-[9px] uppercase">Alojamiento</span>
                  <strong :class="crmPensiones.alojamiento_costeado === 'CLIENTE' ? 'text-emerald-400' : (crmPensiones.alojamiento_costeado === 'SAN_PABLO' ? 'text-amber-400' : 'text-slate-400')">
                    {{ crmPensiones.alojamiento_costeado === 'CLIENTE' ? 'Costeado por Cliente' : (crmPensiones.alojamiento_costeado === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'No Aplica') }}
                  </strong>
                </div>
                <div class="bg-slate-950/70 px-2 py-1 rounded border border-white/10">
                  <span class="text-slate-400 block text-[9px] uppercase">Desayuno</span>
                  <strong :class="crmPensiones.desayuno_costeado === 'CLIENTE' ? 'text-emerald-400' : (crmPensiones.desayuno_costeado === 'SAN_PABLO' ? 'text-amber-400' : 'text-slate-400')">
                    {{ crmPensiones.desayuno_costeado === 'CLIENTE' ? 'Costeado por Cliente' : (crmPensiones.desayuno_costeado === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'No Aplica') }}
                  </strong>
                </div>
                <div class="bg-slate-950/70 px-2 py-1 rounded border border-white/10">
                  <span class="text-slate-400 block text-[9px] uppercase">Almuerzo</span>
                  <strong :class="crmPensiones.almuerzo_costeado === 'CLIENTE' ? 'text-emerald-400' : (crmPensiones.almuerzo_costeado === 'SAN_PABLO' ? 'text-amber-400' : 'text-slate-400')">
                    {{ crmPensiones.almuerzo_costeado === 'CLIENTE' ? 'Costeado por Cliente' : (crmPensiones.almuerzo_costeado === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'No Aplica') }}
                  </strong>
                </div>
                <div class="bg-slate-950/70 px-2 py-1 rounded border border-white/10">
                  <span class="text-slate-400 block text-[9px] uppercase">Cena</span>
                  <strong :class="crmPensiones.cena_costeado === 'CLIENTE' ? 'text-emerald-400' : (crmPensiones.cena_costeado === 'SAN_PABLO' ? 'text-amber-400' : 'text-slate-400')">
                    {{ crmPensiones.cena_costeado === 'CLIENTE' ? 'Costeado por Cliente' : (crmPensiones.cena_costeado === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'No Aplica') }}
                  </strong>
                </div>
                <div class="bg-slate-950/70 px-2 py-1 rounded border border-white/10">
                  <span class="text-slate-400 block text-[9px] uppercase">Traslado Personal</span>
                  <strong :class="crmPensiones.traslado_costeado === 'CLIENTE' ? 'text-emerald-400' : (crmPensiones.traslado_costeado === 'SAN_PABLO' ? 'text-amber-400' : 'text-slate-400')">
                    {{ crmPensiones.traslado_costeado === 'CLIENTE' ? 'Costeado por Cliente' : (crmPensiones.traslado_costeado === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'No Aplica') }}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Tripulación y Recursos Asignados -->
          <div class="bg-slate-950/60 p-3 rounded-lg border border-white/10">
            <span class="text-[11px] font-mono font-bold uppercase text-slate-400 block mb-2">
              Recursos Asignados en Faena
            </span>
            <div class="flex flex-wrap items-center gap-3">
              <div v-for="eq in asignaciones.equipos" :key="eq.id_equipo || eq.patente" class="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-md border border-white/15 text-xs">
                <span class="text-amber-400">🚜</span>
                <span class="font-mono font-bold text-white">{{ eq.patente }}</span>
                <span class="text-slate-400 text-[11px]">{{ eq.modelo }}</span>
                <span v-if="resolverConductorOperadorEquipo(eq)" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <span>👷</span>
                  <span>{{ resolverConductorOperadorEquipo(eq) }}</span>
                </span>
              </div>

              <div v-for="per in asignaciones.personal" :key="per.id_user" class="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-md border border-white/15 text-xs">
                <span class="text-blue-400">👷</span>
                <span class="text-slate-200">{{ per.name_frst }} {{ per.apellido_pat }}</span>
                <span class="bg-blue-950/80 text-blue-300 border border-blue-700/50 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">
                  {{ per.rol_personal || 'TRIPULANTE' }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- SECCIÓN 2: CONTROL DE FLOTA Y VALIDACIÓN DE HORAS (JORNADAS) -->
        <section class="bg-[#080d1a] border border-white/15 rounded-xl p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-3.5 gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold uppercase text-blue-400 tracking-wider flex items-center gap-2">
                <span>⏱️</span> Sección 2: Control de Flota y Validación de Horas (Jornadas)
              </span>
              <span class="bg-blue-950 text-blue-300 border border-blue-700/50 text-xs font-mono px-2 py-0.5 rounded">
                {{ jornadasActivas.length }} Jornadas Activas
              </span>
              <span
                class="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider border"
                :class="its.tipo_contexto === 'RURAL' ? 'bg-amber-950/80 text-amber-300 border-amber-600/50' : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'"
              >
                {{ its.tipo_contexto === 'RURAL' ? 'Servicio Rural' : 'Servicio Urbano' }}
              </span>
            </div>
            
            <div class="flex items-center gap-2 flex-wrap">
              <button 
                type="button" 
                @click="agregarJornada" 
                class="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>+</span>
                <span>Agregar Jornada</span>
              </button>
              <button 
                type="button" 
                @click="agregarJornadaDocFisico" 
                class="px-2.5 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Regularizar jornada con boleta manual escaneada firmada por ITO"
              >
                <span>📄</span>
                <span>+ Doc Físico (Vía A)</span>
              </button>
              <button 
                type="button" 
                @click="agregarJornadaPisoMinimo" 
                class="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Cobro de piso mínimo contractual de 8 hrs por paralización / standby mandante"
              >
                <span>⚖️</span>
                <span>+ Piso Mínimo (Vía B)</span>
              </button>
              <button 
                type="button" 
                @click="agregarFlete('Flete Solo Ida')" 
                class="px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Agregar tramo físico de flete o traslado"
              >
                <span>🚚</span>
                <span>+ Agregar Flete</span>
              </button>
            </div>
          </div>

          <!-- TABLA DE JORNADAS -->
          <div class="overflow-x-auto border border-white/10 rounded-lg">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-white/10">
                <tr>
                  <th class="p-2.5">Fecha</th>
                  <th class="p-2.5">Tipo Servicio</th>
                  <th class="p-2.5">Patente</th>
                  <th class="p-2.5">Salida</th>
                  <th class="p-2.5">Llegada</th>
                  <th class="p-2.5">Término</th>
                  <th class="p-2.5">Retorno</th>
                  <th class="p-2.5">Colación</th>
                  <th class="p-2.5" :title="its.tipo_contexto === 'RURAL' ? 'Política Rural: Llegada a Obra → Término' : 'Política Urbana: Salida San Pablo → Término'">Hrs Servicio</th>
                  <th class="p-2.5 text-cyan-300" title="Puerta a Puerta: Salida San Pablo → Retorno San Pablo">Hrs Viáticos</th>
                  <th class="p-2.5 text-amber-300">Hrs Report</th>
                  <th class="p-2.5 text-blue-300 text-right">Tarifa $/hr</th>
                  <th class="p-2.5 text-emerald-300 text-right">Subtotal</th>
                  <th class="p-2.5">N° Report</th>
                  <th class="p-2.5 text-center">V°B°</th>
                  <th class="p-2.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 font-mono">
                <tr 
                  v-for="(j, idx) in jornadas" 
                  :key="idx" 
                  :class="j.es_oculta ? 'bg-amber-950/20 opacity-60 line-through text-slate-500' : 'hover:bg-white/[0.02]'"
                  class="transition-colors"
                >
                  <td class="p-2">
                    <input type="date" v-model="j.fecha" class="bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-xs text-white" />
                  </td>

                  <td class="p-2">
                    <select v-model="j.tipo_servicio" @change="calcularHorasReales(j)" class="bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-xs text-white">
                      <option value="Hora">Hora</option>
                      <option value="Mensual">Mensual</option>
                      <option value="Valor Fijo">Valor Fijo</option>
                      <option value="Fijo">Fijo</option>
                      <option value="Registro de Viaje">Registro de Viaje</option>
                      <option value="Traslado">Traslado</option>
                      <option value="Flete Ida y Retorno">Flete Ida y Retorno</option>
                      <option value="Flete Solo Ida">Flete Solo Ida</option>
                      <option value="Flete Solo Retorno">Flete Solo Retorno</option>
                      <option value="Visita Terreno">Visita Terreno</option>
                      <option value="Interno">Interno</option>
                    </select>

                    <!-- Punto 4: Detalle compacto de Registro de Viaje / Traslado -->
                    <div v-if="j.tipo_servicio === 'Registro de Viaje' || j.tipo_servicio === 'Traslado'" class="mt-1 flex flex-col gap-1">
                      <select 
                        v-model="j.tipo_viaje" 
                        class="bg-slate-900 border border-cyan-500/40 rounded px-1 py-0.5 text-[10px] text-cyan-300 font-bold font-mono outline-none"
                        title="Tipo de Viaje / Trayecto"
                      >
                        <option value="" disabled>-- Tipo Viaje --</option>
                        <option value="IDA Y VUELTA">Ida y Vuelta</option>
                        <option value="SOLO IDA">Solo Ida</option>
                        <option value="SOLO RETORNO">Solo Retorno</option>
                        <option value="APOYO / CONTRAPESOS">Apoyo / Contrapesos</option>
                      </select>
                      <input 
                        type="text" 
                        v-model="j.comentario_viaje" 
                        placeholder="Comentario del viaje..." 
                        class="bg-slate-900 border border-white/15 rounded px-1.5 py-0.5 text-[10px] text-slate-200 outline-none focus:border-cyan-500" 
                      />
                    </div>
                  </td>

                  <td class="p-2">
                    <input type="text" v-model="j.patente" placeholder="GH-JK-88" class="w-20 bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-xs text-white font-bold" />
                    <div v-if="j.conductor_nombre || j.equipo_modelo" class="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[130px]" :title="j.conductor_nombre ? `${j.conductor_nombre} (${j.equipo_modelo || ''})` : j.equipo_modelo">
                      {{ j.conductor_nombre || j.equipo_modelo }}
                    </div>
                  </td>

                  <td class="p-2">
                    <input type="time" v-model="j.hora_salida" @change="calcularHorasReales(j)" class="bg-slate-950 border border-white/10 rounded px-1 py-1 text-xs text-white" />
                  </td>

                  <td class="p-2">
                    <input type="time" v-model="j.hora_llegada" @change="calcularHorasReales(j)" class="bg-slate-950 border border-white/10 rounded px-1 py-1 text-xs text-white" />
                  </td>

                  <td class="p-2">
                    <input type="time" v-model="j.hora_termino" @change="calcularHorasReales(j)" class="bg-slate-950 border border-white/10 rounded px-1 py-1 text-xs text-white" />
                  </td>

                  <td class="p-2">
                    <input type="time" v-model="j.hora_retorno" @change="calcularHorasReales(j)" class="bg-slate-950 border border-white/10 rounded px-1 py-1 text-xs text-white" />
                  </td>

                  <td class="p-2">
                    <div class="flex items-center gap-1">
                      <select v-model.number="j.colacion_minutos" @change="calcularHorasReales(j)" class="bg-slate-950 border border-white/10 rounded px-1 py-1 text-xs text-white">
                        <option :value="0">0m</option>
                        <option :value="30">30m</option>
                        <option :value="45">45m</option>
                        <option :value="60">60m</option>
                        <option :value="90">90m</option>
                      </select>
                    </div>
                  </td>

                  <td class="p-2 font-bold text-slate-300 font-mono">
                    <template v-if="esPerfilYara">
                      <div class="flex items-center gap-1">
                        <input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          v-model.number="j.horas_reales" 
                          @input="onHorasRealesManualChange(j)"
                          class="w-16 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded px-1.5 py-0.5 text-xs text-white font-mono text-right"
                          title="Hora de Servicio editable (Perfil Yara)"
                        />
                        <span class="text-[10px] text-slate-400">h</span>
                      </div>
                    </template>
                    <template v-else>
                      {{ formatHorasHHMM(j.horas_reales) }} hrs
                    </template>
                  </td>

                  <td class="p-2 font-bold text-cyan-300 font-mono">
                    <template v-if="esPerfilYara">
                      <div class="flex items-center gap-1">
                        <input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          v-model.number="j.horas_viaticos" 
                          @input="onHorasViaticosManualChange(j)"
                          class="w-16 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded px-1.5 py-0.5 text-xs text-cyan-300 font-mono text-right"
                          title="Hora de Viático editable (Perfil Yara)"
                        />
                        <span class="text-[10px] text-cyan-400">h</span>
                      </div>
                    </template>
                    <template v-else>
                      {{ formatHorasHHMM(j.horas_viaticos) }} hrs
                    </template>
                  </td>

                  <td class="p-2">
                    <input 
                      type="number" 
                      step="0.5" 
                      v-model.number="j.horas_report" 
                      @input="recalcularTotales" 
                      class="w-16 bg-slate-950 border border-amber-500/50 rounded px-2 py-1 font-mono font-bold text-amber-300 text-xs text-right"
                    />
                  </td>

                  <td class="p-2 text-right">
                    <input 
                      type="number" 
                      step="1000" 
                      v-model.number="j.tarifa_hora" 
                      @input="recalcularTotales" 
                      class="w-20 bg-slate-950 border border-blue-500/40 rounded px-1.5 py-1 font-mono font-bold text-blue-300 text-xs text-right"
                    />
                  </td>

                  <td class="p-2 font-mono font-bold text-emerald-400 text-right">
                    {{ formatMoneda(j.subtotal) }}
                  </td>

                  <td class="p-2">
                    <div class="flex items-center gap-1">
                      <span 
                        v-if="j.tipo_respaldo === 'PISO_MINIMO' || (j.numero_report && j.numero_report.includes('PISO-MIN'))" 
                        class="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-[9px] shrink-0"
                        title="Piso Mínimo Contractual (Standby imputable al mandante)"
                      >
                        ⚖️ Piso Mín.
                      </span>
                      <span 
                        v-else-if="j.tipo_respaldo === 'FISICO_MANUAL' || (j.numero_report && (j.numero_report.includes('DOC-FIS') || j.numero_report.includes('BOL-')))" 
                        class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[9px] shrink-0"
                        title="Reporte físico regularizado con boleta manual escaneada"
                      >
                        📄 Doc Físico
                      </span>
                      <span 
                        v-else-if="j.codigo_validacion_fes || j.cliente_firma_canvas_base64" 
                        class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[9px] shrink-0"
                        title="Firmado digitalmente en terreno (FES)"
                      >
                        🟢 FES
                      </span>
                      <input type="text" v-model="j.numero_report" placeholder="REP-101" class="w-24 bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-xs text-slate-300 font-mono" />
                    </div>
                  </td>

                  <td class="p-2 text-center">
                    <input type="checkbox" v-model="j.vb_conciliado" class="rounded border-white/20 text-blue-500 cursor-pointer" />
                  </td>

                  <td class="p-2 text-center no-strike">
                    <div class="flex items-center justify-center gap-1.5">
                      <button 
                        type="button"
                        @click="toggleOcultarFila(j)" 
                        :title="j.es_oculta ? 'Restaurar fila y sumar al cálculo' : 'Tachar fila (no cobrar)'"
                        :class="j.es_oculta ? 'bg-amber-950/80 text-amber-300 border-amber-600/40' : 'bg-slate-800 text-slate-300 border-white/10 hover:text-white'"
                        class="px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer transition-colors"
                      >
                        {{ j.es_oculta ? 'Tachada' : 'Activa' }}
                      </button>
                      <button 
                        type="button"
                        @click="eliminarJornada(idx)" 
                        title="Eliminar jornada"
                        class="p-1 rounded bg-rose-900/30 hover:bg-rose-900/60 text-rose-300 cursor-pointer transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="jornadas.length === 0">
                  <td colspan="16" class="p-6 text-center text-slate-500 font-sans text-xs">
                    No hay jornadas registradas. Presione "+ Agregar Jornada" para incorporar días de faena.
                  </td>
                </tr>
              </tbody>

              <!-- FOOTER DE TOTALES DE JORNADAS -->
              <tfoot class="bg-slate-950 border-t border-white/15 font-mono text-xs">
                <tr>
                  <td colspan="8" class="p-2.5 text-right uppercase text-slate-400 font-bold">
                    Total Horas Facturables (Jornadas Activas):
                  </td>
                  <td class="p-2.5 font-bold text-slate-300">
                    {{ formatHorasHHMM(totalHorasRealesActivas) }} hrs
                  </td>
                  <td class="p-2.5 font-bold text-cyan-300">
                    {{ formatHorasHHMM(totalHorasViaticosActivas) }} hrs
                  </td>
                  <td class="p-2.5 font-black text-amber-300 text-sm">
                    {{ formatHorasHHMM(its.total_horas_report) }} hrs
                  </td>
                  <td class="p-2.5 text-slate-400 text-right text-[11px]">
                    Tarifa Base: {{ formatMoneda(its.valor_hora_pactado) }}
                  </td>
                  <td class="p-2.5 font-black text-emerald-400 text-right text-sm">
                    {{ formatMoneda(its.total_ingresos_horas) }}
                  </td>
                  <td colspan="3" class="p-2.5 text-slate-400 text-[11px]">
                    + Flete: <strong class="text-cyan-300">{{ formatMoneda(its.total_ingresos_fletes) }}</strong> = Total: <strong class="text-emerald-300">{{ formatMoneda(its.total_ingresos_facturables) }}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <!-- SECCIÓN 3: PLANILLA DE COSTOS OPERACIONALES DIRECTOS (10 CATEGORÍAS) -->
        <section class="bg-[#080d1a] border border-white/15 rounded-xl p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-3.5 gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider flex items-center gap-2">
                <span>💰</span> Sección 3: Costos Operacionales Directos de Terreno (10 Categorías)
              </span>
              <span class="bg-rose-950/80 text-rose-300 border border-rose-700/50 text-xs font-mono px-2 py-0.5 rounded font-bold">
                Total Costos: {{ formatMoneda(its.total_costos_operacionales) }}
              </span>
              <!-- Badge Consolidado Auditoría -->
              <span 
                :class="totalCategoriasAuditadas === 10 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50' : 'bg-amber-950/80 text-amber-300 border-amber-700/50'"
                class="border text-[11px] font-mono px-2 py-0.5 rounded font-bold flex items-center gap-1"
              >
                <span>{{ totalCategoriasAuditadas === 10 ? '✅' : '⚠️' }}</span>
                <span>Auditoría: {{ totalCategoriasAuditadas }}/10 Categorías</span>
              </span>
            </div>

            <!-- Selector de Pestaña de Categoría -->
            <div class="flex flex-wrap items-center gap-1 text-[11px] font-mono">
              <button 
                v-for="tab in categoriasCostosTabs" 
                :key="tab.key" 
                type="button"
                @click="tabCostoActiva = tab.key"
                :class="tabCostoActiva === tab.key 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow' 
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/10'"
                class="px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>{{ tab.label }} ({{ (costos[tab.key] || []).length }})</span>
                <span v-if="getEstadoCategoria(tab.key) === 'CON_COSTOS'" class="text-[10px] text-emerald-400 font-bold" title="Con costos imputados">✔</span>
                <span v-else-if="getEstadoCategoria(tab.key) === 'SIN_COSTO'" class="text-[10px] text-blue-400 font-bold" title="Confirmado sin costo">✓</span>
                <span v-else class="text-[10px] text-amber-400 font-bold animate-pulse" title="Pendiente de revisión">⚠️</span>
              </button>
            </div>
          </div>

          <!-- TABLA DINÁMICA DE LA CATEGORÍA ACTIVA -->
          <div class="bg-slate-950/70 border border-white/10 rounded-lg p-3">
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-xs font-mono font-bold text-slate-300 uppercase">
                {{ getTabActualLabel() }} — Subtotal: <strong class="text-rose-400 font-mono">{{ formatMoneda(getSubtotalCategoria(tabCostoActiva)) }}</strong>
              </span>
              <div class="flex items-center gap-2">
                <!-- Toggle Declarar Sin Costo -->
                <button 
                  v-if="(costos[tabCostoActiva] || []).length === 0"
                  type="button" 
                  @click="toggleDeclararSinCosto(tabCostoActiva)" 
                  :class="categoriasSinCosto[tabCostoActiva] 
                    ? 'bg-blue-950/80 hover:bg-blue-900 text-blue-300 border-blue-600' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-white/20'"
                  class="px-2 py-1 rounded border text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{{ categoriasSinCosto[tabCostoActiva] ? '✅' : '⚪' }}</span>
                  <span>{{ categoriasSinCosto[tabCostoActiva] ? 'Confirmado Sin Costo' : 'Declarar Sin Costo' }}</span>
                </button>
                <button 
                  type="button" 
                  @click="agregarItemCosto(tabCostoActiva)" 
                  class="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>+</span>
                  <span>Agregar Ítem</span>
                </button>
              </div>
            </div>

              <!-- CASO COMBUSTIBLE (Precarga de Convoy + Ingreso Manual) -->
              <div v-if="tabCostoActiva === 'combustible'">
                <!-- Resumen Multiestanque -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  <div class="bg-slate-900/90 border border-blue-500/30 rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase font-mono block">🚚 Estanque Chasis (Traslado)</span>
                      <strong class="text-white text-xs font-mono">{{ totalLitrosChasis.toFixed(1) }} L</strong>
                    </div>
                    <span class="text-xs font-mono font-bold text-rose-300">{{ formatMoneda(totalMontoChasis) }}</span>
                  </div>
                  <div class="bg-slate-900/90 border border-amber-500/30 rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase font-mono block">Estanque Superestructura (Grúa Telescópica)</span>
                      <strong class="text-white text-xs font-mono">{{ totalLitrosGrua.toFixed(1) }} L</strong>
                    </div>
                    <span class="text-xs font-mono font-bold text-amber-300">{{ formatMoneda(totalMontoGrua) }}</span>
                  </div>
                  <div class="bg-slate-900/90 border border-purple-500/30 rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <span class="text-[10px] text-slate-400 uppercase font-mono block">⛽ Auxiliar / Bidón Faena</span>
                      <strong class="text-white text-xs font-mono">{{ totalLitrosBidon.toFixed(1) }} L</strong>
                    </div>
                    <span class="text-xs font-mono font-bold text-purple-300">{{ formatMoneda(totalMontoBidon) }}</span>
                  </div>
                </div>

                <table class="w-full text-xs text-left">
                  <thead class="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th class="p-2">Fecha</th>
                      <th class="p-2">Patente</th>
                      <th class="p-2">Estanque</th>
                      <th class="p-2 text-right">Litros</th>
                      <th class="p-2">N° Comprobante / Copec</th>
                      <th class="p-2 text-center">Voucher / Evidencia</th>
                      <th class="p-2 text-center">Origen</th>
                      <th class="p-2 text-right text-rose-300">Total Costo ($)</th>
                      <th class="p-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 font-mono">
                    <tr v-for="(it, idx) in costos.combustible" :key="idx" class="hover:bg-white/[0.02]">
                      <td class="p-1.5"><input type="date" v-model="it.fecha" class="bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white" /></td>
                      <td class="p-1.5">
                        <select v-model="it.patente" class="w-28 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white font-bold font-mono">
                          <option value="" disabled>Patente...</option>
                          <option v-for="eq in patentesAsignadas" :key="eq.patente" :value="eq.patente">
                            {{ eq.patente }} ({{ eq.tipo_equipo || eq.modelo || 'Equipo' }})
                          </option>
                          <option v-if="it.patente && !patentesAsignadas.some(e => e.patente === it.patente)" :value="it.patente">{{ it.patente }}</option>
                        </select>
                      </td>
                      <td class="p-1.5">
                        <select v-model="it.tipo_estanque" class="bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white">
                          <option value="PRINCIPAL_CHASIS">Principal (Chasis)</option>
                          <option value="SUPERESTRUCTURA_GRUA">Superestructura (Grúa)</option>
                          <option value="AUXILIAR_BIDON">Auxiliar / Bidón</option>
                        </select>
                      </td>
                      <td class="p-1.5 text-right"><input type="number" step="0.5" v-model.number="it.cantidad_unidades" @input="recalcularTotales" class="w-16 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white text-right font-bold text-amber-300" /></td>
                      <td class="p-1.5"><input type="text" v-model="it.numero_oc" placeholder="#COPEC-123" class="w-28 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white font-mono" /></td>
                      <td class="p-1.5 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                          <div v-if="it.archivo_comprobante_url" class="relative group">
                            <img 
                              :src="resolverUrlArchivo(it.archivo_comprobante_url)" 
                              class="w-8 h-8 object-cover rounded border border-blue-500/60 shadow cursor-pointer hover:scale-110 transition-transform bg-slate-900"
                              @click="abrirVisorImagen(it.archivo_comprobante_url)"
                              title="Clic para ampliar voucher"
                            />
                            <button 
                              type="button" 
                              @click="it.archivo_comprobante_url = ''" 
                              class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Eliminar voucher"
                            >
                              ✕
                            </button>
                          </div>
                          <label class="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/15 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1" :title="it.archivo_comprobante_url ? 'Cambiar fotografía' : 'Adjuntar fotografía'">
                            <span>📷</span>
                            <span v-if="!it.archivo_comprobante_url" class="text-[9px]">Subir</span>
                            <input type="file" accept="image/*,application/pdf" @change="subirComprobante($event, it)" class="hidden" />
                          </label>
                        </div>
                      </td>
                      <td class="p-1.5 text-center">
                        <span v-if="it.origen_registro === 'CONVOY_VIAJE' || it.origen_registro === 'PWA_CONVOY'" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">🛰️ PWA</span>
                        <span v-else class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-700/50">✍️ Manual</span>
                      </td>
                      <td class="p-1.5 text-right"><input type="number" v-model.number="it.monto_total" @input="recalcularTotales" class="w-24 bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white text-right font-bold text-rose-300" /></td>
                      <td class="p-1.5 text-center"><button type="button" @click="eliminarItemCosto('combustible', idx)" class="text-rose-400 hover:text-rose-200 cursor-pointer">🗑️</button></td>
                    </tr>
                    <tr v-if="costos.combustible.length === 0">
                      <td colspan="9" class="p-4 text-center text-slate-500 font-sans">Sin cargas de combustible registradas.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- CASO MOVILIZACIÓN (Pasajes, Uber, Taxi, Transfer) -->
              <div v-else-if="tabCostoActiva === 'movilizacion'">
                <table class="w-full text-xs text-left">
                  <thead class="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th class="p-2">Fecha</th>
                      <th class="p-2">Personal Tripulación</th>
                      <th class="p-2">Tipo Movilización</th>
                      <th class="p-2">Detalle / Ruta</th>
                      <th class="p-2">N° Boleta / Voucher</th>
                      <th class="p-2 text-center">Comprobante</th>
                      <th class="p-2 text-right text-rose-300">Monto ($)</th>
                      <th class="p-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 font-mono">
                    <tr v-for="(it, idx) in costos.movilizacion" :key="idx" class="hover:bg-white/[0.02]">
                      <td class="p-1.5"><input type="date" v-model="it.fecha" class="bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white" /></td>
                      <td class="p-1.5">
                        <select v-model="it.nombre_personal" class="w-36 bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white">
                          <option value="" disabled>Seleccione tripulante...</option>
                          <option v-for="p in personalAsignadoLista" :key="p.id_user || p.nombre" :value="p.nombre">
                            {{ p.nombre }} ({{ p.rol }})
                          </option>
                          <option v-if="it.nombre_personal && !personalAsignadoLista.some(p => p.nombre === it.nombre_personal)" :value="it.nombre_personal">{{ it.nombre_personal }}</option>
                        </select>
                      </td>
                      <td class="p-1.5">
                        <select v-model="it.tipo_movilizacion" @change="sincronizarGlosaMovilizacion(it)" class="bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white">
                          <option value="UBER / TAXI">Uber / Taxi</option>
                          <option value="PASAJE BUS">Pasaje Bus Interurbano</option>
                          <option value="PASAJE AVION">Pasaje Aéreo</option>
                          <option value="TRANSFER">Transfer Aeropuerto/Terminal</option>
                          <option value="OTROS">Otro Gasto de Traslado</option>
                        </select>
                      </td>
                      <td class="p-1.5"><input type="text" v-model="it.ruta_detalle" placeholder="Glosa / Ruta / Tramo" @input="sincronizarGlosaMovilizacion(it)" class="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white" /></td>
                      <td class="p-1.5"><input type="text" v-model="it.numero_oc" placeholder="Boleta #1234" class="w-28 bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white font-mono" /></td>
                      <td class="p-1.5 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                          <div v-if="it.archivo_comprobante_url" class="relative group">
                            <img 
                              :src="resolverUrlArchivo(it.archivo_comprobante_url)" 
                              class="w-8 h-8 object-cover rounded border border-blue-500/60 shadow cursor-pointer hover:scale-110 transition-transform bg-slate-900"
                              @click="abrirVisorImagen(it.archivo_comprobante_url)"
                              title="Clic para ampliar comprobante"
                            />
                            <button 
                              type="button" 
                              @click="it.archivo_comprobante_url = ''" 
                              class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Eliminar comprobante"
                            >
                              ✕
                            </button>
                          </div>
                          <label class="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/15 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1" :title="it.archivo_comprobante_url ? 'Cambiar fotografía' : 'Adjuntar fotografía'">
                            <span>📷</span>
                            <span v-if="!it.archivo_comprobante_url" class="text-[9px]">Subir</span>
                            <input type="file" accept="image/*,application/pdf" @change="subirComprobante($event, it)" class="hidden" />
                          </label>
                        </div>
                      </td>
                      <td class="p-1.5 text-right"><input type="number" v-model.number="it.monto_total" @input="recalcularTotales" class="w-24 bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white text-right font-bold text-rose-300" /></td>
                      <td class="p-1.5 text-center"><button type="button" @click="eliminarItemCosto('movilizacion', idx)" class="text-rose-400 hover:text-rose-200 cursor-pointer">🗑️</button></td>
                    </tr>
                    <tr v-if="costos.movilizacion.length === 0">
                      <td colspan="8" class="p-4 text-center text-slate-500 font-sans">Sin gastos de movilización imputados.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- CASO PENSIONES Y ALOJAMIENTO (Condiciones CRM Contractuales Predefinidas) -->
              <div v-else-if="tabCostoActiva === 'pensiones'">
                <div class="mb-3 p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span class="text-blue-300 font-bold flex items-center gap-1.5">
                    <span>📋</span> <span>Condiciones Comerciales Contractuales (CRM):</span>
                  </span>
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2 py-0.5 rounded border text-[11px]" :class="crmPensiones.desayuno_costeado === 'SAN_PABLO' ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'">
                      Desayuno: <strong>{{ crmPensiones.desayuno_costeado === 'SAN_PABLO' ? 'A cargo GSP' : 'A cargo Mandante' }}</strong>
                    </span>
                    <span class="px-2 py-0.5 rounded border text-[11px]" :class="crmPensiones.almuerzo_costeado === 'SAN_PABLO' ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'">
                      Almuerzo: <strong>{{ crmPensiones.almuerzo_costeado === 'SAN_PABLO' ? 'A cargo GSP' : 'A cargo Mandante' }}</strong>
                    </span>
                    <span class="px-2 py-0.5 rounded border text-[11px]" :class="crmPensiones.cena_costeado === 'SAN_PABLO' ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'">
                      Cena: <strong>{{ crmPensiones.cena_costeado === 'SAN_PABLO' ? 'A cargo GSP' : 'A cargo Mandante' }}</strong>
                    </span>
                    <span class="px-2 py-0.5 rounded border text-[11px]" :class="crmPensiones.alojamiento_costeado === 'SAN_PABLO' ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'">
                      Alojamiento: <strong>{{ crmPensiones.alojamiento_costeado === 'SAN_PABLO' ? 'A cargo GSP' : 'A cargo Mandante' }}</strong>
                    </span>
                    <span class="px-2 py-0.5 rounded border text-[11px]" :class="crmPensiones.traslado_costeado === 'SAN_PABLO' ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'">
                      Traslado: <strong>{{ crmPensiones.traslado_costeado === 'SAN_PABLO' ? 'A cargo GSP' : 'A cargo Mandante' }}</strong>
                    </span>
                  </div>
                </div>

                <table class="w-full text-xs text-left">
                  <thead class="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th class="p-2">Fecha</th>
                      <th class="p-2">N° OC</th>
                      <th class="p-2">Personal</th>
                      <th class="p-2">
                        <span>Desayuno ($)</span>
                        <span class="block text-[9px] font-normal" :class="crmPensiones.desayuno_costeado === 'SAN_PABLO' ? 'text-amber-400' : 'text-emerald-400'">({{ crmPensiones.desayuno_costeado === 'SAN_PABLO' ? 'GSP' : 'Mandante' }})</span>
                      </th>
                      <th class="p-2">
                        <span>Almuerzo ($)</span>
                        <span class="block text-[9px] font-normal" :class="crmPensiones.almuerzo_costeado === 'SAN_PABLO' ? 'text-amber-400' : 'text-emerald-400'">({{ crmPensiones.almuerzo_costeado === 'SAN_PABLO' ? 'GSP' : 'Mandante' }})</span>
                      </th>
                      <th class="p-2">
                        <span>Cena ($)</span>
                        <span class="block text-[9px] font-normal" :class="crmPensiones.cena_costeado === 'SAN_PABLO' ? 'text-amber-400' : 'text-emerald-400'">({{ crmPensiones.cena_costeado === 'SAN_PABLO' ? 'GSP' : 'Mandante' }})</span>
                      </th>
                      <th class="p-2">
                        <span>Alojamiento ($)</span>
                        <span class="block text-[9px] font-normal" :class="crmPensiones.alojamiento_costeado === 'SAN_PABLO' ? 'text-amber-400' : 'text-emerald-400'">({{ crmPensiones.alojamiento_costeado === 'SAN_PABLO' ? 'GSP' : 'Mandante' }})</span>
                      </th>
                      <th class="p-2">
                        <span>Traslado ($)</span>
                        <span class="block text-[9px] font-normal" :class="crmPensiones.traslado_costeado === 'SAN_PABLO' ? 'text-amber-400' : 'text-emerald-400'">({{ crmPensiones.traslado_costeado === 'SAN_PABLO' ? 'GSP' : 'Mandante' }})</span>
                      </th>
                      <th class="p-2 text-rose-300">Costo GSP ($)</th>
                      <th class="p-2 text-slate-400">Mandante ($)</th>
                      <th class="p-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 font-mono">
                    <tr v-for="(it, idx) in costos.pensiones" :key="idx" class="hover:bg-white/[0.02]">
                      <td class="p-1.5"><input type="date" v-model="it.fecha" class="bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white" /></td>
                      <td class="p-1.5"><input type="text" v-model="it.numero_oc" placeholder="OC-994" class="w-20 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white font-mono" /></td>
                      <td class="p-1.5"><input type="text" v-model="it.nombre_personal" placeholder="Nombre" class="w-28 bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white" /></td>
                      <td class="p-1.5"><input type="number" v-model.number="it.monto_desayuno" @input="recalcularPension(it)" class="w-20 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white text-right" /></td>
                      <td class="p-1.5"><input type="number" v-model.number="it.monto_almuerzo" @input="recalcularPension(it)" class="w-20 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white text-right" /></td>
                      <td class="p-1.5"><input type="number" v-model.number="it.monto_cena" @input="recalcularPension(it)" class="w-20 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white text-right" /></td>
                      <td class="p-1.5"><input type="number" v-model.number="it.monto_alojamiento" @input="recalcularPension(it)" class="w-20 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white text-right" /></td>
                      <td class="p-1.5"><input type="number" v-model.number="it.monto_traslado" @input="recalcularPension(it)" class="w-20 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white text-right" /></td>
                      <td class="p-1.5 font-bold text-rose-300 text-right">{{ formatMoneda(it.monto_total) }}</td>
                      <td class="p-1.5 font-bold text-slate-400 text-right">{{ formatMoneda(it.monto_total_cliente || 0) }}</td>
                      <td class="p-1.5 text-center">
                        <button type="button" @click="eliminarItemCosto('pensiones', idx)" class="text-rose-400 hover:text-rose-200 cursor-pointer">🗑️</button>
                      </td>
                    </tr>
                    <tr v-if="costos.pensiones.length === 0">
                      <td colspan="11" class="p-4 text-center text-slate-500 font-sans">Sin gastos de pensión registrados.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- CASO COSTO HORA OPERADOR (Consolidación Diaria por Movimiento: Operador + Rigger RRHH/Contabilidad) -->
              <div v-else-if="tabCostoActiva === 'costo_hora_operador'">
                <!-- BANNER REGLA COMERCIAL tpar_tarifa_operador + RÉGIMEN URBANO / RURAL -->
                <div class="mb-2.5 px-3 py-2 bg-slate-900/90 border border-indigo-500/30 rounded-lg flex flex-col gap-1.5 text-xs">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold text-[10px]">tpar_tarifa_operador</span>
                      <span class="text-slate-300">
                        Tarifa Comercial Comprometida:
                        <strong class="text-white font-mono">{{ tarifaOperadorComercial?.categoria || 'Según línea cotizada' }}</strong>
                        <strong class="text-emerald-300 font-mono ml-1">({{ formatMoneda(tarifaOperadorComercial?.valor_hora || 0) }}/hr)</strong>
                      </span>
                    </div>
                    <span class="text-[11px] text-slate-400">
                      Incluye <strong class="text-sky-300">Operador</strong> (liquidación horaria) y <strong class="text-purple-300">Rigger</strong> (sueldo fijo $0, registro de horas para RRHH/Contabilidad)
                    </span>
                  </div>
                  <div class="pt-1.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <div v-if="its.tipo_contexto === 'RURAL'" class="flex items-center gap-2 text-amber-300">
                      <span class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 font-bold">🌲 RÉGIMEN RURAL (&gt; 30 km{{ proyecto.distancia_km ? ` · ${proyecto.distancia_km} km` : '' }})</span>
                      <span class="text-slate-300"><strong>Hrs Faena</strong> = Máx(Mín {{ its.horas_minimas_pactadas || 8 }}h, (Término − Llegada) − Colación) + <strong>Hrs Flete</strong> = (Ida + Retorno) al mismo valor hora</span>
                    </div>
                    <div v-else class="flex items-center gap-2 text-blue-300">
                      <span class="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 font-bold">🏢 RÉGIMEN URBANO (&le; 30 km{{ proyecto.distancia_km ? ` · ${proyecto.distancia_km} km` : '' }})</span>
                      <span class="text-slate-300"><strong>Hrs a Pagar</strong> = (Hora Término Obra − Hora Salida Planta) − Colación · <strong>Hrs Flete = 0 hrs</strong></span>
                    </div>
                  </div>
                </div>

                <!-- BANNER AUDITORÍA CONTROL DE GESTIÓN (YARA) -->
                <div v-if="costos.costo_hora_operador.some(it => it.tarifa_modificada)" class="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-amber-300 text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-amber-400 font-bold">⚠️ Tarifa Modificada por Control de Gestión</span>
                    <span class="text-slate-400 text-[11px]">(Valores editados respecto a la tarifa comercial sugerida en tpar_tarifa_operador)</span>
                  </div>
                  <span class="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200 font-mono">Auditoría Control de Gestión</span>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-xs text-left">
                    <thead class="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-white/10">
                      <tr>
                        <th class="p-2">Fecha</th>
                        <th class="p-2">Equipo</th>
                        <th class="p-2">Persona / Rol</th>
                        <th class="p-1.5 text-center">Salida</th>
                        <th class="p-1.5 text-center">Llegada</th>
                        <th class="p-1.5 text-center">Término</th>
                        <th class="p-1.5 text-center">Retorno</th>
                        <th class="p-1.5 text-center">Colación</th>
                        <th class="p-1.5 text-center text-sky-300">Hrs Reales</th>
                        <th class="p-1.5 text-center text-amber-300" title="Stand By Grúas San Pablo">SB GSP</th>
                        <th class="p-1.5 text-center text-indigo-300" title="Stand By Cliente">SB Cli</th>
                        <th class="p-1.5 text-right text-emerald-300">Hrs Pagar</th>
                        <th class="p-1.5 text-right text-purple-300">Hrs Flete</th>
                        <th class="p-2 text-right">Valor Hora ($)</th>
                        <th class="p-2 text-right text-rose-300">Total Costo ($)</th>
                        <th class="p-1.5 text-center">V°B°</th>
                        <th class="p-1.5 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5 font-mono">
                      <tr v-for="(it, idx) in costos.costo_hora_operador" :key="idx" :class="['hover:bg-white/[0.02]', (it.rol_personal === 'RIGGER' || it.tarifa_no_aplica) ? 'bg-purple-950/10' : '']">
                        <td class="p-1.5"><input type="date" v-model="it.fecha" class="bg-slate-900 border border-white/10 rounded px-1 py-1 text-[11px] text-white w-28" /></td>
                        <td class="p-1.5">
                          <select v-model="it.patente" @change="onPatenteOperadorChange(it)" class="w-24 bg-slate-900 border border-white/10 rounded px-1 py-1 text-[11px] text-white font-bold font-mono">
                            <option value="" disabled>Patente...</option>
                            <option v-for="eq in patentesAsignadas" :key="eq.patente" :value="eq.patente">{{ eq.patente }}</option>
                            <option v-if="it.patente && !patentesAsignadas.some(e => e.patente === it.patente)" :value="it.patente">{{ it.patente }}</option>
                          </select>
                        </td>
                        <td class="p-1.5">
                          <div class="flex items-center gap-1">
                            <select 
                              v-model="it.rol_personal" 
                              @change="onRolPersonalChange(it)"
                              :class="[
                                'px-1 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer outline-none transition-colors border',
                                (it.rol_personal === 'RIGGER' || it.tarifa_no_aplica)
                                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                                  : (String(it.rol_personal || '').toUpperCase().includes('CONDUCTOR') 
                                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' 
                                      : 'bg-sky-950/80 text-sky-300 border-sky-500/50')
                              ]"
                              title="Cambiar rol operacional del tripulante"
                            >
                              <option value="OPERADOR" class="bg-slate-900 text-sky-300 font-bold">Operador</option>
                              <option value="RIGGER" class="bg-slate-900 text-purple-300 font-bold">Rigger</option>
                              <option value="CONDUCTOR" class="bg-slate-900 text-amber-300 font-bold">Conductor</option>
                            </select>
                            <input type="text" v-model="it.nombre_personal" @input="onNombrePersonalInput(it)" placeholder="Tripulante" class="w-28 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-white font-bold" />
                            <span v-if="it.report_validado" class="px-1 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" title="Traspasado desde Report Diario Validado">
                              ✓ Report
                            </span>
                          </div>
                          <div v-if="it.concepto_detalle" class="text-[9px] text-slate-400 mt-0.5 truncate max-w-[170px]" :title="it.concepto_detalle">
                            {{ it.concepto_detalle }}
                          </div>
                        </td>
                        <td class="p-1 text-center">
                          <input type="time" v-model="it.hora_salida" @change="onHorarioOperadorChange(it)" class="bg-slate-900 border border-white/10 rounded px-1 py-0.5 text-[11px] text-slate-200 font-mono" />
                        </td>
                        <td class="p-1 text-center">
                          <input type="time" v-model="it.hora_llegada" @change="onHorarioOperadorChange(it)" class="bg-slate-900 border border-white/10 rounded px-1 py-0.5 text-[11px] text-slate-200 font-mono" />
                        </td>
                        <td class="p-1 text-center">
                          <input type="time" v-model="it.hora_termino" @change="onHorarioOperadorChange(it)" class="bg-slate-900 border border-white/10 rounded px-1 py-0.5 text-[11px] text-slate-200 font-mono" />
                        </td>
                        <td class="p-1 text-center">
                          <input type="time" v-model="it.hora_retorno" @change="onHorarioOperadorChange(it)" class="bg-slate-900 border border-white/10 rounded px-1 py-0.5 text-[11px] text-slate-200 font-mono" />
                        </td>
                        <td class="p-1 text-center text-[11px] text-slate-400">{{ it.colacion_horas !== undefined && it.colacion_horas !== null ? `${formatHorasHHMM(it.colacion_horas)}h` : '00:00h' }}</td>
                        <td class="p-1 text-center text-[11px] font-bold text-sky-300">{{ formatHorasHHMM(it.horas_reales_equipo ?? it.cantidad_unidades ?? 0) }}</td>
                        <td class="p-1 text-center text-[11px] text-amber-300">{{ formatHorasHHMM(it.horas_standby_gsp || 0) }}</td>
                        <td class="p-1 text-center text-[11px] text-indigo-300">{{ formatHorasHHMM(it.horas_standby_cliente || 0) }}</td>
                        <td class="p-1 text-right">
                          <input type="number" step="0.25" v-model.number="it.cantidad_unidades" @input="recalcularCostoOperador(it, true)" class="w-16 bg-slate-900 border border-white/10 rounded px-1 py-0.5 text-[11px] text-emerald-300 text-right font-bold font-mono" />
                        </td>
                        <td class="p-1 text-right">
                          <input type="number" step="0.25" v-model.number="it.horas_flete_pagar" @input="onFleteOperadorChange(it)" class="w-14 bg-slate-900 border border-white/10 rounded px-1 py-0.5 text-[11px] text-purple-300 text-right font-bold font-mono" />
                        </td>
                        <td class="p-1.5 text-right">
                          <div v-if="it.rol_personal === 'RIGGER' || it.tarifa_no_aplica" class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px]">
                            Sueldo Fijo ($0)
                          </div>
                          <div v-else class="flex items-center justify-end gap-1">
                            <input 
                              type="number" 
                              v-model.number="it.precio_unitario" 
                              @input="recalcularCostoOperador(it)" 
                              :class="[
                                'w-20 bg-slate-900 border rounded px-1 py-0.5 text-[11px] text-right font-mono transition-colors',
                                it.tarifa_modificada ? 'border-amber-500/60 text-amber-300 bg-amber-500/10 font-bold' : 'border-white/10 text-white'
                              ]" 
                            />
                            <span v-if="it.tarifa_modificada" class="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" :title="`Sugerida: ${formatMoneda(it.tarifa_sugerida)}`">
                              ⚠️
                            </span>
                          </div>
                        </td>
                        <td class="p-1.5 font-bold text-rose-300 text-right font-mono">{{ formatMoneda(it.monto_total) }}</td>
                        <td class="p-1 text-center">
                          <input type="checkbox" v-model="it.vb_validado" class="w-3.5 h-3.5 accent-emerald-500 cursor-pointer" title="V°B° Control de Gestión" />
                        </td>
                        <td class="p-1 text-center">
                          <button type="button" @click="eliminarItemCosto('costo_hora_operador', idx)" class="text-rose-400 hover:text-rose-200 cursor-pointer">🗑️</button>
                        </td>
                      </tr>
                      <tr v-if="costos.costo_hora_operador.length === 0">
                        <td colspan="17" class="p-4 text-center text-slate-500 font-sans">Sin registros diarios de horas de personal.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- CASO VIÁTICO ALIMENTACIÓN (Precalculado por Defecto Día a Día según Escala Tabular) -->
              <div v-else-if="tabCostoActiva === 'alimentacion'">
                <div class="mb-2.5 px-3 py-2 bg-slate-900/90 border border-emerald-500/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-[10px]">Escala Viático Diario</span>
                    <span class="text-slate-300">
                      <strong>&lt; 8h reales:</strong> $0 (Sin Viático) · <strong>8h reales:</strong> $7.000 base · <strong>&gt; 8h:</strong> +$1.000/hr adicional · <strong>Tope:</strong> $18.000/día
                    </span>
                  </div>
                  <span class="text-[11px] text-slate-400">
                    Aplica a <strong class="text-sky-300">Operador</strong> y <strong class="text-purple-300">Rigger</strong> (descontando colación real del report)
                  </span>
                </div>

                <div v-if="costos.alimentacion.some(it => it.tarifa_modificada)" class="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-amber-300 text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-amber-400 font-bold">⚠️ Viático Modificado por Control de Gestión</span>
                    <span class="text-slate-400 text-[11px]">(Monto editado manualmente respecto al cálculo automático por tramo horario)</span>
                  </div>
                  <span class="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200 font-mono">Auditoría Control de Gestión</span>
                </div>

                <datalist id="datalist-condicion-viatico">
                  <option value="Ida y Regreso en el Día"></option>
                  <option value="Salida a Obra"></option>
                  <option value="Permanencia en Obra"></option>
                  <option value="Retorno a Planta"></option>
                </datalist>

                <div class="overflow-x-auto">
                  <table class="w-full text-xs text-left">
                    <thead class="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-white/10">
                      <tr>
                        <th class="p-2">Fecha</th>
                        <th class="p-2">Equipo</th>
                        <th class="p-2">Persona / Rol</th>
                        <th class="p-2">Condición Movimiento Día</th>
                        <th class="p-1.5 text-center">Desde</th>
                        <th class="p-1.5 text-center">Hasta</th>
                        <th class="p-1.5 text-center">Colación</th>
                        <th class="p-1.5 text-center text-sky-300">Hrs Efectivas</th>
                        <th class="p-2 text-right text-rose-300">Monto Viático ($)</th>
                        <th class="p-1.5 text-center">V°B°</th>
                        <th class="p-1.5 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5 font-mono">
                      <tr v-for="(it, idx) in costos.alimentacion" :key="idx" class="hover:bg-white/[0.02]">
                        <td class="p-1.5"><input type="date" v-model="it.fecha" class="bg-slate-900 border border-white/10 rounded px-1 py-1 text-[11px] text-white w-28" /></td>
                        <td class="p-1.5 text-[11px] font-bold text-slate-300">{{ it.patente || 'S/P' }}</td>
                        <td class="p-1.5">
                          <div class="flex items-center gap-1">
                            <span :class="[
                              'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                              it.rol_personal === 'RIGGER'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : (String(it.rol_personal || '').toUpperCase().includes('CONDUCTOR') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40')
                            ]">
                              {{ it.rol_personal === 'RIGGER' ? 'Rigger' : (it.rol_personal || 'Operador') }}
                            </span>
                            <input type="text" v-model="it.nombre_personal" class="w-32 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-white font-bold" />
                            <span v-if="it.report_validado" class="px-1 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" title="Traspasado desde Report Diario Validado">
                              ✓ Report
                            </span>
                          </div>
                        </td>
                        <td class="p-1.5">
                          <input 
                            type="text" 
                            v-model="it.concepto_detalle" 
                            list="datalist-condicion-viatico" 
                            @input="onCondicionViaticoChange(it)" 
                            class="w-full min-w-[220px] bg-slate-900 border border-white/15 rounded px-2 py-1 text-[11px] text-white font-sans focus:border-emerald-500 focus:outline-none" 
                            placeholder="Condición o glosa de movimiento..." 
                          />
                        </td>
                        <td class="p-1 text-center text-[11px] text-slate-300">{{ it.desde || '--:--' }}</td>
                        <td class="p-1 text-center text-[11px] text-slate-300">{{ it.hasta || '--:--' }}</td>
                        <td class="p-1 text-center text-[11px] text-slate-400">{{ it.colacion_horas !== undefined && it.colacion_horas !== null ? `${formatHorasHHMM(it.colacion_horas)}h` : '00:00h' }}</td>
                        <td class="p-1 text-center">
                          <span :class="[
                            'px-1.5 py-0.5 rounded text-[10px] font-bold',
                            (it.horas_redondeadas ?? it.cantidad_unidades ?? 0) < 8
                              ? 'bg-slate-800 text-slate-400 border border-white/10'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          ]">
                            {{ formatHorasHHMM(it.horas_efectivas ?? it.cantidad_unidades ?? 0) }}h ({{ it.horas_redondeadas ?? Math.round(it.cantidad_unidades || 0) }}h)
                          </span>
                        </td>
                        <td class="p-1.5 text-right">
                          <div class="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              v-model.number="it.monto_total"
                              @input="recalcularViaticoAlimentacion(it)"
                              :class="[
                                'w-24 bg-slate-900 border rounded px-1.5 py-0.5 text-xs text-right font-mono font-bold transition-colors',
                                it.tarifa_modificada ? 'border-amber-500/60 text-amber-300 bg-amber-500/10' : 'border-white/10 text-rose-300'
                              ]"
                            />
                            <span v-if="it.tarifa_modificada" class="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" :title="`Sugerido: ${formatMoneda(it.tarifa_sugerida)}`">
                              ⚠️
                            </span>
                          </div>
                        </td>
                        <td class="p-1 text-center">
                          <input type="checkbox" v-model="it.vb_validado" class="w-3.5 h-3.5 accent-emerald-500 cursor-pointer" title="V°B° Control de Gestión" />
                        </td>
                        <td class="p-1 text-center">
                          <button type="button" @click="eliminarItemCosto('alimentacion', idx)" class="text-rose-400 hover:text-rose-200 cursor-pointer">🗑️</button>
                        </td>
                      </tr>
                      <tr v-if="costos.alimentacion.length === 0">
                        <td colspan="11" class="p-4 text-center text-slate-500 font-sans">Sin registros diarios de viático de alimentación.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- CASO TABLA ESTÁNDAR PARA LAS OTRAS CATEGORÍAS (Peajes, Personal Ext, Feriados, Flete Ext, Gastos Extra) -->
              <div v-else>
                <table class="w-full text-xs text-left">
                  <thead class="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th class="p-2">Fecha</th>
                      <th class="p-2" v-if="tabCostoActiva === 'peajes'">Patente</th>
                      <th class="p-2" v-if="necesitaColumnaOC(tabCostoActiva)">N° OC Cabecera</th>
                      <th class="p-2">{{ tabCostoActiva === 'alimentacion' ? 'Nombre Personal' : 'Personal / Proveedor' }}</th>
                      <th class="p-2">{{ tabCostoActiva === 'alimentacion' ? 'Concepto' : 'Detalle / Concepto' }}</th>
                      <th class="p-2 text-center" v-if="tabCostoActiva === 'peajes'">Comprobante</th>
                      <th class="p-2 text-right">Monto ($)</th>
                      <th class="p-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 font-mono">
                    <tr v-for="(it, idx) in (costos[tabCostoActiva] || [])" :key="idx" class="hover:bg-white/[0.02]">
                      <td class="p-1.5"><input type="date" v-model="it.fecha" class="bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white" /></td>
                      <td class="p-1.5" v-if="tabCostoActiva === 'peajes'">
                        <select v-model="it.patente" class="w-28 bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white font-bold font-mono">
                          <option value="" disabled>Seleccione...</option>
                          <option v-for="eq in patentesAsignadas" :key="eq.patente" :value="eq.patente">{{ eq.patente }}</option>
                          <option v-if="it.patente && !patentesAsignadas.some(e => e.patente === it.patente)" :value="it.patente">{{ it.patente }}</option>
                        </select>
                      </td>
                      <td class="p-1.5" v-if="necesitaColumnaOC(tabCostoActiva)"><input type="text" v-model="it.numero_oc" placeholder="OC-1029" class="w-24 bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white font-mono" /></td>
                      <td class="p-1.5"><input type="text" v-model="it.nombre_personal" :placeholder="tabCostoActiva === 'alimentacion' ? 'Nombre Personal' : 'Nombre'" class="w-40 bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white" /></td>
                      <td class="p-1.5"><input type="text" v-model="it.concepto_detalle" :placeholder="tabCostoActiva === 'alimentacion' ? 'Alimentación Operador' : 'Detalle del gasto'" class="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white" /></td>
                      <td class="p-1.5 text-center" v-if="tabCostoActiva === 'peajes'">
                        <div class="flex items-center justify-center gap-1.5">
                          <div v-if="it.archivo_comprobante_url" class="relative group">
                            <img 
                              :src="resolverUrlArchivo(it.archivo_comprobante_url)" 
                              class="w-8 h-8 object-cover rounded border border-blue-500/60 shadow cursor-pointer hover:scale-110 transition-transform bg-slate-900"
                              @click="abrirVisorImagen(it.archivo_comprobante_url)"
                              title="Clic para ampliar comprobante TAG"
                            />
                            <button 
                              type="button" 
                              @click="it.archivo_comprobante_url = ''" 
                              class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Eliminar comprobante"
                            >
                              ✕
                            </button>
                          </div>
                          <label class="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/15 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1" :title="it.archivo_comprobante_url ? 'Cambiar fotografía' : 'Adjuntar fotografía'">
                            <span>📷</span>
                            <span v-if="!it.archivo_comprobante_url" class="text-[9px]">Subir</span>
                            <input type="file" accept="image/*,application/pdf" @change="subirComprobante($event, it)" class="hidden" />
                          </label>
                        </div>
                      </td>
                      <td class="p-1.5 text-right">
                        <input 
                          type="number" 
                          v-model.number="it.monto_total" 
                          @input="recalcularTotales" 
                          class="w-24 bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white text-right font-bold text-rose-300"
                        />
                      </td>
                      <td class="p-1.5 text-center">
                        <button type="button" @click="eliminarItemCosto(tabCostoActiva, idx)" class="text-rose-400 hover:text-rose-200 cursor-pointer" title="Eliminar ítem de costo">🗑️</button>
                      </td>
                    </tr>
                    <tr v-if="(costos[tabCostoActiva] || []).length === 0">
                      <td colspan="8" class="p-4 text-center text-slate-500 font-sans">Sin gastos registrados en esta categoría.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
        </section>

        <!-- SECCIÓN 4: CONSOLA DE RESULTADO ECONÓMICO (P&L) & OBSERVACIONES -->
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <!-- PANEL IZQUIERDO: BALANCE FINANCIERO (VENTA VS COSTOS) - Oculto exclusivamente para el perfil SECRETARIA (REQ-1122) -->
          <div v-if="!esRolSecretaria" class="bg-[#080d1a] border border-white/15 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-xs font-mono font-bold uppercase text-blue-400 tracking-wider flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                <span>📊</span> Balance Financiero del Servicio (P&L Operacional)
              </h3>

              <div class="space-y-3 text-xs font-mono">
                <!-- A. Resumen de Ingresos Totales (Venta) -->
                <div class="bg-slate-950/80 p-3 rounded-xl border border-white/10 space-y-1.5">
                  <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    A. Resumen de Ingresos Totales (Venta)
                  </p>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-300">1. Ingresos Horas Trabajadas ({{ formatHorasHHMM(its.total_horas_report) }}h × {{ formatMoneda(its.valor_hora_pactado) }}):</span>
                    <strong class="text-white">{{ formatMoneda(its.total_ingresos_horas) }} ({{ getPctSobreVenta(its.total_ingresos_horas) }}%)</strong>
                  </div>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-300">2. Ingreso Fletes / Traslados:</span>
                    <strong class="text-white">{{ formatMoneda(its.total_ingresos_fletes) }} ({{ getPctSobreVenta(its.total_ingresos_fletes) }}%)</strong>
                  </div>
                  <div class="flex justify-between text-emerald-400 font-bold border-t border-white/10 pt-1.5 text-sm">
                    <span>TOTAL INGRESOS FACTURABLES:</span>
                    <span>{{ formatMoneda(its.total_ingresos_facturables) }} (100%)</span>
                  </div>
                </div>

                <!-- B. Resumen de Costos Operacionales (Egresos) -->
                <div class="bg-slate-950/80 p-3 rounded-xl border border-white/10 space-y-1.5">
                  <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    B. Resumen de Costos Operacionales (Egresos)
                  </p>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-300">1. Viáticos Alimentación:</span>
                    <span>{{ formatMoneda(getSubtotalCategoria('alimentacion')) }} ({{ getPctSobreVenta(getSubtotalCategoria('alimentacion')) }}%)</span>
                  </div>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-300">2. Combustible en Ruta y Faena:</span>
                    <span>{{ formatMoneda(getSubtotalCategoria('combustible')) }} ({{ getPctSobreVenta(getSubtotalCategoria('combustible')) }}%)</span>
                  </div>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-300">3. Peajes y Tag:</span>
                    <span>{{ formatMoneda(getSubtotalCategoria('peajes')) }} ({{ getPctSobreVenta(getSubtotalCategoria('peajes')) }}%)</span>
                  </div>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-300">4. Pensiones y Alojamiento:</span>
                    <span>{{ formatMoneda(getSubtotalCategoria('pensiones')) }} ({{ getPctSobreVenta(getSubtotalCategoria('pensiones')) }}%)</span>
                  </div>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-300">5. Movilización Personal:</span>
                    <span>{{ formatMoneda(getSubtotalCategoria('movilizacion')) }} ({{ getPctSobreVenta(getSubtotalCategoria('movilizacion')) }}%)</span>
                  </div>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-300">6. Personal Ext. y Feriados:</span>
                    <span>{{ formatMoneda(getSubtotalCategoria('personal_externo') + getSubtotalCategoria('feriados')) }} ({{ getPctSobreVenta(getSubtotalCategoria('personal_externo') + getSubtotalCategoria('feriados')) }}%)</span>
                  </div>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-300">7. Subcontratación Flete:</span>
                    <span>{{ formatMoneda(getSubtotalCategoria('subcontratacion_flete')) }} ({{ getPctSobreVenta(getSubtotalCategoria('subcontratacion_flete')) }}%)</span>
                  </div>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-300">8. Gastos Extraordinarios:</span>
                    <span>{{ formatMoneda(getSubtotalCategoria('gastos_extraordinarios')) }} ({{ getPctSobreVenta(getSubtotalCategoria('gastos_extraordinarios')) }}%)</span>
                  </div>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-300">9. Costo Valor Hora Operador:</span>
                    <span>{{ formatMoneda(getSubtotalCategoria('costo_hora_operador')) }} ({{ getPctSobreVenta(getSubtotalCategoria('costo_hora_operador')) }}%)</span>
                  </div>
                  <div class="border-t border-white/10 pt-1.5 flex justify-between font-bold text-amber-300 text-sm">
                    <span>TOTAL COSTOS OPERACIONALES:</span>
                    <span>{{ formatMoneda(its.total_costos_operacionales) }} ({{ porcentajeCostosSobreVenta.toFixed(1) }}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- BANNER DE RESULTADO: UTILIDAD BRUTA & MARGEN % -->
            <div 
              :class="its.utilidad_bruta >= 0 ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-rose-950/40 border-rose-500/50'"
              class="border rounded-xl p-4 mt-3 flex items-center justify-between"
            >
              <div>
                <span class="text-[10px] uppercase font-mono font-bold tracking-wider block text-slate-400">
                  Utilidad Bruta (Venta - Costos)
                </span>
                <span 
                  :class="its.utilidad_bruta >= 0 ? 'text-emerald-400' : 'text-rose-400'"
                  class="text-2xl font-mono font-black block"
                >
                  {{ formatMoneda(its.utilidad_bruta) }}
                </span>
              </div>

              <div class="text-right">
                <span class="text-[10px] uppercase font-mono font-bold tracking-wider block text-slate-400">
                  Margen Operacional
                </span>
                <span 
                  :class="its.margen_porcentaje >= 35 ? 'text-emerald-400' : (its.margen_porcentaje >= 15 ? 'text-amber-400' : 'text-rose-400')"
                  class="text-2xl font-mono font-black block"
                >
                  {{ its.margen_porcentaje.toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>

          <!-- PANEL DERECHO: OBSERVACIONES DEL SERVICIO CON PLANTILLAS -->
          <div :class="esRolSecretaria ? 'lg:col-span-2 bg-[#080d1a] border border-white/15 rounded-xl p-4 shadow-sm flex flex-col justify-between' : 'bg-[#080d1a] border border-white/15 rounded-xl p-4 shadow-sm flex flex-col justify-between'">
            <div>
              <div class="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <h3 class="text-xs font-mono font-bold uppercase text-blue-400 tracking-wider flex items-center gap-2">
                  <span>📝</span> Observaciones del Servicio
                </h3>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] text-slate-400 font-mono mr-1">Plantillas:</span>
                  <button 
                    type="button" 
                    @click="inyectarPlantilla('URBANO')" 
                    class="px-2 py-0.5 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700/50 text-[11px] font-mono cursor-pointer transition-colors"
                  >
                    🏢 Urbano
                  </button>
                  <button 
                    type="button" 
                    @click="inyectarPlantilla('RURAL')" 
                    class="px-2 py-0.5 rounded bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/50 text-[11px] font-mono cursor-pointer transition-colors"
                  >
                    🚜 Rural
                  </button>
                </div>
              </div>

              <textarea 
                v-model="its.observaciones"
                rows="5"
                placeholder="Ingrese las observaciones generales de cierre del servicio..."
                class="w-full bg-slate-950 border border-white/15 rounded-lg p-2.5 text-xs text-slate-200 font-sans resize-none focus:outline-none focus:border-blue-500/60"
              ></textarea>
            </div>
          </div>

        </section>

      </div>

    </div>

    <!-- MODAL DE FIRMA FES EN 2 COLUMNAS (SPEC 47) -->
    <div v-if="mostrarModalFes" class="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
      <div class="bg-[#0b1021] border border-blue-500/40 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl text-slate-200">
        
        <!-- Header Modal FES -->
        <div class="bg-[#050810] px-5 py-3 border-b border-white/10 flex justify-between items-center flex-shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xl">🔏</span>
            <div>
              <h3 class="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Firma Electrónica Simple (FES) — {{ its.folio_its }}
              </h3>
              <p class="text-[11px] text-slate-400">
                Paso Activo: <strong class="text-blue-400">{{ pasoPendienteActual?.nombre_paso || 'Paso de Aprobación' }}</strong>
              </p>
            </div>
          </div>
          <button type="button" @click="cerrarModalFes" class="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer">
            ✕
          </button>
        </div>

        <!-- Cuerpo 2 Columnas -->
        <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
          
          <!-- Columna Izquierda: Panel de Control (5 columnas) -->
          <div class="lg:col-span-5 p-5 border-r border-white/10 overflow-y-auto flex flex-col justify-between space-y-4">
            <div class="space-y-4">
              <!-- Selector Decisión -->
              <div>
                <label class="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1.5">
                  Decisión de Liquidación:
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    @click="formFes.aprueba_rechaza = 'APRUEBA'"
                    :class="formFes.aprueba_rechaza === 'APRUEBA' ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-950 border-emerald-400' : 'bg-slate-900 text-slate-400 border-white/10 hover:text-slate-200'"
                    class="py-2 px-3 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>✅</span> <span>APROBAR</span>
                  </button>

                  <button 
                    type="button"
                    @click="formFes.aprueba_rechaza = 'RECHAZA'"
                    :class="formFes.aprueba_rechaza === 'RECHAZA' ? 'bg-rose-600 text-white font-black shadow-lg shadow-rose-950 border-rose-400' : 'bg-slate-900 text-slate-400 border-white/10 hover:text-slate-200'"
                    class="py-2 px-3 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>❌</span> <span>RECHAZAR</span>
                  </button>
                </div>
              </div>

              <!-- Si Rechaza: Causal y Observaciones obligatorias -->
              <div v-if="formFes.aprueba_rechaza === 'RECHAZA'" class="space-y-3 p-3 bg-rose-950/25 border border-rose-500/30 rounded-xl animate-fadeIn">
                <div>
                  <label class="text-[10px] uppercase font-mono font-bold text-rose-300 block mb-1">
                    Motivo Formal de Rechazo (Obligatorio) *
                  </label>
                  <select 
                    v-model="formFes.id_motivo_rechazo"
                    class="w-full bg-slate-900 border border-rose-500/40 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-400"
                  >
                    <option :value="null" disabled>Seleccione la causal de rechazo...</option>
                    <option v-for="m in motivosRechazo" :key="m.id_motivo_rechazo" :value="m.id_motivo_rechazo">
                      {{ m.motivo_rechazo }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="text-[10px] uppercase font-mono font-bold text-rose-300 block mb-1">
                    Observaciones Detalladas para el Analista *
                  </label>
                  <textarea 
                    v-model="formFes.observaciones"
                    rows="4"
                    placeholder="Indique exactamente qué jornada, costo o tarifa debe corregir el analista..."
                    class="w-full bg-slate-900 border border-rose-500/40 rounded-lg p-2 text-xs text-white resize-none focus:outline-none focus:border-rose-400 font-sans"
                  ></textarea>
                </div>
              </div>

              <!-- Si Aprueba: Observaciones voluntarias -->
              <div v-else class="space-y-1">
                <label class="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                  Observaciones de Visto Bueno (Opcional):
                </label>
                <textarea 
                  v-model="formFes.observaciones"
                  rows="3"
                  placeholder="Observaciones de visto bueno o auditoría conforme..."
                  class="w-full bg-slate-950 border border-white/15 rounded-lg p-2 text-xs text-slate-200 resize-none focus:outline-none focus:border-blue-500 font-sans"
                ></textarea>
              </div>

              <!-- Input PIN FES 4 dígitos -->
              <div class="bg-slate-950 border border-blue-500/30 p-3.5 rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-[10px] uppercase font-mono font-bold text-blue-300 block">
                    PIN FES (4 Dígitos) *
                  </label>
                  <span class="text-[9px] text-slate-400 font-mono">Cifrado SHA-256</span>
                </div>
                <input 
                  type="password"
                  v-model="formFes.pin"
                  maxlength="4"
                  placeholder="••••"
                  class="w-full bg-slate-900 border border-blue-500/40 rounded-lg p-2.5 text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-blue-400"
                  @keyup.enter="confirmarFirmaFes"
                />
                <p class="text-[10px] text-slate-500 leading-tight">
                  Ingresa tu clave de 4 dígitos registrada en el enrolamiento para estampar la firma legal FES.
                </p>
              </div>

              <!-- Mensaje de Error -->
              <div v-if="errorFes" class="p-2.5 bg-rose-950/50 border border-rose-500/50 rounded-lg text-rose-300 text-xs font-mono">
                ⚠️ {{ errorFes }}
              </div>
            </div>

            <!-- Botón de Envío -->
            <div class="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
              <button 
                type="button" 
                @click="cerrarModalFes" 
                class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button 
                type="button" 
                @click="confirmarFirmaFes"
                :disabled="enviandoFes"
                :class="formFes.aprueba_rechaza === 'RECHAZA' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'"
                class="px-4 py-2 rounded-lg text-white text-xs font-bold font-mono shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
              >
                <span v-if="enviandoFes" class="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span>{{ enviandoFes ? 'Transmitiendo...' : (formFes.aprueba_rechaza === 'RECHAZA' ? 'Confirmar Rechazo' : 'Estampar Firma FES') }}</span>
              </button>
            </div>
          </div>

          <!-- Columna Derecha: Visor PDF en Vivo (7 columnas) -->
          <div class="lg:col-span-7 bg-slate-900 flex flex-col overflow-hidden relative min-h-[400px]">
            <div class="bg-slate-950 px-3 py-2 border-b border-white/10 flex items-center justify-between text-xs flex-shrink-0">
              <span class="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                <span>📄</span> <span>Previsualizador en Tiempo Real (A4)</span>
              </span>
              <div class="flex items-center gap-3">
                <a
                  :href="urlPdfOficial"
                  target="_blank"
                  rel="noopener"
                  class="text-[10px] text-emerald-400 hover:text-emerald-200 font-mono font-bold cursor-pointer flex items-center gap-1 no-underline"
                >
                  <span>📄</span> <span>Abrir PDF en pestaña ↗</span>
                </a>
                <button 
                  type="button" 
                  @click="recargarPreviewPdf" 
                  class="text-[10px] text-blue-400 hover:text-blue-200 font-mono cursor-pointer flex items-center gap-1"
                >
                  <span>🔄</span> <span>Actualizar</span>
                </button>
              </div>
            </div>

            <div v-if="cargandoPdfPreview" class="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <div class="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-2"></div>
              <span class="text-xs font-mono">Cargando documento oficial...</span>
            </div>

            <iframe 
              v-else-if="urlPdfPreviewIframe" 
              :src="urlPdfPreviewIframe" 
              class="w-full flex-1 border-0 bg-slate-800"
              title="Vista Previa PDF ITS"
            ></iframe>

            <div v-else class="flex-1 flex items-center justify-center text-slate-500 text-xs font-mono p-8 text-center">
              No se pudo cargar la vista previa del PDF.
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

  <!-- MODAL LIGHTBOX / VISOR DE COMPROBANTE -->
  <div v-if="imagenModalVisible" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn" @click.self="cerrarVisorImagen">
    <div class="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-white/20 rounded-2xl p-3 shadow-2xl flex flex-col items-center">
      <div class="w-full flex justify-between items-center px-4 py-2 border-b border-white/10 mb-2">
        <span class="text-xs font-mono font-bold text-slate-200">📷 Comprobante / Evidencia Fotográfica</span>
        <button type="button" @click="cerrarVisorImagen" class="text-slate-400 hover:text-white text-lg font-bold px-2 py-0.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">✕</button>
      </div>
      <div class="overflow-auto max-h-[75vh] flex items-center justify-center p-2">
        <img :src="imagenModalUrl" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg border border-white/10" alt="Comprobante" />
      </div>
      <div class="w-full flex justify-end gap-2 pt-2 border-t border-white/10 px-4">
        <a :href="imagenModalUrl" target="_blank" class="text-xs font-mono text-blue-400 hover:text-blue-300 underline py-1">Abrir en pestaña nueva ↗</a>
        <button type="button" @click="cerrarVisorImagen" class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import api from '@/services/api';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  embedded: {
    type: Boolean,
    default: false
  },
  idProyecto: {
    type: [Number, String],
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'actualizado', 'avanzar-edp']);

// Estados reactivos
const cargando = ref(false);
const guardando = ref(false);

// Estados reactivos de Flujo FES (Spec 47)
const flujoData = ref({
  flujo: null,
  pasos: [],
  motivos_rechazo: [],
  id_flow_step_pendiente: null,
  puede_firmar: false
});
const mostrarModalFes = ref(false);
const cargandoPdfPreview = ref(false);
const pdfPreviewBase64 = ref(null);
const enviandoFes = ref(false);
const errorFes = ref(null);
const formFes = ref({
  aprueba_rechaza: 'APRUEBA',
  id_motivo_rechazo: null,
  observaciones: '',
  pin: ''
});

const tabCostoActiva = ref('combustible');
const crmPensiones = ref({});

const proyecto = ref({});
const its = ref({
  id_its: null,
  folio_its: '',
  version: 1,
  tipo_contexto: 'URBANO',
  horas_minimas_pactadas: 8.0,
  valor_hora_pactado: 0,
  valor_fijo_pactado: 0,
  es_valor_fijo: false,
  valor_flete_pactado: 0,
  total_horas_report: 0,
  total_ingresos_horas: 0,
  total_ingresos_fletes: 0,
  total_ingresos_facturables: 0,
  total_costos_operacionales: 0,
  utilidad_bruta: 0,
  margen_porcentaje: 0,
  plantilla_tipo: 'URBANO',
  observaciones: '',
  categorias_sin_costo: {},
  estado_its: 'BORRADOR'
});

const jornadas = ref([]);
const asignaciones = ref({ equipos: [], personal: [] });

// Detección reactiva de Servicio Valor Fijo (REQ-1104)
const esServicioValorFijo = computed(() => {
  return Boolean(
    its.value?.es_valor_fijo ||
    Number(its.value?.valor_fijo_pactado || 0) > 0 ||
    (jornadas.value || []).some(j => String(j.tipo_servicio || '').toUpperCase().includes('FIJO'))
  );
});

// Computeds de Asignaciones para selectores
const patentesAsignadas = computed(() => {
  return asignaciones.value.equipos || [];
});

const personalAsignadoLista = computed(() => {
  return (asignaciones.value.personal || []).map(p => ({
    id_user: p.id_user,
    nombre: `${p.name_frst || ''} ${p.apellido_pat || ''}`.trim() || 'Tripulante',
    rol: p.rol_personal || 'Tripulación'
  }));
});

const resolverRolTripulante = (nombreOId) => {
  if (!nombreOId) return 'OPERADOR';
  const busqueda = String(nombreOId).trim().toUpperCase();
  const per = (asignaciones.value?.personal || []).find(p => {
    const nombreCompleto = `${p.name_frst || ''} ${p.apellido_pat || ''}`.trim().toUpperCase();
    return String(p.id_user) === busqueda || 
           (nombreCompleto && (nombreCompleto === busqueda || busqueda.includes(nombreCompleto) || nombreCompleto.includes(busqueda)));
  });
  if (per && per.rol_personal) {
    const rolNorm = String(per.rol_personal).toUpperCase();
    if (rolNorm.includes('RIGGER')) return 'RIGGER';
    if (rolNorm.includes('CONDUCTOR') || rolNorm.includes('CHOFER') || rolNorm.includes('TRANSPORTISTA')) return 'CONDUCTOR';
    if (rolNorm.includes('OPERADOR')) return 'OPERADOR';
  }
  if (busqueda.includes('RIGGER')) return 'RIGGER';
  if (busqueda.includes('CONDUCTOR') || busqueda.includes('CHOFER')) return 'CONDUCTOR';
  return 'OPERADOR';
};

const resolverConductorOperadorEquipo = (eq) => {
  if (!eq) return '';
  if (eq.conductor_nombre) return eq.conductor_nombre;
  if (eq.operador_nombre) return eq.operador_nombre;
  if (eq.personal_asociado) return eq.personal_asociado;
  
  const pat = String(eq.patente || '').trim().toUpperCase();
  if (!pat) return '';

  // 1. Buscar en jornadas
  const jMatch = (jornadas.value || []).find(j => 
    String(j.patente || '').trim().toUpperCase() === pat && (j.conductor_nombre || j.operador_nombre || j.nombre_personal)
  );
  if (jMatch) {
    return jMatch.conductor_nombre || jMatch.operador_nombre || jMatch.nombre_personal;
  }

  // 2. Buscar en costo_hora_operador
  const cMatch = (costos.value?.costo_hora_operador || []).find(c => 
    String(c.patente || '').trim().toUpperCase() === pat && c.nombre_personal
  );
  if (cMatch) {
    return cMatch.nombre_personal;
  }

  // 3. Buscar en proyecto.json_field (ejecucion_v1 / operaciones_v1)
  const ejV1 = proyecto.value?.json_field?.ejecucion_v1;
  const opV1 = proyecto.value?.json_field?.operaciones_v1;
  const eqList = [...(ejV1?.equipos || []), ...(opV1?.equipos_extra || [])];
  const eqJson = eqList.find(e => 
    String(e.patente || e.id_equipo || '').trim().toUpperCase() === pat
  );
  if (eqJson && (eqJson.conductor_nombre || eqJson.operador_nombre || eqJson.nombre_conductor || eqJson.chofer)) {
    return eqJson.conductor_nombre || eqJson.operador_nombre || eqJson.nombre_conductor || eqJson.chofer;
  }

  // 4. Mapeo contextual con asignaciones.personal por rol
  const tipoNorm = String(eq.tipo_equipo || eq.modelo || '').toUpperCase();
  const esGrua = tipoNorm.includes('GRUA') || eq.rol_equipo === 'Principal' || tipoNorm.includes('IZAJ') || tipoNorm.includes('PLUMA');
  const esCamion = tipoNorm.includes('CAMION') || tipoNorm.includes('TRACTO') || tipoNorm.includes('RAMPLA') || tipoNorm.includes('FLETE');

  if (esGrua) {
    const op = (asignaciones.value?.personal || []).find(p => 
      String(p.rol_personal || '').toUpperCase().includes('OPERADOR')
    );
    if (op) return `${op.name_frst || ''} ${op.apellido_pat || ''}`.trim();
  }
  if (esCamion) {
    const cond = (asignaciones.value?.personal || []).find(p => {
      const r = String(p.rol_personal || '').toUpperCase();
      return r.includes('CONDUCTOR') || r.includes('CHOFER') || r.includes('TRANSPORTISTA');
    });
    if (cond) return `${cond.name_frst || ''} ${cond.apellido_pat || ''}`.trim();
  }

  return '';
};

// Resúmenes multiestanque reactivos
const totalLitrosChasis = computed(() => {
  return (costos.value.combustible || [])
    .filter(c => !c.tipo_estanque || c.tipo_estanque === 'PRINCIPAL_CHASIS' || c.tipo_estanque === 'ESTANQUE_CHASIS')
    .reduce((acc, c) => acc + (parseFloat(c.cantidad_unidades || c.litros) || 0), 0);
});

const totalMontoChasis = computed(() => {
  return (costos.value.combustible || [])
    .filter(c => !c.tipo_estanque || c.tipo_estanque === 'PRINCIPAL_CHASIS' || c.tipo_estanque === 'ESTANQUE_CHASIS')
    .reduce((acc, c) => acc + (parseFloat(c.monto_total) || 0), 0);
});

const totalLitrosGrua = computed(() => {
  return (costos.value.combustible || [])
    .filter(c => c.tipo_estanque === 'SUPERESTRUCTURA_GRUA' || c.tipo_estanque === 'AUXILIAR_SUPERESTRUCTURA' || c.tipo_estanque === 'ESTANQUE_GRUA')
    .reduce((acc, c) => acc + (parseFloat(c.cantidad_unidades || c.litros) || 0), 0);
});

const totalMontoGrua = computed(() => {
  return (costos.value.combustible || [])
    .filter(c => c.tipo_estanque === 'SUPERESTRUCTURA_GRUA' || c.tipo_estanque === 'AUXILIAR_SUPERESTRUCTURA' || c.tipo_estanque === 'ESTANQUE_GRUA')
    .reduce((acc, c) => acc + (parseFloat(c.monto_total) || 0), 0);
});

const totalLitrosBidon = computed(() => {
  return (costos.value.combustible || [])
    .filter(c => c.tipo_estanque === 'AUXILIAR_BIDON' || c.tipo_estanque === 'BIDON_FAENA' || c.tipo_estanque === 'ESTANQUE_AUXILIAR')
    .reduce((acc, c) => acc + (parseFloat(c.cantidad_unidades || c.litros) || 0), 0);
});

const totalMontoBidon = computed(() => {
  return (costos.value.combustible || [])
    .filter(c => c.tipo_estanque === 'AUXILIAR_BIDON' || c.tipo_estanque === 'BIDON_FAENA' || c.tipo_estanque === 'ESTANQUE_AUXILIAR')
    .reduce((acc, c) => acc + (parseFloat(c.monto_total) || 0), 0);
});

const costos = ref({
  alimentacion: [],
  combustible: [],
  movilizacion: [],
  peajes: [],
  pensiones: [],
  personal_externo: [],
  feriados: [],
  subcontratacion_flete: [],
  gastos_extraordinarios: [],
  costo_hora_operador: []
});

const categoriasSinCosto = ref({});
const tarifaOperadorComercial = ref(null);

const categoriasCostosTabs = [
  { key: 'alimentacion', label: 'Viático Alimentación' },
  { key: 'combustible', label: 'Combustible' },
  { key: 'movilizacion', label: 'Movilización' },
  { key: 'peajes', label: 'Peajes' },
  { key: 'pensiones', label: 'Pensiones' },
  { key: 'personal_externo', label: 'P. Externo' },
  { key: 'feriados', label: 'Feriados' },
  { key: 'subcontratacion_flete', label: 'Subcont. Flete' },
  { key: 'gastos_extraordinarios', label: 'Gastos Extra' },
  { key: 'costo_hora_operador', label: 'Hora Operador' }
];

const normalizarCatKey = (cat) => {
  const raw = (typeof cat === 'object' && cat !== null && 'value' in cat) ? cat.value : cat;
  const str = String(raw || '').trim();
  if (str === 'subcontrato_flete') return 'subcontratacion_flete';
  if (str === 'gastos_extra') return 'gastos_extraordinarios';
  return str;
};

const getEstadoCategoria = (catKey) => {
  const k = normalizarCatKey(catKey);
  const count = (costos.value[k] || []).length;
  if (count > 0) return 'CON_COSTOS';
  if (categoriasSinCosto.value[k] === true) return 'SIN_COSTO';
  return 'PENDIENTE';
};

const toggleDeclararSinCosto = (catKey) => {
  const k = normalizarCatKey(catKey);
  if (categoriasSinCosto.value[k]) {
    delete categoriasSinCosto.value[k];
  } else {
    categoriasSinCosto.value[k] = true;
  }
};

const totalCategoriasAuditadas = computed(() => {
  return categoriasCostosTabs.filter(t => getEstadoCategoria(t.key) !== 'PENDIENTE').length;
});

const categoriasPendientesList = computed(() => {
  return categoriasCostosTabs.filter(t => getEstadoCategoria(t.key) === 'PENDIENTE');
});

// Computed
const jornadasActivas = computed(() => jornadas.value.filter(j => !j.es_oculta));

const totalHorasRealesActivas = computed(() => {
  return jornadasActivas.value
    .filter(j => !j.tipo_servicio || !j.tipo_servicio.toLowerCase().includes('flete'))
    .reduce((acc, j) => acc + (parseFloat(j.horas_reales) || 0), 0);
});

const totalHorasViaticosActivas = computed(() => {
  return jornadasActivas.value
    .filter(j => !j.tipo_servicio || !j.tipo_servicio.toLowerCase().includes('flete'))
    .reduce((acc, j) => acc + (parseFloat(j.horas_viaticos) || 0), 0);
});

const porcentajeCostosSobreVenta = computed(() => {
  if (!its.value.total_ingresos_facturables || its.value.total_ingresos_facturables <= 0) return 0;
  return (its.value.total_costos_operacionales / its.value.total_ingresos_facturables) * 100;
});

const badgeEstadoClass = computed(() => {
  const est = its.value.estado_its || 'BORRADOR';
  if (est === 'RECIBIDO_CONTABILIDAD') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  if (est === 'APROBADO_OPERACIONES') return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  if (est === 'ELABORADO') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  return 'bg-slate-700/40 text-slate-300 border-white/15';
});

const usuarioActual = computed(() => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
});

const pasoPendienteActual = computed(() => {
  if (!flujoData.value.pasos || flujoData.value.pasos.length === 0) {
    return { orden: 1, nombre_paso: '1. Elaboración & Liquidación Técnica', estado: 'PENDIENTE' };
  }
  return flujoData.value.pasos.find(p => p.estado === 'PENDIENTE') || null;
});

const resolvedIdProyecto = computed(() => {
  if (props.idProyecto && typeof props.idProyecto !== 'object') return props.idProyecto;
  if (props.idProyecto && typeof props.idProyecto === 'object') return props.idProyecto.id_proyecto || props.idProyecto.id;
  if (its.value?.id_proyecto) return its.value.id_proyecto;
  if (proyecto.value?.id_proyecto) return proyecto.value.id_proyecto;
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('id_proyecto') || params.get('id') || null;
  }
  return null;
});

const pdfPreviewTimestamp = ref(Date.now());

const urlPdfOficial = computed(() => {
  const id = resolvedIdProyecto.value;
  if (!id) return '#';
  const isProd = typeof window !== 'undefined' && window.location.pathname.startsWith('/lg-gsp-prod');
  const base = (api.defaults.baseURL || (isProd ? 'https://servidor.leanglobal.cl/lg-gsp-prod/api' : 'https://servidor.leanglobal.cl/lg-gsp-dev/api')).replace(/\/$/, '');
  return `${base}/operaciones/its/preview-pdf/${id}`;
});

const urlPdfPreviewIframe = computed(() => {
  const id = resolvedIdProyecto.value;
  if (!id) return null;
  return `${urlPdfOficial.value}?t=${pdfPreviewTimestamp.value}`;
});

// Modo de Revisión Ejecutiva (SPEC-116 / REQ-1127 / SPEC-122 / REQ-1136): Jefaturas y Contabilidad
const vistaRevisionActiva = ref('PDF');
const obsRevisionDirecta = ref('');

const ejecutarAprobacionDirecta = () => {
  if (obsRevisionDirecta.value) {
    formFes.value.observaciones = obsRevisionDirecta.value;
  }
  abrirModalFes('APRUEBA');
};

const ejecutarDevolucionDirecta = () => {
  if (obsRevisionDirecta.value) {
    formFes.value.observaciones = obsRevisionDirecta.value;
  }
  abrirModalFes('RECHAZA');
};

const esModoRevisionEjecutiva = computed(() => {
  // 1. Si el paso pendiente actual es directivo (Paso > 1: Jefatura de Operaciones o Contabilidad)
  if (pasoPendienteActual.value && pasoPendienteActual.value.orden > 1) return true;

  // 2. Si el ITS ya fue emitido y firmado en Paso 1 (Yiara) y está en revisión o concluido
  const estado = String(its.value?.estado_its || '').toUpperCase();
  if (['EN_REVISION_OPERACIONES', 'EN_REVISION_CONTABILIDAD', 'CONCLUIDO'].includes(estado)) {
    return true;
  }

  // 3. Si viene forzado por prop readonly
  if (props.readonly) return true;

  return false;
});

const puedeFirmarPasoActual = computed(() => {
  if (!flujoData.value.pasos || flujoData.value.pasos.length === 0) return true;
  if (!pasoPendienteActual.value) return false;
  if (flujoData.value.puede_firmar !== undefined && flujoData.value.puede_firmar !== null) {
    return flujoData.value.puede_firmar === true;
  }
  return true; // Si hay un paso PENDIENTE, habilitar el botón de firma FES
});

const motivosRechazoList = ref([]);

const motivosRechazo = computed(() => {
  return motivosRechazoList.value.length ? motivosRechazoList.value : (flujoData.value.motivos_rechazo || []);
});

// Helpers visuales del Stepper y Tarjetas FES
const pasoStyle = (orden) => {
  const p = flujoData.value.pasos?.find(x => x.orden === orden);
  if (!p) return orden === 1 ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse' : 'bg-slate-900 border-white/10 text-slate-500';
  if (p.estado === 'APROBADO') return 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300';
  if (p.estado === 'PENDIENTE') return 'bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse';
  if (p.estado === 'RECHAZADO') return 'bg-rose-950/60 border-rose-500/50 text-rose-300';
  return 'bg-slate-900 border-white/10 text-slate-500';
};

const pasoIcon = (orden) => {
  const p = flujoData.value.pasos?.find(x => x.orden === orden);
  if (!p) return orden === 1 ? '✍️' : '⏳';
  if (p.estado === 'APROBADO') return '✅';
  if (p.estado === 'PENDIENTE') return '✍️';
  if (p.estado === 'RECHAZADO') return '❌';
  return '⏳';
};

const pasoResponsable = (orden, fallback) => {
  const p = flujoData.value.pasos?.find(x => x.orden === orden);
  return p?.nombre_responsable || fallback;
};

const pasoCardBorder = (orden) => {
  const p = flujoData.value.pasos?.find(x => x.orden === orden);
  if (!p) return orden === 1 ? 'border-amber-500/60 bg-amber-950/15 shadow-sm shadow-amber-950' : 'border-white/10';
  if (p.estado === 'APROBADO') return 'border-emerald-500/50 bg-emerald-950/10';
  if (p.estado === 'PENDIENTE') return 'border-amber-500/60 bg-amber-950/15 shadow-sm shadow-amber-950';
  if (p.estado === 'RECHAZADO') return 'border-rose-500/50 bg-rose-950/10';
  return 'border-white/10';
};

const pasoBadgeClass = (orden) => {
  const p = flujoData.value.pasos?.find(x => x.orden === orden);
  if (!p) return orden === 1 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-white/10';
  if (p.estado === 'APROBADO') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  if (p.estado === 'PENDIENTE') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  if (p.estado === 'RECHAZADO') return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  return 'bg-slate-800 text-slate-400 border-white/10';
};

const pasoEstado = (orden) => {
  const p = flujoData.value.pasos?.find(x => x.orden === orden);
  if (!p) return orden === 1 ? 'PENDIENTE FIRMA' : 'EN ESPERA';
  if (p.estado === 'APROBADO') return 'FIRMADO CONFORME';
  if (p.estado === 'PENDIENTE') return 'PENDIENTE FIRMA';
  if (p.estado === 'RECHAZADO') return 'RECHAZADO';
  return p.estado || 'EN ESPERA';
};

const pasoDetalleFirma = (orden) => {
  const p = flujoData.value.pasos?.find(x => x.orden === orden);
  if (!p || p.estado !== 'APROBADO') return 'A la espera de firma digital FES';
  const fecha = p.fecha_accion ? new Date(p.fecha_accion).toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '';
  return `Firmado FES: ${fecha}`;
};

const esPasoPendiente = (orden) => {
  const p = flujoData.value.pasos?.find(x => x.orden === orden);
  if (!p) return orden === 1 && puedeFirmarPasoActual.value;
  return p?.estado === 'PENDIENTE' && puedeFirmarPasoActual.value;
};

// Métodos de Carga y Guardado
const cargarITS = async () => {
  const id = resolvedIdProyecto.value;
  if (!id) return;
  try {
    cargando.value = true;
    const res = await api.get(`/operaciones/its/${id}`);
    if (res.data && res.data.success) {
      proyecto.value = res.data.data.proyecto || {};
      its.value = { ...its.value, ...res.data.data.its };
      // REQ-1104: Normalización y detección de servicio Valor Fijo
      const esFijoDetectado = Boolean(
        its.value.es_valor_fijo ||
        Number(its.value.valor_fijo_pactado || 0) > 0 ||
        (res.data.data.jornadas || []).some(j => String(j.tipo_servicio || '').toUpperCase().includes('FIJO'))
      );
      if (esFijoDetectado) {
        its.value.es_valor_fijo = true;
        if ((!its.value.valor_fijo_pactado || Number(its.value.valor_fijo_pactado) === 0) && Number(its.value.horas_minimas_pactadas) === 1) {
          its.value.valor_fijo_pactado = Number(its.value.valor_hora_pactado || 0);
          its.value.horas_minimas_pactadas = 0;
        } else if (Number(its.value.horas_minimas_pactadas) === 1 && Number(its.value.valor_fijo_pactado) > 0) {
          its.value.horas_minimas_pactadas = 0;
        }
      }
      crmPensiones.value = res.data.data.crm_pensiones || res.data.data.proyecto?.json_field?.crm_v1?.pensiones || {};
      categoriasSinCosto.value = res.data.data.its?.categorias_sin_costo || {};
      tarifaOperadorComercial.value = res.data.data.tarifa_operador_comercial || null;
      let valorFijoAsignadoLoad = false;
      jornadas.value = (res.data.data.jornadas || []).map(j => {
        let f = j.fecha;
        if (f) {
          if (typeof f === 'string') {
            f = f.split('T')[0];
          } else if (f instanceof Date) {
            f = f.toISOString().split('T')[0];
          }
        }
        const tarifa = parseFloat(j.tarifa_hora !== undefined && j.tarifa_hora !== null ? j.tarifa_hora : (res.data.data.its?.valor_hora_pactado || 0));
        const hrs = parseFloat(j.horas_report || 0);
        const hSal = j.hora_salida ? String(j.hora_salida).slice(0, 5) : '';
        const hLle = j.hora_llegada ? String(j.hora_llegada).slice(0, 5) : '';
        const hTer = j.hora_termino ? String(j.hora_termino).slice(0, 5) : '';
        const hRet = j.hora_retorno ? String(j.hora_retorno).slice(0, 5) : '';
        const colMin = j.colacion_minutos !== null && j.colacion_minutos !== undefined ? Number(j.colacion_minutos) : 0;
        const esFlete = j.tipo_servicio && String(j.tipo_servicio).toLowerCase().includes('flete');
        let hrsServ = parseFloat(j.horas_reales || 0);
        let hrsViat = parseFloat(j.horas_viaticos || 0);
        if (!esFlete) {
          const ctx = (res.data.data.its?.tipo_contexto || its.value.tipo_contexto || 'URBANO');
          const iniServ = (ctx === 'URBANO') ? (hSal || hLle) : (hLle || hSal);
          if (iniServ && hTer) {
            const minS = Math.max(0, calcularDiferenciaMinutos(iniServ, hTer) - colMin);
            hrsServ = parseFloat((minS / 60).toFixed(2));
          }
          const iniViat = hSal || hLle;
          const finViat = hRet || hTer;
          if (iniViat && finViat) {
            const minV = Math.max(0, calcularDiferenciaMinutos(iniViat, finViat) - colMin);
            hrsViat = parseFloat((minV / 60).toFixed(2));
          }
        }
        let tipoServicioNorm = j.tipo_servicio;
        const esViajeOTraslado = tipoServicioNorm === 'Registro de Viaje' || tipoServicioNorm === 'Traslado' || String(tipoServicioNorm || '').toUpperCase().includes('REGISTRO DE VIAJE');
        if (esFijoDetectado && !esViajeOTraslado) {
          const tUp = String(j.tipo_servicio || '').trim().toUpperCase();
          if (tUp.includes('FIJO')) {
            tipoServicioNorm = 'Valor Fijo';
          }
        }
        const esJornadaFija = !esViajeOTraslado && (esFijoDetectado || String(tipoServicioNorm || '').toUpperCase().includes('FIJO'));
        const vFijo = Number(its.value.valor_fijo_pactado || its.value.valor_hora_pactado || 0);
        let subtotalCalc = 0;
        let tarifaCalc = tarifa;

        if (esViajeOTraslado) {
          subtotalCalc = 0;
          tarifaCalc = 0;
        } else if (esJornadaFija) {
          tarifaCalc = vFijo > 0 ? vFijo : tarifa;
          if (!valorFijoAsignadoLoad) {
            subtotalCalc = vFijo > 0 ? vFijo : (parseFloat(j.subtotal) || tarifa);
            valorFijoAsignadoLoad = true;
          } else {
            subtotalCalc = 0;
          }
        } else {
          subtotalCalc = parseFloat(j.subtotal !== undefined && j.subtotal !== null ? j.subtotal : (hrs * tarifa));
        }

        return {
          ...j,
          tipo_servicio: tipoServicioNorm,
          tipo_viaje: j.tipo_viaje || (esViajeOTraslado ? 'IDA Y VUELTA' : ''),
          comentario_viaje: j.comentario_viaje || '',
          fecha: f || '',
          hora_salida: hSal,
          hora_llegada: hLle,
          hora_termino: hTer,
          hora_retorno: hRet,
          colacion_minutos: colMin,
          horas_reales: hrsServ,
          horas_viaticos: hrsViat,
          horas_report: esViajeOTraslado ? hrsServ : (parseFloat(j.horas_report || 0) || (hrsServ > 0 ? hrsServ : 0)),
          tarifa_hora: tarifaCalc,
          subtotal: subtotalCalc
        };
      });
      asignaciones.value = res.data.data.asignaciones || { equipos: [], personal: [] };
      const rawCostos = res.data.data.costos || {};
      const formatearItems = (lista) => (lista || []).map(it => {
        let f = it.fecha;
        if (f) {
          if (typeof f === 'string') {
            f = f.split('T')[0];
          } else if (f instanceof Date) {
            f = f.toISOString().split('T')[0];
          }
        }
        return { ...it, fecha: f || '' };
      });

      const formatearItemsMovilizacion = (lista) => (lista || []).map(it => {
        let f = it.fecha;
        if (f) {
          if (typeof f === 'string') {
            f = f.split('T')[0];
          } else if (f instanceof Date) {
            f = f.toISOString().split('T')[0];
          }
        }
        let tipo = it.tipo_movilizacion;
        let ruta = it.ruta_detalle;
        const conc = String(it.concepto_detalle || '').trim();
        const opciones = ['UBER / TAXI', 'PASAJE BUS', 'PASAJE AVION', 'TRANSFER', 'OTROS'];

        if (!tipo || !ruta) {
          if (conc.includes(' — ')) {
            const [t, ...rest] = conc.split(' — ');
            tipo = tipo || t.trim();
            ruta = (ruta !== undefined && ruta !== null && ruta !== '') ? ruta : rest.join(' — ').trim();
          } else if (opciones.includes(conc.toUpperCase())) {
            tipo = tipo || conc.toUpperCase();
            ruta = ruta || '';
          } else if (conc) {
            tipo = tipo || 'UBER / TAXI';
            ruta = (ruta !== undefined && ruta !== null && ruta !== '') ? ruta : conc;
          } else {
            tipo = tipo || 'UBER / TAXI';
            ruta = ruta || '';
          }
        }

        const conceptoFinal = (ruta || '').trim() ? `${tipo} — ${(ruta || '').trim()}` : tipo;

        return {
          ...it,
          fecha: f || '',
          tipo_movilizacion: tipo,
          ruta_detalle: ruta || '',
          concepto_detalle: conceptoFinal
        };
      });

      const formatearItemsAlimentacion = (lista) => (lista || []).map(it => {
        let f = it.fecha;
        if (f) {
          if (typeof f === 'string') {
            f = f.split('T')[0];
          } else if (f instanceof Date) {
            f = f.toISOString().split('T')[0];
          }
        }
        return {
          ...it,
          fecha: f || '',
          concepto_detalle: it.concepto_detalle || it.condicion_label || 'Ida y Regreso en el Día',
          condicion_label: it.condicion_label || it.concepto_detalle || 'Ida y Regreso en el Día'
        };
      });

      const formatearItemsOperador = (lista) => (lista || []).map(it => {
        let f = it.fecha;
        if (f) {
          if (typeof f === 'string') {
            f = f.split('T')[0];
          } else if (f instanceof Date) {
            f = f.toISOString().split('T')[0];
          }
        }
        let rol = it.rol_personal;
        if (!rol) {
          rol = resolverRolTripulante(it.nombre_personal || it.id_user);
        } else {
          const rolNorm = String(rol).toUpperCase();
          if (rolNorm.includes('RIGGER')) rol = 'RIGGER';
          else if (rolNorm.includes('CONDUCTOR') || rolNorm.includes('CHOFER')) rol = 'CONDUCTOR';
          else if (rolNorm.includes('OPERADOR')) rol = 'OPERADOR';
          else rol = resolverRolTripulante(it.nombre_personal || it.id_user);
        }
        const esRigger = rol === 'RIGGER' || it.tarifa_no_aplica;
        const faena = it.horas_faena_pagar !== undefined && it.horas_faena_pagar !== null ? parseFloat(it.horas_faena_pagar) : (parseFloat(it.horas_reales_equipo) || 0);
        const flete = parseFloat(it.horas_flete_pagar || 0);
        let cant = it.cantidad_unidades !== undefined && it.cantidad_unidades !== null ? parseFloat(it.cantidad_unidades) : (faena + flete);
        if (isNaN(cant)) cant = 0;
        const precio = esRigger ? 0 : (parseFloat(it.precio_unitario) || 0);
        const monto = esRigger ? 0 : (it.monto_total !== undefined && it.monto_total !== null ? parseFloat(it.monto_total) : Math.round(cant * precio));
        return {
          ...it,
          fecha: f || '',
          rol_personal: rol,
          tarifa_no_aplica: esRigger,
          cantidad_unidades: cant,
          horas_faena_pagar: faena,
          horas_flete_pagar: flete,
          precio_unitario: precio,
          monto_total: monto
        };
      });

      costos.value = {
        alimentacion: formatearItemsAlimentacion(rawCostos.alimentacion),
        combustible: formatearItems(rawCostos.combustible),
        movilizacion: formatearItemsMovilizacion(rawCostos.movilizacion),
        peajes: formatearItems(rawCostos.peajes),
        pensiones: formatearItems(rawCostos.pensiones),
        personal_externo: formatearItems(rawCostos.personal_externo),
        feriados: formatearItems(rawCostos.feriados),
        subcontratacion_flete: formatearItems(rawCostos.subcontratacion_flete || rawCostos.subcontrato_flete),
        gastos_extraordinarios: formatearItems(rawCostos.gastos_extraordinarios || rawCostos.gastos_extra),
        costo_hora_operador: formatearItemsOperador(rawCostos.costo_hora_operador)
      };
      // Recalcular pensiones según condiciones comerciales
      (costos.value.pensiones || []).forEach(it => recalcularPension(it));
      recalcularTotales();
      await cargarFlujo();
    }
  } catch (error) {
    console.error('Error al cargar ITS:', error);
  } finally {
    cargando.value = false;
  }
};

const guardar = async (cerrarModal = false) => {
  try {
    guardando.value = true;
    // Sincronizar movilización
    if (Array.isArray(costos.value?.movilizacion)) {
      costos.value.movilizacion.forEach(it => sincronizarGlosaMovilizacion(it));
    }
    // Sincronizar viático alimentación
    if (Array.isArray(costos.value?.alimentacion)) {
      costos.value.alimentacion.forEach(it => {
        if (!it.condicion_label && it.concepto_detalle) {
          it.condicion_label = it.concepto_detalle;
        }
      });
    }
    // REQ-1104: Consolidar y recalcular costos de operadores antes de enviar payload
    if (Array.isArray(costos.value?.costo_hora_operador)) {
      costos.value.costo_hora_operador.forEach(it => {
        if (it.rol_personal === 'RIGGER' || it.tarifa_no_aplica) {
          it.precio_unitario = 0;
          it.monto_total = 0;
        } else {
          const precio = parseFloat(it.precio_unitario) || 0;
          const horas = parseFloat(it.cantidad_unidades) || 0;
          it.monto_total = Math.round(precio * horas);
        }
      });
    }
    recalcularTotales();
    its.value.categorias_sin_costo = categoriasSinCosto.value;
    const payload = {
      id_proyecto: resolvedIdProyecto.value,
      cabecera: its.value,
      jornadas: jornadas.value,
      costos: costos.value
    };
    const res = await api.post('/operaciones/its/guardar', payload);
    if (res.data && res.data.success) {
      if (res.data.id_its) its.value.id_its = res.data.id_its;
      await cargarFlujo();
      emit('actualizado');
      if (cerrarModal) cerrar();
    }
  } catch (error) {
    console.error('Error al guardar ITS:', error);
    alert('Error al guardar ITS: ' + (error.response?.data?.message || error.message));
  } finally {
    guardando.value = false;
  }
};

const guardarYPasarEDP = async () => {
  await guardar(false);
  emit('avanzar-edp');
};

const cargarFlujo = async () => {
  const id = resolvedIdProyecto.value;
  if (!id) return;
  try {
    const res = await api.get(`/operaciones/its/flujo/${id}?id_user=${usuarioActual.value?.id_user || 1}`);
    if (res.data && res.data.success && res.data.data) {
      if (Array.isArray(res.data.data.pasos) && res.data.data.pasos.length > 0) {
        flujoData.value = {
          ...flujoData.value,
          ...res.data.data,
          puede_firmar: res.data.data.puede_firmar !== undefined ? res.data.data.puede_firmar : true
        };
        if (res.data.data.motivos_rechazo?.length) {
          motivosRechazoList.value = res.data.data.motivos_rechazo;
        }
        return;
      }
      if (res.data.data.motivos_rechazo?.length) {
        motivosRechazoList.value = res.data.data.motivos_rechazo;
      }
    }
  } catch (eFlujo) {
    console.warn('Fallback cargarFlujo via /operaciones/its/flujo:', eFlujo.message);
  }

  // 1. Cargar catálogo de motivos de rechazo desde servicio canónico
  try {
    const resMotivos = await api.get('/servicio/leanglobal/obtnerMotivosRechazo');
    if (resMotivos.data && Array.isArray(resMotivos.data)) {
      motivosRechazoList.value = resMotivos.data;
    }
  } catch (eMotivos) {
    console.warn('Fallback motivos rechazo:', eMotivos.message);
  }

  // 2. Si el ITS ya tiene id_flow, consultar pasos reales desde servicio canónico
  if (its.value?.id_flow) {
    try {
      const resSteps = await api.get(`/servicio/leanglobal/flujosAprobacionSteps?id_flow=${its.value.id_flow}`);
      if (resSteps.data && Array.isArray(resSteps.data) && resSteps.data.length > 0) {
        flujoData.value.pasos = resSteps.data.map(s => ({
          id_flow_stp: s.id_flow_stp,
          id_flow: s.id_flow,
          orden: s.flow_tmpl_step_orden,
          nombre_paso: s.flow_tmpl_step_name || s.flow_tmpl_step_fase,
          estado: s.estado,
          id_user: s.id_user,
          nombre_usuario: s.nombre_user,
          rol_nom: s.name_rol,
          id_motivo_rechazo: s.id_motivo_rechazo,
          motivo_rechazo: s.motivo_rechazo,
          observaciones: s.flow_step_obs,
          fecha_firma: s.fecha_event
        }));
        flujoData.value.puede_firmar = true;
        return;
      }
    } catch (eSteps) {
      console.warn('Fallback flujosAprobacionSteps:', eSteps.message);
    }
  }

  // 3. Fallback determinista Template 90 (FES 3 pasos) según estado del ITS
  const est = its.value?.estado_its || 'BORRADOR';
  flujoData.value.pasos = [
    { orden: 1, nombre_paso: '1. Elaboración & Liquidación Técnica', estado: est !== 'BORRADOR' && est !== 'EN_CORRECCION' ? 'APROBADO' : 'PENDIENTE', rol_nom: 'Analista de Operaciones' },
    { orden: 2, nombre_paso: '2. V°B° Jefatura de Operaciones', estado: est === 'EN_REVISION_OPERACIONES' ? 'PENDIENTE' : (est === 'EN_REVISION_CONTABILIDAD' || est === 'CONCLUIDO' ? 'APROBADO' : 'EN ESPERA'), rol_nom: 'Jefe de Operaciones' },
    { orden: 3, nombre_paso: '3. Recepción Conforme Contabilidad', estado: est === 'EN_REVISION_CONTABILIDAD' ? 'PENDIENTE' : (est === 'CONCLUIDO' ? 'APROBADO' : 'EN ESPERA'), rol_nom: 'Contabilidad y Finanzas' }
  ];
  flujoData.value.puede_firmar = true;
};

const hashPinSha256 = async (pin) => {
  const msgUint8 = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const abrirModalFes = async (decision = 'APRUEBA') => {
  formFes.value = {
    aprueba_rechaza: decision,
    id_motivo_rechazo: null,
    observaciones: '',
    pin: ''
  };
  errorFes.value = null;
  mostrarModalFes.value = true;
  await recargarPreviewPdf();
};

const cerrarModalFes = () => {
  mostrarModalFes.value = false;
  errorFes.value = null;
  formFes.value.pin = '';
};

const recargarPreviewPdf = async () => {
  pdfPreviewTimestamp.value = Date.now();
};

const abrirPreviewPdfDirecto = () => {
  if (!urlPdfOficial.value || urlPdfOficial.value === '#') return;
  window.open(urlPdfOficial.value, '_blank', 'noopener,noreferrer');
};

const confirmarFirmaFes = async () => {
  if (!formFes.value.pin || formFes.value.pin.length !== 4) {
    errorFes.value = 'Debes ingresar un PIN FES válido de 4 dígitos numéricos.';
    return;
  }

  if (formFes.value.aprueba_rechaza === 'RECHAZA') {
    if (!formFes.value.id_motivo_rechazo) {
      errorFes.value = 'Debes seleccionar el motivo formal de rechazo.';
      return;
    }
    if (!formFes.value.observaciones || formFes.value.observaciones.trim().length < 5) {
      errorFes.value = 'Debes ingresar observaciones detalladas explicando la causal de devolución al analista.';
      return;
    }
  }

  // Auto-completar categorías sin movimientos como 'Sin Costo' para permitir la firma expedita
  if (formFes.value.aprueba_rechaza === 'APRUEBA' && (pasoPendienteActual.value?.orden === 1 || !pasoPendienteActual.value)) {
    categoriasCostosTabs.forEach(t => {
      if (getEstadoCategoria(t.key) === 'PENDIENTE') {
        categoriasSinCosto.value[t.key] = true;
      }
    });
  }

  try {
    enviandoFes.value = true;
    errorFes.value = null;

    // Asegurar que el ITS esté persistido en BD antes de firmar FES
    if (!its.value.id_its) {
      await guardar(false);
    }

    const pass_hash_fes = await hashPinSha256(formFes.value.pin);
    const payload = {
      id_proyecto: resolvedIdProyecto.value,
      id_its: its.value.id_its,
      id_user: usuarioActual.value?.id_user || 1,
      id_flow_step: pasoPendienteActual.value?.id_flow_step || pasoPendienteActual.value?.id_flow_stp,
      aprueba_rechaza: formFes.value.aprueba_rechaza,
      id_motivo_rechazo: formFes.value.id_motivo_rechazo,
      observaciones: formFes.value.observaciones,
      pass_hash_fes,
      pass_fes: pass_hash_fes
    };

    const res = await api.post('/operaciones/its/firmar-fes', payload);
    if (res.data && res.data.success) {
      cerrarModalFes();
      await cargarITS();
      await cargarFlujo();
      emit('actualizado');
    }
  } catch (error) {
    console.error('Error al firmar FES:', error);
    errorFes.value = error.response?.data?.message || error.message || 'Error al procesar firma FES.';
  } finally {
    enviandoFes.value = false;
  }
};

const etiquetaModalidadFlete = computed(() => {
  const u = String(its.value?.unidad_flete_pactado || '').toUpperCase().trim();
  if (u === 'TRASLADO IDA') return 'Pactado (Solo Ida faena)';
  if (u === 'TRASLADO RETORNO') return 'Pactado (Solo Retorno base)';
  return 'Pactado (Ida + Retorno faena)';
});

const ventaNetaProyectadaComercial = computed(() => {
  if (esServicioValorFijo.value) {
    const valFijo = parseFloat(its.value?.valor_fijo_pactado || its.value?.valor_hora_pactado || 0);
    const valFlete = parseFloat(its.value?.valor_flete_pactado || 0);
    return Math.round(valFijo + valFlete);
  }
  const hrsBase = parseFloat(its.value?.horas_minimas_pactadas || 0);
  const valHora = parseFloat(its.value?.valor_hora_pactado || 0);
  const valFlete = parseFloat(its.value?.valor_flete_pactado || 0);
  const calcDirecto = Math.round((hrsBase * valHora) + valFlete);
  if (calcDirecto > 0) return calcDirecto;
  if (Number(its.value?.venta_neta_proyectada_comercial) > 0) {
    return Number(its.value.venta_neta_proyectada_comercial);
  }
  return parseFloat(its.value?.total_ingresos_facturables || 0);
});

// Motor Reactivo de Cálculos
const recalcularTotales = () => {
  // 1. Horas facturables y Subtotal por Jornada
  let totalHrs = 0;
  let totalIngHoras = 0;
  let totalIngFletes = 0;
  const vHoraDefault = parseFloat(its.value.valor_hora_pactado || 0);
  const esFijo = esServicioValorFijo.value;
  const vFijo = Number(its.value.valor_fijo_pactado || its.value.valor_hora_pactado || 0);
  let fijoAsignado = false;

  jornadas.value.forEach(j => {
    const tipo = j.tipo_servicio || '';
    const esViajeOTraslado = tipo === 'Registro de Viaje' || tipo === 'Traslado' || String(tipo).toUpperCase().includes('REGISTRO DE VIAJE');

    if (esViajeOTraslado) {
      j.tarifa_hora = 0;
      j.subtotal = 0;
      const hrs = parseFloat(j.horas_report || j.horas_reales || 0);
      if (!j.es_oculta) {
        totalHrs += hrs;
      }
      return;
    }

    const esFlete = tipo && tipo.toLowerCase().includes('flete');
    const esJornadaFija = esFijo || String(tipo).toUpperCase().includes('FIJO');

    if (j.tarifa_hora === undefined || j.tarifa_hora === null || isNaN(j.tarifa_hora)) {
      if (esFlete) {
        j.tarifa_hora = Math.round(parseFloat(its.value.valor_flete_pactado || 400000) / 2);
      } else if (esJornadaFija && vFijo > 0) {
        j.tarifa_hora = vFijo;
      } else {
        j.tarifa_hora = vHoraDefault;
      }
    }
    const hrs = parseFloat(j.horas_report || 0);
    const tarifa = parseFloat(j.tarifa_hora || 0);

    if (esFlete) {
      j.subtotal = hrs * tarifa;
    } else if (esJornadaFija) {
      // REQ-1104: En servicio valor fijo, el subtotal comercial es el valor fijo pactado, NO hrs * tarifa
      if (!fijoAsignado && !j.es_oculta) {
        j.subtotal = vFijo > 0 ? vFijo : tarifa;
        fijoAsignado = true;
      } else {
        j.subtotal = 0;
      }
    } else {
      j.subtotal = hrs * tarifa;
    }

    if (!j.es_oculta) {
      if (esFlete) {
        totalIngFletes += j.subtotal;
      } else {
        totalHrs += hrs;
        totalIngHoras += j.subtotal;
      }
    }
  });

  its.value.total_horas_report = totalHrs;
  // SPEC-128: En servicio de Valor Fijo, si no hay jornadas cargadas o subtotal acumuló 0, el ingreso facturable de horas es el valor_fijo_pactado
  if (esFijo && totalIngHoras === 0 && Number(its.value.valor_fijo_pactado || 0) > 0) {
    totalIngHoras = Number(its.value.valor_fijo_pactado);
  }
  its.value.total_ingresos_horas = totalIngHoras;

  // 2. Ingresos
  if (totalIngFletes > 0) {
    its.value.total_ingresos_fletes = totalIngFletes;
  } else {
    its.value.total_ingresos_fletes = parseFloat(its.value.valor_flete_pactado || 0);
  }
  its.value.total_ingresos_facturables = its.value.total_ingresos_horas + its.value.total_ingresos_fletes;

  // 3. Costos (suma de las 9 categorías)
  let totalCostos = 0;
  Object.keys(costos.value).forEach(cat => {
    (costos.value[cat] || []).forEach(item => {
      totalCostos += parseFloat(item.monto_total || 0);
    });
  });
  its.value.total_costos_operacionales = totalCostos;

  // 4. Utilidad y Margen
  its.value.utilidad_bruta = its.value.total_ingresos_facturables - totalCostos;
  if (its.value.total_ingresos_facturables > 0) {
    its.value.margen_porcentaje = (its.value.utilidad_bruta / its.value.total_ingresos_facturables) * 100;
  } else {
    its.value.margen_porcentaje = 0;
  }
};

const calcularDiferenciaMinutos = (hInicio, hFin) => {
  if (!hInicio || !hFin) return 0;
  const [h1, m1] = hInicio.split(':').map(Number);
  const [h2, m2] = hFin.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diff < 0) diff += 24 * 60; // soporte cruce de medianoche
  return diff;
};

const calcularHorasReales = (j) => {
  let minTotales = 0;
  const tipo = j.tipo_servicio || 'Hora';
  const esViajeOTraslado = tipo === 'Registro de Viaje' || tipo === 'Traslado' || String(tipo).toUpperCase().includes('REGISTRO DE VIAJE');

  if (esViajeOTraslado) {
    // REQ-1104: Registro de Viaje o Traslado (tracto/rampla)
    const horaInicioServicio = j.hora_salida || j.hora_llegada;
    minTotales = Math.max(0, calcularDiferenciaMinutos(horaInicioServicio, j.hora_termino) - (Number(j.colacion_minutos) || 0));
    if (!j.horas_reales_manual) {
      j.horas_reales = parseFloat((minTotales / 60).toFixed(2));
    }
    j.horas_report = j.horas_reales;
    j.tarifa_hora = 0;
    j.subtotal = 0;
  } else if (tipo === 'Flete Solo Ida') {
    // Tramo de carretera de ida: Salida de Patio a Llegada a Faena
    minTotales = calcularDiferenciaMinutos(j.hora_salida, j.hora_llegada);
    if (!j.horas_reales_manual) {
      j.horas_reales = parseFloat((minTotales / 60).toFixed(1)) || 1.0;
    }
    if (!j.horas_report || j.horas_report === 0) {
      j.horas_report = 1.0;
    }
    if (!j.tarifa_hora || j.tarifa_hora === parseFloat(its.value.valor_hora_pactado || 0)) {
      j.tarifa_hora = Math.round(parseFloat(its.value.valor_flete_pactado || 400000) / 2) || 200000;
    }
  } else if (tipo === 'Flete Solo Retorno') {
    // Tramo de carretera de regreso: Término de Faena a Retorno a Patio
    minTotales = calcularDiferenciaMinutos(j.hora_termino, j.hora_retorno);
    if (!j.horas_reales_manual) {
      j.horas_reales = parseFloat((minTotales / 60).toFixed(1)) || 1.0;
    }
    if (!j.horas_report || j.horas_report === 0) {
      j.horas_report = 1.0;
    }
    if (!j.tarifa_hora || j.tarifa_hora === parseFloat(its.value.valor_hora_pactado || 0)) {
      j.tarifa_hora = Math.round(parseFloat(its.value.valor_flete_pactado || 400000) / 2) || 200000;
    }
  } else if (tipo === 'Flete Ida y Retorno') {
    // Ambos tramos carreteros
    const minIda = calcularDiferenciaMinutos(j.hora_salida, j.hora_llegada);
    const minRetorno = calcularDiferenciaMinutos(j.hora_termino, j.hora_retorno);
    minTotales = minIda + minRetorno;
    if (!j.horas_reales_manual) {
      j.horas_reales = parseFloat((minTotales / 60).toFixed(1)) || 2.0;
    }
    if (!j.horas_report || j.horas_report === 0) {
      j.horas_report = 1.0;
    }
    if (!j.tarifa_hora || j.tarifa_hora === parseFloat(its.value.valor_hora_pactado || 0)) {
      j.tarifa_hora = parseFloat(its.value.valor_flete_pactado || 400000);
    }
  } else {
    // Faena normal (Hora, Mensual, Fijo): HRS SERVICIO según régimen URBANO (Salida -> Término) o RURAL (Llegada -> Término) descontando colación
    const horaInicioServicio = (its.value.tipo_contexto === 'URBANO')
      ? (j.hora_salida || j.hora_llegada)
      : (j.hora_llegada || j.hora_salida);
    minTotales = Math.max(0, calcularDiferenciaMinutos(horaInicioServicio, j.hora_termino) - (Number(j.colacion_minutos) || 0));
    if (!j.horas_reales_manual) {
      j.horas_reales = parseFloat((minTotales / 60).toFixed(2));
    }

    const esFijo = esServicioValorFijo.value || String(j.tipo_servicio || '').toUpperCase().includes('FIJO');
    if (esFijo) {
      // REQ-1104: En valor fijo, j.horas_report refleja las horas reales de terreno sin forzar piso mínimo
      j.horas_report = j.horas_reales > 0 ? j.horas_reales : (parseFloat(j.horas_report || 0) || 0);
      const vFijo = Number(its.value.valor_fijo_pactado || its.value.valor_hora_pactado || 0);
      if (!j.tarifa_hora || j.tarifa_hora === 0) {
        j.tarifa_hora = vFijo;
      }
    } else {
      const pisoMin = parseFloat(its.value.horas_minimas_pactadas || 4.0);
      if (!j.id_reporte_avance) {
        // Fila insertada manualmente: actualizar horas_report reactivamente con las horas reales
        j.horas_report = j.horas_reales > 0 ? j.horas_reales : pisoMin;
      } else if (!j.horas_report || j.horas_report === 0 || j.horas_reales > j.horas_report) {
        // Fila de Report validado: nunca reducir por debajo del mínimo/horas validadas en el Report, solo subir si horas_reales lo supera
        j.horas_report = Math.max(parseFloat(j.horas_report || 0), j.horas_reales, pisoMin);
      }
      if (!j.tarifa_hora || j.tarifa_hora > 150000) {
        j.tarifa_hora = parseFloat(its.value.valor_hora_pactado || 85000);
      }
    }
  }

  // RECOMENDACIÓN AUTOMÁTICA UNIVERSAL DE HORAS DE VIÁTICO (Salida a Retorno descontando colación)
  if (!j.horas_viaticos_manual) {
    const iniViatico = j.hora_salida || j.hora_llegada;
    const finViatico = j.hora_retorno || j.hora_termino || j.hora_llegada;
    if (iniViatico && finViatico) {
      const minViaticos = Math.max(0, calcularDiferenciaMinutos(iniViatico, finViatico) - (Number(j.colacion_minutos) || 0));
      j.horas_viaticos = parseFloat((minViaticos / 60).toFixed(2));
    } else {
      j.horas_viaticos = 0;
    }
  }

  recalcularTotales();
};

const toggleOcultarFila = (j) => {
  j.es_oculta = !j.es_oculta;
  recalcularTotales();
};

const agregarJornada = () => {
  const hoy = new Date().toISOString().split('T')[0];
  const tarifa = parseFloat(its.value.valor_hora_pactado || 0);
  const hrs = parseFloat(its.value.horas_minimas_pactadas || 8.0);
  jornadas.value.push({
    id_jornada: null,
    id_its: its.value.id_its,
    fecha: hoy,
    numero_ot: proyecto.value.codi_proyecto || 'OT',
    patente: asignaciones.value.equipos?.[0]?.patente || '',
    equipo_modelo: asignaciones.value.equipos?.[0]?.modelo || '',
    tipo_servicio: 'Hora',
    hora_salida: '08:00',
    hora_llegada: '08:30',
    hora_termino: '18:00',
    hora_retorno: '19:00',
    colacion_minutos: 60,
    horas_reales: 8.5,
    horas_report: hrs,
    tarifa_hora: tarifa,
    subtotal: hrs * tarifa,
    numero_report: '',
    es_oculta: false,
    vb_conciliado: false,
    orden: jornadas.value.length + 1
  });
  recalcularTotales();
};

const agregarJornadaDocFisico = () => {
  const hoy = new Date().toISOString().split('T')[0];
  const tarifa = parseFloat(its.value.valor_hora_pactado || 0);
  const hrs = parseFloat(its.value.horas_minimas_pactadas || 8.0);
  jornadas.value.push({
    id_jornada: null,
    id_its: its.value.id_its,
    fecha: hoy,
    numero_ot: proyecto.value.codi_proyecto || 'OT',
    patente: asignaciones.value.equipos?.[0]?.patente || '',
    equipo_modelo: asignaciones.value.equipos?.[0]?.modelo || '',
    tipo_servicio: 'Hora',
    tipo_respaldo: 'FISICO_MANUAL',
    hora_salida: '08:00',
    hora_llegada: '08:30',
    hora_termino: '18:00',
    hora_retorno: '19:00',
    colacion_minutos: 60,
    horas_reales: 8.5,
    horas_report: hrs,
    tarifa_hora: tarifa,
    subtotal: hrs * tarifa,
    numero_report: 'DOC-FIS-' + Math.floor(1000 + Math.random() * 9000),
    es_oculta: false,
    vb_conciliado: true,
    orden: jornadas.value.length + 1
  });
  recalcularTotales();
};

const agregarJornadaPisoMinimo = () => {
  const hoy = new Date().toISOString().split('T')[0];
  const tarifa = parseFloat(its.value.valor_hora_pactado || 0);
  const hrs = parseFloat(its.value.horas_minimas_pactadas || 8.0);
  jornadas.value.push({
    id_jornada: null,
    id_its: its.value.id_its,
    fecha: hoy,
    numero_ot: proyecto.value.codi_proyecto || 'OT',
    patente: asignaciones.value.equipos?.[0]?.patente || '',
    equipo_modelo: asignaciones.value.equipos?.[0]?.modelo || '',
    tipo_servicio: 'Hora',
    tipo_respaldo: 'PISO_MINIMO',
    hora_salida: null,
    hora_llegada: null,
    hora_termino: null,
    hora_retorno: null,
    colacion_minutos: 0,
    horas_reales: 0,
    horas_report: hrs,
    tarifa_hora: tarifa,
    subtotal: hrs * tarifa,
    numero_report: 'PISO-MIN-STANDBY',
    es_oculta: false,
    vb_conciliado: true,
    orden: jornadas.value.length + 1
  });
  recalcularTotales();
};

const agregarFlete = (tipo = 'Flete Solo Ida') => {
  const hoy = new Date().toISOString().split('T')[0];
  const montoFlete = Math.round(parseFloat(its.value.valor_flete_pactado || 400000) / 2) || 200000;
  jornadas.value.push({
    id_jornada: null,
    id_its: its.value.id_its,
    fecha: hoy,
    numero_ot: proyecto.value.codi_proyecto || 'OT',
    patente: asignaciones.value.equipos?.[0]?.patente || '',
    equipo_modelo: asignaciones.value.equipos?.[0]?.modelo || '',
    tipo_servicio: tipo,
    hora_salida: tipo.includes('Ida') ? '07:00' : null,
    hora_llegada: tipo.includes('Ida') ? '08:00' : null,
    hora_termino: tipo.includes('Retorno') ? '18:00' : null,
    hora_retorno: tipo.includes('Retorno') ? '19:00' : null,
    colacion_minutos: 0,
    horas_reales: 1.0,
    horas_report: 1.0,
    tarifa_hora: montoFlete,
    subtotal: montoFlete,
    numero_report: tipo.includes('Ida') ? 'FLE-IDA' : 'FLE-RET',
    es_oculta: false,
    vb_conciliado: true,
    orden: jornadas.value.length + 1
  });
  recalcularTotales();
};

const eliminarJornada = (idx) => {
  jornadas.value.splice(idx, 1);
  recalcularTotales();
};

// Costos Helpers
const resolverUrlArchivo = (pathOrUrl) => {
  if (!pathOrUrl) return '#';
  if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('data:')) return pathOrUrl;
  const isProd = typeof window !== 'undefined' && window.location.pathname.startsWith('/lg-gsp-prod');
  const base = (api.defaults.baseURL || (isProd ? 'https://servidor.leanglobal.cl/lg-gsp-prod/api' : 'https://servidor.leanglobal.cl/lg-gsp-dev/api')).replace(/\/$/, '');
  const prefix = base.replace(/\/api$/, '');
  if (pathOrUrl.startsWith('/api/archivo')) return `${prefix}${pathOrUrl}`;
  return `${base}/archivo/ver/${encodeURIComponent(pathOrUrl)}`;
};

// Modal Visor Lightbox de Comprobante / Evidencia
const imagenModalVisible = ref(false);
const imagenModalUrl = ref('');

const abrirVisorImagen = (url) => {
  if (!url) return;
  imagenModalUrl.value = resolverUrlArchivo(url);
  imagenModalVisible.value = true;
};

const cerrarVisorImagen = () => {
  imagenModalVisible.value = false;
  imagenModalUrl.value = '';
};

const subirComprobante = async (event, item) => {
  const file = event.target?.files?.[0];
  if (!file) return;

  // 1. Inmediatamente mostrar la miniatura en pantalla vía DataURL local (0ms lag visual)
  const reader = new FileReader();
  reader.onload = (e) => {
    item.archivo_comprobante_url = e.target.result;
  };
  reader.readAsDataURL(file);

  // 2. Persistir en el servidor de archivos
  try {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('categoria', 'ITS_COMPROBANTES');
    formData.append('id_proyecto', props.idProyecto);

    const res = await api.post('/archivo/imagen', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.data) {
      const idDoc = res.data.archivo?.id_doc || res.data.id_doc;
      const urlDoc = idDoc ? `/api/archivo/ver/${idDoc}` : (res.data.url || res.data.path || '');
      if (urlDoc) {
        item.archivo_comprobante_url = urlDoc;
      }
    }
  } catch (err) {
    console.warn('Fallo upload servidor comprobante, se mantiene DataURL en cliente:', err);
  }
};

const agregarItemCosto = (cat) => {
  const catKey = normalizarCatKey(cat);
  const hoy = new Date().toISOString().split('T')[0];
  if (!costos.value[catKey]) costos.value[catKey] = [];
  
  if (catKey === 'combustible') {
    costos.value[catKey].push({
      fecha: hoy,
      patente: patentesAsignadas.value?.[0]?.patente || '',
      tipo_estanque: 'PRINCIPAL_CHASIS',
      cantidad_unidades: 0,
      precio_unitario: 0,
      numero_oc: '',
      archivo_comprobante_url: '',
      concepto_detalle: 'Carga Combustible Manual',
      monto_total: 0,
      origen_registro: 'MANUAL'
    });
  } else if (catKey === 'movilizacion') {
    costos.value[catKey].push({
      fecha: hoy,
      nombre_personal: personalAsignadoLista.value?.[0]?.nombre || '',
      tipo_movilizacion: 'UBER / TAXI',
      ruta_detalle: '',
      concepto_detalle: 'UBER / TAXI',
      numero_oc: '',
      archivo_comprobante_url: '',
      monto_total: 0
    });
  } else if (catKey === 'pensiones') {
    costos.value[catKey].push({
      fecha: hoy,
      numero_oc: '',
      nombre_personal: personalAsignadoLista.value?.[0]?.nombre || '',
      monto_desayuno: 0,
      monto_almuerzo: 0,
      monto_cena: 0,
      monto_alojamiento: 0,
      monto_traslado: 0,
      monto_total_gsp: 0,
      monto_total_cliente: 0,
      monto_total: 0
    });
  } else if (catKey === 'costo_hora_operador') {
    const defaultTripulante = personalAsignadoLista.value?.[0]?.nombre || '';
    const defaultPat = patentesAsignadas.value?.[0]?.patente || '';
    const tarifaSugerida = tarifaOperadorComercial.value?.valor_hora || 5000;
    costos.value[catKey].push({
      fecha: hoy,
      patente: defaultPat,
      nombre_personal: defaultTripulante,
      rol_personal: 'OPERADOR',
      concepto_detalle: 'Horas Operador Estándar Faena',
      hora_salida: null,
      hora_llegada: null,
      hora_termino: null,
      hora_retorno: null,
      colacion_horas: 0,
      horas_reales_equipo: 8,
      horas_standby_gsp: 0,
      horas_standby_cliente: 0,
      horas_faena_pagar: 8,
      horas_flete_pagar: 0,
      precio_unitario: tarifaSugerida,
      tarifa_sugerida: tarifaSugerida,
      tarifa_modificada: true,
      modificado_por: 'Control de Gestión',
      vb_validado: true,
      cantidad_unidades: 8,
      monto_total: tarifaSugerida * 8
    });
  } else if (catKey === 'alimentacion') {
    costos.value[catKey].push({
      fecha: hoy,
      patente: patentesAsignadas.value?.[0]?.patente || '',
      nombre_personal: personalAsignadoLista.value?.[0]?.nombre || '',
      rol_personal: 'OPERADOR',
      condicion_dia: 'IDA_Y_REGRESO',
      condicion_label: 'Ida y Regreso en el Día (Salida a Retorno)',
      concepto_detalle: 'Viático Alimentación — Ida y Regreso en el Día (8h efectivas)',
      desde: null,
      hasta: null,
      colacion_horas: 0,
      horas_efectivas: 8,
      horas_redondeadas: 8,
      cantidad_unidades: 8,
      precio_unitario: 7000,
      tarifa_sugerida: 7000,
      tarifa_modificada: true,
      modificado_por: 'Control de Gestión',
      vb_validado: true,
      monto_total: 7000
    });
  } else {
    costos.value[catKey].push({
      fecha: hoy,
      patente: catKey === 'peajes' ? (patentesAsignadas.value?.[0]?.patente || '') : '',
      numero_oc: '',
      nombre_personal: '',
      concepto_detalle: '',
      archivo_comprobante_url: '',
      monto_total: 0
    });
  }
  recalcularTotales();
};

const recalcularCombustible = (it) => {
  const lts = parseFloat(it.cantidad_unidades) || 0;
  const precio = parseFloat(it.precio_unitario) || 0;
  if (lts > 0 && precio > 0) {
    it.monto_total = Math.round(lts * precio);
  }
  recalcularTotales();
};

const eliminarItemCosto = (cat, idx) => {
  const catKey = normalizarCatKey(cat);
  if (costos.value[catKey] && Array.isArray(costos.value[catKey])) {
    costos.value[catKey].splice(idx, 1);
    recalcularTotales();
  }
};

const esGsp = (key) => (crmPensiones.value[`${key}_costeado`] || '').toUpperCase() === 'SAN_PABLO';

const recalcularPension = (it) => {
  const des = parseFloat(it.monto_desayuno) || 0;
  const alm = parseFloat(it.monto_almuerzo) || 0;
  const cen = parseFloat(it.monto_cena) || 0;
  const alj = parseFloat(it.monto_alojamiento) || 0;
  const tra = parseFloat(it.monto_traslado) || 0;

  let totalGsp = 0;
  let totalCli = 0;

  if (esGsp('desayuno')) totalGsp += des; else totalCli += des;
  if (esGsp('almuerzo')) totalGsp += alm; else totalCli += alm;
  if (esGsp('cena')) totalGsp += cen; else totalCli += cen;
  if (esGsp('alojamiento')) totalGsp += alj; else totalCli += alj;
  if (esGsp('traslado')) totalGsp += tra; else totalCli += tra;

  it.monto_total_gsp = totalGsp;
  it.monto_total_cliente = totalCli;
  // Solo suma a los costos de GSP si fue pactado como SAN_PABLO
  it.monto_total = totalGsp;

  recalcularTotales();
};

const resolverTarifaOperadorCliente = (tipo_equipo, capacidad_ton) => {
  const tipoNorm = (tipo_equipo || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  let ton = parseFloat(capacidad_ton);
  if (isNaN(ton) || ton <= 0) {
    const matchTon = tipoNorm.match(/(\d+)\s*(?:TON|TONELADAS|T\b)/);
    if (matchTon) {
      ton = parseFloat(matchTon[1]);
    } else {
      const matchNum = tipoNorm.match(/\b(400|300|250|220|160|150|120|100|90|80|75|70|60|55|50|40)\b/);
      if (matchNum) ton = parseFloat(matchNum[1]);
    }
  }

  if ((tipoNorm.includes('CAMION') && tipoNorm.includes('PLUMA')) || tipoNorm.includes('PLUMA')) {
    return 3500;
  }
  if (tipoNorm.includes('MANIPULADOR')) {
    return 3000;
  }
  if (tipoNorm.includes('HORQUILLA')) {
    return 3000;
  }

  if (ton > 0) {
    if (ton <= 55) return 5000;
    if (ton <= 90) return 6000;
    if (ton <= 120) return 7000;
    if (ton <= 160) return 10000;
    if (ton <= 300) return 13000;
    return 20000;
  }

  return 5000;
};

const onPatenteOperadorChange = (it) => {
  if (it.rol_personal === 'RIGGER' || it.tarifa_no_aplica) {
    it.precio_unitario = 0;
    it.monto_total = 0;
    recalcularTotales();
    return;
  }
  const sug = tarifaOperadorComercial.value?.valor_hora || 5000;
  it.tarifa_sugerida = sug;
  if (!it.tarifa_modificada) {
    it.precio_unitario = sug;
    recalcularCostoOperador(it);
  }
};

const onHorarioOperadorChange = (it) => {
  const colMin = Math.round((parseFloat(it.colacion_horas) || 0) * 60);
  if (it.hora_llegada && it.hora_termino) {
    const minFaena = Math.max(0, calcularDiferenciaMinutos(it.hora_llegada, it.hora_termino) - colMin);
    const hrsReal = parseFloat((minFaena / 60).toFixed(1));
    it.horas_reales_equipo = hrsReal;
    const pisoMin = parseFloat(its.value.horas_minimas_pactadas || 4.0);
    if (!it.id_reporte_avance) {
      it.horas_faena_pagar = hrsReal > 0 ? hrsReal : pisoMin;
    } else if (hrsReal > (parseFloat(it.horas_faena_pagar) || 0)) {
      it.horas_faena_pagar = hrsReal;
    }
  }
  if (it.hora_salida && it.hora_retorno) {
    const minTotalViaje = Math.max(0, calcularDiferenciaMinutos(it.hora_salida, it.hora_retorno) - colMin);
    const hrsTotalViaje = parseFloat((minTotalViaje / 60).toFixed(1));
    const hrsFaena = parseFloat(it.horas_faena_pagar) || parseFloat(it.horas_reales_equipo) || 0;
    it.horas_flete_pagar = Math.max(0, parseFloat((hrsTotalViaje - hrsFaena).toFixed(1)));
  }
  const faena = parseFloat(it.horas_faena_pagar) || 0;
  const flete = Math.max(0, parseFloat(it.horas_flete_pagar) || 0);
  if (faena > 0 || flete > 0) {
    it.cantidad_unidades = parseFloat((faena + flete).toFixed(2));
  }
  recalcularCostoOperador(it, true);
};

const onFleteOperadorChange = (it) => {
  const faena = parseFloat(it.horas_faena_pagar) || 0;
  const flete = Math.max(0, parseFloat(it.horas_flete_pagar) || 0);
  it.cantidad_unidades = parseFloat((faena + flete).toFixed(2));
  recalcularCostoOperador(it, true);
};

const recalcularCostoOperador = (it, forzarModificado = false) => {
  if (it.rol_personal === 'RIGGER' || it.tarifa_no_aplica) {
    it.precio_unitario = 0;
    it.monto_total = 0;
    if (forzarModificado) {
      it.tarifa_modificada = true;
      it.modificado_por = 'Control de Gestión';
    }
    recalcularTotales();
    return;
  }
  const precio = parseFloat(it.precio_unitario) || 0;
  const horas = parseFloat(it.cantidad_unidades) || 0;
  if (forzarModificado && horas >= 0) {
    const flete = parseFloat(it.horas_flete_pagar) || 0;
    it.horas_faena_pagar = Math.max(0, parseFloat((horas - flete).toFixed(2)));
  }
  it.monto_total = Math.round(precio * horas);

  if (forzarModificado) {
    it.tarifa_modificada = true;
    it.modificado_por = 'Control de Gestión';
  } else if (it.tarifa_sugerida !== undefined && it.tarifa_sugerida !== null) {
    const sug = parseFloat(it.tarifa_sugerida);
    if (Math.abs(precio - sug) > 0.01) {
      it.tarifa_modificada = true;
      it.modificado_por = 'Control de Gestión';
    } else if (it.id_reporte_avance) {
      it.tarifa_modificada = false;
      it.modificado_por = null;
    }
  }
  recalcularTotales();
};

const recalcularViaticoAlimentacion = (it) => {
  const monto = parseFloat(it.monto_total) || 0;
  it.precio_unitario = monto;
  if (it.tarifa_sugerida !== undefined && it.tarifa_sugerida !== null) {
    const sug = parseFloat(it.tarifa_sugerida);
    if (Math.abs(monto - sug) > 0.01) {
      it.tarifa_modificada = true;
      it.modificado_por = 'Control de Gestión';
    } else {
      it.tarifa_modificada = false;
      it.modificado_por = null;
    }
  }
  recalcularTotales();
};

const sincronizarGlosaMovilizacion = (it) => {
  const tipo = (it.tipo_movilizacion || 'UBER / TAXI').trim();
  const ruta = (it.ruta_detalle || '').trim();
  it.concepto_detalle = ruta ? `${tipo} — ${ruta}` : tipo;
};

const onCondicionViaticoChange = (it) => {
  it.condicion_label = it.concepto_detalle;
  it.tarifa_modificada = true;
  it.modificado_por = 'Control de Gestión';
};

const onRolPersonalChange = (it) => {
  if (it.rol_personal === 'RIGGER') {
    it.tarifa_no_aplica = true;
    it.precio_unitario = 0;
    it.monto_total = 0;
  } else {
    it.tarifa_no_aplica = false;
    const sug = tarifaOperadorComercial.value?.valor_hora || 5000;
    it.precio_unitario = sug;
    const cant = parseFloat(it.cantidad_unidades) || 0;
    it.monto_total = Math.round(cant * sug);
  }
  recalcularTotales();
};

const onNombrePersonalInput = (it) => {
  const rolDetectado = resolverRolTripulante(it.nombre_personal);
  if (rolDetectado === 'RIGGER') {
    it.rol_personal = 'RIGGER';
    it.tarifa_no_aplica = true;
    it.precio_unitario = 0;
    it.monto_total = 0;
    recalcularTotales();
  } else if (!it.rol_personal || it.rol_personal === 'RIGGER') {
    it.rol_personal = rolDetectado;
    it.tarifa_no_aplica = false;
    const sug = tarifaOperadorComercial.value?.valor_hora || 5000;
    it.precio_unitario = sug;
    const cant = parseFloat(it.cantidad_unidades) || 0;
    it.monto_total = Math.round(cant * sug);
    recalcularTotales();
  }
};

const getSubtotalCategoria = (cat) => {
  const catKey = normalizarCatKey(cat);
  return (costos.value[catKey] || []).reduce((acc, it) => acc + (parseFloat(it.monto_total) || 0), 0);
};

const getPctSobreVenta = (monto) => {
  const venta = parseFloat(its.value.total_ingresos_facturables) || 0;
  if (venta <= 0) return '0.0';
  return (((parseFloat(monto) || 0) / venta) * 100).toFixed(1);
};

const getTabActualLabel = () => {
  const t = categoriasCostosTabs.find(tab => tab.key === tabCostoActiva.value);
  return t ? t.label : 'Costos';
};

const necesitaColumnaOC = (cat) => {
  const catKey = normalizarCatKey(cat);
  return ['pensiones', 'personal_externo', 'subcontratacion_flete', 'subcontrato_flete'].includes(catKey);
};

// Plantillas y Contexto (Recalcula Hora Operador según Régimen URBANO vs RURAL)
const cambiarContexto = (ctx) => {
  its.value.tipo_contexto = ctx;
  (jornadas.value || []).forEach(j => calcularHorasReales(j));
  const hrsMin = parseFloat(its.value.horas_minimas_pactadas || 8);

  (costos.value.costo_hora_operador || []).forEach(it => {
    const colHrs = parseFloat(it.colacion_horas || 0);
    const hSal = it.hora_salida;
    const hLleg = it.hora_llegada || hSal;
    const hTerm = it.hora_termino;
    const hRet = it.hora_retorno;

    if (hSal && hTerm) {
      if (ctx === 'RURAL') {
        const minFaena = Math.max(0, calcularDiferenciaMinutos(hLleg, hTerm) - Math.round(colHrs * 60));
        const hrsFaenaReal = Math.round((minFaena / 60) * 100) / 100;
        const hrsFaenaPagar = Math.max(hrsMin, hrsFaenaReal);
        const minIda = hSal && hLleg ? Math.max(0, calcularDiferenciaMinutos(hSal, hLleg)) : 0;
        const minRet = hTerm && hRet ? Math.max(0, calcularDiferenciaMinutos(hTerm, hRet)) : 0;
        const hrsFlete = Math.round(((minIda + minRet) / 60) * 100) / 100;
        const hrsTotal = Math.round((hrsFaenaPagar + hrsFlete) * 100) / 100;

        it.horas_reales_equipo = hrsFaenaReal;
        it.horas_faena_pagar = hrsFaenaPagar;
        it.horas_flete_pagar = hrsFlete;
        it.cantidad_unidades = hrsTotal;
      } else {
        const minUrb = Math.max(0, calcularDiferenciaMinutos(hSal, hTerm) - Math.round(colHrs * 60));
        const hrsUrb = Math.round((minUrb / 60) * 100) / 100;

        it.horas_reales_equipo = hrsUrb;
        it.horas_faena_pagar = hrsUrb;
        it.horas_flete_pagar = 0;
        it.cantidad_unidades = hrsUrb;
      }

      if (it.rol_personal === 'RIGGER' || it.tarifa_no_aplica) {
        it.precio_unitario = 0;
        it.monto_total = 0;
      } else {
        const precio = parseFloat(it.precio_unitario || it.tarifa_sugerida || 0);
        it.monto_total = Math.round(it.cantidad_unidades * precio);
      }
    }
  });

  recalcularTotales();
  if (!its.value.observaciones) {
    inyectarPlantilla(ctx);
  }
};

const inyectarPlantilla = (tipo) => {
  if (tipo === 'URBANO') {
    its.value.observaciones = "SERVICIO URBANO:\n- Maniobra ejecutada dentro del radio operacional urbano.\n- Sin pernoctación de personal ni viáticos especiales.\n- Retorno de equipo y personal a base conforme a horario pactado.";
  } else if (tipo === 'RURAL') {
    its.value.observaciones = "SERVICIO RURAL / FAENA MINERA:\n- Traslado de equipo bajo protocolo de convoy escoltado.\n- Pernoctación de tripulación en pensión acreditada.\n- Cumplimiento estricto de charla de seguridad de faena y checklist pre-operacional.";
  }
};

const formatMoneda = (monto) => {
  return '$ ' + Math.round(monto || 0).toLocaleString('es-CL');
};
const formatPesos = formatMoneda;

const formatHorasHHMM = (val) => {
  const num = parseFloat(val);
  if (isNaN(num) || num <= 0) return '00:00';
  const totalMin = Math.round(num * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Restricción de gobernanza: Editabilidad de Horas de Servicio y Viáticos exclusiva para Yara Mendoza
const esPerfilYara = computed(() => {
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('user_data') || localStorage.getItem('usuario') || '{}';
    const u = JSON.parse(raw);
    const email = String(u.email || '').toLowerCase();
    const name = String(u.nombre || u.name_usuario || u.name || '').toLowerCase();
    const uid = Number(u.id_user || u.id);
    return email.includes('ymendoza') || email.includes('yara') || name.includes('yara') || uid === 65;
  } catch {
    return false;
  }
});

const onHorasRealesManualChange = (j) => {
  j.horas_reales_manual = true;
  if (!j.id_reporte_avance) {
    j.horas_report = Number(j.horas_reales) || 0;
  }
  recalcularTotales();
};

const onHorasViaticosManualChange = (j) => {
  j.horas_viaticos_manual = true;
  recalcularTotales();
};

// REQ-1122: Restricción del Resumen Ejecutivo Financiero exclusivamente para el perfil SECRETARIA
const esRolSecretaria = computed(() => {
  try {
    const raw = localStorage.getItem('user_data') || localStorage.getItem('usuario') || '{}';
    const u = JSON.parse(raw);
    const rolesArr = Array.isArray(u.roles) ? u.roles : [u.rol || u.name_rol || ''];
    const cargoStr = String(u.cargo || u.rol_activo || '').toUpperCase();
    const tieneAdmin = rolesArr.some(r => {
      const rn = String(r?.name_rol || r || '').toUpperCase();
      return rn.includes('ADMIN') || rn.includes('GERENCIA') || rn.includes('OPERACIONES') || rn.includes('CONTABILIDAD');
    });
    if (tieneAdmin) return false;
    return rolesArr.some(r => String(r?.name_rol || r || '').toUpperCase().includes('SECRETARIA')) || cargoStr.includes('SECRETARIA');
  } catch {
    return false;
  }
});

const cerrar = () => {
  emit('close');
};

// Watchers
watch([() => props.visible, () => resolvedIdProyecto.value], ([newVis, newId]) => {
  if (newVis && newId) {
    cargarITS();
  }
}, { immediate: true });
</script>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
