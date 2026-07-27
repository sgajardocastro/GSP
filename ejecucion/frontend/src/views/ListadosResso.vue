<template>
  <div class="flex flex-col xl:flex-row items-start gap-6 relative p-4 lg:p-6 bg-[#0a0a0a] min-h-screen text-white">
    
    <!-- SIDEBAR: HISTORIAL -->
    <div class="w-full xl:w-80 xl:sticky top-6 shrink-0 bg-[#141414] border border-white/10 rounded-2xl flex flex-col shadow-2xl xl:max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide no-print">
      <div class="p-5 border-b border-white/5 sticky top-0 bg-[#141414]/95 backdrop-blur-sm z-10 flex items-center justify-between">
        <h2 class="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
          <History class="w-4 h-4" /> Historial
        </h2>
        <span class="bg-white/5 text-white/50 text-[10px] font-bold px-2 py-0.5 rounded-full">{{ pastEvaluations.length }}</span>
      </div>
      <div class="px-4 pb-4 overflow-y-auto flex-1 text-center mt-4">
        <button @click="createNewInforme" class="w-full border border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 rounded-xl p-3 text-[11px] font-black uppercase mb-4 transition-all">
          + Nuevo Informe
        </button>
        <div class="flex flex-col gap-1">
          <div v-for="informe in pastEvaluations" :key="informe.id" @click="loadInforme(informe)" 
               :class="activeInformeId === informe.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'border-transparent'" 
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer hover:bg-white/5 transition-all">
            <FileText :class="informe.id % 2 === 0 ? 'text-amber-500' : 'text-emerald-500'" class="w-4 h-4 shadow-sm" />
            <div class="flex-1 min-w-0 flex flex-col text-left">
              <span class="text-[11px] font-bold truncate uppercase tracking-tight text-white/90">{{ informe.month }}</span>
              <span class="text-[9px] font-black opacity-40 uppercase tracking-widest">{{ informe.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="flex-1 min-w-0 space-y-6 w-full no-print">
      
      <!-- Header Adaptive -->
      <div :class="isScrolled ? 'py-2 bg-zinc-950 border-emerald-500/30' : 'py-6 bg-background border-white/5'" class="flex flex-col gap-1 sticky top-0 z-50 transition-all duration-300 border-b shadow-2xl -mx-2 px-2">
        <div class="flex items-center justify-between px-6">
          <div class="flex items-center gap-4">
            <div :class="isScrolled ? 'w-8 h-8' : 'w-12 h-12'" class="bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center transition-all duration-300">
              <FileCheck :class="isScrolled ? 'w-4 h-4' : 'w-6 h-6'" class="text-emerald-500 transition-all" />
            </div>
            <div>
              <h1 :class="isScrolled ? 'text-sm' : 'text-2xl'" class="font-black tracking-tighter text-white uppercase italic transition-all duration-300">Auditoría RESSO EECC</h1>
              <p v-if="!isScrolled" class="text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 italic animate-in fade-in slide-in-from-top-1">Reporte de Cumplimiento y Hallazgos Críticos</p>
            </div>
          </div>
          
          <div class="flex gap-3">
            <template v-if="!isReadOnly">
              <button @click="handleSave('Borrador')" class="bg-zinc-900 border border-emerald-500/20 text-emerald-500/60 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-500 transition-all flex items-center gap-2">
                <ClipboardList class="w-3 h-3" /> Guardar
              </button>
              <button @click="prepararFirma" class="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2">
                <Zap class="w-3 h-3 text-black" /> <span class="text-black text-xs font-black">Finalizar y Firmar</span>
              </button>
            </template>
            <template v-else>
              <button v-if="urlStoredPdf" @click="openStoredPdf" class="bg-zinc-900 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all flex items-center gap-2">
                <FileText class="w-3 h-3" /> Ver PDF Oficial
              </button>
              <button @click="reabrirInforme" class="bg-amber-500 hover:bg-amber-600 text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                <Plus class="w-3 h-3 text-black rotate-45" /> <span class="text-black text-xs font-black">Reabrir Edición</span>
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- ANTECEDENTES -->
      <div class="bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500">
        <button @click="collapsedHeader = !collapsedHeader" class="w-full bg-white/5 px-6 py-4 flex items-center gap-3 border-b border-white/5 outline-none hover:bg-white/10 transition-colors text-left uppercase">
          <div class="p-1 rounded-lg bg-white/5 border border-white/10">
            <ChevronUp v-if="!collapsedHeader" class="w-4 h-4 text-emerald-400" />
            <ChevronDown v-else class="w-4 h-4 text-emerald-400" />
          </div>
          <h2 class="text-[11px] font-black text-emerald-500 tracking-widest italic flex-1">Antecedentes Generales de la Auditoría</h2>
        </button>

        <div v-show="!collapsedHeader" class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-6 animate-in fade-in duration-300">
           <div v-for="(field, label) in { 'Versión': 'version', 'División': 'division', 'N° Contrato': 'num', 'Fecha': 'fecha', 'Empresa': 'empresa', 'Admin EECC': 'admin', 'APR EECC': 'apr' }" :key="label" class="border-b border-white/10 pb-1.5 group transition-all">
             <span class="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-1 group-hover:text-emerald-500/50 transition-colors">{{ label }}</span>
             <input type="text" v-model="formInfo[field]" :disabled="isReadOnly" class="w-full bg-transparent text-xs font-bold text-white/90 outline-none uppercase font-mono">
           </div>
           <div class="lg:col-span-2 border-b border-white/10 pb-1.5 group">
             <span class="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-1 group-hover:text-emerald-500/50 transition-colors">Nombre del Servicio</span>
             <input type="text" v-model="formInfo.servicio" :disabled="isReadOnly" class="w-full bg-transparent text-xs font-bold text-white/90 outline-none focus:text-emerald-400 transition-colors uppercase">
           </div>
        </div>
      </div>

      <!-- TABS SELECTOR -->
      <div class="flex gap-3 p-1.5 bg-[#141414] border border-white/10 rounded-2xl w-fit shadow-lg px-3">
        <button v-for="tab in [{id:'eval', name:'Evaluación RESSO EECC', icon:FileCheck}, {id:'sigo', name:'SIGO', icon:Activity}]" :key="tab.id"
          @click="activeTab = tab.id" 
          :class="activeTab === tab.id ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white/60'" 
          class="py-3 px-6 rounded-xl border transition-all duration-300 flex items-center gap-3 group">
          
          <component :is="tab.icon" :class="activeTab === tab.id ? 'text-emerald-500' : 'text-white/20'" class="w-4 h-4 transition-transform group-hover:scale-110" />
          <span class="text-[10px] font-black uppercase tracking-widest leading-none">{{ tab.name }}</span>
          
          <div v-if="tab.id === 'eval'" 
                :class="activeTab === tab.id ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30'"
                class="ml-auto text-[9px] font-black px-2 py-0.5 rounded border-2 transition-colors tabular-nums min-w-[35px] text-center">
            {{ getRESSOStats().answered }}/{{ getRESSOStats().total }}
          </div>
          <div v-else 
                :class="activeTab === tab.id ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30'"
                class="ml-auto text-[9px] font-black px-2 py-0.5 rounded border-2 transition-colors tabular-nums min-w-[35px] text-center">
            {{ getSIGOStats().answered }}/{{ getSIGOStats().total }}
          </div>
        </button>
      </div>

      <!-- VIEW RENDERER -->
      <div class="relative min-h-[600px]">
        
        <!-- TAB 1: EVALUACIÓN RESSO -->
        <div v-if="activeTab === 'eval'" class="space-y-6 pt-2 animate-in slide-in-from-bottom-4 duration-500">
          <!-- Compliance Chart -->
          <div class="bg-[#141414] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <button @click="collapsedChart = !collapsedChart" class="w-full bg-white/5 px-6 py-4 flex items-center gap-4 transition-colors border-b border-white/5 outline-none hover:bg-white/10">
              <BarChart3 class="w-4 h-4 text-emerald-500" />
              <h2 class="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2"> Resumen de Cumplimiento RESSO</h2>
              <ChevronUp v-if="!collapsedChart" class="w-5 h-5 text-emerald-400 ml-auto" />
              <ChevronDown v-else class="w-5 h-5 text-emerald-400 ml-auto" />
            </button>
            <div v-show="!collapsedChart" class="px-8 py-8 space-y-5 animate-in fade-in duration-300">
              <div v-for="dim in ressoDimensions" :key="dim.id" class="flex items-center gap-10 group">
                <div class="w-72 flex items-center gap-5 shrink-0">
                  <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[11px] font-black text-emerald-500 shadow-inner">{{ dim.id }}</div>
                  <p class="text-[10px] font-bold text-white/80 uppercase tracking-tight leading-tight">{{ dim.name }}</p>
                </div>
                <div class="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                  <div class="h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)]" :style="{ width: `${dim.value}%`, background: getGradient(dim.value) }"></div>
                </div>
                <span class="text-sm font-black text-emerald-400 w-14 text-right italic tabular-nums">{{ dim.value }}%</span>
              </div>
            </div>
          </div>

          <div v-for="point in pointsData" :key="point.id" class="space-y-6">
            <button @click="point.collapsed = !point.collapsed" class="w-full px-6 py-4 bg-emerald-500/10 border-l-[6px] border-emerald-500 rounded-r-2xl flex items-center gap-5 hover:bg-emerald-500/20 transition-all outline-none text-left shadow-lg">
              <ChevronUp v-if="!point.collapsed" class="w-6 h-6 text-emerald-400" />
              <ChevronDown v-else class="w-6 h-6 text-emerald-400" />
              <h2 class="text-[14px] font-black text-emerald-400 uppercase tracking-[0.25em] drop-shadow-sm">{{ point.title }}</h2>
            </button>

            <div v-show="!point.collapsed" class="space-y-5 px-6 animate-in slide-in-from-top-2 duration-300">
              <div v-for="cat in point.dimensions" :key="cat.id" class="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-xl overflow-hidden group/cat">
                <button @click="toggleCat(cat.id)" class="w-full px-5 py-3 flex items-center bg-cyan-900/30 border-b border-cyan-800/30 hover:bg-cyan-900/50 transition-all outline-none">
                  <div class="flex items-center gap-5 flex-1">
                    <ChevronUp v-if="isExpanded(cat.id)" class="w-4 h-4 text-cyan-400" />
                    <ChevronDown v-else class="w-4 h-4 text-cyan-400" />
                    <div class="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-sm italic shadow-inner">{{ cat.id }}</div>
                    <h3 class="text-[13px] font-black text-white/90 uppercase tracking-wider text-left leading-tight shadow-sm">{{ cat.name }}</h3>
                  </div>
                  <div class="flex items-center gap-6">
                    <div class="flex flex-col items-end">
                      <span class="text-[9px] font-black uppercase text-cyan-500/40 tracking-widest mb-1 italic">Score</span>
                      <input 
                        type="number" 
                        v-model.number="cat.score" 
                        min="0"
                        max="100"
                        step="0.1"
                        @click.stop 
                        :readonly="(cat.questions && cat.questions.length > 0) || isReadOnly"
                        :disabled="isReadOnly"
                        :class="[
                          'w-20 border rounded-xl px-3 py-1.5 text-right text-xs font-black shadow-inner outline-none transition-all',
                          (cat.questions && cat.questions.length > 0) || isReadOnly
                            ? 'bg-black/20 border-white/5 text-cyan-400/50 cursor-not-allowed' 
                            : 'bg-black/60 border-cyan-500/40 text-cyan-400'
                        ]"
                       >
                    </div>
                  </div>
                </button>

                <div v-show="isExpanded(cat.id)" class="bg-background/10 divide-y divide-white/5 animate-in fade-in duration-300">
                  <div v-for="q in cat.questions" :key="q.id" class="px-8 py-3.5 flex items-center justify-between hover:bg-white/5 transition-all gap-8">
                    <p class="text-[12px] font-bold text-white/80 pr-6 flex-1">
                      <span class="text-emerald-500 mr-2 font-black italic underline decoration-emerald-500/30">{{ q.id }}</span>
                      {{ q.text }}
                    </p>
                    <input 
                      type="number" 
                      v-model.number="q.val" 
                      min="0"
                      max="100"
                      step="0.1"
                      :disabled="isReadOnly"
                      class="w-20 bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-right text-xs font-black text-emerald-500 outline-none shadow-inner disabled:opacity-50" 
                      placeholder="%"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: SIGO -->
        <div v-if="activeTab === 'sigo'" class="space-y-6 pt-2 animate-in slide-in-from-left-4 duration-500">
          
          <!-- SIGO Compliance Chart -->
          <div class="bg-[#141414] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <button @click="collapsedSigoChart = !collapsedSigoChart" class="w-full bg-white/5 px-6 py-4 flex items-center gap-4 transition-colors border-b border-white/5 outline-none hover:bg-white/10">
              <BarChart3 class="w-4 h-4 text-emerald-500" />
              <h2 class="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2"> Resumen de Cumplimiento SIGO</h2>
              <ChevronUp v-if="!collapsedSigoChart" class="w-5 h-5 text-emerald-400 ml-auto" />
              <ChevronDown v-else class="w-5 h-5 text-emerald-400 ml-auto" />
            </button>
            <div v-show="!collapsedSigoChart" class="px-8 py-8 space-y-5 animate-in fade-in duration-300">
              <div v-for="dim in sigoDimensions" :key="dim.id" class="flex items-center gap-10 group">
                <div class="w-72 flex items-center gap-5 shrink-0">
                  <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[11px] font-black text-emerald-500 shadow-inner">{{ dim.id }}</div>
                  <p class="text-[10px] font-bold text-white/80 uppercase tracking-tight leading-tight">{{ dim.name }}</p>
                </div>
                <div class="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                  <div class="h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)]" :style="{ width: `${dim.value}%`, background: getGradient(dim.value) }"></div>
                </div>
                <span class="text-sm font-black text-emerald-400 w-14 text-right italic tabular-nums">{{ dim.value }}%</span>
              </div>
            </div>
          </div>

          <div v-for="point in sigoData" :key="point.id" class="space-y-6">
            <button @click="point.collapsed = !point.collapsed" class="w-full px-6 py-4 bg-emerald-500/10 border-l-[6px] border-emerald-500 rounded-r-2xl flex items-center gap-5 hover:bg-emerald-500/20 transition-all outline-none text-left shadow-lg">
              <ChevronUp v-if="!point.collapsed" class="w-6 h-6 text-emerald-400" />
              <ChevronDown v-else class="w-6 h-6 text-emerald-400" />
              <h2 class="text-[14px] font-black text-emerald-400 uppercase tracking-[0.25em] drop-shadow-sm">{{ point.title }}</h2>
            </button>

            <div v-show="!point.collapsed" class="space-y-5 px-6 animate-in slide-in-from-top-2 duration-300">
              <div v-for="cat in point.dimensions" :key="cat.id" class="bg-[#141414] border border-white/10 rounded-2xl shadow-xl overflow-hidden group/sigo">
                <button @click="toggleCat(cat.id)" class="w-full px-6 py-4 flex items-center bg-cyan-900/40 border-b border-cyan-800/30 hover:bg-cyan-900/50 transition-all outline-none">
                  <div class="flex items-center gap-5 flex-1 text-left">
                    <ChevronUp v-if="isExpanded(cat.id)" class="w-5 h-5 text-cyan-400" />
                    <ChevronDown v-else class="w-5 h-5 text-cyan-400" />
                    <div class="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-lg italic shadow-inner">{{ cat.id }}</div>
                    <h3 class="text-[14px] font-black text-white uppercase tracking-wider leading-tight">{{ cat.name }}</h3>
                  </div>
                  <div class="flex items-center gap-6">
                    <div class="flex flex-col items-end">
                      <span class="text-[10px] font-black uppercase text-cyan-500/40 tracking-widest mb-1">Avance (%)</span>
                      <input 
                        type="number" 
                        v-model.number="cat.progress" 
                        min="0" max="100" step="0.1"
                        @click.stop 
                        :readonly="(cat.questions && cat.questions.length > 0) || isReadOnly"
                        :disabled="isReadOnly"
                        :class="[
                          'w-20 border rounded-xl px-2 py-1.5 text-right text-xs font-black shadow-inner outline-none transition-all',
                          (cat.questions && cat.questions.length > 0) || isReadOnly
                            ? 'bg-black/20 border-white/5 text-cyan-400/50 cursor-not-allowed' 
                            : 'bg-black/60 border-cyan-500/40 text-cyan-400'
                        ]"
                      >
                    </div>
                  </div>
                </button>

                <div v-show="isExpanded(cat.id)" class="bg-[#0f0f0f]/50 animate-in fade-in duration-300">
                  <div class="px-6 py-4 space-y-4">
                    <div v-for="item in cat.questions" :key="item.id" class="animate-in fade-in duration-300">
                      <!-- Sub Header Rendering -->
                      <div v-if="item.subHeader" class="bg-white/5 -mx-6 px-6 py-2 text-[11px] font-bold text-cyan-500/80 uppercase tracking-tight border-y border-white/5 italic mb-4">
                        {{ item.subHeader }}
                      </div>

                      <div class="flex items-start justify-between gap-6 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                        <div class="flex-1 flex gap-4">
                          <span class="text-emerald-500 font-black italic text-sm shrink-0">{{ item.id }}</span>
                          <p class="text-[12.5px] font-bold text-white/90 leading-relaxed">{{ item.text }}</p>
                        </div>
                        <div class="flex flex-col items-end">
                          <input type="number" v-model.number="item.val" :disabled="isReadOnly" class="w-20 bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-right text-xs font-black text-emerald-400 outline-none shadow-inner disabled:opacity-50" placeholder="%">
                        </div>
                      </div>
                    </div>

                    <div class="pt-6 border-t border-white/10">
                       <label class="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block italic">Observaciones Dimensión {{ cat.id }}:</label>
                       <textarea v-model="cat.obs" :disabled="isReadOnly" rows="2" class="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-[11px] font-medium text-white/80 outline-none focus:border-cyan-500/30 transition-all resize-none disabled:opacity-50" placeholder="Ingresar hallazgos..."></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- REPORTE COMPLETO PRINT -->
    <div class="print-only p-8 bg-white text-black">
      <div class="mb-8 border-b-2 border-emerald-500 pb-4">
        <h1 class="text-2xl font-black uppercase">Auditoría RESSO EECC / SIGO</h1>
        <p class="text-sm font-bold text-gray-600">Empresa: {{ formInfo.empresa }} | División: {{ formInfo.division }} | Período: {{ formInfo.periodo }}</p>
      </div>

      <!-- RESSO REPORT -->
      <div class="mb-12">
        <h2 class="text-xl font-black bg-gray-200 p-3 mb-6 uppercase border-l-4 border-emerald-500">I. Evaluación RESSO EECC</h2>
        <div v-for="point in pointsData" :key="'p'+point.id" class="mb-8">
          <h3 class="text-lg font-bold text-emerald-700 mb-3">{{ point.title }}</h3>
          <div v-for="cat in point.dimensions" :key="'c'+cat.id" class="mb-6 ml-4 break-inside-avoid">
            <h4 class="text-sm font-bold bg-gray-100 p-2 mb-2 flex justify-between">
              <span>{{ cat.id }}. {{ cat.name }}</span>
              <span>Score: {{ cat.score }}%</span>
            </h4>
            <table v-if="cat.questions && cat.questions.length > 0" class="w-full text-xs border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-300">
                  <th class="p-2 text-left w-16">Item ID</th>
                  <th class="p-2 text-left">Requisito</th>
                  <th class="p-2 text-center w-20">Valor (%)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="q in cat.questions" :key="'q'+q.id" class="break-inside-avoid">
                  <td class="p-2 font-bold align-top">{{ q.id }}</td>
                  <td class="p-2 align-top">{{ q.text }}</td>
                  <td class="p-2 text-center font-bold align-top">{{ q.val }}%</td>
                </tr>
              </tbody>
            </table>
            <div v-if="cat.obs" class="mt-2 text-xs italic text-gray-600 bg-yellow-50 p-2 border-l-2 border-yellow-400">
              Observaciones: {{ cat.obs }}
            </div>
          </div>
        </div>
      </div>

      <!-- SIGO REPORT -->
      <div class="mb-12" style="page-break-before: always;">
        <h2 class="text-xl font-black bg-gray-200 p-3 mb-6 uppercase border-l-4 border-cyan-500">II. Evaluación SIGO</h2>
        <div v-for="point in sigoData" :key="'sp'+point.id" class="mb-8">
          <h3 class="text-lg font-bold text-cyan-700 mb-3">{{ point.title }}</h3>
          <div v-for="cat in point.dimensions" :key="'sc'+cat.id" class="mb-6 ml-4 break-inside-avoid">
            <h4 class="text-sm font-bold bg-gray-100 p-2 mb-2 flex justify-between">
              <span>{{ cat.id }}. {{ cat.name }}</span>
              <span>Avance: {{ cat.progress }}%</span>
            </h4>
            <table v-if="cat.questions && cat.questions.length > 0" class="w-full text-xs border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-300">
                  <th class="p-2 text-left w-16">Item ID</th>
                  <th class="p-2 text-left">Pregunta</th>
                  <th class="p-2 text-center w-20">Avance (%)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="q in cat.questions" :key="'sq'+q.id" class="break-inside-avoid">
                  <td class="p-2 font-bold align-top">{{ q.id }}</td>
                  <td class="p-2 align-top">
                    <div v-if="q.subHeader" class="text-[10px] font-bold text-cyan-700 uppercase mb-1">{{ q.subHeader }}</div>
                    {{ q.text }}
                  </td>
                  <td class="p-2 text-center font-bold align-top">{{ q.val }}%</td>
                </tr>
              </tbody>
            </table>
            <div v-if="cat.obs" class="mt-2 text-xs italic text-gray-600 bg-yellow-50 p-2 border-l-2 border-yellow-400">
              Observaciones: {{ cat.obs }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SELECTOR MODAL -->
    <SelectorAuditoriaModal 
      v-model="showSelectorModal" 
      auditType="RESSO"
      @confirm="onSelectionConfirm"
    />

    <!-- Modal de Firma FES -->
    <FirmaFesModal 
      v-model="showSignatureModal"
      :pdf-url="signaturePdfUrl"
      :id-doc="signatureIdDoc"
      :origen-path="signatureOrigenPath"
      :destino-folder="signatureDestinoFolder"
      :user="loggedInUser"
      rol-nombre="Auditor RESSO"
      @firmado="ejecutarCierreReporte"
    />



  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { apiAxios, sstAxios } from '@/services/api'
import { History, FileCheck, FileText, BarChart3, ChevronUp, ChevronDown, X, ClipboardList, Zap, Activity, Plus, Loader2 } from 'lucide-vue-next'
import SelectorAuditoriaModal from '@/components/SelectorAuditoriaModal.vue'
import FirmaFesModal from '@/components/FirmaFesModal.vue'

// Ciclo de Vida y Estados
const estadoInforme = ref('Borrador')
const urlStoredPdf = ref(null)
const isReadOnly = computed(() => estadoInforme.value === 'Finalizado' || estadoInforme.value === 'TERMINADO')

// Diálogo de Firma FES
const showSignatureModal = ref(false)
const signaturePdfUrl = ref('')
const signatureIdDoc = ref(null)
const signatureOrigenPath = ref('')
const signatureDestinoFolder = ref('/u05/LeanDocs/transmac/sst/resso_informes/')
const loggedInUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

// Helpers for PostgreSQL array columns
const formatPostgresArray = (arr) => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "{}"
  return `{${arr.map(item => `"${item.replace(/"/g, '\\"')}"`).join(',')}}`
}

