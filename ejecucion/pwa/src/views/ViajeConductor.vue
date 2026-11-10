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

      <!-- ESTADO DE CARGA / SINCRONIZACIÓN INICIAL DEL VIAJE -->
      <div v-if="cargandoViaje" class="bg-[#0a0f1e] border border-blue-500/30 rounded-2xl p-6 text-center space-y-3 shadow-xl">
        <div class="animate-spin text-2xl">⏳</div>
        <p class="text-xs font-mono text-slate-300">Sincronizando estado operativo del viaje...</p>
      </div>

      <!-- ========================================================================= -->
      <!-- PASO 1: SALIDA DE PATIO (ACTIVO vs BLOQUEADO SOLO MIENTRAS ESTÁ EN RUTA)  -->
      <!-- ========================================================================= -->
      <!-- CASO A: BLOQUEADO (SOLO MIENTRAS ESTÁ EN RUTA; AL CERRAR QUEDA SOLO EL RESUMEN INFERIOR) -->
      <div v-else-if="viaje.estado_viaje === 'EN_RUTA'" class="bg-[#0a0f1e] border border-emerald-500/30 rounded-2xl p-4 shadow-lg space-y-2.5">
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

      <!-- CASO B: FORMULARIO ACTIVO (SOLO ANTES DE SALIR Y SI NO EXISTE SALIDA PREVIA) -->
      <div v-else-if="viaje.estado_viaje === 'ASIGNADO' && !viaje.fecha_salida_patio && !viaje.fecha_salida_faena" class="bg-[#0a0f1e] border border-amber-500/30 rounded-2xl p-4 shadow-xl space-y-4">
        <div class="flex items-center gap-2 border-b border-white/10 pb-2">
          <span class="text-base">🚀</span>
          <div>
            <h2 class="text-sm font-bold text-white uppercase tracking-wider">
              {{ viaje.tipo_trayecto === 'RETORNO' ? 'Paso 1: Salida de Faena hacia Base GSP' : 'Paso 1: Salida de Base / Patio' }}
            </h2>
            <p class="text-[11px] text-slate-400">
              {{ viaje.tipo_trayecto === 'RETORNO' ? 'Registra odómetro, horómetro del camión con sus 2 fotos y firma para iniciar retorno.' : 'Registra odómetro, horómetro del camión con sus 2 fotos y firma para iniciar el convoy.' }}
            </p>
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
              <button v-else @click="abrirCamaraInApp('odometro_salida', 'Foto Odómetro de Salida (KM)')" type="button" class="w-full flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-amber-400 rounded-xl p-3 cursor-pointer bg-black/40 transition-colors">
                <span class="text-xl mb-0.5">📸</span>
                <span class="text-xs font-bold text-amber-400">Tomar Foto del Odómetro (Tacógrafo)</span>
                <span class="text-[9px] text-slate-400">Cámara integrada en App (sin salir de pantalla)</span>
              </button>
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
              <button v-else @click="abrirCamaraInApp('horometro_salida', 'Foto Horómetro Motor Camión (HRS)')" type="button" class="w-full flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-amber-400 rounded-xl p-3 cursor-pointer bg-black/40 transition-colors">
                <span class="text-xl mb-0.5">📸</span>
                <span class="text-xs font-bold text-amber-400">Tomar Foto del Horómetro del Motor</span>
                <span class="text-[9px] text-slate-400">Cámara integrada en App (sin salir de pantalla)</span>
              </button>
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

          <!-- 3. Nivel de Combustible al Salir de Patio (Solo en Salida de Base GSP - IDA) -->
          <div v-if="viaje.tipo_trayecto !== 'RETORNO'" class="bg-black/30 border border-white/10 rounded-xl p-3 space-y-2">
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
              <button v-else @click="abrirCamaraInApp('combustible_salida', 'Foto Marcador Combustible Salida')" type="button" class="w-full flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-amber-400 rounded-xl p-2 cursor-pointer bg-black/40 text-xs text-amber-400 font-bold">
                <span>📸 Adjuntar Foto Marcador</span>
              </button>
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
            <template v-if="viaje.tipo_trayecto !== 'RETORNO'">
              <span class="text-slate-600">•</span>
              <span :class="formSalida.combustible_salida ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
                {{ formSalida.combustible_salida ? '✓' : '⚠️' }} Combustible
              </span>
            </template>
            <span class="text-slate-600">•</span>
            <span :class="(formSalida.pin && formSalida.pin.length === 4) ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">
              {{ (formSalida.pin && formSalida.pin.length === 4) ? '✓' : '⚠️' }} PIN ({{ formSalida.pin ? formSalida.pin.length : 0 }}/4)
            </span>
          </div>
        </div>

        <button @click="ejecutarInicioViaje" :disabled="guardando || !isFormSalidaValido || (esServicioPlataformaBsm && viaje.tipo_trayecto === 'RETORNO' && !actaBsm?.retiro_sellado)" type="button" class="w-full min-h-[58px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-base uppercase rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer">
          <span v-if="guardando">⏳ Registrando...</span>
          <span v-else>{{ viaje.tipo_trayecto === 'RETORNO' ? '🟢 INICIAR RETORNO (SALIDA DE FAENA)' : '🟢 INICIAR VIAJE (SALIDA DE BASE)' }}</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- PASO 2: EN RUTA (ACTIVO)                                                  -->
      <!-- ========================================================================= -->
      <div v-if="viaje.estado_viaje === 'EN_RUTA'" class="bg-[#0a0f1e] border border-blue-500/40 rounded-2xl p-4 shadow-xl space-y-3.5">
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
        <button @click="abrirModalCombustible" type="button" class="w-full py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold text-sm uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
          <span>⛽ Rendir Carga de Combustible (Copec)</span>
        </button>

        <!-- Botón Principal: Confirmar Llegada -->
        <button @click="abrirModalLlegada" type="button" class="w-full min-h-[56px] bg-emerald-500 hover:bg-emerald-400 text-black font-black text-base uppercase rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer">
          <span>CONFIRMAR LLEGADA</span>
        </button>

        <!-- Enlace Sutil: Consultar Datos de Salida -->
        <div class="text-center pt-1">
          <button @click="mostrarModalDatosSalida = true" type="button" class="text-[11px] text-slate-400 hover:text-white underline underline-offset-4 font-mono transition-colors">
            👁️ Consultar Datos Registrados de Salida
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- ESTADO 3: RESUMEN FINAL AL CIERRE (ÚNICO CUADRO INFERIOR)                 -->
      <!-- ========================================================================= -->
      <div v-if="viaje.estado_viaje === 'ARRIBADO_FAENA'" class="space-y-4">
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
              <span>⏳ Horómetro Camión Llegada:</span>
              <strong class="text-emerald-400">{{ viaje.horometro_llegada || viaje.horometro_final || '---' }} HRS</strong>
            </div>
            <div v-if="viaje.timestamp_llegada" class="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
              <span>Fecha / Hora Arribo:</span>
              <span>{{ formatFechaHora(viaje.timestamp_llegada) }}</span>
            </div>
          </div>

          <!-- BOTONES DE ACCIÓN SEGÚN TIPO DE TRAYECTO (NAVEGACIÓN INTERNA ROUTER) -->
          <div class="pt-2 space-y-2.5">
            <!-- Si es Retorno concluido: volver al Menú Principal -->
            <button
              v-if="viaje.tipo_trayecto === 'RETORNO'"
              type="button"
              @click="volverAlMenu"
              class="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-base uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <span>🏠</span>
              <span>VOLVER AL MENÚ PRINCIPAL ➔</span>
            </button>

            <!-- Si es Ida de Requerimiento Interno: botón para iniciar Viaje de Vuelta (Retorno) -->
            <template v-else-if="esMovimientoInterno">
              <button
                @click="iniciarViajeRetornoInterno"
                :disabled="iniciandoRetorno"
                type="button"
                class="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-base uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <span v-if="iniciandoRetorno" class="animate-spin">⏳</span>
                <span v-else>🔄</span>
                <span>{{ iniciandoRetorno ? 'GENERANDO HOJA DE VUELTA...' : `INICIAR VIAJE DE VUELTA (RETORNO A ${viaje.sucursal_origen || 'ORIGEN'}) ➔` }}</span>
              </button>
              <button
                type="button"
                @click="volverAlMenu"
                class="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
              >
                <span>🏠</span>
                <span>Volver al Menú Principal</span>
              </button>
            </template>

            <!-- Si es Ida Comercial: avanzar al Report Diario de Faena o al Acta de Entrega 360° de Plataforma -->
            <template v-else>
              <button
                v-if="esServicioPlataformaBsm"
                type="button"
                @click="irAActaPlataformaBsm"
                class="w-full py-4 bg-teal-500 hover:bg-teal-400 text-black font-black text-base uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <span>📋</span>
                <span>PASO 2: COMPLETAR ACTA DE ENTREGA 360° DE PLATAFORMA ➔</span>
              </button>
              <button
                v-else
                type="button"
                @click="irAReportDiario"
                class="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-base uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <span>📋</span>
                <span>PASO 2: INICIAR REPORT DIARIO DE FAENA ➔</span>
              </button>
              <button
                type="button"
                @click="volverAlMenu"
                class="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
              >
                <span>🏠</span>
                <span>Volver al Menú Principal</span>
              </button>
            </template>
          </div>
        </div>
      </div>

    </main>

    <!-- ========================================================================= -->
    <!-- MODAL DIRECTO: CARGA DE COMBUSTIBLE EN RUTA                               -->
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
            <button v-else @click="abrirCamaraInApp('combustible_voucher', 'Foto Voucher / Boleta Combustible')" type="button" class="w-full flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-xl p-3 cursor-pointer bg-black/30">
              <span class="text-2xl mb-1">🧾</span>
              <span class="text-xs font-bold text-emerald-400">Tomar Foto del Voucher</span>
            </button>
          </div>

          <button @click="confirmarRendicionCombustible" :disabled="!isFormRendicionCombustibleValido" type="button" class="w-full min-h-[50px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-black font-black text-sm uppercase rounded-xl tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20">
            Confirmar Carga de Combustible
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: CONFIRMAR LLEGADA A FAENA / PATIO                                  -->
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
            </div>
          </div>
          <button @click="modalLlegada.visible = false" type="button" class="text-slate-400 hover:text-white p-1 text-lg">✕</button>
        </div>

        <div class="space-y-3">
          <!-- BLOQUE 1: INSTRUMENTOS DEL CAMIÓN / CHASIS -->
          <div class="bg-black/30 border border-white/10 rounded-xl p-3 space-y-3">
            <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block border-b border-white/10 pb-1">
              🚚 Instrumentos Camión / Chasis
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
              <button v-else @click="abrirCamaraInApp('odometro_llegada', 'Foto Odómetro de Llegada (KM)')" type="button" class="w-full flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-xl p-3 cursor-pointer bg-black/40 transition-colors">
                <span class="text-xl mb-0.5">📸</span>
                <span class="text-xs font-bold text-emerald-400">Tomar Foto del Odómetro Llegada</span>
                <span class="text-[9px] text-slate-400">Cámara integrada en App (sin salir de pantalla)</span>
              </button>
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
              <button v-else @click="abrirCamaraInApp('horometro_camion_llegada', 'Foto Horómetro Camión Llegada (HRS)')" type="button" class="w-full flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-xl p-3 cursor-pointer bg-black/40 transition-colors">
                <span class="text-xl mb-0.5">📸</span>
                <span class="text-xs font-bold text-emerald-400">Tomar Foto del Horómetro Camión</span>
                <span class="text-[9px] text-slate-400">Cámara integrada en App (sin salir de pantalla)</span>
              </button>
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

          <!-- BLOQUE 2: COMBUSTIBLE AL INGRESAR A PATIO (SOLO EN RETORNO A BASE GSP) -->
          <div v-if="viaje.tipo_trayecto === 'RETORNO'" class="bg-black/50 border border-emerald-500/30 rounded-xl p-3 space-y-2.5">
            <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">⛽ Nivel de Combustible al Ingresar a Patio Central</span>
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
              <button v-else @click="abrirCamaraInApp('combustible_llegada', 'Foto Marcador Combustible Llegada')" type="button" class="w-full flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-xl p-3 cursor-pointer bg-black/30 transition-colors">
                <span class="text-xl mb-0.5">📸</span>
                <span class="text-xs font-bold text-emerald-400">Tomar Foto Marcador Combustible (Opcional)</span>
              </button>
            </div>
          </div>

          <!-- PIN DEL CONDUCTOR -->
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

        <button @click="ejecutarLlegadaFaena" :disabled="!isFormLlegadaValido || guardando" type="button" class="w-full min-h-[54px] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-base uppercase rounded-xl tracking-wider transition-all cursor-pointer">
          <span v-if="guardando">⏳ Registrando...</span>
          <span v-else>CONFIRMAR LLEGADA</span>
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

    <!-- ========================================================================= -->
    <!-- MODAL CÁMARA INTEGRADA IN-APP (EVITA CIERRE DE PESTAÑA EN ANDROID)        -->
    <!-- ========================================================================= -->
    <div v-if="modalCamara.visible" class="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#0a0f1e] border border-amber-500/40 rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl">
        <div class="flex justify-between items-center border-b border-white/10 pb-2.5">
          <div class="flex items-center gap-2">
            <span class="text-lg">📸</span>
            <div>
              <h3 class="text-xs font-bold text-white uppercase tracking-wider">{{ modalCamara.titulo || 'Capturar Evidencia Fotográfica' }}</h3>
              <p class="text-[10px] text-emerald-400 font-mono">Cámara integrada • Tus datos digitados están respaldados</p>
            </div>
          </div>
          <button @click="cerrarCamaraInApp" type="button" class="text-slate-400 hover:text-white px-2 py-1 text-base font-bold">✕</button>
        </div>

        <div v-if="!modalCamara.errorStream" class="relative rounded-xl overflow-hidden bg-black border border-white/15">
          <video ref="videoCamaraRef" autoplay playsinline muted class="w-full h-64 sm:h-72 object-cover bg-black"></video>
          <div class="absolute inset-x-4 top-1/2 -translate-y-1/2 h-20 border-2 border-dashed border-amber-400/70 rounded-xl pointer-events-none flex items-end justify-center pb-1">
            <span class="text-[9px] font-mono bg-black/70 text-amber-300 px-2 py-0.5 rounded">Enfoque el marcador / lectura</span>
          </div>
        </div>
        <div v-else class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 space-y-1 text-center">
          <p class="font-bold">⚠️ {{ modalCamara.errorStream }}</p>
          <p class="text-[11px] text-slate-300">Usa el botón inferior para seleccionar o tomar la foto con el selector del teléfono (tus datos ya están guardados).</p>
        </div>

        <div class="space-y-2 pt-1">
          <button
            v-if="!modalCamara.errorStream"
            @click="capturarFotoDesdeVideo"
            type="button"
            class="w-full min-h-[52px] bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <span>📸</span>
            <span>CAPTURAR FOTO AHORA</span>
          </button>

          <button
            @click="abrirSelectorArchivoSistema"
            type="button"
            class="w-full py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>📂</span>
            <span>Subir desde Galería / Cámara del Teléfono</span>
          </button>
          <input ref="inputArchivoFallbackRef" type="file" accept="image/*" @change="onFallbackArchivoCamara" class="hidden" />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiAxios from '@/services/api'
