<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6">
    
    <!-- Header & Unified Control Center -->
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0c0c0e]/90 border border-emerald-500/20 p-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.05)] backdrop-blur-md relative z-10">
      <div>
        <h1 class="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <FolderOpen class="w-6 h-6 text-emerald-500" />
          Biblioteca Documental
        </h1>
        <p class="text-[10px] text-emerald-500/70 mt-1 font-mono tracking-[0.2em] uppercase">Gestor de Flujos y Documentos - Live</p>
      </div>

      <!-- Smart Filters -->
      <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <div class="flex items-center gap-2 bg-black/60 border border-border/50 rounded-lg px-3 py-2 shadow-inner">
          <Calendar class="w-4 h-4 text-zinc-400" />
          <span class="text-[9px] font-black uppercase tracking-wider text-zinc-500">Desde:</span>
          <input 
            v-model="fechaDesdeSeleccionada" 
            type="date" 
            class="bg-transparent text-sm text-emerald-400 font-bold focus:outline-none cursor-pointer outline-none"
            style="color-scheme: dark;"
          />
        </div>
        
        <div class="flex items-center gap-2 bg-black/60 border border-border/50 rounded-lg px-3 py-2 shadow-inner">
          <Calendar class="w-4 h-4 text-zinc-400" />
          <span class="text-[9px] font-black uppercase tracking-wider text-zinc-500">Hasta:</span>
          <input 
            v-model="fechaHastaSeleccionada" 
            type="date" 
            class="bg-transparent text-sm text-emerald-400 font-bold focus:outline-none cursor-pointer outline-none"
            style="color-scheme: dark;"
          />
        </div>

        <div class="flex items-center gap-2 bg-black/60 border border-border/50 rounded-lg px-3 py-2 shadow-inner">
          <Building2 class="w-4 h-4 text-zinc-400" />
          <span class="text-[9px] font-black uppercase tracking-wider text-zinc-500">Cliente:</span>
          <select 
            v-model="clienteSeleccionado"
            class="bg-transparent text-sm text-white font-bold focus:outline-none cursor-pointer outline-none w-32"
          >
            <option :value="null">Todos</option>
            <option v-for="c in clientes" :key="c.id_empresa" :value="c.id_empresa">{{ c.name_empresa }}</option>
          </select>
        </div>

        <button @click="filtrar" class="bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          Filtrar
        </button>
      </div>
    </div>

    <!-- MAIN CONTENT (Split View) -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
      
      <!-- COLUMNA IZQUIERDA: Árbol de Navegación (Empresa ➔ Proyecto ➔ Área ➔ Familia) -->
      <div class="lg:col-span-1 bg-white dark:bg-[#131316] border border-zinc-200 dark:border-white/5 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
        <div class="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2 flex items-center justify-between">
          <span>Explorador de Carpetas</span>
          <FolderOpen class="w-3.5 h-3.5 text-emerald-500" />
        </div>
        
        <!-- Contenedor con scroll para el árbol -->
        <div class="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-hide">
          <div 
            v-for="node in treeNavigationNodes" 
            :key="node.id"
            class="flex items-center py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-xs font-semibold text-left select-none"
            :class="[
              selectedNodeId === node.id 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent',
            ]"
            :style="{ paddingLeft: `${node.level * 16 + 8}px` }"
            @click="selectNode(node)"
          >
            <!-- Toggle button if it has children -->
            <button 
              v-if="node.hasChildren"
              @click.stop="toggleNode(node.id)"
              class="p-0.5 mr-1 rounded hover:bg-white/10 text-zinc-500 transition-colors"
            >
              <ChevronDown v-if="node.expanded" class="w-3 h-3" />
              <ChevronRight v-else class="w-3 h-3" />
            </button>
            <span v-else class="mr-4 inline-block w-3"></span>

            <component 
              :is="getIconComponent(node)" 
              class="w-3.5 h-3.5 mr-2 shrink-0"
              :class="getIconColor(node)"
            />
            
            <span class="truncate flex-1" :title="node.nombre">{{ node.nombre }}</span>
          </div>
        </div>
      </div>

      <!-- COLUMNA DERECHA: Visor de Documentos (Detalle del nodo seleccionado) -->
      <div class="lg:col-span-3 bg-white dark:bg-[#131316] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
        
        <!-- Header de la selección actual -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-4 mb-4 gap-2">
          <div>
            <h2 class="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <FileText class="w-4 h-4 text-emerald-500" />
              Documentos en: <span class="text-emerald-500 dark:text-emerald-400 font-bold lowercase first-letter:uppercase">{{ selectedPathName }}</span>
            </h2>
            <p class="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase">Mostrando archivos de la rama seleccionada</p>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="text-[10px] bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-black">
              {{ filteredFiles.length }} archivos
            </span>
          </div>
        </div>

        <!-- Tabla/Listado de Documentos -->
        <div class="flex-1 overflow-y-auto rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#0a0a0c]">
          <table class="w-full text-left border-collapse">
            <thead class="bg-zinc-100 dark:bg-[#1d1d20] border-b border-zinc-200 dark:border-white/5 sticky top-0 z-10">
              <tr>
                <th class="py-2.5 px-4 text-[9px] font-black text-zinc-500 tracking-wider uppercase">Documento / Survey</th>
                <th class="py-2.5 px-4 text-[9px] font-black text-zinc-500 tracking-wider uppercase w-[120px]">Fecha</th>
                <th class="py-2.5 px-4 text-[9px] font-black text-zinc-500 tracking-wider uppercase w-[140px]">Registrado Por</th>
                <th class="py-2.5 px-4 text-[9px] font-black text-zinc-500 tracking-wider uppercase text-center w-[110px]">Estado</th>
                <th class="py-2.5 px-4 text-[9px] font-black text-zinc-500 tracking-wider uppercase text-center w-[130px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <!-- Empty state -->
              <tr v-if="filteredFiles.length === 0">
                <td colspan="5" class="py-16 text-center text-zinc-500 text-sm italic">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <Database class="w-8 h-8 opacity-20" />
                    Selecciona una carpeta o familia en el árbol de la izquierda para visualizar sus documentos.
                  </div>
                </td>
              </tr>
              
              <!-- Fila de Documento -->
              <tr 
                v-for="file in filteredFiles" 
                :key="file.id"
                class="border-b border-zinc-200 dark:border-white/5 transition-colors hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] text-xs"
              >
                <!-- Nombre del Documento -->
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2.5">
                    <FileText class="w-4 h-4 text-emerald-500 shrink-0" />
                    <div class="flex flex-col min-w-0">
                      <span class="font-bold text-zinc-800 dark:text-zinc-200 truncate">{{ file.nombre }}</span>
                      <span class="text-[9px] text-zinc-500 font-mono tracking-tighter">SURVEY ID: {{ file.data.id_survey }}</span>
                    </div>
                  </div>
                </td>
                
                <!-- Fecha -->
                <td class="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                  {{ fmtFecha(file.data.fecha_plan_fin || file.data.created_at || file.data.date) }}
                </td>
                
                <!-- Registrado por -->
                <td class="py-3 px-4 text-zinc-600 dark:text-zinc-400 truncate max-w-[130px]" :title="file.data.nombre_user">
                  {{ file.data.nombre_user }}
                </td>
                
                <!-- Estado -->
                <td class="py-3 px-4 text-center">
                  <span 
                    class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider"
                    :class="getEstadoFlujoStyle(file.data.estado_srv || file.data.status)"
                  >
                    {{ file.data.estado_srv || file.data.status || 'APROBADO' }}
                  </span>
                </td>
                
                <!-- Acciones (Ver / Descargar PDF) -->
                <td class="py-3 px-4 text-center">
                  <div class="flex justify-center items-center gap-1.5">
                    <!-- Ver Documento / PDF -->
                    <button 
                      v-if="getDocViewUrl(file)"
                      @click="viewPdf(file)"
                      class="flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-500 dark:text-blue-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Ver Documento"
                    >
                      <Eye class="w-3.5 h-3.5" />
                    </button>
                    
                    <!-- Descargar PDF Físico (Si aplica) -->
                    <a 
                      v-if="getDocDownloadUrl(file)"
                      :href="getDocDownloadUrl(file)"
                      target="_blank"
                      :download="`documento-${file.data.id_survey}.pdf`"
                      class="flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-1.5 rounded-lg transition-colors"
                      title="Descargar PDF"
                    >
                      <Download class="w-3.5 h-3.5" />
                    </a>
                    
                    <!-- Si no se puede abrir de ninguna forma -->
                    <span v-if="!getDocViewUrl(file) && !getDocDownloadUrl(file)" class="text-[9px] text-zinc-600 dark:text-zinc-500 italic">No disponible</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Visualización de Estados de Firma (Solo Informativo si es necesario) -->
    <div class="bg-zinc-50 dark:bg-[#0c0c0e]/90 border border-zinc-200 dark:border-white/5 p-4 rounded-xl">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mr-2">Filtros de Estado:</span>
        <button 
          @click="estadoAdminAll = !estadoAdminAll"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer"
          :class="estadoAdminAll ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400 border-blue-500/40' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-white/5'"
        >
          <CheckSquare v-if="estadoAdminAll" class="w-3 h-3" />
          <Square v-else class="w-3 h-3" /> Todos
        </button>

        <button 
          @click="estadoAdminAprobado = !estadoAdminAprobado"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer"
          :class="estadoAdminAprobado ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/40' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-white/5'"
        >
          <CheckSquare v-if="estadoAdminAprobado" class="w-3 h-3" />
          <Square v-else class="w-3 h-3" /> Aprobado
        </button>
        
        <button 
          @click="estadoAdminCreado = !estadoAdminCreado"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer"
          :class="estadoAdminCreado ? 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 border-indigo-500/40' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-white/5'"
        >
          <CheckSquare v-if="estadoAdminCreado" class="w-3 h-3" />
          <Square v-else class="w-3 h-3" /> Creado
        </button>

        <button 
          @click="estadoAdminVerificacion = !estadoAdminVerificacion"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer"
          :class="estadoAdminVerificacion ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/40' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-white/5'"
        >
          <CheckSquare v-if="estadoAdminVerificacion" class="w-3 h-3" />
          <Square v-else class="w-3 h-3" /> Verificación
        </button>

        <button 
          @click="estadoAdminRechazado = !estadoAdminRechazado"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer"
          :class="estadoAdminRechazado ? 'bg-red-500/20 text-red-500 dark:text-red-400 border-red-500/40' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-white/5'"
        >
          <CheckSquare v-if="estadoAdminRechazado" class="w-3 h-3" />
          <Square v-else class="w-3 h-3" /> Rechazado
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { 
  CheckSquare, Square, ChevronDown, ChevronRight, 
  FolderOpen, Folder, Building2, Briefcase, FileText, File, 
  Download, Eye, Calendar, Database
} from 'lucide-vue-next';
import { useGestionDocumentos } from '@/composables/useGestionDocumentos';

