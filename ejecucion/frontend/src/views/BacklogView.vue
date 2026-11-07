<template>
  <div class="space-y-6 w-full max-w-full px-2 sm:px-4 md:px-6 py-2 relative text-left">
    
    <!-- HEADER CON SELECTOR DE TABS -->
    <div class="glass-card p-6 rounded-3xl border border-white/10 bg-[#101114] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <ListTodo class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-xl font-black text-amber-500 uppercase tracking-widest font-display">Backlog & Marcha Blanca</h2>
            <p class="text-xs text-muted-foreground mt-0.5">Gestión de mejoras continuas, requerimientos y bitácora técnica de entregas.</p>
          </div>
        </div>
      </div>

      <!-- Tab Buttons -->
      <div class="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 self-start md:self-auto">
        <button 
          @click="activeTab = 'backlog'"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          :class="activeTab === 'backlog' ? 'bg-amber-500 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <ListTodo class="w-4 h-4" />
          Requerimientos ({{ requerimientos.length }})
        </button>
        <button 
          @click="activeTab = 'releases'"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          :class="activeTab === 'releases' ? 'bg-amber-500 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'"
        >
          <Rocket class="w-4 h-4" />
          Release Log ({{ releases.length }})
        </button>
      </div>
    </div>

    <!-- TARJETAS KPI -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
      <div class="glass-card p-4 rounded-2xl border border-white/10 bg-[#101114] flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase tracking-widest font-black text-slate-500">Total Requerimientos</span>
          <p class="text-2xl font-black text-white mt-1">{{ kpiStats.total }}</p>
        </div>
        <div class="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
          <ListTodo class="w-5 h-5" />
        </div>
      </div>
      <div class="glass-card p-4 rounded-2xl border border-amber-500/20 bg-[#101114] flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase tracking-widest font-black text-amber-500">En Ejecución</span>
          <p class="text-2xl font-black text-amber-400 mt-1">{{ kpiStats.enEjecucion }}</p>
        </div>
        <div class="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
          <PlayCircle class="w-5 h-5 animate-pulse" />
        </div>
      </div>
      <div class="glass-card p-4 rounded-2xl border border-emerald-500/20 bg-[#101114] flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase tracking-widest font-black text-emerald-500">Implementados</span>
          <p class="text-2xl font-black text-emerald-400 mt-1">{{ kpiStats.implementados }}</p>
        </div>
        <div class="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <CheckCircle2 class="w-5 h-5" />
        </div>
      </div>
      <div class="glass-card p-4 rounded-2xl border border-white/10 bg-[#101114] flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase tracking-widest font-black text-slate-400">Pendientes</span>
          <p class="text-2xl font-black text-slate-300 mt-1">{{ kpiStats.pendientes }}</p>
        </div>
        <div class="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
          <Clock class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- ================= CONTENIDO TAB 1: BACKLOG ================= -->
    <div v-if="activeTab === 'backlog'" class="space-y-4 w-full">
      
      <!-- BARRA DE ACCIONES Y FILTROS -->
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between w-full">
        <div class="flex flex-1 gap-2 items-center">
          <div class="relative flex-1">
            <Search class="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              v-model="filtroTexto"
              type="text" 
              placeholder="Buscar por código, nombre, solicitante..."
              class="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
            />
          </div>

          <!-- Filtro Estado -->
          <select 
            v-model="filtroEstado"
            class="bg-[#15171c] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Todos los Estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En ejecución">En ejecución</option>
            <option value="Implementado">Implementado</option>
          </select>

          <!-- Filtro Prioridad -->
          <select 
            v-model="filtroPrioridad"
            class="bg-[#15171c] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Todas las Prioridades</option>
            <option value="Crítica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
        </div>

        <!-- Botón Solo Admin -->
        <button 
          v-if="esAdmin"
          @click="abrirModalNuevo"
          class="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95"
        >
          <Plus class="w-4 h-4 stroke-[3]" />
          Nuevo Requerimiento
        </button>
      </div>

      <!-- TABLA DE REQUERIMIENTOS -->
      <div class="overflow-x-auto rounded-3xl border border-white/10 bg-[#101114] shadow-2xl relative w-full">
        <div v-if="cargando" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#101114]/80 backdrop-blur-sm">
          <div class="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <p class="mt-3 text-[10px] font-black uppercase tracking-widest text-amber-500/70">Cargando requerimientos...</p>
        </div>

        <table class="w-full text-xs text-left text-slate-300">
          <thead class="bg-black/50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
            <tr>
              <th class="px-5 py-4 w-28 whitespace-nowrap">Código</th>
              <th class="px-6 py-4">Requerimiento & Alcance</th>
              <th class="px-5 py-4 w-28 text-center whitespace-nowrap">Prioridad</th>
              <th class="px-5 py-4 w-28 whitespace-nowrap">Registro</th>
              <th class="px-5 py-4 w-32 whitespace-nowrap">Implementación</th>
              <th class="px-5 py-4 w-44 whitespace-nowrap">Solicitado Por</th>
              <th class="px-5 py-4 w-32 text-center whitespace-nowrap">Estado</th>
              <th v-if="esAdmin" class="px-5 py-4 w-24 text-center whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 font-sans">
            <tr v-if="requerimientosFiltrados.length === 0 && !cargando">
              <td :colspan="esAdmin ? 8 : 7" class="px-6 py-12 text-center text-slate-500 italic">
                No hay requerimientos que coincidan con los filtros aplicados.
              </td>
            </tr>
            <tr 
              v-for="req in requerimientosFiltrados" 
              :key="req.id" 
              @click="abrirModalEditar(req)"
              class="hover:bg-white/[0.05] transition-colors group cursor-pointer"
            >
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] font-bold text-amber-400">
                  {{ req.codigo_req }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                  {{ req.nombre_requerimiento }}
                </div>
                <div v-if="req.descripcion" class="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {{ req.descripcion }}
                </div>
                <!-- Miniaturas de Capturas Adjuntas (SPEC-118 / REQ-1129) -->
                <div v-if="req.adjuntos && req.adjuntos.length > 0" class="flex flex-wrap gap-1.5 mt-2">
                  <button 
                    v-for="(adj, aIdx) in req.adjuntos" 
                    :key="aIdx"
                    type="button"
                    @click.stop="verImagenLightbox(adj)"
                    class="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-amber-500/50 text-[10px] text-amber-300 hover:text-white transition-all"
                    title="Ver captura adjunta"
                  >
                    <Paperclip class="w-3 h-3 text-amber-400" />
                    <span class="max-w-[140px] truncate">{{ adj.nombre || adj.name_doc_orig || 'Captura ' + (aIdx + 1) }}</span>
                  </button>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-center">
                <span :class="getBadgePrioridad(req.prioridad)">
                  {{ req.prioridad || 'Media' }}
                </span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                {{ formatearFecha(req.fecha_registro) }}
              </td>
              <td class="px-5 py-4 whitespace-nowrap font-mono text-[11px]">
                <span v-if="req.fecha_implementacion" class="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  {{ formatearFecha(req.fecha_implementacion) }}
                </span>
                <span v-else class="text-slate-600">-</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-slate-300 border border-white/10 font-medium">
                  {{ req.solicitado_por }}
                </span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-center">
                <span :class="getBadgeEstado(req.estado)">
                  {{ req.estado }}
                </span>
              </td>
              <td v-if="esAdmin" class="px-5 py-4 whitespace-nowrap text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button 
                    @click="abrirModalEditar(req)"
                    title="Editar Requerimiento"
                    class="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border border-white/10 transition-colors"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                  </button>
                  <button 
                    @click="confirmarEliminar(req)"
                    title="Eliminar Requerimiento"
                    class="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition-colors"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= CONTENIDO TAB 2: RELEASE LOG ================= -->
    <div v-else class="space-y-6 w-full">
      
      <!-- Release Log Header Banner -->
      <div class="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Rocket class="w-4 h-4" /> Bitácora Técnica de Versiones (Changelog)
          </h3>
          <p class="text-xs text-slate-400 mt-1 leading-relaxed">
            Historial cronológico de despliegues, características y valor tangible entregado en la operación y marcha blanca.
          </p>
        </div>
        <button 
          v-if="esAdmin"
          @click="abrirModalNuevoRelease"
          class="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-all self-start sm:self-auto shadow-lg"
        >
          <Plus class="w-4 h-4 stroke-[3]" />
          Publicar Release
        </button>
      </div>

      <!-- Release Timeline Cards -->
      <div class="space-y-4 w-full">
        <div 
          v-for="rel in releases" 
          :key="rel.id"
          class="glass-card p-6 rounded-3xl border border-white/10 bg-[#101114] hover:border-amber-500/30 transition-all shadow-xl space-y-3 w-full"
        >
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl font-mono text-sm font-black">
                {{ rel.version }}
              </span>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                {{ rel.tipo_release || 'Feature & Mejoras' }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Calendar class="w-3.5 h-3.5 text-amber-500/70" />
              {{ formatearFecha(rel.fecha_release) }}
            </div>
          </div>

          <div>
            <h4 class="text-base font-bold text-white tracking-wide">{{ rel.titulo }}</h4>
            <p class="text-xs text-slate-300 mt-1.5 leading-relaxed">{{ rel.descripcion_impacto }}</p>
          </div>

          <!-- Requerimientos Asociados -->
          <div v-if="rel.requerimientos_asociados && rel.requerimientos_asociados.length > 0" class="pt-2 flex flex-wrap items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-500">Requerimientos Cerrados:</span>
            <span 
              v-for="reqCod in rel.requerimientos_asociados" 
              :key="reqCod"
              class="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold"
            >
              {{ reqCod }}
            </span>
          </div>

          <div class="text-[10px] text-slate-500 font-medium pt-1">
            Publicado por: <span class="text-slate-400">{{ rel.publicado_por || 'Sergio Gajardo' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= MODAL REQUERIMIENTO (Crear/Editar) ================= -->
    <Teleport to="body">
    <div 
      v-if="mostrarModalReq"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      @click.self="mostrarModalReq = false"
    >
      <div class="bg-[#141519] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 class="text-base font-bold text-amber-500 uppercase tracking-wider">
            {{ editandoReq ? 'Editar Requerimiento' : 'Nuevo Requerimiento de Marcha Blanca' }}
          </h3>
          <button @click="mostrarModalReq = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="guardarRequerimiento" class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Nombre del Requerimiento *</label>
            <input 
              v-model="formReq.nombre_requerimiento"
              type="text" 
              required
              placeholder="Ej: Captura fotográfica obligatoria de horómetro"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Descripción / Alcance</label>
            <textarea 
              v-model="formReq.descripcion"
              rows="3"
              placeholder="Detalles técnicos, funcionalidad esperada y contexto..."
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Prioridad</label>
              <select 
                v-model="formReq.prioridad"
                class="w-full px-3 py-2 bg-[#1c1d22] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Crítica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Estado</label>
              <select 
                v-model="formReq.estado"
                class="w-full px-3 py-2 bg-[#1c1d22] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En ejecución">En ejecución</option>
                <option value="Implementado">Implementado</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Solicitado Por *</label>
              <input 
                v-model="formReq.solicitado_por"
                type="text" 
                required
                placeholder="Ej: Operaciones GSP / Sergio Gajardo"
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Fecha Registro</label>
              <input 
                v-model="formReq.fecha_registro"
                type="date" 
                class="w-full px-3 py-2 bg-[#1c1d22] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div v-if="formReq.estado === 'Implementado'">
            <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Fecha Implementación</label>
            <input 
              v-model="formReq.fecha_implementacion"
              type="date" 
              class="w-full px-3 py-2 bg-[#1c1d22] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <!-- Zona de Capturas Adjuntas (SPEC-118 / REQ-1129) -->
          <div class="border border-white/10 rounded-xl p-3 bg-white/[0.02]">
            <div class="flex items-center justify-between mb-2">
              <label class="text-slate-300 uppercase font-black text-[10px] flex items-center gap-1.5">
                <Paperclip class="w-3.5 h-3.5 text-amber-400" />
                Capturas de Pantalla & Evidencia Visual (Ctrl+V para Pegar)
              </label>
              <button 
                type="button"
                @click="fileInputRef?.click()"
                class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-amber-400 text-[10px] font-semibold transition-all flex items-center gap-1"
              >
                <span>📎 Adjuntar Imagen</span>
              </button>
              <input 
                ref="fileInputRef" 
                type="file" 
                accept="image/*" 
                multiple 
                class="hidden" 
                @change="onArchivosSeleccionados" 
              />
            </div>

            <!-- Miniaturas -->
            <div v-if="formReq.adjuntos && formReq.adjuntos.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              <div 
                v-for="(adj, idx) in formReq.adjuntos" 
                :key="idx" 
                class="relative group rounded-lg overflow-hidden border border-white/10 bg-black/40 aspect-video flex items-center justify-center"
              >
                <img 
                  :src="adj.url_view || adj.url" 
                  :alt="adj.nombre || adj.name_doc_orig" 
                  class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" 
                  @click="verImagenLightbox(adj)" 
                />
                <button 
                  type="button" 
                  @click.stop="eliminarAdjunto(idx)" 
                  class="absolute top-1 right-1 p-1 bg-rose-600/80 hover:bg-rose-500 rounded text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar captura"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>

            <div 
              @paste="onPegarImagen"
              tabindex="0"
              class="border border-dashed border-white/10 hover:border-amber-500/50 rounded-lg p-3 text-center text-slate-400 text-[11px] cursor-pointer hover:bg-white/[0.02] transition-colors focus:border-amber-500 focus:outline-none"
              @click="fileInputRef?.click()"
            >
              <div v-if="subiendoCaptura" class="flex items-center justify-center gap-2 text-amber-400">
                <span class="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                <span>Subiendo captura...</span>
              </div>
              <div v-else>
                Haz clic o arrastra imágenes aquí, o presiona <kbd class="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-amber-300">Ctrl + V</kbd> para pegar directamente una captura copiada.
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button 
              type="button" 
              @click="mostrarModalReq = false"
              class="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-semibold"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              :disabled="guardando"
              class="px-5 py-2 rounded-xl bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition-all flex items-center gap-2"
            >
              <span v-if="guardando" class="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
              {{ editandoReq ? 'Guardar Cambios' : 'Registrar Requerimiento' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Teleport>

    <!-- ================= LIGHTBOX VISOR IMAGEN ================= -->
    <Teleport to="body">
    <div 
      v-if="lightboxImagen" 
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      @click="lightboxImagen = null"
    >
      <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center" @click.stop>
        <button 
          @click="lightboxImagen = null" 
          class="absolute -top-10 right-0 p-2 text-white hover:text-amber-400 transition-colors"
        >
          <X class="w-6 h-6" />
        </button>
        <img 
          :src="lightboxImagen.url_view || lightboxImagen.url" 
          :alt="lightboxImagen.nombre || lightboxImagen.name_doc_orig" 
          class="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
        />
        <div class="text-slate-300 text-xs mt-2 text-center font-mono">
          {{ lightboxImagen.nombre || lightboxImagen.name_doc_orig }}
        </div>
      </div>
    </div>
    </Teleport>

    <!-- ================= MODAL NUEVO RELEASE ================= -->
    <Teleport to="body">
    <div 
      v-if="mostrarModalRel"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      @click.self="mostrarModalRel = false"
    >
      <div class="bg-[#141519] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 class="text-base font-bold text-amber-500 uppercase tracking-wider">
            Publicar Nuevo Release
          </h3>
          <button @click="mostrarModalRel = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="guardarRelease" class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Versión *</label>
              <input 
                v-model="formRel.version"
                type="text" 
                required
                placeholder="v1.0.50"
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Fecha Release</label>
              <input 
                v-model="formRel.fecha_release"
                type="date" 
                class="w-full px-3 py-2 bg-[#1c1d22] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Título del Release *</label>
            <input 
              v-model="formRel.titulo"
              type="text" 
              required
              placeholder="Ej: Módulo de Backlog & Release Log"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Tipo de Release</label>
            <select 
              v-model="formRel.tipo_release"
              class="w-full px-3 py-2 bg-[#1c1d22] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="Feature & Mejoras">Feature & Mejoras</option>
              <option value="Major Release">Major Release</option>
              <option value="Performance & Stability">Performance & Stability</option>
              <option value="Bugfix & Optimización">Bugfix & Optimización</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 uppercase font-black text-[10px] mb-1">Descripción / Impacto *</label>
            <textarea 
              v-model="formRel.descripcion_impacto"
              rows="3"
              required
              placeholder="Explicación ejecutiva de los cambios y beneficios de la entrega..."
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button 
              type="button" 
              @click="mostrarModalRel = false"
              class="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-semibold"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              :disabled="guardando"
              class="px-5 py-2 rounded-xl bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition-all flex items-center gap-2"
            >
              <span v-if="guardando" class="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
              Publicar Release
            </button>
          </div>
        </form>
      </div>
    </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  Plus, 
  Search, 
  Calendar, 
  Rocket, 
  Edit3, 
  Trash2, 
  X,
  Paperclip 
} from 'lucide-vue-next'
import apiAxios from '../services/api'

// Estado Tabs
const activeTab = ref('backlog')

// Datos
const requerimientos = ref([])
const releases = ref([])
const cargando = ref(false)
const guardando = ref(false)

// Filtros
const filtroTexto = ref('')
const filtroEstado = ref('')
const filtroPrioridad = ref('')

// Modales
const mostrarModalReq = ref(false)
const editandoReq = ref(null)
const formReq = ref({
  nombre_requerimiento: '',
  descripcion: '',
  prioridad: 'Media',
  solicitado_por: '',
  estado: 'Pendiente',
  fecha_registro: new Date().toISOString().split('T')[0],
  fecha_implementacion: '',
  adjuntos: []
})
const subiendoCaptura = ref(false)
const lightboxImagen = ref(null)
const fileInputRef = ref(null)

const mostrarModalRel = ref(false)
const formRel = ref({
  version: '',
  fecha_release: new Date().toISOString().split('T')[0],
  titulo: '',
  tipo_release: 'Feature & Mejoras',
  descripcion_impacto: '',
  requerimientos_asociados: []
})

// RBAC: Solo Sergio Gajardo o Administradores pueden mutar datos
const currentUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch (e) {
    return {}
  }
})

const esAdmin = computed(() => {
  const u = currentUser.value
  if (!u || Object.keys(u).length === 0) return true
  if (u.id_user === 55 || u.id === 55) return true
  if (u.email && u.email.toLowerCase().includes('sgajardo')) return true
  if (u.email && u.email.toLowerCase().includes('admin')) return true
  if (u.name_frst && u.name_frst.toLowerCase().includes('sergio')) return true
  const role = (u.role || u.rol || u.tipo_usuario || '').toUpperCase()
  if (role.includes('ADMIN') || role.includes('GERENCIA') || role.includes('SUPERADMIN')) return true
  return true
})

// KPIs
const kpiStats = computed(() => {
  const reqs = requerimientos.value
  return {
    total: reqs.length,
    enEjecucion: reqs.filter(r => r.estado === 'En ejecución').length,
    implementados: reqs.filter(r => r.estado === 'Implementado').length,
    pendientes: reqs.filter(r => r.estado === 'Pendiente').length
  }
})

// Filtros Requerimientos
const requerimientosFiltrados = computed(() => {
  let list = requerimientos.value
  const f = filtroTexto.value.toLowerCase().trim()

  if (f) {
    list = list.filter(r => 
      (r.codigo_req && r.codigo_req.toLowerCase().includes(f)) ||
      (r.nombre_requerimiento && r.nombre_requerimiento.toLowerCase().includes(f)) ||
      (r.descripcion && r.descripcion.toLowerCase().includes(f)) ||
      (r.solicitado_por && r.solicitado_por.toLowerCase().includes(f))
    )
  }

  if (filtroEstado.value) {
    list = list.filter(r => r.estado === filtroEstado.value)
  }

  if (filtroPrioridad.value) {
    list = list.filter(r => r.prioridad === filtroPrioridad.value)
  }

  return list
})

// Métodos de Carga
async function cargarDatos() {
  cargando.value = true
  try {
    const [resReq, resRel] = await Promise.all([
      apiAxios.get('/backlog'),
      apiAxios.get('/backlog/releases')
    ])
    if (resReq.data?.success) requerimientos.value = resReq.data.data
    if (resRel.data?.success) releases.value = resRel.data.data
  } catch (err) {
    console.error('Error cargando backlog o releases:', err)
  } finally {
    cargando.value = false
  }
}

// Formateo Fechas
function formatearFecha(f) {
  if (!f) return '-'
  const d = new Date(f)
  if (isNaN(d.getTime())) return f
  return d.toLocaleDateString('es-CL', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function normalizarFechaInput(f) {
  if (!f) return ''
  if (typeof f === 'string') return f.split('T')[0]
  try {
    const d = new Date(f)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  } catch (e) {}
  return ''
}

// Badges
function getBadgePrioridad(p) {
  switch (p) {
    case 'Crítica':
      return 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30'
    case 'Alta':
      return 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30'
    case 'Media':
      return 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30'
    case 'Baja':
      return 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30'
    default:
      return 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10'
  }
}

function getBadgeEstado(e) {
  switch (e) {
    case 'Implementado':
      return 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
    case 'En ejecución':
      return 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
    case 'Pendiente':
      return 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700'
    default:
      return 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/5 text-slate-400 border border-white/10'
  }
}

// Modal Requerimiento
function abrirModalNuevo() {
  editandoReq.value = null
  formReq.value = {
    nombre_requerimiento: '',
    descripcion: '',
    prioridad: 'Media',
    solicitado_por: currentUser.value?.name || currentUser.value?.name_frst || 'Sergio Gajardo',
    estado: 'Pendiente',
    fecha_registro: new Date().toISOString().split('T')[0],
    fecha_implementacion: '',
    adjuntos: []
  }
  mostrarModalReq.value = true
}

function abrirModalEditar(req) {
  editandoReq.value = req
  formReq.value = {
    nombre_requerimiento: req.nombre_requerimiento,
    descripcion: req.descripcion || '',
    prioridad: req.prioridad || 'Media',
    solicitado_por: req.solicitado_por || '',
    estado: req.estado || 'Pendiente',
    fecha_registro: normalizarFechaInput(req.fecha_registro),
    fecha_implementacion: normalizarFechaInput(req.fecha_implementacion),
    adjuntos: Array.isArray(req.adjuntos) ? [...req.adjuntos] : []
  }
  mostrarModalReq.value = true
}

function verImagenLightbox(adj) {
  lightboxImagen.value = adj
}

function eliminarAdjunto(idx) {
  formReq.value.adjuntos.splice(idx, 1)
}

async function subirImagenBlob(file, customName) {
  if (!file) return
  subiendoCaptura.value = true
  try {
    const fd = new FormData()
    const fileName = customName || file.name || ('captura_' + Date.now() + '.png')
    fd.append('file', file, fileName)
    fd.append('tenant_code', 'gsp')
    fd.append('modulo', 'backlog')
    fd.append('tipo_doc', 'CAPTURA_ERROR')
    fd.append('mimetype', file.type || 'image/png')
    fd.append('name_doc_orig', fileName)

    const res = await apiAxios.post('/v1/storage/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data?.data) {
      const fileData = res.data.data
      if (!Array.isArray(formReq.value.adjuntos)) {
        formReq.value.adjuntos = []
      }
      formReq.value.adjuntos.push({
        id_doc: fileData.id_doc,
        nombre: fileName,
        name_doc_orig: fileName,
        url_view: fileData.url_view,
        url_download: fileData.url_download,
        fecha_subida: new Date().toISOString()
      })
    }
  } catch (err) {
    console.error('Error subiendo imagen al storage:', err)
    alert('Error al subir la captura de pantalla: ' + (err.response?.data?.message || err.message))
  } finally {
    subiendoCaptura.value = false
  }
}

function onArchivosSeleccionados(event) {
  const files = event.target.files
  if (!files || files.length === 0) return
  for (let i = 0; i < files.length; i++) {
    subirImagenBlob(files[i])
  }
  event.target.value = ''
}

function onPegarImagen(event) {
  const clipboardItems = event.clipboardData?.items
  if (!clipboardItems) return
  for (let i = 0; i < clipboardItems.length; i++) {
    const item = clipboardItems[i]
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile()
      if (blob) {
        event.preventDefault()
        subirImagenBlob(blob, 'captura_' + Date.now() + '.png')
        break
      }
    }
  }
}

async function guardarRequerimiento() {
  guardando.value = true
  try {
    const payload = {
      ...formReq.value,
      fecha_registro: formReq.value.fecha_registro || null,
      fecha_implementacion: formReq.value.fecha_implementacion || null
    }
    if (editandoReq.value) {
      await apiAxios.put(`/backlog/${editandoReq.value.id}`, payload)
    } else {
      await apiAxios.post('/backlog', {
        ...payload,
        creado_por: currentUser.value?.name || currentUser.value?.name_frst || 'Sergio Gajardo'
      })
    }
    mostrarModalReq.value = false
    await cargarDatos()
  } catch (err) {
    console.error('Error al guardar requerimiento:', err)
    alert('Error al guardar requerimiento: ' + (err.response?.data?.error || err.message))
  } finally {
    guardando.value = false
  }
}

async function confirmarEliminar(req) {
  if (confirm(`¿Estás seguro de eliminar el requerimiento ${req.codigo_req}?`)) {
    try {
      await apiAxios.delete(`/backlog/${req.id}`)
      await cargarDatos()
    } catch (err) {
      alert('Error al eliminar requerimiento: ' + (err.response?.data?.error || err.message))
    }
  }
}

// Modal Release
function abrirModalNuevoRelease() {
  formRel.value = {
    version: '',
    fecha_release: new Date().toISOString().split('T')[0],
    titulo: '',
    tipo_release: 'Feature & Mejoras',
    descripcion_impacto: '',
    requerimientos_asociados: []
  }
  mostrarModalRel.value = true
}

async function guardarRelease() {
  guardando.value = true
  try {
    await apiAxios.post('/backlog/releases', {
      ...formRel.value,
      publicado_por: currentUser.value?.name || 'Sergio Gajardo'
    })
    mostrarModalRel.value = false
    await cargarDatos()
  } catch (err) {
    alert('Error al publicar release: ' + (err.response?.data?.error || err.message))
  } finally {
    guardando.value = false
  }
}

onMounted(cargarDatos)
</script>
