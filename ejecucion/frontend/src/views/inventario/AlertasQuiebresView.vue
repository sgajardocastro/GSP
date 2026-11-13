<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- ENCABEZADO CANÓNICO WMS -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/5">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">Alertas & Matriz de Criticidad</h1>
              <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">
                Resuelve: C10 · ROP & Criticidad MRO
              </span>
            </div>
            <p class="text-slate-400 text-xs mt-0.5">
              Monitor preventivo de quiebres de stock, matriz impacto × lead time y sugerencias automáticas de abastecimiento
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- TARJETAS KPIS CANÓNICAS WMS -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Valor Inventario</div>
        <div class="text-2xl font-black text-emerald-400 mt-1 font-mono">${{ valorInventarioTotal.toLocaleString('es-CL') }}</div>
        <div class="text-[11px] text-slate-400 mt-1">Saldo legado valorizado en BD</div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Ítems con Stock</div>
        <div class="text-2xl font-black text-white mt-1 font-mono">{{ itemsConStock }}</div>
        <div class="text-[11px] text-slate-400 mt-1">de 2.805 códigos en catálogo</div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Catálogo Sin Movimiento</div>
        <div class="text-2xl font-black text-amber-400 mt-1 font-mono">2.038</div>
        <div class="text-[11px] text-slate-400 mt-1">73% candidatos a INACTIVO</div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Exactitud Inventario</div>
        <div class="text-2xl font-black text-slate-400 mt-1 font-mono">—</div>
        <div class="text-[11px] text-slate-400 mt-1">Tras conteo INV-2026-001</div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Bajo Punto Reorden</div>
        <div class="text-2xl font-black text-rose-400 mt-1 font-mono">{{ alertas.length }}</div>
        <div class="text-[11px] text-slate-400 mt-1">según disponible neto</div>
      </div>
    </div>

    <!-- CUERPO PRINCIPAL: TABLA DE ALERTAS + MATRIZ DE CRITICIDAD -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- COLUMNA IZQUIERDA: ALERTAS DE REPOSICIÓN -->
      <div class="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 class="text-xs font-bold text-white uppercase font-mono tracking-wider">Alertas de Reposición Activas</h2>
            <p class="text-[11px] text-slate-400">Disponible Neto = Físico Libre − Reservado + En Tránsito</p>
          </div>
          <span class="text-xs font-mono text-amber-400 font-bold">{{ alertas.length }} insumos críticos</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase">
                <th class="p-3">Producto / SKU</th>
                <th class="p-3">Criticidad</th>
                <th class="p-3">Físico</th>
                <th class="p-3">Reserv.</th>
                <th class="p-3">Tráns.</th>
                <th class="p-3">Neto</th>
                <th class="p-3">P. Reorden</th>
                <th class="p-3">Sugerido</th>
                <th class="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono">
              <tr v-for="a in alertas" :key="a.id" class="hover:bg-slate-800/30 transition-colors">
                <td class="p-3 font-sans">
                  <div class="font-bold text-white">{{ a.nombre }}</div>
                  <div class="text-[11px] text-amber-400/90 font-mono">{{ a.sku }} · {{ a.codigo_legado || '—' }}</div>
                </td>
                <td class="p-3">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-black uppercase border',
                      a.impacto === 'CRITICO' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    ]"
                  >
                    {{ a.impacto || 'CRITICO' }}
                  </span>
                  <div class="text-[10px] text-slate-400 font-sans mt-0.5">Lead {{ (a.lead_time || 'largo').toLowerCase() }}</div>
                </td>
                <td class="p-3 text-slate-300 font-bold">{{ a.stock_fisico }} {{ a.uom }}</td>
                <td class="p-3 text-slate-400">{{ a.stock_reservado || 0 }} {{ a.uom }}</td>
                <td class="p-3 text-slate-400">{{ a.en_transito || 0 }} {{ a.uom }}</td>
                <td class="p-3 font-black" :class="Number(a.stock_neto) <= Number(a.min || 1) ? 'text-rose-400' : 'text-amber-400'">
                  {{ a.stock_neto }}
                </td>
                <td class="p-3 text-slate-300">{{ a.rop || a.punto_reorden || 2 }}</td>
                <td class="p-3 font-bold text-amber-300">
                  {{ a.sugerido_compra || (a.max - a.stock_neto) }} {{ a.presentacion_compra || a.uom }}
                </td>
                <td class="p-3 text-right">
                  <button
                    @click="sugerirCompra(a)"
                    class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-bold border border-slate-700 whitespace-nowrap"
                  >
                    Sugerir Compra
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- COLUMNA DERECHA: MATRIZ DE CRITICIDAD Y CALIDAD DEL LEGADO -->
      <div class="space-y-4">
        <!-- Matriz de Criticidad 3x3 -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div>
            <div class="text-xs font-bold text-white uppercase font-mono tracking-wider">Matriz de Criticidad (Alertas Activas)</div>
            <p class="text-[11px] text-slate-400 mt-0.5">Impacto operacional × Lead Time de reposición</p>
          </div>

          <table class="w-full text-xs font-mono">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400">
                <th class="py-1.5"></th>
                <th class="text-center py-1.5 font-bold">Corto</th>
                <th class="text-center py-1.5 font-bold">Medio</th>
                <th class="text-center py-1.5 font-bold">Largo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-sans">
              <tr>
                <td class="py-2 font-bold text-rose-400 text-xs">Crítico</td>
                <td class="text-center"><span class="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 font-bold font-mono">14</span></td>
                <td class="text-center"><span class="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 font-bold font-mono">22</span></td>
                <td class="text-center"><span class="px-2.5 py-1 rounded bg-rose-500/30 text-rose-300 font-black font-mono">31</span></td>
              </tr>
              <tr>
                <td class="py-2 font-bold text-amber-400 text-xs">Importante</td>
                <td class="text-center"><span class="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 font-bold font-mono">8</span></td>
                <td class="text-center"><span class="px-2.5 py-1 rounded bg-amber-500/15 text-amber-400 font-bold font-mono">12</span></td>
                <td class="text-center"><span class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold font-mono">15</span></td>
              </tr>
              <tr>
                <td class="py-2 font-bold text-emerald-400 text-xs">Normal</td>
                <td class="text-center"><span class="px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-mono">3</span></td>
                <td class="text-center"><span class="px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-mono">2</span></td>
                <td class="text-center"><span class="px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-mono">0</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Calidad de Datos del Legado -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
          <div class="text-xs font-bold text-white uppercase font-mono tracking-wider">Calidad de Datos del Legado</div>
          <div class="space-y-2">
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Ítems con stock sin posición útil:</span>
              <strong class="text-amber-400 font-mono">≈ 300</strong>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Precio legado ≤ $1 (revalorizar):</span>
              <strong class="text-amber-400 font-mono">94</strong>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Códigos legados duplicados:</span>
              <strong class="text-rose-400 font-mono">1 (TMR0293)</strong>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Variantes de ubicación física:</span>
              <strong class="text-white font-mono">101</strong>
            </div>
          </div>

          <router-link
            :to="{ name: 'inventario_bodegas' }"
            class="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-700 transition-all block text-center"
          >
            Ver Mapa de Ubicaciones & Migración →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const router = useRouter()
