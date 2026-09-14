<template>
  <div class="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[#030609] text-[#f8fafc] font-sans overflow-hidden select-none">
    
    <!-- LEFT SIDE: Industrial Hero & Telemetry (60% on desktop) -->
    <div class="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 overflow-hidden border-r border-white/5">
      <!-- Blueprint CAD Técnico de Izaje Industrial -->
      <div class="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="/img/hero_crane_dark.jpg" 
          alt="Blueprint Técnico Grúa Telescópica GSP" 
          class="w-full h-full object-cover object-center filter brightness-110 contrast-125"
        />
        <!-- Vignette suave que mantiene el plano brillante y nítido -->
        <div class="absolute inset-0 bg-gradient-to-r from-[#030609]/70 via-transparent to-[#030609]/70"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-[#030609]/50 via-transparent to-[#030609]/60"></div>
      </div>

      <!-- Background Ambient Glows & Technical Grid -->
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/15 blur-[140px] rounded-full animate-pulse z-0"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/15 blur-[140px] rounded-full animate-pulse z-0" style="animation-delay: 2s;"></div>
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem] z-0 opacity-40"></div>
      
      <!-- Placa Técnica Corporativa San Pablo (Arriba Izquierda) -->
      <div class="relative z-10 max-w-xl pt-2 space-y-4">
        <div class="flex items-center gap-3">
          <img src="/logo-sanpablo.png" alt="San Pablo Arriendo de Maquinarias" class="h-10 w-auto object-contain brightness-110 drop-shadow-md" />
        </div>

        <div class="space-y-1.5">
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white font-display leading-tight">
            Servicios de Izaje <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
              &amp; Maquinaria de Alto Tonelaje
            </span>
          </h1>
          <p class="text-slate-300 text-sm sm:text-base font-normal leading-relaxed max-w-lg pt-1">
            Plataforma integral para la gestión de flota, control de acreditaciones y procesos operativos E2E de transformación digital.
          </p>
        </div>

        <!-- 5 Pilares Operativos Oficiales -->
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <span class="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-lg">CRM</span>
          <span class="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-slate-200 bg-white/5 border border-white/10 rounded-lg">Gestión de Flota</span>
          <span class="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-lg">Mantenimiento y Gestión de Activos</span>
          <span class="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-slate-200 bg-white/5 border border-white/10 rounded-lg">Acreditación Transversal</span>
          <span class="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg">Operación E2E Digital</span>
        </div>
      </div>

      <!-- Left Footer -->
      <div class="relative z-10 text-xs text-slate-400 font-medium flex items-center justify-between">
        <span>Powered by <span class="text-slate-200 font-semibold">LeanGlobal</span></span>
        <span class="text-slate-500 font-mono text-[10px]">v{{ appVersion }}</span>
      </div>
    </div>

    <!-- RIGHT SIDE: SSO Google Authentication Card (40% on desktop) -->
    <div class="flex lg:col-span-5 items-center justify-center p-6 sm:p-12 bg-[#060a14] relative">
      <!-- Background Ambient Glow -->
      <div class="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent opacity-50"></div>

      <div class="w-full max-w-md p-8 sm:p-10 bg-[#0c1220]/95 border border-white/10 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl relative z-10 space-y-8">
        
        <!-- Header -->
        <div class="text-center space-y-1.5">
          <h2 class="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">Grúas San Pablo</h2>
          <p class="text-xs text-slate-400 font-medium">Inicia sesión con tu cuenta corporativa</p>
        </div>

        <!-- Google SSO Box -->
        <div class="space-y-4 pt-2">
          <!-- GIS Google Container (Clean 100% integrated layout) -->
          <div class="w-full flex justify-center items-center py-1">
            <div ref="googleBtnRef" class="w-full flex justify-center"></div>
          </div>

          <!-- Error Notification -->
          <transition enter-active-class="transition duration-200" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
            <div v-if="error" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-xs text-red-400 font-semibold flex items-center justify-center gap-2">
              <span>{{ error }}</span>
            </div>
          </transition>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'

const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.36'
const { error, googleBtnRef } = useAuth()
</script>
