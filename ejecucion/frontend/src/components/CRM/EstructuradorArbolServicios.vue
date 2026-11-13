<template>
  <div class="space-y-4">
    <!-- BARRA SUPERIOR: CATÁLOGO DE LAS 4 LÍNEAS DE SERVICIO COMERCIAL -->
    <div class="surface-card rounded-lg p-4">
      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-5 rounded-sm inline-block bg-amber-500"></span>
            <h1 class="text-sm font-semibold text-slate-100">Estructura Comercial de Servicios</h1>
            <span class="text-xs px-2 py-0.5 rounded font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
              Arquitectura de Árbol
            </span>
          </div>
          <p class="text-xs mt-1 text-slate-400">
            Cotización comercial simple: equipo o cargo principal, traslado global y personal cuando aplique. Equipos de apoyo y accesorios internos los asigna Operaciones.
          </p>
        </div>

        <!-- 4 BOTONES DE LÍNEA DE NEGOCIO -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- 1. IZAJE -->
          <button
            type="button"
            @click="agregarServicio('IZAJE')"
            :disabled="disabled"
            class="field-input px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Añadir Servicio de Grúa, Horquilla o Manipulador con Operador"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-amber-500"><path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M4 21h16"/><path d="M7 18h10"/></svg>
            <span>+ Izaje</span>
          </button>

          <!-- 2. RENTAL -->
          <button
            type="button"
            @click="agregarServicio('RENTAL')"
            :disabled="disabled"
            class="field-input px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Añadir Arriendo de Plataformas en Faena sin Operador"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-slate-300"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>
            <span>+ Rental</span>
          </button>

          <!-- 3. TRANSPORTE -->
          <button
            type="button"
            @click="agregarServicio('TRANSPORTE')"
            :disabled="disabled"
            class="field-input px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Añadir Transporte de Carga en Cama Baja o Rampla"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-slate-300"><rect x="1" y="5" width="15" height="12" rx="1"/><polygon points="16 8 20 8 23 11 23 17 16 17 16 8"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg>
            <span>+ Transporte</span>
          </button>

          <!-- 4. PROFESIONAL -->
          <button
            type="button"
            @click="agregarServicio('PROFESIONAL')"
            :disabled="disabled"
            class="field-input px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Añadir Dotación Profesional (Rigger, Operador o Conductor)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-slate-300"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>+ Profesional</span>
          </button>
        </div>
      </div>

      <!-- RESUMEN COMPACTO -->
      <div v-if="localServicios.length > 0" class="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div class="flex items-center gap-3">
          <span>Servicios: <strong class="text-slate-200">{{ localServicios.length }}</strong></span>
          <span>Ítems Sincronizados: <strong class="text-slate-200">{{ totalItemsPlanos }}</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <span>Total Neto Cotizado:</span>
          <span class="text-slate-100 font-mono font-bold text-sm">{{ formatMoneda(totalNetoServicios) }}</span>
        </div>
      </div>
    </div>

    <!-- ESTADO VACÍO -->
    <div
      v-if="localServicios.length === 0"
      class="surface-card rounded-lg p-10 text-center space-y-2.5"
    >
      <div class="mx-auto w-9 h-9 rounded-md flex items-center justify-center bg-slate-800 text-slate-400">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
      </div>
      <div class="text-sm font-semibold text-slate-200">Sin servicios agregados a la cotización</div>
      <p class="text-xs max-w-md mx-auto text-slate-400">
        Seleccione una línea de negocio en la barra superior (+ Izaje, + Rental, + Transporte o + Profesional).
      </p>
      <div class="pt-2 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          @click="agregarServicio('IZAJE')"
          :disabled="disabled"
          class="field-input px-3 py-1.5 text-xs font-semibold text-amber-400 border-amber-500/40 hover:bg-slate-800 cursor-pointer disabled:opacity-50"
        >
          + Izaje (Grúa, Horquilla, Manipulador)
        </button>
        <button
          type="button"
          @click="agregarServicio('RENTAL')"
          :disabled="disabled"
          class="field-input px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer disabled:opacity-50"
        >
          + Rental (Plataformas Tijera / Brazos)
        </button>
      </div>
    </div>

    <!-- CONTENEDOR DE ÁRBOLES -->
    <div v-else class="space-y-3.5">
      <section
        v-for="(srv, srvIdx) in localServicios"
        :key="srv.id_servicio || srvIdx"
        class="surface-card rounded-lg"
      >
        <!-- CABECERA DEL SERVICIO -->
        <div class="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[#161f30] border-b border-[#1f2937] rounded-t-lg">
          <div class="flex items-center gap-2.5 flex-1 min-w-[260px]">
            <!-- Botón Colapsar / Expandir -->
            <button
              type="button"
              @click="toggleColapso(srvIdx)"
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
              {{ LINEA_LABELS[srv.linea_servicio] || srv.linea_servicio }}
            </span>

            <!-- Título Descriptivo del Servicio -->
            <input
              type="text"
              v-model="srv.nombre_servicio"
              @input="onFieldChange"
              :disabled="disabled"
              placeholder="Título descriptivo del servicio..."
              class="bg-transparent border-0 border-b border-transparent focus:border-slate-400 outline-none text-xs sm:text-sm font-semibold flex-1 min-w-[180px] px-1 py-0.5 text-slate-100 placeholder-slate-500"
              maxlength="200"
            />
          </div>

          <!-- Badge si el servicio completo fue agregado en Operaciones -->
          <span v-if="esServicioAgregado(srv)" class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            + Agregado en Operaciones
          </span>

          <div class="flex items-center gap-3">
            <!-- Subtotal del Servicio (Oculto en Operaciones) -->
            <div v-if="!ocultarPrecios" class="text-right">
              <span class="text-xs mr-1.5 text-slate-400">Subtotal:</span>
              <span class="tabular font-mono text-sm font-bold text-slate-100">
                {{ formatMoneda(srv.subtotal_servicio) }}
              </span>
            </div>

            <!-- Acciones: Subir / Bajar / Eliminar -->
            <div class="flex items-center gap-0.5">
              <button
                type="button"
                @click="moverServicio(srvIdx, -1)"
                :disabled="disabled || srvIdx === 0"
                class="p-1 rounded cursor-pointer text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Subir"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m18 15-6-6-6 6"/></svg>
              </button>
              <button
                type="button"
                @click="moverServicio(srvIdx, 1)"
                :disabled="disabled || srvIdx === localServicios.length - 1"
                class="p-1 rounded cursor-pointer text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Bajar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <button
                type="button"
                @click="eliminarServicio(srvIdx)"
                :disabled="disabled"
                class="p-1 rounded cursor-pointer text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                title="Eliminar servicio completo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- TABLA EN ÁRBOL ESTILO EXPLORADOR -->
        <div v-show="!srv.colapsado" class="overflow-x-auto pb-1">
          <table class="tree-table w-full text-left border-collapse">
            <thead>
              <tr class="text-xs font-medium text-slate-400 border-b border-[#1f2937]">
                <th class="py-2.5 px-4 w-[26%]">
                  {{ srv.linea_servicio === 'PROFESIONAL' ? 'Cargo' : 'Equipo / Ítem' }}
                </th>
                <th class="py-2.5 px-2.5 w-[26%]">Glosa Comercial</th>
                <th class="py-2.5 px-2.5 w-[17%]">Unidad de Cobro</th>
                <th class="py-2.5 px-2.5 w-[13%]">Magnitud</th>
                <th v-if="!ocultarPrecios" class="py-2.5 px-2.5 w-[10%] text-right">Tarifa Neto</th>
                <th v-if="!ocultarPrecios" class="py-2.5 pl-2.5 pr-4 w-[8%] text-right">Subtotal</th>
                <th v-if="ocultarPrecios" class="py-2.5 pl-2.5 pr-4 w-[5%] text-right"></th>
              </tr>
            </thead>
            <tbody>
              <!-- NODO RAÍZ PRINCIPAL (ESTILO EXPLORADOR CON [-]/[+]) -->
              <tr class="hover:bg-white/[0.02] transition-colors">
                <td
                  class="py-2 px-4 tree-parent-cell"
                  :class="{ 'has-children': !srv.colapsado }"
                >
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="tree-toggle-box"
                      @click="toggleColapso(srvIdx)"
                      :title="srv.colapsado ? 'Expandir ramas' : 'Contraer ramas'"
                    >
                      {{ srv.colapsado ? '+' : '−' }}
                    </button>
                    <div class="flex-1 min-w-0">
                      <!-- Si PROFESIONAL: select directo de cargos por ID relacional -->
                      <select
                        v-if="srv.linea_servicio === 'PROFESIONAL'"
                        v-model="srv.primario.id_subcategoria"
                        @change="onCargoPrimarioSubcatChange(srv)"
                        :disabled="disabled"
                        class="field-input w-full px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                      >
                        <option
                          v-for="cargo in listaPersonalOpciones"
                          :key="cargo.id_subcategoria"
                          :value="cargo.id_subcategoria"
                        >
                          {{ cargo.nombre_subcategoria }}
                        </option>
                      </select>

                      <!-- Si IZAJE, RENTAL, TRANSPORTE: selector emergente con popover -->
                      <button
                        v-else
                        type="button"
                        @click="abrirEquipoPrimarioPopover($event, srvIdx)"
                        :disabled="disabled"
                        class="field-input w-full px-2.5 py-1.5 text-left flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <span class="font-semibold text-xs truncate">
                          {{ srv.primario.recurso || 'Seleccionar equipo...' }}
                        </span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-slate-400 flex-shrink-0"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                    </div>
                  </div>
                </td>

                <!-- Glosa Comercial Primario -->
                <td class="py-2 px-2.5">
                  <input
                    type="text"
                    v-model="srv.primario.descripcion"
                    @input="onFieldChange"
                    :disabled="disabled"
                    placeholder="Glosa comercial..."
                    class="field-input w-full px-2.5 py-1.5"
                    maxlength="250"
                  />
                </td>

                <!-- Unidad de Cobro Primario (10 Unidades Canónicas Limpias) -->
                <td class="py-2 px-2.5">
                  <select
                    v-model="srv.primario.unidad"
                    @change="onUnidadChange(srv.primario)"
                    :disabled="disabled"
                    class="field-input w-full px-2 py-1.5 text-xs cursor-pointer"
                  >
                    <option
                      v-for="u in getUnidadesDisponibles(srv, null)"
                      :key="u"
                      :value="u"
                    >
                      {{ u }}
                    </option>
                  </select>
                </td>

                <!-- Magnitud Primario -->
                <td class="py-2 px-2.5">
                  <!-- Cobro Único: Badge limpio fijo -->
                  <div
                    v-if="UNIDADES_COBRO_UNICO.has(srv.primario.unidad)"
                    class="px-2.5 py-1.5 rounded text-xs text-center font-medium select-none bg-slate-900 text-slate-400 border border-slate-800"
                  >
                    Cobro único (1)
                  </div>

                  <!-- Horas Diarias Mínimas: [días] d × [hrs_mín] h -->
                  <div
                    v-else-if="srv.primario.unidad === 'Horas Diarias Minimas'"
                    class="flex items-center gap-1"
                  >
                    <div class="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        v-model.number="srv.primario.dias"
                        @input="onDiasInput(srv.primario)"
                        :disabled="disabled"
                        class="field-input w-full pl-2 pr-6 py-1.5 text-right tabular font-medium"
                        title="Cantidad de días"
                      />
                      <span class="absolute right-1.5 top-1.5 text-xs pointer-events-none text-slate-400">d</span>
                    </div>
                    <span class="text-xs text-slate-400">×</span>
                    <div class="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        max="24"
                        step="0.5"
                        v-model.number="srv.primario.horas_min"
                        @input="onHorasInput(srv.primario)"
                        :disabled="disabled"
                        class="field-input w-full pl-2 pr-6 py-1.5 text-right tabular font-medium"
                        title="Piso de horas mínimas diarias"
                      />
                      <span class="absolute right-1.5 top-1.5 text-xs pointer-events-none text-slate-400">h</span>
                    </div>
                  </div>

                  <!-- Horas Mes Mínimas: [meses] m × [hrs_mín] h -->
                  <div
                    v-else-if="srv.primario.unidad === 'Horas Mes Minimas'"
                    class="flex items-center gap-1"
                  >
                    <div class="relative w-16">
                      <input
                        type="number"
                        min="1"
                        v-model.number="srv.primario.meses"
                        @input="onMesesInput(srv.primario)"
                        :disabled="disabled"
                        class="field-input w-full pl-2 pr-6 py-1.5 text-right tabular font-medium"
                        title="Meses"
                      />
                      <span class="absolute right-1.5 top-1.5 text-xs pointer-events-none text-slate-400">m</span>
                    </div>
                    <span class="text-xs text-slate-400">×</span>
                    <div class="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        v-model.number="srv.primario.horas_min"
                        @input="onHorasInput(srv.primario)"
                        :disabled="disabled"
                        class="field-input w-full pl-2 pr-6 py-1.5 text-right tabular font-medium"
                        title="Horas mínimas mes"
                      />
                      <span class="absolute right-1.5 top-1.5 text-xs pointer-events-none text-slate-400">h</span>
                    </div>
                  </div>

                  <!-- Otras Unidades (Cantidad con sufijo contextual) -->
                  <div v-else class="relative">
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      v-model.number="srv.primario.cantidad"
                      @input="onFieldChange"
                      :disabled="disabled"
                      class="field-input w-full pl-2.5 pr-11 py-1.5 text-right tabular font-medium"
                    />
                    <span class="absolute right-2.5 top-1.5 text-xs pointer-events-none text-slate-400">
                      {{ getSufijoUnidad(srv.primario.unidad) }}
                    </span>
                  </div>
                </td>

                <!-- Tarifa Unitario Primario (Oculto en Operaciones) -->
                <td v-if="!ocultarPrecios" class="py-2 px-2.5">
                  <div class="relative">
                    <span class="absolute left-2 top-1.5 text-xs pointer-events-none text-slate-400">$</span>
                    <input
                      type="text"
                      :value="formatMiles(srv.primario.valor_unitario)"
                      @input="onTarifaInput($event, srv.primario)"
                      :disabled="disabled"
                      placeholder="0"
                      class="field-input w-full pl-5 pr-2 py-1.5 text-right tabular font-mono font-medium"
                    />
                  </div>
                </td>

                <!-- Subtotal Primario (Oculto en Operaciones) -->
                <td v-if="!ocultarPrecios" class="py-2 pl-2.5 pr-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <span class="tabular font-mono text-xs font-semibold text-slate-100">
                      {{ formatMoneda(srv.primario.subtotal) }}
                    </span>
                    <span class="w-5 inline-block"></span>
                  </div>
                </td>
                <td v-else class="py-2 pl-2.5 pr-4 text-right">
                  <span class="w-5 inline-block"></span>
                </td>
              </tr>

              <!-- RAMAS SUBORDINADAS (LÍNEAS CONTINUAS SÓLIDAS) -->
              <tr
                v-for="(rama, rIdx) in srv.ramas"
                :key="rama.id_linea || rIdx"
                class="hover:bg-white/[0.02] transition-colors"
              >
                <!-- Celda con conector de árbol -->
                <td class="py-1.5 pr-4 tree-branch-cell">
                  <!-- Rama Traslado: CERO dropdown, solo etiqueta limpia Traslado -->
                  <div v-if="rama.rol === 'Traslado'" class="flex items-center gap-2 py-1">
                    <span class="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Traslado
                    </span>
                    <span v-if="esRamaAgregada(srv, rama)" class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      + Agregado en Operaciones
                    </span>
                  </div>

                  <!-- Rama Personal: Badge Personal + Selector de Cargos por ID relacional -->
                  <div v-else class="flex items-center gap-2">
                    <span class="text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 bg-slate-800 text-slate-400 border border-slate-700">
                      Personal
                    </span>
                    <span v-if="esRamaAgregada(srv, rama)" class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      + Agregado
                    </span>
                    <select
                      v-model="rama.id_subcategoria"
                      @change="onCargoRamaSubcatChange(rama)"
                      :disabled="disabled"
                      class="field-input flex-1 min-w-0 px-2.5 py-1.5 text-xs font-medium cursor-pointer"
                    >
                      <option
                        v-for="cargo in listaPersonalOpciones"
                        :key="cargo.id_subcategoria"
                        :value="cargo.id_subcategoria"
                      >
                        {{ cargo.nombre_subcategoria }}
                      </option>
                    </select>
                  </div>
                </td>

                <!-- Glosa Comercial Rama -->
                <td class="py-1.5 px-2.5">
                  <input
                    type="text"
                    v-model="rama.descripcion"
                    @input="onFieldChange"
                    :disabled="disabled"
                    placeholder="Glosa comercial..."
                    class="field-input w-full px-2.5 py-1.5"
                    maxlength="250"
                  />
                </td>

                <!-- Unidad de Cobro Rama -->
                <td class="py-1.5 px-2.5">
                  <select
                    v-model="rama.unidad"
                    @change="onUnidadChange(rama)"
                    :disabled="disabled"
                    class="field-input w-full px-2 py-1.5 text-xs cursor-pointer"
                  >
                    <option
                      v-for="u in getUnidadesDisponibles(srv, rama)"
                      :key="u"
                      :value="u"
                    >
                      {{ u }}
                    </option>
                  </select>
                </td>

                <!-- Magnitud Rama -->
                <td class="py-1.5 px-2.5">
                  <!-- Cobro Único -->
                  <div
                    v-if="UNIDADES_COBRO_UNICO.has(rama.unidad)"
                    class="px-2.5 py-1.5 rounded text-xs text-center font-medium select-none bg-slate-900 text-slate-400 border border-slate-800"
                  >
                    Cobro único (1)
                  </div>

                  <!-- Horas Diarias Mínimas -->
                  <div
                    v-else-if="rama.unidad === 'Horas Diarias Minimas'"
                    class="flex items-center gap-1"
                  >
                    <div class="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        v-model.number="rama.dias"
                        @input="onDiasInput(rama)"
                        :disabled="disabled"
                        class="field-input w-full pl-2 pr-6 py-1.5 text-right tabular font-medium"
                        title="Cantidad de días"
                      />
                      <span class="absolute right-1.5 top-1.5 text-xs pointer-events-none text-slate-400">d</span>
                    </div>
                    <span class="text-xs text-slate-400">×</span>
                    <div class="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        max="24"
                        step="0.5"
                        v-model.number="rama.horas_min"
                        @input="onHorasInput(rama)"
                        :disabled="disabled"
                        class="field-input w-full pl-2 pr-6 py-1.5 text-right tabular font-medium"
                        title="Piso de horas mínimas diarias"
                      />
                      <span class="absolute right-1.5 top-1.5 text-xs pointer-events-none text-slate-400">h</span>
                    </div>
                  </div>

                  <!-- Horas Mes Mínimas -->
                  <div
                    v-else-if="rama.unidad === 'Horas Mes Minimas'"
                    class="flex items-center gap-1"
                  >
                    <div class="relative w-16">
                      <input
                        type="number"
                        min="1"
                        v-model.number="rama.meses"
                        @input="onMesesInput(rama)"
                        :disabled="disabled"
                        class="field-input w-full pl-2 pr-6 py-1.5 text-right tabular font-medium"
                        title="Meses"
                      />
                      <span class="absolute right-1.5 top-1.5 text-xs pointer-events-none text-slate-400">m</span>
                    </div>
                    <span class="text-xs text-slate-400">×</span>
                    <div class="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        v-model.number="rama.horas_min"
                        @input="onHorasInput(rama)"
                        :disabled="disabled"
                        class="field-input w-full pl-2 pr-6 py-1.5 text-right tabular font-medium"
                        title="Horas mínimas mes"
                      />
                      <span class="absolute right-1.5 top-1.5 text-xs pointer-events-none text-slate-400">h</span>
                    </div>
                  </div>

                  <!-- Otras Unidades -->
                  <div v-else class="relative">
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      v-model.number="rama.cantidad"
                      @input="onFieldChange"
                      :disabled="disabled"
                      class="field-input w-full pl-2.5 pr-11 py-1.5 text-right tabular font-medium"
                    />
                    <span class="absolute right-2.5 top-1.5 text-xs pointer-events-none text-slate-400">
                      {{ getSufijoUnidad(rama.unidad) }}
                    </span>
                  </div>
                </td>

                <!-- Tarifa Neto Rama (Oculto en Operaciones) -->
                <td v-if="!ocultarPrecios" class="py-1.5 px-2.5">
                  <div class="relative">
                    <span class="absolute left-2 top-1.5 text-xs pointer-events-none text-slate-400">$</span>
                    <input
                      type="text"
                      :value="formatMiles(rama.valor_unitario)"
                      @input="onTarifaInput($event, rama)"
                      :disabled="disabled"
                      placeholder="0"
                      class="field-input w-full pl-5 pr-2 py-1.5 text-right tabular font-mono font-medium"
                    />
                  </div>
                </td>

                <!-- Subtotal Rama + Botón Eliminar Rama -->
                <td v-if="!ocultarPrecios" class="py-1.5 pl-2.5 pr-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <span class="tabular font-mono text-xs font-medium text-slate-300">
                      {{ formatMoneda(rama.subtotal) }}
                    </span>
                    <button
                      type="button"
                      @click="eliminarRama(srv, rIdx)"
                      :disabled="disabled"
                      class="w-5 h-5 rounded flex items-center justify-center cursor-pointer text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                      title="Quitar ítem"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                </td>
                <td v-else class="py-1.5 pl-2.5 pr-4 text-right">
                  <button
                    type="button"
                    @click="eliminarRama(srv, rIdx)"
                    :disabled="disabled"
                    class="w-5 h-5 rounded inline-flex items-center justify-center cursor-pointer text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                    title="Quitar ítem"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </td>
              </tr>

              <!-- FILA DE AGREGAR ÍTEM AL FINAL DEL ÁRBOL (TERMINA EN CODO └── [+]) -->
              <tr class="hover:bg-white/[0.01] transition-colors">
                <td :colspan="ocultarPrecios ? 5 : 6" class="py-2 pr-4 tree-branch-cell is-last">
                  <button
                    type="button"
                    @click="abrirAddMenuPopover($event, srvIdx)"
                    :disabled="disabled"
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
      </section>
    </div>

    <!-- POPOVER FLOTANTE A NIVEL RAÍZ PARA AGREGAR ÍTEM (FIXED Z-[100] CON GETBOUNDINGCLIENTRECT) -->
    <div
      v-if="addMenuVisible"
      ref="addMenuPopoverRef"
      :style="addMenuStyle"
      class="combo-popover fixed z-[100] w-64 p-1.5 shadow-2xl border border-slate-700 rounded-lg bg-[#111827]"
    >
      <div class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b border-white/10 mb-1 text-slate-400">
        Seleccionar ítem para agregar:
      </div>
      <div class="space-y-0.5">
        <button
          v-for="b in getAddMenuItems(currentAddMenuSrv)"
          :key="b.key"
          type="button"
          @click="ejecutarAgregarRama(b.key)"
          class="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-slate-800/90 flex items-center gap-2 cursor-pointer transition-colors text-slate-200 hover:text-white"
        >
          <span class="w-4 h-4 rounded-sm flex items-center justify-center font-bold text-xs bg-amber-500/20 text-amber-300 font-mono leading-none">+</span>
          <span class="font-medium">{{ b.label }}</span>
        </button>
      </div>
    </div>

    <!-- POPOVER BUSCABLE FLOTANTE A NIVEL RAÍZ PARA SELECCIÓN DE EQUIPOS (FIXED Z-[90]) -->
    <div
      v-if="resourcePopoverVisible"
      ref="resourcePopoverRef"
      :style="resourcePopoverStyle"
      class="combo-popover fixed z-[90] w-80 p-2 shadow-2xl border border-slate-700 rounded-lg bg-[#111827]"
    >
      <div class="relative mb-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="absolute left-2.5 top-2 text-slate-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          ref="resourceSearchInputRef"
          type="text"
          v-model="resourceSearchQuery"
          placeholder="Filtrar equipo..."
          class="field-input w-full pl-8 pr-2.5 py-1.5 text-xs"
        />
      </div>
      <div class="max-h-60 overflow-y-auto space-y-0.5">
        <div
          v-for="grupo in filteredEquiposGrupos"
          :key="grupo.grupo"
          class="space-y-0.5"
        >
          <div class="px-2 pt-1.5 pb-0.5 text-xs font-semibold text-slate-400">
            {{ grupo.grupo }}
          </div>
          <button
            v-for="it in grupo.items"
            :key="it.id_subcategoria"
            type="button"
            @click="seleccionarEquipoPrimario(it)"
            class="w-full text-left px-2.5 py-1.5 rounded text-xs cursor-pointer flex items-center justify-between transition-colors"
            :class="isEquipoSeleccionado(it) ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'"
          >
            <span>{{ it.nombre_subcategoria }}</span>
            <span v-if="isEquipoSeleccionado(it)" class="font-bold text-amber-400">✓</span>
          </button>
        </div>
        <div
          v-if="filteredEquiposGrupos.length === 0"
          class="px-2.5 py-3 text-xs text-center text-slate-500"
        >
          Sin coincidencias
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  lines: {
    type: Array,
    default: () => []
  },
  servicios: {
    type: Array,
    default: () => []
  },
  dbCategories: {
    type: Array,
    default: () => []
  },
  dbSubcategories: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  formatCurrency: {
    type: Function,
    default: null
  },
  formatInputMiles: {
    type: Function,
    default: null
  },
  ocultarPrecios: {
    type: Boolean,
    default: false
  },
  snapshotServicios: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:lines', 'update:servicios'])

