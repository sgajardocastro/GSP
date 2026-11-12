<template>
  <div class="space-y-4">
    <!-- BARRA SUPERIOR DE ACCIONES: CATÁLOGO DE LAS 4 LÍNEAS DE SERVICIO (CAPA 1) -->
    <div class="rounded-xl border border-white/10 bg-[#080d1a] p-3 shadow-sm">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-white uppercase tracking-wider">Estructurador de Servicios por Unidades de Trabajo</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">Arquitectura 2 Capas</span>
          </div>
          <p class="text-[11px] text-slate-400">
            Define la solución comercial contratada (Capa 1) y asocia sus recursos, traslados y dotación física subordinada (Capa 2).
          </p>
        </div>

        <!-- 4 BOTONES DE LÍNEA DE SERVICIO -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- 1. TRANSPORTE -->
          <button
            type="button"
            @click="agregarServicio('TRANSPORTE')"
            :disabled="disabled"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/40 hover:border-blue-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title="Añadir Unidad de Trabajo de Transporte de Carga o Flete (OT-FLETE)"
          >
            <span>🚚</span>
            <span>+ TRANSPORTE</span>
            <span class="text-[9px] bg-blue-500/30 px-1 py-0.2 rounded font-mono">OT-FLETE</span>
          </button>

          <!-- 2. RENTAL -->
          <button
            type="button"
            @click="agregarServicio('RENTAL')"
            :disabled="disabled"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:border-purple-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title="Añadir Unidad de Arriendo Continuo en Faena (OT-RENTAL)"
          >
            <span>📅</span>
            <span>+ RENTAL</span>
            <span class="text-[9px] bg-purple-500/30 px-1 py-0.2 rounded font-mono">OT-RENTAL</span>
          </button>

          <!-- 3. PROFESIONAL -->
          <button
            type="button"
            @click="agregarServicio('PROFESIONAL')"
            :disabled="disabled"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-200 border border-teal-500/40 hover:border-teal-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title="Añadir Dotación de Especialistas Certificados o Asesorías Técnicas (OT-STAFF)"
          >
            <span>👷</span>
            <span>+ PROFESIONAL</span>
            <span class="text-[9px] bg-teal-500/30 px-1 py-0.2 rounded font-mono">OT-STAFF</span>
          </button>

          <!-- 4. IZAJE -->
          <button
            type="button"
            @click="agregarServicio('IZAJE')"
            :disabled="disabled"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/50 hover:border-amber-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title="Añadir Maniobra de Grúa e Izaje Industrial (OT-MANIOBRA)"
          >
            <span>⚙️</span>
            <span>+ IZAJE</span>
            <span class="text-[9px] bg-amber-500/30 px-1 py-0.2 rounded font-mono">OT-MANIOBRA</span>
          </button>
        </div>
      </div>

      <!-- RESUMEN GLOBAL COMPACTO -->
      <div v-if="localServicios.length > 0" class="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div class="flex items-center gap-3">
          <span>Unidades de Trabajo: <strong class="text-white">{{ localServicios.length }}</strong></span>
          <span>Ítems Planos Sincronizados: <strong class="text-white">{{ totalItemsPlanos }}</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <span>Total Neto Cotizado:</span>
          <span class="text-amber-400 font-mono font-bold text-xs">{{ formatMoneda(totalNetoServicios) }}</span>
        </div>
      </div>
    </div>

    <!-- ESTADO VACÍO -->
    <div
      v-if="localServicios.length === 0"
      class="rounded-xl border border-dashed border-white/10 bg-[#0a0f1e]/40 p-8 text-center space-y-3"
    >
      <div class="text-3xl text-slate-600">🌳</div>
      <div class="space-y-1">
        <h4 class="text-sm font-bold text-slate-200">No hay servicios estructurados en el árbol</h4>
        <p class="text-xs text-slate-400 max-w-md mx-auto">
          Seleccione una de las 4 líneas comerciales en la cabecera (+ TRANSPORTE, + RENTAL, + PROFESIONAL, + IZAJE) para configurar la propuesta.
        </p>
      </div>
      <div class="pt-2 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          @click="agregarServicio('IZAJE')"
          :disabled="disabled"
          class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer disabled:opacity-50"
        >
          ⚙️ Crear Servicio de Izaje
        </button>
        <button
          type="button"
          @click="agregarServicio('TRANSPORTE')"
          :disabled="disabled"
          class="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
        >
          🚚 Crear Servicio de Transporte
        </button>
      </div>
    </div>

    <!-- LISTADO DE UNIDADES DE TRABAJO (ÁRBOLES) -->
    <div v-else class="space-y-4">
      <div
        v-for="(servicio, srvIdx) in localServicios"
        :key="servicio.id_servicio"
        class="rounded-xl border bg-[#060a14] overflow-hidden shadow-sm transition-all"
        :class="getLineaBorderClass(servicio.linea_servicio)"
      >
        <!-- CABECERA DE LA UNIDAD DE TRABAJO (CAPA 1) -->
        <div class="px-3.5 py-2.5 bg-[#090e1c] border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-1 min-w-[300px]">
            <!-- Correlativo -->
            <span class="w-6 h-6 rounded-full bg-white/10 text-white font-mono font-bold text-xs flex items-center justify-center">
              {{ srvIdx + 1 }}
            </span>

            <!-- Badge Línea de Servicio -->
            <span
              class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border font-mono"
              :class="getLineaBadgeClass(servicio.linea_servicio)"
            >
              {{ servicio.linea_servicio }}
            </span>

            <!-- Badge Tipo OT Handoff -->
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-white/10 font-mono" title="Tipo de Orden de Trabajo a generar en Operaciones">
              {{ servicio.tipo_ot }}
            </span>

            <!-- Nombre / Glosa del Servicio (Editable) -->
            <input
              type="text"
              v-model="servicio.nombre_servicio"
              @input="onFieldChange"
              :disabled="disabled"
              placeholder="Nombre o descripción del servicio..."
              class="flex-1 min-w-[200px] bg-transparent border-b border-white/10 focus:border-amber-500 text-xs sm:text-sm font-bold text-white outline-none px-1 py-0.5 placeholder-slate-500"
              maxlength="200"
            />
          </div>

          <!-- SUB-TOTAL DEL SERVICIO Y ACCIONES DE LA UNIDAD -->
          <div class="flex items-center gap-3 ml-auto">
            <div class="text-right">
              <span class="text-[9px] text-slate-400 block uppercase font-mono">Subtotal Servicio</span>
              <span class="text-xs sm:text-sm font-mono font-bold text-amber-400">
                {{ formatMoneda(servicio.subtotal_servicio) }}
              </span>
            </div>

            <!-- Botones Ordenar Arriba / Abajo -->
            <div class="flex items-center gap-1">
              <button
                type="button"
                @click="moverServicio(srvIdx, -1)"
                :disabled="disabled || srvIdx === 0"
                class="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                title="Subir unidad de servicio"
              >
                ▲
              </button>
              <button
                type="button"
                @click="moverServicio(srvIdx, 1)"
                :disabled="disabled || srvIdx === localServicios.length - 1"
                class="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                title="Bajar unidad de servicio"
              >
                ▼
              </button>
            </div>

            <!-- Botón Eliminar Servicio Completo -->
            <button
              type="button"
              @click="eliminarServicio(srvIdx)"
              :disabled="disabled"
              class="px-2 py-1 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-30 cursor-pointer"
              title="Eliminar esta Unidad de Trabajo completa y sus ramas subordinadas"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- TREE TABLE DE RECURSOS (CAPA 2: NODO PRIMARIO + RAMAS HIJAS) -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs min-w-[920px]">
            <thead>
              <tr class="bg-black/30 border-b border-white/5 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                <th class="py-2 px-3 w-[150px]">Jerarquía / Rol</th>
                <th class="py-2 px-3 w-[170px]">Categoría</th>
                <th class="py-2 px-3 w-[160px]">Subcategoría</th>
                <th class="py-2 px-3 min-w-[240px]">Descripción del Recurso / Ítem *</th>
                <th class="py-2 px-3 w-[140px]">Modalidad / Unidad</th>
                <th class="py-2 px-3 text-center w-[150px]">Magnitud / Cantidades</th>
                <th class="py-2 px-3 text-right w-[110px]">Tarifa Unitaria</th>
                <th class="py-2 px-3 text-right w-[110px]">Subtotal</th>
                <th class="py-2 px-3 text-center w-[40px]"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <!-- FILA RAÍZ: RECURSO PRIMARIO (NODO RAÍZ) -->
              <tr class="bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <!-- Jerarquía / Rol -->
                <td class="py-2 px-3 font-mono">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                      Primario
                    </span>
                  </div>
                </td>

                <!-- Categoría -->
                <td class="py-2 px-3">
                  <select
                    v-model="servicio.primario.tipo"
                    @change="onTipoPrimarioChange(servicio)"
                    :disabled="disabled"
                    class="w-full bg-[#0a0f1e] border rounded px-2 py-1 text-xs text-white outline-none transition-colors"
                    :class="!servicio.primario.tipo ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                  >
                    <option value="" class="bg-[#0a0f1e] text-slate-400">-- Seleccionar * --</option>
                    <option
                      v-for="cat in dbCategories"
                      :key="cat.id_categoria"
                      :value="cat.nombre_categoria"
                      class="bg-[#0a0f1e] text-white"
                    >
                      {{ cat.nombre_categoria }}
                    </option>
                  </select>
                </td>

                <!-- Subcategoría -->
                <td class="py-2 px-3">
                  <select
                    v-model="servicio.primario.subcategoria"
                    @change="onSubcategoriaPrimarioChange(servicio)"
                    :disabled="disabled"
                    class="w-full bg-[#0a0f1e] border rounded px-2 py-1 text-xs text-white outline-none transition-colors"
                    :class="!servicio.primario.subcategoria ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                  >
                    <option value="" class="bg-[#0a0f1e] text-slate-400">-- Seleccionar * --</option>
                    <option
                      v-for="sub in getSubcategoriesForType(servicio.primario.tipo, servicio.primario)"
                      :key="sub.id_subcategoria"
                      :value="sub.nombre_subcategoria"
                      class="bg-[#0a0f1e] text-white"
                    >
                      {{ sub.nombre_subcategoria }}
                    </option>
                  </select>
                </td>

                <!-- Descripción -->
                <td class="py-2 px-3">
                  <input
                    type="text"
                    v-model="servicio.primario.descripcion"
                    @input="onFieldChange"
                    :disabled="disabled"
                    placeholder="Descripción obligatoria del servicio principal..."
                    class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none transition-colors"
                    :class="!servicio.primario.descripcion ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10'"
                    maxlength="250"
                  />
                </td>

                <!-- Unidad de Cobro -->
                <td class="py-2 px-3">
                  <select
                    v-model="servicio.primario.unidad"
                    @change="onUnidadChange(servicio.primario)"
                    :disabled="disabled"
                    class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500"
                  >
                    <template v-if="servicio.primario.tipo === 'TRASLADOS'">
                      <option value="TRASLADO IDA" class="bg-[#0a0f1e] text-white">TRASLADO IDA</option>
                      <option value="TRASLADO RETORNO" class="bg-[#0a0f1e] text-white">TRASLADO RETORNO</option>
                      <option value="TRASLADO IDA/VUELTA" class="bg-[#0a0f1e] text-white">TRASLADO IDA/VUELTA</option>
                      <option value="Traslado" class="bg-[#0a0f1e] text-white">Traslado (Estándar)</option>
                    </template>
                    <template v-else>
                      <option value="Horas Diarias Minimas" class="bg-[#0a0f1e] text-white">Horas Diarias Minimas</option>
                      <option value="Horas Mes Minimas" class="bg-[#0a0f1e] text-white">Horas Mes Minimas</option>
                      <option value="Traslado" class="bg-[#0a0f1e] text-white">Traslado</option>
                      <option value="Valor Fijo" class="bg-[#0a0f1e] text-white">Valor Fijo</option>
                    </template>
                  </select>
                </td>

                <!-- Cantidades / Magnitud -->
                <td class="py-2 px-3">
                  <!-- Horas Diarias Mínimas -->
                  <div v-if="servicio.primario.unidad === 'Horas Diarias Minimas'" class="flex items-center justify-center gap-1 bg-slate-900/60 p-1 rounded border border-white/5">
                    <span class="text-[9px] text-slate-400 font-mono">D:</span>
                    <input
                      type="number"
                      v-model.number="servicio.primario.cantidad_dias"
                      @input="onDiasInput(servicio.primario)"
                      :disabled="disabled"
                      min="1"
                      max="30"
                      class="w-10 bg-[#0a0f1e] border rounded px-1 py-0.5 text-center text-xs text-white font-mono"
                      :class="(servicio.primario.cantidad_dias < 1 || servicio.primario.cantidad_dias > 30) ? 'border-red-500 text-red-300' : 'border-white/10'"
                      title="Días (1-30)"
                    />
                    <span class="text-[9px] text-amber-400 font-mono">H:</span>
                    <input
                      type="number"
                      v-model.number="servicio.primario.cantidad_horas"
                      @input="onHorasInput(servicio.primario)"
                      :disabled="disabled"
                      min="1"
                      max="24"
                      step="0.5"
                      class="w-12 bg-[#0a0f1e] border rounded px-1 py-0.5 text-center text-xs text-amber-300 font-mono"
                      :class="(servicio.primario.cantidad_horas < 1 || servicio.primario.cantidad_horas > 24) ? 'border-red-500 text-red-300' : 'border-amber-500/40'"
                      title="Horas Diarias (1-24)"
                    />
                  </div>

                  <!-- Horas Mes Mínimas -->
                  <div v-else-if="servicio.primario.unidad === 'Horas Mes Minimas' || servicio.primario.unidad === 'Horas Mensuales Minimas'" class="flex items-center justify-center gap-1 bg-slate-900/60 p-1 rounded border border-white/5">
                    <span class="text-[9px] text-slate-400 font-mono">M:</span>
                    <input
                      type="number"
                      v-model.number="servicio.primario.cantidad_meses"
                      @input="onMesesInput(servicio.primario)"
                      :disabled="disabled"
                      min="1"
                      class="w-10 bg-[#0a0f1e] border rounded px-1 py-0.5 text-center text-xs text-white font-mono"
                      :class="servicio.primario.cantidad_meses < 1 ? 'border-red-500 text-red-300' : 'border-white/10'"
                      title="Meses (>= 1)"
                    />
                    <span class="text-[9px] text-amber-400 font-mono">H:</span>
                    <input
                      type="number"
                      v-model.number="servicio.primario.cantidad_horas"
                      @input="onHorasInput(servicio.primario)"
                      :disabled="disabled"
                      min="2"
                      class="w-14 bg-[#0a0f1e] border rounded px-1 py-0.5 text-center text-xs text-amber-300 font-mono"
                      :class="servicio.primario.cantidad_horas <= 1 ? 'border-red-500 text-red-300' : 'border-amber-500/40'"
                      title="Horas Mensuales (Piso Mínimo)"
                    />
                  </div>

                  <!-- Valor Fijo / Traslados (SPEC-128: Cobro Único) -->
                  <div v-else-if="servicio.primario.unidad === 'Valor Fijo' || servicio.primario.tipo === 'TRASLADOS' || String(servicio.primario.unidad || '').startsWith('TRASLADO')" class="text-center py-1 bg-slate-900/40 rounded border border-white/5">
                    <span class="text-[10px] text-amber-400 font-mono font-bold uppercase">Cobro Único</span>
                  </div>

                  <!-- Traslado / Cantidad -->
                  <div v-else class="flex items-center justify-center gap-1 bg-slate-900/60 p-1 rounded border border-white/5">
                    <span class="text-[9px] text-slate-400 font-mono">Cant:</span>
                    <input
                      type="number"
                      v-model.number="servicio.primario.cantidad"
                      @input="onFieldChange"
                      :disabled="disabled"
                      min="1"
                      class="w-12 bg-[#0a0f1e] border rounded px-1 py-0.5 text-center text-xs text-white font-mono"
                      :class="servicio.primario.cantidad < 1 ? 'border-red-500 text-red-300' : 'border-white/10'"
                      title="Cantidad"
                    />
                  </div>
                </td>

                <!-- Tarifa Unitaria -->
                <td class="py-2 px-3">
                  <div class="relative flex items-center">
                    <span class="absolute left-1.5 text-slate-500 text-xs font-mono pointer-events-none">$</span>
                    <input
                      type="text"
                      :value="formatMiles(servicio.primario.valor_unitario)"
                      @input="onValorUnitarioInput($event, servicio.primario)"
                      :disabled="disabled"
                      placeholder="0"
                      class="w-full bg-[#0a0f1e] border border-white/10 focus:border-amber-500 rounded pl-4 pr-1.5 py-1 text-right text-xs text-amber-300 font-mono font-bold outline-none"
                    />
                  </div>
                </td>

                <!-- Subtotal -->
                <td class="py-2 px-3 text-right font-mono font-bold text-amber-400">
                  {{ formatMoneda(servicio.primario.subtotal) }}
                </td>

                <!-- Acción (Bloqueado para Primario) -->
                <td class="py-2 px-3 text-center text-slate-600" title="El recurso primario define la unidad y no se elimina independientemente">
                  🔒
                </td>
              </tr>

              <!-- FILAS HIJAS: RAMAS SUBORDINADAS (CAPA 2: HIJOS CONECTADOS) -->
              <tr
                v-for="(rama, rIdx) in servicio.ramas"
                :key="rama.id_linea || rIdx"
                class="hover:bg-white/[0.02] transition-colors"
              >
                <!-- Jerarquía / Conector Tipográfico + Rol -->
                <td class="py-2 px-3 font-mono">
                  <div class="flex items-center gap-1.5">
                    <!-- Conector tipográfico de árbol: ├── para intermedias y └── para la última -->
                    <span class="text-slate-500 font-bold select-none text-xs">
                      {{ rIdx === servicio.ramas.length - 1 ? '└──' : '├──' }}
                    </span>
                    <span
                      class="px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase font-mono"
                      :class="getRolBadgeClass(rama.rol_arbol)"
                    >
                      {{ rama.rol_arbol }}
                    </span>
                  </div>
                </td>

                <!-- Categoría -->
                <td class="py-2 px-3">
                  <select
                    v-model="rama.tipo"
                    @change="onTipoRamaChange(rama)"
                    :disabled="disabled"
                    class="w-full bg-[#0a0f1e] border rounded px-2 py-1 text-xs text-white outline-none transition-colors"
                    :class="!rama.tipo ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                  >
                    <option value="" class="bg-[#0a0f1e] text-slate-400">-- Categoría * --</option>
                    <option
                      v-for="cat in dbCategories"
                      :key="cat.id_categoria"
                      :value="cat.nombre_categoria"
                      class="bg-[#0a0f1e] text-white"
                    >
                      {{ cat.nombre_categoria }}
                    </option>
                  </select>
                </td>

                <!-- Subcategoría -->
                <td class="py-2 px-3">
                  <select
                    v-model="rama.subcategoria"
                    @change="onFieldChange"
                    :disabled="disabled"
                    class="w-full bg-[#0a0f1e] border rounded px-2 py-1 text-xs text-white outline-none transition-colors"
                    :class="!rama.subcategoria ? 'border-red-500/80 bg-red-500/10 text-red-300' : 'border-white/10 focus:border-amber-500'"
                  >
                    <option value="" class="bg-[#0a0f1e] text-slate-400">-- Subcategoría * --</option>
                    <option
                      v-for="sub in getSubcategoriesForType(rama.tipo, rama)"
                      :key="sub.id_subcategoria"
                      :value="sub.nombre_subcategoria"
                      class="bg-[#0a0f1e] text-white"
                    >
                      {{ sub.nombre_subcategoria }}
                    </option>
                  </select>
                </td>

                <!-- Descripción -->
                <td class="py-2 px-3">
                  <input
                    type="text"
                    v-model="rama.descripcion"
                    @input="onFieldChange"
                    :disabled="disabled"
                    placeholder="Descripción obligatoria de la rama..."
                    class="w-full bg-[#0a0f1e] border rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none transition-colors"
                    :class="!rama.descripcion ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10'"
                    maxlength="250"
                  />
                </td>

                <!-- Unidad de Cobro -->
                <td class="py-2 px-3">
                  <select
                    v-model="rama.unidad"
                    @change="onUnidadChange(rama)"
                    :disabled="disabled"
                    class="w-full bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500"
                  >
                    <template v-if="rama.tipo === 'TRASLADOS'">
                      <option value="TRASLADO IDA" class="bg-[#0a0f1e] text-white">TRASLADO IDA</option>
                      <option value="TRASLADO RETORNO" class="bg-[#0a0f1e] text-white">TRASLADO RETORNO</option>
                      <option value="TRASLADO IDA/VUELTA" class="bg-[#0a0f1e] text-white">TRASLADO IDA/VUELTA</option>
                      <option value="Traslado" class="bg-[#0a0f1e] text-white">Traslado (Estándar)</option>
                    </template>
                    <template v-else>
                      <option value="Horas Diarias Minimas" class="bg-[#0a0f1e] text-white">Horas Diarias Minimas</option>
                      <option value="Horas Mes Minimas" class="bg-[#0a0f1e] text-white">Horas Mes Minimas</option>
                      <option value="Traslado" class="bg-[#0a0f1e] text-white">Traslado</option>
                      <option value="Valor Fijo" class="bg-[#0a0f1e] text-white">Valor Fijo</option>
                    </template>
                  </select>
                </td>

                <!-- Cantidades / Magnitud -->
                <td class="py-2 px-3">
                  <!-- Horas Diarias Mínimas -->
                  <div v-if="rama.unidad === 'Horas Diarias Minimas'" class="flex items-center justify-center gap-1 bg-slate-900/60 p-1 rounded border border-white/5">
                    <span class="text-[9px] text-slate-400 font-mono">D:</span>
                    <input
                      type="number"
                      v-model.number="rama.cantidad_dias"
                      @input="onDiasInput(rama)"
                      :disabled="disabled"
                      min="1"
                      max="30"
                      class="w-10 bg-[#0a0f1e] border rounded px-1 py-0.5 text-center text-xs text-white font-mono"
                      :class="(rama.cantidad_dias < 1 || rama.cantidad_dias > 30) ? 'border-red-500 text-red-300' : 'border-white/10'"
                      title="Días (1-30)"
                    />
                    <span class="text-[9px] text-amber-400 font-mono">H:</span>
                    <input
                      type="number"
                      v-model.number="rama.cantidad_horas"
                      @input="onHorasInput(rama)"
                      :disabled="disabled"
                      min="1"
                      max="24"
                      step="0.5"
                      class="w-12 bg-[#0a0f1e] border rounded px-1 py-0.5 text-center text-xs text-amber-300 font-mono"
                      :class="(rama.cantidad_horas < 1 || rama.cantidad_horas > 24) ? 'border-red-500 text-red-300' : 'border-amber-500/40'"
                      title="Horas Diarias (1-24)"
                    />
                  </div>

                  <!-- Horas Mes Mínimas -->
                  <div v-else-if="rama.unidad === 'Horas Mes Minimas' || rama.unidad === 'Horas Mensuales Minimas'" class="flex items-center justify-center gap-1 bg-slate-900/60 p-1 rounded border border-white/5">
                    <span class="text-[9px] text-slate-400 font-mono">M:</span>
                    <input
                      type="number"
                      v-model.number="rama.cantidad_meses"
                      @input="onMesesInput(rama)"
                      :disabled="disabled"
                      min="1"
                      class="w-10 bg-[#0a0f1e] border rounded px-1 py-0.5 text-center text-xs text-white font-mono"
                      :class="rama.cantidad_meses < 1 ? 'border-red-500 text-red-300' : 'border-white/10'"
                      title="Meses (>= 1)"
                    />
                    <span class="text-[9px] text-amber-400 font-mono">H:</span>
                    <input
                      type="number"
                      v-model.number="rama.cantidad_horas"
                      @input="onHorasInput(rama)"
                      :disabled="disabled"
                      min="2"
                      class="w-14 bg-[#0a0f1e] border rounded px-1 py-0.5 text-center text-xs text-amber-300 font-mono"
                      :class="rama.cantidad_horas <= 1 ? 'border-red-500 text-red-300' : 'border-amber-500/40'"
                      title="Horas Mensuales"
                    />
                  </div>

                  <!-- Valor Fijo / Traslados (SPEC-128: Cobro Único) -->
                  <div v-else-if="rama.unidad === 'Valor Fijo' || rama.tipo === 'TRASLADOS' || String(rama.unidad || '').startsWith('TRASLADO')" class="text-center py-1 bg-slate-900/40 rounded border border-white/5">
                    <span class="text-[10px] text-amber-400 font-mono font-bold uppercase">Cobro Único</span>
                  </div>

                  <!-- Traslado / Cantidad -->
                  <div v-else class="flex items-center justify-center gap-1 bg-slate-900/60 p-1 rounded border border-white/5">
                    <span class="text-[9px] text-slate-400 font-mono">Cant:</span>
                    <input
                      type="number"
                      v-model.number="rama.cantidad"
                      @input="onFieldChange"
                      :disabled="disabled"
                      min="1"
                      class="w-12 bg-[#0a0f1e] border rounded px-1 py-0.5 text-center text-xs text-white font-mono"
                      :class="rama.cantidad < 1 ? 'border-red-500 text-red-300' : 'border-white/10'"
                      title="Cantidad"
                    />
                  </div>
                </td>

                <!-- Tarifa Unitaria -->
                <td class="py-2 px-3">
                  <div class="relative flex items-center">
                    <span class="absolute left-1.5 text-slate-500 text-xs font-mono pointer-events-none">$</span>
                    <input
                      type="text"
                      :value="formatMiles(rama.valor_unitario)"
                      @input="onValorUnitarioInput($event, rama)"
                      :disabled="disabled"
                      placeholder="0"
                      class="w-full bg-[#0a0f1e] border border-white/10 focus:border-amber-500 rounded pl-4 pr-1.5 py-1 text-right text-xs text-amber-300 font-mono font-bold outline-none"
                    />
                  </div>
                </td>

                <!-- Subtotal -->
                <td class="py-2 px-3 text-right font-mono font-bold text-amber-400">
                  {{ formatMoneda(rama.subtotal) }}
                </td>

                <!-- Acción: Podar Rama -->
                <td class="py-2 px-3 text-center">
                  <button
                    type="button"
                    @click="eliminarRama(servicio, rIdx)"
                    :disabled="disabled"
                    class="text-slate-500 hover:text-red-400 disabled:opacity-30 transition-colors p-1"
                    title="Podar / Eliminar esta rama subordinada"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- BARRA CONTEXTUAL DE RAMAS DIRECTAS POR LÍNEA DE SERVICIO -->
        <div class="px-3.5 py-2 bg-[#070b16] border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] uppercase font-bold text-slate-400 font-mono mr-1">Ramas directas:</span>

            <!-- BOTONES SEGÚN LÍNEA: TRANSPORTE -->
            <template v-if="servicio.linea_servicio === 'TRANSPORTE'">
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'CAMIONETA_ESCOLTA')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-blue-300 text-[11px] font-bold border border-blue-500/20 hover:border-blue-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Camioneta Escolta
              </button>
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'CONDUCTOR_ADICIONAL')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-blue-300 text-[11px] font-bold border border-blue-500/20 hover:border-blue-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Conductor Adicional
              </button>
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'RAMPLA_EXTRA')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-blue-300 text-[11px] font-bold border border-blue-500/20 hover:border-blue-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Rampla / Flete Extra
              </button>
            </template>

            <!-- BOTONES SEGÚN LÍNEA: RENTAL -->
            <template v-else-if="servicio.linea_servicio === 'RENTAL'">
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'FLETE_ENTREGA')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-purple-300 text-[11px] font-bold border border-purple-500/20 hover:border-purple-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Flete de Entrega
              </button>
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'FLETE_RETIRO')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-purple-300 text-[11px] font-bold border border-purple-500/20 hover:border-purple-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Flete de Retiro
              </button>
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'OPERADOR_FAENA')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-purple-300 text-[11px] font-bold border border-purple-500/20 hover:border-purple-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Operador en Faena
              </button>
            </template>

            <!-- BOTONES SEGÚN LÍNEA: PROFESIONAL -->
            <template v-else-if="servicio.linea_servicio === 'PROFESIONAL'">
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'VIATICO_ALOJAMIENTO')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-teal-300 text-[11px] font-bold border border-teal-500/20 hover:border-teal-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Viático Alojamiento
              </button>
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'VIATICO_ALIMENTACION')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-teal-300 text-[11px] font-bold border border-teal-500/20 hover:border-teal-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Viático Alimentación
              </button>
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'TRASLADO_PERSONAL')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-teal-300 text-[11px] font-bold border border-teal-500/20 hover:border-teal-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Traslado de Personal
              </button>
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'PLAN_RIGGING')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-teal-300 text-[11px] font-bold border border-teal-500/20 hover:border-teal-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Plan de Rigging / Memoria
              </button>
            </template>

            <!-- BOTONES SEGÚN LÍNEA: IZAJE -->
            <template v-else-if="servicio.linea_servicio === 'IZAJE'">
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'APOYO_CONTRAPESOS')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-300 text-[11px] font-bold border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Equipo de Apoyo (Contrapesos)
              </button>
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'TRASLADO_GRUA')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-300 text-[11px] font-bold border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Traslado Grúa
              </button>
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'PERSONAL_RIGGER')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-300 text-[11px] font-bold border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Personal / Rigger
              </button>
              <button
                type="button"
                @click="agregarRamaContextual(servicio, 'BALANCIN')"
                :disabled="disabled"
                class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-300 text-[11px] font-bold border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                + Balancín / Canastillo
              </button>
            </template>

            <!-- RAMA PERSONALIZADA LIBRE -->
            <button
              type="button"
              @click="agregarRamaGenerica(servicio)"
              :disabled="disabled"
              class="px-2 py-1 rounded bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-white/10 hover:border-white/20 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 ml-1"
              title="Añadir otra rama o recurso auxiliar libre"
            >
              + Otra Rama
            </button>
          </div>

          <span class="text-[10px] text-slate-500 font-mono">
            Ramas activas: {{ servicio.ramas.length }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

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
  }
})

