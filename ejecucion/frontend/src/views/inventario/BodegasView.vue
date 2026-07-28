<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- ENCABEZADO PRINCIPAL WMS HUB UNIFICADO -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-4">
        <div class="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-xl shadow-amber-500/5">
          <Warehouse class="w-7 h-7" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">Gestión de Bodegas & Existencias</h1>
            <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">GLOBAL MANAGER WMS</span>
          </div>
          <p class="text-slate-400 text-xs mt-0.5">Haga clic en cualquier bodega para abrir el modal de existencias detalladas e inspeccionar su stock físico</p>
        </div>
      </div>

      <!-- BOTONES DE ACCIÓN WMS DE ALTO NIVEL -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          @click="activeModal = 'crear_bodega'"
          class="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5"
        >
          <PlusCircle class="w-4 h-4 text-amber-400" /> + Crear Bodega
        </button>

        <button
          @click="activeModal = 'recepcion'"
          class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
        >
          <Download class="w-4 h-4" /> 📥 Recepción (OC)
        </button>

        <button
          @click="activeModal = 'traspaso'"
          class="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5"
        >
          <Truck class="w-4 h-4" /> 🚚 Traspaso Consolidado
        </button>

        <button
          @click="activeModal = 'despacho'"
          class="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5"
        >
          <Send class="w-4 h-4" /> 📦 Despacho OT/CC
        </button>
      </div>
    </div>

    <!-- TARJETAS KPIS CONTABLES Y DE BODEGA -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Valorización Total Stock</div>
          <div class="text-xl font-black text-emerald-400 mt-1 font-mono">${{ totalValorizacion.toLocaleString('es-CL') }}</div>
        </div>
        <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><DollarSign class="w-5 h-5" /></div>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Stock Global Físico</div>
          <div class="text-xl font-black text-white mt-1 font-mono">{{ totalStockGlobal }} <span class="text-xs text-slate-400 font-normal">unids.</span></div>
        </div>
        <div class="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Boxes class="w-5 h-5" /></div>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Bodegas Operativas</div>
          <div class="text-xl font-black text-amber-400 mt-1 font-mono">{{ bodegas.length }}</div>
        </div>
        <div class="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Warehouse class="w-5 h-5" /></div>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Lotes en Tránsito</div>
          <div class="text-xl font-black text-amber-400 mt-1 font-mono">{{ lotesTraspasoEnTransito.length }}</div>
        </div>
        <div class="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Truck class="w-5 h-5" /></div>
      </div>
    </div>

    <!-- PESTAÑAS DE VISTA -->
    <div class="flex border-b border-slate-800 mb-6 gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80 w-fit overflow-x-auto">
      <button
        @click="activeSubTab = 'bodegas'"
        :class="['px-5 py-2 font-black text-xs rounded-lg transition-all uppercase tracking-wider whitespace-nowrap', activeSubTab === 'bodegas' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white']"
      >
        1. Lista de Bodegas ({{ filteredBodegas.length }})
      </button>
      <button
        @click="activeSubTab = 'existencias'"
        :class="['px-5 py-2 font-black text-xs rounded-lg transition-all uppercase tracking-wider whitespace-nowrap', activeSubTab === 'existencias' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white']"
      >
        2. Todas las Existencias Físicas ({{ filteredExistencias.length }})
      </button>
      <button
        @click="activeSubTab = 'lotes_transito'"
        :class="['px-5 py-2 font-black text-xs rounded-lg transition-all uppercase tracking-wider whitespace-nowrap flex items-center gap-2', activeSubTab === 'lotes_transito' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white']"
      >
        <span>3. 🚚 Lotes en Tránsito</span>
        <span v-if="lotesTraspasoEnTransito.length > 0" class="bg-amber-950 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold">{{ lotesTraspasoEnTransito.length }}</span>
      </button>
    </div>

    <!-- VISTA 1: LISTADO PRINCIPAL DE BODEGAS -->
    <div v-if="activeSubTab === 'bodegas'" class="space-y-4">
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 Buscar bodega por Nombre o Sucursal..."
          class="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 w-full md:w-96 text-xs focus:outline-none focus:border-amber-500"
        />
        <div class="text-xs text-slate-400 font-semibold">
          Haga clic en cualquier fila para abrir la inspección modal de la bodega
        </div>
      </div>

      <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-2xl">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
              <th class="p-3.5">Cód. Bodega</th>
              <th class="p-3.5">Nombre Bodega</th>
              <th class="p-3.5">Sucursal Pertenencia</th>
              <th class="p-3.5">Consolidación de Stock</th>
              <th class="p-3.5">Existencias Almacenadas</th>
              <th class="p-3.5">Estado Operativo</th>
              <th class="p-3.5 text-right">Inspeccionar Modal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr
              v-for="b in filteredBodegas"
              :key="b.id"
              @click="openBodegaModalDetail(b)"
              class="hover:bg-slate-800/80 cursor-pointer transition-colors group"
            >
              <td class="p-3.5 font-mono font-bold text-amber-400 group-hover:underline">#BOD-00{{ b.id }}</td>
              <td class="p-3.5 font-bold text-white text-sm group-hover:text-amber-400 transition-colors">{{ b.nombre }}</td>
              <td class="p-3.5 text-slate-300">📍 {{ b.sucursal_nombre }}</td>
              <td class="p-3.5">
                <span :class="['px-2.5 py-1 rounded text-[10px] font-black uppercase border', b.consolida_stock ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700']">
                  {{ b.consolida_stock ? '✔ SI (Agrupa por Marca)' : 'NO' }}
                </span>
              </td>
              <td class="p-3.5 font-mono text-white font-black text-sm">
                {{ getExistenciasByBodega(b.id).length }} ítem(s)
              </td>
              <td class="p-3.5"><span class="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVA</span></td>
              <td class="p-3.5 text-right">
                <button
                  @click.stop="openBodegaModalDetail(b)"
                  class="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 ml-auto"
                >
                  <Eye class="w-3.5 h-3.5" /> 👁️ Ver Existencias
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- VISTA 2: TODAS LAS EXISTENCIAS FÍSICAS -->
    <div v-if="activeSubTab === 'existencias'" class="space-y-4">
      <div class="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-2xl">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
              <th class="p-3.5">Cód. Barras</th>
              <th class="p-3.5">SKU Comercial</th>
              <th class="p-3.5">Repuesto / Producto</th>
              <th class="p-3.5">Bodega Ubicación</th>
              <th class="p-3.5">Cant. Dispon.</th>
              <th class="p-3.5">Costo Neto ($)</th>
              <th class="p-3.5">Nº OC</th>
              <th class="p-3.5">Estado</th>
              <th class="p-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-for="item in filteredExistencias" :key="item.id" class="hover:bg-slate-800/60">
              <td class="p-3.5 font-mono font-bold text-amber-400">{{ item.codigo_barras || 'BAR-10' + item.id }}</td>
              <td class="p-3.5 font-mono text-slate-300 font-bold">{{ item.sku }}</td>
              <td class="p-3.5 font-bold text-white text-sm">{{ item.producto_nombre }}</td>
              <td class="p-3.5 text-slate-300">📍 {{ item.bodega_nombre || 'Bodega Principal Santiago' }}</td>
              <td class="p-3.5 font-mono text-white font-black text-sm">{{ item.cantidad_disponible }} unids.</td>
              <td class="p-3.5 font-mono text-emerald-400 font-bold">${{ Number(item.costo).toLocaleString('es-CL') }}</td>
              <td class="p-3.5 font-mono text-slate-300">{{ item.oc }}</td>
              <td class="p-3.5">
                <span :class="['px-2.5 py-1 rounded text-[10px] font-black uppercase border', item.estado === 'DISPONIBLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : item.estado === 'EN_TRANSITO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20']">
                  {{ item.estado }}
                </span>
              </td>
              <td class="p-3.5 text-right">
                <button v-if="item.estado === 'DISPONIBLE'" @click="openBajaModal(item)" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold px-3 py-1.5 rounded-lg text-xs">
                  Dar de Baja
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- VISTA 3: LOTES EN TRÁNSITO -->
    <div v-if="activeSubTab === 'lotes_transito'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="lote in lotesTraspasoEnTransito" :key="lote.id" class="bg-slate-900/80 border border-amber-500/30 p-5 rounded-2xl space-y-3">
        <div class="flex justify-between items-center border-b border-slate-800 pb-2">
          <span class="font-mono font-black text-amber-400 text-sm">#GUIA-{{ lote.numero_guia }}</span>
          <span class="bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded text-[10px] font-black uppercase border border-amber-500/20">{{ lote.estado }}</span>
        </div>
        <div class="text-xs space-y-1">
          <div class="text-white font-bold">Origen: <span class="text-slate-300 font-normal">{{ lote.origen_nombre }}</span></div>
          <div class="text-white font-bold">Destino: <span class="text-slate-300 font-normal">{{ lote.destino_nombre }}</span></div>
          <div class="text-slate-400 italic bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">💬 "{{ lote.observaciones }}"</div>
        </div>
        <button v-if="lote.estado === 'EN_TRANSITO'" @click="confirmarRecepcionLote(lote)" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs uppercase shadow">
          ✔ Confirmar Recepción Completa en Destino (Pasa a DISPONIBLE)
        </button>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL A: INSPECCIÓN DETALLADA DE BODEGA -->
    <!-- ========================================== -->
    <div v-if="selectedBodegaForModal" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Warehouse class="w-6 h-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-black text-white uppercase font-mono">{{ selectedBodegaForModal.nombre }}</h2>
                <span class="bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-500/20 font-mono">
                  #BOD-00{{ selectedBodegaForModal.id }}
                </span>
              </div>
              <p class="text-slate-400 text-xs mt-0.5">Pertenencia: 📍 <strong>{{ selectedBodegaForModal.sucursal_nombre }}</strong></p>
            </div>
          </div>
          <button @click="selectedBodegaForModal = null" class="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full font-bold text-sm">✕</button>
        </div>

        <div class="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-hide">
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Existencias Almacenadas</span>
              <span class="text-lg font-black text-white font-mono mt-0.5 block">{{ existenciasDeBodegaSeleccionada.length }} ítem(s)</span>
            </div>
            <div class="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Valorización del Stock</span>
              <span class="text-lg font-black text-emerald-400 font-mono mt-0.5 block">${{ valorizacionBodegaSeleccionada.toLocaleString('es-CL') }}</span>
            </div>
            <div class="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Consolidación</span>
              <span class="text-xs font-bold text-amber-400 mt-1 block">{{ selectedBodegaForModal.consolida_stock ? 'SI (Agrupa por Marca)' : 'NO' }}</span>
            </div>
          </div>

          <div class="space-y-2">
            <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Inventario Físico en esta Bodega</h3>
            <div class="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase">
                    <th class="p-3">Cód. Barras</th>
                    <th class="p-3">SKU</th>
                    <th class="p-3">Repuesto / Producto</th>
                    <th class="p-3">Cantidad</th>
                    <th class="p-3">Costo ($)</th>
                    <th class="p-3">OC</th>
                    <th class="p-3">Estado</th>
                    <th class="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 font-medium">
                  <tr v-for="item in existenciasDeBodegaSeleccionada" :key="item.id" class="hover:bg-slate-900/60">
                    <td class="p-3 font-mono font-bold text-amber-400">{{ item.codigo_barras || 'BAR-10' + item.id }}</td>
                    <td class="p-3 font-mono text-slate-300 font-bold">{{ item.sku }}</td>
                    <td class="p-3 font-bold text-white">{{ item.producto_nombre }}</td>
                    <td class="p-3 font-mono text-white font-black">{{ item.cantidad_disponible }} unids.</td>
                    <td class="p-3 font-mono text-emerald-400 font-bold">${{ Number(item.costo).toLocaleString('es-CL') }}</td>
                    <td class="p-3 font-mono text-slate-300">{{ item.oc }}</td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {{ item.estado }}
                      </span>
                    </td>
                    <td class="p-3 text-right">
                      <button @click="openBajaModal(item)" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold px-2.5 py-1 rounded text-[11px]">
                        Baja
                      </button>
                    </td>
                  </tr>
                  <tr v-if="existenciasDeBodegaSeleccionada.length === 0">
                    <td colspan="8" class="p-6 text-center text-slate-500 text-xs italic">No hay existencias en esta bodega.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="bg-slate-950 p-4 border-t border-slate-800 flex justify-end">
          <button @click="selectedBodegaForModal = null" class="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2 rounded-xl text-xs uppercase">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- MODAL B: CREAR BODEGA -->
    <div v-if="activeModal === 'crear_bodega'" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white uppercase flex items-center gap-2"><Warehouse class="w-5 h-5 text-amber-400" /> Crear Nueva Bodega</h3>
          <button @click="activeModal = null" class="text-slate-400 hover:text-white">✕</button>
        </div>
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Sucursal Pertenencia *</label>
            <select v-model="formBodega.sucursal_nombre" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
              <option value="Santiago Central">Santiago Central</option>
              <option value="Norte Grande">Norte Grande (Antofagasta)</option>
              <option value="San Bernardo">San Bernardo</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Nombre Bodega *</label>
            <input v-model="formBodega.nombre" type="text" placeholder="Ej: Bodega Taller Móvil" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="activeModal = null" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="guardarBodega" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">Crear Bodega</button>
        </div>
      </div>
    </div>

    <!-- MODAL C: RECEPCIÓN DE MATERIALES (OC + IMPRESIÓN BARCODE TÉRMICO) -->
    <div v-if="activeModal === 'recepcion'" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white uppercase flex items-center gap-2">
            <Download class="w-5 h-5 text-amber-400" /> Recepción e Ingreso por OC
          </h3>
          <button @click="activeModal = null" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="modalError" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold">
          ⚠️ {{ modalError }}
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Bodega Destino *</label>
            <select v-model="formIngreso.id_bodega" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
              <option :value="1">Bodega Principal Santiago</option>
              <option :value="2">Bodega Faena Antofagasta</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Producto Insumo *</label>
            <select v-model="formIngreso.id_producto" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
              <option :value="1">Mascarillas N95 (Caja x20 unids) — 3M</option>
              <option :value="2">Filtro de Aceite Motorcraft FL-400S</option>
              <option :value="3">Pastillas de Freno Brembo</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Cantidad *</label>
              <input v-model.number="formIngreso.cantidad" type="number" min="1" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Costo Neto ($ > 0) *</label>
              <input v-model.number="formIngreso.costo" type="number" min="1" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
            </div>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Nº Orden de Compra (OC - Obligatorio) *</label>
            <input v-model="formIngreso.oc" type="text" placeholder="Ej: OC-88210" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="activeModal = null" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="procesarIngreso" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
            Ingresar y Generar Barcode
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL D: TRASPASO CONSOLIDADO -->
    <div v-if="activeModal === 'traspaso'" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white uppercase flex items-center gap-2">
            <Truck class="w-5 h-5 text-amber-400" /> Crear Lote de Traspaso Consolidado
          </h3>
          <button @click="activeModal = null" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Bodega Origen *</label>
            <select v-model="formLoteTraspaso.id_origen" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
              <option :value="1">Bodega Principal Santiago</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Bodega Destino *</label>
            <select v-model="formLoteTraspaso.id_destino" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
              <option :value="2">Bodega Faena Antofagasta</option>
              <option :value="3">Bodega Taller Móvil San Bernardo</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Nº Guía Interna *</label>
            <input v-model="formLoteTraspaso.numero_guia" type="text" placeholder="Ej: GDI-99401" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Comentario / Ruta *</label>
            <input v-model="formLoteTraspaso.observaciones" type="text" placeholder="Ej: Enviado en camión rampa chofer Pedro Soto" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
          </div>

          <div class="md:col-span-2 space-y-2">
            <label class="block text-slate-400 font-bold uppercase">Escanear Barcodes al Lote *</label>
            <div class="flex gap-2">
              <input v-model="barcodeScanBuffer" @keyup.enter="agregarExistenciaAlLote" type="text" placeholder="BAR-101-889" class="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 font-mono" />
              <button @click="agregarExistenciaAlLote" class="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-4 py-2 rounded-xl border border-slate-700">+ Escanear</button>
            </div>
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1">
              <div v-for="(i, idx) in formLoteTraspaso.items" :key="idx" class="flex justify-between items-center bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs font-mono">
                <span class="text-amber-400 font-bold">📦 {{ i.barcode }} — {{ i.nombre }}</span>
                <button @click="formLoteTraspaso.items.splice(idx, 1)" class="text-slate-500 hover:text-rose-400 font-bold">✕</button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="activeModal = null" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="despacharLoteConsolidado" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs uppercase">Despachar Lote (EN TRÁNSITO)</button>
        </div>
      </div>
    </div>

    <!-- MODAL E: DESPACHO A OT / CC -->
    <div v-if="activeModal === 'despacho'" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white uppercase flex items-center gap-2"><Send class="w-5 h-5 text-amber-400" /> Despacho y Consumo (OT / CC)</h3>
          <button @click="activeModal = null" class="text-slate-400 hover:text-white">✕</button>
        </div>
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Folio OT *</label>
            <input v-model="formDespacho.folio_ot" type="text" placeholder="Ej: OT-10045" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Escaneo Código de Barras *</label>
            <input v-model="formDespacho.barcode" type="text" placeholder="BAR-501-889" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="activeModal = null" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="confirmarDespachoModal" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase">Confirmar Imputación</button>
        </div>
      </div>
    </div>

    <!-- MODAL F: DAR DE BAJA FÍSICA -->
    <div v-if="showBajaModal && selectedItem" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-rose-400 uppercase flex items-center gap-2"><span>🗑️</span> Dar de Baja Existencia</h3>
          <button @click="showBajaModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>
        <div class="space-y-2 text-xs">
          <label class="block text-slate-400 font-bold uppercase">Motivo de la Baja (Obligatorio) *</label>
          <textarea v-model="motivoBaja" rows="3" placeholder="Justificación de la baja..." class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showBajaModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button :disabled="!motivoBaja.trim()" @click="confirmarBaja" class="bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase">Confirmar Baja</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Warehouse, Boxes, DollarSign, AlertTriangle, PlusCircle, Download, Truck, Send, Eye } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const activeSubTab = ref('bodegas')