const parsePostgresArray = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    if (val.startsWith('{') && val.endsWith('}')) {
      const content = val.slice(1, -1).trim()
      if (!content) return []
      return content.split(',').map(item => {
        let clean = item.trim()
        if (clean.startsWith('"') && clean.endsWith('"')) {
          clean = clean.slice(1, -1)
        }
        return clean.replace(/\\"/g, '"')
      }).filter(Boolean)
    }
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed
    } catch(e) {}
  }
  return []
}

const activeInformeId = ref('new')
const activeTab = ref('eval')
const isScrolled = ref(false)
const collapsedChart = ref(false)
const collapsedSigoChart = ref(false)
const collapsedHeader = ref(false)
const expandedCats = reactive(new Set(['B', 'C', 'D']))
const showSelectorModal = ref(false)
const loading = ref(false)

onMounted(() => {
  window.onscroll = () => { isScrolled.value = window.scrollY > 50 }
  fetchAudits()
})
onUnmounted(() => { window.onscroll = null })

const toggleCat = (id) => expandedCats.has(id) ? expandedCats.delete(id) : expandedCats.add(id)
const isExpanded = (id) => expandedCats.has(id)
const getGradient = (v) => v >= 95 ? '#10b981' : (v >= 80 ? '#f59e0b' : '#ef4444')

