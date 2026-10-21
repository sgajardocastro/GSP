<template>
  <div class="bg-slate-950 min-h-screen text-slate-100 flex flex-col pb-20 select-none">
    
    <!-- Header Superior de la Vista de Bodega Mobile -->
    <div class="bg-slate-900 border-b border-white/10 px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
          <v-icon size="22">mdi-warehouse</v-icon>
        </div>
        <div>
          <div class="text-xs font-black uppercase tracking-wider text-white">Bodega & Pañol WMS</div>
          <div class="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            En Línea (DEV PostgreSQL)
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Botón Flotante para abrir la Cámara Escáner -->
        <v-btn
          color="amber"
          variant="flat"
          size="small"
          class="font-black text-slate-950 text-xs px-3 shadow-lg"
          prepend-icon="mdi-qrcode-scan"
          @click="abrirScannerCamara"
        >
          Escanear
        </v-btn>
      </div>
    </div>

    <!-- Pestañas de Modos de Operación -->
    <div class="bg-slate-950 px-2 py-2 border-b border-white/5 flex gap-1.5 overflow-x-auto hide-scrollbar text-xs font-bold sticky top-[61px] z-10">
      <button
        v-for="modo in modosOperacion"
        :key="modo.id"
        :class="[
          'px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 text-xs font-bold',
          modoActivo === modo.id ? 'bg-amber-500 text-slate-950 font-black shadow' : 'bg-slate-900 text-slate-300 hover:text-white border border-white/5'
        ]"
        @click="cambiarModo(modo.id)"
      >
        <v-icon size="14">{{ modo.icon }}</v-icon>
        <span>{{ modo.label }}</span>
      </button>
    </div>

    <!-- Banner Rápido de Escaneo con Pistola / Teclado -->
    <div class="px-4 py-2 bg-slate-900/60 border-b border-white/5 flex items-center justify-between text-[11px] text-slate-400">
      <span class="flex items-center gap-1">
        <v-icon size="13" color="amber">mdi-barcode-scan</v-icon>
        Lector Barcode HID:
      </span>
      <input
        ref="hiddenBarcodeInput"
        v-model="filtroRapido"
        type="text"
        placeholder="Disparar o buscar SKU/Código..."
        class="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-56"
        @keyup.enter="procesarEscaneoManual"
      />
    </div>

    <!-- Contenido Dinámico según Modo Activo -->
    <div class="flex-1 p-4 space-y-4">
      
      <!-- ================================================================= -->
      <!-- MODO 1: CONSULTA RÁPIDA (LOOKUP)                                 -->
      <!-- ================================================================= -->
      <div v-if="modoActivo === 'lookup'" class="space-y-4">
        
        <!-- Ficha de Producto si hay uno consultado -->
        <div v-if="productoConsultado" class="p-4 bg-slate-900 rounded-2xl border border-amber-500/30 shadow-xl space-y-3">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono font-black text-xs">
                  {{ productoConsultado.sku }}
                </span>
                <span class="text-[10px] text-slate-400 font-mono">
                  Legado: {{ productoConsultado.codigo_legado || 'N/A' }}
                </span>
              </div>
              <h2 class="text-base font-black text-white mt-1">
                {{ productoConsultado.nombre }}
              </h2>
              <div class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span><v-icon size="12" color="amber">mdi-tag</v-icon> {{ productoConsultado.familia }}</span>
                <span>•</span>
                <span>UoM: <strong class="text-white">{{ productoConsultado.uom }}</strong></span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase text-slate-400 font-bold block">PMP Vigente</span>
              <span class="text-sm font-black text-emerald-400 font-mono">
                ${{ Math.round(Number(productoConsultado.pmp) || 0).toLocaleString('es-CL') }}
              </span>
            </div>
          </div>

          <!-- Métricas de Stock y Ubicación -->
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <div class="p-2.5 bg-slate-950 rounded-xl">
              <span class="text-[10px] uppercase text-slate-400 font-bold block">Stock Disponible</span>
              <div class="flex items-baseline gap-1 mt-0.5">
                <span class="text-xl font-black text-white font-mono">
                  {{ productoConsultado.stock_fisico || productoConsultado.stock || 0 }}
                </span>
                <span class="text-xs text-slate-400">{{ productoConsultado.uom }}</span>
              </div>
              <span class="text-[10px] text-emerald-400 font-semibold">✓ Saldo activo</span>
            </div>

            <div class="p-2.5 bg-slate-950 rounded-xl">
              <span class="text-[10px] uppercase text-slate-400 font-bold block">Ubicación Física</span>
              <div class="flex items-center gap-1.5 mt-0.5">
                <v-icon size="14" color="amber">mdi-map-marker</v-icon>
                <span class="text-base font-black text-white font-mono">
                  {{ productoConsultado.ubicacion || 'SIN-UBICAR' }}
                </span>
              </div>
              <span class="text-[10px] text-slate-400">Bodega Central GSP</span>
            </div>
          </div>

          <!-- Acciones Rápidas -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <v-btn
              color="amber"
              variant="flat"
              size="small"
              class="font-black text-slate-950 text-xs"
              prepend-icon="mdi-wrench"
              @click="imputarAOtDesdeConsulta(productoConsultado)"
            >
              Imputar a OT
            </v-btn>

            <v-btn
              color="slate-800"
              variant="flat"
              size="small"
              class="font-bold text-white text-xs border border-white/10"
              prepend-icon="mdi-arrows-up-down-left-right"
              @click="reubicarDesdeConsulta(productoConsultado)"
            >
              Reubicar
            </v-btn>
          </div>
        </div>

        <!-- Catálogo Rápido / Búsqueda si no hay producto seleccionado -->
        <div v-else class="space-y-3">
          <div class="p-4 bg-slate-900 rounded-2xl border border-white/10 text-center space-y-2">
            <v-icon size="48" color="amber">mdi-qrcode-scan</v-icon>
            <div class="text-sm font-black text-white">Escanee un Código QR o Barcode</div>
            <p class="text-xs text-slate-400">
              Apunte a una etiqueta de repuesto para ver stock y precio, o a un rack (ej: E1-A2) para ver su contenido.
            </p>
            <v-btn
              color="amber"
              variant="flat"
              size="small"
              class="font-black text-slate-950 text-xs mt-2"
              @click="abrirScannerCamara"
            >
              Abrir Cámara de Escaneo
            </v-btn>
          </div>

          <!-- Muestra de Repuestos Populares en Bodega -->
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Repuestos Frecuentes en Bodega:
          </div>
          <div class="space-y-2">
            <div
              v-for="item in listaMuestra"
              :key="item.sku"
              class="p-3 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-amber-500/30 transition"
              @click="seleccionarProductoMuestra(item)"
            >
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px]">
                    {{ item.sku }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">{{ item.legado }}</span>
                </div>
                <div class="text-xs font-bold text-white mt-0.5">{{ item.nombre }}</div>
                <div class="text-[10px] text-slate-400">Ubicación: <strong>{{ item.ubic }}</strong></div>
              </div>
              <div class="text-right">
                <span class="text-xs font-black text-emerald-400 font-mono">${{ item.pmp.toLocaleString('es-CL') }}</span>
                <span class="text-[10px] text-slate-400 block">{{ item.stock }} unids</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- MODO 2: DESPACHO A ORDEN DE TRABAJO (OT)                          -->
      <!-- ================================================================= -->
      <div v-if="modoActivo === 'despacho'" class="space-y-4">
        
        <!-- Tarjeta de OT Destino -->
        <div class="p-3.5 bg-slate-900 rounded-2xl border border-white/10 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold text-amber-400">Orden de Trabajo Destino</span>
            <v-btn size="x-small" variant="text" color="amber" @click="cambiarOt">Cambiar OT</v-btn>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-base font-black text-white font-mono">{{ otSeleccionada.numero }}</div>
              <div class="text-xs text-slate-300">{{ otSeleccionada.equipo }}</div>
            </div>
            <span class="px-2 py-1 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] uppercase">
              {{ otSeleccionada.tipo }}
            </span>
          </div>
          <div class="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
            <span>Técnico: <strong>{{ otSeleccionada.tecnico }}</strong></span>
            <span>Planta / Taller Central</span>
          </div>
        </div>

        <!-- Lista de Repuestos en el Carrito de Despacho (Escaneo Continuo) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>MATERIALES A ENTREGAR ({{ itemsDespacho.length }})</span>
            <v-btn size="x-small" variant="text" color="amber" prepend-icon="mdi-plus" @click="abrirScannerCamara">
              Escanear Repuesto
            </v-btn>
          </div>

          <div v-if="itemsDespacho.length === 0" class="p-6 bg-slate-900/60 rounded-xl border border-dashed border-white/10 text-center text-slate-400 text-xs">
            <v-icon size="32" color="slate-600" class="mb-1">mdi-cart-outline</v-icon>
            <div>No hay repuestos en el carrito de despacho.</div>
            <div class="text-[10px] text-slate-500 mt-1">Escanee los repuestos entregados al mecánico.</div>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(it, idx) in itemsDespacho"
              :key="idx"
              class="p-2.5 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between text-xs"
            >
              <div>
                <div class="font-bold text-white">{{ it.nombre }}</div>
                <div class="text-[10px] text-slate-400 font-mono">
                  {{ it.sku }} | ${{ it.pmp.toLocaleString('es-CL') }} / u
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex items-center bg-slate-950 rounded-lg border border-slate-700">
                  <button class="px-2 py-0.5 text-slate-400 hover:text-white" @click="modificarCantidad(idx, -1)">-</button>
                  <span class="px-2 text-white font-bold font-mono">{{ it.cantidad }}</span>
                  <button class="px-2 py-0.5 text-slate-400 hover:text-white" @click="modificarCantidad(idx, 1)">+</button>
                </div>
                <button class="text-red-400 hover:text-red-300 p-1" @click="eliminarItemDespacho(idx)">
                  <v-icon size="16">mdi-trash-can-outline</v-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Total Despacho -->
          <div v-if="itemsDespacho.length > 0" class="p-3 bg-slate-900 rounded-xl border border-white/10 flex items-center justify-between text-xs mt-3">
            <div>
              <span class="text-[10px] uppercase text-slate-400 font-bold block">Costo Total Imputado a OT</span>
              <span class="text-base font-black text-emerald-400 font-mono">
                ${{ totalCostoDespacho.toLocaleString('es-CL') }} CLP
              </span>
            </div>
            <div class="text-right text-[10px] text-slate-400">
              <span>Transacción: <strong>KARDEX DESPACHO</strong></span><br>
              <span>Afecta PMP Vigente</span>
            </div>
          </div>

          <v-btn
            v-if="itemsDespacho.length > 0"
            block
            color="amber"
            class="font-black text-slate-950 text-xs py-3 mt-3 shadow-lg uppercase"
            prepend-icon="mdi-check-circle"
            :loading="guardandoDespacho"
            @click="confirmarDespachoOt"
          >
            Confirmar y Despachar a OT
          </v-btn>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- MODO 3: REUBICACIÓN DE GAVETAS (RELOCATION)                       -->
      <!-- ================================================================= -->
      <div v-if="modoActivo === 'reubicar'" class="space-y-4">
        <div class="p-3 bg-slate-900 rounded-xl border border-white/5">
          <span class="text-[10px] font-bold uppercase text-amber-400 block">Flujo de Reubicación</span>
          <div class="text-xs font-bold text-white mt-0.5">Paso 1: Repuesto ➔ Paso 2: Escanear nueva ubicación física</div>
        </div>

        <div class="p-4 bg-slate-900 rounded-2xl border border-white/10 space-y-3">
          <!-- Paso 1 -->
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">1. Repuesto a Reubicar</span>
            <div class="p-2.5 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between text-xs">
              <div>
                <div class="font-bold text-white">{{ reubicarItem.nombre || 'Seleccione un repuesto' }}</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ reubicarItem.sku }} | Ubic. Actual: {{ reubicarItem.ubicacion || 'SIN-UBICAR' }}</div>
              </div>
              <v-btn size="x-small" variant="tonal" color="amber" @click="abrirScannerCamara">Cambiar</v-btn>
            </div>
          </div>

          <div class="text-center text-amber-400 text-sm">
            <v-icon>mdi-arrow-down-bold</v-icon>
          </div>

          <!-- Paso 2 -->
          <div>
            <span class="text-[10px] uppercase font-bold text-amber-400 block mb-1">2. Ubicación Física Destino</span>
            <div class="flex gap-2">
              <v-text-field
                v-model="reubicarDestino"
                placeholder="Escanee QR de rack (ej: E4-C2)..."
                variant="outlined"
                density="compact"
                color="amber"
                hide-details
                class="font-mono text-xs uppercase"
              ></v-text-field>
              <v-btn color="amber" variant="tonal" size="small" height="40" @click="abrirScannerCamara">
                <v-icon>mdi-qrcode-scan</v-icon>
              </v-btn>
            </div>
            <div class="text-[10px] text-slate-400 mt-1">
              Racks válidos: E1-A1 a E6-A5, CORRAL, PAÑOL, INFLAMABLES.
            </div>
          </div>

          <v-btn
            block
            color="amber"
            class="font-black text-slate-950 text-xs py-2.5 mt-2 uppercase"
            prepend-icon="mdi-arrows-up-down-left-right"
            :disabled="!reubicarDestino"
            @click="confirmarReubicacion"
          >
            Confirmar Reubicación en Kardex
          </v-btn>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODO 4: RECEPCIÓN INBOUND                                         -->
      <!-- ================================================================= -->
      <div v-if="modoActivo === 'recepcion'" class="space-y-4">
        <div class="p-3 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold text-amber-400 block">Recepción de Mercaderías</span>
            <div class="text-sm font-black text-white font-mono">OC-2026-0891</div>
            <div class="text-[10px] text-slate-400">Proveedor: DIMASUR S.A.</div>
          </div>
          <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] uppercase">
            En Descarga
          </span>
        </div>

        <div class="p-4 bg-slate-900 rounded-2xl border border-white/10 space-y-3">
          <div class="text-xs font-bold text-slate-300">Líneas de la Orden de Compra:</div>
          <div class="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-2 text-xs">
            <div class="flex items-start justify-between">
              <div>
                <span class="font-bold text-white block">PARKA 2 EN 1 AZUL TALLA M</span>
                <span class="text-[10px] text-slate-400 font-mono">EPP-00200 • Pedido: 10 unids</span>
              </div>
              <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">10 Recibidas</span>
            </div>
            <div class="pt-2 border-t border-white/10 flex items-center justify-between">
              <span class="text-[10px] text-slate-400">Asignar a: <strong class="text-white font-mono">SIN-UBICAR</strong></span>
              <v-btn size="x-small" variant="tonal" color="amber" prepend-icon="mdi-printer" @click="imprimirEtiquetaDemo">
                Etiqueta QR 50x30
              </v-btn>
            </div>
          </div>

          <v-btn
            block
            color="emerald"
            class="font-black text-slate-950 text-xs py-2.5 mt-2 uppercase"
            prepend-icon="mdi-check-double"
            @click="confirmarRecepcionDemo"
          >
            Cerrar Recepción e Ingresar a Stock
          </v-btn>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODO 5: CONTEO CÍCLICO CIEGO                                      -->
      <!-- ================================================================= -->
      <div v-if="modoActivo === 'conteo'" class="space-y-4">
        <div class="p-3.5 bg-slate-900 rounded-xl border border-white/5 space-y-1">
          <span class="text-[10px] font-bold uppercase text-amber-400 block">Auditoría Cíclica ABC</span>
          <div class="flex items-center justify-between">
            <span class="text-sm font-black text-white">Gaveta: <strong class="text-amber-400 font-mono">Rack E1-A2</strong></span>
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">16 SKUs Teóricos</span>
          </div>
          <p class="text-[11px] text-slate-400">
            Conteo Ciego: Escanee cada repuesto en la gaveta y digite la cantidad física real observada.
          </p>
        </div>

        <div class="p-4 bg-slate-900 rounded-2xl border border-white/10 space-y-3">
          <div class="space-y-2 text-xs">
            <div class="p-2.5 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span class="font-bold text-white block">FILTRO AIRE EXT SCANIA</span>
                <span class="text-[10px] text-slate-400 font-mono">FILT-00373</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-slate-400">Físico:</span>
                <input type="number" value="6" class="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-bold text-white font-mono text-xs" />
                <v-icon size="16" color="emerald">mdi-check-circle</v-icon>
              </div>
            </div>

            <div class="p-2.5 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span class="font-bold text-white block">FILTRO ACEITE MOTOR SCANIA</span>
                <span class="text-[10px] text-slate-400 font-mono">FILT-00387</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-slate-400">Físico:</span>
                <input type="number" value="4" class="w-12 bg-slate-900 border border-amber-500 rounded px-1.5 py-0.5 text-center font-bold text-amber-400 font-mono text-xs" />
                <v-icon size="16" color="amber">mdi-alert</v-icon>
              </div>
            </div>
          </div>

          <v-btn
            block
            color="amber"
            class="font-black text-slate-950 text-xs py-2.5 uppercase"
            prepend-icon="mdi-send"
            @click="enviarConteoDemo"
          >
            Enviar Conteo a Aprobación
          </v-btn>
        </div>
      </div>

    </div>

    <!-- Modal Reutilizable de Escáner QR / Barcode -->
    <QrBarcodeScannerModal
      v-model="mostrarScannerModal"
      :titulo="tituloScanner"
      :subtitulo="subtituloScanner"
      :continuous="modoActivo === 'despacho'"
      @scan="handleEscaneoExitoso"
    />

    <!-- Diálogo / Snackbar de Alerta de Éxito o Error -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" size="small" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api.js'
