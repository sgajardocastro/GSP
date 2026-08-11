<template>
  <div class="flex-1 min-h-0 flex flex-col gap-4 text-left">
    <!-- Header -->
    <div class="flex justify-between items-end flex-shrink-0">
      <div>
        <h2 class="text-xl font-extrabold text-white">
          {{ faseActual >= ESTADOS_PROCESO.VALIDACION_DIFF ? 'Requerimiento & Preparación de Operaciones' : 'Gestor de Oportunidades & Cotizaciones' }}
          <span v-if="antecedentes.identificador_formal" class="text-amber-500 font-mono text-base ml-2">[{{ antecedentes.identificador_formal }}]</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          {{ faseActual >= ESTADOS_PROCESO.VALIDACION_DIFF ? 'Revisión técnica de antecedentes, auditoría de modificaciones y asignación de flota.' : 'Estructuración B2B de requerimientos de izaje y logística.' }}
        </p>
      </div>
      <div class="flex gap-2">
        <button @click="handleCancelar" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors">
          Cancelar
        </button>
        <button v-if="faseActual >= ESTADOS_PROCESO.VALIDACION_DIFF && faseActual < ESTADOS_PROCESO.EN_FAENA" @click="volverACotizar" class="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"></path></svg>
          <span>Devolver a Comercial</span>
        </button>
        <button v-if="faseActual === ESTADOS_PROCESO.NO_ASIGNADA" @click="restaurarACotizar" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.75 8.25v.75M21 9h-6"></path></svg>
          <span>Restaurar a Cotizar</span>
        </button>
        <button v-if="faseActual < ESTADOS_PROCESO.VALIDACION_DIFF && (props.proyectoId || currentProyectoId) && faseActual !== ESTADOS_PROCESO.NO_ASIGNADA" @click="abrirModalNoAsignada" class="px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
          <span>No Ganada</span>
        </button>
        <button v-if="faseActual === ESTADOS_PROCESO.VALIDACION_DIFF && topTab === 'operaciones'" @click="abrirModalAprobarRequerimiento" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span>Aprobar Requerimiento & Habilitar Asignación OT</span>
        </button>
        <span v-if="faseActual >= ESTADOS_PROCESO.VALIDACION_DIFF && isDirtyAsignacion" class="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse flex items-center gap-1.5">
          🟡 Cambios Modificados (Sin Guardar)
        </span>

        <button v-if="faseActual >= ESTADOS_PROCESO.VALIDACION_DIFF" @click="guardarCambiosAsignacion" type="button" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer">
          💾 Guardar Cambios
        </button>

        <button v-if="faseActual === ESTADOS_PROCESO.ASIGNACION_RECURSOS && topTab === 'operaciones'" @click="confirmarAsignacionOT" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span>Confirmar Asignación OT ➔ Preparación Salida</span>
        </button>
        <button v-if="faseActual < ESTADOS_PROCESO.VALIDACION_DIFF" @click="generarPDF" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span>Generar Cotización</span>
        </button>
        <button v-if="faseActual < ESTADOS_PROCESO.VALIDACION_DIFF" @click="guardarEnPreventa" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
          <span>Guardar en Preventa</span>
        </button>
        <button v-if="faseActual < ESTADOS_PROCESO.VALIDACION_DIFF" @click="abrirModalGenerarRequerimiento" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest transition-colors shadow-lg shadow-amber-500/10 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span>Generar Requerimiento</span>
        </button>
      </div>
    </div>

    <!-- Barra de Tabs Vuetify Style Unificada -->
    <div v-if="(opportunity?.id_proyecto_estado || 1) >= 3 || isAsignacionConfirmada" class="flex border-b border-white/10 bg-[#080d1a] px-2 pt-2 flex-shrink-0 transition-all duration-200 gap-4">
      <button 
        @click="topTab = 'comercial'" 
        :class="topTab === 'comercial' ? 'text-amber-400 border-b-2 border-amber-500 font-bold' : 'text-slate-400 hover:text-white'" 
        class="py-2.5 px-4 text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        <span>1. Preventa Comercial</span>
      </button>

      <button 
        @click="cambiarYPersistirSubTab('validacion')" 
        :class="topTab === 'operaciones' && operacionesSubTab === 'validacion' ? 'text-amber-400 border-b-2 border-amber-500 font-bold' : 'text-slate-400 hover:text-white'" 
        class="py-2.5 px-4 text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>2. Validación & Diff</span>
      </button>

      <button 
        @click="cambiarYPersistirSubTab('asignacion')" 
        :class="topTab === 'operaciones' && operacionesSubTab === 'asignacion' ? 'text-emerald-400 border-b-2 border-emerald-500 font-bold' : 'text-slate-400 hover:text-white'" 
        class="py-2.5 px-4 text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        <span>3. Asignación de Recursos OT (Pestaña C)</span>
      </button>

      <button 
        @click="cambiarYPersistirSubTab('acreditaciones')" 
        :class="topTab === 'operaciones' && operacionesSubTab === 'acreditaciones' ? 'text-amber-400 border-b-2 border-amber-500 font-bold' : 'text-slate-400 hover:text-white'" 
        class="py-2.5 px-4 text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <span>4. Acreditaciones & Dossier (Post-Asignación)</span>
      </button>

      <button 
        @click="cambiarYPersistirSubTab('preparacion_salida')" 
        :class="topTab === 'operaciones' && operacionesSubTab === 'preparacion_salida' ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold' : 'text-slate-400 hover:text-white'" 
        class="py-2.5 px-4 text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
        <span>5. Preparación de Salida</span>
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
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Detalle del Servicio a realizar</label>
                <textarea v-model="siteVisit.detalle_servicio" rows="2" class="w-full bg-[#0a0f1e] border border-white/10 rounded p-2 text-xs text-white outline-none resize-none"></textarea>
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
                        <option value="">-- Tipo --</option>
                        <option v-for="cat in dbCategories" :key="cat.id_categoria" :value="cat.nombre_categoria">
                          {{ cat.nombre_categoria }}
                        </option>
                      </select>
                    </td>
                    <td class="p-2">
                      <div v-if="hasDiff('equipo_subcategoria', idx)" class="text-[9px] line-through text-red-400 font-mono bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 mb-1">
                        Orig: {{ getOriginalValue('equipo_subcategoria', idx) }}
                      </div>
                      <select v-model="line.subcategoria" class="bg-[#0a0f1e] border rounded px-2 py-1 text-[11px] text-white outline-none w-full" :class="hasDiff('equipo_subcategoria', idx) ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'">
                        <option value="">-- Seleccionar --</option>
                        <option v-for="sub in getSubcategoriesForType(line.tipo)" :key="sub.id_subcategoria" :value="sub.nombre_subcategoria">
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
                        <option value="Hrs día">Hrs día (Mínimas Diarias)</option>
                        <option value="Hrs Mensual">Hrs Mensual (Mínimas Mensuales)</option>
                        <option value="Fijo">Fijo (Servicio Puntual)</option>
                        <option value="Flete">Flete (Traslado/Movilización)</option>
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
              <textarea v-model="operacionesAssignment.observaciones_operaciones" :disabled="faseActual >= ESTADOS_PROCESO.ASIGNACION_RECURSOS" rows="2" placeholder="Detalle observaciones o razones de modificación..." class="w-full bg-[#0a0f1e] border border-white/10 rounded p-2 text-xs text-white outline-none resize-none disabled:opacity-75 disabled:bg-slate-900/60"></textarea>
            </div>
          </fieldset>

            <div v-if="faseActual >= ESTADOS_PROCESO.ASIGNACION_RECURSOS" class="pt-2">
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
      <div v-if="operacionesSubTab === 'asignacion'" class="space-y-6">
        <div v-if="isAsignacionConfirmada" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex justify-between items-center text-xs text-amber-300 font-bold mb-4">
          <span class="flex items-center gap-2">
            <span>🔒</span> Etapa Concluida y Aprobada (Solo Lectura) — Las asignaciones de la OT fueron confirmadas.
          </span>
          <span class="text-[10px] text-slate-400 font-normal">Para sustituciones por falla o adiciones de flota, utiliza el Panel de Excepciones en Sub-tab 5 Preparación de Salida.</span>
        </div>
        <div :class="{ 'pointer-events-none opacity-80': isAsignacionConfirmada }" class="bg-[#050810] border border-white/10 rounded-xl p-5 space-y-4">
          <div class="border-b border-white/10 pb-3 flex flex-wrap justify-between items-center gap-3">
            <div>
              <span class="text-sm font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-2">
                🚜 Pestaña C: Asignación de Recursos Técnicos & Humanos (OT)
              </span>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Asignación de flota principal, equipos de apoyo, tripulación y aparejos.
              </p>
            </div>
            <span class="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md font-mono font-bold uppercase">
              Requerimiento Aprobado
            </span>
          </div>

          <!-- Referencia a Inspecciones Visita a Terreno (Diseño Compacto UX) -->
          <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-4 space-y-3 pointer-events-auto">
            <div class="flex justify-between items-center border-b border-blue-500/20 pb-2">
              <h4 class="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📋 Referencia: Última Visita a Terreno & Levantamiento</span>
              </h4>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded font-mono font-bold">
                  {{ visitasDelProyecto.length }} Inspección(es)
                </span>
                <button v-if="visitasDelProyecto.length > 1" @click="mostrarHistorialVisitasModal = !mostrarHistorialVisitasModal" type="button" class="text-[10px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded font-bold transition-colors flex items-center gap-1 cursor-pointer pointer-events-auto">
                  <span>📜 {{ mostrarHistorialVisitasModal ? 'Ocultar Historial' : 'Ver Historial Anterior (' + (visitasDelProyecto.length - 1) + ')' }}</span>
                </button>
              </div>
            </div>
            
            <!-- Última Visita Destacada (Compacta & Fina) -->
            <div v-if="visitasDelProyecto.length > 0" class="space-y-2">
              <div class="bg-[#050810] p-3 rounded-lg border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div class="flex items-center gap-3">
                  <span class="text-lg">📋</span>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-white text-xs">Visita #{{ visitasDelProyecto[0].id_survey }}</span>
                      <span class="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded font-bold uppercase">
                        {{ visitasDelProyecto[0].estado_srv || 'Realizada' }}
                      </span>
                    </div>
                    <span class="text-[11px] text-slate-400 font-medium block truncate max-w-xs">{{ visitasDelProyecto[0].body_exec?.nombre_obra || visitasDelProyecto[0].body_exec?.obra_nombre || siteVisit.obra_nombre || 'Obra Terreno' }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-3 ml-auto">
                  <span class="text-[11px] text-slate-300 font-mono bg-white/5 px-2 py-1 rounded border border-white/5">
                    📅 {{ visitasDelProyecto[0].fecha_plan_ini ? new Date(visitasDelProyecto[0].fecha_plan_ini).toLocaleDateString() : 'S/F' }}
                  </span>
                  <a :href="getSurveyReportUrl(visitasDelProyecto[0].id_survey)" target="_blank" class="bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 font-bold px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1 no-underline cursor-pointer pointer-events-auto">
                    <span>👁️ Ver Web</span>
                  </a>
                  <a :href="getArchivoUrl(visitasDelProyecto[0].id_doc || visitasDelProyecto[0].id_survey)" target="_blank" class="inline-flex items-center bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 font-bold px-3 py-1.5 text-xs rounded transition-colors gap-1 no-underline cursor-pointer pointer-events-auto">
                    <span>📄 Ver Reporte / PDF</span>
                  </a>
                </div>
              </div>

              <!-- Historial de Visitas Anteriores (Desplegable Acordeón) -->
              <div v-if="mostrarHistorialVisitasModal" class="space-y-1.5 pt-2 border-t border-white/5 pointer-events-auto">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Inspecciones Previas Anteriores:</span>
                <div v-for="v in visitasDelProyecto.slice(1)" :key="'st3-v-'+v.id_survey" class="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5 text-xs hover:bg-white/[0.02] transition-colors">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-200">Visita #{{ v.id_survey }}</span>
                    <span class="text-[9px] text-slate-400 font-mono">({{ v.estado_srv || 'Realizada' }})</span>
                    <span class="text-[10px] text-slate-400"> - {{ v.body_exec?.nombre_obra || v.body_exec?.obra_nombre || 'Obra' }}</span>
                  </div>
                  <div class="flex gap-2 items-center">
                    <span class="text-[10px] text-slate-400 font-mono">{{ v.fecha_plan_ini ? new Date(v.fecha_plan_ini).toLocaleDateString() : 'S/F' }}</span>
                    <a :href="getSurveyReportUrl(v.id_survey)" target="_blank" class="bg-amber-500/10 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 text-[10px] rounded border border-amber-500/20 transition-colors no-underline cursor-pointer pointer-events-auto">
                      Ver Web
                    </a>
                    <a :href="getArchivoUrl(v.id_doc || v.id_survey)" target="_blank" class="inline-flex items-center bg-blue-500/10 hover:bg-blue-500/30 text-blue-300 px-2 py-0.5 text-[10px] rounded border border-blue-500/20 transition-colors no-underline cursor-pointer pointer-events-auto">
                      Ver Reporte / PDF
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-slate-400 italic">
              Sin inspecciones previas registradas para este proyecto. Datos tomados del formulario base de preventa.
            </div>
          </div>

          <!-- Programación de Tiempos Planificados (Salida & Término) - UBICADO AL INICIO DE LA ASIGNACIÓN CON PROPAGACIÓN AUTOMÁTICA -->
          <div class="bg-[#0a0f1e] p-4 rounded-xl border border-white/10 space-y-3">
            <span class="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-2">
              ⏱️ Programación de Tiempos Planificados (Inicio Plan & Fin Plan General)
            </span>
            <p class="text-[10px] text-slate-400">
              Al modificar la Fecha de Salida Base o Fin de Servicio, se propaga automáticamente a todos los equipos y personas asignadas.
            </p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Fecha Salida Base (Inicio Plan) *</label>
                <input type="date" v-model="operacionesAssignment.fecha_salida_plan" @change="propagarFechasPlanificadas" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono [color-scheme:dark] focus:border-amber-500/50" />
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Hora Salida Base *</label>
                <input type="time" v-model="operacionesAssignment.hora_salida_plan" @change="marcarDirtyAsignacion" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono [color-scheme:dark] focus:border-amber-500/50" />
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Fecha Término Servicio (Fin Plan) *</label>
                <input type="date" v-model="operacionesAssignment.fecha_fin_plan" @change="propagarFechasPlanificadas" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono [color-scheme:dark] focus:border-amber-500/50" />
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Hora Término Servicio *</label>
                <input type="time" v-model="operacionesAssignment.hora_fin_plan" @change="marcarDirtyAsignacion" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono [color-scheme:dark] focus:border-amber-500/50" />
              </div>
            </div>
          </div>

          <!-- ASIGNACIÓN DE RECURSOS EN TABLA UNIFICADA DE ANCHO COMPLETO (3 COLUMNAS SIMÉTRICAS) -->
          <div class="bg-[#050810] border border-white/10 rounded-xl p-5 space-y-4">
            <div class="flex justify-between items-center border-b border-white/5 pb-3 flex-wrap gap-2">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                1. Estructurador de Asignación de Recursos
              </span>
              <div class="flex gap-2 items-center">
                <button @click="agregarEquipoAdicional" type="button" class="text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 px-2.5 py-1.5 rounded-lg font-bold transition-colors">
                  + Añadir Equipo Apoyo
                </button>
                <button @click="agregarTripulante" type="button" class="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg font-bold transition-colors">
                  + Añadir Tripulante
                </button>
              </div>
            </div>

            <!-- GRILLA DE ANCHO COMPLETO 3 COLUMNAS PROPORCIONALES (LIMPIA & SIN RUIDO VISUAL) -->
            <div class="border border-white/10 rounded-xl overflow-hidden bg-black/40">
              <table class="w-full text-left text-xs table-fixed border-collapse">
                <thead>
                  <tr class="bg-white/5 text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-white/10">
                    <th class="p-3 w-[30%]">Requerimiento Comercial</th>
                    <th class="p-3 w-[35%]">Recurso / Equipo Asignado Real</th>
                    <th class="p-3 w-[35%]">Ventana Operacional (Fechas Planificadas)</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- SECCIÓN DE EQUIPOS -->
                  <tr class="bg-[#080d1a] border-y border-white/10">
                    <td colspan="3" class="px-3 py-2 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      EQUIPOS (PRINCIPALES Y APOYO)
                    </td>
                  </tr>

                  <template v-for="(line, idx) in linesValidas" :key="idx">
                    <tr class="hover:bg-white/[0.03] transition-colors">
                      <!-- Columna 1: Requerimiento Comercial -->
                      <td class="p-3 align-middle">
                        <div class="font-bold text-white text-xs">{{ line.descripcion || line.subcategoria || 'Equipo de Servicio' }}</div>
                        <div class="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{{ line.tipo }}</span>
                          <span>•</span>
                          <span>{{ line.cantidad }} {{ line.unidad }}</span>
                          <span class="text-amber-400 font-mono font-bold pl-1">{{ formatCurrency(line.cantidad * (line.valorUnitario || 0)) }}</span>
                        </div>
                      </td>

                      <!-- Columna 2: Selector de Equipo -->
                      <td class="p-3 align-middle">
                        <div class="flex items-center gap-2">
                          <select v-model="line.equipo_asignado_id" @change="marcarDirtyAsignacion" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500/50">
                            <option value="">-- Seleccionar Equipo Principal --</option>
                            <option v-for="eq in listaEquiposMaster" :key="eq.id_equipo || eq.patente" :value="eq.id_equipo || eq.patente">
                              {{ eq.patente || 'S/P' }} - {{ eq.nombre_equipo || eq.tipo }}
                            </option>
                          </select>

                          <div class="flex-shrink-0">
                            <span v-if="line.equipo_asignado_id && getSemaforoEquipo(line.equipo_asignado_id) === 'GREEN'" class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-[9px] font-bold">🟢 VIG</span>
                            <span v-else-if="line.equipo_asignado_id && getSemaforoEquipo(line.equipo_asignado_id) === 'YELLOW'" class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded text-[9px] font-bold">🟡 VENC</span>
                            <span v-else-if="line.equipo_asignado_id" class="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1 rounded text-[9px] font-bold">🔴 VENC</span>
                          </div>
                        </div>
                      </td>

                      <!-- Columna 3: Fechas Planificadas -->
                      <td class="p-3 align-middle">
                        <div class="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span class="text-slate-400 block font-semibold mb-0.5">Inicio Plan:</span>
                            <input type="date" v-model="line.fecha_plan_ini" @change="marcarDirtyAsignacion" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-white font-mono [color-scheme:dark]" />
                          </div>
                          <div>
                            <span class="text-slate-400 block font-semibold mb-0.5">Fin Plan:</span>
                            <input type="date" v-model="line.fecha_plan_fin" @change="marcarDirtyAsignacion" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-white font-mono [color-scheme:dark]" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>

                  <!-- Equipos Extra de Apoyo -->
                  <template v-if="operacionesAssignment.equipos_extra && operacionesAssignment.equipos_extra.length > 0">
                    <tr class="bg-[#080d1a] border-y border-white/10">
                      <td colspan="3" class="px-3 py-2 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                        🚜 Equipos Extra de Apoyo Operacional
                      </td>
                    </tr>
                    <tr v-for="(eqEx, idx) in operacionesAssignment.equipos_extra" :key="'eqex-'+idx" class="hover:bg-white/[0.03] transition-colors">
                      <td class="p-3 align-middle">
                        <span class="text-xs font-bold text-blue-300">Transporte / Escolta / Apoyo</span>
                      </td>
                      <td class="p-3 align-middle">
                        <select v-model="operacionesAssignment.equipos_extra[idx]" @change="marcarDirtyAsignacion" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500/50">
                          <option value="">-- Seleccionar Equipo de Apoyo / Camión / Escolta --</option>
                          <option v-for="eq in listaEquiposMaster" :key="'add-'+(eq.id_equipo||eq.patente)" :value="eq.id_equipo || eq.patente">
                            {{ eq.patente || 'S/P' }} - {{ eq.nombre_equipo || eq.tipo }}
                          </option>
                        </select>
                      </td>
                      <td class="p-3 align-middle">
                        <div class="flex items-center justify-between gap-2">
                          <div class="text-[10px] text-slate-400">Equipo de Apoyo Operacional</div>
                          <button @click="operacionesAssignment.equipos_extra.splice(idx, 1); marcarDirtyAsignacion()" class="text-slate-500 hover:text-red-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </template>

                  <!-- SECCIÓN DE TRIPULACIÓN / PERSONAL -->
                  <tr class="bg-[#080d1a] border-y border-white/10">
                    <td colspan="3" class="px-3 py-2 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      👷 TRIPULACIÓN / PERSONAL
                    </td>
                  </tr>

                  <template v-if="tripulacionAsignada && tripulacionAsignada.length > 0">
                    <tr v-for="(t, idx) in tripulacionAsignada" :key="'trip-'+idx" class="hover:bg-white/[0.03] transition-colors">
                      <td class="p-3 align-middle">
                        <select v-model="t.cargo" @change="marcarDirtyAsignacion" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white">
                          <option value="Operador Grúa">Operador Grúa</option>
                          <option value="Operador Camión Pluma">Operador Camión Pluma</option>
                          <option value="Rigger / Señalero">Rigger / Señalero</option>
                          <option value="Chofer Cama Baja">Chofer Cama Baja</option>
                          <option value="Escolta / Guía">Escolta / Guía</option>
                          <option value="Supervisor Faena">Supervisor Faena</option>
                        </select>
                      </td>
                      <td class="p-3 align-middle">
                        <div class="flex items-center gap-2">
                          <select v-model="t.id_user" @change="actualizarSemaforoTripulante(t); marcarDirtyAsignacion()" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none">
                            <option value="">-- Seleccionar Persona --</option>
                            <option v-for="u in usuarios" :key="u.id_user" :value="u.id_user">
                              {{ u.nombre_user || u.name_user }}
                            </option>
                          </select>
                          <div class="flex-shrink-0">
                            <span v-if="t.semaforo === 'GREEN'" class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-[9px] font-bold">🟢 VIG</span>
                            <span v-else-if="t.semaforo === 'YELLOW'" class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded text-[9px] font-bold">🟡 VENC</span>
                            <span v-else class="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1 rounded text-[9px] font-bold">🔴 VENC</span>
                          </div>
                        </div>
                      </td>
                      <td class="p-3 align-middle">
                        <div class="flex items-center justify-between gap-2">
                          <div class="grid grid-cols-2 gap-2 text-[10px] flex-1">
                            <div>
                              <span class="text-slate-400 block font-semibold mb-0.5">Inicio Plan:</span>
                              <input type="date" v-model="t.fecha_plan_ini" @change="marcarDirtyAsignacion" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-white font-mono [color-scheme:dark]" />
                            </div>
                            <div>
                              <span class="text-slate-400 block font-semibold mb-0.5">Fin Plan:</span>
                              <input type="date" v-model="t.fecha_plan_fin" @change="marcarDirtyAsignacion" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-white font-mono [color-scheme:dark]" />
                            </div>
                          </div>
                          <button @click="eliminarTripulante(idx); marcarDirtyAsignacion()" class="text-slate-500 hover:text-red-400 pl-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Aparejos & Implementos JSONB (Precargados por defecto desde Visita a Terreno en Grilla 3 Columnas) -->
          <div class="bg-[#0a0f1e] p-4 rounded-xl border border-white/10 space-y-3 shadow-inner">
            <div class="flex justify-between items-center border-b border-white/5 pb-2">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                ⛓️ Confirmación de Aparejos de Izaje (Desde Visita a Terreno)
              </span>
              <span class="text-[9px] text-slate-400 bg-white/5 px-2 py-0.5 rounded font-mono">Levantamiento Base: aparejos_solicitados_json</span>
            </div>

            <!-- Grilla Limpia 3 Columnas -->
            <div v-if="operacionesAssignment.implementos_survey && operacionesAssignment.implementos_survey.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              <div v-for="item in operacionesAssignment.implementos_survey" :key="item.id" class="p-2.5 bg-[#050810] rounded-lg border transition-all duration-200" :class="item.requerido ? 'border-amber-500/40 bg-amber-500/[0.03]' : 'border-white/5 opacity-70 hover:opacity-100'">
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <label class="flex items-center gap-2 text-xs font-bold cursor-pointer select-none" :class="item.requerido ? 'text-amber-300' : 'text-slate-300'">
                    <input type="checkbox" v-model="item.requerido" class="accent-amber-500 w-4 h-4 rounded" />
                    <span>{{ item.label }}</span>
                  </label>
                  <span v-if="item.requerido" class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">REQUERIDO</span>
                </div>
                <div>
                  <input type="text" v-model="item.detalle" placeholder="Capacidad / Cantidad / Largo..." class="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-amber-500/50" />
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-slate-400 italic">
              No se encontraron datos de implementos en la visita a terreno. (Asegúrate de cargar los datos del survey).
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
                      <span class="font-bold text-white truncate">{{ getNombreEquipoAsignado(eqId) }}</span>
                      <span class="text-slate-400 font-mono text-[10px] flex-shrink-0">PPU: {{ getPatenteEquipoAsignado(eqId) }}</span>
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
                  <button @click="reiniciarInspeccionesPatio" type="button" class="text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1" title="Limpiar inspecciones creadas para volver a asignarlas">
                    🧹 Limpiar
                  </button>
                  <button @click="sincronizarInspeccionesPWA" type="button" :disabled="sincronizandoInspecciones" class="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1">
                    <span v-if="sincronizandoInspecciones" class="animate-spin">🔄</span>
                    <span v-else>🔄 Sync Terreno</span>
                  </button>
                </div>
              </div>

              <!-- Lista de Tarjetas de Inspección por Equipo (Auto-adaptable con max-h-[65vh]) -->
              <div class="space-y-3 flex-1 overflow-y-auto max-h-[65vh] pr-1">
                <div v-for="eqId in equiposAsignadosLista" :key="'insp-eq-'+eqId" class="bg-[#050810] p-3 rounded-xl border border-white/10 space-y-3">
                  <div class="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span class="font-bold text-white truncate flex items-center gap-1.5">
                      <span>🚜</span>
                      {{ getNombreEquipoAsignado(eqId) }}
                    </span>
                    <span class="text-slate-400 font-mono text-[10px] bg-white/5 px-1.5 py-0.5 rounded">
                      PPU: {{ getPatenteEquipoAsignado(eqId) }}
                    </span>
                  </div>

                  <div class="space-y-2 text-xs">
                    <div>
                      <label class="block text-[10px] text-slate-400 font-semibold mb-1">Jefe de Patio Asignado *</label>
                      <select v-model="getInspeccionEquipo(eqId).jefe_patio_id" :disabled="getInspeccionEquipo(eqId).patio_checklist_completado" class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none">
                        <option value="">-- Seleccionar Jefe de Patio --</option>
                        <option v-for="u in usuariosEnroladosFes" :key="u.id_user" :value="u.id_user">
                          {{ u.nombre_user || u.name_frst }} ({{ u.email }})
                        </option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-[10px] text-slate-400 font-semibold mb-1">Fecha & Hora Programada *</label>
                      <div class="grid grid-cols-2 gap-2">
                        <input type="date" v-model="getInspeccionEquipo(eqId).fecha_inspeccion_plan" :disabled="getInspeccionEquipo(eqId).patio_checklist_completado" class="bg-[#0a0f1e] border border-white/10 rounded-lg px-2 py-1 text-xs text-white [color-scheme:dark]" />
                        <input type="time" v-model="getInspeccionEquipo(eqId).hora_inspeccion_plan" :disabled="getInspeccionEquipo(eqId).patio_checklist_completado" class="bg-[#0a0f1e] border border-white/10 rounded-lg px-2 py-1 text-xs text-white [color-scheme:dark]" />
                      </div>
                    </div>
                  </div>

                  <!-- Acreditación Delta & Excepciones de Patio -->
                  <div class="space-y-2 pt-1 border-t border-white/5">
                    <div class="flex justify-between items-center bg-[#0a0f1e] px-2.5 py-1.5 rounded-lg border border-white/5 text-[10px]">
                      <span class="text-slate-400 font-medium">Acreditación Delta:</span>
                      <span :class="evaluarAcreditacionDeltaEquipo(eqId).isOk ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'">
                        {{ evaluarAcreditacionDeltaEquipo(eqId).isOk ? '🟢 Express (Documentos OK)' : '🔴 Pendiente (' + evaluarAcreditacionDeltaEquipo(eqId).missingCount + ' Faltante/s)' }}
                      </span>
                    </div>

                    <div class="flex gap-2">
                      <button @click="abrirModalExcepcionEquipo(eqId)" type="button" class="w-full py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1">
                        <span>🔄 Sustituir por Falla Técnica</span>
                      </button>
                    </div>
                  </div>

                  <!-- Estado del Survey para este equipo -->
                  <div v-if="!getInspeccionEquipo(eqId)?.patio_programado" class="space-y-2">
                    <div class="bg-[#0a0f1e] p-2 rounded text-center border border-white/5 text-[11px] text-slate-400">
                      🔴 Inspección pendiente de agendamiento
                    </div>
                    <button 
                      @click="programarInspeccionPatioEquipo(eqId)" 
                      :disabled="!evaluarAcreditacionDeltaEquipo(eqId).isOk"
                      :title="!evaluarAcreditacionDeltaEquipo(eqId).isOk ? '🔒 Complete la Acreditación Delta del equipo antes de agendar la inspección' : ''"
                      class="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg text-xs uppercase transition-all shadow"
                    >
                      🚀 Asignar Inspección
                    </button>
                  </div>

                  <div v-else-if="!getInspeccionEquipo(eqId)?.patio_checklist_completado" class="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30 space-y-2 text-xs">
                    <div class="flex justify-between items-center">
                      <span class="font-bold text-amber-400">🟡 Inspección Asignada a Terreno</span>
                      <span class="text-[10px] text-slate-300">Asignado: {{ (usuariosEnroladosFes || []).find(u => u && u.id_user === getInspeccionEquipo(eqId)?.jefe_patio_id)?.nombre_user || 'Jefe Patio' }}</span>
                    </div>
                    <div class="flex gap-2">
                      <button @click="confirmarInspeccionSalidaPatioEquipo(eqId)" class="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs uppercase shadow">
                        Confirmar Inspección 🟢
                      </button>
                      <button @click="abrirVisorWeb(getInspeccionEquipo(eqId).id_survey || 76)" class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs flex items-center gap-1">
                        👁️ Ver Inspección
                      </button>
                    </div>
                  </div>

                  <div v-else class="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/30 flex justify-between items-center text-xs">
                    <div>
                      <span class="font-bold text-emerald-300 block">🟢 Inspección Conforme</span>
                      <span class="text-[10px] text-slate-400 block">Checklist & Contrapesos OK</span>
                    </div>
                    <button @click="abrirVisorWeb(getInspeccionEquipo(eqId).id_survey || 76)" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center gap-1">
                      👁️ Ver Inspección
                    </button>
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
    </div>

    <!-- Main Grid (Comercial / Preventa) -->
    <div v-if="topTab === 'comercial'" class="grid grid-cols-1 lg:grid-cols-[1.5fr_3.5fr] gap-6 flex-1 min-h-0 w-full overflow-hidden">
      
      <!-- LEFT: CLIENTE & VERSION -->
      <div class="bg-[#050810] border border-white/10 rounded-xl p-5 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
        <fieldset :disabled="faseActual >= ESTADOS_PROCESO.VALIDACION_DIFF" class="space-y-6 border-0 p-0 m-0 disabled:opacity-100 disabled:text-slate-200">
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
                <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Nombre Contacto:</label>
                <input type="text" v-model="opportunity.contacto_nombre" placeholder="Nombre solicitante..." class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white" :readonly="!!opportunity.contacto_obj" />
              </div>
              <div>
                <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Teléfono Contacto:</label>
                <input type="text" v-model="opportunity.contacto_telefono" placeholder="Ej: +569..." class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white" :readonly="!!opportunity.contacto_obj" />
              </div>
            </div>
          </div>
          
          <div v-else class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Nombre Contacto:</label>
              <input type="text" v-model="opportunity.contacto_nombre" placeholder="Seleccione un cliente primero..." class="w-full bg-[#0a0f1e]/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white" disabled />
            </div>
            <div>
              <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Teléfono Contacto:</label>
              <input type="text" v-model="opportunity.contacto_telefono" placeholder="Seleccione un cliente primero..." class="w-full bg-[#0a0f1e]/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white" disabled />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Tipo de Pago:</label>
              <select v-model="opportunity.tipo_pago" class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white">
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
                <option value="cheque">Cheque</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <div class="flex items-center gap-2 mt-5">
              <input type="checkbox" v-model="opportunity.requiere_oc_hes" id="left_oc" class="accent-amber-500" />
              <label for="left_oc" class="text-xs text-slate-300 cursor-pointer select-none">Requiere OC / HES</label>
            </div>
          </div>

          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <input type="checkbox" v-model="opportunity.requiere_acreditacion" id="left_acred" class="accent-amber-500" />
              <label for="left_acred" class="text-xs text-slate-300 cursor-pointer font-semibold select-none">Requiere Acreditación (Detalle al Ganar)</label>
            </div>
          </div>

          <div>
            <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Descripción del Proyecto / Faena:</label>
            <textarea v-model="opportunity.descripcion" rows="3" placeholder="Ej. Montaje Reactores Planta, detalles operativos..." class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-3 text-xs focus:border-amber-500 outline-none text-white resize-none"></textarea>
          </div>

          <div>
            <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Categoría de Servicio:</label>
            <select v-model="opportunity.familia_servicio" class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white transition-colors">
              <option value="Grúas Telescópicas">1. Grúas Telescópicas</option>
              <option value="Camiones Pluma">2. Camiones Pluma</option>
              <option value="Grúas Horquillas">3. Grúas Horquillas</option>
              <option value="Camiones con rampla">4. Camiones con rampla</option>
              <option value="Manipuladores Telescópicos">5. Manipuladores Telescópicos</option>
              <option value="Plataformas articuladas">6. Plataformas articuladas</option>
              <option value="Plataformas Tijeras">7. Plataformas Tijeras</option>
              <option value="Plataformas Telescópicas">8. Plataformas Telescópicas</option>
              <option value="Servicios de personal acreditado">9. Servicios de personal acreditado</option>
            </select>
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
            <fieldset :disabled="faseActual >= ESTADOS_PROCESO.VALIDACION_DIFF" class="border-0 p-0 m-0 disabled:opacity-100 disabled:text-slate-200 block w-full">
          
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
            
            <div class="flex-1 border border-white/5 rounded-lg overflow-hidden bg-black/20 overflow-y-auto scrollbar-hide">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-white/5 border-b border-white/5 text-slate-400 font-bold uppercase text-[9px] tracking-wide">
                    <th class="p-3">Categoría</th>
                    <th class="p-3 w-40">Subcategoría</th>
                    <th class="p-3">Descripción / Equipo</th>
                    <th class="p-3 text-center w-16">Cant.</th>
                    <th class="p-3 w-28">Unidad de cobro</th>
                    <th class="p-3 text-right w-28">Valor Unit.</th>
                    <th class="p-3 text-right w-28">Subtotal</th>
                    <th class="p-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr v-for="(line, idx) in lines" :key="idx" class="hover:bg-white/[0.02]">
                    <td class="p-2">
                      <select v-model="line.tipo" @change="line.subcategoria = ''" class="bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none w-32">
                        <option value="">-- Tipo --</option>
                        <option v-for="cat in dbCategories" :key="cat.id_categoria" :value="cat.nombre_categoria">
                          {{ cat.nombre_categoria }}
                        </option>
                      </select>
                    </td>
                    <td class="p-2">
                      <select v-model="line.subcategoria" class="bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none w-full">
                        <option value="">-- Seleccionar --</option>
                        <option v-for="sub in getSubcategoriesForType(line.tipo)" :key="sub.id_subcategoria" :value="sub.nombre_subcategoria">
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
                        <option value="Hrs día">Hrs día (Mínimas Diarias)</option>
                        <option value="Hrs Mensual">Hrs Mensual (Mínimas Mensuales)</option>
                        <option value="Fijo">Fijo (Servicio Puntual)</option>
                        <option value="Flete">Flete (Traslado/Movilización)</option>
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
                    <label class="block text-[10px] text-slate-400 font-semibold mb-1">Nombre de la Obra</label>
                    <input type="text" v-model="siteVisit.obra_nombre" placeholder="Ej: Celulosa Laja Reactor" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white" />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-[10px] text-slate-400 font-semibold mb-1">Dirección de la Obra</label>
                    <input type="text" v-model="siteVisit.obra_direccion" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white" />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-[10px] text-slate-400 font-semibold mb-1">Ciudad de la Obra</label>
                    <input type="text" v-model="siteVisit.obra_ciudad" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white" />
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
                    <select v-model="emailCoordinadorSeleccionado" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white">
                      <option value="" disabled class="bg-[#0a0f1e] text-white">-- Seleccionar Coordinador --</option>
                      <option v-for="u in usuarios" :key="u.id_user" :value="u.email || u.correo || u.username" class="bg-[#0a0f1e] text-white">
                        {{ u.nombre_user || u.name_user || u.username }} ({{ u.email || u.correo || u.username }})
                      </option>
                    </select>
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
                        <button @click="() => { selectedSurveyId = v.id_survey; siteVisit.visita_terreno = true; cargarVisitaDesdeBD(); }" type="button" class="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 font-bold px-2 py-1 text-[10px] rounded transition-colors" title="Cargar datos de esta visita al formulario">
                          Cargar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" v-model="siteVisit.visita_terreno" id="visita_check" class="accent-amber-500" />
                  <label for="visita_check" class="text-xs text-slate-300 cursor-pointer">Se ejecutó Visita a Terreno (Registrar datos aquí)</label>
                </div>
                <div v-if="siteVisit.visita_terreno" class="bg-[#0a0f1e] border border-dashed border-white/15 rounded-lg p-3 space-y-2">
                  <div class="flex justify-between items-center">
                    <label class="text-[10px] text-amber-500 font-bold uppercase">🔌 Importar Visita</label>
                  </div>
                  <div class="flex gap-2">
                    <select v-model="selectedSurveyId" class="flex-1 bg-[#050810] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none">
                      <option value="">-- Seleccionar Visita --</option>
                      <option v-for="s in visitasTerreno" :key="s.id_survey" :value="s.id_survey">
                        Obra: {{ s.body_exec?.nombre_obra || s.body_exec?.obra_nombre || 'Visita #' + s.id_survey }} - {{ s.fecha_plan_ini ? new Date(s.fecha_plan_ini).toLocaleDateString() : 'S/F' }}
                      </option>
                    </select>
                    <a v-if="selectedSurveyId" :href="getSurveyReportUrl(selectedSurveyId)" target="_blank" class="bg-[#0a0f1e] hover:bg-white/5 border border-white/10 text-white font-bold px-3 py-1.5 text-xs rounded transition-colors no-underline flex items-center justify-center" title="Visualizar detalles de la visita en Web">
                      Ver Web
                    </a>
                    <a v-if="selectedSurveyId" :href="getArchivoUrl(selectedSurveyDocId || selectedSurveyId)" target="_blank" class="inline-flex items-center bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-bold px-3 py-1.5 text-xs rounded transition-colors no-underline" title="Visualizar reporte PDF firmado">
                      Ver Reporte / PDF
                    </a>
                    <button @click="cargarVisitaDesdeBD" type="button" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 text-xs rounded transition-colors" :disabled="!selectedSurveyId">
                      Importar
                    </button>
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

              <!-- PROYECCIÓN DE COSTOS DE PENSIONES (ALOJAMIENTO, ALIMENTACIÓN, TRASLADO) -->
              <div class="col-span-2 mt-2 bg-white/[0.02] border border-white/10 rounded-lg p-3.5 space-y-3">
                <div class="flex justify-between items-center border-b border-white/5 pb-2">
                  <span class="text-xs font-bold text-amber-500 uppercase tracking-wider block">
                    🏠 Proyección de Costos de Pensiones (Base para EDP)
                  </span>
                  <span class="text-[9px] text-slate-400">Relevante para devengado y estados de pago</span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <!-- Alojamiento -->
                  <div class="bg-[#0a0f1e] p-2.5 rounded border border-white/5 space-y-1.5">
                    <label class="block text-[10px] text-slate-300 font-bold uppercase">Alojamiento</label>
                    <select v-model="comercial.pensiones.alojamiento_costeado" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none">
                      <option value="CLIENTE">Costeado por Cliente</option>
                      <option value="SAN_PABLO">Costeado por San Pablo</option>
                      <option value="NA">No Aplica (N/A)</option>
                    </select>
                    <input type="number" v-model.number="comercial.pensiones.alojamiento_monto" placeholder="Valorización ($)" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-xs text-white text-right font-mono" />
                  </div>

                  <!-- Alimentación -->
                  <div class="bg-[#0a0f1e] p-2.5 rounded border border-white/5 space-y-1.5">
                    <label class="block text-[10px] text-slate-300 font-bold uppercase">Alimentación (D/A/C)</label>
                    <select v-model="comercial.pensiones.alimentacion_costeado" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none">
                      <option value="CLIENTE">Costeado por Cliente</option>
                      <option value="SAN_PABLO">Costeado por San Pablo</option>
                      <option value="NA">No Aplica (N/A)</option>
                    </select>
                    <input type="number" v-model.number="comercial.pensiones.alimentacion_monto" placeholder="Valorización ($)" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-xs text-white text-right font-mono" />
                  </div>

                  <!-- Traslado -->
                  <div class="bg-[#0a0f1e] p-2.5 rounded border border-white/5 space-y-1.5">
                    <label class="block text-[10px] text-slate-300 font-bold uppercase">Traslado Personal</label>
                    <select v-model="comercial.pensiones.traslado_costeado" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none">
                      <option value="CLIENTE">Costeado por Cliente</option>
                      <option value="SAN_PABLO">Costeado por San Pablo</option>
                      <option value="NA">No Aplica (N/A)</option>
                    </select>
                    <input type="number" v-model.number="comercial.pensiones.traslado_monto" placeholder="Valorización ($)" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-xs text-white text-right font-mono" />
                  </div>
                </div>
              </div>

              <div class="col-span-2 mt-2">
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Cláusulas / Condiciones para el PDF:</label>
                <textarea v-model="comercial.condiciones_texto_pdf" rows="6" placeholder="Ingrese las condiciones adicionales que aparecerán en la propuesta comercial..." class="w-full bg-[#0a0f1e] border border-white/10 rounded p-2.5 text-xs text-white outline-none resize-none"></textarea>
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
            <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer" v-for="doc in ['Contrato', 'Anexo de obra', 'Anexo pacto horas extraordinarias', 'Cédula identidad', 'Licencia conducir', 'Certificado de antecedentes', 'Hoja vida conductor', 'Certificación', 'Examen ocupacional', 'examen psicosensotécnico', 'EPP', 'RIOHS', 'PTS', 'IRL', 'Registro de capacitación']" :key="'per-'+doc">
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
const router = useRouter()
import ModalNuevoCliente from '../../components/CRM/ModalNuevoCliente.vue'
import ModalEnviarCotizacion from '../../components/CRM/ModalEnviarCotizacion.vue'
import MapSelector from '../../components/CRM/MapSelector.vue'
import apiAxios from '../../services/api'
import VerSurveyModal from '../../components/VerSurveyModal.vue'

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
  requiere_oc_hes: false,
  requiere_acreditacion: false,
  acreditacion_docs: { empresa: [], equipos: [], personas: [] },
  id_proyecto_estado: null
})