const formInfo = reactive({
  version: '01', division: 'Chuquicamata', empresa: '', servicio: '',
  num: '', admin: '-', apr: '-', fecha: new Date().toISOString().split('T')[0],
  periodo: ''
})

const pastEvaluations = ref([])

const fetchAudits = async () => {
  try {
    const { data } = await sstAxios.get(`/audits?type=RESSO&_t=${Date.now()}`)
    if (Array.isArray(data)) {
      pastEvaluations.value = data.map(a => ({
        id: a.id,
        month: a.periodo || 'S/F',
        score: `${Math.round(a.total_score || 0)}%`,
        status: a.status || 'Borrador',
        fullData: a
      }))
    }
  } catch (err) { console.error(err) }
}



const pointsData = reactive([
  {
    id: "I", collapsed: false, title: "I. REQUERIMIENTOS PARA IMPLEMENTAR UN SIGO PARA EMPRESAS CONTRATISTAS Y SUBCONTRATISTAS DE CODELCO",
    dimensions: [
      { id: 'A', name: "SISTEMA DE GESTION DE SEGURIDAD Y SALUD EN EL TRABAJO (TITULO IV)", score: 0, questions: [], obs: "", photos: [] },
      { id: 'B', name: "PROGRAMA DE SEGURIDAD Y SALUD EN EL TRABAJO (TITULO V RESSO)", score: 0, questions: [
        { id: 'B.1', text: "Contenidos del Programa de Seguridad y Salud en el Trabajo", val: 0, obs: "", photos: [] },
        { id: 'B.2', text: "Elementos del Programa (Establecimiento de objetivos y metas)", val: 0, obs: "", photos: [] },
        { id: 'B.3', text: "Planificación y Administración del Sistema de Gestión (Identificación y cumplimiento del marco regulatorio)", val: 0, obs: "", photos: [] },
        { id: 'B.4', text: "Planificación y Administración del Sistema de Gestión (Proceso de identificación de Peligros, Evaluación y Control de Riesgos)", val: 0, obs: "", photos: [] },
        { id: 'B.5', text: "Estandarización de los controles operacionales", val: 0, obs: "", photos: [] },
        { id: 'B.6', text: "Preparación y Respuesta ante emergencias", val: 0, obs: "", photos: [] }
      ], obs: "", photos: [] },
      { id: 'C', name: "IMPLEMENTACION Y OPERACIÓN (TITULO VI RESSO)", score: 0, questions: [
        { id: 'C.1', text: "Obligación de Informar / ODI", val: 0, obs: "", photos: [] },
        { id: 'C.2', text: "Participación de los trabajadores", val: 0, obs: "", photos: [] },
        { id: 'C.3', text: "Documentación que debe mantener la empresa principal.", val: 0, obs: "", photos: [] },
        { id: 'C.4', text: "Libro de Obra o de Servicios o Libro de Obra Digital (LOD)", val: 0, obs: "", photos: [] },
        { id: 'C.5', text: "Libro SERNAGEOMIN", val: 0, obs: "", photos: [] },
        { id: 'C.6', text: "Control y actualización de documentos y datos de Seguridad y Salud en el Trabajo", val: 0, obs: "", photos: [] },
        { id: 'C.7', text: "Estándares de control operacional", val: 0, obs: "", photos: [] }
      ], obs: "", photos: [] },
      { id: 'D', name: "RESULTADOS DE FISCALIZACIONES INTERNAS Y EXTERNAS (TITULO VII RESSO)", score: 0, questions: [
        { id: 'D.1', text: "Registro y seguimiento de instrucciones", val: 0, obs: "", photos: [] },
        { id: 'D.2', text: "Calificación de Empresas Contratistas y Subcontratistas", val: 0, obs: "", photos: [] }
      ], obs: "", photos: [] },
      { id: 'E', name: "PROCEDIMIENTOS EN CASO DE ACCIDENTES E INCIDENTES (TITULO VIII RESSO)", score: 0, questions: [
        { id: 'E.1', text: "Informe de Accidentes Graves, Fatales y de Alto Potencial", val: 0, obs: "", photos: [] }
      ], obs: "", photos: [] },
      { id: 'F', name: "OBLIGACIONES DE LAS EMPRESAS (Título IX Y X RESSO)", score: 0, questions: [], obs: "", photos: [] }
    ]
  },
  {
    id: "II", collapsed: false, title: "II. REQUERIMIENTOS PARA LA IMPLEMENTACIÓN Y OPERACIÓN (OTROS REQUISITOS RELEVANTES DEL SIGO)",
    dimensions: [
      { id: 'G', name: "Medidas de Prevención Especiales (Título XI RESSO)", score: 0, questions: [ { id: 'G.1', text: "Avisos Escritos", val: 0, obs: "", photos: [] } ], obs: "", photos: [] },
      { id: 'H', name: "Estándares Mínimos (Título XII RESSO)", score: 0, questions: [ { id: 'H.1', text: "Estándares Corporativos", val: 0, obs: "", photos: [] } ], obs: "", photos: [] },
      { id: 'I', name: "Comités Paritarios de Higiene y Seguridad (Título XIII RESSO)", score: 0, questions: [ { id: 'I.1', text: "De los Comités Paritarios de faena", val: 0, obs: "", photos: [] } ], obs: "", photos: [] },
      { id: 'J', name: "Estadística e Información (Título XIV RESSO)", score: 0, questions: [], obs: "", photos: [] },
      { id: 'K', name: "Infracciones o Faltas de los Contratistas (Título XV y XVI)", score: 0, questions: [], obs: "", photos: [] }
    ]
  }
])

