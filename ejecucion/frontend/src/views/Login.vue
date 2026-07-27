<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-[#050810] text-slate-100 relative overflow-hidden font-sans">
    <!-- Background Gradient decorations -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/3 blur-[120px] rounded-full"></div>

    <div class="w-full max-w-md p-8 bg-[#0f1629] border border-white/5 rounded-2xl shadow-2xl relative z-10">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,166,35,0.3)]">
          <Zap class="w-10 h-10 text-black fill-black" />
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight uppercase font-display">
          GSP <span class="text-amber-500">OPERACIONES</span>
        </h1>
        <p class="text-slate-400 text-xs tracking-wider uppercase mt-1">Consola de Control de Maquinarias</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="space-y-4">
          <div class="space-y-2 text-left">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Usuario / Email</label>
            <input 
              v-model="email"
              type="email" 
              placeholder="despacho@cruassanpablo.cl"
              class="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm"
              required
            />
          </div>
          <div class="space-y-2 text-left">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
            <div class="relative">
              <input 
                v-model="password"
                :type="showPassword ? 'text' : 'password'" 
                placeholder="••••••••"
                class="w-full bg-[#050810] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm"
                required
              />
              <button 
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          :disabled="loading"
          class="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-amber-500/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-xs"
        >
          {{ loading ? 'Iniciando sesión...' : 'Entrar' }}
        </button>

        <!-- Divider -->
        <div class="relative py-2">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/5"></div></div>
          <div class="relative flex justify-center text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <span class="bg-[#0f1629] px-4">O continuar con</span>
          </div>
        </div>

        <!-- Google Login -->
        <div class="flex justify-center">
          <div ref="googleBtnRef" class="w-full overflow-hidden rounded-xl"></div>
        </div>

        <!-- Error Message -->
        <transition enter-active-class="transition duration-200" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
          <p v-if="error" class="text-center text-xs text-red-400 bg-red-500/10 py-2 rounded-lg border border-red-500/20 font-semibold">{{ error }}</p>
        </transition>
      </form>

      <!-- Footer Info -->
      <div class="mt-8 text-center border-t border-white/5 pt-6">
        <p class="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">LeanGlobal &copy; 2026 - GSP v2.0</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Eye, EyeOff, Zap } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const showPassword = ref(false)
const { email, password, loading, error, googleBtnRef, loginInterno } = useAuth()

// Inyección de credenciales por defecto eliminada para seguridad
email.value = ''
password.value = ''

const handleSubmit = () => {
  loginInterno()
}
</script>

