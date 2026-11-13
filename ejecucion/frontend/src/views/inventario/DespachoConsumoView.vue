<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- ENCABEZADO CANÓNICO WMS -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/5">
            <Send class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">Despacho a OT & Devolución de Sobrantes</h1>
              <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20 font-mono">
                WMS OUTBOUND · TALLER CENTRAL
              </span>
            </div>
            <p class="text-slate-400 text-xs mt-0.5">
              Picking y despacho de repuestos oficiales a órdenes de trabajo de flota, imputación atómica de costos al PMP y recepción de sobrantes con abono a la OT.
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="abrirModalDespachoRapido"
          class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus class="w-4 h-4" />
          <span>+ Despachar a OT</span>
        </button>
        <button
          @click="cargarDatos"
          :disabled="loading"
          class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin text-amber-400': loading }" />
        </button>
      </div>
    </div>

    <!-- TARJETAS KPIS SUPERIORES EN TIEMPO REAL -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">OTs en Taller Activas</div>
          <div class="text-2xl font-black text-amber-400 mt-1 font-mono">{{ otsActivas.length }}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">Esperando o con repuestos</div>
        </div>
        <div class="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Wrench class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Líneas Despachadas Hoy</div>
          <div class="text-2xl font-black text-white mt-1 font-mono">{{ kpiDespachosHoy }}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">Asientos SALIDA_OT</div>
        </div>
        <div class="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Package class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Costo Imputado a Flota</div>
          <div class="text-2xl font-black text-emerald-400 mt-1 font-mono">{{ formatCurrency(totalImputadoFlota) }}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">Repuestos WMS devengados</div>
        </div>
        <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <DollarSign class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Sobrantes Devueltos</div>
          <div class="text-2xl font-black text-purple-400 mt-1 font-mono">{{ formatCurrency(totalSobrantesDevueltos) }}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">Abonos contables a OTs</div>
        </div>
        <div class="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <ArrowDownLeft class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- SELECTOR DE PESTAÑAS PRINCIPALES -->
    <div class="flex gap-2 mb-6 border-b border-slate-800/80 pb-3">
      <button
        @click="activeTab = 'salida'"
        :class="[
          'px-4 py-2 font-black text-xs rounded-xl uppercase tracking-wider transition-all flex items-center gap-2',
          activeTab === 'salida' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        <ArrowUpRight class="w-4 h-4" />
        <span>Salida a OT (Picking &amp; Imputación)</span>
      </button>
      <button
        @click="activeTab = 'devolucion'"
        :class="[
          'px-4 py-2 font-black text-xs rounded-xl uppercase tracking-wider transition-all flex items-center gap-2',
          activeTab === 'devolucion' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        <ArrowDownLeft class="w-4 h-4" />
        <span>Devolución a Bodega (Crédito a OT)</span>
        <span v-if="consumosWms.length > 0" class="px-2 py-0.2 rounded-full text-[10px] bg-slate-950/80 font-mono" :class="activeTab === 'devolucion' ? 'text-slate-950 bg-amber-400/40' : 'text-slate-400'">
          {{ consumosWms.length }}
        </span>
      </button>
    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 1: SALIDA A OT (PICKING E IMPUTACIÓN)                         -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'salida'" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- COLUMNA IZQUIERDA: SELECTOR DE OTS ACTIVAS (4 COLS) -->
      <div class="lg:col-span-4 space-y-4">
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div class="flex items-center justify-between gap-2 mb-3">
            <h2 class="text-xs font-bold text-white uppercase font-mono tracking-wider">Órdenes de Trabajo de Flota</h2>
            <span class="text-[11px] font-mono text-amber-400 font-bold">{{ filteredOts.length }} activas</span>
          </div>

          <!-- Buscador de OT -->
          <div class="relative mb-3">
            <Search class="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              v-model="searchOt"
              type="text"
              placeholder="Buscar por folio, grúa o patente..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <!-- Listado scrollable de OTs -->
          <div class="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            <div
              v-for="ot in filteredOts"
              :key="ot.id_ot"
              @click="seleccionarOt(ot)"
              :class="[
                'p-3.5 rounded-xl border cursor-pointer transition-all',
                selectedOt?.id_ot === ot.id_ot
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-500/5'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
              ]"
            >
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <span class="font-mono font-black text-xs text-amber-400">{{ ot.folio || `OT-${ot.id_ot}` }}</span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border',
                    ot.prioridad === 1 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                    ot.prioridad === 2 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  ]"
                >
                  {{ ot.tipo_mantenimiento || 'CORRECTIVO' }}
                </span>
              </div>

              <div class="font-bold text-white text-xs truncate">
                {{ ot.equipo_marca || '' }} {{ ot.equipo_nombre || 'Equipo GSP' }}
              </div>
              <div class="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                <span>Patente: <strong class="text-slate-300">{{ ot.patente || 'S/P' }}</strong></span>
                <span class="text-emerald-400 font-bold">{{ formatCurrency(ot.costo_materiales) }}</span>
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-500 mt-1 border-t border-slate-800/60 pt-1">
                <span class="truncate">Téc: {{ ot.nombre_tecnico || 'Por Asignar' }}</span>
                <span>{{ ot.estado || 'ABIERTA' }}</span>
              </div>
            </div>

            <div v-if="filteredOts.length === 0" class="text-center py-8 text-xs text-slate-500">
              No se encontraron OTs con los filtros aplicados.
            </div>
          </div>
        </div>
      </div>

      <!-- COLUMNA DERECHA: DETALLE DE LA OT SELECCIONADA Y MATERIALES IMPUTADOS (8 COLS) -->
      <div class="lg:col-span-8 space-y-4">
        <div v-if="selectedOt" class="space-y-4">
          <!-- FICHA CABECERA DE LA OT -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-lg font-black font-mono text-amber-400">{{ selectedOt.folio || `OT-${selectedOt.id_ot}` }}</span>
                  <span class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                    {{ selectedOt.estado || 'EN_PROCESO' }}
                  </span>
                </div>
                <div class="text-sm font-bold text-white mt-1">
                  {{ selectedOt.equipo_marca }} {{ selectedOt.equipo_nombre }} · Patente {{ selectedOt.patente || 'S/P' }}
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="text-right">
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-bold">Total Materiales Imputados</div>
                  <div class="text-xl font-black font-mono text-emerald-400">{{ formatCurrency(totalMaterialesOtActual) }}</div>
                </div>
                <button
                  @click="abrirModalDespacho(selectedOt)"
                  class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
                >
                  <Plus class="w-4 h-4" /> Despachar Repuesto
                </button>
              </div>
            </div>

            <!-- Datos técnicos del activo -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-xs">
              <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span class="text-[10px] text-slate-500 font-bold uppercase block">Técnico Asignado</span>
                <span class="text-white font-bold truncate block">{{ selectedOt.nombre_tecnico || 'Taller Central' }}</span>
              </div>
              <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span class="text-[10px] text-slate-500 font-bold uppercase block">Tipo Mantención</span>
                <span class="text-amber-400 font-bold block">{{ selectedOt.tipo_mantenimiento || 'Preventivo' }}</span>
              </div>
              <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span class="text-[10px] text-slate-500 font-bold uppercase block">Horómetro Entrada</span>
                <span class="text-white font-bold font-mono block">{{ selectedOt.horometro_inicio || '—' }} hrs</span>
              </div>
              <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span class="text-[10px] text-slate-500 font-bold uppercase block">Fecha Programada</span>
                <span class="text-slate-300 font-mono block">{{ formatDate(selectedOt.fecha_programada || selectedOt.fecha_creacion) }}</span>
              </div>
            </div>
          </div>

          <!-- TABLA DE REPUESTOS DESPACHADOS A LA OT -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap justify-between items-center gap-2">
              <div class="flex items-center gap-2">
                <h3 class="text-xs font-bold text-white uppercase font-mono tracking-wider">Repuestos &amp; Materiales Imputados</h3>
                <span class="text-[11px] text-slate-400 font-mono">({{ repuestosOtActual.length }} líneas)</span>
              </div>
              <span class="text-xs text-slate-400 font-mono">Descuento atómico de stock y costo PMP garantizado</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase">
                    <th class="p-3">Insumo / Descripción</th>
                    <th class="p-3">Origen / Casillero</th>
                    <th class="p-3 text-center">Cantidad</th>
                    <th class="p-3 text-right">Costo Unitario</th>
                    <th class="p-3 text-right">Total Imputado</th>
                    <th class="p-3 text-center">Estado</th>
                    <th class="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-mono">
                  <tr v-for="rep in repuestosOtActual" :key="rep.id_ot_repuesto" class="hover:bg-slate-800/30 transition-colors">
                    <td class="p-3 font-sans">
                      <div class="font-bold text-white">{{ rep.descripcion_material }}</div>
                      <div v-if="rep.sku" class="text-[11px] text-amber-400/90 font-mono">{{ rep.sku }}</div>
                    </td>
                    <td class="p-3">
                      <span
                        v-if="rep.origen_insumo === 'BODEGA_WMS'"
                        class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1"
                      >
                        📦 WMS: {{ rep.codigo_ubicacion || 'Pañol' }}
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1"
                      >
                        📝 Compra Faena: {{ rep.numero_documento_compra || 'S/D' }}
                      </span>
                    </td>
                    <td class="p-3 text-center text-white font-bold">
                      {{ formatCantidad(rep.cantidad, rep.unidad_medida) }}
                    </td>
                    <td class="p-3 text-right text-slate-300">
                      {{ formatCurrency(rep.costo_unitario) }}
                    </td>
                    <td class="p-3 text-right text-emerald-400 font-bold">
                      {{ formatCurrency(rep.costo_total || (Number(rep.cantidad) * Number(rep.costo_unitario))) }}
                    </td>
                    <td class="p-3 text-center">
                      <span
                        :class="[
                          'px-2 py-0.5 rounded text-[10px] font-black uppercase border',
                          rep.estado === 'SOLICITADO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' :
                          rep.estado === 'DEVUELTO' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        ]"
                      >
                        {{ rep.estado === 'SOLICITADO' ? '⏳ SOLICITADO' : (rep.estado || 'ENTREGADO') }}
                      </span>
                    </td>
                    <td class="p-3 text-right">
                      <button
                        v-if="rep.estado === 'SOLICITADO'"
                        @click="abrirModalDespachoLinea(rep)"
                        class="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm shadow-amber-500/20 flex items-center gap-1 ml-auto"
                        title="Realizar picking y despachar físicamente a la OT"
                      >
                        <Package class="w-3.5 h-3.5" />
                        <span>Despachar</span>
                      </button>
                      <button
                        v-else-if="rep.origen_insumo === 'BODEGA_WMS' && rep.estado === 'ENTREGADO' && Number(rep.cantidad) > 0"
                        @click="abrirModalDevolucion(rep, selectedOt)"
                        class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[10px] font-bold border border-slate-700 whitespace-nowrap"
                        title="Devolver sobrante a pañol y acreditar costo a la OT"
                      >
                        ↩️ Devolver
                      </button>
                      <span v-else-if="rep.estado === 'DEVUELTO'" class="text-[10px] text-purple-400 font-mono">
                        Reintegrado
                      </span>
                      <span v-else class="text-slate-500 text-[10px]">—</span>
                    </td>
                  </tr>

                  <tr v-if="repuestosOtActual.length === 0">
                    <td colspan="7" class="p-8 text-center text-slate-500 font-sans">
                      <Package class="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p class="font-bold text-white">No se han despachado repuestos a esta OT todavía.</p>
                      <p class="text-xs text-slate-400 mt-1">Presione el botón "+ Despachar Repuesto" para realizar picking desde pañol central.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-else class="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500">
          <Wrench class="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <h3 class="text-base font-bold text-white">Seleccione una Orden de Trabajo</h3>
          <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Haga clic sobre cualquier orden de la columna izquierda para revisar sus consumos devengados o despachar nuevos materiales desde bodega.
          </p>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 2: DEVOLUCIÓN DE SOBRANTES A BODEGA (CRÉDITO A OT)            -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'devolucion'" class="space-y-4">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 class="text-xs font-bold text-white uppercase font-mono tracking-wider">Bitácora de Consumos WMS &amp; Devolución de Sobrantes</h2>
            <p class="text-[11px] text-slate-400">
              Devuelva excedentes de materiales retirados por taller. La devolución reingresa el stock físico a la estantería y <strong>acredita el costo exacto a la OT</strong>.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <div class="relative w-64">
              <Search class="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                v-model="searchDevolucion"
                type="text"
                placeholder="Buscar por OT, equipo o SKU..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <select
              v-model="filtroEstadoDevolucion"
              class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="TODOS">Todos los consumos</option>
              <option value="PENDIENTE">Disponibles para devolución</option>
              <option value="DEVUELTO">Devueltos a Pañol</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase">
                <th class="p-3">Folio OT</th>
                <th class="p-3">Grúa / Activo</th>
                <th class="p-3">Repuesto Insumo</th>
                <th class="p-3">Casillero Salida</th>
                <th class="p-3 text-center">Cant. Despachada</th>
                <th class="p-3 text-right">Costo PMP</th>
                <th class="p-3 text-right">Total Imputado</th>
                <th class="p-3 text-center">Estado</th>
                <th class="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono">
              <tr v-for="c in filteredConsumosWms" :key="c.id_ot_repuesto" class="hover:bg-slate-800/30 transition-colors">
                <td class="p-3 font-bold text-amber-400">
                  {{ c.numero_ot || `OT-${c.id_ot}` }}
                </td>
                <td class="p-3 text-slate-300 font-sans">
                  <div class="font-bold text-white">{{ c.equipo_marca }} {{ c.equipo_nombre }}</div>
                  <div class="text-[11px] text-slate-400 font-mono">Patente: {{ c.patente || 'S/P' }}</div>
                </td>
                <td class="p-3 font-sans">
                  <div class="font-bold text-white">{{ c.descripcion_material }}</div>
                  <div v-if="c.sku" class="text-[11px] text-amber-400/90 font-mono">{{ c.sku }}</div>
                </td>
                <td class="p-3 font-bold text-amber-300">
                  📍 {{ c.codigo_ubicacion || 'Pañol' }}
                </td>
                <td class="p-3 text-center text-white font-bold">
                  {{ formatCantidad(c.cantidad, c.unidad_medida) }}
                </td>
                <td class="p-3 text-right text-slate-300">
                  {{ formatCurrency(c.costo_unitario) }}
                </td>
                <td class="p-3 text-right text-emerald-400 font-bold">
                  {{ formatCurrency(c.costo_total || (Number(c.cantidad) * Number(c.costo_unitario))) }}
                </td>
                <td class="p-3 text-center">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-black uppercase border',
                      c.estado === 'DEVUELTO' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    ]"
                  >
                    {{ c.estado || 'ENTREGADO' }}
                  </span>
                </td>
                <td class="p-3 text-right">
                  <button
                    v-if="c.estado !== 'DEVUELTO' && Number(c.cantidad) > 0"
                    @click="abrirModalDevolucion(c, { id_ot: c.id_ot, folio: c.numero_ot, equipo_marca: c.equipo_marca, equipo_nombre: c.equipo_nombre, patente: c.patente })"
                    class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow transition-all whitespace-nowrap"
                  >
                    ↩️ Devolver Sobrante
                  </button>
                  <span v-else class="text-[11px] text-purple-400 font-bold">
                    Reintegrado al Pañol
                  </span>
                </td>
              </tr>

              <tr v-if="filteredConsumosWms.length === 0">
                <td colspan="9" class="p-8 text-center text-slate-500 font-sans">
                  No hay consumos de bodega WMS registrados o coincidentes con la búsqueda.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL ENTERPRISE 1: DESPACHO DE REPUESTOS DESDE BODEGA WMS            -->
    <!-- ===================================================================== -->
    <div v-if="showDespachoModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Send class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white uppercase font-mono">Despacho de Insumo a Orden de Trabajo</h3>
              <p class="text-[11px] text-slate-400">
                Imputación para {{ modalOtTarget?.folio || `OT-${modalOtTarget?.id_ot}` }} · {{ modalOtTarget?.equipo_marca }} {{ modalOtTarget?.equipo_nombre }}
              </p>
            </div>
          </div>
          <button @click="showDespachoModal = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Selector de OT si se abrió sin OT preseleccionada -->
        <div v-if="!modalOtTarget" class="space-y-1">
          <label class="text-[11px] font-bold text-slate-300 uppercase font-mono">Seleccione la Orden de Trabajo de Destino *</label>
          <select
            v-model="despachoForm.id_ot"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="" disabled>Seleccione una OT activa...</option>
            <option v-for="ot in otsActivas" :key="ot.id_ot" :value="ot.id_ot">
              {{ ot.folio || `OT-${ot.id_ot}` }} · {{ ot.equipo_marca }} {{ ot.equipo_nombre }} (Patente {{ ot.patente || 'S/P' }})
            </option>
          </select>
        </div>

        <!-- Buscador de Repuesto en Catálogo -->
        <div class="space-y-2">
          <label class="text-[11px] font-bold text-slate-300 uppercase font-mono">Buscar Repuesto en Catálogo Oficial *</label>
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              v-model="searchProdDespacho"
              type="text"
              placeholder="Escriba código SKU, nombre o código de fabricante..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <!-- Resultados del buscador de productos -->
          <div v-if="productosFiltrados.length > 0 && !productoSeleccionado" class="max-h-44 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60">
            <div
              v-for="p in productosFiltrados.slice(0, 10)"
              :key="p.id"
              @click="seleccionarProductoDespacho(p)"
              class="p-2.5 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-mono font-bold text-amber-400 mr-2">{{ p.sku }}</span>
                <span class="text-white">{{ p.nombre }}</span>
              </div>
              <div class="text-right font-mono">
                <span class="text-emerald-400 font-bold mr-2">{{ formatCantidad(p.stock_fisico, p.uom) }}</span>
                <span class="text-slate-400 text-[11px]">PMP: {{ formatCurrency(p.pmp) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ficha del Repuesto Seleccionado -->
        <div v-if="productoSeleccionado" class="p-3.5 bg-slate-950/80 rounded-2xl border border-amber-500/30 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-mono font-black text-xs text-amber-400">{{ productoSeleccionado.sku }}</span>
              <h4 class="text-xs font-bold text-white">{{ productoSeleccionado.nombre }}</h4>
            </div>
            <button @click="productoSeleccionado = null" class="text-xs text-slate-400 hover:text-rose-400">
              Cambiar repuesto ✕
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Stock Físico Libre</span>
              <span class="font-mono text-emerald-400 font-bold">{{ formatCantidad(productoSeleccionado.stock_fisico, productoSeleccionado.uom) }}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Costo PMP Vigente</span>
              <span class="font-mono text-white font-bold">{{ formatCurrency(productoSeleccionado.pmp) }}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Familia</span>
              <span class="text-slate-300 font-semibold truncate block">{{ productoSeleccionado.familia || 'General' }}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Unidad de Medida</span>
              <span class="font-mono text-cyan-400 font-bold">{{ productoSeleccionado.uom || 'UN' }}</span>
            </div>
          </div>

          <!-- Selector de Casillero / Ubicación física con stock -->
          <div class="space-y-1 pt-1">
            <label class="text-[11px] font-bold text-slate-300 uppercase font-mono">
              Casillero de Retiro / Picking *
            </label>
            <select
              v-model="despachoForm.id_ubicacion"
              class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="" disabled>Seleccione casillero con stock...</option>
              <option v-for="ub in ubicacionesProducto" :key="ub.id_ubicacion" :value="ub.id_ubicacion">
                📍 {{ ub.codigo_ubicacion }} · Disponible: {{ formatCantidad(ub.cantidad_fisica, productoSeleccionado.uom) }}
              </option>
            </select>
          </div>

          <!-- Cantidad a despachar -->
          <div class="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label class="text-[11px] font-bold text-slate-300 uppercase font-mono block mb-1">
                Cantidad a Entregar *
              </label>
              <input
                v-model.number="despachoForm.cantidad"
                type="number"
                :step="esUnidadDiscreta(productoSeleccionado.uom) ? '1' : '0.1'"
                :min="esUnidadDiscreta(productoSeleccionado.uom) ? '1' : '0.1'"
                :max="maxDespachoDisponible"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center text-sm font-black text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <span class="text-[10px] text-slate-400 mt-0.5 block">
                Máximo permitido: {{ maxDespachoDisponible }} {{ productoSeleccionado.uom }}
              </span>
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-300 uppercase font-mono block mb-1">
                Total a Imputar a la OT
              </label>
              <div class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center text-sm font-black text-emerald-400 font-mono">
                {{ formatCurrency(despachoForm.cantidad * (Number(productoSeleccionado.pmp) || 0)) }}
              </div>
              <span class="text-[10px] text-slate-400 mt-0.5 block">
                Al PMP oficial vigente sin margen
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            @click="showDespachoModal = false"
            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            @click="ejecutarDespacho"
            :disabled="!formularioDespachoValido || guardandoDespacho"
            class="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <Send class="w-4 h-4" />
            <span>{{ guardandoDespacho ? 'Procesando...' : 'Confirmar Despacho a OT' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL ENTERPRISE 2: DEVOLUCIÓN DE SOBRANTES A BODEGA (CRÉDITO A OT)   -->
    <!-- ===================================================================== -->
    <div v-if="showDevolucionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4 p-6">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ArrowDownLeft class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white uppercase font-mono">Devolución de Repuesto a Pañol</h3>
              <p class="text-[11px] text-slate-400">Reintegro de stock y crédito contable a la OT</p>
            </div>
          </div>
          <button @click="showDevolucionModal = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Ficha del repuesto a devolver -->
        <div class="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-amber-400">{{ modalDevolucionTarget?.numero_ot || `OT-${modalDevolucionTarget?.id_ot}` }}</span>
            <span class="text-xs text-white font-bold">{{ modalDevolucionTarget?.equipo_marca }} {{ modalDevolucionTarget?.equipo_nombre }}</span>
          </div>

          <div class="border-t border-slate-800/80 pt-2">
            <div class="font-bold text-white text-sm">{{ modalDevolucionTarget?.descripcion_material }}</div>
            <div v-if="modalDevolucionTarget?.sku" class="text-xs text-amber-400 font-mono">{{ modalDevolucionTarget?.sku }}</div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs pt-1">
            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Cantidad Entregada Original</span>
              <span class="font-mono text-white font-bold">{{ formatCantidad(modalDevolucionTarget?.cantidad, modalDevolucionTarget?.unidad_medida) }}</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Costo PMP Original</span>
              <span class="font-mono text-slate-300 font-bold">{{ formatCurrency(modalDevolucionTarget?.costo_unitario) }}</span>
            </div>
          </div>
        </div>

        <!-- Inputs de devolución -->
        <div class="space-y-3">
          <div>
            <label class="text-[11px] font-bold text-slate-300 uppercase font-mono block mb-1">
              Casillero / Rack de Reingreso Físico *
            </label>
            <select
              v-model="devolucionForm.id_ubicacion_destino"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="" disabled>Seleccione casillero de reingreso...</option>
              <option v-for="ub in todasUbicaciones" :key="ub.id_ubicacion" :value="ub.id_ubicacion">
                📍 {{ ub.codigo }} · {{ ub.nombre_bodega || 'Bodega Central' }} ({{ ub.tipo_ubicacion || 'RACK' }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] font-bold text-slate-300 uppercase font-mono block mb-1">
                Cantidad a Devolver *
              </label>
              <input
                v-model.number="devolucionForm.cantidad_devolver"
                type="number"
                :step="esUnidadDiscreta(modalDevolucionTarget?.unidad_medida) ? '1' : '0.1'"
                :min="esUnidadDiscreta(modalDevolucionTarget?.unidad_medida) ? '1' : '0.1'"
                :max="modalDevolucionTarget?.cantidad"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-sm font-black text-white focus:outline-none focus:border-purple-500 font-mono"
              />
              <span class="text-[10px] text-slate-400 mt-0.5 block">
                Máximo: {{ modalDevolucionTarget?.cantidad }} {{ modalDevolucionTarget?.unidad_medida }}
              </span>
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-300 uppercase font-mono block mb-1">
                Crédito a Descontar de la OT
              </label>
              <div class="w-full bg-slate-950 border border-purple-500/40 rounded-xl p-2.5 text-center text-sm font-black text-purple-400 font-mono">
                −{{ formatCurrency(devolucionForm.cantidad_devolver * (Number(modalDevolucionTarget?.costo_unitario) || 0)) }}
              </div>
              <span class="text-[10px] text-slate-400 mt-0.5 block">
                Genera asiento inmutable DEVOLUCION_OT
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            @click="showDevolucionModal = false"
            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            @click="ejecutarDevolucion"
            :disabled="!formularioDevolucionValido || guardandoDevolucion"
            class="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all"
          >
            <ArrowDownLeft class="w-4 h-4" />
            <span>{{ guardandoDevolucion ? 'Procesando...' : 'Confirmar Devolución' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL ENTERPRISE 3: PICKING Y DESPACHO DE LÍNEA SOLICITADA POR TALLER (SPEC-095) -->
    <div v-if="showDespachoLineaModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Package class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-black text-white uppercase font-mono">Despacho Físico a OT</h3>
              <p class="text-[11px] text-slate-400">Picking de pañol para {{ selectedOt?.folio || `OT-${selectedOt?.id_ot}` }}</p>
            </div>
          </div>
          <button @click="showDespachoLineaModal = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Ficha del repuesto solicitado -->
        <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
          <div class="text-[10px] text-slate-400 font-bold uppercase font-mono">Repuesto Solicitado por Taller</div>
          <div class="text-xs font-bold text-white">{{ modalDespachoLineaTarget?.descripcion_material }}</div>
          <div v-if="modalDespachoLineaTarget?.sku" class="text-[11px] text-amber-400 font-mono">{{ modalDespachoLineaTarget.sku }}</div>
          <div class="text-[11px] text-slate-400 mt-1">
            Cantidad Requerida: <strong class="text-white font-mono">{{ modalDespachoLineaTarget?.cantidad_solicitada || modalDespachoLineaTarget?.cantidad }} {{ modalDespachoLineaTarget?.unidad_medida }}</strong>
          </div>
        </div>

        <!-- Selector de Casillero con Stock Disponible -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-bold text-slate-300 uppercase font-mono">Seleccionar Casillero / Ubicación de Pañol *</label>
          <div v-if="ubicacionesLinea.length === 0" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            ⚠️ No hay existencias físicas disponibles en ningún casillero para este producto.
          </div>
          <select
            v-else
            v-model="despachoLineaForm.id_ubicacion"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
          >
            <option v-for="u in ubicacionesLinea" :key="u.id_ubicacion" :value="u.id_ubicacion">
              {{ u.codigo_ubicacion }} — Saldo disponible: {{ u.cantidad_fisica }} UN
            </option>
          </select>
        </div>

        <!-- Cantidad a Despachar -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-bold text-slate-300 uppercase font-mono">Cantidad a Despachar *</label>
          <input
            v-model.number="despachoLineaForm.cantidad_despachar"
            type="number"
            min="0.1"
            step="1"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
          />
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            @click="showDespachoLineaModal = false"
            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            @click="ejecutarDespachoLinea"
            :disabled="!despachoLineaForm.id_ubicacion || despachoLineaForm.cantidad_despachar <= 0 || guardandoDespachoLinea"
            class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <span v-if="guardandoDespachoLinea" class="animate-spin">⏳</span>
            <span>{{ guardandoDespachoLinea ? 'Procesando Picking...' : 'Confirmar Despacho Físico' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- BANNER TOAST NOTIFICACIÓN -->
    <div
      v-if="toast.show"
      :class="[
        'fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold transition-all transform',
        toast.tipo === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
      ]"
    >
      <CheckCircle2 v-if="toast.tipo === 'success'" class="w-5 h-5 text-emerald-400 shrink-0" />
      <AlertCircle v-else class="w-5 h-5 text-rose-400 shrink-0" />
      <span>{{ toast.mensaje }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Send, RefreshCw, Plus, ArrowDownLeft, ArrowUpRight, Search,
  CheckCircle2, AlertCircle, X, Wrench, Package, DollarSign
} from 'lucide-vue-next'
import apiAxios from '../../services/api'

// Estado General
const activeTab = ref('salida')
const loading = ref(false)

// Listas principales
const otsActivas = ref([])
const catalogoProductos = ref([])
const consumosWms = ref([])
const todasUbicaciones = ref([])
const kardexHoy = ref([])

// Filtros y búsquedas
const searchOt = ref('')
const selectedOt = ref(null)
const searchDevolucion = ref('')
const filtroEstadoDevolucion = ref('TODOS')

// Modales
const showDespachoModal = ref(false)
const modalOtTarget = ref(null)
const searchProdDespacho = ref('')
const productoSeleccionado = ref(null)
const ubicacionesProducto = ref([])
const guardandoDespacho = ref(false)
const despachoForm = ref({
  id_ot: '',
  id_producto: '',
  id_ubicacion: '',
  cantidad: 1
})

const showDevolucionModal = ref(false)
const modalDevolucionTarget = ref(null)
const guardandoDevolucion = ref(false)
const devolucionForm = ref({
  id_ot_repuesto: '',
  id_ubicacion_destino: '',
  cantidad_devolver: 1
})

// Modal Despacho Línea Solicitada (SPEC-095)
const showDespachoLineaModal = ref(false)
const modalDespachoLineaTarget = ref(null)
const guardandoDespachoLinea = ref(false)
const ubicacionesLinea = ref([])
const despachoLineaForm = ref({
  id_ot_repuesto: null,
  id_ubicacion: '',
  cantidad_despachar: 1
})

// Toast
const toast = ref({
  show: false,
  mensaje: '',
  tipo: 'success'
})

const mostrarToast = (mensaje, tipo = 'success') => {
  toast.value = { show: true, mensaje, tipo }
  setTimeout(() => { toast.value.show = false }, 4000)
}

// Formatters
const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(val || 0)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('es-CL')
  } catch (e) {
    return dateStr
  }
}

const esUnidadDiscreta = (uom) => {
  if (!uom) return true
  const u = uom.toUpperCase()
  return ['UN', 'PAR', 'JUEGO', 'KIT', 'PZA', 'TAMBOR', 'BALDE', 'ROLLO'].includes(u)
}

const formatCantidad = (cant, uom = 'UN') => {
  const n = Number(cant) || 0
  if (esUnidadDiscreta(uom)) {
    return `${Math.round(n)} ${uom}`
  }
  return `${n.toLocaleString('es-CL', { maximumFractionDigits: 2 })} ${uom}`
}

// Computeds
const filteredOts = computed(() => {
  let list = otsActivas.value
  if (searchOt.value.trim()) {
    const q = searchOt.value.toLowerCase()
    list = list.filter(ot =>
      (ot.folio && ot.folio.toLowerCase().includes(q)) ||
      (ot.equipo_marca && ot.equipo_marca.toLowerCase().includes(q)) ||
      (ot.equipo_nombre && ot.equipo_nombre.toLowerCase().includes(q)) ||
      (ot.patente && ot.patente.toLowerCase().includes(q)) ||
      (ot.nombre_tecnico && ot.nombre_tecnico.toLowerCase().includes(q))
    )
  }
  return list
})

const repuestosOtActual = computed(() => {
  if (!selectedOt.value || !Array.isArray(selectedOt.value.repuestos)) return []
  return selectedOt.value.repuestos
})

const totalMaterialesOtActual = computed(() => {
  return repuestosOtActual.value.reduce((acc, r) => {
    if (r.estado === 'DEVUELTO') return acc
    const c = Number(r.costo_total) || (Number(r.cantidad || 0) * Number(r.costo_unitario || 0))
    return acc + c
  }, 0)
})

const kpiDespachosHoy = computed(() => {
  return kardexHoy.value.filter(m => m.tipo_movimiento === 'SALIDA_OT').length
})

const totalImputadoFlota = computed(() => {
  return consumosWms.value.reduce((acc, c) => {
    if (c.estado === 'DEVUELTO') return acc
    return acc + (Number(c.costo_total) || (Number(c.cantidad || 0) * Number(c.costo_unitario || 0)))
  }, 0)
})

const totalSobrantesDevueltos = computed(() => {
  return kardexHoy.value
    .filter(m => m.tipo_movimiento === 'DEVOLUCION_OT')
    .reduce((acc, m) => acc + (Number(m.cantidad || 0) * Number(m.costo_unitario_pmp || 0)), 0)
})

const productosFiltrados = computed(() => {
  if (!searchProdDespacho.value.trim()) return []
  const q = searchProdDespacho.value.toLowerCase()
  return catalogoProductos.value.filter(p =>
    (p.sku && p.sku.toLowerCase().includes(q)) ||
    (p.nombre && p.nombre.toLowerCase().includes(q)) ||
    (p.codigo_legado && p.codigo_legado.toLowerCase().includes(q))
  )
})

const maxDespachoDisponible = computed(() => {
  if (!despachoForm.value.id_ubicacion) {
    return Number(productoSeleccionado.value?.stock_fisico) || 0
  }
  const ub = ubicacionesProducto.value.find(u => u.id_ubicacion === despachoForm.value.id_ubicacion)
  return Number(ub?.cantidad_fisica) || 0
})

const formularioDespachoValido = computed(() => {
  const otId = modalOtTarget.value?.id_ot || despachoForm.value.id_ot
  return (
    otId &&
    productoSeleccionado.value &&
    despachoForm.value.id_ubicacion &&
    despachoForm.value.cantidad > 0 &&
    despachoForm.value.cantidad <= maxDespachoDisponible.value
  )
})

const filteredConsumosWms = computed(() => {
  let list = consumosWms.value
  if (filtroEstadoDevolucion.value === 'PENDIENTE') {
    list = list.filter(c => c.estado !== 'DEVUELTO')
  } else if (filtroEstadoDevolucion.value === 'DEVUELTO') {
    list = list.filter(c => c.estado === 'DEVUELTO')
  }

  if (searchDevolucion.value.trim()) {
    const q = searchDevolucion.value.toLowerCase()
    list = list.filter(c =>
      (c.numero_ot && c.numero_ot.toLowerCase().includes(q)) ||
      (c.equipo_marca && c.equipo_marca.toLowerCase().includes(q)) ||
      (c.equipo_nombre && c.equipo_nombre.toLowerCase().includes(q)) ||
      (c.patente && c.patente.toLowerCase().includes(q)) ||
      (c.sku && c.sku.toLowerCase().includes(q)) ||
      (c.descripcion_material && c.descripcion_material.toLowerCase().includes(q))
    )
  }
  return list
})

const formularioDevolucionValido = computed(() => {
  return (
    devolucionForm.value.id_ot_repuesto &&
    devolucionForm.value.id_ubicacion_destino &&
    devolucionForm.value.cantidad_devolver > 0 &&
    modalDevolucionTarget.value &&
    devolucionForm.value.cantidad_devolver <= Number(modalDevolucionTarget.value.cantidad)
  )
})

// Acciones & API
const cargarDatos = async () => {
  loading.value = true
  try {
    const [resOts, resProds, resConsumos, resUbicaciones, resKardex] = await Promise.all([
      apiAxios.get('/mantenimiento/ots'),
      apiAxios.get('/inventario/productos'),
      apiAxios.get('/inventario/consumos-ot'),
      apiAxios.get('/inventario/ubicaciones'),
      apiAxios.get('/inventario/kardex')
    ])

    const otsData = resOts.data?.data || resOts.data || []
    otsActivas.value = otsData.filter(o => ['ABIERTA', 'EN_PROCESO', 'PENDIENTE_REPUESTOS'].includes(o.estado) || !o.estado)

    catalogoProductos.value = resProds.data?.data || resProds.data || []
    consumosWms.value = resConsumos.data?.data || resConsumos.data || []
    todasUbicaciones.value = resUbicaciones.data?.data || resUbicaciones.data || []
    kardexHoy.value = resKardex.data?.data || resKardex.data || []

    // Si hay una OT seleccionada, refrescar su detalle
    if (selectedOt.value) {
      const refreshed = otsData.find(o => o.id_ot === selectedOt.value.id_ot)
      if (refreshed) {
        await seleccionarOt(refreshed)
      }
    } else if (otsActivas.value.length > 0) {
      await seleccionarOt(otsActivas.value[0])
    }
  } catch (err) {
    console.error('Error cargando datos de inventario y OTs:', err)
    mostrarToast('Error al conectar con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

const seleccionarOt = async (ot) => {
  selectedOt.value = ot
  try {
    const { data } = await apiAxios.get(`/mantenimiento/ots/${ot.id_ot}`)
    const otDetail = data?.data || data
    selectedOt.value = {
      ...ot,
      repuestos: otDetail.repuestos || []
    }
  } catch (err) {
    console.error('Error al cargar detalle de repuestos de la OT:', err)
  }
}

const abrirModalDespacho = (ot) => {
  modalOtTarget.value = ot
  despachoForm.value.id_ot = ot.id_ot
  productoSeleccionado.value = null
  searchProdDespacho.value = ''
  despachoForm.value.id_ubicacion = ''
  despachoForm.value.cantidad = 1
  showDespachoModal.value = true
}

const abrirModalDespachoRapido = () => {
  if (selectedOt.value) {
    abrirModalDespacho(selectedOt.value)
  } else if (otsActivas.value.length > 0) {
    abrirModalDespacho(otsActivas.value[0])
  } else {
    modalOtTarget.value = null
    despachoForm.value.id_ot = ''
    productoSeleccionado.value = null
    searchProdDespacho.value = ''
    showDespachoModal.value = true
  }
}

const seleccionarProductoDespacho = async (prod) => {
  productoSeleccionado.value = prod
  despachoForm.value.id_producto = prod.id
  despachoForm.value.cantidad = 1

  // Buscar ubicaciones con stock para este producto
  try {
    const { data } = await apiAxios.get('/inventario/existencias', {
      params: { id_producto: prod.id }
    })
    const existencias = data?.data || data || []
    ubicacionesProducto.value = existencias.map(e => ({
      id_ubicacion: e.id_ubicacion || e.id,
      codigo_ubicacion: e.codigo_ubicacion || e.ubicacion_codigo || 'Pañol',
      cantidad_fisica: Number(e.cantidad_fisica || e.stock_fisico || 0)
    })).filter(u => u.cantidad_fisica > 0)

    if (ubicacionesProducto.value.length > 0) {
      despachoForm.value.id_ubicacion = ubicacionesProducto.value[0].id_ubicacion
    } else {
      despachoForm.value.id_ubicacion = ''
    }
  } catch (err) {
    console.error('Error cargando existencias del producto:', err)
    ubicacionesProducto.value = []
  }
}

const ejecutarDespacho = async () => {
  if (!formularioDespachoValido.value) return
  guardandoDespacho.value = true

  const idOt = modalOtTarget.value?.id_ot || despachoForm.value.id_ot

  try {
    const payload = {
      origen_insumo: 'BODEGA_WMS',
      id_producto: productoSeleccionado.value.id,
      id_ubicacion: despachoForm.value.id_ubicacion,
      cantidad: despachoForm.value.cantidad,
      unidad_medida: productoSeleccionado.value.uom || 'UN',
      es_despacho_directo: true
    }

    await apiAxios.post(`/mantenimiento/ots/${idOt}/materiales`, payload)

    mostrarToast(`Repuesto ${productoSeleccionado.value.sku} despachado exitosamente a la OT.`)
    showDespachoModal.value = false

    // Recargar datos y refrescar OT actual
    await cargarDatos()
  } catch (err) {
    console.error('Error al despachar material:', err)
    const msg = err.response?.data?.error || err.response?.data?.message || 'Error al procesar el despacho de almacén'
    mostrarToast(msg, 'error')
  } finally {
    guardandoDespacho.value = false
  }
}

const abrirModalDevolucion = (repuesto, ot) => {
  modalDevolucionTarget.value = {
    ...repuesto,
    numero_ot: ot.folio || ot.numero_ot || `OT-${ot.id_ot}`,
    equipo_marca: ot.equipo_marca,
    equipo_nombre: ot.equipo_nombre,
    patente: ot.patente
  }
  devolucionForm.value.id_ot_repuesto = repuesto.id_ot_repuesto
  devolucionForm.value.cantidad_devolver = Number(repuesto.cantidad) || 1
  devolucionForm.value.id_ubicacion_destino = repuesto.id_ubicacion || (todasUbicaciones.value[0]?.id_ubicacion || '')
  showDevolucionModal.value = true
}

const ejecutarDevolucion = async () => {
  if (!formularioDevolucionValido.value) return
  guardandoDevolucion.value = true

  try {
    const payload = {
      id_ot_repuesto: devolucionForm.value.id_ot_repuesto,
      id_ubicacion_destino: devolucionForm.value.id_ubicacion_destino,
      cantidad_devolver: devolucionForm.value.cantidad_devolver
    }

    await apiAxios.post('/inventario/devolucion-ot', payload)

    mostrarToast(`Devolución de ${devolucionForm.value.cantidad_devolver} ${modalDevolucionTarget.value?.unidad_medida} procesada y acreditada a la OT.`)
    showDevolucionModal.value = false

    // Recargar datos
    await cargarDatos()
  } catch (err) {
    console.error('Error al procesar devolución de repuesto:', err)
    const msg = err.response?.data?.error || err.response?.data?.message || 'Error al registrar la devolución a bodega'
    mostrarToast(msg, 'error')
  } finally {
    guardandoDevolucion.value = false
  }
}

const abrirModalDespachoLinea = async (rep) => {
  modalDespachoLineaTarget.value = rep
  despachoLineaForm.value.id_ot_repuesto = rep.id_ot_repuesto
  despachoLineaForm.value.cantidad_despachar = Number(rep.cantidad_solicitada || rep.cantidad || 1)
  despachoLineaForm.value.id_ubicacion = ''
  ubicacionesLinea.value = []
  showDespachoLineaModal.value = true

  try {
    const { data } = await apiAxios.get('/inventario/existencias', {
      params: { id_producto: rep.id_producto }
    })
    const existencias = data?.data || data || []
    ubicacionesLinea.value = existencias.map(e => ({
      id_ubicacion: e.id_ubicacion || e.id,
      codigo_ubicacion: e.codigo_ubicacion || e.ubicacion_codigo || 'Pañol Central',
      cantidad_fisica: Number(e.cantidad_fisica || e.stock_fisico || 0)
    })).filter(u => u.cantidad_fisica > 0)

    if (ubicacionesLinea.value.length > 0) {
      despachoLineaForm.value.id_ubicacion = ubicacionesLinea.value[0].id_ubicacion
    }
  } catch (err) {
    console.error('Error cargando existencias para despacho:', err)
  }
}

const ejecutarDespachoLinea = async () => {
  if (!despachoLineaForm.value.id_ubicacion || despachoLineaForm.value.cantidad_despachar <= 0) return
  guardandoDespachoLinea.value = true
  try {
    await apiAxios.post('/inventario/despacho-linea-ot', {
      id_ot_repuesto: despachoLineaForm.value.id_ot_repuesto,
      id_ubicacion: despachoLineaForm.value.id_ubicacion,
      cantidad_despachar: despachoLineaForm.value.cantidad_despachar
    })
    mostrarToast('Repuesto despachado exitosamente e imputado a la OT.')
    showDespachoLineaModal.value = false
    await cargarDatos()
  } catch (err) {
    console.error('Error despachando repuesto:', err)
    mostrarToast(err.response?.data?.error || err.message || 'Error al despachar repuesto', 'error')
  } finally {
    guardandoDespachoLinea.value = false
  }
}

onMounted(() => {
  cargarDatos()
})
</script>