const {
  estadoAdminAll, estadoAdminAprobado, estadoAdminCreado, estadoAdminVerificacion, estadoAdminRechazado,
  fechaDesdeSeleccionada, fechaHastaSeleccionada, clienteSeleccionado, proyectoSeleccionado,
  clientes, proyectos, treeRows, toggleNode, filtrar, fmtFecha, flujos
} = useGestionDocumentos();

// Nodos para el árbol lateral izquierdo (solo carpetas, excluimos los archivos de tipo 'file')
const treeNavigationNodes = computed(() => {
  const base = Array.isArray(treeRows.value) ? treeRows.value : [];
  return base.filter(row => row.type !== 'file');
});

// Nodo seleccionado en el árbol
const selectedNodeId = ref(null);
const selectedNode = ref(null);

// Inicializar el primer nodo seleccionado por defecto
watch(treeNavigationNodes, (nodes) => {
  if (nodes.length > 0 && !selectedNodeId.value) {
    selectedNodeId.value = nodes[0].id;
    selectedNode.value = nodes[0];
  }
}, { immediate: true });

function selectNode(node) {
  selectedNodeId.value = node.id;
  selectedNode.value = node;
}

// Nombre legible del nodo/carpeta actual seleccionado
const selectedPathName = computed(() => {
  return selectedNode.value ? selectedNode.value.nombre : 'Ninguna carpeta seleccionada';
});

