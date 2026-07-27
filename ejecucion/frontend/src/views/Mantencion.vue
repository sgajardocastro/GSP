<template>
  <div class="bg-[#0f1629] border border-white/5 rounded-2xl p-6 text-left space-y-4">
    <div class="border-b border-white/5 pb-4">
      <h2 class="text-lg font-black text-white uppercase tracking-wider font-display">Mantención de Flota Pesada</h2>
      <p class="text-xs text-slate-400 mt-1">Control de horómetros de maquinaria de izaje, alertas de mantenciones preventivas y vigencia de certificados Bureau Veritas.</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-[#050810]/50 p-4 rounded-xl border border-white/5">
        <h3 class="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">Resumen de Equipos</h3>
        <ul class="space-y-2 text-xs text-slate-300">
          <li class="flex justify-between"><span>Total Grúas Flota:</span><span class="font-bold text-white">16</span></li>
          <li class="flex justify-between"><span>Grúas Operativas:</span><span class="font-bold text-emerald-400">14</span></li>
          <li class="flex justify-between"><span>En Mantención Preventiva:</span><span class="font-bold text-red-400">2</span></li>
          <li class="flex justify-between"><span>Disponibilidad Actual:</span><span class="font-bold text-white">87.5%</span></li>
        </ul>
      </div>
      
      <div class="bg-[#050810]/50 p-4 rounded-xl border border-white/5">
        <h3 class="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">Vencimientos Próximos</h3>
        <ul class="space-y-2 text-xs text-slate-300">
          <li class="flex justify-between"><span>Liebherr LTM 1100 (GZBC-43):</span><span class="font-bold text-red-400">Vencido BV 01/06</span></li>
          <li class="flex justify-between"><span>Liebherr LTM 1250 (GZBC-61):</span><span class="font-bold text-amber-500">Mantención en 45 hrs</span></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>