const emit = defineEmits(['update:lines', 'update:servicios'])

// Estado local de servicios en árbol
const localServicios = ref([])
const isInternalSyncing = ref(false)

// Helper de ID único
const genId = (prefix = 'lin') => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

// Helper de Moneda
const formatMoneda = (val) => {
  if (typeof props.formatCurrency === 'function') {
    return props.formatCurrency(val)
  }
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0)
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

// Cálculo determinista del subtotal de una línea
const calcularSubtotalLinea = (line) => {
  if (!line) return 0
  const val = Number(line.valor_unitario !== undefined ? line.valor_unitario : line.valorUnitario) || 0
  const unidad = String(line.unidad || '').toUpperCase()
  const tipo = String(line.tipo || '').toUpperCase()
  if (unidad.includes('FIJO') || unidad.includes('ALZADA') || tipo.includes('FIJO') || tipo === 'TRASLADOS' || unidad.startsWith('TRASLADO')) {
    return val
  }
  if (line.unidad === 'Horas Diarias Minimas') {
    const dias = Number(line.cantidad_dias !== undefined && line.cantidad_dias !== null ? line.cantidad_dias : line.cantidad) || 1
    const horas = Number(line.cantidad_horas !== undefined && line.cantidad_horas !== null ? line.cantidad_horas : line.pisoMinimo) || 8
    return dias * horas * val
  }
  if (line.unidad === 'Horas Mes Minimas' || line.unidad === 'Horas Mensuales Minimas') {
    const meses = Number(line.cantidad_meses !== undefined && line.cantidad_meses !== null ? line.cantidad_meses : line.cantidad) || 1
    const horas = Number(line.cantidad_horas !== undefined && line.cantidad_horas !== null ? line.cantidad_horas : line.pisoMinimo) || 180
    return meses * horas * val
  }
  const cant = Number(line.cantidad) || 1
  return cant * val
}

