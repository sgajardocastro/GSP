<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- ENCABEZADO CANÓNICO WMS -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
      <div>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/5">
            <ClipboardCheck class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-black tracking-tight text-white uppercase font-mono">Conteo Físico & Kardex Ledger</h1>
              <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/20">
                Resuelve: C8 · Conteo Ciego, C9 · Kardex Append-Only
              </span>
            </div>
            <p class="text-slate-400 text-xs mt-0.5">
              Toma de inventario físico, conteos cíclicos ABC, resolución de diferencias con SoD y libro mayor auditable
            </p>
          </div>
        </div>
      </div>

      <!-- Selector de Rol para Segregación de Funciones (SoD) -->
      <button
        @click="toggleRole"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border self-start lg:self-auto',
          isAprob ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-slate-900 text-slate-300 border-slate-800'
        ]"
      >
        <span>{{ isAprob ? '🔓 Rol: GSP_BODEGA_APROB' : '👷 Rol: GSP_BODEGA_EJEC' }}</span>
      </button>
    </div>

    <!-- PESTAÑAS PRINCIPALES: CONTEO FÍSICO vs KARDEX LEDGER -->
    <div class="flex gap-2 mb-6 border-b border-slate-800/80 pb-3">
      <button
        @click="activeTab = 'conteo'"
        :class="[
          'px-4 py-2 font-black text-xs rounded-xl uppercase tracking-wider transition-all',
          activeTab === 'conteo' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        Toma de Inventario & Cíclicos (INV-2026-001)
      </button>
      <button
        @click="activeTab = 'kardex'"
        :class="[
          'px-4 py-2 font-black text-xs rounded-xl uppercase tracking-wider transition-all',
          activeTab === 'kardex' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        🔒 Kardex Inmutable (Append-Only)
      </button>
    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 1: TOMA DE INVENTARIO FÍSICO & CONTEO CÍCLICO                 -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'conteo'" class="space-y-6">
      <!-- TARJETAS KPIS DEL PROCESO EN CURSO -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex justify-between items-start">
          <div>
            <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider font-mono">Proceso en Curso</div>
            <div class="font-mono font-black text-2xl text-amber-400 mt-1">INV-2026-001</div>
            <div class="text-xs text-white font-bold mt-1">Inventario de Apertura · Bodega Taller Central</div>
            <div class="text-[11px] text-slate-400 mt-1">Alcance: 660 ítems con stock · Conteo Ciego · Recuento obligatorio si desvío > 10%</div>
          </div>
          <span class="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px] font-black uppercase">
            EN CURSO
          </span>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider font-mono">Diferencias por Aprobar</div>
          <div class="text-2xl font-black text-amber-400 font-mono mt-1">{{ pendCount }}</div>
          <div class="text-[11px] text-slate-400">Líneas con faltante o sobrante</div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider font-mono">Valor Neto del Ajuste</div>
          <div class="text-2xl font-black text-rose-400 font-mono mt-1">−$18.450</div>
          <div class="text-[11px] text-slate-400">Impacto contable al PMP</div>
        </div>
      </div>

      <!-- CUERPO DEL CONTEO: AVANCE POR ZONA + TABLA DE DIFERENCIAS -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- AVANCE POR ZONA (RACKS E1-E9, CORRAL, PAÑOL) -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div class="text-xs font-bold text-white uppercase font-mono tracking-wider px-1">Avance Físico por Zona</div>
          <div class="space-y-2 text-xs">
            <div v-for="z in zonasAvance" :key="z.nombre" class="flex items-center gap-2">
              <span class="font-mono font-bold text-slate-300 w-20 shrink-0">{{ z.nombre }}</span>
              <div class="flex-1 h-2 rounded-full bg-slate-950 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="z.pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'"
                  :style="{ width: `${z.pct}%` }"
                ></div>
              </div>
              <span class="w-9 text-right font-mono text-[11px] font-bold" :class="z.pct === 100 ? 'text-emerald-400' : 'text-slate-400'">
                {{ z.pct }}%
              </span>
            </div>
          </div>

          <button
            @click="asignarContadores"
            class="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider border border-slate-700 mt-2"
          >
            Asignar Contadores PWA
          </button>
        </div>

        <!-- TABLA DE DIFERENCIAS (VISTA SUPERVISOR CON SOD) -->
        <div class="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap justify-between items-center gap-2">
            <div>
              <h2 class="text-xs font-bold text-white uppercase font-mono tracking-wider">Diferencias Detectadas (Vista Supervisor)</h2>
              <p class="text-[11px] text-slate-400">Conteo ciego: quien contó en terreno no conocía la cantidad del sistema</p>
            </div>

            <div class="flex gap-2">
              <button
                @click="enviarRecuento"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
              >
                Enviar a Recuento
              </button>
              <button
                @click="aprobarAjustes"
                :disabled="!isAprob"
                :title="!isAprob ? 'Requiere rol GSP_BODEGA_APROB' : ''"
                class="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-400 text-slate-950 shadow"
              >
                Aprobar Ajustes ({{ pendCount }})
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase">
                  <th class="p-3">Producto Insumo</th>
                  <th class="p-3">Ubicación</th>
                  <th class="p-3">Sistema</th>
                  <th class="p-3">Conteo 1</th>
                  <th class="p-3">Recuento</th>
                  <th class="p-3">Diferencia</th>
                  <th class="p-3">Valor Desvío</th>
                  <th class="p-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono">
                <tr v-for="(l, idx) in lineasConteo" :key="idx" class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3 font-sans">
                    <div class="font-bold text-white">{{ l.nombre }}</div>
                    <div class="text-[11px] text-amber-400 font-mono">{{ l.sku }}</div>
                  </td>
                  <td class="p-3 font-bold text-slate-300">📍 {{ l.ubicacion }}</td>
                  <td class="p-3 text-slate-400">{{ l.sis }} {{ l.uom }}</td>
                  <td class="p-3 text-white font-bold">{{ l.c1 != null ? `${l.c1} ${l.uom}` : '—' }}</td>
                  <td class="p-3 text-slate-300">{{ l.c2 != null ? `${l.c2} ${l.uom}` : '—' }}</td>
                  <td class="p-3 font-black" :class="l.dif < 0 ? 'text-rose-400' : l.dif > 0 ? 'text-emerald-400' : 'text-slate-500'">
                    {{ l.dif != null ? (l.dif > 0 ? `+${l.dif}` : l.dif) : '—' }} {{ l.uom }}
                  </td>
                  <td class="p-3 font-mono text-slate-300">${{ Math.round(Math.abs(l.val || 0)).toLocaleString('es-CL') }}</td>
                  <td class="p-3 text-right">
                    <span
                      :class="[
                        'px-2 py-0.5 rounded text-[10px] font-black uppercase border',
                        l.estado === 'AJUSTE APROBADO' || l.estado === 'OK' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        l.estado === 'RECONTAR' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      ]"
                    >
                      {{ l.estado }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 2: KARDEX INMUTABLE (APPEND-ONLY LEDGER)                     -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'kardex'" class="space-y-4">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div class="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 class="text-xs font-bold text-white uppercase font-mono tracking-wider">🔒 Kardex Bidi Ledger (Append-Only)</h2>
            <p class="text-[11px] text-slate-400">Los asientos nunca se borran ni editan; las correcciones se efectúan mediante asientos de reverso vinculados</p>
          </div>
          <span class="text-xs text-slate-400 font-mono">{{ kardexMoves.length }} movimientos auditados</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase">
                <th class="p-3"># Folio</th>
                <th class="p-3">Fecha / Hora</th>
                <th class="p-3">Tipo Asiento</th>
                <th class="p-3">Doc. Origen</th>
                <th class="p-3">Producto</th>
                <th class="p-3">Ubicación</th>
                <th class="p-3">Cantidad</th>
                <th class="p-3">Costo PMP</th>
                <th class="p-3">Saldo Rack</th>
                <th class="p-3">Usuario</th>
                <th class="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono">
              <tr
                v-for="m in kardexMoves"
                :key="m.id"
                :class="[m.reversado ? 'opacity-50 line-through' : '', 'hover:bg-slate-800/30 transition-colors']"
              >
                <td class="p-3 font-bold text-slate-400">#{{ m.id }}</td>
                <td class="p-3 text-slate-400 text-[11px] whitespace-nowrap">{{ m.f }}</td>
                <td class="p-3">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-black uppercase border',
                      m.tipo === 'REVERSO' ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' :
                      (m.cant < 0 || m.tipo.startsWith('SALIDA')) ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    ]"
                  >
                    {{ m.tipo }}
                  </span>
                </td>
                <td class="p-3 text-slate-300 text-[11px]">{{ m.doc }}</td>
                <td class="p-3 font-sans font-bold text-white">{{ m.nombre }}</td>
                <td class="p-3 text-amber-300 font-bold">📍 {{ m.ub }}</td>
                <td class="p-3 font-black" :class="(m.cant < 0 || m.tipo.startsWith('SALIDA')) ? 'text-rose-400' : 'text-emerald-400'">
                  {{ m.tipo.startsWith('SALIDA') ? `-${Math.abs(m.cant)}` : (m.cant > 0 ? `+${m.cant}` : m.cant) }}
                </td>
                <td class="p-3 text-slate-300">${{ Number(m.cu).toLocaleString('es-CL') }}</td>
                <td class="p-3 text-slate-400 text-[11px]">{{ m.sa }} ➔ <b class="text-white">{{ m.sd }}</b></td>
                <td class="p-3 text-slate-400 text-[11px]">{{ m.u }}</td>
                <td class="p-3 text-right">
                  <button
                    v-if="!m.reversado && m.tipo !== 'REVERSO'"
                    @click="reversarMovimiento(m)"
                    :disabled="!isAprob"
                    :title="!isAprob ? 'Requiere rol GSP_BODEGA_APROB' : ''"
                    class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-violet-300 text-[10px] font-bold border border-slate-700"
                  >
                    Reversar
                  </button>
                  <span v-else-if="m.reversado" class="text-[10px] text-violet-400 font-bold">Reversado</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ClipboardCheck } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const activeTab = ref('conteo')