const activeModal = ref(null)
const selectedBodegaForModal = ref(null)
const searchQuery = ref('')
const barcodeScanBuffer = ref('')
const modalError = ref('')
const showBajaModal = ref(false)
const selectedItem = ref(null)
const motivoBaja = ref('')

const bodegas = ref([
  { id: 1, nombre: 'Bodega Principal Santiago', sucursal_nombre: 'Santiago Central', estado: 'ACTIVA', consolida_stock: true },
  { id: 2, nombre: 'Bodega Faena Antofagasta', sucursal_nombre: 'Norte Grande', estado: 'ACTIVA', consolida_stock: true },
  { id: 3, nombre: 'Bodega Taller Móvil San Bernardo', sucursal_nombre: 'San Bernardo', estado: 'ACTIVA', consolida_stock: false }
])

const existencias = ref([
  { id: 1, id_bodega: 1, sku: 'MASC-000101', codigo_barras: 'BAR-101-889', producto_nombre: 'Mascarillas N95 (Caja x20 unids)', bodega_nombre: 'Bodega Principal Santiago', cantidad_disponible: 15, costo: 18500, oc: 'OC-88210', estado: 'DISPONIBLE' },
  { id: 2, id_bodega: 1, sku: 'FILT-000501', codigo_barras: 'BAR-501-889', producto_nombre: 'Filtro de Aceite Motorcraft FL-400S', bodega_nombre: 'Bodega Principal Santiago', cantidad_disponible: 14, costo: 4500, oc: 'OC-99382', estado: 'DISPONIBLE' },
  { id: 3, id_bodega: 2, sku: 'ACEI-000992', codigo_barras: 'BAR-992-100', producto_nombre: 'Aceite Hidráulico ISO VG 68 Premium', bodega_nombre: 'Bodega Faena Antofagasta', cantidad_disponible: 2, costo: 38000, oc: 'OC-99411', estado: 'DISPONIBLE' }
])