// Subtotal total del árbol
const totalNetoServicios = computed(() => {
  return localServicios.value.reduce((acc, s) => acc + (s.subtotal_servicio || 0), 0)
})

// Total de ítems planos sincronizados
const totalItemsPlanos = computed(() => {
  return localServicios.value.reduce((acc, s) => acc + 1 + (s.ramas?.length || 0), 0)
})

// Obtener subcategorías para un tipo dado (con tramos de grúas canónicos 40T a 400T)
const getSubcategoriesForType = (type, line = null) => {
  if (!type) return []
  const normType = String(type).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
  const category = (props.dbCategories || []).find(c => {
    const normCat = String(c.nombre_categoria).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
    return normCat === normType || c.nombre_categoria === type
  })
  let subs = category ? [...(category.subcategories || [])] : []

  if (normType === 'GRUAS TELESCOPICAS') {
    const TONELAJES_CANONICOS = [
      40, 50, 55, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 
      150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 
      260, 270, 280, 290, 300, 320, 350, 400
    ]
    const subGruasMap = new Map()
    TONELAJES_CANONICOS.forEach((ton, i) => {
      const nombre = `GRUA ${ton} TON`
      subGruasMap.set(nombre, { id_subcategoria: 4000 + i, nombre_subcategoria: nombre, tonelaje_num: ton })
    })
    subs.forEach(s => {
      const tonMatch = (s.nombre_subcategoria || '').match(/(\d+)/)
      const ton = tonMatch ? parseInt(tonMatch[1], 10) : 0
      if (!subGruasMap.has(s.nombre_subcategoria)) {
        subGruasMap.set(s.nombre_subcategoria, { ...s, tonelaje_num: ton })
      }
    })
    if (line?.subcategoria && !subGruasMap.has(line.subcategoria)) {
      const tonMatch = line.subcategoria.match(/(\d+)/)
      subGruasMap.set(line.subcategoria, { id_subcategoria: 9997, nombre_subcategoria: line.subcategoria, tonelaje_num: tonMatch ? parseInt(tonMatch[1], 10) : 0 })
    }
    subs = Array.from(subGruasMap.values()).sort((a, b) => a.tonelaje_num - b.tonelaje_num)
  }

  if (normType === 'TRASLADOS') {
    if (line?.subcategoria && !subs.some(s => s.nombre_subcategoria === line.subcategoria)) {
      subs.unshift({ id_subcategoria: 9998, nombre_subcategoria: line.subcategoria })
    }
  }

  return subs
}