import {
  guardarSesionLocal,
  obtenerSesionLocal,
  encolarMutacion,
  obtenerMutacionesPendientes,
  sincronizarMutacionesConBackend,
  comprimirFoto,
  hashPin,
  obtenerCoordenadasGPS,
  iniciarWatcherGPS,
  detenerWatcherGPS,
  getUltimaPosicionGPS
} from '@/utils/viajeOfflineSync'

const route = useRoute()
const router = useRouter()
const tokenViaje = ref(route.params.token || 'vj-demo-1234')

// Estado de Conectividad
const isOnline = ref(navigator.onLine)
const mutacionesPendientesCount = ref(0)
const guardando = ref(false)
const cargandoViaje = ref(false)

// Telemetría GPS en Ruta (10 Segundos)
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

// Navegación interna de la APP (Desacoplada de la Web)
const irAReportDiario = () => {
  const pId = viaje.value?.id_proyecto
  const eqId = viaje.value?.id_equipo
  if (pId) {
    const query = { id_proyecto: String(pId) }
    if (eqId) query.id_equipo = String(eqId)
    router.push({ path: '/reportDiario', query })
    return
  }
  router.push('/surveys')
}

const irAActaPlataformaBsm = () => {
  const pId = viaje.value?.id_proyecto
  router.push({
    path: '/surveys',
    query: {
      abrir_acta_bsm: 'ENTREGA',
      ...(pId ? { id_proyecto: String(pId) } : {})
    }
  })
}