const sigoData = reactive([
  {
    id: "I", collapsed: false, title: "I. REQUERIMIENTOS PARA IMPLEMENTAR UN SIGO PARA EMPRESAS CONTRATISTAS Y SUBCONTRATISTAS DE CODELCO",
    dimensions: [
      { id: 'A', name: "SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO (TÍTULO IV)", progress: 0, obs: "", questions: [
        { id: '1.', text: "¿Cuenta la empresa contratista con un sistema de gestión de Seguridad y Salud en el Trabajo, certificado en la norma OHSAS 18.001 o ISO 45001, asociada al alcance de la obra o servicios prestados específicamente a la división o VP?", val: 0 }
      ]},
      { id: 'B', name: "PROGRAMA DE SEGURIDAD Y SALUD EN EL TRABAJO (TÍTULO V RESSO)", progress: 0, obs: "", questions: [
        { id: '2.', subHeader: "B.1 Contenidos del Programa de Seguridad y Salud en el Trabajo", text: "¿En la elaboración del Programa de Seguridad y Salud en el Trabajo de la empresa, se consideró los enunciados de la Política Corporativa de Gestión de Seguridad, Salud en el Trabajo y Riesgos Operacionales de Codelco (Descrita en el Título I RESSO V9)?", val: 0 },
        { id: '3.', text: "¿Esta Política Corporativa se dio a conocer a todos los trabajadores de la contratista y subcontratistas? ¿Se cuenta con evidencia de ello?", val: 0 },
        { id: '4.', subHeader: "B.2 Elementos del Programa (Establecimiento de objetivos y metas)", text: "¿El programa definido para el cumplimiento de los objetivos y metas consistentes en la política de seguridad y salud ocupacional, cuenta con indicadores de desempeño, responsables, recursos y plazos consistentes con la criticidad de las actividades definidas, así como también con los 7 Elementos del Sistema de Gestión de Seguridad y Salud en el Trabajo u Ocupacional de CODELCO?", val: 0 },
        { id: '5.', subHeader: "B.3 Planificación y Administración del Sistema de Gestión (Identificación y cumplimiento del marco regulatorio)", text: "¿La empresa cuenta con una metodología formal para la identificación y evaluación del marco regulatorio legal que aplica a sus procesos identificando nivel de cumplimiento, programas de brechas y monitoreo?", val: 0 },
        { id: '6.', subHeader: "B.4 Planificación y Administración del Sistema de Gestión (Proceso de identificación de Peligros, Evaluación y Control de Riesgos)", text: "¿El programa de seguridad cuenta con un registro de identificación de peligros y la evaluación de riesgos actualizado acorde a las actividades del contrato y está en concordancia con la Carta Gantt del contrato?", val: 0 },
        { id: '7.', text: "¿El programa de SST cuenta con la validación previa, por parte del organismo Administrador del seguro correspondiente? ¿Además, está suscrito por el representante legal y por el administrador de la empresa contratista?", val: 0 },
        { id: '8.', text: "¿La empresa cuenta con la identificación de los GES (Grupo de Exposición Similar), con listado de expuestos y Programa de Vigilancia Medica, en coordinación con el organismo administrador del seguro?", val: 0 },
        { id: '9.', text: "¿Cuenta la empresa contratista con Mapas de Riesgo de Higiene Industrial en el lugar donde realiza sus actividades?, a partir de éstos, ¿se cuenta con un programa de gestión, con responsables, acciones y fechas?", val: 0 },
        { id: '10.', subHeader: "B.5 Estandarización de los controles operacionales", text: "¿Tienen identificados, documentados y evaluados los niveles de cumplimiento de los “Riesgos Críticos aplicables (Bowtie) y ECF” que aplican a sus procesos o servicios y cuentan con plan de brechas, si aplica?", val: 0 },
        { id: '11.', text: "¿Tiene identificado, documentado y evaluado los requisitos de los “EST” que aplican a sus procesos o servicios y cuenta con plan de brechas, si aplica?", val: 0 },
        { id: '12.', text: "¿Se cumple y se dispone de evidencias de las actividades definidas en el “Estándar de Liderazgo”, de acuerdo a lo programado?", val: 0 },
        { id: '13.', text: "¿Se cumple y se dispone de evidencias de actividades definidas en el “Estándar de Seguridad Conductual” de acuerdo a lo programado?", val: 0 },
        { id: '14.', text: "¿Respecto al “Estándar de Aprendizaje”. ¿Se difunden los reportes de incidentes Divisionales y Corporativos, en especial los que apliquen a su servicio?", val: 0 },
        { id: '15.', text: "¿De los incidentes del contrato (Evento Significativo, CTP o STP), se ha realizado la investigación respectiva, las medidas correctivas y preventivas se encuentran cerradas dentro del plazo?", val: 0 },
        { id: '16.', subHeader: "B.6 Preparación y Respuesta ante emergencias", text: "¿La empresa cuenta con un plan de emergencia formal que considere la comunicación, coordinación y plan de acción ante una emergencia que le afecte?", val: 0 },
        { id: '17.', text: "¿La empresa cuenta con un programa de simulacros relacionados a emergencias que afecten a su servicio?", val: 0 },
        { id: '18.', text: "¿La empresa contratista capacita a sus trabajadores, supervisores y línea de mando respecto de los planes de emergencia de Codelco y propios?", val: 0 },
        { id: '19.', text: "¿La empresa contratista evaluó los riesgos de un potencial accidente grave o fatal considerando los Riesgos Críticos aplicables (Bowtie) y ECF identificados?", val: 0 }
      ]},
      { id: 'C', name: "IMPLEMENTACIÓN Y OPERACIÓN (TÍTULO VI RESSO)", progress: 0, obs: "", questions: [
        { id: '20.', subHeader: "C.1 Obligación de Informar", text: "¿La empresa informa a todos sus trabajadores a través de la “Obligación de Informar” acerca de los riesgos que entrañan sus labores, antes de iniciar cualquier tipo de actividad?", val: 0 },
        { id: '21.', text: "¿La empresa cuenta con procedimiento de capacitación, en el cual incluye un programa de operadores de baja experiencia laboral (BEL)?", val: 0 },
        { id: '22.', subHeader: "C.2 Participación de los trabajadores", text: "¿La empresa cuenta con un mecanismo para la participación y consulta de los trabajadores en materias de SST?", val: 0 },
        { id: '23.', text: "¿Tiene la empresa un mecanismo para asegurar, facilitar y canalizar la participación de sus trabajadores en los Comités Paritarios?", val: 0 },
        { id: '24.', subHeader: "C.3 Documentación que debe mantener la empresa principal", text: "¿La empresa cuenta en su instalación de faena con todos los documentos del SIGO, indicados en el Titulo VI del RESSO?", val: 0 },
        { id: '25.', subHeader: "C.4 Libro de Obra o de Servicios o Libro de Obra Digital", text: "¿Cuenta la empresa en faena con un Libro de Obra o de Servicios o Libro de Obra Digital o Carta Contractual VP?", val: 0 },
        { id: '26.', subHeader: "C.5 Libro SERNAGEOMIN", text: "¿La empresa gestiona, en los plazos estipulados por el servicio, las observaciones detectadas por SERNAGEOMIN?", val: 0 },
        { id: '27.', subHeader: "C.6 Control y actualización de documentos y datos de Seguridad y Salud en el Trabajo", text: "¿Cuenta la empresa con un procedimiento interno que asegure que todos los documentos en materia de gestión de SST estén disponibles?", val: 0 },
        { id: '28.', text: "¿Los trabajadores cuentan con los procedimientos propios de su tarea, en el área de trabajo?", val: 0 },
        { id: '29.', subHeader: "C.7 Estándares de control operacional", text: "¿La empresa cuenta con documentos operativos que asignan responsables de acuerdo a los Riesgos Críticos aplicables (Bowtie), ECF y EST?", val: 0 },
        { id: '30.', text: "¿La empresa realiza auditorías a los Riesgos Críticos aplicables (Bowtie), ECF y EST? De los hallazgos N1 levantados en terreno.", val: 0 }
      ] },
      { id: 'D', name: "RESULTADOS DE FISCALIZACIONES (TÍTULO VII RESSO)", progress: 0, obs: "", questions: [
        { id: '31.', subHeader: "D.1 Registro y seguimiento de instrucciones", text: "¿La empresa comunica los resultados de las entidades fiscalizadoras o de los organismos administradores de la Ley 16.744 al Administrador de Contrato Codelco?", val: 0 },
        { id: '32.', text: "¿Existe un programa interno para el cumplimiento de las instrucciones y medidas correctivas emanadas de las autoridades fiscalizadoras externas?", val: 0 },
        { id: '33.', subHeader: "D.2 Calificación de Empresas Contratistas y Subcontratistas", text: "¿La empresa solicitó y recibió la notificación de su categorización mediante el LOD/ Libro de Obra/ Carta Contractual enviada por Codelco?", val: 0 }
      ] },
      { id: 'E', name: "PROCEDIMIENTOS EN CASE DE ACCIDENTES (TÍTULO VIII RESSO)", progress: 0, obs: "", questions: [
        { id: '34.', subHeader: "Informe de accidentes graves, fatales y de alto potencial", text: "¿Cuenta la empresa con personal capacitado en el método para investigar incidentes definido por Codelco (EVITA/RDP 8 pasos y/o 3 pasos)?", val: 0 },
        { id: '35.', text: "¿De las investigaciones, la empresa aplica los lineamientos del Procedimiento de Gestión de Incidentes?", val: 0 }
      ] },
      { id: 'F', name: "OBLIGACIONES DE LAS EMPRESAS (Título IX Y X RESSO)", progress: 0, obs: "", questions: [
        { id: '36.', subHeader: "Prohibiciones de las Empresas Contratistas y Subcontratistas", text: "¿Cuenta la empresa con un plan de identificación, difusión y control para que sus trabajadores cumplan con las obligaciones indicadas en el Título IX del RESSO?", val: 0 },
        { id: '37.', text: "¿Están los reglamentos internos de H y S de la empresa debidamente actualizados?", val: 0 },
        { id: '38.', text: "¿La empresa difundió a todos sus trabajadores la información acerca de las normas, estándares y procedimientos que le competen?", val: 0 }
      ] }
    ]
  },
  {
    id: "II", collapsed: false, title: "II. REQUERIMIENTOS PARA LA IMPLEMENTACIÓN Y OPERACIÓN (OTROS REQUISITOS RELEVANTES DEL SIGO)",
    dimensions: [
      { id: 'G', name: "MEDIDAS DE PREVENCIÓN ESPECIALES (TÍTULO XI RESSO)", progress: 0, obs: "", questions: [ { id: '39.', text: "¿La empresa informa a través del Libro de Obras o Libro de Obra Digital respecto de los trabajos que implican riesgos inherentes altos?", val: 0 } ] },
      { id: 'H', name: "ESTÁNDARES MÍNIMOS (TÍTULO XII RESSO)", progress: 0, obs: "", questions: [ 
        { id: '40.', text: "¿Existe registro formal de “Reunión de Inicio” donde acrediten la entrega de los documentos estipulados por las Divisiones de Codelco/VP?", val: 0 },
        { id: '41.', text: "¿Existe registro formal de “Reunión de Arranque” donde acrediten la entrega del RESSO a la empresa contratista y subcontratistas?", val: 0 }
      ] },
      { id: 'I', name: "COMITÉS PARITARIOS DE HIGIENE Y SEGURIDAD (TÍTULO XIII RESSO)", progress: 0, obs: "", questions: [ { id: '42.', text: "¿Se cumple el programa de trabajo de los comités paritarios considerando las actas y los 7 puntos legales?", val: 0 } ] },
      { id: 'J', name: "ESTADÍSTICA E INFORMACIÓN (TÍTULO XIV RESSO)", progress: 0, obs: "", questions: [ 
        { id: '43.', text: "¿La empresa cumple con la exigencia de entregar el informe requerido una vez por mes en la fecha requerida?", val: 0 },
        { id: '44.', text: "¿La empresa entrega las estadísticas de información de riesgos profesionales en los formatos y plazos requeridos?", val: 0 }
      ] },
      { id: 'K', name: "INFRACCIONES O FALTAS DE LOS CONTRATISTAS (TÍTULO XV Y XVI)", progress: 0, obs: "", questions: [ { id: '45.', text: "¿Cuenta la empresa con un plan de difusión para que cumplan y conozcan el proceder ante faltas menores, graves e infracciones?", val: 0 } ] }
    ]
  }
])

