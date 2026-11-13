<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- ENCABEZADO CANÓNICO WMS ENTERPRISE -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-6">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-amber-400 rounded-2xl border border-amber-500/30 shadow-xl shadow-amber-500/10">
          <Truck class="w-8 h-8" />
        </div>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white uppercase font-mono">Traspasos entre Bodegas & Guías GDI</h1>
            <span class="text-[10px] font-black bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/30 tracking-widest uppercase">SPEC-094 ENTERPRISE</span>
          </div>
          <p class="text-slate-400 text-xs mt-1">
            Gestión de transferencias físicas entre Taller Central, bodegas faena, camiones taller móviles y convenios interempresa
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="fetchTraspasos"
          class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl border border-slate-800 transition-all text-xs font-bold uppercase tracking-wider"
          title="Refrescar datos del servidor"
        >
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>

        <button
          @click="abrirModalNuevoTraspaso"
          class="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-xl transition-all duration-200 shadow-xl shadow-amber-500/20 text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus class="w-4 h-4" />
          Nueva Guía de Traspaso (GDI)
        </button>
      </div>
    </div>

    <!-- BANNER EJECUTIVO DE KPIS REALES -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <!-- KPI 1: Guías en Tránsito -->
      <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div class="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          <span>En Tránsito Activo</span>
          <span class="flex h-2.5 w-2.5 relative">
            <span v-if="kpis.enTransito > 0" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5" :class="kpis.enTransito > 0 ? 'bg-cyan-400' : 'bg-slate-600'"></span>
          </span>
        </div>
        <div class="text-3xl font-black font-mono text-cyan-400 mt-2">{{ kpis.enTransito }}</div>
        <div class="text-[11px] text-slate-500 mt-1">Guías GDI viajando en ruta</div>
      </div>

      <!-- KPI 2: Traspasos Completados -->
      <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Traspasos Recibidos</div>
        <div class="text-3xl font-black font-mono text-emerald-400 mt-2">{{ kpis.recibidos }}</div>
        <div class="text-[11px] text-slate-500 mt-1">Recepción conforme en destino</div>
      </div>

      <!-- KPI 3: Unidades en Tránsito -->
      <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Unidades en Ruta</div>
        <div class="text-3xl font-black font-mono text-white mt-2">{{ kpis.unidadesEnRuta }} <span class="text-sm font-sans text-slate-400 font-normal">UN</span></div>
        <div class="text-[11px] text-slate-500 mt-1">Piezas / repuestos despachados</div>
      </div>

      <!-- KPI 4: Valorización en Ruta -->
      <div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Carga Valorizada</div>
        <div class="text-2xl font-black font-mono text-amber-400 mt-2 truncate">{{ formatCLP(kpis.valorEnRuta) }}</div>
        <div class="text-[11px] text-slate-500 mt-1">Costo PMP oficial en flete</div>
      </div>
    </div>

    <!-- CUERPO PRINCIPAL: LISTADO Y DETALLE DE SEGUIMIENTO -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- COLUMNA IZQUIERDA: HISTORIAL DE GUÍAS DE TRASPASO -->
      <div class="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <!-- Barra de Búsqueda y Filtros -->
        <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div class="relative w-full sm:w-72">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              v-model="filtroBusqueda"
              type="text"
              placeholder="Buscar GDI, bodega, chofer o repuesto..."
              class="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          <div class="flex items-center gap-1.5 self-end sm:self-auto bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              v-for="f in ['TODOS', 'EN_TRANSITO', 'RECIBIDO']"
              :key="f"
              @click="filtroEstado = f"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                filtroEstado === f ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              ]"
            >
              {{ f === 'TODOS' ? 'Todos' : f === 'EN_TRANSITO' ? 'En Tránsito' : 'Recibidos' }}
            </button>
          </div>
        </div>

        <!-- Tabla de Guías -->
        <div class="overflow-x-auto flex-1">
          <div v-if="loading && traspasos.length === 0" class="p-12 text-center text-slate-500">
            <RotateCw class="w-8 h-8 mx-auto animate-spin mb-3 text-amber-500" />
            <p class="text-xs uppercase font-mono tracking-wider">Cargando guías de traspaso...</p>
          </div>

          <div v-else-if="traspasosFiltrados.length === 0" class="p-12 text-center text-slate-500">
            <Truck class="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
            <p class="text-xs font-mono">No se encontraron traspasos con los filtros seleccionados.</p>
          </div>

          <table v-else class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase text-[11px]">
                <th class="p-3.5">Folio GDI</th>
                <th class="p-3.5">Bodega Origen</th>
                <th class="p-3.5">Destino</th>
                <th class="p-3.5">Líneas</th>
                <th class="p-3.5">Tipo</th>
                <th class="p-3.5">Fecha</th>
                <th class="p-3.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-medium">
              <tr
                v-for="trp in traspasosFiltrados"
                :key="trp.id_traspaso"
                @click="seleccionarTraspaso(trp)"
                :class="[
                  'cursor-pointer transition-colors',
                  selectedTrp?.id_traspaso === trp.id_traspaso ? 'bg-amber-500/10 border-l-4 border-amber-500' : 'hover:bg-slate-800/40'
                ]"
              >
                <td class="p-3.5 font-mono font-black text-amber-400">{{ trp.numero_guia }}</td>
                <td class="p-3.5 text-white font-medium text-[11px]">
                  <div class="flex items-center gap-1.5">
                    <MapPin class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{{ trp.bodega_origen_nombre }}</span>
                  </div>
                </td>
                <td class="p-3.5 text-white font-medium text-[11px]">
                  <div class="flex items-center gap-1.5">
                    <MapPin class="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{{ trp.tipo_traspaso === 'INTEREMPRESA' ? (trp.empresa_destino_nombre || 'Interempresa') : trp.bodega_destino_nombre }}</span>
                  </div>
                </td>
                <td class="p-3.5 text-slate-300 font-sans">
                  <span class="font-mono font-bold text-amber-300">{{ trp.total_lineas }}</span> ítem(s)
                  <span class="text-[10px] text-slate-500 block truncate max-w-[140px]">
                    {{ trp.lineas?.[0]?.producto_nombre || 'Sin líneas' }}
                  </span>
                </td>
                <td class="p-3.5">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider',
                      trp.tipo_traspaso === 'INTEREMPRESA'
                        ? 'bg-violet-500/10 text-violet-300 border-violet-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    ]"
                  >
                    {{ trp.tipo_traspaso === 'INTEREMPRESA' ? 'Interempresa' : 'Interbodega' }}
                  </span>
                </td>
                <td class="p-3.5 text-slate-400 font-mono text-[11px]">
                  {{ formatFecha(trp.fecha_solicitud || trp.created_at) }}
                </td>
                <td class="p-3.5 text-right">
                  <span
                    :class="[
                      'px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1',
                      trp.estado === 'RECIBIDO'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    ]"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="trp.estado === 'RECIBIDO' ? 'bg-emerald-400' : 'bg-cyan-400'"></span>
                    {{ trp.estado === 'RECIBIDO' ? 'Recibido' : 'En Tránsito' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- COLUMNA DERECHA: EXPEDIENTE DE LA GUÍA Y SEGUIMIENTO -->
      <div v-if="selectedTrp" class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
        <div class="space-y-4">
          <!-- Cabecera de la Guía -->
          <div class="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider font-mono">Guía de Despacho Interno</div>
              <div class="font-mono font-black text-2xl text-amber-400 mt-0.5">{{ selectedTrp.numero_guia }}</div>
            </div>
            <span
              :class="[
                'px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border',
                selectedTrp.estado === 'RECIBIDO'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              ]"
            >
              {{ selectedTrp.estado === 'RECIBIDO' ? 'Completado' : 'En Ruta' }}
            </span>
          </div>

          <!-- Origen y Destino Card -->
          <div class="flex items-center gap-2 text-xs">
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex-1">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Origen</span>
              <span class="text-white font-bold text-xs mt-0.5 block truncate">{{ selectedTrp.bodega_origen_nombre }}</span>
            </div>
            <ArrowRight class="w-4 h-4 text-amber-400 shrink-0" />
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex-1">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Destino</span>
              <span class="text-white font-bold text-xs mt-0.5 block truncate">
                {{ selectedTrp.tipo_traspaso === 'INTEREMPRESA' ? selectedTrp.empresa_destino_nombre : selectedTrp.bodega_destino_nombre }}
              </span>
            </div>
          </div>

          <!-- Datos de Transporte -->
          <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
            <div class="flex items-center justify-between text-slate-400">
              <span class="flex items-center gap-1.5"><User class="w-3.5 h-3.5 text-slate-500" /> Chofer / Transportista:</span>
              <span class="text-white font-mono font-bold">{{ selectedTrp.chofer_transporte || 'No registrado' }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-400">
              <span class="flex items-center gap-1.5"><Truck class="w-3.5 h-3.5 text-slate-500" /> Patente Vehículo:</span>
              <span class="text-amber-400 font-mono font-bold">{{ selectedTrp.patente_transporte || 'S/P' }}</span>
            </div>
            <div v-if="selectedTrp.observaciones" class="pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span class="font-bold text-slate-300">Nota:</span> {{ selectedTrp.observaciones }}
            </div>
          </div>

          <!-- Banner especial si es Interempresa -->
          <div v-if="selectedTrp.tipo_traspaso === 'INTEREMPRESA'" class="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-xs text-violet-300 space-y-1">
            <div class="font-bold flex items-center gap-1.5">
              <Building2 class="w-4 h-4 text-violet-400" /> Convenio / Préstamo Interempresa
            </div>
            <p class="text-[11px] text-violet-300/80 leading-relaxed">
              Genera asiento de salida en Grúas San Pablo y entrada en {{ selectedTrp.empresa_destino_nombre }} al costo PMP oficial.
            </p>
          </div>

          <!-- Stepper de 4 Pasos de la Guía -->
          <div class="space-y-2 pt-2">
            <div class="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Trazabilidad de la Ruta</div>
            <div class="space-y-1.5 text-xs">
              <div
                v-for="(st, idx) in pasosTimeline"
                :key="idx"
                class="flex items-center gap-3 p-2 rounded-xl transition-all"
                :class="isPasoActivo(idx) ? 'bg-slate-950 border border-slate-800 text-white' : 'text-slate-600'"
              >
                <div
                  class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono shrink-0"
                  :class="isPasoActivo(idx) ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'bg-slate-800 text-slate-500'"
                >
                  {{ idx + 1 }}
                </div>
                <div class="flex-1">
                  <div class="font-bold font-mono text-[11px]">{{ st.titulo }}</div>
                  <div class="text-[10px] text-slate-500">{{ st.subtitulo }}</div>
                </div>
                <CheckCircle2 v-if="isPasoActivo(idx)" class="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            </div>
          </div>

          <!-- Tabla de Líneas del Traspaso -->
          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase font-mono">
              <span>Cargamento ({{ selectedTrp.lineas?.length || 0 }} ítems)</span>
              <span class="text-amber-400">{{ formatCLP(selectedTrp.valor_total_clp) }}</span>
            </div>
            <div class="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/60 text-xs">
              <div v-for="lin in selectedTrp.lineas" :key="lin.id_traspaso_linea" class="p-2.5 flex items-center justify-between">
                <div>
                  <div class="font-bold text-white text-[11px]">{{ lin.producto_nombre }}</div>
                  <div class="text-[10px] text-slate-400 font-mono">
                    SKU: {{ lin.sku }} | Origen: {{ lin.codigo_ubicacion_origen || 'Casillero' }}
                    <span v-if="lin.codigo_ubicacion_destino" class="text-emerald-400 font-bold">➔ {{ lin.codigo_ubicacion_destino }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-mono font-bold text-amber-300">{{ lin.cantidad }} {{ lin.unidad_medida }}</div>
                  <div class="text-[10px] text-slate-500">{{ formatCLP(lin.costo_total) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botón de Recepción si está en tránsito -->
        <div class="pt-4 border-t border-slate-800 mt-4">
          <button
            v-if="selectedTrp.estado === 'EN_TRANSITO'"
            @click="abrirModalRecepcion(selectedTrp)"
            class="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <CheckCircle2 class="w-4 h-4" />
            Confirmar Recepción Física en Destino
          </button>
          <div v-else class="text-center text-xs text-slate-500 italic py-2 flex items-center justify-center gap-1.5">
            <ShieldCheck class="w-4 h-4 text-emerald-400" />
            Traspaso recibido conforme el {{ formatFecha(selectedTrp.fecha_recepcion) }}
          </div>
        </div>
      </div>

      <div v-else class="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center justify-center">
        <Package class="w-12 h-12 mb-3 text-slate-700" />
        <p class="text-xs uppercase font-mono tracking-wider">Seleccione una guía GDI del listado para inspeccionar su trazabilidad.</p>
      </div>
    </div>

    <!-- MODAL ENTERPRISE: NUEVO TRASPASO ENTRE BODEGAS -->
    <div
      v-if="showNuevoModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        <!-- Header Modal -->
        <div class="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Truck class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-black text-white uppercase font-mono">Emisión de Guía de Despacho Interno (GDI)</h2>
              <p class="text-xs text-slate-400">Traspaso físico con descuento automático de stock y trazabilidad Kardex</p>
            </div>
          </div>
          <button @click="showNuevoModal = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Formulario Modal -->
        <div class="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <!-- Alerta de Error en Modal -->
          <div v-if="modalError" class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ modalError }}</span>
          </div>

          <!-- Tipo de Traspaso y Bodega Origen -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-slate-300 uppercase">Bodega Origen *</label>
              <select
                v-model="formTrp.id_bodega_origen"
                @change="alCambiarBodegaOrigen"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option :value="null" disabled>Seleccione bodega origen...</option>
                <option v-for="b in bodegas" :key="b.id" :value="b.id">{{ b.nombre }}</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-slate-300 uppercase">Tipo de Traspaso *</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="formTrp.tipo_traspaso = 'INTERBODEGA'"
                  :class="[
                    'py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center',
                    formTrp.tipo_traspaso === 'INTERBODEGA' ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black' : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                  ]"
                >
                  Entre Bodegas GSP
                </button>
                <button
                  type="button"
                  @click="formTrp.tipo_traspaso = 'INTEREMPRESA'"
                  :class="[
                    'py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center',
                    formTrp.tipo_traspaso === 'INTEREMPRESA' ? 'bg-violet-600 text-white border-violet-500 shadow-md font-black' : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                  ]"
                >
                  Interempresa (Grupo)
                </button>
              </div>
            </div>
          </div>

          <!-- Bodega Destino / Empresa Destino -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-if="formTrp.tipo_traspaso === 'INTERBODEGA'" class="space-y-1.5">
              <label class="text-[11px] font-bold text-slate-300 uppercase">Bodega Destino GSP *</label>
              <select
                v-model="formTrp.id_bodega_destino"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option :value="null" disabled>Seleccione bodega receptora...</option>
                <option
                  v-for="b in bodegasDestinoDisponibles"
                  :key="b.id"
                  :value="b.id"
                >
                  {{ b.nombre }}
                </option>
              </select>
            </div>

            <div v-else class="space-y-1.5">
              <label class="text-[11px] font-bold text-violet-300 uppercase">Empresa Receptora *</label>
              <input
                v-model="formTrp.empresa_destino_nombre"
                type="text"
                placeholder="Ej: Royal Rental, Bestmaq, Logística del Sur..."
                class="w-full bg-slate-950 border border-violet-500/50 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-violet-400"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-slate-300 uppercase">Chofer</label>
                <input
                  v-model="formTrp.chofer_transporte"
                  type="text"
                  placeholder="Nombre transportista"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-slate-300 uppercase">Patente</label>
                <input
                  v-model="formTrp.patente_transporte"
                  type="text"
                  placeholder="AB-1234"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 uppercase font-mono"
                />
              </div>
            </div>
          </div>

          <!-- Observaciones -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold text-slate-300 uppercase">Motivo / Observaciones del Traslado</label>
            <input
              v-model="formTrp.observaciones"
              type="text"
              placeholder="Ej: Repuestos para mantención mayor preventiva 500 hrs..."
              class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <!-- Sección: Repuestos a Transferir -->
          <div class="pt-4 border-t border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Package class="w-4 h-4 text-amber-400" /> Detalle de Repuestos / Insumos
              </h3>
              <span class="text-[11px] text-amber-400 font-mono font-bold">
                {{ lineasTemp.length }} ítem(s) cargados
              </span>
            </div>

            <!-- Fila para agregar ítem -->
            <div class="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div class="sm:col-span-6 space-y-1">
                  <label class="text-[10px] text-slate-400 font-bold uppercase">Repuesto con Stock en Origen *</label>
                  <select
                    v-model="lineaNueva.itemStock"
                    @change="alSeleccionarProductoParaTrp"
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option :value="null" disabled>Seleccione repuesto con stock...</option>
                    <option
                      v-for="stk in stockDisponibleOrigen"
                      :key="stk.id"
                      :value="stk"
                    >
                      [{{ stk.sku }}] {{ stk.producto_nombre }} (Disp: {{ Number(stk.cantidad_disponible || stk.cantidad_fisica).toFixed(0) }} {{ stk.uom }} en {{ stk.ubicacion_codigo }})
                    </option>
                  </select>
                </div>

                <div class="sm:col-span-3 space-y-1">
                  <label class="text-[10px] text-slate-400 font-bold uppercase">Cantidad *</label>
                  <input
                    v-model.number="lineaNueva.cantidad"
                    type="number"
                    min="1"
                    :max="stockMaximoItem"
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div class="sm:col-span-3">
                  <button
                    type="button"
                    @click="agregarLineaTraspaso"
                    :disabled="!lineaNueva.itemStock || lineaNueva.cantidad <= 0"
                    class="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </div>

            <!-- Tabla de Líneas Agregadas -->
            <div v-if="lineasTemp.length > 0" class="overflow-x-auto rounded-xl border border-slate-800">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                    <th class="p-2.5">Repuesto</th>
                    <th class="p-2.5">Casillero Origen</th>
                    <th class="p-2.5 text-right">Cantidad</th>
                    <th class="p-2.5 text-right">PMP</th>
                    <th class="p-2.5 text-right">Subtotal</th>
                    <th class="p-2.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-medium">
                  <tr v-for="(l, idx) in lineasTemp" :key="idx" class="hover:bg-slate-800/30">
                    <td class="p-2.5 text-white">
                      <span class="font-mono text-amber-400 font-bold">[{{ l.sku }}]</span> {{ l.producto_nombre }}
                    </td>
                    <td class="p-2.5 font-mono text-cyan-400">{{ l.codigo_ubicacion_origen }}</td>
                    <td class="p-2.5 text-right font-mono font-bold text-white">{{ l.cantidad }} {{ l.uom }}</td>
                    <td class="p-2.5 text-right font-mono text-slate-400">{{ formatCLP(l.costo_unitario_pmp) }}</td>
                    <td class="p-2.5 text-right font-mono font-bold text-amber-300">{{ formatCLP(l.costo_total) }}</td>
                    <td class="p-2.5 text-center">
                      <button @click="eliminarLineaTemp(idx)" class="text-rose-400 hover:text-rose-300 p-1">
                        <X class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-slate-950 font-bold border-t border-slate-800 text-xs">
                    <td colspan="4" class="p-2.5 text-right font-mono uppercase text-slate-400">Total Flete Valorizado:</td>
                    <td class="p-2.5 text-right font-mono text-amber-400 text-sm">{{ formatCLP(totalLineasTemp) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer Modal -->
        <div class="p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            @click="showNuevoModal = false"
            class="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider"
          >
            Cancelar
          </button>

          <button
            @click="enviarNuevoTraspaso"
            :disabled="guardandoTrp || lineasTemp.length === 0"
            class="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <RotateCw v-if="guardandoTrp" class="w-4 h-4 animate-spin" />
            <Truck v-else class="w-4 h-4" />
            Emitir Guía GDI y Despachar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL ENTERPRISE: RECEPCIÓN FÍSICA EN DESTINO -->
    <div
      v-if="showRecepcionModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        <!-- Header Modal -->
        <div class="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <CheckCircle2 class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-black text-white uppercase font-mono">Confirmar Recepción de Guía {{ trpParaRecepcion?.numero_guia }}</h2>
              <p class="text-xs text-slate-400">Bodega Destino: {{ trpParaRecepcion?.bodega_destino_nombre }}</p>
            </div>
          </div>
          <button @click="showRecepcionModal = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Cuerpo Modal -->
        <div class="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div v-if="recepcionError" class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ recepcionError }}</span>
          </div>

          <p class="text-xs text-slate-300 leading-relaxed">
            Asigne a continuación el casillero físico de estantería en la bodega receptora donde almacenará cada repuesto. El sistema registrará el incremento físico en el stock y el asiento <strong class="text-emerald-400 font-mono">ENTRADA_TRASPASO</strong> en Kardex.
          </p>

          <!-- Listado de líneas a recepcionar -->
          <div class="space-y-3">
            <div
              v-for="lin in formRecepcion.lineas"
              :key="lin.id_traspaso_linea"
              class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5"
            >
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-mono text-amber-400 font-bold text-xs">[{{ lin.sku }}]</span>
                  <span class="text-white font-bold text-xs ml-2">{{ lin.producto_nombre }}</span>
                </div>
                <span class="font-mono font-black text-emerald-400 text-xs bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  {{ lin.cantidad }} {{ lin.unidad_medida }}
                </span>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] text-slate-400 font-bold uppercase">Casillero Destino Requerido *</label>
                <select
                  v-model="lin.id_ubicacion_destino"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option :value="null" disabled>Seleccione casillero en bodega destino...</option>
                  <option
                    v-for="u in ubicacionesDestino"
                    :key="u.id"
                    :value="u.id"
                  >
                    {{ u.codigo }} (Zona: {{ u.tipo_zona }})
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Observaciones Cierre -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold text-slate-300 uppercase">Observaciones de Recepción</label>
            <input
              v-model="formRecepcion.observaciones"
              type="text"
              placeholder="Ej: Bulto recibido con sello intacto y piezas revisadas conforme..."
              class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <!-- Footer Modal -->
        <div class="p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            @click="showRecepcionModal = false"
            class="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider"
          >
            Cancelar
          </button>

          <button
            @click="confirmarRecepcion"
            :disabled="guardandoRecepcion"
            class="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <RotateCw v-if="guardandoRecepcion" class="w-4 h-4 animate-spin" />
            <CheckCircle2 v-else class="w-4 h-4" />
            Completar Recepción Física
          </button>
        </div>
      </div>
    </div>

    <!-- TOAST ENTERPRISE DE NOTIFICACIÓN FLOTANTE -->
    <div
      v-if="toast.visible"
      class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold transition-all duration-300 transform translate-y-0"
      :class="toast.tipo === 'success' ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/95 border-rose-500/50 text-rose-200'"
    >
      <CheckCircle2 v-if="toast.tipo === 'success'" class="w-5 h-5 text-emerald-400 shrink-0" />
      <AlertCircle v-else class="w-5 h-5 text-rose-400 shrink-0" />
      <span>{{ toast.mensaje }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import {
  Truck,
  Plus,
  RotateCw,
  Search,
  CheckCircle2,
  MapPin,
  Package,
  ArrowRight,
  ShieldCheck,
  X,
  AlertCircle,
  Building2,
  User
} from 'lucide-vue-next'

// Instancia Axios conectada al endpoint DEV oficial
const api = axios.create({
  baseURL: '/lg-gsp-dev/api',
  timeout: 15000
})

// Estados principales
const loading = ref(false)
const traspasos = ref([])
const bodegas = ref([])
const existenciasGenerales = ref([])
const selectedTrp = ref(null)

// Filtros
const filtroBusqueda = ref('')
const filtroEstado = ref('TODOS')

// Toast
const toast = ref({ visible: false, mensaje: '', tipo: 'success' })
let toastTimer = null
const mostrarToast = (mensaje, tipo = 'success') => {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { visible: true, mensaje, tipo }
  toastTimer = setTimeout(() => {
    toast.value.visible = false
  }, 4000)
}

// Pasos del Stepper
const pasosTimeline = [
  { titulo: 'Preparado en Pañol', subtitulo: 'Empaque y verificación de ítems' },
  { titulo: 'Despachado con GDI', subtitulo: 'Descuento físico de origen y Kardex' },
  { titulo: 'En Tránsito (Transporte)', subtitulo: 'En traslado hacia destino' },
  { titulo: 'Recibido y Ubicado', subtitulo: 'Ingreso a casillero en bodega receptora' }
]

const isPasoActivo = (idx) => {
  if (!selectedTrp.value) return false
  if (selectedTrp.value.estado === 'RECIBIDO') return true
  return idx <= 2
}

// 4 KPIs calculados reactivamente
const kpis = computed(() => {
  let enTransito = 0
  let recibidos = 0
  let unidadesEnRuta = 0
  let valorEnRuta = 0

  for (const t of traspasos.value) {
    if (t.estado === 'RECIBIDO') {
      recibidos++
    } else {
      enTransito++
      unidadesEnRuta += Number(t.total_unidades || 0)
      valorEnRuta += Number(t.valor_total_clp || 0)
    }
  }

  return { enTransito, recibidos, unidadesEnRuta, valorEnRuta }
})

// Traspasos filtrados
const traspasosFiltrados = computed(() => {
  return traspasos.value.filter(t => {
    // Filtro por estado
    if (filtroEstado.value !== 'TODOS' && t.estado !== filtroEstado.value) {
      return false
    }
    // Filtro por texto
    if (filtroBusqueda.value.trim()) {
      const q = filtroBusqueda.value.toLowerCase().trim()
      const guia = (t.numero_guia || '').toLowerCase()
      const origen = (t.bodega_origen_nombre || '').toLowerCase()
      const destino = (t.bodega_destino_nombre || t.empresa_destino_nombre || '').toLowerCase()
      const chofer = (t.chofer_transporte || '').toLowerCase()
      const items = (t.lineas || []).map(l => (l.producto_nombre || '').toLowerCase()).join(' ')
      return guia.includes(q) || origen.includes(q) || destino.includes(q) || chofer.includes(q) || items.includes(q)
    }
    return true
  })
})

const seleccionarTraspaso = (trp) => {
  selectedTrp.value = trp
}

// -----------------------------------------------------------------------------
// MODAL: NUEVA GUÍA DE TRASPASO
// -----------------------------------------------------------------------------
const showNuevoModal = ref(false)
const guardandoTrp = ref(false)
const modalError = ref('')
const lineasTemp = ref([])

const formTrp = ref({
  id_bodega_origen: null,
  id_bodega_destino: null,
  tipo_traspaso: 'INTERBODEGA',
  empresa_destino_nombre: '',
  chofer_transporte: '',
  patente_transporte: '',
  observaciones: ''
})

const lineaNueva = ref({
  itemStock: null,
  cantidad: 1
})

const stockMaximoItem = computed(() => {
  if (!lineaNueva.value.itemStock) return 1
  return Number(lineaNueva.value.itemStock.cantidad_disponible || lineaNueva.value.itemStock.cantidad_fisica || 1)
})

const bodegasDestinoDisponibles = computed(() => {
  return bodegas.value.filter(b => Number(b.id) !== Number(formTrp.value.id_bodega_origen))
})

const stockDisponibleOrigen = computed(() => {
  if (!formTrp.value.id_bodega_origen) return []
  return existenciasGenerales.value.filter(e => {
    return Number(e.id_bodega) === Number(formTrp.value.id_bodega_origen) && Number(e.cantidad_fisica) > 0
  })
})

const totalLineasTemp = computed(() => {
  return lineasTemp.value.reduce((acc, l) => acc + Number(l.costo_total || 0), 0)
})

const abrirModalNuevoTraspaso = async () => {
  modalError.value = ''
  formTrp.value = {
    id_bodega_origen: bodegas.value[0]?.id || 1,
    id_bodega_destino: bodegas.value[1]?.id || 2,
    tipo_traspaso: 'INTERBODEGA',
    empresa_destino_nombre: '',
    chofer_transporte: '',
    patente_transporte: '',
    observaciones: ''
  }
  lineasTemp.value = []
  lineaNueva.value = { itemStock: null, cantidad: 1 }
  showNuevoModal.value = true
  await cargarExistencias()
}

const alCambiarBodegaOrigen = () => {
  lineasTemp.value = []
  lineaNueva.value = { itemStock: null, cantidad: 1 }
}

const alSeleccionarProductoParaTrp = () => {
  lineaNueva.value.cantidad = 1
}

const agregarLineaTraspaso = () => {
  const st = lineaNueva.value.itemStock
  if (!st) return

  const cant = Number(lineaNueva.value.cantidad)
  if (!cant || cant <= 0) return

  const max = Number(st.cantidad_disponible || st.cantidad_fisica || 0)
  if (cant > max) {
    modalError.value = `La cantidad excede el stock disponible (${max} ${st.uom}).`
    return
  }

  // Verificar si ya está en lineasTemp
  const yaExiste = lineasTemp.value.find(l => Number(l.id_producto) === Number(st.id_producto))
  if (yaExiste) {
    modalError.value = 'Este producto ya fue agregado al cargamento.'
    return
  }

  modalError.value = ''
  const pmp = Number(st.pmp || 0)
  lineasTemp.value.push({
    id_producto: st.id_producto,
    sku: st.sku,
    producto_nombre: st.producto_nombre,
    uom: st.uom || 'UN',
    id_ubicacion_origen: st.id_ubicacion,
    codigo_ubicacion_origen: st.ubicacion_codigo,
    cantidad: cant,
    costo_unitario_pmp: pmp,
    costo_total: Math.round(pmp * cant)
  })

  lineaNueva.value = { itemStock: null, cantidad: 1 }
}

const eliminarLineaTemp = (idx) => {
  lineasTemp.value.splice(idx, 1)
}

const enviarNuevoTraspaso = async () => {
  modalError.value = ''
  if (!formTrp.value.id_bodega_origen) {
    modalError.value = 'Debe seleccionar la bodega de origen.'
    return
  }
  if (formTrp.value.tipo_traspaso === 'INTERBODEGA' && !formTrp.value.id_bodega_destino) {
    modalError.value = 'Debe seleccionar la bodega de destino.'
    return
  }
  if (formTrp.value.tipo_traspaso === 'INTEREMPRESA' && !formTrp.value.empresa_destino_nombre?.trim()) {
    modalError.value = 'Debe indicar el nombre de la empresa destino.'
    return
  }
  if (lineasTemp.value.length === 0) {
    modalError.value = 'Debe agregar al menos un repuesto a la guía de traspaso.'
    return
  }

  guardandoTrp.value = true
  try {
    const payload = {
      id_bodega_origen: formTrp.value.id_bodega_origen,
      id_bodega_destino: formTrp.value.tipo_traspaso === 'INTERBODEGA' ? formTrp.value.id_bodega_destino : null,
      tipo_traspaso: formTrp.value.tipo_traspaso,
      empresa_destino_nombre: formTrp.value.tipo_traspaso === 'INTEREMPRESA' ? formTrp.value.empresa_destino_nombre.trim() : null,
      chofer_transporte: formTrp.value.chofer_transporte?.trim() || null,
      patente_transporte: formTrp.value.patente_transporte?.trim() || null,
      observaciones: formTrp.value.observaciones?.trim() || null,
      lineas: lineasTemp.value.map(l => ({
        id_producto: l.id_producto,
        cantidad: l.cantidad,
        id_ubicacion_origen: l.id_ubicacion_origen
      }))
    }

    const res = await api.post('/inventario/traspasos', payload)
    if (res.data?.success) {
      showNuevoModal.value = false
      mostrarToast(`¡Guía ${res.data.data.numero_guia} emitida con éxito en estado EN TRÁNSITO!`, 'success')
      await fetchTraspasos()
      if (res.data.data.id_traspaso) {
        const creado = traspasos.value.find(t => String(t.id_traspaso) === String(res.data.data.id_traspaso))
        if (creado) selectedTrp.value = creado
      }
    }
  } catch (err) {
    console.error('Error emitiendo traspaso:', err)
    modalError.value = err.response?.data?.error || err.message || 'Error al emitir el traspaso'
  } finally {
    guardandoTrp.value = false
  }
}

// -----------------------------------------------------------------------------
// MODAL: CONFIRMAR RECEPCIÓN FÍSICA EN DESTINO
// -----------------------------------------------------------------------------
const showRecepcionModal = ref(false)
const guardandoRecepcion = ref(false)
const recepcionError = ref('')
const trpParaRecepcion = ref(null)
const ubicacionesDestino = ref([])

const formRecepcion = ref({
  lineas: [],
  observaciones: ''
})

const abrirModalRecepcion = async (trp) => {
  recepcionError.value = ''
  trpParaRecepcion.value = trp
  formRecepcion.value.observaciones = 'Recepción conforme en bodega destino'

  // Cargar ubicaciones de la bodega destino
  try {
    const resUbic = await api.get(`/inventario/ubicaciones?id_bodega=${trp.id_bodega_destino || 1}`)
    ubicacionesDestino.value = resUbic.data?.data || []
  } catch (e) {
    console.warn('Error cargando ubicaciones destino:', e)
    ubicacionesDestino.value = []
  }

  const defaultUbi = ubicacionesDestino.value[0]?.id || null

  formRecepcion.value.lineas = (trp.lineas || []).map(lin => ({
    id_traspaso_linea: lin.id_traspaso_linea,
    id_producto: lin.id_producto,
    sku: lin.sku,
    producto_nombre: lin.producto_nombre,
    cantidad: lin.cantidad,
    unidad_medida: lin.unidad_medida,
    id_ubicacion_destino: defaultUbi
  }))

  showRecepcionModal.value = true
}

const confirmarRecepcion = async () => {
  recepcionError.value = ''
  // Validar que cada línea tenga casillero asignado
  for (const lin of formRecepcion.value.lineas) {
    if (!lin.id_ubicacion_destino) {
      recepcionError.value = `Debe asignar un casillero de destino para el producto [${lin.sku}] ${lin.producto_nombre}.`
      return
    }
  }

  guardandoRecepcion.value = true
  try {
    const payload = {
      lineas_recepcion: formRecepcion.value.lineas.map(l => ({
        id_traspaso_linea: l.id_traspaso_linea,
        id_ubicacion_destino: l.id_ubicacion_destino
      })),
      observaciones: formRecepcion.value.observaciones?.trim() || null
    }

    const res = await api.post(`/inventario/traspasos/${trpParaRecepcion.value.id_traspaso}/recepcionar`, payload)
    if (res.data?.success) {
      showRecepcionModal.value = false
      mostrarToast(`¡Guía ${trpParaRecepcion.value.numero_guia} recepcionada e ingresada a Kardex conforme!`, 'success')
      await fetchTraspasos()
      const actualizado = traspasos.value.find(t => String(t.id_traspaso) === String(trpParaRecepcion.value.id_traspaso))
      if (actualizado) selectedTrp.value = actualizado
    }
  } catch (err) {
    console.error('Error recepcionando traspaso:', err)
    recepcionError.value = err.response?.data?.error || err.message || 'Error al recepcionar el traspaso'
  } finally {
    guardandoRecepcion.value = false
  }
}

// -----------------------------------------------------------------------------
// CARGA DE DATOS & FORMATEO
// -----------------------------------------------------------------------------
const fetchTraspasos = async () => {
  loading.value = true
  try {
    const res = await api.get('/inventario/traspasos')
    traspasos.value = res.data?.data || []
    if (traspasos.value.length > 0 && !selectedTrp.value) {
      selectedTrp.value = traspasos.value[0]
    }
  } catch (err) {
    console.error('Error cargando traspasos:', err)
    mostrarToast('No se pudo conectar con el servicio de traspasos', 'error')
  } finally {
    loading.value = false
  }
}

const cargarBodegas = async () => {
  try {
    const res = await api.get('/inventario/bodegas')
    bodegas.value = res.data?.data || []
  } catch (err) {
    console.error('Error cargando bodegas:', err)
  }
}

const cargarExistencias = async () => {
  try {
    const res = await api.get('/inventario/existencias')
    existenciasGenerales.value = res.data?.data || []
  } catch (err) {
    console.error('Error cargando existencias:', err)
  }
}

const formatCLP = (val) => {
  const num = Number(val || 0)
  return '$ ' + Math.round(num).toLocaleString('es-CL')
}

const formatFecha = (fStr) => {
  if (!fStr) return '-'
  try {
    const d = new Date(fStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (e) {
    return fStr
  }
}

onMounted(async () => {
  await Promise.all([
    fetchTraspasos(),
    cargarBodegas(),
    cargarExistencias()
  ])
})
</script>
