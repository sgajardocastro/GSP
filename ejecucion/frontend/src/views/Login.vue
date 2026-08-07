<template>
  <div class="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[#030609] text-[#f8fafc] font-sans overflow-hidden select-none">
    
    <!-- LEFT SIDE: Industrial Hero & Telemetry (60% on desktop) -->
    <div class="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 overflow-hidden border-r border-white/5">
      <!-- High Impact Industrial Crane Background Photography & Overlays -->
      <div class="absolute inset-0 z-0">
        <img 
          src="/img/hero_crane_dark.jpg" 
          alt="Grúas industriales San Pablo" 
          class="w-full h-full object-cover object-center scale-105 transform filter brightness-[0.65] contrast-125"
        />
        <!-- Dark Professional Overlay Gradients -->
        <div class="absolute inset-0 bg-gradient-to-r from-[#030609]/95 via-[#030609]/75 to-[#030609]"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-[#030609] via-transparent to-[#030609]/70"></div>
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-60"></div>
      </div>

      <!-- Background Ambient Glows & Technical Grid -->
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/15 blur-[140px] rounded-full animate-pulse z-0"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/15 blur-[140px] rounded-full animate-pulse z-0" style="animation-delay: 2s;"></div>
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem] z-0 opacity-40"></div>
      
      <!-- Top Brand Tag -->
      <div class="relative z-10 flex items-center gap-3">
        <span class="px-3.5 py-1.5 text-[11px] font-bold tracking-widest text-[#f5a623] bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-full font-mono uppercase shadow-[0_0_15px_rgba(245,166,35,0.2)] flex items-center gap-2">
          <Zap class="w-3.5 h-3.5 text-[#f5a623] fill-[#f5a623]" />
          GSP OPERACIONES v2.5
        </span>
        <span class="text-xs text-slate-400 font-medium">&bull; LeanGlobal Platform</span>
      </div>

      <!-- Main Slogan & Industrial Hero Statement -->
      <div class="relative z-10 space-y-6 max-w-xl my-auto py-8">
        <div class="space-y-3">
          <h1 class="text-4xl sm:text-5xl font-black font-display tracking-tight leading-[1.15]">
            Poder Operativo.<br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#f5a623] via-amber-400 to-[#22d3ee]">
              Control Total de Izaje.
            </span>
          </h1>
          <p class="text-slate-300 text-sm leading-relaxed font-normal drop-shadow">
            Plataforma inteligente de gestión de faena, telemetría IoT en tiempo real y estándar de seguridad de clase mundial.
          </p>
        </div>

        <!-- Telemetry Live Badges (KPIs) -->
        <div class="grid grid-cols-2 gap-4 pt-4">
          <div class="p-4 bg-[#0c1220]/80 border border-white/10 rounded-2xl backdrop-blur-md hover:border-[#22d3ee]/40 transition-all group shadow-lg">
            <div class="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Disponibilidad Flota</span>
              <Activity class="w-4 h-4 text-[#22d3ee] group-hover:scale-110 transition-transform" />
            </div>
            <div class="text-2xl font-black text-[#22d3ee] font-mono tracking-tight">99.8%</div>
            <div class="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              En tiempo real
            </div>
          </div>

          <div class="p-4 bg-[#0c1220]/80 border border-white/10 rounded-2xl backdrop-blur-md hover:border-[#f5a623]/40 transition-all group shadow-lg">
            <div class="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Estándar Seguridad</span>
              <ShieldCheck class="w-4 h-4 text-[#f5a623] group-hover:scale-110 transition-transform" />
            </div>
            <div class="text-2xl font-black text-[#f5a623] font-mono tracking-tight">ISO 45001</div>
            <div class="text-[10px] text-amber-400/80 mt-1 font-medium">Rigging Level 5 Certificado</div>
          </div>
        </div>
      </div>

      <!-- Left Footer -->
      <div class="relative z-10 text-xs text-slate-400 font-medium flex items-center justify-between">
        <span>&copy; 2026 Grúas San Pablo &bull; Todos los derechos reservados</span>
        <span class="flex items-center gap-1.5 text-slate-300">
          <Cpu class="w-3.5 h-3.5 text-[#22d3ee]" /> Telemetría IoT Conectada
        </span>
      </div>
    </div>

    <!-- RIGHT SIDE: SSO Google Authentication Card (40% on desktop) -->
    <div class="flex lg:col-span-5 items-center justify-center p-6 sm:p-12 bg-[#060a14] relative">
      <!-- Background Ambient Glow -->
      <div class="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent opacity-50"></div>

      <div class="w-full max-w-md p-8 sm:p-10 bg-[#0c1220]/95 border border-white/10 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl relative z-10 space-y-8">
        
        <!-- Header & Live Status -->
        <div class="text-center space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sistema Operativo Online
          </div>
          
          <div class="space-y-1">
            <h2 class="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">Grúas San Pablo</h2>
            <p class="text-xs text-slate-400 font-medium">Acceso a LeanGlobal Platform</p>
          </div>
        </div>

        <!-- Google SSO Box -->
        <div class="space-y-5 pt-2">
          <p class="text-[11px] text-slate-400 text-center leading-relaxed px-2">
            Inicia sesión con tu cuenta corporativa <span class="text-amber-400 font-semibold">@arriendosanpablo.cl</span> o correo de operador autorizado.
          </p>

          <!-- GIS Google Container (Clean 100% integrated layout) -->
          <div class="w-full flex justify-center items-center py-1">
            <div ref="googleBtnRef" class="w-full flex justify-center"></div>
          </div>

          <!-- Security Badge -->
          <div class="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium pt-1">
            <Lock class="w-3.5 h-3.5 text-emerald-500" />
            <span>Acceso Cifrado SSL / TLS 256-bit OAuth 2.0</span>
          </div>

          <!-- Error Notification -->
          <transition enter-active-class="transition duration-200" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
            <div v-if="error" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-xs text-red-400 font-semibold flex items-center justify-center gap-2">
              <span>{{ error }}</span>
            </div>
          </transition>
        </div>

        <!-- Footer Footer Info -->
        <div class="text-center border-t border-white/5 pt-6 text-[10px] text-slate-500 font-medium space-y-1">
          <p>¿Problemas para acceder? Contacta a la Mesa de Ayuda</p>
          <p class="text-[9px] font-bold uppercase tracking-widest text-slate-600">LeanGlobal Product &bull; GSP v2.5</p>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ShieldCheck, Zap, Lock, Activity, Cpu } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const { error, googleBtnRef } = useAuth()
</script>
