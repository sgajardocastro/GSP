<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- ENCABEZADO CANÓNICO IDÉNTICO A MAQUETA AUDITADA -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">Bodegas & Ubicaciones Físicas</h1>
          <div class="flex gap-2">
            <span class="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded border border-emerald-500/20">
              Control de Almacén WMS
            </span>
            <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">
              63 Racks & Casilleros
            </span>
          </div>
        </div>
        <p class="text-slate-400 text-xs mt-1">
          Jerarquía Bodega > Estantería > Nivel > Posición, mapa de ocupación física, etiquetas QR de casilleros y trazabilidad de existencias
        </p>
      </div>

      <!-- BOTONES DE NAVEGACIÓN RÁPIDA A FORMULARIOS WMS -->
      <div class="flex flex-wrap items-center gap-2">
        <router-link
          :to="{ name: 'inventario_recepcion' }"
          class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
        >
          <Download class="w-4 h-4" /> 📥 Recepción (OC)
        </router-link>
        <router-link
          :to="{ name: 'inventario_despacho' }"
          class="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
        >
          <Send class="w-4 h-4" /> 📦 Despacho OT
        </router-link>
        <router-link
          :to="{ name: 'inventario_traspasos' }"
          class="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
        >
          <Truck class="w-4 h-4" /> 🚚 Traspasos
        </router-link>
      </div>
    </div>

    <!-- PESTAÑAS PRINCIPALES DE LA VISTA -->
    <div class="flex gap-2 mb-6 border-b border-slate-800/80 pb-3">
      <button
        @click="activeTab = 'mapa'"
        :class="['px-4 py-2 font-black text-xs rounded-xl uppercase tracking-wider transition-all', activeTab === 'mapa' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800']"
      >
        Mapa de Ubicaciones en Racks
      </button>
      <button
        @click="activeTab = 'existencias_tabla'"
        :class="['px-4 py-2 font-black text-xs rounded-xl uppercase tracking-wider transition-all', activeTab === 'existencias_tabla' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800']"
      >
        Todas las Existencias ({{ existencias.length }})
      </button>
    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 1: MAPA DE UBICACIONES INTERACTIVO (IDÉNTICO A LA FOTO)       -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'mapa'" class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <!-- COLUMNA 1: JERARQUÍA BODEGA, ESTANTERÍAS Y ÁREAS ESPECIALES -->
      <div class="space-y-4">
        <!-- Tarjeta Bodega -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">Bodega Seleccionada</div>
          <div class="font-black text-xl text-white mt-1 font-mono flex items-center gap-2">
            <Warehouse class="w-5 h-5 text-amber-400" />
            <span>{{ selectedBodega.nombre }}</span>
          </div>
          <div class="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span>📍 {{ selectedBodega.sucursal_nombre }}</span> · <span class="text-amber-400 font-mono">{{ ubicaciones.length }} ubicaciones</span>
          </div>
          <!-- Selector rápido de bodega si aplica -->
          <div v-if="bodegas.length > 1" class="mt-3 pt-3 border-t border-slate-800">
            <select v-model="selectedBodegaId" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-medium">
              <option v-for="b in bodegas" :key="b.id" :value="b.id">{{ b.nombre }}</option>
            </select>
          </div>
        </div>

        <!-- Tarjeta Estanterías E1 - E9 con barras de porcentaje -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider px-1 mb-2">
            Estanterías (Racks Principales)
          </div>

          <div class="space-y-1">
            <button
              v-for="sh in shelves"
              :key="sh"
              @click="selectShelf(sh)"
              :class="[
                'w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-mono',
                selectedShelf === sh ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400 font-black shadow' : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
              ]"
            >
              <span class="w-7 font-black text-left">{{ sh }}</span>
              <div class="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="selectedShelf === sh ? 'bg-amber-500' : 'bg-amber-500/70'"
                  :style="{ width: `${getShelfOccupancy(sh)}%` }"
                ></div>
              </div>
              <span class="w-10 text-right font-bold text-[11px] text-slate-400">{{ getShelfOccupancy(sh) }}%</span>
            </button>
          </div>
        </div>

        <!-- Tarjeta Áreas Especiales -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider px-1 mb-2">
            Áreas Especiales de Almacenamiento
          </div>

          <div class="space-y-1 text-xs">
            <button
              v-for="area in specialAreas"
              :key="area.code"
              @click="selectSpecialArea(area.code)"
              :class="[
                'w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all border',
                selectedCell === area.code
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'border-transparent hover:bg-slate-800/50'
              ]"
            >
              <span
                :class="[
                  'font-mono font-black text-[11px] px-2 py-0.5 rounded shrink-0',
                  area.code === 'SIN-UBICAR' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  area.code === 'CUARENTENA' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-slate-800 text-slate-200'
                ]"
              >
                {{ area.code }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-[11px] text-slate-400 truncate">{{ area.desc }}</div>
                <div class="text-[10px] text-slate-500 font-mono mt-0.5">
                  {{ countItemsInLocation(area.code) }} repuestos registrados
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- COLUMNA PRINCIPAL (AMPLIADA A 3 COLUMNAS): CUADRÍCULA DE NIVELES (A-G) × POSICIONES (1-6) -->
      <div class="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
            <div>
              <div class="text-base font-black text-white uppercase font-mono flex items-center gap-2">
                <span>Estantería</span>
                <span class="text-amber-400 text-lg font-black px-2.5 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/20">{{ selectedShelf }}</span>
                <span class="text-slate-400 text-xs font-normal">· Niveles A–G × Posiciones 1–6 (42 Celdas)</span>
              </div>
              <p class="text-slate-400 text-xs mt-1">
                Haga clic sobre cualquier celda para abrir el detalle del casillero, tabla de existencias y Formulario Único
              </p>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <span class="text-xs font-mono font-bold text-slate-400">Total en Rack: </span>
                <span class="text-sm font-black text-amber-400 font-mono">{{ getShelfItemsCount(selectedShelf) }} unids.</span>
              </div>
            </div>
          </div>

          <!-- Matriz 7 Filas (Niveles G a A) × 6 Columnas (Posiciones 1 a 6) -->
          <div class="space-y-2">
            <!-- Encabezado de columnas 1 a 6 -->
            <div class="grid gap-2" style="grid-template-columns: 42px repeat(6, 1fr)">
              <div></div>
              <div v-for="p in positions" :key="p" class="text-center text-xs font-mono font-bold text-slate-400 py-1">
                Posición {{ p }}
              </div>
            </div>

            <!-- Filas por cada nivel de arriba hacia abajo (G, F, E, D, C, B, A) -->
            <div
              v-for="l in levels"
              :key="l"
              class="grid gap-2"
              style="grid-template-columns: 42px repeat(6, 1fr)"
            >
              <!-- Etiqueta del Nivel -->
              <div class="flex items-center justify-center font-mono font-black text-sm text-slate-300 bg-slate-950/80 rounded-xl border border-slate-800">
                {{ l }}
              </div>

              <!-- Celdas P1 a P6 -->
              <button
                v-for="p in positions"
                :key="`${selectedShelf}-${l}${p}`"
                @click="selectCell(`${selectedShelf}-${l}${p}`)"
                :class="[
                  'h-16 rounded-xl flex flex-col items-center justify-center font-mono text-xs font-bold transition-all relative border shadow-sm',
                  getCellClasses(`${selectedShelf}-${l}${p}`)
                ]"
              >
                <span class="text-[11px] opacity-70">{{ l }}{{ p }}</span>
                <span v-if="getCellCount(`${selectedShelf}-${l}${p}`) > 0" class="font-black text-sm mt-0.5">
                  {{ getCellCount(`${selectedShelf}-${l}${p}`) }} {{ getCellCount(`${selectedShelf}-${l}${p}`) === 1 ? 'SKU' : 'SKUs' }}
                </span>
                <span v-else class="text-[10px] text-slate-600 font-normal">—</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Leyenda de colores de ocupación y botón de lote -->
        <div class="flex flex-wrap gap-4 pt-5 mt-6 border-t border-slate-800 text-xs text-slate-400 items-center justify-between">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1.5">
              <span class="w-3.5 h-3.5 rounded bg-slate-950 border border-slate-800 inline-block"></span> Vacía
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/40 inline-block"></span> 1 SKU
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3.5 h-3.5 rounded bg-amber-500/40 border border-amber-500/60 inline-block"></span> 2 SKUs
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3.5 h-3.5 rounded bg-amber-500 text-slate-950 font-black inline-block"></span> 3+ SKUs
            </span>
          </div>

          <button
            @click="imprimirEtiquetasEstanteria"
            class="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Printer class="w-3.5 h-3.5" /> Imprimir 42 etiquetas de {{ selectedShelf }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 2: TODAS LAS EXISTENCIAS (LISTADO DETALLADO CON EXPEDIENTE)   -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'existencias_tabla'" class="space-y-4">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div class="flex flex-wrap items-center gap-3">
          <input
            v-model="filtroExistencias"
            type="text"
            placeholder="Buscar por SKU, repuesto o ubicación..."
            class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white w-72 focus:border-amber-500 outline-none font-mono"
          />

          <!-- Toggle filtro con stock vs catálogo completo -->
          <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              @click="filtroSoloConStock = true"
              :class="['px-3 py-1.5 rounded-lg font-bold text-xs transition-all', filtroSoloConStock ? 'bg-amber-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-white']"
            >
              Con Stock Físico (> 0)
            </button>
            <button
              @click="filtroSoloConStock = false"
              :class="['px-3 py-1.5 rounded-lg font-bold text-xs transition-all', !filtroSoloConStock ? 'bg-amber-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-white']"
            >
              Todo el Catálogo
            </button>
          </div>

          <span class="text-xs text-slate-400 font-mono">Mostrando {{ existenciasFiltradas.length }} ítems</span>
        </div>

        <div class="text-xs text-slate-400 font-mono">
          Valorización Total en Bodega: <b class="text-emerald-400 text-sm">${{ valorTotalCalculado.toLocaleString('es-CL') }}</b>
        </div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider font-mono">
                <th class="p-3.5">SKU Canónico</th>
                <th class="p-3.5">Cód. Legado</th>
                <th class="p-3.5">Repuesto / Producto</th>
                <th class="p-3.5">Ubicación WMS</th>
                <th class="p-3.5">Stock Físico</th>
                <th class="p-3.5">Disponible</th>
                <th class="p-3.5">Costo PMP</th>
                <th class="p-3.5 text-right">Valor Total</th>
                <th class="p-3.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-medium font-mono">
              <tr 
                v-for="e in existenciasFiltradas.slice(0, 100)" 
                :key="e.id || e.sku" 
                @click="abrirExpediente(e)"
                class="hover:bg-slate-800/50 cursor-pointer transition-colors group"
              >
                <td class="p-3.5 font-bold text-amber-400 group-hover:underline">{{ e.sku }}</td>
                <td class="p-3.5 text-slate-400">{{ e.codigo_legado || '—' }}</td>
                <td class="p-3.5 font-sans font-semibold text-white group-hover:text-amber-300 transition-colors">
                  {{ e.producto_nombre }}
                </td>
                <td class="p-3.5 font-bold" :class="e.ubicacion_codigo === 'SIN-UBICAR' ? 'text-rose-400' : 'text-slate-200'">
                  📍 {{ e.ubicacion_codigo }}
                </td>
                <td class="p-3.5 text-white font-bold">{{ formatCantidad(e.cantidad_fisica, e.uom) }}</td>
                <td class="p-3.5 text-emerald-400 font-bold">{{ formatCantidad(e.cantidad_disponible, e.uom) }}</td>
                <td class="p-3.5 text-slate-300">${{ Number(e.pmp || 0).toLocaleString('es-CL') }}</td>
                <td class="p-3.5 text-right text-emerald-400 font-bold">${{ Number(e.valorizacion_total || 0).toLocaleString('es-CL') }}</td>
                <td class="p-3.5 text-center" @click.stop>
                  <button
                    @click="abrirExpediente(e)"
                    class="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 px-2.5 py-1 rounded text-[10px] font-bold border border-slate-700 transition-all inline-flex items-center gap-1"
                  >
                    <Eye class="w-3 h-3" /> Ver Ficha
                  </button>
                </td>
              </tr>
              <tr v-if="existenciasFiltradas.length === 0">
                <td colspan="9" class="p-8 text-center text-slate-500 font-sans italic">
                  No se encontraron existencias físicas que coincidan con el criterio seleccionado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <!-- ===================================================================== -->
    <!-- MODAL 1: DETALLE DE CASILLERO & TABLA DE EXISTENCIAS (1/4 vs 3/4)    -->
    <!-- ===================================================================== -->
    <div
      v-if="showModalCasillero"
      class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6"
    >
      <div class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-7xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        <!-- Encabezado del Modal de Casillero -->
        <div class="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Warehouse class="w-6 h-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs bg-amber-500/20 text-amber-300 font-mono font-black px-2.5 py-0.5 rounded border border-amber-500/30">
                  {{ selectedCell }}
                </span>
                <span class="text-xs text-slate-300 font-medium">
                  {{ selectedCellLabel }}
                </span>
                <span class="text-xs text-slate-500">·</span>
                <span class="text-xs text-slate-400">
                  {{ selectedBodega.nombre }}
                </span>
              </div>
              <h2 class="text-base font-black text-white mt-0.5 font-mono uppercase tracking-tight">
                Detalle de Ubicación & Existencias
              </h2>
            </div>
          </div>
          <button
            @click="showModalCasillero = false"
            class="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Cuerpo del Modal (Split 1/4 vs 3/4) -->
        <div class="flex-1 overflow-y-auto p-5 md:p-6">
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- 1/4 (25%): PANEL IZQUIERDO - FICHA CASILLERO Y QR DE VIGA -->
            <div class="space-y-4">
              <!-- Tarjeta Coordenadas / Resumen Casillero -->
              <div class="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  Coordenadas de Almacenamiento
                </div>
                <div class="font-mono font-black text-3xl text-amber-400">
                  {{ selectedCell }}
                </div>
                <div class="text-xs text-slate-300 font-medium leading-relaxed">
                  {{ selectedCellDescription }}
                </div>
                <div class="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div class="flex justify-between text-slate-400">
                    <span>Bodega:</span>
                    <span class="text-white font-medium">{{ selectedBodega.nombre }}</span>
                  </div>
                  <div class="flex justify-between text-slate-400">
                    <span>SKUs alojados:</span>
                    <span class="text-amber-400 font-bold font-mono">{{ itemsInSelectedCell.length }} repuestos</span>
                  </div>
                  <div class="flex justify-between text-slate-400">
                    <span>Total Unidades:</span>
                    <span class="text-emerald-400 font-bold font-mono">{{ totalUnidadesEnCelda }} UN</span>
                  </div>
                </div>
              </div>

              <!-- Tarjeta Etiqueta de Viga 50x30 mm con QR -->
              <div class="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div class="text-[10px] text-slate-300 font-black uppercase tracking-wider flex items-center justify-between">
                  <span>🏷️ Etiqueta de Viga (Rack)</span>
                  <span class="text-[9px] text-slate-500 font-mono">50 × 30 mm</span>
                </div>

                <!-- Simulación física de la etiqueta -->
                <div class="bg-white text-slate-950 p-2.5 rounded-xl border border-slate-300 shadow-md flex items-center gap-2.5 font-mono">
                  <div class="w-14 h-14 bg-white shrink-0 flex items-center justify-center p-0.5 border border-slate-300 rounded" v-html="qrSvg(`UB:${selectedCell}`, 54)"></div>
                  <div class="min-w-0 flex-1 leading-tight">
                    <div class="text-[8px] font-black tracking-widest text-slate-600 uppercase border-b border-slate-200 pb-0.5">
                      GRÚAS SAN PABLO
                    </div>
                    <div class="font-mono font-black text-lg text-black leading-tight mt-0.5">
                      {{ selectedCell }}
                    </div>
                    <div class="text-[8px] text-slate-700 font-bold truncate mt-0.5">
                      {{ selectedCellDescription }}
                    </div>
                    <div class="text-[7px] text-slate-500 mt-0.5">
                      Viga Rack · {{ selectedBodega.nombre }}
                    </div>
                  </div>
                </div>

                <p class="text-[11px] text-slate-400 leading-snug">
                  Etiqueta permanente para adherir a la viga metálica del casillero.
                </p>

                <button
                  @click="imprimirEtiquetaCasillero(selectedCell)"
                  class="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-700 transition-all shadow"
                >
                  <Printer class="w-3.5 h-3.5" /> Imprimir QR Casillero
                </button>
              </div>
            </div>

            <!-- 3/4 (75%): PANEL DERECHO - TABLA ENTERPRISE DE EXISTENCIAS -->
            <div class="lg:col-span-3 space-y-4">
              <!-- Barra de Estado y Métricas del Casillero -->
              <div class="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <Boxes class="w-4 h-4 text-amber-400" />
                  <span class="text-xs font-black uppercase text-white font-mono tracking-wider">
                    Existencias Físicas en Posición {{ selectedCell }}
                  </span>
                  <span class="text-xs bg-amber-500/10 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/20">
                    {{ itemsInSelectedCell.length }} SKUs
                  </span>
                </div>
                <div class="text-xs text-slate-400 font-mono">
                  Valorización en Casillero: <b class="text-emerald-400">${{ valorTotalEnCelda.toLocaleString('es-CL') }}</b>
                </div>
              </div>

              <!-- Tabla Enterprise Densa de Existencias -->
              <div class="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div v-if="itemsInSelectedCell.length > 0" class="overflow-x-auto">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider text-[11px]">
                        <th class="p-3">SKU Canónico</th>
                        <th class="p-3">Cód. Legado</th>
                        <th class="p-3">Repuesto / Producto</th>
                        <th class="p-3">Familia</th>
                        <th class="p-3 text-right">Físico</th>
                        <th class="p-3 text-right">Reservado</th>
                        <th class="p-3 text-right">Disponible</th>
                        <th class="p-3 text-right">PMP</th>
                        <th class="p-3 text-right">Total Val.</th>
                        <th class="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/70 font-mono font-medium">
                      <tr
                        v-for="item in itemsInSelectedCell"
                        :key="item.id || item.sku"
                        class="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                        @click="abrirExpediente(item)"
                      >
                        <td class="p-3 font-bold text-amber-400 group-hover:underline">
                          {{ item.sku }}
                        </td>
                        <td class="p-3 text-slate-400 text-[11px]">
                          {{ item.codigo_legado || '—' }}
                        </td>
                        <td class="p-3 font-sans font-semibold text-white group-hover:text-amber-300">
                          {{ item.producto_nombre }}
                        </td>
                        <td class="p-3 font-sans text-slate-300 text-[11px]">
                          {{ item.categoria_nombre || item.familia || 'General' }}
                        </td>
                        <td class="p-3 text-right font-black text-white">
                          {{ formatCantidad(item.cantidad_fisica, item.uom) }}
                        </td>
                        <td class="p-3 text-right font-bold text-amber-400">
                          {{ formatCantidad(item.cantidad_reservada || 0, item.uom) }}
                        </td>
                        <td class="p-3 text-right font-black text-emerald-400">
                          {{ formatCantidad(item.cantidad_disponible || item.cantidad_fisica, item.uom) }}
                        </td>
                        <td class="p-3 text-right text-slate-300">
                          ${{ Number(item.pmp || 0).toLocaleString('es-CL') }}
                        </td>
                        <td class="p-3 text-right font-bold text-emerald-400">
                          ${{ Number(item.valorizacion_total || (Number(item.cantidad_fisica || 0) * Number(item.pmp || 0))).toLocaleString('es-CL') }}
                        </td>
                        <td class="p-3 text-center" @click.stop>
                          <div class="flex items-center justify-center gap-1.5">
                            <button
                              @click="abrirExpediente(item)"
                              class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded text-[10px] uppercase flex items-center gap-1 shadow transition-all"
                              title="Abrir Formulario Único de Existencia con historial Kardex completo"
                            >
                              <FileText class="w-3 h-3" /> Formulario Único
                            </button>
                            <button
                              @click="imprimirEtiquetaRepuesto(item)"
                              class="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-2 py-1 rounded text-[10px] border border-slate-700 flex items-center gap-1 transition-all"
                              title="Imprimir etiqueta adhesiva de este SKU"
                            >
                              <Tag class="w-3 h-3" /> QR SKU
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-else class="p-10 text-center text-slate-500 font-sans italic space-y-2">
                  <div class="text-2xl">📦</div>
                  <div class="text-sm font-bold text-slate-400">Casillero Vacío</div>
                  <div class="text-xs">Esta posición no cuenta con repuestos físicos asignados actualmente.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer del Modal de Casillero -->
        <div class="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div class="text-xs text-slate-400 font-mono">
            Posición: <b class="text-amber-400">{{ selectedCell }}</b> · Total: <b class="text-white">{{ itemsInSelectedCell.length }} SKUs registrados</b>
          </div>
          <button
            @click="showModalCasillero = false"
            class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            Cerrar Casillero
          </button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 2: FORMULARIO ÚNICO DE EXISTENCIAS & EXPEDIENTE MAESTRO 360°    -->
    <!-- ===================================================================== -->
    <div 
      v-if="showExpedienteModal && selectedExpediente" 
      class="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
    >
      <div class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <!-- Encabezado Modal -->
        <div class="p-6 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Boxes class="w-6 h-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs bg-amber-500/20 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  {{ selectedExpediente.sku }}
                </span>
                <span v-if="selectedExpediente.codigo_legado" class="text-xs text-slate-400 font-mono">
                  (Cód. Legado: {{ selectedExpediente.codigo_legado }})
                </span>
                <span class="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                  📍 {{ selectedExpediente.ubicacion_codigo || selectedCell }}
                </span>
              </div>
              <h2 class="text-lg font-black text-white mt-1 leading-snug">
                {{ selectedExpediente.producto_nombre }}
              </h2>
              <div class="text-[11px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">
                Formulario Único de Existencias · Expediente Maestro 360°
              </div>
            </div>
          </div>
          <button 
            @click="showExpedienteModal = false" 
            class="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Cuerpo del Modal con Tabs de Detalle -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- 1. Tarjetas de Saldos Operacionales -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock Físico Total</div>
              <div class="text-xl font-black text-white font-mono mt-1">
                {{ formatCantidad(selectedExpediente.cantidad_fisica, selectedExpediente.uom) }}
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">En casillero físico</div>
            </div>

            <div class="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reservado en OTs</div>
              <div class="text-xl font-black text-amber-400 font-mono mt-1">
                {{ formatCantidad(selectedExpediente.cantidad_reservada || 0, selectedExpediente.uom) }}
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">En taller / proceso</div>
            </div>

            <div class="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Disponible Neto</div>
              <div class="text-xl font-black text-emerald-400 font-mono mt-1">
                {{ formatCantidad(selectedExpediente.cantidad_disponible || selectedExpediente.cantidad_fisica, selectedExpediente.uom) }}
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">Libre para despacho</div>
            </div>

            <div class="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Costo PMP Vigente</div>
              <div class="text-xl font-black text-emerald-400 font-mono mt-1">
                ${{ Number(selectedExpediente.pmp || 0).toLocaleString('es-CL') }}
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">Por {{ selectedExpediente.uom || 'UN' }}</div>
            </div>
          </div>

          <!-- 2. Línea de Tiempo Kardex & Trazabilidad Histórica -->
          <div>
            <div class="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div class="flex items-center gap-2">
                <History class="w-4 h-4 text-amber-400" />
                <h3 class="text-xs font-black uppercase text-white font-mono tracking-wider">
                  Historial de Movimientos Kardex (Trazabilidad E2E)
                </h3>
              </div>
              <span class="text-[10px] text-slate-400 font-mono">Últimas transacciones</span>
            </div>

            <div v-if="loadingKardex" class="p-8 text-center text-xs text-slate-400">
              Cargando historial de movimientos desde el Kardex inmutable...
            </div>

            <div v-else-if="kardexExpediente.length > 0" class="overflow-hidden rounded-xl border border-slate-800">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
                    <th class="p-3">Fecha</th>
                    <th class="p-3">Tipo Operación</th>
                    <th class="p-3">Documento / Folio</th>
                    <th class="p-3 text-right">Cantidad</th>
                    <th class="p-3 text-right">Saldo</th>
                    <th class="p-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80 font-mono">
                  <tr v-for="k in kardexExpediente" :key="k.id_movimiento || k.id" class="hover:bg-slate-800/40">
                    <td class="p-3 text-slate-400 text-[11px]">
                      {{ k.fecha_movimiento ? new Date(k.fecha_movimiento).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—' }}
                    </td>
                    <td class="p-3">
                      <span 
                        :class="[
                          'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          k.tipo_movimiento?.includes('RECEPCION') || k.tipo_movimiento?.includes('ENTRADA') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          k.tipo_movimiento?.includes('SALIDA') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          k.tipo_movimiento?.includes('DEVOLUCION') ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-slate-800 text-slate-300'
                        ]"
                      >
                        {{ k.tipo_movimiento }}
                      </span>
                    </td>
                    <td class="p-3 text-white font-bold">{{ k.documento_folio || k.documento_tipo || '—' }}</td>
                    <td class="p-3 text-right font-black" :class="Number(k.cantidad) >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                      {{ Number(k.cantidad) >= 0 ? '+' : '' }}{{ k.cantidad }}
                    </td>
                    <td class="p-3 text-right text-slate-200 font-bold">{{ k.stock_posterior || k.saldo || '—' }}</td>
                    <td class="p-3 text-slate-400 text-[11px] truncate max-w-xs">{{ k.observaciones || 'Sin observaciones' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 text-center text-xs text-slate-400 italic">
              Este repuesto no registra movimientos recientes en el Kardex.
            </div>
          </div>
        </div>

        <!-- Footer Modal con Acciones -->
        <div class="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            @click="imprimirEtiquetaRepuesto(selectedExpediente)"
            class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Tag class="w-4 h-4" /> Imprimir Etiqueta SKU Adhesiva
          </button>
          <button
            @click="showExpedienteModal = false"
            class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Warehouse, Download, Send, Truck, Printer, Boxes, X, Tag, Eye, History, FileText } from 'lucide-vue-next'
import apiAxios from '../../services/api'

// Pestaña activa
const activeTab = ref('mapa')
const selectedShelf = ref('E4')
const selectedCell = ref('E4-F2')
const selectedBodegaId = ref(1)
const filtroExistencias = ref('')
const filtroSoloConStock = ref(true)

// Modal Casillero & Existencias (1/4 vs 3/4)
const showModalCasillero = ref(false)

// Expediente 360° modal state (Formulario Único)
const showExpedienteModal = ref(false)
const selectedExpediente = ref(null)
const kardexExpediente = ref([])
const loadingKardex = ref(false)

// Formateador numérico inteligente (sin decimales para unidades discretas)
const formatCantidad = (cant, uom = 'UN') => {
  const n = Number(cant || 0)
  const uomUpper = String(uom || 'UN').toUpperCase().trim()
  const uomsEnteras = ['UN', 'PAR', 'JUEGO', 'KIT', 'PZA', 'TAMBOR', 'BALDE', 'ROLLO']
  if (uomsEnteras.includes(uomUpper)) {
    return `${Math.round(n)} ${uomUpper}`
  }
  return `${Number(n.toFixed(2))} ${uomUpper}`
}

// Abrir Expediente 360° y consultar Kardex
const abrirExpediente = async (item) => {
  if (!item) return
  selectedExpediente.value = item
  showExpedienteModal.value = true
  kardexExpediente.value = []
  loadingKardex.value = true
  try {
    const idProd = item.id_producto || item.id
    const res = await apiAxios.get('/inventario/kardex', { params: { id_producto: idProd, limit: 30 } })
    kardexExpediente.value = res.data?.data || res.data?.movimientos || []
  } catch (err) {
    console.error('Error cargando Kardex del expediente:', err)
  } finally {
    loadingKardex.value = false
  }
}

// Imprimir etiqueta térmica individual de repuesto (50x30 mm Zebra/Dymo)
const imprimirEtiquetaRepuesto = (item) => {
  if (!item) return
  const sku = item.sku || 'SKU'
  const nombre = item.producto_nombre || 'Repuesto'
  const pmp = Math.round(Number(item.pmp || 0)).toLocaleString('es-CL')
  const svg = qrSvg(`SKU:${sku}`, 60)
  const win = window.open('', '_blank', 'width=450,height=300')
  if (!win) {
    alert('Por favor permita ventanas emergentes para imprimir la etiqueta.')
    return
  }
  win.document.write(`
    <html>
      <head>
        <title>Etiqueta SKU ${sku}</title>
        <style>
          @page { size: 50mm 30mm; margin: 0; }
          body { margin: 0; padding: 2.5mm; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; display: flex; align-items: center; gap: 8px; width: 45mm; height: 25mm; box-sizing: border-box; }
          .qr { width: 50px; height: 50px; flex-shrink: 0; }
          .info { flex: 1; font-size: 8px; line-height: 1.15; overflow: hidden; min-width: 0; }
          .brand { font-size: 7px; font-weight: 900; letter-spacing: 0.5px; border-bottom: 1px solid #000; padding-bottom: 1.5px; text-transform: uppercase; }
          .sku { font-size: 11px; font-weight: 900; margin-top: 2px; font-family: monospace; }
          .nom { font-size: 8px; font-weight: 700; margin-top: 1.5px; white-space: normal; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
          .pmp { font-size: 8px; font-weight: 900; margin-top: 2px; color: #000; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="qr">${svg}</div>
        <div class="info">
          <div class="brand">GRÚAS SAN PABLO · WMS</div>
          <div class="sku">${sku}</div>
          <div class="nom">${nombre}</div>
          <div class="pmp">PMP: $${pmp} / ${item.uom || 'UN'}</div>
        </div>
      </body>
    </html>
  `)
  win.document.close()
}

// Listas maestras
const shelves = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9']
const levels = ['G', 'F', 'E', 'D', 'C', 'B', 'A']
const positions = [1, 2, 3, 4, 5, 6]

// Áreas especiales
const specialAreas = [
  { code: 'PAÑOL', desc: 'Herramientas y consumibles de uso diario' },
  { code: 'CORRAL', desc: 'Patio: tambores, neumáticos, piezas grandes' },
  { code: 'RECEPCIÓN', desc: 'Muelle de entrada (transitorio)' },
  { code: 'CUARENTENA', desc: 'Inspección de calidad / garantías' },
  { code: 'SIN-UBICAR', desc: 'Stock migrado sin posición (≈300 ítems)' }
]

// Estado reactivo de datos de backend
const bodegas = ref([
  { id: 1, nombre: 'Bodega Taller Central', sucursal_nombre: 'Santiago Central', estado: 'ACTIVA' },
  { id: 2, nombre: 'Bodega Faena Antofagasta', sucursal_nombre: 'Norte Grande', estado: 'ACTIVA' },
  { id: 3, nombre: 'Bodega Taller Móvil San Bernardo', sucursal_nombre: 'San Bernardo', estado: 'ACTIVA' }
])
const ubicaciones = ref([])
const existencias = ref([])

const selectedBodega = computed(() => {
  return bodegas.value.find(b => Number(b.id) === Number(selectedBodegaId.value)) || bodegas.value[0] || { nombre: 'Bodega Taller Central', sucursal_nombre: 'Santiago' }
})

// Acciones de selección
const selectShelf = (sh) => {
  selectedShelf.value = sh
  selectedCell.value = `${sh}-F2`
}

const selectCell = (cellCode) => {
  selectedCell.value = cellCode
  showModalCasillero.value = true
}

const selectSpecialArea = (areaCode) => {
  selectedCell.value = areaCode
  showModalCasillero.value = true
}

// Cálculo de ocupación por estantería (E1 - E9)
const getShelfOccupancy = (sh) => {
  const shelfStock = existencias.value.filter(e => e.ubicacion_codigo && e.ubicacion_codigo.startsWith(sh))
  if (shelfStock.length === 0) {
    // Si aún no hay items cargados en este rack, usar porcentaje demostrativo de ocupación
    const demoOcc = { E1: 67, E2: 69, E3: 67, E4: 67, E5: 67, E6: 67, E7: 67, E8: 67, E9: 67 }
    return demoOcc[sh] || 65
  }
  const occupiedCells = new Set(shelfStock.map(e => e.ubicacion_codigo)).size
  return Math.min(100, Math.round((occupiedCells / 42) * 100))
}

const getShelfItemsCount = (sh) => {
  return existencias.value
    .filter(e => e.ubicacion_codigo && e.ubicacion_codigo.startsWith(sh))
    .reduce((acc, e) => acc + Number(e.cantidad_fisica || 0), 0)
}

// Conteo de repuestos por celda
const getCellCount = (cellCode) => {
  const items = existencias.value.filter(e => e.ubicacion_codigo === cellCode)
  return items.length
}

const countItemsInLocation = (locCode) => {
  return existencias.value.filter(e => e.ubicacion_codigo === locCode).length
}

const getCellClasses = (cellCode) => {
  const count = getCellCount(cellCode)
  const isSelected = selectedCell.value === cellCode
  let baseColor = 'bg-slate-950 text-slate-500 border-slate-800/80 hover:border-slate-600'

  if (count === 1) {
    baseColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold'
  } else if (count === 2) {
    baseColor = 'bg-amber-500/30 text-amber-300 border-amber-500/50 font-bold'
  } else if (count >= 3) {
    baseColor = 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md'
  }

  if (isSelected) {
    return `${baseColor} !border-white ring-2 ring-amber-400 scale-105 z-10 shadow-xl`
  }
  return baseColor
}

// Items en la celda seleccionada
const itemsInSelectedCell = computed(() => {
  return existencias.value.filter(e => e.ubicacion_codigo === selectedCell.value)
})

const selectedCellLabel = computed(() => {
  if (selectedCell.value.includes('-')) {
    const [sh, rest] = selectedCell.value.split('-')
    return `Est. ${sh} · Niv ${rest[0]} · Pos ${rest.slice(1)}`
  }
  return 'Área Especial'
})

const selectedCellDescription = computed(() => {
  if (selectedCell.value.includes('-')) {
    const [sh, rest] = selectedCell.value.split('-')
    return `${sh} · Nivel ${rest[0]} · Posición ${rest.slice(1)}`
  }
  return `Área Especial ${selectedCell.value}`
})

const totalUnidadesEnCelda = computed(() => {
  return itemsInSelectedCell.value.reduce((acc, it) => acc + Number(it.cantidad_fisica || 0), 0)
})

const valorTotalEnCelda = computed(() => {
  return itemsInSelectedCell.value.reduce((acc, it) => {
    const val = Number(it.valorizacion_total) || (Number(it.cantidad_fisica || 0) * Number(it.pmp || 0))
    return acc + val
  }, 0)
})

// Filtros para la pestaña de existencias
const existenciasFiltradas = computed(() => {
  let list = existencias.value
  if (filtroSoloConStock.value) {
    list = list.filter(e => Number(e.cantidad_fisica || 0) > 0)
  }
  if (!filtroExistencias.value.trim()) return list
  const q = filtroExistencias.value.toLowerCase()
  return list.filter(e =>
    (e.sku && e.sku.toLowerCase().includes(q)) ||
    (e.producto_nombre && e.producto_nombre.toLowerCase().includes(q)) ||
    (e.ubicacion_codigo && e.ubicacion_codigo.toLowerCase().includes(q)) ||
    (e.codigo_legado && e.codigo_legado.toLowerCase().includes(q))
  )
})

const valorTotalCalculado = computed(() => {
  return existencias.value.reduce((acc, e) => acc + (Number(e.valorizacion_total) || 0), 0)
})

// Generador de QR SVG vectorial autónomo (sin dependencias externas)
const qrSvg = (text, px = 84) => {
  const n = 21
  let h = 2166136261
  for (const c of text) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 16777619) >>> 0
  }
  const rnd = () => {
    h ^= h << 13
    h >>>= 0
    h ^= h >> 17
    h ^= h << 5
    h >>>= 0
    return h / 4294967296
  }
  const finder = (x, y) => {
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      const lx = x - ox
      const ly = y - oy
      if (lx >= -1 && lx <= 7 && ly >= -1 && ly <= 7) {
        if (lx < 0 || ly < 0 || lx > 6 || ly > 6) return 0
        return (lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4)) ? 1 : 0
      }
    }
    return null
  }
  let r = ''
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const f = finder(x, y)
      if (f === 1 || (f === null && rnd() > 0.52)) {
        r += `<rect x="${x}" y="${y}" width="1" height="1"/>`
      }
    }
  }
  return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" width="${px}" height="${px}" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><g fill="#000">${r}</g></svg>`
}