// =========================================================================
// 1. CATÁLOGOS Y CLASIFICACIÓN RELACIONAL DESDE BASE DE DATOS (SPEC-130)
// =========================================================================

// ESTRICTAMENTE LAS 10 UNIDADES CANÓNICAS LIMPIAS (SIN SINÓNIMOS)
const UNIDADES_COBRO_UNICO = new Set([
  'Valor Fijo',
  'Traslado Ida',
  'Traslado Vuelta',
  'Traslado Ida/Vuelta'
])

const UNIDADES_POR_CONTEXTO = {
  IZAJE_PRIMARIO: [
    'Horas Diarias Minimas',
    'Valor Fijo',
    'Valor Fijo Diario',
    'Valor Fijo Semanal',
    'Horas Mes Minimas',
    'Valor Fijo Mensual',
    'Hora Efectiva'
  ],
  RENTAL_PRIMARIO: [
    'Valor Fijo Mensual',
    'Horas Mes Minimas',
    'Valor Fijo Semanal',
    'Valor Fijo Diario'
  ],
  TRANSPORTE_PRIMARIO: [
    'Traslado Ida/Vuelta',
    'Traslado Ida',
    'Traslado Vuelta',
    'Valor Fijo',
    'Valor Fijo Diario',
    'Horas Diarias Minimas'
  ],
  PROFESIONAL_PRIMARIO: [
    'Valor Fijo',
    'Valor Fijo Diario',
    'Horas Diarias Minimas',
    'Hora Efectiva',
    'Valor Fijo Semanal',
    'Valor Fijo Mensual'
  ],
  RAMA_TRASLADO: [
    'Traslado Ida/Vuelta',
    'Traslado Ida',
    'Traslado Vuelta',
    'Valor Fijo'
  ],
  RAMA_PERSONAL: [
    'Valor Fijo',
    'Valor Fijo Diario',
    'Horas Diarias Minimas',
    'Hora Efectiva',
    'Valor Fijo Semanal',
    'Valor Fijo Mensual'
  ]
}

