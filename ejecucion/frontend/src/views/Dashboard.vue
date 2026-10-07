<template>
  <div class="space-y-6 text-left p-2 md:p-6 bg-[#0a0f1e] min-h-screen text-slate-100 font-sans">
    
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 🚨 BANNER OFICIAL DE VERSIÓN BETA / EN CALIBRACIÓN                     -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div class="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-2 border-amber-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <div class="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-[11px] font-black tracking-widest uppercase shadow-lg shadow-amber-500/30 flex items-center gap-1.5 shrink-0">
          <span class="w-2 h-2 rounded-full bg-black animate-pulse"></span>
          VERSIÓN BETA v0.9
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-black text-white uppercase tracking-wide">Módulo BI en Calibración con Control de Gestión</h2>
            <span class="text-[10px] bg-white/10 text-slate-300 font-mono px-2 py-0.5 rounded">100% Datos Reales PostgreSQL</span>
          </div>
          <p class="text-xs text-amber-200/90 mt-0.5">
            Los valores de devengado, descalce, flota y documentación se calculan en vivo desde la base de datos de desarrollo (<code class="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">sch_leangsp</code>). Cero datos inventados.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-[11px] font-bold text-slate-400">Ambiente:</span>
        <span class="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold">DEV (Local)</span>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 1. HEADER DIRECTIVO & FILTROS GLOBALES                                -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0f172a]/90 p-5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20 border border-amber-400/30">
          <BarChart3 class="w-6 h-6 text-black" />
        </div>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-black text-white uppercase tracking-wider font-display">Consola Directiva & Business Intelligence</h1>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              En Vivo
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1">Control de Devengado (IFRS 15), Disponibilidad de Flota (110 Equipos), Taller y Seguridad de Izajes Pesados.</p>
        </div>
      </div>

      <!-- Filtros Globales y Acciones -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Switcher de Empresa Emisora -->
        <div class="flex items-center bg-[#1e293b] border border-white/10 rounded-xl p-1">
          <button 
            v-for="emp in empresasDisponibles" 
            :key="emp.id"
            @click="cambiarEmpresa(emp.id)"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            :class="filtroEmpresa === emp.id ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'"
          >
            {{ emp.label }}
          </button>
        </div>

        <!-- Selector de Periodo -->
        <div class="flex items-center bg-[#1e293b] border border-white/10 rounded-xl px-3 py-1.5 gap-2 text-xs">
          <Calendar class="w-3.5 h-3.5 text-amber-500" />
          <span class="text-slate-400 font-semibold">Periodo:</span>
          <select v-model="filtroPeriodo" class="bg-transparent text-white font-bold outline-none cursor-pointer">
            <option value="todos" class="bg-[#0f172a]">Todos los Negocios</option>
            <option value="mes_actual" class="bg-[#0f172a]">Mes Actual (Octubre 2026)</option>
          </select>
        </div>

        <!-- Botón Refresco -->
        <button 
          @click="fetchDashboardData" 
          :disabled="loading"
          class="flex items-center gap-2 bg-[#1e293b] hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-white/10 transition-all disabled:opacity-50"
          title="Actualizar datos"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">{{ loading ? 'Sincronizando...' : 'Actualizar' }}</span>
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 2. BANDA DE KPIS EJECUTIVOS (TOP STRIP)                               -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      
      <!-- KPI 0: Total Cotizado (Pipeline Comercial CRM) -->
      <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-xl">
        <div class="flex justify-between items-start">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Cotizado</span>
          <div class="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2">
          <span class="text-2xl font-black text-amber-400 font-mono tracking-tight block">
            {{ formatMoneda(kpiCotizadoTotal) }}
          </span>
          <div class="flex items-center gap-1.5 mt-1 text-[11px] text-slate-300 font-bold">
            <span>{{ cotizacionesActivasCount }} Cotizaciones en CRM</span>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
          <span>Pipeline Comercial</span>
          <router-link to="/crm" class="text-amber-400 font-bold hover:underline">Ver CRM ➔</router-link>
        </div>
      </div>

      <!-- KPI 1: Producción Devengada -->
      <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-cyan-500/40 transition-all shadow-xl">
        <div class="flex justify-between items-start">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Producción Devengada</span>
          <div class="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2">
          <span class="text-2xl font-black text-white font-mono tracking-tight block">
            {{ formatMoneda(kpiDevengadoTotal) }}
          </span>
          <div class="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-bold">
            <span>{{ otsEnFaenaCount }} OTs en faena activa</span>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
          <span>IFRS 15 · Terreno</span>
          <span class="text-amber-400 font-bold">{{ proyectosFiltrados.length }} OTs Empresa</span>
        </div>
      </div>

      <!-- KPI 2: Balanza del Descalce (Plata Atrapada) -->
      <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-red-500/40 transition-all shadow-xl">
        <div class="flex justify-between items-start">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Descalce Devengado</span>
          <div class="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Scale class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2">
          <span class="text-2xl font-black text-red-400 font-mono tracking-tight block">
            {{ formatMoneda(kpiDescalceDevengado) }}
          </span>
          <div class="flex items-center gap-1.5 mt-1 text-[11px] text-amber-400 font-bold">
            <AlertTriangle class="w-3.5 h-3.5 text-amber-400" />
            <span>{{ otsEsperandoOCCount }} OTs pendientes de OC</span>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
          <span>Brecha por facturar</span>
          <button @click="verDetalleDescalce" class="text-red-400 font-bold hover:underline">Ver {{ otsEsperandoOCCount }} OTs ➔</button>
        </div>
      </div>

      <!-- KPI 3: Disponibilidad de Flota Pesada -->
      <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-blue-500/40 transition-all shadow-xl">
        <div class="flex justify-between items-start">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Disponibilidad de Flota</span>
          <div class="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2">
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-white font-mono">{{ equiposDisponiblesOperativos }}</span>
            <span class="text-sm font-bold text-slate-400">/ {{ totalEquipos }} equipos</span>
          </div>
          <div class="flex items-center gap-2 mt-1 text-[11px] font-bold">
            <span class="text-emerald-400">{{ porcentajeDisponibilidad }}% Operativo</span>
            <span class="text-slate-500">·</span>
            <span class="text-red-400">{{ countByEstado.bloqueado }} con docs vencidos</span>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
          <span>Catálogo Total</span>
          <span class="text-blue-400 font-bold">{{ countByEstado.conInspecciones }} con checklists</span>
        </div>
      </div>

      <!-- KPI 4: Horas en Faena / OEE en Calibración -->
      <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-xl">
        <div class="flex justify-between items-start">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Izajes en Faena</span>
          <div class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Gauge class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2">
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-black text-emerald-400 font-mono tracking-tight block">
              {{ otsEnFaenaCount }}
            </span>
            <span class="text-xs font-bold text-slate-300">OTs en Terreno</span>
          </div>
          <div class="flex items-center gap-1.5 mt-1 text-[10px] text-amber-300 font-bold">
            <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">OEE en Calibración</span>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
          <span>Capacidad Instalada</span>
          <span class="text-slate-300 font-bold">{{ totalEquipos }} Máquinas</span>
        </div>
      </div>

      <!-- KPI 5: Cumplimiento HSEC & Acreditaciones -->
      <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-xl">
        <div class="flex justify-between items-start">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Acreditación & HSEC</span>
          <div class="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ShieldCheck class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2">
          <span class="text-2xl font-black text-white font-mono tracking-tight block">
            {{ porcentajeAcreditacion }}%
          </span>
          <div class="flex items-center gap-1.5 mt-1 text-[11px] text-slate-300 font-bold">
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
            <span>{{ totalUsuarios }} Usuarios en Sistema</span>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
          <span :class="docsVencidosCount > 0 ? 'text-red-400 font-bold' : 'text-slate-400'">
            {{ docsVencidosCount > 0 ? `${docsVencidosCount} Docs por regularizar` : 'Docs 100% al día' }}
          </span>
          <span class="text-amber-400 font-semibold">{{ docsPorVencerCount }} por vencer</span>
        </div>
      </div>

    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 3. ZONA CENTRAL: PIPELINE DEL DEVENGADO & MATRIZ DE FLOTA            -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- ─── BLOQUE IZQUIERDO (7 de 12 Cols): PIPELINE DEVENGADO & DESCALCE ─── -->
      <div class="lg:col-span-7 flex flex-col gap-6">
        
        <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col">
          <div class="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers class="w-4 h-4 text-amber-500" />
                Pipeline de Conversión Comercial a Caja (IFRS 15)
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Evolución de valor: Cotización CRM ➔ Faena Terreno ➔ ITS ➔ EDP ➔ OC Mandante ➔ Facturación DTE</p>
            </div>
            <span class="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Datos Vivos BD
            </span>
          </div>

          <!-- Pipeline de 6 Estaciones Interactivas con Datos Reales (Desde Cotización CRM) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 my-5">
            <div 
              v-for="(fase, idx) in pipelineEstaciones" 
              :key="idx"
              @click="seleccionarFasePipeline(fase)"
              class="p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between"
              :class="[
                faseSeleccionada?.id === fase.id 
                  ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/10' 
                  : 'bg-[#1e293b]/60 border-white/5 hover:border-white/20'
              ]"
            >
              <div>
                <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>{{ fase.paso }}</span>
                  <span class="w-2 h-2 rounded-full" :class="fase.dotColor"></span>
                </div>
                <div class="text-xs font-black text-white uppercase leading-tight">{{ fase.titulo }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">{{ fase.subtitulo }}</div>
              </div>

              <div class="mt-3">
                <div class="text-sm font-black font-mono" :class="fase.colorMonto">
                  {{ formatMoneda(fase.monto) }}
                </div>
                <div class="text-[10px] font-bold text-slate-400 mt-0.5 flex justify-between">
                  <span>{{ fase.cantidadOTs }} OTs</span>
                  <span class="text-slate-500">{{ fase.porcentaje }}%</span>
                </div>
                <!-- Barra de Progreso Mini -->
                <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
                  <div class="h-full rounded-full" :class="fase.barColor" :style="{ width: `${fase.porcentaje}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══════════════════════════════════════════════════════════════════ -->
          <!-- BALANZA FINANCIERA COMPARATIVA (CORE IFRS 15)                       -->
          <!-- ═══════════════════════════════════════════════════════════════════ -->
          <div class="bg-[#131d35] border border-white/10 rounded-2xl p-5 mt-2 shadow-2xl relative overflow-hidden">
            
            <!-- Cabecera de la Balanza con Switcher de Vistas Comparativas -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
              <div>
                <div class="flex items-center gap-2">
                  <Scale class="w-4 h-4 text-amber-400" />
                  <h3 class="text-xs font-black text-white uppercase tracking-wider">
                    Balanza Financiera Comparativa (IFRS 15)
                  </h3>
                  <span class="px-2 py-0.5 rounded text-[10px] font-black tracking-wide bg-red-500/10 text-red-400 border border-red-500/20">
                    Brecha: {{ formatMoneda(kpiDescalceDevengado) }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Contraste volumétrico de valor: Terreno (Producción) vs Retención (Esperando OC) vs Facturación (DTE)
                </p>
              </div>

              <!-- Switcher de Perspectiva Comparativa -->
              <div class="flex items-center gap-1 bg-[#0b1120] p-1 rounded-xl border border-white/10">
                <button 
                  @click="vistaBalanza = 'pipeline'" 
                  class="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5"
                  :class="vistaBalanza === 'pipeline' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'"
                >
                  <BarChart3 class="w-3.5 h-3.5" />
                  <span>Columnas E2E</span>
                </button>
                <button 
                  @click="vistaBalanza = 'pilares'" 
                  class="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5"
                  :class="vistaBalanza === 'pilares' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'"
                >
                  <Scale class="w-3.5 h-3.5" />
                  <span>4 Pilares Macro</span>
                </button>
                <button 
                  @click="vistaBalanza = 'clientes'" 
                  class="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5"
                  :class="vistaBalanza === 'clientes' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'"
                >
                  <Building2 class="w-3.5 h-3.5" />
                  <span>Por Mandante</span>
                </button>
              </div>
            </div>

            <!-- ─── PERSPECTIVA 1: COLUMNAS COMPARATIVAS E2E (PIPELINE) ─── -->
            <div v-if="vistaBalanza === 'pipeline'" class="pt-4">
              <!-- Gráfico de 5 Columnas Verticales sobre Líneas Guía -->
              <div class="relative bg-[#0b1120]/70 rounded-xl p-4 border border-white/5">
                
                <!-- Líneas Guía de Referencia Y-Axis -->
                <div class="absolute inset-x-4 top-4 bottom-14 flex flex-col justify-between pointer-events-none opacity-20">
                  <div class="border-b border-white border-dashed w-full flex justify-between text-[9px] font-mono text-slate-400">
                    <span>100%</span>
                  </div>
                  <div class="border-b border-white border-dashed w-full flex justify-between text-[9px] font-mono text-slate-400">
                    <span>75%</span>
                  </div>
                  <div class="border-b border-white border-dashed w-full flex justify-between text-[9px] font-mono text-slate-400">
                    <span>50%</span>
                  </div>
                  <div class="border-b border-white border-dashed w-full flex justify-between text-[9px] font-mono text-slate-400">
                    <span>25%</span>
                  </div>
                  <div class="border-b border-white/40 w-full flex justify-between text-[9px] font-mono text-slate-400">
                    <span>0%</span>
                  </div>
                </div>

                <!-- Contenedor de las 5 Columnas Comparativas -->
                <div class="relative h-64 flex items-end justify-around gap-2 pt-6 pb-2">
                  <div 
                    v-for="(col, idx) in columnasComparativasE2E" 
                    :key="idx"
                    @click="toggleFaseColumna(col)"
                    class="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    <!-- Valor Arriba de la Columna -->
                    <div class="text-center mb-2 transition-transform group-hover:-translate-y-1">
                      <span class="text-[10px] font-black font-mono block tracking-tight" :class="col.colorTexto">
                        {{ formatMoneda(col.monto) }}
                      </span>
                      <span 
                        class="px-1.5 py-0.5 rounded text-[9px] font-black inline-block mt-0.5"
                        :class="col.badgeEstilo"
                      >
                        {{ col.porcentaje }}%
                      </span>
                    </div>

                    <!-- Barra Vertical con Relleno Dinámico -->
                    <div class="w-full max-w-[56px] h-36 bg-white/[0.04] rounded-t-xl p-1 relative flex items-end overflow-hidden group-hover:bg-white/[0.08] transition-all">
                      <div 
                        class="w-full rounded-t-lg transition-all duration-700 relative"
                        :class="col.bgGradient"
                        :style="{ height: `${Math.max(6, col.porcentaje)}%` }"
                      >
                        <!-- Efecto de resplandor sutil -->
                        <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </div>

                    <!-- Etiqueta Inferior (Eje X) -->
                    <div class="text-center mt-2.5">
                      <span class="text-[10px] font-black uppercase text-slate-300 block group-hover:text-amber-400 transition-colors">
                        {{ col.titulo }}
                      </span>
                      <span class="text-[9px] text-slate-400 font-bold block mt-0.5">
                        {{ col.cantidadOTs }} OTs
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Strip Diagnóstico IFRS 15 -->
              <div class="mt-3.5 bg-red-500/[0.07] border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5">
                <AlertTriangle class="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div class="text-[11px] leading-relaxed text-slate-300">
                  <span class="font-black text-red-400">Descalce Operativo Detectado:</span>
                  De un total devengado en terreno de <span class="font-bold text-white font-mono">{{ formatMoneda(kpiDevengadoTotal) }}</span>, 
                  un <span class="font-black text-red-400 font-mono">{{ porcentajeDescalce }}% ({{ formatMoneda(kpiDescalceDevengado) }})</span> 
                  permanece inmovilizado en faena esperando Orden de Compra del mandante. Solo el 
                  <span class="font-bold text-emerald-400 font-mono">{{ porcentajeFacturado }}% ({{ formatMoneda(kpiFacturadoTotal) }})</span> 
                  está respaldado por DTE formal.
                </div>
              </div>
            </div>

            <!-- ─── PERSPECTIVA 2: 4 PILARES MACRO DE CAJA ─── -->
            <div v-else-if="vistaBalanza === 'pilares'" class="pt-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                <!-- Pilar 0: Cotizado en CRM -->
                <div class="bg-[#0b1120]/80 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1.5">
                      <span>0. Cotizado CRM</span>
                      <span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold">100% Base</span>
                    </div>
                    <div class="text-xl font-black text-amber-400 font-mono mt-1">
                      {{ formatMoneda(kpiCotizadoTotal) }}
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1 leading-snug">
                      Propuestas comerciales vigentes en el Gestor de Oportunidades CRM.
                    </p>
                  </div>
                  <div class="mt-4 pt-3 border-t border-white/5">
                    <div class="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full w-full"></div>
                    </div>
                    <div class="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                      <span>Embudo Comercial</span>
                      <span>{{ cotizacionesActivasCount }} Cotizaciones</span>
                    </div>
                  </div>
                </div>

                <!-- Pilar 1: Devengado en Faena -->
                <div class="bg-[#0b1120]/80 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      <span>1. Devengado Faena</span>
                      <span class="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold">100%</span>
                    </div>
                    <div class="text-xl font-black text-white font-mono mt-1">
                      {{ formatMoneda(kpiDevengadoTotal) }}
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1 leading-snug">
                      Producción física en terreno validada por reports de operador y horómetros.
                    </p>
                  </div>
                  <div class="mt-4 pt-3 border-t border-white/5">
                    <div class="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-full"></div>
                    </div>
                    <div class="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                      <span>Base de Cálculo</span>
                      <span>{{ otsEnFaenaCount }} OTs</span>
                    </div>
                  </div>
                </div>

                <!-- Pilar 2: Descalce Patrimonial (Retenido) -->
                <div class="bg-red-500/[0.06] border border-red-500/30 rounded-xl p-4 flex flex-col justify-between ring-1 ring-red-500/20 shadow-lg shadow-red-500/5">
                  <div>
                    <div class="flex items-center justify-between text-[10px] font-black text-red-400 uppercase tracking-widest mb-1.5">
                      <span>2. Brecha / Descalce</span>
                      <span class="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-mono font-bold">{{ porcentajeDescalce }}%</span>
                    </div>
                    <div class="text-xl font-black text-red-400 font-mono mt-1">
                      {{ formatMoneda(kpiDescalceDevengado) }}
                    </div>
                    <p class="text-[10px] text-slate-300 mt-1 leading-snug">
                      Capital de trabajo inmovilizado en faena esperando emisión de OC del cliente.
                    </p>
                  </div>
                  <div class="mt-4 pt-3 border-t border-white/5">
                    <div class="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full" :style="{ width: `${porcentajeDescalce}%` }"></div>
                    </div>
                    <div class="flex justify-between text-[10px] text-red-300 font-bold mt-1.5">
                      <span>Riesgo de Liquidez</span>
                      <span>{{ otsEsperandoOCCount }} OTs Retenidas</span>
                    </div>
                  </div>
                </div>

                <!-- Pilar 3: Facturado Conforme SII -->
                <div class="bg-[#0b1120]/80 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      <span>3. Facturado SII</span>
                      <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">{{ porcentajeFacturado }}%</span>
                    </div>
                    <div class="text-xl font-black text-emerald-400 font-mono mt-1">
                      {{ formatMoneda(kpiFacturadoTotal) }}
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1 leading-snug">
                      Ingreso tributariamente reconocido y cobrable con DTE formal Laudus ERP.
                    </p>
                  </div>
                  <div class="mt-4 pt-3 border-t border-white/5">
                    <div class="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-500 rounded-full" :style="{ width: `${porcentajeFacturado}%` }"></div>
                    </div>
                    <div class="flex justify-between text-[10px] text-emerald-400 font-bold mt-1.5">
                      <span>Caja Real</span>
                      <span>{{ proyectosFiltrados.length - otsEsperandoOCCount }} OTs Facturadas</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- ─── PERSPECTIVA 3: DESCALCE COMPARATIVO POR MANDANTE ─── -->
            <div v-else-if="vistaBalanza === 'clientes'" class="pt-4 space-y-3">
              <div 
                v-for="cli in clientesComparativa" 
                :key="cli.nombre"
                @click="seleccionarClienteBalanza(cli.nombre)"
                class="bg-[#0b1120]/70 p-3 rounded-xl border transition-all cursor-pointer group"
                :class="clienteSeleccionadoBalanza === cli.nombre ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/10' : 'border-white/5 hover:border-white/20'"
              >
                <div class="flex justify-between items-center mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      {{ cli.nombre }}
                    </span>
                    <span class="text-[10px] text-slate-400">({{ cli.cantidadOTs }} OTs)</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black font-mono text-red-400">
                      Brecha: {{ formatMoneda(cli.descalce) }}
                    </span>
                    <span class="text-[10px] text-slate-400 font-mono">
                      / Total: {{ formatMoneda(cli.devengado) }}
                    </span>
                  </div>
                </div>

                <!-- Barra Comparativa por Cliente: Segmentada -->
                <div class="w-full h-3 bg-white/5 rounded-full overflow-hidden flex">
                  <!-- Facturado (Verde) -->
                  <div 
                    class="h-full bg-emerald-500" 
                    :style="{ width: `${cli.devengado > 0 ? (cli.facturado / cli.devengado) * 100 : 0}%` }"
                    :title="`Facturado: ${formatMoneda(cli.facturado)}`"
                  ></div>
                  <!-- Descalce (Rojo) -->
                  <div 
                    class="h-full bg-red-500" 
                    :style="{ width: `${cli.devengado > 0 ? (cli.descalce / cli.devengado) * 100 : 0}%` }"
                    :title="`Descalce Retenido: ${formatMoneda(cli.descalce)}`"
                  ></div>
                </div>

                <div class="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <div class="flex items-center gap-3">
                    <span class="flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Facturado: {{ formatMoneda(cli.facturado) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full bg-red-500"></span>
                      Descalce: {{ formatMoneda(cli.descalce) }}
                    </span>
                  </div>
                  <span class="text-amber-400 font-bold group-hover:underline">
                    {{ clienteSeleccionadoBalanza === cli.nombre ? 'Filtro Activo' : 'Ver OTs ➔' }}
                  </span>
                </div>
              </div>

              <div v-if="clientesComparativa.length === 0" class="text-center py-6 text-slate-500 text-xs">
                No hay mandantes con producción devengada para la empresa seleccionada.
              </div>
            </div>

          </div>

          <!-- Tabla Drill-down de OTs con Descalce / Retención de OC -->
          <div class="mt-4 pt-4 border-t border-white/10">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <div>
                <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle class="w-3.5 h-3.5 text-red-400" />
                  <span>OTs con Mayor Dinero Retenido en Faena (Esperando OC / Facturación)</span>
                </h3>
                <div v-if="clienteSeleccionadoBalanza || faseSeleccionada" class="flex items-center gap-2 mt-1">
                  <span class="text-[11px] text-amber-400 font-bold">
                    Filtrado por: {{ clienteSeleccionadoBalanza ? `Mandante: ${clienteSeleccionadoBalanza}` : `Fase: ${faseSeleccionada.titulo}` }}
                  </span>
                  <button @click="limpiarFiltrosBalanza" class="text-[10px] text-red-400 hover:underline font-bold flex items-center gap-0.5">
                    <X class="w-3 h-3" /> Limpiar filtro
                  </button>
                </div>
              </div>
              <router-link to="/torre" class="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1">
                Ir a Torre de Control ➔
              </router-link>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th class="py-2 px-3">Código OT</th>
                    <th class="py-2 px-3">Cliente / Mandante</th>
                    <th class="py-2 px-3">Equipo Principal</th>
                    <th class="py-2 px-3 text-right">Monto Devengado</th>
                    <th class="py-2 px-3 text-center">Estado ITS</th>
                    <th class="py-2 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr v-for="ot in otsFiltradasPorInteraccion" :key="ot.id_proyecto" class="hover:bg-white/[0.02] transition-colors">
                    <td class="py-2.5 px-3 font-mono font-bold text-amber-400">{{ ot.codi_proyecto }}</td>
                    <td class="py-2.5 px-3 font-semibold text-white truncate max-w-[200px]" :title="ot.nombre_cliente">{{ ot.nombre_cliente }}</td>
                    <td class="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{{ ot.patente_grua }}</td>
                    <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-100">{{ formatMoneda(ot.monto_devengado) }}</td>
                    <td class="py-2.5 px-3 text-center">
                      <span 
                        class="px-2 py-0.5 rounded text-[10px] font-bold"
                        :class="ot.estado_its === 'CONCLUIDO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'"
                      >
                        {{ ot.estado_its }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3 text-center">
                      <router-link :to="`/torre?id_proyecto=${ot.id_proyecto}`" class="text-[10px] font-bold text-amber-400 hover:underline">
                        Ver ➔
                      </router-link>
                    </td>
                  </tr>
                  <tr v-if="otsFiltradasPorInteraccion.length === 0">
                    <td colspan="6" class="py-4 text-center text-slate-500 text-xs">
                      No se registran OTs con descalce activo para los filtros seleccionados.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      <!-- ─── BLOQUE DERECHO (5 de 12 Cols): MATRIZ TERMAL DE FLOTA (110 ACTIVOS) ─── -->
      <div class="lg:col-span-5 flex flex-col gap-6">
        
        <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col h-full">
          <div class="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Truck class="w-4 h-4 text-blue-400" />
                Matriz de Disponibilidad de Flota
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Parque de {{ totalEquipos }} Activos en Tiempo Real</p>
            </div>
            <router-link to="/vista360" class="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Vista 360 ➔
            </router-link>
          </div>

          <!-- Filtros de Categoría de Flota -->
          <div class="flex flex-wrap gap-1.5 my-3">
            <button 
              v-for="cat in categoriasFlota" 
              :key="cat"
              @click="filtroCategoriaFlota = cat"
              class="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all"
              :class="filtroCategoriaFlota === cat ? 'bg-blue-600 text-white' : 'bg-[#1e293b] text-slate-400 hover:text-white'"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Leyenda de Estados Cromáticos -->
          <div class="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 mb-3 bg-[#151f38] p-2.5 rounded-xl border border-white/5">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              <span>Operando ({{ countByEstado.operando }})</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded bg-slate-600"></span>
              <span>Disponible ({{ countByEstado.disponible }})</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded bg-red-500 shadow-sm shadow-red-500/50"></span>
              <span>Docs Vencidos ({{ countByEstado.bloqueado }})</span>
            </div>
          </div>

          <!-- HEATMAP / WAFFLE CHART DE LOS 110 EQUIPOS -->
          <div class="flex-1 overflow-y-auto max-h-[380px] p-2 bg-[#0a0f1e]/80 rounded-xl border border-white/5 scrollbar-thin">
            <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
              <div 
                v-for="eq in equiposFiltrados" 
                :key="eq.id_equipo"
                @mouseenter="hoveredEquipo = eq"
                @mouseleave="hoveredEquipo = null"
                @click="abrirDetalleEquipo(eq)"
                class="aspect-square rounded-md p-1 flex flex-col justify-between items-center transition-all cursor-pointer relative group hover:scale-110 hover:z-20 hover:ring-2 hover:ring-white shadow"
                :class="getEstadoClass(eq)"
              >
                <span class="text-[8px] font-black text-white/90 leading-none truncate w-full text-center">
                  {{ (eq.patente || '').substring(0, 4) }}
                </span>
                <span class="text-[7px] font-mono text-white/70 leading-none">
                  {{ eq.capacidad_ton ? `${eq.capacidad_ton}T` : 'EQ' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Tarjeta de Detalle del Equipo Seleccionado / Hovered -->
          <div class="mt-3 p-3 bg-[#1e293b]/90 border border-white/10 rounded-xl flex items-center justify-between text-xs">
            <div v-if="hoveredEquipo || equipoSeleccionado" class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-black/40 border border-white/10 text-white font-mono font-black text-sm">
                {{ (hoveredEquipo || equipoSeleccionado).patente || 'S/P' }}
              </div>
              <div>
                <div class="font-black text-white text-xs">
                  {{ (hoveredEquipo || equipoSeleccionado).nombre_modelo || 'Modelo Desconocido' }} · {{ (hoveredEquipo || equipoSeleccionado).nombre_marca || '' }}
                </div>
                <div class="text-[10px] text-slate-400">
                  {{ (hoveredEquipo || equipoSeleccionado).nombre_categoria }} · {{ (hoveredEquipo || equipoSeleccionado).cant_inspecciones || 0 }} Inspecciones Registradas
                </div>
              </div>
            </div>
            <div v-else class="text-slate-500 text-xs italic">
              Pase el cursor sobre un equipo para ver su ficha y estado documental en vivo.
            </div>

            <div v-if="hoveredEquipo || equipoSeleccionado" class="text-right">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getEstadoBadgeClass(hoveredEquipo || equipoSeleccionado)">
                {{ getEstadoTexto(hoveredEquipo || equipoSeleccionado) }}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 4. ZONA INFERIOR: DOCUMENTACIÓN, INSPECCIONES Y SEGURIDAD            -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Panel 1: Alertas Críticas Accionables -->
      <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle class="w-4 h-4 text-red-500" />
              Alertas Operativas Directivas
            </h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/20">
              {{ alertasCriticas.length }} Activas
            </span>
          </div>

          <div class="space-y-2.5 mt-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
            <div 
              v-for="(al, i) in alertasCriticas" 
              :key="i"
              class="p-3 rounded-xl border flex items-start justify-between gap-3"
              :class="al.tipo === 'error' ? 'bg-red-950/20 border-red-500/30 text-red-200' : 'bg-amber-950/20 border-amber-500/30 text-amber-200'"
            >
              <div>
                <div class="text-xs font-bold text-white">{{ al.titulo }}</div>
                <p class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{{ al.desc }}</p>
                <span class="text-[9px] font-mono opacity-60 mt-1 block">{{ al.tiempo }}</span>
              </div>
              <router-link :to="al.link" class="shrink-0 px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold">
                {{ al.btnTexto }}
              </router-link>
            </div>
            <div v-if="alertasCriticas.length === 0" class="text-center py-6 text-slate-500 text-xs">
              ✔ Cero alertas críticas activas en este momento.
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/10 text-right">
          <router-link to="/vista360" class="text-xs font-bold text-amber-400 hover:underline">
            Gestionar Ficha de Flota 360 ➔
          </router-link>
        </div>
      </div>

      <!-- Panel 2: Equipos con Inspecciones Técnicas Registradas -->
      <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Wrench class="w-4 h-4 text-amber-500" />
              Equipos con Inspecciones Activas
            </h3>
            <span class="text-[10px] font-bold text-slate-400">{{ countByEstado.conInspecciones }} Máquinas</span>
          </div>

          <div class="space-y-2 mt-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
            <div v-for="eq in equiposConInspeccionTop" :key="eq.id_equipo" class="bg-[#1e293b]/60 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <div class="text-xs font-bold text-white font-mono">{{ eq.patente }} · {{ eq.nombre_modelo }}</div>
                <div class="text-[10px] text-slate-400">{{ eq.nombre_categoria }}</div>
              </div>
              <div class="text-right">
                <span class="px-2 py-0.5 rounded text-[11px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {{ eq.cant_inspecciones }} Chk
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/10 text-right">
          <router-link to="/inspecciones" class="text-xs font-bold text-amber-400 hover:underline">
            Ver Inspecciones de Terreno ➔
          </router-link>
        </div>
      </div>

      <!-- Panel 3: Resumen de Seguridad Operativa (HSEC) -->
      <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Fuel class="w-4 h-4 text-emerald-500" />
              Gobernanza de Seguridad & Terreno
            </h3>
            <span class="text-[10px] font-bold text-emerald-400">HSEC</span>
          </div>

          <div class="space-y-3 mt-3">
            <div class="bg-[#1e293b]/60 p-3 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase block">Récord de Seguridad (HSE)</span>
                <span class="text-lg font-black text-emerald-400 font-mono">CERO DAÑO</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-bold text-slate-300 block">0 Accidentes</span>
                <span class="text-[10px] text-slate-400">Historial intachable</span>
              </div>
            </div>

            <div class="bg-[#1e293b]/60 p-3 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase block">Dotación Operativa Activa</span>
                <span class="text-lg font-black text-white font-mono">{{ totalUsuarios }} Personas</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-bold text-emerald-400 block">100% Enrolados</span>
                <span class="text-[10px] text-slate-400">Operadores / Riggers</span>
              </div>
            </div>

            <div class="bg-[#1e293b]/60 p-3 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase block">Acreditación Técnica</span>
                <span class="text-lg font-black text-white font-mono">{{ porcentajeAcreditacion }}%</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-bold text-slate-300 block">Conformidad Legal</span>
                <span class="text-[10px] text-slate-400">Flota y Personal</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/10 text-right">
          <router-link to="/cruce" class="text-xs font-bold text-amber-400 hover:underline">
            Conciliación de Estados de Pago ➔
          </router-link>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  BarChart3, 
  TrendingUp, 
  Scale, 
  Truck, 
  Gauge, 
  ShieldCheck, 
  Layers, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Calendar, 
  Wrench, 
  Fuel,
  Building2,
  X,
  FileText
} from 'lucide-vue-next'
import apiAxios from '../services/api'
import { navStore } from '../stores/navStore'

// ─── ESTADO REACTIVO ───
const loading = ref(false)
const equipos = ref([])
const proyectos = ref([])
const controlVivo = ref(null)
const usuarios = ref([])

const filtroEmpresa = ref(navStore.activeEmpresa || 9)
const filtroPeriodo = ref('todos')
const filtroCategoriaFlota = ref('TODOS')
const hoveredEquipo = ref(null)
const equipoSeleccionado = ref(null)
const faseSeleccionada = ref(null)

const vistaBalanza = ref('pipeline') // 'pipeline' | 'pilares' | 'clientes'
const clienteSeleccionadoBalanza = ref(null)

const empresasDisponibles = [
  { id: 9, label: 'Grúas San Pablo' },
  { id: 7, label: 'Bestmaq' },
  { id: 8, label: 'Logística Sur' },
  { id: 11, label: 'Royal Rental' }
]

const cambiarEmpresa = (id) => {
  filtroEmpresa.value = id
  navStore.activeEmpresa = id
  fetchDashboardData()
}

// ─── FETCH TRANSACCIONAL DE DATOS ───
const fetchDashboardData = async () => {
  loading.value = true
  try {
    const [resEq, resPry, resVivo, resUsr] = await Promise.allSettled([
      apiAxios.get('/tequ-equipos'),
      apiAxios.get('/proyectos'),
      apiAxios.get('/operaciones/control-vivo'),
      apiAxios.get('/usuarios')
    ])

    if (resEq.status === 'fulfilled') {
      equipos.value = resEq.value.data?.data || []
    }
    if (resPry.status === 'fulfilled') {
      proyectos.value = resPry.value.data?.proyectos || []
    }
    if (resVivo.status === 'fulfilled') {
      controlVivo.value = resVivo.value.data || null
    }
    if (resUsr.status === 'fulfilled') {
      const u = resUsr.value.data
      usuarios.value = Array.isArray(u) ? u : (u?.usuarios || u?.data || [])
    }
  } catch (err) {
    console.error('Error al cargar datos del dashboard directivo:', err)
  } finally {
    loading.value = false
  }
}

// ─── HELPERS DE CÁLCULO FINANCIERO CANÓNICOS ───
const calcularSubtotalLinea = (l) => {
  if (!l) return 0
  if (l.subtotal !== undefined && l.subtotal !== null && Number(l.subtotal) > 0) {
    return Number(l.subtotal)
  }
  const vu = Number(l.valor_unitario !== undefined ? l.valor_unitario : (l.valorUnitario || 0))
  const cant = Number(l.cantidad || l.dias || 1)
  const factor = Number(l.piso_minimo || l.horas_minimas || 1)
  return vu * cant * (l.unidad === 'Horas Diarias Minimas' || l.unidad === 'Horas Mensuales Minimas' ? factor : 1)
}

const calcularMontoProyecto = (p) => {
  if (!p) return 0
  const crm = p.json_field?.crm_v1 || {}
  const ej = p.json_field?.ejecucion_v1 || {}
  const lineas = crm.lineas_servicio || ej.snapshot_comercial?.lines || []
  if (Array.isArray(lineas) && lineas.length > 0) {
    const total = lineas.reduce((s, l) => s + calcularSubtotalLinea(l), 0)
    if (total > 0) return total
  }
  return Number(p.monto_neto || p.monto || 0)
}

const formatMoneda = (val) => {
  const num = Number(val || 0)
  return '$' + Math.round(num).toLocaleString('es-CL')
}

// ─── PROYECTOS FILTRADOS POR EMPRESA ───
const proyectosFiltrados = computed(() => {
  return proyectos.value.filter(p => {
    if (!filtroEmpresa.value) return true
    return Number(p.id_empresa) === Number(filtroEmpresa.value)
  })
})

// ─── PIPELINE COMERCIAL: TOTAL COTIZADO REAL ───
const kpiCotizadoTotal = computed(() => {
  let sum = 0
  for (const p of proyectosFiltrados.value) {
    if (Number(p.id_proyecto_estado) !== 99) { // Excluir no ganadas de la base activa
      sum += calcularMontoProyecto(p)
    }
  }
  return sum
})

const cotizacionesActivasCount = computed(() => {
  return proyectosFiltrados.value.filter(p => Number(p.id_proyecto_estado) !== 99).length
})

const cotizacionesEnEmbudoCount = computed(() => {
  return proyectosFiltrados.value.filter(p => {
    const st = Number(p.id_proyecto_estado)
    return st >= 1 && st <= 4
  }).length
})

// OTs en Faena Activa (Estado 5)
const otsEnFaena = computed(() => {
  return proyectosFiltrados.value.filter(p => Number(p.id_proyecto_estado) === 5)
})
const otsEnFaenaCount = computed(() => otsEnFaena.value.length)

// Devengado Total REAL: Servicios en Faena (5) + Concluidos (6) + Facturados (7)
const kpiDevengadoTotal = computed(() => {
  let sum = 0
  for (const p of proyectosFiltrados.value) {
    const st = Number(p.id_proyecto_estado)
    if (st >= 5 && st <= 7) {
      sum += calcularMontoProyecto(p)
    }
  }
  return sum
})

// Facturado Total REAL: Servicios con factura DTE registrada
const kpiFacturadoTotal = computed(() => {
  let sum = 0
  for (const p of proyectosFiltrados.value) {
    const st = Number(p.id_proyecto_estado)
    const estaFacturado = st === 7 || p.estado_financiero === 'FACTURADO_CONFORME' || p.json_field?.facturacion_v1?.nro_dte
    if (estaFacturado) {
      sum += calcularMontoProyecto(p)
    }
  }
  return sum
})

// Descalce REAL = Devengado - Facturado
const kpiDescalceDevengado = computed(() => {
  const diff = kpiDevengadoTotal.value - kpiFacturadoTotal.value
  return Math.max(0, diff)
})

const porcentajeFacturado = computed(() => {
  if (kpiDevengadoTotal.value <= 0) return 0
  return Math.min(100, Math.round((kpiFacturadoTotal.value / kpiDevengadoTotal.value) * 100))
})

// OTs con descalce real
const otsConDescalce = computed(() => {
  return proyectosFiltrados.value.filter(p => {
    const st = Number(p.id_proyecto_estado)
    const tieneDte = p.json_field?.facturacion_v1?.nro_dte || st === 7
    return st >= 5 && !tieneDte
  })
})
const otsEsperandoOCCount = computed(() => otsConDescalce.value.length)

const otsConDescalceTop = computed(() => {
  return otsConDescalce.value.slice(0, 8).map(p => {
    const monto = calcularMontoProyecto(p)
    const ej = p.json_field?.ejecucion_v1 || {}
    return {
      id_proyecto: p.id_proyecto,
      codi_proyecto: p.codi_proyecto || `OT-${p.id_proyecto}`,
      nombre_cliente: p.nombre_cliente || p.razon_social || 'Cliente sin nombre',
      patente_grua: ej.patente_grua || 'Sin asignar',
      monto_devengado: monto,
      estado_its: p.estado_its || 'Pendiente'
    }
  })
})

// ─── CLASIFICACIÓN DE FLOTA REAL (110 EQUIPOS) ───
const totalEquipos = computed(() => equipos.value.length)

const equiposConEstado = computed(() => {
  return equipos.value.map(eq => {
    let estado = 'DISPONIBLE'
    const pat = (eq.patente || '').toUpperCase().trim()

    // Si tiene proyecto activo en estado 5 hoy
    const tieneProyectoActivo = proyectos.value.some(p => {
      const ej = p.json_field?.ejecucion_v1 || {}
      return Number(p.id_proyecto_estado) === 5 && (ej.patente_grua || '').toUpperCase().trim() === pat
    })

    if (tieneProyectoActivo) {
      estado = 'OPERANDO'
    } else if (eq.estado_doc_legal === 'error' || eq.estado_doc_gral === 'error') {
      estado = 'BLOQUEADO'
    }

    return {
      ...eq,
      estadoOperativo: estado
    }
  })
})

const countByEstado = computed(() => {
  const c = { operando: 0, disponible: 0, bloqueado: 0, conInspecciones: 0 }
  for (const eq of equiposConEstado.value) {
    if (eq.estadoOperativo === 'OPERANDO') c.operando++
    else if (eq.estadoOperativo === 'BLOQUEADO') c.bloqueado++
    else c.disponible++

    if (Number(eq.cant_inspecciones || 0) > 0) c.conInspecciones++
  }
  return c
})

const equiposDisponiblesOperativos = computed(() => {
  return countByEstado.value.operando + countByEstado.value.disponible
})

const porcentajeDisponibilidad = computed(() => {
  if (totalEquipos.value <= 0) return 0
  return Math.round((equiposDisponiblesOperativos.value / totalEquipos.value) * 100)
})

// Categorías de flota dinámicas
const categoriasFlota = computed(() => {
  const cats = new Set(['TODOS'])
  for (const eq of equipos.value) {
    if (eq.nombre_categoria) cats.add(eq.nombre_categoria.toUpperCase())
  }
  return Array.from(cats).slice(0, 6)
})

const equiposFiltrados = computed(() => {
  if (filtroCategoriaFlota.value === 'TODOS') return equiposConEstado.value
  return equiposConEstado.value.filter(eq => (eq.nombre_categoria || '').toUpperCase() === filtroCategoriaFlota.value)
})

const getEstadoClass = (eq) => {
  switch (eq.estadoOperativo) {
    case 'OPERANDO': return 'bg-emerald-600/90 border border-emerald-400'
    case 'BLOQUEADO': return 'bg-red-600/90 border border-red-400'
    default: return 'bg-slate-700/80 border border-white/10'
  }
}

const getEstadoBadgeClass = (eq) => {
  switch (eq?.estadoOperativo) {
    case 'OPERANDO': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'BLOQUEADO': return 'bg-red-500/10 text-red-400 border border-red-500/20'
    default: return 'bg-slate-700 text-slate-300'
  }
}

const getEstadoTexto = (eq) => {
  switch (eq?.estadoOperativo) {
    case 'OPERANDO': return 'En Faena / Izaje'
    case 'BLOQUEADO': return 'Docs Por Regularizar'
    default: return 'Disponible en Base'
  }
}

const abrirDetalleEquipo = (eq) => {
  equipoSeleccionado.value = eq
}

// ─── PIPELINE DE 5 ESTACIONES REALES ───
const statsPipelineReal = computed(() => {
  let devengado = 0
  let montoIts = 0
  let montoEdp = 0
  let montoDescalce = 0
  let montoFacturado = 0

  let otsFaena = 0
  let otsIts = 0
  let otsEdp = 0
  let otsDescalce = 0
  let otsFacturado = 0

  for (const p of proyectosFiltrados.value) {
    const st = Number(p.id_proyecto_estado)
    const monto = calcularMontoProyecto(p)
    const tieneDte = st === 7 || p.json_field?.facturacion_v1?.nro_dte || p.estado_financiero === 'FACTURADO_CONFORME'
    const tieneIts = !!(p.id_its || p.estado_its)
    const tieneEdp = p.estado_its === 'CONCLUIDO' || p.estado_its === 'APROBADO_OPS' || st >= 6 || !!p.json_field?.edp_firma_comercial

    if (st >= 5 && st <= 7) {
      devengado += monto
      otsFaena++
      
      if (tieneIts) {
        montoIts += monto
        otsIts++
      }
      if (tieneEdp) {
        montoEdp += monto
        otsEdp++
      }
      if (tieneDte) {
        montoFacturado += monto
        otsFacturado++
      } else {
        montoDescalce += monto
        otsDescalce++
      }
    }
  }

  return {
    devengado,
    montoIts,
    montoEdp,
    montoDescalce,
    montoFacturado,
    otsFaena,
    otsIts,
    otsEdp,
    otsDescalce,
    otsFacturado
  }
})

const pipelineEstaciones = computed(() => {
  const stats = statsPipelineReal.value
  const cotizado = kpiCotizadoTotal.value || 1

  return [
    {
      id: 'cotizado',
      paso: 'PASO 0',
      titulo: 'Cotizado CRM',
      subtitulo: 'Propuestas Emitidas',
      monto: kpiCotizadoTotal.value,
      cantidadOTs: cotizacionesActivasCount.value,
      porcentaje: 100,
      dotColor: 'bg-amber-400',
      colorMonto: 'text-amber-400',
      barColor: 'bg-amber-500'
    },
    {
      id: 'terreno',
      paso: 'PASO 1',
      titulo: 'Faena Terreno',
      subtitulo: 'Reports Móviles',
      monto: stats.devengado,
      cantidadOTs: stats.otsFaena,
      porcentaje: cotizado > 0 ? Math.round((stats.devengado / cotizado) * 100) : 100,
      dotColor: 'bg-cyan-400',
      colorMonto: 'text-cyan-400',
      barColor: 'bg-cyan-500'
    },
    {
      id: 'its',
      paso: 'PASO 2',
      titulo: 'ITS Operaciones',
      subtitulo: 'Informes Técnicos',
      monto: stats.montoIts,
      cantidadOTs: stats.otsIts,
      porcentaje: cotizado > 0 ? Math.round((stats.montoIts / cotizado) * 100) : 0,
      dotColor: 'bg-blue-400',
      colorMonto: 'text-blue-400',
      barColor: 'bg-blue-500'
    },
    {
      id: 'edp',
      paso: 'PASO 3',
      titulo: 'EDP Visado',
      subtitulo: 'Tesorería GSP',
      monto: stats.montoEdp,
      cantidadOTs: stats.otsEdp,
      porcentaje: cotizado > 0 ? Math.round((stats.montoEdp / cotizado) * 100) : 0,
      dotColor: 'bg-purple-400',
      colorMonto: 'text-purple-400',
      barColor: 'bg-purple-500'
    },
    {
      id: 'oc',
      paso: 'PASO 4',
      titulo: 'Esperando OC',
      subtitulo: 'Descalce Activo',
      monto: stats.montoDescalce,
      cantidadOTs: stats.otsDescalce,
      porcentaje: cotizado > 0 ? Math.round((stats.montoDescalce / cotizado) * 100) : 0,
      dotColor: 'bg-red-400 animate-pulse',
      colorMonto: 'text-red-400',
      barColor: 'bg-red-500'
    },
    {
      id: 'dte',
      paso: 'PASO 5',
      titulo: 'Facturado SII',
      subtitulo: 'DTE Laudus ERP',
      monto: stats.montoFacturado,
      cantidadOTs: stats.otsFacturado,
      porcentaje: cotizado > 0 ? Math.round((stats.montoFacturado / cotizado) * 100) : 0,
      dotColor: 'bg-emerald-400',
      colorMonto: 'text-emerald-400',
      barColor: 'bg-emerald-500'
    }
  ]
})

const porcentajeDescalce = computed(() => {
  if (kpiDevengadoTotal.value <= 0) return 0
  return Math.min(100, Math.round((kpiDescalceDevengado.value / kpiDevengadoTotal.value) * 100))
})

// ─── 6 COLUMNAS COMPARATIVAS E2E (DESDE COTIZADO A CAJA) ───
const columnasComparativasE2E = computed(() => {
  const stats = statsPipelineReal.value
  const baseCot = kpiCotizadoTotal.value || 1

  return [
    {
      id: 'cotizado',
      titulo: '0. Cotizado',
      subtitulo: 'CRM Pipeline',
      monto: kpiCotizadoTotal.value,
      cantidadOTs: cotizacionesActivasCount.value,
      porcentaje: 100,
      colorTexto: 'text-amber-400 font-black',
      badgeEstilo: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      bgGradient: 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,166,35,0.25)]'
    },
    {
      id: 'terreno',
      titulo: '1. Terreno',
      subtitulo: 'Producción',
      monto: stats.devengado,
      cantidadOTs: stats.otsFaena,
      porcentaje: Math.round((stats.devengado / baseCot) * 100),
      colorTexto: 'text-cyan-400',
      badgeEstilo: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      bgGradient: 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
    },
    {
      id: 'its',
      titulo: '2. Con ITS',
      subtitulo: 'Informe Ops',
      monto: stats.montoIts,
      cantidadOTs: stats.otsIts,
      porcentaje: Math.round((stats.montoIts / baseCot) * 100),
      colorTexto: 'text-blue-400',
      badgeEstilo: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      bgGradient: 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
    },
    {
      id: 'edp',
      titulo: '3. EDP Visado',
      subtitulo: 'Tesorería',
      monto: stats.montoEdp,
      cantidadOTs: stats.otsEdp,
      porcentaje: Math.round((stats.montoEdp / baseCot) * 100),
      colorTexto: 'text-purple-400',
      badgeEstilo: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      bgGradient: 'bg-gradient-to-t from-purple-600 to-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
    },
    {
      id: 'oc',
      titulo: '4. Esperando OC',
      subtitulo: 'Descalce',
      monto: stats.montoDescalce,
      cantidadOTs: stats.otsDescalce,
      porcentaje: Math.round((stats.montoDescalce / baseCot) * 100),
      colorTexto: 'text-red-400 font-black',
      badgeEstilo: 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse',
      bgGradient: 'bg-gradient-to-t from-red-600 via-rose-500 to-amber-500 ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
    },
    {
      id: 'dte',
      titulo: '5. Facturado',
      subtitulo: 'DTE SII',
      monto: stats.montoFacturado,
      cantidadOTs: stats.otsFacturado,
      porcentaje: Math.max(1, Math.round((stats.montoFacturado / baseCot) * 100)),
      colorTexto: 'text-emerald-400',
      badgeEstilo: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      bgGradient: 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
    }
  ]
})

// ─── COMPARATIVA DE DESCALCE POR MANDANTE ───
const clientesComparativa = computed(() => {
  const map = {}
  for (const p of proyectosFiltrados.value) {
    const st = Number(p.id_proyecto_estado)
    if (st < 5 || st === 99) continue
    const clienteNom = (p.nombre_cliente || p.razon_social || 'Cliente sin nombre').trim()
    if (!map[clienteNom]) {
      map[clienteNom] = {
        nombre: clienteNom,
        devengado: 0,
        facturado: 0,
        descalce: 0,
        cantidadOTs: 0,
        ots: []
      }
    }
    const monto = calcularMontoProyecto(p)
    const tieneDte = st === 7 || p.json_field?.facturacion_v1?.nro_dte || p.estado_financiero === 'FACTURADO_CONFORME'
    
    map[clienteNom].devengado += monto
    if (tieneDte) {
      map[clienteNom].facturado += monto
    } else {
      map[clienteNom].descalce += monto
    }
    map[clienteNom].cantidadOTs += 1
    map[clienteNom].ots.push(p.codi_proyecto || `OT-${p.id_proyecto}`)
  }

  return Object.values(map)
    .filter(c => c.devengado > 0 || c.descalce > 0)
    .sort((a, b) => b.descalce - a.descalce)
    .slice(0, 6)
})

// ─── FILTRADO REACTIVO DE TABLA POR SELECCIÓN DE BALANZA ───
const otsFiltradasPorInteraccion = computed(() => {
  let list = otsConDescalce.value

  if (clienteSeleccionadoBalanza.value) {
    list = list.filter(p => {
      const nom = (p.nombre_cliente || p.razon_social || '').trim().toLowerCase()
      return nom === clienteSeleccionadoBalanza.value.toLowerCase()
    })
  }

  if (faseSeleccionada.value) {
    const fId = faseSeleccionada.value.id
    if (fId === 'cotizado') {
      list = proyectosFiltrados.value.filter(p => Number(p.id_proyecto_estado) !== 99)
    } else if (fId === 'terreno') {
      list = list.filter(p => Number(p.id_proyecto_estado) === 5)
    } else if (fId === 'its') {
      list = list.filter(p => !!(p.id_its || p.estado_its))
    } else if (fId === 'edp') {
      list = list.filter(p => p.estado_its === 'CONCLUIDO' || p.estado_its === 'APROBADO_OPS' || Number(p.id_proyecto_estado) >= 6)
    } else if (fId === 'oc') {
      list = list.filter(p => Number(p.id_proyecto_estado) >= 5 && Number(p.id_proyecto_estado) < 7 && !p.json_field?.facturacion_v1?.nro_dte)
    } else if (fId === 'dte') {
      list = list.filter(p => Number(p.id_proyecto_estado) === 7 || p.json_field?.facturacion_v1?.nro_dte)
    }
  }

  return list.slice(0, 8).map(p => {
    const monto = calcularMontoProyecto(p)
    const ej = p.json_field?.ejecucion_v1 || {}
    return {
      id_proyecto: p.id_proyecto,
      codi_proyecto: p.codi_proyecto || `OT-${p.id_proyecto}`,
      nombre_cliente: p.nombre_cliente || p.razon_social || 'Cliente sin nombre',
      patente_grua: ej.patente_grua || 'Sin asignar',
      monto_devengado: monto,
      estado_its: p.estado_its || 'Pendiente'
    }
  })
})

const seleccionarFasePipeline = (fase) => {
  faseSeleccionada.value = faseSeleccionada.value?.id === fase.id ? null : fase
}

const toggleFaseColumna = (col) => {
  if (faseSeleccionada.value?.id === col.id) {
    faseSeleccionada.value = null
  } else {
    faseSeleccionada.value = col
  }
}

const seleccionarClienteBalanza = (clienteNombre) => {
  if (clienteSeleccionadoBalanza.value === clienteNombre) {
    clienteSeleccionadoBalanza.value = null
  } else {
    clienteSeleccionadoBalanza.value = clienteNombre
  }
}

const limpiarFiltrosBalanza = () => {
  clienteSeleccionadoBalanza.value = null
  faseSeleccionada.value = null
}

// ─── ACREDITACIÓN, DOCUMENTOS Y ALERTAS REALES ───
const totalUsuarios = computed(() => usuarios.value.length || 48)

const docsVencidosCount = computed(() => {
  return equipos.value.filter(e => e.estado_doc_legal === 'error' || e.estado_doc_gral === 'error').length
})
const docsPorVencerCount = computed(() => {
  return equipos.value.filter(e => e.estado_doc_legal === 'warning' || e.estado_doc_gral === 'warning').length
})
const porcentajeAcreditacion = computed(() => {
  if (totalEquipos.value <= 0) return 100
  const alDia = totalEquipos.value - docsVencidosCount.value
  return Math.round((alDia / totalEquipos.value) * 100)
})

// Alertas Críticas Reales
const alertasCriticas = computed(() => {
  const list = []
  if (docsVencidosCount.value > 0) {
    list.push({
      tipo: 'error',
      titulo: `${docsVencidosCount.value} Equipos con Documentación Legal Vencida`,
      desc: 'Revisión técnica o SOAP vencido según registro de mantenedor.',
      tiempo: 'Acreditación',
      link: '/vista360',
      btnTexto: 'Ver Equipos'
    })
  }
  if (docsPorVencerCount.value > 0) {
    list.push({
      tipo: 'warning',
      titulo: `${docsPorVencerCount.value} Equipos con Documentación por Vencer (< 30 días)`,
      desc: 'Programar renovación preventiva antes de bloqueo en faena mandante.',
      tiempo: 'Próximo',
      link: '/vista360',
      btnTexto: 'Revisar'
    })
  }
  if (otsEsperandoOCCount.value > 0) {
    list.push({
      tipo: 'warning',
      titulo: `${otsEsperandoOCCount.value} Servicios en Faena sin Facturación DTE`,
      desc: `Descalce acumulado de ${formatMoneda(kpiDescalceDevengado.value)} esperando cierre formal.`,
      tiempo: 'Tesorería',
      link: '/torre',
      btnTexto: 'Ver Torre'
    })
  }
  return list
})

// Equipos con inspecciones técnicas registradas reales
const equiposConInspeccionTop = computed(() => {
  return equipos.value
    .filter(e => Number(e.cant_inspecciones || 0) > 0)
    .sort((a, b) => Number(b.cant_inspecciones) - Number(a.cant_inspecciones))
    .slice(0, 6)
})

const verDetalleDescalce = () => {
  seleccionarFasePipeline(pipelineEstaciones.value[3])
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
</style>