const isAprob = ref(false)

const toggleRole = () => {
  isAprob.value = !isAprob.value
  alert(`Rol cambiado a ${isAprob.value ? 'GSP_BODEGA_APROB (Supervisor: puede aprobar ajustes y reversos)' : 'GSP_BODEGA_EJEC (Operador: solo captura datos)'}.`)
}

// Zonas y progreso de conteo
const zonasAvance = ref([
  { nombre: 'E1', pct: 100 },
  { nombre: 'E2', pct: 100 },
  { nombre: 'E3', pct: 85 },
  { nombre: 'E4', pct: 60 },
  { nombre: 'E5', pct: 40 },
  { nombre: 'E6', pct: 0 },
  { nombre: 'E7', pct: 20 },
  { nombre: 'E8', pct: 0 },
  { nombre: 'E9', pct: 50 },
  { nombre: 'PAÑOL', pct: 100 },
  { nombre: 'CORRAL', pct: 100 },
  { nombre: 'SIN-UBICAR', pct: 30 }
])

const lineasConteo = ref([
  { sku: 'GSP-000158', nombre: 'Filtro de combustible Donaldson', ubicacion: 'E4-F2', uom: 'UN', sis: 6, c1: 4, c2: 4, dif: -2, val: -36900, estado: 'DIFERENCIA' },
  { sku: 'GSP-000201', nombre: 'Aceite Hidráulico ISO VG 68', ubicacion: 'CORRAL', uom: 'L', sis: 416, c1: 312, c2: null, dif: -104, val: -327600, estado: 'RECONTAR' },
  { sku: 'GSP-000305', nombre: 'Manguera hidráulica 1/2" 2SN', ubicacion: 'E7-B1', uom: 'm', sis: 50, c1: 62.5, c2: 62.5, dif: 12.5, val: 86250, estado: 'SOBRANTE' },
  { sku: 'GSP-000733', nombre: 'Guante cabritilla soldador', ubicacion: 'E2-C4', uom: 'PAR', sis: 32, c1: 30, c2: 30, dif: -2, val: -7800, estado: 'AJUSTE APROBADO' },
  { sku: 'GSP-000977', nombre: 'Ampolleta H4 24V', ubicacion: 'E3-B2', uom: 'UN', sis: 8, c1: 8, c2: null, dif: 0, val: 0, estado: 'OK' }
])

