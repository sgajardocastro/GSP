<template>
  <div class="flex flex-col h-full space-y-4 relative overflow-hidden">
    
    <!-- 🎚️ MONITOR DE VIGILANCIA DE NO EQUIPOS (Collapsible) -->
    <div class="glass-card rounded-2xl border border-zinc-200 dark:border-white/10 transition-all duration-500" :class="[isDashboardOpen ? 'pb-6' : 'pb-0']">
      <div @click="isDashboardOpen = !isDashboardOpen" class="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
        <div class="p-1 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 shrink-0">
          <ChevronUp v-if="isDashboardOpen" class="w-4 h-4 text-emerald-500" />
          <ChevronDown v-else class="w-4 h-4 text-emerald-500" />
        </div>
        <div class="flex items-center gap-4 flex-1">
          <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500">
            <Package class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white italic">Consola de No Equipos 360</h3>
            <p class="text-[10px] text-zinc-500 dark:text-muted-foreground font-black uppercase tracking-tighter opacity-60">Monitoreo Jerárquico: Cliente • Proyecto • Faena / Lugar • Elementos de Seguridad</p>
          </div>
        </div>
        <div v-if="!isDashboardOpen" class="flex items-center gap-6">
           <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span><span class="text-[10px] font-black text-zinc-800 dark:text-white uppercase">Operativos: {{ kpis.ok }}</span></div>
           <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></span><span class="text-[10px] font-black text-zinc-800 dark:text-white uppercase">Alertas: {{ kpis.warning }}</span></div>
           <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-destructive shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span><span class="text-[10px] font-black text-zinc-800 dark:text-white uppercase">Críticos: {{ kpis.critical }}</span></div>
        </div>
      </div>

      <transition name="slide-fade">
        <div v-if="isDashboardOpen" class="px-6 grid grid-cols-1 md:grid-cols-4 gap-4 mt-2 mb-4">
           <!-- TOTAL -->
           <div @click="currentFilter = 'all'" :class="['p-4 rounded-xl border transition-all cursor-pointer group', currentFilter === 'all' ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500' : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.05]']">
             <p class="text-[9px] font-black text-zinc-500 dark:text-white/40 uppercase tracking-widest">Total Elementos</p>
             <h3 class="text-2xl font-black text-zinc-900 dark:text-white">{{ kpis.total }}</h3>
           </div>
           <!-- OPERATIVOS -->
           <div @click="currentFilter = 'ok'" :class="['p-4 rounded-xl border transition-all cursor-pointer group', currentFilter === 'ok' ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500' : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.05]']">
             <p class="text-[9px] font-black text-emerald-600 dark:text-emerald-500/60 uppercase tracking-widest">OPERATIVOS / OK</p>
             <h3 class="text-2xl font-black text-zinc-900 dark:text-white">{{ kpis.ok }}</h3>
           </div>
           <!-- ALERTAS -->
           <div @click="currentFilter = 'warning'" :class="['p-4 rounded-xl border transition-all cursor-pointer group', currentFilter === 'warning' ? 'bg-amber-50 dark:bg-amber-600/20 border-amber-500' : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.05]']">
             <p class="text-[9px] font-black text-amber-600 dark:text-amber-500/60 uppercase tracking-widest">A VENCER / ALERTA</p>
             <h3 class="text-2xl font-black text-zinc-900 dark:text-white">{{ kpis.warning }}</h3>
           </div>
           <!-- CRÍTICOS -->
           <div @click="currentFilter = 'critical'" :class="['p-4 rounded-xl border transition-all cursor-pointer group', currentFilter === 'critical' ? 'bg-red-50 dark:bg-destructive/20 border-red-500 dark:border-destructive' : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.05]']">
             <p class="text-[9px] font-black text-red-600 dark:text-destructive/60 uppercase tracking-widest">CRÍTICOS / RECHAZOS</p>
             <h3 class="text-2xl font-black text-zinc-900 dark:text-white">{{ kpis.critical }}</h3>
           </div>
        </div>
      </transition>
    </div>

    <!-- 🛠️ ESTRUCTURA JERÁRQUICA DE ACORDEONES -->
    <div class="flex-1 glass-card rounded-2xl border border-zinc-200 dark:border-white/10 flex flex-col overflow-hidden">
      
      <!-- Panel de Controles -->
      <div class="px-6 py-4 border-b border-zinc-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/50 dark:bg-white/[0.02]">
        <div class="flex items-center gap-4">
          <!-- Main Tab Selector -->
          <div class="flex items-center bg-zinc-100 dark:bg-zinc-950/80 rounded-xl p-1 border border-zinc-200 dark:border-white/5 mr-2">
             <button 
               @click="activeMainTab = 'matrix'; selectedMatrixCellKey = null; selectedMatrixCellItems = []" 
               :class="['px-4 py-1.5 text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all', activeMainTab === 'matrix' ? 'bg-white dark:bg-emerald-600/30 text-zinc-900 dark:text-emerald-400 border border-zinc-200 dark:border-emerald-500/20 shadow-sm dark:shadow-none' : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white']"
             >
               Matriz de Control V2
             </button>
             <button 
               @click="activeMainTab = 'tree'; activeCategoryKey = null" 
               :class="['px-4 py-1.5 text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all', activeMainTab === 'tree' ? 'bg-white dark:bg-emerald-600/30 text-zinc-900 dark:text-emerald-400 border border-zinc-200 dark:border-emerald-500/20 shadow-sm dark:shadow-none' : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white']"
             >
               Árbol Jerárquico
             </button>
          </div>

          <div class="h-6 w-[1px] bg-zinc-200 dark:bg-white/10 mr-2"></div>

          <div class="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-white/5">
             <button @click="currentFilter = 'all'" :class="['px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all', currentFilter === 'all' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm dark:shadow-none' : 'text-zinc-500 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-white']">Todos</button>
             <button @click="currentFilter = 'critical'" :class="['px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all', currentFilter === 'critical' ? 'bg-red-500/10 dark:bg-destructive/20 text-red-600 dark:text-destructive' : 'text-zinc-500 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-white']">Críticos</button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Filtro de Categoría -->
          <div class="relative">
             <select v-model="categoryFilter" class="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white outline-none focus:border-emerald-500/50 cursor-pointer min-w-[150px] shadow-sm dark:shadow-none">
               <option value="all" class="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">Todas las Categorías</option>
               <option v-for="cat in uniqueCategories" :key="cat" :value="cat" class="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">{{ cat }}</option>
             </select>
          </div>
          
          <div class="relative">
             <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-muted-foreground" />
             <input type="text" v-model="searchQuery" placeholder="BUSCAR POR CÓDIGO O TIPO..." class="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 w-64 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500" />
          </div>

          <button @click="exportToExcel" class="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 border border-emerald-300 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 dark:text-emerald-500 dark:border-emerald-500/30 rounded-lg transition-all group">
            <FileSpreadsheet class="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span class="text-[10px] font-black uppercase tracking-widest">Exportar</span>
          </button>
        </div>
      </div>

      <!-- Árbol de Acordeones -->
      <div v-if="activeMainTab === 'tree'" class="flex-1 overflow-auto p-6 space-y-3">
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4 opacity-50">
           <div class="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
           <p class="text-[10px] font-black uppercase tracking-widest text-emerald-500">Cargando inspecciones...</p>
        </div>

        <div v-else-if="projectsTree.length === 0" class="text-center py-20 text-sm font-semibold text-muted-foreground italic">
           No se encontraron elementos registrados en este período.
        </div>

        <div 
          v-else
          v-for="proj in projectsTree" 
          :key="proj.key"
          class="border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden bg-zinc-50/10 dark:bg-white/[0.01]"
        >
          <!-- Nivel 1: Cliente - Proyecto -->
          <div 
            @click="toggleProject(proj.key)"
            class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition-colors"
            :class="proj.status === 'error' ? 'bg-red-500/[0.02] dark:bg-red-500/[0.02]' : proj.status === 'warning' ? 'bg-amber-500/[0.02] dark:bg-amber-500/[0.02]' : ''"
          >
            <div class="flex items-center gap-4">
              <div class="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5">
                <ChevronUp v-if="expandedProjects.has(proj.key)" class="w-4 h-4 text-zinc-700 dark:text-white/70" />
                <ChevronDown v-else class="w-4 h-4 text-zinc-700 dark:text-white/70" />
              </div>
              <div class="flex flex-col">
                <span class="text-xs font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-widest">Cliente: {{ proj.client }}</span>
                <span class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight mt-0.5">Proyecto / Contrato: {{ proj.project }}</span>
              </div>
            </div>

            <!-- Badge de Alarma Consolidado -->
            <span class="px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest border uppercase"
              :style="proj.status === 'ok' ? 'background-color: #10b981 !important; border-color: #10b981 !important; color: #ffffff !important;' :
                      proj.status === 'warning' ? 'background-color: #f59e0b !important; border-color: #f59e0b !important; color: #ffffff !important;' :
                      'background-color: #ef4444 !important; border-color: #ef4444 !important; color: #ffffff !important; font-weight: 900;'">
              {{ proj.status === 'ok' ? 'OPERATIVO' : proj.status === 'warning' ? 'ALERTA' : 'CRÍTICO (FALLA)' }}
            </span>
          </div>

          <!-- Nivel 2: Faena / Lugar / Ubicación (Dentro del Proyecto) -->
          <div v-show="expandedProjects.has(proj.key)" class="border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-950/20 divide-y divide-zinc-200 dark:divide-white/5">
            <div 
              v-for="loc in proj.locations" 
              :key="proj.key + '|' + loc.name"
              class="p-4"
            >
              <div 
                @click="toggleLocation(proj.key, loc.name)"
                class="flex items-center justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/[0.02] p-2 rounded-lg transition-all"
              >
                <div class="flex items-center gap-3">
                  <component :is="expandedLocations.has(proj.key + '|' + loc.name) ? ChevronUp : ChevronDown" class="w-4 h-4 text-zinc-500 dark:text-slate-500" />
                  <MapPin class="w-4 h-4 text-emerald-500" />
                  <span class="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider">Ubicación / Faena: {{ loc.name }}</span>
                </div>

                <div class="flex items-center gap-3">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0"
                    :style="loc.status === 'ok' ? 'background-color: #10b981 !important; box-shadow: 0 0 6px rgba(16,185,129,0.5) !important;' :
                            loc.status === 'warning' ? 'background-color: #f59e0b !important; box-shadow: 0 0 6px rgba(245,158,11,0.5) !important;' :
                            'background-color: #ef4444 !important; box-shadow: 0 0 6px rgba(239,68,68,0.5) !important;'">
                  </span>
                  <span class="text-[10px] font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-widest">
                    {{ loc.status === 'ok' ? 'Sin observaciones' : loc.status === 'warning' ? 'Inspección desactualizada' : 'Contiene desviaciones' }}
                  </span>
                </div>
              </div>

              <!-- Nivel 3: Categorías de Elementos (Tarjetas en Grilla) -->
              <div v-show="expandedLocations.has(proj.key + '|' + loc.name)" class="mt-4 pl-7 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div 
                    v-for="cat in loc.categories" 
                    :key="cat.name"
                    @click="toggleCategoryItems(proj.key, loc.name, cat.name)"
                    :class="['p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-28 relative overflow-hidden group',
                      activeCategoryKey === (proj.key + '|' + loc.name + '|' + cat.name)
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                        : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                    ]"
                  >
                    <!-- Background Icon reflection -->
                    <component :is="getCategoryIcon(cat.name)" class="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-white/[0.01] group-hover:scale-110 transition-transform pointer-events-none" />

                    <div class="flex items-center justify-between">
                      <div class="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-white/80">
                        <component :is="getCategoryIcon(cat.name)" class="w-4 h-4" />
                      </div>
                      <!-- Semáforo de la categoría -->
                      <span class="w-2 h-2 rounded-full"
                        :style="cat.status === 'ok' ? 'background-color: #10b981 !important; box-shadow: 0 0 5px rgba(16,185,129,0.5) !important;' :
                                cat.status === 'warning' ? 'background-color: #f59e0b !important; box-shadow: 0 0 5px rgba(245,158,11,0.5) !important;' :
                                'background-color: #ef4444 !important; box-shadow: 0 0 5px rgba(239,68,68,0.5) !important;'">
                      </span>
                    </div>

                    <div class="mt-4">
                      <p class="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight">{{ cat.name }}</p>
                      <p class="text-[10px] text-zinc-500 dark:text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                        {{ cat.totalCount }} {{ cat.totalCount === 1 ? 'Elemento' : 'Elementos' }} 
                        <span v-if="cat.criticalCount > 0" class="text-red-600 dark:text-red-400 font-extrabold ml-1">({{ cat.criticalCount }} crt)</span>
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Nivel 4: Lista de Items Individuales (Expandible debajo de las tarjetas) -->
                <div 
                  v-if="activeCategoryKey && activeCategoryKey.startsWith(proj.key + '|' + loc.name)" 
                  v-show="loc.categories.some(c => activeCategoryKey === (proj.key + '|' + loc.name + '|' + c.name))"
                  class="mt-4 p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 space-y-3 animate-in fade-in duration-300"
                >
                  <div class="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-2">
                     <p class="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 tracking-[0.2em] italic">
                       Inventario Detallado: {{ activeCategoryName }} en {{ loc.name }}
                     </p>
                     <button @click="activeCategoryKey = null" class="text-zinc-500 dark:text-slate-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                       <X class="w-4 h-4" />
                     </button>
                  </div>

                  <table class="w-full text-left text-xs">
                     <thead>
                       <tr class="text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-muted-foreground border-b border-zinc-200 dark:border-white/5">
                         <th class="py-2">Código / Sello</th>
                         <th class="py-2">Elemento</th>
                         <th class="py-2 text-center">Última Inspección</th>
                         <th class="py-2 text-center">Vencimiento</th>
                         <th class="py-2 text-center">Estado</th>
                         <th class="py-2 text-right">Ficha 360</th>
                       </tr>
                     </thead>
                     <tbody class="divide-y divide-zinc-200 dark:divide-white/5">
                       <tr v-for="item in activeCategoryItems" :key="item.id" class="hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition-colors h-10">
                         <td class="py-2 font-mono font-bold text-zinc-900 dark:text-white uppercase">{{ item.code }}</td>
                         <td class="py-2 text-zinc-700 dark:text-slate-300">{{ item.name }}</td>
                         <td class="py-2 text-center">
                           <span class="text-[9.5px] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-wider">{{ formatDateString(item.date) }}</span>
                         </td>
                         <td class="py-2 text-center">
                           <span :class="['text-[9.5px] font-black', item.isExpired ? 'text-red-600 dark:text-red-400 font-extrabold animate-pulse' : 'text-zinc-500 dark:text-slate-400']">
                             {{ item.expiry ? formatExpiryDate(item.expiry) : '-' }}
                           </span>
                         </td>
                         <td class="py-2 text-center">
                           <span class="px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase border"
                             :style="item.status === 'ok' ? 'background-color: #10b981 !important; border-color: #10b981 !important; color: #ffffff !important;' :
                                     item.status === 'warning' ? 'background-color: #f59e0b !important; border-color: #f59e0b !important; color: #ffffff !important;' :
                                     'background-color: #ef4444 !important; border-color: #ef4444 !important; color: #ffffff !important; font-weight: 900;'">
                             {{ item.status === 'ok' ? 'CONFORME' : item.status === 'warning' ? 'ALERTA' : 'DESVIACIÓN' }}
                           </span>
                         </td>
                         <td class="py-2 text-right">
                           <button 
                             @click="openDetail(item)"
                             class="p-1 px-3 rounded-lg bg-zinc-100 hover:bg-emerald-600 dark:bg-zinc-800 dark:hover:bg-emerald-600 text-[9px] font-black text-zinc-800 dark:text-white hover:text-white dark:hover:text-white border border-zinc-200 dark:border-white/5 transition-all uppercase tracking-widest"
                           >
                             Ver Ficha
                           </button>
                         </td>
                       </tr>
                     </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Matriz de Control V2 -->
      <div v-if="activeMainTab === 'matrix'" class="flex-1 overflow-auto p-6 space-y-6">
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4 opacity-50">
           <div class="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
           <p class="text-[10px] font-black uppercase tracking-widest text-emerald-500">Cargando inspecciones...</p>
        </div>

        <div v-else-if="matrixLocations.length === 0" class="text-center py-20 text-sm font-semibold text-muted-foreground italic">
           No se encontraron elementos registrados en este período.
        </div>

        <div v-else class="space-y-6">
          <div class="overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#16191f]/40 backdrop-blur-md">
            <table class="w-full border-collapse text-left text-xs">
              <thead>
                <tr class="bg-zinc-100 dark:bg-white/[0.02] text-[9.5px] font-black uppercase tracking-wider text-zinc-600 dark:text-slate-400 border-b border-zinc-200 dark:border-white/10">
                  <th class="p-4 border-r border-zinc-200 dark:border-white/5 w-[35%]">Estructura de Contratos / Faenas</th>
                  <th v-for="cat in uniqueCategories" :key="cat" class="p-4 text-center border-r border-zinc-200 dark:border-white/5 last:border-r-0">
                    <div class="flex items-center justify-center gap-1.5 justify-center">
                      <component :is="getCategoryIcon(cat)" class="w-3.5 h-3.5 text-emerald-500" />
                      <span>{{ cat }}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 dark:divide-white/5 bg-zinc-50/10 dark:bg-zinc-950/20">
                <template v-for="clientGroup in matrixTree" :key="clientGroup.name">
                  <!-- Client Header Row -->
                  <tr class="bg-zinc-100/50 dark:bg-white/[0.02] hover:bg-zinc-200/50 dark:hover:bg-white/[0.03] transition-colors">
                    <td 
                      v-if="collapsedClients.has(clientGroup.name)"
                      class="p-3 font-black text-zinc-900 dark:text-white uppercase tracking-wider cursor-pointer border-b border-zinc-200 dark:border-white/5 select-none border-r border-zinc-200 dark:border-white/5 align-middle w-[35%]"
                      @click="toggleClientCollapse(clientGroup.name)"
                    >
                      <div class="flex items-center gap-3">
                        <component 
                          :is="ChevronRight" 
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
                        <span class="text-[11px] font-black tracking-widest text-zinc-800 dark:text-slate-200">Cliente: {{ clientGroup.name }}</span>
                      </div>
                    </td>
                    <td 
                      v-else
                      :colspan="1 + uniqueCategories.length" 
                      class="p-3 font-black text-zinc-900 dark:text-white uppercase tracking-wider cursor-pointer border-b border-zinc-200 dark:border-white/5 select-none"
                      @click="toggleClientCollapse(clientGroup.name)"
                    >
                      <div class="flex items-center gap-3">
                        <component 
                          :is="ChevronDown" 
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
                        <span class="text-[11px] font-black tracking-widest text-zinc-800 dark:text-slate-200">Cliente: {{ clientGroup.name }}</span>
                      </div>
                    </td>

                    <!-- Cells for collapsed client -->
                    <template v-if="collapsedClients.has(clientGroup.name)">
                      <td 
                        v-for="cat in uniqueCategories" 
                        :key="cat" 
                        class="p-2.5 text-center border-r border-zinc-200 dark:border-white/5 last:border-r-0 align-middle border-b border-zinc-200 dark:border-white/5"
                      >
                        <div 
                          v-if="getClientCellData(clientGroup, cat).status !== 'na'"
                          @click.stop="selectMatrixCell(clientGroup.name + '||', cat, getClientCellData(clientGroup, cat).items)"
                          :class="['w-full h-10 rounded-xl border flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 select-none px-3',
                            selectedMatrixCellKey === (clientGroup.name + '|||' + cat) 
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]' 
                              : getClientCellData(clientGroup, cat).status === 'error'
                                ? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                                : getClientCellData(clientGroup, cat).status === 'warning'
                                  ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 hover:border-amber-500 hover:shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                  : 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 hover:border-emerald-500 hover:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                          ]"
                        >
                          <span class="w-2.5 h-2.5 rounded-full shrink-0"
                            :style="getClientCellData(clientGroup, cat).status === 'error' ? 'background-color: #ef4444 !important; box-shadow: 0 0 8px rgba(239,68,68,0.8) !important;' :
                                    getClientCellData(clientGroup, cat).status === 'warning' ? 'background-color: #f59e0b !important; box-shadow: 0 0 8px rgba(245,158,11,0.8) !important;' :
                                    'background-color: #10b981 !important; box-shadow: 0 0 8px rgba(16,185,129,0.8) !important;'">
                          </span>
                          
                          <span :class="['text-[10px] font-black tracking-tighter',
                            getClientCellData(clientGroup, cat).status === 'error' ? 'text-red-600 dark:text-red-400' :
                            getClientCellData(clientGroup, cat).status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                            'text-emerald-600 dark:text-emerald-400'
                          ]">
                            {{ getClientCellData(clientGroup, cat).status === 'error' ? `(${getClientCellData(clientGroup, cat).criticalCount} crt)` : `(${getClientCellData(clientGroup, cat).totalCount})` }}
                          </span>
                        </div>
                        <div v-else class="text-[10px] text-zinc-300 dark:text-white/10 font-bold opacity-30 select-none">-</div>
                      </td>
                    </template>
                  </tr>
                  
                  <template v-if="!collapsedClients.has(clientGroup.name)">
                    <template v-for="projGroup in clientGroup.projects" :key="projGroup.name">
                      <!-- Project Row -->
                      <tr class="bg-zinc-50/50 dark:bg-white/[0.01] hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td 
                          v-if="collapsedProjects.has(clientGroup.name + '|' + projGroup.name)"
                          class="p-3 pl-8 text-zinc-700 dark:text-slate-300 font-extrabold cursor-pointer border-b border-zinc-200 dark:border-white/5 select-none border-r border-zinc-200 dark:border-white/5 align-middle w-[35%]"
                          @click="toggleProjectCollapse(clientGroup.name, projGroup.name)"
                        >
                          <div class="flex items-center gap-3">
                            <component 
                              :is="ChevronRight" 
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
                            <span class="text-[10.5px] font-black tracking-wider text-zinc-800 dark:text-slate-300">Proyecto: {{ projGroup.name }}</span>
                          </div>
                        </td>
                        <td 
                          v-else
                          :colspan="1 + uniqueCategories.length" 
                          class="p-3 pl-8 text-zinc-700 dark:text-slate-300 font-extrabold cursor-pointer border-b border-zinc-200 dark:border-white/5 select-none"
                          @click="toggleProjectCollapse(clientGroup.name, projGroup.name)"
                        >
                          <div class="flex items-center gap-3">
                            <component 
                              :is="ChevronDown" 
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
                            <span class="text-[10.5px] font-black tracking-wider text-zinc-800 dark:text-slate-300">Proyecto: {{ projGroup.name }}</span>
                          </div>
                        </td>

                        <!-- Cells for collapsed project -->
                        <template v-if="collapsedProjects.has(clientGroup.name + '|' + projGroup.name)">
                          <td 
                            v-for="cat in uniqueCategories" 
                            :key="cat" 
                            class="p-2.5 text-center border-r border-zinc-200 dark:border-white/5 last:border-r-0 align-middle border-b border-zinc-200 dark:border-white/5"
                          >
                            <div 
                              v-if="getProjectCellData(projGroup, cat).status !== 'na'"
                              @click.stop="selectMatrixCell(clientGroup.name + '|' + projGroup.name + '|', cat, getProjectCellData(projGroup, cat).items)"
                              :class="['w-full h-10 rounded-xl border flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 select-none px-3',
                                selectedMatrixCellKey === (clientGroup.name + '|' + projGroup.name + '||' + cat) 
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]' 
                                  : getProjectCellData(projGroup, cat).status === 'error'
                                    ? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                                    : getProjectCellData(projGroup, cat).status === 'warning'
                                      ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 hover:border-amber-500 hover:shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                      : 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 hover:border-emerald-500 hover:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                              ]"
                            >
                              <span class="w-2.5 h-2.5 rounded-full shrink-0"
                                :style="getProjectCellData(projGroup, cat).status === 'error' ? 'background-color: #ef4444 !important; box-shadow: 0 0 8px rgba(239,68,68,0.8) !important;' :
                                        getProjectCellData(projGroup, cat).status === 'warning' ? 'background-color: #f59e0b !important; box-shadow: 0 0 8px rgba(245,158,11,0.8) !important;' :
                                        'background-color: #10b981 !important; box-shadow: 0 0 8px rgba(16,185,129,0.8) !important;'">
                              </span>
                              
                              <span :class="['text-[10px] font-black tracking-tighter',
                                getProjectCellData(projGroup, cat).status === 'error' ? 'text-red-600 dark:text-red-400' :
                                getProjectCellData(projGroup, cat).status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                'text-emerald-600 dark:text-emerald-400'
                              ]">
                                {{ getProjectCellData(projGroup, cat).status === 'error' ? `(${getProjectCellData(projGroup, cat).criticalCount} crt)` : `(${getProjectCellData(projGroup, cat).totalCount})` }}
                              </span>
                            </div>
                            <div v-else class="text-[10px] text-zinc-300 dark:text-white/10 font-bold opacity-30 select-none">-</div>
                          </td>
                        </template>
                      </tr>
                      
                      <template v-if="!collapsedProjects.has(clientGroup.name + '|' + projGroup.name)">
                        <tr 
                          v-for="loc in projGroup.locations" 
                          :key="loc.key" 
                          class="hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-colors border-b border-zinc-200 dark:border-white/5"
                        >
                          <!-- Location Leaf Row (Indented) -->
                          <td class="p-3 pl-16 text-zinc-900 dark:text-white font-bold uppercase tracking-wide border-r border-zinc-200 dark:border-r border-white/5 align-middle">
                            <div class="flex items-center gap-2">
                              <MapPin class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span class="text-[10px] font-extrabold text-zinc-800 dark:text-slate-200">{{ loc.faena }}</span>
                            </div>
                          </td>
                          
                          <!-- Semáforo Categorías (Card cell style matching Image 2 mockup) -->
                          <td 
                            v-for="cat in uniqueCategories" 
                            :key="cat" 
                            class="p-2.5 text-center border-r border-zinc-200 dark:border-white/5 last:border-r-0 align-middle"
                          >
                            <div 
                              v-if="getCellData(loc, cat).status !== 'na'"
                              @click="selectMatrixCell(loc.key, cat, getCellData(loc, cat).items)"
                              :class="['w-full h-10 rounded-xl border flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 select-none px-3',
                                selectedMatrixCellKey === (loc.key + '|' + cat) 
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]' 
                                  : getCellData(loc, cat).status === 'error'
                                    ? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                                    : getCellData(loc, cat).status === 'warning'
                                      ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 hover:border-amber-500 hover:shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                      : 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 hover:border-emerald-500 hover:shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                              ]"
                            >
                              <span class="w-2.5 h-2.5 rounded-full shrink-0"
                                :style="getCellData(loc, cat).status === 'error' ? 'background-color: #ef4444 !important; box-shadow: 0 0 8px rgba(239,68,68,0.8) !important;' :
                                        getCellData(loc, cat).status === 'warning' ? 'background-color: #f59e0b !important; box-shadow: 0 0 8px rgba(245,158,11,0.8) !important;' :
                                        'background-color: #10b981 !important; box-shadow: 0 0 8px rgba(16,185,129,0.8) !important;'">
                              </span>
                              
                              <span :class="['text-[10px] font-black tracking-tighter',
                                getCellData(loc, cat).status === 'error' ? 'text-red-600 dark:text-red-400' :
                                getCellData(loc, cat).status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                'text-emerald-600 dark:text-emerald-400'
                              ]">
                                {{ getCellData(loc, cat).status === 'error' ? `(${getCellData(loc, cat).criticalCount} crt)` : `(${getCellData(loc, cat).totalCount})` }}
                              </span>
                            </div>
                            <div v-else class="text-[10px] text-zinc-300 dark:text-white/10 font-bold opacity-30 select-none">-</div>
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
            class="p-5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-300"
          >
            <div class="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-3">
              <div class="space-y-0.5">
                <p class="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-[0.2em] italic">
                  Detalle del Cuadrante Seleccionado
                </p>
                <h4 class="text-xs font-bold text-zinc-900 dark:text-white uppercase">
                  Ubicación: {{ selectedMatrixLocationName }} &bull; Categoría: {{ selectedMatrixCategoryName }}
                </h4>
              </div>
              <button @click="selectedMatrixCellKey = null; selectedMatrixCellItems = []" class="text-zinc-500 dark:text-slate-500 hover:text-zinc-900 dark:hover:text-white transition-colors p-1 rounded-lg bg-zinc-100 dark:bg-white/5">
                <X class="w-4 h-4" />
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-muted-foreground border-b border-zinc-200 dark:border-white/5">
                    <th class="py-2">Código / Sello</th>
                    <th class="py-2">Elemento</th>
                    <th class="py-2 text-center">Última Inspección</th>
                    <th class="py-2 text-center">Vencimiento</th>
                    <th class="py-2 text-center">Estado</th>
                    <th class="py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-200 dark:divide-white/5">
                  <tr v-for="item in selectedMatrixCellItems" :key="item.id" class="hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition-colors h-10">
                    <td class="py-2 font-mono font-bold text-zinc-900 dark:text-white uppercase">{{ item.code }}</td>
                    <td class="py-2 text-zinc-700 dark:text-slate-300">{{ item.name }}</td>
                    <td class="py-2 text-center">
                      <span class="text-[9.5px] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-wider">{{ formatDateString(item.date) }}</span>
                    </td>
                    <td class="py-2 text-center">
                      <span :class="['text-[9.5px] font-black', item.isExpired ? 'text-red-600 dark:text-red-400 font-extrabold animate-pulse' : 'text-zinc-500 dark:text-slate-400']">
                        {{ item.expiry ? formatExpiryDate(item.expiry) : '-' }}
                      </span>
                    </td>
                    <td class="py-2 text-center">
                      <span class="px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase border"
                        :style="item.status === 'ok' ? 'background-color: #10b981 !important; border-color: #10b981 !important; color: #ffffff !important;' :
                                item.status === 'warning' ? 'background-color: #f59e0b !important; border-color: #f59e0b !important; color: #ffffff !important;' :
                                'background-color: #ef4444 !important; border-color: #ef4444 !important; color: #ffffff !important; font-weight: 900;'">
                        {{ item.status === 'ok' ? 'CONFORME' : item.status === 'warning' ? 'ALERTA' : 'DESVIACIÓN' }}
                      </span>
                    </td>
                    <td class="py-2 text-right">
                      <button 
                        @click="openDetail(item)"
                        class="p-1 px-3 rounded-lg bg-zinc-100 hover:bg-emerald-600 dark:bg-zinc-800 dark:hover:bg-emerald-600 text-[9px] font-black text-zinc-800 dark:text-white hover:text-white dark:hover:text-white border border-zinc-200 dark:border-white/5 transition-all uppercase tracking-widest"
                      >
                        Ver Ficha 360
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 📑 MODAL PANORÁMICO DE DETALLE 360 -->
    <transition name="fade">
      <div v-if="showDetail && selectedItem" class="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
        <div @click="closeDetail" class="absolute inset-0 bg-zinc-950/70 backdrop-blur-md"></div>
        
        <div class="relative w-[98%] h-[96vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[2.5rem] shadow-[0_0_150px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
          
          <!-- Header Panorámico -->
          <div class="px-10 py-6 border-b border-zinc-200 dark:border-white/5 bg-gradient-to-r from-emerald-600/5 via-emerald-500/5 to-transparent flex items-center justify-between shrink-0">
            <div class="flex items-center gap-8">
              <div class="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shadow-lg relative">
                <component :is="getCategoryIcon(selectedItem.category)" class="w-8 h-8 text-emerald-500 relative z-10" />
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-4">
                  <h2 class="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{{ selectedItem.name }}</h2>
                  <div class="flex gap-2">
                    <span class="px-3 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[10px] font-black border border-emerald-500/20 uppercase tracking-[0.2em]">{{ selectedItem.code }}</span>
                    <span :class="['px-4 py-1 rounded text-[10px] font-black border uppercase tracking-[0.2em]', 
                      selectedItem.status === 'ok' ? 'state-ok' :
                      selectedItem.status === 'warning' ? 'state-warning' :
                      'state-critical']">
                      {{ selectedItem.status === 'ok' ? 'OPERATIVO' : selectedItem.status === 'warning' ? 'CON OBSERVACIÓN' : 'CRÍTICO / RECHAZADO' }}
                    </span>
                  </div>
                </div>
                <p class="text-[11px] font-bold text-zinc-500 dark:text-muted-foreground uppercase tracking-[0.3em] opacity-80 ml-1 italic">
                  UBICACIÓN: {{ selectedItem.location }} • PROYECTO: {{ selectedItem.nombreProyecto }} • CLIENTE: {{ selectedItem.cliente }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-6">
              <button @click="closeDetail" class="group flex items-center gap-3 px-5 py-3 rounded-xl bg-zinc-100 hover:bg-destructive/10 hover:text-destructive dark:bg-white/5 dark:hover:bg-destructive/20 dark:hover:text-destructive transition-all border border-zinc-200 dark:border-white/5">
                <span class="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-white/50">Cerrar Consola</span>
                <X class="w-5 h-5 group-hover:rotate-90 text-zinc-600 dark:text-white transition-transform" />
              </button>
            </div>
          </div>

          <!-- Body Panorámico -->
          <div class="flex-1 overflow-hidden flex">
            
            <!-- Sidebar (Ficha Técnica del Elemento) -->
            <div class="w-80 border-r border-zinc-200 dark:border-white/5 p-8 bg-zinc-50 dark:bg-zinc-950/50 space-y-8 overflow-y-auto scrollbar-hide shrink-0 shadow-2xl">
              
              <div class="space-y-1 pb-4 border-b border-zinc-200 dark:border-white/5">
                <h4 class="text-lg font-black text-zinc-900 dark:text-white italic tracking-tighter">{{ selectedItem.code }}</h4>
                <p class="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.3em]">{{ selectedItem.category }}</p>
              </div>

              <div class="space-y-6">
                <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-white/20 italic">Atributos Técnicos</h4>
                
                <div class="space-y-2.5 px-0">
                  <div class="flex justify-between items-center border-b border-zinc-100 dark:border-white/5 pb-1.5 group">
                    <span class="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">Nombre</span>
                    <span class="text-[10px] font-black text-zinc-900 dark:text-white italic uppercase tracking-tight text-right leading-tight max-w-[150px]">{{ selectedItem.name }}</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-zinc-100 dark:border-white/5 pb-1.5 group">
                    <span class="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">Categoría</span>
                    <span class="text-[10px] font-black text-zinc-900 dark:text-white italic uppercase tracking-tight">{{ selectedItem.category }}</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-zinc-100 dark:border-white/5 pb-1.5 group">
                    <span class="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">Código</span>
                    <span class="text-[10px] font-black text-zinc-900 dark:text-white italic uppercase tracking-tight font-mono">{{ selectedItem.code }}</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-zinc-100 dark:border-white/5 pb-1.5 group">
                    <span class="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">Ubicación</span>
                    <span class="text-[10px] font-black text-zinc-900 dark:text-white italic uppercase tracking-tight text-right leading-tight max-w-[150px]">{{ selectedItem.location }}</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-zinc-100 dark:border-white/5 pb-1.5 group">
                    <span class="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">Vencimiento</span>
                    <span class="text-[10px] font-black text-zinc-900 dark:text-white italic uppercase tracking-tight font-mono">{{ selectedItem.expiry ? formatExpiryDate(selectedItem.expiry) : 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-zinc-100 dark:border-white/5 pb-1.5 group">
                    <span class="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">Últ. Chequeo</span>
                    <span class="text-[10px] font-black text-zinc-900 dark:text-white italic uppercase tracking-tight font-mono">{{ formatDateString(selectedItem.date) }}</span>
                  </div>
                </div>
              </div>

              <!-- Estado de Vencimiento (Alerta) -->
              <div class="pt-4 space-y-4" v-if="selectedItem.expiry">
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-100 dark:bg-white/5">
                    <span class="text-[9px] font-black text-zinc-500 dark:text-white/40 uppercase">DÍAS RESTANTES</span>
                    <span class="text-xs font-black" :class="daysUntilExpiry <= 0 ? 'text-red-600 dark:text-red-500' : daysUntilExpiry <= 30 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'">
                      {{ daysUntilExpiry <= 0 ? 'VENCIDO' : `${daysUntilExpiry} Días` }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 flex flex-col overflow-hidden bg-zinc-50/30 dark:bg-zinc-900/50">
              <div class="px-10 pt-8 flex gap-12 border-b border-zinc-200 dark:border-white/5 shrink-0 overflow-x-auto scrollbar-hide">
                <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id" :class="['text-[11px] font-black uppercase tracking-[0.35em] pb-6 transition-all relative shrink-0', activeTab === t.id ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white']">
                  {{ t.label }}
                  <span v-if="activeTab === t.id" class="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t-full shadow-[0_-5px_15px_rgba(16,185,129,0.5)]"></span>
                </button>
              </div>

              <div class="flex-1 overflow-y-auto p-10 scrollbar-hide">
                <!-- CENTRO 360 -->
                <div v-if="activeTab === 'summary'" class="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                   
                   <!-- Historial de Inspecciones -->
                   <div class="space-y-8">
                      <h5 class="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.45em] flex items-center gap-4 opacity-50 italic">
                         <span class="w-8 h-[1px] bg-emerald-500"></span>
                         Historial de Inspección
                      </h5>
                      <div class="relative space-y-6 pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-[1px] before:bg-zinc-200 dark:before:bg-white/10">
                        <div v-for="(survey, idx) in selectedItemHistory" :key="survey.id_survey" class="relative group/step">
                           <div class="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-white/10 flex items-center justify-center transition-all group-hover/step:border-emerald-500 z-10 shadow-lg">
                             <div class="w-1.5 h-1.5 rounded-full" :class="idx === 0 ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-white/20'"></div>
                           </div>
                           <div class="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/[0.05] transition-all flex justify-between items-center">
                            <div>
                              <span class="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest block mb-1">{{ formatDateString(survey.fecha_real_fin || survey.fecha_real_ini) }}</span>
                              <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight italic">{{ survey.name_template_srv || 'Checklist' }}</p>
                              <p class="text-[10px] text-zinc-500 dark:text-muted-foreground uppercase mt-2 opacity-80 leading-relaxed font-bold tracking-widest">
                                Inspector: {{ survey.nombre_user || 'Sin asignar' }} &bull; Estado: {{ survey.estado_srv }}
                              </p>
                            </div>
                            <button @click="abrirVisorWeb(survey.id_survey)" class="p-2.5 rounded-xl bg-zinc-100 text-zinc-500 hover:text-white hover:bg-emerald-600 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-emerald-600/20 transition-all border border-zinc-200 dark:border-white/5">
                              <Eye class="w-4 h-4" />
                            </button>
                           </div>
                        </div>
                      </div>
                   </div>

                   <!-- Últimas Desviaciones / Observaciones -->
                   <div class="space-y-8">
                      <h5 class="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.45em] flex items-center gap-4 opacity-50 italic">
                         <span class="w-8 h-[1px] bg-amber-500"></span>
                         Detalle de la última inspección
                      </h5>
                      
                      <div class="p-6 rounded-2xl border bg-white dark:bg-white/[0.02]" :class="selectedItem.hasDeviation ? 'border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5' : 'border-zinc-200 dark:border-white/5'">
                        <div class="flex items-center gap-3 mb-4">
                          <div :class="['p-2 rounded-xl border', selectedItem.hasDeviation ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500']">
                            <AlertTriangle v-if="selectedItem.hasDeviation" class="w-4 h-4" />
                            <CheckCircle v-else class="w-4 h-4" />
                          </div>
                          <div>
                            <p class="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">Estado de la última revisión</p>
                            <p class="text-[9px] font-black uppercase text-zinc-500 dark:text-muted-foreground tracking-widest mt-0.5">
                              {{ selectedItem.hasDeviation ? 'Contiene desviaciones' : 'Aprobado sin observaciones' }}
                            </p>
                          </div>
                        </div>

                        <!-- Checkboxes específicos si están disponibles -->
                        <div class="space-y-2 mt-4" v-if="latestInspectionChecks.length > 0">
                          <p class="text-[9px] font-black uppercase text-zinc-400 dark:text-white/30 tracking-widest mb-2">Checks Evaluados:</p>
                          <div v-for="chk in latestInspectionChecks" :key="chk.label" class="flex justify-between items-center border-b border-zinc-100 dark:border-white/5 pb-2">
                            <span class="text-[10px] font-medium text-zinc-700 dark:text-slate-300 pr-4 leading-normal">{{ chk.label }}</span>
                            <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase border shrink-0"
                              :style="chk.value === 'C' || chk.value === 'si' ? 'background-color: #10b981 !important; border-color: #10b981 !important; color: #ffffff !important;' :
                                      chk.value === 'NC' || chk.value === 'no' ? 'background-color: #ef4444 !important; border-color: #ef4444 !important; color: #ffffff !important; font-weight: 900;' :
                                      'background-color: #71717a !important; border-color: #71717a !important; color: #ffffff !important;'">
                              {{ chk.value === 'C' || chk.value === 'si' ? 'CONFORME' : chk.value === 'NC' || chk.value === 'no' ? 'NO CONFORME' : 'N/A' }}
                            </span>
                          </div>
                        </div>
                        <div v-else class="text-xs text-zinc-500 dark:text-muted-foreground italic mt-2">
                          No hay detalles específicos estructurados para esta categoría.
                        </div>
                        
                        <!-- Observaciones generales -->
                        <div class="mt-6 pt-4 border-t border-zinc-200 dark:border-white/5" v-if="selectedItem.rawItem?.observacionesGenerales || selectedItem.rawItem?.observaciones">
                          <p class="text-[9px] font-black uppercase text-zinc-400 dark:text-white/30 tracking-widest mb-1.5">Observaciones Generales:</p>
                          <p class="text-xs text-zinc-600 dark:text-slate-300 italic bg-zinc-100 dark:bg-zinc-950/40 p-3 rounded-lg border border-zinc-200 dark:border-white/5 leading-relaxed">
                            {{ selectedItem.rawItem.observacionesGenerales || selectedItem.rawItem.observaciones }}
                          </p>
                        </div>
                      </div>
                   </div>
                </div>

                <!-- HISTORIAL DE SURVEYS -->
                <div v-if="activeTab === 'inspections'" class="space-y-3 animate-in fade-in duration-500">
                   <div v-for="item in selectedItemHistory" :key="item.id_survey" class="px-8 py-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex items-center justify-between hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all group hover:bg-zinc-50 dark:hover:bg-white/[0.04] shadow-sm">
                      <div class="flex items-center gap-12">
                        <div class="text-center w-16">
                           <p class="text-2xl font-black text-zinc-300 dark:text-white/30 leading-none tracking-tighter italic">#{{ item.id_survey }}</p>
                           <p class="text-[10px] font-black text-zinc-500 dark:text-muted-foreground uppercase opacity-60 mt-1 italic">{{ formatDateString(item.fecha_real_fin || item.fecha_real_ini).split(',')[0] }}</p>
                        </div>
                        <div class="h-10 w-[1px] bg-zinc-200 dark:bg-white/10"></div>
                        <div>
                          <p class="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic group-hover:text-emerald-500 transition-colors">{{ item.name_template_srv || 'Inspección' }}</p>
                          <div class="flex items-center gap-6 mt-2">
                             <p class="text-[10px] font-bold text-zinc-500 dark:text-muted-foreground uppercase tracking-widest opacity-80 italic">OPERADOR: {{ item.nombre_user || 'SIN REGISTRO' }}</p>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-8">
                        <div class="flex flex-col items-end">
                           <span class="px-5 py-2 rounded-xl text-[10px] font-black border uppercase tracking-[0.25em]" :class="estadoClass(item.estado_srv)">
                             {{ item.estado_srv || 'PENDIENTE' }}
                           </span>
                        </div>
                        <button @click="abrirVisorWeb(item.id_survey)" class="p-3 rounded-xl bg-zinc-100 text-zinc-500 hover:text-white hover:bg-emerald-600 dark:bg-white/5 dark:text-muted-foreground dark:hover:text-white dark:hover:bg-emerald-600 transition-all border border-zinc-200 dark:border-white/5 group-hover:scale-105">
                          <Eye class="w-5 h-5" />
                        </button>
                      </div>
                   </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </transition>

    <!-- Modal Visor Web Survey -->
    <VerSurveyModal
      v-model="showVisorModal"
      :id-survey="visorSurveyId"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import * as XLSX from 'xlsx'
import apiAxios from '@/services/api'
import VerSurveyModal from '@/components/VerSurveyModal.vue'
import { getMockSurveys } from '@/data/mockSurveys'
import { 
  Package, Search, Eye, FileSpreadsheet, X, ChevronDown, ChevronUp, ChevronRight, CheckCircle, AlertTriangle, 
  MapPin, Calendar, Wrench, Shield, ShieldCheck, Heart, Radio, AppWindow, Folder, FolderOpen
} from 'lucide-vue-next'

const isLoading = ref(true)
const isDashboardOpen = ref(true)
const rawSurveys = ref([])
const showDetail = ref(false)
const selectedItem = ref(null)
const activeTab = ref('summary')
const currentFilter = ref('all') 
const searchQuery = ref('')
const categoryFilter = ref('all')

const expandedProjects = ref(new Set())
const expandedLocations = ref(new Set())
const activeCategoryKey = ref(null)

const showVisorModal = ref(false)
const visorSurveyId = ref(null)

const tabs = [
  { id: 'summary', label: 'Consola 360' },
  { id: 'inspections', label: 'Historial' }
]

// V2 Matrix Dashboard State
const activeMainTab = ref('matrix')
const selectedMatrixCellKey = ref(null)
const selectedMatrixCellItems = ref([])
const selectedMatrixLocationName = ref('')
const selectedMatrixCategoryName = ref('')

const collapsedClients = ref(new Set())
const collapsedProjects = ref(new Set())

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
      // Client only
      selectedMatrixLocationName.value = `Cliente: ${parts[0]}`
    } else if (parts[2] === '') {
      // Client > Project
      selectedMatrixLocationName.value = `Cliente: ${parts[0]} > Proyecto: ${parts[1]}`
    } else {
      // Client > Project > Location
      selectedMatrixLocationName.value = `${parts[0]} > ${parts[1]} > ${parts[2]}`
    }
    selectedMatrixCategoryName.value = categoryName
  }
}

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

function estadoClass(estado) {
  const value = String(estado || '').toLowerCase()
  if (value.includes('pre')) return 'state-warning'
  if (value.includes('ejec')) return 'state-info'
  if (value.includes('verif')) return 'state-purple'
  if (value.includes('creado') || value.includes('terminado') || value.includes('aprobado') || value.includes('ok')) return 'state-ok'
  return 'state-neutral'
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
      if (v === 'nc' || v === 'no') {
        return true
      }
    } else if (typeof val === 'object') {
      if (checkObjectForDeviations(val)) return true
    }
  }
  
  return false
}

