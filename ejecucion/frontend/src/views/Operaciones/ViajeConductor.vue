<template>
  <div class="min-h-screen bg-[#050810] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
    <!-- BARRA SUPERIOR DE ALTO CONTRASTE CON ESTADO DE RED -->
    <header class="bg-[#0a0f1e] border-b border-white/10 px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-lg shadow-black/50">
      <div class="flex items-center gap-2">
        <div class="w-2.5 h-2.5 rounded-full" :class="isOnline ? 'bg-emerald-400' : 'bg-amber-400'"></div>
        <div>
          <span class="text-xs font-black tracking-wider uppercase text-amber-400">GSP OPERACIONES</span>
          <span class="text-[10px] text-slate-400 block font-mono">Hoja de Ruta & Convoy</span>
        </div>
      </div>

      <!-- Badge de Estado de Red / Sincronización Minimalista -->
      <div class="flex items-center gap-1.5">
        <span v-if="!isOnline" class="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
          <span>📡</span> Modo Offline
        </span>
        <span v-else-if="mutacionesPendientesCount > 0" class="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
          <span>🔄</span> Sincronizando
        </span>
        <span v-else class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
          <span>🟢</span> Conectado
        </span>
      </div>
    </header>

    <!-- CUERPO PRINCIPAL DEL MÓVIL -->
    <main class="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">

      <!-- FRANJA DISTINTIVA: ORDEN DE MOVIMIENTO INTERNO GSP (SPEC 87) -->
      <div
        v-if="esMovimientoInterno"
        class="bg-amber-500/15 border-2 border-dashed border-amber-400 rounded-2xl p-3.5 shadow-lg space-y-1.5"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] font-black uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
            <span>🔁</span>
            <span>ORDEN DE MOVIMIENTO INTERNO GSP (NO FACTURABLE)</span>
          </span>
          <span class="text-[9px] font-mono font-bold bg-amber-500 text-black px-2 py-0.5 rounded uppercase">
            COSTO PROPIO
          </span>
        </div>
        <div class="text-xs font-mono font-bold text-white flex items-center gap-1.5">
          <span>📍</span>
          <span class="truncate">{{ viaje.sucursal_origen || viaje.origen_nombre || 'Base Origen GSP' }}</span>
          <span class="text-amber-400">➔</span>
          <span class="truncate text-amber-300">{{ viaje.sucursal_destino || viaje.obra_nombre || 'Sucursal Destino GSP' }}</span>
        </div>
        <p class="text-[10px] text-slate-300">
          Traslado interno entre sucursales/taller. Al arribar a destino no requiere firma de cliente externo (cierre directo para ITS de Costos).
        </p>
      </div>
      
      <!-- TARJETA DEL EQUIPO & DESTINO (DATOS REALES) -->
      <div
        class="bg-[#0a0f1e] rounded-2xl p-4 shadow-xl space-y-3"
        :class="esMovimientoInterno ? 'border-l-4 border-dashed border-amber-400 border border-amber-500/30' : 'border border-white/10'"
      >
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
              {{ viaje.tipo_equipo || 'EQUIPO DE FLOTA' }}
            </span>
            <h1 class="text-lg font-black text-white mt-1 font-mono tracking-tight">
              🚜 {{ viaje.patente || 'S/P' }}
            </h1>
            <p class="text-xs text-slate-300">{{ viaje.modelo || 'Maquinaria de Izaje GSP' }}</p>
          </div>
          <div class="text-right font-mono">
            <span class="text-[10px] text-slate-400 block">OT / Proyecto</span>
            <span class="text-xs font-bold text-amber-400">{{ viaje.codigo_proyecto || 'GSP-OT' }}</span>
          </div>
        </div>

        <div class="bg-black/40 border border-white/5 rounded-xl p-3 space-y-1.5 text-xs">
          <!-- Origen si es Retorno -->
          <div v-if="viaje.tipo_trayecto === 'RETORNO'" class="flex items-center gap-2 text-slate-300">
            <span class="text-amber-400">🏭</span>
            <span class="font-semibold text-white">Origen:</span>
            <span class="truncate">{{ viaje.origen_nombre || viaje.obra_nombre || 'Faena Mandante' }}</span>
          </div>

          <div class="flex items-center gap-2 text-slate-300">
            <span class="text-emerald-400">📍</span>
            <span class="font-semibold text-white">Destino:</span>
            <span class="truncate">{{ viaje.tipo_trayecto === 'RETORNO' ? (viaje.destino_nombre || 'Patio Central San Pablo - Base GSP') : (viaje.obra_nombre || 'Obra Mandante') }}</span>
          </div>
          <div class="flex items-center gap-2 text-slate-400 text-[11px] pl-5">
            <span class="truncate">{{ viaje.tipo_trayecto === 'RETORNO' ? (viaje.destino_direccion || 'Panamericana Norte #1020, Santiago') : (viaje.obra_direccion || 'Dirección de Faena') }}</span>
          </div>
          <div class="flex items-center gap-2 text-slate-300 border-t border-white/5 pt-1.5 mt-1.5">
            <span class="text-emerald-400">👷</span>
            <span class="font-semibold text-white">Conductor:</span>
            <span class="text-emerald-300 font-bold">{{ viaje.chofer_nombre || 'Sergio Gajardo' }}</span>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- PASO 1: SALIDA DE PATIO (ACTIVO vs BLOQUEADO SOLO LECTURA)                  -->
      <!-- ========================================================================= -->
      <!-- CASO A: BLOQUEADO (YA SALIÓ DE BASE) -->
      <div v-if="viaje.estado_viaje !== 'ASIGNADO'" class="bg-[#0a0f1e] border border-emerald-500/30 rounded-2xl p-4 shadow-lg space-y-2.5">
        <div class="flex items-center justify-between border-b border-white/10 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-emerald-400 font-bold text-sm">🔒</span>
            <div>
              <h2 class="text-xs font-bold text-white uppercase tracking-wider font-mono">1. Salida de Base (Registrada)</h2>
              <span class="text-[10px] text-emerald-400 font-medium font-mono">Firma PIN Validada Conforme</span>
            </div>
          </div>
          <span class="text-[10px] text-slate-400 font-mono">{{ formatFechaHora(viaje.timestamp_inicio) }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/40 p-2.5 rounded-xl border border-white/5">
          <div>Odóm. Inicial: <strong class="text-amber-400 font-bold">{{ viaje.odometro_salida }} KM</strong></div>
          <div>Horóm. Inicial: <strong class="text-amber-400 font-bold">{{ viaje.horometro_salida }} HRS</strong></div>
        </div>
        <!-- Fotos de Salida (Odómetro y Horómetro) -->
        <div class="grid grid-cols-2 gap-2 mt-1">
          <div v-if="viaje.foto_odometro_salida || viaje.foto_salida" class="space-y-1">
            <span class="text-[9px] text-slate-400 font-mono block">Foto Odómetro:</span>
            <img :src="viaje.foto_odometro_salida || viaje.foto_salida" alt="Odómetro Salida" class="h-24 w-full object-cover rounded-xl border border-white/10" />
          </div>
          <div v-if="viaje.foto_horometro_salida" class="space-y-1">
            <span class="text-[9px] text-slate-400 font-mono block">Foto Horómetro:</span>
            <img :src="viaje.foto_horometro_salida" alt="Horómetro Salida" class="h-24 w-full object-cover rounded-xl border border-white/10" />
          </div>
        </div>
      </div>

      <!-- CASO B: FORMULARIO ACTIVO (SOLO ANTES DE SALIR) -->
      <div v-else class="bg-[#0a0f1e] border border-amber-500/30 rounded-2xl p-4 shadow-xl space-y-4">
        <div class="flex items-center gap-2 border-b border-white/10 pb-2">
          <span class="text-base">🚀</span>
          <div>
            <h2 class="text-sm font-bold text-white uppercase tracking-wider">
              {{ viaje.tipo_trayecto === 'RETORNO' ? 'Paso 1: Salida de Faena hacia Base GSP' : 'Paso 1: Salida de Base / Patio' }}
            </h2>
            <p class="text-[11px] text-slate-400">
              {{ viaje.tipo_trayecto === 'RETORNO' ? 'Registra odómetro, horómetro del camión con sus 2 fotos y firma para iniciar retorno.' : 'Registra odómetro, horómetro del camión con sus 2 fotos y firma para iniciar el convoy.' }}
            </p>
            <a
              :href="urlManualOperador"
              target="_blank"
              class="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-mono underline underline-offset-2 mt-1"
            >
              <span>📖</span>
              <span>¿Dudas con los marcadores? Ver Matriz Oficial</span>
            </a>
          </div>
        </div>

        <div class="space-y-3">
          <!-- 1. Odómetro Camión -->
          <div class="bg-black/30 border border-white/10 rounded-xl p-3 space-y-2">
            <div>
              <label class="block text-xs font-bold text-slate-200 mb-1">1. Odómetro de Salida (KM) *</label>
              <input type="number" step="0.1" v-model="formSalida.odometro" placeholder="Ej: 145820.5" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2.5 text-base text-white font-mono font-bold outline-none focus:border-amber-400" />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-amber-300 mb-1">📸 Foto Odómetro Camión (KM) *</label>
              <div v-if="formSalida.foto_odometro" class="relative rounded-xl overflow-hidden border border-emerald-500/50">
                <img :src="formSalida.foto_odometro" alt="Odómetro Salida" class="w-full h-32 object-cover" />
                <button @click="formSalida.foto_odometro = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">✕ Quitar</button>
              </div>
              <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-amber-400 rounded-xl p-3 cursor-pointer bg-black/40 transition-colors">
                <span class="text-xl mb-0.5">📸</span>
                <span class="text-xs font-bold text-amber-400">Tomar Foto del Odómetro (Tacógrafo)</span>
                <span class="text-[9px] text-slate-400">Captura clara de los kilómetros de salida</span>
                <input type="file" accept="image/*" capture="environment" @change="onFotoOdometroSalida" class="hidden" />
              </label>
            </div>
          </div>

          <!-- 2. Horómetro Camión -->
          <div class="bg-black/30 border border-white/10 rounded-xl p-3 space-y-2">
            <div>
              <label class="block text-xs font-bold text-slate-200 mb-1">2. Horómetro Motor Camión / Chasis (HRS) *</label>
              <input type="number" step="0.1" v-model="formSalida.horometro" placeholder="Ej: 3240.2" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2.5 text-base text-white font-mono font-bold outline-none focus:border-amber-400" />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-amber-300 mb-1">📸 Foto Horómetro Motor Camión (HRS) *</label>
              <div v-if="formSalida.foto_horometro" class="relative rounded-xl overflow-hidden border border-emerald-500/50">
                <img :src="formSalida.foto_horometro" alt="Horómetro Salida" class="w-full h-32 object-cover" />
                <button @click="formSalida.foto_horometro = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">✕ Quitar</button>
              </div>
              <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-amber-400 rounded-xl p-3 cursor-pointer bg-black/40 transition-colors">
                <span class="text-xl mb-0.5">📸</span>
                <span class="text-xs font-bold text-amber-400">Tomar Foto del Horómetro del Motor</span>
                <span class="text-[9px] text-slate-400">Captura clara de las horas del motor chasis</span>
                <input type="file" accept="image/*" capture="environment" @change="onFotoHorometroSalida" class="hidden" />
              </label>
            </div>

            <!-- Botón de Asistencia: Misma foto si están juntos en el display -->
            <button
              v-if="formSalida.foto_odometro && !formSalida.foto_horometro"
              @click="copiarFotoOdometroAHorometroSalida"
              type="button"
              class="w-full py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>📋</span> ¿Mismo display digital? Usar la foto del odómetro para el horómetro
            </button>
            <button
              v-else-if="formSalida.foto_horometro && !formSalida.foto_odometro"
              @click="copiarFotoHorometroAOdometroSalida"
              type="button"
              class="w-full py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>📋</span> ¿Mismo display digital? Usar la foto del horómetro para el odómetro
            </button>
          </div>

          <!-- 3. Nivel de Combustible al Salir de Patio (Base GSP) -->
          <div class="bg-black/30 border border-white/10 rounded-xl p-3 space-y-2">
            <label class="block text-xs font-bold text-slate-200 mb-1">3. Nivel de Combustible al Salir de Patio *</label>
            <select v-model="formSalida.combustible_salida" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white font-mono outline-none focus:border-amber-400">
              <option value="" disabled>Seleccione nivel (1% a 100%)...</option>
              <option v-for="pct in nivelesCombustible" :key="pct" :value="pct">{{ pct }}</option>
            </select>
            <div class="pt-1">
              <label class="block text-[11px] font-bold text-slate-400 mb-1">📸 Foto Marcador Combustible Salida (Opcional)</label>
              <div v-if="formSalida.foto_combustible" class="relative rounded-xl overflow-hidden border border-emerald-500/50">
                <img :src="formSalida.foto_combustible" alt="Combustible Salida" class="w-full h-24 object-cover" />
                <button @click="formSalida.foto_combustible = ''" type="button" class="absolute top-1 right-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs">✕</button>
              </div>
              <label v-else class="flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-amber-400 rounded-xl p-2 cursor-pointer bg-black/40 text-xs text-amber-400 font-bold">
                <span>📸 Adjuntar Foto Marcador</span>
                <input type="file" accept="image/*" capture="environment" @change="onFotoCombustibleSalida" class="hidden" />
              </label>
            </div>
          </div>

          <!-- PIN de Firma del Conductor -->
          <div class="bg-black/50 border border-white/10 rounded-xl p-3">
            <label class="block text-xs font-bold text-amber-400 mb-1">PIN del Conductor (4 Dígitos) *</label>
            <input type="password" maxlength="4" v-model="formSalida.pin" placeholder="••••" class="w-full bg-[#050810] border border-amber-500/40 rounded-xl px-3 py-3 text-center text-xl tracking-[0.5em] text-white font-mono font-black outline-none focus:border-amber-400" />
            <p class="text-[10px] text-slate-400 mt-1 text-center">Firma digital FES de conformidad de salida.</p>
          </div>
        </div>

        <!-- Alerta de Candado si es Retorno de Plataforma y no se ha sellado el Acta de Retiro -->
        <div v-if="esServicioPlataformaBsm && viaje.tipo_trayecto === 'RETORNO' && !actaBsm?.retiro_sellado" class="bg-red-500/15 border border-red-500/40 rounded-xl p-3 text-center text-xs text-red-200 font-bold">
          🔒 BLOQUEADO POR CANDADO SPEC-081: Debe sellar arriba el Acta de Recuperación 360° con la firma manual del cliente antes de iniciar el viaje de retorno.
        </div>

        <!-- Indicador reactivo de requisitos pendientes -->
        <div v-if="!isFormSalidaValido" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-center text-xs space-y-1">
          <p class="font-bold text-amber-300">Requisitos para autorizar e iniciar:</p>
          <div class="flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <span :class="formSalida.odometro ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ formSalida.odometro ? '✓' : '⚠️' }} Odómetro
            </span>
            <span class="text-slate-600">•</span>
            <span :class="formSalida.foto_odometro ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ formSalida.foto_odometro ? '✓' : '⚠️' }} Foto Odóm.
            </span>
            <span class="text-slate-600">•</span>
            <span :class="formSalida.horometro ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ formSalida.horometro ? '✓' : '⚠️' }} Horómetro
            </span>
            <span class="text-slate-600">•</span>
            <span :class="formSalida.foto_horometro ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ formSalida.foto_horometro ? '✓' : '⚠️' }} Foto Horóm.
            </span>
            <span class="text-slate-600">•</span>
            <span :class="formSalida.combustible_salida ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ formSalida.combustible_salida ? '✓' : '⚠️' }} Combustible
            </span>
            <span class="text-slate-600">•</span>
            <span :class="(formSalida.pin && formSalida.pin.length === 4) ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ (formSalida.pin && formSalida.pin.length === 4) ? '✓' : '⚠️' }} PIN ({{ formSalida.pin ? formSalida.pin.length : 0 }}/4)
            </span>
          </div>
        </div>

        <button @click="ejecutarInicioViaje" :disabled="guardando || !isFormSalidaValido || (esServicioPlataformaBsm && viaje.tipo_trayecto === 'RETORNO' && !actaBsm?.retiro_sellado)" type="button" class="w-full min-h-[58px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-sm uppercase rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer">
          <span v-if="guardando">⏳ Registrando...</span>
          <span v-else>{{ viaje.tipo_trayecto === 'RETORNO' ? '🟢 INICIAR RETORNO (SALIDA DE FAENA)' : '🟢 INICIAR VIAJE (SALIDA DE BASE)' }}</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- PASO 2: EN RUTA Y LLEGADA (ACTIVO vs BLOQUEADO SOLO LECTURA)               -->
      <!-- ========================================================================= -->
      <!-- CASO A: BLOQUEADO (YA ARRIBÓ A FAENA) -->
      <div v-if="viaje.estado_viaje === 'ARRIBADO_FAENA'" class="bg-[#0a0f1e] border border-emerald-500/30 rounded-2xl p-4 shadow-lg space-y-2.5">
        <div class="flex items-center justify-between border-b border-white/10 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-emerald-400 font-bold text-sm">🏁</span>
            <div>
              <h2 class="text-xs font-bold text-white uppercase tracking-wider font-mono">2. Arribo a Faena (Completado)</h2>
              <span class="text-[10px] text-emerald-400 font-medium font-mono">Viaje y Trayecto Cerrado Conforme</span>
            </div>
          </div>
          <span class="text-[10px] text-slate-400 font-mono">{{ formatFechaHora(viaje.timestamp_llegada) }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/40 p-2.5 rounded-xl border border-white/5">
          <div>Odóm. Llegada: <strong class="text-emerald-400 font-bold">{{ viaje.odometro_llegada || '---' }} KM</strong></div>
          <div>Horóm. Llegada: <strong class="text-emerald-400 font-bold">{{ viaje.horometro_llegada || '---' }} HRS</strong></div>
        </div>
        <div v-if="viaje.combustible_salida || viaje.combustible_llegada" class="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1 text-[11px] font-mono">
          <span class="text-amber-400 font-bold block text-[10px] uppercase">⛽ Balance Combustible Traslado:</span>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-slate-400 block text-[9px]">Salida:</span>
              <span class="text-white font-bold">Chasis: {{ viaje.combustible_salida?.chasis || '--' }}</span>
              <span v-if="viaje.combustible_salida?.grua" class="text-slate-300 block text-[9px]">Grúa: {{ viaje.combustible_salida.grua }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[9px]">Llegada:</span>
              <span class="text-emerald-400 font-bold">Chasis: {{ viaje.combustible_llegada?.chasis || '--' }}</span>
              <span v-if="viaje.combustible_llegada?.grua" class="text-emerald-300 block text-[9px]">Grúa: {{ viaje.combustible_llegada.grua }}</span>
            </div>
          </div>
        </div>
        <p v-if="viaje.obs_termino" class="text-[11px] text-slate-300 italic bg-black/30 p-2 rounded-lg border border-white/5">
          "{{ viaje.obs_termino }}"
        </p>
        <!-- Fotos de Llegada -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
          <div v-if="viaje.foto_odometro_llegada || viaje.foto_llegada" class="space-y-1">
            <span class="text-[9px] text-slate-400 font-mono block">Odómetro Llegada:</span>
            <img :src="viaje.foto_odometro_llegada || viaje.foto_llegada" alt="Odómetro Llegada" class="h-20 w-full object-cover rounded-xl border border-white/10" />
          </div>
          <div v-if="viaje.foto_horometro_camion_llegada" class="space-y-1">
            <span class="text-[9px] text-slate-400 font-mono block">Horómetro Camión:</span>
            <img :src="viaje.foto_horometro_camion_llegada" alt="Horómetro Camión" class="h-20 w-full object-cover rounded-xl border border-white/10" />
          </div>
          <div v-if="viaje.foto_horometro_grua_llegada" class="space-y-1">
            <span class="text-[9px] text-amber-300 font-mono block">Horómetro Grúa:</span>
            <img :src="viaje.foto_horometro_grua_llegada" alt="Horómetro Grúa" class="h-20 w-full object-cover rounded-xl border border-amber-500/40" />
          </div>
          <div v-if="viaje.combustible_llegada?.foto" class="space-y-1">
            <span class="text-[9px] text-emerald-400 font-mono block">Combustible:</span>
            <img :src="viaje.combustible_llegada.foto" alt="Combustible Llegada" class="h-20 w-full object-cover rounded-xl border border-emerald-500/30" />
          </div>
        </div>
      </div>

      <!-- CASO B: ACTIVO EN RUTA -->
      <div v-else-if="viaje.estado_viaje === 'EN_RUTA'" class="bg-[#0a0f1e] border border-blue-500/40 rounded-2xl p-4 shadow-xl space-y-3.5">
        <div class="flex items-center justify-between border-b border-white/10 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-blue-400 text-base">⏱️</span>
            <div>
              <h2 class="text-xs font-bold text-white uppercase tracking-wider font-mono">
                {{ viaje.tipo_trayecto === 'RETORNO' ? '2. Convoy en Retorno a Base' : '2. Convoy en Ruta' }}
              </h2>
              <span class="text-[10px] text-blue-400 font-medium">
                {{ viaje.tipo_trayecto === 'RETORNO' ? 'Hacia Patio Central San Pablo' : ('Hacia ' + (viaje.obra_nombre || 'Faena')) }}
              </span>
            </div>
          </div>
          <div class="bg-blue-500/20 border border-blue-500/40 px-3 py-1 rounded-lg text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span>{{ tiempoEnRuta }}</span>
          </div>
        </div>

        <!-- Botón Rendir Carga Combustible -->
        <button @click="abrirModalCombustible" type="button" class="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
          <span>⛽ Rendir Carga de Combustible (Copec)</span>
        </button>

        <!-- Botón Principal: Confirmar Llegada a Faena / Patio -->
        <button @click="abrirModalLlegada" type="button" class="w-full min-h-[54px] bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer">
          <span>{{ viaje.tipo_trayecto === 'RETORNO' ? '🏁 CONFIRMAR LLEGADA A PATIO CENTRAL GSP' : '🏁 CONFIRMAR LLEGADA A FAENA' }}</span>
        </button>

        <!-- Enlace Sutil: Consultar Datos de Salida -->
        <div class="text-center pt-1">
          <button @click="mostrarModalDatosSalida = true" type="button" class="text-[11px] text-slate-400 hover:text-white underline underline-offset-4 font-mono transition-colors">
            👁️ Consultar Datos Registrados de Salida
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- ESTADO 3: EN FAENA & EMISIÓN EXCLUSIVA DE REPORT DIARIO                   -->
      <!-- ========================================================================= -->
      <!-- ========================================================================= -->
      <!-- ESTADO 3: EN FAENA O RETORNADO A PATIO (TRASLADO CUMPLIDO)                -->
      <!-- ========================================================================= -->
      <div v-if="viaje.estado_viaje === 'ARRIBADO_FAENA'" class="space-y-4">
        
        <!-- RESUMEN DE ARRIBO CONFORME -->
        <div class="bg-[#0a0f1e] border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-center">
          <div class="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center mx-auto text-3xl">
            🏁
          </div>

          <!-- CASO RETORNO: PATIO CENTRAL SAN PABLO -->
          <div v-if="viaje.tipo_trayecto === 'RETORNO'" class="space-y-1">
            <span class="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded font-black tracking-wider">
              SERVICIO OPERACIONAL CONCLUIDO
            </span>
            <h2 class="text-base font-black text-white uppercase tracking-wider font-mono mt-1">
              Retorno a Base Central San Pablo Concluido
            </h2>
            <p class="text-xs text-slate-300">
              La maquinaria <strong>{{ viaje.patente }}</strong> ha ingresado conforme a Patio Central San Pablo. El servicio ha finalizado con éxito y el equipo queda <strong>DISPONIBLE</strong>.
            </p>
          </div>

          <!-- CASO MOVIMIENTO INTERNO GSP (SPEC 87): IDA CONCLUIDA, HABILITAR RETORNO (VUELTA) -->
          <div v-else-if="esMovimientoInterno" class="space-y-1">
            <span class="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-400/50 px-2.5 py-0.5 rounded font-black tracking-wider">
              🔁 TRAMO DE IDA CONCLUIDO • SUCURSAL DESTINO
            </span>
            <h2 class="text-base font-black text-white uppercase tracking-wider font-mono mt-1">
              Arribo a {{ viaje.sucursal_destino || viaje.obra_nombre }} Confirmado
            </h2>
            <p class="text-xs text-slate-300">
              El equipo <strong>{{ viaje.patente }}</strong> ha registrado su llegada en <strong>{{ viaje.sucursal_destino || viaje.obra_nombre }}</strong>. Cuando inicies el regreso a <strong>{{ viaje.sucursal_origen || 'Sucursal Origen' }}</strong>, presiona el botón inferior para registrar el <strong>Viaje de Vuelta (Retorno)</strong>.
            </p>
          </div>

          <!-- CASO IDA: ARRIBADO A FAENA MANDANTE -->
          <div v-else class="space-y-1">
            <span class="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded font-black tracking-wider">
              PASO 1 CUMPLIDO • LISTO PARA OPERAR
            </span>
            <h2 class="text-base font-black text-white uppercase tracking-wider font-mono mt-1">
              Traslado de Convoy Arribado a Faena
            </h2>
            <p class="text-xs text-slate-300">
              El equipo <strong>{{ viaje.patente }}</strong> se encuentra posicionado en la obra <strong>{{ viaje.obra_nombre }}</strong>. Tu siguiente paso es iniciar el Report Diario de Faena.
            </p>
          </div>

          <div class="bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono space-y-1 text-slate-300 text-left">
            <div class="flex justify-between">
              <span>⏱️ Odómetro Llegada:</span>
              <strong class="text-emerald-400">{{ viaje.odometro_llegada || viaje.km_final || '---' }} KM</strong>
            </div>
            <div class="flex justify-between">
              <span>⏳ Horómetro Llegada:</span>
              <strong class="text-emerald-400">{{ viaje.horometro_llegada || viaje.horometro_final || '---' }} HRS</strong>
            </div>
            <div v-if="viaje.timestamp_llegada" class="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
              <span>Fecha / Hora Arribo:</span>
              <span>{{ formatFechaHora(viaje.timestamp_llegada) }}</span>
            </div>
          </div>

          <!-- BOTONES DE ACCIÓN SEGÚN TIPO DE TRAYECTO -->
          <div class="pt-2 space-y-2">
            <!-- Si es Retorno concluido: volver a la PWA / Menú Principal -->
            <a
              v-if="viaje.tipo_trayecto === 'RETORNO'"
              :href="urlHomePwa"
              class="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 no-underline cursor-pointer"
            >
              <span>🏠</span>
              <span>VIAJE IDA Y VUELTA CONCLUIDO • VOLVER AL MENÚ PWA ➔</span>
            </a>

            <!-- Si es Ida de Requerimiento Interno: botón para iniciar Viaje de Vuelta (Retorno) -->
            <template v-else-if="esMovimientoInterno">
              <button
                @click="iniciarViajeRetornoInterno"
                :disabled="iniciandoRetorno"
                type="button"
                class="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-xs uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <span v-if="iniciandoRetorno" class="animate-spin">⏳</span>
                <span v-else>🔄</span>
                <span>{{ iniciandoRetorno ? 'GENERANDO HOJA DE VUELTA...' : `INICIAR VIAJE DE VUELTA (RETORNO A ${viaje.sucursal_origen || 'ORIGEN'}) ➔` }}</span>
              </button>
              <a
                :href="urlHomePwa"
                class="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[11px] uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/10 no-underline cursor-pointer"
              >
                <span>🏠</span>
                <span>Volver al Menú Principal</span>
              </a>
            </template>

            <!-- Si es Ida Comercial: avanzar al Report Diario de Faena o al Acta de Entrega 360° de Plataforma en PWA -->
            <template v-else>
              <a
                v-if="esServicioPlataformaBsm"
                :href="`${urlHomePwa}?abrir_acta_bsm=ENTREGA&id_proyecto=${viaje.id_proyecto || ''}`"
                class="w-full py-4 bg-teal-500 hover:bg-teal-400 text-black font-black text-xs uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 no-underline cursor-pointer"
              >
                <span>📋</span>
                <span>PASO 2: COMPLETAR ACTA DE ENTREGA 360° DE PLATAFORMA (PWA) ➔</span>
              </a>
              <a
                v-else
                :href="urlRetornoReport"
                class="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 no-underline cursor-pointer"
              >
                <span>📋</span>
                <span>PASO 2: INICIAR REPORT DIARIO DE FAENA ➔</span>
              </a>
              <a
                :href="urlHomePwa"
                class="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[11px] uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/10 no-underline cursor-pointer"
              >
                <span>🏠</span>
                <span>Volver al Menú Principal</span>
              </a>
            </template>
          </div>
        </div>

          <!-- ========================================================================= -->
          <!-- SECCIÓN 6: REPORTES DIARIOS DE IZAJE (MULTI-DÍA & FIRMA MANDANTE)         -->
          <!-- ========================================================================= -->
          <div v-if="false" class="bg-[#0a0f1e] border-2 border-amber-500/40 rounded-2xl p-4 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">📋</span>
                <div>
                  <h3 class="text-sm font-black text-white uppercase tracking-wider font-mono">Reportes Diarios de Izaje</h3>
                  <p class="text-[10px] text-amber-400 font-bold">Liquidación y firma en faena con mandante</p>
                </div>
              </div>
              <span class="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                {{ (viaje.reportes_diarios && viaje.reportes_diarios.length) || 0 }} firmado(s)
              </span>
            </div>

            <!-- LISTA DE REPORTS YA FIRMADOS -->
            <div v-if="viaje.reportes_diarios && viaje.reportes_diarios.length > 0" class="space-y-2">
              <div
                v-for="rep in viaje.reportes_diarios"
                :key="rep.id_reporte || rep.dia"
                class="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between hover:border-emerald-500/40 transition-colors"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-emerald-400 font-mono">DÍA {{ rep.dia }}</span>
                    <span class="text-[10px] text-slate-400 font-mono">{{ rep.fecha }}</span>
                    <span class="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">🟢 Firmado</span>
                  </div>
                  <div class="text-[11px] text-slate-300 font-mono">
                    Horómetro: {{ rep.horometro_inicio }} ➔ {{ rep.horometro_final }} (Δ {{ (Number(rep.horometro_final || 0) - Number(rep.horometro_inicio || 0)).toFixed(1) }}h) • {{ rep.horas_facturables }}h facturables
                  </div>
                  <div class="text-[10px] text-slate-400">
                    Firmado por: <strong class="text-white">{{ rep.mandante_nombre }}</strong> ({{ rep.mandante_cargo || 'ITO' }})
                  </div>
                </div>
                <button
                  @click="abrirVisorReporte(rep)"
                  type="button"
                  class="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>👁️</span>
                  <span>Ver</span>
                </button>
              </div>
            </div>

            <!-- BOTÓN PARA ABRIR FORMULARIO DE NUEVO DÍA -->
            <div v-if="!formularioReportAbierto">
              <button
                @click="abrirFormularioReport"
                type="button"
                class="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black font-black text-xs uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <span>✍️</span>
                <span>INICIAR / FIRMAR REPORT DIARIO (DÍA {{ proximoDiaCorrelativo }})</span>
              </button>
            </div>

            <!-- FORMULARIO DE EMISIÓN DE REPORT DIARIO (TOUCH & FIRMA MANDANTE) -->
            <div v-else class="bg-black/50 border border-amber-500/40 rounded-xl p-4 space-y-4">
              <div class="flex items-center justify-between border-b border-white/10 pb-2">
                <span class="text-xs font-black text-amber-400 font-mono uppercase">
                  Emisión de Report — Día {{ formReport.dia }} ({{ formReport.fecha }})
                </span>
                <button @click="formularioReportAbierto = false" type="button" class="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">
                  ✕ Cancelar
                </button>
              </div>

              <!-- 1. HOROMETRÍA -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-300 mb-1">Horómetro Inicial *</label>
                  <input
                    type="number"
                    step="0.1"
                    inputmode="decimal"
                    v-model="formReport.horometro_inicio"
                    class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-300 mb-1">Horómetro Término *</label>
                  <input
                    type="number"
                    step="0.1"
                    inputmode="decimal"
                    v-model="formReport.horometro_final"
                    placeholder="Ej: 3256.0"
                    class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div class="bg-white/5 p-2 rounded-lg text-xs font-mono flex justify-between text-slate-300">
                <span>Δ Horas Motor Faena:</span>
                <span class="font-bold text-amber-400">
                  {{ ((Number(formReport.horometro_final || 0) - Number(formReport.horometro_inicio || 0)) > 0 ? (Number(formReport.horometro_final) - Number(formReport.horometro_inicio)).toFixed(1) : 0) }} HRS
                </span>
              </div>

              <!-- FOTO TABLERO / HORÓMETRO EN FAENA -->
              <div>
                <label class="block text-[11px] font-bold text-slate-300 mb-1">Foto del Tablero / Horómetro en Faena *</label>
                <div v-if="formReport.foto_horometro" class="relative rounded-xl overflow-hidden border border-emerald-500/50 mb-2">
                  <img :src="formReport.foto_horometro" alt="Tablero Faena" class="w-full h-36 object-cover" />
                  <button @click="formReport.foto_horometro = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs font-bold">✕ Quitar</button>
                </div>
                <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-amber-400 rounded-xl p-3 cursor-pointer bg-black/30 transition-colors">
                  <span class="text-xl mb-0.5">📸</span>
                  <span class="text-xs font-bold text-amber-400">Tomar Foto del Tablero en Faena</span>
                  <span class="text-[10px] text-slate-400">Captura legible de horómetro final</span>
                  <input type="file" accept="image/*" capture="environment" @change="onFotoReportCapturada" class="hidden" />
                </label>
              </div>

              <!-- 2. HORARIOS Y COLACIÓN -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-300 mb-1">Hora Inicio *</label>
                  <input
                    type="time"
                    v-model="formReport.hora_inicio"
                    class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-300 mb-1">Hora Término *</label>
                  <input
                    type="time"
                    v-model="formReport.hora_termino"
                    class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <!-- SELECTOR RÁPIDO Y HORARIO DE COLACIÓN -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-[11px] font-bold text-slate-300">Horario & Tiempo de Colación</label>
                  <span class="text-[10px] font-mono text-amber-400 font-bold">
                    {{ formReport.colacion_minutos > 0 ? `${formReport.colacion_minutos} min (${(formReport.colacion_minutos / 60).toFixed(1)}h)` : 'Sin colación' }}
                  </span>
                </div>
                <div class="grid grid-cols-4 gap-1.5 text-xs font-mono font-bold">
                  <button
                    v-for="min in [0, 30, 45, 60]"
                    :key="min"
                    type="button"
                    @click="setColacionMinutos(min)"
                    class="py-2 rounded-lg border transition-all cursor-pointer text-center"
                    :class="formReport.colacion_minutos === min ? 'bg-amber-500 text-black border-amber-300 shadow font-black' : 'bg-black/40 text-slate-400 border-white/10 hover:border-white/30'"
                  >
                    {{ min === 0 ? 'Sin colación' : `${min} min` }}
                  </button>
                </div>
              </div>

              <!-- CÁLCULO REACTIVO DE HORAS -->
              <div class="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                <div>
                  <span class="text-slate-400 block text-[10px]">Horas Efectivas:</span>
                  <span class="text-white font-bold text-sm">{{ reporteHorasCalculadas.efectivas }} hrs</span>
                </div>
                <div class="text-right">
                  <span class="text-emerald-400 block text-[10px] font-bold">Horas Facturables (Mínimo Estructurador {{ reporteHorasCalculadas.pisoMinimo }}h):</span>
                  <span class="text-emerald-300 font-black text-sm">{{ reporteHorasCalculadas.facturables }} hrs</span>
                </div>
              </div>

              <!-- 3. OBSERVACIONES & MANIOBRA -->
              <div>
                <label class="block text-[11px] font-bold text-slate-300 mb-1">Maniobras de Izaje & Observaciones *</label>
                <textarea
                  v-model="formReport.maniobra_detalle"
                  rows="2"
                  placeholder="Detalle de cargas izadas, tonelajes, radios de trabajo o interferencias en faena..."
                  class="w-full bg-[#050810] border border-white/20 rounded-xl p-2.5 text-xs text-white outline-none resize-none focus:border-amber-400"
                ></textarea>
              </div>

              <!-- 4. DATOS DEL MANDANTE Y FIRMA TOUCH -->
              <div class="border-t border-white/10 pt-3 space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-300 mb-1">Nombre Mandante / ITO *</label>
                    <input
                      type="text"
                      v-model="formReport.mandante_nombre"
                      placeholder="Ej: Pedro Soto"
                      class="w-full bg-[#050810] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-300 mb-1">RUT Mandante *</label>
                    <input
                      type="text"
                      v-model="formReport.mandante_rut"
                      placeholder="Ej: 12.345.678-9"
                      class="w-full bg-[#050810] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-slate-300 mb-1">Cargo / Función Mandante</label>
                  <input
                    type="text"
                    v-model="formReport.mandante_cargo"
                    placeholder="Ej: ITO / Jefe de Obra / Supervisor"
                    class="w-full bg-[#050810] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <!-- Canvas de Firma Táctil -->
                <SignatureField
                  v-model="formReport.firma_mandante"
                  label="Firma Manuscrita del Supervisor Mandante"
                />
              </div>

              <!-- BOTÓN TRANSMITIR Y SELLAR -->
              <button
                @click="sellarYTransmitirReport"
                :disabled="!isFormReportValido || guardandoReport"
                type="button"
                class="w-full min-h-[50px] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-xs uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <span v-if="guardandoReport" class="animate-spin">⏳</span>
                <span>{{ guardandoReport ? 'Sellando y Transmitiendo...' : `🟢 Sellar y Transmitir Report Día ${formReport.dia}` }}</span>
              </button>
            </div>
          </div>
        </div>

    </main>

    <!-- ========================================================================= -->
    <!-- MODAL / SUBFLUJO: CARGA DE COMBUSTIBLE COPEC                              -->
    <!-- ========================================================================= -->
    <!-- MODAL DIRECTO: CARGA DE COMBUSTIBLE EN RUTA (SIN VALIDACIÓN DE TARJETA)   -->
    <!-- ========================================================================= -->
    <div v-if="modalCombustible.visible" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#0a0f1e] border border-amber-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">⛽</span>
            <div>
              <h3 class="text-sm font-bold text-white uppercase">Carga de Combustible</h3>
              <p class="text-[10px] text-slate-400">Ingreso directo de carga en ruta</p>
            </div>
          </div>
          <button @click="modalCombustible.visible = false" type="button" class="text-slate-400 hover:text-white p-1 text-lg">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Estanque Abastecido *</label>
            <select v-model="formCombustible.tipo_estanque" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-xs text-white font-bold outline-none focus:border-amber-400">
              <option value="PRINCIPAL_CHASIS">⛽ Estanque Principal (Chasis / Tracción)</option>
              <option value="SUPERESTRUCTURA_GRUA">⚙️ Estanque Superestructura (Grúa / Hidráulico)</option>
              <option value="AUXILIAR_RESERVA">🛢️ Estanque Auxiliar / Reserva</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Litros Cargados *</label>
              <input type="number" step="0.01" v-model="formCombustible.litros" placeholder="Ej: 250.5" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-sm text-white font-mono font-bold outline-none focus:border-amber-400" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Monto ($ CLP) *</label>
              <input type="number" v-model="formCombustible.monto" placeholder="Ej: 285000" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-sm text-white font-mono font-bold outline-none focus:border-amber-400" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Odómetro (KM)</label>
              <input type="number" step="0.1" v-model="formCombustible.odometro" :placeholder="String(viaje.odometro_salida || '145920')" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-sm text-white font-mono font-bold outline-none focus:border-amber-400" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Horómetro (HRS)</label>
              <input type="number" step="0.1" v-model="formCombustible.horometro" :placeholder="String(viaje.horometro_salida || '3245')" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-sm text-white font-mono font-bold outline-none focus:border-amber-400" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Foto Voucher / Boleta</label>
            <div v-if="formCombustible.foto_voucher" class="relative rounded-xl overflow-hidden border border-emerald-500/50 mb-2">
              <img :src="formCombustible.foto_voucher" alt="Voucher Combustible" class="w-full h-36 object-cover" />
              <button @click="formCombustible.foto_voucher = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs">✕</button>
            </div>
            <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-xl p-3 cursor-pointer bg-black/30">
              <span class="text-2xl mb-1">🧾</span>
              <span class="text-xs font-bold text-emerald-400">Tomar Foto del Voucher</span>
              <input type="file" accept="image/*" capture="environment" @change="onFotoCombustibleVoucher" class="hidden" />
            </label>
          </div>

          <button @click="confirmarRendicionCombustible" :disabled="!isFormRendicionCombustibleValido" type="button" class="w-full min-h-[50px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-black font-black text-xs uppercase rounded-xl tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20">
            Confirmar Carga de Combustible
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: CONFIRMAR LLEGADA A FAENA                                          -->
    <!-- ========================================================================= -->
    <div v-if="modalLlegada.visible" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#0a0f1e] border border-emerald-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">🏁</span>
            <div>
              <h3 class="text-sm font-bold text-white uppercase">
                {{ viaje.tipo_trayecto === 'RETORNO' ? 'Confirmación de Llegada a Patio Central San Pablo' : 'Confirmación de Llegada a Faena' }}
              </h3>
              <p class="text-[10px] text-slate-400">
                {{ viaje.tipo_trayecto === 'RETORNO' ? 'Recepción de maquinaria en base GSP y cierre definitivo de servicio' : 'Cierre de viaje y paso a etapa de maniobra' }}
              </p>
              <a
                :href="urlManualOperador"
                target="_blank"
                class="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-mono underline underline-offset-2 mt-0.5"
              >
                <span>📖</span>
                <span>¿Dudas con los marcadores? Ver Matriz Oficial</span>
              </a>
            </div>
          </div>
          <button @click="modalLlegada.visible = false" type="button" class="text-slate-400 hover:text-white p-1 text-lg">✕</button>
        </div>

        <div class="space-y-3">
          <!-- BLOQUE 1: INSTRUMENTOS DEL CAMIÓN / CHASIS -->
          <div class="bg-black/30 border border-white/10 rounded-xl p-3 space-y-3">
            <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block border-b border-white/10 pb-1">
              🚚 1. Instrumentos Camión / Chasis
            </span>

            <!-- Odómetro Llegada -->
            <div>
              <label class="block text-xs font-bold text-slate-200 mb-1">Odómetro de Llegada (KM) *</label>
              <input type="number" step="0.1" v-model="formLlegada.odometro" placeholder="Ej: 146120.0" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2.5 text-base text-white font-mono font-bold outline-none focus:border-emerald-400" />
            </div>

            <!-- Foto Odómetro Llegada -->
            <div>
              <label class="block text-[11px] font-bold text-emerald-300 mb-1">📸 Foto Odómetro Llegada (KM) *</label>
              <div v-if="formLlegada.foto_odometro" class="relative rounded-xl overflow-hidden border border-emerald-500/50">
                <img :src="formLlegada.foto_odometro" alt="Odómetro Llegada" class="w-full h-32 object-cover" />
                <button @click="formLlegada.foto_odometro = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">✕ Quitar</button>
              </div>
              <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-xl p-3 cursor-pointer bg-black/40 transition-colors">
                <span class="text-xl mb-0.5">📸</span>
                <span class="text-xs font-bold text-emerald-400">Tomar Foto del Odómetro Llegada</span>
                <input type="file" accept="image/*" capture="environment" @change="onFotoOdometroLlegada" class="hidden" />
              </label>
            </div>

            <!-- Horómetro Camión Llegada -->
            <div class="border-t border-white/10 pt-2">
              <label class="block text-xs font-bold text-slate-200 mb-1">Horómetro Camión / Chasis Llegada (HRS) *</label>
              <input type="number" step="0.1" v-model="formLlegada.horometro" placeholder="Ej: 3248.5" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2.5 text-base text-white font-mono font-bold outline-none focus:border-emerald-400" />
            </div>

            <!-- Foto Horómetro Camión Llegada -->
            <div>
              <label class="block text-[11px] font-bold text-emerald-300 mb-1">📸 Foto Horómetro Camión Llegada (HRS) *</label>
              <div v-if="formLlegada.foto_horometro_camion" class="relative rounded-xl overflow-hidden border border-emerald-500/50">
                <img :src="formLlegada.foto_horometro_camion" alt="Horómetro Camión Llegada" class="w-full h-32 object-cover" />
                <button @click="formLlegada.foto_horometro_camion = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">✕ Quitar</button>
              </div>
              <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-xl p-3 cursor-pointer bg-black/40 transition-colors">
                <span class="text-xl mb-0.5">📸</span>
                <span class="text-xs font-bold text-emerald-400">Tomar Foto del Horómetro Camión</span>
                <input type="file" accept="image/*" capture="environment" @change="onFotoHorometroCamionLlegada" class="hidden" />
              </label>
            </div>

            <!-- Botón Atajo Display Único Camión -->
            <button
              v-if="formLlegada.foto_odometro && !formLlegada.foto_horometro_camion"
              @click="copiarFotoOdometroAHorometroLlegada"
              type="button"
              class="w-full py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>📋</span> ¿Mismo display digital? Usar la foto del odómetro para horómetro camión
            </button>
            <button
              v-else-if="formLlegada.foto_horometro_camion && !formLlegada.foto_odometro"
              @click="copiarFotoHorometroAOdometroLlegada"
              type="button"
              class="w-full py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>📋</span> ¿Mismo display digital? Usar la foto de horómetro camión para odómetro
            </button>
          </div>

          <!-- BLOQUE 2: INSTRUMENTO DE LA GRÚA (CABINA SUPERIOR DE IZAJE) -->
          <!-- Solo en Llegada a Faena para Grúas, no en Retorno ni en Camiones de Traslado de Plataformas -->
          <div v-if="viaje.tipo_trayecto !== 'RETORNO' && !esServicioPlataformaBsm" class="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 space-y-2.5">
            <div class="flex items-center justify-between border-b border-amber-500/20 pb-1">
              <label class="block text-xs font-bold text-amber-300 uppercase tracking-wide">⚙️ 2. Horómetro Grúa (Superestructura - Opcional)</label>
              <span class="text-[9px] text-amber-400 font-mono font-bold bg-amber-900/50 px-1.5 py-0.5 rounded">Cabina Superior LICCON</span>
            </div>
            <p class="text-[11px] text-slate-300">Lectura inicial de la cabina de izaje (opcional si la grúa opera superestructura).</p>

            <input type="number" step="0.1" v-model="formLlegada.horometro_grua" placeholder="Ej: 1250.0 (Opcional)" class="w-full bg-[#050810] border border-amber-500/60 rounded-xl px-3 py-2.5 text-base text-amber-300 font-mono font-bold outline-none focus:border-amber-400" />

            <!-- Foto Horómetro Grúa -->
            <div>
              <label class="block text-[11px] font-bold text-amber-300 mb-1">📸 Foto Horómetro Grúa / Superestructura (Opcional)</label>
              <div v-if="formLlegada.foto_horometro_grua" class="relative rounded-xl overflow-hidden border border-amber-500/60">
                <img :src="formLlegada.foto_horometro_grua" alt="Horómetro Grúa" class="w-full h-32 object-cover" />
                <button @click="formLlegada.foto_horometro_grua = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">✕ Quitar</button>
              </div>
              <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-xl p-3 cursor-pointer bg-black/40 transition-colors">
                <span class="text-xl mb-0.5">📸</span>
                <span class="text-xs font-bold text-amber-400">Tomar Foto Horómetro Cabina Grúa (Opcional)</span>
                <span class="text-[9px] text-slate-400">Pantalla LICCON o reloj en cabina de izaje</span>
                <input type="file" accept="image/*" capture="environment" @change="onFotoHorometroGruaLlegada" class="hidden" />
              </label>
            </div>
          </div>

          <!-- BLOQUE 3: COMBUSTIBLE AL INGRESAR A PATIO (SOLO EN RETORNO A BASE GSP) -->
          <div v-if="viaje.tipo_trayecto === 'RETORNO'" class="bg-black/50 border border-emerald-500/30 rounded-xl p-3 space-y-2.5">
            <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">⛽ 3. Nivel de Combustible al Ingresar a Patio Central</span>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">
                Nivel de Combustible al Ingreso a Patio *
              </label>
              <select v-model="formLlegada.combustible_chasis" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white font-mono outline-none focus:border-emerald-400">
                <option value="" disabled>Seleccione porcentaje (1% a 100%)...</option>
                <option v-for="pct in nivelesCombustible" :key="pct" :value="pct">{{ pct }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">📸 Foto Marcador Combustible al Ingresar (Opcional)</label>
              <div v-if="formLlegada.foto_combustible" class="relative rounded-xl overflow-hidden border border-emerald-500/50 mb-1">
                <img :src="formLlegada.foto_combustible" alt="Marcador Combustible Llegada" class="w-full h-32 object-cover" />
                <button @click="formLlegada.foto_combustible = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs">✕</button>
              </div>
              <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-xl p-3 cursor-pointer bg-black/30 transition-colors">
                <span class="text-xl mb-0.5">📸</span>
                <span class="text-xs font-bold text-emerald-400">Tomar Foto Marcador Combustible (Opcional)</span>
                <input type="file" accept="image/*" capture="environment" @change="onFotoCombustibleLlegada" class="hidden" />
              </label>
            </div>
          </div>

          <!-- BLOQUE 4: OBSERVACIONES Y PIN -->
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Observaciones de Término / Ruta</label>
            <textarea v-model="formLlegada.obs_termino" rows="2" placeholder="Detalla condiciones de carretera, clima o estado de portería..." class="w-full bg-[#050810] border border-white/20 rounded-xl p-2.5 text-xs text-white outline-none resize-none focus:border-emerald-400"></textarea>
          </div>

          <div class="bg-black/50 border border-white/10 rounded-xl p-3">
            <label class="block text-xs font-bold text-emerald-400 mb-1">PIN del Conductor (4 Dígitos) *</label>
            <input type="password" maxlength="4" v-model="formLlegada.pin" placeholder="••••" class="w-full bg-[#050810] border border-emerald-500/40 rounded-xl px-3 py-3 text-center text-xl tracking-[0.5em] text-white font-mono font-black outline-none focus:border-emerald-400" />
          </div>
        </div>

        <!-- Indicador reactivo de requisitos de llegada -->
        <div v-if="!isFormLlegadaValido" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-center text-xs space-y-1">
          <p class="font-bold text-amber-300">Requisitos para autorizar llegada:</p>
          <div class="flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
            <span :class="formLlegada.odometro ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ formLlegada.odometro ? '✓' : '⚠️' }} Odóm.
            </span>
            <span class="text-slate-600">•</span>
            <span :class="formLlegada.foto_odometro ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ formLlegada.foto_odometro ? '✓' : '⚠️' }} Foto Odóm.
            </span>
            <span class="text-slate-600">•</span>
            <span :class="formLlegada.horometro ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ formLlegada.horometro ? '✓' : '⚠️' }} Horóm. Camión
            </span>
            <span class="text-slate-600">•</span>
            <span :class="formLlegada.foto_horometro_camion ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ formLlegada.foto_horometro_camion ? '✓' : '⚠️' }} Foto Horóm. Camión
            </span>
            <template v-if="viaje.tipo_trayecto === 'RETORNO'">
              <span class="text-slate-600">•</span>
              <span :class="formLlegada.combustible_chasis ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
                {{ formLlegada.combustible_chasis ? '✓' : '⚠️' }} Combustible Patio
              </span>
            </template>
            <span class="text-slate-600">•</span>
            <span :class="(formLlegada.pin && formLlegada.pin.length === 4) ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ (formLlegada.pin && formLlegada.pin.length === 4) ? '✓' : '⚠️' }} PIN ({{ formLlegada.pin ? formLlegada.pin.length : 0 }}/4)
            </span>
          </div>
        </div>

        <button @click="ejecutarLlegadaFaena" :disabled="!isFormLlegadaValido || guardando" type="button" class="w-full min-h-[50px] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-xs uppercase rounded-xl tracking-wider transition-all cursor-pointer">
          <span v-if="guardando">⏳ Registrando...</span>
          <span v-else>{{ viaje.tipo_trayecto === 'RETORNO' ? '🏁 Confirmar Llegada a Patio y Liberar Equipo' : 'Confirmar Llegada y Cerrar Desplazamiento' }}</span>
        </button>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: VISOR DE COMPROBANTE DE REPORT DIARIO FIRMADO                      -->
    <!-- ========================================================================= -->
    <div v-if="modalReportVisor" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#0a0f1e] border border-emerald-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">📋</span>
            <div>
              <h3 class="text-sm font-bold text-white uppercase">Comprobante Report Diario — Día {{ modalReportVisor.dia }}</h3>
              <p class="text-[10px] text-emerald-400 font-mono">Sellado: {{ modalReportVisor.timestamp_sellado ? new Date(modalReportVisor.timestamp_sellado).toLocaleString('es-CL') : modalReportVisor.fecha }}</p>
            </div>
          </div>
          <button @click="modalReportVisor = null" type="button" class="text-slate-400 hover:text-white p-1 text-lg cursor-pointer">✕</button>
        </div>

        <div class="space-y-3 font-mono text-xs text-slate-300">
          <div class="bg-black/50 p-3 rounded-xl space-y-1.5 border border-white/5">
            <div class="flex justify-between">
              <span class="text-slate-400">Equipo / Patente:</span>
              <strong class="text-white">{{ modalReportVisor.patente || viaje.patente }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">OT / Faena:</span>
              <strong class="text-white">{{ modalReportVisor.codigo_proyecto || viaje.codigo_proyecto }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Operador:</span>
              <span class="text-amber-300 font-bold">{{ modalReportVisor.chofer_nombre || viaje.chofer_nombre }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 bg-[#050810] p-3 rounded-xl border border-white/5">
            <div>
              <span class="text-[10px] text-slate-400 block">Horómetro Inicio:</span>
              <strong class="text-white">{{ modalReportVisor.horometro_inicio }} HRS</strong>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block">Horómetro Término:</span>
              <strong class="text-white">{{ modalReportVisor.horometro_final }} HRS</strong>
            </div>
            <div class="col-span-2 flex justify-between border-t border-white/5 pt-1.5 mt-1">
              <span>Δ Horas Motor:</span>
              <span class="text-amber-400 font-bold">{{ modalReportVisor.delta_motor }} HRS</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 bg-[#050810] p-3 rounded-xl border border-white/5">
            <div>
              <span class="text-[10px] text-slate-400 block font-semibold">Jornada Operativa:</span>
              <strong class="text-white font-mono">{{ modalReportVisor.hora_inicio || '08:00' }} a {{ modalReportVisor.hora_termino || '18:00' }}</strong>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block font-semibold">Colación:</span>
              <strong class="text-white font-mono">
                {{ modalReportVisor.colacion_minutos ? `${modalReportVisor.colacion_minutos} min` : 'Sin colación' }}
              </strong>
            </div>
            <div class="col-span-2 flex justify-between border-t border-white/5 pt-1.5 mt-1">
              <span>Horas Facturables:</span>
              <span class="text-emerald-400 font-black text-sm">{{ modalReportVisor.horas_facturables }} HRS</span>
            </div>
          </div>

          <div class="bg-[#050810] p-3 rounded-xl border border-white/5 font-sans">
            <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Maniobras & Faena:</span>
            <p class="text-xs text-slate-200 italic">"{{ modalReportVisor.maniobra_detalle }}"</p>
          </div>

          <!-- Foto Tablero / Horómetro del Report -->
          <div v-if="modalReportVisor.foto_horometro" class="bg-[#050810] p-2 rounded-xl border border-white/5">
            <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1 font-sans">Foto Tablero / Horómetro:</span>
            <img :src="modalReportVisor.foto_horometro" alt="Tablero Faena" class="h-32 w-full object-cover rounded-lg border border-white/10" />
          </div>

          <!-- Firma del Mandante -->
          <div class="bg-white p-3 rounded-xl text-center space-y-1">
            <span class="text-[10px] font-bold text-slate-700 uppercase block font-sans">Firma Aceptación Mandante</span>
            <img v-if="modalReportVisor.firma_mandante" :src="modalReportVisor.firma_mandante" alt="Firma Mandante" class="max-h-24 mx-auto block" />
            <div class="border-t border-slate-200 pt-1 text-[11px] text-slate-800 font-bold font-sans">
              {{ modalReportVisor.mandante_nombre }} • RUT: {{ modalReportVisor.mandante_rut }}
            </div>
            <div class="text-[10px] text-slate-500 font-sans">
              {{ modalReportVisor.mandante_cargo || 'ITO Mandante' }}
            </div>
          </div>
        </div>

        <button @click="modalReportVisor = null" type="button" class="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer">
          Cerrar Comprobante
        </button>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: CONSULTA DE DATOS REGISTRADOS DE SALIDA DE PATIO                   -->
    <!-- ========================================================================= -->
    <div v-if="mostrarModalDatosSalida" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#0a0f1e] border border-amber-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">📋</span>
            <div>
              <h3 class="text-sm font-bold text-white uppercase font-mono">Registro de Salida de Patio</h3>
              <p class="text-[10px] text-slate-400">Lecturas iniciales capturadas en Base GSP</p>
            </div>
          </div>
          <button @click="mostrarModalDatosSalida = false" type="button" class="text-slate-400 hover:text-white p-1 text-lg">✕</button>
        </div>

        <div class="space-y-3 font-mono text-xs">
          <div class="grid grid-cols-2 gap-2 bg-black/40 p-3 rounded-xl border border-white/10">
            <div>
              <span class="text-[10px] text-slate-400 block">Odómetro Salida:</span>
              <strong class="text-amber-400 text-sm font-black">{{ viaje.odometro_salida || '---' }} KM</strong>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block">Horómetro Camión:</span>
              <strong class="text-amber-400 text-sm font-black">{{ viaje.horometro_salida || '---' }} HRS</strong>
            </div>
            <div class="col-span-2 border-t border-white/10 pt-2 flex justify-between items-center">
              <span class="text-[10px] text-slate-400">Combustible Salida:</span>
              <span class="text-emerald-400 font-bold">{{ viaje.combustible_salida || '100% (Lleno)' }}</span>
            </div>
            <div class="col-span-2 flex justify-between items-center text-[10px] text-slate-400">
              <span>Hora de Salida:</span>
              <span class="text-white">{{ formatFechaHora(viaje.timestamp_inicio) }}</span>
            </div>
          </div>

          <!-- Fotos de Salida -->
          <div class="grid grid-cols-2 gap-2">
            <div v-if="viaje.foto_odometro_salida || viaje.foto_salida" class="space-y-1">
              <span class="text-[10px] text-slate-400 block">Foto Odómetro:</span>
              <img :src="viaje.foto_odometro_salida || viaje.foto_salida" alt="Foto Odómetro Salida" class="w-full h-28 object-cover rounded-xl border border-white/10" />
            </div>
            <div v-if="viaje.foto_horometro_salida" class="space-y-1">
              <span class="text-[10px] text-slate-400 block">Foto Horómetro:</span>
              <img :src="viaje.foto_horometro_salida" alt="Foto Horómetro Salida" class="w-full h-28 object-cover rounded-xl border border-white/10" />
            </div>
            <div v-if="viaje.foto_combustible_salida" class="col-span-2 space-y-1">
              <span class="text-[10px] text-slate-400 block">Foto Marcador Combustible:</span>
              <img :src="viaje.foto_combustible_salida" alt="Foto Combustible Salida" class="w-full h-28 object-cover rounded-xl border border-white/10" />
            </div>
          </div>
        </div>

        <button @click="mostrarModalDatosSalida = false" type="button" class="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer">
          Cerrar
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiAxios } from '@/services/api'
import SignatureField from '@/components/Operaciones/SignatureField.vue'
import {
  guardarSesionLocal,
  obtenerSesionLocal,
  encolarMutacion,
  obtenerMutacionesPendientes,
  marcarMutacionSincronizada,
  sincronizarMutacionesConBackend,
  comprimirFoto,
  hashPin,
  obtenerCoordenadasGPS,
  iniciarWatcherGPS,
  detenerWatcherGPS,
  getUltimaPosicionGPS
} from '@/utils/viajeOfflineSync'

const route = useRoute()
const tokenViaje = ref(route.params.token || 'vj-demo-1234')

// Estado de Conectividad
const isOnline = ref(navigator.onLine)
const mutacionesPendientesCount = ref(0)
const guardando = ref(false)
const cargandoViaje = ref(false)

// Telemetría GPS en Ruta (10 Segundos para pruebas según requerimiento)
const INTERVALO_PING_MS = 10000
const gpsWatcherInterval = ref(null)
const ultimaPosicionGPS = ref(null)
const totalPingsEnRuta = ref(0)
const segundosParaProximoPing = ref(10)
const ultimoPingHora = ref('')

// Datos del Viaje
const viaje = ref({
  token_viaje: tokenViaje.value,
  id_log_desplazamiento: null,
  id_proyecto: null,
  tipo_trayecto: tokenViaje.value.includes('ret') ? 'RETORNO' : 'IDA',
  codigo_proyecto: 'GSP-OT',
  patente: 'S/P',
  modelo: 'Maquinaria de Izaje GSP',
  tipo_equipo: 'GRUAS TELESCOPICAS',
  obra_nombre: 'Obra Mandante',
  obra_direccion: 'Dirección de Faena',
  chofer_nombre: 'Conductor Asignado',
  estado_viaje: 'ASIGNADO', // ASIGNADO | EN_RUTA | ARRIBADO_FAENA
  timestamp_inicio: null,
  timestamp_llegada: null,
  odometro_salida: null,
  horometro_salida: null,
  odometro_llegada: null,
  horometro_llegada: null,
  horometro_grua_llegada: null,
  foto_salida: null,
  foto_odometro_salida: null,
  foto_horometro_salida: null,
  foto_llegada: null,
  foto_odometro_llegada: null,
  foto_horometro_camion_llegada: null,
  foto_horometro_grua_llegada: null,
  cargas_combustible: [],
  pings_ruta: [],
  total_pings_gps: 0
})

const nivelesCombustible = [
  '100% (Lleno)',
  '90%',
  '80%',
  '75% (3/4)',
  '70%',
  '60%',
  '50% (1/2)',
  '40%',
  '30%',
  '25% (1/4)',
  '20%',
  '15%',
  '10% (Reserva)',
  '5%'
]

// Formularios
const formSalida = ref({
  odometro: '',
  horometro: '',
  combustible_salida: '',
  foto_combustible: '',
  foto: '',
  foto_odometro: '',
  foto_horometro: '',
  pin: ''
})

const formLlegada = ref({
  odometro: '',
  horometro: '',
  horometro_grua: '',
  combustible_chasis: '',
  combustible_grua: '',
  foto_combustible: '',
  foto: '',
  foto_odometro: '',
  foto_horometro_camion: '',
  foto_horometro_grua: '',
  pin: '',
  obs_termino: ''
})

const modalCombustible = ref({
  visible: false,
  id_autorizacion: 'DIRECTO'
})

const formCombustible = ref({
  odometro: '',
  horometro: '',
  foto_tablero: '',
  tipo_estanque: 'PRINCIPAL_CHASIS',
  litros: '',
  monto: '',
  foto_voucher: ''
})

const modalLlegada = ref({
  visible: false
})

const mostrarModalDatosSalida = ref(false)

// =============================================================
// ESTADO Y MÉTODOS: REPORT DIARIO DE IZAJE (MULTI-DÍA)
// =============================================================
const formularioReportAbierto = ref(true)
const guardandoReport = ref(false)
const modalReportVisor = ref(null)

const formReport = ref({
  dia: 1,
  fecha: new Date().toISOString().split('T')[0],
  horometro_inicio: '',
  horometro_final: '',
  foto_horometro: '',
  hora_inicio: '08:00',
  hora_termino: '18:00',
  colacion_minutos: 60,
  maniobra_detalle: '',
  mandante_nombre: '',
  mandante_rut: '',
  mandante_cargo: 'ITO / Supervisor Terreno',
  firma_mandante: ''
})

const setColacionMinutos = (min) => {
  formReport.value.colacion_minutos = min
}

const urlRetornoReport = computed(() => {
  const isProd = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/lg-gsp-prod') ||
    window.location.pathname.startsWith('/pwa-gsp-prod')
  )
  const pwaPrefix = isProd ? '/pwa-gsp-prod' : '/pwa-gsp-dev'
  const pId = viaje.value?.id_proyecto
  const eqId = viaje.value?.id_equipo
  if (pId) {
    const eqParam = eqId ? `&id_equipo=${eqId}` : ''
    return `${window.location.origin}${pwaPrefix}/#/reportDiario?id_proyecto=${pId}${eqParam}`
  }
  return `${window.location.origin}${pwaPrefix}/#/surveys`
})

const urlHomePwa = computed(() => {
  const isProd = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/lg-gsp-prod') ||
    window.location.pathname.startsWith('/pwa-gsp-prod')
  )
  const pwaPrefix = isProd ? '/pwa-gsp-prod' : '/pwa-gsp-dev'
  return `${window.location.origin}${pwaPrefix}/#/surveys`
})

const proximoDiaCorrelativo = computed(() => {
  return (viaje.value.reportes_diarios && viaje.value.reportes_diarios.length) 
    ? viaje.value.reportes_diarios.length + 1 
    : 1
})

const esGruaBimotor = computed(() => {
  const t = (viaje.value?.tipo_equipo || '').toUpperCase()
  return t.includes('GRUA') || t.includes('TELESCOPICA') || viaje.value?.cantidad_estanques === 2
})

const pisoMinimoEstructurador = computed(() => {
  const lineas = viaje.value?.lineas_servicio || []
  const lineaEq = lineas.find(l => Number(l.equipo_asignado_id) === Number(viaje.value?.id_equipo)) || lineas.find(l => l.tipo?.toUpperCase().includes('GRUA'))
  if (lineaEq && (lineaEq.pisoMinimo || lineaEq.cantidad_horas || lineaEq.horas)) {
    return Number(lineaEq.pisoMinimo || lineaEq.cantidad_horas || lineaEq.horas)
  }
  return Number(viaje.value?.piso_minimo_estructurador || viaje.value?.horas_minimas || 8.0)
})

const reporteHorasCalculadas = computed(() => {
  const piso = pisoMinimoEstructurador.value
  if (!formReport.value.hora_inicio || !formReport.value.hora_termino) {
    return { efectivas: 0, facturables: piso, pisoMinimo: piso }
  }
  const [hIni, mIni] = formReport.value.hora_inicio.split(':').map(Number)
  const [hFin, mFin] = formReport.value.hora_termino.split(':').map(Number)
  const minIni = hIni * 60 + mIni
  const minFin = hFin * 60 + mFin
  let diffMin = minFin - minIni
  if (diffMin < 0) diffMin += 24 * 60

  const colacion = Number(formReport.value.colacion_minutos || 0)
  const minEfectivos = Math.max(0, diffMin - colacion)
  const horasEfectivas = Number((minEfectivos / 60).toFixed(1))
  const horasFacturables = Math.max(horasEfectivas, piso)

  return { efectivas: horasEfectivas, facturables: horasFacturables, pisoMinimo: piso }
})

const isFormReportValido = computed(() => {
  return Boolean(formReport.value.horometro_inicio) &&
         Boolean(formReport.value.horometro_final) &&
         Number(formReport.value.horometro_final) >= Number(formReport.value.horometro_inicio) &&
         Boolean(formReport.value.maniobra_detalle?.trim()) &&
         Boolean(formReport.value.mandante_nombre?.trim()) &&
         Boolean(formReport.value.mandante_rut?.trim()) &&
         Boolean(formReport.value.firma_mandante)
})

const urlManualOperador = computed(() => {
  const baseOrigin = window.location.origin
  const isDev = window.location.pathname.includes('-dev')
  const prefix = isDev ? '/lg-gsp-dev' : '/lg-gsp-prod'
  return `${baseOrigin}${prefix}/manual_operador_terreno_gsp.html`
})

const abrirFormularioReport = () => {
  const dia = proximoDiaCorrelativo.value
  let horoInicio = viaje.value.horometro_grua_llegada || viaje.value.horometro_llegada || viaje.value.horometro_salida || 3248.5
  if (viaje.value.reportes_diarios && viaje.value.reportes_diarios.length > 0) {
    const ultimo = viaje.value.reportes_diarios[viaje.value.reportes_diarios.length - 1]
    if (ultimo.horometro_final) horoInicio = ultimo.horometro_final
  }

  // Regla 1: Mantener la hora de inicio ingresada previamente por el usuario, o 08:00 por turno normal
  let horaInicioDefault = formReport.value.hora_inicio || '08:00'

  formReport.value = {
    dia,
    fecha: new Date().toISOString().split('T')[0],
    horometro_inicio: horoInicio,
    horometro_final: '',
    foto_horometro: '',
    hora_inicio: horaInicioDefault,
    hora_termino: '18:00',
    colacion_minutos: 60,
    maniobra_detalle: '',
    mandante_nombre: '',
    mandante_rut: '',
    mandante_cargo: 'ITO / Supervisor Terreno',
    firma_mandante: ''
  }
  formularioReportAbierto.value = true
}

const sellarYTransmitirReport = async () => {
  if (!isFormReportValido.value) return
  guardandoReport.value = true

  try {
    const coords = await obtenerCoordenadasGPS()
    const nuevoReport = {
      id_reporte: `REP-${Date.now()}`,
      dia: formReport.value.dia,
      fecha: formReport.value.fecha,
      timestamp_sellado: new Date().toISOString(),
      horometro_inicio: Number(formReport.value.horometro_inicio),
      horometro_final: Number(formReport.value.horometro_final),
      foto_horometro: formReport.value.foto_horometro || null,
      delta_motor: Number((Number(formReport.value.horometro_final) - Number(formReport.value.horometro_inicio)).toFixed(1)),
      hora_inicio: formReport.value.hora_inicio,
      hora_termino: formReport.value.hora_termino,
      colacion_minutos: formReport.value.colacion_minutos,
      horas_efectivas: reporteHorasCalculadas.value.efectivas,
      horas_facturables: reporteHorasCalculadas.value.facturables,
      maniobra_detalle: formReport.value.maniobra_detalle,
      mandante_nombre: formReport.value.mandante_nombre,
      mandante_rut: formReport.value.mandante_rut,
      mandante_cargo: formReport.value.mandante_cargo,
      firma_mandante: formReport.value.firma_mandante,
      gps_sellado: coords,
      chofer_nombre: viaje.value.chofer_nombre,
      patente: viaje.value.patente,
      codigo_proyecto: viaje.value.codigo_proyecto
    }

    const payloadBackend = {
      id_proyecto: viaje.value.id_proyecto,
      id_equipo: viaje.value.id_equipo || null,
      id_user_operador: viaje.value.id_user_chofer || 55,
      dia_correlativo: Number(formReport.value.dia || 1),
      fecha_reporte: formReport.value.fecha || new Date().toISOString().split('T')[0],
      hora_inicio: formReport.value.hora_inicio || '08:00',
      hora_termino: formReport.value.hora_termino || '18:00',
      horas_colacion: Number((Number(formReport.value.colacion_minutos || 60) / 60).toFixed(2)),
      horas_operadas: Number(reporteHorasCalculadas.value.efectivas || 0),
      horas_minimas: Number(pisoMinimoEstructurador.value || 8.0),
      horas_facturables: Number(reporteHorasCalculadas.value.facturables || 0),
      horometro_inicio: Number(formReport.value.horometro_inicio),
      horometro_termino: Number(formReport.value.horometro_final),
      foto_tablero_termino: formReport.value.foto_horometro || null,
      foto_horometro: formReport.value.foto_horometro || null,
      odometro_inicio: Number(viaje.value.odometro_salida) || null,
      odometro_termino: Number(viaje.value.odometro_llegada) || null,
      observacion_trabajo: formReport.value.maniobra_detalle || '',
      cliente_nombre: formReport.value.mandante_nombre || 'Supervisor Mandante',
      cliente_rut: formReport.value.mandante_rut || '',
      cliente_cargo: formReport.value.mandante_cargo || 'ITO Mandante',
      cliente_firma_canvas_base64: formReport.value.firma_mandante,
      latitud_inicio_servicio: coords?.latitud || null,
      longitud_inicio_servicio: coords?.longitud || null,
      accuracy_firma: coords?.accuracy || null,
      token_viaje: tokenViaje.value,
      device_timestamp: new Date().toISOString()
    }

    // Enviar al servicio oficial de report diario si hay red
    if (isOnline.value && !tokenViaje.value.includes('demo')) {
      try {
        await apiAxios.post('/operaciones/report/guardar', payloadBackend)
      } catch (httpErr) {
        if (httpErr?.response?.status === 403 && (httpErr?.response?.data?.code === 'SERVICIO_CONCLUIDO' || httpErr?.response?.data?.error?.includes('concluido') || httpErr?.response?.data?.error?.includes('completó'))) {
          alert(`🚫 CANDADO OPERATIVO:\n${httpErr?.response?.data?.error || 'Este servicio ya completó la cantidad de días hábiles planificados contratados.'}\nNo es posible emitir más reportes diarios. Contacte a Control de Gestión (Yiara).`)
          guardandoReport.value = false
          return
        }
        console.warn('Error HTTP al guardar report oficial, encolando mutación:', httpErr)
        await encolarMutacion(tokenViaje.value, 'CREAR_REPORTE_DIARIO', payloadBackend)
      }
    } else {
      await encolarMutacion(tokenViaje.value, 'CREAR_REPORTE_DIARIO', payloadBackend)
    }

    if (!viaje.value.reportes_diarios) viaje.value.reportes_diarios = []
    viaje.value.reportes_diarios.push(nuevoReport)

    // Guardar sesión local offline-first
    await guardarSesionLocal(tokenViaje.value, viaje.value)

    formularioReportAbierto.value = false
    modalReportVisor.value = nuevoReport
  } catch (e) {
    console.error('Error al sellar report diario:', e)
  } finally {
    guardandoReport.value = false
  }
}

const abrirVisorReporte = (rep) => {
  modalReportVisor.value = rep
}

// Timer de Duración
const tiempoEnRuta = ref('00h 00m')
let timerInterval = null

// Validaciones Computadas
const isFormSalidaValido = computed(() => {
  return Boolean(formSalida.value.odometro) &&
         Boolean(formSalida.value.foto_odometro) &&
         Boolean(formSalida.value.horometro) &&
         Boolean(formSalida.value.foto_horometro) &&
         Boolean(formSalida.value.combustible_salida) &&
         Boolean(formSalida.value.pin) &&
         formSalida.value.pin.length === 4
})

const isFormRendicionCombustibleValido = computed(() => {
  return Boolean(formCombustible.value.litros) &&
         Boolean(formCombustible.value.monto)
})

// =============================================================
// DETECCIÓN DE REQUERIMIENTO INTERNO (SPEC-087)
// =============================================================
const esMovimientoInterno = computed(() => {
  const cod = String(viaje.value?.codigo_proyecto || '').toUpperCase().trim()
  return Boolean(
    viaje.value?.es_interno === true ||
    viaje.value?.es_requerimiento_interno === true ||
    cod.startsWith('INT-')
  )
})

// =============================================================
// DETECCIÓN AUTOMÁTICA DE TRASLADO DE PLATAFORMAS (BSM / SPEC-081)
// =============================================================
const esServicioPlataformaBsm = computed(() => {
  if (esMovimientoInterno.value) return false
  const t = String(viaje.value?.tipo_equipo || '').toUpperCase()
  const cod = String(viaje.value?.codigo_proyecto || '').toUpperCase()
  const mod = String(viaje.value?.modelo || '').toUpperCase()
  const lineas = Array.isArray(viaje.value?.lineas_servicio) ? viaje.value.lineas_servicio : []
  const tieneLineaPlat = lineas.some(l => {
    const s = `${l.tipo || ''} ${l.subcategoria || ''} ${l.descripcion || ''}`.toUpperCase()
    return s.includes('PLATAFORMA') || s.includes('ALZA') || s.includes('MANLIFT') || s.includes('TIJERA') || s.includes('ARTICULAD')
  })
  return (
    t.includes('CAMION') ||
    t.includes('TRACTO') ||
    t.includes('PLATAFORMA') ||
    cod.startsWith('BMQ') ||
    mod.includes('VOLVO') ||
    mod.includes('JLG') ||
    tieneLineaPlat
  )
})

// =============================================================
// ESTADO DE ACTA DE PLATAFORMAS (BSM / SPEC-081)
// =============================================================
const actaBsm = ref({
  entrega_sellada: false,
  retiro_sellado: false
})

const consultarEstadoActaBsm = async (idPry) => {
  if (!idPry) return
  try {
    const { data: resp } = await apiAxios.get(`/operaciones/acta-plataforma/proyecto/${idPry}`)
    const a = resp?.acta || resp?.data?.acta || resp?.data
    if (a) {
      const est = String(a.estado || a.estado_acta || '').toUpperCase()
      const entregaSellada = Boolean(
        est === 'ENTREGADA' || 
        est === 'RECIBIDA_CONFORME' || 
        est === 'EMITIDA_ENTREGA' || 
        est === 'CERRADA_FINAL' ||
        a.id_file_pdf_entrega ||
        a.firma_entrega_base64
      )
      const retiroSellado = Boolean(
        est === 'RECIBIDA_CONFORME' || 
        est === 'CERRADA_FINAL' ||
        a.id_file_pdf_final ||
        a.firma_retiro_base64
      )
      actaBsm.value = {
        entrega_sellada: entregaSellada,
        retiro_sellado: retiroSellado
      }
    }
  } catch (err) {
    console.warn('[ViajeConductor] No se pudo obtener estado de acta de plataforma:', err?.message)
  }
}

const isFormLlegadaValido = computed(() => {
  const baseValida = Boolean(formLlegada.value.odometro) &&
                     Boolean(formLlegada.value.foto_odometro) &&
                     Boolean(formLlegada.value.horometro) &&
                     Boolean(formLlegada.value.foto_horometro_camion) &&
                     Boolean(formLlegada.value.pin) &&
                     formLlegada.value.pin.length === 4

  // Al ingresar a Patio (Retorno): exigimos registrar combustible al ingreso
  if (viaje.value.tipo_trayecto === 'RETORNO') {
    return baseValida && Boolean(formLlegada.value.combustible_chasis?.trim())
  }
  // En llegada a Faena: combustible no se pide, y horómetro de grúa es opcional por defecto
  return baseValida
})

// Handlers de Fotos Salida
const onFotoOdometroSalida = async (e) => {
  const file = e.target.files[0]
  if (file) {
    const comp = await comprimirFoto(file)
    formSalida.value.foto_odometro = comp
    formSalida.value.foto = comp
  }
}

const onFotoHorometroSalida = async (e) => {
  const file = e.target.files[0]
  if (file) {
    formSalida.value.foto_horometro = await comprimirFoto(file)
  }
}

const copiarFotoOdometroAHorometroSalida = () => {
  formSalida.value.foto_horometro = formSalida.value.foto_odometro
}

const copiarFotoHorometroAOdometroSalida = () => {
  formSalida.value.foto_odometro = formSalida.value.foto_horometro
  formSalida.value.foto = formSalida.value.foto_horometro
}

// Handlers de Fotos Llegada
const onFotoOdometroLlegada = async (e) => {
  const file = e.target.files[0]
  if (file) {
    const comp = await comprimirFoto(file)
    formLlegada.value.foto_odometro = comp
    formLlegada.value.foto = comp
  }
}

const onFotoHorometroCamionLlegada = async (e) => {
  const file = e.target.files[0]
  if (file) {
    formLlegada.value.foto_horometro_camion = await comprimirFoto(file)
  }
}

const onFotoHorometroGruaLlegada = async (e) => {
  const file = e.target.files[0]
  if (file) {
    formLlegada.value.foto_horometro_grua = await comprimirFoto(file)
  }
}

const copiarFotoOdometroAHorometroLlegada = () => {
  formLlegada.value.foto_horometro_camion = formLlegada.value.foto_odometro
}

const copiarFotoHorometroAOdometroLlegada = () => {
  formLlegada.value.foto_odometro = formLlegada.value.foto_horometro_camion
  formLlegada.value.foto = formLlegada.value.foto_horometro_camion
}

// Handlers Combustible & Report
const onFotoCombustibleSalida = async (e) => {
  const file = e.target.files[0]
  if (file) {
    formSalida.value.foto_combustible = await comprimirFoto(file)
  }
}

const onFotoCombustibleLlegada = async (e) => {
  const file = e.target.files[0]
  if (file) {
    formLlegada.value.foto_combustible = await comprimirFoto(file)
  }
}

const onFotoCombustibleTablero = async (e) => {
  const file = e.target.files[0]
  if (file) {
    formCombustible.value.foto_tablero = await comprimirFoto(file)
  }
}

const onFotoCombustibleVoucher = async (e) => {
  const file = e.target.files[0]
  if (file) {
    formCombustible.value.foto_voucher = await comprimirFoto(file)
  }
}

const onFotoReportCapturada = async (e) => {
  const file = e.target.files[0]
  if (file) {
    formReport.value.foto_horometro = await comprimirFoto(file)
  }
}

// -------------------------------------------------------------
// MOTOR UNIFICADO DE TELEMETRÍA Y RELOJ EN RUTA (TICK 1 SEG)
// -------------------------------------------------------------
const calcularDistanciaMetros = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const registrarPingAutomatico = async () => {
  if (viaje.value.estado_viaje !== 'EN_RUTA') return

  ultimoPingHora.value = new Date().toLocaleTimeString('es-CL')

  try {
    // 1. Obtener última posición real capturada por el hardware GPS
    const gps = getUltimaPosicionGPS()
    if (!gps || !gps.latitud || !gps.longitud || gps.fuente !== 'GPS_REAL') return

    // Descartar lecturas con baja precisión (ruido mayor a 45 metros de error)
    if (gps.accuracy && Number(gps.accuracy) > 45) {
      console.warn('[GPS] Ping descartado por baja precisión (>45m):', gps.accuracy)
      return
    }

    // 2. Filtro Deadband: si no ha habido desplazamiento significativo (< 12m), evitar registrar jitter
    const listaActual = viaje.value.pings_ruta || []
    if (listaActual.length > 0) {
      const ultimo = listaActual[listaActual.length - 1]
      const d = calcularDistanciaMetros(
        ultimo.latitud || ultimo.lat,
        ultimo.longitud || ultimo.lng,
        gps.latitud,
        gps.longitud
      )
      const tiempoDeltaSec = (new Date() - new Date(ultimo.timestamp || ultimo.ts || Date.now())) / 1000
      if (d < 12 && tiempoDeltaSec < 60) {
        ultimaPosicionGPS.value = { ...gps }
        return
      }
    }

    ultimaPosicionGPS.value = { ...gps }

    const pingPayload = {
      latitud: Number(gps.latitud),
      longitud: Number(gps.longitud),
      velocidad_kmh: Number(gps.velocidad_kmh || 0),
      accuracy: Math.round(Number(gps.accuracy || 10)),
      timestamp: new Date().toISOString()
    }

    // 3. Acumular inmediatamente en pings_ruta reactivos
    if (!viaje.value.pings_ruta) viaje.value.pings_ruta = []
    viaje.value.pings_ruta.push(pingPayload)
    totalPingsEnRuta.value = viaje.value.pings_ruta.length
    viaje.value.total_pings_gps = totalPingsEnRuta.value

    await guardarSesionLocal(tokenViaje.value, viaje.value)

    // 4. Enviar directamente al Backend GSP por HTTP
    if (isOnline.value && !tokenViaje.value.includes('demo')) {
      try {
        await apiAxios.post(`/operaciones/viaje/${tokenViaje.value}/ping`, pingPayload)
      } catch (httpErr) {
        console.warn('[Ping] Fallo HTTP, encolando:', httpErr?.message)
        await encolarMutacion(tokenViaje.value, 'PING_GPS', pingPayload)
      }
    } else {
      await encolarMutacion(tokenViaje.value, 'PING_GPS', pingPayload)
    }
  } catch (e) {
    console.error('[Ping] Error registrando ping:', e)
  }
}

const iniciarMotorEnRuta = () => {
  detenerMotorEnRuta()

  // 1. Iniciar monitoreo continuo de hardware GPS
  iniciarWatcherGPS((pos) => {
    ultimaPosicionGPS.value = pos
  })

  // 2. Primer ping inmediato de inicio
  segundosParaProximoPing.value = 10
  registrarPingAutomatico()

  // 3. Master Tick Loop: 1 tick exacto cada segundo (1000ms)
  timerInterval = setInterval(() => {
    if (viaje.value.estado_viaje !== 'EN_RUTA') return

    // Actualizar tiempo transcurrido
    if (viaje.value.timestamp_inicio) {
      const diff = Math.floor((new Date() - new Date(viaje.value.timestamp_inicio)) / 1000)
      const horas = Math.floor(diff / 3600).toString().padStart(2, '0')
      const mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0')
      tiempoEnRuta.value = `${horas}h ${mins}m`
    }

    // Decrementar cuenta regresiva
    segundosParaProximoPing.value--

    // Cada 10 segundos dispara un nuevo ping
    if (segundosParaProximoPing.value <= 0) {
      segundosParaProximoPing.value = 10
      registrarPingAutomatico()
    }
  }, 1000)
}

const detenerMotorEnRuta = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  detenerWatcherGPS()
}

// -------------------------------------------------------------
// ACCIÓN: INICIAR VIAJE (SALIDA DE PATIO)
// -------------------------------------------------------------
const ejecutarInicioViaje = async () => {
  if (!isFormSalidaValido.value) {
    let faltantes = []
    if (!formSalida.value.odometro) faltantes.push('Odómetro de Salida (KM)')
    if (!formSalida.value.horometro) faltantes.push('Horómetro de Salida (HRS)')
    if (!formSalida.value.combustible_salida) faltantes.push('Nivel de Combustible al Salir de Patio')
    if (!formSalida.value.pin) faltantes.push('PIN del Conductor')
    else if (String(formSalida.value.pin).trim().length !== 4) faltantes.push('El PIN debe tener exactamente 4 dígitos')
    alert(`⚠️ Requisitos incompletos para autorizar salida:\n\n• ${faltantes.join('\n• ')}`)
    return
  }

  guardando.value = true

  let pinHashed = ''
  let gps = { latitud: null, longitud: null }

  try {
    pinHashed = await hashPin(formSalida.value.pin)
  } catch (e) {
    console.warn('[Salida] Error hasheando PIN:', e)
  }

  try {
    // Dar 10 segundos: es la primera vez que el browser pide permiso GPS
    gps = await obtenerCoordenadasGPS(10000)
  } catch (e) {
    console.warn('[Salida] Error obteniendo GPS:', e)
  }

  const payload = {
    id_proyecto: viaje.value.id_proyecto || null,
    id_equipo: viaje.value.id_equipo || null,
    id_user_chofer: viaje.value.id_user_chofer || null,
    km_inicial: Number(formSalida.value.odometro),
    horometro_inicial: Number(formSalida.value.horometro),
    combustible_salida: formSalida.value.combustible_salida || null,
    foto_salida: formSalida.value.foto_odometro || formSalida.value.foto || null,
    foto_odometro_salida: formSalida.value.foto_odometro || null,
    foto_horometro_salida: formSalida.value.foto_horometro || null,
    foto_combustible_salida: formSalida.value.foto_combustible || null,
    pin_hash: pinHashed,
    latitud: gps.latitud,
    longitud: gps.longitud,
    device_timestamp: new Date().toISOString()
  }

  // 1. Enviar directamente por HTTP al Backend GSP
  if (isOnline.value && !tokenViaje.value.includes('demo')) {
    try {
      const { data: resp } = await apiAxios.post(`/operaciones/viaje/${tokenViaje.value}/salida`, payload)
      if (resp && resp.data) {
        viaje.value.fecha_salida_patio = resp.data.fecha_salida_patio
        viaje.value.fecha_salida_faena = resp.data.fecha_salida_faena
        viaje.value.timestamp_inicio = (viaje.value.tipo_trayecto === 'RETORNO')
          ? (resp.data.fecha_salida_faena || resp.data.fecha_salida_patio || new Date().toISOString())
          : (resp.data.fecha_salida_patio || new Date().toISOString())
        viaje.value.estado_trayecto = 'EN_RUTA'
      }
    } catch (httpErr) {
      console.warn('[Salida] Fallo HTTP, encolando:', httpErr?.message)
      await encolarMutacion(tokenViaje.value, 'INICIO_VIAJE', payload)
    }
  } else {
    await encolarMutacion(tokenViaje.value, 'INICIO_VIAJE', payload)
  }

  // 2. SIEMPRE actualizar estado local reactivo
  viaje.value.estado_viaje = 'EN_RUTA'
  if (!viaje.value.timestamp_inicio) {
    viaje.value.timestamp_inicio = new Date().toISOString()
    viaje.value.fecha_salida_patio = viaje.value.timestamp_inicio
  }
  viaje.value.odometro_salida = payload.km_inicial
  viaje.value.horometro_salida = payload.horometro_inicial
  viaje.value.foto_salida = payload.foto_salida
  viaje.value.foto_odometro_salida = payload.foto_odometro_salida
  viaje.value.foto_horometro_salida = payload.foto_horometro_salida
  viaje.value.combustible_salida = payload.combustible_salida
  viaje.value.foto_combustible_salida = payload.foto_combustible_salida

  await guardarSesionLocal(tokenViaje.value, viaje.value)
  await actualizarContadorPendientes()
  iniciarMotorEnRuta()
  guardando.value = false
}

// -------------------------------------------------------------
// ACCIÓN: COMBUSTIBLE (CARGA DIRECTA EN RUTA)
// -------------------------------------------------------------
const abrirModalCombustible = () => {
  if (!formCombustible.value.odometro) formCombustible.value.odometro = viaje.value.odometro_salida || ''
  if (!formCombustible.value.horometro) formCombustible.value.horometro = viaje.value.horometro_salida || ''
  modalCombustible.value.visible = true
}

const confirmarRendicionCombustible = async () => {
  const payload = {
    tipo_estanque: formCombustible.value.tipo_estanque,
    litros: Number(formCombustible.value.litros),
    monto: Number(formCombustible.value.monto),
    foto_voucher: formCombustible.value.foto_voucher || 'https://storage.leanglobal.cl/placeholder-voucher.jpg',
    foto_tablero: formCombustible.value.foto_tablero || 'https://storage.leanglobal.cl/placeholder-tablero.jpg',
    id_autorizacion_copec: 'DIRECTO',
    odometro: formCombustible.value.odometro || viaje.value.odometro_salida,
    horometro: formCombustible.value.horometro || viaje.value.horometro_salida
  }

  if (isOnline.value && !tokenViaje.value.includes('demo')) {
    try {
      await apiAxios.post(`/operaciones/viaje/${tokenViaje.value}/combustible`, payload)
    } catch (httpErr) {
      console.warn('Fallo HTTP combustible, encolando:', httpErr?.message || httpErr)
      await encolarMutacion(tokenViaje.value, 'CARGA_COMBUSTIBLE', payload)
    }
  } else {
    await encolarMutacion(tokenViaje.value, 'CARGA_COMBUSTIBLE', payload)
  }

  viaje.value.combustible_cargado = payload
  if (!viaje.value.cargas_combustible) viaje.value.cargas_combustible = []
  viaje.value.cargas_combustible.push(payload)

  await guardarSesionLocal(tokenViaje.value, viaje.value)
  await actualizarContadorPendientes()
  modalCombustible.value.visible = false

  // Reset inputs
  formCombustible.value.litros = ''
  formCombustible.value.monto = ''
  formCombustible.value.foto_voucher = ''

  alert('⛽ Carga de combustible registrada exitosamente en el Log de Viaje.')
}

// -------------------------------------------------------------
// ACCIÓN: LLEGADA A FAENA
// -------------------------------------------------------------
const abrirModalLlegada = () => {
  modalLlegada.value.visible = true
}

const ejecutarLlegadaFaena = async () => {
  guardando.value = true
  detenerMotorEnRuta()

  let pinHashed = ''
  let gps = { latitud: null, longitud: null }

  try {
    pinHashed = await hashPin(formLlegada.value.pin)
  } catch (e) {
    console.warn('[Llegada] Error hasheando PIN:', e)
  }

  try {
    gps = await obtenerCoordenadasGPS(5000)
  } catch (e) {
    console.warn('[Llegada] Error obteniendo GPS:', e)
  }

  const payload = {
    km_final: Number(formLlegada.value.odometro),
    horometro_final: Number(formLlegada.value.horometro),
    horometro_grua: formLlegada.value.horometro_grua ? Number(formLlegada.value.horometro_grua) : null,
    horometro_grua_inicial: formLlegada.value.horometro_grua ? Number(formLlegada.value.horometro_grua) : null,
    combustible_llegada: (viaje.value.tipo_trayecto === 'RETORNO') ? {
      chasis: formLlegada.value.combustible_chasis,
      foto: formLlegada.value.foto_combustible
    } : null,
    foto_llegada: formLlegada.value.foto_odometro || formLlegada.value.foto || null,
    foto_odometro_llegada: formLlegada.value.foto_odometro || null,
    foto_horometro_camion_llegada: formLlegada.value.foto_horometro_camion || null,
    foto_horometro_grua_llegada: formLlegada.value.foto_horometro_grua || null,
    pin_hash: pinHashed,
    latitud: gps.latitud,
    longitud: gps.longitud,
    obs_termino: formLlegada.value.obs_termino || 'Arribo a faena verificado con éxito',
    device_timestamp: new Date().toISOString()
  }

  // 1. Enviar directamente al Backend GSP por HTTP
  if (isOnline.value && !tokenViaje.value.includes('demo')) {
    try {
      const { data: resp } = await apiAxios.post(`/operaciones/viaje/${tokenViaje.value}/llegada`, payload)
      if (resp && resp.data) {
        viaje.value.fecha_llegada_faena = resp.data.fecha_llegada_faena
        viaje.value.fecha_llegada_patio = resp.data.fecha_llegada_patio
        viaje.value.timestamp_llegada = (viaje.value.tipo_trayecto === 'RETORNO')
          ? (resp.data.fecha_llegada_patio || resp.data.fecha_llegada_faena || new Date().toISOString())
          : (resp.data.fecha_llegada_faena || new Date().toISOString())
        viaje.value.estado_trayecto = (viaje.value.tipo_trayecto === 'RETORNO') ? 'CONCLUIDO' : 'LLEGADO'
        if (resp.data.pings_ruta && resp.data.pings_ruta.length) {
          viaje.value.pings_ruta = resp.data.pings_ruta
          totalPingsEnRuta.value = resp.data.pings_ruta.length
          viaje.value.total_pings_gps = totalPingsEnRuta.value
        }
      }
    } catch (httpErr) {
      console.warn('[Llegada] Fallo HTTP, encolando en Outbox:', httpErr?.message)
      await encolarMutacion(tokenViaje.value, 'FIN_VIAJE', payload)
    }
  } else {
    await encolarMutacion(tokenViaje.value, 'FIN_VIAJE', payload)
  }

  // 2. SIEMPRE actualizar estado reactivo y cerrar modal
  viaje.value.estado_viaje = 'ARRIBADO_FAENA'
  if (!viaje.value.timestamp_llegada) {
    viaje.value.timestamp_llegada = new Date().toISOString()
    viaje.value.fecha_llegada_faena = viaje.value.timestamp_llegada
  }
  viaje.value.odometro_llegada = payload.km_final
  viaje.value.horometro_llegada = payload.horometro_final
  viaje.value.horometro_grua_llegada = payload.horometro_grua
  viaje.value.obs_termino = payload.obs_termino
  viaje.value.foto_llegada = payload.foto_llegada
  viaje.value.foto_odometro_llegada = payload.foto_odometro_llegada
  viaje.value.foto_horometro_camion_llegada = payload.foto_horometro_camion_llegada
  viaje.value.foto_horometro_grua_llegada = payload.foto_horometro_grua_llegada
  viaje.value.combustible_llegada = payload.combustible_llegada

  await guardarSesionLocal(tokenViaje.value, viaje.value)
  await actualizarContadorPendientes()
  modalLlegada.value.visible = false
  if (timerInterval) clearInterval(timerInterval)
  guardando.value = false

  if (viaje.value.tipo_trayecto === 'RETORNO') {
    alert('🏁 ¡Retorno a Sucursal Concluido!\n\nEl viaje de vuelta se ha registrado conforme y el equipo queda en estado DISPONIBLE.\nEl servicio ha concluido exitosamente.')
  } else if (esMovimientoInterno.value) {
    alert('🔁 ¡Tramo de Ida Concluido en Sucursal Destino!\n\nPuedes presionar "🔄 INICIAR VIAJE DE VUELTA" para registrar tu retorno a la sucursal de origen.')
  } else if (!esServicioPlataformaBsm.value) {
    abrirFormularioReport()
  }
}

const iniciandoRetorno = ref(false)
const iniciarViajeRetornoInterno = async () => {
  iniciandoRetorno.value = true
  try {
    const idPry = viaje.value.id_proyecto
    const idEq = viaje.value.id_equipo
    const idChofer = viaje.value.id_user_chofer || 55
    const pat = viaje.value.patente
    const tokenRetorno = `vj-${idPry || 'int'}-${idEq || 'eq'}-ret-${Math.random().toString(36).substring(2, 6)}`

    const { data } = await apiAxios.post('/operaciones/viaje/asignar', {
      id_proyecto: idPry,
      id_equipo: idEq,
      id_user_chofer: idChofer,
      patente: pat,
      tipo_trayecto: 'RETORNO',
      token_viaje: tokenRetorno
    })

    const finalToken = data?.data?.token_viaje || tokenRetorno
    const isProd = typeof window !== 'undefined' && window.location.pathname.startsWith('/lg-gsp-prod')
    const baseApp = isProd ? '/lg-gsp-prod' : '/lg-gsp-dev'
    window.location.href = `${baseApp}/viaje/${finalToken}`
  } catch (err) {
    console.error('Error iniciando viaje de retorno:', err)
    alert('No se pudo generar la hoja de viaje de retorno: ' + (err.response?.data?.error || err.message))
  } finally {
    iniciandoRetorno.value = false
  }
}

// -------------------------------------------------------------
// HELPERS DE FORMATEO, VELOCIDADES Y PDF
// -------------------------------------------------------------
const calcularVelocidadMaxima = (pings) => {
  if (!pings || pings.length === 0) return '0.0'
  const max = Math.max(...pings.map(p => Number(p.velocidad_kmh || 0)))
  return max > 0 ? max.toFixed(1) : '0.0'
}

const calcularVelocidadPromedio = (pings) => {
  if (!pings || pings.length === 0) return '0.0'
  const sum = pings.reduce((acc, p) => acc + Number(p.velocidad_kmh || 0), 0)
  return (sum / pings.length).toFixed(1)
}

const formatFechaHora = (isoStr) => {
  if (!isoStr) return '--'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return '--'
    return d.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (e) {
    return isoStr
  }
}

const calcularDuracionTotal = (iniStr, finStr) => {
  if (!iniStr || !finStr) return '--'
  try {
    const d1 = new Date(iniStr)
    const d2 = new Date(finStr)
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '--'
    const diffSec = Math.max(0, Math.floor((d2 - d1) / 1000))
    const hrs = Math.floor(diffSec / 3600)
    const mins = Math.floor((diffSec % 3600) / 60)
    const secs = diffSec % 60
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`
  } catch (e) {
    return '--'
  }
}

const imprimirLogViaje = () => {
  window.print()
}

// -------------------------------------------------------------
// GESTIÓN DE ESTADO LOCAL & SYNC
// -------------------------------------------------------------
const actualizarContadorPendientes = async () => {
  const pendientes = await obtenerMutacionesPendientes(tokenViaje.value)
  mutacionesPendientesCount.value = pendientes.length
}

const iniciarTimerRuta = () => {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (!viaje.value.timestamp_inicio) return
    const diff = Math.floor((new Date() - new Date(viaje.value.timestamp_inicio)) / 1000)
    const horas = Math.floor(diff / 3600).toString().padStart(2, '0')
    const mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0')
    tiempoEnRuta.value = `${horas}h ${mins}m`

    if (segundosParaProximoPing.value > 0) {
      segundosParaProximoPing.value--
    }
  }, 1000)
}

const onOnlineStatusChange = async () => {
  isOnline.value = navigator.onLine
  if (isOnline.value) {
    await sincronizarMutacionesConBackend(tokenViaje.value, apiAxios)
    await actualizarContadorPendientes()
  }
}

// -------------------------------------------------------------
// SELECTOR RÁPIDO DE FASES (DEMO / AUDITORÍA EN VIVO)
// -------------------------------------------------------------
const cambiarFaseDemo = (fase) => {
  viaje.value.estado_viaje = fase
  if (fase === 'ARRIBADO_FAENA') {
    detenerMotorEnRuta()
    viaje.value.odometro_salida = 145820.5
    viaje.value.horometro_salida = 3240.2
    viaje.value.odometro_llegada = 145945.5
    viaje.value.horometro_llegada = 3243.7
    viaje.value.timestamp_inicio = new Date(Date.now() - 2.25 * 3600 * 1000).toISOString()
    viaje.value.timestamp_llegada = new Date().toISOString()
    viaje.value.obs_termino = 'Viaje completado sin novedades en carretera. Equipo posicionado en portería de faena conforme.'
    viaje.value.pings_ruta = [
      { latitud: -36.6172, longitud: -72.1148, velocidad_kmh: 0 },
      { latitud: -36.6250, longitud: -72.1080, velocidad_kmh: 54 },
      { latitud: -36.6340, longitud: -72.1020, velocidad_kmh: 68 },
      { latitud: -36.6410, longitud: -72.0950, velocidad_kmh: 62 },
      { latitud: -36.6500, longitud: -72.0880, velocidad_kmh: 0 }
    ]
    viaje.value.total_pings_gps = 5
    viaje.value.cargas_combustible = [
      {
        tipo_estanque: '⛽ Estanque Principal (Chasis / Tracción)',
        litros_combustible: 250.0,
        monto_costo: 285000,
        id_autorizacion_copec: '#COPEC-8492'
      }
    ]
    if (!esServicioPlataformaBsm.value) {
      abrirFormularioReport()
    }
  } else if (fase === 'EN_RUTA') {
    viaje.value.odometro_salida = 145820.5
    viaje.value.horometro_salida = 3240.2
    viaje.value.timestamp_inicio = new Date(Date.now() - 45 * 60 * 1000).toISOString()
    iniciarMotorEnRuta()
  } else {
    detenerMotorEnRuta()
  }
}

onMounted(async () => {
  window.addEventListener('online', onOnlineStatusChange)
  window.addEventListener('offline', onOnlineStatusChange)

  // 1. Intentar cargar desde el backend si hay token real y red
  if (tokenViaje.value && !tokenViaje.value.includes('demo')) {
    cargandoViaje.value = true
    try {
      const { data: dbViaje } = await apiAxios.get(`/operaciones/viaje/${tokenViaje.value}`)
      if (dbViaje) {
        const esRetorno = dbViaje.tipo_trayecto === 'RETORNO' || tokenViaje.value.includes('ret')
        const yaLlego = dbViaje.estado_trayecto === 'LLEGADO' ||
                        dbViaje.estado_trayecto === 'ARRIBADO' ||
                        dbViaje.estado_trayecto === 'CONCLUIDO' ||
                        (esRetorno ? Boolean(dbViaje.fecha_llegada_patio) : Boolean(dbViaje.fecha_llegada_faena))
        const yaSalio = dbViaje.estado_trayecto === 'EN_RUTA' ||
                        (esRetorno ? Boolean(dbViaje.fecha_salida_faena) : Boolean(dbViaje.fecha_salida_patio))

        viaje.value = {
          token_viaje: dbViaje.token_viaje,
          id_log_desplazamiento: dbViaje.id_log_desplazamiento,
          id_proyecto: dbViaje.id_proyecto,
          id_equipo: dbViaje.id_equipo,
          id_user_chofer: dbViaje.id_user_chofer,
          tipo_trayecto: esRetorno ? 'RETORNO' : 'IDA',
          codigo_proyecto: dbViaje.codi_proyecto || dbViaje.nombre_proyecto || 'GSP-OT',
          es_interno: Boolean(dbViaje.es_interno || dbViaje.es_requerimiento_interno || String(dbViaje.codi_proyecto || '').toUpperCase().startsWith('INT-')),
          sucursal_origen: dbViaje.sucursal_origen || dbViaje.origen_nombre || '',
          sucursal_destino: dbViaje.sucursal_destino || dbViaje.obra_nombre || '',
          patente: dbViaje.patente || 'S/P',
          modelo: dbViaje.modelo || 'Maquinaria de Izaje',
          tipo_equipo: dbViaje.tipo_equipo || 'GRUAS TELESCOPICAS',
          obra_nombre: dbViaje.obra_nombre || 'Obra Mandante',
          obra_direccion: dbViaje.obra_direccion || 'Faena Operacional GSP',
          chofer_nombre: dbViaje.chofer_nombre || 'Conductor Asignado',
          estado_viaje: yaLlego ? 'ARRIBADO_FAENA' : (yaSalio ? 'EN_RUTA' : 'ASIGNADO'),
          foto_salida: dbViaje.foto_odometro_salida_path || dbViaje.foto_tablero_salida_path || dbViaje.foto_salida || null,
          foto_odometro_salida: dbViaje.foto_odometro_salida_path || dbViaje.foto_tablero_salida_path || dbViaje.foto_salida || null,
          foto_horometro_salida: dbViaje.foto_horometro_salida_path || null,
          foto_llegada: dbViaje.foto_odometro_llegada_path || dbViaje.foto_tablero_llegada_path || dbViaje.foto_llegada || null,
          foto_odometro_llegada: dbViaje.foto_odometro_llegada_path || dbViaje.foto_tablero_llegada_path || dbViaje.foto_llegada || null,
          foto_horometro_camion_llegada: dbViaje.foto_horometro_camion_llegada_path || null,
          foto_horometro_grua_llegada: dbViaje.foto_horometro_grua_llegada_path || null,
          fecha_salida_patio: dbViaje.fecha_salida_patio,
          fecha_salida_faena: dbViaje.fecha_salida_faena,
          fecha_llegada_faena: dbViaje.fecha_llegada_faena,
          fecha_llegada_patio: dbViaje.fecha_llegada_patio,
          timestamp_inicio: esRetorno ? (dbViaje.fecha_salida_faena || dbViaje.fecha_salida_patio) : dbViaje.fecha_salida_patio,
          timestamp_llegada: esRetorno ? (dbViaje.fecha_llegada_patio || dbViaje.fecha_llegada_faena) : dbViaje.fecha_llegada_faena,
          odometro_salida: dbViaje.km_inicial,
          horometro_salida: dbViaje.horometro_inicial,
          odometro_llegada: dbViaje.km_final,
          horometro_llegada: dbViaje.horometro_final,
          obs_termino: dbViaje.obs_termino,
          cargas_combustible: dbViaje.cargas_combustible || [],
          combustible_salida: dbViaje.combustible_salida || null,
          combustible_llegada: dbViaje.combustible_llegada || null,
          cantidad_estanques: dbViaje.cantidad_estanques || null,
          lineas_servicio: dbViaje.lineas_servicio || [],
          piso_minimo_estructurador: dbViaje.piso_minimo_estructurador || null,
          pings_ruta: dbViaje.pings_ruta || [],
          total_pings_gps: (dbViaje.pings_ruta && dbViaje.pings_ruta.length) || 0
        }
        totalPingsEnRuta.value = viaje.value.total_pings_gps

        await guardarSesionLocal(tokenViaje.value, viaje.value)
        if (viaje.value.estado_viaje === 'EN_RUTA') {
          iniciarMotorEnRuta()
        }
      }
    } catch (err) {
      console.warn('No se pudo cargar viaje desde backend, usando caché local:', err)
      const guardada = await obtenerSesionLocal(tokenViaje.value)
      if (guardada) {
        viaje.value = { ...viaje.value, ...guardada }
        totalPingsEnRuta.value = (viaje.value.pings_ruta && viaje.value.pings_ruta.length) || 0
        if (viaje.value.estado_viaje === 'EN_RUTA') {
          iniciarMotorEnRuta()
        }
      }
    } finally {
      cargandoViaje.value = false
    }
  } else {
    // Modo demo
    const guardada = await obtenerSesionLocal(tokenViaje.value)
    if (guardada) {
      viaje.value = { ...viaje.value, ...guardada }
      totalPingsEnRuta.value = (viaje.value.pings_ruta && viaje.value.pings_ruta.length) || 0
      if (viaje.value.estado_viaje === 'EN_RUTA') {
        iniciarMotorEnRuta()
      }
    } else if (tokenViaje.value.includes('demo') || route.query.fase === 'arribado') {
      cambiarFaseDemo('ARRIBADO_FAENA')
    }
  }

  // 2. Si es servicio de plataforma BSM, consultar estado del acta para candados de retorno
  if (viaje.value.id_proyecto && esServicioPlataformaBsm.value) {
    await consultarEstadoActaBsm(viaje.value.id_proyecto)
  }

  // Sincronizar mutaciones en background
  if (isOnline.value) {
    await sincronizarMutacionesConBackend(tokenViaje.value, apiAxios)
  }
  await actualizarContadorPendientes()
})

onUnmounted(() => {
  detenerMotorEnRuta()
  window.removeEventListener('online', onOnlineStatusChange)
  window.removeEventListener('offline', onOnlineStatusChange)
})
</script>
