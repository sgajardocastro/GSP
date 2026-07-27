<template>
  <div class="bg-[#0f1629] border border-white/5 rounded-2xl p-6 text-left space-y-6">
    <div class="border-b border-white/5 pb-4">
      <h2 class="text-lg font-black text-white uppercase tracking-wider font-display">Estados de Pago (EDP) & Cruce Contable</h2>
      <p class="text-xs text-slate-400 mt-1">Reconciliación de partes de terreno firmados contra tarifas contractuales y órdenes de compra de clientes.</p>
    </div>

    <!-- Mini KPI strip -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-[#050810]/50 p-3 rounded-lg border border-white/5">
        <span class="text-[9px] font-black text-slate-500 uppercase block">Total Servicios</span>
        <span class="text-base font-bold text-white mt-1 block">8</span>
      </div>
      <div class="bg-[#050810]/50 p-3 rounded-lg border border-white/5">
        <span class="text-[9px] font-black text-slate-500 uppercase block">Devengado Acumulado</span>
        <span class="text-base font-bold text-blue-400 font-mono mt-1 block">$141.050.000</span>
      </div>
      <div class="bg-[#050810]/50 p-3 rounded-lg border border-white/5">
        <span class="text-[9px] font-black text-slate-500 uppercase block">EDP Aprobados</span>
        <span class="text-base font-bold text-emerald-400 font-mono mt-1 block">4</span>
      </div>
      <div class="bg-[#050810]/50 p-3 rounded-lg border border-white/5">
        <span class="text-[9px] font-black text-slate-500 uppercase block">Pendientes OC / Firma</span>
        <span class="text-base font-bold text-red-500 font-mono mt-1 block">4</span>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-xs text-slate-300">
        <thead>
          <tr class="bg-black/20 text-slate-400 text-[10px] uppercase tracking-wider border-b border-white/10">
            <th class="p-3 text-left">Servicio</th>
            <th class="p-3 text-left">Fecha</th>
            <th class="p-3 text-left">Cliente / Obra</th>
            <th class="p-3 text-right">V. Devengado</th>
            <th class="p-3 text-center">EDPs Emitidos</th>
            <th class="p-3 text-center">OC Recibida</th>
            <th class="p-3 text-right">Facturado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr>
            <td class="p-3 font-mono text-amber-500 font-bold">#SRV-2026-041</td>
            <td class="p-3 font-mono">21 Jun 2026</td>
            <td class="p-3">
              <div class="text-white font-bold">CMPC Celulosa</div>
              <div class="text-[10px] text-slate-500 mt-0.5">Planta Laja · Turbina</div>
            </td>
            <td class="p-3 text-right font-mono font-bold text-white">$34.800.000</td>
            <td class="p-3 text-center"><span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded">EDP #01 y #02</span></td>
            <td class="p-3 text-center"><span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-mono">OC-4530</span></td>
            <td class="p-3 text-right font-mono text-emerald-400 font-bold">$14.000.000 (34%)</td>
          </tr>
          <tr>
            <td class="p-3 font-mono text-amber-500 font-bold">#SRV-2026-043</td>
            <td class="p-3 font-mono">18 Jun 2026</td>
            <td class="p-3">
              <div class="text-white font-bold">Arauco Forestal</div>
              <div class="text-[10px] text-slate-500 mt-0.5">Planta Arauco · Torres Secado</div>
            </td>
            <td class="p-3 text-right font-mono font-bold text-white">$28.500.000</td>
            <td class="p-3 text-center"><span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded">EDP #01</span></td>
            <td class="p-3 text-center"><span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-mono">OC-4533</span></td>
            <td class="p-3 text-right font-mono text-emerald-400 font-bold">$17.100.000 (49%)</td>
          </tr>
          <tr>
            <td class="p-3 font-mono text-amber-500 font-bold">#SRV-2026-048</td>
            <td class="p-3 font-mono">12 Jun 2026</td>
            <td class="p-3">
              <div class="text-white font-bold">Arauco S.A.</div>
              <div class="text-[10px] text-slate-500 mt-0.5">Planta Horcones · Caldera</div>
            </td>
            <td class="p-3 text-right font-mono font-bold text-white">$18.500.000</td>
            <td class="p-3 text-center"><span class="text-slate-500 text-[10px]">Sin EDPs</span></td>
            <td class="p-3 text-center"><span class="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-2 py-0.5 rounded font-bold">Falta OC</span></td>
            <td class="p-3 text-right font-mono text-slate-500">$0 (0%)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
</script>
