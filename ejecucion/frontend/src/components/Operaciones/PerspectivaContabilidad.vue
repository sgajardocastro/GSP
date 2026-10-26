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
    <!-- FILA 3: BARRA DE LOS 3 SUBMENÚS OPERATIVOS + FILTROS + EXCEL        -->
    <!-- =================================================================== -->
    <div class="bg-[#0f1629] border border-white/5 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3">
      <!-- 3 Submenús -->
      <div class="flex flex-wrap items-center bg-[#070b14] p-1 rounded-lg border border-white/10 gap-1">
        <button
          @click="submenuActivo = 'procesos'"
          :class="submenuActivo === 'procesos' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>1. Avance y Calce por Proceso (OC · ITS · EDP · FE · DTE)</span>
          <span class="px-1.5 py-0.2 rounded bg-black/30 font-mono text-[10px]">{{ procesosFiltradosTabla.length }}</span>
        </button>

        <button
          @click="submenuActivo = 'operadores'"
          :class="submenuActivo === 'operadores' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>2. Reporte de Horas de Operadores / Riggers</span>
          <span class="px-1.5 py-0.2 rounded bg-white/5 font-mono text-[10px]">{{ trabajadoresFiltrados.length }}</span>
        </button>

        <button
          @click="submenuActivo = 'equipos'"
          :class="submenuActivo === 'equipos' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>3. Reporte de Ventas por Grúa / Equipo</span>
          <span class="px-1.5 py-0.2 rounded bg-white/5 font-mono text-[10px]">{{ equiposFiltrados.length }}</span>
        </button>
      </div>

      <!-- Filtros rápidos documentales + Buscador + Exportar Excel -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Toggle Modo Bandeja Contable vs Cartera Completa -->
        <div v-if="submenuActivo === 'procesos'" class="flex items-center bg-[#070b14] p-1 rounded-lg border border-white/10 text-[11px] gap-1">
          <button
            @click="filtroBandejaContable = 'SOLO_TRABAJO'"
            :class="filtroBandejaContable === 'SOLO_TRABAJO' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-400 hover:text-white'"
            class="px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5"
            title="Muestra solo OTs con trabajo contable real (con Reports, Devengo, EDP o Listas para Facturar)"
          >
            <span>⚡</span>
            <span>Bandeja Contable ({{ countBandejaContable }})</span>
          </button>
          <button
            @click="filtroBandejaContable = 'TODAS'"
            :class="filtroBandejaContable === 'TODAS' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
            class="px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5"
            title="Muestra la cartera completa de OTs aunque no tengan devengo o reports"
          >
            <span>🌐</span>
            <span>Todas las OTs ({{ procesosFiltradosPeriodo.length }})</span>
          </button>
        </div>

        <div v-if="submenuActivo === 'procesos'" class="flex items-center bg-[#070b14] p-1 rounded-lg border border-white/10 text-[11px] gap-1">
          <button
            @click="filtroEstadoDoc = 'TODOS'"
            :class="filtroEstadoDoc === 'TODOS' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'"
            class="px-2 py-1 rounded font-bold cursor-pointer"
          >
            Todos
          </button>
          <button
            @click="filtroEstadoDoc = 'LISTO_FACTURAR'"
            :class="filtroEstadoDoc === 'LISTO_FACTURAR' ? 'bg-blue-600 text-white' : 'text-emerald-400 hover:bg-white/5'"
            class="px-2 py-1 rounded font-bold cursor-pointer"
          >
            🟢 Listos Facturar
          </button>
          <button
            @click="filtroEstadoDoc = 'FALTA_OC'"
            :class="filtroEstadoDoc === 'FALTA_OC' ? 'bg-blue-600 text-white' : 'text-amber-300 hover:bg-white/5'"
            class="px-2 py-1 rounded font-bold cursor-pointer"
          >
            📎 Falta OC
          </button>
          <button
            @click="filtroEstadoDoc = 'FACTURADO'"
            :class="filtroEstadoDoc === 'FACTURADO' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-white/5'"
            class="px-2 py-1 rounded font-bold cursor-pointer"
          >
            🧾 Con DTE
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
              <th class="py-3 px-3.5">Proceso / Periodo / Cliente</th>
              <th class="py-3 px-3 text-right">1. Comprometido<br/><span class="text-[9px] text-blue-400 font-normal">Cotización &amp; Acceso OC</span></th>
              <th class="py-3 px-3 text-right">2. Devengado<br/><span class="text-[9px] text-cyan-400 font-normal">Reports &amp; Horas</span></th>
              <th class="py-3 px-3 text-right">3. Cerrado ITS<br/><span class="text-[9px] text-indigo-400 font-normal">Ingreso, Costo &amp; Doc ITS</span></th>
              <th class="py-3 px-3 text-right">4. Emitido EDP &amp; FE<br/><span class="text-[9px] text-amber-400 font-normal">Prefactura &amp; 3 Firmas FES</span></th>
              <th class="py-3 px-3 text-right">5. Facturado DTE<br/><span class="text-[9px] text-emerald-400 font-normal">Factura SII &amp; Saldo</span></th>
              <th class="py-3 px-3.5 text-center">Calce Financiero<br/><span class="text-[9px] text-slate-500 font-normal">Devengado vs Cotizado</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-if="procesosFiltradosTabla.length === 0">
              <td colspan="7" class="py-10 text-center text-slate-400 font-mono">
                No se encontraron procesos para los filtros seleccionados.
              </td>
            </tr>
            <tr
              v-for="p in procesosFiltradosTabla"
              :key="p.id_proyecto"
              class="hover:bg-white/[0.02] transition-colors align-top"
            >
              <!-- Columna 0: Datos del Proceso + Mini-Gráfico de 5 Barras en el espacio vacío -->
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

                    <!-- Tooltip flotante estilo Highcharts al pasar el mouse -->
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

              <!-- Columna 1: Comprometido + Acceso a OC Cliente y OCs Proveedor -->
              <td class="py-3 px-3 text-right font-mono">
                <div class="font-bold text-white">{{ fmtCLP(p.monto_comprometido) }}</div>
                <div class="flex items-center justify-end gap-1 mt-1.5 flex-wrap">
                  <span
                    v-if="!p.requiere_oc_hes && !p.tiene_oc"
                    @click="abrirModalDoc('OC', p)"
                    class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 cursor-pointer"
                    title="Registrar OC opcional"
                  >
                    Exenta OC
                  </span>
                  <button
                    v-else-if="p.tiene_oc"
                    @click="abrirPdfOC(p)"
                    class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-colors cursor-pointer"
                    title="Ver Orden de Compra del Cliente"
                  >
                    📎 {{ p.numero_oc || 'OC Cliente' }} ↗
                  </button>
                  <button
                    v-else
                    @click="abrirModalDoc('OC', p)"
                    class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    ⚠️ + Cargar OC
                  </button>

                  <button
                    v-if="p.ocs_proveedor && p.ocs_proveedor.length > 0"
                    @click="abrirModalDoc('OC_PROV', p)"
                    class="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/15 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-colors cursor-pointer"
                    title="Ver Órdenes de Compra de Proveedores asociadas a la OT"
                  >
                    🛒 {{ p.ocs_proveedor.length }} OC Costo
                  </button>
                </div>
              </td>

              <!-- Columna 2: Devengado (Reports) -->
              <td class="py-3 px-3 text-right font-mono">
                <div class="font-bold text-cyan-300">{{ fmtCLP(p.monto_devengado_reports) }}</div>
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

              <!-- Columna 3: Cerrado en ITS -->
              <td class="py-3 px-3 text-right font-mono">
                <template v-if="p.id_its">
                  <div class="font-bold text-indigo-300">{{ fmtCLP(p.monto_its_neto) }}</div>
                  <div class="text-[10px] text-slate-400">Costo: {{ fmtCLP(p.monto_its_costos) }}</div>
                  <div class="flex items-center justify-end gap-1 mt-1">
                    <button
                      @click="abrirPdfOficialIts(p)"
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors cursor-pointer flex items-center gap-1"
                      title="Abrir PDF Oficial de Término de Servicio (ITS)"
                    >
                      📊 {{ p.folio_its || `ITS-${p.id_its}` }} ↗
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="text-slate-500 font-bold">$0</div>
                  <div class="text-[10px] text-slate-500">Sin ITS cerrado</div>
                  <div class="mt-1">
                    <span class="text-[10px] font-mono text-slate-600">S/ITS</span>
                  </div>
                </template>
              </td>

              <!-- Columna 4: Emitido en EDP & 3 Sellos FE -->
              <td class="py-3 px-3 text-right font-mono">
                <div class="font-bold text-amber-300">
                  {{ p.monto_edp_neto > 0 ? fmtCLP(p.monto_edp_neto) : fmtCLP(p.monto_edp_referencia) }}
                </div>
                <div class="flex items-center justify-end gap-1 mt-1">
                  <button
                    @click="abrirPdfOficialEdp(p)"
                    class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 transition-colors cursor-pointer flex items-center gap-1"
                    title="Abrir Expediente PDF Oficial de Estado de Pago con Firmas FES"
                  >
                    📑 EDP-{{ p.id_proyecto }} ↗
                  </button>
                  <button
                    @click="abrirModalDoc('FE', p)"
                    class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-colors cursor-pointer"
                    title="Inspeccionar Circuito de 3 Firmas Electrónicas FES"
                  >
                    🔏 FE ({{ contarFirmasEdp(p) }}/3)
                  </button>
                </div>
                <div class="flex items-center justify-end gap-1 mt-1 text-[9px] font-mono">
                  <span
                    @click="abrirModalDoc('FE', p)"
                    :class="p.firma_1_analista ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-white/5'"
                    class="px-1 py-0.2 rounded border cursor-pointer"
                  >
                    1°Ctl {{ p.firma_1_analista ? '✓' : '·' }}
                  </span>
                  <span
                    @click="abrirModalDoc('FE', p)"
                    :class="p.firma_2_contabilidad ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-white/5'"
                    class="px-1 py-0.2 rounded border cursor-pointer"
                  >
                    2°Con {{ p.firma_2_contabilidad ? '✓' : '·' }}
                  </span>
                  <span
                    @click="abrirModalDoc('FE', p)"
                    :class="p.firma_3_comercial ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-white/5'"
                    class="px-1 py-0.2 rounded border cursor-pointer"
                  >
                    3°Com {{ p.firma_3_comercial ? '✓' : '·' }}
                  </span>
                </div>
              </td>

              <!-- Columna 5: Facturado DTE (Soporte Multi-Factura: Parcial, Cuotas, Mensual) -->
              <td class="py-3 px-3 text-right font-mono">
                <template v-if="p.facturado">
                  <div class="font-bold text-emerald-400">{{ fmtCLP(p.monto_facturado_neto) }}</div>
                  <div class="text-[10px]" :class="p.saldo_pendiente_facturar > 0 ? 'text-amber-300 font-semibold' : 'text-slate-400'">
                    {{ p.saldo_pendiente_facturar > 0 ? `Por facturar: ${fmtCLP(p.saldo_pendiente_facturar)}` : '100% Facturado' }}
                  </div>
                  <div class="flex items-center justify-end gap-1 mt-1 flex-wrap">
                    <button
                      @click="abrirModalDoc('DTE', p)"
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-colors cursor-pointer"
                      :title="`Folio(s): ${p.factura_numero}`"
                    >
                      🧾 {{ (p.facturas_count || 1) > 1 ? `${p.facturas_count} DTEs (${p.factura_numero})` : `DTE #${p.factura_numero || 'Emitido'}` }} ↗
                    </button>
                    <button
                      v-if="p.facturacion_parcial || p.saldo_pendiente_facturar > 0"
                      @click="abrirModalDoc('DTE', p)"
                      class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-colors cursor-pointer"
                      title="Agregar otra factura (Cuota / Mensualidad) a este servicio"
                    >
                      + DTE
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="text-slate-500 font-bold">$0</div>
                  <div class="text-[10px] text-amber-300">Por facturar: {{ fmtCLP(p.saldo_pendiente_facturar) }}</div>
                  <div class="mt-1">
                    <button
                      @click="abrirModalDoc('DTE', p)"
                      :class="p.habilitado_facturar ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow' : 'bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10'"
                      class="px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer"
                    >
                      💳 {{ p.habilitado_facturar ? '+ Subir DTE PDF' : 'Asociar DTE PDF' }}
                    </button>
                  </div>
                </template>
              </td>

              <!-- Columna 6: Calce Financiero -->
              <td class="py-3 px-3.5 text-center">
                <div>
                  <span
                    v-if="p.facturacion_parcial"
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30"
                  >
                    🌗 Parcial ({{ p.facturas_count || 1 }} DTE)
                  </span>
                  <span
                    v-else-if="p.facturado"
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30"
                  >
                    ✅ 100% Facturado
                  </span>
                  <span
                    v-else-if="p.habilitado_facturar"
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  >
                    🟢 Listo Facturar
                  </span>
                  <span
                    v-else-if="p.semaforo_contable === 'FALTA_OC'"
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  >
                    🟡 Falta OC Cliente
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  >
                    🔵 {{ p.semaforo_label }}
                  </span>
                </div>
                <div
                  class="text-[10px] font-mono mt-1.5"
                  :class="p.variacion_edp_vs_cotizado > 0 ? 'text-cyan-300 font-bold' : (p.variacion_edp_vs_cotizado < 0 ? 'text-amber-300' : 'text-slate-400')"
                >
                  {{ p.variacion_edp_vs_cotizado !== 0
                    ? (p.variacion_edp_vs_cotizado > 0 ? '+' : '') + fmtCLP(p.variacion_edp_vs_cotizado) + ` (${p.variacion_pct}%)`
                    : '$0 Desviación (Calce 100%)'
                  }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- =================================================================== -->
    <!-- SUBMENÚ 2: REPORTE DE HORAS DE OPERADORES / RIGGERS                 -->
    <!-- =================================================================== -->
    <section v-if="submenuActivo === 'operadores'" class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-lg">
      <div class="p-3 border-b border-white/5 bg-[#0a0f1e]/50 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-1 bg-[#070b14] p-1 rounded-lg border border-white/10 text-xs">
          <button
            @click="vistaPersonal = 'resumen'"
            :class="vistaPersonal === 'resumen' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1 rounded font-bold cursor-pointer"
          >
            Consolidado por Trabajador ({{ trabajadoresFiltrados.length }})
          </button>
          <button
            @click="vistaPersonal = 'detalle'"
            :class="vistaPersonal === 'detalle' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1 rounded font-bold cursor-pointer"
          >
            Detalle Diario por Report ({{ jornadasPersonalFiltradas.length }})
          </button>
        </div>
        <div class="text-xs font-mono text-slate-400">
          Horas Normales: <strong class="text-white">{{ resumenHorasPersonal.normales }} hrs</strong> ·
          Sobretiempo: <strong class="text-amber-300">{{ resumenHorasPersonal.sobretiempo }} hrs</strong> ·
          Total General: <strong class="text-emerald-400">{{ resumenHorasPersonal.totales }} hrs</strong>
        </div>
      </div>

      <div class="overflow-x-auto">
        <!-- Consolidado por Trabajador -->
        <table v-if="vistaPersonal === 'resumen'" class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#070b14] border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <th class="py-3 px-3.5">Trabajador / RUT</th>
              <th class="py-3 px-3">Rol Operativo</th>
              <th class="py-3 px-3">Empresa Holding</th>
              <th class="py-3 px-3 text-center">OTs / Días</th>
              <th class="py-3 px-3 text-right">Hrs Normales</th>
              <th class="py-3 px-3 text-right">Hrs Sobretiempo</th>
              <th class="py-3 px-3 text-right">Hrs Totales</th>
              <th class="py-3 px-3.5 text-right">Viáticos ITS ($)</th>
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
              <td class="py-3 px-3 text-right font-mono text-slate-200">{{ Number(t.horas_normales).toFixed(1) }} h</td>
              <td class="py-3 px-3 text-right font-mono font-bold text-amber-300">{{ Number(t.horas_sobretiempo).toFixed(1) }} h</td>
              <td class="py-3 px-3 text-right font-mono font-black text-emerald-400">{{ Number(t.horas_totales).toFixed(1) }} h</td>
              <td class="py-3 px-3.5 text-right font-mono text-slate-300">{{ fmtCLP(t.viaticos_clp) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Detalle Diario por Report -->
        <table v-else class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#070b14] border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <th class="py-3 px-3.5">Fecha Report</th>
              <th class="py-3 px-3">Trabajador</th>
              <th class="py-3 px-3">Rol</th>
              <th class="py-3 px-3">Proceso / Cliente</th>
              <th class="py-3 px-3">Equipo / Patente</th>
              <th class="py-3 px-3 text-right">Hrs Normales</th>
              <th class="py-3 px-3 text-right">Sobretiempo</th>
              <th class="py-3 px-3 text-right">Total Jornada</th>
              <th class="py-3 px-3.5 text-center">Respaldo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr v-for="(d, idx) in jornadasPersonalFiltradas" :key="idx" class="hover:bg-white/[0.02]">
              <td class="py-3 px-3.5 font-mono text-slate-300">{{ d.fecha }}</td>
              <td class="py-3 px-3 font-bold text-white">{{ d.trabajador }}</td>
              <td class="py-3 px-3 font-mono text-[10px] text-slate-300">{{ d.rol }}</td>
              <td class="py-3 px-3">
                <span class="font-mono font-bold text-amber-400">{{ d.codi_proyecto }}</span> ·
                <span class="text-slate-300">{{ d.cliente_nombre }}</span>
              </td>
              <td class="py-3 px-3 font-mono text-cyan-300">{{ d.equipo_patente }}</td>
              <td class="py-3 px-3 text-right font-mono text-slate-200">{{ Number(d.horas_normales).toFixed(1) }} h</td>
              <td class="py-3 px-3 text-right font-mono text-amber-300">{{ Number(d.horas_sobretiempo).toFixed(1) }} h</td>
              <td class="py-3 px-3 text-right font-mono font-black text-emerald-400">{{ Number(d.horas_totales).toFixed(1) }} h</td>
              <td class="py-3 px-3.5 text-center">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  ✔ {{ d.estado_reporte === 'VALIDADO_ANALISTA' ? 'Validado' : 'Firmado FES' }}
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

          <!-- 5. MODAL CIRCUITO DE 3 FIRMAS ELECTRÓNICAS (FE / EDP) -->
          <template v-else-if="modalDoc.tipo === 'FE'">
            <div class="space-y-2.5">
              <div
                v-for="(item, idx) in [
                  { paso: '1° Control de Gestión (Revisión Reports)', firma: modalDoc.proceso.firma_1_analista },
                  { paso: '2° Contabilidad (Validación Tarifas y Calce)', firma: modalDoc.proceso.firma_2_contabilidad },
                  { paso: '3° Comercial (Despacho Formal a Mandante)', firma: modalDoc.proceso.firma_3_comercial }
                ]"
                :key="idx"
                class="bg-[#070b14] border rounded-xl p-3 flex items-center justify-between"
                :class="item.firma ? 'border-emerald-500/30' : 'border-amber-500/30'"
              >
                <div>
                  <div class="font-bold text-white">{{ item.paso }}</div>
                  <div class="text-[11px] text-slate-400">
                    {{ item.firma ? `${item.firma.firmante_nombre || 'Autorizado'} · ${ (item.firma.fecha_firma || '').slice(0, 16).replace('T', ' ') }` : 'Pendiente de Firma FES' }}
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
                    ✍️ Ir a Firmar en Expediente EDP
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

const mesFiltroActivo = ref('ALL_6M');
const dimensionGrafico = ref('6meses'); // '6meses' | 'semanal'
const submenuActivo = ref('procesos'); // 'procesos' | 'operadores' | 'equipos'
const filtroEstadoDoc = ref('TODOS');
const filtroBandejaContable = ref('SOLO_TRABAJO'); // 'SOLO_TRABAJO' (por defecto) | 'TODAS'
const busquedaTexto = ref('');
const vistaPersonal = ref('resumen');

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

// Procesos filtrados además por el toggle de Bandeja Contable y filtros documentales
const procesosFiltradosTabla = computed(() => {
  let lista = procesosFiltradosPeriodo.value;

  if (filtroBandejaContable.value === 'SOLO_TRABAJO') {
    lista = lista.filter(tieneTrabajoContable);
  }

  if (filtroEstadoDoc.value === 'LISTO_FACTURAR') {
    lista = lista.filter(p => p.habilitado_facturar && !p.facturado);
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
  return [p.firma_1_analista, p.firma_2_contabilidad, p.firma_3_comercial].filter(Boolean).length;
}

// Submenú 2 y 3 filtrados por búsqueda
const trabajadoresFiltrados = computed(() => {
  const q = busquedaTexto.value.trim().toLowerCase();
  if (!q) return resumenTrabajadoresRaw.value;
  return resumenTrabajadoresRaw.value.filter(t =>
    (t.nombre_completo || '').toLowerCase().includes(q) ||
    (t.rut || '').toLowerCase().includes(q) ||
    (t.ots_lista || '').toLowerCase().includes(q)
  );
});

const jornadasPersonalFiltradas = computed(() => {
  const q = busquedaTexto.value.trim().toLowerCase();
  if (!q) return detalleJornadasRaw.value;
  return detalleJornadasRaw.value.filter(d =>
    (d.trabajador || '').toLowerCase().includes(q) ||
    (d.codi_proyecto || '').toLowerCase().includes(q) ||
    (d.cliente_nombre || '').toLowerCase().includes(q) ||
    (d.equipo_patente || '').toLowerCase().includes(q)
  );
});

const resumenHorasPersonal = computed(() => {
  let norm = 0, st = 0, tot = 0;
  for (const t of trabajadoresFiltrados.value) {
    norm += Number(t.horas_normales || 0);
    st += Number(t.horas_sobretiempo || 0);
    tot += Number(t.horas_totales || 0);
  }
  return {
    normales: norm.toFixed(1),
    sobretiempo: st.toFixed(1),
    totales: tot.toFixed(1)
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
    FE: 'Estado de Pago & Circuito de 3 Firmas Electrónicas (FE)',
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
    abrirModalDoc('OC', p);
  }
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
    if (actualizado) {
      abrirModalDoc('DTE', actualizado);
    } else {
      modalDoc.value.visible = false;
    }
    emit('notificar', `Factura DTE #${payload.factura.folio_dte} (${payload.factura.empresa_facturadora}) asociada exitosamente.`);
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
      'Firmas Electrónicas FE': `${contarFirmasEdp(p)}/3`,
      '5. Facturado DTE Neto ($)': p.monto_facturado_neto,
      'Folio DTE SII': p.factura_numero || '',
      'Saldo por Facturar ($)': p.saldo_pendiente_facturar,
      'Estado Contable': p.semaforo_label
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Avance_Procesos');
    XLSX.writeFile(wb, `GSP_Contabilidad_Procesos_${fechaStr}.xlsx`);
  } else if (submenuActivo.value === 'operadores') {
    const rowsRes = trabajadoresFiltrados.value.map(t => ({
      'Trabajador': t.nombre_completo,
      'RUT': t.rut,
      'Rol': t.rol,
      'Empresa': t.empresa_holding,
      'OTs Atendidas': t.ots_count,
      'Días Trabajados': t.dias_trabajados,
      'Horas Normales': t.horas_normales,
      'Horas Sobretiempo': t.horas_sobretiempo,
      'Horas Totales': t.horas_totales,
      'Viáticos ITS ($)': t.viaticos_clp
    }));
    const rowsDet = jornadasPersonalFiltradas.value.map(d => ({
      'Fecha Report': d.fecha,
      'Trabajador': d.trabajador,
      'RUT': d.rut,
      'Rol': d.rol,
      'OT': d.codi_proyecto,
      'Cliente': d.cliente_nombre,
      'Patente Equipo': d.equipo_patente,
      'Horas Normales': d.horas_normales,
      'Horas Sobretiempo': d.horas_sobretiempo,
      'Horas Totales': d.horas_totales,
      'Estado Report': d.estado_reporte
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsRes), 'Consolidado_Personal');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsDet), 'Detalle_Jornadas');
    XLSX.writeFile(wb, `GSP_Reporte_Horas_Operadores_Riggers_${fechaStr}.xlsx`);
  } else {
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
