<template>
  <div class="space-y-4 pb-10 text-slate-200 select-none">

    <!-- =================================================================== -->
    <!-- FILA 1: LOS 5 INDICADORES FINANCIEROS (SIMETRÍA 1:1 CON GRÁFICO)    -->
    <!-- =================================================================== -->
    <section class="grid grid-cols-1 md:grid-cols-5 gap-3">
      <!-- 1. COMPROMETIDO -->
      <div class="bg-[#0f1629] border border-white/10 rounded-xl p-3.5 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">1. Comprometido (Ganadas)</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
            {{ procesosFiltradosPeriodo.length }} OTs
          </span>
        </div>
        <div class="text-xl font-black font-mono text-white mt-1.5">{{ fmtCLP(kpisCalculados.comprometido_neto) }}</div>
        <div class="flex items-center justify-between mt-2 text-[10px] text-slate-400">
          <span>{{ kpisCalculados.con_oc_count }} con OC/Exenta · {{ kpisCalculados.sin_oc_count }} falta OC</span>
          <span class="font-mono text-blue-400 font-bold">Base 100%</span>
        </div>
        <div class="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
          <div class="h-full bg-blue-500 w-full"></div>
        </div>
      </div>

      <!-- 2. DEVENGADO (REPORTS) -->
      <div class="bg-[#0f1629] border border-cyan-500/25 rounded-xl p-3.5 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">2. Devengado (Reports)</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            {{ kpisCalculados.devengado_reports }} Rep · {{ kpisCalculados.devengado_horas }}h
          </span>
        </div>
        <div class="text-xl font-black font-mono text-cyan-300 mt-1.5">{{ fmtCLP(kpisCalculados.devengado_neto) }}</div>
        <div class="flex items-center justify-between mt-2 text-[10px] text-slate-400">
          <span>{{ pctSobreBase(kpisCalculados.devengado_neto) }}% ejecutado en terreno</span>
          <span class="font-mono text-cyan-300 font-bold">Avance Real</span>
        </div>
        <div class="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
          <div class="h-full bg-cyan-400 transition-all duration-300" :style="{ width: Math.min(100, pctSobreBase(kpisCalculados.devengado_neto)) + '%' }"></div>
        </div>
      </div>

      <!-- 3. CERRADO EN ITS -->
      <div class="bg-[#0f1629] border border-indigo-500/25 rounded-xl p-3.5 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300">3. Cerrado en ITS</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {{ kpisCalculados.cerrado_its_count }} ITS
          </span>
        </div>
        <div class="text-xl font-black font-mono text-indigo-300 mt-1.5">{{ fmtCLP(kpisCalculados.cerrado_its_neto) }}</div>
        <div class="flex items-center justify-between mt-2 text-[10px] text-slate-400">
          <span>Costos ITS: <strong class="text-slate-200 font-mono">{{ fmtCLP(kpisCalculados.cerrado_its_costos) }}</strong></span>
          <span class="font-mono text-emerald-400 font-bold">Mg {{ kpisCalculados.margen_its_global }}%</span>
        </div>
        <div class="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
          <div class="h-full bg-indigo-400 transition-all duration-300" :style="{ width: Math.min(100, pctSobreBase(kpisCalculados.cerrado_its_neto)) + '%' }"></div>
        </div>
      </div>

      <!-- 4. EMITIDO EN EDP (FE) -->
      <div class="bg-[#0f1629] border border-amber-500/30 rounded-xl p-3.5 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">4. Emitido en EDP (FE)</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {{ kpisCalculados.emitido_edp_count }} EDP
          </span>
        </div>
        <div class="text-xl font-black font-mono text-amber-300 mt-1.5">{{ fmtCLP(kpisCalculados.emitido_edp_neto) }}</div>
        <div class="flex items-center justify-between mt-2 text-[10px]">
          <span class="text-emerald-400 font-bold">
            🟢 {{ kpisCalculados.listos_facturar_count }} Listos Facturar ({{ fmtCLP(kpisCalculados.listos_facturar_neto) }})
          </span>
        </div>
        <div class="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
          <div class="h-full bg-amber-400 transition-all duration-300" :style="{ width: Math.min(100, pctSobreBase(kpisCalculados.emitido_edp_neto)) + '%' }"></div>
        </div>
      </div>

      <!-- 5. FACTURADO DTE -->
      <div class="bg-[#0f1629] border border-emerald-500/30 rounded-xl p-3.5 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">5. Facturado DTE (SII)</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {{ kpisCalculados.facturado_count }} DTE
          </span>
        </div>
        <div class="text-xl font-black font-mono text-emerald-400 mt-1.5">{{ fmtCLP(kpisCalculados.facturado_neto) }}</div>
        <div class="flex items-center justify-between mt-2 text-[10px] text-slate-400">
          <span>Brecha por Facturar: <strong class="text-amber-300 font-mono">{{ fmtCLP(kpisCalculados.brecha_por_facturar_neto) }}</strong></span>
        </div>
        <div class="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
          <div class="h-full bg-emerald-500 transition-all duration-300" :style="{ width: Math.min(100, pctSobreBase(kpisCalculados.facturado_neto)) + '%' }"></div>
        </div>
      </div>
    </section>

    <!-- =================================================================== -->
    <!-- FILA 2: GRÁFICO BI FULL-WIDTH (6 MESES MENSUAL / MES SEMANAL)       -->
    <!-- =================================================================== -->
    <div class="bg-[#0f1629] border border-white/5 rounded-xl p-4">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h3 class="text-xs font-black uppercase tracking-wider text-white">
              {{ dimensionGrafico === '6meses'
                ? 'Comparativa de las 5 Variables Financieras — Últimos 6 Meses (Agrupado Mensual)'
                : `Comparativa de las 5 Variables Financieras — ${labelMesActivo} (Agrupado Semanal)`
              }}
            </h3>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {{ dimensionGrafico === '6meses' ? 'Haz clic en cualquier mes para desglosar sus semanas' : 'Evolución semanal dentro del periodo seleccionado' }}
            </span>
          </div>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Simetría 1 a 1 con los indicadores superiores:
            <span class="text-blue-400 font-semibold">1. Comprometido</span> ·
            <span class="text-cyan-300 font-semibold">2. Devengado Reports</span> ·
            <span class="text-indigo-300 font-semibold">3. Cerrado ITS</span> ·
            <span class="text-amber-300 font-semibold">4. Emitido EDP</span> ·
            <span class="text-emerald-400 font-semibold">5. Facturado DTE</span>
          </p>
        </div>

        <!-- Controles de Periodo y las 2 Dimensiones Temporales del Gráfico -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1.5 bg-[#070b14] px-2.5 py-1 rounded-lg border border-white/10 text-xs">
            <span class="text-[10px] font-mono text-slate-400 uppercase">Periodo:</span>
            <select
              v-model="mesFiltroActivo"
              class="bg-[#070b14] text-amber-400 font-mono font-bold text-xs outline-none cursor-pointer"
            >
              <option value="ALL_6M">Todos los Periodos (6 Meses)</option>
              <option v-for="m in opcionesMesesDisponibles" :key="m.key" :value="m.key">
                {{ m.label }}
              </option>
            </select>
          </div>

          <div class="flex items-center bg-[#070b14] p-1 rounded-lg border border-white/10 text-xs gap-1">
            <button
              @click="dimensionGrafico = '6meses'"
              :class="dimensionGrafico === '6meses' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1 rounded font-bold transition-all cursor-pointer"
            >
              📅 1. Últimos 6 Meses (Mensual)
            </button>
            <button
              @click="dimensionGrafico = 'semanal'"
              :class="dimensionGrafico === 'semanal' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1 rounded font-bold transition-all cursor-pointer"
            >
              📆 2. Mes en Curso (Semanal)
            </button>
          </div>

          <button
            @click="cargarDatos"
            :disabled="cargando"
            class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 cursor-pointer transition-colors"
            title="Sincronizar datos desde BD"
          >
            {{ cargando ? '⏳...' : '🔄' }}
          </button>
        </div>
      </div>

      <!-- Lienzo del Gráfico de Columnas Agrupadas (5 Series) -->
      <div class="relative pt-4 pb-2 px-2">
        <!-- Líneas guía horizontales -->
        <div class="h-56 flex items-end justify-around gap-3 border-b border-slate-800 relative">
          <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div v-for="tick in 4" :key="tick" class="border-b border-white/[0.04] w-full flex items-center">
              <span class="text-[9px] font-mono text-slate-600 -mt-3">
                {{ fmtMillones(maxValorGrafico * ((5 - tick) / 4)) }}
              </span>
            </div>
          </div>

          <!-- Grupos de 5 Columnas por Categoría (Mes o Semana) -->
          <div
            v-for="(grupo, gIdx) in seriesGraficoActual"
            :key="gIdx"
            @click="onClickGrupoGrafico(grupo)"
            class="relative group flex-1 flex flex-col items-center h-full justify-end z-10 cursor-pointer px-1 hover:bg-white/[0.02] rounded-t-lg transition-colors"
          >
            <div class="flex items-end justify-center gap-1 sm:gap-1.5 w-full h-48 px-1">
              <!-- 1. Comprometido -->
              <div
                class="w-3 sm:w-4 rounded-t-[4px] bg-[#3b82f6] transition-all duration-300 group-hover:brightness-110"
                :style="{ height: calcAlturaBarra(grupo.comprometido, maxValorGrafico, 180) + 'px' }"
              ></div>
              <!-- 2. Devengado -->
              <div
                class="w-3 sm:w-4 rounded-t-[4px] bg-[#22d3ee] transition-all duration-300 group-hover:brightness-110"
                :style="{ height: calcAlturaBarra(grupo.devengado, maxValorGrafico, 180) + 'px' }"
              ></div>
              <!-- 3. Cerrado ITS -->
              <div
                class="w-3 sm:w-4 rounded-t-[4px] bg-[#818cf8] transition-all duration-300 group-hover:brightness-110"
                :style="{ height: calcAlturaBarra(grupo.its, maxValorGrafico, 180) + 'px' }"
              ></div>
              <!-- 4. Emitido EDP -->
              <div
                class="w-3 sm:w-4 rounded-t-[4px] bg-[#fbbf24] transition-all duration-300 group-hover:brightness-110"
                :style="{ height: calcAlturaBarra(grupo.edp, maxValorGrafico, 180) + 'px' }"
              ></div>
              <!-- 5. Facturado DTE -->
              <div
                class="w-3 sm:w-4 rounded-t-[4px] bg-[#10b981] transition-all duration-300 group-hover:brightness-110"
                :style="{ height: calcAlturaBarra(grupo.facturado, maxValorGrafico, 180) + 'px' }"
              ></div>
            </div>

            <!-- Tooltip Flotante al pasar el mouse -->
            <div class="hidden group-hover:block absolute bottom-full mb-2 z-40 w-64 bg-[#070b14] border border-slate-700 rounded-lg p-3 shadow-2xl text-[11px] font-mono pointer-events-none">
              <div class="font-bold text-white mb-1.5 border-b border-white/10 pb-1 flex justify-between">
                <span>{{ grupo.label }}</span>
                <span class="text-slate-400">{{ grupo.count }} OTs</span>
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-slate-300">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#3b82f6]"></span>Comprometido:</span>
                  <strong class="text-white">{{ fmtCLP(grupo.comprometido) }}</strong>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#22d3ee]"></span>Devengado Reports:</span>
                  <strong class="text-white">{{ fmtCLP(grupo.devengado) }}</strong>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#818cf8]"></span>Cerrado ITS:</span>
                  <strong class="text-white">{{ fmtCLP(grupo.its) }}</strong>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#fbbf24]"></span>Emitido EDP (FE):</span>
                  <strong class="text-white">{{ fmtCLP(grupo.edp) }}</strong>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#10b981]"></span>Facturado DTE:</span>
                  <strong class="text-white">{{ fmtCLP(grupo.facturado) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Etiquetas Eje X -->
        <div class="flex items-center justify-around gap-3 pt-2">
          <div
            v-for="(grupo, gIdx) in seriesGraficoActual"
            :key="'lbl-' + gIdx"
            class="flex-1 text-center font-mono text-[11px] font-semibold text-slate-300"
          >
            {{ grupo.corto }}
          </div>
        </div>

        <!-- Leyenda Inferior -->
        <div class="flex flex-wrap items-center justify-center gap-5 mt-3 pt-2 border-t border-white/5 text-[11px] font-semibold text-slate-300">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>1. Comprometido (Cotización)</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#22d3ee]"></span>2. Devengado (Reports)</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#818cf8]"></span>3. Cerrado en ITS</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#fbbf24]"></span>4. Emitido en EDP (FE)</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>5. Facturado DTE</span>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- FILA 3: BARRA DE LOS 5 SUBMENÚS OPERATIVOS + FILTROS + EXCEL        -->
    <!-- =================================================================== -->
    <div class="bg-[#0f1629] border border-white/5 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3">
      <!-- 5 Submenús -->
      <div class="flex flex-wrap items-center bg-[#070b14] p-1 rounded-lg border border-white/10 gap-1">
        <button
          @click="submenuActivo = 'procesos'"
          :class="submenuActivo === 'procesos' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>1. Avance y Calce por Proceso</span>
          <span class="px-1.5 py-0.2 rounded bg-black/30 font-mono text-[10px]">{{ procesosFiltradosTabla.length }}</span>
        </button>

        <button
          @click="submenuActivo = 'operadores'"
          :class="submenuActivo === 'operadores' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>2. Horas Operadores / Riggers</span>
          <span class="px-1.5 py-0.2 rounded bg-white/5 font-mono text-[10px]">{{ jornadasPersonalFiltradas.length }}</span>
        </button>

        <button
          @click="submenuActivo = 'equipos'"
          :class="submenuActivo === 'equipos' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>3. Ventas por Grúa / Equipo</span>
          <span class="px-1.5 py-0.2 rounded bg-white/5 font-mono text-[10px]">{{ equiposFiltrados.length }}</span>
        </button>

        <button
          @click="submenuActivo = 'combustible'"
          :class="submenuActivo === 'combustible' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>4. Combustible y Rendimientos</span>
          <span class="px-1.5 py-0.2 rounded bg-white/5 font-mono text-[10px]">{{ cargasCombustibleFiltradas.length }}</span>
        </button>

        <button
          @click="submenuActivo = 'bodega'"
          :class="submenuActivo === 'bodega' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>5. Salidas de Bodega (C. Costos)</span>
          <span class="px-1.5 py-0.2 rounded bg-white/5 font-mono text-[10px]">{{ salidasBodegaFiltradas.length }}</span>
        </button>

        <button
          @click="submenuActivo = 'rh'"
          :class="submenuActivo === 'rh' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-amber-300 hover:text-white'"
          class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>6. RH</span>
          <span class="px-1.5 py-0.2 rounded bg-black/30 font-mono text-[10px]">{{ anexosRhFiltrados.length }}</span>
        </button>
      </div>

      <!-- Filtros rápidos documentales + Buscador + Exportar Excel -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Pestañas de Trabajo por Tarea (Task Buckets) con Contadores Dinámicos -->
        <div v-if="submenuActivo === 'procesos'" class="flex items-center bg-[#070b14] p-1 rounded-lg border border-white/10 text-[11px] gap-1 flex-wrap">
          <button
            @click="filtroEstadoDoc = 'LISTO_FACTURAR'"
            :class="filtroEstadoDoc === 'LISTO_FACTURAR' ? 'bg-emerald-600 text-white font-black shadow-md' : 'text-emerald-400 hover:bg-white/5 font-semibold'"
            class="px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5"
            title="OTs con EDP visado listas para emitir Factura DTE"
          >
            <span>🟢 Por Facturar</span>
            <span class="px-1.5 py-0.2 rounded-full bg-black/40 font-mono text-[10px]">{{ countPorFacturar }}</span>
          </button>
          <button
            @click="filtroEstadoDoc = 'FALTA_OC'"
            :class="filtroEstadoDoc === 'FALTA_OC' ? 'bg-orange-600 text-white font-black shadow-md' : 'text-orange-300 hover:bg-white/5 font-semibold'"
            class="px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5"
            title="OTs retenidas que requieren Orden de Compra que debe cargar Comercial"
          >
            <span>⏳ Retenidas por OC</span>
            <span class="px-1.5 py-0.2 rounded-full bg-black/40 font-mono text-[10px]">{{ countFaltaOc }}</span>
          </button>
          <button
            @click="filtroEstadoDoc = 'FACTURADO'"
            :class="filtroEstadoDoc === 'FACTURADO' ? 'bg-blue-600 text-white font-black shadow-md' : 'text-blue-300 hover:bg-white/5 font-semibold'"
            class="px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5"
            title="OTs con DTE emitido en el SII"
          >
            <span>✅ Facturadas</span>
            <span class="px-1.5 py-0.2 rounded-full bg-black/40 font-mono text-[10px]">{{ countFacturado }}</span>
          </button>
          <button
            @click="filtroEstadoDoc = 'TODOS'; filtroBandejaContable = 'TODAS'"
            :class="filtroEstadoDoc === 'TODOS' ? 'bg-slate-700 text-white font-black shadow-md' : 'text-slate-300 hover:bg-white/5'"
            class="px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5"
            title="Cartera completa del periodo sin filtros"
          >
            <span>🌐 Todas las OTs</span>
            <span class="px-1.5 py-0.2 rounded-full bg-black/40 font-mono text-[10px]">{{ procesosFiltradosPeriodo.length }}</span>
          </button>
        </div>

        <div class="relative">
          <span class="absolute left-2.5 top-1.5 text-xs text-slate-500">🔍</span>
          <input
            v-model="busquedaTexto"
            type="text"
            placeholder="Buscar OT, cliente, OC, folio DTE..."
            class="bg-[#070b14] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56"
          />
        </div>

        <button
          @click="exportarExcelActivo"
          class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span>📥</span>
          <span>Exportar Excel (.xlsx)</span>
        </button>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- SUBMENÚ 1: TABLA DE AVANCE, CALCE Y MINI-GRÁFICO DE 5 BARRAS POR OT -->
    <!-- =================================================================== -->
    <section v-if="submenuActivo === 'procesos'" class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-lg">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#070b14] border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <th class="py-3 px-3.5">Proceso / Periodo / Mandante</th>
              <th class="py-3 px-3 text-right">1. Compromiso vs Operado<br/><span class="text-[9px] text-blue-400 font-normal">Cotización &amp; Reports Diarios</span></th>
              <th class="py-3 px-3 text-center">2. Respaldo Documental<br/><span class="text-[9px] text-indigo-400 font-normal">OC Mandante &bull; ITS &bull; Circuito FES</span></th>
              <th class="py-3 px-3 text-right">3. Saldo por Facturar<br/><span class="text-[9px] text-amber-400 font-normal">Neto Pendiente &bull; Desviación</span></th>
              <th class="py-3 px-3.5 text-center min-w-[220px] bg-slate-900/60 border-l border-white/10">
                <span class="text-emerald-400 font-extrabold">⚡ ACCIÓN REQUERIDA (1 CLIC)</span><br/>
                <span class="text-[9px] text-slate-400 font-normal">Call to Action de Contabilidad</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-if="procesosFiltradosTabla.length === 0">
              <td colspan="5" class="py-10 text-center text-slate-400 font-mono">
                No se encontraron procesos para los filtros seleccionados.
              </td>
            </tr>
            <tr
              v-for="p in procesosFiltradosTabla"
              :key="p.id_proyecto"
              class="hover:bg-white/[0.02] transition-colors align-top"
            >
              <!-- Columna 1: Datos del Proceso + Mini-Gráfico de 5 Barras -->
              <td class="py-3 px-3.5">
                <div class="flex items-center justify-between gap-4">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        @click="abrirPdfOficialCotizacion(p)"
                        class="font-mono font-bold text-amber-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                        title="Abrir PDF Oficial de la Cotización Comercial"
                      >
                        {{ p.codi_proyecto }} ↗
                      </span>
                      <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                        {{ obtenerEtiquetaSemana(p.fecha_inicio) }}
                      </span>
                    </div>
                    <div class="font-bold text-white mt-0.5 truncate max-w-xs">{{ p.cliente_nombre }}</div>
                    <div class="text-[11px] text-slate-400 truncate max-w-xs">{{ p.obra_nombre }}</div>
                  </div>

                  <!-- MINI-GRÁFICO DE LAS 5 BARRAS VERTICALES DEL PROCESO -->
                  <div class="relative group flex flex-col items-center shrink-0 ml-2">
                    <div class="flex items-end gap-1.5 h-12 px-2.5 pt-1 bg-[#070b14]/70 rounded-t-lg border-x border-t border-white/5 border-b border-slate-700">
                      <div
                        :style="{ height: calcAlturaMiniBarra(p, p.monto_comprometido) + 'px' }"
                        class="w-3.5 rounded-t-[3px] bg-[#3b82f6] transition-all group-hover:brightness-110"
                      ></div>
                      <div
                        :style="{ height: calcAlturaMiniBarra(p, p.monto_devengado_reports) + 'px' }"
                        class="w-3.5 rounded-t-[3px] bg-[#22d3ee] transition-all group-hover:brightness-110"
                      ></div>
                      <div
                        :style="{ height: calcAlturaMiniBarra(p, p.monto_its_neto) + 'px' }"
                        :class="p.monto_its_neto > 0 ? 'bg-[#818cf8]' : 'bg-slate-800'"
                        class="w-3.5 rounded-t-[3px] transition-all group-hover:brightness-110"
                      ></div>
                      <div
                        :style="{ height: calcAlturaMiniBarra(p, p.monto_edp_neto) + 'px' }"
                        :class="p.monto_edp_neto > 0 ? 'bg-[#fbbf24]' : 'bg-slate-800'"
                        class="w-3.5 rounded-t-[3px] transition-all group-hover:brightness-110"
                      ></div>
                      <div
                        :style="{ height: calcAlturaMiniBarra(p, p.monto_facturado_neto) + 'px' }"
                        :class="p.monto_facturado_neto > 0 ? 'bg-[#10b981]' : 'bg-slate-800'"
                        class="w-3.5 rounded-t-[3px] transition-all group-hover:brightness-110"
                      ></div>
                    </div>

                    <!-- Tooltip flotante al pasar el mouse -->
                    <div class="hidden group-hover:block absolute left-full ml-2 top-1/2 -translate-y-1/2 z-40 w-60 bg-[#070b14] border border-slate-700 rounded-lg p-2.5 shadow-2xl text-[10px] font-mono pointer-events-none">
                      <div class="font-bold text-white mb-1 border-b border-white/10 pb-1">{{ p.codi_proyecto }}</div>
                      <div class="flex justify-between text-slate-300">
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#3b82f6]"></span>Comprometido:</span>
                        <strong class="text-white">{{ fmtCLP(p.monto_comprometido) }}</strong>
                      </div>
                      <div class="flex justify-between text-slate-300">
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#22d3ee]"></span>Devengado Reports:</span>
                        <strong class="text-white">{{ fmtCLP(p.monto_devengado_reports) }}</strong>
                      </div>
                      <div class="flex justify-between text-slate-300">
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#818cf8]"></span>Cerrado ITS:</span>
                        <strong class="text-white">{{ fmtCLP(p.monto_its_neto) }}</strong>
                      </div>
                      <div class="flex justify-between text-slate-300">
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#fbbf24]"></span>Emitido EDP:</span>
                        <strong class="text-white">{{ fmtCLP(p.monto_edp_neto) }}</strong>
                      </div>
                      <div class="flex justify-between text-slate-300">
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#10b981]"></span>Facturado DTE:</span>
                        <strong class="text-white">{{ fmtCLP(p.monto_facturado_neto) }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Columna 2: Compromiso vs Operado -->
              <td class="py-3 px-3 text-right font-mono">
                <div class="font-bold text-white" title="Monto Comprometido en Cotización">{{ fmtCLP(p.monto_comprometido) }}</div>
                <div class="text-[11px] text-cyan-300 font-semibold mt-0.5" title="Monto Devengado en Reports Diarios">
                  Dev: {{ fmtCLP(p.monto_devengado_reports) }}
                </div>
                <div class="text-[10px] text-slate-400">{{ p.horas_facturables }} hrs operadas</div>
                <div class="mt-1 flex items-center justify-end gap-1">
                  <button
                    v-if="p.total_reports === 1 && p.reports_lista && p.reports_lista.length === 1"
                    @click="abrirPdfReportIndividual(p.reports_lista[0].id_reporte_avance)"
                    class="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 transition-colors cursor-pointer flex items-center gap-1"
                    title="Abrir PDF Oficial del Report con Firma FES"
                  >
                    📋 Report PDF ↗
                  </button>
                  <button
                    v-else-if="p.total_reports > 0"
                    @click="abrirModalDoc('REPORTS', p)"
                    class="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 transition-colors cursor-pointer flex items-center gap-1"
                    title="Ver listado de reports para abrir sus PDFs individuales"
                  >
                    📋 {{ p.reports_validados }}/{{ p.total_reports }} Reports ↗
                  </button>
                  <span v-else class="text-[10px] text-slate-500">Sin reports</span>
                </div>
              </td>

              <!-- Columna 3: Respaldo Documental (OC Mandante, ITS, Expediente EDP, Firmas FES) -->
              <td class="py-3 px-3 text-center font-mono">
                <div class="flex flex-col items-center gap-1.5">
                  <!-- Fila 1: OC Mandante & ITS -->
                  <div class="flex items-center justify-center gap-1.5 flex-wrap">
                    <span
                      v-if="!p.requiere_oc_hes && !p.tiene_oc"
                      class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-white/5 select-none"
                      title="Servicio exento de OC / Facturación directa"
                    >
                      Exenta OC
                    </span>
                    <button
                      v-else-if="p.tiene_oc"
                      @click="abrirPdfOC(p)"
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-colors cursor-pointer"
                      title="Ver Orden de Compra del Cliente"
                    >
                      📎 {{ p.numero_oc || 'OC Mandante' }} ↗
                    </button>
                    <span
                      v-else
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 select-none"
                      :title="`Falta OC: El Ejecutivo Comercial (${p.vendedor_nombre || 'Comercial'}) debe cargar la Orden de Compra`"
                    >
                      ⚠️ Falta OC
                    </span>

                    <button
                      v-if="p.id_its"
                      @click="abrirPdfOficialIts(p)"
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors cursor-pointer flex items-center gap-1"
                      title="Abrir PDF Oficial de Término de Servicio (ITS)"
                    >
                      📊 {{ p.folio_its || `ITS-${p.id_its}` }} ↗
                    </button>
                    <span v-else class="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-600 bg-white/[0.02] border border-white/5">
                      S/ITS
                    </span>

                    <button
                      v-if="p.ocs_proveedor && p.ocs_proveedor.length > 0"
                      @click="abrirModalDoc('OC_PROV', p)"
                      class="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/15 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-colors cursor-pointer"
                      title="Ver Órdenes de Compra de Proveedores asociadas a la OT"
                    >
                      🛒 {{ p.ocs_proveedor.length }} OC Costo
                    </button>
                  </div>

                  <!-- Fila 2: Expediente EDP y Circuito FES (Control de Gestión + Contabilidad) -->
                  <div class="flex items-center justify-center gap-1 flex-wrap text-[9px]">
                    <button
                      @click="abrirPdfOficialEdp(p)"
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 transition-colors cursor-pointer flex items-center gap-1"
                      title="Abrir Expediente PDF Oficial de Estado de Pago con Firmas FES"
                    >
                      📑 EDP-{{ p.id_proyecto }} ↗
                    </button>
                    <span
                      @click="abrirModalDoc('FE', p)"
                      :class="p.firma_1_analista ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-white/5'"
                      class="px-1.5 py-0.2 rounded border cursor-pointer"
                      title="1° Control de Gestión (Yiara Mendoza)"
                    >
                      1°Ctl {{ p.firma_1_analista ? '✓' : '·' }}
                    </span>
                    <span
                      @click="abrirModalDoc('FE', p)"
                      :class="p.firma_2_contabilidad ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : (['OBSERVADO_CONTABILIDAD', 'DEVUELTO_CONTABILIDAD'].includes(p.edp_estado) ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-slate-800 text-slate-500 border-white/5')"
                      class="px-1.5 py-0.2 rounded border cursor-pointer"
                      title="2° Contabilidad y Facturación (Maritza Seguel)"
                    >
                      2°Conta {{ p.firma_2_contabilidad ? '✓' : (['OBSERVADO_CONTABILIDAD', 'DEVUELTO_CONTABILIDAD'].includes(p.edp_estado) ? '↩️' : '·') }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Columna 4: Saldo por Facturar & Desviación -->
              <td class="py-3 px-3 text-right font-mono">
                <div v-if="p.facturado && p.saldo_pendiente_facturar <= 0">
                  <div class="font-bold text-emerald-400">100% Facturado</div>
                  <div class="text-[10px] text-slate-400">{{ fmtCLP(p.monto_facturado_neto) }}</div>
                </div>
                <div v-else>
                  <div class="font-bold text-amber-300 text-sm">
                    {{ fmtCLP(p.saldo_pendiente_facturar) }}
                  </div>
                  <div class="text-[10px] text-slate-400">
                    {{ p.facturado ? `Facturado: ${fmtCLP(p.monto_facturado_neto)}` : 'Por facturar' }}
                  </div>
                </div>

                <div
                  class="text-[10px] font-mono mt-1"
                  :class="p.variacion_edp_vs_cotizado > 0 ? 'text-cyan-300 font-bold' : (p.variacion_edp_vs_cotizado < 0 ? 'text-amber-300' : 'text-slate-500')"
                >
                  {{ p.variacion_edp_vs_cotizado !== 0
                    ? (p.variacion_edp_vs_cotizado > 0 ? '+' : '') + fmtCLP(p.variacion_edp_vs_cotizado) + ` (${p.variacion_pct}%)`
                    : '$0 Desviación'
                  }}
                </div>
              </td>

              <!-- Columna 5: ACCIÓN REQUERIDA (1 CLIC) - PRIMARY CALL TO ACTION -->
              <td class="py-3 px-3.5 bg-slate-900/40 border-l border-white/5 align-middle">
                <!-- Caso 1: Listo para Facturar (Acción Primaria Verde Esmeralda Sólida) -->
                <div
                  v-if="p.habilitado_facturar && (!p.facturado || p.saldo_pendiente_facturar > 0)"
                  class="space-y-1.5"
                >
                  <button
                    @click="abrirModalDoc('DTE', p)"
                    class="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-950/70 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Subir y asociar Factura PDF oficial (Laudus / SII)"
                  >
                    <span>🧾</span>
                    <span>Cargar Factura Laudus ({{ fmtCLP(p.saldo_pendiente_facturar) }})</span>
                  </button>
                  <button
                    @click="$emit('abrir-edp', p)"
                    class="w-full py-1 px-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Abrir Carátula EDP para subir factura, firmar Hito 2 o devolver con observaciones a Yiara"
                  >
                    <span>🔏</span>
                    <span>Firmar / Devolver EDP</span>
                  </button>
                </div>

                <!-- Caso 3: Esperando OC que debe subir Comercial (Bloqueo Informativo para Contabilidad) -->
                <div
                  v-else-if="p.requiere_oc_hes && !p.tiene_oc && !p.facturado"
                  class="w-full py-2 px-2.5 rounded-lg bg-orange-950/40 text-orange-400 border border-orange-500/30 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 text-center select-none"
                  :title="`Facturación retenida: El Ejecutivo Comercial (${p.vendedor_nombre || 'Comercial'}) debe cargar la Orden de Compra para habilitar la emisión de factura.`"
                >
                  <span>⏳</span>
                  <span>Bloqueado: Falta OC (Comercial)</span>
                </div>

                <!-- Caso 4: 100% Facturado Conforme -->
                <div
                  v-else-if="p.facturado && p.saldo_pendiente_facturar <= 0"
                  class="space-y-1.5"
                >
                  <button
                    @click="abrirPdfFacturaDirecto(p)"
                    class="w-full py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Abrir PDF oficial de la Factura en pestaña nueva"
                  >
                    <span>📄</span>
                    <span>Ver Factura DTE #{{ p.factura_numero || 'Emitido' }} ↗</span>
                  </button>
                  <button
                    v-if="p.firma_1_analista && !p.firma_2_contabilidad"
                    @click="$emit('abrir-edp', p)"
                    class="w-full py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer shadow"
                    title="Certificar subida de factura con Firma FES de Contabilidad"
                  >
                    <span>🔏</span>
                    <span>Firmar Subida Factura (FES)</span>
                  </button>
                </div>

                <!-- Caso 5: En Faena / Conciliación Reports -->
                <div v-else class="text-center py-1">
                  <span class="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-white/5 inline-flex items-center gap-1">
                    <span>⏱️</span>
                    <span>En Faena / Conciliación</span>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- =================================================================== -->
    <!-- SUBMENÚ 2: REPORTE DE HORAS DE OPERADORES / RIGGERS                 -->
    <!-- (Estructura Homologada con Horas Operadores.xlsx + ITS Validado)    -->
    <!-- =================================================================== -->
    <section v-if="submenuActivo === 'operadores'" class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-lg">
      <div class="p-3 border-b border-white/5 bg-[#0a0f1e]/50 flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1 bg-[#070b14] p-1 rounded-lg border border-white/10 text-xs">
            <button
              @click="vistaPersonal = 'detalle'"
              :class="vistaPersonal === 'detalle' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1 rounded font-bold cursor-pointer"
            >
              Sábana Horas Operadores.xlsx ({{ jornadasPersonalFiltradas.length }} jornadas)
            </button>
            <button
              @click="vistaPersonal = 'resumen'"
              :class="vistaPersonal === 'resumen' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1 rounded font-bold cursor-pointer"
            >
              Consolidado por Trabajador ({{ trabajadoresFiltrados.length }})
            </button>
          </div>

          <div class="flex items-center gap-1.5 bg-[#070b14] px-2.5 py-1 rounded-lg border border-white/10 text-xs">
            <span class="text-[10px] font-mono text-slate-400 uppercase">Trabajador:</span>
            <select
              v-model="trabajadorFiltro"
              class="bg-[#070b14] text-cyan-300 font-mono font-bold text-xs outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los Operadores y Riggers</option>
              <option v-for="t in resumenTrabajadoresRaw" :key="t.key" :value="t.nombre_completo">
                {{ t.nombre_completo }} ({{ t.rol }})
              </option>
            </select>
          </div>

          <!-- SPEC-106: Filtro por Rango de Fechas ("Desde - Hasta") para RRHH y Contabilidad -->
          <div class="flex items-center gap-1.5 bg-[#070b14] px-2.5 py-1 rounded-lg border border-cyan-500/30 text-xs">
            <span class="text-[10px] font-mono text-cyan-300 uppercase font-bold">📅 Desde:</span>
            <input
              v-model="fechaDesdePersonal"
              type="date"
              class="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono text-[11px] focus:border-cyan-400 outline-none"
            />
            <span class="text-[10px] font-mono text-cyan-300 uppercase font-bold ml-1">Hasta:</span>
            <input
              v-model="fechaHastaPersonal"
              type="date"
              class="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono text-[11px] focus:border-cyan-400 outline-none"
            />
            <button
              v-if="fechaDesdePersonal || fechaHastaPersonal"
              @click="fechaDesdePersonal = ''; fechaHastaPersonal = ''"
              class="ml-1 px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-mono text-[10px] font-bold cursor-pointer transition-colors"
              title="Limpiar rango de fechas"
            >
              ✕
            </button>
          </div>
        </div>

        <div class="text-xs font-mono text-slate-400 flex flex-wrap items-center gap-3">
          <span>Horas: <strong class="text-white">{{ resumenHorasPersonal.totales }} hrs</strong></span>
          <span>Total Servicio: <strong class="text-cyan-300">{{ fmtCLP(resumenHorasPersonal.totalServicio) }}</strong></span>
          <span>Total Operador: <strong class="text-emerald-400">{{ fmtCLP(resumenHorasPersonal.totalOperador) }}</strong></span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <!-- Sábana Horas Operadores.xlsx (Detalle por Report Diario + Columna Report Validado SÍ/NO) -->
        <table v-if="vistaPersonal === 'detalle'" class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#070b14] border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <th class="py-3 px-3">Orden</th>
              <th class="py-3 px-2.5">Fecha</th>
              <th class="py-3 px-3">Trabajador</th>
              <th class="py-3 px-2.5">Vehículo</th>
              <th class="py-3 px-2.5">Patente</th>
              <th class="py-3 px-2.5 text-right">Valor Hrs Operador</th>
              <th class="py-3 px-3">Nombre Cliente</th>
              <th class="py-3 px-2.5 text-center">Report</th>
              <th class="py-3 px-2.5 text-right">Valor Hora Servicio</th>
              <th class="py-3 px-2 text-right">Horas</th>
              <th class="py-3 px-2 text-right">Horas Maq</th>
              <th class="py-3 px-2.5 text-right">Total Servicio</th>
              <th class="py-3 px-2.5 text-right">Total Operador</th>
              <th class="py-3 px-2.5 text-center">Factura Nro</th>
              <th class="py-3 px-3 text-center">Report Validado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-if="jornadasPersonalFiltradas.length === 0">
              <td colspan="15" class="py-8 text-center text-slate-400 font-mono">
                No existen jornadas registradas para el filtro seleccionado.
              </td>
            </tr>
            <tr v-for="(d, idx) in jornadasPersonalFiltradas" :key="idx" class="hover:bg-white/[0.02]">
              <td class="py-2.5 px-3 font-mono font-bold text-amber-400">{{ d.orden || d.codi_proyecto }}</td>
              <td class="py-2.5 px-2.5 font-mono text-slate-300">{{ d.fecha }}</td>
              <td class="py-2.5 px-3">
                <div class="font-bold text-white">{{ d.trabajador }}</div>
                <div class="text-[10px] font-mono text-slate-400">{{ d.rol }}</div>
              </td>
              <td class="py-2.5 px-2.5 font-mono text-[11px] text-slate-300">{{ d.vehiculo }}</td>
              <td class="py-2.5 px-2.5 font-mono font-bold text-cyan-300">{{ d.patente || d.equipo_patente }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono text-slate-200">{{ fmtCLP(d.valor_hora_operador) }}</td>
              <td class="py-2.5 px-3 text-slate-200 truncate max-w-[180px]" :title="d.cliente_nombre">{{ d.cliente_nombre }}</td>
              <td class="py-2.5 px-2.5 text-center font-mono">
                <button
                  @click="abrirPdfReportIndividual(d.id_reporte)"
                  class="px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-[10px] cursor-pointer"
                  title="Ver PDF del Report Diario"
                >
                  #{{ d.report_nro || d.id_reporte }} ↗
                </button>
              </td>
              <td class="py-2.5 px-2.5 text-right font-mono text-slate-300">{{ fmtCLP(d.valor_hora_servicio) }}</td>
              <td class="py-2.5 px-2 text-right font-mono font-bold text-white">{{ Number(d.horas || d.horas_totales).toFixed(1) }}</td>
              <td class="py-2.5 px-2 text-right font-mono text-slate-300">{{ Number(d.horas_maq || d.horas_totales).toFixed(1) }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono font-semibold text-cyan-300">{{ fmtCLP(d.total_servicio) }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono font-black text-emerald-400">{{ fmtCLP(d.total_operador) }}</td>
              <td class="py-2.5 px-2.5 text-center font-mono text-slate-300">{{ d.factura_nro || '—' }}</td>
              <td class="py-2.5 px-3 text-center font-mono">
                <span
                  :class="(d.report_validado ?? d.its_validado)
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'"
                  class="px-2 py-0.5 rounded text-[10px] font-bold border"
                  :title="(d.report_validado ?? d.its_validado) ? 'Report validado por Analista de Operaciones' : 'Pendiente de validación por Analista de Operaciones'"
                >
                  {{ (d.report_validado ?? d.its_validado) ? 'SÍ' : 'NO' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Consolidado por Trabajador -->
        <table v-else class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#070b14] border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <th class="py-3 px-3.5">Trabajador / RUT</th>
              <th class="py-3 px-3">Rol</th>
              <th class="py-3 px-3">Empresa Holding</th>
              <th class="py-3 px-3 text-center">OTs / Días</th>
              <th class="py-3 px-3 text-right">Valor Hora Op. Ref</th>
              <th class="py-3 px-3 text-right">Hrs Totales</th>
              <th class="py-3 px-3 text-right">Total Servicio ($)</th>
              <th class="py-3 px-3 text-right">Total Operador ($)</th>
              <th class="py-3 px-3 text-right">Viáticos ($)</th>
              <th class="py-3 px-3.5 text-center">Report Validado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-for="t in trabajadoresFiltrados" :key="t.key" class="hover:bg-white/[0.02]">
              <td class="py-3 px-3.5">
                <div class="font-bold text-white">{{ t.nombre_completo }}</div>
                <div class="text-[10px] font-mono text-slate-400">{{ t.rut }}</div>
              </td>
              <td class="py-3 px-3">
                <span
                  :class="t.rol === 'OPERADOR' ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'"
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                >
                  {{ t.rol }}
                </span>
              </td>
              <td class="py-3 px-3 text-slate-300">{{ t.empresa_holding }}</td>
              <td class="py-3 px-3 text-center font-mono">{{ t.ots_count }} OTs · {{ t.dias_trabajados }} días</td>
              <td class="py-3 px-3 text-right font-mono text-slate-300">{{ fmtCLP(t.valor_hora_operador_ref) }}</td>
              <td class="py-3 px-3 text-right font-mono font-black text-white">{{ Number(t.horas_totales).toFixed(1) }} h</td>
              <td class="py-3 px-3 text-right font-mono font-semibold text-cyan-300">{{ fmtCLP(t.total_servicio_clp) }}</td>
              <td class="py-3 px-3 text-right font-mono font-black text-emerald-400">{{ fmtCLP(t.total_operador_clp) }}</td>
              <td class="py-3 px-3 text-right font-mono text-slate-300">{{ fmtCLP(t.viaticos_clp) }}</td>
              <td class="py-3 px-3.5 text-center font-mono">
                <span
                  :class="(t.report_validado_label || t.its_validado_label) === 'SÍ'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : ((t.report_validado_label || t.its_validado_label) === 'PARCIAL'
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30')"
                  class="px-2 py-0.5 rounded text-[10px] font-bold border"
                  :title="`${t.reports_validados_count ?? t.its_validados_count ?? 0} de ${t.reports_count || 0} reports validados por Analista`"
                >
                  {{ t.report_validado_label || t.its_validado_label || 'NO' }}
                  <span v-if="t.reports_count > 0" class="text-[9px] opacity-80 ml-0.5">({{ t.reports_validados_count ?? t.its_validados_count ?? 0 }}/{{ t.reports_count }})</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- =================================================================== -->
    <!-- SUBMENÚ 3: REPORTE DE VENTAS POR GRÚA / EQUIPO                      -->
    <!-- =================================================================== -->
    <section v-if="submenuActivo === 'equipos'" class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-lg">
      <div class="p-3 border-b border-white/5 bg-[#0a0f1e]/50 flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs font-bold text-slate-300">
          Sábana de Facturación, Costos ITS y Margen de Contribución por Activo de Flota ({{ equiposFiltrados.length }} equipos)
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#070b14] border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <th class="py-3 px-3.5">Patente / Equipo</th>
              <th class="py-3 px-3">Marca / Modelo / Tipo</th>
              <th class="py-3 px-3 text-center">OTs Atendidas</th>
              <th class="py-3 px-3 text-right">Días / Hrs Fact.</th>
              <th class="py-3 px-3 text-right">1. Comprometido ($)</th>
              <th class="py-3 px-3 text-right">2. Devengado ($)</th>
              <th class="py-3 px-3 text-right">4. Emitido EDP ($)</th>
              <th class="py-3 px-3 text-right">5. Facturado DTE ($)</th>
              <th class="py-3 px-3 text-right">Costos Directos ITS</th>
              <th class="py-3 px-3.5 text-right">Margen Contribución</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-for="eq in equiposFiltrados" :key="eq.key" class="hover:bg-white/[0.02]">
              <td class="py-3 px-3.5">
                <div class="font-mono font-black text-amber-400">{{ eq.patente }}</div>
                <div class="text-[10px] text-slate-400">{{ eq.empresa_holding }}</div>
              </td>
              <td class="py-3 px-3">
                <div class="font-bold text-white">{{ eq.nombre_equipo }}</div>
                <div class="text-[10px] font-mono text-slate-400">{{ eq.tipo_equipo }}</div>
              </td>
              <td class="py-3 px-3 text-center font-mono font-bold text-white">{{ eq.ots_atendidas }} OTs</td>
              <td class="py-3 px-3 text-right font-mono text-slate-300">{{ eq.dias_operados }} d · <strong>{{ eq.horas_facturables }} h</strong></td>
              <td class="py-3 px-3 text-right font-mono text-slate-200">{{ fmtCLP(eq.venta_comprometida_neto) }}</td>
              <td class="py-3 px-3 text-right font-mono font-bold text-cyan-300">{{ fmtCLP(eq.venta_devengada_neto) }}</td>
              <td class="py-3 px-3 text-right font-mono font-bold text-amber-300">{{ fmtCLP(eq.venta_edp_neto) }}</td>
              <td class="py-3 px-3 text-right font-mono font-bold text-emerald-400">{{ fmtCLP(eq.venta_facturada_neto) }}</td>
              <td class="py-3 px-3 text-right font-mono text-rose-300">{{ fmtCLP(eq.costos_directos_its) }}</td>
              <td class="py-3 px-3.5 text-right font-mono">
                <div class="font-black text-emerald-400">{{ fmtCLP(eq.margen_contribucion_clp) }}</div>
                <div class="text-[10px] text-slate-400">{{ eq.margen_contribucion_pct }}% s/venta</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- =================================================================== -->
    <!-- SUBMENÚ 4: REPORTE DE COMBUSTIBLE Y RENDIMIENTO DE FLOTA            -->
    <!-- (Estructura Homologada con Combustible Enero 2026.xlsx)             -->
    <!-- =================================================================== -->
    <section v-if="submenuActivo === 'combustible'" class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-lg space-y-0">
      <!-- Banner Informativo sobre Alcance de Datos Actual -->
      <div class="bg-amber-950/30 border-b border-amber-500/30 px-4 py-2.5 flex items-start gap-2.5 text-xs">
        <span class="text-amber-400 text-sm mt-0.5">ℹ️</span>
        <div class="text-slate-200 leading-relaxed">
          <strong class="text-amber-300 font-mono uppercase">Estructura Homologada con Combustible Enero 2026.xlsx (Hoja2 + sistema):</strong>
          Los datos de <strong>Patente, Tipo Vehículo, Marca, Modelo, Operador, Horómetros (Inicial/Final/Grúa), Odómetros y Monto ITS ($)</strong> se alimentan en vivo de los Reports Diarios e ITS.
          Las columnas de <strong>Guía, Surtidor (Llenado Con), Litros y Precio/Litro</strong> requieren habilitar próximamente el registro de carga de combustible en terreno.
        </div>
      </div>

      <div class="p-3 border-b border-white/5 bg-[#0a0f1e]/50 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-1 bg-[#070b14] p-1 rounded-lg border border-white/10 text-xs">
          <button
            @click="vistaCombustible = 'resumen'"
            :class="vistaCombustible === 'resumen' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1 rounded font-bold cursor-pointer"
          >
            Hoja2: Resumen por Tipo Vehículo y Patente ({{ resumenCombustibleFiltrado.length }})
          </button>
          <button
            @click="vistaCombustible = 'detalle'"
            :class="vistaCombustible === 'detalle' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1 rounded font-bold cursor-pointer"
          >
            Hoja sistema: Detalle de Cargas y Rendimientos ({{ cargasCombustibleFiltradas.length }})
          </button>
        </div>

        <div class="text-xs font-mono text-slate-400 flex items-center gap-3">
          <span>Suma de Litros: <strong class="text-cyan-300">{{ totalesCombustible.litros }} L</strong></span>
          <span>Suma de Total $: <strong class="text-emerald-400">{{ fmtCLP(totalesCombustible.totalClp) }}</strong></span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <!-- Hoja2: Resumen Dinámico por Tipo de Vehículo y Patente -->
        <table v-if="vistaCombustible === 'resumen'" class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#070b14] border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <th class="py-3 px-3.5">Tipo Vehículo</th>
              <th class="py-3 px-3">Patente</th>
              <th class="py-3 px-3">Marca / Modelo</th>
              <th class="py-3 px-3">Empresa Holding</th>
              <th class="py-3 px-3 text-center">Jornadas / Cargas</th>
              <th class="py-3 px-3 text-right">Horas Operadas</th>
              <th class="py-3 px-3 text-right">Suma de Litros</th>
              <th class="py-3 px-3.5 text-right">Suma de Total $</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-if="resumenCombustibleFiltrado.length === 0">
              <td colspan="8" class="py-8 text-center text-slate-400 font-mono">
                No existen registros de flota en el período seleccionado.
              </td>
            </tr>
            <tr v-for="v in resumenCombustibleFiltrado" :key="v.key" class="hover:bg-white/[0.02]">
              <td class="py-2.5 px-3.5 font-mono font-bold text-white">{{ v.tipo_vehiculo }}</td>
              <td class="py-2.5 px-3 font-mono font-black text-amber-400">{{ v.patente }}</td>
              <td class="py-2.5 px-3 text-slate-300">{{ v.marca }} {{ v.modelo }}</td>
              <td class="py-2.5 px-3 text-slate-400">{{ v.empresa_holding }}</td>
              <td class="py-2.5 px-3 text-center font-mono text-slate-300">{{ v.cargas_count }}</td>
              <td class="py-2.5 px-3 text-right font-mono text-slate-200">{{ Number(v.total_horas || 0).toFixed(1) }} h</td>
              <td class="py-2.5 px-3 text-right font-mono font-bold text-cyan-300">{{ Number(v.suma_litros || 0).toFixed(1) }} L</td>
              <td class="py-2.5 px-3.5 text-right font-mono font-black text-emerald-400">{{ fmtCLP(v.suma_total_clp) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Hoja sistema: Sábana Detallada (28 columnas de Combustible Enero 2026.xlsx) -->
        <table v-else class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#070b14] border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <th class="py-3 px-3">Fecha</th>
              <th class="py-3 px-2.5">Guía</th>
              <th class="py-3 px-2.5">Llenado Con</th>
              <th class="py-3 px-2.5 text-right">Litros</th>
              <th class="py-3 px-2.5 text-right">Precio</th>
              <th class="py-3 px-2.5 text-right">Hrs. Inicial / Final</th>
              <th class="py-3 px-2 text-right">Total Horas</th>
              <th class="py-3 px-2.5 text-right">Km. Inicial / Final</th>
              <th class="py-3 px-2 text-right">Total Km</th>
              <th class="py-3 px-2.5 text-right">Total $</th>
              <th class="py-3 px-2.5 text-right">Rendi Km / Hrs</th>
              <th class="py-3 px-2.5">Patente</th>
              <th class="py-3 px-2.5">Tipo Vehículo</th>
              <th class="py-3 px-2.5">Modelo / Marca</th>
              <th class="py-3 px-2.5">Operador</th>
              <th class="py-3 px-3">RUT Empresa</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-for="(c, idx) in cargasCombustibleFiltradas" :key="idx" class="hover:bg-white/[0.02]">
              <td class="py-2.5 px-3 font-mono text-slate-300">{{ c.fecha }}</td>
              <td class="py-2.5 px-2.5 font-mono text-[11px] text-amber-300">{{ c.guia }}</td>
              <td class="py-2.5 px-2.5 font-mono text-[10px] text-slate-400">{{ c.llenado_con }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono font-bold text-cyan-300">{{ c.litros }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono text-slate-300">{{ fmtCLP(c.precio) }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono text-slate-300">{{ c.hrs_inicial }} → {{ c.hrs_final }}</td>
              <td class="py-2.5 px-2 text-right font-mono font-bold text-white">{{ c.total_horas }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono text-slate-300">{{ c.km_inicial }} → {{ c.km_final }}</td>
              <td class="py-2.5 px-2 text-right font-mono text-slate-200">{{ c.total_km }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono font-black text-emerald-400">{{ fmtCLP(c.total_clp) }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono text-slate-400">{{ c.rendi_km }} km/L · {{ c.rendi_hrs }} L/h</td>
              <td class="py-2.5 px-2.5 font-mono font-bold text-amber-400">{{ c.patente }}</td>
              <td class="py-2.5 px-2.5 font-mono text-[11px] text-slate-300">{{ c.tipo_vehiculo }}</td>
              <td class="py-2.5 px-2.5 text-slate-300">{{ c.marca }} {{ c.modelo }}</td>
              <td class="py-2.5 px-2.5 text-white font-semibold">{{ c.operador }}</td>
              <td class="py-2.5 px-3 font-mono text-[11px] text-slate-400">{{ c.rut_empresa }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- =================================================================== -->
    <!-- SUBMENÚ 5: SALIDAS DE BODEGA E IMPUTACIÓN A CENTROS DE COSTOS       -->
    <!-- (Estructura Homologada con Salidas bodega enero - marzo 2026.xlsx)  -->
    <!-- =================================================================== -->
    <section v-if="submenuActivo === 'bodega'" class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-lg space-y-0">
      <!-- Banner de Claridad Técnica: Sin Data y Pendiente Manejo de Centros de Costos -->
      <div class="bg-amber-950/30 border-b border-amber-500/30 px-4 py-2.5 flex items-start gap-2.5 text-xs">
        <span class="text-amber-400 text-sm mt-0.5">⚠️</span>
        <div class="text-slate-200 leading-relaxed">
          <strong class="text-amber-300 font-mono uppercase">Estructura Homologada con Salidas bodega enero - marzo 2026.xlsx (Hoja2 + Sistema):</strong>
          Actualmente la base de datos no registra consumos de salida en <code>tinv_movimiento</code> / <code>tmnt_ot_repuesto</code> y
          <strong>está pendiente incorporar el manejo de Centros de Costos y Cuentas Contables</strong>
          (<em>Activo, Galpón Puerto Montt, Gastos de Oficina, Implementos Seguridad, Mant. Maquinarias, Mant. Vehículos, Mantención Edificio, Obra en Construcción</em>).
        </div>
      </div>

      <div class="p-3 border-b border-white/5 bg-[#0a0f1e]/50 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-1 bg-[#070b14] p-1 rounded-lg border border-white/10 text-xs">
          <button
            @click="vistaBodega = 'resumen'"
            :class="vistaBodega === 'resumen' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1 rounded font-bold cursor-pointer"
          >
            Hoja2: Matriz Mensual por Cuenta Contable ({{ resumenBodegaRaw.length }})
          </button>
          <button
            @click="vistaBodega = 'detalle'"
            :class="vistaBodega === 'detalle' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1 rounded font-bold cursor-pointer"
          >
            Hoja Sistema: Detalle de Salidas por Centro de Costo ({{ salidasBodegaFiltradas.length }})
          </button>
        </div>

        <div class="text-xs font-mono text-slate-400">
          Total Salidas valorizadas: <strong class="text-emerald-400">{{ fmtCLP(totalGeneralBodega) }}</strong>
        </div>
      </div>

      <div class="overflow-x-auto">
        <!-- Hoja2: Matriz por Cuenta Contable y Mes -->
        <table v-if="vistaBodega === 'resumen'" class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#070b14] border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <th class="py-3 px-3.5">Cuenta Contable (Plan Contabilidad)</th>
              <th class="py-3 px-3 text-right">ENERO ($)</th>
              <th class="py-3 px-3 text-right">FEBRERO ($)</th>
              <th class="py-3 px-3 text-right">MARZO ($)</th>
              <th class="py-3 px-3 text-right">OTROS MESES ($)</th>
              <th class="py-3 px-3.5 text-right">Total General ($)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-for="cta in resumenBodegaRaw" :key="cta.cuenta_contable" class="hover:bg-white/[0.02]">
              <td class="py-2.5 px-3.5 font-bold text-white">{{ cta.cuenta_contable }}</td>
              <td class="py-2.5 px-3 text-right font-mono text-slate-300">{{ fmtCLP(cta.enero) }}</td>
              <td class="py-2.5 px-3 text-right font-mono text-slate-300">{{ fmtCLP(cta.febrero) }}</td>
              <td class="py-2.5 px-3 text-right font-mono text-slate-300">{{ fmtCLP(cta.marzo) }}</td>
              <td class="py-2.5 px-3 text-right font-mono text-slate-300">{{ fmtCLP(cta.otros_meses) }}</td>
              <td class="py-2.5 px-3.5 text-right font-mono font-black text-emerald-400">{{ fmtCLP(cta.total_general) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Hoja Sistema: 13 Columnas de Salidas de Bodega -->
        <table v-else class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#070b14] border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <th class="py-3 px-3">CODIGO</th>
              <th class="py-3 px-3">PRODUCTO</th>
              <th class="py-3 px-2.5">FECHA</th>
              <th class="py-3 px-2.5">MES</th>
              <th class="py-3 px-3">DETALLE</th>
              <th class="py-3 px-2.5">NRO DCTO</th>
              <th class="py-3 px-2.5 text-right">CANTIDAD</th>
              <th class="py-3 px-2.5 text-right">PRECIO UNITARIO</th>
              <th class="py-3 px-2.5 text-right">TOTAL</th>
              <th class="py-3 px-3">CENTRO DE COSTO</th>
              <th class="py-3 px-2.5">EMPRESA</th>
              <th class="py-3 px-3">CUENTA CONTABLE</th>
              <th class="py-3 px-3">RETIRA</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-if="salidasBodegaFiltradas.length === 0">
              <td colspan="13" class="py-10 text-center text-slate-400 font-mono">
                Sin movimientos de salida de bodega registrados actualmente en la base de datos (0 registros en tinv_movimiento / tmnt_ot_repuesto).
              </td>
            </tr>
            <tr v-for="(s, idx) in salidasBodegaFiltradas" :key="idx" class="hover:bg-white/[0.02]">
              <td class="py-2.5 px-3 font-mono font-bold text-amber-400">{{ s.codigo }}</td>
              <td class="py-2.5 px-3 font-bold text-white">{{ s.producto }}</td>
              <td class="py-2.5 px-2.5 font-mono text-slate-300">{{ s.fecha }}</td>
              <td class="py-2.5 px-2.5 font-mono text-slate-300">{{ s.mes }}</td>
              <td class="py-2.5 px-3 text-slate-300">{{ s.detalle }}</td>
              <td class="py-2.5 px-2.5 font-mono text-slate-300">{{ s.nro_dcto }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono font-bold text-white">{{ s.cantidad }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono text-slate-300">{{ fmtCLP(s.precio_unitario) }}</td>
              <td class="py-2.5 px-2.5 text-right font-mono font-black text-emerald-400">{{ fmtCLP(s.total) }}</td>
              <td class="py-2.5 px-3 font-mono text-[11px] text-amber-300">{{ s.centro_costo }}</td>
              <td class="py-2.5 px-2.5 text-slate-300">{{ s.empresa }}</td>
              <td class="py-2.5 px-3 font-mono text-[11px] text-cyan-300">{{ s.cuenta_contable }}</td>
              <td class="py-2.5 px-3 text-slate-300">{{ s.retira }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- =================================================================== -->
    <!-- SUBMENÚ 6: RH — GENERADOR DE ANEXO DE CONTRATO POR CAMBIO DE OBRA   -->
    <!-- MULTI-EMPRESA + BIBLIOTECA DOCUMENTAL DE LA PERSONA (REQ-1094)      -->
    <!-- =================================================================== -->
    <section v-if="submenuActivo === 'rh'" class="space-y-4">
      <!-- Banner Informativo Superior -->
      <div class="bg-[#0f1629] border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
            📑
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="text-sm font-black uppercase tracking-wide text-white">
                6. RH — Emisión de Anexo de Contrato de Trabajo (Cambio de Obra)
              </h4>
              <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                📚 Doble Archivo Automático: Segmento RH + Biblioteca Documental de la Persona
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Genera el documento legal oficial de <strong>Anexo de Contrato de Trabajo — Cambio de Obra</strong> (Artículos 11 y 12 del Código del Trabajo, Página 1 de 1) listo para imprimir en formato corporativo por cualquiera de las 4 empresas del holding. Cada anexo emitido queda archivado automáticamente en la ficha del trabajador dentro de la <strong>Biblioteca Documental (Dimensión Personas)</strong> y en el listado inferior de <strong>RH</strong>.
            </p>
          </div>
        </div>
      </div>

      <!-- Grilla Principal: Formulario Emisor (Izquierda) + Vista Previa A4 en Vivo (Derecha) -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <!-- COLUMNA IZQUIERDA: FORMULARIO DE EMISIÓN -->
        <div class="xl:col-span-6 bg-[#0f1629] border border-white/10 rounded-xl p-4 space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h5 class="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
                1. Selección de Empresa Empleadora (Holding)
              </h5>
              <p class="text-[11px] text-slate-400">
                Selecciona por cuál de las empresas hermanas se emite el Anexo de Contrato:
              </p>
            </div>
            <button
              @click="limpiarFormularioAnexoRh"
              class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-slate-300 cursor-pointer"
            >
              🧹 Limpiar Campos
            </button>
          </div>

          <!-- Tarjetas de las 4 Empresas Hermanas -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              v-for="emp in catalogoEmpresasHoldingRh"
              :key="emp.id_empresa"
              type="button"
              @click="seleccionarEmpresaEmpleadoraRh(emp.id_empresa)"
              class="text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3"
              :class="Number(formAnexoRh.id_empresa_empleadora) === emp.id_empresa
                ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                : 'bg-[#070b14] border-white/10 hover:border-white/25'"
            >
              <img :src="emp.logo_url" :alt="emp.nombre_corto" class="w-11 h-11 object-contain rounded bg-white p-1 shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-xs font-black text-white truncate">{{ emp.nombre_corto }}</span>
                  <span
                    v-if="Number(formAnexoRh.id_empresa_empleadora) === emp.id_empresa"
                    class="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                  ></span>
                </div>
                <div class="text-[10px] font-mono text-slate-300 truncate">{{ emp.razon_social }}</div>
                <div class="text-[10px] font-mono text-amber-300 font-bold">RUT: {{ emp.rut }}</div>
              </div>
            </button>
          </div>

          <!-- Bloque 2: Datos del Empleado -->
          <div class="pt-2 border-t border-white/10 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h5 class="text-xs font-black uppercase tracking-wider text-cyan-300 font-mono">
                2. Datos del Empleado (Trabajador)
              </h5>
              <select
                v-model="trabajadorSeleccionadoIdRh"
                @change="onAutocompletarTrabajadorRh"
                class="bg-[#070b14] border border-cyan-500/30 rounded-lg px-2.5 py-1 text-[11px] font-mono text-cyan-200 outline-none cursor-pointer max-w-xs"
              >
                <option value="">⚡ Autocompletar desde Nómina de Personal ({{ padronTrabajadoresCombinadoRh.length }})...</option>
                <option v-for="t in padronTrabajadoresCombinadoRh" :key="t.key_unico" :value="t.key_unico">
                  {{ t.nombre_completo }} {{ t.rut ? `(${t.rut})` : '' }} — {{ t.cargo }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div class="sm:col-span-7">
                <label class="text-[10px] font-mono text-slate-400 uppercase block">Nombre Completo del Empleado *</label>
                <input
                  v-model="formAnexoRh.trabajador_nombre"
                  type="text"
                  placeholder="Ej: CRISTIAN EDUARDO PEREZ DIAZ"
                  class="w-full mt-1 bg-[#070b14] border border-white/15 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white font-bold uppercase outline-none"
                />
              </div>
              <div class="sm:col-span-5">
                <label class="text-[10px] font-mono text-slate-400 uppercase block">RUT del Empleado *</label>
                <input
                  v-model="formAnexoRh.trabajador_rut"
                  type="text"
                  placeholder="Ej: 13.816.828-7"
                  class="w-full mt-1 bg-[#070b14] border border-white/15 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold outline-none"
                />
              </div>
              <div class="sm:col-span-12">
                <label class="text-[10px] font-mono text-slate-400 uppercase block">Cargo a Desempeñar en la Obra *</label>
                <input
                  v-model="formAnexoRh.trabajador_cargo"
                  list="cargos-sugeridos-rh"
                  type="text"
                  placeholder="Ej: OPERADOR GRUA TELESCOPICA / RIGGER / CONDUCTOR TRACTO CAMION"
                  class="w-full mt-1 bg-[#070b14] border border-white/15 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-amber-300 font-bold uppercase outline-none"
                />
                <datalist id="cargos-sugeridos-rh">
                  <option value="OPERADOR GRUA TELESCOPICA"></option>
                  <option value="OPERADOR CAMION PLUMA"></option>
                  <option value="RIGGER CALIFICADO"></option>
                  <option value="OPERADOR MANIPULADOR TELESCOPICO"></option>
                  <option value="OPERADOR GRUA HORQUILLA"></option>
                  <option value="CONDUCTOR TRACTO CAMION CAMA BAJA"></option>
                  <option value="MECANICO DE MANTENCION EN FAENA"></option>
                  <option value="SUPERVISOR DE IZAJE Y MANIOBRAS"></option>
                </datalist>
              </div>
            </div>
          </div>

          <!-- Bloque 3: Datos del Proyecto, Empresa Cliente, Ubicación y Fechas -->
          <div class="pt-2 border-t border-white/10 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h5 class="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
                3. Destinación: Proyecto, Cliente del Servicio, Ubicación y Fechas
              </h5>
              <select
                v-model="proyectoSeleccionadoIdRh"
                @change="onAutocompletarProyectoRh"
                class="bg-[#070b14] border border-emerald-500/30 rounded-lg px-2.5 py-1 text-[11px] font-mono text-emerald-200 outline-none cursor-pointer max-w-xs"
              >
                <option value="">⚡ Autocompletar desde OT / Proyecto ({{ procesosRaw.length }})...</option>
                <option v-for="p in procesosRaw" :key="p.id_proyecto" :value="p.id_proyecto">
                  {{ p.codi_proyecto }} · {{ p.cliente_nombre }} ({{ p.obra_nombre }})
                </option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div class="sm:col-span-6">
                <label class="text-[10px] font-mono text-slate-400 uppercase block">Proyecto / Obra *</label>
                <input
                  v-model="formAnexoRh.proyecto_obra"
                  type="text"
                  placeholder="Ej: PARQUE EOLICO"
                  class="w-full mt-1 bg-[#070b14] border border-white/15 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white font-bold uppercase outline-none"
                />
              </div>
              <div class="sm:col-span-6">
                <label class="text-[10px] font-mono text-slate-400 uppercase block">Empresa Cliente del Servicio *</label>
                <input
                  v-model="formAnexoRh.empresa_cliente"
                  type="text"
                  placeholder="Ej: ELECNOR CHILE S.A."
                  class="w-full mt-1 bg-[#070b14] border border-white/15 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white font-bold uppercase outline-none"
                />
              </div>
              <div class="sm:col-span-4">
                <label class="text-[10px] font-mono text-slate-400 uppercase block">RUT Empresa Cliente</label>
                <input
                  v-model="formAnexoRh.rut_cliente"
                  type="text"
                  placeholder="Ej: 96.774.630-4"
                  class="w-full mt-1 bg-[#070b14] border border-white/15 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div class="sm:col-span-8">
                <label class="text-[10px] font-mono text-slate-400 uppercase block">Ubicación de la Obra / Recinto *</label>
                <input
                  v-model="formAnexoRh.ubicacion_obra"
                  type="text"
                  placeholder="Ej: Ruta Q-250 KM 10,7 Los Angeles"
                  class="w-full mt-1 bg-[#070b14] border border-white/15 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white font-semibold outline-none"
                />
              </div>

              <div class="sm:col-span-4">
                <label class="text-[10px] font-mono text-slate-400 uppercase block">Ciudad de Emisión *</label>
                <input
                  v-model="formAnexoRh.ciudad_emision"
                  type="text"
                  placeholder="Ej: Temuco"
                  class="w-full mt-1 bg-[#070b14] border border-white/15 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <div class="sm:col-span-4">
                <label class="text-[10px] font-mono text-slate-400 uppercase block">Fecha Emisión Anexo *</label>
                <input
                  v-model="formAnexoRh.fecha_emision"
                  type="date"
                  class="w-full mt-1 bg-[#070b14] border border-white/15 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
                />
              </div>
              <div class="sm:col-span-4">
                <label class="text-[10px] font-mono text-slate-400 uppercase block">Vigencia Obra (Hasta el) *</label>
                <input
                  v-model="formAnexoRh.fecha_hasta"
                  type="date"
                  class="w-full mt-1 bg-[#070b14] border border-white/15 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono font-bold outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Botonera de Acción Principal -->
          <div class="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div class="text-[11px] text-slate-400">
              Se archivará en: <strong class="text-emerald-300">Biblioteca Persona</strong> y <strong class="text-amber-300">Segmento 6. RH</strong>
            </div>
            <button
              type="button"
              @click="generarYDescargarAnexoRh"
              :disabled="generandoAnexoRh"
              class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wide shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>🖨️</span>
              <span>{{ generandoAnexoRh ? 'Generando PDF Oficial y Archivando...' : 'Generar PDF Oficial, Guardar en Biblioteca e Imprimir' }}</span>
            </button>
          </div>
        </div>

        <!-- COLUMNA DERECHA: VISTA PREVIA EN VIVO DEL DOCUMENTO A4 -->
        <div class="xl:col-span-6 bg-[#0f1629] border border-white/10 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black uppercase tracking-wider text-white font-mono">
                Vista Previa en Vivo — Formato Impreso A4 (Página 1 de 1)
              </span>
            </div>
            <span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold">
              {{ empresaEmpleadoraActivaRh.nombre_corto }} · {{ empresaEmpleadoraActivaRh.rut }}
            </span>
          </div>

          <!-- Lienzo A4 Blanco Simulado -->
          <div class="bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-300 p-6 sm:p-8 space-y-5 font-sans select-text" :style="{ borderTop: `6px solid ${empresaEmpleadoraActivaRh.color_acento}` }">
            <!-- Encabezado Corporativo -->
            <div class="flex items-center justify-between border-b-2 border-slate-200 pb-4 gap-4">
              <div class="flex items-center gap-3">
                <img :src="empresaEmpleadoraActivaRh.logo_url" :alt="empresaEmpleadoraActivaRh.nombre_corto" class="h-12 w-auto object-contain" />
                <div class="text-[11px] leading-tight text-slate-600">
                  <div class="font-black text-slate-900 text-xs">{{ empresaEmpleadoraActivaRh.razon_social }}</div>
                  <div>RUT: <strong class="text-slate-800">{{ empresaEmpleadoraActivaRh.rut }}</strong></div>
                  <div>{{ empresaEmpleadoraActivaRh.domicilio }}</div>
                </div>
              </div>
              <div class="text-right text-[11px] text-slate-600 shrink-0 font-mono">
                <div class="font-bold text-slate-900">Página 1 de 1</div>
                <div>Fecha: {{ fmtFechaGuionCL(formAnexoRh.fecha_emision) }}</div>
              </div>
            </div>

            <!-- Título Legal -->
            <div class="text-center bg-slate-50 border border-slate-200 rounded-md py-2.5 px-4">
              <div class="text-base font-black tracking-wide text-slate-900 underline">ANEXO CONTRATO DE TRABAJO</div>
              <div class="text-xs font-extrabold tracking-wider text-slate-700 underline mt-0.5">CAMBIO DE OBRA</div>
            </div>

            <!-- Comparecencia -->
            <p class="text-xs leading-relaxed text-justify text-slate-800">
              En <strong>{{ formAnexoRh.ciudad_emision || 'Temuco' }}</strong>, a <strong>{{ fmtFechaGuionCL(formAnexoRh.fecha_emision) }}</strong>,
              entre: <strong>{{ empresaEmpleadoraActivaRh.razon_social }}</strong> Rut, <strong>{{ empresaEmpleadoraActivaRh.rut }}</strong>
              con domicilio comercial en {{ empresaEmpleadoraActivaRh.domicilio }} y don:
              <strong class="bg-amber-100 px-1 rounded text-slate-950">{{ (formAnexoRh.trabajador_nombre || '___________________________').toUpperCase() }}</strong>
              Rut, <strong class="bg-amber-100 px-1 rounded text-slate-950">{{ formAnexoRh.trabajador_rut || '_______________' }}</strong>
              para cuyos efectos las partes convienen denominarse, respectivamente,
              <strong>EMPLEADOR Y TRABAJADOR</strong>, acuerdan lo siguiente.
            </p>

            <!-- Cláusula PRIMERO -->
            <div class="text-xs leading-relaxed text-justify text-slate-800 pl-3 py-2 border-l-4 bg-slate-50/60 rounded-r" :style="{ borderLeftColor: empresaEmpleadoraActivaRh.color_acento }">
              <span class="font-black underline text-slate-950">PRIMERO:</span>
              En virtud de lo dispuesto por los artículos 11 y 12 del Código del Trabajo, las partes desean modificar el sitio o recinto de trabajo en los siguientes términos:
              <br /><br />
              Que, a contar de esta fecha, el trabajador se desempeñará como
              <strong class="bg-amber-100 px-1 rounded text-slate-950">{{ (formAnexoRh.trabajador_cargo || '______________________').toUpperCase() }}</strong>
              en el Proyecto
              <strong class="bg-emerald-100 px-1 rounded text-slate-950">{{ (formAnexoRh.proyecto_obra || '______________________').toUpperCase() }}</strong>
              encargada por la Empresa
              <strong class="bg-emerald-100 px-1 rounded text-slate-950">{{ (formAnexoRh.empresa_cliente || '______________________').toUpperCase() }}</strong>
              <span v-if="formAnexoRh.rut_cliente"> Rut, <strong>{{ formAnexoRh.rut_cliente }}</strong></span>
              ubicada en
              <strong class="bg-emerald-100 px-1 rounded text-slate-950">{{ formAnexoRh.ubicacion_obra || '___________________________' }}</strong>
              hasta el
              <strong class="bg-amber-100 px-1 rounded text-slate-950">{{ fmtFechaGuionCL(formAnexoRh.fecha_hasta) }}</strong>.
            </div>

            <!-- Cláusulas SEGUNDO, TERCERO, CUARTO -->
            <div class="space-y-2.5 text-xs leading-relaxed text-justify text-slate-800">
              <div class="pl-3 py-1.5 border-l-4" :style="{ borderLeftColor: empresaEmpleadoraActivaRh.color_acento }">
                <span class="font-black underline text-slate-950">SEGUNDO:</span>
                El presente anexo se entiende que forma parte del contrato de trabajo, para todos los efectos legales.
              </div>
              <div class="pl-3 py-1.5 border-l-4" :style="{ borderLeftColor: empresaEmpleadoraActivaRh.color_acento }">
                <span class="font-black underline text-slate-950">TERCERO:</span>
                En todo lo no modificado en el presente anexo, el contrato de trabajo habido entre las partes, se mantiene sin alteración.
              </div>
              <div class="pl-3 py-1.5 border-l-4" :style="{ borderLeftColor: empresaEmpleadoraActivaRh.color_acento }">
                <span class="font-black underline text-slate-950">CUARTO:</span>
                El presente anexo se extiende y se firma en dos (2) ejemplares, declarando el trabajador, haber recibido en este acto un (1) ejemplar de él.
              </div>
            </div>

            <!-- Firmas -->
            <div class="grid grid-cols-2 gap-8 pt-12 pb-2 text-center text-xs">
              <div>
                <div class="border-t-2 border-slate-900 w-4/5 mx-auto pt-2 font-black text-slate-950">TRABAJADOR</div>
                <div class="text-[11px] text-slate-700 font-semibold mt-0.5">{{ (formAnexoRh.trabajador_nombre || 'Nombre Trabajador').toUpperCase() }}</div>
                <div class="font-mono font-bold text-slate-900">{{ formAnexoRh.trabajador_rut || 'RUT Trabajador' }}</div>
              </div>
              <div>
                <div class="border-t-2 border-slate-900 w-4/5 mx-auto pt-2 font-black text-slate-950">EMPRESA</div>
                <div class="text-[11px] text-slate-700 font-semibold mt-0.5">{{ empresaEmpleadoraActivaRh.razon_social }}</div>
                <div class="font-mono font-bold text-slate-900">{{ empresaEmpleadoraActivaRh.rut }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA INFERIOR: HISTORIAL DE ANEXOS EMITIDOS EN SEGMENTO RH Y ARCHIVADOS EN BIBLIOTECA DE PERSONAS -->
      <div class="bg-[#0f1629] border border-white/10 rounded-xl overflow-hidden">
        <div class="p-3.5 border-b border-white/10 bg-[#0a0f1e] flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <h5 class="text-xs font-black uppercase tracking-wider text-white">
              Registro Histórico de Anexos de Contrato Emitidos en RH ({{ anexosRhFiltrados.length }})
            </h5>
            <span class="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono text-[10px]">
              Sincronizado con Biblioteca Documental → 3. Dimensión Personas &amp; Tripulación
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#070b14] border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th class="py-3 px-3.5">Folio</th>
                <th class="py-3 px-3">Fecha Emisión / Vigencia</th>
                <th class="py-3 px-3">Empresa Empleadora</th>
                <th class="py-3 px-3">Empleado (Trabajador)</th>
                <th class="py-3 px-3">Cargo en Obra</th>
                <th class="py-3 px-3">Proyecto / Empresa Cliente / Ubicación</th>
                <th class="py-3 px-3 text-center">Biblioteca Persona</th>
                <th class="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 text-xs">
              <tr v-if="anexosRhFiltrados.length === 0">
                <td colspan="8" class="py-10 text-center text-slate-400 font-mono">
                  Aún no hay anexos de contrato emitidos. Completa el formulario superior y haz clic en "Generar PDF Oficial, Guardar en Biblioteca e Imprimir".
                </td>
              </tr>
              <tr v-for="anx in anexosRhFiltrados" :key="anx.id_cert" class="hover:bg-white/[0.02]">
                <td class="py-2.5 px-3.5 font-mono font-bold text-amber-400">
                  {{ anx.folio_anexo }}
                </td>
                <td class="py-2.5 px-3 font-mono text-[11px]">
                  <div class="text-white font-bold">{{ fmtFechaGuionCL(anx.fecha_emision) }}</div>
                  <div class="text-slate-400 text-[10px]">Hasta: {{ fmtFechaGuionCL(anx.fecha_hasta) }} · {{ anx.ciudad_emision || 'Temuco' }}</div>
                </td>
                <td class="py-2.5 px-3">
                  <div class="font-bold text-white">{{ anx.empresa_empleadora_nombre }}</div>
                  <div class="text-[10px] font-mono text-slate-400">{{ anx.empresa_empleadora_rut }}</div>
                </td>
                <td class="py-2.5 px-3">
                  <div class="font-bold text-cyan-300">{{ anx.trabajador_nombre }}</div>
                  <div class="text-[10px] font-mono text-slate-400">RUT: {{ anx.trabajador_rut }}</div>
                </td>
                <td class="py-2.5 px-3 font-mono text-[11px] font-bold text-amber-300">
                  {{ anx.trabajador_cargo }}
                </td>
                <td class="py-2.5 px-3">
                  <div class="font-bold text-emerald-300">{{ anx.proyecto_obra }}</div>
                  <div class="text-[11px] text-white">{{ anx.empresa_cliente }} <span v-if="anx.rut_cliente" class="font-mono text-slate-400">({{ anx.rut_cliente }})</span></div>
                  <div class="text-[10px] text-slate-400">📍 {{ anx.ubicacion_obra }}</div>
                </td>
                <td class="py-2.5 px-3 text-center">
                  <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                    📚 En Ficha Persona
                  </span>
                </td>
                <td class="py-2.5 px-3.5 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      @click="abrirPdfAnexoRh(anx)"
                      class="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow"
                      title="Abrir PDF Oficial listo para imprimir"
                    >
                      🖨️ Imprimir PDF ↗
                    </button>
                    <button
                      type="button"
                      @click="cargarAnexoEnFormularioRh(anx)"
                      class="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 text-[11px] cursor-pointer"
                      title="Cargar estos datos en el formulario para emitir uno nuevo"
                    >
                      🔄 Reutilizar
                    </button>
                    <button
                      type="button"
                      @click="eliminarAnexoRh(anx)"
                      class="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] cursor-pointer"
                      title="Eliminar registro"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- =================================================================== -->
    <!-- MODAL MULTIPROPÓSITO PARA INSPECCIÓN Y REGISTRO (OC, ITS, FE, DTE)  -->
    <!-- =================================================================== -->
    <div
      v-if="modalDoc.visible && modalDoc.proceso"
      class="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="modalDoc.visible = false"
    >
      <div class="bg-[#0f1629] border border-white/15 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
        <!-- Header Modal -->
        <div class="px-5 py-3.5 bg-[#070b14] border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-lg">{{ iconoModalDoc }}</span>
            <div>
              <h4 class="text-sm font-black text-white uppercase tracking-wide">{{ tituloModalDoc }}</h4>
              <p class="text-[11px] font-mono text-slate-400">
                {{ modalDoc.proceso.codi_proyecto }} · {{ modalDoc.proceso.cliente_nombre }}
              </p>
            </div>
          </div>
          <button @click="modalDoc.visible = false" class="text-slate-400 hover:text-white text-lg px-2 cursor-pointer">✕</button>
        </div>

        <!-- Cuerpo según tipo -->
        <div class="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          <!-- 1. MODAL OC CLIENTE -->
          <template v-if="modalDoc.tipo === 'OC'">
            <div v-if="modalDoc.proceso.tiene_oc" class="bg-[#070b14] border border-blue-500/30 rounded-xl p-4 space-y-2">
              <div class="flex justify-between"><span class="text-slate-400">N° Orden de Compra / HES:</span><span class="font-mono font-bold text-blue-300">{{ modalDoc.proceso.numero_oc }}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Monto Comprometido OT:</span><span class="font-mono font-bold text-emerald-400">{{ fmtCLP(modalDoc.proceso.monto_comprometido) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Notificación Automática Contabilidad:</span><span class="font-mono text-emerald-300">✔ mseguel@arriendosanpablo.cl</span></div>
            </div>

            <div class="bg-[#070b14] border border-white/10 rounded-xl p-4 space-y-3">
              <div class="font-bold text-amber-300 uppercase text-[11px] font-mono">
                {{ modalDoc.proceso.tiene_oc ? 'Actualizar / Agregar Orden de Compra Cliente' : 'Registrar Orden de Compra Cliente (Notifica a Contabilidad)' }}
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">Folio OC / HES</label>
                  <input v-model="formSoporte.numero_oc" type="text" placeholder="Ej: OC-45009912" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">Fecha Emisión</label>
                  <input v-model="formSoporte.fecha_oc" type="date" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">Monto Neto OC ($)</label>
                  <input v-model.number="formSoporte.monto_oc" type="number" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono" />
                </div>
              </div>
              <div class="flex justify-end pt-2">
                <button
                  @click="guardarOcCliente"
                  :disabled="guardandoSoporte"
                  class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  {{ guardandoSoporte ? 'Guardando...' : '💾 Guardar OC y Enviar Constancia a Contabilidad' }}
                </button>
              </div>
            </div>
          </template>

          <!-- 2. MODAL OCs DE PROVEEDORES (COSTOS OT) -->
          <template v-else-if="modalDoc.tipo === 'OC_PROV'">
            <div class="space-y-2">
              <div
                v-for="oc in modalDoc.proceso.ocs_proveedor"
                :key="oc.id_oc"
                class="bg-[#070b14] border border-purple-500/30 rounded-xl p-3.5 flex items-center justify-between"
              >
                <div>
                  <div class="font-mono font-bold text-purple-300">{{ oc.folio_oc }}</div>
                  <div class="text-white font-semibold">{{ oc.proveedor_nombre }}</div>
                  <div class="text-[10px] font-mono text-slate-400">{{ oc.fecha_emision_fmt }} · {{ oc.estado_oc }}</div>
                </div>
                <div class="text-right font-mono">
                  <div class="font-bold text-rose-300">{{ fmtCLP(oc.monto_neto) }}</div>
                  <div class="text-[10px] text-slate-400">Total: {{ fmtCLP(oc.monto_total) }}</div>
                </div>
              </div>
            </div>
          </template>

          <!-- 3. MODAL REPORTS DIARIOS -->
          <template v-else-if="modalDoc.tipo === 'REPORTS'">
            <div class="space-y-2">
              <div v-if="!modalDoc.proceso.reports_lista || modalDoc.proceso.reports_lista.length === 0" class="text-slate-400 text-center py-4">
                No hay reports diarios cerrados para este proceso.
              </div>
              <div
                v-for="r in modalDoc.proceso.reports_lista"
                :key="r.id_reporte_avance"
                class="bg-[#070b14] border border-cyan-500/25 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div class="font-mono font-bold text-cyan-300">Report #{{ r.id_reporte_avance }} · {{ r.fecha }}</div>
                  <div class="text-white font-semibold">{{ r.operador }} <span v-if="r.rigger" class="text-slate-400">+ Rigger: {{ r.rigger }}</span></div>
                  <div class="text-[10px] font-mono text-slate-400">Equipo: {{ r.equipo_patente }} ({{ r.equipo_modelo }})</div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-right font-mono">
                    <div class="font-bold text-emerald-400">{{ r.horas_facturables }} hrs facturables</div>
                    <div class="text-[10px] text-amber-300" v-if="r.horas_sobretiempo > 0">+{{ r.horas_sobretiempo }} hrs sobretiempo</div>
                    <div class="text-[10px] text-slate-400">{{ r.estado_reporte }}</div>
                  </div>
                  <button
                    @click="abrirPdfReportIndividual(r.id_reporte_avance)"
                    class="px-2.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow"
                    title="Abrir PDF Oficial con Firma FES"
                  >
                    📄 Ver PDF FES ↗
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- 4. MODAL ITS -->
          <template v-else-if="modalDoc.tipo === 'ITS'">
            <div class="grid grid-cols-3 gap-3 font-mono">
              <div class="bg-[#070b14] border border-white/10 rounded-xl p-3">
                <div class="text-[10px] text-slate-400">Ingresos Facturables</div>
                <div class="text-sm font-black text-indigo-300 mt-1">{{ fmtCLP(modalDoc.proceso.monto_its_neto) }}</div>
              </div>
              <div class="bg-[#070b14] border border-white/10 rounded-xl p-3">
                <div class="text-[10px] text-slate-400">Costos Directos Operación</div>
                <div class="text-sm font-black text-rose-300 mt-1">{{ fmtCLP(modalDoc.proceso.monto_its_costos) }}</div>
              </div>
              <div class="bg-[#070b14] border border-white/10 rounded-xl p-3">
                <div class="text-[10px] text-slate-400">Utilidad Bruta OT</div>
                <div class="text-sm font-black text-emerald-400 mt-1">
                  {{ fmtCLP(modalDoc.proceso.monto_its_neto - modalDoc.proceso.monto_its_costos) }} ({{ modalDoc.proceso.margen_its_pct }}%)
                </div>
              </div>
            </div>
          </template>

          <!-- 5. MODAL CIRCUITO DE FIRMAS ELECTRÓNICAS (FE / EDP — 2 HITOS) -->
          <template v-else-if="modalDoc.tipo === 'FE'">
            <div class="space-y-2.5">
              <div
                v-for="(item, idx) in [
                  { paso: '1° Control de Gestión (Yiara Mendoza — Emisión EDP)', firma: modalDoc.proceso.firma_1_analista },
                  { paso: '2° Contabilidad (Maritza Seguel — Factura Laudus y Firma FES)', firma: modalDoc.proceso.firma_2_contabilidad }
                ]"
                :key="idx"
                class="bg-[#070b14] border rounded-xl p-3 flex items-center justify-between"
                :class="item.firma ? 'border-emerald-500/30' : 'border-amber-500/30'"
              >
                <div>
                  <div class="font-bold text-white">{{ item.paso }}</div>
                  <div class="text-[11px] text-slate-400">
                    {{ item.firma ? `${item.firma.nombre_firmante || item.firma.firmante_nombre || 'Autorizado'} · ${ (item.firma.fecha_firma || '').slice(0, 16).replace('T', ' ') }` : 'Pendiente de Firma FES' }}
                  </div>
                </div>
                <div class="text-right font-mono">
                  <span
                    v-if="item.firma"
                    class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold"
                  >
                    ✔ Firmado FES
                  </span>
                  <button
                    v-else
                    @click="modalDoc.visible = false; $emit('abrir-edp', modalDoc.proceso)"
                    class="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] cursor-pointer"
                  >
                    ✍️ Ir a Firmar / Devolver en EDP
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- 6. MODAL FACTURAS DTE (RECONOCIMIENTO AUTOMÁTICO PDF LAUDUS / SII + MULTI-FACTURA) -->
          <template v-else-if="modalDoc.tipo === 'DTE'">
            <!-- Bloque 1: Cuenta Corriente de Facturación del Servicio -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
              <div class="bg-[#070b14] border border-white/10 rounded-xl p-2.5">
                <div class="text-[9px] text-slate-400 uppercase">1. Comprometido</div>
                <div class="text-xs font-bold text-white mt-0.5">{{ fmtCLP(modalDoc.proceso.monto_comprometido) }}</div>
              </div>
              <div class="bg-[#070b14] border border-amber-500/25 rounded-xl p-2.5">
                <div class="text-[9px] text-amber-300 uppercase">4. Exigible EDP / Dev.</div>
                <div class="text-xs font-bold text-amber-300 mt-0.5">
                  {{ fmtCLP(modalDoc.proceso.monto_edp_referencia || modalDoc.proceso.monto_devengado_reports || modalDoc.proceso.monto_comprometido) }}
                </div>
              </div>
              <div class="bg-[#070b14] border border-emerald-500/30 rounded-xl p-2.5">
                <div class="text-[9px] text-emerald-400 uppercase">
                  5. Facturado ({{ (modalDoc.proceso.facturas_dte || []).length }} DTEs)
                </div>
                <div class="text-xs font-black text-emerald-400 mt-0.5">{{ fmtCLP(modalDoc.proceso.monto_facturado_neto) }}</div>
              </div>
              <div class="bg-[#070b14] border border-cyan-500/25 rounded-xl p-2.5">
                <div class="text-[9px] text-cyan-300 uppercase">Saldo por Facturar</div>
                <div class="text-xs font-black mt-0.5" :class="modalDoc.proceso.saldo_pendiente_facturar > 0 ? 'text-amber-300' : 'text-emerald-400'">
                  {{ fmtCLP(modalDoc.proceso.saldo_pendiente_facturar) }}
                </div>
              </div>
            </div>

            <!-- Bloque 2: Historial de Facturas DTE Asociadas a este Servicio (Cuotas / Mensualidades / Cierre) -->
            <div v-if="modalDoc.proceso.facturas_dte && modalDoc.proceso.facturas_dte.length > 0" class="bg-[#070b14] border border-white/10 rounded-xl p-3.5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-[11px] uppercase text-slate-300">
                  Facturas DTE Emitidas en este Servicio ({{ modalDoc.proceso.facturas_dte.length }})
                </span>
                <span class="text-[10px] font-mono text-emerald-400">
                  Total Bruto Acumulado: {{ fmtCLP(modalDoc.proceso.monto_facturado_bruto) }}
                </span>
              </div>

              <div class="divide-y divide-white/5">
                <div
                  v-for="dte in modalDoc.proceso.facturas_dte"
                  :key="dte.id_dte || dte.folio_dte"
                  class="py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]"
                >
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-mono font-black text-emerald-400">🧾 Folio #{{ dte.folio_dte }}</span>
                      <span class="px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono text-[9px]">
                        {{ dte.empresa_facturadora }} ({{ dte.rut_emisor }})
                      </span>
                      <span class="px-1.5 py-0.2 rounded bg-white/5 text-slate-300 font-mono text-[9px]">
                        {{ dte.formato_detectado || 'LAUDUS' }}
                      </span>
                      <span
                        class="px-1.5 py-0.2 rounded font-mono text-[9px]"
                        :class="dte.modalidad_facturacion === 'CIERRE_TOTAL' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-purple-500/15 text-purple-300'"
                      >
                        {{ dte.modalidad_facturacion === 'MENSUALIDAD' ? '📅 Mensualidad' : (dte.modalidad_facturacion === 'CIERRE_TOTAL' ? '✅ Cierre Total' : '🌗 Cuota / Parcial') }}
                      </span>
                    </div>
                    <div class="text-[10px] font-mono text-slate-400 mt-0.5">
                      Emisión: <strong class="text-slate-200">{{ dte.fecha_emision }}</strong>
                      <span v-if="dte.numero_oc_referenciada"> · OC Ref: <strong class="text-blue-300">{{ dte.numero_oc_referenciada }}</strong></span>
                      <span v-if="dte.reports_referenciados && dte.reports_referenciados.length"> · Reports: {{ dte.reports_referenciados.join(', ') }}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 font-mono">
                    <div class="text-right">
                      <div class="font-bold text-white">Neto: {{ fmtCLP(dte.monto_neto) }}</div>
                      <div class="text-[10px] text-slate-400">IVA: {{ fmtCLP(dte.monto_iva) }} · Total: <strong class="text-emerald-400">{{ fmtCLP(dte.monto_total) }}</strong></div>
                    </div>
                    <div class="flex items-center gap-1">
                      <a
                        v-if="dte.archivo_url"
                        :href="resolverUrlArchivo(dte.archivo_url)"
                        target="_blank"
                        class="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 text-[10px] cursor-pointer"
                        title="Abrir PDF original de la Factura"
                      >
                        📄 PDF
                      </a>
                      <button
                        @click="eliminarFacturaDte(dte)"
                        class="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] cursor-pointer"
                        title="Desvincular esta factura"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bloque 3: Subir Nuevo PDF Factura Laudus / SII con Reconocimiento Automático -->
            <div class="bg-[#070b14] border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="font-bold text-emerald-400 uppercase text-[11px] font-mono">
                  ➕ Subir Nueva Factura PDF (Reconocimiento Automático Laudus ERP / Portal SII)
                </div>
                <span v-if="reconociendoPdf" class="text-[11px] font-mono text-amber-300 animate-pulse">
                  ⏳ Analizando estructura del PDF...
                </span>
              </div>

              <!-- Dropzone / Selector de Archivo PDF -->
              <label class="flex flex-col items-center justify-center border-2 border-dashed border-blue-500/40 hover:border-emerald-400/60 bg-slate-900/70 rounded-xl p-3.5 cursor-pointer transition-all">
                <div class="text-xs font-bold text-white flex items-center gap-2">
                  <span>📤</span>
                  <span>Haz clic aquí para seleccionar el PDF de la Factura (Laudus o SII)</span>
                </div>
                <div class="text-[10px] font-mono text-slate-400 mt-0.5">
                  Detecta automáticamente Empresa Facturadora (GSP, Bestmaq, Logística del Sur, Royal Rental), Folio, Fecha, Neto, IVA, Total y OC
                </div>
                <input type="file" accept="application/pdf,.pdf" @change="onSeleccionarPdfFactura" class="hidden" />
              </label>

              <!-- Banner de confirmación de lectura automática -->
              <div
                v-if="formSoporte.reconocido_auto"
                class="bg-emerald-950/50 border border-emerald-500/40 rounded-lg p-2.5 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <span class="text-emerald-300 font-bold">✨ Reconocido desde {{ formSoporte.formato_detectado }}:</span>
                  <span class="text-white ml-1">{{ formSoporte.empresa_facturadora }} ({{ formSoporte.rut_emisor }})</span>
                  <span v-if="formSoporte.numero_oc_referenciada" class="text-blue-300 ml-2">· OC Ref: #{{ formSoporte.numero_oc_referenciada }}</span>
                </div>
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Folio #{{ formSoporte.factura_numero }}
                </span>
              </div>

              <!-- Formulario Autocompletado (Editable en caso de ajuste manual) -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">Empresa Facturadora</label>
                  <select v-model="formSoporte.empresa_facturadora" @change="onCambioEmpresaManual" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs">
                    <option value="Grúas San Pablo">Grúas San Pablo (52.004.162-1)</option>
                    <option value="Bestmaq">Bestmaq (76.209.534-3)</option>
                    <option value="Logística del Sur">Logística del Sur (76.218.576-8)</option>
                    <option value="Royal Rental">Royal Rental (78.254.535-3)</option>
                  </select>
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">N° Folio Factura DTE</label>
                  <input v-model="formSoporte.factura_numero" type="text" placeholder="Ej: 14664" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">Fecha de Emisión</label>
                  <input v-model="formSoporte.fecha_facturacion" type="date" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">Monto Neto ($)</label>
                  <input v-model.number="formSoporte.monto_facturado" @input="recalcularIvaYTotalForm" type="number" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono font-bold" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">Exento ($)</label>
                  <input v-model.number="formSoporte.monto_exento" @input="recalcularIvaYTotalForm" type="number" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-slate-300 font-mono" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">IVA 19% ($)</label>
                  <input v-model.number="formSoporte.monto_iva" type="number" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-amber-300 font-mono" />
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">Total Bruto ($)</label>
                  <input v-model.number="formSoporte.monto_total" type="number" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-emerald-400 font-mono font-bold" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">Modalidad de Facturación en este Servicio</label>
                  <select v-model="formSoporte.modalidad_facturacion" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs">
                    <option value="PARCIAL_CUOTA">🌗 Cuota / Facturación Parcial (Mantener saldo abierto)</option>
                    <option value="MENSUALIDAD">📅 Arriendo Mensual (Continúa en próximos periodos)</option>
                    <option value="CIERRE_TOTAL">✅ Factura Final / Cierre Total (Servicio 100% Facturado)</option>
                  </select>
                </div>
                <div>
                  <label class="text-[10px] font-mono text-slate-400 uppercase">N° Orden de Compra Referenciada</label>
                  <input v-model="formSoporte.numero_oc_referenciada" type="text" placeholder="Ej: 12990" class="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-blue-300 font-mono" />
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button
                  @click="guardarFacturaDte"
                  :disabled="guardandoSoporte || !formSoporte.factura_numero"
                  class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold cursor-pointer shadow"
                >
                  {{ guardandoSoporte ? 'Guardando...' : '🧾 Guardar y Asociar Factura DTE al Servicio' }}
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer Modal -->
        <div class="px-5 py-3 bg-[#070b14] border-t border-white/10 flex items-center justify-between">
          <button
            @click="modalDoc.visible = false"
            class="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
          >
            Cerrar
          </button>
          <div class="flex items-center gap-2">
            <button
              v-if="modalDoc.tipo === 'ITS'"
              @click="abrirPdfOficialIts(modalDoc.proceso)"
              class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white cursor-pointer"
            >
              📄 Abrir PDF Oficial ITS
            </button>
            <button
              @click="modalDoc.visible = false; $emit('abrir-edp', modalDoc.proceso)"
              class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer"
            >
              📑 Abrir Expediente Completo EDP
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { navStore } from '../../stores/navStore';

const emit = defineEmits(['abrir-edp', 'abrir-its', 'notificar']);

const cargando = ref(false);
const procesosRaw = ref([]);
const resumenTrabajadoresRaw = ref([]);
const detalleJornadasRaw = ref([]);
const resumenEquiposRaw = ref([]);
const resumenCombustibleRaw = ref([]);
const detalleCombustibleRaw = ref([]);
const resumenBodegaRaw = ref([]);
const detalleBodegaRaw = ref([]);
const anexosRhRaw = ref([]);
const padronTrabajadoresRhRaw = ref([]);

const mesFiltroActivo = ref('ALL_6M');
const dimensionGrafico = ref('6meses'); // '6meses' | 'semanal'
const submenuActivo = ref('procesos'); // 'procesos' | 'operadores' | 'equipos' | 'combustible' | 'bodega' | 'rh'
const filtroEstadoDoc = ref('TODOS');
const filtroBandejaContable = ref('SOLO_TRABAJO'); // 'SOLO_TRABAJO' (por defecto) | 'TODAS'
const busquedaTexto = ref('');
const vistaPersonal = ref('detalle');
const trabajadorFiltro = ref('TODOS');
const fechaDesdePersonal = ref('');
const fechaHastaPersonal = ref('');
const vistaCombustible = ref('resumen');
const vistaBodega = ref('resumen');

// Estado reactivo Submenú 6: RH — Generador de Anexos de Contrato por Cambio de Obra (REQ-1094)
const baseUrlPublic = import.meta.env.BASE_URL || '/';
const catalogoEmpresasHoldingRh = [
  {
    id_empresa: 9,
    nombre_corto: 'Grúas San Pablo',
    razon_social: 'LUIS OMAR GHISELLINI JARA EIRL',
    rut: '52.004.162-1',
    domicilio: 'Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco',
    logo_url: `${baseUrlPublic}logo-sanpablo.png`,
    color_acento: '#D97706'
  },
  {
    id_empresa: 7,
    nombre_corto: 'Bestmaq',
    razon_social: 'SOCIEDAD COMERCIALIZADORA BESTMAQ LIMITADA',
    rut: '76.209.534-3',
    domicilio: 'Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco',
    logo_url: `${baseUrlPublic}logo-bestmaq.png`,
    color_acento: '#EA580C'
  },
  {
    id_empresa: 8,
    nombre_corto: 'Logística del Sur',
    razon_social: 'SOCIEDAD DE TRANSPORTES LOGISTICA DEL SUR LIMITADA',
    rut: '76.218.576-8',
    domicilio: 'Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco',
    logo_url: `${baseUrlPublic}logo-logistica.png`,
    color_acento: '#0284C7'
  },
  {
    id_empresa: 11,
    nombre_corto: 'Royal Rental',
    razon_social: 'ARRIENDO ROYAL RENTAL LIMITADA',
    rut: '78.254.535-3',
    domicilio: 'Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco',
    logo_url: `${baseUrlPublic}logo-royal.png`,
    color_acento: '#7C3AED'
  }
];

const generandoAnexoRh = ref(false);
const trabajadorSeleccionadoIdRh = ref('');
const proyectoSeleccionadoIdRh = ref('');
const hoyIsoStr = new Date().toISOString().split('T')[0];

const formAnexoRh = ref({
  id_empresa_empleadora: 9,
  ciudad_emision: 'Temuco',
  fecha_emision: hoyIsoStr,
  id_user: null,
  trabajador_nombre: '',
  trabajador_rut: '',
  trabajador_cargo: 'OPERADOR GRUA TELESCOPICA',
  id_proyecto: null,
  codi_proyecto: '',
  proyecto_obra: '',
  empresa_cliente: '',
  rut_cliente: '',
  ubicacion_obra: '',
  fecha_hasta: hoyIsoStr
});

const modalDoc = ref({
  visible: false,
  tipo: 'OC',
  proceso: null
});

const guardandoSoporte = ref(false);
const reconociendoPdf = ref(false);
const formSoporte = ref({
  numero_oc: '',
  fecha_oc: new Date().toISOString().split('T')[0],
  monto_oc: 0,
  reconocido_auto: false,
  formato_detectado: 'LAUDUS',
  id_empresa_emisora: 9,
  empresa_facturadora: 'Grúas San Pablo',
  rut_emisor: '52.004.162-1',
  factura_numero: '',
  fecha_facturacion: new Date().toISOString().split('T')[0],
  fecha_vencimiento: '',
  monto_exento: 0,
  monto_facturado: 0,
  monto_iva: 0,
  monto_total: 0,
  numero_oc_referenciada: '',
  reports_referenciados: [],
  ots_referenciadas: [],
  modalidad_facturacion: 'CIERRE_TOTAL',
  archivo_url: null,
  nombre_archivo: null
});

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function fmtCLP(val) {
  return '$' + Math.round(Number(val) || 0).toLocaleString('es-CL');
}

function fmtMillones(val) {
  const num = Number(val) || 0;
  if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return '$' + Math.round(num / 1000) + 'K';
  return '$' + Math.round(num);
}

function extraerMesKey(fechaStr) {
  if (!fechaStr) return '2026-10';
  return String(fechaStr).slice(0, 7);
}

function obtenerNumeroSemanaMes(fechaStr) {
  if (!fechaStr) return 1;
  const dia = Number(String(fechaStr).slice(8, 10)) || 1;
  return Math.min(5, Math.max(1, Math.ceil(dia / 7)));
}

function obtenerEtiquetaSemana(fechaStr) {
  if (!fechaStr) return 'Sem 1';
  const sem = obtenerNumeroSemanaMes(fechaStr);
  const mesIdx = (Number(String(fechaStr).slice(5, 7)) || 10) - 1;
  return `Sem ${sem} (${MESES_CORTOS[mesIdx] || 'Mes'})`;
}

// Generar últimos 6 meses dinámicos a partir del mes más reciente con datos o fecha actual
const opcionesMesesDisponibles = computed(() => {
  const ahora = new Date();
  let maxAnio = ahora.getFullYear();
  let maxMes = ahora.getMonth() + 1;

  for (const p of procesosRaw.value) {
    if (p.fecha_inicio) {
      const y = Number(p.fecha_inicio.slice(0, 4));
      const m = Number(p.fecha_inicio.slice(5, 7));
      if (y > maxAnio || (y === maxAnio && m > maxMes)) {
        maxAnio = y;
        maxMes = m;
      }
    }
  }

  const lista = [];
  for (let i = 0; i < 6; i++) {
    let m = maxMes - i;
    let y = maxAnio;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const key = `${y}-${String(m).padStart(2, '0')}`;
    lista.push({
      key,
      corto: `${MESES_CORTOS[m - 1]} ${y}`,
      label: `${MESES_NOMBRES[m - 1]} ${y}`
    });
  }
  return lista;
});

const labelMesActivo = computed(() => {
  if (mesFiltroActivo.value === 'ALL_6M') return 'Todos los Periodos';
  const found = opcionesMesesDisponibles.value.find(m => m.key === mesFiltroActivo.value);
  return found ? found.label : mesFiltroActivo.value;
});

// Procesos filtrados por periodo (mes) y buscador
const procesosFiltradosPeriodo = computed(() => {
  const q = busquedaTexto.value.trim().toLowerCase();
  return procesosRaw.value.filter(p => {
    if (mesFiltroActivo.value !== 'ALL_6M') {
      const mKey = extraerMesKey(p.fecha_inicio);
      if (mKey !== mesFiltroActivo.value) return false;
    }
    if (q) {
      const match =
        (p.codi_proyecto || '').toLowerCase().includes(q) ||
        (p.cliente_nombre || '').toLowerCase().includes(q) ||
        (p.obra_nombre || '').toLowerCase().includes(q) ||
        (p.numero_oc || '').toLowerCase().includes(q) ||
        (p.factura_numero || '').toLowerCase().includes(q) ||
        (p.folio_its || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
});

// Criterio de inclusión en Bandeja Contable: OTs con acción o devengo real
function tieneTrabajoContable(p) {
  // Asegurar visibilidad inmediata del proyecto de prueba de LeanGlobal
  if (p.id_proyecto === 1 || p.id_proyecto === 105 || (p.cliente_nombre || '').toLowerCase().includes('leanglobal')) return true;
  if (p.habilitado_facturar) return true;
  if (p.facturado || (p.facturas_dte && p.facturas_dte.length > 0)) return true;
  if (p.edp_emitido || Number(p.monto_edp_neto || 0) > 0) return true;
  if (Number(p.monto_devengado_reports || 0) > 0 || Number(p.total_reports || 0) > 0) return true;
  if (p.id_its || Number(p.monto_its_neto || 0) > 0) return true;
  if (p.requiere_oc_hes && !p.tiene_oc && (Number(p.monto_devengado_reports || 0) > 0 || p.edp_emitido)) return true;
  return false;
}

const countBandejaContable = computed(() => {
  return procesosFiltradosPeriodo.value.filter(tieneTrabajoContable).length;
});

const countPorFacturar = computed(() => {
  return procesosFiltradosPeriodo.value.filter(p => p.habilitado_facturar && (!p.facturado || p.saldo_pendiente_facturar > 0)).length;
});

const countFirmaContable = computed(() => {
  return procesosFiltradosPeriodo.value.filter(p => !p.firma_2_contabilidad && p.firma_1_analista).length;
});

const countFaltaOc = computed(() => {
  return procesosFiltradosPeriodo.value.filter(p => p.requiere_oc_hes && !p.tiene_oc && !p.facturado).length;
});

const countFacturado = computed(() => {
  return procesosFiltradosPeriodo.value.filter(p => p.facturado || (p.facturas_dte && p.facturas_dte.length > 0)).length;
});

// Procesos filtrados por las Pestañas de Trabajo por Tarea (Task Buckets)
const procesosFiltradosTabla = computed(() => {
  let lista = procesosFiltradosPeriodo.value;

  if (filtroEstadoDoc.value === 'LISTO_FACTURAR') {
    lista = lista.filter(p => p.habilitado_facturar && (!p.facturado || p.saldo_pendiente_facturar > 0));
  } else if (filtroEstadoDoc.value === 'FIRMA_CONTABILIDAD') {
    lista = lista.filter(p => !p.firma_2_contabilidad && p.firma_1_analista);
  } else if (filtroEstadoDoc.value === 'FALTA_OC') {
    lista = lista.filter(p => p.requiere_oc_hes && !p.tiene_oc && !p.facturado);
  } else if (filtroEstadoDoc.value === 'FACTURADO') {
    lista = lista.filter(p => p.facturado || (p.facturas_dte && p.facturas_dte.length > 0));
  }

  // Ordenamiento Contable: Prioridad de acción y proyecto de pruebas
  return [...lista].sort((a, b) => {
    const esLgA = a.id_proyecto === 1 || a.id_proyecto === 105 || (a.cliente_nombre || '').toLowerCase().includes('leanglobal');
    const esLgB = b.id_proyecto === 1 || b.id_proyecto === 105 || (b.cliente_nombre || '').toLowerCase().includes('leanglobal');
    if (esLgA && !esLgB) return -1;
    if (!esLgA && esLgB) return 1;

    const rank = p => {
      if (p.habilitado_facturar && !p.facturado) return 10;
      if (p.facturacion_parcial || (p.facturado && p.saldo_pendiente_facturar > 0)) return 9;
      if (p.edp_emitido && !p.habilitado_facturar) return 8;
      if (Number(p.monto_devengado_reports || 0) > 0) return 7;
      if (p.facturado) return 6;
      return 1;
    };

    const diffRank = rank(b) - rank(a);
    if (diffRank !== 0) return diffRank;

    const fechaA = a.fecha_inicio || '';
    const fechaB = b.fecha_inicio || '';
    return fechaB.localeCompare(fechaA);
  });
});

// KPIs reactivos calculados sobre procesosFiltradosPeriodo
const kpisCalculados = computed(() => {
  const lista = procesosFiltradosPeriodo.value;
  let comp = 0, dev = 0, reps = 0, hrs = 0, itsNeto = 0, itsCostos = 0, itsCount = 0;
  let edpNeto = 0, edpCount = 0, listosNeto = 0, listosCount = 0, factNeto = 0, factCount = 0;
  let conOc = 0, sinOc = 0;

  for (const p of lista) {
    comp += Number(p.monto_comprometido || 0);
    dev += Number(p.monto_devengado_reports || 0);
    reps += Number(p.total_reports || 0);
    hrs += Number(p.horas_facturables || 0);
    if (p.id_its) {
      itsNeto += Number(p.monto_its_neto || 0);
      itsCostos += Number(p.monto_its_costos || 0);
      itsCount += 1;
    }
    if (p.edp_emitido) {
      edpNeto += Number(p.monto_edp_neto || 0);
      edpCount += 1;
    }
    if (p.habilitado_facturar) {
      listosNeto += Number(p.monto_edp_referencia || 0);
      listosCount += 1;
    }
    if (p.facturado) {
      factNeto += Number(p.monto_facturado_neto || 0);
      factCount += 1;
    }
    if (!p.requiere_oc_hes || p.tiene_oc) conOc += 1;
    else sinOc += 1;
  }

  const baseExigible = Math.max(dev, edpNeto, comp);
  const brecha = Math.max(0, baseExigible - factNeto);
  const mgIts = itsNeto > 0 ? Math.round(((itsNeto - itsCostos) / itsNeto) * 100) : 0;

  return {
    comprometido_neto: comp,
    devengado_neto: dev,
    devengado_reports: reps,
    devengado_horas: Number(hrs.toFixed(1)),
    cerrado_its_neto: itsNeto,
    cerrado_its_costos: itsCostos,
    cerrado_its_count: itsCount,
    margen_its_global: mgIts,
    emitido_edp_neto: edpNeto,
    emitido_edp_count: edpCount,
    listos_facturar_neto: listosNeto,
    listos_facturar_count: listosCount,
    facturado_neto: factNeto,
    facturado_count: factCount,
    brecha_por_facturar_neto: brecha,
    con_oc_count: conOc,
    sin_oc_count: sinOc
  };
});

function pctSobreBase(valor) {
  const base = Math.max(kpisCalculados.value.comprometido_neto, kpisCalculados.value.devengado_neto, 1);
  return Math.round(((Number(valor) || 0) / base) * 100);
}

// Series del Gráfico Superior (1. Últimos 6 Meses Mensual vs 2. Mes en Curso Semanal)
const seriesGraficoActual = computed(() => {
  if (dimensionGrafico.value === '6meses') {
    const mesesCronologicos = [...opcionesMesesDisponibles.value].reverse();
    return mesesCronologicos.map(m => {
      const otsMes = procesosRaw.value.filter(p => extraerMesKey(p.fecha_inicio) === m.key);
      return {
        key: m.key,
        corto: m.corto,
        label: m.label,
        count: otsMes.length,
        comprometido: otsMes.reduce((a, b) => a + Number(b.monto_comprometido || 0), 0),
        devengado: otsMes.reduce((a, b) => a + Number(b.monto_devengado_reports || 0), 0),
        its: otsMes.reduce((a, b) => a + Number(b.monto_its_neto || 0), 0),
        edp: otsMes.reduce((a, b) => a + Number(b.monto_edp_neto || 0), 0),
        facturado: otsMes.reduce((a, b) => a + Number(b.monto_facturado_neto || 0), 0)
      };
    });
  } else {
    // Agrupado Semanal (Sem 1 a Sem 5) sobre los procesos del periodo activo
    const baseLista = procesosFiltradosPeriodo.value;
    return [1, 2, 3, 4, 5].map(sem => {
      const otsSem = baseLista.filter(p => obtenerNumeroSemanaMes(p.fecha_inicio) === sem);
      return {
        key: `SEM-${sem}`,
        corto: `Semana ${sem}`,
        label: `Semana ${sem} (${labelMesActivo.value})`,
        count: otsSem.length,
        comprometido: otsSem.reduce((a, b) => a + Number(b.monto_comprometido || 0), 0),
        devengado: otsSem.reduce((a, b) => a + Number(b.monto_devengado_reports || 0), 0),
        its: otsSem.reduce((a, b) => a + Number(b.monto_its_neto || 0), 0),
        edp: otsSem.reduce((a, b) => a + Number(b.monto_edp_neto || 0), 0),
        facturado: otsSem.reduce((a, b) => a + Number(b.monto_facturado_neto || 0), 0)
      };
    });
  }
});

const maxValorGrafico = computed(() => {
  let max = 1000000;
  for (const g of seriesGraficoActual.value) {
    max = Math.max(max, g.comprometido, g.devengado, g.its, g.edp, g.facturado);
  }
  return max;
});

function calcAlturaBarra(valor, maxVal, maxPx) {
  const num = Number(valor) || 0;
  if (num <= 0) return 3;
  return Math.max(8, Math.round((num / Math.max(maxVal, 1)) * maxPx));
}

function calcAlturaMiniBarra(p, valor) {
  const maxFila = Math.max(
    Number(p.monto_comprometido || 0),
    Number(p.monto_devengado_reports || 0),
    Number(p.monto_its_neto || 0),
    Number(p.monto_edp_neto || 0),
    Number(p.monto_facturado_neto || 0),
    1
  );
  const num = Number(valor) || 0;
  if (num <= 0) return 3;
  return Math.max(6, Math.round((num / maxFila) * 42));
}

function onClickGrupoGrafico(grupo) {
  if (dimensionGrafico.value === '6meses' && grupo.key) {
    mesFiltroActivo.value = grupo.key;
    dimensionGrafico.value = 'semanal';
  }
}

function contarFirmasEdp(p) {
  return [p.firma_1_analista, p.firma_2_contabilidad].filter(Boolean).length;
}

// Submenú 2, 3, 4 y 5 filtrados por búsqueda, selector de trabajador y rango de fechas (Desde - Hasta)
const jornadasPersonalFiltradas = computed(() => {
  const q = busquedaTexto.value.trim().toLowerCase();
  const fDesde = fechaDesdePersonal.value;
  const fHasta = fechaHastaPersonal.value;
  return detalleJornadasRaw.value.filter(d => {
    if (trabajadorFiltro.value !== 'TODOS' && d.trabajador !== trabajadorFiltro.value) return false;
    if (fDesde && d.fecha && d.fecha < fDesde) return false;
    if (fHasta && d.fecha && d.fecha > fHasta) return false;
    if (!q) return true;
    return (
      (d.trabajador || '').toLowerCase().includes(q) ||
      (d.codi_proyecto || '').toLowerCase().includes(q) ||
      (d.cliente_nombre || '').toLowerCase().includes(q) ||
      (d.equipo_patente || '').toLowerCase().includes(q) ||
      (d.factura_nro || '').toLowerCase().includes(q)
    );
  });
});

const trabajadoresFiltrados = computed(() => {
  const q = busquedaTexto.value.trim().toLowerCase();
  const fDesde = fechaDesdePersonal.value;
  const fHasta = fechaHastaPersonal.value;

  // Si hay filtro de fechas activo, recalcular consolidado de cada trabajador directamente sobre las jornadas del rango
  let baseTrabajadores = resumenTrabajadoresRaw.value;
  if (fDesde || fHasta) {
    const mapa = new Map();
    for (const d of detalleJornadasRaw.value) {
      if (fDesde && d.fecha && d.fecha < fDesde) continue;
      if (fHasta && d.fecha && d.fecha > fHasta) continue;
      const key = `${d.rol}-${d.trabajador}`;
      if (!mapa.has(key)) {
        mapa.set(key, {
          key,
          nombre_completo: d.trabajador,
          rut: d.rut || 'S/R',
          rol: d.rol || 'OPERADOR',
          empresa_holding: d.empresa_emisora || 'Grúas San Pablo',
          ots_set: new Set(),
          fechas_set: new Set(),
          reports_count: 0,
          horas_normales: 0,
          horas_sobretiempo: 0,
          horas_totales: 0,
          valor_hora_operador_ref: Number(d.valor_hora_operador || 0),
          total_servicio_clp: 0,
          total_operador_clp: 0,
          viaticos_clp: 0,
          reports_validados_count: 0
        });
      }
      const item = mapa.get(key);
      if (d.codi_proyecto) item.ots_set.add(d.codi_proyecto);
      if (d.fecha) item.fechas_set.add(d.fecha);
      item.reports_count += 1;
      item.horas_normales = Number((item.horas_normales + Number(d.horas_normales || 0)).toFixed(1));
      item.horas_sobretiempo = Number((item.horas_sobretiempo + Number(d.horas_sobretiempo || 0)).toFixed(1));
      item.horas_totales = Number((item.horas_totales + Number(d.horas || d.horas_totales || 0)).toFixed(1));
      if (Number(d.valor_hora_operador) > 0) item.valor_hora_operador_ref = Number(d.valor_hora_operador);
      item.total_servicio_clp += Number(d.total_servicio || 0);
      item.total_operador_clp += Number(d.total_operador || 0);
      item.viaticos_clp += Number(d.viatico_estimado_clp || 0);
      if (d.report_validado ?? d.its_validado) item.reports_validados_count += 1;
    }
    baseTrabajadores = Array.from(mapa.values()).map(t => ({
      ...t,
      ots_count: t.ots_set.size,
      ots_lista: Array.from(t.ots_set).join(', '),
      dias_trabajados: t.fechas_set.size,
      report_validado_label: t.reports_validados_count === t.reports_count && t.reports_count > 0
        ? 'SÍ'
        : (t.reports_validados_count > 0 ? 'PARCIAL' : 'NO'),
      its_validados_count: t.reports_validados_count,
      its_validado_label: t.reports_validados_count === t.reports_count && t.reports_count > 0
        ? 'SÍ'
        : (t.reports_validados_count > 0 ? 'PARCIAL' : 'NO')
    })).sort((a, b) => b.horas_totales - a.horas_totales);
  }

  return baseTrabajadores.filter(t => {
    if (trabajadorFiltro.value !== 'TODOS' && t.nombre_completo !== trabajadorFiltro.value) return false;
    if (!q) return true;
    return (
      (t.nombre_completo || '').toLowerCase().includes(q) ||
      (t.rut || '').toLowerCase().includes(q) ||
      (t.ots_lista || '').toLowerCase().includes(q)
    );
  });
});

const resumenHorasPersonal = computed(() => {
  let norm = 0, st = 0, tot = 0, totServ = 0, totOp = 0;
  for (const d of jornadasPersonalFiltradas.value) {
    norm += Number(d.horas_normales || 0);
    st += Number(d.horas_sobretiempo || 0);
    tot += Number(d.horas || d.horas_totales || 0);
    totServ += Number(d.total_servicio || 0);
    totOp += Number(d.total_operador || 0);
  }
  return {
    normales: norm.toFixed(1),
    sobretiempo: st.toFixed(1),
    totales: tot.toFixed(1),
    totalServicio: totServ,
    totalOperador: totOp
  };
});

const equiposFiltrados = computed(() => {
  const q = busquedaTexto.value.trim().toLowerCase();
  if (!q) return resumenEquiposRaw.value;
  return resumenEquiposRaw.value.filter(eq =>
    (eq.patente || '').toLowerCase().includes(q) ||
    (eq.nombre_equipo || '').toLowerCase().includes(q) ||
    (eq.ots_lista || '').toLowerCase().includes(q)
  );
});

const resumenCombustibleFiltrado = computed(() => {
  const q = busquedaTexto.value.trim().toLowerCase();
  if (!q) return resumenCombustibleRaw.value;
  return resumenCombustibleRaw.value.filter(v =>
    (v.patente || '').toLowerCase().includes(q) ||
    (v.tipo_vehiculo || '').toLowerCase().includes(q) ||
    (v.modelo || '').toLowerCase().includes(q) ||
    (v.marca || '').toLowerCase().includes(q)
  );
});

const cargasCombustibleFiltradas = computed(() => {
  const q = busquedaTexto.value.trim().toLowerCase();
  if (!q) return detalleCombustibleRaw.value;
  return detalleCombustibleRaw.value.filter(c =>
    (c.patente || '').toLowerCase().includes(q) ||
    (c.tipo_vehiculo || '').toLowerCase().includes(q) ||
    (c.operador || '').toLowerCase().includes(q) ||
    (c.codi_proyecto || '').toLowerCase().includes(q) ||
    (c.guia || '').toLowerCase().includes(q)
  );
});

const totalesCombustible = computed(() => {
  let litros = 0, totalClp = 0;
  for (const c of cargasCombustibleFiltradas.value) {
    litros += Number(c.litros || 0);
    totalClp += Number(c.total_clp || 0);
  }
  return {
    litros: litros.toFixed(1),
    totalClp
  };
});

const salidasBodegaFiltradas = computed(() => {
  const q = busquedaTexto.value.trim().toLowerCase();
  if (!q) return detalleBodegaRaw.value;
  return detalleBodegaRaw.value.filter(s =>
    (s.codigo || '').toLowerCase().includes(q) ||
    (s.producto || '').toLowerCase().includes(q) ||
    (s.centro_costo || '').toLowerCase().includes(q) ||
    (s.cuenta_contable || '').toLowerCase().includes(q) ||
    (s.retira || '').toLowerCase().includes(q)
  );
});

const totalGeneralBodega = computed(() => {
  return resumenBodegaRaw.value.reduce((acc, c) => acc + Number(c.total_general || 0), 0);
});

// Modal Documental (OC, OC_PROV, REPORTS, ITS, FE, DTE)
const iconoModalDoc = computed(() => {
  return {
    OC: '📎',
    OC_PROV: '🛒',
    REPORTS: '📋',
    ITS: '📊',
    FE: '🔏',
    DTE: '🧾'
  }[modalDoc.value.tipo] || '📄';
});

const tituloModalDoc = computed(() => {
  return {
    OC: 'Orden de Compra Cliente (OC / HES)',
    OC_PROV: 'Órdenes de Compra de Proveedores (Costos OT)',
    REPORTS: 'Reports Diarios de Faena Firmados',
    ITS: 'Informe de Término de Servicio (ITS)',
    FE: 'Estado de Pago & Circuito de Visación Electrónica (FE)',
    DTE: 'Factura Electrónica DTE (SII)'
  }[modalDoc.value.tipo] || 'Respaldo Documental';
});

function abrirModalDoc(tipo, p) {
  modalDoc.value = {
    visible: true,
    tipo,
    proceso: p
  };
  const saldoSugerido = p.saldo_pendiente_facturar > 0
    ? p.saldo_pendiente_facturar
    : (p.monto_edp_referencia || p.monto_devengado_reports || p.monto_comprometido || 0);
  const ivaSugerido = Math.round(saldoSugerido * 0.19);
  const rutMap = {
    'Grúas San Pablo': '52.004.162-1',
    'Bestmaq': '76.209.534-3',
    'Logística del Sur': '76.218.576-8',
    'Royal Rental': '78.254.535-3'
  };

  formSoporte.value = {
    numero_oc: p.numero_oc || '',
    fecha_oc: new Date().toISOString().split('T')[0],
    monto_oc: p.monto_oc_neto || p.monto_comprometido || 0,
    reconocido_auto: false,
    formato_detectado: (p.id_empresa === 9 || !p.id_empresa) ? 'LAUDUS' : 'SII_PORTAL',
    id_empresa_emisora: p.id_empresa || 9,
    empresa_facturadora: p.empresa_emisora || 'Grúas San Pablo',
    rut_emisor: rutMap[p.empresa_emisora] || '52.004.162-1',
    factura_numero: '',
    fecha_facturacion: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    monto_exento: 0,
    monto_facturado: saldoSugerido,
    monto_iva: ivaSugerido,
    monto_total: saldoSugerido + ivaSugerido,
    numero_oc_referenciada: p.numero_oc || '',
    reports_referenciados: [],
    ots_referenciadas: [],
    modalidad_facturacion: 'CIERRE_TOTAL',
    archivo_url: null,
    nombre_archivo: null
  };
}

function resolverUrlArchivo(url) {
  if (!url) return '#';
  if (url.startsWith('http')) return url;
  const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${base}${url}`;
}

function onCambioEmpresaManual() {
  const empMap = {
    'Grúas San Pablo': { id: 9, rut: '52.004.162-1', fmt: 'LAUDUS' },
    'Bestmaq': { id: 7, rut: '76.209.534-3', fmt: 'SII_PORTAL' },
    'Logística del Sur': { id: 8, rut: '76.218.576-8', fmt: 'SII_PORTAL' },
    'Royal Rental': { id: 11, rut: '78.254.535-3', fmt: 'SII_PORTAL' }
  };
  const info = empMap[formSoporte.value.empresa_facturadora];
  if (info) {
    formSoporte.value.id_empresa_emisora = info.id;
    formSoporte.value.rut_emisor = info.rut;
    formSoporte.value.formato_detectado = info.fmt;
  }
}

function recalcularIvaYTotalForm() {
  const neto = Number(formSoporte.value.monto_facturado) || 0;
  const exento = Number(formSoporte.value.monto_exento) || 0;
  const iva = Math.round(neto * 0.19);
  formSoporte.value.monto_iva = iva;
  formSoporte.value.monto_total = neto + exento + iva;
}

async function onSeleccionarPdfFactura(ev) {
  const file = ev.target?.files?.[0];
  if (!file) return;
  reconociendoPdf.value = true;
  try {
    const b64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await api.post('/operaciones/edp/parsear-dte-pdf', {
      pdf_base64: b64,
      nombre_archivo: file.name
    });

    if (res.data?.success && res.data.data) {
      const d = res.data.data;
      const p = modalDoc.value.proceso;

      const limpiarRut = r => String(r || '').replace(/[^0-9kK]/g, '').toUpperCase();
      const RUTS_HOLDING_VALIDOS = ['520041621', '762095343', '762185768', '782545353'];

      // Validación R-2 Fail-Closed: Pertenencia al Holding Obligatoria
      const rutEmisor = limpiarRut(d.rut_emisor);
      if (!rutEmisor || !RUTS_HOLDING_VALIDOS.includes(rutEmisor)) {
        alert(`❌ RECHAZO TRIBUTARIO: EMISOR NO PERTENECE AL HOLDING GSP\n\n` +
              `El documento subido indica como emisor: ${d.empresa_facturadora || 'No identificada'} (RUT: ${d.rut_emisor || 'No detectado'}).\n\n` +
              `Por seguridad contable, solo se admiten facturas emitidas por empresas oficiales del holding:\n` +
              `• Grúas San Pablo (52.004.162-1)\n` +
              `• Bestmaq (76.209.534-3)\n` +
              `• Logística del Sur (76.218.576-8)\n` +
              `• Royal Rental (78.254.535-3)\n\n` +
              `Este archivo fue rechazado y no se asociará al servicio.`);
        if (ev.target) ev.target.value = '';
        return;
      }

      // Validación R-1 Fail-Closed: Cliente Mandante Obligatorio (Anti-Descalce)
      const rutDte = limpiarRut(d.cliente_receptor_rut);
      const rutOt = limpiarRut(p.cliente_rut);
      if (!rutDte || !rutOt || rutDte !== rutOt) {
        alert(`❌ RECHAZO CONTABLE: INCONGRUENCIA DE CLIENTE MANDANTE\n\n` +
              `La factura subida (N° ${d.folio_dte || 'S/N'}) fue emitida a:\n` +
              `• Receptor: ${d.cliente_receptor_nombre || 'No identificado'}\n` +
              `• RUT Receptor: ${d.cliente_receptor_rut || 'No detectado'}\n\n` +
              `Sin embargo, este servicio (${p.codi_proyecto}) corresponde a:\n` +
              `• Cliente OT: ${p.cliente_nombre}\n` +
              `• RUT Cliente OT: ${p.cliente_rut || 'Sin RUT en OT'}\n\n` +
              `Por seguridad contable y auditoría tributaria, queda estrictamente bloqueada la asociación de facturas emitidas a clientes ajenos.`);
        if (ev.target) ev.target.value = '';
        return;
      }

      const saldoActual = p ? (p.saldo_pendiente_facturar || p.monto_edp_referencia || p.monto_comprometido || 0) : 0;
      const cubreTotal = d.monto_neto > 0 && d.monto_neto >= (saldoActual * 0.95);

      formSoporte.value = {
        ...formSoporte.value,
        reconocido_auto: true,
        formato_detectado: d.formato_detectado || 'LAUDUS',
        id_empresa_emisora: d.id_empresa_emisora || 9,
        empresa_facturadora: d.empresa_facturadora || 'Grúas San Pablo',
        rut_emisor: d.rut_emisor || '52.004.162-1',
        cliente_receptor_rut: d.cliente_receptor_rut || '',
        cliente_receptor_nombre: d.cliente_receptor_nombre || '',
        factura_numero: d.folio_dte || '',
        fecha_facturacion: d.fecha_emision || formSoporte.value.fecha_facturacion,
        fecha_vencimiento: d.fecha_vencimiento || '',
        monto_exento: Number(d.monto_exento) || 0,
        monto_facturado: Number(d.monto_neto) || 0,
        monto_iva: Number(d.monto_iva) || 0,
        monto_total: Number(d.monto_total) || 0,
        numero_oc_referenciada: d.numero_oc_principal || formSoporte.value.numero_oc_referenciada || '',
        reports_referenciados: d.reports_referenciados || [],
        ots_referenciadas: d.ots_referenciadas || [],
        modalidad_facturacion: cubreTotal ? 'CIERRE_TOTAL' : 'PARCIAL_CUOTA',
        archivo_url: d.archivo_url || null,
        nombre_archivo: d.nombre_archivo || file.name
      };
    }
  } catch (err) {
    console.error('[PerspectivaContabilidad] Error al analizar PDF de factura:', err);
  } finally {
    reconociendoPdf.value = false;
    if (ev.target) ev.target.value = '';
  }
}

function abrirPdfOficialCotizacion(p) {
  const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  const id = p.id_proyecto || p.id;
  window.open(`${base}/api/operaciones/edp/proyecto/${id}/cotizacion-pdf`, '_blank');
}

function abrirPdfOficialEdp(p) {
  const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  const id = p.id_proyecto || p.id;
  window.open(`${base}/api/operaciones/edp/proyecto/${id}/pdf`, '_blank');
}

function abrirPdfOficialIts(p) {
  const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  const id = p.id_proyecto || p.id;
  window.open(`${base}/api/operaciones/its/preview-pdf/${id}`, '_blank');
}

function abrirPdfReportIndividual(idReporte) {
  const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  window.open(`${base}/api/operaciones/report/${idReporte}/pdf`, '_blank');
}

function abrirPdfOC(p) {
  if (p.oc_archivo) {
    window.open(resolverUrlArchivo(p.oc_archivo), '_blank');
  } else {
    alert(`La Orden de Compra N° ${p.numero_oc || ''} no cuenta con archivo PDF adjunto registrado.`);
  }
}

function abrirPdfFacturaDirecto(p) {
  const dtes = p.facturas_dte || [];
  const dteConArchivo = [...dtes].reverse().find(d => d.archivo_url);
  if (dteConArchivo && dteConArchivo.archivo_url) {
    window.open(resolverUrlArchivo(dteConArchivo.archivo_url), '_blank');
    return;
  }
  if (p.archivo_factura_url) {
    window.open(resolverUrlArchivo(p.archivo_factura_url), '_blank');
    return;
  }
  // Si no cuenta con archivo físico directo, abrir modal como fallback de revisión
  abrirModalDoc('DTE', p);
}

async function guardarOcCliente() {
  if (!modalDoc.value.proceso || !formSoporte.value.numero_oc.trim()) return;
  guardandoSoporte.value = true;
  try {
    const p = modalDoc.value.proceso;
    await api.post(`/operaciones/edp/proyecto/${p.id_proyecto}/soporte-documental`, {
      oc: {
        numero_oc: formSoporte.value.numero_oc.trim(),
        fecha_emision: formSoporte.value.fecha_oc,
        monto_neto: Number(formSoporte.value.monto_oc) || p.monto_comprometido
      }
    });
    modalDoc.value.visible = false;
    await cargarDatos();
    emit('notificar', `OC #${formSoporte.value.numero_oc} registrada y enviada con constancia a Contabilidad.`);
  } catch (err) {
    console.error('[PerspectivaContabilidad] Error guardando OC:', err);
  } finally {
    guardandoSoporte.value = false;
  }
}

async function guardarFacturaDte() {
  if (!modalDoc.value.proceso || !String(formSoporte.value.factura_numero).trim()) return;
  guardandoSoporte.value = true;
  try {
    const p = modalDoc.value.proceso;
    const neto = Number(formSoporte.value.monto_facturado) || 0;
    const exento = Number(formSoporte.value.monto_exento) || 0;
    const iva = Number(formSoporte.value.monto_iva) || Math.round(neto * 0.19);
    const total = Number(formSoporte.value.monto_total) || (neto + exento + iva);
    const esCierre = formSoporte.value.modalidad_facturacion === 'CIERRE_TOTAL';

    const payload = {
      id_proyecto: p.id_proyecto,
      declarar_facturado: esCierre,
      factura: {
        folio_dte: String(formSoporte.value.factura_numero).trim(),
        factura_numero: String(formSoporte.value.factura_numero).trim(),
        formato_detectado: formSoporte.value.formato_detectado,
        id_empresa_emisora: formSoporte.value.id_empresa_emisora,
        empresa_facturadora: formSoporte.value.empresa_facturadora,
        rut_emisor: formSoporte.value.rut_emisor,
        cliente_receptor_rut: formSoporte.value.cliente_receptor_rut || '',
        cliente_receptor_nombre: formSoporte.value.cliente_receptor_nombre || '',
        fecha_emision: formSoporte.value.fecha_facturacion,
        fecha_facturacion: formSoporte.value.fecha_facturacion,
        fecha_vencimiento: formSoporte.value.fecha_vencimiento || null,
        monto_exento: exento,
        monto_neto: neto,
        monto_iva: iva,
        monto_total: total,
        monto_bruto: total,
        numero_oc_referenciada: formSoporte.value.numero_oc_referenciada || null,
        reports_referenciados: formSoporte.value.reports_referenciados || [],
        ots_referenciadas: formSoporte.value.ots_referenciadas || [],
        modalidad_facturacion: formSoporte.value.modalidad_facturacion,
        archivo_url: formSoporte.value.archivo_url || null,
        nombre_archivo: formSoporte.value.nombre_archivo || null
      }
    };

    // Si la factura trae una OC referenciada y la OT aún no tenía OC registrada, la registramos automáticamente
    if (formSoporte.value.numero_oc_referenciada && !p.tiene_oc) {
      payload.oc = {
        numero_oc: String(formSoporte.value.numero_oc_referenciada).trim(),
        fecha_emision: formSoporte.value.fecha_facturacion,
        monto_neto: neto
      };
    }

    await api.post(`/operaciones/edp/proyecto/${p.id_proyecto}/soporte-documental`, payload);
    await cargarDatos();
    const actualizado = procesosRaw.value.find(x => x.id_proyecto === p.id_proyecto);
    if (actualizado && actualizado.saldo_pendiente_facturar > 0 && !esCierre) {
      abrirModalDoc('DTE', actualizado);
    } else {
      modalDoc.value.visible = false;
      if (actualizado?.firma_1_analista && !actualizado?.firma_2_contabilidad) {
        emit('abrir-edp', actualizado);
      }
    }
    emit('notificar', `Factura DTE #${payload.factura.folio_dte} (${payload.factura.empresa_facturadora}) cargada. Firma con tu PIN FES para certificar la subida.`);
  } catch (err) {
    console.error('[PerspectivaContabilidad] Error guardando DTE:', err);
  } finally {
    guardandoSoporte.value = false;
  }
}

async function eliminarFacturaDte(dte) {
  if (!modalDoc.value.proceso) return;
  const p = modalDoc.value.proceso;
  try {
    await api.delete(`/operaciones/edp/proyecto/${p.id_proyecto}/dte/${dte.id_dte || dte.folio_dte}`);
    await cargarDatos();
    const actualizado = procesosRaw.value.find(x => x.id_proyecto === p.id_proyecto);
    if (actualizado) {
      modalDoc.value.proceso = actualizado;
    }
  } catch (err) {
    console.error('[PerspectivaContabilidad] Error eliminando DTE:', err);
  }
}

function exportarExcelActivo() {
  const wb = XLSX.utils.book_new();
  const fechaStr = new Date().toISOString().split('T')[0];

  if (submenuActivo.value === 'procesos') {
    const rows = procesosFiltradosTabla.value.map(p => ({
      'Código OT': p.codi_proyecto,
      'Empresa Holding': p.empresa_emisora,
      'Cliente': p.cliente_nombre,
      'RUT Cliente': p.cliente_rut,
      'Ejecutivo Comercial': p.vendedor_nombre || 'Sin Asignar',
      'Obra / Faena': p.obra_nombre,
      'Fecha Inicio': p.fecha_inicio || '',
      '1. Comprometido Neto ($)': p.monto_comprometido,
      'N° OC Cliente': p.numero_oc || (p.requiere_oc_hes ? 'PENDIENTE OC' : 'EXENTA'),
      '2. Devengado Reports ($)': p.monto_devengado_reports,
      'Reports Validados': `${p.reports_validados}/${p.total_reports}`,
      'Horas Facturables': p.horas_facturables,
      '3. Cerrado ITS Neto ($)': p.monto_its_neto,
      'Costos Operacionales ITS ($)': p.monto_its_costos,
      'Folio ITS': p.folio_its || '',
      '4. Emitido EDP Neto ($)': p.monto_edp_neto,
      'Firmas Electrónicas FE': `${contarFirmasEdp(p)}/2`,
      '5. Facturado DTE Neto ($)': p.monto_facturado_neto,
      'Folio DTE SII': p.factura_numero || '',
      'Saldo por Facturar ($)': p.saldo_pendiente_facturar,
      'Estado Contable': p.semaforo_label
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Avance_Procesos');
    XLSX.writeFile(wb, `GSP_Contabilidad_Procesos_${fechaStr}.xlsx`);
  } else if (submenuActivo.value === 'operadores') {
    // Hoja1: Formato exacto Horas Operadores.xlsx + Report Validado [SÍ / NO]
    const rowsHoja1 = jornadasPersonalFiltradas.value.map(d => ({
      'Orden': d.orden || d.codi_proyecto,
      'Fecha': d.fecha,
      'Trabajador': d.trabajador,
      'Rol': d.rol,
      'Vehiculo': d.vehiculo,
      'Patente': d.patente || d.equipo_patente,
      'Valor Hrs Operador': d.valor_hora_operador,
      'Nombre CLiente': d.cliente_nombre,
      'Report': d.report_nro || d.id_reporte,
      'Valor Hora Servcio': d.valor_hora_servicio,
      'Horas': d.horas || d.horas_totales,
      'Horas Maq': d.horas_maq || d.horas_totales,
      'Total Servicio': d.total_servicio,
      'Total Operador': d.total_operador,
      'Factura Nro': d.factura_nro || '',
      'Report Validado': (d.report_validado ?? d.its_validado) ? 'SÍ' : 'NO'
    }));
    const rowsRes = trabajadoresFiltrados.value.map(t => ({
      'Trabajador': t.nombre_completo,
      'RUT': t.rut,
      'Rol': t.rol,
      'Empresa': t.empresa_holding,
      'OTs Atendidas': t.ots_count,
      'Días Trabajados': t.dias_trabajados,
      'Valor Hora Operador Ref ($)': t.valor_hora_operador_ref,
      'Horas Normales': t.horas_normales,
      'Horas Sobretiempo': t.horas_sobretiempo,
      'Horas Totales': t.horas_totales,
      'Total Servicio ($)': t.total_servicio_clp,
      'Total Operador ($)': t.total_operador_clp,
      'Viáticos ($)': t.viaticos_clp,
      'Report Validado': t.report_validado_label || t.its_validado_label || 'NO'
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsHoja1), 'Hoja1');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsRes), 'Consolidado_Personal');
    XLSX.writeFile(wb, `Horas_Operadores_${fechaStr}.xlsx`);
  } else if (submenuActivo.value === 'equipos') {
    const rowsEq = equiposFiltrados.value.map(eq => ({
      'Patente': eq.patente,
      'Equipo / Modelo': eq.nombre_equipo,
      'Tipo': eq.tipo_equipo,
      'Empresa Holding': eq.empresa_holding,
      'OTs Atendidas': eq.ots_atendidas,
      'Días Operados': eq.dias_operados,
      'Horas Facturables': eq.horas_facturables,
      '1. Comprometido ($)': eq.venta_comprometida_neto,
      '2. Devengado ($)': eq.venta_devengada_neto,
      '4. Emitido EDP ($)': eq.venta_edp_neto,
      '5. Facturado DTE ($)': eq.venta_facturada_neto,
      'Costos Directos ITS ($)': eq.costos_directos_its,
      'Margen Contribución ($)': eq.margen_contribucion_clp,
      'Margen (%)': eq.margen_contribucion_pct
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsEq), 'Ventas_Por_Equipo');
    XLSX.writeFile(wb, `GSP_Reporte_Ventas_Por_Grua_Equipo_${fechaStr}.xlsx`);
  } else if (submenuActivo.value === 'combustible') {
    // Hoja2 y sistema homologados con Combustible Enero 2026.xlsx
    const rowsHoja2 = resumenCombustibleFiltrado.value.map(v => ({
      'Tipo Vehiculo': v.tipo_vehiculo,
      'Patente': v.patente,
      'Suma de Litros': v.suma_litros,
      'Suma de Total $': v.suma_total_clp
    }));
    const rowsSistema = cargasCombustibleFiltradas.value.map(c => ({
      'Fecha': c.fecha,
      'Guia': c.guia,
      'Llenado Con': c.llenado_con,
      'Litros': c.litros,
      'Precio': c.precio,
      'Hrs. Inicial': c.hrs_inicial,
      'Hrs. Final': c.hrs_final,
      'Total Horas.': c.total_horas,
      'Km. Inicial': c.km_inicial,
      'Km. Final': c.km_final,
      'Total Km': c.total_km,
      'Hrs G Inicial': c.hrs_g_inicial,
      'Hrs G Final': c.hrs_g_final,
      'Total Hrs G': c.total_hrs_g,
      'Total $': c.total_clp,
      'Rendi Km.': c.rendi_km,
      'Rendi Hrs.': c.rendi_hrs,
      'Rendi Hrs G.': c.rendi_hrs_g,
      'Patente': c.patente,
      'Tipo Vehiculo': c.tipo_vehiculo,
      'Modelo': c.modelo,
      'Marca': c.marca,
      'Año': c.anio,
      'Operador': c.operador,
      'Nro Interno': c.nro_interno,
      'Sucursal': c.sucursal,
      'Fecha y hora Ingreso Sistema': c.fecha_ingreso,
      'Rut Empresa': c.rut_empresa
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsHoja2), 'Hoja2');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsSistema), 'sistema');
    XLSX.writeFile(wb, `Combustible_${fechaStr}.xlsx`);
  } else if (submenuActivo.value === 'bodega') {
    // Hoja2 y Sistema homologados con Salidas bodega enero - marzo 2026.xlsx
    const rowsHoja2 = resumenBodegaRaw.value.map(c => ({
      'Cuenta Contable': c.cuenta_contable,
      'ENERO': c.enero,
      'FEBRERO': c.febrero,
      'MARZO': c.marzo,
      'OTROS MESES': c.otros_meses,
      'Total general': c.total_general
    }));
    const rowsSistema = salidasBodegaFiltradas.value.map(s => ({
      'CODIGO': s.codigo,
      'PRODUCTO': s.producto,
      'FECHA': s.fecha,
      'MES': s.mes,
      'DETALLE': s.detalle,
      'NRO DCTO': s.nro_dcto,
      'CANTIDAD': s.cantidad,
      'PRECIO UNITARIO': s.precio_unitario,
      'TOTAL': s.total,
      'CENTRO DE COSTO': s.centro_costo,
      'EMPRESA': s.empresa,
      'CUENTA CONTABLE': s.cuenta_contable,
      'RETIRA': s.retira
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsHoja2), 'Hoja2');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsSistema), 'Sistema');
    XLSX.writeFile(wb, `Salidas_bodega_${fechaStr}.xlsx`);
  } else if (submenuActivo.value === 'rh') {
    const rowsRh = anexosRhFiltrados.value.map(a => ({
      'Folio Anexo': a.folio_anexo,
      'Fecha Emisión': a.fecha_emision,
      'Vigencia Hasta': a.fecha_hasta,
      'Ciudad': a.ciudad_emision,
      'Empresa Empleadora': a.empresa_empleadora_nombre,
      'Razón Social Empleador': a.empresa_empleadora_razon_social,
      'RUT Empleador': a.empresa_empleadora_rut,
      'Nombre Trabajador': a.trabajador_nombre,
      'RUT Trabajador': a.trabajador_rut,
      'Cargo en Obra': a.trabajador_cargo,
      'Proyecto / Obra': a.proyecto_obra,
      'Empresa Cliente': a.empresa_cliente,
      'RUT Cliente': a.rut_cliente,
      'Ubicación Obra': a.ubicacion_obra
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsRh), 'Anexos_Contrato_RH');
    XLSX.writeFile(wb, `Anexos_Contrato_RH_${fechaStr}.xlsx`);
  }
}

// =========================================================================
// LÓGICA SUBMENÚ 6: RH — ANEXO DE CONTRATO POR CAMBIO DE OBRA (REQ-1094)
// =========================================================================
const empresaEmpleadoraActivaRh = computed(() => {
  const id = Number(formAnexoRh.value.id_empresa_empleadora || 9);
  return catalogoEmpresasHoldingRh.find(e => e.id_empresa === id) || catalogoEmpresasHoldingRh[0];
});

const padronTrabajadoresCombinadoRh = computed(() => {
  const map = new Map();
  for (const u of padronTrabajadoresRhRaw.value) {
    const k = `U-${u.id_user}`;
    map.set(k, {
      key_unico: k,
      id_user: u.id_user,
      nombre_completo: u.nombre_completo,
      rut: u.rut || '',
      cargo: u.cargo || 'OPERADOR GRUA TELESCOPICA'
    });
  }
  for (const t of resumenTrabajadoresRaw.value) {
    const existsByName = Array.from(map.values()).some(
      x => x.nombre_completo.toUpperCase() === String(t.nombre_completo || '').toUpperCase()
    );
    if (!existsByName && t.nombre_completo) {
      const k = `R-${t.key || t.nombre_completo}`;
      map.set(k, {
        key_unico: k,
        id_user: t.id_user || null,
        nombre_completo: t.nombre_completo,
        rut: t.rut !== 'S/R' ? (t.rut || '') : '',
        cargo: t.rol === 'RIGGER' ? 'RIGGER CALIFICADO' : 'OPERADOR GRUA TELESCOPICA'
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
});

const anexosRhFiltrados = computed(() => {
  const q = busquedaTexto.value.trim().toLowerCase();
  if (!q) return anexosRhRaw.value;
  return anexosRhRaw.value.filter(a =>
    (a.folio_anexo || '').toLowerCase().includes(q) ||
    (a.trabajador_nombre || '').toLowerCase().includes(q) ||
    (a.trabajador_rut || '').toLowerCase().includes(q) ||
    (a.trabajador_cargo || '').toLowerCase().includes(q) ||
    (a.proyecto_obra || '').toLowerCase().includes(q) ||
    (a.empresa_cliente || '').toLowerCase().includes(q) ||
    (a.ubicacion_obra || '').toLowerCase().includes(q) ||
    (a.empresa_empleadora_nombre || '').toLowerCase().includes(q)
  );
});

function fmtFechaGuionCL(dateStr) {
  if (!dateStr) return '—';
  const s = String(dateStr).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
}

function seleccionarEmpresaEmpleadoraRh(idEmp) {
  formAnexoRh.value.id_empresa_empleadora = Number(idEmp || 9);
}

function onAutocompletarTrabajadorRh() {
  const found = padronTrabajadoresCombinadoRh.value.find(x => x.key_unico === trabajadorSeleccionadoIdRh.value);
  if (!found) return;
  formAnexoRh.value.id_user = found.id_user || null;
  formAnexoRh.value.trabajador_nombre = (found.nombre_completo || '').toUpperCase();
  if (found.rut) formAnexoRh.value.trabajador_rut = found.rut;
  if (found.cargo) formAnexoRh.value.trabajador_cargo = found.cargo.toUpperCase();
}

function onAutocompletarProyectoRh() {
  const idProy = Number(proyectoSeleccionadoIdRh.value);
  const p = procesosRaw.value.find(x => Number(x.id_proyecto) === idProy);
  if (!p) return;
  formAnexoRh.value.id_proyecto = p.id_proyecto;
  formAnexoRh.value.codi_proyecto = p.codi_proyecto || '';
  formAnexoRh.value.proyecto_obra = (p.obra_nombre || p.codi_proyecto || '').toUpperCase();
  formAnexoRh.value.empresa_cliente = (p.cliente_nombre || '').toUpperCase();
  formAnexoRh.value.rut_cliente = p.cliente_rut && p.cliente_rut !== 'S/R' ? p.cliente_rut : '';
  formAnexoRh.value.ubicacion_obra = p.obra_direccion || p.obra_nombre || 'Faena Cliente';
  if (p.id_empresa && [9, 7, 8, 11].includes(Number(p.id_empresa))) {
    formAnexoRh.value.id_empresa_empleadora = Number(p.id_empresa);
  }
  if (p.fecha_termino) {
    formAnexoRh.value.fecha_hasta = String(p.fecha_termino).slice(0, 10);
  } else if (p.fecha_inicio) {
    formAnexoRh.value.fecha_hasta = String(p.fecha_inicio).slice(0, 10);
  }
}

function limpiarFormularioAnexoRh() {
  trabajadorSeleccionadoIdRh.value = '';
  proyectoSeleccionadoIdRh.value = '';
  formAnexoRh.value = {
    id_empresa_empleadora: Number(formAnexoRh.value.id_empresa_empleadora || 9),
    ciudad_emision: 'Temuco',
    fecha_emision: hoyIsoStr,
    id_user: null,
    trabajador_nombre: '',
    trabajador_rut: '',
    trabajador_cargo: 'OPERADOR GRUA TELESCOPICA',
    id_proyecto: null,
    codi_proyecto: '',
    proyecto_obra: '',
    empresa_cliente: '',
    rut_cliente: '',
    ubicacion_obra: '',
    fecha_hasta: hoyIsoStr
  };
}

function cargarAnexoEnFormularioRh(anx) {
  formAnexoRh.value = {
    id_empresa_empleadora: Number(anx.id_empresa_empleadora || 9),
    ciudad_emision: anx.ciudad_emision || 'Temuco',
    fecha_emision: anx.fecha_emision || hoyIsoStr,
    id_user: anx.id_user || null,
    trabajador_nombre: anx.trabajador_nombre || '',
    trabajador_rut: anx.trabajador_rut || '',
    trabajador_cargo: anx.trabajador_cargo || 'OPERADOR GRUA TELESCOPICA',
    id_proyecto: anx.id_proyecto || null,
    codi_proyecto: anx.codi_proyecto || '',
    proyecto_obra: anx.proyecto_obra || '',
    empresa_cliente: anx.empresa_cliente || '',
    rut_cliente: anx.rut_cliente || '',
    ubicacion_obra: anx.ubicacion_obra || '',
    fecha_hasta: anx.fecha_hasta || hoyIsoStr
  };
}

function abrirPdfAnexoRh(anx) {
  if (!anx?.id_doc && !anx?.url_pdf) return;
  const url = anx.url_pdf || `/api/archivo/ver/${anx.id_doc}`;
  window.open(resolverUrlArchivo(url), '_blank');
}

async function generarYDescargarAnexoRh() {
  const f = formAnexoRh.value;
  if (!f.trabajador_nombre.trim() || !f.trabajador_rut.trim() || !f.trabajador_cargo.trim() || !f.proyecto_obra.trim() || !f.empresa_cliente.trim() || !f.ubicacion_obra.trim()) {
    alert('Por favor completa todos los campos obligatorios: Nombre, RUT y Cargo del empleado, Proyecto/Obra, Empresa Cliente y Ubicación.');
    return;
  }
  generandoAnexoRh.value = true;
  try {
    const res = await api.post('/operaciones/edp/anexos-contrato', f);
    if (res.data?.success && res.data.data) {
      if (Array.isArray(res.data.data.anexos)) {
        anexosRhRaw.value = res.data.data.anexos;
      } else {
        await cargarDatos();
      }
      const nuevoAnexo = res.data.data.anexo;
      if (nuevoAnexo) {
        abrirPdfAnexoRh(nuevoAnexo);
      }
      emit('notificar', `Anexo de Contrato (${nuevoAnexo?.folio_anexo || 'RH'}) generado, archivado en Biblioteca de Persona y abierto para impresión.`);
    }
  } catch (err) {
    console.error('[PerspectivaContabilidad] Error generando anexo RH:', err);
    alert('Error al generar el Anexo de Contrato: ' + (err.response?.data?.message || err.message));
  } finally {
    generandoAnexoRh.value = false;
  }
}

async function eliminarAnexoRh(anx) {
  if (!anx?.id_cert) return;
  try {
    const res = await api.delete(`/operaciones/edp/anexos-contrato/${anx.id_cert}`);
    if (res.data?.success && Array.isArray(res.data.data?.anexos)) {
      anexosRhRaw.value = res.data.data.anexos;
    } else {
      await cargarDatos();
    }
  } catch (err) {
    console.error('[PerspectivaContabilidad] Error eliminando anexo RH:', err);
  }
}

async function cargarDatos() {
  cargando.value = true;
  try {
    const res = await api.get('/operaciones/edp/perspectiva-contabilidad');
    if (res.data?.success && res.data.data) {
      procesosRaw.value = res.data.data.procesos || [];
      resumenTrabajadoresRaw.value = res.data.data.horas_personal?.resumen_trabajadores || [];
      detalleJornadasRaw.value = res.data.data.horas_personal?.detalle_jornadas || [];
      resumenEquiposRaw.value = res.data.data.ventas_equipos?.resumen_equipos || [];
      resumenCombustibleRaw.value = res.data.data.combustible_flota?.resumen_vehiculos || [];
      detalleCombustibleRaw.value = res.data.data.combustible_flota?.detalle_cargas || [];
      resumenBodegaRaw.value = res.data.data.salidas_bodega?.resumen_cuentas || [];
      detalleBodegaRaw.value = res.data.data.salidas_bodega?.detalle_salidas || [];
      anexosRhRaw.value = res.data.data.rh_anexos?.anexos || [];
      padronTrabajadoresRhRaw.value = res.data.data.rh_anexos?.padron_trabajadores || [];
    }
  } catch (error) {
    console.error('[PerspectivaContabilidad] Error al cargar datos:', error);
  } finally {
    cargando.value = false;
  }
}

// Reaccionar automáticamente al selector global de empresa del Topbar superior (App.vue)
watch(
  () => navStore.activeEmpresa,
  () => {
    cargarDatos();
  }
);

onMounted(() => {
  cargarDatos();
});
</script>