// Clases visuales según línea de servicio
const getLineaBadgeClass = (linea) => {
  switch (linea) {
    case 'TRANSPORTE': return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    case 'RENTAL':     return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    case 'PROFESIONAL':return 'bg-teal-500/20 text-teal-300 border-teal-500/40'
    case 'IZAJE':      return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    default:           return 'bg-slate-700 text-slate-300 border-slate-600'
  }
}

const getLineaBorderClass = (linea) => {
  switch (linea) {
    case 'TRANSPORTE': return 'border-blue-500/30'
    case 'RENTAL':     return 'border-purple-500/30'
    case 'PROFESIONAL': return 'border-teal-500/30'
    case 'IZAJE':      return 'border-amber-500/30'
    default:           return 'border-white/10'
  }
}

const getRolBadgeClass = (rol) => {
  switch (rol) {
    case 'PRIMARIO':  return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    case 'APOYO':     return 'bg-sky-500/20 text-sky-300 border-sky-500/40'
    case 'TRASLADO':  return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
    case 'PERSONAL':  return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    case 'ACCESORIO': return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    default:          return 'bg-slate-800 text-slate-300 border-white/10'
  }
}

// Handlers de cambio en campos
const onFieldChange = () => {
  sincronizarYProyectar()
}

const onValorUnitarioInput = (e, item) => {
  const raw = e.target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  item.valor_unitario = num
  item.valorUnitario = num
  e.target.value = num > 0 ? new Intl.NumberFormat('es-CL').format(num) : ''
  sincronizarYProyectar()
}