const ressoDimensions = computed(() => {
  const all = []
  pointsData.forEach(p => p.dimensions.forEach(d => {
    all.push({ id: d.id, name: d.name, value: d.score || 0 })
  }))
  return all
})

const sigoDimensions = computed(() => {
  const all = []
  sigoData.forEach(p => p.dimensions.forEach(d => {
    all.push({ id: d.id, name: d.name, value: d.progress || 0 })
  }))
  return all
})

const createNewInforme = () => { showSelectorModal.value = true }

const loadInforme = async (inf) => {
  activeInformeId.value = inf.id
  try {
    const { data } = await sstAxios.get(`/audits/${inf.id}`)
    if (data) {
      formInfo.version = data.version; formInfo.division = data.division; 
      formInfo.empresa = data.company_name || data.empresa; 
      formInfo.periodo = data.periodo; formInfo.servicio = data.service_name || data.servicio; 
      formInfo.num = data.contract_number || data.num_contrato;
      formInfo.admin = data.admin_eecc || '-'; formInfo.apr = data.apr_eecc || '-';
      formInfo.fecha = data.audit_date || data.fecha;

      // Cargar estado y PDF de base de datos
      estadoInforme.value = data.status || 'Borrador'
      urlStoredPdf.value = data.url_pdf || null

      // Resetear RESSO
      pointsData.forEach(p => p.dimensions.forEach(d => { 
        d.score = 0; d.obs = ""; d.photos = [];
        d.questions.forEach(q => { q.val = 0; q.obs = ""; q.photos = [] }) 
      }))
      // Resetear SIGO
      sigoData.forEach(p => p.dimensions.forEach(d => {
        d.progress = 0; d.obs = "";
        d.questions.forEach(q => { q.val = 0 })
      }))
      
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach(res => {
          // Cargar RESSO
          pointsData.forEach(p => p.dimensions.forEach(d => {
            if (`P-${d.id}` === res.item_internal_id) { 
              d.score = parseFloat(res.score || 0); 
              d.obs = res.observation || "";
              d.photos = parsePostgresArray(res.photos);
            }
            const q = d.questions.find(q => `P-${q.id}` === res.item_internal_id)
            if (q) { 
              q.val = parseFloat(res.score || 0);
              q.photos = parsePostgresArray(res.photos);
            }
          }))
          // Cargar SIGO
          sigoData.forEach(p => p.dimensions.forEach(d => {
            if (`S-${d.id}` === res.item_internal_id) { d.progress = parseFloat(res.score || 0); d.obs = res.observation || "" }
            const q = d.questions.find(q => `S-${q.id}` === res.item_internal_id)
            if (q) { q.val = parseFloat(res.score || 0) }
          }))
        })
      }
    }
  } catch (err) { console.error(err) }
}