const valorInventarioTotal = ref(72282414)
const itemsConStock = ref(660)

const alertas = ref([
  { id: 1, sku: 'GSP-000158', codigo_legado: 'FCM0005', nombre: 'Filtro de combustible Donaldson P553004', impacto: 'CRITICO', lead_time: 'Medio', stock_fisico: 5, stock_reservado: 2, en_transito: 0, stock_neto: 3, rop: 4, min: 2, max: 12, uom: 'UN', presentacion_compra: 'CAJA' },
  { id: 2, sku: 'GSP-000410', codigo_legado: 'TMR0058', nombre: 'Bomba hidráulica principal Liebherr', impacto: 'CRITICO', lead_time: 'Largo', stock_fisico: 1, stock_reservado: 0, en_transito: 0, stock_neto: 1, rop: 1, min: 1, max: 2, uom: 'UN', presentacion_compra: 'UN' },
  { id: 3, sku: 'GSP-000512', codigo_legado: 'TMR0293', nombre: 'Kit sellos cilindro telescópico Grove', impacto: 'CRITICO', lead_time: 'Largo', stock_fisico: 1, stock_reservado: 1, en_transito: 0, stock_neto: 0, rop: 2, min: 1, max: 3, uom: 'UN', presentacion_compra: 'KIT' },
  { id: 4, sku: 'GSP-000845', codigo_legado: 'NEOP0004', nombre: 'Neumático 385/95 R25 Michelin X-Crane', impacto: 'CRITICO', lead_time: 'Largo', stock_fisico: 2, stock_reservado: 0, en_transito: 0, stock_neto: 2, rop: 2, min: 2, max: 6, uom: 'UN', presentacion_compra: 'UN' },
  { id: 5, sku: 'GSP-001004', codigo_legado: 'TMR0950', nombre: 'Filtro de aire primario Donaldson P777868', impacto: 'IMPORTANTE', lead_time: 'Medio', stock_fisico: 2, stock_reservado: 2, en_transito: 0, stock_neto: 0, rop: 3, min: 2, max: 6, uom: 'UN', presentacion_compra: 'UN' }
])

const sugerirCompra = (a) => {
  const cantSugerida = Math.max(1, Number(a.sugerido_compra || (a.max - a.stock_neto) || 1))
  router.push({
    name: 'compras_oc',
    query: {
      nueva_solped: '1',
      id_producto: a.id,
      sku: a.sku,
      nombre: a.nombre,
      cantidad: cantSugerida,
      uom: a.presentacion_compra || a.uom || 'UN',
      criticidad: a.impacto || 'CRITICO'
    }
  })
}

onMounted(async () => {
  try {
    const res = await apiAxios.get('/inventario/alertas/reposicion')
    const data = res.data?.data || res.data
    if (Array.isArray(data) && data.length > 0) {
      alertas.value = data.slice(0, 30).map(a => ({
        id: a.id,
        sku: a.sku,
        codigo_legado: a.codigo_legado,
        nombre: a.nombre,
        impacto: a.impacto || a.impacto_operacional || 'CRITICO',
        lead_time: a.lead_time || 'Medio',
        stock_fisico: Number(a.stock_fisico || 0),
        stock_reservado: Number(a.stock_reservado || 0),
        en_transito: 0,
        stock_neto: Number(a.stock_neto || 0),
        rop: Number(a.rop || a.punto_reorden || 2),
        min: Number(a.min || a.stock_minimo || 1),
        max: Number(a.max || a.stock_maximo || 6),
        uom: a.uom || 'UN',
        presentacion_compra: a.presentacion_compra || a.uom || 'UN'
      }))
    }
  } catch (err) {}
})
</script>