const volverAlMenu = () => {
  router.push('/surveys')
}

// Timer de Duración
const tiempoEnRuta = ref('00h 00m')
let timerInterval = null

// Validaciones Computadas
const isFormSalidaValido = computed(() => {
  const baseValida = Boolean(formSalida.value.odometro) &&
                     Boolean(formSalida.value.foto_odometro) &&
                     Boolean(formSalida.value.horometro) &&
                     Boolean(formSalida.value.foto_horometro) &&
                     Boolean(formSalida.value.pin) &&
                     formSalida.value.pin.length === 4

  if (viaje.value.tipo_trayecto !== 'RETORNO') {
    return baseValida && Boolean(formSalida.value.combustible_salida)
  }
  return baseValida
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
  const mod = String(viaje.value?.modelo || '').toUpperCase()
  if (t.includes('GRUA') || t.includes('PLUMA') || t.includes('HORQUILLA')) return false
  const lineas = Array.isArray(viaje.value?.lineas_servicio) ? viaje.value.lineas_servicio : []
  const tieneLineaPlat = lineas.some(l => {
    const s = `${l.tipo || ''} ${l.subcategoria || ''} ${l.descripcion || ''}`.toUpperCase()
    return s.includes('PLATAFORMA') || s.includes('ALZA') || s.includes('MANLIFT') || s.includes('TIJERA') || s.includes('ARTICULAD')
  })
  return (
    t.includes('PLATAFORMA') ||
    t.includes('ALZA') ||
    t.includes('MANLIFT') ||
    t.includes('TIJERA') ||
    mod.includes('JLG') ||
    mod.includes('GENIE') ||
    mod.includes('HAULOTTE') ||
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

  if (viaje.value.tipo_trayecto === 'RETORNO') {
    return baseValida && Boolean(formLlegada.value.combustible_chasis?.trim())
  }
  return baseValida
})

// =============================================================
// PERSISTENCIA EN TIEMPO REAL DE BORRADOR Y CÁMARA INTEGRADA
// =============================================================
const getDraftKey = () => `gsp_borrador_viaje_${tokenViaje.value || 'default'}`
const getProjectDraftKey = () => {
  const pid = viaje.value?.id_proyecto
  const eid = viaje.value?.id_equipo
  return (pid && eid) ? `gsp_borrador_viaje_pry_${pid}_eq_${eid}` : null
}

const persistirBorradorViaje = () => {
  try {
    const snapshot = {
      updatedAt: Date.now(),
      formSalida: { ...formSalida.value },
      formLlegada: { ...formLlegada.value },
      formCombustible: { ...formCombustible.value },
      modalLlegadaVisible: Boolean(modalLlegada.value?.visible),
      modalCombustibleVisible: Boolean(modalCombustible.value?.visible)
    }
    const raw = JSON.stringify(snapshot)
    localStorage.setItem(getDraftKey(), raw)
    const pKey = getProjectDraftKey()
    if (pKey) localStorage.setItem(pKey, raw)
  } catch (e) {
    console.warn('[ViajeConductor] No se pudo guardar borrador en localStorage:', e?.message)
  }
}

const restaurarBorradorViaje = () => {
  try {
    const pKey = getProjectDraftKey()
    const raw = localStorage.getItem(getDraftKey()) || (pKey ? localStorage.getItem(pKey) : null)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return false

    if (parsed.formSalida && typeof parsed.formSalida === 'object') {
      Object.entries(parsed.formSalida).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          formSalida.value[k] = v
        }
      })
    }
    if (parsed.formLlegada && typeof parsed.formLlegada === 'object') {
      Object.entries(parsed.formLlegada).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          formLlegada.value[k] = v
        }
      })
    }
    if (parsed.formCombustible && typeof parsed.formCombustible === 'object') {
      Object.entries(parsed.formCombustible).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          formCombustible.value[k] = v
        }
      })
    }
    if (parsed.modalLlegadaVisible && viaje.value.estado_viaje === 'EN_RUTA') {
      modalLlegada.value.visible = true
    }
    return true
  } catch (e) {
    console.warn('[ViajeConductor] No se pudo restaurar borrador:', e?.message)
    return false
  }
}