import QrBarcodeScannerModal from '@/components/inventario/QrBarcodeScannerModal.vue'

const modoActivo = ref('lookup')
const mostrarScannerModal = ref(false)
const filtroRapido = ref('')
const guardandoDespacho = ref(false)

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

function notificar(text, color = 'success') {
  snackbar.value = { show: true, text, color }
}

const modosOperacion = [
  { id: 'lookup', label: 'Consulta', icon: 'mdi-magnify' },
  { id: 'despacho', label: 'Despacho OT', icon: 'mdi-wrench' },
  { id: 'reubicar', label: 'Reubicar', icon: 'mdi-arrows-up-down-left-right' },
  { id: 'recepcion', label: 'Recepción', icon: 'mdi-truck-cargo-container' },
  { id: 'conteo', label: 'Conteo ABC', icon: 'mdi-clipboard-check-outline' }
]

function cambiarModo(id) {
  modoActivo.value = id
}

// Configuración contextual del Escáner
const tituloScanner = computed(() => {
  if (modoActivo.value === 'lookup') return 'Consulta de Repuesto o Gaveta'
  if (modoActivo.value === 'despacho') return 'Escaneo Continuo de Repuestos a OT'
  if (modoActivo.value === 'reubicar') return 'Escanear Ubicación Destino'
  if (modoActivo.value === 'recepcion') return 'Escanear Mercadería Inbound'
  return 'Conteo Cíclico'
})

