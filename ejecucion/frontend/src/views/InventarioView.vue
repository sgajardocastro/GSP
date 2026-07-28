<template>
  <div class="min-h-screen bg-[#0F172A] text-slate-100 p-6 font-sans">
    <!-- Header Principal Módulo WMS-Lite (Estilo GSP Amber/Slate) -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-5">
      <div class="flex items-center gap-3">
        <div class="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
          <Package class="w-7 h-7" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black tracking-wide text-white uppercase">Gestión de Inventario WMS-Lite</h1>
            <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20">GSP ENTERPRISE</span>
          </div>
          <p class="text-slate-400 text-xs mt-0.5">Control de bodegas, traspasos inter-bodega, existencias por barcode e impresión térmica de etiquetas</p>
        </div>
      </div>

      <!-- Acciones Rápidas -->
      <div class="flex items-center gap-3">
        <button
          @click="openIngresoModal(null)"
          class="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/20 text-xs uppercase tracking-wider"
        >
          <PlusCircle class="w-4 h-4" />
          Ingresar Material (OC)
        </button>
        <button
          @click="showTraspasoModal = true"
          class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-all duration-200 text-xs uppercase tracking-wider"
        >
          <ArrowLeftRight class="w-4 h-4" />
          Nuevo Traspaso
        </button>
      </div>
    </div>

    <!-- Navegación Principal por Pestañas -->
    <div class="flex border-b border-slate-800 mb-6 gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id; selectedBodegaDetail = null"
        :class="[
          'px-5 py-2.5 font-bold text-xs rounded-lg transition-all flex items-center gap-2 tracking-wide uppercase',
          activeTab === tab.id
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        ]"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.name }}
      </button>
    </div>

    <!-- ==================================================================== -->
    <!-- PESTAÑA 1: VISTA DE BODEGAS (TARJETAS + KPIs DE STOCK CONSOLIDADO) -->
    <!-- ==================================================================== -->
    <div v-if="activeTab === 'bodegas' && !selectedBodegaDetail" class="space-y-6">
      <!-- Tarjetas de Resumen KPI -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-400 font-bold uppercase">Bodegas Activas</div>
            <div class="text-2xl font-black text-white mt-1">{{ bodegas.length }}</div>
          </div>
          <div class="p-3 bg-amber-500/10 text-amber-500 rounded-lg"><Warehouse class="w-6 h-6" /></div>
        </div>
        <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-400 font-bold uppercase">Total Existencias</div>
            <div class="text-2xl font-black text-white mt-1">{{ totalExistenciasCount }}</div>
          </div>
          <div class="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Boxes class="w-6 h-6" /></div>
        </div>
        <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-400 font-bold uppercase">Valorización Stock</div>
            <div class="text-2xl font-black text-emerald-400 mt-1">${{ totalValorizacionStock.toLocaleString('es-CL') }}</div>
          </div>
          <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><DollarSign class="w-6 h-6" /></div>
        </div>
        <div class="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-400 font-bold uppercase">Traspasos En Tránsito</div>
            <div class="text-2xl font-black text-amber-400 mt-1">{{ traspasosEnTransitoCount }}</div>
          </div>
          <div class="p-3 bg-amber-500/10 text-amber-400 rounded-lg"><ArrowLeftRight class="w-6 h-6" /></div>
        </div>
      </div>

      <!-- Grilla de Bodegas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="bodega in bodegas"
          :key="bodega.id"
          class="bg-slate-800/80 border border-slate-700 hover:border-amber-500/50 rounded-2xl p-5 space-y-4 transition-all duration-200 group relative shadow-xl hover:shadow-2xl"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-slate-900 text-amber-400 rounded-xl border border-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <Warehouse class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">{{ bodega.nombre }}</h3>
                <span class="text-xs text-slate-400 flex items-center gap-1">
                  📍 {{ bodega.sucursal_nombre }}
                </span>
              </div>
            </div>
            <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider', bodega.estado === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400']">
              {{ bodega.estado }}
            </span>
          </div>

          <p class="text-xs text-slate-400 line-clamp-2">{{ bodega.observacion || 'Sin observaciones registradas.' }}</p>

          <!-- Estadísticas de la Bodega -->
          <div class="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
            <div>
              <span class="text-slate-500 font-semibold block uppercase text-[10px]">SKUs Físicos</span>
              <strong class="text-white text-sm font-mono">{{ getExistenciasCountByBodega(bodega.id) }} unids.</strong>
            </div>
            <div>
              <span class="text-slate-500 font-semibold block uppercase text-[10px]">Valor Total</span>
              <strong class="text-emerald-400 text-sm font-mono">${{ getValorStockByBodega(bodega.id).toLocaleString('es-CL') }}</strong>
            </div>
          </div>

          <!-- Botón de Entrar a la Bodega -->
          <button
            @click="verDetalleBodega(bodega)"
            class="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-amber-500 text-slate-300 hover:text-slate-950 font-bold py-2.5 rounded-xl border border-slate-700 hover:border-amber-500 text-xs uppercase tracking-wider transition-all duration-200"
          >
            <Eye class="w-4 h-4" />
            Entrar y Ver Existencias
          </button>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- DETALLE DE BODEGA SELECCIONADA -->
    <!-- ==================================================================== -->
    <div v-if="selectedBodegaDetail" class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/90 border border-slate-700 p-5 rounded-2xl">
        <div class="flex items-center gap-4">
          <button
            @click="selectedBodegaDetail = null"
            class="p-2 bg-slate-900 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors text-xs font-bold flex items-center gap-2"
          >
            ← Volver a Bodegas
          </button>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-amber-500 font-bold uppercase tracking-wider">Bodega Seleccionada</span>
              <span class="text-slate-600">/</span>
              <span class="text-xs text-slate-400">{{ selectedBodegaDetail.sucursal_nombre }}</span>
            </div>
            <h2 class="text-xl font-black text-white mt-0.5">{{ selectedBodegaDetail.nombre }}</h2>
          </div>
        </div>

        <button
          @click="openIngresoModal(selectedBodegaDetail.id)"
          class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
        >
          <PlusCircle class="w-4 h-4" />
          Ingresar Stock a Esta Bodega
        </button>
      </div>

      <!-- Tabla de Existencias con Botón para Imprimir Barcode Directo -->
      <div class="overflow-x-auto bg-slate-800/50 border border-slate-800 rounded-2xl">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
              <th class="p-3.5">SKU / Barcode</th>
              <th class="p-3.5">Repuesto / Producto</th>
              <th class="p-3.5">Ubicación Física</th>
              <th class="p-3.5">Stock Dispon.</th>
              <th class="p-3.5">Costo Neto ($)</th>
              <th class="p-3.5">Nº OC</th>
              <th class="p-3.5">Estado</th>
              <th class="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-for="item in getExistenciasBySelectedBodega" :key="item.id" class="hover:bg-slate-800/80 transition-colors">
              <td class="p-3.5 font-mono font-bold text-amber-400">
                <div>{{ item.sku }}</div>
                <div class="text-[10px] text-slate-500 font-normal">{{ item.codigo_barras }}</div>
              </td>
              <td class="p-3.5">
                <div class="font-bold text-white text-sm">{{ item.producto_nombre }}</div>
                <div class="text-[11px] text-slate-400">Cód. Fab: <span class="font-mono text-slate-300">{{ item.codigo_fabricante }}</span> | {{ item.marca }}</div>
              </td>
              <td class="p-3.5 text-slate-300">
                📍 {{ item.ubicacion_fisica || 'Sin asignar' }}
              </td>
              <td class="p-3.5 font-bold text-white text-sm font-mono">
                {{ item.cantidad_disponible }}
              </td>
              <td class="p-3.5 font-mono text-emerald-400 font-bold text-sm">
                ${{ item.costo.toLocaleString('es-CL') }}
              </td>
              <td class="p-3.5 font-mono text-slate-300">
                {{ item.oc }}
              </td>
              <td class="p-3.5">
                <span :class="[
                  'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider',
                  item.estado === 'DISPONIBLE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  item.estado === 'EN_TRANSITO' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                ]">
                  {{ item.estado }}
                </span>
              </td>
              <td class="p-3.5 text-right space-x-2">
                <button @click="imprimirEtiqueta(item)" class="text-xs text-amber-400 hover:text-amber-300 font-bold px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-center gap-1 inline-flex">
                  <Printer class="w-3 h-3" /> Imprimir Barcode
                </button>
                <button @click="bajaExistencia(item)" class="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20">
                  Baja
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- PESTAÑA 2: TRASPASOS INTER-BODEGA -->
    <!-- ==================================================================== -->
    <div v-if="activeTab === 'traspasos'" class="space-y-6">
      <div class="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700">
        <div>
          <h2 class="text-lg font-bold text-white">Gestión de Traspasos Inter-Bodega</h2>
          <p class="text-xs text-slate-400">Transferencias de existencias entre bodegas con estado En Tránsito y confirmación en destino</p>
        </div>
        <button @click="showTraspasoModal = true" class="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
          + Iniciar Traspaso
        </button>
      </div>

      <div class="overflow-x-auto bg-slate-800/50 border border-slate-800 rounded-2xl">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
              <th class="p-3.5">ID Traspaso</th>
              <th class="p-3.5">Bodega Origen</th>
              <th class="p-3.5">Bodega Destino</th>
              <th class="p-3.5">Repuesto / SKU</th>
              <th class="p-3.5">Cantidad</th>
              <th class="p-3.5">Fecha Envíon</th>
              <th class="p-3.5">Estado</th>
              <th class="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-for="t in traspasos" :key="t.id" class="hover:bg-slate-800/80 transition-colors">
              <td class="p-3.5 font-mono font-bold text-amber-400">#TRP-{{ t.id }}</td>
              <td class="p-3.5 text-slate-300 font-semibold">{{ t.origen_nombre }}</td>
              <td class="p-3.5 text-slate-300 font-semibold">{{ t.destino_nombre }}</td>
              <td class="p-3.5 text-white font-bold">{{ t.producto_nombre }} ({{ t.sku }})</td>
              <td class="p-3.5 font-mono text-white font-bold">{{ t.cantidad }} unids.</td>
              <td class="p-3.5 text-slate-400">{{ t.fecha_envio }}</td>
              <td class="p-3.5">
                <span :class="['px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider', t.estado === 'EN_TRANSITO' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20']">
                  {{ t.estado }}
                </span>
              </td>
              <td class="p-3.5 text-right">
                <button
                  v-if="t.estado === 'EN_TRANSITO'"
                  @click="confirmarRecepcionTraspaso(t)"
                  class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs"
                >
                  Confirmar Recepción
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- MODAL IMPRESIÓN TÉRMICA DE ETIQUETA BARCODE -->
    <!-- ==================================================================== -->
    <div v-if="showBarcodePrinterModal && selectedBarcodeItem" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <Printer class="w-5 h-5 text-amber-400" /> Impresión de Etiqueta Térmica
          </h3>
          <button @click="showBarcodePrinterModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <!-- Vista Previa de Etiqueta Térmica (Zebra / Thermal Standard 50x30mm) -->
        <div class="bg-white text-slate-950 p-4 rounded-xl border-2 border-slate-300 font-mono shadow-inner space-y-2 text-center">
          <div class="text-[10px] font-black uppercase tracking-widest text-slate-600">GRÚAS SAN PABLO — WMS LITE</div>
          <div class="text-sm font-black tracking-tight leading-none text-black">{{ selectedBarcodeItem.producto_nombre }}</div>
          <div class="text-[11px] font-bold text-slate-700">SKU: {{ selectedBarcodeItem.sku }}</div>

          <!-- Representación de Código de Barras -->
          <div class="py-2 flex flex-col items-center justify-center">
            <div class="h-12 w-48 bg-slate-950 flex items-center justify-center p-1 rounded">
              <div class="w-full h-full bg-white flex justify-around items-center px-1">
                <div v-for="n in 28" :key="n" :class="['h-full', n % 3 === 0 ? 'w-1 bg-black' : n % 2 === 0 ? 'w-0.5 bg-black' : 'w-1.5 bg-black']"></div>
              </div>
            </div>
            <span class="text-xs font-bold tracking-widest mt-1 text-black font-mono">{{ selectedBarcodeItem.codigo_barras }}</span>
          </div>

          <div class="flex justify-between text-[9px] text-slate-600 border-t border-slate-300 pt-1 font-bold">
            <span>OC: {{ selectedBarcodeItem.oc }}</span>
            <span>FECHA: {{ new Date().toLocaleDateString('es-CL') }}</span>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button @click="showBarcodePrinterModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cerrar</button>
          <button @click="imprimirTicketFisico" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20">
            <Printer class="w-4 h-4" /> 🖨️ Imprimir en Impresora Térmica
          </button>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- MODAL INGRESO DE MATERIAL (OC + COSTO > 0) -->
    <!-- ==================================================================== -->
    <div v-if="showRecepcionModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <span>📥</span> Ingreso de Material a Bodega
          </h3>
          <button @click="showRecepcionModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold">
          ⚠️ {{ errorMessage }}
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Bodega Destino *</label>
            <select v-model="formIngreso.id_bodega" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
              <option v-for="b in bodegas" :key="b.id" :value="b.id">{{ b.nombre }} ({{ b.sucursal_nombre }})</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Seleccionar Producto del Catálogo *</label>
            <select v-model="formIngreso.id_producto" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
              <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }} — Cód: {{ p.codigo_fabricante }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Cantidad *</label>
              <input v-model.number="formIngreso.cantidad" type="number" min="1" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Costo Neto ($) *</label>
              <input v-model.number="formIngreso.costo" type="number" min="1" placeholder="Ej: 4500" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Nº Orden de Compra (OC) *</label>
            <input v-model="formIngreso.oc" type="text" placeholder="Ej: OC-993821" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
          </div>

          <div>
            <label class="block text-slate-400 mb-1 font-bold uppercase">Ubicación Física en Bodega</label>
            <input v-model="formIngreso.ubicacion_fisica" type="text" placeholder="Ej: Pasillo 3, Estante B" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button @click="showRecepcionModal = false" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancelar</button>
          <button @click="submitIngreso" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
            Ingresar y Generar Barcode
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Package, Warehouse, Boxes, DollarSign, ArrowLeftRight, Eye, PlusCircle, Printer } from 'lucide-vue-next'
import apiAxios from '../services/api'

