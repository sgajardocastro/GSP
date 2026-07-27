<template>
  <div class="h-full w-full flex flex-col bg-[hsl(240_10%_3.9%)] text-white font-sans text-sm p-4">
    <!-- Header -->
    <header class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold tracking-tight text-white">Módulo de Inventario <span class="text-zinc-400 text-sm font-normal">v2 (LEANGLOBAL)</span></h1>
      <div class="flex gap-2">
        <button class="px-3 py-1.5 bg-[hsl(240_5.9%_10%)] border border-[hsl(240_5.9%_20%)] hover:bg-[hsl(240_5.9%_15%)] rounded text-xs transition-colors">
          Actualizar Datos
        </button>
      </div>
    </header>

    <!-- Tabs -->
    <div class="flex border-b border-[hsl(240_5.9%_20%)] mb-4">
      <button 
        @click="activeTab = 'gestion'"
        :class="['px-4 py-2 text-xs font-medium border-b-2 transition-colors', activeTab === 'gestion' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200']">
        Gestión de Inventario
      </button>
      <button 
        @click="activeTab = 'bodegas'"
        :class="['px-4 py-2 text-xs font-medium border-b-2 transition-colors', activeTab === 'bodegas' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200']">
        Gestión de Bodegas
      </button>
      <button 
        @click="activeTab = 'maestro'"
        :class="['px-4 py-2 text-xs font-medium border-b-2 transition-colors', activeTab === 'maestro' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200']">
        Maestro de Productos
      </button>
    </div>

    <!-- Content Area (Scrollable Table Container) -->
    <div class="flex-1 overflow-auto border border-[hsl(240_5.9%_20%)] rounded bg-[hsl(240_5.9%_10%)]">
      
      <!-- TAB 1: GESTIÓN DE INVENTARIO -->
      <table v-if="activeTab === 'gestion'" class="w-full text-left border-collapse whitespace-nowrap">
        <thead class="sticky top-0 bg-[hsl(240_5.9%_15%)] border-b border-[hsl(240_5.9%_20%)]">
          <tr>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">ID</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Sucursal</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Bodega</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Jefe Bodega</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Fecha Plan</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Fecha Real</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Estado</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Valor Existencia</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 5" :key="i" class="border-b border-[hsl(240_5.9%_20%)] hover:bg-[hsl(240_5.9%_12%)]">
            <td class="p-2 text-xs text-zinc-400">INV-2026-{{ 100 + i }}</td>
            <td class="p-2 text-xs">Santiago Centro</td>
            <td class="p-2 text-xs">Bodega Principal</td>
            <td class="p-2 text-xs">Juan Pérez</td>
            <td class="p-2 text-xs">25-04-2026</td>
            <td class="p-2 text-xs text-zinc-500">-</td>
            <td class="p-2 text-xs"><span class="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-[10px] font-bold">PLANIFICADO</span></td>
            <td class="p-2 text-xs font-mono text-right">$45,230.00</td>
            <td class="p-2 text-xs text-center flex justify-center gap-2">
              <button class="text-blue-400 hover:text-blue-300" title="Ver Detalle">👁️</button>
              <button class="text-green-400 hover:text-green-300" title="Ejecutar">▶️</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- TAB 2: GESTIÓN DE BODEGAS -->
      <table v-if="activeTab === 'bodegas'" class="w-full text-left border-collapse whitespace-nowrap">
        <thead class="sticky top-0 bg-[hsl(240_5.9%_15%)] border-b border-[hsl(240_5.9%_20%)]">
          <tr>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">ID Bodega</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Sucursal</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Nombre Bodega</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Valor Total</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Cantidad Items</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">En Tránsito</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Prox. Inventario</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 text-center">Operaciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 5" :key="i" class="border-b border-[hsl(240_5.9%_20%)] hover:bg-[hsl(240_5.9%_12%)]">
            <td class="p-2 text-xs text-zinc-400">BOD-00{{ i }}</td>
            <td class="p-2 text-xs">Norte Antofagasta</td>
            <td class="p-2 text-xs">Almacén Insumos {{ i }}</td>
            <td class="p-2 text-xs font-mono text-right">$125,{{ i }}00.00</td>
            <td class="p-2 text-xs font-mono text-right">{{ 1200 * i }}</td>
            <td class="p-2 text-xs font-mono text-right text-yellow-400">{{ 15 * i }}</td>
            <td class="p-2 text-xs">10-05-2026</td>
            <td class="p-2 text-xs text-center flex justify-center gap-1">
              <button @click="showDespacho = true" class="px-2 py-1 bg-[hsl(240_5.9%_20%)] hover:bg-[hsl(240_5.9%_30%)] rounded text-[10px]">Despacho</button>
              <button @click="showRecepcion = true" class="px-2 py-1 bg-[hsl(240_5.9%_20%)] hover:bg-[hsl(240_5.9%_30%)] rounded text-[10px]">Recepción</button>
              <button @click="showTraspaso = true" class="px-2 py-1 bg-[hsl(240_5.9%_20%)] hover:bg-[hsl(240_5.9%_30%)] rounded text-[10px]">Traspaso</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- TAB 3: MAESTRO DE PRODUCTOS -->
      <table v-if="activeTab === 'maestro'" class="w-full text-left border-collapse whitespace-nowrap">
        <thead class="sticky top-0 bg-[hsl(240_5.9%_15%)] border-b border-[hsl(240_5.9%_20%)]">
          <tr>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Código</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Nombre</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Tipo</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Marca</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Precio Ref.</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Estado</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 border-r border-[hsl(240_5.9%_20%)]">Unidad</th>
            <th class="p-2 text-xs font-semibold text-zinc-300 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 8" :key="i" class="border-b border-[hsl(240_5.9%_20%)] hover:bg-[hsl(240_5.9%_12%)]">
            <td class="p-2 text-xs text-zinc-400 font-mono">SKU-{{ 1000 + i }}</td>
            <td class="p-2 text-xs">Filtro de Aceite Heavy Duty {{ i }}</td>
            <td class="p-2 text-xs">Repuesto Motor</td>
            <td class="p-2 text-xs">Caterpillar</td>
            <td class="p-2 text-xs font-mono text-right">$85.50</td>
            <td class="p-2 text-xs"><span class="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px] font-bold">ACTIVO</span></td>
            <td class="p-2 text-xs text-center">Sí</td>
            <td class="p-2 text-xs text-center">
              <button class="text-zinc-400 hover:text-white" title="Editar">✏️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modals (Hidden by default, structure ready) -->
    <!-- Despacho Modal Placeholder -->
    <div v-if="showDespacho" class="fixed inset-0 bg-black/60 glass flex items-center justify-center z-50">
      <div class="bg-[hsl(240_5.9%_10%)] border border-[hsl(240_5.9%_20%)] rounded shadow-2xl p-4 w-[600px]">
        <h2 class="text-lg font-bold mb-4">Nuevo Despacho</h2>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] uppercase text-zinc-400">Solicitante</label>
            <select class="bg-[hsl(240_5.9%_15%)] border border-[hsl(240_5.9%_25%)] rounded p-1.5 text-xs focus:outline-none focus:border-white">
              <option>Seleccione Operario...</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] uppercase text-zinc-400">Número OT</label>
            <input type="text" class="bg-[hsl(240_5.9%_15%)] border border-[hsl(240_5.9%_25%)] rounded p-1.5 text-xs focus:outline-none focus:border-white" placeholder="OT-12345">
          </div>
          <div class="flex flex-col gap-1 col-span-2">
            <label class="text-[10px] uppercase text-zinc-400">Lectura Código de Barras</label>
            <input type="text" class="bg-[hsl(240_5.9%_15%)] border border-[hsl(240_5.9%_25%)] rounded p-2 text-sm font-mono focus:outline-none focus:border-blue-500" placeholder="Escanee SKU..." autofocus>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showDespacho = false" class="px-4 py-1.5 bg-[hsl(0_84.2%_60.2%)]/20 text-[hsl(0_84.2%_60.2%)] hover:bg-[hsl(0_84.2%_60.2%)]/30 rounded text-xs transition-colors">Cancelar</button>
          <button @click="showDespacho = false" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors">Procesar Despacho</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('gestion')
const showDespacho = ref(false)
const showRecepcion = ref(false)
const showTraspaso = ref(false)

// La lógica real usará el store de Pinia/Vuex y pegará al Backend 3004 / 3000 según la tabla.
</script>

<style scoped>
/* Scrollbar industrial minimalista */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: hsl(240 5.9% 10%);
}
::-webkit-scrollbar-thumb {
  background: hsl(240 5.9% 20%);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: hsl(240 5.9% 30%);
}
</style>