const onDiasInput = (item) => {
  item.cantidad = item.cantidad_dias
  sincronizarYProyectar()
}

const onHorasInput = (item) => {
  item.pisoMinimo = item.cantidad_horas
  sincronizarYProyectar()
}

const onMesesInput = (item) => {
  item.cantidad = item.cantidad_meses
  sincronizarYProyectar()
}

const onUnidadChange = (item) => {
  if (!item) return
  if (item.unidad === 'Valor Fijo') {
    item.cantidad = 1
    item.cantidad_dias = null
    item.cantidad_meses = null
    item.cantidad_horas = null
    item.pisoMinimo = 0
  } else if (item.unidad === 'Horas Diarias Minimas') {
    if (!item.cantidad_dias || item.cantidad_dias < 1) item.cantidad_dias = 1
    if (!item.cantidad_horas || item.cantidad_horas < 1) item.cantidad_horas = 8
    item.cantidad = item.cantidad_dias
    item.pisoMinimo = item.cantidad_horas
  } else if (item.unidad === 'Horas Mes Minimas' || item.unidad === 'Horas Mensuales Minimas') {
    item.unidad = 'Horas Mes Minimas'
    if (!item.cantidad_meses || item.cantidad_meses < 1) item.cantidad_meses = 1
    if (!item.cantidad_horas || item.cantidad_horas < 2) item.cantidad_horas = 180
    item.cantidad = item.cantidad_meses
    item.pisoMinimo = item.cantidad_horas
  } else {
    if (!item.cantidad || item.cantidad < 1) item.cantidad = 1
    item.cantidad_dias = null
    item.cantidad_meses = null
    item.cantidad_horas = null
    item.pisoMinimo = 0
  }
  sincronizarYProyectar()
}

const onTipoPrimarioChange = (servicio) => {
  const p = servicio.primario
  const subs = getSubcategoriesForType(p.tipo, p)
  p.subcategoria = subs[0]?.nombre_subcategoria || ''
  if (!p.descripcion || p.descripcion.trim() === '') {
    p.descripcion = `Servicio de ${p.subcategoria || p.tipo}`
  }
  sincronizarYProyectar()
}