const activeTab = ref('bodegas')
const selectedBodegaDetail = ref(null)
const showRecepcionModal = ref(false)
const showTraspasoModal = ref(false)
const showBarcodePrinterModal = ref(false)
const selectedBarcodeItem = ref(null)
const errorMessage = ref('')
const loadingData = ref(false)

const tabs = [
  { id: 'bodegas', name: 'Bodegas & Stock', icon: Warehouse },
  { id: 'traspasos', name: 'Traspasos Inter-Bodega', icon: ArrowLeftRight },
  { id: 'productos', name: 'Catálogo de Repuestos', icon: Package }
]

const bodegas = ref([
  { id: 1, nombre: 'Bodega Principal Santiago', sucursal_nombre: 'Santiago Central', estado: 'ACTIVO', observacion: 'Bodega matriz de repuestos y filtros pesados.' },
  { id: 2, nombre: 'Bodega Faena Antofagasta', sucursal_nombre: 'Norte Grande', estado: 'ACTIVO', observacion: 'Stock de repuestos para grúas hidráulicas en minería.' },
  { id: 3, nombre: 'Bodega Taller Móvil', sucursal_nombre: 'San Bernardo', estado: 'ACTIVO', observacion: 'Insumos de mantención rápida en ruta.' }
])

const productos = ref([
  { id: 101, codigo_fabricante: 'FL-400S', nombre: 'Filtro de Aceite Motorcraft', prefijo_sku: 'FILT', marca: 'Motorcraft', tipo: 'Filtros', nivel_minimo: 5 },
  { id: 102, codigo_fabricante: 'BRK-882', nombre: 'Pastillas de Freno Delanteras', prefijo_sku: 'PAST', marca: 'Brembo', tipo: 'Frenos', nivel_minimo: 2 },
  { id: 103, codigo_fabricante: 'HYD-990', nombre: 'Aceite Hidráulico ISO VG 68 (20L)', prefijo_sku: 'ACEI', marca: 'Shell Tellus', tipo: 'Lubricantes', nivel_minimo: 10 }
])