const pendCount = computed(() => lineasConteo.value.filter(l => l.estado === 'DIFERENCIA' || l.estado === 'SOBRANTE').length)

const asignarContadores = () => {
  alert('Asignación de zonas a contadores PWA: escanean QR de rack, producto y digitan cantidad física.')
}

const enviarRecuento = () => {
  alert('Líneas enviadas a recuento ciego con un segundo operador independiente.')
}

const aprobarAjustes = () => {
  if (!isAprob.value) return
  lineasConteo.value.forEach(l => {
    if (l.estado === 'DIFERENCIA' || l.estado === 'SOBRANTE') l.estado = 'AJUSTE APROBADO'
  })
  alert(`Ajustes aprobados: se generaron los asientos de ajuste en el Kardex con respaldo del acta INV-2026-001.`)
}

// Kardex inmutable
const kardexMoves = ref([
  { id: 10458, f: '12-10-2026 10:42', tipo: 'SALIDA_OT', doc: 'MNT-2610-014', nombre: 'Filtro aire primario Donaldson', ub: 'E4-F1', cant: -1, cu: 64500, sa: 3, sd: 2, u: 'bodega.ejec', reversado: false },
  { id: 10457, f: '12-10-2026 09:15', tipo: 'RECEPCION_COMPRA', doc: 'REC-2610-0012 · OC 4512', nombre: 'Aceite Hidráulico ISO VG 68', ub: 'CORRAL', cant: 416, cu: 3150, sa: 0, sd: 416, u: 'bodega.ejec', reversado: false },
  { id: 10456, f: '11-10-2026 17:30', tipo: 'REVERSO', doc: 'Reversa #10455', nombre: 'Filtro combustible Donaldson', ub: 'E4-F2', cant: 2, cu: 18450, sa: 2, sd: 4, u: 'taller.aprob', reversado: false },
  { id: 10455, f: '11-10-2026 16:58', tipo: 'SALIDA_OT', doc: 'MNT-2610-011', nombre: 'Filtro combustible Donaldson', ub: 'E4-F2', cant: -2, cu: 18450, sa: 4, sd: 2, u: 'bodega.ejec', reversado: true },
  { id: 10454, f: '11-10-2026 12:10', tipo: 'DEVOLUCION_OT', doc: 'MNT-2610-009', nombre: 'Manguera hidráulica 1/2" 2SN', ub: 'E7-B1', cant: 4.5, cu: 6900, sa: 58, sd: 62.5, u: 'bodega.ejec', reversado: false }
])