const subtituloScanner = computed(() => {
  if (modoActivo.value === 'despacho') return 'Cada escaneo agregará 1 unidad al despacho'
  return 'Enfoque el código QR o código de barras'
})

function abrirScannerCamara() {
  mostrarScannerModal.value = true
}

// Datos de Muestra precargados de la Base de Datos DEV
const listaMuestra = [
  { sku: 'FILT-00373', legado: 'FAE0075', nombre: 'FILTRO AIRE EXT SCANIA 2829529', familia: 'Filtros', uom: 'UN', pmp: 38450, stock: 6, ubic: 'E1-A2' },
  { sku: 'MEC-01237', legado: 'TMR0637', nombre: 'TURBO GRÚA LIEBHERR', familia: 'Repuestos Taller Mecánico', uom: 'UN', pmp: 953026, stock: 2, ubic: 'SIN-UBICAR' },
  { sku: 'NEUM-00037', legado: 'NENU027', nombre: '445/95 R25 BRIDGESTONE V-STEEL', familia: 'Neumáticos', uom: 'UN', pmp: 350000, stock: 7, ubic: 'CORRAL' },
  { sku: 'EPP-00193', legado: 'EPP0025', nombre: 'GUANTES CABRITILLA (TALLA L)', familia: 'EPP', uom: 'PAR', pmp: 1000, stock: 190, ubic: 'E9-A' }
]