const lotesTraspasoEnTransito = ref([
  { id: 1, numero_guia: 'GDI-99401', origen_nombre: 'Bodega Principal Santiago', destino_nombre: 'Bodega Faena Antofagasta', observaciones: 'Enviado en camión rampa chofer Pedro Soto', estado: 'EN_TRANSITO', items: [{ barcode: 'BAR-101-889', nombre: 'Mascarillas N95', cantidad: 10 }] }
])

const formBodega = ref({ nombre: '', sucursal_nombre: 'Santiago Central' })
const formIngreso = ref({ id_bodega: 1, id_producto: 1, cantidad: 10, costo: 18500, oc: 'OC-88210' })
const formLoteTraspaso = ref({
  id_origen: 1,
  id_destino: 2,
  numero_guia: 'GDI-99402',
  observaciones: 'Despacho filtros y lubricantes para faena Laja',
  items: [{ barcode: 'BAR-101-889', nombre: 'Mascarillas N95', cantidad: 5 }]
})
const formDespacho = ref({ folio_ot: 'OT-10045', barcode: 'BAR-501-889' })

const totalValorizacion = computed(() => existencias.value.reduce((acc, e) => acc + (Number(e.costo) * Number(e.cantidad_disponible)), 0))
const totalStockGlobal = computed(() => existencias.value.reduce((acc, e) => acc + Number(e.cantidad_disponible), 0))