// Archivos correspondientes al nodo/carpeta seleccionado
const filteredFiles = computed(() => {
  if (!selectedNode.value) return [];
  
  const nodeId = selectedNode.value.id;
  const nodeType = selectedNode.value.type;
  const nodeNombre = selectedNode.value.nombre;
  
  const rawFlujos = Array.isArray(flujos.value) ? flujos.value : [];
  
  return rawFlujos.filter(fl => {
    // 1. Aplicar filtros generales de Clientes, Proyectos y Fechas que están activos en la barra superior
    const matchesClient = !clienteSeleccionado.value || String(clienteSeleccionado.value) === String(fl.id_empresa_cliente);
    const matchesProj = !proyectoSeleccionado.value || String(proyectoSeleccionado.value) === String(fl.id_proyecto);
    
    // Filtro de estados de flujo
    const est = String(fl.estado_srv || '').toUpperCase().trim();
    let matchesEstado = false;
    if (estadoAdminAll.value) matchesEstado = true;
    else {
      if (estadoAdminAprobado.value && est === 'APROBADO') matchesEstado = true;
      if (estadoAdminCreado.value && est === 'CREADO') matchesEstado = true;
      if (estadoAdminVerificacion.value && est === 'VERIFICACION') matchesEstado = true;
      if (estadoAdminRechazado.value && est === 'RECHAZADO') matchesEstado = true;
    }
    
    if (!matchesClient || !matchesProj || !matchesEstado) return false;

    // 2. Filtrar los archivos que caen específicamente dentro de la rama seleccionada en el árbol
    if (nodeType === 'client') {
      return fl.name_empresa_cliente === nodeNombre;
    }
    if (nodeType === 'proyecto') {
      // Coincide nombre de proyecto y el ID del nodo contiene el nombre del cliente formateado para unicidad
      return fl.nombre_proyecto === nodeNombre && nodeId.includes(fl.name_empresa_cliente.replace(/\s+/g, '_'));
    }
    if (nodeType === 'area') {
      return fl.tematica_funcional === nodeNombre && 
             nodeId.includes(fl.nombre_proyecto.replace(/\s+/g, '_')) && 
             nodeId.includes(fl.name_empresa_cliente.replace(/\s+/g, '_'));
    }
    if (nodeType === 'family') {
      return fl.documento === nodeNombre && 
             nodeId.includes(fl.tematica_funcional.replace(/\s+/g, '_')) && 
             nodeId.includes(fl.nombre_proyecto.replace(/\s+/g, '_')) && 
             nodeId.includes(fl.name_empresa_cliente.replace(/\s+/g, '_'));
    }
    return false;
  }).map(fl => ({
    id: `file-${fl.id_survey || Math.random()}`,
    nombre: fl.documento || 'Documento sin nombre',
    type: 'file',
    data: {
      ...fl,
      fecha_plan_fin: fl.fecha_display || fl.fecha_plan_ini || fl.created_at || fl.date || '',
      nombre_user: fl.id_user || 'Sistema'
    }
  }));
});