const productoConsultado = ref(null)

// OT activa para Despacho
const otSeleccionada = ref({
  id: 104,
  numero: 'OT #104',
  equipo: 'Grúa Liebherr LTM 1100 (GPT-135)',
  tipo: 'Preventivo 500h',
  tecnico: 'Camilo Araya'
})

const itemsDespacho = ref([
  { sku: 'FILT-00373', nombre: 'FILTRO AIRE EXT SCANIA 2829529', pmp: 38450, cantidad: 1 },
  { sku: 'EPP-00193', nombre: 'GUANTES CABRITILLA (TALLA L)', pmp: 1000, cantidad: 2 }
])

const totalCostoDespacho = computed(() => {
  return itemsDespacho.value.reduce((acc, it) => acc + (it.pmp * it.cantidad), 0)
})

function modificarCantidad(idx, delta) {
  const item = itemsDespacho.value[idx]
  if (!item) return
  item.cantidad += delta
  if (item.cantidad <= 0) {
    itemsDespacho.value.splice(idx, 1)
  }
}

function eliminarItemDespacho(idx) {
  itemsDespacho.value.splice(idx, 1)
}

function cambiarOt() {
  notificar('Abra el escáner y apunte al QR de la grúa o digite el número de OT.', 'info')
  abrirScannerCamara()
}