const onSelectionConfirm = async (sel) => {
  const payload = {
    header: { type: 'RESSO', version: '01', division: 'Chuquicamata', empresa: sel.clienteName, company_name: sel.clienteName, servicio: sel.proyectoName, service_name: sel.proyectoName, num_contrato: sel.proyecto, contract_number: sel.proyecto, fecha: new Date().toISOString().split('T')[0], periodo: sel.periodo, status: 'Borrador', total_score: 0 },
    results: []
  }
  try {
    const { data } = await sstAxios.post('/audits', payload)
    const newId = data.id || data.auditId || data.insertId || (data.data && data.data.id)
    if (newId) activeInformeId.value = newId
    formInfo.empresa = sel.clienteName; formInfo.periodo = sel.periodo; formInfo.servicio = sel.proyectoName; formInfo.num = sel.proyecto
    
    // Resetear datos locales
    pointsData.forEach(p => p.dimensions.forEach(d => { 
      d.score = 0; d.obs = ""; d.photos = [];
      d.questions.forEach(q => { q.val = 0; q.obs = ""; q.photos = [] }) 
    }))
    sigoData.forEach(p => p.dimensions.forEach(d => {
      d.progress = 0; d.obs = "";
      d.questions.forEach(q => { q.val = 0 })
    }))
    
    estadoInforme.value = 'Borrador'
    urlStoredPdf.value = null
    fetchAudits(); showSelectorModal.value = false
  } catch (err) { alert('Error al crear') }
}

