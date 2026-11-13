<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- ENCABEZADO CANÓNICO COMPRAS & OCs MULTI-EMPRESA -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-3.5">
        <div class="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/5">
          <ShoppingCart class="w-7 h-7" />
        </div>
        <div>
          <div class="flex flex-wrap items-center gap-2.5">
            <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">
              Compras, Solicitudes de Pedido &amp; OCs Multi-Empresa
            </h1>
            <span class="text-[11px] bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20 font-mono">
              SPEC-87 · Bandeja Eduardo + Visación Móvil Omar + Laudus/ITS
            </span>
          </div>
          <p class="text-slate-400 text-xs mt-1">
            Gestión centralizada de tickets operativos/taller, emisión de Órdenes de Compra por las 4 Razones Sociales del grupo, firma móvil sin papel y cruce con ITS / Laudus ERP.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          @click="mostrarModalPlanCuentas = true"
          class="px-3.5 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow cursor-pointer"
          title="Ver, editar o pegar con Ctrl+V el Plan de Cuentas traído de Laudus ERP"
        >
          <FileSpreadsheet class="w-4 h-4" />
          <span>Plan Cuentas Laudus ({{ planCuentasLaudus.length }})</span>
        </button>
        <button
          @click="abrirModalNuevaSolicitud"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow"
        >
          <Plus class="w-4 h-4 text-cyan-400" />
          <span>+ Nueva Solicitud de Pedido</span>
        </button>
        <button
          @click="abrirModalNuevaOC()"
          class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
        >
          <FileSpreadsheet class="w-4 h-4" />
          <span>+ Emitir Orden de Compra</span>
        </button>
        <button
          @click="cargarTodo"
          :disabled="loading"
          class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin text-amber-400': loading }" />
        </button>
      </div>
    </div>

    <!-- TARJETAS KPI SUPERIORES -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <!-- KPI 1: Tickets Pendientes -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Tickets Solicitud Pendientes</span>
          <span class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ClipboardList class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-3">
          <span class="text-3xl font-black text-white font-mono">{{ kpis.solicitudes_pendientes }}</span>
          <span class="text-xs text-slate-400">de {{ kpis.total_solicitudes }} totales ({{ kpis.solicitudes_convertidas }} en OC)</span>
        </div>
        <div class="mt-2 text-[11px] text-cyan-400 font-medium">
          Operaciones (Flete / Personal) &amp; Taller (Repuestos)
        </div>
      </div>

      <!-- KPI 2: OCs en Firma Móvil (Omar) -->
      <div class="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-amber-300 font-mono">OCs en Firma Móvil (Omar)</span>
          <span class="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Smartphone class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-3">
          <span class="text-3xl font-black text-amber-400 font-mono">{{ kpis.ocs_por_visar_omar }}</span>
          <span class="text-xs text-slate-400">{{ kpis.ocs_borrador }} en borrador</span>
        </div>
        <div class="mt-2 text-[11px] text-amber-300/90 font-medium">
          Visación ejecutiva 1 toque vía Web Token sin papel
        </div>
      </div>

      <!-- KPI 3: OCs Autorizadas por las 4 Razones Sociales -->
      <div class="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-300 font-mono">OCs Autorizadas (4 Empresas)</span>
          <span class="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-3">
          <span class="text-3xl font-black text-emerald-400 font-mono">{{ kpis.ocs_autorizadas }}</span>
          <span class="text-xs text-slate-400">{{ kpis.ocs_imputadas_its }} imputadas en ITS</span>
        </div>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <span
            v-for="emp in ocsPorRazonSocial"
            :key="emp.id_empresa"
            class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
          >
            {{ emp.prefijo_oc }}: <strong class="text-white">{{ emp.autorizadas }}/{{ emp.total_ocs }}</strong>
          </span>
        </div>
      </div>

      <!-- KPI 4: Total Neto Comprometido -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Total Neto Comprometido</span>
          <span class="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <DollarSign class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-black text-white font-mono">{{ formatCurrency(kpis.monto_neto_comprometido) }}</span>
          <span class="text-[11px] text-slate-400 font-mono">+ IVA</span>
        </div>
        <div class="mt-2 text-[11px] text-slate-400 font-mono">
          Total Bruto c/IVA: <strong class="text-slate-200">{{ formatCurrency(kpis.monto_total_comprometido) }}</strong>
        </div>
      </div>
    </div>

    <!-- BARRA DE FILTRO POR RAZÓN SOCIAL DEL GRUPO + BUSCADOR -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mr-1 flex items-center gap-1.5">
          <Building2 class="w-3.5 h-3.5 text-amber-400" />
          Razón Social Holding:
        </span>
        <button
          v-for="emp in opcionesEmpresasFiltro"
          :key="emp.id"
          @click="cambiarFiltroEmpresa(emp.id)"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5',
            filtroEmpresa === emp.id
              ? emp.activeClass
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          ]"
        >
          <span>{{ emp.label }}</span>
          <span v-if="emp.prefijo" class="text-[10px] font-mono opacity-80">({{ emp.prefijo }})</span>
        </button>
      </div>

      <div class="flex items-center gap-2.5 w-full lg:w-80">
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por folio SP/OC, proveedor, RUT..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none"
          />
        </div>
      </div>
    </div>

    <!-- NAVEGACIÓN DE LAS 3 PESTAÑAS CANÓNICAS -->
    <div class="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
      <button
        @click="activeTab = 'solicitudes'"
        :class="[
          'px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border',
          activeTab === 'solicitudes'
            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
        ]"
      >
        <ClipboardList class="w-4 h-4" />
        <span>1. Solicitudes de Pedido (Tickets Operaciones &amp; Taller)</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono" :class="activeTab === 'solicitudes' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-300'">
          {{ solicitudesFiltradas.length }}
        </span>
      </button>

      <button
        @click="activeTab = 'ordenes'"
        :class="[
          'px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border',
          activeTab === 'ordenes'
            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
        ]"
      >
        <ShoppingCart class="w-4 h-4" />
        <span>2. Órdenes de Compra por Razón Social (Bandeja Eduardo)</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono" :class="activeTab === 'ordenes' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'">
          {{ ordenesFiltradas.length }}
        </span>
      </button>

      <button
        @click="activeTab = 'laudus'"
        :class="[
          'px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border',
          activeTab === 'laudus'
            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
        ]"
      >
        <FileCheck2 class="w-4 h-4" />
        <span>3. Integración Laudus ERP &amp; Recepción (Maritza / Bodega)</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono" :class="activeTab === 'laudus' ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-300'">
          {{ ordenesFiltradas.length }}
        </span>
      </button>
    </div>

    <!-- ======================================================================= -->
    <!-- PESTAÑA 1: SOLICITUDES DE PEDIDO (TICKETS OPERACIONES & TALLER)         -->
    <!-- ======================================================================= -->
    <div v-if="activeTab === 'solicitudes'" class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-black text-white uppercase font-mono tracking-wider">
            Bandeja de Tickets de Solicitud de Pedido (SP-YYMM-XXXX)
          </h2>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Requerimientos levantados por Operaciones (flete externo, personal, pensiones) o Taller/Bodega (repuestos e insumos) para que Eduardo los convierta en OC.
          </p>
        </div>
        <button
          @click="abrirModalNuevaSolicitud"
          class="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus class="w-4 h-4" />
          <span>+ Nueva Solicitud de Pedido</span>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase text-[11px]">
              <th class="p-3.5">Folio SP / Fecha</th>
              <th class="p-3.5">Empresa</th>
              <th class="p-3.5">Origen / Prioridad</th>
              <th class="p-3.5">Necesidad &amp; Ítems</th>
              <th class="p-3.5">OT / Proyecto &amp; Rubro ITS</th>
              <th class="p-3.5">Proveedor Sugerido</th>
              <th class="p-3.5 text-right">Monto Est. Neto</th>
              <th class="p-3.5 text-center">Estado</th>
              <th class="p-3.5 text-right">Acción Eduardo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="solicitudesFiltradas.length === 0">
              <td colspan="9" class="p-8 text-center text-slate-500 font-mono">
                No hay solicitudes de pedido registradas con los filtros actuales.
              </td>
            </tr>
            <tr
              v-for="sol in solicitudesFiltradas"
              :key="sol.id_solicitud"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <td class="p-3.5 align-top">
                <div class="font-mono font-black text-cyan-400 text-xs">{{ sol.folio_solicitud }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">{{ formatDate(sol.created_at) }}</div>
                <div class="text-[10px] text-slate-500">Por: {{ sol.nombre_solicita || 'Operaciones' }}</div>
              </td>

              <td class="p-3.5 align-top">
                <span :class="['px-2 py-0.5 rounded text-[10px] font-black uppercase border inline-block', getEmpresaBadgeClass(sol.id_empresa)]">
                  {{ getEmpresaNombre(sol.id_empresa) }}
                </span>
              </td>

              <td class="p-3.5 align-top space-y-1">
                <div>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase border inline-block',
                      sol.origen_solicitud === 'TALLER_BODEGA'
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    ]"
                  >
                    {{ sol.origen_solicitud === 'TALLER_BODEGA' ? 'TALLER / BODEGA' : 'OPERACIONES / OT' }}
                  </span>
                </div>
                <div>
                  <span :class="['px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block', getPrioridadClass(sol.prioridad)]">
                    {{ sol.prioridad }}
                  </span>
                </div>
              </td>

              <td class="p-3.5 align-top max-w-xs">
                <div class="font-bold text-white">{{ sol.titulo_necesidad }}</div>
                <div v-if="sol.justificacion" class="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  {{ sol.justificacion }}
                </div>
                <div v-if="Array.isArray(sol.items_json) && sol.items_json.length > 0" class="mt-1.5 flex flex-wrap gap-1">
                  <span
                    v-for="(it, idx) in sol.items_json.slice(0, 3)"
                    :key="idx"
                    class="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono"
                  >
                    {{ it.cantidad || 1 }}x {{ it.descripcion }}
                  </span>
                </div>
              </td>

              <td class="p-3.5 align-top">
                <div v-if="sol.codi_proyecto" class="font-mono font-bold text-amber-400">
                  {{ sol.codi_proyecto }}
                  <span class="block text-[10px] text-slate-400 font-sans font-normal">{{ sol.nombre_proyecto }}</span>
                </div>
                <div v-else-if="sol.numero_ot_mantenimiento" class="font-mono font-bold text-purple-400">
                  OT Mant. {{ sol.numero_ot_mantenimiento }}
                  <span v-if="sol.equipo_patente" class="block text-[10px] text-slate-400">Equipo: {{ sol.equipo_patente }}</span>
                </div>
                <div v-else class="text-slate-500 text-[11px]">Stock / General</div>

                <span class="mt-1 inline-block px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300">
                  Rubro: {{ sol.rubro_its || 'GASTO_EXTRA' }}
                </span>
                <div v-if="sol.codigo_cuenta_laudus || getCuentaSugeridaPorRubro(sol.rubro_its)" class="mt-1 text-[10px] font-mono text-indigo-300">
                  Cta. Laudus: {{ sol.codigo_cuenta_laudus || getCuentaSugeridaPorRubro(sol.rubro_its)?.codigo_cuenta }} · {{ sol.nombre_cuenta_laudus || getCuentaSugeridaPorRubro(sol.rubro_its)?.nombre_cuenta }}
                </div>
                <div v-if="sol.centro_costo_laudus || sol.equipo_patente" class="text-[10px] font-mono text-cyan-400">
                  C.Costo: {{ sol.centro_costo_laudus || sol.equipo_patente }}
                </div>
              </td>

              <td class="p-3.5 align-top">
                <span class="text-slate-200 font-medium">{{ sol.proveedor_sugerido || 'Por cotizar (Eduardo)' }}</span>
              </td>

              <td class="p-3.5 align-top text-right font-mono font-bold text-white">
                {{ formatCurrency(sol.monto_estimado_neto) }}
              </td>

              <td class="p-3.5 align-top text-center">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border inline-block',
                    sol.estado === 'CONVERTIDA_OC'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  ]"
                >
                  {{ sol.estado }}
                </span>
                <div v-if="sol.folio_oc_generada" class="mt-1 font-mono text-[10px] text-emerald-400 font-bold">
                  ➔ {{ sol.folio_oc_generada }}
                </div>
              </td>

              <td class="p-3.5 align-top text-right">
                <button
                  v-if="sol.estado !== 'CONVERTIDA_OC'"
                  @click="convertirSolicitudEnOC(sol)"
                  class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider inline-flex items-center gap-1.5 shadow transition-all"
                >
                  <span>🛒 Convertir en OC</span>
                </button>
                <button
                  v-else
                  @click="activeTab = 'ordenes'"
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] uppercase inline-flex items-center gap-1"
                >
                  <span>Ver OC {{ sol.folio_oc_generada }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- PESTAÑA 2: ÓRDENES DE COMPRA POR RAZÓN SOCIAL (BANDEJA DE EDUARDO)      -->
    <!-- ======================================================================= -->
    <div v-if="activeTab === 'ordenes'" class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-black text-white uppercase font-mono tracking-wider">
            Órdenes de Compra Emitidas por Razón Social (OC-GSP / OC-RYL / OC-BMQ / OC-LDS)
          </h2>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Emisión multi-empresa de Eduardo, envío a Firma Móvil de 1 toque de Omar (RindeGastos style) y descarga de PDF A4 oficial con Timbre FES.
          </p>
        </div>
        <button
          @click="abrirModalNuevaOC()"
          class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus class="w-4 h-4" />
          <span>+ Emitir Orden de Compra</span>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase text-[11px]">
              <th class="p-3.5">Folio OC / Origen</th>
              <th class="p-3.5">Razón Social Emisora</th>
              <th class="p-3.5">Proveedor &amp; Pago</th>
              <th class="p-3.5">Imputación OT / Rubro ITS</th>
              <th class="p-3.5 text-right">Neto / Total c/IVA</th>
              <th class="p-3.5 text-center">Estado Firma Omar</th>
              <th class="p-3.5 text-right">Acciones (Firma Móvil &amp; PDF)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="ordenesFiltradas.length === 0">
              <td colspan="7" class="p-8 text-center text-slate-500 font-mono">
                No hay Órdenes de Compra registradas para el filtro seleccionado.
              </td>
            </tr>
            <tr
              v-for="oc in ordenesFiltradas"
              :key="oc.id_oc"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <td class="p-3.5 align-top">
                <div class="font-mono font-black text-amber-400 text-sm">{{ oc.folio_oc }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">{{ formatDate(oc.created_at) }}</div>
                <div v-if="oc.folio_solicitud" class="mt-1 inline-block px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px]">
                  Ticket: {{ oc.folio_solicitud }}
                </div>
              </td>

              <td class="p-3.5 align-top">
                <span :class="['px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border inline-block', getEmpresaBadgeClass(oc.id_empresa)]">
                  {{ oc.empresa_info?.nombre_corto || getEmpresaNombre(oc.id_empresa) }}
                </span>
                <div class="text-[10px] text-slate-400 font-mono mt-1">
                  RUT: {{ oc.empresa_info?.rut || '-' }}
                </div>
              </td>

              <td class="p-3.5 align-top">
                <div class="font-bold text-white">{{ oc.razon_social_proveedor }}</div>
                <div class="text-[11px] font-mono text-slate-400">RUT: {{ oc.rut_proveedor }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">
                  Pago: <strong class="text-slate-200">{{ oc.condicion_pago }}</strong> ({{ oc.moneda || 'CLP' }})
                </div>
              </td>

              <td class="p-3.5 align-top">
                <div v-if="oc.codi_proyecto" class="font-mono font-bold text-amber-400">
                  {{ oc.codi_proyecto }}
                  <span class="block text-[10px] text-slate-400 font-sans font-normal">{{ oc.nombre_proyecto }}</span>
                </div>
                <div v-else-if="oc.numero_ot_mantenimiento" class="font-mono font-bold text-purple-400">
                  OT Mant. {{ oc.numero_ot_mantenimiento }}
                </div>
                <div v-else class="text-slate-400 text-[11px]">Stock / General</div>

                <div class="mt-1 flex flex-wrap items-center gap-1">
                  <span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300">
                    {{ oc.rubro_its || 'GASTO_EXTRA' }}
                  </span>
                  <span
                    v-if="oc.imputado_en_its"
                    class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-400"
                  >
                    ✓ EN ITS
                  </span>
                </div>
              </td>

              <td class="p-3.5 align-top text-right font-mono">
                <div class="text-xs text-slate-300">Neto: {{ formatCurrency(oc.monto_neto) }}</div>
                <div class="text-[10px] text-slate-500">IVA 19%: {{ formatCurrency(oc.monto_iva) }}</div>
                <div class="text-sm font-black text-white mt-0.5">{{ formatCurrency(oc.monto_total) }}</div>
              </td>

              <td class="p-3.5 align-top text-center">
                <span :class="['px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border inline-block', getEstadoOcBadgeClass(oc.estado_oc)]">
                  {{ oc.estado_oc }}
                </span>
                <div v-if="oc.observacion_gerencia || oc.observacion_omar" class="mt-1.5 p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 text-left max-w-[220px] mx-auto">
                  <strong>Nota Omar:</strong> {{ oc.observacion_gerencia || oc.observacion_omar }}
                </div>
                <div v-if="oc.fecha_autorizacion_gerencia" class="text-[9px] text-slate-400 mt-1 font-mono">
                  Visada: {{ formatDate(oc.fecha_autorizacion_gerencia) }}
                </div>
              </td>

              <td class="p-3.5 align-top text-right space-y-1.5">
                <div class="flex flex-wrap justify-end gap-1.5">
                  <button
                    v-if="['BORRADOR', 'PENDIENTE_VB_OMAR', 'RECHAZADA'].includes(oc.estado_oc)"
                    @click="enviarAFirmaOmar(oc)"
                    :disabled="enviandoFirmaId === oc.id_oc"
                    class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider inline-flex items-center gap-1 shadow transition-all disabled:opacity-50"
                  >
                    <span>📱 {{ oc.estado_oc === 'PENDIENTE_VB_OMAR' ? 'Ver / Reenviar Link Omar' : 'Enviar a Firma Móvil (Omar)' }}</span>
                  </button>

                  <button
                    v-if="oc.magic_link_omar"
                    @click="mostrarModalTokenExistente(oc)"
                    class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-[11px] inline-flex items-center gap-1"
                    title="Abrir o copiar Magic Link de 1 uso para Omar"
                  >
                    <ExternalLink class="w-3.5 h-3.5" />
                    <span>Link 1-Uso</span>
                  </button>

                  <button
                    @click="verPdfOc(oc)"
                    class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                  >
                    <span>🖨️ Ver PDF OC</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- PESTAÑA 3: INTEGRACIÓN LAUDUS ERP & RECEPCIÓN (MARITZA / BODEGA)        -->
    <!-- ======================================================================= -->
    <div v-if="activeTab === 'laudus'" class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-black text-white uppercase font-mono tracking-wider">
            Panel de Conciliación Contable Laudus ERP, Factura DTE e Imputación al ITS (Maritza / Bodega)
          </h2>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Asocie Cuenta Contable Laudus, Centro de Costo, N° OC Laudus y Folio DTE de Factura de Compra para cerrar el ciclo y alimentar el ITS.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            @click="mostrarModalPlanCuentas = true"
            type="button"
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <span>📋 Ver/Pegar Plan Cuentas ({{ planCuentasLaudus.length }})</span>
          </button>
          <button
            @click="exportarPreImputacionLaudusCSV"
            type="button"
            class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <FileSpreadsheet class="w-3.5 h-3.5" />
            <span>Exportar Pre-Imputación Laudus (.CSV)</span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase text-[11px]">
              <th class="p-3.5">Folio OC &amp; Empresa</th>
              <th class="p-3.5">Proveedor</th>
              <th class="p-3.5">Proyecto / OT &amp; Rubro ITS</th>
              <th class="p-3.5">Cuenta Contable &amp; C. Costo Laudus</th>
              <th class="p-3.5 text-right">Monto Neto / Total</th>
              <th class="p-3.5">N° OC Laudus ERP</th>
              <th class="p-3.5">Folio DTE Factura Compra</th>
              <th class="p-3.5 text-center">Estado 3-Way / ITS</th>
              <th class="p-3.5 text-right">Sincronizar</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="ordenesFiltradas.length === 0">
              <td colspan="9" class="p-8 text-center text-slate-500 font-mono">
                No hay Órdenes de Compra para conciliar con Laudus ERP.
              </td>
            </tr>
            <tr
              v-for="oc in ordenesFiltradas"
              :key="oc.id_oc"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <td class="p-3.5 align-top">
                <div class="font-mono font-black text-amber-400">{{ oc.folio_oc }}</div>
                <span :class="['mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border inline-block', getEmpresaBadgeClass(oc.id_empresa)]">
                  {{ oc.empresa_info?.nombre_corto || getEmpresaNombre(oc.id_empresa) }}
                </span>
                <div class="text-[9px] font-mono text-slate-500 mt-0.5">
                  RUT Holding: {{ oc.empresa_info?.rut || '52.004.162-1' }}
                </div>
              </td>

              <td class="p-3.5 align-top">
                <div class="font-bold text-white">{{ oc.razon_social_proveedor }}</div>
                <div class="text-[10px] font-mono text-slate-400">{{ oc.rut_proveedor }}</div>
              </td>

              <td class="p-3.5 align-top">
                <div v-if="oc.codi_proyecto" class="font-mono font-bold text-cyan-400">{{ oc.codi_proyecto }}</div>
                <div v-else-if="oc.numero_ot_mantenimiento" class="font-mono font-bold text-purple-400">OT Mant. {{ oc.numero_ot_mantenimiento }}</div>
                <div v-else class="text-slate-500">Stock General</div>
                <div class="text-[10px] font-mono text-slate-400">Rubro: {{ oc.rubro_its || 'GASTO_EXTRA' }}</div>
              </td>

              <td class="p-3.5 align-top min-w-[230px]">
                <select
                  v-model="laudusEdits[oc.id_oc].codigo_cuenta_laudus"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-mono text-indigo-300 focus:border-indigo-500 outline-none mb-1"
                >
                  <option v-for="cta in planCuentasLaudus" :key="cta.codigo_cuenta" :value="cta.codigo_cuenta">
                    {{ cta.codigo_cuenta }} · {{ cta.nombre_cuenta }}
                  </option>
                </select>
                <div class="flex items-center gap-1">
                  <input
                    v-model="laudusEdits[oc.id_oc].centro_costo_laudus"
                    type="text"
                    placeholder="C. Costo (Patente / Obra)"
                    class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-mono text-cyan-300 focus:border-cyan-500 outline-none"
                  />
                  <button
                    @click="copiarFichaLaudus(oc)"
                    type="button"
                    class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700"
                    title="Copiar fila lista para pegar en Laudus ERP"
                  >
                    📋 Copiar
                  </button>
                </div>
              </td>

              <td class="p-3.5 align-top text-right font-mono">
                <div class="font-bold text-white">{{ formatCurrency(oc.monto_neto) }} <span class="text-[9px] text-slate-400">Neto</span></div>
                <div class="text-[10px] text-emerald-400 font-bold">{{ formatCurrency(oc.monto_total) }} Total</div>
              </td>

              <td class="p-3.5 align-top">
                <input
                  v-model="laudusEdits[oc.id_oc].folio_laudus_oc"
                  type="text"
                  placeholder="Ej: LAU-2026-884"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:border-emerald-500 outline-none"
                />
              </td>

              <td class="p-3.5 align-top">
                <input
                  v-model="laudusEdits[oc.id_oc].folio_dte_factura_compra"
                  type="text"
                  placeholder="Ej: DTE-33-94512"
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:border-emerald-500 outline-none"
                />
              </td>

              <td class="p-3.5 align-top text-center">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border inline-block',
                    oc.imputado_en_its
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  ]"
                >
                  {{ oc.imputado_en_its ? '✓ IMPUTADO EN ITS' : 'PENDIENTE IMPUTAR' }}
                </span>
                <div v-if="oc.fecha_sincronizacion_laudus" class="text-[9px] text-slate-500 font-mono mt-1">
                  {{ formatDate(oc.fecha_sincronizacion_laudus) }}
                </div>
              </td>

              <td class="p-3.5 align-top text-right">
                <button
                  @click="guardarSincronizacionLaudus(oc)"
                  :disabled="sincronizandoId === oc.id_oc"
                  class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-wider inline-flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>{{ sincronizandoId === oc.id_oc ? 'Sincronizando...' : 'Sincronizar ITS / Laudus' }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- MODAL 1: NUEVA SOLICITUD DE PEDIDO (OPERACIONES / TALLER)               -->
    <!-- ======================================================================= -->
    <div
      v-if="showModalSolicitud"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 class="text-base font-black text-white uppercase font-mono">
              + Nuevo Ticket de Solicitud de Pedido (SP)
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Levante un requerimiento desde Operaciones (flete, grúa externa, personal, pensión) o Taller/Bodega (repuestos).
            </p>
          </div>
          <button @click="showModalSolicitud = false" class="text-slate-400 hover:text-white p-1">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">Origen del Pedido *</label>
            <select
              v-model="formSolicitud.origen_solicitud"
              @change="onOrigenSolicitudChange"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 outline-none"
            >
              <option value="OPERACIONES_OT">OPERACIONES / OT (Fletes, Personal, Pensión, Viáticos)</option>
              <option value="TALLER_BODEGA">TALLER / BODEGA (Repuestos, Hidráulica, Insumos)</option>
              <option value="ADMINISTRACION">ADMINISTRACIÓN / GENERAL</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">Empresa del Grupo *</label>
            <select
              v-model="formSolicitud.id_empresa"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 outline-none"
            >
              <option :value="9">Grúas San Pablo (9)</option>
              <option :value="11">Royal Rental (11)</option>
              <option :value="7">Bestmaq (7)</option>
              <option :value="8">Logística del Sur (8)</option>
            </select>
          </div>

          <div v-if="formSolicitud.origen_solicitud !== 'TALLER_BODEGA'">
            <label class="block text-slate-400 font-bold uppercase mb-1">Proyecto / OT Operativa Vinculada</label>
            <select
              v-model="formSolicitud.id_proyecto"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500 outline-none"
            >
              <option :value="null">-- Sin OT / Gasto General --</option>
              <option v-for="p in selectores.proyectos_activos" :key="p.id_proyecto" :value="p.id_proyecto">
                {{ p.codi_proyecto }} · {{ p.nombre_proyecto }} ({{ p.cliente_nombre }})
              </option>
            </select>
          </div>

          <div v-else>
            <label class="block text-slate-400 font-bold uppercase mb-1">OT Mantenimiento (Taller)</label>
            <select
              v-model="formSolicitud.id_ot_mantenimiento"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500 outline-none"
            >
              <option :value="null">-- Stock General Bodega --</option>
              <option v-for="ot in selectores.ots_mantenimiento" :key="ot.id_ot" :value="ot.id_ot">
                {{ ot.numero_ot }} · {{ ot.patente }} ({{ ot.descripcion_falla || ot.tipo_mantenimiento }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">Rubro de Imputación (ITS / Bodega) *</label>
            <select
              v-model="formSolicitud.rubro_its"
              @change="onRubroSolicitudChange"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-cyan-500 outline-none"
            >
              <option value="FLETE_EXTERNO">FLETE_EXTERNO (Subcontrato Flete / Cama Baja)</option>
              <option value="PERSONAL_EXTERNO">PERSONAL_EXTERNO (Rigger / Operador Externo)</option>
              <option value="PENSION_ALOJAMIENTO">PENSION_ALOJAMIENTO (Hotel / Pensión Cuadrilla)</option>
              <option value="VIATICO_ALIMENTACION">VIATICO_ALIMENTACION (Alimentación Terreno)</option>
              <option value="PEAJE_TAG">PEAJE_TAG (Peajes / Escolta Vial)</option>
              <option value="GASTO_EXTRA">GASTO_EXTRA (Permisos, Maniobras, Otros ITS)</option>
              <option value="REPUESTOS_TALLER">REPUESTOS_TALLER (Repuestos OT Mantenimiento)</option>
              <option value="INSUMOS_BODEGA">INSUMOS_BODEGA (Stock Insumos / Lubricantes / EPP)</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">Prioridad *</label>
            <select
              v-model="formSolicitud.prioridad"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 outline-none"
            >
              <option value="BAJA">BAJA</option>
              <option value="NORMAL">NORMAL</option>
              <option value="ALTA">ALTA</option>
              <option value="URGENTE_PARADA">URGENTE_PARADA (Equipo Detenido / Obra Crítica)</option>
            </select>
          </div>

          <div>
            <label class="block text-indigo-300 font-bold uppercase mb-1">Cuenta Contable Laudus ERP *</label>
            <select
              v-model="formSolicitud.codigo_cuenta_laudus"
              class="w-full bg-slate-950 border border-indigo-500/40 rounded-xl p-2.5 text-indigo-200 font-mono focus:border-indigo-400 outline-none"
            >
              <option v-for="cta in planCuentasLaudus" :key="cta.codigo_cuenta" :value="cta.codigo_cuenta">
                {{ cta.codigo_cuenta }} · {{ cta.nombre_cuenta }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-cyan-300 font-bold uppercase mb-1">Centro de Costo Laudus (Equipo / Sucursal)</label>
            <input
              v-model="formSolicitud.centro_costo_laudus"
              type="text"
              list="centros-costo-laudus-list"
              placeholder="Ej: DZXL.21-0 / TALLER TEMUCO / BODEGA CENTRAL"
              class="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2.5 text-cyan-200 font-mono focus:border-cyan-400 outline-none"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-slate-400 font-bold uppercase mb-1">Título de Necesidad / Requerimiento *</label>
            <input
              v-model="formSolicitud.titulo_necesidad"
              type="text"
              placeholder="Ej: Subcontrato Cama Baja retorno contrapesos Obra Temuco / Kit Sellos Cilindro"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">Proveedor Sugerido (Opcional)</label>
            <input
              v-model="formSolicitud.proveedor_sugerido"
              type="text"
              placeholder="Ej: Transportes Sur Ltda. / Finning Chile"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">Solicitante</label>
            <input
              v-model="formSolicitud.nombre_solicita"
              type="text"
              placeholder="Nombre quien solicita"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 outline-none"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-slate-400 font-bold uppercase mb-1">Justificación Operativa / Técnica</label>
            <textarea
              v-model="formSolicitud.justificacion"
              rows="2"
              placeholder="Detalle el motivo operativo, urgencia o especificaciones..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 outline-none"
            ></textarea>
          </div>
        </div>

        <!-- Ítems de la solicitud -->
        <div class="border-t border-slate-800 pt-4">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span class="text-xs font-bold uppercase text-slate-300 font-mono">Ítems Solicitados</span>
            <div class="flex items-center gap-2">
              <div class="relative w-64">
                <input
                  v-model="busquedaCatalogoWms"
                  type="text"
                  placeholder="🔍 Buscar en Catálogo WMS (SKU / Repuesto)..."
                  class="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1 text-[11px] text-amber-200 placeholder-slate-500 focus:border-amber-400 outline-none"
                />
                <div
                  v-if="sugerenciasCatalogoWms.length > 0"
                  class="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-800"
                >
                  <button
                    v-for="prod in sugerenciasCatalogoWms"
                    :key="prod.id"
                    type="button"
                    @click="inyectarProductoEnSolped(prod)"
                    class="w-full text-left px-3 py-2 hover:bg-slate-800 text-[11px] flex items-center justify-between gap-2"
                  >
                    <div>
                      <div class="font-bold text-white">{{ prod.nombre }}</div>
                      <div class="font-mono text-[10px] text-amber-400">{{ prod.sku }} · Stock: {{ prod.stock_fisico || 0 }} {{ prod.uom || 'UN' }}</div>
                    </div>
                    <span class="font-mono text-[10px] text-emerald-400 font-bold">{{ formatCurrency(prod.pmp || prod.costo_promedio || 0) }}</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                @click="agregarItemSolicitud"
                class="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
              >
                <Plus class="w-3.5 h-3.5" /> Añadir Ítem Libre
              </button>
            </div>
          </div>
          <div class="space-y-2">
            <div
              v-for="(item, idx) in formSolicitud.items_json"
              :key="idx"
              class="grid grid-cols-12 gap-2 items-center"
            >
              <input
                v-model="item.descripcion"
                type="text"
                placeholder="Descripción del servicio o repuesto"
                class="col-span-6 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
              <input
                v-model="item.unidad"
                type="text"
                placeholder="UN / SERV"
                class="col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono text-center"
              />
              <input
                v-model.number="item.cantidad"
                type="number"
                min="1"
                placeholder="Cant."
                class="col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono text-right"
              />
              <input
                v-model.number="item.precio_estimado"
                type="number"
                min="0"
                placeholder="$ Est."
                class="col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono text-right"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            @click="showModalSolicitud = false"
            class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase"
          >
            Cancelar
          </button>
          <button
            @click="guardarNuevaSolicitud"
            :disabled="guardandoSolicitud"
            class="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {{ guardandoSolicitud ? 'Generando Ticket...' : 'Crear Ticket de Solicitud' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- MODAL 2: EMITIR ORDEN DE COMPRA MULTI-EMPRESA (EDUARDO)                 -->
    <!-- ======================================================================= -->
    <div
      v-if="showModalOC"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-black text-white uppercase font-mono">
                Emitir Orden de Compra por Razón Social (Eduardo)
              </h3>
              <span v-if="formOC.folio_solicitud_ref" class="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
                Desde Ticket {{ formOC.folio_solicitud_ref }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Seleccione la empresa facturadora del holding, proveedor y detalle de líneas para generar el folio canónico y enviar a firma móvil de Omar.
            </p>
          </div>
          <button @click="showModalOC = false" class="text-slate-400 hover:text-white p-1">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Selector visual de las 4 Razones Sociales -->
        <div>
          <label class="block text-xs text-slate-400 font-bold uppercase mb-2 font-mono">
            1. Seleccione Razón Social Facturadora (Multi-Empresa Holding) *
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              v-for="emp in empresasHoldingCards"
              :key="emp.id_empresa"
              type="button"
              @click="formOC.id_empresa = emp.id_empresa"
              :class="[
                'p-3 rounded-xl border text-left transition-all',
                formOC.id_empresa === emp.id_empresa
                  ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              ]"
            >
              <div class="flex items-center justify-between">
                <span class="font-black text-xs uppercase text-white">{{ emp.nombre_corto }}</span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-700">
                  OC-{{ emp.prefijo }}-...
                </span>
              </div>
              <div class="text-[10px] font-mono text-slate-400 mt-1">RUT: {{ emp.rut }}</div>
            </button>
          </div>
        </div>

        <!-- Datos Proveedor e Imputación -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">RUT Proveedor *</label>
            <input
              v-model="formOC.rut_proveedor"
              type="text"
              placeholder="Ej: 76.543.210-K"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-500 outline-none"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-slate-400 font-bold uppercase mb-1">Razón Social Proveedor *</label>
            <input
              v-model="formOC.razon_social_proveedor"
              type="text"
              placeholder="Ej: Transportes y Cama Baja del Sur SpA"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">Contacto Proveedor</label>
            <input
              v-model="formOC.contacto_proveedor"
              type="text"
              placeholder="Nombre Ejecutivo / Ventas"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">Email Proveedor</label>
            <input
              v-model="formOC.email_proveedor"
              type="email"
              placeholder="ventas@proveedor.cl"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">Condición de Pago *</label>
            <select
              v-model="formOC.condicion_pago"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
            >
              <option value="Contado / Transferencia">Contado / Transferencia</option>
              <option value="Crédito 30 días">Crédito 30 días</option>
              <option value="Crédito 45 días">Crédito 45 días</option>
              <option value="Crédito 60 días">Crédito 60 días</option>
              <option value="Contra Entrega / Recepción">Contra Entrega / Recepción</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">OT / Proyecto Operativo (ITS)</label>
            <select
              v-model="formOC.id_proyecto"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-500 outline-none"
            >
              <option :value="null">-- Sin OT Operativa --</option>
              <option v-for="p in selectores.proyectos_activos" :key="p.id_proyecto" :value="p.id_proyecto">
                {{ p.codi_proyecto }} · {{ p.nombre_proyecto }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">OT Mantenimiento (Taller)</label>
            <select
              v-model="formOC.id_ot_mantenimiento"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-500 outline-none"
            >
              <option :value="null">-- Sin OT Mantenimiento --</option>
              <option v-for="ot in selectores.ots_mantenimiento" :key="ot.id_ot" :value="ot.id_ot">
                {{ ot.numero_ot }} · {{ ot.patente }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 font-bold uppercase mb-1">Rubro Costo ITS / Bodega *</label>
            <select
              v-model="formOC.rubro_its"
              @change="onRubroOcChange"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-500 outline-none"
            >
              <option value="FLETE_EXTERNO">FLETE_EXTERNO</option>
              <option value="PERSONAL_EXTERNO">PERSONAL_EXTERNO</option>
              <option value="PENSION_ALOJAMIENTO">PENSION_ALOJAMIENTO</option>
              <option value="VIATICO_ALIMENTACION">VIATICO_ALIMENTACION</option>
              <option value="PEAJE_TAG">PEAJE_TAG</option>
              <option value="GASTO_EXTRA">GASTO_EXTRA</option>
              <option value="REPUESTOS_TALLER">REPUESTOS_TALLER</option>
              <option value="INSUMOS_BODEGA">INSUMOS_BODEGA</option>
            </select>
          </div>

          <div>
            <label class="block text-indigo-300 font-bold uppercase mb-1">Cuenta Contable Laudus ERP *</label>
            <select
              v-model="formOC.codigo_cuenta_laudus"
              class="w-full bg-slate-950 border border-indigo-500/40 rounded-xl p-2.5 text-indigo-200 font-mono focus:border-indigo-400 outline-none"
            >
              <option v-for="cta in planCuentasLaudus" :key="cta.codigo_cuenta" :value="cta.codigo_cuenta">
                {{ cta.codigo_cuenta }} · {{ cta.nombre_cuenta }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-cyan-300 font-bold uppercase mb-1">Centro de Costo Laudus (Patente / Sucursal)</label>
            <input
              v-model="formOC.centro_costo_laudus"
              type="text"
              list="centros-costo-laudus-list"
              placeholder="Ej: DZXL.21-0 / CASA MATRIZ TEMUCO"
              class="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2.5 text-cyan-200 font-mono focus:border-cyan-400 outline-none"
            />
          </div>
        </div>

        <!-- Líneas de detalle de la OC -->
        <div class="border-t border-slate-800 pt-4">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span class="text-xs font-bold uppercase text-amber-400 font-mono">
              2. Líneas de Detalle de la Orden de Compra
            </span>
            <div class="flex items-center gap-2">
              <div class="relative w-72">
                <input
                  v-model="busquedaCatalogoWmsOc"
                  type="text"
                  placeholder="🔍 Buscar Repuesto Catálogo WMS (2.854 SKUs)..."
                  class="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1 text-[11px] text-amber-200 placeholder-slate-500 focus:border-amber-400 outline-none"
                />
                <div
                  v-if="sugerenciasCatalogoWmsOc.length > 0"
                  class="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-800"
                >
                  <button
                    v-for="prod in sugerenciasCatalogoWmsOc"
                    :key="prod.id"
                    type="button"
                    @click="inyectarProductoEnOC(prod)"
                    class="w-full text-left px-3 py-2 hover:bg-slate-800 text-[11px] flex items-center justify-between gap-2"
                  >
                    <div>
                      <div class="font-bold text-white">{{ prod.nombre }}</div>
                      <div class="font-mono text-[10px] text-amber-400">{{ prod.sku }} · Stock: {{ prod.stock_fisico || 0 }} {{ prod.uom || 'UN' }}</div>
                    </div>
                    <span class="font-mono text-[10px] text-emerald-400 font-bold">{{ formatCurrency(prod.pmp || prod.costo_promedio || 0) }}</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                @click="agregarLineaOC"
                class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1"
              >
                <Plus class="w-3.5 h-3.5" /> + Agregar Línea
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="(lin, idx) in formOC.lineas"
              :key="idx"
              class="grid grid-cols-12 gap-2 items-center bg-slate-950/70 p-2 rounded-xl border border-slate-800"
            >
              <input
                v-model="lin.sku_codigo"
                type="text"
                placeholder="SKU / Cód."
                class="col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
              />
              <input
                v-model="lin.descripcion"
                type="text"
                placeholder="Descripción del servicio / repuesto *"
                class="col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
              <input
                v-model="lin.unidad_medida"
                type="text"
                placeholder="UN"
                class="col-span-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono text-center"
              />
              <input
                v-model.number="lin.cantidad"
                type="number"
                min="0.01"
                step="any"
                placeholder="Cant."
                class="col-span-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono text-right"
              />
              <input
                v-model.number="lin.precio_unitario"
                type="number"
                min="0"
                step="any"
                placeholder="P. Unit Neto"
                class="col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono text-right"
              />
              <div class="col-span-2 flex items-center justify-end gap-2">
                <span class="font-mono font-bold text-xs text-amber-400">
                  {{ formatCurrency(calcularSubtotalLinea(lin)) }}
                </span>
                <button
                  v-if="formOC.lineas.length > 1"
                  type="button"
                  @click="formOC.lineas.splice(idx, 1)"
                  class="text-rose-400 hover:text-rose-300 p-1"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Glosa y Totales -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-4 items-start">
          <div class="md:col-span-2 text-xs">
            <label class="block text-slate-400 font-bold uppercase mb-1">Glosa General / Observaciones OC</label>
            <textarea
              v-model="formOC.glosa_general"
              rows="3"
              placeholder="Condiciones de entrega, lugar de prestación del servicio o referencia de cotización del proveedor..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
            ></textarea>
          </div>

          <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs">
            <div class="flex justify-between text-slate-400">
              <span>Subtotal Neto:</span>
              <strong class="text-white">{{ formatCurrency(totalesFormOC.neto) }}</strong>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>IVA (19%):</span>
              <strong class="text-white">{{ formatCurrency(totalesFormOC.iva) }}</strong>
            </div>
            <div class="flex justify-between text-sm font-black text-amber-400 border-t border-slate-800 pt-2">
              <span>TOTAL BRUTO:</span>
              <span>{{ formatCurrency(totalesFormOC.total) }}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            @click="showModalOC = false"
            class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase"
          >
            Cancelar
          </button>
          <button
            @click="guardarNuevaOC(false)"
            :disabled="guardandoOC"
            class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            Guardar Borrador OC
          </button>
          <button
            @click="guardarNuevaOC(true)"
            :disabled="guardandoOC"
            class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {{ guardandoOC ? 'Emitiendo...' : '📱 Emitir OC y Enviar a Firma Móvil (Omar)' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- MODAL 3: MAGIC LINK DE 1 USO GENERADO PARA OMAR                         -->
    <!-- ======================================================================= -->
    <div
      v-if="modalMagicLink.visible"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Smartphone class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-black text-white uppercase font-mono">
                Web Token Móvil de 1 Uso Generado (Omar)
              </h3>
              <p class="text-[11px] text-amber-300 font-mono">{{ modalMagicLink.folio_oc }}</p>
            </div>
          </div>
          <button @click="modalMagicLink.visible = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          La Orden de Compra quedó en estado <strong class="text-amber-400">PENDIENTE_VB_OMAR</strong>. Con este enlace único (0% login, estilo RindeGastos), Omar puede revisar las variables clave y autorizar desde su teléfono celular:
        </p>

        <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 break-all">
          {{ modalMagicLink.url_absoluta }}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            @click="copiarMagicLink"
            class="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase flex items-center justify-center gap-1.5 border border-slate-700"
          >
            <Copy class="w-4 h-4 text-cyan-400" />
            <span>{{ copiadoOk ? '¡Copiado!' : 'Copiar Link' }}</span>
          </button>

          <a
            :href="whatsappUrlOmar"
            target="_blank"
            rel="noopener"
            class="px-3 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase flex items-center justify-center gap-1.5 text-center"
          >
            <span>💬 WhatsApp Omar</span>
          </a>

          <a
            :href="modalMagicLink.url_relativa"
            target="_blank"
            rel="noopener"
            class="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase flex items-center justify-center gap-1.5 text-center"
          >
            <ExternalLink class="w-4 h-4" />
            <span>Abrir Vista Omar</span>
          </a>
        </div>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- MODAL 4: VISOR IMPRESIÓN A4 OFICIAL DE LA ORDEN DE COMPRA               -->
    <!-- ======================================================================= -->
    <div
      v-if="modalPrint.visible"
      class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div class="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="font-mono font-black text-amber-400 text-sm">
              Vista Oficial A4 · {{ modalPrint.folio_oc }}
            </span>
            <span class="text-xs text-slate-400">
              Incluye Logo de Razón Social Emisora y Timbre Digital FES de Gerencia
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="imprimirIframeOc"
              class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase"
            >
              🖨️ Imprimir / Guardar PDF
            </button>
            <button
              @click="modalPrint.visible = false"
              class="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
        <div class="flex-1 bg-slate-200 overflow-hidden">
          <iframe
            ref="printIframeRef"
            :srcdoc="modalPrint.html"
            class="w-full h-full border-0"
          ></iframe>
        </div>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- MODAL 5: PLAN DE CUENTAS LAUDUS ERP (PEGADO MANUAL / COPY-PASTE EXCEL)  -->
    <!-- ======================================================================= -->
    <div
      v-if="mostrarModalPlanCuentas"
      class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 class="text-base font-black text-white uppercase font-mono flex items-center gap-2">
              <FileSpreadsheet class="w-5 h-5 text-indigo-400" />
              <span>Plan de Cuentas Laudus ERP · Carga Manual &amp; Copy-Paste Excel</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Pegue directamente las filas copiadas desde Laudus ERP (Código Cuenta [Tab / ;] Nombre Cuenta [Tab / ;] Rubro) o agregue cuentas manualmente.
            </p>
          </div>
          <button @click="mostrarModalPlanCuentas = false" class="text-slate-400 hover:text-white p-1">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Bloque Pegado Rápido desde Excel Laudus -->
        <div class="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase text-indigo-300 font-mono">
              📋 1. Pegar Bloque desde Excel de Laudus (Ctrl+V)
            </span>
            <button
              type="button"
              @click="procesarPegadoPlanCuentas"
              class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              + Incorporar Cuentas Pegadas
            </button>
          </div>
          <textarea
            v-model="textoPegadoLaudus"
            rows="3"
            placeholder="Ejemplo (copiar desde Excel de Laudus y pegar aquí):&#10;5101-01	Mant. Maquinarias	REPUESTOS_TALLER&#10;5101-02	Mant. Vehiculos	REPUESTOS_TALLER&#10;5102-01	Subcontrato Fletes Externos	FLETE_EXTERNO"
            class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-indigo-100 placeholder-slate-600 focus:border-indigo-500 outline-none"
          ></textarea>
        </div>

        <!-- Agregar Cuenta Individual -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
          <div class="md:col-span-3">
            <label class="block text-slate-400 font-bold uppercase mb-1 text-[10px]">Código Laudus *</label>
            <input
              v-model="nuevaCuentaLaudus.codigo_cuenta"
              type="text"
              placeholder="Ej: 5101-09"
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
            />
          </div>
          <div class="md:col-span-5">
            <label class="block text-slate-400 font-bold uppercase mb-1 text-[10px]">Nombre Cuenta Contable Laudus *</label>
            <input
              v-model="nuevaCuentaLaudus.nombre_cuenta"
              type="text"
              placeholder="Ej: Mant. Equipos de Izaje"
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-slate-400 font-bold uppercase mb-1 text-[10px]">Rubro Sugerido</label>
            <select
              v-model="nuevaCuentaLaudus.rubro_its_sugerido"
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
            >
              <option value="REPUESTOS_TALLER">REPUESTOS_TALLER</option>
              <option value="INSUMOS_BODEGA">INSUMOS_BODEGA</option>
              <option value="FLETE_EXTERNO">FLETE_EXTERNO</option>
              <option value="PERSONAL_EXTERNO">PERSONAL_EXTERNO</option>
              <option value="PENSION_ALOJAMIENTO">PENSION_ALOJAMIENTO</option>
              <option value="VIATICO_ALIMENTACION">VIATICO_ALIMENTACION</option>
              <option value="PEAJE_TAG">PEAJE_TAG</option>
              <option value="GASTO_EXTRA">GASTO_EXTRA</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <button
              type="button"
              @click="agregarCuentaLaudusManual"
              class="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-[11px] cursor-pointer"
            >
              + Añadir
            </button>
          </div>
        </div>

        <!-- Tabla de Cuentas Cargadas -->
        <div class="max-h-64 overflow-y-auto border border-slate-800 rounded-xl">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] sticky top-0">
              <tr>
                <th class="p-2.5">Código Laudus</th>
                <th class="p-2.5">Nombre Cuenta Contable</th>
                <th class="p-2.5">Rubro ITS / Bodega Asociado</th>
                <th class="p-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono">
              <tr v-for="(cta, idx) in planCuentasLaudus" :key="cta.codigo_cuenta" class="hover:bg-slate-800/40">
                <td class="p-2.5 font-bold text-indigo-300">{{ cta.codigo_cuenta }}</td>
                <td class="p-2.5 font-sans font-bold text-white">{{ cta.nombre_cuenta }}</td>
                <td class="p-2.5 text-slate-400 text-[11px]">{{ cta.rubro_its_sugerido || 'GASTO_EXTRA' }}</td>
                <td class="p-2.5 text-right">
                  <button
                    type="button"
                    @click="eliminarCuentaLaudus(idx)"
                    class="text-rose-400 hover:text-rose-300 text-[11px]"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-between items-center border-t border-slate-800 pt-4">
          <button
            type="button"
            @click="restaurarPlanCuentasBase"
            class="text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            Restaurar 12 Cuentas Base GSP / SPEC-105
          </button>
          <button
            type="button"
            @click="mostrarModalPlanCuentas = false"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase cursor-pointer"
          >
            Cerrar y Guardar Plan de Cuentas
          </button>
        </div>
      </div>
    </div>

    <!-- Datalist de Centros de Costo Laudus (Equipos + Sucursales) -->
    <datalist id="centros-costo-laudus-list">
      <option value="CASA MATRIZ TEMUCO">Sucursal / Administración Temuco</option>
      <option value="TALLER CENTRAL TEMUCO">Taller Mantenimiento Temuco</option>
      <option value="BODEGA CENTRAL WMS">Pañol / Bodega Central</option>
      <option value="SUCURSAL SANTIAGO">Operaciones Santiago</option>
      <option value="SUCURSAL ANTOFAGASTA">Operaciones Antofagasta</option>
      <option v-for="eq in selectores.equipos" :key="eq.id_equipo" :value="eq.patente || eq.codigo_interno">
        Equipo {{ eq.patente }} · {{ eq.marca }} {{ eq.modelo }}
      </option>
    </datalist>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ShoppingCart,
  ClipboardList,
  Smartphone,
  CheckCircle2,
  DollarSign,
  Building2,
  Search,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  FileCheck2,
  ExternalLink,
  Copy,
  Trash2,
  X
} from 'lucide-vue-next'
import apiAxios from '../../services/api'

const route = useRoute()
const loading = ref(false)
const activeTab = ref('solicitudes')
const filtroEmpresa = ref(0)
const searchQuery = ref('')

// Plan de Cuentas Laudus ("Pegado a mano" + persistencia local y backend)
const CUENTAS_LAUDUS_BASE = [
  { codigo_cuenta: '5101-01', nombre_cuenta: 'Mant. Maquinarias', rubro_its_sugerido: 'REPUESTOS_TALLER' },
  { codigo_cuenta: '5101-02', nombre_cuenta: 'Mant. Vehiculos', rubro_its_sugerido: 'REPUESTOS_TALLER' },
  { codigo_cuenta: '5101-03', nombre_cuenta: 'Implementos Seguridad', rubro_its_sugerido: 'INSUMOS_BODEGA' },
  { codigo_cuenta: '5101-04', nombre_cuenta: 'Herramientas y Pañol', rubro_its_sugerido: 'INSUMOS_BODEGA' },
  { codigo_cuenta: '5101-05', nombre_cuenta: 'Combustibles y Lubricantes', rubro_its_sugerido: 'INSUMOS_BODEGA' },
  { codigo_cuenta: '5101-06', nombre_cuenta: 'Neumáticos y Rodado', rubro_its_sugerido: 'REPUESTOS_TALLER' },
  { codigo_cuenta: '1106-01', nombre_cuenta: 'Existencias Repuestos Bodega WMS', rubro_its_sugerido: 'INSUMOS_BODEGA' },
  { codigo_cuenta: '5102-01', nombre_cuenta: 'Subcontrato Fletes Externos', rubro_its_sugerido: 'FLETE_EXTERNO' },
  { codigo_cuenta: '5102-02', nombre_cuenta: 'Personal Externo y Riggers', rubro_its_sugerido: 'PERSONAL_EXTERNO' },
  { codigo_cuenta: '5102-03', nombre_cuenta: 'Alojamiento y Pensiones Faena', rubro_its_sugerido: 'PENSION_ALOJAMIENTO' },
  { codigo_cuenta: '5102-04', nombre_cuenta: 'Viáticos y Alimentación Terreno', rubro_its_sugerido: 'VIATICO_ALIMENTACION' },
  { codigo_cuenta: '5102-05', nombre_cuenta: 'Peajes, TAG y Escolta Vial', rubro_its_sugerido: 'PEAJE_TAG' },
  { codigo_cuenta: '5201-01', nombre_cuenta: 'Gastos de Oficina y Administración', rubro_its_sugerido: 'GASTO_EXTRA' }
]

const mostrarModalPlanCuentas = ref(false)
const textoPegadoLaudus = ref('')
const planCuentasLaudus = ref([...CUENTAS_LAUDUS_BASE])
const nuevaCuentaLaudus = reactive({
  codigo_cuenta: '',
  nombre_cuenta: '',
  rubro_its_sugerido: 'REPUESTOS_TALLER'
})

// Catálogo WMS (2.854 SKUs) para buscador predictivo en Solped y OC
const catalogoProductosWms = ref([])
const busquedaCatalogoWms = ref('')
const busquedaCatalogoWmsOc = ref('')

const sugerenciasCatalogoWms = computed(() => {
  const q = busquedaCatalogoWms.value.trim().toLowerCase()
  if (q.length < 2) return []
  return catalogoProductosWms.value
    .filter(p => (p.nombre || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.codigo_legado || '').toLowerCase().includes(q))
    .slice(0, 8)
})

const sugerenciasCatalogoWmsOc = computed(() => {
  const q = busquedaCatalogoWmsOc.value.trim().toLowerCase()
  if (q.length < 2) return []
  return catalogoProductosWms.value
    .filter(p => (p.nombre || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.codigo_legado || '').toLowerCase().includes(q))
    .slice(0, 8)
})

function getCuentaSugeridaPorRubro(rubro) {
  return planCuentasLaudus.value.find(c => c.rubro_its_sugerido === rubro) || planCuentasLaudus.value[0]
}

function getNombreCuentaLaudus(codigo) {
  const found = planCuentasLaudus.value.find(c => c.codigo_cuenta === codigo)
  return found ? found.nombre_cuenta : ''
}

function cargarPlanCuentasLocal() {
  try {
    const raw = localStorage.getItem('gsp_plan_cuentas_laudus_v1')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        planCuentasLaudus.value = parsed
      }
    }
  } catch (_) {}
}

function persistirPlanCuentasLocal() {
  try {
    localStorage.setItem('gsp_plan_cuentas_laudus_v1', JSON.stringify(planCuentasLaudus.value))
  } catch (_) {}
}

function procesarPegadoPlanCuentas() {
  const raw = textoPegadoLaudus.value.trim()
  if (!raw) return
  const lineas = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  let agregadas = 0
  lineas.forEach(linea => {
    const partes = linea.split(/\t|;|\|/).map(s => s.trim()).filter(Boolean)
    if (partes.length >= 2) {
      const codigo = partes[0]
      const nombre = partes[1]
      const rubro = partes[2] || 'REPUESTOS_TALLER'
      const idxExist = planCuentasLaudus.value.findIndex(c => c.codigo_cuenta === codigo)
      if (idxExist >= 0) {
        planCuentasLaudus.value[idxExist] = { codigo_cuenta: codigo, nombre_cuenta: nombre, rubro_its_sugerido: rubro }
      } else {
        planCuentasLaudus.value.push({ codigo_cuenta: codigo, nombre_cuenta: nombre, rubro_its_sugerido: rubro })
      }
      agregadas++
    }
  })
  persistirPlanCuentasLocal()
  textoPegadoLaudus.value = ''
  alert(`Se procesaron ${agregadas} cuentas contables en el Plan de Cuentas Laudus.`)
}

function agregarCuentaLaudusManual() {
  if (!nuevaCuentaLaudus.codigo_cuenta.trim() || !nuevaCuentaLaudus.nombre_cuenta.trim()) return
  const codigo = nuevaCuentaLaudus.codigo_cuenta.trim()
  const idxExist = planCuentasLaudus.value.findIndex(c => c.codigo_cuenta === codigo)
  if (idxExist >= 0) {
    planCuentasLaudus.value[idxExist] = { ...nuevaCuentaLaudus, codigo_cuenta: codigo }
  } else {
    planCuentasLaudus.value.push({ ...nuevaCuentaLaudus, codigo_cuenta: codigo })
  }
  persistirPlanCuentasLocal()
  nuevaCuentaLaudus.codigo_cuenta = ''
  nuevaCuentaLaudus.nombre_cuenta = ''
}

function eliminarCuentaLaudus(idx) {
  planCuentasLaudus.value.splice(idx, 1)
  persistirPlanCuentasLocal()
}

function restaurarPlanCuentasBase() {
  planCuentasLaudus.value = [...CUENTAS_LAUDUS_BASE]
  persistirPlanCuentasLocal()
}

async function cargarCatalogoWms() {
  try {
    const res = await apiAxios.get('/inventario/productos')
    const lista = res.data?.data || res.data?.productos || res.data || []
    if (Array.isArray(lista)) {
      catalogoProductosWms.value = lista
    }
  } catch (_) {}
}

function inyectarProductoEnSolped(prod) {
  const itemNuevo = {
    id_producto: prod.id,
    sku: prod.sku,
    descripcion: `${prod.sku} - ${prod.nombre}`,
    unidad: prod.uom || 'UN',
    cantidad: 1,
    precio_estimado: Number(prod.pmp || prod.costo_promedio || 0)
  }
  if (formSolicitud.items_json.length === 1 && !formSolicitud.items_json[0].descripcion) {
    formSolicitud.items_json[0] = itemNuevo
  } else {
    formSolicitud.items_json.push(itemNuevo)
  }
  if (!formSolicitud.titulo_necesidad) {
    formSolicitud.titulo_necesidad = `Reposición / Compra ${prod.nombre} (${prod.sku})`
  }
  busquedaCatalogoWms.value = ''
}

function inyectarProductoEnOC(prod) {
  const lineaNueva = {
    id_producto: prod.id,
    sku_codigo: prod.sku,
    descripcion: prod.nombre,
    unidad_medida: prod.uom || 'UN',
    cantidad: 1,
    precio_unitario: Number(prod.pmp || prod.costo_promedio || 0),
    descuento_pct: 0
  }
  if (formOC.lineas.length === 1 && !formOC.lineas[0].descripcion) {
    formOC.lineas[0] = lineaNueva
  } else {
    formOC.lineas.push(lineaNueva)
  }
  busquedaCatalogoWmsOc.value = ''
}

const kpis = reactive({
  solicitudes_pendientes: 0,
  solicitudes_convertidas: 0,
  total_solicitudes: 0,
  ocs_por_visar_omar: 0,
  ocs_autorizadas: 0,
  ocs_borrador: 0,
  ocs_rechazadas: 0,
  ocs_imputadas_its: 0,
  monto_neto_comprometido: 0,
  monto_total_comprometido: 0
})

const ocsPorRazonSocial = ref([])
const selectores = reactive({
  empresas_grupo: [],
  proyectos_activos: [],
  ots_mantenimiento: [],
  equipos: []
})

const solicitudes = ref([])
const ordenes = ref([])
const laudusEdits = reactive({})

const opcionesEmpresasFiltro = [
  { id: 0, label: 'Todas', prefijo: '', activeClass: 'bg-amber-500 text-slate-950 border-amber-400 shadow' },
  { id: 9, label: 'Grúas San Pablo', prefijo: 'GSP · 9', activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { id: 11, label: 'Royal Rental', prefijo: 'RYL · 11', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { id: 7, label: 'Bestmaq', prefijo: 'BMQ · 7', activeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { id: 8, label: 'Logística del Sur', prefijo: 'LDS · 8', activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
]

const empresasHoldingCards = [
  { id_empresa: 9, nombre_corto: 'Grúas San Pablo', prefijo: 'GSP', rut: '52.004.162-1' },
  { id_empresa: 11, nombre_corto: 'Royal Rental', prefijo: 'RYL', rut: '78.254.535-3' },
  { id_empresa: 7, nombre_corto: 'Bestmaq', prefijo: 'BMQ', rut: '76.209.534-3' },
  { id_empresa: 8, nombre_corto: 'Logística del Sur', prefijo: 'LDS', rut: '76.218.576-8' }
]

// Filtrado reactivo en cliente
const solicitudesFiltradas = computed(() => {
  return solicitudes.value.filter(s => {
    if (filtroEmpresa.value > 0 && Number(s.id_empresa) !== filtroEmpresa.value) return false
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const match =
        (s.folio_solicitud || '').toLowerCase().includes(q) ||
        (s.titulo_necesidad || '').toLowerCase().includes(q) ||
        (s.proveedor_sugerido || '').toLowerCase().includes(q) ||
        (s.codi_proyecto || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })
})

const ordenesFiltradas = computed(() => {
  return ordenes.value.filter(o => {
    if (filtroEmpresa.value > 0 && Number(o.id_empresa) !== filtroEmpresa.value) return false
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const match =
        (o.folio_oc || '').toLowerCase().includes(q) ||
        (o.razon_social_proveedor || '').toLowerCase().includes(q) ||
        (o.rut_proveedor || '').toLowerCase().includes(q) ||
        (o.codi_proyecto || '').toLowerCase().includes(q) ||
        (o.folio_laudus_oc || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })
})

// Modal Nueva Solicitud
const showModalSolicitud = ref(false)
const guardandoSolicitud = ref(false)
const formSolicitud = reactive({
  id_empresa: 9,
  origen_solicitud: 'OPERACIONES_OT',
  id_proyecto: null,
  id_ot_mantenimiento: null,
  rubro_its: 'FLETE_EXTERNO',
  codigo_cuenta_laudus: '5102-01',
  centro_costo_laudus: 'CASA MATRIZ TEMUCO',
  prioridad: 'NORMAL',
  titulo_necesidad: '',
  justificacion: '',
  proveedor_sugerido: '',
  nombre_solicita: 'Operaciones GSP',
  items_json: [{ descripcion: '', unidad: 'SERV', cantidad: 1, precio_estimado: 0 }]
})

// Modal Emitir OC
const showModalOC = ref(false)
const guardandoOC = ref(false)
const formOC = reactive({
  id_solicitud: null,
  folio_solicitud_ref: null,
  id_empresa: 9,
  id_proyecto: null,
  id_ot_mantenimiento: null,
  rubro_its: 'FLETE_EXTERNO',
  codigo_cuenta_laudus: '5102-01',
  centro_costo_laudus: 'CASA MATRIZ TEMUCO',
  rut_proveedor: '',
  razon_social_proveedor: '',
  contacto_proveedor: '',
  email_proveedor: '',
  telefono_proveedor: '',
  condicion_pago: 'Crédito 30 días',
  moneda: 'CLP',
  glosa_general: '',
  lineas: [{ sku_codigo: '', descripcion: '', unidad_medida: 'UN', cantidad: 1, precio_unitario: 0, descuento_pct: 0 }]
})

// Modal Magic Link Omar
const enviandoFirmaId = ref(null)
const copiadoOk = ref(false)
const modalMagicLink = reactive({
  visible: false,
  folio_oc: '',
  proveedor: '',
  monto_total: 0,
  url_relativa: '',
  url_absoluta: ''
})

// Modal Impresión A4
const printIframeRef = ref(null)
const modalPrint = reactive({
  visible: false,
  folio_oc: '',
  html: ''
})

const sincronizandoId = ref(null)

function formatCurrency(val) {
  const n = Math.round(Number(val || 0))
  return '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formatDate(d) {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return String(d)
  return dt.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getEmpresaNombre(idEmp) {
  const map = { 9: 'Grúas San Pablo', 11: 'Royal Rental', 7: 'Bestmaq', 8: 'Logística del Sur' }
  return map[Number(idEmp)] || 'Grúas San Pablo'
}

function getEmpresaBadgeClass(idEmp) {
  const n = Number(idEmp)
  if (n === 11) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (n === 7) return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  if (n === 8) return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
}

function getPrioridadClass(prio) {
  if (prio === 'URGENTE_PARADA') return 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
  if (prio === 'ALTA') return 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
  return 'bg-slate-800 text-slate-300'
}

function getEstadoOcBadgeClass(estado) {
  if (['AUTORIZADA', 'AUTORIZADA_CON_OBS', 'FACTURADA_LAUDUS', 'RECEPCIONADA_BODEGA'].includes(estado)) {
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  }
  if (estado === 'PENDIENTE_VB_OMAR') {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/40'
  }
  if (estado === 'RECHAZADA' || estado === 'ANULADA') {
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  }
  return 'bg-slate-800 text-slate-300 border-slate-700'
}

async function cargarTodo() {
  loading.value = true
  try {
    const params = filtroEmpresa.value > 0 ? { id_empresa: filtroEmpresa.value } : {}
    const [resResumen, resSol, resOc] = await Promise.all([
      apiAxios.get('/compras/resumen', { params }),
      apiAxios.get('/compras/solicitudes', { params }),
      apiAxios.get('/compras/ordenes', { params })
    ])

    if (resResumen.data?.kpis) {
      Object.assign(kpis, resResumen.data.kpis)
    }
    ocsPorRazonSocial.value = resResumen.data?.ocs_por_razon_social || []
    if (resResumen.data?.selectores) {
      Object.assign(selectores, resResumen.data.selectores)
    }

    solicitudes.value = resSol.data?.solicitudes || []
    ordenes.value = resOc.data?.ordenes || []

    ordenes.value.forEach(o => {
      const ctaSug = o.codigo_cuenta_laudus || getCuentaSugeridaPorRubro(o.rubro_its)?.codigo_cuenta || '5101-01'
      const ccSug = o.centro_costo_laudus || o.codi_proyecto || (o.numero_ot_mantenimiento ? `OT-${o.numero_ot_mantenimiento}` : 'CASA MATRIZ TEMUCO')
      laudusEdits[o.id_oc] = {
        folio_laudus_oc: o.folio_laudus_oc || '',
        folio_dte_factura_compra: o.folio_dte_factura_compra || '',
        codigo_cuenta_laudus: ctaSug,
        centro_costo_laudus: ccSug
      }
    })
  } catch (err) {
    console.error('Error cargando módulo de compras:', err)
  } finally {
    loading.value = false
  }
}

function cambiarFiltroEmpresa(id) {
  filtroEmpresa.value = id
  cargarTodo()
}

function onRubroSolicitudChange() {
  const sug = getCuentaSugeridaPorRubro(formSolicitud.rubro_its)
  if (sug) formSolicitud.codigo_cuenta_laudus = sug.codigo_cuenta
}

function onRubroOcChange() {
  const sug = getCuentaSugeridaPorRubro(formOC.rubro_its)
  if (sug) formOC.codigo_cuenta_laudus = sug.codigo_cuenta
}

function onOrigenSolicitudChange() {
  if (formSolicitud.origen_solicitud === 'TALLER_BODEGA') {
    formSolicitud.rubro_its = 'REPUESTOS_TALLER'
    formSolicitud.id_proyecto = null
    formSolicitud.centro_costo_laudus = 'TALLER CENTRAL TEMUCO'
  } else {
    formSolicitud.rubro_its = 'FLETE_EXTERNO'
    formSolicitud.id_ot_mantenimiento = null
    formSolicitud.centro_costo_laudus = 'CASA MATRIZ TEMUCO'
  }
  onRubroSolicitudChange()
}

function abrirModalNuevaSolicitud() {
  formSolicitud.id_empresa = filtroEmpresa.value > 0 ? filtroEmpresa.value : 9
  formSolicitud.origen_solicitud = 'OPERACIONES_OT'
  formSolicitud.id_proyecto = selectores.proyectos_activos[0]?.id_proyecto || null
  formSolicitud.id_ot_mantenimiento = null
  formSolicitud.rubro_its = 'FLETE_EXTERNO'
  formSolicitud.codigo_cuenta_laudus = '5102-01'
  formSolicitud.centro_costo_laudus = 'CASA MATRIZ TEMUCO'
  formSolicitud.prioridad = 'NORMAL'
  formSolicitud.titulo_necesidad = ''
  formSolicitud.justificacion = ''
  formSolicitud.proveedor_sugerido = ''
  formSolicitud.items_json = [{ descripcion: '', unidad: 'SERV', cantidad: 1, precio_estimado: 0 }]
  showModalSolicitud.value = true
}

function agregarItemSolicitud() {
  formSolicitud.items_json.push({ descripcion: '', unidad: 'UN', cantidad: 1, precio_estimado: 0 })
}

async function guardarNuevaSolicitud() {
  if (!formSolicitud.titulo_necesidad.trim()) {
    alert('Por favor ingrese el título o descripción de la necesidad.')
    return
  }
  guardandoSolicitud.value = true
  try {
    const payload = {
      ...formSolicitud,
      nombre_cuenta_laudus: getNombreCuentaLaudus(formSolicitud.codigo_cuenta_laudus)
    }
    await apiAxios.post('/compras/solicitudes', payload)
    showModalSolicitud.value = false
    activeTab.value = 'solicitudes'
    await cargarTodo()
  } catch (err) {
    alert(err.response?.data?.message || 'Error al crear solicitud de pedido')
  } finally {
    guardandoSolicitud.value = false
  }
}

function abrirModalNuevaOC() {
  formOC.id_solicitud = null
  formOC.folio_solicitud_ref = null
  formOC.id_empresa = filtroEmpresa.value > 0 ? filtroEmpresa.value : 9
  formOC.id_proyecto = selectores.proyectos_activos[0]?.id_proyecto || null
  formOC.id_ot_mantenimiento = null
  formOC.rubro_its = 'FLETE_EXTERNO'
  formOC.codigo_cuenta_laudus = '5102-01'
  formOC.centro_costo_laudus = 'CASA MATRIZ TEMUCO'
  formOC.rut_proveedor = ''
  formOC.razon_social_proveedor = ''
  formOC.contacto_proveedor = ''
  formOC.email_proveedor = ''
  formOC.condicion_pago = 'Crédito 30 días'
  formOC.glosa_general = ''
  formOC.lineas = [{ sku_codigo: '', descripcion: '', unidad_medida: 'SERV', cantidad: 1, precio_unitario: 0, descuento_pct: 0 }]
  showModalOC.value = true
}

function convertirSolicitudEnOC(sol) {
  formOC.id_solicitud = sol.id_solicitud
  formOC.folio_solicitud_ref = sol.folio_solicitud
  formOC.id_empresa = Number(sol.id_empresa || 9)
  formOC.id_proyecto = sol.id_proyecto || null
  formOC.id_ot_mantenimiento = sol.id_ot_mantenimiento || null
  formOC.rubro_its = sol.rubro_its || 'GASTO_EXTRA'
  formOC.codigo_cuenta_laudus = sol.codigo_cuenta_laudus || getCuentaSugeridaPorRubro(sol.rubro_its)?.codigo_cuenta || '5101-01'
  formOC.centro_costo_laudus = sol.centro_costo_laudus || sol.equipo_patente || sol.codi_proyecto || 'CASA MATRIZ TEMUCO'
  formOC.rut_proveedor = '76.540.320-1'
  formOC.razon_social_proveedor = sol.proveedor_sugerido || ''
  formOC.contacto_proveedor = ''
  formOC.email_proveedor = ''
  formOC.condicion_pago = 'Crédito 30 días'
  formOC.glosa_general = `${sol.titulo_necesidad}${sol.justificacion ? ' - ' + sol.justificacion : ''}`

  if (Array.isArray(sol.items_json) && sol.items_json.length > 0) {
    formOC.lineas = sol.items_json.map(it => ({
      id_producto: it.id_producto || null,
      sku_codigo: it.sku || '',
      descripcion: it.descripcion || sol.titulo_necesidad,
      unidad_medida: it.unidad || 'UN',
      cantidad: Number(it.cantidad || 1),
      precio_unitario: Number(it.precio_estimado || it.precio_unitario || sol.monto_estimado_neto || 0),
      descuento_pct: 0
    }))
  } else {
    formOC.lineas = [{
      sku_codigo: '',
      descripcion: sol.titulo_necesidad,
      unidad_medida: 'SERV',
      cantidad: 1,
      precio_unitario: Number(sol.monto_estimado_neto || 0),
      descuento_pct: 0
    }]
  }
  showModalOC.value = true
}

function agregarLineaOC() {
  formOC.lineas.push({ sku_codigo: '', descripcion: '', unidad_medida: 'UN', cantidad: 1, precio_unitario: 0, descuento_pct: 0 })
}

function calcularSubtotalLinea(lin) {
  const c = Math.max(0, Number(lin.cantidad || 0))
  const p = Math.max(0, Number(lin.precio_unitario || 0))
  const d = Math.min(100, Math.max(0, Number(lin.descuento_pct || 0)))
  return Math.round(c * p * (1 - d / 100))
}

const totalesFormOC = computed(() => {
  const neto = formOC.lineas.reduce((acc, l) => acc + calcularSubtotalLinea(l), 0)
  const iva = Math.round(neto * 0.19)
  return { neto, iva, total: neto + iva }
})

async function guardarNuevaOC(enviarInmediatoAOmar = false) {
  if (!formOC.rut_proveedor.trim() || !formOC.razon_social_proveedor.trim()) {
    alert('Por favor complete el RUT y Razón Social del Proveedor.')
    return
  }
  guardandoOC.value = true
  try {
    const { data } = await apiAxios.post('/compras/ordenes', formOC)
    const ocCreada = data.orden
    showModalOC.value = false
    activeTab.value = 'ordenes'
    await cargarTodo()

    if (enviarInmediatoAOmar && ocCreada?.id_oc) {
      await enviarAFirmaOmar(ocCreada)
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Error al emitir Orden de Compra')
  } finally {
    guardandoOC.value = false
  }
}

async function enviarAFirmaOmar(oc) {
  enviandoFirmaId.value = oc.id_oc
  try {
    const { data } = await apiAxios.post(`/compras/ordenes/${oc.id_oc}/enviar-vb-omar`, {})
    await cargarTodo()
    modalMagicLink.folio_oc = oc.folio_oc
    modalMagicLink.proveedor = oc.razon_social_proveedor
    modalMagicLink.monto_total = oc.monto_total
    modalMagicLink.url_relativa = data.url_aprobacion_movil
    modalMagicLink.url_absoluta = data.url_absoluta_aprobacion || (window.location.origin + data.url_aprobacion_movil)
    modalMagicLink.visible = true
  } catch (err) {
    alert(err.response?.data?.message || 'Error al generar token móvil para Omar')
  } finally {
    enviandoFirmaId.value = null
  }
}

function mostrarModalTokenExistente(oc) {
  modalMagicLink.folio_oc = oc.folio_oc
  modalMagicLink.proveedor = oc.razon_social_proveedor
  modalMagicLink.monto_total = oc.monto_total
  modalMagicLink.url_relativa = oc.magic_link_omar
  modalMagicLink.url_absoluta = `https://servidor.leanglobal.cl${oc.magic_link_omar}`
  modalMagicLink.visible = true
}

const whatsappUrlOmar = computed(() => {
  const texto = `Hola Omar, se solicita tu V°B° móvil (1 toque) para la Orden de Compra *${modalMagicLink.folio_oc}* (${modalMagicLink.proveedor}) por *${formatCurrency(modalMagicLink.monto_total)}*: ${modalMagicLink.url_absoluta}`
  return `https://wa.me/?text=${encodeURIComponent(texto)}`
})

async function copiarMagicLink() {
  try {
    await navigator.clipboard.writeText(modalMagicLink.url_absoluta)
    copiadoOk.value = true
    setTimeout(() => { copiadoOk.value = false }, 2200)
  } catch (_) {}
}

async function verPdfOc(oc) {
  try {
    const { data } = await apiAxios.get(`/compras/ordenes/${oc.id_oc}/html-print`, {
      params: { format: 'json' }
    })
    modalPrint.folio_oc = oc.folio_oc
    modalPrint.html = data.html
    modalPrint.visible = true
  } catch (err) {
    window.open(`/api/compras/ordenes/${oc.id_oc}/html-print`, '_blank')
  }
}

function imprimirIframeOc() {
  if (printIframeRef.value && printIframeRef.value.contentWindow) {
    printIframeRef.value.contentWindow.focus()
    printIframeRef.value.contentWindow.print()
  }
}

async function guardarSincronizacionLaudus(oc) {
  sincronizandoId.value = oc.id_oc
  try {
    const edit = laudusEdits[oc.id_oc] || {}
    await apiAxios.post(`/compras/ordenes/${oc.id_oc}/sincronizar-its-laudus`, {
      folio_laudus_oc: edit.folio_laudus_oc,
      folio_dte_factura_compra: edit.folio_dte_factura_compra,
      codigo_cuenta_laudus: edit.codigo_cuenta_laudus,
      nombre_cuenta_laudus: getNombreCuentaLaudus(edit.codigo_cuenta_laudus),
      centro_costo_laudus: edit.centro_costo_laudus,
      imputado_en_its: true
    })
    await cargarTodo()
  } catch (err) {
    alert(err.response?.data?.message || 'Error al sincronizar con Laudus / ITS')
  } finally {
    sincronizandoId.value = null
  }
}

async function copiarFichaLaudus(oc) {
  const edit = laudusEdits[oc.id_oc] || {}
  const ctaNombre = getNombreCuentaLaudus(edit.codigo_cuenta_laudus)
  const lineaTexto = [
    oc.empresa_info?.rut || '52.004.162-1',
    oc.folio_oc,
    oc.rut_proveedor,
    oc.razon_social_proveedor,
    `${edit.codigo_cuenta_laudus || ''} ${ctaNombre}`,
    edit.centro_costo_laudus || 'CASA MATRIZ TEMUCO',
    Math.round(Number(oc.monto_neto || 0)),
    Math.round(Number(oc.monto_iva || 0)),
    Math.round(Number(oc.monto_total || 0)),
    edit.folio_dte_factura_compra || 'PENDIENTE'
  ].join('\t')
  try {
    await navigator.clipboard.writeText(lineaTexto)
    alert(`Imputación Laudus copiada al portapapeles para ${oc.folio_oc}`)
  } catch (_) {}
}

function exportarPreImputacionLaudusCSV() {
  const headers = [
    'RUT_Empresa_Holding',
    'Empresa_Holding',
    'Folio_OC_Interna',
    'Estado_OC',
    'RUT_Proveedor',
    'Razon_Social_Proveedor',
    'Codigo_Cuenta_Laudus',
    'Nombre_Cuenta_Laudus',
    'Centro_Costo_Laudus',
    'OT_Proyecto_Asociado',
    'Monto_Neto_CLP',
    'Monto_IVA_CLP',
    'Monto_Total_CLP',
    'Folio_OC_Laudus',
    'Folio_DTE_Factura_Compra'
  ]
  const filas = ordenesFiltradas.value.map(o => {
    const edit = laudusEdits[o.id_oc] || {}
    const codCta = edit.codigo_cuenta_laudus || o.codigo_cuenta_laudus || getCuentaSugeridaPorRubro(o.rubro_its)?.codigo_cuenta || ''
    const nomCta = getNombreCuentaLaudus(codCta)
    const cCosto = edit.centro_costo_laudus || o.centro_costo_laudus || o.codi_proyecto || 'CASA MATRIZ TEMUCO'
    return [
      o.empresa_info?.rut || '52.004.162-1',
      o.empresa_info?.nombre_corto || getEmpresaNombre(o.id_empresa),
      o.folio_oc,
      o.estado_oc,
      o.rut_proveedor,
      `"${(o.razon_social_proveedor || '').replace(/"/g, '""')}"`,
      codCta,
      `"${nomCta.replace(/"/g, '""')}"`,
      `"${cCosto.replace(/"/g, '""')}"`,
      o.codi_proyecto || (o.numero_ot_mantenimiento ? `OT-MANT-${o.numero_ot_mantenimiento}` : 'STOCK_GENERAL'),
      Math.round(Number(o.monto_neto || 0)),
      Math.round(Number(o.monto_iva || 0)),
      Math.round(Number(o.monto_total || 0)),
      edit.folio_laudus_oc || o.folio_laudus_oc || '',
      edit.folio_dte_factura_compra || o.folio_dte_factura_compra || ''
    ].join(';')
  })
  const csvContent = '\uFEFF' + [headers.join(';'), ...filas].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Pre_Imputacion_Compras_Laudus_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  cargarPlanCuentasLocal()
  cargarCatalogoWms()
  await cargarTodo()
  if (route.query.nueva_solped === '1') {
    abrirModalNuevaSolicitud()
    formSolicitud.origen_solicitud = 'TALLER_BODEGA'
    formSolicitud.rubro_its = 'INSUMOS_BODEGA'
    formSolicitud.codigo_cuenta_laudus = '1106-01'
    formSolicitud.centro_costo_laudus = 'BODEGA CENTRAL WMS'
    formSolicitud.prioridad = route.query.criticidad === 'CRITICO' ? 'URGENTE_PARADA' : 'ALTA'
    const skuQ = route.query.sku || ''
    const nomQ = route.query.nombre || ''
    const cantQ = Number(route.query.cantidad || 1)
    formSolicitud.titulo_necesidad = `Reposición Stock Crítico: ${nomQ} (${skuQ})`
    formSolicitud.justificacion = `Generado automáticamente desde Monitor de Alertas & Punto de Reorden WMS.`
    formSolicitud.items_json = [{
      id_producto: route.query.id_producto ? Number(route.query.id_producto) : null,
      sku: skuQ,
      descripcion: `${skuQ} - ${nomQ}`,
      unidad: route.query.uom || 'UN',
      cantidad: cantQ,
      precio_estimado: 0
    }]
  }
})
</script>