watch([formSalida, formLlegada, formCombustible], () => {
  persistirBorradorViaje()
}, { deep: true })

// Cámara Integrada WebRTC In-App
const modalCamara = ref({
  visible: false,
  campo: '',
  titulo: '',
  errorStream: ''
})
const videoCamaraRef = ref(null)
const inputArchivoFallbackRef = ref(null)
let activeMediaStream = null

const detenerStreamCamara = () => {
  if (activeMediaStream) {
    try {
      activeMediaStream.getTracks().forEach(t => t.stop())
    } catch (err) {
      console.warn(err)
    }
    activeMediaStream = null
  }
  if (videoCamaraRef.value) {
    try {
      videoCamaraRef.value.srcObject = null
    } catch (err) {
      console.warn(err)
    }
  }
}

const asignarFotoCapturada = (campo, base64Img) => {
  if (!base64Img) return
  switch (campo) {
    case 'odometro_salida':
      formSalida.value.foto_odometro = base64Img
      formSalida.value.foto = base64Img
      break
    case 'horometro_salida':
      formSalida.value.foto_horometro = base64Img
      break
    case 'combustible_salida':
      formSalida.value.foto_combustible = base64Img
      break
    case 'combustible_voucher':
      formCombustible.value.foto_voucher = base64Img
      break
    case 'odometro_llegada':
      formLlegada.value.foto_odometro = base64Img
      formLlegada.value.foto = base64Img
      break
    case 'horometro_camion_llegada':
      formLlegada.value.foto_horometro_camion = base64Img
      break
    case 'combustible_llegada':
      formLlegada.value.foto_combustible = base64Img
      break
  }
  persistirBorradorViaje()
}

