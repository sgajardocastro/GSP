<template>
  <div class="h-full flex flex-col space-y-6 text-left">
    <!-- Header -->
    <div class="flex justify-between items-end flex-shrink-0">
      <div>
        <h2 class="text-xl font-extrabold text-white">
          {{ opportunity.id_proyecto_estado === 3 ? 'Requerimiento & Preparación de Operaciones' : 'Gestor de Oportunidades & Cotizaciones' }}
          <span v-if="antecedentes.identificador_formal" class="text-amber-500 font-mono text-base ml-2">[{{ antecedentes.identificador_formal }}]</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          {{ opportunity.id_proyecto_estado === 3 ? 'Revisión técnica de antecedentes, auditoría de modificaciones y asignación de flota.' : 'Estructuración B2B de requerimientos de izaje y logística.' }}
        </p>
      </div>
      <div class="flex gap-2">
        <button @click="handleCancelar" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors">
          Cancelar
        </button>
        <button v-if="opportunity.id_proyecto_estado === 3" @click="volverACotizar" class="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"></path></svg>
          <span>Devolver a Comercial</span>
        </button>
        <button v-if="opportunity.id_proyecto_estado === 6" @click="restaurarACotizar" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.75 8.25v.75M21 9h-6"></path></svg>
          <span>Restaurar a Cotizar</span>
        </button>
        <button v-if="opportunity.id_proyecto_estado !== 3 && (props.proyectoId || currentProyectoId) && opportunity.id_proyecto_estado !== 6" @click="abrirModalNoAsignada" class="px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
          <span>No Ganada</span>
        </button>
        <button v-if="opportunity.id_proyecto_estado !== 3" @click="enviarCotizacionPorCorreo" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          <span>Enviar por Correo</span>
        </button>
        <button v-if="opportunity.id_proyecto_estado !== 3" @click="generarPDF" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span>Generar PDF</span>
        </button>
        <button v-if="opportunity.id_proyecto_estado !== 3" @click="guardarEnPreventa" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center gap-1">
          <span>Guardar en Preventa</span>
        </button>
        <button v-if="opportunity.id_proyecto_estado !== 3" @click="generarRequerimiento" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest transition-colors shadow-lg shadow-amber-500/10 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span>Generar Requerimiento</span>
        </button>
      </div>
    </div>

    <!-- Barra de Tabs Vuetify Style Unificada -->
    <div v-if="opportunity.id_proyecto_estado === 3" class="flex border-b border-white/10 bg-[#080d1a] px-2 pt-2 flex-shrink-0 transition-all duration-200 gap-4">
      <button 
        @click="topTab = 'comercial'" 
        :class="topTab === 'comercial' ? 'text-amber-400 border-b-2 border-amber-500 font-bold' : 'text-slate-400 hover:text-white'" 
        class="py-2.5 px-4 text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        <span>1. Preventa (Comercial - Consulta Readonly)</span>
      </button>

      <button 
        @click="topTab = 'operaciones'; operacionesSubTab = 'validacion'" 
        :class="topTab === 'operaciones' && operacionesSubTab === 'validacion' ? 'text-amber-400 border-b-2 border-amber-500 font-bold' : 'text-slate-400 hover:text-white'" 
        class="py-2.5 px-4 text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>2. Validación & Diff (Pestañas A + B Unificadas)</span>
      </button>

      <button 
        @click="topTab = 'operaciones'; operacionesSubTab = 'asignacion'" 
        :disabled="!requerimientoAprobado"
        :class="[
          topTab === 'operaciones' && operacionesSubTab === 'asignacion' ? 'text-emerald-400 border-b-2 border-emerald-500 font-bold' : 'text-slate-400 hover:text-white',
          !requerimientoAprobado ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        ]" 
        class="py-2.5 px-4 text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 outline-none"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        <span>3. Asignación de Recursos OT (Pestaña C)</span>
        <span v-if="!requerimientoAprobado" class="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono ml-1">(Requiere Aprobación)</span>
      </button>
    </div>

    <!-- OPERACIONES WORKSPACE (Diff, Aprobación & Asignación OT) -->
    <div v-if="topTab === 'operaciones' && opportunity.id_proyecto_estado === 3" class="flex-1 min-h-0 overflow-y-auto space-y-6 scrollbar-hide">
      
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Columna Izquierda: Pestaña A (Datos Servicio & Visita con MAPA Completo) -->
          <div class="bg-[#050810] border border-white/10 rounded-xl p-5 space-y-4">
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
          </div>

          <!-- Columna Derecha: Pestaña B (Estructurador de Servicios IDÉNTICO A PREVENTA) -->
          <div class="bg-[#050810] border border-white/10 rounded-xl p-5 space-y-4 flex flex-col">
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
                        <option value="Hrs">Hrs</option>
                        <option value="Días">Días</option>
                        <option value="Semanas">Semanas</option>
                        <option value="Meses">Meses</option>
                        <option value="Fijo">Fijo</option>
                        <option value="Flete">Flete</option>
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
              <textarea v-model="operacionesAssignment.observaciones_operaciones" rows="2" placeholder="Detalle observaciones o razones de modificación..." class="w-full bg-[#0a0f1e] border border-white/10 rounded p-2 text-xs text-white outline-none resize-none"></textarea>
            </div>

            <div class="pt-2">
              <button 
                @click="aprobarYGenerarOT" 
                class="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span>Aprobar Requerimiento & Habilitar Asignación OT</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SUB-TAB 2: PESTAÑA C - ASIGNACIÓN DE RECURSOS (OT) (HABILITADA CONDICIONALMENTE TRAS APROBACIÓN) -->
      <div v-if="operacionesSubTab === 'asignacion'" class="space-y-6">
        <div class="bg-[#050810] border border-white/10 rounded-xl p-5 space-y-4">
          <div class="border-b border-white/5 pb-2 flex justify-between items-center">
            <div>
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                🚜 Pestaña C: Asignación de Recursos Técnicos & Humanos (OT)
              </span>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Carga por defecto el equipo ajustado en el Estructurador (Pestaña B): <strong class="text-amber-400 font-mono">{{ lines[0]?.descripcion || 'Grúa Liebherr LTM 1220' }}</strong>
              </p>
            </div>
            <span class="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
              Requerimiento Aprobado
            </span>
          </div>

          <!-- Referencia a Visita a Terreno -->
          <div class="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg mb-4 flex items-start gap-3">
            <div class="mt-1"><svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
            <div>
              <h4 class="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">📋 Referencia: Visita a Terreno</h4>
              <p class="text-[11px] text-slate-300 mb-1">
                <strong class="text-white">Equipo Solicitado Inicialmente:</strong> {{ siteVisit.equipo_sugerido || 'No especificado' }} 
                | <strong class="text-white">Carga:</strong> {{ siteVisit.peso_carga || 0 }}T 
                | <strong class="text-white">Radio:</strong> {{ siteVisit.radio_trabajo || 0 }}m
              </p>
              <p class="text-[10px] text-slate-400">
                <em v-if="siteVisit.observaciones">"{{ siteVisit.observaciones }}"</em>
                <em v-else>Sin observaciones adicionales de terreno.</em>
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="lg:col-span-2">
              <label class="block text-[11px] text-slate-400 font-semibold mb-1">Seleccionar Equipo Principal Asignado *</label>
              <select v-model="operacionesAssignment.equipo_id" class="w-full bg-[#0a0f1e] border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white outline-none">
                <option value="CRN-DEFAULT">[{{ lines[0]?.descripcion || 'EQUIPO ESTRUCTURADOR' }}] - Selección Sugerida</option>
                <option value="CRN-01">Liebherr LTM 1220 (220 Ton) - Patente HW-8842 [OPERATIVA]</option>
                <option value="CRN-02">Tadano ATF 110G (110 Ton) - Patente GR-1029 [OPERATIVA]</option>
                <option value="CRN-03">Grove GMK 5250L (250 Ton) - Patente PL-9021 [MANTENCION]</option>
              </select>
            </div>
            
            <div class="lg:col-span-2">
              <label class="block text-[11px] text-slate-400 font-semibold mb-1">Equipos Adicionales / Apoyo a Maniobra</label>
              <div class="flex gap-2">
                <select v-model="operacionesAssignment.equipo_adicional" class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none">
                  <option value="">-- Sin equipo adicional --</option>
                  <option value="CAM-01">Camión Pluma - PK 50002 [OPERATIVO]</option>
                  <option value="CAMA-01">Cama Baja - Patente XY-1234 [OPERATIVA]</option>
                  <option value="CRN-04">Grúa RT 50T - Patente RT-5566 [OPERATIVA]</option>
                </select>
                <button type="button" @click="if(operacionesAssignment.equipo_adicional) { if(!operacionesAssignment.equipos_extra) operacionesAssignment.equipos_extra = []; operacionesAssignment.equipos_extra.push(operacionesAssignment.equipo_adicional); operacionesAssignment.equipo_adicional = ''; }" class="bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-500/30 transition-colors">+</button>
              </div>
              <div v-if="operacionesAssignment.equipos_extra?.length > 0" class="mt-2 flex flex-wrap gap-1">
                <span v-for="(eq, idx) in operacionesAssignment.equipos_extra" :key="idx" class="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                  {{ eq }}
                  <button @click="operacionesAssignment.equipos_extra.splice(idx, 1)" class="hover:text-white">&times;</button>
                </span>
              </div>
            </div>

            <div>
              <label class="block text-[11px] text-slate-400 font-semibold mb-1">Operador Principal *</label>
              <select v-model="operacionesAssignment.operador_id" class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none">
                <option value="OP-101">Juan Pérez (Lic. A4 - Acreditación VIGENTE)</option>
                <option value="OP-102">Roberto Soto (Lic. A4 - Acreditación VIGENTE)</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] text-slate-400 font-semibold mb-1">Rigger Asignado</label>
              <select v-model="operacionesAssignment.rigger_id" class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none">
                <option value="RIG-201">Gonzalo Parra (Rigger RII)</option>
                <option value="RIG-202">Claudio Muñoz (Rigger RI)</option>
              </select>
            </div>
          </div>

          <!-- Programación de Tiempos Planificados (Salida & Término) -->
          <div class="bg-[#0a0f1e] p-4 rounded-lg border border-white/5 space-y-3">
            <span class="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">
              ⏱️ Programación de Tiempos Planificados (Inicio Plan & Fin Plan)
            </span>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Fecha Salida Base (Inicio Plan) *</label>
                <input type="date" v-model="operacionesAssignment.fecha_salida_plan" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono [color-scheme:dark]" />
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Hora Salida Base *</label>
                <input type="time" v-model="operacionesAssignment.hora_salida_plan" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono [color-scheme:dark]" />
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Fecha Término Servicio (Fin Plan) *</label>
                <input type="date" v-model="operacionesAssignment.fecha_fin_plan" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono [color-scheme:dark]" />
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 font-semibold mb-1">Hora Término Servicio *</label>
                <input type="time" v-model="operacionesAssignment.hora_fin_plan" class="w-full bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono [color-scheme:dark]" />
              </div>
            </div>
          </div>

          <!-- Aparejos & Implementos JSONB (Precargados por defecto desde Visita a Terreno) -->
          <div class="bg-[#0a0f1e] p-4 rounded-lg border border-white/5 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">
                ⛓️ Confirmación de Aparejos de Izaje (Precargados desde Visita a Terreno)
              </span>
              <span class="text-[9px] text-slate-400">Levantamiento Base: aparejos_solicitados_json</span>
            </div>
            <div class="flex flex-wrap gap-6 text-xs">
              <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input type="checkbox" v-model="operacionesAssignment.aparejos.eslingas_10t" class="accent-amber-500" />
                <span>Eslingas Sintéticas 10T (Cant: 4)</span>
              </label>
              <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input type="checkbox" v-model="operacionesAssignment.aparejos.grilletes_12t" class="accent-amber-500" />
                <span>Grilletes Lira 12T (Cant: 4)</span>
              </label>
              <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input type="checkbox" v-model="operacionesAssignment.aparejos.pulpo_cadena" class="accent-amber-500" />
                <span>Pulpo Cadena Grado 80 15T (Cant: 1)</span>
              </label>
            </div>
          </div>

          <div class="pt-2">
            <button 
              @click="confirmarAsignacionOT" 
              class="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Confirmar Asignación OT & Notificar (sgajardoc@gmail.com)</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Grid (Comercial / Preventa) -->
    <div v-show="topTab === 'comercial' || opportunity.id_proyecto_estado !== 3" class="grid grid-cols-1 lg:grid-cols-[1.5fr_3.5fr] gap-6 flex-1 min-h-0 overflow-hidden">
      
      <!-- LEFT: CLIENTE & VERSION -->
      <div class="bg-[#050810] border border-white/10 rounded-xl p-5 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
        <fieldset :disabled="opportunity.id_proyecto_estado === 3" class="contents">
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

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Nombre Contacto:</label>
              <input type="text" v-model="opportunity.contacto_nombre" placeholder="Nombre solicitante..." class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white" />
            </div>
            <div>
              <label class="text-[11px] text-slate-400 font-semibold block mb-1.5">Teléfono Contacto:</label>
              <input type="text" v-model="opportunity.contacto_telefono" placeholder="Ej: +569..." class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white" />
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
              <label for="left_acred" class="text-xs text-slate-300 cursor-pointer font-semibold select-none">Requiere Acreditación</label>
            </div>
            <input v-if="opportunity.requiere_acreditacion" type="text" v-model="opportunity.acreditacion_docs" placeholder="Ej: F30, F30-1, Cert. Médico..." class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white transition-colors" />
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

          <!-- VERSION CONTROL (MOVIDO AQUÍ) -->
          <div class="space-y-4 mt-2">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">
              2. Control de Versiones
            </div>
            <div class="flex flex-col gap-2">
              <div v-for="(v, i) in cotizaciones_historicas" :key="i" class="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex justify-between items-center w-full">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <span class="px-1.5 py-0.5 bg-white/5 text-slate-400 border border-white/5 text-[9px] font-bold rounded flex-shrink-0">v{{ v.version }}</span>
                  <span class="text-[10px] text-amber-500 font-bold font-mono flex-shrink-0">{{ formatCurrency(v.monto) }}</span>
                  <span class="text-[9px] text-slate-500 flex-shrink-0">{{ new Date(v.fecha).toLocaleString() }}</span>
                </div>
                <a :href="'https://servidor.leanglobal.cl' + v.url" target="_blank" class="text-[9px] px-2 py-1 bg-slate-800 hover:bg-slate-700 hover:text-amber-400 text-slate-300 rounded font-bold transition-all no-underline">
                  PDF
                </a>
              </div>
              <div v-if="cotizaciones_historicas.length === 0" class="text-[10px] text-slate-500 italic">No hay versiones previas.</div>
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
        <fieldset :disabled="opportunity.id_proyecto_estado === 3" class="flex-1 min-h-0 overflow-y-auto p-5 scrollbar-hide border-0 m-0">
          
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
                        <option value="Hrs">Hrs</option>
                        <option value="Días">Días</option>
                        <option value="Semanas">Semanas</option>
                        <option value="Meses">Meses</option>
                        <option value="Fijo">Fijo</option>
                        <option value="Flete">Flete</option>
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
                    <div class="text-xs font-bold text-white uppercase tracking-wider">Programar Visita a Terreno</div>
                    <p class="text-[10px] text-slate-400 mt-0.5">Asigna fecha y responsable. El ID de proyecto se vinculará automáticamente.</p>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[10px] text-slate-400 font-semibold mb-1">Responsable Técnico</label>
                      <select v-model="formVisita.id_user_responsable" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white">
                        <option value="" class="bg-[#0a0f1e] text-white">-- Seleccionar --</option>
                        <option v-for="u in usuarios" :key="u.id_user" :value="u.id_user" class="bg-[#0a0f1e] text-white">
                          {{ u.nombre_user || u.name_user || u.username }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] text-slate-400 font-semibold mb-1">Fecha de Visita</label>
                      <input type="date" v-model="formVisita.fecha_visita" class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white [color-scheme:dark]" />
                    </div>
                  </div>
                  <div class="flex justify-end pt-2">
                    <button 
                      type="button"
                      :disabled="cargandoVisita || !formVisita.id_user_responsable || !formVisita.fecha_visita"
                      @click="programarVisitaTerreno" 
                      class="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <svg v-if="!cargandoVisita" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span v-if="!cargandoVisita">Programar Visita Terreno</span>
                      <span v-else>Generando...</span>
                    </button>
                  </div>
                  <div v-if="visitaProgramadaInfo" class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-xs font-bold text-amber-300 mt-2 flex justify-between items-center">
                    <span>✅ Survey #{{ visitaProgramadaInfo.id_survey }} creado exitosamente.</span>
                    <span>{{ formatFecha(visitaProgramadaInfo.fecha_plan_ini) }} | {{ visitaProgramadaInfo.nombre_responsable }}</span>
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
                        <button @click="abrirVisorWeb(v.id_survey)" type="button" class="bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-bold px-2 py-1 text-[10px] rounded transition-colors" title="Visualizar detalles de la visita en Web">
                          Ver Web
                        </button>
                        <a v-if="v.id_doc" :href="`${archivoBaseUrl}/archivo/transmac/${v.id_doc}`" target="_blank" class="inline-flex items-center bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-bold px-2 py-1 text-[10px] rounded transition-colors" title="Visualizar reporte PDF firmado">
                          Ver PDF
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
                    <button @click="abrirVisorWeb(selectedSurveyId)" type="button" class="bg-[#0a0f1e] hover:bg-white/5 border border-white/10 text-white font-bold px-3 py-1.5 text-xs rounded transition-colors" :disabled="!selectedSurveyId" title="Visualizar detalles de la visita en Web">
                      Ver Web
                    </button>
                    <a v-if="selectedSurveyDocId" :href="`${archivoBaseUrl}/archivo/transmac/${selectedSurveyDocId}`" target="_blank" class="inline-flex items-center bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-bold px-3 py-1.5 text-xs rounded transition-colors" title="Visualizar reporte PDF firmado">
                      Ver PDF
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

    <!-- Modal Nuevo Cliente -->
    <ModalNuevoCliente v-if="mostrarModalCliente" @close="mostrarModalCliente = false" @cliente-creado="onClienteCreado" />
    <!-- Ver Survey Visor Modal -->
    <VerSurveyModal v-model="showVisorModal" :id-survey="visorSurveyId" />
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import ModalNuevoCliente from '../../components/CRM/ModalNuevoCliente.vue'
import MapSelector from '../../components/CRM/MapSelector.vue'
import apiAxios from '../../services/api'
import VerSurveyModal from '../../components/VerSurveyModal.vue'

