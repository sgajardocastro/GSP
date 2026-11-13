<template>
  <div class="space-y-6 text-left animate-fadeIn p-2 sm:p-4 text-slate-100 font-sans">
    
    <!-- CABECERA PRINCIPAL Y SELECTOR DE PESTAÑAS -->
    <div class="bg-[#0a0f1e] p-4 rounded-2xl border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl font-bold">
            📋
          </div>
          <div>
            <h1 class="text-lg font-black text-white tracking-wide uppercase font-mono flex items-center gap-2">
              ITS Transición
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                v1.0 Operativa
              </span>
            </h1>
            <p class="text-xs text-slate-400 font-mono mt-0.5">
              Gestión, validación de horas y liquidación de costos de faena
            </p>
          </div>
        </div>
      </div>

      <!-- Selector de Pestañas Principales y Rol Activo -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center bg-[#050810] p-1 rounded-xl border border-white/10">
          <button
            @click="tabActivo = 'elaborar'"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            :class="tabActivo === 'elaborar' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <span>📝</span>
            <span>Elaborar Informe</span>
          </button>
          <button
            @click="tabActivo = 'control'"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            :class="tabActivo === 'control' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <span>📊</span>
            <span>Control y Estados</span>
            <span v-if="informesHistorial.length > 0" class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {{ informesHistorial.length }}
            </span>
          </button>
        </div>

        <!-- Badge y Switcher de Rol Activo (Gobernanza Spec 67) -->
        <div class="flex items-center gap-2 bg-[#050810] px-3 py-1.5 rounded-xl border border-white/10 font-mono text-xs">
          <span class="text-slate-400">👤 Rol:</span>
          <span :class="badgeColorRol(rolActivo)" class="px-2 py-0.5 rounded text-[10px] font-black border uppercase">
            {{ rolActivo }}
          </span>
          <select
            v-if="esAdminUsuario"
            v-model="rolActivo"
            class="bg-[#0e1628] border border-white/15 text-white rounded px-2 py-0.5 text-[10px] outline-none cursor-pointer"
            title="Cambiar rol activo (Exclusivo Administrador)"
          >
            <option value="SECRETARIA">Secretaria</option>
            <option value="ANALISTA">Analista</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="CONTABILIDAD">Contabilidad</option>
          </select>
        </div>
      </div>
    </div>

    <!-- BANNER ASISTENTE DE MIGRACIÓN: INFORMES LOCALES PENDIENTES DE SUBIR A LA NUBE -->
    <div
      v-if="informesLocalesPendientes.length > 0"
      class="bg-blue-600/15 border-2 border-blue-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono shadow-2xl animate-in fade-in"
    >
      <div class="space-y-1.5 max-w-3xl">
        <div class="flex items-center gap-2">
          <span class="text-xl">☁️</span>
          <span class="text-xs font-black uppercase tracking-wider text-blue-300">
            Informes Guardados en este Equipo Pendientes de Subir a la Nube ({{ informesLocalesPendientes.length }})
          </span>
        </div>
        <p class="text-xs text-slate-300">
          Se detectaron informes trabajados localmente en este navegador que aún no están en la base de datos central. Al subirlos, quedarán disponibles inmediatamente para toda la organización.
        </p>
        <div class="text-[11px] text-blue-200 bg-black/40 p-2 rounded-lg border border-blue-500/20">
          <strong>Cotizaciones detectadas:</strong>
          {{ informesLocalesPendientes.map(i => '#' + (i.numero_cotizacion || i.folio_its)).join(', ') }}
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 self-end sm:self-center">
        <button
          @click="migrarInformesLocalesAlServidor"
          :disabled="migrandoLocales"
          class="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>{{ migrandoLocales ? '⏳ Subiendo...' : '☁️ Subir al Servidor Central' }}</span>
        </button>
        <button
          @click="descargarRespaldoLocalJson"
          class="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1 border border-white/10 transition-all cursor-pointer"
          title="Descargar copia de seguridad en archivo .json"
        >
          <span>💾 Respaldo JSON</span>
        </button>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- PESTAÑA 1: ELABORAR INFORME                                               -->
    <!-- ========================================================================= -->
    <div v-show="tabActivo === 'elaborar'" class="space-y-6">

      <!-- BANNER DE ADVERTENCIA SI ESTÁ OBSERVADO (DEVUELTO) -->
      <div
        v-if="esObservado"
        class="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono shadow-xl animate-in fade-in"
      >
        <div class="space-y-1.5 max-w-3xl">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚠️</span>
            <span class="text-xs font-black uppercase tracking-wider text-amber-300">
              INFORME DEVUELTO CON OBSERVACIONES ({{ informe.estado === 'OBSERVADO_ADMIN' ? 'Revisión Administrador' : 'Revisión Contabilidad' }})
            </span>
          </div>
          <p class="text-xs text-slate-300">
            <strong class="text-white">Motivo:</strong> {{ ultimaObservacion?.motivo || 'Observaciones en liquidación' }}
          </p>
          <div class="text-xs text-amber-200 bg-black/40 p-2.5 rounded-lg border border-amber-500/20 italic leading-relaxed">
            "{{ ultimaObservacion?.observaciones || 'Favor corregir datos y montos antes de continuar el flujo.' }}"
          </div>
          <div class="text-[10px] text-slate-400">
            Devuelto por: <strong class="text-slate-200">{{ ultimaObservacion?.nombre_usuario }}</strong> ({{ ultimaObservacion?.rol }}) el {{ formatDateCL(ultimaObservacion?.fecha) }}
          </div>
        </div>
        <div class="flex items-center gap-2 self-end sm:self-center">
          <button
            v-if="rolActivo === 'SECRETARIA' || rolActivo === 'ANALISTA' || rolActivo === 'ADMINISTRADOR'"
            @click="() => abrirModalFes('ELABORADOR')"
            class="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <span>✍️</span> Re-firmar y Enviar
          </button>
        </div>
      </div>

      <!-- BÓVEDA CORPORATIVA GERALDSOFT Y MATRIZ DE CONCILIACIÓN ITS (SPEC-070) -->
      <div class="bg-[#0f1629] p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl space-y-5">
        <!-- Cabecera de la Bóveda en la Nube -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>📦</span> Bóveda Corporativa de Planillas GeraldSoft (Nube)
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              Fuente de datos centralizada compartida en tiempo real para todo el equipo operativo.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="sincronizarBovedaManual"
              :disabled="cargandoPlanillas"
              class="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-xl border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-mono"
              title="Sincronizar con el servidor"
            >
              <span>{{ cargandoPlanillas ? '⏳' : '🔄' }}</span> Sincronizar Bóveda
            </button>
            <button
              @click="abrirModalHistorialPlanillas"
              class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-mono"
              title="Ver bitácora de cargas"
            >
              <span>📜</span> Historial
            </button>
            <button
              @click="mostrarPanelCarga = !mostrarPanelCarga"
              class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer font-mono shadow-md"
            >
              <span>📂</span> {{ mostrarPanelCarga ? 'Ocultar Carga' : 'Cargar Planilla Diaria' }}
            </button>
          </div>
        </div>

        <!-- Tarjeta de Estado Activo en el Servidor -->
        <div class="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2 text-slate-200">
              <span class="font-bold text-emerald-300">Estado de la Bóveda en Servidor:</span>
              <span v-if="planillasCargadasServidor.controles" class="text-slate-300">
                📊 Controles: <strong class="text-white">{{ planillasCargadasServidor.controles.nombre_archivo }}</strong> ({{ planillasCargadasServidor.controles.total_registros }} reg.)
              </span>
              <span v-if="planillasCargadasServidor.ordenes" class="text-slate-300">
                • 📋 OTs: <strong class="text-white">{{ planillasCargadasServidor.ordenes.nombre_archivo }}</strong> ({{ planillasCargadasServidor.ordenes.total_registros }} reg.)
              </span>
            </div>
            <div class="text-[11px] text-slate-400">
              Última actualización: <span class="text-emerald-300 font-bold">{{ formatDateCLHora(planillasCargadasServidor.controles?.fecha_carga || planillasCargadasServidor.ordenes?.fecha_carga) }}</span>
              por <strong class="text-slate-200">{{ planillasCargadasServidor.controles?.usuario_nombre || planillasCargadasServidor.ordenes?.usuario_nombre || 'Sistema' }}</strong>
              <span v-if="planillasCargadasServidor.controles?.modo_carga" class="ml-1 px-1.5 py-0.2 rounded bg-white/10 text-white text-[10px]">
                Modo: {{ planillasCargadasServidor.controles.modo_carga }}
              </span>
            </div>
          </div>
          <div v-if="serviciosDisponibles.length > 0" class="text-[11px] text-emerald-400 font-bold">
            ✓ {{ serviciosDisponibles.length }} Cotizaciones activas disponibles
          </div>
        </div>

        <!-- PANEL DE CARGA COLAPSABLE CON SELECTOR DE MODO -->
        <div v-if="mostrarPanelCarga" class="p-4 bg-black/40 rounded-xl border border-white/15 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-3 rounded-lg border border-white/10 text-xs font-mono">
            <span class="text-slate-300 font-bold">Modalidad de Carga Diaria:</span>
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                <input type="radio" value="incremental" v-model="modoCargaPlanilla" class="text-blue-500" />
                <span>🔘 <strong>Fusión Incremental Diaria (Recomendado)</strong></span>
              </label>
              <label class="flex items-center gap-1.5 text-slate-400 cursor-pointer hover:text-slate-200">
                <input type="radio" value="reemplazo" v-model="modoCargaPlanilla" class="text-rose-500" />
                <span>⚪ Reemplazo Total del Mes</span>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Archivo 1: CONTROLES SERVICIOS -->
            <div class="p-3.5 rounded-xl border border-dashed transition-all"
                 :class="serviciosRaw.length > 0 ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-white/5 border-white/15 hover:border-blue-500/40'">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                    <span>📄</span> 1. Control de Servicios (CONTROLES [MES].XLS)
                  </p>
                  <p class="text-[11px] text-slate-400 mt-1">
                    Horas de terreno, patentes, choferes, horas reales y N° de reportes.
                  </p>
                </div>
                <label class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 flex-shrink-0 shadow-sm">
                  <span>Examinar</span>
                  <input type="file" accept=".xls,.xlsx" class="hidden" @change="onSubirArchivoServicios" />
                </label>
              </div>
              <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span class="text-slate-400 truncate max-w-[240px]">
                  {{ nombreArchivoServicios || 'Sin archivo seleccionado' }}
                </span>
                <span v-if="serviciosRaw.length > 0" class="text-emerald-400 font-bold">
                  ✓ {{ serviciosRaw.length }} registros
                </span>
              </div>
            </div>

            <!-- Archivo 2: ÓRDENES DE TRABAJO (OT) -->
            <div class="p-3.5 rounded-xl border border-dashed transition-all"
                 :class="ordenesRaw.length > 0 ? 'bg-purple-500/5 border-purple-500/30' : 'bg-white/5 border-white/15 hover:border-purple-500/40'">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                    <span>📄</span> 2. Órdenes de Trabajo (OT [MES].xlsx)
                  </p>
                  <p class="text-[11px] text-slate-400 mt-1">
                    Clientes, RUT, empresa de facturación, vendedor, horas mínimas y valores.
                  </p>
                </div>
                <label class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 flex-shrink-0 shadow-sm">
                  <span>Examinar</span>
                  <input type="file" accept=".xls,.xlsx" class="hidden" @change="onSubirArchivoOrdenes" />
                </label>
              </div>
              <div class="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span class="text-slate-400 truncate max-w-[240px]">
                  {{ nombreArchivoOrdenes || 'Sin archivo seleccionado' }}
                </span>
                <span v-if="ordenesRaw.length > 0" class="text-purple-300 font-bold">
                  ✓ {{ ordenesRaw.length }} OTs
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- MATRIZ OPERATIVA DE CONCILIACIÓN Y PIPELINE DE SERVICIOS (SPEC-070)       -->
        <!-- ========================================================================= -->
        <div v-if="serviciosDisponibles.length > 0" class="space-y-3 pt-2">
          <!-- Barra de KPIs del Pipeline Operativo -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-center">
            <div class="p-2.5 bg-black/40 rounded-xl border border-white/10">
              <p class="text-[10px] uppercase text-slate-400 font-bold">Total Servicios</p>
              <p class="text-lg font-black text-white">{{ kpisPipelineServicios.total }}</p>
            </div>
            <div @click="filtroEstadoPipeline = 'PENDIENTE'" class="p-2.5 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-white/10 cursor-pointer transition-all" :class="filtroEstadoPipeline === 'PENDIENTE' ? 'ring-2 ring-blue-400' : ''">
              <p class="text-[10px] uppercase text-slate-300 font-bold">⚪ Pendientes ITS</p>
              <p class="text-lg font-black text-slate-200">{{ kpisPipelineServicios.pendientes }}</p>
            </div>
            <div @click="filtroEstadoPipeline = 'TRAMITE'" class="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/20 cursor-pointer transition-all" :class="filtroEstadoPipeline === 'TRAMITE' ? 'ring-2 ring-amber-400' : ''">
              <p class="text-[10px] uppercase text-amber-300 font-bold">🟡 En Trámite</p>
              <p class="text-lg font-black text-amber-400">{{ kpisPipelineServicios.tramite }}</p>
            </div>
            <div @click="filtroEstadoPipeline = 'OBSERVADO'" class="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 cursor-pointer transition-all" :class="filtroEstadoPipeline === 'OBSERVADO' ? 'ring-2 ring-rose-400' : ''">
              <p class="text-[10px] uppercase text-rose-300 font-bold">🔴 Observados</p>
              <p class="text-lg font-black text-rose-400">{{ kpisPipelineServicios.observados }}</p>
            </div>
            <div @click="filtroEstadoPipeline = 'APROBADO'" class="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 cursor-pointer transition-all" :class="filtroEstadoPipeline === 'APROBADO' ? 'ring-2 ring-emerald-400' : ''">
              <p class="text-[10px] uppercase text-emerald-300 font-bold">🟢 Concluidos</p>
              <p class="text-lg font-black text-emerald-400">{{ kpisPipelineServicios.aprobados }}</p>
            </div>
          </div>

          <!-- Franja de Filtros y Buscador -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end font-mono">
            <div class="md:col-span-5">
              <label class="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                🔎 Buscar Cotización, Cliente o Faena ({{ serviciosPipelineFiltrados.length }} de {{ serviciosDisponibles.length }})
              </label>
              <div class="relative">
                <input
                  v-model="filtroCotizacionTexto"
                  type="text"
                  placeholder="Ej: 11493, Besalco, Louisiana, 80 Ton..."
                  class="w-full bg-[#050810] border border-white/15 focus:border-blue-400 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 outline-none transition-all"
                />
                <button
                  v-if="filtroCotizacionTexto"
                  @click="filtroCotizacionTexto = ''"
                  class="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs font-bold"
                >✕</button>
              </div>
            </div>
            <div class="md:col-span-4 flex flex-wrap gap-1">
              <button
                v-for="pest in [
                  { id: 'TODOS', label: 'Todos' },
                  { id: 'PENDIENTE', label: '⚪ Pendientes' },
                  { id: 'TRAMITE', label: '🟡 En Trámite' },
                  { id: 'APROBADO', label: '🟢 Concluidos' }
                ]"
                :key="pest.id"
                @click="filtroEstadoPipeline = pest.id"
                class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border"
                :class="filtroEstadoPipeline === pest.id ? 'bg-blue-600 text-white border-blue-500 shadow' : 'bg-black/30 text-slate-400 border-white/10 hover:text-white'"
              >
                {{ pest.label }}
              </button>
            </div>
            <div class="md:col-span-3 flex justify-end">
              <button
                @click="crearInformeEnBlanco"
                class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <span>➕</span>
                <span>Nuevo en Blanco</span>
              </button>
            </div>
          </div>

          <!-- TABLA INTERACTIVA DE CONCILIACIÓN OPERATIVA -->
          <div class="overflow-x-auto rounded-xl border border-white/10 max-h-[360px] overflow-y-auto">
            <table class="w-full text-xs text-left font-mono">
              <thead class="bg-[#050810] text-[10px] uppercase text-slate-400 border-b border-white/10 sticky top-0 z-10">
                <tr>
                  <th class="p-2.5">Cotización</th>
                  <th class="p-2.5">Cliente</th>
                  <th class="p-2.5">OTs / Jornadas</th>
                  <th class="p-2.5">Equipos Involucrados</th>
                  <th class="p-2.5 text-center">Estado ITS</th>
                  <th class="p-2.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 bg-[#0a0f1d]">
                <tr
                  v-for="s in serviciosPipelineFiltrados"
                  :key="s.key"
                  class="hover:bg-white/5 transition-colors"
                  :class="servicioSeleccionadoKey === s.key ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : ''"
                >
                  <td class="p-2.5 font-bold text-amber-300 font-mono">
                    #{{ s.cotizacion }}
                  </td>
                  <td class="p-2.5 font-bold text-white max-w-[200px] truncate" :title="s.cliente">
                    {{ s.cliente }}
                  </td>
                  <td class="p-2.5 text-slate-300 text-[11px]">
                    {{ Array.from(s.ots).join(', ') || 'S/N' }}
                    <span class="text-slate-400">({{ s.servicios.length }} jor.)</span>
                  </td>
                  <td class="p-2.5 text-slate-400 text-[11px] max-w-[180px] truncate" :title="extraerEquiposTexto(s)">
                    {{ extraerEquiposTexto(s) }}
                  </td>
                  <td class="p-2.5 text-center">
                    <div v-if="s.itsRelacionado" class="inline-flex flex-col items-center">
                      <span
                        class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border inline-block"
                        :class="getEstadoBadgeClase(s.itsRelacionado.estado)"
                      >
                        {{ s.itsRelacionado.folio_its }} ({{ s.itsRelacionado.estado }})
                      </span>
                      <span v-if="s.itsRelacionado.nombre_elaborador" class="text-[9px] text-slate-400 font-mono mt-0.5">
                        👤 {{ s.itsRelacionado.nombre_elaborador }}
                      </span>
                    </div>
                    <span v-else class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-800 text-slate-400 border border-white/10 inline-block">
                      ⚪ PENDIENTE
                    </span>
                  </td>
                  <td class="p-2.5 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <!-- Si ya tiene ITS Aprobado -->
                      <button
                        v-if="s.itsRelacionado && s.itsRelacionado.estado === 'APROBADO'"
                        @click="verPdfDocumento(s.itsRelacionado)"
                        class="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded border border-emerald-500/40 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Ver PDF Oficial Firmado"
                      >
                        <span>👁️</span> PDF
                      </button>
                      <!-- Si tiene ITS en Trámite o Devuelto -->
                      <button
                        v-if="s.itsRelacionado && s.itsRelacionado.estado !== 'APROBADO'"
                        @click="cargarInformeParaEdicion(s.itsRelacionado)"
                        class="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded border border-amber-500/40 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        :title="`Continuar o editar este informe (Último editor: ${s.itsRelacionado.nombre_elaborador || 'Operaciones'})`"
                      >
                        <span>✏️</span> Continuar
                      </button>
                      <!-- Si no tiene ITS -->
                      <button
                        v-if="!s.itsRelacionado"
                        @click="seleccionarYElaborarIts(s)"
                        class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                        title="Elaborar nuevo ITS con auto-poblado de Geralsoft"
                      >
                        <span>➕</span> Elaborar ITS
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Selector Desplegable Clásico / Acceso Directo -->
          <div class="pt-2 border-t border-white/5 flex flex-wrap items-center gap-3">
            <div class="flex-1 min-w-[280px]">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Selector Directo de Cotización a Liquidar:
              </label>
              <select
                v-model="servicioSeleccionadoKey"
                @change="onSeleccionarServicio"
                class="w-full bg-[#050810] border border-blue-500/40 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-400 transition-all font-mono"
              >
                <option value="" disabled>-- Elige una Cotización del Selector Directo --</option>
                <option v-for="s in serviciosDisponiblesFiltrados" :key="s.key" :value="s.key">
                  {{ s.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-2 text-xs text-slate-400 font-mono">
          ℹ️ Sube las planillas de GeraldSoft arriba para auto-cargar los servicios, o pulsa
          <button @click="crearInformeEnBlanco" class="text-blue-400 hover:underline font-bold ml-1">
            Crear Informe en Blanco
          </button>
          para digitar manualmente.
        </div>
      </div>

      <!-- FORMULARIO OFICIAL EN 4 BLOQUES -->
      <div id="print-container" class="space-y-6">

        <!-- ================================================================= -->
        <!-- BLOQUE 1: DATOS DEL SERVICIO INTEGRAL                             -->
        <!-- ================================================================= -->
        <div class="bg-[#0f1629] p-5 rounded-2xl border border-white/10 shadow-xl space-y-4 print-section">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 font-mono font-black text-xs flex items-center justify-center">
                1
              </span>
              <h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Datos del Servicio Integral
              </h2>
            </div>
            <div class="flex items-center gap-3 flex-wrap font-mono text-xs">
              <div class="flex items-center gap-1 bg-[#050810] px-2.5 py-1 rounded-lg border border-white/10">
                <span class="text-slate-400">Folio:</span>
                <input
                  v-model="informe.folio_its"
                  type="text"
                  class="bg-transparent text-amber-300 font-bold outline-none w-24 text-right font-mono"
                  placeholder="ITS-0209"
                />
                <span class="text-slate-500 font-bold font-mono">-V</span>
                <input
                  v-model.number="informe.version"
                  type="number"
                  min="1"
                  class="bg-transparent text-amber-400 font-bold outline-none w-8 text-center font-mono"
                  placeholder="1"
                  title="Versión del ITS"
                />
              </div>
              <div class="flex items-center gap-1 bg-[#050810] px-2.5 py-1 rounded-lg border border-white/10">
                <span class="text-slate-400">Cotización:</span>
                <input
                  v-model="informe.numero_cotizacion"
                  type="text"
                  class="bg-transparent text-white font-bold outline-none w-20 text-right"
                  placeholder="#3259"
                />
              </div>
              <div class="flex items-center gap-1 bg-[#050810] px-2.5 py-1 rounded-lg border border-white/10">
                <span class="text-slate-400">Emisión:</span>
                <input
                  v-model="informe.fecha_emision"
                  type="date"
                  class="bg-transparent text-white font-bold outline-none [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <!-- Campos Cabecera -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Nombre Cliente
              </label>
              <input
                v-model="informe.cliente_nombre"
                type="text"
                class="w-full bg-[#050810] border border-white/10 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-blue-400"
                placeholder="Razón Social Cliente"
              />
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                RUT Cliente
              </label>
              <input
                v-model="informe.cliente_rut"
                type="text"
                class="w-full bg-[#050810] border border-white/10 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-400"
                placeholder="12.345.678-9"
              />
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Empresa Facturación
              </label>
              <select
                v-model="informe.empresa_facturacion"
                class="w-full bg-[#050810] border border-white/10 rounded-xl px-3 py-2 text-amber-300 font-bold outline-none focus:border-blue-400"
              >
                <option value="ARRIENDOS SAN PABLO SpA">ARRIENDOS SAN PABLO SpA</option>
                <option value="BESTMAQ">BESTMAQ</option>
                <option value="LOGÍSTICA DEL SUR">LOGÍSTICA DEL SUR</option>
                <option value="LUIS OMAR GHISELLINI JARA E.I.R.L.">LUIS OMAR GHISELLINI JARA E.I.R.L.</option>
                <option value="ROYAL RENTAL">ROYAL RENTAL</option>
              </select>
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Ejecutivo Comercial
              </label>
              <input
                v-model="informe.ejecutivo_comercial"
                type="text"
                class="w-full bg-[#050810] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-400"
                placeholder="Nombre Vendedor"
              />
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Ciudad de la Obra
              </label>
              <input
                v-model="informe.ciudad_obra"
                type="text"
                class="w-full bg-[#050810] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-400"
                placeholder="Comuna / Ciudad"
              />
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Régimen Operacional
              </label>
              <select
                v-model="informe.regimen_operacional"
                class="w-full bg-[#050810] border border-white/10 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-blue-400"
              >
                <option value="SERVICIO URBANO">SERVICIO URBANO (≤ 30 KM)</option>
                <option value="SERVICIO RURAL">SERVICIO RURAL (> 30 KM)</option>
              </select>
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tipo de Servicio
              </label>
              <input
                v-model="informe.tipo_servicio"
                type="text"
                class="w-full bg-[#050810] border border-white/10 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-blue-400"
                placeholder="HORA / FLETE / DIARIO / MENSUAL"
              />
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Fechas Faena ({{ informe.total_dias || 1 }} días)
              </label>
              <div class="grid grid-cols-2 gap-1.5">
                <input
                  v-model="informe.fecha_inicio"
                  type="date"
                  @change="recalcularDiasFaena"
                  class="bg-[#050810] border border-white/10 rounded-xl px-2 py-2 text-white font-mono text-xs outline-none [color-scheme:dark]"
                />
                <input
                  v-model="informe.fecha_termino"
                  type="date"
                  @change="recalcularDiasFaena"
                  class="bg-[#050810] border border-white/10 rounded-xl px-2 py-2 text-white font-mono text-xs outline-none [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <!-- Franja de Valores Fijos y Fletes -->
          <div class="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex items-center justify-between gap-3 bg-[#050810]/60 p-2.5 rounded-lg border border-amber-500/20">
              <span class="text-xs font-bold text-amber-300 uppercase tracking-wider">VALOR FIJO:</span>
              <div class="flex items-center gap-1">
                <span class="text-amber-400 font-mono font-bold">$</span>
                <input
                  v-model.number="informe.valor_fijo"
                  type="number"
                  class="bg-transparent text-white font-mono font-bold text-sm text-right outline-none w-32"
                  placeholder="0"
                />
              </div>
            </div>
            <div class="flex items-center justify-between gap-3 bg-[#050810]/60 p-2.5 rounded-lg border border-amber-500/20">
              <span class="text-xs font-bold text-amber-300 uppercase tracking-wider">VALOR FLETE / TRASLADO:</span>
              <div class="flex items-center gap-1">
                <span class="text-amber-400 font-mono font-bold">$</span>
                <input
                  v-model.number="informe.valor_flete"
                  type="number"
                  class="bg-transparent text-white font-mono font-bold text-sm text-right outline-none w-32"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <!-- Subtabla de Equipos Asignados -->
          <div class="pt-2">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Maquinarias y Equipos Asignados
              </h3>
              <button
                @click="agregarEquipoFila"
                class="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              >
                <span>➕</span> Agregar Equipo
              </button>
            </div>

            <div class="overflow-x-auto rounded-xl border border-white/10">
              <table class="w-full text-xs text-left">
                <thead class="bg-[#050810] text-[10px] uppercase font-mono text-slate-400 border-b border-white/10">
                  <tr>
                    <th class="p-2.5">Patente</th>
                    <th class="p-2.5">Subcategoría / Tonelaje</th>
                    <th class="p-2.5">Hrs Mínimas</th>
                    <th class="p-2.5">Tarifa ($/hr)</th>
                    <th class="p-2.5">OTs Asociadas</th>
                    <th class="p-2.5">Tripulación Asignada</th>
                    <th class="p-2.5 text-center w-12">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 font-mono">
                  <tr v-for="(eq, idx) in informe.equipos" :key="idx" class="hover:bg-white/5">
                    <td class="p-2">
                      <input v-model="eq.patente" type="text" class="w-24 bg-[#050810] border border-white/10 rounded px-2 py-1 text-white font-bold uppercase" placeholder="TLPK54" />
                    </td>
                    <td class="p-2">
                      <input v-model="eq.subcategoria" type="text" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-slate-200" placeholder="GRUA 75 TON" />
                    </td>
                    <td class="p-2">
                      <input v-model="eq.horas_minimas" type="text" class="w-28 bg-[#050810] border border-white/10 rounded px-2 py-1 text-slate-200" placeholder="11 HORAS DIARIAS" />
                    </td>
                    <td class="p-2">
                      <input v-model.number="eq.valor_hora" type="number" class="w-24 bg-[#050810] border border-white/10 rounded px-2 py-1 text-right text-emerald-400 font-bold" placeholder="85000" />
                    </td>
                    <td class="p-2">
                      <input v-model="eq.ots_asociadas" type="text" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-slate-300 text-[11px]" placeholder="OT 64717 (HORA)..." />
                    </td>
                    <td class="p-2">
                      <input v-model="eq.personal_tripulacion" type="text" class="w-full bg-[#050810] border border-white/10 rounded px-2 py-1 text-slate-300 text-[11px]" placeholder="Op: CLAUDIO GALLARDO..." />
                    </td>
                    <td class="p-2 text-center">
                      <button @click="eliminarEquipoFila(idx)" class="text-rose-400 hover:text-rose-300 p-1">🗑️</button>
                    </td>
                  </tr>
                  <tr v-if="informe.equipos.length === 0">
                    <td colspan="7" class="p-4 text-center text-slate-500 text-xs">
                      Sin equipos registrados. Pulsa "Agregar Equipo" o carga un archivo de GeraldSoft.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- BLOQUE 2: CONTROL DE FLOTA Y VALIDACIÓN DE HORAS (MULTI-DÍA)      -->
        <!-- ================================================================= -->
        <div class="bg-[#0f1629] p-5 rounded-2xl border border-white/10 shadow-xl space-y-4 print-section">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs flex items-center justify-center">
                2
              </span>
              <h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Control de Flota y Validación de Horas
              </h2>
            </div>
            <button
              @click="agregarJornadaFila"
              class="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1 font-mono"
            >
              <span>➕</span> Agregar Fila / Día
            </button>
          </div>

          <div class="overflow-x-auto rounded-xl border border-white/10">
            <table class="w-full text-xs text-left">
              <thead class="bg-[#050810] text-[10px] uppercase font-mono text-slate-400 border-b border-white/10">
                <tr>
                  <th class="p-2.5">Fecha</th>
                  <th class="p-2.5">N° OT</th>
                  <th class="p-2.5">Tipo Serv.</th>
                  <th class="p-2.5">Patente</th>
                  <th class="p-2.5">Salida</th>
                  <th class="p-2.5">Llegada</th>
                  <th class="p-2.5">Término</th>
                  <th class="p-2.5">Retorno</th>
                  <th class="p-2.5">Colación</th>
                  <th class="p-2.5">Hrs Reales</th>
                  <th class="p-2.5">Hrs Report</th>
                  <th class="p-2.5">N° Report</th>
                  <th class="p-2.5 text-center w-10"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 font-mono">
                <tr v-for="(j, idx) in informe.jornadas" :key="idx" class="hover:bg-white/5">
                  <td class="p-1.5">
                    <input v-model="j.fecha" type="date" class="bg-[#050810] border border-white/10 rounded px-1.5 py-1 text-white text-[11px] [color-scheme:dark]" />
                  </td>
                  <td class="p-1.5">
                    <input v-model="j.numero_ot" type="text" class="w-16 bg-[#050810] border border-white/10 rounded px-1.5 py-1 text-white text-[11px]" placeholder="64717" />
                  </td>
                  <td class="p-1.5">
                    <input
                      v-model="j.tipo_servicio"
                      list="tipos-servicio-jornada-list"
                      type="text"
                      class="w-32 bg-[#050810] border border-white/10 rounded px-1.5 py-1 text-slate-200 text-[11px] font-mono focus:border-blue-400 outline-none"
                      placeholder="Tipo Servicio"
                    />
                  </td>
                  <td class="p-1.5">
                    <input v-model="j.patente" type="text" class="w-20 bg-[#050810] border border-white/10 rounded px-1.5 py-1 text-white font-bold uppercase text-[11px]" placeholder="TYGC45" />
                  </td>
                  <td class="p-1.5">
                    <input v-model="j.hora_salida" @change="calcularHorasReales(j)" type="time" class="bg-[#050810] border border-white/10 rounded px-1 py-1 text-slate-300 text-[11px] [color-scheme:dark]" />
                  </td>
                  <td class="p-1.5">
                    <input v-model="j.hora_llegada" @change="calcularHorasReales(j)" type="time" class="bg-[#050810] border border-white/10 rounded px-1 py-1 text-slate-300 text-[11px] [color-scheme:dark]" />
                  </td>
                  <td class="p-1.5">
                    <input v-model="j.hora_termino" @change="calcularHorasReales(j)" type="time" class="bg-[#050810] border border-white/10 rounded px-1 py-1 text-slate-300 text-[11px] [color-scheme:dark]" />
                  </td>
                  <td class="p-1.5">
                    <input v-model="j.hora_retorno" @change="calcularHorasReales(j)" type="time" class="bg-[#050810] border border-white/10 rounded px-1 py-1 text-slate-300 text-[11px] [color-scheme:dark]" />
                  </td>
                  <td class="p-1.5">
                    <input v-model="j.colacion" @change="calcularHorasReales(j)" type="text" class="w-14 bg-[#050810] border border-white/10 rounded px-1 py-1 text-slate-300 text-[11px]" placeholder="01:00" />
                  </td>
                  <td class="p-1.5">
                    <input v-model="j.horas_reales_texto" type="text" class="w-16 bg-[#050810] border border-blue-500/40 rounded px-1.5 py-1 text-center text-blue-300 font-bold text-xs" placeholder="0h 0m" title="Horas Reales (Editable)" />
                  </td>
                  <td class="p-1.5">
                    <input v-model.number="j.horas_report" type="number" step="0.5" class="w-16 bg-[#050810] border border-emerald-500/40 rounded px-1.5 py-1 text-right text-emerald-400 font-black text-xs" title="Horas Report (Editable)" />
                  </td>
                  <td class="p-1.5">
                    <input v-model="j.numero_report" type="text" class="w-20 bg-[#050810] border border-white/10 rounded px-1.5 py-1 text-white text-[11px]" placeholder="135509" />
                  </td>
                  <td class="p-1.5 text-center">
                    <button @click="eliminarJornadaFila(idx)" class="text-rose-400 hover:text-rose-300">🗑️</button>
                  </td>
                </tr>
                <tr v-if="informe.jornadas.length === 0">
                  <td colspan="13" class="p-4 text-center text-slate-500 text-xs">
                    Sin jornadas ingresadas. Pulsa "Agregar Fila / Día" o selecciona un servicio pareado arriba.
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- Datalist para selección y edición de tipos de viaje / servicio -->
            <datalist id="tipos-servicio-jornada-list">
              <option value="Ida y Vuelta" />
              <option value="Solo Ida" />
              <option value="Solo Vuelta" />
              <option value="Flete Ida y Vuelta" />
              <option value="Flete Solo Ida" />
              <option value="Flete Solo Retorno" />
              <option value="Hora" />
              <option value="Fijo" />
              <option value="Standby" />
            </datalist>
          </div>

          <!-- Barra de Totales de Horas -->
          <div class="bg-[#050810] p-3 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div class="text-slate-400">
              Jornadas registradas: <strong class="text-white">{{ informe.jornadas.length }}</strong>
            </div>
            <div class="flex items-center gap-4">
              <div>
                <span class="text-slate-400">Subtotal Horas Report: </span>
                <span class="text-emerald-400 font-black text-sm">{{ formatHorasHHMM(totalHorasReportCalculadas) }} hrs</span>
              </div>
              <div class="border-l border-white/10 pl-4">
                <span class="text-slate-400">Ingreso Estimado Horas: </span>
                <span class="text-white font-black text-sm">${{ formatCLP(totalIngresoHorasCalculado) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- BLOQUE 3: PLANILLA DE COSTOS OPERACIONALES (8 CATEGORÍAS)         -->
        <!-- ================================================================= -->
        <div class="bg-[#0f1629] p-5 rounded-2xl border border-white/10 shadow-xl space-y-5 print-section">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 font-mono font-black text-xs flex items-center justify-center">
                3
              </span>
              <h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Planilla de Costos Operacionales a Pagar (Para Contabilidad)
              </h2>
            </div>
            <div class="text-xs font-mono font-bold text-purple-300">
              Total Costos: ${{ formatCLP(totalCostosOperacionalesCalculados) }}
            </div>
          </div>

          <!-- 1. Viáticos Alimentación Personal -->
          <div class="space-y-2 bg-[#050810]/50 p-3.5 rounded-xl border border-white/5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-200 uppercase tracking-wide font-mono">
                • 1. Viático Alimentación Personal
              </span>
              <div class="flex items-center gap-2">
                <span class="text-xs text-emerald-400 font-mono font-bold">${{ formatCLP(subtotalAlimentacion) }}</span>
                <button @click="agregarCostoFila('alimentacion')" class="text-xs text-blue-400 hover:underline font-bold">
                  + Agregar Fila
                </button>
              </div>
            </div>
            <div v-for="(c, idx) in costos.alimentacion" :key="idx" class="grid grid-cols-12 gap-2 text-xs font-mono items-center">
              <input v-model="c.fecha" type="date" class="col-span-3 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-white text-[11px] [color-scheme:dark]" />
              <input v-model="c.personal" type="text" class="col-span-4 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-white text-[11px]" placeholder="Nombre Personal" />
              <input v-model="c.concepto" type="text" class="col-span-3 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-slate-300 text-[11px]" placeholder="Alimentación Operador" />
              <input v-model.number="c.monto" type="number" class="col-span-1.5 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-right text-emerald-400 font-bold" placeholder="0" />
              <button @click="eliminarCostoFila('alimentacion', idx)" class="col-span-0.5 text-rose-400 text-center">✕</button>
            </div>
            <p v-if="costos.alimentacion.length === 0" class="text-[11px] text-slate-500 italic">
              Sin registros de gastos en este ítem ($0)
            </p>
          </div>

          <!-- 2. Peajes y TAG de Ruta -->
          <div class="space-y-2 bg-[#050810]/50 p-3.5 rounded-xl border border-white/5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-200 uppercase tracking-wide font-mono">
                • 2. Peajes y TAG de Ruta
              </span>
              <div class="flex items-center gap-2">
                <span class="text-xs text-emerald-400 font-mono font-bold">${{ formatCLP(subtotalPeajes) }}</span>
                <button @click="agregarCostoFila('peajes')" class="text-xs text-blue-400 hover:underline font-bold">
                  + Agregar Fila
                </button>
              </div>
            </div>
            <div v-for="(c, idx) in costos.peajes" :key="idx" class="grid grid-cols-12 gap-2 text-xs font-mono items-center">
              <input v-model="c.fecha" type="date" class="col-span-2 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-white text-[11px] [color-scheme:dark]" />
              <input v-model="c.patente" type="text" class="col-span-2 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-white text-[11px] uppercase" placeholder="Patente" />
              <input v-model="c.personal" type="text" class="col-span-3 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-white text-[11px]" placeholder="Conductor" />
              <input v-model="c.detalle" type="text" class="col-span-3 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-slate-300 text-[11px]" placeholder="Troncal Púa (o NO REEMBOLSAR)" />
              <div class="col-span-1.5 flex items-center gap-1">
                <input
                  v-model.number="c.monto"
                  type="number"
                  class="w-full bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-1 text-right text-emerald-400 font-bold text-xs"
                  placeholder="0"
                  title="Monto del Peaje (Costo Real)"
                />
                <button
                  type="button"
                  @click="c.es_no_reembolsar = !c.es_no_reembolsar"
                  class="px-1.5 py-1 rounded text-[9px] font-bold border transition-all shrink-0"
                  :class="c.es_no_reembolsar ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-white/5 text-slate-400 border-white/10'"
                  :title="c.es_no_reembolsar ? 'Gasto Empresa TAG (No reembolsar a conductor)' : 'Reembolsable a Conductor'"
                >
                  {{ c.es_no_reembolsar ? 'NR' : 'RE' }}
                </button>
              </div>
              <button @click="eliminarCostoFila('peajes', idx)" class="col-span-0.5 text-rose-400 text-center">✕</button>
            </div>
            <p v-if="costos.peajes.length === 0" class="text-[11px] text-slate-500 italic">
              Sin registros de gastos en este ítem ($0)
            </p>
          </div>

          <!-- 3. Pensiones y Alojamiento Faena -->
          <div class="space-y-2 bg-[#050810]/50 p-3.5 rounded-xl border border-white/5">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-200 uppercase tracking-wide font-mono">
                  • 3. Pensiones y Alojamiento Faena
                </span>
                <input
                  v-model="costos.pensiones_oc"
                  type="text"
                  placeholder="N° OC: 645-646"
                  class="bg-[#0a0f1e] border border-white/10 rounded px-2 py-0.5 text-[11px] text-amber-300 font-mono w-28"
                />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-emerald-400 font-mono font-bold">${{ formatCLP(subtotalPensiones) }}</span>
                <button @click="agregarCostoFila('pensiones')" class="text-xs text-blue-400 hover:underline font-bold">
                  + Agregar Fila
                </button>
              </div>
            </div>

            <!-- Cabecera de Columnas Pensiones y Alojamiento -->
            <div v-if="costos.pensiones.length > 0" class="grid grid-cols-12 gap-1.5 text-[10px] font-mono font-bold uppercase text-slate-400 border-b border-white/10 pb-1.5 px-1">
              <span class="col-span-2">Fecha</span>
              <span class="col-span-2">Personal</span>
              <span class="col-span-1.5 text-right">Desayuno</span>
              <span class="col-span-1.5 text-right">Almuerzo</span>
              <span class="col-span-1.5 text-right">Cena</span>
              <span class="col-span-1.5 text-right">Alojamiento</span>
              <span class="col-span-1.5 text-right">Total ($)</span>
              <span class="col-span-0.5 text-center"></span>
            </div>

            <div v-for="(c, idx) in costos.pensiones" :key="idx" class="grid grid-cols-12 gap-1.5 text-xs font-mono items-center">
              <input v-model="c.fecha" type="date" class="col-span-2 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-1 text-white text-[10px] [color-scheme:dark]" />
              <input v-model="c.personal" type="text" class="col-span-2 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-1 text-white text-[11px]" placeholder="Personal" />
              <input v-model.number="c.desayuno" type="number" class="col-span-1.5 bg-[#0a0f1e] border border-white/10 rounded px-1 py-1 text-right text-slate-200 text-[11px]" placeholder="Desay." />
              <input v-model.number="c.almuerzo" type="number" class="col-span-1.5 bg-[#0a0f1e] border border-white/10 rounded px-1 py-1 text-right text-slate-200 text-[11px]" placeholder="Alm." />
              <input v-model.number="c.cena" type="number" class="col-span-1.5 bg-[#0a0f1e] border border-white/10 rounded px-1 py-1 text-right text-slate-200 text-[11px]" placeholder="Cena" />
              <input v-model.number="c.alojamiento" type="number" class="col-span-1.5 bg-[#0a0f1e] border border-white/10 rounded px-1 py-1 text-right text-slate-200 text-[11px]" placeholder="Aloj." />
              <div class="col-span-1.5 text-right text-emerald-400 font-bold text-xs truncate">
                ${{ formatCLP((c.desayuno || 0) + (c.almuerzo || 0) + (c.cena || 0) + (c.alojamiento || 0) + (c.traslado || 0)) }}
              </div>
              <button @click="eliminarCostoFila('pensiones', idx)" class="col-span-0.5 text-rose-400 text-center">✕</button>
            </div>
            <p v-if="costos.pensiones.length === 0" class="text-[11px] text-slate-500 italic">
              Sin registros de gastos en este ítem ($0)
            </p>
          </div>

          <!-- Otras Categorías en acordeón o bloques compactos -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <!-- 4. Movilización -->
            <div class="bg-[#050810]/50 p-3 rounded-xl border border-white/5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold font-mono text-slate-300">• 4. Movilización Personal</span>
                <button @click="agregarCostoFila('movilizacion')" class="text-blue-400 hover:underline font-bold">+ Fila</button>
              </div>
              <div v-for="(c, idx) in costos.movilizacion" :key="idx" class="grid grid-cols-12 gap-1 font-mono items-center">
                <input v-model="c.personal" type="text" class="col-span-5 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-0.5 text-[11px]" placeholder="Personal" />
                <input v-model="c.detalle" type="text" class="col-span-4 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-0.5 text-[11px]" placeholder="Pasajes/Uber" />
                <input v-model.number="c.monto" type="number" class="col-span-2.5 bg-[#0a0f1e] border border-white/10 rounded px-1 py-0.5 text-right text-emerald-400" placeholder="0" />
                <button @click="eliminarCostoFila('movilizacion', idx)" class="col-span-0.5 text-rose-400">✕</button>
              </div>
              <p v-if="costos.movilizacion.length === 0" class="text-[10px] text-slate-500 italic">Total: $0</p>
            </div>

            <!-- 5. Personal Externo -->
            <div class="bg-[#050810]/50 p-3 rounded-xl border border-white/5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold font-mono text-slate-300">• 5. Personal Ext. / Riggers</span>
                <button @click="agregarCostoFila('personal_externo')" class="text-blue-400 hover:underline font-bold">+ Fila</button>
              </div>
              <div v-for="(c, idx) in costos.personal_externo" :key="idx" class="grid grid-cols-12 gap-1 font-mono items-center">
                <input v-model="c.personal" type="text" class="col-span-5 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-0.5 text-[11px]" placeholder="Personal Externo" />
                <input v-model="c.detalle" type="text" class="col-span-4 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-0.5 text-[11px]" placeholder="Rigger Apoyo" />
                <input v-model.number="c.monto" type="number" class="col-span-2.5 bg-[#0a0f1e] border border-white/10 rounded px-1 py-0.5 text-right text-emerald-400" placeholder="0" />
                <button @click="eliminarCostoFila('personal_externo', idx)" class="col-span-0.5 text-rose-400">✕</button>
              </div>
              <p v-if="costos.personal_externo.length === 0" class="text-[10px] text-slate-500 italic">Total: $0</p>
            </div>

            <!-- 6. Feriados y Bonos -->
            <div class="bg-[#050810]/50 p-3 rounded-xl border border-white/5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold font-mono text-slate-300">• 6. Feriados y Bonos</span>
                <button @click="agregarCostoFila('feriados')" class="text-blue-400 hover:underline font-bold">+ Fila</button>
              </div>
              <div v-for="(c, idx) in costos.feriados" :key="idx" class="grid grid-cols-12 gap-1 font-mono items-center">
                <input v-model="c.personal" type="text" class="col-span-5 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-0.5 text-[11px]" placeholder="Personal" />
                <input v-model="c.detalle" type="text" class="col-span-4 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-0.5 text-[11px]" placeholder="Recargo Festivo" />
                <input v-model.number="c.monto" type="number" class="col-span-2.5 bg-[#0a0f1e] border border-white/10 rounded px-1 py-0.5 text-right text-emerald-400" placeholder="0" />
                <button @click="eliminarCostoFila('feriados', idx)" class="col-span-0.5 text-rose-400">✕</button>
              </div>
              <p v-if="costos.feriados.length === 0" class="text-[10px] text-slate-500 italic">Total: $0</p>
            </div>

            <!-- 7. Subcontrato Flete -->
            <div class="bg-[#050810]/50 p-3 rounded-xl border border-white/5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold font-mono text-slate-300">• 7. Subcontrato Flete Externo</span>
                <button @click="agregarCostoFila('subcontrato_flete')" class="text-blue-400 hover:underline font-bold">+ Fila</button>
              </div>
              <div v-for="(c, idx) in costos.subcontrato_flete" :key="idx" class="grid grid-cols-12 gap-1 font-mono items-center">
                <input v-model="c.detalle" type="text" class="col-span-5 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-0.5 text-[11px]" placeholder="Traslado Contrapesos" />
                <input v-model="c.numero_oc" type="text" class="col-span-4 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-0.5 text-[11px]" placeholder="N° OC: 6338" />
                <input v-model.number="c.monto" type="number" class="col-span-2.5 bg-[#0a0f1e] border border-white/10 rounded px-1 py-0.5 text-right text-emerald-400" placeholder="0" />
                <button @click="eliminarCostoFila('subcontrato_flete', idx)" class="col-span-0.5 text-rose-400">✕</button>
              </div>
              <p v-if="costos.subcontrato_flete.length === 0" class="text-[10px] text-slate-500 italic">Total: $0</p>
            </div>
          </div>

          <!-- 8. Gastos Extraordinarios -->
          <div class="space-y-2 bg-[#050810]/50 p-3.5 rounded-xl border border-white/5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-200 uppercase tracking-wide font-mono">
                • 8. Gastos Extraordinarios (Vulcanización / Faena)
              </span>
              <div class="flex items-center gap-2">
                <span class="text-xs text-emerald-400 font-mono font-bold">${{ formatCLP(subtotalGastosExtraordinarios) }}</span>
                <button @click="agregarCostoFila('gastos_extra')" class="text-xs text-blue-400 hover:underline font-bold">
                  + Agregar Fila
                </button>
              </div>
            </div>
            <div v-for="(c, idx) in costos.gastos_extra" :key="idx" class="grid grid-cols-12 gap-2 text-xs font-mono items-center">
              <input v-model="c.fecha" type="date" class="col-span-3 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-white text-[11px] [color-scheme:dark]" />
              <input v-model="c.detalle" type="text" class="col-span-6 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-white text-[11px]" placeholder="Vulcanización / Repuesto Faena" />
              <input v-model.number="c.monto" type="number" class="col-span-2.5 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-right text-emerald-400 font-bold" placeholder="0" />
              <button @click="eliminarCostoFila('gastos_extra', idx)" class="col-span-0.5 text-rose-400 text-center">✕</button>
            </div>
            <p v-if="costos.gastos_extra.length === 0" class="text-[11px] text-slate-500 italic">
              Sin registros de gastos en este ítem ($0)
            </p>
          </div>

          <!-- Costo Mano de Obra Operador (Automático desde Horas) -->
          <div class="space-y-2 bg-blue-500/5 p-3.5 rounded-xl border border-blue-500/20">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-blue-300 uppercase tracking-wide font-mono">
                • Costo Valor Hora Operador (Mano de Obra por Máquina)
              </span>
              <span class="text-xs text-blue-300 font-mono font-bold">
                Total: ${{ formatCLP(subtotalManoDeObraOperadores) }}
              </span>
            </div>
            <div class="overflow-x-auto rounded-lg border border-white/10">
              <table class="w-full text-xs font-mono">
                <thead class="bg-[#050810] text-[10px] text-slate-400 border-b border-white/10">
                  <tr>
                    <th class="p-2">Equipo / Patente</th>
                    <th class="p-2">Categoría Maestra</th>
                    <th class="p-2 text-right">Valor Hora Op. ($)</th>
                    <th class="p-2 text-right">Horas Report</th>
                    <th class="p-2 text-right">Total Costo ($)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr v-for="(op, idx) in manoObraCalculada" :key="idx">
                    <td class="p-2 font-bold text-white">{{ op.patente }}</td>
                    <td class="p-2">
                      <select
                        :value="op.categoria"
                        @change="onCambiarCategoriaOperador(op.patente, $event)"
                        class="bg-[#0a0f1e] border border-white/15 focus:border-blue-400 rounded px-2 py-1 text-slate-200 text-xs font-mono font-bold outline-none max-w-[220px]"
                      >
                        <option value="">-- Seleccionar Categoría --</option>
                        <option
                          v-for="cat in CATALOGO_TARIFAS_OPERADOR"
                          :key="cat.id"
                          :value="cat.nombre"
                        >
                          {{ cat.nombre }} (${{ formatCLP(cat.valor_hora) }}/hr)
                        </option>
                      </select>
                    </td>
                    <td class="p-2 text-right">
                      <input
                        v-model.number="costos.tarifas_operadores_override[op.patente]"
                        type="number"
                        class="w-20 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-0.5 text-right text-emerald-400 font-bold"
                        :placeholder="op.valor_hora"
                      />
                    </td>
                    <td class="p-2 text-right">
                      <input
                        v-model.number="costos.horas_operadores_override[op.patente]"
                        type="number"
                        step="0.5"
                        class="w-16 bg-[#0a0f1e] border border-blue-500/40 rounded px-1.5 py-0.5 text-right text-blue-300 font-bold"
                        :placeholder="op.horasBase.toFixed(1)"
                        title="Horas Operador (Editable)"
                      />
                    </td>
                    <td class="p-2 text-right text-white font-bold">${{ formatCLP(op.valor_hora * op.horas) }}</td>
                  </tr>
                  <tr v-if="manoObraCalculada.length === 0">
                    <td colspan="5" class="p-3 text-center text-slate-500 italic">
                      Se calculará automáticamente cuando existan equipos con horas en la Sección 2.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Subtabla Horas de Traslado Operacional -->
            <div class="pt-2 border-t border-white/10 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  🚚 Horas de Traslado / Conducción Adicional
                </span>
                <button
                  type="button"
                  @click="agregarFilaTraslado"
                  class="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                >
                  <span>➕</span> Agregar Fila de Traslado
                </button>
              </div>

              <div v-for="(tr, trIdx) in costos.horas_traslado" :key="trIdx" class="grid grid-cols-12 gap-1.5 items-center">
                <input
                  v-model="tr.concepto"
                  list="conceptos-traslado-list"
                  type="text"
                  placeholder="Concepto (ej: Chofer Cama Baja - Ida y Vuelta)"
                  class="col-span-4 bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-white text-[11px]"
                />
                <input
                  v-model="tr.patente"
                  type="text"
                  placeholder="Patente / Máquina"
                  class="col-span-2 bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-1 text-white uppercase text-[11px]"
                />
                <div class="col-span-2 flex items-center gap-1">
                  <input
                    v-model.number="tr.horas"
                    type="number"
                    step="0.5"
                    placeholder="Horas"
                    class="w-full bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-1 text-right text-blue-300 font-bold text-[11px]"
                  />
                  <span class="text-[10px] text-slate-400">hrs</span>
                </div>
                <div class="col-span-2 flex items-center gap-1">
                  <input
                    v-model.number="tr.valor_hora"
                    type="number"
                    placeholder="Tarifa/hr"
                    class="w-full bg-[#0a0f1e] border border-white/10 rounded px-1.5 py-1 text-right text-emerald-400 font-bold text-[11px]"
                  />
                </div>
                <div class="col-span-1.5 text-right font-bold text-white text-[11px]">
                  ${{ formatCLP((tr.horas || 0) * (tr.valor_hora || 0)) }}
                </div>
                <button
                  type="button"
                  @click="eliminarFilaTraslado(trIdx)"
                  class="col-span-0.5 text-rose-400 hover:text-rose-300 text-center"
                >
                  ✕
                </button>
              </div>
              <datalist id="conceptos-traslado-list">
                <option value="Chofer Cama Baja (Ida y Vuelta)" />
                <option value="Chofer Cama Baja (Solo Ida)" />
                <option value="Chofer Cama Baja (Solo Vuelta)" />
                <option value="Tracto Contrapesos (Ida y Vuelta)" />
                <option value="Tracto Contrapesos (Solo Ida)" />
                <option value="Tracto Contrapesos (Solo Vuelta)" />
                <option value="Traslado Ida y Vuelta" />
                <option value="Traslado Solo Ida" />
                <option value="Traslado Solo Vuelta" />
              </datalist>
            </div>
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- BLOQUE 4: BALANCE DEL SERVICIO Y OBSERVACIONES                     -->
        <!-- ================================================================= -->
        <div class="bg-[#0f1629] p-5 rounded-2xl border border-white/10 shadow-xl space-y-5 print-section">
          <div class="flex items-center gap-3 border-b border-white/10 pb-3">
            <span class="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-mono font-black text-xs flex items-center justify-center">
              4
            </span>
            <h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Resultado del Servicio y Observaciones
            </h2>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <!-- Columna Izquierda: Balance Financiero (Oculta exclusivamente para el perfil SECRETARIA - REQ-1122) -->
            <div v-if="rolActivo !== 'SECRETARIA'" class="lg:col-span-6 space-y-4 font-mono text-xs">
              <!-- A. Resumen de Ingresos Totales -->
              <div class="bg-[#050810] p-3.5 rounded-xl border border-white/10 space-y-1.5">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  A. Resumen de Ingresos Totales (Venta)
                </p>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300">1. Ingresos Horas Trabajadas:</span>
                  <span class="text-white font-bold">${{ formatCLP(totalIngresoHorasCalculado) }} ({{ getPorcentajeSobreVenta(totalIngresoHorasCalculado) }}%)</span>
                </div>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300">2. Ingreso por Servicio Fijo:</span>
                  <span class="text-white font-bold">${{ formatCLP(informe.valor_fijo || 0) }} ({{ getPorcentajeSobreVenta(informe.valor_fijo || 0) }}%)</span>
                </div>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300">3. Ingreso Fletes / Traslados:</span>
                  <span class="text-white font-bold">${{ formatCLP(informe.valor_flete || 0) }} ({{ getPorcentajeSobreVenta(informe.valor_flete || 0) }}%)</span>
                </div>
                <div class="border-t border-white/10 pt-1.5 flex justify-between font-bold text-emerald-400 text-sm">
                  <span>TOTAL INGRESOS FACTURABLES:</span>
                  <span>${{ formatCLP(totalVentaCalculada) }} (100%)</span>
                </div>
              </div>

              <!-- B. Resumen de Costos Operacionales -->
              <div class="bg-[#050810] p-3.5 rounded-xl border border-white/10 space-y-1.5">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  B. Resumen de Costos Operacionales (Egresos)
                </p>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300">1. Viáticos Alimentación:</span>
                  <span>${{ formatCLP(subtotalAlimentacion) }} ({{ getPorcentajeSobreVenta(subtotalAlimentacion) }}%)</span>
                </div>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300">2. Peajes y Tag:</span>
                  <span>${{ formatCLP(subtotalPeajes) }} ({{ getPorcentajeSobreVenta(subtotalPeajes) }}%)</span>
                </div>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300">3. Pensiones y Alojamiento:</span>
                  <span>${{ formatCLP(subtotalPensiones) }} ({{ getPorcentajeSobreVenta(subtotalPensiones) }}%)</span>
                </div>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300">4. Movilización Personal:</span>
                  <span>${{ formatCLP(subtotalMovilizacion) }} ({{ getPorcentajeSobreVenta(subtotalMovilizacion) }}%)</span>
                </div>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300">5. Personal Ext. y Feriados:</span>
                  <span>${{ formatCLP(subtotalPersonalExt + subtotalFeriados) }} ({{ getPorcentajeSobreVenta(subtotalPersonalExt + subtotalFeriados) }}%)</span>
                </div>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300">6. Subcontratación Flete:</span>
                  <span>${{ formatCLP(subtotalSubcontratoFlete) }} ({{ getPorcentajeSobreVenta(subtotalSubcontratoFlete) }}%)</span>
                </div>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300">7. Gastos Extraordinarios:</span>
                  <span>${{ formatCLP(subtotalGastosExtraordinarios) }} ({{ getPorcentajeSobreVenta(subtotalGastosExtraordinarios) }}%)</span>
                </div>
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300">8. Costo Valor Hora Operador:</span>
                  <span>${{ formatCLP(subtotalManoDeObraOperadores) }} ({{ getPorcentajeSobreVenta(subtotalManoDeObraOperadores) }}%)</span>
                </div>
                <div class="border-t border-white/10 pt-1.5 flex justify-between font-bold text-amber-300 text-sm">
                  <span>TOTAL COSTOS OPERACIONALES:</span>
                  <span>${{ formatCLP(totalCostosOperacionalesCalculados) }} ({{ getPorcentajeSobreVenta(totalCostosOperacionalesCalculados) }}%)</span>
                </div>
              </div>

              <!-- Banner de Utilidad y Margen -->
              <div
                class="p-4 rounded-xl border flex items-center justify-between"
                :class="utilidadBrutaCalculada >= 0 ? 'bg-emerald-950/80 border-emerald-600 text-emerald-100' : 'bg-rose-950/80 border-rose-600 text-rose-100'"
              >
                <div>
                  <p class="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    Resultado del Servicio (Margen Neto)
                  </p>
                  <p class="text-xl font-black font-mono">
                    ${{ formatCLP(utilidadBrutaCalculada) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-black font-mono">
                    {{ margenPorcentajeCalculado }}%
                  </p>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border inline-block mt-0.5"
                    :class="utilidadBrutaCalculada >= 0 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-rose-500/20 border-rose-400 text-rose-200'"
                  >
                    {{ utilidadBrutaCalculada >= 0 ? 'Rentable' : 'Alerta Pérdida' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Observaciones Blindadas y Firmas -->
            <div :class="rolActivo === 'SECRETARIA' ? 'lg:col-span-12 space-y-4' : 'lg:col-span-6 space-y-4'">
              <div class="bg-[#050810] p-4 rounded-xl border border-white/10 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>🛡️</span> Observación del Servicio (Inmutable)
                  </label>
                  <span class="text-[10px] text-emerald-400 font-mono">
                    ✓ Autoguardado activo
                  </span>
                </div>
                <textarea
                  v-model="informe.observaciones_servicio"
                  @input="autoguardarObservaciones"
                  rows="9"
                  class="w-full bg-[#0a0f1e] border border-white/15 rounded-xl p-3 text-xs text-white leading-relaxed outline-none focus:border-blue-400 font-mono resize-y"
                  placeholder="Detalla aquí la crónica del servicio, acuerdos de almuerzo provisto por cliente, traslados de contrapesos, notas de peajes sin comprobante, etc. Este texto NUNCA se borrará."
                ></textarea>
                <p class="text-[10px] text-slate-500 italic">
                  Las observaciones quedan respaldadas en memoria continua y no se pierden al recargar o guardar.
                </p>
              </div>

              <!-- Sellos Dinámicos FES (Gobernanza Tripartita Spec 67) -->
              <div class="bg-[#050810] p-4 rounded-xl border border-white/10 space-y-3 text-xs font-mono">
                <div class="flex items-center justify-between border-b border-white/10 pb-2">
                  <p class="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔏</span> Sellos Oficiales de Firma Electrónica Simple (FES)
                  </p>
                  <span :class="badgeColorEstado(informe.estado)" class="px-2 py-0.5 rounded text-[10px] font-black border uppercase">
                    {{ informe.estado || 'BORRADOR' }}
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <!-- Sello 1: Elaboró (Secretaria / Analista) -->
                  <div
                    class="p-2.5 rounded-lg border flex flex-col justify-between transition-all"
                    :class="informe.firmas_fes?.elaborador ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/30 border-dashed border-white/10'"
                  >
                    <div>
                      <div class="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span class="text-slate-400 uppercase">1. Elaborado Por</span>
                        <span v-if="informe.firmas_fes?.elaborador" class="text-emerald-400">✓ FES</span>
                        <span v-else class="text-slate-500">⏳ Pendiente</span>
                      </div>
                      <div v-if="informe.firmas_fes?.elaborador" class="space-y-0.5">
                        <p class="font-bold text-white text-[11px] leading-tight">{{ informe.firmas_fes.elaborador.nombre }}</p>
                        <p class="text-[9px] text-slate-400">{{ informe.firmas_fes.elaborador.cargo }}</p>
                        <p class="text-[8px] text-blue-300 font-mono font-bold">{{ informe.firmas_fes.elaborador.codigo_fes }}</p>
                        <p class="text-[8px] text-slate-500">{{ formatDateCL(informe.firmas_fes.elaborador.timestamp) }}</p>
                      </div>
                      <div v-else class="text-[10px] text-slate-500 italic py-2 text-center">
                        Secretaria o Analista
                      </div>
                    </div>
                  </div>

                  <!-- Sello 2: Verificó (Administrador) -->
                  <div
                    class="p-2.5 rounded-lg border flex flex-col justify-between transition-all"
                    :class="informe.firmas_fes?.verificador ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/30 border-dashed border-white/10'"
                  >
                    <div>
                      <div class="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span class="text-slate-400 uppercase">2. Verificado Por</span>
                        <span v-if="informe.firmas_fes?.verificador" class="text-emerald-400">✓ FES</span>
                        <span v-else class="text-slate-500">⏳ Pendiente</span>
                      </div>
                      <div v-if="informe.firmas_fes?.verificador" class="space-y-0.5">
                        <p class="font-bold text-white text-[11px] leading-tight">{{ informe.firmas_fes.verificador.nombre }}</p>
                        <p class="text-[9px] text-slate-400">{{ informe.firmas_fes.verificador.cargo }}</p>
                        <p class="text-[8px] text-blue-300 font-mono font-bold">{{ informe.firmas_fes.verificador.codigo_fes }}</p>
                        <p class="text-[8px] text-slate-500">{{ formatDateCL(informe.firmas_fes.verificador.timestamp) }}</p>
                      </div>
                      <div v-else class="text-[10px] text-slate-500 italic py-2 text-center">
                        Rol Administrador
                      </div>
                    </div>
                  </div>

                  <!-- Sello 3: Aprobó (Contabilidad) -->
                  <div
                    class="p-2.5 rounded-lg border flex flex-col justify-between transition-all"
                    :class="informe.firmas_fes?.aprobador ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/30 border-dashed border-white/10'"
                  >
                    <div>
                      <div class="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span class="text-slate-400 uppercase">3. Aprobado Por</span>
                        <span v-if="informe.firmas_fes?.aprobador" class="text-emerald-400">✓ FES</span>
                        <span v-else class="text-slate-500">⏳ Pendiente</span>
                      </div>
                      <div v-if="informe.firmas_fes?.aprobador" class="space-y-0.5">
                        <p class="font-bold text-white text-[11px] leading-tight">{{ informe.firmas_fes.aprobador.nombre }}</p>
                        <p class="text-[9px] text-slate-400">{{ informe.firmas_fes.aprobador.cargo }}</p>
                        <p class="text-[8px] text-blue-300 font-mono font-bold">{{ informe.firmas_fes.aprobador.codigo_fes }}</p>
                        <p class="text-[8px] text-slate-500">{{ formatDateCL(informe.firmas_fes.aprobador.timestamp) }}</p>
                      </div>
                      <div v-else class="text-[10px] text-slate-500 italic py-2 text-center">
                        Contabilidad y Finanzas
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Resumen de Devoluciones si existen -->
                <div v-if="informe.historial_observaciones && informe.historial_observaciones.length > 0" class="pt-2 border-t border-white/10">
                  <p class="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>⚠️</span> Historial de Devoluciones Resueltas ({{ informe.historial_observaciones.length }}):
                  </p>
                  <div class="space-y-1 max-h-24 overflow-y-auto pr-1">
                    <div
                      v-for="(obs, idx) in informe.historial_observaciones"
                      :key="idx"
                      class="text-[9px] bg-black/40 p-1.5 rounded border border-white/5 text-slate-300"
                    >
                      <strong class="text-amber-300">{{ obs.nombre_usuario || obs.rol }}:</strong>
                      <span class="italic"> "{{ obs.observaciones }}"</span>
                      <span class="text-slate-500 ml-1">({{ formatDateCL(obs.fecha) }})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- BARRA DE ACCIONES INFERIOR DINÁMICA SEGÚN ROL Y ESTADO -->
          <div class="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 font-mono">
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400">Estado Actual:</span>
              <span :class="badgeColorEstado(informe.estado)" class="px-2.5 py-1 rounded-lg text-xs font-black border uppercase">
                {{ informe.estado || 'BORRADOR' }}
              </span>
            </div>

            <div class="flex items-center gap-2.5 flex-wrap">
              <!-- CASO APROBADO: Informe cerrado -->
              <template v-if="informe.estado === 'APROBADO'">
                <button
                  @click="() => abrirVentanaImpresionOficial()"
                  class="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <span>📄</span> Ver PDF Oficial
                </button>
                <button
                  @click="compartirPorWhatsApp(informe)"
                  class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <span>📲</span> Notificar WhatsApp
                </button>
              </template>

              <!-- CASO PENDIENTE DE VERIFICACIÓN (ADMINISTRADOR) -->
              <template v-else-if="informe.estado === 'PENDIENTE_VERIFICACION'">
                <button
                  @click="guardarBorradorLocal"
                  :disabled="procesandoAccion"
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>💾</span> Guardar Cambios
                </button>
                <button
                  v-if="rolActivo === 'ADMINISTRADOR'"
                  @click="() => abrirModalDevolucion()"
                  :disabled="procesandoAccion"
                  class="px-4 py-2 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <span>⚠️</span> Devolver con Observaciones
                </button>
                <button
                  v-if="rolActivo === 'ADMINISTRADOR'"
                  @click="() => abrirModalFes('VERIFICADOR')"
                  :disabled="procesandoAccion"
                  class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  <span v-if="procesandoAccion" class="animate-spin">⏳</span>
                  <span v-else>✅</span>
                  <span>Validar FES y Enviar a Contabilidad</span>
                </button>
                <button
                  v-else
                  @click="() => abrirVentanaImpresionOficial()"
                  class="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs cursor-pointer"
                >
                  <span>👁️</span> Previsualizar
                </button>
              </template>

              <!-- CASO PENDIENTE DE CONTABILIDAD (CONTABILIDAD O ADMIN) -->
              <template v-else-if="informe.estado === 'PENDIENTE_CONTABILIDAD'">
                <button
                  @click="guardarBorradorLocal"
                  :disabled="procesandoAccion"
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>💾</span> Guardar Cambios
                </button>
                <button
                  v-if="rolActivo === 'CONTABILIDAD' || rolActivo === 'ADMINISTRADOR'"
                  @click="() => abrirModalDevolucion()"
                  :disabled="procesandoAccion"
                  class="px-4 py-2 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <span>⚠️</span> Devolver al Elaborador
                </button>
                <button
                  v-if="rolActivo === 'CONTABILIDAD' || rolActivo === 'ADMINISTRADOR'"
                  @click="() => abrirModalFes('APROBADOR')"
                  :disabled="procesandoAccion"
                  class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  <span v-if="procesandoAccion" class="animate-spin">⏳</span>
                  <span v-else>🏆</span>
                  <span>Aprobar Definitivo con FES</span>
                </button>
              </template>

              <!-- CASO BORRADOR U OBSERVADO (SECRETARIA / ANALISTA) -->
              <template v-else>
                <button
                  @click="() => abrirVentanaImpresionOficial()"
                  type="button"
                  class="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-500/40 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>👁️</span> Ver Informe PDF
                </button>
                <button
                  @click="guardarBorradorLocal"
                  :disabled="procesandoAccion"
                  class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <span>💾</span> Guardar Borrador
                </button>
                <button
                  @click="() => abrirModalFes('ELABORADOR')"
                  :disabled="procesandoAccion"
                  class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  <span v-if="procesandoAccion" class="animate-spin">⏳</span>
                  <span v-else>✍️</span>
                  <span>Firmar FES y Enviar a Verificación</span>
                </button>
              </template>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- PESTAÑA 2: CONTROL Y ESTADOS                                              -->
    <!-- ========================================================================= -->
    <div v-show="tabActivo === 'control'" class="space-y-6">

      <!-- TARJETAS DE MÉTRICAS GLOBALES DEL PERÍODO -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-[#0f1629] p-4 rounded-xl border border-white/10 text-center font-mono">
          <p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Informes</p>
          <p class="text-2xl font-black text-white mt-1">{{ informesHistorial.length }}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">En registro local y BD</p>
        </div>
        <div class="bg-[#0f1629] p-4 rounded-xl border border-white/10 text-center font-mono">
          <p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Facturación Devengada</p>
          <p class="text-xl font-black text-emerald-400 mt-1">${{ formatCLP(kpisControl.totalVenta) }}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">Total Venta Neta</p>
        </div>
        <div class="bg-[#0f1629] p-4 rounded-xl border border-white/10 text-center font-mono">
          <p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Costos Operacionales</p>
          <p class="text-xl font-black text-amber-300 mt-1">${{ formatCLP(kpisControl.totalCostos) }}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">{{ kpisControl.pctCostos }}% sobre venta</p>
        </div>
        <div class="bg-[#0f1629] p-4 rounded-xl border border-white/10 text-center font-mono">
          <p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Margen Ponderado</p>
          <p class="text-2xl font-black text-emerald-300 mt-1">{{ kpisControl.margenPonderado }}%</p>
          <p class="text-[10px] text-emerald-400 mt-0.5">Rentabilidad Neta</p>
        </div>
      </div>

      <!-- EMBUDO DE ESTADOS (FILTRO RÁPIDO SEGÚN SPEC 67) -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono flex-wrap">
        <button
          @click="filtroEstado = 'TODOS'"
          class="px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer"
          :class="filtroEstado === 'TODOS' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-[#0f1629] text-slate-400 border-white/10 hover:text-white'"
        >
          Todos ({{ informesHistorial.length }})
        </button>
        <button
          @click="filtroEstado = 'BORRADOR'"
          class="px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer"
          :class="filtroEstado === 'BORRADOR' ? 'bg-amber-600 text-white border-amber-500 shadow-md' : 'bg-[#0f1629] text-slate-400 border-white/10 hover:text-white'"
        >
          🟡 Borradores ({{ contarPorEstado('BORRADOR') }})
        </button>
        <button
          @click="filtroEstado = 'PENDIENTE_VERIFICACION'"
          class="px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer"
          :class="filtroEstado === 'PENDIENTE_VERIFICACION' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-[#0f1629] text-slate-400 border-white/10 hover:text-white'"
        >
          ⏳ Pend. Verificación ({{ contarPorEstado('PENDIENTE_VERIFICACION') }})
        </button>
        <button
          @click="filtroEstado = 'OBSERVADO'"
          class="px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer"
          :class="filtroEstado === 'OBSERVADO' ? 'bg-rose-600 text-white border-rose-500 shadow-md' : 'bg-[#0f1629] text-slate-400 border-white/10 hover:text-white'"
        >
          ⚠️ Observados ({{ contarPorObservados() }})
        </button>
        <button
          @click="filtroEstado = 'PENDIENTE_CONTABILIDAD'"
          class="px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer"
          :class="filtroEstado === 'PENDIENTE_CONTABILIDAD' ? 'bg-purple-600 text-white border-purple-500 shadow-md' : 'bg-[#0f1629] text-slate-400 border-white/10 hover:text-white'"
        >
          💰 Pend. Contabilidad ({{ contarPorEstado('PENDIENTE_CONTABILIDAD') }})
        </button>
        <button
          @click="filtroEstado = 'APROBADO'"
          class="px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer"
          :class="filtroEstado === 'APROBADO' ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'bg-[#0f1629] text-slate-400 border-white/10 hover:text-white'"
        >
          🟢 Aprobados ({{ contarPorEstado('APROBADO') }})
        </button>
      </div>

      <!-- BANDEJA HISTÓRICA DE INFORMES GENERADOS -->
      <div class="bg-[#0f1629] p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <span>📋</span> Bandeja Histórica de Informes
          </h3>
          <span class="text-xs text-slate-400 font-mono">
            {{ informesFiltrados.length }} informes listados
          </span>
        </div>

        <div class="overflow-x-auto rounded-xl border border-white/10">
          <table class="w-full text-xs text-left font-mono">
            <thead class="bg-[#050810] text-[10px] uppercase text-slate-400 border-b border-white/10">
              <tr>
                <th class="p-3">Folio</th>
                <th class="p-3">Cotización</th>
                <th class="p-3">Cliente</th>
                <th class="p-3">Fechas</th>
                <th class="p-3">Carpeta Gestor Docs</th>
                <th class="p-3 text-right">Venta</th>
                <th class="p-3 text-right">Costos</th>
                <th class="p-3 text-right">Margen</th>
                <th class="p-3 text-center">Estado</th>
                <th class="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="inf in informesFiltrados" :key="inf.id_transicion || (inf.folio_its + '-V' + (inf.version || 1))" class="hover:bg-white/5">
                <td class="p-3 font-bold text-amber-300 font-mono">
                  {{ inf.folio_its }}
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 ml-1">
                    V{{ inf.version || 1 }}
                  </span>
                </td>
                <td class="p-3 text-slate-300 font-bold font-mono">#{{ inf.numero_cotizacion || '—' }}</td>
                <td class="p-3 font-bold text-white max-w-[180px] truncate">{{ inf.cliente_nombre }}</td>
                <td class="p-3 text-slate-400 text-[11px]">{{ inf.fecha_inicio || '—' }} al {{ inf.fecha_termino || '—' }}</td>
                <td class="p-3">
                  <span class="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 inline-block">
                    📁 {{ inf.ruta_almacenamiento || 'GSP/dev/ITS-TRANSICION/2026/10' }}
                  </span>
                </td>
                <td class="p-3 text-right font-bold text-white">${{ formatCLP(inf.total_venta || 0) }}</td>
                <td class="p-3 text-right text-slate-300">${{ formatCLP(inf.total_costos || 0) }}</td>
                <td class="p-3 text-right font-bold" :class="inf.margen >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                  {{ inf.margen || 0 }}%
                </td>
                <td class="p-3 text-center">
                  <span
                    class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border inline-block"
                    :class="getEstadoBadgeClase(inf.estado)"
                  >
                    {{ inf.estado || 'BORRADOR' }}
                  </span>
                </td>
                <td class="p-3 text-center">
                  <div class="flex items-center justify-center gap-1.5 flex-wrap">
                    <button
                      @click="verPdfDocumento(inf)"
                      class="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded border border-emerald-500/40 text-[11px] transition-all flex items-center gap-1 font-bold cursor-pointer"
                      title="Ver Documento PDF Oficial Depositado"
                    >
                      📄 Ver PDF
                    </button>
                    <button
                      @click="cargarInformeParaEdicion(inf)"
                      class="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white rounded border border-blue-500/40 text-[11px] transition-all flex items-center gap-1 cursor-pointer font-bold"
                      title="Cargar este informe en el formulario para continuar editándolo"
                    >
                      📝 Cargar / Editar
                    </button>
                    <button
                      v-if="inf.estado !== 'APROBADO' && inf.estado !== 'APROBADO_CONTABILIDAD'"
                      @click="() => abrirModalFes(inf)"
                      class="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded border border-amber-500/40 text-[11px] transition-all font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                      title="Aprobar con Firma Electrónica Simple (Contabilidad)"
                    >
                      🖋️ Aprobar FES
                    </button>
                    <button
                      @click="eliminarInformeHistorial(inf.folio_its)"
                      class="p-1 text-rose-400 hover:text-rose-300 text-xs cursor-pointer"
                      title="Eliminar de historial"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="informesFiltrados.length === 0">
                <td colspan="10" class="p-6 text-center text-slate-500 italic text-xs">
                  No hay informes en esta categoría. Genera un informe desde la pestaña "Elaborar Informe".
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- BÓVEDA DE PLANILLAS GERALDSOFT SUBIDAS -->
      <div class="bg-[#0f1629] p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <span>🗄️</span> Bóveda de Planillas GeraldSoft
        </h3>
        <div class="overflow-x-auto rounded-xl border border-white/10">
          <table class="w-full text-xs text-left font-mono">
            <thead class="bg-[#050810] text-[10px] uppercase text-slate-400 border-b border-white/10">
              <tr>
                <th class="p-3">Nombre Archivo</th>
                <th class="p-3">Tipo Planilla</th>
                <th class="p-3">Fecha y Hora de Carga</th>
                <th class="p-3 text-right">Registros</th>
                <th class="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="(p, idx) in planillasBoveda" :key="idx" class="hover:bg-white/5">
                <td class="p-3 font-bold text-white">{{ p.nombre }}</td>
                <td class="p-3 text-slate-300">{{ p.tipo }}</td>
                <td class="p-3 text-slate-400 text-[11px]">{{ p.fecha }}</td>
                <td class="p-3 text-right font-bold text-emerald-400">{{ p.registros }}</td>
                <td class="p-3 text-center">
                  <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    🟢 Procesado
                  </span>
                </td>
              </tr>
              <tr v-if="planillasBoveda.length === 0">
                <td colspan="5" class="p-4 text-center text-slate-500 italic text-xs">
                  Sin planillas respaldadas aún en esta sesión.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- ========================================================================= -->
    <!-- ========================================================================= -->
    <!-- MODAL DE FIRMA ELECTRÓNICA SIMPLE (FES) TRIPARTITO (SPEC 67)              -->
    <!-- ========================================================================= -->
    <div
      v-if="modalFesAbierto"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div class="bg-[#0e1628] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-mono animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-[#131e36]">
          <div class="flex items-center gap-2">
            <span class="text-xl">🖋️</span>
            <div>
              <h3 class="text-sm font-black text-white uppercase tracking-wider">
                <span v-if="tipoPasoFes === 'ELABORADOR'">Firma FES — Elaboración (Secretaria / Analista)</span>
                <span v-else-if="tipoPasoFes === 'VERIFICADOR'">Validación FES — Verificación Operativa (Administrador)</span>
                <span v-else>Aprobación FES — Contabilidad & Finanzas</span>
              </h3>
              <p class="text-[11px] text-slate-400">
                Sello digital de visto bueno FES sobre el Informe de Término de Servicio
              </p>
            </div>
          </div>
          <button
            @click="modalFesAbierto = false"
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div class="p-5 space-y-4 text-xs">
          <!-- Resumen del Servicio -->
          <div class="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1.5">
            <div class="flex justify-between">
              <span class="text-slate-400">Folio ITS:</span>
              <span class="font-bold text-amber-300">{{ (informeSeleccionadoFes || informe).folio_its }} (V{{ (informeSeleccionadoFes || informe).version || 1 }})</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Cotización / Cliente:</span>
              <span class="font-bold text-white max-w-[260px] truncate">#{{ (informeSeleccionadoFes || informe).numero_cotizacion }} • {{ (informeSeleccionadoFes || informe).cliente_nombre }}</span>
            </div>
            <div v-if="rolActivo !== 'SECRETARIA'" class="flex justify-between">
              <span class="text-slate-400">Venta Neta / Margen:</span>
              <span class="font-bold text-emerald-400">${{ formatCLP((informeSeleccionadoFes || informe).total_venta || totalVentaCalculada) }} ({{ (informeSeleccionadoFes || informe).margen || margenPorcentajeCalculado }}%)</span>
            </div>
          </div>

          <!-- Campos de Firma FES -->
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  Nombre del Firmante
                </label>
                <input
                  v-model="fesForm.nombre"
                  type="text"
                  class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label class="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  Cargo Oficial
                </label>
                <input
                  v-model="fesForm.cargo"
                  type="text"
                  class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  RUT Firmante
                </label>
                <input
                  v-model="fesForm.rut"
                  type="text"
                  class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label class="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  PIN OTP FES (4 dígitos) *
                </label>
                <input
                  v-model="fesForm.pin"
                  type="password"
                  maxlength="4"
                  placeholder="••••"
                  class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-center text-amber-300 font-black tracking-widest text-base focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label class="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
                Observaciones del Sello FES
              </label>
              <textarea
                v-model="fesForm.observaciones"
                rows="2"
                class="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-[11px] focus:outline-none focus:border-blue-500/50"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2.5 p-4 border-t border-white/10 bg-[#070b14]">
          <button
            @click="() => abrirVentanaImpresionOficial(informeSeleccionadoFes || informe)"
            type="button"
            class="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <span>👁️</span> Ver Informe PDF
          </button>
          <div class="flex items-center gap-2">
            <button
              @click="modalFesAbierto = false"
              type="button"
              class="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              @click="ejecutarFirmaFes"
              type="button"
              :disabled="guardandoFes || !fesForm.pin || fesForm.pin.length < 4"
              class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="guardandoFes" class="animate-spin">⏳</span>
              <span>{{ guardandoFes ? 'Estampando FES...' : '🖋️ Estampar Firma FES' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL DE DEVOLUCIÓN CON OBSERVACIONES (SPEC 67)                            -->
    <!-- ========================================================================= -->
    <div
      v-if="modalDevolucionAbierto"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div class="bg-[#0e1628] border border-rose-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-mono animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-rose-950/40">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚠️</span>
            <div>
              <h3 class="text-sm font-black text-rose-300 uppercase tracking-wider">
                Devolver Informe al Elaborador
              </h3>
              <p class="text-[11px] text-slate-400">
                El informe regresará a borrador observado para corrección de datos o montos.
              </p>
            </div>
          </div>
          <button
            @click="modalDevolucionAbierto = false"
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div class="p-5 space-y-4 text-xs">
          <div class="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1.5">
            <div class="flex justify-between">
              <span class="text-slate-400">Folio ITS:</span>
              <span class="font-bold text-amber-300">{{ informe.folio_its }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Cliente / Cotización:</span>
              <span class="font-bold text-white">#{{ informe.numero_cotizacion }} • {{ informe.cliente_nombre }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Rol Devolutor:</span>
              <span class="font-bold text-rose-400">{{ rolActivo }}</span>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              Motivo y Detalle de Observaciones (Requerido) *
            </label>
            <textarea
              v-model="formDevolucion.observaciones"
              rows="4"
              placeholder="Indica con claridad qué datos, horas, tarifas o gastos deben ser corregidos por la Secretaria o Analista..."
              class="w-full bg-black/40 border border-rose-500/30 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:border-rose-400"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 p-4 border-t border-white/10 bg-[#070b14]">
          <button
            @click="modalDevolucionAbierto = false"
            type="button"
            class="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            @click="ejecutarDevolucion"
            type="button"
            :disabled="formDevolucion.guardando || !formDevolucion.observaciones.trim()"
            class="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="formDevolucion.guardando" class="animate-spin">⏳</span>
            <span>{{ formDevolucion.guardando ? 'Devolviendo...' : '⚠️ Confirmar Devolución' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE HISTORIAL DE CARGAS GERALDSOFT (SPEC-070) -->
    <div
      v-if="mostrarModalHistorialPlanillas"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono"
    >
      <div class="bg-[#0b101d] border border-white/20 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div class="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div class="flex items-center gap-2">
            <span class="text-lg">📜</span>
            <div>
              <h3 class="text-sm font-bold text-white">Historial de Cargas GeraldSoft en el Servidor</h3>
              <p class="text-[11px] text-slate-400">Auditoría centralizada de todas las versiones cargadas en la BD.</p>
            </div>
          </div>
          <button
            @click="mostrarModalHistorialPlanillas = false"
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div class="p-4 overflow-y-auto flex-1 text-xs">
          <div v-if="cargandoHistorialPlanillas" class="text-center py-8 text-slate-400">
            <span class="animate-spin text-lg inline-block mr-2">⏳</span> Cargando bitácora de cargas...
          </div>
          <div v-else-if="historialPlanillasServidor.length === 0" class="text-center py-8 text-slate-500">
            Sin registros de cargas previas en el servidor.
          </div>
          <table v-else class="w-full text-left font-mono">
            <thead class="bg-[#050810] text-[10px] uppercase text-slate-400 border-b border-white/10">
              <tr>
                <th class="p-2.5">Fecha y Hora</th>
                <th class="p-2.5">Tipo</th>
                <th class="p-2.5">Archivo</th>
                <th class="p-2.5">Subido Por</th>
                <th class="p-2.5 text-center">Modo</th>
                <th class="p-2.5 text-right">Registros</th>
                <th class="p-2.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="item in historialPlanillasServidor" :key="item.id_planilla" class="hover:bg-white/5">
                <td class="p-2.5 text-slate-300">{{ formatDateCLHora(item.fecha_carga) }}</td>
                <td class="p-2.5 font-bold" :class="item.tipo_planilla === 'CONTROLES' ? 'text-blue-400' : 'text-purple-400'">
                  {{ item.tipo_planilla }}
                </td>
                <td class="p-2.5 text-white max-w-[180px] truncate" :title="item.nombre_archivo">{{ item.nombre_archivo }}</td>
                <td class="p-2.5 text-slate-300">{{ item.usuario_nombre || 'Usuario' }}</td>
                <td class="p-2.5 text-center">
                  <span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">
                    {{ item.modo_carga || 'REEMPLAZO' }}
                  </span>
                </td>
                <td class="p-2.5 text-right text-emerald-400 font-bold">
                  {{ item.total_registros }}
                  <span v-if="item.registros_nuevos > 0" class="text-[10px] text-blue-300 ml-1">
                    (+{{ item.registros_nuevos }})
                  </span>
                </td>
                <td class="p-2.5 text-center">
                  <span v-if="item.activo" class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    🟢 ACTIVA
                  </span>
                  <span v-else class="px-2 py-0.5 rounded-full text-[9px] text-slate-500 bg-white/5">
                    Histórica
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-3 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            @click="mostrarModalHistorialPlanillas = false"
            class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import * as XLSX from 'xlsx'
import apiAxios from '../../services/api'

// Cargador determinista de html2pdf para generación de PDF binario real (%PDF-1.4)
const asegurarHtml2Pdf = () => {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) return resolve(window.html2pdf)
    const existing = document.querySelector('script[src*="html2pdf"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.html2pdf))
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    script.onload = () => resolve(window.html2pdf)
    script.onerror = () => reject(new Error('No se pudo cargar el motor generador de PDF'))
    document.head.appendChild(script)
  })
}

const calcularSha256Pin = async (pin) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ESTADO DE PESTAÑAS
const tabActivo = ref('elaborar')
const filtroEstado = ref('TODOS')
const procesandoAccion = ref(false)

// ROLES Y GOBERNANZA FES (SPEC 67)
const currentUser = ref(null)
const rolSimulado = ref('')
const rolDetectado = ref('ANALISTA')

const detectarRolUsuario = () => {
  try {
    const raw = localStorage.getItem('user')
    if (raw) {
      const u = JSON.parse(raw)
      currentUser.value = u
      const roles = Array.isArray(u.roles) ? u.roles.map(r => String(typeof r === 'object' ? r.nombre_rol || r.nombre || r.code || '' : r).toUpperCase()) : []
      const rolPrinc = String(u.rol_principal || u.rol || u.role || '').toUpperCase()
      const allRoles = [...roles, rolPrinc]

      if (allRoles.some(r => r.includes('ADMIN') || r.includes('SUPERADMIN') || r === 'GSP_ADMIN')) {
        rolDetectado.value = 'ADMINISTRADOR'
      } else if (allRoles.some(r => r.includes('CONTABILIDAD') || r.includes('FINANZAS') || r === 'GSP_CONT')) {
        rolDetectado.value = 'CONTABILIDAD'
      } else if (allRoles.some(r => r.includes('SECRETARIA'))) {
        rolDetectado.value = 'SECRETARIA'
      } else {
        rolDetectado.value = 'ANALISTA'
      }
    }
  } catch (e) {
    console.warn('Error detectando rol de usuario:', e)
  }
}

const rolActivo = computed({
  get() {
    return rolSimulado.value || rolDetectado.value || 'ANALISTA'
  },
  set(val) {
    rolSimulado.value = val
  }
})

const esAdminUsuario = computed(() => {
  return rolDetectado.value === 'ADMINISTRADOR' || currentUser.value?.is_admin === true
})

const esObservado = computed(() => {
  const st = informe.estado || ''
  return st === 'OBSERVADO' || st === 'OBSERVADO_ADMIN' || st === 'OBSERVADO_CONTABILIDAD'
})

const ultimaObservacion = computed(() => {
  if (informe.historial_observaciones && informe.historial_observaciones.length > 0) {
    return informe.historial_observaciones[informe.historial_observaciones.length - 1]
  }
  return null
})

const badgeColorRol = (rol) => {
  switch (rol) {
    case 'ADMINISTRADOR': return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    case 'CONTABILIDAD': return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    case 'SECRETARIA': return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    case 'ANALISTA': return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    default: return 'bg-slate-500/20 text-slate-300 border-slate-500/40'
  }
}

const badgeColorEstado = (estado) => {
  switch (estado) {
    case 'APROBADO':
    case 'APROBADO_CONTABILIDAD': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    case 'PENDIENTE_VERIFICACION': return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    case 'PENDIENTE_CONTABILIDAD': return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    case 'OBSERVADO':
    case 'OBSERVADO_ADMIN':
    case 'OBSERVADO_CONTABILIDAD': return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    default: return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  }
}

// ESTADO DE MODAL FES TRIPARTITO Y DEVOLUCIONES (SPEC 67)
const tipoPasoFes = ref('ELABORADOR')
const modalFesAbierto = ref(false)
const informeSeleccionadoFes = ref(null)
const fesForm = reactive({
  nombre: 'YIARA MENDOZA',
  cargo: 'Analista de Operaciones',
  rut: '19.823.114-K',
  pin: '',
  observaciones: 'Informe elaborado y verificado según respaldos y planillas de terreno.'
})
const guardandoFes = ref(false)

const modalDevolucionAbierto = ref(false)
const formDevolucion = reactive({
  observaciones: '',
  guardando: false
})

// ARCHIVOS GERALDSOFT EN MEMORIA Y PERSISTENCIA SERVIDOR (SPEC-068 / SPEC-070)
const nombreArchivoServicios = ref('')
const nombreArchivoOrdenes = ref('')
const serviciosRaw = ref([])
const ordenesRaw = ref([])
const planillasBoveda = ref([])
const planillasCargadasServidor = ref({ controles: null, ordenes: null })
const cargandoPlanillas = ref(false)

// ESPECIFICACIÓN 070: BÓVEDA, INGESTA INCREMENTAL Y MATRIZ DE CONCILIACIÓN
const modoCargaPlanilla = ref('incremental')
const mostrarPanelCarga = ref(false)
const mostrarModalHistorialPlanillas = ref(false)
const historialPlanillasServidor = ref([])
const cargandoHistorialPlanillas = ref(false)
const filtroEstadoPipeline = ref('TODOS')

const formatDateCLHora = (isoStr) => {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return String(isoStr)
    const dia = String(d.getDate()).padStart(2, '0')
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const anio = d.getFullYear()
    const hora = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dia}/${mes}/${anio} ${hora}:${min} hrs`
  } catch {
    return String(isoStr)
  }
}

const formatDateCL = (isoStr) => formatDateCLHora(isoStr)

const sincronizarBovedaManual = async () => {
  await cargarPlanillasPersistentes()
  await cargarHistorialDesdeServidor()
  alert('✅ Bóveda de Planillas y Pipeline de ITS sincronizados con el servidor.')
}

const abrirModalHistorialPlanillas = async () => {
  mostrarModalHistorialPlanillas.value = true
  cargandoHistorialPlanillas.value = true
  try {
    const res = await apiAxios.get('/operaciones/its/transicion/planillas/historial')
    if (res.data?.success && Array.isArray(res.data.data)) {
      historialPlanillasServidor.value = res.data.data
    }
  } catch (err) {
    console.error('Error cargando historial de planillas:', err)
  } finally {
    cargandoHistorialPlanillas.value = false
  }
}

// Extractor de equipos para la tabla del pipeline
const extraerEquiposTexto = (s) => {
  if (!s || !Array.isArray(s.servicios)) return '—'
  const pats = new Set()
  s.servicios.forEach(row => {
    const p = String(row.patente || row.PATENTE || row.equipo || row.EQUIPO || '').trim()
    if (p) pats.add(p)
  })
  return pats.size > 0 ? Array.from(pats).join(', ') : '—'
}

// Seleccionar y comenzar a elaborar ITS desde la Matriz
const seleccionarYElaborarIts = async (s) => {
  servicioSeleccionadoKey.value = s.key
  onSeleccionarServicio()

  // Iniciar y persistir de inmediato el borrador en PostgreSQL para visibilidad multi-usuario (SPEC-073)
  const nomUser = currentUser.value?.nombre_completo || currentUser.value?.nombre || 'Operaciones'
  informe.id_usuario_elaborador = currentUser.value?.id_user || null
  informe.nombre_elaborador = nomUser
  await guardarInformeConEstado('BORRADOR', true)

  const el = document.getElementById('print-container')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const cargarPlanillasPersistentes = async () => {
  cargandoPlanillas.value = true
  try {
    const res = await apiAxios.get('/operaciones/its/transicion/planillas/activas')
    if (res.data?.success) {
      if (res.data.controles && res.data.controles.data_json) {
        serviciosRaw.value = res.data.controles.data_json
        nombreArchivoServicios.value = res.data.controles.nombre_archivo
        planillasCargadasServidor.value.controles = res.data.controles
        registrarPlanillaBoveda(res.data.controles.nombre_archivo, 'Control de Servicios (CONTROLES) [Servidor]', res.data.controles.total_registros)
      }
      if (res.data.ordenes && res.data.ordenes.data_json) {
        ordenesRaw.value = res.data.ordenes.data_json
        nombreArchivoOrdenes.value = res.data.ordenes.nombre_archivo
        planillasCargadasServidor.value.ordenes = res.data.ordenes
        registrarPlanillaBoveda(res.data.ordenes.nombre_archivo, 'Órdenes de Trabajo (OT) [Servidor]', res.data.ordenes.total_registros)
      }
      if (serviciosRaw.value.length > 0) {
        construirServiciosDisponibles()
      }
    }
  } catch (err) {
    console.warn('Sin planillas activas en el servidor o error de carga:', err.message)
  } finally {
    cargandoPlanillas.value = false
  }
}

// LISTA DE SERVICIOS AGRUPADOS PARA SELECTOR
const servicioSeleccionadoKey = ref('')
const serviciosDisponibles = ref([])
const filtroCotizacionTexto = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')

// SERVICIOS ENRIQUECIDOS CON ESTADO DE ITS PARA CONCILIACIÓN
const serviciosEnriquecidos = computed(() => {
  return serviciosDisponibles.value.map(s => {
    const g = s.data || {}
    const cot = String(g.cotizacion || '').trim()
    const itsMatch = informesHistorial.value.find(i => String(i.numero_cotizacion || '').trim() === cot)
    return {
      ...s,
      cotizacion: g.cotizacion,
      cliente: g.cliente,
      ots: g.ots || new Set(),
      servicios: g.servicios || [],
      otInfo: g.otInfo || {},
      itsRelacionado: itsMatch || null
    }
  })
})

const kpisPipelineServicios = computed(() => {
  const lista = serviciosEnriquecidos.value
  let pendientes = 0
  let tramite = 0
  let observados = 0
  let aprobados = 0

  lista.forEach(s => {
    if (!s.itsRelacionado) {
      pendientes++
    } else {
      const st = s.itsRelacionado.estado || 'BORRADOR'
      if (st === 'APROBADO' || st === 'APROBADO_CONTABILIDAD') {
        aprobados++
      } else if (st.includes('OBSERVADO')) {
        observados++
      } else {
        tramite++
      }
    }
  })

  return {
    total: lista.length,
    pendientes,
    tramite,
    observados,
    aprobados
  }
})

const serviciosPipelineFiltrados = computed(() => {
  let res = serviciosEnriquecidos.value

  // Filtro por texto
  if (filtroCotizacionTexto.value.trim()) {
    const q = filtroCotizacionTexto.value.trim().toLowerCase()
    res = res.filter(s => {
      const matchCot = String(s.cotizacion || '').toLowerCase().includes(q)
      const matchCli = String(s.cliente || '').toLowerCase().includes(q)
      const matchEq = extraerEquiposTexto(s).toLowerCase().includes(q)
      return matchCot || matchCli || matchEq
    })
  }

  // Filtro por estado del pipeline
  if (filtroEstadoPipeline.value === 'PENDIENTE') {
    res = res.filter(s => !s.itsRelacionado)
  } else if (filtroEstadoPipeline.value === 'TRAMITE') {
    res = res.filter(s => s.itsRelacionado && s.itsRelacionado.estado !== 'APROBADO' && !s.itsRelacionado.estado.includes('OBSERVADO'))
  } else if (filtroEstadoPipeline.value === 'OBSERVADO') {
    res = res.filter(s => s.itsRelacionado && s.itsRelacionado.estado.includes('OBSERVADO'))
  } else if (filtroEstadoPipeline.value === 'APROBADO') {
    res = res.filter(s => s.itsRelacionado && s.itsRelacionado.estado === 'APROBADO')
  }

  return res
})

const serviciosDisponiblesFiltrados = computed(() => {
  if (!filtroCotizacionTexto.value.trim()) return serviciosDisponibles.value
  const q = filtroCotizacionTexto.value.trim().toLowerCase()
  return serviciosDisponibles.value.filter(s => s.label.toLowerCase().includes(q))
})

const limpiarFiltroFechas = () => {
  filtroFechaDesde.value = ''
  filtroFechaHasta.value = ''
  if (servicioSeleccionadoKey.value) {
    onSeleccionarServicio()
  }
}

const onFiltroFechaModificado = () => {
  if (servicioSeleccionadoKey.value) {
    onSeleccionarServicio()
  }
}

// MODELO PRINCIPAL DEL INFORME (SECCIONES 1, 2 Y 4)
const informe = reactive({
  folio_its: 'ITS-0209',
  numero_cotizacion: '3259',
  version: 1,
  id_doc: null,
  id_transicion: null,
  fecha_emision: new Date().toISOString().split('T')[0],
  cliente_nombre: '',
  cliente_rut: '',
  empresa_facturacion: 'BESTMAQ',
  ejecutivo_comercial: '',
  ciudad_obra: '',
  tipo_servicio: 'HORA / FLETE',
  regimen_operacional: 'SERVICIO RURAL',
  fecha_inicio: '',
  fecha_termino: '',
  total_dias: 1,
  valor_fijo: 0,
  valor_flete: 0,
  equipos: [],
  jornadas: [],
  observaciones_servicio: '',
  firmante_elaborado: 'YIARA MENDOZA',
  firmante_aprobado: 'JORGE PONCE',
  firmante_recibido: 'CONTABILIDAD Y FINANZAS',
  nombre_elaborador: 'YIARA MENDOZA',
  estado: 'BORRADOR',
  firmas_fes: {},
  historial_observaciones: [],
  id_usuario_elaborador: null,
  id_usuario_verificador: null,
  id_usuario_aprobador: null
})

// MODELO DE COSTOS OPERACIONALES (SECCIÓN 3)
const costos = reactive({
  alimentacion: [],
  peajes: [],
  pensiones: [],
  pensiones_oc: '',
  movilizacion: [],
  personal_externo: [],
  feriados: [],
  subcontrato_flete: [],
  gastos_extra: [],
  tarifas_operadores_override: {},
  horas_operadores_override: {},
  categorias_operadores_override: {},
  horas_traslado: []
})

// CATÁLOGO MAESTRO CANÓNICO DE TARIFAS DE OPERADOR/CONDUCTOR (SISTEMA JORGE - SPEC-069)
const CATALOGO_TARIFAS_OPERADOR = [
  { id: 'HORQUILLA', nombre: 'GRUA HORQUILLA', valor_hora: 3000 },
  { id: 'CAMION_PLUMA', nombre: 'CAMION PLUMA', valor_hora: 5000 },
  { id: 'CAMION_PLUMA_10', nombre: 'CAMION PLUMA 10 TON', valor_hora: 5000 },
  { id: 'MANITOU', nombre: 'MANITU / TELEHANDLER', valor_hora: 5000 },
  { id: 'GRUA_70', nombre: 'GRUA TELESCOPICA 70 TON', valor_hora: 6000 },
  { id: 'GRUA_80', nombre: 'GRUA TELESCOPICA 80 TON', valor_hora: 7000 },
  { id: 'TRACTO', nombre: 'TRACTOCAMION', valor_hora: 7000 },
  { id: 'GRUA_100', nombre: 'GRUA TELESCOPICA 100 TON', valor_hora: 8000 },
  { id: 'GRUA_220', nombre: 'GRUA TELESCOPICA 220 TON', valor_hora: 12000 },
  { id: 'GRUA_OTRA', nombre: 'OTRA MAQUINARIA / GRUA GENERAL', valor_hora: 8500 }
]

const detectarTarifaYCatSugerida = (subcategoria = '') => {
  const s = String(subcategoria || '').toUpperCase()
  if (s.includes('HORQUILLA')) return { cat: 'GRUA HORQUILLA', tarifa: 3000 }
  if (s.includes('220') || s.includes('250')) return { cat: 'GRUA TELESCOPICA 220 TON', tarifa: 12000 }
  if (s.includes('100')) return { cat: 'GRUA TELESCOPICA 100 TON', tarifa: 8000 }
  if (s.includes('80')) return { cat: 'GRUA TELESCOPICA 80 TON', tarifa: 7000 }
  if (s.includes('70') || s.includes('75')) return { cat: 'GRUA TELESCOPICA 70 TON', tarifa: 6000 }
  if (s.includes('TRACTO') || s.includes('CAMION')) {
    if (s.includes('PLUMA')) return { cat: 'CAMION PLUMA', tarifa: 5000 }
    return { cat: 'TRACTOCAMION', tarifa: 7000 }
  }
  if (s.includes('MANITU') || s.includes('TELEHANDLER') || s.includes('ALZA')) return { cat: 'MANITU / TELEHANDLER', tarifa: 5000 }
  if (s.includes('50')) return { cat: 'GRUA TELESCOPICA 70 TON', tarifa: 6000 }
  return { cat: 'OTRA MAQUINARIA / GRUA GENERAL', tarifa: 8500 }
}

const onCambiarCategoriaOperador = (pat, event) => {
  const catNombre = event.target.value
  if (!catNombre) return
  const found = CATALOGO_TARIFAS_OPERADOR.find(c => c.nombre === catNombre)
  if (found) {
    if (!costos.categorias_operadores_override) costos.categorias_operadores_override = {}
    if (!costos.tarifas_operadores_override) costos.tarifas_operadores_override = {}
    costos.categorias_operadores_override[pat] = found.nombre
    costos.tarifas_operadores_override[pat] = found.valor_hora
  }
}

// HISTORIAL DE INFORMES GUARDADOS
const informesHistorial = ref([])

// =========================================================================
// INGESTA Y PARSING DE EXCEL GERALDSOFT
// =========================================================================

const onSubirArchivoServicios = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  nombreArchivoServicios.value = file.name

  const reader = new FileReader()
  reader.onload = async (evt) => {
    try {
      const data = new Uint8Array(evt.target.result)
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
      serviciosRaw.value = json
      registrarPlanillaBoveda(file.name, 'Control de Servicios (CONTROLES)', json.length)
      construirServiciosDisponibles()

      // Persistir automáticamente en backend PostgreSQL (SPEC-068 / SPEC-070)
      try {
        const resSub = await apiAxios.post('/operaciones/its/transicion/planillas/subir', {
          tipo_planilla: 'CONTROLES',
          nombre_archivo: file.name,
          data_json: json,
          id_user: currentUser.value?.id_user,
          modo: modoCargaPlanilla.value
        })
        if (resSub.data?.success) {
          await cargarPlanillasPersistentes()
          const est = resSub.data.estadisticas || {}
          alert(`✅ Planilla de Controles cargada exitosamente (${modoCargaPlanilla.value.toUpperCase()}):\n• Nuevos incorporados: ${est.nuevos || 0}\n• Actualizados: ${est.actualizados || 0}\n• Total en Bóveda: ${est.total_actual || json.length}`)
        }
      } catch (errPersist) {
        console.warn('No se pudo persistir planilla de controles en backend:', errPersist.message)
      }
    } catch (err) {
      console.error('Error leyendo CONTROLES:', err)
      alert('No se pudo leer el archivo Excel de Controles.')
    }
  }
  reader.readAsArrayBuffer(file)
}

const onSubirArchivoOrdenes = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  nombreArchivoOrdenes.value = file.name

  const reader = new FileReader()
  reader.onload = async (evt) => {
    try {
      const data = new Uint8Array(evt.target.result)
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
      ordenesRaw.value = json
      registrarPlanillaBoveda(file.name, 'Órdenes de Trabajo (OT)', json.length)
      construirServiciosDisponibles()

      // Persistir automáticamente en backend PostgreSQL (SPEC-068 / SPEC-070)
      try {
        const resSub = await apiAxios.post('/operaciones/its/transicion/planillas/subir', {
          tipo_planilla: 'ORDENES',
          nombre_archivo: file.name,
          data_json: json,
          id_user: currentUser.value?.id_user,
          modo: modoCargaPlanilla.value
        })
        if (resSub.data?.success) {
          await cargarPlanillasPersistentes()
          const est = resSub.data.estadisticas || {}
          alert(`✅ Planilla de Órdenes (OTs) cargada exitosamente (${modoCargaPlanilla.value.toUpperCase()}):\n• Nuevos incorporados: ${est.nuevos || 0}\n• Actualizados: ${est.actualizados || 0}\n• Total en Bóveda: ${est.total_actual || json.length}`)
        }
      } catch (errPersist) {
        console.warn('No se pudo persistir planilla de órdenes en backend:', errPersist.message)
      }
    } catch (err) {
      console.error('Error leyendo OTs:', err)
      alert('No se pudo leer el archivo Excel de Órdenes.')
    }
  }
  reader.readAsArrayBuffer(file)
}

const registrarPlanillaBoveda = (nombre, tipo, registros) => {
  const now = new Date()
  const fechaStr = `${now.toLocaleDateString('es-CL')} ${now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`
  planillasBoveda.value.unshift({
    nombre,
    tipo,
    fecha: fechaStr,
    registros
  })
}

const limpiarPlanillasCargadas = () => {
  nombreArchivoServicios.value = ''
  nombreArchivoOrdenes.value = ''
  serviciosRaw.value = []
  ordenesRaw.value = []
  serviciosDisponibles.value = []
}

// AGRUPADOR Y PAREADOR DE SERVICIOS
const construirServiciosDisponibles = () => {
  const gruposMap = new Map()

  // 1. Indexar OTs
  const otsMap = new Map()
  ordenesRaw.value.forEach(ot => {
    const num = String(ot.ORDEN || ot.orden || '').trim()
    if (num) otsMap.set(num, ot)
  })

  // 2. Agrupar filas de servicios
  serviciosRaw.value.forEach(s => {
    const otNum = String(s.orden || s.ORDEN || '').trim()
    const otData = otsMap.get(otNum) || {}
    const cotNum = String(otData['Nro Cotizacion'] || s.cotizacion || otNum).trim()
    const cliente = String(otData.CLIENTE || s.nombreclie || 'Cliente').trim()

    const groupKey = cotNum ? `cot_${cotNum}` : `ot_${otNum}`
    if (!gruposMap.has(groupKey)) {
      gruposMap.set(groupKey, {
        key: groupKey,
        cotizacion: cotNum,
        cliente,
        ots: new Set(),
        servicios: [],
        otInfo: otData
      })
    }
    const g = gruposMap.get(groupKey)
    if (otNum) g.ots.add(otNum)
    g.servicios.push({ ...s, otInfo: otData })
  })

  // 3. Crear lista seleccionable
  const lista = []
  gruposMap.forEach((g) => {
    const otsList = Array.from(g.ots).join(', ')
    lista.push({
      key: g.key,
      label: `Cotización #${g.cotizacion} — ${g.cliente} (OTs: ${otsList || 'S/N'} • ${g.servicios.length} jornadas)`,
      data: g
    })
  })

  serviciosDisponibles.value = lista
}

// HELPER PARA EXTRAER FECHA REAL (PRIORIZA COLUMNA A Y FECHAS VÁLIDAS)
const extraerFechaReal = (s) => {
  if (!s) return ''
  const vals = Object.values(s)
  const firstVal = vals.length > 0 ? vals[0] : ''
  const candidatos = [
    firstVal, s.__EMPTY, s.FECHA, s.fecha, s['FECHA '], s['Fecha'],
    s.FECHA_SERVICIO, s.FECHASERVICIO, s.horasalida, s.HORASALIDA, s.__EMPTY_4
  ]
  const mesesMap = {
    ene: '01', jan: '01',
    feb: '02',
    mar: '03',
    abr: '04', apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    ago: '08', aug: '08',
    sep: '09', set: '09',
    oct: '10',
    nov: '11',
    dic: '12', dec: '12'
  }
  for (const c of candidatos) {
    if (!c) continue
    if (c instanceof Date && !isNaN(c.getTime())) {
      return c.toISOString().split('T')[0]
    }
    if (typeof c === 'number' && c > 35000 && c < 60000) {
      const fechaExcel = new Date(Math.round((c - 25569) * 86400 * 1000))
      if (!isNaN(fechaExcel.getTime())) {
        return fechaExcel.toISOString().split('T')[0]
      }
    }
    const str = String(c).trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10)
    }
    // Manejo de "01-Oct-26", "01-Oct-2026", "01/Oct/2026", "1-Oct-26"
    const matchMesTexto = str.match(/^(\d{1,2})[\/\-\s]+([A-Za-z]{3,4})[\/\-\s]+(\d{2,4})/)
    if (matchMesTexto) {
      const dia = matchMesTexto[1].padStart(2, '0')
      const mesKey = matchMesTexto[2].toLowerCase().slice(0, 3)
      const mes = mesesMap[mesKey] || '10'
      let anio = matchMesTexto[3]
      if (anio.length === 2) anio = `20${anio}`
      return `${anio}-${mes}-${dia}`
    }
    // Manejo de "01-10-2026", "01/10/2026", "01-10-26"
    const matchNum = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
    if (matchNum) {
      const dia = matchNum[1].padStart(2, '0')
      const mes = matchNum[2].padStart(2, '0')
      let anio = matchNum[3]
      if (anio.length === 2) anio = `20${anio}`
      return `${anio}-${mes}-${dia}`
    }
  }
  return ''
}

// AUTO-POBLADO AL SELECCIONAR SERVICIO CON FILTRO DE RANGO DE FECHAS
const onSeleccionarServicio = () => {
  const item = serviciosDisponibles.value.find(s => s.key === servicioSeleccionadoKey.value)
  if (!item) return
  const g = item.data
  const otRef = g.otInfo || {}

  // Sección 1
  const cot = String(g.cotizacion || '').trim()
  informe.numero_cotizacion = cot
  informe.folio_its = cot ? `ITS-${cot}` : 'ITS-0209'

  // Calcular versión correlativa basada en historial de la cotización
  const historialMismaCot = informesHistorial.value.filter(i => String(i.numero_cotizacion || '').trim() === cot)
  if (historialMismaCot.length > 0) {
    const maxVer = historialMismaCot.reduce((acc, cur) => Math.max(acc, parseInt(cur.version || 1)), 0)
    const ultimo = historialMismaCot[0]
    if (ultimo.estado === 'EMITIDO' || ultimo.estado === 'APROBADO') {
      informe.version = maxVer + 1
    } else {
      informe.version = maxVer
    }
  } else {
    informe.version = 1
  }
  informe.id_doc = null
  informe.id_transicion = null

  informe.cliente_nombre = g.cliente || ''
  informe.cliente_rut = String(otRef.RUT || '').trim()
  informe.empresa_facturacion = String(otRef.EMPRESA || 'ARRIENDOS SAN PABLO SpA').trim()
  informe.ejecutivo_comercial = String(otRef.VENDEDOR || '').trim()
  informe.ciudad_obra = String(otRef['Ciudad de Obra'] || '').trim()
  informe.tipo_servicio = String(otRef['Tipo Servicio'] || 'HORA').trim()
  informe.regimen_operacional = (parseFloat(otRef['Total KM'] || 0) > 30) ? 'SERVICIO RURAL' : 'SERVICIO URBANO'
  informe.valor_flete = parseFloat(otRef.NETO || 0) > 0 && String(otRef['Tipo Servicio']).toUpperCase().includes('FLETE')
    ? parseFloat(otRef.NETO)
    : 0

  // Equipos únicos
  const equiposMap = new Map()
  g.servicios.forEach(s => {
    const pat = String(s.patente || '').trim().toUpperCase()
    if (!pat) return
    if (!equiposMap.has(pat)) {
      equiposMap.set(pat, {
        patente: pat,
        subcategoria: String(s.vehiculo || s.tipo || 'GRUA').toUpperCase(),
        horas_minimas: String(s.horas_minimas || otRef['Horas Minimas'] ? `${otRef['Horas Minimas']} HORAS DIARIAS` : '8 HORAS DIARIAS'),
        valor_hora: parseFloat(s.valorhora || 0),
        ots_asociadas: Array.from(g.ots).map(o => `OT ${o}`).join(', '),
        personal_tripulacion: [s.chofer, s.rigger].filter(Boolean).join(' • ')
      })
    }
  })
  informe.equipos = Array.from(equiposMap.values())

  // Sección 2: Jornadas filtradas por rango de fecha
  const jornadasArr = []
  let fechaMin = ''
  let fechaMax = ''

  g.servicios.forEach(s => {
    const fIso = extraerFechaReal(s)

    // Filtro por rango de fechas (Punto 1 y 2)
    if (filtroFechaDesde.value && fIso && fIso < filtroFechaDesde.value) return
    if (filtroFechaHasta.value && fIso && fIso > filtroFechaHasta.value) return

    if (fIso) {
      if (!fechaMin || fIso < fechaMin) fechaMin = fIso
      if (!fechaMax || fIso > fechaMax) fechaMax = fIso
    }

    // Mapeo canónico Geralsoft: Salida (Col E), Llegada (Col I), Término (Col L), Retorno (Col O)
    const hSalida = formatearHora(s.horasalida || s.HORASALIDA || s['HORA SALIDA'] || s.__EMPTY_4)
    const hLlegada = formatearHora(s.horallegad || s.HORALLEGADA || s['HORA LLEGADA'] || s.__EMPTY_8)
    const hTermino = formatearHora(s.horatermi || s.HORATERMINO || s['HORA TERMINO'] || s.__EMPTY_11)
    const hRetorno = formatearHora(s.horallegap || s.HORALLEGAP || s['HORA RETORNO'] || s['RETORNO'] || s.__EMPTY_14)

    const jObj = {
      fecha: fIso || new Date().toISOString().split('T')[0],
      numero_ot: String(s.orden || s.ORDEN || ''),
      tipo_servicio: String(s.tipo || 'Hora'),
      patente: String(s.patente || '').toUpperCase(),
      hora_salida: hSalida,
      hora_llegada: hLlegada,
      hora_termino: hTermino,
      hora_retorno: hRetorno,
      colacion: '01:00',
      horas_reales_texto: '',
      horas_report: parseFloat(s.horas || 0),
      numero_report: String(s.reports || s.REPORTS || '')
    }
    calcularHorasReales(jObj)
    jornadasArr.push(jObj)
  })

  informe.jornadas = jornadasArr
  informe.fecha_inicio = fechaMin || filtroFechaDesde.value || ''
  informe.fecha_termino = fechaMax || filtroFechaHasta.value || fechaMin || ''
  recalcularDiasFaena()

  // Restaurar observaciones si existen en localStorage
  const savedObs = localStorage.getItem(`its_transicion_obs_${informe.folio_its}`)
  if (savedObs) {
    informe.observaciones_servicio = savedObs
  }
}

const formatearHora = (val) => {
  if (!val) return ''
  if (val instanceof Date) {
    return val.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  }
  const str = String(val).trim()
  if (str.includes(':')) {
    const parts = str.split(' ')
    const timePart = parts[parts.length - 1]
    const hm = timePart.split(':')
    if (hm.length >= 2) return `${hm[0].padStart(2, '0')}:${hm[1].padStart(2, '0')}`
  }
  return ''
}

// CÁLCULO DE HORAS REALES (SALIDA A RETORNO MENOS COLACIÓN)
const calcularHorasReales = (j) => {
  const inicio = j.hora_salida || j.hora_llegada
  const fin = j.hora_retorno || j.hora_termino || j.hora_llegada
  if (!inicio || !fin) {
    if (!j.horas_reales_texto) j.horas_reales_texto = '—'
    return
  }
  try {
    const [h1, m1] = inicio.split(':').map(Number)
    const [h2, m2] = fin.split(':').map(Number)
    let minTot = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (minTot < 0) minTot += 24 * 60 // Por si cruza medianoche
    if (j.colacion && j.colacion.includes(':')) {
      const [hc, mc] = j.colacion.split(':').map(Number)
      minTot -= (hc * 60 + mc)
    }
    if (minTot > 0) {
      const h = Math.floor(minTot / 60)
      const m = minTot % 60
      j.horas_reales_texto = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    } else {
      j.horas_reales_texto = '00:00'
    }
  } catch {
    if (!j.horas_reales_texto) j.horas_reales_texto = '—'
  }
}

const recalcularDiasFaena = () => {
  if (!informe.fecha_inicio || !informe.fecha_termino) {
    informe.total_dias = 1
    return
  }
  const d1 = new Date(informe.fecha_inicio)
  const d2 = new Date(informe.fecha_termino)
  const diffTime = d2.getTime() - d1.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  informe.total_dias = Math.max(1, diffDays || 1)
}

const crearInformeEnBlanco = () => {
  const folioNum = String(informeHistorialSiguienteNumero()).padStart(4, '0')
  informe.folio_its = `ITS-${folioNum}`
  informe.version = 1
  informe.id_doc = null
  informe.id_transicion = null
  informe.numero_cotizacion = ''
  informe.cliente_nombre = ''
  informe.cliente_rut = ''
  informe.ciudad_obra = ''
  informe.valor_fijo = 0
  informe.valor_flete = 0
  informe.equipos = []
  informe.jornadas = []
  informe.observaciones_servicio = ''
  informe.fecha_inicio = new Date().toISOString().split('T')[0]
  informe.fecha_termino = informe.fecha_inicio
  informe.total_dias = 1
}

const informeHistorialSiguienteNumero = () => {
  const max = informesHistorial.value.reduce((acc, cur) => {
    const m = String(cur.folio_its || '').match(/ITS-(\d+)/)
    return m ? Math.max(acc, parseInt(m[1])) : acc
  }, 209)
  return max + 1
}

// =========================================================================
// MANEJO DE FILAS DINÁMICAS (EQUIPOS, JORNADAS Y COSTOS)
// =========================================================================

const agregarEquipoFila = () => {
  informe.equipos.push({
    patente: '',
    subcategoria: 'GRUA',
    horas_minimas: '8 HORAS DIARIAS',
    valor_hora: 0,
    ots_asociadas: '',
    personal_tripulacion: ''
  })
}

const eliminarEquipoFila = (idx) => {
  informe.equipos.splice(idx, 1)
}

const agregarJornadaFila = () => {
  const j = {
    fecha: informe.fecha_inicio || new Date().toISOString().split('T')[0],
    numero_ot: '',
    tipo_servicio: 'Hora',
    patente: informe.equipos[0]?.patente || '',
    hora_salida: '07:30',
    hora_llegada: '08:00',
    hora_termino: '18:00',
    hora_retorno: '18:30',
    colacion: '01:00',
    horas_reales_texto: '9h 0m',
    horas_report: 9.0,
    numero_report: ''
  }
  calcularHorasReales(j)
  informe.jornadas.push(j)
}

const eliminarJornadaFila = (idx) => {
  informe.jornadas.splice(idx, 1)
}

const agregarCostoFila = (cat) => {
  const f = informe.fecha_inicio || new Date().toISOString().split('T')[0]
  if (cat === 'pensiones') {
    costos.pensiones.push({
      fecha: f,
      personal: '',
      desayuno: 4000,
      almuerzo: 0,
      cena: 4000,
      alojamiento: 14000,
      traslado: 0
    })
  } else if (cat === 'peajes') {
    costos.peajes.push({
      fecha: f,
      patente: informe.equipos[0]?.patente || '',
      personal: '',
      detalle: 'Peaje Troncal',
      monto: 0,
      es_no_reembolsar: false
    })
  } else {
    costos[cat].push({
      fecha: f,
      personal: '',
      concepto: '',
      detalle: '',
      monto: 0,
      tipo_pago: 'Transferencia',
      numero_oc: ''
    })
  }
}

const eliminarCostoFila = (cat, idx) => {
  costos[cat].splice(idx, 1)
}

// =========================================================================
// CÁLCULOS REACTIVOS FINANCIEROS Y BALANCES
// =========================================================================

const totalHorasReportCalculadas = computed(() => {
  return informe.jornadas.reduce((s, j) => s + (parseFloat(j.horas_report) || 0), 0)
})

const formatHorasHHMM = (val) => {
  const num = parseFloat(val)
  if (isNaN(num) || num <= 0) return '00:00'
  const totalMin = Math.round(num * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const totalIngresoHorasCalculado = computed(() => {
  if (!informe.equipos || informe.equipos.length === 0 || !informe.jornadas || informe.jornadas.length === 0) {
    return 0
  }

  const norm = (str) => String(str || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()

  // Caso 1: Mono-equipo (ej. Cotización 11308 con 1 Tractocamión a $130.000/hr)
  // Si hay exactamente 1 equipo asignado, todas las horas reportadas se valorizan con su tarifa
  if (informe.equipos.length === 1) {
    const tarifaUnica = parseFloat(informe.equipos[0].valor_hora) || 0
    const totalHoras = informe.jornadas.reduce((s, j) => s + (parseFloat(j.horas_report) || 0), 0)
    return totalHoras * tarifaUnica
  }

  // Caso 2: Múltiples equipos (pareo normalizado por patente con fallback inteligente)
  const equiposMap = new Map()
  informe.equipos.forEach(eq => {
    equiposMap.set(norm(eq.patente), parseFloat(eq.valor_hora) || 0)
  })
  const primerConTarifa = informe.equipos.find(eq => (parseFloat(eq.valor_hora) || 0) > 0)
  const tarifaDef = primerConTarifa ? (parseFloat(primerConTarifa.valor_hora) || 0) : 0

  return informe.jornadas.reduce((tot, j) => {
    const hrs = parseFloat(j.horas_report) || 0
    const patJ = norm(j.patente)
    const tarifa = (patJ && equiposMap.has(patJ)) ? equiposMap.get(patJ) : tarifaDef
    return tot + (hrs * tarifa)
  }, 0)
})

const totalVentaCalculada = computed(() => {
  return (
    totalIngresoHorasCalculado.value +
    (parseFloat(informe.valor_fijo) || 0) +
    (parseFloat(informe.valor_flete) || 0)
  )
})

// Subtotales de Costos Operacionales
const subtotalAlimentacion = computed(() => {
  return costos.alimentacion.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)
})

const subtotalPeajes = computed(() => {
  return costos.peajes.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)
})

const subtotalPeajesReembolsables = computed(() => {
  return costos.peajes.filter(c => !c.es_no_reembolsar).reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)
})

const subtotalPeajesDirectoEmpresa = computed(() => {
  return costos.peajes.filter(c => c.es_no_reembolsar).reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)
})

const subtotalPensiones = computed(() => {
  return costos.pensiones.reduce((s, c) => {
    const totFila = (parseFloat(c.desayuno) || 0) +
                    (parseFloat(c.almuerzo) || 0) +
                    (parseFloat(c.cena) || 0) +
                    (parseFloat(c.alojamiento) || 0) +
                    (parseFloat(c.traslado) || 0)
    return s + totFila
  }, 0)
})

const subtotalMovilizacion = computed(() => {
  return costos.movilizacion.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)
})

const subtotalPersonalExt = computed(() => {
  return costos.personal_externo.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)
})

const subtotalFeriados = computed(() => {
  return costos.feriados.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)
})

const subtotalSubcontratoFlete = computed(() => {
  return costos.subcontrato_flete.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)
})

const subtotalGastosExtraordinarios = computed(() => {
  return costos.gastos_extra.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)
})

// Mano de Obra Operadores (Horas Editables + Tarifario Dinámico según Categoría Maestra de Jorge - SPEC-069)
const manoObraCalculada = computed(() => {
  const norm = (str) => String(str || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const totalHorasTodasJornadas = informe.jornadas.reduce((s, j) => s + (parseFloat(j.horas_report) || 0), 0)

  return informe.equipos.map(eq => {
    const pat = String(eq.patente || '').trim().toUpperCase()
    const patN = norm(eq.patente)
    const hrsBase = informe.equipos.length === 1
      ? totalHorasTodasJornadas
      : informe.jornadas.filter(j => norm(j.patente) === patN).reduce((s, j) => s + (parseFloat(j.horas_report) || 0), 0)
    
    // Si el usuario sobreescribió las horas del operador
    const hrs = (costos.horas_operadores_override && costos.horas_operadores_override[pat] !== undefined && costos.horas_operadores_override[pat] !== '')
      ? parseFloat(costos.horas_operadores_override[pat]) || 0
      : hrsBase

    // Auto-detección canónica inicial según subcategoría / tonelaje (SPEC-069)
    const sugerido = detectarTarifaYCatSugerida(eq.subcategoria)

    // Categoría final (override interactivo o sugerido)
    const catFinal = (costos.categorias_operadores_override && costos.categorias_operadores_override[pat])
      ? costos.categorias_operadores_override[pat]
      : sugerido.cat

    // Si el usuario sobreescribió la tarifa en el input o selector
    const vhOp = (costos.tarifas_operadores_override && costos.tarifas_operadores_override[pat] !== undefined && costos.tarifas_operadores_override[pat] !== '')
      ? parseFloat(costos.tarifas_operadores_override[pat]) || 0
      : sugerido.tarifa

    return {
      patente: pat,
      categoria: catFinal,
      subcategoriaOriginal: eq.subcategoria || 'GRUA',
      valor_hora: vhOp,
      horas: hrs,
      horasBase: hrsBase
    }
  })
})

const subtotalHorasTraslado = computed(() => {
  return (costos.horas_traslado || []).reduce((s, t) => s + ((parseFloat(t.horas) || 0) * (parseFloat(t.valor_hora) || 0)), 0)
})

const subtotalManoDeObraOperadores = computed(() => {
  const totEquipos = manoObraCalculada.value.reduce((s, op) => s + (op.valor_hora * op.horas), 0)
  return totEquipos + subtotalHorasTraslado.value
})

const agregarFilaTraslado = () => {
  if (!costos.horas_traslado) costos.horas_traslado = []
  costos.horas_traslado.push({
    concepto: 'Horas Traslado / Conducción',
    patente: informe.equipos[0]?.patente || '',
    horas: 4,
    valor_hora: 7000
  })
}

const eliminarFilaTraslado = (idx) => {
  costos.horas_traslado.splice(idx, 1)
}

const totalCostosOperacionalesCalculados = computed(() => {
  return (
    subtotalAlimentacion.value +
    subtotalPeajes.value +
    subtotalPensiones.value +
    subtotalMovilizacion.value +
    subtotalPersonalExt.value +
    subtotalFeriados.value +
    subtotalSubcontratoFlete.value +
    subtotalGastosExtraordinarios.value +
    subtotalManoDeObraOperadores.value
  )
})

const utilidadBrutaCalculada = computed(() => {
  return totalVentaCalculada.value - totalCostosOperacionalesCalculados.value
})

const margenPorcentajeCalculado = computed(() => {
  if (totalVentaCalculada.value <= 0) return '0.0'
  const pct = (utilidadBrutaCalculada.value / totalVentaCalculada.value) * 100
  return pct.toFixed(1)
})

const getPorcentajeSobreVenta = (monto) => {
  if (totalVentaCalculada.value <= 0) return '0.0'
  return ((monto / totalVentaCalculada.value) * 100).toFixed(1)
}

const formatCLP = (val) => {
  return Number(val || 0).toLocaleString('es-CL')
}

// =========================================================================
// OBSERVACIONES BLINDADAS Y PERSISTENCIA CONTINUA
// =========================================================================

const autoguardarObservaciones = () => {
  if (informe.folio_its) {
    localStorage.setItem(`its_transicion_obs_${informe.folio_its}`, informe.observaciones_servicio || '')
  }
}

// --- ASISTENTE DE MIGRACIÓN: LOCALSTORAGE A NUBE POSTGRESQL (SPEC-066 Master / REQ-1029) ---
const informesLocalesPendientes = ref([])
const migrandoLocales = ref(false)

const escanearInformesLocalesPendientes = (servidorItems = []) => {
  try {
    const rawLocal = localStorage.getItem('its_transicion_historial')
    const rawBackup = localStorage.getItem('its_transicion_historial_backup_seguridad')
    
    let locales = []
    if (rawLocal) {
      try {
        const parsed = JSON.parse(rawLocal)
        if (Array.isArray(parsed)) locales = parsed
      } catch (e) {}
    }
    
    if (locales.length === 0 && rawBackup) {
      try {
        const parsedBkp = JSON.parse(rawBackup)
        if (Array.isArray(parsedBkp)) locales = parsedBkp
      } catch (e) {}
    }

    if (locales.length === 0) {
      informesLocalesPendientes.value = []
      return
    }

    // Respaldar copia inmutable de seguridad siempre que haya datos locales válidos
    if (locales.length > 0 && (!rawBackup || rawBackup === '[]')) {
      localStorage.setItem('its_transicion_historial_backup_seguridad', JSON.stringify(locales))
    }

    const foliosServidor = new Set(servidorItems.map(s => String(s.folio_its || '').trim().toUpperCase()))
    const cotsServidor = new Set(servidorItems.map(s => String(s.numero_cotizacion || '').trim()))

    const pendientes = locales.filter(loc => {
      const folioLoc = String(loc.folio_its || '').trim().toUpperCase()
      const cotLoc = String(loc.numero_cotizacion || '').trim()

      const existeEnServidor = (folioLoc && foliosServidor.has(folioLoc)) || (cotLoc && cotLoc !== '—' && cotsServidor.has(cotLoc))
      if (!existeEnServidor) return true

      const serverMatch = servidorItems.find(s => 
        (folioLoc && String(s.folio_its || '').trim().toUpperCase() === folioLoc) || 
        (cotLoc && cotLoc !== '—' && String(s.numero_cotizacion || '').trim() === cotLoc)
      )
      if (serverMatch) {
        const ventaServidor = parseFloat(serverMatch.total_venta || 0)
        const costosServidor = parseFloat(serverMatch.total_costos || 0)
        const ventaLocal = parseFloat(loc.total_venta || 0)
        const costosLocal = parseFloat(loc.total_costos || 0)
        if (ventaServidor === 0 && costosServidor === 0 && (ventaLocal > 0 || costosLocal > 0)) {
          return true
        }
      }
      return false
    })

    informesLocalesPendientes.value = pendientes
  } catch (err) {
    console.warn('Error al escanear informes locales:', err)
  }
}

const migrarInformesLocalesAlServidor = async () => {
  if (informesLocalesPendientes.value.length === 0) return
  if (!confirm(`¿Deseas subir ${informesLocalesPendientes.value.length} informe(s) local(es) a la base de datos central?`)) return

  migrandoLocales.value = true
  let subidos = 0
  let errores = 0

  for (const item of informesLocalesPendientes.value) {
    try {
      const inf = item.informe || item
      const cos = item.costos || {}
      const dJson = item.data_json || { informe: inf, costos: cos }

      const cot = item.numero_cotizacion || inf.numero_cotizacion || '—'
      const folio = item.folio_its || inf.folio_its || (cot !== '—' ? `ITS-${cot}` : 'ITS-LOCAL')

      const payload = {
        folio_its: folio,
        numero_cotizacion: cot,
        version: item.version || inf.version || 1,
        cliente_nombre: item.cliente_nombre || inf.cliente_nombre || 'CLIENTE MANDANTE',
        cliente_rut: item.cliente_rut || inf.cliente_rut || '—',
        empresa_facturacion: item.empresa_facturacion || inf.empresa_facturacion || 'ARRIENDOS SAN PABLO',
        ejecutivo_comercial: item.ejecutivo_comercial || inf.ejecutivo_comercial || '—',
        ciudad_obra: item.ciudad_obra || inf.ciudad_obra || '—',
        fecha_inicio: item.fecha_inicio || inf.fecha_inicio || null,
        fecha_termino: item.fecha_termino || inf.fecha_termino || null,
        total_venta: parseFloat(item.total_venta || inf.total_venta || 0),
        total_costos: parseFloat(item.total_costos || inf.total_costos || 0),
        utilidad_bruta: parseFloat(item.utilidad_bruta || inf.utilidad_bruta || 0),
        margen: parseFloat(item.margen || inf.margen || 0),
        estado: item.estado || inf.estado || 'BORRADOR',
        id_usuario_elaborador: currentUser.value?.id_user || null,
        data_json: {
          ...dJson,
          informe: inf,
          costos: cos,
          nombre_elaborador: item.nombre_elaborador || inf.nombre_elaborador || currentUser.value?.nombre_completo || 'Operaciones',
          migrado_desde_local: true,
          fecha_migracion: new Date().toISOString()
        }
      }

      const res = await apiAxios.post('/operaciones/its/transicion/save', payload)
      if (res.data?.success) {
        subidos++
      } else {
        errores++
      }
    } catch (e) {
      console.error('Error migrando informe local:', e)
      errores++
    }
  }

  migrandoLocales.value = false
  alert(`✅ Proceso de migración finalizado:\n• ${subidos} informe(s) subido(s) con éxito al servidor central.\n${errores > 0 ? `• ${errores} informe(s) con error.` : ''}`)
  informesLocalesPendientes.value = []
  await cargarHistorialDesdeServidor()
}

const descargarRespaldoLocalJson = () => {
  const rawLocal = localStorage.getItem('its_transicion_historial') || localStorage.getItem('its_transicion_historial_backup_seguridad') || '[]'
  const blob = new Blob([rawLocal], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `respaldo_its_local_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// CARGA Y PERSISTENCIA CENTRALIZADA EN SERVIDOR (POSTGRESQL) CON FALLBACK LOCAL
const cargandoHistorial = ref(false)

const cargarHistorialDesdeServidor = async () => {
  cargandoHistorial.value = true
  try {
    const res = await apiAxios.get('/operaciones/its/transicion/list')
    if (res.data?.success && Array.isArray(res.data?.data)) {
      // Escanear pendientes locales antes de actualizar la lista
      escanearInformesLocalesPendientes(res.data.data)
      informesHistorial.value = res.data.data.map(item => {
        const dJson = item.data_json || {}
        const inf = dJson.informe || item.informe || {}
        const cos = dJson.costos || item.costos || {}
        const fIni = item.fecha_inicio || inf.fecha_inicio || ''
        const fFin = item.fecha_termino || inf.fecha_termino || fIni
        const folio = item.folio_its || inf.folio_its || 'ITS-0209'
        const cot = item.numero_cotizacion || inf.numero_cotizacion || '—'
        const ver = parseInt(item.version || inf.version || 1)
        return {
          ...item,
          id: item.id_transicion ? `db_${item.id_transicion}` : `${folio}-V${ver}`,
          id_transicion: item.id_transicion,
          folio_its: folio,
          numero_cotizacion: cot,
          version: ver,
          cliente_nombre: item.cliente_nombre || inf.cliente_nombre || 'CLIENTE MANDANTE',
          cliente_rut: item.cliente_rut || inf.cliente_rut || '—',
          empresa_facturacion: item.empresa_facturacion || inf.empresa_facturacion || 'BESTMAQ',
          ejecutivo_comercial: item.ejecutivo_comercial || inf.ejecutivo_comercial || '—',
          ciudad_obra: item.ciudad_obra || inf.ciudad_obra || '—',
          fecha_inicio: fIni,
          fecha_termino: fFin,
          fechasTexto: (fIni && fFin) ? `${fIni} al ${fFin}` : (fIni || '—'),
          total_venta: parseFloat(item.total_venta ?? (inf.total_venta || 0)),
          total_costos: parseFloat(item.total_costos ?? (inf.total_costos || 0)),
          utilidad_bruta: parseFloat(item.utilidad_bruta ?? (inf.utilidad_bruta || 0)),
          margen: parseFloat(item.margen ?? (inf.margen || 0)),
          estado: item.estado || inf.estado || 'BORRADOR',
          firmas_fes: item.firmas_fes || dJson.firmas_fes || inf.firmas_fes || {},
          historial_observaciones: item.historial_observaciones || dJson.historial_observaciones || inf.historial_observaciones || [],
          id_usuario_elaborador: item.id_usuario_elaborador,
          nombre_elaborador: item.nombre_elaborador || dJson.nombre_elaborador || 'Operaciones',
          nombre_verificador: item.nombre_verificador || dJson.nombre_verificador || null,
          nombre_aprobador: item.nombre_aprobador || dJson.nombre_aprobador || null,
          id_usuario_verificador: item.id_usuario_verificador,
          id_usuario_aprobador: item.id_usuario_aprobador,
          id_doc: item.id_doc ? parseInt(item.id_doc) : null,
          ruta_almacenamiento: item.path_doc || item.ruta_almacenamiento || 'GSP/dev/ITS-TRANSICION/2026/10',
          informe: inf,
          costos: cos,
          data_json: dJson
        }
      })
      localStorage.setItem('its_transicion_historial', JSON.stringify(informesHistorial.value))
    }
  } catch (err) {
    console.warn('Fallo al cargar historial desde servidor, usando respaldo local:', err.message)
    cargarHistorialLocalFallback()
  } finally {
    cargandoHistorial.value = false
  }
}

const cargarHistorialLocalFallback = () => {
  const savedHist = localStorage.getItem('its_transicion_historial')
  if (savedHist) {
    try {
      const parsed = JSON.parse(savedHist)
      if (Array.isArray(parsed)) {
        informesHistorial.value = parsed
      }
    } catch (e) {}
  }
}

const guardarInformeConEstado = async (nuevoEstado = 'BORRADOR', silencioso = false) => {
  autoguardarObservaciones()

  const cot = informe.numero_cotizacion ? String(informe.numero_cotizacion).trim() : ''
  const folioActual = informe.folio_its || (cot ? `ITS-${cot}` : 'ITS-0209')
  informe.folio_its = folioActual
  informe.estado = nuevoEstado

  const fIni = informe.fecha_inicio || new Date().toISOString().split('T')[0]
  const fFin = informe.fecha_termino || fIni
  const ver = parseInt(informe.version || 1)
  const nomElab = currentUser.value?.nombre_completo || currentUser.value?.nombre || informe.nombre_elaborador || 'Operaciones'
  informe.nombre_elaborador = nomElab

  const snapshot = {
    id: `${folioActual}-V${ver}`,
    folio_its: folioActual,
    numero_cotizacion: informe.numero_cotizacion || '—',
    version: ver,
    cliente_nombre: informe.cliente_nombre || 'CLIENTE MANDANTE',
    cliente_rut: informe.cliente_rut || '—',
    empresa_facturacion: informe.empresa_facturacion || 'BESTMAQ',
    ejecutivo_comercial: informe.ejecutivo_comercial || '—',
    ciudad_obra: informe.ciudad_obra || '—',
    fecha_inicio: fIni,
    fecha_termino: fFin,
    fechasTexto: (fIni && fFin) ? `${fIni} al ${fFin}` : (fIni || '—'),
    total_venta: totalVentaCalculada.value,
    total_costos: totalCostosOperacionalesCalculados.value,
    utilidad_bruta: utilidadBrutaCalculada.value,
    margen: parseFloat(margenPorcentajeCalculado.value) || 0,
    estado: nuevoEstado,
    firmas_fes: informe.firmas_fes || {},
    historial_observaciones: informe.historial_observaciones || [],
    id_usuario_elaborador: informe.id_usuario_elaborador || currentUser.value?.id_user || null,
    nombre_elaborador: nomElab,
    id_usuario_verificador: informe.id_usuario_verificador || null,
    id_usuario_aprobador: informe.id_usuario_aprobador || null,
    id_doc: informe.id_doc || null,
    ruta_almacenamiento: `GSP/dev/ITS-TRANSICION/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    fecha_guardado: new Date().toISOString(),
    informe: JSON.parse(JSON.stringify(informe)),
    costos: JSON.parse(JSON.stringify(costos))
  }

  // 1. Persistir en PostgreSQL del Servidor
  try {
    const res = await apiAxios.post('/operaciones/its/transicion/guardar', {
      folio_its: folioActual,
      numero_cotizacion: informe.numero_cotizacion || 'SN',
      version: ver,
      cliente_nombre: snapshot.cliente_nombre,
      cliente_rut: snapshot.cliente_rut,
      empresa_facturacion: snapshot.empresa_facturacion,
      ejecutivo_comercial: snapshot.ejecutivo_comercial,
      ciudad_obra: snapshot.ciudad_obra,
      fecha_inicio: fIni,
      fecha_termino: fFin,
      total_venta: snapshot.total_venta,
      total_costos: snapshot.total_costos,
      utilidad_bruta: snapshot.utilidad_bruta,
      margen: snapshot.margen,
      estado: nuevoEstado,
      id_doc: nuevoEstado === 'BORRADOR' ? null : (snapshot.id_doc ? parseInt(snapshot.id_doc) : null),
      firmas_fes: snapshot.firmas_fes,
      historial_observaciones: snapshot.historial_observaciones,
      id_usuario_elaborador: snapshot.id_usuario_elaborador,
      nombre_elaborador: nomElab,
      id_usuario_verificador: snapshot.id_usuario_verificador,
      id_usuario_aprobador: snapshot.id_usuario_aprobador,
      data_json: { informe: snapshot.informe, costos: snapshot.costos, firmas_fes: snapshot.firmas_fes, historial_observaciones: snapshot.historial_observaciones, nombre_elaborador: nomElab }
    })
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Error al persistir en el servidor')
    }
    if (res.data?.data?.id_transicion) {
      snapshot.id_transicion = res.data.data.id_transicion
      informe.id_transicion = res.data.data.id_transicion
    }
    await cargarHistorialDesdeServidor()
  } catch (errApi) {
    console.error('Error al persistir en PostgreSQL:', errApi)
    const errorMsg = errApi.response?.data?.message || errApi.message || 'Error de conexión'
    if (!silencioso) {
      alert(`❌ No se pudo guardar en el servidor PostgreSQL:\n${errorMsg}\n\nLos cambios NO han quedado registrados en la nube común.`)
    }
    return false
  }

  // 2. Actualizar estado local reactivo
  const idx = informesHistorial.value.findIndex(i => i.folio_its === folioActual && parseInt(i.version || 1) === ver)
  if (idx >= 0) {
    informesHistorial.value[idx] = { ...informesHistorial.value[idx], ...snapshot }
  } else {
    informesHistorial.value.unshift(snapshot)
  }

  localStorage.setItem('its_transicion_historial', JSON.stringify(informesHistorial.value))

  if (!silencioso) {
    if (nuevoEstado === 'APROBADO') {
      alert(`✅ Informe ${folioActual} (V${ver}) APROBADO y guardado en el servidor.`)
    } else if (nuevoEstado === 'EMITIDO') {
      alert(`📤 Informe ${folioActual} (V${ver}) emitido y registrado en el servidor para Contabilidad.`)
    } else {
      alert(`💾 Borrador de ${folioActual} (V${ver}) guardado exitosamente en el servidor.`)
    }
  }
}

const guardarBorradorLocal = () => {
  const estadoActual = (informe.estado === 'PENDIENTE_VERIFICACION' || informe.estado === 'PENDIENTE_CONTABILIDAD')
    ? informe.estado
    : 'BORRADOR'
  guardarInformeConEstado(estadoActual)
}

// =========================================================================
// APROBACIÓN ITS Y DEPÓSITO EN GESTOR DOCUMENTAL (GSP/{dev|prod}/ITS-TRANSICION/{YYYY}/{MM})
// =========================================================================

const aprobarInformeOficial = async (inf = null) => {
  if (inf) {
    abrirModalFes(inf)
    return
  }

  procesandoAccion.value = true
  try {
    autoguardarObservaciones()

    const cot = informe.numero_cotizacion ? String(informe.numero_cotizacion).trim() : ''
    const folioActual = informe.folio_its || (cot ? `ITS-${cot}` : 'ITS-0209')
    informe.folio_its = folioActual
    informe.estado = 'EMITIDO'
    const ver = parseInt(informe.version || 1)

    const fIni = informe.fecha_inicio || new Date().toISOString().split('T')[0]
    const fFin = informe.fecha_termino || fIni

    // 1. Compilación de PDF Oficial en Servidor vía wkhtmltopdf (Estándar Canónico de Cotizaciones)
    const htmlContenido = generarHtmlDocumentoOficial(null, false)

    // 2. Parámetros de entorno y partición canónica en Gestor Documental
    const isDev = window.location.pathname.includes('-dev') || window.location.hostname === 'localhost'
    const appEnv = isDev ? 'dev' : 'prod'

    let idDocCreado = null
    let rutaRelativa = `GSP/${appEnv}/ITS-TRANSICION/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`

    try {
      const res = await apiAxios.post('/operaciones/its/compilar-pdf', {
        htmlContent: htmlContenido,
        folio: `${folioActual}-V${ver}`,
        numero_cotizacion: informe.numero_cotizacion || 'SN',
        modulo: 'ITS-TRANSICION',
        tenant_code: 'GSP',
        app_env: appEnv
      })
      if (res.data?.data?.id_doc) {
        idDocCreado = res.data.data.id_doc
        informe.id_doc = idDocCreado
        if (res.data.data.path_relativo) {
          rutaRelativa = res.data.data.path_relativo
        }
      }
    } catch (errComp) {
      console.error('Error al compilar PDF en servidor con wkhtmltopdf:', errComp)
      throw new Error('Fallo al compilar PDF en el servidor: ' + (errComp.response?.data?.message || errComp.message))
    }

    // 3. Persistir en PostgreSQL del Servidor
    try {
      await apiAxios.post('/operaciones/its/transicion/guardar', {
        folio_its: folioActual,
        numero_cotizacion: informe.numero_cotizacion || 'SN',
        version: ver,
        cliente_nombre: informe.cliente_nombre || 'CLIENTE MANDANTE',
        cliente_rut: informe.cliente_rut || '—',
        empresa_facturacion: informe.empresa_facturacion || 'BESTMAQ',
        ejecutivo_comercial: informe.ejecutivo_comercial || '—',
        ciudad_obra: informe.ciudad_obra || '—',
        fecha_inicio: fIni,
        fecha_termino: fFin,
        total_venta: totalVentaCalculada.value,
        total_costos: totalCostosOperacionalesCalculados.value,
        utilidad_bruta: utilidadBrutaCalculada.value,
        margen: parseFloat(margenPorcentajeCalculado.value) || 0,
        estado: 'EMITIDO',
        id_doc: idDocCreado,
        data_json: { informe: JSON.parse(JSON.stringify(informe)), costos: JSON.parse(JSON.stringify(costos)) }
      })
    } catch (errDb) {
      console.error('Error persistiendo ITS en PostgreSQL:', errDb)
    }

    // 4. Refrescar bandeja común desde el servidor
    await cargarHistorialDesdeServidor()

    alert(`✅ Informe ${folioActual} (V${ver}) EMITIDO exitosamente y registrado en la base de datos del servidor.\nPDF depositado en Gestor Documental (Doc #${idDocCreado}).\nPuesto a disposición de Contabilidad para visto bueno FES.`)
    tabActivo.value = 'control'
  } catch (err) {
    console.error('Error aprobando ITS:', err)
    alert('Ocurrió un error al procesar el ITS: ' + err.message)
  } finally {
    procesandoAccion.value = false
  }
}

// =========================================================================
// FIRMA ELECTRÓNICA SIMPLE (FES) TRIPARTITA Y DEVOLUCIONES (SPEC 67)
// =========================================================================

const abrirModalFes = (tipoOrInf = 'ELABORADOR') => {
  if (typeof tipoOrInf === 'object' && tipoOrInf !== null) {
    informeSeleccionadoFes.value = tipoOrInf
    tipoPasoFes.value = 'APROBADOR'
    fesForm.nombre = currentUser.value?.nombre_completo || currentUser.value?.nombre || 'MARITZA SEGUEL'
    fesForm.cargo = 'Jefa de Contabilidad y Finanzas'
    fesForm.rut = currentUser.value?.rut || '15.892.411-8'
    fesForm.observaciones = 'Revisado y conforme con planillas de costos, peajes y horas operativas. Aprobado para facturación.'
  } else {
    informeSeleccionadoFes.value = informe
    tipoPasoFes.value = tipoOrInf || 'ELABORADOR'

    if (tipoPasoFes.value === 'ELABORADOR') {
      fesForm.nombre = currentUser.value?.nombre_completo || currentUser.value?.nombre || (rolActivo.value === 'SECRETARIA' ? 'SECRETARIA' : 'YIARA MENDOZA')
      fesForm.cargo = rolActivo.value === 'SECRETARIA' ? 'Secretaria' : 'Analista de Operaciones'
      fesForm.rut = currentUser.value?.rut || '19.823.114-K'
      fesForm.observaciones = 'Informe elaborado y verificado según respaldos y planillas de terreno.'
    } else if (tipoPasoFes.value === 'VERIFICADOR') {
      fesForm.nombre = currentUser.value?.nombre_completo || currentUser.value?.nombre || 'JORGE PONCE'
      fesForm.cargo = 'Administrador de Operaciones'
      fesForm.rut = currentUser.value?.rut || '12.445.678-9'
      fesForm.observaciones = 'Servicio verificado operacionalmente. Horas de grúa y equipos conformes.'
    } else if (tipoPasoFes.value === 'APROBADOR') {
      fesForm.nombre = currentUser.value?.nombre_completo || currentUser.value?.nombre || 'MARITZA SEGUEL'
      fesForm.cargo = 'Jefa de Contabilidad y Finanzas'
      fesForm.rut = currentUser.value?.rut || '15.892.411-8'
      fesForm.observaciones = 'Revisado y conforme con planillas de costos, peajes y horas operativas. Aprobado para facturación.'
    }
  }

  fesForm.pin = ''
  modalFesAbierto.value = true
}

const abrirModalDevolucion = () => {
  formDevolucion.observaciones = ''
  modalDevolucionAbierto.value = true
}

const ejecutarDevolucion = async () => {
  if (!formDevolucion.observaciones.trim()) {
    alert('Debe ingresar las observaciones / motivo de la devolución.')
    return
  }
  formDevolucion.guardando = true
  try {
    const res = await apiAxios.post('/operaciones/its/transicion/devolver', {
      id_transicion: informe.id_transicion,
      folio_its: informe.folio_its,
      numero_cotizacion: informe.numero_cotizacion || 'SN',
      version: informe.version || 1,
      rol: rolActivo.value,
      observaciones: formDevolucion.observaciones.trim(),
      id_usuario: currentUser.value?.id_user || null,
      nombre_usuario: currentUser.value?.nombre_completo || currentUser.value?.nombre || fesForm.nombre
    })

    if (res.data?.success) {
      informe.estado = res.data.data.estado
      if (res.data.data.historial_observaciones) {
        informe.historial_observaciones = res.data.data.historial_observaciones
      }
      modalDevolucionAbierto.value = false
      alert(`⚠️ Informe devuelto al Elaborador con observaciones.\nNuevo estado: ${informe.estado}`)
      await cargarHistorialDesdeServidor()
    } else {
      alert(res.data?.message || 'Error al devolver informe.')
    }
  } catch (err) {
    console.error('Error al devolver informe:', err)
    alert('Error al devolver: ' + (err.response?.data?.message || err.message))
  } finally {
    formDevolucion.guardando = false
  }
}

const ejecutarFirmaFes = async () => {
  if (!fesForm.pin || fesForm.pin.length < 4) {
    alert('Por favor ingrese su PIN FES de 4 dígitos.')
    return
  }

  guardandoFes.value = true
  try {
    const targetInf = informeSeleccionadoFes.value || informe
    const pinHashed = await calcularSha256Pin(fesForm.pin)

    // Guardar borrador previo si estamos editando el informe activo
    if (targetInf === informe) {
      autoguardarObservaciones()
      await guardarInformeConEstado(informe.estado || 'BORRADOR', true)
    }

    let endpoint = '/operaciones/its/transicion/firmar-elaborador'
    if (tipoPasoFes.value === 'VERIFICADOR') {
      endpoint = '/operaciones/its/transicion/validar-admin'
    } else if (tipoPasoFes.value === 'APROBADOR') {
      endpoint = '/operaciones/its/transicion/aprobar-contabilidad'
    }

    const payload = {
      id_transicion: targetInf.id_transicion,
      folio_its: targetInf.folio_its,
      numero_cotizacion: targetInf.numero_cotizacion || 'SN',
      version: targetInf.version || 1,
      pin: fesForm.pin,
      pin_hash: pinHashed,
      pin_fes: pinHashed,
      firmante_nombre: fesForm.nombre,
      firmante_rut: fesForm.rut,
      firmante_cargo: fesForm.cargo,
      rol: rolActivo.value,
      observaciones: fesForm.observaciones,
      id_usuario: currentUser.value?.id_user || currentUser.value?.id_usuario || 65,
      id_user: currentUser.value?.id_user || currentUser.value?.id_usuario || 65
    }

    const res = await apiAxios.post(endpoint, payload)
    if (res.data?.success) {
      const dataRet = res.data.data
      targetInf.estado = dataRet.estado
      if (dataRet.firmas_fes) {
        targetInf.firmas_fes = dataRet.firmas_fes
      }
      modalFesAbierto.value = false
      alert(`🖋️ Documento ${targetInf.folio_its} firmado con FES exitosamente.\nNuevo estado: ${targetInf.estado}`)
      await cargarHistorialDesdeServidor()
    } else {
      alert(res.data?.message || 'Error en la firma FES.')
    }
  } catch (err) {
    console.error('Error en firma FES:', err)
    alert('Error al firmar con FES: ' + (err.response?.data?.message || err.message))
  } finally {
    guardandoFes.value = false
  }
}

const ejecutarFirmaFesContabilidad = ejecutarFirmaFes

const verPdfDocumento = (inf) => {
  if (inf?.id_doc) {
    const apiBase = apiAxios.defaults.baseURL || ''
    const fullUrl = `${apiBase}/v1/storage/view/${inf.id_doc}`
    window.open(fullUrl, '_blank')
  } else {
    abrirVentanaImpresionOficial(inf)
  }
}

const cargarInformeParaEdicion = (infSnapshot) => {
  const dJson = infSnapshot.data_json || {}
  const sourceInf = dJson.informe || infSnapshot.informe || infSnapshot
  const sourceCostos = dJson.costos || infSnapshot.costos || {}

  Object.assign(informe, JSON.parse(JSON.stringify(sourceInf)))
  if (!Array.isArray(informe.equipos)) informe.equipos = []
  if (!Array.isArray(informe.jornadas)) informe.jornadas = []
  if (infSnapshot.folio_its) informe.folio_its = infSnapshot.folio_its
  if (infSnapshot.numero_cotizacion) informe.numero_cotizacion = infSnapshot.numero_cotizacion
  if (infSnapshot.version) informe.version = infSnapshot.version
  informe.id_doc = (infSnapshot.estado !== 'BORRADOR' && infSnapshot.id_doc) ? parseInt(infSnapshot.id_doc) : null
  if (infSnapshot.id_transicion) informe.id_transicion = infSnapshot.id_transicion
  if (infSnapshot.estado) informe.estado = infSnapshot.estado
  informe.firmas_fes = infSnapshot.firmas_fes || dJson.firmas_fes || sourceInf.firmas_fes || {}
  informe.historial_observaciones = infSnapshot.historial_observaciones || dJson.historial_observaciones || sourceInf.historial_observaciones || []
  informe.id_usuario_elaborador = infSnapshot.id_usuario_elaborador || null
  informe.nombre_elaborador = infSnapshot.nombre_elaborador || dJson.nombre_elaborador || 'Operaciones'
  informe.id_usuario_verificador = infSnapshot.id_usuario_verificador || null
  informe.id_usuario_aprobador = infSnapshot.id_usuario_aprobador || null

  Object.assign(costos, JSON.parse(JSON.stringify(sourceCostos)))
  ;['alimentacion', 'peajes', 'pensiones', 'movilizacion', 'personal_externo', 'feriados', 'subcontrato_flete', 'gastos_extra', 'horas_traslado'].forEach(k => {
    if (!Array.isArray(costos[k])) costos[k] = []
  })
  ;['tarifas_operadores_override', 'horas_operadores_override', 'categorias_operadores_override'].forEach(k => {
    if (!costos[k] || typeof costos[k] !== 'object') costos[k] = {}
  })
  recalcularDiasFaena()
  tabActivo.value = 'elaborar'
}

const eliminarInformeHistorial = (folio) => {
  if (!confirm(`¿Eliminar el informe ${folio} del historial?`)) return
  informesHistorial.value = informesHistorial.value.filter(i => i.folio_its !== folio)
  localStorage.setItem('its_transicion_historial', JSON.stringify(informesHistorial.value))
}

const compartirPorWhatsApp = (inf = null) => {
  const target = inf || informe
  const folio = target.folio_its || 'ITS-S/F'
  const cot = target.numero_cotizacion || target.cotizacion || 'S/C'
  const cli = target.cliente_nombre || target.cliente || 'CLIENTE MANDANTE'
  const ciudad = target.ciudad_obra || 'FAENA'
  const fIni = target.fecha_inicio || ''
  const fFin = target.fecha_termino || ''
  const fechas = (fFin && fFin !== fIni) ? `${fIni} al ${fFin}` : (fIni || 'Período Operacional')
  const venta = inf ? (inf.total_venta || 0) : totalVentaCalculada.value
  const costosTot = inf ? (inf.total_costos || 0) : totalCostosOperacionalesCalculados.value
  const margenMonto = venta - costosTot
  const margenPct = venta > 0 ? ((margenMonto / venta) * 100).toFixed(1) : '0.0'
  const estadoActual = (target.estado || 'BORRADOR').toUpperCase()

  const isDev = window.location.pathname.includes('-dev') || window.location.hostname === 'localhost'
  const envPrefix = isDev ? '/lg-gsp-dev' : '/lg-gsp-prod'
  const origin = window.location.origin
  const linkDocumento = `${origin}${envPrefix}/its-transicion?folio=${encodeURIComponent(folio)}&accion=imprimir`

  const msg = 
`🏢 *GRÚAS SAN PABLO SpA — INFORME DE TÉRMINO DE SERVICIO (ITS)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 *Folio Oficial:* ${folio}
🏢 *Cliente Mandante:* ${cli}
📋 *Cotización Comercial:* #${cot}
📍 *Ubicación / Ciudad:* ${ciudad}
📅 *Período de Ejecución:* ${fechas}

💰 *BALANCE FINANCIERO Y LIQUIDACIÓN:*
• *Venta Facturable Neta:* $${formatCLP(venta)} CLP
• *Costos Operacionales Faena:* $${formatCLP(costosTot)} CLP
• *Margen Operacional Bruto:* $${formatCLP(margenMonto)} CLP
• *Rentabilidad del Servicio:* *${margenPct}%*

📑 *ESTADO ACTUAL:* *${estadoActual}* ${estadoActual === 'APROBADO' ? '✅' : (estadoActual === 'EMITIDO' ? '📤' : '📝')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 *Visualizar y Descargar PDF Oficial A4:*
${linkDocumento}

_Emitido por Dpto. de Operaciones & Control — Grúas San Pablo SpA_`

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank')
}

// =========================================================================
// GENERACIÓN DE PDF OFICIAL A4 (PLANTILLA EJECUTIVA CANÓNICA)
// =========================================================================

const generarHtmlDocumentoOficial = (targetInf = null, autoPrint = false) => {

  const infData = targetInf ? (targetInf.informe || targetInf) : informe
  const costData = targetInf ? (targetInf.costos || targetInf) : costos

  const folio = infData.folio_its || targetInf?.folio_its || 'ITS-0209'
  const cotizacion = infData.numero_cotizacion || targetInf?.numero_cotizacion || '3259'
  const cliente = infData.cliente_nombre || targetInf?.cliente_nombre || 'CHINA FIRST HIGHWAY ENG CO'
  const rut = infData.cliente_rut || targetInf?.cliente_rut || '59.233.410-0'
  const empresa = infData.empresa_facturacion || 'BESTMAQ'
  const vendedor = infData.ejecutivo_comercial || 'MARCELO REYES'
  const ciudad = infData.ciudad_obra || 'SANTA BÁRBARA'
  const tipoServicio = infData.tipo_servicio || 'HORA / FLETE'
  const regimen = infData.regimen_operacional || 'SERVICIO RURAL'
  const fIni = infData.fecha_inicio || '2026-09-21'
  const fFin = infData.fecha_termino || '2026-09-24'
  const fechas = (fFin && fFin !== fIni) ? `${fIni} al ${fFin}` : fIni
  const fEmision = infData.fecha_emision || new Date().toISOString().split('T')[0]
  const valorFijo = parseFloat(infData.valor_fijo || 0)
  const valorFlete = parseFloat(infData.valor_flete || 0)

  const equipos = infData.equipos || []
  const jornadas = infData.jornadas || []

  // Totales
  const totalVenta = targetInf?.total_venta !== undefined ? targetInf.total_venta : totalVentaCalculada.value
  const totalCostos = targetInf?.total_costos !== undefined ? targetInf.total_costos : totalCostosOperacionalesCalculados.value
  const utilidad = targetInf?.utilidad_bruta !== undefined ? targetInf.utilidad_bruta : (totalVenta - totalCostos)
  const margen = targetInf?.margen !== undefined ? targetInf.margen : (totalVenta > 0 ? (((totalVenta - totalCostos) / totalVenta) * 100).toFixed(1) : '0.0')

  const obs = infData.observaciones_servicio || ''
  const firmanteElaborado = infData.firmante_elaborado || 'YIARA MENDOZA'
  const firmanteAprobado = infData.firmante_aprobado || 'JORGE PONCE'
  const firmanteRecibido = infData.firmante_recibido || 'CONTABILIDAD Y FINANZAS'
  const firmasFes = infData.firmas_fes || targetInf?.firmas_fes || {}
  const historialObs = infData.historial_observaciones || targetInf?.historial_observaciones || []

  // Costos por rubro
  const alimRows = costData.alimentacion || []
  const totAlim = alimRows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0)

  const peajesRows = costData.peajes || []
  const totPeajes = peajesRows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0)

  const pensionRows = costData.pensiones || []
  const totPension = pensionRows.reduce((s, r) => s + ((parseFloat(r.desayuno) || 0) + (parseFloat(r.almuerzo) || 0) + (parseFloat(r.cena) || 0) + (parseFloat(r.alojamiento) || 0) + (parseFloat(r.traslado) || 0)), 0)

  const movilRows = costData.movilizacion || []
  const totMovil = movilRows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0)

  const pextRows = costData.personal_externo || []
  const totPext = pextRows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0)

  const feriadoRows = costData.feriados || []
  const totFeriados = feriadoRows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0)

  const subcontRows = costData.subcontrato_flete || []
  const totSubcont = subcontRows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0)

  const extraRows = costData.gastos_extra || []
  const totExtra = extraRows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0)

  const trasladoRows = costData.horas_traslado || []
  const totTrasladoMO = trasladoRows.reduce((s, r) => s + ((parseFloat(r.horas) || 0) * (parseFloat(r.valor_hora) || 0)), 0)

  // Costo Operadores (considerando horas editadas, categorías maestras y traslados adicionales - SPEC-069)
  const normPdf = (str) => String(str || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const totJornadasHrsPdf = jornadas.reduce((s, j) => s + (parseFloat(j.horas_report) || 0), 0)

  const operadorRows = equipos.map(eq => {
    const pat = String(eq.patente || '').trim().toUpperCase()
    const patN = normPdf(eq.patente)
    const hrsBase = equipos.length === 1
      ? totJornadasHrsPdf
      : jornadas.filter(j => normPdf(j.patente) === patN).reduce((s, j) => s + (parseFloat(j.horas_report) || 0), 0)
    const hrs = (costData.horas_operadores_override && costData.horas_operadores_override[pat] !== undefined && costData.horas_operadores_override[pat] !== '')
      ? parseFloat(costData.horas_operadores_override[pat]) || 0
      : hrsBase

    const sugerido = detectarTarifaYCatSugerida(eq.subcategoria)
    const catFinal = (costData.categorias_operadores_override && costData.categorias_operadores_override[pat])
      ? costData.categorias_operadores_override[pat]
      : sugerido.cat

    const tarifa = (costData.tarifas_operadores_override && costData.tarifas_operadores_override[pat] !== undefined && costData.tarifas_operadores_override[pat] !== '')
      ? parseFloat(costData.tarifas_operadores_override[pat]) || 0
      : sugerido.tarifa

    return {
      patente: eq.patente || '—',
      subcategoria: eq.subcategoria || '',
      categoria: catFinal,
      valor_hora: tarifa,
      horas_report: hrs,
      monto: hrs * tarifa
    }
  })

  trasladoRows.forEach(t => {
    const hrs = parseFloat(t.horas) || 0
    const vh = parseFloat(t.valor_hora) || 0
    operadorRows.push({
      patente: t.patente || 'TRASLADO',
      subcategoria: 'HORAS CONDUCCIÓN',
      categoria: t.concepto || 'TRASLADO / ART. 25 BIS',
      valor_hora: vh,
      horas_report: hrs,
      monto: hrs * vh
    })
  })

  const totCostoOperadores = operadorRows.reduce((acc, r) => acc + (parseFloat(r.monto) || 0), 0)

  const getPct = (val) => totalVenta > 0 ? ((val / totalVenta) * 100).toFixed(1) : '0.0'

  // Generar HTML idéntico al estándar oficial de Jorge
  const docHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>INFORME_TERMINO_SERVICIO_${folio}_COT_${cotizacion}</title>
        <style>
            @page { size: letter portrait; margin: 8mm; }
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; background: #ffffff; color: #0f172a; margin: 0; padding: 12px; font-size: 11px; line-height: 1.35; }
            table { border-collapse: collapse; width: 100%; }
            @media print {
                body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none !important; }
            }
        </style>
    </head>
    <body>
        <!-- Barra de Utilidad / Impresión -->
        <div class="no-print" style="background:#0f172a; color:#ffffff; padding:8px 12px; margin-bottom:12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; font-family:sans-serif;">
            <div style="font-weight:700; font-size:11px;">Vista Preliminar Oficial A4 — Folio: ${folio}</div>
            <div style="display:flex; gap:8px;">
                <button onclick="window.print()" style="background:#2563eb; color:#ffffff; border:none; padding:5px 12px; border-radius:4px; font-weight:700; cursor:pointer; font-size:11px;">🖨️ Imprimir / Guardar como PDF</button>
                <button onclick="window.close()" style="background:#475569; color:#ffffff; border:none; padding:5px 10px; border-radius:4px; font-weight:700; cursor:pointer; font-size:11px;">Cerrar</button>
            </div>
        </div>

        <!-- Header Membretado Oficial con Logo San Pablo -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <img src="/logo-sanpablo.png" style="max-height: 48px; max-width: 180px; object-fit: contain;" alt="Grúas San Pablo" />
            </div>
            <div style="text-align: center;">
                <h1 style="font-size: 15px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    INFORME TÉRMINO DE SERVICIO
                </h1>
                <div style="font-size: 10.5px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.5px;">
                    (${regimen})
                </div>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                <span style="display: inline-block; background-color: #1e1b4b; border: 1.5px solid #312e81; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #ffffff; font-family: monospace; letter-spacing: 0.5px;">
                    FOLIO N° ${folio} <span style="color: #93c5fd; font-weight: 800; font-size: 9.5px; margin-left: 3px;">(V1)</span>
                </span>
                <span style="display: inline-block; background-color: #fef3c7; border: 1.5px solid #f59e0b; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 900; color: #92400e; margin-top: 2px;">
                    Cotización #${cotizacion}
                </span>
                <div style="font-size: 9.5px; color: #0f172a; font-weight: 700; margin-top: 2px;">Fecha Emisión: <strong>${fEmision}</strong></div>
            </div>
        </div>

        <!-- 1. DATOS DEL SERVICIO INTEGRAL -->
        <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; background-color: #f1f5f9; color: #0f172a; padding: 5px 8px; border: 1px solid #cbd5e1; border-bottom: none; letter-spacing: 0.3px;">
                1. DATOS DEL SERVICIO INTEGRAL
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; border: 1px solid #cbd5e1; text-transform: uppercase;">
                <tbody>
                    <tr style="border-bottom: 1px solid #cbd5e1;">
                        <td style="width: 25%; font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">NOMBRE CLIENTE:</td>
                        <td style="width: 25%; padding: 4px 6px; border-right: 1px solid #cbd5e1; font-weight: 800; color: #0f172a;">${cliente}</td>
                        <td style="width: 25%; font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">RUT CLIENTE:</td>
                        <td style="width: 25%; padding: 4px 6px; font-weight: 800; color: #0f172a;">${rut}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #cbd5e1;">
                        <td style="font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">EMPRESA FACTURACIÓN:</td>
                        <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; font-weight: 800; color: #047857;">${empresa}</td>
                        <td style="font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">EJECUTIVO COMERCIAL:</td>
                        <td style="padding: 4px 6px; font-weight: 800; color: #1e293b;">${vendedor}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #cbd5e1;">
                        <td style="font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">FECHAS DEL SERVICIO:</td>
                        <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; font-weight: 800; color: #0f172a;">${fechas}</td>
                        <td style="font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">CIUDAD DE LA OBRA:</td>
                        <td style="padding: 4px 6px; font-weight: 800; color: #1e293b;">${ciudad}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #cbd5e1;">
                        <td style="font-weight: 800; background-color: #f8fafc; color: #0f172a; padding: 4px 6px; border-right: 1px solid #cbd5e1;">TIPO DE SERVICIO:</td>
                        <td colspan="3" style="padding: 4px 6px; font-weight: 800; color: #0891b2;">${tipoServicio}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #cbd5e1; background-color: #fef3c7;">
                        <td colspan="4" style="padding: 0;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                                <tbody>
                                    <tr>
                                        <td style="width: 50%; padding: 4.5px 6px; border-right: 1px solid #cbd5e1; color: #78350f;">
                                            <strong style="font-weight: 800;">VALOR FIJO:</strong> <span style="font-weight: 800; color: #1e3a8a; font-size: 10px;">$${formatCLP(valorFijo)}</span>
                                        </td>
                                        <td style="width: 50%; padding: 4.5px 6px; color: #78350f;">
                                            <strong style="font-weight: 800;">VALOR FLETE / TRASLADO:</strong> <span style="font-weight: 800; color: #3730a3; font-size: 10px;">$${formatCLP(valorFlete)}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="4" style="padding: 0; border-top: 1px solid #cbd5e1;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-transform: uppercase;">
                                <thead>
                                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1; font-weight: 800; color: #0f172a;">
                                        <th style="padding: 4px 6px; text-align: left; border-right: 1px solid #cbd5e1; width: 24%;">EQUIPO Y SUBCATEGORÍA</th>
                                        <th style="padding: 4px 6px; text-align: center; border-right: 1px solid #cbd5e1; width: 15%;">HRS MÍNIMAS</th>
                                        <th style="padding: 4px 6px; text-align: right; border-right: 1px solid #cbd5e1; width: 17%;">VALOR HORA</th>
                                        <th style="padding: 4px 6px; text-align: left; border-right: 1px solid #cbd5e1; width: 18%;">OT(S) ASOCIADA(S)</th>
                                        <th style="padding: 4px 6px; text-align: left; width: 26%;">PERSONAL Y CARGO ASIGNADO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${equipos.map(eq => `
                                        <tr style="border-bottom: 1px solid #e2e8f0;">
                                            <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1;">
                                                <div style="font-weight: 800; color: #0f172a;">${eq.patente || '—'}</div>
                                                <div style="font-size: 8.5px; color: #475569; font-weight: bold;">${eq.subcategoria || ''}</div>
                                            </td>
                                            <td style="padding: 4px 6px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #92400e;">
                                                ${eq.horas_minimas || '8 HORAS DIARIAS'}
                                            </td>
                                            <td style="padding: 4px 6px; text-align: right; border-right: 1px solid #cbd5e1; font-weight: 800; color: #047857; font-family: monospace;">
                                                $${formatCLP(eq.valor_hora || 0)}
                                            </td>
                                            <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; font-weight: 800; color: #1e3a8a;">
                                                ${eq.ots_asociadas || '—'}
                                            </td>
                                            <td style="padding: 4px 6px; font-weight: 800; color: #0f172a;">
                                                ${eq.personal_tripulacion || '—'}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 2. CONTROL DE FLOTA Y VALIDACION DE HORAS -->
        <div style="margin-bottom: 10px;">
            <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; background-color: #f1f5f9; color: #0f172a; padding: 5px 8px; border: 1px solid #cbd5e1; border-bottom: none; letter-spacing: 0.3px;">
                2. CONTROL DE FLOTA Y VALIDACION DE HORAS
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #cbd5e1;">
                <thead>
                    <tr style="background-color: #f8fafc; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1;">
                        <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Fecha</th>
                        <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">N° OT</th>
                        <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Tipo Serv.</th>
                        <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Patente</th>
                        <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Salida</th>
                        <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Llegada</th>
                        <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Término</th>
                        <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Retorno</th>
                        <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1;">Colación</th>
                        <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #1d4ed8;">Hrs Reales</th>
                        <th style="padding: 4px 5px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; color: #047857;">Hrs Report</th>
                        <th style="padding: 4px 5px; text-align: center;">N° Report</th>
                    </tr>
                </thead>
                <tbody>
                    ${jornadas.map((j, idx) => `
                        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;'}">
                            <td style="padding: 4px 5px; text-align: center; font-weight: 600; border-right: 1px solid #e2e8f0;">${j.fecha || '—'}</td>
                            <td style="padding: 4px 5px; text-align: center; font-weight: 800; color: #1e3a8a; border-right: 1px solid #e2e8f0;">${j.numero_ot || '—'}</td>
                            <td style="padding: 4px 5px; text-align: center; color: #334155; border-right: 1px solid #e2e8f0;">${j.tipo_servicio || 'Hora'}</td>
                            <td style="padding: 4px 5px; text-align: center; font-weight: 700; border-right: 1px solid #e2e8f0;">${j.patente || '—'}</td>
                            <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">${j.hora_salida || '—'}</td>
                            <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">${j.hora_llegada || '—'}</td>
                            <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">${j.hora_termino || '—'}</td>
                            <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">${j.hora_retorno || '—'}</td>
                            <td style="padding: 4px 5px; text-align: center; border-right: 1px solid #e2e8f0;">${j.colacion || '01:00'}</td>
                            <td style="padding: 4px 5px; text-align: center; font-weight: 800; color: #1d4ed8; border-right: 1px solid #e2e8f0;">${j.horas_reales_texto || '—'}</td>
                            <td style="padding: 4px 5px; text-align: center; font-weight: 800; color: #047857; border-right: 1px solid #e2e8f0;">${j.horas_report ? `${j.horas_report}h` : '—'}</td>
                            <td style="padding: 4px 5px; text-align: center; font-weight: 700;">${j.numero_report || '—'}</td>
                        </tr>
                    `).join('')}
                    <!-- Subtotal Fila Final -->
                    <tr style="background-color: #e0e7ff; border-top: 2px solid #cbd5e1; font-weight: bold;">
                        <td colspan="9" style="padding: 5px 6px; text-align: right; font-weight: 900; color: #0f172a;">TOTAL HORAS REPORT:</td>
                        <td style="padding: 5px 6px; border-right: 1px solid #cbd5e1;"></td>
                        <td style="padding: 5px 6px; text-align: center; font-family: monospace; font-weight: 900; color: #064e3b; background-color: #a7f3d0; border-right: 1px solid #cbd5e1; font-size: 10.5px;">
                            ${jornadas.reduce((s, j) => s + (parseFloat(j.horas_report) || 0), 0).toFixed(1)} hrs
                        </td>
                        <td style="padding: 5px 6px; background-color: #e0e7ff;"></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 3. PLANILLA DE COSTOS OPERACIONALES A PAGAR (PARA CONTABILIDAD) -->
        <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; background-color: #f1f5f9; color: #0f172a; padding: 5px 8px; border: 1px solid #cbd5e1; border-bottom: none; letter-spacing: 0.3px; page-break-after: avoid; break-after: avoid;">
                3. PLANILLA DE COSTOS OPERACIONALES A PAGAR (PARA CONTABILIDAD)
            </div>

            <!-- 1. VIÁTICO ALIMENTACIÓN PERSONAL -->
            <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
                <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: ${alimRows.length > 0 ? '1px solid #cbd5e1' : 'none'}; display: flex; justify-content: space-between; align-items: center;">
                    <span>⬢ VIATICO ALIMENTACION PERSONAL</span>
                    <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totAlim)}</span>
                </div>
                ${alimRows.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                        <thead>
                            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 3px 4px; text-align: center; width: 18%; border-right: 1px solid #e2e8f0;">Fecha</th>
                                <th style="padding: 3px 4px; text-align: left; width: 35%; border-right: 1px solid #e2e8f0;">Personal</th>
                                <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Concepto</th>
                                <th style="padding: 3px 4px; text-align: right; width: 20%;">Monto ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${alimRows.map(r => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">${r.fecha || '-'}</td>
                                    <td style="padding: 3px 6px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.personal || r.nombre || '-'}</td>
                                    <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.concepto || 'Alimentación Operador'}</td>
                                    <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div style="padding: 5px 8px; text-align: center; color: #64748b; font-weight: 600; font-size: 9.5px; background-color: #f8fafc; font-style: italic; letter-spacing: 0.2px;">
                        Sin registros de gastos en este ítem ($0)
                    </div>
                `}
            </div>

            <!-- 2. PEAJES Y TAG DE RUTA -->
            <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
                <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: ${peajesRows.length > 0 ? '1px solid #cbd5e1' : 'none'}; display: flex; justify-content: space-between;">
                    <span>⬢ PEAJES Y TAG DE RUTA</span>
                    <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totPeajes)}</span>
                </div>
                ${peajesRows.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                        <thead>
                            <tr style="background-color: #f8fafc; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 3px 4px; text-align: center; width: 14%; border-right: 1px solid #e2e8f0;">Fecha</th>
                                <th style="padding: 3px 4px; text-align: center; width: 15%; border-right: 1px solid #e2e8f0;">Patente</th>
                                <th style="padding: 3px 4px; text-align: left; width: 22%; border-right: 1px solid #e2e8f0;">Personal</th>
                                <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Detalle / Ruta / Tag / Vehículo</th>
                                <th style="padding: 3px 4px; text-align: right; width: 18%;">Monto ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${peajesRows.map(r => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 3px 4px; text-align: center; border-right: 1px solid #e2e8f0;">${r.fecha || '—'}</td>
                                    <td style="padding: 3px 4px; text-align: center; font-weight: 800; border-right: 1px solid #e2e8f0;">${r.patente || '—'}</td>
                                    <td style="padding: 3px 4px; font-weight: bold; border-right: 1px solid #e2e8f0;">${r.personal || '—'}</td>
                                    <td style="padding: 3px 4px; border-right: 1px solid #e2e8f0;">${r.detalle || 'Peaje de ruta'}</td>
                                    <td style="padding: 3px 4px; text-align: right; font-weight: 800;">$${formatCLP(r.monto || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<div style="padding: 5px 8px; text-align: center; color: #64748b; font-weight: 600; font-size: 9.5px; background-color: #f8fafc; font-style: italic; letter-spacing: 0.2px;">Sin registros de gastos en este ítem ($0)</div>`}
            </div>

            <!-- 3. PENSIONES Y ALOJAMIENTO FAENA -->
            <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
                <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: ${pensionRows.length > 0 ? '1px solid #cbd5e1' : 'none'}; display: flex; justify-content: space-between; align-items: center;">
                    <span>⬢ PENSIONES Y ALOJAMIENTO FAENA</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${costData.pensiones_oc ? `<span style="font-weight: 800; color: #0f172a; background-color: #e2e8f0; padding: 1px 5px; border-radius: 2px;">N° OC: ${costData.pensiones_oc}</span>` : ''}
                        <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totPension)}</span>
                    </div>
                </div>
                ${pensionRows.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                        <thead>
                            <tr style="background-color: #f8fafc; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 3px 4px; text-align: center; width: 14%; border-right: 1px solid #e2e8f0;">Fecha</th>
                                <th style="padding: 3px 4px; text-align: left; width: 28%; border-right: 1px solid #e2e8f0;">Personal</th>
                                <th style="padding: 3px 4px; text-align: right; width: 10%; border-right: 1px solid #e2e8f0;">Desayuno</th>
                                <th style="padding: 3px 4px; text-align: right; width: 10%; border-right: 1px solid #e2e8f0;">Almuerzo</th>
                                <th style="padding: 3px 4px; text-align: right; width: 10%; border-right: 1px solid #e2e8f0;">Cena</th>
                                <th style="padding: 3px 4px; text-align: right; width: 14%; border-right: 1px solid #e2e8f0;">Alojamiento</th>
                                <th style="padding: 3px 4px; text-align: right; width: 14%;">Total ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pensionRows.map(r => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 2px 4px; text-align: center; border-right: 1px solid #e2e8f0;">${r.fecha || '—'}</td>
                                    <td style="padding: 2px 4px; font-weight: bold; border-right: 1px solid #e2e8f0;">${r.personal || '—'}</td>
                                    <td style="padding: 2px 4px; text-align: right; border-right: 1px solid #e2e8f0;">$${formatCLP(r.desayuno || 0)}</td>
                                    <td style="padding: 2px 4px; text-align: right; border-right: 1px solid #e2e8f0;">$${formatCLP(r.almuerzo || 0)}</td>
                                    <td style="padding: 2px 4px; text-align: right; border-right: 1px solid #e2e8f0;">$${formatCLP(r.cena || 0)}</td>
                                    <td style="padding: 2px 4px; text-align: right; border-right: 1px solid #e2e8f0;">$${formatCLP(r.alojamiento || 0)}</td>
                                    <td style="padding: 2px 4px; text-align: right; font-weight: 800;">$${formatCLP((r.desayuno || 0) + (r.almuerzo || 0) + (r.cena || 0) + (r.alojamiento || 0) + (r.traslado || 0))}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<div style="padding: 5px 8px; text-align: center; color: #64748b; font-size: 9px; font-style: italic;">Sin registros de gastos en este ítem ($0)</div>`}
            </div>

            <!-- 4. MOVILIZACIÓN PERSONAL -->
            <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
                <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: ${movilRows.length > 0 ? '1px solid #cbd5e1' : 'none'}; display: flex; justify-content: space-between; align-items: center;">
                    <span>⬢ MOVILIZACION PERSONAL (PASAJES, UBER, TAXI, TRANSFER)</span>
                    <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totMovil)}</span>
                </div>
                ${movilRows.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                        <thead>
                            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 3px 4px; text-align: center; width: 14%; border-right: 1px solid #e2e8f0;">Fecha</th>
                                <th style="padding: 3px 4px; text-align: left; width: 28%; border-right: 1px solid #e2e8f0;">Personal</th>
                                <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Detalle / Tramo</th>
                                <th style="padding: 3px 4px; text-align: right; width: 18%;">Monto ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${movilRows.map(r => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.fecha || '-'}</td>
                                    <td style="padding: 3px 4px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.personal || '-'}</td>
                                    <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.detalle || '-'}</td>
                                    <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<div style="padding: 5px 8px; text-align: center; color: #64748b; font-weight: 600; font-size: 9.5px; background-color: #f8fafc; font-style: italic; letter-spacing: 0.2px;">Sin registros de gastos en este ítem ($0)</div>`}
            </div>

            <!-- 5. PERSONAL EXTERNO / RIGGERS DE APOYO -->
            <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
                <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: ${pextRows.length > 0 ? '1px solid #cbd5e1' : 'none'}; display: flex; justify-content: space-between; align-items: center;">
                    <span>⬢ PERSONAL EXTERNO / RIGGERS DE APOYO</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${costData.personal_externo_oc ? `<span style="font-weight: 800; color: #0f172a; background-color: #e2e8f0; padding: 1px 5px; border-radius: 2px;">N° OC: ${costData.personal_externo_oc}</span>` : ''}
                        <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totPext)}</span>
                    </div>
                </div>
                ${pextRows.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                        <thead>
                            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 3px 4px; text-align: center; width: 14%; border-right: 1px solid #e2e8f0;">Fecha</th>
                                <th style="padding: 3px 4px; text-align: left; width: 28%; border-right: 1px solid #e2e8f0;">Personal</th>
                                <th style="padding: 3px 4px; text-align: left; width: 18%; border-right: 1px solid #e2e8f0;">Tipo Pago</th>
                                <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Detalle / Servicio Externo</th>
                                <th style="padding: 3px 4px; text-align: right; width: 18%;">Valor ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pextRows.map(r => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.fecha || '-'}</td>
                                    <td style="padding: 3px 4px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.personal || '-'}</td>
                                    <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.tipo_pago || '-'}</td>
                                    <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.detalle || '-'}</td>
                                    <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<div style="padding: 5px 8px; text-align: center; color: #64748b; font-weight: 600; font-size: 9.5px; background-color: #f8fafc; font-style: italic; letter-spacing: 0.2px;">Sin registros de gastos en este ítem ($0)</div>`}
            </div>

            <!-- 6. PAGO FERIADOS Y BONOS -->
            <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
                <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: ${feriadoRows.length > 0 ? '1px solid #cbd5e1' : 'none'}; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span>⬢ PAGO FERIADOS Y BONOS</span>
                        <span style="background-color: #e2e8f0; color: #334155; border: 1px solid #cbd5e1; padding: 1px 6px; border-radius: 10px; font-size: 8.5px; font-weight: bold;">(aplica a rigger y bonos al personal)</span>
                    </div>
                    <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totFeriados)}</span>
                </div>
                ${feriadoRows.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                        <thead>
                            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 3px 4px; text-align: center; width: 16%; border-right: 1px solid #e2e8f0;">Fecha</th>
                                <th style="padding: 3px 4px; text-align: left; width: 25%; border-right: 1px solid #e2e8f0;">Personal</th>
                                <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Detalle / Jornada Feriada</th>
                                <th style="padding: 3px 4px; text-align: right; width: 20%;">Valor ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${feriadoRows.map(r => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.fecha || '-'}</td>
                                    <td style="padding: 3px 4px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.personal || '-'}</td>
                                    <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.detalle || '-'}</td>
                                    <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<div style="padding: 5px 8px; text-align: center; color: #64748b; font-weight: 600; font-size: 9.5px; background-color: #f8fafc; font-style: italic; letter-spacing: 0.2px;">Sin registros de gastos en este ítem ($0)</div>`}
            </div>

            <!-- 7. SUBCONTRATACIÓN FLETE EXTERNO -->
            <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
                <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: ${subcontRows.length > 0 ? '1px solid #cbd5e1' : 'none'}; display: flex; justify-content: space-between; align-items: center;">
                    <span>⬢ SUBCONTRATACION FLETE EXTERNO</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${costData.subcontrato_flete_oc ? `<span style="font-weight: 800; color: #0f172a; background-color: #e2e8f0; padding: 1px 5px; border-radius: 2px;">N° OC: ${costData.subcontrato_flete_oc}</span>` : ''}
                        <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totSubcont)}</span>
                    </div>
                </div>
                ${subcontRows.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                        <thead>
                            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 3px 4px; text-align: center; width: 16%; border-right: 1px solid #e2e8f0;">Fecha</th>
                                <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Descripción / Servicio Flete Subcontratado</th>
                                <th style="padding: 3px 4px; text-align: right; width: 20%;">Monto ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subcontRows.map(r => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.fecha || '-'}</td>
                                    <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.detalle || r.descripcion || '-'}</td>
                                    <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<div style="padding: 5px 8px; text-align: center; color: #64748b; font-weight: 600; font-size: 9.5px; background-color: #f8fafc; font-style: italic; letter-spacing: 0.2px;">Sin registros de gastos en este ítem ($0)</div>`}
            </div>

            <!-- 8. GASTOS EXTRAORDINARIOS -->
            <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
                <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: ${extraRows.length > 0 ? '1px solid #cbd5e1' : 'none'}; display: flex; justify-content: space-between; align-items: center;">
                    <span>⬢ GASTOS EXTRAORDINARIOS</span>
                    <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totExtra)}</span>
                </div>
                ${extraRows.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                        <thead>
                            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 3px 4px; text-align: center; width: 18%; border-right: 1px solid #e2e8f0;">Fecha</th>
                                <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Detalle / Gastos Máquina / Faena</th>
                                <th style="padding: 3px 4px; text-align: right; width: 20%;">Monto ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${extraRows.map(r => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 3px 4px; text-align: center; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.fecha || '-'}</td>
                                    <td style="padding: 3px 4px; font-weight: bold; color: #1e293b; border-right: 1px solid #e2e8f0;">${r.detalle || '-'}</td>
                                    <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<div style="padding: 5px 8px; text-align: center; color: #64748b; font-weight: 600; font-size: 9.5px; background-color: #f8fafc; font-style: italic; letter-spacing: 0.2px;">Sin registros de gastos en este ítem ($0)</div>`}
            </div>

            <!-- 9. COSTO VALOR HORA OPERADOR (HORAS REPORT) -->
            <div style="border: 1px solid #cbd5e1; margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid;">
                <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 9.5px; font-weight: 800; color: #0f172a; border-bottom: ${operadorRows.length > 0 ? '1px solid #cbd5e1' : 'none'}; display: flex; justify-content: space-between; align-items: center;">
                    <span>⬢ COSTO VALOR HORA OPERADOR (HORAS REPORT)</span>
                    <span style="font-weight: 800; font-size: 9.5px; color: #0f172a;">Total: $${formatCLP(totCostoOperadores)}</span>
                </div>
                ${operadorRows.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                        <thead>
                            <tr style="background-color: #f8fafc; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 3px 4px; text-align: left; width: 25%; border-right: 1px solid #e2e8f0;">Equipo (Patente / Subcat)</th>
                                <th style="padding: 3px 4px; text-align: left; border-right: 1px solid #e2e8f0;">Categoría Equipo / Maestra</th>
                                <th style="padding: 3px 4px; text-align: right; width: 18%; border-right: 1px solid #e2e8f0;">Valor Hora ($)</th>
                                <th style="padding: 3px 4px; text-align: right; width: 15%; border-right: 1px solid #e2e8f0;">Horas Report</th>
                                <th style="padding: 3px 4px; text-align: right; width: 20%;">Total Costo Operador ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${operadorRows.map(r => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 3px 4px; border-right: 1px solid #e2e8f0;">
                                        <div style="font-weight: 800; color: #0f172a; font-size: 10px;">${r.patente || '-'}</div>
                                        <div style="font-size: 8.5px; color: #475569; font-weight: bold;">${r.subcategoria || ''}</div>
                                    </td>
                                    <td style="padding: 3px 4px; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${r.categoria || '-'}</td>
                                    <td style="padding: 3px 4px; text-align: right; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">$${formatCLP(r.valor_hora || 0)}</td>
                                    <td style="padding: 3px 4px; text-align: right; font-weight: bold; color: #0f172a; border-right: 1px solid #e2e8f0;">${Number(r.horas_report || 0).toFixed(1)} hrs</td>
                                    <td style="padding: 3px 4px; text-align: right; font-weight: 800; font-size: 10px; color: #0f172a;">$${formatCLP(r.monto || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<div style="padding: 5px 8px; text-align: center; color: #64748b; font-weight: 600; font-size: 9.5px; background-color: #f8fafc; font-style: italic; letter-spacing: 0.2px;">Sin registros de gastos en este ítem ($0)</div>`}
            </div>
        </div>

        <!-- 4. RESULTADO DEL SERVICIO -->
        <div style="margin-bottom: 12px; border: 1px solid #cbd5e1;">
            <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; background-color: #f1f5f9; color: #0f172a; padding: 5px 8px; border-bottom: 1px solid #cbd5e1;">
                4. RESULTADO DEL SERVICIO
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                <tbody>
                    <tr>
                        <td style="width: 58%; vertical-align: top; padding: 6px; border-right: 1px solid #cbd5e1; background-color: #fafafa;">
                            <!-- Venta -->
                            <div style="border: 1px solid #a7f3d0; margin-bottom: 6px; background-color: #ffffff;">
                                <div style="background-color: #ecfdf5; padding: 4px 6px; font-weight: 800; color: #065f46; font-size: 9.5px; border-bottom: 1px solid #a7f3d0;">
                                    A. RESUMEN DE INGRESOS TOTALES (VENTA)
                                </div>
                                <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                                    <tbody>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 3px 5px; font-weight: bold;">1. Ingresos Horas Trabajadas</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800;">$${formatCLP(totalVenta - valorFijo - valorFlete)} (${getPct(totalVenta - valorFijo - valorFlete)}%)</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 3px 5px; font-weight: bold;">2. Ingreso por Servicio Fijo</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800;">$${formatCLP(valorFijo)} (${getPct(valorFijo)}%)</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 3px 5px; font-weight: bold;">3. Ingreso por Fletes / Traslados</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800;">$${formatCLP(valorFlete)} (${getPct(valorFlete)}%)</td>
                                        </tr>
                                        <tr style="background-color: #d1fae5; font-weight: bold;">
                                            <td style="padding: 4px 5px; color: #064e3b;">TOTAL INGRESOS FACTURABLES:</td>
                                            <td style="padding: 4px 5px; text-align: right; font-weight: 900; color: #064e3b; font-size: 10.5px;">$${formatCLP(totalVenta)} (100%)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Costos -->
                            <div style="border: 1px solid #cbd5e1; margin-bottom: 6px; background-color: #ffffff;">
                                <div style="background-color: #f8fafc; padding: 4px 6px; font-weight: 800; color: #0f172a; font-size: 9.5px; border-bottom: 1px solid #cbd5e1;">
                                    B. RESUMEN DE COSTOS OPERACIONALES (EGRESOS)
                                </div>
                                <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                                    <thead>
                                        <tr style="background-color: #f1f5f9; color: #0f172a; font-size: 9px; font-weight: 800; text-transform: uppercase;">
                                            <th style="padding: 3px 5px; text-align: left;">Concepto</th>
                                            <th style="padding: 3px 5px; text-align: right;">Monto ($)</th>
                                            <th style="padding: 3px 5px; text-align: right;">% s/ Venta</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">1. Viáticos Alimentación</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totAlim)}</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totAlim)}%</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">2. Peajes y Tag</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totPeajes)}</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totPeajes)}%</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">3. Pensiones y Alojamiento</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totPension)}</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totPension)}%</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">4. Movilización Personal</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totMovil)}</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totMovil)}%</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">5. Personal Externo y Feriados</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totPext + totFeriados)}</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totPext + totFeriados)}%</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">6. Subcontratación Flete Externo</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totSubcont)}</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totSubcont)}%</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">7. Gastos Extraordinarios</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totExtra)}</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totExtra)}%</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 3px 5px; color: #0f172a; font-weight: bold;">8. Costo Valor Hora Operador</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #0f172a;">$${formatCLP(totCostoOperadores)}</td>
                                            <td style="padding: 3px 5px; text-align: right; font-weight: 800; color: #64748b;">${getPct(totCostoOperadores)}%</td>
                                        </tr>
                                        <tr style="background-color: #fef3c7; font-weight: bold;">
                                            <td style="padding: 4px 5px; color: #92400e;">TOTAL COSTOS OPERACIONALES:</td>
                                            <td style="padding: 4px 5px; text-align: right; font-weight: 900; color: #92400e; font-size: 10.5px;">$${formatCLP(totalCostos)}</td>
                                            <td style="padding: 4px 5px; text-align: right; font-weight: 900; color: #92400e;">${getPct(totalCostos)}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Banner Resultado -->
                            <div style="padding: 6px 8px; border-radius: 4px; background-color: ${utilidad >= 0 ? '#ecfdf5' : '#fff1f2'}; border: 1px solid ${utilidad >= 0 ? '#a7f3d0' : '#fecdd3'}; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="font-size: 10px; font-weight: 800; color: ${utilidad >= 0 ? '#065f46' : '#9f1239'}; display: block;">RESULTADO DEL SERVICIO</strong>
                                    <span style="font-size: 9px; font-weight: 700; color: #1e293b;">Margen Operacional Neto</span>
                                </div>
                                <div style="text-align: right;">
                                    <strong style="font-size: 13.5px; font-weight: 900; color: ${utilidad >= 0 ? '#047857' : '#be123c'}; display: block;">$${formatCLP(utilidad)}</strong>
                                    <span style="font-size: 10px; font-weight: 800; color: ${utilidad >= 0 ? '#065f46' : '#9f1239'};">Margen: ${margen}%</span>
                                </div>
                            </div>
                        </td>
                        <td style="width: 42%; vertical-align: top; padding: 6px;">
                            <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 3px;">OBSERVACIÓN DEL SERVICIO:</div>
                            <div style="font-size: 9.5px; color: #0f172a; font-weight: 600; min-height: 140px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 7px; border-radius: 4px; white-space: pre-wrap; word-break: break-word; line-height: 1.45;">${obs ? String(obs).trim() : 'Sin observaciones registradas.'}</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 5. Sellos Oficiales de Firma Electrónica Simple (FES) y Gobernanza Tripartita (Spec 67) -->
        <div style="margin-top: 10px; page-break-inside: avoid;">
            <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">
                5. SELLOS OFICIALES DE FIRMA ELECTRÓNICA SIMPLE (FES) Y TRAZABILIDAD
            </div>
            <table style="width: 100%; border-collapse: separate; border-spacing: 5px 0; font-size: 9px; margin-left: -5px; margin-right: -5px;">
                <tbody>
                    <tr>
                        <!-- Columna 1: Elaboró (Secretaria / Analista) -->
                        <td style="width: 33.33%; vertical-align: top; border: ${firmasFes?.elaborador ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: ${firmasFes?.elaborador ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                            <div style="font-weight: 800; color: ${firmasFes?.elaborador ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid ${firmasFes?.elaborador ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                                <span>1. ELABORACIÓN</span>
                                <span>${firmasFes?.elaborador ? '✓ FES' : '⏳ PENDIENTE'}</span>
                            </div>
                            ${firmasFes?.elaborador ? `
                                <div style="font-size: 9px; font-weight: 800; color: #0f172a;">${firmasFes.elaborador.nombre || firmanteElaborado}</div>
                                <div style="font-size: 8px; color: #475569;">${firmasFes.elaborador.cargo || 'Analista / Secretaria'}</div>
                                <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">${firmasFes.elaborador.codigo_fes || 'FES-OK'}</div>
                                <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">${formatDateCL(firmasFes.elaborador.timestamp)}</div>
                            ` : `
                                <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">${firmanteElaborado}<br/>(Pendiente de firma)</div>
                            `}
                        </td>

                        <!-- Columna 2: Verificó (Administrador) -->
                        <td style="width: 33.33%; vertical-align: top; border: ${firmasFes?.verificador ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: ${firmasFes?.verificador ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                            <div style="font-weight: 800; color: ${firmasFes?.verificador ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid ${firmasFes?.verificador ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                                <span>2. VERIFICACIÓN (ADMINISTRADOR)</span>
                                <span>${firmasFes?.verificador ? '✓ FES' : '⏳ PENDIENTE'}</span>
                            </div>
                            ${firmasFes?.verificador ? `
                                <div style="font-size: 9px; font-weight: 800; color: #0f172a;">${firmasFes.verificador.nombre || firmanteAprobado}</div>
                                <div style="font-size: 8px; color: #475569;">${firmasFes.verificador.cargo || 'Administrador de Operaciones'}</div>
                                <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">${firmasFes.verificador.codigo_fes || 'FES-OK'}</div>
                                <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">${formatDateCL(firmasFes.verificador.timestamp)}</div>
                            ` : `
                                <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">${firmanteAprobado}<br/>(Pendiente de verificación)</div>
                            `}
                        </td>

                        <!-- Columna 3: Aprobó (Contabilidad) -->
                        <td style="width: 33.33%; vertical-align: top; border: ${firmasFes?.aprobador ? '1.5px solid #10b981' : '1px dashed #cbd5e1'}; background-color: ${firmasFes?.aprobador ? '#f0fdf4' : '#f8fafc'}; border-radius: 4px; padding: 6px;">
                            <div style="font-weight: 800; color: ${firmasFes?.aprobador ? '#047857' : '#64748b'}; text-transform: uppercase; font-size: 8px; border-bottom: 1px solid ${firmasFes?.aprobador ? '#a7f3d0' : '#e2e8f0'}; padding-bottom: 3px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                                <span>3. APROBACIÓN (CONTABILIDAD)</span>
                                <span>${firmasFes?.aprobador ? '✓ FES' : '⏳ PENDIENTE'}</span>
                            </div>
                            ${firmasFes?.aprobador ? `
                                <div style="font-size: 9px; font-weight: 800; color: #0f172a;">${firmasFes.aprobador.nombre || firmanteRecibido}</div>
                                <div style="font-size: 8px; color: #475569;">${firmasFes.aprobador.cargo || 'Contabilidad y Finanzas'}</div>
                                <div style="font-size: 7.5px; color: #0369a1; font-family: monospace; font-weight: bold; margin-top: 2px;">${firmasFes.aprobador.codigo_fes || 'FES-OK'}</div>
                                <div style="font-size: 7.5px; color: #64748b; margin-top: 1px;">${formatDateCL(firmasFes.aprobador.timestamp)}</div>
                            ` : `
                                <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; padding: 8px 0; text-align: center;">${firmanteRecibido}<br/>(Pendiente de aprobación)</div>
                            `}
                        </td>
                    </tr>
                </tbody>
            </table>
            ${historialObs && historialObs.length > 0 ? `
                <div style="margin-top: 6px; padding: 5px 8px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; font-size: 7.5px; color: #92400e;">
                    <strong>BITÁCORA DE OBSERVACIONES Y DEVOLUCIONES RESUELTAS:</strong>
                    ${historialObs.map(o => `<div>• <strong>${o.nombre_usuario || o.rol}:</strong> "${o.observaciones}" (${formatDateCL(o.fecha)})</div>`).join('')}
                </div>
            ` : ''}
        </div>

        ${autoPrint ? `
        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.focus();
                    window.print();
                }, 300);
            };
        <\/script>
        ` : ''}
    </body>
    </html>
  `

  return docHtml
}

const abrirVentanaImpresionOficial = (targetInf = null) => {
  autoguardarObservaciones()
  const docHtml = generarHtmlDocumentoOficial(targetInf, true)
  const printWin = window.open('', '_blank', 'width=1050,height=850')
  if (!printWin) {
    alert('Por favor permita ventanas emergentes para visualizar/imprimir el PDF.')
    return
  }
  printWin.document.open()
  printWin.document.write(docHtml)
  printWin.document.close()

  setTimeout(() => {
    try {
      printWin.focus()
      printWin.print()
    } catch (e) {
      console.warn('Error al ejecutar impresión automática:', e)
    }
  }, 450)
}

const generarPdfOficial = () => {
  abrirVentanaImpresionOficial()
}

// =========================================================================
// FILTROS Y KPIS DE CONTROL
// =========================================================================

const informesFiltrados = computed(() => {
  if (filtroEstado.value === 'TODOS') return informesHistorial.value
  if (filtroEstado.value === 'OBSERVADO') {
    return informesHistorial.value.filter(i => i.estado === 'OBSERVADO' || i.estado === 'OBSERVADO_ADMIN' || i.estado === 'OBSERVADO_CONTABILIDAD')
  }
  return informesHistorial.value.filter(i => i.estado === filtroEstado.value)
})

const contarPorEstado = (st) => {
  return informesHistorial.value.filter(i => i.estado === st).length
}

const contarPorObservados = () => {
  return informesHistorial.value.filter(i => i.estado === 'OBSERVADO' || i.estado === 'OBSERVADO_ADMIN' || i.estado === 'OBSERVADO_CONTABILIDAD').length
}

const kpisControl = computed(() => {
  const totVenta = informesHistorial.value.reduce((s, i) => s + (i.total_venta || 0), 0)
  const totCostos = informesHistorial.value.reduce((s, i) => s + (i.total_costos || 0), 0)
  const pctCostos = totVenta > 0 ? ((totCostos / totVenta) * 100).toFixed(1) : '0.0'
  const margen = totVenta > 0 ? (((totVenta - totCostos) / totVenta) * 100).toFixed(1) : '0.0'

  return {
    totalVenta: totVenta,
    totalCostos: totCostos,
    pctCostos,
    margenPonderado: margen
  }
})

const getEstadoBadgeClase = (st) => {
  if (st === 'APROBADO' || st === 'APROBADO_CONTABILIDAD') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  if (st === 'PENDIENTE_VERIFICACION') return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  if (st === 'PENDIENTE_CONTABILIDAD') return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  if (st === 'OBSERVADO' || st === 'OBSERVADO_ADMIN' || st === 'OBSERVADO_CONTABILIDAD') return 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  return 'bg-amber-500/10 text-amber-300 border-amber-500/30'
}

// =========================================================================
// CICLO DE VIDA Y CARGA INICIAL
// =========================================================================

onMounted(async () => {
  // Detectar rol y usuario en sesión
  detectarRolUsuario()

  // Cargar historial persistente desde PostgreSQL en el servidor (con fallback local)
  await cargarHistorialDesdeServidor()

  // Precargar planillas persistentes de GeraldSoft desde PostgreSQL (SPEC-068)
  await cargarPlanillasPersistentes()

  // Detección de deep link oficial para auto-apertura e impresión de PDF o carga directa
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const queryFolio = urlParams.get('folio')
    const queryCot = urlParams.get('cot')
    const queryId = urlParams.get('id')
    const queryAccion = urlParams.get('accion')

    if (queryFolio || queryCot || queryId) {
      const matchInf = informesHistorial.value.find(i => 
        (queryId && String(i.id_transicion) === String(queryId)) ||
        (queryFolio && i.folio_its === queryFolio) ||
        (queryCot && String(i.numero_cotizacion) === String(queryCot))
      )
      if (matchInf) {
        cargarInformeParaEdicion(matchInf)
        if (queryAccion === 'imprimir') {
          setTimeout(() => {
            abrirVentanaImpresionOficial(matchInf)
          }, 700)
        }
      }
    }
  } catch (err) {
    console.warn('Error procesando parámetros URL:', err)
  }

  // Si no hay datos cargados, inicializar con plantilla limpia
  if (!informe.cliente_nombre) {
    informe.folio_its = 'ITS-3259'
    informe.numero_cotizacion = '3259'
    informe.version = 1
    informe.cliente_nombre = 'CHINA FIRST HIGHWAY ENG CO LTDA AGENCIA CHILE'
    informe.cliente_rut = '59.233.410-0'
    informe.empresa_facturacion = 'BESTMAQ'
    informe.ejecutivo_comercial = 'MARCELO REYES'
    informe.ciudad_obra = 'SANTA BÁRBARA'
    informe.tipo_servicio = 'HORA / FLETE'
    informe.regimen_operacional = 'SERVICIO RURAL'
    informe.fecha_inicio = '2026-09-21'
    informe.fecha_termino = '2026-09-24'
    informe.total_dias = 4
    informe.valor_fijo = 0
    informe.valor_flete = 4400000

    informe.equipos = [
      { patente: 'TYGC45', subcategoria: 'GRUA 75 TON', horas_minimas: '11 HORAS DIARIAS', valor_hora: 85000, ots_asociadas: 'OT 64717, OT 64718, OT 64770', personal_tripulacion: 'Op: CLAUDIO GALLARDO' },
      { patente: 'VCTR81', subcategoria: 'GRUA 50 TON', horas_minimas: '11 HORAS DIARIAS', valor_hora: 75000, ots_asociadas: 'OT 64719', personal_tripulacion: 'Op: NICOLAS CEBALLOS' },
      { patente: 'DXGG17', subcategoria: 'TRACTOCAMION', horas_minimas: 'N/A', valor_hora: 0, ots_asociadas: 'OT 64720, OT 64771', personal_tripulacion: 'Chofer: DANIEL SEPULVEDA' }
    ]

    informe.jornadas = [
      { fecha: '2026-09-21', numero_ot: '64718', tipo_servicio: 'Flete Solo Ida', patente: 'TYGC45', hora_salida: '06:04', hora_llegada: '07:25', hora_termino: '00:00', hora_retorno: '00:00', colacion: '00:00', horas_reales_texto: '1h 21m', horas_report: 1.1, numero_report: '135508' },
      { fecha: '2026-09-21', numero_ot: '64717', tipo_servicio: 'Hora', patente: 'TYGC45', hora_salida: '07:25', hora_llegada: '07:25', hora_termino: '19:00', hora_retorno: '19:00', colacion: '01:00', horas_reales_texto: '10h 35m', horas_report: 11.0, numero_report: '135509' },
      { fecha: '2026-09-22', numero_ot: '64717', tipo_servicio: 'Hora', patente: 'TYGC45', hora_salida: '07:00', hora_llegada: '07:00', hora_termino: '19:08', hora_retorno: '19:08', colacion: '01:00', horas_reales_texto: '11h 8m', horas_report: 11.0, numero_report: '135510' },
      { fecha: '2026-09-23', numero_ot: '64717', tipo_servicio: 'Hora', patente: 'TYGC45', hora_salida: '07:07', hora_llegada: '07:07', hora_termino: '19:45', hora_retorno: '19:45', colacion: '01:00', horas_reales_texto: '11h 38m', horas_report: 11.0, numero_report: '135511' },
      { fecha: '2026-09-24', numero_ot: '64717', tipo_servicio: 'Hora', patente: 'TYGC45', hora_salida: '07:06', hora_llegada: '07:06', hora_termino: '16:27', hora_retorno: '16:27', colacion: '01:00', horas_reales_texto: '8h 21m', horas_report: 11.0, numero_report: '135512' },
      { fecha: '2026-09-21', numero_ot: '64719', tipo_servicio: 'Hora', patente: 'VCTR81', hora_salida: '07:25', hora_llegada: '07:25', hora_termino: '19:00', hora_retorno: '19:00', colacion: '01:00', horas_reales_texto: '10h 35m', horas_report: 11.0, numero_report: '76865' },
      { fecha: '2026-09-22', numero_ot: '64719', tipo_servicio: 'Hora', patente: 'VCTR81', hora_salida: '07:00', hora_llegada: '07:00', hora_termino: '18:57', hora_retorno: '18:57', colacion: '01:00', horas_reales_texto: '10h 57m', horas_report: 11.0, numero_report: '76866' },
      { fecha: '2026-09-23', numero_ot: '64719', tipo_servicio: 'Hora', patente: 'VCTR81', hora_salida: '07:07', hora_llegada: '07:07', hora_termino: '18:50', hora_retorno: '18:50', colacion: '01:00', horas_reales_texto: '10h 43m', horas_report: 11.0, numero_report: '76867' },
      { fecha: '2026-09-24', numero_ot: '64719', tipo_servicio: 'Hora', patente: 'VCTR81', hora_salida: '07:02', hora_llegada: '07:02', hora_termino: '16:25', hora_retorno: '16:25', colacion: '01:00', horas_reales_texto: '8h 23m', horas_report: 11.0, numero_report: '76868' }
    ]

    costos.peajes = [
      { fecha: '2026-10-20', patente: 'DXGG17', personal: 'DANIEL SEPULVEDA', detalle: 'Peaje Troncal Púa/ IDA A LOS ANGELES "NO REEMBOLSAR"', monto: 11400, es_no_reembolsar: true },
      { fecha: '2026-10-20', patente: 'DXGG17', personal: 'DANIEL SEPULVEDA', detalle: 'Peaje Troncal Las Maicas/ IDA A LOS ANGELES "NO REEMBOLSAR"', monto: 11800, es_no_reembolsar: true },
      { fecha: '2026-10-24', patente: 'DXGG17', personal: 'DANIEL SEPULVEDA', detalle: 'Peaje Troncal Las Maicas/ RETORNO A TEMUCO "NO REEMBOLSAR"', monto: 11800, es_no_reembolsar: true },
      { fecha: '2026-10-24', patente: 'DXGG17', personal: 'DANIEL SEPULVEDA', detalle: 'Peaje Troncal Púa/ RETORNO A TEMUCO "NO REEMBOLSAR"', monto: 11400, es_no_reembolsar: true }
    ]

    costos.pensiones = [
      { fecha: '2026-09-21', personal: 'NICOLAS CEBALLOS', desayuno: 4000, almuerzo: 0, cena: 4000, alojamiento: 14000, traslado: 0 },
      { fecha: '2026-09-21', personal: 'CLAUDIO GALLARDO', desayuno: 4000, almuerzo: 0, cena: 4000, alojamiento: 14000, traslado: 0 },
      { fecha: '2026-09-22', personal: 'NICOLAS CEBALLOS', desayuno: 4000, almuerzo: 0, cena: 4000, alojamiento: 14000, traslado: 0 },
      { fecha: '2026-09-22', personal: 'CLAUDIO GALLARDO', desayuno: 4000, almuerzo: 0, cena: 4000, alojamiento: 14000, traslado: 0 },
      { fecha: '2026-09-23', personal: 'NICOLAS CEBALLOS', desayuno: 4000, almuerzo: 0, cena: 10000, alojamiento: 14000, traslado: 0 },
      { fecha: '2026-09-23', personal: 'CLAUDIO GALLARDO', desayuno: 4000, almuerzo: 0, cena: 10000, alojamiento: 14000, traslado: 0 },
      { fecha: '2026-09-24', personal: 'NICOLAS CEBALLOS', desayuno: 4000, almuerzo: 0, cena: 0, alojamiento: 0, traslado: 0 },
      { fecha: '2026-09-24', personal: 'CLAUDIO GALLARDO', desayuno: 4000, almuerzo: 0, cena: 0, alojamiento: 0, traslado: 0 }
    ]
    costos.pensiones_oc = '645-646'

    informe.observaciones_servicio = 'SERVICIO GRUAS DE 75T-50T- SERVICIO SIN RIGGER GRUA DE 50T SE TRASLADA A LOS ANGELES Y RETORNA A TEMUCO EN CAMA BAJA PPU JH8534, OPERADORES VIAJAN EN MISMO CAMIÓN DE TRASLADO (TRACTOCAMION DANIEL SEPULVEDA).\n\n440KM ESTIMADOS- 360 KM RECORRIDOS SEGUN GPS SEGUIMIENTO TRACTOCAMION\n100 KM ESTIMADOS- 127 KM RECORRIDOS GRÚA DESDE Y HASTA SUCURSAL LOS ANGELES (IDA Y VUELTA)\n\nCLIENTE PROVEE ALMUERZO POR LO QUE NO SE CONSIDERAN CALCULOS DE VIATICO.\nSAN PABLO PROVEE DESAYUNO, CENA Y ALOJAMIENTO.\nGRUA DE 75T ESTABA Y CONTINUA EN SUCURSAL LOS ANGELES\nVALOR HORA OPERADOR SE CALCULA EN BASE A HORAS REPORT.\nOPERADORES LLEGAN EL DÍA 20 EN LA NOCHE A PENSIÓN LOS ANGELES, AL DIA SIGUIENTE CONTINUAN EN PENSIÓN DE MULCHEN.'
  }
})
</script>

<style scoped>
@media print {
  body {
    background: white !important;
    color: black !important;
  }
  .print-section {
    break-inside: avoid;
    page-break-inside: avoid;
    background: white !important;
    border-color: #cbd5e1 !important;
    color: black !important;
  }
}
</style>