const abrirCamaraInApp = async (campo, titulo = 'Capturar Foto') => {
  persistirBorradorViaje()
  detenerStreamCamara()
  modalCamara.value = {
    visible: true,
    campo,
    titulo,
    errorStream: ''
  }

  await nextTick()
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    modalCamara.value.errorStream = 'Tu navegador requiere usar el selector de archivos del teléfono.'
    return
  }

  try {
    activeMediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })
    await nextTick()
    if (videoCamaraRef.value) {
      videoCamaraRef.value.srcObject = activeMediaStream
      await videoCamaraRef.value.play().catch(() => {})
    }
  } catch (err) {
    console.warn('[ViajeConductor] Fallback a selector por permiso/cámara:', err?.message)
    modalCamara.value.errorStream = 'No se pudo abrir el visor directo. Usa el botón inferior.'
  }
}

const cerrarCamaraInApp = () => {
  detenerStreamCamara()
  modalCamara.value.visible = false
}

const capturarFotoDesdeVideo = () => {
  const video = videoCamaraRef.value
  if (!video || !video.videoWidth || !video.videoHeight) {
    modalCamara.value.errorStream = 'La cámara aún se está enfocando. Intenta de nuevo o usa el botón inferior.'
    return
  }
  const maxWidth = 1280
  let width = video.videoWidth
  let height = video.videoHeight
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, width, height)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.78)
  asignarFotoCapturada(modalCamara.value.campo, dataUrl)
  cerrarCamaraInApp()
}

