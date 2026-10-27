<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- ENCABEZADO CANÓNICO WMS -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/5">
            <Download class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">Recepción & Ingreso de Materiales</h1>
              <span class="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded border border-emerald-500/20">
                WMS Inbound
              </span>
              <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20 font-mono">
                Almacén Central
              </span>
            </div>
            <p class="text-slate-400 text-xs mt-0.5">
              Control de entradas físicas, recepción contra Orden de Compra (OC), imputación automática al Kardex y rotulación de repuestos en andén
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <router-link
          :to="{ name: 'inventario_bodegas' }"
          class="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
        >
          <Warehouse class="w-4 h-4" /> Ver Mapa de Racks
        </router-link>
        <router-link
          :to="{ name: 'compras_oc' }"
          class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
        >
          <ShoppingCart class="w-4 h-4 text-amber-400" /> Órdenes de Compra
        </router-link>
      </div>
    </div>

    <!-- TARJETAS DE INDICADORES (KPIS SUPERIORES DEL ANDÉN) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider">
          <span>OCs para Recepción</span>
          <ShoppingCart class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-2xl font-black text-amber-400 font-mono mt-1.5">{{ ordenesPendientes.length }}</div>
        <div class="text-[11px] text-slate-500 mt-0.5">Aprobadas / En curso</div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider">
          <span>Recepciones Registradas</span>
          <CheckCircle2 class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="text-2xl font-black text-white font-mono mt-1.5">{{ historialRecepciones.length }}</div>
        <div class="text-[11px] text-slate-500 mt-0.5">Entradas confirmadas</div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider">
          <span>Unidades Recibidas</span>
          <Boxes class="w-4 h-4 text-cyan-400" />
        </div>
        <div class="text-2xl font-black text-cyan-400 font-mono mt-1.5">{{ totalUnidadesRecibidas }} UN</div>
        <div class="text-[11px] text-slate-500 mt-0.5">Ingresadas a stock físico</div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider">
          <span>Valorización Ingresos</span>
          <DollarSign class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="text-2xl font-black text-emerald-400 font-mono mt-1.5">
          ${{ Math.round(totalValorizadoRecibido).toLocaleString('es-CL') }}
        </div>
        <div class="text-[11px] text-slate-500 mt-0.5">Imputación a Kardex</div>
      </div>
    </div>

    <!-- PESTAÑAS PRINCIPALES DE LA VISTA -->
    <div class="flex gap-2 mb-6 border-b border-slate-800/80 pb-3">
      <button
        @click="activeTab = 'nueva'"
        :class="[
          'px-4 py-2 font-black text-xs rounded-xl uppercase tracking-wider transition-all flex items-center gap-2',
          activeTab === 'nueva' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        <Download class="w-4 h-4" /> 1. Nueva Recepción en Andén
      </button>
      <button
        @click="activeTab = 'historial'"
        :class="[
          'px-4 py-2 font-black text-xs rounded-xl uppercase tracking-wider transition-all flex items-center gap-2',
          activeTab === 'historial' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        <History class="w-4 h-4" /> 2. Historial de Entradas & Kardex ({{ historialRecepciones.length }})
      </button>
    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 1: FORMULARIO GUIADO DE NUEVA RECEPCIÓN                       -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'nueva'" class="space-y-6">
      <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <!-- PASO 1: SELECCIÓN DE ORIGEN (CON OC VS MANUAL) -->
        <div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
            <div>
              <div class="text-xs font-black uppercase text-amber-400 font-mono tracking-wider">
                Paso 1: Origen de la Mercadería
              </div>
              <h2 class="text-base font-black text-white font-mono mt-0.5">
                Seleccione Orden de Compra oficial o Compra en Terreno / Ingreso Directo por Proveedor
              </h2>
            </div>

            <!-- Selector de Modo de Recepción -->
            <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                @click="modoRecepcion = 'CON_OC'"
                :class="[
                  'px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5',
                  modoRecepcion === 'CON_OC' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                ]"
              >
                <ShoppingCart class="w-3.5 h-3.5" /> Con Orden de Compra (OC)
              </button>
              <button
                @click="modoRecepcion = 'DIRECTO'"
                :class="[
                  'px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5',
                  modoRecepcion === 'DIRECTO' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                ]"
              >
                <Boxes class="w-3.5 h-3.5" /> Compra en Terreno / Proveedor Directo
              </button>
            </div>
          </div>

          <!-- MODO A: CON ORDEN DE COMPRA -->
          <div v-if="modoRecepcion === 'CON_OC'" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div class="md:col-span-2">
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-slate-400 font-bold uppercase">
                    Seleccionar Orden de Compra Aprobada <span class="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    @click="modoRecepcion = 'DIRECTO'"
                    class="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
                  >
                    ¿Compra en terreno sin OC? Ingresar por Proveedor Directo →
                  </button>
                </div>
                <select
                  v-model="selectedOcId"
                  @change="cargarDatosOc"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:border-amber-500 outline-none"
                >
                  <option :value="null">-- Seleccione una Orden de Compra para recepcionar --</option>
                  <option v-for="oc in ordenesPendientes" :key="oc.id_oc" :value="oc.id_oc">
                    {{ oc.folio_oc }} · {{ oc.razon_social_proveedor || oc.rut_proveedor }} · Total: ${{ Number(oc.monto_total_bruto || oc.monto_neto || 0).toLocaleString('es-CL') }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-bold uppercase">Bodega de Destino *</label>
                <select
                  v-model="formHeader.idBodega"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-medium"
                >
                  <option v-for="b in bodegas" :key="b.id" :value="b.id">{{ b.nombre }}</option>
                </select>
              </div>
            </div>

            <!-- Ficha contextual de la OC seleccionada -->
            <div v-if="selectedOcData" class="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <div class="text-[10px] text-slate-500 font-bold uppercase">Proveedor</div>
                <div class="font-bold text-white mt-0.5">{{ selectedOcData.razon_social_proveedor }}</div>
                <div class="font-mono text-[11px] text-slate-400">{{ selectedOcData.rut_proveedor }}</div>
              </div>
              <div>
                <div class="text-[10px] text-slate-500 font-bold uppercase">Empresa Emisora</div>
                <div class="font-bold text-amber-400 mt-0.5">{{ selectedOcData.empresa_info?.nombre || 'Grúas San Pablo' }}</div>
              </div>
              <div>
                <div class="text-[10px] text-slate-500 font-bold uppercase">Fecha de Emisión</div>
                <div class="font-mono text-white mt-0.5">{{ selectedOcData.fecha_oc ? new Date(selectedOcData.fecha_oc).toLocaleDateString('es-CL') : '—' }}</div>
              </div>
              <div>
                <div class="text-[10px] text-slate-500 font-bold uppercase">Estado OC</div>
                <span class="inline-block mt-0.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black text-[10px]">
                  {{ selectedOcData.estado_oc }}
                </span>
              </div>
            </div>
          </div>

          <!-- MODO B: INGRESO DIRECTO / DEVOLUCIÓN -->
          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label class="block text-slate-400 mb-1 font-bold uppercase">Tipo de Entrada *</label>
                <select
                  v-model="tipoIngresoDirecto"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-medium"
                >
                  <option value="COMPRA_DIRECTA">Compra Local / Terreno</option>
                  <option value="DEVOLUCION_OT">Devolución desde OT de Taller</option>
                  <option value="GARANTIA">Reposición por Garantía Proveedor</option>
                  <option value="CARGA_INICIAL">Ajuste / Carga Inicial de Stock</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-bold uppercase">Proveedor / Origen *</label>
                <input
                  v-model="formHeader.proveedor"
                  type="text"
                  placeholder="Ej: Distribuidora Hidráulica Sur"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-bold uppercase">Folio de Referencia *</label>
                <input
                  v-model="formHeader.docReferencia"
                  type="text"
                  placeholder="Ej: FACT-10492 o OT-16"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-bold uppercase">Bodega de Destino *</label>
                <select
                  v-model="formHeader.idBodega"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-medium"
                >
                  <option v-for="b in bodegas" :key="b.id" :value="b.id">{{ b.nombre }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- PASO 2: DOCUMENTOS DE DESPACHO Y FACTURACIÓN -->
        <div class="pt-4 border-t border-slate-800">
          <div class="text-xs font-black uppercase text-amber-400 font-mono tracking-wider mb-2">
            Paso 2: Documentos de Respaldo Físico del Transportista
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">N° Guía de Despacho del Proveedor</label>
              <input
                v-model="formHeader.guiaDespacho"
                type="text"
                placeholder="Ej: GD-88219"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">N° Factura Comercial / DTE</label>
              <input
                v-model="formHeader.factura"
                type="text"
                placeholder="Ej: FAC-120554"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-bold uppercase">Observaciones en Andén</label>
              <input
                v-model="formHeader.observaciones"
                type="text"
                placeholder="Ej: Bultos recibidos en perfecto estado, embalaje sellado"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        <!-- PASO 3: LÍNEAS DE REPUESTOS A RECEPCIONAR -->
        <div class="pt-4 border-t border-slate-800 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="text-xs font-black uppercase text-amber-400 font-mono tracking-wider">
                Paso 3: Detalle de Repuestos, Cantidades & Casillero de Destino
              </div>
              <p class="text-slate-400 text-xs mt-0.5">
                Valide las cantidades físicas descargadas y asigne el casillero en estantería para cada repuesto
              </p>
            </div>

            <button
              @click="agregarLineaManual"
              class="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Plus class="w-3.5 h-3.5" /> + Agregar Repuesto
            </button>
          </div>

          <!-- Tabla de Líneas a Recepcionar -->
          <div class="overflow-x-auto bg-slate-950/80 border border-slate-800 rounded-2xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                  <th class="p-3.5">Repuesto / SKU</th>
                  <th class="p-3.5 text-center">Unidad</th>
                  <th v-if="modoRecepcion === 'CON_OC'" class="p-3.5 text-right">Cant. OC</th>
                  <th class="p-3.5 text-right">Cant. a Ingresar</th>
                  <th class="p-3.5 text-right">Costo Unit. PMP</th>
                  <th class="p-3.5 text-right">Subtotal Neto</th>
                  <th class="p-3.5">Casillero de Destino</th>
                  <th class="p-3.5">Lote / N° Serie</th>
                  <th class="p-3.5 text-center"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono">
                <tr v-for="(linea, idx) in lineasRecepcion" :key="idx" class="hover:bg-slate-900/40">
                  <!-- Selector / Buscador Predictivo de Repuesto -->
                  <td class="p-3.5 font-sans min-w-[320px]">
                    <div v-if="linea.nombre" class="flex items-start justify-between gap-2 bg-slate-900/70 border border-slate-800 rounded-xl p-2.5">
                      <div>
                        <div class="font-bold text-white text-xs leading-snug">
                          {{ linea.nombre }}
                        </div>
                        <div class="text-[11px] font-mono text-amber-400 font-bold mt-0.5">
                          {{ linea.sku || 'SKU pendiente' }}
                        </div>
                      </div>
                      <button
                        type="button"
                        @click="limpiarProductoLinea(linea)"
                        class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-[10px] font-bold shrink-0 transition-colors"
                        title="Cambiar repuesto seleccionado"
                      >
                        Cambiar
                      </button>
                    </div>

                    <!-- Buscador predictivo si aún no se ha seleccionado producto -->
                    <div v-else class="space-y-1.5">
                      <div class="relative">
                        <input
                          v-model="linea.busquedaProducto"
                          type="text"
                          @focus="linea.mostrarSugerencias = true"
                          placeholder="🔍 Buscar por nombre, SKU o familia (ej: filtro, perno)..."
                          class="w-full bg-slate-900 border border-amber-500/40 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                        />
                        <button
                          v-if="linea.busquedaProducto"
                          type="button"
                          @click="linea.busquedaProducto = ''"
                          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      <div class="bg-slate-900 border border-slate-800 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-800/70 shadow-inner">
                        <div
                          v-for="p in filtrarCatalogoLinea(linea.busquedaProducto)"
                          :key="p.id"
                          @click="seleccionarProductoCatalogo(linea, p)"
                          class="px-3 py-2 hover:bg-amber-500/15 cursor-pointer transition-colors flex items-center justify-between gap-2"
                        >
                          <div class="min-w-0">
                            <div class="text-xs font-bold text-white truncate">{{ p.nombre }}</div>
                            <div class="text-[10px] font-mono text-amber-400 flex items-center gap-2">
                              <span>[{{ p.sku }}]</span>
                              <span v-if="p.familia" class="text-slate-400">· {{ p.familia }}</span>
                            </div>
                          </div>
                          <div class="text-right shrink-0 font-mono">
                            <div class="text-[10px] text-emerald-400 font-bold">Stock: {{ p.stock ?? 0 }} {{ p.uom || 'UN' }}</div>
                            <div v-if="Number(p.pmp || 0) > 0" class="text-[10px] text-slate-400">${{ Math.round(Number(p.pmp)).toLocaleString('es-CL') }}</div>
                          </div>
                        </div>
                        <div
                          v-if="filtrarCatalogoLinea(linea.busquedaProducto).length === 0"
                          class="p-3 text-center text-[11px] text-slate-500"
                        >
                          No se encontraron repuestos para "{{ linea.busquedaProducto }}"
                        </div>
                      </div>
                      <div class="text-[10px] text-slate-500 flex items-center justify-between px-1">
                        <span>Mostrando {{ filtrarCatalogoLinea(linea.busquedaProducto).length }} de {{ catalogoCompleto.length }} ítems</span>
                        <span class="text-amber-400/80">Haga clic en un ítem para seleccionarlo</span>
                      </div>
                    </div>
                  </td>

                  <!-- Unidad de Medida -->
                  <td class="p-3.5 text-center">
                    <span class="px-2 py-0.5 bg-slate-900 text-slate-300 rounded text-[11px] font-bold border border-slate-800">
                      {{ linea.uom || 'UN' }}
                    </span>
                  </td>

                  <!-- Cantidad OC (si aplica) -->
                  <td v-if="modoRecepcion === 'CON_OC'" class="p-3.5 text-right text-slate-400 font-bold">
                    {{ linea.cantidad_pedida || '—' }}
                  </td>

                  <!-- Cantidad a Ingresar -->
                  <td class="p-3.5 text-right">
                    <input
                      v-model.number="linea.cantidad_recibida"
                      type="number"
                      min="1"
                      class="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-xs focus:border-amber-500 outline-none"
                    />
                  </td>

                  <!-- Costo Unitario -->
                  <td class="p-3.5 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <span class="text-slate-500">$</span>
                      <input
                        v-model.number="linea.costo_unitario"
                        type="number"
                        min="0"
                        class="w-24 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-right text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </td>

                  <!-- Subtotal Neto -->
                  <td class="p-3.5 text-right font-black text-emerald-400">
                    ${{ Math.round((Number(linea.cantidad_recibida) || 0) * (Number(linea.costo_unitario) || 0)).toLocaleString('es-CL') }}
                  </td>

                  <!-- Casillero / Ubicación Destino -->
                  <td class="p-3.5">
                    <select
                      v-model="linea.id_ubicacion"
                      class="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs w-40 focus:border-amber-500 outline-none"
                    >
                      <option v-for="u in ubicaciones" :key="u.id" :value="u.id">
                        📍 {{ u.codigo }}
                      </option>
                    </select>
                  </td>

                  <!-- Lote o Serie -->
                  <td class="p-3.5">
                    <input
                      v-model="linea.lote_serie"
                      type="text"
                      placeholder="Opcional"
                      class="w-28 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-mono outline-none"
                    />
                  </td>

                  <!-- Eliminar Línea -->
                  <td class="p-3.5 text-center">
                    <button
                      v-if="lineasRecepcion.length > 1"
                      @click="lineasRecepcion.splice(idx, 1)"
                      class="text-slate-500 hover:text-rose-400 font-bold p-1 rounded hover:bg-slate-800 transition-colors"
                      title="Quitar línea"
                    >
                      ✕
                    </button>
                  </td>
                </tr>

                <tr v-if="lineasRecepcion.length === 0">
                  <td colspan="9" class="p-8 text-center text-slate-500 italic font-sans">
                    No hay líneas de repuestos agregadas. Seleccione una Orden de Compra o agregue una línea manual.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- PASO 4: TOTALES Y CONFIRMACIÓN DE ENTRADA -->
        <div class="pt-4 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-6 text-xs font-mono">
            <div>
              <span class="text-slate-400">Total Ítems:</span>
              <strong class="text-white font-bold ml-1.5">{{ lineasRecepcion.length }} repuestos</strong>
            </div>
            <div>
              <span class="text-slate-400">Total Unidades:</span>
              <strong class="text-amber-400 font-bold ml-1.5">{{ sumaUnidadesFormulario }} UN</strong>
            </div>
            <div>
              <span class="text-slate-400">Monto Neto a Imputar:</span>
              <strong class="text-emerald-400 font-bold text-sm ml-1.5">${{ Math.round(sumaMontoNetoFormulario).toLocaleString('es-CL') }}</strong>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="limpiarFormulario"
              class="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
            >
              Limpiar
            </button>
            <button
              @click="confirmarRecepcion"
              :disabled="isSubmitting || lineasRecepcion.length === 0"
              class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Download class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Procesando Entrada...' : 'Confirmar Entrada & Generar Etiquetas' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 2: HISTORIAL DE ENTRADAS & KARDEX DE RECEPCIÓN                -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'historial'" class="space-y-4">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div class="flex items-center gap-3">
          <input
            v-model="filtroHistorial"
            type="text"
            placeholder="Buscar por SKU, repuesto o documento…"
            class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white w-72 focus:border-amber-500 outline-none font-mono"
          />
          <span class="text-xs text-slate-400 font-mono">
            Mostrando {{ historialFiltrado.length }} movimientos de entrada
          </span>
        </div>

        <button
          @click="loadHistorialKardex"
          class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
        >
          🔄 Actualizar Historial
        </button>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                <th class="p-3.5">Fecha & Hora</th>
                <th class="p-3.5">Tipo Operación</th>
                <th class="p-3.5">Documento / Folio</th>
                <th class="p-3.5">SKU Canónico</th>
                <th class="p-3.5">Repuesto / Producto</th>
                <th class="p-3.5">Casillero</th>
                <th class="p-3.5 text-right">Cant. Ingresada</th>
                <th class="p-3.5 text-right">Costo Unit. PMP</th>
                <th class="p-3.5 text-right">Valor Total</th>
                <th class="p-3.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono font-medium">
              <tr v-for="h in historialFiltrado" :key="h.id" class="hover:bg-slate-800/40">
                <td class="p-3.5 text-slate-400">
                  {{ h.fecha_movimiento ? new Date(h.fecha_movimiento).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—' }}
                </td>
                <td class="p-3.5">
                  <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {{ h.tipo_movimiento }}
                  </span>
                </td>
                <td class="p-3.5 text-white font-bold">{{ h.documento_folio || h.documento_tipo || '—' }}</td>
                <td class="p-3.5 text-amber-400 font-bold">{{ h.sku }}</td>
                <td class="p-3.5 font-sans font-semibold text-white">{{ h.producto_nombre }}</td>
                <td class="p-3.5 text-slate-300">📍 {{ h.ubicacion_codigo || 'Bodega' }}</td>
                <td class="p-3.5 text-right font-black text-emerald-400">
                  +{{ h.cantidad }} {{ h.uom || 'UN' }}
                </td>
                <td class="p-3.5 text-right text-slate-300">
                  ${{ Math.round(Number(h.costo_unitario || 0)).toLocaleString('es-CL') }}
                </td>
                <td class="p-3.5 text-right font-black text-emerald-400">
                  ${{ Math.round(Number(h.costo_total || (h.cantidad * (h.costo_unitario || 0)))).toLocaleString('es-CL') }}
                </td>
                <td class="p-3.5 text-center" @click.stop>
                  <button
                    @click="imprimirEtiquetaRepuesto(h.sku, h.producto_nombre, h.costo_unitario, h.uom)"
                    class="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-2 py-1 rounded text-[10px] border border-slate-700 flex items-center gap-1 transition-all mx-auto"
                    title="Reimprimir etiqueta adhesiva de este repuesto"
                  >
                    <Tag class="w-3 h-3" /> QR SKU
                  </button>
                </td>
              </tr>
              <tr v-if="historialFiltrado.length === 0">
                <td colspan="10" class="p-8 text-center text-slate-500 italic font-sans">
                  No se registran movimientos de recepción en el Kardex.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL POST-RECEPCIÓN: CONFIRMACIÓN Y EMISIÓN DE ETIQUETAS TÉRMICAS    -->
    <!-- ===================================================================== -->
    <div
      v-if="showSuccessModal"
      class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5 text-center">
        <div class="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 class="w-8 h-8" />
        </div>

        <div>
          <h2 class="text-xl font-black text-white uppercase font-mono">¡Entrada Confirmada Exitosamente!</h2>
          <div class="text-xs text-amber-400 font-mono font-bold mt-1">Folio Oficial: {{ lastRecepcionResult?.numero_folio || lastRecepcionResult?.folio || 'REC-WMS' }}</div>
          <p class="text-slate-400 text-xs mt-2 leading-relaxed">
            Los repuestos han sido imputados al Kardex inmutable (<code>tinv_movimiento</code>), los stocks físicos actualizados en las estanterías correspondientes y el PMP recalculado de forma automática.
          </p>
        </div>

        <!-- Botones de Acción Inmediata -->
        <div class="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            @click="imprimirEtiquetasLote"
            class="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Printer class="w-4 h-4" /> Imprimir Etiquetas Adhesivas (50×30 mm)
          </button>
          <button
            @click="cerrarModalExito"
            class="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            Cerrar y Continuar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Download, 
  Warehouse, 
  ShoppingCart, 
  CheckCircle2, 
  Boxes, 
  DollarSign, 
  History, 
  Plus, 
  Tag, 
  Printer 
} from 'lucide-vue-next'
import apiAxios from '../../services/api'

// Pestaña activa
const activeTab = ref('nueva')
const modoRecepcion = ref('CON_OC') // 'CON_OC' | 'DIRECTO'
const tipoIngresoDirecto = ref('COMPRA_DIRECTA')
const filtroHistorial = ref('')

// Estado reactivo de datos
const ordenesPendientes = ref([])
const bodegas = ref([
  { id: 1, nombre: 'Bodega Taller Central' },
  { id: 2, nombre: 'Bodega Faena Antofagasta' },
  { id: 3, nombre: 'Bodega Taller Móvil San Bernardo' }
])
const ubicaciones = ref([])
const catalogoCompleto = ref([])
const historialRecepciones = ref([])

// Formulario Cabecera
const selectedOcId = ref(null)
const selectedOcData = ref(null)
const formHeader = ref({
  docReferencia: '',
  proveedor: '',
  guiaDespacho: '',
  factura: '',
  idBodega: 1,
  observaciones: ''
})

// Líneas de Recepción
const lineasRecepcion = ref([])
const isSubmitting = ref(false)

// Modal de éxito
const showSuccessModal = ref(false)
const lastRecepcionResult = ref(null)
const repuestosParaEtiquetar = ref([])

// Cálculos reactivos
const sumaUnidadesFormulario = computed(() => {
  return lineasRecepcion.value.reduce((acc, l) => acc + (Number(l.cantidad_recibida) || 0), 0)
})

const sumaMontoNetoFormulario = computed(() => {
  return lineasRecepcion.value.reduce((acc, l) => acc + ((Number(l.cantidad_recibida) || 0) * (Number(l.costo_unitario) || 0)), 0)
})

const totalUnidadesRecibidas = computed(() => {
  return historialRecepciones.value.reduce((acc, h) => acc + Number(h.cantidad || 0), 0)
})

const totalValorizadoRecibido = computed(() => {
  return historialRecepciones.value.reduce((acc, h) => acc + (Number(h.costo_total) || (Number(h.cantidad || 0) * Number(h.costo_unitario || 0))), 0)
})

const historialFiltrado = computed(() => {
  if (!filtroHistorial.value.trim()) return historialRecepciones.value
  const q = filtroHistorial.value.toLowerCase()
  return historialRecepciones.value.filter(h =>
    (h.sku && h.sku.toLowerCase().includes(q)) ||
    (h.producto_nombre && h.producto_nombre.toLowerCase().includes(q)) ||
    (h.documento_folio && h.documento_folio.toLowerCase().includes(q))
  )
})

// Cargar datos de la OC seleccionada
const cargarDatosOc = async () => {
  if (!selectedOcId.value) {
    selectedOcData.value = null
    lineasRecepcion.value = []
    return
  }

  const oc = ordenesPendientes.value.find(o => o.id_oc === selectedOcId.value)
  if (!oc) return

  selectedOcData.value = oc
  formHeader.value.docReferencia = oc.folio_oc
  formHeader.value.proveedor = oc.razon_social_proveedor || oc.rut_proveedor

  // Cargar líneas de la OC
  try {
    const res = await apiAxios.get(`/compras/ordenes/${oc.id_oc}`)
    const fullOc = res.data?.orden || oc
    const lineas = Array.isArray(fullOc.lineas) ? fullOc.lineas : []

    lineasRecepcion.value = lineas.map(lin => {
      // Buscar producto en catálogo para obtener SKU y ubicación sugerida
      const p = catalogoCompleto.value.find(prod => prod.id === lin.id_producto || prod.sku === lin.codigo_item)
      return {
        id_producto: lin.id_producto || p?.id || null,
        sku: p?.sku || lin.codigo_item || 'GSP-REP',
        nombre: lin.descripcion || p?.nombre || 'Repuesto',
        uom: lin.unidad_medida || p?.uom || 'UN',
        cantidad_pedida: Number(lin.cantidad) || 1,
        cantidad_recibida: Number(lin.cantidad) || 1,
        costo_unitario: Number(lin.precio_unitario) || 0,
        id_ubicacion: ubicaciones.value[0]?.id || 1,
        lote_serie: ''
      }
    })

    if (lineasRecepcion.value.length === 0) {
      agregarLineaManual()
    }
  } catch (err) {
    console.error('Error cargando detalle de OC:', err)
    agregarLineaManual()
  }
}

// Agregar línea manual
const agregarLineaManual = () => {
  lineasRecepcion.value.push({
    id_producto: null,
    sku: '',
    nombre: '',
    uom: 'UN',
    cantidad_pedida: 1,
    cantidad_recibida: 1,
    costo_unitario: 0,
    id_ubicacion: ubicaciones.value[0]?.id || 1,
    lote_serie: '',
    busquedaProducto: '',
    mostrarSugerencias: false
  })
}

// Filtrar catálogo por término de búsqueda (SKU, nombre o familia)
const filtrarCatalogoLinea = (termino) => {
  const q = String(termino || '').trim().toLowerCase()
  if (!q) {
    return catalogoCompleto.value.slice(0, 40)
  }
  const tokens = q.split(/\s+/).filter(Boolean)
  return catalogoCompleto.value
    .filter(p => {
      const target = `${p.sku || ''} ${p.nombre || ''} ${p.familia || ''}`.toLowerCase()
      return tokens.every(tok => target.includes(tok))
    })
    .slice(0, 50)
}

// Seleccionar un producto del buscador predictivo
const seleccionarProductoCatalogo = (linea, p) => {
  if (!p) return
  linea.id_producto = p.id
  linea.sku = p.sku
  linea.nombre = p.nombre
  linea.uom = p.uom || p.unidad_medida_base || 'UN'
  linea.costo_unitario = Math.round(Number(p.pmp || p.costo_pmp_vigente || 0))
  linea.busquedaProducto = ''
  linea.mostrarSugerencias = false
}

// Permitir cambiar un producto ya seleccionado en una fila
const limpiarProductoLinea = (linea) => {
  linea.id_producto = null
  linea.sku = ''
  linea.nombre = ''
  linea.busquedaProducto = ''
  linea.mostrarSugerencias = true
}

// Manejar selección de producto en línea manual
const onSelectProducto = (linea) => {
  const p = catalogoCompleto.value.find(prod => prod.id === linea.id_producto)
  if (p) {
    seleccionarProductoCatalogo(linea, p)
  }
}

// Limpiar formulario
const limpiarFormulario = () => {
  selectedOcId.value = null
  selectedOcData.value = null
  formHeader.value = {
    docReferencia: '',
    proveedor: '',
    guiaDespacho: '',
    factura: '',
    idBodega: 1,
    observaciones: ''
  }
  lineasRecepcion.value = []
  agregarLineaManual()
}

// Confirmar recepción en backend
const confirmarRecepcion = async () => {
  const docRef = modoRecepcion.value === 'CON_OC' 
    ? (selectedOcData.value?.folio_oc || formHeader.value.docReferencia)
    : formHeader.value.docReferencia

  if (!docRef) {
    alert('Debe especificar el documento o folio de referencia de la recepción.')
    return
  }

  const lineasValidas = lineasRecepcion.value.filter(l => l.id_producto && Number(l.cantidad_recibida) > 0)
  if (lineasValidas.length === 0) {
    alert('Debe incluir al menos un repuesto con cantidad válida.')
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      tipo_ingreso: modoRecepcion.value === 'CON_OC' ? 'COMPRA' : tipoIngresoDirecto.value,
      documento_referencia: docRef,
      proveedor_o_origen: formHeader.value.proveedor || selectedOcData.value?.razon_social_proveedor || 'Proveedor General',
      id_bodega: formHeader.value.idBodega,
      lineas: lineasValidas.map(l => ({
        id_producto: l.id_producto,
        cantidad_recibida: Number(l.cantidad_recibida),
        factor_conversion: 1,
        costo_unitario_moneda: Number(l.costo_unitario),
        id_ubicacion_destino: l.id_ubicacion,
        lote_texto: l.lote_serie || (formHeader.value.guiaDespacho ? `GD:${formHeader.value.guiaDespacho}` : null),
        serie_texto: null
      }))
    }

    const res = await apiAxios.post('/inventario/recepciones', payload)
    if (res.data?.success) {
      lastRecepcionResult.value = res.data.data
      repuestosParaEtiquetar.value = [...lineasValidas]
      showSuccessModal.value = true
      loadHistorialKardex()
    }
  } catch (err) {
    console.error('Error al confirmar recepción:', err)
    alert('Error al confirmar recepción: ' + (err.response?.data?.error || err.message))
  } finally {
    isSubmitting.value = false
  }
}

const cerrarModalExito = () => {
  showSuccessModal.value = false
  limpiarFormulario()
}

// Generador de QR SVG
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
const imprimirEtiquetaRepuesto = (sku, nombre, pmp, uom) => {
  const svg = qrSvg(`SKU:${sku || 'SKU'}`, 60)
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
          <div class="pmp">PMP: $${Math.round(Number(pmp || 0)).toLocaleString('es-CL')} / ${uom || 'UN'}</div>
        </div>
      </body>
    </html>
  `)
  win.document.close()
}

// Impresión en lote de las etiquetas de la recepción confirmada
const imprimirEtiquetasLote = () => {
  if (repuestosParaEtiquetar.value.length === 0) return
  const win = window.open('', '_blank', 'width=500,height=600')
  if (!win) {
    alert('Por favor permita ventanas emergentes para imprimir las etiquetas.')
    return
  }

  let htmlLabels = ''
  for (const item of repuestosParaEtiquetar.value) {
    const qty = Math.max(1, Math.min(20, Math.round(Number(item.cantidad_recibida) || 1)))
    const svg = qrSvg(`SKU:${item.sku || 'SKU'}`, 55)
    for (let i = 0; i < qty; i++) {
      htmlLabels += `
        <div class="label-page">
          <div class="qr">${svg}</div>
          <div class="info">
            <div class="brand">GRÚAS SAN PABLO · WMS</div>
            <div class="sku">${item.sku}</div>
            <div class="nom">${item.nombre}</div>
            <div class="pmp">PMP: $${Math.round(Number(item.costo_unitario || 0)).toLocaleString('es-CL')} / ${item.uom || 'UN'}</div>
          </div>
        </div>
      `
    }
  }

  win.document.write(`
    <html>
      <head>
        <title>Etiquetas Lote Recepción</title>
        <style>
          @page { size: 50mm 30mm; margin: 0; }
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, monospace; }
          .label-page { page-break-after: always; padding: 2.5mm; display: flex; align-items: center; gap: 8px; width: 45mm; height: 25mm; box-sizing: border-box; }
          .qr { width: 50px; height: 50px; flex-shrink: 0; }
          .info { flex: 1; font-size: 8px; line-height: 1.15; overflow: hidden; min-width: 0; }
          .brand { font-size: 7px; font-weight: 900; letter-spacing: 0.5px; border-bottom: 1px solid #000; padding-bottom: 1.5px; text-transform: uppercase; }
          .sku { font-size: 11px; font-weight: 900; margin-top: 2px; font-family: monospace; }
          .nom { font-size: 8px; font-weight: 700; margin-top: 1.5px; white-space: normal; overflow: hidden; }
          .pmp { font-size: 8px; font-weight: 900; margin-top: 2px; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        ${htmlLabels}
      </body>
    </html>
  `)
  win.document.close()
}

// Carga de historial de Kardex
const loadHistorialKardex = async () => {
  try {
    const res = await apiAxios.get('/inventario/kardex', { params: { limit: 100 } })
    const data = res.data?.data || res.data?.movimientos || []
    if (Array.isArray(data)) {
      // Filtrar movimientos de entrada / recepciones
      historialRecepciones.value = data.filter(m => 
        m.tipo_movimiento?.includes('RECEPCION') || 
        m.tipo_movimiento?.includes('ENTRADA') || 
        m.tipo_movimiento?.includes('CARGA_INICIAL') ||
        m.tipo_movimiento?.includes('DEVOLUCION')
      )
    }
  } catch (err) {
    console.error('Error cargando historial Kardex:', err)
  }
}

// Inicialización
onMounted(async () => {
  agregarLineaManual()
  try {
    const [resOc, resP, resU, resB] = await Promise.all([
      apiAxios.get('/compras/ordenes').catch(() => ({ data: { ordenes: [] } })),
      apiAxios.get('/inventario/productos').catch(() => ({ data: [] })),
      apiAxios.get('/inventario/ubicaciones').catch(() => ({ data: [] })),
      apiAxios.get('/inventario/bodegas').catch(() => ({ data: [] }))
    ])

    const ocs = resOc.data?.ordenes || []
    if (Array.isArray(ocs)) {
      ordenesPendientes.value = ocs.filter(o => o.estado_oc !== 'ANULADA' && o.estado_oc !== 'RECHAZADA')
    }

    const prods = resP.data?.data || resP.data
    if (Array.isArray(prods)) {
      catalogoCompleto.value = prods
    }

    const ubics = resU.data?.data || resU.data
    if (Array.isArray(ubics)) {
      ubicaciones.value = ubics
    }

    const bData = resB.data?.data || resB.data
    if (Array.isArray(bData) && bData.length > 0) {
      bodegas.value = bData
    }

    await loadHistorialKardex()
  } catch (err) {
    console.error('Error inicializando vista de recepción:', err)
  }
})
</script>