const ESTADO_DB_OPERACIONES = 3

const ESTADOS_PROCESO = {
  COTIZACION: 10,
  PREP_COTIZACION: 20,
  VALIDACION_DIFF: 31,
  ASIGNACION_RECURSOS: 32,
  PREPARACION_PATIO: 33,
  DESPLAZAMIENTO: 40,
  NO_ASIGNADA: 60,
  EN_FAENA: 70,
  COMPLETADO: 80
}

const faseActual = computed(() => {
  const estado = opportunity.value?.id_proyecto_estado || 1;
  if (estado === ESTADO_DB_OPERACIONES) {
    if (operacionesSubTab.value === 'validacion') return ESTADOS_PROCESO.VALIDACION_DIFF;
    if (operacionesSubTab.value === 'asignacion') return ESTADOS_PROCESO.ASIGNACION_RECURSOS;
    if (operacionesSubTab.value === 'acreditaciones') return ESTADOS_PROCESO.ASIGNACION_RECURSOS;
    if (operacionesSubTab.value === 'preparacion_salida') return ESTADOS_PROCESO.PREPARACION_PATIO;
    return ESTADOS_PROCESO.VALIDACION_DIFF; // fallback
  }
  
  if (estado === 1) return ESTADOS_PROCESO.COTIZACION;
  if (estado === 2) return ESTADOS_PROCESO.PREP_COTIZACION;
  if (estado === 4 || estado === 5) return ESTADOS_PROCESO.DESPLAZAMIENTO;
  if (estado === 6) return ESTADOS_PROCESO.NO_ASIGNADA;
  return ESTADOS_PROCESO.COTIZACION;
})

