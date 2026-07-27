<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6">
    <!-- Header & Unified Control Center -->
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0c0c0e]/90 border border-emerald-500/20 p-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.05)] backdrop-blur-md relative z-10">
      <div>
        <h1 class="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <Activity class="w-6 h-6 text-emerald-500 animate-pulse" />
          Centro de Comando Táctico SST
        </h1>
        <p class="text-[10px] text-emerald-500/70 mt-1 font-mono tracking-[0.2em] uppercase">Vista Consolidada Integrada - Live</p>
      </div>
      
      <!-- Smart Filters -->
      <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <div class="flex items-center gap-2 bg-black/60 border border-border/50 rounded-lg px-3 py-2 shadow-inner">
          <Calendar class="w-4 h-4 text-zinc-400" />
          <span class="text-[9px] font-black uppercase tracking-wider text-zinc-500">Periodo:</span>
          <select 
            v-model="selectedPeriod"
            @change="filterData"
            class="bg-transparent text-sm text-emerald-400 font-bold focus:outline-none cursor-pointer outline-none"
          >
            <option value="YTD">Año Completo (YTD)</option>
            <option v-for="p in periodosDisponibles" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>

        <div class="flex items-center gap-2 bg-black/60 border border-border/50 rounded-lg px-3 py-2 shadow-inner">
          <Building2 class="w-4 h-4 text-zinc-400" />
          <span class="text-[9px] font-black uppercase tracking-wider text-zinc-500">Cliente:</span>
          <select 
            v-model="selectedProyecto"
            @change="filterData"
            class="bg-transparent text-sm text-white font-bold focus:outline-none w-48 cursor-pointer outline-none"
          >
            <option value="all">Todas las Sucursales</option>
            <option v-for="p in projects" :key="p.id_proyecto" :value="p.id_proyecto">
              {{ p.nombre_proyecto }} ({{ p.codi_proyecto }})
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Segmento "Conductual / SST" -->
    <div class="flex flex-col border-b border-zinc-200 dark:border-white/5 pb-3 pt-2">
      <div class="flex items-center gap-2">
        <ShieldCheck class="w-5 h-5 text-emerald-500" />
        <h2 class="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">Segmento: Conductual / SST</h2>
        <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-mono ml-auto">Indicadores y Comportamiento</span>
      </div>
      <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 pl-7">
        Este segmento consolida la dotación de personal, las horas hombre de exposición y el total de accidentes. Además, muestra el porcentaje de cumplimiento de las observaciones conductuales e inspecciones de seguridad programadas, junto con las tendencias históricas de conductas, condiciones e índices de frecuencia (IF), severidad (IG) y accidentabilidad (IA).
      </p>
    </div>

    <!-- Primera Fila: KPIs Estratégicos -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <!-- KPI Trabajadores -->
      <div class="bg-white dark:bg-[#131316] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between relative shadow-md dark:shadow-xl">
        <div class="flex justify-between items-start">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-[#0f2e22] flex items-center justify-center">
            <Users class="w-6 h-6 text-emerald-500" />
          </div>
          <div class="bg-zinc-100 dark:bg-[#1d1d20] px-3 py-1.5 rounded-lg text-[10px] font-black text-zinc-600 dark:text-zinc-400 tracking-wider">
            PROM. PERIODO
          </div>
        </div>
        <div class="mt-6">
          <h3 class="text-[11px] font-black text-zinc-700 dark:text-zinc-300 tracking-[0.2em] uppercase mb-0.5">Dotación Total</h3>
          <p class="text-[9px] text-zinc-500 dark:text-zinc-500 mb-2 leading-tight">Promedio de colaboradores activos en el periodo</p>
          <div class="flex items-baseline mt-2">
            <span class="text-[42px] font-black text-zinc-900 dark:text-white leading-none tracking-tight">{{ kpis.dotacion }}</span>
            <span class="text-[11px] font-black text-zinc-500 dark:text-zinc-500 ml-2 uppercase tracking-wide">Colaboradores</span>
          </div>
        </div>
      </div>

      <!-- KPI HH Acumuladas -->
      <div class="bg-white dark:bg-[#131316] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between relative shadow-md dark:shadow-xl">
        <div class="flex justify-between items-start">
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-[#16233b] flex items-center justify-center">
            <Activity class="w-6 h-6 text-blue-500" />
          </div>
          <div class="bg-zinc-100 dark:bg-[#1d1d20] px-3 py-1.5 rounded-lg text-[10px] font-black text-zinc-600 dark:text-zinc-400 tracking-wider">
            SUMATORIA
          </div>
        </div>
        <div class="mt-6">
          <h3 class="text-[11px] font-black text-zinc-700 dark:text-zinc-300 tracking-[0.2em] uppercase mb-0.5">Horas Hombre</h3>
          <p class="text-[9px] text-zinc-500 dark:text-zinc-500 mb-2 leading-tight">Exposición total acumulada al riesgo laboral</p>
          <div class="flex items-baseline mt-2">
            <span class="text-[34px] font-black text-zinc-900 dark:text-white leading-none tracking-tight">{{ formatNumber(kpis.horasHombre) }}</span>
            <span class="text-[11px] font-black text-zinc-500 dark:text-zinc-500 ml-2 uppercase tracking-wide">HH</span>
          </div>
        </div>
      </div>

      <!-- KPI Accidentes -->
      <div class="bg-white dark:bg-[#131316] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between relative shadow-md dark:shadow-xl">
        <div class="flex justify-between items-start">
          <div class="w-12 h-12 rounded-xl bg-red-500/10 dark:bg-[#361313] flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-red-500" />
          </div>
          <div 
            class="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider border"
            :class="kpis.accidentes > 0 ? 'state-critical' : 'state-ok'"
          >
            {{ kpis.accidentes > 0 ? 'ALERTA ACTIV.' : 'CERO DAÑOS' }}
          </div>
        </div>
        <div class="mt-6">
          <h3 class="text-[11px] font-black text-zinc-700 dark:text-zinc-300 tracking-[0.2em] uppercase mb-0.5">Total Accidentes</h3>
          <p class="text-[9px] text-zinc-500 dark:text-zinc-500 mb-2 leading-tight">Eventos totales reportados (STP + CTP + Trayecto)</p>
          <div class="flex items-baseline mt-2">
            <span class="text-[42px] font-black text-zinc-900 dark:text-white leading-none tracking-tight">{{ kpis.accidentes }}</span>
            <span class="text-[11px] font-black text-zinc-500 dark:text-zinc-500 ml-2 uppercase tracking-wide">Eventos</span>
          </div>
        </div>
      </div>

      <!-- Donut: Obs. Conductual -->
      <div class="bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/5 rounded-2xl p-4 relative overflow-hidden flex flex-col items-center justify-between shadow-md dark:shadow-xl">
        <div class="w-full text-center mb-1 bg-zinc-100 dark:bg-zinc-950/25 p-1 rounded">
          <h3 class="text-[10px] font-black text-zinc-700 dark:text-zinc-300 tracking-[0.2em] uppercase leading-tight">Obs. Conductual</h3>
          <p class="text-[8px] text-zinc-500 leading-tight">Foco en conductas seguras en terreno</p>
        </div>
        <div class="w-full grid grid-cols-3 text-center text-[10px] font-black uppercase border-b border-zinc-100 dark:border-white/5 pb-2 mb-2">
          <div class="text-blue-500 dark:text-blue-400 leading-tight border-r border-zinc-100 dark:border-white/5">Progr.<br><span class="text-sm text-zinc-800 dark:text-white">{{ obsConductualStats.progr }}</span></div>
          <div class="text-emerald-500 dark:text-emerald-400 leading-tight border-r border-zinc-100 dark:border-white/5">Ejec.<br><span class="text-sm text-zinc-800 dark:text-white">{{ obsConductualStats.ejec }}</span></div>
          <div class="text-emerald-600 dark:text-emerald-500 leading-tight flex items-center justify-center text-base drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">{{ obsConductualStats.pct }}%</div>
        </div>
        <div class="relative w-28 h-28 mt-1 flex items-center justify-center">
          <div ref="chartObsConductual" class="w-full h-full"></div>
          <span class="absolute text-[11px] font-black text-zinc-800 dark:text-white">{{ obsConductualStats.pct }}%</span>
        </div>
      </div>

      <!-- Donut: Inspecciones de Seguridad -->
      <div class="bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/5 rounded-2xl p-4 relative overflow-hidden flex flex-col items-center justify-between shadow-md dark:shadow-xl">
        <div class="w-full text-center mb-1 bg-zinc-100 dark:bg-zinc-950/25 p-1 rounded">
          <h3 class="text-[10px] font-black text-zinc-700 dark:text-zinc-300 tracking-[0.2em] uppercase leading-tight">Inspecciones de Seguridad</h3>
          <p class="text-[8px] text-zinc-500 leading-tight">Control de condiciones físicas y del entorno</p>
        </div>
        <div class="w-full grid grid-cols-3 text-center text-[10px] font-black uppercase border-b border-zinc-100 dark:border-white/5 pb-2 mb-2">
          <div class="text-blue-500 dark:text-blue-400 leading-tight border-r border-zinc-100 dark:border-white/5">Progr.<br><span class="text-sm text-zinc-800 dark:text-white">{{ inspSeguridadStats.progr }}</span></div>
          <div class="text-emerald-500 dark:text-emerald-400 leading-tight border-r border-zinc-100 dark:border-white/5">Ejec.<br><span class="text-sm text-zinc-800 dark:text-white">{{ inspSeguridadStats.ejec }}</span></div>
          <div class="text-emerald-600 dark:text-emerald-500 leading-tight flex items-center justify-center text-base drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">{{ inspSeguridadStats.pct }}%</div>
        </div>
        <div class="relative w-28 h-28 mt-1 flex items-center justify-center">
          <div ref="chartInspSeguridad" class="w-full h-full"></div>
          <span class="absolute text-[11px] font-black text-zinc-800 dark:text-white">{{ inspSeguridadStats.pct }}%</span>
        </div>
      </div>
    </div>

    <!-- Segunda Fila: Conductas y Condiciones -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Histograma Conductas Riesgosas -->
      <div class="bg-[#111113] border border-white/5 rounded-2xl p-4 shadow-xl relative group">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-xs font-bold text-zinc-300 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Conductas Riesgosas</h3>
          <span class="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Obs. Conductual</span>
        </div>
        <div ref="chartConductasRiesgosas" class="w-full h-[180px]"></div>
      </div>

      <!-- Histograma Condiciones Inseguras -->
      <div class="bg-[#111113] border border-white/5 rounded-2xl p-4 shadow-xl relative group">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-xs font-bold text-zinc-300 uppercase tracking-widest group-hover:text-amber-500 transition-colors">Condiciones Inseguras</h3>
          <span class="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Insp. Seguridad</span>
        </div>
        <div ref="chartCondicionesInseguras" class="w-full h-[180px]"></div>
      </div>
    </div>

    <!-- Tercera Fila: Severidad, Frecuencia y Accidentabilidad -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Histograma Índice de Severidad -->
      <div class="bg-[#111113] border border-white/5 rounded-2xl p-4 shadow-xl relative group">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-xs font-bold text-zinc-300 uppercase tracking-widest group-hover:text-orange-500 transition-colors">Índice de Severidad (IG)</h3>
          <div class="px-3 h-7 rounded-full bg-orange-600 !text-white flex items-center justify-center font-black text-[10px] shadow-[0_0_10px_rgba(245,158,11,0.5)] flex-shrink-0" style="color: #ffffff !important;">
            {{ currentIG }}
          </div>
        </div>
        <div ref="chartSeveridad" class="w-full h-[180px]"></div>
      </div>

      <!-- Histograma Índice de Frecuencia -->
      <div class="bg-[#111113] border border-white/5 rounded-2xl p-4 shadow-xl relative group">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-xs font-bold text-zinc-300 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Índice de Frecuencia (IF)</h3>
          <div class="px-3 h-7 rounded-full bg-blue-600 !text-white flex items-center justify-center font-black text-[10px] shadow-[0_0_10px_rgba(37,99,235,0.5)] flex-shrink-0" style="color: #ffffff !important;">
            {{ currentIF }}
          </div>
        </div>
        <div ref="chartFrecuencia" class="w-full h-[180px]"></div>
      </div>

      <!-- Histograma Índice Accidentabilidad -->
      <div class="bg-[#111113] border border-white/5 rounded-2xl p-4 shadow-xl relative group border-b-2 border-b-red-500/30">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-xs font-bold text-red-500/70 uppercase group-hover:text-red-500 transition-colors">Índice Accidentabilidad (IA)</h3>
          <div class="px-3 h-7 rounded-full bg-red-600 !text-white flex items-center justify-center font-black text-[10px] shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse flex-shrink-0" style="color: #ffffff !important;">
            {{ currentIA }}%
          </div>
        </div>
        <div ref="chartAccidentabilidad" class="w-full h-[180px]"></div>
      </div>
    </div>

    <!-- Segmento "Listados de Verificación" -->
    <div class="flex flex-col border-b border-zinc-200 dark:border-white/5 pb-3 pt-2 mt-6">
      <div class="flex items-center gap-2">
        <FileCheck class="w-5 h-5 text-emerald-500" />
        <h2 class="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">Segmento: Listados de Verificación</h2>
        <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-mono ml-auto">Cumplimiento Legal y Normativo</span>
      </div>
      <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 pl-7">
        Monitoreo mensual de la evolución de cumplimiento de los principales listados y auditorías legales de control: RESSO (Reglamento Especial de Seguridad y Salud Ocupacional), RECSS (Reglamento de Empresas Contratistas y Subcontratistas) y protocolos de control de salud pública MINSAL.
      </p>
    </div>

    <!-- Quinta Fila: Cumplimiento Normativo (RESSO, RECSS, MINSAL) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- RESSO -->
      <div class="bg-[#131316] border border-white/5 rounded-2xl p-6 shadow-2xl relative group overflow-hidden">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] group-hover:text-emerald-500 transition-colors">Evolución RESSO</h3>
            <p class="text-[9px] text-zinc-500 mt-0.5">Control de estándares operacionales de seguridad contratistas</p>
          </div>
          <div class="w-14 h-7 rounded-full bg-emerald-500 !text-white flex items-center justify-center font-black text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.4)]" style="color: #ffffff !important;">92%</div>
        </div>
        <div ref="chartResso" class="w-full h-[180px]"></div>
      </div>

      <!-- RECSS -->
      <div class="bg-[#131316] border border-white/5 rounded-2xl p-6 shadow-2xl relative group overflow-hidden">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] group-hover:text-blue-500 transition-colors">Evolución RECSS</h3>
            <p class="text-[9px] text-zinc-500 mt-0.5">Reglamento y cumplimiento legal de subcontratos de faena</p>
          </div>
          <div class="w-14 h-7 rounded-full bg-blue-600 !text-white flex items-center justify-center font-black text-[10px] shadow-[0_0_15px_rgba(37,99,235,0.4)]" style="color: #ffffff !important;">85%</div>
        </div>
        <div ref="chartRecss" class="w-full h-[180px]"></div>
      </div>

      <!-- MINSAL -->
      <div class="bg-[#131316] border border-white/5 rounded-2xl p-6 shadow-2xl relative group overflow-hidden">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] group-hover:text-rose-500 transition-colors">Evolución MINSAL</h3>
            <p class="text-[9px] text-zinc-500 mt-0.5">Protocolos de salud ocupacional (Prexor, Planesi, Psicosocial)</p>
          </div>
          <div class="w-14 h-7 rounded-full bg-rose-600 !text-white flex items-center justify-center font-black text-[10px] shadow-[0_0_15px_rgba(225,29,72,0.4)]" style="color: #ffffff !important;">78%</div>
        </div>
        <div ref="chartMinsal" class="w-full h-[180px]"></div>
      </div>
    </div>

    <!-- Segmento "Inspecciones de Equipos de Transporte" -->
    <div class="flex flex-col border-b border-zinc-200 dark:border-white/5 pb-3 pt-2 mt-6">
      <div class="flex items-center gap-2">
        <Truck class="w-5 h-5 text-blue-500" />
        <h2 class="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">Segmento: Inspecciones de Equipos de Transporte</h2>
        <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-mono ml-auto">Control y Cumplimiento de Flota</span>
      </div>
      <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 pl-7">
        Control consolidado del estado documental de la flota de transporte. Muestra el porcentaje de documentación legal y general vigente, por vencer o vencida, junto con los indicadores numéricos del universo de flota y el estado del programa de inspección de vehículos (planificadas, pendientes, realizadas y rechazadas).
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Donut Documentación Legal -->
      <div class="bg-[#131316] border border-white/5 rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-xs font-black text-zinc-300 uppercase tracking-wider">Cumplimiento Doc. Legal</h3>
            <p class="text-[9px] text-zinc-500 mt-0.5">Revisión técnica, permiso de circulación y seguro obligatorio</p>
          </div>
        </div>
        <div class="relative w-full h-40 flex items-center justify-center">
          <div ref="chartDocLegal" class="w-full h-full"></div>
        </div>
      </div>

      <!-- Donut Documentación General -->
      <div class="bg-[#131316] border border-white/5 rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-xs font-black text-zinc-300 uppercase tracking-wider">Cumplimiento Doc. General</h3>
            <p class="text-[9px] text-zinc-500 mt-0.5">Hojas de vida, certificaciones de operatividad y check-list de ingreso</p>
          </div>
        </div>
        <div class="relative w-full h-40 flex items-center justify-center">
          <div ref="chartDocGeneral" class="w-full h-full"></div>
        </div>
      </div>

      <!-- Indicadores Numéricos -->
      <div class="bg-[#131316] border border-white/5 rounded-2xl p-6 shadow-2xl relative grid grid-cols-2 gap-4">
        <div class="col-span-2 flex flex-col justify-center border-b border-white/5 pb-2 mb-1">
          <span class="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Total Flota</span>
          <span class="text-3xl font-black text-white leading-none">
            {{ transportStats.totalFlota }}
            <span class="text-xs font-bold text-zinc-500 lowercase">equipos en faena</span>
          </span>
        </div>
        <div class="flex flex-col justify-center border-r border-white/5 pr-2">
          <span class="text-[10px] font-black text-blue-400 uppercase tracking-wider">Planificadas</span>
          <span class="text-2xl font-black text-white">{{ transportStats.planificadas }}</span>
        </div>
        <div class="flex flex-col justify-center pl-2">
          <span class="text-[10px] font-black text-amber-400 uppercase tracking-wider">Pendientes</span>
          <span class="text-2xl font-black text-white">{{ transportStats.pendientes }}</span>
        </div>
        <div class="flex flex-col justify-center border-r border-white/5 pr-2 pt-2 border-t border-white/5">
          <span class="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Realizadas</span>
          <span class="text-2xl font-black text-white">{{ transportStats.realizadas }}</span>
        </div>
        <div class="flex flex-col justify-center pl-2 pt-2 border-t border-white/5">
          <span class="text-[10px] font-black text-red-500 uppercase tracking-wider">Rechazadas</span>
          <span class="text-2xl font-black text-white">{{ transportStats.rechazadas }}</span>
        </div>
      </div>
    </div>

    <!-- Segmento "Inspecciones de Equipamiento Complementario (No Transporte)" -->
    <div class="flex flex-col border-b border-zinc-200 dark:border-white/5 pb-3 pt-2 mt-6">
      <div class="flex items-center gap-2">
        <Package class="w-5 h-5 text-orange-500" />
        <h2 class="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">Segmento: Inspecciones de Equipamiento Complementario (No Transporte)</h2>
        <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-mono ml-auto">Criticidad por Categoría y Sucursal</span>
      </div>
      <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 pl-7">
        Matriz térmica de control jerárquico para el inventario de equipamiento complementario no motorizado. Clasifica las desviaciones y no conformidades encontradas en las categorías de Extintores, Elementos de Izaje, EPP/Seguridad y Radiotransmisores, desglosado por Cliente, Proyecto y Faena con capacidades de expansión y visualización de detalle.
      </p>
    </div>

    <!-- Collapsible Contract Matrix Table -->
    <div class="bg-[#111113] border border-white/5 rounded-2xl p-5 shadow-2xl relative">
      <div v-if="matrixLocations.length === 0" class="text-center py-20 text-sm font-semibold text-muted-foreground italic">
         No se encontraron elementos registrados en este período.
      </div>

      <div v-else class="space-y-6">
        <div class="overflow-x-auto rounded-xl border border-white/10 bg-[#16191f]/40 backdrop-blur-md">
          <table class="w-full border-collapse text-left text-xs">
            <thead>
              <tr class="bg-white/[0.02] text-[9.5px] font-black uppercase tracking-wider text-slate-400 border-b border-white/10">
                <th class="p-4 border-r border-white/5 w-[35%]">Estructura de Contratos / Faenas</th>
                <th v-for="cat in uniqueCategories" :key="cat" class="p-4 text-center border-r border-white/5 last:border-r-0">
                  <div class="flex items-center justify-center gap-1.5">
                    <component :is="getCategoryIcon(cat)" class="w-3.5 h-3.5 text-emerald-500" />
                    <span>{{ cat }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 bg-zinc-950/20">
              <template v-for="clientGroup in matrixTree" :key="clientGroup.name">
                <!-- Client Header Row -->
                <tr class="bg-white/[0.02] hover:bg-white/[0.03] transition-colors">
                  <td 
                    v-if="collapsedClients.has(clientGroup.name)"
                    class="p-3 font-black text-white uppercase tracking-wider cursor-pointer border-b border-white/5 select-none border-r border-white/5 align-middle w-[35%]"
                    @click="toggleClientCollapse(clientGroup.name)"
                  >
                    <div class="flex items-center gap-3">
                      <ChevronRight 
                        :class="['w-4 h-4 animate-in fade-in',
                          getClientOverallStatus(clientGroup) === 'error' ? 'text-red-500' :
                          getClientOverallStatus(clientGroup) === 'warning' ? 'text-amber-500' :
                          'text-emerald-500'
                        ]" 
                      />
                      <Folder 
                        :class="['w-4 h-4 shrink-0',
                          getClientOverallStatus(clientGroup) === 'error' ? 'text-red-500' :
                          getClientOverallStatus(clientGroup) === 'warning' ? 'text-amber-500' :
                          'text-emerald-500'
                        ]" 
                      />
                      <span class="text-[11px] font-black tracking-widest text-slate-200">Cliente: {{ clientGroup.name }}</span>
                    </div>
                  </td>
                  <td 
                    v-else
                    :colspan="1 + uniqueCategories.length" 
                    class="p-3 font-black text-white uppercase tracking-wider cursor-pointer border-b border-white/5 select-none"
                    @click="toggleClientCollapse(clientGroup.name)"
                  >
                    <div class="flex items-center gap-3">
                      <ChevronDown 
                        :class="['w-4 h-4 animate-in fade-in',
                          getClientOverallStatus(clientGroup) === 'error' ? 'text-red-500' :
                          getClientOverallStatus(clientGroup) === 'warning' ? 'text-amber-500' :
                          'text-emerald-500'
                        ]" 
                      />
                      <Folder 
                        :class="['w-4 h-4 shrink-0',
                          getClientOverallStatus(clientGroup) === 'error' ? 'text-red-500' :
                          getClientOverallStatus(clientGroup) === 'warning' ? 'text-amber-500' :
                          'text-emerald-500'
                        ]" 
                      />
                      <span class="text-[11px] font-black tracking-widest text-slate-200">Cliente: {{ clientGroup.name }}</span>
                    </div>
                  </td>

                  <!-- Cells for collapsed client -->
                  <template v-if="collapsedClients.has(clientGroup.name)">
                    <td 
                      v-for="cat in uniqueCategories" 
                      :key="cat" 
                      class="p-2.5 text-center border-r border-white/5 last:border-r-0 align-middle border-b border-white/5"
                    >
                      <div 
                        v-if="getClientCellData(clientGroup, cat).status !== 'na'"
                        @click.stop="selectMatrixCell(clientGroup.name + '||', cat, getClientCellData(clientGroup, cat).items)"
                        :class="['w-full h-10 rounded-xl border flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 select-none px-3',
                          selectedMatrixCellKey === (clientGroup.name + '|||' + cat) 
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]' 
                            : getClientCellData(clientGroup, cat).status === 'error'
                              ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                              : getClientCellData(clientGroup, cat).status === 'warning'
                                ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 hover:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                        ]"
                      >
                        <span :class="['w-2.5 h-2.5 rounded-full shrink-0',
                          getClientCellData(clientGroup, cat).status === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' :
                          getClientCellData(clientGroup, cat).status === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' :
                          'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                        ]"></span>
                        
                        <span :class="['text-[10px] font-black tracking-tighter',
                          getClientCellData(clientGroup, cat).status === 'error' ? 'text-red-400' :
                          getClientCellData(clientGroup, cat).status === 'warning' ? 'text-amber-400' :
                          'text-emerald-400'
                        ]">
                          {{ getClientCellData(clientGroup, cat).status === 'error' ? `(${getClientCellData(clientGroup, cat).criticalCount} crt)` : `(${getClientCellData(clientGroup, cat).totalCount})` }}
                        </span>
                      </div>
                      <div v-else class="text-[10px] text-white/10 font-bold opacity-30 select-none">-</div>
                    </td>
                  </template>
                </tr>
                
                <template v-if="!collapsedClients.has(clientGroup.name)">
                  <template v-for="projGroup in clientGroup.projects" :key="projGroup.name">
                    <!-- Project Row -->
                    <tr class="bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                      <td 
                        v-if="collapsedProjects.has(clientGroup.name + '|' + projGroup.name)"
                        class="p-3 pl-8 text-slate-300 font-extrabold cursor-pointer border-b border-white/5 select-none border-r border-white/5 align-middle w-[35%]"
                        @click="toggleProjectCollapse(clientGroup.name, projGroup.name)"
                      >
                        <div class="flex items-center gap-3">
                          <ChevronRight 
                            :class="['w-3.5 h-3.5',
                              getProjectOverallStatus(projGroup) === 'error' ? 'text-red-500' :
                              getProjectOverallStatus(projGroup) === 'warning' ? 'text-amber-500' :
                              'text-emerald-500'
                            ]" 
                          />
                          <FolderOpen 
                            :class="['w-3.5 h-3.5 shrink-0',
                              getProjectOverallStatus(projGroup) === 'error' ? 'text-red-500' :
                              getProjectOverallStatus(projGroup) === 'warning' ? 'text-amber-500' :
                              'text-emerald-500'
                            ]" 
                          />
                          <span class="text-[10.5px] font-black tracking-wider text-slate-300">Proyecto: {{ projGroup.name }}</span>
                        </div>
                      </td>
                      <td 
                        v-else
                        :colspan="1 + uniqueCategories.length" 
                        class="p-3 pl-8 text-slate-300 font-extrabold cursor-pointer border-b border-white/5 select-none"
                        @click="toggleProjectCollapse(clientGroup.name, projGroup.name)"
                      >
                        <div class="flex items-center gap-3">
                          <ChevronDown 
                            :class="['w-3.5 h-3.5',
                              getProjectOverallStatus(projGroup) === 'error' ? 'text-red-500' :
                              getProjectOverallStatus(projGroup) === 'warning' ? 'text-amber-500' :
                              'text-emerald-500'
                            ]" 
                          />
                          <FolderOpen 
                            :class="['w-3.5 h-3.5 shrink-0',
                              getProjectOverallStatus(projGroup) === 'error' ? 'text-red-500' :
                              getProjectOverallStatus(projGroup) === 'warning' ? 'text-amber-500' :
                              'text-emerald-500'
                            ]" 
                          />
                          <span class="text-[10.5px] font-black tracking-wider text-slate-300">Proyecto: {{ projGroup.name }}</span>
                        </div>
                      </td>

                      <!-- Cells for collapsed project -->
                      <template v-if="collapsedProjects.has(clientGroup.name + '|' + projGroup.name)">
                        <td 
                          v-for="cat in uniqueCategories" 
                          :key="cat" 
                          class="p-2.5 text-center border-r border-white/5 last:border-r-0 align-middle border-b border-white/5"
                        >
                          <div 
                            v-if="getProjectCellData(projGroup, cat).status !== 'na'"
                            @click.stop="selectMatrixCell(clientGroup.name + '|' + projGroup.name + '|', cat, getProjectCellData(projGroup, cat).items)"
                            :class="['w-full h-10 rounded-xl border flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 select-none px-3',
                              selectedMatrixCellKey === (clientGroup.name + '|' + projGroup.name + '||' + cat) 
                                ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]' 
                                : getProjectCellData(projGroup, cat).status === 'error'
                                  ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                                  : getProjectCellData(projGroup, cat).status === 'warning'
                                    ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                    : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 hover:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                            ]"
                          >
                            <span :class="['w-2.5 h-2.5 rounded-full shrink-0',
                              getProjectCellData(projGroup, cat).status === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' :
                              getProjectCellData(projGroup, cat).status === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' :
                              'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                            ]"></span>
                            
                            <span :class="['text-[10px] font-black tracking-tighter',
                              getProjectCellData(projGroup, cat).status === 'error' ? 'text-red-400' :
                              getProjectCellData(projGroup, cat).status === 'warning' ? 'text-amber-400' :
                              'text-emerald-400'
                            ]">
                              {{ getProjectCellData(projGroup, cat).status === 'error' ? `(${getProjectCellData(projGroup, cat).criticalCount} crt)` : `(${getProjectCellData(projGroup, cat).totalCount})` }}
                            </span>
                          </div>
                          <div v-else class="text-[10px] text-white/10 font-bold opacity-30 select-none">-</div>
                        </td>
                      </template>
                    </tr>
                    
                    <template v-if="!collapsedProjects.has(clientGroup.name + '|' + projGroup.name)">
                      <tr 
                        v-for="loc in projGroup.locations" 
                        :key="loc.key" 
                        class="hover:bg-white/[0.01] transition-colors border-b border-white/5"
                      >
                        <!-- Location Leaf Row (Indented) -->
                        <td class="p-3 pl-16 text-white font-bold uppercase tracking-wide border-r border-white/5 align-middle">
                          <div class="flex items-center gap-2">
                            <MapPin class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span class="text-[10px] font-extrabold text-slate-200">{{ loc.faena }}</span>
                          </div>
                        </td>
                        
                        <!-- Semáforo Categorías -->
                        <td 
                          v-for="cat in uniqueCategories" 
                          :key="cat" 
                          class="p-2.5 text-center border-r border-white/5 last:border-r-0 align-middle"
                        >
                          <div 
                            v-if="getCellData(loc, cat).status !== 'na'"
                            @click="selectMatrixCell(loc.key, cat, getCellData(loc, cat).items)"
                            :class="['w-full h-10 rounded-xl border flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 select-none px-3',
                              selectedMatrixCellKey === (loc.key + '|' + cat) 
                                ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]' 
                                : getCellData(loc, cat).status === 'error'
                                  ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                                  : getCellData(loc, cat).status === 'warning'
                                    ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                    : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 hover:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                            ]"
                          >
                            <span :class="['w-2.5 h-2.5 rounded-full shrink-0',
                              getCellData(loc, cat).status === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' :
                              getCellData(loc, cat).status === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' :
                              'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                            ]"></span>
                            
                            <span :class="['text-[10px] font-black tracking-tighter',
                              getCellData(loc, cat).status === 'error' ? 'text-red-400' :
                              getCellData(loc, cat).status === 'warning' ? 'text-amber-400' :
                              'text-emerald-400'
                            ]">
                              {{ getCellData(loc, cat).status === 'error' ? `(${getCellData(loc, cat).criticalCount} crt)` : `(${getCellData(loc, cat).totalCount})` }}
                            </span>
                          </div>
                          <div v-else class="text-[10px] text-white/10 font-bold opacity-30 select-none">-</div>
                        </td>
                      </tr>
                    </template>
                  </template>
                </template>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Active Cell Details (Rendered below the matrix table) -->
        <div 
          v-if="selectedMatrixCellKey" 
          class="p-5 rounded-2xl border border-white/10 bg-black/40 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div class="flex items-center justify-between border-b border-white/5 pb-3">
            <div class="space-y-0.5">
              <p class="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em] italic">
                Detalle del Cuadrante Seleccionado
              </p>
              <h4 class="text-xs font-bold text-white uppercase">
                Ubicación: {{ selectedMatrixLocationName }} &bull; Categoría: {{ selectedMatrixCategoryName }}
              </h4>
            </div>
            <button @click="selectedMatrixCellKey = null; selectedMatrixCellItems = []" class="text-slate-500 hover:text-white transition-colors p-1 rounded-lg bg-white/5">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-[9px] font-black uppercase tracking-wider text-muted-foreground border-b border-white/5">
                  <th class="py-2">Código / Sello</th>
                  <th class="py-2">Elemento</th>
                  <th class="py-2 text-center">Última Inspección</th>
                  <th class="py-2 text-center">Vencimiento</th>
                  <th class="py-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr v-for="item in selectedMatrixCellItems" :key="item.id" class="hover:bg-white/[0.02] transition-colors h-10">
                  <td class="py-2 font-mono font-bold text-white uppercase">{{ item.code }}</td>
                  <td class="py-2 text-slate-300">{{ item.name }}</td>
                  <td class="py-2 text-center">
                    <span class="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">{{ formatDateString(item.date) }}</span>
                  </td>
                  <td class="py-2 text-center">
                    <span :class="['text-[9.5px] font-black', item.isExpired ? 'text-red-400 font-extrabold animate-pulse' : 'text-slate-400']">
                      {{ item.expiry ? formatExpiryDate(item.expiry) : '-' }}
                    </span>
                  </td>
                  <td class="py-2 text-center">
                    <span :class="['px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase border',
                      item.status === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                      item.status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                      'bg-destructive/10 border-destructive/20 text-destructive animate-pulse']">
                      {{ item.status === 'ok' ? 'CONFORME' : item.status === 'warning' ? 'ALERTA' : 'DESVIACIÓN' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Highcharts from 'highcharts'
import { 
  Activity, Users, AlertTriangle, Radio, Map as MapIcon, ShieldAlert, Zap, CheckCircle2, Calendar, Building2, Truck, FileCheck, ShieldCheck, Package,
  Shield, Wrench, Folder, FolderOpen, ChevronRight, ChevronDown, MapPin, X
} from 'lucide-vue-next'
import { apiAxios, sstAxios } from '../services/api'
// import { getMockSurveys } from '../data/mockSurveys'

// States
const allRecords = ref([])
const projects = ref([])
const filteredRecords = ref([])
const automatedStats = ref([])
const filteredAutomatedStats = ref([])
const surveys = ref([])
const filteredSurveys = ref([])
const fleet = ref([])
const ressoAudits = ref([])
const recssAudits = ref([])
const minsalAudits = ref([])

// Filters
const selectedPeriod = ref('YTD')
const selectedProyecto = ref('all')

// Chart Refs for new panels
const chartDocLegal = ref(null)
const chartDocGeneral = ref(null)

// KPI Aggregated States
const kpis = ref({
  dotacion: 0,
  horasHombre: 0,
  accidentes: 0
})

const obsConductualStats = ref({ progr: 0, ejec: 0, pct: 0 })
const inspSeguridadStats = ref({ progr: 0, ejec: 0, pct: 0 })

const currentIF = ref('0.00')
const currentIG = ref('0.00')
const currentIA = ref('0.00')

const sucursalKPIs = ref([])
const heatmapData = ref([])

const periodosDisponibles = computed(() => {
  const periods = new Set()
  allRecords.value.forEach(r => {
    periods.add(`${r.periodo_anio}-${String(r.periodo_mes).padStart(2, '0')}`)
  })
  automatedStats.value.forEach(stat => {
    periods.add(`${stat.periodo_anio}-${String(stat.periodo_mes).padStart(2, '0')}`)
  })
  surveys.value.forEach(s => {
    const dateStr = s.fecha_plan_ini || s.fecha_real_ini
    if (dateStr) {
      const d = new Date(dateStr)
      if (!isNaN(d.getTime())) {
        periods.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
      }
    }
  })
  return Array.from(periods).sort().reverse()
})

// Data tables mock
const hallazgosEquipos = ref([
  {
    id: 1,
    equipo: 'Excavadora CAT 320',
    patente: 'EX-9482',
    tipo: 'Sistema Hidráulico',
    detalle: 'Fuga de aceite en manguera principal de alta presión',
    criticidad: 'Crítico',
    criticidadColor: 'bg-red-500/10 text-red-500 border border-red-500/20',
    estado: 'Detenido',
    estadoColor: 'text-red-500',
    estadoDotColor: 'bg-red-500'
  },
  {
    id: 2,
    equipo: 'Camión Tolva Volvo FMX',
    patente: 'CT-3829',
    tipo: 'Frenos',
    detalle: 'Desgaste excesivo de pastillas traseras izquierda',
    criticidad: 'Alto',
    criticidadColor: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
    estado: 'En Taller',
    estadoColor: 'text-orange-500',
    estadoDotColor: 'bg-orange-500'
  },
  {
    id: 3,
    equipo: 'Cargador Frontal Komatsu',
    patente: 'CF-1029',
    tipo: 'Neumáticos',
    detalle: 'Presión baja constante en neumático delantero derecho',
    criticidad: 'Medio',
    criticidadColor: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
    estado: 'Monitoreo',
    estadoColor: 'text-yellow-500',
    estadoDotColor: 'bg-yellow-500'
  },
  {
    id: 4,
    equipo: 'Minicargador Bobcat S450',
    patente: 'MC-8372',
    tipo: 'Estructura',
    detalle: 'Fisura menor en anclaje de balde, requiere soldadura',
    criticidad: 'Bajo',
    criticidadColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    estado: 'Operativo',
    estadoColor: 'text-emerald-500',
    estadoDotColor: 'bg-emerald-500'
  }
])

const feedData = [
  { time: '14:30 Hoy', location: 'Chuquicamata', message: 'Inspección RESSO completada con 92%', icon: CheckCircle2, colorClass: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' },
  { time: '11:15 Hoy', location: 'Ministro Hales', message: 'Reporte de Accidentabilidad Mensual persistido', icon: Activity, colorClass: 'bg-blue-500' },
  { time: '09:00 Hoy', location: 'Los Pelambres', message: 'Ingreso manual de Horas Hombre validado', icon: ShieldAlert, colorClass: 'bg-yellow-500' },
  { time: 'Ayer 18:45', location: 'Spot', message: 'Cierre de Auditoría de Campo SIGO', icon: Zap, colorClass: 'bg-purple-500' }
]

// Formatting helper
const formatNumber = (val) => {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('es-CL')
}

// Math calculation helpers
const calculateIF = (accidents, hh) => {
  if (!hh || hh === 0) return '0.00'
  return (((accidents || 0) * 1000000) / hh).toFixed(2)
}

const calculateIG = (lostDays, hh) => {
  if (!hh || hh === 0) return '0.00'
  return (((lostDays || 0) * 1000000) / hh).toFixed(2)
}

const calculateIA = (ctp, dotacion) => {
  if (!dotacion || dotacion === 0) return '0.00'
  return (((ctp || 0) / dotacion) * 100).toFixed(2)
}

const getMonthlyAuditScores = (auditsList, activeYear, selectedProjId) => {
  const scoresByMonth = Array(12).fill(null).map(() => ({ sum: 0, count: 0 }))

  auditsList.forEach(audit => {
    if (!audit.audit_date) return
    const date = new Date(audit.audit_date)
    if (isNaN(date.getTime())) return
    const year = date.getFullYear()
    const monthIdx = date.getMonth()

    if (year !== activeYear) return

    if (selectedProjId !== 'all') {
      if (audit.contract_number && Number(audit.contract_number) !== Number(selectedProjId)) {
        return
      }
    }

    const score = Number(audit.total_score || 0)
    scoresByMonth[monthIdx].sum += score
    scoresByMonth[monthIdx].count++
  })

  return scoresByMonth.map(m => m.count > 0 ? Number((m.sum / m.count).toFixed(1)) : 0)
}

const getHeatmapColor = (val) => {
  if (val === 0) return 'bg-[#0c0c0e] border border-white/5 text-zinc-600'
  if (val < 5) return 'bg-orange-900/40 border border-orange-500/20'
  if (val < 10) return 'bg-orange-700/60 border border-orange-500/40'
  if (val < 15) return 'bg-orange-600 border border-orange-500'
  return 'bg-destructive shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-destructive-foreground/50'
}

function checkObjectForDeviations(obj) {
  if (!obj || typeof obj !== 'object') return false
  if (Array.isArray(obj)) {
    return obj.some(item => checkObjectForDeviations(item))
  }
  const ignoredKeys = new Set([
    'type', 'label', 'observaciones', 'observacionesGenerales', 
    'lugar', 'ubicacion', 'area', 'nombre', 'cargo', 'rut', 
    'equipo', 'marca', 'modelo', 'patente', 'numeroInterno', 
    'codificacion', 'marcaModelo', 'tipoRadio', 'especialidad', 
    'supervisorTransmac', 'operadorGrua', 'riggerSenalero', 
    'modeloGrua', 'faenaDivision', 'sectorUbicacion'
  ])
  for (const [key, val] of Object.entries(obj)) {
    if (ignoredKeys.has(key)) continue
    if (typeof val === 'string') {
      const v = val.toLowerCase().trim()
      if (v === 'nc' || v === 'no') return true
    } else if (typeof val === 'object') {
      if (checkObjectForDeviations(val)) return true
    }
  }
  return false
}

function extractItemsFromSurvey(survey) {
  const items = []
  if (!survey) return items

  const date = survey.fecha_real_ini || survey.fecha_plan_ini || new Date().toISOString()
  const idSurvey = survey.id_survey || 0
  const idProyecto = survey.id_proyecto || 0
  const nombreProyecto = survey.nombre_proyecto || 'Desconocido'
  const cliente = survey.name_empresa_cliente || survey.cliente || 'Desconocido'
  const estadoSurvey = survey.estado_srv || 'Desconocido'

  if (!survey.body_exec) return items

  let body = survey.body_exec
  try {
    if (typeof body === 'string') body = JSON.parse(body)
    if (typeof body === 'string') body = JSON.parse(body)
  } catch (e) {
    if (typeof body !== 'object' || body === null) {
      return items
    }
  }

  if (!body || typeof body !== 'object' || !body.segmentos || !Array.isArray(body.segmentos)) return items

  body.segmentos.forEach(seg => {
    if (!seg || !seg.attributes || !Array.isArray(seg.attributes)) return
    seg.attributes.forEach(attr => {
      if (!attr || !attr.type) return
      const type = attr.type

      if (type === 'checkListTransmacExtintoresCalama' || type === 'checkListTransmacExtintoresLosAndes') {
        const rows = Array.isArray(attr.body) ? attr.body : []
        rows.forEach((row, idx) => {
          if (!row) return
          const itemCode = row.nroSello || `Extintor-${idx + 1}`
          const location = row.ubicacion || attr.observacionesGenerales || 'Ubicación General'
          const checks = row.checks || {}
          let hasDeviation = false
          let deviationDetails = []
          Object.entries(checks).forEach(([key, val]) => {
            if (val === 'NC' || val === 'no') {
              hasDeviation = true
              deviationDetails.push(`${key}: NC`)
            }
          })

          items.push({
            id: `${type}-${itemCode}-${location}`.toLowerCase(),
            category: 'Extintores',
            name: `${type.includes('Calama') ? 'Extintor Calama' : 'Extintor Los Andes'} (${row.capacidadNominal || ''} kg)`,
            code: itemCode,
            location: location,
            expiry: row.fechaVencimiento || null,
            hasDeviation,
            deviationDetails,
            date,
            idSurvey,
            idProyecto: Number(idProyecto),
            nombreProyecto,
            cliente,
            estadoSurvey,
            rawItem: attr,
            rowItem: row
          })
        })
      }

      else if (type === 'checkListExtintorCdch') {
        const componentes = Array.isArray(attr.componentes) ? attr.componentes : []
        const identificacion = attr.identificacion || {}
        const desc = attr.descripcionEquipo || {}
        const itemCode = desc.numeroInterno || 'S/N'
        const location = identificacion.lugar || 'Ubicación General'

        let hasDeviation = false
        componentes.forEach(comp => {
          if (comp && comp.days && Object.values(comp.days).includes('no')) {
            hasDeviation = true
          }
        })

        items.push({
          id: `${type}-${itemCode}-${location}`.toLowerCase(),
          category: 'Extintores',
          name: `Extintor CDCH (${desc.capacidadKg || ''} kg)`,
          code: itemCode,
          location: location,
          expiry: identificacion.fechaTermino || null,
          hasDeviation,
          deviationDetails: hasDeviation ? ['Checklist diario con No Conformidad'] : [],
          date,
          idSurvey,
          idProyecto: Number(idProyecto),
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      else if (type === 'checkListGrilleteCdch') {
        const componentes = Array.isArray(attr.componentes) ? attr.componentes : []
        const identificacion = attr.identificacion || {}
        const desc = attr.descripcionEquipo || {}
        const itemCode = desc.codificacion || 'S/N'
        const location = identificacion.lugar || 'Ubicación General'

        let hasDeviation = false
        componentes.forEach(comp => {
          if (comp && comp.days && Object.values(comp.days).includes('no')) {
            hasDeviation = true
          }
        })

        items.push({
          id: `${type}-${itemCode}-${location}`.toLowerCase(),
          category: 'Elementos de Izaje',
          name: `Grillete (${desc.medida || ''})`,
          code: itemCode,
          location: location,
          expiry: identificacion.fechaTermino || null,
          hasDeviation,
          deviationDetails: hasDeviation ? ['Checklist diario con No Conformidad'] : [],
          date,
          idSurvey,
          idProyecto: Number(idProyecto),
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      else if (type === 'checkListRetractilCdch') {
        const componentes = Array.isArray(attr.componentes) ? attr.componentes : []
        const identificacion = attr.identificacion || {}
        const desc = attr.descripcionEquipo || {}
        const itemCode = `${desc.marca || ''} ${desc.modelo || ''}`.trim()
        const location = identificacion.lugar || 'Ubicación General'

        let hasDeviation = false
        componentes.forEach(comp => {
          if (comp && comp.days && Object.values(comp.days).includes('no')) {
            hasDeviation = true
          }
        })

        items.push({
          id: `${type}-${itemCode}-${location}`.toLowerCase(),
          category: 'EPP / Seguridad',
          name: `Retráctil`,
          code: itemCode || 'S/N',
          location: location,
          expiry: identificacion.fechaTermino || null,
          hasDeviation,
          deviationDetails: hasDeviation ? ['Checklist diario con No Conformidad'] : [],
          date,
          idSurvey,
          idProyecto: Number(idProyecto),
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      else if (type === 'checkListEslingasTubularesCdch') {
        const desc = attr.descripcion || {}
        const itemCode = `${desc.largo || ''} FS:${desc.factorSeguridad || ''}`.trim()
        const location = 'Ubicación General'

        let hasDeviation = false
        const condiciones = Array.isArray(attr.condiciones) ? attr.condiciones : []
        condiciones.forEach(c => {
          if (c && c.days && Object.values(c.days).includes('no')) {
            hasDeviation = true
          }
        })

        items.push({
          id: `${type}-${itemCode}-${location}`.toLowerCase(),
          category: 'Elementos de Izaje',
          name: `Eslinga Tubular`,
          code: itemCode || 'S/N',
          location: location,
          expiry: null,
          hasDeviation,
          deviationDetails: hasDeviation ? ['Condición con No Conformidad'] : [],
          date,
          idSurvey,
          idProyecto: Number(idProyecto),
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      else if (type === 'checkListArnesSeguridadDmh') {
        const datos = attr.datos || {}
        const itemCode = datos.codigoCertArnes || 'S/N'
        const location = datos.area || datos.faenaContrato || 'Ubicación General'

        items.push({
          id: `${type}-${itemCode}-${location}`.toLowerCase(),
          category: 'EPP / Seguridad',
          name: `Arnés de Seguridad`,
          code: itemCode,
          location: location,
          expiry: null,
          hasDeviation: false,
          deviationDetails: [],
          date,
          idSurvey,
          idProyecto: Number(idProyecto),
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      else if (type === 'checkListInspeccionEprDmh') {
        const datos = attr.datos || {}
        const itemCode = datos.rut || 'S/N'
        const location = datos.cargo || 'Ubicación General'

        items.push({
          id: `${type}-${itemCode}-${location}`.toLowerCase(),
          category: 'EPP / Seguridad',
          name: `EPP Respirador (Usuario: ${datos.nombreTrabajador || 'S/I'})`,
          code: itemCode,
          location: location,
          expiry: null,
          hasDeviation: false,
          deviationDetails: [],
          date,
          idSurvey,
          idProyecto: Number(idProyecto),
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      else if (type === 'checkListComunicacionRadial' || type === 'checkListComunicacionRadialDmh') {
        const datos = attr.datos || {}
        const itemCode = datos.marcaModelo || 'Radio'
        const location = datos.especialidad || 'Ubicación General'

        let hasDeviation = false
        const rows = Array.isArray(attr.body) ? attr.body : []
        rows.forEach(r => {
          if (r && r.days && Object.values(r.days).includes('no')) {
            hasDeviation = true
          }
        })

        items.push({
          id: `${type}-${itemCode}-${location}`.toLowerCase(),
          category: 'Comunicaciones',
          name: `Radio Transmisor (${datos.tipoRadio || ''})`,
          code: itemCode,
          location: location,
          expiry: null,
          hasDeviation,
          deviationDetails: hasDeviation ? ['Falla en revisión radial'] : [],
          date,
          idSurvey,
          idProyecto: Number(idProyecto),
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }
      
      else if (type.toLowerCase().includes('checklist') && !type.toLowerCase().includes('camioneta') && !type.toLowerCase().includes('camion') && !type.toLowerCase().includes('grua')) {
        const datos = attr.datos || {}
        const location = datos.lugar || datos.ubicacion || datos.area || 'Ubicación General'
        const itemCode = datos.codigo || datos.numero || datos.patente || 'S/N'

        let category = 'Otros'
        const typeLower = type.toLowerCase()
        if (typeLower.includes('extintor')) {
          category = 'Extintores'
        } else if (typeLower.includes('izaje') || typeLower.includes('grillete') || typeLower.includes('eslinga') || typeLower.includes('amarre') || typeLower.includes('cadena') || typeLower.includes('estrobo') || typeLower.includes('cancamo')) {
          category = 'Elementos de Izaje'
        } else if (typeLower.includes('arnes') || typeLower.includes('respirador') || typeLower.includes('epr') || typeLower.includes('retractil') || typeLower.includes('epp') || typeLower.includes('segregacion') || typeLower.includes('viento') || typeLower.includes('suelo') || typeLower.includes('visibilidad') || typeLower.includes('desinfeccion') || typeLower.includes('neumatico')) {
          category = 'EPP / Seguridad'
        } else if (typeLower.includes('comunicac') || typeLower.includes('radio')) {
          category = 'Comunicaciones'
        }

        const hasDeviation = checkObjectForDeviations(attr)

        items.push({
          id: `${type}-${itemCode}-${location}`.toLowerCase(),
          category,
          name: attr.label || 'Accesorio / Elemento',
          code: itemCode,
          location: location,
          expiry: null,
          hasDeviation,
          deviationDetails: hasDeviation ? ['Se detectó una No Conformidad en la revisión'] : [],
          date,
          idSurvey,
          idProyecto: Number(idProyecto),
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }
    })
  })

  return items
}

const filteredFleet = computed(() => {
  if (selectedProyecto.value === 'all') {
    return fleet.value
  }
  return fleet.value.filter(item => Number(item.ID_PROYECTO) === Number(selectedProyecto.value))
})

const transportSurveys = computed(() => {
  return filteredSurveys.value.filter(s => Number(s.id_tipo_srv) === 5)
})

const transportStats = computed(() => {
  const ts = transportSurveys.value
  const planificadas = ts.filter(s => ['pre creado', 'pre-creado', 'planificado'].includes(String(s.estado_srv).toLowerCase().trim())).length
  const pendientes = ts.filter(s => ['creado', 'verificando', 'verificacion', 'verificación', 'ejecucion', 'ejecución'].includes(String(s.estado_srv).toLowerCase().trim())).length
  const realizadas = ts.filter(s => ['terminado', 'aprobado'].includes(String(s.estado_srv).toLowerCase().trim())).length
  const rechazadas = ts.filter(s => ['rechazado', 'rechazada'].includes(String(s.estado_srv).toLowerCase().trim())).length
  
  return {
    totalFlota: filteredFleet.value.length,
    planificadas,
    pendientes,
    realizadas,
    rechazadas
  }
})

// V2 Matrix Dashboard State
const activeMainTab = ref('matrix')
const selectedMatrixCellKey = ref(null)
const selectedMatrixCellItems = ref([])
const selectedMatrixLocationName = ref('')
const selectedMatrixCategoryName = ref('')

const collapsedClients = ref(new Set())
const collapsedProjects = ref(new Set())

const categoryFilter = ref('all')
const searchQuery = ref('')
const currentFilter = ref('all')

const uniqueCategories = ref(["Comunicaciones", "EPP / Seguridad", "Elementos de Izaje", "Extintores"])

const consolidatedItemsList = computed(() => {
  const itemsMap = new Map()

  const list = [
    ...surveys.value.filter(s => [1, 2, 4, 6].includes(Number(s.id_tipo_srv)))
  ]

  list.forEach(survey => {
    const items = extractItemsFromSurvey(survey)
    items.forEach(item => {
      if (!itemsMap.has(item.id)) {
        itemsMap.set(item.id, [])
      }
      itemsMap.get(item.id).push(item)
    })
  })

  const consolidated = []

  itemsMap.forEach((history, id) => {
    history.sort((a, b) => {
      const dateA = new Date(a.date || 0)
      const dateB = new Date(b.date || 0)
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime()
      }
      return Number(b.idSurvey) - Number(a.idSurvey)
    })

    const latest = history[0]

    let daysSinceInsp = 999
    if (latest.date) {
      const lastDate = new Date(latest.date.split('T')[0])
      const now = new Date()
      now.setHours(0,0,0,0)
      lastDate.setHours(0,0,0,0)
      daysSinceInsp = Math.max(0, Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)))
    }

    let isExpired = false
    let daysUntilExp = 999
    if (latest.expiry) {
      try {
        let expDate
        if (latest.expiry.includes('-')) {
          expDate = new Date(latest.expiry)
        } else if (latest.expiry.includes('/')) {
          const [d, m, y] = latest.expiry.split('/').map(Number)
          expDate = new Date(y, m - 1, d)
        }
        if (expDate) {
          expDate.setHours(0,0,0,0)
          const now = new Date()
          now.setHours(0,0,0,0)
          daysUntilExp = Math.floor((expDate - now) / (1000 * 60 * 60 * 24))
          if (daysUntilExp < 0) {
            isExpired = true
          }
        }
      } catch {}
    }

    let status = 'ok'
    if (latest.hasDeviation || isExpired) {
      status = 'error'
    } else if (daysSinceInsp > 30 || (latest.expiry && daysUntilExp <= 30)) {
      status = 'warning'
    }

    consolidated.push({
      ...latest,
      status,
      isExpired,
      daysSinceInsp,
      daysUntilExpiry: daysUntilExp,
      history
    })
  })

  return consolidated
})

const filteredItems = computed(() => {
  let list = consolidatedItemsList.value
  
  if (selectedProyecto.value !== 'all') {
    const proyId = Number(selectedProyecto.value)
    list = list.filter(i => Number(i.idProyecto) === proyId)
  }

  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    list = list.filter(i => 
      i.name.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q) ||
      i.cliente.toLowerCase().includes(q) ||
      i.nombreProyecto.toLowerCase().includes(q)
    )
  }

  return list
})

const matrixLocations = computed(() => {
  const locMap = new Map()
  filteredItems.value.forEach(item => {
    const client = item.cliente || 'Otros Clientes'
    const project = item.nombreProyecto || 'Proyecto General'
    const faena = item.location || 'Ubicación General'
    const key = `${client}|${project}|${faena}`
    
    if (!locMap.has(key)) {
      locMap.set(key, {
        key,
        client,
        project,
        faena,
        categories: {}
      })
    }
    
    const locObj = locMap.get(key)
    const cat = item.category || 'Otros'
    if (!locObj.categories[cat]) {
      locObj.categories[cat] = []
    }
    locObj.categories[cat].push(item)
  })
  
  return Array.from(locMap.values()).sort((a, b) => {
    const clientComp = a.client.localeCompare(b.client, 'es', { sensitivity: 'base' })
    if (clientComp !== 0) return clientComp
    const projComp = a.project.localeCompare(b.project, 'es', { sensitivity: 'base' })
    if (projComp !== 0) return projComp
    return a.faena.localeCompare(b.faena, 'es', { sensitivity: 'base' })
  })
})

const matrixTree = computed(() => {
  const tree = {}
  matrixLocations.value.forEach(loc => {
    if (!tree[loc.client]) {
      tree[loc.client] = {
        name: loc.client,
        projects: {}
      }
    }
    
    if (!tree[loc.client].projects[loc.project]) {
      tree[loc.client].projects[loc.project] = {
        name: loc.project,
        locations: []
      }
    }
    
    tree[loc.client].projects[loc.project].locations.push(loc)
  })
  
  return Object.values(tree).map(clientObj => {
    const sortedProjects = Object.values(clientObj.projects).map(projObj => {
      return {
        name: projObj.name,
        locations: projObj.locations
      }
    }).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
    
    return {
      name: clientObj.name,
      projects: sortedProjects
    }
  }).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
})

function toggleClientCollapse(clientName) {
  if (collapsedClients.value.has(clientName)) {
    collapsedClients.value.delete(clientName)
  } else {
    collapsedClients.value.add(clientName)
  }
}

function toggleProjectCollapse(clientName, projectName) {
  const key = `${clientName}|${projectName}`
  if (collapsedProjects.value.has(key)) {
    collapsedProjects.value.delete(key)
  } else {
    collapsedProjects.value.add(key)
  }
}

function selectMatrixCell(locationKey, categoryName, items) {
  const key = `${locationKey}|${categoryName}`
  if (selectedMatrixCellKey.value === key) {
    selectedMatrixCellKey.value = null
    selectedMatrixCellItems.value = []
    selectedMatrixLocationName.value = ''
    selectedMatrixCategoryName.value = ''
  } else {
    selectedMatrixCellKey.value = key
    selectedMatrixCellItems.value = items
    const parts = locationKey.split('|')
    if (parts[1] === '') {
      selectedMatrixLocationName.value = `Cliente: ${parts[0]}`
    } else if (parts[2] === '') {
      selectedMatrixLocationName.value = `Cliente: ${parts[0]} > Proyecto: ${parts[1]}`
    } else {
      selectedMatrixLocationName.value = `${parts[0]} > ${parts[1]} > ${parts[2]}`
    }
    selectedMatrixCategoryName.value = categoryName
  }
}

function getCellData(loc, catName) {
  const items = loc.categories[catName] || []
  if (items.length === 0) {
    return { status: 'na', count: 0, items }
  }
  
  let status = 'ok'
  let criticalCount = 0
  let warningCount = 0
  
  items.forEach(item => {
    if (item.status === 'error') {
      status = 'error'
      criticalCount++
    } else if (item.status === 'warning') {
      if (status !== 'error') {
        status = 'warning'
      }
      warningCount++
    }
  })
  
  return {
    status,
    criticalCount,
    warningCount,
    totalCount: items.length,
    items
  }
}

function getProjectCellData(projGroup, catName) {
  let status = 'na'
  let criticalCount = 0
  let warningCount = 0
  let totalCount = 0
  const items = []
  
  projGroup.locations.forEach(loc => {
    const cell = getCellData(loc, catName)
    if (cell.status !== 'na') {
      if (status === 'na') status = 'ok'
      if (cell.status === 'error') {
        status = 'error'
      } else if (cell.status === 'warning' && status !== 'error') {
        status = 'warning'
      }
      criticalCount += cell.criticalCount || 0
      warningCount += cell.warningCount || 0
      totalCount += cell.totalCount || 0
      if (cell.items) {
        items.push(...cell.items)
      }
    }
  })
  
  return {
    status,
    criticalCount,
    warningCount,
    totalCount,
    items
  }
}

function getClientCellData(clientGroup, catName) {
  let status = 'na'
  let criticalCount = 0
  let warningCount = 0
  let totalCount = 0
  const items = []
  
  clientGroup.projects.forEach(projGroup => {
    const projCell = getProjectCellData(projGroup, catName)
    if (projCell.status !== 'na') {
      if (status === 'na') status = 'ok'
      if (projCell.status === 'error') {
        status = 'error'
      } else if (projCell.status === 'warning' && status !== 'error') {
        status = 'warning'
      }
      criticalCount += projCell.criticalCount || 0
      warningCount += projCell.warningCount || 0
      totalCount += projCell.totalCount || 0
      if (projCell.items) {
        items.push(...projCell.items)
      }
    }
  })
  
  return {
    status,
    criticalCount,
    warningCount,
    totalCount,
    items
  }
}

function getProjectOverallStatus(projGroup) {
  let status = 'ok'
  projGroup.locations.forEach(loc => {
    uniqueCategories.value.forEach(cat => {
      const cell = getCellData(loc, cat)
      if (cell.status === 'error') {
        status = 'error'
      } else if (cell.status === 'warning' && status !== 'error') {
        status = 'warning'
      }
    })
  })
  return status
}

function getClientOverallStatus(clientGroup) {
  let status = 'ok'
  clientGroup.projects.forEach(projGroup => {
    const projStatus = getProjectOverallStatus(projGroup)
    if (projStatus === 'error') {
      status = 'error'
    } else if (projStatus === 'warning' && status !== 'error') {
      status = 'warning'
    }
  })
  return status
}

function getCategoryIcon(cat) {
  const c = String(cat || '').toLowerCase()
  if (c.includes('extintor')) return Shield
  if (c.includes('izaje') || c.includes('amarre') || c.includes('cadena') || c.includes('eslinga')) return Wrench
  if (c.includes('epp') || c.includes('arnes') || c.includes('respirador') || c.includes('seguridad')) return ShieldCheck
  if (c.includes('comunicac') || c.includes('radio')) return Radio
  return Package
}

function formatDateString(str) {
  if (!str) return 'S/I'
  try {
    const parts = str.split('T')[0].split('-')
    if (parts.length === 3) {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const [y, m, d] = parts.map(Number)
      return `${months[m - 1]} ${d}, ${y}`
    }
  } catch {}
  return str
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return ''
  try {
    if (dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-').map(Number)
      return `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y}`
    }
  } catch {}
  return dateStr
}

function openDetail(item) {
  // Omit / Redirect to general 360 page or do nothing since dashboard handles cell inline expansion
  console.log('Ficha detail for item:', item)
}

// Fetch Master and Manual Registros
const loadDashboardData = async () => {
  try {
    const { data: proys } = await sstAxios.get('/sst/proyectos')
    projects.value = proys

    const { data: recs } = await sstAxios.get('/sst/registros')
    allRecords.value = recs

    const { data: autoStats } = await sstAxios.get('/sst/indicadores-automaticos').catch(() => ({ data: [] }))
    automatedStats.value = autoStats

    // Fetch surveys
    const todayStr = new Date().toISOString().split('T')[0]
    const { data: surveyRes } = await apiAxios.get('/servicio/leanglobal/procesosSurveyV3', {
      params: {
        fecha_desde: '2025-01-01',
        fecha_hasta: todayStr
      }
    }).catch(() => ({ data: { datos: [] } }))
    surveys.value = surveyRes?.datos || []

    // Fetch fleet
    const fleetRes = await fetch('https://servidor.leanglobal.cl:3443/api/crm/CRMObtenerFlota360').then(r => r.json()).catch(() => [])
    fleet.value = Array.isArray(fleetRes) ? fleetRes : (fleetRes.items || [])

    // Fetch audits
    const { data: ressoRes } = await sstAxios.get(`/audits?type=RESSO&_t=${Date.now()}`).catch(() => ({ data: [] }))
    ressoAudits.value = Array.isArray(ressoRes) ? ressoRes : []

    const { data: recssRes } = await sstAxios.get(`/audits?type=RECSS&_t=${Date.now()}`).catch(() => ({ data: [] }))
    recssAudits.value = Array.isArray(recssRes) ? recssRes : []

    const { data: minsalRes } = await sstAxios.get(`/audits?type=MINSAL&_t=${Date.now()}`).catch(() => ({ data: [] }))
    minsalAudits.value = Array.isArray(minsalRes) ? minsalRes : []

    filterData()
  } catch (err) {
    console.error('Error loading dashboard data:', err)
  }
}

// Filter dataset dynamically based on UI dropdown filters
const filterData = () => {
  let temp = [...allRecords.value]
  let tempAuto = [...automatedStats.value]
  let tempSurveys = [...surveys.value]

  // Filter by Period (monthly period 'YYYY-MM' or 'YTD')
  if (selectedPeriod.value !== 'YTD') {
    const [anio, mes] = selectedPeriod.value.split('-').map(Number)
    
    // Filter records
    temp = temp.filter(r => r.periodo_anio === anio && r.periodo_mes === mes)
    
    // Filter auto stats
    tempAuto = tempAuto.filter(r => r.periodo_anio === anio && r.periodo_mes === mes)

    // Filter surveys: match fecha_plan_ini (or fecha_real_ini fallback) to the year and month
    tempSurveys = tempSurveys.filter(s => {
      const dateStr = s.fecha_plan_ini || s.fecha_real_ini
      if (!dateStr) return false
      const d = new Date(dateStr)
      return d.getFullYear() === anio && (d.getMonth() + 1) === mes
    })
  } else {
    // If YTD, filter by the latest active year in the dataset
    let activeYear = new Date().getFullYear()
    if (allRecords.value.length > 0) {
      activeYear = Math.max(...allRecords.value.map(r => r.periodo_anio))
    }
    
    temp = temp.filter(r => r.periodo_anio === activeYear)
    tempAuto = tempAuto.filter(r => r.periodo_anio === activeYear)
    
    tempSurveys = tempSurveys.filter(s => {
      const dateStr = s.fecha_plan_ini || s.fecha_real_ini
      if (!dateStr) return false
      const d = new Date(dateStr)
      return d.getFullYear() === activeYear
    })
  }

  // Filter by Sucursal / Contrato (selectedProyecto)
  if (selectedProyecto.value !== 'all') {
    const proyId = Number(selectedProyecto.value)
    temp = temp.filter(r => r.id_proyecto === proyId)
    tempAuto = tempAuto.filter(r => r.id_proyecto === proyId)
    tempSurveys = tempSurveys.filter(s => Number(s.id_proyecto) === proyId)
  }

  filteredRecords.value = temp
  filteredAutomatedStats.value = tempAuto
  filteredSurveys.value = tempSurveys

  aggregateMetrics()
  renderCharts()
}

// Aggregate dotación, HH, incidents and compute unified organizational indices
const aggregateMetrics = () => {
  let totalSTP = 0
  let totalCTP = 0
  let totalTrayecto = 0
  let totalLostDays = 0

  filteredRecords.value.forEach(r => {
    totalSTP += r.accidentes_stp || 0
    totalCTP += r.accidentes_ctp || 0
    totalTrayecto += r.accidentes_trayecto || 0
    totalLostDays += r.dias_perdidos || 0
  })

  // Group records by period (year-month) to compute monthly totals first
  const monthlyTotals = {}
  filteredRecords.value.forEach(r => {
    const key = `${r.periodo_anio}-${r.periodo_mes}`
    if (!monthlyTotals[key]) {
      monthlyTotals[key] = { dotacion: 0, hh: 0, accidents: 0 }
    }
    monthlyTotals[key].dotacion += r.dotacion_promedio || 0
    monthlyTotals[key].hh += r.horas_hombre || 0
    monthlyTotals[key].accidents += (r.accidentes_stp || 0) + (r.accidentes_ctp || 0) + (r.accidentes_trayecto || 0)
  })

  const monthsCount = Object.keys(monthlyTotals).length || 1
  let sumDotacion = 0
  let sumHH = 0
  let sumAccidents = 0

  Object.values(monthlyTotals).forEach(m => {
    sumDotacion += m.dotacion
    sumHH += m.hh
    sumAccidents += m.accidents
  })

  kpis.value = {
    dotacion: Math.round(sumDotacion / monthsCount) || 0,
    horasHombre: sumHH,
    accidentes: sumAccidents
  }

  // Global Indices
  currentIF.value = calculateIF(totalCTP, kpis.value.horasHombre)
  currentIG.value = calculateIG(totalLostDays, kpis.value.horasHombre)
  currentIA.value = calculateIA(totalCTP, kpis.value.dotacion)

  // Calculate Observaciones Conductuales stats (survey type 7)
  const obsSurveys = filteredSurveys.value.filter(s => Number(s.id_tipo_srv) === 7)
  const obsProgr = obsSurveys.length
  const obsEjec = obsSurveys.filter(s => s.estado_srv !== 'Pre Creado').length
  const obsPct = obsProgr > 0 ? Math.round((obsEjec / obsProgr) * 100) : 0
  obsConductualStats.value = { progr: obsProgr, ejec: obsEjec, pct: obsPct }

  // Calculate Inspecciones de Seguridad stats (survey type 8)
  const inspSurveys = filteredSurveys.value.filter(s => Number(s.id_tipo_srv) === 8)
  const inspProgr = inspSurveys.length
  const inspEjec = inspSurveys.filter(s => s.estado_srv !== 'Pre Creado').length
  const inspPct = inspProgr > 0 ? Math.round((inspEjec / inspProgr) * 100) : 0
  inspSeguridadStats.value = { progr: inspProgr, ejec: inspEjec, pct: inspPct }

  // Map Sucursal aggregated metrics
  const sucsMap = {}
  filteredRecords.value.forEach(r => {
    if (!sucsMap[r.id_proyecto]) {
      sucsMap[r.id_proyecto] = {
        id_proyecto: r.id_proyecto,
        nombre_proyecto: r.nombre_proyecto,
        codi_proyecto: r.codi_proyecto,
        dotacion_promedio: 0,
        horas_hombre: 0,
        accidentes_ctp: 0,
        count: 0
      }
    }
    const s = sucsMap[r.id_proyecto]
    s.dotacion_promedio += r.dotacion_promedio || 0
    s.horas_hombre += r.horas_hombre || 0
    s.accidentes_ctp += r.accidentes_ctp || 0
    s.count++
  })

  sucursalKPIs.value = Object.values(sucsMap).map(s => ({
    ...s,
    dotacion_promedio: Math.round(s.dotacion_promedio / s.count)
  })).slice(0, 3)

  // Map Matrix/Heatmap data dynamically
  const actsVals = []
  const condsVals = []
  const incsVals = []

  projects.value.forEach(p => {
    const projectStats = filteredAutomatedStats.value.filter(s => s.id_proyecto === p.id_proyecto)
    const totalActs = projectStats.reduce((sum, s) => sum + Number(s.total_actos_inseguros || 0), 0)
    const totalConds = projectStats.reduce((sum, s) => sum + Number(s.total_condiciones_inseguras || 0), 0)
    
    const projectRecords = filteredRecords.value.filter(r => r.id_proyecto === p.id_proyecto)
    const totalIncs = projectRecords.reduce((sum, r) => sum + (r.accidentes_stp || 0) + (r.accidentes_ctp || 0) + (r.accidentes_trayecto || 0), 0)

    actsVals.push(totalActs)
    condsVals.push(totalConds)
    incsVals.push(totalIncs)
  })

  heatmapData.value = [
    { name: 'Cond. Riesgosas', values: actsVals },
    { name: 'Cond. Inseg.', values: condsVals },
    { name: 'Incidentes', values: incsVals }
  ]
}

// Chart Refs
const chartConductasRiesgosas = ref(null)
const chartCondicionesInseguras = ref(null)
const chartSeveridad = ref(null)
const chartFrecuencia = ref(null)
const chartAccidentabilidad = ref(null)

const chartResso = ref(null)
const chartRecss = ref(null)
const chartMinsal = ref(null)
const chartFlota = ref(null)

const chartObsConductual = ref(null)
const chartInspSeguridad = ref(null)

// Render Highcharts Trends
const renderCharts = () => {
  const mesesCat = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']

  // For trends, filter by active year
  let activeYear = new Date().getFullYear()
  if (selectedPeriod.value !== 'YTD') {
    activeYear = Number(selectedPeriod.value.split('-')[0])
  } else if (allRecords.value.length > 0) {
    activeYear = Math.max(...allRecords.value.map(r => r.periodo_anio))
  }

  // Filter automatedStats by activeYear
  let activeAutoStats = automatedStats.value.filter(s => s.periodo_anio === activeYear)
  if (selectedProyecto.value !== 'all') {
    const proyId = Number(selectedProyecto.value)
    activeAutoStats = activeAutoStats.filter(s => s.id_proyecto === proyId)
  }

  // 12-month array for total sum
  const totalConductsSeries = Array(12).fill(0)
  const totalConditionsSeries = Array(12).fill(0)

  // Group by project
  const conductsByProject = {}
  const conditionsByProject = {}

  // Initialize all projects with zero arrays
  projects.value.forEach(p => {
    conductsByProject[p.id_proyecto] = {
      name: p.nombre_proyecto,
      data: Array(12).fill(0)
    }
    conditionsByProject[p.id_proyecto] = {
      name: p.nombre_proyecto,
      data: Array(12).fill(0)
    }
  })

  activeAutoStats.forEach(stat => {
    const mIdx = (stat.periodo_mes || 1) - 1
    if (mIdx >= 0 && mIdx < 12) {
      const conductsVal = Number(stat.total_conductas_riesgosas || 0)
      const conditionsVal = Number(stat.total_condiciones_inseguras || 0)

      totalConductsSeries[mIdx] += conductsVal
      totalConditionsSeries[mIdx] += conditionsVal

      // Project series
      if (conductsByProject[stat.id_proyecto]) {
        conductsByProject[stat.id_proyecto].data[mIdx] += conductsVal
      }
      if (conditionsByProject[stat.id_proyecto]) {
        conditionsByProject[stat.id_proyecto].data[mIdx] += conditionsVal
      }
    }
  })

  // If empty dataset, do not inject pilot trends (use real data)

  // Format Conductas stacked column + line
  const seriesConductas = []
  Object.keys(conductsByProject).forEach(pId => {
    const proyData = conductsByProject[pId]
    const sum = proyData.data.reduce((a, b) => a + b, 0)
    if (sum > 0 || selectedProyecto.value !== 'all') {
      seriesConductas.push({
        name: proyData.name,
        type: 'column',
        data: proyData.data,
        stack: 'proyecto'
      })
    }
  })
  seriesConductas.push({
    name: 'Total Ocurrencias',
    type: 'spline',
    data: totalConductsSeries,
    color: '#10b981', // Emerald
    lineWidth: 3,
    marker: {
      enabled: true,
      radius: 4,
      fillColor: '#ffffff',
      lineWidth: 2,
      lineColor: '#10b981'
    }
  })

  // Format Condiciones stacked column + line
  const seriesCondiciones = []
  Object.keys(conditionsByProject).forEach(pId => {
    const proyData = conditionsByProject[pId]
    const sum = proyData.data.reduce((a, b) => a + b, 0)
    if (sum > 0 || selectedProyecto.value !== 'all') {
      seriesCondiciones.push({
        name: proyData.name,
        type: 'column',
        data: proyData.data,
        stack: 'proyecto'
      })
    }
  })
  seriesCondiciones.push({
    name: 'Total Ocurrencias',
    type: 'spline',
    data: totalConditionsSeries,
    color: '#f59e0b', // Amber
    lineWidth: 3,
    marker: {
      enabled: true,
      radius: 4,
      fillColor: '#ffffff',
      lineWidth: 2,
      lineColor: '#f59e0b'
    }
  })

  // Ratios Calculations for IG, IF, IA
  let trendRecords = allRecords.value.filter(r => r.periodo_anio === activeYear)
  if (selectedProyecto.value !== 'all') {
    const proyId = Number(selectedProyecto.value)
    trendRecords = trendRecords.filter(r => r.id_proyecto === proyId)
  }

  const severidadSeries = Array(12).fill(0)
  const frecuenciaSeries = Array(12).fill(0)
  const accidentabilidadSeries = Array(12).fill(0)

  // Accumulate monthly values for ratio calculations
  const monthlySums = Array(12).fill(null).map(() => ({
    diasPerdidos: 0,
    horasHombre: 0,
    accidentesCtp: 0,
    dotacion: 0
  }))

  trendRecords.forEach(r => {
    const mIdx = (r.periodo_mes || 1) - 1
    if (mIdx >= 0 && mIdx < 12) {
      monthlySums[mIdx].diasPerdidos += r.dias_perdidos || 0
      monthlySums[mIdx].horasHombre += r.horas_hombre || 0
      monthlySums[mIdx].accidentesCtp += r.accidentes_ctp || 0
      monthlySums[mIdx].dotacion += r.dotacion_promedio || 0
    }
  })

  // Compute ratios per month
  monthlySums.forEach((sums, i) => {
    if (sums.horasHombre > 0) {
      severidadSeries[i] = Number(((sums.diasPerdidos * 1000000) / sums.horasHombre).toFixed(2))
      frecuenciaSeries[i] = Number(((sums.accidentesCtp * 1000000) / sums.horasHombre).toFixed(2))
    }
    if (sums.dotacion > 0) {
      accidentabilidadSeries[i] = Number(((sums.accidentesCtp / sums.dotacion) * 100).toFixed(2))
    }
  })

  // No fallbacks, show real database indexes (0 if no records)

  const isDark = document.documentElement.classList.contains('dark')
  // Forzar estilos claros para los histogramas ya que las tarjetas de fondo son siempre gris oscuro
  const textColor = '#a1a1aa'
  const gridLineColor = 'rgba(255, 255, 255, 0.08)'
  const lineColor = 'rgba(255, 255, 255, 0.15)'

  const baseChartConfig = {
    chart: { backgroundColor: 'transparent', margin: [15, 20, 35, 45] },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      categories: mesesCat,
      labels: { 
        style: { color: textColor, fontSize: '10px', fontWeight: 'bold' }, 
        step: 1,
        y: 20
      },
      tickWidth: 0, 
      lineWidth: 1, 
      lineColor: lineColor
    },
    yAxis: { 
      title: { text: null }, 
      labels: { 
        style: { color: textColor, fontSize: '9px' },
        enabled: true 
      }, 
      gridLineWidth: 1,
      gridLineColor: gridLineColor
    },
    plotOptions: {
      areaspline: { lineWidth: 3, marker: { enabled: false }, fillOpacity: 0.2, states: { hover: { lineWidth: 4 } } },
      line: { lineWidth: 3, marker: { enabled: false }, states: { hover: { lineWidth: 4 } } }
    },
    tooltip: { backgroundColor: 'rgba(9,9,11,0.9)', borderColor: '#3f3f46', style: { color: '#fff' } }
  }

  if (chartConductasRiesgosas.value) {
    Highcharts.chart(chartConductasRiesgosas.value, {
      ...baseChartConfig,
      chart: { ...baseChartConfig.chart, type: 'column' },
      legend: { enabled: true, itemStyle: { color: textColor, fontSize: '9px' } },
      plotOptions: {
        column: {
          stacking: 'normal',
          borderWidth: 0,
          borderRadius: 3
        }
      },
      series: seriesConductas
    })
  }

  if (chartCondicionesInseguras.value) {
    Highcharts.chart(chartCondicionesInseguras.value, {
      ...baseChartConfig,
      chart: { ...baseChartConfig.chart, type: 'column' },
      legend: { enabled: true, itemStyle: { color: textColor, fontSize: '9px' } },
      plotOptions: {
        column: {
          stacking: 'normal',
          borderWidth: 0,
          borderRadius: 3
        }
      },
      series: seriesCondiciones
    })
  }

  if (chartSeveridad.value) {
    Highcharts.chart(chartSeveridad.value, {
      ...baseChartConfig,
      chart: { ...baseChartConfig.chart, type: 'column' },
      plotOptions: {
        column: {
          borderWidth: 0,
          borderRadius: 3,
          color: '#f59e0b'
        }
      },
      series: [{ name: 'Índice de Severidad', data: severidadSeries }]
    })
  }

  if (chartFrecuencia.value) {
    Highcharts.chart(chartFrecuencia.value, {
      ...baseChartConfig,
      chart: { ...baseChartConfig.chart, type: 'column' },
      plotOptions: {
        column: {
          borderWidth: 0,
          borderRadius: 3,
          color: '#2563eb'
        }
      },
      series: [{ name: 'Índice de Frecuencia', data: frecuenciaSeries }]
    })
  }

  if (chartAccidentabilidad.value) {
    Highcharts.chart(chartAccidentabilidad.value, {
      ...baseChartConfig,
      chart: { ...baseChartConfig.chart, type: 'column' },
      plotOptions: {
        column: {
          borderWidth: 0,
          borderRadius: 3,
          color: '#ef4444'
        }
      },
      series: [{ name: 'Índice de Accidentabilidad', data: accidentabilidadSeries }]
    })
  }

  // Cumplimiento checklists trends (RESSO, RECSS, MINSAL)
  const ressoMonthlyData = getMonthlyAuditScores(ressoAudits.value, activeYear, selectedProyecto.value)
  const recssMonthlyData = getMonthlyAuditScores(recssAudits.value, activeYear, selectedProyecto.value)
  const minsalMonthlyData = getMonthlyAuditScores(minsalAudits.value, activeYear, selectedProyecto.value)

  if (chartResso.value) {
    Highcharts.chart(chartResso.value, {
      ...baseChartConfig,
      chart: { ...baseChartConfig.chart, type: 'areaspline' },
      series: [{ name: 'Cumplimiento RESSO', data: ressoMonthlyData, color: '#10b981' }]
    })
  }

  if (chartRecss.value) {
    Highcharts.chart(chartRecss.value, {
      ...baseChartConfig,
      chart: { ...baseChartConfig.chart, type: 'areaspline' },
      series: [{ name: 'Cumplimiento RECSS', data: recssMonthlyData, color: '#2563eb' }]
    })
  }

  if (chartMinsal.value) {
    Highcharts.chart(chartMinsal.value, {
      ...baseChartConfig,
      chart: { ...baseChartConfig.chart, type: 'areaspline' },
      series: [{ name: 'Cumplimiento MINSAL', data: minsalMonthlyData, color: '#e11d48' }]
    })
  }

  // Render donut charts for observations and safety inspections
  const emptySegmentColor = isDark ? '#27272a' : '#e4e4e7'

  if (chartObsConductual.value) {
    const ejec = obsConductualStats.value.ejec
    const pend = Math.max(0, obsConductualStats.value.progr - ejec)
    const data = []
    if (ejec === 0 && pend === 0) {
      data.push({ name: 'Sin programaciones', y: 1, color: emptySegmentColor })
    } else {
      if (ejec > 0) data.push({ name: 'Ejecutadas', y: ejec, color: '#10b981' })
      if (pend > 0) data.push({ name: 'Pendientes', y: pend, color: emptySegmentColor })
    }

    Highcharts.chart(chartObsConductual.value, {
      chart: { type: 'pie', backgroundColor: 'transparent', width: 110, height: 110, margin: [0, 0, 0, 0] },
      title: { text: null },
      credits: { enabled: false },
      tooltip: { backgroundColor: 'rgba(9,9,11,0.9)', borderColor: '#3f3f46', style: { color: '#fff' } },
      plotOptions: {
        pie: {
          innerSize: '65%',
          size: '100%',
          borderWidth: 0,
          dataLabels: { enabled: false },
          showInLegend: false
        }
      },
      series: [{ name: 'Observaciones', data }]
    })
  }

  if (chartInspSeguridad.value) {
    const ejec = inspSeguridadStats.value.ejec
    const pend = Math.max(0, inspSeguridadStats.value.progr - ejec)
    const data = []
    if (ejec === 0 && pend === 0) {
      data.push({ name: 'Sin programaciones', y: 1, color: emptySegmentColor })
    } else {
      if (ejec > 0) data.push({ name: 'Ejecutadas', y: ejec, color: '#3b82f6' })
      if (pend > 0) data.push({ name: 'Pendientes', y: pend, color: emptySegmentColor })
    }

    Highcharts.chart(chartInspSeguridad.value, {
      chart: { type: 'pie', backgroundColor: 'transparent', width: 110, height: 110, margin: [0, 0, 0, 0] },
      title: { text: null },
      credits: { enabled: false },
      tooltip: { backgroundColor: 'rgba(9,9,11,0.9)', borderColor: '#3f3f46', style: { color: '#fff' } },
      plotOptions: {
        pie: {
          innerSize: '65%',
          size: '100%',
          borderWidth: 0,
          dataLabels: { enabled: false },
          showInLegend: false
        }
      },
      series: [{ name: 'Inspecciones', data }]
    })
  }

  if (chartDocLegal.value) {
    const vencidos = filteredFleet.value.filter(item => Number(item.ESTADO_CERT_LEGAL) === 2).length
    const porVencer = filteredFleet.value.filter(item => Number(item.ESTADO_CERT_LEGAL) === 1).length
    const vigentes = filteredFleet.value.filter(item => Number(item.ESTADO_CERT_LEGAL) === 0).length
    
    const data = []
    if (vencidos === 0 && porVencer === 0 && vigentes === 0) {
      data.push({ name: 'Sin registros', y: 1, color: emptySegmentColor })
    } else {
      if (vigentes > 0) data.push({ name: 'Vigente', y: vigentes, color: '#10b981' })
      if (porVencer > 0) data.push({ name: 'Por Vencer', y: porVencer, color: '#f59e0b' })
      if (vencidos > 0) data.push({ name: 'Vencido', y: vencidos, color: '#ef4444' })
    }

    Highcharts.chart(chartDocLegal.value, {
      chart: { type: 'pie', backgroundColor: 'transparent', height: 160, margin: [0, 0, 0, 0] },
      title: { text: null },
      credits: { enabled: false },
      tooltip: { backgroundColor: 'rgba(9,9,11,0.9)', borderColor: '#3f3f46', style: { color: '#fff' } },
      plotOptions: {
        pie: {
          innerSize: '60%',
          borderWidth: 0,
          dataLabels: { enabled: false },
          showInLegend: false
        }
      },
      series: [{ name: 'Documentos', data }]
    })
  }

  if (chartDocGeneral.value) {
    const vencidos = filteredFleet.value.filter(item => Number(item.ESTADO_CERT_GRAL) === 2).length
    const porVencer = filteredFleet.value.filter(item => Number(item.ESTADO_CERT_GRAL) === 1).length
    const vigentes = filteredFleet.value.filter(item => Number(item.ESTADO_CERT_GRAL) === 0).length
    
    const data = []
    if (vencidos === 0 && porVencer === 0 && vigentes === 0) {
      data.push({ name: 'Sin registros', y: 1, color: emptySegmentColor })
    } else {
      if (vigentes > 0) data.push({ name: 'Vigente', y: vigentes, color: '#10b981' })
      if (porVencer > 0) data.push({ name: 'Por Vencer', y: porVencer, color: '#f59e0b' })
      if (vencidos > 0) data.push({ name: 'Vencido', y: vencidos, color: '#ef4444' })
    }

    Highcharts.chart(chartDocGeneral.value, {
      chart: { type: 'pie', backgroundColor: 'transparent', height: 160, margin: [0, 0, 0, 0] },
      title: { text: null },
      credits: { enabled: false },
      tooltip: { backgroundColor: 'rgba(9,9,11,0.9)', borderColor: '#3f3f46', style: { color: '#fff' } },
      plotOptions: {
        pie: {
          innerSize: '60%',
          borderWidth: 0,
          dataLabels: { enabled: false },
          showInLegend: false
        }
      },
      series: [{ name: 'Documentos', data }]
    })
  }
}

let themeObserver = null

onMounted(() => {
  loadDashboardData()
  themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        renderCharts()
      }
    })
  })
  themeObserver.observe(document.documentElement, { attributes: true })
})

onUnmounted(() => {
  if (themeObserver) {
    themeObserver.disconnect()
  }
})
</script>

<style scoped>
.glass-card {
  background: rgba(17, 17, 19, 0.9);
  backdrop-filter: blur(10px);
}
</style>
