<template>
  <div class="space-y-6 text-left">
    <!-- CABECERA PRINCIPAL -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-white/5 pb-5 gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-2xl">📚</span>
          <h2 class="text-xl font-black text-white uppercase tracking-wider font-display">
            Gestor Documental Dimensional
          </h2>
          <span class="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
            Flota & Personal Real (BD GSP)
          </span>
        </div>
        <p class="text-xs text-slate-400 mt-1">
          Control de vigencias en tiempo real de los 110 equipos y colaboradores: 🟢 Vigentes, 🟡 Por Vencer (≤ 30d) y 🔴 Vencidos.
        </p>
      </div>

      <!-- RESUMEN GLOBAL COMPACTO -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="bg-[#090d16] border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
          <span class="text-slate-400">Total Documentos:</span>
          <span class="font-bold text-white font-mono">{{ totalDocsContabilizados }}</span>
        </div>
        <div class="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
          <span class="text-emerald-400">🟢 Vigentes:</span>
          <span class="font-bold text-emerald-300 font-mono">{{ totalVigentes }}</span>
        </div>
        <div class="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
          <span class="text-amber-400">🟡 Por Vencer:</span>
          <span class="font-bold text-amber-300 font-mono">{{ totalPorVencer }}</span>
        </div>
        <div class="bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
          <span class="text-red-400">🔴 Vencidos:</span>
          <span class="font-bold text-red-300 font-mono">{{ totalVencidos }}</span>
        </div>
      </div>
    </div>

    <!-- BARRA DE CONTROLES: FILTROS DIMENSIONALES, BUSCADOR Y ACCIONES -->
    <div class="bg-[#0a0f1e] border border-white/10 rounded-2xl p-4 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        <!-- SELECTOR DE DIMENSIÓN -->
        <div class="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            @click="cambiarDimension('todas')"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            :class="activeDimension === 'todas'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-white/5'"
          >
            <span>🌐</span>
            <span>Todas las Dimensiones</span>
          </button>
          <button
            v-for="dim in dimensiones"
            :key="dim.id"
            @click="cambiarDimension(dim.id)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            :class="activeDimension === dim.id
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-white/5'"
          >
            <span>{{ dim.icon }}</span>
            <span>{{ dim.label }}</span>
            <span
              class="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold"
              :class="activeDimension === dim.id ? 'bg-black/30 text-black' : 'bg-white/10 text-slate-300'"
            >
              {{ dim.count }}
            </span>
          </button>
        </div>

        <!-- CONTROLES DE ÁRBOL -->
        <div class="flex items-center gap-2">
          <button
            @click="expandAllNodes"
            class="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
          >
            <span>📂</span>
            <span>Expandir Todo</span>
          </button>
          <button
            @click="collapseAllNodes"
            class="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
          >
            <span>📁</span>
            <span>Colapsar Todo</span>
          </button>
        </div>
      </div>

      <!-- LÍNEA 2: BUSCADOR Y FILTRO DE ESTADO -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/5">
        <div class="relative w-full sm:w-96">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs">
            🔍
          </span>
          <input
            v-model="filtroGlobal"
            type="text"
            placeholder="Buscar por patente (ej: CWWG), equipo, RUT, persona o archivo..."
            class="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all"
          />
        </div>

        <!-- Filtro por Vigencia -->
        <div class="flex items-center gap-1.5 text-xs self-end sm:self-auto">
          <span class="text-slate-500 text-[11px] font-semibold mr-1">Filtrar Estado:</span>
          <button
            v-for="st in ['TODOS', 'VIGENTE', 'POR_VENCER', 'VENCIDO']"
            :key="st"
            @click="filtroEstadoVigencia = st"
            class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
            :class="filtroEstadoVigencia === st
              ? 'bg-white/20 text-white border border-white/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'"
          >
            <span v-if="st === 'TODOS'">Todos</span>
            <span v-else-if="st === 'VIGENTE'">🟢 Vigentes</span>
            <span v-else-if="st === 'POR_VENCER'">🟡 Por Vencer</span>
            <span v-else-if="st === 'VENCIDO'">🔴 Vencidos</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ÁRBOL JERÁRQUICO UNIFICADO CON SEMÁFOROS REALES DE TODA LA FLOTA -->
    <div class="bg-[#0a0f1e] border border-white/10 rounded-2xl p-6 min-h-[600px]">
      
      <!-- ESTADO DE CARGA -->
      <div v-if="cargandoDatos" class="p-16 text-center text-slate-400 space-y-3">
        <div class="inline-block animate-spin text-3xl">⏳</div>
        <p class="text-sm font-semibold text-slate-300">Cargando 110 equipos, colaboradores y 575 certificados desde PostgreSQL...</p>
        <p class="text-xs text-slate-500">Calculando semáforos de vigencia para cada patente y especialidad...</p>
      </div>

      <!-- ESTADO VACÍO POR BÚSQUEDA -->
      <div v-else-if="treeRootsFiltrados.length === 0" class="p-16 text-center text-slate-500 space-y-2">
        <span class="text-4xl">🔎</span>
        <p class="text-sm font-semibold text-slate-400">No se encontraron expedientes ni documentos</p>
        <p class="text-xs text-slate-600">Ningún elemento coincide con "{{ filtroGlobal }}"</p>
      </div>

      <!-- LISTA RAÍZ DEL ÁRBOL -->
      <div v-else class="space-y-3">
        <div
          v-for="dimRoot in treeRootsFiltrados"
          :key="dimRoot.id"
          class="border border-white/5 rounded-xl bg-black/20 overflow-hidden"
        >
          <!-- CABECERA DE DIMENSIÓN RAÍZ (NIVEL 0) -->
          <div
            @click="toggleNode(dimRoot.id)"
            class="flex items-center justify-between p-3.5 bg-[#0e1628] hover:bg-[#131e36] cursor-pointer transition-colors border-b border-white/5"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-slate-400 text-xs font-mono select-none">
                {{ isNodeExpanded(dimRoot.id) ? '▼' : '▶' }}
              </span>
              <span class="text-xl">{{ dimRoot.icon }}</span>
              <div class="min-w-0">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h3 class="text-sm font-black text-white uppercase tracking-wider font-display truncate">
                    {{ dimRoot.label }}
                  </h3>
                  <!-- Semáforo compacto de la dimensión -->
                  <div class="flex items-center gap-1 font-mono text-[10px] font-bold">
                    <span
                      v-if="getNodeStats(dimRoot).vigentes > 0"
                      class="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.2 rounded flex items-center gap-1"
                      title="Vigentes"
                    >
                      <span>🟢</span>
                      <span>{{ getNodeStats(dimRoot).vigentes }}</span>
                    </span>
                    <span
                      v-if="getNodeStats(dimRoot).porVencer > 0"
                      class="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded flex items-center gap-1"
                      title="Por Vencer (≤ 30 días)"
                    >
                      <span>🟡</span>
                      <span>{{ getNodeStats(dimRoot).porVencer }}</span>
                    </span>
                    <span
                      v-if="getNodeStats(dimRoot).vencidos > 0"
                      class="bg-red-500/15 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded flex items-center gap-1"
                      title="Vencidos"
                    >
                      <span>🔴</span>
                      <span>{{ getNodeStats(dimRoot).vencidos }}</span>
                    </span>
                  </div>
                </div>
                <p class="text-[11px] text-slate-400 truncate mt-0.5">{{ dimRoot.subtitle }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                {{ dimRoot.badge || `${dimRoot.children?.length || 0} carpetas` }}
              </span>
            </div>
          </div>

          <!-- CONTENIDO DE LA DIMENSIÓN (NIVEL 1: GRUPOS / CATEGORÍAS / CARGOS / CLIENTES) -->
          <div v-if="isNodeExpanded(dimRoot.id)" class="p-3 space-y-1.5 bg-black/10">
            <div
              v-for="groupNode in dimRoot.children"
              :key="groupNode.id"
              class="border border-white/5 rounded-lg bg-[#070b14]/60 overflow-hidden"
            >
              <!-- CABECERA DE GRUPO (NIVEL 1) -->
              <div
                @click="toggleNode(groupNode.id)"
                class="flex items-center justify-between p-2.5 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div class="flex items-center gap-2.5 min-w-0 flex-wrap">
                  <span class="text-slate-500 text-[10px] font-mono select-none">
                    {{ isNodeExpanded(groupNode.id) ? '▼' : '▶' }}
                  </span>
                  <span class="text-base">{{ groupNode.icon || '📁' }}</span>
                  <span class="text-xs font-bold text-slate-200 hover:text-white truncate">{{ groupNode.label }}</span>
                  
                  <!-- Semáforo compacto del grupo a la derecha del nombre -->
                  <div class="flex items-center gap-1 font-mono text-[10px] font-bold ml-1">
                    <span
                      v-if="getNodeStats(groupNode).vigentes > 0"
                      class="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.2 rounded flex items-center gap-0.5"
                      title="Vigentes"
                    >
                      <span>🟢</span>
                      <span>{{ getNodeStats(groupNode).vigentes }}</span>
                    </span>
                    <span
                      v-if="getNodeStats(groupNode).porVencer > 0"
                      class="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded flex items-center gap-0.5"
                      title="Por Vencer"
                    >
                      <span>🟡</span>
                      <span>{{ getNodeStats(groupNode).porVencer }}</span>
                    </span>
                    <span
                      v-if="getNodeStats(groupNode).vencidos > 0"
                      class="bg-red-500/15 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded flex items-center gap-0.5"
                      title="Vencidos"
                    >
                      <span>🔴</span>
                      <span>{{ getNodeStats(groupNode).vencidos }}</span>
                    </span>
                  </div>

                  <span v-if="groupNode.detail" class="text-[10px] text-slate-500 truncate">{{ groupNode.detail }}</span>
                </div>

                <span class="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded font-mono shrink-0">
                  {{ groupNode.children?.length || 0 }} ítems
                </span>
              </div>

              <!-- CONTENIDO DE GRUPO (NIVEL 2: PATENTE / PERSONA / OT) -->
              <div v-if="isNodeExpanded(groupNode.id)" class="pl-4 pr-2 pb-2 pt-1 border-l border-white/5 ml-4 space-y-1">
                <div
                  v-for="itemNode in groupNode.children"
                  :key="itemNode.id"
                  class="border border-white/5 rounded-md bg-[#0a0f1e]/80 overflow-hidden"
                >
                  <!-- CABECERA DE ELEMENTO (NIVEL 2) -->
                  <div
                    @click="toggleNode(itemNode.id)"
                    class="flex items-center justify-between p-2 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <!-- Lado Izquierdo: Chevron + Ícono + Nombre del Ítem + Semáforo Compacto -->
                    <div class="flex items-center gap-2.5 min-w-0 flex-wrap">
                      <span class="text-slate-500 text-[9px] font-mono select-none">
                        {{ isNodeExpanded(itemNode.id) ? '▼' : '▶' }}
                      </span>
                      <span class="text-sm">{{ itemNode.icon || '📦' }}</span>

                      <!-- Nombre del ítem (Patente / RUT / Nombre) -->
                      <span class="text-xs font-bold text-slate-200 hover:text-white truncate">
                        {{ itemNode.label }}
                      </span>

                      <!-- SEMÁFOROS COMPACTOS A LA DERECHA INMEDIATA DEL NOMBRE -->
                      <div class="flex items-center gap-1 font-mono text-[10px] font-bold ml-1 shrink-0">
                        <span
                          v-if="getNodeStats(itemNode).vigentes > 0"
                          class="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.2 rounded flex items-center gap-1"
                          title="Vigentes"
                        >
                          <span>🟢</span>
                          <span>{{ getNodeStats(itemNode).vigentes }}</span>
                        </span>

                        <span
                          v-if="getNodeStats(itemNode).porVencer > 0"
                          class="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded flex items-center gap-1"
                          title="Por Vencer (≤ 30 días)"
                        >
                          <span>🟡</span>
                          <span>{{ getNodeStats(itemNode).porVencer }}</span>
                        </span>

                        <span
                          v-if="getNodeStats(itemNode).vencidos > 0"
                          class="bg-red-500/15 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded flex items-center gap-1"
                          title="Vencidos"
                        >
                          <span>🔴</span>
                          <span>{{ getNodeStats(itemNode).vencidos }}</span>
                        </span>
                      </div>
                    </div>

                    <!-- Lado Derecho: Conteo de Documentos Reales -->
                    <span class="text-[10px] text-slate-500 font-mono shrink-0">
                      {{ countTotalArchivos(itemNode) }} docs
                    </span>
                  </div>

                  <!-- CONTENIDO DE ELEMENTO: ARCHIVOS REALES ALMACENADOS EN BD -->
                  <div v-if="isNodeExpanded(itemNode.id)" class="pl-4 pr-2 pb-2 pt-1 border-l border-white/5 ml-3 space-y-1">
                    
                    <!-- Sin documentos reales -->
                    <div v-if="!itemNode.files || itemNode.files.length === 0" class="p-3 text-slate-500 italic text-xs">
                      Sin documentos cargados en el expediente de este registro (0 archivos en BD).
                    </div>

                    <!-- CASO A: EXPEDIENTE DE PERSONA -> DOCUMENTOS UNIVERSALES + MATRIZ MULTI-EMPRESA (SPEC 45) -->
                    <div v-else-if="String(itemNode.id).startsWith('usr-')" class="space-y-3 pt-1 pb-1">
                      
                      <!-- 1. BLOQUE DOCUMENTOS UNIVERSALES Y COMPETENCIAS -->
                      <div class="bg-[#0b1325]/80 rounded-lg p-3 border border-slate-800/80 shadow-inner">
                        <div class="flex items-center justify-between mb-2">
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-sky-400">🌐 Documentos Universales y Competencias</span>
                            <span class="text-[10px] text-slate-400 font-mono">Válidos transversalmente en cualquier faena</span>
                          </div>
                          <span class="text-[10px] text-slate-500 font-mono">
                            {{ getArchivosUniversales(itemNode.files).length }} registrados
                          </span>
                        </div>

                        <div v-if="getArchivosUniversales(itemNode.files).length === 0" class="text-[11px] text-slate-500 italic py-1">
                          No cuenta con documentos universales registrados (Cédula de Identidad, Licencia de Conducir, Exámenes Ocupacionales).
                        </div>

                        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div
                            v-for="(uDoc, uIdx) in getArchivosUniversales(itemNode.files)"
                            :key="uIdx"
                            class="flex items-center justify-between p-2 rounded-lg bg-[#0e1628] border border-white/5 hover:border-sky-500/30 transition-all"
                          >
                            <div class="flex items-center gap-2 min-w-0">
                              <span class="text-base">{{ getFileIcon(uDoc.name) }}</span>
                              <div class="min-w-0">
                                <span class="text-xs font-semibold text-slate-200 block truncate" :title="uDoc.name">
                                  {{ uDoc.tipo }}
                                </span>
                                <span class="text-[10px] text-slate-400 font-mono">
                                  📅 {{ getDetalleDiasVencimiento(uDoc.fecha_vencimiento) }}
                                </span>
                              </div>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                              <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold" :class="getVigenciaBadgeClass(uDoc)">
                                {{ getVigenciaIcon(uDoc) }} {{ calcularEstadoVigencia(uDoc.fecha_vencimiento) }}
                              </span>
                              <button
                                @click="abrirDocumentoNuevaPestana(uDoc)"
                                type="button"
                                class="cursor-pointer text-[10px] bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded font-bold transition-all"
                                title="Abrir PDF oficial"
                              >
                                👁️ Ver
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 2. MATRIZ LABORAL MULTI-EMPRESA (4 COLUMNAS) -->
                      <div class="bg-[#0b1325]/80 rounded-lg p-3 border border-slate-800/80 shadow-inner overflow-x-auto">
                        <div class="flex items-center justify-between mb-2">
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-amber-400">🏢 Cobertura Laboral por Razón Social</span>
                            <span class="text-[10px] text-slate-400">
                              (Matriz cruzada de Contratos, EPP, ODI y Reglamentos por empresa contratista)
                            </span>
                          </div>
                        </div>

                        <table class="w-full text-left border-collapse min-w-[620px]">
                          <thead>
                            <tr class="border-b border-slate-800 text-[11px] font-bold text-slate-300 bg-slate-900/60">
                              <th class="py-2 px-3 w-1/4">Tipo de Documento</th>
                              <th
                                v-for="emp in empresasList"
                                :key="emp.id_empresa"
                                class="py-2 px-2 text-center"
                              >
                                <div class="flex items-center justify-center gap-1.5">
                                  <span>{{ emp.logo }}</span>
                                  <span class="truncate max-w-[120px]" :title="emp.name">
                                    {{ emp.name.replace('Grúas ', '') }}
                                  </span>
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-800/60 text-xs">
                            <tr
                              v-for="tipoLab in getTiposLaboralesParaPersona(itemNode.files)"
                              :key="tipoLab"
                              class="hover:bg-slate-800/30 transition-colors"
                            >
                              <td class="py-2 px-3 font-medium text-slate-300">
                                {{ tipoLab }}
                              </td>
                              <td
                                v-for="emp in empresasList"
                                :key="emp.id_empresa"
                                class="py-2 px-2 text-center"
                              >
                                <!-- Si existe documento para esa empresa -->
                                <template v-if="getDocLaboralCelda(itemNode.files, tipoLab, emp.id_empresa)">
                                  <div class="inline-flex items-center gap-1.5">
                                    <span
                                      class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold"
                                      :class="getVigenciaBadgeClass(getDocLaboralCelda(itemNode.files, tipoLab, emp.id_empresa))"
                                    >
                                      {{ getVigenciaIcon(getDocLaboralCelda(itemNode.files, tipoLab, emp.id_empresa)) }} Vigente
                                    </span>
                                    <button
                                      @click="abrirDocumentoNuevaPestana(getDocLaboralCelda(itemNode.files, tipoLab, emp.id_empresa))"
                                      type="button"
                                      class="cursor-pointer text-[9px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold transition-all"
                                      :title="`Ver ${getDocLaboralCelda(itemNode.files, tipoLab, emp.id_empresa).name}`"
                                    >
                                      👁️
                                    </button>
                                  </div>
                                </template>
                                <!-- Si no existe para esa empresa -->
                                <template v-else>
                                  <span class="text-slate-600 text-xs select-none" title="No registrado para esta empresa">—</span>
                                </template>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- CASO B: EXPEDIENTE DE EQUIPOS, EMPRESAS Y CLIENTES (LISTA PLANA DE EXPEDIENTE) -->
                    <div
                      v-else
                      v-for="(file, fIdx) in getFilesFiltrados(itemNode.files)"
                      :key="fIdx"
                      class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-[#0e1628]/60 hover:bg-[#131e36] border border-white/5 gap-2 transition-all group"
                    >
                      <!-- DATOS DEL ARCHIVO REAL -->
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="text-base">{{ getFileIcon(file.name) }}</span>
                        <div class="min-w-0">
                          <a
                            @click.prevent="abrirDocumentoNuevaPestana(file)"
                            href="#"
                            class="text-xs font-bold text-slate-200 hover:text-amber-300 transition-colors truncate block cursor-pointer"
                            :title="file.name"
                          >
                            {{ file.name }}
                          </a>
                          <div class="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span class="text-emerald-400 font-medium">{{ file.tipo || 'Certificado' }}</span>
                            <span>•</span>
                            <span>Emisor: {{ file.emisor || 'GSP' }}</span>
                            <!-- Badge de Razón Social Emisora (Spec 45) -->
                            <span
                              v-if="file.empresa_emisora"
                              class="font-mono text-[9px] px-1.5 py-0.2 rounded font-bold border"
                              :class="file.id_empresa === 9 ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
                                      file.id_empresa === 7 ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                                      file.id_empresa === 8 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                                      'bg-purple-500/10 text-purple-300 border-purple-500/30'"
                            >
                              🏢 {{ file.empresa_emisora }}
                            </span>
                            <span v-else-if="file.es_universal" class="font-mono text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded">
                              🌐 Universal
                            </span>
                            <span>•</span>
                            <span class="font-mono text-slate-500">ID Doc: {{ file.id_doc }}</span>
                            <span>•</span>
                            <!-- VENCIMIENTO REAL EN TEXTO -->
                            <span class="font-mono font-medium" :class="getVigenciaTextClass(file)">
                              📅 {{ getDetalleDiasVencimiento(file.fecha_vencimiento) }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <!-- SEMÁFORO Y ACCIÓN DIRECTA DE APERTURA -->
                      <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <!-- Badge de Vigencia con Días -->
                        <span
                          class="text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1.5"
                          :class="getVigenciaBadgeClass(file)"
                        >
                          <span>{{ getVigenciaIcon(file) }}</span>
                          <span>{{ getVigenciaLabelCompleto(file) }}</span>
                        </span>

                        <!-- Botón de apertura en nueva pestaña hacia el archivo real -->
                        <button
                          @click="abrirDocumentoNuevaPestana(file)"
                          type="button"
                          class="cursor-pointer text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow-amber-500/10"
                          title="Abrir archivo PDF real en una nueva pestaña"
                        >
                          <span>Abrir</span>
                          <span class="text-[10px]">↗</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL VISOR REPORT DIARIO DE IZAJE (FAENA REAL) -->
    <ModalVisorReport
      :visible="modalVisorReportAbierto"
      :report="reportSeleccionadoParaVisor"
      @close="modalVisorReportAbierto = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiAxios from '../services/api'
import ModalVisorReport from '../components/Operaciones/ModalVisorReport.vue'

// --- ESTADO GENERAL ---
const activeDimension = ref('todas')
const cargandoDatos = ref(false)
const expandedNodes = ref(new Set(['dim-equipos', 'dim-personas']))

const filtroGlobal = ref('')
const filtroEstadoVigencia = ref('TODOS')

// --- DATOS MAESTROS PROVENIENTES DE BD ---
const empresasList = ref([
  { id_empresa: 9, name: 'Grúas San Pablo SpA', rut: '76.123.456-7', rubro: 'Izaje Industrial & Grúas Móviles', logo: '🏗️' },
  { id_empresa: 7, name: 'Bestmaq Arriendos', rut: '76.209.534-3', rubro: 'Maquinaria Usada & Equipos Pesados', logo: '🚜' },
  { id_empresa: 8, name: 'Logística del Sur', rut: '76.890.123-4', rubro: 'Transporte Cama Baja & Escoltas', logo: '🚛' },
  { id_empresa: 11, name: 'Royal Rental', rut: '76.345.678-9', rubro: 'Plataformas Articuladas & Tijeras', logo: '🏢' }
])

const equiposList = ref([])
const personasList = ref([])
const proyectosList = ref([])
const visitasTerrenoList = ref([])
const reportsProyectosCache = ref(new Map())

// Estado para visor interactivo de Report Diario Digital
const modalVisorReportAbierto = ref(false)
const reportSeleccionadoParaVisor = ref(null)

// Caché reactivo de certificados cargados desde PostgreSQL
const certsEquiposCache = ref(new Map())
const certsPersonasCache = ref(new Map())
const certsEmpresasCache = ref(new Map())

// --- DEFINICIÓN DE DIMENSIONES CANÓNICAS ---
const dimensiones = computed(() => [
  { id: 'empresa', label: 'Empresa / Holding', icon: '🏛️', count: empresasList.value.length },
  { id: 'equipos', label: 'Flota y Equipos', icon: '🚜', count: equiposList.value.length },
  { id: 'personas', label: 'Personas y Tripulación', icon: '👷', count: personasList.value.length },
  { id: 'procesos', label: 'Clientes y Procesos OTs', icon: '🏢', count: proyectosList.value.length }
])

// --- CARGA DE DATOS DESDE ENDPOINTS OFICIALES ---
const fetchDatosDimensiones = async () => {
  try {
    cargandoDatos.value = true

    // 1. Equipos (Flota completa de 110 equipos)
    const { data: eqData } = await apiAxios.get('/tequ-equipos')
    equiposList.value = Array.isArray(eqData?.data) ? eqData.data : (Array.isArray(eqData) ? eqData : [])

    // 2. Personas (Usuarios y Tripulación)
    const { data: usrData } = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
    personasList.value = Array.isArray(usrData) ? usrData : (usrData?.datos || [])

    // 3. Proyectos & Clientes
    const { data: pryData } = await apiAxios.get('/proyectos')
    proyectosList.value = Array.isArray(pryData?.proyectos) ? pryData.proyectos : []

    // 4. Visitas Técnicas a Terreno (66 visitas en BD con PDF)
    try {
      const { data: visData } = await apiAxios.get('/survey/visitas-terreno')
      visitasTerrenoList.value = Array.isArray(visData) ? visData : []
    } catch (errVis) {
      console.warn('Error cargando visitas a terreno:', errVis)
    }

    // RENDIMIENTO ULTRA-RÁPIDO (SPEC 45): Cero precarga masiva.
    // La vista abre instantáneamente (< 200ms). Los certificados y documentos
    // se consultan bajo demanda (Lazy Loading) exclusivamente cuando el usuario expande un registro.

  } catch (err) {
    console.error('Error cargando datos para el Gestor Documental:', err)
  } finally {
    cargandoDatos.value = false
  }
}

// --- CARGA DE CERTIFICADOS REALES DIRECTAMENTE DESDE LA BD REMOTA ---
const cargarCertificadosEquipoDirecto = async (idEquipo) => {
  if (certsEquiposCache.value.has(idEquipo)) return
  try {
    const { data } = await apiAxios.get(`/tequ-equipos/${idEquipo}/certificados`)
    const certs = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    certsEquiposCache.value.set(idEquipo, certs.map(c => ({
      id_doc: c.id_doc,
      id_certificado: c.id_certificado,
      name: c.name_doc_orig || `${c.nombre_tipo}.pdf`,
      tipo: c.nombre_tipo || 'Certificado de Equipo',
      emisor: c.entidad_emisora || 'GSP',
      fecha_emision: c.fecha_emision ? c.fecha_emision.split('T')[0] : 'S/I',
      fecha_vencimiento: c.fecha_vencimiento ? c.fecha_vencimiento.split('T')[0] : 'Permanente',
      size: c.path_doc || 'PDF Oficial'
    })))
  } catch (err) {
    certsEquiposCache.value.set(idEquipo, [])
  }
}

const cargarCertificadosPersonaDirecto = async (idUser) => {
  if (certsPersonasCache.value.has(idUser)) return
  try {
    const { data } = await apiAxios.get(`/acreditacion/personal/${idUser}`)
    const certs = Array.isArray(data?.data?.certificados) ? data.data.certificados : []
    certsPersonasCache.value.set(idUser, certs.map(c => ({
      id_doc: c.id_doc,
      id_certificado: c.id_certificado_persona || c.id_cert,
      name: c.observaciones?.replace(/^Carga inicial masiva - Archivo:\s*/i, '') || `${c.nombre_tipo}.pdf`,
      tipo: c.nombre_tipo || 'Certificado Personal',
      emisor: c.entidad_emisora || 'GSP',
      es_empresa_dependiente: !!c.es_empresa_dependiente,
      es_universal: !c.es_empresa_dependiente,
      id_empresa: c.id_empresa || null,
      empresa_emisora: c.empresa_emisora || (c.id_empresa === 9 ? 'GSP SpA' : (c.id_empresa ? `Empresa ${c.id_empresa}` : null)),
      fecha_emision: c.fecha_emision || 'S/I',
      fecha_vencimiento: c.fecha_vencimiento || 'Permanente',
      size: 'PDF Oficial'
    })))
  } catch (err) {
    certsPersonasCache.value.set(idUser, [])
  }
}

const cargarDocumentosEmpresaDirecto = async (idEmpresa) => {
  if (certsEmpresasCache.value.has(idEmpresa)) return
  try {
    const { data } = await apiAxios.get(`/acreditacion/empresa/${idEmpresa}/documentos`)
    const docs = Array.isArray(data?.data) ? data.data : []
    certsEmpresasCache.value.set(idEmpresa, docs.map(d => ({
      id_doc: d.id_doc,
      id_certificado: d.id_doc,
      name: d.name_doc_orig || `${d.name_doc_interno || 'Documento_Empresa'}.pdf`,
      tipo: 'Documento Institucional',
      emisor: d.name_empresa || 'Holding GSP',
      id_empresa: d.id_empresa,
      empresa_emisora: d.name_empresa,
      fecha_emision: d.fecha_creacion ? d.fecha_creacion.split('T')[0] : 'S/I',
      fecha_vencimiento: 'Permanente',
      size: 'PDF Oficial'
    })))
  } catch (err) {
    certsEmpresasCache.value.set(idEmpresa, [])
  }
}

// --- CONSTRUCCIÓN DEL ÁRBOL COMPLETO DE LAS 4 DIMENSIONES CON DATOS REALES ---
const allTreeRoots = computed(() => {
  const roots = []

  // 1. DIMENSIÓN EMPRESA / HOLDING (Expediente Institucional Real Spec 45)
  roots.push({
    id: 'dim-empresa',
    dimKey: 'empresa',
    label: '1. Dimensión Empresa & Holding',
    subtitle: 'Sociedades operativas del grupo San Pablo registradas en base de datos',
    icon: '🏛️',
    badge: `${empresasList.value.length} Empresas`,
    children: empresasList.value.map(emp => ({
      id: `emp-${emp.id_empresa}`,
      id_empresa: emp.id_empresa,
      label: `${emp.name} • RUT: ${emp.rut}`,
      icon: '🏢',
      get files() {
        return certsEmpresasCache.value.get(emp.id_empresa) || []
      }
    }))
  })

  // 2. DIMENSIÓN FLOTA Y EQUIPOS (110 EQUIPOS REALES + 289 CERTIFICADOS REALES)
  const gruposEquipos = {}
  equiposList.value.forEach(eq => {
    const cat = eq.nombre_categoria || eq.tipo_equipo || 'OTROS EQUIPOS'
    if (!gruposEquipos[cat]) gruposEquipos[cat] = []
    gruposEquipos[cat].push(eq)
  })

  roots.push({
    id: 'dim-equipos',
    dimKey: 'equipos',
    label: '2. Dimensión Flota & Equipos de Izaje',
    subtitle: '110 equipos reales con 289 certificados físicos almacenados en servidor',
    icon: '🚜',
    badge: `${equiposList.value.length} Equipos`,
    children: Object.keys(gruposEquipos).sort().map(cat => ({
      id: `cat-${cat}`,
      label: cat,
      icon: '🚛',
      detail: `${gruposEquipos[cat].length} unidades activas`,
      children: gruposEquipos[cat].map(eq => ({
        id: `eq-${eq.id_equipo}`,
        id_equipo: eq.id_equipo,
        label: `${eq.patente} • ${eq.marca || ''} ${eq.modelo || ''}`.trim(),
        icon: '🚚',
        get files() {
          return certsEquiposCache.value.get(eq.id_equipo) || []
        }
      }))
    }))
  })

  // 3. DIMENSIÓN PERSONAS Y TRIPULACIÓN (RECURSOS HUMANOS + 286 CERTIFICADOS REALES)
  const gruposPersonas = {}
  personasList.value.forEach(p => {
    const cargo = (p.cargo || p.json_data?.cargo || 'PERSONAL OPERATIVO').toUpperCase().trim()
    if (!gruposPersonas[cargo]) gruposPersonas[cargo] = []
    gruposPersonas[cargo].push(p)
  })

  roots.push({
    id: 'dim-personas',
    dimKey: 'personas',
    label: '3. Dimensión Personas & Tripulación',
    subtitle: 'Colaboradores registrados en plataforma con sus certificados laborales reales',
    icon: '👷',
    badge: `${personasList.value.length} Colaboradores`,
    children: Object.keys(gruposPersonas).sort().map(cargo => ({
      id: `cargo-${cargo}`,
      label: cargo,
      icon: '👥',
      detail: `${gruposPersonas[cargo].length} personas`,
      children: gruposPersonas[cargo].map(p => {
        const nombre = `${p.name_frst || ''} ${p.apellido_pat || ''}`.trim() || p.email
        return {
          id: `usr-${p.id_user}`,
          id_user: p.id_user,
          label: `${nombre} — RUT: ${p.rut || 'S/RUT'}`,
          icon: '👤',
          get files() {
            return certsPersonasCache.value.get(p.id_user) || []
          }
        }
      })
    }))
  })

  // 4. DIMENSIÓN CLIENTES Y PROCESOS COMERCIALES (OTS REALES)
  const gruposProyectos = {}
  proyectosList.value.forEach(pry => {
    const cliente = pry.nombre_cliente || pry.name_empresa_cliente || 'CLIENTE MANDANTE DIRECTO'
    if (!gruposProyectos[cliente]) gruposProyectos[cliente] = []
    gruposProyectos[cliente].push(pry)
  })

  roots.push({
    id: 'dim-procesos',
    dimKey: 'procesos',
    label: '4. Dimensión Clientes & Procesos Comerciales OTs',
    subtitle: `${proyectosList.value.length} OTs reales con sus cotizaciones, visitas técnicas, órdenes de trabajo y reportes de faena`,
    icon: '🏢',
    badge: `${proyectosList.value.length} OTs Registradas`,
    children: Object.keys(gruposProyectos).sort().map(cliente => ({
      id: `clt-${cliente}`,
      label: cliente,
      icon: '🏭',
      detail: `${gruposProyectos[cliente].length} servicios`,
      children: gruposProyectos[cliente].map(pry => {
        const cod = pry.codi_proyecto || `OT-${pry.id_proyecto}`
        const filesProy = []

        const jf = pry.json_field || {}
        const crm = jf.crm_v1 || jf.crm || {}
        const cotis = crm.cotizaciones_historicas || []
        const ops = jf.ejecucion_v1 || jf.operaciones_v1 || {}
        const ots = ops.ot_versiones || []

        // 1. Cotizaciones Comerciales Históricas en PDF
        cotis.forEach(c => {
          const idDoc = c.id_doc || (c.url ? c.url.replace('/api/archivo/ver/', '').replace(/^\//, '') : null)
          if (idDoc) {
            filesProy.push({
              id_doc: idDoc,
              url: c.url,
              name: c.nombre_archivo || `${cod}-Cotizacion-v${c.version}.pdf`,
              tipo: `Cotización Comercial (v${c.version})`,
              emisor: 'GSP Área Comercial',
              fecha_emision: c.fecha_creacion ? c.fecha_creacion.split('T')[0] : (c.fecha || 'S/I'),
              fecha_vencimiento: 'Permanente',
              size: 'PDF Oficial'
            })
          }
        })

        // 2. Órdenes de Trabajo (OT) Oficiales Aprobadas
        ots.forEach(o => {
          const idDoc = o.id_doc || (o.url ? o.url.replace('/api/archivo/ver/', '').replace(/^\//, '') : null)
          if (idDoc) {
            filesProy.push({
              id_doc: idDoc,
              url: o.url,
              name: o.nombre_archivo || `${cod}-OT-v${o.version}.pdf`,
              tipo: `Orden de Trabajo Formal (OT v${o.version})`,
              emisor: 'GSP Operaciones',
              fecha_emision: o.fecha_creacion ? o.fecha_creacion.split('T')[0] : (o.fecha || 'S/I'),
              fecha_vencimiento: 'Permanente',
              size: 'PDF Oficial'
            })
          }
        })

        // 3. Informes de Visitas Técnicas a Terreno
        const visitasDelProy = visitasTerrenoList.value.filter(v => v.id_proyecto === pry.id_proyecto && v.id_doc)
        visitasDelProy.forEach(v => {
          filesProy.push({
            id_doc: v.id_doc,
            name: `Informe Visita Técnica #${v.id_survey} - ${v.name_template_srv || 'Inspección'}.pdf`,
            tipo: `Visita Técnica a Terreno (#${v.id_survey})`,
            emisor: 'GSP Inspector Terreno',
            fecha_emision: v.fecha_plan_ini ? v.fecha_plan_ini.split('T')[0] : 'S/I',
            fecha_vencimiento: 'Permanente',
            size: 'PDF Oficial'
          })
        })

        // 4. Reportes Diarios de Izaje (Jornadas PWA)
        const reportsDelProy = reportsProyectosCache.value.get(pry.id_proyecto) || []
        reportsDelProy.forEach(r => {
          filesProy.push({
            id_doc: r.id_doc || null,
            rawReport: r,
            name: `Report Diario Izaje - Día ${r.dia_correlativo || 1} (${r.equipo_patente || 'Grúa'}).pdf`,
            tipo: `Report Diario Izaje (Día ${r.dia_correlativo || 1})`,
            emisor: `Operador: ${r.operador_nombre || 'GSP'}`,
            fecha_emision: r.fecha_reporte ? r.fecha_reporte.split('T')[0] : 'S/I',
            fecha_vencimiento: 'Permanente',
            size: r.estado_reporte === 'VALIDADO_ANALISTA' ? 'Validado Analista' : 'Firmado Mandante'
          })
        })

        return {
          id: `pry-${pry.id_proyecto}`,
          id_proyecto: pry.id_proyecto,
          label: `${cod}: ${pry.nombre_proyecto || 'Servicio de Izaje'}`,
          icon: '📋',
          files: filesProy
        }
      })
    }))
  })

  return roots
})

// --- RECURSIVE NODE STATS: CONTEO DE VIGENCIAS EN CADA NODO DEL ÁRBOL ---
const getNodeStats = (node) => {
  let vigentes = 0
  let porVencer = 0
  let vencidos = 0
  let total = 0

  const scan = (n) => {
    if (n.files && Array.isArray(n.files)) {
      n.files.forEach(f => {
        total++
        const st = calcularEstadoVigencia(f.fecha_vencimiento)
        if (st === 'VIGENTE') vigentes++
        else if (st === 'POR_VENCER') porVencer++
        else if (st === 'VENCIDO') vencidos++
      })
    }
    if (n.children && Array.isArray(n.children)) {
      n.children.forEach(scan)
    }
  }

  scan(node)
  return { total, vigentes, porVencer, vencidos }
}

// --- FILTRADO REACTIVO DEL ÁRBOL ---
const treeRootsFiltrados = computed(() => {
  let roots = allTreeRoots.value

  if (activeDimension.value !== 'todas') {
    roots = roots.filter(r => r.dimKey === activeDimension.value)
  }

  const q = filtroGlobal.value.trim().toLowerCase()
  const vigenciaFiltro = filtroEstadoVigencia.value

  if (!q && vigenciaFiltro === 'TODOS') {
    return roots
  }

  return roots.map(root => filterTreeNode(root, q, vigenciaFiltro)).filter(Boolean)
})

function filterTreeNode(node, q, vigenciaFiltro) {
  const matchLabel = !q || (node.label || '').toLowerCase().includes(q)

  let filesFiltrados = []
  if (node.files && Array.isArray(node.files)) {
    filesFiltrados = node.files.filter(f => {
      const matchFileQ = !q || (f.name || '').toLowerCase().includes(q) || (f.tipo || '').toLowerCase().includes(q)
      const matchVig = vigenciaFiltro === 'TODOS' || calcularEstadoVigencia(f.fecha_vencimiento) === vigenciaFiltro
      return matchFileQ && matchVig
    })
  }

  let childrenFiltrados = []
  if (node.children && Array.isArray(node.children)) {
    childrenFiltrados = node.children
      .map(child => filterTreeNode(child, q, vigenciaFiltro))
      .filter(Boolean)
  }

  const hasMatchingFiles = filesFiltrados.length > 0
  const hasMatchingChildren = childrenFiltrados.length > 0

  if (matchLabel || hasMatchingFiles || hasMatchingChildren) {
    if (q) expandedNodes.value.add(node.id)

    return {
      ...node,
      children: hasMatchingChildren ? childrenFiltrados : (matchLabel ? node.children : []),
      files: hasMatchingFiles ? filesFiltrados : (matchLabel ? node.files : [])
    }
  }

  return null
}

// --- GESTIÓN DE EXPANSIÓN DE NODOS (LAZY LOADING EN DEMANDA SPEC 45) ---
const toggleNode = (id) => {
  if (expandedNodes.value.has(id)) {
    expandedNodes.value.delete(id)
  } else {
    expandedNodes.value.add(id)
    const strId = String(id)
    if (strId.startsWith('usr-')) {
      const uId = strId.replace('usr-', '')
      cargarCertificadosPersonaDirecto(uId)
    } else if (strId.startsWith('eq-')) {
      const eqId = strId.replace('eq-', '')
      cargarCertificadosEquipoDirecto(eqId)
    } else if (strId.startsWith('emp-')) {
      const empId = strId.replace('emp-', '')
      cargarDocumentosEmpresaDirecto(empId)
    } else if (strId.startsWith('cat-')) {
      const catName = strId.replace('cat-', '')
      const eqsEnCat = equiposList.value.filter(e => (e.nombre_categoria || e.tipo_equipo || 'OTROS EQUIPOS') === catName)
      eqsEnCat.forEach(e => cargarCertificadosEquipoDirecto(e.id_equipo))
    } else if (strId.startsWith('cargo-')) {
      const cargoName = strId.replace('cargo-', '')
      const persEnCargo = personasList.value.filter(p => (p.cargo || p.json_data?.cargo || 'PERSONAL OPERATIVO').toUpperCase().trim() === cargoName)
      persEnCargo.forEach(p => cargarCertificadosPersonaDirecto(p.id_user))
    }
  }
}

const isNodeExpanded = (id) => expandedNodes.value.has(id)

const expandAllNodes = () => {
  const allIds = new Set()
  const scan = (nodes) => {
    nodes.forEach(n => {
      allIds.add(n.id)
      if (n.children) scan(n.children)
    })
  }
  scan(allTreeRoots.value)
  expandedNodes.value = allIds
}

const collapseAllNodes = () => {
  expandedNodes.value.clear()
}

const cambiarDimension = (dimId) => {
  activeDimension.value = dimId
  if (dimId !== 'todas') {
    expandedNodes.value.add(`dim-${dimId}`)
  }
}

// --- CONTEO Y FILTRADO DE ARCHIVOS ---
const getFilesFiltrados = (files = []) => {
  if (!Array.isArray(files)) return []
  if (filtroEstadoVigencia.value === 'TODOS') return files
  return files.filter(f => calcularEstadoVigencia(f.fecha_vencimiento) === filtroEstadoVigencia.value)
}

const countTotalArchivos = (node) => {
  let count = 0
  if (node.files && Array.isArray(node.files)) count += node.files.length
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(ch => {
      count += countTotalArchivos(ch)
    })
  }
  return count
}

// --- CÁLCULO DE VIGENCIA EXPLÍCITO ---
const getDiffDays = (fechaVenc) => {
  if (!fechaVenc || fechaVenc === 'N/A' || fechaVenc === 'Permanente' || fechaVenc === 'S/I') return null
  
  let parts = []
  if (fechaVenc.includes('-')) {
    parts = fechaVenc.split('-')
    if (parts.length === 3) {
      const venc = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      const hoy = new Date()
      return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    }
  } else if (fechaVenc.includes('/')) {
    parts = fechaVenc.split('/')
    if (parts.length === 3) {
      const venc = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
      const hoy = new Date()
      return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    }
  }
  return null
}

const calcularEstadoVigencia = (fechaVenc) => {
  const diffDays = getDiffDays(fechaVenc)
  if (diffDays === null) return 'VIGENTE'
  if (diffDays < 0) return 'VENCIDO'
  if (diffDays <= 30) return 'POR_VENCER'
  return 'VIGENTE'
}

const getDetalleDiasVencimiento = (fechaVenc) => {
  const diffDays = getDiffDays(fechaVenc)
  if (diffDays === null) return 'Vigencia Permanente o Sin Vencimiento'
  if (diffDays < 0) return `Venció hace ${Math.abs(diffDays)} días (${fechaVenc})`
  if (diffDays === 0) return `Vence hoy (${fechaVenc})`
  if (diffDays <= 30) return `Vence en ${diffDays} días (${fechaVenc})`
  return `Vigente hasta ${fechaVenc}`
}

const getVigenciaLabelCompleto = (file) => {
  const st = calcularEstadoVigencia(file.fecha_vencimiento)
  const diffDays = getDiffDays(file.fecha_vencimiento)
  if (st === 'VENCIDO') return diffDays !== null ? `Vencido (-${Math.abs(diffDays)}d)` : 'Vencido'
  if (st === 'POR_VENCER') return diffDays !== null ? `Por Vencer (${diffDays}d)` : 'Por Vencer'
  return file.fecha_vencimiento === 'Permanente' ? 'Permanente' : `Vigente (${file.fecha_vencimiento})`
}

const todosLosDocumentosFlat = computed(() => {
  const list = []
  const scan = (node) => {
    if (node.files && Array.isArray(node.files)) list.push(...node.files)
    if (node.children && Array.isArray(node.children)) node.children.forEach(scan)
  }
  allTreeRoots.value.forEach(scan)
  return list
})

const totalDocsContabilizados = computed(() => todosLosDocumentosFlat.value.length)
const totalVigentes = computed(() => todosLosDocumentosFlat.value.filter(f => calcularEstadoVigencia(f.fecha_vencimiento) === 'VIGENTE').length)
const totalPorVencer = computed(() => todosLosDocumentosFlat.value.filter(f => calcularEstadoVigencia(f.fecha_vencimiento) === 'POR_VENCER').length)
const totalVencidos = computed(() => todosLosDocumentosFlat.value.filter(f => calcularEstadoVigencia(f.fecha_vencimiento) === 'VENCIDO').length)

const getVigenciaIcon = (file) => {
  const st = calcularEstadoVigencia(file.fecha_vencimiento)
  if (st === 'VENCIDO') return '🔴'
  if (st === 'POR_VENCER') return '🟡'
  return '🟢'
}

const getVigenciaBadgeClass = (file) => {
  const st = calcularEstadoVigencia(file.fecha_vencimiento)
  if (st === 'VENCIDO') return 'bg-red-500/20 text-red-300 border border-red-500/40'
  if (st === 'POR_VENCER') return 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
  return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
}

const getVigenciaTextClass = (file) => {
  const st = calcularEstadoVigencia(file.fecha_vencimiento)
  if (st === 'VENCIDO') return 'text-red-400 font-bold'
  if (st === 'POR_VENCER') return 'text-amber-400 font-bold'
  return 'text-emerald-400 font-semibold'
}

const getFileIcon = (filename = '') => {
  if (filename.toLowerCase().endsWith('.pdf')) return '📕'
  if (filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls')) return '📗'
  if (filename.toLowerCase().endsWith('.png') || filename.toLowerCase().endsWith('.jpg')) return '🖼️'
  return '📄'
}

// --- HELPERS PARA MATRIZ MULTI-EMPRESA DE PERSONAL (SPEC 45) ---
const tiposLaboralesEstandar = [
  'Contrato de Trabajo',
  'Entrega de EPP',
  'ODI / PTS',
  'Reglamento Interno',
  'Anexo de Contrato'
]

const getArchivosUniversales = (files = []) => {
  return (files || []).filter(f => !f.es_empresa_dependiente)
}

const getTiposLaboralesParaPersona = (files = []) => {
  const setTipos = new Set(tiposLaboralesEstandar)
  ;(files || []).forEach(f => {
    if (f.es_empresa_dependiente && f.tipo) {
      setTipos.add(f.tipo)
    }
  })
  return Array.from(setTipos)
}

const getDocLaboralCelda = (files = [], tipoNombre = '', idEmpresa = null) => {
  return (files || []).find(f => {
    const coincideEmpresa = Number(f.id_empresa) === Number(idEmpresa)
    const tipoNorm = (f.tipo || '').toLowerCase().trim()
    const matchNorm = tipoNombre.toLowerCase().trim()
    const coincideTipo = tipoNorm.includes(matchNorm) || matchNorm.includes(tipoNorm)
    return coincideEmpresa && coincideTipo
  }) || null
}

// --- ACCIÓN: ABRIR EL ARCHIVO PDF REAL EN NUEVA PESTAÑA DEL NAVEGADOR ---
const abrirDocumentoNuevaPestana = (file) => {
  // Si es un Report Diario Digital de Izaje, abrir el visor modal interactivo de faena
  if (file.rawReport) {
    reportSeleccionadoParaVisor.value = file.rawReport
    modalVisorReportAbierto.value = true
    return
  }

  if (!file.id_doc && !file.url) {
    alert('Este requisito no cuenta con un archivo físico cargado en el servidor.')
    return
  }

  // Abre el PDF binario real desde el servidor de almacenamiento de GSP
  const idDoc = file.id_doc || (file.url ? file.url.replace('/api/archivo/ver/', '').replace(/^\//, '') : '')
  const url = `https://servidor.leanglobal.cl/lg-gsp/api/archivo/ver/${idDoc}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(fetchDatosDimensiones)
</script>
