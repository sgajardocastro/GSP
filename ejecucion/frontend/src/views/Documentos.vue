<template>
  <div class="bg-[#0f1629] border border-white/5 rounded-2xl p-6 text-left space-y-4">
    <div class="border-b border-white/5 pb-4">
      <h2 class="text-lg font-black text-white uppercase tracking-wider font-display">Gestor Documental Centralizado</h2>
      <p class="text-xs text-slate-400 mt-1">Biblioteca digital unificada. Almacenamiento seguro de pases, seguros, planos de maniobra y firmas de conformidad (FES).</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 h-[260px]">
      <!-- Left: Folder tree mock -->
      <div class="bg-[#050810]/50 border border-white/5 rounded-xl p-4 overflow-y-auto">
        <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Carpetas del Sistema</h3>
        <ul class="space-y-2 text-xs text-slate-300">
          <li class="font-bold text-amber-500">📁 Expedientes de Grúas</li>
          <li class="pl-4">📂 Liebherr LTM 1400 (GZBC-99)</li>
          <li class="pl-4">📂 Liebherr LTM 1220 (GZBC-61)</li>
          <li class="font-bold text-amber-500">📁 Acreditaciones de Clientes</li>
          <li class="pl-4">📂 CMPC Celulosa</li>
          <li class="pl-4">📂 Celulosa Arauco</li>
          <li class="font-bold text-amber-500">📁 Partes Diarios & Firmas</li>
        </ul>
      </div>

      <!-- Right: Documents list mock -->
      <div class="md:col-span-2 bg-[#050810]/50 border border-white/5 rounded-xl p-4 overflow-y-auto">
        <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Documentos Recientes</h3>
        <ul class="space-y-2.5 text-xs text-slate-300">
          <li class="flex justify-between items-center border-b border-white/5 pb-2">
            <span>📄 Seguro Vial Vigente (GZBC-99).pdf</span>
            <span class="text-[9px] text-slate-500">Hace 2 horas</span>
          </li>
          <li class="flex justify-between items-center border-b border-white/5 pb-2">
            <span>📄 Inducción Aprobada Carlos Muñoz.pdf</span>
            <span class="text-[9px] text-slate-500">Ayer</span>
          </li>
          <li class="flex justify-between items-center border-b border-white/5 pb-2">
            <span>📄 Plano Rigging Reactor Laja v2.pdf</span>
            <span class="text-[9px] text-slate-500">29 Jun 2026</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>