const existencias = ref([
  {
    id: 501,
    id_bodega: 1,
    sku: 'FILT-000501',
    codigo_barras: 'BAR-501-889',
    producto_nombre: 'Filtro de Aceite Motorcraft',
    codigo_fabricante: 'FL-400S',
    marca: 'Motorcraft',
    ubicacion_fisica: 'Pasillo 3, Estante B',
    cantidad_disponible: 12,
    costo: 4500,
    oc: 'OC-99382',
    estado: 'DISPONIBLE'
  }
])

const traspasos = ref([
  {
    id: 101,
    origen_nombre: 'Bodega Principal Santiago',
    destino_nombre: 'Bodega Faena Antofagasta',
    producto_nombre: 'Filtro de Aceite Motorcraft',
    sku: 'FILT-000501',
    cantidad: 4,
    fecha_envio: '2026-07-26 14:30',
    estado: 'EN_TRANSITO'
  }
])

const formIngreso = ref({
  id_bodega: 1,
  id_producto: 101,
  cantidad: 10,
  costo: 4500,
  oc: 'OC-993821',
  ubicacion_fisica: 'Pasillo 1, Estante A'
})

const totalExistenciasCount = computed(() => existencias.value.reduce((acc, e) => acc + e.cantidad_disponible, 0))
const totalValorizacionStock = computed(() => existencias.value.reduce((acc, e) => acc + (e.costo * e.cantidad_disponible), 0))
const traspasosEnTransitoCount = computed(() => traspasos.value.filter(t => t.estado === 'EN_TRANSITO').length)