const handleSave = async (status) => {
  const payload = {
    header: { id: activeInformeId.value === 'new' ? null : activeInformeId.value, type: 'RESSO', version: formInfo.version, division: formInfo.division, empresa: formInfo.empresa, company_name: formInfo.empresa, servicio: formInfo.servicio, service_name: formInfo.servicio, num_contrato: formInfo.num, contract_number: formInfo.num, fecha: formInfo.fecha, periodo: formInfo.periodo, status: status || 'Borrador', total_score: 0, admin_eecc: formInfo.admin, apr_eecc: formInfo.apr },
    results: []
  }
  
  // RESSO Results
  pointsData.forEach(p => {
    p.dimensions.forEach(d => {
      payload.results.push({ 
        item_internal_id: `P-${d.id}`, 
        category_name: d.name, 
        question_text: d.name || "", 
        score: parseFloat(d.score) || 0, 
        observation: d.obs || "", 
        photos: formatPostgresArray(d.photos) 
      })
      d.questions.forEach(q => {
        payload.results.push({ 
          item_internal_id: `P-${q.id}`, 
          category_name: d.name, 
          question_text: q.text || "", 
          score: parseFloat(q.val) || 0, 
          observation: q.obs || "", 
          photos: formatPostgresArray(q.photos) 
        })
      })
    })
  })

  // SIGO Results
  sigoData.forEach(p => p.dimensions.forEach(d => {
    payload.results.push({ 
      item_internal_id: `S-${d.id}`, 
      category_name: d.name, 
      question_text: d.name || "", 
      score: parseFloat(d.progress) || 0, 
      observation: d.obs || "", 
      photos: "{}" 
    })
    d.questions.forEach(q => {
      payload.results.push({ 
        item_internal_id: `S-${q.id}`, 
        category_name: d.name, 
        question_text: q.text || "", 
        score: parseFloat(q.val) || 0, 
        observation: q.obs || "", 
        photos: "{}" 
      })
    })
  }))
  
  const totalScore = ressoDimensions.value.reduce((a, b) => a + b.value, 0) / (ressoDimensions.value.length || 1)
  payload.header.total_score = Math.round(totalScore)
  
  try {
    if (activeInformeId.value && activeInformeId.value !== 'new') {
      await sstAxios.put(`/audits/${activeInformeId.value}`, payload)
    } else {
      const { data } = await sstAxios.post('/audits', payload)
      const newId = data.id || data.auditId || data.insertId || (data.data && data.data.id)
      if (newId) activeInformeId.value = newId
    }
    if (status !== 'Finalizado') {
      alert('Guardado exitosamente')
    }
    fetchAudits()
  } catch (err) { 
    alert('Error al guardar') 
    throw err
  }
}

