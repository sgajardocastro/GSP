<template>
  <div class="flex flex-col h-full space-y-4 relative overflow-hidden">
    
    <!-- 🎚️ MONITOR DE VIGILANCIA DE FLOTA (Collapsible) -->
    <div class="glass-card rounded-2xl border border-zinc-200 dark:border-white/10 transition-all duration-500" :class="[isDashboardOpen ? 'pb-6' : 'pb-0']">
      <div @click="isDashboardOpen = !isDashboardOpen" class="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
        <div class="p-1 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 shrink-0">
          <ChevronUp v-if="isDashboardOpen" class="w-4 h-4 text-blue-500" />
          <ChevronDown v-else class="w-4 h-4 text-blue-500" />
        </div>
        <div class="flex items-center gap-4 flex-1">
          <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500">
            <Truck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Consola de Mando de Flota</h3>
            <p class="text-[10px] text-zinc-500 dark:text-muted-foreground font-black uppercase tracking-tighter opacity-60">Visión 360: Inspecciones • Documentos • Mantenimiento (OTs)</p>
          </div>
        </div>
        <div v-if="!isDashboardOpen" class="flex items-center gap-6">
           <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500"></span><span class="text-[10px] font-black text-zinc-800 dark:text-white uppercase">Operativos: 38</span></div>
           <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-destructive"></span><span class="text-[10px] font-black text-zinc-800 dark:text-white uppercase">Detenidos: 04</span></div>
        </div>
      </div>

      <transition name="slide-fade">
        <div v-if="isDashboardOpen" class="px-6 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 mb-4">
           <!-- TOTAL -->
           <div @click="currentFilter = 'all'" :class="['p-4 rounded-xl border transition-all cursor-pointer group', currentFilter === 'all' ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500' : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.05]']">
             <p class="text-[9px] font-black text-zinc-500 dark:text-white/40 uppercase tracking-widest">Total Flota</p>
             <h3 class="text-2xl font-black text-zinc-900 dark:text-white">{{ fleetKPIs.total }}</h3>
           </div>
           <!-- INSPECCIONES -->
           <div class="grid grid-cols-2 gap-2">
              <div @click="currentFilter = 'insp-ok'" :class="['p-3 rounded-xl border transition-all cursor-pointer', currentFilter === 'insp-ok' ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500' : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.05]']">
                 <p class="text-[8px] font-black text-emerald-600 dark:text-emerald-500/80 uppercase">INSP. OK</p>
                 <p class="text-xl font-black text-zinc-900 dark:text-white">{{ fleetKPIs.inspOk }}</p>
              </div>
              <div @click="currentFilter = 'insp-error'" :class="['p-3 rounded-xl border transition-all cursor-pointer font-black', currentFilter === 'insp-error' ? 'bg-red-50 dark:bg-destructive/20 border-red-500 dark:border-destructive' : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.05]']">
                 <p class="text-[8px] font-black text-red-600 dark:text-destructive/80 uppercase">RECHAZO</p>
                 <p class="text-xl font-black text-zinc-900 dark:text-white">{{ fleetKPIs.inspErr }}</p>
              </div>
           </div>
           <!-- DOCUMENTOS -->
           <div class="grid grid-cols-2 gap-2">
              <div @click="currentFilter = 'doc-warning'" :class="['p-3 rounded-xl border transition-all cursor-pointer', currentFilter === 'doc-warning' ? 'bg-amber-50 dark:bg-amber-600/20 border-amber-500' : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.05]']">
                 <p class="text-[8px] font-black text-amber-600 dark:text-amber-500/80 uppercase">A VENCER</p>
                 <p class="text-xl font-black text-zinc-900 dark:text-white">{{ fleetKPIs.docWarn }}</p>
              </div>
              <div @click="currentFilter = 'doc-error'" :class="['p-3 rounded-xl border transition-all cursor-pointer', currentFilter === 'doc-error' ? 'bg-red-50 dark:bg-destructive/20 border-red-500 dark:border-destructive' : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.05]']">
                 <p class="text-[8px] font-black text-red-600 dark:text-destructive/80 uppercase">VENCIDOS</p>
                 <p class="text-xl font-black text-zinc-900 dark:text-white">{{ fleetKPIs.docErr }}</p>
              </div>
           </div>
        </div>
      </transition>
    </div>

    <!-- 🛠️ TABLA MAESTRA DE ACTIVOS -->
    <div class="flex-1 glass-card rounded-2xl border border-zinc-200 dark:border-white/10 flex flex-col overflow-hidden">
      <div class="px-6 py-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/[0.02]">
        <div class="flex items-center gap-4">
          <h3 class="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Inventario de Gestión de Activos</h3>
          <div class="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-white/5">
             <button @click="currentFilter = 'all'" :class="['px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all', currentFilter === 'all' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm dark:shadow-none' : 'text-zinc-500 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-white']">Todos</button>
             <button @click="currentFilter = 'critical'" :class="['px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all', currentFilter === 'critical' ? 'bg-red-500/10 dark:bg-destructive/20 text-red-600 dark:text-destructive' : 'text-zinc-500 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-white']">Críticos</button>
          </div>
          <div class="hidden xl:flex items-center gap-2 ml-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg">
             <span class="text-[8px] font-black text-zinc-500 dark:text-muted-foreground uppercase tracking-widest mr-1">Política:</span>
             <div class="flex gap-3">
               <div class="flex items-center gap-1.5" title="Inspeccionado hace menos de 1 mes"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span><span class="text-[8px] font-bold text-zinc-700 dark:text-emerald-100 uppercase">&lt; 1 MES</span></div>
               <div class="flex items-center gap-1.5" title="Inspeccionado hace más de 1 mes"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></span><span class="text-[8px] font-bold text-zinc-700 dark:text-amber-100 uppercase">&gt; 1 MES</span></div>
               <div class="flex items-center gap-1.5" title="No registra inspecciones"><span class="w-1.5 h-1.5 rounded-full bg-destructive shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span><span class="text-[8px] font-bold text-zinc-700 dark:text-red-100 uppercase">SIN INSP.</span></div>
             </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
             <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-muted-foreground" />
             <input type="text" v-model="searchQuery" placeholder="BUSCAR POR PATENTE O MODELO..." class="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-blue-500/50 w-64 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500" />
          </div>
          <button @click="exportToExcel" class="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 border border-emerald-300 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 dark:text-emerald-500 dark:border-emerald-500/30 rounded-lg transition-all group">
            <FileSpreadsheet class="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span class="text-[10px] font-black uppercase tracking-widest">Exportar</span>
          </button>
          <button @click="openCreateModal" class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg border border-blue-500/20 shadow-lg shadow-blue-500/10 transition-all group">
            <Plus class="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span class="text-[10px] font-black uppercase tracking-widest">Registrar Equipo</span>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto overflow-x-hidden">
        <table class="w-full text-left">
          <thead class="sticky top-0 bg-zinc-100 dark:bg-zinc-950 z-10 border-b border-zinc-200 dark:border-white/10">
            <tr class="bg-zinc-200/50 dark:bg-white/[0.03]">
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Activo (Patente)</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Marca / Modelo</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 text-center">Última Inspección</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 text-center">Doc. Legal</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 text-center">Doc. General</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-white/5">
            <tr 
              v-for="asset in filteredFleet" 
              :key="asset.id" 
              @click="openDetail(asset)"
              class="hover:bg-blue-500/[0.05] cursor-pointer transition-all group h-12"
            >
              <td class="px-6 py-2 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 group-hover:border-blue-500/50 transition-colors">
                    <component :is="getIcon(asset.type)" class="w-3.5 h-3.5 text-zinc-600 dark:text-white/70" />
                  </div>
                  <span class="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{{ asset.plate }}</span>
                  <span class="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 opacity-60 tracking-[0.1em]">({{ asset.internalId }})</span>
                </div>
              </td>
              <td class="px-6 py-2 whitespace-nowrap">
                <span class="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-tighter">{{ asset.brand }} &bull; {{ asset.model }}</span>
              </td>
              <td class="px-6 py-2 text-center whitespace-nowrap">
                <span class="px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider"
                  :style="asset.lastInspStatus === 'ok' ? 'background-color: #10b981 !important; border-color: #10b981 !important; color: #ffffff !important;' :
                          asset.lastInspStatus === 'warning' ? 'background-color: #f59e0b !important; border-color: #f59e0b !important; color: #ffffff !important;' :
                          'background-color: #ef4444 !important; border-color: #ef4444 !important; color: #ffffff !important;'">
                  {{ asset.lastInspText }}
                </span>
              </td>
              <td class="px-6 py-2 text-center whitespace-nowrap">
                <div class="inline-flex items-center justify-center">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center border transition-all"
                    :style="asset.docStatus === 'ok' ? 'background-color: #10b981 !important; border-color: #10b981 !important; color: #ffffff !important;' : 
                            asset.docStatus === 'warning' ? 'background-color: #f59e0b !important; border-color: #f59e0b !important; color: #ffffff !important;' :
                            asset.docStatus === 'empty' ? 'background-color: #71717a !important; border-color: #71717a !important; color: #ffffff !important;' :
                            'background-color: #ef4444 !important; border-color: #ef4444 !important; color: #ffffff !important;'"
                    :title="asset.docStatus === 'empty' ? 'Sin Documentos Registrados' : ''">
                    <span class="text-[10px] font-black" style="color: #ffffff !important;">
                      {{ asset.docStatus === 'ok' ? '✓' : asset.docStatus === 'empty' ? '✕' : '!' }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-2 text-center whitespace-nowrap">
                <div class="inline-flex items-center justify-center">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center border transition-all"
                    :style="asset.docGralStatus === 'ok' ? 'background-color: #10b981 !important; border-color: #10b981 !important; color: #ffffff !important;' : 
                            asset.docGralStatus === 'warning' ? 'background-color: #f59e0b !important; border-color: #f59e0b !important; color: #ffffff !important;' :
                            asset.docGralStatus === 'empty' ? 'background-color: #71717a !important; border-color: #71717a !important; color: #ffffff !important;' :
                            'background-color: #ef4444 !important; border-color: #ef4444 !important; color: #ffffff !important;'"
                    :title="asset.docGralStatus === 'empty' ? 'Sin Documentos Registrados' : ''">
                    <span class="text-[10px] font-black" style="color: #ffffff !important;">
                      {{ asset.docGralStatus === 'ok' ? '✓' : asset.docGralStatus === 'empty' ? '✕' : '!' }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-2 text-right whitespace-nowrap">
                <ChevronRight class="w-3.5 h-3.5 text-zinc-400 dark:text-muted-foreground group-hover:text-zinc-900 dark:group-hover:text-white transition-all ml-auto" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 📑 MODAL PANORÁMICO 360 (ULTRA-WIDE) -->
    <transition name="fade">
      <div v-if="showDetail && selectedAsset" class="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
        <div @click="closeDetail" class="absolute inset-0 bg-zinc-950/70 backdrop-blur-md"></div>
        
        <div class="relative w-[98%] h-[96vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[2.5rem] shadow-[0_0_150px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
          
          <!-- Header Panorámico -->
          <div class="px-10 py-6 border-b border-zinc-200 dark:border-white/5 bg-gradient-to-r from-blue-600/5 via-blue-500/5 to-transparent flex items-center justify-between shrink-0">
            <div class="flex items-center gap-8">
              <div class="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shadow-lg relative">
                <component :is="getIcon(selectedAsset.type)" class="w-8 h-8 text-blue-500 relative z-10" />
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-4">
                  <h2 class="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{{ selectedAsset.plate }}</h2>
                  <div class="flex gap-2">
                    <span class="px-3 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-500 text-[10px] font-black border border-blue-500/20 uppercase tracking-[0.2em]">{{ selectedAsset.internalId }}</span>
                    <span class="px-4 py-1 rounded text-[10px] font-black border uppercase tracking-[0.2em] state-ok">OPERATIVO</span>
                  </div>
                </div>
                <p class="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.3em] opacity-80 ml-1">
                  {{ selectedAsset.brand }} • {{ selectedAsset.model }} • CONTRATO: {{ selectedAsset.project }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-6">
              <button @click="openEditModal" class="group flex items-center gap-3 px-5 py-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                <span class="text-[10px] font-black uppercase tracking-widest">Editar Ficha</span>
              </button>

              <button @click="openQR" class="group flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 transition-all border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <span class="text-[10px] font-black uppercase tracking-widest">Ficha QR Pública</span>
              </button>

              <button @click="closeDetail" class="group flex items-center gap-3 px-5 py-3 rounded-xl bg-zinc-100 hover:bg-destructive/10 hover:text-destructive dark:bg-white/5 dark:hover:bg-destructive/20 dark:hover:text-destructive transition-all border border-zinc-200 dark:border-white/5">
                <span class="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-white/50">Cerrar Consola</span>
                <X class="w-5 h-5 group-hover:rotate-90 text-zinc-600 dark:text-white transition-transform" />
              </button>
            </div>
          </div>

          <!-- Body Panorámico -->
          <div class="flex-1 overflow-hidden flex">
            
            <!-- Sidebar (Ficha Técnica Maestro Oracle) -->
            <div class="w-80 border-r border-zinc-200 dark:border-white/5 p-8 bg-zinc-50 dark:bg-zinc-950/50 space-y-8 overflow-y-auto scrollbar-hide shrink-0 shadow-2xl">
              
              <div class="space-y-1 pb-4 border-b border-zinc-200 dark:border-white/5">
                <h4 class="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{{ selectedAsset.plate }}</h4>
                <p class="text-[9px] font-bold text-blue-600 dark:text-blue-500 tracking-[0.2em]">{{ selectedAsset.internalId }}</p>
              </div>

              <div class="space-y-6">
                <h4 class="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-white/30">Atributos Técnicos</h4>
                
                <div class="space-y-2.5 px-0">
                  <div v-for="spec in technicalSpecs" :key="spec.label" 
                    class="flex justify-between items-center border-b border-zinc-100 dark:border-white/5 pb-1.5 group">
                    <span class="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{{ spec.label }}</span>
                    <span class="text-[10px] font-bold text-zinc-900 dark:text-white tracking-tight">{{ spec.value }}</span>
                  </div>
                </div>
              </div>

              <!-- Estado de Certificación (Compacto) -->
              <div class="pt-4 space-y-4">
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-100 dark:bg-white/5">
                    <span class="text-[9px] font-bold text-zinc-500 dark:text-white/40 uppercase">CERT. LEGAL</span>
                    <div class="w-2 h-2 rounded-full" 
                         :style="selectedAsset.docStatus === 'ok' ? 'background-color: #10b981 !important; box-shadow: 0 0 8px rgba(16,185,129,0.5) !important;' : 
                                 selectedAsset.docStatus === 'warning' ? 'background-color: #f59e0b !important; box-shadow: 0 0 8px rgba(245,158,11,0.5) !important;' : 
                                 selectedAsset.docStatus === 'empty' ? 'background-color: #71717a !important; box-shadow: 0 0 8px rgba(113,113,122,0.5) !important;' :
                                 'background-color: #ef4444 !important; box-shadow: 0 0 8px rgba(239,68,68,0.5) !important;'"></div>
                  </div>
                  <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-100 dark:bg-white/5">
                    <span class="text-[9px] font-bold text-zinc-500 dark:text-white/40 uppercase">CERT. GRAL</span>
                    <div class="w-2 h-2 rounded-full" 
                         :style="selectedAsset.docGralStatus === 'ok' ? 'background-color: #10b981 !important; box-shadow: 0 0 8px rgba(16,185,129,0.5) !important;' : 
                                 selectedAsset.docGralStatus === 'warning' ? 'background-color: #f59e0b !important; box-shadow: 0 0 8px rgba(245,158,11,0.5) !important;' : 
                                 selectedAsset.docGralStatus === 'empty' ? 'background-color: #71717a !important; box-shadow: 0 0 8px rgba(113,113,122,0.5) !important;' :
                                 'background-color: #ef4444 !important; box-shadow: 0 0 8px rgba(239,68,68,0.5) !important;'"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 flex flex-col overflow-hidden bg-zinc-50/30 dark:bg-zinc-900/50">
              <div class="px-10 pt-8 flex gap-12 border-b border-zinc-200 dark:border-white/5 shrink-0 overflow-x-auto scrollbar-hide">
                <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id" :class="['text-[11px] font-black uppercase tracking-[0.35em] pb-6 transition-all relative shrink-0', activeTab === t.id ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white']">
                  {{ t.label }}
                  <span v-if="activeTab === t.id" class="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full shadow-[0_-5px_15px_rgba(37,99,235,0.5)]"></span>
                </button>
              </div>

              <div class="flex-1 overflow-y-auto p-10 scrollbar-hide">
                <!-- VISTA 360 -->
                <div v-if="activeTab === 'summary'" class="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                   <div class="space-y-8">
                      <h5 class="text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.45em] flex items-center gap-4 opacity-50">
                         <span class="w-8 h-[1px] bg-blue-500"></span>
                         Carpeta Digital
                      </h5>
                      <div class="grid grid-cols-1 gap-3">
                        <div v-if="isLoadingDocs" class="flex flex-col items-center justify-center py-20 space-y-4 opacity-50">
                           <div class="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                           <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Sincronizando con Oracle...</p>
                        </div>
                        <div v-else class="space-y-8">
                          <!-- DOCUMENTACIÓN LEGAL -->
                          <div v-if="selectedAsset.legalDocs?.length" class="space-y-3">
                            <h6 class="text-[9px] font-bold text-blue-600 dark:text-blue-500/50 uppercase tracking-[0.3em] flex items-center gap-2">
                               <div class="w-1 h-3 bg-blue-500/30"></div> DOCUMENTACIÓN LEGAL (MANTENIMIENTO BASE)
                            </h6>
                            <div class="grid grid-cols-1 gap-2">
                              <div v-for="doc in selectedAsset.legalDocs" :key="doc.id" class="px-5 py-3 rounded-xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex items-center justify-between group hover:bg-blue-500/[0.05] transition-all">
                                <div class="flex items-center gap-6 flex-1">
                                   <FileText class="w-4 h-4 text-blue-500" />
                                   <span class="text-[11px] font-bold text-zinc-800 dark:text-white tracking-tight flex-1">{{ doc.name }}</span>
                                   <div class="flex items-center gap-2 min-w-[140px]">
                                      <span class="text-[9px] font-bold text-zinc-400 dark:text-muted-foreground uppercase tracking-widest opacity-80">EXP:</span>
                                      <span class="text-[10px] font-bold text-zinc-900 dark:text-white tracking-tight">{{ doc.expiry }}</span>
                                   </div>
                                </div>
                                <div class="flex items-center gap-6">
                                   <span class="text-[9px] font-black px-3 py-1 rounded-md tracking-[0.2em]"
                                      :class="{ 'animate-pulse': doc.status !== 0 && doc.status !== 1 }"
                                      :style="doc.status === 0 ? 'background-color: #10b981 !important; border-color: #10b981 !important; color: #ffffff !important;' :
                                              doc.status === 1 ? 'background-color: #f59e0b !important; border-color: #f59e0b !important; color: #ffffff !important;' :
                                              'background-color: #ef4444 !important; border-color: #ef4444 !important; color: #ffffff !important;'">
                                     {{ doc.status === 0 ? 'LIBERADO' : doc.status === 1 ? 'ALERTA' : 'VENCIDO' }}
                                   </span>
                                   <a :href="doc.fileUrl || `https://servidor.leanglobal.cl/lg-gsp/api/archivo/ver/${doc.fileId}`" target="_blank" class="text-zinc-400 hover:text-blue-600 dark:text-muted-foreground dark:hover:text-blue-500 transition-all p-1">
                                     <Eye class="w-4 h-4" />
                                   </a>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- DOCUMENTACIÓN GENERAL -->
                          <div v-if="selectedAsset.generalDocs?.length" class="space-y-3">
                            <h6 class="text-[9px] font-bold text-amber-600 dark:text-amber-500/50 uppercase tracking-[0.3em] flex items-center gap-2">
                               <div class="w-1 h-3 bg-amber-500/30"></div> CERTIFICADOS DE OPERATIVIDAD (GENERAL)
                            </h6>
                            <div class="grid grid-cols-1 gap-2">
                              <div v-for="doc in selectedAsset.generalDocs" :key="doc.id" class="px-5 py-3 rounded-xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex items-center justify-between group hover:bg-blue-500/[0.05] transition-all">
                                <div class="flex items-center gap-6 flex-1">
                                   <FileText class="w-4 h-4 text-amber-500" />
                                   <span class="text-[11px] font-bold text-zinc-800 dark:text-white tracking-tight flex-1">{{ doc.name }}</span>
                                   <div class="flex items-center gap-2 min-w-[140px]">
                                      <span class="text-[9px] font-bold text-zinc-400 dark:text-muted-foreground uppercase tracking-widest opacity-80">EXP:</span>
                                      <span class="text-[10px] font-bold text-zinc-900 dark:text-white tracking-tight">{{ doc.expiry }}</span>
                                   </div>
                                </div>
                                <div class="flex items-center gap-6">
                                   <span class="text-[9px] font-black px-3 py-1 rounded-md tracking-[0.2em]"
                                      :class="{ 'animate-pulse': doc.status !== 0 && doc.status !== 1 }"
                                      :style="doc.status === 0 ? 'background-color: #10b981 !important; border-color: #10b981 !important; color: #ffffff !important;' :
                                              doc.status === 1 ? 'background-color: #f59e0b !important; border-color: #f59e0b !important; color: #ffffff !important;' :
                                              'background-color: #ef4444 !important; border-color: #ef4444 !important; color: #ffffff !important;'">
                                     {{ doc.status === 0 ? 'LIBERADO' : doc.status === 1 ? 'ALERTA' : 'VENCIDO' }}
                                   </span>
                                   <a :href="doc.fileUrl || `https://servidor.leanglobal.cl/lg-gsp/api/archivo/ver/${doc.fileId}`" target="_blank" class="text-zinc-400 hover:text-blue-600 dark:text-muted-foreground dark:hover:text-blue-500 transition-all p-1">
                                     <Eye class="w-4 h-4" />
                                   </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                   </div>

                   <div class="space-y-8">
                      <h5 class="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.45em] flex items-center gap-4 opacity-50 italic">
                         <span class="w-8 h-[1px] bg-emerald-500"></span>
                         Inspecciones
                      </h5>
                      <div v-if="!selectedAsset.surveys || !selectedAsset.surveys.length" class="text-xs text-zinc-500 dark:text-muted-foreground italic pl-4">
                        Sin inspecciones registradas.
                      </div>
                      <div v-else class="relative space-y-6 pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-[1px] before:bg-zinc-200 dark:before:bg-white/10">
                        <div v-for="(survey, idx) in selectedAsset.surveys.slice(0, 4)" :key="survey.id_survey" class="relative group/step">
                          <div class="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-white/10 flex items-center justify-center transition-all group-hover/step:border-blue-500 z-10 shadow-lg">
                             <div class="w-1.5 h-1.5 rounded-full" :class="idx === 0 ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-white/20'"></div>
                          </div>
                          <div class="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/[0.05] transition-all">
                            <span class="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest block mb-1">{{ formatDateString(survey.fecha_real_fin || survey.fecha_real_ini || survey.fecha_plan_ini) }}</span>
                            <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight italic">{{ survey.name_template_srv || 'Inspección' }}</p>
                            <p class="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase mt-2 opacity-80 leading-relaxed font-bold tracking-widest">
                              Operador: {{ survey.nombre_user || 'Sin asignar' }} &bull; Estado: {{ survey.estado_srv }}
                            </p>
                          </div>
                        </div>
                      </div>
                   </div>
                </div>

                <!-- INSPECTIONS -->
                <div v-if="activeTab === 'inspections'" class="space-y-3 animate-in fade-in duration-500">
                   <div v-if="!selectedAsset.surveys || !selectedAsset.surveys.length" class="text-center py-12 text-zinc-500 dark:text-muted-foreground font-semibold">
                     Sin inspecciones registradas para este equipo.
                   </div>
                   <div v-else v-for="item in selectedAsset.surveys" :key="item.id_survey" class="px-8 py-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex items-center justify-between hover:border-emerald-500/40 transition-all group hover:bg-zinc-50 dark:hover:bg-white/[0.04] shadow-sm">
                      <div class="flex items-center gap-12">
                        <div class="text-center w-16">
                           <p class="text-2xl font-black text-zinc-300 dark:text-white/30 leading-none tracking-tighter italic">#{{ item.id_survey }}</p>
                           <p class="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase opacity-60 mt-1 italic">{{ formatDateString(item.fecha_real_fin || item.fecha_real_ini || item.fecha_plan_ini).split(',')[0] }}</p>
                        </div>
                        <div class="h-10 w-[1px] bg-zinc-200 dark:bg-white/10"></div>
                        <div>
                          <p class="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic group-hover:text-emerald-500 transition-colors">{{ item.name_template_srv || 'Inspección' }}</p>
                          <div class="flex items-center gap-6 mt-2">
                             <p class="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest opacity-80 italic">OPERADOR: {{ item.nombre_user || 'SIN REGISTRO' }}</p>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-8">
                        <div class="flex flex-col items-end">
                           <span class="px-5 py-2 rounded-xl text-[10px] font-black border uppercase tracking-[0.25em]" :class="estadoClass(item.estado_srv)">
                             {{ item.estado_srv || 'PENDIENTE' }}
                           </span>
                        </div>
                        <a v-if="item.id_doc" :href="`https://servidor.leanglobal.cl/lean-services-transmac-dev/api/archivo/transmac/${item.id_doc}`" target="_blank" class="p-3 rounded-xl bg-zinc-100 text-zinc-500 hover:text-white hover:bg-emerald-600 dark:bg-white/5 dark:text-muted-foreground dark:hover:text-white dark:hover:bg-emerald-600 transition-all border border-zinc-200 dark:border-white/5 group-hover:scale-105">
                          <Eye class="w-5 h-5" />
                        </a>
                      </div>
                   </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </transition>

    <!-- Modal QR Público -->
    <transition name="fade">
      <div v-if="showQRModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div @click="showQRModal = false" class="absolute inset-0 bg-zinc-950/70 backdrop-blur-md"></div>
        <div class="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in-95">
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
            <ScanLine class="w-6 h-6 text-emerald-500" />
          </div>
          <h3 class="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-2">Código QR Público</h3>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Escanea este código para ver la Ficha Pública del equipo <strong class="text-zinc-800 dark:text-white">{{ selectedAsset?.plate }}</strong> sin necesidad de iniciar sesión.</p>
          
          <div class="bg-white p-4 rounded-2xl mb-6 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="w-48 h-48" />
            <div v-else class="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-xl">
              <Loader2 class="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          </div>

          <button @click="showQRModal = false" class="w-full py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-950 dark:text-white text-sm font-bold uppercase tracking-widest transition-colors border border-zinc-200 dark:border-white/10">
            Cerrar
          </button>
        </div>
      </div>
    </transition>

    <!-- Modal Crear/Editar Equipo -->
    <ModalCrearEditarEquipo
      v-if="showCreateEditModal"
      :is-edit="isEditMode"
      :equipment-id="editEquipmentId"
      @close="showCreateEditModal = false"
      @saved="onEquipmentSaved"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as XLSX from 'xlsx'
import QRCode from 'qrcode'
import apiAxios from '@/services/api'
import ModalCrearEditarEquipo from '../components/ModalCrearEditarEquipo.vue'
import { 
  Truck, Search, Plus, Eye, FileText, X, ChevronDown, ChevronRight, CheckCircle, AlertTriangle, 
  MapPin, Gauge, Fuel, Calendar, Wrench, HardDrive, Package, Clock, FileSpreadsheet,
  ScanLine, Loader2
} from 'lucide-vue-next'

const isLoading = ref(true)
const isLoadingDocs = ref(false)
const isDashboardOpen = ref(true)
const fleet = ref([])
const showDetail = ref(false)
const selectedAsset = ref(null)
const activeTab = ref('summary')
const currentFilter = ref('all') 
const searchQuery = ref('')

const showCreateEditModal = ref(false)
const isEditMode = ref(false)
const editEquipmentId = ref(null)

function openCreateModal() {
  isEditMode.value = false
  editEquipmentId.value = null
  showCreateEditModal.value = true
}

function openEditModal() {
  if (!selectedAsset.value) return
  isEditMode.value = true
  editEquipmentId.value = selectedAsset.value.id
  showCreateEditModal.value = true
}

function onEquipmentSaved() {
  showCreateEditModal.value = false
  fetchFleet()
  if (selectedAsset.value) {
    const updated = fleet.value.find(a => a.id === selectedAsset.value.id)
    if (updated) {
      selectedAsset.value = updated
      fetchCertificates(updated.id)
    } else {
      closeDetail()
    }
  }
}

const fleetKPIs = computed(() => {
  const f = fleet.value
  return {
    total: f.length,
    inspOk: f.filter(a => a.lastInspStatus === 'ok').length,
    inspErr: f.filter(a => a.lastInspStatus === 'error').length,
    docErr: f.filter(a => a.docStatus === 'error' || a.docGralStatus === 'error').length,
    docWarn: f.filter(a => (a.docStatus === 'warning' || a.docGralStatus === 'warning') && a.docStatus !== 'error' && a.docGralStatus !== 'error').length
  }
})

const filteredFleet = computed(() => {
  let result = fleet.value
  const q = searchQuery.value.toLowerCase()
  
  if (currentFilter.value === 'insp-ok') result = result.filter(a => a.lastInspStatus === 'ok')
  else if (currentFilter.value === 'insp-error') result = result.filter(a => a.lastInspStatus === 'error')
  else if (currentFilter.value === 'doc-error') result = result.filter(a => a.docStatus === 'error' || a.docGralStatus === 'error')
  else if (currentFilter.value === 'doc-warning') result = result.filter(a => (a.docStatus === 'warning' || a.docGralStatus === 'warning') && a.docStatus !== 'error' && a.docGralStatus !== 'error')
  else if (currentFilter.value === 'critical') result = result.filter(a => a.lastInspStatus === 'error' || a.docStatus === 'error' || a.docGralStatus === 'error')
  
  if (q) {
    result = result.filter(f => 
      f.plate.toLowerCase().includes(q) || 
      f.internalId.toLowerCase().includes(q) ||
      f.brand.toLowerCase().includes(q) ||
      f.model.toLowerCase().includes(q)
    )
  }
  return result
})

const tabs = [
  { id: 'summary', label: 'Centro 360' },
  { id: 'inspections', label: 'Inspecciones' }
]

const assetStats = [
  { label: 'Odómetro', value: '84.500 KM', icon: Gauge },
  { label: 'Combustible', value: '78%', icon: Fuel },
  { label: 'Prox. Rev.', value: '12 May', icon: Calendar },
  { label: 'Situación Taller', value: 'OT Activa', icon: Wrench },
]

const technicalSpecs = computed(() => {
  if (!selectedAsset.value || !selectedAsset.value.specs) return []
  return selectedAsset.value.specs
})



async function fetchCertificates(assetId) {
  isLoadingDocs.value = true
  try {
    const { data: certRes } = await apiAxios.get(`/tequ-equipos/${assetId}/certificados`)
    const certs = certRes?.data || []

    const getStatusFromDate = (dateStr) => {
      if (!dateStr || dateStr === 'S/I') return 2 
      try {
        const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
        const expiry = new Date(y, m - 1, d)
        const now = new Date()
        now.setHours(0,0,0,0)
        
        const diffDays = Math.floor((expiry - now) / (1000 * 60 * 60 * 24))
        
        if (diffDays < 0) return 2 // Vencido
        if (diffDays <= 30) return 1 // Alerta
        return 0 // OK
      } catch (e) { return 2 }
    }

    const legalNames = ['Permiso de Circulación', 'Revisión Técnica', 'SOAP']
    const legalDocs = []
    const generalDocs = []

    certs.forEach(doc => {
      let displayDate = doc.fecha_vencimiento
      if (displayDate) {
        const parts = displayDate.split('T')[0].split('-')
        if (parts.length === 3) displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      
      const status = getStatusFromDate(doc.fecha_vencimiento)
      const mapped = {
        id: doc.id_certificado,
        name: doc.nombre_tipo || doc.name_doc_orig || 'Certificado',
        expiry: displayDate || 'S/I',
        status: status,
        fileId: doc.id_doc,
        fileUrl: doc.id_doc ? `https://servidor.leanglobal.cl/lg-gsp/api/archivo/ver/${doc.id_doc}` : null
      }

      if (legalNames.includes(doc.nombre_tipo)) {
        legalDocs.push(mapped)
      } else {
        generalDocs.push(mapped)
      }
    })

    if (selectedAsset.value) {
      selectedAsset.value.legalDocs = legalDocs
      selectedAsset.value.generalDocs = generalDocs

      const statusMap = { 0: 'ok', 1: 'warning', 2: 'error' }
      
      if (legalDocs.length > 0) {
        const maxLegal = Math.max(...legalDocs.map(d => d.status))
        selectedAsset.value.docStatus = statusMap[maxLegal]
      } else {
        selectedAsset.value.docStatus = 'empty'
      }
      
      if (generalDocs.length > 0) {
        const maxGral = Math.max(...generalDocs.map(d => d.status))
        selectedAsset.value.docGralStatus = statusMap[maxGral]
      } else {
        selectedAsset.value.docGralStatus = 'empty'
      }
      
      const index = fleet.value.findIndex(a => a.id === selectedAsset.value.id)
      if (index !== -1) {
        fleet.value[index].docStatus = selectedAsset.value.docStatus
        fleet.value[index].docGralStatus = selectedAsset.value.docGralStatus
      }
    }
  } catch (error) {
    console.error('Error fetching certificates:', error)
  } finally {
    isLoadingDocs.value = false
  }
}

async function fetchFleet() {
  isLoading.value = true
  try {
    const [equiposRes, surveysRes] = await Promise.all([
      apiAxios.get('/tequ-equipos'),
      apiAxios.get('/servicio/leanglobal/procesosSurveyV3', {
        params: {
          fecha_desde: '2025-01-01',
          fecha_hasta: new Date().toISOString().split('T')[0]
        }
      }).catch(err => {
        console.error('Error fetching surveys:', err)
        return { data: { datos: [] } }
      })
    ])
    
    const fleetItems = equiposRes?.data?.data || []
    const surveyList = surveysRes?.data?.datos || []

    const validSurveys = surveyList.filter(item => 
      Number(item.id_tipo_srv) === 5
    )
    
    fleet.value = fleetItems.map(item => {
      const eqId = item.id_equipo

      const getSurveyEquipmentId = (s) => {
        try {
          if (!s.header_exec) return Number(s.id_proyecto)
          let h = s.header_exec
          if (typeof h === 'string') h = JSON.parse(h)
          if (typeof h === 'string') h = JSON.parse(h)
          return h?.id_equipo_proyecto ? Number(h.id_equipo_proyecto) : Number(s.id_proyecto)
        } catch {
          return Number(s.id_proyecto)
        }
      }

      const assetSurveys = validSurveys
        .filter(s => getSurveyEquipmentId(s) === eqId)
        .sort((a, b) => Number(b.id_survey) - Number(a.id_survey))

      let lastInspStatus = 'error'
      let lastInspText = 'Sin inspecciones'
      let daysSinceLastInsp = null

      if (assetSurveys.length > 0) {
        const latest = assetSurveys[0]
        const dateStr = latest.fecha_real_fin || latest.fecha_real_ini || latest.fecha_plan_ini
        if (dateStr) {
          try {
            const parts = dateStr.split('T')[0].split('-')
            if (parts.length === 3) {
              const [y, m, d] = parts.map(Number)
              const lastDate = new Date(y, m - 1, d)
              const now = new Date()
              now.setHours(0,0,0,0)
              lastDate.setHours(0,0,0,0)
              const diffMs = now - lastDate
              const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
              
              daysSinceLastInsp = diffDays
              lastInspText = `${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
              
              if (diffDays <= 30) {
                lastInspStatus = 'ok'
              } else {
                lastInspStatus = 'warning'
              }
            }
          } catch (e) {
            console.error('Error calculando fecha de inspección:', dateStr, e)
          }
        }
      }
      
      const categoryName = item.nombre_categoria || item.tipo_equipo || 'GRUA'
      
      return {
        id: item.id_equipo,
        projectId: item.id_equipo,
        plate: item.patente?.trim() || 'S/P',
        internalId: item.codigo_interno ? `CÓDIGO: ${item.codigo_interno}` : `ID: ${item.id_equipo}`,
        type: normalizeType(categoryName),
        brand: item.nombre_marca || item.marca || 'N/A',
        model: item.nombre_modelo || item.modelo || 'N/A',
        inspStatus: lastInspStatus,
        lastInspStatus,
        lastInspText,
        daysSinceLastInsp,
        docStatus: item.estado_doc_legal || 'empty',
        docGralStatus: item.estado_doc_gral || 'empty',
        otStatus: 'ok',
        project: item.name_empresa || item.razon_social || 'SAN PABLO', 
        docs: [], 
        legalDocs: [],
        generalDocs: [],
        surveys: assetSurveys,
        specs: [
          { label: 'Año', value: item.ano_fabricacion || 'S/I' },
          { label: 'Categoría', value: categoryName },
          { label: 'Subcategoría', value: item.nombre_subcategoria || 'General' },
          { label: 'Capacidad', value: item.capacidad_maxima ? `${item.capacidad_maxima} ${item.unidad_capacidad || 'TON'}` : 'S/I' },
          { label: 'Número Serie', value: item.numero_serie || 'S/I' },
          { label: 'Empresa', value: item.name_empresa || item.razon_social || 'SAN PABLO' },
          { label: 'Estado', value: item.estado || 'Abierto' }
        ]
      }
    })
    
  } catch (error) {
    console.error('Error fetching fleet:', error)
  } finally {
    isLoading.value = false
  }
}

function normalizeType(name) {
  const n = (name || '').toLowerCase()
  if (n.includes('camion') || n.includes('tracto')) return 'truck'
  if (n.includes('rampla') || n.includes('remolque') || n.includes('cama')) return 'trailer'
  if (n.includes('grua')) return 'crane'
  return 'truck'
}

onMounted(() => {
  fetchFleet()
})

function getSpecIcon(label) {
  const l = label.toLowerCase()
  if (l.includes('año')) return Calendar
  if (l.includes('potencia')) return Fuel
  if (l.includes('tracción')) return MapPin
  if (l.includes('capac')) return Package
  if (l.includes('tara')) return Gauge
  if (l.includes('altura')) return ChevronDown
  if (l.includes('ancho')) return ChevronRight
  if (l.includes('lectura')) return Clock
  return Truck
}

function getIcon(type) {
  if (type === 'truck') return Truck
  if (type === 'trailer') return Package
  if (type === 'crane') return HardDrive
  return Truck
}

function openDetail(asset) {
  selectedAsset.value = asset
  showDetail.value = true
  fetchCertificates(asset.projectId)
}

function closeDetail() {
  showDetail.value = false
  selectedAsset.value = null
}

const showQRModal = ref(false)
const qrDataUrl = ref('')

async function openQR() {
  if (!selectedAsset.value) return
  try {
    showQRModal.value = true
    qrDataUrl.value = ''
    
    const url = `${window.location.origin}/lg-gsp-dev/equipo/${selectedAsset.value.plate}`
    
    qrDataUrl.value = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch (err) {
    console.error('Error generando QR:', err)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'S/I'
  try {
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
  } catch (e) {}
  return dateStr
}

function formatDateString(dateStr) {
  if (!dateStr) return 'S/I'
  try {
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
      const [y, m, d] = parts.map(Number)
      return `${months[m - 1]} ${d}, ${y}`
    }
  } catch (e) {}
  return dateStr
}

function estadoClass(estado) {
  const est = (estado || '').toLowerCase().trim()
  if (est === 'finalizado' || est === 'aprobado' || est === 'ok' || est === 'terminado') {
    return 'state-ok'
  }
  if (est === 'creado' || est === 'pre creado' || est === 'pendiente' || est === 'planificado') {
    return 'state-warning'
  }
  return 'state-neutral'
}

function exportToExcel() {
  const data = filteredFleet.value.map(asset => ({
    'Patente': asset.plate,
    'ID Interno': asset.internalId,
    'Marca': asset.brand,
    'Modelo': asset.model,
    'Última Inspección': asset.lastInspText,
    'Cert. Legal': asset.docStatus.toUpperCase(),
    'Cert. General': asset.docGralStatus.toUpperCase()
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Flota")

  XLSX.writeFile(workbook, `Flota_Transmac_${new Date().toISOString().split('T')[0]}.xlsx`)
}
</script>

<style scoped>
.glass-card {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.03);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