const getExistenciasCountByBodega = (bodegaId) => {
  return existencias.value.filter(e => e.id_bodega === bodegaId).reduce((acc, e) => acc + e.cantidad_disponible, 0)
}

const getValorStockByBodega = (bodegaId) => {
  return existencias.value.filter(e => e.id_bodega === bodegaId).reduce((acc, e) => acc + (e.costo * e.cantidad_disponible), 0)
}

const verDetalleBodega = (bodega) => {
  selectedBodegaDetail.value = bodega
}

const getExistenciasBySelectedBodega = computed(() => {
  if (!selectedBodegaDetail.value) return []
  return existencias.value.filter(e => e.id_bodega === selectedBodegaDetail.value.id)
})

const openIngresoModal = (bodegaId) => {
  if (bodegaId) formIngreso.value.id_bodega = bodegaId
  showRecepcionModal.value = true
}

const submitIngreso = () => {
  errorMessage.value = ''

  if (!formIngreso.value.costo || formIngreso.value.costo <= 0) {
    errorMessage.value = 'Regla de Negocio (COSTO_CERO_NO_PERMITIDO): El costo debe ser mayor a 0.'
    return
  }

  if (!formIngreso.value.oc || formIngreso.value.oc.trim() === '') {
    errorMessage.value = 'Regla de Negocio (OC_REQUERIDA): El número de Orden de Compra es obligatorio.'
    return
  }

  const newId = Date.now()
  const prod = productos.value.find(p => p.id === formIngreso.value.id_producto)

  const newItem = {
    id: newId,
    id_bodega: formIngreso.value.id_bodega,
    sku: `${prod.prefijo_sku}-${newId.toString().slice(-6)}`,
    codigo_barras: `BAR-${newId.toString().slice(-6)}`,
    producto_nombre: prod.nombre,
    codigo_fabricante: prod.codigo_fabricante,
    marca: prod.marca,
    ubicacion_fisica: formIngreso.value.ubicacion_fisica,
    cantidad_disponible: formIngreso.value.cantidad,
    costo: formIngreso.value.costo,
    oc: formIngreso.value.oc,
    estado: 'DISPONIBLE'
  }

  existencias.value.unshift(newItem)
  showRecepcionModal.value = false

  // Abrir Modal de Impresión Térmica de Barcode Inmediatamente
  imprimirEtiqueta(newItem)
}

const imprimirEtiqueta = (item) => {
  selectedBarcodeItem.value = item
  showBarcodePrinterModal.value = true
}

const imprimirTicketFisico = () => {
  window.print()
}

const confirmarRecepcionTraspaso = (traspaso) => {
  traspaso.estado = 'RECIBIDO'
}

const bajaExistencia = (item) => {
  item.estado = 'BAJA'
}

const fetchRealData = async () => {
  try {
    loadingData.value = true
    const { data: bodegasData } = await apiAxios.get('/inventario/bodegas')
    if (bodegasData && Array.isArray(bodegasData) && bodegasData.length > 0) {
      bodegas.value = bodegasData
    }
    const { data: productosData } = await apiAxios.get('/inventario/productos')
    if (productosData && productosData.data && Array.isArray(productosData.data)) {
      productos.value = productosData.data
    }
    const { data: existenciasData } = await apiAxios.get('/inventario/existencias')
    if (existenciasData && Array.isArray(existenciasData) && existenciasData.length > 0) {
      existencias.value = existenciasData
    }
  } catch (err) {
    console.log('Conectado con API /inventario (usando fallback si el servidor dev está reiniciando):', err.message)
  } finally {
    loadingData.value = false
  }
}

onMounted(fetchRealData)
</script>
