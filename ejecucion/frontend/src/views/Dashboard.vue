<template>
  <div class="space-y-6 text-left">
    <!-- Header -->
    <div class="flex justify-between items-center bg-[#0a0f1e]/40 p-4 border border-white/5 rounded-xl">
      <div>
        <h2 class="text-lg font-black text-white uppercase tracking-wider font-display">Resumen General de Operaciones</h2>
        <p class="text-xs text-slate-400 mt-1">Control centralizado de caja, devengado operacional y seguridad (HSEC) de izajes pesados.</p>
      </div>
      <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-right">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Producción Devengada Junio</span>
        <span class="font-mono text-base font-black text-amber-500">$186.450.000 CLP</span>
      </div>
    </div>

    <!-- KPI Strip -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div class="bg-[#0f1629] border border-white/5 rounded-xl p-4">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Servicios Activos</span>
        <span class="text-2xl font-black text-white mt-1 block">12</span>
        <span class="text-[10px] text-emerald-400 font-semibold mt-1 block">▲ 3 más vs Mayo</span>
      </div>
      <div class="bg-[#0f1629] border border-white/5 rounded-xl p-4">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Descalce Devengado</span>
        <span class="text-2xl font-black text-red-500 font-mono mt-1 block">$42.800.000</span>
        <span class="text-[10px] text-amber-500 font-semibold mt-1 block">⚠ Esperando 3 OC</span>
      </div>
      <div class="bg-[#0f1629] border border-white/5 rounded-xl p-4">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Disponibilidad Flota</span>
        <span class="text-2xl font-black text-white mt-1 block">14 <span class="text-xs text-slate-500">/ 16</span></span>
        <span class="text-[10px] text-red-400 font-semibold mt-1 block">▼ 2 en mantención</span>
      </div>
      <div class="bg-[#0f1629] border border-white/5 rounded-xl p-4">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Acreditación Personal</span>
        <span class="text-2xl font-black text-white mt-1 block">8 <span class="text-xs text-slate-500">/ 10</span></span>
        <span class="text-[10px] text-red-400 font-semibold mt-1 block">▼ 2 bloqueados</span>
      </div>
      <div class="bg-[#0f1629] border border-white/5 rounded-xl p-4">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Seguridad (HSE)</span>
        <span class="text-2xl font-black text-emerald-500 mt-1 block">0</span>
        <span class="text-[10px] text-emerald-400 font-semibold mt-1 block">✔ Sin incidentes</span>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Histogram Panel -->
      <div class="lg:col-span-2 bg-[#0f1629] border border-white/5 rounded-2xl p-5 flex flex-col h-[320px]">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3 mb-4">Control de Flujo e Histograma Financiero</h3>
        <div class="flex-1 bg-black/10 border border-white/5 border-dashed rounded-xl flex items-center justify-center">
          <span class="text-slate-400 text-xs font-semibold">[Gráfico Highcharts: Devengado vs EDP vs OC vs Factura]</span>
        </div>
      </div>

      <!-- Alerts Panel -->
      <div class="bg-[#0f1629] border border-white/5 rounded-2xl p-5 h-[320px] flex flex-col">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3 mb-4 flex justify-between items-center">
          <span>Alertas Operativas Críticas</span>
          <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black px-2 py-0.5 rounded">4 Activas</span>
        </h3>
        <div class="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
          <div class="bg-[#151d35]/60 border-l-4 border-red-500 p-3 rounded-lg flex items-start gap-3">
            <AlertTriangle class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span class="text-xs font-bold text-white block">Acreditación vencida — Carlos Muñoz</span>
              <p class="text-[10px] text-slate-400 mt-0.5">Inducción CMPC Laja venció el 15/06/2026. No puede operar.</p>
            </div>
          </div>
          <div class="bg-[#151d35]/60 border-l-4 border-red-500 p-3 rounded-lg flex items-start gap-3">
            <AlertTriangle class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span class="text-xs font-bold text-white block">Certificación vencida (BV) — GZBC-43</span>
              <p class="text-[10px] text-slate-400 mt-0.5">Grúa Liebherr LTM 1100 venció certificación anual el 01/06.</p>
            </div>
          </div>
          <div class="bg-[#151d35]/60 border-l-4 border-amber-500 p-3 rounded-lg flex items-start gap-3">
            <AlertTriangle class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span class="text-xs font-bold text-white block">Viento fuerte (38 km/h) — Faena Laja</span>
              <p class="text-[10px] text-slate-400 mt-0.5">Supera umbral de seguridad de 35 km/h. Maniobra pausada.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { AlertTriangle } from 'lucide-vue-next'
</script>