const filteredBodegas = computed(() => bodegas.value)
const filteredExistencias = computed(() => existencias.value)

const getExistenciasByBodega = (bodegaId) => existencias.value.filter(e => Number(e.id_bodega) === Number(bodegaId))

const existenciasDeBodegaSeleccionada = computed(() => selectedBodegaForModal.value ? getExistenciasByBodega(selectedBodegaForModal.value.id) : [])
const valorizacionBodegaSeleccionada = computed(() => existenciasDeBodegaSeleccionada.value.reduce((acc, e) => acc + (Number(e.costo) * Number(e.cantidad_disponible)), 0))

const openBodegaModalDetail = (b) => { selectedBodegaForModal.value = b }
const openBajaModal = (item) => { selectedItem.value = item; motivoBaja.value = ''; showBajaModal.value = true }

const procesarIngreso = async () => {
  modalError.value = ''
  if (!formIngreso.value.costo || formIngreso.value.costo <= 0) { modalError.value = 'El costo de adquisición debe ser mayor a 0.'; return }
  if (!formIngreso.value.oc) { modalError.value = 'El N° de Orden de Compra es obligatorio.'; return }
  try {
    const { data } = await apiAxios.post('/inventario/existencias/ingresar', formIngreso.value)
    existencias.value.unshift(data)
    activeModal.value = null
    alert('Ingreso de material por OC registrado correctamente.')
  } catch (err) { modalError.value = err.response?.data?.message || 'Error al procesar ingreso' }
}

