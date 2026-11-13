<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300 no-print-section">
    <!-- Header Principal Módulo Mantenimiento (Estilo Corporativo GSP Enterprise) -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-6">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-amber-400 rounded-2xl border border-amber-500/30 shadow-xl shadow-amber-500/10">
          <Wrench class="w-8 h-8" />
        </div>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white uppercase font-mono">{{ isRadarMode ? 'Radar de Horómetros y Odómetros' : 'Consola de Mantenimiento de Flota' }}</h1>
            <span class="text-[10px] font-black bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/30 tracking-widest uppercase">SPEC 67 ENTERPRISE</span>
          </div>
          <p class="text-slate-400 text-xs mt-1">{{ isRadarMode ? 'Control en tiempo real de Triple Reloj (Grúa 250 hrs · Chasis 250 hrs · Odómetro 10.000 km), diferencias contra última mantención y programación preventiva' : 'Gestión integral de OTs de taller interno, pautas preventivas cíclicas, avisos de avería, hallazgos y cierre supervisado FES' }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="fetchRealData"
          class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl border border-slate-800 transition-all text-xs font-bold uppercase tracking-wider"
          title="Refrescar datos del servidor"
        >
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': loadingData }" />
          Actualizar
        </button>

        <button
          v-if="!isRadarMode"
          @click="abrirModalNuevoAviso()"
          class="flex items-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 font-black px-4 py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider shadow-lg"
          title="Registrar evento de falla o parada de máquina en terreno"
        >
          <AlertTriangle class="w-4 h-4" />
          Reportar Avería
        </button>

        <button
          @click="abrirModalNuevaOt()"
          class="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-xl transition-all duration-200 shadow-xl shadow-amber-500/20 text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle class="w-4 h-4" />
          {{ isRadarMode ? 'Programar Mantención' : 'Abrir Nueva OT' }}
        </button>
      </div>
    </div>

    <!-- MODO OTS TALLER: BANNER EJECUTIVO DE KPIS REALES DE TALLER -->
    <template v-if="!isRadarMode">
    <div class="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
      <!-- 1. Disponibilidad Flota % -->
      <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm">
        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>Disponibilidad</span>
          <span class="text-emerald-400 text-[10px] font-mono">≥ 90%</span>
        </div>
        <div class="text-2xl font-black font-mono mt-1" :class="Number(kpisData?.disponibilidad_flota_pct ?? 100) >= 90 ? 'text-emerald-400' : 'text-amber-400'">
          {{ Number(kpisData?.disponibilidad_flota_pct ?? 100).toFixed(0) }}%
        </div>
        <div class="text-[10px] text-slate-500 mt-1 truncate">
          {{ kpisData?.flota?.operativas ?? 58 }} de {{ kpisData?.flota?.total ?? 58 }} grúas operativas
        </div>
      </div>

      <!-- 2. Cumplimiento Preventivo % -->
      <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm">
        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>Cumplimiento PM</span>
          <span class="text-emerald-400 text-[10px] font-mono">≥ 85%</span>
        </div>
        <div class="text-2xl font-black font-mono mt-1 text-white">
          {{ Number(kpisData?.cumplimiento_pm_pct ?? 100).toFixed(0) }}%
        </div>
        <div class="text-[10px] text-slate-500 mt-1 truncate">
          {{ kpisData?.ots_por_estado?.CERRADA ?? 0 }} OTs preventivas cerradas
        </div>
      </div>

      <!-- 3. Ratio PM / CM -->
      <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm">
        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>Ratio PM / CM</span>
          <span class="text-amber-400 text-[10px] font-mono">4:1 Meta</span>
        </div>
        <div class="text-2xl font-black font-mono mt-1 text-amber-400">
          {{ Number(kpisData?.ratio_pm_pct ?? 80).toFixed(0) }}%
        </div>
        <div class="text-[10px] text-slate-500 mt-1 truncate">
          {{ kpisData?.ratio_pm_pct ?? 80 }}% PM vs {{ kpisData?.ratio_cm_pct ?? 20 }}% CM
        </div>
      </div>

      <!-- 4. Backlog de Taller (Semanas) -->
      <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm">
        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>Backlog Taller</span>
          <span class="text-cyan-400 text-[10px] font-mono">2-4 sem</span>
        </div>
        <div class="text-2xl font-black font-mono mt-1 text-cyan-400">
          {{ Number(kpisData?.backlog_semanas ?? 0).toFixed(1) }}
          <span class="text-xs text-slate-500 font-normal">sem</span>
        </div>
        <div class="text-[10px] text-slate-500 mt-1 truncate">
          {{ Number(kpisData?.backlog_horas ?? 0) }} HH pendientes
        </div>
      </div>

      <!-- 5. OTs Envejecidas (>7 días) -->
      <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm">
        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>OTs Envejecidas</span>
          <span class="text-rose-400 text-[10px] font-mono">> 7d</span>
        </div>
        <div class="text-2xl font-black font-mono mt-1" :class="Number(kpisData?.ots_envejecidas_count ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'">
          {{ kpisData?.ots_envejecidas_count ?? 0 }}
        </div>
        <div class="text-[10px] text-slate-500 mt-1 truncate">
          OTs con más de 7 días abiertas
        </div>
      </div>

      <!-- 6. Gasto Mensual Taller ($ CLP) -->
      <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm">
        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>Gasto Mes Taller</span>
          <span class="text-emerald-400 text-[10px] font-mono">CLP</span>
        </div>
        <div class="text-2xl font-black font-mono mt-1 text-emerald-400">
          ${{ formatClp(kpisData?.gasto_mes_clp || 0) }}
        </div>
        <div class="text-[10px] text-slate-500 mt-1 truncate">
          Costo acumulado mes actual
        </div>
      </div>
    </div>

    <!-- TIRA DE ALERTA CRÍTICA (ATTENTION STRIP) -->
    <div v-if="alertasCriticas.length > 0" class="mb-6 space-y-2">
      <div
        v-for="(alerta, idx) in alertasCriticas"
        :key="idx"
        class="rounded-xl border p-3 flex items-center justify-between gap-3 text-xs"
        :class="alerta.tipo === 'ROJO' ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' : 'bg-amber-950/40 border-amber-500/40 text-amber-300'"
      >
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 shrink-0" />
          <span class="font-bold">{{ alerta.titulo }}:</span>
          <span>{{ alerta.mensaje }}</span>
        </div>
        <button
          v-if="alerta.accion"
          @click="ejecutarAccionAlerta(alerta)"
          class="font-black underline uppercase text-[11px] shrink-0 hover:text-white"
        >
          {{ alerta.accionTexto || 'Verificar' }} ➔
        </button>
      </div>
    </div>
    </template>

    <!-- MODO RADAR FLOTA: SCORECARDS BI DE CICLO PREVENTIVO (CLICK-TO-FILTER) Y ALERTAS DE FLOTA -->
    <template v-else>
      <div class="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <!-- 1. Total Flota en Radar -->
        <button
          type="button"
          @click="radarFilterEstado = 'ALL'"
          :class="['text-left rounded-2xl p-3.5 shadow-xl backdrop-blur-sm border transition-all', radarFilterEstado === 'ALL' ? 'bg-slate-800/90 border-amber-500 ring-1 ring-amber-500/40' : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700']"
        >
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Total Flota Radar</span>
            <span class="text-amber-400 text-[10px] font-mono">3 Relojes</span>
          </div>
          <div class="text-2xl font-black font-mono mt-1 text-white">
            {{ radarKpis.total }}
          </div>
          <div class="text-[10px] text-slate-400 mt-1 truncate">
            Activos monitoreados
          </div>
        </button>

        <!-- 2. Máquinas Al Día -->
        <button
          type="button"
          @click="radarFilterEstado = radarFilterEstado === 'OK' ? 'ALL' : 'OK'"
          :class="['text-left rounded-2xl p-3.5 shadow-xl backdrop-blur-sm border transition-all', radarFilterEstado === 'OK' ? 'bg-emerald-950/50 border-emerald-400 ring-1 ring-emerald-400/40' : 'bg-slate-900/80 border-slate-800/80 hover:border-emerald-500/40']"
        >
          <div class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>🟢 Máquinas Al Día</span>
            <span class="text-emerald-400 text-[10px] font-mono">OK</span>
          </div>
          <div class="text-2xl font-black font-mono mt-1 text-emerald-400">
            {{ radarKpis.alDia }}
          </div>
          <div class="text-[10px] text-slate-400 mt-1 truncate">
            Holgura > 50h y > 2.000 km
          </div>
        </button>

        <!-- 3. Próximas a Mantener -->
        <button
          type="button"
          @click="radarFilterEstado = radarFilterEstado === 'PROXIMO' ? 'ALL' : 'PROXIMO'"
          :class="['text-left rounded-2xl p-3.5 shadow-xl backdrop-blur-sm border transition-all', radarFilterEstado === 'PROXIMO' ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400/40' : 'bg-slate-900/80 border-slate-800/80 hover:border-amber-500/40']"
        >
          <div class="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>🟡 Próximas a Mantener</span>
            <span class="text-amber-300 text-[10px] font-mono">≤ 50h / 2k km</span>
          </div>
          <div class="text-2xl font-black font-mono mt-1 text-amber-400">
            {{ radarKpis.proximos }}
          </div>
          <div class="text-[10px] text-slate-400 mt-1 truncate">
            Planificar ventana preventiva
          </div>
        </button>

        <!-- 4. Mantenimiento Vencido -->
        <button
          type="button"
          @click="radarFilterEstado = radarFilterEstado === 'VENCIDO' ? 'ALL' : 'VENCIDO'"
          :class="['text-left rounded-2xl p-3.5 shadow-xl backdrop-blur-sm border transition-all', radarFilterEstado === 'VENCIDO' ? 'bg-rose-950/50 border-rose-400 ring-1 ring-rose-400/40' : 'bg-slate-900/80 border-slate-800/80 hover:border-rose-500/40']"
        >
          <div class="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>🔴 Mant. Vencido</span>
            <span class="text-rose-400 text-[10px] font-mono">Crítico</span>
          </div>
          <div class="text-2xl font-black font-mono mt-1" :class="radarKpis.vencidos > 0 ? 'text-rose-400' : 'text-emerald-400'">
            {{ radarKpis.vencidos }}
          </div>
          <div class="text-[10px] text-slate-400 mt-1 truncate">
            Excedieron 250h o 10.000 km
          </div>
        </button>

        <!-- 5. En Mantención (Taller) -->
        <button
          type="button"
          @click="radarFilterEstado = radarFilterEstado === 'EN_TALLER' ? 'ALL' : 'EN_TALLER'"
          :class="['text-left rounded-2xl p-3.5 shadow-xl backdrop-blur-sm border transition-all', radarFilterEstado === 'EN_TALLER' ? 'bg-cyan-950/50 border-cyan-400 ring-1 ring-cyan-400/40' : 'bg-slate-900/80 border-slate-800/80 hover:border-cyan-500/40']"
        >
          <div class="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>🔧 En Mantención</span>
            <span class="text-cyan-400 text-[10px] font-mono">Taller</span>
          </div>
          <div class="text-2xl font-black font-mono mt-1 text-cyan-400">
            {{ radarKpis.enTaller }}
          </div>
          <div class="text-[10px] text-slate-400 mt-1 truncate">
            Con OT activa en ejecución
          </div>
        </button>

        <!-- 6. Salud Preventiva de Flota % -->
        <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm">
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>📡 Salud Preventiva</span>
            <span class="text-emerald-400 text-[10px] font-mono">Meta ≥ 90%</span>
          </div>
          <div class="text-2xl font-black font-mono mt-1" :class="radarKpis.saludPct >= 90 ? 'text-emerald-400' : radarKpis.saludPct >= 75 ? 'text-amber-400' : 'text-rose-400'">
            {{ radarKpis.saludPct }}%
          </div>
          <div class="text-[10px] text-slate-400 mt-1 truncate">
            {{ radarKpis.total - radarKpis.vencidos }} de {{ radarKpis.total }} en regla
          </div>
        </div>
      </div>
    </template>

    <!-- NAVEGACIÓN PESTAÑAS OPERACIONALES DE TALLER (SOLO EN MODO OTS) -->
    <div v-if="!isRadarMode" class="flex border-b border-slate-800 gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 mb-6 overflow-x-auto">
      <button
        @click="activeMainTab = 'ots'"
        :class="['px-5 py-2.5 font-black text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap', activeMainTab === 'ots' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white']"
      >
        <Clock class="w-4 h-4" />
        <span>Bandeja de OTs ({{ filteredOts.length }})</span>
      </button>

      <button
        @click="activeMainTab = 'avisos'"
        :class="['px-5 py-2.5 font-black text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap', activeMainTab === 'avisos' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white']"
      >
        <AlertTriangle class="w-4 h-4" />
        <span>Avisos de Avería ({{ avisosAveria.filter(a => a.estado === 'PENDIENTE').length }})</span>
      </button>

      <button
        @click="activeMainTab = 'hallazgos'"
        :class="['px-5 py-2.5 font-black text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap', activeMainTab === 'hallazgos' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white']"
      >
        <ShieldCheck class="w-4 h-4" />
        <span>Hallazgos Taller ({{ hallazgosList.filter(h => h.estado === 'ABIERTO' || h.estado === 'EN_GESTION').length }})</span>
      </button>

      <button
        @click="activeMainTab = 'parametros'"
        :class="['px-5 py-2.5 font-black text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap', activeMainTab === 'parametros' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white']"
      >
        <Sliders class="w-4 h-4" />
        <span>Parámetros Operacionales</span>
      </button>
    </div>

    <!-- ========================================================================= -->
    <!-- PESTAÑA 1: BANDEJA GENERAL DE ORDENES DE TRABAJO (OTS)                     -->
    <!-- ========================================================================= -->
    <div v-if="activeMainTab === 'ots'" class="space-y-6">
      <!-- Banner Destacado de Avisos de Falla en Terreno Pendientes -->
      <div v-if="avisosAveria.filter(a => a.estado === 'PENDIENTE').length > 0" class="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div class="flex items-center gap-2.5 text-xs text-rose-300">
          <AlertTriangle class="w-5 h-5 text-rose-400 shrink-0" />
          <span>Hay <strong>{{ avisosAveria.filter(a => a.estado === 'PENDIENTE').length }} aviso(s) de avería</strong> en terreno pendientes de atención técnica.</span>
        </div>
        <button
          @click="activeMainTab = 'avisos'"
          class="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl uppercase tracking-wider transition-all shrink-0 shadow-lg shadow-rose-600/20"
        >
          Ver Avisos de Falla ➔
        </button>
      </div>

      <!-- Filtros Avanzados -->
      <div class="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4 items-center shadow-xl">
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div class="relative w-full md:w-72">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por Folio, Patente o Falla..."
              class="bg-slate-950/80 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs w-full focus:outline-none focus:border-amber-500 transition-colors font-mono"
            />
          </div>
          <!-- Filtro por Tipo -->
          <select v-model="filterTipo" class="bg-slate-950/80 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500">
            <option value="">Todos los Tipos</option>
            <option value="PREVENTIVO">🛡️ Preventivo</option>
            <option value="CORRECTIVO">🚨 Correctivo</option>
            <option value="PREDICTIVO">🔬 Predictivo</option>
          </select>
          <!-- Filtro por Estado FSM -->
          <select v-model="filterEstado" class="bg-slate-950/80 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 font-mono">
            <option value="">Todos los Estados</option>
            <option value="ABIERTA">ABIERTA</option>
            <option value="EN_PROCESO">EN_PROCESO</option>
            <option value="ESPERA_REPUESTOS">ESPERA_REPUESTOS</option>
            <option value="CERRADA">CERRADA</option>
            <option value="ANULADA">ANULADA</option>
          </select>
          <!-- Filtro por Prioridad -->
          <select v-model="filterPrioridad" class="bg-slate-950/80 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 font-mono">
            <option value="">Todas las Prioridades</option>
            <option value="1">P1 - Emergencia / Parada</option>
            <option value="2">P2 - Urgente (24-48h)</option>
            <option value="3">P3 - Normal Programable</option>
            <option value="4">P4 - Baja / Oportunidad</option>
          </select>
        </div>
        <div class="text-xs text-slate-400 font-semibold font-mono">
          OTs: <strong class="text-amber-400">{{ filteredOts.length }}</strong> de {{ otsStore.length }}
        </div>
      </div>

      <!-- Tabla de OTs (SPEC-097: Trazabilidad Completa de Creador, Inicio, Fin y Duración) -->
      <div class="overflow-x-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-sm">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider font-mono">
              <th class="p-3.5">Folio & Prioridad</th>
              <th class="p-3.5">Equipo & Horómetro</th>
              <th class="p-3.5">Tipo & Diagnóstico</th>
              <th class="p-3.5">Creador & Mecánico</th>
              <th class="p-3.5">Inicio</th>
              <th class="p-3.5">Término / Fin</th>
              <th class="p-3.5">Duración & HH</th>
              <th class="p-3.5">Costo Total</th>
              <th class="p-3.5">Estado FSM</th>
              <th class="p-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-if="filteredOts.length === 0">
              <td colspan="10" class="p-8 text-center text-slate-500 font-mono">
                No se encontraron órdenes de trabajo con los filtros seleccionados.
              </td>
            </tr>
            <tr v-for="ot in filteredOts" :key="ot.id_ot" class="hover:bg-slate-800/50 transition-colors cursor-pointer" @click="abrirDetalleOt(ot)">
              <td class="p-3.5">
                <div class="font-mono font-black text-amber-400 text-sm">{{ ot.numero_ot || ot.folio }}</div>
                <div class="mt-1 flex items-center gap-1.5">
                  <span :class="[
                    'px-1.5 py-0.5 rounded text-[10px] font-black font-mono border',
                    ot.prioridad === 1 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' :
                    ot.prioridad === 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  ]">
                    P{{ ot.prioridad || 3 }}
                  </span>
                  <span v-if="ot.equipo_detenido" class="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">DETENIDO</span>
                </div>
              </td>
              <td class="p-3.5">
                <div class="font-bold text-white">{{ ot.patente || `Equipo #${ot.id_equipo}` }}</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ ot.equipo_nombre || ot.marca_modelo }}</div>
                <div class="text-[10px] text-amber-400/90 font-mono mt-0.5">⏱️ {{ ot.horometro_inicio || 0 }} hrs</div>
              </td>
              <td class="p-3.5 max-w-[220px]">
                <div class="flex items-center gap-1.5">
                  <span :class="[
                    'px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border',
                    ot.tipo_mantenimiento === 'PREVENTIVO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    ot.tipo_mantenimiento === 'CORRECTIVO' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                    'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  ]">
                    {{ ot.tipo_mantenimiento }}
                  </span>
                  <span v-if="ot.codigo_pauta" class="text-[10px] font-mono text-amber-300 font-bold">
                    {{ ot.codigo_pauta }}
                  </span>
                </div>
                <div class="truncate text-slate-300 text-[11px] mt-1" :title="ot.descripcion_falla || ot.falla_reportada">
                  {{ ot.descripcion_falla || ot.falla_reportada }}
                </div>
              </td>
              <td class="p-3.5">
                <div class="text-[11px] text-slate-200">
                  <span class="text-slate-500 font-mono text-[10px]">Creada:</span>
                  <strong class="ml-1 text-white">{{ ot.nombre_creador || ot.nombre_supervisor || 'Sistema' }}</strong>
                </div>
                <div class="text-[11px] text-amber-400 mt-0.5">
                  <span class="text-slate-500 font-mono text-[10px]">Mecánico:</span>
                  <strong class="ml-1">{{ ot.nombre_tecnico || 'Sin asignar' }}</strong>
                </div>
              </td>
              <td class="p-3.5 font-mono">
                <div class="text-white text-[11px] font-bold">{{ formatDate(ot.fecha_creacion || ot.fecha_programada) }}</div>
                <div class="text-slate-400 text-[10px]">{{ formatTimeOnly(ot.fecha_creacion || ot.fecha_programada) }} hrs</div>
              </td>
              <td class="p-3.5 font-mono">
                <template v-if="ot.estado === 'CERRADA' && (ot.fecha_cierre || ot.fecha_cierre_real)">
                  <div class="text-emerald-400 text-[11px] font-bold">{{ formatDate(ot.fecha_cierre || ot.fecha_cierre_real) }}</div>
                  <div class="text-slate-400 text-[10px]">{{ formatTimeOnly(ot.fecha_cierre || ot.fecha_cierre_real) }} hrs</div>
                </template>
                <span v-else-if="ot.estado === 'ANULADA'" class="text-slate-500 text-[10px] uppercase">Anulada</span>
                <span v-else class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase">
                  En curso
                </span>
              </td>
              <td class="p-3.5 font-mono">
                <div class="text-white font-bold text-xs">{{ calcularDuracionOt(ot) }}</div>
                <div class="text-[10px] text-cyan-400 mt-0.5">{{ Number(ot.total_hh || 0) }} HH hombre</div>
              </td>
              <td class="p-3.5 font-mono">
                <div class="font-bold text-emerald-400">${{ formatClp(ot.costo_total_calculado || ot.costo_total || 0) }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Avance: {{ ot.porcentaje_avance || 0 }}%</div>
              </td>
              <td class="p-3.5">
                <span :class="[
                  'px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider font-mono border',
                  ot.estado === 'ABIERTA' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                  ot.estado === 'EN_PROCESO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  ot.estado === 'ESPERA_REPUESTOS' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                  ot.estado === 'CERRADA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                ]">
                  {{ ot.estado }}
                </span>
              </td>
              <td class="p-3.5 text-right" @click.stop>
                <button
                  @click="abrirDetalleOt(ot)"
                  class="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider inline-flex items-center gap-1 border border-slate-700 hover:border-amber-500 transition-colors"
                >
                  <Eye class="w-3.5 h-3.5" />
                  Abrir OT
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- PESTAÑA 2: RADAR FLOTA & CICLOS PREVENTIVOS FABRICANTE                     -->
    <!-- ========================================================================= -->
    <div v-if="activeMainTab === 'flota'" class="space-y-6">
      <div class="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div class="relative w-full sm:w-72">
            <input
              v-model="radarSearchQuery"
              type="text"
              placeholder="Buscar por Patente, Marca o Modelo..."
              class="bg-slate-950/80 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs w-full focus:outline-none focus:border-amber-500 transition-colors font-mono"
            />
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="f in [
                { id: 'ALL', label: `Todos (${radarKpis.total})` },
                { id: 'OK', label: `🟢 Al Día (${radarKpis.alDia})` },
                { id: 'PROXIMO', label: `🟡 Próximas (${radarKpis.proximos})` },
                { id: 'VENCIDO', label: `🔴 Vencidas (${radarKpis.vencidos})` },
                { id: 'EN_TALLER', label: `🔧 En Taller (${radarKpis.enTaller})` }
              ]"
              :key="f.id"
              type="button"
              @click="radarFilterEstado = f.id"
              :class="['px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all border', radarFilterEstado === f.id ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white']"
            >
              {{ f.label }}
            </button>
          </div>
        </div>
        <div class="text-xs text-slate-400 font-mono">
          Mostrando: <strong class="text-amber-400">{{ filteredRadarFlota.length }}</strong> de {{ flotaEquipos.length }} equipos
        </div>
      </div>

      <div class="overflow-x-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-sm">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider font-mono">
              <th class="p-4">Equipo / Patente</th>
              <th class="p-4">Modelo & Capacidad</th>
              <th class="p-4">Lectura Actual (Triple Reloj)</th>
              <th class="p-4">Última Mantención</th>
              <th class="p-4">Diferencia / Uso (Δ)</th>
              <th class="p-4">Cuánto Falta (250h / 10.000 km)</th>
              <th class="p-4">Estado Operativo</th>
              <th class="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-if="filteredRadarFlota.length === 0">
              <td colspan="8" class="p-8 text-center text-slate-500 font-mono">
                No se encontraron máquinas para el filtro seleccionado.
              </td>
            </tr>
            <tr v-for="eq in filteredRadarFlota" :key="eq.id_equipo" class="hover:bg-slate-800/50 transition-colors">
              <td class="p-4 font-mono font-black text-amber-400 text-sm">
                {{ eq.patente }}
              </td>
              <td class="p-4">
                <div class="font-bold text-white">{{ eq.marca }} {{ eq.modelo }}</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ eq.tonelaje_capacidad ? `${eq.tonelaje_capacidad} Ton` : eq.tipo_equipo }}</div>
              </td>
              <td class="p-4 font-mono">
                <div class="flex flex-col gap-1.5">
                  <div class="text-white font-bold text-xs flex items-center gap-1.5">
                    <span class="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black">GRÚA</span>
                    <span>{{ Number(eq.horometro_grua_acumulado || eq.horometro_actual || 0).toLocaleString('es-CL') }} hrs</span>
                  </div>
                  <div v-if="eq.tiene_doble_horometro || Number(eq.horometro_chasis_acumulado) > 0" class="text-cyan-300 font-bold text-[11px] flex items-center gap-1.5">
                    <span class="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[9px] font-black">CHASIS</span>
                    <span>{{ Number(eq.horometro_chasis_acumulado || 0).toLocaleString('es-CL') }} hrs</span>
                  </div>
                  <div class="text-emerald-300 font-bold text-[11px] flex items-center gap-1.5">
                    <span class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black">ODO</span>
                    <span>{{ Number(eq.odometro_acumulado || 0) > 0 ? `${Number(eq.odometro_acumulado).toLocaleString('es-CL')} km` : '— km' }}</span>
                  </div>
                  <div v-if="eq.fuente_ultima_lectura" class="text-[9px] text-slate-400 flex items-center gap-1">
                    <span class="px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">{{ eq.fuente_ultima_lectura }}</span>
                    <span v-if="eq.fecha_ultima_lectura">{{ new Date(eq.fecha_ultima_lectura).toLocaleDateString('es-CL') }}</span>
                  </div>
                </div>
              </td>
              <td class="p-4 font-mono">
                <div class="flex flex-col gap-1.5 text-[11px] text-slate-300">
                  <div><span class="text-amber-400/80 text-[9px] font-bold mr-1">GRÚA:</span>{{ Number(eq.ultimo_horometro_service || 0).toLocaleString('es-CL') }} hrs</div>
                  <div v-if="eq.tiene_doble_horometro || Number(eq.horometro_chasis_acumulado) > 0"><span class="text-cyan-400/80 text-[9px] font-bold mr-1">CHASIS:</span>{{ Number(eq.ultimo_horometro_chasis_service || 0).toLocaleString('es-CL') }} hrs</div>
                  <div><span class="text-emerald-400/80 text-[9px] font-bold mr-1">ODO:</span>{{ Number(eq.ultimo_odometro_service || 0).toLocaleString('es-CL') }} km</div>
                </div>
              </td>
              <td class="p-4 font-mono">
                <div class="flex flex-col gap-1.5 text-[11px] font-bold">
                  <div class="text-amber-300">Δ {{ Number(eq.uso_mant_horometro_grua ?? eq.horas_desde_ultimo_service ?? 0).toLocaleString('es-CL') }} / 250 hrs</div>
                  <div v-if="eq.tiene_doble_horometro || Number(eq.horometro_chasis_acumulado) > 0" class="text-cyan-300">Δ {{ Number(eq.uso_mant_horometro_chasis || 0).toLocaleString('es-CL') }} / 250 hrs</div>
                  <div class="text-emerald-300">Δ {{ Number(eq.uso_mant_odometro_km || 0).toLocaleString('es-CL') }} / 10.000 km</div>
                </div>
              </td>
              <td class="p-4 font-mono">
                <div class="flex flex-col gap-1.5">
                  <div>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-black border inline-block"
                      :class="Number(eq.faltante_horometro_grua ?? eq.delta_pauta_horas ?? 250) <= 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : Number(eq.faltante_horometro_grua ?? eq.delta_pauta_horas ?? 250) <= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'"
                    >
                      GRÚA: {{ Number(eq.faltante_horometro_grua ?? eq.delta_pauta_horas ?? 250) <= 0 ? `Vencido +${Math.abs(Number(eq.faltante_horometro_grua ?? eq.delta_pauta_horas)).toLocaleString('es-CL')}h` : `Faltan ${Number(eq.faltante_horometro_grua ?? eq.delta_pauta_horas ?? 250).toLocaleString('es-CL')}h` }}
                    </span>
                  </div>
                  <div v-if="eq.tiene_doble_horometro || Number(eq.horometro_chasis_acumulado) > 0">
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-black border inline-block"
                      :class="Number(eq.faltante_horometro_chasis ?? 250) <= 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : Number(eq.faltante_horometro_chasis ?? 250) <= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'"
                    >
                      CHASIS: {{ Number(eq.faltante_horometro_chasis ?? 250) <= 0 ? `Vencido +${Math.abs(Number(eq.faltante_horometro_chasis)).toLocaleString('es-CL')}h` : `Faltan ${Number(eq.faltante_horometro_chasis ?? 250).toLocaleString('es-CL')}h` }}
                    </span>
                  </div>
                  <div>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-black border inline-block"
                      :class="Number(eq.faltante_odometro_km ?? 10000) <= 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : Number(eq.faltante_odometro_km ?? 10000) <= 2000 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'"
                    >
                      ODO: {{ Number(eq.faltante_odometro_km ?? 10000) <= 0 ? `Vencido +${Math.abs(Number(eq.faltante_odometro_km)).toLocaleString('es-CL')} km` : `Faltan ${Number(eq.faltante_odometro_km ?? 10000).toLocaleString('es-CL')} km` }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="p-4">
                <span :class="[
                  'px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border font-mono',
                  eq.ot_activa_folio ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  eq.estado === 'OPERATIVO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  'bg-rose-500/10 text-rose-400 border-rose-500/30'
                ]">
                  {{ eq.ot_activa_folio ? 'EN_MANTENCION' : (eq.estado || 'OPERATIVO') }}
                </span>
              </td>
              <td class="p-4 text-right space-x-2">
                <button
                  @click="abrirFichaQrWeb(eq.patente)"
                  class="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold px-2.5 py-1.5 rounded-xl text-[11px] uppercase tracking-wider inline-flex items-center gap-1"
                  title="Ver Ficha QR Oficial (Docs Legales y Certificados)"
                >
                  <QrCode class="w-3 h-3" />
                  Ficha QR
                </button>
                <button
                  @click="verHojaVida(eq.id_equipo)"
                  class="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold px-2.5 py-1.5 rounded-xl text-[11px] uppercase tracking-wider inline-flex items-center gap-1 border border-slate-700"
                  title="Ver Pasaporte Técnico y Hoja de Vida Completa"
                >
                  <FileText class="w-3 h-3" />
                  Hoja de Vida
                </button>
                <button
                  @click="abrirModalNuevaOt(eq)"
                  class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1.5 rounded-xl text-[11px] uppercase tracking-wider inline-flex items-center gap-1"
                >
                  <Wrench class="w-3 h-3" />
                  Programar OT
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- PESTAÑA 3: AVISOS DE AVERÍA (INCIDENTES DE FAENA)                          -->
    <!-- ========================================================================= -->
    <div v-if="activeMainTab === 'avisos'" class="space-y-6">
      <div class="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">Bitácora de Avisos de Falla y Paradas en Terreno</h2>
          <p class="text-xs text-slate-400">Incidentes reportados por operadores o taller que originan órdenes de trabajo correctivas inmediatas</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            {{ avisosAveria.filter(a => a.estado === 'PENDIENTE').length }} aviso(s) pendientes de atención
          </span>
          <button
            @click="abrirModalNuevoAviso()"
            class="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
          >
            <AlertTriangle class="w-4 h-4" />
            + Registrar Aviso de Avería
          </button>
        </div>
      </div>

      <div class="overflow-x-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-sm">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider font-mono">
              <th class="p-4">Nº Aviso</th>
              <th class="p-4">Grúa Afectada</th>
              <th class="p-4">Criticidad</th>
              <th class="p-4">Reportado Por</th>
              <th class="p-4">Síntoma / Falla Reportada</th>
              <th class="p-4">Evidencias</th>
              <th class="p-4">Fecha Reporte</th>
              <th class="p-4">Estado</th>
              <th class="p-4 text-right">Acción Correctiva</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-if="avisosAveria.length === 0">
              <td colspan="9" class="p-8 text-center text-slate-500 font-mono">
                No hay avisos de avería registrados en el sistema.
              </td>
            </tr>
            <tr 
              v-for="aviso in avisosAveria" 
              :key="aviso.id_aviso" 
              :class="[
                'transition-colors',
                route.query.folio && aviso.folio_aviso === route.query.folio 
                  ? 'bg-amber-500/20 border-2 border-amber-400 ring-2 ring-amber-400/40' 
                  : 'hover:bg-slate-800/50'
              ]"
            >
              <td class="p-4 font-mono font-black text-rose-400 text-sm">{{ aviso.folio_aviso }}</td>
              <td class="p-4">
                <div class="font-bold text-white">{{ aviso.patente || `Equipo #${aviso.id_equipo}` }}</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ aviso.equipo_nombre }}</div>
              </td>
              <td class="p-4">
                <span :class="[
                  'px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border',
                  aviso.criticidad === 'PARADA_MAQUINA' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                  aviso.criticidad === 'DEGRADADO' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                ]">
                  {{ aviso.criticidad }}
                </span>
              </td>
              <td class="p-4">
                <div class="font-bold text-white">{{ aviso.usuario_reporta || 'Operador en Terreno' }}</div>
                <div v-if="aviso.horometro" class="text-[10px] text-amber-400 font-mono">Horo: {{ Number(aviso.horometro).toLocaleString('es-CL') }} hrs</div>
              </td>
              <td class="p-4 text-slate-200 max-w-sm">{{ aviso.descripcion }}</td>
              <td class="p-4">
                <div v-if="aviso.fotos && Array.isArray(aviso.fotos) && aviso.fotos.length > 0" class="flex items-center gap-1.5">
                  <button
                    v-for="(f, fIdx) in aviso.fotos.slice(0, 2)"
                    :key="fIdx"
                    type="button"
                    @click="abrirPreviewFotoWeb(resolverFotoUrl(f))"
                    class="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 hover:border-amber-400 transition-colors shrink-0"
                    title="Ver fotografía adjunta"
                  >
                    <img :src="resolverFotoUrl(f)" class="w-full h-full object-cover" />
                  </button>
                  <span v-if="aviso.fotos.length > 2" class="text-[10px] font-mono font-bold text-slate-400">
                    +{{ aviso.fotos.length - 2 }}
                  </span>
                </div>
                <span v-else class="text-slate-600 text-[10px] font-mono">Sin fotos</span>
              </td>
              <td class="p-4 font-mono text-slate-400">{{ formatDate(aviso.fecha_reporte) }}</td>
              <td class="p-4">
                <span :class="[
                  'px-2 py-0.5 rounded text-[10px] font-bold font-mono border uppercase',
                  aviso.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  aviso.estado === 'CON_OT' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                ]">
                  {{ aviso.estado }}
                </span>
              </td>
              <td class="p-4 text-right">
                <button
                  v-if="aviso.estado === 'PENDIENTE'"
                  @click="convertirAvisoAOt(aviso)"
                  class="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider inline-flex items-center gap-1 shadow"
                >
                  ⚡ Convertir a OT
                </button>
                <span v-else-if="aviso.id_ot" class="text-slate-500 font-mono text-[11px]">
                  OT vinculada
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- PESTAÑA 4: HALLAZGOS DE TALLER (ANOMALÍAS C1 - C4)                         -->
    <!-- ========================================================================= -->
    <div v-if="activeMainTab === 'hallazgos'" class="space-y-6">
      <div class="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
        <div>
          <h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">Gestión de Hallazgos Detectados en Taller (C1 a C4)</h2>
          <p class="text-xs text-slate-400">Taxonomía ISO 14224 simplificada, impacto en capacidad de izaje y decisiones técnicas de taller</p>
        </div>
        <div class="text-xs font-mono text-slate-400">
          Total Hallazgos: <strong class="text-amber-400">{{ hallazgosList.length }}</strong>
        </div>
      </div>

      <div class="overflow-x-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-sm">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider font-mono">
              <th class="p-4">ID</th>
              <th class="p-4">Grúa / Patente</th>
              <th class="p-4">OT Origen</th>
              <th class="p-4">Criticidad</th>
              <th class="p-4">Sistema & Componente</th>
              <th class="p-4">Descripción Anomalía</th>
              <th class="p-4">Afecta Izaje</th>
              <th class="p-4">Decisión / Estado</th>
              <th class="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-if="hallazgosList.length === 0">
              <td colspan="9" class="p-8 text-center text-slate-500 font-mono">
                No hay hallazgos registrados en el taller.
              </td>
            </tr>
            <tr v-for="h in hallazgosList" :key="h.id_hallazgo" class="hover:bg-slate-800/50 transition-colors">
              <td class="p-4 font-mono font-bold text-slate-400">#{{ h.id_hallazgo }}</td>
              <td class="p-4 font-mono font-bold text-white">{{ h.patente || `Equipo #${h.id_equipo}` }}</td>
              <td class="p-4 font-mono text-amber-400">{{ h.numero_ot_origen || `OT #${h.id_ot_origen}` }}</td>
              <td class="p-4">
                <span :class="[
                  'px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border',
                  h.criticidad === 'C1' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' :
                  h.criticidad === 'C2' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                  h.criticidad === 'C3' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                ]">
                  {{ h.criticidad }}
                </span>
              </td>
              <td class="p-4 font-mono">
                <div class="text-white font-bold">{{ h.sistema }}</div>
                <div class="text-[10px] text-slate-400">{{ h.componente }}</div>
              </td>
              <td class="p-4 text-slate-300 max-w-sm">
                <div>{{ h.descripcion }}</div>
                <!-- Evidencias Detección (Antes) -->
                <div v-if="h.fotos && Array.isArray(h.fotos) && h.fotos.length > 0" class="flex items-center gap-1.5 mt-2">
                  <span class="text-[9px] font-bold text-slate-400 uppercase font-mono">Antes:</span>
                  <button
                    v-for="(f, fIdx) in h.fotos.slice(0, 3)"
                    :key="fIdx"
                    type="button"
                    @click="abrirPreviewFotoWeb(resolverFotoUrl(f))"
                    class="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 hover:border-amber-400 transition-colors shrink-0"
                    title="Evidencia Detección (Antes)"
                  >
                    <img :src="resolverFotoUrl(f)" class="w-full h-full object-cover" />
                  </button>
                  <span v-if="h.fotos.length > 3" class="text-[10px] font-mono font-bold text-slate-400">
                    +{{ h.fotos.length - 3 }}
                  </span>
                </div>
              </td>
              <td class="p-4">
                <span v-if="h.afecta_izaje" class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                  ⚠️ SÍ AFECTA
                </span>
                <span v-else class="text-slate-500 text-[10px]">No</span>
              </td>
              <td class="p-4 max-w-xs">
                <div class="font-bold font-mono" :class="h.estado === 'CERRADO' ? 'text-emerald-400' : 'text-amber-400'">
                  {{ h.estado }}
                </div>
                <div v-if="h.decision" class="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  {{ h.decision }}
                </div>
                <!-- Detalle de Solución Aplicada -->
                <div v-if="h.solucion_aplicada" class="text-[11px] text-slate-300 mt-1 italic line-clamp-2" :title="h.solucion_aplicada">
                  "{{ h.solucion_aplicada }}"
                </div>
                <!-- Evidencias de Cierre (Después) -->
                <div v-if="h.fotos_cierre && Array.isArray(h.fotos_cierre) && h.fotos_cierre.length > 0" class="flex items-center gap-1.5 mt-1.5">
                  <span class="text-[9px] font-bold text-emerald-400 uppercase font-mono">Reparado:</span>
                  <button
                    v-for="(fc, fcIdx) in h.fotos_cierre.slice(0, 3)"
                    :key="fcIdx"
                    type="button"
                    @click="abrirPreviewFotoWeb(resolverFotoUrl(fc))"
                    class="w-7 h-7 rounded-lg overflow-hidden border border-emerald-500/40 hover:border-emerald-400 transition-colors shrink-0"
                    title="Evidencia Reparación (Después)"
                  >
                    <img :src="resolverFotoUrl(fc)" class="w-full h-full object-cover" />
                  </button>
                  <span v-if="h.fotos_cierre.length > 3" class="text-[10px] font-mono font-bold text-emerald-400">
                    +{{ h.fotos_cierre.length - 3 }}
                  </span>
                </div>
                <!-- Responsable y Fecha de Cierre -->
                <div v-if="h.usuario_cierra || h.fecha_cierre" class="text-[10px] text-slate-400 font-mono mt-1">
                  <span v-if="h.usuario_cierra">Por: <strong class="text-white">{{ h.usuario_cierra }}</strong></span>
                  <span v-if="h.fecha_cierre"> • {{ formatDate(h.fecha_cierre) }}</span>
                </div>
              </td>
              <td class="p-4 text-right">
                <button
                  v-if="h.estado === 'ABIERTO' || h.estado === 'EN_GESTION'"
                  @click="abrirModalResolverHallazgo(h)"
                  class="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider inline-flex items-center gap-1 shadow transition-colors"
                >
                  <ShieldCheck class="w-3.5 h-3.5" />
                  Resolver
                </button>
                <span v-else class="text-emerald-400 font-mono text-[11px] font-bold">
                  ✓ Resuelto
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- PESTAÑA 5: PARÁMETROS OPERACIONALES DE TALLER                             -->
    <!-- ========================================================================= -->
    <div v-if="activeMainTab === 'parametros'" class="space-y-6 max-w-4xl">
      <!-- Encabezado -->
      <div class="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-base font-black text-white uppercase tracking-wider font-mono mb-1 flex items-center gap-2">
            <Sliders class="w-5 h-5 text-amber-400" />
            Parámetros Operacionales de Taller GSP
          </h2>
          <p class="text-xs text-slate-400">
            Gobierno institucional de ciclos preventivos (Horómetro / Odómetro), tarifas HH y alertas de taller.
          </p>
        </div>
        <button
          @click="guardarParametrosTaller"
          :disabled="guardandoParametros"
          class="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 shrink-0"
        >
          <RotateCw v-if="guardandoParametros" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          <span>{{ guardandoParametros ? 'Guardando...' : 'Guardar Parámetros' }}</span>
        </button>
      </div>

      <!-- Banner de Éxito / Error -->
      <div v-if="guardarParametrosSuccess" class="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2">
        <ShieldCheck class="w-5 h-5 shrink-0" />
        <span>¡Parámetros operacionales guardados exitosamente! El Radar de Flota se ha actualizado reactivamente.</span>
      </div>
      <div v-if="guardarParametrosError" class="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-2">
        <AlertTriangle class="w-5 h-5 shrink-0" />
        <span>{{ guardarParametrosError }}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- BLOQUE 1: CICLOS PREVENTIVOS (HORÓMETRO / ODÓMETRO) -->
        <div class="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-black text-xs uppercase tracking-wider font-mono">
            <Clock class="w-4 h-4 text-amber-400" />
            <span>1. Ciclos Preventivos y Horómetros</span>
          </div>

          <!-- Intervalo Horómetro Base -->
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-slate-300 uppercase">Intervalo Base Horómetro Grúas (hrs) *</label>
            <p class="text-[10px] text-slate-500">Ciclo base de service preventivo para motor diésel y superestructura (PM1/PM250).</p>
            <div class="relative">
              <input
                v-model.number="parametrosForm.pm_intervalo_base_horas"
                type="number"
                min="50"
                step="25"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              <span class="absolute right-3 top-2 text-[11px] text-amber-400 font-mono font-bold">HRS</span>
            </div>
          </div>

          <!-- Ventana de Alerta Próxima -->
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-slate-300 uppercase">Anticipación Alerta Radar (hrs antes) *</label>
            <p class="text-[10px] text-slate-500">Horas antes de llegar al límite para que el Radar cambie a semáforo AMARILLO (Próximo).</p>
            <div class="relative">
              <input
                v-model.number="parametrosForm.pm_ventana_alerta_horas"
                type="number"
                min="5"
                step="5"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              <span class="absolute right-3 top-2 text-[11px] text-amber-400 font-mono font-bold">HRS ANTES</span>
            </div>
            <div class="text-[10px] text-amber-300/80 font-mono bg-amber-500/10 p-2 rounded-lg mt-1">
              🟡 Semáforo amarillo se activa a las: <strong>{{ Math.max(0, (parametrosForm.pm_intervalo_base_horas || 250) - (parametrosForm.pm_ventana_alerta_horas || 25)) }} hrs</strong>
            </div>
          </div>

          <!-- Intervalo Odómetro Carretera -->
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-slate-300 uppercase">Intervalo Odómetro Camiones / Ramplas (km) *</label>
            <p class="text-[10px] text-slate-500">Ciclo de mantenimiento preventivo de rodadura en carretera para tractos y transporte.</p>
            <div class="relative">
              <input
                v-model.number="parametrosForm.pm_intervalo_odometro_km"
                type="number"
                min="1000"
                step="1000"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              <span class="absolute right-3 top-2 text-[11px] text-cyan-400 font-mono font-bold">KM</span>
            </div>
          </div>
        </div>

        <!-- BLOQUE 2: CAPACIDAD, TARIFAS Y ALERTAS DE COSTO -->
        <div class="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-black text-xs uppercase tracking-wider font-mono">
            <ShieldCheck class="w-4 h-4 text-emerald-400" />
            <span>2. Capacidad, Tarifas y Alertas</span>
          </div>

          <!-- Tarifa Mano de Obra HH -->
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-slate-300 uppercase">Tarifa Mano de Obra HH Estándar ($ CLP) *</label>
            <p class="text-[10px] text-slate-500">Costo interno por hora hombre de mecánico para costeo de OTs.</p>
            <div class="relative">
              <input
                v-model.number="parametrosForm.tarifa_hh_default"
                type="number"
                min="1000"
                step="1000"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
              />
              <span class="absolute right-3 top-2 text-[11px] text-emerald-400 font-mono font-bold">CLP</span>
            </div>
          </div>

          <!-- Umbral Financiero OT -->
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-slate-300 uppercase">Umbral de Alerta Financiera OT ($ CLP) *</label>
            <p class="text-[10px] text-slate-500">Disparo de notificación omnicanal a Jefatura si una OT supera este costo.</p>
            <div class="relative">
              <input
                v-model.number="parametrosForm.umbral_costo_ot_clp"
                type="number"
                min="100000"
                step="100000"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              <span class="absolute right-3 top-2 text-[11px] text-amber-400 font-mono font-bold">CLP</span>
            </div>
          </div>

          <!-- Alerta Dictuc / Bureau Veritas -->
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-slate-300 uppercase">Alerta Certificación Bureau Veritas (días) *</label>
            <p class="text-[10px] text-slate-500">Días de anticipación para advertir vencimiento de certificación técnica de izaje.</p>
            <div class="relative">
              <input
                v-model.number="parametrosForm.cert_alerta_dias"
                type="number"
                min="5"
                step="5"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
              <span class="absolute right-3 top-2 text-[11px] text-cyan-400 font-mono font-bold">DÍAS</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- FULL-WORKSPACE MODAL: DETALLE INTEGRAL DE OT SELECCIONADA (SPEC-097)      -->
    <!-- ========================================================================= -->
    <div
      v-if="selectedOt"
      class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-5"
      @click.self="cerrarDetalleOt"
    >
      <div class="bg-[#0B0F19] border border-slate-700/90 rounded-3xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <!-- 1. HEADER FIJO DEL MODAL (STICKY TOP, shrink-0) -->
        <div class="shrink-0 bg-slate-900/95 border-b border-slate-800 px-6 py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-3">
              <button
                @click="cerrarDetalleOt"
                class="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Volver a la Bandeja de OTs (Tecla ESC)"
              >
                <ArrowLeft class="w-4 h-4 text-amber-400" />
                Volver a Bandeja
              </button>

              <h2 class="text-2xl font-black text-white font-mono uppercase">{{ selectedOt.ot?.numero_ot || selectedOt.ot?.folio }}</h2>

              <span :class="[
                'px-2.5 py-1 rounded text-xs font-black uppercase font-mono border',
                selectedOt.ot?.estado === 'CERRADA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                selectedOt.ot?.estado === 'EN_PROCESO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                selectedOt.ot?.estado === 'ESPERA_REPUESTOS' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              ]">
                {{ selectedOt.ot?.estado }}
              </span>

              <!-- Selector Rápido de Estado Operativo (SPEC-097) -->
              <select
                v-if="selectedOt.ot?.estado !== 'CERRADA' && selectedOt.ot?.estado !== 'ANULADA'"
                :value="selectedOt.ot?.estado"
                @change="cambiarEstadoOtRapido($event.target.value)"
                class="bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-200 text-xs font-mono font-bold rounded-xl px-2.5 py-1 focus:outline-none focus:border-amber-500"
                title="Cambiar estado operativo de la OT"
              >
                <option value="ABIERTA">Estado: ABIERTA</option>
                <option value="EN_PROCESO">Estado: EN PROCESO</option>
                <option value="ESPERA_REPUESTOS">Estado: ESPERA REPUESTOS</option>
              </select>

              <span :class="[
                'px-2 py-0.5 rounded text-[11px] font-black font-mono border',
                selectedOt.ot?.prioridad === 1 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                selectedOt.ot?.prioridad === 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                'bg-slate-800 text-slate-300 border-slate-700'
              ]">
                P{{ selectedOt.ot?.prioridad || 3 }} • {{ selectedOt.ot?.tipo_mantenimiento }}
              </span>
            </div>

            <!-- Franja de Trazabilidad Completa: Equipo, Creador, Mecánico, Inicio, Fin y Duración -->
            <div class="text-xs text-slate-400 mt-2 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Equipo: <strong class="text-white">{{ selectedOt.ot?.patente }}</strong> ({{ selectedOt.ot?.marca || selectedOt.ot?.equipo_marca }} {{ selectedOt.ot?.modelo || selectedOt.ot?.equipo_modelo }}) • <strong class="text-amber-400">{{ selectedOt.ot?.horometro_inicio || 0 }} hrs</strong></span>
              <span>👤 Creada por: <strong class="text-white">{{ selectedOt.ot?.nombre_creador || selectedOt.ot?.nombre_supervisor || 'Sistema' }}</strong></span>
              <span>👷 Mecánico: <strong class="text-amber-400">{{ selectedOt.ot?.nombre_tecnico || 'Sin asignar' }}</strong></span>
              <span>📅 Inicio: <strong class="text-slate-200">{{ formatDateTime(selectedOt.ot?.fecha_creacion || selectedOt.ot?.fecha_programada) }}</strong></span>
              <span>🏁 Término: <strong :class="selectedOt.ot?.estado === 'CERRADA' ? 'text-emerald-400' : 'text-amber-400'">{{ selectedOt.ot?.estado === 'CERRADA' ? formatDateTime(selectedOt.ot?.fecha_cierre || selectedOt.ot?.fecha_cierre_real) : 'En curso' }}</strong></span>
              <span>⏱️ Duración: <strong class="text-cyan-400">{{ calcularDuracionOt(selectedOt.ot) }}</strong></span>
            </div>

            <div v-if="selectedOt.ot?.observaciones" class="mt-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
              <span class="font-bold text-amber-400 uppercase text-[10px]">📝 Observación de Asignación:</span>
              {{ selectedOt.ot?.observaciones }}
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <div class="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-right">
              <div class="text-[10px] text-slate-500 font-bold uppercase">Costo Acumulado OT</div>
              <div class="text-base font-black text-emerald-400 font-mono">
                ${{ formatClp(costoAcumuladoOtSeleccionada) }}
              </div>
            </div>

            <button
              @click="imprimirPautaOt"
              class="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg"
              title="Imprimir Pauta de Trabajo en papel con checklist y control de tiempos (SPEC-096)"
            >
              <Printer class="w-4 h-4" />
              Imprimir Pauta
            </button>

            <button
              @click="abrirFichaQrWeb(selectedOt.ot?.patente)"
              class="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              title="Ver documentación legal, certificados y tablas de carga oficiales"
            >
              <QrCode class="w-4 h-4" />
              Ficha QR
            </button>

            <button
              v-if="selectedOt.ot?.estado !== 'CERRADA' && selectedOt.ot?.estado !== 'ANULADA'"
              @click="abrirModalCierre(selectedOt.ot)"
              class="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5"
            >
              <ShieldCheck class="w-4 h-4" />
              Cierre Supervisado (PIN FES)
            </button>

            <button
              @click="cerrarDetalleOt"
              class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white font-black text-base flex items-center justify-center border border-slate-700 transition-colors"
              title="Cerrar Ficha OT (ESC)"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- 2. BARRA DE SUB-PESTAÑAS FIJA (ORDEN CRONOLÓGICO: ENTRADA -> EJECUCIÓN -> SALIDA) -->
        <div class="shrink-0 px-6 py-2.5 bg-slate-900/70 border-b border-slate-800 flex gap-2 overflow-x-auto">
          <button
            @click="activeOtSubTab = '360'"
            :class="['px-3.5 py-2 font-bold text-xs rounded-xl uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap', activeOtSubTab === '360' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white']"
          >
            <Camera class="w-3.5 h-3.5" />
            <span>1. Inspección Entrada 360° ({{ contarFotos360Web }}/6)</span>
          </button>
          <button
            @click="activeOtSubTab = 'actividades'"
            :class="['px-3.5 py-2 font-bold text-xs rounded-xl uppercase tracking-wider whitespace-nowrap', activeOtSubTab === 'actividades' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white']"
          >
            2. Pauta & Actividades ({{ selectedOt.actividades?.length || 0 }})
          </button>
          <button
            @click="activeOtSubTab = 'hh'"
            :class="['px-3.5 py-2 font-bold text-xs rounded-xl uppercase tracking-wider whitespace-nowrap', activeOtSubTab === 'hh' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white']"
          >
            3. Mano de Obra HH ({{ selectedOt.mano_obra?.length || 0 }})
          </button>
          <button
            @click="activeOtSubTab = 'materiales'"
            :class="['px-3.5 py-2 font-bold text-xs rounded-xl uppercase tracking-wider whitespace-nowrap', activeOtSubTab === 'materiales' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white']"
          >
            4. Insumos & Repuestos ({{ selectedOt.repuestos_manuales?.length || 0 }})
          </button>
          <button
            @click="activeOtSubTab = 'servicios'"
            :class="['px-3.5 py-2 font-bold text-xs rounded-xl uppercase tracking-wider whitespace-nowrap', activeOtSubTab === 'servicios' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white']"
          >
            5. Servicios Externos ({{ selectedOt.servicios_externos?.length || 0 }})
          </button>
          <button
            @click="activeOtSubTab = 'hallazgos'"
            :class="['px-3.5 py-2 font-bold text-xs rounded-xl uppercase tracking-wider whitespace-nowrap', activeOtSubTab === 'hallazgos' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white']"
          >
            6. Hallazgos ({{ selectedOt.hallazgos?.length || 0 }})
          </button>
          <button
            @click="activeOtSubTab = 'salida'"
            :class="['px-3.5 py-2 font-bold text-xs rounded-xl uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap', activeOtSubTab === 'salida' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-400 hover:text-white border border-emerald-500/30']"
          >
            <ShieldCheck class="w-3.5 h-3.5" />
            <span>7. Inspección Salida & Liberación</span>
          </button>
          <button
            @click="activeOtSubTab = 'historial'"
            :class="['px-3.5 py-2 font-bold text-xs rounded-xl uppercase tracking-wider whitespace-nowrap', activeOtSubTab === 'historial' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white']"
          >
            Log de Auditoría
          </button>
        </div>

        <!-- 3. CUERPO DE TRABAJO CON SCROLL INDEPENDIENTE (flex-1 overflow-y-auto) -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- SUBTAB 0: RECEPCIÓN, MEDIDORES DE ENTRADA E INSPECCIÓN VISUAL 360° (SPEC 71) -->
          <div v-if="activeOtSubTab === '360'" class="space-y-6">
            <!-- TARJETA 1.5: MEDIDORES DE ENTRADA / RECEPCIÓN -->
            <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-amber-400 font-mono text-sm">⏱️</span>
                  <div>
                    <h3 class="text-sm font-black text-white uppercase tracking-wider font-mono">Medidores de Entrada / Recepción en Taller</h3>
                    <p class="text-[11px] text-slate-400">Lecturas verificadas de tablero al momento de ingresar el equipo al taller o patio</p>
                  </div>
                </div>
                <span :class="[
                  'px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-mono border',
                  selectedOt.ot?.estado === 'CERRADA' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                ]">
                  {{ selectedOt.ot?.estado === 'CERRADA' ? 'Fijados al Cierre' : 'Editable en Taller' }}
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Horómetro Grúa -->
                <div class="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">⏱️ Horómetro Operación (Izaje) *</span>
                    <span v-if="selectedOt.ot?.horometro_grua_acumulado" class="text-[10px] text-amber-400 font-mono">
                      Acum: {{ Number(selectedOt.ot.horometro_grua_acumulado).toLocaleString('es-CL') }} hrs
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="formMedidoresWeb.horometro_grua_inicio"
                      type="number"
                      step="0.1"
                      :disabled="selectedOt.ot?.estado === 'CERRADA'"
                      placeholder="0.0"
                      class="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-sm font-mono font-bold text-amber-400 focus:outline-none disabled:opacity-50"
                    />
                    <span class="text-xs text-slate-400 font-mono font-bold">hrs</span>
                  </div>
                </div>

                <!-- Horómetro Chasis (Doble Horómetro) -->
                <div class="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🚚 Horómetro Chasis (Motor)</span>
                    <span v-if="selectedOt.ot?.horometro_chasis_acumulado" class="text-[10px] text-slate-400 font-mono">
                      Acum: {{ Number(selectedOt.ot.horometro_chasis_acumulado).toLocaleString('es-CL') }} hrs
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="formMedidoresWeb.horometro_chasis_inicio"
                      type="number"
                      step="0.1"
                      :disabled="selectedOt.ot?.estado === 'CERRADA'"
                      placeholder="0.0"
                      class="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-200 focus:outline-none disabled:opacity-50"
                    />
                    <span class="text-xs text-slate-400 font-mono font-bold">hrs</span>
                  </div>
                </div>

                <!-- Odómetro -->
                <div class="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🛣️ Odómetro (Kilometraje)</span>
                    <span v-if="selectedOt.ot?.odometro_acumulado" class="text-[10px] text-slate-400 font-mono">
                      Acum: {{ Number(selectedOt.ot.odometro_acumulado).toLocaleString('es-CL') }} km
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="formMedidoresWeb.odometro_inicio"
                      type="number"
                      step="1"
                      :disabled="selectedOt.ot?.estado === 'CERRADA'"
                      placeholder="0"
                      class="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-200 focus:outline-none disabled:opacity-50"
                    />
                    <span class="text-xs text-slate-400 font-mono font-bold">km</span>
                  </div>
                </div>
              </div>

              <div v-if="selectedOt.ot?.estado !== 'CERRADA'" class="flex justify-end gap-3 pt-1 border-t border-slate-800/60">
                <button
                  @click="guardarMedidoresInicioWeb"
                  :disabled="guardandoMedidoresWeb"
                  class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/10"
                >
                  <Save class="w-4 h-4" />
                  <span>{{ guardandoMedidoresWeb ? 'Guardando...' : 'Guardar Medidores de Entrada' }}</span>
                </button>
              </div>
            </div>

            <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-2 font-mono">
                <Camera class="w-4 h-4" />
                <span>Inspección Fotográfica 360° de Recepción del Activo</span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Registro fotográfico normalizado de ingreso al taller en las 6 posiciones reglamentarias (Spec 71).
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span :class="[
                'px-3 py-1 rounded-lg text-xs font-mono font-black border',
                contarFotos360Web === 6 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              ]">
                {{ contarFotos360Web }} / 6 Ranuras Completadas
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div
              v-for="slot in ranurasFotos360Web"
              :key="slot.key"
              class="relative rounded-2xl border p-4 flex flex-col justify-between transition-all"
              :class="resolverFotoUrl(fotos360Web[slot.key]) ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-dashed border-slate-800 bg-slate-950/60'"
              style="min-height: 180px;"
            >
              <!-- Cabecera de la ranura -->
              <div class="flex items-center justify-between gap-1 mb-2">
                <span class="text-xs font-black uppercase tracking-wider truncate" :class="resolverFotoUrl(fotos360Web[slot.key]) ? 'text-emerald-400' : 'text-slate-400'">
                  {{ slot.titulo }}
                </span>
                <span v-if="resolverFotoUrl(fotos360Web[slot.key])" class="text-emerald-400 text-xs font-bold">✓ Cargada</span>
              </div>

              <!-- Vista previa si existe foto -->
              <div v-if="resolverFotoUrl(fotos360Web[slot.key])" class="relative group my-2 flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black/80 border border-slate-800">
                <img
                  :src="resolverFotoUrl(fotos360Web[slot.key])"
                  class="w-full h-32 object-cover cursor-pointer hover:scale-105 transition-transform"
                  @click="abrirPreviewFotoWebModal(resolverFotoUrl(fotos360Web[slot.key]))"
                />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                  <button
                    type="button"
                    @click="abrirPreviewFotoWebModal(resolverFotoUrl(fotos360Web[slot.key]))"
                    class="p-2 rounded-xl bg-black/60 text-white hover:text-amber-400 transition-colors"
                    title="Ampliar imagen"
                  >
                    <Maximize2 class="w-4 h-4" />
                  </button>
                  <button
                    v-if="selectedOt.ot?.estado !== 'CERRADA'"
                    type="button"
                    @click.stop="eliminarFoto360Web(slot.key)"
                    class="p-2 rounded-xl bg-rose-600/80 text-white hover:bg-rose-500 transition-colors"
                    title="Eliminar fotografía"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Placeholder para subir / capturar foto -->
              <div
                v-else
                class="my-2 flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-900/60 rounded-xl py-4 border border-dashed border-slate-700/50 hover:border-amber-400/50 transition-all"
                @click="dispararCaptura360Web(slot.key)"
              >
                <span class="text-3xl mb-1.5">{{ slot.icono }}</span>
                <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Camera class="w-3.5 h-3.5" />
                  Subir Fotografía
                </span>
              </div>

              <div class="text-[11px] text-slate-500 truncate text-center mt-1">
                {{ slot.descripcion }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SUBTAB 1: CHECKLIST DE ACTIVIDADES -->
      <div v-if="activeOtSubTab === 'actividades'" class="space-y-4">
        <div class="flex justify-between items-center">
          <div class="text-xs text-slate-400 font-mono">
            Completadas: <strong class="text-emerald-400">{{ selectedOt.actividades?.filter(a => a.estado === 'COMPLETADA').length || 0 }}</strong> de {{ selectedOt.actividades?.length || 0 }}
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="imprimirPautaOt"
              class="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition"
              title="Imprimir pauta en papel para mecánicos en patio"
            >
              <Printer class="w-3.5 h-3.5" />
              Imprimir Pauta (Papel)
            </button>
            <button
              v-if="selectedOt.ot?.estado !== 'CERRADA'"
              @click="showNuevaActividadModal = true"
              class="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold uppercase"
            >
              + Agregar Tarea
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="act in selectedOt.actividades"
            :key="act.id_actividad"
            class="p-4 bg-slate-900/80 border rounded-2xl transition-all shadow-md"
            :class="act.estado === 'COMPLETADA' ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'"
          >
            <!-- Cabecera de Tarea -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  @click="toggleActividad(act)"
                  :disabled="selectedOt.ot?.estado === 'CERRADA'"
                  class="w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm border transition-all flex-shrink-0 mt-0.5"
                  :class="act.estado === 'COMPLETADA' ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-950 border-slate-700 text-slate-500 hover:border-amber-400'"
                >
                  <span v-if="act.estado === 'COMPLETADA'">✓</span>
                  <span v-else class="text-[10px]">◯</span>
                </button>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-bold leading-snug break-words" :class="act.estado === 'COMPLETADA' ? 'text-slate-400 line-through' : 'text-white'">
                    {{ act.descripcion }}
                  </div>
                  <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                    Estimado: {{ act.horas_estimadas || 1.0 }} HH
                  </div>
                </div>
              </div>

              <span :class="[
                'px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-bold border tracking-wider',
                act.estado === 'COMPLETADA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              ]">
                {{ act.estado }}
              </span>
            </div>

            <!-- Galería de Evidencias Fotográficas -->
            <div v-if="act.fotos && act.fotos.length > 0" class="mt-3 pt-3 border-t border-slate-800/80">
              <div class="text-[11px] font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5 font-mono">
                <span class="text-emerald-400">📸</span>
                Evidencias fotográficas ({{ act.fotos.length }})
              </div>
              <div class="flex flex-wrap gap-2.5">
                <div
                  v-for="(f, fIdx) in act.fotos"
                  :key="f.id_foto || fIdx"
                  class="relative rounded-xl overflow-hidden border border-slate-700 group cursor-pointer shadow-md bg-slate-950"
                  @click="abrirPreviewFotoWeb(resolverFotoUrl(f))"
                  title="Clic para ver en pantalla completa"
                >
                  <img :src="resolverFotoUrl(f)" class="w-20 h-20 object-cover hover:scale-105 transition-transform" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                    Ver 🔍
                  </div>
                  <button
                    type="button"
                    @click.stop="eliminarFotoWeb(act, f)"
                    class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center text-[10px] font-bold shadow hover:bg-rose-500 transition-colors z-10"
                    title="Eliminar fotografía"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- Hilo de Comentarios Técnicos -->
            <div v-if="act.comentarios && act.comentarios.length > 0" class="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
              <div class="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5 font-mono">
                <span class="text-cyan-400">💬</span>
                Comentarios y notas de campo ({{ act.comentarios.length }})
              </div>
              <div
                v-for="(c, cIdx) in act.comentarios"
                :key="c.id_comentario || cIdx"
                class="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs space-y-1"
              >
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-bold text-amber-400 font-mono">{{ c.nombre_usuario || 'Técnico' }}</span>
                  <span class="text-slate-500 font-mono text-[10px]">{{ formatHoraWeb(c.fecha) }}</span>
                </div>
                <div class="text-slate-300 leading-relaxed break-words">
                  {{ c.texto }}
                </div>
              </div>
            </div>

            <!-- Caja Desplegable para Agregar Comentario -->
            <div v-if="cajaComentarioWebAbierta[act.id_actividad]" class="mt-3 pt-3 border-t border-slate-800/80">
              <div class="flex items-center gap-2">
                <input
                  v-model="nuevoComentarioWebTexto[act.id_actividad]"
                  type="text"
                  placeholder="Escribe un comentario técnico o instrucción..."
                  class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  @keyup.enter="enviarComentarioWeb(act)"
                />
                <button
                  type="button"
                  @click="enviarComentarioWeb(act)"
                  class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider"
                  :disabled="guardandoComentarioWeb[act.id_actividad]"
                >
                  {{ guardandoComentarioWeb[act.id_actividad] ? 'Enviando...' : 'Publicar' }}
                </button>
              </div>
            </div>

            <!-- Barra Inferior de Acciones Estilo Facebook -->
            <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="dispararFotoWeb(act)"
                  class="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold px-3 py-1.5 rounded-xl border border-slate-700 inline-flex items-center gap-1.5 transition-colors uppercase tracking-wider text-[11px]"
                >
                  <span>📷</span>
                  <span>Adjuntar Foto</span>
                </button>

                <button
                  type="button"
                  @click="toggleCajaComentarioWeb(act.id_actividad)"
                  class="bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold px-3 py-1.5 rounded-xl border border-slate-700 inline-flex items-center gap-1.5 transition-colors uppercase tracking-wider text-[11px]"
                >
                  <span>💬</span>
                  <span>Comentar</span>
                </button>
              </div>

              <button
                type="button"
                @click="toggleActividad(act)"
                :disabled="selectedOt.ot?.estado === 'CERRADA'"
                class="font-mono text-xs font-bold tracking-wider px-3 py-1.5 rounded-xl transition-colors"
                :class="act.estado === 'COMPLETADA'
                  ? 'text-slate-400 hover:text-white bg-slate-800'
                  : 'text-emerald-400 hover:bg-emerald-500/20 bg-emerald-500/10 border border-emerald-500/30'"
              >
                {{ act.estado === 'COMPLETADA' ? 'Desmarcar' : 'Marcar Hecho ✓' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SUBTAB 2: MANO DE OBRA HH -->
      <div v-if="activeOtSubTab === 'hh'" class="space-y-4">
        <div class="flex justify-between items-center">
          <div class="text-xs text-slate-400 font-mono">
            Total HH Imputadas: <strong class="text-amber-400">{{ totalHhImputadas }} hrs</strong>
          </div>
          <button
            v-if="selectedOt.ot?.estado !== 'CERRADA'"
            @click="abrirModalNuevaHh"
            class="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold uppercase"
          >
            + Imputar HH Mecánico
          </button>
        </div>

        <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-xl">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                <th class="p-3">Mecánico</th>
                <th class="p-3">Labor Realizada</th>
                <th class="p-3">Horas Reales</th>
                <th class="p-3">Tarifa HH</th>
                <th class="p-3 text-right">Costo Calculado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr v-for="hh in selectedOt.mano_obra" :key="hh.id_hh">
                <td class="p-3 font-bold text-white">{{ hh.tecnico_nombre || hh.rut_tecnico }}</td>
                <td class="p-3 text-slate-300">{{ hh.descripcion_trabajo }}</td>
                <td class="p-3 font-mono">{{ hh.horas_reales }} hrs</td>
                <td class="p-3 font-mono">${{ formatClp(hh.tarifa_hora || 15000) }}</td>
                <td class="p-3 text-right font-mono font-bold text-emerald-400">${{ formatClp(hh.costo_calculado) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SUBTAB 3: INSUMOS & MATERIALES -->
      <div v-if="activeOtSubTab === 'materiales'" class="space-y-4">
        <div class="flex justify-between items-center">
          <div class="text-xs text-slate-400 font-mono">
            Total Insumos: <strong class="text-emerald-400">${{ formatClp(totalCostoMateriales) }}</strong>
          </div>
          <button
            v-if="selectedOt.ot?.estado !== 'CERRADA'"
            @click="abrirModalNuevoRepuestoWeb"
            class="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition"
          >
            <span>+</span> Registrar Insumo / Material
          </button>
        </div>

        <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-xl">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                <th class="p-3">Origen / Modo</th>
                <th class="p-3">Descripción Insumo / Repuesto</th>
                <th class="p-3">Cantidad</th>
                <th class="p-3">Unidad</th>
                <th class="p-3">Costo Unitario</th>
                <th class="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr v-for="rep in selectedOt.repuestos_manuales" :key="rep.id_ot_repuesto">
                <td class="p-3 whitespace-nowrap">
                  <span
                    v-if="rep.origen_insumo === 'BODEGA_WMS' || rep.id_producto"
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border',
                      rep.estado === 'SOLICITADO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    ]"
                  >
                    <span>{{ rep.estado === 'SOLICITADO' ? '⏳' : '📦' }}</span>
                    <span>{{ rep.estado === 'SOLICITADO' ? 'SOLICITADO A BODEGA' : 'BODEGA WMS' }}</span>
                    <span v-if="rep.sku" class="font-mono text-xs opacity-90">[{{ rep.sku }}]</span>
                    <span v-if="rep.codigo_ubicacion" class="text-slate-400 text-[10px]">📍 {{ rep.codigo_ubicacion }}</span>
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  >
                    <span>📝</span> COMPRA DIRECTA
                    <span v-if="rep.numero_documento_compra || rep.proveedor_o_documento" class="text-slate-400 text-[10px] font-mono">
                      (Doc: {{ rep.numero_documento_compra || rep.proveedor_o_documento }})
                    </span>
                  </span>
                </td>
                <td class="p-3 font-bold text-white">{{ rep.descripcion_material }}</td>
                <td class="p-3 font-mono">{{ rep.cantidad }}</td>
                <td class="p-3 font-mono">{{ rep.unidad_medida }}</td>
                <td class="p-3 font-mono">${{ formatClp(rep.costo_unitario) }}</td>
                <td class="p-3 text-right font-mono font-bold text-emerald-400">${{ formatClp(rep.costo_total) }}</td>
              </tr>
              <tr v-if="!selectedOt.repuestos_manuales?.length">
                <td colspan="6" class="p-6 text-center text-slate-500 italic">
                  No hay insumos o repuestos registrados en esta Orden de Trabajo.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SUBTAB 4: SERVICIOS EXTERNOS -->
      <div v-if="activeOtSubTab === 'servicios'" class="space-y-4">
        <div class="flex justify-between items-center">
          <div class="text-xs text-slate-400 font-mono">
            Total Terceros: <strong class="text-emerald-400">${{ formatClp(totalCostoServicios) }}</strong>
          </div>
          <button
            v-if="selectedOt.ot?.estado !== 'CERRADA'"
            @click="showNuevoServicioModal = true"
            class="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold uppercase"
          >
            + Registrar Servicio Externo
          </button>
        </div>

        <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-xl">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                <th class="p-3">Proveedor Especializado</th>
                <th class="p-3">Nº Factura / Doc</th>
                <th class="p-3">Descripción</th>
                <th class="p-3 text-right">Costo Neto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr v-for="srv in selectedOt.servicios_externos" :key="srv.id_servicio_ext">
                <td class="p-3 font-bold text-white">{{ srv.proveedor }}</td>
                <td class="p-3 font-mono text-amber-400">{{ srv.numero_documento_compra }}</td>
                <td class="p-3 text-slate-300">{{ srv.descripcion_servicio }}</td>
                <td class="p-3 text-right font-mono font-bold text-emerald-400">${{ formatClp(srv.costo) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SUBTAB 5: HALLAZGOS VINCULADOS -->
      <div v-if="activeOtSubTab === 'hallazgos'" class="space-y-4">
        <div class="flex justify-between items-center">
          <div class="text-xs text-slate-400 font-mono">
            Hallazgos en esta OT: <strong class="text-amber-400">{{ selectedOt.hallazgos?.length || 0 }}</strong>
          </div>
          <button
            v-if="selectedOt.ot?.estado !== 'CERRADA'"
            @click="showNuevoHallazgoModal = true"
            class="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold uppercase"
          >
            + Registrar Hallazgo Imprevisto
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="h in selectedOt.hallazgos"
            :key="h.id_hallazgo"
            class="p-4 bg-slate-900/80 border rounded-2xl space-y-3 transition-all shadow-md"
            :class="h.estado === 'CERRADO' ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800'"
          >
            <!-- Cabecera del Hallazgo -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase" :class="h.criticidad === 'C1' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'">
                  {{ h.criticidad }}
                </span>
                <span class="font-mono text-white font-bold text-xs">{{ h.sistema }} - {{ h.componente }}</span>
                <span v-if="h.afecta_izaje" class="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">⚠️ Afecta Izaje</span>
                <span v-if="h.decision" class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {{ h.decision }}
                </span>
              </div>
              
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded uppercase border tracking-wider" :class="h.estado === 'CERRADO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'">
                  {{ h.estado }}
                </span>
                <button
                  v-if="h.estado !== 'CERRADO'"
                  @click="abrirModalResolverHallazgo(h)"
                  class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1 shadow-md shadow-emerald-600/20"
                >
                  <ShieldCheck class="w-3.5 h-3.5" />
                  Resolver
                </button>
              </div>
            </div>

            <!-- Descripción de la Anomalía -->
            <div class="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 font-bold uppercase text-[10px] block mb-0.5">Anomalía Detectada:</span>
              {{ h.descripcion }}
            </div>

            <!-- EVIDENCIAS ANTES (DETECCIÓN) -->
            <div v-if="h.fotos && h.fotos.length > 0" class="space-y-1.5 pt-1">
              <span class="text-[10px] font-bold uppercase text-slate-400 font-mono flex items-center gap-1">
                📸 Evidencia Inicial (Antes) - {{ h.fotos.length }} foto(s):
              </span>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(f, fIdx) in h.fotos"
                  :key="fIdx"
                  class="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 group cursor-pointer shadow-md bg-slate-950"
                  @click="abrirPreviewFotoWeb(resolverFotoUrl(f))"
                  title="Clic para ampliar evidencia"
                >
                  <img :src="resolverFotoUrl(f)" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold">
                    Ver 🔍
                  </div>
                </div>
              </div>
            </div>

            <!-- RESOLUCIÓN TÉCNICA Y EVIDENCIAS DESPUÉS (SI ESTÁ CERRADO) -->
            <div v-if="h.estado === 'CERRADO'" class="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
              <div class="flex flex-wrap justify-between items-center text-[10px] text-emerald-400 font-mono">
                <span class="font-bold flex items-center gap-1">
                  ✓ Resuelto por: <strong class="text-white">{{ h.usuario_cierra || 'Supervisor' }}</strong>
                </span>
                <span v-if="h.fecha_cierre" class="text-slate-400">
                  {{ formatDate(h.fecha_cierre) }}
                </span>
              </div>
              <div v-if="h.solucion_aplicada" class="text-xs text-slate-200">
                <span class="text-[10px] text-emerald-400 font-bold uppercase block">Solución Aplicada:</span>
                {{ h.solucion_aplicada }}
              </div>
              <div v-if="h.fotos_cierre && h.fotos_cierre.length > 0" class="space-y-1">
                <span class="text-[10px] font-bold uppercase text-emerald-400 font-mono flex items-center gap-1">
                  📸 Evidencia de Solución (Después) - {{ h.fotos_cierre.length }} foto(s):
                </span>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(fc, fcIdx) in h.fotos_cierre"
                    :key="fcIdx"
                    class="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-500/40 group cursor-pointer shadow-md bg-slate-950"
                    @click="abrirPreviewFotoWeb(resolverFotoUrl(fc))"
                    title="Clic para ampliar solución"
                  >
                    <img :src="resolverFotoUrl(fc)" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold">
                      Ver 🔍
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pie con datos de quien reportó -->
            <div class="text-[10px] text-slate-500 font-mono flex justify-between items-center pt-1 border-t border-slate-800/60">
              <span>Reportado por: <strong class="text-slate-400">{{ h.usuario_reporta || 'Técnico de Taller' }}</strong></span>
              <span v-if="h.fecha_creacion">{{ formatDate(h.fecha_creacion) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SUBTAB 7: INSPECCIÓN DE SALIDA & PROTOCOLO DE LIBERACIÓN (SPEC-097 §3.5) -->
      <div v-if="activeOtSubTab === 'salida'" class="space-y-5">
        <div class="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="text-[10px] font-mono uppercase font-black text-emerald-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck class="w-4 h-4" />
              PROTOCOLO DE INSPECCIÓN DE SALIDA Y LIBERACIÓN TÉCNICA DEL ACTIVO
            </div>
            <h3 class="text-base font-black text-white mt-1">
              {{ selectedOt.ot?.estado === 'CERRADA' ? 'Acta de Liberación Sellada y Firmada (FES)' : 'Verificación Previa a la Entrega del Equipo a Operaciones' }}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Comparativa de medidores Entrada vs Salida, lista de chequeo de seguridad post-intervención y evidencia fotográfica de entrega.
            </p>
          </div>
          <div v-if="selectedOt.ot?.estado !== 'CERRADA' && selectedOt.ot?.estado !== 'ANULADA'">
            <button
              @click="abrirModalCierre(selectedOt.ot)"
              class="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
            >
              <ShieldCheck class="w-4 h-4" />
              Ejecutar Inspección de Salida y Firmar Cierre (PIN FES)
            </button>
          </div>
          <div v-else-if="selectedOt.cierre" class="text-right font-mono text-xs">
            <span class="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black uppercase">
              ✓ LIBERADA POR {{ selectedOt.cierre.nombre_usuario_cierre || selectedOt.cierre.usuario_cierre }}
            </span>
            <div class="text-[11px] text-slate-400 mt-1">
              Fecha Cierre: {{ formatDateTime(selectedOt.cierre.fecha_cierre || selectedOt.ot?.fecha_cierre) }}
            </div>
          </div>
        </div>

        <!-- Comparativa de Medidores Entrada vs Salida -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div class="text-[10px] font-mono uppercase text-slate-400 font-bold">1. Horómetro Grúa (Superestructura)</div>
            <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 font-mono">
              <div>
                <span class="text-[10px] text-slate-500 block">ENTRADA</span>
                <span class="text-sm font-bold text-slate-300">{{ Number(selectedOt.ot?.horometro_grua_inicio || selectedOt.ot?.horometro_inicio || 0).toLocaleString('es-CL') }} hrs</span>
              </div>
              <div>
                <span class="text-[10px] text-emerald-400 block font-bold">SALIDA / CIERRE</span>
                <span class="text-sm font-black text-emerald-400">
                  {{ selectedOt.ot?.horometro_grua_cierre || selectedOt.ot?.horometro_cierre ? `${Number(selectedOt.ot?.horometro_grua_cierre || selectedOt.ot?.horometro_cierre).toLocaleString('es-CL')} hrs` : 'Pendiente' }}
                </span>
              </div>
            </div>
          </div>

          <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div class="text-[10px] font-mono uppercase text-slate-400 font-bold">2. Horómetro Chasis (Motor Camión)</div>
            <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 font-mono">
              <div>
                <span class="text-[10px] text-slate-500 block">ENTRADA</span>
                <span class="text-sm font-bold text-slate-300">{{ selectedOt.ot?.horometro_chasis_inicio ? `${Number(selectedOt.ot.horometro_chasis_inicio).toLocaleString('es-CL')} hrs` : 'N/A' }}</span>
              </div>
              <div>
                <span class="text-[10px] text-emerald-400 block font-bold">SALIDA / CIERRE</span>
                <span class="text-sm font-black text-emerald-400">
                  {{ selectedOt.ot?.horometro_chasis_cierre ? `${Number(selectedOt.ot.horometro_chasis_cierre).toLocaleString('es-CL')} hrs` : 'Pendiente / N/A' }}
                </span>
              </div>
            </div>
          </div>

          <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div class="text-[10px] font-mono uppercase text-slate-400 font-bold">3. Odómetro Carretera (Kilometraje)</div>
            <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 font-mono">
              <div>
                <span class="text-[10px] text-slate-500 block">ENTRADA</span>
                <span class="text-sm font-bold text-slate-300">{{ selectedOt.ot?.odometro_inicio ? `${Number(selectedOt.ot.odometro_inicio).toLocaleString('es-CL')} km` : 'N/A' }}</span>
              </div>
              <div>
                <span class="text-[10px] text-emerald-400 block font-bold">SALIDA / CIERRE</span>
                <span class="text-sm font-black text-emerald-400">
                  {{ selectedOt.ot?.odometro_cierre ? `${Number(selectedOt.ot.odometro_cierre).toLocaleString('es-CL')} km` : 'Pendiente / N/A' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Detalle del Protocolo de Salida (Si ya está cerrada o vista previa) -->
        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 class="text-xs font-black uppercase tracking-wider text-white font-mono">
              Puntos de Verificación de Salida Post-Servicio (SPEC-067 §9)
            </h4>
            <span class="text-xs font-mono" :class="selectedOt.ot?.estado === 'CERRADA' ? 'text-emerald-400 font-bold' : 'text-amber-400'">
              Estado Resultante: {{ selectedOt.cierre?.estado_equipo_resultante || selectedOt.ot?.estado_equipo_actual || 'En Evaluación' }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div
              v-for="(item, idx) in itemsProtocoloSalidaVista"
              :key="idx"
              class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
            >
              <span class="text-slate-200 font-medium">{{ item.label }}</span>
              <span
                class="px-2.5 py-0.5 rounded font-mono text-[10px] font-black uppercase shrink-0"
                :class="item.ok ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'"
              >
                {{ item.ok ? '✓ CONFORME' : 'PENDIENTE' }}
              </span>
            </div>
          </div>

          <div v-if="selectedOt.cierre?.observacion_final" class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <div class="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Diagnóstico y Observación Final de Entrega:</div>
            <div class="text-white">{{ selectedOt.cierre.observacion_final }}</div>
          </div>

          <!-- Galería de Fotos de Salida si existen -->
          <div v-if="fotosSalidaGuardadasVista.length > 0" class="pt-2">
            <div class="text-[10px] font-mono uppercase text-emerald-400 font-bold mb-2">
              📷 Evidencias Fotográficas de Salida / Liberación ({{ fotosSalidaGuardadasVista.length }})
            </div>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="(f, fIdx) in fotosSalidaGuardadasVista"
                :key="fIdx"
                type="button"
                @click="abrirPreviewFotoWeb(resolverFotoUrl(f))"
                class="w-20 h-20 rounded-xl overflow-hidden border border-emerald-500/40 hover:border-emerald-400 transition bg-black"
              >
                <img :src="resolverFotoUrl(f)" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SUBTAB 8: AUDITORÍA DE ESTADOS -->
      <div v-if="activeOtSubTab === 'historial'" class="space-y-3 font-mono text-xs">
        <div
          v-for="log in selectedOt.historialEstados"
          :key="log.id_log"
          class="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between"
        >
          <div>
            <span class="text-slate-400">{{ formatDateTime(log.fecha) }}: </span>
            <span class="text-amber-400">{{ log.estado_anterior }}</span>
            <span class="text-slate-500"> ➔ </span>
            <span class="text-emerald-400 font-bold">{{ log.estado_nuevo }}</span>
            <span class="text-slate-400 ml-2">({{ log.nombre_usuario || 'Sistema' }})</span>
          </div>
          <div class="text-slate-500 text-[11px]">{{ log.motivo || 'Transición FSM' }}</div>
        </div>
      </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL 1: APERTURA NUEVA OT (CON SELECTOR DE PAUTA CÍCLICA)                -->
    <!-- ========================================================================= -->
    <div v-if="showNuevaOtModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-black text-white uppercase font-mono flex items-center gap-2">
            <Wrench class="w-4 h-4 text-amber-400" />
            Apertura de Orden de Trabajo Taller
          </h3>
          <button @click="showNuevaOtModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="nuevaOtError" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold font-mono">
          ⚠️ {{ nuevaOtError }}
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Seleccionar Grúa / Equipo *</label>
            <select v-model="formNuevaOt.id_equipo" @change="alSeleccionarEquipoModal" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs">
              <option :value="null">-- Seleccione Grúa --</option>
              <option v-for="eq in flotaEquipos" :key="eq.id_equipo" :value="eq.id_equipo">
                {{ eq.patente }} — {{ eq.marca }} {{ eq.modelo }} (Horómetro: {{ eq.horometro_actual }} hrs)
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Tipo de Trabajo *</label>
              <select v-model="formNuevaOt.tipo_mantenimiento" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs">
                <option value="PREVENTIVO">🛡️ Preventivo Cíclico</option>
                <option value="CORRECTIVO">🚨 Correctivo / Avería</option>
                <option value="PREDICTIVO">🔬 Predictivo</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Prioridad *</label>
              <select v-model.number="formNuevaOt.prioridad" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs">
                <option :value="1">P1 - Emergencia / Parada</option>
                <option :value="2">P2 - Urgente (24-48h)</option>
                <option :value="3">P3 - Normal Programada</option>
                <option :value="4">P4 - Baja / Oportunidad</option>
              </select>
            </div>
          </div>

          <div v-if="formNuevaOt.tipo_mantenimiento === 'PREVENTIVO'">
            <label class="block text-slate-400 mb-1 font-bold uppercase">Pauta Cíclica Fabricante</label>
            <select v-model="formNuevaOt.codigo_pauta" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs">
              <option value="PM250">PM250 — Servicio Básico 250 hrs (Filtros, Motor, Niveles)</option>
              <option value="PM500">PM500 — Servicio Intermedio 500 hrs (Transmisión, Dirección, Engrase)</option>
              <option value="PM1000">PM1000 — Servicio Mayor 1.000 hrs (Hidráulica General, Malacate)</option>
              <option value="PM2000">PM2000 — Overhaul Pluma y Cables 2.000 hrs</option>
            </select>
            <p class="text-[10px] text-slate-500 mt-1 font-mono">Inyecta automáticamente el checklist de tareas correspondiente al guardar.</p>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Horómetro de Inicio *</label>
            <input v-model.number="formNuevaOt.horometro_inicio" type="number" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Descripción de la Tarea / Motivo *</label>
            <textarea v-model="formNuevaOt.descripcion_falla" rows="2" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Mecánico Responsable Asignado *</label>
              <select v-model="formNuevaOt.id_tecnico_responsable" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs">
                <option :value="null">-- Seleccionar Mecánico --</option>
                <option v-for="t in listaTecnicos" :key="t.id_user" :value="t.id_user">
                  {{ t.nombre_completo }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Fecha y Hora de Inicio Programada *</label>
              <input v-model="formNuevaOt.fecha_programada" type="datetime-local" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono" />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Observación de Asignación / Instrucciones Técnicas</label>
            <textarea v-model="formNuevaOt.observaciones" rows="2" placeholder="Instrucción especial del Jefe de Taller al mecánico..." class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs"></textarea>
          </div>

          <div v-if="alertaEquipoConOt" class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div class="text-amber-400 font-bold">⚠️ Este equipo ya tiene una OT activa ({{ alertaEquipoConOt }})</div>
            <label class="flex items-center gap-2 text-slate-300 mt-2 cursor-pointer">
              <input type="checkbox" v-model="formNuevaOt.forzar_creacion" class="rounded border-slate-700" />
              <span>Autorizar apertura de OT paralela por excepción</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showNuevaOtModal = false" :disabled="creandoOt" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold disabled:opacity-50">Cancelar</button>
          <button 
            @click="submitNuevaOt" 
            :disabled="creandoOt"
            class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="creandoOt" class="inline-block animate-spin">⏳</span>
            <span>{{ creandoOt ? 'Creando OT...' : 'Crear OT' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL 2: INSPECCIÓN DE SALIDA Y CIERRE FORMAL CON PIN FES (SPEC-097 §3.5) -->
    <!-- ========================================================================= -->
    <div v-if="showCierreModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-black text-white uppercase font-mono flex items-center gap-2">
              <ShieldCheck class="w-5 h-5 text-emerald-400" />
              Inspección de Salida y Cierre Supervisado (Firma FES)
            </h3>
            <p class="text-[11px] text-slate-400 font-mono mt-0.5">
              OT: <strong class="text-amber-400">{{ selectedOt?.ot?.numero_ot || selectedOt?.ot?.folio }}</strong> •
              Equipo: <strong class="text-white">{{ selectedOt?.ot?.patente }}</strong>
            </p>
          </div>
          <button @click="showCierreModal = false" class="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        <div v-if="cierreError" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold font-mono">
          ⚠️ {{ cierreError }}
        </div>

        <div class="space-y-4 text-xs">
          <!-- 1. Triple Medidor de Salida / Término -->
          <div class="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div class="text-[11px] font-black text-amber-400 uppercase font-mono">
              1. Lecturas de Tablero al Término / Salida de Taller
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-slate-300 mb-1 font-bold uppercase text-[11px]">Horómetro Grúa Salida (hrs) *</label>
                <input v-model.number="formCierre.horometro_cierre" type="number" step="0.1" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-amber-400 font-mono font-bold" />
                <span class="text-[10px] text-slate-500 font-mono">Entrada: {{ selectedOt?.ot?.horometro_grua_inicio || selectedOt?.ot?.horometro_inicio || 0 }} hrs</span>
              </div>
              <div>
                <label class="block text-slate-300 mb-1 font-bold uppercase text-[11px]">Horómetro Chasis Salida (hrs)</label>
                <input v-model.number="formCierre.horometro_chasis_cierre" type="number" step="0.1" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                <span class="text-[10px] text-slate-500 font-mono">Entrada: {{ selectedOt?.ot?.horometro_chasis_inicio || 0 }} hrs</span>
              </div>
              <div>
                <label class="block text-slate-300 mb-1 font-bold uppercase text-[11px]">Odómetro Salida (km)</label>
                <input v-model.number="formCierre.odometro_cierre" type="number" step="1" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                <span class="text-[10px] text-slate-500 font-mono">Entrada: {{ selectedOt?.ot?.odometro_inicio || 0 }} km</span>
              </div>
            </div>
          </div>

          <!-- 2. Checklist Técnico de Inspección de Salida (5 puntos) -->
          <div class="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
            <div class="text-[11px] font-black text-emerald-400 uppercase font-mono">
              2. Protocolo de Inspección de Salida y Seguridad Post-Intervención
            </div>
            <label class="flex items-start gap-2.5 text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900/60">
              <input type="checkbox" v-model="formCierre.protocolo.niveles_y_fugas_ok" class="mt-0.5 rounded border-slate-700" />
              <span><strong>Niveles y Estanqueidad:</strong> Fluidos verificados (motor, hidráulico, refrigerante) y sin fugas activas tras presurizar.</span>
            </label>
            <label class="flex items-start gap-2.5 text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900/60">
              <input type="checkbox" v-model="formCierre.protocolo.torque_y_guardas_ok" class="mt-0.5 rounded border-slate-700" />
              <span><strong>Torque y Protecciones:</strong> Torque de pernos/elementos intervenidos verificado y guardas reinstaladas.</span>
            </label>
            <label class="flex items-start gap-2.5 text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900/60">
              <input type="checkbox" v-model="formCierre.protocolo.retiro_loto_y_limpieza_ok" class="mt-0.5 rounded border-slate-700" />
              <span><strong>Desbloqueo y Orden:</strong> Retiro de bloqueo LOTO / cuñas, retiro de herramientas y limpieza general del equipo.</span>
            </label>
            <label class="flex items-start gap-2.5 text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900/60">
              <input type="checkbox" v-model="formCierre.protocolo.prueba_funcional_ok" class="mt-0.5 rounded border-slate-700" />
              <span><strong>Prueba Funcional en Vacío:</strong> Operación conforme de frenos, dirección, giro, pluma y mandos principales.</span>
            </label>
            <label class="flex items-start gap-2.5 text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900/60">
              <input type="checkbox" v-model="formCierre.protocolo.sistemas_seguridad_ok" class="mt-0.5 rounded border-slate-700" />
              <span><strong>Dispositivos de Seguridad:</strong> LMI/PAT, fin de carrera (anti-two-block), luces y alarmas operativas.</span>
            </label>
          </div>

          <!-- 3. Evidencias Fotográficas de Salida -->
          <div class="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-black uppercase text-emerald-400 font-mono">3. 📷 Fotografías de Salida / Entrega del Equipo</span>
              <button
                type="button"
                @click="dispararFotoSalidaWeb"
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[11px] font-bold border border-slate-700 flex items-center gap-1.5"
              >
                <Camera class="w-3.5 h-3.5" />
                Adjuntar Foto de Salida
              </button>
            </div>
            <div v-if="subiendoFotoSalidaWeb" class="text-[11px] text-amber-400 font-mono">
              Subiendo fotografía de salida...
            </div>
            <div v-if="fotosSalidaWeb.length > 0" class="flex flex-wrap gap-2 pt-1">
              <div
                v-for="(fs, fsIdx) in fotosSalidaWeb"
                :key="fsIdx"
                class="relative w-14 h-14 rounded-lg overflow-hidden border border-emerald-500/40 bg-black"
              >
                <img :src="resolverFotoUrl(fs)" class="w-full h-full object-cover" />
                <button
                  type="button"
                  @click="eliminarFotoSalidaWeb(fsIdx)"
                  class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold"
                >✕</button>
              </div>
            </div>
          </div>

          <!-- 4. Estado Resultante y Diagnóstico Final -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Estado Resultante del Activo *</label>
              <select v-model="formCierre.estado_equipo_resultante" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs">
                <option value="OPERATIVO">🟢 OPERATIVO (Liberado al 100%)</option>
                <option value="OPERATIVO_CON_RESTRICCION">🟡 OPERATIVO CON RESTRICCIÓN</option>
                <option value="FUERA_DE_SERVICIO">🔴 FUERA DE SERVICIO (Detenido)</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">PIN FES de 4 Dígitos del Supervisor *</label>
              <input v-model="formCierre.pin" type="password" maxlength="4" placeholder="••••" class="w-full text-center tracking-widest text-lg font-mono bg-slate-950 border border-slate-800 rounded-xl p-2 text-white" />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Diagnóstico y Observación Final de Liberación *</label>
            <textarea v-model="formCierre.observacion_final" rows="2" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" placeholder="Pruebas operacionales conformes y equipo entregado..."></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showCierreModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="confirmarCierre" class="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg">
            Firmar Inspección de Salida y Liberar Activo
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL 9: REGISTRAR NUEVO AVISO DE AVERÍA EN CONSOLA WEB (SPEC-097 §3.4)   -->
    <!-- ========================================================================= -->
    <div v-if="showNuevoAvisoModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-black text-white uppercase font-mono flex items-center gap-2">
            <AlertTriangle class="w-5 h-5 text-rose-400" />
            Registrar Aviso de Avería / Evento en Terreno
          </h3>
          <button @click="showNuevoAvisoModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="nuevoAvisoError" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold font-mono">
          ⚠️ {{ nuevoAvisoError }}
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Grúa / Equipo Afectado *</label>
            <select v-model="formNuevoAviso.id_equipo" @change="alSeleccionarEquipoAvisoWeb" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs">
              <option :value="null">-- Seleccione Grúa o Equipo --</option>
              <option v-for="eq in flotaEquipos" :key="eq.id_equipo" :value="eq.id_equipo">
                {{ eq.patente }} — {{ eq.marca }} {{ eq.modelo }} (Horo: {{ eq.horometro_actual }} hrs)
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Criticidad del Evento *</label>
              <select v-model="formNuevoAviso.criticidad" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs">
                <option value="PARADA_MAQUINA">🚨 PARADA_MAQUINA (Equipo Detenido)</option>
                <option value="DEGRADADO">⚠️ DEGRADADO (Opera con Falla)</option>
                <option value="OBSERVACION">📋 OBSERVACION (Anomalía Menor)</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Horómetro Reportado (hrs)</label>
              <input v-model.number="formNuevoAviso.horometro" type="number" step="0.1" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold" />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Síntoma / Descripción de la Avería *</label>
            <textarea
              v-model="formNuevoAviso.descripcion"
              rows="3"
              placeholder="Describa la falla reportada, código de error en tablero, fuga o síntoma detectado..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            ></textarea>
          </div>

          <!-- Evidencias Fotográficas del Aviso -->
          <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase text-slate-400">📷 Evidencias Fotográficas de la Falla</span>
              <button
                type="button"
                @click="dispararFotoAvisoWeb"
                class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1"
              >
                <Camera class="w-3 h-3" />
                Adjuntar Foto
              </button>
            </div>
            <div v-if="subiendoFotoAvisoWeb" class="text-[11px] text-amber-400 font-mono">
              Subiendo fotografía...
            </div>
            <div v-if="fotosAvisoWeb.length > 0" class="flex flex-wrap gap-2 pt-1">
              <div
                v-for="(fa, faIdx) in fotosAvisoWeb"
                :key="faIdx"
                class="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 bg-black"
              >
                <img :src="resolverFotoUrl(fa)" class="w-full h-full object-cover" />
                <button
                  type="button"
                  @click="eliminarFotoAvisoWeb(faIdx)"
                  class="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[8px] font-bold"
                >✕</button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showNuevoAvisoModal = false" :disabled="guardandoAvisoWeb" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button
            @click="submitNuevoAvisoWeb"
            :disabled="guardandoAvisoWeb"
            class="bg-rose-600 hover:bg-rose-500 text-white font-black px-5 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg disabled:opacity-50"
          >
            {{ guardandoAvisoWeb ? 'Registrando...' : 'Registrar Aviso de Avería' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 3: AGREGAR TAREA -->
    <div v-if="showNuevaActividadModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <h3 class="text-sm font-bold text-white uppercase">+ Agregar Tarea al Checklist</h3>
        <input v-model="formActividad.descripcion" type="text" placeholder="Descripción de la tarea..." class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs" />
        <input v-model.number="formActividad.horas_estimadas" type="number" placeholder="Horas estimadas (ej: 1.5)" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono" />
        <div class="flex justify-end gap-3 pt-3">
          <button @click="showNuevaActividadModal = false" class="text-slate-400 text-xs">Cancelar</button>
          <button @click="guardarActividad" class="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs uppercase">Guardar</button>
        </div>
      </div>
    </div>

    <!-- MODAL 4: IMPUTAR HH MULTITÉCNICO INDEPENDIENTE (SPEC-096 / REQ-1067) -->
    <div v-if="showNuevaHhModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-amber-400 font-mono text-base">👷</span>
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Imputar Mano de Obra (HH)</h3>
          </div>
          <button @click="showNuevaHhModal = false" class="text-slate-400 hover:text-white text-xs font-mono">✕</button>
        </div>

        <!-- Buscador para agregar Técnicos de la Nómina -->
        <div class="relative">
          <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1">
            Agregar Mecánicos Involucrados *
          </label>
          <div class="relative">
            <input
              v-model="busquedaTecnicoHh"
              @focus="mostrarDropdownTecnicosHh = true"
              type="text"
              placeholder="Buscar y seleccionar técnico para agregar a la faena..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-400 font-medium"
            />
            <button
              v-if="busquedaTecnicoHh"
              @click="busquedaTecnicoHh = ''; mostrarDropdownTecnicosHh = true"
              type="button"
              class="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xs"
            >✕</button>
          </div>

          <!-- Dropdown interactivo con filtro de texto en tiempo real -->
          <div
            v-if="mostrarDropdownTecnicosHh && tecnicosDisponiblesParaAgregar.length > 0"
            class="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 divide-y divide-slate-800/60"
          >
            <div
              v-for="t in tecnicosDisponiblesParaAgregar"
              :key="t.id_user"
              @click="agregarTecnicoModalHh(t)"
              class="p-2.5 hover:bg-slate-800/90 cursor-pointer text-xs flex justify-between items-center transition"
            >
              <div>
                <div class="font-bold text-white flex items-center gap-1.5">
                  <span>{{ t.nombre_completo }}</span>
                  <span v-if="t.rut" class="text-[10px] text-slate-500 font-mono">({{ t.rut }})</span>
                </div>
                <div class="text-[10px] text-cyan-400 font-mono mt-0.5">
                  {{ t.cargo || 'Técnico Taller Mantenimiento' }}
                </div>
              </div>
              <span class="text-emerald-400 font-bold text-xs">+ Agregar</span>
            </div>
          </div>
        </div>

        <!-- Lista de Técnicos Asignados con Horas Independientes (REQ-1067) -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-[11px] font-bold text-slate-400 uppercase">
              Técnicos Asignados a la Tarea ({{ tecnicosSeleccionadosHh.length }})
            </label>
            <span class="text-[10px] text-slate-500 font-mono">Tarifa: ${{ formatCantidad(tarifaHhVigente) }}/hr</span>
          </div>

          <div v-if="tecnicosSeleccionadosHh.length === 0" class="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl text-center text-xs text-slate-500 italic">
            Seleccione al menos un mecánico del buscador superior.
          </div>

          <div v-else class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="(t, idx) in tecnicosSeleccionadosHh"
              :key="t.id_user"
              class="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-sm"
            >
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span>{{ t.nombre_completo }}</span>
                  <span v-if="t.rut" class="text-[9px] text-slate-500 font-mono">({{ t.rut }})</span>
                </div>
                <div class="text-[10px] text-cyan-400 font-mono truncate">
                  {{ t.cargo || 'Técnico Taller' }}
                </div>
              </div>

              <!-- Input de Horas Independientes -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="text-[10px] font-mono text-slate-400 uppercase font-bold">HH:</span>
                <input
                  v-model.number="t.horas"
                  type="number"
                  step="0.5"
                  min="0.5"
                  class="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                />
                <span class="text-[11px] font-mono text-emerald-400 font-bold w-16 text-right">
                  ${{ formatCantidad(Number(t.horas || 0) * tarifaHhVigente) }}
                </span>
                <button
                  type="button"
                  @click="removerTecnicoHh(idx)"
                  class="w-6 h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold transition"
                  title="Quitar técnico"
                >✕</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Banner Resumen Financiero Total -->
        <div v-if="tecnicosSeleccionadosHh.length > 0" class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
          <div class="text-amber-200">
            <span class="font-bold text-amber-400 uppercase">Resumen Mano de Obra:</span>
            {{ totalHorasSeleccionadas }} HH totales en {{ tecnicosSeleccionadosHh.length }} mecánico(s)
          </div>
          <div class="text-right font-mono font-black text-amber-400 text-sm">
            ${{ formatClp(totalCostoSeleccionado) }}
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1">Trabajo Realizado / Labor Realizada en Conjunto *</label>
          <input
            v-model="formHh.descripcion_trabajo"
            type="text"
            placeholder="Ej: Cambio de cilindro hidráulico y regulación de presiones..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button @click="showNuevaHhModal = false; mostrarDropdownTecnicosHh = false" class="text-slate-400 hover:text-white text-xs">Cancelar</button>
          <button
            @click="guardarHh"
            :disabled="tecnicosSeleccionadosHh.length === 0 || !formHh.descripcion_trabajo"
            class="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs uppercase shadow transition"
          >
            Imputar HH ({{ tecnicosSeleccionadosHh.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 5: REGISTRAR MATERIAL HÍBRIDO -->
    <div v-if="showNuevoRepuestoModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>+</span> Registrar Insumo / Repuesto
          </h3>
          <button @click="showNuevoRepuestoModal = false" class="text-slate-400 hover:text-white text-xs font-mono">✕</button>
        </div>

        <!-- SELECTOR DE MODO -->
        <div class="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            @click="modoInsumoWeb = 'wms'"
            :class="[
              'py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2',
              modoInsumoWeb === 'wms'
                ? 'bg-emerald-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            <span>📦</span> Desde Bodega WMS (Stock Oficial)
          </button>
          <button
            type="button"
            @click="modoInsumoWeb = 'compra'"
            :class="[
              'py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2',
              modoInsumoWeb === 'compra'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            <span>📝</span> Compra Directa / Faena
          </button>
        </div>

        <!-- MODO 1: BODEGA WMS -->
        <div v-if="modoInsumoWeb === 'wms'" class="space-y-3">
          <!-- Buscador con debounce -->
          <div class="relative">
            <label class="text-[11px] font-bold text-slate-400 uppercase block mb-1">Buscar Producto en Catálogo WMS</label>
            <div class="relative">
              <input
                v-model="busquedaProductoWeb"
                @input="onBuscarProductoWeb"
                type="text"
                placeholder="Escriba SKU, Nombre o Código..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <span v-if="cargandoProductosWeb" class="absolute right-3 top-2.5 text-xs text-slate-400">⏳</span>
            </div>

            <!-- Sugerencias Dropdown -->
            <div
              v-if="sugerenciasProductosWeb.length > 0"
              class="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-30 divide-y divide-slate-800/60"
            >
              <div
                v-for="p in sugerenciasProductosWeb"
                :key="p.id || p.id_producto"
                @click="seleccionarProductoWeb(p)"
                class="p-2.5 hover:bg-slate-800/80 cursor-pointer text-xs flex justify-between items-center transition"
              >
                <div>
                  <div class="font-bold text-white flex items-center gap-2">
                    <span class="font-mono text-emerald-400">[{{ p.sku }}]</span>
                    {{ p.nombre }}
                  </div>
                  <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{{ p.familia || 'General' }}</span>
                    <span>•</span>
                    <span
                      v-if="Number(p.stock_disponible ?? p.stock_fisico ?? 0) > 0"
                      class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    >
                      ✓ Stock: {{ formatCantidad(p.stock_disponible ?? p.stock_fisico) }} {{ p.uom || p.unidad_medida_base || 'UN' }}
                    </span>
                    <span
                      v-else
                      class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    >
                      ✕ Sin Stock (0)
                    </span>
                  </div>
                </div>
                <div class="text-right font-mono text-xs">
                  <div class="text-emerald-400 font-bold">${{ formatClp(p.costo_pmp_vigente || p.pmp || 0) }}</div>
                  <div class="text-[10px] text-slate-500">PMP</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ficha reactiva del producto seleccionado -->
          <div v-if="productoSeleccionadoWeb" class="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3 space-y-2">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {{ productoSeleccionadoWeb.sku }}
                </span>
                <h4 class="text-xs font-bold text-white mt-1">{{ productoSeleccionadoWeb.nombre }}</h4>
                <p class="text-[11px] text-slate-400">{{ productoSeleccionadoWeb.familia || 'General' }}</p>
              </div>
              <button type="button" @click="limpiarProductoSeleccionadoWeb" class="text-slate-500 hover:text-slate-300 text-xs">Cambiar</button>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div>
                <span class="text-[10px] text-slate-400 uppercase block">Stock Físico en Pañol</span>
                <span
                  class="font-mono font-bold"
                  :class="Number(productoSeleccionadoWeb.stock_disponible ?? productoSeleccionadoWeb.stock_fisico ?? 0) > 0 ? 'text-emerald-400' : 'text-rose-400'"
                >
                  {{ formatCantidad(productoSeleccionadoWeb.stock_disponible ?? productoSeleccionadoWeb.stock_fisico) }} {{ productoSeleccionadoWeb.uom || productoSeleccionadoWeb.unidad_medida_base || 'UN' }}
                </span>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 uppercase block">Costo PMP Vigente (Kardex)</span>
                <span class="font-mono font-bold text-amber-400">
                  ${{ formatClp(productoSeleccionadoWeb.costo_pmp_vigente || productoSeleccionadoWeb.pmp || 0) }}
                </span>
                <span class="text-[9px] text-slate-500 block">No editable</span>
              </div>
            </div>
          </div>

          <!-- Selector de cantidad -->
          <div>
            <label class="text-[11px] font-bold text-slate-400 uppercase block mb-1">Cantidad a Imputar *</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="formMaterialWebWms.cantidad"
                type="number"
                min="0.1"
                step="1"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
              <span class="text-xs font-mono text-slate-400 px-3 bg-slate-950 border border-slate-800 rounded-xl py-2.5">
                {{ productoSeleccionadoWeb ? (productoSeleccionadoWeb.uom || productoSeleccionadoWeb.unidad_medida_base || 'UN') : 'UN' }}
              </span>
            </div>
            <div
              v-if="productoSeleccionadoWeb && formMaterialWebWms.cantidad > (productoSeleccionadoWeb.stock_disponible ?? productoSeleccionadoWeb.stock_fisico ?? 0)"
              class="text-[11px] text-amber-400 mt-1 flex items-center gap-1"
            >
              <span>⚠️</span>
              La cantidad supera el stock físico disponible en pañol ({{ formatCantidad(productoSeleccionadoWeb.stock_disponible ?? productoSeleccionadoWeb.stock_fisico) }}).
            </div>
          </div>
        </div>

        <!-- MODO 2: COMPRA DIRECTA / FAENA -->
        <div v-else class="space-y-3">
          <div>
            <label class="text-[11px] font-bold text-slate-400 uppercase block mb-1">Descripción Insumo / Material *</label>
            <input
              v-model="formMaterialWebCompra.descripcion"
              type="text"
              placeholder="Ej: Filtro aceite hidráulico Donaldson..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase block mb-1">Cantidad *</label>
              <input
                v-model.number="formMaterialWebCompra.cantidad"
                type="number"
                min="0.1"
                step="1"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase block mb-1">Unidad</label>
              <input
                v-model="formMaterialWebCompra.unidad"
                type="text"
                placeholder="UN, L, KG"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div class="bg-slate-950/80 border border-amber-500/30 rounded-xl p-2.5 text-[11px] text-amber-300 flex items-center justify-between">
            <span class="font-bold uppercase">Valorización ($ CLP):</span>
            <span class="text-slate-300">Asignada por Adquisiciones / Bodega al recepcionar OC o Factura</span>
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-400 uppercase block mb-1">N° Factura / Boleta / Proveedor</label>
            <input
              v-model="formMaterialWebCompra.numero_documento_compra"
              type="text"
              placeholder="Ej: Fac 12890 · Filtros y Mangueras Ltda"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <!-- ACCIONES -->
        <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            @click="showNuevoRepuestoModal = false"
            class="text-slate-400 hover:text-white text-xs px-3 py-2 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="guardarMaterialWeb"
            :class="[
              'px-4 py-2 rounded-xl font-bold text-xs uppercase transition shadow',
              modoInsumoWeb === 'wms' ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            ]"
          >
            {{ modoInsumoWeb === 'wms' ? 'Imputar desde Bodega' : 'Registrar Insumo Directo' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 6: REGISTRAR SERVICIO EXTERNO -->
    <div v-if="showNuevoServicioModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <h3 class="text-sm font-bold text-white uppercase">+ Registrar Servicio Especializado</h3>
        <input v-model="formServicio.proveedor" type="text" placeholder="Proveedor (ej: Cummins Chile)..." class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs" />
        <input v-model="formServicio.numero_documento_compra" type="text" placeholder="Nº Factura / Orden Compra" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono" />
        <input v-model="formServicio.descripcion_servicio" type="text" placeholder="Descripción del trabajo..." class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs" />
        <input v-model.number="formServicio.costo" type="number" placeholder="Costo Neto CLP" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono" />
        <div class="flex justify-end gap-3 pt-3">
          <button @click="showNuevoServicioModal = false" class="text-slate-400 text-xs">Cancelar</button>
          <button @click="guardarServicio" class="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs uppercase">Registrar</button>
        </div>
      </div>
    </div>

    <!-- MODAL 7: REGISTRAR HALLAZGO -->
    <div v-if="showNuevoHallazgoModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <h3 class="text-sm font-bold text-white uppercase">+ Registrar Hallazgo Imprevisto</h3>
        <div class="grid grid-cols-2 gap-3">
          <select v-model="formHallazgo.criticidad" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono">
            <option value="C1">C1 - Crítico (Parada Inmediata)</option>
            <option value="C2">C2 - Mayor (48 hrs)</option>
            <option value="C3">C3 - Menor (Próximo PM)</option>
            <option value="C4">C4 - Observación</option>
          </select>
          <select v-model="formHallazgo.sistema" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono">
            <option value="HID">HID - Hidráulica</option>
            <option value="MOT">MOT - Motor / Transmisión</option>
            <option value="PLU">PLU - Pluma / Telescopaje</option>
            <option value="CAB">CAB - Cables y Pasteca</option>
            <option value="SEG">SEG - Sistemas Seguridad</option>
            <option value="ELE">ELE - Eléctrico / Electrónico</option>
            <option value="EST">EST - Estructura / Chasis</option>
          </select>
        </div>
        <input v-model="formHallazgo.componente" type="text" placeholder="Componente específico..." class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs" />
        <textarea v-model="formHallazgo.descripcion" rows="2" placeholder="Descripción de la anomalía observada..." class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs"></textarea>
        <label class="flex items-center gap-2 text-rose-400 text-xs font-bold cursor-pointer">
          <input type="checkbox" v-model="formHallazgo.afecta_izaje" class="rounded border-slate-700" />
          <span>¿Afecta la capacidad o seguridad de izaje?</span>
        </label>

        <!-- Evidencias Fotográficas Detección (Antes) -->
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase text-slate-400">📷 Evidencias Fotográficas (Antes)</span>
            <button
              type="button"
              @click="dispararFotoHallazgoWeb"
              class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1"
            >
              <Camera class="w-3 h-3" />
              Adjuntar Foto
            </button>
          </div>
          <div v-if="subiendoFotoHallazgoWeb" class="text-[11px] text-amber-400 font-mono">
            Subiendo fotografía a almacenamiento...
          </div>
          <div v-if="fotosHallazgoWeb.length > 0" class="flex flex-wrap gap-2 pt-1">
            <div
              v-for="(f, fIdx) in fotosHallazgoWeb"
              :key="fIdx"
              class="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 group bg-black"
            >
              <img :src="resolverFotoUrl(f)" class="w-full h-full object-cover" />
              <button
                type="button"
                @click="eliminarFotoHallazgoWeb(fIdx)"
                class="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[8px] font-bold"
              >✕</button>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3">
          <button @click="showNuevoHallazgoModal = false" class="text-slate-400 text-xs">Cancelar</button>
          <button @click="guardarHallazgo" class="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs uppercase">Registrar Hallazgo</button>
        </div>
      </div>
    </div>

    <!-- MODAL 8: RESOLVER HALLAZGO (CIERRE CON EVIDENCIA "DESPUÉS") -->
    <div v-if="showResolverHallazgoModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-sm font-black text-white uppercase font-mono flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-emerald-400" />
              Resolución Técnica de Hallazgo #{{ hallazgoSeleccionadoParaResolver?.id_hallazgo }}
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5 font-mono">
              Equipo: <strong class="text-white">{{ hallazgoSeleccionadoParaResolver?.patente || `Equipo #${hallazgoSeleccionadoParaResolver?.id_equipo}` }}</strong> •
              Criticidad: <strong class="text-rose-400">{{ hallazgoSeleccionadoParaResolver?.criticidad }}</strong>
            </p>
          </div>
          <button @click="showResolverHallazgoModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="resolverHallazgoError" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-2.5 rounded-xl text-xs font-bold font-mono">
          ⚠️ {{ resolverHallazgoError }}
        </div>

        <!-- Resumen del defecto -->
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
          <div class="text-[10px] text-slate-500 font-bold uppercase">Defecto Detectado:</div>
          <div class="text-white font-medium">{{ hallazgoSeleccionadoParaResolver?.descripcion }}</div>
          <div class="text-[10px] text-slate-400 font-mono">
            Sistema: <strong class="text-amber-400">{{ hallazgoSeleccionadoParaResolver?.sistema }}</strong> • Componente: <strong class="text-white">{{ hallazgoSeleccionadoParaResolver?.componente }}</strong>
          </div>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Decisión Técnica *</label>
            <select v-model="formResolverHallazgo.decision" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs">
              <option value="RESUELTO_EN_OT">✅ RESUELTO_EN_OT — Reparado y verificado en esta intervención</option>
              <option value="OT_DERIVADA">🔄 OT_DERIVADA — Requiere orden de trabajo especializada posterior</option>
              <option value="BACKLOG">📋 BACKLOG — Programar en próximo mantenimiento planificado</option>
              <option value="RESTRICCION_OPERACION">⚠️ RESTRICCION_OPERACION — Activo operativo con carga reducida</option>
              <option value="FUERA_DE_SERVICIO">🛑 FUERA_DE_SERVICIO — Detención obligatoria por seguridad</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Solución Aplicada / Acción Ejecutada *</label>
            <textarea
              v-model="formResolverHallazgo.solucion_aplicada"
              rows="3"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              placeholder="Describa el trabajo realizado, repuestos cambiados, calibraciones o pruebas de carga efectuadas..."
            ></textarea>
          </div>

          <!-- Fotos de Cierre ("Después") -->
          <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase text-emerald-400">📷 Evidencias Fotográficas de Reparación (Después)</span>
              <button
                type="button"
                @click="dispararFotoCierreHallazgoWeb"
                class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1"
              >
                <Camera class="w-3 h-3" />
                Adjuntar Foto Reparación
              </button>
            </div>
            <div v-if="subiendoFotoCierreWeb" class="text-[11px] text-amber-400 font-mono">
              Subiendo fotografía de reparación...
            </div>
            <div v-if="fotosCierreHallazgoWeb.length > 0" class="flex flex-wrap gap-2 pt-1">
              <div
                v-for="(fc, fcIdx) in fotosCierreHallazgoWeb"
                :key="fcIdx"
                class="relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/40 group bg-black"
              >
                <img :src="resolverFotoUrl(fc)" class="w-full h-full object-cover" />
                <button
                  type="button"
                  @click="eliminarFotoCierreHallazgoWeb(fcIdx)"
                  class="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[8px] font-bold"
                >✕</button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button @click="showResolverHallazgoModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">
            Cancelar
          </button>
          <button
            @click="submitResolverHallazgo"
            :disabled="guardandoResolucion"
            class="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg disabled:opacity-50"
          >
            <ShieldCheck class="w-4 h-4" />
            <span>{{ guardandoResolucion ? 'Guardando...' : 'Cerrar Hallazgo' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL FOTO PREVIEW PANTALLA COMPLETA -->
    <div v-if="mostrarModalPreviewFotoWeb" class="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[70] flex items-center justify-center p-4" @click="mostrarModalPreviewFotoWeb = false">
      <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <button
          @click="mostrarModalPreviewFotoWeb = false"
          class="absolute -top-10 right-0 text-white font-mono text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg border border-slate-600"
        >
          Cerrar ✕
        </button>
        <img :src="previewFotoUrlWeb" class="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-700" @click.stop />
      </div>
    </div>

    <!-- MODAL FICHA QR OFICIAL (SPEC 71) -->
    <div v-if="mostrarModalFichaQrWeb" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4" @click="mostrarModalFichaQrWeb = false">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl" @click.stop>
        <!-- Cabecera -->
        <div class="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30">
              <QrCode class="w-5 h-5" />
            </div>
            <div>
              <div class="text-[10px] font-mono uppercase font-black text-emerald-400 tracking-wider">
                📱 FICHA QR OFICIAL • GSP
              </div>
              <div class="text-lg font-black text-white font-mono">
                {{ patenteFichaQrWeb }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a
              :href="urlFichaQrWeb"
              target="_blank"
              class="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              Abrir en Nueva Pestaña
            </a>
            <button
              @click="mostrarModalFichaQrWeb = false"
              class="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Cuerpo con Iframe Canónico -->
        <div class="flex-1 p-2 bg-black overflow-hidden" style="min-height: 560px;">
          <iframe
            v-if="urlFichaQrWeb"
            :src="urlFichaQrWeb"
            class="w-full h-full rounded-2xl border border-slate-800"
            style="min-height: 560px; background: #0a0a0a;"
          ></iframe>
        </div>
      </div>
    </div>

    <!-- INPUT OCULTO PARA CARGA DE FOTOGRAFÍA -->
    <input
      type="file"
      ref="inputWebFotoRef"
      accept="image/*"
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFotoWeb"
    />

    <!-- INPUT OCULTO PARA FOTOGRAFÍAS 360° DE RECEPCIÓN -->
    <input
      type="file"
      ref="inputWebFoto360Ref"
      accept="image/*"
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFoto360Web"
    />

    <!-- INPUT OCULTO PARA FOTOGRAFÍAS DE HALLAZGOS (DETECCIÓN) -->
    <input
      type="file"
      ref="inputFotoHallazgoRef"
      accept="image/*"
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFotoHallazgoWeb"
    />

    <!-- INPUT OCULTO PARA FOTOGRAFÍAS DE RESOLUCIÓN DE HALLAZGOS (CIERRE) -->
    <input
      type="file"
      ref="inputFotoCierreHallazgoRef"
      accept="image/*"
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFotoCierreHallazgoWeb"
    />

    <!-- INPUT OCULTO PARA FOTOGRAFÍAS DE SALIDA DE OT -->
    <input
      type="file"
      ref="inputFotoSalidaRef"
      accept="image/*"
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFotoSalidaWeb"
    />

    <!-- INPUT OCULTO PARA FOTOGRAFÍAS DE AVISO DE AVERÍA -->
    <input
      type="file"
      ref="inputFotoAvisoRef"
      accept="image/*"
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFotoAvisoWeb"
    />

    <!-- BANNER TOAST NOTIFICACIÓN ENTERPRISE -->
    <div
      v-if="toast.show"
      :class="[
        'fixed bottom-6 right-6 z-[80] p-4 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold transition-all transform',
        toast.tipo === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
      ]"
    >
      <CheckCircle2 v-if="toast.tipo === 'success'" class="w-5 h-5 text-emerald-400 shrink-0" />
      <AlertCircle v-else class="w-5 h-5 text-rose-400 shrink-0" />
      <span>{{ toast.mensaje }}</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PLANTILLA DE IMPRESIÓN EN PAPEL A4 (SPEC-096 / REQ-1068 - ERGONOMÍA PATIO) -->
  <!-- ========================================================================= -->
  <div v-if="selectedOt" id="printable-pauta-ot" class="hidden print:block text-black bg-white p-2 font-sans max-w-4xl mx-auto text-[11px] leading-tight">
    <!-- Encabezado Corporativo Compacto (1 Hoja A4) -->
    <div class="border-b-2 border-black pb-1.5 mb-2 flex justify-between items-center">
      <div>
        <h1 class="text-lg font-black uppercase tracking-tight text-black leading-none">Grúas San Pablo</h1>
        <p class="text-[10px] uppercase tracking-wider text-slate-700 font-bold mt-0.5">Taller Central Temuco • Orden de Trabajo & Pauta de Mantenimiento (1 Hoja A4)</p>
      </div>
      <div class="text-right">
        <div class="text-xl font-black font-mono text-black leading-none">{{ selectedOt.ot?.numero_ot || selectedOt.ot?.folio }}</div>
        <div class="text-[10px] uppercase font-extrabold text-slate-800 mt-0.5">
          Tipo: {{ selectedOt.ot?.tipo_mantenimiento }} • Prioridad: P{{ selectedOt.ot?.prioridad }} • Estado: {{ selectedOt.ot?.estado }}
        </div>
      </div>
    </div>

    <!-- Ficha del Activo y Asignación Compacta -->
    <div class="border border-black rounded-lg p-2 mb-2 bg-slate-50 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
      <div><strong class="text-slate-900">Equipo:</strong> <span class="font-black text-black ml-1">{{ selectedOt.ot?.patente }}</span> ({{ selectedOt.ot?.marca }} {{ selectedOt.ot?.modelo }})</div>
      <div><strong class="text-slate-900">Jefe de Taller:</strong> <span class="font-bold text-black ml-1">{{ selectedOt.ot?.nombre_supervisor || 'Allan / Leonel Vergara' }}</span></div>
      <div><strong class="text-slate-900">Alcance:</strong> <span class="font-medium text-slate-800 ml-1">{{ selectedOt.ot?.alcance_mantenimiento || 'Superestructura / Chasis' }}</span></div>
      <div><strong class="text-slate-900">Mecánico(s):</strong> <span class="font-bold text-black ml-1">{{ selectedOt.ot?.nombre_tecnico || 'Por asignar en patio' }}</span></div>
      <div class="col-span-2 pt-1 border-t border-slate-300" v-if="selectedOt.ot?.descripcion_falla || selectedOt.ot?.falla_reportada">
        <strong class="text-slate-900">Motivo / Falla Reportada:</strong> <span class="font-medium text-black ml-1">{{ selectedOt.ot?.descripcion_falla || selectedOt.ot?.falla_reportada }}</span>
      </div>
    </div>

    <!-- Control de Tiempos y Medidores de Faena Compacto -->
    <div class="border border-black rounded-lg p-2 mb-2">
      <div class="text-[10px] font-black uppercase text-black mb-1 tracking-wider flex items-center justify-between border-b border-black pb-0.5">
        <span>⏱️ Control de Tiempos y Medidores de Faena (Llenado en Patio)</span>
        <span class="text-[9px] text-slate-600 font-mono font-bold">Registro Obligatorio</span>
      </div>
      <div class="grid grid-cols-2 gap-3 text-[11px]">
        <!-- Tiempo Inicio (Sistema) -->
        <div class="border-r border-slate-300 pr-2 space-y-0.5">
          <div class="font-black text-black text-[10px] uppercase">INICIO REGISTRADO (SISTEMA)</div>
          <div>Fecha / Hora Inicio: <strong class="font-mono text-black">{{ formatDateTime(selectedOt.ot?.fecha_creacion || selectedOt.ot?.fecha_programada) }}</strong></div>
          <div class="flex flex-wrap gap-x-3">
            <span>Horo. Grúa: <strong class="font-mono text-black">{{ selectedOt.ot?.horometro_grua_inicio || selectedOt.ot?.horometro_inicio || '---' }} hrs</strong></span>
            <span v-if="selectedOt.ot?.horometro_chasis_inicio">Horo. Chasis: <strong class="font-mono text-black">{{ selectedOt.ot?.horometro_chasis_inicio }} hrs</strong></span>
            <span v-if="selectedOt.ot?.odometro_inicio">Odómetro: <strong class="font-mono text-black">{{ selectedOt.ot?.odometro_inicio }} km</strong></span>
          </div>
        </div>

        <!-- Tiempo Término -->
        <div class="pl-1">
          <div class="font-black text-black text-[10px] uppercase mb-0.5">TÉRMINO DE FAENA</div>
          <div v-if="selectedOt.ot?.estado === 'CERRADA'" class="space-y-0.5">
            <div>Fecha / Hora Cierre: <strong class="font-mono text-black">{{ formatDateTime(selectedOt.ot?.fecha_cierre || selectedOt.ot?.fecha_cierre_real) }}</strong></div>
            <div>Horómetro Salida: <strong class="font-mono text-black">{{ selectedOt.ot?.horometro_termino || selectedOt.ot?.horometro_cierre || '---' }} hrs</strong> • Estado: <strong class="uppercase">{{ selectedOt.ot?.estado_equipo_resultante || 'OPERATIVO' }}</strong></div>
          </div>
          <div v-else class="grid grid-cols-3 gap-1.5 text-[10px]">
            <div class="p-1 border border-black rounded bg-white">
              <span class="block font-bold text-slate-700 text-[9px] uppercase">Fecha Término:</span>
              <span class="font-mono font-black text-slate-800">___/___/2026</span>
            </div>
            <div class="p-1 border border-black rounded bg-white">
              <span class="block font-bold text-slate-700 text-[9px] uppercase">Hora Término:</span>
              <span class="font-mono font-black text-slate-800">___ : ___ hrs</span>
            </div>
            <div class="p-1 border border-black rounded bg-white">
              <span class="block font-bold text-slate-700 text-[9px] uppercase">Horo. / Odo. Salida:</span>
              <span class="font-mono font-black text-slate-800">__________</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de Pauta / Checklist de Actividades Compacta -->
    <div class="mb-2">
      <h3 class="text-[10px] font-black uppercase tracking-wider text-black mb-1">
        1. Pauta de Actividades y Verificaciones Técnicas (Marcar con Lápiz)
      </h3>
      <table class="w-full text-[11px] border border-black border-collapse">
        <thead>
          <tr class="bg-slate-200 text-black border-b border-black">
            <th class="w-10 text-center py-1 px-1 border-r border-black uppercase text-[9px] font-black">Check</th>
            <th class="w-8 text-center py-1 px-1 border-r border-black uppercase text-[9px] font-black">N°</th>
            <th class="text-left py-1 px-2 border-r border-black uppercase text-[9px] font-black">Descripción de la Tarea / Actividad</th>
            <th class="w-16 text-center py-1 px-1 border-r border-black uppercase text-[9px] font-black">HH Est.</th>
            <th class="w-20 text-center py-1 px-1 uppercase text-[9px] font-black">V°B° Patio</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(act, idx) in (selectedOt.actividades || [])" :key="act.id_actividad" class="border-b border-black">
            <td class="text-center py-1 px-1 border-r border-black">
              <div class="w-4 h-4 border border-black rounded flex items-center justify-center text-xs font-black mx-auto bg-white">
                {{ act.estado === 'COMPLETADA' ? '✓' : '' }}
              </div>
            </td>
            <td class="text-center py-1 border-r border-black font-mono font-bold text-slate-800">{{ idx + 1 }}</td>
            <td class="py-1 px-2 border-r border-black font-semibold text-black">
              {{ act.descripcion }}
            </td>
            <td class="text-center py-1 border-r border-black font-mono text-[10px]">{{ act.horas_estimadas ? act.horas_estimadas + 'h' : '---' }}</td>
            <td class="text-center py-1 font-mono text-slate-400 text-[10px]">[ &nbsp; &nbsp; ]</td>
          </tr>
          <tr v-for="n in Math.max(0, 2 - (selectedOt.actividades?.length || 0))" :key="'extra-' + n" class="border-b border-black">
            <td class="text-center py-1 border-r border-black">
              <div class="w-4 h-4 border border-slate-400 rounded mx-auto"></div>
            </td>
            <td class="text-center py-1 border-r border-black font-mono text-slate-400">{{ (selectedOt.actividades?.length || 0) + n }}</td>
            <td class="py-1 px-2 border-r border-black text-slate-300 text-[10px]">.................................................................................................................................</td>
            <td class="text-center py-1 border-r border-black text-slate-400 text-[10px]">___h</td>
            <td class="text-center py-1 text-slate-400 text-[10px]">[ &nbsp; &nbsp; ]</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sección 2: Observaciones y Repuestos en la misma página (Sin salto de hoja) -->
    <div class="grid grid-cols-1 gap-2 mb-2">
      <div class="border border-black rounded-lg p-2 bg-white">
        <h4 class="text-[10px] font-black uppercase text-black mb-1 tracking-wider border-b border-black pb-0.5">
          2. Observaciones Técnicas, Diagnóstico y Modificaciones en Terreno (Anotación Manual):
        </h4>
        <div class="space-y-1">
          <div class="h-5 border-b border-slate-400 flex items-end pb-0.5 text-slate-400 font-mono text-[10px]">1.</div>
          <div class="h-5 border-b border-slate-400 flex items-end pb-0.5 text-slate-400 font-mono text-[10px]">2.</div>
          <div class="h-5 border-b border-slate-400 flex items-end pb-0.5 text-slate-400 font-mono text-[10px]">3.</div>
        </div>
      </div>

      <div class="border border-black rounded-lg p-2 bg-white">
        <h4 class="text-[10px] font-black uppercase text-black mb-1 tracking-wider border-b border-black pb-0.5">
          3. Repuestos e Insumos Utilizados en Faena:
        </h4>
        <table class="w-full text-[10px] border border-black border-collapse">
          <thead>
            <tr class="bg-slate-100 text-black border-b border-black font-black">
              <th class="w-8 text-center py-0.5 border-r border-black">N°</th>
              <th class="text-left py-0.5 px-2 border-r border-black">Descripción / N° Parte</th>
              <th class="w-16 text-center py-0.5 border-r border-black">Cant.</th>
              <th class="w-36 text-center py-0.5">Origen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rep, rIdx) in (selectedOt.repuestos || []).slice(0, 3)" :key="'rep-real-' + rIdx" class="border-b border-slate-300">
              <td class="text-center py-0.5 border-r border-black font-mono">{{ rIdx + 1 }}</td>
              <td class="py-0.5 px-2 border-r border-black font-semibold">{{ rep.nombre_repuesto || rep.descripcion }}</td>
              <td class="text-center py-0.5 border-r border-black font-mono">{{ rep.cantidad }} {{ rep.unidad || 'UN' }}</td>
              <td class="text-center py-0.5 font-mono text-[9px]">{{ rep.origen || 'BODEGA' }}</td>
            </tr>
            <tr v-for="i in Math.max(1, 2 - (selectedOt.repuestos?.length || 0))" :key="'rep-pad-' + i" class="border-b border-slate-300">
              <td class="text-center py-1 border-r border-black font-mono text-slate-400">{{ (selectedOt.repuestos?.length || 0) + i }}</td>
              <td class="py-1 px-2 border-r border-black text-slate-300">.................................................................................................</td>
              <td class="text-center py-1 border-r border-black text-slate-400">____</td>
              <td class="text-center py-1 font-mono text-slate-400 text-[9px]">[ ] Pañol &nbsp; [ ] Directa</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cuadro de Firmas Físicas Compacto al Pie de la Página 1 -->
    <div class="grid grid-cols-2 gap-6 pt-1 border-t border-black text-[11px]">
      <div class="text-center">
        <div class="h-12 border-b border-black mb-1 flex items-end justify-center pb-0.5">
          <span class="text-[9px] text-slate-400 font-mono italic">(Firma Mecánico Ejecutor)</span>
        </div>
        <div class="font-black text-black uppercase text-[10px]">{{ selectedOt.ot?.nombre_tecnico || 'Mecánico Ejecutor Taller' }}</div>
        <div class="text-[9px] text-slate-700 font-mono">RUT / Firma: ................................................</div>
      </div>
      <div class="text-center">
        <div class="h-12 border-b border-black mb-1 flex items-end justify-center pb-0.5">
          <span class="text-[9px] text-slate-400 font-mono italic">(Firma y V°B° Jefatura de Taller)</span>
        </div>
        <div class="font-black text-black uppercase text-[10px]">
          {{ selectedOt.ot?.nombre_supervisor || 'Allan / Leonel Vergara' }}
        </div>
        <div class="text-[9px] text-slate-600 font-mono">
          Jefatura de Taller Mantenimiento • Grúas San Pablo
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Wrench, PlusCircle, Eye, Truck, AlertTriangle, ShieldCheck, Clock, RotateCw, FileText, Sliders, ArrowLeft, Camera, QrCode, ExternalLink, Save, Trash2, Maximize2, CheckCircle2, AlertCircle, Printer } from 'lucide-vue-next'
import apiAxios from '../services/api'
import { resolverFotoUrl } from '../utils/storage'

const router = useRouter()
const route = useRoute()

// Toast reactivo
const toast = ref({
  show: false,
  mensaje: '',
  tipo: 'success'
})

const mostrarToast = (mensaje, tipo = 'success') => {
  toast.value = { show: true, mensaje, tipo }
  setTimeout(() => { toast.value.show = false }, 4000)
}

// Estado Pestañas
const resolverTabInicial = () => {
  const qTab = route?.query?.tab ? String(route.query.tab).toLowerCase() : null
  if (qTab && ['ots', 'flota', 'avisos', 'hallazgos', 'parametros'].includes(qTab)) {
    return qTab
  }
  if (route?.query?.folio) return 'avisos'
  return 'ots'
}
const activeMainTab = ref(resolverTabInicial())
const activeOtSubTab = ref('actividades')
const loadingData = ref(false)

// Stores de Datos Reales
const kpisData = ref(null)
const otsStore = ref([])
const flotaEquipos = ref([])
const avisosAveria = ref([])
const hallazgosList = ref([])
const parametrosStore = ref([])

// Formulario Parámetros Operacionales de Taller (SPEC-079)
const parametrosForm = ref({
  pm_intervalo_base_horas: 250,
  pm_ventana_alerta_horas: 25,
  pm_intervalo_odometro_km: 10000,
  tarifa_hh_default: 15000,
  umbral_costo_ot_clp: 2000000,
  cert_alerta_dias: 30
})
const guardandoParametros = ref(false)
const guardarParametrosSuccess = ref(false)
const guardarParametrosError = ref('')
const searchQuery = ref('')
const filterEstado = ref('')
const filterTipo = ref('')
const filterPrioridad = ref('')

// OT Seleccionada
const selectedOt = ref(null)

// Modales
const showNuevaOtModal = ref(false)
const creandoOt = ref(false)
const showCierreModal = ref(false)
const showNuevaActividadModal = ref(false)
const showNuevaHhModal = ref(false)
const mostrarDropdownTecnicosHh = ref(false)
const busquedaTecnicoHh = ref('')
const tecnicosSeleccionadosHh = ref([])

const tarifaHhVigente = computed(() => Number(parametrosForm.value?.tarifa_hh_default || 15000))

const tecnicosDisponiblesParaAgregar = computed(() => {
  const query = (busquedaTecnicoHh.value || '').toLowerCase().trim()
  const seleccionadosIds = new Set(tecnicosSeleccionadosHh.value.map(t => t.id_user))
  return listaTecnicos.value.filter(t => {
    if (seleccionadosIds.has(t.id_user)) return false
    if (!query) return true
    return (t.nombre_completo || '').toLowerCase().includes(query) ||
           (t.cargo || '').toLowerCase().includes(query) ||
           (t.rut || '').toLowerCase().includes(query)
  })
})

const totalHorasSeleccionadas = computed(() => {
  return tecnicosSeleccionadosHh.value.reduce((acc, t) => acc + (parseFloat(t.horas) || 0), 0)
})

const totalCostoSeleccionado = computed(() => {
  return totalHorasSeleccionadas.value * tarifaHhVigente.value
})

const agregarTecnicoModalHh = (tecnico) => {
  tecnicosSeleccionadosHh.value.push({
    id_user: tecnico.id_user,
    nombre_completo: tecnico.nombre_completo,
    cargo: tecnico.cargo,
    rut: tecnico.rut,
    horas: 2.0
  })
  busquedaTecnicoHh.value = ''
  mostrarDropdownTecnicosHh.value = false
}

const removerTecnicoHh = (idx) => {
  tecnicosSeleccionadosHh.value.splice(idx, 1)
}

const abrirModalNuevaHh = () => {
  busquedaTecnicoHh.value = ''
  tecnicosSeleccionadosHh.value = []
  formHh.value = { descripcion_trabajo: '', horas: 2.0 }
  if (selectedOt.value?.ot?.id_tecnico_responsable && listaTecnicos.value.length > 0) {
    const defaultTec = listaTecnicos.value.find(t => t.id_user === selectedOt.value.ot.id_tecnico_responsable)
    if (defaultTec) {
      agregarTecnicoModalHh(defaultTec)
    }
  }
  showNuevaHhModal.value = true
}

const imprimirPautaOt = () => {
  if (!selectedOt.value) return
  window.print()
}
const showNuevoRepuestoModal = ref(false)
const showNuevoServicioModal = ref(false)
const showNuevoHallazgoModal = ref(false)
const showResolverHallazgoModal = ref(false)
const hallazgoSeleccionadoParaResolver = ref(null)
const formResolverHallazgo = ref({
  decision: 'RESUELTO_EN_OT',
  solucion_aplicada: ''
})
const resolverHallazgoError = ref('')
const guardandoResolucion = ref(false)

// Fotos Hallazgos (Detección / Antes)
const fotosHallazgoWeb = ref([])
const subiendoFotoHallazgoWeb = ref(false)
const inputFotoHallazgoRef = ref(null)

// Fotos Resolución Hallazgos (Cierre / Después)
const fotosCierreHallazgoWeb = ref([])
const subiendoFotoCierreWeb = ref(false)
const inputFotoCierreHallazgoRef = ref(null)

// Feed de Actividades (Fotos & Comentarios)
const cajaComentarioWebAbierta = ref({})
const nuevoComentarioWebTexto = ref({})
const guardandoComentarioWeb = ref({})
const previewFotoUrlWeb = ref('')
const mostrarModalPreviewFotoWeb = ref(false)
const inputWebFotoRef = ref(null)
const actividadObjetivoFotoWeb = ref(null)

// Errores
const nuevaOtError = ref('')
const cierreError = ref('')
const alertaEquipoConOt = ref('')
const listaTecnicos = ref([])

// Medidores de Entrada Web (Spec 71)
const formMedidoresWeb = ref({
  horometro_grua_inicio: 0,
  horometro_chasis_inicio: 0,
  odometro_inicio: 0
})
const guardandoMedidoresWeb = ref(false)

// Fotos 360 Web (Spec 71)
const ranurasFotos360Web = [
  { key: 'frente', titulo: '1. Frontal / Cabina', icono: '🚚', descripcion: 'Cabina, parabrisas y luces' },
  { key: 'lat_izq', titulo: '2. Lateral Izq.', icono: '👈', descripcion: 'Orugas / estabilizadores izq.' },
  { key: 'lat_der', titulo: '3. Lateral Der.', icono: '👉', descripcion: 'Estanque y estabilizadores der.' },
  { key: 'posterior', titulo: '4. Posterior', icono: '🔙', descripcion: 'Cola de máquina y contrapesas' },
  { key: 'tablero', titulo: '5. Tablero Medidores', icono: '⏱️', descripcion: 'Horómetro y odómetro de ingreso' },
  { key: 'sist_izaje', titulo: '6. Pluma / Gancho', icono: '⚙️', descripcion: 'Pluma telescópica y pasteca' }
]
const fotos360Web = ref({})
const inputWebFoto360Ref = ref(null)
const slot360WebActivo = ref(null)

const contarFotos360Web = computed(() => {
  return Object.values(fotos360Web.value).filter(f => f && Boolean(resolverFotoUrl(f))).length
})

// Ficha QR Oficial Web (Spec 71)
const mostrarModalFichaQrWeb = ref(false)
const patenteFichaQrWeb = ref('')

const urlFichaQrWeb = computed(() => {
  if (!patenteFichaQrWeb.value) return ''
  const p = patenteFichaQrWeb.value.trim().toUpperCase()
  const isProd = typeof window !== 'undefined' && window.location.pathname.startsWith('/lg-gsp-prod')
  return `https://servidor.leanglobal.cl/${isProd ? 'lg-gsp-prod' : 'lg-gsp-dev'}/equipo/${p}`
})

const abrirFichaQrWeb = (patente) => {
  if (!patente) return
  patenteFichaQrWeb.value = patente
  mostrarModalFichaQrWeb.value = true
}

const abrirPreviewFotoWebModal = (url) => {
  previewFotoUrlWeb.value = url
  mostrarModalPreviewFotoWeb.value = true
}

// Formularios
const formNuevaOt = ref({
  id_equipo: null,
  patente: '',
  tipo_mantenimiento: 'PREVENTIVO',
  codigo_pauta: 'PM250',
  prioridad: 3,
  horometro_inicio: 0,
  descripcion_falla: '',
  id_tecnico_responsable: null,
  fecha_programada: '',
  observaciones: '',
  forzar_creacion: false
})

const formCierre = ref({
  pin: '',
  horometro_cierre: 0,
  horometro_chasis_cierre: 0,
  odometro_cierre: 0,
  observacion_final: '',
  estado_equipo_resultante: 'OPERATIVO',
  checklist_liberacion_ok: true,
  protocolo: {
    niveles_y_fugas_ok: true,
    torque_y_guardas_ok: true,
    retiro_loto_y_limpieza_ok: true,
    prueba_funcional_ok: true,
    sistemas_seguridad_ok: true
  }
})

// Fotos de Salida OT (Inspección Post-Servicio)
const fotosSalidaWeb = ref([])
const subiendoFotoSalidaWeb = ref(false)
const inputFotoSalidaRef = ref(null)

// Nuevo Aviso de Avería Web (SPEC-097 §3.4)
const showNuevoAvisoModal = ref(false)
const guardandoAvisoWeb = ref(false)
const nuevoAvisoError = ref('')
const formNuevoAviso = ref({
  id_equipo: null,
  criticidad: 'PARADA_MAQUINA',
  horometro: 0,
  descripcion: ''
})
const fotosAvisoWeb = ref([])
const subiendoFotoAvisoWeb = ref(false)
const inputFotoAvisoRef = ref(null)

const protocoloSalidaGuardadoObj = computed(() => {
  const raw = selectedOt.value?.cierre?.checklist_liberacion
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
})

const itemsProtocoloSalidaVista = computed(() => {
  const p = protocoloSalidaGuardadoObj.value?.protocolo || formCierre.value.protocolo
  const isCerrada = selectedOt.value?.ot?.estado === 'CERRADA'
  return [
    { label: '1. Niveles de fluidos verificados y sin fugas activas tras presurizar', ok: isCerrada ? (p?.niveles_y_fugas_ok ?? true) : Boolean(p?.niveles_y_fugas_ok) },
    { label: '2. Torque de pernos intervenidos verificado y guardas reinstaladas', ok: isCerrada ? (p?.torque_y_guardas_ok ?? true) : Boolean(p?.torque_y_guardas_ok) },
    { label: '3. Retiro de bloqueo LOTO / cuñas y orden/limpieza general del equipo', ok: isCerrada ? (p?.retiro_loto_y_limpieza_ok ?? true) : Boolean(p?.retiro_loto_y_limpieza_ok) },
    { label: '4. Prueba funcional en vacío conforme (frenos, dirección, giro, pluma)', ok: isCerrada ? (p?.prueba_funcional_ok ?? true) : Boolean(p?.prueba_funcional_ok) },
    { label: '5. Sistemas de seguridad operativos (LMI/PAT, fin de carrera, luces)', ok: isCerrada ? (p?.sistemas_seguridad_ok ?? true) : Boolean(p?.sistemas_seguridad_ok) }
  ]
})

const fotosSalidaGuardadasVista = computed(() => {
  const guardadas = protocoloSalidaGuardadoObj.value?.fotos_salida
  if (Array.isArray(guardadas) && guardadas.length > 0) return guardadas
  return fotosSalidaWeb.value
})

const formActividad = ref({ descripcion: '', horas_estimadas: 1.0 })
const formHh = ref({ tecnico_nombre: '', descripcion_trabajo: '', horas: 2.0 })
const formMaterial = ref({ descripcion: '', cantidad: 1, unidad: 'UN', costo_unitario: 0 })
const formServicio = ref({ proveedor: '', numero_documento_compra: '', descripcion_servicio: '', costo: 0 })
const formHallazgo = ref({ criticidad: 'C3', sistema: 'HID', componente: '', descripcion: '', afecta_izaje: false })

// Estado Modelo Híbrido de Materiales (WMS vs Compra Directa)
const modoInsumoWeb = ref('wms')
const busquedaProductoWeb = ref('')
const cargandoProductosWeb = ref(false)
const sugerenciasProductosWeb = ref([])
const productoSeleccionadoWeb = ref(null)

const formMaterialWebWms = ref({
  cantidad: 1
})

const formMaterialWebCompra = ref({
  descripcion: '',
  cantidad: 1,
  unidad: 'UN',
  costo_unitario: 0,
  numero_documento_compra: ''
})

const abrirModalNuevoRepuestoWeb = () => {
  modoInsumoWeb.value = 'wms'
  busquedaProductoWeb.value = ''
  sugerenciasProductosWeb.value = []
  productoSeleccionadoWeb.value = null
  formMaterialWebWms.value.cantidad = 1
  formMaterialWebCompra.value = {
    descripcion: '',
    cantidad: 1,
    unidad: 'UN',
    costo_unitario: 0,
    numero_documento_compra: ''
  }
  showNuevoRepuestoModal.value = true
}

let timerBusquedaWeb = null
const onBuscarProductoWeb = () => {
  clearTimeout(timerBusquedaWeb)
  timerBusquedaWeb = setTimeout(async () => {
    const q = busquedaProductoWeb.value.trim()
    if (!q) {
      sugerenciasProductosWeb.value = []
      return
    }
    cargandoProductosWeb.value = true
    try {
      const res = await apiAxios.get('/inventario/productos', { params: { search: q } })
      const data = res.data?.data || res.data || []
      sugerenciasProductosWeb.value = Array.isArray(data) ? data : []
    } catch (e) {
      console.error('Error buscando productos WMS:', e)
      sugerenciasProductosWeb.value = []
    } finally {
      cargandoProductosWeb.value = false
    }
  }, 250)
}

const seleccionarProductoWeb = (p) => {
  productoSeleccionadoWeb.value = p
  busquedaProductoWeb.value = `${p.sku} - ${p.nombre}`
  sugerenciasProductosWeb.value = []
  formMaterialWebWms.value.cantidad = 1
}

const limpiarProductoSeleccionadoWeb = () => {
  productoSeleccionadoWeb.value = null
  busquedaProductoWeb.value = ''
  sugerenciasProductosWeb.value = []
}

const recargarSelectedOt = async () => {
  if (!selectedOt.value?.ot?.id_ot) return
  try {
    const currentTab = activeOtSubTab.value
    const res = await apiAxios.get(`/mantenimiento/ots/${selectedOt.value.ot.id_ot}`)
    if (res.data?.success && res.data?.data) {
      selectedOt.value = res.data.data
      activeOtSubTab.value = currentTab
    }
  } catch (err) {
    console.error('Error recargando OT seleccionada:', err)
  }
}

const formatCantidad = (val) => {
  const n = Number(val || 0)
  return Number.isInteger(n) ? n.toString() : n.toLocaleString('es-CL', { maximumFractionDigits: 2 })
}

const costoAcumuladoOtSeleccionada = computed(() => {
  if (!selectedOt.value) return 0
  const hhTotal = (selectedOt.value.mano_obra || []).reduce((acc, h) => {
    const sub = Number(h.costo_calculado || h.costo_total || (Number(h.horas || h.horas_reales || 0) * (Number(h.tarifa || h.tarifa_hora || 15000))) || 0)
    return acc + sub
  }, 0)
  const matTotal = (selectedOt.value.repuestos_manuales || selectedOt.value.materiales || []).reduce((acc, m) => {
    return acc + Number(m.costo_total || 0)
  }, 0)
  const servTotal = (selectedOt.value.servicios_externos || []).reduce((acc, s) => {
    return acc + Number(s.costo_total || s.costo || 0)
  }, 0)
  const sumaLocal = hhTotal + matTotal + servTotal
  const backendTotal = Number(selectedOt.value.ot?.costo_total_calculado || selectedOt.value.ot?.costo_total || 0)
  return Math.max(sumaLocal, backendTotal)
})

// Computed
const filteredOts = computed(() => {
  return otsStore.value.filter(ot => {
    const q = searchQuery.value.toLowerCase()
    const matchSearch = !q ||
      String(ot.numero_ot || ot.folio || '').toLowerCase().includes(q) ||
      String(ot.patente || '').toLowerCase().includes(q) ||
      String(ot.descripcion_falla || ot.falla_reportada || '').toLowerCase().includes(q)
    
    const matchEstado = !filterEstado.value || ot.estado === filterEstado.value
    const matchTipo = !filterTipo.value || ot.tipo_mantenimiento === filterTipo.value
    const matchPrioridad = !filterPrioridad.value || String(ot.prioridad) === String(filterPrioridad.value)

    return matchSearch && matchEstado && matchTipo && matchPrioridad
  })
})

const alertasCriticas = computed(() => {
  const alertas = []

  // Avisos de Falla / Avería Pendientes de Terreno
  const avisosPendientes = avisosAveria.value.filter(a => a.estado === 'PENDIENTE')
  if (avisosPendientes.length > 0) {
    const hayParada = avisosPendientes.some(a => a.criticidad === 'PARADA_MAQUINA')
    alertas.push({
      tipo: hayParada ? 'ROJO' : 'AMARILLO',
      titulo: hayParada ? '🚨 ALERTA: PARADA DE MÁQUINA EN TERRENO' : '⚠️ Avisos de Avería Pendientes',
      mensaje: `Existen ${avisosPendientes.length} aviso(s) de falla reportados desde terreno pendientes de atención técnica o conversión a OT.`,
      accion: true,
      accionTexto: 'Atender Aviso ➔',
      accionPayload: { tab: 'avisos' }
    })
  }

  // OTs P1 abiertas
  const p1 = otsStore.value.filter(o => o.prioridad === 1 && o.estado !== 'CERRADA' && o.estado !== 'ANULADA')
  if (p1.length > 0) {
    alertas.push({
      tipo: 'ROJO',
      titulo: 'OTs de Emergencia (P1)',
      mensaje: `Existen ${p1.length} orden(es) de trabajo con prioridad de parada de máquina.`,
      accion: true,
      accionTexto: 'Ver P1',
      accionPayload: { tab: 'ots', prioridad: '1' }
    })
  }

  // Hallazgos C1 abiertos
  const c1 = hallazgosList.value.filter(h => h.criticidad === 'C1' && (h.estado === 'ABIERTO' || h.estado === 'EN_GESTION'))
  if (c1.length > 0) {
    alertas.push({
      tipo: 'ROJO',
      titulo: 'Hallazgos Críticos C1',
      mensaje: `Existen ${c1.length} anomalía(s) crítica(s) de izaje sin resolver.`,
      accion: true,
      accionTexto: 'Ver Hallazgos',
      accionPayload: { tab: 'hallazgos' }
    })
  }

  // OTs envejecidas (> 7 días)
  const aging = Number(kpisData.value?.ots_envejecidas_count || 0)
  if (aging > 0) {
    alertas.push({
      tipo: 'AMARILLO',
      titulo: 'Envejecimiento de OTs',
      mensaje: `${aging} orden(es) llevan más de 7 días abiertas sin concluir.`,
      accion: true,
      accionTexto: 'Revisar',
      accionPayload: { tab: 'ots' }
    })
  }

  return alertas
})

const totalHhImputadas = computed(() => {
  if (!selectedOt.value?.mano_obra) return 0
  return selectedOt.value.mano_obra.reduce((acc, h) => acc + Number(h.horas_reales || h.horas || 0), 0)
})

const totalCostoMateriales = computed(() => {
  if (!selectedOt.value?.repuestos_manuales) return 0
  return selectedOt.value.repuestos_manuales.reduce((acc, r) => acc + Number(r.costo_total || 0), 0)
})

const totalCostoServicios = computed(() => {
  if (!selectedOt.value?.servicios_externos) return 0
  return selectedOt.value.servicios_externos.reduce((acc, s) => acc + Number(s.costo || 0), 0)
})

const formatClp = (val) => {
  const num = Math.round(Number(val || 0))
  return num.toLocaleString('es-CL')
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}

const formatTimeOnly = (dateStr) => {
  if (!dateStr) return '--:--'
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return '--:--'
  }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    const fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${fecha} ${hora}`
  } catch {
    return dateStr
  }
}

const calcularDuracionOt = (ot) => {
  if (!ot) return '-'
  const inicioRaw = ot.fecha_hora_detencion || ot.fecha_creacion || ot.fecha_programada
  if (!inicioRaw) return '-'
  const inicioMs = new Date(inicioRaw).getTime()
  const finMs = (ot.estado === 'CERRADA' && ot.fecha_cierre) ? new Date(ot.fecha_cierre).getTime() : Date.now()
  if (isNaN(inicioMs) || isNaN(finMs) || finMs < inicioMs) return '0h 0m'
  const diffMin = Math.floor((finMs - inicioMs) / 60000)
  const dias = Math.floor(diffMin / 1440)
  const horas = Math.floor((diffMin % 1440) / 60)
  const mins = diffMin % 60
  if (dias > 0) return `${dias}d ${horas}h`
  return `${horas}h ${mins}m`
}

const cambiarEstadoOtRapido = async (nuevoEstado) => {
  const idOt = selectedOt.value?.ot?.id_ot
  if (!idOt || !nuevoEstado || nuevoEstado === selectedOt.value?.ot?.estado) return
  try {
    const res = await apiAxios.put(`/mantenimiento/ots/${idOt}/estado`, {
      nuevo_estado: nuevoEstado,
      motivo: `Cambio de estado rápido desde consola a ${nuevoEstado}`
    })
    if (res.data?.success) {
      mostrarToast(`Estado de OT actualizado a ${nuevoEstado.replace(/_/g, ' ')}`, 'success')
      await fetchRealData()
      await abrirDetalleOt({ id_ot: idOt })
    }
  } catch (err) {
    console.error('Error cambiando estado de OT:', err)
    mostrarToast(err.response?.data?.error || 'No se pudo actualizar el estado de la OT', 'error')
    await abrirDetalleOt({ id_ot: idOt })
  }
}

// Carga de Datos desde Backend Real
const fetchRealData = async () => {
  loadingData.value = true
  try {
    const [kpiRes, radarRes, otsRes, aviRes, halRes, parRes, tecRes] = await Promise.all([
      apiAxios.get('/mantenimiento/kpis').catch(() => ({ data: { data: null } })),
      apiAxios.get('/mantenimiento/flota/radar').catch(() => ({ data: { data: [] } })),
      apiAxios.get('/mantenimiento/ots').catch(() => ({ data: { data: [] } })),
      apiAxios.get('/mantenimiento/avisos').catch(() => ({ data: { data: [] } })),
      apiAxios.get('/mantenimiento/hallazgos').catch(() => ({ data: { data: [] } })),
      apiAxios.get('/mantenimiento/parametros').catch(() => ({ data: { data: [] } })),
      apiAxios.get('/mantenimiento/tecnicos').catch(() => ({ data: { data: [] } }))
    ])

    if (kpiRes.data?.data) kpisData.value = kpiRes.data.data
    if (Array.isArray(radarRes.data?.data)) flotaEquipos.value = radarRes.data.data
    if (Array.isArray(otsRes.data?.data)) otsStore.value = otsRes.data.data
    if (Array.isArray(aviRes.data?.data)) avisosAveria.value = aviRes.data.data
    if (Array.isArray(halRes.data?.data)) hallazgosList.value = halRes.data.data
    if (parRes.data?.data) {
      const pData = parRes.data.data
      parametrosStore.value = Array.isArray(pData) ? pData : (pData.raw || [])
      const p = pData.map || {}
      if (p.pm_intervalo_base_horas !== undefined && p.pm_intervalo_base_horas !== null) parametrosForm.value.pm_intervalo_base_horas = Number(p.pm_intervalo_base_horas)
      if (p.pm_ventana_alerta_horas !== undefined && p.pm_ventana_alerta_horas !== null) parametrosForm.value.pm_ventana_alerta_horas = Number(p.pm_ventana_alerta_horas)
      if (p.pm_intervalo_odometro_km !== undefined && p.pm_intervalo_odometro_km !== null) parametrosForm.value.pm_intervalo_odometro_km = Number(p.pm_intervalo_odometro_km)
      if (p.tarifa_hh_default !== undefined && p.tarifa_hh_default !== null) parametrosForm.value.tarifa_hh_default = Number(p.tarifa_hh_default)
      if (p.umbral_costo_ot_clp !== undefined && p.umbral_costo_ot_clp !== null) parametrosForm.value.umbral_costo_ot_clp = Number(p.umbral_costo_ot_clp)
      if (p.cert_alerta_dias !== undefined && p.cert_alerta_dias !== null) parametrosForm.value.cert_alerta_dias = Number(p.cert_alerta_dias)
    }
    if (Array.isArray(tecRes.data?.data)) listaTecnicos.value = tecRes.data.data

  } catch (err) {
    console.error('Error cargando datos de mantenimiento:', err)
  } finally {
    loadingData.value = false
  }
}

// Navegación & Acciones
const verHojaVida = (idEquipo) => {
  router.push(`/mantenimiento/equipo/${idEquipo}`)
}

const abrirModalNuevaOt = (equipo = null) => {
  nuevaOtError.value = ''
  alertaEquipoConOt.value = ''
  
  const ahora = new Date()
  const tzOffset = ahora.getTimezoneOffset() * 60000
  const localIso = new Date(ahora.getTime() - tzOffset).toISOString().slice(0, 16)

  if (equipo) {
    formNuevaOt.value.id_equipo = equipo.id_equipo
    formNuevaOt.value.patente = equipo.patente
    formNuevaOt.value.horometro_inicio = Number(equipo.horometro_actual || 0)
    if (equipo.ot_activa_folio) {
      alertaEquipoConOt.value = equipo.ot_activa_folio
    }
  } else {
    formNuevaOt.value.id_equipo = null
    formNuevaOt.value.patente = ''
    formNuevaOt.value.horometro_inicio = 0
  }
  formNuevaOt.value.id_tecnico_responsable = null
  formNuevaOt.value.fecha_programada = localIso
  formNuevaOt.value.observaciones = ''
  showNuevaOtModal.value = true
}

const alSeleccionarEquipoModal = () => {
  const eq = flotaEquipos.value.find(e => e.id_equipo === formNuevaOt.value.id_equipo)
  if (eq) {
    formNuevaOt.value.patente = eq.patente
    formNuevaOt.value.horometro_inicio = Number(eq.horometro_actual || 0)
    alertaEquipoConOt.value = eq.ot_activa_folio || ''
  }
}

const submitNuevaOt = async () => {
  nuevaOtError.value = ''
  if (!formNuevaOt.value.id_equipo) {
    nuevaOtError.value = 'Debe seleccionar una grúa de la flota.'
    return
  }
  if (!formNuevaOt.value.id_tecnico_responsable) {
    nuevaOtError.value = 'Debe asignar un mecánico responsable para la orden de trabajo.'
    return
  }

  const eqSel = flotaEquipos.value.find(e => e.id_equipo === formNuevaOt.value.id_equipo)
  const minHoroActual = Number(eqSel?.horometro_actual || 0)
  if (minHoroActual > 0 && Number(formNuevaOt.value.horometro_inicio || 0) < minHoroActual) {
    nuevaOtError.value = `El horómetro de ingreso (${formNuevaOt.value.horometro_inicio} hrs) no puede ser menor al horómetro acumulado del equipo (${minHoroActual} hrs).`
    return
  }

  if (creandoOt.value) return
  creandoOt.value = true

  try {
    const payload = {
      id_equipo: formNuevaOt.value.id_equipo,
      tipo_mantenimiento: formNuevaOt.value.tipo_mantenimiento,
      codigo_pauta: formNuevaOt.value.tipo_mantenimiento === 'PREVENTIVO' ? formNuevaOt.value.codigo_pauta : null,
      prioridad: formNuevaOt.value.prioridad,
      horometro_inicio: formNuevaOt.value.horometro_inicio,
      descripcion_falla: formNuevaOt.value.descripcion_falla || 'Mantenimiento preventivo programado',
      id_tecnico_responsable: formNuevaOt.value.id_tecnico_responsable,
      fecha_programada: formNuevaOt.value.fecha_programada || new Date(),
      observaciones: formNuevaOt.value.observaciones || null,
      forzar_creacion: formNuevaOt.value.forzar_creacion
    }

    const res = await apiAxios.post('/mantenimiento/ots', payload)
    if (res.data?.success) {
      showNuevaOtModal.value = false
      await fetchRealData()
      activeMainTab.value = 'ots'
    }
  } catch (err) {
    nuevaOtError.value = err.response?.data?.error || err.message
  } finally {
    creandoOt.value = false
  }
}

const abrirDetalleOt = async (ot) => {
  try {
    const res = await apiAxios.get(`/mantenimiento/ots/${ot.id_ot}`)
    if (res.data?.success && res.data?.data) {
      selectedOt.value = res.data.data
      activeOtSubTab.value = 'actividades'

      const dataOt = res.data.data.ot || {}
      formMedidoresWeb.value = {
        horometro_grua_inicio: Number(dataOt.horometro_grua_inicio || dataOt.horometro_inicio || 0),
        horometro_chasis_inicio: Number(dataOt.horometro_chasis_inicio || 0),
        odometro_inicio: Number(dataOt.odometro_inicio || 0)
      }

      // Cargar fotos 360 desde backend si existen, o desde localStorage
      let f360Web = dataOt.fotos_recepcion_360
      if (typeof f360Web === 'string') {
        try { f360Web = JSON.parse(f360Web) } catch (e) { f360Web = {} }
      }
      if (f360Web && typeof f360Web === 'object' && Object.keys(f360Web).length > 0) {
        fotos360Web.value = { ...f360Web }
      } else {
        try {
          const cached = localStorage.getItem(`gsp_web_ot_${ot.id_ot}_fotos360`)
          fotos360Web.value = cached ? JSON.parse(cached) : {}
        } catch (e) {
          fotos360Web.value = {}
        }
      }
    }
  } catch (err) {
    console.error('Error cargando detalle de OT:', err)
  }
}

const guardarMedidoresInicioWeb = async () => {
  if (!selectedOt.value?.ot?.id_ot) return
  const otActual = selectedOt.value.ot
  const minGrua = Number(otActual.horometro_grua_inicio || otActual.horometro_inicio || 0)
  const minChasis = Number(otActual.horometro_chasis_inicio || 0)
  const minOdo = Number(otActual.odometro_inicio || 0)

  if (minGrua > 0 && Number(formMedidoresWeb.value.horometro_grua_inicio || 0) < minGrua) {
    mostrarToast(`El horómetro de grúa (${formMedidoresWeb.value.horometro_grua_inicio} hrs) no puede ser menor al registrado (${minGrua} hrs).`, 'error')
    return
  }
  if (minChasis > 0 && Number(formMedidoresWeb.value.horometro_chasis_inicio || 0) < minChasis) {
    mostrarToast(`El horómetro de chasis (${formMedidoresWeb.value.horometro_chasis_inicio} hrs) no puede ser menor al registrado (${minChasis} hrs).`, 'error')
    return
  }
  if (minOdo > 0 && Number(formMedidoresWeb.value.odometro_inicio || 0) < minOdo) {
    mostrarToast(`El odómetro de entrada (${formMedidoresWeb.value.odometro_inicio} km) no puede ser menor al registrado (${minOdo} km).`, 'error')
    return
  }

  guardandoMedidoresWeb.value = true
  try {
    const id = selectedOt.value.ot.id_ot
    const res = await apiAxios.put(`/mantenimiento/ots/${id}/medidores-inicio`, formMedidoresWeb.value)
    if (res.data?.success) {
      if (selectedOt.value.ot) {
        selectedOt.value.ot.horometro_inicio = formMedidoresWeb.value.horometro_grua_inicio
        selectedOt.value.ot.horometro_grua_inicio = formMedidoresWeb.value.horometro_grua_inicio
        selectedOt.value.ot.horometro_chasis_inicio = formMedidoresWeb.value.horometro_chasis_inicio
        selectedOt.value.ot.odometro_inicio = formMedidoresWeb.value.odometro_inicio
      }
      mostrarToast('¡Medidores de entrada actualizados correctamente!', 'success')
    }
  } catch (err) {
    console.error('Error al guardar medidores de entrada:', err)
    mostrarToast(err.response?.data?.error || err.message || 'Error al guardar medidores', 'error')
  } finally {
    guardandoMedidoresWeb.value = false
  }
}

const dispararCaptura360Web = (slotKey) => {
  slot360WebActivo.value = slotKey
  if (inputWebFoto360Ref.value) {
    inputWebFoto360Ref.value.value = ''
    inputWebFoto360Ref.value.click()
  }
}

const alSeleccionarFoto360Web = async (event) => {
  const file = event.target.files?.[0]
  if (!file || !slot360WebActivo.value || !selectedOt.value?.ot?.id_ot) return
  const slotKey = slot360WebActivo.value
  const idOt = selectedOt.value.ot.id_ot

  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'mantenimiento')
    formData.append('tipo_doc', `FOTO_360_${slotKey.toUpperCase()}`)
    formData.append('mimetype', file.type || 'image/jpeg')
    formData.append('name_doc_orig', file.name || `360_${slotKey}_${Date.now()}.jpg`)
    formData.append('estado', 'A')

    const uploadRes = await apiAxios.post('/v1/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const idDoc = uploadRes.data?.data?.id_doc
    const urlFoto = uploadRes.data?.data?.url_view || (idDoc ? `/api/v1/storage/view/${idDoc}` : null)

    if (urlFoto || idDoc) {
      fotos360Web.value = {
        ...fotos360Web.value,
        [slotKey]: {
          id_doc: idDoc,
          url: urlFoto,
          fecha: new Date().toISOString()
        }
      }
      localStorage.setItem(`gsp_web_ot_${idOt}_fotos360`, JSON.stringify(fotos360Web.value))

      // Sincronizar en DB servidor
      await apiAxios.post(`/mantenimiento/ots/${idOt}/fotos-360`, {
        posicion: slotKey,
        id_doc: idDoc,
        url: urlFoto
      }).catch(err => console.warn('Advertencia sync foto 360:', err))
    }
  } catch (err) {
    console.error('Error subiendo foto 360:', err)
    mostrarToast('Error al subir la fotografía. Verifique la conexión.', 'error')
  } finally {
    slot360WebActivo.value = null
  }
}

const eliminarFoto360Web = async (slotKey) => {
  if (!selectedOt.value?.ot?.id_ot) return
  if (confirm(`¿Desea eliminar la fotografía de ${slotKey}?`)) {
    const idOt = selectedOt.value.ot.id_ot
    delete fotos360Web.value[slotKey]
    localStorage.setItem(`gsp_web_ot_${idOt}_fotos360`, JSON.stringify(fotos360Web.value))
    await apiAxios.delete(`/mantenimiento/ots/${idOt}/fotos-360/${slotKey}`).catch(err => console.warn('Advertencia delete foto 360:', err))
  }
}

const cerrarDetalleOt = () => {
  selectedOt.value = null
  fetchRealData()
}

const toggleActividad = async (act) => {
  const nuevoEstado = act.estado === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA'
  act.estado = nuevoEstado

  try {
    await apiAxios.put(`/mantenimiento/actividades/${act.id_actividad}/estado`, {
      estado: nuevoEstado,
      observacion_tecnico: 'Actualizado desde Consola Enterprise'
    })
  } catch (err) {
    console.error('Error actualizando actividad:', err)
  }
}

const toggleCajaComentarioWeb = (idActividad) => {
  cajaComentarioWebAbierta.value[idActividad] = !cajaComentarioWebAbierta.value[idActividad]
}

const formatHoraWeb = (fechaStr) => {
  if (!fechaStr) return ''
  try {
    const d = new Date(fechaStr)
    return d.toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return fechaStr
  }
}

const abrirPreviewFotoWeb = (url) => {
  previewFotoUrlWeb.value = url
  mostrarModalPreviewFotoWeb.value = true
}

const eliminarFotoWeb = async (act, f) => {
  const idFoto = f.id_foto || f.id_doc
  if (!idFoto) return
  if (!confirm('¿Desea eliminar esta fotografía?')) return
  try {
    const res = await apiAxios.delete(`/mantenimiento/actividades/${act.id_actividad}/fotos/${idFoto}`)
    if (res.data?.success) {
      act.fotos = act.fotos.filter(x => (x.id_foto || x.id_doc) !== idFoto)
    }
  } catch (err) {
    console.error('Error eliminando foto en consola web:', err)
    mostrarToast('No se pudo eliminar la fotografía.', 'error')
  }
}

const dispararFotoWeb = (act) => {
  actividadObjetivoFotoWeb.value = act
  if (inputWebFotoRef.value) {
    inputWebFotoRef.value.value = ''
    inputWebFotoRef.value.click()
  }
}

const alSeleccionarFotoWeb = async (e) => {
  const file = e.target.files?.[0]
  if (!file || !actividadObjetivoFotoWeb.value) return

  const targetAct = actividadObjetivoFotoWeb.value
  const idAct = targetAct.id_actividad
  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'mantenimiento')
    formData.append('tipo_doc', 'EVIDENCIA_MNT')
    formData.append('mimetype', file.type || 'image/jpeg')
    formData.append('name_doc_orig', file.name || `evidencia_web_${Date.now()}.jpg`)
    formData.append('estado', 'A')

    const uploadRes = await apiAxios.post('/v1/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const idDoc = uploadRes.data?.data?.id_doc
    const urlFoto = uploadRes.data?.data?.url_view || (idDoc ? `/api/v1/storage/view/${idDoc}` : null)

    if (idDoc || urlFoto) {
      const fotoRes = await apiAxios.post(`/mantenimiento/actividades/${idAct}/fotos`, {
        url: urlFoto,
        id_doc: idDoc,
        descripcion: 'Evidencia adjuntada desde Consola Web'
      })

      if (fotoRes.data?.success && fotoRes.data?.data?.foto) {
        if (!targetAct.fotos) targetAct.fotos = []
        targetAct.fotos.push(fotoRes.data.data.foto)
      }
    }
  } catch (err) {
    console.error('Error subiendo foto en consola web:', err)
    mostrarToast('No se pudo subir la fotografía. Reintente.', 'error')
  } finally {
    actividadObjetivoFotoWeb.value = null
  }
}

const enviarComentarioWeb = async (act) => {
  const idAct = act.id_actividad
  const texto = nuevoComentarioWebTexto.value[idAct]?.trim()
  if (!texto) return

  guardandoComentarioWeb.value[idAct] = true
  try {
    const res = await apiAxios.post(`/mantenimiento/actividades/${idAct}/comentarios`, {
      texto
    })
    if (res.data?.success && res.data?.data?.comentario) {
      if (!act.comentarios) act.comentarios = []
      act.comentarios.push(res.data.data.comentario)
      nuevoComentarioWebTexto.value[idAct] = ''
      cajaComentarioWebAbierta.value[idAct] = false
    }
  } catch (err) {
    console.error('Error publicando comentario en consola web:', err)
    mostrarToast('No se pudo publicar el comentario.', 'error')
  } finally {
    guardandoComentarioWeb.value[idAct] = false
  }
}

const guardarActividad = async () => {
  if (!formActividad.value.descripcion || !selectedOt.value) return
  try {
    const res = await apiAxios.post(`/mantenimiento/ots/${selectedOt.value.ot.id_ot}/actividades`, {
      descripcion: formActividad.value.descripcion,
      horas_estimadas: formActividad.value.horas_estimadas
    })
    if (res.data?.success && res.data?.data) {
      selectedOt.value.actividades.push(res.data.data)
      showNuevaActividadModal.value = false
      formActividad.value = { descripcion: '', horas_estimadas: 1.0 }
    }
  } catch (err) {
    console.error('Error guardando actividad:', err)
  }
}

const guardarHh = async () => {
  if (!selectedOt.value) return
  if (!formHh.value.descripcion_trabajo?.trim()) {
    alert('Indique la descripción del trabajo realizado.')
    return
  }
  if (tecnicosSeleccionadosHh.value.length === 0) {
    alert('Seleccione al menos un técnico para imputar mano de obra.')
    return
  }
  const conHorasInvalidas = tecnicosSeleccionadosHh.value.some(t => !t.horas || Number(t.horas) <= 0)
  if (conHorasInvalidas) {
    alert('Todos los mecánicos seleccionados deben tener una cantidad de horas válida mayor a 0.')
    return
  }

  try {
    const res = await apiAxios.post(`/mantenimiento/ots/${selectedOt.value.ot.id_ot}/hh`, {
      descripcion_trabajo: formHh.value.descripcion_trabajo.trim(),
      tecnicos: tecnicosSeleccionadosHh.value.map(t => ({
        id_tecnico: t.id_user,
        nombre_tecnico: t.nombre_completo,
        rut_tecnico: t.rut,
        horas: Number(t.horas)
      }))
    })
    if (res.data?.success) {
      showNuevaHhModal.value = false
      tecnicosSeleccionadosHh.value = []
      formHh.value = { descripcion_trabajo: '', horas: 2.0 }
      await recargarSelectedOt()
      mostrarToast('Mano de obra imputada exitosamente.')
    }
  } catch (err) {
    console.error('Error registrando HH:', err)
    alert(err.response?.data?.error || err.message)
  }
}

const guardarMaterialWeb = async () => {
  if (!selectedOt.value?.ot?.id_ot) return

  if (modoInsumoWeb.value === 'wms') {
    if (!productoSeleccionadoWeb.value) {
      mostrarToast('Por favor seleccione un producto del catálogo WMS.', 'error')
      return
    }
    const p = productoSeleccionadoWeb.value
    const cant = Number(formMaterialWebWms.value.cantidad)
    if (!cant || cant <= 0) {
      mostrarToast('Ingrese una cantidad válida mayor a 0.', 'error')
      return
    }
    const payload = {
      id_producto: p.id || p.id_producto,
      descripcion_material: `${p.nombre} [${p.sku}]`,
      cantidad: cant,
      unidad_medida: p.uom || p.unidad_medida_base || 'UN',
      costo_unitario: Number(p.costo_pmp_vigente || p.pmp || 0),
      origen_insumo: 'BODEGA_WMS',
      sku: p.sku
    }

    try {
      const res = await apiAxios.post(`/mantenimiento/ots/${selectedOt.value.ot.id_ot}/materiales`, payload)
      if (res.data?.success) {
        showNuevoRepuestoModal.value = false
        limpiarProductoSeleccionadoWeb()
        mostrarToast('Insumo WMS asignado correctamente a la OT', 'success')
        await recargarSelectedOt()
      }
    } catch (err) {
      mostrarToast(err.response?.data?.error || err.message || 'Error registrando material desde WMS', 'error')
    }
  } else {
    // Compra directa
    if (!formMaterialWebCompra.value.descripcion?.trim()) {
      mostrarToast('Indique la descripción del material o repuesto.', 'error')
      return
    }
    const cant = Number(formMaterialWebCompra.value.cantidad)
    if (!cant || cant <= 0) {
      mostrarToast('Ingrese una cantidad válida mayor a 0.', 'error')
      return
    }
    const payload = {
      descripcion_material: formMaterialWebCompra.value.descripcion.trim(),
      cantidad: cant,
      unidad_medida: formMaterialWebCompra.value.unidad || 'UN',
      costo_unitario: Number(formMaterialWebCompra.value.costo_unitario || 0),
      origen_insumo: 'COMPRA_DIRECTA',
      numero_documento_compra: formMaterialWebCompra.value.numero_documento_compra?.trim() || null,
      proveedor_o_documento: formMaterialWebCompra.value.numero_documento_compra?.trim() || null
    }

    try {
      const res = await apiAxios.post(`/mantenimiento/ots/${selectedOt.value.ot.id_ot}/materiales`, payload)
      if (res.data?.success) {
        showNuevoRepuestoModal.value = false
        formMaterialWebCompra.value = {
          descripcion: '',
          cantidad: 1,
          unidad: 'UN',
          costo_unitario: 0,
          numero_documento_compra: ''
        }
        mostrarToast('Compra directa registrada en la OT', 'success')
        await recargarSelectedOt()
      }
    } catch (err) {
      mostrarToast(err.response?.data?.error || err.message || 'Error registrando compra directa', 'error')
    }
  }
}

const guardarMaterial = guardarMaterialWeb

const guardarServicio = async () => {
  if (!selectedOt.value) return
  try {
    const res = await apiAxios.post(`/mantenimiento/ots/${selectedOt.value.ot.id_ot}/servicios-externos`, {
      proveedor: formServicio.value.proveedor,
      numero_documento_compra: formServicio.value.numero_documento_compra,
      descripcion_servicio: formServicio.value.descripcion_servicio,
      costo: formServicio.value.costo
    })
    if (res.data?.success && res.data?.data) {
      selectedOt.value.servicios_externos.push(res.data.data)
      showNuevoServicioModal.value = false
      formServicio.value = { proveedor: '', numero_documento_compra: '', descripcion_servicio: '', costo: 0 }
    }
  } catch (err) {
    console.error('Error registrando servicio externo:', err)
  }
}

const guardarHallazgo = async () => {
  if (!selectedOt.value) return
  try {
    const res = await apiAxios.post('/mantenimiento/hallazgos', {
      id_ot: selectedOt.value.ot.id_ot,
      id_equipo: selectedOt.value.ot.id_equipo,
      criticidad: formHallazgo.value.criticidad,
      sistema: formHallazgo.value.sistema,
      componente: formHallazgo.value.componente,
      descripcion: formHallazgo.value.descripcion,
      afecta_izaje: formHallazgo.value.afecta_izaje,
      fotos: fotosHallazgoWeb.value
    })
    if (res.data?.success && res.data?.data) {
      if (!selectedOt.value.hallazgos) selectedOt.value.hallazgos = []
      selectedOt.value.hallazgos.push(res.data.data)
      showNuevoHallazgoModal.value = false
      fotosHallazgoWeb.value = []
      formHallazgo.value = { criticidad: 'C3', sistema: 'HID', componente: '', descripcion: '', afecta_izaje: false }
      await fetchRealData()
    }
  } catch (err) {
    console.error('Error registrando hallazgo:', err)
  }
}

const dispararFotoHallazgoWeb = () => {
  if (inputFotoHallazgoRef.value) {
    inputFotoHallazgoRef.value.value = ''
    inputFotoHallazgoRef.value.click()
  }
}

const alSeleccionarFotoHallazgoWeb = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  subiendoFotoHallazgoWeb.value = true
  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'mantenimiento')
    formData.append('tipo_doc', 'HALLAZGO_EVIDENCIA')
    formData.append('mimetype', file.type || 'image/jpeg')
    formData.append('name_doc_orig', file.name || `hallazgo_${Date.now()}.jpg`)
    formData.append('estado', 'A')

    const uploadRes = await apiAxios.post('/v1/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const idDoc = uploadRes.data?.data?.id_doc
    const urlFoto = uploadRes.data?.data?.url_view || (idDoc ? `/api/v1/storage/view/${idDoc}` : null)
    if (idDoc || urlFoto) {
      fotosHallazgoWeb.value.push({ id_doc: idDoc, url: urlFoto, nombre: file.name })
    }
  } catch (err) {
    console.error('Error subiendo foto de hallazgo:', err)
    mostrarToast('No se pudo subir la fotografía de hallazgo.', 'error')
  } finally {
    subiendoFotoHallazgoWeb.value = false
  }
}

const eliminarFotoHallazgoWeb = (idx) => {
  fotosHallazgoWeb.value.splice(idx, 1)
}

const abrirModalResolverHallazgo = (h) => {
  hallazgoSeleccionadoParaResolver.value = h
  resolverHallazgoError.value = ''
  formResolverHallazgo.value = {
    decision: h.decision || 'RESUELTO_EN_OT',
    solucion_aplicada: h.solucion_aplicada || ''
  }
  fotosCierreHallazgoWeb.value = Array.isArray(h.fotos_cierre) ? [...h.fotos_cierre] : []
  showResolverHallazgoModal.value = true
}

const dispararFotoCierreHallazgoWeb = () => {
  if (inputFotoCierreHallazgoRef.value) {
    inputFotoCierreHallazgoRef.value.value = ''
    inputFotoCierreHallazgoRef.value.click()
  }
}

const alSeleccionarFotoCierreHallazgoWeb = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  subiendoFotoCierreWeb.value = true
  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'mantenimiento')
    formData.append('tipo_doc', 'HALLAZGO_RESOLUCION')
    formData.append('mimetype', file.type || 'image/jpeg')
    formData.append('name_doc_orig', file.name || `resolucion_${Date.now()}.jpg`)
    formData.append('estado', 'A')

    const uploadRes = await apiAxios.post('/v1/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const idDoc = uploadRes.data?.data?.id_doc
    const urlFoto = uploadRes.data?.data?.url_view || (idDoc ? `/api/v1/storage/view/${idDoc}` : null)
    if (idDoc || urlFoto) {
      fotosCierreHallazgoWeb.value.push({ id_doc: idDoc, url: urlFoto, nombre: file.name })
    }
  } catch (err) {
    console.error('Error subiendo foto de resolución:', err)
    mostrarToast('No se pudo subir la fotografía de resolución.', 'error')
  } finally {
    subiendoFotoCierreWeb.value = false
  }
}

const eliminarFotoCierreHallazgoWeb = (idx) => {
  fotosCierreHallazgoWeb.value.splice(idx, 1)
}

const submitResolverHallazgo = async () => {
  resolverHallazgoError.value = ''
  if (!formResolverHallazgo.value.solucion_aplicada || formResolverHallazgo.value.solucion_aplicada.trim().length < 5) {
    resolverHallazgoError.value = 'Debe detallar la solución aplicada o acción ejecutada (mínimo 5 caracteres).'
    return
  }

  const h = hallazgoSeleccionadoParaResolver.value
  if (!h || !h.id_hallazgo) return

  guardandoResolucion.value = true
  try {
    const res = await apiAxios.put(`/mantenimiento/hallazgos/${h.id_hallazgo}/resolver`, {
      decision: formResolverHallazgo.value.decision,
      solucion_aplicada: formResolverHallazgo.value.solucion_aplicada.trim(),
      fotos_cierre: fotosCierreHallazgoWeb.value
    })

    if (res.data?.success) {
      showResolverHallazgoModal.value = false
      await fetchRealData()
      if (selectedOt.value && selectedOt.value.hallazgos) {
        if (selectedOt.value.ot?.id_ot) {
          await abrirDetalleOt({ id_ot: selectedOt.value.ot.id_ot })
        }
      }
    }
  } catch (err) {
    console.error('Error al resolver hallazgo:', err)
    resolverHallazgoError.value = err.response?.data?.error || err.message || 'Error al resolver el hallazgo'
  } finally {
    guardandoResolucion.value = false
  }
}

const abrirModalCierre = (ot) => {
  cierreError.value = ''
  formCierre.value.pin = ''
  formCierre.value.horometro_cierre = Number(ot.horometro_grua_inicio || ot.horometro_inicio || 0)
  formCierre.value.horometro_chasis_cierre = Number(ot.horometro_chasis_inicio || 0)
  formCierre.value.odometro_cierre = Number(ot.odometro_inicio || 0)
  formCierre.value.observacion_final = 'Mantenimiento ejecutado conforme a pauta y especificaciones del fabricante.'
  formCierre.value.estado_equipo_resultante = 'OPERATIVO'
  formCierre.value.checklist_liberacion_ok = true
  formCierre.value.protocolo = {
    niveles_y_fugas_ok: true,
    torque_y_guardas_ok: true,
    retiro_loto_y_limpieza_ok: true,
    prueba_funcional_ok: true,
    sistemas_seguridad_ok: true
  }
  fotosSalidaWeb.value = []
  showCierreModal.value = true
}

const dispararFotoSalidaWeb = () => {
  if (inputFotoSalidaRef.value) {
    inputFotoSalidaRef.value.value = ''
    inputFotoSalidaRef.value.click()
  }
}

const alSeleccionarFotoSalidaWeb = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  subiendoFotoSalidaWeb.value = true
  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'mantenimiento')
    formData.append('tipo_doc', 'OT_SALIDA_LIBERACION')
    formData.append('mimetype', file.type || 'image/jpeg')
    formData.append('name_doc_orig', file.name || `salida_ot_${Date.now()}.jpg`)
    formData.append('estado', 'A')

    const uploadRes = await apiAxios.post('/v1/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const idDoc = uploadRes.data?.data?.id_doc
    const urlFoto = uploadRes.data?.data?.url_view || (idDoc ? `/api/v1/storage/view/${idDoc}` : null)
    if (idDoc || urlFoto) {
      fotosSalidaWeb.value.push({ id_doc: idDoc, url: urlFoto, nombre: file.name })
    }
  } catch (err) {
    console.error('Error subiendo foto de salida:', err)
    mostrarToast('No se pudo subir la fotografía de salida.', 'error')
  } finally {
    subiendoFotoSalidaWeb.value = false
  }
}

const eliminarFotoSalidaWeb = (idx) => {
  fotosSalidaWeb.value.splice(idx, 1)
}

const confirmarCierre = async () => {
  cierreError.value = ''
  if (!formCierre.value.pin || formCierre.value.pin.length < 4) {
    cierreError.value = 'Debe ingresar el PIN de autorización de 4 dígitos.'
    return
  }

  const p = formCierre.value.protocolo
  const todosPuntosOk = p.niveles_y_fugas_ok && p.torque_y_guardas_ok && p.retiro_loto_y_limpieza_ok && p.prueba_funcional_ok && p.sistemas_seguridad_ok
  if (!todosPuntosOk && formCierre.value.estado_equipo_resultante === 'OPERATIVO') {
    cierreError.value = 'Para liberar el equipo como 100% OPERATIVO debe verificar los 5 puntos del protocolo de inspección de salida.'
    return
  }

  const idOt = selectedOt.value?.ot?.id_ot
  if (!idOt) return

  const otAct = selectedOt.value.ot
  const minGruaCierre = Number(otAct.horometro_grua_inicio || otAct.horometro_inicio || 0)
  const minChasisCierre = Number(otAct.horometro_chasis_inicio || 0)
  const minOdoCierre = Number(otAct.odometro_inicio || 0)

  if (minGruaCierre > 0 && Number(formCierre.value.horometro_cierre || 0) < minGruaCierre) {
    cierreError.value = `El horómetro de grúa al cierre (${formCierre.value.horometro_cierre} hrs) no puede ser menor al de inicio (${minGruaCierre} hrs).`
    return
  }
  if (minChasisCierre > 0 && Number(formCierre.value.horometro_chasis_cierre || 0) < minChasisCierre) {
    cierreError.value = `El horómetro de chasis al cierre (${formCierre.value.horometro_chasis_cierre} hrs) no puede ser menor al de inicio (${minChasisCierre} hrs).`
    return
  }
  if (minOdoCierre > 0 && Number(formCierre.value.odometro_cierre || 0) < minOdoCierre) {
    cierreError.value = `El odómetro de cierre (${formCierre.value.odometro_cierre} km) no puede ser menor al de inicio (${minOdoCierre} km).`
    return
  }

  try {
    const res = await apiAxios.post(`/mantenimiento/ots/${idOt}/cerrar`, {
      pin: formCierre.value.pin,
      horometro_cierre: formCierre.value.horometro_cierre,
      horometro_chasis_cierre: formCierre.value.horometro_chasis_cierre || null,
      odometro_cierre: formCierre.value.odometro_cierre || null,
      observacion_final: formCierre.value.observacion_final,
      diagnostico_final: formCierre.value.observacion_final,
      estado_equipo_resultante: formCierre.value.estado_equipo_resultante,
      checklist_liberacion_ok: todosPuntosOk,
      checklist_liberacion: {
        ok: todosPuntosOk,
        protocolo: { ...formCierre.value.protocolo },
        fotos_salida: fotosSalidaWeb.value
      }
    })

    if (res.data?.success) {
      showCierreModal.value = false
      mostrarToast('Inspección de salida firmada y OT cerrada exitosamente.', 'success')
      await fetchRealData()
      await abrirDetalleOt({ id_ot: idOt })
    }
  } catch (err) {
    cierreError.value = err.response?.data?.error || err.message
  }
}

const abrirModalNuevoAviso = () => {
  nuevoAvisoError.value = ''
  formNuevoAviso.value = {
    id_equipo: null,
    criticidad: 'PARADA_MAQUINA',
    horometro: 0,
    descripcion: ''
  }
  fotosAvisoWeb.value = []
  showNuevoAvisoModal.value = true
}

const alSeleccionarEquipoAvisoWeb = () => {
  const eq = flotaEquipos.value.find(e => e.id_equipo === formNuevoAviso.value.id_equipo)
  if (eq) {
    formNuevoAviso.value.horometro = Number(eq.horometro_actual || 0)
  }
}

const dispararFotoAvisoWeb = () => {
  if (inputFotoAvisoRef.value) {
    inputFotoAvisoRef.value.value = ''
    inputFotoAvisoRef.value.click()
  }
}

const alSeleccionarFotoAvisoWeb = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  subiendoFotoAvisoWeb.value = true
  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'mantenimiento')
    formData.append('tipo_doc', 'AVISO_FALLA')
    formData.append('mimetype', file.type || 'image/jpeg')
    formData.append('name_doc_orig', file.name || `aviso_${Date.now()}.jpg`)
    formData.append('estado', 'A')

    const uploadRes = await apiAxios.post('/v1/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const idDoc = uploadRes.data?.data?.id_doc
    const urlFoto = uploadRes.data?.data?.url_view || (idDoc ? `/api/v1/storage/view/${idDoc}` : null)
    if (idDoc || urlFoto) {
      fotosAvisoWeb.value.push({ id_doc: idDoc, url: urlFoto, nombre: file.name })
    }
  } catch (err) {
    console.error('Error subiendo foto de aviso:', err)
    mostrarToast('No se pudo subir la fotografía del aviso.', 'error')
  } finally {
    subiendoFotoAvisoWeb.value = false
  }
}

const eliminarFotoAvisoWeb = (idx) => {
  fotosAvisoWeb.value.splice(idx, 1)
}

const submitNuevoAvisoWeb = async () => {
  nuevoAvisoError.value = ''
  if (!formNuevoAviso.value.id_equipo) {
    nuevoAvisoError.value = 'Debe seleccionar la grúa o equipo afectado.'
    return
  }
  if (!formNuevoAviso.value.descripcion || formNuevoAviso.value.descripcion.trim().length < 5) {
    nuevoAvisoError.value = 'Debe describir el síntoma o falla detectada (mínimo 5 caracteres).'
    return
  }

  guardandoAvisoWeb.value = true
  try {
    const res = await apiAxios.post('/mantenimiento/avisos', {
      id_equipo: formNuevoAviso.value.id_equipo,
      criticidad: formNuevoAviso.value.criticidad,
      horometro: formNuevoAviso.value.horometro || null,
      descripcion: formNuevoAviso.value.descripcion.trim(),
      fotos: fotosAvisoWeb.value
    })
    if (res.data?.success) {
      showNuevoAvisoModal.value = false
      mostrarToast(`Aviso de avería ${res.data?.data?.folio_aviso || ''} registrado exitosamente.`, 'success')
      await fetchRealData()
      activeMainTab.value = 'avisos'
    }
  } catch (err) {
    nuevoAvisoError.value = err.response?.data?.error || err.message || 'Error al registrar el aviso de avería'
  } finally {
    guardandoAvisoWeb.value = false
  }
}

const convertirAvisoAOt = (aviso) => {
  const eq = flotaEquipos.value.find(e => e.id_equipo === aviso.id_equipo)
  abrirModalNuevaOt(eq)
  formNuevaOt.value.tipo_mantenimiento = 'CORRECTIVO'
  formNuevaOt.value.prioridad = aviso.criticidad === 'PARADA_MAQUINA' ? 1 : 2
  formNuevaOt.value.descripcion_falla = `Originado de Aviso ${aviso.folio_aviso}: ${aviso.descripcion}`
}

const ejecutarAccionAlerta = (alerta) => {
  selectedOt.value = null
  if (alerta.accionPayload?.tab) {
    activeMainTab.value = alerta.accionPayload.tab
    if (alerta.accionPayload.prioridad) {
      filterPrioridad.value = alerta.accionPayload.prioridad
    }
  }
}

const guardarParametrosTaller = async () => {
  guardandoParametros.value = true
  guardarParametrosSuccess.value = false
  guardarParametrosError.value = ''
  try {
    const payload = {
      parametros: {
        pm_intervalo_base_horas: parametrosForm.value.pm_intervalo_base_horas,
        pm_ventana_alerta_horas: parametrosForm.value.pm_ventana_alerta_horas,
        pm_intervalo_odometro_km: parametrosForm.value.pm_intervalo_odometro_km,
        tarifa_hh_default: parametrosForm.value.tarifa_hh_default,
        umbral_costo_ot_clp: parametrosForm.value.umbral_costo_ot_clp,
        cert_alerta_dias: parametrosForm.value.cert_alerta_dias
      }
    }
    const res = await apiAxios.put('/mantenimiento/parametros', payload)
    if (res.data?.success) {
      guardarParametrosSuccess.value = true
      await fetchRealData()
      setTimeout(() => {
        guardarParametrosSuccess.value = false
      }, 5000)
    }
  } catch (err) {
    console.error('Error guardando parámetros de taller:', err)
    guardarParametrosError.value = err.response?.data?.error || err.message || 'Error al guardar los parámetros operacionales'
  } finally {
    guardandoParametros.value = false
  }
}

const isRadarMode = computed(() => route.name === 'radar_flota' || route.meta?.mode === 'radar' || route.path.includes('radar-flota'))
const radarSearchQuery = ref('')
const radarFilterEstado = ref('ALL')

const evaluarEstadoCicloRadar = (eq) => {
  const faltanteGrua = Number(eq.faltante_horometro_grua ?? eq.delta_pauta_horas ?? 250)
  const usaChasis = Boolean(eq.tiene_doble_horometro || Number(eq.horometro_chasis_acumulado) > 0)
  const faltanteChasis = usaChasis ? Number(eq.faltante_horometro_chasis ?? 250) : 999999
  const usaOdo = Number(eq.odometro_acumulado || 0) > 0 || Number(eq.uso_mant_odometro_km || 0) > 0
  const faltanteOdo = usaOdo ? Number(eq.faltante_odometro_km ?? 10000) : 999999

  if (faltanteGrua <= 0 || faltanteChasis <= 0 || faltanteOdo <= 0) return 'VENCIDO'
  if (faltanteGrua <= 50 || faltanteChasis <= 50 || faltanteOdo <= 2000) return 'PROXIMO'
  return 'OK'
}

const radarKpis = computed(() => {
  const lista = Array.isArray(flotaEquipos.value) ? flotaEquipos.value : []
  let alDia = 0
  let proximos = 0
  let vencidos = 0
  let vencidosSinOt = 0
  let enTaller = 0

  for (const eq of lista) {
    const estadoCiclo = evaluarEstadoCicloRadar(eq)
    const tieneOt = Boolean(eq.ot_activa_folio || eq.estado === 'EN_MANTENCION')
    if (tieneOt) enTaller++
    if (estadoCiclo === 'VENCIDO') {
      vencidos++
      if (!tieneOt) vencidosSinOt++
    } else if (estadoCiclo === 'PROXIMO') {
      proximos++
    } else {
      alDia++
    }
  }
  const total = lista.length
  const saludPct = total > 0 ? Math.round(((total - vencidos) / total) * 100) : 100
  return { total, alDia, proximos, vencidos, vencidosSinOt, enTaller, saludPct }
})

const filteredRadarFlota = computed(() => {
  const lista = Array.isArray(flotaEquipos.value) ? flotaEquipos.value : []
  const q = (radarSearchQuery.value || '').toLowerCase().trim()
  return lista.filter(eq => {
    if (q) {
      const matchTexto = (eq.patente || '').toLowerCase().includes(q) ||
        (eq.marca || '').toLowerCase().includes(q) ||
        (eq.modelo || '').toLowerCase().includes(q) ||
        (eq.tipo_equipo || '').toLowerCase().includes(q)
      if (!matchTexto) return false
    }
    if (radarFilterEstado.value === 'EN_TALLER') return Boolean(eq.ot_activa_folio || eq.estado === 'EN_MANTENCION')
    if (radarFilterEstado.value !== 'ALL') return evaluarEstadoCicloRadar(eq) === radarFilterEstado.value
    return true
  })
})

const aplicarParametrosRuta = () => {
  if (isRadarMode.value) {
    activeMainTab.value = 'flota'
    return
  }
  if (activeMainTab.value === 'flota' && !route.query.tab) {
    activeMainTab.value = 'ots'
  }
  if (route.query.tab) {
    const tabParam = String(route.query.tab).toLowerCase()
    if (['ots', 'flota', 'avisos', 'hallazgos', 'parametros'].includes(tabParam)) {
      activeMainTab.value = tabParam
    }
  }
  if (route.query.folio) {
    activeMainTab.value = 'avisos'
  }
  if (route.query.programar_id) {
    const match = flotaEquipos.value.find(e => String(e.id_equipo) === String(route.query.programar_id))
    if (match) abrirModalNuevaOt(match)
  }
}

watch(() => route.fullPath, () => {
  aplicarParametrosRuta()
}, { immediate: true })

let pollInterval = null

const handleKeydownEsc = (e) => {
  if (e.key === 'Escape') {
    if (
      showCierreModal.value ||
      showNuevaActividadModal.value ||
      showNuevaHhModal.value ||
      showNuevoRepuestoModal.value ||
      showNuevoServicioModal.value ||
      showNuevoHallazgoModal.value ||
      showResolverHallazgoModal.value ||
      mostrarModalFichaQrWeb.value ||
      mostrarModalPreviewFotoWeb.value ||
      showNuevaOtModal.value ||
      showNuevoAvisoModal.value
    ) {
      return
    }
    if (selectedOt.value) {
      selectedOt.value = null
    }
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydownEsc)
  aplicarParametrosRuta()
  await fetchRealData()
  aplicarParametrosRuta()
  pollInterval = setInterval(fetchRealData, 30000)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydownEsc)
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 7mm;
  }
  body {
    background: #ffffff !important;
    color: #000000 !important;
  }
  .no-print,
  .no-print-section,
  header,
  nav,
  aside,
  .v-navigation-drawer,
  .v-app-bar,
  footer {
    display: none !important;
  }
  #printable-pauta-ot {
    display: block !important;
    position: static !important;
    width: 100% !important;
    background: #ffffff !important;
    color: #000000 !important;
    padding: 0 !important;
    margin: 0 !important;
  }
}
</style>