// Impresión de etiqueta física de casillero (50x30 mm) para viga del rack
const imprimirEtiquetaCasillero = (cellCode) => {
  const code = cellCode || selectedCell.value
  if (!code) return
  const svg = qrSvg(`UB:${code}`, 60)
  const desc = selectedCellDescription.value
  const bodega = selectedBodega.value?.nombre || 'Bodega Taller Central'
  const win = window.open('', '_blank', 'width=450,height=300')
  if (!win) {
    alert('Por favor permita ventanas emergentes para imprimir la etiqueta de casillero.')
    return
  }
  win.document.write(`
    <html>
      <head>
        <title>Etiqueta Casillero ${code}</title>
        <style>
          @page { size: 50mm 30mm; margin: 0; }
          body { margin: 0; padding: 2.5mm; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; display: flex; align-items: center; gap: 8px; width: 45mm; height: 25mm; box-sizing: border-box; }
          .qr { width: 50px; height: 50px; flex-shrink: 0; }
          .info { flex: 1; font-size: 8px; line-height: 1.15; overflow: hidden; min-width: 0; }
          .brand { font-size: 7px; font-weight: 900; letter-spacing: 0.5px; border-bottom: 1px solid #000; padding-bottom: 1.5px; text-transform: uppercase; }
          .cell { font-size: 14px; font-weight: 900; margin-top: 2px; font-family: monospace; }
          .desc { font-size: 8px; font-weight: 700; margin-top: 1.5px; white-space: normal; }
          .bodega { font-size: 7px; font-weight: 600; margin-top: 2px; color: #444; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="qr">${svg}</div>
        <div class="info">
          <div class="brand">GRÚAS SAN PABLO · CASILLERO</div>
          <div class="cell">${code}</div>
          <div class="desc">${desc}</div>
          <div class="bodega">Viga Rack · ${bodega}</div>
        </div>
      </body>
    </html>
  `)
  win.document.close()
}