const props = defineProps({
  proyectoId: {
    type: Number,
    default: null
  }
})
const emit = defineEmits(['close', 'creada'])

const archivoBaseUrl = computed(() => String(apiAxios.defaults.baseURL || '').replace(/\/$/, ''))

const activeTab = ref('terreno')
const topTab = ref('comercial') // 'comercial' | 'operaciones'
const operacionesSubTab = ref('validacion') // 'validacion' | 'asignacion'
const requerimientoAprobado = ref(false)
const isDirty = ref(false)
const mostrarModalCliente = ref(false)
const mostrarModalNoAsignada = ref(false)
const noAsignacionMotivo = ref('Desistido por el cliente')
const noAsignacionObservacion = ref('')
const currentProyectoId = ref(null)
const loading = ref(true)

const snapshotComercial = ref({})

const hasDiff = (field, index = 0) => {
  if (!snapshotComercial.value) return false
  
  if (field === 'peso_carga') return (siteVisit.value.peso_carga || '') !== (snapshotComercial.value.peso_carga || '')
  if (field === 'radios_trabajo') return (siteVisit.value.radios_trabajo || '') !== (snapshotComercial.value.radios_trabajo || '')
  if (field === 'alturas_trabajo') return (siteVisit.value.alturas_trabajo || '') !== (snapshotComercial.value.alturas_trabajo || '')
  if (field === 'tipo_carga') return (siteVisit.value.tipo_carga || '') !== (snapshotComercial.value.tipo_carga || '')
  if (field === 'obra_nombre') return (siteVisit.value.obra_nombre || '') !== (snapshotComercial.value.obra_nombre || '')
  if (field === 'obra_direccion') return (siteVisit.value.obra_direccion || '') !== (snapshotComercial.value.obra_direccion || '')
  if (field === 'obra_ciudad') return (siteVisit.value.obra_ciudad || '') !== (snapshotComercial.value.obra_ciudad || '')
  if (field === 'volumen_carga') return (siteVisit.value.volumen_carga || '') !== (snapshotComercial.value.volumen_carga || '')
  
  // Diff en Líneas del Estructurador (Tabla B)
  if (field === 'equipo_descripcion') return (lines.value[index]?.descripcion || '') !== (snapshotComercial.value.lines?.[index]?.descripcion || snapshotComercial.value.equipo_descripcion || '')
  if (field === 'equipo_cantidad') return (lines.value[index]?.cantidad || 1) !== (snapshotComercial.value.lines?.[index]?.cantidad || snapshotComercial.value.equipo_cantidad || 1)
  if (field === 'equipo_valor') return (lines.value[index]?.valorUnitario || 0) !== (snapshotComercial.value.lines?.[index]?.valorUnitario !== undefined ? snapshotComercial.value.lines[index].valorUnitario : (snapshotComercial.value.equipo_valor || 0))
  if (field === 'equipo_tipo') return (lines.value[index]?.tipo || '') !== (snapshotComercial.value.lines?.[index]?.tipo || '')
  if (field === 'equipo_subcategoria') return (lines.value[index]?.subcategoria || '') !== (snapshotComercial.value.lines?.[index]?.subcategoria || '')
  if (field === 'equipo_unidad') return (lines.value[index]?.unidad || '') !== (snapshotComercial.value.lines?.[index]?.unidad || '')
  
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
  aparejos: {
    eslingas_10t: true,
    grilletes_12t: true,
    pulpo_cadena: true
  }
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

const dbCategories = ref([])
const fetchCategories = async () => {
  try {
    const { data } = await apiAxios.get('/tequ-equipos/categorias')
    let list = data?.data || []
    if (!list.some(c => c.nombre_categoria === 'Traslado')) {
      list.push({
        id_categoria: 99,
        nombre_categoria: 'Traslado',
        subcategories: [
          { id_subcategoria: 901, nombre_subcategoria: 'Cama Baja' },
          { id_subcategoria: 902, nombre_subcategoria: 'Tractor' },
          { id_subcategoria: 903, nombre_subcategoria: 'Escolta / Guía' }
        ]
      })
    }
    dbCategories.value = list
  } catch (error) {
    console.error('Error fetching dynamic categories:', error)
    dbCategories.value = [
      { id_categoria: 1, nombre_categoria: 'Grúa Telescópica', subcategories: [] },
      { id_categoria: 2, nombre_categoria: 'Camión Pluma', subcategories: [] },
      { id_categoria: 3, nombre_categoria: 'Traslado', subcategories: [{ id_subcategoria: 901, nombre_subcategoria: 'Cama Baja' }] }
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
  if (!idSurvey) return
  visorSurveyId.value = idSurvey
  showVisorModal.value = true
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

const opportunity = ref({
  id_empresa_emisora: '9',
  rut_cliente: '',
  descripcion: '',
  prioridad: 'normal',
  fecha_tentativa: '',
  familia_servicio: 'Grúas Telescópicas',
  contacto_nombre: '',
  contacto_telefono: '',
  tipo_pago: 'transferencia',
  requiere_oc_hes: false,
  requiere_acreditacion: false,
  acreditacion_docs: '',
  id_proyecto_estado: null
})

const lines = ref([
  { tipo: 'Equipo (Grúa)', subcategoria: '', descripcion: 'Grúas Liebherr LTM 1220 (220T)', cantidad: 1, unidad: 'Hrs', valorUnitario: 500000 }
])

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
  if (!currentProyectoId.value) return []
  return visitasTerreno.value.filter(v => v.id_proyecto === currentProyectoId.value)
})

const selectedSurveyDocId = computed(() => {
  if (!selectedSurveyId.value) return null
  const found = visitasTerreno.value.find(s => String(s.id_survey) === String(selectedSurveyId.value))
  return found?.id_doc || null
})

const fetchVisitasTerreno = async () => {
  try {
    const { data } = await apiAxios.get('/survey/visitas-terreno')
    visitasTerreno.value = data
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
  lines.value.push({ tipo: 'Equipo (Grúa)', subcategoria: '', descripcion: '', cantidad: 1, unidad: 'Hrs', valorUnitario: 0 })
}

const eliminarLinea = (idx) => {
  lines.value.splice(idx, 1)
}

const abrirModalCliente = () => {
  mostrarModalCliente.value = true
}

const onClienteCreado = (c) => {
  clientes.value.push(c)
  opportunity.value.rut_cliente = c.rut_empresa
  searchQuery.value = c.razon_social || c.name_empresa
  selectedClient.value = c
  mostrarModalCliente.value = false
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

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  fetchUsuarios()
  fetchCategories()

  // Modo edición: cargar datos del proyecto existente
  if (props.proyectoId) {
    try {
      const { data } = await apiAxios.get(`/proyectos/${props.proyectoId}`)
      const p = data.proyecto
      if (p) {
        currentProyectoId.value = p.id_proyecto

        // Mapear columnas reales a los refs del formulario
        opportunity.value.descripcion           = p.objetivo_proyecto || ''
        opportunity.value.fecha_tentativa       = p.fecha_plan_ini ? p.fecha_plan_ini.split('T')[0] : ''
        opportunity.value.id_empresa_emisora    = String(p.id_empresa || '9')
        opportunity.value.id_proyecto_estado    = p.id_proyecto_estado
        if (p.id_proyecto_estado === 3) {
          topTab.value = 'operaciones'
        }

        if (p.codi_proyecto) {
          antecedentes.value.identificador_formal = p.codi_proyecto
        }

        // Mapear json_field.crm_v1
        const crm = p.json_field?.crm_v1
        if (crm) {
          antecedentes.value.identificador = crm.n_licitacion || (p.codi_proyecto && !p.codi_proyecto.startsWith('COT-') && !['GSP','BMQ','LDS','RYL'].some(pref => p.codi_proyecto.startsWith(pref)) ? p.codi_proyecto : '')
          opportunity.value.prioridad             = crm.prioridad || 'normal'
          opportunity.value.familia_servicio      = crm.familia_servicio || 'Grúas Telescópicas'
          opportunity.value.contacto_nombre       = crm.contacto_nombre || ''
          opportunity.value.contacto_telefono     = crm.contacto_telefono || ''
          opportunity.value.tipo_pago             = crm.tipo_pago || 'transferencia'
          opportunity.value.requiere_oc_hes       = crm.requiere_oc_hes || false
          opportunity.value.requiere_acreditacion = crm.requiere_acreditacion || false
          opportunity.value.acreditacion_docs     = crm.acreditacion_docs || ''
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

  // Reseteamos el flag para que la carga inicial no dispare la advertencia
  setTimeout(() => { isDirty.value = false }, 500)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

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
    if (payload.id_proyecto_estado === 3) {
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

  // Cambia el estado a Requerimiento Generado / Preparación en Operaciones (id_proyecto_estado = 3)
  opportunity.value.id_proyecto_estado = 3
  await guardarEnPreventa()
  
  try {
    await apiAxios.post('/message', {
      para: 'sgajardoc@gmail.com',
      asunto: `Nuevo Requerimiento de Operaciones: ${antecedentes.value.identificador_formal || 'COT'}`,
      cuerpo: `Se ha generado un nuevo requerimiento para la cotización ${antecedentes.value.identificador_formal || 'COT'}. Ya puedes revisarlo en el módulo de Operaciones.`
    })
    alert('✉️ Notificación REAL de Nuevo Requerimiento enviada a sgajardoc@gmail.com desde notificaciones.gsp@leanglobal.cl a través de la API.\n\nLa tarjeta avanzó a la columna "En Preparación Operaciones".')
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
      decision: decisionFinal,
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

    alert(`${textoResultado}\n\nSe ha habilitado la Pestaña C: Asignación de Recursos (OT). Selecciona la Grúa, Operador, Rigger y Tiempos de Salida para finalizar.`)
  } catch (error) {
    console.error('Error al aprobar requerimiento:', error)
    alert('Error al procesar la aprobación del requerimiento.')
  }
}

const confirmarAsignacionOT = async () => {
  try {
    const token = localStorage.getItem('token') || ''
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    
    // No cambiar estado a 4 aún, el estado se mantiene en 3 (Preparación Operaciones)
    // hasta que el chofer marque desplazamiento
    
    const payload = buildPayload()
    // payload.id_proyecto_estado = 4 // Removido
    payload.json_field.ejecucion_v1 = {
      ...(payload.json_field?.ejecucion_v1 || {}),
      equipo_id: operacionesAssignment.value.equipo_id === 'CRN-DEFAULT' ? (lines.value[0]?.descripcion || 'Equipo Estructurador') : operacionesAssignment.value.equipo_id,
      equipos_extra: operacionesAssignment.value.equipos_extra,
      operador_id: operacionesAssignment.value.operador_id,
      rigger_id: operacionesAssignment.value.rigger_id,
      fecha_salida_plan: operacionesAssignment.value.fecha_salida_plan,
      hora_salida_plan: operacionesAssignment.value.hora_salida_plan,
      fecha_fin_plan: operacionesAssignment.value.fecha_fin_plan,
      hora_fin_plan: operacionesAssignment.value.hora_fin_plan,
      observaciones: operacionesAssignment.value.observaciones_operaciones,
      aparejos_solicitados_json: snapshotComercial.value.aparejos || {},
      aparejos_asignados_json: operacionesAssignment.value.aparejos
    }
    
    const projectId = props.proyectoId || currentProyectoId.value
    await apiAxios.put(`/proyectos/${projectId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    isDirty.value = false
    try {
      await apiAxios.post('/message', {
        para: 'sgajardoc@gmail.com',
        asunto: `Orden de Trabajo Asignada: ${antecedentes.value.identificador_formal || 'COT'}`,
        cuerpo: `Se ha confirmado la asignación de recursos para el proyecto ${antecedentes.value.identificador_formal || 'COT'}.`
      })
      alert(`🚀 Orden de Trabajo (OT) Asignada y Confirmada Exitosamente.\n\n✉️ Notificación REAL enviada a sgajardoc@gmail.com.\n\nLa tarjeta avanzó en el Kanban a 'Asignados / OT Generada'.`)
    } catch(err) {
      alert(`🚀 Orden de Trabajo (OT) Asignada Exitosamente.\n\n⚠️ Falló envío de correo REAL, pero la tarjeta avanzó.`)
    }
    
    emit('creada', { id: antecedentes.value.identificador_formal })
    emit('close')
  } catch (error) {
    console.error('Error al confirmar asignación OT:', error)
    alert('Error al confirmar la asignación de recursos para la OT.')
  }
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
    
    // Llamar al endpoint del backend para generar la versión
    const token = localStorage.getItem('token') || ''
    const { data } = await apiAxios.post(`/proyectos/${projectId}/generar-cotizacion`, {
      monto: totalNeto.value
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
    window.open('https://servidor.leanglobal.cl' + data.cotizacion.url, '_blank')
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

const programarVisitaTerreno = async () => {
  if (!opportunity.value.rut_cliente) {
    alert('Debe seleccionar un cliente mandante antes de programar una visita.')
    return
  }
  
  if (!selectedClient.value || !selectedClient.value.id_empresa) {
    alert('Debe seleccionar un cliente de la lista desplegable o crear uno nuevo para poder programar una visita a terreno.')
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
  try {
    const response = await apiAxios.get('/servicio/leanglobal/obtenerTemplates', {
      params: { id_tipo_srv: 2 }
    })
    const templates = Array.isArray(response.data) ? response.data : []
    const template = templates.find(t => Number(t.id_template) === 80)
    if (!template) {
      throw new Error('No se encontró el template 80 para Visita a Terreno.')
    }

    const headerSeed = typeof template.header_seed === 'string' ? JSON.parse(template.header_seed) : template.header_seed || {}
    const bodySeed = typeof template.body_seed === 'string' ? JSON.parse(template.body_seed) : template.body_seed || {}
    const approvalSeed = typeof template.approval_seed === 'string' ? JSON.parse(template.approval_seed) : template.approval_seed || {}
    const idFlowTmpl = Number(template.id_flow_tmpl) || 1

    // Modificamos body_exec clonándolo del bodySeed
    const bodyExec = JSON.parse(JSON.stringify(bodySeed))
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const respUser = usuarios.value.find(u => u.id_user === formVisita.value.id_user_responsable)
    const vendedorName = `${currentUser.name_frst || currentUser.nombre_user || ''} ${currentUser.apellido_pat || ''}`.trim() || currentUser.username || ''
    const operadorName = respUser ? (respUser.nombre_user || respUser.name_user || respUser.username || '') : ''

    if (bodyExec && bodyExec.segmentos) {
      bodyExec.segmentos.forEach(seg => {
        if (seg.label === "2. DATOS GENERALES DEL SERVICIO") { 
          seg.attributes.forEach(attr => {
            if (attr.label === "NOMBRE DE LA OBRA") attr.default = siteVisit.value.obra_nombre || selectedClient.value?.name_empresa || ''
            if (attr.label === "DIRECCION DE LA OBRA") attr.default = siteVisit.value.obra_direccion || ''
            if (attr.label === "REFERENCIA DE LA DIRECCION") attr.default = siteVisit.value.obra_ciudad || ''
            if (attr.label === "VISITADO POR (NOMBRE VENDEDOR)") attr.default = vendedorName
            if (attr.label === "VISITADO POR (NOMBRE OPERADOR)") attr.default = operadorName
            if (attr.label === "CONTACTO EN TERRENO") attr.default = opportunity.value.contacto_nombre || ''
            if (attr.label === "N° TELEFONO (CONTACTO EN TERRENO)") attr.default = opportunity.value.contacto_telefono || ''
            if (attr.label === "CORREO ELECTRONICO CONTACTO EN TERRENO") attr.default = selectedClient.value?.email || ''
          })
        }
        if (seg.label === "6. DATOS TECNICOS DE IZAJE") { 
          seg.attributes.forEach(attr => {
            if (attr.label === "TIPO DE CARGA") attr.default = siteVisit.value.tipo_carga || ''
            if (attr.label === "PESO DE LA CARGA") attr.default = Number(siteVisit.value.peso_carga || 0)
            if (attr.label === "VOLUMEN DE CARGA") attr.default = siteVisit.value.volumen_carga || ''
            if (attr.label === "RADIO MINIMO DE TRABAJO") attr.default = Number(siteVisit.value.radios_trabajo || 0)
            if (attr.label === "RADIO MAXIMO DE TRABAJO") attr.default = Number(siteVisit.value.radios_trabajo || 0)
            if (attr.label === "ALTURA DE TRABAJO") attr.default = Number(siteVisit.value.alturas_trabajo || 0)
          })
        }
      })

      if (lines.value?.length) {
        bodyExec.lineas_servicio = lines.value
        const segEstructurador = {
          label: "1. ESTRUCTURADOR DE SERVICIOS",
          posicion: 0,
          attributes: [
            {
              label: "Líneas de Servicio Cotizadas",
              type: "estructuradorServicios",
              lineas: lines.value
            }
          ]
        }
        const segIdx = bodyExec.segmentos.findIndex(s => s.label && s.label.includes("ESTRUCTURADOR"))
        if (segIdx !== -1) {
          bodyExec.segmentos[segIdx] = segEstructurador
        } else {
          bodyExec.segmentos.unshift(segEstructurador)
        }
      }
    }

    const payloadSurvey = {
      id_tipo_srv: 2, 
      id_template: 80, 
      id_user: null, // Asignación se hace después
      id_user_creacion: 1, 
      id_empresa_cliente: selectedClient.value ? selectedClient.value.id_empresa : null,
      estado_srv: 'Creado',
      header_seed: JSON.stringify(headerSeed),
      body_seed: JSON.stringify(bodySeed),
      approval_seed: JSON.stringify(approvalSeed),
      header_exec: JSON.stringify(headerSeed),
      body_exec: JSON.stringify(bodyExec),
      approval_exec: JSON.stringify(approvalSeed),
      fecha_plan_ini: formVisita.value.fecha_visita,
      fecha_plan_fin: formVisita.value.fecha_visita,
      fecha_real_ini: null,
      fecha_real_fin: null,
      fecha_upload: null,
      latitud: siteVisit.value.lat || null,
      longitud: siteVisit.value.lng || null,
      id_proyecto: currentProyectoId.value,
      id_flow_tmpl: idFlowTmpl
    }

    // 1. Crear el Survey
    const { data } = await apiAxios.post('/survey', payloadSurvey)
    const idSurvey = data.idSurvey || (data.survey && data.survey.id_survey) || data

    // 2. Asignar al técnico responsable (igual que en el modal de asignación de Transmac)
    if (formVisita.value.id_user_responsable) {
      await apiAxios.put(`/survey/UpdPlan/${idSurvey}`, {
        id_user: formVisita.value.id_user_responsable,
        fecha_plan_ini: formVisita.value.fecha_visita,
        fecha_plan_fin: formVisita.value.fecha_visita
      })
    }

    visitaProgramadaInfo.value = {
      id_survey: idSurvey,
      fecha_plan_ini: formVisita.value.fecha_visita,
      nombre_responsable: respUser ? (respUser.nombre_user || respUser.name_user || respUser.username) : 'Técnico'
    }
    siteVisit.value.visita_terreno = true
    alert('Visita técnica en terreno programada exitosamente.')
    fetchVisitasTerreno()
  } catch (error) {
    console.error('Error al programar la visita técnica:', error)
    alert('Error al programar la visita técnica en terreno.')
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
</style>
