<template>
  <div class="space-y-4">
    <!-- BARRA SUPERIOR DE RECURSOS DE FAENA (ADICIÓN AUTÓNOMA EN OPERACIONES) -->
    <div class="surface-card rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-4 rounded-sm inline-block bg-amber-500"></span>
        <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Recursos de Operación & Tripulación OT
        </span>
        <span class="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          {{ serviciosLista.length }} Asignación(es)
        </span>
      </div>

      <!-- BOTONES DE ADICIÓN AUTÓNOMA: EQUIPO Y PERSONAL -->
      <div v-if="!disabled" class="flex items-center gap-2">
        <button
          type="button"
          @click="agregarEquipoAutonomo"
          class="field-input px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-1.5 cursor-pointer transition-all border-slate-700 hover:border-amber-500/50"
          title="Incorporar una grúa, camión pluma o equipo principal adicional para faena"
        >
          <span class="text-amber-400 font-bold leading-none">+</span>
          <span>Agregar Equipo</span>
        </button>
        <button
          type="button"
          @click="agregarPersonalAutonomo"
          class="field-input px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-1.5 cursor-pointer transition-all border-slate-700 hover:border-blue-500/50"
          title="Incorporar Prevencionista, Supervisor, Rigger u otro profesional independiente"
        >
          <span class="text-blue-400 font-bold leading-none">+</span>
          <span>Agregar Personal</span>
        </button>
      </div>
    </div>

    <!-- BANNER DE LÍNEA DE CORTE TEMPORAL E INMUTABILIDAD DEL PASADO REPORTADO (SPEC-16 §28.4) -->
    <div
      v-if="fechaCorteInmutable"
      class="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3 text-xs text-amber-200 flex items-center justify-between gap-3 shadow-sm"
    >
      <div class="flex items-center gap-2">
        <span class="text-base">🔒</span>
        <div>
          <strong class="text-amber-300 font-semibold">Servicio con Jornadas en Faena:</strong>
          <span> Existen reportes diarios emitidos hasta el <strong>{{ formatearFechaLocal(fechaCorteInmutable) }}</strong>. La asignación histórica de equipos y tripulación previa a esta fecha está protegida y es inmutable.</span>
        </div>
      </div>
      <span class="text-[11px] font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
        Corte: {{ fechaCorteInmutable }}
      </span>
    </div>

    <!-- ESTADO VACÍO -->
    <div
      v-if="serviciosLista.length === 0"
      class="surface-card rounded-lg p-8 text-center text-xs text-slate-400 italic"
    >
      No hay servicios estructurados en este requerimiento. Puedes agregar equipos o personal usando la barra superior.
    </div>

    <!-- TARJETAS DE SERVICIOS EN ÁRBOL ESTILO ESTRUCTURADOR COMERCIAL -->
    <div
      v-for="(srv, srvIdx) in serviciosLista"
      :key="srv.id_servicio || srv._uid || srvIdx"
      class="surface-card rounded-lg overflow-hidden"
    >
      <!-- CABECERA DEL SERVICIO BASE (IDÉNTICA AL ESTRUCTURADOR COMERCIAL) -->
      <div class="p-3 bg-[#0d1320] border-b border-[#1f2937] flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 flex-1 min-w-[200px]">
          <!-- Botón de Colapso -->
          <button
            type="button"
            @click="srv.colapsado = !srv.colapsado"
            class="p-1 rounded cursor-pointer text-slate-400 hover:text-slate-200"
            title="Expandir / Contraer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              :style="{ transform: srv.colapsado ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }"
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          <!-- Correlativo -->
          <span class="tabular font-mono text-xs font-semibold text-slate-400">
            {{ String(srvIdx + 1).padStart(2, '0') }}
          </span>

          <!-- Badge Línea de Negocio -->
          <span class="px-2 py-0.5 rounded text-xs font-semibold bg-[#111827] text-slate-200 border border-[#334155]">
            {{ getTipoServicio(srv) }}
          </span>

          <!-- Título del Servicio -->
          <span class="text-xs sm:text-sm font-semibold text-slate-100 truncate">
            {{ getDescripcionServicio(srv) }}
          </span>

          <!-- Badge si fue agregada en Operaciones -->
          <span v-if="srv.is_agregado_operaciones" class="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
            + Operativo
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-300 font-semibold font-mono">{{ getSubcategoriaTexto(srv) }}</span>
          <span class="text-xs text-slate-500">•</span>
          <span class="text-xs text-slate-400 font-mono">{{ formatResumenCantidadServicio(srv) }}</span>
          <button
            v-if="srv.is_agregado_operaciones"
            type="button"
            @click="eliminarServicioOperativo(srvIdx)"
            :disabled="disabled"
            class="p-1 rounded cursor-pointer text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-2"
            title="Eliminar este equipo operativo"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- TABLA EN ÁRBOL ESTILO EXPLORADOR -->
      <div v-show="!srv.colapsado" class="overflow-x-auto pb-1">
        <table class="tree-table w-full text-left border-collapse">
          <thead>
            <tr class="text-xs font-medium text-slate-400 border-b border-[#1f2937]">
              <th class="py-2.5 px-4 w-[28%]">
                {{ getTipoServicio(srv) === 'PROFESIONAL' ? 'Cargo Requerido' : 'Equipo / Requerimiento' }}
              </th>
              <th class="py-2.5 px-3 w-[26%]">Equipo / Vehículo Asignado</th>
              <th class="py-2.5 px-3 w-[28%]">Tripulación (Operador / Rigger / Chofer)</th>
              <th class="py-2.5 px-3 w-[15%]">Ventana Faena</th>
              <th class="py-2.5 px-2 w-[3%] text-center">Acc</th>
            </tr>
          </thead>
          <tbody>
            
            <!-- 1. NODO RAÍZ PRINCIPAL (EQUIPO DE IZAJE / RENTAL / CARGO) -->
            <tr class="hover:bg-white/[0.02] transition-colors align-top">
              
              <!-- CELDA ÁRBOL NODO PADRE CON TOGGLE [-]/[+] -->
              <td
                class="py-2.5 px-4 tree-parent-cell"
                :class="{ 'has-children': getRamasOperativasVisibles(srv).length > 0 || !disabled }"
              >
                <div class="flex items-start gap-2">
                  <span class="tree-toggle-box mt-0.5">−</span>
                  <div class="space-y-0.5 flex-1 min-w-0">
                    <!-- Si es Servicio Profesional: Selector de Especialidad / Cargo -->
                    <div v-if="getTipoServicio(srv) === 'PROFESIONAL'" class="space-y-1">
                      <select
                        :value="getCargoProfesionalServicio(srv)"
                        @change="onCargoProfesionalServicioChange(srv, $event.target.value)"
                        :disabled="disabled"
                        class="field-input px-2 py-1 text-xs font-semibold text-slate-100 w-full cursor-pointer"
                      >
                        <option v-for="c in listaEspecialidadesPersonal" :key="c.id || c.nombre" :value="c.nombre">
                          {{ c.nombre }}
                        </option>
                      </select>
                      <div class="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pl-1">
                        <span>{{ formatResumenCantidadServicio(srv) }}</span>
                      </div>
                    </div>

                    <!-- Si es Servicio de Maquinaria / Transporte -->
                    <div v-else>
                      <div class="font-semibold text-xs text-slate-100 leading-snug">
                        {{ getDescripcionServicio(srv) }}
                      </div>
                      <div class="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <span class="text-slate-300">{{ getSubcategoriaTexto(srv) }}</span>
                        <span>•</span>
                        <span>{{ formatResumenCantidadServicio(srv) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </td>

              <!-- COLUMNA OPERATIVA: EQUIPO ASIGNADO Y RELEVOS (REQ-1120 / SPEC-16 SEC 27) -->
              <td class="py-2.5 px-3">
                <div v-if="getTipoServicio(srv) !== 'PROFESIONAL'" class="space-y-1.5">
                  <div class="flex items-center justify-between text-[11px] text-slate-400">
                    <span class="font-medium text-slate-300">Equipo(s) Titular y Relevos</span>
                    <button
                      type="button"
                      @click="agregarTurnoEquipoRelevo(srv)"
                      :disabled="disabled"
                      class="text-[10px] text-slate-300 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono cursor-pointer disabled:opacity-50"
                      title="Asignar relevo / sustitución de equipo por fechas"
                    >
                      + Relevo
                    </button>
                  </div>

                  <!-- Lista de Turnos / Relevos de Equipos -->
                  <div class="space-y-1">
                    <div
                      v-for="(turnoEq, eqIdx) in getTurnosEquipo(srv)"
                      :key="'srv-turno-eq-'+eqIdx"
                      class="flex flex-col gap-1 bg-[#0b101b] p-1 rounded border border-[#1f2937]"
                    >
                      <div class="flex items-center gap-1.5">
                        <span class="text-[10px] font-mono text-slate-400 w-8 flex-shrink-0">
                          {{ eqIdx === 0 ? 'EQ:' : `R${eqIdx}:` }}
                        </span>

                        <div class="flex-1 flex items-center gap-1 min-w-[140px]">
                          <select
                            v-model="turnoEq.equipo_id"
                            @change="onTurnoEquipoSelectChange(srv, eqIdx, turnoEq.equipo_id)"
                            :disabled="disabled || (eqIdx === 0 && Boolean(fechaCorteInmutable))"
                            :title="(eqIdx === 0 && fechaCorteInmutable) ? '🔒 Inmutable: Cuenta con reportes en faena hasta el ' + fechaCorteInmutable + '. Para cambiar equipo, use + Relevo' : 'Seleccionar Equipo'"
                            class="field-input w-full px-1.5 py-0.5 text-xs cursor-pointer truncate disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="" class="bg-[#111827] text-slate-400">-- Seleccionar Equipo ({{ getSubcategoriaTexto(srv) || 'Flota' }}) --</option>
                            
                            <!-- SUGERIDOS (SUBCATEGORÍA EXACTA) -->
                            <optgroup v-if="getEquiposAgrupados(srv).sugeridos.length > 0" label="Sugeridos (Subcategoría Exacta)" class="bg-[#111827] text-slate-200 font-semibold">
                              <option v-for="eq in getEquiposAgrupados(srv).sugeridos" :key="'eq-sug-'+(eq.id_equipo||eq.patente)" :value="eq.id_equipo || eq.patente" class="bg-[#111827] text-slate-100">
                                {{ eq.patente || 'S/P' }} - {{ eq.nombre_equipo || eq.modelo }} [{{ eq.nombre_subcategoria || eq.subcategoria }}]
                              </option>
                            </optgroup>

                            <!-- RESTO DE FLOTA ACTIVA (SIEMPRE DISPONIBLE PARA SUSTITUCIÓN) -->
                            <optgroup v-if="getEquiposAgrupados(srv).otros.length > 0" label="Resto de Flota Activa (Sustitución)" class="bg-[#111827] text-slate-400 font-semibold">
                              <option v-for="eq in getEquiposAgrupados(srv).otros" :key="'eq-otr-'+(eq.id_equipo||eq.patente)" :value="eq.id_equipo || eq.patente" class="bg-[#111827] text-slate-300">
                                {{ eq.patente || 'S/P' }} - {{ eq.nombre_equipo || eq.modelo }} [{{ eq.nombre_subcategoria || eq.subcategoria }}]
                              </option>
                            </optgroup>
                          </select>

                          <!-- Semáforo de Acreditación Sobrio -->
                          <template v-if="turnoEq.equipo_id">
                            <button
                              type="button"
                              @click="abrirAcreditacionEquipo(turnoEq.equipo_id)"
                              class="px-1 py-0.5 rounded text-[10px] font-mono font-semibold flex-shrink-0 cursor-pointer border transition-colors"
                              :class="getSemaforoClaseSobria(getSemaforoEquipo(turnoEq.equipo_id))"
                              :title="'Acreditación de Equipo: ' + getSemaforoEquipo(turnoEq.equipo_id)"
                            >
                              {{ getSemaforoTexto(getSemaforoEquipo(turnoEq.equipo_id)) }}
                            </button>
                          </template>

                          <!-- Quitar Relevo -->
                          <button
                            v-if="eqIdx > 0"
                            type="button"
                            @click="eliminarTurnoEquipoRelevo(srv, eqIdx)"
                            :disabled="disabled"
                            class="text-slate-500 hover:text-red-400 p-0.5 font-bold cursor-pointer disabled:opacity-40"
                            title="Eliminar este relevo de equipo"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <!-- Fechas del Equipo y Badge Relevo -->
                      <div class="flex items-center justify-between gap-1 text-[10px] font-mono pl-9">
                        <div class="flex items-center gap-0.5">
                          <input
                            type="date"
                            min="2024-01-01"
                            max="2035-12-31"
                            v-model="turnoEq.fecha_ini"
                            @change="onFechasTurnoEquipoCambiadas(srv)"
                            :disabled="disabled || (eqIdx === 0 && Boolean(fechaCorteInmutable))"
                            :min="(eqIdx > 0 && fechaCorteInmutable) ? sumarDiasIso(fechaCorteInmutable, 1) : '2024-01-01'"
                            class="bg-transparent border border-slate-700 rounded px-1 py-0.5 text-slate-200 text-[10px] outline-none [color-scheme:dark] disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <span class="text-slate-500">➔</span>
                          <input
                            type="date"
                            min="2024-01-01"
                            max="2035-12-31"
                            v-model="turnoEq.fecha_fin"
                            @change="onFechasTurnoEquipoCambiadas(srv)"
                            :disabled="disabled"
                            class="bg-transparent border border-slate-700 rounded px-1 py-0.5 text-slate-200 text-[10px] outline-none [color-scheme:dark] disabled:opacity-60"
                          />
                        </div>
                        <span v-if="eqIdx > 0" class="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded border border-amber-500/40">
                          RELEVO
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-xs text-slate-500 italic py-1">
                  Dotación Profesional (Sin equipo físico)
                </div>
              </td>

              <!-- COLUMNA OPERATIVA: TRIPULACIÓN (OPERADOR & RIGGER) -->
              <td class="py-2.5 px-3">
                <div v-if="getTipoServicio(srv) !== 'RENTAL' && getTipoServicio(srv) !== 'PROFESIONAL'" class="space-y-1.5">
                  
                  <!-- OPERADOR TITULAR Y RELEVOS -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-[11px] text-slate-400">
                      <span class="font-medium text-slate-300">Operador(es) Titular y Relevos</span>
                      <button
                        type="button"
                        @click="agregarTurnoRelevo(srv)"
                        :disabled="disabled"
                        class="text-[10px] text-slate-300 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono cursor-pointer disabled:opacity-50"
                        title="Asignar relevo de operador por fechas"
                      >
                        + Relevo
                      </button>
                    </div>

                    <!-- Lista de Turnos / Relevos de Operadores -->
                    <div class="space-y-1">
                      <div
                        v-for="(turno, tIdx) in getTurnosOperador(srv)"
                        :key="'srv-turno-'+tIdx"
                        class="flex items-center gap-1.5 bg-[#0b101b] p-1 rounded border border-[#1f2937]"
                      >
                        <span class="text-[10px] font-mono text-slate-400 w-8 flex-shrink-0">
                          {{ tIdx === 0 ? 'OP:' : `R${tIdx}:` }}
                        </span>

                        <div class="flex-1 flex items-center gap-1 min-w-[140px]">
                          <select
                            v-model="turno.operador_id"
                            @change="onOperadorCambiado(srv)"
                            :disabled="disabled || (tIdx === 0 && Boolean(fechaCorteInmutable))"
                            :title="(tIdx === 0 && fechaCorteInmutable) ? '🔒 Inmutable: Cuenta con reportes en faena hasta el ' + fechaCorteInmutable + '. Para cambiar operador, use + Relevo' : 'Seleccionar Operador'"
                            class="field-input w-full px-1.5 py-0.5 text-xs cursor-pointer truncate disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="" class="bg-[#111827] text-slate-400">-- Seleccionar Operador --</option>
                            <optgroup v-if="getUsuariosAgrupados(getCargoRequerido(srv)).sugeridos.length > 0" label="Operadores Calificados" class="bg-[#111827] text-slate-200 font-semibold">
                              <option v-for="u in getUsuariosAgrupados(getCargoRequerido(srv)).sugeridos" :key="'op-sug-'+u.id_user" :value="u.id_user" class="bg-[#111827] text-slate-100">
                                {{ u.nombre_user || u.name_user || (u.name_frst + ' ' + (u.apellido_pat||'')) }} {{ u.cargo ? '(' + u.cargo + ')' : '' }}
                              </option>
                            </optgroup>
                            <optgroup label="Resto de Personal Activo" class="bg-[#111827] text-slate-400 font-semibold">
                              <option v-for="u in getUsuariosAgrupados(getCargoRequerido(srv)).otros" :key="'op-otr-'+u.id_user" :value="u.id_user" class="bg-[#111827] text-slate-300">
                                {{ u.nombre_user || u.name_user || (u.name_frst + ' ' + (u.apellido_pat||'')) }} {{ u.cargo ? '• ' + u.cargo : '' }}
                              </option>
                            </optgroup>
                          </select>

                          <!-- Semáforo Operador -->
                          <template v-if="turno.operador_id">
                            <button
                              type="button"
                              @click="abrirAcreditacionPersona(turno.operador_id, getCargoRequerido(srv))"
                              class="px-1 py-0.5 rounded text-[10px] font-mono font-semibold flex-shrink-0 cursor-pointer border"
                              :class="getSemaforoClaseSobria(getSemaforoTripulante(turno.operador_id))"
                              :title="'Acreditación de Operador: ' + getSemaforoTripulante(turno.operador_id)"
                            >
                              {{ getSemaforoTexto(getSemaforoTripulante(turno.operador_id)) }}
                            </button>
                          </template>
                        </div>

                        <!-- Fechas del Turno -->
                        <div class="flex items-center gap-0.5 flex-shrink-0 text-[10px] font-mono">
                          <input
                            type="date"
                            min="2024-01-01"
                            max="2035-12-31"
                            v-model="turno.fecha_ini"
                            @change="onFechasTurnoCambiadas(srv)"
                            :disabled="disabled || (tIdx === 0 && Boolean(fechaCorteInmutable))"
                            :min="(tIdx > 0 && fechaCorteInmutable) ? sumarDiasIso(fechaCorteInmutable, 1) : '2024-01-01'"
                            class="bg-transparent border border-slate-700 rounded px-1 py-0.5 text-slate-200 text-[10px] outline-none [color-scheme:dark] disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <span class="text-slate-500">➔</span>
                          <input
                            type="date"
                            min="2024-01-01"
                            max="2035-12-31"
                            v-model="turno.fecha_fin"
                            @change="onFechasTurnoCambiadas(srv)"
                            :disabled="disabled"
                            class="bg-transparent border border-slate-700 rounded px-1 py-0.5 text-slate-200 text-[10px] outline-none [color-scheme:dark] disabled:opacity-60"
                          />
                        </div>

                        <!-- Quitar Relevo -->
                        <button
                          v-if="tIdx > 0"
                          type="button"
                          @click="eliminarTurnoRelevo(srv, tIdx)"
                          :disabled="disabled"
                          class="text-slate-500 hover:text-red-400 p-0.5 font-bold cursor-pointer disabled:opacity-40"
                          title="Eliminar este relevo"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- RIGGER DE MANIOBRA (OPCIONAL) -->
                  <div v-if="getTipoServicio(srv) === 'IZAJE'" class="pt-1 border-t border-[#1f2937]">
                    <div class="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                      <span class="font-medium text-slate-300">Rigger de Maniobra</span>
                      <button
                        type="button"
                        @click="abrirModalRiggerExt(srv)"
                        :disabled="disabled"
                        class="text-[10px] text-slate-300 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono cursor-pointer disabled:opacity-50"
                        title="Enrolar y asignar Rigger Externo"
                      >
                        + Rigger Ext
                      </button>
                    </div>

                    <div class="flex items-center gap-1.5">
                      <select
                        :value="getRiggerAsignadoId(srv)"
                        @change="onRiggerSelectChange(srv, $event.target.value)"
                        :disabled="disabled"
                        class="field-input w-full px-2 py-0.5 text-xs cursor-pointer truncate"
                      >
                        <option value="" class="bg-[#111827] text-slate-400">-- Seleccionar Rigger (Opcional) --</option>
                        <optgroup v-if="getUsuariosAgrupados('Rigger').sugeridos.length > 0" label="Riggers Calificados" class="bg-[#111827] text-slate-200 font-semibold">
                          <option v-for="u in getUsuariosAgrupados('Rigger').sugeridos" :key="'rig-sug-'+u.id_user" :value="u.id_user" class="bg-[#111827] text-slate-100">
                            {{ u.nombre_user || u.name_user || (u.name_frst + ' ' + (u.apellido_pat||'')) }} {{ u.cargo ? '(' + u.cargo + ')' : '' }} {{ (u.is_externo || u.json_data?.is_externo) ? '🏢 [EXTERNO]' : '' }}
                          </option>
                        </optgroup>
                        <optgroup label="Resto de Personal Activo" class="bg-[#111827] text-slate-400 font-semibold">
                          <option v-for="u in getUsuariosAgrupados('Rigger').otros" :key="'rig-otr-'+u.id_user" :value="u.id_user" class="bg-[#111827] text-slate-300">
                            {{ u.nombre_user || u.name_user || (u.name_frst + ' ' + (u.apellido_pat||'')) }} {{ u.cargo ? '• ' + u.cargo : '' }} {{ (u.is_externo || u.json_data?.is_externo) ? '🏢 [EXTERNO]' : '' }}
                          </option>
                        </optgroup>
                      </select>

                      <!-- Semáforo Rigger -->
                      <template v-if="getRiggerAsignadoId(srv)">
                        <button
                          type="button"
                          @click="abrirAcreditacionPersona(getRiggerAsignadoId(srv), 'Rigger')"
                          class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold flex-shrink-0 cursor-pointer border"
                          :class="getSemaforoClaseSobria(getSemaforoTripulante(getRiggerAsignadoId(srv)))"
                          :title="'Acreditación de Rigger: ' + getSemaforoTripulante(getRiggerAsignadoId(srv))"
                        >
                          {{ getSemaforoTexto(getSemaforoTripulante(getRiggerAsignadoId(srv))) }}
                        </button>
                      </template>
                    </div>
                  </div>

                </div>

                <!-- RENTAL DRY LEASE -->
                <div v-else-if="getTipoServicio(srv) === 'RENTAL'" class="text-xs text-slate-400 py-1 flex items-center gap-1.5">
                  <span class="text-slate-500 font-mono">•</span>
                  <span>Dry Lease (Sin tripulación en faena). Gobernado por Acta de Entrega/Retiro.</span>
                </div>

                <!-- PROFESIONAL DIRECTO -->
                <div v-else-if="getTipoServicio(srv) === 'PROFESIONAL'" class="space-y-1">
                  <div class="flex items-center gap-1.5">
                    <select
                      :value="getOperadorPrincipalId(srv)"
                      @change="onOperadorDirectoChange(srv, $event.target.value)"
                      :disabled="disabled"
                      class="field-input w-full px-2 py-1 text-xs cursor-pointer truncate"
                    >
                      <option value="" class="bg-[#111827] text-slate-400">-- Seleccionar {{ getCargoProfesionalServicio(srv) }} --</option>
                      <optgroup v-if="getUsuariosAgrupados(getCargoProfesionalServicio(srv)).sugeridos.length > 0" :label="'Sugeridos (' + getCargoProfesionalServicio(srv) + ')'" class="bg-[#111827] text-slate-200 font-semibold">
                        <option v-for="u in getUsuariosAgrupados(getCargoProfesionalServicio(srv)).sugeridos" :key="'prof-sug-'+u.id_user" :value="u.id_user" class="bg-[#111827] text-slate-100">
                          {{ u.nombre_user || u.name_user || (u.name_frst + ' ' + (u.apellido_pat||'')) }} {{ u.cargo ? '(' + u.cargo + ')' : '' }}
                        </option>
                      </optgroup>
                      <optgroup label="Resto de Personal Activo" class="bg-[#111827] text-slate-400 font-semibold">
                        <option v-for="u in getUsuariosAgrupados(getCargoProfesionalServicio(srv)).otros" :key="'prof-otr-'+u.id_user" :value="u.id_user" class="bg-[#111827] text-slate-300">
                          {{ u.nombre_user || u.name_user || (u.name_frst + ' ' + (u.apellido_pat||'')) }} {{ u.cargo ? '• ' + u.cargo : '' }}
                        </option>
                      </optgroup>
                    </select>

                    <template v-if="getOperadorPrincipalId(srv)">
                      <button
                        type="button"
                        @click="abrirAcreditacionPersona(getOperadorPrincipalId(srv), getCargoProfesionalServicio(srv))"
                        class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold flex-shrink-0 cursor-pointer border"
                        :class="getSemaforoClaseSobria(getSemaforoTripulante(getOperadorPrincipalId(srv)))"
                        :title="'Acreditación de Profesional: ' + getSemaforoTripulante(getOperadorPrincipalId(srv))"
                      >
                        {{ getSemaforoTexto(getSemaforoTripulante(getOperadorPrincipalId(srv))) }}
                      </button>
                    </template>
                  </div>
                </div>
              </td>

              <!-- COLUMNA OPERATIVA: VENTANA DE FECHAS -->
              <td class="py-2.5 px-3">
                <div class="flex items-center gap-1 text-[11px] font-mono">
                  <input
                    type="date"
                    min="2024-01-01"
                    max="2035-12-31"
                    v-model="srv.fecha_plan_ini"
                    @change="emit('dirty')"
                    :disabled="disabled"
                    class="field-input px-1.5 py-1 text-slate-200 outline-none [color-scheme:dark] disabled:opacity-60 w-28"
                  />
                  <span class="text-slate-500">➔</span>
                  <input
                    type="date"
                    min="2024-01-01"
                    max="2035-12-31"
                    v-model="srv.fecha_plan_fin"
                    @change="emit('dirty')"
                    :disabled="disabled"
                    class="field-input px-1.5 py-1 text-slate-200 outline-none [color-scheme:dark] disabled:opacity-60 w-28"
                  />
                </div>
              </td>

              <!-- COLUMNA ACCIONES -->
              <td class="py-2.5 px-2 text-center">
                <!-- Espacio alineador para nodo padre -->
              </td>

            </tr>

            <!-- 2. RAMAS SUBORDINADAS / HIJAS FILTRADAS POR SPEC-065 (CAMA BAJA, CONTRAPESOS, PERSONAL) -->
            <tr
              v-for="(rama, rIdx) in getRamasOperativasVisibles(srv)"
              :key="rama.id_linea || rama.id_rama || rIdx"
              class="hover:bg-white/[0.02] transition-colors align-top"
            >
              <!-- CELDA RAMA CON CONECTOR VISUAL CONTINUO DE ÁRBOL -->
              <td
                class="py-2 px-4 tree-branch-cell"
                :class="{ 'is-last': disabled && rIdx === getRamasOperativasVisibles(srv).length - 1 }"
              >
                <!-- Rama de Personal: Selector de Especialidad / Cargo -->
                <div v-if="esRamaPersonal(rama)" class="space-y-1">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60">
                      Personal
                    </span>
                    <select
                      :value="getCargoRamaValue(rama)"
                      @change="onCargoRamaChange(srv, rama, $event.target.value)"
                      :disabled="disabled"
                      class="field-input px-2 py-0.5 text-xs font-semibold text-slate-100 flex-1 min-w-[130px] cursor-pointer"
                    >
                      <option v-for="c in listaEspecialidadesPersonal" :key="c.id || c.nombre" :value="c.nombre">
                        {{ c.nombre }}
                      </option>
                    </select>
                    <span v-if="rama.is_agregado_operaciones" class="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/20">
                      + Adicional
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-400 font-mono pl-1">
                    <span>{{ formatResumenCantidadRama(rama) }}</span>
                  </div>
                </div>

                <!-- Rama de Transporte / Apoyo -->
                <div v-else class="space-y-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {{ getTipoRama(rama) }}
                    </span>
                    <span class="text-xs font-semibold text-slate-200 truncate">
                      {{ getDescripcionRama(rama) }}
                    </span>
                    <span v-if="rama.is_agregado_operaciones" class="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/20">
                      + Adicional
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-400 font-mono flex items-center gap-1 pl-1">
                    <span class="text-slate-300">{{ getSubcategoriaRamaTexto(rama) }}</span>
                    <span>•</span>
                    <span>{{ formatResumenCantidadRama(rama) }}</span>
                  </div>
                </div>
              </td>

              <!-- COLUMNA OPERATIVA: VEHÍCULO DE TRANSPORTE / LOGÍSTICA -->
              <td class="py-2 px-3">
                <div v-if="esRamaTransporte(rama)" class="space-y-1">
                  <!-- Modalidad de traslado si fue agregada en operaciones -->
                  <div v-if="rama.is_agregado_operaciones" class="mb-1">
                    <select
                      v-model="rama.modalidad_traslado"
                      @change="emit('dirty')"
                      :disabled="disabled"
                      class="field-input w-full px-1.5 py-0.5 text-[10px] font-semibold text-slate-300"
                    >
                      <option value="IDA_VUELTA">🔄 Ida y Vuelta Completa</option>
                      <option value="SOLO_IDA">➡️ Solo Ida (Entrega)</option>
                      <option value="SOLO_RETORNO">⬅️ Solo Retorno (Retiro)</option>
                    </select>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <select
                      v-model="rama.equipo_asignado_id"
                      @change="onRamaCambiado(srv, rama)"
                      :disabled="disabled"
                      class="field-input w-full px-2 py-1 text-xs cursor-pointer truncate"
                    >
                      <option value="" class="bg-[#111827] text-slate-400">-- Seleccionar Vehículo ({{ getSubcategoriaRamaTexto(rama) }}) --</option>
                      
                      <!-- SUGERIDOS DE TRANSPORTE SEGÚN SUBCATEGORÍA -->
                      <optgroup v-if="getEquiposTransporteAgrupados(rama).sugeridos.length > 0" label="Sugeridos de Transporte" class="bg-[#111827] text-slate-200 font-semibold">
                        <option v-for="eq in getEquiposTransporteAgrupados(rama).sugeridos" :key="'tr-sug-'+(eq.id_equipo||eq.patente)" :value="eq.id_equipo || eq.patente" class="bg-[#111827] text-slate-100">
                          {{ eq.patente || 'S/P' }} - {{ eq.nombre_equipo || eq.modelo }} [{{ eq.nombre_subcategoria || eq.subcategoria }}]
                        </option>
                      </optgroup>

                      <!-- RESTO DE FLOTA LOGÍSTICA -->
                      <optgroup v-if="getEquiposTransporteAgrupados(rama).otros.length > 0" label="Resto de Flota Logística" class="bg-[#111827] text-slate-400 font-semibold">
                        <option v-for="eq in getEquiposTransporteAgrupados(rama).otros" :key="'tr-otr-'+(eq.id_equipo||eq.patente)" :value="eq.id_equipo || eq.patente" class="bg-[#111827] text-slate-300">
                          {{ eq.patente || 'S/P' }} - {{ eq.nombre_equipo || eq.modelo }} [{{ eq.nombre_subcategoria || eq.subcategoria }}]
                        </option>
                      </optgroup>
                    </select>

                    <template v-if="rama.equipo_asignado_id">
                      <button
                        type="button"
                        @click="abrirAcreditacionEquipo(rama.equipo_asignado_id)"
                        class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold flex-shrink-0 cursor-pointer border"
                        :class="getSemaforoClaseSobria(getSemaforoEquipo(rama.equipo_asignado_id))"
                        :title="'Acreditación de Vehículo: ' + getSemaforoEquipo(rama.equipo_asignado_id)"
                      >
                        {{ getSemaforoTexto(getSemaforoEquipo(rama.equipo_asignado_id)) }}
                      </button>
                    </template>
                  </div>
                </div>
                <div v-else class="text-xs text-slate-500 italic py-1">
                  Personal / Apoyo (Sin vehículo)
                </div>
              </td>

              <!-- COLUMNA OPERATIVA: CHOFER / CONDUCTOR / ESPECIALISTA -->
              <td class="py-2 px-3">
                
                <!-- CHOFER DE TRANSPORTE / CAMA BAJA -->
                <div v-if="esRamaTransporte(rama)" class="space-y-1">
                  <div class="flex items-center gap-1.5">
                    <select
                      v-model="rama.chofer_id"
                      @change="onRamaCambiado(srv, rama)"
                      :disabled="disabled"
                      class="field-input w-full px-2 py-1 text-xs cursor-pointer truncate"
                    >
                      <option value="" class="bg-[#111827] text-slate-400">-- Seleccionar Chofer / Escolta --</option>
                      <optgroup v-if="getUsuariosAgrupados('Chofer Cama Baja').sugeridos.length > 0" label="Choferes Calificados" class="bg-[#111827] text-slate-200 font-semibold">
                        <option v-for="u in getUsuariosAgrupados('Chofer Cama Baja').sugeridos" :key="'ch-sug-'+u.id_user" :value="u.id_user" class="bg-[#111827] text-slate-100">
                          {{ u.nombre_user || u.name_user || (u.name_frst + ' ' + (u.apellido_pat||'')) }} {{ u.cargo ? '(' + u.cargo + ')' : '' }}
                        </option>
                      </optgroup>
                      <optgroup label="Resto de Personal Activo" class="bg-[#111827] text-slate-400 font-semibold">
                        <option v-for="u in getUsuariosAgrupados('Chofer Cama Baja').otros" :key="'ch-otr-'+u.id_user" :value="u.id_user" class="bg-[#111827] text-slate-300">
                          {{ u.nombre_user || u.name_user || (u.name_frst + ' ' + (u.apellido_pat||'')) }} {{ u.cargo ? '• ' + u.cargo : '' }}
                        </option>
                      </optgroup>
                    </select>

                    <template v-if="rama.chofer_id">
                      <button
                        type="button"
                        @click="abrirAcreditacionPersona(rama.chofer_id, 'Chofer')"
                        class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold flex-shrink-0 cursor-pointer border"
                        :class="getSemaforoClaseSobria(getSemaforoTripulante(rama.chofer_id))"
                        :title="'Acreditación de Chofer: ' + getSemaforoTripulante(rama.chofer_id)"
                      >
                        {{ getSemaforoTexto(getSemaforoTripulante(rama.chofer_id)) }}
                      </button>
                    </template>
                  </div>
                </div>

                <!-- ESPECIALISTA / PERSONAL TÉCNICO -->
                <div v-else-if="esRamaPersonal(rama)" class="space-y-1">
                  <div class="flex items-center gap-1.5">
                    <select
                      v-model="rama.id_user"
                      @change="onRamaCambiado(srv, rama)"
                      :disabled="disabled"
                      class="field-input w-full px-2 py-1 text-xs cursor-pointer truncate"
                    >
                      <option value="" class="bg-[#111827] text-slate-400">-- Seleccionar {{ getCargoRamaValue(rama) }} --</option>
                      <optgroup v-if="getUsuariosAgrupados(getCargoRamaValue(rama)).sugeridos.length > 0" :label="'Sugeridos (' + getCargoRamaValue(rama) + ')'" class="bg-[#111827] text-slate-200 font-semibold">
                        <option v-for="u in getUsuariosAgrupados(getCargoRamaValue(rama)).sugeridos" :key="'esp-sug-'+u.id_user" :value="u.id_user" class="bg-[#111827] text-slate-100">
                          {{ u.nombre_user || u.name_user || (u.name_frst + ' ' + (u.apellido_pat||'')) }} {{ u.cargo ? '(' + u.cargo + ')' : '' }}
                        </option>
                      </optgroup>
                      <optgroup label="Resto de Personal Activo" class="bg-[#111827] text-slate-400 font-semibold">
                        <option v-for="u in getUsuariosAgrupados(getCargoRamaValue(rama)).otros" :key="'esp-otr-'+u.id_user" :value="u.id_user" class="bg-[#111827] text-slate-300">
                          {{ u.nombre_user || u.name_user || (u.name_frst + ' ' + (u.apellido_pat||'')) }} {{ u.cargo ? '• ' + u.cargo : '' }}
                        </option>
                      </optgroup>
                    </select>

                    <template v-if="rama.id_user">
                      <button
                        type="button"
                        @click="abrirAcreditacionPersona(rama.id_user, getCargoRamaValue(rama))"
                        class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold flex-shrink-0 cursor-pointer border"
                        :class="getSemaforoClaseSobria(getSemaforoTripulante(rama.id_user))"
                        :title="'Acreditación de Especialista: ' + getSemaforoTripulante(rama.id_user)"
                      >
                        {{ getSemaforoTexto(getSemaforoTripulante(rama.id_user)) }}
                      </button>
                    </template>
                  </div>
                </div>

              </td>

              <!-- COLUMNA OPERATIVA: VENTANA DE FECHAS DE TRASLADO -->
              <td class="py-2 px-3">
                <div class="flex items-center gap-1 text-[11px] font-mono">
                  <input
                    type="date"
                    min="2024-01-01"
                    max="2035-12-31"
                    v-model="rama.fecha_plan_ini"
                    @change="onRamaCambiado(srv, rama)"
                    :disabled="disabled"
                    class="field-input px-1.5 py-1 text-slate-200 outline-none [color-scheme:dark] disabled:opacity-60 w-28"
                  />
                  <span class="text-slate-500">➔</span>
                  <input
                    type="date"
                    min="2024-01-01"
                    max="2035-12-31"
                    v-model="rama.fecha_plan_fin"
                    @change="onRamaCambiado(srv, rama)"
                    :disabled="disabled"
                    class="field-input px-1.5 py-1 text-slate-200 outline-none [color-scheme:dark] disabled:opacity-60 w-28"
                  />
                </div>
              </td>

              <!-- COLUMNA ACCIONES -->
              <td class="py-2 px-2 text-center">
                <button
                  v-if="rama.is_agregado_operaciones"
                  type="button"
                  @click="eliminarRamaOperativa(srv, rIdx)"
                  :disabled="disabled"
                  class="text-slate-500 hover:text-red-400 p-0.5 font-bold cursor-pointer transition-colors"
                  title="Eliminar este ítem adicional"
                >
                  ✕
                </button>
              </td>

            </tr>

            <!-- 3. FILA DE AGREGAR ÍTEM AL FINAL DEL ÁRBOL (TERMINA EN CODO └── [+]) -->
            <tr v-if="!disabled" class="hover:bg-white/[0.01] transition-colors">
              <td colspan="5" class="py-2 pr-4 tree-branch-cell is-last">
                <button
                  type="button"
                  @click="abrirAddMenuPopover($event, srvIdx)"
                  class="tree-add-branch-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/90 hover:border-amber-500/60 transition-all shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="w-4 h-4 rounded-sm flex items-center justify-center font-bold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono leading-none group-hover:bg-amber-500/30">+</span>
                  <span class="text-xs">Agregar ítem...</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-400 group-hover:text-amber-400"><path d="m6 9 6 6 6-6"/></svg>
                </button>
              </td>
            </tr>

          </tbody>
        </table>

      </div>

    </div>

    <!-- POPOVER FLOTANTE A NIVEL RAÍZ PARA AGREGAR ÍTEM (FIXED Z-[100] CON GETBOUNDINGCLIENTRECT) -->
    <div
      v-if="addMenuVisible"
      ref="addMenuPopoverRef"
      :style="addMenuStyle"
      class="combo-popover fixed z-[100] w-64 p-1.5 shadow-2xl border border-slate-700 rounded-lg bg-[#111827]"
    >
      <div class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b border-white/10 mb-1 text-slate-400">
        Agregar recurso operativo:
      </div>
      <div class="space-y-0.5">
        <button
          type="button"
          @click="ejecutarAgregarRama('TRASLADO')"
          class="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-slate-800/90 flex items-center gap-2 cursor-pointer transition-colors text-slate-200 hover:text-white"
        >
          <span class="w-4 h-4 rounded-sm flex items-center justify-center font-bold text-xs bg-amber-500/20 text-amber-300 font-mono leading-none">+</span>
          <span class="font-medium">Traslado (Cama Baja / Contrapesos)</span>
        </button>
        <button
          type="button"
          @click="ejecutarAgregarRama('APOYO')"
          class="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-slate-800/90 flex items-center gap-2 cursor-pointer transition-colors text-slate-200 hover:text-white"
        >
          <span class="w-4 h-4 rounded-sm flex items-center justify-center font-bold text-xs bg-amber-500/20 text-amber-300 font-mono leading-none">+</span>
          <span class="font-medium">Vehículo de Apoyo / Escolta</span>
        </button>
        <button
          type="button"
          @click="ejecutarAgregarRama('RIGGER')"
          class="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-slate-800/90 flex items-center gap-2 cursor-pointer transition-colors text-slate-200 hover:text-white"
        >
          <span class="w-4 h-4 rounded-sm flex items-center justify-center font-bold text-xs bg-blue-500/20 text-blue-300 font-mono leading-none">+</span>
          <span class="font-medium">Rigger Certificado</span>
        </button>
        <button
          type="button"
          @click="ejecutarAgregarRama('APR')"
          class="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-slate-800/90 flex items-center gap-2 cursor-pointer transition-colors text-slate-200 hover:text-white"
        >
          <span class="w-4 h-4 rounded-sm flex items-center justify-center font-bold text-xs bg-emerald-500/20 text-emerald-300 font-mono leading-none">+</span>
          <span class="font-medium">Prevencionista de Riesgos (APR)</span>
        </button>
        <button
          type="button"
          @click="ejecutarAgregarRama('SUPERVISOR')"
          class="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-slate-800/90 flex items-center gap-2 cursor-pointer transition-colors text-slate-200 hover:text-white"
        >
          <span class="w-4 h-4 rounded-sm flex items-center justify-center font-bold text-xs bg-indigo-500/20 text-indigo-300 font-mono leading-none">+</span>
          <span class="font-medium">Supervisor de Maniobras</span>
        </button>
        <button
          type="button"
          @click="ejecutarAgregarRama('PERSONAL')"
          class="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-slate-800/90 flex items-center gap-2 cursor-pointer transition-colors text-slate-200 hover:text-white"
        >
          <span class="w-4 h-4 rounded-sm flex items-center justify-center font-bold text-xs bg-slate-500/20 text-slate-300 font-mono leading-none">+</span>
          <span class="font-medium">Otro Especialista / Apoyo</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  servicios: {
    type: Array,
    default: () => []
  },
  lines: {
    type: Array,
    default: () => []
  },
  dbCategories: {
    type: Array,
    default: () => []
  },
  listaEquiposMaster: {
    type: Array,
    default: () => []
  },
  usuarios: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  formatCurrency: {
    type: Function,
    default: (val) => '$ ' + Number(val || 0).toLocaleString('es-CL')
  },
  getSemaforoEquipo: {
    type: Function,
    default: () => 'GREEN'
  },
  getSemaforoTripulante: {
    type: Function,
    default: () => 'GREEN'
  },
  defaultFechaIni: {
    type: String,
    default: ''
  },
  defaultFechaFin: {
    type: String,
    default: ''
  },
  fechaCorteInmutable: {
    type: String,
    default: null
  }
})

const emit = defineEmits([
  'update:servicios',
  'update:lines',
  'dirty',
  'abrir-acreditacion-equipo',
  'abrir-acreditacion-persona',
  'abrir-modal-rigger-ext'
])

// Lista reactiva
const serviciosLista = computed(() => {
  return Array.isArray(props.servicios) ? props.servicios : []
})

// Mapeo seguro polimórfico (nodo primario vs objeto plano)
const getTipoServicio = (srv) => {
  return (srv?.linea_servicio || srv?.tipo || srv?.primario?.tipo || 'IZAJE').toUpperCase()
}

const getIdLineaServicio = (srv) => {
  return srv?.id_linea_servicio || srv?.primario?.id_linea_servicio || srv?.primario?.id_linea || ''
}

const getDescripcionServicio = (srv) => {
  return srv?.primario?.descripcion || srv?.descripcion || srv?.nombre_servicio || 'Servicio Principal'
}

const getSubcategoriaTexto = (srv) => {
  return srv?.primario?.recurso || srv?.subcategoria || srv?.primario?.subcategoria || srv?.nombre_subcategoria || ''
}

const getIdSubcategoriaServicio = (srv) => {
  return Number(srv?.primario?.id_subcategoria || srv?.id_subcategoria || 0)
}

const getIdCategoriaServicio = (srv) => {
  return Number(srv?.primario?.id_categoria || srv?.id_categoria || 0)
}

const formatResumenCantidadServicio = (srv) => {
  const p = srv?.primario || srv || {}
  const unid = p.unidad || srv?.unidad
  if (unid === 'Horas Diarias Minimas') {
    return `${p.dias || p.cantidad || 1} d × ${p.horas_min || 8} h`
  }
  if (unid === 'Horas Mes Minimas') {
    return `${p.meses || p.cantidad || 1} m × ${p.horas_min || 180} h`
  }
  return `${p.cantidad || 1} ${unid || 'Unidad'}`
}

// Filtro Canónico SPEC-065: Oculta traslados de grúas autopropulsadas
const getRamasOperativasVisibles = (srv) => {
  if (!srv || !Array.isArray(srv.ramas)) return []
  const tipoSrv = getTipoServicio(srv)
  const subSrv = getSubcategoriaTexto(srv).toUpperCase()

  // Si es Grúa Telescópica o Camión Pluma, el equipo rueda por carretera con su operador
  const esAutopropulsado = tipoSrv === 'IZAJE' || subSrv.includes('GRUA') || subSrv.includes('PLUMA') || subSrv.includes('LTM')

  return srv.ramas.filter(rama => {
    // Si fue agregada explícitamente en operaciones, SIEMPRE es visible
    if (rama.is_agregado_operaciones) return true

    const tRama = String(rama.tipo_rama || rama.rol || rama.tipo || '').toUpperCase()
    const subRama = String(rama.subcategoria || rama.recurso || rama.descripcion || '').toUpperCase()

    // Si es autopropulsado y la rama es el cobro de traslado de la propia grúa, se oculta de la asignación de chofer
    if (esAutopropulsado && (tRama.includes('TRASLADO') || tRama === 'TRASLADOS')) {
      // Solo se muestra si es explícitamente un camión auxiliar de contrapesos o cama baja separada
      const esAuxiliarContrapeso = subRama.includes('CONTRAPESO') || (subRama.includes('CAMA BAJA') && subSrv.includes('TON') && parseInt(subSrv.replace(/\D/g, '')) >= 90)
      if (!esAuxiliarContrapeso) {
        return false
      }
    }
    return true
  })
}

// Helpers para Ramas Hijas
const getTipoRama = (rama) => {
  const t = String(rama?.tipo_rama || rama?.rol || rama?.tipo || 'APOYO').toUpperCase()
  if (t.includes('TRASLADO')) return 'Traslado'
  if (t.includes('PERSONAL') || t.includes('RIGGER')) return 'Personal'
  return t
}

const getDescripcionRama = (rama) => {
  return rama?.descripcion || rama?.recurso || rama?.subcategoria || 'Servicio de Apoyo'
}

const getSubcategoriaRamaTexto = (rama) => {
  return rama?.recurso || rama?.subcategoria || rama?.nombre_subcategoria || ''
}

const formatResumenCantidadRama = (rama) => {
  if (rama?.unidad === 'Horas Diarias Minimas') {
    return `${rama.dias || rama.cantidad || 1} d × ${rama.horas_min || 8} h`
  }
  return `${rama.cantidad || 1} ${rama.unidad || 'Unidad'}`
}

const esRamaTransporte = (rama) => {
  const t = getTipoRama(rama).toUpperCase()
  const sub = getSubcategoriaRamaTexto(rama).toUpperCase()
  return t === 'TRASLADO' || t === 'APOYO' || sub.includes('SEMIRREMOLQUE') || sub.includes('CAMA BAJA') || sub.includes('RAMPLA') || sub.includes('CAMION') || sub.includes('CAMIONETA') || sub.includes('ESCOLTA')
}

const esRamaPersonal = (rama) => {
  const t = getTipoRama(rama).toUpperCase()
  const sub = getSubcategoriaRamaTexto(rama).toUpperCase()
  const desc = String(rama?.descripcion || '').toUpperCase()
  return t === 'PERSONAL' || sub.includes('RIGGER') || sub.includes('OPERADOR') || sub.includes('CHOFER') || sub.includes('PREV') || sub.includes('APR') || sub.includes('SUPERVIS') || sub.includes('ESPECIALISTA') || desc.includes('RIGGER') || desc.includes('PREV') || desc.includes('SUPERVIS')
}

// Flota de Maquinaria Agrupada: Sugeridos por Subcategoría + Resto de Flota Activa
const getEquiposFiltrados = (srv) => {
  const master = props.listaEquiposMaster || []
  if (!srv) return master
  const subcatId = getIdSubcategoriaServicio(srv)
  if (subcatId > 0) {
    const list = master.filter(eq => Number(eq.id_subcategoria) === subcatId)
    if (list.length > 0) return list
  }
  const catId = getIdCategoriaServicio(srv)
  if (catId > 0) {
    const list = master.filter(eq => Number(eq.id_categoria) === catId)
    if (list.length > 0) return list
  }
  return master
}

const getEquiposAgrupados = (srv) => {
  const master = props.listaEquiposMaster || []
  const sugeridos = getEquiposFiltrados(srv)
  const sugSet = new Set(sugeridos.map(e => String(e.id_equipo || e.patente)))
  const otros = master.filter(e => !sugSet.has(String(e.id_equipo || e.patente)))
  return { sugeridos, otros }
}

// Flota de Transporte y Logística Agrupada
const getEquiposTransporteAgrupados = (rama) => {
  const master = props.listaEquiposMaster || []
  const subcatId = Number(rama?.id_subcategoria || 0)
  
  let sugeridos = []
  if (subcatId > 0) {
    sugeridos = master.filter(eq => Number(eq.id_subcategoria) === subcatId)
  }
  if (sugeridos.length === 0) {
    sugeridos = master.filter(eq => {
      const cat = Number(eq.id_categoria)
      return cat === 62 || cat === 99 || (eq.tipo || '').toUpperCase().includes('CAMION') || (eq.tipo || '').toUpperCase().includes('RAMPLA') || (eq.nombre_subcategoria || '').toUpperCase().includes('REMOLQUE')
    })
  }
  
  const sugSet = new Set(sugeridos.map(e => String(e.id_equipo || e.patente)))
  const otros = master.filter(e => !sugSet.has(String(e.id_equipo || e.patente)))
  return { sugeridos, otros }
}

// Getter / Setter de Equipo Asignado
const getEquipoAsignadoId = (srv) => {
  return srv?.equipo_asignado_id || srv?.primario?.equipo_asignado_id || ''
}

const onEquipoSelectChange = (srv, value) => {
  srv.equipo_asignado_id = value
  if (srv.primario) srv.primario.equipo_asignado_id = value
  const idLin = getIdLineaServicio(srv)
  if (idLin && Array.isArray(props.lines)) {
    const l = props.lines.find(x => String(x.id_linea) === String(idLin) || String(x.id_linea_servicio) === String(idLin) || String(x.id_linea_servicio || x.id_linea) === String(idLin))
    if (l) l.equipo_asignado_id = value
  }
  emit('dirty')
}

// Getter / Setter de Rigger
const getRiggerAsignadoId = (srv) => {
  return srv?.rigger_asignado_id || srv?.primario?.rigger_asignado_id || ''
}

const onRiggerSelectChange = (srv, value) => {
  srv.rigger_asignado_id = value
  if (srv.primario) srv.primario.rigger_asignado_id = value
  const idLin = getIdLineaServicio(srv)
  if (idLin && Array.isArray(props.lines)) {
    const l = props.lines.find(x => String(x.id_linea) === String(idLin) || String(x.id_linea_servicio) === String(idLin) || String(x.id_linea_servicio || x.id_linea) === String(idLin))
    if (l) l.rigger_asignado_id = value
  }
  emit('dirty')
}

// Turnos y Relevos de Equipos (REQ-1120 / SPEC-16 Sección 27)
const getTurnosEquipo = (srv) => {
  if (!srv) return []
  if (!Array.isArray(srv.turnos_equipos) || srv.turnos_equipos.length === 0) {
    const eqId = srv.equipo_asignado_id || srv.primario?.equipo_asignado_id || ''
    srv.turnos_equipos = [{
      equipo_id: eqId,
      fecha_ini: srv.fecha_plan_ini || props.defaultFechaIni || '',
      fecha_fin: srv.fecha_plan_fin || props.defaultFechaFin || '',
      es_reemplazo: false,
      motivo_reemplazo: ''
    }]
  }
  return srv.turnos_equipos
}

const sumarDiasIso = (fechaIso, dias) => {
  if (!fechaIso) return ''
  try {
    const [y, m, d] = String(fechaIso).slice(0, 10).split('-').map(Number)
    if (!y || !m || !d) return ''
    const dateObj = new Date(Date.UTC(y, m - 1, d))
    dateObj.setUTCDate(dateObj.getUTCDate() + dias)
    return dateObj.toISOString().slice(0, 10)
  } catch (e) {
    return ''
  }
}

const formatearFechaLocal = (isoStr) => {
  if (!isoStr) return ''
  const parts = String(isoStr).slice(0, 10).split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return isoStr
}

const agregarTurnoEquipoRelevo = (srv) => {
  const turnos = getTurnosEquipo(srv)
  const last = turnos[turnos.length - 1]
  const fechaIniSugerida = props.fechaCorteInmutable
    ? (sumarDiasIso(props.fechaCorteInmutable, 1) || props.defaultFechaFin || '')
    : (last?.fecha_fin || props.defaultFechaFin || props.defaultFechaIni || '')
  turnos.push({
    equipo_id: '',
    fecha_ini: fechaIniSugerida,
    fecha_fin: last?.fecha_fin || props.defaultFechaFin || '',
    es_reemplazo: true,
    motivo_reemplazo: 'RELEVO_PROGRAMADO'
  })
  emit('dirty')
}

const eliminarTurnoEquipoRelevo = (srv, idx) => {
  if (!srv || !Array.isArray(srv.turnos_equipos)) return
  srv.turnos_equipos.splice(idx, 1)
  if (srv.turnos_equipos.length === 1) {
    srv.equipo_asignado_id = srv.turnos_equipos[0].equipo_id || ''
    if (srv.primario) srv.primario.equipo_asignado_id = srv.equipo_asignado_id
  }
  emit('dirty')
}

const onTurnoEquipoSelectChange = (srv, idx, value) => {
  if (!srv || !Array.isArray(srv.turnos_equipos)) return
  srv.turnos_equipos[idx].equipo_id = value
  if (idx === 0) {
    srv.equipo_asignado_id = value
    if (srv.primario) srv.primario.equipo_asignado_id = value
    const idLin = getIdLineaServicio(srv)
    if (idLin && Array.isArray(props.lines)) {
      const l = props.lines.find(x => String(x.id_linea) === String(idLin) || String(x.id_linea_servicio) === String(idLin))
      if (l) l.equipo_asignado_id = value
    }
  }
  emit('dirty')
}

const onFechasTurnoEquipoCambiadas = (srv) => {
  emit('dirty')
}

// Turnos y Relevos de Operadores
const getTurnosOperador = (srv) => {
  if (!srv) return []
  if (!Array.isArray(srv.turnos_operadores) || srv.turnos_operadores.length === 0) {
    srv.turnos_operadores = [{
      operador_id: srv.operador_asignado_id || srv.primario?.operador_asignado_id || '',
      fecha_ini: srv.fecha_plan_ini || props.defaultFechaIni || '',
      fecha_fin: srv.fecha_plan_fin || props.defaultFechaFin || ''
    }]
  }
  return srv.turnos_operadores
}

const agregarTurnoRelevo = (srv) => {
  const turnos = getTurnosOperador(srv)
  const last = turnos[turnos.length - 1]
  const fechaIniSugerida = props.fechaCorteInmutable
    ? (sumarDiasIso(props.fechaCorteInmutable, 1) || props.defaultFechaFin || '')
    : (last?.fecha_fin || props.defaultFechaFin || props.defaultFechaIni || '')
  turnos.push({
    operador_id: '',
    fecha_ini: fechaIniSugerida,
    fecha_fin: last?.fecha_fin || props.defaultFechaFin || ''
  })
  emit('dirty')
}

const eliminarTurnoRelevo = (srv, idx) => {
  if (!srv || !Array.isArray(srv.turnos_operadores)) return
  srv.turnos_operadores.splice(idx, 1)
  if (srv.turnos_operadores.length === 1) {
    srv.operador_asignado_id = srv.turnos_operadores[0].operador_id || ''
    if (srv.primario) srv.primario.operador_asignado_id = srv.operador_asignado_id
  }
  emit('dirty')
}

const onFechasTurnoCambiadas = (srv) => {
  if (Array.isArray(srv.turnos_operadores) && srv.turnos_operadores.length > 0) {
    srv.fecha_plan_ini = srv.turnos_operadores[0].fecha_ini || srv.fecha_plan_ini
    srv.fecha_plan_fin = srv.turnos_operadores[srv.turnos_operadores.length - 1].fecha_fin || srv.fecha_plan_fin
  }
  emit('dirty')
}

const getCargoRequerido = (srv) => {
  const sub = getSubcategoriaTexto(srv).toUpperCase()
  if (sub.includes('PLUMA')) return 'Operador Camión Pluma'
  return 'Operador'
}

// Opciones de Especialidades de Personal (Cat 151 de BD + Canónicas)
const listaEspecialidadesPersonal = computed(() => {
  const cats = Array.isArray(props.dbCategories) ? props.dbCategories : []
  const cat = cats.find(c => Number(c.id_categoria) === 151)
  if (cat && Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
    return cat.subcategories.map(s => ({
      id: Number(s.id_subcategoria),
      nombre: s.nombre_subcategoria
    }))
  }
  return [
    { id: 160, nombre: 'RIGGER CERTIFICADO' },
    { id: 162, nombre: 'PREVENCIONISTA (APR)' },
    { id: 163, nombre: 'SUPERVISOR DE IZAJE' },
    { id: 161, nombre: 'OPERADOR DE APOYO' },
    { id: 164, nombre: 'CONDUCTOR / CHOFER' },
    { id: 165, nombre: 'ESPECIALISTA GENERAL' }
  ]
})

const getCargoRamaValue = (rama) => {
  return rama?.subcategoria || rama?.recurso || rama?.cargo || 'RIGGER CERTIFICADO'
}

const onCargoRamaChange = (srv, rama, nuevoCargo) => {
  rama.subcategoria = nuevoCargo
  rama.recurso = nuevoCargo
  rama.cargo = nuevoCargo
  rama.descripcion = `Servicio de ${nuevoCargo} en terreno`
  emit('dirty')
}

const getCargoProfesionalServicio = (srv) => {
  return srv?.subcategoria || srv?.primario?.subcategoria || 'RIGGER CERTIFICADO'
}

const onCargoProfesionalServicioChange = (srv, nuevoCargo) => {
  srv.subcategoria = nuevoCargo
  srv.descripcion = `Personal: ${nuevoCargo}`
  srv.nombre_servicio = `Personal: ${nuevoCargo}`
  if (srv.primario) {
    srv.primario.subcategoria = nuevoCargo
    srv.primario.recurso = nuevoCargo
    srv.primario.descripcion = `Personal: ${nuevoCargo}`
  }
  emit('dirty')
}

// Filtro y Agrupación de Usuarios por Especialidad
const getUsuariosAgrupados = (cargoBuscado) => {
  const lista = (props.usuarios || []).filter(u => u.activo !== false && u.is_active !== false)
  const normCargo = String(cargoBuscado || '').toLowerCase().trim()
  
  const sugeridos = []
  const otros = []

  lista.forEach(u => {
    const userCargo = String(u.cargo || u.json_data?.cargo || u.role_name || u.tipo_usuario || '').toLowerCase()
    const name = String(u.nombre_user || u.name_user || u.name_frst || u.username || '').toLowerCase()
    let isMatch = false

    if (normCargo.includes('rigger') || normCargo.includes('maniob')) {
      isMatch = userCargo.includes('rigger') || userCargo.includes('maniob') || name.includes('rigger')
    } else if (normCargo.includes('prev') || normCargo.includes('apr') || normCargo.includes('riesgo') || normCargo.includes('seguridad')) {
      isMatch = userCargo.includes('prev') || userCargo.includes('apr') || userCargo.includes('riesgo') || userCargo.includes('seguridad')
    } else if (normCargo.includes('supervis') || normCargo.includes('jefe') || normCargo.includes('lider')) {
      isMatch = userCargo.includes('supervis') || userCargo.includes('jefe') || userCargo.includes('encarg') || userCargo.includes('coordinad')
    } else if (normCargo.includes('operador')) {
      isMatch = userCargo.includes('operador') || name.includes('operador')
    } else if (normCargo.includes('chofer') || normCargo.includes('conductor') || normCargo.includes('cama baja') || normCargo.includes('transporte')) {
      isMatch = userCargo.includes('chofer') || userCargo.includes('conductor') || userCargo.includes('cama baja') || userCargo.includes('transporte') || userCargo.includes('operador')
    } else {
      isMatch = userCargo.includes(normCargo) || name.includes(normCargo)
    }

    if (isMatch) {
      sugeridos.push(u)
    } else {
      otros.push(u)
    }
  })

  return { sugeridos, otros }
}

const onOperadorCambiado = (srv) => {
  if (Array.isArray(srv.turnos_operadores) && srv.turnos_operadores[0]) {
    srv.operador_asignado_id = srv.turnos_operadores[0].operador_id
    if (srv.primario) srv.primario.operador_asignado_id = srv.operador_asignado_id
  }
  emit('dirty')
}

const getOperadorPrincipalId = (srv) => {
  return srv?.operador_asignado_id || srv?.primario?.operador_asignado_id || ''
}

const onOperadorDirectoChange = (srv, val) => {
  srv.operador_asignado_id = val
  if (srv.primario) srv.primario.operador_asignado_id = val
  emit('dirty')
}

const onRamaCambiado = (srv, rama) => {
  emit('dirty')
}

// Métodos de Adición Operativa Libre (SPEC-131 Rev 6: Equipos y Personal Autónomos)
const agregarEquipoAutonomo = () => {
  const idNuevo = Date.now()
  const nuevoSrv = {
    _uid: 'srv_op_eq_' + idNuevo,
    id_servicio: 'srv_op_eq_' + idNuevo,
    linea_servicio: 'IZAJE',
    tipo: 'GRUAS TELESCOPICAS',
    subcategoria: 'Flota General',
    descripcion: 'Grúa / Equipo Operativo Adicional',
    nombre_servicio: 'Grúa / Equipo Operativo Adicional',
    is_agregado_operaciones: true,
    colapsado: false,
    equipo_asignado_id: '',
    operador_asignado_id: '',
    rigger_asignado_id: '',
    fecha_plan_ini: props.defaultFechaIni || '',
    fecha_plan_fin: props.defaultFechaFin || '',
    primario: {
      id_linea: 'lin_op_eq_' + idNuevo,
      tipo: 'GRUAS TELESCOPICAS',
      subcategoria: 'Flota General',
      recurso: 'Equipo Adicional',
      descripcion: 'Grúa / Equipo Operativo Adicional',
      unidad: 'Horas Diarias Minimas',
      dias: 1,
      horas_min: 8
    },
    turnos_operadores: [{
      operador_id: '',
      fecha_ini: props.defaultFechaIni || '',
      fecha_fin: props.defaultFechaFin || ''
    }],
    ramas: []
  }
  props.servicios.push(nuevoSrv)
  emit('dirty')
}

const agregarPersonalAutonomo = () => {
  const idNuevo = Date.now()
  const nuevoSrv = {
    _uid: 'srv_op_per_' + idNuevo,
    id_servicio: 'srv_op_per_' + idNuevo,
    linea_servicio: 'PROFESIONAL',
    tipo: 'PERSONAL CERTIFICADO',
    subcategoria: 'RIGGER',
    descripcion: 'Dotación Profesional Adicional en Faena',
    nombre_servicio: 'Personal Profesional Adicional',
    is_agregado_operaciones: true,
    colapsado: false,
    operador_asignado_id: '',
    fecha_plan_ini: props.defaultFechaIni || '',
    fecha_plan_fin: props.defaultFechaFin || '',
    primario: {
      id_linea: 'lin_op_per_' + idNuevo,
      tipo: 'PERSONAL CERTIFICADO',
      subcategoria: 'RIGGER',
      recurso: 'Rigger',
      descripcion: 'Personal Profesional Adicional',
      unidad: 'Horas Diarias Minimas',
      dias: 1,
      horas_min: 8
    },
    turnos_operadores: [{
      operador_id: '',
      fecha_ini: props.defaultFechaIni || '',
      fecha_fin: props.defaultFechaFin || ''
    }],
    ramas: []
  }
  props.servicios.push(nuevoSrv)
  emit('dirty')
}

const eliminarServicioOperativo = (idx) => {
  const srvEliminado = props.servicios[idx]
  props.servicios.splice(idx, 1)

  // Sincronizar purgado bidireccional con props.lines (REQ-1180 / SPEC-131 §2.3)
  if (srvEliminado && Array.isArray(props.lines)) {
    const idsAEliminar = new Set()
    if (srvEliminado.id_linea) idsAEliminar.add(String(srvEliminado.id_linea))
    if (srvEliminado.id_linea_servicio) idsAEliminar.add(String(srvEliminado.id_linea_servicio))
    if (srvEliminado.linea_id) idsAEliminar.add(String(srvEliminado.linea_id))
    if (Array.isArray(srvEliminado.ramas)) {
      srvEliminado.ramas.forEach(r => {
        if (r.id_linea) idsAEliminar.add(String(r.id_linea))
        if (r.id_linea_servicio) idsAEliminar.add(String(r.id_linea_servicio))
        if (r.linea_id) idsAEliminar.add(String(r.linea_id))
      })
    }
    const lineasRestantes = props.lines.filter(l => {
      const idLin = String(l.id_linea || l.id_linea_servicio || l.linea_id || '')
      return !idsAEliminar.has(idLin)
    })
    emit('update:lines', lineasRestantes)
  }
  emit('dirty')
}

const agregarRamaTraslado = (srv) => {
  if (!Array.isArray(srv.ramas)) srv.ramas = []
  srv.ramas.push({
    id_rama: 'rama_tr_' + Date.now(),
    id_linea: 'lin_tr_' + Date.now(),
    rol: 'Traslado',
    tipo_rama: 'TRASLADO',
    descripcion: 'Traslado Auxiliar / Cama Baja / Contrapesos',
    recurso: 'Transporte / Cama Baja',
    subcategoria: 'SEMIRREMOLQUE',
    unidad: 'Traslado Ida/Vuelta',
    cantidad: 1,
    modalidad_traslado: 'IDA_VUELTA',
    equipo_asignado_id: '',
    chofer_id: '',
    fecha_plan_ini: srv.fecha_plan_ini || props.defaultFechaIni || '',
    fecha_plan_fin: srv.fecha_plan_fin || props.defaultFechaFin || '',
    is_agregado_operaciones: true
  })
  emit('dirty')
}

const agregarRamaApoyo = (srv) => {
  if (!Array.isArray(srv.ramas)) srv.ramas = []
  srv.ramas.push({
    id_rama: 'rama_ap_' + Date.now(),
    id_linea: 'lin_ap_' + Date.now(),
    rol: 'Apoyo',
    tipo_rama: 'APOYO',
    descripcion: 'Vehículo de Apoyo / Camioneta Escolta Piloto',
    recurso: 'Camioneta Escolta',
    subcategoria: 'CAMIONETA',
    unidad: 'Día',
    cantidad: 1,
    equipo_asignado_id: '',
    chofer_id: '',
    fecha_plan_ini: srv.fecha_plan_ini || props.defaultFechaIni || '',
    fecha_plan_fin: srv.fecha_plan_fin || props.defaultFechaFin || '',
    is_agregado_operaciones: true
  })
  emit('dirty')
}

const agregarRamaPersonal = (srv, cargo = 'RIGGER CERTIFICADO') => {
  if (!Array.isArray(srv.ramas)) srv.ramas = []
  srv.ramas.push({
    id_rama: 'rama_per_' + Date.now(),
    id_linea: 'lin_per_' + Date.now(),
    rol: 'Personal',
    tipo_rama: 'PERSONAL',
    descripcion: `Servicio de ${cargo} en terreno`,
    recurso: cargo,
    subcategoria: cargo,
    cargo: cargo,
    unidad: 'Horas Diarias Minimas',
    cantidad: 1,
    id_user: '',
    fecha_plan_ini: srv.fecha_plan_ini || props.defaultFechaIni || '',
    fecha_plan_fin: srv.fecha_plan_fin || props.defaultFechaFin || '',
    is_agregado_operaciones: true
  })
  emit('dirty')
}

const eliminarRamaOperativa = (srv, rIdx) => {
  const ramaEliminada = srv.ramas?.[rIdx]
  srv.ramas.splice(rIdx, 1)
  if (ramaEliminada && Array.isArray(props.lines)) {
    const idRamaLin = String(ramaEliminada.id_linea || ramaEliminada.id_linea_servicio || ramaEliminada.linea_id || '')
    if (idRamaLin) {
      const lineasRestantes = props.lines.filter(l => String(l.id_linea || l.id_linea_servicio || l.linea_id || '') !== idRamaLin)
      emit('update:lines', lineasRestantes)
    }
  }
  emit('dirty')
}

// Semáforos de Acreditación Sobrios (Paleta de Producción)
const getSemaforoClaseSobria = (semaforo) => {
  if (semaforo === 'GREEN') return 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/40'
  if (semaforo === 'YELLOW') return 'bg-amber-950/40 text-amber-300 border-amber-700/60 hover:bg-amber-900/40'
  return 'bg-rose-950/40 text-rose-300 border-rose-700/60 hover:bg-rose-900/40'
}

const getSemaforoTexto = (semaforo) => {
  if (semaforo === 'GREEN') return '🟢 VIG'
  if (semaforo === 'YELLOW') return '🟡 VNC'
  return '🔴 VNC'
}

// Emits hacia el Drawer de Acreditaciones
const abrirAcreditacionEquipo = (idEquipo) => {
  emit('abrir-acreditacion-equipo', idEquipo)
}

const abrirAcreditacionPersona = (idUser, cargo) => {
  emit('abrir-acreditacion-persona', { id_user: idUser, cargo })
}

const abrirModalRiggerExt = (srv) => {
  emit('abrir-modal-rigger-ext', srv)
}

// =========================================================================
// POPOVER FLOTANTE CONTEXTUAL: + AGREGAR ÍTEM... (IDÉNTICO A PREVENTA)
// =========================================================================
const addMenuVisible = ref(false)
const addMenuStyle = ref({})
const addMenuPopoverRef = ref(null)
const activeAddMenuSrvIdx = ref(null)

const abrirAddMenuPopover = (ev, srvIdx) => {
  ev.stopPropagation()
  cerrarTodosPopovers()
  activeAddMenuSrvIdx.value = srvIdx

  const rect = ev.currentTarget.getBoundingClientRect()
  const popHeight = 140

  let topPos = rect.bottom + 4
  if (topPos + popHeight > window.innerHeight && rect.top - popHeight - 4 > 0) {
    topPos = rect.top - popHeight - 4
  }
  const leftPos = Math.min(window.innerWidth - 270, Math.max(12, rect.left))

  addMenuStyle.value = {
    top: `${topPos}px`,
    left: `${leftPos}px`
  }
  addMenuVisible.value = true
}

const cerrarTodosPopovers = () => {
  addMenuVisible.value = false
  activeAddMenuSrvIdx.value = null
}

const ejecutarAgregarRama = (tipo) => {
  if (activeAddMenuSrvIdx.value === null) return
  const srv = serviciosLista.value[activeAddMenuSrvIdx.value]
  cerrarTodosPopovers()
  if (!srv) return

  if (tipo === 'TRASLADO') agregarRamaTraslado(srv)
  else if (tipo === 'APOYO') agregarRamaApoyo(srv)
  else if (tipo === 'RIGGER') agregarRamaPersonal(srv, 'RIGGER CERTIFICADO')
  else if (tipo === 'APR') agregarRamaPersonal(srv, 'PREVENCIONISTA (APR)')
  else if (tipo === 'SUPERVISOR') agregarRamaPersonal(srv, 'SUPERVISOR DE IZAJE')
  else if (tipo === 'PERSONAL') agregarRamaPersonal(srv, 'ESPECIALISTA GENERAL')
}

const onDocumentClick = (e) => {
  const addPop = addMenuPopoverRef.value
  const isAddBtn = e.target.closest && e.target.closest('.tree-add-branch-btn')
  if ((!addPop || !addPop.contains(e.target)) && !isAddBtn) {
    cerrarTodosPopovers()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<style scoped>
.surface-card {
  background: #0d1320;
  border: 1px solid #1f2937;
}

.tree-table {
  background: #0a0f1d;
}

.tree-table thead tr th {
  background: #0d1320;
}

.field-input {
  background: #111827;
  border: 1px solid #334155;
  color: #f1f5f9;
  border-radius: 6px;
  transition: all 0.15s ease;
}
.field-input:focus {
  border-color: #64748b;
  outline: none;
}

.tree-toggle-box {
  width: 16px;
  height: 16px;
  border: 1px solid #334155;
  background: #0d1320;
  color: #94a3b8;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  line-height: 1;
}

/* Conector continuo del nodo padre */
.tree-parent-cell {
  position: relative;
}
.tree-parent-cell.has-children::before {
  content: "";
  position: absolute;
  left: 24px;
  top: 25px;
  bottom: 0;
  width: 1px;
  background: #475569;
  pointer-events: none;
}

/* Conector continuo de ramas hijas ├── */
.tree-branch-cell {
  position: relative;
  padding-left: 38px !important;
}
.tree-branch-cell::before {
  content: "";
  position: absolute;
  left: 24px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #475569;
  pointer-events: none;
}
.tree-branch-cell.is-last::before {
  bottom: 50%;
}
.tree-branch-cell::after {
  content: "";
  position: absolute;
  left: 24px;
  top: 50%;
  width: 12px;
  height: 1px;
  background: #475569;
  pointer-events: none;
}

.combo-popover {
  background: #111827;
  border: 1px solid #334155;
  box-shadow: 0 14px 30px -5px rgba(0, 0, 0, 0.55);
  border-radius: 8px;
}
</style>