const isAsignacionConfirmada = computed(() => {
  return asignacionConfirmada.value === true ||
    rawEjecucionJson.value?.asignacion_confirmada === true ||
    rawEjecucionJson.value?.subtab_activa === 'preparacion_salida' ||
    rawEjecucionJson.value?.subtab_maxima === 'preparacion_salida' ||
    Boolean(rawEjecucionJson.value?.preparacion_salida?.patio_programado)
})

const isRequerimientoAprobado = computed(() => {
  return requerimientoAprobado.value === true ||
    rawEjecucionJson.value?.decision === 'APROBADO' ||
    rawEjecucionJson.value?.estado_requerimiento === 'APROBADO' ||
    (opportunity.value?.id_proyecto_estado || 1) >= 3 ||
    isAsignacionConfirmada.value
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

    // Persistir personas en tpry_rel_persona en PostgreSQL (Spec 22)
    try {
      const fechaIniGbl = operacionesAssignment.value.fecha_salida_plan ? new Date(operacionesAssignment.value.fecha_salida_plan + 'T' + (operacionesAssignment.value.hora_salida_plan || '08:00')).toISOString() : new Date().toISOString()
      const fechaFinGbl = operacionesAssignment.value.fecha_fin_plan ? new Date(operacionesAssignment.value.fecha_fin_plan + 'T' + (operacionesAssignment.value.hora_fin_plan || '18:00')).toISOString() : new Date().toISOString()
      
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

    isDirtyAsignacion.value = false
    alert('💾 Cambios de Asignación guardados exitosamente en Base de Datos PostgreSQL.')
  } catch (err) {
    console.error('Error al guardar cambios de asignación:', err)
    alert('⚠️ Error al guardar cambios de asignación.')
  }
}

const listaEquiposMaster = ref([
  { id_equipo: 'CRN-01', nombre_equipo: 'Liebherr LTM 1220 (220 Ton)', patente: 'HW-8842', tipo: 'Grúa Telescópica', semaforo: 'GREEN', fecha_vencimiento_cert: '2026-08-10' },
  { id_equipo: 'CRN-02', nombre_equipo: 'Tadano ATF 110G (110 Ton)', patente: 'GR-1029', tipo: 'Grúa Telescópica', semaforo: 'GREEN', fecha_vencimiento_cert: '2029-01-01' },
  { id_equipo: 'CRN-03', nombre_equipo: 'Grove GMK 5250L (250 Ton)', patente: 'PL-9021', tipo: 'Grúa Telescópica', semaforo: 'YELLOW', fecha_vencimiento_cert: '2026-07-28' },
  { id_equipo: 'CAM-01', nombre_equipo: 'Camión Pluma Palfinger 50T', patente: 'PK-5002', tipo: 'Camión Pluma', semaforo: 'GREEN', fecha_vencimiento_cert: '2028-12-12' },
  { id_equipo: 'CAMA-01', nombre_equipo: 'Cama Baja 60 Toneladas', patente: 'XY-1234', tipo: 'Traslado', semaforo: 'GREEN', fecha_vencimiento_cert: '2026-08-01' },
  { id_equipo: 'LIV-03', nombre_equipo: 'Camioneta Escolta 4x4', patente: 'HG-5533', tipo: 'Vehículo Menor', semaforo: 'GREEN', fecha_vencimiento_cert: '2027-11-15' }
])

const isCertExpired = (dateString) => {
  if (!dateString) return false;
  const daysLeft = (new Date(dateString) - new Date()) / (1000 * 3600 * 24);
  return daysLeft < 30;
}

const getEquipoObj = (idOrPatente) => {
  return listaEquiposMaster.value.find(eq => eq.id_equipo === idOrPatente || eq.patente === idOrPatente);
}

const equiposApoyoMaster = computed(() => {
  return listaEquiposMaster.value.filter(eq => eq.tipo !== 'Grúa Telescópica' && !eq.nombre_equipo.toLowerCase().includes('grúa'));
})

const historialEnviousDossier = ref([])
const tieneDocumentosVencidosOPendientes = computed(() => false)

const linesValidas = computed(() => {
  if (!lines.value || !Array.isArray(lines.value)) return []
  return lines.value.filter(l => (l.descripcion && l.descripcion.trim() !== '') || (l.subcategoria && l.subcategoria.trim() !== '') || (l.valorUnitario > 0) || l.equipo_asignado_id)
})

const getNombreEquipoAsignado = (eqId) => {
  if (!eqId) return 'Grúa Principal GSP'
  const eq = listaEquiposMaster.value.find(e => e.id_equipo === eqId || e.patente === eqId)
  return eq ? (eq.nombre_equipo || eq.patente) : eqId
}

const getPatenteEquipoAsignado = (eqId) => {
  if (!eqId) return 'S/P'
  const eq = listaEquiposMaster.value.find(e => e.id_equipo === eqId || e.patente === eqId)
  return eq ? (eq.patente || 'S/P') : 'S/P'
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

const docStateRegistry = reactive({})
const docsVinculadosMap = ref({})

const markDocVigente = (docNombre, categoria) => {
  const dName = extractDocName(docNombre)
  const cat = (categoria || '').toLowerCase()
  const key1 = `${cat}_${dName.replace(/\s+/g, '_')}`
  const key2 = `${dName.replace(/\s+/g, '_')}`
  const compKey = cat === 'empresa' ? 'emp-' : (cat === 'equipos' ? 'eq-' : 'per-')

  docStateRegistry[key1] = true
  docStateRegistry[key2] = true
  docStateRegistry[compKey + dName] = true
  docStateRegistry[dName] = true
}

const getEntityPrefix = (categoria, entityObj) => {
  const cat = (categoria || '').toLowerCase()
  if (cat === 'personas') {
    const uId = entityObj?.id_user || (typeof entityObj === 'number' || typeof entityObj === 'string' ? entityObj : null)
    if (uId) return `per-${uId}-`
  } else if (cat === 'equipos') {
    const eqId = entityObj?.equipo_id || (typeof entityObj === 'number' || typeof entityObj === 'string' ? entityObj : null) || operacionesAssignment.value?.equipo_id
    if (eqId) return `eq-${eqId}-`
  }
  return ''
}

const checkDocVigente = (docNombre, categoria, entityObj = null) => {
  const dName = extractDocName(docNombre)
  if (!dName) return false
  const cat = (categoria || '').toLowerCase()
  const entityPrefix = getEntityPrefix(categoria, entityObj)
  const compKey = cat === 'empresa' ? 'emp-' : (cat === 'equipos' ? 'eq-' : 'per-')

  const scopedKey = entityPrefix ? `${entityPrefix}${dName}` : null
  const key1 = `${cat}_${dName.replace(/\s+/g, '_')}`
  const key2 = `${dName.replace(/\s+/g, '_')}`

  return (
    (scopedKey && !!docStateRegistry[scopedKey]) ||
    (scopedKey && !!docsVinculadosMap.value[scopedKey]) ||
    (scopedKey && !!opportunity.value?.docs_homologados?.[scopedKey]) ||
    (scopedKey && operacionesAssignment.value?.cumplimiento_acreditaciones?.[scopedKey] === 'OK') ||
    (!entityPrefix && (
      !!docStateRegistry[compKey + dName] ||
      !!docStateRegistry[key1] ||
      !!docStateRegistry[dName] ||
      !!docsVinculadosMap.value[compKey + dName] ||
      !!docsVinculadosMap.value[key1] ||
      !!docsVinculadosMap.value[dName] ||
      !!opportunity.value?.docs_homologados?.[compKey + dName] ||
      !!opportunity.value?.docs_homologados?.[key1] ||
      operacionesAssignment.value?.cumplimiento_acreditaciones?.[compKey + dName] === 'OK' ||
      operacionesAssignment.value?.cumplimiento_acreditaciones?.[dName] === 'OK'
    ))
  )
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
        try {
          const { data: certData } = await apiAxios.get(`/tequ-equipos/${eqId}/certificados`)
          const realCerts = Array.isArray(certData) ? certData : (certData?.certificados || certData?.data || [])
          if (realCerts.length > 0) {
            docs = realCerts.map(c => ({
              id_doc: c.id_doc || c.id_certificado,
              file_name: c.name_doc_interno || c.file_name || String(c.id_doc),
              nombre: `${c.nombre_tipo || c.name_doc_orig || c.nombre || dName} (ID: ${c.id_doc || c.id_certificado})`,
              fecha: c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString() : 'Vigente',
              codigo: c.estado_vigencia || 'VIGENTE'
            }))
          }
        } catch (e) {
          console.warn('Error cargando certificados equipo:', e)
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
        try {
          const { data: pRes } = await apiAxios.get(`/acreditacion/personal/${uId}`)
          const pDetail = pRes?.data || pRes
          const certs = pDetail?.certificados || (Array.isArray(pDetail) ? pDetail : [])
          if (certs && certs.length > 0) {
            docs = certs.map(c => ({
              id_doc: c.id_doc || c.id_certificado_persona,
              file_name: c.name_doc_interno || c.file_name || String(c.id_doc),
              nombre: `${c.nombre_tipo || c.name_doc_orig || dName} ${c.observaciones ? '- ' + c.observaciones : ''}`,
              fecha: c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString() : 'Vigente',
              codigo: c.estado_vigencia || 'VIGENTE'
            }))
          }
        } catch (e) {
          console.warn('Error cargando certificados personal:', e)
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
    return n.includes(q) || c.includes(q)
  })
})

const vincularDocumentoSeleccionado = (docObj) => {
  const rawDoc = modalVincularState.value.docName
  const docNombre = extractDocName(rawDoc)
  const categoria = (modalVincularState.value.categoria || '').toLowerCase()
  const entityObj = modalVincularState.value.entityObj

  markDocVigente(docNombre, categoria)

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
  
  if (opportunity.value) {
    if (!opportunity.value.docs_homologados) opportunity.value.docs_homologados = {}
    opportunity.value.docs_homologados[scopedKey] = payload
  }
  
  if (!operacionesAssignment.value) {
    operacionesAssignment.value = {}
  }
  if (!operacionesAssignment.value.cumplimiento_acreditaciones) {
    operacionesAssignment.value.cumplimiento_acreditaciones = {}
  }
  operacionesAssignment.value.cumplimiento_acreditaciones[scopedKey] = 'OK'
  operacionesAssignment.value.cumplimiento_acreditaciones = { ...operacionesAssignment.value.cumplimiento_acreditaciones }
  
  modalVincularState.value.show = false
}

const verDocumentoDossier = (rawDoc, categoria, entityObj = null) => {
  const docNombre = extractDocName(rawDoc)
  const cat = (categoria || '').toLowerCase()
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
  let targetUrl = docInfo?.url
  
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

const tripulacionAsignada = ref([
  { id_user: '', cargo: 'Operador Grúa', semaforo: 'GREEN' },
  { id_user: '', cargo: 'Rigger / Señalero', semaforo: 'GREEN' }
])

const agregarTripulante = () => {
  tripulacionAsignada.value.push({ id_user: '', cargo: 'Rigger / Señalero', semaforo: 'GREEN' })
}

const eliminarTripulante = (idx) => {
  if (tripulacionAsignada.value.length > 1) {
    tripulacionAsignada.value.splice(idx, 1)
  }
}

const agregarEquipoAdicional = () => {
  if (!operacionesAssignment.value.equipos_extra) {
    operacionesAssignment.value.equipos_extra = []
  }
  operacionesAssignment.value.equipos_extra.push('')
  marcarDirtyAsignacion()
}

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

const abrirModalGenerarRequerimiento = () => {
  if (!opportunity.value.rut_cliente) {
    alert('⚠️ Debe seleccionar un Cliente Mandante antes de Generar el Requerimiento.')
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

const hasDiff = (field, index = 0) => {
  // El control de cambios (diff) SOLO aplica en la Pestaña de Operaciones / Sub-Pestaña Validación & Diff
  if (topTab.value !== 'operaciones' || operacionesSubTab.value !== 'validacion') {
    return false
  }
  if (faseActual.value < ESTADOS_PROCESO.VALIDACION_DIFF) {
    return false
  }
  if (!snapshotComercial.value || Object.keys(snapshotComercial.value).length === 0) return false
  
  if (field === 'peso_carga') return !!snapshotComercial.value.peso_carga && (siteVisit.value.peso_carga || '') !== (snapshotComercial.value.peso_carga || '')
  if (field === 'radios_trabajo') return !!snapshotComercial.value.radios_trabajo && (siteVisit.value.radios_trabajo || '') !== (snapshotComercial.value.radios_trabajo || '')
  if (field === 'alturas_trabajo') return !!snapshotComercial.value.alturas_trabajo && (siteVisit.value.alturas_trabajo || '') !== (snapshotComercial.value.alturas_trabajo || '')
  if (field === 'tipo_carga') return !!snapshotComercial.value.tipo_carga && (siteVisit.value.tipo_carga || '') !== (snapshotComercial.value.tipo_carga || '')
  if (field === 'obra_nombre') return !!snapshotComercial.value.obra_nombre && (siteVisit.value.obra_nombre || '') !== (snapshotComercial.value.obra_nombre || '')
  if (field === 'obra_direccion') return !!snapshotComercial.value.obra_direccion && (siteVisit.value.obra_direccion || '') !== (snapshotComercial.value.obra_direccion || '')
  if (field === 'obra_ciudad') return !!snapshotComercial.value.obra_ciudad && (siteVisit.value.obra_ciudad || '') !== (snapshotComercial.value.obra_ciudad || '')
  if (field === 'volumen_carga') return !!snapshotComercial.value.volumen_carga && (siteVisit.value.volumen_carga || '') !== (snapshotComercial.value.volumen_carga || '')
  
  // Diff en Líneas del Estructurador (Tabla B)
  if (field === 'equipo_descripcion') {
    const orig = snapshotComercial.value.lines?.[index]?.descripcion || snapshotComercial.value.equipo_descripcion
    if (!orig) return false
    return (lines.value[index]?.descripcion || '') !== orig
  }
  if (field === 'equipo_cantidad') {
    const orig = snapshotComercial.value.lines?.[index]?.cantidad || snapshotComercial.value.equipo_cantidad
    if (orig === undefined) return false
    return (lines.value[index]?.cantidad || 1) !== orig
  }
  if (field === 'equipo_valor') {
    const orig = snapshotComercial.value.lines?.[index]?.valorUnitario !== undefined ? snapshotComercial.value.lines[index].valorUnitario : snapshotComercial.value.equipo_valor
    if (orig === undefined) return false
    return (lines.value[index]?.valorUnitario || 0) !== orig
  }
  if (field === 'equipo_tipo') {
    const orig = snapshotComercial.value.lines?.[index]?.tipo
    if (!orig) return false
    return (lines.value[index]?.tipo || '') !== orig
  }
  if (field === 'equipo_subcategoria') {
    const orig = snapshotComercial.value.lines?.[index]?.subcategoria
    if (!orig) return false
    return (lines.value[index]?.subcategoria || '') !== orig
  }
  if (field === 'equipo_unidad') {
    const orig = snapshotComercial.value.lines?.[index]?.unidad
    if (!orig) return false
    return (lines.value[index]?.unidad || '') !== orig
  }
  
  return false
}

const getOriginalValue = (field, index = 0) => {
  if (!snapshotComercial.value) return ''
  if (field === 'peso_carga') return snapshotComercial.value.peso_carga || ''
  if (field === 'radios_trabajo') return snapshotComercial.value.radios_trabajo || ''
  if (field === 'alturas_trabajo') return snapshotComercial.value.alturas_trabajo || ''
  if (field === 'tipo_carga') return snapshotComercial.value.tipo_carga || ''
  if (field === 'obra_nombre') return snapshotComercial.value.obra_nombre || ''
  if (field === 'obra_direccion') return snapshotComercial.value.obra_direccion || ''
  if (field === 'obra_ciudad') return snapshotComercial.value.obra_ciudad || ''
  if (field === 'volumen_carga') return snapshotComercial.value.volumen_carga || ''
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
  if (hasDiff('peso_carga')) count++
  if (hasDiff('radios_trabajo')) count++
  if (hasDiff('alturas_trabajo')) count++
  if (hasDiff('tipo_carga')) count++
  if (hasDiff('obra_nombre')) count++
  if (hasDiff('obra_direccion')) count++
  if (hasDiff('obra_ciudad')) count++
  if (hasDiff('volumen_carga')) count++
  
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
  implementos_survey: [
    { id: 'master_1', label: 'Cadenas', requerido: false, detalle: '' },
    { id: 'master_2', label: 'Estrobos', requerido: false, detalle: '' },
    { id: 'master_3', label: 'Pulpos', requerido: false, detalle: '' },
    { id: 'master_4', label: 'Grilletes', requerido: false, detalle: '' },
    { id: 'master_5', label: 'Balancines', requerido: false, detalle: '' },
    { id: 'master_6', label: 'Eslingas', requerido: false, detalle: '' },
    { id: 'master_7', label: 'Canastillos', requerido: false, detalle: '' }
  ]
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
const usuarios = ref([])
const cargandoVisita = ref(false)
const estadoAsignacion = ref(null)
const emailCoordinadorSeleccionado = ref('')

const dbCategories = ref([])
const fetchCategories = async () => {
  try {
    const { data } = await apiAxios.get('/tequ-equipos/categorias')
    let list = data?.data || []
    
    // Filtrar para que solo queden las categorías que están escritas en MAYÚSCULAS en la BD
    list = list.filter(c => c.nombre_categoria && c.nombre_categoria === c.nombre_categoria.toUpperCase())

    if (!list.some(c => c.nombre_categoria === 'TRASLADOS')) {
      list.push({
        id_categoria: 99,
        nombre_categoria: 'TRASLADOS',
        subcategories: [
          { id_subcategoria: 901, nombre_subcategoria: 'CAMA BAJA' },
          { id_subcategoria: 902, nombre_subcategoria: 'TRACTOR' },
          { id_subcategoria: 903, nombre_subcategoria: 'ESCOLTA / GUÍA' }
        ]
      })
    }
    if (!list.some(c => c.nombre_categoria === 'ACCESORIOS')) {
      list.push({
        id_categoria: 100,
        nombre_categoria: 'ACCESORIOS',
        subcategories: [
          { id_subcategoria: 1001, nombre_subcategoria: 'CANASTILLO' },
          { id_subcategoria: 1002, nombre_subcategoria: 'ESLINGAS' },
          { id_subcategoria: 1003, nombre_subcategoria: 'ESTROBOS' }
        ]
      })
    }
    if (!list.some(c => c.nombre_categoria === 'PERSONAL CERTIFICADO')) {
      list.push({
        id_categoria: 101,
        nombre_categoria: 'PERSONAL CERTIFICADO',
        subcategories: [
          { id_subcategoria: 2001, nombre_subcategoria: 'RIGGER' },
          { id_subcategoria: 2002, nombre_subcategoria: 'OPERADOR' },
          { id_subcategoria: 2003, nombre_subcategoria: 'PREVENCIONISTA' },
          { id_subcategoria: 2004, nombre_subcategoria: 'OTROS' }
        ]
      })
    }
    if (!list.some(c => c.nombre_categoria === 'OTROS')) {
      list.push({
        id_categoria: 102,
        nombre_categoria: 'OTROS',
        subcategories: [
          { id_subcategoria: 3001, nombre_subcategoria: 'OTROS' }
        ]
      })
    }
    dbCategories.value = list
  } catch (error) {
    console.error('Error fetching dynamic categories:', error)
    dbCategories.value = [
      { id_categoria: 1, nombre_categoria: 'GRÚA TELESCÓPICA', subcategories: [] },
      { id_categoria: 2, nombre_categoria: 'CAMIÓN PLUMA', subcategories: [] },
      { id_categoria: 3, nombre_categoria: 'TRASLADOS', subcategories: [{ id_subcategoria: 901, nombre_subcategoria: 'CAMA BAJA' }] },
      { id_categoria: 4, nombre_categoria: 'ACCESORIOS', subcategories: [{ id_subcategoria: 1001, nombre_subcategoria: 'CANASTILLO' }, { id_subcategoria: 1002, nombre_subcategoria: 'ESLINGAS' }, { id_subcategoria: 1003, nombre_subcategoria: 'ESTROBOS' }] },
      { id_categoria: 5, nombre_categoria: 'PERSONAL CERTIFICADO', subcategories: [{ id_subcategoria: 2001, nombre_subcategoria: 'RIGGER' }, { id_subcategoria: 2002, nombre_subcategoria: 'OPERADOR' }, { id_subcategoria: 2003, nombre_subcategoria: 'PREVENCIONISTA' }, { id_subcategoria: 2004, nombre_subcategoria: 'OTROS' }] },
      { id_categoria: 6, nombre_categoria: 'OTROS', subcategories: [{ id_subcategoria: 3001, nombre_subcategoria: 'OTROS' }] }
    ]
  }
}

const getSubcategoriesForType = (type) => {
  const category = dbCategories.value.find(c => c.nombre_categoria === type)
  return category ? category.subcategories : []
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

const lines = ref([
  { tipo: 'Equipo (Grúa)', subcategoria: '', descripcion: 'Grúas Liebherr LTM 1220 (220T)', cantidad: 1, unidad: 'Hrs día', valorUnitario: 500000 }
])

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

  if (tripulacionAsignada.value && Array.isArray(tripulacionAsignada.value)) {
    tripulacionAsignada.value.forEach(t => {
      if (ini) t.fecha_plan_ini = ini
      if (fin) t.fecha_plan_fin = fin
    })
  }
}

watch(() => operacionesAssignment.value?.fecha_salida_plan, (newVal) => {
  if (newVal) {
    if (lines.value && Array.isArray(lines.value)) {
      lines.value.forEach(l => { l.fecha_plan_ini = newVal })
    }
    if (tripulacionAsignada.value && Array.isArray(tripulacionAsignada.value)) {
      tripulacionAsignada.value.forEach(t => { t.fecha_plan_ini = newVal })
    }
    if (!isHydrating.value) marcarDirtyAsignacion()
  }
})

watch(() => operacionesAssignment.value?.fecha_fin_plan, (newVal) => {
  if (newVal) {
    if (lines.value && Array.isArray(lines.value)) {
      lines.value.forEach(l => { l.fecha_plan_fin = newVal })
    }
    if (tripulacionAsignada.value && Array.isArray(tripulacionAsignada.value)) {
      tripulacionAsignada.value.forEach(t => { t.fecha_plan_fin = newVal })
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
  visita_terreno: false
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
  if (!visita || !visita.body_exec) return []
  const body = visita.body_exec || {}
  const masterAparejos = ['Cadenas', 'Estrobos', 'Pulpos', 'Grilletes', 'Balancines', 'Eslingas', 'Canastillos']
  const result = masterAparejos.map((m, idx) => ({
    id: 'master_' + (idx + 1),
    label: m,
    requerido: false,
    detalle: ''
  }))

  const searchAttrs = (segList) => {
    if (!segList) return
    for (const seg of segList) {
      if (!seg.attributes) continue
      for (let i = 0; i < seg.attributes.length; i++) {
        const attr = seg.attributes[i]
        const labelStr = (attr.label || attr.values?.quest || '').toUpperCase()
        const foundItem = result.find(r => labelStr.includes(r.label.toUpperCase()))
        if (foundItem) {
          let val = attr.value !== undefined ? attr.value : (attr.default || attr.values?.selected || '')
          let det = ''
          if (i + 1 < seg.attributes.length && seg.attributes[i + 1].type === 'textField') {
            det = seg.attributes[i + 1].value !== undefined ? seg.attributes[i + 1].value : (seg.attributes[i + 1].default || '')
          }
          if (val === 'SI' || val === 'Si' || val === 'si' || (val && val !== 'NO' && val !== 'No' && val !== '0') || det) {
            foundItem.requerido = true
            foundItem.detalle = det || (typeof val === 'string' && val !== 'SI' && val !== 'Si' ? val : 'Requerido en Visita')
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

    // Sincronizar automáticamente aparejos de la última visita del proyecto
    if (visitasDelProyecto.value.length > 0) {
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

    // Extracción de Datos de Implementos (Inmutable si ya fue leído anteriormente)
    if (!operacionesAssignment.value.aparejos_bloqueados_survey) {
      const segImplementos = body.segmentos?.find(s => s.label && s.label.includes('DATOS DE IMPLEMENTOS'))
      if (segImplementos && segImplementos.attributes) {
        let implList = []
        let i = 0
        while (i < segImplementos.attributes.length) {
          const attr = segImplementos.attributes[i]
          if (attr.type === 'photoCheck' || attr.type === 'comboBox') {
            let req = ''
            let label = attr.label || ''
            if (attr.type === 'comboBox' && attr.values) {
              req = attr.values.selected || ''
              label = attr.values.quest || label
            } else {
              req = attr.default || ''
            }
            const implemento = {
              id: 'impl_' + i,
              label: label,
              requerido: (req === 'SI' || req === 'Si' || req === 'si'),
              detalle: ''
            }
            if (i + 1 < segImplementos.attributes.length) {
              const nextAttr = segImplementos.attributes[i + 1]
              if (nextAttr.type === 'textField') {
                implemento.detalle = nextAttr.value !== undefined ? nextAttr.value : (nextAttr.default || '')
                i++
              }
            }
            implList.push(implemento)
          }
          i++
        }
        if (implList.length > 0) {
          operacionesAssignment.value.implementos_survey = implList
          operacionesAssignment.value.aparejos_bloqueados_survey = true
        }
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
    alimentacion_costeado: 'SAN_PABLO',
    alimentacion_monto: 0,
    traslado_costeado: 'CLIENTE',
    traslado_monto: 0
  }
})

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
  lines.value.push({ tipo: 'Equipo (Grúa)', subcategoria: '', descripcion: '', cantidad: 1, unidad: 'Hrs día', valorUnitario: 0 })
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
  if (isDirty.value) {
    if (window.confirm('Tienes cambios sin guardar. ¿Estás seguro que deseas cancelar y perder tu progreso?')) {
      emit('close')
    }
  } else {
    emit('close')
  }
}

const cargarDatosCotizacion = async () => {
  let targetId = props.proyectoId
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
        if (p.id_proyecto_estado === ESTADO_DB_OPERACIONES) {
          topTab.value = 'operaciones'
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
          opportunity.value.requiere_oc_hes       = crm.requiere_oc_hes || false
          opportunity.value.requiere_acreditacion = crm.requiere_acreditacion || false
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
              return { ...l, unidad: mappedUnidad }
            })
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
          
          if (crm.coordenadas_mapa) {
            siteVisit.value.lat = crm.coordenadas_mapa.lat
            siteVisit.value.lng = crm.coordenadas_mapa.lng
          }
          
          comercial.value.validez_dias = crm.validez_dias || 15
          comercial.value.moneda = crm.moneda || 'CLP'
          comercial.value.condicion_servicio = crm.condicion_servicio || 'programado'
          if (crm.condiciones_pdf) {
            comercial.value.condiciones_texto_pdf = crm.condiciones_pdf
          }

          // Carga / Inicialización Garantizada de snapshotComercial para el motor de Diff
          if (crm.snapshot_comercial && Object.keys(crm.snapshot_comercial).length > 0) {
            snapshotComercial.value = JSON.parse(JSON.stringify(crm.snapshot_comercial))
          } else {
            snapshotComercial.value = JSON.parse(JSON.stringify({
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
              equipo_valor: lines.value[0]?.valorUnitario || 0
            }))
          }
        }

        // Mapear json_field.ejecucion_v1 si existe
        const ejecucion = jsonField?.ejecucion_v1
        if (ejecucion) {
          rawEjecucionJson.value = { ...ejecucion }
          
          if (ejecucion.asignacion_confirmada || ejecucion.subtab_activa === 'preparacion_salida' || ejecucion.preparacion_salida?.patio_programado) {
            asignacionConfirmada.value = true
          }

          if (ejecucion.decision === 'APROBADO' || ejecucion.decision === 'APROBADO_CON_OBS' || ejecucion.estado_requerimiento === 'APROBADO' || p.id_proyecto_estado >= 3 || asignacionConfirmada.value) {
            requerimientoAprobado.value = true
            topTab.value = 'operaciones'
          }

          if (props.initialSubTab) {
            topTab.value = 'operaciones'
            operacionesSubTab.value = props.initialSubTab
          } else if (ejecucion.subtab_actual_view) {
            operacionesSubTab.value = ejecucion.subtab_actual_view
          } else if (ejecucion.subtab_activa) {
            operacionesSubTab.value = ejecucion.subtab_activa
          } else if (asignacionConfirmada.value) {
            operacionesSubTab.value = 'preparacion_salida'
          } else if (requerimientoAprobado.value) {
            operacionesSubTab.value = 'asignacion'
          }

          if (ejecucion.observaciones) {
            operacionesAssignment.value.observaciones_operaciones = ejecucion.observaciones
          }
          if (ejecucion.equipo_id) operacionesAssignment.value.equipo_id = ejecucion.equipo_id
          if (ejecucion.operador_id) operacionesAssignment.value.operador_id = ejecucion.operador_id
          if (ejecucion.rigger_id) operacionesAssignment.value.rigger_id = ejecucion.rigger_id
          if (ejecucion.chofer_id) operacionesAssignment.value.chofer_id = ejecucion.chofer_id
          if (Array.isArray(ejecucion.tripulacion_asignada) && ejecucion.tripulacion_asignada.length > 0) {
            tripulacionAsignada.value = ejecucion.tripulacion_asignada
          }
          if (ejecucion.equipos_extra) operacionesAssignment.value.equipos_extra = ejecucion.equipos_extra
          if (ejecucion.fecha_salida_plan) operacionesAssignment.value.fecha_salida_plan = ejecucion.fecha_salida_plan
          if (ejecucion.hora_salida_plan) operacionesAssignment.value.hora_salida_plan = ejecucion.hora_salida_plan
          if (ejecucion.fecha_fin_plan) operacionesAssignment.value.fecha_fin_plan = ejecucion.fecha_fin_plan
          if (ejecucion.hora_fin_plan) operacionesAssignment.value.hora_fin_plan = ejecucion.hora_fin_plan
          if (ejecucion.aparejos_asignados_json) operacionesAssignment.value.aparejos = ejecucion.aparejos_asignados_json
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
              personas: ['Contrato', 'Cédula identidad', 'Licencia conducir']
            }
          }
          
          if (ejecucion.preparacion_salida) {
            preparacionSalidaState.value = { ...preparacionSalidaState.value, ...ejecucion.preparacion_salida }
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
      }
    } catch (e) {
      console.error('Error al cargar proyecto:', e)
    }
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
  cargarDatosCotizacion()
})

watch(() => props.proyectoId, (newId) => {
  if (newId) {
    cargarDatosCotizacion()
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

const SUBTAB_RANK = { 'validacion': 1, 'asignacion': 2, 'acreditaciones': 3, 'preparacion_salida': 4 }

const cambiarYPersistirSubTab = async (subtabName) => {
  topTab.value = 'operaciones'
  operacionesSubTab.value = subtabName
  console.log('🔄 Cambiando a SubTab Operaciones:', subtabName, '| topTab:', topTab.value)
  if (!rawEjecucionJson.value) rawEjecucionJson.value = {}
  
  rawEjecucionJson.value.subtab_actual_view = subtabName

  const currentRank = SUBTAB_RANK[rawEjecucionJson.value.subtab_activa] || 1
  const newRank = SUBTAB_RANK[subtabName] || 1

  // Solo avanzar la etapa macro si el nuevo tab es de una fase superior
  if (newRank > currentRank) {
    rawEjecucionJson.value.subtab_activa = subtabName
  }

  if (!opportunity.value.json_field) opportunity.value.json_field = {}
  if (!opportunity.value.json_field.ejecucion_v1) opportunity.value.json_field.ejecucion_v1 = {}
  
  opportunity.value.json_field.ejecucion_v1.subtab_actual_view = subtabName
  if (newRank > currentRank) {
    opportunity.value.json_field.ejecucion_v1.subtab_activa = subtabName
  }
  
  const projectId = props.proyectoId || currentProyectoId.value
  if (projectId) {
    try {
      const token = localStorage.getItem('token') || ''
      const payload = buildPayload()
      await apiAxios.put(`/proyectos/${projectId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log(`✅ Subtab visualizada: ${subtabName}, Etapa macro retenida en: ${rawEjecucionJson.value.subtab_activa}`)
    } catch (e) {
      console.warn('Error al guardar subtab en PostgreSQL:', e)
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
        contacto_nombre:       opportunity.value.contacto_nombre,
        contacto_telefono:     opportunity.value.contacto_telefono,
        contacto_obj:          opportunity.value.contacto_obj,
        tipo_pago:             opportunity.value.tipo_pago,
        requiere_oc_hes:       opportunity.value.requiere_oc_hes,
        requiere_acreditacion: opportunity.value.requiere_acreditacion,
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
        snapshot_comercial: snapshotComercial.value
      },
      ejecucion_v1: {
        ...(rawEjecucionJson.value || {}),
        ...(opportunity.value.json_field?.ejecucion_v1 || {}),
        subtab_activa: rawEjecucionJson.value?.subtab_activa || opportunity.value.json_field?.ejecucion_v1?.subtab_activa || operacionesSubTab.value,
        traza_correos: trazaCorreosList.value,
        preparacion_salida: preparacionSalidaState.value,
        equipo_id: operacionesAssignment.value.equipo_id,
        equipos_extra: operacionesAssignment.value.equipos_extra,
        operador_id: operacionesAssignment.value.operador_id,
        rigger_id: operacionesAssignment.value.rigger_id,
        chofer_id: operacionesAssignment.value.chofer_id,
        tripulacion_asignada: tripulacionAsignada.value,
        fecha_salida_plan: operacionesAssignment.value.fecha_salida_plan,
        hora_salida_plan: operacionesAssignment.value.hora_salida_plan,
        fecha_fin_plan: operacionesAssignment.value.fecha_fin_plan,
        hora_fin_plan: operacionesAssignment.value.hora_fin_plan,
        observaciones: operacionesAssignment.value.observaciones_operaciones,
        cumplimiento_acreditaciones: operacionesAssignment.value.cumplimiento_acreditaciones
      }
    }
  }
}

const guardarEnPreventa = async () => {
  if (!opportunity.value.rut_cliente) {
    alert('Debe seleccionar un cliente mandante.')
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
  if (!opportunity.value.rut_cliente) {
    alert('⚠️ Debe seleccionar un Cliente Mandante antes de Generar el Requerimiento.')
    return
  }
  if (!siteVisit.value.obra_nombre && !siteVisit.value.obra_direccion) {
    alert('⚠️ Debe ingresar al menos el Nombre o Dirección de la Obra en la pestaña "Datos Servicio & Visita".')
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
    
    // Asignar "DESDE" por defecto desde la Pestaña B (Fecha Tentativa)
    if (!operacionesAssignment.value.fecha_salida_plan && opportunity.value?.fecha_tentativa) {
      operacionesAssignment.value.fecha_salida_plan = opportunity.value.fecha_tentativa
      operacionesAssignment.value.fecha_fin_plan = opportunity.value.fecha_tentativa
    }
    
    // Guardar avance en borrador
    const payload = buildPayload()
    payload.json_field.ejecucion_v1 = {
      ...(payload.json_field?.ejecucion_v1 || {}),
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

  // 1. Equipos asignados en las líneas del estructurador comercial (Sub-tab 3)
  if (Array.isArray(linesValidas.value)) {
    linesValidas.value.forEach(l => {
      const eqId = l.equipo_asignado_id || l.equipo_id
      if (eqId && eqId !== 'CRN-DEFAULT' && !list.includes(eqId)) {
        list.push(eqId)
      }
    })
  }

  // 2. Equipo principal de operacionesAssignment
  const primaryId = operacionesAssignment.value?.equipo_id
  if (primaryId && primaryId !== 'CRN-DEFAULT' && !list.includes(primaryId)) {
    list.push(primaryId)
  }

  // 3. Equipos extra de apoyo
  if (Array.isArray(operacionesAssignment.value?.equipos_extra)) {
    operacionesAssignment.value.equipos_extra.forEach(eqId => {
      if (eqId && eqId !== 'CRN-DEFAULT' && !list.includes(eqId)) {
        list.push(eqId)
      }
    })
  }

  if (list.length === 0 && primaryId) {
    list.push(primaryId)
  }

  return list.length > 0 ? list : ['CRN-DEFAULT']
})

const getInspeccionEquipo = (eqId) => {
  if (!preparacionSalidaState.value) {
    preparacionSalidaState.value = {}
  }
  if (!preparacionSalidaState.value.inspecciones_patio) {
    preparacionSalidaState.value.inspecciones_patio = {}
  }
  if (!preparacionSalidaState.value.inspecciones_patio[eqId]) {
    preparacionSalidaState.value.inspecciones_patio[eqId] = {
      patio_programado: preparacionSalidaState.value.patio_programado || false,
      jefe_patio_id: preparacionSalidaState.value.jefe_patio_id || null,
      fecha_inspeccion_plan: preparacionSalidaState.value.fecha_inspeccion_plan || new Date().toISOString().substring(0, 10),
      hora_inspeccion_plan: preparacionSalidaState.value.hora_inspeccion_plan || '07:30',
      patio_checklist_completado: preparacionSalidaState.value.patio_checklist_completado || false,
      patio_requiere_taller: preparacionSalidaState.value.patio_requiere_taller || false
    }
  }
  return preparacionSalidaState.value.inspecciones_patio[eqId]
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
    const allCompletado = states.every(s => s?.patio_checklist_completado)
    if (allCompletado) {
      if (states.some(s => s?.patio_requiere_taller)) return 'RED'
      return 'GREEN'
    }
    const someProgramado = states.some(s => s?.patio_programado || s?.patio_checklist_completado)
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
      if (ejec?.preparacion_salida) {
        preparacionSalidaState.value = {
          ...preparacionSalidaState.value,
          ...ejec.preparacion_salida
        }
      }
    }
  } catch (err) {
    console.warn('Error sincronizando inspecciones PWA:', err)
  } finally {
    setTimeout(() => {
      sincronizandoInspecciones.value = false
    }, 400)
  }
}

let autoPollTimer = null
watch(() => operacionesSubTab.value, (newTab) => {
  if (newTab === 'preparacion_salida') {
    if (!autoPollTimer) {
      autoPollTimer = setInterval(() => {
        sincronizarInspeccionesPWA()
      }, 15000)
    }
  } else {
    if (autoPollTimer) {
      clearInterval(autoPollTimer)
      autoPollTimer = null
    }
  }
}, { immediate: true })

const confirmarAsignacionOT = async () => {
  try {
    const token = localStorage.getItem('token') || ''
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    
    asignacionConfirmada.value = true
    operacionesSubTab.value = 'preparacion_salida'
    
    const payload = buildPayload()
    payload.json_field.ejecucion_v1 = {
      ...(payload.json_field?.ejecucion_v1 || {}),
      asignacion_confirmada: true,
      equipo_id: operacionesAssignment.value.equipo_id === 'CRN-DEFAULT' ? (lines.value[0]?.descripcion || 'Equipo Estructurador') : operacionesAssignment.value.equipo_id,
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
      aparejos_asignados_json: operacionesAssignment.value.aparejos,
      preparacion_salida: preparacionSalidaState.value
    }
    
    const projectId = props.proyectoId || currentProyectoId.value
    payload.id_proyecto_estado = ESTADO_DB_OPERACIONES
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
        { id_user: operacionesAssignment.value.rigger_id, cargo: 'Rigger / Señalero' },
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
      const equiposLista = (linesValidas.value || []).map(l => ({
        id_equipo: l.equipo_asignado_id,
        rol: 'Equipo Principal',
        f_ini: l.fecha_plan_ini,
        f_fin: l.fecha_plan_fin
      }))
      
      if (operacionesAssignment.value.equipo_id && !equiposLista.some(e => e.id_equipo === operacionesAssignment.value.equipo_id)) {
        equiposLista.push({ id_equipo: operacionesAssignment.value.equipo_id, rol: 'Grúa Principal', f_ini: null, f_fin: null })
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

const programarInspeccionPatioEquipo = async (eqId) => {
  if (!preparacionSalidaState.value.cc_notificado) {
    alert('⚠️ Paso 2 es secuencial de Paso 1. Debe notificar a Control de Calidad (Paso 1) antes de programar la Inspección de Patio.')
    return
  }
  const ins = getInspeccionEquipo(eqId)
  if (!ins.jefe_patio_id) {
    alert('⚠️ Por favor seleccione el Jefe de Patio asignado para este equipo.')
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

    // Inyectar datos de la máquina y cliente en el bodySeed
    bodySeed.id_equipo = eqId
    bodySeed.equipo_nombre = eqNombre
    bodySeed.equipo_ppu = eqPpu
    bodySeed.id_proyecto = parseInt(projectId)
    bodySeed.id_empresa_cliente = parseInt(empClienteId)
    bodySeed.identificador_formal = antecedentes.value.identificador_formal || 'OT'

    const fechaPlan = ins.fecha_inspeccion_plan ? `${ins.fecha_inspeccion_plan}T${ins.hora_inspeccion_plan || '07:30'}:00` : new Date().toISOString()

    const srvPayload = {
      id_template: 76,
      id_flow_tmpl: idFlowTmpl,
      id_tipo_srv: 1,
      id_user: parseInt(ins.jefe_patio_id),
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
    id_survey: createdSurveyId || ins.id_survey || null,
    id_template: 76,
    codi_template_srv: 'TMPL-GSP-CHK-EQUIPOS',
    name_template_srv: 'Check List Entrada y Salida Equipos',
    patio_programado: true
  }

  preparacionSalidaState.value.inspecciones_patio = { ...preparacionSalidaState.value.inspecciones_patio }
  preparacionSalidaState.value.patio_programado = true

  const jefeUser = usuariosEnroladosFes.value.find(u => u.id_user === ins.jefe_patio_id)
  registrarTrazaCorreo(
    'JEFE_PATIO_PWA',
    jefeUser?.email || 'jefe_patio@leanglobal.cl',
    `🚜 Inspección Asignada (${eqNombre}): ${antecedentes.value.identificador_formal || 'COT'}`,
    `Template 76 (TMPL-GSP-CHK-EQUIPOS) programado para ${ins.fecha_inspeccion_plan} a las ${ins.hora_inspeccion_plan} hrs. Survey ID: #${createdSurveyId || 'Asignado'}`
  )

  const payload = buildPayload()
  await apiAxios.put(`/proyectos/${projectId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  alert(`🟢 Inspección de Patio #${createdSurveyId || ''} creada y asignada exitosamente para ${eqNombre}.\n\nHaz clic en "👁️ Ver Inspección" para abrir el visor.`)
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
  if (!opportunity.value.rut_cliente) {
    alert('Debe seleccionar un cliente mandante antes de generar la cotización.')
    return
  }
  
  generandoPDF.value = true
  
  try {
    let projectId = props.proyectoId || currentProyectoId.value
    
    // Si es un proyecto nuevo no registrado, lo registramos automáticamente primero
    if (!projectId) {
      const token = localStorage.getItem('token') || ''
      const payload = buildPayload()
      const { data } = await apiAxios.post('/proyectos/preventa', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      projectId = data.proyecto.id_proyecto
      currentProyectoId.value = projectId
      console.log('Proyecto auto-guardado para cotización. ID:', projectId)
    }
    
    // Llamar al endpoint del backend para generar la versión (Firma FES desactivada temporalmente)
    const token = localStorage.getItem('token') || ''
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
    const coordinador = usuarios.value.find(u => (u.email || u.correo || u.username) === emailCoordinadorSeleccionado.value);
    
    await apiAxios.post(`/visitas/solicitar/${currentProyectoId.value}`, {
      email_coordinador: emailCoordinadorSeleccionado.value,
      id_coordinador: coordinador ? coordinador.id_user : null
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
    
    // Forzar estado 6 ("Cotización No Asignada") y meter los datos correspondientes en json_field
    payload.id_proyecto_estado = 6
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
    payload.id_proyecto_estado = 2
    opportunity.value.id_proyecto_estado = 2
    if (payload.json_field?.crm_v1) {
      payload.json_field.crm_v1.razon_no_asignada = null
      payload.json_field.crm_v1.observacion_no_asignada = null
    }
    payload.id_user_modificacion = currentUser.id_user || null

    await apiAxios.put(`/proyectos/${projectId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    isDirty.value = false
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
    
    // Cambiar a estado 2 ("Preparación de Cotización")
    payload.id_proyecto_estado = 2
    opportunity.value.id_proyecto_estado = 2
    payload.id_user_modificacion = currentUser.id_user || null

    await apiAxios.put(`/proyectos/${projectId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    isDirty.value = false
    alert('Cotización devuelta a "Preparación de Cotización" exitosamente.')
    emit('creada', { id: projectId }) // Emitir evento para refrescar la Torre
    emit('close')
  } catch (error) {
    console.error('Error al devolver a cotizar:', error)
    alert('Error al devolver la cotización a cotizar.')
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