const onSubcategoriaPrimarioChange = (servicio) => {
  const p = servicio.primario
  if (!p.descripcion || p.descripcion.startsWith('Servicio de')) {
    p.descripcion = `Servicio de ${p.subcategoria}`
  }
  sincronizarYProyectar()
}

const onTipoRamaChange = (rama) => {
  const subs = getSubcategoriesForType(rama.tipo, rama)
  rama.subcategoria = subs[0]?.nombre_subcategoria || ''
  if (!rama.descripcion || rama.descripcion.trim() === '') {
    rama.descripcion = `${rama.subcategoria || rama.tipo}`
  }
  sincronizarYProyectar()
}

// Reordenar unidades de servicio
const moverServicio = (index, delta) => {
  const newIndex = index + delta
  if (newIndex < 0 || newIndex >= localServicios.value.length) return
  const item = localServicios.value.splice(index, 1)[0]
  localServicios.value.splice(newIndex, 0, item)
  sincronizarYProyectar()
}

// Eliminar unidad de servicio completa
const eliminarServicio = (index) => {
  const srv = localServicios.value[index]
  if (!srv) return
  const totalRamas = srv.ramas?.length || 0
  if (totalRamas > 0 || (srv.primario?.valor_unitario > 0)) {
    if (!confirm(`¿Eliminar la Unidad de Servicio "${srv.nombre_servicio}" y sus ${totalRamas} ramas subordinadas?`)) {
      return
    }
  }
  localServicios.value.splice(index, 1)
  sincronizarYProyectar()
}

// Eliminar rama individual
const eliminarRama = (servicio, ramaIndex) => {
  servicio.ramas.splice(ramaIndex, 1)
  sincronizarYProyectar()
}

// AGREGAR NUEVA UNIDAD DE SERVICIO (CAPA 1)
const agregarServicio = (linea) => {
  const idSrv = genId('srv')
  const idRoot = genId('lin_root')

  let tipoOt = 'OT-MANIOBRA'
  let nombreDefault = 'Servicio de Grúa e Izaje'
  let primarioDefault = {
    id_linea: idRoot,
    id_servicio: idSrv,
    id_padre: null,
    rol_arbol: 'PRIMARIO',
    linea_servicio: 'IZAJE',
    tipo_ot: 'OT-MANIOBRA',
    tipo: 'GRUAS TELESCOPICAS',
    subcategoria: 'GRUA 70 TON',
    descripcion: 'Servicio de izaje con grúa',
    unidad: 'Horas Diarias Minimas',
    cantidad_dias: 1,
    cantidad_horas: 8,
    cantidad_meses: null,
    cantidad: 1,
    pisoMinimo: 8,
    valor_unitario: 0,
    valorUnitario: 0,
    subtotal: 0
  }

  if (linea === 'TRANSPORTE') {
    tipoOt = 'OT-FLETE'
    nombreDefault = 'Servicio de Transporte y Flete'
    primarioDefault = {
      ...primarioDefault,
      linea_servicio: 'TRANSPORTE',
      tipo_ot: 'OT-FLETE',
      tipo: 'CAMIONES',
      subcategoria: 'CAMION RAMPLA',
      descripcion: 'Servicio de transporte y flete de carga',
      unidad: 'Valor Fijo',
      cantidad: 1,
      cantidad_dias: null,
      cantidad_horas: null,
      cantidad_meses: null,
      pisoMinimo: 0
    }
  } else if (linea === 'RENTAL') {
    tipoOt = 'OT-RENTAL'
    nombreDefault = 'Arriendo Mensual de Equipos (Rental)'
    primarioDefault = {
      ...primarioDefault,
      linea_servicio: 'RENTAL',
      tipo_ot: 'OT-RENTAL',
      tipo: 'GRUA HORQUILLA',
      subcategoria: 'GRUA HORQUILLA 3.5 TON',
      descripcion: 'Arriendo mensual de equipo en faena',
      unidad: 'Horas Mes Minimas',
      cantidad_meses: 1,
      cantidad_horas: 180,
      cantidad: 1,
      pisoMinimo: 180,
      cantidad_dias: null
    }
  } else if (linea === 'PROFESIONAL') {
    tipoOt = 'OT-STAFF'
    nombreDefault = 'Dotación de Personal Especializado'
    primarioDefault = {
      ...primarioDefault,
      linea_servicio: 'PROFESIONAL',
      tipo_ot: 'OT-STAFF',
      tipo: 'PERSONAL CERTIFICADO',
      subcategoria: 'RIGGER',
      descripcion: 'Servicio de Rigger Certificado de Maniobra',
      unidad: 'Horas Diarias Minimas',
      cantidad_dias: 1,
      cantidad_horas: 8,
      cantidad_meses: null,
      cantidad: 1,
      pisoMinimo: 8
    }
  }

  const nuevoServicio = {
    id_servicio: idSrv,
    linea_servicio: linea,
    tipo_ot: tipoOt,
    nombre_servicio: nombreDefault,
    primario: primarioDefault,
    ramas: [],
    subtotal_servicio: 0
  }

  localServicios.value.push(nuevoServicio)
  sincronizarYProyectar()
}

