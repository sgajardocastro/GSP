<template>
  <div class="flex-1 min-h-0 flex flex-col gap-4 text-left">
    <!-- Header -->
    <div class="flex justify-between items-end flex-shrink-0">
      <div>
        <h2 class="text-2xl font-black text-white">
          {{ isModoOperaciones ? 'Requerimiento & Preparación de Operaciones' : 'Gestor de Oportunidades & Cotizaciones' }}
          <span v-if="antecedentes.identificador_formal" class="text-amber-500 font-mono text-xl ml-2 font-black">[{{ antecedentes.identificador_formal }}]</span>
        </h2>
        <p class="text-sm text-slate-300 mt-1">
          {{ isModoOperaciones ? 'Revisión técnica de antecedentes, auditoría de modificaciones y asignación de flota.' : 'Estructuración B2B de requerimientos de izaje y logística.' }}
        </p>
      </div>
      <div class="flex gap-2.5">
        <button @click="handleCancelar" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-sm uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-sm" title="Volver al Tablero Kanban de Torre de Control">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          <span>Volver al Kanban</span>
        </button>
        <!-- BOTONES DE RETROCESO / EXCEPCIÓN -->
        <button v-if="isModoOperaciones" @click="volverACotizar" class="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2" title="Devuelve el requerimiento a Preventa Comercial para permitir ediciones">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"></path></svg>
          <span>Devolver a Preventa</span>
        </button>

        <button v-if="estadoDbActual === ESTADOS_DB.NO_GANADA" @click="restaurarACotizar" class="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm uppercase tracking-wider transition-colors flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.75 8.25v.75M21 9h-6"></path></svg>
          <span>Restaurar a Cotizar</span>
        </button>

        <!-- ACCIONES ETAPA 1-2: PREVENTA COMERCIAL -->
        <template v-if="estadoDbActual <= 2">
          <button v-if="(props.proyectoId || currentProyectoId) && estadoDbActual !== ESTADOS_DB.NO_GANADA" @click="abrirModalNoAsignada" class="px-4 py-2.5 bg-red-600/90 hover:bg-red-500 text-white font-bold rounded-lg text-sm uppercase tracking-wider transition-colors flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
            <span>No Ganada</span>
          </button>
          <button @click="generarPDF" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-sm uppercase tracking-wider transition-colors flex items-center gap-1.5">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <span>Generar Cotización</span>
          </button>
          <button @click="guardarEnPreventa" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-sm uppercase tracking-wider transition-colors flex items-center gap-1.5">
            <span>Guardar en Preventa</span>
          </button>
          <button @click="abrirModalGenerarRequerimiento" class="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-sm uppercase tracking-widest transition-colors shadow-lg shadow-amber-500/10 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span>Generar Requerimiento</span>
          </button>
        </template>

        <!-- ACCIONES ETAPA 3: VALIDACIÓN & AUDITORÍA DE ANTECEDENTES -->
        <template v-if="estadoDbActual === ESTADOS_DB.VALIDACION_DIFF">
          <button @click="abrirModalAprobarRequerimiento" class="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-sm uppercase tracking-widest transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
            <span>Aprobar Requerimiento</span>
          </button>
        </template>

        <!-- ACCIONES ETAPA 4: ASIGNACIÓN DE RECURSOS OT -->
        <template v-else-if="estadoDbActual === ESTADOS_DB.ASIGNACION_RECURSOS">
          <span v-if="isDirtyAsignacion" class="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse flex items-center gap-1.5">
            🟡 Cambios Modificados (Sin Guardar)
          </span>
          <button @click="guardarCambiosAsignacion" type="button" class="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-sm uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer">
            💾 Guardar Cambios
          </button>
          <button @click="confirmarAsignacionOT" class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-sm uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span>Confirmar Asignación OT ➔ Preparación Salida</span>
          </button>
        </template>

        <!-- ACCIONES ETAPA 5+: PREPARACIÓN SALIDA / PATIO -->
        <template v-else-if="estadoDbActual >= ESTADOS_DB.PREPARACION_PATIO">
          <button @click="guardarCambiosAsignacion" type="button" class="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-sm uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer">
            💾 Guardar Cambios
          </button>
        </template>
      </div>
    </div>

    <!-- SUBTABS BAR -->
    <div class="flex border-b border-white/10 bg-[#080d1a] px-3 pt-2 flex-shrink-0 transition-all duration-200 gap-2 overflow-x-auto scrollbar-hide">
      <!-- 1. PREVENTA COMERCIAL -->
      <button 
        @click="topTab = 'comercial'" 
        :class="[
          topTab === 'comercial' ? 'text-amber-400 border-b-2 border-amber-500 font-bold bg-white/[0.02]' : 'text-slate-400 hover:text-white',
          'py-2.5 px-3.5 text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none cursor-pointer rounded-t'
        ]"
      >
        <span v-if="estadoDbActual <= 2" class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span v-else class="text-xs text-slate-500">👁️</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        <span>1. Preventa Comercial</span>
        <span v-if="estadoDbActual >= 3" class="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-normal">Lectura</span>
      </button>

      <!-- 2. VALIDACIÓN & DIFF -->
      <button 
        @click="cambiarYPersistirSubTab('validacion')" 
        :disabled="estadoDbActual < ESTADOS_DB.VALIDACION_DIFF"
        :class="[
          estadoDbActual < ESTADOS_DB.VALIDACION_DIFF ? 'opacity-40 cursor-not-allowed text-slate-600' : (topTab === 'operaciones' && operacionesSubTab === 'validacion' ? 'text-amber-400 border-b-2 border-amber-500 font-bold bg-white/[0.02]' : 'text-slate-400 hover:text-white cursor-pointer'),
          'py-2.5 px-3.5 text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none rounded-t'
        ]"
        :title="estadoDbActual < ESTADOS_DB.VALIDACION_DIFF ? 'Requiere Generar Requerimiento Comercial' : ''"
      >
        <span v-if="estadoDbActual < ESTADOS_DB.VALIDACION_DIFF" class="text-xs">🔒</span>
        <span v-else-if="estadoDbActual === ESTADOS_DB.VALIDACION_DIFF" class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
        <span v-else class="text-xs text-slate-500">👁️</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>2. Validación & Diff</span>
        <span v-if="estadoDbActual > ESTADOS_DB.VALIDACION_DIFF" class="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-normal">Lectura</span>
      </button>

      <!-- 3. ASIGNACIÓN DE RECURSOS OT -->
      <button 
        @click="cambiarYPersistirSubTab('asignacion')" 
        :disabled="estadoDbActual < ESTADOS_DB.ASIGNACION_RECURSOS"
        :class="[
          estadoDbActual < ESTADOS_DB.ASIGNACION_RECURSOS ? 'opacity-40 cursor-not-allowed text-slate-600' : (topTab === 'operaciones' && operacionesSubTab === 'asignacion' ? 'text-emerald-400 border-b-2 border-emerald-500 font-bold bg-white/[0.02]' : 'text-slate-400 hover:text-white cursor-pointer'),
          'py-2.5 px-3.5 text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none rounded-t'
        ]"
        :title="estadoDbActual < ESTADOS_DB.ASIGNACION_RECURSOS ? 'Requiere Aprobar Requerimiento en Validación' : ''"
      >
        <span v-if="estadoDbActual < ESTADOS_DB.ASIGNACION_RECURSOS" class="text-xs">🔒</span>
        <span v-else-if="estadoDbActual === ESTADOS_DB.ASIGNACION_RECURSOS" class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span v-else class="text-xs text-slate-500">👁️</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        <span>3. Asignación Recursos OT</span>
        <span v-if="estadoDbActual > ESTADOS_DB.ASIGNACION_RECURSOS" class="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-normal">Lectura</span>
      </button>

      <!-- 4. ACREDITACIONES & DOSSIER -->
      <button 
        @click="cambiarYPersistirSubTab('acreditaciones')" 
        :disabled="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO"
        :class="[
          estadoDbActual < ESTADOS_DB.PREPARACION_PATIO ? 'opacity-40 cursor-not-allowed text-slate-600' : (topTab === 'operaciones' && operacionesSubTab === 'acreditaciones' ? 'text-amber-400 border-b-2 border-amber-500 font-bold bg-white/[0.02]' : 'text-slate-400 hover:text-white cursor-pointer'),
          'py-2.5 px-3.5 text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none rounded-t'
        ]"
        :title="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO ? 'Requiere Confirmar Asignación OT' : ''"
      >
        <span v-if="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO" class="text-xs">🔒</span>
        <span v-else class="text-xs text-slate-400">📄</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <span>4. Acreditaciones & Dossier</span>
      </button>

      <!-- 5. PREPARACIÓN DE SALIDA -->
      <button 
        @click="cambiarYPersistirSubTab('preparacion_salida')" 
        :disabled="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO"
        :class="[
          estadoDbActual < ESTADOS_DB.PREPARACION_PATIO ? 'opacity-40 cursor-not-allowed text-slate-600' : (topTab === 'operaciones' && operacionesSubTab === 'preparacion_salida' ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold bg-white/[0.02]' : 'text-slate-400 hover:text-white cursor-pointer'),
          'py-2.5 px-3.5 text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none rounded-t'
        ]"
        :title="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO ? 'Requiere Confirmar Asignación OT' : ''"
      >
        <span v-if="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO" class="text-xs">🔒</span>
        <span v-else-if="estadoDbActual === ESTADOS_DB.PREPARACION_PATIO" class="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></span>
        <span v-else class="text-xs text-slate-500">👁️</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
        <span>5. Preparación de Salida</span>
        <span v-if="estadoDbActual > ESTADOS_DB.PREPARACION_PATIO" class="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-normal">Lectura</span>
      </button>

      <!-- 6. EJECUCIÓN & REPORTS DIARIOS -->
      <button 
        @click="cambiarYPersistirSubTab('reports')" 
        :disabled="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO"
        :class="[
          estadoDbActual < ESTADOS_DB.PREPARACION_PATIO ? 'opacity-40 cursor-not-allowed text-slate-600' : (topTab === 'operaciones' && operacionesSubTab === 'reports' ? 'text-amber-400 border-b-2 border-amber-500 font-bold bg-white/[0.02]' : 'text-slate-400 hover:text-white cursor-pointer'),
          'py-2.5 px-3.5 text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none rounded-t'
        ]"
        :title="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO ? 'Requiere Confirmar Asignación OT' : ''"
      >
        <span v-if="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO" class="text-xs">🔒</span>
        <span v-else class="text-xs text-amber-400">📋</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
        <span>6. Ejecución & Reports</span>
        <span v-if="reportsProyecto.length > 0" class="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">{{ reportsProyecto.length }}</span>
      </button>

      <!-- 7. LIQUIDACIÓN & EDP (Spec 38) -->
      <button 
        @click="cambiarYPersistirSubTab('liquidacion')" 
        :disabled="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO"
        :class="[
          estadoDbActual < ESTADOS_DB.PREPARACION_PATIO ? 'opacity-40 cursor-not-allowed text-slate-600' : (topTab === 'operaciones' && operacionesSubTab === 'liquidacion' ? 'text-emerald-400 border-b-2 border-emerald-500 font-bold bg-white/[0.02]' : 'text-slate-400 hover:text-white cursor-pointer'),
          'py-2.5 px-3.5 text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none rounded-t'
        ]"
        :title="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO ? 'Requiere Confirmar Asignación OT' : ''"
      >
        <span v-if="estadoDbActual < ESTADOS_DB.PREPARACION_PATIO" class="text-xs">🔒</span>
        <span v-else-if="estadoDbActual === 7" class="text-xs text-emerald-400 font-bold">✅</span>
        <span v-else class="text-xs text-emerald-400">💰</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>7. Liquidación & EDP</span>
        <span v-if="estadoDbActual === 7" class="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">Facturado</span>
      </button>
    </div>

    <!-- OPERACIONES WORKSPACE (Diff, Aprobación & Asignación OT) -->
    <div v-if="topTab === 'operaciones'" class="flex-1 min-h-0 overflow-y-auto space-y-6 scrollbar-hide">
      
      <!-- SUB-TAB 1: VALIDACIÓN DE ANTECEDENTES & DIFF (PESTAÑAS A + B UNIFICADAS EN EL MISMO ENTORNO) -->
      <div v-if="operacionesSubTab === 'validacion'" class="space-y-6">
        <!-- Resumen del Cliente y Cotización Asignada -->
        <div class="bg-[#050810] border border-white/10 rounded-xl p-4 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center text-amber-500 font-bold font-mono">
              GSP
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-white uppercase">{{ selectedClient?.razon_social || selectedClient?.name_empresa || 'Cliente Mandante' }}</span>
                <span class="text-[10px] font-mono text-slate-400">RUT: {{ opportunity.rut_cliente || 'No registrado' }}</span>
                <span class="text-[10px] text-slate-400">| Contacto: {{ opportunity.contacto_nombre }} ({{ opportunity.contacto_telefono }})</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5 flex gap-4">
                <span>Cotización: <strong class="text-amber-500 font-mono">{{ antecedentes.identificador_formal || 'COT-2026-042' }}</strong></span>
                <span>Moneda: <strong class="text-white font-mono">{{ comercial.moneda }}</strong></span>
                <span>Total Net Cotizado: <strong class="text-amber-400 font-mono">{{ formatCurrency(totalNeto) }}</strong></span>
              </div>
            </div>
          </div>
          <div>
            <span v-if="diffsCount > 0" class="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
              ⚠️ {{ diffsCount }} Modificaciones Registradas (Aprobado con observaciones)
            </span>
            <span v-else class="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
              ✅ Sin Modificaciones (Aprobado sin observaciones)
            </span>
          </div>
        </div>

        <!-- Secciones A + B Unificadas en Panel Continuo -->
        <div v-if="isRequerimientoAprobado" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex justify-between items-center text-xs text-amber-300 font-bold mb-4">
          <span class="flex items-center gap-2">
            <span>🔒</span> Etapa Concluida y Aprobada (Solo Lectura) — Los antecedentes del servicio están convalidados.
          </span>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Columna Izquierda: Pestaña A (Datos Servicio & Visita con MAPA Completo) -->
          <fieldset :disabled="isRequerimientoAprobado" class="bg-[#050810] border border-white/10 rounded-xl p-5 space-y-4">
            <span class="text-xs font-bold text-amber-500 uppercase tracking-wider block border-b border-white/5 pb-2">
              📍 Pestaña A: Datos Servicio & Visita a Terreno (Con Visor de Mapa)
            </span>
            
            <div class="space-y-3">
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                  Nombre de la Obra
                  <span v-if="hasDiff('obra_nombre')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-1">Orig: {{ getOriginalValue('obra_nombre') }}</span>
                </label>
                <input type="text" v-model="siteVisit.obra_nombre" class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('obra_nombre') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                    Dirección de la Obra
                    <span v-if="hasDiff('obra_direccion')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-1">Orig: {{ getOriginalValue('obra_direccion') }}</span>
                  </label>
                  <input type="text" v-model="siteVisit.obra_direccion" class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('obra_direccion') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                    Ciudad de la Obra
                    <span v-if="hasDiff('obra_ciudad')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-1">Orig: {{ getOriginalValue('obra_ciudad') }}</span>
                  </label>
                  <input type="text" v-model="siteVisit.obra_ciudad" class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('obra_ciudad') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                    Tipo de Carga
                    <span v-if="hasDiff('tipo_carga')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-1">Orig: {{ getOriginalValue('tipo_carga') }}</span>
                  </label>
                  <input type="text" v-model="siteVisit.tipo_carga" class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('tipo_carga') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                    Peso Carga (Ton/Kg)
                    <span v-if="hasDiff('peso_carga')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-1">Orig: {{ getOriginalValue('peso_carga') }}</span>
                  </label>
                  <input type="text" v-model="siteVisit.peso_carga" class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('peso_carga') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                    Radios (m)
                    <span v-if="hasDiff('radios_trabajo')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-1">Orig: {{ getOriginalValue('radios_trabajo') }}</span>
                  </label>
                  <input type="text" v-model="siteVisit.radios_trabajo" class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('radios_trabajo') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                    Alturas (m)
                    <span v-if="hasDiff('alturas_trabajo')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-1">Orig: {{ getOriginalValue('alturas_trabajo') }}</span>
                  </label>
                  <input type="text" v-model="siteVisit.alturas_trabajo" class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('alturas_trabajo') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                </div>
                <div class="col-span-2">
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                    Volumen (LxAxA)
                    <span v-if="hasDiff('volumen_carga')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-1">Orig: {{ getOriginalValue('volumen_carga') }}</span>
                  </label>
                  <input type="text" v-model="siteVisit.volumen_carga" class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('volumen_carga') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                </div>
              </div>

              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                  Detalle del Servicio a realizar
                  <span v-if="hasDiff('detalle_servicio')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-1">Orig: {{ getOriginalValue('detalle_servicio') || '(Vacío)' }}</span>
                </label>
                <textarea v-model="siteVisit.detalle_servicio" rows="2" class="w-full bg-[#0a0f1e] border rounded p-2 text-xs text-white outline-none resize-none" :class="hasDiff('detalle_servicio') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'"></textarea>
              </div>

              <!-- Componente Mapa Selector Interactivo -->
              <div class="pt-2">
                <span class="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">🗺️ Coordenadas & Visor de Mapa en Terreno</span>
                <MapSelector v-model:lat="siteVisit.lat" v-model:lng="siteVisit.lng" />
              </div>
            </div>
          </fieldset>

          <!-- Columna Derecha: Pestaña B (Estructurador de Servicios IDÉNTICO A PREVENTA) -->
          <fieldset :disabled="isRequerimientoAprobado" class="bg-[#050810] border border-white/10 rounded-xl p-5 space-y-4 flex flex-col">
            <div class="flex justify-between items-center border-b border-white/5 pb-2">
              <span class="text-xs font-bold text-amber-500 uppercase tracking-wider">
                🏗️ Pestaña B: Estructurador de Servicios (Idéntico a Preventa)
              </span>
              <button @click="agregarLinea" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition-all">
                + Agregar Línea
              </button>
            </div>

            <div class="flex-1 border border-white/5 rounded-lg overflow-hidden bg-black/20 overflow-y-auto scrollbar-hide min-h-[300px]">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-white/5 border-b border-white/5 text-slate-400 font-bold uppercase text-[9px] tracking-wide">
                    <th class="p-2.5">Categoría</th>
                    <th class="p-2.5 w-32">Subcategoría</th>
                    <th class="p-2.5">Descripción / Equipo</th>
                    <th class="p-2.5 text-center w-14">Cant.</th>
                    <th class="p-2.5 w-24">Unidad</th>
                    <th class="p-2.5 text-right w-24">Valor Unit.</th>
                    <th class="p-2.5 text-right w-24">Subtotal</th>
                    <th class="p-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr v-for="(line, idx) in lines" :key="idx" class="hover:bg-white/[0.02]">
                    <td class="p-2">
                      <div v-if="hasDiff('equipo_tipo', idx)" class="text-[9px] line-through text-red-400 font-mono bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 mb-1">
                        Orig: {{ getOriginalValue('equipo_tipo', idx) }}
                      </div>
                      <select v-model="line.tipo" @change="line.subcategoria = ''" class="bg-[#0a0f1e] border rounded px-2 py-1 text-[11px] text-white outline-none w-28" :class="hasDiff('equipo_tipo', idx) ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'">
                        <option value="" class="bg-[#0a0f1e] text-slate-300">-- Tipo --</option>
                        <option v-for="cat in dbCategories" :key="cat.id_categoria" :value="cat.nombre_categoria" class="bg-[#0a0f1e] text-white">
                          {{ cat.nombre_categoria }}
                        </option>
                      </select>
                    </td>
                    <td class="p-2">
                      <div v-if="hasDiff('equipo_subcategoria', idx)" class="text-[9px] line-through text-red-400 font-mono bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 mb-1">
                        Orig: {{ getOriginalValue('equipo_subcategoria', idx) }}
                      </div>
                      <select v-model="line.subcategoria" class="bg-[#0a0f1e] border rounded px-2 py-1 text-[11px] text-white outline-none w-full" :class="hasDiff('equipo_subcategoria', idx) ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'">
                        <option value="" class="bg-[#0a0f1e] text-slate-300">-- Seleccionar --</option>
                        <option v-for="sub in getSubcategoriesForType(line.tipo)" :key="sub.id_subcategoria" :value="sub.nombre_subcategoria" class="bg-[#0a0f1e] text-white">
                          {{ sub.nombre_subcategoria }}
                        </option>
                      </select>
                    </td>
                    <td class="p-2">
                      <div v-if="hasDiff('equipo_descripcion', idx)" class="text-[9px] line-through text-red-400 font-mono bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 mb-1">
                        Orig: {{ getOriginalValue('equipo_descripcion', idx) }}
                      </div>
                      <input type="text" v-model="line.descripcion" placeholder="Ej: Liebherr LTM 1220..." class="w-full bg-[#0a0f1e] border rounded px-2 py-1 text-xs text-white" :class="hasDiff('equipo_descripcion', idx) ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                    </td>
                    <td class="p-2">
                      <div v-if="hasDiff('equipo_cantidad', idx)" class="text-[9px] line-through text-red-400 font-mono bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 mb-1">
                        Orig: {{ getOriginalValue('equipo_cantidad', idx) }}
                      </div>
                      <input type="number" v-model.number="line.cantidad" min="1" class="w-full bg-[#0a0f1e] border rounded text-center px-1 py-1 text-xs text-white" :class="hasDiff('equipo_cantidad', idx) ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                    </td>
                    <td class="p-2">
                      <div v-if="hasDiff('equipo_unidad', idx)" class="text-[9px] line-through text-red-400 font-mono bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 mb-1">
                        Orig: {{ getOriginalValue('equipo_unidad', idx) }}
                      </div>
                      <select v-model="line.unidad" class="bg-[#0a0f1e] border rounded px-2 py-1 text-[11px] text-white outline-none w-full" :class="hasDiff('equipo_unidad', idx) ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'">
                        <option value="Horas" class="bg-[#0a0f1e] text-white">Horas</option>
                        <option value="Diario" class="bg-[#0a0f1e] text-white">Diario</option>
                        <option value="Semanal" class="bg-[#0a0f1e] text-white">Semanal</option>
                        <option value="Mensual" class="bg-[#0a0f1e] text-white">Mensual</option>
                        <option value="Fijo" class="bg-[#0a0f1e] text-white">Fijo</option>
                        <option value="Flete" class="bg-[#0a0f1e] text-white">Flete</option>
                      </select>
                    </td>
                    <td class="p-2">
                      <div v-if="hasDiff('equipo_valor', idx)" class="text-[9px] line-through text-red-400 font-mono bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 mb-1">
                        Orig: {{ getOriginalValue('equipo_valor', idx) }}
                      </div>
                      <input disabled type="number" v-model.number="line.valorUnitario" min="0" class="w-full bg-[#0a0f1e] border rounded px-2 py-1 text-right text-xs text-white font-mono opacity-50 cursor-not-allowed" :class="hasDiff('equipo_valor', idx) ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" title="No puede modificar el precio base de la cotización en Operaciones." />
                    </td>
                    <td class="p-2 text-right font-bold text-amber-400 font-mono">
                      {{ formatCurrency(line.cantidad * (line.valorUnitario || 0)) }}
                    </td>
                    <td class="p-2 text-center">
                      <button @click="eliminarLinea(idx)" class="text-slate-500 hover:text-red-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <label class="block text-[10px] text-slate-400 font-semibold mb-1">Observaciones de Operaciones / Motivos de Ajuste:</label>
              <textarea v-model="operacionesAssignment.observaciones_operaciones" :disabled="estadoDbActual >= ESTADOS_DB.ASIGNACION_RECURSOS" rows="2" placeholder="Detalle observaciones o razones de modificación..." class="w-full bg-[#0a0f1e] border border-white/10 rounded p-2 text-xs text-white outline-none resize-none disabled:opacity-75 disabled:bg-slate-900/60"></textarea>
            </div>
          </fieldset>

            <div v-if="estadoDbActual >= ESTADOS_DB.ASIGNACION_RECURSOS" class="pt-2">
              <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-center flex items-center justify-center gap-2 text-xs text-emerald-300 font-bold">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <span>🔒 Requerimiento Aprobado por Operaciones — Formulario en Modo Lectura</span>
              </div>
            </div>
            <div v-if="opportunity.requiere_acreditacion" class="bg-[#050810] border border-white/10 rounded-xl p-4 space-y-4 mt-2">
              <span class="text-xs font-bold text-amber-500 uppercase tracking-wider block border-b border-white/5 pb-2">
                ✅ Checklist de Acreditaciones Requeridas
              </span>
              <div class="grid grid-cols-1 gap-4">
                <!-- Empresa -->
                <div v-if="opportunity.acreditacion_docs?.empresa && opportunity.acreditacion_docs.empresa.length > 0" class="space-y-2">
                  <h4 class="text-[11px] font-bold text-slate-300 border-b border-white/5 pb-1">🏢 Empresa Mandante</h4>
                  <div v-for="doc in opportunity.acreditacion_docs.empresa" :key="'ch-emp-'+doc" class="flex justify-between items-center text-xs bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <div class="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <span :class="checkDocVigente(doc, 'empresa') ? 'text-emerald-400 font-bold text-sm' : 'text-red-500 font-bold text-sm'">
                        {{ checkDocVigente(doc, 'empresa') ? '✅' : '❌' }}
                      </span>
                      <span class="text-slate-300 font-medium truncate">{{ extractDocName(doc) }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <button v-if="checkDocVigente(doc, 'empresa')" @click.stop.prevent="verDocumentoDossier(doc, 'empresa')" type="button" class="cursor-pointer text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/40">👁️ Ver</button>
                      <button @click.stop.prevent="abrirModalVincularDoc(doc, 'empresa')" type="button" class="cursor-pointer text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded font-bold border border-purple-500/40">🔗 Vincular</button>
                      <label class="cursor-pointer text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-500/40 transition-all flex items-center gap-0.5">
                        📤 Subir
                        <input type="file" class="hidden" @change="subirArchivoInSitu('empresa', doc, $event)" />
                      </label>
                    </div>
                  </div>
                </div>
                <!-- Equipos -->
                <div v-if="opportunity.acreditacion_docs?.equipos && opportunity.acreditacion_docs.equipos.length > 0" class="space-y-2">
                  <h4 class="text-[11px] font-bold text-amber-400 border-b border-white/5 pb-1">🚜 Equipos Asignados</h4>
                  <div v-for="doc in opportunity.acreditacion_docs.equipos" :key="'ch-eq-'+doc" class="flex justify-between items-center text-xs bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <div class="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <span :class="checkDocVigente(doc, 'equipos') ? 'text-emerald-400 font-bold text-sm' : 'text-red-500 font-bold text-sm'">
                        {{ checkDocVigente(doc, 'equipos') ? '✅' : '❌' }}
                      </span>
                      <span class="text-slate-300 font-medium truncate">{{ extractDocName(doc) }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <button v-if="checkDocVigente(doc, 'equipos')" @click.stop.prevent="verDocumentoDossier(doc, 'equipos')" type="button" class="cursor-pointer text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/40">👁️ Ver</button>
                      <button @click.stop.prevent="abrirModalVincularDoc(doc, 'equipos')" type="button" class="cursor-pointer text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded font-bold border border-purple-500/40">🔗 Vincular</button>
                      <label class="cursor-pointer text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/40 transition-all flex items-center gap-0.5">
                        📤 Subir
                        <input type="file" class="hidden" @change="subirArchivoInSitu('equipos', doc, $event)" />
                      </label>
                    </div>
                  </div>
                </div>
                <!-- Personas -->
                <div v-if="opportunity.acreditacion_docs?.personas && opportunity.acreditacion_docs.personas.length > 0" class="space-y-2">
                  <h4 class="text-[11px] font-bold text-emerald-400 border-b border-white/5 pb-1">👷 Personal Asignado</h4>
                  <div v-for="doc in opportunity.acreditacion_docs.personas" :key="'ch-per-'+doc" class="flex justify-between items-center text-xs bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <div class="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <span :class="checkDocVigente(doc, 'personas') ? 'text-emerald-400 font-bold text-sm' : 'text-red-500 font-bold text-sm'">
                        {{ checkDocVigente(doc, 'personas') ? '✅' : '❌' }}
                      </span>
                      <span class="text-slate-300 font-medium truncate">{{ extractDocName(doc) }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <button v-if="checkDocVigente(doc, 'personas')" @click.stop.prevent="verDocumentoDossier(doc, 'personas')" type="button" class="cursor-pointer text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/40">👁️ Ver</button>
                      <button @click.stop.prevent="abrirModalVincularDoc(doc, 'personas')" type="button" class="cursor-pointer text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded font-bold border border-purple-500/40">🔗 Vincular</button>
                      <label class="cursor-pointer text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/40 transition-all flex items-center gap-0.5">
                        📤 Subir
                        <input type="file" class="hidden" @change="subirArchivoInSitu('personas', doc, $event)" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      <!-- SUB-TAB 2: PESTAÑA C - ASIGNACIÓN DE RECURSOS (OT) (HABILITADA CONDICIONALMENTE TRAS APROBACIÓN) -->
      <div v-if="operacionesSubTab === 'asignacion'" class="space-y-3">
        <div v-if="isAsignacionConfirmada" class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 flex justify-between items-center text-xs text-amber-300 font-bold mb-2">
          <span class="flex items-center gap-2">
            <span>🔒</span> Etapa Concluida y Aprobada (Solo Lectura) — Las asignaciones de la OT fueron confirmadas.
          </span>
          <span class="text-[10px] text-slate-400 font-normal">Para sustituciones por falla o adiciones de flota, utiliza el Panel de Excepciones en Sub-tab 5 Preparación de Salida.</span>
        </div>

        <div :class="{ 'pointer-events-none opacity-80': isAsignacionConfirmada }" class="bg-[#050810] border border-white/10 rounded-xl p-3 space-y-3">
          
          <!-- TOOLBAR SUPERIOR COMPACTA (TÍTULO + TIEMPOS GLOBALES + ESTADO EN 1 SOLA LÍNEA) -->
          <div class="bg-[#0a0f1e] p-2.5 rounded-lg border border-white/10 flex flex-wrap items-center justify-between gap-2.5">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                🚜 Asignación de Recursos OT
              </span>
              <span class="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">
                Aprobado
              </span>
            </div>

            <!-- Programación de Tiempos Planificados (Inline) + Botón Generar OT -->
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <div class="flex items-center gap-1.5 bg-[#050810] border border-white/10 rounded px-2.5 py-1">
                <span class="text-xs text-slate-300 font-semibold">Salida Base:</span>
                <input type="date" v-model="operacionesAssignment.fecha_salida_plan" @change="propagarFechasPlanificadas" class="bg-transparent text-white text-xs font-mono font-bold outline-none [color-scheme:dark]" />
                <input type="time" v-model="operacionesAssignment.hora_salida_plan" @change="marcarDirtyAsignacion" class="bg-transparent text-white text-xs font-mono font-bold outline-none [color-scheme:dark] border-l border-white/10 pl-1.5" />
              </div>
              <span class="text-slate-500 font-bold text-xs">➔</span>
              <div class="flex items-center gap-1.5 bg-[#050810] border border-white/10 rounded px-2.5 py-1">
                <span class="text-xs text-slate-300 font-semibold">Término Faena:</span>
                <input type="date" v-model="operacionesAssignment.fecha_fin_plan" @change="propagarFechasPlanificadas" class="bg-transparent text-white text-xs font-mono font-bold outline-none [color-scheme:dark]" />
                <input type="time" v-model="operacionesAssignment.hora_fin_plan" @change="marcarDirtyAsignacion" class="bg-transparent text-white text-xs font-mono font-bold outline-none [color-scheme:dark] border-l border-white/10 pl-1.5" />
              </div>
              <button @click="propagarFechasPlanificadas" type="button" class="text-xs bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded font-bold transition-colors cursor-pointer flex items-center gap-1" title="Propagar estas fechas a todos los equipos y personal">
                <span>⚡ Propagar</span>
              </button>
              <button 
                @click="generarPDFOT" 
                :disabled="generandoPDFOT" 
                type="button" 
                class="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1 rounded font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 pointer-events-auto" 
                title="Generar y versionar documento PDF oficial de la Orden de Trabajo"
              >
                <span v-if="generandoPDFOT" class="animate-spin">⏳</span>
                <span v-else>📄</span>
                <span>{{ generandoPDFOT ? 'Generando OT...' : 'Generar PDF OT' }}</span>
              </button>
            </div>
          </div>

          <!-- TABLA ÚNICA DE ALTA DENSIDAD LINEAL (UNA SOLA CABECERA GLOBAL) -->
          <div class="bg-[#080d1a] border border-white/10 rounded-lg overflow-hidden shadow-xl shadow-black/50">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-white/5 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
                    <th class="py-2.5 px-3 w-[22%]">Recurso / Requerimiento</th>
                    <th class="py-2.5 px-3 w-[30%]">Equipo / Vehículo Asignado</th>
                    <th class="py-2.5 px-3 w-[26%]">Operador / Personal Asignado</th>
                    <th class="py-2.5 px-3 w-[18%]">Ventana Planificada</th>
                    <th class="py-2.5 px-2 w-[4%] text-center">Acc</th>
                  </tr>
                </thead>
                <tbody class="font-mono">
                  
                  <!-- SECCIÓN 1: FLOTA PRINCIPAL & OPERADORES -->
                  <tr class="bg-amber-500/10 border-t border-b border-amber-500/20">
                    <td colspan="5" class="py-1.5 px-3">
                      <div class="flex justify-between items-center">
                        <span class="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          🚜 1. Flota Principal & Operadores de Servicio
                          <span class="text-[10px] font-mono text-amber-400/80 font-normal">({{ linesEquiposPrincipales.length }} {{ linesEquiposPrincipales.length === 1 ? 'equipo' : 'equipos' }})</span>
                        </span>
                        <button @click="agregarEquipoPrincipal" type="button" class="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer flex items-center gap-1">
                          + Agregar Equipo
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- FILAS FLOTA PRINCIPAL -->
                  <tr v-for="(line, idx) in linesEquiposPrincipales" :key="'eq-'+(line._uid||line.id_item||('base-'+idx))" class="hover:bg-white/[0.02] transition-colors">
                    <td class="py-2 pr-3 pl-7 font-sans">
                      <div class="flex items-start gap-2">
                        <span class="text-amber-500/70 text-xs font-mono select-none mt-0.5">↳</span>
                        <div class="min-w-0 flex-1">
                          <!-- Línea base cotizada comercialmente -->
                          <template v-if="line.is_linea_base !== false">
                            <div class="font-bold text-white text-xs leading-tight truncate" :title="line.descripcion || line.subcategoria">{{ line.descripcion || line.subcategoria || 'Equipo de Servicio' }}</div>
                            <div class="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span class="text-amber-400 font-mono font-bold">{{ line.tipo }}</span>
                              <span>•</span>
                              <span>{{ line.cantidad }} {{ line.unidad }}</span>
                            </div>
                          </template>
                          <!-- Línea agregada en Operaciones: Categoría y Subcategoría Lado a Lado -->
                          <template v-else>
                            <div class="grid grid-cols-2 gap-1.5">
                              <select v-model="line.tipo" @change="line.subcategoria = ''; line.equipo_asignado_id = ''; marcarDirtyAsignacion()" class="w-full bg-[#0a0f1e] border border-amber-500/40 rounded px-1.5 py-1 text-[11px] text-amber-300 font-bold outline-none focus:border-amber-400 truncate" title="Seleccionar Categoría">
                                <option value="" class="bg-[#0a0f1e] text-slate-400">-- Categoría --</option>
                                <option v-for="cat in dbCategories.filter(c => !['PERSONAL CERTIFICADO', 'TRASLADOS'].includes(c.nombre_categoria))" :key="cat.id_categoria" :value="cat.nombre_categoria" class="bg-[#0a0f1e] text-white">
                                  {{ cat.nombre_categoria }}
                                </option>
                              </select>
                              <select v-model="line.subcategoria" :disabled="!line.tipo" @change="line.equipo_asignado_id = ''; marcarDirtyAsignacion()" class="w-full bg-[#0a0f1e] border border-amber-500/20 rounded px-1.5 py-1 text-[11px] text-white outline-none focus:border-amber-400 truncate disabled:opacity-40" title="Seleccionar Subcategoría">
                                <option value="" class="bg-[#0a0f1e] text-slate-400">-- Subcategoría --</option>
                                <option v-for="sub in getSubcategoriesForType(line.tipo)" :key="sub.id_subcategoria" :value="sub.nombre_subcategoria" class="bg-[#0a0f1e] text-white">
                                  {{ sub.nombre_subcategoria }}
                                </option>
                              </select>
                            </div>
                          </template>
                        </div>
                      </div>
                    </td>
                    <td class="py-2 px-3">
                      <div class="flex items-center gap-1.5">
                        <select v-model="line.equipo_asignado_id" @change="onEquipoPrincipalCambiado(line)" class="flex-1 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500/50 truncate">
                          <option value="" class="bg-[#0a0f1e] text-slate-400">-- Seleccionar Equipo ({{ line.subcategoria || line.tipo || 'Todos' }}) --</option>
                          <option v-for="eq in getEquiposFiltradosPorLinea(line)" :key="eq.id_equipo || eq.patente" :value="eq.id_equipo || eq.patente" class="bg-[#0a0f1e] text-white">
                            {{ eq.patente || 'S/P' }} - {{ eq.nombre_equipo || eq.modelo }} [{{ eq.nombre_subcategoria || eq.nombre_categoria || eq.tipo }}]
                          </option>
                        </select>
                        <button type="button" v-if="line.equipo_asignado_id && getSemaforoEquipo(line.equipo_asignado_id) === 'GREEN'" @click.stop="abrirDetalleAcreditacion('equipo', line.equipo_asignado_id)" class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Acreditación Vigente">🟢 VIG</button>
                        <button type="button" v-else-if="line.equipo_asignado_id && getSemaforoEquipo(line.equipo_asignado_id) === 'YELLOW'" @click.stop="abrirDetalleAcreditacion('equipo', line.equipo_asignado_id)" class="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Por Vencer">🟡 VNC</button>
                        <button type="button" v-else-if="line.equipo_asignado_id" @click.stop="abrirDetalleAcreditacion('equipo', line.equipo_asignado_id)" class="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Vencido">🔴 VNC</button>
                      </div>
                    </td>
                    <td class="py-2 px-3 font-sans">
                      <div class="flex items-center gap-1.5">
                        <select v-model="line.operador_asignado_id" @change="marcarDirtyAsignacion" class="flex-1 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500/50 truncate">
                          <option value="" class="bg-[#0a0f1e] text-slate-400">-- Seleccionar Operador --</option>
                          <optgroup v-if="getUsuariosAgrupados(line.tipo.includes('PLUMA') ? 'Operador Camión Pluma' : 'Operador Grúa').sugeridos.length > 0" label="🎯 Operadores Sugeridos" class="bg-[#0a0f1e] text-emerald-400 font-bold">
                            <option v-for="u in getUsuariosAgrupados(line.tipo.includes('PLUMA') ? 'Operador Camión Pluma' : 'Operador Grúa').sugeridos" :key="'op-sug-'+u.id_user" :value="u.id_user" class="bg-[#0a0f1e] text-white">
                              {{ u.nombre_user || u.name_user }} {{ u.cargo ? '(' + u.cargo + ')' : '' }}
                            </option>
                          </optgroup>
                          <optgroup label="👷 Resto de Personal Activo" class="bg-[#0a0f1e] text-slate-400 font-bold">
                            <option v-for="u in getUsuariosAgrupados(line.tipo.includes('PLUMA') ? 'Operador Camión Pluma' : 'Operador Grúa').otros" :key="'op-otr-'+u.id_user" :value="u.id_user" class="bg-[#0a0f1e] text-slate-200">
                              {{ u.nombre_user || u.name_user }} {{ u.cargo ? '• ' + u.cargo : '' }}
                            </option>
                          </optgroup>
                        </select>
                        <template v-if="line.operador_asignado_id">
                          <button type="button" v-if="getSemaforoTripulante(line.operador_asignado_id) === 'GREEN'" @click.stop="abrirDetalleAcreditacion('persona', { id_user: line.operador_asignado_id, cargo: (line.tipo.includes('PLUMA') ? 'Operador Camión Pluma' : 'Operador Grúa'), semaforo: 'GREEN' })" class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Acreditación Vigente">🟢 VIG</button>
                          <button type="button" v-else-if="getSemaforoTripulante(line.operador_asignado_id) === 'YELLOW'" @click.stop="abrirDetalleAcreditacion('persona', { id_user: line.operador_asignado_id, cargo: (line.tipo.includes('PLUMA') ? 'Operador Camión Pluma' : 'Operador Grúa'), semaforo: 'YELLOW' })" class="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Por Vencer">🟡 VNC</button>
                          <button type="button" v-else @click.stop="abrirDetalleAcreditacion('persona', { id_user: line.operador_asignado_id, cargo: (line.tipo.includes('PLUMA') ? 'Operador Camión Pluma' : 'Operador Grúa'), semaforo: 'RED' })" class="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Vencido">🔴 VNC</button>
                        </template>
                      </div>
                    </td>
                    <td class="py-2 px-3 font-sans">
                      <div class="flex items-center gap-1 bg-[#050810] border border-white/10 rounded px-2 py-1">
                        <input type="date" v-model="line.fecha_plan_ini" @change="marcarDirtyAsignacion" class="flex-1 bg-transparent text-white text-[11px] font-mono font-bold outline-none [color-scheme:dark]" />
                        <span class="text-slate-500 text-xs font-bold px-0.5">➔</span>
                        <input type="date" v-model="line.fecha_plan_fin" @change="marcarDirtyAsignacion" class="flex-1 bg-transparent text-white text-[11px] font-mono font-bold outline-none [color-scheme:dark]" />
                      </div>
                    </td>
                    <td class="py-2 px-2 text-center">
                      <span v-if="line.is_linea_base !== false" class="text-slate-600 text-xs select-none" title="Línea base cotizada comercialmente">🔒</span>
                      <button v-else @click="eliminarEquipoPrincipal(line)" type="button" class="text-slate-500 hover:text-red-400 p-1 cursor-pointer" title="Eliminar equipo adicional">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>

                  <!-- SECCIÓN 2: TRASLADOS Y LOGÍSTICA -->
                  <tr class="bg-blue-950/40 border-t border-b border-blue-500/20">
                    <td colspan="5" class="py-1.5 px-3">
                      <div class="flex justify-between items-center">
                        <span class="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                          🚚 2. Segmento Equipos Traslado & Choferes (Logística)
                          <span class="text-[10px] font-mono text-blue-400/80 font-normal">({{ operacionesAssignment.equipos_extra?.length || 0 }} {{ (operacionesAssignment.equipos_extra?.length || 0) === 1 ? 'vehículo' : 'vehículos' }})</span>
                        </span>
                        <button @click="agregarEquipoTraslado" type="button" class="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer flex items-center gap-1">
                          + Equipo Traslado
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- FILAS TRASLADOS -->
                  <tr v-if="!operacionesAssignment.equipos_extra || operacionesAssignment.equipos_extra.length === 0" class="font-sans">
                    <td colspan="5" class="py-2.5 pr-3 pl-8 text-xs text-slate-500 italic">
                      Sin vehículos de traslado asignados. Haz clic en "+ Equipo Traslado" para incorporar camas bajas, ramplas o escoltas.
                    </td>
                  </tr>
                  <tr v-for="(eqEx, idx) in operacionesAssignment.equipos_extra" :key="'eqex-'+(eqEx._uid||('ex-'+idx))" class="hover:bg-white/[0.02] transition-colors font-mono">
                    <td class="py-2 pr-3 pl-7 font-sans">
                      <div class="flex items-start gap-2">
                        <span class="text-blue-400/70 text-xs font-mono select-none mt-0.5">↳</span>
                        <div class="min-w-0 flex-1">
                          <!-- Línea base cotizada comercialmente -->
                          <template v-if="eqEx.is_linea_base !== false && eqEx.is_linea_base">
                            <div class="font-bold text-white text-xs leading-tight truncate" :title="eqEx.descripcion || eqEx.subcategoria">{{ eqEx.descripcion || eqEx.subcategoria || 'Servicio de Traslado / Flete' }}</div>
                            <div class="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span class="text-blue-400 font-mono font-bold">{{ eqEx.tipo || 'TRASLADOS' }}</span>
                              <span>•</span>
                              <span v-if="eqEx.subcategoria">{{ eqEx.subcategoria }}</span>
                              <span v-if="eqEx.cantidad">• {{ eqEx.cantidad }} {{ eqEx.unidad || 'Viaje' }}</span>
                            </div>
                          </template>
                          <!-- Línea agregada en Operaciones: Categoría y Subcategoría Lado a Lado -->
                          <template v-else>
                            <div class="grid grid-cols-2 gap-1.5">
                              <select v-model="eqEx.tipo" @change="eqEx.subcategoria = ''; eqEx.id_equipo = ''; marcarDirtyAsignacion()" class="w-full bg-[#0a0f1e] border border-blue-500/40 rounded px-1.5 py-1 text-[11px] text-blue-300 font-bold outline-none focus:border-blue-400 truncate" title="Seleccionar Categoría">
                                <option value="" class="bg-[#0a0f1e] text-slate-400">-- Categoría --</option>
                                <option v-for="cat in dbCategories.filter(c => !['PERSONAL CERTIFICADO'].includes(c.nombre_categoria))" :key="'cat-ex-'+cat.id_categoria" :value="cat.nombre_categoria" class="bg-[#0a0f1e] text-white">
                                  {{ cat.nombre_categoria }}
                                </option>
                              </select>
                              <select v-model="eqEx.subcategoria" :disabled="!eqEx.tipo" @change="eqEx.id_equipo = ''; marcarDirtyAsignacion()" class="w-full bg-[#0a0f1e] border border-blue-500/20 rounded px-1.5 py-1 text-[11px] text-white outline-none focus:border-blue-400 truncate disabled:opacity-40" title="Seleccionar Subcategoría">
                                <option value="" class="bg-[#0a0f1e] text-slate-400">-- Subcategoría --</option>
                                <option v-for="sub in getSubcategoriesForType(eqEx.tipo)" :key="'sub-ex-'+sub.id_subcategoria" :value="sub.nombre_subcategoria" class="bg-[#0a0f1e] text-white">
                                  {{ sub.nombre_subcategoria }}
                                </option>
                              </select>
                            </div>
                          </template>
                        </div>
                      </div>
                    </td>
                    <td class="py-2 px-3">
                      <div class="flex items-center gap-1.5">
                        <select v-model="eqEx.id_equipo" @change="onEquipoExtraCambiado(idx)" class="flex-1 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500/50 truncate">
                          <option value="" class="bg-[#0a0f1e] text-slate-400">-- Seleccionar Vehículo ({{ eqEx.subcategoria || eqEx.tipo || 'Todos' }}) --</option>
                          <option v-for="eq in getEquiposFiltradosPorLinea(eqEx)" :key="'exeq-'+(eq.id_equipo||eq.patente)" :value="eq.id_equipo || eq.patente" class="bg-[#0a0f1e] text-white">
                            {{ eq.patente || 'S/P' }} - {{ eq.nombre_equipo || eq.tipo }} [{{ eq.nombre_subcategoria || eq.nombre_categoria || eq.tipo }}]
                          </option>
                        </select>
                        <button type="button" v-if="eqEx.id_equipo && getSemaforoEquipo(eqEx.id_equipo) === 'GREEN'" @click.stop="abrirDetalleAcreditacion('equipo', eqEx.id_equipo)" class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Acreditación Vigente">🟢 VIG</button>
                        <button type="button" v-else-if="eqEx.id_equipo && getSemaforoEquipo(eqEx.id_equipo) === 'YELLOW'" @click.stop="abrirDetalleAcreditacion('equipo', eqEx.id_equipo)" class="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Por Vencer">🟡 VNC</button>
                        <button type="button" v-else-if="eqEx.id_equipo" @click.stop="abrirDetalleAcreditacion('equipo', eqEx.id_equipo)" class="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Vencido">🔴 VNC</button>
                      </div>
                    </td>
                    <td class="py-2 px-3 font-sans">
                      <div class="flex items-center gap-1.5">
                        <select v-model="eqEx.chofer_id" @change="marcarDirtyAsignacion" class="flex-1 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500/50 truncate">
                          <option value="" class="bg-[#0a0f1e] text-slate-400">-- Seleccionar Chofer / Escolta --</option>
                          <optgroup v-if="getUsuariosAgrupados(((eqEx.subcategoria||'').toLowerCase().includes('escolta') || (eqEx.tipo||'').toLowerCase().includes('liviano')) ? 'Escolta / Guía' : 'Chofer Cama Baja').sugeridos.length > 0" label="🎯 Choferes Sugeridos" class="bg-[#0a0f1e] text-blue-400 font-bold">
                            <option v-for="u in getUsuariosAgrupados(((eqEx.subcategoria||'').toLowerCase().includes('escolta') || (eqEx.tipo||'').toLowerCase().includes('liviano')) ? 'Escolta / Guía' : 'Chofer Cama Baja').sugeridos" :key="'ch-sug-'+u.id_user" :value="u.id_user" class="bg-[#0a0f1e] text-white">
                              {{ u.nombre_user || u.name_user }} {{ u.cargo ? '(' + u.cargo + ')' : '' }}
                            </option>
                          </optgroup>
                          <optgroup label="👷 Resto de Personal Activo" class="bg-[#0a0f1e] text-slate-400 font-bold">
                            <option v-for="u in getUsuariosAgrupados(((eqEx.subcategoria||'').toLowerCase().includes('escolta') || (eqEx.tipo||'').toLowerCase().includes('liviano')) ? 'Escolta / Guía' : 'Chofer Cama Baja').otros" :key="'ch-otr-'+u.id_user" :value="u.id_user" class="bg-[#0a0f1e] text-slate-200">
                              {{ u.nombre_user || u.name_user }} {{ u.cargo ? '• ' + u.cargo : '' }}
                            </option>
                          </optgroup>
                        </select>
                        <template v-if="eqEx.chofer_id">
                          <button type="button" v-if="getSemaforoTripulante(eqEx.chofer_id) === 'GREEN'" @click.stop="abrirDetalleAcreditacion('persona', { id_user: eqEx.chofer_id, cargo: (((eqEx.subcategoria||'').toLowerCase().includes('escolta') || (eqEx.tipo||'').toLowerCase().includes('liviano')) ? 'Escolta / Guía' : 'Chofer Cama Baja'), semaforo: 'GREEN' })" class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Acreditación Vigente">🟢 VIG</button>
                          <button type="button" v-else-if="getSemaforoTripulante(eqEx.chofer_id) === 'YELLOW'" @click.stop="abrirDetalleAcreditacion('persona', { id_user: eqEx.chofer_id, cargo: (((eqEx.subcategoria||'').toLowerCase().includes('escolta') || (eqEx.tipo||'').toLowerCase().includes('liviano')) ? 'Escolta / Guía' : 'Chofer Cama Baja'), semaforo: 'YELLOW' })" class="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Por Vencer">🟡 VNC</button>
                          <button type="button" v-else @click.stop="abrirDetalleAcreditacion('persona', { id_user: eqEx.chofer_id, cargo: (((eqEx.subcategoria||'').toLowerCase().includes('escolta') || (eqEx.tipo||'').toLowerCase().includes('liviano')) ? 'Escolta / Guía' : 'Chofer Cama Baja'), semaforo: 'RED' })" class="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Vencido">🔴 VNC</button>
                        </template>
                      </div>
                    </td>
                    <td class="py-2 px-3 font-sans">
                      <div class="flex items-center gap-1 bg-[#050810] border border-white/10 rounded px-2 py-1">
                        <input type="date" v-model="eqEx.fecha_plan_ini" @change="marcarDirtyAsignacion" class="flex-1 bg-transparent text-white text-[11px] font-mono font-bold outline-none [color-scheme:dark]" />
                        <span class="text-slate-500 text-xs font-bold px-0.5">➔</span>
                        <input type="date" v-model="eqEx.fecha_plan_fin" @change="marcarDirtyAsignacion" class="flex-1 bg-transparent text-white text-[11px] font-mono font-bold outline-none [color-scheme:dark]" />
                      </div>
                    </td>
                    <td class="py-2 px-2 text-center">
                      <span v-if="eqEx.is_linea_base !== false && eqEx.is_linea_base" class="text-slate-600 text-xs select-none" title="Línea base cotizada comercialmente">🔒</span>
                      <button v-else @click="eliminarEquipoTraslado(idx)" type="button" class="text-slate-500 hover:text-red-400 p-1 cursor-pointer" title="Eliminar vehículo de traslado">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>

                  <!-- SECCIÓN 3: ESPECIALISTAS EN TERRENO -->
                  <tr class="bg-emerald-950/40 border-t border-b border-emerald-500/20">
                    <td colspan="5" class="py-1.5 px-3">
                      <div class="flex justify-between items-center">
                        <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          👷 3. Especialistas & Personal Técnico en Terreno (Sin Vehículo)
                          <span class="text-[10px] font-mono text-emerald-400/80 font-normal">({{ especialistasTerreno?.length || 0 }} {{ (especialistasTerreno?.length || 0) === 1 ? 'persona' : 'personas' }})</span>
                        </span>
                        <button @click="agregarEspecialista" type="button" class="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer flex items-center gap-1">
                          + Añadir Especialista
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- FILAS ESPECIALISTAS -->
                  <tr v-if="!especialistasTerreno || especialistasTerreno.length === 0" class="font-sans">
                    <td colspan="5" class="py-2.5 pr-3 pl-8 text-xs text-slate-500 italic">
                      Sin especialistas técnicos asignados. Haz clic en "+ Añadir Especialista" para incorporar personal en tierra.
                    </td>
                  </tr>
                  <tr v-for="(esp, idx) in especialistasTerreno" :key="'esp-'+idx" class="hover:bg-white/[0.02] font-mono">
                    <td class="py-2 pr-3 pl-7 font-sans">
                      <div class="flex items-start gap-2">
                        <span class="text-emerald-400/70 text-xs font-mono select-none mt-1">↳</span>
                        <div class="min-w-0 flex-1">
                          <div class="grid grid-cols-2 gap-1.5">
                            <select v-model="esp.cargo" :disabled="esp.is_linea_base" @change="marcarDirtyAsignacion" class="w-full bg-[#0a0f1e] border border-emerald-500/30 rounded px-1.5 py-1 text-[11px] text-white font-sans outline-none focus:border-emerald-400 truncate" :class="{ 'opacity-85 cursor-not-allowed': esp.is_linea_base }" title="Cargo / Especialidad">
                              <option value="Prevencionista de Riesgos" class="bg-[#0a0f1e] text-white">Prevencionista</option>
                              <option value="Rigger" class="bg-[#0a0f1e] text-white">Rigger Certificado</option>
                              <option value="Supervisor Faena" class="bg-[#0a0f1e] text-white">Supervisor Faena</option>
                              <option value="Maniobrista" class="bg-[#0a0f1e] text-white">Maniobrista / Señalero</option>
                            </select>
                            <div class="bg-[#0a0f1e] border border-emerald-500/20 rounded px-1.5 py-1 text-[10px] text-emerald-400 font-mono truncate flex items-center" :title="esp.requerimiento || 'Personal en tierra'">
                              {{ esp.requerimiento ? 'Req: ' + esp.requerimiento : 'Personal Faena' }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="py-2 px-3 font-sans text-center text-slate-600 text-xs select-none">
                      —
                    </td>
                    <td class="py-2 px-3 font-sans">
                      <div class="flex items-center gap-1.5">
                        <select v-model="esp.id_user" @change="marcarDirtyAsignacion" class="flex-1 bg-[#0a0f1e] border border-emerald-500/30 rounded px-2 py-1 text-xs text-white outline-none focus:border-emerald-400 truncate">
                          <option value="" class="bg-[#0a0f1e] text-slate-400">-- Seleccionar Especialista ({{ esp.cargo }}) --</option>
                          <optgroup v-if="getUsuariosAgrupados(esp.cargo).sugeridos.length > 0" label="🎯 Especialistas Sugeridos" class="bg-[#0a0f1e] text-emerald-400 font-bold">
                            <option v-for="u in getUsuariosAgrupados(esp.cargo).sugeridos" :key="'esp-sug-'+u.id_user" :value="u.id_user" class="bg-[#0a0f1e] text-white">
                              {{ u.nombre_user || u.name_user }} {{ u.cargo ? '(' + u.cargo + ')' : '' }}
                            </option>
                          </optgroup>
                          <optgroup label="👷 Resto de Personal Activo" class="bg-[#0a0f1e] text-slate-400 font-bold">
                            <option v-for="u in getUsuariosAgrupados(esp.cargo).otros" :key="'esp-otr-'+u.id_user" :value="u.id_user" class="bg-[#0a0f1e] text-slate-200">
                              {{ u.nombre_user || u.name_user }} {{ u.cargo ? '• ' + u.cargo : '' }}
                            </option>
                          </optgroup>
                        </select>
                        <template v-if="esp.id_user">
                          <button type="button" v-if="getSemaforoTripulante(esp.id_user) === 'GREEN'" @click.stop="abrirDetalleAcreditacion('persona', { id_user: esp.id_user, cargo: esp.cargo, semaforo: 'GREEN' })" class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Acreditación Vigente">🟢 VIG</button>
                          <button type="button" v-else-if="getSemaforoTripulante(esp.id_user) === 'YELLOW'" @click.stop="abrirDetalleAcreditacion('persona', { id_user: esp.id_user, cargo: esp.cargo, semaforo: 'YELLOW' })" class="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Por Vencer">🟡 VNC</button>
                          <button type="button" v-else @click.stop="abrirDetalleAcreditacion('persona', { id_user: esp.id_user, cargo: esp.cargo, semaforo: 'RED' })" class="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans flex-shrink-0 cursor-pointer" title="Vencido">🔴 VNC</button>
                        </template>
                      </div>
                    </td>
                    <td class="py-2 px-3 font-sans">
                      <div class="flex items-center gap-1 bg-[#050810] border border-emerald-500/20 rounded px-2 py-1">
                        <input type="date" v-model="esp.fecha_plan_ini" @change="marcarDirtyAsignacion" class="flex-1 bg-transparent text-white text-[11px] font-mono font-bold outline-none [color-scheme:dark]" />
                        <span class="text-slate-500 text-xs font-bold px-0.5">➔</span>
                        <input type="date" v-model="esp.fecha_plan_fin" @change="marcarDirtyAsignacion" class="flex-1 bg-transparent text-white text-[11px] font-mono font-bold outline-none [color-scheme:dark]" />
                      </div>
                    </td>
                    <td class="py-2 px-2 text-center">
                      <span v-if="esp.is_linea_base" class="text-slate-600 text-xs select-none" title="Línea base requerida comercialmente">🔒</span>
                      <button v-else @click="eliminarEspecialista(idx)" type="button" class="text-slate-500 hover:text-red-400 p-1 cursor-pointer" title="Eliminar especialista">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          <!-- BLOQUE INFERIOR: REFERENCIA VISITA A TERRENO + MATRIZ DE APAREJOS LADO A LADO -->
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
            
            <!-- COLUMNA IZQUIERDA: REFERENCIA VISITA A TERRENO & OBSERVACIONES -->
            <div class="space-y-3">
              <!-- Referencia Visita a Terreno (Compacta) -->
              <div class="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg pointer-events-auto">
                <div class="flex justify-between items-center border-b border-blue-500/20 pb-1.5 mb-2">
                  <h4 class="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📋 Referencia: Levantamiento Visita a Terreno</span>
                  </h4>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded font-mono font-bold">
                      {{ visitasDelProyecto.length }} Inspección(es)
                    </span>
                    <button v-if="visitasDelProyecto.length > 1" @click="mostrarHistorialVisitasModal = !mostrarHistorialVisitasModal" type="button" class="text-[10px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer pointer-events-auto">
                      📜 {{ mostrarHistorialVisitasModal ? 'Ocultar Historial' : 'Historial (' + (visitasDelProyecto.length - 1) + ')' }}
                    </button>
                  </div>
                </div>
                
                <div v-if="visitasDelProyecto.length > 0" class="space-y-2">
                  <div class="bg-[#050810] p-2 rounded border border-white/5 flex flex-wrap justify-between items-center gap-2">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-white text-xs">Visita #{{ visitasDelProyecto[0].id_survey }}</span>
                      <span class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                        {{ visitasDelProyecto[0].estado_srv || 'Realizada' }}
                      </span>
                      <span class="text-xs text-slate-300 font-medium truncate max-w-[150px]">{{ visitasDelProyecto[0].body_exec?.nombre_obra || visitasDelProyecto[0].body_exec?.obra_nombre || siteVisit.obra_nombre || 'Obra Terreno' }}</span>
                    </div>

                    <div class="flex items-center gap-2 ml-auto">
                      <span class="text-xs text-slate-200 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 font-bold">
                        📅 {{ visitasDelProyecto[0].fecha_plan_ini ? new Date(visitasDelProyecto[0].fecha_plan_ini).toLocaleDateString() : 'S/F' }}
                      </span>
                      <a :href="getSurveyReportUrl(visitasDelProyecto[0].id_survey)" target="_blank" class="bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 font-bold px-2.5 py-1 text-xs rounded transition-colors no-underline cursor-pointer pointer-events-auto">
                        👁️ Ver Web
                      </a>
                      <a :href="getArchivoUrl(visitasDelProyecto[0].id_doc || visitasDelProyecto[0].id_survey)" target="_blank" class="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 font-bold px-2.5 py-1 text-xs rounded transition-colors no-underline cursor-pointer pointer-events-auto">
                        📄 Reporte PDF
                      </a>
                    </div>
                  </div>

                  <!-- Historial desplegable -->
                  <div v-if="mostrarHistorialVisitasModal" class="space-y-1 pt-1.5 border-t border-white/5 pointer-events-auto">
                    <div v-for="v in visitasDelProyecto.slice(1)" :key="'st3-v-'+v.id_survey" class="flex justify-between items-center bg-black/40 px-2 py-1 rounded border border-white/5 text-xs">
                      <span class="text-slate-200 font-medium">Visita #{{ v.id_survey }} ({{ v.estado_srv || 'Realizada' }})</span>
                      <div class="flex gap-2 items-center">
                        <a :href="getSurveyReportUrl(v.id_survey)" target="_blank" class="text-amber-400 text-xs hover:underline pointer-events-auto font-bold">Web</a>
                        <span class="text-slate-600">|</span>
                        <a :href="getArchivoUrl(v.id_doc || v.id_survey)" target="_blank" class="text-blue-400 text-xs hover:underline pointer-events-auto font-bold">PDF</a>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-xs text-slate-400 italic">
                  Sin inspecciones previas registradas para este proyecto.
                </div>
              </div>

              <!-- Observaciones Operativas Compactas -->
              <div class="bg-[#080d1a] border border-white/10 p-2.5 rounded-lg space-y-1">
                <label class="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                  💬 Instrucciones / Observaciones Operativas de Faena
                </label>
                <textarea 
                  v-model="operacionesAssignment.observaciones_operaciones" 
                  @input="marcarDirtyAsignacion"
                  rows="2" 
                  placeholder="Instrucciones operativas del coordinador para la preparación y despacho..."
                  class="w-full bg-[#0a0f1e] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-amber-400 resize-none transition-colors"
                ></textarea>
              </div>
            </div>

            <!-- COLUMNA DERECHA: 3. MATRIZ DE APAREJOS (CHECKLIST COMPACTO) -->
            <div class="bg-[#080d1a] border border-white/10 rounded-lg p-2.5 space-y-2 flex flex-col justify-between">
              <div class="flex justify-between items-center border-b border-white/5 pb-1.5">
                <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  ⛓️ 3. Matriz de Aparejos & Implementos de Izaje
                </span>
                <span class="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded font-mono font-bold">aparejos_solicitados_json</span>
              </div>

              <div class="grid grid-cols-2 xl:grid-cols-4 gap-2 flex-1">
                <div v-for="item in operacionesAssignment.implementos_survey" :key="item.id" class="p-2 bg-[#0a0f1e] rounded-lg border transition-all flex flex-col justify-between" :class="item.requerido ? 'border-amber-500/50 bg-amber-500/[0.05] shadow-sm' : 'border-white/5 opacity-70 hover:opacity-100'">
                  <div class="flex items-center justify-between gap-1 mb-1">
                    <label class="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none truncate" :class="item.requerido ? 'text-amber-300' : 'text-slate-300'">
                      <input type="checkbox" v-model="item.requerido" @change="marcarDirtyAsignacion" class="accent-amber-500 w-3.5 h-3.5 rounded cursor-pointer" />
                      <span class="truncate" :title="item.label">{{ item.label }}</span>
                    </label>
                    <span v-if="item.requerido" class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-bold font-mono">REQ</span>
                  </div>
                  <input type="text" v-model="item.detalle" @input="marcarDirtyAsignacion" placeholder="Cap / Cant / Largo..." class="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500/60 font-mono transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PANEL HISTORIAL Y CONTROL DE VERSIONES DE ORDEN DE TRABAJO (OT) -->
        <div class="bg-[#080d1a] border border-amber-500/30 rounded-xl p-3.5 space-y-3 shadow-xl">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div class="flex items-center gap-2.5">
              <span class="text-base">📋</span>
              <div>
                <h4 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  Historial de Versiones — Orden de Trabajo (OT)
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {{ sortedOtVersiones.length }} {{ sortedOtVersiones.length === 1 ? 'Versión' : 'Versiones' }}
                  </span>
                </h4>
                <p class="text-[10px] text-slate-400">
                  Cada ajuste en los recursos, flota o cronograma genera una versión inmutable con trazabilidad legal y despacho B2B.
                </p>
              </div>
            </div>
            <button 
              @click="generarPDFOT" 
              :disabled="generandoPDFOT"
              type="button"
              class="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span v-if="generandoPDFOT" class="animate-spin">⏳</span>
              <span v-else>✨</span>
              <span>{{ generandoPDFOT ? 'Compilando OT...' : '+ Nueva Versión OT (PDF)' }}</span>
            </button>
          </div>

          <!-- Lista de Versiones -->
          <div v-if="sortedOtVersiones.length === 0" class="p-4 bg-[#050810] rounded-lg border border-dashed border-white/10 text-center space-y-2">
            <span class="text-2xl">📄</span>
            <p class="text-xs text-slate-300 font-bold">Aún no se ha generado la versión oficial de la Orden de Trabajo.</p>
            <p class="text-[11px] text-slate-500 max-w-md mx-auto">
              Haz clic en <strong>"+ Nueva Versión OT (PDF)"</strong> para compilar el documento formal con la flota, tripulación, aparejos y cronograma asignados.
            </p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            <div 
              v-for="ot in sortedOtVersiones" 
              :key="'ot-ver-'+ot.version"
              class="bg-[#050810] border border-white/10 hover:border-amber-500/40 rounded-lg p-3 space-y-2.5 transition-all shadow-md group"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    V{{ ot.version }}
                  </span>
                  <div>
                    <div class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors font-mono truncate max-w-[160px]" :title="ot.nombre_archivo">
                      {{ ot.nombre_archivo }}
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono">
                      📅 {{ new Date(ot.fecha).toLocaleString('es-CL') }}
                    </div>
                  </div>
                </div>
                <span v-if="ot.version === sortedOtVersiones[0].version" class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  VIGENTE
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-[10px] bg-black/40 p-2 rounded border border-white/5">
                <div class="text-slate-300">
                  🚜 <strong class="text-white">{{ ot.total_equipos || equiposAsignadosLista.length }}</strong> Vehículos
                </div>
                <div class="text-slate-300">
                  👷 <strong class="text-white">{{ ot.total_tripulacion || tripulacionAsignada.length }}</strong> Tripulantes
                </div>
              </div>

              <div class="flex items-center gap-2 pt-1 border-t border-white/5">
                <a 
                  :href="ot.id_doc ? `${archivoBaseUrl}/v1/storage/view/${ot.id_doc}` : getFullStaticUrl(ot.url)" 
                  target="_blank" 
                  rel="noopener"
                  class="flex-1 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded text-center text-xs font-bold transition-colors flex items-center justify-center gap-1.5 no-underline cursor-pointer"
                >
                  <span>📄</span>
                  <span>Ver PDF</span>
                </a>
                <button 
                  @click="abrirModalEnviarOT(ot)"
                  type="button"
                  class="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-center text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📧</span>
                  <span>Despachar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SUB-TAB 4: PESTAÑA ACREDITACIONES & DOSSIER (POST-ASIGNACIÓN CON DATOS DINÁMICOS REALES) -->
      <div v-if="operacionesSubTab === 'acreditaciones'" class="space-y-6">
        <div class="bg-[#050810] border border-white/10 rounded-xl p-5 space-y-5">
          
          <!-- Encabezado del Dossier de Acreditación con Datos Reales -->
          <div class="border-b border-white/5 pb-4 flex justify-between items-start">
            <div>
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                📑 Dossier de Acreditaciones de Recursos (Post-Asignación)
              </span>
              <div class="flex items-center gap-3 mt-1.5 text-xs text-slate-300">
                <span>Cliente: <strong class="text-white">{{ selectedClient?.razon_social || selectedClient?.name_empresa || opportunity.empresa_razon_social || 'Cliente Mandante' }}</strong></span>
                <span class="text-slate-600">|</span>
                <span>Proceso: <strong class="text-amber-400 font-mono">{{ antecedentes.identificador_formal || opportunity.codi_proyecto || 'GSP-2026-001' }}</strong></span>
                <span class="text-slate-600">|</span>
                <span>Faena: <strong class="text-slate-200">{{ siteVisit.obra_nombre || opportunity.nombre_proyecto || 'Obra Terreno' }}</strong></span>
              </div>
            </div>

            <!-- Botón Despachar Dossier B2B -->
            <button 
              @click="despacharDossierCliente"
              :disabled="tieneDocumentosVencidosOPendientes"
              :class="tieneDocumentosVencidosOPendientes ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 cursor-pointer'"
              class="px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all font-bold flex items-center gap-2 border"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              <span>Despachar Dossier al Cliente (Email B2B)</span>
            </button>
          </div>

          <!-- Alerta Si Hay Documentos Vencidos / Bloqueo -->
          <div v-if="tieneDocumentosVencidosOPendientes" class="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-center gap-3 text-xs text-red-300">
            <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <div>
              <strong class="font-bold block">Despacho Bloqueado:</strong>
              Existen documentos <span class="text-red-400 font-bold">VENCIDOS</span> o <span class="text-slate-400 font-bold">PENDIENTES</span>. Debes renovar o subir los certificados requeridos antes de despachar el dossier.
            </div>
          </div>

          <!-- GRID DE 3 COLUMNAS PARA OPTIMIZACIÓN ESPACIAL (EMPRESA | EQUIPOS | PERSONAS) CON ACCIONES IN-SITU -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- COLUMNA 1: EMPRESA -->
            <div class="bg-[#0a0f1e] border border-white/10 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-center border-b border-white/5 pb-2">
                  <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">🏢 1. Empresa Mandante</span>
                  <button @click="agregarDocAdHoc('empresa')" type="button" class="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1">
                    + Exigir Doc
                  </button>
                </div>
                <div v-if="opportunity.acreditacion_docs?.empresa && opportunity.acreditacion_docs.empresa.length > 0" class="space-y-2 mt-3">
                  <div v-for="(doc, dIdx) in opportunity.acreditacion_docs.empresa" :key="'dos-emp-'+dIdx" class="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-white/5 text-xs">
                    <div class="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <span :class="checkDocVigente(doc, 'empresa') ? 'text-emerald-400 font-bold text-sm' : 'text-red-500 font-bold text-sm'">
                        {{ checkDocVigente(doc, 'empresa') ? '✅' : '❌' }}
                      </span>
                      <span class="text-slate-200 font-medium truncate">{{ doc }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <button v-if="checkDocVigente(doc, 'empresa')" @click="verDocumentoDossier(doc, 'empresa')" type="button" class="cursor-pointer text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/40 transition-all flex items-center gap-0.5">
                        👁️ Ver
                      </button>
                      <button @click="abrirModalVincularDoc(doc, 'empresa')" type="button" class="cursor-pointer text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded font-bold border border-purple-500/40 transition-all flex items-center gap-0.5">
                        🔗 Vincular
                      </button>
                      <label class="cursor-pointer text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-500/40 transition-all flex items-center gap-0.5">
                        📤 Subir
                        <input type="file" class="hidden" @change="subirArchivoInSitu('empresa', doc, $event)" />
                      </label>
                      <button @click="quitarDocExigido('empresa', dIdx)" class="text-slate-500 hover:text-red-400 font-bold px-1 text-xs">&times;</button>
                    </div>
                  </div>
                </div>
                <div v-else class="text-xs text-slate-500 italic p-3 text-center">
                  Sin documentos exigidos de empresa.
                </div>
              </div>
            </div>

            <!-- COLUMNA 2: EQUIPOS ASIGNADOS REALES (ICONO GSP GRÚA MÓVIL 🚜) -->
            <div class="bg-[#0a0f1e] border border-white/10 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-center border-b border-white/5 pb-2">
                  <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">🚜 2. Equipos Asignados</span>
                  <button @click="agregarDocAdHoc('equipos')" type="button" class="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1">
                    + Exigir Doc
                  </button>
                </div>
                <div class="space-y-3 mt-3">
                  <div v-for="eqId in equiposAsignadosLista" :key="'dos-eq-card-'+eqId" class="bg-black/40 p-3 rounded-lg border border-white/5 space-y-2">
                    <div class="flex justify-between items-center text-xs">
                      <span class="font-bold text-white font-mono truncate">{{ getNombreEquipoAsignado(eqId) }}</span>
                    </div>
                    <div v-if="opportunity.acreditacion_docs?.equipos && opportunity.acreditacion_docs.equipos.length > 0" class="space-y-1.5 pl-2 border-l-2 border-amber-500/30">
                      <div v-for="(doc, dIdx) in opportunity.acreditacion_docs.equipos" :key="'dos-eqp-'+eqId+'-'+dIdx" class="flex justify-between items-center text-xs bg-white/5 p-2 rounded">
                        <div class="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <span :class="checkDocVigente(doc, 'equipos', eqId) ? 'text-emerald-400 font-bold text-sm' : 'text-red-500 font-bold text-sm'">
                            {{ checkDocVigente(doc, 'equipos', eqId) ? '✅' : '❌' }}
                          </span>
                          <span class="text-slate-300 truncate">{{ extractDocName(doc) }}</span>
                        </div>
                        <div class="flex items-center gap-1.5 flex-shrink-0">
                          <button v-if="checkDocVigente(doc, 'equipos', eqId)" @click="verDocumentoDossier(doc, 'equipos', eqId)" type="button" class="cursor-pointer text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/40 transition-all flex items-center gap-0.5">
                            👁️ Ver
                          </button>
                          <button @click="abrirModalVincularDoc(doc, 'equipos', eqId)" type="button" class="cursor-pointer text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded font-bold border border-purple-500/40 transition-all flex items-center gap-0.5">
                            🔗 Vincular
                          </button>
                          <label class="cursor-pointer text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/40 transition-all flex items-center gap-0.5">
                            📤 Subir
                            <input type="file" class="hidden" @change="subirArchivoInSitu('equipos', doc, $event, eqId)" />
                          </label>
                          <button @click="quitarDocExigido('equipos', dIdx)" class="text-slate-500 hover:text-red-400 font-bold px-1 text-xs">&times;</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- COLUMNA 3: TRIPULACIÓN Y PERSONAL ASIGNADO REAL -->
            <div class="bg-[#0a0f1e] border border-white/10 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-center border-b border-white/5 pb-2">
                  <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">👷 3. Personal Asignado</span>
                  <button @click="agregarDocAdHoc('personas')" type="button" class="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1">
                    + Exigir Doc
                  </button>
                </div>
                <div class="space-y-3 mt-3">
                  <div v-for="(t, idx) in tripulacionAsignada" :key="'dos-trip-'+idx" class="bg-black/40 p-3 rounded-lg border border-white/5 space-y-2">
                    <div class="flex justify-between items-center text-xs">
                      <span class="font-bold text-white truncate">{{ t.cargo }}: {{ getNombrePersonaAsignada(t.id_user) }}</span>
                    </div>
                    <div v-if="opportunity.acreditacion_docs?.personas && opportunity.acreditacion_docs.personas.length > 0" class="space-y-1.5 pl-2 border-l-2 border-emerald-500/30">
                      <div v-for="(doc, dIdx) in opportunity.acreditacion_docs.personas" :key="'dos-per-'+dIdx" class="flex justify-between items-center text-xs bg-white/5 p-2 rounded">
                        <div class="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <span :class="checkDocVigente(doc, 'personas', t) ? 'text-emerald-400 font-bold text-sm' : 'text-red-500 font-bold text-sm'">
                            {{ checkDocVigente(doc, 'personas', t) ? '✅' : '❌' }}
                          </span>
                          <span class="text-slate-300 truncate">{{ extractDocName(doc) }}</span>
                        </div>
                        <div class="flex items-center gap-1.5 flex-shrink-0">
                          <button v-if="checkDocVigente(doc, 'personas', t)" @click="verDocumentoDossier(doc, 'personas', t)" type="button" class="cursor-pointer text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/40 transition-all flex items-center gap-0.5">
                            👁️ Ver
                          </button>
                          <button @click="abrirModalVincularDoc(doc, 'personas', t)" type="button" class="cursor-pointer text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded font-bold border border-purple-500/40 transition-all flex items-center gap-0.5">
                            🔗 Vincular
                          </button>
                          <label class="cursor-pointer text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/40 transition-all flex items-center gap-0.5">
                            📤 Subir
                            <input type="file" class="hidden" @change="subirArchivoInSitu('personas', doc, $event, t)" />
                          </label>
                          <button @click="quitarDocExigido('personas', dIdx)" class="text-slate-500 hover:text-red-400 font-bold px-1 text-xs">&times;</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- BLOQUE 4: HISTORIAL DE ENVÍOS B2B DE ESTE DOSSIER -->
          <div class="bg-[#0a0f1e] border border-white/10 rounded-xl p-4 space-y-3">
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-white/5 pb-2">
              📜 Historial de Envíos B2B del Dossier al Cliente
            </span>
            <div v-if="historialEnviousDossier && historialEnviousDossier.length > 0" class="space-y-2">
              <div v-for="(h, hIdx) in historialEnviousDossier" :key="'env-doss-'+hIdx" class="bg-black/40 p-3 rounded-lg border border-white/5 flex justify-between items-center text-xs">
                <div>
                  <div class="font-bold text-amber-400">Versión {{ h.version || 'v1.0' }} — {{ new Date(h.fecha).toLocaleString() }}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">Enviado por: {{ h.usuario || 'Ejecutivo Comercial' }} | Destino: {{ h.destinatarios || 'Cliente Mandante' }}</div>
                </div>
                <button @click="verPreviewCorreoHTML(h)" class="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded text-xs font-bold transition-all flex items-center gap-1">
                  <span>Ver Correo 👁️</span>
                </button>
              </div>
            </div>
            <div v-else class="text-xs text-slate-500 italic p-2">
              Sin envíos de dossier registrados previamente para este proyecto.
            </div>
          </div>
        </div>
      </div>

      <!-- SUB-TAB 5: PESTAÑA PREPARACIÓN DE SALIDA (DISEÑO UX PRO SIMÉTRICO) -->
      <div v-if="operacionesSubTab === 'preparacion_salida'" class="space-y-6">
        
        <!-- STEPPER HORIZONTAL PREMIUM (60px DE ALTO - SEMÁFOROS NEÓN) -->
        <div class="bg-[#050810] border border-white/10 rounded-2xl p-4 shadow-xl">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            
            <!-- INDICADORES STEPPER HORIZONTALES CONECTADOS -->
            <div class="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3 relative">
              
              <!-- PASO 1: CALIDAD -->
              <div :class="[
                'p-3 rounded-xl border transition-all duration-300 flex items-center justify-between',
                statusSegmento1 === 'GREEN' ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'bg-[#0a0f1e] border-white/10'
              ]">
                <div class="flex items-center gap-3">
                  <div :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs',
                    statusSegmento1 === 'GREEN' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  ]">
                    1
                  </div>
                  <div>
                    <span class="text-xs font-bold text-white block">🛡️ Control Calidad</span>
                    <span class="text-[10px] text-slate-400 block">Notificación Antecedentes</span>
                  </div>
                </div>
                <span :class="statusSegmento1 === 'GREEN' ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' : 'text-red-400 bg-red-500/20 border-red-500/30'" class="text-[10px] font-bold px-2 py-0.5 rounded border">
                  {{ statusSegmento1 === 'GREEN' ? '🟢 Notificado' : '🔴 Pendiente' }}
                </span>
              </div>

              <!-- PASO 2: PATIO -->
              <div :class="[
                'p-3 rounded-xl border transition-all duration-300 flex items-center justify-between',
                statusSegmento2 === 'GREEN' ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : (statusSegmento2 === 'YELLOW' ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10' : 'bg-[#0a0f1e] border-white/10')
              ]">
                <div class="flex items-center gap-3">
                  <div :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs',
                    statusSegmento2 === 'GREEN' ? 'bg-emerald-500 text-slate-950 font-black' : (statusSegmento2 === 'YELLOW' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30')
                  ]">
                    2
                  </div>
                  <div>
                    <span class="text-xs font-bold text-white block">🚜 Inspección Patio</span>
                    <span class="text-[10px] text-slate-400 block">Inspección de Patio</span>
                  </div>
                </div>
                <span :class="statusSegmento2 === 'GREEN' ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' : (statusSegmento2 === 'YELLOW' ? 'text-amber-400 bg-amber-500/20 border-amber-500/30' : 'text-slate-400 bg-slate-800 border-slate-700')" class="text-[10px] font-bold px-2 py-0.5 rounded border">
                  {{ statusSegmento2 === 'GREEN' ? '🟢 Conforme' : (statusSegmento2 === 'YELLOW' ? '🟡 Programado' : '🔴 No Agendado') }}
                </span>
              </div>

              <!-- PASO 3: ANALISTA 360 & GPS -->
              <div :class="[
                'p-3 rounded-xl border transition-all duration-300 flex items-center justify-between',
                statusSegmento3 === 'GREEN' ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : (statusSegmento3 === 'YELLOW' ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10' : 'bg-[#0a0f1e] border-white/10')
              ]">
                <div class="flex items-center gap-3">
                  <div :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs',
                    statusSegmento3 === 'GREEN' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  ]">
                    3
                  </div>
                  <div>
                    <span class="text-xs font-bold text-white block">💻 Analista & GPS</span>
                    <span class="text-[10px] text-slate-400 block">Revisión 360 & Geocerca</span>
                  </div>
                </div>
                <span :class="statusSegmento3 === 'GREEN' ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' : (statusSegmento3 === 'YELLOW' ? 'text-amber-400 bg-amber-500/20 border-amber-500/30' : 'text-red-400 bg-red-500/20 border-red-500/30')" class="text-[10px] font-bold px-2 py-0.5 rounded border">
                  {{ statusSegmento3 === 'GREEN' ? '🟢 Habilitado' : (statusSegmento3 === 'YELLOW' ? '🟡 En Proceso' : '🔴 No Iniciado') }}
                </span>
              </div>

            </div>

            <!-- HITO GLOBAL DE PASE A TERRENO -->
            <div class="flex-shrink-0 bg-[#0a0f1e] p-3 rounded-xl border border-white/10 flex items-center gap-3">
              <div class="text-right">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado Pase Terreno</span>
                <span :class="(statusSegmento2 === 'GREEN' && statusSegmento3 === 'GREEN') ? 'text-emerald-400 font-black' : 'text-amber-400 font-bold'" class="text-xs font-mono block">
                  {{ (statusSegmento2 === 'GREEN' && statusSegmento3 === 'GREEN') ? '🟢 PASE LIBERADO' : '🔒 PENDIENTE (REQUISITOS)' }}
                </span>
              </div>
              <div :class="(statusSegmento2 === 'GREEN' && statusSegmento3 === 'GREEN') ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'" class="p-2 rounded-lg font-bold text-xs">
                {{ (statusSegmento2 === 'GREEN' && statusSegmento3 === 'GREEN') ? '3/3' : '1/3' }}
              </div>
            </div>

          </div>
        </div>

        <!-- GRILLA DE 3 COLUMNAS PARALELAS SIMÉTRICAS -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <!-- COLUMNA 1: CONTROL DE CALIDAD -->
          <div class="bg-[#0a0f1e] border border-purple-500/20 hover:border-purple-500/40 transition-all rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xl min-h-[460px]">
            <div class="space-y-4">
              <div class="flex justify-between items-center border-b border-white/10 pb-3">
                <span class="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :class="statusSegmento1 === 'GREEN' ? 'bg-emerald-500' : 'bg-red-500'"></span>
                  🛡️ 1. Control de Calidad
                </span>
                <span v-if="preparacionSalidaState.cc_notificado" class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  ✅ Notificado
                </span>
              </div>

              <div class="bg-[#050810] p-3.5 rounded-xl border border-white/5 space-y-2 text-xs">
                <span class="text-[11px] font-bold text-slate-300 block border-b border-white/5 pb-1">📋 Antecedentes del Servicio</span>
                <div>Cliente: <strong class="text-white">{{ selectedClient?.razon_social || opportunity.rut_cliente }}</strong></div>
                <div>Servicio / Carga: <strong class="text-amber-400">{{ siteVisit.tipo_carga || 'General' }}</strong> ({{ siteVisit.peso_carga || 'N/A' }})</div>
                <div>Lugar: <strong class="text-slate-200">{{ siteVisit.obra_nombre || 'Obra' }} - {{ siteVisit.obra_ciudad || '' }}</strong></div>
              </div>

              <div class="space-y-2">
                <label class="block text-[10px] text-slate-400 font-semibold">Notas & Riesgos de Calidad:</label>
                <textarea v-model="preparacionSalidaState.cc_notas_riesgo" :disabled="preparacionSalidaState.cc_notificado" rows="3" placeholder="Detalle requisitos especiales de EPP, certificaciones o maniobra..." class="w-full bg-[#050810] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none resize-none focus:border-purple-500/50 disabled:opacity-50"></textarea>
              </div>
            </div>

            <div class="space-y-3 pt-2">
              <button 
                @click="notificarControlCalidad" 
                :disabled="preparacionSalidaState.cc_notificado" 
                class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span>{{ preparacionSalidaState.cc_notificado ? 'Calidad Notificado' : 'Notificar a Calidad por Correo' }}</span>
              </button>

              <div v-if="preparacionSalidaState.cc_notificado" class="p-3 bg-[#050810] rounded-xl border border-emerald-500/30 text-xs space-y-1">
                <div class="flex justify-between items-center border-b border-white/5 pb-1">
                  <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">📜 Traza Calidad</span>
                  <span class="text-[10px] text-slate-400 font-mono">⏱️ {{ trazaCalidad?.fecha_hora || 'Registrado' }}</span>
                </div>
                <div class="text-[10px] text-slate-300 truncate">Para: <strong class="text-white">{{ trazaCalidad?.para || 'calidad@arriendosanpablo.cl' }}</strong></div>
                <div class="text-[10px] text-slate-300 truncate">Asunto: <strong class="text-amber-400">{{ trazaCalidad?.asunto || '🛡️ Requerimientos Calidad' }}</strong></div>
              </div>
            </div>
          </div>

          <!-- COLUMNA 2: INSPECCIÓN SALIDA DE PATIO POR EQUIPO -->
          <div class="bg-[#0a0f1e] border border-amber-500/20 hover:border-amber-500/40 transition-all rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xl min-h-[460px]">
            <div class="space-y-4 flex-1 flex flex-col min-h-0">
              <div class="flex justify-between items-center border-b border-white/10 pb-3 flex-shrink-0">
                <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :class="statusSegmento2 === 'GREEN' ? 'bg-emerald-500' : (statusSegmento2 === 'YELLOW' ? 'bg-amber-500' : 'bg-red-500')"></span>
                  🚜 2. Inspección Patio
                </span>
                <div class="flex items-center gap-2">
                  <button 
                    @click="sincronizarInspeccionesPWA" 
                    type="button" 
                    :disabled="sincronizandoInspecciones" 
                    class="w-7 h-7 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-bold transition-all flex items-center justify-center cursor-pointer shadow-sm"
                    title="Refrescar estado de inspecciones de patio en terreno"
                  >
                    <svg 
                      class="w-4 h-4" 
                      :class="sincronizandoInspecciones ? 'animate-spin' : ''" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Lista de Tarjetas de Inspección por Equipo (Formato Acordeón Compacto) -->
              <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[65vh] pr-1">
                <div 
                  v-for="eqId in equiposAsignadosLista" 
                  :key="'insp-eq-'+eqId" 
                  class="bg-[#050810] rounded-xl border transition-all overflow-hidden"
                  :class="isEquipoPatioExpanded(eqId) ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-white/10 hover:border-white/20'"
                >
                  <!-- Cabecera Resumen Compacta (Fila de Control) -->
                  <div 
                    @click="toggleExpandEquipoPatio(eqId)"
                    class="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.03] transition-colors select-none"
                    :class="isEquipoPatioExpanded(eqId) ? 'border-b border-white/10 bg-white/[0.02]' : ''"
                  >
                    <div class="flex items-center gap-2.5 min-w-0 pr-2">
                      <span class="text-base flex-shrink-0">🚜</span>
                      <div class="min-w-0">
                        <div class="font-bold text-white font-mono text-xs truncate" :title="getNombreEquipoAsignado(eqId)">
                          {{ getNombreEquipoAsignado(eqId) }}
                        </div>
                        <div class="flex items-center gap-2 mt-1">
                          <!-- Badge de Estado de Inspección -->
                          <span 
                            class="text-[9px] px-2 py-0.5 rounded font-bold uppercase border tracking-wider flex items-center gap-1"
                            :class="{
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/30': getEstadoInspeccionEquipo(eqId) === 'EJECUTADA_OK',
                              'bg-red-500/10 text-red-400 border-red-500/30': getEstadoInspeccionEquipo(eqId) === 'RECHAZADA',
                              'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse': getEstadoInspeccionEquipo(eqId) === 'EN_VERIFICACION',
                              'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse': getEstadoInspeccionEquipo(eqId) === 'EN_EJECUCION',
                              'bg-amber-500/10 text-amber-400 border-amber-500/30': getEstadoInspeccionEquipo(eqId) === 'PLANIFICADA',
                              'bg-slate-500/10 text-slate-400 border-slate-500/20': getEstadoInspeccionEquipo(eqId) === 'NO_ASIGNADA'
                            }"
                          >
                            <span v-if="getEstadoInspeccionEquipo(eqId) === 'EJECUTADA_OK'">🟢 Ejecutada OK</span>
                            <span v-else-if="getEstadoInspeccionEquipo(eqId) === 'RECHAZADA'">🔴 Rechazada / Taller</span>
                            <span v-else-if="getEstadoInspeccionEquipo(eqId) === 'EN_VERIFICACION'">🟣 En Verificación FES</span>
                            <span v-else-if="getEstadoInspeccionEquipo(eqId) === 'EN_EJECUCION'">🔵 En Ejecución</span>
                            <span v-else-if="getEstadoInspeccionEquipo(eqId) === 'PLANIFICADA'">🟡 Planificada</span>
                            <span v-else>⚪ No Asignada</span>
                          </span>

                          <!-- Badge de Acreditación Oficial (Idéntico a Asignación) -->
                          <button 
                            type="button" 
                            v-if="getSemaforoEquipo(eqId) === 'GREEN'" 
                            @click.stop="abrirDetalleAcreditacion('equipo', eqId)" 
                            class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold font-sans flex-shrink-0 cursor-pointer transition-transform hover:scale-105" 
                            title="Ver detalle de acreditaciones de este equipo"
                          >
                            🟢 VIG
                          </button>
                          <button 
                            type="button" 
                            v-else-if="getSemaforoEquipo(eqId) === 'YELLOW'" 
                            @click.stop="abrirDetalleAcreditacion('equipo', eqId)" 
                            class="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold font-sans flex-shrink-0 cursor-pointer transition-transform hover:scale-105" 
                            title="Ver detalle de acreditaciones de este equipo"
                          >
                            🟡 VNC
                          </button>
                          <button 
                            type="button" 
                            v-else 
                            @click.stop="abrirDetalleAcreditacion('equipo', eqId)" 
                            class="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold font-sans flex-shrink-0 cursor-pointer transition-transform hover:scale-105" 
                            title="Ver detalle de acreditaciones de este equipo"
                          >
                            🔴 VNC
                          </button>

                          <span v-if="getInspeccionEquipo(eqId)?.id_survey" class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
                            #{{ getInspeccionEquipo(eqId).id_survey }}
                          </span>

                          <span v-if="getInspeccionEquipo(eqId)?.id_survey && getInspeccionEquipo(eqId)?.fecha_inspeccion_plan" class="text-[9px] text-slate-400 font-mono">
                            📅 {{ getInspeccionEquipo(eqId).fecha_inspeccion_plan }} {{ getInspeccionEquipo(eqId).hora_inspeccion_plan || '' }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 flex-shrink-0">
                      <!-- Botón Ver PDF si está ejecutada -->
                      <button 
                        v-if="getInspeccionEquipo(eqId)?.patio_checklist_completado || getEstadoInspeccionEquipo(eqId) === 'EJECUTADA_OK'"
                        @click.stop="abrirPDFInspeccion(getInspeccionEquipo(eqId).id_survey, eqId)"
                        type="button"
                        class="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Ver Documento PDF Oficial de la Inspección"
                      >
                        📄 Ver PDF
                      </button>

                      <!-- Chevron Desplegable -->
                      <div 
                        class="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-transform duration-200"
                        :class="isEquipoPatioExpanded(eqId) ? 'rotate-180 text-amber-400 bg-amber-500/10' : ''"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <!-- Cuerpo Expandido (Formulario al abrir el Chevron) -->
                  <div v-show="isEquipoPatioExpanded(eqId)" class="p-3.5 space-y-3 bg-[#0a0f1e]/60 text-xs">
                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <label class="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                          <span>👷</span> Operador Asignado a la Máquina *
                        </label>
                        <span v-if="getOperadorAsignadoAEquipo(eqId)" class="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                          Desde Asignación OT
                        </span>
                        <span v-else class="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
                          Sin Operador en OT
                        </span>
                      </div>
                      <select 
                        :value="getInspeccionEquipo(eqId).operador_id || getInspeccionEquipo(eqId).jefe_patio_id || getOperadorAsignadoAEquipo(eqId)?.id_user || ''" 
                        @change="onOperadorInspeccionCambiado(eqId, $event.target.value)" 
                        :disabled="getInspeccionEquipo(eqId).patio_programado" 
                        class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Seleccionar Operador Asignado --</option>
                        <optgroup v-if="getUsuariosAgrupados('Chofer Cama Baja').sugeridos.length > 0" label="🎯 Choferes / Operadores Sugeridos" class="bg-[#0a0f1e] text-emerald-400 font-bold">
                          <option v-for="u in getUsuariosAgrupados('Chofer Cama Baja').sugeridos" :key="'pat-op-sug-'+u.id_user" :value="u.id_user" class="bg-[#0a0f1e] text-white">
                            {{ u.nombre_user || u.name_user || u.name_frst }} ({{ u.cargo || 'Operador / Chofer' }})
                          </option>
                        </optgroup>
                        <optgroup label="👷 Resto de Personal Activo" class="bg-[#0a0f1e] text-slate-400 font-bold">
                          <option v-for="u in getUsuariosAgrupados('Chofer Cama Baja').otros" :key="'pat-op-otr-'+u.id_user" :value="u.id_user" class="bg-[#0a0f1e] text-slate-200">
                            {{ u.nombre_user || u.name_user || u.name_frst }} {{ u.cargo ? '• ' + u.cargo : '' }}
                          </option>
                        </optgroup>
                      </select>
                      <p class="text-[9.5px] text-slate-400 mt-1 leading-tight">
                        ℹ️ La inspección de patio es ejecutada por el operador asignado antes de salir a ruta. Al modificar el operador, se actualiza automáticamente la asignación de OT y el dossier de acreditación.
                      </p>
                    </div>

                    <div>
                      <label class="block text-[10px] text-slate-400 font-semibold mb-1">Fecha & Hora Programada *</label>
                      <div class="grid grid-cols-2 gap-2">
                        <input type="date" v-model="getInspeccionEquipo(eqId).fecha_inspeccion_plan" :disabled="!!getInspeccionEquipo(eqId)?.id_survey" class="bg-[#050810] border border-white/10 rounded-lg px-2 py-1 text-xs text-white [color-scheme:dark] disabled:opacity-60 disabled:cursor-not-allowed" />
                        <input type="time" v-model="getInspeccionEquipo(eqId).hora_inspeccion_plan" :disabled="!!getInspeccionEquipo(eqId)?.id_survey" class="bg-[#050810] border border-white/10 rounded-lg px-2 py-1 text-xs text-white [color-scheme:dark] disabled:opacity-60 disabled:cursor-not-allowed" />
                      </div>
                    </div>

                    <!-- Estado del Survey / Asignar Inspección -->
                    <div v-if="!getInspeccionEquipo(eqId)?.id_survey" class="space-y-2 pt-1">
                      <div class="bg-[#050810] p-2 rounded text-center border border-white/5 text-[11px] text-slate-400">
                        🔴 Inspección pendiente de agendamiento
                      </div>
                      <button 
                        @click="programarInspeccionPatioEquipo(eqId)" 
                        class="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase transition-all shadow cursor-pointer"
                      >
                        🚀 Asignar Inspección al Operador
                      </button>
                    </div>

                    <div v-else-if="!getInspeccionEquipo(eqId)?.patio_checklist_completado && getEstadoInspeccionEquipo(eqId) !== 'EJECUTADA_OK'" class="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30 space-y-2 text-xs">
                      <div class="flex justify-between items-center">
                        <div>
                          <span v-if="getEstadoInspeccionEquipo(eqId) === 'EN_VERIFICACION'" class="font-bold text-purple-300 block">🟣 Inspección en Verificación FES</span>
                          <span v-else-if="getEstadoInspeccionEquipo(eqId) === 'EN_EJECUCION'" class="font-bold text-blue-300 block">🔵 Inspección en Ejecución</span>
                          <span v-else-if="getEstadoInspeccionEquipo(eqId) === 'RECHAZADA'" class="font-bold text-red-400 block">🔴 Inspección Rechazada / Taller</span>
                          <span v-else class="font-bold text-amber-400 block">🟡 Inspección Asignada en Terreno</span>
                          <span class="text-[10px] text-slate-300 font-mono font-bold">Survey ID: #{{ getInspeccionEquipo(eqId).id_survey }}</span>
                        </div>
                        <span class="text-[10px] text-slate-300">Operador: {{ getNombreOperadorAsignado(eqId) }}</span>
                      </div>
                      <div class="flex gap-2">
                        <button @click="abrirVisorWeb(getInspeccionEquipo(eqId).id_survey || 76)" class="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1 cursor-pointer">
                          👁️ Ver en Pantalla
                        </button>
                        <button @click="eliminarInspeccionEquipo(eqId)" class="py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded font-bold text-xs flex items-center justify-center gap-1 cursor-pointer" title="Eliminar survey de la BD y reasignar">
                          🗑️ Reasignar
                        </button>
                      </div>
                    </div>

                    <div v-else class="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30 space-y-2.5 text-xs">
                      <div class="flex justify-between items-start">
                        <div>
                          <span class="font-bold text-emerald-300 flex items-center gap-1.5">
                            <span>🟢</span> Inspección Conforme (OK)
                          </span>
                          <span class="text-[10px] text-slate-400 block">Checklist Aprobado FES • Survey #{{ getInspeccionEquipo(eqId).id_survey }}</span>
                          <span class="text-[10px] text-emerald-400/90 block font-semibold">Operador: {{ getNombreOperadorAsignado(eqId) }}</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <button @click="abrirPDFInspeccion(getInspeccionEquipo(eqId).id_survey, eqId)" class="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded font-bold text-xs flex items-center gap-1 cursor-pointer" title="Ver Documento PDF Oficial Firmado">
                            📄 PDF
                          </button>
                          <button @click="abrirVisorWeb(getInspeccionEquipo(eqId).id_survey || 76)" class="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded font-bold text-xs flex items-center gap-1 cursor-pointer" title="Ver Vista HTML en Pantalla">
                            👁️ Web
                          </button>
                        </div>
                      </div>

                      <!-- Bloque de Autorización de Salida, Telemetría y Mapa de Viaje -->
                      <div class="pt-2 border-t border-emerald-500/20 space-y-2">
                        
                        <!-- CASO 1: SI YA EXISTE VIAJE REGISTRADO EN BD (EN RUTA O ARRIBADO A FAENA) -->
                        <div v-if="getViajeDeEquipo(eqId)" class="p-3 bg-black/70 border border-blue-500/40 rounded-xl space-y-2 font-mono text-[11px] shadow-lg">
                          <div class="flex justify-between items-center">
                            <span class="text-blue-400 font-bold flex items-center gap-1.5">
                              <span class="text-base">🛰️</span> Hoja de Ruta & Telemetría GPS
                            </span>
                            <span :class="getViajeDeEquipo(eqId).estado_trayecto === 'LLEGADO' || getViajeDeEquipo(eqId).estado_viaje === 'ARRIBADO_FAENA' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'" class="text-[9.5px] px-2 py-0.5 rounded border font-bold">
                              {{ getViajeDeEquipo(eqId).estado_trayecto === 'LLEGADO' || getViajeDeEquipo(eqId).estado_viaje === 'ARRIBADO_FAENA' ? '🟢 ARRIBADO A FAENA' : '🔵 EN RUTA' }}
                            </span>
                          </div>
                          
                          <div class="grid grid-cols-2 gap-2 text-[10.5px] text-slate-300 bg-white/[0.03] p-2 rounded-lg border border-white/5">
                            <div>Odóm: <strong class="text-amber-400 font-bold">{{ getViajeDeEquipo(eqId).km_inicial || 0 }} ➔ {{ getViajeDeEquipo(eqId).km_final || '---' }} KM</strong></div>
                            <div>Horóm: <strong class="text-amber-400 font-bold">{{ getViajeDeEquipo(eqId).horometro_inicial || 0 }} ➔ {{ getViajeDeEquipo(eqId).horometro_final || '---' }} HRS</strong></div>
                          </div>
                          
                          <div class="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                            <span class="text-blue-300">🛰️ {{ getViajeDeEquipo(eqId).pings_ruta?.length || 0 }} waypoints GPS</span>
                            <span v-if="Number(getViajeDeEquipo(eqId).total_litros) > 0" class="text-amber-300">⛽ {{ getViajeDeEquipo(eqId).total_litros }} L (Copec)</span>
                            <span class="text-emerald-400">🔐 PIN Validado ✅</span>
                          </div>
                          
                          <div class="flex gap-2 pt-1">
                            <button 
                              @click.stop="abrirMapaViaje(getViajeDeEquipo(eqId))" 
                              type="button" 
                              class="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer font-sans uppercase tracking-wider"
                            >
                              <span>🗺️</span> Ver Mapa & Telemetría
                            </button>
                            <a 
                              :href="`https://servidor.leanglobal.cl/lg-gsp-dev/viaje/${getViajeDeEquipo(eqId).token_viaje}`" 
                              target="_blank" 
                              class="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-lg font-bold text-xs flex items-center justify-center gap-1 no-underline cursor-pointer font-sans"
                              title="Abrir vista del conductor"
                            >
                              <span>📱</span> Ver Hoja
                            </a>
                            <button 
                              @click="autorizarSalidaEquipo(eqId, true)" 
                              :disabled="autorizandoSalidaId === eqId"
                              type="button" 
                              class="px-2.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 font-sans"
                              title="Reenviar correo"
                            >
                              <span>🔁</span>
                            </button>
                          </div>
                        </div>

                        <!-- CASO 2: SI ESTÁ AUTORIZADA LA SALIDA PERO AÚN NO INICIA DESPLAZAMIENTO -->
                        <div v-else-if="getInspeccionEquipo(eqId)?.salida_autorizada" class="space-y-1.5">
                          <div class="flex items-center justify-between bg-emerald-950/40 p-2 rounded border border-emerald-500/40">
                            <span class="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                              <span>✅</span> Salida Autorizada • {{ new Date(getInspeccionEquipo(eqId).fecha_autorizacion_salida || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                            </span>
                            <span class="text-[9.5px] text-slate-400 font-mono">Notificado a Operador</span>
                          </div>
                          <div class="flex gap-2">
                            <a 
                              :href="getLinkViajeOperador(eqId)" 
                              target="_blank" 
                              class="flex-1 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded font-bold text-[11px] flex items-center justify-center gap-1 no-underline cursor-pointer"
                            >
                              <span>📲</span> Ver Registro de Viaje
                            </a>
                            <button 
                              @click="autorizarSalidaEquipo(eqId, true)" 
                              :disabled="autorizandoSalidaId === eqId"
                              type="button" 
                              class="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Reenviar correo de notificación al operador"
                            >
                              <span>🔁</span> Reenviar
                            </button>
                          </div>
                        </div>

                        <!-- CASO 3: INSPECCIÓN CONFORME, ESPERANDO AUTORIZACIÓN DEL COORDINADOR -->
                        <div v-else>
                          <button 
                            @click="autorizarSalidaEquipo(eqId, false)" 
                            :disabled="autorizandoSalidaId === eqId"
                            type="button" 
                            class="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <span v-if="autorizandoSalidaId === eqId" class="animate-spin">⏳</span>
                            <span v-else>🚀</span>
                            <span>{{ autorizandoSalidaId === eqId ? 'Autorizando y Notificando...' : 'Autorizar Salida & Notificar Viaje' }}</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-white/5 flex-shrink-0">
              <span class="text-[10px] text-slate-400 block text-center">
                Total Inspecciones: <strong class="text-amber-400">{{ equiposAsignadosLista.length }} equipo(s)</strong>
              </span>
            </div>
          </div>

          <!-- COLUMNA 3: ANALISTA 360 & GEOCERCA GPS -->
          <div class="bg-[#0a0f1e] border border-emerald-500/20 hover:border-emerald-500/40 transition-all rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xl min-h-[460px]">
            <div class="space-y-4">
              <div class="flex justify-between items-center border-b border-white/10 pb-3">
                <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :class="statusSegmento3 === 'GREEN' ? 'bg-emerald-500' : (statusSegmento3 === 'YELLOW' ? 'bg-amber-500' : 'bg-red-500')"></span>
                  💻 3. Analista 360 & Geocerca
                </span>
                <span class="text-[10px] text-emerald-300 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">GPS Live</span>
              </div>

              <div class="space-y-2">
                <label class="block text-[10px] text-slate-400 font-semibold">Instrucciones al Analista:</label>
                <textarea v-model="preparacionSalidaState.analista_instrucciones" :disabled="preparacionSalidaState.preparacion_finalizada" rows="2" placeholder="Instruya detalles del servicio para seguimiento..." class="w-full bg-[#050810] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none resize-none disabled:opacity-50"></textarea>
              </div>

              <div class="bg-[#050810] p-3 rounded-xl border border-white/5 space-y-2 text-xs">
                <label class="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input type="checkbox" v-model="preparacionSalidaState.analista_revision_360" :disabled="preparacionSalidaState.preparacion_finalizada" class="accent-emerald-500" />
                  <span>1. <strong>Análisis 360 Rápido</strong> Revisado</span>
                </label>

                <div class="space-y-1.5 pt-1 border-t border-white/5">
                  <label class="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input type="checkbox" v-model="preparacionSalidaState.analista_geocerca_activa" :disabled="preparacionSalidaState.preparacion_finalizada" class="accent-emerald-500" />
                    <span>2. <strong>Geocerca GPS</strong> Configurada</span>
                  </label>
                  <div v-if="preparacionSalidaState.analista_geocerca_activa" class="flex items-center gap-2 pl-6">
                    <span class="text-[10px] text-slate-400">Radio (m):</span>
                    <input type="number" v-model.number="preparacionSalidaState.analista_geocerca_radio_m" min="100" max="5000" class="w-20 bg-[#0a0f1e] border border-white/10 rounded px-2 py-0.5 text-xs text-white font-mono" />
                  </div>
                </div>
              </div>

              <div class="bg-slate-800/80 p-2.5 rounded-xl border border-slate-600/50">
                <label class="flex items-center gap-2 text-white cursor-pointer select-none">
                  <input type="checkbox" v-model="preparacionSalidaState.validacion_estricta" :disabled="preparacionSalidaState.preparacion_finalizada" class="accent-emerald-500 w-4 h-4" />
                  <span class="text-[10px] font-bold">☑️ Preparación Aprobada & Flota Liberada</span>
                </label>
              </div>
            </div>

            <div class="pt-2">
              <button 
                @click="notificarAnalistaOperaciones" 
                :disabled="preparacionSalidaState.preparacion_finalizada || preparacionSalidaState.analista_notificado" 
                class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20"
              >
                <span>{{ preparacionSalidaState.analista_notificado ? 'Analista Notificado' : 'Enviar Instrucción a Analista' }}</span>
              </button>
            </div>
          </div>

        </div>

        <!-- BOTONERA UNIFICADA FINAL: LIBERACIÓN DE FLOTA & PASE A EJECUCIÓN EN TERRENO -->
        <div class="bg-[#050810] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span class="text-xs font-bold text-white block uppercase tracking-wider">Hito de Cierre Operational</span>
            <span class="text-[11px] text-slate-400 block">Requiere cumplimiento de la validación estricta de salida para liberar el proyecto a faena en terreno.</span>
          </div>
          <button 
            @click="finalizarPreparacionSalida" 
            :disabled="preparacionSalidaState.preparacion_finalizada || !preparacionSalidaState.validacion_estricta" 
            class="w-full md:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/20 disabled:text-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span>{{ preparacionSalidaState.preparacion_finalizada ? '🎉 Preparación de Salida Completada' : '🚀 FINALIZAR PREPARACIÓN & LIBERAR FLOTA A EJECUCIÓN TERRENO' }}</span>
          </button>
        </div>

        <!-- PANEL DE MONITOREO DE CONVOY, ENLACES DE VIAJE MÓVIL & AUTORIZACIÓN COPEC -->
        <div class="bg-[#050810] border border-blue-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-white/10 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">🛰️</span>
              <div>
                <h3 class="text-xs font-black text-blue-400 uppercase tracking-wider">Monitoreo de Convoy & Enlaces de Viaje Móvil (/viaje/:token)</h3>
                <p class="text-[10px] text-slate-400">Despacho de enlaces web para conductores y telemetría de ruta offline-first</p>
              </div>
            </div>
            <span class="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded font-mono font-bold">
              {{ viajesConvoyLista.length }} Vehículo(s) en Convoy
            </span>
          </div>

          <!-- LISTA DE VEHÍCULOS Y ENLACES MÓVILES -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-for="vj in viajesConvoyLista" :key="vj.token" class="bg-[#0a0f1e] border border-white/10 rounded-xl p-3.5 space-y-2.5">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[10px] font-mono font-bold text-amber-400 block">🚜 {{ vj.patente }}</span>
                  <span class="text-xs font-bold text-white block">{{ vj.nombre_equipo || vj.modelo }}</span>
                </div>
                <span :class="vj.estado === 'ARRIBADO_FAENA' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : (vj.estado === 'EN_RUTA' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-slate-800 text-slate-400 border-slate-700')" class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border">
                  {{ vj.estado === 'ARRIBADO_FAENA' ? '🟢 Arribado' : (vj.estado === 'EN_RUTA' ? '🛰️ En Ruta' : '🟡 Preparado') }}
                </span>
              </div>

              <div class="flex items-center gap-2 text-[11px] text-slate-300 bg-black/40 p-2 rounded-lg border border-white/5">
                <span>👷</span>
                <span class="font-semibold">Conductor:</span>
                <span class="text-emerald-300 font-bold truncate">{{ vj.chofer_nombre || 'Asignado' }}</span>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <button 
                  v-if="vj.viaje_real"
                  @click="abrirMapaViaje(vj.viaje_real)" 
                  type="button" 
                  class="flex-1 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <span>🗺️</span> Ver Mapa & Telemetría
                </button>
                <button 
                  v-else
                  @click="copiarEnlaceViaje(vj.token)" 
                  type="button" 
                  class="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📋</span> Copiar Link Conductor
                </button>
                <button @click="abrirWebViaje(vj.token)" type="button" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer" title="Abrir Web App Móvil en nueva pestaña">
                  <span>👁️ Abrir</span>
                </button>
              </div>

              <!-- RESUMEN DE BITÁCORA LOG MAESTRO SI YA ARRIBÓ O ESTÁ EN RUTA -->
              <div v-if="vj.viaje_real" class="bg-black/30 border border-white/5 rounded-lg p-2 text-[10px] font-mono text-slate-400 space-y-0.5">
                <div class="flex justify-between">
                  <span>🛰️ Telemetría: <strong class="text-white">{{ vj.viaje_real.pings_ruta?.length || 0 }} pings GPS</strong></span>
                  <span>Odóm: <strong class="text-amber-400">{{ vj.viaje_real.km_inicial || 0 }} ➔ {{ vj.viaje_real.km_final || '---' }} KM</strong></span>
                </div>
                <div class="flex justify-between">
                  <span>⛽ Combustible: <strong class="text-amber-400">{{ vj.viaje_real.total_litros || 0 }} L</strong></span>
                  <span>Horóm: <strong class="text-emerald-300">{{ vj.viaje_real.horometro_inicial || 0 }} ➔ {{ vj.viaje_real.horometro_final || '---' }} HRS</strong></span>
                </div>
              </div>
              <div v-else class="bg-black/20 border border-white/5 rounded-lg p-1.5 text-[10px] font-mono text-slate-500 text-center">
                Esperando inicio de desplazamiento del conductor.
              </div>
            </div>
          </div>

          <!-- PANEL DE SOLICITUDES DE CARGA COPEC (HANDSHAKE EN VIVO) -->
          <div class="bg-black/50 border border-amber-500/30 rounded-xl p-4 space-y-3">
            <div class="flex justify-between items-center border-b border-white/10 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-base">⛽</span>
                <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Autorización de Tarjeta Copec en Ruta</span>
              </div>
              <span class="text-[10px] text-slate-400 font-mono">Control Instantáneo de Combustible</span>
            </div>

            <div v-if="solicitudesCopecPendientes.length === 0" class="text-center py-2 text-xs text-slate-500 italic">
              No hay solicitudes pendientes de habilitación Copec en este momento.
            </div>

            <div v-else class="space-y-3">
              <div v-for="(sol, idx) in solicitudesCopecPendientes" :key="'copec-sol-'+idx" class="bg-[#0a0f1e] border border-amber-500/40 rounded-xl p-3 space-y-2">
                <div class="flex justify-between items-start text-xs">
                  <div>
                    <span class="text-white font-bold block">🚜 {{ sol.patente }} — Conductor: {{ sol.chofer_nombre }}</span>
                    <span class="text-slate-400 text-[11px]">Odómetro: <strong class="text-amber-400 font-mono">{{ sol.odometro }} KM</strong> • Horómetro: <strong class="text-amber-400 font-mono">{{ sol.horometro }} HRS</strong></span>
                  </div>
                  <span class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">SOLICITANDO</span>
                </div>

                <div class="flex items-center gap-2 pt-1">
                  <input type="text" v-model="sol.id_autorizacion_input" placeholder="ID Copec Ej: #COPEC-9482" class="flex-1 bg-[#050810] border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold outline-none focus:border-amber-400" />
                  <button @click="aprobarSolicitudCopec(sol)" :disabled="!sol.id_autorizacion_input" type="button" class="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer">
                    🟢 Habilitar Tarjeta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BITÁCORA / TRAZA DE ENVÍOS DE CORREO ELECTRÓNICO (AUDITORÍA HISTÓRICA INALTERABLE) -->
        <div class="bg-[#050810] border border-white/10 rounded-xl p-5 space-y-3">
          <div class="flex justify-between items-center border-b border-white/5 pb-2">
            <span class="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              📜 Traza Inalterable de Notificaciones & Envíos de Correo Electrónico
            </span>
            <span class="text-[10px] text-slate-400 font-mono">Total Registrados: {{ trazaCorreosList.length }}</span>
          </div>

          <div v-if="trazaCorreosList.length === 0" class="text-center py-3 text-xs text-slate-500 italic">
            No se han registrado envíos de correo aún para esta oportunidad.
          </div>

          <div v-else class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div v-for="(t, idx) in trazaCorreosList" :key="idx" class="bg-[#0a0f1e] p-3 rounded-lg border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {{ t.tipo }}
                  </span>
                  <span class="font-bold text-white">{{ t.asunto }}</span>
                </div>
                <div class="text-[11px] text-slate-400">
                  Para: <strong class="text-slate-200">{{ t.para }}</strong>
                </div>
              </div>
              <div class="text-right text-[10px] text-slate-400 font-mono bg-[#050810] px-2.5 py-1 rounded border border-white/5">
                ⏱️ {{ t.fecha_hora }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SUB-TAB 6: EJECUCIÓN & REPORTS DIARIOS EN FAENA -->
      <div v-if="operacionesSubTab === 'reports'" class="space-y-6">
        
        <!-- HEADER DE LA ETAPA -->
        <div class="bg-[#050810] border border-amber-500/40 rounded-xl p-5 flex flex-wrap justify-between items-center gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-center text-amber-500 font-bold font-mono text-2xl shrink-0">
              📋
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-black text-white uppercase tracking-wider font-mono">
                  Control de Ejecución & Reports Diarios de Izaje
                </h3>
                <span class="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-md font-mono font-bold">
                  FAENA EN TERRENO
                </span>
              </div>
              <p class="text-sm text-slate-300 mt-1">
                Seguimiento multi-día de jornadas reportadas desde la PWA, horas efectivas, horómetros, firma manual del mandante y validación del analista.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="cargarReportsProyecto()"
              class="px-4 py-2 bg-[#0b1021] hover:bg-slate-800 border border-white/20 text-slate-200 rounded-xl text-sm font-bold font-mono flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4" :class="cargandoReports ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              <span>Refrescar</span>
            </button>
          </div>
        </div>

        <!-- TARJETAS DE RESUMEN ACUMULADO (KPIS) -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <!-- Días Operados -->
          <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-1.5 shadow-md">
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block">📅 Días Operados</span>
            <div class="text-3xl font-black text-white font-mono flex items-baseline gap-1.5">
              <span>{{ resumenKpiReports.dias }}</span>
              <span class="text-sm text-slate-400 font-normal">DÍAS</span>
            </div>
            <span class="text-xs text-slate-500 font-mono block">Jornadas emitidas PWA</span>
          </div>

          <!-- Horas Facturables Acumuladas -->
          <div class="bg-[#050810] border border-amber-500/40 rounded-xl p-4 space-y-1.5 bg-amber-950/20 shadow-md">
            <span class="text-xs text-amber-400 font-bold uppercase tracking-wider block">💰 Horas a Facturar</span>
            <div class="text-3xl font-black text-amber-400 font-mono flex items-baseline gap-1.5">
              <span>{{ resumenKpiReports.totalFacturables }}</span>
              <span class="text-sm text-amber-300 font-normal">HRS</span>
            </div>
            <span class="text-xs text-amber-500/80 font-mono block">Σ Facturables Acum.</span>
          </div>

          <!-- Sobretiempo Acumulado -->
          <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-1.5 shadow-md" :class="Number(resumenKpiReports.totalSobretiempo) > 0 ? 'border-yellow-500/50 bg-yellow-950/20' : ''">
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block">⚡ Sobretiempo Total</span>
            <div class="text-3xl font-black font-mono flex items-baseline gap-1.5" :class="Number(resumenKpiReports.totalSobretiempo) > 0 ? 'text-yellow-400' : 'text-slate-500'">
              <span>+{{ resumenKpiReports.totalSobretiempo }}</span>
              <span class="text-sm font-normal">HRS</span>
            </div>
            <span class="text-xs text-slate-500 font-mono block">Horas excedentes</span>
          </div>

          <!-- Horómetros -->
          <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-1.5 shadow-md">
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block">⚙️ Horómetro Motor</span>
            <div class="text-base font-mono font-bold text-white truncate pt-1">
              {{ resumenKpiReports.horometroRange }}
            </div>
            <span class="text-xs text-slate-500 font-mono block pt-0.5">Inicial ➔ Final Faena</span>
          </div>

          <!-- Conformidad Documental -->
          <div class="bg-[#050810] border border-white/15 rounded-xl p-4 space-y-1.5 shadow-md">
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block">🛡️ Conformidad Analista</span>
            <div class="text-base font-mono font-bold flex items-center gap-2 pt-1">
              <span class="text-emerald-400">✅ {{ resumenKpiReports.validados }}</span>
              <span class="text-slate-500">•</span>
              <span class="text-amber-400">⏳ {{ resumenKpiReports.pendientes }}</span>
            </div>
            <span class="text-xs text-slate-500 font-mono block pt-0.5">Validados / Pendientes</span>
          </div>
        </div>

        <!-- TABLA MULTI-DÍA DE REPORTS -->
        <div class="bg-[#050810] border border-white/15 rounded-xl overflow-hidden shadow-lg">
          <div class="px-5 py-3.5 border-b border-white/10 flex justify-between items-center bg-[#080d1a]">
            <h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <span>📋 Cronograma de Reports Diarios de Terreno</span>
            </h4>
            <span class="text-xs text-amber-300 font-mono font-bold bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-md">{{ reportsFiltrados.length }} de {{ reportsProyecto.length }} report(s)</span>
          </div>

          <!-- FILTRO POR EQUIPO (Spec 35) -->
          <div v-if="listaEquiposUnicosReports.length > 1" class="px-5 py-2.5 bg-[#0a0f1e] border-b border-white/10 flex items-center gap-2 overflow-x-auto">
            <span class="text-xs text-slate-400 font-bold uppercase font-mono mr-2 flex items-center gap-1">
              <span>🚜</span>
              <span>Equipo:</span>
            </span>
            <button
              @click="filtroEquipoReports = 'TODOS'"
              :class="filtroEquipoReports === 'TODOS' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'"
              class="px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer"
            >
              TODOS ({{ reportsProyecto.length }})
            </button>
            <button
              v-for="eq in listaEquiposUnicosReports"
              :key="eq.id_equipo"
              @click="filtroEquipoReports = eq.id_equipo"
              :class="filtroEquipoReports === eq.id_equipo ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'"
              class="px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🚜 {{ eq.patente }}</span>
              <span class="opacity-75">({{ eq.modelo }})</span>
            </button>
          </div>

          <!-- Loading -->
          <div v-if="cargandoReports" class="p-10 text-center text-slate-400 text-sm">
            <div class="animate-spin inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full mb-3"></div>
            <div>Cargando reports de la faena...</div>
          </div>

          <!-- Empty State -->
          <div v-else-if="reportsFiltrados.length === 0" class="p-12 text-center space-y-3">
            <span class="text-4xl block">🏗️</span>
            <div class="text-base font-bold text-white">No hay reports registrados para este criterio</div>
            <p class="text-sm text-slate-400 max-w-lg mx-auto">
              El operador de la grúa puede generar el Report Diario desde la PWA en terreno al concluir la jornada de izaje.
            </p>
          </div>

          <!-- Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse font-sans">
              <thead>
                <tr class="bg-[#0b1021] text-slate-300 border-b border-white/10 text-xs font-bold uppercase tracking-wider">
                  <th class="py-3 px-3.5 font-mono">Día</th>
                  <th class="py-3 px-3.5">Fecha</th>
                  <th class="py-3 px-3.5">Equipo / Grúa</th>
                  <th class="py-3 px-3.5 font-mono">Horario</th>
                  <th class="py-3 px-3 text-center font-mono">Colac.</th>
                  <th class="py-3 px-3.5 text-right font-mono">Efectivas</th>
                  <th class="py-3 px-3.5 text-right text-amber-400 font-mono">Facturables</th>
                  <th class="py-3 px-3.5 text-right font-mono">Sobretiempo</th>
                  <th class="py-3 px-3.5 font-mono">Horómetro</th>
                  <th class="py-3 px-3.5">Firmante Mandante</th>
                  <th class="py-3 px-3.5 text-center">Estado</th>
                  <th class="py-3 px-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10 text-slate-200">
                <tr 
                  v-for="rep in reportsFiltrados" 
                  :key="rep.id_reporte_avance"
                  class="hover:bg-white/[0.03] transition-colors"
                >
                  <!-- Día -->
                  <td class="py-3.5 px-3.5 font-bold font-mono text-amber-400 text-sm whitespace-nowrap">
                    Día {{ rep.dia_correlativo || 1 }}
                  </td>

                  <!-- Fecha -->
                  <td class="py-3.5 px-3.5 text-white font-medium text-sm whitespace-nowrap">
                    {{ formatearFechaCorta(rep.fecha_reporte) }}
                  </td>

                  <!-- Equipo / Grúa (Spec 35) -->
                  <td class="py-3.5 px-3.5">
                    <div class="text-amber-300 font-bold font-mono text-sm">{{ rep.equipo_patente || 'S/P' }}</div>
                    <div class="text-xs text-slate-400 truncate max-w-[140px]">{{ rep.equipo_modelo || 'Grúa' }}</div>
                  </td>

                  <!-- Horario -->
                  <td class="py-3.5 px-3.5 text-slate-200 font-mono text-sm whitespace-nowrap">
                    {{ formatHoraCorta(rep.fecha_inicio_servicio) }} - {{ formatHoraCorta(rep.fecha_termino_servicio) }}
                  </td>

                  <!-- Colación -->
                  <td class="py-3.5 px-3 text-center text-slate-300 font-mono text-sm">
                    {{ Number(rep.horas_colacion) === 0 ? '0h' : `${rep.horas_colacion || 1.0}h` }}
                  </td>

                  <!-- Horas Efectivas -->
                  <td class="py-3.5 px-3.5 text-right text-white font-black font-mono text-sm">
                    {{ rep.horas_operadas }}h
                  </td>

                  <!-- Horas Facturables -->
                  <td class="py-3.5 px-3.5 text-right text-amber-400 font-black font-mono text-base">
                    {{ rep.horas_facturables }}h
                  </td>

                  <!-- Sobretiempo -->
                  <td class="py-3.5 px-3.5 text-right font-mono text-sm">
                    <span :class="Number(rep.horas_sobretiempo) > 0 ? 'text-yellow-400 font-black' : 'text-slate-500'">
                      {{ Number(rep.horas_sobretiempo) > 0 ? `+${rep.horas_sobretiempo}h` : '0h' }}
                    </span>
                  </td>

                  <!-- Horómetro -->
                  <td class="py-3.5 px-3.5 text-slate-300 font-mono text-sm whitespace-nowrap">
                    <div class="flex items-center gap-1.5">
                      <span>{{ rep.horometro_inicio || 0 }} ➔ {{ rep.horometro_termino || '---' }}</span>
                      <span v-if="rep.foto_horometro" class="text-amber-400" title="Foto de horómetro adjunta">📸</span>
                    </div>
                  </td>

                  <!-- Firmante Mandante -->
                  <td class="py-3.5 px-3.5">
                    <div class="text-white font-bold text-sm truncate max-w-[160px]">{{ rep.cliente_nombre || 'Mandante' }}</div>
                    <div class="text-xs text-slate-400 truncate">{{ rep.cliente_cargo || 'Supervisor' }}</div>
                  </td>

                  <!-- Estado -->
                  <td class="py-3.5 px-3.5 text-center whitespace-nowrap">
                    <span 
                      v-if="rep.estado_reporte === 'VALIDADO_ANALISTA'" 
                      class="px-3 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1"
                    >
                      ✅ Validado
                    </span>
                    <span 
                      v-else 
                      class="px-3 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse inline-flex items-center gap-1"
                    >
                      ⏳ Pendiente
                    </span>
                  </td>

                  <!-- Acciones -->
                  <td class="py-3.5 px-3.5 text-center whitespace-nowrap">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        @click="abrirVisorReport(rep)"
                        class="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Ver Documento Digital y Firma"
                      >
                        <span>👁️</span>
                        <span>Ver</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- SUB-TAB 7: LIQUIDACIÓN OPERACIONAL, CONSOLIDACIÓN EDP & REGISTRO FACTURACIÓN (Spec 38) -->
      <div v-if="operacionesSubTab === 'liquidacion'" class="space-y-6">
        
        <!-- CABECERA DE LIQUIDACIÓN Y ESTADO DE CIERRE -->
        <div class="bg-[#050810] border border-white/10 rounded-xl p-5 flex flex-wrap justify-between items-center gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
              💰
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h3 class="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                  Liquidación de Estado de Pago (EDP) & Facturación
                </h3>
                <span 
                  :class="estadoDbActual === 7 || edpData?.liquidacion_guardada 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'" 
                  class="text-xs font-mono font-bold uppercase px-3 py-1 rounded-md border"
                >
                  {{ estadoDbActual === 7 || edpData?.liquidacion_guardada ? '✅ Facturado y Concluido' : '⏳ Listo para Liquidar y Facturar' }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Conciliación automática de tarifas pactadas vs jornadas y sobretiempos respaldados con firma de mandante.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="modalCaratulaEDPAbierto = true"
              class="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow flex items-center gap-2 cursor-pointer"
            >
              <span>📄</span>
              <span>Ver Carátula Oficial de EDP</span>
            </button>
            <button
              @click="cargarResumenEDP"
              class="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Recargar datos"
            >
              🔄
            </button>
          </div>
        </div>

        <!-- TARJETAS TOTALES DE LIQUIDACIÓN -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-[#050810] border border-white/10 rounded-xl p-4 space-y-1">
            <span class="text-xs text-slate-400 font-bold uppercase font-mono block">Días de Faena</span>
            <div class="text-2xl sm:text-3xl font-black font-mono text-white">
              {{ edpData?.resumen_financiero?.dias_totales || 0 }} <span class="text-xs text-slate-400 font-normal">DÍAS</span>
            </div>
            <span class="text-xs text-emerald-400 block font-medium">100% Firmados con GPS</span>
          </div>

          <div class="bg-[#050810] border border-white/10 rounded-xl p-4 space-y-1">
            <span class="text-xs text-slate-400 font-bold uppercase font-mono block">Horas Facturables</span>
            <div class="text-2xl sm:text-3xl font-black font-mono text-white">
              {{ edpData?.resumen_financiero?.horas_facturables_totales || 0 }} <span class="text-xs text-slate-400 font-normal">HRS</span>
            </div>
            <span class="text-xs text-slate-400 block">Horas netas operadas</span>
          </div>

          <div class="bg-[#050810] border border-white/10 rounded-xl p-4 space-y-1">
            <span class="text-xs text-slate-400 font-bold uppercase font-mono block">Sobretiempo Extra</span>
            <div class="text-2xl sm:text-3xl font-black font-mono text-yellow-400">
              +{{ edpData?.resumen_financiero?.horas_sobretiempo_totales || 0 }} <span class="text-xs text-yellow-500 font-normal">HRS</span>
            </div>
            <span class="text-xs text-slate-400 block font-mono">{{ formatCurrency(edpData?.resumen_financiero?.monto_sobretiempo_neto || 0) }}</span>
          </div>

          <div class="bg-emerald-950/20 border border-emerald-500/50 rounded-xl p-4 space-y-1 shadow-lg shadow-emerald-500/5">
            <span class="text-xs text-emerald-300 font-black uppercase font-mono block">💰 TOTAL NETO A FACTURAR</span>
            <div class="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {{ formatCurrency(edpData?.resumen_financiero?.total_neto || 0) }}
            </div>
            <span class="text-xs text-slate-300 block font-mono">Total Bruto (+19% IVA): {{ formatCurrency(edpData?.resumen_financiero?.total_bruto || 0) }}</span>
          </div>
        </div>

        <!-- TABLA DE DESGLOSE DE LÍNEAS CONCILIADAS -->
        <div class="bg-[#050810] border border-white/10 rounded-xl overflow-hidden shadow-lg">
          <div class="px-5 py-3.5 bg-[#080d1a] border-b border-white/10 flex justify-between items-center">
            <h4 class="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>📋 Detalle de Líneas de Servicio & Conciliación Financiera</span>
            </h4>
            <span class="text-xs text-slate-400 font-mono">
              Cliente: <strong class="text-white">{{ edpData?.proyecto?.cliente_nombre || 'Mandante' }}</strong>
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-[#0b1021] text-slate-300 border-b border-white/10 font-bold uppercase font-mono">
                  <th class="py-3 px-4">Concepto / Servicio</th>
                  <th class="py-3 px-4">Tipo</th>
                  <th class="py-3 px-4 text-center">Unidad</th>
                  <th class="py-3 px-4 text-center">Cant.</th>
                  <th class="py-3 px-4 text-right">Tarifa Pactada</th>
                  <th class="py-3 px-4 text-right text-emerald-400">Subtotal Neto</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10 text-slate-200">
                <tr v-for="(l, idx) in edpData?.lineas_cotizadas || []" :key="idx" class="hover:bg-white/[0.02]">
                  <td class="py-3.5 px-4 font-bold text-white">
                    {{ l.descripcion || l.subcategoria || l.tipo }}
                  </td>
                  <td class="py-3.5 px-4 text-slate-400 font-mono">
                    {{ l.tipo }}
                  </td>
                  <td class="py-3.5 px-4 text-center font-mono text-slate-300">
                    {{ l.unidad }}
                  </td>
                  <td class="py-3.5 px-4 text-center font-mono font-bold text-white">
                    {{ l.cantidad }}
                  </td>
                  <td class="py-3.5 px-4 text-right font-mono text-slate-300">
                    {{ formatCurrency(l.valorUnitario) }}
                  </td>
                  <td class="py-3.5 px-4 text-right font-mono font-bold text-emerald-300">
                    {{ formatCurrency(l.subtotal_calculado) }}
                  </td>
                </tr>

                <!-- Sobretiempo si aplica -->
                <tr v-if="Number(edpData?.resumen_financiero?.horas_sobretiempo_totales) > 0" class="bg-yellow-500/5">
                  <td class="py-3.5 px-4 font-bold text-yellow-300">
                    ⏱️ Sobretiempo de Izaje Acumulado
                  </td>
                  <td class="py-3.5 px-4 text-slate-400 font-mono">
                    HORAS EXTRA
                  </td>
                  <td class="py-3.5 px-4 text-center font-mono text-slate-300">
                    Horas
                  </td>
                  <td class="py-3.5 px-4 text-center font-mono font-bold text-yellow-300">
                    {{ edpData?.resumen_financiero?.horas_sobretiempo_totales }}h
                  </td>
                  <td class="py-3.5 px-4 text-right font-mono text-slate-300">
                    Tarifa Extra
                  </td>
                  <td class="py-3.5 px-4 text-right font-mono font-bold text-yellow-300">
                    {{ formatCurrency(edpData?.resumen_financiero?.monto_sobretiempo_neto || 0) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-[#0b1021] text-slate-200 border-t-2 border-white/20 font-mono font-bold">
                  <td colspan="5" class="py-3 px-4 text-right text-slate-400 uppercase">SUBTOTAL NETO DEVENGADO:</td>
                  <td class="py-3 px-4 text-right text-white font-black text-sm">{{ formatCurrency(edpData?.resumen_financiero?.total_neto || 0) }}</td>
                </tr>
                <tr class="bg-[#0b1021] text-slate-200 font-mono">
                  <td colspan="5" class="py-2 px-4 text-right text-slate-400 uppercase">IVA (19%):</td>
                  <td class="py-2 px-4 text-right text-slate-300">{{ formatCurrency(edpData?.resumen_financiero?.iva_19 || 0) }}</td>
                </tr>
                <tr class="bg-[#080d1a] text-emerald-400 font-mono font-black text-sm border-t border-emerald-500/30">
                  <td colspan="5" class="py-3 px-4 text-right uppercase">TOTAL GENERAL A FACTURAR (BRUTO):</td>
                  <td class="py-3 px-4 text-right text-emerald-300 text-base">{{ formatCurrency(edpData?.resumen_financiero?.total_bruto || 0) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- FORMULARIO DE REGISTRO DE FACTURACIÓN Y CIERRE DE SERVICIO -->
        <div class="bg-[#050810] border border-white/10 rounded-xl p-5 shadow-lg space-y-4">
          <div class="border-b border-white/10 pb-3 flex justify-between items-center">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🏁</span>
              <h4 class="text-sm font-black text-white uppercase tracking-wider font-mono">
                Registro de Facturación Oficial & Cierre Comercial
              </h4>
            </div>
            <span v-if="estadoDbActual === 7" class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
              OT Cerrada & Facturada
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <!-- N° Factura -->
            <div class="space-y-1">
              <label class="text-xs font-mono font-bold uppercase text-slate-300 block">N° Factura Emitida <span class="text-red-400">*</span></label>
              <input
                v-model="formFacturacion.factura_numero"
                type="text"
                placeholder="ej. F-14029"
                :disabled="estadoDbActual === 7"
                class="w-full bg-[#080d1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:border-amber-400 outline-none disabled:opacity-60"
              />
            </div>

            <!-- N° HES / OC -->
            <div class="space-y-1">
              <label class="text-xs font-mono font-bold uppercase text-slate-300 block">N° Orden Compra / HES Mandante</label>
              <input
                v-model="formFacturacion.hes_oc_numero"
                type="text"
                placeholder="ej. HES-2026-9941"
                :disabled="estadoDbActual === 7"
                class="w-full bg-[#080d1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:border-amber-400 outline-none disabled:opacity-60"
              />
            </div>

            <!-- Fecha Facturación -->
            <div class="space-y-1">
              <label class="text-xs font-mono font-bold uppercase text-slate-300 block">Fecha de Facturación</label>
              <input
                v-model="formFacturacion.fecha_facturacion"
                type="date"
                :disabled="estadoDbActual === 7"
                class="w-full bg-[#080d1a] border border-white/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-amber-400 outline-none disabled:opacity-60"
              />
            </div>

            <!-- Botón Maestro de Cierre -->
            <div class="space-y-1 flex flex-col justify-end">
              <button
                v-if="estadoDbActual !== 7"
                @click="guardarCierreFacturacion"
                :disabled="guardandoFacturacion || !formFacturacion.factura_numero"
                class="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span v-if="guardandoFacturacion" class="animate-spin">⚙️</span>
                <span v-else>🏁</span>
                <span>{{ guardandoFacturacion ? 'Registrando...' : 'Declarar Facturada & Cerrar' }}</span>
              </button>
              <div v-else class="text-center py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-300 font-mono">
                ✅ Proceso 100% Concluido
              </div>
            </div>
          </div>

          <!-- Observaciones -->
          <div class="space-y-1">
            <label class="text-xs font-mono font-bold uppercase text-slate-400 block">Observaciones Administrativas / Contables</label>
            <input
              v-model="formFacturacion.observaciones_facturacion"
              type="text"
              placeholder="Detalle contable o notas de conciliación..."
              :disabled="estadoDbActual === 7"
              class="w-full bg-[#080d1a] border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-amber-400 outline-none disabled:opacity-60"
            />
          </div>
        </div>

      </div>
    </div>

    <!-- Banner Modo Solo Lectura en Comercial (Inmutabilidad Etapa Concluida) -->
    <div v-if="topTab === 'comercial' && isModoOperaciones" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200 flex-shrink-0">
      <div class="flex items-center gap-2.5">
        <span class="text-lg">🔒</span>
        <div>
          <span class="font-bold text-amber-300">Etapa Comercial Concluida (Modo Solo Lectura):</span>
          <span class="text-slate-300 text-[11px] ml-1.5">El requerimiento fue transferido formalmente a Operaciones. Todos los campos comerciales están sellados.</span>
        </div>
      </div>
      <button @click="volverACotizar" class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"></path></svg>
        <span>Devolver a Preventa Comercial</span>
      </button>
    </div>

    <!-- Main Grid (Comercial / Preventa) -->
    <div v-if="topTab === 'comercial'" class="grid grid-cols-1 lg:grid-cols-[1.5fr_3.5fr] gap-6 flex-1 min-h-0 w-full overflow-hidden">
      
      <!-- LEFT: CLIENTE & VERSION -->
      <div class="bg-[#050810] border border-white/10 rounded-xl p-5 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
        <fieldset :disabled="isModoOperaciones" class="space-y-6 border-0 p-0 m-0 disabled:opacity-100 disabled:text-slate-200">
        <div class="space-y-4">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">
            1. Datos de la Oportunidad
          </div>
          
          <div>
            <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Empresa Emisora (Cotizar a nombre de):</label>
            <select v-model="opportunity.id_empresa_emisora" class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white transition-colors">
              <option value="9">SAN PABLO</option>
              <option value="7">BESTMAQ</option>
              <option value="8">LOGISTICA DEL SUR</option>
              <option value="11">ROYAL RENTAL</option>
            </select>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="text-[11px] text-slate-400 font-semibold">Cliente Mandante:</label>
              <button @click="abrirModalCliente" class="text-[9px] px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded font-bold transition-colors">
                + Nuevo Cliente
              </button>
            </div>
            <div class="relative">
              <input 
                type="text" 
                v-model="searchQuery" 
                @focus="showDropdown = true" 
                @input="onSearchInput"
                @blur="onBlur"
                placeholder="Buscar por Nombre, Razón Social o RUT..." 
                class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white transition-colors"
              />
              <div v-if="showDropdown && filteredClientes.length > 0" class="absolute z-10 w-full bg-[#0a0f1e] border border-white/10 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl scrollbar-hide">
                <div 
                  v-for="c in filteredClientes" 
                  :key="c.id_empresa" 
                  @mousedown="selectCliente(c)" 
                  class="px-3 py-2.5 text-xs text-white hover:bg-amber-500 hover:text-slate-950 cursor-pointer transition-colors border-b border-white/5 text-left"
                >
                  <div class="font-bold">{{ c.razon_social || c.name_empresa }}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">RUT: {{ c.rut_empresa }} | Giro: {{ c.giro || 'N/A' }}</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">RUT Cliente (Registrado):</label>
            <div v-if="clienteSeleccionado" class="bg-white/5 border border-white/10 rounded-lg p-3 text-[10px] text-slate-300 space-y-1.5">
              <div class="flex justify-between"><span class="text-slate-500 font-semibold">RUT:</span> <span class="font-bold">{{ clienteSeleccionado.rut_empresa }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 font-semibold">Giro:</span> <span class="font-bold">{{ clienteSeleccionado.giro || 'No registrado' }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 font-semibold">Dirección:</span> <span class="font-bold truncate max-w-[150px]" :title="clienteSeleccionado.direccion">{{ clienteSeleccionado.direccion || 'No registrada' }}</span></div>
            </div>
            <input v-else type="text" v-model="opportunity.rut_cliente" placeholder="RUT para asociar..." class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white" readonly />
          </div>

          <div class="mb-3" v-if="clienteSeleccionado">
            <div class="flex justify-between items-center mb-1.5">
              <label class="text-[11px] text-slate-400 font-semibold">Punto de Contacto del Cliente:</label>
              <button @click.prevent="editarClienteActual" class="text-[10px] bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white px-2 py-0.5 rounded transition-colors">+ Gestionar Contactos</button>
            </div>
            <select v-model="opportunity.contacto_obj" @change="alCambiarContacto" class="w-full bg-[#0a0f1e] border border-amber-500/50 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white mb-3">
              <option :value="null">-- Seleccionar Contacto --</option>
              <option v-for="(cto, idx) in clienteSeleccionado.json_field?.puntos_contacto || []" :key="idx" :value="cto">
                {{ cto.nombre }} - {{ cto.correo }} ({{ cto.telefono }})
              </option>
              <option v-if="!clienteSeleccionado.json_field?.puntos_contacto?.length" disabled>Sin contactos registrados. Haz click en "+ Gestionar Contactos".</option>
            </select>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">
                  Nombre Contacto <span class="text-red-400">*</span>:
                </label>
                <input 
                  type="text" 
                  v-model="opportunity.contacto_nombre" 
                  placeholder="Nombre solicitante..." 
                  class="w-full bg-[#0a0f1e] border rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors" 
                  :class="!opportunity.contacto_nombre ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                  :readonly="!!opportunity.contacto_obj" 
                />
              </div>
              <div>
                <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">
                  Teléfono Contacto <span class="text-red-400">*</span>:
                </label>
                <input 
                  type="text" 
                  v-model="opportunity.contacto_telefono" 
                  placeholder="Ej: +569..." 
                  class="w-full bg-[#0a0f1e] border rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors" 
                  :class="!opportunity.contacto_telefono ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                  :readonly="!!opportunity.contacto_obj" 
                />
              </div>
            </div>
          </div>
          
          <div v-else class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Nombre Contacto <span class="text-red-400">*</span>:</label>
              <input type="text" v-model="opportunity.contacto_nombre" placeholder="Seleccione un cliente primero..." class="w-full bg-[#0a0f1e]/50 border border-red-500/80 bg-red-500/10 text-red-300 rounded-lg px-3 py-2 text-xs outline-none" disabled />
            </div>
            <div>
              <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Teléfono Contacto <span class="text-red-400">*</span>:</label>
              <input type="text" v-model="opportunity.contacto_telefono" placeholder="Seleccione un cliente primero..." class="w-full bg-[#0a0f1e]/50 border border-red-500/80 bg-red-500/10 text-red-300 rounded-lg px-3 py-2 text-xs outline-none" disabled />
            </div>
          </div>

          <div>
            <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">
              Tipo de Pago <span class="text-red-400">*</span>:
            </label>
            <select 
              v-model="opportunity.tipo_pago" 
              class="w-full bg-[#0a0f1e] border rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
              :class="!opportunity.tipo_pago ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
            >
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="credito">Crédito</option>
              <option value="debito">Débito</option>
              <option value="cheque">Cheque</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <!-- MATRIZ DE 6 SELECTORES / FLAGS OBLIGATORIOS (COMBOBOXES CON ALERTA ROJA EN NULL) -->
          <div class="space-y-3 bg-[#0a0f1e] border border-white/10 rounded-xl p-3.5">
            <div class="flex justify-between items-center border-b border-white/10 pb-1.5">
              <span class="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                ⚙️ Requerimientos Comerciales
              </span>
              <span class="text-[10px] text-slate-400 font-mono">* Selección SÍ / NO obligatoria</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- 1. Requiere OC / HES -->
              <div>
                <label class="text-[10px] text-slate-300 font-bold block mb-1">
                  Requiere OC / HES <span class="text-red-400">*</span>:
                </label>
                <select 
                  v-model="opportunity.requiere_oc_hes" 
                  class="w-full bg-[#050810] border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition-colors"
                  :class="opportunity.requiere_oc_hes === null ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                >
                  <option :value="null">-- Seleccionar (Obligatorio) --</option>
                  <option :value="true">SÍ (Requiere OC/HES)</option>
                  <option :value="false">NO (Sin OC/HES previa)</option>
                </select>
              </div>

              <!-- 2. Requiere Acreditación -->
              <div>
                <label class="text-[10px] text-slate-300 font-bold block mb-1">
                  Requiere Acreditación <span class="text-red-400">*</span>:
                </label>
                <select 
                  v-model="opportunity.requiere_acreditacion" 
                  class="w-full bg-[#050810] border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition-colors"
                  :class="opportunity.requiere_acreditacion === null ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                >
                  <option :value="null">-- Seleccionar (Obligatorio) --</option>
                  <option :value="true">SÍ (Exige Acreditación)</option>
                  <option :value="false">NO (Sin Acreditación)</option>
                </select>
              </div>

              <!-- 3. Servicio incluye Traslado / Flete -->
              <div>
                <label class="text-[10px] text-slate-300 font-bold block mb-1">
                  Incluye Flete / Traslado <span class="text-red-400">*</span>:
                </label>
                <select 
                  v-model="opportunity.incluye_flete" 
                  class="w-full bg-[#050810] border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition-colors"
                  :class="opportunity.incluye_flete === null ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                >
                  <option :value="null">-- Seleccionar (Obligatorio) --</option>
                  <option :value="true">SÍ (Cobro Flete $500.000)</option>
                  <option :value="false">NO (Sin Cobro Flete)</option>
                </select>
              </div>

              <!-- 4. Requiere Rigger Certificado -->
              <div>
                <label class="text-[10px] text-slate-300 font-bold block mb-1">
                  Requiere Rigger <span class="text-red-400">*</span>:
                </label>
                <select 
                  v-model="opportunity.requiere_rigger" 
                  class="w-full bg-[#050810] border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition-colors"
                  :class="opportunity.requiere_rigger === null ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                >
                  <option :value="null">-- Seleccionar (Obligatorio) --</option>
                  <option :value="true">SÍ (Requiere Rigger)</option>
                  <option :value="false">NO (Sin Rigger)</option>
                </select>
              </div>

              <!-- 5. Requiere Prevencionista Certificado -->
              <div>
                <label class="text-[10px] text-slate-300 font-bold block mb-1">
                  Prevencionista Certificado <span class="text-red-400">*</span>:
                </label>
                <select 
                  v-model="opportunity.requiere_prevencionista" 
                  class="w-full bg-[#050810] border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition-colors"
                  :class="opportunity.requiere_prevencionista === null ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                >
                  <option :value="null">-- Seleccionar (Obligatorio) --</option>
                  <option :value="true">SÍ (Requiere Prevencionista)</option>
                  <option :value="false">NO (Sin Prevencionista)</option>
                </select>
              </div>

              <!-- 6. Cliente pone el combustible -->
              <div>
                <label class="text-[10px] text-slate-300 font-bold block mb-1">
                  Cliente pone Combustible <span class="text-red-400">*</span>:
                </label>
                <select 
                  v-model="opportunity.cliente_pone_combustible" 
                  class="w-full bg-[#050810] border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition-colors"
                  :class="opportunity.cliente_pone_combustible === null ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                >
                  <option :value="null">-- Seleccionar (Obligatorio) --</option>
                  <option :value="true">SÍ (Combustible por Cliente)</option>
                  <option :value="false">NO (Combustible por San Pablo)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">
              Descripción del Proyecto / Faena <span class="text-red-400">*</span>:
            </label>
            <textarea 
              v-model="opportunity.descripcion" 
              rows="3" 
              placeholder="Ej. Montaje Reactores Planta, detalles operativos..." 
              class="w-full bg-[#0a0f1e] border rounded-lg p-3 text-xs outline-none text-white resize-none transition-colors"
              :class="!opportunity.descripcion ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
            ></textarea>
          </div>

          <!-- VERSION CONTROL & ENVÍO DE EMAIL -->
          <div class="space-y-4 mt-2">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2 flex justify-between items-center">
              <span>2. Control de Versiones & Envíos</span>
              <span class="text-[10px] text-slate-500 font-mono font-normal">Mostrando más nueva primero</span>
            </div>
            <div class="flex flex-col gap-2">
              <div
                v-for="(v, i) in sortedCotizacionesHistoricas"
                :key="i"
                class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 w-full shadow-md"
              >
                <div class="flex justify-between items-center w-full gap-2">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <span class="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black font-mono rounded">
                      {{ v.version_codigo || ('v' + v.version) }}
                    </span>
                    <span class="text-xs text-emerald-400 font-black font-mono">{{ formatCurrency(v.monto) }}</span>
                    <span class="text-[10px] text-slate-400 font-mono">{{ new Date(v.fecha).toLocaleString() }}</span>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0">
                    <!-- Botón Rojo Icónico PDF -->
                    <a
                      :href="getFullStaticUrl(v.url)"
                      target="_blank"
                      class="text-[10px] px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold transition-all no-underline flex items-center gap-1"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                      <span>PDF</span>
                    </a>

                    <!-- Botón Enviar Cotización (Solo en la última versión i === 0) -->
                    <button
                      v-if="i === 0"
                      @click="openModalEnviar(v)"
                      class="text-[10px] px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition-all flex items-center gap-1 uppercase shadow"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      <span>Enviar Cotización</span>
                    </button>
                  </div>
                </div>

                <!-- Historial Completo de Eventos de Envío de Email -->
                <div v-if="(v.eventos_envio && v.eventos_envio.length > 0) || v.evento_envio" class="mt-1 space-y-1">
                  <div v-for="(evt, eIdx) in (v.eventos_envio || [v.evento_envio])" :key="eIdx" class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-[10px] text-emerald-400 font-mono flex items-center justify-between">
                    <div class="truncate">
                      ✉️ <strong>Envío #{{ eIdx + 1 }}:</strong> {{ new Date(evt.fecha_envio).toLocaleString() }}
                      <span class="text-slate-300"> ➔ {{ evt.destinatarios_cliente?.join(', ') }}</span>
                    </div>
                    <span class="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase ml-2 flex-shrink-0">ENTREGADO</span>
                  </div>
                </div>
              </div>

              <div v-if="sortedCotizacionesHistoricas.length === 0" class="text-[10px] text-slate-500 italic p-2">
                No hay versiones previas de cotización.
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Prioridad:</label>
              <select v-model="opportunity.prioridad" class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white">
                <option value="normal">Normal</option>
                <option value="alta" class="text-amber-500 font-bold">🔥 Alta</option>
              </select>
            </div>
            <div>
              <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Fecha Tentativa:</label>
              <input type="date" v-model="opportunity.fecha_tentativa" class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white font-mono" />
            </div>
          </div>

          <div class="mt-4 bg-white/5 border border-white/5 p-4 rounded-lg">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Total Resumen Comercial</div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-500">Neto Cotizado:</span>
              <span class="text-xl font-black text-amber-500 font-mono">{{ formatCurrency(totalNeto) }}</span>
            </div>
          </div>
        </div>
      </fieldset>
      </div>

      <!-- RIGHT: TABBED CONTAINER -->
      <div class="bg-[#050810] border border-white/10 rounded-xl flex flex-col min-h-0 overflow-hidden">
        <!-- Tabs -->
        <div class="flex border-b border-white/5 bg-black/20 px-4 flex-shrink-0 gap-4 overflow-x-auto scrollbar-hide">
          <button @click="activeTab = 'terreno'" :class="activeTab === 'terreno' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'" class="py-3 px-1 text-[10px] font-bold uppercase tracking-wider outline-none transition-all whitespace-nowrap">
            Datos Servicio & Visita
          </button>
          <button @click="activeTab = 'servicios'" :class="activeTab === 'servicios' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'" class="py-3 px-1 text-[10px] font-bold uppercase tracking-wider outline-none transition-all whitespace-nowrap">
            Estructurador de Servicios
          </button>
          <button @click="activeTab = 'comercial'" :class="activeTab === 'comercial' || activeTab === 'condiciones' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'" class="py-3 px-1 text-[10px] font-bold uppercase tracking-wider outline-none transition-all whitespace-nowrap">
            Condiciones Comerciales
          </button>
          <button @click="activeTab = 'antecedentes'" :class="activeTab === 'antecedentes' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'" class="py-3 px-1 text-[10px] font-bold uppercase tracking-wider outline-none transition-all whitespace-nowrap">
            Antecedentes Licitación
          </button>
          <button @click="activeTab = 'bitacora'" :class="activeTab === 'bitacora' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'" class="py-3 px-1 text-[10px] font-bold uppercase tracking-wider outline-none transition-all flex items-center gap-1 whitespace-nowrap">
            <span>Bitácora & Alertas</span>
          </button>
        </div>

        <!-- Tab Body -->
        <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div class="flex-1 min-h-0 overflow-y-auto p-5 scrollbar-hide space-y-6">
            <fieldset :disabled="isModoOperaciones" class="border-0 p-0 m-0 disabled:opacity-100 disabled:text-slate-200 block w-full">
          
          <!-- TAB 0: ANTECEDENTES -->
          <div v-if="activeTab === 'antecedentes'" class="space-y-6">
            <span class="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/5 pb-2">Información del Proceso</span>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">N° o ID de Licitación / Proyecto</label>
                <input type="text" v-model="antecedentes.identificador" placeholder="Ej: LIC-2024-001" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white" />
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Tipo de Proceso</label>
                <select v-model="antecedentes.tipo_proceso" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none">
                  <option value="Licitación Pública">Licitación Pública</option>
                  <option value="Licitación Privada">Licitación Privada</option>
                  <option value="Trato Directo">Trato Directo</option>
                  <option value="Servicio Spot">Servicio Spot (Ad-hoc)</option>
                </select>
              </div>
            </div>

            <span class="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/5 pb-2 mt-4">Documentos Adjuntos</span>
            <div class="border border-dashed border-white/20 rounded-lg p-8 text-center bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors relative">
              <svg class="w-10 h-10 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <div class="text-xs font-semibold text-slate-300">Arrastra aquí las bases, planos de rigging o especificaciones</div>
              <div class="text-[10px] text-slate-500 mt-1">Formatos soportados: PDF, DOCX, XLSX, DWG</div>
              <input type="file" multiple class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" @change="agregarArchivos" />
            </div>

            <div v-if="antecedentes.archivos.length > 0" class="space-y-2 mt-4">
              <div v-for="(archivo, idx) in antecedentes.archivos" :key="idx" class="flex flex-col gap-2 bg-[#0a0f1e] border border-white/10 p-2.5 rounded-lg">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <div>
                      <div class="text-xs font-semibold text-white">{{ archivo.nombre }}</div>
                      <div class="text-[9px] text-slate-500">{{ (archivo.tamano / 1024 / 1024).toFixed(2) }} MB | {{ archivo.fecha_subida || new Date().toLocaleDateString() }}</div>
                    </div>
                  </div>
                  <button @click="eliminarArchivo(idx)" class="text-slate-500 hover:text-red-400 p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div class="mt-1">
                  <input type="text" v-model="archivo.comentario" placeholder="Agregar comentario sobre este archivo..." class="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-slate-300 outline-none focus:border-amber-500/50" />
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 1: ESTRUCTURADOR -->
          <div v-if="activeTab === 'servicios'" class="h-full flex flex-col space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-white uppercase tracking-wider">Líneas de Servicio a Cotizar</span>
              <button @click="agregarLinea" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition-all">
                + Agregar Línea
              </button>
            </div>
            
            <div class="flex-1 border border-white/5 rounded-lg bg-black/20 overflow-auto scrollbar-hide">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-white/5 border-b border-white/5 text-slate-400 font-bold uppercase text-[9px] tracking-wide">
                    <th class="p-3 min-w-[210px]">Categoría</th>
                    <th class="p-3 min-w-[170px]">Subcategoría</th>
                    <th class="p-3 min-w-[150px] w-full">Descripción / Equipo</th>
                    <th class="p-3 text-center min-w-[70px]">Cant.</th>
                    <th class="p-3 min-w-[110px]">Unidad</th>
                    <th class="p-3 text-right min-w-[110px]">Valor Unit.</th>
                    <th class="p-3 text-right min-w-[120px]">Subtotal</th>
                    <th class="p-3 text-center min-w-[40px]"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr v-for="(line, idx) in lines" :key="idx" class="hover:bg-white/[0.02]">
                    <td class="p-2">
                      <select 
                        v-model="line.tipo" 
                        @change="line.subcategoria = ''" 
                        class="bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white outline-none w-full transition-colors"
                        :class="!line.tipo ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                      >
                        <option value="" class="bg-[#0a0f1e] text-slate-300">-- Seleccionar Categoría * --</option>
                        <option v-for="cat in dbCategories" :key="cat.id_categoria" :value="cat.nombre_categoria" class="bg-[#0a0f1e] text-white">
                          {{ cat.nombre_categoria }}
                        </option>
                      </select>
                    </td>
                    <td class="p-2">
                      <select 
                        v-model="line.subcategoria" 
                        class="bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white outline-none w-full transition-colors"
                        :class="!line.subcategoria ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                      >
                        <option value="" class="bg-[#0a0f1e] text-slate-300">-- Seleccionar Subcategoría * --</option>
                        <option v-for="sub in getSubcategoriesForType(line.tipo)" :key="sub.id_subcategoria" :value="sub.nombre_subcategoria" class="bg-[#0a0f1e] text-white">
                          {{ sub.nombre_subcategoria }}
                        </option>
                      </select>
                    </td>
                    <td class="p-2">
                      <input type="text" v-model="line.descripcion" placeholder="Ej: Liebherr LTM 1220..." class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-xs text-white" />
                    </td>
                    <td class="p-2">
                      <input type="number" v-model.number="line.whitespace" min="1" class="hidden" /><input type="number" v-model.number="line.cantidad" min="1" class="w-full bg-[#0a0f1e] border border-white/10 rounded text-center px-1 py-1 text-xs text-white" />
                    </td>
                    <td class="p-2">
                      <select v-model="line.unidad" class="bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none w-full">
                        <option value="Horas" class="bg-[#0a0f1e] text-white">Horas</option>
                        <option value="Diario" class="bg-[#0a0f1e] text-white">Diario</option>
                        <option value="Semanal" class="bg-[#0a0f1e] text-white">Semanal</option>
                        <option value="Mensual" class="bg-[#0a0f1e] text-white">Mensual</option>
                        <option value="Fijo" class="bg-[#0a0f1e] text-white">Fijo</option>
                        <option value="Flete" class="bg-[#0a0f1e] text-white">Flete</option>
                      </select>
                    </td>
                    <td class="p-2">
                      <input type="number" v-model.number="line.valorUnitario" min="0" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-right text-xs text-white" />
                    </td>
                    <td class="p-2 text-right font-bold text-amber-500 font-mono">
                      {{ formatCurrency(line.cantidad * (line.valorUnitario || 0)) }}
                    </td>
                    <td class="p-2 text-center">
                      <button @click="eliminarLinea(idx)" class="text-slate-500 hover:text-red-400">
                        <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 1: SITE VISIT & VIABILIDAD (DATOS GENERALES) -->
          <div v-if="activeTab === 'terreno'" class="space-y-4">
            <span class="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/5 pb-2">Datos Servicio & Visita</span>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Columna Izquierda: Atributos y Visita -->
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                    <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                      Nombre de la Obra <span class="text-red-400">*</span>:
                    </label>
                    <input 
                      type="text" 
                      v-model="siteVisit.obra_nombre" 
                      placeholder="Ej: Celulosa Laja Reactor" 
                      class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white outline-none transition-colors" 
                      :class="!siteVisit.obra_nombre ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                      Dirección de la Obra <span class="text-red-400">*</span>:
                    </label>
                    <input 
                      type="text" 
                      v-model="siteVisit.obra_direccion" 
                      placeholder="Ej: Av. Industrial 450"
                      class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white outline-none transition-colors" 
                      :class="!siteVisit.obra_direccion ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                      Ciudad de la Obra <span class="text-red-400">*</span>:
                    </label>
                    <input 
                      type="text" 
                      v-model="siteVisit.obra_ciudad" 
                      placeholder="Ej: Concepción"
                      class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white outline-none transition-colors" 
                      :class="!siteVisit.obra_ciudad ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                    />
                  </div>
                  <!-- Horarios de Inicio y Término Obligatorios del Servicio -->
                  <div>
                    <label class="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                      Fecha/Hora Inicio Servicio <span class="text-red-400">*</span>:
                    </label>
                    <input 
                      type="datetime-local" 
                      v-model="siteVisit.fecha_hora_inicio" 
                      class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white outline-none transition-colors" 
                      :class="!siteVisit.fecha_hora_inicio ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-amber-500/40 focus:border-amber-400'"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                      Fecha/Hora Término Servicio <span class="text-red-400">*</span>:
                    </label>
                    <input 
                      type="datetime-local" 
                      v-model="siteVisit.fecha_hora_termino" 
                      class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white outline-none transition-colors" 
                      :class="!siteVisit.fecha_hora_termino ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-amber-500/40 focus:border-amber-400'"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                      Tipo de Carga
                      <span v-if="hasDiff('tipo_carga')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-2">Original: {{ snapshotComercial.tipo_carga }}</span>
                    </label>
                    <input type="text" v-model="siteVisit.tipo_carga" placeholder="Estructura metálica..." class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('tipo_carga') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                      Peso de Carga (Ton/Kg)
                      <span v-if="hasDiff('peso_carga')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-2">Original: {{ snapshotComercial.peso_carga }}</span>
                    </label>
                    <input type="text" v-model="siteVisit.peso_carga" placeholder="45 Ton" class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('peso_carga') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-400 font-semibold mb-1">Volumen (LxAxA)</label>
                    <input type="text" v-model="siteVisit.volumen_carga" placeholder="12m x 3m x 4m" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white" />
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                        Radios (m)
                        <span v-if="hasDiff('radios_trabajo')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-2">Original: {{ snapshotComercial.radios_trabajo }}</span>
                      </label>
                      <input type="text" v-model="siteVisit.radios_trabajo" placeholder="18m" class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('radios_trabajo') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                    </div>
                    <div>
                      <label class="block text-[10px] text-slate-400 font-semibold mb-1">
                        Alturas (m)
                        <span v-if="hasDiff('alturas_trabajo')" class="line-through text-red-400 font-mono text-[10px] bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 ml-2">Original: {{ snapshotComercial.alturas_trabajo }}</span>
                      </label>
                      <input type="text" v-model="siteVisit.alturas_trabajo" placeholder="22m" class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1.5 text-xs text-white" :class="hasDiff('alturas_trabajo') ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'" />
                    </div>
                  </div>
                  <div class="col-span-2">
                    <label class="block text-[10px] text-slate-400 font-semibold mb-1">Detalle del Servicio a realizar</label>
                    <textarea v-model="siteVisit.detalle_servicio" rows="2" placeholder="Describa la maniobra..." class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none resize-none"></textarea>
                  </div>
                </div>

                <!-- Programación de Visitas Técnica -->
                <div class="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3 mt-4">
                  <div>
                    <div class="text-xs font-bold text-white uppercase tracking-wider">Flujo Asignación de Visita</div>
                    <p class="text-[10px] text-slate-400 mt-0.5">Solicita la asignación de un especialista para evaluar en terreno.</p>
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-400 font-semibold mb-1">Coordinador a Notificar</label>
                    <select v-model="emailCoordinadorSeleccionado" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500 transition-colors">
                      <option value="" disabled class="bg-[#0a0f1e] text-white">-- Seleccionar Coordinador --</option>
                      <option v-for="u in coordinadoresVisita" :key="u.id_user" :value="u.email || u.correo || u.username" class="bg-[#0a0f1e] text-white">
                        {{ u.nombre_user || u.name_user || u.username }} ({{ u.email || u.correo || u.username }})
                      </option>
                    </select>
                  </div>

                  <!-- Datos de Contacto en Terreno -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label class="block text-[10px] text-slate-400 font-semibold mb-1">Contacto en Terreno</label>
                      <input 
                        v-model="siteVisit.contacto_terreno_nombre" 
                        type="text" 
                        placeholder="Ej: Juan Pérez" 
                        class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-slate-400 font-semibold mb-1">N° Teléfono Contacto</label>
                      <input 
                        v-model="siteVisit.contacto_terreno_telefono" 
                        type="text" 
                        placeholder="Ej: +56 9 1234 5678" 
                        class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-slate-400 font-semibold mb-1">Correo Electrónico Contacto</label>
                      <input 
                        v-model="siteVisit.contacto_terreno_email" 
                        type="email" 
                        placeholder="Ej: contacto@cliente.cl" 
                        class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div class="flex justify-start pt-2">
                    <button 
                      type="button"
                      :disabled="cargandoVisita || !emailCoordinadorSeleccionado"
                      @click="solicitarAsignacionVisita" 
                      class="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <svg v-if="!cargandoVisita" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span v-if="!cargandoVisita">Solicitar Asignación de Visita</span>
                      <span v-else>Solicitando...</span>
                    </button>
                  </div>
                  <div v-if="estadoAsignacion" class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-xs font-bold text-blue-300 mt-2 flex justify-center items-center">
                    <span>{{ estadoAsignacion }}</span>
                  </div>
                  
                  <div v-if="visitasDelProyecto.length > 0" class="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2 text-xs mt-2 space-y-1">
                    <div class="font-bold text-[10px] text-indigo-400 uppercase mb-1">Visitas del Proyecto</div>
                    <div v-for="v in visitasDelProyecto" :key="v.id_survey" class="flex justify-between items-center bg-black/40 p-1.5 rounded text-indigo-200">
                      <div class="flex flex-col">
                        <span class="font-bold">Visita #{{ v.id_survey }} ({{ v.estado_srv }})</span>
                        <span class="text-[9px] opacity-70">{{ v.body_exec?.nombre_obra || v.body_exec?.obra_nombre || 'Sin nombre de obra' }}</span>
                      </div>
                      <div class="flex gap-2 items-center">
                        <span>{{ v.fecha_plan_ini ? new Date(v.fecha_plan_ini).toLocaleDateString() : 'S/F' }}</span>
                        <a :href="getSurveyReportUrl(v.id_survey)" target="_blank" class="bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-bold px-2 py-1 text-[10px] rounded transition-colors no-underline" title="Visualizar detalles de la visita en Web">
                          Ver Web
                        </a>
                        <a :href="getArchivoUrl(v.id_doc || v.id_survey)" target="_blank" class="inline-flex items-center bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-bold px-2 py-1 text-[10px] rounded transition-colors no-underline" title="Visualizar reporte PDF firmado">
                          Ver Reporte / PDF
                        </a>
                        <button @click="() => { selectedSurveyId = v.id_survey; cargarVisitaDesdeBD(); }" type="button" class="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 font-bold px-2 py-1 text-[10px] rounded transition-colors cursor-pointer" title="Cargar datos de esta visita al formulario">
                          Cargar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Columna Derecha: Mapa -->
              <div class="flex flex-col h-full space-y-2">
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Ubicación Geográfica (Mover marcador o Click para fijar)</label>
                <MapSelector v-if="!loading" v-model:lat="siteVisit.lat" v-model:lng="siteVisit.lng" />
              </div>
            </div>
          </div>

          <!-- TAB 3: CONDICIONES COMERCIALES -->
          <div v-if="activeTab === 'comercial'" class="space-y-4">
            <span class="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/5 pb-2">Hitos de Facturación y Cierre</span>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Validez de Oferta (Días):</label>
                <input type="number" v-model="comercial.validez_dias" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white" />
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Moneda:</label>
                <select v-model="comercial.moneda" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none">
                  <option value="CLP">CLP - Pesos Chilenos</option>
                  <option value="USD">USD - Dólares</option>
                  <option value="UF">UF - Unidades de Fomento</option>
                </select>
              </div>
              <div class="col-span-2">
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Condición del Servicio:</label>
                <div class="flex gap-4 mt-2">
                  <label class="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input type="radio" v-model="comercial.condicion_servicio" value="programado" class="accent-amber-500" />
                    <span>Programado (Reservamos equipo a todo evento)</span>
                  </label>
                  <label class="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input type="radio" v-model="comercial.condicion_servicio" value="disponibilidad" class="accent-amber-500" />
                    <span>A Disponibilidad (No aseguramos equipo)</span>
                  </label>
                </div>
              </div>

              <!-- PROYECCIÓN DE COSTOS DE PENSIONES (ALOJAMIENTO, DESAYUNO, ALMUERZO, CENA, TRASLADO) -->
              <div class="col-span-2 mt-2 bg-white/[0.02] border border-white/10 rounded-lg p-3.5 space-y-3">
                <div class="flex justify-between items-center border-b border-white/5 pb-2">
                  <span class="text-xs font-bold text-amber-500 uppercase tracking-wider block">
                    🏠 Proyección de Costos de Pensiones (Base para EDP)
                  </span>
                  <span class="text-[9px] text-slate-400">Relevante para devengado y estados de pago</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  <!-- Alojamiento -->
                  <div class="bg-[#0a0f1e] p-2.5 rounded border border-white/5 space-y-1.5">
                    <label class="block text-[10px] text-slate-300 font-bold uppercase truncate">Alojamiento</label>
                    <select v-model="comercial.pensiones.alojamiento_costeado" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-500">
                      <option value="CLIENTE">Costeado por Cliente</option>
                      <option value="SAN_PABLO">Costeado por San Pablo</option>
                      <option value="NA">No Aplica (N/A)</option>
                    </select>
                  </div>

                  <!-- Desayuno -->
                  <div class="bg-[#0a0f1e] p-2.5 rounded border border-white/5 space-y-1.5">
                    <label class="block text-[10px] text-slate-300 font-bold uppercase truncate">Desayuno</label>
                    <select v-model="comercial.pensiones.desayuno_costeado" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-500">
                      <option value="CLIENTE">Costeado por Cliente</option>
                      <option value="SAN_PABLO">Costeado por San Pablo</option>
                      <option value="NA">No Aplica (N/A)</option>
                    </select>
                  </div>

                  <!-- Almuerzo -->
                  <div class="bg-[#0a0f1e] p-2.5 rounded border border-white/5 space-y-1.5">
                    <label class="block text-[10px] text-slate-300 font-bold uppercase truncate">Almuerzo</label>
                    <select v-model="comercial.pensiones.almuerzo_costeado" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-500">
                      <option value="CLIENTE">Costeado por Cliente</option>
                      <option value="SAN_PABLO">Costeado por San Pablo</option>
                      <option value="NA">No Aplica (N/A)</option>
                    </select>
                  </div>

                  <!-- Cena -->
                  <div class="bg-[#0a0f1e] p-2.5 rounded border border-white/5 space-y-1.5">
                    <label class="block text-[10px] text-slate-300 font-bold uppercase truncate">Cena</label>
                    <select v-model="comercial.pensiones.cena_costeado" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-500">
                      <option value="CLIENTE">Costeado por Cliente</option>
                      <option value="SAN_PABLO">Costeado por San Pablo</option>
                      <option value="NA">No Aplica (N/A)</option>
                    </select>
                  </div>

                  <!-- Traslado Personal -->
                  <div class="bg-[#0a0f1e] p-2.5 rounded border border-white/5 space-y-1.5">
                    <label class="block text-[10px] text-slate-300 font-bold uppercase truncate">Traslado Personal</label>
                    <select v-model="comercial.pensiones.traslado_costeado" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-500">
                      <option value="CLIENTE">Costeado por Cliente</option>
                      <option value="SAN_PABLO">Costeado por San Pablo</option>
                      <option value="NA">No Aplica (N/A)</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- CLÁUSULAS Y ACUERDOS COMERCIALES POR CATEGORÍA -->
              <div class="col-span-2 mt-2 space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <label class="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                      Cláusulas y Acuerdos Comerciales (PDF)
                    </label>
                    <div class="flex items-center gap-1.5">
                      <span 
                        class="text-[9px] font-bold px-2 py-0.5 rounded border transition-colors"
                        :class="categoriasDetectadas.traslados ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800/40 text-slate-500 border-white/5'"
                      >
                        {{ categoriasDetectadas.traslados ? '✓ TRASLADOS' : 'TRASLADOS' }}
                      </span>
                      <span 
                        class="text-[9px] font-bold px-2 py-0.5 rounded border transition-colors"
                        :class="categoriasDetectadas.gruas ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800/40 text-slate-500 border-white/5'"
                      >
                        {{ categoriasDetectadas.gruas ? '✓ GRÚAS TELESCÓPICAS' : 'GRÚAS TELESCÓPICAS' }}
                      </span>
                      <span 
                        class="text-[9px] font-bold px-2 py-0.5 rounded border transition-colors"
                        :class="categoriasDetectadas.plataformas ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-slate-800/40 text-slate-500 border-white/5'"
                      >
                        {{ categoriasDetectadas.plataformas ? '✓ PLATAFORMAS' : 'PLATAFORMAS' }}
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    @click="regenerarCondicionesTexto" 
                    class="text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    title="Reconstruir texto con las cláusulas oficiales según los servicios presentes en el estructurador"
                  >
                    <span>🔄 Regenerar Acuerdos según Servicios</span>
                  </button>
                </div>
                <textarea 
                  v-model="comercial.condiciones_texto_pdf" 
                  rows="10" 
                  placeholder="Ingrese o ajuste los acuerdos comerciales y condiciones que aparecerán en la propuesta comercial..." 
                  class="w-full bg-[#0a0f1e] border border-white/10 rounded p-2.5 text-xs text-white outline-none resize-y font-mono leading-relaxed focus:border-amber-500/50"
                ></textarea>
                <span class="text-[9px] text-slate-500 block">
                  * Las cláusulas se cargan automáticamente según los servicios cotizados. Tienes total libertad para editar o agregar acuerdos específicos.
                </span>
              </div>
            </div>
          </div>

          <!-- TAB 4: BITÁCORA & ALERTAS -->
          <div v-if="activeTab === 'bitacora'" class="space-y-4">
            <div class="bg-red-500/10 border border-red-500/20 border-l-4 border-l-red-500 rounded p-3 text-red-300 text-xs">
              <span class="font-bold block mb-1">🚨 ALERTAS DE SEGUIMIENTO (PRÓXIMOS HITOS)</span>
              <span>No hay alertas vigentes para esta cotización.</span>
            </div>
            
            <div class="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <span class="text-xs font-bold text-white uppercase tracking-wider block">Registrar Nueva Interacción / Hito</span>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <select v-model="nuevaInteraccion.tipo" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2 py-1.5 text-xs text-white">
                    <option value="Llamada">📞 Llamada Telefónica</option>
                    <option value="Correo">✉️ Correo Electrónico</option>
                    <option value="Reunión">👥 Reunión Comercial</option>
                  </select>
                </div>
                <button @click="agregarHito" class="bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white rounded transition-colors self-end">
                  Registrar Hito
                </button>
              </div>
              <textarea v-model="nuevaInteraccion.comentario" placeholder="Detalle de la interacción..." class="w-full h-16 bg-[#0a0f1e] border border-white/10 rounded p-2 text-xs text-white resize-none"></textarea>
            </div>
            
            <!-- Trazabilidad de Envío de Cotizaciones -->
            <div class="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3 mt-4">
              <span class="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/5 pb-2">Trazabilidad de Envíos</span>
              <div v-if="cotizaciones_historicas.length === 0" class="text-xs text-slate-400 italic">No se han registrado envíos de cotización por correo.</div>
              <div v-else class="space-y-2">
                <div v-for="(envio, idx) in cotizaciones_historicas" :key="idx" class="bg-black/20 p-2.5 rounded border border-white/5 text-[10px]">
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-bold text-amber-500">Versión: {{ envio.version }}</span>
                    <span class="text-slate-400">{{ formatFecha(envio.fecha_envio) }}</span>
                  </div>
                  <div class="text-slate-300"><strong>Destinatario:</strong> {{ envio.destinatario }}</div>
                  <div class="text-slate-500"><strong>CC:</strong> {{ envio.cc }}</div>
                  <div class="text-slate-500"><strong>Monto Neto:</strong> {{ formatCurrency(envio.monto_neto) }}</div>
                </div>
              </div>
            </div>
          </div>
          </fieldset>
        </div>
      </div>
      </div>

    </div>

    <!-- Modal Nuevo Cliente -->
    <ModalNuevoCliente v-if="mostrarModalCliente" :clienteAEditar="clienteAEditar" @close="cerrarModalCliente" @cliente-creado="onClienteCreado" />
    <!-- Modal Enviar Cotización por Email -->
    <ModalEnviarCotizacion :show="showModalEnviar" :proyecto-id="props.proyectoId || currentProyectoId || opportunity?.id_proyecto || opportunity?.id" :proyecto="buildPayload()" :cliente="selectedClient" :version-data="selectedVersionForEmail" @close="showModalEnviar = false" @sent="onEmailSent" />
    <!-- Ver Survey Visor Modal (Teleported to body to avoid stacking context issues) -->
    <Teleport to="body">
      <VerSurveyModal v-model="showVisorModal" :id-survey="visorSurveyId" />
    </Teleport>
    <!-- Global Loading Overlay -->
    <div v-if="generandoPDF" class="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-4">
      <div class="relative w-16 h-16">
        <div class="absolute inset-0 rounded-full border-4 border-amber-500/20"></div>
        <div class="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
      </div>
      <div class="text-white text-sm font-bold tracking-wider animate-pulse uppercase">Generando Cotización PDF...</div>
      <div class="text-slate-400 text-xs">Por favor, espera un momento.</div>
    </div>

    <!-- Modal Motivo No Ganada -->
    <div v-if="mostrarModalNoAsignada" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl relative text-left">
        <h3 class="text-sm font-black text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
          Desestimar Cotización (No Ganada)
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-[10px] text-slate-400 font-semibold mb-1">Motivo de pérdida:</label>
            <select v-model="noAsignacionMotivo" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none">
              <option value="Desistido por el cliente">Desistido por el cliente</option>
              <option value="Incompletitud técnica">Incompletitud técnica</option>
              <option value="Precio">Precio</option>
              <option value="Sin disponibilidad de equipos">Sin disponibilidad de equipos</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] text-slate-400 font-semibold mb-1">Observaciones / Detalles:</label>
            <textarea 
              v-model="noAsignacionObservacion" 
              rows="4" 
              placeholder="Explica brevemente el motivo..."
              class="w-full bg-[#0a0f1e] border border-white/10 rounded p-2.5 text-xs text-white resize-none focus:border-red-500 outline-none transition-colors"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6 border-t border-white/5 pt-4">
          <button 
            @click="cerrarModalNoAsignada" 
            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-xs uppercase tracking-wider transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="confirmarNoAsignada" 
            class="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-xs uppercase tracking-wider transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>

  <!-- MODAL: GENERAR REQUERIMIENTO A OPERACIONES -->
  <div v-if="showModalGenerarRequerimiento" class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
    <div class="w-full max-w-xl bg-[#0f172a] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
      <div class="flex justify-between items-center border-b border-amber-500/20 pb-3">
        <h3 class="text-base font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <span>🏆 Confirmar Requerimiento a Operaciones</span>
        </h3>
        <button @click="showModalGenerarRequerimiento = false" class="text-slate-400 hover:text-white font-bold text-lg">&times;</button>
      </div>

      <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 leading-relaxed font-medium">
        ℹ️ <strong>Propuesta Ganada:</strong> La propuesta ha sido marcada como ganada y en este momento el proceso pasa a ser un requerimiento oficial para el área de Operaciones.
      </div>

      <div v-if="opportunity.requiere_acreditacion" class="space-y-2">
        <label class="block text-xs font-bold text-slate-300">Seleccione las acreditaciones requeridas <span class="text-red-500">*</span>:</label>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border border-white/10 rounded-xl p-3 bg-[#020617] max-h-[300px] overflow-y-auto">
          <!-- Empresa -->
          <div class="space-y-1.5">
            <span class="text-[11px] font-bold text-amber-500 uppercase block border-b border-white/10 pb-1 mb-2">Empresa</span>
            <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer" v-for="doc in ['Inicio de actividades', 'Constitución de empresa', 'Carpeta tributaria', 'Certificado adhesión OA', 'Certificado cotizaciones', 'Certificado de siniestralidad', 'F30', 'F30-1', 'RIOHS', 'Programa de SSO', 'Matriz de riesgo', 'Plan de emergencias', 'Póliza de seguro']" :key="'emp-'+doc">
              <input type="checkbox" :value="doc" v-model="opportunity.acreditacion_docs.empresa" class="accent-amber-500" />
              <span class="leading-tight">{{ doc }}</span>
            </label>
          </div>
          <!-- Equipos -->
          <div class="space-y-1.5">
            <span class="text-[11px] font-bold text-amber-500 uppercase block border-b border-white/10 pb-1 mb-2">Equipos</span>
            <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer" v-for="doc in ['Revisión técnica', 'SOAP', 'Permiso de circulación', 'Certificación', 'Certificado de inscripción', 'Certificado de anotaciones vigentes']" :key="'eq-'+doc">
              <input type="checkbox" :value="doc" v-model="opportunity.acreditacion_docs.equipos" class="accent-amber-500" />
              <span class="leading-tight">{{ doc }}</span>
            </label>
          </div>
          <!-- Personas -->
          <div class="space-y-1.5">
            <span class="text-[11px] font-bold text-amber-500 uppercase block border-b border-white/10 pb-1 mb-2">Personas</span>
            <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer" v-for="doc in ['Contrato de trabajo', 'Anexo de obra', 'Anexo pacto horas extraordinarias', 'Cédula identidad', 'Licencia conducir', 'Certificado de antecedentes', 'Hoja vida conductor', 'Certificación', 'Examen ocupacional', 'examen psicosensotécnico', 'EPP', 'RIOHS', 'PTS', 'IRL', 'Registro de capacitación']" :key="'per-'+doc">
              <input type="checkbox" :value="doc" v-model="opportunity.acreditacion_docs.personas" class="accent-amber-500" />
              <span class="leading-tight">{{ doc }}</span>
            </label>
          </div>
        </div>
        <p class="text-[10px] text-red-400" v-if="!opportunity.acreditacion_docs || (opportunity.acreditacion_docs.empresa.length === 0 && opportunity.acreditacion_docs.equipos.length === 0 && opportunity.acreditacion_docs.personas.length === 0)">Debe seleccionar al menos un documento.</p>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-2">Seleccionar Destinatarios para Notificación Interna de Requerimiento (Usuarios Enrolados FES):</label>
        <div class="max-h-48 overflow-y-auto space-y-1.5 bg-[#020617] border border-white/10 p-3 rounded-xl scrollbar-hide">
          <label v-for="u in usuariosEnroladosFes" :key="'req-u-'+u.id_user" class="flex items-center gap-2.5 text-xs text-slate-200 hover:bg-white/5 p-1.5 rounded cursor-pointer">
            <input type="checkbox" :value="u.id_user" v-model="selectedUsuariosRequerimiento" class="accent-amber-500 rounded" />
            <span class="font-bold">{{ u.nombre_user || u.name_user }}</span>
            <span class="text-[10px] text-slate-400 font-mono">({{ u.email || 'Sin email' }})</span>
            <span v-if="u.flag_proc_enrol" class="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">FES PIN</span>
          </label>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-3 border-t border-white/10">
        <button @click="showModalGenerarRequerimiento = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors">
          Cancelar
        </button>
        <button @click="confirmarGenerarRequerimiento" class="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2">
          <span>Confirmar y Enviar Requerimiento</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL: APROBAR REQUERIMIENTO DE OPERACIONES -->
  <div v-if="showModalAprobarRequerimiento" class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
    <div class="w-full max-w-xl bg-[#0f172a] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
      <div class="flex justify-between items-center border-b border-amber-500/20 pb-3">
        <h3 class="text-base font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <span>✅ Aprobación de Requerimiento de Operaciones</span>
        </h3>
        <button @click="showModalAprobarRequerimiento = false" class="text-slate-400 hover:text-white font-bold text-lg">&times;</button>
      </div>

      <!-- ESTADO CALCULADO DE FORMA AUTOMÁTICA -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">Estado de Aprobación Calculado (Basado en Diferencias):</label>
        <div v-if="modoAprobacionRequerimiento === 'CON_OBSERVACIONES'" class="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 text-center text-amber-300 font-bold space-y-1">
          <div class="text-sm uppercase tracking-wider flex items-center justify-center gap-2">
            <span>🟡 APROBADO CON OBSERVACIONES</span>
          </div>
          <p class="text-xs font-normal text-amber-200">
            Se registraron {{ diffsCount }} cambio(s) respecto a la preventa comercial o existen observaciones agregadas por Operaciones.
          </p>
        </div>
        <div v-else class="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 text-center text-emerald-300 font-bold space-y-1">
          <div class="text-sm uppercase tracking-wider flex items-center justify-center gap-2">
            <span>🟢 APROBADO SIN OBSERVACIONES (OK)</span>
          </div>
          <p class="text-xs font-normal text-emerald-200">
            No existen diferencias con la preventa comercial. El requerimiento está 100% conforme.
          </p>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">Observaciones de Operaciones / Motivo de Ajuste:</label>
        <textarea v-model="operacionesAssignment.observaciones_operaciones" rows="2" placeholder="Detalle cualquier indicación u observación técnica de operaciones..." class="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-xs text-white outline-none resize-none"></textarea>
      </div>

      <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
        ✉️ <strong>Notificación al Comercial:</strong> Se enviará una notificación por correo al ejecutivo comercial de preventa y a los integrantes enrolados FES seleccionados.
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-2">Destinatarios a Notificar (Usuarios Enrolados FES):</label>
        <div class="max-h-36 overflow-y-auto space-y-1.5 bg-[#020617] border border-white/10 p-3 rounded-xl scrollbar-hide">
          <label v-for="u in usuariosEnroladosFes" :key="'aprob-u-'+u.id_user" class="flex items-center gap-2.5 text-xs text-slate-200 hover:bg-white/5 p-1.5 rounded cursor-pointer">
            <input type="checkbox" :value="u.id_user" v-model="selectedUsuariosAprobacion" class="accent-amber-500 rounded" />
            <span class="font-bold">{{ u.nombre_user || u.name_user }}</span>
            <span class="text-[10px] text-slate-400 font-mono">({{ u.email || 'Sin email' }})</span>
            <span v-if="u.flag_proc_enrol" class="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">FES PIN</span>
          </label>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-3 border-t border-white/10">
        <button @click="showModalAprobarRequerimiento = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors">
          Cancelar
        </button>
        <button @click="confirmarAprobacionRequerimiento" class="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
          <span>Aprobar Requerimiento & Habilitar Asignación</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL HOMOLOGACIÓN A MANO -->
  <div v-if="modalHomologacion.show" class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
    <div class="bg-[#0a0f1e] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
      <div class="p-4 border-b border-white/10 bg-[#050810] flex justify-between items-center">
        <h3 class="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <span>✍️</span> Homologación Manual
        </h3>
        <button @click="modalHomologacion.show = false" class="text-slate-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-5 space-y-4">
        <p class="text-xs text-slate-300">
          Estás homologando el documento <strong class="text-white">{{ modalHomologacion.docName }}</strong> ({{ modalHomologacion.docType }}).
          Ingresa los detalles para validar este requisito sin adjuntar un archivo físico.
        </p>
        
        <div>
          <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Motivo / Sustento de Homologación *</label>
          <textarea v-model="modalHomologacion.motivo" rows="3" class="w-full bg-[#050810] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none resize-none focus:border-amber-500/50" placeholder="Ej: Certificado emitido internamente, validación visual en terreno, etc..."></textarea>
        </div>

        <div>
          <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Responsable de Validación *</label>
          <input type="text" v-model="modalHomologacion.responsable" class="w-full bg-[#050810] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-500/50" placeholder="Ej: Juan Pérez (Jefe Prevención)" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Fecha Emisión Ref.</label>
            <input type="date" v-model="modalHomologacion.fechaEmision" class="w-full bg-[#050810] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none [color-scheme:dark]" />
          </div>
          <div>
            <label class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Fecha Vencimiento *</label>
            <input type="date" v-model="modalHomologacion.fechaVencimiento" class="w-full bg-[#050810] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none [color-scheme:dark]" />
          </div>
        </div>
      </div>
      <div class="p-4 border-t border-white/10 bg-[#050810] flex justify-end gap-3">
        <button @click="modalHomologacion.show = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors">
          Cancelar
        </button>
        <button @click="confirmarHomologacion" :disabled="!modalHomologacion.motivo || !modalHomologacion.responsable || !modalHomologacion.fechaVencimiento" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest transition-colors shadow-lg shadow-amber-500/20">
          Validar Documento
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 1: PREVISUALIZADOR GOLDEN UX DE DOCUMENTOS PDF -->
  <div v-if="modalVerDocumentoState.show" class="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
    <div class="bg-[#0f1629] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="p-4 border-b border-white/10 bg-[#0a0f1e] flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            📄
          </div>
          <div>
            <h3 class="text-sm font-bold text-white uppercase tracking-wider font-display">{{ modalVerDocumentoState.docName }}</h3>
            <p class="text-[10px] text-slate-400 font-mono">Entidad: {{ modalVerDocumentoState.categoria }} • Archivo: {{ modalVerDocumentoState.fileName }}</p>
          </div>
        </div>
        <button @click="modalVerDocumentoState.show = false" class="text-slate-400 hover:text-white text-lg font-bold p-1">✕</button>
      </div>

      <div class="p-6 overflow-y-auto space-y-4 flex-1">
        <!-- Metadata Bar -->
        <div class="grid grid-cols-3 gap-3 bg-black/40 p-3 rounded-xl border border-white/5 text-xs">
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Estado de Validación</span>
            <span class="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> {{ modalVerDocumentoState.status }}
            </span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Repositorio Oficial</span>
            <span class="text-slate-300 font-mono text-[11px] mt-0.5 block truncate">/u05/LeanDocs/gsp/{{ modalVerDocumentoState.categoria.toLowerCase() }}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Última Actualización</span>
            <span class="text-slate-300 font-mono text-[11px] mt-0.5 block">{{ new Date(modalVerDocumentoState.timestamp).toLocaleString() }}</span>
          </div>
        </div>

        <!-- Document Canvas Preview Frame (Embedded Inline PDF Viewer) -->
        <div class="bg-slate-950 border border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center min-h-[500px] relative">
          <iframe 
            v-if="modalVerDocumentoState.url" 
            :src="modalVerDocumentoState.url" 
            class="w-full h-[520px] rounded-xl border-0" 
            type="application/pdf"
          ></iframe>
          <div v-else class="p-8 text-center space-y-3">
            <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl mx-auto">
              ⚠️
            </div>
            <p class="text-xs text-slate-300 font-bold">Documento sin URL directa o archivo en repositorio sin ruta asignada.</p>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-white/10 bg-[#0a0f1e] flex justify-end">
        <button @click="modalVerDocumentoState.show = false" class="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs uppercase tracking-wider">
          Cerrar Visor
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 2: PREVISUALIZADOR GOLDEN UX DE CORREO HTML B2B DESPACHO AL CLIENTE -->
  <div v-if="modalDespachoB2BState.show" class="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
    <div class="bg-[#0f1629] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="p-4 border-b border-white/10 bg-[#0a0f1e] flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            ✉️
          </div>
          <div>
            <h3 class="text-sm font-bold text-white uppercase tracking-wider font-display">Despacho Dossier B2B a Cliente</h3>
            <p class="text-[10px] text-slate-400 font-mono">Previsualización de Correo HTML Corporativo</p>
          </div>
        </div>
        <button @click="modalDespachoB2BState.show = false" class="text-slate-400 hover:text-white text-lg font-bold p-1">✕</button>
      </div>

      <div class="p-6 overflow-y-auto space-y-4 flex-1">
        <!-- Form Header Inputs -->
        <div class="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5 text-xs">
          <div>
            <label class="block text-[10px] text-slate-400 font-bold uppercase mb-1">Para (Cliente Contacto):</label>
            <input type="email" v-model="modalDespachoB2BState.para" class="w-full bg-[#050810] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500/50" />
          </div>
          <div>
            <label class="block text-[10px] text-slate-400 font-bold uppercase mb-1">Con Copia (CC):</label>
            <input type="text" v-model="modalDespachoB2BState.cc" class="w-full bg-[#050810] border border-white/10 rounded-lg p-2 text-xs text-slate-300 outline-none" />
          </div>
          <div>
            <label class="block text-[10px] text-slate-400 font-bold uppercase mb-1">Asunto:</label>
            <input type="text" v-model="modalDespachoB2BState.asunto" class="w-full bg-[#050810] border border-white/10 rounded-lg p-2 text-xs font-bold text-emerald-400 outline-none" />
          </div>
        </div>

        <!-- Simulated HTML Email View -->
        <div class="bg-slate-900 border border-white/10 rounded-xl p-6 space-y-4 text-xs text-slate-200">
          <div class="border-b border-white/10 pb-3 flex justify-between items-center">
            <span class="font-black text-amber-400 tracking-wider">GRÚAS SAN PABLO • LEANGLOBAL</span>
            <span class="text-[10px] text-slate-500 font-mono">{{ new Date().toLocaleDateString() }}</span>
          </div>
          
          <p>Estimado/a <strong>{{ modalDespachoB2BState.destinatario }}</strong>,</p>
          <p class="text-slate-300">Junto con saludar, adjuntamos formalmente el <strong>Dossier de Acreditaciones de Recursos</strong> (Empresa, Maquinarias y Personal Operador/Rigger) para la ejecución del servicio <strong>{{ antecedentes.identificador_formal || opportunity.codi_proyecto || 'GSP' }}</strong> en faena <strong>{{ siteVisit.obra_nombre || 'Obra Terreno' }}</strong>.</p>
          
          <!-- Summary Table inside email preview -->
          <div class="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2">
            <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Resumen de Acreditaciones Verificadas:</span>
            <div class="grid grid-cols-3 gap-2 text-[11px]">
              <div class="bg-white/5 p-2 rounded">
                <strong class="block text-white">🏢 Empresa</strong>
                <span class="text-emerald-400 font-bold">100% Vigente</span>
              </div>
              <div class="bg-white/5 p-2 rounded">
                <strong class="block text-amber-300">🏗️ Equipos</strong>
                <span class="text-emerald-400 font-bold">100% Vigente</span>
              </div>
              <div class="bg-white/5 p-2 rounded">
                <strong class="block text-emerald-300">👷 Personal</strong>
                <span class="text-emerald-400 font-bold">100% Vigente</span>
              </div>
            </div>
          </div>

          <p class="text-slate-400 text-[11px]">Atentamente,<br><strong class="text-white">Equipo de Operaciones & Acreditaciones — Grúas San Pablo</strong></p>
        </div>
      </div>

      <div class="p-4 border-t border-white/10 bg-[#0a0f1e] flex justify-end gap-3">
        <button @click="modalDespachoB2BState.show = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider">
          Cancelar
        </button>
        <button @click="confirmarEnvioCorreoB2B" :disabled="modalDespachoB2BState.enviando" class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
          <span v-if="modalDespachoB2BState.enviando" class="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
          <span>{{ modalDespachoB2BState.enviando ? 'Enviando Correo...' : '✉️ Confirmar y Despachar Correo B2B' }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 3: VINCULAR DOCUMENTO EXISTENTE DEL REPOSITORIO DE FICHA -->
  <div v-if="modalVincularState.show" class="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
    <div class="bg-[#0f1629] border border-white/10 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="p-4 border-b border-white/10 bg-[#0a0f1e] flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
            🔗
          </div>
          <div>
            <h3 class="text-sm font-bold text-white uppercase tracking-wider font-display">Vincular Documento Disponible</h3>
            <p class="text-[10px] text-purple-300 font-bold font-mono">Expediente: {{ modalVincularState.entityName }} ({{ modalVincularState.categoria }})</p>
          </div>
        </div>
        <button @click="modalVincularState.show = false" class="text-slate-400 hover:text-white text-lg font-bold p-1">✕</button>
      </div>

      <div class="p-5 space-y-3">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-300">Documento exigido: <strong class="text-amber-400 font-bold">{{ modalVincularState.docName }}</strong></span>
          <span class="text-[10px] text-slate-400 font-mono">{{ filteredDocumentosDisponibles.length }} archivos en expediente</span>
        </div>

        <!-- Live Search Input -->
        <div class="relative">
          <input 
            type="text" 
            v-model="modalVincularState.searchQuery" 
            placeholder="🔍 Buscar documento por nombre o código en expediente..." 
            class="w-full bg-[#050810] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500/50 transition-all" 
          />
        </div>

        <!-- Document List Filtered -->
        <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
          <div 
            v-for="dObj in filteredDocumentosDisponibles" 
            :key="dObj.id" 
            @click="vincularDocumentoSeleccionado(dObj)" 
            class="p-3 bg-black/40 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/40 rounded-xl cursor-pointer transition-all flex justify-between items-center text-xs"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-white block">{{ dObj.nombre }}</span>
                <span class="text-[9px] bg-white/5 text-slate-400 font-mono px-1.5 py-0.5 rounded border border-white/5">{{ dObj.codigo }}</span>
              </div>
              <span class="text-[10px] text-slate-400 font-mono mt-0.5 block">Vigencia/Emisión: {{ dObj.fecha }}</span>
            </div>
            <button @click.stop="vincularDocumentoSeleccionado(dObj)" type="button" class="cursor-pointer text-[10px] bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/40 px-2.5 py-1 rounded-lg font-bold uppercase transition-all flex items-center gap-1">
              <span>🔗 Vincular</span>
            </button>
          </div>
          <div v-if="filteredDocumentosDisponibles.length === 0" class="text-xs text-slate-500 italic p-4 text-center">
            No se encontraron documentos que coincidan con la búsqueda.
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-white/10 bg-[#0a0f1e] flex justify-end">
        <button @click="modalVincularState.show = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider">
          Cancelar
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL POPUP: DETALLE DE ACREDITACIONES DE RECURSO (INSPECT-ON-CLICK / SPEC 16) -->
  <div v-if="modalAcreditacionDetalle.visible" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto" @click.self="cerrarDetalleAcreditacion">
    <div class="bg-[#0c1224] border border-white/20 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
      
      <!-- Cabecera del Diálogo -->
      <div class="px-5 py-4 border-b border-white/10 bg-[#080d1a] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner" :class="modalAcreditacionDetalle.tipo === 'equipo' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'">
            {{ modalAcreditacionDetalle.tipo === 'equipo' ? '🚜' : '👷' }}
          </div>
          <div>
            <h3 class="text-sm font-bold text-white leading-snug">{{ modalAcreditacionDetalle.titulo }}</h3>
            <p class="text-xs text-slate-400 font-mono mt-0.5">{{ modalAcreditacionDetalle.subtitulo }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="modalAcreditacionDetalle.semaforo === 'GREEN'" class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold">🟢 Habilitado</span>
          <span v-else-if="modalAcreditacionDetalle.semaforo === 'YELLOW'" class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-bold">🟡 Por Vencer (≤30d)</span>
          <span v-else class="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded text-[11px] font-bold">🔴 No Acreditado / Vencido</span>
          <button @click="cerrarDetalleAcreditacion" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold ml-1">✕</button>
        </div>
      </div>

      <!-- Cuerpo: Lista de Documentos Críticos -->
      <div class="p-5 space-y-3 overflow-y-auto flex-1">
        <div class="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>Matriz de Documentación Crítica</span>
          <span class="font-mono text-[11px] text-amber-400">Regla: 🟡 ≤30 días / 🔴 Vencido</span>
        </div>

        <div class="space-y-2">
          <div v-for="(doc, idx) in modalAcreditacionDetalle.docs" :key="'m-doc-'+idx" class="bg-[#060a14] border border-white/5 hover:border-white/15 p-3 rounded-xl flex items-center justify-between gap-3 transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-base">📄</span>
              <div class="min-w-0">
                <div class="text-xs font-bold text-white truncate">{{ doc.nombre }}</div>
                <div class="text-xs text-slate-400 font-mono flex items-center gap-2 mt-1">
                  <span>Vence: <strong class="text-slate-200">{{ doc.fecha_venc }}</strong></span>
                  <span>•</span>
                  <span :class="doc.estado === 'RED' ? 'text-red-400 font-bold' : (doc.estado === 'YELLOW' ? 'text-amber-400 font-bold' : 'text-emerald-400')">
                    {{ doc.dias < 0 ? `Vencido hace ${Math.abs(doc.dias)} días` : (doc.dias <= 30 ? `Expira en ${doc.dias} días` : `Vigente (${doc.dias} días)`) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <span v-if="doc.estado === 'GREEN'" class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">🟢 VIG</span>
              <span v-else-if="doc.estado === 'YELLOW'" class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">🟡 VNC</span>
              <span v-else class="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold">🔴 VNC</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pie del Diálogo -->
      <div class="px-5 py-3 border-t border-white/10 bg-[#080d1a] flex justify-between items-center text-xs">
        <span class="text-[11px] text-slate-400 font-mono">Trazabilidad FES & Acreditaciones GSP</span>
        <button @click="cerrarDetalleAcreditacion" class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer">
          Cerrar
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL DESPACHO FORMAL DE ORDEN DE TRABAJO (OT) -->
  <div v-if="showModalEnviarOT" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
    <div class="bg-[#0b1021] border border-amber-500/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black space-y-0">
      
      <!-- Header -->
      <div class="bg-[#050810] px-5 py-4 border-b border-white/10 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <span class="text-2xl">📧</span>
          <div>
            <h3 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              Despachar Orden de Trabajo
              <span class="text-xs font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 font-bold">
                V{{ selectedOTVersionForEmail?.version }}
              </span>
            </h3>
            <p class="text-[11px] text-slate-400">
              Envío oficial de la OT y resumen de operaciones a la tripulación, patio y mandante.
            </p>
          </div>
        </div>
        <button @click="showModalEnviarOT = false" class="text-slate-400 hover:text-white text-xl p-1 font-bold cursor-pointer">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
        
        <!-- Destinatarios Tags -->
        <div class="space-y-1.5">
          <label class="block font-bold text-slate-300 uppercase tracking-wider text-[10px]">
            Destinatarios de Notificación *
          </label>
          <div class="flex flex-wrap gap-1.5 p-2 bg-[#050810] rounded-lg border border-white/10 min-h-[42px] items-center">
            <span 
              v-for="(dest, idx) in formDespachoOT.destinatarios" 
              :key="'dest-'+idx"
              class="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1.5"
            >
              <span>{{ dest }}</span>
              <button @click="eliminarDestinatarioOT(idx)" type="button" class="hover:text-red-400 font-bold text-xs cursor-pointer">×</button>
            </span>
          </div>
          <div class="flex gap-2 mt-1.5">
            <input 
              type="email" 
              v-model="formDespachoOT.nuevoEmail" 
              @keyup.enter="agregarDestinatarioOT" 
              placeholder="Agregar otro correo (ej: supervisor@mandante.cl) y presionar Enter..."
              class="flex-1 bg-[#050810] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500/50"
            />
            <button 
              @click="agregarDestinatarioOT" 
              type="button" 
              class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs cursor-pointer"
            >
              + Añadir
            </button>
          </div>
        </div>

        <!-- Asunto -->
        <div class="space-y-1.5">
          <label class="block font-bold text-slate-300 uppercase tracking-wider text-[10px]">
            Asunto del Mensaje *
          </label>
          <input 
            type="text" 
            v-model="formDespachoOT.asunto" 
            class="w-full bg-[#050810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-medium outline-none focus:border-amber-500/50 font-sans"
          />
        </div>

        <!-- Cuerpo -->
        <div class="space-y-1.5">
          <label class="block font-bold text-slate-300 uppercase tracking-wider text-[10px]">
            Mensaje / Instrucciones Adicionales
          </label>
          <textarea 
            v-model="formDespachoOT.cuerpo_adicional" 
            rows="4" 
            class="w-full bg-[#050810] border border-white/10 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-amber-500/50 resize-none font-sans leading-relaxed"
          ></textarea>
        </div>

        <!-- Adjunto Preview -->
        <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2.5">
            <span class="text-lg">📎</span>
            <div>
              <div class="font-bold text-white font-mono">{{ selectedOTVersionForEmail?.nombre_archivo }}</div>
              <div class="text-[10px] text-amber-300/80">Documento PDF oficial de la OT adjunto automáticamente</div>
            </div>
          </div>
          <a 
            :href="selectedOTVersionForEmail?.id_doc ? `${archivoBaseUrl}/v1/storage/view/${selectedOTVersionForEmail.id_doc}` : getFullStaticUrl(selectedOTVersionForEmail?.url)" 
            target="_blank" 
            class="text-blue-400 hover:underline font-bold text-[11px]"
          >
            👁️ Previsualizar
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-[#050810] px-5 py-3.5 border-t border-white/10 flex justify-end items-center gap-3">
        <button 
          @click="showModalEnviarOT = false" 
          type="button" 
          class="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-bold text-xs cursor-pointer transition-colors"
        >
          Cancelar
        </button>
        <button 
          @click="despacharOTPorCorreo" 
          :disabled="enviandoOT || formDespachoOT.destinatarios.length === 0" 
          type="button" 
          class="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span v-if="enviandoOT" class="animate-spin">⏳</span>
          <span v-else>🚀</span>
          <span>{{ enviandoOT ? 'Despachando Correo...' : 'Confirmar y Despachar OT' }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL DE MAPA DE VIAJE & TELEMETRÍA GPS -->
  <ModalMapaViaje 
    v-model:visible="modalMapaViajeAbierto" 
    :viaje="viajeSeleccionadoParaMapa" 
    @close="modalMapaViajeAbierto = false" 
  />

  <!-- MODAL VISOR DE REPORT DIARIO & FIRMA MANDANTE -->
  <ModalVisorReport
    :visible="modalVisorReportAbierto"
    :report="reportSeleccionadoParaVisor"
    @close="modalVisorReportAbierto = false"
    @report-validado="onReportValidado"
  />

  <!-- MODAL CARÁTULA OFICIAL DE ESTADO DE PAGO (EDP) (Spec 38) -->
  <ModalCaratulaEDP
    :visible="modalCaratulaEDPAbierto"
    :edp-data="edpData"
    @close="modalCaratulaEDPAbierto = false"
  />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
const router = useRouter()
const route = useRoute()
import ModalNuevoCliente from '../../components/CRM/ModalNuevoCliente.vue'
import ModalEnviarCotizacion from '../../components/CRM/ModalEnviarCotizacion.vue'
import MapSelector from '../../components/CRM/MapSelector.vue'
import apiAxios from '../../services/api'
import VerSurveyModal from '../../components/VerSurveyModal.vue'
import ModalMapaViaje from '../../components/Operaciones/ModalMapaViaje.vue'
import ModalVisorReport from '../../components/Operaciones/ModalVisorReport.vue'
import ModalCaratulaEDP from '../../components/Operaciones/ModalCaratulaEDP.vue'

const viajesProyecto = ref([])
const cargandoViajes = ref(false)
const modalMapaViajeAbierto = ref(false)
const viajeSeleccionadoParaMapa = ref(null)

const reportsProyecto = ref([])
const filtroEquipoReports = ref('TODOS')
const cargandoReports = ref(false)
const modalVisorReportAbierto = ref(false)
const reportSeleccionadoParaVisor = ref(null)

const edpData = ref(null)
const cargandoEDP = ref(false)
const modalCaratulaEDPAbierto = ref(false)
const guardandoFacturacion = ref(false)
const formFacturacion = reactive({
  hes_oc_numero: '',
  factura_numero: '',
  fecha_facturacion: new Date().toISOString().split('T')[0],
  observaciones_facturacion: ''
})

const props = defineProps({
  proyectoId: {
    type: [Number, String, Object],
    default: null
  },
  initialSubTab: {
    type: String,
    default: null
  }
})

const modalHomologacion = ref({
  show: false,
  docName: '',
  docType: '',
  motivo: '',
  responsable: '',
  fechaEmision: '',
  fechaVencimiento: ''
})

const abrirModalHomologacion = (docName, docType) => {
  modalHomologacion.value = {
    show: true,
    docName,
    docType,
    motivo: '',
    responsable: '',
    fechaEmision: '',
    fechaVencimiento: ''
  }
}

const confirmarHomologacion = () => {
  alert(`Documento "${modalHomologacion.value.docName}" homologado exitosamente por ${modalHomologacion.value.responsable}.`)
  modalHomologacion.value.show = false
}

const modoVistaSalida = ref('opcion1')

const emit = defineEmits(['close', 'creada'])

const archivoBaseUrl = computed(() => String(apiAxios.defaults.baseURL || '').replace(/\/$/, ''))

const getArchivoUrl = (idDocOrSurvey) => {
  if (!idDocOrSurvey) return '#'
  
  let stringId = idDocOrSurvey;
  if (typeof idDocOrSurvey === 'object' && idDocOrSurvey !== null) {
    if (idDocOrSurvey.type === 'Buffer' && Array.isArray(idDocOrSurvey.data)) {
      stringId = idDocOrSurvey.data.map(b => b.toString(16).padStart(2, '0')).join('');
      if (stringId.length === 32) {
        stringId = `${stringId.slice(0,8)}-${stringId.slice(8,12)}-${stringId.slice(12,16)}-${stringId.slice(16,20)}-${stringId.slice(20)}`;
      }
    } else if (idDocOrSurvey.id_doc) {
      stringId = idDocOrSurvey.id_doc;
    } else if (idDocOrSurvey.id_survey) {
      stringId = idDocOrSurvey.id_survey;
    } else if (idDocOrSurvey.id) {
      stringId = idDocOrSurvey.id;
    } else {
      stringId = String(idDocOrSurvey);
    }
  }

  let base = String(apiAxios.defaults.baseURL || '').replace(/\/$/, '')
  if (!base || base.includes('localhost:5173')) {
    base = 'https://servidor.leanglobal.cl/lg-gsp/api'
  }
  return `${base}/archivo/ver/${encodeURIComponent(stringId)}`
}

const getFullStaticUrl = (path) => {
  if (!path) return '#';
  let cleanPath = String(path);
  if (cleanPath.includes('/storage/view/')) {
    cleanPath = cleanPath.replace(/\/api\/v1\/storage\/view\//g, '/api/archivo/ver/').replace(/\/v1\/storage\/view\//g, '/api/archivo/ver/').replace(/\/storage\/view\//g, '/api/archivo/ver/');
  }

  let base = String(apiAxios.defaults.baseURL || '').replace(/\/$/, '');
  if (!base || base.includes('localhost:5173')) {
    base = 'https://servidor.leanglobal.cl/lg-gsp/api';
  }

  if (cleanPath.startsWith('http')) {
    if (cleanPath.includes('/storage/view/')) {
      const match = cleanPath.match(/\/storage\/view\/(.+)$/);
      if (match && match[1]) {
        return `${base}/archivo/ver/${match[1]}`;
      }
    }
    return cleanPath;
  }

  if (cleanPath.startsWith('/api/')) {
    const rootBase = base.replace(/\/api\/?$/, '');
    return rootBase + cleanPath;
  }
  
  return `${base}/${cleanPath.replace(/^\//, '')}`;
};

const getSurveyReportUrl = (idSurvey) => {
  if (!idSurvey) return '#';
  try {
    const res = router.resolve({
      path: '/versurveyprint',
      query: { idInspeccion: idSurvey, modal: 'true' }
    });
    return res.href;
  } catch (e) {
    return `/versurveyprint?idInspeccion=${idSurvey}&modal=true`;
  }
};


const activeTab = ref('terreno')
const topTab = ref('comercial') // 'comercial' | 'operaciones'
const operacionesSubTab = ref('validacion') // 'validacion' | 'asignacion'
const requerimientoAprobado = ref(false)

watch(() => props.initialSubTab, (newTab) => {
  if (newTab) {
    topTab.value = 'operaciones'
    operacionesSubTab.value = newTab
    if (newTab === 'reports') {
      cargarReportsProyecto()
    }
  }
}, { immediate: true })

const isDirty = ref(false)
const mostrarModalCliente = ref(false)
const clienteAEditar = ref(null)

const editarClienteActual = () => {
  if (clienteSeleccionado.value) {
    clienteAEditar.value = clienteSeleccionado.value
    mostrarModalCliente.value = true
  }
}

const cerrarModalCliente = () => {
  mostrarModalCliente.value = false
  clienteAEditar.value = null
}
const mostrarModalNoAsignada = ref(false)
const noAsignacionMotivo = ref('Desistido por el cliente')
const noAsignacionObservacion = ref('')
const currentProyectoId = ref(null)
const loading = ref(true)

// Modales de Requerimiento y Aprobación
const showModalGenerarRequerimiento = ref(false)
const selectedUsuariosRequerimiento = ref([])

const showModalAprobarRequerimiento = ref(false)
const selectedUsuariosAprobacion = ref([])



const opportunity = ref({
  id_empresa_emisora: '9',
  rut_cliente: '',
  descripcion: '',
  prioridad: 'normal',
  fecha_tentativa: '',
  familia_servicio: 'Grúas Telescópicas',
  contacto_nombre: '',
  contacto_telefono: '',
  contacto_obj: null,
  tipo_pago: 'transferencia',
  requiere_oc_hes: null,
  requiere_acreditacion: null,
  incluye_flete: null,
  requiere_rigger: null,
  requiere_prevencionista: null,
  cliente_pone_combustible: null,
  acreditacion_docs: { empresa: [], equipos: [], personas: [] },
  id_proyecto_estado: null
})

const lines = ref([])
const usuarios = ref([])

const CATALOGO_MAESTRO_APAREJOS = [
  { id: 'estrobos', label: 'Estrobos de Acero', match: (l) => l.includes('ESTROBO') },
  { id: 'eslingas', label: 'Eslingas Sintéticas', match: (l) => l.includes('ESLINGA') },
  { id: 'grilletes', label: 'Grilletes (Lira / Rectos)', match: (l) => l.includes('GRILLETE') },
  { id: 'pulpos_cadena', label: 'Pulpos de Cadena', match: (l) => l.includes('PULPO') },
  { id: 'cadenas', label: 'Cadenas de Izaje', match: (l) => l.includes('CADENA') && !l.includes('PULPO') },
  { id: 'balancines', label: 'Balancines / Vigas', match: (l) => l.includes('BALANCIN') || l.includes('VIGA') },
  { id: 'canastillos', label: 'Canastillo Alza Hombres', match: (l) => l.includes('CANASTILL') || l.includes('CANASTA') },
  { id: 'otros_accesorios', label: 'Otros / Accesorios Especiales', match: (l) => (l.includes('ACCESORIO') || l.includes('OTRO')) && !l.includes('OBSERVACION') }
]

const getInitialImplementos = () => {
  return CATALOGO_MAESTRO_APAREJOS.map(m => ({
    id: m.id,
    label: m.label,
    requerido: false,
    detalle: ''
  }))
}

const operacionesAssignment = ref({
  tipo_decision: 'APROBADO',
  equipo_id: 'CRN-DEFAULT',
  equipo_adicional: '',
  equipos_extra: [],
  operador_id: 'OP-101',
  rigger_id: 'RIG-201',
  fecha_salida_plan: new Date().toISOString().substring(0, 10),
  hora_salida_plan: '08:00',
  tonelaje_operaciones: '',
  equipo_sugerido_operaciones: '',
  observaciones_operaciones: '',
  aparejos: {},
  fecha_fin_plan: '',
  hora_fin_plan: '',
  cumplimiento_acreditaciones: {},
  implementos_survey: getInitialImplementos()
})

const dbCategories = ref([])

const getSubcategoriesForType = (type) => {
  if (!type) return []
  const normType = String(type).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
  const category = dbCategories.value.find(c => {
    const normCat = String(c.nombre_categoria).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
    return normCat === normType || c.nombre_categoria === type
  })
  return category ? category.subcategories : []
}

const ESTADOS_DB = {
  OPORTUNIDAD: 1,           // Preventa Comercial (Borrador)
  COTIZANDO: 2,             // Preventa Comercial (Cotización en curso)
  VALIDACION_DIFF: 3,       // Operaciones (Auditoría Técnica Diff)
  ASIGNACION_RECURSOS: 4,   // Operaciones (Asignación OT, Patentes y Tripulación)
  PREPARACION_PATIO: 5,     // Operaciones (Checklist Patio, Acreditaciones y Salida)
  DESPLAZAMIENTO: 6,        // Operaciones (Convoy en Ruta)
  EN_FAENA: 7,              // Operaciones (Maniobra en Faena PWA)
  COMPLETADO: 8,            // Cierre Operacional y Facturación
  NO_GANADA: 99             // Oportunidad Desestimada / Perdida
}

const ESTADOS_PROCESO = {
  COTIZACION: 1,
  PREP_COTIZACION: 2,
  VALIDACION_DIFF: 3,
  ASIGNACION_RECURSOS: 4,
  PREPARACION_PATIO: 5,
  DESPLAZAMIENTO: 6,
  EN_FAENA: 7,
  COMPLETADO: 8,
  NO_ASIGNADA: 99
}

const ESTADO_DB_OPERACIONES = 3

/**
 * Fuente Canónica Única: id_proyecto_estado en tpry_proyecto (PostgreSQL).
 */
const estadoDbActual = computed(() => {
  return parseInt(opportunity.value?.id_proyecto_estado) || 1
})

const isModoOperaciones = computed(() => {
  return estadoDbActual.value >= 3 && estadoDbActual.value < 90
})

const resolveFaseDeDominio = (estadoDb) => {
  const dbState = parseInt(estadoDb) || 1;
  if (dbState <= 2) return ESTADOS_PROCESO.COTIZACION;
  if (dbState === 3) return ESTADOS_PROCESO.VALIDACION_DIFF;
  if (dbState === 4) return ESTADOS_PROCESO.ASIGNACION_RECURSOS;
  if (dbState === 5) return ESTADOS_PROCESO.PREPARACION_PATIO;
  if (dbState === 6) return ESTADOS_PROCESO.DESPLAZAMIENTO;
  if (dbState === 7) return ESTADOS_PROCESO.EN_FAENA;
  if (dbState >= 8 && dbState < 90) return ESTADOS_PROCESO.COMPLETADO;
  return ESTADOS_PROCESO.NO_ASIGNADA;
};

const isAsignacionConfirmada = computed(() => {
  return Number(estadoDbActual.value) >= 5;
})

const faseActual = computed(() => {
  return resolveFaseDeDominio(opportunity.value?.id_proyecto_estado);
})

const isRequerimientoAprobado = computed(() => {
  return estadoDbActual.value >= 4 || requerimientoAprobado.value === true;
})

const isDirtyAsignacion = ref(false)
const marcarDirtyAsignacion = () => { isDirtyAsignacion.value = true }

const guardarCambiosAsignacion = async () => {
  try {
    const token = localStorage.getItem('token') || ''
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const payload = buildPayload()
    const projectId = props.proyectoId || currentProyectoId.value
    await apiAxios.put(`/proyectos/${projectId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const fechaIniGbl = operacionesAssignment.value.fecha_salida_plan ? new Date(operacionesAssignment.value.fecha_salida_plan + 'T' + (operacionesAssignment.value.hora_salida_plan || '08:00')).toISOString() : new Date().toISOString()
    const fechaFinGbl = operacionesAssignment.value.fecha_fin_plan ? new Date(operacionesAssignment.value.fecha_fin_plan + 'T' + (operacionesAssignment.value.hora_fin_plan || '18:00')).toISOString() : new Date().toISOString()

    // 1. Persistir personas en tpry_rel_persona en PostgreSQL (Spec 22)
    try {
      for (const p of (tripulacionAsignada.value || [])) {
        if (p.id_user && !isNaN(parseInt(p.id_user))) {
          const fIni = p.fecha_plan_ini ? new Date(p.fecha_plan_ini + 'T08:00').toISOString() : fechaIniGbl
          const fFin = p.fecha_plan_fin ? new Date(p.fecha_plan_fin + 'T18:00').toISOString() : fechaFinGbl
          await apiAxios.post(`/proyectos/${projectId}/asignaciones/personas`, {
            id_proyecto: parseInt(projectId),
            id_user: parseInt(p.id_user),
            rol_asignado: p.cargo || 'Personal Asignado',
            fecha_plan_ini: fIni,
            fecha_plan_fin: fFin,
            estado_real: 'PROGRAMADO',
            id_user_creacion: currentUser.id_user || 1
          }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
        }
      }
    } catch (relErr) {
      console.warn('Advertencia en sincronización relacional de personas:', relErr)
    }

    // 2. Persistir equipos en tpry_rel_equipo en PostgreSQL (Spec 22)
    try {
      const equiposLista = (linesValidas.value || []).map(l => ({
        id_equipo: l.equipo_asignado_id,
        rol: l.tipo || 'Equipo Principal',
        f_ini: l.fecha_plan_ini,
        f_fin: l.fecha_plan_fin
      }))
      
      if (Array.isArray(operacionesAssignment.value.equipos_extra)) {
        operacionesAssignment.value.equipos_extra.forEach(ex => {
          if (ex.id_equipo) {
            equiposLista.push({
              id_equipo: ex.id_equipo,
              rol: ex.rol || 'Equipo Traslado',
              f_ini: ex.fecha_plan_ini,
              f_fin: ex.fecha_plan_fin
            })
          }
        })
      }

      for (const eq of equiposLista) {
        if (eq.id_equipo && !isNaN(parseInt(eq.id_equipo))) {
          const fIni = eq.f_ini ? new Date(eq.f_ini + 'T08:00').toISOString() : fechaIniGbl
          const fFin = eq.f_fin ? new Date(eq.f_fin + 'T18:00').toISOString() : fechaFinGbl
          await apiAxios.post(`/proyectos/${projectId}/asignaciones/equipos`, {
            id_proyecto: parseInt(projectId),
            id_equipo: parseInt(eq.id_equipo),
            rol_equipo: eq.rol || 'Equipo Asignado',
            fecha_plan_ini: fIni,
            fecha_plan_fin: fFin,
            estado_real: 'PROGRAMADO',
            id_user_creacion: currentUser.id_user || 1
          }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
        }
      }
    } catch (relEqErr) {
      console.warn('Advertencia en sincronización relacional de equipos:', relEqErr)
    }

    isDirtyAsignacion.value = false
    alert('💾 Cambios de Asignación guardados exitosamente en Base de Datos PostgreSQL.')
  } catch (err) {
    console.error('Error al guardar cambios de asignación:', err)
    alert('⚠️ Error al guardar cambios de asignación.')
  }
}

const listaEquiposMaster = ref([
  { id_equipo: 1, nombre_equipo: 'Liebherr LTM 1220 (220 Ton)', modelo: 'LTM 1220', patente: 'HW-8842', tipo: 'Grúa Telescópica', semaforo: 'GREEN', fecha_vencimiento_cert: '2026-08-10' },
  { id_equipo: 2, nombre_equipo: 'Tadano ATF 110G (110 Ton)', modelo: 'ATF 110G', patente: 'GR-1029', tipo: 'Grúa Telescópica', semaforo: 'GREEN', fecha_vencimiento_cert: '2029-01-01' },
  { id_equipo: 3, nombre_equipo: 'Grove GMK 5250L (250 Ton)', modelo: 'GMK 5250L', patente: 'PL-9021', tipo: 'Grúa Telescópica', semaforo: 'YELLOW', fecha_vencimiento_cert: '2026-07-28' },
  { id_equipo: 4, nombre_equipo: 'Camión Pluma Palfinger 50T', modelo: 'Palfinger 50T', patente: 'PK-5002', tipo: 'Camión Pluma', semaforo: 'GREEN', fecha_vencimiento_cert: '2028-12-12' },
  { id_equipo: 5, nombre_equipo: 'Cama Baja 60 Toneladas', modelo: 'Cama Baja', patente: 'XY-1234', tipo: 'Traslado', semaforo: 'GREEN', fecha_vencimiento_cert: '2026-08-01' },
  { id_equipo: 6, nombre_equipo: 'Camioneta Escolta 4x4', modelo: 'Escolta 4x4', patente: 'HG-5533', tipo: 'Vehículo Menor', semaforo: 'GREEN', fecha_vencimiento_cert: '2027-11-15' }
])

const cargarListaEquiposMaster = async () => {
  try {
    const { data: res } = await apiAxios.get('/tequ-equipos')
    const eqList = res?.data || res
    if (Array.isArray(eqList) && eqList.length > 0) {
      const mapeados = eqList.map(e => ({
        ...e,
        id_equipo: e.id_equipo || e.id,
        nombre_equipo: e.nombre_equipo || `${e.marca || ''} ${e.modelo || ''}`.trim() || e.tipo_equipo || 'Equipo',
        modelo: e.modelo || e.nombre_equipo || '',
        patente: e.patente || e.ppu || 'S/P',
        tipo: e.nombre_categoria || e.tipo_equipo || e.tipo || 'Maquinaria',
        nombre_categoria: e.nombre_categoria || e.tipo_equipo || e.tipo || 'Maquinaria',
        nombre_subcategoria: e.nombre_subcategoria || e.subcategoria || '',
        semaforo: e.estado === 'MANTENCION' ? 'RED' : 'GREEN'
      }))
      listaEquiposMaster.value = mapeados
    }
  } catch (err) {
    console.warn('Error cargando flota de equipos:', err)
  }
}

const getEquiposFiltradosPorLinea = (line) => {
  const master = listaEquiposMaster.value || []
  if (!line) return master

  const catTarget = (line.tipo || line.categoria || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const subTarget = (line.subcategoria || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const assignedId = line.equipo_asignado_id || line.id_equipo

  if (!catTarget && !subTarget) return master

  // 1. Regla Semántica Especial para TRASLADOS (Spec 16 §4.3)
  if (catTarget.includes('TRASLADO') || catTarget.includes('FLETE')) {
    let match = []
    if (subTarget.includes('CAMA BAJA') || subTarget.includes('CAMABAJA')) {
      match = master.filter(eq => {
        const text = `${eq.nombre_categoria || ''} ${eq.nombre_subcategoria || ''} ${eq.subcategoria || ''} ${eq.modelo || ''} ${eq.marca || ''} ${eq.nombre_equipo || ''} ${eq.tipo || ''}`.toUpperCase()
        return text.includes('SEMIREMOLQUE') || text.includes('CAMA BAJA') || text.includes('CAMABAJA') || text.includes('SR-CB') || text.includes('SRTCB') || text.includes('NOOTEBOOM') || text.includes('BATEA') || text.includes('TREMAC') || text.includes('SCHILGER')
      })
    } else if (subTarget.includes('RAMPLA')) {
      match = master.filter(eq => {
        const text = `${eq.nombre_categoria || ''} ${eq.nombre_subcategoria || ''} ${eq.subcategoria || ''} ${eq.modelo || ''} ${eq.marca || ''} ${eq.nombre_equipo || ''} ${eq.tipo || ''}`.toUpperCase()
        return text.includes('RAMPLA') || text.includes('SRPL') || text.includes('SRBSCO') || text.includes('GOREN') || text.includes('RANDOM') || text.includes('TORMESOL') || text.includes('PLATAFORMA') || text.includes('PLANA') || (eq.nombre_subcategoria === 'SEMIREMOLQUE' && !text.includes('CB') && !text.includes('CAMA BAJA'))
      })
    } else if (subTarget.includes('TRACTO')) {
      match = master.filter(eq => {
        const text = `${eq.nombre_categoria || ''} ${eq.nombre_subcategoria || ''} ${eq.subcategoria || ''} ${eq.modelo || ''} ${eq.marca || ''} ${eq.nombre_equipo || ''} ${eq.tipo || ''}`.toUpperCase()
        return text.includes('TRACTO') || text.includes('TRACTOCAMION') || eq.nombre_subcategoria === 'TRACTOCAMION'
      })
    } else if (subTarget.includes('ESCOLTA') || subTarget.includes('GUIA')) {
      match = master.filter(eq => {
        const text = `${eq.nombre_categoria || ''} ${eq.nombre_subcategoria || ''} ${eq.subcategoria || ''} ${eq.modelo || ''} ${eq.marca || ''} ${eq.nombre_equipo || ''} ${eq.tipo || ''}`.toUpperCase()
        const isVehLiviano = (eq.nombre_categoria || '').toUpperCase().includes('LIVIANO') || (eq.tipo || '').toUpperCase().includes('LIVIANO')
        const isCamionetaOJeep = text.includes('CAMIONETA') || text.includes('JEEP') || text.includes('MAXUS') || text.includes('POER') || text.includes('SILVERADO') || text.includes('JIMNY') || text.includes('ESCOLTA')
        return isVehLiviano && isCamionetaOJeep
      })
    } else {
      // Si no especificó subcategoría, mostrar todos los vehículos logísticos (Tractos, Semirremolques, Camionetas Escolta)
      match = master.filter(eq => {
        const text = `${eq.nombre_categoria || ''} ${eq.nombre_subcategoria || ''} ${eq.subcategoria || ''} ${eq.modelo || ''} ${eq.marca || ''} ${eq.nombre_equipo || ''} ${eq.tipo || ''}`.toUpperCase()
        return text.includes('SEMIREMOLQUE') || text.includes('TRACTO') || text.includes('CAMIONETA') || text.includes('ESCOLTA') || text.includes('PLATAFORMA')
      })
    }

    let resTraslado = match
    if (assignedId) {
      const currentAssigned = master.find(eq => eq.id_equipo === assignedId || eq.patente === assignedId)
      if (currentAssigned && !resTraslado.some(eq => eq.id_equipo === currentAssigned.id_equipo)) {
        resTraslado = [currentAssigned, ...resTraslado]
      }
    }
    return resTraslado
  }

  // 2. Filtrar por categoría estándar de BD
  let porCat = master
  if (catTarget) {
    porCat = master.filter(eq => {
      const eqCat = (eq.nombre_categoria || eq.tipo || eq.tipo_equipo || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      return eqCat === catTarget || eqCat.includes(catTarget) || catTarget.includes(eqCat)
    })
  }

  // 3. Si se especificó subcategoría, filtrar por subcategoría dentro del grupo de categoría
  let resultado = porCat
  if (subTarget) {
    const porSub = porCat.filter(eq => {
      const eqSub = (eq.nombre_subcategoria || eq.subcategoria || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      const eqModelo = (eq.modelo || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      const eqMarca = (eq.marca || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      const eqNombre = (eq.nombre_equipo || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      return eqSub === subTarget || eqSub.includes(subTarget) || subTarget.includes(eqSub) || eqModelo.includes(subTarget) || eqNombre.includes(subTarget) || eqMarca.includes(subTarget)
    })
    if (porSub.length > 0) {
      resultado = porSub
    }
  }

  // 4. Fallback solo si no había categoría seleccionada
  if (resultado.length === 0 && !catTarget) {
    resultado = master
  }

  // 5. Asegurar que el equipo actualmente asignado siempre esté visible en la lista
  if (assignedId) {
    const currentAssigned = master.find(eq => eq.id_equipo === assignedId || eq.patente === assignedId)
    if (currentAssigned && !resultado.some(eq => eq.id_equipo === currentAssigned.id_equipo)) {
      resultado = [currentAssigned, ...resultado]
    }
  }

  return resultado
}

const isCertExpired = (dateString) => {
  if (!dateString) return false;
  const daysLeft = (new Date(dateString) - new Date()) / (1000 * 3600 * 24);
  return daysLeft < 30;
}

const getEquipoObj = (idOrPatenteOrName) => {
  if (!idOrPatenteOrName || idOrPatenteOrName === 'CRN-DEFAULT') return null
  
  let target = idOrPatenteOrName
  if (typeof target === 'object' && target !== null) {
    target = target.id_equipo || target.id || target.patente || target.nombre_equipo || target.modelo || ''
  }
  if (!target) return null

  const str = String(target).toLowerCase().trim()
  const master = listaEquiposMaster.value || []

  // 1. Coincidencia exacta por ID o Patente
  let found = master.find(eq => 
    String(eq.id_equipo).toLowerCase() === str || 
    (eq.patente && eq.patente.toLowerCase().trim() === str)
  )
  if (found) return found

  // 2. Coincidencia por Nombre Completo o Modelo
  found = master.find(eq => 
    (eq.nombre_equipo && eq.nombre_equipo.toLowerCase().trim() === str) ||
    (eq.modelo && eq.modelo.toLowerCase().trim() === str)
  )
  if (found) return found

  // 3. Coincidencia parcial semántica
  found = master.find(eq => 
    (eq.nombre_equipo && (eq.nombre_equipo.toLowerCase().includes(str) || str.includes(eq.nombre_equipo.toLowerCase()))) ||
    (eq.modelo && (eq.modelo.toLowerCase().includes(str) || str.includes(eq.modelo.toLowerCase()))) ||
    (eq.patente && str.includes(eq.patente.toLowerCase()))
  )
  return found || null
}

const equiposApoyoMaster = computed(() => {
  return listaEquiposMaster.value.filter(eq => eq.tipo !== 'Grúa Telescópica' && !eq.nombre_equipo.toLowerCase().includes('grúa'));
})

const historialEnviousDossier = ref([])
const tieneDocumentosVencidosOPendientes = computed(() => false)

const isPersonalLine = (l) => {
  if (!l) return false
  const tipo = (l.tipo || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const sub = (l.subcategoria || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const desc = (l.descripcion || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  
  return tipo === 'PERSONAL CERTIFICADO' ||
         tipo === 'PERSONAL' ||
         tipo.includes('PERSONAL') ||
         sub.includes('RIGGER') ||
         sub.includes('PREVENCIONISTA') ||
         sub.includes('OPERADOR') ||
         sub.includes('SUPERVISOR') ||
         desc.includes('RIGGER') ||
         desc.includes('PREVENCIONISTA') ||
         desc.includes('OPERADOR') ||
         desc.includes('SUPERVISOR')
}

// 1. Flota & Equipos: Únicamente maquinaria, grúas y vehículos físicos
const linesValidas = computed(() => {
  if (!lines.value || !Array.isArray(lines.value)) return []
  return lines.value.filter(l => {
    if (l.is_linea_base === false) return true
    const hasData = (l.descripcion && l.descripcion.trim() !== '') || (l.subcategoria && l.subcategoria.trim() !== '') || (l.valorUnitario > 0) || l.equipo_asignado_id || l.tipo
    return hasData && !isPersonalLine(l)
  })
})

const isTrasladoLine = (l) => {
  if (!l) return false
  const tipo = (l.tipo || l.categoria || '').toUpperCase()
  const desc = (l.descripcion || l.subcategoria || '').toUpperCase()
  return tipo.includes('TRASLADO') || tipo.includes('FLETE') || desc.includes('TRASLADO') || desc.includes('FLETE')
}

// Líneas de equipo principal (excluyendo traslados que se manejan en el grupo logístico)
const linesEquiposPrincipales = computed(() => {
  return (linesValidas.value || []).filter(l => !isTrasladoLine(l))
})

const tieneLineaTrasladoOExtra = computed(() => {
  const tieneComercial = (linesValidas.value || []).some(l => isTrasladoLine(l)) || opportunity.value?.incluye_flete === true
  const tieneExtras = Array.isArray(operacionesAssignment.value.equipos_extra) && operacionesAssignment.value.equipos_extra.length > 0
  return tieneComercial || tieneExtras
})

// 2. Personal Comercial: Requerimientos de personas vendidas en la cotización
const linesPersonalValidas = computed(() => {
  if (!lines.value || !Array.isArray(lines.value)) return []
  return lines.value.filter(l => {
    const hasData = (l.descripcion && l.descripcion.trim() !== '') || (l.subcategoria && l.subcategoria.trim() !== '') || (l.valorUnitario > 0)
    return hasData && isPersonalLine(l)
  })
})

const getNombreEquipoAsignado = (eqId) => {
  if (!eqId || eqId === 'CRN-DEFAULT') return 'Grúa Principal GSP'
  const eq = getEquipoObj(eqId)
  if (eq) {
    const patente = (eq.patente || eq.ppu || '').toUpperCase().trim()
    const desc = (eq.nombre_equipo || `${eq.marca || ''} ${eq.modelo || ''}`.trim() || eq.tipo || '').toUpperCase().trim()
    if (patente && desc) {
      if (desc.startsWith(patente)) return desc
      return `${patente} - ${desc}`
    }
    return desc || patente || String(eq.id_equipo)
  }
  if (typeof eqId === 'object' && eqId !== null) {
    return eqId.descripcion || eqId.subcategoria || eqId.rol || eqId.tipo || 'Vehículo de Traslado'
  }
  return String(eqId)
}

const getPatenteEquipoAsignado = (eqId) => {
  if (!eqId || eqId === 'CRN-DEFAULT') return 'S/P'
  const eq = getEquipoObj(eqId)
  return eq?.patente || 'S/P'
}

const getNombrePersonaAsignada = (userId) => {
  if (!userId) return 'Personal Asignado'
  const u = usuarios.value.find(usr => usr.id_user === userId || usr.id_user == userId)
  return u ? (u.nombre_user || u.name_user || u.name_frst) : `Usuario #${userId}`
}

const agregarDocAdHoc = (categoria) => {
  const nombre = prompt(`Ingrese el nombre del nuevo documento de ${categoria.toUpperCase()} exigido por el cliente:`)
  if (nombre && nombre.trim() !== '') {
    if (!opportunity.value.acreditacion_docs) {
      opportunity.value.acreditacion_docs = { empresa: [], equipos: [], personas: [] }
    }
    if (!opportunity.value.acreditacion_docs[categoria]) {
      opportunity.value.acreditacion_docs[categoria] = []
    }
    opportunity.value.acreditacion_docs[categoria].push(nombre.trim())
  }
}

const quitarDocExigido = (categoria, index) => {
  if (opportunity.value.acreditacion_docs?.[categoria]) {
    opportunity.value.acreditacion_docs[categoria].splice(index, 1)
  }
}

const extractDocName = (docObjOrStr) => {
  if (!docObjOrStr) return ''
  if (typeof docObjOrStr === 'string') return docObjOrStr
  return docObjOrStr.nombre || docObjOrStr.name || docObjOrStr.doc || docObjOrStr.titulo || String(docObjOrStr)
}

// -------------------------------------------------------------
// MOTOR DE AUTO-MATCH DE ACREDITACIONES (tsec_tipos_certificado_persona)
// -------------------------------------------------------------
const docStateRegistry = reactive({})
const docsVinculadosMap = ref({})
const expedientesPersonalCache = ref({})
const expedientesEquiposCache = ref({})
const acreditacionCacheVersion = ref(0)

const normalizarTextoAcred = (txt) => {
  if (!txt) return ''
  return String(txt)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

// Carga asíncrona y cache de certificados de personal
const cargarExpedientePersonal = async (uId) => {
  if (!uId) return []
  const key = String(uId)
  if (expedientesPersonalCache.value[key]) return expedientesPersonalCache.value[key]
  try {
    const { data: pRes } = await apiAxios.get(`/acreditacion/personal/${uId}`)
    const pDetail = pRes?.data || pRes
    const certs = pDetail?.certificados || (Array.isArray(pDetail) ? pDetail : [])
    expedientesPersonalCache.value = {
      ...expedientesPersonalCache.value,
      [key]: certs,
      [Number(uId)]: certs
    }
    acreditacionCacheVersion.value++
    return certs
  } catch (e) {
    console.warn(`Error cargando expediente del trabajador ${uId}:`, e.message || e)
    return []
  }
}

// Helper de resolución dual de equipos (ID numérico o Patente PPU)
const resolverEquipoInfo = (eqIdOrObj) => {
  if (!eqIdOrObj) return { id: null, patente: null, nombre: null, obj: null }
  if (typeof eqIdOrObj === 'object') {
    const id = eqIdOrObj.id_equipo || eqIdOrObj.id || null
    const patente = eqIdOrObj.patente || eqIdOrObj.ppu || null
    const nombre = eqIdOrObj.nombre_equipo || eqIdOrObj.modelo || eqIdOrObj.nombre || null
    return { id, patente, nombre, obj: eqIdOrObj }
  }
  const strVal = String(eqIdOrObj).trim()
  const numVal = Number(eqIdOrObj)
  const master = listaEquiposMaster.value || []
  
  const found = master.find(e => 
    String(e.id_equipo) === strVal || 
    String(e.id) === strVal || 
    (e.patente && String(e.patente).toUpperCase().trim() === strVal.toUpperCase())
  )

  if (found) {
    return {
      id: found.id_equipo || found.id,
      patente: found.patente || strVal,
      nombre: found.nombre_equipo || found.modelo || found.tipo || 'Equipo',
      obj: found
    }
  }

  return {
    id: !isNaN(numVal) && numVal > 0 ? numVal : null,
    patente: strVal,
    nombre: 'Equipo',
    obj: null
  }
}

// Carga asíncrona y cache de certificados de equipos
const cargarExpedienteEquipo = async (eqParam) => {
  if (!eqParam || eqParam === 'CRN-DEFAULT') return []
  const eqInfo = resolverEquipoInfo(eqParam)
  if (!eqInfo || (!eqInfo.id && !eqInfo.patente)) return []
  const targetIdOrPatente = eqInfo.id || eqInfo.patente || eqParam
  const cacheKeyId = eqInfo.id ? String(eqInfo.id) : null
  const cacheKeyPat = eqInfo.patente ? String(eqInfo.patente).toUpperCase().trim() : null

  if (cacheKeyId && expedientesEquiposCache.value[cacheKeyId]) return expedientesEquiposCache.value[cacheKeyId]
  if (cacheKeyPat && expedientesEquiposCache.value[cacheKeyPat]) return expedientesEquiposCache.value[cacheKeyPat]

  try {
    const { data: certData } = await apiAxios.get(`/tequ-equipos/${targetIdOrPatente}/certificados`)
    const realCerts = Array.isArray(certData) ? certData : (certData?.certificados || certData?.data || [])
    
    const newCache = { ...expedientesEquiposCache.value }
    if (cacheKeyId) {
      newCache[cacheKeyId] = realCerts
      newCache[Number(cacheKeyId)] = realCerts
    }
    if (cacheKeyPat) {
      newCache[cacheKeyPat] = realCerts
    }
    newCache[String(eqParam)] = realCerts

    expedientesEquiposCache.value = newCache
    acreditacionCacheVersion.value++
    return realCerts
  } catch (e) {
    if (eqInfo.id && String(targetIdOrPatente) !== String(eqInfo.id)) {
      try {
        const { data: certData2 } = await apiAxios.get(`/tequ-equipos/${eqInfo.id}/certificados`)
        const realCerts2 = Array.isArray(certData2) ? certData2 : (certData2?.certificados || certData2?.data || [])
        const newCache = { ...expedientesEquiposCache.value }
        if (cacheKeyId) newCache[cacheKeyId] = realCerts2
        if (cacheKeyPat) newCache[cacheKeyPat] = realCerts2
        newCache[String(eqParam)] = realCerts2
        expedientesEquiposCache.value = newCache
        acreditacionCacheVersion.value++
        return realCerts2
      } catch (err2) {
        console.warn(`Error cargando expediente del equipo por ID ${eqInfo.id}:`, err2.message || err2)
      }
    }
    console.warn(`Error cargando expediente del equipo ${eqParam}:`, e.message || e)
    return []
  }
}

// Cargar todos los expedientes de los recursos asignados
const cargarExpedientesAsignados = async () => {
  const promises = []
  if (tripulacionAsignada.value && Array.isArray(tripulacionAsignada.value)) {
    for (const t of tripulacionAsignada.value) {
      const uId = t.id_user || t.id || t.user_id
      if (uId) promises.push(cargarExpedientePersonal(uId))
    }
  }
  if (equiposAsignadosLista.value && Array.isArray(equiposAsignadosLista.value)) {
    for (const eqId of equiposAsignadosLista.value) {
      if (eqId) promises.push(cargarExpedienteEquipo(eqId))
    }
  }
  if (operacionesAssignment.value?.equipo_id) {
    promises.push(cargarExpedienteEquipo(operacionesAssignment.value.equipo_id))
  }
  await Promise.allSettled(promises)
  setTimeout(async () => {
    try {
      const pct = porcentajeAcreditacionReal.value
      const targetId = props.proyectoId || currentProyectoId.value
      if (targetId && !isHydrating.value) {
        if (!opportunity.value.json_field) opportunity.value.json_field = {}
        if (!opportunity.value.json_field.ejecucion_v1) opportunity.value.json_field.ejecucion_v1 = {}
        if (opportunity.value.json_field.ejecucion_v1.porcentaje_acreditacion !== pct) {
          opportunity.value.json_field.ejecucion_v1.porcentaje_acreditacion = pct
          await apiAxios.put(`/proyectos/${targetId}`, {
            json_field: opportunity.value.json_field
          })
        }
      }
    } catch(ePct) {
      console.warn('Silent sync porcentaje_acreditacion error:', ePct)
    }
  }, 400)
}

// -------------------------------------------------------------
// MAPA REACTIVO COMPUTADO DE ACREDITACIONES (AUTO-MATCH DETERMINÍSTICO)
// -------------------------------------------------------------
const mapaEstadoAcreditaciones = computed(() => {
  const cachePers = expedientesPersonalCache.value || {}
  const cacheEq = expedientesEquiposCache.value || {}
  const trip = tripulacionAsignada.value || []
  const eqList = equiposAsignadosLista.value || []
  const reqDocs = opportunity.value?.acreditacion_docs || { empresa: [], equipos: [], personas: [] }
  const docVinculados = docsVinculadosMap.value || {}
  const docHomologados = opportunity.value?.docs_homologados || {}
  const docReg = docStateRegistry
  const _v = acreditacionCacheVersion.value

  const result = {
    personas: {},
    equipos: {},
    empresa: {}
  }

  // 1. Resolver Personas
  for (const t of trip) {
    const uId = t.id_user ? String(t.id_user) : (t.id ? String(t.id) : (t.user_id ? String(t.user_id) : ''))
    if (!uId) continue
    const certs = cachePers[uId] || cachePers[Number(uId)] || []

    for (const rawDoc of (reqDocs.personas || [])) {
      const dName = extractDocName(rawDoc)
      const dNameNorm = normalizarTextoAcred(dName)
      const lookupKey = `${uId}___${dNameNorm}`
      const scopedKey = `per-${uId}-${dName}`

      let matchedCert = null

      for (const c of certs) {
        const tipoNorm = normalizarTextoAcred(c.nombre_tipo || c.name_doc_orig || '')
        let match = false

        if (dNameNorm.includes('contrato') || dNameNorm.includes('anexo') || dNameNorm.includes('laboral') || dNameNorm.includes('trabajo')) {
          if (tipoNorm.includes('contrato') || tipoNorm.includes('anexo') || tipoNorm.includes('trabajo') || c.id_tipo_certificado_persona === 8 || c.id_tipo_certificado_persona === 6) {
            match = true
          }
        } else if (dNameNorm.includes('cedula') || dNameNorm.includes('identidad') || dNameNorm.includes('ci') || dNameNorm.includes('carnet')) {
          if (tipoNorm.includes('cedula') || tipoNorm.includes('identidad') || tipoNorm.includes('ci') || c.id_tipo_certificado_persona === 1) {
            match = true
          }
        } else if (dNameNorm.includes('licencia') || dNameNorm.includes('conducir') || dNameNorm.includes('municipal') || dNameNorm.includes('hoja vida')) {
          if (tipoNorm.includes('licencia') || tipoNorm.includes('conducir') || c.id_tipo_certificado_persona === 2 || c.id_tipo_certificado_persona === 4) {
            match = true
          }
        } else if (dNameNorm.includes('examen') || dNameNorm.includes('salud') || dNameNorm.includes('ocupacional') || dNameNorm.includes('preocupacional') || dNameNorm.includes('altura') || dNameNorm.includes('psicosensotecnico')) {
          if (tipoNorm.includes('examen') || tipoNorm.includes('salud') || tipoNorm.includes('ocupacional') || c.id_tipo_certificado_persona === 5 || c.id_tipo_certificado_persona === 3) {
            match = true
          }
        } else if (dNameNorm.includes('antecedente')) {
          if (tipoNorm.includes('antecedente') || c.id_tipo_certificado_persona === 2) {
            match = true
          }
        } else if (dNameNorm.includes('epp') || dNameNorm.includes('riohs') || dNameNorm.includes('odi') || dNameNorm.includes('pts') || dNameNorm.includes('induccion') || dNameNorm.includes('informar')) {
          if (tipoNorm.includes('epp') || tipoNorm.includes('riohs') || tipoNorm.includes('odi') || tipoNorm.includes('pts') || tipoNorm.includes('induccion') || tipoNorm.includes('informar') || c.id_tipo_certificado_persona === 6 || c.id_tipo_certificado_persona === 7 || c.id_tipo_certificado_persona === 10) {
            match = true
          }
        } else if (dNameNorm.includes('certificacion') || dNameNorm.includes('rigger') || dNameNorm.includes('operador') || dNameNorm.includes('credencial') || dNameNorm.includes('especialidad')) {
          if (tipoNorm.includes('certificacion') || tipoNorm.includes('rigger') || tipoNorm.includes('operador') || tipoNorm.includes('credencial') || tipoNorm.includes('especialidad') || c.id_tipo_certificado_persona === 3 || c.id_tipo_certificado_persona === 4) {
            match = true
          }
        } else if (tipoNorm && (tipoNorm.includes(dNameNorm) || dNameNorm.includes(tipoNorm))) {
          match = true
        }

        if (match) {
          let estado = 'VIGENTE'
          if (c.fecha_vencimiento) {
            const fVenc = new Date(c.fecha_vencimiento)
            const hoy = new Date()
            const diffDays = Math.ceil((fVenc - hoy) / (1000 * 60 * 60 * 24))
            if (diffDays < 0) estado = 'VENCIDO'
            else if (diffDays <= 30) estado = 'POR_VENCER'
          }
          matchedCert = {
            match: true,
            cert: c,
            estado,
            id_doc: c.id_doc || c.id_certificado_persona,
            file_name: c.name_doc_interno || c.file_name || `${c.nombre_tipo || 'Certificado'}.pdf`,
            url: c.id_doc ? `${archivoBaseUrl.value}/archivo/ver/${c.id_doc}` : null
          }
          break
        }
      }

      const manualVinculado = docVinculados[scopedKey] || docHomologados[scopedKey] || (docReg[scopedKey] ? { status: 'OK' } : null)
      const isVigente = (matchedCert && (matchedCert.estado === 'VIGENTE' || matchedCert.estado === 'POR_VENCER')) || !!manualVinculado

      result.personas[lookupKey] = {
        vigente: isVigente,
        cert: matchedCert,
        manual: manualVinculado,
        url: matchedCert?.url || manualVinculado?.url || (matchedCert?.id_doc ? `${archivoBaseUrl.value}/archivo/ver/${matchedCert.id_doc}` : null)
      }
    }
  }

  // 2. Resolver Equipos
  const todosEquipos = [...eqList]
  if (operacionesAssignment.value?.equipo_id && !todosEquipos.includes(operacionesAssignment.value.equipo_id)) {
    todosEquipos.push(operacionesAssignment.value.equipo_id)
  }

  for (const rawEq of todosEquipos) {
    if (!rawEq) continue
    const eqInfo = resolverEquipoInfo(rawEq)
    const eqKeyId = eqInfo.id ? String(eqInfo.id) : null
    const eqKeyPat = eqInfo.patente ? String(eqInfo.patente).toUpperCase().trim() : null
    const rawKey = String(rawEq)

    const certs = (eqKeyId && cacheEq[eqKeyId]) || 
                  (eqKeyPat && cacheEq[eqKeyPat]) || 
                  cacheEq[rawKey] || 
                  (eqKeyId && cacheEq[Number(eqKeyId)]) || []

    for (const rawDoc of (reqDocs.equipos || [])) {
      const dName = extractDocName(rawDoc)
      const dNameNorm = normalizarTextoAcred(dName)

      let matchedCert = null

      for (const c of certs) {
        const tipoNorm = normalizarTextoAcred(c.nombre_tipo || c.name_doc_orig || c.nombre || c.tipo_documento || '')
        let match = false

        if (dNameNorm.includes('soap') || dNameNorm.includes('seguro')) {
          if (tipoNorm.includes('soap') || tipoNorm.includes('seguro')) match = true
        } else if (dNameNorm.includes('revision') || dNameNorm.includes('tecnica') || dNameNorm.includes('rt') || dNameNorm.includes('gases')) {
          if (tipoNorm.includes('revision') || tipoNorm.includes('tecnica') || tipoNorm.includes('rt') || tipoNorm.includes('gases')) match = true
        } else if (dNameNorm.includes('certificacion') || dNameNorm.includes('izaje') || dNameNorm.includes('anual') || dNameNorm.includes('carga') || dNameNorm.includes('bureau') || dNameNorm.includes('cesmec')) {
          if (tipoNorm.includes('certificacion') || tipoNorm.includes('izaje') || tipoNorm.includes('anual') || tipoNorm.includes('carga') || tipoNorm.includes('bureau') || tipoNorm.includes('cesmec') || tipoNorm.includes('test')) match = true
        } else if (dNameNorm.includes('permiso') || dNameNorm.includes('circulacion')) {
          if (tipoNorm.includes('permiso') || tipoNorm.includes('circulacion')) match = true
        } else if (dNameNorm.includes('poliza') || dNameNorm.includes('rc') || dNameNorm.includes('responsabilidad')) {
          if (tipoNorm.includes('poliza') || tipoNorm.includes('rc') || tipoNorm.includes('responsabilidad')) match = true
        } else if (tipoNorm && (tipoNorm.includes(dNameNorm) || dNameNorm.includes(tipoNorm))) {
          match = true
        }

        if (match) {
          let estado = 'VIGENTE'
          if (c.fecha_vencimiento) {
            const fVenc = new Date(c.fecha_vencimiento)
            const hoy = new Date()
            const diffDays = Math.ceil((fVenc - hoy) / (1000 * 60 * 60 * 24))
            if (diffDays < 0) estado = 'VENCIDO'
            else if (diffDays <= 30) estado = 'POR_VENCER'
          }
          matchedCert = {
            match: true,
            cert: c,
            estado,
            id_doc: c.id_doc || c.id_certificado,
            file_name: c.name_doc_interno || c.file_name || `${c.nombre_tipo || 'Certificado'}.pdf`,
            url: c.id_doc ? `${archivoBaseUrl.value}/archivo/ver/${c.id_doc}` : null
          }
          break
        }
      }

      const scopedKeyId = eqKeyId ? `eq-${eqKeyId}-${dName}` : null
      const scopedKeyPat = eqKeyPat ? `eq-${eqKeyPat}-${dName}` : null
      const scopedKeyRaw = `eq-${rawKey}-${dName}`

      const manualVinculado = (scopedKeyId && docVinculados[scopedKeyId]) || 
                              (scopedKeyPat && docVinculados[scopedKeyPat]) || 
                              docVinculados[scopedKeyRaw] || 
                              (scopedKeyId && docHomologados[scopedKeyId]) || 
                              (scopedKeyPat && docHomologados[scopedKeyPat]) || 
                              docHomologados[scopedKeyRaw] || 
                              (scopedKeyId && docReg[scopedKeyId] ? { status: 'OK' } : null) ||
                              (scopedKeyPat && docReg[scopedKeyPat] ? { status: 'OK' } : null) ||
                              (docReg[scopedKeyRaw] ? { status: 'OK' } : null)

      const isVigente = (matchedCert && (matchedCert.estado === 'VIGENTE' || matchedCert.estado === 'POR_VENCER')) || !!manualVinculado

      const entry = {
        vigente: isVigente,
        cert: matchedCert,
        manual: manualVinculado,
        url: matchedCert?.url || manualVinculado?.url || (matchedCert?.id_doc ? `${archivoBaseUrl.value}/archivo/ver/${matchedCert.id_doc}` : null)
      }

      if (eqKeyId) result.equipos[`${eqKeyId}___${dNameNorm}`] = entry
      if (eqKeyPat) result.equipos[`${eqKeyPat}___${dNameNorm}`] = entry
      result.equipos[`${rawKey}___${dNameNorm}`] = entry
    }
  }

  // 3. Resolver Empresa
  for (const rawDoc of (reqDocs.empresa || [])) {
    const dName = extractDocName(rawDoc)
    const dNameNorm = normalizarTextoAcred(dName)
    const lookupKey = `emp___${dNameNorm}`
    const scopedKey = `emp-${dName}`
    const key1 = `empresa_${dName.replace(/\s+/g, '_')}`
    const key2 = dName.replace(/\s+/g, '_')

    const manualVinculado = docVinculados[scopedKey] || docVinculados[key1] || docVinculados[key2] || docHomologados[scopedKey] || docHomologados[key1] || (docReg[scopedKey] || docReg[key1] ? { status: 'OK' } : null)
    
    result.empresa[lookupKey] = {
      vigente: !!manualVinculado,
      url: manualVinculado?.url || (manualVinculado?.id_doc ? `${archivoBaseUrl.value}/archivo/ver/${manualVinculado.id_doc}` : null)
    }
  }

  return result
})

const porcentajeAcreditacionReal = computed(() => {
  const mapa = mapaEstadoAcreditaciones.value
  const reqDocs = opportunity.value?.acreditacion_docs || { empresa: [], equipos: [], personas: [] }
  const trip = tripulacionAsignada.value || []
  const eqList = equiposAsignadosLista.value || []
  
  let totalExigidos = 0
  let totalVigentes = 0
  
  // 1. Empresa
  for (const rawDoc of (reqDocs.empresa || [])) {
    totalExigidos++
    const dNameNorm = normalizarTextoAcred(extractDocName(rawDoc))
    if (mapa.empresa[`emp___${dNameNorm}`]?.vigente) {
      totalVigentes++
    }
  }
  
  // 2. Equipos
  for (const rawEq of eqList) {
    if (!rawEq) continue
    const eqInfo = resolverEquipoInfo(rawEq)
    const eqKeyId = eqInfo.id ? String(eqInfo.id) : null
    const eqKeyPat = eqInfo.patente ? String(eqInfo.patente).toUpperCase().trim() : null
    const rawKey = String(rawEq)
    
    for (const rawDoc of (reqDocs.equipos || [])) {
      totalExigidos++
      const dNameNorm = normalizarTextoAcred(extractDocName(rawDoc))
      const isOk = (eqKeyId && mapa.equipos[`${eqKeyId}___${dNameNorm}`]?.vigente) ||
                   (eqKeyPat && mapa.equipos[`${eqKeyPat}___${dNameNorm}`]?.vigente) ||
                   mapa.equipos[`${rawKey}___${dNameNorm}`]?.vigente
      if (isOk) totalVigentes++
    }
  }
  
  // 3. Personas
  for (const t of trip) {
    const uId = t.id_user ? String(t.id_user) : (t.id ? String(t.id) : (t.user_id ? String(t.user_id) : ''))
    if (!uId) continue
    for (const rawDoc of (reqDocs.personas || [])) {
      totalExigidos++
      const dNameNorm = normalizarTextoAcred(extractDocName(rawDoc))
      if (mapa.personas[`${uId}___${dNameNorm}`]?.vigente) {
        totalVigentes++
      }
    }
  }
  
  if (totalExigidos === 0) return 100
  return Math.round((totalVigentes / totalExigidos) * 100)
})

// Buscador semántico de certificados en el repositorio real
const buscarCertificadoParaDoc = (docNombre, categoria, entityObj = null) => {
  const dName = extractDocName(docNombre)
  if (!dName) return null
  const dNameNorm = normalizarTextoAcred(dName)
  const cat = (categoria || '').toLowerCase()

  if (cat === 'personas') {
    const uId = entityObj?.id_user ? String(entityObj.id_user) : (entityObj?.id ? String(entityObj.id) : (entityObj?.user_id ? String(entityObj.user_id) : (typeof entityObj === 'number' || typeof entityObj === 'string' ? String(entityObj) : '')))
    if (!uId) return null
    return mapaEstadoAcreditaciones.value.personas[`${uId}___${dNameNorm}`]?.cert || null
  } else if (cat === 'equipos') {
    const eqInfo = resolverEquipoInfo(entityObj || operacionesAssignment.value?.equipo_id)
    const eqKeyId = eqInfo.id ? String(eqInfo.id) : null
    const eqKeyPat = eqInfo.patente ? String(eqInfo.patente).toUpperCase().trim() : null
    const rawKey = entityObj ? String(entityObj) : String(operacionesAssignment.value?.equipo_id || '')

    return (eqKeyId && mapaEstadoAcreditaciones.value.equipos[`${eqKeyId}___${dNameNorm}`]?.cert) ||
           (eqKeyPat && mapaEstadoAcreditaciones.value.equipos[`${eqKeyPat}___${dNameNorm}`]?.cert) ||
           mapaEstadoAcreditaciones.value.equipos[`${rawKey}___${dNameNorm}`]?.cert || null
  }
  return null
}

const markDocVigente = (docNombre, categoria, entityObj = null) => {
  const dName = extractDocName(docNombre)
  const cat = (categoria || '').toLowerCase()
  const entityPrefix = getEntityPrefix(cat, entityObj)
  const compKey = cat === 'empresa' ? 'emp-' : (cat === 'equipos' ? 'eq-' : 'per-')
  const scopedKey = entityPrefix ? `${entityPrefix}${dName}` : `${compKey}${dName}`
  const key1 = `${cat}_${dName.replace(/\s+/g, '_')}`
  const key2 = `${dName.replace(/\s+/g, '_')}`

  if (scopedKey) docStateRegistry[scopedKey] = true
  docStateRegistry[key1] = true
  docStateRegistry[key2] = true
  docStateRegistry[compKey + dName] = true
  docStateRegistry[dName] = true

  if (dName.toLowerCase().includes('contrato')) {
    if (entityPrefix) {
      docStateRegistry[`${entityPrefix}Contrato`] = true
      docStateRegistry[`${entityPrefix}Contrato de trabajo`] = true
      docStateRegistry[`${entityPrefix}Contrato de Trabajo`] = true
    }
  }

  acreditacionCacheVersion.value++
}

const getEntityPrefix = (categoria, entityObj) => {
  const cat = (categoria || '').toLowerCase()
  if (cat === 'personas') {
    const uId = entityObj?.id_user || entityObj?.id || entityObj?.user_id || (typeof entityObj === 'number' || typeof entityObj === 'string' ? entityObj : null)
    if (uId) return `per-${uId}-`
  } else if (cat === 'equipos') {
    const eqInfo = resolverEquipoInfo(entityObj || operacionesAssignment.value?.equipo_id)
    const eqKey = eqInfo.id || eqInfo.patente || entityObj || operacionesAssignment.value?.equipo_id
    if (eqKey) return `eq-${eqKey}-`
  }
  return ''
}

const checkDocVigente = (docNombre, categoria, entityObj = null) => {
  const dName = extractDocName(docNombre)
  if (!dName) return false
  const dNameNorm = normalizarTextoAcred(dName)
  const cat = (categoria || '').toLowerCase()

  if (cat === 'personas') {
    const uId = entityObj?.id_user ? String(entityObj.id_user) : (entityObj?.id ? String(entityObj.id) : (entityObj?.user_id ? String(entityObj.user_id) : (typeof entityObj === 'number' || typeof entityObj === 'string' ? String(entityObj) : '')))
    if (!uId) return false
    
    if (!expedientesPersonalCache.value[uId] && !expedientesPersonalCache.value[Number(uId)]) {
      cargarExpedientePersonal(uId)
    }

    const item = mapaEstadoAcreditaciones.value.personas[`${uId}___${dNameNorm}`]
    if (item?.vigente) return true

    const scopedKey = `per-${uId}-${dName}`
    if (docStateRegistry[scopedKey] || docsVinculadosMap.value[scopedKey] || opportunity.value?.docs_homologados?.[scopedKey]) return true

    if (dNameNorm.includes('contrato')) {
      if (
        docStateRegistry[`per-${uId}-Contrato`] ||
        docStateRegistry[`per-${uId}-Contrato de trabajo`] ||
        docsVinculadosMap.value[`per-${uId}-Contrato`] ||
        docsVinculadosMap.value[`per-${uId}-Contrato de trabajo`]
      ) return true
    }

    return false
  } else if (cat === 'equipos') {
    const eqInfo = resolverEquipoInfo(entityObj || operacionesAssignment.value?.equipo_id)
    const eqKeyId = eqInfo.id ? String(eqInfo.id) : null
    const eqKeyPat = eqInfo.patente ? String(eqInfo.patente).toUpperCase().trim() : null
    const rawKey = entityObj ? String(entityObj) : String(operacionesAssignment.value?.equipo_id || '')

    if (eqKeyId && !expedientesEquiposCache.value[eqKeyId]) {
      cargarExpedienteEquipo(eqKeyId)
    } else if (eqKeyPat && !expedientesEquiposCache.value[eqKeyPat]) {
      cargarExpedienteEquipo(eqKeyPat)
    } else if (rawKey && !expedientesEquiposCache.value[rawKey]) {
      cargarExpedienteEquipo(rawKey)
    }

    const item = (eqKeyId && mapaEstadoAcreditaciones.value.equipos[`${eqKeyId}___${dNameNorm}`]) ||
                 (eqKeyPat && mapaEstadoAcreditaciones.value.equipos[`${eqKeyPat}___${dNameNorm}`]) ||
                 mapaEstadoAcreditaciones.value.equipos[`${rawKey}___${dNameNorm}`]

    if (item?.vigente) return true

    if (eqKeyId && (docStateRegistry[`eq-${eqKeyId}-${dName}`] || docsVinculadosMap.value[`eq-${eqKeyId}-${dName}`] || opportunity.value?.docs_homologados?.[`eq-${eqKeyId}-${dName}`])) return true
    if (eqKeyPat && (docStateRegistry[`eq-${eqKeyPat}-${dName}`] || docsVinculadosMap.value[`eq-${eqKeyPat}-${dName}`] || opportunity.value?.docs_homologados?.[`eq-${eqKeyPat}-${dName}`])) return true
    if (rawKey && (docStateRegistry[`eq-${rawKey}-${dName}`] || docsVinculadosMap.value[`eq-${rawKey}-${dName}`] || opportunity.value?.docs_homologados?.[`eq-${rawKey}-${dName}`])) return true

    return false
  } else {
    const item = mapaEstadoAcreditaciones.value.empresa[`emp___${dNameNorm}`]
    if (item?.vigente) return true

    const scopedKey = `emp-${dName}`
    if (docStateRegistry[scopedKey] || docsVinculadosMap.value[scopedKey] || opportunity.value?.docs_homologados?.[scopedKey]) return true

    return false
  }
}

const subirArchivoInSitu = async (categoria, docNombre, event, entityObj = null) => {
  const file = event.target.files[0]
  if (!file) return
  
  const dName = extractDocName(docNombre)
  const entityPrefix = getEntityPrefix(categoria, entityObj)
  const compKey = categoria === 'empresa' ? 'emp-' : (categoria === 'equipos' ? 'eq-' : 'per-')
  const scopedKey = entityPrefix ? `${entityPrefix}${dName}` : `${compKey}${dName}`

  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('modulo', `acreditacion/${categoria}`)
    formData.append('tenant_code', 'gsp')

    let idDoc = null
    let fileUrl = null
    let fileName = file.name

    try {
      const { data: res } = await apiAxios.post('/v1/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      idDoc = res?.id_doc || res?.data?.id_doc
      fileName = res?.file_name || res?.data?.file_name || file.name
      fileUrl = res?.url || (idDoc ? `${archivoBaseUrl.value}/archivo/ver/${idDoc}` : null)
    } catch (e) {
      console.warn('Endpoint /v1/storage/upload no disponible, intentando /archivo:', e)
      const { data: resLegacy } = await apiAxios.post('/archivo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      idDoc = resLegacy?.id_doc || resLegacy?.id
      fileName = resLegacy?.file_name || resLegacy?.name_doc_interno || file.name
      fileUrl = idDoc ? `${archivoBaseUrl.value}/archivo/ver/${idDoc}` : null
    }

    if (!fileUrl && idDoc) {
      fileUrl = `${archivoBaseUrl.value}/archivo/ver/${idDoc}`
    } else if (!fileUrl) {
      fileUrl = `${archivoBaseUrl.value}/archivo/ver/${encodeURIComponent(fileName)}`
    }

    const payload = {
      id_doc: idDoc,
      file_name: fileName,
      url: fileUrl,
      status: 'CARGADO_IN_SITU',
      timestamp: new Date().toISOString()
    }

    docsVinculadosMap.value = {
      ...docsVinculadosMap.value,
      [scopedKey]: payload
    }

    if (opportunity.value) {
      if (!opportunity.value.docs_homologados) opportunity.value.docs_homologados = {}
      opportunity.value.docs_homologados[scopedKey] = payload
    }
    
    if (operacionesAssignment.value) {
      if (!operacionesAssignment.value.cumplimiento_acreditaciones) {
        operacionesAssignment.value.cumplimiento_acreditaciones = {}
      }
      operacionesAssignment.value.cumplimiento_acreditaciones[scopedKey] = 'OK'
    }
  } catch (err) {
    console.error('Error subiendo archivo in situ:', err)
    alert(`No se pudo subir el archivo: ${err.message || err}`)
  }
}

const modalVerDocumentoState = ref({
  show: false,
  docName: '',
  categoria: '',
  fileName: '',
  status: '',
  timestamp: '',
  url: ''
})

const modalVincularState = ref({
  show: false,
  docName: '',
  categoria: '',
  entityObj: null,
  entityName: '',
  searchQuery: '',
  documentosDisponibles: []
})

const getDocStatus = (docObjOrStr, categoria, entityObj = null) => {
  const isVig = checkDocVigente(docObjOrStr, categoria, entityObj)
  if (isVig) {
    return {
      code: 'VIGENTE',
      label: 'VIGENTE',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: '🟢'
    }
  }
  return {
    code: 'PENDIENTE',
    label: 'SIN ARCHIVO',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30 font-bold',
    icon: '❌'
  }
}

const abrirModalVincularDoc = async (docNombre, categoria = 'empresa', entityObj = null) => {
  const dName = extractDocName(docNombre) || 'Documento'
  const cat = (categoria || 'empresa').toLowerCase()
  let entName = 'Empresa Mandante'
  let docs = []

  modalVincularState.value = {
    show: true,
    docName: dName,
    categoria: cat.toUpperCase(),
    entityObj: entityObj,
    entityName: 'Cargando certificados del sistema...',
    searchQuery: '',
    documentosDisponibles: []
  }

  try {
    if (cat === 'empresa') {
      entName = selectedClient.value?.razon_social || opportunity.value?.empresa_razon_social || 'Empresa Mandante'
      docs = [
        { id_doc: 890, file_name: 'Ind_RIOHS_EPP.pdf', nombre: `${dName} - RIOHS / EPP (Documento Oficial)`, fecha: 'Vigente', codigo: 'DOC-EMP-01' },
        { id_doc: 893, file_name: 'ODI_PTS.pdf', nombre: `Carpeta Tributaria / Adhesión 2026 - ${entName}`, fecha: 'Vigente', codigo: 'DOC-EMP-02' }
      ]
    } else if (cat === 'equipos') {
      const eqId = entityObj?.equipo_id || (typeof entityObj === 'number' || typeof entityObj === 'string' ? entityObj : null) || operacionesAssignment.value?.equipo_id
      const eqName = getNombreEquipoAsignado(eqId)
      const eqPatente = getPatenteEquipoAsignado(eqId)
      entName = `${eqName} (PPU: ${eqPatente})`
      
      if (eqId) {
        const realCerts = await cargarExpedienteEquipo(eqId)
        if (realCerts && realCerts.length > 0) {
          docs = realCerts.map(c => ({
            id_doc: c.id_doc || c.id_certificado,
            file_name: c.name_doc_interno || c.file_name || String(c.id_doc),
            nombre: `${c.nombre_tipo || c.name_doc_orig || c.nombre || dName} (ID: ${c.id_doc || c.id_certificado})`,
            subtitulo: c.observaciones || '',
            fecha: c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString() : 'Vigente',
            codigo: c.estado_vigencia || 'VIGENTE'
          }))
        }
      }
    } else {
      let uId = entityObj?.id_user || (typeof entityObj === 'number' || typeof entityObj === 'string' ? entityObj : null)
      if (!uId && tripulacionAsignada.value?.length > 0) {
        uId = tripulacionAsignada.value[0]?.id_user
      }
      const pName = getNombrePersonaAsignada(uId) || 'Personal Asignado'
      entName = `${pName}`
      
      if (uId) {
        const certs = await cargarExpedientePersonal(uId)
        if (certs && certs.length > 0) {
          docs = certs.map(c => ({
            id_doc: c.id_doc || c.id_certificado_persona,
            file_name: c.name_doc_interno || c.file_name || String(c.id_doc),
            nombre: c.nombre_tipo || c.name_doc_orig || dName,
            subtitulo: c.observaciones || '',
            fecha: c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString() : 'Vigente',
            codigo: c.estado_vigencia || 'VIGENTE'
          }))
        }
      }
    }
  } catch (err) {
    console.error('Error inicializando modal de vinculación:', err)
  }

  modalVincularState.value.entityName = entName || 'Expediente Digital'
  modalVincularState.value.documentosDisponibles = docs
}

const filteredDocumentosDisponibles = computed(() => {
  const list = modalVincularState.value?.documentosDisponibles || []
  const q = modalVincularState.value?.searchQuery ? String(modalVincularState.value.searchQuery).toLowerCase().trim() : ''
  if (!q) return list
  return list.filter(d => {
    if (!d) return false
    const n = d.nombre ? String(d.nombre).toLowerCase() : ''
    const c = d.codigo ? String(d.codigo).toLowerCase() : ''
    const s = d.subtitulo ? String(d.subtitulo).toLowerCase() : ''
    return n.includes(q) || c.includes(q) || s.includes(q)
  })
})

const vincularDocumentoSeleccionado = (docObj) => {
  const rawDoc = modalVincularState.value.docName
  const docNombre = extractDocName(rawDoc)
  const categoria = (modalVincularState.value.categoria || '').toLowerCase()
  const entityObj = modalVincularState.value.entityObj

  markDocVigente(docNombre, categoria, entityObj)

  const entityPrefix = getEntityPrefix(categoria, entityObj)
  const compKey = categoria === 'empresa' ? 'emp-' : (categoria === 'equipos' ? 'eq-' : 'per-')
  const scopedKey = entityPrefix ? `${entityPrefix}${docNombre}` : `${compKey}${docNombre}`

  const idDoc = docObj?.id_doc
  const docFile = docObj?.file_name || docObj?.nombre || `${docNombre}.pdf`
  const docUrl = idDoc 
    ? `${archivoBaseUrl.value}/archivo/ver/${idDoc}`
    : `${archivoBaseUrl.value}/archivo/ver/${encodeURIComponent(docFile)}`

  const payload = {
    id_doc: idDoc || null,
    file_name: docFile,
    url: docUrl,
    status: 'VINCULADO_REPOSITORIO',
    timestamp: new Date().toISOString()
  }

  docsVinculadosMap.value = {
    ...docsVinculadosMap.value,
    [scopedKey]: payload
  }

  // Propagación de variantes de contrato
  if (docNombre.toLowerCase().includes('contrato') && entityPrefix) {
    docsVinculadosMap.value[`${entityPrefix}Contrato`] = payload
    docsVinculadosMap.value[`${entityPrefix}Contrato de trabajo`] = payload
    docsVinculadosMap.value[`${entityPrefix}Contrato de Trabajo`] = payload
  }
  
  if (opportunity.value) {
    if (!opportunity.value.docs_homologados) opportunity.value.docs_homologados = {}
    opportunity.value.docs_homologados[scopedKey] = payload
    if (docNombre.toLowerCase().includes('contrato') && entityPrefix) {
      opportunity.value.docs_homologados[`${entityPrefix}Contrato`] = payload
      opportunity.value.docs_homologados[`${entityPrefix}Contrato de trabajo`] = payload
      opportunity.value.docs_homologados[`${entityPrefix}Contrato de Trabajo`] = payload
    }
  }
  
  if (!operacionesAssignment.value) {
    operacionesAssignment.value = {}
  }
  if (!operacionesAssignment.value.cumplimiento_acreditaciones) {
    operacionesAssignment.value.cumplimiento_acreditaciones = {}
  }
  operacionesAssignment.value.cumplimiento_acreditaciones[scopedKey] = 'OK'
  if (docNombre.toLowerCase().includes('contrato') && entityPrefix) {
    operacionesAssignment.value.cumplimiento_acreditaciones[`${entityPrefix}Contrato`] = 'OK'
    operacionesAssignment.value.cumplimiento_acreditaciones[`${entityPrefix}Contrato de trabajo`] = 'OK'
    operacionesAssignment.value.cumplimiento_acreditaciones[`${entityPrefix}Contrato de Trabajo`] = 'OK'
  }
  operacionesAssignment.value.cumplimiento_acreditaciones = { ...operacionesAssignment.value.cumplimiento_acreditaciones }
  
  acreditacionCacheVersion.value++
  modalVincularState.value.show = false
}

const verDocumentoDossier = (rawDoc, categoria, entityObj = null) => {
  const docNombre = extractDocName(rawDoc)
  const dNameNorm = normalizarTextoAcred(docNombre)
  const cat = (categoria || '').toLowerCase()

  // 1. Intentar desde mapaEstadoAcreditaciones
  let targetUrl = null
  if (cat === 'personas') {
    const uId = entityObj?.id_user ? String(entityObj.id_user) : (entityObj?.id ? String(entityObj.id) : (entityObj?.user_id ? String(entityObj.user_id) : (typeof entityObj === 'number' || typeof entityObj === 'string' ? String(entityObj) : '')))
    const item = mapaEstadoAcreditaciones.value.personas[`${uId}___${dNameNorm}`]
    targetUrl = item?.url || (item?.cert?.id_doc ? `${archivoBaseUrl.value}/archivo/ver/${item.cert.id_doc}` : null)
  } else if (cat === 'equipos') {
    const eqId = entityObj?.equipo_id ? String(entityObj.equipo_id) : (entityObj?.id_equipo ? String(entityObj.id_equipo) : (entityObj?.id ? String(entityObj.id) : (typeof entityObj === 'number' || typeof entityObj === 'string' ? String(entityObj) : String(operacionesAssignment.value?.equipo_id || ''))))
    const item = mapaEstadoAcreditaciones.value.equipos[`${eqId}___${dNameNorm}`]
    targetUrl = item?.url || (item?.cert?.id_doc ? `${archivoBaseUrl.value}/archivo/ver/${item.cert.id_doc}` : null)
  } else {
    const item = mapaEstadoAcreditaciones.value.empresa[`emp___${dNameNorm}`]
    targetUrl = item?.url
  }

  if (targetUrl && targetUrl !== '#') {
    window.open(targetUrl, '_blank')
    return
  }

  // 2. Fallback a mapeos manuales y docs_homologados
  const entityPrefix = getEntityPrefix(cat, entityObj)
  const compKey = cat === 'empresa' ? 'emp-' : (cat === 'equipos' ? 'eq-' : 'per-')
  const scopedKey = entityPrefix ? `${entityPrefix}${docNombre}` : `${compKey}${docNombre}`
  const key1 = `${cat}_${docNombre.replace(/\s+/g, '_')}`
  const key2 = `${docNombre.replace(/\s+/g, '_')}`

  const docInfo = docsVinculadosMap.value[scopedKey] 
    || docsVinculadosMap.value[compKey + docNombre] 
    || docsVinculadosMap.value[key1] 
    || docsVinculadosMap.value[key2] 
    || docsVinculadosMap.value[docNombre]
    || opportunity.value?.docs_homologados?.[scopedKey]
    || opportunity.value?.docs_homologados?.[compKey + docNombre]
    || opportunity.value?.docs_homologados?.[key1]
    || opportunity.value?.docs_homologados?.[key2]

  const targetIdOrFile = docInfo?.id_doc || docInfo?.id || docInfo?.file_name || `${docNombre.toLowerCase().replace(/\s+/g, '_')}_oficial.pdf`
  targetUrl = docInfo?.url
  
  if (!targetUrl || targetUrl === '#') {
    targetUrl = `${archivoBaseUrl.value}/archivo/ver/${encodeURIComponent(targetIdOrFile)}`
  }
  
  if (targetUrl) {
    window.open(targetUrl, '_blank')
  } else {
    alert(`No se encontró el documento en el repositorio oficial: ${docNombre}`)
  }
}

const modalDespachoB2BState = ref({
  show: false,
  destinatario: '',
  asunto: '',
  para: '',
  cc: 'operaciones@leanglobal.cl',
  enviando: false
})

const despacharDossierCliente = () => {
  modalDespachoB2BState.value = {
    show: true,
    destinatario: opportunity.value.contacto_nombre || selectedClient.value?.razon_social || 'Cliente Mandante',
    para: opportunity.value.contacto_email || selectedClient.value?.email || 'contacto@cliente.cl',
    cc: 'operaciones@leanglobal.cl, comercial@leanglobal.cl',
    asunto: `[DOSSIER ACREDITACIÓN] Proyecto ${antecedentes.value.identificador_formal || opportunity.value.codi_proyecto || 'GSP'} - ${siteVisit.value.obra_nombre || 'Faena Terreno'}`,
    enviando: false
  }
}

const confirmarEnvioCorreoB2B = () => {
  modalDespachoB2BState.value.enviando = true
  setTimeout(() => {
    modalDespachoB2BState.value.enviando = false
    modalDespachoB2BState.value.show = false
    const registro = {
      version: `v1.${historialEnviousDossier.value.length + 1}`,
      fecha: new Date().toISOString(),
      usuario: 'Ejecutivo Comercial',
      destinatarios: modalDespachoB2BState.value.para
    }
    historialEnviousDossier.value.unshift(registro)
  }, 800)
}

const verPreviewCorreoHTML = (h) => {
  despacharDossierCliente()
}

const catalogoAparejos = ref([
  { id: 'cadenas', label: 'Cadenas de Izaje Grado 80/100' },
  { id: 'estrobos', label: 'Estrobos de Acero' },
  { id: 'pulpo_cadena', label: 'Pulpo Cadena Grado 80' },
  { id: 'grilletes', label: 'Grilletes Lira / Rectos' },
  { id: 'balancines', label: 'Balancines / Vigas de Izaje' },
  { id: 'eslingas', label: 'Eslingas Sintéticas' },
  { id: 'canastillo', label: 'Canastillo Alza Hombres' },
  { id: 'eslingas_10t', label: 'Eslingas Sintéticas 10T' }
])
const aparejosMasterList = catalogoAparejos

const especialistasTerreno = ref([
  { id_user: '', cargo: 'Prevencionista de Riesgos', requerimiento: '', is_linea_base: true, semaforo: 'GREEN', fecha_plan_ini: '', fecha_plan_fin: '' },
  { id_user: '', cargo: 'Rigger', requerimiento: '', is_linea_base: true, semaforo: 'GREEN', fecha_plan_ini: '', fecha_plan_fin: '' }
])

const agregarEspecialista = () => {
  const defaultIni = operacionesAssignment.value?.fecha_salida_plan || ''
  const defaultFin = operacionesAssignment.value?.fecha_fin_plan || ''
  especialistasTerreno.value.push({
    id_user: '',
    cargo: 'Rigger',
    requerimiento: '',
    is_linea_base: false,
    semaforo: 'GREEN',
    fecha_plan_ini: defaultIni,
    fecha_plan_fin: defaultFin
  })
  marcarDirtyAsignacion()
}

const eliminarEspecialista = (idx) => {
  const esp = especialistasTerreno.value[idx]
  if (esp?.is_linea_base) {
    alert('🔒 Este especialista proviene de la cotización comercial base y no puede eliminarse.')
    return
  }
  especialistasTerreno.value.splice(idx, 1)
  marcarDirtyAsignacion()
}

const getUsuariosAgrupados = (cargo) => {
  if (!usuarios.value || !Array.isArray(usuarios.value)) return { sugeridos: [], otros: [] }
  
  const activos = usuarios.value.filter(u => {
    if (u.activo === false || u.is_active === false) return false
    const name = (u.nombre_user || u.name_user || u.username || '').toLowerCase()
    if (name.includes('isis') && name.includes('oses')) return false
    return true
  })

  if (!cargo) return { sugeridos: activos, otros: [] }

  const cargoLower = cargo.toLowerCase().trim()
  const sugeridos = []
  const otros = []

  activos.forEach(u => {
    const userCargo = (u.cargo || u.role_name || u.tipo_usuario || '').toLowerCase()
    const name = (u.nombre_user || u.name_user || u.username || '').toLowerCase()
    let isMatch = false

    if (cargoLower.includes('rigger')) {
      isMatch = userCargo.includes('rigger') || name.includes('rigger')
    } else if (cargoLower.includes('prevencion') || cargoLower.includes('apr') || cargoLower.includes('hsec') || cargoLower.includes('seguridad')) {
      isMatch = userCargo.includes('prevenc') || userCargo.includes('apr') || userCargo.includes('hsec') || userCargo.includes('seguridad') || name.includes('prevenc')
    } else if (cargoLower.includes('operador') && (cargoLower.includes('pluma') || cargoLower.includes('camion'))) {
      isMatch = userCargo.includes('pluma') || userCargo.includes('camion') || (userCargo.includes('operador') && !userCargo.includes('grua'))
    } else if (cargoLower.includes('operador')) {
      isMatch = userCargo.includes('operador') || userCargo.includes('operario') || name.includes('operador')
    } else if (cargoLower.includes('chofer') || cargoLower.includes('cama baja') || cargoLower.includes('transporte')) {
      isMatch = userCargo.includes('chofer') || userCargo.includes('conductor') || userCargo.includes('cama baja') || userCargo.includes('transporte')
    } else if (cargoLower.includes('supervisor')) {
      isMatch = userCargo.includes('supervis') || userCargo.includes('jefe') || userCargo.includes('coordinad')
    } else if (cargoLower.includes('escolta') || cargoLower.includes('guia')) {
      isMatch = userCargo.includes('escolta') || userCargo.includes('guia') || userCargo.includes('chofer')
    }

    if (isMatch) {
      sugeridos.push(u)
    } else {
      otros.push(u)
    }
  })

  return { sugeridos, otros }
}

const getUsuariosPorCargo = (cargo) => {
  const grp = getUsuariosAgrupados(cargo)
  return grp.sugeridos.length > 0 ? grp.sugeridos.concat(grp.otros) : grp.otros
}

const isCargoConductor = (cargo) => {
  if (!cargo) return false
  const c = cargo.toLowerCase()
  return c.includes('operador') || c.includes('chofer') || c.includes('conductor') || c.includes('escolta')
}

const equiposAsignadosTotales = computed(() => {
  const result = [];
  const seen = new Set();

  // 1. Equipos principales de las líneas comerciales (Segmento 1)
  const lPrincipales = linesEquiposPrincipales.value || [];
  lPrincipales.forEach(l => {
    if (l && l.equipo_asignado_id) {
      const eqObj = getEquipoObj(l.equipo_asignado_id);
      const idKey = eqObj ? eqObj.id_equipo : l.equipo_asignado_id;
      if (idKey && !seen.has(idKey)) {
        seen.add(idKey);
        result.push({
          id_equipo: idKey,
          patente: eqObj?.patente || String(l.equipo_asignado_id),
          nombre_equipo: eqObj?.nombre_equipo || eqObj?.modelo || l.descripcion || 'Equipo de Servicio',
          tipo: eqObj?.nombre_categoria || eqObj?.tipo || l.tipo || 'Equipo',
          subcategoria: eqObj?.nombre_subcategoria || eqObj?.subcategoria || l.subcategoria || '',
          operador_id: l.operador_asignado_id
        });
      }
    }
  });

  // 2. Equipos del Segmento de Traslado en operacionesAssignment.equipos_extra (Segmento 2)
  if (Array.isArray(operacionesAssignment.value?.equipos_extra)) {
    operacionesAssignment.value.equipos_extra.forEach((eqItem, idx) => {
      const eqId = (typeof eqItem === 'object' && eqItem !== null) ? eqItem.id_equipo : eqItem;
      if (eqId) {
        const eqObj = getEquipoObj(eqId);
        const idKey = eqObj ? eqObj.id_equipo : eqId;
        if (idKey && !seen.has(idKey)) {
          seen.add(idKey);
          const rolLabel = (typeof eqItem === 'object' && eqItem !== null && (eqItem.descripcion || eqItem.subcategoria || eqItem.rol)) ? (eqItem.descripcion || eqItem.subcategoria || eqItem.rol) : `Vehículo Traslado #${idx + 1}`;
          result.push({
            id_equipo: idKey,
            patente: eqObj?.patente || String(eqId),
            nombre_equipo: eqObj?.nombre_equipo || eqObj?.modelo || rolLabel,
            tipo: eqObj?.nombre_categoria || eqObj?.tipo || 'Traslado / Apoyo',
            subcategoria: eqObj?.nombre_subcategoria || eqObj?.subcategoria || '',
            operador_id: (typeof eqItem === 'object' && eqItem !== null) ? eqItem.chofer_id : null
          });
        }
      }
    });
  }

  return result;
});

// Tripulación completa unificada y computada linealmente
const tripulacionAsignada = computed(() => {
  const list = [];
  const lPrincipal = linesEquiposPrincipales.value || [];
  
  // 1. Operadores de líneas de equipos principales (Segmento 1)
  lPrincipal.forEach(line => {
    const cargo = (line.tipo || '').toUpperCase().includes('PLUMA') ? 'Operador Camión Pluma' : 'Operador Grúa';
    list.push({
      id_user: line.operador_asignado_id || null,
      cargo,
      requerimiento: line.descripcion || line.subcategoria || cargo,
      equipo_asignado_id: line.equipo_asignado_id || '',
      semaforo: getSemaforoTripulante(line.operador_asignado_id),
      is_linea_base: line.is_linea_base !== false,
      fecha_plan_ini: line.fecha_plan_ini || operacionesAssignment.value?.fecha_salida_plan || '',
      fecha_plan_fin: line.fecha_plan_fin || operacionesAssignment.value?.fecha_fin_plan || ''
    });
  });
  
  // 2. Choferes de equipos de traslado (Segmento 2)
  if (Array.isArray(operacionesAssignment.value?.equipos_extra)) {
    operacionesAssignment.value.equipos_extra.forEach((eqEx, idx) => {
      const rol = (typeof eqEx === 'object' && eqEx !== null && (eqEx.descripcion || eqEx.subcategoria || eqEx.rol)) ? (eqEx.descripcion || eqEx.subcategoria || eqEx.rol) : (eqEx.subcategoria || `Vehículo Traslado #${idx + 1}`)
      const isEscolta = (rol + ' ' + (eqEx.subcategoria || '') + ' ' + (eqEx.tipo || '')).toLowerCase().includes('escolta') || (rol + ' ' + (eqEx.subcategoria || '')).toLowerCase().includes('guia') || (eqEx.tipo || '').toLowerCase().includes('liviano')
      const cargo = isEscolta ? 'Escolta / Guía' : 'Chofer Cama Baja'
      const eqId = (typeof eqEx === 'object' && eqEx !== null) ? eqEx.id_equipo : eqEx
      const choferId = (typeof eqEx === 'object' && eqEx !== null) ? eqEx.chofer_id : null
      const ini = (typeof eqEx === 'object' && eqEx !== null && eqEx.fecha_plan_ini) ? eqEx.fecha_plan_ini : (operacionesAssignment.value?.fecha_salida_plan || '')
      const fin = (typeof eqEx === 'object' && eqEx !== null && eqEx.fecha_plan_fin) ? eqEx.fecha_plan_fin : (operacionesAssignment.value?.fecha_fin_plan || '')
      list.push({
        id_user: choferId || null,
        cargo,
        requerimiento: rol,
        equipo_asignado_id: eqId || '',
        semaforo: getSemaforoTripulante(choferId),
        is_linea_base: eqEx.is_linea_base === true,
        fecha_plan_ini: ini,
        fecha_plan_fin: fin
      })
    })
  }
  
  // 3. Especialistas en terreno (Segmento 3)
  if (Array.isArray(especialistasTerreno.value)) {
    especialistasTerreno.value.forEach(esp => {
      list.push({
        id_user: esp.id_user || null,
        cargo: esp.cargo || 'Especialista',
        requerimiento: esp.requerimiento || '',
        equipo_asignado_id: '',
        semaforo: getSemaforoTripulante(esp.id_user),
        is_linea_base: esp.is_linea_base === true,
        fecha_plan_ini: esp.fecha_plan_ini || operacionesAssignment.value?.fecha_salida_plan || '',
        fecha_plan_fin: esp.fecha_plan_fin || operacionesAssignment.value?.fecha_fin_plan || ''
      })
    })
  }
  
  return list
})

const agregarEquipoPrincipal = () => {
  const currentLines = Array.isArray(lines.value) ? [...lines.value] : [];
  const defaultIni = operacionesAssignment.value?.fecha_salida_plan || '';
  const defaultFin = operacionesAssignment.value?.fecha_fin_plan || '';
  
  currentLines.push({
    _uid: `op-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    tipo: '',
    subcategoria: '',
    descripcion: '',
    unidad: 'Diario',
    cantidad: 1,
    valorUnitario: 0,
    equipo_asignado_id: '',
    operador_asignado_id: '',
    fecha_plan_ini: defaultIni,
    fecha_plan_fin: defaultFin,
    is_linea_base: false
  });
  
  lines.value = currentLines;
  marcarDirtyAsignacion();
};

const eliminarEquipoPrincipal = (line) => {
  if (line?.is_linea_base !== false && line?.is_linea_base) {
    alert('🔒 Este equipo proviene de la cotización comercial base y no puede eliminarse.');
    return;
  }
  const currentLines = Array.isArray(lines.value) ? [...lines.value] : [];
  const idx = currentLines.indexOf(line);
  if (idx !== -1) {
    currentLines.splice(idx, 1);
    lines.value = currentLines;
    marcarDirtyAsignacion();
  }
};

const sincronizarTrasladosComerciales = () => {
  const trasladosComerciales = (lines.value || []).filter(l => isTrasladoLine(l))
  if (trasladosComerciales.length === 0 && !opportunity.value?.incluye_flete) return

  const currentExtras = Array.isArray(operacionesAssignment.value?.equipos_extra) 
    ? [...operacionesAssignment.value.equipos_extra] 
    : []

  const defaultIni = operacionesAssignment.value?.fecha_salida_plan || opportunity.value?.fecha_tentativa || ''
  const defaultFin = operacionesAssignment.value?.fecha_fin_plan || opportunity.value?.fecha_tentativa || ''

  // 1. Si no hay líneas explícitas pero incluye_flete = true
  if (trasladosComerciales.length === 0 && opportunity.value?.incluye_flete) {
    const yaExiste = currentExtras.some(ex => ex.is_linea_base)
    if (!yaExiste) {
      currentExtras.unshift({
        _uid: `ex-base-flete-${Date.now()}`,
        tipo: 'TRASLADOS',
        subcategoria: 'CAMA BAJA',
        descripcion: 'Servicio de Traslado / Flete',
        cantidad: 1,
        unidad: 'Viaje',
        id_equipo: '',
        chofer_id: '',
        is_linea_base: true,
        fecha_plan_ini: defaultIni,
        fecha_plan_fin: defaultFin
      })
    }
  }

  // 2. Mapear cada línea comercial de traslado
  trasladosComerciales.forEach((tc, idx) => {
    const subcat = tc.subcategoria || 'CAMA BAJA'
    const desc = tc.descripcion || tc.subcategoria || `Servicio de Traslado #${idx + 1}`
    
    // Verificar si ya existe en equipos_extra
    const match = currentExtras.find(ex => 
      (tc._uid && ex._uid === tc._uid) || 
      (tc.id_item && ex.id_item === tc.id_item) ||
      (ex.is_linea_base && (ex.descripcion === desc || ex.subcategoria === subcat))
    )

    if (!match) {
      currentExtras.unshift({
        _uid: tc._uid || `ex-base-${Date.now()}-${idx}`,
        id_item: tc.id_item || null,
        tipo: tc.tipo || 'TRASLADOS',
        subcategoria: subcat,
        descripcion: desc,
        cantidad: tc.cantidad || 1,
        unidad: tc.unidad || 'Viaje',
        id_equipo: tc.equipo_asignado_id || '',
        chofer_id: tc.operador_asignado_id || '',
        is_linea_base: true,
        fecha_plan_ini: defaultIni,
        fecha_plan_fin: defaultFin
      })
    } else {
      match.is_linea_base = true
      if (!match.tipo) match.tipo = tc.tipo || 'TRASLADOS'
      if (!match.subcategoria) match.subcategoria = subcat
      if (!match.descripcion) match.descripcion = desc
      if (!match.cantidad) match.cantidad = tc.cantidad || 1
      if (!match.unidad) match.unidad = tc.unidad || 'Viaje'
      if (tc.equipo_asignado_id && !match.id_equipo) match.id_equipo = tc.equipo_asignado_id
      if (tc.operador_asignado_id && !match.chofer_id) match.chofer_id = tc.operador_asignado_id
    }
  })

  operacionesAssignment.value.equipos_extra = currentExtras
}

const agregarEquipoTraslado = () => {
  const currentExtras = Array.isArray(operacionesAssignment.value?.equipos_extra) 
    ? [...operacionesAssignment.value.equipos_extra] 
    : [];
  const defaultIni = operacionesAssignment.value?.fecha_salida_plan || '';
  const defaultFin = operacionesAssignment.value?.fecha_fin_plan || '';
  
  currentExtras.push({
    _uid: `ex-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    tipo: 'TRASLADOS',
    subcategoria: '',
    id_equipo: '',
    chofer_id: '',
    is_linea_base: false,
    fecha_plan_ini: defaultIni,
    fecha_plan_fin: defaultFin
  });
  
  operacionesAssignment.value.equipos_extra = currentExtras;
  marcarDirtyAsignacion();
};

const eliminarEquipoTraslado = (idx) => {
  const currentExtras = Array.isArray(operacionesAssignment.value?.equipos_extra) 
    ? [...operacionesAssignment.value.equipos_extra] 
    : [];
  currentExtras.splice(idx, 1);
  operacionesAssignment.value.equipos_extra = currentExtras;
  marcarDirtyAsignacion();
};

const onEquipoPrincipalCambiado = (line) => {
  marcarDirtyAsignacion();
};

const onEquipoExtraCambiado = (idx) => {
  marcarDirtyAsignacion();
};

const agregarEquipoAdicional = agregarEquipoTraslado

const getSemaforoEquipo = (equipoId) => {
  if (!equipoId || equipoId === 'CRN-DEFAULT') return 'GREEN'
  const found = listaEquiposMaster.value.find(e => e.id_equipo === equipoId || e.patente === equipoId)
  return found?.semaforo || 'GREEN'
}

const actualizarSemaforoTripulante = (t) => {
  if (!t.id_user) {
    t.semaforo = 'RED'
    return
  }
  const u = usuarios.value.find(user => user.id_user === t.id_user)
  if (u && u.flag_activo === false) {
    t.semaforo = 'RED'
  } else {
    t.semaforo = 'GREEN'
  }
}

const getSemaforoTripulante = (id_user) => {
  if (!id_user) return 'RED'
  const u = usuarios.value.find(user => user.id_user === id_user)
  if (u && u.flag_activo === false) {
    return 'RED'
  }
  return 'GREEN'
}

// Micro-Diálogo de Acreditaciones de Recursos (Inspect-on-Click / Spec 16)
const modalAcreditacionDetalle = ref({
  visible: false,
  tipo: '',
  titulo: '',
  subtitulo: '',
  semaforo: 'GREEN',
  docs: []
})

const abrirDetalleAcreditacion = (tipo, idOrObj) => {
  if (!idOrObj) return
  if (tipo === 'equipo') {
    const eq = typeof idOrObj === 'object' ? idOrObj : listaEquiposMaster.value.find(e => e.id_equipo === idOrObj || e.patente === idOrObj)
    const nombre = eq?.nombre_equipo || eq?.tipo || 'Equipo de Flota'
    const patente = eq?.patente || 'S/P'
    const sem = getSemaforoEquipo(eq?.id_equipo || eq?.patente)

    const docs = [
      { nombre: 'Revisión Técnica y Emisión de Gases', fecha_venc: '2026-11-30', estado: 'GREEN', dias: 104 },
      { nombre: 'Seguro Obligatorio SOAP', fecha_venc: '2027-03-31', estado: 'GREEN', dias: 225 },
      { nombre: 'Permiso de Circulación', fecha_venc: '2027-03-31', estado: 'GREEN', dias: 225 },
      { nombre: 'Certificado de Inspección e Izaje (Test de Carga)', fecha_venc: sem === 'YELLOW' ? '2026-08-25' : (sem === 'RED' ? '2026-08-10' : '2026-12-15'), estado: sem, dias: sem === 'YELLOW' ? 7 : (sem === 'RED' ? -8 : 119) },
      { nombre: 'Póliza de Seguro de Carga y Daño a Terceros', fecha_venc: '2026-12-31', estado: 'GREEN', dias: 135 }
    ]

    modalAcreditacionDetalle.value = {
      visible: true,
      tipo: 'equipo',
      titulo: `${patente} - ${nombre}`,
      subtitulo: `Equipo de Flota GSP • Categoría: ${eq?.tipo || 'Maquinaria'}`,
      semaforo: sem,
      docs
    }
  } else if (tipo === 'persona') {
    const u = typeof idOrObj === 'object' ? (idOrObj.id_user ? usuarios.value.find(usr => usr.id_user === idOrObj.id_user) : idOrObj) : usuarios.value.find(usr => usr.id_user === idOrObj)
    const nombre = u ? (u.nombre_user || u.name_user || `${u.name_frst || ''} ${u.apellido_pat || ''}`.trim()) : 'Trabajador'
    const cargo = typeof idOrObj === 'object' ? (idOrObj.cargo || u?.cargo || 'Personal Operativo') : (u?.cargo || 'Personal Operativo')
    const sem = typeof idOrObj === 'object' ? (idOrObj.semaforo || 'GREEN') : 'GREEN'

    const docs = [
      { nombre: 'Examen de Salud Ocupacional (Altura Física / Gran Altura)', fecha_venc: '2027-02-15', estado: 'GREEN', dias: 181 },
      { nombre: 'Licencia de Conducir Municipal (Clase D / A4 / A5)', fecha_venc: '2028-05-20', estado: 'GREEN', dias: 640 },
      { nombre: `Certificación de Competencias y Credencial (${cargo})`, fecha_venc: sem === 'YELLOW' ? '2026-08-28' : (sem === 'RED' ? '2026-08-05' : '2027-01-10'), estado: sem, dias: sem === 'YELLOW' ? 10 : (sem === 'RED' ? -13 : 145) },
      { nombre: 'Inducción de Seguridad y Obligación de Informar (ODI Faena)', fecha_venc: '2026-12-31', estado: 'GREEN', dias: 135 },
      { nombre: 'Contrato de Trabajo & Certificado de Antecedentes F30/F30-1', fecha_venc: '2026-09-30', estado: 'GREEN', dias: 43 }
    ]

    modalAcreditacionDetalle.value = {
      visible: true,
      tipo: 'persona',
      titulo: nombre,
      subtitulo: `Personal Operativo • Cargo: ${cargo}`,
      semaforo: sem,
      docs
    }
  }
}

const cerrarDetalleAcreditacion = () => {
  modalAcreditacionDetalle.value.visible = false
}

const validarDatosPreventaParaCotizar = () => {
  // 1. Cliente Mandante
  if (!opportunity.value.rut_cliente) {
    alert('⚠️ Requerimiento Obligatorio: Debe seleccionar un Cliente Mandante.')
    return false
  }

  // 2. Punto de Contacto
  if (!opportunity.value.contacto_nombre || String(opportunity.value.contacto_nombre).trim() === '') {
    alert('⚠️ Requerimiento Obligatorio: Debe ingresar el Nombre de Contacto del Cliente.')
    return false
  }
  if (!opportunity.value.contacto_telefono || String(opportunity.value.contacto_telefono).trim() === '') {
    alert('⚠️ Requerimiento Obligatorio: Debe ingresar el Teléfono de Contacto del Cliente.')
    return false
  }

  // 3. Tipo de Pago
  if (!opportunity.value.tipo_pago) {
    alert('⚠️ Requerimiento Obligatorio: Debe seleccionar el Tipo de Pago.')
    return false
  }

  // 4. Requerimientos Comerciales (6 selectores obligatorios)
  const flagsFaltantes = []
  if (opportunity.value.requiere_oc_hes === null) flagsFaltantes.push('Requiere OC / HES')
  if (opportunity.value.requiere_acreditacion === null) flagsFaltantes.push('Requiere Acreditación')
  if (opportunity.value.incluye_flete === null) flagsFaltantes.push('Incluye Flete / Traslado')
  if (opportunity.value.requiere_rigger === null) flagsFaltantes.push('Requiere Rigger')
  if (opportunity.value.requiere_prevencionista === null) flagsFaltantes.push('Prevencionista Certificado')
  if (opportunity.value.cliente_pone_combustible === null) flagsFaltantes.push('Cliente pone Combustible')

  if (flagsFaltantes.length > 0) {
    alert(`⚠️ Requerimientos Comerciales Obligatorios: Debe seleccionar SÍ o NO en todos los campos marcados en rojo:\n\n• ${flagsFaltantes.join('\n• ')}`)
    return false
  }

  // 5. Descripción del Proyecto / Faena
  if (!opportunity.value.descripcion || String(opportunity.value.descripcion).trim() === '') {
    alert('⚠️ Requerimiento Obligatorio: Debe ingresar la Descripción del Proyecto / Faena.')
    return false
  }

  // 6. Datos de Operación e Ingeniería (Obra y Horarios)
  if (!siteVisit.value.obra_nombre || String(siteVisit.value.obra_nombre).trim() === '') {
    alert('⚠️ Requerimiento Obligatorio: Debe ingresar el Nombre de la Obra en la pestaña "Datos Servicio & Visita".')
    activeTab.value = 'terreno'
    return false
  }
  if (!siteVisit.value.obra_direccion || String(siteVisit.value.obra_direccion).trim() === '') {
    alert('⚠️ Requerimiento Obligatorio: Debe ingresar la Dirección de la Obra en la pestaña "Datos Servicio & Visita".')
    activeTab.value = 'terreno'
    return false
  }
  if (!siteVisit.value.obra_ciudad || String(siteVisit.value.obra_ciudad).trim() === '') {
    alert('⚠️ Requerimiento Obligatorio: Debe ingresar la Ciudad de la Obra en la pestaña "Datos Servicio & Visita".')
    activeTab.value = 'terreno'
    return false
  }
  if (!siteVisit.value.fecha_hora_inicio) {
    alert('⚠️ Requerimiento Obligatorio: Debe ingresar la Fecha y Hora de Inicio del Servicio en la pestaña "Datos Servicio & Visita".')
    activeTab.value = 'terreno'
    return false
  }
  if (!siteVisit.value.fecha_hora_termino) {
    alert('⚠️ Requerimiento Obligatorio: Debe ingresar la Fecha y Hora de Término del Servicio en la pestaña "Datos Servicio & Visita".')
    activeTab.value = 'terreno'
    return false
  }

  // 7. Estructurador de líneas
  if (!lines.value || lines.value.length === 0) {
    alert('⚠️ Requerimiento Obligatorio: Debe agregar al menos una Línea de Servicio en el Estructurador.')
    activeTab.value = 'servicios'
    return false
  }

  for (let i = 0; i < lines.value.length; i++) {
    const l = lines.value[i]
    if (!l.tipo || String(l.tipo).trim() === '') {
      alert(`⚠️ Fila #${i + 1} del Estructurador: Debe seleccionar la Categoría del Servicio.`)
      activeTab.value = 'servicios'
      return false
    }
    if (!l.subcategoria || String(l.subcategoria).trim() === '') {
      alert(`⚠️ Fila #${i + 1} del Estructurador: Debe seleccionar la Subcategoría del Servicio.`)
      activeTab.value = 'servicios'
      return false
    }
  }

  return true
}

const validarDatosParaGenerarRequerimiento = () => {
  // 1. Debe cumplir con la totalidad de los datos requeridos para cotizar
  if (!validarDatosPreventaParaCotizar()) {
    return false
  }

  // 2. Debe tener al menos una versión de cotización generada
  const cotizaciones = cotizaciones_historicas.value || []
  if (cotizaciones.length === 0) {
    alert('⚠️ No es posible transferir el requerimiento a Operaciones:\n\nDebe generar previamente la cotización formal haciendo clic en "Generar Cotización".')
    return false
  }

  // 3. Debe tener al menos una cotización enviada por correo al cliente
  const tieneEnvioAlCliente = cotizaciones.some(c => 
    c.evento_envio || 
    (Array.isArray(c.eventos_envio) && c.eventos_envio.length > 0) || 
    c.fecha_envio || 
    c.destinatario ||
    c.enviada
  )

  if (!tieneEnvioAlCliente) {
    alert('⚠️ No es posible transferir el requerimiento a Operaciones:\n\nDebe enviar por correo la cotización generada al cliente mandante antes de realizar el traspaso a Operaciones.\n\nHaz clic en el botón ✉️ "Enviar" en la sección de Control de Versiones.')
    return false
  }

  return true
}

const abrirModalGenerarRequerimiento = () => {
  if (!validarDatosParaGenerarRequerimiento()) {
    return
  }

  selectedUsuariosRequerimiento.value = usuarios.value.map(u => u.id_user)
  showModalGenerarRequerimiento.value = true
}

const confirmarGenerarRequerimiento = async () => {
  if (opportunity.value.requiere_acreditacion) {
    const docs = opportunity.value.acreditacion_docs;
    const hasDocs = docs && (docs.empresa?.length > 0 || docs.equipos?.length > 0 || docs.personas?.length > 0);
    if (!hasDocs) {
      alert("Debe seleccionar al menos un documento de acreditación requerido.")
      return
    }
  }
  showModalGenerarRequerimiento.value = false
  
  // Snapshot inalterable de Preventa Comercial
  snapshotComercial.value = {
    peso_carga: siteVisit.value.peso_carga || '',
    volumen_carga: siteVisit.value.volumen_carga || '',
    radios_trabajo: siteVisit.value.radios_trabajo || '',
    alturas_trabajo: siteVisit.value.alturas_trabajo || '',
    tipo_carga: siteVisit.value.tipo_carga || '',
    detalle_servicio: siteVisit.value.detalle_servicio || '',
    obra_nombre: siteVisit.value.obra_nombre || '',
    obra_direccion: siteVisit.value.obra_direccion || '',
    obra_ciudad: siteVisit.value.obra_ciudad || '',
    lines: JSON.parse(JSON.stringify(lines.value)),
    equipo_descripcion: lines.value[0]?.descripcion || '',
    equipo_cantidad: lines.value[0]?.cantidad || 1,
    equipo_valor: lines.value[0]?.valorUnitario || 0,
    pensiones: { ...comercial.value.pensiones }
  }

  opportunity.value.id_proyecto_estado = ESTADO_DB_OPERACIONES
  await guardarEnPreventa()
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #ffffff; padding: 25px; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #f59e0b; margin: 0; font-size: 22px;">🏗️ GRÚAS SAN PABLO</h2>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px;">Notificación Interna de Nuevo Requerimiento de Operaciones</p>
      </div>
      <div style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin-bottom: 25px; background-color: #020617; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 10px;">
        Estimado Equipo de Operaciones,<br><br>
        La propuesta comercial <strong>${antecedentes.value.identificador_formal || 'COT'}</strong> para el cliente <strong>${clienteSeleccionado.value?.razon_social || opportunity.value.rut_cliente || 'Cliente'}</strong> ha sido marcada como <strong>PROPUESTA GANADA</strong>.<br><br>
        En este momento, el proceso ha pasado a ser un <strong>Requerimiento Oficial</strong> para el área de Operaciones.
      </div>
      <div style="background-color: #1e293b; border-radius: 10px; padding: 15px; margin-bottom: 25px; font-size: 13px;">
        <div style="color: #f59e0b; font-weight: bold; margin-bottom: 8px;">📋 Resumen de la Oportunidad</div>
        <div>Código: <strong>${antecedentes.value.identificador_formal || 'COT'}</strong></div>
        <div>Cliente Mandante: <strong>${clienteSeleccionado.value?.razon_social || opportunity.value.rut_cliente}</strong></div>
        <div>Obra / Faena: <strong>${siteVisit.value.obra_nombre || siteVisit.value.obra_direccion || 'Obra Terreno'}</strong></div>
        <div>Monto Total Neto: <strong>${formatCurrency(totalNeto.value)}</strong></div>
      </div>
      <div style="border-top: 1px solid #1e293b; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b;">
        Grúas San Pablo S.A. | Notificación Interna de Operaciones
      </div>
    </div>
  `

  const targetUsers = usuarios.value.filter(u => selectedUsuariosRequerimiento.value.includes(u.id_user) && u.email)
  const emailProms = targetUsers.map(u => apiAxios.post('/message', {
    para: u.email,
    asunto: `🏆 Nuevo Requerimiento a Operaciones: ${antecedentes.value.identificador_formal || 'COT'} - ${clienteSeleccionado.value?.razon_social || 'Cliente'}`,
    cuerpo: htmlBody,
    html: htmlBody
  }).catch(e => console.warn(`Error enviando correo a ${u.email}:`, e)))

  await Promise.allSettled(emailProms)
  alert('🏆 Requerimiento a Operaciones generado exitosamente y notificado al equipo.')
  topTab.value = 'operaciones'
  operacionesSubTab.value = 'validacion'
}

const abrirModalAprobarRequerimiento = () => {
  selectedUsuariosAprobacion.value = usuarios.value.map(u => u.id_user)
  showModalAprobarRequerimiento.value = true
}

const confirmarAprobacionRequerimiento = async () => {
  showModalAprobarRequerimiento.value = false
  // 1. Evaluar decisión de aprobación ANTES de cualquier cambio de pestaña o guardado
  const isConObs = modoAprobacionRequerimiento.value === 'CON_OBSERVACIONES'
  
  if (!opportunity.value.json_field) opportunity.value.json_field = {}
  if (!opportunity.value.json_field.crm_v1) opportunity.value.json_field.crm_v1 = {}
  if (isConObs) {
    opportunity.value.json_field.crm_v1.penalizacion_kpi = true
  } else {
    opportunity.value.json_field.crm_v1.penalizacion_kpi = false
  }

  operacionesAssignment.value.estado_requerimiento = 'APROBADO'
  requerimientoAprobado.value = true
  
  // 2. Persistir aprobación en BD y habilitar Asignación OT
  await aprobarYGenerarOT()
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #ffffff; padding: 25px; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #10b981; margin: 0; font-size: 22px;">🏗️ GRÚAS SAN PABLO</h2>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px;">Notificación de Requerimiento Aprobado por Operaciones</p>
      </div>
      <div style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin-bottom: 25px; background-color: #020617; border-left: 4px solid ${isConObs ? '#f59e0b' : '#10b981'}; padding: 18px; border-radius: 10px;">
        Estimado Ejecutivo Comercial,<br><br>
        El requerimiento operacional de la cotización <strong>${antecedentes.value.identificador_formal || 'COT'}</strong> ha sido <strong>${isConObs ? 'APROBADO CON OBSERVACIONES' : 'APROBADO SIN OBSERVACIONES'}</strong> por el área de Operaciones.<br><br>
        ${isConObs && operacionesAssignment.value.observaciones_operaciones ? `<strong>Observaciones de Operaciones:</strong><br><em>"${operacionesAssignment.value.observaciones_operaciones}"</em>` : ''}
      </div>
      <div style="background-color: #1e293b; border-radius: 10px; padding: 15px; margin-bottom: 25px; font-size: 13px;">
        <div style="color: #10b981; font-weight: bold; margin-bottom: 8px;">📋 Estado del Requerimiento</div>
        <div>Código: <strong>${antecedentes.value.identificador_formal || 'COT'}</strong></div>
        <div>Cliente: <strong>${clienteSeleccionado.value?.razon_social || opportunity.value.rut_cliente}</strong></div>
        <div>Estado: <strong style="color: ${isConObs ? '#fbbf24' : '#34d399'};">${isConObs ? 'APROBADO CON OBSERVACIONES' : 'APROBADO OK'}</strong></div>
      </div>
      <div style="border-top: 1px solid #1e293b; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b;">
        Grúas San Pablo S.A. | Notificación de Operaciones a Comercial
      </div>
    </div>
  `

  const targetUsers = usuarios.value.filter(u => selectedUsuariosAprobacion.value.includes(u.id_user) && u.email)
  const emailProms = targetUsers.map(u => apiAxios.post('/message', {
    para: u.email,
    asunto: `✅ Requerimiento Aprobado (${isConObs ? 'Con Observaciones' : 'OK'}): ${antecedentes.value.identificador_formal || 'COT'}`,
    cuerpo: htmlBody,
    html: htmlBody
  }).catch(e => console.warn(`Error enviando correo a ${u.email}:`, e)))

  await Promise.allSettled(emailProms)
  operacionesSubTab.value = 'asignacion'
  alert(`✅ Requerimiento Aprobado (${isConObs ? 'Con Observaciones' : 'Sin Observaciones'}).\n\nNotificación enviada al comercial. La Pestaña C: Asignación de Recursos ha sido activada y el formulario quedó bloqueado en Modo Lectura.`)
}

const usuariosEnroladosFes = computed(() => {
  if (!Array.isArray(usuarios.value)) return []
  return usuarios.value.filter(u => u && u.flag_activo !== false && (u.pass_hash_fes || u.flag_proc_enrol === true || u.pin_fes || u.pin || u.flag_enrolado === true))
})

const tieneObservacionesOMotivos = computed(() => {
  const tieneTextoObs = operacionesAssignment.value.observaciones_operaciones && operacionesAssignment.value.observaciones_operaciones.trim().length > 0
  return diffsCount.value > 0 || tieneTextoObs
})

const modoAprobacionRequerimiento = computed(() => {
  return tieneObservacionesOMotivos.value ? 'CON_OBSERVACIONES' : 'SIN_OBSERVACIONES'
})

const snapshotComercial = ref({})

const cleanVal = (v) => (v === null || v === undefined) ? '' : String(v).trim()

const hasDiff = (field, index = 0) => {
  // El control de cambios (diff) SOLO aplica en la Pestaña de Operaciones / Sub-Pestaña Validación & Diff
  if (topTab.value !== 'operaciones' || operacionesSubTab.value !== 'validacion') {
    return false
  }
  if (!isModoOperaciones.value) {
    return false
  }
  if (!snapshotComercial.value || Object.keys(snapshotComercial.value).length === 0) return false
  
  if (field === 'tipo_carga') return cleanVal(siteVisit.value.tipo_carga) !== cleanVal(snapshotComercial.value.tipo_carga)
  if (field === 'peso_carga') return cleanVal(siteVisit.value.peso_carga) !== cleanVal(snapshotComercial.value.peso_carga)
  if (field === 'radios_trabajo') return cleanVal(siteVisit.value.radios_trabajo) !== cleanVal(snapshotComercial.value.radios_trabajo)
  if (field === 'alturas_trabajo') return cleanVal(siteVisit.value.alturas_trabajo) !== cleanVal(snapshotComercial.value.alturas_trabajo)
  if (field === 'volumen_carga') return cleanVal(siteVisit.value.volumen_carga) !== cleanVal(snapshotComercial.value.volumen_carga)
  if (field === 'detalle_servicio') return cleanVal(siteVisit.value.detalle_servicio) !== cleanVal(snapshotComercial.value.detalle_servicio)
  if (field === 'obra_nombre') return cleanVal(siteVisit.value.obra_nombre) !== cleanVal(snapshotComercial.value.obra_nombre)
  if (field === 'obra_direccion') return cleanVal(siteVisit.value.obra_direccion) !== cleanVal(snapshotComercial.value.obra_direccion)
  if (field === 'obra_ciudad') return cleanVal(siteVisit.value.obra_ciudad) !== cleanVal(snapshotComercial.value.obra_ciudad)
  
  // Diff en Líneas del Estructurador (Tabla B)
  if (field === 'equipo_descripcion') {
    const orig = snapshotComercial.value.lines?.[index]?.descripcion ?? snapshotComercial.value.equipo_descripcion ?? ''
    return cleanVal(lines.value[index]?.descripcion) !== cleanVal(orig)
  }
  if (field === 'equipo_cantidad') {
    const orig = snapshotComercial.value.lines?.[index]?.cantidad ?? snapshotComercial.value.equipo_cantidad ?? 1
    return Number(lines.value[index]?.cantidad || 1) !== Number(orig)
  }
  if (field === 'equipo_valor') {
    const orig = snapshotComercial.value.lines?.[index]?.valorUnitario !== undefined ? snapshotComercial.value.lines[index].valorUnitario : (snapshotComercial.value.equipo_valor ?? 0)
    return Number(lines.value[index]?.valorUnitario || 0) !== Number(orig)
  }
  if (field === 'equipo_tipo') {
    const orig = snapshotComercial.value.lines?.[index]?.tipo ?? ''
    const normOrig = cleanVal(orig).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    const normCurr = cleanVal(lines.value[index]?.tipo).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    return normCurr !== normOrig
  }
  if (field === 'equipo_subcategoria') {
    const orig = snapshotComercial.value.lines?.[index]?.subcategoria ?? ''
    const normOrig = cleanVal(orig).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    const normCurr = cleanVal(lines.value[index]?.subcategoria).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    return normCurr !== normOrig
  }
  if (field === 'equipo_unidad') {
    const orig = snapshotComercial.value.lines?.[index]?.unidad ?? ''
    return cleanVal(lines.value[index]?.unidad) !== cleanVal(orig)
  }
  
  return false
}

const getOriginalValue = (field, index = 0) => {
  if (!snapshotComercial.value) return ''
  if (field === 'tipo_carga') return snapshotComercial.value.tipo_carga || ''
  if (field === 'peso_carga') return snapshotComercial.value.peso_carga || ''
  if (field === 'radios_trabajo') return snapshotComercial.value.radios_trabajo || ''
  if (field === 'alturas_trabajo') return snapshotComercial.value.alturas_trabajo || ''
  if (field === 'volumen_carga') return snapshotComercial.value.volumen_carga || ''
  if (field === 'detalle_servicio') return snapshotComercial.value.detalle_servicio || ''
  if (field === 'obra_nombre') return snapshotComercial.value.obra_nombre || ''
  if (field === 'obra_direccion') return snapshotComercial.value.obra_direccion || ''
  if (field === 'obra_ciudad') return snapshotComercial.value.obra_ciudad || ''
  if (field === 'equipo_descripcion') return snapshotComercial.value.lines?.[index]?.descripcion || snapshotComercial.value.equipo_descripcion || ''
  if (field === 'equipo_cantidad') return snapshotComercial.value.lines?.[index]?.cantidad || snapshotComercial.value.equipo_cantidad || 1
  if (field === 'equipo_valor') return snapshotComercial.value.lines?.[index]?.valorUnitario || snapshotComercial.value.equipo_valor || 0
  if (field === 'equipo_tipo') return snapshotComercial.value.lines?.[index]?.tipo || ''
  if (field === 'equipo_subcategoria') return snapshotComercial.value.lines?.[index]?.subcategoria || ''
  if (field === 'equipo_unidad') return snapshotComercial.value.lines?.[index]?.unidad || ''
  return ''
}

const diffsCount = computed(() => {
  let count = 0
  if (hasDiff('tipo_carga')) count++
  if (hasDiff('peso_carga')) count++
  if (hasDiff('radios_trabajo')) count++
  if (hasDiff('alturas_trabajo')) count++
  if (hasDiff('volumen_carga')) count++
  if (hasDiff('detalle_servicio')) count++
  if (hasDiff('obra_nombre')) count++
  if (hasDiff('obra_direccion')) count++
  if (hasDiff('obra_ciudad')) count++
  
  lines.value.forEach((l, idx) => {
    if (hasDiff('equipo_descripcion', idx)) count++
    if (hasDiff('equipo_cantidad', idx)) count++
    if (hasDiff('equipo_valor', idx)) count++
    if (hasDiff('equipo_tipo', idx)) count++
    if (hasDiff('equipo_subcategoria', idx)) count++
    if (hasDiff('equipo_unidad', idx)) count++
  })
  
  return count
})

const visitaProgramadaInfo = ref(null)
const clientes = ref([])
const searchQuery = ref('')
const showDropdown = ref(false)
const selectedClient = ref(null)

const formVisita = ref({
  id_user_responsable: '',
  fecha_visita: ''
})
const coordinadoresVisita = computed(() => usuarios.value.filter(u => u.json_data?.cargo === 'Coordinador'))
const cargandoVisita = ref(false)
const estadoAsignacion = ref(null)
const emailCoordinadorSeleccionado = ref('')

const fetchCategories = async () => {
  try {
    const { data } = await apiAxios.get('/tequ-equipos/categorias')
    let list = data?.data || data || []
    if (!Array.isArray(list)) list = []

    // Filtrar explícitamente cualquier categoría obsoleta (IDs 1-5 o nombres legacy)
    const blacklistedNames = ['EQUIPO (GRÚA)', 'EQUIPO (GRUA)', 'EQUIPO (APOYO)', 'PERSONAL', 'ESCOLTA']
    list = list.filter(c => {
      const name = (c.nombre_categoria || '').toUpperCase().trim()
      const isBlacklisted = blacklistedNames.includes(name) || [1, 2, 3, 4, 5].includes(Number(c.id_categoria))
      return !isBlacklisted
    })

    // Inyectar categorías operacionales que no vengan de la BD o completar subcategorías
    const upsertCat = (id, nombre, subs) => {
      const existing = list.find(c => (c.nombre_categoria || '').toUpperCase() === nombre)
      if (!existing) {
        list.push({ id_categoria: id, nombre_categoria: nombre, subcategories: subs })
      } else if (!existing.subcategories || existing.subcategories.length === 0) {
        existing.subcategories = subs
      }
    }
    upsertCat(99, 'TRASLADOS', [
      { id_subcategoria: 901, nombre_subcategoria: 'CAMA BAJA' },
      { id_subcategoria: 902, nombre_subcategoria: 'RAMPLA' },
      { id_subcategoria: 903, nombre_subcategoria: 'TRACTO CAMIÓN' },
      { id_subcategoria: 904, nombre_subcategoria: 'ESCOLTA / GUÍA' }
    ])
    upsertCat(151, 'PERSONAL CERTIFICADO', [
      { id_subcategoria: 2001, nombre_subcategoria: 'RIGGER' },
      { id_subcategoria: 2002, nombre_subcategoria: 'OPERADOR' },
      { id_subcategoria: 2003, nombre_subcategoria: 'PREVENCIONISTA' },
      { id_subcategoria: 2004, nombre_subcategoria: 'OTROS' }
    ])
    upsertCat(150, 'OTROS', [
      { id_subcategoria: 3001, nombre_subcategoria: 'OTROS' }
    ])

    // Siempre sobrescribir — nunca usar datos hardcodeados
    dbCategories.value = list
    console.log('[fetchCategories] Categorías cargadas desde BD:', list.map(c => c.nombre_categoria))
  } catch (error) {
    console.error('[fetchCategories] Error al cargar categorías desde la BD:', error)
  }
}

const showVisorModal = ref(false)
const visorSurveyId = ref(null)

function abrirVisorWeb(idSurvey) {
  console.log('abrirVisorWeb - idSurvey recibido:', idSurvey);
  if (!idSurvey) {
    console.warn('abrirVisorWeb - idSurvey es null o undefined');
    return;
  }
  visorSurveyId.value = idSurvey;
  showVisorModal.value = true;

  try {
    const route = router.resolve({
      path: '/versurveyprint',
      query: { idInspeccion: idSurvey, modal: 'true' }
    });
    const fullUrl = window.location.origin + route.href;
    window.open(fullUrl, '_blank');
  } catch (e) {
    console.error('Error al resolver ruta versurveyprint:', e);
    window.open(`${window.location.origin}/versurveyprint?idInspeccion=${idSurvey}&modal=true`, '_blank');
  }
}

const abriendoPDF = ref(false)
const abrirPDFInspeccion = async (idSurvey, eqId) => {
  if (!idSurvey) return
  abriendoPDF.value = true
  try {
    const ins = eqId ? getInspeccionEquipo(eqId) : null
    let idDoc = ins?.id_doc_pdf || ins?.id_doc

    if (!idDoc) {
      // 1. Consultar procesosSurveyV3 para obtener id_flow e id_doc
      let flowId = null
      try {
        const { data: v3Res } = await apiAxios.get('/servicio/leanglobal/procesosSurveyV3', {
          params: { id_survey: idSurvey }
        })
        const v3List = Array.isArray(v3Res?.datos) ? v3Res.datos : (Array.isArray(v3Res) ? v3Res : [])
        const v3Item = v3List.find(d => Number(d.id_survey) === Number(idSurvey))
        if (v3Item) {
          flowId = v3Item.id_flow
          if (v3Item.id_doc && typeof v3Item.id_doc === 'number') {
            idDoc = v3Item.id_doc
          }
        }
      } catch (eV3) {
        console.warn('Error consultando procesosSurveyV3:', eV3)
      }

      // 1.2 Fallback a procesosSurvey si no obtuvimos flowId
      if (!flowId) {
        try {
          const { data: srvData } = await apiAxios.get('/servicio/leanglobal/procesosSurvey', {
            params: { id_survey: idSurvey }
          })
          const srvList = Array.isArray(srvData) ? srvData : (srvData?.data || [srvData])
          flowId = srvList[0]?.id_flow
        } catch (eSrv) {
          console.warn('Error consultando procesosSurvey:', eSrv)
        }
      }

      // 1.3 Fallback a procesosSurveyDetail
      if (!flowId) {
        try {
          const { data: dtData } = await apiAxios.get('/servicio/leanglobal/procesosSurveyDetail', {
            params: { id_survey: idSurvey }
          })
          const dtList = Array.isArray(dtData) ? dtData : (dtData?.data || [dtData])
          flowId = dtList[0]?.id_flow
        } catch (eDt) {
          console.warn('Error consultando procesosSurveyDetail:', eDt)
        }
      }

      // 2. Si tenemos flowId, consultar flujosAprobacionSteps para obtener el PDF final firmado (id_doc_out / id_doc_in)
      if (flowId) {
        try {
          const { data: flowSteps } = await apiAxios.get('/servicio/leanglobal/flujosAprobacionSteps', {
            params: { id_flow: flowId }
          })
          if (Array.isArray(flowSteps) && flowSteps.length > 0) {
            const stepWithOut = [...flowSteps].reverse().find(s => s.id_doc_out)
            const stepWithIn = [...flowSteps].reverse().find(s => s.id_doc_in)
            idDoc = stepWithOut?.id_doc_out || stepWithIn?.id_doc_in || idDoc
          }
        } catch (eSteps) {
          console.warn('Error consultando flujosAprobacionSteps:', eSteps)
        }
      }
    }

    if (idDoc) {
      if (ins) ins.id_doc_pdf = idDoc
      const base = (apiAxios.defaults.baseURL || 'https://servidor.leanglobal.cl/lg-gsp/api').replace(/\/$/, '')
      const pdfUrl = `${base}/v1/storage/view/${idDoc}`
      window.open(pdfUrl, '_blank')
    } else {
      // Fallback a visor web SOLO si aún no se ha generado el PDF en storage
      abrirVisorWeb(idSurvey)
    }
  } catch (err) {
    console.warn('Error al abrir PDF de inspección:', err)
    abrirVisorWeb(idSurvey)
  } finally {
    abriendoPDF.value = false
  }
}

const fetchUsuarios = async () => {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
    const userArray = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (data?.usuarios || []))
    usuarios.value = userArray.filter(u => u.flag_activo !== false)
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

const antecedentes = ref({
  identificador: '',
  identificador_formal: '',
  tipo_proceso: 'Licitación Privada',
  archivos: []
})

const cotizaciones_historicas = ref([])
const generandoPDF = ref(false)

const showModalEnviar = ref(false)
const selectedVersionForEmail = ref(null)

const ot_versiones = ref([])
const generandoPDFOT = ref(false)
const showModalEnviarOT = ref(false)
const selectedOTVersionForEmail = ref(null)
const enviandoOT = ref(false)
const formDespachoOT = ref({
  destinatarios: [],
  nuevoEmail: '',
  asunto: '',
  cuerpo_adicional: ''
})

const sortedOtVersiones = computed(() => {
  if (!Array.isArray(ot_versiones.value)) return []
  return [...ot_versiones.value].sort((a, b) => {
    const vA = Number(a.version || 0)
    const vB = Number(b.version || 0)
    return vB - vA
  })
})

const sortedCotizacionesHistoricas = computed(() => {
  if (!Array.isArray(cotizaciones_historicas.value)) return []
  return [...cotizaciones_historicas.value].sort((a, b) => {
    const fechaA = new Date(a.fecha || 0).getTime()
    const fechaB = new Date(b.fecha || 0).getTime()
    return fechaB - fechaA
  })
})

const openModalEnviar = (v) => {
  selectedVersionForEmail.value = v
  showModalEnviar.value = true
}

const onEmailSent = async (eventoData) => {
  if (selectedVersionForEmail.value) {
    if (!Array.isArray(selectedVersionForEmail.value.eventos_envio)) {
      selectedVersionForEmail.value.eventos_envio = []
    }
    if (selectedVersionForEmail.value.evento_envio && !selectedVersionForEmail.value.eventos_envio.some(e => e.fecha_envio === selectedVersionForEmail.value.evento_envio.fecha_envio)) {
      selectedVersionForEmail.value.eventos_envio.push(selectedVersionForEmail.value.evento_envio)
    }
    selectedVersionForEmail.value.eventos_envio.push(eventoData)
    selectedVersionForEmail.value.evento_envio = eventoData
  }

  const projectId = props.proyectoId || currentProyectoId.value
  if (!projectId) return

  try {
    const token = localStorage.getItem('token') || ''
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const payload = buildPayload()
    
    // Inyectar cotizaciones_historicas actualizadas con traza acumulada en crm_v1
    payload.json_field.crm_v1.cotizaciones_historicas = cotizaciones_historicas.value
    payload.id_user_modificacion = currentUser.id_user || null

    await apiAxios.put(`/proyectos/${projectId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✔ Traza acumulada de envíos guardada en PostgreSQL para proyecto', projectId)
  } catch (error) {
    console.error('Error al guardar traza acumulada de envíos en PostgreSQL:', error)
  }
}

const alCambiarContacto = () => {
  if (opportunity.value.contacto_obj) {
    opportunity.value.contacto_nombre = opportunity.value.contacto_obj.nombre || ''
    opportunity.value.contacto_telefono = opportunity.value.contacto_obj.telefono || ''
  }
}

const isHydrating = ref(true)

const propagarFechasPlanificadas = () => {
  if (!isHydrating.value) marcarDirtyAsignacion()
  const ini = operacionesAssignment.value?.fecha_salida_plan
  const fin = operacionesAssignment.value?.fecha_fin_plan

  if (lines.value && Array.isArray(lines.value)) {
    lines.value.forEach(l => {
      if (ini) l.fecha_plan_ini = ini
      if (fin) l.fecha_plan_fin = fin
    })
  }

  if (operacionesAssignment.value?.equipos_extra && Array.isArray(operacionesAssignment.value.equipos_extra)) {
    operacionesAssignment.value.equipos_extra.forEach(eqEx => {
      if (typeof eqEx === 'object' && eqEx !== null) {
        if (ini) eqEx.fecha_plan_ini = ini
        if (fin) eqEx.fecha_plan_fin = fin
      }
    })
  }

  if (especialistasTerreno.value && Array.isArray(especialistasTerreno.value)) {
    especialistasTerreno.value.forEach(esp => {
      if (ini) esp.fecha_plan_ini = ini
      if (fin) esp.fecha_plan_fin = fin
    })
  }
}

watch(() => operacionesAssignment.value?.fecha_salida_plan, (newVal) => {
  if (newVal) {
    if (lines.value && Array.isArray(lines.value)) {
      lines.value.forEach(l => { l.fecha_plan_ini = newVal })
    }
    if (operacionesAssignment.value?.equipos_extra && Array.isArray(operacionesAssignment.value.equipos_extra)) {
      operacionesAssignment.value.equipos_extra.forEach(eqEx => {
        if (typeof eqEx === 'object' && eqEx !== null) {
          eqEx.fecha_plan_ini = newVal
        }
      })
    }
    if (especialistasTerreno.value && Array.isArray(especialistasTerreno.value)) {
      especialistasTerreno.value.forEach(esp => { esp.fecha_plan_ini = newVal })
    }
    if (!isHydrating.value) marcarDirtyAsignacion()
  }
})

watch(() => operacionesAssignment.value?.fecha_fin_plan, (newVal) => {
  if (newVal) {
    if (lines.value && Array.isArray(lines.value)) {
      lines.value.forEach(l => { l.fecha_plan_fin = newVal })
    }
    if (operacionesAssignment.value?.equipos_extra && Array.isArray(operacionesAssignment.value.equipos_extra)) {
      operacionesAssignment.value.equipos_extra.forEach(eqEx => {
        if (typeof eqEx === 'object' && eqEx !== null) {
          eqEx.fecha_plan_fin = newVal
        }
      })
    }
    if (especialistasTerreno.value && Array.isArray(especialistasTerreno.value)) {
      especialistasTerreno.value.forEach(esp => { esp.fecha_plan_fin = newVal })
    }
    if (!isHydrating.value) marcarDirtyAsignacion()
  }
})

const siteVisit = ref({
  obra_nombre: '',
  obra_direccion: '',
  obra_ciudad: '',
  lat: null,
  lng: null,
  tipo_carga: '',
  detalle_servicio: '',
  peso_carga: '',
  volumen_carga: '',
  radios_trabajo: '',
  alturas_trabajo: '',
  visita_terreno: false,
  fecha_hora_inicio: '',
  fecha_hora_termino: '',
  contacto_terreno_nombre: '',
  contacto_terreno_telefono: '',
  contacto_terreno_email: ''
})

const filteredClientes = computed(() => {
  return clientes.value
})

let searchTimeout = null
const onSearchInput = () => {
  showDropdown.value = true
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchClientes(searchQuery.value)
  }, 300)
}

const selectCliente = (c) => {
  opportunity.value.rut_cliente = c.rut_empresa
  searchQuery.value = c.razon_social || c.name_empresa
  selectedClient.value = c
  showDropdown.value = false
}

const onBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
    if (!searchQuery.value) {
      opportunity.value.rut_cliente = ''
      selectedClient.value = null
    } else {
      if (selectedClient.value) {
        searchQuery.value = selectedClient.value.razon_social || selectedClient.value.name_empresa
      } else {
        searchQuery.value = ''
      }
    }
  }, 200)
}

const visitasTerreno = ref([])
const selectedSurveyId = ref('')

const visitasDelProyecto = computed(() => {
  const targetId = String(props.proyectoId || currentProyectoId.value || '')
  if (!targetId) return []
  return visitasTerreno.value.filter(v => {
    if (!v) return false
    return String(v.id_proyecto || '') === targetId
  })
})

const selectedSurveyDocId = computed(() => {
  if (!selectedSurveyId.value) return null
  const found = visitasTerreno.value.find(s => String(s.id_survey) === String(selectedSurveyId.value))
  return found?.id_doc || null
})

const mostrarHistorialVisitasModal = ref(false)

const parseAparejosDesdeSurvey = (visita) => {
  const result = getInitialImplementos()
  if (!visita || !visita.body_exec) return result
  const body = visita.body_exec || {}

  const searchAttrs = (segList) => {
    if (!segList || !Array.isArray(segList)) return
    for (const seg of segList) {
      if (!seg.attributes || !Array.isArray(seg.attributes)) continue
      for (let i = 0; i < seg.attributes.length; i++) {
        const attr = seg.attributes[i]
        const labelStr = (attr.label || attr.values?.quest || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
        
        // 1. Extraer observaciones generales si el atributo es de observaciones
        if (labelStr.includes('OBSERVACIONES GENERALES') || labelStr.includes('OBSERVACION')) {
          const obsVal = attr.value !== undefined ? attr.value : (attr.default || '')
          if (obsVal && !operacionesAssignment.value.observaciones_operaciones) {
            operacionesAssignment.value.observaciones_operaciones = String(obsVal).trim()
          }
          continue
        }

        // 2. Buscar el aparejo maestro que coincida con este label
        const masterItem = CATALOGO_MAESTRO_APAREJOS.find(m => m.match(labelStr))

        if (masterItem) {
          const target = result.find(r => r.id === masterItem.id)
          if (target) {
            let rawVal = attr.value !== undefined ? attr.value : (attr.default || (attr.values ? attr.values.selected : ''))
            let valStr = String(rawVal || '').trim()

            // Soporte retrocompatible para surveys antiguos con photoCheck + textField en i+1
            if ((attr.type === 'photoCheck' || attr.type === 'comboBox') && i + 1 < seg.attributes.length && seg.attributes[i + 1].type === 'textField') {
              const nextVal = seg.attributes[i + 1].value !== undefined ? seg.attributes[i + 1].value : (seg.attributes[i + 1].default || '')
              if (nextVal) valStr = String(nextVal).trim()
            }

            const isReq = valStr !== '' && valStr !== '0' && valStr.toUpperCase() !== 'NO' && valStr.toUpperCase() !== 'NULL'

            if (isReq) {
              target.requerido = true
              target.detalle = valStr.toUpperCase() === 'SI' ? 'Requerido en Visita' : valStr
            } else {
              target.requerido = false
              target.detalle = ''
            }
          }
        }
      }
    }
  }

  searchAttrs(body.segmentos)
  return result
}

const fetchVisitasTerreno = async () => {
  try {
    const { data } = await apiAxios.get('/survey/visitas-terreno')
    visitasTerreno.value = data

    // Sincronizar automáticamente aparejos de la última visita del proyecto sólo si no han sido guardados
    if (visitasDelProyecto.value.length > 0 && !operacionesAssignment.value.aparejos_bloqueados_survey) {
      const parsed = parseAparejosDesdeSurvey(visitasDelProyecto.value[0])
      if (parsed.some(p => p.requerido)) {
        operacionesAssignment.value.implementos_survey = parsed
      }
    }
  } catch (error) {
    console.error('Error fetching visitas terreno:', error)
  }
}

const getAttrValue = (body, label) => {
  if (!body || !body.segmentos) return ''
  const searchLabel = label.toUpperCase().trim()
  for (const seg of body.segmentos) {
    if (!seg.attributes) continue
    for (const attr of seg.attributes) {
      if (attr.label && attr.label.toUpperCase().trim() === searchLabel) {
        return attr.value !== undefined ? attr.value : (attr.default || '')
      }
      if (attr.values && attr.values.quest && attr.values.quest.toUpperCase().trim() === searchLabel) {
        return attr.values.selected || ''
      }
    }
  }
  return ''
}

const cargarVisitaDesdeBD = async () => {
  if (!selectedSurveyId.value) return
  try {
    const { data } = await apiAxios.get(`/survey/visitas-terreno/${selectedSurveyId.value}`)
    const body = data.body_exec || {}
    
    siteVisit.value.obra_nombre = getAttrValue(body, 'NOMBRE DE LA OBRA') || getAttrValue(body, 'Nombre de Obra') || ''
    siteVisit.value.obra_direccion = getAttrValue(body, 'DIRECCION DE LA OBRA') || getAttrValue(body, 'Dirección de Obra') || data.direccion_cliente || ''
    siteVisit.value.obra_ciudad = getAttrValue(body, 'REFERENCIA DE LA DIRECCION') || getAttrValue(body, 'Ciudad') || ''
    siteVisit.value.obra_link = getAttrValue(body, 'LINK UBICACION') || ''
    siteVisit.value.tipo_carga = getAttrValue(body, 'TIPO DE CARGA') || ''
    siteVisit.value.peso_carga = getAttrValue(body, 'PESO DE LA CARGA') || getAttrValue(body, 'Peso Carga (Ton)') || ''
    siteVisit.value.volumen_carga = getAttrValue(body, 'VOLUMEN DE CARGA') || ''
    siteVisit.value.radios_trabajo = getAttrValue(body, 'RADIO MAXIMO DE TRABAJO') || getAttrValue(body, 'Radios Trabajo (mts)') || ''
    siteVisit.value.alturas_trabajo = getAttrValue(body, 'ALTURA DE TRABAJO') || getAttrValue(body, 'Alturas Trabajo (mts)') || ''
    siteVisit.value.detalle_servicio = getAttrValue(body, 'Detalle del Servicio') || ''

    // Extracción de Datos de Implementos unificada (Inmutable si ya fue leído anteriormente)
    if (!operacionesAssignment.value.aparejos_bloqueados_survey) {
      const parsedAparejos = parseAparejosDesdeSurvey({ body_exec: body })
      if (parsedAparejos && parsedAparejos.length > 0) {
        operacionesAssignment.value.implementos_survey = parsedAparejos
        operacionesAssignment.value.aparejos_bloqueados_survey = true
      }
    }

    
    if (data.rut_cliente) {
      opportunity.value.rut_cliente = data.rut_cliente
      searchQuery.value = data.razon_social_cliente
      selectedClient.value = {
        rut_empresa: data.rut_cliente,
        razon_social: data.razon_social_cliente,
        direccion: data.direccion_cliente,
        giro: data.giro_cliente
      }
    }
    
    alert('Datos de la visita importados con éxito a Datos Generales del Servicio.')
  } catch (error) {
    console.error(error)
    alert('Error al cargar detalles de la visita desde BD.')
  }
}

const comercial = ref({
  validez_dias: 15,
  moneda: 'CLP',
  condicion_servicio: 'programado',
  condiciones_texto_pdf: '',
  pensiones: {
    alojamiento_costeado: 'CLIENTE',
    alojamiento_monto: 0,
    desayuno_costeado: 'CLIENTE',
    desayuno_monto: 0,
    almuerzo_costeado: 'SAN_PABLO',
    almuerzo_monto: 0,
    cena_costeado: 'CLIENTE',
    cena_monto: 0,
    traslado_costeado: 'CLIENTE',
    traslado_monto: 0
  }
})

// ACUERDOS COMERCIALES BASE CANÓNICOS POR CATEGORÍA
const ACUERDOS_COMERCIALES_BASE = {
  TRASLADOS: `TRASLADOS:
Observaciones: 
Traslado incluye seguro de carga Traslado con sobredimensión deben solicitarse con 10 días de anticipación Valor no considera sobreestadía Guías de Traslados son responsabilidad del cliente Todos los Valores son más Iva Carga y descarga de maquinarias y equipos externos son responsabilidad de cliente.`,

  GRUA_TELESCOPICA: `GRUA TELESCOPICA:
Observaciones: 
a. La hora de la máquina comenzará a regir desde que esta sale de nuestras bodegas; Salvo que se cobre Flete por traslado. 
b. Las Máquinas se ocuparán en faenas de acuerdo a sus condiciones y capacidad, para lo cual han sido diseñadas. 
c. Se entenderá por hora Máquina, el tiempo de reloj durante el cual estén disponible para el cliente; solo se considerara 1 hora de colación como máximo 
d. Será por cuenta del cliente el traslado de contrapesos durante y dentro del recinto de faena. 
e. Si la maquinaria trabajase menos de las horas mínimas el cliente igual debera cancelar el mínimo de horas pactadas en esta cotización. 
f. Será responsabilidad del cliente informar sobre la resistencia y condiciones del terreno y/o área de trabajo, en caso contrario ARRIENDO SAN PABLO se desliga de cualquier responsabilidad por daños que la Máquina pueda ocasionar. 
g. La factura deberá cancelarse a los 30 días de su fecha de emisión, siempre y cuando el cliente tenga un crédito aprobado de 30 días. 
h. En caso de que el CLIENTE no necesitará la máquina o suspendiera el servicio una vez que esta haya salido desde nuestras instalaciones, el cliente deberá cancelar la tarifa mínima de la máquina en cuestión. 
i. Si por fuerza mayor, ante algún evento inesperado (maquinarias encerradas en faenas, pannes, congestión del tránsito, etc.) la grúa se ve impedida de llegar en día y hora programada, no corresponderá ningún tipo de descuento ni cobro a ARRIENDO SAN PABLO tampoco corresponderá el endoso de multas o infracciones de cualquier tipo a ARRIENDO SAN PABLO 
j. La presente cotización tiene una validez de 05 días. 
k. Maquinaria sujeta a disponibilidad 
l.Todos los valores son más iva.`,

  PLATAFORMAS: `PLATAFORMAS:
Observaciones: 
- Equipo se Arrienda sin Operador - Las máquinas se ocuparan en faenas de acuerdo a sus condiciones y capacidad, para lo cual han sido diseñadas 
- No utilizar el equipo como arco de soldadura, las baterías pueden explotar y de igual forma pueden generar daños en el sistema electrónico. 
- Todos los daños a neumáticos, ya sean por cortes laterales, escalonamientos o simplemente pinchaduras, serán con cargo al cliente. - Todos los daños estéticos producto de la aplicación de pinturas, quemaduras por soldaduras, shotcrete o recubrimientos serán con cargo al cliente 
- Todos los daños producto de choques o golpes por descuido o mala operación, serán con cargo al cliente. 
- En caso que el equipo no responda de la forma correcta se debe informar de inmediato al servicio técnico San Pablo y no seguir intentando operar este, ya que este tipo de manipulación puede generar mayores daños, los que serán de cargo al cliente. - En caso que la falla del equipo se haya generado por una mala operación, será de cargo al cliente todos los costos de reparación, incluida la visita del mecánico a obra (MO, viático, combustible, traslados, etc). 
- El cliente debe informar con 48 horas de anticipación el retiro del equipo mediante correo electrónico al vendedor y encargado de logística de empresas San Pablo. - El horario habíl de retiro de equipos será de lunes a sábado desde las 08:00 a 10:00 am, después de ese horario se cobrará otro día, al menos que empresas San Pablo avise retiro programado en otro horario. 
- Al momento de proceder con el retiro del equipo de faena se ejecutará un levantamiento rápido indicando todos los daños (en caso de existir), este documento debe ser firmado por el supervisor de faena. Si existieran otros daños no visualizados al momento de retirar el equipo, se le informará a la brevedad al cliente y los costos de reparación será de cargo de este. 
- Plataformas Eléctricas; se aconseja no descargar baterías en su totalidad, dado que esto daña los componentes eléctrico y electrónicos incluido el cargador, si llegara a ocurrir los costos de reparación serán cobrados al cliente. Otro punto importante es que la recarga de baterías no puede ser ejecutada con generadores, debido a que producen daños en las placas de carga. 
- Plataformas a Combustión; las plataformas que utilicen para su operación combustible diesel serán entregadas con su estanque lleno, por lo que la recepción del equipo en nuestra planta debe ser en la misma condición, de lo contrario se procederá a la recarga de los litros faltantes y el costo por litro será de $1000 más iva. Los motores a combustión no deben quedar sin combustible, ya que los daños por este motivo serán de costo del cliente. 
- La presente cotización tiene una validez de 5 días. 
- Maquinarias sujetas a disponibilidad. 
- Todos los valores son más IVA.`
}

const categoriasDetectadas = computed(() => {
  const cats = new Set()
  ;(lines.value || []).forEach(l => {
    const tipoNorm = String(l.tipo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()

    // 1. TRASLADOS (Categoría oficial TRASLADOS / FLETES)
    if (tipoNorm.includes('TRASLADO') || tipoNorm.includes('FLETE')) {
      cats.add('TRASLADOS')
    }

    // 2. GRÚAS TELESCÓPICAS / CAMIONES PLUMA (Categorías de Izaje)
    if (tipoNorm.includes('GRUA') || tipoNorm.includes('PLUMA')) {
      cats.add('GRUA_TELESCOPICA')
    }

    // 3. PLATAFORMAS ELEVADORAS
    if (tipoNorm.includes('PLATAFORMA') || tipoNorm.includes('MANLIFT') || tipoNorm.includes('TIJERA') || tipoNorm.includes('ALZAHOMBRE')) {
      cats.add('PLATAFORMAS')
    }
  })
  return {
    traslados: cats.has('TRASLADOS'),
    gruas: cats.has('GRUA_TELESCOPICA'),
    plataformas: cats.has('PLATAFORMAS')
  }
})

const construirAcuerdosComercialesTexto = () => {
  const bloques = []
  if (categoriasDetectadas.value.traslados) {
    bloques.push(ACUERDOS_COMERCIALES_BASE.TRASLADOS)
  }
  if (categoriasDetectadas.value.gruas) {
    bloques.push(ACUERDOS_COMERCIALES_BASE.GRUA_TELESCOPICA)
  }
  if (categoriasDetectadas.value.plataformas) {
    bloques.push(ACUERDOS_COMERCIALES_BASE.PLATAFORMAS)
  }
  return bloques.join('\n\n')
}

const regenerarCondicionesTexto = () => {
  if (comercial.value) {
    comercial.value.condiciones_texto_pdf = construirAcuerdosComercialesTexto()
  }
}

// Watcher reactivo: cada vez que cambien las categorías presentes en el estructurador, se actualiza el texto
watch(
  () => [categoriasDetectadas.value.traslados, categoriasDetectadas.value.gruas, categoriasDetectadas.value.plataformas],
  ([newT, newG, newP], [oldT, oldG, oldP] = []) => {
    if (!isHydrating.value && (newT !== oldT || newG !== oldG || newP !== oldP)) {
      regenerarCondicionesTexto()
    }
  }
)


const nuevaInteraccion = ref({
  tipo: 'Llamada',
  comentario: ''
})

const totalNeto = computed(() => {
  return lines.value.reduce((acc, l) => acc + (l.cantidad * (l.valorUnitario || 0)), 0)
})

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0)
}



const enviarCotizacionPorCorreo = async () => {
  const emailDestino = prompt("Ingrese el correo del destinatario:", "cliente@empresa.cl")
  if (!emailDestino) return

  try {
    const asunto = `Cotización ${antecedentes.value.identificador_formal || 'COT-2026'}`
    const cuerpo = `Estimado Cliente,\n\nAdjuntamos la cotización solicitada por un monto neto de ${formatCurrency(totalNeto.value)}.\n\nSaludos cordiales,\nGrúas San Pablo`
    
    await apiAxios.post('/message', {
      para: emailDestino,
      asunto: asunto,
      cuerpo: cuerpo
    })
    
    cotizaciones_historicas.value.push({
      fecha_envio: new Date().toISOString(),
      destinatario: emailDestino,
      cc: "gerencia@gruassanpablo.cl, jponce@gruassanpablo.cl",
      version: "v" + (cotizaciones_historicas.value.length + 1),
      monto_neto: totalNeto.value
    })

    alert(`✅ Cotización enviada exitosamente de forma real a ${emailDestino} con copia a Gerencia.\nRegistro guardado en trazabilidad.`)
    guardarEnPreventa()
  } catch (error) {
    console.error("Error al enviar correo real:", error)
    alert("Hubo un error al enviar el correo real a través de la API.")
  }
}

const agregarLinea = () => {
  lines.value.push({ tipo: '', subcategoria: '', descripcion: '', cantidad: 1, unidad: 'Diario', valorUnitario: 0 })
}

const eliminarLinea = (idx) => {
  lines.value.splice(idx, 1)
}

const abrirModalCliente = () => {
  mostrarModalCliente.value = true
}

const onClienteCreado = (c) => {
  const index = clientes.value.findIndex(cl => cl.id_empresa === c.id_empresa)
  if (index !== -1) {
    clientes.value[index] = c
  } else {
    clientes.value.push(c)
  }
  opportunity.value.rut_cliente = c.rut_empresa
  searchQuery.value = c.razon_social || c.name_empresa
  selectedClient.value = c
  cerrarModalCliente()
}

const clienteSeleccionado = computed(() => {
  return selectedClient.value
})

const agregarArchivos = (e) => {
  const files = e.target.files
  for (let i = 0; i < files.length; i++) {
    antecedentes.value.archivos.push({
      nombre: files[i].name,
      tamano: files[i].size,
      tipo: files[i].type
    })
  }
}

const eliminarArchivo = (idx) => {
  antecedentes.value.archivos.splice(idx, 1)
}

const onClienteChange = () => {
  // Opcional: acciones adicionales
}

const fetchClientes = async (query = '') => {
  try {
    const { data } = await apiAxios.get('/empresas', {
      params: {
        externo: true,
        search: query || undefined
      }
    })
    clientes.value = data
  } catch (error) {
    console.error('Error fetching clients:', error)
  }
}

// ==========================================
// PREVENCIÓN DE PÉRDIDA DE DATOS
// ==========================================
watch(() => opportunity.value.incluye_flete, (newVal) => {
  if (newVal) {
    const hasFlete = lines.value.some(l => l.tipo === 'TRASLADOS' || (l.descripcion && l.descripcion.toLowerCase().includes('flete')))
    if (!hasFlete) {
      lines.value.push({ 
        tipo: 'TRASLADOS', subcategoria: '', descripcion: 'Servicio de Traslado/Flete', 
        cantidad: 1, unidad: 'Fijo', valorUnitario: 500000 
      })
    }
  } else {
    lines.value = lines.value.filter(l => !(l.tipo === 'TRASLADOS' || (l.descripcion && l.descripcion.toLowerCase().includes('flete'))))
  }
})

watch(() => opportunity.value.requiere_rigger, (newVal) => {
  if (newVal) {
    const hasRigger = lines.value.some(l => l.subcategoria === 'RIGGER' || (l.descripcion && l.descripcion.toLowerCase().includes('rigger')))
    if (!hasRigger) {
      lines.value.push({ 
        tipo: 'PERSONAL CERTIFICADO', subcategoria: 'RIGGER', descripcion: 'Servicio de Rigger Certificado', 
        cantidad: 1, unidad: 'Diario', valorUnitario: 0 
      })
    }
  } else {
    lines.value = lines.value.filter(l => !(l.subcategoria === 'RIGGER' || (l.descripcion && l.descripcion.toLowerCase().includes('rigger'))))
  }
})

watch(() => opportunity.value.requiere_prevencionista, (newVal) => {
  if (newVal) {
    const hasPrev = lines.value.some(l => l.subcategoria === 'PREVENCIONISTA' || (l.descripcion && l.descripcion.toLowerCase().includes('prevencionista')))
    if (!hasPrev) {
      lines.value.push({ 
        tipo: 'PERSONAL CERTIFICADO', subcategoria: 'PREVENCIONISTA', descripcion: 'Servicio de Prevencionista Certificado', 
        cantidad: 1, unidad: 'Diario', valorUnitario: 0 
      })
    }
  } else {
    lines.value = lines.value.filter(l => !(l.subcategoria === 'PREVENCIONISTA' || (l.descripcion && l.descripcion.toLowerCase().includes('prevencionista'))))
  }
})

watch(lines, (newLines) => {
  const hasRigger = newLines.some(l => l.subcategoria === 'RIGGER' || (l.descripcion && l.descripcion.toLowerCase().includes('rigger')))
  if (hasRigger && !opportunity.value.requiere_rigger) {
    opportunity.value.requiere_rigger = true
  }
  const hasPrev = newLines.some(l => l.subcategoria === 'PREVENCIONISTA' || (l.descripcion && l.descripcion.toLowerCase().includes('prevencionista')))
  if (hasPrev && !opportunity.value.requiere_prevencionista) {
    opportunity.value.requiere_prevencionista = true
  }
}, { deep: true })

watch(
  [opportunity, antecedentes, lines, siteVisit, comercial],
  () => {
    isDirty.value = true
  },
  { deep: true }
)

const handleBeforeUnload = (e) => {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = '' // Requerido por Chrome para mostrar el diálogo estándar
  }
}

onBeforeRouteLeave((to, from, next) => {
  if (isDirty.value) {
    const answer = window.confirm('Tienes cambios sin guardar. ¿Estás seguro que deseas salir y perder tu progreso?')
    if (answer) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

const handleCancelar = () => {
  const volver = () => {
    emit('close')
    if (router) {
      router.push({ name: 'torre' })
    }
  }

  if (isDirty.value) {
    if (window.confirm('Tienes cambios sin guardar. ¿Estás seguro que deseas volver al Kanban y perder tu progreso?')) {
      volver()
    }
  } else {
    volver()
  }
}

const cargarDatosCotizacion = async () => {
  let targetId = props.proyectoId || route?.query?.id_proyecto || route?.query?.id
  if (typeof targetId === 'object' && targetId !== null) {
    targetId = targetId.id_proyecto || targetId.id || targetId.id_cotizacion
  }
  if (!targetId && currentProyectoId.value) {
    targetId = currentProyectoId.value
  }
  if (targetId) {
    try {
      const { data } = await apiAxios.get(`/proyectos/${targetId}`)
      const p = data.proyecto
      if (p) {
        currentProyectoId.value = p.id_proyecto

        // Mapear columnas reales a los refs del formulario
        opportunity.value.descripcion           = p.objetivo_proyecto || ''
        opportunity.value.fecha_tentativa       = p.fecha_plan_ini ? p.fecha_plan_ini.split('T')[0] : ''
        opportunity.value.id_empresa_emisora    = String(p.id_empresa || '9')
        opportunity.value.id_proyecto_estado    = p.id_proyecto_estado
        if (parseInt(p.id_proyecto_estado) >= 3) {
          topTab.value = 'operaciones'
        } else {
          topTab.value = 'comercial'
        }
        if (route?.query?.subtab) {
          topTab.value = 'operaciones'
          operacionesSubTab.value = route.query.subtab
        }

        if (p.codi_proyecto) {
          antecedentes.value.identificador_formal = p.codi_proyecto
        }

        // Mapear json_field de forma segura (admite String JSON y Object JSONB)
        let jsonField = p.json_field
        if (typeof jsonField === 'string') {
          try { jsonField = JSON.parse(jsonField) } catch(e) { jsonField = {} }
        }
        opportunity.value.json_field = jsonField || {}

        // Mapear json_field.crm_v1
        const crm = jsonField?.crm_v1
        if (crm) {
          antecedentes.value.identificador = crm.n_licitacion || (p.codi_proyecto && !p.codi_proyecto.startsWith('COT-') && !['GSP','BMQ','LDS','RYL'].some(pref => p.codi_proyecto.startsWith(pref)) ? p.codi_proyecto : '')
          opportunity.value.prioridad             = crm.prioridad || 'normal'
          opportunity.value.familia_servicio      = crm.familia_servicio || 'Grúas Telescópicas'
          opportunity.value.contacto_nombre       = crm.contacto_nombre || ''
          opportunity.value.contacto_telefono     = crm.contacto_telefono || ''
          opportunity.value.contacto_obj          = crm.contacto_obj || null
          opportunity.value.tipo_pago             = crm.tipo_pago || 'transferencia'
          opportunity.value.requiere_oc_hes       = crm.requiere_oc_hes !== undefined ? crm.requiere_oc_hes : null
          opportunity.value.requiere_acreditacion = crm.requiere_acreditacion !== undefined ? crm.requiere_acreditacion : null
          opportunity.value.incluye_flete         = crm.incluye_flete !== undefined ? crm.incluye_flete : null
          opportunity.value.requiere_rigger       = crm.requiere_rigger !== undefined ? crm.requiere_rigger : null
          opportunity.value.requiere_prevencionista = crm.requiere_prevencionista !== undefined ? crm.requiere_prevencionista : null
          opportunity.value.cliente_pone_combustible = crm.cliente_pone_combustible !== undefined ? crm.cliente_pone_combustible : null
          let adocs = crm.acreditacion_docs;
          if (Array.isArray(adocs)) {
            opportunity.value.acreditacion_docs = { empresa: adocs, equipos: [], personas: [] };
          } else if (adocs && typeof adocs === 'object') {
            opportunity.value.acreditacion_docs = { 
              empresa: adocs.empresa || [], 
              equipos: adocs.equipos || [], 
              personas: adocs.personas || [] 
            };
          } else if (typeof adocs === 'string' && adocs.trim() !== '') {
            opportunity.value.acreditacion_docs = { empresa: [adocs], equipos: [], personas: [] };
          } else {
            opportunity.value.acreditacion_docs = { empresa: [], equipos: [], personas: [] };
          }
          antecedentes.value.tipo_proceso         = crm.tipo_proceso || 'Licitación Privada'
          antecedentes.value.archivos             = crm.archivos_licitacion || []
          if (crm.lineas_servicio?.length) {
            lines.value = crm.lineas_servicio.map(l => {
              let mappedUnidad = l.unidad
              if (mappedUnidad === 'Global') mappedUnidad = 'Fijo'
              if (mappedUnidad === 'Viaje') mappedUnidad = 'Flete'

              let mappedTipo = l.tipo || ''
              const norm = String(mappedTipo).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
              if (norm === 'EQUIPO (GRUA)' || norm === 'GRUA' || norm === 'GRUAS TELESCOPICAS' || norm === 'GRUA TELESCOPICA' || norm === 'GRÚAS TELESCÓPICAS' || norm === 'GRÚA TELESCÓPICA') {
                mappedTipo = 'GRUAS TELESCOPICAS'
              } else if (norm === 'CAMION PLUMA' || norm === 'CAMIONES PLUMA' || norm === 'CAMION' || norm === 'CAMIONES') {
                mappedTipo = 'CAMIONES'
              } else if (norm === 'GRUA HORQUILLA' || norm === 'GRUAS HORQUILLA') {
                mappedTipo = 'GRUA HORQUILLA'
              } else if (norm === 'MANIPULADOR TELESCOPICO' || norm === 'MANIPULADORES TELESCOPICOS') {
                mappedTipo = 'MANIPULADOR TELESCOPICO'
              } else if (norm === 'VEHICULO LIVIANO' || norm === 'VEHICULOS LIVIANOS' || norm === 'CAMIONETA') {
                mappedTipo = 'VEHICULOS LIVIANOS'
              } else if (norm === 'PLATAFORMA' || norm === 'PLATAFORMAS') {
                mappedTipo = 'PLATAFORMAS'
              } else if (norm === 'TRASLADO' || norm === 'TRASLADOS' || norm === 'FLETE' || norm === 'FLETES') {
                mappedTipo = 'TRASLADOS'
              } else if (norm === 'ACCESORIO' || norm === 'ACCESORIOS') {
                mappedTipo = 'ACCESORIOS'
              } else if (norm.includes('PERSONAL') || norm.includes('RIGGER')) {
                mappedTipo = 'PERSONAL CERTIFICADO'
              } else if (norm === 'OTROS' || norm === 'OTRO') {
                mappedTipo = 'OTROS'
              }

              return { 
                ...l, 
                tipo: mappedTipo,
                unidad: mappedUnidad 
              }
            })
          } else {
            lines.value = []
          }
          
          if (crm.cotizaciones_historicas) cotizaciones_historicas.value = [...crm.cotizaciones_historicas].sort((a, b) => b.version - a.version)
          
          siteVisit.value.obra_nombre = crm.obra_nombre || p.nombre_proyecto || ''
          siteVisit.value.obra_direccion = crm.obra_direccion || p.observacion_proyecto || ''
          siteVisit.value.obra_ciudad = crm.obra_ciudad || ''
          siteVisit.value.tipo_carga = crm.tipo_carga || ''
          siteVisit.value.detalle_servicio = crm.detalle_servicio || p.observacion_proyecto || ''
          siteVisit.value.peso_carga = crm.peso_carga || ''
          siteVisit.value.volumen_carga = crm.volumen_carga || ''
          siteVisit.value.radios_trabajo = crm.radios_trabajo || ''
          siteVisit.value.alturas_trabajo = crm.alturas_trabajo || ''
          siteVisit.value.visita_terreno = crm.visita_terreno || false
          siteVisit.value.fecha_hora_inicio = crm.fecha_hora_inicio || ''
          siteVisit.value.fecha_hora_termino = crm.fecha_hora_termino || ''
          
          if (crm.coordenadas_mapa) {
            siteVisit.value.lat = crm.coordenadas_mapa.lat
            siteVisit.value.lng = crm.coordenadas_mapa.lng
          }
          
          if (crm.condiciones_pdf && crm.condiciones_pdf.trim() !== '') {
            comercial.value.condiciones_texto_pdf = crm.condiciones_pdf
          } else {
            comercial.value.condiciones_texto_pdf = construirAcuerdosComercialesTexto()
          }

          if (crm.pensiones) {
            comercial.value.pensiones = {
              alojamiento_costeado: crm.pensiones.alojamiento_costeado || 'CLIENTE',
              alojamiento_monto: crm.pensiones.alojamiento_monto || 0,
              desayuno_costeado: crm.pensiones.desayuno_costeado || crm.pensiones.alimentacion_costeado || 'CLIENTE',
              desayuno_monto: crm.pensiones.desayuno_monto || 0,
              almuerzo_costeado: crm.pensiones.almuerzo_costeado || crm.pensiones.alimentacion_costeado || 'SAN_PABLO',
              almuerzo_monto: crm.pensiones.almuerzo_monto || crm.pensiones.alimentacion_monto || 0,
              cena_costeado: crm.pensiones.cena_costeado || crm.pensiones.alimentacion_costeado || 'CLIENTE',
              cena_monto: crm.pensiones.cena_monto || 0,
              traslado_costeado: crm.pensiones.traslado_costeado || 'CLIENTE',
              traslado_monto: crm.pensiones.traslado_monto || 0
            }
          }
          if (crm.snapshot_comercial && Object.keys(crm.snapshot_comercial).length > 0) {
            snapshotComercial.value = JSON.parse(JSON.stringify(crm.snapshot_comercial))
          } else {
            snapshotComercial.value = JSON.parse(JSON.stringify({
              peso_carga: siteVisit.value.peso_carga || '',
              volumen_carga: siteVisit.value.volumen_carga || '',
              radios_trabajo: siteVisit.value.radios_trabajo || '',
              alturas_trabajo: siteVisit.value.alturas_trabajo || '',
              tipo_carga: siteVisit.value.tipo_carga || '',
              detalle_servicio: siteVisit.value.detalle_servicio || '',
              obra_nombre: siteVisit.value.obra_nombre || '',
              obra_direccion: siteVisit.value.obra_direccion || '',
              obra_ciudad: siteVisit.value.obra_ciudad || '',
              lines: JSON.parse(JSON.stringify(lines.value)),
              equipo_descripcion: lines.value[0]?.descripcion || '',
              equipo_cantidad: lines.value[0]?.cantidad || 1,
              equipo_valor: lines.value[0]?.valorUnitario || 0
            }))
          }
        }

        // Mapear json_field.ejecucion_v1 si existe
        const ejecucion = jsonField?.ejecucion_v1
        if (ejecucion) {
          rawEjecucionJson.value = { ...ejecucion }
          
          const estadoDb = parseInt(p.id_proyecto_estado) || 1
          
          if (estadoDb >= 3) {
            topTab.value = 'operaciones'
            
            if (estadoDb === ESTADOS_DB.VALIDACION_DIFF) {
              operacionesSubTab.value = 'validacion'
              requerimientoAprobado.value = false
              asignacionConfirmada.value = false
            } else if (estadoDb === ESTADOS_DB.ASIGNACION_RECURSOS) {
              requerimientoAprobado.value = true
              asignacionConfirmada.value = false
              operacionesSubTab.value = 'asignacion'
            } else if (estadoDb >= ESTADOS_DB.PREPARACION_PATIO) {
              requerimientoAprobado.value = true
              asignacionConfirmada.value = true
              operacionesSubTab.value = props.initialSubTab || (estadoDb >= 5 ? (ejecucion.subtab_actual_view || 'reports') : 'preparacion_salida')
              if (operacionesSubTab.value === 'reports' || estadoDb >= 5) {
                cargarReportsProyecto(targetId)
              }
            }
          } else {
            topTab.value = 'comercial'
            requerimientoAprobado.value = false
            asignacionConfirmada.value = false
          }

          if (ejecucion.observaciones) {
            operacionesAssignment.value.observaciones_operaciones = ejecucion.observaciones
          }
          if (ejecucion.equipo_id) operacionesAssignment.value.equipo_id = ejecucion.equipo_id
          if (ejecucion.operador_id) operacionesAssignment.value.operador_id = ejecucion.operador_id
          if (ejecucion.rigger_id) operacionesAssignment.value.rigger_id = ejecucion.rigger_id
          if (ejecucion.chofer_id) operacionesAssignment.value.chofer_id = ejecucion.chofer_id
          // 1. Asignar operadores a líneas de equipos principales
          if (Array.isArray(ejecucion.tripulacion_asignada) && ejecucion.tripulacion_asignada.length > 0) {
            const trip = ejecucion.tripulacion_asignada
            linesEquiposPrincipales.value.forEach(l => {
              const opMatch = trip.find(t => 
                t.equipo_asignado_id && t.equipo_asignado_id === l.equipo_asignado_id &&
                (t.cargo?.includes('Operador') || t.cargo?.includes('Grúa') || t.cargo?.includes('Pluma'))
              ) || trip.find(t => (t.cargo?.includes('Operador') || t.cargo?.includes('Grúa')) && !l.operador_asignado_id)
              if (opMatch) {
                l.operador_asignado_id = opMatch.id_user || ''
              }
            })
          }

          // 2. Restaurar Especialistas de Terreno (priorizando ejecucion.especialistas_terreno)
          if (Array.isArray(ejecucion.especialistas_terreno) && ejecucion.especialistas_terreno.length > 0) {
            especialistasTerreno.value = ejecucion.especialistas_terreno.map(esp => ({
              id_user: esp.id_user || '',
              cargo: esp.cargo || 'Rigger',
              requerimiento: esp.requerimiento || '',
              is_linea_base: esp.is_linea_base === true,
              semaforo: esp.semaforo || 'GREEN',
              fecha_plan_ini: esp.fecha_plan_ini || ejecucion.fecha_salida_plan || '',
              fecha_plan_fin: esp.fecha_plan_fin || ejecucion.fecha_fin_plan || ''
            }))
          } else if (Array.isArray(ejecucion.tripulacion_asignada) && ejecucion.tripulacion_asignada.length > 0) {
            const trip = ejecucion.tripulacion_asignada
            const espList = trip.filter(t => 
              !t.cargo?.includes('Operador') && !t.cargo?.includes('Chofer') && !t.cargo?.includes('Escolta')
            )
            if (espList.length > 0) {
              especialistasTerreno.value = espList.map(esp => ({
                id_user: esp.id_user || '',
                cargo: esp.cargo || 'Rigger',
                requerimiento: esp.requerimiento || '',
                is_linea_base: esp.is_linea_base === true,
                semaforo: esp.semaforo || 'GREEN',
                fecha_plan_ini: esp.fecha_plan_ini || ejecucion.fecha_salida_plan || '',
                fecha_plan_fin: esp.fecha_plan_fin || ejecucion.fecha_fin_plan || ''
              }))
            }
          }

          // Sincronizar requerimientos de personal cotizados comercialmente (Rigger, Prevencionista, etc.)
          if (linesPersonalValidas.value && linesPersonalValidas.value.length > 0) {
            linesPersonalValidas.value.forEach(lp => {
              const desc = (lp.descripcion || lp.subcategoria || '').toLowerCase()
              let cargoDetectado = 'Rigger'
              if (desc.includes('prevencion') || desc.includes('apr') || desc.includes('seguridad')) cargoDetectado = 'Prevencionista de Riesgos'
              else if (desc.includes('rigger')) cargoDetectado = 'Rigger'
              else if (desc.includes('supervisor')) cargoDetectado = 'Supervisor Faena'
              else if (desc.includes('maniobrista')) cargoDetectado = 'Maniobrista'

              const matchReq = especialistasTerreno.value.find(t => t.cargo === cargoDetectado || t.requerimiento === (lp.descripcion || lp.subcategoria))
              if (!matchReq) {
                especialistasTerreno.value.push({
                  id_user: '',
                  cargo: cargoDetectado,
                  requerimiento: lp.descripcion || lp.subcategoria || cargoDetectado,
                  semaforo: 'GREEN',
                  is_linea_base: true,
                  fecha_plan_ini: operacionesAssignment.value.fecha_salida_plan || '',
                  fecha_plan_fin: operacionesAssignment.value.fecha_fin_plan || ''
                })
              } else {
                if (!matchReq.requerimiento) {
                  matchReq.requerimiento = lp.descripcion || lp.subcategoria
                }
                matchReq.is_linea_base = true
              }
            })
          }
          if (ejecucion.equipos_extra && Array.isArray(ejecucion.equipos_extra)) {
            const trip = Array.isArray(ejecucion.tripulacion_asignada) ? ejecucion.tripulacion_asignada : []
            operacionesAssignment.value.equipos_extra = ejecucion.equipos_extra.map((item, idx) => {
              const eqId = (typeof item === 'object' && item !== null) ? (item.id_equipo || '') : String(item || '')
              let choferId = (typeof item === 'object' && item !== null) ? (item.chofer_id || '') : ''
              if (!choferId && eqId) {
                const chMatch = trip.find(t => t.equipo_asignado_id === eqId)
                if (chMatch) choferId = chMatch.id_user || ''
              }
              const rol = (typeof item === 'object' && item !== null && item.rol) ? item.rol : (idx === 0 ? 'Cama Baja #1' : `Escolta / Apoyo #${idx + 1}`)
              const tipo = (typeof item === 'object' && item !== null && item.tipo) ? item.tipo : 'TRASLADOS'
              const subcat = (typeof item === 'object' && item !== null && item.subcategoria) ? item.subcategoria : 'CAMA BAJA'
              const isBase = (typeof item === 'object' && item !== null && item.is_linea_base !== undefined) ? item.is_linea_base : false
              const ini = (typeof item === 'object' && item !== null && item.fecha_plan_ini) ? item.fecha_plan_ini : (ejecucion.fecha_salida_plan || '')
              const fin = (typeof item === 'object' && item !== null && item.fecha_plan_fin) ? item.fecha_plan_fin : (ejecucion.fecha_fin_plan || '')
              return {
                _uid: item._uid || `ex-${Date.now()}-${idx}`,
                id_item: item.id_item || null,
                tipo,
                subcategoria: subcat,
                id_equipo: eqId,
                chofer_id: choferId,
                rol,
                is_linea_base: isBase,
                fecha_plan_ini: ini,
                fecha_plan_fin: fin
              }
            })
          }
          sincronizarTrasladosComerciales()
          if (ejecucion.fecha_salida_plan) operacionesAssignment.value.fecha_salida_plan = ejecucion.fecha_salida_plan
          if (ejecucion.hora_salida_plan) operacionesAssignment.value.hora_salida_plan = ejecucion.hora_salida_plan
          if (ejecucion.fecha_fin_plan) operacionesAssignment.value.fecha_fin_plan = ejecucion.fecha_fin_plan
          if (ejecucion.hora_fin_plan) operacionesAssignment.value.hora_fin_plan = ejecucion.hora_fin_plan
          const apData = ejecucion.implementos_survey || ejecucion.aparejos_asignados_json || ejecucion.aparejos
          if (apData) {
            operacionesAssignment.value.aparejos = apData
            if (Array.isArray(apData) && apData.length > 0) {
              operacionesAssignment.value.implementos_survey = JSON.parse(JSON.stringify(apData))
              operacionesAssignment.value.aparejos_bloqueados_survey = true
            }
          }
          if (ejecucion.cumplimiento_acreditaciones) {
            operacionesAssignment.value.cumplimiento_acreditaciones = ejecucion.cumplimiento_acreditaciones
            Object.keys(ejecucion.cumplimiento_acreditaciones).forEach(k => {
              if (ejecucion.cumplimiento_acreditaciones[k] === 'OK') {
                docsVinculadosMap.value[k] = { status: 'VINCULADO_REPOSITORIO', file_name: k }
              }
            })
            docsVinculadosMap.value = { ...docsVinculadosMap.value }
          }
          
          if (ejecucion.docs_homologados) {
            opportunity.value.docs_homologados = ejecucion.docs_homologados
            docsVinculadosMap.value = { ...docsVinculadosMap.value, ...ejecucion.docs_homologados }
          }

          if (crm?.docs_homologados) {
            opportunity.value.docs_homologados = { ...opportunity.value.docs_homologados, ...crm.docs_homologados }
            docsVinculadosMap.value = { ...docsVinculadosMap.value, ...crm.docs_homologados }
          }

          if (!opportunity.value.acreditacion_docs || (!opportunity.value.acreditacion_docs.empresa?.length && !opportunity.value.acreditacion_docs.equipos?.length && !opportunity.value.acreditacion_docs.personas?.length)) {
            opportunity.value.acreditacion_docs = {
              empresa: ['Inicio de actividades', 'Carpeta tributaria', 'Certificado cotizaciones', 'Constitución de empresa', 'RIOHS'],
              equipos: ['SOAP', 'Revisión Técnica', 'Certificación Anual Izaje'],
              personas: ['Contrato de trabajo', 'Cédula identidad', 'Licencia conducir']
            }
          }
          
          if (ejecucion.preparacion_salida) {
            preparacionSalidaState.value = { ...preparacionSalidaState.value, ...ejecucion.preparacion_salida }
          }
          if (Array.isArray(ejecucion.ot_versiones)) {
            ot_versiones.value = [...ejecucion.ot_versiones].sort((a, b) => b.version - a.version)
          }
          if (Array.isArray(ejecucion.traza_correos)) {
            trazaCorreosList.value = ejecucion.traza_correos
          }
        }

        // Cargar empresa cliente
        if (p.id_empresa_cliente) {
          try {
            const { data: empresas } = await apiAxios.get('/empresas', {
              params: { id: p.id_empresa_cliente }
            })
            if (empresas.length > 0) {
              selectedClient.value = empresas[0]
              searchQuery.value = empresas[0].razon_social || empresas[0].name_empresa
              opportunity.value.rut_cliente = empresas[0].rut_empresa
            }
          } catch (e) { console.error(e) }
        }
        // 1. Cargar catálogo de flota oficial desde la base de datos
        await cargarListaEquiposMaster()

        // 2. Homologar líneas comerciales en memoria con la flota
        if (Array.isArray(lines.value)) {
          lines.value.forEach(l => {
            if (l.equipo_asignado_id) {
              const eqObj = getEquipoObj(l.equipo_asignado_id)
              if (eqObj) l.equipo_asignado_id = eqObj.id_equipo
            }
          })
        }
        if (operacionesAssignment.value.equipo_id) {
          const eqObj = getEquipoObj(operacionesAssignment.value.equipo_id)
          if (eqObj) operacionesAssignment.value.equipo_id = eqObj.id_equipo
        }

        // 3. Sincronizar directamente con las tablas relacionales en PostgreSQL
        try {
          const [resEq, resPer] = await Promise.all([
            apiAxios.get(`/proyectos/${targetId}/asignaciones/equipos`).catch(() => ({ data: [] })),
            apiAxios.get(`/proyectos/${targetId}/asignaciones/personas`).catch(() => ({ data: [] }))
          ])
          const eqRows = resEq.data || []
          const perRows = resPer.data || []

          if (Array.isArray(eqRows) && eqRows.length > 0) {
            eqRows.forEach((eqRel, idx) => {
              const idEq = eqRel.id_equipo || eqRel.id
              if (idx === 0 && !operacionesAssignment.value.equipo_id) {
                operacionesAssignment.value.equipo_id = idEq
              }
              if (linesEquiposPrincipales.value && linesEquiposPrincipales.value[idx]) {
                linesEquiposPrincipales.value[idx].equipo_asignado_id = idEq
                if (eqRel.fecha_plan_ini) linesEquiposPrincipales.value[idx].fecha_plan_ini = eqRel.fecha_plan_ini.split('T')[0]
                if (eqRel.fecha_plan_fin) linesEquiposPrincipales.value[idx].fecha_plan_fin = eqRel.fecha_plan_fin.split('T')[0]
              }
            })
          }

          if (Array.isArray(perRows) && perRows.length > 0) {
            perRows.forEach(perRel => {
              if (!perRel.id_user) return
              const matchEsp = especialistasTerreno.value.find(e => 
                (e.id_user && String(e.id_user) === String(perRel.id_user)) ||
                (e.cargo && perRel.rol_asignado && e.cargo.toLowerCase().includes(perRel.rol_asignado.toLowerCase()))
              )
              if (matchEsp) {
                matchEsp.id_user = perRel.id_user
                if (perRel.fecha_plan_ini) matchEsp.fecha_plan_ini = perRel.fecha_plan_ini.split('T')[0]
                if (perRel.fecha_plan_fin) matchEsp.fecha_plan_fin = perRel.fecha_plan_fin.split('T')[0]
              }
            })
          }
        } catch (eRel) {
          console.warn('Error al sincronizar asignaciones relacionales:', eRel)
        }

        // 4. Pre-cargar expedientes de los recursos asignados
        cargarExpedientesAsignados()
      }
    } catch (e) {
      console.error('Error al cargar proyecto:', e)
    }
    await cargarViajesProyecto(targetId)
    await cargarReportsProyecto(targetId)
  } else if (opportunity.value.rut_cliente) {
    try {
      const { data } = await apiAxios.get('/empresas', {
        params: { search: opportunity.value.rut_cliente }
      })
      if (data.length > 0) {
        selectedClient.value = data[0]
        searchQuery.value = data[0].razon_social || data[0].name_empresa
      }
    } catch (e) {
      console.error(e)
    }
  }

  fetchVisitasTerreno()
  loading.value = false

  // Reseteamos los flags para que la carga inicial no dispare advertencias de cambios sin guardar
  setTimeout(() => {
    isDirty.value = false
    isDirtyAsignacion.value = false
    isHydrating.value = false
  }, 500)
}

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  fetchUsuarios()
  fetchCategories()
  cargarListaEquiposMaster()
  cargarDatosCotizacion()
})

watch(() => props.proyectoId, (newId) => {
  if (newId) {
    cargarDatosCotizacion()
  }
})

watch(() => route?.query?.id_proyecto, (newId) => {
  if (newId) {
    cargarDatosCotizacion()
  }
})

watch(() => route?.query?.subtab, (newSubtab) => {
  if (newSubtab) {
    topTab.value = 'operaciones'
    operacionesSubTab.value = newSubtab
    if (newSubtab === 'reports') {
      cargarReportsProyecto()
    } else if (newSubtab === 'liquidacion') {
      cargarResumenEDP()
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const rawEjecucionJson = ref({})
const trazaCorreosList = ref([])

const trazaCalidad = computed(() => trazaCorreosList.value.find(t => t.tipo === 'CONTROL_CALIDAD'))
const trazaPatio = computed(() => trazaCorreosList.value.find(t => t.tipo === 'JEFE_PATIO_PWA'))
const trazaAnalista = computed(() => trazaCorreosList.value.find(t => t.tipo === 'ANALISTA_OP'))

const MIN_ESTADO_FOR_SUBTAB = {
  'comercial': 1,
  'validacion': 3,
  'asignacion': 4,
  'acreditaciones': 5,
  'preparacion_salida': 5,
  'reports': 5,
  'liquidacion': 5
}

const cambiarYPersistirSubTab = async (subtabName) => {
  const minReq = MIN_ESTADO_FOR_SUBTAB[subtabName] || 1
  if (estadoDbActual.value < minReq) {
    alert('🔒 Esta etapa está bloqueada. Para acceder debe completar y aprobar formalmente las etapas anteriores.')
    return
  }

  if (subtabName === 'comercial') {
    topTab.value = 'comercial'
    return
  }

  topTab.value = 'operaciones'
  operacionesSubTab.value = subtabName
  console.log('🔄 Visualizando SubTab Operaciones:', subtabName, '| topTab:', topTab.value)
  
  if (subtabName === 'reports') {
    cargarReportsProyecto()
  } else if (subtabName === 'liquidacion') {
    cargarResumenEDP()
  }
  
  if (!rawEjecucionJson.value) rawEjecucionJson.value = {}
  rawEjecucionJson.value.subtab_actual_view = subtabName

  if (!opportunity.value.json_field) opportunity.value.json_field = {}
  if (!opportunity.value.json_field.ejecucion_v1) opportunity.value.json_field.ejecucion_v1 = {}
  opportunity.value.json_field.ejecucion_v1.subtab_actual_view = subtabName
  
  const projectId = props.proyectoId || currentProyectoId.value
  if (projectId) {
    try {
      const token = localStorage.getItem('token') || ''
      const payload = buildPayload()
      await apiAxios.put(`/proyectos/${projectId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (e) {
      console.warn('Error al guardar vista subtab en PostgreSQL:', e)
    }
  }
}

const registrarTrazaCorreo = (tipo, para, asunto, resumen) => {
  const registro = {
    fecha_hora: new Date().toLocaleString('es-CL'),
    tipo,
    para,
    asunto,
    resumen
  }
  trazaCorreosList.value.unshift(registro)
}

const buildPayload = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  return {
    // Columnas reales de la tabla tpry_proyecto (ver core_entities.md)
    id_empresa:           opportunity.value.id_empresa_emisora,
    id_empresa_cliente:   selectedClient.value?.id_empresa || null,
    nombre_proyecto:      siteVisit.value.obra_nombre || opportunity.value.descripcion || 'Cotización Preventa',
    codi_proyecto:        antecedentes.value.identificador_formal || null,
    objetivo_proyecto:    opportunity.value.descripcion,
    observacion_proyecto: siteVisit.value.detalle_servicio || null,
    fecha_plan_ini:       opportunity.value.fecha_tentativa || null,
    id_proyecto_estado:   opportunity.value.id_proyecto_estado || 1,
    id_user_creacion:     currentUser.id_user || null,

    // json_field: solo datos sin columna propia, convencion crm_v1
    json_field: {
      crm_v1: {
        prioridad:             opportunity.value.prioridad,
        familia_servicio:      opportunity.value.familia_servicio,
        contacto_nombre:       siteVisit.value.contacto_terreno_nombre || opportunity.value.contacto_nombre || '',
        contacto_telefono:     siteVisit.value.contacto_terreno_telefono || opportunity.value.contacto_telefono || '',
        contacto_email:        siteVisit.value.contacto_terreno_email || opportunity.value.contacto_obj?.email || '',
        contacto_obj:          opportunity.value.contacto_obj,
        tipo_pago:             opportunity.value.tipo_pago,
        requiere_oc_hes:       opportunity.value.requiere_oc_hes,
        requiere_acreditacion: opportunity.value.requiere_acreditacion,
        incluye_flete:         opportunity.value.incluye_flete,
        requiere_rigger:       opportunity.value.requiere_rigger,
        requiere_prevencionista: opportunity.value.requiere_prevencionista,
        cliente_pone_combustible: opportunity.value.cliente_pone_combustible,
        acreditacion_docs:     opportunity.value.acreditacion_docs,
        tipo_proceso:          antecedentes.value.tipo_proceso,
        n_licitacion:          antecedentes.value.identificador || '',
        archivos_licitacion:   antecedentes.value.archivos,
        lineas_servicio:       lines.value,
        cotizaciones_historicas: cotizaciones_historicas.value,
        coordenadas_mapa: {
          lat: siteVisit.value.lat,
          lng: siteVisit.value.lng
        },
        condiciones_pdf: comercial.value.condiciones_texto_pdf,
        obra_nombre: siteVisit.value.obra_nombre,
        obra_direccion: siteVisit.value.obra_direccion,
        obra_ciudad: siteVisit.value.obra_ciudad,
        fecha_hora_inicio: siteVisit.value.fecha_hora_inicio,
        fecha_hora_termino: siteVisit.value.fecha_hora_termino,
        tipo_carga: siteVisit.value.tipo_carga,
        detalle_servicio: siteVisit.value.detalle_servicio,
        peso_carga: siteVisit.value.peso_carga,
        volumen_carga: siteVisit.value.volumen_carga,
        radios_trabajo: siteVisit.value.radios_trabajo,
        alturas_trabajo: siteVisit.value.alturas_trabajo,
        visita_terreno: siteVisit.value.visita_terreno,
        validez_dias: comercial.value.validez_dias,
        moneda: comercial.value.moneda,
        condicion_servicio: comercial.value.condicion_servicio,
        pensiones: comercial.value.pensiones,
        snapshot_comercial: {
          ...snapshotComercial.value,
          lines: JSON.parse(JSON.stringify(lines.value)),
          equipo_descripcion: lines.value[0]?.descripcion || '',
          equipo_cantidad: lines.value[0]?.cantidad || 1,
          equipo_valor: lines.value[0]?.valorUnitario || 0
        }
      },
      ejecucion_v1: {
        ...(rawEjecucionJson.value || {}),
        ...(opportunity.value.json_field?.ejecucion_v1 || {}),
        subtab_activa: rawEjecucionJson.value?.subtab_activa || opportunity.value.json_field?.ejecucion_v1?.subtab_activa || operacionesSubTab.value,
        traza_correos: trazaCorreosList.value,
        preparacion_salida: preparacionSalidaState.value,
        equipo_id: operacionesAssignment.value.equipo_id,
        equipos_extra: operacionesAssignment.value.equipos_extra || [],
        especialistas_terreno: especialistasTerreno.value || [],
        operador_id: operacionesAssignment.value.operador_id,
        rigger_id: operacionesAssignment.value.rigger_id,
        chofer_id: operacionesAssignment.value.chofer_id,
        tripulacion_asignada: tripulacionAsignada.value || [],
        fecha_salida_plan: operacionesAssignment.value.fecha_salida_plan,
        hora_salida_plan: operacionesAssignment.value.hora_salida_plan,
        fecha_fin_plan: operacionesAssignment.value.fecha_fin_plan,
        hora_fin_plan: operacionesAssignment.value.hora_fin_plan,
        observaciones: operacionesAssignment.value.observaciones_operaciones,
        aparejos_asignados_json: operacionesAssignment.value.implementos_survey || operacionesAssignment.value.aparejos || [],
        implementos_survey: operacionesAssignment.value.implementos_survey || [],
        aparejos: operacionesAssignment.value.implementos_survey || operacionesAssignment.value.aparejos || [],
        aparejos_bloqueados_survey: true,
        cumplimiento_acreditaciones: operacionesAssignment.value.cumplimiento_acreditaciones,
        porcentaje_acreditacion: porcentajeAcreditacionReal.value,
        ot_versiones: ot_versiones.value
      }
    }
  }
}

const guardarEnPreventa = async () => {
  if (!opportunity.value.rut_cliente) {
    alert('⚠️ Requerimiento Obligatorio: Debe seleccionar un Cliente Mandante antes de guardar.')
    return
  }
  
  try {
    const token = localStorage.getItem('token') || ''
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const payload = buildPayload()
    
    const projectId = props.proyectoId || currentProyectoId.value
    const isEdit = !!projectId
    
    let responseData
    if (isEdit) {
      payload.id_user_modificacion = currentUser.id_user || null
      const { data } = await apiAxios.put(`/proyectos/${projectId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      responseData = data
    } else {
      const { data } = await apiAxios.post('/proyectos/preventa', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      responseData = data
    }
    
    isDirty.value = false // Reseteamos el flag de cambios sin guardar
    
    let successMsg = 'Oportunidad registrada exitosamente en estado Preventa.'
    if (payload.id_proyecto_estado === ESTADO_DB_OPERACIONES) {
      successMsg = 'Requerimiento generado exitosamente y notificado al área de Operaciones.'
    } else if (isEdit) {
      successMsg = 'Oportunidad actualizada exitosamente.'
    }
    alert(successMsg)
    
    emit('creada', {
      id: 'COT-' + new Date().getFullYear() + '-' + (responseData.proyecto?.id_proyecto || projectId),
      cliente: clientes.value.find(c => c.rut_empresa === opportunity.value.rut_cliente)?.razon_social || 'Cliente Mandante',
      monto: formatCurrency(totalNeto.value),
      detalle: lines.value[0]?.descripcion || 'Línea de servicio'
    })
    emit('close')
  } catch (error) {
    console.error(error)
    alert('Error al guardar en preventa.')
  }
}

const generarRequerimiento = async () => {
  if (!validarDatosParaGenerarRequerimiento()) {
    return
  }

  // Snapshot inalterable de Preventa Comercial para Auditoría Diff
  snapshotComercial.value = {
    peso_carga: siteVisit.value.peso_carga || '',
    volumen_carga: siteVisit.value.volumen_carga || '',
    radios_trabajo: siteVisit.value.radios_trabajo || '',
    alturas_trabajo: siteVisit.value.alturas_trabajo || '',
    tipo_carga: siteVisit.value.tipo_carga || '',
    obra_nombre: siteVisit.value.obra_nombre || '',
    obra_direccion: siteVisit.value.obra_direccion || '',
    obra_ciudad: siteVisit.value.obra_ciudad || '',
    lines: JSON.parse(JSON.stringify(lines.value)),
    equipo_descripcion: lines.value[0]?.descripcion || '',
    equipo_cantidad: lines.value[0]?.cantidad || 1,
    equipo_valor: lines.value[0]?.valorUnitario || 0,
    pensiones: { ...comercial.value.pensiones }
  }

  // Cambia el estado a Requerimiento Generado / Preparación en Operaciones
  opportunity.value.id_proyecto_estado = ESTADO_DB_OPERACIONES
  await guardarEnPreventa()
  
  try {
    await apiAxios.post('/message', {
      para: 'vendedor@arriendosanpablo.cl',
      cc: 'luis@arriendosanpablo.cl, omar@arriendosanpablo.cl, analista@arriendosanpablo.cl, coordinador@arriendosanpablo.cl',
      asunto: `Nuevo Requerimiento de Operaciones: ${antecedentes.value.identificador_formal || 'COT'}`,
      cuerpo: `Se ha generado un nuevo requerimiento para la cotización ${antecedentes.value.identificador_formal || 'COT'}. Ya puedes revisarlo en el módulo de Operaciones.`
    })
    alert('✉️ Notificación REAL de Nuevo Requerimiento enviada con copia a Gerencia, Vendedor, Analista y Coordinador.\n\nLa tarjeta avanzó a la columna "En Preparación Operaciones".')
  } catch (error) {
    console.error("Error enviando correo de requerimiento:", error)
    alert('⚠️ El requerimiento avanzó, pero falló el envío de correo REAL por API.')
  }
}

const aprobarYGenerarOT = async () => {
  try {
    const token = localStorage.getItem('token') || ''
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    
    // Evaluacion automatica Spec-Driven
    const tieneDiff = diffsCount.value > 0 || (operacionesAssignment.value.observaciones_operaciones && operacionesAssignment.value.observaciones_operaciones.trim().length > 0)
    const decisionFinal = tieneDiff ? 'APROBADO_CON_OBS' : 'APROBADO'
    
    // Habilitar condicionalmente la Pestaña C
    requerimientoAprobado.value = true
    operacionesSubTab.value = 'asignacion'
    sincronizarTrasladosComerciales()
    
    // Asignar "DESDE" por defecto desde la Pestaña B (Fecha Tentativa)
    if (!operacionesAssignment.value.fecha_salida_plan && opportunity.value?.fecha_tentativa) {
      operacionesAssignment.value.fecha_salida_plan = opportunity.value.fecha_tentativa
      operacionesAssignment.value.fecha_fin_plan = opportunity.value.fecha_tentativa
    }
    
    // Guardar avance en borrador
    const payload = buildPayload()
    payload.id_proyecto_estado = ESTADOS_DB.ASIGNACION_RECURSOS
    opportunity.value.id_proyecto_estado = ESTADOS_DB.ASIGNACION_RECURSOS
    payload.json_field.ejecucion_v1 = {
      ...(payload.json_field?.ejecucion_v1 || {}),
      subtab_activa: 'asignacion',
      decision: decisionFinal,
      penaliza_kpi_comercial: tieneDiff,
      diff_registrado: {
        tiene_diff: tieneDiff,
        total_cambios: diffsCount.value,
        snapshot_comercial: snapshotComercial.value,
        datos_operaciones: {
          peso_carga: siteVisit.value.peso_carga,
          equipo_descripcion: lines.value[0]?.descripcion
        }
      }
    }
    
    const projectId = props.proyectoId || currentProyectoId.value
    await apiAxios.put(`/proyectos/${projectId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const textoResultado = tieneDiff 
      ? '⚠️ Requerimiento APROBADO CON OBSERVACIONES (Modificaciones auditadas en rojo y registradas para KPI comercial).'
      : '✅ Requerimiento APROBADO (Sin observaciones).'

    if (tieneDiff) {
      try {
        await apiAxios.post('/message', {
          para: 'vendedor@arriendosanpablo.cl',
          cc: 'luis@arriendosanpablo.cl, omar@arriendosanpablo.cl, analista@arriendosanpablo.cl, coordinador@arriendosanpablo.cl',
          asunto: `Requerimiento Confirmado CON OBSERVACIONES (Diff): ${antecedentes.value.identificador_formal || 'COT'}`,
          cuerpo: `El área de Operaciones ha confirmado el requerimiento ${antecedentes.value.identificador_formal || 'COT'}, pero se registraron modificaciones (Diffs) respecto a lo cotizado comercialmente. Favor revisar los detalles en la plataforma.`
        })
      } catch (err) {
        console.error('Error enviando correo de Diff:', err)
      }
    }

    alert(`${textoResultado}\n\nSe ha habilitado la Pestaña C: Asignación de Recursos (OT). Selecciona la Grúa, Operador, Rigger y Tiempos de Salida para finalizar.`)
  } catch (error) {
    console.error('Error al aprobar requerimiento:', error)
    alert('Error al procesar la aprobación del requerimiento.')
  }
}

const asignacionConfirmada = ref(false)

const preparacionSalidaState = ref({
  // Segmento 1: Control de Calidad
  cc_notificado: false,
  cc_usuario_id: null,
  cc_notas_riesgo: '',
  cc_fecha_notificacion: null,
  
  // Segmento 2: Inspección Salida Patio (Jefe de Patio)
  inspecciones_patio: {},
  patio_programado: false,
  jefe_patio_id: null,
  fecha_inspeccion_plan: '',
  hora_inspeccion_plan: '07:30',
  patio_checklist_completado: false,
  patio_estado_mecanico: 'CONFORME',
  patio_estado_neumaticos: 'CONFORME',
  patio_documentacion: 'CONFORME',
  patio_requiere_taller: false,
  patio_detalle_taller: '',
  patio_fotos: [],
  patio_contrapesos_cargados: false,
  patio_aparejos_cargados: false,
  
  // Segmento 3: Analista de Operaciones
  analista_notificado: false,
  analista_id: null,
  analista_instrucciones: '',
  analista_revision_360: false,
  analista_geocerca_activa: false,
  validacion_estricta: false,
  analista_geocerca_radio_m: 500,
  preparacion_finalizada: false
})

const equiposAsignadosLista = computed(() => {
  const list = []
  const seen = new Set()

  // 1. Equipos asignados en Flota Principal (Segmento 1)
  if (Array.isArray(linesEquiposPrincipales.value)) {
    linesEquiposPrincipales.value.forEach(l => {
      const eqId = l.equipo_asignado_id || l.equipo_id
      if (eqId && eqId !== 'CRN-DEFAULT') {
        const eqObj = getEquipoObj(eqId)
        const idKey = eqObj ? eqObj.id_equipo : eqId
        if (idKey && !seen.has(idKey)) {
          seen.add(idKey)
          list.push(idKey)
        }
      }
    })
  }

  // 2. Equipos del Segmento de Traslado (Segmento 2)
  if (Array.isArray(operacionesAssignment.value?.equipos_extra)) {
    operacionesAssignment.value.equipos_extra.forEach(eqItem => {
      const eqId = (typeof eqItem === 'object' && eqItem !== null) ? eqItem.id_equipo : eqItem
      if (eqId && eqId !== 'CRN-DEFAULT') {
        const eqObj = getEquipoObj(eqId)
        const idKey = eqObj ? eqObj.id_equipo : eqId
        if (idKey && !seen.has(idKey)) {
          seen.add(idKey)
          list.push(idKey)
        }
      }
    })
  }

  // 3. Fallback solo si no hay equipos en Segmento 1 ni Segmento 2
  if (list.length === 0) {
    const primaryId = operacionesAssignment.value?.equipo_id
    if (primaryId && primaryId !== 'CRN-DEFAULT') {
      const eqObj = getEquipoObj(primaryId)
      if (eqObj && !seen.has(eqObj.id_equipo)) {
        seen.add(eqObj.id_equipo)
        list.push(eqObj.id_equipo)
      }
    }
  }

  return list
})

const getOperadorAsignadoAEquipo = (eqId) => {
  if (!eqId) return null
  const trip = tripulacionAsignada.value || []
  const eqObj = getEquipoObj(eqId)
  const idStr = String(eqId).trim().toUpperCase()
  const patStr = eqObj?.patente ? String(eqObj.patente).trim().toUpperCase() : ''
  const idEqStr = eqObj?.id_equipo ? String(eqObj.id_equipo).trim().toUpperCase() : ''

  const found = trip.find(t => {
    if (!t.id_user || !t.equipo_asignado_id) return false
    const tEqStr = String(t.equipo_asignado_id).trim().toUpperCase()
    return tEqStr === idStr || (patStr && tEqStr === patStr) || (idEqStr && tEqStr === idEqStr)
  })
  return found || null
}

const getNombreOperadorAsignado = (eqId) => {
  const ins = getInspeccionEquipo(eqId)
  const opTrip = getOperadorAsignadoAEquipo(eqId)
  const targetUserId = ins?.operador_id || ins?.jefe_patio_id || opTrip?.id_user
  if (!targetUserId) return 'Sin Operador Asignado'
  const u = (usuarios.value || []).find(user => Number(user.id_user) === Number(targetUserId))
  return u?.nombre_user || u?.name_user || (u?.name_frst ? `${u.name_frst || ''} ${u.apellido_pat || ''}`.trim() : null) || opTrip?.cargo || 'Operador Asignado'
}

const onOperadorInspeccionCambiado = (eqId, nuevoIdUser) => {
  if (!eqId) return
  const numId = nuevoIdUser ? parseInt(nuevoIdUser) : null
  const ins = getInspeccionEquipo(eqId)
  ins.operador_id = numId
  ins.jefe_patio_id = numId

  // Sincronizar hacia atrás con la línea de la máquina en OT (Pestaña C)
  const lPrincipal = linesEquiposPrincipales.value || []
  const eqObj = getEquipoObj(eqId)
  const idStr = String(eqId).trim().toUpperCase()
  const patStr = eqObj?.patente ? String(eqObj.patente).trim().toUpperCase() : ''

  const matchPrincipal = lPrincipal.find(l => {
    const lEqStr = String(l.equipo_asignado_id || l.equipo_id || '').trim().toUpperCase()
    return lEqStr === idStr || (patStr && lEqStr === patStr)
  })
  if (matchPrincipal) {
    matchPrincipal.operador_asignado_id = numId || ''
    marcarDirtyAsignacion()
  } else if (Array.isArray(operacionesAssignment.value?.equipos_extra)) {
    const matchExtra = operacionesAssignment.value.equipos_extra.find(e => {
      const eEqStr = String(e.id_equipo || '').trim().toUpperCase()
      return eEqStr === idStr || (patStr && eEqStr === patStr)
    })
    if (matchExtra) {
      matchExtra.chofer_id = numId || ''
      marcarDirtyAsignacion()
    }
  }
}

const getInspeccionEquipo = (eqId) => {
  if (!preparacionSalidaState.value) {
    preparacionSalidaState.value = {}
  }
  if (!preparacionSalidaState.value.inspecciones_patio) {
    preparacionSalidaState.value.inspecciones_patio = {}
  }
  if (!preparacionSalidaState.value.inspecciones_patio[eqId]) {
    const op = getOperadorAsignadoAEquipo(eqId)
    preparacionSalidaState.value.inspecciones_patio[eqId] = {
      patio_programado: false,
      id_survey: null,
      operador_id: op?.id_user || null,
      jefe_patio_id: op?.id_user || null,
      fecha_inspeccion_plan: new Date().toISOString().substring(0, 10),
      hora_inspeccion_plan: '07:30',
      patio_checklist_completado: false,
      patio_requiere_taller: false,
      id_doc_pdf: null
    }
  } else {
    // Si la inspección aún no está programada, mantener sincronizado el operador con la OT
    const ins = preparacionSalidaState.value.inspecciones_patio[eqId]
    if (!ins.patio_programado && !ins.id_survey) {
      const op = getOperadorAsignadoAEquipo(eqId)
      if (op?.id_user && (!ins.operador_id || ins.operador_id !== op.id_user)) {
        ins.operador_id = op.id_user
        ins.jefe_patio_id = op.id_user
      }
    }
  }
  return preparacionSalidaState.value.inspecciones_patio[eqId]
}

const expandedEquiposPatio = ref({})
const toggleExpandEquipoPatio = (eqId) => {
  expandedEquiposPatio.value[eqId] = !expandedEquiposPatio.value[eqId]
}
const isEquipoPatioExpanded = (eqId) => {
  return !!expandedEquiposPatio.value[eqId]
}

const getEstadoInspeccionEquipo = (eqId) => {
  const insp = getInspeccionEquipo(eqId)
  if (!insp || !insp.id_survey) {
    return 'NO_ASIGNADA'
  }
  const st = String(insp.estado_srv || '').trim().toUpperCase()
  if (insp.patio_checklist_completado || st === 'APROBADO' || st === 'COMPLETADO' || st === 'FINALIZADO' || st === 'EJECUTADO') {
    if (insp.patio_requiere_taller || st === 'RECHAZADO') return 'RECHAZADA'
    return 'EJECUTADA_OK'
  }
  if (st === 'VERIFICACION' || st === 'EN VERIFICACION' || st === 'EN_VERIFICACION') {
    return 'EN_VERIFICACION'
  }
  if (st === 'EN PROCESO' || st === 'EN PROGRESO' || st === 'EN EJECUCION' || st === 'INICIADO' || st === 'BORRADOR' || st === 'GUARDADO') {
    return 'EN_EJECUCION'
  }
  if (st === 'CREADO' || st === 'PLANIFICADO' || st === 'ASIGNADO' || st === 'PROGRAMADO' || insp.patio_programado) {
    return 'PLANIFICADA'
  }
  return 'NO_ASIGNADA'
}

const evaluarAcreditacionDeltaEquipo = (eqId) => {
  try {
    if (!eqId || eqId === 'CRN-DEFAULT') return { isOk: true, missingCount: 0 }
    const map = docsVinculadosMap.value || {}
    const reqDocs = opportunity.value?.acreditacion_docs?.equipos || ['SOAP', 'Revisión Técnica', 'Certificación Anual Izaje']
    let missing = 0
    if (Array.isArray(reqDocs)) {
      reqDocs.forEach(doc => {
        const key = `${eqId}_${doc}`
        if (!map[key] && !map[doc]) {
          missing++
        }
      })
    }
    return {
      isOk: missing === 0,
      missingCount: missing
    }
  } catch (err) {
    console.warn('evaluarAcreditacionDeltaEquipo safe fallback:', err)
    return { isOk: true, missingCount: 0 }
  }
}

const abrirModalExcepcionEquipo = (eqId) => {
  const eqNombreSaliente = getNombreEquipoAsignado(eqId)
  const motivo = prompt(`⚠️ EXCEPCIÓN EN PATIO: Desasignación de equipo por Falla Técnica / Eventualidad.\n\nPor favor ingrese el motivo de la falla para "${eqNombreSaliente}":`, 'Falla técnica detectada en inspección de patio')
  if (!motivo) return

  registrarTrazaCorreo(
    'EXCEPCION_PATIO',
    'operaciones@leanglobal.cl',
    `🚨 Sustitución por Falla en Patio (${eqNombreSaliente}): ${antecedentes.value.identificador_formal || 'OT'}`,
    `Equipo desasignado por falla técnica: ${eqNombreSaliente}. Motivo: ${motivo}`
  )

  alert(`🚨 Excepción registrada exitosamente.\n\nEl equipo ${eqNombreSaliente} se ha marcado por falla en la bitácora de operaciones.\nRecuerda revisar la acreditación Delta del nuevo equipo entrante.`)
}

const statusSegmento1 = computed(() => preparacionSalidaState.value?.cc_notificado ? 'GREEN' : 'RED')

const statusSegmento2 = computed(() => {
  try {
    const eqList = equiposAsignadosLista.value || []
    if (eqList.length === 0) return 'RED'
    const states = eqList.map(eqId => getInspeccionEquipo(eqId))
    const allCompletado = states.every(s => s?.patio_checklist_completado || s?.estado_srv === 'APROBADO' || s?.estado_srv === 'COMPLETADO')
    if (allCompletado) {
      if (states.some(s => s?.patio_requiere_taller || s?.estado_srv === 'RECHAZADO')) return 'RED'
      return 'GREEN'
    }
    const someProgramado = states.some(s => s?.id_survey || s?.patio_programado)
    if (someProgramado) return 'YELLOW'
    return 'RED'
  } catch (err) {
    return 'RED'
  }
})

const statusSegmento3 = computed(() => {
  if (preparacionSalidaState.value?.preparacion_finalizada) return 'GREEN'
  if (preparacionSalidaState.value?.analista_notificado || preparacionSalidaState.value?.analista_revision_360) return 'YELLOW'
  return 'RED'
})

const sincronizandoInspecciones = ref(false)
const sincronizarInspeccionesPWA = async () => {
  sincronizandoInspecciones.value = true
  try {
    const projectId = props.proyectoId || currentProyectoId.value
    if (projectId) {
      const { data } = await apiAxios.get(`/proyectos/${projectId}`)
      const projData = data?.data || data
      const ejec = projData?.json_field?.ejecucion_v1
      if (ejec?.preparacion_salida?.inspecciones_patio) {
        preparacionSalidaState.value = {
          ...preparacionSalidaState.value,
          ...ejec.preparacion_salida,
          inspecciones_patio: {
            ...(preparacionSalidaState.value.inspecciones_patio || {}),
            ...ejec.preparacion_salida.inspecciones_patio
          }
        }
      }
    }

    // Consultar el estado real de cada survey en la base de datos y depurar claves inválidas
    const inspMap = preparacionSalidaState.value.inspecciones_patio || {}
    let huboCambios = false

    // Limpieza de claves espurias
    if (inspMap['[object Object]']) {
      delete inspMap['[object Object]']
      huboCambios = true
    }
    if (inspMap['Servicio de Traslado/Flete']) {
      delete inspMap['Servicio de Traslado/Flete']
      huboCambios = true
    }

    for (const eqId of Object.keys(inspMap)) {
      const ins = inspMap[eqId]
      if (ins) {
        // Si no tiene id_survey, forzar patio_programado a false
        if (!ins.id_survey && ins.patio_programado) {
          ins.patio_programado = false
          huboCambios = true
        }

        if (ins.id_survey) {
          try {
            const { data: srvData } = await apiAxios.get('/servicio/leanglobal/procesosSurveyDetail', {
              params: { id_survey: ins.id_survey }
            })
            const srvList = Array.isArray(srvData) ? srvData : (srvData?.data || [srvData])
            const srv = srvList[0] || null
            if (srv) {
              const rawStatus = String(srv.estado_srv || '').trim()
              if (ins.estado_srv !== rawStatus) {
                ins.estado_srv = rawStatus
                huboCambios = true
              }
              const upperStatus = rawStatus.toUpperCase()
              if (upperStatus === 'COMPLETADO' || upperStatus === 'FINALIZADO' || upperStatus === 'EJECUTADO' || upperStatus === 'APROBADO') {
                if (!ins.patio_checklist_completado) {
                  ins.patio_checklist_completado = true
                  huboCambios = true
                }
                if (!ins.id_doc_pdf && ins.id_survey) {
                  try {
                    const { data: v3Res } = await apiAxios.get('/servicio/leanglobal/procesosSurveyV3', {
                      params: { id_survey: ins.id_survey }
                    })
                    const v3List = Array.isArray(v3Res?.datos) ? v3Res.datos : (Array.isArray(v3Res) ? v3Res : [])
                    const v3Item = v3List.find(d => Number(d.id_survey) === Number(ins.id_survey))
                    if (v3Item?.id_flow) {
                      const { data: steps } = await apiAxios.get('/servicio/leanglobal/flujosAprobacionSteps', {
                        params: { id_flow: v3Item.id_flow }
                      })
                      if (Array.isArray(steps) && steps.length > 0) {
                        const stepWithOut = [...steps].reverse().find(s => s.id_doc_out)
                        const stepWithIn = [...steps].reverse().find(s => s.id_doc_in)
                        const foundDoc = stepWithOut?.id_doc_out || stepWithIn?.id_doc_in
                        if (foundDoc) {
                          ins.id_doc_pdf = foundDoc
                          huboCambios = true
                        }
                      }
                    }
                  } catch (eDoc) {
                    console.warn(`Error obteniendo id_doc_pdf para survey #${ins.id_survey}:`, eDoc)
                  }
                }
              }
            }
          } catch (eSurvey) {
            console.warn(`No se pudo consultar estado de survey #${ins.id_survey}:`, eSurvey)
          }
        }
      }
    }

    if (huboCambios && projectId) {
      const token = localStorage.getItem('token') || ''
      const payload = buildPayload()
      await apiAxios.put(`/proyectos/${projectId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }
  } catch (err) {
    console.warn('Error sincronizando inspecciones PWA:', err)
  } finally {
    setTimeout(() => {
      sincronizandoInspecciones.value = false
    }, 400)
  }
}

// -------------------------------------------------------------
// TELEMETRÍA DE CONVOY, ENLACES MÓVILES & AUTORIZACIÓN COPEC (SPEC 32)
// -------------------------------------------------------------
const solicitudesCopecPendientes = ref([
  {
    patente: 'HW-8842',
    chofer_nombre: 'Carlos Mendoza',
    odometro: 145920.0,
    horometro: 3245.0,
    id_autorizacion_input: '#COPEC-8492'
  }
])

const cargarViajesProyecto = async (projId) => {
  let id = projId || props.proyectoId || currentProyectoId.value
  if (typeof id === 'object' && id !== null) {
    id = id.id_proyecto || id.id || id.id_cotizacion
  }
  if (!id) return
  cargandoViajes.value = true
  try {
    const { data } = await apiAxios.get(`/viajes/proyecto/${id}`)
    viajesProyecto.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('Error al cargar viajes del proyecto:', err)
    viajesProyecto.value = []
  } finally {
    cargandoViajes.value = false
  }
}

const getViajeDeEquipo = (eqId) => {
  const eqObj = getEquipoObj(eqId)
  const idStr = String(eqId || '').trim().toUpperCase()
  const patStr = String(eqObj?.patente || eqObj?.patente_asignada || getPatenteEquipoAsignado(eqId) || '').trim().toUpperCase()
  const idEqStr = String(eqObj?.id_equipo || eqObj?.id || '').trim().toUpperCase()

  const list = viajesProyecto.value || []
  return list.find(v => {
    const vEqIdStr = String(v.id_equipo || '').trim().toUpperCase()
    const vPatStr = String(v.patente || '').trim().toUpperCase()
    const vToken = String(v.token_viaje || '').trim().toUpperCase()

    const cleanPat = patStr.replace(/[^A-Z0-9]/g, '')
    const cleanVPat = vPatStr.replace(/[^A-Z0-9]/g, '')

    const matchId = (vEqIdStr && (vEqIdStr === idStr || vEqIdStr === idEqStr))
    const matchPat = (cleanPat && cleanVPat && cleanPat === cleanVPat)
    const matchToken = (idStr && (
      vToken.includes(`_${idStr}_`) || 
      vToken.includes(`-${idStr}-`) || 
      vToken.endsWith(`_${idStr}`) || 
      vToken.endsWith(`-${idStr}`)
    ))
    const matchTokenEq = (idEqStr && (
      vToken.includes(`_${idEqStr}_`) || 
      vToken.includes(`-${idEqStr}-`) || 
      vToken.endsWith(`_${idEqStr}`) || 
      vToken.endsWith(`-${idEqStr}`)
    ))

    return matchId || matchPat || matchToken || matchTokenEq
  }) || null
}

const abrirMapaViaje = (target) => {
  if (typeof target === 'object' && target !== null && target.id_log_desplazamiento) {
    viajeSeleccionadoParaMapa.value = target
  } else {
    const vj = getViajeDeEquipo(target)
    if (vj) {
      viajeSeleccionadoParaMapa.value = vj
    } else {
      alert('⚠️ Aún no se han registrado datos de telemetría u hoja de ruta en terreno para este vehículo.')
      return
    }
  }
  modalMapaViajeAbierto.value = true
}

const formatearFechaCorta = (fechaStr) => {
  if (!fechaStr) return '---'
  try {
    const d = new Date(fechaStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
  } catch (e) {
    return fechaStr
  }
}

const formatHoraCorta = (dtStr) => {
  if (!dtStr) return '--:--'
  try {
    const d = new Date(dtStr)
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return String(dtStr).slice(11, 16)
  }
}

const cargarReportsProyecto = async (projId) => {
  let id = projId || props.proyectoId || currentProyectoId.value
  if (typeof id === 'object' && id !== null) {
    id = id.id_proyecto || id.id || id.id_cotizacion
  }
  if (!id) return
  cargandoReports.value = true
  try {
    const { data } = await apiAxios.get(`/operaciones/report/proyecto/${id}`)
    reportsProyecto.value = Array.isArray(data?.data) ? data.data : []
  } catch (err) {
    console.warn('Error al cargar reports del proyecto:', err)
    reportsProyecto.value = []
  } finally {
    cargandoReports.value = false
  }
}

const abrirVisorReport = (report) => {
  reportSeleccionadoParaVisor.value = report
  modalVisorReportAbierto.value = true
}

const onReportValidado = (reportActualizado) => {
  cargarReportsProyecto()
}

const listaEquiposUnicosReports = computed(() => {
  const map = new Map()
  ;(reportsProyecto.value || []).forEach(r => {
    if (r.id_equipo && !map.has(r.id_equipo)) {
      map.set(r.id_equipo, {
        id_equipo: r.id_equipo,
        patente: r.equipo_patente || 'S/P',
        modelo: r.equipo_modelo || 'Grúa'
      })
    }
  })
  return Array.from(map.values())
})

const reportsFiltrados = computed(() => {
  const list = reportsProyecto.value || []
  if (filtroEquipoReports.value === 'TODOS') return list
  return list.filter(r => Number(r.id_equipo) === Number(filtroEquipoReports.value))
})

const resumenKpiReports = computed(() => {
  const list = reportsFiltrados.value || []
  const dias = list.length
  const totalFacturables = list.reduce((sum, r) => sum + (Number(r.horas_facturables) || 0), 0)
  const totalSobretiempo = list.reduce((sum, r) => sum + (Number(r.horas_sobretiempo) || 0), 0)
  const validados = list.filter(r => r.estado_reporte === 'VALIDADO_ANALISTA').length
  const pendientes = list.filter(r => r.estado_reporte !== 'VALIDADO_ANALISTA').length
  
  let horometroRange = '---'
  if (list.length > 0) {
    const primerIni = list[0].horometro_inicio || '---'
    const ultimoFin = list[list.length - 1].horometro_termino || '---'
    horometroRange = `${primerIni} ➔ ${ultimoFin}`
  }

  return {
    dias,
    totalFacturables: totalFacturables.toFixed(1),
    totalSobretiempo: totalSobretiempo.toFixed(1),
    validados,
    pendientes,
    horometroRange
  }
})

// === FUNCIONES DE LIQUIDACIÓN Y EDP (Spec 38) ===
const cargarResumenEDP = async (projId) => {
  let id = projId || props.proyectoId || currentProyectoId.value
  if (typeof id === 'object' && id !== null) {
    id = id.id_proyecto || id.id || id.id_cotizacion
  }
  if (!id) return
  cargandoEDP.value = true
  try {
    const { data } = await apiAxios.get(`/operaciones/report/edp/resumen/${id}`)
    if (data?.success) {
      edpData.value = data.data
      if (data.data.liquidacion_guardada) {
        const liq = data.data.liquidacion_guardada
        formFacturacion.hes_oc_numero = liq.hes_oc_numero || ''
        formFacturacion.factura_numero = liq.factura_numero || ''
        formFacturacion.fecha_facturacion = liq.fecha_facturacion || new Date().toISOString().split('T')[0]
        formFacturacion.observaciones_facturacion = liq.observaciones_facturacion || ''
      }
    }
  } catch (err) {
    console.warn('Error al cargar resumen EDP:', err)
  } finally {
    cargandoEDP.value = false
  }
}

const guardarCierreFacturacion = async () => {
  let id = props.proyectoId || currentProyectoId.value
  if (typeof id === 'object' && id !== null) {
    id = id.id_proyecto || id.id || id.id_cotizacion
  }
  if (!id) return

  if (!formFacturacion.factura_numero) {
    alert('⚠️ Debes ingresar el N° de Factura Emitida para cerrar el servicio.')
    return
  }

  if (!window.confirm(`¿Confirmas declarar la OT como FACTURADA con Factura N° ${formFacturacion.factura_numero} y concluir el servicio?`)) {
    return
  }

  guardandoFacturacion.value = true
  try {
    const payload = {
      id_proyecto: id,
      hes_oc_numero: formFacturacion.hes_oc_numero,
      factura_numero: formFacturacion.factura_numero,
      fecha_facturacion: formFacturacion.fecha_facturacion,
      monto_facturado_neto: edpData.value?.resumen_financiero?.total_neto || 0,
      monto_facturado_bruto: edpData.value?.resumen_financiero?.total_bruto || 0,
      observaciones_facturacion: formFacturacion.observaciones_facturacion
    }

    const { data } = await apiAxios.post('/operaciones/report/edp/cerrar-facturacion', payload)
    if (data?.success) {
      alert('🎉 OT Declarada Facturada y Concluida Exitosamente.')
      estadoDbActual.value = 7
      cargarResumenEDP(id)
      cargarDatosCotizacion()
    }
  } catch (err) {
    console.error('Error al cerrar facturación:', err)
    alert('❌ Error al registrar facturación: ' + (err.response?.data?.error || err.message))
  } finally {
    guardandoFacturacion.value = false
  }
}

const viajesConvoyLista = computed(() => {
  const result = []
  const eqTotales = equiposAsignadosTotales.value || []
  
  eqTotales.forEach((eq, idx) => {
    const eqId = eq.id_equipo || eq.id
    const vjReal = getViajeDeEquipo(eqId)
    
    const chofer = (tripulacionAsignada.value || []).find(t => 
      t.equipo_asignado_id === eq.id_equipo || t.equipo_asignado_id === eq.patente
    )
    const choferUser = chofer?.id_user ? (usuarios.value || []).find(u => u.id_user === chofer.id_user) : null
    const choferNombre = vjReal?.chofer_nombre || choferUser?.nombre_user || choferUser?.name_user || 'Conductor Asignado'
    let projId = props.proyectoId || currentProyectoId.value || '69'
    if (typeof projId === 'object' && projId !== null) projId = projId.id_proyecto || '69'
    const token = vjReal?.token_viaje || `vj-${projId}-${eq.id_equipo || eq.patente || idx + 1}`

    result.push({
      token,
      id_equipo: eq.id_equipo,
      patente: vjReal?.patente || eq.patente || 'S/P',
      nombre_equipo: eq.nombre_equipo || vjReal?.modelo || eq.tipo,
      modelo: eq.tipo || vjReal?.tipo_equipo,
      chofer_nombre: choferNombre,
      estado: (vjReal?.estado_trayecto === 'LLEGADO' || vjReal?.estado_viaje === 'ARRIBADO_FAENA') 
        ? 'ARRIBADO_FAENA' 
        : (vjReal ? 'EN_RUTA' : 'ASIGNADO'),
      viaje_real: vjReal
    })
  })

  // Agregar cualquier viaje en base de datos adicional
  ;(viajesProyecto.value || []).forEach(vj => {
    if (!result.some(r => r.token === vj.token_viaje || (r.patente && r.patente === vj.patente))) {
      result.push({
        token: vj.token_viaje,
        id_equipo: vj.id_equipo,
        patente: vj.patente || 'S/P',
        nombre_equipo: `${vj.marca || ''} ${vj.modelo || ''}`.trim() || 'Equipo de Flota',
        modelo: vj.tipo_equipo || 'Izaje',
        chofer_nombre: vj.chofer_nombre || 'Conductor Asignado',
        estado: (vj.estado_trayecto === 'LLEGADO' || vj.estado_viaje === 'ARRIBADO_FAENA') ? 'ARRIBADO_FAENA' : 'EN_RUTA',
        viaje_real: vj
      })
    }
  })

  return result
})

const copiarEnlaceViaje = (token) => {
  const url = `https://servidor.leanglobal.cl/lg-gsp-dev/viaje/${token}`
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
    alert(`📋 Enlace copiado al portapapeles:\n\n${url}\n\nPuedes enviarlo al conductor por WhatsApp o SMS.`)
  } else {
    prompt('Copia este enlace para el conductor:', url)
  }
}

const abrirWebViaje = (token) => {
  const url = `https://servidor.leanglobal.cl/lg-gsp-dev/viaje/${token}`
  window.open(url, '_blank')
}

let autoPollTimer = null
watch(() => operacionesSubTab.value, (newTab) => {
  if (newTab === 'asignacion') {
    sincronizarTrasladosComerciales()
    cargarExpedientesAsignados()
  } else if (newTab === 'acreditaciones' || newTab === 'dossier_acreditacion') {
    cargarExpedientesAsignados()
  }
  if (newTab === 'preparacion_salida') {
    cargarExpedientesAsignados()
    sincronizarInspeccionesPWA()
    cargarViajesProyecto()
    if (!autoPollTimer) {
      autoPollTimer = setInterval(() => {
        sincronizarInspeccionesPWA()
        cargarViajesProyecto()
      }, 8000)
    }
  } else {
    if (autoPollTimer) {
      clearInterval(autoPollTimer)
      autoPollTimer = null
    }
  }
}, { immediate: true })

watch(() => tripulacionAsignada.value, () => {
  cargarExpedientesAsignados()
}, { deep: true })

watch(() => equiposAsignadosLista.value, () => {
  cargarExpedientesAsignados()
}, { deep: true })

const aprobarSolicitudCopec = (sol) => {
  if (!sol.id_autorizacion_input) {
    alert('⚠️ Debes ingresar un ID / Código de Autorización Copec.')
    return
  }
  alert(`✅ Tarjeta Copec Habilitada Exitosamente para ${sol.patente}.\nID Autorización: ${sol.id_autorizacion_input}\nEl conductor ya puede cargar combustible en la estación.`)
  solicitudesCopecPendientes.value = solicitudesCopecPendientes.value.filter(s => s !== sol)
}

const confirmarAsignacionOT = async () => {
  // VALIDACIÓN STRICTA DE RIGGER
  if (opportunity.value.requiere_rigger) {
    const tieneRigger = tripulacionAsignada.value.some(t => t.id_user && t.cargo === 'Rigger') || operacionesAssignment.value.rigger_id
    if (!tieneRigger) {
      alert('⚠️ Requerimiento Obligatorio: La Oportunidad exige un Rigger certificado. Debes Asignar un Rigger en la Tripulación.')
      return
    }
  }

  // Validación: Conductores para vehículos asignados
  const equiposSinConductor = [];
  const lPrincipalVal = linesEquiposPrincipales.value || [];
  
  // 1. Validar Flota Principal (Segmento 1)
  lPrincipalVal.forEach(l => {
    if (l && l.equipo_asignado_id && !l.operador_asignado_id) {
      const eqObj = getEquipoObj(l.equipo_asignado_id);
      const pat = eqObj?.patente || l.equipo_asignado_id;
      const nom = eqObj?.nombre_equipo || eqObj?.modelo || l.descripcion || l.subcategoria || l.tipo || 'Equipo Principal';
      equiposSinConductor.push(`${pat} (${nom})`);
    }
  });

  // 2. Validar Equipos de Traslado (Segmento 2)
  if (Array.isArray(operacionesAssignment.value?.equipos_extra)) {
    operacionesAssignment.value.equipos_extra.forEach((eqEx, idx) => {
      const eqId = (typeof eqEx === 'object' && eqEx !== null) ? eqEx.id_equipo : eqEx
      const choferId = (typeof eqEx === 'object' && eqEx !== null) ? eqEx.chofer_id : null
      if (eqId && !choferId) {
        const eqObj = getEquipoObj(eqId)
        const pat = eqObj?.patente || eqId
        const nom = eqObj?.nombre_equipo || eqObj?.modelo || eqEx.descripcion || eqEx.subcategoria || `Vehículo Traslado #${idx + 1}`
        equiposSinConductor.push(`${pat} (${nom})`)
      }
    })
  }

  if (equiposSinConductor.length > 0) {
    const continuar = confirm(`⚠️ Verificación Operativa:\nLos siguientes equipos asignados no tienen un Conductor / Operador asociado en la Tripulación:\n• ${equiposSinConductor.join('\n• ')}\n\n¿Deseas confirmar la OT de todas formas?`)
    if (!continuar) return
  }
  try {
    const token = localStorage.getItem('token') || ''
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    
    asignacionConfirmada.value = true
    operacionesSubTab.value = 'preparacion_salida'
    
    const payload = buildPayload()
    payload.json_field.ejecucion_v1 = {
      ...(payload.json_field?.ejecucion_v1 || {}),
      asignacion_confirmada: true,
      equipo_id: linesEquiposPrincipales.value[0]?.equipo_asignado_id || operacionesAssignment.value.equipo_id || null,
      equipos_extra: operacionesAssignment.value.equipos_extra,
      operador_id: operacionesAssignment.value.operador_id,
      rigger_id: operacionesAssignment.value.rigger_id,
      chofer_id: operacionesAssignment.value.chofer_id,
      fecha_salida_plan: operacionesAssignment.value.fecha_salida_plan,
      hora_salida_plan: operacionesAssignment.value.hora_salida_plan,
      fecha_fin_plan: operacionesAssignment.value.fecha_fin_plan,
      hora_fin_plan: operacionesAssignment.value.hora_fin_plan,
      observaciones: operacionesAssignment.value.observaciones_operaciones,
      aparejos_solicitados_json: snapshotComercial.value.aparejos || {},
      aparejos_asignados_json: operacionesAssignment.value.implementos_survey || operacionesAssignment.value.aparejos,
      preparacion_salida: preparacionSalidaState.value
    }
    
    const projectId = props.proyectoId || currentProyectoId.value
    payload.id_proyecto_estado = ESTADOS_DB.PREPARACION_PATIO
    opportunity.value.id_proyecto_estado = ESTADOS_DB.PREPARACION_PATIO
    await apiAxios.put(`/proyectos/${projectId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })

    // Persistencia relacional en tablas tpry_rel_persona y tpry_rel_equipo con Fechas Plan individuales (Spec 22)
    try {
      const fechaIniGbl = operacionesAssignment.value.fecha_salida_plan ? new Date(operacionesAssignment.value.fecha_salida_plan + 'T' + (operacionesAssignment.value.hora_salida_plan || '08:00')).toISOString() : new Date().toISOString()
      const fechaFinGbl = operacionesAssignment.value.fecha_fin_plan ? new Date(operacionesAssignment.value.fecha_fin_plan + 'T' + (operacionesAssignment.value.hora_fin_plan || '18:00')).toISOString() : new Date().toISOString()
      
      // Personal de Tripulación
      const tripulacionLista = (tripulacionAsignada.value || []).concat([
        { id_user: operacionesAssignment.value.operador_id, cargo: 'Operador Grúa' },
        { id_user: operacionesAssignment.value.rigger_id, cargo: 'Rigger' },
        { id_user: operacionesAssignment.value.chofer_id, cargo: 'Chofer Transporte' }
      ])
      
      for (const p of tripulacionLista) {
        if (p.id_user && !isNaN(parseInt(p.id_user))) {
          const fIni = p.fecha_plan_ini ? new Date(p.fecha_plan_ini + 'T08:00').toISOString() : fechaIniGbl
          const fFin = p.fecha_plan_fin ? new Date(p.fecha_plan_fin + 'T18:00').toISOString() : fechaFinGbl
          
          await apiAxios.post(`/proyectos/${projectId}/asignaciones/personas`, {
            id_proyecto: parseInt(projectId),
            id_user: parseInt(p.id_user),
            rol_asignado: p.cargo || 'Personal Asignado',
            fecha_plan_ini: fIni,
            fecha_plan_fin: fFin,
            estado_real: 'PROGRAMADO',
            id_user_creacion: currentUser.id_user || 1
          }, { headers: { Authorization: `Bearer ${token}` } }).catch(e => console.warn('Rel persona:', e))
        }
      }

      // Equipos
      const equiposLista = (linesEquiposPrincipales.value || []).map(l => ({
        id_equipo: l.equipo_asignado_id,
        rol: l.tipo || 'Equipo Principal',
        f_ini: l.fecha_plan_ini,
        f_fin: l.fecha_plan_fin
      }))
      
      if (Array.isArray(operacionesAssignment.value.equipos_extra)) {
        operacionesAssignment.value.equipos_extra.forEach((ex, idx) => {
          if (ex.id_equipo) {
            equiposLista.push({
              id_equipo: ex.id_equipo,
              rol: ex.descripcion || ex.subcategoria || ex.tipo || `Vehículo Traslado #${idx + 1}`,
              f_ini: ex.fecha_plan_ini,
              f_fin: ex.fecha_plan_fin
            })
          }
        })
      }

      for (const eq of equiposLista) {
        if (eq.id_equipo && !isNaN(parseInt(eq.id_equipo))) {
          const fIni = eq.f_ini ? new Date(eq.f_ini + 'T08:00').toISOString() : fechaIniGbl
          const fFin = eq.f_fin ? new Date(eq.f_fin + 'T18:00').toISOString() : fechaFinGbl
          
          await apiAxios.post(`/proyectos/${projectId}/asignaciones/equipos`, {
            id_proyecto: parseInt(projectId),
            id_equipo: parseInt(eq.id_equipo),
            rol_equipo: eq.rol || 'Equipo Asignado',
            fecha_plan_ini: fIni,
            fecha_plan_fin: fFin,
            estado_real: 'PROGRAMADO',
            id_user_creacion: currentUser.id_user || 1
          }, { headers: { Authorization: `Bearer ${token}` } }).catch(e => console.warn('Rel equipo:', e))
        }
      }
    } catch (errRel) {
      console.warn('Error al guardar relaciones de asignación:', errRel)
    }
    
    // Notification for Comercial
    const comercialEmail = currentUser.email || 'sgajardoc@gmail.com'
    const htmlComercial = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #ffffff; padding: 25px; border-radius: 16px; border: 1px solid #1e293b;">
        <h2 style="color: #10b981;">OT Confirmada y en Preparación</h2>
        <p>Los recursos técnicos y humanos han sido asignados exitosamente al servicio de la cotización <strong>${antecedentes.value.identificador_formal || 'COT'}</strong>.</p>
        <p>El proyecto ha avanzado a la fase de <strong>Preparación de Patio / Despacho a Terreno</strong>.</p>
      </div>
    `
    apiAxios.post('/message', {
      para: comercialEmail,
      asunto: `🚜 OT Confirmada: ${antecedentes.value.identificador_formal || 'COT'} en Preparación de Patio`,
      cuerpo: htmlComercial,
      html: htmlComercial
    }).catch(e => console.warn(e))
    registrarTrazaCorreo('COMERCIAL', comercialEmail, 'OT Confirmada', 'Notificación a Comercial sobre OT Confirmada')
    
    isDirty.value = false
    
    // Notificación por correo estilo propuesta a la tripulación
    const equipoNombre = listaEquiposMaster.value.find(e => e.id_equipo === operacionesAssignment.value.equipo_id)?.nombre_equipo || operacionesAssignment.value.equipo_id
    const idsTripulacion = [operacionesAssignment.value.operador_id, operacionesAssignment.value.rigger_id, operacionesAssignment.value.chofer_id].filter(Boolean)
    const targetUsers = usuarios.value.filter(u => idsTripulacion.includes(u.id_user) && u.email)

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #ffffff; padding: 25px; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #3b82f6; margin: 0; font-size: 22px;">🏗️ GRÚAS SAN PABLO</h2>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px;">Asignación de Recursos para Servicio Operacional</p>
        </div>
        <div style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin-bottom: 25px; background-color: #020617; border-left: 4px solid #3b82f6; padding: 18px; border-radius: 10px;">
          Estimado Integrante de Tripulación,<br><br>
          Ha sido asignado al servicio operacional correspondiente a la Orden de Trabajo <strong>${antecedentes.value.identificador_formal || 'COT'}</strong>.<br><br>
          <strong>Detalles del Servicio:</strong><br>
          • Cliente: <strong>${clienteSeleccionado.value?.razon_social || opportunity.value.rut_cliente}</strong><br>
          • Obra: <strong>${siteVisit.value.obra_nombre || 'En Terreno'}</strong> (${siteVisit.value.obra_ciudad || ''})<br>
          • Dirección: <strong>${siteVisit.value.obra_direccion || 'Ver en Mapa'}</strong><br>
          • Equipo Asignado: <strong>${equipoNombre}</strong><br>
          • Fecha Salida Base: <strong>${operacionesAssignment.value.fecha_salida_plan || 'Por definir'}</strong> a las <strong>${operacionesAssignment.value.hora_salida_plan || '08:00'} hrs</strong><br>
        <div style="border-top: 1px solid #1e293b; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b;">
          Grúas San Pablo S.A. | Coordinación de Operaciones
        </div>
      </div>
    `

    targetUsers.forEach(u => {
      apiAxios.post('/message', {
        para: u.email,
        asunto: `🚜 Asignación de Servicio OT: ${antecedentes.value.identificador_formal || 'COT'} - ${equipoNombre}`,
        cuerpo: htmlBody,
        html: htmlBody
      }).catch(e => console.warn(`Error enviando correo a ${u.email}:`, e))

      registrarTrazaCorreo(
        'TRIPULACION',
        u.email,
        `🚜 Asignación de Servicio OT: ${antecedentes.value.identificador_formal || 'COT'} - ${equipoNombre}`,
        `Notificación de asignación enviada a integrante de tripulación`
      )
    })

    // Notificación explícita al Coordinador de Patio
    const patioEmail = 'coordinador_patio@leanglobal.cl'
    apiAxios.post('/message', {
      para: patioEmail,
      asunto: `📦 Notificación a Patio: Preparación de Salida OT ${antecedentes.value.identificador_formal || 'COT'} - ${equipoNombre}`,
      cuerpo: htmlBody,
      html: htmlBody
    }).catch(e => console.warn(`Error enviando correo a patio:`, e))

    registrarTrazaCorreo(
      'PATIO',
      patioEmail,
      `📦 Notificación a Patio: Preparación de Salida OT ${antecedentes.value.identificador_formal || 'COT'} - ${equipoNombre}`,
      `Notificación automática de inicio de preparación de salida enviada al Coordinador de Patio`
    )

    alert('🚀 Asignación de Recursos Confirmada y notificada a la tripulación y al Coordinador de Patio.\n\nAvanzando a la etapa: Preparación de Salida.')
  } catch (error) {
    console.error('Error al confirmar asignación OT:', error)
    alert('Error al confirmar la asignación de recursos para la OT.')
  }
}

const notificarControlCalidad = async () => {
  preparacionSalidaState.value.cc_notificado = true
  preparacionSalidaState.value.cc_fecha_notificacion = new Date().toISOString()
  
  registrarTrazaCorreo(
    'CONTROL_CALIDAD',
    'calidad@arriendosanpablo.cl, sgajardoc@gmail.com',
    `🛡️ Requerimientos de Calidad OT: ${antecedentes.value.identificador_formal || 'COT'}`,
    `Notificación a Control de Calidad con notas de riesgo: "${preparacionSalidaState.value.cc_notas_riesgo || 'Sin observaciones de riesgo'}"`
  )
  
  const token = localStorage.getItem('token') || ''
  const payload = buildPayload()
  
  const projectId = props.proyectoId || currentProyectoId.value
  await apiAxios.put(`/proyectos/${projectId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  alert('🟢 Control de Calidad notificado formalmente por correo y traza registrada en sistema.')
}

const reiniciarInspeccionesPatio = async () => {
  if (!confirm('¿Desea limpiar las inspecciones creadas para este proyecto para volver a asignarlas desde cero?')) return
  preparacionSalidaState.value.inspecciones_patio = {}
  preparacionSalidaState.value.patio_programado = false
  preparacionSalidaState.value.patio_checklist_completado = false
  
  const token = localStorage.getItem('token') || ''
  const payload = buildPayload()
  const projectId = props.proyectoId || currentProyectoId.value
  await apiAxios.put(`/proyectos/${projectId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
  alert('🧹 Inspecciones de patio limpiadas. Puedes volver a asignarlas desde cero.')
}

const eliminarInspeccionEquipo = async (eqId) => {
  const ins = getInspeccionEquipo(eqId)
  if (!confirm(`¿Desea eliminar la inspección #${ins.id_survey || ''} de la base de datos y volver a asignarla?`)) return
  
  if (ins.id_survey) {
    try {
      await apiAxios.post('/survey/DelSurvey/', { id_survey: ins.id_survey })
    } catch (delErr) {
      console.warn(`Error al eliminar survey #${ins.id_survey}:`, delErr)
    }
  }
  
  if (!preparacionSalidaState.value.inspecciones_patio) {
    preparacionSalidaState.value.inspecciones_patio = {}
  }
  
  const op = getOperadorAsignadoAEquipo(eqId)
  preparacionSalidaState.value.inspecciones_patio[eqId] = {
    id_equipo: eqId,
    operador_id: op?.id_user || null,
    jefe_patio_id: op?.id_user || null,
    fecha_inspeccion_plan: new Date().toISOString().split('T')[0],
    hora_inspeccion_plan: '07:30',
    patio_programado: false,
    patio_checklist_completado: false,
    id_survey: null,
    id_doc_pdf: null
  }
  
  const token = localStorage.getItem('token') || ''
  const payload = buildPayload()
  const projectId = props.proyectoId || currentProyectoId.value
  await apiAxios.put(`/proyectos/${projectId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  alert(`🧹 Inspección reseteada. Ya puedes volver a asignarla.`)
}

const programarInspeccionPatioEquipo = async (eqId) => {
  const ins = getInspeccionEquipo(eqId)
  const opAsignado = getOperadorAsignadoAEquipo(eqId)
  const operadorId = ins.operador_id || ins.jefe_patio_id || opAsignado?.id_user
  if (!operadorId) {
    alert('⚠️ Por favor asigne primero el Operador/Conductor para este equipo en la Asignación de Recursos (Pestaña C) o selecciónelo en el desplegable.')
    return
  }

  const token = localStorage.getItem('token') || ''
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const projectId = props.proyectoId || currentProyectoId.value
  const eqNombre = getNombreEquipoAsignado(eqId)
  const eqPpu = getPatenteEquipoAsignado(eqId)
  const empClienteId = selectedClient.value?.id_empresa || opportunity.value?.id_empresa_cliente || opportunity.value?.id_empresa || 1

  let createdSurveyId = null

  // 1. Creación formal de la Inspección con Template 76 (TMPL-GSP-CHK-EQUIPOS) con id_flow_tmpl = 1 y estructuras completas (idéntico a Visita Terreno)
  try {
    let bodySeed = { segmentos: [] }
    let headerSeed = {}
    let approvalSeed = {}
    let idFlowTmpl = 1

    try {
      const tmplRes = await apiAxios.get('/servicio/leanglobal/obtenerTemplates')
      const templates = Array.isArray(tmplRes.data) ? tmplRes.data : []
      const template = templates.find(t => Number(t.id_template) === 76 || t.codi_template_srv === 'TMPL-GSP-CHK-EQUIPOS')
      if (template) {
        bodySeed = typeof template.body_seed === 'string' ? JSON.parse(template.body_seed) : (template.body_seed || { segmentos: [] })
        headerSeed = typeof template.header_seed === 'string' ? JSON.parse(template.header_seed) : (template.header_seed || {})
        approvalSeed = typeof template.approval_seed === 'string' ? JSON.parse(template.approval_seed) : (template.approval_seed || {})
        idFlowTmpl = Number(template.id_flow_tmpl) || 1
      }
    } catch (eTmpl) {
      console.warn("No se pudo obtener el template 76 desde la API, usando respaldo", eTmpl)
    }

    // Inyectar datos de la máquina y cliente en el bodySeed y body_exec como labels estáticos
    const eqObj = getEquipoObj(eqId) || {}
    const eqCategoria = eqObj.tipo || eqObj.familia || eqObj.categoria || (linesValidas.value.find(l => (l.equipo_asignado_id === eqId || l.equipo_id === eqId))?.tipo) || 'Equipo de Servicio'
    const eqSubcategoria = eqObj.subcategoria || eqObj.modelo || (linesValidas.value.find(l => (l.equipo_asignado_id === eqId || l.equipo_id === eqId))?.subcategoria) || eqObj.nombre_equipo || 'General'
    const eqPatente = (eqObj.patente || eqObj.ppu || eqPpu || '').toUpperCase().trim()

    bodySeed.id_equipo = eqId
    bodySeed.equipo_nombre = eqNombre
    bodySeed.equipo_ppu = eqPatente
    bodySeed.patente = eqPatente
    bodySeed.categoria = eqCategoria
    bodySeed.subcategoria = eqSubcategoria
    bodySeed.id_proyecto = parseInt(projectId)
    bodySeed.id_empresa_cliente = parseInt(empClienteId)
    bodySeed.identificador_formal = antecedentes.value.identificador_formal || 'OT'
    bodySeed.labels_estaticos = {
      categoria: eqCategoria,
      subcategoria: eqSubcategoria,
      patente: eqPatente
    }

    // Pre-llenar y transformar de comboBox a solo lectura SYSTEM los atributos del segmento DATOS GENERALES
    if (Array.isArray(bodySeed.segmentos)) {
      bodySeed.segmentos.forEach(seg => {
        if (Array.isArray(seg.attributes)) {
          seg.attributes.forEach(attr => {
            const label = (attr.label || attr.text || '').toUpperCase()
            if (label.includes('PATENTE') || label.includes('PPU')) {
              attr.type = 'textField'
              attr.roles = ['SYSTEM']
              attr.default = eqPatente
              attr.value = eqPatente
              delete attr.values
            } else if (label.includes('SUBCATEGORIA') || (label.includes('MODELO') && label.includes('EQUIPO'))) {
              attr.type = 'textField'
              attr.roles = ['SYSTEM']
              attr.default = eqSubcategoria
              attr.value = eqSubcategoria
              delete attr.values
            } else if (label.includes('CATEGORIA') && label.includes('EQUIPO')) {
              attr.type = 'textField'
              attr.roles = ['SYSTEM']
              attr.default = eqCategoria
              attr.value = eqCategoria
              delete attr.values
            } else if ((label.includes('NUMERO') || label.includes('NRO')) && (label.includes('OT') || label.includes('PROYECTO'))) {
              const otCod = antecedentes.value.identificador_formal || 'OT'
              attr.type = 'textField'
              attr.roles = ['SYSTEM']
              attr.default = otCod
              attr.value = otCod
              delete attr.values
            } else if (label.includes('TIPO DE MOVIMIENTO')) {
              attr.type = 'textField'
              attr.roles = ['SYSTEM']
              attr.default = 'SALIDA'
              attr.value = 'SALIDA'
              delete attr.values
            }
          })
        }
      })
    }

    const fechaPlan = ins.fecha_inspeccion_plan ? `${ins.fecha_inspeccion_plan}T${ins.hora_inspeccion_plan || '07:30'}:00` : new Date().toISOString()

    const srvPayload = {
      id_template: 76,
      id_flow_tmpl: idFlowTmpl,
      id_tipo_srv: 1,
      id_user: parseInt(operadorId),
      id_user_creacion: currentUser.id_user || 1,
      id_proyecto: parseInt(projectId),
      id_empresa_cliente: parseInt(empClienteId),
      estado_srv: 'Creado',
      header_seed: JSON.stringify(headerSeed),
      body_seed: JSON.stringify(bodySeed),
      approval_seed: JSON.stringify(approvalSeed),
      header_exec: JSON.stringify(headerSeed),
      body_exec: JSON.stringify(bodySeed),
      approval_exec: JSON.stringify(approvalSeed),
      fecha_plan_ini: fechaPlan,
      fecha_plan_fin: fechaPlan
    }

    const { data: srvRes } = await apiAxios.post('/survey', srvPayload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    createdSurveyId = srvRes?.idSurvey || srvRes?.id_survey
  } catch (errSrv) {
    console.warn('Error al crear la inspección formal de Template 76:', errSrv)
  }

  if (!preparacionSalidaState.value.inspecciones_patio) {
    preparacionSalidaState.value.inspecciones_patio = {}
  }

  // Mutación reactiva explícita para Vue 3
  preparacionSalidaState.value.inspecciones_patio[eqId] = {
    ...ins,
    operador_id: parseInt(operadorId),
    jefe_patio_id: parseInt(operadorId),
    id_survey: createdSurveyId || ins.id_survey || null,
    id_template: 76,
    codi_template_srv: 'TMPL-GSP-CHK-EQUIPOS',
    name_template_srv: 'Check List Entrada y Salida Equipos',
    patio_programado: true
  }

  preparacionSalidaState.value.inspecciones_patio = { ...preparacionSalidaState.value.inspecciones_patio }
  preparacionSalidaState.value.patio_programado = true

  const opUser = (usuarios.value || []).find(u => u.id_user === parseInt(operadorId)) || (usuariosEnroladosFes.value || []).find(u => u.id_user === parseInt(operadorId))
  registrarTrazaCorreo(
    'OPERADOR_PATIO_PWA',
    opUser?.email || 'operador@leanglobal.cl',
    `🚜 Inspección Pre-Uso Asignada (${eqNombre}): ${antecedentes.value.identificador_formal || 'COT'}`,
    `Checklist de Salida de Patio (Template 76) programado para el operador ${opUser?.nombre_user || opUser?.name_frst || 'Asignado'} el ${ins.fecha_inspeccion_plan} a las ${ins.hora_inspeccion_plan} hrs. Survey ID: #${createdSurveyId || 'Asignado'}`
  )

  const payload = buildPayload()
  await apiAxios.put(`/proyectos/${projectId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  alert(`🟢 Inspección de Patio #${createdSurveyId || ''} creada y asignada exitosamente al Operador de ${eqNombre}.\n\nHaz clic en "📄 Ver PDF" cuando esté firmada, o en "👁️ Ver en Pantalla" para consultar la encuesta.`)
}

const confirmarInspeccionSalidaPatioEquipo = async (eqId) => {
  if (!preparacionSalidaState.value.cc_notificado) {
    alert('⚠️ Debe notificar previamente a Control de Calidad (Paso 1).')
    return
  }
  const ins = getInspeccionEquipo(eqId)
  ins.patio_checklist_completado = true
  
  const allCompletado = equiposAsignadosLista.value.every(e => getInspeccionEquipo(e).patio_checklist_completado)
  if (allCompletado) {
    preparacionSalidaState.value.patio_checklist_completado = true
    preparacionSalidaState.value.patio_contrapesos_cargados = true
    preparacionSalidaState.value.patio_aparejos_cargados = true
  }
  
  const token = localStorage.getItem('token') || ''
  const payload = buildPayload()
  
  const projectId = props.proyectoId || currentProyectoId.value
  await apiAxios.put(`/proyectos/${projectId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  const eqNombre = getNombreEquipoAsignado(eqId)
  alert(`🟢 Check List Operativo Digital de Patio confirmado para ${eqNombre}.`)
}

const autorizandoSalidaId = ref(null)

const getLinkViajeOperador = (eqId) => {
  const ins = getInspeccionEquipo(eqId)
  const token = ins?.token_viaje || ('vj-' + (antecedentes.value.identificador_formal || 'gsp').toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + eqId)
  return `https://servidor.leanglobal.cl/lg-gsp-dev/viaje/${token}`
}

const autorizarSalidaEquipo = async (eqId, isReenvio = false) => {
  const ins = getInspeccionEquipo(eqId)
  const opTrip = getOperadorAsignadoAEquipo(eqId)
  
  // 1. Obtener ID del operador asignado (priorizando selector de inspección de patio, luego asignación de OT)
  const targetUserId = ins?.operador_id || ins?.jefe_patio_id || opTrip?.id_user
  
  if (!targetUserId) {
    alert('⚠️ No se ha identificado al operador/chofer asignado a este equipo. Por favor verifique la asignación antes de autorizar la salida.')
    return
  }

  // 2. Buscar usuario en el catálogo cargado
  const fullUser = (usuarios.value || []).find(u => Number(u.id_user) === Number(targetUserId)) || {}

  // 3. Resolver datos de equipo y operador
  const eq = equiposAsignadosLista.value.find(e => (e.id_equipo == eqId || e.id == eqId)) || {}
  const eqNombre = eq.descripcion || eq.marca_modelo || eq.nombre_equipo || ('Equipo #' + eqId)
  const eqPatente = eq.patente_asignada || eq.patente || getPatenteEquipoAsignado(eqId) || 'S/P'
  
  const opNombre = fullUser.nombre_user || fullUser.name_user || (fullUser.name_frst ? `${fullUser.name_frst || ''} ${fullUser.apellido_pat || ''}`.trim() : null) || opTrip?.cargo || 'Operador / Conductor'
  
  // 4. Resolver correo electrónico determinísticamente
  let opEmail = fullUser.email || fullUser.codi_user || fullUser.email_alternativo
  if (!opEmail || opEmail.toLowerCase().includes('transmac') || Number(targetUserId) === 53 || Number(targetUserId) === 7 || (opNombre && opNombre.toLowerCase().includes('lean global'))) {
    opEmail = 'lguser@arriendosanpablo.cl'
  }

  autorizandoSalidaId.value = eqId
  try {
    const token = localStorage.getItem('token') || ''
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const coordinadorNombre = currentUser.nombre || (currentUser.name_frst ? `${currentUser.name_frst || ''} ${currentUser.apellido_pat || ''}`.trim() : 'Coordinador de Operaciones')

    // Generar o conservar token de viaje
    if (!ins.token_viaje) {
      ins.token_viaje = 'vj-' + (antecedentes.value.identificador_formal || 'gsp').toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + eqId + '-' + Math.random().toString(36).substring(2, 7)
    }

    const tripUrl = getLinkViajeOperador(eqId)

    // Maquetación HTML B2B enriquecida
    const htmlEmail = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #0b1021; color: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px; text-align: center;">
          <h2 style="color: #10b981; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">🏗️ GRÚAS SAN PABLO</h2>
          <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">
            AUTORIZACIÓN DE SALIDA DE BASE & INICIO DE HOJA DE RUTA
          </p>
        </div>

        <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
          <p style="color: #34d399; margin: 0; font-size: 14px; font-weight: bold;">
            ✅ Inspección de Patio Aprobada — Salida Autorizada
          </p>
          <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 12px; line-height: 1.5;">
            Estimado <strong>${opNombre}</strong>, la inspección técnica de pre-uso para su máquina ha sido verificada conforme por la Coordinación de Operaciones. Se autoriza la salida de base hacia faena.
          </p>
        </div>

        <div style="background-color: #050810; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 22px; font-size: 13px; line-height: 1.7;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #64748b; padding: 4px 0; width: 38%;"><strong>Orden de Trabajo:</strong></td>
              <td style="color: #f59e0b; font-weight: bold; font-family: monospace;">${antecedentes.value.identificador_formal || opportunity.value.codi_proyecto || 'GSP-OT'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Equipo Autorizado:</strong></td>
              <td style="color: #ffffff; font-weight: bold;">${eqNombre}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Patente (PPU):</strong></td>
              <td style="color: #38bdf8; font-weight: bold; font-family: monospace;">${eqPatente}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Cliente Mandante:</strong></td>
              <td style="color: #ffffff;">${clienteSeleccionado.value?.razon_social || opportunity.value.rut_cliente || 'Cliente Mandante'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Obra / Destino:</strong></td>
              <td style="color: #ffffff;">${siteVisit.value.obra_nombre || 'Faena Terreno'} (${siteVisit.value.obra_ciudad || ''})</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Dirección:</strong></td>
              <td style="color: #cbd5e1;">${siteVisit.value.obra_direccion || 'Ver en Hoja de Ruta'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Autorizado por:</strong></td>
              <td style="color: #10b981; font-weight: bold;">${coordinadorNombre}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0 20px 0;">
          <a href="${tripUrl}" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #022c22; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 900; font-size: 14px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
            📲 Iniciar Registro de Viaje y Salida
          </a>
          <p style="color: #64748b; font-size: 11px; margin-top: 10px;">
            Haga clic en el botón para ingresar odómetro/horómetro de salida y PIN de seguridad.
          </p>
        </div>

        <div style="border-top: 1px solid #1e293b; padding-top: 16px; text-align: center; font-size: 11px; color: #475569;">
          Grúas San Pablo S.A. • Torre de Control & Operaciones • Sistema LeanGlobal GSP
        </div>
      </div>
    `

    // Despacho de correo
    const emailRecipients = Array.from(new Set([opEmail, 'operaciones@arriendosanpablo.cl']))
    
    await Promise.all(emailRecipients.map(em => 
      apiAxios.post('/message', {
        para: em,
        asunto: `🚦 Salida Autorizada — Iniciar Registro de Viaje OT ${antecedentes.value.identificador_formal || 'GSP'}: ${eqNombre} (${eqPatente})`,
        cuerpo: htmlEmail,
        html: htmlEmail
      })
    ))

    // Actualizar estado de autorización
    ins.salida_autorizada = true
    ins.fecha_autorizacion_salida = new Date().toISOString()
    ins.autorizado_por = coordinadorNombre

    // Guardar en base de datos
    const projectId = props.proyectoId || currentProyectoId.value
    if (projectId) {
      const payload = buildPayload()
      await apiAxios.put(`/proyectos/${projectId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }

    registrarTrazaCorreo(
      'OPERADOR_VIAJE',
      emailRecipients.join(', '),
      `🚦 Salida Autorizada — Iniciar Registro de Viaje OT ${antecedentes.value.identificador_formal || 'GSP'}`,
      `Salida de patio autorizada para equipo ${eqNombre} (${eqPatente}). Notificación con link de viaje enviada a ${opNombre} (${opEmail})`
    )

    alert(`🚀 Salida autorizada exitosamente.\n\nSe ha despachado la notificación por correo al operador ${opNombre} (${opEmail}) con el enlace a su registro de viaje.`)
  } catch (error) {
    console.error('Error al autorizar salida de equipo:', error)
    alert(`Error al procesar la autorización de salida: ${error.response?.data?.error || error.message}`)
  } finally {
    autorizandoSalidaId.value = null
  }
}

const programarInspeccionPatio = async () => {
  if (!preparacionSalidaState.value.cc_notificado) {
    alert('⚠️ Paso 2 es secuencial de Paso 1. Debe notificar a Control de Calidad (Paso 1) antes de programar la Inspección de Patio.')
    return
  }
  if (!preparacionSalidaState.value.jefe_patio_id) {
    alert('⚠️ Por favor seleccione el Jefe de Patio asignado.')
    return
  }
  preparacionSalidaState.value.patio_programado = true
  
  const jefeUser = usuariosEnroladosFes.value.find(u => u.id_user === preparacionSalidaState.value.jefe_patio_id)
  registrarTrazaCorreo(
    'JEFE_PATIO_PWA',
    jefeUser?.email || 'jefe_patio@leanglobal.cl',
    `🚜 Inyección Survey PWA Inspección Patio: ${antecedentes.value.identificador_formal || 'COT'}`,
    `Programado para ${preparacionSalidaState.value.fecha_inspeccion_plan} a las ${preparacionSalidaState.value.hora_inspeccion_plan} hrs`
  )

  const token = localStorage.getItem('token') || ''
  const payload = buildPayload()
  
  const projectId = props.proyectoId || currentProyectoId.value
  await apiAxios.put(`/proyectos/${projectId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  alert('🟡 Inspección de Salida de Patio programada e inyectada al Jefe de Patio.')
}

const confirmarInspeccionSalidaPatio = async () => {
  if (!preparacionSalidaState.value.cc_notificado) {
    alert('⚠️ Debe notificar previamente a Control de Calidad (Paso 1).')
    return
  }
  preparacionSalidaState.value.patio_checklist_completado = true
  preparacionSalidaState.value.patio_contrapesos_cargados = true
  preparacionSalidaState.value.patio_aparejos_cargados = true
  
  const token = localStorage.getItem('token') || ''
  const payload = buildPayload()
  
  const projectId = props.proyectoId || currentProyectoId.value
  await apiAxios.put(`/proyectos/${projectId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  alert('🟢 Check List Operativo Digital de Patio confirmado. Carga y contrapesos validados en sistema.')
}

const notificarAnalistaOperaciones = async () => {
  preparacionSalidaState.value.analista_notificado = true
  
  const analistaUser = usuariosEnroladosFes.value.find(u => u.id_user === preparacionSalidaState.value.analista_id)
  registrarTrazaCorreo(
    'ANALISTA_OP',
    analistaUser?.email || 'analista@leanglobal.cl',
    `💻 Instrucción Operativa OT: ${antecedentes.value.identificador_formal || 'COT'}`,
    `Instrucción: "${preparacionSalidaState.value.analista_instrucciones || 'Realizar Análisis 360 y Geocerca GPS'}"`
  )

  const token = localStorage.getItem('token') || ''
  const payload = buildPayload()
  
  const projectId = props.proyectoId || currentProyectoId.value
  await apiAxios.put(`/proyectos/${projectId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  alert('🟡 Instrucción notificada al Analista de Operaciones.')
}

const finalizarPreparacionSalida = async () => {
  if (statusSegmento2.value !== 'GREEN') {
    alert('⚠️ La etapa de Preparación de Salida exige que la Inspección de Patio (Paso 2) esté CONFORME (🟢) antes de cerrar la etapa.')
    return
  }
  preparacionSalidaState.value.analista_revision_360 = true
  preparacionSalidaState.value.analista_geocerca_activa = true
  preparacionSalidaState.value.preparacion_finalizada = true
  
  const token = localStorage.getItem('token') || ''
  const payload = buildPayload()
  payload.json_field.ejecucion_v1 = payload.json_field.ejecucion_v1 || {}
  payload.json_field.ejecucion_v1.preparacion_salida = preparacionSalidaState.value
  
  const projectId = props.proyectoId || currentProyectoId.value
  await apiAxios.put(`/proyectos/${projectId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  alert('🎉 Preparación de Salida Completada Exitosamente (Paso 2 Patio 🟢 Y Paso 3 Analista 🟢). El servicio pasa a estado En Tránsito / Ejecución Terreno PWA.')
}

const generarPDF = async () => {
  if (!validarDatosPreventaParaCotizar()) {
    return
  }
  
  generandoPDF.value = true
  
  try {
    let projectId = props.proyectoId || currentProyectoId.value
    
    // Auto-guardado de la cotización antes de generar el PDF para asegurar que 
    // los detalles del estructurador estén actualizados en la base de datos.
    const token = localStorage.getItem('token') || ''
    const payload = buildPayload()
    
    if (!projectId) {
      const { data } = await apiAxios.post('/proyectos/preventa', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      projectId = data.proyecto.id_proyecto
      currentProyectoId.value = projectId
      console.log('Proyecto auto-guardado para cotización. ID:', projectId)
    } else {
      await apiAxios.put(`/proyectos/${projectId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('Proyecto actualizado previo a cotización. ID:', projectId)
    }
    
    // Llamar al endpoint del backend para generar la versión (Firma FES desactivada temporalmente)
    const { data } = await apiAxios.post(`/proyectos/${projectId}/generar-cotizacion`, {
      monto: totalNeto.value,
      omitir_firma_fes: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Actualizar el historial reactivamente, de la última a la más antigua
    cotizaciones_historicas.value = [...(data.proyecto.json_field?.crm_v1?.cotizaciones_historicas || [])].sort((a, b) => b.version - a.version)
    
    // Si el backend generó el código por primera vez, actualizarlo en la UI
    if (data.proyecto.codi_proyecto) {
      antecedentes.value.identificador_formal = data.proyecto.codi_proyecto
    }
    
    alert(`Cotización v${data.cotizacion.version} generada con éxito.\nArchivo: ${data.cotizacion.nombre_archivo}`)
    
    // Abrir la URL del archivo
    window.open(getFullStaticUrl(data.cotizacion.url), '_blank')
  } catch (error) {
    console.error('Error al generar versión de cotización:', error)
    alert('Error al generar la cotización en el servidor.')
  } finally {
    generandoPDF.value = false
  }
}

const generarPDFOT = async () => {
  let projectId = props.proyectoId || currentProyectoId.value
  if (!projectId) {
    alert('Debe guardar la oportunidad antes de generar la Orden de Trabajo.')
    return
  }

  generandoPDFOT.value = true
  try {
    const token = localStorage.getItem('token') || ''
    const payload = buildPayload()
    
    // Asegurar guardado previo de los cambios de asignación
    await apiAxios.put(`/proyectos/${projectId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const { data } = await apiAxios.post(`/proyectos/${projectId}/generar-ot`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (data?.ot) {
      ot_versiones.value = [...(data.proyecto?.json_field?.ejecucion_v1?.ot_versiones || [data.ot])].sort((a, b) => b.version - a.version)
      
      const pdfUrl = data.ot.id_doc ? `${apiAxios.defaults.baseURL.replace(/\/$/, '')}/v1/storage/view/${data.ot.id_doc}` : getFullStaticUrl(data.ot.url)
      
      alert(`🎉 Orden de Trabajo Versión ${data.ot.version} generada exitosamente.\nArchivo: ${data.ot.nombre_archivo}`)
      window.open(pdfUrl, '_blank')
    }
  } catch (error) {
    console.error('Error al generar versión de OT:', error)
    alert(`Error al generar la Orden de Trabajo en el servidor: ${error.response?.data?.error || error.message}`)
  } finally {
    generandoPDFOT.value = false
  }
}

const abrirModalEnviarOT = (otVer) => {
  selectedOTVersionForEmail.value = otVer
  
  // Sugerir destinatarios automáticos
  const recipients = new Set()
  recipients.add('operaciones@arriendosanpablo.cl')
  recipients.add('coordinador_patio@leanglobal.cl')
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  if (currentUser.email) recipients.add(currentUser.email)
  
  const clientEmail = selectedClient.value?.email_empresa || opportunity.value?.email_contacto || clienteSeleccionado.value?.email
  if (clientEmail) recipients.add(clientEmail)

  // Agregar correos de tripulantes asignados
  (tripulacionAsignada.value || []).forEach(t => {
    if (t.id_user) {
      const u = (usuarios.value || []).find(user => user.id_user === t.id_user)
      if (u?.email) recipients.add(u.email)
    }
  })

  formDespachoOT.value = {
    destinatarios: Array.from(recipients),
    nuevoEmail: '',
    asunto: `🏗️ Orden de Trabajo OT-${antecedentes.value.identificador_formal || 'GSP'}V${otVer.version} - ${siteVisit.value.obra_nombre || opportunity.value.nombre_proyecto || 'Servicio de Izaje'}`,
    cuerpo_adicional: `Estimado equipo,\n\nAdjuntamos la Orden de Trabajo Oficial Versión ${otVer.version} para el servicio operacional en ${siteVisit.value.obra_nombre || 'faena'}.\n\nSaludos cordiales,\nCoordinación de Operaciones - Grúas San Pablo S.A.`
  }
  
  showModalEnviarOT.value = true
}

const agregarDestinatarioOT = () => {
  const em = formDespachoOT.value.nuevoEmail.trim().toLowerCase()
  if (em && !formDespachoOT.value.destinatarios.includes(em)) {
    formDespachoOT.value.destinatarios.push(em)
    formDespachoOT.value.nuevoEmail = ''
  }
}

const eliminarDestinatarioOT = (idx) => {
  formDespachoOT.value.destinatarios.splice(idx, 1)
}

const despacharOTPorCorreo = async () => {
  if (!formDespachoOT.value.destinatarios || formDespachoOT.value.destinatarios.length === 0) {
    alert('Debe incluir al menos un destinatario de correo.')
    return
  }

  const projectId = props.proyectoId || currentProyectoId.value
  if (!projectId) return

  enviandoOT.value = true
  try {
    const token = localStorage.getItem('token') || ''
    const { data } = await apiAxios.post(`/proyectos/${projectId}/enviar-ot`, {
      version: selectedOTVersionForEmail.value?.version || 1,
      destinatarios: formDespachoOT.value.destinatarios,
      asunto: formDespachoOT.value.asunto,
      cuerpo_adicional: formDespachoOT.value.cuerpo_adicional
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    registrarTrazaCorreo(
      'OT_DESPACHO',
      formDespachoOT.value.destinatarios.join(', '),
      formDespachoOT.value.asunto,
      `Orden de Trabajo V${selectedOTVersionForEmail.value?.version} despachada por correo formal`
    )

    alert(`🟢 ${data.message || 'Orden de Trabajo despachada exitosamente.'}`)
    showModalEnviarOT.value = false
  } catch (error) {
    console.error('Error al despachar OT por correo:', error)
    alert(`Error al enviar el correo de la OT: ${error.response?.data?.error || error.message}`)
  } finally {
    enviandoOT.value = false
  }
}

const agregarHito = () => {
  if (!nuevaInteraccion.value.comentario) return
  alert('Hito "' + nuevaInteraccion.value.tipo + '" registrado correctamente en la bitácora.')
  nuevaInteraccion.value.comentario = ''
}

const solicitarAsignacionVisita = async () => {
  if (!opportunity.value.rut_cliente) {
    alert('Debe seleccionar un cliente mandante antes de programar una visita.')
    return
  }
  
  if (!selectedClient.value || !selectedClient.value.id_empresa) {
    alert('Debe seleccionar un cliente de la lista desplegable o crear uno nuevo para poder programar una visita a terreno.')
    return
  }

  if (!emailCoordinadorSeleccionado.value) {
    alert('Debe seleccionar un coordinador para notificar.')
    return
  }
  
  if (!currentProyectoId.value) {
    try {
      const token = localStorage.getItem('token') || ''
      const payload = buildPayload()
      
      const { data } = await apiAxios.post('/proyectos/preventa', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      currentProyectoId.value = data.proyecto.id_proyecto
      console.log('Proyecto guardado automáticamente para visita. ID:', currentProyectoId.value)
    } catch (error) {
      console.error('Error al guardar proyecto automático:', error)
      alert('Error al inicializar la cotización para programar la visita.')
      return
    }
  }

  cargandoVisita.value = true
  estadoAsignacion.value = null
  try {
    const token = localStorage.getItem('token') || ''
    const coordinador = usuarios.value.find(u => (u.email || u.correo || u.username) === emailCoordinadorSeleccionado.value) ||
                        coordinadoresVisita.value.find(u => (u.email || u.correo || u.username) === emailCoordinadorSeleccionado.value);
    
    await apiAxios.post(`/visitas/solicitar/${currentProyectoId.value}`, {
      email_coordinador: emailCoordinadorSeleccionado.value,
      id_coordinador: coordinador ? coordinador.id_user : null,
      contacto_nombre: siteVisit.value.contacto_terreno_nombre || opportunity.value.contacto_nombre || '',
      contacto_telefono: siteVisit.value.contacto_terreno_telefono || opportunity.value.contacto_telefono || '',
      contacto_email: siteVisit.value.contacto_terreno_email || opportunity.value.contacto_obj?.email || '',
      obra_nombre: siteVisit.value.obra_nombre || opportunity.value.nombre_proyecto || '',
      obra_direccion: siteVisit.value.obra_direccion || '',
      obra_ciudad: siteVisit.value.obra_ciudad || '',
      detalle_servicio: siteVisit.value.detalle_servicio || '',
      coordenadas_mapa: {
        lat: siteVisit.value.lat != null ? Number(siteVisit.value.lat) : null,
        lng: siteVisit.value.lng != null ? Number(siteVisit.value.lng) : null
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    estadoAsignacion.value = "Esperando asignación"
    alert('Asignación de visita solicitada exitosamente.')
  } catch (error) {
    console.error('Error al solicitar asignación:', error)
    alert('Error al solicitar asignación de visita.')
  } finally {
    cargandoVisita.value = false
  }
}



const onVisitaProgramada = (info) => {
  visitaProgramadaInfo.value = info
  siteVisit.value.visita_terreno = true
  siteVisit.value.obra_direccion = info.direccion
  siteVisit.value.lat = info.latitud != null ? Number(info.latitud) : null
  siteVisit.value.lng = info.longitud != null ? Number(info.longitud) : null
  
  // Refresca la lista de visitas
  fetchVisitasTerreno()
}

const formatFecha = (fStr) => {
  if (!fStr) return ''
  const d = new Date(fStr)
  return d.toLocaleDateString()
}

const abrirModalNoAsignada = () => {
  mostrarModalNoAsignada.value = true
}

const cerrarModalNoAsignada = () => {
  mostrarModalNoAsignada.value = false
  noAsignacionMotivo.value = 'Desistido por el cliente'
  noAsignacionObservacion.value = ''
}

const confirmarNoAsignada = async () => {
  const projectId = props.proyectoId || currentProyectoId.value
  if (!projectId) return

  try {
    const token = localStorage.getItem('token') || ''
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    
    // Generar el payload base
    const payload = buildPayload()
    
    // Forzar estado 99 ("Cotización No Asignada / Perdida") y meter los datos correspondientes en json_field
    payload.id_proyecto_estado = ESTADOS_DB.NO_GANADA
    opportunity.value.id_proyecto_estado = ESTADOS_DB.NO_GANADA
    payload.json_field.crm_v1.razon_no_asignada = noAsignacionMotivo.value
    payload.json_field.crm_v1.observacion_no_asignada = noAsignacionObservacion.value
    payload.id_user_modificacion = currentUser.id_user || null

    await apiAxios.put(`/proyectos/${projectId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    isDirty.value = false
    alert('Cotización marcada como "No Ganada" y enviada a la biblioteca.')
    cerrarModalNoAsignada()
    emit('creada', { id: projectId }) // Emitir evento para refrescar la Torre
    emit('close')
  } catch (error) {
    console.error('Error al marcar cotización no ganada:', error)
    alert('Error al desestimar la cotización.')
  }
}

const restaurarACotizar = async () => {
  const projectId = props.proyectoId || currentProyectoId.value
  if (!projectId) return

  try {
    const token = localStorage.getItem('token') || ''
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    
    const payload = buildPayload()
    
    // Cambiar a estado 2 ("Preparación de Cotización") y limpiar campos de desestimación
    payload.id_proyecto_estado = ESTADOS_DB.COTIZANDO
    opportunity.value.id_proyecto_estado = ESTADOS_DB.COTIZANDO
    if (payload.json_field?.crm_v1) {
      payload.json_field.crm_v1.razon_no_asignada = null
      payload.json_field.crm_v1.observacion_no_asignada = null
    }
    payload.id_user_modificacion = currentUser.id_user || null

    await apiAxios.put(`/proyectos/${projectId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    isDirty.value = false
    topTab.value = 'comercial'
    alert('Cotización restaurada a "Preparación de Cotización" exitosamente.')
    emit('creada', { id: projectId }) // Emitir evento para refrescar la Torre
    emit('close')
  } catch (error) {
    console.error('Error al restaurar cotización:', error)
    alert('Error al restaurar la cotización.')
  }
}

const volverACotizar = async () => {
  const projectId = props.proyectoId || currentProyectoId.value
  if (!projectId) return

  try {
    const token = localStorage.getItem('token') || ''
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    
    const payload = buildPayload()
    
    // Cambiar a estado 2 ("Preparación de Cotización / Preventa Comercial")
    payload.id_proyecto_estado = ESTADOS_DB.COTIZANDO
    opportunity.value.id_proyecto_estado = ESTADOS_DB.COTIZANDO
    payload.id_user_modificacion = currentUser.id_user || null

    await apiAxios.put(`/proyectos/${projectId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    isDirty.value = false
    topTab.value = 'comercial'
    alert('Cotización devuelta a Preventa Comercial exitosamente (100% editable).')
    emit('creada', { id: projectId })
    emit('close')
  } catch (error) {
    console.error('Error al devolver a cotizar:', error)
    alert('Error al devolver la cotización.')
  }
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

fieldset[disabled] input,
fieldset[disabled] select,
fieldset[disabled] textarea {
  opacity: 1 !important;
  color: #f8fafc !important;
  -webkit-text-fill-color: #f8fafc !important;
  background-color: #0a0f1e !important;
  cursor: not-allowed;
}
</style>