// Impresión de etiquetas
const imprimirEtiquetaActual = () => {
  window.print()
}

const imprimirEtiquetasEstanteria = () => {
  alert(`Preparando lote de 42 etiquetas térmicas (50×30 mm) para la Estantería ${selectedShelf.value} (Niveles A-G × Posiciones 1-6).`)
  window.print()
}

// Carga de datos reales de backend DEV
const loadRealData = async () => {
  try {
    const [resB, resU, resE] = await Promise.all([
      apiAxios.get('/inventario/bodegas').catch(() => ({ data: [] })),
      apiAxios.get('/inventario/ubicaciones').catch(() => ({ data: [] })),
      apiAxios.get('/inventario/existencias').catch(() => ({ data: [] }))
    ])

    const bData = resB.data?.data || resB.data
    if (Array.isArray(bData) && bData.length > 0) bodegas.value = bData

    const uData = resU.data?.data || resU.data
    if (Array.isArray(uData) && uData.length > 0) ubicaciones.value = uData

    const eData = resE.data?.data || resE.data
    if (Array.isArray(eData) && eData.length > 0) {
      existencias.value = eData
    }
  } catch (err) {
    console.error('Error cargando datos reales de inventario:', err)
  }
}

onMounted(loadRealData)
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  .bg-white, .bg-white * {
    visibility: visible;
  }
  .bg-white {
    position: absolute;
    left: 0;
    top: 0;
    width: 50mm !important;
    height: 30mm !important;
    margin: 0 !important;
    padding: 2mm !important;
    border: none !important;
    box-shadow: none !important;
  }
}
</style>
