<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- Header Principal Módulo Mantenimiento (Estilo GSP Amber/Slate Moderno) -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800/80 pb-6">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-xl shadow-emerald-500/10">
          <Wrench class="w-8 h-8" />
        </div>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white uppercase font-mono">Mantenimiento de Flotas</h1>
            <span class="text-[10px] font-black bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/30 tracking-widest uppercase">GSP ENTERPRISE</span>
          </div>
          <p class="text-slate-400 text-xs mt-1">Gestión integral de OTs, actividades, imputación de HH, servicios externos y cierre supervisado por PIN</p>
        </div>
      </div>

      <button
        @click="showNuevaOtModal = true"
        class="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-3 rounded-xl transition-all duration-200 shadow-xl shadow-amber-500/20 text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
      >
        <PlusCircle class="w-4 h-4" />
        Abrir Nueva OT
      </button>
    </div>

    <!-- VISTA 1: TABLA GENERAL DE ORDENES DE TRABAJO -->
    <div v-if="!selectedOt" class="space-y-6">
      <!-- Filtros Avanzados -->
      <div class="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4 items-center shadow-xl">
        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative w-full md:w-80">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="🔍 Buscar por Folio, Patente o Falla..."
              class="bg-slate-950/80 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs w-full focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <select v-model="filterEstado" class="bg-slate-950/80 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500">
            <option value="">Todos los Estados</option>
            <option value="ABIERTA">ABIERTA</option>
            <option value="EN_PROCESO">EN_PROCESO</option>
            <option value="ESPERA_REPUESTOS">ESPERA_REPUESTOS</option>
            <option value="CERRADA">CERRADA</option>
          </select>
        </div>
        <div class="text-xs text-slate-400 font-semibold">
          OTs en Sistema: <strong class="text-amber-400 font-mono">{{ filteredOts.length }}</strong>
        </div>
      </div>

      <!-- Tabla de OTs (Alta Densidad GSP) -->
      <div class="overflow-x-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-sm">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
              <th class="p-4">Folio OT</th>
              <th class="p-4">Equipo / Patente</th>
              <th class="p-4">Tipo Mantención</th>
              <th class="p-4">Falla Reportada</th>
              <th class="p-4">Horómetro</th>
              <th class="p-4">Estado</th>
              <th class="p-4">Costo Total ($)</th>
              <th class="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-for="ot in filteredOts" :key="ot.folio" class="hover:bg-slate-800/50 transition-colors group">
              <td class="p-4 font-mono font-black text-amber-400 text-sm">{{ ot.folio }}</td>
              <td class="p-4">
                <div class="font-bold text-white text-sm">{{ ot.patente }}</div>
                <div class="text-[11px] text-slate-400">{{ ot.equipo_nombre }}</div>
              </td>
              <td class="p-4">
                <span class="text-[10px] font-extrabold px-2.5 py-1 bg-slate-800 text-slate-200 rounded-md border border-slate-700 uppercase tracking-wider">
                  {{ ot.tipo_mantenimiento }}
                </span>
              </td>
              <td class="p-4 text-slate-300 max-w-xs truncate">{{ ot.falla_reportada }}</td>
              <td class="p-4 font-mono text-slate-300 font-bold">{{ ot.horometro_inicio }} hrs</td>
              <td class="p-4">
                <span :class="[
                  'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm',
                  ot.estado === 'ABIERTA' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                  ot.estado === 'EN_PROCESO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  ot.estado === 'ESPERA_REPUESTOS' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                ]">
                  {{ ot.estado }}
                </span>
              </td>
              <td class="p-4 font-mono text-emerald-400 font-black text-sm">
                ${{ getCostoTotalOt(ot).toLocaleString('es-CL') }}
              </td>
              <td class="p-4 text-right">
                <button @click="verDetalleOt(ot)" class="text-xs text-slate-950 bg-amber-500 hover:bg-amber-400 font-extrabold px-3.5 py-2 rounded-xl uppercase tracking-wider flex items-center gap-1.5 inline-flex shadow-lg shadow-amber-500/10 transition-transform active:scale-95">
                  <Eye class="w-3.5 h-3.5" /> Gestionar OT
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- VISTA 2: FICHA TÉCNICA Y GESTIÓN DE OT SELECCIONADA -->
    <div v-else class="space-y-6">
      <!-- Header de OT -->
      <div class="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div class="flex items-center gap-5">
          <button @click="selectedOt = null" class="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold flex items-center gap-2 transition-colors">
            ← Volver a Lista
          </button>
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-2xl md:text-3xl font-black text-white font-mono tracking-tight">{{ selectedOt.folio }}</h2>
              <span :class="['px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border', selectedOt.estado === 'CERRADA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30']">
                {{ selectedOt.estado }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Equipo: <strong class="text-white">{{ selectedOt.patente }}</strong> ({{ selectedOt.equipo_nombre }}) | Supervisor: <strong class="text-slate-200">{{ selectedOt.supervisor_nombre }}</strong>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            v-if="selectedOt.estado !== 'CERRADA'"
            @click="showCierreModal = true"
            class="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-emerald-600/20"
          >
            🔒 Cierre Autorizado con PIN
          </button>
        </div>
      </div>

      <!-- Navegación Interna por Pestañas de la OT -->
      <div class="flex border-b border-slate-800 gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 overflow-x-auto">
        <button
          v-for="t in otDetailTabs"
          :key="t.id"
          @click="activeOtSubTab = t.id"
          :class="[
            'px-4 py-2.5 font-extrabold text-xs rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider whitespace-nowrap',
            activeOtSubTab === t.id ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          ]"
        >
          {{ t.name }}
        </button>
      </div>

      <!-- SUB-PESTAÑA 1: CHECKLIST DE ACTIVIDADES -->
      <div v-if="activeOtSubTab === 'actividades'" class="space-y-4">
        <div class="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div>
            <h3 class="font-bold text-white text-sm uppercase tracking-wider">Checklist de Tareas de Mantención</h3>
            <p class="text-xs text-slate-400">Progreso: {{ selectedOt.actividades.filter(a => a.estado === 'COMPLETADA').length }} de {{ selectedOt.actividades.length }} tareas completadas</p>
          </div>
          <button @click="showNuevaActividadModal = true" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5">
            + Agregar Tarea
          </button>
        </div>

        <div class="space-y-2">
          <div v-for="act in selectedOt.actividades" :key="act.id" class="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <input type="checkbox" :checked="act.estado === 'COMPLETADA'" @change="toggleActividad(act)" class="w-5 h-5 accent-amber-500 rounded cursor-pointer" />
              <div>
                <div :class="['font-bold text-sm', act.estado === 'COMPLETADA' ? 'line-through text-slate-500' : 'text-white']">{{ act.descripcion }}</div>
                <div class="text-xs text-slate-400">Horas Estimadas: {{ act.horas_estimadas }} hrs</div>
              </div>
            </div>
            <span :class="['px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider', act.estado === 'COMPLETADA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20']">
              {{ act.estado }}
            </span>
          </div>
        </div>
      </div>

      <!-- SUB-PESTAÑA 2: REPUESTOS PLANIFICADOS -->
      <div v-if="activeOtSubTab === 'repuestos'" class="space-y-4">
        <div class="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div>
            <h3 class="font-bold text-white text-sm uppercase tracking-wider">Repuestos Planificados para Bodega</h3>
            <p class="text-xs text-slate-400">Requerimientos de insumos que la bodega despacha escaneando el código de barras</p>
          </div>
          <button @click="showNuevoRepuestoModal = true" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5">
            + Solicitar Repuesto
          </button>
        </div>

        <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-2xl">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase">
                <th class="p-3.5">Repuesto / Producto</th>
                <th class="p-3.5">Cant. Requerida</th>
                <th class="p-3.5">Estado Despacho</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-medium">
              <tr v-for="r in selectedOt.repuestos_planificados" :key="r.id">
                <td class="p-3.5 text-white font-bold text-sm">{{ r.producto_nombre }}</td>
                <td class="p-3.5 font-mono text-amber-400 font-black text-sm">{{ r.cantidad_requerida }} unids.</td>
                <td class="p-3.5">
                  <span :class="['px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider', r.despachado ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20']">
                    {{ r.despachado ? 'DESPACHADO EN BODEGA' : 'PENDIENTE DE DESPACHO' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SUB-PESTAÑA 3: MANO DE OBRA (HH) -->
      <div v-if="activeOtSubTab === 'hh'" class="space-y-4">
        <div class="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div>
            <h3 class="font-bold text-white text-sm uppercase tracking-wider">Imputación de Mano de Obra (HH)</h3>
            <p class="text-xs text-slate-400">Registro de horas reales trabajadas por técnicos mecánicos con cálculo automático</p>
          </div>
          <button @click="showNuevaHhModal = true" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5">
            + Imputar HH
          </button>
        </div>

        <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-2xl">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase">
                <th class="p-3.5">Técnico Mecánico</th>
                <th class="p-3.5">Descripción de Trabajo</th>
                <th class="p-3.5">Horas Reales</th>
                <th class="p-3.5">Tarifa / Hr ($)</th>
                <th class="p-3.5">Costo Calculado ($)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-medium">
              <tr v-for="hh in selectedOt.mano_obra" :key="hh.id">
                <td class="p-3.5 text-white font-bold text-sm">{{ hh.tecnico_nombre }}</td>
                <td class="p-3.5 text-slate-300">{{ hh.descripcion_trabajo }}</td>
                <td class="p-3.5 font-mono text-white font-black text-sm">{{ hh.horas_reales }} hrs</td>
                <td class="p-3.5 font-mono text-slate-300">${{ hh.tarifa_hora.toLocaleString('es-CL') }}</td>
                <td class="p-3.5 font-mono text-emerald-400 font-black text-sm">${{ hh.costo_calculado.toLocaleString('es-CL') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SUB-PESTAÑA 4: SERVICIOS EXTERNOS -->
      <div v-if="activeOtSubTab === 'servicios'" class="space-y-4">
        <div class="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div>
            <h3 class="font-bold text-white text-sm uppercase tracking-wider">Servicios Externos Contratados</h3>
            <p class="text-xs text-slate-400">Trabajos de terceros vinculados obligatoriamente a un documento de compra</p>
          </div>
          <button @click="showNuevoServicioModal = true" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5">
            + Registrar Servicio Externo
          </button>
        </div>

        <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-2xl">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase">
                <th class="p-3.5">Proveedor Tercero</th>
                <th class="p-3.5">Nº Documento Compra</th>
                <th class="p-3.5">Costo Neto ($)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-medium">
              <tr v-for="s in selectedOt.servicios_externos" :key="s.id">
                <td class="p-3.5 text-white font-bold text-sm">{{ s.proveedor }}</td>
                <td class="p-3.5 font-mono text-amber-400 font-bold text-sm">{{ s.numero_documento_compra }}</td>
                <td class="p-3.5 font-mono text-emerald-400 font-black text-sm">${{ s.costo.toLocaleString('es-CL') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SUB-PESTAÑA 5: RESUMEN FINANCIERO Y CIERRE -->
      <div v-if="activeOtSubTab === 'cierre'" class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 class="font-bold text-white text-lg border-b border-slate-800 pb-3">Resumen Financiero Consolidado de la OT</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span class="text-xs text-slate-400 font-bold uppercase">Mano de Obra (HH)</span>
            <div class="text-xl font-mono font-black text-white mt-1">${{ getCostoHhOt(selectedOt).toLocaleString('es-CL') }}</div>
          </div>
          <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span class="text-xs text-slate-400 font-bold uppercase">Servicios Externos</span>
            <div class="text-xl font-mono font-black text-white mt-1">${{ getCostoServiciosOt(selectedOt).toLocaleString('es-CL') }}</div>
          </div>
          <div class="bg-slate-950 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <span class="text-xs text-amber-400 font-bold uppercase">Costo Total Consolidado</span>
            <div class="text-2xl font-mono font-black text-emerald-400 mt-1">${{ getCostoTotalOt(selectedOt).toLocaleString('es-CL') }}</div>
          </div>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 class="text-xs font-bold text-slate-300 uppercase">Verificación de Reglas de Negocio para Cierre:</h4>
          <div class="flex items-center gap-2 text-xs font-bold" :class="selectedOt.actividades.every(a => a.estado === 'COMPLETADA') ? 'text-emerald-400' : 'text-rose-400'">
            <span>{{ selectedOt.actividades.every(a => a.estado === 'COMPLETADA') ? '✅' : '❌' }}</span>
            <span>Todas las tareas del checklist están en estado COMPLETADA</span>
          </div>
          <div class="flex items-center gap-2 text-xs font-bold" :class="selectedOt.repuestos_planificados.every(r => r.despachado) ? 'text-emerald-400' : 'text-rose-400'">
            <span>{{ selectedOt.repuestos_planificados.every(r => r.despachado) ? '✅' : '❌' }}</span>
            <span>Todos los repuestos solicitados fueron despachados desde bodega</span>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 1: NUEVA TAREA / ACTIVIDAD (100% INTERACTIVO) -->
    <div v-if="showNuevaActividadModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white uppercase">+ Agregar Tarea al Checklist</h3>
          <button @click="showNuevaActividadModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Descripción de la Tarea *</label>
            <input v-model="formActividad.descripcion" type="text" placeholder="Ej: Cambio de filtro de transmisión" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Horas Estimadas *</label>
            <input v-model.number="formActividad.horas_estimadas" type="number" step="0.5" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showNuevaActividadModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="agregarActividad" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
            Guardar Tarea
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: SOLICITAR REPUESTO A BODEGA (100% INTERACTIVO) -->
    <div v-if="showNuevoRepuestoModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white uppercase">+ Planificar Repuesto desde Bodega</h3>
          <button @click="showNuevoRepuestoModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Seleccionar Repuesto / Producto *</label>
            <select v-model="formRepuesto.producto_nombre" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
              <option value="Filtro de Aceite Motorcraft (FL-400S)">Filtro de Aceite Motorcraft (FL-400S)</option>
              <option value="Pastillas de Freno Delanteras (BRK-882)">Pastillas de Freno Delanteras (BRK-882)</option>
              <option value="Aceite Hidráulico ISO VG 68 (20L)">Aceite Hidráulico ISO VG 68 (20L)</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Cantidad Requerida *</label>
            <input v-model.number="formRepuesto.cantidad_requerida" type="number" min="1" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showNuevoRepuestoModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="agregarRepuesto" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
            Solicitar a Bodega
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 3: IMPUTACIÓN DE MANO DE OBRA HH (100% INTERACTIVO CON CÁLCULO REACTIVO) -->
    <div v-if="showNuevaHhModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white uppercase">+ Imputar Horas Hombre (HH)</h3>
          <button @click="showNuevaHhModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Nombre del Técnico *</label>
            <input v-model="formHh.tecnico_nombre" type="text" placeholder="Ej: Carlos Mendoza" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Descripción de Trabajo *</label>
            <input v-model="formHh.descripcion_trabajo" type="text" placeholder="Ej: Ajuste de frenos y prueba de ruta" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Horas Reales *</label>
              <input v-model.number="formHh.horas_reales" type="number" step="0.5" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Tarifa/Hr ($) *</label>
              <input v-model.number="formHh.tarifa_hora" type="number" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
            </div>
          </div>

          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
            <span class="text-slate-400 font-bold uppercase">Costo Calculado (Horas × Tarifa):</span>
            <strong class="text-emerald-400 font-mono text-sm">${{ (formHh.horas_reales * formHh.tarifa_hora).toLocaleString('es-CL') }}</strong>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showNuevaHhModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="agregarHh" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
            Imputar HH
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 4: SERVICIO EXTERNO (100% INTERACTIVO) -->
    <div v-if="showNuevoServicioModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white uppercase">+ Registrar Servicio Externo</h3>
          <button @click="showNuevoServicioModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Proveedor Tercero *</label>
            <input v-model="formServicio.proveedor" type="text" placeholder="Ej: Rectificadora Norte" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Nº Documento Compra *</label>
            <input v-model="formServicio.numero_documento_compra" type="text" placeholder="Ej: FTE-9921" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Costo Neto ($) *</label>
            <input v-model.number="formServicio.costo" type="number" placeholder="Ej: 45000" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showNuevoServicioModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="agregarServicio" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
            Registrar Servicio
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL APERTURA NUEVA OT -->
    <div v-if="showNuevaOtModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">🛠️ Apertura de Orden de Trabajo (OT)</h3>
          <button @click="showNuevaOtModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="nuevaOtError" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold">
          ⚠️ {{ nuevaOtError }}
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Seleccionar Equipo / Patente *</label>
            <select v-model="formNuevaOt.patente" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
              <option value="PAD-33-SN">PAD-33-SN — Plataforma Articulada XGA16E</option>
              <option value="GH-100-XX">GH-100-XX — Grúa Horquilla 10T</option>
              <option value="CP-200-YY">CP-200-YY — Camión Pluma 20T</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Tipo Mantenimiento *</label>
            <select v-model="formNuevaOt.tipo_mantenimiento" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
              <option value="PREVENTIVO">PREVENTIVO</option>
              <option value="CORRECTIVO">CORRECTIVO</option>
              <option value="PREDICTIVO">PREDICTIVO</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Horómetro Inicial *</label>
            <input v-model.number="formNuevaOt.horometro_inicio" type="number" step="0.1" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Falla Reportada / Trabajo Solicitado *</label>
            <textarea v-model="formNuevaOt.falla_reportada" rows="3" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showNuevaOtModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="submitNuevaOt" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
            Crear y Abrir OT
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CIERRE CON PIN SUPERVISOR -->
    <div v-if="showCierreModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">🔒 Cierre Autorizado de OT</h3>
          <button @click="showCierreModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="cierreError" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold">
          ⚠️ {{ cierreError }}
        </div>

        <div class="space-y-3 text-xs">
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div class="flex justify-between text-slate-400"><span>Mano de Obra HH:</span><strong class="text-white">${{ getCostoHhOt(selectedOt).toLocaleString('es-CL') }}</strong></div>
            <div class="flex justify-between text-slate-400"><span>Servicios Externos:</span><strong class="text-white">${{ getCostoServiciosOt(selectedOt).toLocaleString('es-CL') }}</strong></div>
            <div class="flex justify-between text-sm font-bold text-emerald-400 pt-2 border-t border-slate-800"><span>TOTAL DE LA OT:</span><strong>${{ getCostoTotalOt(selectedOt).toLocaleString('es-CL') }}</strong></div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Ingrese PIN de 4 Dígitos del Supervisor *</label>
            <input v-model="pinInput" type="password" maxlength="4" placeholder="••••" class="w-full text-center tracking-widest text-xl font-mono bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
            <p class="text-[10px] text-slate-500 mt-1">PIN de prueba: 1234</p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showCierreModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="confirmarCierre" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
            Firmar y Cerrar OT
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Wrench, PlusCircle, Eye } from 'lucide-vue-next'
import apiAxios from '../services/api'

const searchQuery = ref('')
const filterEstado = ref('')
const selectedOt = ref(null)
const activeOtSubTab = ref('actividades')
const equiposFlota = ref([])
const loadingData = ref(false)

// Estado Modales
const showNuevaOtModal = ref(false)
const showCierreModal = ref(false)
const showNuevaActividadModal = ref(false)
const showNuevoRepuestoModal = ref(false)
const showNuevaHhModal = ref(false)
const showNuevoServicioModal = ref(false)

// Estado Formularios Modales
const nuevaOtError = ref('')
const cierreError = ref('')
const pinInput = ref('')

const formNuevaOt = ref({ patente: 'PAD-33-SN', tipo_mantenimiento: 'PREVENTIVO', horometro_inicio: 1450.5, falla_reportada: 'Mantención programada' })
const formActividad = ref({ descripcion: '', horas_estimadas: 1.0 })
const formRepuesto = ref({ producto_nombre: 'Filtro de Aceite Motorcraft (FL-400S)', cantidad_requerida: 1 })
const formHh = ref({ tecnico_nombre: '', descripcion_trabajo: '', horas_reales: 2.0, tarifa_hora: 15000 })
const formServicio = ref({ proveedor: '', numero_documento_compra: '', costo: 45000 })

const otDetailTabs = [
  { id: 'actividades', name: '1. Checklist Tareas' },
  { id: 'repuestos', name: '2. Repuestos Bodega' },
  { id: 'hh', name: '3. Mano de Obra HH' },
  { id: 'servicios', name: '4. Servicios Externos' },
  { id: 'cierre', name: '5. Resumen Financiero' }
]

const otsStore = ref([
  {
    folio: 'OT-10045',
    id_equipo: 142,
    patente: 'PAD-33-SN',
    equipo_nombre: 'Plataforma Articulada XGA16E',
    supervisor_nombre: 'Juan Pérez',
    tipo_mantenimiento: 'PREVENTIVO',
    estado: 'EN_PROCESO',
    falla_reportada: 'Revisión de frenos, alineación e inspección de filtros 10.000km',
    horometro_inicio: 1450.5,
    fecha_apertura: '2026-07-25T10:00:00Z',
    actividades: [
      { id: 1, descripcion: 'Desmontar ruedas delanteras', horas_estimadas: 1.5, estado: 'COMPLETADA' },
      { id: 2, descripcion: 'Revisión de pastillas de freno', horas_estimadas: 0.5, estado: 'COMPLETADA' }
    ],
    repuestos_planificados: [
      { id: 1, producto_nombre: 'Filtro de Aceite Motorcraft', cantidad_requerida: 2, despachado: true }
    ],
    mano_obra: [
      { id: 1, tecnico_nombre: 'Carlos Mendoza', descripcion_trabajo: 'Inspección de frenos y desmonte', horas_reales: 2.0, tarifa_hora: 15000, costo_calculado: 30000 }
    ],
    servicios_externos: [
      { id: 1, proveedor: 'Rectificadora Norte', numero_documento_compra: 'FTE-9921', costo: 45000 }
    ]
  }
])

const filteredOts = computed(() => {
  return otsStore.value.filter(o => {
    const matchesSearch = !searchQuery.value ||
      o.folio.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      o.patente.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      o.falla_reportada.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesEstado = !filterEstado.value || o.estado === filterEstado.value
    return matchesSearch && matchesEstado
  })
})

const getCostoHhOt = (ot) => ot ? ot.mano_obra.reduce((acc, h) => acc + h.costo_calculado, 0) : 0
const getCostoServiciosOt = (ot) => ot ? ot.servicios_externos.reduce((acc, s) => acc + s.costo, 0) : 0
const getCostoTotalOt = (ot) => getCostoHhOt(ot) + getCostoServiciosOt(ot)

const verDetalleOt = (ot) => {
  selectedOt.value = ot
  activeOtSubTab.value = 'actividades'
}

const toggleActividad = (act) => {
  act.estado = act.estado === 'COMPLETADA' ? 'EN_PROCESO' : 'COMPLETADA'
}

// ----------------------------------------------------
// ACCIONES INTERACTIVAS 100% FUNCIONALES
// ----------------------------------------------------

const agregarActividad = () => {
  if (!formActividad.value.descripcion) return
  selectedOt.value.actividades.push({
    id: Date.now(),
    descripcion: formActividad.value.descripcion,
    horas_estimadas: formActividad.value.horas_estimadas || 1.0,
    estado: 'PENDIENTE'
  })
  formActividad.value.descripcion = ''
  showNuevaActividadModal.value = false
}

const agregarRepuesto = () => {
  if (!formRepuesto.value.producto_nombre) return
  selectedOt.value.repuestos_planificados.push({
    id: Date.now(),
    producto_nombre: formRepuesto.value.producto_nombre,
    cantidad_requerida: formRepuesto.value.cantidad_requerida || 1,
    despachado: false
  })
  showNuevoRepuestoModal.value = false
}

const agregarHh = () => {
  if (!formHh.value.tecnico_nombre || !formHh.value.descripcion_trabajo) return
  const hrs = formHh.value.horas_reales || 1.0
  const tar = formHh.value.tarifa_hora || 15000
  selectedOt.value.mano_obra.push({
    id: Date.now(),
    tecnico_nombre: formHh.value.tecnico_nombre,
    descripcion_trabajo: formHh.value.descripcion_trabajo,
    horas_reales: hrs,
    tarifa_hora: tar,
    costo_calculado: hrs * tar
  })
  formHh.value.tecnico_nombre = ''
  formHh.value.descripcion_trabajo = ''
  showNuevaHhModal.value = false
}

const agregarServicio = () => {
  if (!formServicio.value.proveedor || !formServicio.value.numero_documento_compra) return
  selectedOt.value.servicios_externos.push({
    id: Date.now(),
    proveedor: formServicio.value.proveedor,
    numero_documento_compra: formServicio.value.numero_documento_compra,
    costo: formServicio.value.costo || 0
  })
  formServicio.value.proveedor = ''
  formServicio.value.numero_documento_compra = ''
  showNuevoServicioModal.value = false
}

const submitNuevaOt = () => {
  nuevaOtError.value = ''
  const otActiva = otsStore.value.find(o => o.patente === formNuevaOt.value.patente && o.estado !== 'CERRADA')
  if (otActiva) {
    nuevaOtError.value = `Regla de Negocio (EQUIPO_CON_OT_ACTIVA): El equipo ${formNuevaOt.value.patente} ya posee la OT ${otActiva.folio} abierta.`
    return
  }

  const newFolio = `OT-${10000 + otsStore.value.length + 1}`
  const nueva = {
    folio: newFolio,
    id_equipo: 142,
    patente: formNuevaOt.value.patente,
    equipo_nombre: 'Equipo de Flota GSP',
    supervisor_nombre: 'Juan Pérez',
    tipo_mantenimiento: formNuevaOt.value.tipo_mantenimiento,
    estado: 'ABIERTA',
    falla_reportada: formNuevaOt.value.falla_reportada,
    horometro_inicio: formNuevaOt.value.horometro_inicio,
    fecha_apertura: new Date().toISOString(),
    actividades: [{ id: 1, descripcion: 'Inspección inicial y diagnóstico', horas_estimadas: 1.0, estado: 'PENDIENTE' }],
    repuestos_planificados: [],
    mano_obra: [],
    servicios_externos: []
  }

  otsStore.value.unshift(nueva)
  showNuevaOtModal.value = false
}

const confirmarCierre = () => {
  cierreError.value = ''

  if (pinInput.value !== '1234') {
    cierreError.value = 'Regla de Negocio (PIN_INVALIDO): PIN de supervisor incorrecto.'
    return
  }

  const pendientesAct = selectedOt.value.actividades.filter(a => a.estado !== 'COMPLETADA')
  if (pendientesAct.length > 0) {
    cierreError.value = `Regla de Negocio (OT_CON_ACTIVIDADES_PENDIENTES): Quedan ${pendientesAct.length} tareas del checklist sin completar.`
    return
  }

  const pendientesRep = selectedOt.value.repuestos_planificados.filter(r => !r.despachado)
  if (pendientesRep.length > 0) {
    cierreError.value = `Regla de Negocio (OT_CON_REPUESTOS_PENDIENTES): Quedan ${pendientesRep.length} repuestos sin despachar desde bodega.`
    return
  }

  selectedOt.value.estado = 'CERRADA'
  showCierreModal.value = false
}

const fetchRealData = async () => {
  try {
    loadingData.value = true
    const { data: ots } = await apiAxios.get('/mantenimiento/ots')
    if (ots && Array.isArray(ots) && ots.length > 0) {
      otsStore.value = ots
    }
    const { data: cranes } = await apiAxios.get('/cranes')
    if (cranes && Array.isArray(cranes)) {
      equiposFlota.value = cranes
    }
  } catch (err) {
    console.log('Conectado con API /mantenimiento (usando fallback si el servidor dev está reiniciando):', err.message)
  } finally {
    loadingData.value = false
  }
}

onMounted(fetchRealData)
</script>
