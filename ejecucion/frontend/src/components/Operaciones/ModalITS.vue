<template>
  <div v-if="visible" :class="embedded ? 'w-full animate-fadeIn' : 'fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fadeIn'">
    <div :class="embedded ? 'bg-[#0b1021] border border-blue-500/30 rounded-2xl w-full flex flex-col shadow-xl text-slate-200' : 'bg-[#0b1021] border border-blue-500/40 rounded-2xl w-full max-w-[98vw] 2xl:max-w-[1750px] max-h-[96vh] flex flex-col overflow-hidden shadow-2xl shadow-black text-slate-200'">
      
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

          <!-- Si NO es readonly (Cockpit PMO) -->
          <template v-if="!readonly">
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

          <!-- Si ES readonly (Kanban de Operaciones) -->
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
            type="button"
            @click="abrirPreviewPdfDirecto"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ver PDF Oficial"
          >
            <span>PDF Oficial</span>
          </button>

          <button 
            v-if="puedeFirmarPasoActual && !readonly"
            type="button"
            @click="abrirModalFes('APRUEBA')"
            class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-900/40 flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
          >
            <span>🔏</span>
            <span>Firmar FES</span>
          </button>

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

        <!-- Acciones FES del Stepper -->
        <div class="flex items-center gap-1.5">
          <button 
            v-if="puedeFirmarPasoActual"
            type="button"
            @click="abrirModalFes('APRUEBA')"
            class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>🔏</span> <span>Firmar Paso {{ pasoPendienteActual?.orden || 1 }}</span>
          </button>

          <button 
            v-if="puedeFirmarPasoActual && pasoPendienteActual?.orden > 1"
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

      <div v-else class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
        
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
              <div class="flex items-center gap-1 mt-0.5">
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
              <label class="text-[10px] text-slate-400 uppercase font-mono block">Valor Hora Pactado ($/hr)</label>
              <input 
                type="number" 
                step="1000" 
                v-model.number="its.valor_hora_pactado" 
                @input="recalcularTotales"
                class="w-full bg-slate-950 border border-blue-500/40 rounded px-2 py-1 font-mono font-bold text-blue-300 text-xs mt-0.5"
              />
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
              <span class="text-[9px] text-cyan-400/80 block mt-0.5 font-mono">Pactado (Ida + Retorno faena)</span>
            </div>

            <div class="bg-slate-900/80 p-2.5 rounded-lg border border-white/10">
              <span class="text-[10px] text-slate-400 uppercase font-mono block">Venta Neta Proyectada</span>
              <strong class="text-emerald-400 font-mono text-sm block mt-1">
                {{ formatMoneda(its.total_ingresos_facturables) }}
              </strong>
            </div>
          </div>

          <!-- Tripulación y Recursos Asignados -->
          <div class="bg-slate-950/60 p-3 rounded-lg border border-white/10">
            <span class="text-[11px] font-mono font-bold uppercase text-slate-400 block mb-2">
              Recursos Asignados en Faena
            </span>
            <div class="flex flex-wrap items-center gap-3">
              <div v-for="eq in asignaciones.equipos" :key="eq.id_equipo" class="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-md border border-white/15 text-xs">
                <span class="text-amber-400">🚜</span>
                <span class="font-mono font-bold text-white">{{ eq.patente }}</span>
                <span class="text-slate-400 text-[11px]">{{ eq.modelo }}</span>
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
                  <th class="p-2.5">Hrs Reales</th>
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
                      <option value="Fijo">Fijo</option>
                      <option value="Flete Ida y Retorno">Flete Ida y Retorno</option>
                      <option value="Flete Solo Ida">Flete Solo Ida</option>
                      <option value="Flete Solo Retorno">Flete Solo Retorno</option>
                      <option value="Visita Terreno">Visita Terreno</option>
                      <option value="Interno">Interno</option>
                    </select>
                  </td>

                  <td class="p-2">
                    <input type="text" v-model="j.patente" placeholder="GH-JK-88" class="w-20 bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-xs text-white font-bold" />
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

                  <td class="p-2 font-bold text-slate-300">
                    {{ j.horas_reales }} hrs
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
                  <td colspan="15" class="p-6 text-center text-slate-500 font-sans text-xs">
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
                    {{ totalHorasRealesActivas.toFixed(1) }} hrs
                  </td>
                  <td class="p-2.5 font-black text-amber-300 text-sm">
                    {{ its.total_horas_report.toFixed(1) }} hrs
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

        <!-- SECCIÓN 3: PLANILLA DE COSTOS OPERACIONALES DIRECTOS (9 CATEGORÍAS) -->
        <section class="bg-[#080d1a] border border-white/15 rounded-xl p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between border-b border-white/10 pb-2.5 mb-3.5 gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider flex items-center gap-2">
                <span>💰</span> Sección 3: Costos Operacionales Directos de Terreno (9 Categorías)
              </span>
              <span class="bg-rose-950/80 text-rose-300 border border-rose-700/50 text-xs font-mono px-2 py-0.5 rounded font-bold">
                Total Costos: {{ formatMoneda(its.total_costos_operacionales) }}
              </span>
              <!-- Badge Consolidado Auditoría -->
              <span 
                :class="totalCategoriasAuditadas === 9 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50' : 'bg-amber-950/80 text-amber-300 border-amber-700/50'"
                class="border text-[11px] font-mono px-2 py-0.5 rounded font-bold flex items-center gap-1"
              >
                <span>{{ totalCategoriasAuditadas === 9 ? '✅' : '⚠️' }}</span>
                <span>Auditoría: {{ totalCategoriasAuditadas }}/9 Categorías</span>
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
                        <select v-model="it.concepto_detalle" class="bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white">
                          <option value="UBER / TAXI">Uber / Taxi</option>
                          <option value="PASAJE BUS">Pasaje Bus Interurbano</option>
                          <option value="PASAJE AVION">Pasaje Aéreo</option>
                          <option value="TRANSFER">Transfer Aeropuerto/Terminal</option>
                          <option value="OTROS">Otro Gasto de Traslado</option>
                        </select>
                      </td>
                      <td class="p-1.5"><input type="text" v-model="it.ruta_detalle" placeholder="Ruta / Tramo" class="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white" /></td>
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

              <!-- CASO COSTO HORA OPERADOR (Multiplicativo Valor Hora * Horas) -->
              <div v-else-if="tabCostoActiva === 'costo_hora_operador'">
                <table class="w-full text-xs text-left">
                  <thead class="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th class="p-2">Fecha</th>
                      <th class="p-2">Patente</th>
                      <th class="p-2">Operador</th>
                      <th class="p-2">Valor Hora ($)</th>
                      <th class="p-2">Horas Report</th>
                      <th class="p-2 text-rose-300">Total Costo ($)</th>
                      <th class="p-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 font-mono">
                    <tr v-for="(it, idx) in costos.costo_hora_operador" :key="idx" class="hover:bg-white/[0.02]">
                      <td class="p-1.5"><input type="date" v-model="it.fecha" class="bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white" /></td>
                      <td class="p-1.5">
                        <select v-model="it.patente" class="w-28 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white font-bold font-mono">
                          <option value="" disabled>Patente...</option>
                          <option v-for="eq in patentesAsignadas" :key="eq.patente" :value="eq.patente">{{ eq.patente }}</option>
                          <option v-if="it.patente && !patentesAsignadas.some(e => e.patente === it.patente)" :value="it.patente">{{ it.patente }}</option>
                        </select>
                      </td>
                      <td class="p-1.5">
                        <select v-if="personalAsignadoLista.length > 0" v-model="it.nombre_personal" class="w-36 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white font-bold">
                          <option value="" disabled>Seleccione tripulante...</option>
                          <option v-for="p in personalAsignadoLista" :key="p.id_user || p.nombre" :value="p.nombre">
                            {{ p.nombre }}
                          </option>
                          <option v-if="it.nombre_personal && !personalAsignadoLista.some(p => p.nombre === it.nombre_personal)" :value="it.nombre_personal">{{ it.nombre_personal }}</option>
                        </select>
                        <input v-else type="text" v-model="it.nombre_personal" placeholder="Nombre Operador" class="w-36 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white" />
                      </td>
                      <td class="p-1.5"><input type="number" v-model.number="it.precio_unitario" @input="recalcularCostoOperador(it)" class="w-24 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white text-right" /></td>
                      <td class="p-1.5"><input type="number" step="0.5" v-model.number="it.cantidad_unidades" @input="recalcularCostoOperador(it)" class="w-20 bg-slate-900 border border-white/10 rounded px-1 py-1 text-xs text-white text-right font-bold text-amber-300" /></td>
                      <td class="p-1.5 font-bold text-rose-300 text-right">{{ formatMoneda(it.monto_total) }}</td>
                      <td class="p-1.5 text-center">
                        <button type="button" @click="eliminarItemCosto('costo_hora_operador', idx)" class="text-rose-400 hover:text-rose-200 cursor-pointer">🗑️</button>
                      </td>
                    </tr>
                    <tr v-if="costos.costo_hora_operador.length === 0">
                      <td colspan="7" class="p-4 text-center text-slate-500 font-sans">Sin costo hora operador imputado.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- CASO TABLA ESTÁNDAR PARA LAS OTRAS CATEGORÍAS (Peajes, Personal Ext, Feriados, Flete Ext, Gastos Extra) -->
              <div v-else>
                <table class="w-full text-xs text-left">
                  <thead class="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th class="p-2">Fecha</th>
                      <th class="p-2" v-if="tabCostoActiva === 'peajes'">Patente</th>
                      <th class="p-2" v-if="necesitaColumnaOC(tabCostoActiva)">N° OC Cabecera</th>
                      <th class="p-2">Personal / Proveedor</th>
                      <th class="p-2">Detalle / Concepto</th>
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
                      <td class="p-1.5"><input type="text" v-model="it.nombre_personal" placeholder="Nombre" class="w-32 bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white" /></td>
                      <td class="p-1.5"><input type="text" v-model="it.concepto_detalle" placeholder="Detalle del gasto" class="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white" /></td>
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
                        <button type="button" @click="eliminarItemCosto(tabCostoActiva, idx)" class="text-rose-400 hover:text-rose-200 cursor-pointer">🗑️</button>
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
          
          <!-- PANEL IZQUIERDO: BALANCE FINANCIERO (VENTA VS COSTOS) -->
          <div class="bg-[#080d1a] border border-white/15 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-xs font-mono font-bold uppercase text-blue-400 tracking-wider flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                <span>📊</span> Balance Financiero del Servicio (P&L Operacional)
              </h3>

              <div class="space-y-2 text-xs font-mono">
                <!-- Ingresos -->
                <div class="bg-slate-950/80 p-2.5 rounded border border-white/10 space-y-1">
                  <div class="flex justify-between text-slate-400">
                    <span>1. Ingreso por Horas ({{ its.total_horas_report }}h × {{ formatMoneda(its.valor_hora_pactado) }}):</span>
                    <strong class="text-white">{{ formatMoneda(its.total_ingresos_horas) }}</strong>
                  </div>
                  <div class="flex justify-between text-slate-400">
                    <span>2. Ingreso por Fletes / Traslados:</span>
                    <strong class="text-white">{{ formatMoneda(its.total_ingresos_fletes) }}</strong>
                  </div>
                  <div class="flex justify-between text-emerald-400 font-bold border-t border-white/10 pt-1">
                    <span>TOTAL INGRESOS FACTURABLES (100%):</span>
                    <span>{{ formatMoneda(its.total_ingresos_facturables) }}</span>
                  </div>
                </div>

                <!-- Costos -->
                <div class="bg-slate-950/80 p-2.5 rounded border border-white/10 space-y-1">
                  <div class="flex justify-between text-slate-400">
                    <span>Costos Directos de Terreno (9 Categorías):</span>
                    <strong class="text-rose-300">- {{ formatMoneda(its.total_costos_operacionales) }}</strong>
                  </div>
                  <div class="text-[11px] text-slate-500">
                    Impacto sobre la venta: {{ porcentajeCostosSobreVenta.toFixed(1) }}%
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
          <div class="bg-[#080d1a] border border-white/15 rounded-xl p-4 shadow-sm flex flex-col justify-between">
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
              <button 
                type="button" 
                @click="recargarPreviewPdf" 
                class="text-[10px] text-blue-400 hover:text-blue-200 font-mono cursor-pointer flex items-center gap-1"
              >
                <span>🔄</span> <span>Actualizar</span>
              </button>
            </div>

            <div v-if="cargandoPdfPreview" class="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <div class="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-2"></div>
              <span class="text-xs font-mono">Compilando documento con Puppeteer...</span>
            </div>

            <iframe 
              v-else-if="pdfPreviewBase64" 
              :src="pdfPreviewBase64" 
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