// AGREGAR RAMAS CONTEXTUALES SEGÚN RECETA
const agregarRamaContextual = (servicio, receta) => {
  const idRama = genId('lin_rama')
  const idPadre = servicio.primario?.id_linea || null

  let nuevaRama = {
    id_linea: idRama,
    id_servicio: servicio.id_servicio,
    id_padre: idPadre,
    rol_arbol: 'APOYO',
    linea_servicio: servicio.linea_servicio,
    tipo_ot: servicio.tipo_ot,
    tipo: 'OTROS',
    subcategoria: '',
    descripcion: '',
    unidad: 'Valor Fijo',
    cantidad_dias: null,
    cantidad_horas: null,
    cantidad_meses: null,
    cantidad: 1,
    pisoMinimo: 0,
    valor_unitario: 0,
    valorUnitario: 0,
    subtotal: 0
  }

  switch (receta) {
    // TRANSPORTE
    case 'CAMIONETA_ESCOLTA':
      nuevaRama.rol_arbol = 'APOYO'
      nuevaRama.tipo = 'VEHICULOS LIVIANOS'
      nuevaRama.subcategoria = 'CAMIONETA'
      nuevaRama.descripcion = 'Camioneta Escolta de Transporte'
      nuevaRama.unidad = 'Valor Fijo'
      nuevaRama.cantidad = 1
      break
    case 'CONDUCTOR_ADICIONAL':
      nuevaRama.rol_arbol = 'PERSONAL'
      nuevaRama.tipo = 'PERSONAL CERTIFICADO'
      nuevaRama.subcategoria = 'CONDUCTOR'
      nuevaRama.descripcion = 'Segundo Conductor / Relevo en Ruta'
      nuevaRama.unidad = 'Valor Fijo'
      nuevaRama.cantidad = 1
      break
    case 'RAMPLA_EXTRA':
      nuevaRama.rol_arbol = 'TRASLADO'
      nuevaRama.tipo = 'CAMIONES'
      nuevaRama.subcategoria = 'CAMION RAMPLA'
      nuevaRama.descripcion = 'Rampla Adicional de Transporte'
      nuevaRama.unidad = 'Traslado'
      nuevaRama.cantidad = 1
      break

    // RENTAL
    case 'FLETE_ENTREGA':
      nuevaRama.rol_arbol = 'TRASLADO'
      nuevaRama.tipo = 'TRASLADOS'
      nuevaRama.subcategoria = 'MOVILIZACIÓN GRÚA'
      nuevaRama.descripcion = 'Flete de Entrega en Obra (Día 1)'
      nuevaRama.unidad = 'TRASLADO IDA'
      nuevaRama.cantidad = 1
      break
    case 'FLETE_RETIRO':
      nuevaRama.rol_arbol = 'TRASLADO'
      nuevaRama.tipo = 'TRASLADOS'
      nuevaRama.subcategoria = 'MOVILIZACIÓN GRÚA'
      nuevaRama.descripcion = 'Flete de Retiro desde Obra'
      nuevaRama.unidad = 'TRASLADO RETORNO'
      nuevaRama.cantidad = 1
      break
    case 'OPERADOR_FAENA':
      nuevaRama.rol_arbol = 'PERSONAL'
      nuevaRama.tipo = 'PERSONAL CERTIFICADO'
      nuevaRama.subcategoria = 'OPERADOR'
      nuevaRama.descripcion = 'Operador de Maquinaria en Faena'
      nuevaRama.unidad = 'Horas Mes Minimas'
      nuevaRama.cantidad_meses = 1
      nuevaRama.cantidad_horas = 180
      nuevaRama.cantidad = 1
      nuevaRama.pisoMinimo = 180
      break

    // PROFESIONAL
    case 'VIATICO_ALOJAMIENTO':
      nuevaRama.rol_arbol = 'APOYO'
      nuevaRama.tipo = 'OTROS'
      nuevaRama.subcategoria = 'VIATICO ALOJAMIENTO'
      nuevaRama.descripcion = 'Viático de Alojamiento por Persona'
      nuevaRama.unidad = 'Valor Fijo'
      nuevaRama.cantidad = 1
      break
    case 'VIATICO_ALIMENTACION':
      nuevaRama.rol_arbol = 'APOYO'
      nuevaRama.tipo = 'OTROS'
      nuevaRama.subcategoria = 'VIATICO ALIMENTACION'
      nuevaRama.descripcion = 'Viático de Alimentación por Persona'
      nuevaRama.unidad = 'Valor Fijo'
      nuevaRama.cantidad = 1
      break
    case 'TRASLADO_PERSONAL':
      nuevaRama.rol_arbol = 'TRASLADO'
      nuevaRama.tipo = 'TRASLADOS'
      nuevaRama.subcategoria = 'TRASLADO PERSONAL'
      nuevaRama.descripcion = 'Movilización y Traslado de Personal'
      nuevaRama.unidad = 'Traslado'
      nuevaRama.cantidad = 1
      break
    case 'PLAN_RIGGING':
      nuevaRama.rol_arbol = 'APOYO'
      nuevaRama.tipo = 'OTROS'
      nuevaRama.subcategoria = 'ESTUDIO RIGGING'
      nuevaRama.descripcion = 'Plan de Rigging y Memoria de Cálculo'
      nuevaRama.unidad = 'Valor Fijo'
      nuevaRama.cantidad = 1
      break

    // IZAJE
    case 'APOYO_CONTRAPESOS':
      nuevaRama.rol_arbol = 'APOYO'
      nuevaRama.tipo = 'CAMIONES'
      nuevaRama.subcategoria = 'CAMION RAMPLA'
      nuevaRama.descripcion = 'Camión Rampla para Transporte de Contrapesos'
      nuevaRama.unidad = 'Traslado'
      nuevaRama.cantidad = 1
      break
    case 'TRASLADO_GRUA':
      nuevaRama.rol_arbol = 'TRASLADO'
      nuevaRama.tipo = 'TRASLADOS'
      nuevaRama.subcategoria = 'MOVILIZACIÓN GRÚA'
      nuevaRama.descripcion = 'Movilización Grúa (Ida y Vuelta)'
      nuevaRama.unidad = 'TRASLADO IDA/VUELTA'
      nuevaRama.cantidad = 1
      break
    case 'PERSONAL_RIGGER':
      nuevaRama.rol_arbol = 'PERSONAL'
      nuevaRama.tipo = 'PERSONAL CERTIFICADO'
      nuevaRama.subcategoria = 'RIGGER'
      nuevaRama.descripcion = 'Rigger Certificado de Maniobra'
      nuevaRama.unidad = 'Horas Diarias Minimas'
      nuevaRama.cantidad_dias = 1
      nuevaRama.cantidad_horas = 8
      nuevaRama.cantidad = 1
      nuevaRama.pisoMinimo = 8
      break
    case 'BALANCIN':
      nuevaRama.rol_arbol = 'ACCESORIO'
      nuevaRama.tipo = 'ACCESORIOS'
      nuevaRama.subcategoria = 'BALANCIN'
      nuevaRama.descripcion = 'Balancín de Carga / Canastillo Certificado'
      nuevaRama.unidad = 'Valor Fijo'
      nuevaRama.cantidad = 1
      break

    default:
      nuevaRama.descripcion = 'Recurso Auxiliar'
      break
  }

  servicio.ramas.push(nuevaRama)
  sincronizarYProyectar()
}

// AGREGAR RAMA GENÉRICA LIBRE
const agregarRamaGenerica = (servicio) => {
  const idRama = genId('lin_rama')
  const idPadre = servicio.primario?.id_linea || null
  const nuevaRama = {
    id_linea: idRama,
    id_servicio: servicio.id_servicio,
    id_padre: idPadre,
    rol_arbol: 'APOYO',
    linea_servicio: servicio.linea_servicio,
    tipo_ot: servicio.tipo_ot,
    tipo: 'ACCESORIOS',
    subcategoria: '',
    descripcion: '',
    unidad: 'Valor Fijo',
    cantidad_dias: null,
    cantidad_horas: null,
    cantidad_meses: null,
    cantidad: 1,
    pisoMinimo: 0,
    valor_unitario: 0,
    valorUnitario: 0,
    subtotal: 0
  }
  servicio.ramas.push(nuevaRama)
  sincronizarYProyectar()
}

// DUAL-WRITE: SINCRONIZACIÓN Y PROYECCIÓN APLANADA HACIA `lines`
const sincronizarYProyectar = () => {
  isInternalSyncing.value = true
  const flatLines = []

  localServicios.value.forEach(srv => {
    let subtotalSrv = 0

    // 1. Proyectar Nodo Primario
    if (srv.primario) {
      srv.primario.id_linea = srv.primario.id_linea || genId('lin_root')
      srv.primario.id_servicio = srv.id_servicio
      srv.primario.id_padre = null
      srv.primario.rol_arbol = 'PRIMARIO'
      srv.primario.linea_servicio = srv.linea_servicio
      srv.primario.tipo_ot = srv.tipo_ot
      srv.primario.valor_unitario = Number(srv.primario.valor_unitario || srv.primario.valorUnitario) || 0
      srv.primario.valorUnitario = srv.primario.valor_unitario
      srv.primario.subtotal = calcularSubtotalLinea(srv.primario)
      subtotalSrv += srv.primario.subtotal

      flatLines.push({ ...srv.primario })
    }

    // 2. Proyectar Ramas Subordinadas
    if (Array.isArray(srv.ramas)) {
      srv.ramas.forEach(rama => {
        rama.id_linea = rama.id_linea || genId('lin_rama')
        rama.id_servicio = srv.id_servicio
        rama.id_padre = srv.primario?.id_linea || null
        rama.linea_servicio = srv.linea_servicio
        rama.tipo_ot = srv.tipo_ot
        rama.valor_unitario = Number(rama.valor_unitario || rama.valorUnitario) || 0
        rama.valorUnitario = rama.valor_unitario
        rama.subtotal = calcularSubtotalLinea(rama)
        subtotalSrv += rama.subtotal

        flatLines.push({ ...rama })
      })
    }

    srv.subtotal_servicio = subtotalSrv
  })

  // Emitir dual-write
  emit('update:lines', flatLines)
  emit('update:servicios', JSON.parse(JSON.stringify(localServicios.value)))

  // Liberar el flag tras un tick
  setTimeout(() => {
    isInternalSyncing.value = false
  }, 10)
}

