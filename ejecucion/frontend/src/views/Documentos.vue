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
                  <div v-if="dimRoot.id !== 'dim-procesos'" class="flex items-center gap-1 font-mono text-[10px] font-bold">
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
                  
                  <!-- Semáforo compacto del grupo a la derecha del nombre (solo para grupos con documentos completos indexados: flota, personas, empresas) -->
                  <div v-if="!String(groupNode.id).startsWith('clt-')" class="flex items-center gap-1 font-mono text-[10px] font-bold ml-1">
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

                  <span v-if="groupNode.detail && !String(groupNode.id).startsWith('clt-')" class="text-[10px] text-slate-500 truncate">{{ groupNode.detail }}</span>
                </div>

                <span class="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded font-mono shrink-0">
                  <template v-if="String(groupNode.id).startsWith('clt-')">
                    {{ groupNode.children?.length || 0 }} {{ (groupNode.children?.length === 1) ? 'proceso' : 'procesos' }}
                  </template>
                  <template v-else>
                    {{ groupNode.children?.length || 0 }} ítems
                  </template>
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

                      <!-- SEMÁFOROS COMPACTOS A LA DERECHA INMEDIATA DEL NOMBRE (Solo cuando la OT ya tiene su expediente completo cargado) -->
                      <div
                        v-if="!String(itemNode.id).startsWith('pry-') || expedientesProyectosCache.has(Number(itemNode.id_proyecto))"
                        class="flex items-center gap-1 font-mono text-[10px] font-bold ml-1 shrink-0"
                      >
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

                    <!-- Lado Derecho: Conteo de Documentos Reales y Botón de Subida para Empresa -->
                    <div class="flex items-center gap-2 shrink-0">
                      <button
                        v-if="String(itemNode.id).startsWith('emp-')"
                        @click.stop="abrirModalSubirDocEmpresa(itemNode.id_empresa)"
                        class="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Subir nuevo documento institucional para esta empresa"
                      >
                        <span>+ 📤</span>
                        <span>Subir Doc</span>
                      </button>
                      <template v-if="String(itemNode.id).startsWith('pry-')">
                        <span v-if="expedientesProyectosCache.has(Number(itemNode.id_proyecto))" class="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded font-mono shrink-0">
                          {{ countTotalArchivos(itemNode) }} docs
                        </span>
                        <span v-else class="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono shrink-0">
                          Expediente 360°
                        </span>
                      </template>
                      <template v-else>
                        <span class="text-[10px] text-slate-500 font-mono shrink-0">
                          {{ countTotalArchivos(itemNode) }} docs
                        </span>
                      </template>
                    </div>
                  </div>

                  <!-- CONTENIDO DE ELEMENTO: ARCHIVOS REALES ALMACENADOS EN BD -->
                  <div v-if="isNodeExpanded(itemNode.id)" class="pl-4 pr-2 pb-2 pt-1 border-l border-white/5 ml-3 space-y-1">
                    
                    <!-- Sin documentos reales -->
                    <div v-if="!itemNode.files || itemNode.files.length === 0" class="p-3 text-slate-500 italic text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/20 rounded-lg">
                      <span>Sin documentos cargados en el expediente de este registro (0 archivos en BD).</span>
                      <button
                        v-if="String(itemNode.id).startsWith('emp-')"
                        @click.stop="abrirModalSubirDocEmpresa(itemNode.id_empresa)"
                        class="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold transition-all self-start sm:self-auto cursor-pointer"
                      >
                        + 📤 Subir Primer Documento
                      </button>
                    </div>

                    <!-- CASO C: EXPEDIENTE INTEGRAL E2E POR OT (SPEC-086) -->
                    <div v-else-if="String(itemNode.id).startsWith('pry-')" class="space-y-2 pt-1 pb-1">
                      <!-- Cabecera de Resumen de Expediente -->
                      <div class="flex items-center justify-between px-3 py-1.5 bg-[#070e1c] rounded border border-sky-500/20 text-xs">
                        <div class="flex items-center gap-2">
                          <span class="text-sky-400 font-bold">📋 Expediente Integral E2E</span>
                          <span class="text-slate-400 text-[10px]">Trazabilidad Documental E2E del Servicio</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                            {{ countEtapasConDocs(itemNode) }} de {{ getEtapasParaProyecto(itemNode).length }} Etapas Activas
                          </span>
                          <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {{ getFilesFiltrados(itemNode.files).length }} Documentos
                          </span>
                        </div>
                      </div>

                      <!-- Contenedor de Etapas Canónicas -->
                      <div
                        v-for="etapa in getEtapasParaProyecto(itemNode)"
                        :key="etapa.num"
                        class="rounded-lg border transition-all overflow-hidden"
                        :class="etapa.files.length > 0 ? 'bg-[#0a1224]/80 border-slate-700/60' : 'bg-[#070b14]/40 border-white/5 opacity-70'"
                      >
                        <!-- Cabecera de Etapa (Clic para colapsar/expandir) -->
                        <div
                          @click="toggleSubEtapa(itemNode.id, etapa.num)"
                          class="flex items-center justify-between p-2 cursor-pointer hover:bg-white/5 transition-colors select-none"
                        >
                          <div class="flex items-center gap-2 min-w-0">
                            <span class="text-slate-500 text-[9px] font-mono">
                              {{ isSubEtapaExpanded(itemNode.id, etapa.num) ? '▼' : '▶' }}
                            </span>
                            <span class="text-base">{{ etapa.icon }}</span>
                            <span class="text-xs font-bold" :class="etapa.files.length > 0 ? 'text-white' : 'text-slate-400'">
                              {{ etapa.nombre }}
                            </span>
                            <span class="text-[10px] text-slate-500 hidden sm:inline truncate max-w-[280px]">
                              — {{ etapa.desc }}
                            </span>
                          </div>

                          <div class="flex items-center gap-1.5 shrink-0">
                            <span
                              class="text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                              :class="etapa.files.length > 0
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-500 border border-slate-700/40'"
                            >
                              {{ etapa.files.length }} {{ etapa.files.length === 1 ? 'doc' : 'docs' }}
                            </span>
                          </div>
                        </div>

                        <!-- Lista de Archivos de la Etapa -->
                        <div
                          v-if="isSubEtapaExpanded(itemNode.id, etapa.num) && etapa.files.length > 0"
                          class="pl-4 pr-2 pb-2 pt-1 border-t border-white/5 space-y-1 bg-black/20"
                        >
                          <div
                            v-for="(file, fIdx) in etapa.files"
                            :key="fIdx"
                            class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-[#0e1628]/80 hover:bg-[#131e36] border border-white/5 gap-2 transition-all group"
                          >
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
                                  <span class="text-emerald-400 font-medium">{{ file.tipo }}</span>
                                  <span>•</span>
                                  <span>{{ file.emisor }}</span>
                                  <span>•</span>
                                  <span class="font-mono text-slate-500">Emisión: {{ file.fecha_emision }}</span>
                                  <span v-if="file.size">• {{ file.size }}</span>
                                </div>
                              </div>
                            </div>

                            <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                              <button
                                @click="abrirDocumentoNuevaPestana(file)"
                                class="text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-2 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Ver Documento"
                              >
                                <span>👁️</span>
                                <span>Ver</span>
                              </button>
                              <a
                                v-if="file.id_doc"
                                :href="`/api/archivo/ver/${file.id_doc}`"
                                download
                                class="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 px-2 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Descargar archivo original"
                              >
                                <span>⬇️</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        <!-- Etapa Vacía (Sin documentos) -->
                        <div
                          v-else-if="isSubEtapaExpanded(itemNode.id, etapa.num) && etapa.files.length === 0"
                          class="p-2.5 text-center text-slate-500 italic text-[11px] border-t border-white/5 bg-black/10"
                        >
                          Sin documentos registrados en esta etapa para este servicio.
                        </div>
                      </div>
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

                        <!-- Si es Report Diario de Izaje, botón secundario para abrir el formulario web interactivo -->
                        <button
                          v-if="file.rawReport"
                          @click.stop="abrirModalAuditoriaReport(file.rawReport)"
                          type="button"
                          class="cursor-pointer text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1"
                          title="Abrir formulario web interactivo para auditar o ajustar datos"
                        >
                          <span>✏️</span>
                          <span class="hidden sm:inline">Formulario Web</span>
                        </button>

                        <!-- Botón de dar de baja para documentos de empresa -->
                        <button
                          v-if="String(itemNode.id).startsWith('emp-')"
                          @click.stop="darDeBajaDocumentoEmpresa(file, itemNode.id_empresa)"
                          type="button"
                          class="cursor-pointer text-[11px] bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1"
                          title="Dar de baja este documento institucional de la empresa"
                        >
                          <span>🗑️</span>
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

    <!-- MODAL SUBIR DOCUMENTO DE EMPRESA (OPCIÓN A) -->
    <div
      v-if="modalSubirDocEmpresaAbierto"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div class="bg-[#0e1628] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Cabecera del Modal -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-[#131e36]">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">🏛️</span>
            <div>
              <h3 class="text-sm font-black text-white uppercase tracking-wider font-display">
                Cargar Documentación de Empresa
              </h3>
              <p class="text-[11px] text-slate-400">
                Acreditación institucional para el holding Grúas San Pablo
              </p>
            </div>
          </div>
          <button
            @click="cerrarModalSubirDocEmpresa"
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Cuerpo del Formulario -->
        <div class="p-5 space-y-4 text-xs">
          <!-- 1. Selector de Empresa -->
          <div>
            <label class="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
              Empresa del Holding *
            </label>
            <select
              v-model="nuevoDocEmpresa.id_empresa"
              class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500/50"
            >
              <option :value="null" disabled>Seleccionar empresa...</option>
              <option v-for="emp in empresasList" :key="emp.id_empresa" :value="emp.id_empresa">
                {{ emp.logo }} {{ emp.name }} (RUT: {{ emp.rut }})
              </option>
            </select>
          </div>

          <!-- 2. Tipo de Documento Institucional -->
          <div>
            <label class="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
              Tipo de Documento *
            </label>
            <select
              v-model="nuevoDocEmpresa.tipo_doc_id"
              @change="onTipoDocEmpresaChange"
              class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500/50"
            >
              <option v-for="t in catalogoTiposDocEmpresa" :key="t.id" :value="t.id">
                {{ t.nombre }}
              </option>
            </select>
          </div>

          <!-- 3. Nombre / Glosa Descriptiva -->
          <div>
            <label class="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
              Nombre o Glosa Descriptiva
            </label>
            <input
              v-model="nuevoDocEmpresa.nombre_glosa"
              type="text"
              placeholder="Ej: F30-1 Septiembre 2026"
              class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <!-- 4. Vigencia: Permanente vs Fecha -->
          <div class="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-slate-300 font-bold text-[10px] uppercase tracking-wider">Régimen de Vigencia</span>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="nuevoDocEmpresa.es_permanente"
                  class="rounded bg-black/40 border-white/20 text-amber-500 focus:ring-0"
                />
                <span class="text-[11px] text-slate-300 font-semibold">Vigencia Permanente</span>
              </label>
            </div>

            <div v-if="!nuevoDocEmpresa.es_permanente">
              <label class="block text-slate-400 text-[10px] mb-1">
                Fecha de Vencimiento *
              </label>
              <input
                v-model="nuevoDocEmpresa.fecha_vencimiento"
                type="date"
                class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500/50 [color-scheme:dark]"
              />
              <p class="text-[10px] text-amber-400/80 mt-1">
                💡 Nota: Los F30-1 suelen vencer el 15 del mes subsiguiente.
              </p>
            </div>
            <div v-else class="text-[10px] text-emerald-400 flex items-center gap-1.5">
              <span>🟢</span>
              <span>El documento se registrará con vigencia permanente e inmutable.</span>
            </div>
          </div>

          <!-- 5. Selector de Archivo PDF -->
          <div>
            <label class="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
              Archivo PDF Oficial *
            </label>
            <div class="border-2 border-dashed border-white/10 hover:border-amber-500/50 rounded-xl p-4 text-center transition-colors bg-black/20">
              <input
                type="file"
                accept=".pdf"
                id="fileInputDocEmpresa"
                class="hidden"
                @change="onFileChangeDocEmpresa"
              />
              <label for="fileInputDocEmpresa" class="cursor-pointer flex flex-col items-center gap-1.5">
                <span class="text-2xl">📄</span>
                <span v-if="!archivoDocEmpresa" class="text-xs text-amber-400 hover:underline font-bold">
                  Haga clic para seleccionar archivo PDF
                </span>
                <span v-else class="text-xs text-emerald-400 font-bold truncate max-w-xs">
                  ✅ {{ archivoDocEmpresa.name }} ({{ (archivoDocEmpresa.size / 1024).toFixed(1) }} KB)
                </span>
                <span class="text-[10px] text-slate-500">Solo archivos en formato PDF (máx. 20MB)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Footer / Acciones -->
        <div class="flex items-center justify-end gap-2.5 p-4 border-t border-white/10 bg-[#070b14]">
          <button
            @click="cerrarModalSubirDocEmpresa"
            type="button"
            class="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            @click="subirDocumentoEmpresaModal"
            type="button"
            :disabled="subiendoDocEmpresa"
            class="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="subiendoDocEmpresa" class="animate-spin">⏳</span>
            <span>{{ subiendoDocEmpresa ? 'Subiendo y Vinculando...' : '📤 Guardar y Vincular' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiAxios from '../services/api'
import { navStore } from '../stores/navStore'
import ModalVisorReport from '../components/Operaciones/ModalVisorReport.vue'

// --- ESTADO GENERAL ---
const activeDimension = ref('todas')
const cargandoDatos = ref(false)
const expandedNodes = ref(new Set(['dim-empresa', 'grupo-sociedades-holding', 'dim-equipos', 'dim-personas']))

const filtroGlobal = ref('')
const filtroEstadoVigencia = ref('TODOS')

// --- ESTADO PARA MODAL SUBIR DOCUMENTO DE EMPRESA (OPCIÓN A) ---
const modalSubirDocEmpresaAbierto = ref(false)
const subiendoDocEmpresa = ref(false)
const archivoDocEmpresa = ref(null)

const catalogoTiposDocEmpresa = [
  { id: 'F30-1', codigo: 'F30-1', nombre: 'Certificado F30-1 (Obligaciones Laborales y Previsionales)', permanente: false, diasSugeridosVenc: 45 },
  { id: 'SINIESTRALIDAD_DS67', codigo: 'SINIESTRALIDAD', nombre: 'Certificado de Siniestralidad Mutual (DS 67)', permanente: false, diasSugeridosVenc: 180 },
  { id: 'CARPETA_TRIBUTARIA', codigo: 'CARPETA_TRIBUTARIA', nombre: 'Carpeta Tributaria Electrónica (SII)', permanente: true },
  { id: 'RIOHS_POLITICAS', codigo: 'RIOHS', nombre: 'Reglamento Interno RIOHS & Políticas HSEC', permanente: false, diasSugeridosVenc: 365 },
  { id: 'CERT_MUTUALIDAD', codigo: 'AFILIACION_MUTUAL', nombre: 'Certificado de Afiliación a Mutualidad (ACHS / Mutual / IST)', permanente: false, diasSugeridosVenc: 365 },
  { id: 'E_RUT', codigo: 'E_RUT', nombre: 'Iniciación de Actividades / E-RUT Institucional', permanente: true },
  { id: 'ESCRITURA_PODERES', codigo: 'ESCRITURA', nombre: 'Escritura de Constitución y Poderes Notariales', permanente: true },
  { id: 'CERT_BANCARIO', codigo: 'CERT_BANCARIO', nombre: 'Certificado Bancario / Cuentas Corrientes', permanente: true },
  { id: 'OTRO_DOC_EMPRESA', codigo: 'DOC_INSTITUCIONAL', nombre: 'Otro Documento Institucional de Empresa', permanente: false, diasSugeridosVenc: 90 }
]

const nuevoDocEmpresa = ref({
  id_empresa: null,
  tipo_doc_id: 'F30-1',
  tipo_codigo: 'F30-1',
  tipo_nombre: 'Certificado F30-1 (Obligaciones Laborales y Previsionales)',
  nombre_glosa: '',
  es_permanente: false,
  fecha_vencimiento: ''
})

// --- DATOS MAESTROS PROVENIENTES DE BD ---
const empresasList = ref([
  { id_empresa: 9, name: 'Grúas San Pablo SpA', rut: '76.123.456-7', rubro: 'Izaje Industrial & Grúas Móviles', logo: '🏢' },
  { id_empresa: 7, name: 'Bestmaq Arriendos', rut: '76.209.534-3', rubro: 'Maquinaria Usada & Equipos Pesados', logo: '🚜' },
  { id_empresa: 8, name: 'Logística del Sur', rut: '76.890.123-4', rubro: 'Transporte Cama Baja & Escoltas', logo: '🚛' },
  { id_empresa: 11, name: 'Royal Rental', rut: '76.345.678-9', rubro: 'Plataformas Articuladas & Tijeras', logo: '🏢' }
])

const equiposList = ref([])
const personasList = ref([])
const proyectosList = ref([])
const visitasTerrenoList = ref([])
const reportsProyectosCache = ref(new Map())
const actasProyectosMap = ref(new Map())
const expedientesProyectosCache = ref(new Map())
const subEtapasExpandidas = ref(new Set())

const tryJsonParse = (str) => {
  if (!str) return null
  if (typeof str === 'object') return str
  try { return JSON.parse(str) } catch { return null }
}

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

    // 3. Proyectos & Clientes (Carga universal para el árbol dimensional sin sesgo inicial)
    const { data: pryData } = await apiAxios.get('/proyectos', {
      params: { _bypass_empresa: true, _id_empresa: 0 }
    })
    proyectosList.value = Array.isArray(pryData?.proyectos) ? pryData.proyectos : []

    // 4. Visitas Técnicas a Terreno (66 visitas en BD con PDF)
    try {
      const { data: visData } = await apiAxios.get('/survey/visitas-terreno')
      visitasTerrenoList.value = Array.isArray(visData) ? visData : []
    } catch (errVis) {
      console.warn('Error cargando visitas a terreno:', errVis)
    }

    // 5. Actas 360° de Plataformas (Relacional Directo desde BD)
    try {
      const { data: actasData } = await apiAxios.get('/operaciones/acta-plataforma', {
        params: { _bypass_empresa: true, _id_empresa: 0 }
      })
      if (actasData?.success && Array.isArray(actasData.actas)) {
        actasProyectosMap.value.clear()
        actasData.actas.forEach(a => {
          const pid = Number(a.id_proyecto)
          if (!actasProyectosMap.value.has(pid)) {
            actasProyectosMap.value.set(pid, [])
          }
          actasProyectosMap.value.get(pid).push(a)
        })
      }
    } catch (errActas) {
      console.warn('Error cargando actas relacionales:', errActas)
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
    const [certRes, actasRes] = await Promise.allSettled([
      apiAxios.get(`/tequ-equipos/${idEquipo}/certificados`),
      apiAxios.get(`/operaciones/acta-plataforma/equipo/${idEquipo}`)
    ])

    const docsFinales = []

    if (certRes.status === 'fulfilled') {
      const certs = Array.isArray(certRes.value?.data?.data) ? certRes.value.data.data : (Array.isArray(certRes.value?.data) ? certRes.value.data : [])
      certs.forEach(c => {
        docsFinales.push({
          id_doc: c.id_doc,
          id_certificado: c.id_certificado,
          name: c.name_doc_orig || `${c.nombre_tipo}.pdf`,
          tipo: c.nombre_tipo || 'Certificado de Equipo',
          emisor: c.entidad_emisora || 'GSP',
          fecha_emision: c.fecha_emision ? c.fecha_emision.split('T')[0] : 'S/I',
          fecha_vencimiento: c.fecha_vencimiento ? c.fecha_vencimiento.split('T')[0] : 'Permanente',
          size: c.path_doc || 'PDF Oficial'
        })
      })
    }

    if (actasRes.status === 'fulfilled' && actasRes.value?.data?.success) {
      const actas = Array.isArray(actasRes.value.data.actas) ? actasRes.value.data.actas : []
      actas.forEach(a => {
        if (a.id_file_pdf_entrega) {
          docsFinales.push({
            id_doc: a.id_file_pdf_entrega,
            name: `${a.folio_acta}_ENTREGA.pdf`,
            tipo: 'Acta Entrega Terreno 360°',
            emisor: `Chofer: ${a.chofer_entrega_nombre || 'GSP'}`,
            empresa_emisora: a.cliente_nombre ? `Faena: ${a.cliente_nombre}` : null,
            fecha_emision: a.fecha_entrega ? String(a.fecha_entrega).split('T')[0] : 'S/I',
            fecha_vencimiento: 'Permanente',
            size: 'Acta Terreno'
          })
        }
        if (a.id_file_pdf_final) {
          docsFinales.push({
            id_doc: a.id_file_pdf_final,
            name: `${a.folio_acta}_FINAL.pdf`,
            tipo: 'Acta Retiro & Cierre Terreno 360°',
            emisor: `Chofer: ${a.chofer_retiro_nombre || 'GSP'}`,
            empresa_emisora: a.cliente_nombre ? `Faena: ${a.cliente_nombre}` : null,
            fecha_emision: a.fecha_retiro ? String(a.fecha_retiro).split('T')[0] : 'S/I',
            fecha_vencimiento: 'Permanente',
            size: 'Acta Terreno'
          })
        }
      })
    }

    // Contratos de arriendo asociados a este equipo
    proyectosList.value.forEach(p => {
      const jf = typeof p.json_field === 'string' ? (tryJsonParse(p.json_field) || {}) : (p.json_field || {})
      const crm = jf.crm_v1 || {}
      const ops = jf.ejecucion_v1 || {}
      const ctr = crm.contrato
      if (ctr && ctr.id_doc) {
        const match = crm.id_equipo == idEquipo ||
          ops.equipo_id == idEquipo ||
          (Array.isArray(ops.equipos_extra) && ops.equipos_extra.some(eqId => eqId == idEquipo)) ||
          (Array.isArray(crm.lineas_servicio) && crm.lineas_servicio.some(l => (l.equipo_asignado_id == idEquipo || l.id_equipo == idEquipo)))
        if (match) {
          docsFinales.push({
            id_doc: ctr.id_doc,
            name: `${ctr.folio || p.codi_proyecto + '-Contrato'}.pdf`,
            tipo: `Contrato de Arrendamiento (${ctr.estado || 'Emitido'})`,
            emisor: ctr.representante_nombre ? `Mandante: ${ctr.representante_nombre}` : (p.nombre_cliente || 'GSP'),
            fecha_emision: ctr.fecha_firma || (ctr.fecha_emision ? String(ctr.fecha_emision).split('T')[0] : 'S/I'),
            fecha_vencimiento: ctr.fecha_termino || 'Permanente',
            size: ctr.estado === 'FIRMADO_DIGITAL' ? 'Firmado FES' : 'PDF Oficial'
          })
        }
      }
    })

    certsEquiposCache.value.set(idEquipo, docsFinales)
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

const cargarDocumentosEmpresaDirecto = async (idEmpresa, forceReload = false) => {
  if (!forceReload && certsEmpresasCache.value.has(idEmpresa)) return
  try {
    const { data } = await apiAxios.get(`/acreditacion/empresa/${idEmpresa}/documentos`)
    const docs = Array.isArray(data?.data) ? data.data : []
    certsEmpresasCache.value.set(idEmpresa, docs.map(d => {
      let rawName = d.name_doc_orig || d.name_doc_interno || 'Documento_Empresa.pdf'
      let fechaVenc = 'Permanente'
      let tipoDoc = 'Documento Institucional'
      let nombreLimpio = rawName

      const vencMatch = rawName.match(/\[VENC:\s*(\d{4}-\d{2}-\d{2})\]/i) || rawName.match(/\(Vence\s*(\d{4}-\d{2}-\d{2})\)/i)
      if (vencMatch) {
        fechaVenc = vencMatch[1]
        nombreLimpio = nombreLimpio.replace(vencMatch[0], '').trim()
      }

      const tipoMatch = rawName.match(/^\[([^\]]+)\]\s*(.*)$/)
      if (tipoMatch) {
        tipoDoc = tipoMatch[1].replace(/_/g, ' ')
        nombreLimpio = tipoMatch[2].replace(/\[VENC:[^\]]+\]/gi, '').trim()
      }

      return {
        id_doc: d.id_doc,
        id_certificado: d.id_doc,
        name: nombreLimpio || rawName,
        raw_name: rawName,
        tipo: tipoDoc,
        emisor: d.name_empresa || 'Holding GSP',
        id_empresa: d.id_empresa,
        empresa_emisora: d.name_empresa,
        fecha_emision: d.fecha_creacion ? d.fecha_creacion.split('T')[0] : 'S/I',
        fecha_vencimiento: fechaVenc,
        size: 'PDF Oficial'
      }
    }))
  } catch (err) {
    certsEmpresasCache.value.set(idEmpresa, [])
  }
}

const cargarExpedienteProyectoDirecto = async (idProyecto) => {
  const pId = Number(idProyecto)
  if (!pId || expedientesProyectosCache.value.has(pId)) return
  try {
    const [repRes, viajeRes, itsRes, edpRes] = await Promise.allSettled([
      apiAxios.get(`/operaciones/report/proyecto/${pId}`),
      apiAxios.get(`/operaciones/viaje/proyecto/${pId}`),
      apiAxios.get(`/operaciones/its/${pId}`),
      apiAxios.get(`/operaciones/edp/proyecto/${pId}`)
    ])

    const reports = repRes.status === 'fulfilled'
      ? (Array.isArray(repRes.value?.data?.data) ? repRes.value.data.data : (Array.isArray(repRes.value?.data) ? repRes.value.data : []))
      : []

    const viajes = viajeRes.status === 'fulfilled' && Array.isArray(viajeRes.value?.data)
      ? viajeRes.value.data
      : []

    const its = (itsRes.status === 'fulfilled' && itsRes.value?.data?.success)
      ? itsRes.value.data
      : null

    const edps = edpRes.status === 'fulfilled' && Array.isArray(edpRes.value?.data)
      ? edpRes.value.data
      : []

    const newMap = new Map(expedientesProyectosCache.value)
    newMap.set(pId, { reports, viajes, its, edps })
    expedientesProyectosCache.value = newMap

    const repMap = new Map(reportsProyectosCache.value)
    repMap.set(pId, reports)
    reportsProyectosCache.value = repMap

    // Carga automática reactiva de certificados de flota y tripulación asignada
    const pryObj = proyectosList.value.find(p => Number(p.id_proyecto) === pId)
    if (pryObj) {
      const jf = typeof pryObj.json_field === 'string' ? (tryJsonParse(pryObj.json_field) || {}) : (pryObj.json_field || {})
      const ops = jf.ejecucion_v1 || jf.operaciones_v1 || {}
      const crm = jf.crm_v1 || {}
      const eqId = ops.equipo_id || crm.id_equipo || crm.equipo_asignado_id
      if (eqId) cargarCertificadosEquipoDirecto(eqId)
      const trip = Array.isArray(ops.tripulacion_asignada) ? ops.tripulacion_asignada : []
      trip.forEach(t => { if (t.id_user) cargarCertificadosPersonaDirecto(t.id_user) })
      if (ops.operador_id) cargarCertificadosPersonaDirecto(ops.operador_id)
      if (ops.rigger_id) cargarCertificadosPersonaDirecto(ops.rigger_id)
    }
  } catch (err) {
    console.warn(`[Expediente] Error cargando datos para OT ${pId}:`, err)
    const newMap = new Map(expedientesProyectosCache.value)
    newMap.set(pId, { reports: [], viajes: [], its: null, edps: [] })
    expedientesProyectosCache.value = newMap
  }
}

const cargarReportsProyectoDirecto = (idProyecto) => cargarExpedienteProyectoDirecto(idProyecto)

const ETAPAS_CANONICAS = [
  { num: 1, nombre: '1. Comercial & Preventa', icon: '💼', desc: 'Cotizaciones comerciales e informes de visita a terreno' },
  { num: 2, nombre: '2. Asignación de Recursos & Orden de Trabajo (OT)', icon: '📋', desc: 'Órdenes de Trabajo formales emitidas con asignación de grúa y tripulación' },
  { num: 3, nombre: '3. Logística, Despacho y Acreditaciones', icon: '🚛', desc: 'Hojas de ruta, evidencias de odómetros y acreditaciones técnicas/laborales de flota y tripulación' },
  { num: 4, nombre: '4. Operación en Faena (Izaje)', icon: '⏱️', desc: 'Reportes diarios de izaje por jornada firmados en terreno y respaldos físicos' },
  { num: 5, nombre: '5. Cierre Técnico, Liquidación & Facturación', icon: '💰', desc: 'Inspección Técnica de Salida (ITS), Carátulas de Estado de Pago (EDP) y Facturas DTE' },
  { num: 6, nombre: '6. Arriendo de Plataformas & Contratos Especiales', icon: '🪜', desc: 'Contratos de arriendo con firma digital FES y actas de entrega/retiro 360°', condicional: true }
]

const getEtapasParaProyecto = (itemNode) => {
  const allFiles = getFilesFiltrados(itemNode.files)
  return ETAPAS_CANONICAS
    .map(et => ({
      ...et,
      files: allFiles.filter(f => f.etapa_num === et.num)
    }))
    .filter(et => !et.condicional || et.files.length > 0)
}

const countEtapasConDocs = (itemNode) => {
  return getEtapasParaProyecto(itemNode).filter(et => et.files.length > 0).length
}

const toggleSubEtapa = (otId, etapaNum) => {
  const key = `${otId}-etapa-${etapaNum}`
  if (subEtapasExpandidas.value.has(key)) subEtapasExpandidas.value.delete(key)
  else subEtapasExpandidas.value.add(key)
}

const isSubEtapaExpanded = (otId, etapaNum) => {
  const key = `${otId}-etapa-${etapaNum}`
  // Si no se ha colapsado explícitamente, expandida por defecto para máxima visibilidad
  return !subEtapasExpandidas.value.has(key)
}

// --- CONSTRUCCIÓN DEL ÁRBOL COMPLETO DE LAS 4 DIMENSIONES CON DATOS REALES ---
const allTreeRoots = computed(() => {
  const roots = []
  const activeEmpId = Number(navStore.activeEmpresa || 0)

  // 1. DIMENSIÓN EMPRESA / HOLDING (Expediente Institucional Real Spec 45)
  const empresasFiltradas = activeEmpId > 0
    ? empresasList.value.filter(emp => Number(emp.id_empresa) === activeEmpId)
    : empresasList.value

  roots.push({
    id: 'dim-empresa',
    dimKey: 'empresa',
    label: '1. Dimensión Empresa & Holding',
    subtitle: 'Sociedades operativas del grupo San Pablo registradas en base de datos',
    icon: '🏛️',
    badge: `${empresasFiltradas.length} Empresas`,
    children: [
      {
        id: 'grupo-sociedades-holding',
        label: 'Sociedades Operativas del Holding San Pablo',
        icon: '🏛️',
        detail: '4 empresas con personería jurídica y RUT independiente',
        children: empresasFiltradas.map(emp => ({
          id: `emp-${emp.id_empresa}`,
          id_empresa: emp.id_empresa,
          label: `${emp.name} • RUT: ${emp.rut}`,
          icon: emp.logo || '🏢',
          get files() {
            return certsEmpresasCache.value.get(emp.id_empresa) || []
          }
        }))
      }
    ]
  })

  // 2. DIMENSIÓN FLOTA Y EQUIPOS (110 EQUIPOS REALES + 289 CERTIFICADOS REALES)
  const equiposFiltrados = activeEmpId > 0
    ? equiposList.value.filter(eq => Number(eq.id_empresa) === activeEmpId)
    : equiposList.value

  const gruposEquipos = {}
  equiposFiltrados.forEach(eq => {
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
    badge: `${equiposFiltrados.length} Equipos`,
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
  const personasFiltradas = activeEmpId > 0
    ? personasList.value.filter(p => !p.id_empresa || Number(p.id_empresa) === activeEmpId)
    : personasList.value

  const gruposPersonas = {}
  personasFiltradas.forEach(p => {
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
    badge: `${personasFiltradas.length} Colaboradores`,
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
  const proyectosFiltrados = activeEmpId > 0
    ? proyectosList.value.filter(pry => Number(pry.id_empresa) === activeEmpId)
    : proyectosList.value

  const gruposProyectos = {}
  proyectosFiltrados.forEach(pry => {
    const cliente = pry.nombre_cliente || pry.name_empresa_cliente || 'CLIENTE MANDANTE DIRECTO'
    if (!gruposProyectos[cliente]) gruposProyectos[cliente] = []
    gruposProyectos[cliente].push(pry)
  })

  roots.push({
    id: 'dim-procesos',
    dimKey: 'procesos',
    label: '4. Dimensión Clientes & Procesos Comerciales OTs',
    subtitle: `${proyectosFiltrados.length} OTs reales con sus cotizaciones, visitas técnicas, órdenes de trabajo y reportes de faena`,
    icon: '🏢',
    badge: `${proyectosFiltrados.length} OTs Registradas`,
    children: Object.keys(gruposProyectos).sort().map(cliente => ({
      id: `clt-${cliente}`,
      label: cliente,
      icon: '🏭',
      detail: `${gruposProyectos[cliente].length} servicios`,
      children: gruposProyectos[cliente].map(pry => {
        const cod = pry.codi_proyecto || `OT-${pry.id_proyecto}`
        const pIdNum = Number(pry.id_proyecto)
        const expData = expedientesProyectosCache.value.get(pIdNum) || {
          reports: reportsProyectosCache.value.get(pIdNum) || [],
          viajes: [],
          its: null,
          edps: []
        }

        const jf = typeof pry.json_field === 'string' ? (tryJsonParse(pry.json_field) || {}) : (pry.json_field || {})
        const crm = jf.crm_v1 || jf.crm || {}
        const cotis = crm.cotizaciones_historicas || []
        const cotizVig = crm.cotizacion_v1 || crm.cotizacion || null
        const ops = jf.ejecucion_v1 || jf.operaciones_v1 || {}
        const ots = ops.ot_versiones || []

        const filesProy = []

        // ==========================================
        // ETAPA 1: PREVENTA & COMERCIAL
        // ==========================================
        // Cotización Comercial Vigente
        if (cotizVig && (cotizVig.url_pdf || cotizVig.id_doc || cotizVig.id_doc_pdf)) {
          const idDoc = cotizVig.id_doc || cotizVig.id_doc_pdf || (cotizVig.url_pdf ? cotizVig.url_pdf.replace('/api/archivo/ver/', '').replace(/^\//, '') : null)
          filesProy.push({
            etapa_num: 1,
            etapa_nombre: '1. Preventa & Comercial',
            etapa_icon: '💼',
            id_doc: idDoc,
            url: cotizVig.url_pdf || (idDoc ? `/api/archivo/ver/${idDoc}` : null),
            name: cotizVig.nombre_archivo || `${cod}-Cotizacion-Vigente.pdf`,
            tipo: 'Cotización Comercial Vigente',
            emisor: 'GSP Área Comercial',
            fecha_emision: cotizVig.fecha_creacion ? cotizVig.fecha_creacion.split('T')[0] : (cotizVig.fecha || 'S/I'),
            fecha_vencimiento: 'Permanente',
            size: 'PDF Oficial'
          })
        }
        // Cotizaciones Comerciales Históricas
        cotis.forEach(c => {
          const idDoc = c.id_doc || (c.url ? c.url.replace('/api/archivo/ver/', '').replace(/^\//, '') : null)
          if (idDoc && (!cotizVig || idDoc !== cotizVig.id_doc)) {
            filesProy.push({
              etapa_num: 1,
              etapa_nombre: '1. Preventa & Comercial',
              etapa_icon: '💼',
              id_doc: idDoc,
              url: c.url,
              name: c.nombre_archivo || `${cod}-Cotizacion-v${c.version || 1}.pdf`,
              tipo: `Cotización Comercial (v${c.version || 1})`,
              emisor: 'GSP Área Comercial',
              fecha_emision: c.fecha_creacion ? c.fecha_creacion.split('T')[0] : (c.fecha || 'S/I'),
              fecha_vencimiento: 'Permanente',
              size: 'PDF Histórico'
            })
          }
        })
        // Visitas Técnicas a Terreno (Template 80)
        const visitasDelProy = visitasTerrenoList.value.filter(v => v.id_proyecto === pry.id_proyecto && v.id_doc)
        visitasDelProy.forEach(v => {
          filesProy.push({
            etapa_num: 1,
            etapa_nombre: '1. Preventa & Comercial',
            etapa_icon: '💼',
            id_doc: v.id_doc,
            url: `/api/archivo/ver/${v.id_doc}`,
            name: `Informe-Visita-Terreno-${v.id_survey}.pdf`,
            tipo: `Visita Técnica a Terreno (#${v.id_survey})`,
            emisor: 'GSP Inspector Terreno',
            fecha_emision: v.fecha_plan_ini ? v.fecha_plan_ini.split('T')[0] : 'S/I',
            fecha_vencimiento: 'Permanente',
            size: 'PDF Oficial'
          })
        })

        // ==========================================
        // ETAPA 2: CONTRATACIÓN & FORMALIZACIÓN
        // ==========================================
        // Contrato de Arrendamiento de Maquinaria
        const ctrCandidatos = [jf.contrato_arriendo, crm.contrato_arriendo, crm.contrato].filter(Boolean)
        const ctrFirmado = ctrCandidatos.find(c => c.estado === 'FIRMADO_DIGITAL' || c.estado === 'FIRMADO_FISICO')
        const ctrMejor = ctrFirmado || ctrCandidatos.find(c => c.url_pdf_firmado || c.url_pdf || c.id_doc) || null
        if (ctrMejor && (ctrMejor.url_pdf_firmado || ctrMejor.url_pdf || ctrMejor.id_doc)) {
          const esFirmado = ctrMejor.estado === 'FIRMADO_DIGITAL' || ctrMejor.estado === 'FIRMADO_FISICO' || Boolean(ctrMejor.url_pdf_firmado)
          const pdfUrl = ctrMejor.url_pdf_firmado || ctrMejor.url_pdf || ''
          const idDocCtr = ctrMejor.id_doc || (pdfUrl.includes('/archivo/ver/') ? pdfUrl.split('/archivo/ver/')[1] : null)
          const firmanteNom = ctrMejor.firma_digital?.nombre || ctrMejor.firma_digital?.firmado_por_nombre || ctrMejor.representante_nombre || 'Cliente Mandante'
          const fechaFirma = String(ctrMejor.firma_digital?.timestamp || ctrMejor.firma_digital?.fecha_hora_firma || ctrMejor.fecha_firma || ctrMejor.fecha_inicio || '').split('T')[0] || 'S/I'
          filesProy.push({
            etapa_num: 6,
            etapa_nombre: '6. Arriendo de Plataformas & Contratos Especiales',
            etapa_icon: '🪜',
            id_doc: idDocCtr,
            url: pdfUrl,
            directUrl: !idDocCtr ? pdfUrl : null,
            name: `${ctrMejor.folio || cod + '-Contrato'}-${esFirmado ? 'Firmado-FES' : 'Borrador'}.pdf`,
            tipo: esFirmado ? `Contrato de Arrendamiento (Firmado FES ✅)` : `Contrato de Arrendamiento (${ctrMejor.estado || 'Emitido'})`,
            emisor: esFirmado ? `Firmado por: ${firmanteNom}` : 'GSP / Royal Rental',
            fecha_emision: fechaFirma,
            fecha_vencimiento: ctrMejor.fecha_termino || 'Permanente',
            size: esFirmado ? 'Firmado FES' : 'PDF Oficial'
          })
        }
        // Versiones Históricas de Contratos
        const ctrHistoricos = crm.contratos_historicos || jf.contratos_historicos || []
        if (Array.isArray(ctrHistoricos)) {
          ctrHistoricos.forEach((h, hIdx) => {
            const hPdf = h.url_pdf_firmado || h.url_pdf || h.url
            if (hPdf && hPdf !== (ctrMejor?.url_pdf_firmado || ctrMejor?.url_pdf)) {
              const hIdDoc = h.id_doc || (hPdf.includes('/archivo/ver/') ? hPdf.split('/archivo/ver/')[1] : null)
              filesProy.push({
                etapa_num: 6,
                etapa_nombre: '6. Arriendo de Plataformas & Contratos Especiales',
                etapa_icon: '🪜',
                id_doc: hIdDoc,
                url: hPdf,
                directUrl: !hIdDoc ? hPdf : null,
                name: `${h.folio || cod + '-Contrato'}-v${h.version || (hIdx + 1)}.pdf`,
                tipo: `Contrato de Arrendamiento (Versión v${h.version || (hIdx + 1)})`,
                emisor: h.firmante || 'GSP / Royal Rental',
                fecha_emision: h.fecha ? String(h.fecha).split('T')[0] : 'S/I',
                fecha_vencimiento: h.fecha_termino || 'Permanente',
                size: h.estado === 'FIRMADO_DIGITAL' ? 'Firmado FES' : 'PDF Histórico'
              })
            }
          })
        }
        // Órdenes de Trabajo (OT)
        ots.forEach(o => {
          const idDoc = o.id_doc || (o.url ? o.url.replace('/api/archivo/ver/', '').replace(/^\//, '') : null)
          if (idDoc) {
            filesProy.push({
              etapa_num: 2,
              etapa_nombre: '2. Asignación de Recursos & Orden de Trabajo (OT)',
              etapa_icon: '📋',
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

        // ==========================================
        // ETAPA 3: LOGÍSTICA, DESPACHO Y ACREDITACIONES
        // ==========================================
        if (Array.isArray(expData.viajes)) {
          expData.viajes.forEach(v => {
            // Hoja de Despacho / Salida de Base
            if (v.fecha_salida_patio || v.estado_trayecto !== 'ASIGNADO') {
              filesProy.push({
                etapa_num: 3,
                etapa_nombre: '3. Logística, Despacho y Acreditaciones',
                etapa_icon: '🚛',
                id_doc: null,
                url: `/api/operaciones/viaje/${v.token_viaje}/resumen`,
                name: `Hoja-Despacho-Salida-${v.patente || cod}.pdf`,
                tipo: `Hoja de Despacho & Salida Base (${v.tipo_trayecto || 'IDA'})`,
                emisor: `Conductor: ${v.chofer_nombre || 'GSP'}`,
                fecha_emision: v.fecha_salida_patio ? String(v.fecha_salida_patio).split('T')[0] : 'S/I',
                fecha_vencimiento: 'Permanente',
                size: `Odóm: ${v.km_inicial || 'S/I'} km`,
                token_viaje: v.token_viaje
              })
            }
            // Vouchers Copec en Ruta
            if (Number(v.total_litros || 0) > 0 || Number(v.total_gasto || 0) > 0) {
              filesProy.push({
                etapa_num: 3,
                etapa_nombre: '3. Logística, Despacho y Acreditaciones',
                etapa_icon: '🚛',
                id_doc: null,
                name: `Voucher-Copec-${v.patente || cod}.pdf`,
                tipo: `Comprobante Carga Copec (${v.total_litros} L)`,
                emisor: `Conductor: ${v.chofer_nombre || 'GSP'}`,
                fecha_emision: v.fecha_salida_patio ? String(v.fecha_salida_patio).split('T')[0] : 'S/I',
                fecha_vencimiento: 'Permanente',
                size: `$${Number(v.total_gasto || 0).toLocaleString('es-CL')}`
              })
            }
            // Evidencias Fotográficas de Checkpoints Odómetro y Tablero
            if (v.foto_odometro_salida_path) {
              filesProy.push({
                etapa_num: 3,
                etapa_nombre: '3. Logística, Despacho y Acreditaciones',
                etapa_icon: '🚛',
                id_doc: null,
                url: v.foto_odometro_salida_path,
                directUrl: v.foto_odometro_salida_path,
                name: `Foto-Odometro-Salida-${v.patente || cod}.jpg`,
                tipo: `Evidencia Checkpoint: Odómetro Salida Base (${v.km_inicial || 'S/I'} km)`,
                emisor: `Conductor: ${v.chofer_nombre || 'GSP'}`,
                fecha_emision: v.fecha_salida_patio ? String(v.fecha_salida_patio).split('T')[0] : 'S/I',
                fecha_vencimiento: 'Permanente',
                size: 'Foto Terreno'
              })
            }
            if (v.foto_tablero_salida_path) {
              filesProy.push({
                etapa_num: 3,
                etapa_nombre: '3. Logística, Despacho y Acreditaciones',
                etapa_icon: '🚛',
                id_doc: null,
                url: v.foto_tablero_salida_path,
                directUrl: v.foto_tablero_salida_path,
                name: `Foto-Tablero-Salida-${v.patente || cod}.jpg`,
                tipo: 'Evidencia Checkpoint: Tablero Control Salida',
                emisor: `Conductor: ${v.chofer_nombre || 'GSP'}`,
                fecha_emision: v.fecha_salida_patio ? String(v.fecha_salida_patio).split('T')[0] : 'S/I',
                fecha_vencimiento: 'Permanente',
                size: 'Foto Terreno'
              })
            }
            if (v.foto_odometro_llegada_path) {
              filesProy.push({
                etapa_num: 3,
                etapa_nombre: '3. Logística, Despacho y Acreditaciones',
                etapa_icon: '🚛',
                id_doc: null,
                url: v.foto_odometro_llegada_path,
                directUrl: v.foto_odometro_llegada_path,
                name: `Foto-Odometro-Llegada-${v.patente || cod}.jpg`,
                tipo: `Evidencia Checkpoint: Odómetro Llegada (${v.km_final || 'S/I'} km)`,
                emisor: `Conductor: ${v.chofer_nombre || 'GSP'}`,
                fecha_emision: v.fecha_llegada_patio ? String(v.fecha_llegada_patio).split('T')[0] : 'S/I',
                fecha_vencimiento: 'Permanente',
                size: 'Foto Terreno'
              })
            }
            if (v.foto_tablero_llegada_path) {
              filesProy.push({
                etapa_num: 3,
                etapa_nombre: '3. Logística, Despacho y Acreditaciones',
                etapa_icon: '🚛',
                id_doc: null,
                url: v.foto_tablero_llegada_path,
                directUrl: v.foto_tablero_llegada_path,
                name: `Foto-Tablero-Llegada-${v.patente || cod}.jpg`,
                tipo: 'Evidencia Checkpoint: Tablero Control Llegada',
                emisor: `Conductor: ${v.chofer_nombre || 'GSP'}`,
                fecha_emision: v.fecha_llegada_patio ? String(v.fecha_llegada_patio).split('T')[0] : 'S/I',
                fecha_vencimiento: 'Permanente',
                size: 'Foto Terreno'
              })
            }
            // Hoja de Retorno / Llegada a Patio
            if (v.fecha_llegada_patio || v.estado_trayecto === 'CONCLUIDO') {
              filesProy.push({
                etapa_num: 3,
                etapa_nombre: '3. Logística, Despacho y Acreditaciones',
                etapa_icon: '🚛',
                id_doc: null,
                name: `Hoja-Retorno-Patio-${v.patente || cod}.pdf`,
                tipo: 'Hoja de Retorno & Cierre Patio',
                emisor: `Conductor: ${v.chofer_nombre || 'GSP'}`,
                fecha_emision: v.fecha_llegada_patio ? String(v.fecha_llegada_patio).split('T')[0] : 'S/I',
                fecha_vencimiento: 'Permanente',
                size: `Odóm: ${v.km_final || 'S/I'} km`
              })
            }
          })
        }

        // Acreditaciones Técnicas y Legales de la Flota Asignada a la OT
        const eqIdsAsignados = new Set()
        if (ops.equipo_id) eqIdsAsignados.add(Number(ops.equipo_id))
        if (crm.id_equipo) eqIdsAsignados.add(Number(crm.id_equipo))
        if (crm.equipo_asignado_id) eqIdsAsignados.add(Number(crm.equipo_asignado_id))
        if (Array.isArray(ops.equipos_extra)) ops.equipos_extra.forEach(id => eqIdsAsignados.add(Number(id)))
        if (Array.isArray(crm.lineas_servicio)) {
          crm.lineas_servicio.forEach(l => {
            if (l.id_equipo) eqIdsAsignados.add(Number(l.id_equipo))
            if (l.equipo_asignado_id) eqIdsAsignados.add(Number(l.equipo_asignado_id))
          })
        }

        eqIdsAsignados.forEach(eqId => {
          const docsEq = certsEquiposCache.value.get(eqId) || []
          const eqObj = equiposList.value.find(e => Number(e.id_equipo) === eqId)
          const eqLabel = eqObj ? (eqObj.patente || eqObj.codigo || `Equipo #${eqId}`) : `Equipo #${eqId}`
          docsEq.forEach(c => {
            if (c.id_certificado || (!c.tipo?.includes('Acta') && !c.tipo?.includes('Contrato'))) {
              filesProy.push({
                etapa_num: 3,
                etapa_nombre: '3. Logística, Despacho y Acreditaciones',
                etapa_icon: '🚛',
                id_doc: c.id_doc,
                url: c.url || (c.id_doc ? `/api/archivo/ver/${c.id_doc}` : null),
                name: `[${eqLabel}] ${c.name}`,
                tipo: `Acreditación Flota: ${c.tipo}`,
                emisor: c.emisor || eqLabel,
                fecha_emision: c.fecha_emision || 'S/I',
                fecha_vencimiento: c.fecha_vencimiento || 'Permanente',
                size: c.size || 'Certificado Técnico'
              })
            }
          })
        })

        // Acreditaciones Laborales y HSEC de la Tripulación Asignada a la OT
        const tripUserIds = new Set()
        if (ops.operador_id) tripUserIds.add(Number(ops.operador_id))
        if (ops.rigger_id) tripUserIds.add(Number(ops.rigger_id))
        if (Array.isArray(ops.tripulacion_asignada)) {
          ops.tripulacion_asignada.forEach(t => {
            if (t.id_user) tripUserIds.add(Number(t.id_user))
            if (t.user_id) tripUserIds.add(Number(t.user_id))
          })
        }

        tripUserIds.forEach(uId => {
          const docsPers = certsPersonasCache.value.get(uId) || []
          const persObj = personasList.value.find(p => Number(p.id_user) === uId)
          const persLabel = persObj ? (persObj.nombre_completo || persObj.name_user || `Personal #${uId}`) : `Personal #${uId}`
          docsPers.forEach(c => {
            filesProy.push({
              etapa_num: 3,
              etapa_nombre: '3. Logística, Despacho y Acreditaciones',
              etapa_icon: '🚛',
              id_doc: c.id_doc,
              url: c.url || (c.id_doc ? `/api/archivo/ver/${c.id_doc}` : null),
              name: `[${persLabel}] ${c.name}`,
              tipo: `Acreditación Personal: ${c.tipo}`,
              emisor: c.emisor || persLabel,
              fecha_emision: c.fecha_emision || 'S/I',
              fecha_vencimiento: c.fecha_vencimiento || 'Permanente',
              size: c.size || 'Certificado Personal'
            })
          })
        })

        // ==========================================
        // ETAPA 4: OPERACIONES PLATAFORMAS BSM
        // ==========================================
        const acta360 = ops.acta_plataforma_360 || jf.acta_plataforma_360 || null
        if (acta360) {
          const pdfEnt = acta360.url_pdf || (acta360.id_doc_pdf ? `/api/archivo/ver/${acta360.id_doc_pdf}` : null)
          if (pdfEnt || acta360.id_doc_pdf) {
            const idDocEnt = acta360.id_doc_pdf || (pdfEnt?.includes('/archivo/ver/') ? pdfEnt.split('/archivo/ver/')[1] : null)
            filesProy.push({
              etapa_num: 6,
              etapa_nombre: '6. Arriendo de Plataformas & Contratos Especiales',
              etapa_icon: '🪜',
              id_doc: idDocEnt,
              url: pdfEnt,
              directUrl: !idDocEnt ? pdfEnt : null,
              name: `${acta360.folio || cod}-Acta-Entrega-360.pdf`,
              tipo: 'Acta Entrega Plataforma 360° (Terreno)',
              emisor: 'Chofer / Operador Terreno',
              fecha_emision: acta360.fecha_entrega ? String(acta360.fecha_entrega).split('T')[0] : 'S/I',
              fecha_vencimiento: 'Permanente',
              size: 'PDF Oficial'
            })
          }
          const pdfRet = acta360.url_pdf_final || (acta360.id_doc_pdf_final ? `/api/archivo/ver/${acta360.id_doc_pdf_final}` : null)
          if (pdfRet || acta360.id_doc_pdf_final) {
            const idDocRet = acta360.id_doc_pdf_final || (pdfRet?.includes('/archivo/ver/') ? pdfRet.split('/archivo/ver/')[1] : null)
            filesProy.push({
              etapa_num: 6,
              etapa_nombre: '6. Arriendo de Plataformas & Contratos Especiales',
              etapa_icon: '🪜',
              id_doc: idDocRet,
              url: pdfRet,
              directUrl: !idDocRet ? pdfRet : null,
              name: `${acta360.folio || cod}-Acta-Retiro-Final-360.pdf`,
              tipo: 'Acta Retiro y Devolución Plataforma 360°',
              emisor: 'Chofer / Operador Terreno',
              fecha_emision: acta360.fecha_retiro ? String(acta360.fecha_retiro).split('T')[0] : 'S/I',
              fecha_vencimiento: 'Permanente',
              size: 'PDF Oficial'
            })
          }
        }
        // Actas 360° Relacionales
        const actasRel = actasProyectosMap.value.get(Number(pry.id_proyecto)) || []
        actasRel.forEach(a => {
          if (a.id_file_pdf_entrega && !filesProy.some(f => f.id_doc == a.id_file_pdf_entrega)) {
            filesProy.push({
              etapa_num: 6,
              etapa_nombre: '6. Arriendo de Plataformas & Contratos Especiales',
              etapa_icon: '🪜',
              id_doc: a.id_file_pdf_entrega,
              url: `/api/archivo/ver/${a.id_file_pdf_entrega}`,
              name: `${a.folio_acta}_ENTREGA.pdf`,
              tipo: 'Acta Entrega Plataforma 360° (Terreno)',
              emisor: `Chofer: ${a.chofer_entrega_nombre || 'GSP'}`,
              fecha_emision: a.fecha_entrega ? String(a.fecha_entrega).split('T')[0] : 'S/I',
              fecha_vencimiento: 'Permanente',
              size: 'PDF Oficial'
            })
          }
          if (a.id_file_pdf_final && !filesProy.some(f => f.id_doc == a.id_file_pdf_final)) {
            filesProy.push({
              etapa_num: 6,
              etapa_nombre: '6. Arriendo de Plataformas & Contratos Especiales',
              etapa_icon: '🪜',
              id_doc: a.id_file_pdf_final,
              url: `/api/archivo/ver/${a.id_file_pdf_final}`,
              name: `${a.folio_acta}_FINAL.pdf`,
              tipo: 'Acta Retiro & Cierre Plataforma 360°',
              emisor: `Chofer: ${a.chofer_retiro_nombre || 'GSP'}`,
              fecha_emision: a.fecha_retiro ? String(a.fecha_retiro).split('T')[0] : 'S/I',
              fecha_vencimiento: 'Permanente',
              size: 'PDF Oficial'
            })
          }
        })

        // ==========================================
        // ETAPA 5: OPERACIÓN EN FAENA (IZAJES)
        // ==========================================
        const planIzaje = jf.plan_izaje_v1 || ops.plan_izaje_v1 || null
        if (planIzaje && (planIzaje.id_file_pdf || planIzaje.url_pdf)) {
          const idDocPlan = planIzaje.id_file_pdf || null
          filesProy.push({
            etapa_num: 4,
            etapa_nombre: '4. Operación en Faena (Izaje)',
            etapa_icon: '⏱️',
            id_doc: idDocPlan,
            url: planIzaje.url_pdf || (idDocPlan ? `/api/archivo/ver/${idDocPlan}` : null),
            name: `${planIzaje.folio_plan || cod + '-Plan-Izaje'}.pdf`,
            tipo: `Plan de Izaje & Memoria de Cálculo (${planIzaje.porcentaje_utilizacion || 0}% Utilización)`,
            emisor: 'Operador / Rigger / Supervisor (FES)',
            fecha_emision: planIzaje.fecha_firma ? String(planIzaje.fecha_firma).split(',')[0] : 'S/I',
            fecha_vencimiento: 'Permanente',
            size: 'PDF Oficial + Croquis SVG'
          })
        }
        const reportsDelProy = expData.reports || []
        reportsDelProy.forEach(r => {
          filesProy.push({
            etapa_num: 4,
            etapa_nombre: '4. Operación en Faena (Izaje)',
            etapa_icon: '⏱️',
            id_doc: r.id_doc_pdf || r.id_doc || null,
            url: (r.id_doc_pdf || r.id_doc) ? `/api/v1/storage/view/${r.id_doc_pdf || r.id_doc}` : null,
            rawReport: r,
            name: `Report Diario Izaje - Día ${r.dia_correlativo || 1} (#${r.id_reporte_avance}) - ${r.equipo_patente || 'Equipo'}.pdf`,
            tipo: `Report Diario Izaje (#${r.id_reporte_avance})`,
            emisor: `Operador: ${r.operador_nombre || 'GSP'}`,
            fecha_emision: r.fecha_reporte ? r.fecha_reporte.split('T')[0] : 'S/I',
            fecha_vencimiento: 'Permanente',
            size: r.id_doc_pdf ? 'PDF Escaneado OK' : (r.estado_reporte === 'VALIDADO_ANALISTA' ? 'Validado FES' : 'Digital Terreno')
          })
        })

        // Respaldos Físicos de Reportes Escaneados y Documentos Operacionales de Faena
        const dossierDocs = ops.dossier_documentos || jf.dossier_documentos || []
        if (Array.isArray(dossierDocs)) {
          dossierDocs.forEach((d, idx) => {
            const idDocFisico = d.id_doc || d.id_archivo || null
            filesProy.push({
              etapa_num: 4,
              etapa_nombre: '4. Operación en Faena (Izaje)',
              etapa_icon: '⏱️',
              id_doc: idDocFisico,
              url: idDocFisico ? `/api/archivo/ver/${idDocFisico}` : (d.url || null),
              name: d.archivo_nombre || d.titulo || `Respaldo-Fisico-${cod}-${idx + 1}.pdf`,
              tipo: d.titulo || (d.tipo_documento === 'REPORT_FISICO_RESPALDO' ? 'Respaldo Físico Reporte Escaneado' : 'Documento Faena Terreno'),
              emisor: d.subido_por_nombre || 'Supervisor Faena GSP',
              fecha_emision: d.fecha_subida ? String(d.fecha_subida).split('T')[0] : 'S/I',
              fecha_vencimiento: 'Permanente',
              size: 'PDF Escaneado'
            })
          })
        }

        // ==========================================
        // ETAPA 5: CIERRE TÉCNICO, LIQUIDACIÓN & FACTURACIÓN
        // ==========================================
        if (expData.its && expData.its.its) {
          const itsObj = expData.its.its
          filesProy.push({
            etapa_num: 5,
            etapa_nombre: '5. Cierre Técnico, Liquidación & Facturación',
            etapa_icon: '💰',
            id_doc: itsObj.id_doc_pdf || null,
            url: itsObj.id_doc_pdf ? `/api/archivo/ver/${itsObj.id_doc_pdf}` : `/api/operaciones/its/preview-pdf/${pIdNum}`,
            name: `ITS-${cod}-Informe-Termino.pdf`,
            tipo: `Inspección Técnica de Salida (${itsObj.estado || 'Emitido'})`,
            emisor: itsObj.usuario_validador_nombre || 'Inspector Técnico GSP',
            fecha_emision: itsObj.fecha_emision ? String(itsObj.fecha_emision).split('T')[0] : 'S/I',
            fecha_vencimiento: 'Permanente',
            size: 'ITS Oficial'
          })
        }

        // ==========================================
        // (continúa ETAPA 5): EDP Y FACTURACIÓN
        // ==========================================
        if (Array.isArray(expData.edps)) {
          expData.edps.forEach(e => {
            // Carátula de EDP
            filesProy.push({
              etapa_num: 5,
              etapa_nombre: '5. Cierre Técnico, Liquidación & Facturación',
              etapa_icon: '💰',
              id_doc: e.id_doc_pdf || null,
              url: `/api/operaciones/edp/${e.id_edp}/pdf`,
              name: `EDP-${e.numero_edp || e.id_edp}-${cod}.pdf`,
              tipo: `Carátula Estado de Pago (EDP #${e.numero_edp || e.id_edp})`,
              emisor: 'PMO / Finanzas GSP',
              fecha_emision: e.fecha_corte_fin ? String(e.fecha_corte_fin).split('T')[0] : (e.fecha_creacion ? String(e.fecha_creacion).split('T')[0] : 'S/I'),
              fecha_vencimiento: 'Permanente',
              size: `$${Number(e.monto_total || 0).toLocaleString('es-CL')}`
            })
            // Factura ERP si está adjunta
            if (e.archivo_factura_pdf_path) {
              filesProy.push({
                etapa_num: 5,
                etapa_nombre: '5. Cierre Técnico, Liquidación & Facturación',
                etapa_icon: '💰',
                id_doc: null,
                url: e.archivo_factura_pdf_path,
                directUrl: e.archivo_factura_pdf_path,
                name: `Factura-${e.folio_factura_erp || 'DTE'}-${cod}.pdf`,
                tipo: `Factura Electrónica DTE (Folio ${e.folio_factura_erp || 'S/F'})`,
                emisor: 'Contabilidad GSP',
                fecha_emision: e.fecha_facturacion_erp || 'S/I',
                fecha_vencimiento: 'Permanente',
                size: 'DTE Adjunto'
              })
            }
          })
        }

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
    } else if (strId === 'grupo-sociedades-holding' || strId === 'dim-empresa') {
      empresasList.value.forEach(emp => cargarDocumentosEmpresaDirecto(emp.id_empresa))
    } else if (strId.startsWith('cat-')) {
      const catName = strId.replace('cat-', '')
      const eqsEnCat = equiposList.value.filter(e => (e.nombre_categoria || e.tipo_equipo || 'OTROS EQUIPOS') === catName)
      eqsEnCat.forEach(e => cargarCertificadosEquipoDirecto(e.id_equipo))
    } else if (strId.startsWith('cargo-')) {
      const cargoName = strId.replace('cargo-', '')
      const persEnCargo = personasList.value.filter(p => (p.cargo || p.json_data?.cargo || 'PERSONAL OPERATIVO').toUpperCase().trim() === cargoName)
      persEnCargo.forEach(p => cargarCertificadosPersonaDirecto(p.id_user))
    } else if (strId.startsWith('clt-')) {
      const clienteName = strId.replace('clt-', '')
      const proysDelCliente = proyectosList.value.filter(pry => (pry.nombre_cliente || pry.name_empresa_cliente || 'CLIENTE MANDANTE DIRECTO') === clienteName)
      proysDelCliente.forEach(p => {
        const pId = Number(p.id_proyecto)
        cargarReportsProyectoDirecto(pId)
        if (proysDelCliente.length === 1) {
          expandedNodes.value.add(`pry-${pId}`)
        }
      })
    } else if (strId.startsWith('pry-')) {
      const pId = Number(strId.replace('pry-', ''))
      cargarReportsProyectoDirecto(pId)
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
    if (dimId === 'empresa') {
      expandedNodes.value.add('grupo-sociedades-holding')
      empresasList.value.forEach(emp => cargarDocumentosEmpresaDirecto(emp.id_empresa))
    }
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
  // Si es Report Diario sin id_doc físico aún, dirigir al endpoint de auto-reparación y streaming
  if (file.rawReport && !file.id_doc && !file.url) {
    const isProd = typeof window !== 'undefined' && window.location.pathname.startsWith('/lg-gsp-prod')
    const base = (apiAxios.defaults.baseURL || (isProd ? 'https://servidor.leanglobal.cl/lg-gsp-prod/api' : 'https://servidor.leanglobal.cl/lg-gsp-dev/api')).replace(/\/$/, '')
    const urlPdfDinamico = `${base}/operaciones/report/${file.rawReport.id_reporte_avance}/pdf`
    window.open(urlPdfDinamico, '_blank', 'noopener,noreferrer')
    return
  }

  if (!file.id_doc && !file.url && !file.directUrl) {
    alert('Este requisito no cuenta con un archivo físico cargado en el servidor.')
    return
  }

  const isProd = typeof window !== 'undefined' && window.location.pathname.startsWith('/lg-gsp-prod')
  const base = (apiAxios.defaults.baseURL || (isProd ? 'https://servidor.leanglobal.cl/lg-gsp-prod/api' : 'https://servidor.leanglobal.cl/lg-gsp-dev/api')).replace(/\/$/, '')

  if (file.directUrl || (file.url && !file.id_doc && (file.url.startsWith('http') || file.url.startsWith('/uploads/') || file.url.startsWith('/api/')))) {
    const rawUrl = file.directUrl || file.url
    const rootBase = base.replace(/\/api$/, '')
    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${rootBase}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`
    window.open(fullUrl, '_blank', 'noopener,noreferrer')
    return
  }

  const idDoc = file.id_doc || (file.url ? file.url.replace('/api/archivo/ver/', '').replace(/^\//, '') : '')
  const url = `${base}/archivo/ver/${idDoc}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

const abrirModalAuditoriaReport = (rawReport) => {
  reportSeleccionadoParaVisor.value = rawReport
  modalVisorReportAbierto.value = true
}

// --- FUNCIONES PARA GESTIÓN DE DOCUMENTOS DE EMPRESA (OPCIÓN A) ---
const abrirModalSubirDocEmpresa = (idEmpresa = null) => {
  nuevoDocEmpresa.value.id_empresa = idEmpresa || (empresasList.value[0]?.id_empresa ?? 9)
  nuevoDocEmpresa.value.tipo_doc_id = 'F30-1'
  nuevoDocEmpresa.value.tipo_codigo = 'F30-1'
  nuevoDocEmpresa.value.tipo_nombre = 'Certificado F30-1 (Obligaciones Laborales y Previsionales)'
  nuevoDocEmpresa.value.nombre_glosa = ''
  nuevoDocEmpresa.value.es_permanente = false
  
  // Sugerir vencimiento automático al día 15 del mes subsiguiente
  const fechaSugerida = new Date()
  fechaSugerida.setMonth(fechaSugerida.getMonth() + 1)
  fechaSugerida.setDate(15)
  nuevoDocEmpresa.value.fecha_vencimiento = fechaSugerida.toISOString().split('T')[0]
  
  archivoDocEmpresa.value = null
  modalSubirDocEmpresaAbierto.value = true
}

const cerrarModalSubirDocEmpresa = () => {
  modalSubirDocEmpresaAbierto.value = false
  archivoDocEmpresa.value = null
}

const onTipoDocEmpresaChange = () => {
  const sel = catalogoTiposDocEmpresa.find(t => t.id === nuevoDocEmpresa.value.tipo_doc_id)
  if (!sel) return
  nuevoDocEmpresa.value.tipo_codigo = sel.codigo
  nuevoDocEmpresa.value.tipo_nombre = sel.nombre
  nuevoDocEmpresa.value.es_permanente = sel.permanente
  
  if (sel.permanente) {
    nuevoDocEmpresa.value.fecha_vencimiento = ''
  } else if (sel.diasSugeridosVenc) {
    const f = new Date()
    f.setDate(f.getDate() + sel.diasSugeridosVenc)
    nuevoDocEmpresa.value.fecha_vencimiento = f.toISOString().split('T')[0]
  }
}

const onFileChangeDocEmpresa = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    alert('Solo se admiten documentos en formato PDF.')
    event.target.value = ''
    return
  }
  archivoDocEmpresa.value = file
  if (!nuevoDocEmpresa.value.nombre_glosa) {
    nuevoDocEmpresa.value.nombre_glosa = file.name.replace(/\.pdf$/i, '')
  }
}

const subirDocumentoEmpresaModal = async () => {
  if (!nuevoDocEmpresa.value.id_empresa) {
    alert('Por favor selecciona la empresa destinataria.')
    return
  }
  if (!archivoDocEmpresa.value) {
    alert('Por favor selecciona el archivo PDF a subir.')
    return
  }
  if (!nuevoDocEmpresa.value.es_permanente && !nuevoDocEmpresa.value.fecha_vencimiento) {
    alert('Por favor ingresa la fecha de vencimiento o marca la casilla de vigencia permanente.')
    return
  }

  subiendoDocEmpresa.value = true
  try {
    const idEmpresa = nuevoDocEmpresa.value.id_empresa
    const tagVenc = nuevoDocEmpresa.value.es_permanente ? '' : ` [VENC: ${nuevoDocEmpresa.value.fecha_vencimiento}]`
    const glosa = nuevoDocEmpresa.value.nombre_glosa || nuevoDocEmpresa.value.tipo_nombre
    const finalFileName = `[${nuevoDocEmpresa.value.tipo_codigo}] ${glosa}${tagVenc}.pdf`

    // 1. Subir archivo a almacenamiento físico
    const formData = new FormData()
    formData.append('archivo', archivoDocEmpresa.value, finalFileName)
    formData.append('tipo_doc', 'DOC_EMPRESA')
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'empresa')
    formData.append('id_proceso', idEmpresa)

    let idDoc = null
    try {
      const res = await apiAxios.post('/v1/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      idDoc = res.data?.data?.id_doc || res.data?.id_doc
    } catch (eStorage) {
      console.warn('Fallback a /archivo/upload:', eStorage)
      const resFallback = await apiAxios.post('/archivo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      idDoc = resFallback.data?.id_doc || resFallback.data?.id
    }

    if (!idDoc) {
      throw new Error('No se pudo obtener el identificador único (id_doc) del archivo.')
    }

    // 2. Asociar el documento institucional en la base de datos
    const userRaw = localStorage.getItem('user')
    let idUser = null
    try { idUser = JSON.parse(userRaw)?.id_user } catch (e) {}

    await apiAxios.post(`/acreditacion/empresa/${idEmpresa}/documentos`, {
      id_doc: idDoc,
      id_user: idUser
    })

    // 3. Forzar refresco reactivo de los documentos de la empresa
    certsEmpresasCache.value.delete(Number(idEmpresa))
    certsEmpresasCache.value.delete(String(idEmpresa))
    await cargarDocumentosEmpresaDirecto(idEmpresa, true)

    // Expandir nodos para visualizarlo
    expandedNodes.value.add('dim-empresa')
    expandedNodes.value.add('grupo-sociedades-holding')
    expandedNodes.value.add(`emp-${idEmpresa}`)

    cerrarModalSubirDocEmpresa()
    alert('Documento institucional vinculado y acreditado correctamente.')
  } catch (err) {
    console.error('Error al subir documento de empresa:', err)
    alert(`Error al registrar el documento: ${err.response?.data?.message || err.message}`)
  } finally {
    subiendoDocEmpresa.value = false
  }
}

const darDeBajaDocumentoEmpresa = async (file, idEmpresa) => {
  if (!confirm(`¿Está seguro de dar de baja el documento "${file.name}" de esta empresa?`)) return
  try {
    await apiAxios.delete(`/acreditacion/empresa/${idEmpresa}/documentos/${file.id_doc}`)
    certsEmpresasCache.value.delete(Number(idEmpresa))
    certsEmpresasCache.value.delete(String(idEmpresa))
    await cargarDocumentosEmpresaDirecto(idEmpresa, true)
    alert('Documento dado de baja correctamente.')
  } catch (err) {
    console.error('Error al eliminar documento:', err)
    alert(`Error al dar de baja el documento: ${err.response?.data?.message || err.message}`)
  }
}

onMounted(fetchDatosDimensiones)
</script>