const LINEA_LABELS = {
  IZAJE: 'Izaje',
  RENTAL: 'Rental',
  TRANSPORTE: 'Transporte',
  PROFESIONAL: 'Profesional'
}

// Opciones de Personal Certificado (Cat 151) derivadas directamente de BD
const listaPersonalOpciones = computed(() => {
  const cats = Array.isArray(props.dbCategories) ? props.dbCategories : []
  const cat = cats.find(c => Number(c.id_categoria) === 151)
  if (cat && Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
    return cat.subcategories.map(s => ({
      id_categoria: 151,
      nombre_categoria: cat.nombre_categoria || 'PERSONAL CERTIFICADO',
      id_subcategoria: Number(s.id_subcategoria),
      nombre_subcategoria: s.nombre_subcategoria
    }))
  }
  // Fallback determinista canónico de BD (sch_leangsp.tequ_subcategoria)
  return [
    { id_categoria: 151, nombre_categoria: 'PERSONAL CERTIFICADO', id_subcategoria: 160, nombre_subcategoria: 'RIGGER' },
    { id_categoria: 151, nombre_categoria: 'PERSONAL CERTIFICADO', id_subcategoria: 161, nombre_subcategoria: 'OPERADOR' },
    { id_categoria: 151, nombre_categoria: 'PERSONAL CERTIFICADO', id_subcategoria: 162, nombre_subcategoria: 'PREVENCIONISTA' },
    { id_categoria: 151, nombre_categoria: 'PERSONAL CERTIFICADO', id_subcategoria: 163, nombre_subcategoria: 'OTROS' }
  ]
})