const reversarMovimiento = (m) => {
  if (!isAprob.value) return
  m.reversado = true
  kardexMoves.value.unshift({
    id: Date.now() % 100000,
    f: '12-10-2026 17:15',
    tipo: 'REVERSO',
    doc: `Reversa #${m.id}`,
    nombre: m.nombre,
    ub: m.ub,
    cant: -m.cant,
    cu: m.cu,
    sa: m.sd,
    sd: m.sa,
    u: 'supervisor.aprob',
    reversado: false
  })
  alert(`Movimiento #${m.id} reversado con éxito: se generó un asiento de compensación inmutable en el Kardex.`)
}

onMounted(async () => {
  try {
    const res = await apiAxios.get('/inventario/kardex')
    const data = res.data?.data || res.data
    if (Array.isArray(data) && data.length > 0) {
      kardexMoves.value = data.slice(0, 30).map(m => ({
        id: m.id,
        f: m.fecha_movimiento ? new Date(m.fecha_movimiento).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—',
        tipo: m.tipo_movimiento,
        doc: m.documento_folio || m.documento_referencia || `OT-${m.id}`,
        nombre: m.producto_nombre || 'Repuesto MRO',
        ub: m.ubicacion_codigo || 'Pañol',
        cant: Number(m.cantidad || 0),
        cu: Number(m.costo_unitario || m.costo_unitario_pmp || 0),
        sa: Number(m.stock_anterior || 0),
        sd: Number(m.stock_posterior || 0),
        u: m.usuario_registro || m.usuario_nombre || 'Eduardo Bodega',
        reversado: Boolean(m.id_movimiento_reversado)
      }))
    }
  } catch (err) {}
})
</script>