// Compilador HTML dinámico para el PDF RESSO
const getReportHtml = () => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Auditoría RESSO EECC - ${formInfo.empresa}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; line-height: 1.4; }
        .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 24px; margin: 0; text-transform: uppercase; font-weight: 900; letter-spacing: -0.5px; }
        .header p { font-size: 12px; color: #666; margin: 8px 0 0 0; font-weight: bold; }
        .meta-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .meta-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; }
        .meta-label { font-size: 9px; text-transform: uppercase; color: #9ca3af; font-weight: 800; letter-spacing: 0.5px; }
        .meta-value { font-size: 13px; font-weight: bold; margin-top: 4px; color: #111827; }
        .section-title { font-size: 16px; font-weight: 900; background: #f3f4f6; padding: 8px 12px; margin: 30px 0 15px 0; text-transform: uppercase; border-left: 4px solid #10b981; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f9fafb; border-bottom: 2px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #4b5563; font-weight: 800; }
        td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; vertical-align: top; }
        .col-num { width: 40px; font-weight: bold; }
        .col-val { width: 80px; text-align: right; font-weight: bold; color: #10b981; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Auditoría RESSO EECC / SIGO</h1>
        <p>Reporte de Cumplimiento y Hallazgos Críticos</p>
      </div>

      <div class="meta-grid">
        <div class="meta-card"><div class="meta-label">Empresa</div><div class="meta-value">${formInfo.empresa || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">División</div><div class="meta-value">${formInfo.division || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">N° Contrato</div><div class="meta-value">${formInfo.num || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">Fecha</div><div class="meta-value">${formInfo.fecha || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">Período</div><div class="meta-value">${formInfo.periodo || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">Admin EECC</div><div class="meta-value">${formInfo.admin || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">APR EECC</div><div class="meta-value">${formInfo.apr || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">Resultado Final</div><div class="meta-value">${Math.round(ressoDimensions.value.reduce((a, b) => a + b.value, 0) / (ressoDimensions.value.length || 1))}%</div></div>
      </div>

      <div class="section-title">I. Evaluación RESSO EECC</div>
  `;

  pointsData.forEach(point => {
    html += `<h3 style="margin-top: 20px; font-size: 13px; color: #1e3a8a; font-weight: bold;">${point.title}</h3>`;
    point.dimensions.forEach(cat => {
      html += `
        <h4 style="font-size: 11px; font-weight: bold; background: #f9fafb; padding: 6px; margin: 10px 0; display: flex; justify-content: space-between;">
          <span>${cat.id}. ${cat.name}</span>
          <span>Score: ${cat.score}%</span>
        </h4>
      `;
      if (cat.questions && cat.questions.length > 0) {
        html += `
          <table>
            <thead>
              <tr>
                <th class="col-num">Requisito</th>
                <th>Criterio</th>
                <th class="col-val">Valor (%)</th>
              </tr>
            </thead>
            <tbody>
        `;
        cat.questions.forEach(q => {
          html += `
            <tr>
              <td class="col-num">${q.id}</td>
              <td>${q.text}</td>
              <td class="col-val">${q.val}%</td>
            </tr>
          `;
        });
        html += `</tbody></table>`;
      }
      if (cat.obs) {
        html += `<div style="font-style: italic; font-size: 10px; color: #b45309; background: #fffbeb; padding: 6px; border-left: 3px solid #f59e0b; margin-bottom: 15px;">Observaciones: ${cat.obs}</div>`;
      }
    });
  });

  html += `<div class="section-title" style="page-break-before: always;">II. Evaluación SIGO</div>`;
  sigoData.forEach(point => {
    html += `<h3 style="margin-top: 20px; font-size: 13px; color: #1e3a8a; font-weight: bold;">${point.title}</h3>`;
    point.dimensions.forEach(cat => {
      html += `
        <h4 style="font-size: 11px; font-weight: bold; background: #f9fafb; padding: 6px; margin: 10px 0; display: flex; justify-content: space-between;">
          <span>${cat.id}. ${cat.name}</span>
          <span>Avance: ${cat.progress}%</span>
        </h4>
      `;
      if (cat.questions && cat.questions.length > 0) {
        html += `
          <table>
            <thead>
              <tr>
                <th class="col-num">Pregunta</th>
                <th>Criterio</th>
                <th class="col-val">Avance (%)</th>
              </tr>
            </thead>
            <tbody>
        `;
        cat.questions.forEach(q => {
          html += `
            <tr>
              <td class="col-num">${q.id}</td>
              <td>
                ${q.subHeader ? `<div style="font-size: 9px; font-weight: bold; color: #0891b2;">${q.subHeader}</div>` : ''}
                ${q.text}
              </td>
              <td class="col-val">${q.val}%</td>
            </tr>
          `;
        });
        html += `</tbody></table>`;
      }
    });
  });

  html += `
    </body>
    </html>
  `;
  return html;
}

// Iniciar Proceso de Firma
const prepararFirma = async () => {
  if (activeInformeId.value === 'new') {
    alert('⚠️ Por favor guarda el informe como Borrador primero.')
    return
  }
  loading.value = true
  try {
    // 1) Guardar cambios actuales silenciosamente
    await handleSave('Borrador')

    // 2) Compilar HTML
    const fullHtml = getReportHtml()

    // 3) Generar PDF en el backend
    const { data } = await apiAxios.post(`/sst/generate-pdf-html/${activeInformeId.value}`, { htmlContent: fullHtml })

    if (data.url_pdf) {
      urlStoredPdf.value = data.url_pdf
      signatureIdDoc.value = data.id_doc || activeInformeId.value
      signatureOrigenPath.value = data.origenPath || (data.url_pdf ? data.url_pdf.replace('/archivo/', '/u05/LeanDocs/') : '')
      signatureDestinoFolder.value = data.destinoFolder || '/u05/LeanDocs/transmac/sst/resso_informes/'
      
      const BASE_URL = import.meta.env.VITE_API_BASE_URL_CORE || import.meta.env.VITE_API_BASE_URL || ''
      signaturePdfUrl.value = BASE_URL.includes('/api') ? BASE_URL + data.url_pdf : BASE_URL + '/api' + data.url_pdf
      
      showSignatureModal.value = true
    } else {
      alert('Error: El backend no retornó la URL del PDF.')
    }
  } catch (err) {
    console.error('Error preparando firma:', err)
    alert('Error al generar el PDF para firmar. Verifique los endpoints.')
  } finally {
    loading.value = false
  }
}

// Cierre Definitivo del Informe
const ejecutarCierreReporte = async (signedData) => {
  try {
    loading.value = true
    
    let finalPdfUrl = urlStoredPdf.value
    if (signedData && signedData.origenPathFirmado) {
      finalPdfUrl = signedData.origenPathFirmado.replace('/u05/LeanDocs/', '/archivo/').replace(/\\/g, '/')
      urlStoredPdf.value = finalPdfUrl
    }
    
    // Payload para actualizar estados y guardar JSON
    const payload = {
      estado: 'Finalizado',
      fecha_finalizacion: new Date().toISOString(),
      url_pdf: finalPdfUrl,
      data_json: {
        pointsData: pointsData,
        sigoData: sigoData,
        antecedentes: formInfo,
        ressoDimensions: ressoDimensions.value,
        sigoDimensions: sigoDimensions.value,
        total_score: Math.round(ressoDimensions.value.reduce((a, b) => a + b.value, 0) / (ressoDimensions.value.length || 1))
      }
    }

    // Actualizar columnas en Postgres
    await apiAxios.post(`/sst/informe/${activeInformeId.value}`, payload)

    // Sincronizar en SST
    const sstPayload = {
      header: { 
        id: activeInformeId.value, 
        type: 'RESSO', 
        version: formInfo.version, 
        division: formInfo.division, 
        empresa: formInfo.empresa, 
        company_name: formInfo.empresa, 
        servicio: formInfo.servicio, 
        service_name: formInfo.servicio, 
        num_contrato: formInfo.num, 
        contract_number: formInfo.num, 
        fecha: formInfo.fecha, 
        periodo: formInfo.periodo, 
        status: 'Finalizado', 
        total_score: Math.round(ressoDimensions.value.reduce((a, b) => a + b.value, 0) / (ressoDimensions.value.length || 1)),
        admin_eecc: formInfo.admin, 
        apr_eecc: formInfo.apr 
      },
      results: []
    }
    
    pointsData.forEach(p => {
      p.dimensions.forEach(d => {
        sstPayload.results.push({ item_internal_id: `P-${d.id}`, category_name: d.name, question_text: d.name || "", score: parseFloat(d.score) || 0, observation: d.obs || "", photos: formatPostgresArray(d.photos) })
        d.questions.forEach(q => {
          sstPayload.results.push({ item_internal_id: `P-${q.id}`, category_name: d.name, question_text: q.text || "", score: parseFloat(q.val) || 0, observation: q.obs || "", photos: formatPostgresArray(q.photos) })
        })
      })
    })

    sigoData.forEach(p => p.dimensions.forEach(d => {
      sstPayload.results.push({ item_internal_id: `S-${d.id}`, category_name: d.name, question_text: d.name || "", score: parseFloat(d.progress) || 0, observation: d.obs || "", photos: "{}" })
      d.questions.forEach(q => {
        sstPayload.results.push({ item_internal_id: `S-${q.id}`, category_name: d.name, question_text: q.text || "", score: parseFloat(q.val) || 0, observation: q.obs || "", photos: "{}" })
      })
    }))

    await sstAxios.put(`/audits/${activeInformeId.value}`, sstPayload)

    estadoInforme.value = 'Finalizado'
    
    window.dispatchEvent(new CustomEvent('report-status-updated'))
    
    alert('El informe ha sido firmado y cerrado con éxito.')
    fetchAudits()
  } catch (err) {
    console.error('Error al cerrar informe:', err)
    alert('Error al cerrar el informe.')
  } finally {
    loading.value = false
  }
}

// Reapertura de Edición
const reabrirInforme = async () => {
  if (!confirm('¿Seguro de re-abrir el informe? Esto permitirá editar y se invalidará el PDF consolidado.')) return
  loading.value = true
  try {
    await apiAxios.post(`/sst/informe/${activeInformeId.value}`, {
      estado: 'Borrador',
      url_pdf: null
    })

    const sstPayload = {
      header: { 
        id: activeInformeId.value, 
        type: 'RESSO', 
        version: formInfo.version, 
        division: formInfo.division, 
        empresa: formInfo.empresa, 
        company_name: formInfo.empresa, 
        servicio: formInfo.servicio, 
        service_name: formInfo.servicio, 
        num_contrato: formInfo.num, 
        contract_number: formInfo.num, 
        fecha: formInfo.fecha, 
        periodo: formInfo.periodo, 
        status: 'Borrador', 
        total_score: Math.round(ressoDimensions.value.reduce((a, b) => a + b.value, 0) / (ressoDimensions.value.length || 1)),
        admin_eecc: formInfo.admin, 
        apr_eecc: formInfo.apr 
      },
      results: []
    }
    
    pointsData.forEach(p => {
      p.dimensions.forEach(d => {
        sstPayload.results.push({ item_internal_id: `P-${d.id}`, category_name: d.name, question_text: d.name || "", score: parseFloat(d.score) || 0, observation: d.obs || "", photos: formatPostgresArray(d.photos) })
        d.questions.forEach(q => {
          sstPayload.results.push({ item_internal_id: `P-${q.id}`, category_name: d.name, question_text: q.text || "", score: parseFloat(q.val) || 0, observation: q.obs || "", photos: formatPostgresArray(q.photos) })
        })
      })
    })

    sigoData.forEach(p => p.dimensions.forEach(d => {
      sstPayload.results.push({ item_internal_id: `S-${d.id}`, category_name: d.name, question_text: d.name || "", score: parseFloat(d.progress) || 0, observation: d.obs || "", photos: "{}" })
      d.questions.forEach(q => {
        sstPayload.results.push({ item_internal_id: `S-${q.id}`, category_name: d.name, question_text: q.text || "", score: parseFloat(q.val) || 0, observation: q.obs || "", photos: "{}" })
      })
    }))

    await sstAxios.put(`/audits/${activeInformeId.value}`, sstPayload)

    estadoInforme.value = 'Borrador'
    urlStoredPdf.value = null

    window.dispatchEvent(new CustomEvent('report-status-updated'))
    
    alert('Edición habilitada con éxito.')
    fetchAudits()
  } catch (err) {
    console.error('Error reabriendo informe:', err)
    alert('No se pudo re-abrir el informe.')
  } finally {
    loading.value = false
  }
}

// Descargar/Ver PDF Oficial
const openStoredPdf = () => {
  if (urlStoredPdf.value) {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL_CORE || import.meta.env.VITE_API_BASE_URL || ''
    const fullUrl = BASE_URL.includes('/api') ? BASE_URL + urlStoredPdf.value : BASE_URL + '/api' + urlStoredPdf.value
    window.open(fullUrl, '_blank')
  } else {
    alert('El PDF oficial aún no ha sido generado.')
  }
}

const getRESSOStats = () => {
  let total = 0; let answered = 0;
  pointsData.forEach(p => p.dimensions.forEach(d => { total++; if (d.score > 0) answered++ }))
  return { total, answered }
}

const getSIGOStats = () => {
  let total = 0; let answered = 0;
  sigoData.forEach(p => p.dimensions.forEach(d => { total++; if (d.progress > 0) answered++ }))
  return { total, answered }
}

watch([pointsData, sigoData], () => {
  // RESSO Logic
  pointsData.forEach(p => p.dimensions.forEach(d => {
    if (d.questions && d.questions.length > 0) {
      const sum = d.questions.reduce((acc, q) => acc + (parseFloat(q.val) || 0), 0)
      d.score = Number((sum / d.questions.length).toFixed(1)) || 0
    }
  }))
  // SIGO Logic
  sigoData.forEach(p => p.dimensions.forEach(d => {
    if (d.questions && d.questions.length > 0) {
      const sum = d.questions.reduce((acc, q) => acc + (parseFloat(q.val) || 0), 0)
      d.progress = Number((sum / d.questions.length).toFixed(1)) || 0
    }
  }))
}, { deep: true })

</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.print-only { display: none !important; }
@media print {
  .print-only { display: block !important; }
  .no-print { display: none !important; }
  body { background: white !important; color: black !important; }
  @page { margin: 10mm; }
}
</style>