// Catálogo Relacional Dinámico 100% derivado de props.dbCategories y BD real (SPEC-130)
const catalogoEquiposPorLinea = computed(() => {
  const cats = Array.isArray(props.dbCategories) ? props.dbCategories : []
  const getCat = (id) => cats.find(c => Number(c.id_categoria) === Number(id))

  // 1. RENTAL: id_categoria = 102 ('PLATAFORMAS') -> subcats reales (111, 126, 130, 131, 134, 150)
  const catRental = getCat(102)
  const rentalItems = (catRental?.subcategories || []).map(s => ({
    id_categoria: 102,
    nombre_categoria: catRental.nombre_categoria || 'PLATAFORMAS',
    id_subcategoria: Number(s.id_subcategoria),
    nombre_subcategoria: s.nombre_subcategoria
  }))

  // 2. IZAJE:
  // - id_categoria = 40 ('GRUAS TELESCOPICAS') -> subcats 49 a 70
  // - id_categoria = 62 ('CAMIONES') filtrado a pluma id 71 ('CAMION PLUMA')
  // - id_categoria = 65 ('GRUA HORQUILLA') -> id 74
  // - id_categoria = 70 ('MANIPULADOR TELESCOPICO') -> id 79
  const catGruas = getCat(40)
  const catCamiones = getCat(62)
  const catHorquilla = getCat(65)
  const catManipulador = getCat(70)

  const izajeGrupos = []
  if (catGruas && Array.isArray(catGruas.subcategories) && catGruas.subcategories.length > 0) {
    izajeGrupos.push({
      grupo: catGruas.nombre_categoria || 'Grúas Telescópicas',
      items: catGruas.subcategories.map(s => ({
        id_categoria: 40,
        nombre_categoria: catGruas.nombre_categoria,
        id_subcategoria: Number(s.id_subcategoria),
        nombre_subcategoria: s.nombre_subcategoria
      }))
    })
  }
  if (catCamiones && Array.isArray(catCamiones.subcategories)) {
    const plumas = catCamiones.subcategories.filter(s => Number(s.id_subcategoria) === 71 || s.nombre_subcategoria.toUpperCase().includes('PLUMA'))
    if (plumas.length > 0) {
      izajeGrupos.push({
        grupo: 'Camiones Pluma',
        items: plumas.map(s => ({
          id_categoria: 62,
          nombre_categoria: catCamiones.nombre_categoria,
          id_subcategoria: Number(s.id_subcategoria),
          nombre_subcategoria: s.nombre_subcategoria
        }))
      })
    }
  }
  if (catHorquilla && Array.isArray(catHorquilla.subcategories) && catHorquilla.subcategories.length > 0) {
    izajeGrupos.push({
      grupo: catHorquilla.nombre_categoria || 'Grúas Horquilla',
      items: catHorquilla.subcategories.map(s => ({
        id_categoria: 65,
        nombre_categoria: catHorquilla.nombre_categoria,
        id_subcategoria: Number(s.id_subcategoria),
        nombre_subcategoria: s.nombre_subcategoria
      }))
    })
  }
  if (catManipulador && Array.isArray(catManipulador.subcategories) && catManipulador.subcategories.length > 0) {
    izajeGrupos.push({
      grupo: catManipulador.nombre_categoria || 'Manipuladores Telescópicos',
      items: catManipulador.subcategories.map(s => ({
        id_categoria: 70,
        nombre_categoria: catManipulador.nombre_categoria,
        id_subcategoria: Number(s.id_subcategoria),
        nombre_subcategoria: s.nombre_subcategoria
      }))
    })
  }

  // 3. TRANSPORTE:
  // - id_categoria = 62 ('CAMIONES') con subcats reales de transporte (84, 91, 93, 95)
  // - id_categoria = 99 ('TRASLADOS')
  const catTraslados = getCat(99)
  const transporteGrupos = []
  if (catCamiones && Array.isArray(catCamiones.subcategories)) {
    const camionesTransporte = catCamiones.subcategories.filter(s => Number(s.id_subcategoria) !== 71)
    if (camionesTransporte.length > 0) {
      transporteGrupos.push({
        grupo: catCamiones.nombre_categoria || 'Camiones de Transporte',
        items: camionesTransporte.map(s => ({
          id_categoria: 62,
          nombre_categoria: catCamiones.nombre_categoria,
          id_subcategoria: Number(s.id_subcategoria),
          nombre_subcategoria: s.nombre_subcategoria
        }))
      })
    }
  }
  if (catTraslados && Array.isArray(catTraslados.subcategories) && catTraslados.subcategories.length > 0) {
    transporteGrupos.push({
      grupo: catTraslados.nombre_categoria || 'Traslados y Fletes',
      items: catTraslados.subcategories.map(s => ({
        id_categoria: 99,
        nombre_categoria: catTraslados.nombre_categoria,
        id_subcategoria: Number(s.id_subcategoria),
        nombre_subcategoria: s.nombre_subcategoria
      }))
    })
  }

  // 4. PROFESIONAL: id_categoria = 151 ('PERSONAL CERTIFICADO')
  const profesionalGrupos = listaPersonalOpciones.value.length > 0 ? [{
    grupo: 'Personal Certificado',
    items: listaPersonalOpciones.value
  }] : []

  return {
    IZAJE: izajeGrupos,
    RENTAL: rentalItems.length > 0 ? [{ grupo: catRental?.nombre_categoria || 'Plataformas de Trabajo en Altura', items: rentalItems }] : [],
    TRANSPORTE: transporteGrupos,
    PROFESIONAL: profesionalGrupos
  }
})

// =========================================================================
// 2. ESTADO LOCAL Y CONTROL DE POPOVERS FLOTANTES
// =========================================================================
const localServicios = ref([])
const isInternalSyncing = ref(false)

// Popover flotante de Agregar Ítem
const addMenuVisible = ref(false)
const addMenuStyle = ref({ top: '0px', left: '0px' })
const activeAddMenuSrvIdx = ref(null)
const addMenuPopoverRef = ref(null)

// Popover flotante de Selección de Equipo Primario
const resourcePopoverVisible = ref(false)
const resourcePopoverStyle = ref({ top: '0px', left: '0px' })
const activeResourceSrvIdx = ref(null)
const resourceSearchQuery = ref('')
const resourcePopoverRef = ref(null)
const resourceSearchInputRef = ref(null)

const currentAddMenuSrv = computed(() => {
  if (activeAddMenuSrvIdx.value === null) return null
  return localServicios.value[activeAddMenuSrvIdx.value] || null
})

// Helper de ID único
const genId = (prefix = 'lin') => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

// Helper de Formato de Moneda
const formatMoneda = (val) => {
  if (typeof props.formatCurrency === 'function') {
    return props.formatCurrency(val)
  }
  return '$' + new Intl.NumberFormat('es-CL').format(Math.round(Number(val) || 0))
}

// Helper de Formato Miles
const formatMiles = (val) => {
  if (typeof props.formatInputMiles === 'function') {
    return props.formatInputMiles(val)
  }
  if (val === null || val === undefined || val === '') return ''
  const num = parseInt(String(val).replace(/\D/g, ''), 10)
  if (isNaN(num) || num === 0) return ''
  return new Intl.NumberFormat('es-CL').format(num)
}

// Sufijos para magnitudes
const getSufijoUnidad = (u) => {
  const map = {
    'Hora Efectiva': 'hrs',
    'Valor Fijo Diario': 'días',
    'Valor Fijo Semanal': 'sem',
    'Valor Fijo Mensual': 'mes'
  }
  return map[u] || 'unid'
}

// =========================================================================
// 3. MOTOR ÚNICO DE VALORIZACIÓN CANÓNICA
// =========================================================================
const calcularSubtotalNodo = (nodo) => {
  if (!nodo) return 0
  const tarifa = Number(nodo.valor_unitario !== undefined ? nodo.valor_unitario : nodo.valorUnitario) || 0
  const u = nodo.unidad
  if (UNIDADES_COBRO_UNICO.has(u)) {
    nodo.cantidad = 1
    return tarifa
  }
  if (u === 'Horas Diarias Minimas') {
    const dias = Math.max(1, Number(nodo.dias !== undefined && nodo.dias !== null ? nodo.dias : nodo.cantidad_dias || nodo.cantidad) || 1)
    const hrs = Math.max(1, Number(nodo.horas_min !== undefined && nodo.horas_min !== null ? nodo.horas_min : nodo.cantidad_horas || nodo.pisoMinimo) || 8)
    return Math.round(dias * hrs * tarifa)
  }
  if (u === 'Horas Mes Minimas') {
    const meses = Math.max(1, Number(nodo.meses !== undefined && nodo.meses !== null ? nodo.meses : nodo.cantidad_meses || nodo.cantidad) || 1)
    const hrs = Math.max(1, Number(nodo.horas_min !== undefined && nodo.horas_min !== null ? nodo.horas_min : nodo.cantidad_horas || nodo.pisoMinimo) || 180)
    return Math.round(meses * hrs * tarifa)
  }
  const cant = Math.max(1, Number(nodo.cantidad) || 1)
  return Math.round(cant * tarifa)
}