const abrirSelectorArchivoSistema = () => {
  persistirBorradorViaje()
  if (inputArchivoFallbackRef.value) {
    inputArchivoFallbackRef.value.value = ''
    inputArchivoFallbackRef.value.click()
  }
}

const onFallbackArchivoCamara = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const comp = await comprimirFoto(file)
    asignarFotoCapturada(modalCamara.value.campo, comp)
    cerrarCamaraInApp()
  } catch (err) {
    console.error('[ViajeConductor] Error procesando foto:', err)
  }
}

const copiarFotoOdometroAHorometroSalida = () => {
  formSalida.value.foto_horometro = formSalida.value.foto_odometro
  persistirBorradorViaje()
}

const copiarFotoHorometroAOdometroSalida = () => {
  formSalida.value.foto_odometro = formSalida.value.foto_horometro
  formSalida.value.foto = formSalida.value.foto_horometro
  persistirBorradorViaje()
}

const copiarFotoOdometroAHorometroLlegada = () => {
  formLlegada.value.foto_horometro_camion = formLlegada.value.foto_odometro
  persistirBorradorViaje()
}

const copiarFotoHorometroAOdometroLlegada = () => {
  formLlegada.value.foto_odometro = formLlegada.value.foto_horometro_camion
  formLlegada.value.foto = formLlegada.value.foto_horometro_camion
  persistirBorradorViaje()
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
    const gps = getUltimaPosicionGPS()
    if (!gps || !gps.latitud || !gps.longitud || gps.fuente !== 'GPS_REAL') return

    if (gps.accuracy && Number(gps.accuracy) > 45) {
      console.warn('[GPS] Ping descartado por baja precisión (>45m):', gps.accuracy)
      return
    }

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

    if (!viaje.value.pings_ruta) viaje.value.pings_ruta = []
    viaje.value.pings_ruta.push(pingPayload)
    totalPingsEnRuta.value = viaje.value.pings_ruta.length
    viaje.value.total_pings_gps = totalPingsEnRuta.value

    await guardarSesionLocal(tokenViaje.value, viaje.value)

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

  iniciarWatcherGPS((pos) => {
    ultimaPosicionGPS.value = pos
  })

  segundosParaProximoPing.value = 10
  registrarPingAutomatico()

  timerInterval = setInterval(() => {
    if (viaje.value.estado_viaje !== 'EN_RUTA') return

    if (viaje.value.timestamp_inicio) {
      const diff = Math.floor((new Date() - new Date(viaje.value.timestamp_inicio)) / 1000)
      const horas = Math.floor(diff / 3600).toString().padStart(2, '0')
      const mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0')
      tiempoEnRuta.value = `${horas}h ${mins}m`
    }

    segundosParaProximoPing.value--

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
    if (viaje.value.tipo_trayecto !== 'RETORNO' && !formSalida.value.combustible_salida) faltantes.push('Nivel de Combustible al Salir de Patio')
    if (!formSalida.value.pin) faltantes.push('PIN del Conductor')
    else if (String(formSalida.value.pin).trim().length !== 4) faltantes.push('El PIN debe tener exactamente 4 dígitos')
    alert(`⚠️ Requisitos incompletos para autorizar salida:\n\n• ${faltantes.join('\n• ')}`)
    return
  }

  const odoSal = Number(formSalida.value.odometro)
  const horoSal = Number(formSalida.value.horometro)
  const minOdo = Number(viaje.value.odometro_acumulado || 0)
  const minHoro = Number(viaje.value.horometro_chasis_acumulado || 0)
  // REQ-1143 / SPEC-006 v1.6: Deshabilitación temporal de bloqueo de odómetro de salida
  if (minOdo > 0 && odoSal < minOdo) {
    console.warn(`[REQ-1143] Odómetro de Salida (${odoSal} KM) menor al acumulado (${minOdo} KM). Registro permitido temporalmente.`)
  }
  if (minHoro > 0 && horoSal < minHoro) {
    alert(`🚨 Valor Incremental Inválido:\n\nEl Horómetro de Salida (${horoSal} HRS) no puede ser menor al último registro acumulado del equipo (${minHoro} HRS).`)
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

  formCombustible.value.litros = ''
  formCombustible.value.monto = ''
  formCombustible.value.foto_voucher = ''

  alert('⛽ Carga de combustible registrada exitosamente en el Log de Viaje.')
}

// -------------------------------------------------------------
// ACCIÓN: LLEGADA A FAENA / PATIO
// -------------------------------------------------------------
const abrirModalLlegada = () => {
  if (!formLlegada.value.odometro && viaje.value.odometro_salida) {
    formLlegada.value.odometro = viaje.value.odometro_salida
  }
  if (!formLlegada.value.horometro && viaje.value.horometro_salida) {
    formLlegada.value.horometro = viaje.value.horometro_salida
  }
  modalLlegada.value.visible = true
}

const ejecutarLlegadaFaena = async () => {
  const odoLleg = Number(formLlegada.value.odometro)
  const horoLleg = Number(formLlegada.value.horometro)
  const odoSal = Number(viaje.value.odometro_salida || 0)
  const horoSal = Number(viaje.value.horometro_salida || 0)
  // REQ-1143 / SPEC-006 v1.6: Deshabilitación temporal de bloqueo de odómetro de llegada
  if (odoSal > 0 && odoLleg < odoSal) {
    console.warn(`[REQ-1143] Odómetro de Llegada (${odoLleg} KM) menor a Salida (${odoSal} KM). Registro permitido temporalmente.`)
  }
  if (horoSal > 0 && horoLleg < horoSal) {
    alert(`🚨 Valor Incremental Inválido:\n\nEl Horómetro de Llegada (${horoLleg} HRS) no puede ser menor al Horómetro de Salida (${horoSal} HRS).`)
    return
  }
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
    horometro_grua: null,
    horometro_grua_inicial: null,
    combustible_llegada: (viaje.value.tipo_trayecto === 'RETORNO') ? {
      chasis: formLlegada.value.combustible_chasis,
      foto: formLlegada.value.foto_combustible
    } : null,
    foto_llegada: formLlegada.value.foto_odometro || formLlegada.value.foto || null,
    foto_odometro_llegada: formLlegada.value.foto_odometro || null,
    foto_horometro_camion_llegada: formLlegada.value.foto_horometro_camion || null,
    foto_horometro_grua_llegada: null,
    pin_hash: pinHashed,
    latitud: gps.latitud,
    longitud: gps.longitud,
    obs_termino: 'Arribo verificado con éxito',
    device_timestamp: new Date().toISOString()
  }

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

  viaje.value.estado_viaje = 'ARRIBADO_FAENA'
  if (!viaje.value.timestamp_llegada) {
    viaje.value.timestamp_llegada = new Date().toISOString()
    viaje.value.fecha_llegada_faena = viaje.value.timestamp_llegada
  }
  viaje.value.odometro_llegada = payload.km_final
  viaje.value.horometro_llegada = payload.horometro_final
  viaje.value.horometro_grua_llegada = null
  viaje.value.obs_termino = payload.obs_termino
  viaje.value.foto_llegada = payload.foto_llegada
  viaje.value.foto_odometro_llegada = payload.foto_odometro_llegada
  viaje.value.foto_horometro_camion_llegada = payload.foto_horometro_camion_llegada
  viaje.value.foto_horometro_grua_llegada = null
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
    tokenViaje.value = finalToken
    await router.push(`/viaje/${finalToken}`)
    window.location.reload()
  } catch (err) {
    console.error('Error iniciando viaje de retorno:', err)
    alert('No se pudo generar la hoja de viaje de retorno: ' + (err.response?.data?.error || err.message))
  } finally {
    iniciandoRetorno.value = false
  }
}