const categoriasCostosTabs = [
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

const getEstadoCategoria = (catKey) => {
  const count = (costos.value[catKey] || []).length;
  if (count > 0) return 'CON_COSTOS';
  if (categoriasSinCosto.value[catKey] === true) return 'SIN_COSTO';
  return 'PENDIENTE';
};

const toggleDeclararSinCosto = (catKey) => {
  if (categoriasSinCosto.value[catKey]) {
    delete categoriasSinCosto.value[catKey];
  } else {
    categoriasSinCosto.value[catKey] = true;
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

const puedeFirmarPasoActual = computed(() => {
  if (props.readonly) return false;
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
  if (!props.idProyecto) return;
  try {
    cargando.value = true;
    const res = await api.get(`/operaciones/its/${props.idProyecto}`);
    if (res.data && res.data.success) {
      proyecto.value = res.data.data.proyecto || {};
      its.value = { ...its.value, ...res.data.data.its };
      crmPensiones.value = res.data.data.crm_pensiones || res.data.data.proyecto?.json_field?.crm_v1?.pensiones || {};
      categoriasSinCosto.value = res.data.data.its?.categorias_sin_costo || {};
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
        return {
          ...j,
          fecha: f || '',
          tarifa_hora: tarifa,
          subtotal: parseFloat(j.subtotal !== undefined && j.subtotal !== null ? j.subtotal : (hrs * tarifa))
        };
      });
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

      costos.value = {
        combustible: formatearItems(rawCostos.combustible),
        movilizacion: formatearItems(rawCostos.movilizacion),
        peajes: formatearItems(rawCostos.peajes),
        pensiones: formatearItems(rawCostos.pensiones),
        personal_externo: formatearItems(rawCostos.personal_externo),
        feriados: formatearItems(rawCostos.feriados),
        subcontratacion_flete: formatearItems(rawCostos.subcontratacion_flete),
        gastos_extraordinarios: formatearItems(rawCostos.gastos_extraordinarios),
        costo_hora_operador: formatearItems(rawCostos.costo_hora_operador)
      };
      // Recalcular pensiones según condiciones comerciales
      (costos.value.pensiones || []).forEach(it => recalcularPension(it));
      asignaciones.value = res.data.data.asignaciones || { equipos: [], personal: [] };
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
    recalcularTotales();
    its.value.categorias_sin_costo = categoriasSinCosto.value;
    const payload = {
      id_proyecto: props.idProyecto,
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
  if (!props.idProyecto) return;
  try {
    const res = await api.get(`/operaciones/its/flujo/${props.idProyecto}?id_user=${usuarioActual.value?.id_user || 1}`);
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
  if (!props.idProyecto) return;
  try {
    cargandoPdfPreview.value = true;
    const res = await api.get(`/operaciones/its/preview-pdf/${props.idProyecto}?format=base64`);
    if (res.data && res.data.success) {
      if (res.data.pdfBase64) {
        pdfPreviewBase64.value = res.data.pdfBase64;
      } else if (res.data.data?.base64) {
        pdfPreviewBase64.value = `data:application/pdf;base64,${res.data.data.base64}`;
      }
    }
  } catch (error) {
    console.error('Error al cargar preview PDF:', error);
  } finally {
    cargandoPdfPreview.value = false;
  }
};

const abrirPreviewPdfDirecto = () => {
  if (!props.idProyecto) return;
  const url = `${api.defaults.baseURL}/operaciones/its/preview-pdf/${props.idProyecto}`;
  window.open(url, '_blank');
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
      id_proyecto: props.idProyecto,
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

// Motor Reactivo de Cálculos
const recalcularTotales = () => {
  // 1. Horas facturables y Subtotal por Jornada
  let totalHrs = 0;
  let totalIngHoras = 0;
  let totalIngFletes = 0;
  const vHoraDefault = parseFloat(its.value.valor_hora_pactado || 0);

  jornadas.value.forEach(j => {
    const esFlete = j.tipo_servicio && j.tipo_servicio.toLowerCase().includes('flete');
    if (j.tarifa_hora === undefined || j.tarifa_hora === null || isNaN(j.tarifa_hora)) {
      j.tarifa_hora = esFlete ? Math.round(parseFloat(its.value.valor_flete_pactado || 400000) / 2) : vHoraDefault;
    }
    const hrs = parseFloat(j.horas_report || 0);
    const tarifa = parseFloat(j.tarifa_hora || 0);
    j.subtotal = hrs * tarifa;

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
  its.value.total_ingresos_horas = totalIngHoras;

  // 2. Ingresos
  if (totalIngFletes > 0) {
    its.value.total_ingresos_fletes = totalIngFletes;
    its.value.valor_flete_pactado = totalIngFletes;
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

  if (tipo === 'Flete Solo Ida') {
    // Tramo de carretera de ida: Salida de Patio a Llegada a Faena
    minTotales = calcularDiferenciaMinutos(j.hora_salida, j.hora_llegada);
    j.horas_reales = parseFloat((minTotales / 60).toFixed(1)) || 1.0;
    if (!j.horas_report || j.horas_report === 0) {
      j.horas_report = 1.0;
    }
    if (!j.tarifa_hora || j.tarifa_hora === parseFloat(its.value.valor_hora_pactado || 0)) {
      j.tarifa_hora = Math.round(parseFloat(its.value.valor_flete_pactado || 400000) / 2) || 200000;
    }
  } else if (tipo === 'Flete Solo Retorno') {
    // Tramo de carretera de regreso: Término de Faena a Retorno a Patio
    minTotales = calcularDiferenciaMinutos(j.hora_termino, j.hora_retorno);
    j.horas_reales = parseFloat((minTotales / 60).toFixed(1)) || 1.0;
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
    j.horas_reales = parseFloat((minTotales / 60).toFixed(1)) || 2.0;
    if (!j.horas_report || j.horas_report === 0) {
      j.horas_report = 1.0;
    }
    if (!j.tarifa_hora || j.tarifa_hora === parseFloat(its.value.valor_hora_pactado || 0)) {
      j.tarifa_hora = parseFloat(its.value.valor_flete_pactado || 400000);
    }
  } else {
    // Faena normal (Hora, Mensual, Fijo): Llegada a Término descontando colación
    minTotales = Math.max(0, calcularDiferenciaMinutos(j.hora_llegada, j.hora_termino) - (j.colacion_minutos || 0));
    j.horas_reales = parseFloat((minTotales / 60).toFixed(1));
    if (!j.horas_report || j.horas_report === 0) {
      j.horas_report = Math.max(j.horas_reales, its.value.horas_minimas_pactadas || 4.0);
    }
    if (!j.tarifa_hora || j.tarifa_hora > 150000) {
      j.tarifa_hora = parseFloat(its.value.valor_hora_pactado || 85000);
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
    patente: asignaciones.value.equipos?.[0]?.patente || 'VCTR.81-9',
    equipo_modelo: asignaciones.value.equipos?.[0]?.modelo || 'ATF 50 G3',
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
    patente: asignaciones.value.equipos?.[0]?.patente || 'VCTR.81-9',
    equipo_modelo: asignaciones.value.equipos?.[0]?.modelo || 'ATF 50 G3',
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
    patente: asignaciones.value.equipos?.[0]?.patente || 'VCTR.81-9',
    equipo_modelo: asignaciones.value.equipos?.[0]?.modelo || 'ATF 50 G3',
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
    patente: asignaciones.value.equipos?.[0]?.patente || 'VCTR.81-9',
    equipo_modelo: asignaciones.value.equipos?.[0]?.modelo || 'ATF 50 G3',
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
  const hoy = new Date().toISOString().split('T')[0];
  if (!costos.value[cat]) costos.value[cat] = [];
  
  if (cat === 'combustible') {
    costos.value[cat].push({
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
  } else if (cat === 'movilizacion') {
    costos.value[cat].push({
      fecha: hoy,
      nombre_personal: personalAsignadoLista.value?.[0]?.nombre || '',
      concepto_detalle: 'UBER / TAXI',
      ruta_detalle: '',
      numero_oc: '',
      archivo_comprobante_url: '',
      monto_total: 0
    });
  } else if (cat === 'pensiones') {
    costos.value[cat].push({
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
  } else if (cat === 'costo_hora_operador') {
    const defaultTripulante = personalAsignadoLista.value?.[0]?.nombre || 'JORGE PONCE';
    const defaultPat = patentesAsignadas.value?.[0]?.patente || 'VCTR.81-9';
    const hrs = its.value.total_horas_report || 28;
    costos.value[cat].push({
      fecha: hoy,
      patente: defaultPat,
      nombre_personal: defaultTripulante,
      precio_unitario: 10000,
      cantidad_unidades: hrs,
      monto_total: 10000 * hrs
    });
  } else {
    costos.value[cat].push({
      fecha: hoy,
      patente: cat === 'peajes' ? (patentesAsignadas.value?.[0]?.patente || '') : '',
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
  if (costos.value[cat]) {
    costos.value[cat].splice(idx, 1);
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

const recalcularCostoOperador = (it) => {
  it.monto_total = (parseFloat(it.precio_unitario) || 0) * (parseFloat(it.cantidad_unidades) || 0);
  recalcularTotales();
};

const getSubtotalCategoria = (cat) => {
  return (costos.value[cat] || []).reduce((acc, it) => acc + (parseFloat(it.monto_total) || 0), 0);
};

const getTabActualLabel = () => {
  const t = categoriasCostosTabs.find(tab => tab.key === tabCostoActiva.value);
  return t ? t.label : 'Costos';
};

const necesitaColumnaOC = (cat) => {
  return ['pensiones', 'personal_externo', 'subcontratacion_flete'].includes(cat);
};

// Plantillas y Contexto
const cambiarContexto = (ctx) => {
  its.value.tipo_contexto = ctx;
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

const cerrar = () => {
  emit('close');
};

// Watchers
watch([() => props.visible, () => props.idProyecto], ([newVis, newId]) => {
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