// Retorna la URL para visualizar el documento (sea survey de impresión o PDF físico)
function getDocViewUrl(file) {
  if (!file || !file.data) return null;
  
  // 1. Si es una encuesta nativa, abrir la vista de impresión del sistema
  if (file.data._source === 'SURVEY') {
    return `/lg-transmac-dev/verSurveyPrint?idInspeccion=${file.data.id_survey}`;
  }
  
  // 2. Si es una auditoría o registro de flota, buscar el PDF físico
  const url = file.data.url_pdf || file.data.pdf_url || file.data.documento_pdf;
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const host = 'https://servidor.leanglobal.cl';
  return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Retorna la URL de descarga directa si es un PDF físico en el servidor
function getDocDownloadUrl(file) {
  if (!file || !file.data) return null;
  
  // Las encuestas nativas se visualizan/imprimen desde el navegador
  if (file.data._source === 'SURVEY') return null;
  
  const url = file.data.url_pdf || file.data.pdf_url || file.data.documento_pdf;
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const host = 'https://servidor.leanglobal.cl';
  return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
}

function viewPdf(file) {
  const url = getDocViewUrl(file);
  if (url) {
    window.open(url, '_blank');
  } else {
    alert('Visualización no disponible para este documento.');
  }
}

// Helpers para Iconos del explorador lateral
function getIconComponent(row) {
  if (row.type === 'client') return Building2;
  if (row.type === 'proyecto') return Briefcase;
  if (row.type === 'area' || row.type === 'family') return row.expanded ? FolderOpen : Folder;
  if (row.type === 'file') return FileText;
  return File;
}

function getIconColor(row) {
  if (row.type === 'client') return 'text-emerald-400';
  if (row.type === 'proyecto') return 'text-blue-400';
  if (row.type === 'area' || row.type === 'family') {
    return row.isEmpty ? 'text-zinc-600' : 'text-amber-500';
  }
  if (row.type === 'file') return 'text-red-500';
  return 'text-zinc-500';
}

function getEstadoFlujoStyle(estado) {
  const e = String(estado ?? '').toUpperCase().trim();
  if (e === 'APROBADO') return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 border';
  if (e === 'CREADO') return 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40 border';
  if (e.includes('VERIFICACION')) return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 border';
  if (e === 'RECHAZADO') return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 border';
  return 'bg-zinc-800 text-zinc-400 border-zinc-700 border';
}
</script>