// -------------------------------------------------------------
// HELPERS DE FORMATEO
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// GESTIÓN DE ESTADO LOCAL & SYNC
// -------------------------------------------------------------
const actualizarContadorPendientes = async () => {
  const pendientes = await obtenerMutacionesPendientes(tokenViaje.value)
  mutacionesPendientesCount.value = pendientes.length
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
    viaje.value.obs_termino = 'Viaje completado sin novedades en carretera.'
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
  restaurarBorradorViaje()

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
          foto_horometro_grua_llegada: null,
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
          odometro_acumulado: Number(dbViaje.odometro_acumulado || 0),
          horometro_chasis_acumulado: Number(dbViaje.horometro_chasis_acumulado || 0),
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
        // Restaurar cualquier dato digitado o foto capturada en borrador ANTES de rellenar con acumulado por defecto
        restaurarBorradorViaje()
        if (viaje.value.estado_viaje === 'ASIGNADO') {
          // REQ-1143 / SPEC-006 v1.6: Prellenar odómetro solo si es cifra válida y razonable (< 500.000 km)
          if (!formSalida.value.odometro && viaje.value.odometro_acumulado > 0 && viaje.value.odometro_acumulado < 500000) {
            formSalida.value.odometro = viaje.value.odometro_acumulado
          }
          if (!formSalida.value.horometro && viaje.value.horometro_chasis_acumulado > 0) {
            formSalida.value.horometro = viaje.value.horometro_chasis_acumulado
          }
        }

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
      restaurarBorradorViaje()
    } finally {
      cargandoViaje.value = false
    }
  } else {
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
    restaurarBorradorViaje()
  }

  if (viaje.value.id_proyecto && esServicioPlataformaBsm.value) {
    await consultarEstadoActaBsm(viaje.value.id_proyecto)
  }

  if (isOnline.value) {
    await sincronizarMutacionesConBackend(tokenViaje.value, apiAxios)
  }
  await actualizarContadorPendientes()
})

onUnmounted(() => {
  detenerStreamCamara()
  detenerMotorEnRuta()
  window.removeEventListener('online', onOnlineStatusChange)
  window.removeEventListener('offline', onOnlineStatusChange)
})
</script>