function extractItemsFromSurvey(survey) {
  const items = []
  if (!survey.body_exec) return items

  let body = survey.body_exec
  try {
    if (typeof body === 'string') body = JSON.parse(body)
    if (typeof body === 'string') body = JSON.parse(body)
  } catch (e) {
    return items
  }

  const date = survey.fecha_real_fin || survey.fecha_real_ini || survey.fecha_plan_ini || survey.fecha
  const idSurvey = survey.id_survey
  const idProyecto = survey.id_proyecto
  const nombreProyecto = survey.nombre_proyecto || survey.name_template_srv || 'Checklist'
  const cliente = survey.name_empresa_cliente || 'Cliente Transmac'
  const estadoSurvey = survey.estado_srv

  if (!body.segmentos) return items

  body.segmentos.forEach(seg => {
    if (!seg.attributes) return
    seg.attributes.forEach(attr => {
      const type = attr.type

      // Extintores Calama / Los Andes
      if (type === 'checkListTransmacExtintoresCalama' || type === 'checkListTransmacExtintoresLosAndes') {
        const rows = Array.isArray(attr.body) ? attr.body : []
        rows.forEach((row, idx) => {
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
            idProyecto,
            nombreProyecto,
            cliente,
            estadoSurvey,
            rawItem: attr,
            rowItem: row
          })
        })
      }

      // CheckListExtintorCdch
      else if (type === 'checkListExtintorCdch') {
        const componentes = Array.isArray(attr.componentes) ? attr.componentes : []
        const identificacion = attr.identificacion || {}
        const desc = attr.descripcionEquipo || {}
        const itemCode = desc.numeroInterno || 'S/N'
        const location = identificacion.lugar || 'Ubicación General'

        let hasDeviation = false
        componentes.forEach(comp => {
          if (comp.days && Object.values(comp.days).includes('no')) {
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
          idProyecto,
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      // Grilletes
      else if (type === 'checkListGrilleteCdch') {
        const componentes = Array.isArray(attr.componentes) ? attr.componentes : []
        const identificacion = attr.identificacion || {}
        const desc = attr.descripcionEquipo || {}
        const itemCode = desc.codificacion || 'S/N'
        const location = identificacion.lugar || 'Ubicación General'

        let hasDeviation = false
        componentes.forEach(comp => {
          if (comp.days && Object.values(comp.days).includes('no')) {
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
          idProyecto,
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      // Retráctiles
      else if (type === 'checkListRetractilCdch') {
        const componentes = Array.isArray(attr.componentes) ? attr.componentes : []
        const identificacion = attr.identificacion || {}
        const desc = attr.descripcionEquipo || {}
        const itemCode = `${desc.marca || ''} ${desc.modelo || ''}`.trim()
        const location = identificacion.lugar || 'Ubicación General'

        let hasDeviation = false
        componentes.forEach(comp => {
          if (comp.days && Object.values(comp.days).includes('no')) {
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
          idProyecto,
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      // Eslingas Tubulares
      else if (type === 'checkListEslingasTubularesCdch') {
        const desc = attr.descripcion || {}
        const itemCode = `${desc.largo || ''} FS:${desc.factorSeguridad || ''}`.trim()
        const location = 'Ubicación General'

        let hasDeviation = false
        const condiciones = Array.isArray(attr.condiciones) ? attr.condiciones : []
        condiciones.forEach(c => {
          if (c.days && Object.values(c.days).includes('no')) {
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
          idProyecto,
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      // Arnés de Seguridad DMH
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
          idProyecto,
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      // EPP Respirador / EPR DMH
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
          idProyecto,
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }

      // Comunicacion Radial / Comunicacion Radial DMH
      else if (type === 'checkListComunicacionRadial' || type === 'checkListComunicacionRadialDmh') {
        const datos = attr.datos || {}
        const itemCode = datos.marcaModelo || 'Radio'
        const location = datos.especialidad || 'Ubicación General'

        let hasDeviation = false
        const rows = Array.isArray(attr.body) ? attr.body : []
        rows.forEach(r => {
          if (r.days && Object.values(r.days).includes('no')) {
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
          idProyecto,
          nombreProyecto,
          cliente,
          estadoSurvey,
          rawItem: attr,
          rowItem: attr
        })
      }
      
      // Fallback genérico para checklists
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
          idProyecto,
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

const consolidatedItemsList = computed(() => {
  const itemsMap = new Map()

  rawSurveys.value.forEach(survey => {
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

const uniqueCategories = computed(() => {
  const cats = consolidatedItemsList.value.map(i => i.category)
  return [...new Set(cats)].sort()
})

const filteredItems = computed(() => {
  let list = consolidatedItemsList.value
  const q = searchQuery.value.toLowerCase().trim()

  // Filtro por KPI de cabecera
  if (currentFilter.value === 'ok') {
    list = list.filter(i => i.status === 'ok')
  } else if (currentFilter.value === 'warning') {
    list = list.filter(i => i.status === 'warning')
  } else if (currentFilter.value === 'critical') {
    list = list.filter(i => i.status === 'error')
  }

  // Filtro por categoría de la barra
  if (categoryFilter.value !== 'all') {
    list = list.filter(i => i.category === categoryFilter.value)
  }

  // Búsqueda general
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

// JERARQUÍA CORRECTA: Cliente -> Proyecto -> Faena/Lugar -> Categoría -> Items
const projectsTree = computed(() => {
  const list = filteredItems.value
  const groups = {}
  
  list.forEach(item => {
    const clientName = item.cliente || 'Otros Clientes'
    const projName = item.nombreProyecto || 'Proyecto General'
    const locationName = item.location || 'Ubicación General'
    const catName = item.category || 'Otros'
    
    // Llave única para nivel 1 (Cliente - Proyecto)
    const key = `${clientName} - ${projName}`
    
    if (!groups[key]) {
      groups[key] = {
        key,
        client: clientName,
        project: projName,
        locations: {}
      }
    }
    
    if (!groups[key].locations[locationName]) {
      groups[key].locations[locationName] = {
        name: locationName,
        categories: {}
      }
    }
    
    if (!groups[key].locations[locationName].categories[catName]) {
      groups[key].locations[locationName].categories[catName] = []
    }
    
    groups[key].locations[locationName].categories[catName].push(item)
  })
  
  // Transformar objetos agrupados a arrays ordenados y resolver rollup de alarmas
  return Object.values(groups).map(projGroup => {
    const locationsArr = Object.values(projGroup.locations).map(locGroup => {
      const categoriesArr = Object.entries(locGroup.categories).map(([catName, items]) => {
        let catStatus = 'ok'
        let criticalCount = 0
        let warningCount = 0
        let okCount = 0
        
        items.forEach(i => {
          if (i.status === 'error') {
            catStatus = 'error'
            criticalCount++
          } else if (i.status === 'warning') {
            if (catStatus !== 'error') catStatus = 'warning'
            warningCount++
          } else {
            okCount++
          }
        })
        
        return {
          name: catName,
          status: catStatus,
          criticalCount,
          warningCount,
          okCount,
          totalCount: items.length,
          items
        }
      }).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
      
      let locStatus = 'ok'
      categoriesArr.forEach(c => {
        if (c.status === 'error') locStatus = 'error'
        else if (c.status === 'warning' && locStatus !== 'error') locStatus = 'warning'
      })
      
      return {
        name: locGroup.name,
        status: locStatus,
        categories: categoriesArr
      }
    }).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
    
    let projStatus = 'ok'
    locationsArr.forEach(l => {
      if (l.status === 'error') projStatus = 'error'
      else if (l.status === 'warning' && projStatus !== 'error') projStatus = 'warning'
    })
    
    return {
      key: projGroup.key,
      client: projGroup.client,
      project: projGroup.project,
      status: projStatus,
      locations: locationsArr
    }
  }).sort((a, b) => a.key.localeCompare(b.key, 'es', { sensitivity: 'base' }))
})

// KPI GLOBALES CONSOLIDADAS
const kpis = computed(() => {
  const list = consolidatedItemsList.value
  return {
    total: list.length,
    ok: list.filter(i => i.status === 'ok').length,
    warning: list.filter(i => i.status === 'warning').length,
    critical: list.filter(i => i.status === 'error').length
  }
})

// MANEJO DE SELECCIÓN DE CATEGORÍA ACTIVA
const activeCategoryName = ref('')
const activeCategoryItems = ref([])

function toggleCategoryItems(projectKey, locationName, categoryName) {
  const targetKey = `${projectKey}|${locationName}|${categoryName}`
  if (activeCategoryKey.value === targetKey) {
    activeCategoryKey.value = null
    activeCategoryName.value = ''
    activeCategoryItems.value = []
  } else {
    activeCategoryKey.value = targetKey
    activeCategoryName.value = categoryName
    
    // Buscar los items de esta categoría en la estructura
    const pNode = projectsTree.value.find(p => p.key === projectKey)
    const lNode = pNode?.locations.find(l => l.name === locationName)
    const cNode = lNode?.categories.find(c => c.name === categoryName)
    activeCategoryItems.value = cNode ? cNode.items : []
  }
}

// MANEJO DE COLAPSABLES
function toggleProject(key) {
  if (expandedProjects.value.has(key)) {
    expandedProjects.value.delete(key)
  } else {
    expandedProjects.value.add(key)
  }
}

function toggleLocation(projectKey, locName) {
  const key = `${projectKey}|${locName}`
  if (expandedLocations.value.has(key)) {
    expandedLocations.value.delete(key)
  } else {
    expandedLocations.value.add(key)
  }
}

// SELECCIÓN Y MODAL
const selectedItemHistory = computed(() => {
  return selectedItem.value ? selectedItem.value.history : []
})

const latestInspectionChecks = computed(() => {
  if (!selectedItem.value) return []
  
  const raw = selectedItem.value.rowItem || {}
  const checks = []

  if (raw.checks && typeof raw.checks === 'object') {
    const checkLabels = [
      'Carga completa y operable',
      'Placa / Legibilidad del cilindro',
      'Sello de seguridad',
      'Pasador de seguridad',
      'Pintura y estado exterior',
      'Sin abolladuras ni oxidación',
      'Manguera de descarga',
      'Boquilla y uniones firmes',
      'Válvula y manijas',
      'Manómetro operable',
      'Presión en rango',
      'Señalización libre de obstáculos',
      'Protección de intemperie (gabinete)'
    ]
    Object.entries(raw.checks).forEach(([key, val]) => {
      const idx = Number(key.replace('c_', ''))
      if (Number.isFinite(idx) && checkLabels[idx]) {
        checks.push({
          label: checkLabels[idx],
          value: val
        })
      }
    })
  } else if (Array.isArray(raw.componentes)) {
    raw.componentes.forEach(comp => {
      const days = comp.days || {}
      let latestVal = ''
      const keys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7']
      for (const k of keys) {
        if (days[k]) latestVal = days[k]
      }
      checks.push({
        label: comp.label || comp.description || 'Punto evaluado',
        value: latestVal
      })
    })
  } else if (Array.isArray(raw.condiciones)) {
    raw.condiciones.forEach(cond => {
      const days = cond.days || {}
      let latestVal = ''
      const keys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7']
      for (const k of keys) {
        if (days[k]) latestVal = days[k]
      }
      checks.push({
        label: cond.label || 'Condición evaluada',
        value: latestVal
      })
    })
  } else if (Array.isArray(raw.body)) {
    raw.body.forEach(r => {
      const days = r.days || {}
      let latestVal = ''
      const keys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7']
      for (const k of keys) {
        if (days[k]) latestVal = days[k]
      }
      checks.push({
        label: r.label || 'Revisión radial',
        value: latestVal
      })
    })
  }

  return checks
})

const daysUntilExpiry = computed(() => {
  return selectedItem.value ? selectedItem.value.daysUntilExpiry : 999
})

async function fetchSurveysData() {
  isLoading.value = true
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/procesosSurveyV3', {
      params: {
        fecha_desde: '2025-01-01',
        fecha_hasta: new Date().toISOString().split('T')[0]
      }
    })
    
    const surveyList = data?.datos || []
    const apiSurveys = surveyList.filter(s => 
      [1, 2, 4, 6].includes(Number(s.id_tipo_srv))
    )
    rawSurveys.value = [...apiSurveys, ...getMockSurveys()]
  } catch (error) {
    console.error('Error fetching surveys for Vista360Otras, falling back to static mock data:', error)
    rawSurveys.value = getMockSurveys()
  } finally {
    isLoading.value = false
  }
}

function openDetail(item) {
  selectedItem.value = item
  activeTab.value = 'summary'
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedItem.value = null
}

function abrirVisorWeb(idSurvey) {
  visorSurveyId.value = idSurvey
  showVisorModal.value = true
}

function exportToExcel() {
  const list = filteredItems.value
  if (!list.length) return

  const data = list.map(item => ({
    Cliente: item.cliente,
    Proyecto: item.nombreProyecto,
    Ubicación: item.location,
    Categoría: item.category,
    Elemento: item.name,
    Código: item.code,
    'Última Inspección': formatDateString(item.date),
    Vencimiento: item.expiry || 'N/A',
    Estado: item.status === 'ok' ? 'OPERATIVO' : item.status === 'warning' ? 'ALERTA' : 'CRÍTICO'
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "No Equipos 360")
  XLSX.writeFile(workbook, `No_Equipos_360_${new Date().toISOString().split('T')[0]}.xlsx`)
}

onMounted(() => {
  fetchSurveysData()
})
</script>

<style scoped>
.glass-card {
  backdrop-filter: blur(12px);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