// HELPERS DE CLASIFICACIÓN HEURÍSTICA (SECCIÓN 26.5)
const isPersonalLine = (l) => {
  if (!l) return false
  const tipo = (l.tipo || l.categoria || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const sub = (l.subcategoria || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  if (tipo === 'PERSONAL CERTIFICADO' || tipo === 'PERSONAL' || tipo.includes('PERSONAL')) return true
  if (tipo !== '') return false
  return sub === 'RIGGER' || sub === 'PREVENCIONISTA' || sub === 'OPERADOR' || sub === 'SUPERVISOR'
}

const isTrasladoLine = (l) => {
  if (!l) return false
  const tipo = (l.tipo || l.categoria || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const unidad = (l.unidad || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  return tipo === 'TRASLADOS' || tipo === 'TRASLADO' || tipo.includes('TRASLADO') || tipo.includes('FLETE') ||
         unidad.includes('TRASLADO') || unidad === 'FLETE' || unidad === 'VIAJE'
}

const clasificarLineaServicio = (l) => {
  if (!l) return 'IZAJE'
  const unidad = (l.unidad || '').toUpperCase()
  const tipo = (l.tipo || '').toUpperCase()
  const sub = (l.subcategoria || '').toUpperCase()

  if (unidad.includes('MES')) return 'RENTAL'
  if (tipo === 'CAMIONES' && (sub.includes('CAMA BAJA') || sub.includes('RAMPLA') || unidad.includes('TRASLADO'))) {
    return 'TRANSPORTE'
  }
  return 'IZAJE'
}

const resolverTipoOT = (linea) => {
  switch (linea) {
    case 'TRANSPORTE': return 'OT-FLETE'
    case 'RENTAL':     return 'OT-RENTAL'
    case 'PROFESIONAL':return 'OT-STAFF'
    case 'IZAJE':      return 'OT-MANIOBRA'
    default:           return 'OT-MANIOBRA'
  }
}

// HIDRATADOR RETROCOMPATIBLE (SECCIÓN 26.5)
const hidratarArbolDesdeLineasPlanas = (lineasPlanas) => {
  if (!Array.isArray(lineasPlanas) || lineasPlanas.length === 0) return []

  // Paso 1: Si ya vienen con id_servicio e id_padre / rol_arbol
  const tieneEstructuraArbol = lineasPlanas.some(l => l.id_servicio && (l.rol_arbol === 'PRIMARIO' || l.id_padre))
  if (tieneEstructuraArbol) {
    const serviciosMap = new Map()

    lineasPlanas.forEach(l => {
      const idSrv = l.id_servicio || `srv_${l.id_linea || Math.random().toString(36).substring(2, 7)}`
      if (!serviciosMap.has(idSrv)) {
        const lineaSrv = l.linea_servicio || clasificarLineaServicio(l)
        serviciosMap.set(idSrv, {
          id_servicio: idSrv,
          linea_servicio: lineaSrv,
          tipo_ot: l.tipo_ot || resolverTipoOT(lineaSrv),
          nombre_servicio: l.descripcion || l.subcategoria || `Servicio de ${lineaSrv}`,
          primario: null,
          ramas: [],
          subtotal_servicio: 0
        })
      }
      const srv = serviciosMap.get(idSrv)
      const itemClon = {
        ...l,
        valor_unitario: Number(l.valor_unitario !== undefined ? l.valor_unitario : l.valorUnitario) || 0,
        valorUnitario: Number(l.valor_unitario !== undefined ? l.valor_unitario : l.valorUnitario) || 0,
        subtotal: calcularSubtotalLinea(l)
      }

      if (l.rol_arbol === 'PRIMARIO' || (!l.id_padre && !srv.primario)) {
        itemClon.rol_arbol = 'PRIMARIO'
        itemClon.id_padre = null
        srv.primario = itemClon
      } else {
        itemClon.rol_arbol = itemClon.rol_arbol || (isPersonalLine(l) ? 'PERSONAL' : isTrasladoLine(l) ? 'TRASLADO' : 'APOYO')
        srv.ramas.push(itemClon)
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

  // Paso 2: Legado puro sin id_servicio (Opción A: Agrupación simple sin adivinanza)
  const idSrv = `srv_legacy_${Date.now()}`
  const raiz = lineasPlanas[0]
  const lineaDetectada = clasificarLineaServicio(raiz)
  const tipoOtDetectado = resolverTipoOT(lineaDetectada)

  const servicioUnico = {
    id_servicio: idSrv,
    linea_servicio: lineaDetectada,
    tipo_ot: tipoOtDetectado,
    nombre_servicio: 'Unidad de Trabajo General (Formato Clásico)',
    primario: {
      ...raiz,
      id_linea: raiz.id_linea || `lin_${Date.now()}_root`,
      id_servicio: idSrv,
      id_padre: null,
      rol_arbol: 'PRIMARIO',
      linea_servicio: lineaDetectada,
      tipo_ot: tipoOtDetectado,
      valor_unitario: Number(raiz.valor_unitario !== undefined ? raiz.valor_unitario : raiz.valorUnitario) || 0,
      valorUnitario: Number(raiz.valor_unitario !== undefined ? raiz.valor_unitario : raiz.valorUnitario) || 0,
      subtotal: calcularSubtotalLinea(raiz)
    },
    ramas: [],
    subtotal_servicio: calcularSubtotalLinea(raiz)
  }

  lineasPlanas.slice(1).forEach((l, idx) => {
    const esPersonal = isPersonalLine(l)
    const esTraslado = isTrasladoLine(l)
    const esAccesorio = (l.tipo || '').toUpperCase() === 'ACCESORIOS'
    let rol = 'APOYO'
    if (esPersonal) rol = 'PERSONAL'
    else if (esTraslado) rol = 'TRASLADO'
    else if (esAccesorio) rol = 'ACCESORIO'

    servicioUnico.ramas.push({
      ...l,
      id_linea: l.id_linea || `lin_${Date.now()}_${idx + 1}_rama`,
      id_servicio: idSrv,
      id_padre: servicioUnico.primario.id_linea,
      rol_arbol: rol,
      linea_servicio: lineaDetectada,
      tipo_ot: tipoOtDetectado,
      valor_unitario: Number(l.valor_unitario !== undefined ? l.valor_unitario : l.valorUnitario) || 0,
      valorUnitario: Number(l.valor_unitario !== undefined ? l.valor_unitario : l.valorUnitario) || 0,
      subtotal: calcularSubtotalLinea(l)
    })
  })

  servicioUnico.subtotal_servicio = (servicioUnico.primario?.subtotal || 0) +
    servicioUnico.ramas.reduce((acc, r) => acc + (r.subtotal || 0), 0)

  return [servicioUnico]
}

// Carga e inicialización reactiva
const cargarArbol = () => {
  if (Array.isArray(props.servicios) && props.servicios.length > 0) {
    localServicios.value = JSON.parse(JSON.stringify(props.servicios))
    // Recalcular subtotales
    localServicios.value.forEach(s => {
      if (s.primario) s.primario.subtotal = calcularSubtotalLinea(s.primario)
      if (Array.isArray(s.ramas)) {
        s.ramas.forEach(r => { r.subtotal = calcularSubtotalLinea(r) })
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
  // Si localServicios está vacío pero entraron líneas, hidratar
  if ((!localServicios.value || localServicios.value.length === 0) && Array.isArray(newLines) && newLines.length > 0) {
    localServicios.value = hidratarArbolDesdeLineasPlanas(newLines)
  }
}, { deep: true })

onMounted(() => {
  cargarArbol()
})

defineExpose({
  localServicios,
  hidratarArbolDesdeLineasPlanas,
  sincronizarYProyectar
})
</script>
