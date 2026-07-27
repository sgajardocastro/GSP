<template>
  <div class="h-full flex flex-col">
    <!-- Controles -->
    <div class="flex items-center gap-3 mb-4">
      <button @click="agregarLinea" class="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-md text-xs font-semibold transition-colors border border-white/10">
        + Añadir Equipo/Servicio
      </button>
    </div>

    <!-- Tabla -->
    <div class="overflow-x-auto flex-1 bg-black/30 rounded-lg border border-white/5">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="text-xs uppercase bg-black/50 text-slate-400 sticky top-0">
          <tr>
            <th class="px-4 py-3 font-semibold">Concepto / Equipo</th>
            <th class="px-4 py-3 font-semibold text-center w-24">Cantidad</th>
            <th class="px-4 py-3 font-semibold text-right w-32">V. Unitario (UF/$)</th>
            <th class="px-4 py-3 font-semibold text-right w-32">Total Neto</th>
            <th class="px-4 py-3 text-center w-16">Acción</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-for="(linea, index) in lineas" :key="index" class="hover:bg-white/[0.02] transition-colors">
            <td class="px-4 py-2">
              <input type="text" v-model="linea.concepto" placeholder="Ej: Grúa LTM 1100..." class="w-full bg-transparent border-b border-white/10 focus:border-amber-500 outline-none py-1 text-sm text-white" />
            </td>
            <td class="px-4 py-2">
              <input type="number" v-model.number="linea.cantidad" min="1" class="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-center text-sm focus:border-amber-500 outline-none" />
            </td>
            <td class="px-4 py-2">
              <input type="number" v-model.number="linea.valorUnitario" min="0" class="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-right text-sm focus:border-amber-500 outline-none" />
            </td>
            <td class="px-4 py-2 text-right font-bold text-amber-500">
              {{ formatCurrency(linea.cantidad * linea.valorUnitario) }}
            </td>
            <td class="px-4 py-2 text-center">
              <button @click="eliminarLinea(index)" class="text-slate-500 hover:text-red-400 transition-colors">
                <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </td>
          </tr>
          <tr v-if="lineas.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-slate-500 text-xs italic">
              No hay líneas de servicio agregadas.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Resumen -->
    <div class="mt-4 flex justify-end">
      <div class="bg-black/50 border border-white/10 rounded-lg p-4 w-64">
        <div class="flex justify-between items-center text-sm font-bold text-white">
          <span>SUBTOTAL NETO</span>
          <span class="text-amber-500">{{ formatCurrency(subtotalGeneral) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const lineas = ref([
  { concepto: 'Arriendo Grúa LTM 1100 (Jornada)', cantidad: 1, valorUnitario: 500000 }
])

const agregarLinea = () => {
  lineas.value.push({ concepto: '', cantidad: 1, valorUnitario: 0 })
}

const eliminarLinea = (index) => {
  lineas.value.splice(index, 1)
}

const subtotalGeneral = computed(() => {
  return lineas.value.reduce((acc, curr) => acc + (curr.cantidad * (curr.valorUnitario || 0)), 0)
})

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0)
}

// Expone el método para que el padre lo lea antes de guardar (RF-5.4)
defineExpose({
  getLineas: () => lineas.value,
  getSubtotal: () => subtotalGeneral.value
})
</script>