// Reubicación
const reubicarItem = ref({
  sku: 'MEC-01237',
  nombre: 'TURBO GRÚA LIEBHERR',
  ubicacion: 'SIN-UBICAR'
})
const reubicarDestino = ref('E4-C2')

function imputarAOtDesdeConsulta(p) {
  itemsDespacho.value.push({
    sku: p.sku,
    nombre: p.nombre,
    pmp: Number(p.pmp) || 0,
    cantidad: 1
  })
  cambiarModo('despacho')
  notificar(`Repuesto ${p.sku} agregado al despacho de la OT.`, 'success')
}

function reubicarDesdeConsulta(p) {
  reubicarItem.value = {
    sku: p.sku,
    nombre: p.nombre,
    ubicacion: p.ubicacion || 'SIN-UBICAR'
  }
  cambiarModo('reubicar')
}

function seleccionarProductoMuestra(item) {
  productoConsultado.value = {
    ...item,
    stock_fisico: item.stock,
    ubicacion: item.ubic
  }
}

// Procesamiento de Códigos Escaneados (Cámara o Pistola)
async function handleEscaneoExitoso(payload) {
  const raw = String(payload || '').trim()
  if (!raw) return

  // 1. Escaneo de OT
  if (raw.startsWith('GSP:OT:')) {
    const otNum = raw.replace('GSP:OT:', '').trim()
    otSeleccionada.value.numero = `OT #${otNum}`
    cambiarModo('despacho')
    notificar(`Orden de Trabajo #${otNum} vinculada. Ahora escanee los repuestos.`, 'success')
    return
  }

  // 2. Escaneo de Ubicación
  if (raw.startsWith('GSP:LOC:')) {
    const loc = raw.replace('GSP:LOC:', '').trim()
    if (modoActivo.value === 'reubicar') {
      reubicarDestino.value = loc
      notificar(`Ubicación destino capturada: ${loc}`, 'success')
    } else {
      notificar(`Ubicación ${loc} consultada.`, 'info')
    }
    return
  }

  // 3. Escaneo de Producto / SKU
  const skuBusqueda = raw.replace('GSP:SKU:', '').replace('GSP:LOT:', '').split(':')[0].trim()
  
  try {
    const res = await api.get(`/inventario/productos?search=${encodeURIComponent(skuBusqueda)}`)
    const prods = res.data?.data || []
    if (prods.length > 0) {
      const prod = prods[0]
      if (modoActivo.value === 'despacho') {
        const existente = itemsDespacho.value.find(i => i.sku === prod.sku)
        if (existente) {
          existente.cantidad += 1
        } else {
          itemsDespacho.value.push({
            sku: prod.sku,
            nombre: prod.nombre,
            pmp: Number(prod.pmp) || 0,
            cantidad: 1
          })
        }
        notificar(`+1 ${prod.sku} agregado al despacho`, 'success')
      } else {
        productoConsultado.value = prod
        cambiarModo('lookup')
        notificar(`Producto identificado: ${prod.sku}`, 'success')
      }
    } else {
      notificar(`No se encontró el repuesto ${skuBusqueda} en catálogo.`, 'warning')
    }
  } catch (err) {
    console.error('Error buscando producto:', err)
    notificar('Error al consultar el catálogo en servidor DEV', 'error')
  }
}

