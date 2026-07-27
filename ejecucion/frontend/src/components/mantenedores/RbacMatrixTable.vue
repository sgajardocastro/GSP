<template>
  <div class="mt-4 border border-white/10 rounded-2xl overflow-hidden bg-white/5">
    <div class="px-4 py-2 bg-white/5 border-b border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-500">
      <span>Permisos de Aplicación (Matriz RBAC)</span>
      <div class="flex gap-2">
        <span class="text-white/40">Total: {{ modelValue.length }}</span>
      </div>
    </div>
    
    <div class="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
      <table class="w-full text-[10px] border-collapse">
        <thead class="sticky top-0 bg-zinc-900 border-b border-emerald-500/20 z-10">
          <tr>
            <th class="p-3 text-left w-48 border-r border-white/5">Módulo / Cliente</th>
            <th v-for="fn in functionCodes" :key="fn" class="p-3 text-center border-r border-white/5">{{ fn }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mod in modulesList" :key="mod.code" class="border-b border-white/5 hover:bg-white/5">
            <td class="p-3 font-bold bg-white/[0.02] border-r border-white/5 text-emerald-500">
              <div>{{ mod.name }}</div>
              <div class="text-[8px] text-zinc-500 font-normal">{{ mod.code }}</div>
            </td>
            <td v-for="fn in functionCodes" :key="fn" class="p-2 border-r border-white/5 last:border-r-0 text-center">
              <label class="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  :checked="hasPerm(mod.code, fn)"
                  @change="togglePerm(mod.code, fn)"
                  class="sr-only peer"
                >
                <div class="w-5 h-5 bg-white/5 border border-white/20 rounded peer-checked:bg-emerald-500 peer-checked:border-emerald-400 transition-all flex items-center justify-center">
                  <Check v-if="hasPerm(mod.code, fn)" class="w-4 h-4 text-zinc-950 stroke-[4]" />
                </div>
              </label>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { Check } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  rolesCatalog: { type: Array, default: () => [] },
  permissions: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue'])

const functionCodes = ['ADMIN', 'PROG', 'EJEC', 'APROB']

const modulesList = [
  { code: 'TMAC', name: 'Transmac Ltda (SST)' },
  { code: 'TMAC_CALM', name: 'Transmac - Suc. Calama' },
  { code: 'TMAC_LAND', name: 'Transmac - Suc. Los Andes' },
  { code: 'CDLC_DMH', name: 'Codelco DMH' },
  { code: 'CDLC_DCH', name: 'Codelco División Chuqui' },
  { code: 'CDLC_SPOT', name: 'Codelco Spot' },
  { code: 'AMSA_MLP', name: 'Minera Los Pelambres (AMSA MLP)' },
  { code: 'RENTMAC', name: 'Rental MAC' }
]

function getCode(mod, fn) {
  return fn === 'ADMIN' ? 'ADMIN' : `${mod}_${fn}`
}

function hasPerm(mod, fn) {
  const code = getCode(mod, fn)
  return props.modelValue.includes(code)
}

function togglePerm(mod, fn) {
  const code = getCode(mod, fn)
  const next = [...props.modelValue]
  const idx = next.indexOf(code)
  if (idx > -1) {
    next.splice(idx, 1)
  } else {
    next.push(code)
  }
  emit('update:modelValue', next)
}
</script>