const agregarExistenciaAlLote = () => {
  if (!barcodeScanBuffer.value.trim()) return
  formLoteTraspaso.value.items.push({ barcode: barcodeScanBuffer.value.trim(), nombre: 'Insumo Escaneado', cantidad: 1 })
  barcodeScanBuffer.value = ''
}

const despacharLoteConsolidado = async () => {
  if (formLoteTraspaso.value.items.length === 0) { alert('Agregue existencias al lote.'); return }
  try {
    await apiAxios.post('/inventario/traspasos', { id_bodega_origen: 1, id_bodega_destino: formLoteTraspaso.value.id_destino, codigos_barras: formLoteTraspaso.value.items.map(i => i.barcode) })
    lotesTraspasoEnTransito.value.unshift({
      id: Date.now(),
      numero_guia: formLoteTraspaso.value.numero_guia,
      origen_nombre: 'Bodega Principal Santiago',
      destino_nombre: 'Bodega Faena Antofagasta',
      observaciones: formLoteTraspaso.value.observaciones,
      estado: 'EN_TRANSITO',
      items: [...formLoteTraspaso.value.items]
    })
    activeModal.value = null
    activeSubTab.value = 'lotes_transito'
    alert(`Lote consolidado #${formLoteTraspaso.value.numero_guia} despachado en estado EN TRÁNSITO.`)
  } catch (err) { alert('Error despachando traspaso: ' + (err.response?.data?.message || err.message)) }
}