// Subtotal total del árbol
const totalNetoServicios = computed(() => {
  return localServicios.value.reduce((acc, s) => acc + (s.subtotal_servicio || 0), 0)
})

// Detección de servicios o ramas incorporados en Operaciones vs Cotización Original
const esServicioAgregado = (srv) => {
  if (!props.snapshotServicios || props.snapshotServicios.length === 0) return false
  return !props.snapshotServicios.some(s => s.id_servicio === srv.id_servicio)
}

const esRamaAgregada = (srv, rama) => {
  if (!props.snapshotServicios || props.snapshotServicios.length === 0) return false
  const srvOrig = props.snapshotServicios.find(s => s.id_servicio === srv.id_servicio)
  if (!srvOrig) return true
  return !srvOrig.ramas?.some(r => r.id_linea === rama.id_linea)
}

// Total de ítems planos sincronizados
const totalItemsPlanos = computed(() => {
  return localServicios.value.reduce((acc, s) => acc + 1 + (s.ramas?.length || 0), 0)
})

// Unidades disponibles según contexto de nodo
const getUnidadesDisponibles = (srv, rama = null) => {
  if (rama === null) {
    return UNIDADES_POR_CONTEXTO[`${srv.linea_servicio}_PRIMARIO`] || UNIDADES_POR_CONTEXTO.IZAJE_PRIMARIO
  }
  if (rama.rol === 'Traslado') {
    return UNIDADES_POR_CONTEXTO.RAMA_TRASLADO
  }
  return UNIDADES_POR_CONTEXTO.RAMA_PERSONAL
}

// =========================================================================
// 4. FILTRADO Y POPOVER DE EQUIPOS PRIMARIOS POR IDS RELACIONALES
// =========================================================================
const filteredEquiposGrupos = computed(() => {
  if (activeResourceSrvIdx.value === null) return []
  const srv = localServicios.value[activeResourceSrvIdx.value]
  if (!srv) return []
  const catalogo = catalogoEquiposPorLinea.value
  const grupos = catalogo[srv.linea_servicio] || catalogo.IZAJE || []
  const q = (resourceSearchQuery.value || '').toLowerCase().trim()

  if (!q) return grupos

  return grupos
    .map(g => ({
      grupo: g.grupo,
      items: g.items.filter(it => it.nombre_subcategoria.toLowerCase().includes(q))
    }))
    .filter(g => g.items.length > 0)
})

const isEquipoSeleccionado = (it) => {
  if (activeResourceSrvIdx.value === null) return false
  const srv = localServicios.value[activeResourceSrvIdx.value]
  if (!srv?.primario) return false
  if (srv.primario.id_subcategoria && it.id_subcategoria) {
    return Number(srv.primario.id_subcategoria) === Number(it.id_subcategoria)
  }
  return srv.primario.recurso === it.nombre_subcategoria
}

const abrirEquipoPrimarioPopover = (ev, srvIdx) => {
  ev.stopPropagation()
  cerrarTodosPopovers()
  activeResourceSrvIdx.value = srvIdx
  resourceSearchQuery.value = ''

  const rect = ev.currentTarget.getBoundingClientRect()
  const topPos = Math.min(window.innerHeight - 290, rect.bottom + 4)
  const leftPos = Math.min(window.innerWidth - 330, Math.max(12, rect.left))

  resourcePopoverStyle.value = {
    top: `${topPos}px`,
    left: `${leftPos}px`
  }
  resourcePopoverVisible.value = true

  nextTick(() => {
    if (resourceSearchInputRef.value) {
      resourceSearchInputRef.value.focus()
    }
  })
}

const seleccionarEquipoPrimario = (it) => {
  if (activeResourceSrvIdx.value === null) return
  const srv = localServicios.value[activeResourceSrvIdx.value]
  if (srv && srv.primario) {
    srv.primario.id_categoria = it.id_categoria
    srv.primario.id_subcategoria = it.id_subcategoria
    srv.primario.tipo = it.nombre_categoria
    srv.primario.subcategoria = it.nombre_subcategoria
    srv.primario.recurso = it.nombre_subcategoria
    if (!srv.primario.descripcion || srv.primario.descripcion.startsWith('Servicio de ')) {
      srv.primario.descripcion = `Servicio de ${it.nombre_subcategoria}`
    }
  }
  cerrarTodosPopovers()
  sincronizarYProyectar()
}

// =========================================================================
// 5. POPOVER DE AGREGAR ÍTEMS POR LÍNEA (ESTILO EXPLORADOR)
// =========================================================================
const getAddMenuItems = (srv) => {
  if (!srv) return []
  const botonesPorLinea = {
    IZAJE: [
      { key: 'TRASLADO_IDA_VUELTA', label: 'Traslado' },
      { key: 'PERSONAL_RIGGER', label: 'Personal (Rigger / Operador)' }
    ],
    RENTAL: [
      { key: 'FLETE_IDA', label: 'Flete Entrega (Ida)' },
      { key: 'FLETE_VUELTA', label: 'Flete Retiro (Vuelta)' }
    ],
    TRANSPORTE: [
      { key: 'TRASLADO_VUELTA', label: 'Tramo Vuelta' },
      { key: 'PERSONAL_CONDUCTOR', label: 'Personal (Conductor)' }
    ],
    PROFESIONAL: [
      { key: 'TRASLADO_PERSONAL', label: 'Traslado' },
      { key: 'PERSONAL_EXTRA', label: 'Personal Adicional' }
    ]
  }
  return botonesPorLinea[srv.linea_servicio] || botonesPorLinea.IZAJE
}

