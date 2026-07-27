<template>
  <div class="flex flex-col h-full space-y-4 relative overflow-hidden">
    
    <!-- 🏥 MONITOR DE SALUD Y SEGURIDAD (Collapsible) -->
    <div class="glass-card rounded-2xl border border-white/10 transition-all duration-500" :class="[isDashboardOpen ? 'pb-6' : 'pb-0']">
      <div @click="isDashboardOpen = !isDashboardOpen" class="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors">
        <div class="flex items-center gap-4">
          <div class="p-2 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
            <UserCheck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black uppercase tracking-widest text-white italic">Monitor de Salud Laboral y SST</h3>
            <p class="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">Seguimiento de Dotación Transmac: Aptitudes • Competencias • Seguridad</p>
          </div>
        </div>
        <div v-if="!isDashboardOpen" class="flex items-center gap-6">
           <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500"></span><span class="text-[10px] font-black text-white uppercase italic">Aptos: 142</span></div>
           <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span><span class="text-[10px] font-black text-white uppercase italic">Observados: 12</span></div>
        </div>
        <ChevronDown class="w-4 h-4 text-muted-foreground transition-transform" :class="{ 'rotate-180': isDashboardOpen }" />
      </div>

      <transition name="slide-fade">
        <div v-if="isDashboardOpen" class="px-6 grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          <div v-for="kpi in sstKPIs" :key="kpi.label" class="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <p class="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">{{ kpi.label }}</p>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black text-white">{{ kpi.value }}</span>
              <span :class="['text-[10px] font-bold', kpi.trendColor]">{{ kpi.trend }}</span>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 👥 BOARD DE GESTIÓN DE PERSONAL -->
    <div class="flex-1 glass-card rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
      <div class="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div class="flex items-center gap-4">
          <h3 class="text-sm font-black uppercase tracking-widest text-white italic">Nómina de Seguridad Transmac</h3>
          <div class="flex items-center bg-zinc-900 rounded-lg p-1 border border-white/5">
             <button class="px-3 py-1 text-[9px] font-black uppercase rounded-md bg-white/10 text-white">Activos</button>
             <button class="px-3 py-1 text-[9px] font-black uppercase rounded-md text-muted-foreground hover:text-white">Críticos</button>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
             <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
             <input type="text" placeholder="BUSCAR POR NOMBRE O RUT..." class="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 w-64 transition-all" />
          </div>
          <button class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-emerald-400/30">
            <Plus class="w-4 h-4" /> Enrolar Personal
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto overflow-x-hidden">
        <table class="w-full text-left">
          <thead class="sticky top-0 bg-zinc-950 z-10 border-b border-white/10">
            <tr class="bg-white/[0.03]">
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Trabajador (ID)</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Cargo / Función</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center italic">Salud y Seguridad (MED • CAP • SEG)</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Proyecto Asignado</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right italic">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr 
              v-for="person in staff" 
              :key="person.id" 
              @click="openDetail(person)"
              class="hover:bg-emerald-500/[0.05] cursor-pointer transition-all group"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden group-hover:border-emerald-500/50 transition-colors shadow-xl grow-0 shrink-0">
                    <img v-if="person.photo" :src="person.photo" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    <div v-else class="w-full h-full flex items-center justify-center text-[10px] font-black text-white/40 italic">S/F</div>
                  </div>
                  <div>
                    <p class="text-xs font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{{ person.name }}</p>
                    <p class="text-[9px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest italic">{{ person.rut }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="text-[10px] font-black text-white/80 uppercase tracking-tighter">{{ person.position }}</p>
                <p class="text-[9px] font-medium text-muted-foreground uppercase italic opacity-60">{{ person.department }}</p>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-6">
                  <div class="flex flex-col items-center gap-1">
                    <div :class="['w-2 h-2 rounded-full', person.medStatus === 'ok' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]']"></div>
                    <span class="text-[8px] font-black text-muted-foreground uppercase italic tracking-tighter">MED</span>
                  </div>
                  <div class="flex flex-col items-center gap-1">
                    <div :class="['w-2 h-2 rounded-full', person.capStatus === 'ok' ? 'bg-emerald-500' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]']"></div>
                    <span class="text-[8px] font-black text-muted-foreground uppercase italic tracking-tighter">CAP</span>
                  </div>
                  <div class="flex flex-col items-center gap-1">
                    <div :class="['w-2.5 h-1 rounded-sm', person.riskLevel === 'baja' ? 'bg-emerald-500' : person.riskLevel === 'media' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]']"></div>
                    <span class="text-[8px] font-black text-muted-foreground uppercase italic tracking-tighter">SEG</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-[10px] font-black text-white/60 uppercase italic tracking-widest">{{ person.project }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <ChevronRight class="w-4 h-4 text-muted-foreground group-hover:text-white transition-all ml-auto" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 📑 CONSOLA PANORÁMICA 360 DEL TRABAJADOR -->
    <transition name="fade">
      <div v-if="showDetail && selectedPerson" class="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
        <!-- Backdrop -->
        <div @click="closeDetail" class="absolute inset-0 bg-background/95 backdrop-blur-xl"></div>
        
        <!-- Modal Content (Panoramic) -->
        <div class="relative w-[98%] h-[96vh] bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-[0_0_150px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
          
          <!-- Header (Panoramic) -->
          <div class="px-10 py-6 border-b border-white/5 bg-gradient-to-r from-emerald-600/20 via-emerald-500/5 to-transparent flex items-center justify-between shrink-0">
            <div class="flex items-center gap-8">
              <div class="w-20 h-20 rounded-3xl bg-zinc-800 border-2 border-white/10 flex items-center justify-center shadow-3xl overflow-hidden relative p-1 group">
                <img v-if="selectedPerson.photo" :src="selectedPerson.photo" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 rounded-2xl" />
                <User v-else class="w-10 h-10 text-emerald-500 opacity-40" />
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-6">
                  <h2 class="text-2xl font-black text-white uppercase tracking-tighter italic">{{ selectedPerson.name }}</h2>
                  <div class="flex gap-2">
                    <span class="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black border border-emerald-500/20 uppercase tracking-[0.2em] italic">{{ selectedPerson.rut }}</span>
                    <span class="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black border border-blue-500/20 uppercase tracking-[0.2em] italic">{{ selectedPerson.position }}</span>
                  </div>
                </div>
                <p class="text-[11px] font-bold text-muted-foreground uppercase mt-2 tracking-[0.4em] opacity-40 ml-1 italic font-black">
                  DEPARTAMENTO: {{ selectedPerson.department }} • CONTRATO: {{ selectedPerson.project }} • RH: O(+)
                </p>
              </div>
            </div>

            <div class="flex items-center gap-6">
              <button @click="openQR" class="group flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 transition-all border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <span class="text-[10px] font-black uppercase tracking-widest">Ficha QR Pública</span>
              </button>
              <button @click="closeDetail" class="group flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 hover:bg-destructive/20 hover:text-destructive transition-all border border-white/5">
                <span class="text-[10px] font-black uppercase tracking-widest text-white/50">Cerrar Expediente</span>
                <X class="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-hidden flex">
            <!-- Sidebar (Ficha Ocupacional) -->
            <div class="w-80 border-r border-white/5 p-8 bg-zinc-950/30 space-y-8 overflow-y-auto scrollbar-hide shrink-0 italic">
              <div class="space-y-6">
                <h4 class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 italic">Estado de Salud Laboral</h4>
                <div class="grid grid-cols-1 gap-3">
                  <div v-for="stat in personStats" :key="stat.label" class="p-5 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-emerald-500/30 transition-all shadow-xl">
                    <div class="flex justify-between items-start mb-1">
                       <p class="text-[9px] font-black text-muted-foreground uppercase opacity-60 tracking-widest">{{ stat.label }}</p>
                       <component :is="stat.icon" class="w-4 h-4 text-emerald-500 opacity-30 group-hover:opacity-100 transition-all" />
                    </div>
                    <span class="text-xl font-black text-white tracking-tighter uppercase leading-none italic">{{ stat.value }}</span>
                  </div>
                </div>
              </div>

              <div class="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-center space-y-2">
                 <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest opacity-60 italic">Contacto Emergencia</p>
                 <p class="text-[11px] font-black text-white uppercase italic">Marta Riquelme (Esposa)</p>
                 <p class="text-[11px] font-bold text-blue-500 italic">+56 9 8234 XXXX</p>
              </div>
            </div>

            <!-- Content Area (Density Panorámica) -->
            <div class="flex-1 flex flex-col overflow-hidden bg-zinc-900/50">
              <div class="px-10 pt-8 flex gap-12 border-b border-white/5 shrink-0 overflow-x-auto scrollbar-hide">
                <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id" :class="['text-[11px] font-black uppercase tracking-[0.4em] pb-6 transition-all relative shrink-0 italic', activeTab === t.id ? 'text-emerald-500' : 'text-muted-foreground hover:text-white']">
                  {{ t.label }}
                  <span v-if="activeTab === t.id" class="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t-full shadow-[0_-5px_15px_rgba(16,185,129,0.5)]"></span>
                </button>
              </div>

              <div class="flex-1 overflow-y-auto p-10 scrollbar-hide">
                
                <!-- SUMMARY -->
                <div v-if="activeTab === 'summary'" class="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                   <div class="space-y-8 italic">
                      <h5 class="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-4 opacity-50">
                         <span class="w-8 h-[1px] bg-emerald-500"></span>
                         Exámenes y Certificaciones Médicas
                      </h5>
                      <div class="grid grid-cols-1 gap-3">
                        <div v-for="cert in selectedPerson.certs" :key="cert.name" class="p-6 rounded-3xl bg-white/[0.04] border border-white/5 flex items-center justify-between group hover:bg-white/[0.08] transition-all hover:border-emerald-500/20">
                          <div class="flex items-center gap-6">
                             <div class="p-3 rounded-xl bg-zinc-800 text-emerald-500 border border-white/10 shadow-2xl transition-all group-hover:bg-emerald-600 group-hover:text-white"><Activity class="w-6 h-6" /></div>
                             <div>
                                <p class="text-sm font-black text-white uppercase tracking-tighter italic italic leading-none">{{ cert.name }}</p>
                                <p class="text-[10px] font-bold text-muted-foreground uppercase opacity-40 mt-2 tracking-widest italic">VALIDO HASTA: {{ cert.expiry }}</p>
                             </div>
                          </div>
                          <div class="flex items-center gap-4">
                             <span :class="['text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em]', !cert.expired ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive animate-pulse']">
                               {{ !cert.expired ? 'VIGENTE' : 'VENCIDO' }}
                             </span>
                          </div>
                        </div>
                      </div>
                   </div>

                   <div class="space-y-8 italic">
                      <h5 class="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-4 opacity-50">
                         <span class="w-8 h-[1px] bg-emerald-500"></span>
                         Análisis de Conducta SST
                      </h5>
                      <div class="p-8 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 relative overflow-hidden group shadow-2xl">
                         <div class="flex items-center justify-between mb-8">
                            <h6 class="text-[10px] font-black text-white uppercase tracking-widest">Nivel de Seguridad Conductual</h6>
                            <span class="text-3xl font-black text-emerald-500 italic">9.2 / 10</span>
                         </div>
                         <div class="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-6">
                            <div class="bg-emerald-500 h-full w-[92%] transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                         </div>
                         <p class="text-[11px] text-muted-foreground uppercase italic leading-relaxed font-black tracking-widest opacity-60">Basado en las últimas 12 observaciones en terreno. El trabajador presenta un perfil de cumplimiento superior al 90% en uso de EPPs y protocolos críticos de fatiga y somnolencia.</p>
                      </div>
                   </div>
                </div>

                <!-- CARPETA DIGITAL (NEW) -->
                <div v-if="activeTab === 'docs'" class="space-y-4 animate-in fade-in duration-500 italic">
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div v-for="doc in selectedPerson.docs" :key="doc.name" class="p-8 rounded-[2.5rem] bg-white/[0.04] border border-white/5 flex items-center justify-between group hover:bg-white/[0.08] hover:border-emerald-500/30 transition-all shadow-xl">
                          <div class="flex items-center gap-6">
                             <div class="p-4 rounded-2xl bg-zinc-800 text-blue-500 border border-white/10 group-hover:bg-blue-600 group-hover:text-white transition-all"><FileText class="w-6 h-6" /></div>
                             <div>
                                <p class="text-base font-black text-white uppercase tracking-tighter italic leading-none">{{ doc.name }}</p>
                                <p class="text-[10px] font-bold text-muted-foreground uppercase opacity-40 mt-2 tracking-widest italic">EXPIRACIÓN: {{ doc.expiry }}</p>
                             </div>
                          </div>
                          <div class="flex flex-col items-end gap-3">
                             <span :class="['text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em]', !doc.expired ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive animate-pulse']">
                               {{ !doc.expired ? 'VALIDADO' : 'EXPIRO' }}
                             </span>
                             <button class="text-[9px] font-black text-blue-500 hover:text-white transition-colors uppercase tracking-widest">Descargar Original</button>
                          </div>
                      </div>
                   </div>
                </div>

                <!-- CAPACITACIONES -->
                <div v-if="activeTab === 'training'" class="space-y-3 animate-in fade-in duration-500 italic">
                   <div v-for="i in 8" :key="i" class="px-8 py-5 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-between hover:border-emerald-500/40 transition-all group hover:bg-white/[0.05] shadow-xl">
                      <div class="flex items-center gap-10">
                        <div class="text-center w-16">
                           <p class="text-2xl font-black text-white/30 leading-none tracking-tighter italic">0{{ i }}</p>
                           <p class="text-[9px] font-black text-muted-foreground uppercase opacity-40 mt-1 italic font-bold">CERT</p>
                        </div>
                        <div class="h-10 w-[1px] bg-white/10"></div>
                        <div class="flex items-center gap-6">
                          <div class="p-3 rounded-xl bg-zinc-800 text-blue-500"><GraduationCap class="w-5 h-5" /></div>
                          <div>
                            <p class="text-base font-black text-white uppercase tracking-tighter italic group-hover:text-emerald-500 transition-colors">Estándar Control de Fatalidad Minera #{{ i }}</p>
                            <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-50 mt-1 italic">DICTADO POR: ACHS OTEC • NOTA: 7.0 / 7.0</p>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-8">
                        <button class="px-6 py-2 rounded-xl bg-white/5 text-blue-500 text-[9px] font-black border border-blue-500/20 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl">VER CERTIFICADO</button>
                      </div>
                   </div>
                </div>

                <!-- OBSERVACIONES -->
                <div v-if="activeTab === 'observations'" class="space-y-6 animate-in fade-in duration-500 italic text-white">
                   <div v-for="i in 3" :key="i" class="p-10 rounded-[3.5rem] bg-zinc-950/40 border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-2xl">
                      <div class="flex justify-between items-start mb-10">
                         <div class="flex gap-4">
                            <span class="px-6 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black border border-emerald-500/30 uppercase tracking-[0.45em] shadow-lg">CONDUCTA SEGURA</span>
                            <span class="px-6 py-2 rounded-full bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.45em]">VISITA TERRENO</span>
                         </div>
                         <div class="text-right">
                            <p class="text-[11px] font-black text-muted-foreground uppercase italic opacity-40 tracking-widest italic font-black">Registro ID: SST-{{ 2024 + i }}</p>
                         </div>
                      </div>
                      <h3 class="text-2xl font-black text-white uppercase mb-6 tracking-tighter italic leading-none max-w-4xl italic">Inspección de Riesgos en Área de Carga DMH</h3>
                      <p class="text-sm text-muted-foreground opacity-60 mb-10 uppercase italic font-black tracking-[0.3em] max-w-4xl leading-relaxed italic">El trabajador aplica correctamente los controles de bloqueo y señalización. Durante la descarga, mantiene comunicación radial constante con el despachador. Se felicita por compromiso con la seguridad vial interna.</p>
                      <div class="border-t border-white/5 pt-8 flex items-center justify-between">
                         <div class="flex items-center gap-4 opacity-50 italic">
                            <div class="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-emerald-500"><UserCheck class="w-4 h-4" /></div>
                            <p class="text-[10px] font-black text-white uppercase italic tracking-widest leading-none">Firmado por: Felipe Calderón (Líder SST)</p>
                         </div>
                         <button class="px-8 py-3 bg-white/5 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all border border-white/10 shadow-xl group-hover:scale-105 active:scale-95">Ver Detalle Digital</button>
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
        <div class="relative bg-zinc-900 rounded-3xl p-8 max-w-sm w-full mx-auto shadow-2xl border border-white/10 flex flex-col items-center">
          <h3 class="text-lg font-black text-white uppercase tracking-wider mb-2">Código QR Público</h3>
          <p class="text-[10px] text-muted-foreground uppercase tracking-widest text-center mb-6">Escanea para acceder a la validación en terreno</p>
          
          <div class="bg-white p-4 rounded-2xl mb-6 shadow-inner border border-zinc-200">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="w-48 h-48" />
            <div v-else class="w-48 h-48 flex items-center justify-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-xl">
              <span class="text-xs text-zinc-400 font-bold uppercase tracking-widest">Generando...</span>
            </div>
          </div>

          <button @click="showQRModal = false" class="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold uppercase tracking-widest transition-colors border border-white/10">
            Cerrar
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import QRCode from 'qrcode'
import { 
  User, UserCheck, Search, Plus, Eye, Activity, FileText, X, ChevronDown, ChevronRight, 
  GraduationCap, ClipboardList, ShieldAlert, HeartPulse, Clock, Undo2
} from 'lucide-vue-next'

const isDashboardOpen = ref(true)
const showDetail = ref(false)
const selectedPerson = ref(null)
const activeTab = ref('summary')
const showQRModal = ref(false)
const qrDataUrl = ref('')

async function openQR() {
  if (!selectedPerson.value) return
  
  const baseUrl = window.location.origin
  // Generar ruta de trabajador limpia de puntos y guión
  const rutClean = selectedPerson.value.rut.replace(/[^0-9Kk]/g, '')
  const url = `${baseUrl}/trabajador/${rutClean}`
  
  try {
    showQRModal.value = true
    qrDataUrl.value = ''
    
    qrDataUrl.value = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
  } catch (err) {
    console.error('Error generando QR:', err)
  }
}

const sstKPIs = [
  { label: 'Aptitud Médica Total', value: '98.2%', trend: '+0.5%', trendColor: 'text-emerald-500' },
  { label: 'Cierre Compromisos', value: '100%', trend: 'META OK', trendColor: 'text-emerald-500' },
  { label: 'Exámenes Vencidos', value: '02', trend: 'PERSONAL CRITICO', trendColor: 'text-destructive font-black' },
  { label: 'Índice de Conducta', value: '9.4', trend: 'NIVEL A1', trendColor: 'text-blue-500' },
]

const tabs = [
  { id: 'summary', label: 'Seguridad 360' },
  { id: 'docs', label: 'Carpeta Digital' },
  { id: 'training', label: 'Capacitación y Licencias' },
  { id: 'health', label: 'Salud Ocupacional' },
  { id: 'observations', label: 'Observaciones Conductuales' },
]

const personStats = [
  { label: 'Antigüedad', value: '6.2 Años', icon: Clock },
  { label: 'Accidentabilidad', value: 'CERO', icon: ShieldAlert },
  { label: 'Aptitud Altura', value: 'VIGENTE', icon: HeartPulse },
  { label: 'Carga Laboral', value: 'ÓPTIMA', icon: ClipboardList },
]

const staff = [
  { 
    id: 1, name: 'SEBASTIAN GAJARDO', rut: '15.432.XXX-K', position: 'CONDUCTOR CARGA PESADA', department: 'OPERACIONES', project: 'CODELCO DMH', 
    medStatus: 'ok', capStatus: 'ok', riskLevel: 'baja', photo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop',
    docs: [
      { name: 'Contrato de Trabajo', expiry: 'INDETERMINADO', expired: false },
      { name: 'Seguro de Vida (Mutual)', expiry: '31/12/2024', expired: false },
      { name: 'Licencia Municipal Clase A5', expiry: '12/03/2025', expired: false },
      { name: 'Certificado Antecedentes', expiry: '15/05/2024', expired: false },
    ],
    certs: [
      { name: 'Examen Ocupacional Gran Altura Geográfica', expiry: '12/12/2024', expired: false },
      { name: 'Licencia Interna de Conducción Operacional', expiry: '15/05/2024', expired: false },
      { name: 'Aptitud Psicosensométrica Rigurosa', expiry: '02/01/2025', expired: false },
    ]
  },
  { 
    id: 2, name: 'RICARDO ALARCON', rut: '18.990.XXX-2', position: 'MECÁNICO LÍDER', department: 'MANTENIMIENTO', project: 'BHP SPENCE', 
    medStatus: 'error', capStatus: 'ok', riskLevel: 'media', photo: null,
    docs: [
      { name: 'Contrato de Trabajo', expiry: '30/06/2024', expired: false },
      { name: 'Certificado de Título', expiry: 'PERMANENTE', expired: false },
    ],
    certs: []
  },
  { 
    id: 3, name: 'FELIPE CALDERON', rut: '16.772.XXX-9', position: 'TECNICO SST', department: 'PREVENCIÓN', project: 'AMS CENTINELA', 
    medStatus: 'ok', capStatus: 'error', riskLevel: 'baja', photo: null,
    docs: [
      { name: 'Certificado Mutualidad', expiry: '01/01/2025', expired: false },
    ],
    certs: []
  },
  { 
    id: 4, name: 'MARCOS VERA', rut: '14.550.XXX-4', position: 'OPERADOR LOGÍSTICO', department: 'SUMINISTRO', project: 'COLLAHUASI', 
    medStatus: 'ok', capStatus: 'ok', riskLevel: 'alta', photo: null,
    docs: [
      { name: 'Seguro Complementario', expiry: '31/12/2024', expired: false },
    ],
    certs: []
  },
]

function openDetail(person) {
  selectedPerson.value = person
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedPerson.value = null
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