const confirmarDespachoModal = async () => {
  try {
    await apiAxios.post('/inventario/despacho', { folio_ot: formDespacho.value.folio_ot, codigos_barras: [formDespacho.value.barcode] })
    activeModal.value = null
    alert(`Despacho e imputación a OT ${formDespacho.value.folio_ot} completada correctamente.`)
  } catch (err) { alert('Error al imputar despacho: ' + (err.response?.data?.message || err.message)) }
}

const confirmarBaja = () => {
  if (!motivoBaja.value.trim()) return
  selectedItem.value.estado = 'BAJA_FISICA'
  showBajaModal.value = false
  alert('Baja física registrada en bitácora de eventos.')
}

const confirmarRecepcionLote = (lote) => {
  lote.estado = 'RECIBIDO'
  alert(`Lote #${lote.numero_guia} recibido conforme en destino.`)
}

const guardarBodega = async () => {
  if (!formBodega.value.nombre) return
  bodegas.value.unshift({ id: Date.now(), nombre: formBodega.value.nombre, sucursal_nombre: formBodega.value.sucursal_nombre, consolida_stock: true })
  activeModal.value = null
}

onMounted(async () => {
  try {
    const { data: bData } = await apiAxios.get('/inventario/bodegas')
    if (bData && Array.isArray(bData) && bData.length > 0) bodegas.value = bData
    const { data: eData } = await apiAxios.get('/inventario/existencias')
    if (eData && Array.isArray(eData) && eData.length > 0) existencias.value = eData
  } catch (err) {}
})
</script>