const abrirAddMenuPopover = (ev, srvIdx) => {
  ev.stopPropagation()
  cerrarTodosPopovers()
  activeAddMenuSrvIdx.value = srvIdx

  const rect = ev.currentTarget.getBoundingClientRect()
  const popHeight = 110

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

const ejecutarAgregarRama = (recetaKey) => {
  if (activeAddMenuSrvIdx.value === null) return
  const srvIdx = activeAddMenuSrvIdx.value
  cerrarTodosPopovers()
  agregarRama(srvIdx, recetaKey)
}

const cerrarTodosPopovers = () => {
  addMenuVisible.value = false
  resourcePopoverVisible.value = false
  activeAddMenuSrvIdx.value = null
  activeResourceSrvIdx.value = null
}

const onDocumentClick = (e) => {
  const addPop = addMenuPopoverRef.value
  const resPop = resourcePopoverRef.value
  const isAddBtn = e.target.closest && e.target.closest('.tree-add-branch-btn')
  if (
    (!addPop || !addPop.contains(e.target)) &&
    (!resPop || !resPop.contains(e.target)) &&
    !isAddBtn
  ) {
    cerrarTodosPopovers()
  }
}

// =========================================================================
// 6. OPERACIONES DE ÁRBOL
// =========================================================================
const toggleColapso = (srvIdx) => {
  if (localServicios.value[srvIdx]) {
    localServicios.value[srvIdx].colapsado = !localServicios.value[srvIdx].colapsado
  }
}

const moverServicio = (index, delta) => {
  const newIndex = index + delta
  if (newIndex < 0 || newIndex >= localServicios.value.length) return
  const item = localServicios.value.splice(index, 1)[0]
  localServicios.value.splice(newIndex, 0, item)
  sincronizarYProyectar()
}

const eliminarServicio = (index) => {
  const srv = localServicios.value[index]
  if (!srv) return
  const totalRamas = srv.ramas?.length || 0
  if (totalRamas > 0 || (srv.primario?.valor_unitario > 0)) {
    if (!confirm(`¿Eliminar el servicio "${srv.nombre_servicio}" y sus ${totalRamas} ítems asociados?`)) {
      return
    }
  }
  localServicios.value.splice(index, 1)
  sincronizarYProyectar()
}

const eliminarRama = (srv, ramaIndex) => {
  srv.ramas.splice(ramaIndex, 1)
  sincronizarYProyectar()
}

const agregarServicio = (linea) => {
  const idSrv = genId('srv')
  const idRoot = genId('lin_root')

  // Obtener primera opción de la línea desde catalogoEquiposPorLinea (de BD)
  const catalogo = catalogoEquiposPorLinea.value[linea] || catalogoEquiposPorLinea.value.IZAJE
  const primerItem = catalogo?.[0]?.items?.[0] || null

  let idCat = primerItem?.id_categoria || (linea === 'RENTAL' ? 102 : linea === 'TRANSPORTE' ? 62 : linea === 'PROFESIONAL' ? 151 : 40)
  let idSubcat = primerItem?.id_subcategoria || (linea === 'RENTAL' ? 134 : linea === 'TRANSPORTE' ? 84 : linea === 'PROFESIONAL' ? 160 : 54)
  let nomRecurso = primerItem?.nombre_subcategoria || (linea === 'RENTAL' ? 'PLATAFORMA TIJERA ELECTRICA' : linea === 'TRANSPORTE' ? 'SEMIREMOLQUE' : linea === 'PROFESIONAL' ? 'RIGGER' : 'GRUA 70 TON')
  let nomTipo = primerItem?.nombre_categoria || (linea === 'RENTAL' ? 'PLATAFORMAS' : linea === 'TRANSPORTE' ? 'CAMIONES' : linea === 'PROFESIONAL' ? 'PERSONAL CERTIFICADO' : 'GRUAS TELESCOPICAS')

  const defaults = {
    IZAJE: {
      titulo: 'Servicio de Izaje y Maniobra',
      primario: {
        id_categoria: idCat,
        id_subcategoria: idSubcat,
        tipo: nomTipo,
        subcategoria: nomRecurso,
        recurso: nomRecurso,
        descripcion: `Servicio de ${nomRecurso} con operador en faena`,
        unidad: 'Horas Diarias Minimas',
        dias: 1, horas_min: 8, meses: 1, cantidad: 1,
        valor_unitario: 115000
      }
    },
    RENTAL: {
      titulo: 'Arriendo de Plataforma en Obra',
      primario: {
        id_categoria: idCat,
        id_subcategoria: idSubcat,
        tipo: nomTipo,
        subcategoria: nomRecurso,
        recurso: nomRecurso,
        descripcion: `Arriendo de ${nomRecurso} sin operador (Contrato + Acta)`,
        unidad: 'Valor Fijo Mensual',
        dias: 1, horas_min: 0, meses: 1, cantidad: 1,
        valor_unitario: 850000
      }
    },
    TRANSPORTE: {
      titulo: 'Servicio de Transporte de Carga',
      primario: {
        id_categoria: idCat,
        id_subcategoria: idSubcat,
        tipo: nomTipo,
        subcategoria: nomRecurso,
        recurso: nomRecurso,
        descripcion: `Transporte en ${nomRecurso} punto a punto`,
        unidad: 'Traslado Ida/Vuelta',
        dias: 1, horas_min: 0, meses: 1, cantidad: 1,
        valor_unitario: 380000
      }
    },
    PROFESIONAL: {
      titulo: 'Servicio de Personal en Obra',
      primario: {
        id_categoria: 151,
        id_subcategoria: 160,
        tipo: 'PERSONAL CERTIFICADO',
        subcategoria: 'RIGGER',
        recurso: 'RIGGER',
        descripcion: 'Servicio de Rigger en obra',
        unidad: 'Horas Diarias Minimas',
        dias: 1, horas_min: 8, meses: 1, cantidad: 1,
        valor_unitario: 18000
      }
    }
  }

  const cfg = defaults[linea] || defaults.IZAJE
  const nuevoServicio = {
    id_servicio: idSrv,
    linea_servicio: linea,
    colapsado: false,
    nombre_servicio: cfg.titulo,
    primario: {
      id_linea: idRoot,
      id_servicio: idSrv,
      id_padre: null,
      rol_arbol: 'PRIMARIO',
      id_categoria: cfg.primario.id_categoria,
      id_subcategoria: cfg.primario.id_subcategoria,
      tipo: cfg.primario.tipo,
      subcategoria: cfg.primario.subcategoria,
      recurso: cfg.primario.recurso,
      descripcion: cfg.primario.descripcion,
      unidad: cfg.primario.unidad,
      dias: cfg.primario.dias,
      cantidad_dias: cfg.primario.dias,
      horas_min: cfg.primario.horas_min,
      cantidad_horas: cfg.primario.horas_min,
      pisoMinimo: cfg.primario.horas_min,
      meses: cfg.primario.meses,
      cantidad_meses: cfg.primario.meses,
      cantidad: cfg.primario.cantidad,
      valor_unitario: cfg.primario.valor_unitario,
      valorUnitario: cfg.primario.valor_unitario,
      subtotal: 0
    },
    ramas: [],
    subtotal_servicio: 0
  }

  nuevoServicio.primario.subtotal = calcularSubtotalNodo(nuevoServicio.primario)
  nuevoServicio.subtotal_servicio = nuevoServicio.primario.subtotal

  localServicios.value.push(nuevoServicio)
  sincronizarYProyectar()
}

const agregarRama = (srvIdx, recetaKey) => {
  const srv = localServicios.value[srvIdx]
  if (!srv) return

  const map = {
    TRASLADO_IDA_VUELTA: {
      rol: 'Traslado',
      rol_arbol: 'TRASLADO',
      id_categoria: 99,
      id_subcategoria: 901,
      tipo: 'TRASLADOS',
      subcategoria: 'MOVILIZACIÓN',
      recurso: 'Traslado',
      descripcion: 'Traslado de equipo a obra (Ida y Vuelta)',
      unidad: 'Traslado Ida/Vuelta',
      cantidad: 1, dias: 1, horas_min: 0, meses: 1,
      valor_unitario: 0
    },
    PERSONAL_RIGGER: {
      rol: 'Personal',
      rol_arbol: 'PERSONAL',
      id_categoria: 151,
      id_subcategoria: 160,
      tipo: 'PERSONAL CERTIFICADO',
      subcategoria: 'RIGGER',
      recurso: 'RIGGER',
      descripcion: 'Servicio de Rigger en obra',
      unidad: 'Horas Diarias Minimas',
      cantidad: 1,
      dias: srv.primario?.dias || srv.primario?.cantidad_dias || 1,
      horas_min: srv.primario?.horas_min || srv.primario?.cantidad_horas || 8,
      meses: 1,
      valor_unitario: 18000
    },
    FLETE_IDA: {
      rol: 'Traslado',
      rol_arbol: 'TRASLADO',
      id_categoria: 99,
      id_subcategoria: 901,
      tipo: 'TRASLADOS',
      subcategoria: 'FLETE IDA',
      recurso: 'Traslado',
      descripcion: 'Flete de entrega inicial en obra',
      unidad: 'Traslado Ida',
      cantidad: 1, dias: 1, horas_min: 0, meses: 1,
      valor_unitario: 95000
    },
    FLETE_VUELTA: {
      rol: 'Traslado',
      rol_arbol: 'TRASLADO',
      id_categoria: 99,
      id_subcategoria: 901,
      tipo: 'TRASLADOS',
      subcategoria: 'FLETE RETORNO',
      recurso: 'Traslado',
      descripcion: 'Flete de retiro desde obra',
      unidad: 'Traslado Vuelta',
      cantidad: 1, dias: 1, horas_min: 0, meses: 1,
      valor_unitario: 95000
    },
    TRASLADO_VUELTA: {
      rol: 'Traslado',
      rol_arbol: 'TRASLADO',
      id_categoria: 99,
      id_subcategoria: 901,
      tipo: 'TRASLADOS',
      subcategoria: 'TRAMO RETORNO',
      recurso: 'Traslado',
      descripcion: 'Tramo de vuelta',
      unidad: 'Traslado Vuelta',
      cantidad: 1, dias: 1, horas_min: 0, meses: 1,
      valor_unitario: 0
    },
    PERSONAL_CONDUCTOR: {
      rol: 'Personal',
      rol_arbol: 'PERSONAL',
      id_categoria: 151,
      id_subcategoria: 161,
      tipo: 'PERSONAL CERTIFICADO',
      subcategoria: 'OPERADOR',
      recurso: 'OPERADOR',
      descripcion: 'Servicio de Conductor / Operador en obra',
      unidad: 'Valor Fijo',
      cantidad: 1, dias: 1, horas_min: 0, meses: 1,
      valor_unitario: 0
    },
    TRASLADO_PERSONAL: {
      rol: 'Traslado',
      rol_arbol: 'TRASLADO',
      id_categoria: 99,
      id_subcategoria: 901,
      tipo: 'TRASLADOS',
      subcategoria: 'MOVILIZACIÓN PERSONAL',
      recurso: 'Traslado',
      descripcion: 'Movilización de personal a obra',
      unidad: 'Traslado Ida/Vuelta',
      cantidad: 1, dias: 1, horas_min: 0, meses: 1,
      valor_unitario: 0
    },
    PERSONAL_EXTRA: {
      rol: 'Personal',
      rol_arbol: 'PERSONAL',
      id_categoria: 151,
      id_subcategoria: 161,
      tipo: 'PERSONAL CERTIFICADO',
      subcategoria: 'OPERADOR',
      recurso: 'OPERADOR',
      descripcion: 'Servicio de Operador en obra',
      unidad: 'Valor Fijo Diario',
      cantidad: 1, dias: 1, horas_min: 0, meses: 1,
      valor_unitario: 0
    }
  }

  const template = map[recetaKey] || map.TRASLADO_IDA_VUELTA
  const idRama = genId('lin_rama')

  const nuevaRama = {
    id_linea: idRama,
    id_servicio: srv.id_servicio,
    id_padre: srv.primario?.id_linea || null,
    rol: template.rol,
    rol_arbol: template.rol_arbol,
    id_categoria: template.id_categoria,
    id_subcategoria: template.id_subcategoria,
    tipo: template.tipo,
    subcategoria: template.subcategoria,
    recurso: template.recurso,
    descripcion: template.descripcion,
    unidad: template.unidad,
    dias: template.dias,
    cantidad_dias: template.dias,
    horas_min: template.horas_min,
    cantidad_horas: template.horas_min,
    pisoMinimo: template.horas_min,
    meses: template.meses,
    cantidad_meses: template.meses,
    cantidad: template.cantidad,
    valor_unitario: template.valor_unitario,
    valorUnitario: template.valor_unitario,
    subtotal: 0
  }

  nuevaRama.subtotal = calcularSubtotalNodo(nuevaRama)
  srv.ramas.push(nuevaRama)
  sincronizarYProyectar()
}

// =========================================================================
// 7. HANDLERS DE EDICIÓN Y SINCRONIZACIÓN
// =========================================================================
const onFieldChange = () => {
  sincronizarYProyectar()
}

const onCargoPrimarioSubcatChange = (srv) => {
  const p = srv.primario
  const sub = listaPersonalOpciones.value.find(s => Number(s.id_subcategoria) === Number(p.id_subcategoria))
  if (sub) {
    p.recurso = sub.nombre_subcategoria
    p.subcategoria = sub.nombre_subcategoria
    p.id_categoria = 151
    p.tipo = 'PERSONAL CERTIFICADO'
    if (!p.descripcion || p.descripcion.startsWith('Servicio de ')) {
      p.descripcion = `Servicio de ${sub.nombre_subcategoria} en obra`
    }
  }
  sincronizarYProyectar()
}

const onCargoRamaSubcatChange = (rama) => {
  const sub = listaPersonalOpciones.value.find(s => Number(s.id_subcategoria) === Number(rama.id_subcategoria))
  if (sub) {
    rama.recurso = sub.nombre_subcategoria
    rama.subcategoria = sub.nombre_subcategoria
    rama.id_categoria = 151
    rama.tipo = 'PERSONAL CERTIFICADO'
    if (!rama.descripcion || rama.descripcion.startsWith('Servicio de ')) {
      rama.descripcion = `Servicio de ${sub.nombre_subcategoria} en obra`
    }
  }
  sincronizarYProyectar()
}

const onCargoPrimarioChange = (srv) => {
  const p = srv.primario
  if (!p.descripcion || p.descripcion.startsWith('Servicio de ')) {
    p.descripcion = `Servicio de ${p.recurso} en obra`
  }
  sincronizarYProyectar()
}

const onCargoRamaChange = (rama) => {
  if (!rama.descripcion || rama.descripcion.startsWith('Servicio de ')) {
    rama.descripcion = `Servicio de ${rama.recurso} en obra`
  }
  sincronizarYProyectar()
}

const onUnidadChange = (nodo) => {
  if (!nodo) return
  if (UNIDADES_COBRO_UNICO.has(nodo.unidad)) {
    nodo.cantidad = 1
    nodo.dias = null
    nodo.cantidad_dias = null
    nodo.horas_min = null
    nodo.cantidad_horas = null
    nodo.meses = null
    nodo.cantidad_meses = null
    nodo.pisoMinimo = 0
  } else if (nodo.unidad === 'Horas Diarias Minimas') {
    if (!nodo.dias || nodo.dias < 1) nodo.dias = 1
    if (!nodo.horas_min || nodo.horas_min < 1) nodo.horas_min = 8
    nodo.cantidad_dias = nodo.dias
    nodo.cantidad_horas = nodo.horas_min
    nodo.pisoMinimo = nodo.horas_min
    nodo.cantidad = nodo.dias
  } else if (nodo.unidad === 'Horas Mes Minimas') {
    if (!nodo.meses || nodo.meses < 1) nodo.meses = 1
    if (!nodo.horas_min || nodo.horas_min < 2) nodo.horas_min = 180
    nodo.cantidad_meses = nodo.meses
    nodo.cantidad_horas = nodo.horas_min
    nodo.pisoMinimo = nodo.horas_min
    nodo.cantidad = nodo.meses
  } else {
    if (!nodo.cantidad || nodo.cantidad < 1) nodo.cantidad = 1
    nodo.dias = null
    nodo.cantidad_dias = null
    nodo.horas_min = null
    nodo.cantidad_horas = null
    nodo.meses = null
    nodo.cantidad_meses = null
    nodo.pisoMinimo = 0
  }
  sincronizarYProyectar()
}

const onDiasInput = (nodo) => {
  nodo.cantidad_dias = nodo.dias
  nodo.cantidad = nodo.dias
  sincronizarYProyectar()
}

const onHorasInput = (nodo) => {
  nodo.cantidad_horas = nodo.horas_min
  nodo.pisoMinimo = nodo.horas_min
  sincronizarYProyectar()
}

const onMesesInput = (nodo) => {
  nodo.cantidad_meses = nodo.meses
  nodo.cantidad = nodo.meses
  sincronizarYProyectar()
}

const onTarifaInput = (ev, nodo) => {
  const digits = ev.target.value.replace(/\D/g, '')
  const num = digits ? parseInt(digits, 10) : 0
  nodo.valor_unitario = num
  nodo.valorUnitario = num
  ev.target.value = num > 0 ? new Intl.NumberFormat('es-CL').format(num) : ''
  sincronizarYProyectar()
}

// =========================================================================
// 8. DUAL-WRITE: PROYECCIÓN APLANADA HACIA lines Y ÁRBOL HACIA servicios
// =========================================================================
const sincronizarYProyectar = () => {
  isInternalSyncing.value = true
  const flatLines = []

  localServicios.value.forEach(srv => {
    let subtotalSrv = 0

    // 1. Proyectar Nodo Primario
    if (srv.primario) {
      const p = srv.primario
      p.id_linea = p.id_linea || genId('lin_root')
      p.id_servicio = srv.id_servicio
      p.id_padre = null
      p.rol_arbol = 'PRIMARIO'
      p.linea_servicio = srv.linea_servicio
      p.tipo_ot = srv.linea_servicio === 'TRANSPORTE' ? 'OT-FLETE' : srv.linea_servicio === 'RENTAL' ? 'OT-RENTAL' : srv.linea_servicio === 'PROFESIONAL' ? 'OT-STAFF' : 'OT-MANIOBRA'

      // Clasificación canónica de categoría/tipo para BD
      if (srv.linea_servicio === 'PROFESIONAL') {
        p.tipo = 'PERSONAL CERTIFICADO'
        p.subcategoria = p.recurso
      } else if (srv.linea_servicio === 'TRANSPORTE') {
        p.tipo = 'CAMIONES'
        p.subcategoria = p.recurso
      } else if (srv.linea_servicio === 'RENTAL') {
        p.tipo = String(p.recurso).includes('Tijera') ? 'PLATAFORMAS TIJERA' : 'ALZA HOMBRES'
        p.subcategoria = p.recurso
      } else {
        // IZAJE
        if (String(p.recurso).includes('Horquilla')) p.tipo = 'GRUA HORQUILLA'
        else if (String(p.recurso).includes('Manipulador')) p.tipo = 'MANIPULADORES'
        else if (String(p.recurso).includes('Camión Pluma')) p.tipo = 'CAMIONES'
        else p.tipo = 'GRUAS TELESCOPICAS'
        p.subcategoria = p.recurso
      }

      p.valor_unitario = Number(p.valor_unitario !== undefined ? p.valor_unitario : p.valorUnitario) || 0
      p.valorUnitario = p.valor_unitario
      p.subtotal = calcularSubtotalNodo(p)
      subtotalSrv += p.subtotal

      flatLines.push({
        id_linea: p.id_linea,
        id_servicio: srv.id_servicio,
        id_padre: null,
        rol_arbol: 'PRIMARIO',
        id_categoria: p.id_categoria ? Number(p.id_categoria) : null,
        id_subcategoria: p.id_subcategoria ? Number(p.id_subcategoria) : null,
        linea_servicio: srv.linea_servicio,
        tipo_ot: p.tipo_ot,
        tipo: p.tipo,
        subcategoria: p.subcategoria,
        recurso: p.recurso,
        descripcion: p.descripcion,
        unidad: p.unidad,
        cantidad: p.cantidad || 1,
        cantidad_dias: p.dias || p.cantidad_dias || null,
        cantidad_horas: p.horas_min || p.cantidad_horas || null,
        cantidad_meses: p.meses || p.cantidad_meses || null,
        pisoMinimo: p.horas_min || p.pisoMinimo || null,
        valor_unitario: p.valor_unitario,
        valorUnitario: p.valor_unitario,
        subtotal: p.subtotal,
        is_linea_base: true
      })
    }

    // 2. Proyectar Ramas Subordinadas
    if (Array.isArray(srv.ramas)) {
      srv.ramas.forEach(rama => {
        rama.id_linea = rama.id_linea || genId('lin_rama')
        rama.id_servicio = srv.id_servicio
        rama.id_padre = srv.primario?.id_linea || null
        rama.linea_servicio = srv.linea_servicio
        rama.tipo_ot = srv.linea_servicio === 'TRANSPORTE' ? 'OT-FLETE' : srv.linea_servicio === 'RENTAL' ? 'OT-RENTAL' : srv.linea_servicio === 'PROFESIONAL' ? 'OT-STAFF' : 'OT-MANIOBRA'

        if (rama.rol === 'Traslado') {
          rama.rol_arbol = 'TRASLADO'
          rama.tipo = rama.tipo || 'TRASLADOS'
          rama.subcategoria = rama.subcategoria || 'MOVILIZACIÓN GRÚA'
          rama.id_categoria = rama.id_categoria || 99
          rama.id_subcategoria = rama.id_subcategoria || 901
        } else {
          rama.rol_arbol = 'PERSONAL'
          rama.tipo = 'PERSONAL CERTIFICADO'
          rama.id_categoria = 151
          if (!rama.id_subcategoria) {
            const matchSub = listaPersonalOpciones.value.find(s => s.nombre_subcategoria === rama.recurso)
            rama.id_subcategoria = matchSub ? matchSub.id_subcategoria : 160
          }
          rama.subcategoria = rama.recurso
        }

        rama.valor_unitario = Number(rama.valor_unitario !== undefined ? rama.valor_unitario : rama.valorUnitario) || 0
        rama.valorUnitario = rama.valor_unitario
        rama.subtotal = calcularSubtotalNodo(rama)
        subtotalSrv += rama.subtotal

        flatLines.push({
          id_linea: rama.id_linea,
          id_servicio: srv.id_servicio,
          id_padre: srv.primario?.id_linea || null,
          rol_arbol: rama.rol_arbol,
          id_categoria: rama.id_categoria ? Number(rama.id_categoria) : null,
          id_subcategoria: rama.id_subcategoria ? Number(rama.id_subcategoria) : null,
          linea_servicio: srv.linea_servicio,
          tipo_ot: rama.tipo_ot,
          tipo: rama.tipo,
          subcategoria: rama.subcategoria,
          recurso: rama.recurso,
          descripcion: rama.descripcion,
          unidad: rama.unidad,
          cantidad: rama.cantidad || 1,
          cantidad_dias: rama.dias || rama.cantidad_dias || null,
          cantidad_horas: rama.horas_min || rama.cantidad_horas || null,
          cantidad_meses: rama.meses || rama.cantidad_meses || null,
          pisoMinimo: rama.horas_min || rama.pisoMinimo || null,
          valor_unitario: rama.valor_unitario,
          valorUnitario: rama.valor_unitario,
          subtotal: rama.subtotal,
          is_linea_base: true
        })
      })
    }

    srv.subtotal_servicio = subtotalSrv
  })

  emit('update:lines', flatLines)
  emit('update:servicios', JSON.parse(JSON.stringify(localServicios.value)))

  setTimeout(() => {
    isInternalSyncing.value = false
  }, 10)
}

// =========================================================================
// 9. HIDRATACIÓN RETROCOMPATIBLE DESDE LÍNEAS PLANAS CON RESOLUCIÓN DE IDS
// =========================================================================
const hidratarArbolDesdeLineasPlanas = (lineasPlanas) => {
  if (!Array.isArray(lineasPlanas) || lineasPlanas.length === 0) return []

  const serviciosMap = new Map()

  // Helper para resolver IDs relacionales en líneas legacy
  const resolverIdsRelacionales = (l) => {
    let idCat = l.id_categoria ? Number(l.id_categoria) : null
    let idSubcat = l.id_subcategoria ? Number(l.id_subcategoria) : null

    if (idCat && idSubcat) return { id_categoria: idCat, id_subcategoria: idSubcat }

    const cats = Array.isArray(props.dbCategories) ? props.dbCategories : []
    const subTexto = (l.subcategoria || l.recurso || l.descripcion || '').toUpperCase()

    // Búsqueda determinista por subcategoría en props.dbCategories
    for (const c of cats) {
      if (Array.isArray(c.subcategories)) {
        const found = c.subcategories.find(s => 
          s.nombre_subcategoria && subTexto.includes(s.nombre_subcategoria.toUpperCase())
        )
        if (found) {
          return { id_categoria: Number(c.id_categoria), id_subcategoria: Number(found.id_subcategoria) }
        }
      }
    }

    // Fallbacks canónicos
    if (String(l.tipo).includes('PERSONAL') || subTexto.includes('RIGGER') || subTexto.includes('OPERADOR')) {
      return { id_categoria: 151, id_subcategoria: subTexto.includes('OPERADOR') ? 161 : 160 }
    }
    if (String(l.unidad).includes('MES') || subTexto.includes('TIJERA') || subTexto.includes('PLATAFORMA')) {
      return { id_categoria: 102, id_subcategoria: 134 }
    }
    if (String(l.tipo).includes('CAMION') || subTexto.includes('CAMA BAJA') || subTexto.includes('RAMPLA')) {
      return { id_categoria: 62, id_subcategoria: 84 }
    }
    return { id_categoria: 40, id_subcategoria: 54 }
  }

  lineasPlanas.forEach(l => {
    const idSrv = l.id_servicio || `srv_${l.id_linea || Math.random().toString(36).substring(2, 7)}`
    if (!serviciosMap.has(idSrv)) {
      const lineaSrv = l.linea_servicio || (String(l.unidad).includes('MES') ? 'RENTAL' : String(l.tipo).includes('CAMION') ? 'TRANSPORTE' : 'IZAJE')
      serviciosMap.set(idSrv, {
        id_servicio: idSrv,
        linea_servicio: lineaSrv,
        colapsado: false,
        nombre_servicio: l.descripcion || l.subcategoria || `Servicio de ${LINEA_LABELS[lineaSrv] || lineaSrv}`,
        primario: null,
        ramas: [],
        subtotal_servicio: 0
      })
    }

    const srv = serviciosMap.get(idSrv)
    const esPrimario = l.rol_arbol === 'PRIMARIO' || (!l.id_padre && !srv.primario)
    const { id_categoria, id_subcategoria } = resolverIdsRelacionales(l)

    const nodoNormalizado = {
      id_linea: l.id_linea || genId('lin'),
      id_servicio: idSrv,
      id_padre: l.id_padre || null,
      rol_arbol: esPrimario ? 'PRIMARIO' : (l.rol_arbol || 'TRASLADO'),
      rol: (l.rol_arbol === 'PERSONAL' || String(l.tipo).includes('PERSONAL')) ? 'Personal' : 'Traslado',
      id_categoria: id_categoria,
      id_subcategoria: id_subcategoria,
      tipo: l.tipo || '',
      subcategoria: l.subcategoria || l.recurso || '',
      recurso: l.subcategoria || l.recurso || l.descripcion || 'Servicio',
      descripcion: l.descripcion || '',
      unidad: l.unidad || 'Horas Diarias Minimas',
      dias: Number(l.cantidad_dias !== undefined && l.cantidad_dias !== null ? l.cantidad_dias : l.dias || l.cantidad) || 1,
      cantidad_dias: Number(l.cantidad_dias !== undefined && l.cantidad_dias !== null ? l.cantidad_dias : l.dias || l.cantidad) || 1,
      horas_min: Number(l.cantidad_horas !== undefined && l.cantidad_horas !== null ? l.cantidad_horas : l.horas_min || l.pisoMinimo) || 8,
      cantidad_horas: Number(l.cantidad_horas !== undefined && l.cantidad_horas !== null ? l.cantidad_horas : l.horas_min || l.pisoMinimo) || 8,
      pisoMinimo: Number(l.cantidad_horas !== undefined && l.cantidad_horas !== null ? l.cantidad_horas : l.horas_min || l.pisoMinimo) || 8,
      meses: Number(l.cantidad_meses !== undefined && l.cantidad_meses !== null ? l.cantidad_meses : l.meses || l.cantidad) || 1,
      cantidad_meses: Number(l.cantidad_meses !== undefined && l.cantidad_meses !== null ? l.cantidad_meses : l.meses || l.cantidad) || 1,
      cantidad: Number(l.cantidad) || 1,
      valor_unitario: Number(l.valor_unitario !== undefined ? l.valor_unitario : l.valorUnitario) || 0,
      valorUnitario: Number(l.valor_unitario !== undefined ? l.valor_unitario : l.valorUnitario) || 0,
      subtotal: 0
    }

    nodoNormalizado.subtotal = calcularSubtotalNodo(nodoNormalizado)

    if (esPrimario) {
      srv.primario = nodoNormalizado
    } else {
      srv.ramas.push(nodoNormalizado)
    }
  })

  const resultado = Array.from(serviciosMap.values()).map(srv => {
    if (!srv.primario && srv.ramas.length > 0) {
      srv.primario = srv.ramas.shift()
      srv.primario.rol_arbol = 'PRIMARIO'
      srv.primario.id_padre = null
    }
    srv.subtotal_servicio = (srv.primario?.subtotal || 0) + srv.ramas.reduce((acc, r) => acc + (r.subtotal || 0), 0)
    return srv
  })

  return resultado
}

// Carga e inicialización reactiva
const cargarArbol = () => {
  if (Array.isArray(props.servicios) && props.servicios.length > 0) {
    localServicios.value = JSON.parse(JSON.stringify(props.servicios))
    localServicios.value.forEach(s => {
      if (s.primario) s.primario.subtotal = calcularSubtotalNodo(s.primario)
      if (Array.isArray(s.ramas)) {
        s.ramas.forEach(r => { r.subtotal = calcularSubtotalNodo(r) })
      }
      s.subtotal_servicio = (s.primario?.subtotal || 0) + (s.ramas || []).reduce((acc, r) => acc + (r.subtotal || 0), 0)
    })
  } else if (Array.isArray(props.lines) && props.lines.length > 0) {
    localServicios.value = hidratarArbolDesdeLineasPlanas(props.lines)
  } else {
    localServicios.value = []
  }
}

watch(() => props.servicios, (newSrv) => {
  if (isInternalSyncing.value) return
  if (Array.isArray(newSrv) && newSrv.length > 0) {
    localServicios.value = JSON.parse(JSON.stringify(newSrv))
  }
}, { deep: true })

watch(() => props.lines, (newLines) => {
  if (isInternalSyncing.value) return
  if ((!localServicios.value || localServicios.value.length === 0) && Array.isArray(newLines) && newLines.length > 0) {
    localServicios.value = hidratarArbolDesdeLineasPlanas(newLines)
  }
}, { deep: true })

onMounted(() => {
  cargarArbol()
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

defineExpose({
  localServicios,
  hidratarArbolDesdeLineasPlanas,
  sincronizarYProyectar
})
</script>

<style scoped>
.surface-card {
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.25);
}

.field-input {
  background: #0d1320;
  border: 1px solid #1f2937;
  color: #f8fafc;
  border-radius: 6px;
  font-size: 12.5px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.field-input:hover { border-color: #334155; }
.field-input:focus {
  outline: none;
  border-color: #cbd5e1;
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.15);
}
.field-input::placeholder { color: #64748b; }

/* Conectores limpios de árbol continuo sólido de 1px (#475569) */
.tree-table {
  border-collapse: separate;
  border-spacing: 0;
}
.tree-table tbody tr td {
  border: none !important;
}
.tree-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
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
  transition: all 0.12s ease;
}
.tree-toggle-box:hover {
  border-color: #f59e0b;
  color: #f8fafc;
  background: #161f30;
}

/* Celda del nodo padre con conector continuo que baja a los hijos */
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

/* Celdas de ramas hijas con conector continuo ├── */
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

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] { -moz-appearance: textfield; }

.combo-popover {
  background: #111827;
  border: 1px solid #334155;
  box-shadow: 0 14px 30px -5px rgba(0, 0, 0, 0.55);
  border-radius: 8px;
}
</style>