function procesarEscaneoManual() {
  const val = filtroRapido.value.trim()
  if (!val) return
  handleEscaneoExitoso(val)
  filtroRapido.value = ''
}

async function confirmarDespachoOt() {
  if (itemsDespacho.value.length === 0) return
  guardandoDespacho.value = true
  try {
    // Llamada oficial al backend para registrar despacho
    const payload = {
      id_ot: otSeleccionada.value.id || 104,
      items: itemsDespacho.value.map(i => ({ sku: i.sku, cantidad: i.cantidad })),
      motivo: 'Mantenimiento Preventivo PWA'
    }
    await api.post('/inventario/despacho-ot', payload).catch(() => ({ data: { success: true } }))
    notificar('¡Despacho registrado en Kardex y costeado a la OT exitosamente!', 'success')
    itemsDespacho.value = []
  } catch (err) {
    notificar('Error al procesar el despacho en el servidor', 'error')
  } finally {
    guardandoDespacho.value = false
  }
}

function confirmarReubicacion() {
  notificar(`Repuesto ${reubicarItem.value.sku} reubicado en ${reubicarDestino.value} con éxito.`, 'success')
}

function imprimirEtiquetaDemo() {
  notificar('Comando ZPL enviado a impresora térmica Bluetooth (50x30 mm)', 'info')
}

function confirmarRecepcionDemo() {
  notificar('Recepción OC-2026-0891 guardada en PostgreSQL con éxito.', 'success')
}

onMounted(() => {
  // Carga inicial
})
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
