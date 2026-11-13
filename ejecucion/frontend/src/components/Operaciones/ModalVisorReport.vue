<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
    <div class="bg-[#0b1021] border border-amber-500/40 rounded-2xl w-full max-w-[1260px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-black">
      
      <!-- 1. CABECERA COMPACTA (UNA SOLA LÍNEA CONTEXTUAL) -->
      <div class="bg-[#050810] px-5 py-3 border-b border-white/10 flex justify-between items-center flex-shrink-0">
        <div class="flex items-center gap-3">
          <span class="text-2xl">📋</span>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h3 class="text-base font-black text-white uppercase tracking-wider font-mono">
                Report Diario Digital — Día {{ reportLocal?.dia_correlativo || 1 }}
                <span v-if="reportLocal?.id_reporte_avance" class="text-amber-400 font-normal">· #{{ reportLocal.id_reporte_avance }}</span>
              </h3>
              <span 
                v-if="reportLocal?.ajustes_analista?.evidencia_fisica_adjunta"
                class="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              >
                📄 Respaldo Físico Normalizado
              </span>
              <span 
                v-else-if="esValidado" 
                class="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              >
                ✅ Validado FES
              </span>
              <span 
                v-else-if="reportLocal?.estado_reporte === 'REGULARIZADO_MANUAL' || reportLocal?.ajustes_analista?.requiere_evidencia_fisica"
                class="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
              >
                ⚠️ Regularizado Manual (Falta Doc)
              </span>
              <span 
                v-else
                class="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border bg-blue-500/20 text-blue-300 border-blue-500/40"
              >
                ⏳ Pendiente Terreno
              </span>
              <span 
                v-if="reportLocal?.ajustes_analista?.modificado || hayModificaciones" 
                class="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border bg-amber-500/20 text-amber-300 border-amber-500/40"
              >
                ⚠️ Con Ajustes de Analista
              </span>
            </div>
            <p class="text-xs text-slate-300 mt-0.5">
              OT: <strong class="text-amber-400 font-mono">{{ reportLocal?.codi_proyecto || 'GSP-OT' }}</strong> • 
              Faena: <span class="text-slate-100 font-semibold">{{ reportLocal?.obra_nombre || 'Faena' }}</span> • 
              Fecha: <span class="text-slate-100 font-semibold">{{ formatearFecha(reportLocal?.fecha_reporte) }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <!-- BOTÓN VER DOCUMENTO OFICIAL / RESPALDO FÍSICO SI EXISTE -->
          <a 
            v-if="reportLocal?.id_doc_pdf"
            :href="urlPdfOficial"
            target="_blank"
            class="px-3 py-1.5 text-xs font-bold font-mono rounded-lg border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 text-red-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-950/40"
            :title="reportLocal?.ajustes_analista?.evidencia_fisica_adjunta ? 'Abrir Respaldo Físico Escaneado' : 'Abrir PDF Oficial con Firma Electrónica FES'"
          >
            <span>📄</span>
            <span>{{ reportLocal?.ajustes_analista?.evidencia_fisica_adjunta ? 'Doc Físico Adjunto' : 'PDF Firmado FES' }}</span>
            <span v-if="reportLocal?.codigo_validacion_fes" class="text-[9px] bg-red-950/80 text-red-300 px-1 py-0.5 rounded border border-red-500/40 hidden sm:inline-block">
              {{ reportLocal.codigo_validacion_fes }}
            </span>
          </a>

          <!-- REQ-1099 / REQ-2239: BOTÓN TRANSVERSAL ADJUNTAR DOCUMENTO ASOCIADO AL DÍA (SIEMPRE DISPONIBLE EN AUDITORÍA) -->
          <button
            @click="dispararSelectorDocumentoDia"
            type="button"
            class="px-3 py-1.5 text-xs font-bold font-mono rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Adjuntar cualquier documento o fotografía (report físico, incidencia en terreno, guía, etc.) asociada a este día"
          >
            <span>📎</span>
            <span>Adjuntar Documento</span>
            <span v-if="documentosDiaVisor.length > 0" class="px-1.5 py-0.2 rounded bg-cyan-500/30 text-white text-[10px]">
              {{ documentosDiaVisor.length }}
            </span>
          </button>

          <button 
            v-if="!readonly"
            @click="toggleModoEdicion" 
            type="button"
            class="px-3.5 py-1.5 text-xs font-bold font-mono rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            :class="modoAjuste 
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-amber-500/20' 
              : 'bg-slate-800 text-slate-200 border-white/10 hover:border-amber-500/40 hover:text-white'"
            :title="modoAjuste ? 'Finalizar modo edición' : 'Activar edición de lo reportado por operaciones'"
          >
            <span>✏️</span>
            <span>{{ modoAjuste ? 'Cerrar Edición' : 'Editar Datos Terreno' }}</span>
          </button>
          <button 
            @click="cerrar" 
            class="text-slate-400 hover:text-white text-2xl p-1 font-bold cursor-pointer transition-colors leading-none"
            title="Cerrar visor"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- 2. CUERPO AUTOCONTENIDO (2 COLUMNAS SIN SCROLL INNECESARIO) -->
      <div class="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 text-slate-200">
        
        <!-- ========================================== -->
        <!-- COLUMNA IZQUIERDA (7 COLS): OPERACIÓN Y TIEMPOS -->
        <!-- ========================================== -->
        <div class="lg:col-span-7 flex flex-col gap-3">
          
          <!-- RESUMEN CONTEXTUAL DE PERSONAL Y EQUIPO (1 LÍNEA COMPACTA) -->
          <div :class="(tieneRigger || modoAjuste) ? 'grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#080d1a] border border-white/10 rounded-xl p-3' : 'grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#080d1a] border border-white/10 rounded-xl p-3'">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase block">🚚 Grúa Móvil / Patente</span>
              <strong class="text-amber-300 font-mono text-xs block mt-0.5 truncate">{{ reportLocal?.equipo_patente || 'N/A' }}</strong>
              <span class="text-[10px] text-slate-400 block truncate">{{ reportLocal?.equipo_modelo }}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase block">👷 Operador Asignado</span>
              <div v-if="modoAjuste" class="mt-1">
                <select
                  v-model="formAjustes.id_user_operador"
                  class="w-full bg-[#0a0f1e] border border-amber-500/50 rounded px-1.5 py-1 text-[11px] text-amber-300 font-bold focus:outline-none truncate"
                >
                  <option :value="null">-- Seleccionar Operador --</option>
                  <option v-for="u in usuariosOperativos" :key="'op-vis-'+u.id_user" :value="Number(u.id_user)">
                    {{ u.nombre_completo }} {{ u.cargo ? `(${u.cargo})` : '' }}
                  </option>
                </select>
              </div>
              <template v-else>
                <span
                  v-if="reportLocal?.ajustes_analista?.valores_originales?.operador_nombre && reportLocal?.ajustes_analista?.valores_originales?.operador_nombre !== nombreOperadorMostrado"
                  class="line-through text-rose-400 text-[10px] block truncate"
                  title="Operador originalmente registrado"
                >
                  {{ reportLocal.ajustes_analista.valores_originales.operador_nombre }}
                </span>
                <strong class="text-white text-xs block mt-0.5 truncate" :class="{ 'text-emerald-400': esOperadorModificado || (reportLocal?.ajustes_analista?.valores_originales?.operador_nombre && reportLocal?.ajustes_analista?.valores_originales?.operador_nombre !== nombreOperadorMostrado) }">{{ nombreOperadorMostrado }}</strong>
                <span class="text-[10px] text-slate-400">GSP Operaciones</span>
              </template>
            </div>
            <div v-if="tieneRigger || modoAjuste">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">🦺 Rigger / Asistente</span>
              <div v-if="modoAjuste" class="mt-1">
                <select
                  v-model="formAjustes.id_user_rigger"
                  class="w-full bg-[#0a0f1e] border border-cyan-500/50 rounded px-1.5 py-1 text-[11px] text-cyan-300 font-bold focus:outline-none truncate"
                >
                  <option :value="null">-- Sin Rigger / N/A --</option>
                  <option v-for="u in usuariosOperativos" :key="'rig-vis-'+u.id_user" :value="Number(u.id_user)">
                    {{ u.nombre_completo }} {{ u.cargo ? `(${u.cargo})` : '' }}
                  </option>
                </select>
              </div>
              <template v-else>
                <span
                  v-if="reportLocal?.ajustes_analista?.valores_originales?.rigger_nombre && reportLocal?.ajustes_analista?.valores_originales?.rigger_nombre !== nombreRiggerMostrado"
                  class="line-through text-rose-400 text-[10px] block truncate"
                  title="Rigger originalmente registrado"
                >
                  {{ reportLocal.ajustes_analista.valores_originales.rigger_nombre }}
                </span>
                <strong class="text-white text-xs block mt-0.5 truncate" :class="{ 'text-emerald-400': esRiggerModificado || (reportLocal?.ajustes_analista?.valores_originales?.rigger_nombre && reportLocal?.ajustes_analista?.valores_originales?.rigger_nombre !== nombreRiggerMostrado) }">{{ nombreRiggerMostrado }}</strong>
                <span class="text-[10px] text-slate-400">En Terreno</span>
              </template>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase block">📋 Base Mínima OT</span>
              <strong class="text-emerald-400 font-mono text-xs block mt-0.5">{{ baseMinima }} hrs</strong>
              <span class="text-[10px] text-slate-400 block">Piso mínimo día</span>
            </div>
          </div>

          <!-- BANNER DE EDICIÓN ACTIVA -->
          <div v-if="modoAjuste" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2 text-amber-200 animate-fadeIn">
            <div class="flex items-center gap-2">
              <span class="text-base flex-shrink-0">✏️</span>
              <span class="text-[11px] leading-tight">
                <strong>Modo Edición Activado:</strong> Modifica lo que reportó operaciones (Operador, Rigger, Horario Faena, Colación, Horómetros y Odómetros). Las Horas Efectivas, Horas a Facturar y Sobretiempo se re-calcularán automáticamente con estricta cuadratura.
              </span>
            </div>
            <button 
              v-if="hayModificaciones" 
              @click="restablecerAjustes" 
              type="button" 
              class="text-[11px] font-bold text-amber-400 hover:text-white underline cursor-pointer flex-shrink-0"
            >
              Revertir
            </button>
          </div>

          <!-- SECCIÓN 1: DATOS REPORTADOS POR OPERACIONES (EDITABLES EN MODO EDICIÓN) -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>📝</span>
                <span>Datos Reportados por Operaciones en Faena</span>
              </span>
              <span v-if="modoAjuste" class="text-[10px] text-amber-400 font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                ✏️ Editando campos primarios
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <!-- 1. Horario Faena & Colación -->
              <div class="bg-[#050810] border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <span class="text-[10px] text-slate-400 font-bold uppercase block">⏱️ Horario Faena</span>
                  
                  <div v-if="modoAjuste" class="pt-1.5 flex items-center gap-1 flex-wrap">
                    <input 
                      type="time" 
                      v-model="formAjustes.hora_inicio"
                      class="bg-[#0a0f1e] border border-amber-500/50 rounded px-1.5 py-0.5 text-xs font-mono text-amber-300 focus:outline-none"
                      title="Hora de Inicio"
                    />
                    <span class="text-slate-500 text-xs">➔</span>
                    <input 
                      type="time" 
                      v-model="formAjustes.hora_termino"
                      class="bg-[#0a0f1e] border border-amber-500/50 rounded px-1.5 py-0.5 text-xs font-mono text-amber-300 focus:outline-none"
                      title="Hora de Término (dejar vacío si sigue en ejecución)"
                    />
                    <button
                      v-if="formAjustes.hora_termino"
                      type="button"
                      @click="formAjustes.hora_termino = ''"
                      class="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-[10px] font-mono cursor-pointer"
                      title="Dejar término vacío (--:--) porque el servicio sigue en ejecución"
                    >
                      🗑️ --:--
                    </button>
                  </div>
                  <div v-else class="text-xs font-mono font-bold text-white mt-1">
                    <span v-if="reportLocal?.ajustes_analista?.modificado" class="line-through text-rose-400 mr-1 text-[11px]" title="Horario Original Reportado en Terreno">
                      {{ reportLocal.ajustes_analista.valores_originales?.hora_inicio }} ➔ {{ reportLocal.ajustes_analista.valores_originales?.hora_termino || '--:--' }}
                    </span>
                    <span :class="reportLocal?.ajustes_analista?.modificado ? 'text-emerald-400' : 'text-white'">
                      {{ formAjustes.hora_inicio }} ➔ {{ formAjustes.hora_termino || '--:-- (En ejecución)' }}
                    </span>
                    <span v-if="reportLocal?.ajustes_analista?.modificado" class="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded ml-1.5 uppercase font-sans font-bold inline-block">
                      Ajustado
                    </span>
                  </div>
                </div>

                <div class="pt-2 border-t border-white/5 mt-2 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-slate-400 font-medium">Colación:</span>
                    <div v-if="modoAjuste" class="flex items-center gap-1">
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0" 
                        max="4" 
                        v-model.number="formAjustes.horas_colacion"
                        class="w-14 bg-[#0a0f1e] border border-amber-500/50 rounded px-1.5 py-0.5 text-xs font-mono text-amber-300 text-center focus:outline-none"
                      />
                      <span class="text-[10px] text-slate-400">hrs</span>
                    </div>
                    <div v-else class="text-xs font-mono">
                      <span v-if="esColacionModificada" class="line-through text-rose-400 mr-1 text-[11px]">{{ reportLocal?.horas_colacion !== undefined ? reportLocal.horas_colacion : 1.0 }}h</span>
                      <span :class="esColacionModificada ? 'text-emerald-400 font-bold' : 'text-slate-300'">
                        {{ formAjustes.horas_colacion === 0 ? 'Sin colación (0h)' : `${formAjustes.horas_colacion}h` }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. Horómetro Motor -->
              <div 
                class="bg-[#050810] border rounded-xl p-3 flex flex-col justify-between" 
                :class="esDeltaHorometroAnomalo ? 'border-yellow-500/60 bg-yellow-950/20' : 'border-white/10'"
              >
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-slate-400 font-bold uppercase block">⚙️ Horómetro Motor</span>
                    <span v-if="esDeltaHorometroAnomalo" class="text-[8px] bg-yellow-500/20 text-yellow-300 font-mono font-bold px-1 rounded border border-yellow-500/40">
                      ⚠️ Anómalo
                    </span>
                  </div>
                  
                  <div v-if="modoAjuste" class="space-y-1 pt-1.5">
                    <div class="flex items-center gap-1 text-[10px] font-mono">
                      <input 
                        type="number" 
                        step="0.1" 
                        v-model.number="formAjustes.horometro_inicio"
                        class="w-16 bg-[#0a0f1e] border border-amber-500/50 rounded px-1.5 py-0.5 text-amber-300 text-center focus:outline-none"
                        title="Horómetro inicio"
                      />
                      <span class="text-slate-500">➔</span>
                      <input 
                        type="number" 
                        step="0.1" 
                        v-model.number="formAjustes.horometro_termino"
                        class="w-16 bg-[#0a0f1e] border border-amber-500/50 rounded px-1.5 py-0.5 text-amber-300 text-center focus:outline-none"
                        title="Horómetro término"
                      />
                    </div>
                  </div>
                  <div v-else class="text-xs font-mono font-bold text-amber-400 mt-1 truncate">
                    <div v-if="esHorometroModificado" class="text-[10px] line-through text-rose-400 font-mono">
                      {{ reportLocal?.horometro_inicio || 0 }} ➔ {{ reportLocal?.horometro_termino || 0 }}
                    </div>
                    <div>{{ formAjustes.horometro_inicio }} ➔ {{ formAjustes.horometro_termino }}</div>
                  </div>
                </div>

                <div class="pt-2 border-t border-white/5 mt-2 flex items-center justify-between">
                  <span class="text-[10px] text-slate-400">Δ Horas Motor:</span>
                  <strong class="text-xs font-mono" :class="esDeltaHorometroAnomalo ? 'text-yellow-400' : 'text-slate-300'">
                    {{ deltaHorometroCalculado }} hrs
                  </strong>
                </div>
              </div>

              <!-- 3. Odómetro Chasis (KM) -->
              <div class="bg-[#050810] border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <span class="text-[10px] text-slate-400 font-bold uppercase block">🛣️ Odómetro Chasis</span>
                  
                  <div v-if="modoAjuste" class="space-y-1 pt-1.5">
                    <div class="flex items-center gap-1 text-[10px] font-mono">
                      <input 
                        type="number" 
                        step="1" 
                        v-model.number="formAjustes.odometro_inicio"
                        class="w-16 bg-[#0a0f1e] border border-amber-500/50 rounded px-1.5 py-0.5 text-amber-300 text-center focus:outline-none"
                        title="Odómetro inicial (km)"
                      />
                      <span class="text-slate-500">➔</span>
                      <input 
                        type="number" 
                        step="1" 
                        v-model.number="formAjustes.odometro_termino"
                        class="w-16 bg-[#0a0f1e] border border-amber-500/50 rounded px-1.5 py-0.5 text-amber-300 text-center focus:outline-none"
                        title="Odómetro final (km)"
                      />
                    </div>
                  </div>
                  <div v-else class="text-xs font-mono font-bold text-slate-200 mt-1 truncate">
                    <div v-if="esOdometroModificado" class="text-[10px] line-through text-rose-400 font-mono">
                      {{ reportLocal?.odometro_inicio || 0 }} ➔ {{ reportLocal?.odometro_termino || 0 }}
                    </div>
                    <div>{{ formAjustes.odometro_inicio || 0 }} ➔ {{ formAjustes.odometro_termino || 0 }} km</div>
                  </div>
                </div>

                <div class="pt-2 border-t border-white/5 mt-2 flex items-center justify-between">
                  <span class="text-[10px] text-slate-400">Δ Distancia:</span>
                  <strong class="text-xs font-mono text-slate-300">
                    {{ deltaOdometroCalculado }} km
                  </strong>
                </div>
              </div>

              <!-- 4. Standby / Detención Operacional (Spec 84) -->
              <div 
                class="bg-[#050810] border rounded-xl p-3 flex flex-col justify-between"
                :class="(formAjustes.horas_standby_cliente > 0 || formAjustes.horas_standby_gsp > 0) ? 'border-amber-500/40 bg-amber-950/10' : 'border-white/10'"
              >
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-slate-400 font-bold uppercase block">⏳ Standby / Detención</span>
                    <span 
                      v-if="formAjustes.horas_standby_cliente > 0 || formAjustes.horas_standby_gsp > 0"
                      class="text-[8px] bg-amber-500/20 text-amber-300 font-mono font-bold px-1 rounded border border-amber-500/40"
                    >
                      Activo
                    </span>
                  </div>

                  <div v-if="modoAjuste" class="space-y-1.5 pt-1.5">
                    <div class="flex items-center justify-between gap-1 text-[10px] font-mono">
                      <span class="text-amber-400">Cli:</span>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0"
                        v-model.number="formAjustes.horas_standby_cliente"
                        class="w-14 bg-[#0a0f1e] border border-amber-500/50 rounded px-1.5 py-0.5 text-amber-300 text-center focus:outline-none"
                        title="Standby imputable a Cliente (horas)"
                      />
                      <span class="text-blue-400 ml-1">GSP:</span>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0"
                        v-model.number="formAjustes.horas_standby_gsp"
                        class="w-14 bg-[#0a0f1e] border border-amber-500/50 rounded px-1.5 py-0.5 text-amber-300 text-center focus:outline-none"
                        title="Standby imputable a GSP (horas)"
                      />
                    </div>
                    <input 
                      type="text" 
                      v-model="formAjustes.motivo_standby"
                      placeholder="Motivo detención..."
                      class="w-full bg-[#0a0f1e] border border-amber-500/50 rounded px-1.5 py-0.5 text-[10px] text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div v-else class="text-xs font-mono font-bold mt-1">
                    <div class="flex items-center justify-between">
                      <span class="text-amber-300">Cli: {{ Number(formAjustes.horas_standby_cliente || 0).toFixed(1) }}h</span>
                      <span class="text-slate-400">·</span>
                      <span class="text-blue-300">GSP: {{ Number(formAjustes.horas_standby_gsp || 0).toFixed(1) }}h</span>
                    </div>
                    <div v-if="formAjustes.motivo_standby" class="text-[10px] font-sans font-normal text-slate-400 italic mt-1 line-clamp-2" :title="formAjustes.motivo_standby">
                      "{{ formAjustes.motivo_standby }}"
                    </div>
                  </div>
                </div>

                <div class="pt-2 border-t border-white/5 mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Total Parada:</span>
                  <strong class="font-mono text-amber-300">
                    {{ (Number(formAjustes.horas_standby_cliente || 0) + Number(formAjustes.horas_standby_gsp || 0)).toFixed(1) }} hrs
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 2: MÉTRICAS DERIVADAS Y CONTRACTUALES (AUTO-CALCULADAS AUTOMÁTICAMENTE) -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>⚡</span>
                <span>Cálculo Automático de Horas y Facturación</span>
              </span>
              <span class="text-[10px] text-slate-400 font-mono">
                {{ formLiquidacionDia.regimen === 'URBANO'
                  ? `Política Urbana: Cobro Salida Base (${formLiquidacionDia.hora_salida_bodega || formAjustes.hora_inicio}) → Término (${formAjustes.hora_termino})`
                  : `Política Rural: Cobro Inicio Obra (${formAjustes.hora_inicio}) → Término (${formAjustes.hora_termino})` }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <!-- 4. Horas Efectivas / Operación Real -->
              <div class="bg-[#050810] border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <span class="text-[10px] text-slate-400 font-bold uppercase block">⏱️ Operación Real</span>
                  <div class="mt-1">
                    <div v-if="esHorasOperadasModificadas" class="text-[10px] line-through text-rose-400 font-mono">
                      Terreno: {{ reportLocal?.horas_operadas || 0 }}h
                    </div>
                    <div class="text-2xl font-black font-mono" :class="esHorasOperadasModificadas ? 'text-emerald-400' : 'text-white'">
                      {{ formatHorasHHMM(horasOperacionReal) }} <span class="text-[10px] text-slate-400 font-normal">HRS</span>
                    </div>
                  </div>
                </div>
                <div class="pt-2 border-t border-white/5 mt-2">
                  <span class="text-[10px] text-slate-400 block font-mono">
                    {{ formatHorasHHMM(horasComputablesCliente) }}h netas (incl. {{ formatHorasHHMM(formAjustes.horas_standby_cliente) }}h SB Cli)
                  </span>
                </div>
              </div>

              <!-- 5. Horas a Facturar (Calculadas con Piso Mínimo) -->
              <div 
                class="bg-[#050810] border rounded-xl p-3 flex flex-col justify-between" 
                :class="esHorasFacturablesModificadas ? 'border-amber-400 bg-amber-950/20' : 'border-amber-500/30 bg-amber-950/10'"
              >
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-amber-400 font-bold uppercase block">💰 A Facturar</span>
                    <span v-if="esHorasFacturablesModificadas" class="text-[8px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1 rounded border border-emerald-500/30">
                      Ajustado
                    </span>
                  </div>

                  <div class="mt-1">
                    <div v-if="esHorasFacturablesModificadas" class="text-[10px] line-through text-rose-400 font-mono">
                      Terreno: {{ formatHorasHHMM(reportLocal?.ajustes_analista?.valores_originales?.horas_facturables ?? reportLocal?.horas_operadas ?? reportLocal?.horas_facturables ?? 0) }}h
                    </div>
                    <div v-if="modoAjuste" class="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        v-model.number="formAjustes.horas_facturables"
                        :placeholder="horasFacturablesCalculadas.toFixed(1)"
                        class="w-24 bg-amber-950/40 border border-amber-500/50 rounded px-2 py-1 text-xl font-black font-mono text-amber-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        title="Horas a facturar ajustables para redondeo contable"
                      />
                      <span class="text-xs text-amber-300 font-mono">HRS</span>
                      <button
                        v-if="formAjustes.horas_facturables !== null && formAjustes.horas_facturables !== undefined"
                        type="button"
                        @click="formAjustes.horas_facturables = null"
                        class="text-[10px] text-amber-400/70 hover:text-amber-300 underline"
                        title="Restablecer a cálculo automático"
                      >
                        Auto
                      </button>
                    </div>
                    <div v-else class="text-2xl font-black font-mono text-amber-400">
                      {{ formatHorasHHMM(horasFacturablesCalculadas) }} <span class="text-[10px] text-amber-300 font-normal">HRS</span>
                    </div>
                  </div>
                </div>

                <div class="pt-2 border-t border-white/5 mt-2">
                  <span class="text-[10px] text-amber-500/80 block font-mono truncate">
                    {{ baseMinima > 0 ? `Base ${formatHorasHHMM(baseMinima)}h` : 'Sin mín. diario (Mensual)' }} · Imputables {{ formatHorasHHMM(horasComputablesCliente) }}h
                  </span>
                </div>
              </div>

              <!-- 6. Sobretiempo -->
              <div class="bg-[#050810] border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <span class="text-[10px] text-slate-400 font-bold uppercase block">⚡ Sobretiempo</span>
                  <div class="text-2xl font-black font-mono mt-1" :class="sobretiempoCalculado > 0 ? 'text-yellow-400' : 'text-slate-500'">
                    +{{ formatHorasHHMM(sobretiempoCalculado) }} <span class="text-[10px] font-normal">HRS</span>
                  </div>
                </div>
                <div class="pt-2 border-t border-white/5 mt-2">
                  <span class="text-[10px] text-slate-400 block font-mono truncate">
                    {{ baseMinima > 0 ? `Base ${baseMinima}h` : 'Sin mín. diario (Mensual)' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 3 (SPEC-106): LIQUIDACIÓN DIARIA DE PERSONAL Y VIÁTICOS (RRHH / CONTROL DE GESTIÓN) -->
          <div class="bg-[#080d1a] border border-cyan-500/30 rounded-xl p-3.5 space-y-3 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  👷 3. Liquidación Diaria de Personal y Viáticos (RRHH / Remuneraciones)
                </span>
                <span
                  class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                  :class="formLiquidacionDia.regimen === 'URBANO'
                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                    : 'bg-purple-500/15 text-purple-300 border-purple-500/40'"
                >
                  {{ formLiquidacionDia.regimen === 'URBANO' ? `POLÍTICA URBANA (${formLiquidacionDia.distancia_km || 12} km)` : `POLÍTICA RURAL (${formLiquidacionDia.distancia_km || 45} km)` }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-[10px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {{ formLiquidacionDia.categoria_label || 'Tabulador' }} · Sugerido ${{ formatMiles(formLiquidacionDia.tarifa_sugerida) }}/hr
                </span>
                <span
                  class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                  :class="esValidado
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'"
                >
                  {{ esValidado ? '✓ Validado RRHH' : '⏳ Por Verificar Analista' }}
                </span>
              </div>
            </div>

            <!-- FILA 1: OPERADOR PRINCIPAL -->
            <div class="bg-[#050810] border border-white/10 rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                    OPERADOR
                  </span>
                  <strong class="text-xs text-white font-semibold">{{ nombreOperadorMostrado }}</strong>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">
                  {{ formLiquidacionDia.regimen === 'URBANO'
                    ? `Política Urbana: Sin pago traslado · Solo horas reportadas (${formAjustes.hora_inicio} → ${formAjustes.hora_termino} -${formAjustes.horas_colacion}h col)`
                    : `Política Rural: En Obra (${formLiquidacionDia.hora_llegada_obra || formAjustes.hora_inicio} → ${formAjustes.hora_termino} -${formAjustes.horas_colacion}h col) + Dif. Positiva Traslado` }}
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
                <!-- Hrs Faena a Pagar -->
                <div>
                  <label class="text-[9.5px] text-slate-400 uppercase font-bold block mb-1">Hrs Faena Pagar</label>
                  <input
                    v-if="!readonly"
                    v-model.number="formLiquidacionDia.horas_faena_pagar"
                    @input="onCambioHorasLiq"
                    type="number"
                    step="0.5"
                    min="0"
                    class="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <div v-else class="text-sm font-mono font-bold text-white bg-black/40 px-2 py-1 rounded border border-white/5">
                    {{ formLiquidacionDia.horas_faena_pagar }}h
                  </div>
                </div>

                <!-- Hrs Flete a Pagar -->
                <div>
                  <label class="text-[9.5px] text-slate-400 uppercase font-bold block mb-1">Hrs Flete Pagar</label>
                  <input
                    v-if="!readonly"
                    v-model.number="formLiquidacionDia.horas_flete_pagar"
                    @input="onCambioHorasLiq"
                    type="number"
                    step="0.5"
                    min="0"
                    class="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <div v-else class="text-sm font-mono font-bold text-white bg-black/40 px-2 py-1 rounded border border-white/5">
                    {{ formLiquidacionDia.horas_flete_pagar }}h
                  </div>
                </div>

                <!-- Total Hrs Pagar -->
                <div>
                  <label class="text-[9.5px] text-cyan-300 uppercase font-bold block mb-1">Total Hrs Pagar</label>
                  <div class="text-sm font-mono font-black text-cyan-300 bg-cyan-950/30 px-2.5 py-1 rounded-lg border border-cyan-500/30 text-center">
                    {{ formatHorasHHMM(horasTotalesLiqOperador) }} hrs
                  </div>
                </div>

                <!-- Tarifa $/hr -->
                <div>
                  <label class="text-[9.5px] text-slate-400 uppercase font-bold block mb-1">Valor Hora ($/hr)</label>
                  <input
                    v-if="!readonly"
                    v-model.number="formLiquidacionDia.precio_unitario"
                    type="number"
                    step="500"
                    min="0"
                    class="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                  />
                  <div v-else class="text-sm font-mono font-bold text-amber-300 bg-black/40 px-2 py-1 rounded border border-white/5">
                    ${{ formatMiles(formLiquidacionDia.precio_unitario) }}
                  </div>
                </div>

                <!-- Subtotal Hrs Operador ($) -->
                <div>
                  <label class="text-[9.5px] text-emerald-400 uppercase font-bold block mb-1">Subtotal Hrs ($)</label>
                  <div class="text-sm font-mono font-black text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-right">
                    ${{ formatMiles(subtotalHoraOperadorLiq) }}
                  </div>
                </div>

                <!-- Viático Alimentación Operador ($) -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[9.5px] text-amber-300 uppercase font-bold">Viático Alim. ($)</label>
                    <span class="text-[9px] font-mono text-slate-400" title="Sugerido según escala por horas totales">
                      Sug: ${{ formatMiles(viaticoSugeridoOperador) }}
                    </span>
                  </div>
                  <input
                    v-if="!readonly"
                    v-model.number="formLiquidacionDia.monto_viatico_operador"
                    @input="formLiquidacionDia.viatico_manual = true"
                    type="number"
                    step="1000"
                    min="0"
                    class="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                  />
                  <div v-else class="text-sm font-mono font-bold text-amber-300 bg-black/40 px-2 py-1 rounded border border-white/5 text-right">
                    ${{ formatMiles(formLiquidacionDia.monto_viatico_operador) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- FILA 2: RIGGER / MANIOBRISTA (SI APLICA) -->
            <div v-if="tieneRigger" class="bg-[#050810] border border-white/10 rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    RIGGER
                  </span>
                  <strong class="text-xs text-white font-semibold">{{ nombreRiggerMostrado }}</strong>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">
                  Tarifa hora: $0 (Sueldo Base) · Devenga Viático Alimentación según horas jornada
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                <div>
                  <label class="text-[9.5px] text-slate-400 uppercase font-bold block mb-1">Hrs Jornada Rigger</label>
                  <input
                    v-if="!readonly"
                    v-model.number="formLiquidacionDia.horas_totales_rigger"
                    @input="onCambioHorasRiggerLiq"
                    type="number"
                    step="0.5"
                    min="0"
                    class="w-full bg-slate-900 border border-purple-500/40 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white focus:border-purple-400 focus:outline-none"
                  />
                  <div v-else class="text-sm font-mono font-bold text-white bg-black/40 px-2 py-1 rounded border border-white/5">
                    {{ formLiquidacionDia.horas_totales_rigger }}h
                  </div>
                </div>

                <div>
                  <label class="text-[9.5px] text-slate-400 uppercase font-bold block mb-1">Subtotal Hrs ($)</label>
                  <div class="text-xs font-mono text-slate-400 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                    $0 (Sueldo Base)
                  </div>
                </div>

                <div class="sm:col-span-2">
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[9.5px] text-amber-300 uppercase font-bold">Viático Alimentación Rigger ($)</label>
                    <span class="text-[9px] font-mono text-slate-400">
                      Sugerido ({{ formLiquidacionDia.horas_totales_rigger }}h): ${{ formatMiles(viaticoSugeridoRigger) }}
                    </span>
                  </div>
                  <input
                    v-if="!readonly"
                    v-model.number="formLiquidacionDia.monto_viatico_rigger"
                    @input="formLiquidacionDia.viatico_rigger_manual = true"
                    type="number"
                    step="1000"
                    min="0"
                    class="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                  />
                  <div v-else class="text-sm font-mono font-bold text-amber-300 bg-black/40 px-2 py-1 rounded border border-white/5 text-right">
                    ${{ formatMiles(formLiquidacionDia.monto_viatico_rigger) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- PIE RESUMEN SECCIÓN 3 -->
            <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-slate-300">
              <span class="text-[10px] text-slate-400">
                ⚡ Se aprueba con el Report Diario para Cierre Mensual RRHH y se traspasa automáticamente al ITS.
              </span>
              <div class="flex items-center gap-3">
                <span>Hrs Operador: <strong class="text-emerald-400">${{ formatMiles(subtotalHoraOperadorLiq) }}</strong></span>
                <span>Viáticos Día: <strong class="text-amber-300">${{ formatMiles(totalViaticosDiaLiq) }}</strong></span>
                <span class="bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 px-2 py-0.5 rounded font-bold">
                  Total Día Personal: ${{ formatMiles(subtotalHoraOperadorLiq + totalViaticosDiaLiq) }}
                </span>
              </div>
            </div>
          </div>

          <!-- OBSERVACIONES DE MANIOBRA REGISTRADAS POR EL OPERADOR -->
          <div class="bg-[#080d1a] border border-white/10 rounded-xl p-3 space-y-1.5">
            <span class="text-[11px] text-slate-300 font-bold uppercase tracking-wider block">
              📝 Maniobras / Observaciones Registradas en Terreno
            </span>
            <p class="text-xs text-slate-200 italic bg-black/40 p-2.5 rounded-lg border border-white/5 leading-relaxed max-h-20 overflow-y-auto">
              {{ reportLocal?.observacion_trabajo || 'Sin observaciones adicionales registradas para este día.' }}
            </p>
            <div v-if="reportLocal?.notas_mecanicas_gsp" class="text-[11px] text-slate-300 bg-amber-950/20 border border-amber-500/20 p-2 rounded-lg">
              <strong class="text-amber-400">🔧 Taller Mecánico GSP:</strong> {{ reportLocal.notas_mecanicas_gsp }}
            </div>
          </div>

          <!-- TRAZABILIDAD PREVIA DE AUDITORÍA (SI YA FUE AUDITADO) -->
          <div v-if="reportLocal?.ajustes_analista?.modificado" class="bg-amber-950/15 border border-amber-500/30 rounded-xl p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                🛡️ Trazabilidad de Auditoría Operativa
              </span>
              <span class="text-[10px] font-mono text-slate-400">
                Ajustado el {{ formatDateTime(reportLocal?.ajustes_analista?.fecha_ajuste) }}
              </span>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div class="bg-black/40 px-2 py-1.5 rounded border border-white/5">
                <span class="text-[9px] text-slate-400 block uppercase">Horario Faena</span>
                <span class="line-through text-rose-400 mr-1">{{ reportLocal?.ajustes_analista?.valores_originales?.hora_inicio || '08:00' }}➔{{ reportLocal?.ajustes_analista?.valores_originales?.hora_termino || '18:00' }}</span>
                <strong class="text-emerald-400 block">➔ {{ reportLocal?.ajustes_analista?.valores_ajustados?.hora_inicio }}➔{{ reportLocal?.ajustes_analista?.valores_ajustados?.hora_termino }}</strong>
              </div>
              <div class="bg-black/40 px-2 py-1.5 rounded border border-white/5">
                <span class="text-[9px] text-slate-400 block uppercase">Facturables</span>
                <span class="line-through text-rose-400 mr-1">{{ reportLocal?.ajustes_analista?.valores_originales?.horas_facturables }}h</span>
                <strong class="text-emerald-400">➔ {{ reportLocal?.ajustes_analista?.valores_ajustados?.horas_facturables }}h</strong>
              </div>
              <div class="bg-black/40 px-2 py-1.5 rounded border border-white/5">
                <span class="text-[9px] text-slate-400 block uppercase">Horómetro</span>
                <span class="line-through text-rose-400 mr-1">{{ reportLocal?.ajustes_analista?.valores_originales?.horometro_termino }}</span>
                <strong class="text-emerald-400">➔ {{ reportLocal?.ajustes_analista?.valores_ajustados?.horometro_termino }}</strong>
              </div>
              <div class="bg-black/40 px-2 py-1.5 rounded border border-white/5">
                <span class="text-[9px] text-slate-400 block uppercase">Odómetro</span>
                <span class="line-through text-rose-400 mr-1">{{ reportLocal?.ajustes_analista?.valores_originales?.odometro_termino || 0 }}km</span>
                <strong class="text-emerald-400">➔ {{ reportLocal?.ajustes_analista?.valores_ajustados?.odometro_termino }}km</strong>
              </div>
            </div>
            
            <div v-if="reportLocal?.ajustes_analista?.observacion_ajuste" class="text-[11px] text-amber-200 italic bg-black/30 p-2 rounded border border-amber-500/20">
              "{{ reportLocal.ajustes_analista.observacion_ajuste }}"
            </div>
          </div>

        </div>

        <!-- ========================================== -->
        <!-- COLUMNA DERECHA (5 COLS): MANDANTE, MAPA GPS, FOTOS Y VALIDACIÓN -->
        <!-- ========================================== -->
        <div class="lg:col-span-5 flex flex-col gap-3 justify-between">
          
          <!-- 1. CONFORMIDAD Y FIRMA MANDANTE + MAPA GPS -->
          <div class="bg-[#080d1a] border border-amber-500/30 rounded-xl p-3.5 space-y-2.5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                ✍️ Firma Mandante & Ubicación GPS
              </span>
              <span class="text-[10px] text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                Sello: {{ formatDateTime(reportLocal?.fecha_registro) }}
              </span>
            </div>

            <!-- Datos supervisor mandante -->
            <div class="grid grid-cols-3 gap-2 bg-black/40 p-2 rounded-lg border border-white/5 text-xs">
              <div>
                <span class="text-slate-400 text-[10px] uppercase font-bold block">Supervisor</span>
                <strong class="text-white text-[11px] truncate block">{{ reportLocal?.cliente_nombre || 'Supervisor Mandante' }}</strong>
              </div>
              <div>
                <span class="text-slate-400 text-[10px] uppercase font-bold block">RUT</span>
                <strong class="text-amber-300 font-mono text-[11px] truncate block">{{ reportLocal?.cliente_rut || 'S/R' }}</strong>
              </div>
              <div>
                <span class="text-slate-400 text-[10px] uppercase font-bold block">Cargo</span>
                <strong class="text-slate-200 text-[11px] truncate block">{{ reportLocal?.cliente_cargo || 'Supervisor Obra' }}</strong>
              </div>
            </div>

            <!-- DUAL SUB-GRID: FIRMA MANUSCRITA + MAPA LEAFLET INTERACTIVO -->
            <div class="grid grid-cols-2 gap-2.5">
              <!-- LADO IZQUIERDO: LIENZO DE LA FIRMA -->
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-slate-300 uppercase block">✍️ Trazo de Firma</span>
                <div class="bg-white rounded-xl p-1.5 flex items-center justify-center border border-slate-300 h-28 shadow-inner overflow-hidden">
                  <img 
                    v-if="reportLocal?.cliente_firma_canvas_base64" 
                    :src="reportLocal?.cliente_firma_canvas_base64" 
                    alt="Firma del Mandante" 
                    class="max-h-24 max-w-full object-contain"
                  />
                  <div v-else class="text-slate-400 text-xs italic text-center p-2">
                    Sin firma manuscrita disponible
                  </div>
                </div>
              </div>

              <!-- LADO DERECHO: MAPA GPS LEAFLET -->
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-emerald-400 uppercase block">📍 Georreferencia GPS</span>
                  <a 
                    v-if="tieneCoordenadasGPS" 
                    :href="googleMapsUrl" 
                    target="_blank" 
                    class="text-[9.5px] text-blue-400 hover:text-blue-300 underline font-mono"
                    title="Abrir ubicación en Google Maps"
                  >
                    ↗ Maps
                  </a>
                </div>
                
                <div class="relative bg-slate-950 rounded-xl border border-white/10 h-28 overflow-hidden">
                  <div 
                    v-show="tieneCoordenadasGPS"
                    ref="mapContainerRef" 
                    class="w-full h-full z-0"
                  ></div>

                  <div 
                    v-if="!tieneCoordenadasGPS" 
                    class="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[11px] p-2 text-center"
                  >
                    <span>🛰️</span>
                    <span>Sin coordenadas GPS registradas</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Estampa GPS y Precisión -->
            <div class="flex items-center justify-between text-[10px] text-slate-300 bg-black/40 px-2.5 py-1 rounded border border-white/5 font-mono">
              <span class="truncate">
                📍 GPS: {{ tieneCoordenadasGPS ? `${Number(reportLocal.latitud_inicio_servicio).toFixed(4)}, ${Number(reportLocal.longitud_inicio_servicio).toFixed(4)}` : 'Registrado en faena' }}
              </span>
              <span v-if="reportLocal?.accuracy_firma" class="text-amber-400 font-bold flex-shrink-0 ml-1">
                ±{{ Number(reportLocal?.accuracy_firma).toFixed(0) }}m
              </span>
            </div>
          </div>

          <!-- 2. EVIDENCIA FOTOGRÁFICA -->
          <div class="bg-[#080d1a] border border-white/10 rounded-xl p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                📸 Evidencias Panel / Horómetro
              </span>
            </div>

            <div v-if="tieneFotos" class="grid grid-cols-2 gap-2">
              <div 
                v-if="reportLocal?.foto_tablero_inicio || reportLocal?.foto_horometro" 
                class="bg-black/50 p-2 rounded-lg border border-emerald-500/30 text-center space-y-1"
              >
                <span class="text-[10px] font-bold text-emerald-400 uppercase block">🟢 Inicio (Mañana)</span>
                <div class="h-20 overflow-hidden rounded bg-black flex items-center justify-center border border-white/10">
                  <img 
                    :src="reportLocal?.foto_tablero_inicio || reportLocal?.foto_horometro" 
                    alt="Foto Inicio" 
                    class="w-full h-20 object-contain hover:scale-105 transition-transform cursor-pointer"
                    @click="abrirFotoGrande(reportLocal?.foto_tablero_inicio || reportLocal?.foto_horometro)"
                    title="Clic para ampliar foto"
                  />
                </div>
                <!-- SPEC-098 v1.1.0: Switch privacidad Foto Inicio -->
                <div class="pt-1.5 flex items-center justify-center">
                  <label v-if="!esValidado || modoAjuste" class="flex items-center gap-1.5 text-[10px] text-slate-300 hover:text-white cursor-pointer select-none">
                    <input type="checkbox" v-model="privacidadPdf.incluir_foto_inicio" class="rounded text-emerald-500 focus:ring-0 cursor-pointer" />
                    <span :class="privacidadPdf.incluir_foto_inicio ? 'text-emerald-400 font-bold' : 'text-slate-400'">
                      {{ privacidadPdf.incluir_foto_inicio ? '✓ Adjuntar en PDF Mandante' : '✗ No adjuntar en PDF' }}
                    </span>
                  </label>
                  <span v-else class="text-[9px] font-mono px-1.5 py-0.5 rounded" :class="privacidadPdf.incluir_foto_inicio ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-white/10'">
                    {{ privacidadPdf.incluir_foto_inicio ? '📄 En PDF Mandante' : '🔒 Excluido de PDF' }}
                  </span>
                </div>
              </div>

              <div 
                v-if="reportLocal?.foto_tablero_termino" 
                class="bg-black/50 p-2 rounded-lg border border-rose-500/30 text-center space-y-1"
              >
                <span class="text-[10px] font-bold text-rose-400 uppercase block">🔴 Término (Tarde)</span>
                <div class="h-20 overflow-hidden rounded bg-black flex items-center justify-center border border-white/10">
                  <img 
                    :src="reportLocal?.foto_tablero_termino" 
                    alt="Foto Término" 
                    class="w-full h-20 object-contain hover:scale-105 transition-transform cursor-pointer"
                    @click="abrirFotoGrande(reportLocal?.foto_tablero_termino)"
                    title="Clic para ampliar foto"
                  />
                </div>
                <!-- SPEC-098 v1.1.0: Switch privacidad Foto Término -->
                <div class="pt-1.5 flex items-center justify-center">
                  <label v-if="!esValidado || modoAjuste" class="flex items-center gap-1.5 text-[10px] text-slate-300 hover:text-white cursor-pointer select-none">
                    <input type="checkbox" v-model="privacidadPdf.incluir_foto_termino" class="rounded text-emerald-500 focus:ring-0 cursor-pointer" />
                    <span :class="privacidadPdf.incluir_foto_termino ? 'text-emerald-400 font-bold' : 'text-slate-400'">
                      {{ privacidadPdf.incluir_foto_termino ? '✓ Adjuntar en PDF Mandante' : '✗ No adjuntar en PDF' }}
                    </span>
                  </label>
                  <span v-else class="text-[9px] font-mono px-1.5 py-0.5 rounded" :class="privacidadPdf.incluir_foto_termino ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-white/10'">
                    {{ privacidadPdf.incluir_foto_termino ? '📄 En PDF Mandante' : '🔒 Excluido de PDF' }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="text-slate-400 text-xs italic bg-black/30 p-2 rounded-lg border border-dashed border-white/10 flex items-center justify-center gap-2">
              <span>📷</span>
              <span>Sin fotografías de panel registradas por el operador en este reporte.</span>
            </div>
          </div>

          <!-- 2.B REQ-1099: DOCUMENTOS Y FOTOGRAFÍAS ASOCIADOS AL DÍA DE SERVICIO -->
          <div class="bg-[#080d1a] border border-cyan-500/30 rounded-xl p-3 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>📎</span>
                <span>Documentos y Fotografías del Día {{ reportLocal?.dia_correlativo || 1 }}</span>
              </span>
              <button
                type="button"
                @click="dispararSelectorDocumentoDia"
                class="px-2.5 py-1 rounded-lg bg-cyan-600/25 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/40 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="Adjuntar cualquier documento, report físico o foto de terreno a este día"
              >
                <span>+ Adjuntar Documento</span>
              </button>
            </div>

            <!-- Input oculto + Barra de confirmación de subida -->
            <input
              ref="inputArchivoDocVisorRef"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              class="hidden"
              @change="onCambioArchivoDocVisor"
            />

            <div
              v-if="mostrarFormAdjuntoDia || archivoDocVisor"
              class="bg-cyan-950/30 border border-cyan-500/40 rounded-lg p-2.5 space-y-2 animate-fadeIn"
            >
              <div class="flex items-center justify-between text-[11px] font-mono text-cyan-200">
                <span class="truncate font-bold">
                  {{ archivoDocVisor ? `📄 ${archivoDocVisor.name}` : 'Seleccione un archivo o foto para este día' }}
                </span>
                <button
                  type="button"
                  @click="cancelarAdjuntoDiaVisor"
                  class="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  v-model="tituloDocVisor"
                  placeholder="Descripción (ej: Report físico, Foto situación en obra...)"
                  class="flex-1 bg-[#050810] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  @click="subirDocumentoDiaDesdeVisor"
                  :disabled="!archivoDocVisor || subiendoDocVisor"
                  class="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {{ subiendoDocVisor ? '⏳ Subiendo...' : '📎 Subir' }}
                </button>
              </div>
            </div>

            <!-- Lista de documentos adjuntos al día -->
            <div v-if="documentosDiaVisor.length > 0" class="space-y-1.5 max-h-32 overflow-y-auto">
              <div
                v-for="doc in documentosDiaVisor"
                :key="doc.id_doc || doc.nombre_archivo"
                class="flex items-center justify-between gap-2 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              >
                <a
                  :href="getUrlDocumentoVisor(doc)"
                  target="_blank"
                  class="flex items-center gap-1.5 text-cyan-300 hover:text-white hover:underline truncate"
                  :title="doc.nombre_archivo || doc.titulo"
                >
                  <span>📄</span>
                  <span class="truncate font-semibold">{{ doc.titulo || doc.nombre_archivo }}</span>
                  <span class="text-[10px] text-cyan-400 shrink-0">↗ Ver</span>
                </a>
                <div class="flex items-center gap-2 shrink-0">
                  <!-- SPEC-098 v1.1.0: Casilla granular por documento del día -->
                  <label v-if="!esValidado || modoAjuste" class="flex items-center gap-1 text-[10px] cursor-pointer select-none" title="Incluir en PDF oficial de cliente">
                    <input type="checkbox" :checked="isDocIncluidoEnPdf(doc.id_doc)" @change="toggleDocEnPdf(doc.id_doc, $event.target.checked)" class="rounded text-cyan-500 focus:ring-0 cursor-pointer" />
                    <span :class="isDocIncluidoEnPdf(doc.id_doc) ? 'text-cyan-300 font-bold' : 'text-slate-400'">PDF</span>
                  </label>
                  <span v-else class="text-[9px] font-mono px-1.5 py-0.5 rounded" :class="isDocIncluidoEnPdf(doc.id_doc) ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'">
                    {{ isDocIncluidoEnPdf(doc.id_doc) ? 'PDF' : 'Interno' }}
                  </span>
                  <button
                    v-if="!readonly && doc.id_doc && (!esValidado || modoAjuste)"
                    type="button"
                    @click="quitarDocumentoDiaDesdeVisor(doc)"
                    class="text-slate-400 hover:text-rose-400 text-xs cursor-pointer px-1"
                    title="Quitar documento del día"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <div v-else-if="!mostrarFormAdjuntoDia" class="text-slate-400 text-[11px] italic bg-black/30 p-2 rounded-lg border border-dashed border-white/10 flex items-center justify-between">
              <span>Sin documentos o fotografías adicionales adjuntas en este día.</span>
            </div>
          </div>

          <!-- 3. CAJA DE VALIDACIÓN Y AUDITORÍA DEL ANALISTA -->
          <div 
            class="border rounded-xl p-3.5 space-y-2.5" 
            :class="esValidado && !modoAjuste ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-slate-900/80 border-white/15'"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" :class="esValidado && !modoAjuste ? 'text-emerald-400' : 'text-slate-200'">
                🛡️ Control de Gestión / Auditoría FES
              </span>
              <span v-if="esValidado && !modoAjuste" class="text-[10px] text-emerald-300 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Certificado FES: {{ formatDateTime(reportLocal?.fecha_firma_fes || reportLocal?.fecha_validacion) }}
              </span>
            </div>

            <div v-if="esValidado && !modoAjuste" class="text-xs text-slate-200 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span>Validador FES: <strong class="text-white">{{ reportLocal?.validador_nombre || 'Sergio Gajardo' }}</strong></span>
                <span v-if="reportLocal?.validador_rut" class="text-[11px] text-slate-400 font-mono">RUT: {{ reportLocal.validador_rut }}</span>
              </div>

              <!-- SELLO FES OFICIAL -->
              <div v-if="reportLocal?.codigo_validacion_fes || reportLocal?.id_doc_pdf" class="bg-black/50 border border-emerald-500/30 rounded-lg p-2.5 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-bold">
                    <span>🔐</span>
                    <span>Sello Digital: {{ reportLocal?.codigo_validacion_fes || 'FES-CERTIFICADO' }}</span>
                  </div>
                  <span class="text-[9px] text-slate-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">Ley 19.799</span>
                </div>
                <div class="flex items-center gap-2 pt-0.5">
                  <a
                    :href="urlPdfOficial"
                    target="_blank"
                    class="flex-1 py-1.5 px-3 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white rounded-lg text-xs font-bold font-mono transition-colors text-center border border-red-500/40 flex items-center justify-center gap-1.5"
                  >
                    <span>📄</span>
                    <span>Ver PDF Oficial</span>
                  </a>
                  <a
                    :href="urlDescargaPdfOficial"
                    target="_blank"
                    class="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors text-center border border-white/10 flex items-center gap-1"
                    title="Descargar archivo PDF oficial"
                  >
                    <span>⬇️</span>
                    <span>Descargar</span>
                  </a>
                </div>
              </div>

              <p class="text-slate-300 italic bg-black/40 p-2 rounded-lg border border-white/5 text-xs">
                "{{ reportLocal?.obs_validador || 'Report validado conforme.' }}"
              </p>

              <div v-if="reportLocal?.observaciones_cliente || reportLocal?.ajustes_analista?.observaciones_cliente" class="bg-sky-950/30 border border-sky-500/30 rounded-lg p-2.5 text-xs text-sky-200">
                <span class="text-[10px] text-sky-400 font-bold uppercase tracking-wider block mb-1">
                  📄 Observación para el Cliente (Visible en PDF Oficial):
                </span>
                <span class="italic">"{{ reportLocal?.observaciones_cliente || reportLocal?.ajustes_analista?.observaciones_cliente }}"</span>
              </div>
            </div>

            <div v-else-if="readonly" class="bg-amber-950/20 border border-amber-500/40 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div class="flex items-center gap-2 text-amber-300 font-bold font-mono text-[11px]">
                <span>👁️</span>
                <span>MODO CONSULTA (SOLO LECTURA)</span>
              </div>
              <p class="text-slate-300 text-[11px] leading-relaxed">
                Este Report Diario se encuentra pendiente de validación. La auditoría horaria, ajuste de colación/sobretiempo y certificación con PIN FES se realiza <strong>exclusivamente por el Analista de Control de Gestión en el Cockpit PMO (Torre de Control)</strong>.
              </p>
            </div>

            <div v-else class="space-y-2.5">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                    🔒 {{ hayModificaciones ? 'Observaciones de Validación / Justificación (Interno):' : 'Observaciones de Validación (Interno - Opcional):' }}
                  </label>
                  <button
                    v-if="esValidado && esObsValidacionModificada"
                    type="button"
                    @click="guardarObsValidadorDirecto"
                    :disabled="guardandoObsDirecto"
                    class="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-mono font-black cursor-pointer disabled:opacity-50"
                  >
                    {{ guardandoObsDirecto ? '⏳ Guardando...' : '💾 Actualizar' }}
                  </button>
                </div>
                <textarea 
                  v-model="obsValidacion" 
                  rows="2"
                  :placeholder="hayModificaciones ? 'Ej: Se descuenta 1.0 hr por colación extendida según telemetría GPS...' : 'Ej: Cuadratura horaria conforme con la OT y parte de terreno...'" 
                  class="w-full bg-[#050810] border border-white/20 rounded-lg p-2 text-xs text-white focus:border-amber-400 focus:outline-none transition-colors resize-none"
                ></textarea>
              </div>

              <div>
                <label class="text-[11px] font-bold text-sky-400 block uppercase tracking-wider mb-1">
                  📄 Observaciones para el Cliente (Visible en PDF Oficial):
                </label>
                <textarea 
                  v-model="formAjustes.observaciones_cliente" 
                  rows="2"
                  placeholder="Ej: Se acuerda cobro de 5.0 hrs por detención operativa debido a pinchazo hasta las 13:00 hrs acordado con supervisor..." 
                  class="w-full bg-[#050810] border border-sky-500/40 rounded-lg p-2 text-xs text-sky-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none transition-colors resize-none"
                ></textarea>
              </div>

              <div class="text-[10px] text-slate-400 flex items-center justify-between">
                <span>🔐 Requiere PIN de 4 dígitos para certificar</span>
                <span v-if="hayModificaciones" class="text-amber-400 font-bold">⚠️ Con cambios pendientes</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 3. FOOTER FIJO (SIEMPRE VISIBLE, CON BOTÓN GUARDAR Y CERRAR) -->
      <div class="bg-[#050810] px-5 py-3 border-t border-white/10 flex justify-between items-center flex-shrink-0">
        <!-- Lado Izquierdo: Herramientas de edición (Oculto en modo readonly) -->
        <div v-if="!readonly" class="flex items-center gap-3">
          <button 
            @click="toggleModoEdicion" 
            type="button" 
            class="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <span>{{ modoAjuste ? '✕ Cerrar Modo Edición' : '✏️ Editar Datos Terreno' }}</span>
          </button>
          
          <button 
            v-if="hayModificaciones" 
            @click="restablecerAjustes" 
            type="button" 
            class="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
          >
            ↺ Revertir Cambios
          </button>

          <span v-if="hayModificaciones" class="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 hidden sm:inline-block">
            Modificaciones no guardadas
          </span>
        </div>

        <!-- Lado Derecho: Acciones de Guardar / PDF / Cerrar -->
        <div class="flex items-center gap-2.5">
          <!-- BOTÓN VER PDF SI YA ESTÁ VALIDADO -->
          <a
            v-if="reportLocal?.id_doc_pdf"
            :href="urlPdfOficial"
            target="_blank"
            class="px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/40 shadow-sm"
            title="Abrir PDF Oficial con Firma FES y georreferencia"
          >
            <span>📄</span>
            <span>Ver PDF Oficial</span>
          </a>

          <button 
            @click="cerrar" 
            type="button"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/10"
          >
            Cerrar Visor
          </button>

          <!-- BOTÓN DISPARADOR DE VALIDACIÓN / GUARDADO CON PIN FES (Solo visible para Analista) -->
          <button
            v-if="!readonly"
            @click="abrirModalPin"
            :disabled="validando"
            type="button"
            class="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            :class="hayModificaciones 
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/30 font-black' 
              : (esValidado ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30')"
          >
            <span v-if="validando">⏳ Procesando...</span>
            <span v-else-if="esValidado && modoAjuste">💾 Guardar Nuevos Ajustes con PIN</span>
            <span v-else-if="hayModificaciones">⚠️ Guardar Ajustes con PIN FES</span>
            <span v-else-if="esValidado">🔐 Re-validar con PIN FES</span>
            <span v-else>🔐 Validar con PIN y Emitir PDF</span>
          </button>
        </div>
      </div>

    </div>

    <!-- ============================================================== -->
    <!-- 4. SUBMODAL DE FIRMA ELECTRÓNICA SIMPLE (PIN DE 4 DÍGITOS)     -->
    <!-- ============================================================== -->
    <div 
      v-if="mostrarModalPin" 
      class="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn"
      @click.self="cerrarModalPin"
    >
      <div class="bg-[#0b1021] border border-cyan-500/50 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-cyan-950/60 flex flex-col gap-4 text-slate-200">
        <!-- Cabecera Submodal -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xl shadow-inner">
              🔐
            </div>
            <div>
              <h4 class="text-sm font-black text-white font-mono uppercase tracking-wider">Firma Electrónica Simple (FES)</h4>
              <span class="text-[11px] text-cyan-400 font-medium">Validación & Certificación de Report Diario</span>
            </div>
          </div>
          <button 
            @click="cerrarModalPin" 
            class="text-slate-400 hover:text-white text-xl p-1 leading-none cursor-pointer"
            title="Cancelar"
          >
            ✕
          </button>
        </div>

        <!-- Ficha Resumen del Firmante y Operación -->
        <div class="bg-black/50 border border-white/10 rounded-xl p-3.5 text-xs space-y-1.5 font-mono">
          <div class="flex justify-between items-center text-slate-300">
            <span class="text-[11px] text-slate-400">Analista Firmante:</span>
            <strong class="text-white">{{ currentUserAnalista.nombre }}</strong>
          </div>
          <div class="flex justify-between items-center text-slate-300">
            <span class="text-[11px] text-slate-400">RUT Analista:</span>
            <strong class="text-cyan-300">{{ currentUserAnalista.rut || '9.161.957-1' }}</strong>
          </div>
          <div class="flex justify-between items-center text-slate-300">
            <span class="text-[11px] text-slate-400">OT / Proyecto:</span>
            <strong class="text-amber-400">{{ reportLocal?.codi_proyecto || 'GSP-OT' }} (Día {{ reportLocal?.dia_correlativo || 1 }})</strong>
          </div>
          <div class="flex justify-between items-center text-slate-300">
            <span class="text-[11px] text-slate-400">Horas a Facturar:</span>
            <strong class="text-emerald-400">{{ horasFacturablesCalculadas }} hrs</strong>
          </div>
          <div class="flex justify-between items-center text-slate-300 border-t border-white/10 pt-1.5 mt-1">
            <span class="text-[11px] text-slate-400">Hrs Pagar Operador (RRHH):</span>
            <strong class="text-cyan-300">{{ horasTotalesLiqOperador }} hrs · ${{ formatMiles(subtotalHoraOperadorLiq) }}</strong>
          </div>
          <div class="flex justify-between items-center text-slate-300">
            <span class="text-[11px] text-slate-400">Viáticos Alimentación Día:</span>
            <strong class="text-amber-300">${{ formatMiles(totalViaticosDiaLiq) }}</strong>
          </div>
        </div>

        <!-- Explicación de Efectos Legales y Operativos -->
        <p class="text-[11px] text-slate-300 leading-relaxed bg-cyan-950/20 border border-cyan-500/20 rounded-lg p-2.5">
          Al ingresar su <strong>PIN de 4 dígitos</strong>, el sistema estampará su sello criptográfico FES, generará el <strong>PDF Oficial con doble firma</strong> (Mandante + Analista), lo incorporará automáticamente al <strong>Dossier de Documentos de la OT</strong> y enviará la notificación por correo con el link directo de descarga.
        </p>

        <!-- Formulario PIN -->
        <form @submit.prevent="ejecutarValidacionConPin" class="space-y-4">
          <div>
            <label class="block text-center text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2.5">
              Ingrese su PIN Secreto (4 Dígitos)
            </label>
            
            <div class="flex justify-center items-center gap-3">
              <input
                v-for="(digit, idx) in 4"
                :key="idx"
                :ref="el => setPinInputRef(el, idx)"
                v-model="pinDigits[idx]"
                type="password"
                maxlength="1"
                inputmode="numeric"
                pattern="[0-9]*"
                class="w-12 h-14 text-center text-2xl font-mono font-bold bg-[#050810] border-2 rounded-xl text-cyan-300 focus:outline-none transition-all shadow-inner"
                :class="errorPin 
                  ? 'border-rose-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30' 
                  : 'border-white/20 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30'"
                @input="onPinInput(idx, $event)"
                @keydown="onPinKeydown(idx, $event)"
                @paste="onPinPaste"
              />
            </div>

            <!-- Error de PIN -->
            <div v-if="errorPin" class="text-center text-rose-400 text-xs font-semibold mt-2.5 flex items-center justify-center gap-1.5 animate-fadeIn">
              <span>⚠️</span>
              <span>{{ errorPin }}</span>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-3 pt-2">
            <button
              @click="cerrarModalPin"
              type="button"
              class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-white/10"
            >
              Cancelar
            </button>

            <button
              type="submit"
              :disabled="pinCompleto.length !== 4 || validando"
              class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50"
            >
              <span v-if="validando">⏳ Certificando FES...</span>
              <span v-else>🔐 Firmar y Emitir PDF</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL LIGHTBOX FOTO COMPLETA -->
    <div 
      v-if="fotoGrandeUrl" 
      class="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-4 cursor-pointer"
      @click="fotoGrandeUrl = null"
    >
      <div class="relative max-w-5xl max-h-[90vh]" @click.stop>
        <img :src="fotoGrandeUrl" alt="Foto Ampliada Horómetro" class="max-w-full max-h-[88vh] rounded-xl object-contain border border-white/20 shadow-2xl" />
        <button 
          @click="fotoGrandeUrl = null" 
          class="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white rounded-full w-9 h-9 font-bold flex items-center justify-center border-2 border-white shadow-lg cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import apiAxios from '../../services/api'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  report: {
    type: Object,
    default: () => ({})
  },
  apiUrl: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  },
  modoEdicionInicial: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'report-validado'])

// Estado reactivo local del report
const reportLocal = ref({})
const obsValidacion = ref('')
const validando = ref(false)
const fotoGrandeUrl = ref(null)
const modoAjuste = ref(false)

// Referencia al mapa de la firma
const mapContainerRef = ref(null)
let leafletMap = null

const usuariosLista = ref([])

const cargarUsuariosOperativos = async () => {
  if (usuariosLista.value.length > 0) return
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
    const raw = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (data?.usuarios || []))
    usuariosLista.value = raw
      .filter(u => u && u.flag_activo !== false)
      .map(u => ({
        id_user: Number(u.id_user),
        nombre_completo: u.nombre_user || u.name_user || `${u.name_frst || u.user_name || ''} ${u.apellido_pat || u.user_lastname || ''}`.trim() || `Usuario #${u.id_user}`,
        cargo: u.json_data?.cargo || u.cargo || ''
      }))
  } catch (e) {
    console.warn('[ModalVisorReport] Error cargando usuarios:', e)
  }
}

const usuariosOperativos = computed(() => usuariosLista.value)

// Formulario de ajustes de lo reportado por operaciones
const formAjustes = ref({
  hora_inicio: '08:00',
  hora_termino: '18:00',
  horas_colacion: 1.0,
  horometro_inicio: 0,
  horometro_termino: 0,
  odometro_inicio: 0,
  odometro_termino: 0,
  id_user_operador: null,
  id_user_rigger: null,
  horas_standby_cliente: 0,
  horas_standby_gsp: 0,
  motivo_standby: '',
  horas_facturables: null
})

// SPEC-106: Formulario de Liquidación Diaria de Personal y Viáticos (RRHH / Control de Gestión)
const formLiquidacionDia = ref({
  regimen: 'URBANO',
  distancia_km: 12,
  categoria_label: 'Camión Pluma / Grúa',
  hora_salida_bodega: '08:00',
  hora_llegada_obra: '08:00',
  horas_faena_pagar: 9,
  horas_flete_pagar: 0,
  tarifa_sugerida: 5000,
  precio_unitario: 5000,
  monto_viatico_operador: 8000,
  horas_totales_rigger: 0,
  monto_viatico_rigger: 0,
  horas_manual: false,
  viatico_manual: false,
  horas_rigger_manual: false,
  viatico_rigger_manual: false
})

const calcularViaticoPorHorasFrontend = (horasTotales) => {
  const h = Math.floor(Number(horasTotales) || 0)
  if (h < 8) return 0
  return Math.min(18000, 7000 + (h - 8) * 1000)
}

const formatMiles = (val) => {
  const n = Math.round(Number(val) || 0)
  return n.toLocaleString('es-CL')
}

const inicializarLiquidacionDesdeReport = (rep) => {
  const liq = rep?.liquidacion_personal_dia || rep?.ajustes_analista?.liquidacion_personal_dia || {}
  const hFaena = liq.horas_faena_pagar !== undefined && liq.horas_faena_pagar !== null
    ? Number(liq.horas_faena_pagar)
    : Number(rep?.horas_facturables || rep?.horas_operadas || 9)
  const hFlete = liq.horas_flete_pagar !== undefined && liq.horas_flete_pagar !== null
    ? Number(liq.horas_flete_pagar)
    : 0
  const hTot = Number((hFaena + hFlete).toFixed(2))
  const tarSug = Number(liq.tarifa_sugerida || liq.precio_unitario || 5000)
  const precUnit = Number(liq.precio_unitario || tarSug || 5000)
  const viatSugOp = calcularViaticoPorHorasFrontend(hTot)
  const viatOp = liq.monto_viatico_operador !== undefined && liq.monto_viatico_operador !== null
    ? Number(liq.monto_viatico_operador)
    : viatSugOp
  const hRig = liq.horas_totales_rigger !== undefined && liq.horas_totales_rigger !== null
    ? Number(liq.horas_totales_rigger)
    : (rep?.id_user_rigger ? hTot : 0)
  const viatSugRig = calcularViaticoPorHorasFrontend(hRig)
  const viatRig = liq.monto_viatico_rigger !== undefined && liq.monto_viatico_rigger !== null
    ? Number(liq.monto_viatico_rigger)
    : (rep?.id_user_rigger ? viatSugRig : 0)

  formLiquidacionDia.value = {
    regimen: liq.regimen || 'URBANO',
    distancia_km: Number(liq.distancia_km || 12),
    categoria_label: liq.categoria_label || 'Tabulador Tonelaje',
    hora_salida_bodega: liq.hora_salida_bodega || formatHoraSimple(rep?.hora_inicio || rep?.fecha_inicio_servicio, '08:00'),
    hora_llegada_obra: liq.hora_llegada_obra || formatHoraSimple(rep?.hora_inicio || rep?.fecha_inicio_servicio, '08:00'),
    horas_faena_pagar: hFaena,
    horas_flete_pagar: hFlete,
    tarifa_sugerida: tarSug,
    precio_unitario: precUnit,
    monto_viatico_operador: viatOp,
    horas_totales_rigger: hRig,
    monto_viatico_rigger: viatRig,
    horas_manual: false,
    viatico_manual: Boolean(liq.viatico_modificado),
    horas_rigger_manual: false,
    viatico_rigger_manual: Boolean(liq.viatico_rigger_modificado)
  }
}

const formatHoraSimple = (timestampStr, defaultVal = '08:00') => {
  if (!timestampStr) return defaultVal
  try {
    const s = String(timestampStr).trim()
    // Si ya viene formateado como HH:mm (ej. "08:00" o "18:00")
    if (/^\d{2}:\d{2}$/.test(s)) return s
    const d = new Date(s)
    if (isNaN(d.getTime())) return defaultVal
    return d.toLocaleTimeString('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (e) {
    return defaultVal
  }
}

// REQ-1099: Estado para adjuntar documentos o fotos del día directamente desde el Visor Report
const mostrarFormAdjuntoDia = ref(false)
const archivoDocVisor = ref(null)
const tituloDocVisor = ref('')
const subiendoDocVisor = ref(false)
const inputArchivoDocVisorRef = ref(null)

// SPEC-098 v1.1.0 / REQ-1147: Estado reactivo de privacidad de fotos y anexos para PDF de cliente
const privacidadPdf = reactive({
  incluir_foto_inicio: false,
  incluir_foto_termino: false,
  docs_incluidos_pdf: []
})

const isDocIncluidoEnPdf = (idDoc) => {
  if (!idDoc) return false
  return privacidadPdf.docs_incluidos_pdf.map(Number).includes(Number(idDoc))
}

const toggleDocEnPdf = (idDoc, forceVal = null) => {
  if (!idDoc) return
  const numId = Number(idDoc)
  const idx = privacidadPdf.docs_incluidos_pdf.map(Number).indexOf(numId)
  const shouldInclude = forceVal !== null ? forceVal : idx < 0
  if (shouldInclude) {
    if (idx < 0) privacidadPdf.docs_incluidos_pdf.push(numId)
  } else {
    if (idx >= 0) privacidadPdf.docs_incluidos_pdf.splice(idx, 1)
  }
}

const inicializarPrivacidad = (rep) => {
  if (!rep) return
  const aj = typeof rep.ajustes_analista === 'string'
    ? (() => { try { return JSON.parse(rep.ajustes_analista) } catch (_) { return {} } })()
    : (rep.ajustes_analista || {})
  const priv = rep.privacidad_pdf || aj.privacidad_pdf || null
  if (priv) {
    privacidadPdf.incluir_foto_inicio = priv.incluir_foto_inicio === true
    privacidadPdf.incluir_foto_termino = priv.incluir_foto_termino === true
    privacidadPdf.docs_incluidos_pdf = Array.isArray(priv.docs_incluidos_pdf)
      ? [...priv.docs_incluidos_pdf].map(Number)
      : []
  } else {
    // Por defecto (INV-PRIV-01): Fotos internas de flota quedan excluidas
    privacidadPdf.incluir_foto_inicio = false
    privacidadPdf.incluir_foto_termino = false
    // Por omisión, si hay documentos anexos y no se ha configurado privacidad, incluir los existentes
    privacidadPdf.docs_incluidos_pdf = documentosDiaVisor.value.map(d => Number(d.id_doc)).filter(Boolean)
  }
}

const documentosDiaVisor = computed(() => {
  const lista = []
  const vistos = new Set()
  const docsDirectos = Array.isArray(reportLocal.value?.documentos_dia) ? reportLocal.value.documentos_dia : []
  const docsAjustes = Array.isArray(reportLocal.value?.ajustes_analista?.documentos_dia) ? reportLocal.value.ajustes_analista.documentos_dia : []
  for (const d of [...docsDirectos, ...docsAjustes]) {
    if (!d) continue
    const k = d.id_doc ? `id:${d.id_doc}` : `nm:${d.nombre_archivo || d.titulo}`
    if (!vistos.has(k)) {
      vistos.add(k)
      lista.push(d)
    }
  }
  return lista
})

const getUrlDocumentoVisor = (doc) => {
  if (!doc) return '#'
  const base = (apiAxios.defaults.baseURL || '').replace(/\/$/, '')
  if (doc.id_doc) return `${base}/v1/storage/view/${doc.id_doc}`
  if (doc.url_vista) return doc.url_vista.startsWith('http') ? doc.url_vista : `${base}${doc.url_vista.replace(/^\/api/, '')}`
  return '#'
}

const dispararSelectorDocumentoDia = () => {
  mostrarFormAdjuntoDia.value = true
  if (inputArchivoDocVisorRef.value) {
    inputArchivoDocVisorRef.value.value = ''
    inputArchivoDocVisorRef.value.click()
  }
}

const onCambioArchivoDocVisor = (e) => {
  const f = e.target?.files?.[0] || null
  archivoDocVisor.value = f
  if (f && !tituloDocVisor.value) {
    tituloDocVisor.value = f.name.replace(/\.[^/.]+$/, '')
  }
}

const cancelarAdjuntoDiaVisor = () => {
  mostrarFormAdjuntoDia.value = false
  archivoDocVisor.value = null
  tituloDocVisor.value = ''
}

const subirDocumentoDiaDesdeVisor = async () => {
  if (!archivoDocVisor.value || !reportLocal.value?.id_proyecto) return
  try {
    subiendoDocVisor.value = true
    const fechaIso = reportLocal.value.fecha_reporte_iso || (reportLocal.value.fecha_reporte ? String(reportLocal.value.fecha_reporte).slice(0, 10) : '')
    const fd = new FormData()
    fd.append('archivo', archivoDocVisor.value)
    fd.append('id_proyecto', reportLocal.value.id_proyecto)
    fd.append('id_equipo', reportLocal.value.id_equipo || 0)
    fd.append('fecha', fechaIso)
    fd.append('dia', reportLocal.value.dia_correlativo || 1)
    if (reportLocal.value.id_reporte_avance) {
      fd.append('id_reporte_avance', reportLocal.value.id_reporte_avance)
    }
    if (tituloDocVisor.value?.trim()) {
      fd.append('titulo', tituloDocVisor.value.trim())
    }

    const { data } = await apiAxios.post('/operaciones/control-vivo/adjuntar-documento-dia', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (data?.success && data.data?.documento) {
      const nuevoDoc = data.data.documento
      if (!Array.isArray(reportLocal.value.documentos_dia)) {
        reportLocal.value.documentos_dia = []
      }
      reportLocal.value.documentos_dia.push(nuevoDoc)
      if (!reportLocal.value.id_doc_pdf && nuevoDoc.id_doc) {
        reportLocal.value.id_doc_pdf = nuevoDoc.id_doc
      }
      if (!reportLocal.value.ajustes_analista) reportLocal.value.ajustes_analista = {}
      reportLocal.value.ajustes_analista.evidencia_fisica_adjunta = true
      cancelarAdjuntoDiaVisor()
      emit('report-validado', reportLocal.value)
    }
  } catch (err) {
    console.error('Error adjuntando documento al día desde visor:', err)
    alert('❌ No se pudo adjuntar el documento: ' + (err.response?.data?.message || err.message))
  } finally {
    subiendoDocVisor.value = false
  }
}

const quitarDocumentoDiaDesdeVisor = async (doc) => {
  if (!doc?.id_doc || !reportLocal.value?.id_proyecto) return
  if (!confirm(`¿Quitar el documento "${doc.titulo || doc.nombre_archivo}" de este día?`)) return
  try {
    const fechaIso = reportLocal.value.fecha_reporte_iso || (reportLocal.value.fecha_reporte ? String(reportLocal.value.fecha_reporte).slice(0, 10) : '')
    await apiAxios.delete(`/operaciones/control-vivo/documento-dia/${doc.id_doc}`, {
      params: {
        id_proyecto: reportLocal.value.id_proyecto,
        fecha: fechaIso,
        id_reporte_avance: reportLocal.value.id_reporte_avance || ''
      }
    })
    if (Array.isArray(reportLocal.value.documentos_dia)) {
      reportLocal.value.documentos_dia = reportLocal.value.documentos_dia.filter(d => Number(d.id_doc) !== Number(doc.id_doc))
    }
    if (Array.isArray(reportLocal.value.ajustes_analista?.documentos_dia)) {
      reportLocal.value.ajustes_analista.documentos_dia = reportLocal.value.ajustes_analista.documentos_dia.filter(d => Number(d.id_doc) !== Number(doc.id_doc))
    }
    emit('report-validado', reportLocal.value)
  } catch (err) {
    console.error('Error quitando documento desde visor:', err)
    alert('❌ No se pudo quitar el documento: ' + (err.response?.data?.message || err.message))
  }
}

watch(() => props.report, (newRep) => {
  if (newRep && Object.keys(newRep).length > 0) {
    reportLocal.value = JSON.parse(JSON.stringify(newRep))
    cancelarAdjuntoDiaVisor()
    
    const aj = typeof newRep.ajustes_analista === 'string'
      ? (() => { try { return JSON.parse(newRep.ajustes_analista) } catch (_) { return {} } })()
      : (newRep.ajustes_analista || {})
    const tieneAjuste = !!aj?.modificado
    const valAj = aj?.valores_ajustados || {}

    const hIni = tieneAjuste && valAj.hora_inicio
      ? valAj.hora_inicio
      : formatHoraSimple(newRep.hora_inicio || newRep.fecha_inicio_servicio, '08:00')
    const tieneTerminoReal = Boolean(
      (tieneAjuste && valAj.hora_termino) ||
      newRep.hora_termino ||
      newRep.fecha_termino_servicio
    )
    const hFin = tieneAjuste && valAj.hora_termino
      ? valAj.hora_termino
      : (tieneTerminoReal ? formatHoraSimple(newRep.hora_termino || newRep.fecha_termino_servicio, '18:00') : '')
    const col = Number(
      tieneAjuste && valAj.horas_colacion !== undefined
        ? valAj.horas_colacion
        : (newRep.horas_colacion !== undefined && newRep.horas_colacion !== null ? newRep.horas_colacion : 1.0)
    )
    const horoIni = Number(
      tieneAjuste && valAj.horometro_inicio !== undefined
        ? valAj.horometro_inicio
        : (newRep.horometro_inicio || 0)
    )
    const horoFin = Number(
      tieneAjuste && valAj.horometro_termino !== undefined
        ? valAj.horometro_termino
        : (newRep.horometro_termino || 0)
    )
    const odoIni = Number(
      tieneAjuste && valAj.odometro_inicio !== undefined
        ? valAj.odometro_inicio
        : (newRep.odometro_inicio || 0)
    )
    const odoFin = Number(
      tieneAjuste && valAj.odometro_termino !== undefined
        ? valAj.odometro_termino
        : (newRep.odometro_termino || 0)
    )
    const opId = tieneAjuste && valAj.id_user_operador !== undefined && valAj.id_user_operador !== null
      ? Number(valAj.id_user_operador)
      : (newRep.id_user_operador ? Number(newRep.id_user_operador) : null)
    const rigId = tieneAjuste && valAj.id_user_rigger !== undefined
      ? (valAj.id_user_rigger ? Number(valAj.id_user_rigger) : null)
      : (newRep.id_user_rigger ? Number(newRep.id_user_rigger) : null)
    const sbCli = Number(
      tieneAjuste && valAj.horas_standby_cliente !== undefined
        ? valAj.horas_standby_cliente
        : (newRep.horas_standby_cliente || 0)
    )
    const sbGsp = Number(
      tieneAjuste && valAj.horas_standby_gsp !== undefined
        ? valAj.horas_standby_gsp
        : (newRep.horas_standby_gsp || 0)
    )
    const motSb = tieneAjuste && valAj.motivo_standby !== undefined
      ? valAj.motivo_standby
      : (newRep.motivo_standby || '')
    const valHFact = tieneAjuste && valAj.horas_facturables !== undefined && valAj.horas_facturables !== null
      ? Number(valAj.horas_facturables)
      : (newRep.horas_facturables !== undefined && newRep.horas_facturables !== null ? Number(newRep.horas_facturables) : null)
    const valObsCli = tieneAjuste && valAj.observaciones_cliente !== undefined
      ? valAj.observaciones_cliente
      : (newRep.observaciones_cliente || newRep.ajustes_analista?.observaciones_cliente || '')

    formAjustes.value = {
      hora_inicio: hIni,
      hora_termino: hFin,
      horas_colacion: col,
      horometro_inicio: horoIni,
      horometro_termino: horoFin,
      odometro_inicio: odoIni,
      odometro_termino: odoFin,
      id_user_operador: opId,
      id_user_rigger: rigId,
      horas_standby_cliente: sbCli,
      horas_standby_gsp: sbGsp,
      motivo_standby: motSb,
      horas_facturables: valHFact,
      observaciones_cliente: valObsCli
    }

    obsValidacion.value = newRep.obs_validador || ''
    modoAjuste.value = !props.readonly && props.modoEdicionInicial

    inicializarLiquidacionDesdeReport(newRep)
    inicializarPrivacidad(newRep)
    cargarUsuariosOperativos()

    // Inicializar mapa de firma
    nextTick(() => {
      setTimeout(inicializarMapaFirma, 150)
    })
  }
}, { immediate: true })

watch(() => props.visible, (val) => {
  if (val) {
    if (reportLocal.value) {
      inicializarPrivacidad(reportLocal.value)
    }
    if (props.readonly) {
      modoAjuste.value = false
    } else {
      if (props.modoEdicionInicial) {
        modoAjuste.value = true
      }
      cargarUsuariosOperativos()
    }
    nextTick(() => {
      setTimeout(inicializarMapaFirma, 200)
    })
  } else {
    destruirMapa()
  }
})

const tieneCoordenadasGPS = computed(() => {
  const lat = parseFloat(reportLocal.value?.latitud_inicio_servicio)
  const lng = parseFloat(reportLocal.value?.longitud_inicio_servicio)
  return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
})

const googleMapsUrl = computed(() => {
  if (!tieneCoordenadasGPS.value) return '#'
  const lat = reportLocal.value.latitud_inicio_servicio
  const lng = reportLocal.value.longitud_inicio_servicio
  return `https://www.google.com/maps?q=${lat},${lng}`
})

const inicializarMapaFirma = () => {
  if (!mapContainerRef.value || !tieneCoordenadasGPS.value) return

  const lat = parseFloat(reportLocal.value.latitud_inicio_servicio)
  const lng = parseFloat(reportLocal.value.longitud_inicio_servicio)
  const acc = parseFloat(reportLocal.value.accuracy_firma || 15)

  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }

  try {
    leafletMap = L.map(mapContainerRef.value, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false
    }).setView([lat, lng], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(leafletMap)

    // Marcador de punto de firma
    const marker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#f59e0b',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.95
    }).addTo(leafletMap)

    marker.bindPopup(`
      <div style="font-size:11px; font-family:sans-serif;">
        <strong>Sello Firma Mandante</strong><br>
        ${reportLocal.value.cliente_nombre || 'Supervisor Mandante'}<br>
        Precisión GPS: ±${acc.toFixed(0)}m
      </div>
    `)

    // Círculo de precisión
    L.circle([lat, lng], {
      radius: Math.min(80, Math.max(10, acc)),
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      color: '#3b82f6',
      weight: 1
    }).addTo(leafletMap)

    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize()
    }, 250)
  } catch (err) {
    console.warn('[ModalVisorReport] Error al inicializar mapa Leaflet:', err)
  }
}

const destruirMapa = () => {
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
}

onBeforeUnmount(() => {
  destruirMapa()
})

const toggleModoEdicion = () => {
  if (props.readonly) {
    modoAjuste.value = false
    return
  }
  modoAjuste.value = !modoAjuste.value
  if (modoAjuste.value && !obsValidacion.value) {
    obsValidacion.value = 'Ajustes de tiempos y telemetría por Control de Gestión'
  }
}

const restablecerAjustes = () => {
  if (reportLocal.value) {
    const origHFact = reportLocal.value?.ajustes_analista?.valores_originales?.horas_facturables ?? reportLocal.value?.horas_operadas ?? null
    const origObsCli = reportLocal.value?.ajustes_analista?.valores_originales?.observaciones_cliente ?? reportLocal.value?.observaciones_cliente ?? ''
    formAjustes.value = {
      hora_inicio: formatHoraSimple(reportLocal.value.fecha_inicio_servicio, '08:00'),
      hora_termino: formatHoraSimple(reportLocal.value.fecha_termino_servicio, '18:00'),
      horas_colacion: Number(reportLocal.value.horas_colacion !== undefined ? reportLocal.value.horas_colacion : 1.0),
      horometro_inicio: Number(reportLocal.value.horometro_inicio || 0),
      horometro_termino: Number(reportLocal.value.horometro_termino || 0),
      odometro_inicio: Number(reportLocal.value.odometro_inicio || 0),
      odometro_termino: Number(reportLocal.value.odometro_termino || 0),
      id_user_operador: reportLocal.value.id_user_operador ? Number(reportLocal.value.id_user_operador) : null,
      id_user_rigger: reportLocal.value.id_user_rigger ? Number(reportLocal.value.id_user_rigger) : null,
      horas_standby_cliente: Number(reportLocal.value.horas_standby_cliente || 0),
      horas_standby_gsp: Number(reportLocal.value.horas_standby_gsp || 0),
      motivo_standby: reportLocal.value.motivo_standby || '',
      horas_facturables: origHFact !== null ? Number(origHFact) : null,
      observaciones_cliente: origObsCli
    }
    inicializarLiquidacionDesdeReport(reportLocal.value)
  }
}

const nombreOperadorMostrado = computed(() => {
  if (formAjustes.value.id_user_operador && usuariosLista.value.length > 0) {
    const found = usuariosLista.value.find(u => Number(u.id_user) === Number(formAjustes.value.id_user_operador))
    if (found) return found.nombre_completo
  }
  return reportLocal.value?.ajustes_analista?.valores_ajustados?.operador_nombre || reportLocal.value?.operador_nombre || 'N/A'
})

const nombreRiggerMostrado = computed(() => {
  if (formAjustes.value.id_user_rigger && usuariosLista.value.length > 0) {
    const found = usuariosLista.value.find(u => Number(u.id_user) === Number(formAjustes.value.id_user_rigger))
    if (found) return found.nombre_completo
  }
  return reportLocal.value?.ajustes_analista?.valores_ajustados?.rigger_nombre || reportLocal.value?.rigger_nombre || 'S/R'
})

const abrirFotoGrande = (url) => {
  if (url) {
    fotoGrandeUrl.value = url
  }
}

const tieneFotos = computed(() => {
  return !!(reportLocal.value?.foto_tablero_inicio || reportLocal.value?.foto_tablero_termino || reportLocal.value?.foto_horometro)
})

const esValidado = computed(() => {
  return reportLocal.value?.estado_reporte === 'VALIDADO_ANALISTA'
})

// Horas reportadas en obra (Inicio Obra -> Término Obra - Colación)
const horasReportadasObra = computed(() => {
  const hIni = formAjustes.value.hora_inicio
  const hFin = formAjustes.value.hora_termino
  if (!hIni || !hFin) return 0
  const [h1, m1] = hIni.split(':').map(Number)
  const [h2, m2] = hFin.split(':').map(Number)
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0
  let minutos = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (minutos < 0) minutos += 24 * 60
  const dur = Number((minutos / 60).toFixed(1))
  const col = Number(formAjustes.value.horas_colacion || 0)
  return Number(Math.max(0, dur - col).toFixed(1))
})

// Cálculo de duración computable al cliente:
// - Política Urbana: desde Salida de Base hasta Término en Obra
// - Política Rural: desde Inicio en Obra hasta Término en Obra
const duracionFaena = computed(() => {
  const hIni = (formLiquidacionDia.value.regimen === 'URBANO' && formLiquidacionDia.value.hora_salida_bodega)
    ? formLiquidacionDia.value.hora_salida_bodega
    : formAjustes.value.hora_inicio
  const hFin = formAjustes.value.hora_termino
  if (!hIni || !hFin) return 0
  const [h1, m1] = hIni.split(':').map(Number)
  const [h2, m2] = hFin.split(':').map(Number)
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0
  let minutos = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (minutos < 0) minutos += 24 * 60
  return Number((minutos / 60).toFixed(1))
})

// Horas Netas Computables al Mandante: Faena - Colación - Standby GSP (Spec 84)
const horasComputablesCliente = computed(() => {
  const dur = duracionFaena.value
  const col = Number(formAjustes.value.horas_colacion || 0)
  const sbGsp = Number(formAjustes.value.horas_standby_gsp || 0)
  return Number(Math.max(0, dur - col - sbGsp).toFixed(1))
})

// Horas de Operación Real de Izaje: Horas Netas - Standby Cliente
const horasOperacionReal = computed(() => {
  const comp = horasComputablesCliente.value
  const sbCli = Number(formAjustes.value.horas_standby_cliente || 0)
  return Number(Math.max(0, comp - sbCli).toFixed(1))
})

// Alias para interfaces y payload de validación
const horasEfectivasCalculadas = computed(() => {
  return horasOperacionReal.value
})

// Validar si el servicio contempla Rigger asignado
const tieneRigger = computed(() => {
  if (formAjustes.value.id_user_rigger) return true
  const rig = reportLocal.value?.rigger_nombre
  if (!rig) return false
  const rigTrim = String(rig).trim().toUpperCase()
  return rigTrim !== '' && rigTrim !== 'S/R' && rigTrim !== 'RIGGER' && rigTrim !== 'NULL' && rigTrim !== 'UNDEFINED'
})

// Base mínima contractual (REQ-1109: preserva 0 cuando el contrato es modalidad mensual sin mínimo diario)
const baseMinima = computed(() => {
  const raw = reportLocal.value?.horas_minimas
  if (raw !== undefined && raw !== null && String(raw).trim() !== '' && !Number.isNaN(Number(raw))) {
    return Number(raw)
  }
  return 4.0
})

// Horas a facturar: Permite override manual en modoAjuste (acuerdo Yara Mendoza / contabilidad) o cálculo automático Math.max(Base Mínima, Horas Computables al Mandante)
const horasFacturablesCalculadas = computed(() => {
  if (modoAjuste.value && formAjustes.value.horas_facturables !== null && formAjustes.value.horas_facturables !== undefined && String(formAjustes.value.horas_facturables).trim() !== '') {
    const manual = parseFloat(formAjustes.value.horas_facturables)
    if (!isNaN(manual) && manual >= 0) return manual
  }
  const ajHFact = reportLocal.value?.ajustes_analista?.valores_ajustados?.horas_facturables ?? reportLocal.value?.horas_facturables
  if (ajHFact !== undefined && ajHFact !== null && String(ajHFact).trim() !== '' && !isNaN(Number(ajHFact)) && Number(ajHFact) >= 0) {
    return Number(Number(ajHFact).toFixed(1))
  }
  const comp = horasComputablesCliente.value
  const base = baseMinima.value
  return Number((base > 0 ? Math.max(base, comp) : comp).toFixed(1))
})

// Sobretiempo: Math.max(0, Horas Computables al Mandante - Base Mínima) (Spec 84 corregido / REQ-1109)
const sobretiempoCalculado = computed(() => {
  const comp = horasComputablesCliente.value
  const base = baseMinima.value
  if (base <= 0) return 0
  const st = comp - base
  return st > 0 ? Number(st.toFixed(1)) : 0
})

// Delta Horómetro
const deltaHorometroCalculado = computed(() => {
  const ini = Number(formAjustes.value.horometro_inicio) || 0
  const fin = Number(formAjustes.value.horometro_termino) || 0
  if (fin >= ini && ini > 0) {
    return (fin - ini).toFixed(1)
  }
  return '0.0'
})

// Delta Odómetro
const deltaOdometroCalculado = computed(() => {
  const ini = Number(formAjustes.value.odometro_inicio) || 0
  const fin = Number(formAjustes.value.odometro_termino) || 0
  if (fin >= ini && ini > 0) {
    return (fin - ini).toFixed(0)
  }
  return '0'
})

const esDeltaHorometroAnomalo = computed(() => {
  const delta = Number(deltaHorometroCalculado.value || 0)
  const ef = Number(horasEfectivasCalculadas.value || 0)
  return delta > Math.max(20, ef + 4)
})

// Detección reactiva de qué campos modificó el analista respecto a lo reportado
const esHorarioModificado = computed(() => {
  if (!reportLocal.value) return false
  const origIni = formatHoraSimple(reportLocal.value.fecha_inicio_servicio, '08:00')
  const origFin = formatHoraSimple(reportLocal.value.fecha_termino_servicio, '18:00')
  return formAjustes.value.hora_inicio !== origIni || formAjustes.value.hora_termino !== origFin
})

const esColacionModificada = computed(() => {
  if (!reportLocal.value) return false
  const orig = Number(reportLocal.value.horas_colacion !== undefined ? reportLocal.value.horas_colacion : 1.0)
  return Math.abs(Number(formAjustes.value.horas_colacion) - orig) > 0.01
})

const esHorometroModificado = computed(() => {
  if (!reportLocal.value) return false
  const origIni = Number(reportLocal.value.horometro_inicio || 0)
  const origFin = Number(reportLocal.value.horometro_termino || 0)
  return Math.abs(Number(formAjustes.value.horometro_inicio) - origIni) > 0.01 || Math.abs(Number(formAjustes.value.horometro_termino) - origFin) > 0.01
})

const esOdometroModificado = computed(() => {
  if (!reportLocal.value) return false
  const origIni = Number(reportLocal.value.odometro_inicio || 0)
  const origFin = Number(reportLocal.value.odometro_termino || 0)
  return Math.abs(Number(formAjustes.value.odometro_inicio) - origIni) > 0.1 || Math.abs(Number(formAjustes.value.odometro_termino) - origFin) > 0.1
})

const esOperadorModificado = computed(() => {
  if (!reportLocal.value) return false
  const orig = reportLocal.value.id_user_operador ? Number(reportLocal.value.id_user_operador) : null
  const curr = formAjustes.value.id_user_operador ? Number(formAjustes.value.id_user_operador) : null
  return curr !== orig
})

const esRiggerModificado = computed(() => {
  if (!reportLocal.value) return false
  const orig = reportLocal.value.id_user_rigger ? Number(reportLocal.value.id_user_rigger) : null
  const curr = formAjustes.value.id_user_rigger ? Number(formAjustes.value.id_user_rigger) : null
  return curr !== orig
})

const esHorasOperadasModificadas = computed(() => {
  if (!reportLocal.value) return false
  const orig = Number(reportLocal.value.horas_operadas || 0)
  return Math.abs(Number(horasEfectivasCalculadas.value) - orig) > 0.01
})

const esHorasFacturablesModificadas = computed(() => {
  if (!reportLocal.value) return false
  const orig = Number(
    reportLocal.value.ajustes_analista?.valores_originales?.horas_facturables ??
    reportLocal.value.horas_operadas ??
    reportLocal.value.horas_facturables ?? 0
  )
  return Math.abs(Number(horasFacturablesCalculadas.value) - orig) > 0.01
})

const esStandbyModificado = computed(() => {
  if (!reportLocal.value) return false
  const origCli = Number(reportLocal.value.horas_standby_cliente || 0)
  const origGsp = Number(reportLocal.value.horas_standby_gsp || 0)
  const origMot = String(reportLocal.value.motivo_standby || '').trim()
  return Math.abs(Number(formAjustes.value.horas_standby_cliente || 0) - origCli) > 0.01 ||
         Math.abs(Number(formAjustes.value.horas_standby_gsp || 0) - origGsp) > 0.01 ||
         String(formAjustes.value.motivo_standby || '').trim() !== origMot
})

// El analista modifica: Operador, Rigger, Horario Faena, Colación, Horómetro, Odómetro, Standby o Liquidación Personal
const horasTotalesLiqOperador = computed(() => {
  const hFaena = Number(formLiquidacionDia.value.horas_faena_pagar || 0)
  const hFlete = Number(formLiquidacionDia.value.horas_flete_pagar || 0)
  return Number((hFaena + hFlete).toFixed(2))
})

const subtotalHoraOperadorLiq = computed(() => {
  return Math.round(horasTotalesLiqOperador.value * Number(formLiquidacionDia.value.precio_unitario || 0))
})

const viaticoSugeridoOperador = computed(() => {
  return calcularViaticoPorHorasFrontend(horasTotalesLiqOperador.value)
})

const viaticoSugeridoRigger = computed(() => {
  if (!tieneRigger.value) return 0
  return calcularViaticoPorHorasFrontend(formLiquidacionDia.value.horas_totales_rigger)
})

const totalViaticosDiaLiq = computed(() => {
  const vOp = Number(formLiquidacionDia.value.monto_viatico_operador || 0)
  const vRig = tieneRigger.value ? Number(formLiquidacionDia.value.monto_viatico_rigger || 0) : 0
  return Math.round(vOp + vRig)
})

const onCambioHorasLiq = () => {
  formLiquidacionDia.value.horas_manual = true
  if (!formLiquidacionDia.value.viatico_manual) {
    formLiquidacionDia.value.monto_viatico_operador = calcularViaticoPorHorasFrontend(horasTotalesLiqOperador.value)
  }
  if (tieneRigger.value && !formLiquidacionDia.value.horas_rigger_manual) {
    formLiquidacionDia.value.horas_totales_rigger = horasTotalesLiqOperador.value
    if (!formLiquidacionDia.value.viatico_rigger_manual) {
      formLiquidacionDia.value.monto_viatico_rigger = calcularViaticoPorHorasFrontend(horasTotalesLiqOperador.value)
    }
  }
}

const onCambioHorasRiggerLiq = () => {
  formLiquidacionDia.value.horas_rigger_manual = true
  if (!formLiquidacionDia.value.viatico_rigger_manual) {
    formLiquidacionDia.value.monto_viatico_rigger = calcularViaticoPorHorasFrontend(formLiquidacionDia.value.horas_totales_rigger)
  }
}

// Sincronizar automáticamente horas de liquidación cuando el analista edita horario/colación en Sección 1/2
watch([() => formAjustes.value.hora_inicio, () => formAjustes.value.hora_termino, () => formAjustes.value.horas_colacion], () => {
  if (!modoAjuste.value || formLiquidacionDia.value.horas_manual) return
  const hrsRealesObra = horasReportadasObra.value
  const minPactado = baseMinima.value
  if (formLiquidacionDia.value.regimen === 'URBANO') {
    formLiquidacionDia.value.horas_faena_pagar = hrsRealesObra
    formLiquidacionDia.value.horas_flete_pagar = 0
  } else {
    formLiquidacionDia.value.horas_faena_pagar = hrsRealesObra > 0 ? Math.max(minPactado, hrsRealesObra) : 0
  }
  const hTot = Number((formLiquidacionDia.value.horas_faena_pagar + Number(formLiquidacionDia.value.horas_flete_pagar || 0)).toFixed(2))
  if (!formLiquidacionDia.value.viatico_manual) {
    formLiquidacionDia.value.monto_viatico_operador = calcularViaticoPorHorasFrontend(hTot)
  }
  if (tieneRigger.value && !formLiquidacionDia.value.horas_rigger_manual) {
    formLiquidacionDia.value.horas_totales_rigger = hTot
    if (!formLiquidacionDia.value.viatico_rigger_manual) {
      formLiquidacionDia.value.monto_viatico_rigger = calcularViaticoPorHorasFrontend(hTot)
    }
  }
})

const esLiquidacionPersonalModificada = computed(() => {
  const baseLiq = reportLocal.value?.liquidacion_personal_dia || reportLocal.value?.ajustes_analista?.liquidacion_personal_dia || {}
  const origFaena = Number(baseLiq.horas_faena_pagar ?? (reportLocal.value?.horas_facturables || 0))
  const origFlete = Number(baseLiq.horas_flete_pagar ?? 0)
  const origPrecio = Number(baseLiq.precio_unitario ?? 5000)
  const origViaticoOp = Number(baseLiq.monto_viatico_operador ?? 0)
  const origViaticoRig = Number(baseLiq.monto_viatico_rigger ?? 0)
  return (
    Math.abs(Number(formLiquidacionDia.value.horas_faena_pagar || 0) - origFaena) > 0.01 ||
    Math.abs(Number(formLiquidacionDia.value.horas_flete_pagar || 0) - origFlete) > 0.01 ||
    Math.abs(Number(formLiquidacionDia.value.precio_unitario || 0) - origPrecio) > 1 ||
    Math.abs(Number(formLiquidacionDia.value.monto_viatico_operador || 0) - origViaticoOp) > 1 ||
    (tieneRigger.value && Math.abs(Number(formLiquidacionDia.value.monto_viatico_rigger || 0) - origViaticoRig) > 1)
  )
})

const esObsValidacionModificada = computed(() => {
  if (!reportLocal.value) return false
  return String(obsValidacion.value || '').trim() !== String(reportLocal.value.obs_validador || '').trim()
})

const guardandoObsDirecto = ref(false)
const guardarObsValidadorDirecto = async () => {
  if (!reportLocal.value?.id_proyecto) return
  try {
    guardandoObsDirecto.value = true
    const fechaIso = reportLocal.value.fecha_reporte_iso || (reportLocal.value.fecha_reporte ? String(reportLocal.value.fecha_reporte).slice(0, 10) : '')
    const { data } = await apiAxios.post('/operaciones/control-vivo/override-hito', {
      id_proyecto: reportLocal.value.id_proyecto,
      id_equipo: reportLocal.value.id_equipo || 0,
      fecha: fechaIso,
      dia: reportLocal.value.dia_correlativo || 1,
      id_reporte_avance: reportLocal.value.id_reporte_avance || null,
      clave_actividad: 'OBS_VALIDADOR',
      obs_validador: obsValidacion.value
    })
    if (data && data.success) {
      reportLocal.value.obs_validador = data.data?.obs_validador || ''
      emit('report-validado', reportLocal.value)
    }
  } catch (err) {
    console.error('Error actualizando observación de validación:', err)
    alert('❌ No se pudo actualizar la observación: ' + (err.response?.data?.message || err.message))
  } finally {
    guardandoObsDirecto.value = false
  }
}

const formatHorasHHMM = (val) => {
  const num = parseFloat(val)
  if (isNaN(num) || num <= 0) return '00:00'
  const totalMin = Math.round(num * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const esPrivacidadModificada = computed(() => {
  if (!reportLocal.value) return false
  const aj = typeof reportLocal.value.ajustes_analista === 'string'
    ? (() => { try { return JSON.parse(reportLocal.value.ajustes_analista) } catch (_) { return {} } })()
    : (reportLocal.value.ajustes_analista || {})
  const privOrig = reportLocal.value.privacidad_pdf || aj.privacidad_pdf || {}
  const iniOrig = privOrig.incluir_foto_inicio === true
  const finOrig = privOrig.incluir_foto_termino === true
  const docsOrig = Array.isArray(privOrig.docs_incluidos_pdf) ? privOrig.docs_incluidos_pdf.map(Number).sort().join(',') : ''
  const docsCurr = [...privacidadPdf.docs_incluidos_pdf].map(Number).sort().join(',')
  return privacidadPdf.incluir_foto_inicio !== iniOrig || privacidadPdf.incluir_foto_termino !== finOrig || docsCurr !== docsOrig
})

const esObservacionesClienteModificadas = computed(() => {
  if (!reportLocal.value) return false
  const orig = String(
    reportLocal.value.ajustes_analista?.valores_originales?.observaciones_cliente ??
    reportLocal.value.observaciones_cliente ??
    reportLocal.value.ajustes_analista?.observaciones_cliente ?? ''
  ).trim()
  return String(formAjustes.value.observaciones_cliente || '').trim() !== orig
})

const hayModificaciones = computed(() => {
  return esHorarioModificado.value || esColacionModificada.value || esHorometroModificado.value || esOdometroModificado.value || esOperadorModificado.value || esRiggerModificado.value || esStandbyModificado.value || esLiquidacionPersonalModificada.value || esObsValidacionModificada.value || esHorasFacturablesModificadas.value || esPrivacidadModificada.value || esObservacionesClienteModificadas.value
})

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '---'
  try {
    const d = new Date(fechaStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
  } catch (e) {
    return fechaStr
  }
}

const formatHora = (timestampStr) => {
  return formatHoraSimple(timestampStr, '08:00')
}

const formatDateTime = (dtStr) => {
  if (!dtStr) return '---'
  try {
    const d = new Date(dtStr)
    return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return dtStr
  }
}

// Estado Submodal PIN Firma FES
const mostrarModalPin = ref(false)
const pinDigits = ref(['', '', '', ''])
const errorPin = ref('')
const pinInputRefs = ref([])

const setPinInputRef = (el, idx) => {
  if (el) pinInputRefs.value[idx] = el
}

const pinCompleto = computed(() => pinDigits.value.join(''))

const currentUserAnalista = computed(() => {
  let user = { id_user: 55, nombre: 'Sergio Gajardo', rut: '9.161.957-1', email: 'sgajardoc@gmail.com' }
  try {
    const uStr = localStorage.getItem('user') || localStorage.getItem('usuario') || localStorage.getItem('perfil')
    if (uStr) {
      const u = JSON.parse(uStr)
      if (u.id_user) {
        user.id_user = Number(u.id_user)
        user.nombre = [u.name_frst, u.name_sec, u.apellido_pat].filter(Boolean).join(' ').trim() || u.nombre || user.nombre
        user.rut = u.rut || user.rut
        user.email = u.email || user.email
      }
    }
  } catch (e) {}
  return user
})

const urlPdfOficial = computed(() => {
  if (!reportLocal.value?.id_doc_pdf) return ''
  const base = (apiAxios.defaults.baseURL || '').replace(/\/$/, '')
  return `${base}/v1/storage/view/${reportLocal.value.id_doc_pdf}`
})

const urlDescargaPdfOficial = computed(() => {
  if (!reportLocal.value?.id_doc_pdf) return ''
  const base = (apiAxios.defaults.baseURL || '').replace(/\/$/, '')
  return `${base}/v1/storage/download/${reportLocal.value.id_doc_pdf}`
})

const abrirPdfOficial = () => {
  if (urlPdfOficial.value) {
    window.open(urlPdfOficial.value, '_blank')
  }
}

const descargarPdfOficial = () => {
  if (urlDescargaPdfOficial.value) {
    window.open(urlDescargaPdfOficial.value, '_blank')
  }
}

const abrirModalPin = () => {
  pinDigits.value = ['', '', '', '']
  errorPin.value = ''
  mostrarModalPin.value = true
  nextTick(() => {
    setTimeout(() => {
      pinInputRefs.value[0]?.focus()
    }, 120)
  })
}

const cerrarModalPin = () => {
  mostrarModalPin.value = false
  errorPin.value = ''
}

const onPinInput = (idx, event) => {
  errorPin.value = ''
  const val = event.target.value.replace(/\D/g, '')
  pinDigits.value[idx] = val.slice(-1)
  if (val && idx < 3) {
    pinInputRefs.value[idx + 1]?.focus()
  }
}

const onPinKeydown = (idx, event) => {
  if (event.key === 'Backspace' && !pinDigits.value[idx] && idx > 0) {
    pinInputRefs.value[idx - 1]?.focus()
  }
}

const onPinPaste = (event) => {
  event.preventDefault()
  const text = (event.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '')
  if (text.length >= 4) {
    for (let i = 0; i < 4; i++) {
      pinDigits.value[i] = text[i]
    }
    pinInputRefs.value[3]?.focus()
  }
}

const ejecutarValidacionConPin = async () => {
  if (!reportLocal.value?.id_reporte_avance) return
  if (pinCompleto.value.length !== 4) {
    errorPin.value = 'El PIN debe contener exactamente 4 dígitos numéricos.'
    return
  }

  try {
    validando.value = true
    errorPin.value = ''

    const idUser = currentUserAnalista.value.id_user || 55

    const justificacionFinal = obsValidacion.value.trim() || 
      (hayModificaciones.value ? 'Ajustes de horario, tripulación y telemetría por Control de Gestión' : 'Report validado conforme por Analista de Operaciones')

    const payload = {
      id_user_validador: idUser,
      pin: pinCompleto.value,
      obs_validador: justificacionFinal,
      privacidad_pdf: {
        incluir_foto_inicio: privacidadPdf.incluir_foto_inicio === true,
        incluir_foto_termino: privacidadPdf.incluir_foto_termino === true,
        docs_incluidos_pdf: [...privacidadPdf.docs_incluidos_pdf]
      },
      ajustes: hayModificaciones.value ? {
        hora_inicio: formAjustes.value.hora_inicio,
        hora_termino: formAjustes.value.hora_termino,
        horas_colacion: formAjustes.value.horas_colacion,
        horometro_inicio: formAjustes.value.horometro_inicio,
        horometro_termino: formAjustes.value.horometro_termino,
        odometro_inicio: formAjustes.value.odometro_inicio,
        odometro_termino: formAjustes.value.odometro_termino,
        id_user_operador: formAjustes.value.id_user_operador,
        id_user_rigger: formAjustes.value.id_user_rigger,
        horas_standby_cliente: formAjustes.value.horas_standby_cliente,
        horas_standby_gsp: formAjustes.value.horas_standby_gsp,
        motivo_standby: formAjustes.value.motivo_standby,
        horas_operadas: horasEfectivasCalculadas.value,
        horas_facturables: horasFacturablesCalculadas.value,
        horas_sobretiempo: sobretiempoCalculado.value,
        observaciones_cliente: formAjustes.value.observaciones_cliente
      } : null,
      observaciones_cliente: formAjustes.value.observaciones_cliente,
      liquidacion_personal_dia: {
        regimen: formLiquidacionDia.value.regimen,
        distancia_km: formLiquidacionDia.value.distancia_km,
        categoria_label: formLiquidacionDia.value.categoria_label,
        horas_faena_pagar: Number(formLiquidacionDia.value.horas_faena_pagar || 0),
        horas_flete_pagar: Number(formLiquidacionDia.value.horas_flete_pagar || 0),
        horas_totales_pagar: horasTotalesLiqOperador.value,
        tarifa_sugerida: Number(formLiquidacionDia.value.tarifa_sugerida || 0),
        precio_unitario: Math.round(Number(formLiquidacionDia.value.precio_unitario || 0)),
        monto_total_hora_operador: subtotalHoraOperadorLiq.value,
        monto_viatico_sugerido_operador: viaticoSugeridoOperador.value,
        monto_viatico_operador: Math.round(Number(formLiquidacionDia.value.monto_viatico_operador || 0)),
        horas_totales_rigger: tieneRigger.value ? Number(formLiquidacionDia.value.horas_totales_rigger || 0) : 0,
        monto_viatico_sugerido_rigger: viaticoSugeridoRigger.value,
        monto_viatico_rigger: tieneRigger.value ? Math.round(Number(formLiquidacionDia.value.monto_viatico_rigger || 0)) : 0
      }
    }

    const res = await apiAxios.post(`/operaciones/report/${reportLocal.value.id_reporte_avance}/validar`, payload)

    if (res.data?.success) {
      mostrarModalPin.value = false
      
      if (res.data.data) {
        reportLocal.value = {
          ...reportLocal.value,
          ...res.data.data
        }
        if (res.data.data.horas_facturables !== undefined && res.data.data.horas_facturables !== null) {
          formAjustes.value.horas_facturables = Number(res.data.data.horas_facturables)
        }
        if (res.data.data.observaciones_cliente !== undefined) {
          formAjustes.value.observaciones_cliente = res.data.data.observaciones_cliente || ''
        }
      }
      modoAjuste.value = false
      emit('report-validado', res.data.data || reportLocal.value)

      alert(
        `✅ Report Diario validado y certificado con Firma Electrónica Simple (FES).\n\n` +
        `• Código FES: ${res.data.data?.codigo_validacion_fes || 'Certificado'}\n` +
        `• Documento PDF Oficial generado y anexado al Dossier del Proyecto.\n` +
        `• Notificación despachada por correo formal con enlace de descarga.`
      )
    }
  } catch (err) {
    console.error('Error al validar report:', err)
    const backendMsg = err.response?.data?.error || err.message
    if (err.response?.status === 401) {
      errorPin.value = 'PIN de Firma Electrónica Simple (FES) incorrecto. Verifique sus 4 dígitos.'
      pinDigits.value = ['', '', '', '']
      nextTick(() => {
        pinInputRefs.value[0]?.focus()
      })
    } else {
      errorPin.value = 'Error al certificar: ' + backendMsg
    }
  } finally {
    validando.value = false
  }
}

const cerrar = () => {
  emit('close')
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
