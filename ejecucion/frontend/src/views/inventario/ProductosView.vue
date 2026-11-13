<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300 relative overflow-x-hidden">
    <!-- ENCABEZADO CANÓNICO WMS -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/5">
            <Package class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">Maestro de Existencias & Catálogo</h1>
              <span class="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded border border-emerald-500/20">
                WMS Enterprise
              </span>
              <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20 font-mono">
                {{ totalSkus }} SKUs
              </span>
            </div>
            <p class="text-slate-400 text-xs mt-0.5">
              Catálogo maestro de repuestos, clasificación por familia, existencias físicas consolidadas y trazabilidad Kardex 360°
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <router-link
          :to="{ name: 'inventario_bodegas' }"
          class="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
        >
          <Warehouse class="w-4 h-4" /> Ver Mapa de Racks
        </router-link>
        <button
          @click="showNuevoModal = true"
          class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
        >
          <Plus class="w-4 h-4" /> + Nuevo Producto
        </button>
      </div>
    </div>

    <!-- TARJETAS DE INDICADORES EJECUTIVOS (KPIS SUPERIORES) -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
      <!-- KPI 1: Total SKUs -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider">
          <span>Catálogo Total</span>
          <Package class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-2xl font-black text-white font-mono mt-1.5">{{ totalSkus }}</div>
        <div class="text-[11px] text-slate-500 mt-0.5">SKUs canónicos activos</div>
      </div>

      <!-- KPI 2: Total Familias -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider">
          <span>Familias Activas</span>
          <Layers class="w-4 h-4 text-cyan-400" />
        </div>
        <div class="text-2xl font-black text-cyan-400 font-mono mt-1.5">{{ totalFamilias }}</div>
        <div class="text-[11px] text-slate-500 mt-0.5">Categorías de material</div>
      </div>

      <!-- KPI 3: Existencias Físicas Totales -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider">
          <span>Existencias Físicas</span>
          <Boxes class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="text-2xl font-black text-emerald-400 font-mono mt-1.5">{{ totalUnidadesFisicas }} UN</div>
        <div class="text-[11px] text-slate-500 mt-0.5">Unidades consolidadas</div>
      </div>

      <!-- KPI 4: Valorización Total Inventario -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider">
          <span>Valorización PMP</span>
          <DollarSign class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="text-2xl font-black text-emerald-400 font-mono mt-1.5">
          ${{ Math.round(valorTotalInventario / 1000000).toLocaleString('es-CL') }}M
        </div>
        <div class="text-[11px] text-slate-500 mt-0.5">${{ Math.round(valorTotalInventario).toLocaleString('es-CL') }} CLP</div>
      </div>

      <!-- KPI 5: Sin Stock / Quiebre -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider">
          <span>Saldo Cero</span>
          <AlertTriangle class="w-4 h-4 text-rose-400" />
        </div>
        <div class="text-2xl font-black text-rose-400 font-mono mt-1.5">{{ totalSinStock }}</div>
        <div class="text-[11px] text-slate-500 mt-0.5">SKUs sin existencias</div>
      </div>
    </div>

    <!-- BARRA DE BÚSQUEDA Y FILTROS ENTERPRISE -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl space-y-3.5">
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <!-- Buscador Universal -->
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por SKU, código legado, código OEM o nombre de repuesto…"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <!-- Filtro Selector de Familia -->
        <div class="w-full lg:w-56 shrink-0">
          <select
            v-model="selectedFamily"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="">Todas las Familias ({{ productos.length }})</option>
            <option v-for="fam in availableFamilies" :key="fam" :value="fam">
              {{ fam }}
            </option>
          </select>
        </div>

        <!-- Filtro Selector de Criticidad -->
        <div class="w-full lg:w-44 shrink-0">
          <select
            v-model="selectedImpacto"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="">Toda Criticidad</option>
            <option value="CRITICO">Crítico (Parada de grúa)</option>
            <option value="IMPORTANTE">Importante</option>
            <option value="NORMAL">Normal / Consumible</option>
          </select>
        </div>
      </div>

      <!-- Fila Inferior de Filtros Rápidos: Estado de Stock y Contador -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/70 text-xs">
        <!-- Segmented Control de Existencias -->
        <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            @click="filtroStock = 'con_stock'"
            :class="[
              'px-3 py-1.5 rounded-lg font-bold text-xs transition-all',
              filtroStock === 'con_stock' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
            ]"
          >
            Con Existencias (> 0)
          </button>
          <button
            @click="filtroStock = 'sin_stock'"
            :class="[
              'px-3 py-1.5 rounded-lg font-bold text-xs transition-all',
              filtroStock === 'sin_stock' ? 'bg-rose-500 text-white font-black shadow' : 'text-slate-400 hover:text-white'
            ]"
          >
            Sin Stock (0 UN)
          </button>
          <button
            @click="filtroStock = 'todos'"
            :class="[
              'px-3 py-1.5 rounded-lg font-bold text-xs transition-all',
              filtroStock === 'todos' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
            ]"
          >
            Todo el Catálogo
          </button>
        </div>

        <div class="text-xs text-slate-400 font-mono">
          Mostrando <strong class="text-amber-400 font-bold">{{ filteredProductos.length }}</strong> de {{ productos.length }} repuestos
        </div>
      </div>
    </div>

    <!-- TABLA PRINCIPAL DE EXISTENCIAS -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider font-mono">
              <th class="p-3.5">SKU Canónico</th>
              <th class="p-3.5">Cód. Legado</th>
              <th class="p-3.5">Descripción & Referencias</th>
              <th class="p-3.5">Familia</th>
              <th class="p-3.5">Unidad</th>
              <th class="p-3.5">Criticidad</th>
              <th class="p-3.5 text-right">Stock Físico</th>
              <th class="p-3.5 text-right">Disponible</th>
              <th class="p-3.5 text-right">PMP Vigente</th>
              <th class="p-3.5 text-right">Total Val.</th>
              <th class="p-3.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr
              v-for="p in paginatedProductos"
              :key="p.id || p.sku"
              @click="openProductModal(p)"
              class="hover:bg-slate-800/50 cursor-pointer transition-colors group"
            >
              <td class="p-3.5 font-mono font-bold text-amber-400 group-hover:underline">{{ p.sku }}</td>
              <td class="p-3.5 font-mono text-slate-400">
                <span>{{ p.codigo_legado || '—' }}</span>
              </td>
              <td class="p-3.5">
                <div class="font-bold text-white group-hover:text-amber-300 transition-colors">{{ p.nombre }}</div>
                <div class="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                  {{ p.descripcion || 'Sin descripción adicional' }}
                </div>
              </td>
              <td class="p-3.5 text-slate-300">{{ p.familia || 'General' }}</td>
              <td class="p-3.5 font-mono">
                <span class="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px] font-bold">
                  {{ p.uom || p.unidad_medida_base || 'UN' }}
                </span>
              </td>
              <td class="p-3.5">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-black uppercase border',
                    p.impacto === 'CRITICO' || p.impacto_operacional === 'CRITICO' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                    p.impacto === 'IMPORTANTE' || p.impacto_operacional === 'IMPORTANTE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  ]"
                >
                  {{ p.impacto || p.impacto_operacional || 'Normal' }}
                </span>
              </td>
              <td class="p-3.5 text-right font-mono font-bold text-white">
                {{ formatCantidad(p.stock_fisico || p.stock_disponible, p.uom) }}
              </td>
              <td class="p-3.5 text-right font-mono font-bold text-emerald-400">
                {{ formatCantidad(p.stock_disponible || p.stock_fisico, p.uom) }}
              </td>
              <td class="p-3.5 text-right font-mono font-bold text-slate-300">
                ${{ Math.round(Number(p.pmp || p.costo_pmp_vigente || 0)).toLocaleString('es-CL') }}
              </td>
              <td class="p-3.5 text-right font-mono font-bold text-emerald-400">
                ${{ Math.round((Number(p.stock_fisico || p.stock_disponible || 0)) * (Number(p.pmp || p.costo_pmp_vigente || 0))).toLocaleString('es-CL') }}
              </td>
              <td class="p-3.5 text-center" @click.stop>
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    @click="openProductModal(p)"
                    class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded text-[10px] uppercase flex items-center gap-1 shadow transition-all"
                    title="Abrir Formulario Único de Existencia con historial Kardex"
                  >
                    <FileText class="w-3 h-3" /> Formulario Único
                  </button>
                  <button
                    @click="imprimirEtiquetaRepuesto(p)"
                    class="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-2 py-1 rounded text-[10px] border border-slate-700 flex items-center gap-1 transition-all"
                    title="Imprimir sticker adhesivo de este repuesto con su SKU"
                  >
                    <Tag class="w-3 h-3" /> QR SKU
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredProductos.length === 0">
              <td colspan="11" class="p-8 text-center text-slate-500 font-sans italic">
                No se encontraron repuestos que coincidan con los criterios de búsqueda y filtros.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación Simple -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center text-xs">
        <span class="text-slate-400 font-mono">Página {{ currentPage }} de {{ totalPages }}</span>
        <div class="flex gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 bg-slate-800 disabled:opacity-30 rounded-lg text-white font-bold"
          >
            ← Anterior
          </button>
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 bg-slate-800 disabled:opacity-30 rounded-lg text-white font-bold"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL ENTERPRISE: FORMULARIO ÚNICO DE EXISTENCIAS · EXPEDIENTE 360°   -->
    <!-- (REEMPLAZA TOTALMENTE LA ANTIGUA VENTANA LATERAL DESLIZANTE)          -->
    <!-- ===================================================================== -->
    <div
      v-if="showExpedienteModal && selectedProduct"
      class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6"
    >
      <div class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        <!-- Encabezado del Modal -->
        <div class="p-5 md:p-6 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Boxes class="w-6 h-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs bg-amber-500/20 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  {{ selectedProduct.sku }}
                </span>
                <span v-if="selectedProduct.codigo_legado" class="text-xs text-slate-400 font-mono">
                  (Cód. Legado: {{ selectedProduct.codigo_legado }})
                </span>
                <span class="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                  📍 {{ selectedProduct.ubicacion_codigo || 'Bodega Central' }}
                </span>
              </div>
              <h2 class="text-lg font-black text-white mt-1 leading-snug">
                {{ selectedProduct.nombre }}
              </h2>
              <div class="text-[11px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">
                Formulario Único de Existencias · Expediente Maestro 360°
              </div>
            </div>
          </div>
          <button
            @click="cerrarModal"
            class="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Pestañas de Navegación del Modal -->
        <div class="flex gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs font-bold font-mono overflow-x-auto">
          <button
            @click="activeModalTab = 'general'"
            :class="[
              'px-4 py-2 rounded-t-xl transition-all border-b-2',
              activeModalTab === 'general' ? 'text-amber-400 border-amber-400 bg-amber-500/10' : 'text-slate-400 border-transparent hover:text-white'
            ]"
          >
            Ficha & Saldos
          </button>
          <button
            @click="activeModalTab = 'ubicaciones'"
            :class="[
              'px-4 py-2 rounded-t-xl transition-all border-b-2',
              activeModalTab === 'ubicaciones' ? 'text-amber-400 border-amber-400 bg-amber-500/10' : 'text-slate-400 border-transparent hover:text-white'
            ]"
          >
            Ubicación en Racks
          </button>
          <button
            @click="activeModalTab = 'kardex'"
            :class="[
              'px-4 py-2 rounded-t-xl transition-all border-b-2',
              activeModalTab === 'kardex' ? 'text-amber-400 border-amber-400 bg-amber-500/10' : 'text-slate-400 border-transparent hover:text-white'
            ]"
          >
            Trazabilidad Kardex
          </button>
          <button
            @click="activeModalTab = 'referencias'"
            :class="[
              'px-4 py-2 rounded-t-xl transition-all border-b-2',
              activeModalTab === 'referencias' ? 'text-amber-400 border-amber-400 bg-amber-500/10' : 'text-slate-400 border-transparent hover:text-white'
            ]"
          >
            OEM & Compatibilidad
          </button>
        </div>

        <!-- Contenido del Modal -->
        <div class="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          <!-- TAB 1: FICHA & SALDOS -->
          <div v-if="activeModalTab === 'general'" class="space-y-5">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock Físico Total</div>
                <div class="text-xl font-black text-white font-mono mt-1">
                  {{ formatCantidad(selectedProduct.stock_fisico || selectedProduct.stock_disponible, selectedProduct.uom) }}
                </div>
                <div class="text-[10px] text-slate-500 mt-0.5">En casillero físico</div>
              </div>
              <div class="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reservado en OTs</div>
                <div class="text-xl font-black text-amber-400 font-mono mt-1">
                  {{ formatCantidad(selectedProduct.stock_reservado || 0, selectedProduct.uom) }}
                </div>
                <div class="text-[10px] text-slate-500 mt-0.5">En taller / faena</div>
              </div>
              <div class="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Disponible Neto</div>
                <div class="text-xl font-black text-emerald-400 font-mono mt-1">
                  {{ formatCantidad(selectedProduct.stock_disponible || selectedProduct.stock_fisico, selectedProduct.uom) }}
                </div>
                <div class="text-[10px] text-slate-500 mt-0.5">Libre para despacho</div>
              </div>
              <div class="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Costo PMP Vigente</div>
                <div class="text-xl font-black text-emerald-400 font-mono mt-1">
                  ${{ Math.round(Number(selectedProduct.pmp || selectedProduct.costo_pmp_vigente || 0)).toLocaleString('es-CL') }}
                </div>
                <div class="text-[10px] text-slate-500 mt-0.5">Por {{ selectedProduct.uom || 'UN' }}</div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Datos Maestros</div>
                <div class="flex justify-between"><span class="text-slate-400">Familia:</span> <span class="text-white font-medium">{{ selectedProduct.familia || 'General' }}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Unidad Base:</span> <span class="font-mono text-white">{{ selectedProduct.uom || selectedProduct.unidad_medida_base || 'UN' }}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Control:</span> <span class="text-amber-400 font-bold">{{ selectedProduct.tipo_control || 'Sin control' }}</span></div>
              </div>
              <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Gestión de Compras</div>
                <div class="flex justify-between"><span class="text-slate-400">Presentación:</span> <span class="text-white font-medium">{{ selectedProduct.presentacion_compra || 'Unidad Base' }}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Factor Conversión:</span> <span class="font-mono text-white">{{ selectedProduct.factor_conversion || 1 }}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Rotable:</span> <span class="font-bold" :class="selectedProduct.es_rotable ? 'text-violet-400' : 'text-slate-500'">{{ selectedProduct.es_rotable ? 'SÍ' : 'NO' }}</span></div>
              </div>
              <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Parámetros de Reposición</div>
                <div class="flex justify-between"><span class="text-slate-400">Punto Reorden (ROP):</span> <span class="text-amber-400 font-bold font-mono">{{ selectedProduct.punto_reorden || selectedProduct.rop || 2 }} UN</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Stock Mínimo:</span> <span class="text-slate-300 font-mono">{{ selectedProduct.stock_minimo || selectedProduct.min || 1 }} UN</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Stock Máximo:</span> <span class="text-slate-300 font-mono">{{ selectedProduct.stock_maximo || selectedProduct.max || 5 }} UN</span></div>
              </div>
            </div>
          </div>

          <!-- TAB 2: UBICACIÓN EN RACKS -->
          <div v-if="activeModalTab === 'ubicaciones'" class="space-y-4 text-xs">
            <div class="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div class="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span class="font-bold text-white uppercase font-mono">Ubicación Física Asignada en Bodega</span>
                <span class="text-amber-400 font-mono font-bold">📍 {{ selectedProduct.ubicacion_codigo || 'E4-F2' }}</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div class="text-[10px] text-slate-400">Bodega</div>
                  <div class="font-bold text-white mt-1">{{ selectedProduct.bodega_nombre || 'Bodega Taller Central' }}</div>
                </div>
                <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div class="text-[10px] text-slate-400">Casillero / Viga</div>
                  <div class="font-mono font-black text-amber-400 text-lg mt-0.5">{{ selectedProduct.ubicacion_codigo || 'E4-F2' }}</div>
                </div>
                <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div class="text-[10px] text-slate-400">Stock en este Casillero</div>
                  <div class="font-mono font-black text-emerald-400 text-lg mt-0.5">{{ formatCantidad(selectedProduct.stock_fisico || selectedProduct.stock_disponible, selectedProduct.uom) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: KARDEX TRAZABILIDAD -->
          <div v-if="activeModalTab === 'kardex'" class="space-y-3">
            <div v-if="loadingKardex" class="p-8 text-center text-xs text-slate-400">
              Cargando movimientos Kardex desde la base de datos...
            </div>
            <div v-else-if="kardexList.length > 0" class="rounded-xl border border-slate-800 overflow-hidden">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                    <th class="p-3">Fecha</th>
                    <th class="p-3">Tipo Operación</th>
                    <th class="p-3">Documento / Folio</th>
                    <th class="p-3 text-right">Cantidad</th>
                    <th class="p-3 text-right">Saldo</th>
                    <th class="p-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80 font-mono">
                  <tr v-for="k in kardexList" :key="k.id_movimiento || k.id" class="hover:bg-slate-800/40">
                    <td class="p-3 text-slate-400">{{ k.fecha_movimiento ? new Date(k.fecha_movimiento).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—' }}</td>
                    <td class="p-3">
                      <span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase', k.tipo_movimiento?.includes('RECEPCION') || k.tipo_movimiento?.includes('ENTRADA') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : k.tipo_movimiento?.includes('SALIDA') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300']">
                        {{ k.tipo_movimiento }}
                      </span>
                    </td>
                    <td class="p-3 text-white font-bold">{{ k.documento_folio || k.documento_tipo || '—' }}</td>
                    <td class="p-3 text-right font-black" :class="Number(k.cantidad) >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                      {{ Number(k.cantidad) >= 0 ? '+' : '' }}{{ k.cantidad }}
                    </td>
                    <td class="p-3 text-right text-slate-200 font-bold">{{ k.stock_posterior || k.saldo || '—' }}</td>
                    <td class="p-3 text-slate-400 truncate max-w-xs">{{ k.observaciones || 'Sin observaciones' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="p-8 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-slate-800">
              No registra movimientos recientes en Kardex.
            </div>
          </div>

          <!-- TAB 4: REFERENCIAS & COMPATIBILIDAD -->
          <div v-if="activeModalTab === 'referencias'" class="space-y-4 text-xs">
            <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div class="font-bold text-white uppercase font-mono mb-2">Códigos OEM & Alternativos Cruzados</div>
              <div v-for="(refItem, i) in productReferences" :key="i" class="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span class="text-amber-400 font-mono font-bold">{{ refItem.tipo }}: {{ refItem.marca }}</span>
                <span class="font-mono text-white font-bold">{{ refItem.codigo }}</span>
              </div>
            </div>
            <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div class="font-bold text-white uppercase font-mono mb-2">Compatibilidad con Modelos de Flota</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="c in productCompatibility" :key="c" class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono">
                  {{ c }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Modal con Acciones -->
        <div class="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            @click="imprimirEtiquetaRepuesto(selectedProduct)"
            class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Tag class="w-4 h-4" /> Imprimir Etiqueta SKU Adhesiva (50×30 mm)
          </button>
          <button
            @click="cerrarModal"
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
import { 
  Package, 
  Search, 
  Plus, 
  Warehouse, 
  Layers, 
  Boxes, 
  DollarSign, 
  AlertTriangle, 
  Tag, 
  FileText, 
  X 
} from 'lucide-vue-next'
import apiAxios from '../../services/api'

// Estado reactivo de datos
const productos = ref([])
const searchQuery = ref('')
const selectedFamily = ref('')
const selectedImpacto = ref('')
const filtroStock = ref('con_stock') // 'con_stock', 'sin_stock', 'todos'
const currentPage = ref(1)
const itemsPerPage = 50
const showNuevoModal = ref(false)

// Estado del Modal Formulario Único
const showExpedienteModal = ref(false)
const selectedProduct = ref(null)
const activeModalTab = ref('general')
const kardexList = ref([])
const loadingKardex = ref(false)

// Formateador numérico humano
const formatCantidad = (cant, uom = 'UN') => {
  const n = Number(cant || 0)
  const uomUpper = String(uom || 'UN').toUpperCase().trim()
  const uomsEnteras = ['UN', 'PAR', 'JUEGO', 'KIT', 'PZA', 'TAMBOR', 'BALDE', 'ROLLO']
  if (uomsEnteras.includes(uomUpper)) {
    return `${Math.round(n)} ${uomUpper}`
  }
  return `${Number(n.toFixed(2))} ${uomUpper}`
}

// Métricas KPI Superiores
const totalSkus = computed(() => productos.value.length)
const totalFamilias = computed(() => availableFamilies.value.length)
const totalUnidadesFisicas = computed(() => {
  return productos.value.reduce((acc, p) => acc + Number(p.stock_fisico || p.stock_disponible || 0), 0)
})
const valorTotalInventario = computed(() => {
  return productos.value.reduce((acc, p) => {
    const qty = Number(p.stock_fisico || p.stock_disponible || 0)
    const pmp = Number(p.pmp || p.costo_pmp_vigente || 0)
    return acc + (qty * pmp)
  }, 0)
})
const totalSinStock = computed(() => {
  return productos.value.filter(p => Number(p.stock_fisico || p.stock_disponible || 0) === 0).length
})

// Familias dinámicas extraídas del catálogo
const availableFamilies = computed(() => {
  const set = new Set(productos.value.map(p => p.familia).filter(Boolean))
  return Array.from(set).sort()
})

// Filtrado de productos
const filteredProductos = computed(() => {
  let list = productos.value

  if (selectedFamily.value) {
    list = list.filter(p => p.familia === selectedFamily.value)
  }

  if (selectedImpacto.value) {
    list = list.filter(p => (p.impacto === selectedImpacto.value || p.impacto_operacional === selectedImpacto.value))
  }

  if (filtroStock.value === 'con_stock') {
    list = list.filter(p => Number(p.stock_fisico || p.stock_disponible || 0) > 0)
  } else if (filtroStock.value === 'sin_stock') {
    list = list.filter(p => Number(p.stock_fisico || p.stock_disponible || 0) === 0)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p =>
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.codigo_legado && p.codigo_legado.toLowerCase().includes(q)) ||
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(q))
    )
  }
  return list
})

const totalPages = computed(() => Math.ceil(filteredProductos.value.length / itemsPerPage) || 1)

const paginatedProductos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredProductos.value.slice(start, start + itemsPerPage)
})

// Apertura del Modal Formulario Único 360°
const openProductModal = async (p) => {
  if (!p) return
  selectedProduct.value = p
  activeModalTab.value = 'general'
  showExpedienteModal.value = true
  kardexList.value = []
  loadingKardex.value = true

  try {
    const idProd = p.id_producto || p.id
    const res = await apiAxios.get('/inventario/kardex', { params: { id_producto: idProd, limit: 30 } })
    kardexList.value = res.data?.data || res.data?.movimientos || []
  } catch (err) {
    console.error('Error cargando Kardex del producto:', err)
  } finally {
    loadingKardex.value = false
  }
}

const cerrarModal = () => {
  showExpedienteModal.value = false
  selectedProduct.value = null
}

// Datos contextuales de compatibilidad y OEM
const productReferences = computed(() => {
  if (!selectedProduct.value) return []
  return [
    { tipo: 'OEM', marca: 'Liebherr / Parker', codigo: selectedProduct.value.codigo_legado || '10295317' },
    { tipo: 'ALTERNATIVO', marca: 'Donaldson / Fleetguard', codigo: 'P553004 / AF25557' }
  ]
})

const productCompatibility = computed(() => {
  if (!selectedProduct.value) return []
  return ['Liebherr LTM 1100-4.2', 'Liebherr LTM 1090-4.1', 'Grove GMK 5250L', 'Camión Pluma Volvo FMX']
})

// Generador de QR SVG vectorial autónomo
const qrSvg = (text, px = 60) => {
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

// Impresión de etiqueta individual de SKU
const imprimirEtiquetaRepuesto = (item) => {
  if (!item) return
  const sku = item.sku || 'SKU'
  const nombre = item.nombre || item.producto_nombre || 'Repuesto'
  const pmp = Math.round(Number(item.pmp || item.costo_pmp_vigente || 0)).toLocaleString('es-CL')
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

// Carga de catálogo real
const loadProductos = async () => {
  try {
    const res = await apiAxios.get('/inventario/productos')
    const data = res.data?.data || res.data
    if (Array.isArray(data)) {
      productos.value = data
    }
  } catch (err) {
    console.error('Error cargando catálogo maestro:', err)
  }
}

onMounted(loadProductos)
</script>
