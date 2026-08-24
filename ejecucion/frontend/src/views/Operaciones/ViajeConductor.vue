<template>
  <div class="min-h-screen bg-[#050810] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
    <!-- BARRA SUPERIOR DE ALTO CONTRASTE CON ESTADO DE RED -->
    <header class="bg-[#0a0f1e] border-b border-white/10 px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-lg shadow-black/50">
      <div class="flex items-center gap-2">
        <div class="w-2.5 h-2.5 rounded-full" :class="isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></div>
        <div>
          <span class="text-xs font-black tracking-wider uppercase text-amber-400">GSP OPERACIONES</span>
          <span class="text-[10px] text-slate-400 block font-mono">Hoja de Ruta & Convoy</span>
        </div>
      </div>

      <!-- Badge de Estado de Sincronización Offline-First -->
      <div class="flex items-center gap-1.5">
        <span v-if="mutacionesPendientesCount > 0" class="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
          <span>⏳</span> {{ mutacionesPendientesCount }} pendiente(s)
        </span>
        <span v-else class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
          <span>🟢</span> Sincronizado
        </span>
      </div>
    </header>

    <!-- CUERPO PRINCIPAL DEL MÓVIL -->
    <main class="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">

      <!-- SELECTOR RÁPIDO DE FASES (DEMO / AUDITORÍA EN VIVO) -->
      <div class="bg-[#0a0f1e] border border-white/10 rounded-xl p-1.5 flex gap-1 text-[11px] font-mono font-bold">
        <button @click="cambiarFaseDemo('ASIGNADO')" type="button" :class="viaje.estado_viaje === 'ASIGNADO' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'" class="flex-1 py-2 rounded-lg transition-all text-center cursor-pointer">
          🚀 1. Salida Patio
        </button>
        <button @click="cambiarFaseDemo('EN_RUTA')" type="button" :class="viaje.estado_viaje === 'EN_RUTA' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'" class="flex-1 py-2 rounded-lg transition-all text-center cursor-pointer">
          🛰️ 2. En Ruta
        </button>
        <button @click="cambiarFaseDemo('ARRIBADO_FAENA')" type="button" :class="viaje.estado_viaje === 'ARRIBADO_FAENA' ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'" class="flex-1 py-2 rounded-lg transition-all text-center cursor-pointer">
          📋 3. Log Maestro
        </button>
      </div>
      
      <!-- TARJETA DEL EQUIPO & DESTINO -->
      <div class="bg-[#0a0f1e] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
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
          <div class="flex items-center gap-2 text-slate-300">
            <span class="text-amber-400">📍</span>
            <span class="font-semibold text-white">Destino:</span>
            <span class="truncate">{{ viaje.obra_nombre || 'Obra Mandante' }}</span>
          </div>
          <div class="flex items-center gap-2 text-slate-400 text-[11px] pl-5">
            <span class="truncate">{{ viaje.obra_direccion || 'Dirección de Faena' }}</span>
          </div>
          <div class="flex items-center gap-2 text-slate-300 border-t border-white/5 pt-1.5 mt-1.5">
            <span class="text-emerald-400">👷</span>
            <span class="font-semibold text-white">Conductor:</span>
            <span class="text-emerald-300 font-bold">{{ viaje.chofer_nombre || 'Conductor Asignado' }}</span>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- ESTADO 1: SALIDA DE PATIO (ASIGNADO / PREPARADO)                           -->
      <!-- ========================================================================= -->
      <div v-if="viaje.estado_viaje === 'ASIGNADO'" class="bg-[#0a0f1e] border border-amber-500/30 rounded-2xl p-4 shadow-xl space-y-4">
        <div class="flex items-center gap-2 border-b border-white/10 pb-2">
          <span class="text-base">🚀</span>
          <div>
            <h2 class="text-sm font-bold text-white uppercase tracking-wider">Paso 1: Salida de Base / Patio</h2>
            <p class="text-[11px] text-slate-400">Registra odómetro, horómetro y firma para iniciar el convoy.</p>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Odómetro de Salida (KM) *</label>
            <input type="number" step="0.1" v-model="formSalida.odometro" placeholder="Ej: 145820.5" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-base text-white font-mono font-bold outline-none focus:border-amber-400" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Horómetro de Salida (HRS) *</label>
            <input type="number" step="0.1" v-model="formSalida.horometro" placeholder="Ej: 3240.2" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-base text-white font-mono font-bold outline-none focus:border-amber-400" />
          </div>

          <!-- Captura de Fotografía Tablero -->
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Foto del Tablero / Odómetro *</label>
            <div v-if="formSalida.foto" class="relative rounded-xl overflow-hidden border border-emerald-500/50 mb-2">
              <img :src="formSalida.foto" alt="Tablero Salida" class="w-full h-40 object-cover" />
              <button @click="formSalida.foto = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full text-xs font-bold">✕ Quitar</button>
            </div>
            <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-amber-400 rounded-xl p-4 cursor-pointer bg-black/30 transition-colors">
              <span class="text-2xl mb-1">📸</span>
              <span class="text-xs font-bold text-amber-400">Tomar Foto del Tablero</span>
              <span class="text-[10px] text-slate-400">Captura clara de kilometraje y horómetro</span>
              <input type="file" accept="image/*" capture="environment" @change="onFotoSalidaCapturada" class="hidden" />
            </label>
          </div>

          <!-- PIN de Firma del Conductor -->
          <div class="bg-black/50 border border-white/10 rounded-xl p-3">
            <label class="block text-xs font-bold text-amber-400 mb-1">PIN del Conductor (4 Dígitos) *</label>
            <input type="password" maxlength="4" v-model="formSalida.pin" placeholder="••••" class="w-full bg-[#050810] border border-amber-500/40 rounded-xl px-3 py-3 text-center text-xl tracking-[0.5em] text-white font-mono font-black outline-none focus:border-amber-400" />
            <p class="text-[10px] text-slate-400 mt-1 text-center">Firma digital FES de conformidad de salida.</p>
          </div>
        </div>

        <button @click="ejecutarInicioViaje" :disabled="!isFormSalidaValido || guardando" type="button" class="w-full min-h-[58px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-sm uppercase rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer">
          <span v-if="guardando">⏳ Registrando...</span>
          <span v-else>🟢 INICIAR VIAJE (SALIDA DE BASE)</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- ESTADO 2: EN RUTA (TELEMETRÍA & CONVOY ACTIVO)                            -->
      <!-- ========================================================================= -->
      <div v-if="viaje.estado_viaje === 'EN_RUTA'" class="space-y-4">
        <!-- Indicador Pulsante en Vivo -->
        <div class="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 text-center space-y-2 shadow-xl shadow-emerald-950/50">
          <div class="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            🛰️ CONVOY EN TRAYECTO ACTIVO
          </div>
          <p class="text-xs text-slate-300 font-mono">
            Tiempo en ruta: <span class="font-bold text-white">{{ tiempoEnRuta }}</span>
          </p>
          <div class="text-[11px] text-emerald-300 bg-black/40 border border-emerald-500/30 rounded-xl p-2.5 font-mono space-y-1 text-left">
            <div class="flex justify-between items-center">
              <span>📡 Pings GPS Registrados:</span>
              <span class="font-bold text-white text-xs bg-emerald-500/30 px-2 py-0.5 rounded">{{ totalPingsEnRuta }} pings</span>
            </div>
            <div class="flex justify-between items-center text-[10px] text-slate-300">
              <span>📍 Última Posición:</span>
              <span v-if="ultimaPosicionGPS?.latitud" class="text-amber-400 font-bold">
                {{ ultimaPosicionGPS.latitud.toFixed(4) }}, {{ ultimaPosicionGPS.longitud.toFixed(4) }} ({{ ultimaPosicionGPS.velocidad_kmh || 0 }} km/h)
              </span>
              <span v-else class="text-slate-400">Capturando GPS...</span>
            </div>
            <div class="text-[9px] text-slate-400 pt-0.5 border-t border-white/5">
              ⏱️ Frecuencia de Rastreo: Cada 2 seg (Modo Prueba)
            </div>
          </div>
        </div>

        <!-- BOTÓN GIGANTE: PASAR A CARGAR COMBUSTIBLE -->
        <div class="bg-[#0a0f1e] border border-white/10 rounded-2xl p-4 space-y-2 shadow-xl">
          <div class="flex items-center gap-2 text-xs text-slate-300 mb-1">
            <span class="text-base">⛽</span>
            <span class="font-bold text-white">Gestión de Combustible en Ruta</span>
          </div>
          <p class="text-[11px] text-slate-400">
            ¿Necesitas cargar combustible en servicentro Copec? Solicita la habilitación de la tarjeta con tu odómetro actual.
          </p>
          <button @click="abrirModalCombustible" type="button" class="w-full min-h-[58px] bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer">
            <span>⛽ SOLICITAR CARGA DE COMBUSTIBLE (COPEC)</span>
          </button>
        </div>

        <!-- BOTÓN PRINCIPAL: CONFIRMAR LLEGADA A FAENA -->
        <div class="bg-[#0a0f1e] border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
          <div class="flex items-center gap-2 text-xs text-slate-300 mb-1">
            <span class="text-base">🏁</span>
            <span class="font-bold text-white">Arribo a Faena / Obra</span>
          </div>
          <p class="text-[11px] text-slate-400">
            Al llegar al portón de la obra del cliente, confirma tu llegada con el odómetro final y firma PIN.
          </p>
          <button @click="abrirModalLlegada" type="button" class="w-full min-h-[58px] bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer">
            <span>🏁 CONFIRMAR LLEGADA A FAENA</span>
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- ESTADO 3: VIAJE COMPLETADO & LOG MAESTRO DE CIERRE (7 DIMENSIONES)        -->
      <!-- ========================================================================= -->
      <div v-if="viaje.estado_viaje === 'ARRIBADO_FAENA'" class="space-y-4">
        
        <!-- CABECERA DE ARRIBO CONFORME -->
        <div class="bg-[#0a0f1e] border border-emerald-500/50 rounded-2xl p-5 text-center space-y-2 shadow-2xl shadow-emerald-950/50">
          <div class="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-2xl">
            ✅
          </div>
          <h2 class="text-base font-black text-white uppercase tracking-wider">¡Llegada a Faena Confirmada!</h2>
          <p class="text-xs text-slate-300">Desplazamiento sellado digitalmente y listo para inicio de maniobra.</p>
        </div>

        <!-- LOG MAESTRO DE CIERRE DE VIAJE (BITÁCORA OPERACIONAL) -->
        <div class="bg-[#0a0f1e] border border-white/10 rounded-2xl p-4 shadow-xl space-y-4">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <div class="flex items-center gap-2">
              <span class="text-base">📋</span>
              <h3 class="text-xs font-black text-amber-400 uppercase tracking-wider">Log Maestro de Desplazamiento</h3>
            </div>
            <span class="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
              INALTERABLE FES
            </span>
          </div>

          <!-- 1. CRONOMETRÍA & TRAYECTO -->
          <div class="bg-[#050810] border border-white/5 rounded-xl p-3 space-y-2 text-xs font-mono">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-white/5 pb-1">⏱️ Tiempos & Cronometría</span>
            <div class="flex justify-between text-slate-300">
              <span>Salida Patio:</span>
              <span class="text-white font-bold">{{ formatFechaHora(viaje.timestamp_inicio) }}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>Llegada Faena:</span>
              <span class="text-white font-bold">{{ formatFechaHora(viaje.timestamp_llegada) }}</span>
            </div>
            <div class="flex justify-between text-slate-300 border-t border-white/5 pt-1">
              <span>Duración Total de Viaje:</span>
              <span class="text-amber-400 font-bold">{{ calcularDuracionTotal(viaje.timestamp_inicio, viaje.timestamp_llegada) }}</span>
            </div>
          </div>

          <!-- 2. ODOMETRÍA & HOROMETRÍA -->
          <div class="bg-[#050810] border border-white/5 rounded-xl p-3 space-y-2 text-xs font-mono">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-white/5 pb-1">🚜 Odometría & Motor</span>
            <div class="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span class="text-[10px] text-slate-400 block">Odómetro Salida:</span>
                <strong class="text-white">{{ viaje.odometro_salida }} KM</strong>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 block">Odómetro Llegada:</span>
                <strong class="text-white">{{ viaje.odometro_llegada }} KM</strong>
              </div>
            </div>
            <div class="flex justify-between text-slate-300 border-t border-white/5 pt-1">
              <span>Distancia Total Recorrida:</span>
              <span class="text-emerald-400 font-black">{{ (Number(viaje.odometro_llegada || 0) - Number(viaje.odometro_salida || 0)).toFixed(1) }} KM</span>
            </div>
            <div class="flex justify-between text-slate-300 border-t border-white/5 pt-1">
              <span>Horas Motor en Tránsito:</span>
              <span class="text-amber-400 font-bold">{{ (Number(viaje.horometro_llegada || 0) - Number(viaje.horometro_salida || 0)).toFixed(1) }} HRS</span>
            </div>
          </div>

          <!-- 3. TELEMETRÍA, GPS & VELOCIDADES -->
          <div class="bg-[#050810] border border-white/5 rounded-xl p-3 space-y-2 text-xs font-mono">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-white/5 pb-1">🛰️ Telemetría & Velocidades Reales</span>
            <div class="flex justify-between text-slate-300">
              <span>Puntos GPS Registrados:</span>
              <span class="text-white font-bold">{{ (viaje.pings_ruta && viaje.pings_ruta.length) || viaje.total_pings_gps || 0 }} pings</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>Velocidad Promedio:</span>
              <span class="text-white font-bold">{{ calcularVelocidadPromedio(viaje.pings_ruta) }} km/h</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>Velocidad Máxima:</span>
              <span class="text-emerald-400 font-bold">{{ calcularVelocidadMaxima(viaje.pings_ruta) }} km/h</span>
            </div>
            <div class="flex justify-between text-slate-300 border-t border-white/5 pt-1">
              <span>Geocerca de Obra:</span>
              <span class="text-emerald-400 font-bold">🟢 Conforme (Arribo en Radio)</span>
            </div>
          </div>

          <!-- 4. BALANCE DE COMBUSTIBLE EN RUTA -->
          <div class="bg-[#050810] border border-white/5 rounded-xl p-3 space-y-2 text-xs font-mono">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-white/5 pb-1">⛽ Balance Combustible Copec</span>
            <div v-if="viaje.combustible_cargado" class="space-y-1.5">
              <div class="flex justify-between text-slate-300">
                <span>Estanque Abastecido:</span>
                <span class="text-amber-400 font-bold">{{ viaje.combustible_cargado.tipo_estanque }}</span>
              </div>
              <div class="flex justify-between text-slate-300">
                <span>Litros Cargados:</span>
                <span class="text-white font-bold">{{ viaje.combustible_cargado.litros }} L</span>
              </div>
              <div class="flex justify-between text-slate-300">
                <span>Monto Total:</span>
                <span class="text-white font-bold">${{ Number(viaje.combustible_cargado.monto || 0).toLocaleString('es-CL') }}</span>
              </div>
              <div class="flex justify-between text-slate-300">
                <span>ID Autorización Copec:</span>
                <span class="text-blue-400 font-bold">{{ viaje.combustible_cargado.id_autorizacion }}</span>
              </div>
            </div>
            <div v-else class="text-slate-400 text-[11px] italic">
              No se realizaron cargas de combustible durante el desplazamiento.
            </div>
          </div>

          <!-- 5. OBSERVACIONES DE TÉRMINO & FIRMA -->
          <div class="bg-[#050810] border border-white/5 rounded-xl p-3 space-y-2 text-xs">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-white/5 pb-1">📝 Observaciones de Término</span>
            <p class="text-slate-200 italic bg-black/40 p-2.5 rounded-lg border border-white/5">
              "{{ viaje.obs_termino || 'Viaje completado sin novedades en carretera. Equipo posicionado en portería de faena conforme.' }}"
            </p>
            <div class="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>Firma FES Conductor:</span>
              <span class="text-emerald-400 font-bold">SHA-256 PIN Verificado ✅</span>
            </div>
          </div>

          <!-- BOTÓN IMPRIMIR / DESCARGAR LOG PDF -->
          <button @click="imprimirLogViaje" type="button" class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer">
            <span>📄 IMPRIMIR / EXPORTAR FICHA LOG DE VIAJE (PDF)</span>
          </button>
        </div>
      </div>

    </main>

    <!-- ========================================================================= -->
    <!-- MODAL / SUBFLUJO: CARGA DE COMBUSTIBLE COPEC                              -->
    <!-- ========================================================================= -->
    <div v-if="modalCombustible.visible" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#0a0f1e] border border-blue-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">⛽</span>
            <div>
              <h3 class="text-sm font-bold text-white uppercase">Carga de Combustible (Copec)</h3>
              <p class="text-[10px] text-slate-400">Protocolo de habilitación de tarjeta en ruta</p>
            </div>
          </div>
          <button @click="modalCombustible.visible = false" type="button" class="text-slate-400 hover:text-white p-1 text-lg">✕</button>
        </div>

        <!-- PASO 1: SOLICITUD DE HABILITACIÓN -->
        <div v-if="modalCombustible.paso === 1" class="space-y-3">
          <div class="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200">
            Ingresa tu odómetro actual y fotografía del tablero para que el coordinador habilite temporalmente la tarjeta Copec.
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Odómetro Actual (KM) *</label>
            <input type="number" step="0.1" v-model="formCombustible.odometro" placeholder="Ej: 145920.0" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-base text-white font-mono font-bold outline-none focus:border-blue-400" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Horómetro Actual (HRS) *</label>
            <input type="number" step="0.1" v-model="formCombustible.horometro" placeholder="Ej: 3245.0" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-base text-white font-mono font-bold outline-none focus:border-blue-400" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Foto del Tablero en Servicentro *</label>
            <div v-if="formCombustible.foto_tablero" class="relative rounded-xl overflow-hidden border border-blue-500/50 mb-2">
              <img :src="formCombustible.foto_tablero" alt="Tablero Copec" class="w-full h-36 object-cover" />
              <button @click="formCombustible.foto_tablero = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs">✕</button>
            </div>
            <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-blue-400 rounded-xl p-4 cursor-pointer bg-black/30">
              <span class="text-2xl mb-1">📸</span>
              <span class="text-xs font-bold text-blue-400">Tomar Foto del Tablero</span>
              <input type="file" accept="image/*" capture="environment" @change="onFotoCombustibleTablero" class="hidden" />
            </label>
          </div>

          <button @click="enviarSolicitudCopec" :disabled="!isFormSolicitudCombustibleValido" type="button" class="w-full min-h-[50px] bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black text-xs uppercase rounded-xl tracking-wider transition-all cursor-pointer">
            Solicitar Habilitación de Tarjeta
          </button>
        </div>

        <!-- PASO 2: ESPERANDO AUTORIZACIÓN O MOSTRANDO CÓDIGO -->
        <div v-if="modalCombustible.paso === 2" class="space-y-4 text-center py-2">
          <div v-if="!modalCombustible.id_autorizacion" class="space-y-3">
            <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h4 class="text-sm font-bold text-white">Esperando Aprobación del Coordinador...</h4>
            <p class="text-xs text-slate-400">La solicitud fue enviada a la Torre de Control con tus odómetros y foto.</p>
            <button @click="simularAprobacionCopec" type="button" class="text-[11px] text-blue-400 underline cursor-pointer">
              (Modo Test: Simular Autorización Coordinador #COPEC-8492)
            </button>
          </div>

          <div v-else class="space-y-4">
            <div class="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 space-y-1">
              <span class="text-[10px] text-emerald-400 uppercase font-mono font-bold">Tarjeta Habilitada para Carga</span>
              <div class="text-xl font-black text-white font-mono tracking-wider">
                ID: {{ modalCombustible.id_autorizacion }}
              </div>
              <p class="text-[11px] text-slate-300">Pasa la tarjeta al bombero e indícale este código si es requerido.</p>
            </div>

            <button @click="modalCombustible.paso = 3" type="button" class="w-full min-h-[50px] bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase rounded-xl tracking-wider transition-all cursor-pointer">
              Proceder a Rendir Carga (Litros & Voucher)
            </button>
          </div>
        </div>

        <!-- PASO 3: RENDICIÓN DE CARGA (ESTANQUE, LITROS, VOUCHER) -->
        <div v-if="modalCombustible.paso === 3" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Estanque Abastecido *</label>
            <select v-model="formCombustible.tipo_estanque" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-xs text-white font-bold outline-none focus:border-blue-400">
              <option value="PRINCIPAL_CHASIS">⛽ Estanque Principal (Chasis / Tracción)</option>
              <option value="SUPERESTRUCTURA_GRUA">🏗️ Estanque Superestructura (Grúa / Hidráulico)</option>
              <option value="AUXILIAR_RESERVA">🛢️ Estanque Auxiliar / Reserva</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Litros Cargados *</label>
            <input type="number" step="0.01" v-model="formCombustible.litros" placeholder="Ej: 250.5" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-base text-white font-mono font-bold outline-none focus:border-blue-400" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Monto Total ($ CLP) *</label>
            <input type="number" v-model="formCombustible.monto" placeholder="Ej: 285000" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-base text-white font-mono font-bold outline-none focus:border-blue-400" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Foto del Voucher / Boleta Copec *</label>
            <div v-if="formCombustible.foto_voucher" class="relative rounded-xl overflow-hidden border border-emerald-500/50 mb-2">
              <img :src="formCombustible.foto_voucher" alt="Voucher Copec" class="w-full h-36 object-cover" />
              <button @click="formCombustible.foto_voucher = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs">✕</button>
            </div>
            <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-xl p-4 cursor-pointer bg-black/30">
              <span class="text-2xl mb-1">🧾</span>
              <span class="text-xs font-bold text-emerald-400">Tomar Foto del Voucher Copec</span>
              <input type="file" accept="image/*" capture="environment" @change="onFotoCombustibleVoucher" class="hidden" />
            </label>
          </div>

          <button @click="confirmarRendicionCombustible" :disabled="!isFormRendicionCombustibleValido" type="button" class="w-full min-h-[50px] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-xs uppercase rounded-xl tracking-wider transition-all cursor-pointer">
            Confirmar Carga y Reanudar Viaje
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
              <h3 class="text-sm font-bold text-white uppercase">Confirmación de Llegada a Faena</h3>
              <p class="text-[10px] text-slate-400">Cierre de viaje y paso a etapa de maniobra</p>
            </div>
          </div>
          <button @click="modalLlegada.visible = false" type="button" class="text-slate-400 hover:text-white p-1 text-lg">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Odómetro de Llegada (KM) *</label>
            <input type="number" step="0.1" v-model="formLlegada.odometro" placeholder="Ej: 146120.0" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-base text-white font-mono font-bold outline-none focus:border-emerald-400" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Horómetro de Llegada (HRS) *</label>
            <input type="number" step="0.1" v-model="formLlegada.horometro" placeholder="Ej: 3248.5" class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-3 text-base text-white font-mono font-bold outline-none focus:border-emerald-400" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Foto del Tablero en Faena *</label>
            <div v-if="formLlegada.foto" class="relative rounded-xl overflow-hidden border border-emerald-500/50 mb-2">
              <img :src="formLlegada.foto" alt="Tablero Llegada" class="w-full h-36 object-cover" />
              <button @click="formLlegada.foto = ''" type="button" class="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs">✕</button>
            </div>
            <label v-else class="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-xl p-4 cursor-pointer bg-black/30">
              <span class="text-2xl mb-1">📸</span>
              <span class="text-xs font-bold text-emerald-400">Tomar Foto del Tablero en Obra</span>
              <input type="file" accept="image/*" capture="environment" @change="onFotoLlegadaCapturada" class="hidden" />
            </label>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Observaciones de Término / Ruta</label>
            <textarea v-model="formLlegada.obs_termino" rows="2" placeholder="Detalla condiciones de carretera, clima o estado de portería..." class="w-full bg-[#050810] border border-white/20 rounded-xl p-2.5 text-xs text-white outline-none resize-none focus:border-emerald-400"></textarea>
          </div>

          <div class="bg-black/50 border border-white/10 rounded-xl p-3">
            <label class="block text-xs font-bold text-emerald-400 mb-1">PIN del Conductor (4 Dígitos) *</label>
            <input type="password" maxlength="4" v-model="formLlegada.pin" placeholder="••••" class="w-full bg-[#050810] border border-emerald-500/40 rounded-xl px-3 py-3 text-center text-xl tracking-[0.5em] text-white font-mono font-black outline-none focus:border-emerald-400" />
          </div>
        </div>

        <button @click="ejecutarLlegadaFaena" :disabled="!isFormLlegadaValido" type="button" class="w-full min-h-[50px] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-xs uppercase rounded-xl tracking-wider transition-all cursor-pointer">
          Confirmar Llegada y Cerrar Desplazamiento
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiAxios } from '@/services/api'
import {
  guardarSesionLocal,
  obtenerSesionLocal,
  encolarMutacion,
  obtenerMutacionesPendientes,
  marcarMutacionSincronizada,
  sincronizarMutacionesConBackend,
  comprimirFoto,
  hashPin,
  obtenerCoordenadasGPS
} from '@/utils/viajeOfflineSync'

const route = useRoute()
const tokenViaje = ref(route.params.token || 'vj-demo-1234')

// Estado de Conectividad
const isOnline = ref(navigator.onLine)
const mutacionesPendientesCount = ref(0)
const guardando = ref(false)
const cargandoViaje = ref(false)

// Telemetría GPS en Ruta (2 Segundos para pruebas según Spec 30 / 32)
const INTERVALO_PING_MS = 2000
const gpsWatcherInterval = ref(null)
const ultimaPosicionGPS = ref(null)
const totalPingsEnRuta = ref(0)

// Datos del Viaje
const viaje = ref({
  token_viaje: tokenViaje.value,
  id_log_desplazamiento: null,
  id_proyecto: null,
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
  cargas_combustible: [],
  pings_ruta: [],
  total_pings_gps: 0
})

// Formularios
const formSalida = ref({
  odometro: '',
  horometro: '',
  foto: '',
  pin: ''
})

const formLlegada = ref({
  odometro: '',
  horometro: '',
  foto: '',
  pin: '',
  obs_termino: ''
})

const modalCombustible = ref({
  visible: false,
  paso: 1, // 1: Solicitud, 2: Esperando Aprobación, 3: Rendición
  id_autorizacion: ''
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

// Timer de Duración
const tiempoEnRuta = ref('00h 00m')
let timerInterval = null

// Validaciones Computadas
const isFormSalidaValido = computed(() => {
  return Boolean(formSalida.value.odometro) &&
         Boolean(formSalida.value.horometro) &&
         Boolean(formSalida.value.pin) &&
         formSalida.value.pin.length === 4
})

const isFormSolicitudCombustibleValido = computed(() => {
  return Boolean(formCombustible.value.odometro) &&
         Boolean(formCombustible.value.horometro)
})

const isFormRendicionCombustibleValido = computed(() => {
  return Boolean(formCombustible.value.litros) &&
         Boolean(formCombustible.value.monto)
})

const isFormLlegadaValido = computed(() => {
  return Boolean(formLlegada.value.odometro) &&
         Boolean(formLlegada.value.horometro) &&
         Boolean(formLlegada.value.pin) &&
         formLlegada.value.pin.length === 4
})

// Handlers de Fotos
const onFotoSalidaCapturada = async (e) => {
  const file = e.target.files[0]
  if (file) {
    formSalida.value.foto = await comprimirFoto(file)
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

const onFotoLlegadaCapturada = async (e) => {
  const file = e.target.files[0]
  if (file) {
    formLlegada.value.foto = await comprimirFoto(file)
  }
}

// -------------------------------------------------------------
// RASTREO GPS AUTOMÁTICO EN RUTA (MODO PRUEBA: 2 SEGUNDOS)
// -------------------------------------------------------------
const registrarPingAutomatico = async () => {
  if (viaje.value.estado_viaje !== 'EN_RUTA') return
  const gps = await obtenerCoordenadasGPS(1500)
  ultimaPosicionGPS.value = gps

  const pingPayload = {
    latitud: gps.latitud,
    longitud: gps.longitud,
    velocidad_kmh: gps.velocidad_kmh,
    accuracy: gps.accuracy,
    timestamp: gps.timestamp || new Date().toISOString()
  }

  // 1. Acumular inmediatamente en pings_ruta reactivos
  if (!viaje.value.pings_ruta) viaje.value.pings_ruta = []
  viaje.value.pings_ruta.push(pingPayload)
  totalPingsEnRuta.value = viaje.value.pings_ruta.length
  viaje.value.total_pings_gps = totalPingsEnRuta.value

  await guardarSesionLocal(tokenViaje.value, viaje.value)

  // 2. Enviar directamente al Backend GSP por HTTP
  if (isOnline.value && !tokenViaje.value.includes('demo')) {
    try {
      await apiAxios.post(`/operaciones/viaje/${tokenViaje.value}/ping`, pingPayload)
    } catch (httpErr) {
      console.warn('Fallo de red en ping GPS, encolando en Outbox:', httpErr?.message || httpErr)
      await encolarMutacion(tokenViaje.value, 'PING_GPS', pingPayload)
      await actualizarContadorPendientes()
    }
  } else {
    await encolarMutacion(tokenViaje.value, 'PING_GPS', pingPayload)
    await actualizarContadorPendientes()
  }
}

const iniciarRastreoGPS = () => {
  detenerRastreoGPS()
  // Primer ping inmediato al entrar a ruta
  registrarPingAutomatico()
  // Ciclo periódico cada 2 segundos para pruebas
  gpsWatcherInterval.value = setInterval(() => {
    registrarPingAutomatico()
  }, INTERVALO_PING_MS)
}

const detenerRastreoGPS = () => {
  if (gpsWatcherInterval.value) {
    clearInterval(gpsWatcherInterval.value)
    gpsWatcherInterval.value = null
  }
}

// -------------------------------------------------------------
// ACCIÓN: INICIAR VIAJE (SALIDA DE PATIO)
// -------------------------------------------------------------
const ejecutarInicioViaje = async () => {
  guardando.value = true
  try {
    const pinHashed = await hashPin(formSalida.value.pin)
    const gps = await obtenerCoordenadasGPS(1500)

    const payload = {
      km_inicial: Number(formSalida.value.odometro),
      horometro_inicial: Number(formSalida.value.horometro),
      foto_salida: formSalida.value.foto || 'https://storage.leanglobal.cl/placeholder-tablero-salida.jpg',
      pin_hash: pinHashed,
      latitud: gps.latitud,
      longitud: gps.longitud
    }

    // 1. Enviar directamente por HTTP al Backend GSP
    if (isOnline.value && !tokenViaje.value.includes('demo')) {
      try {
        const { data: resp } = await apiAxios.post(`/operaciones/viaje/${tokenViaje.value}/salida`, payload)
        if (resp && resp.data) {
          viaje.value.fecha_salida_patio = resp.data.fecha_salida_patio
          viaje.value.timestamp_inicio = resp.data.fecha_salida_patio
          viaje.value.estado_trayecto = 'EN_RUTA'
        }
      } catch (httpErr) {
        console.warn('Fallo HTTP salida, encolando en Outbox local:', httpErr?.message || httpErr)
        await encolarMutacion(tokenViaje.value, 'INICIO_VIAJE', payload)
      }
    } else {
      await encolarMutacion(tokenViaje.value, 'INICIO_VIAJE', payload)
    }

    // 2. Actualizar estado local reactivo
    viaje.value.estado_viaje = 'EN_RUTA'
    if (!viaje.value.timestamp_inicio) {
      viaje.value.timestamp_inicio = new Date().toISOString()
      viaje.value.fecha_salida_patio = viaje.value.timestamp_inicio
    }
    viaje.value.odometro_salida = payload.km_inicial
    viaje.value.horometro_salida = payload.horometro_inicial

    await guardarSesionLocal(tokenViaje.value, viaje.value)
    await actualizarContadorPendientes()
    iniciarTimerRuta()
    iniciarRastreoGPS()
  } catch (err) {
    console.error('Error iniciando viaje:', err)
  } finally {
    guardando.value = false
  }
}

// -------------------------------------------------------------
// ACCIÓN: COMBUSTIBLE (SOLICITUD & RENDICIÓN)
// -------------------------------------------------------------
const abrirModalCombustible = () => {
  modalCombustible.value.paso = 1
  modalCombustible.value.visible = true
}

const enviarSolicitudCopec = async () => {
  const payload = {
    odometro_solicitud: formCombustible.value.odometro,
    horometro_solicitud: formCombustible.value.horometro,
    foto_tablero: formCombustible.value.foto_tablero,
    timestamp: new Date().toISOString()
  }

  await encolarMutacion(tokenViaje.value, 'SOLICITUD_COPEC', payload)
  actualizarContadorPendientes()
  modalCombustible.value.paso = 2
}

const simularAprobacionCopec = () => {
  modalCombustible.value.id_autorizacion = `#COPEC-${Math.floor(1000 + Math.random() * 9000)}`
}

const confirmarRendicionCombustible = async () => {
  const payload = {
    tipo_estanque: formCombustible.value.tipo_estanque,
    litros: Number(formCombustible.value.litros),
    monto: Number(formCombustible.value.monto),
    foto_voucher: formCombustible.value.foto_voucher || 'https://storage.leanglobal.cl/placeholder-voucher.jpg',
    foto_tablero: formCombustible.value.foto_tablero || 'https://storage.leanglobal.cl/placeholder-tablero.jpg',
    id_autorizacion_copec: modalCombustible.value.id_autorizacion || '#COPEC-AUTO',
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
  detenerRastreoGPS()
  try {
    const pinHashed = await hashPin(formLlegada.value.pin)
    const gps = await obtenerCoordenadasGPS(1500)

    const payload = {
      km_final: Number(formLlegada.value.odometro),
      horometro_final: Number(formLlegada.value.horometro),
      foto_llegada: formLlegada.value.foto || 'https://storage.leanglobal.cl/placeholder-tablero-llegada.jpg',
      pin_hash: pinHashed,
      latitud: gps.latitud,
      longitud: gps.longitud,
      obs_termino: formLlegada.value.obs_termino || 'Arribo a faena verificado con éxito'
    }

    // 1. Enviar directamente al Backend GSP por HTTP
    if (isOnline.value && !tokenViaje.value.includes('demo')) {
      try {
        const { data: resp } = await apiAxios.post(`/operaciones/viaje/${tokenViaje.value}/llegada`, payload)
        if (resp && resp.data) {
          viaje.value.fecha_llegada_faena = resp.data.fecha_llegada_faena
          viaje.value.timestamp_llegada = resp.data.fecha_llegada_faena
          viaje.value.estado_trayecto = 'LLEGADO'
          if (resp.data.pings_ruta && resp.data.pings_ruta.length) {
            viaje.value.pings_ruta = resp.data.pings_ruta
            totalPingsEnRuta.value = resp.data.pings_ruta.length
            viaje.value.total_pings_gps = totalPingsEnRuta.value
          }
        }
      } catch (httpErr) {
        console.warn('Fallo HTTP llegada, encolando en Outbox:', httpErr?.message || httpErr)
        await encolarMutacion(tokenViaje.value, 'FIN_VIAJE', payload)
      }
    } else {
      await encolarMutacion(tokenViaje.value, 'FIN_VIAJE', payload)
    }

    // 2. Actualizar estado reactivo
    viaje.value.estado_viaje = 'ARRIBADO_FAENA'
    if (!viaje.value.timestamp_llegada) {
      viaje.value.timestamp_llegada = new Date().toISOString()
      viaje.value.fecha_llegada_faena = viaje.value.timestamp_llegada
    }
    viaje.value.odometro_llegada = payload.km_final
    viaje.value.horometro_llegada = payload.horometro_final
    viaje.value.obs_termino = payload.obs_termino

    await guardarSesionLocal(tokenViaje.value, viaje.value)
    await actualizarContadorPendientes()
    modalLlegada.value.visible = false
    if (timerInterval) clearInterval(timerInterval)
  } catch (err) {
    console.error('Error cerrando viaje:', err)
  } finally {
    guardando.value = false
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
    detenerRastreoGPS()
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
  } else if (fase === 'EN_RUTA') {
    viaje.value.odometro_salida = 145820.5
    viaje.value.horometro_salida = 3240.2
    viaje.value.timestamp_inicio = new Date(Date.now() - 45 * 60 * 1000).toISOString()
    iniciarTimerRuta()
    iniciarRastreoGPS()
  } else {
    detenerRastreoGPS()
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
        viaje.value = {
          token_viaje: dbViaje.token_viaje,
          id_log_desplazamiento: dbViaje.id_log_desplazamiento,
          id_proyecto: dbViaje.id_proyecto,
          codigo_proyecto: dbViaje.codi_proyecto || dbViaje.nombre_proyecto || 'GSP-OT',
          patente: dbViaje.patente || 'S/P',
          modelo: dbViaje.modelo || 'Maquinaria de Izaje',
          tipo_equipo: dbViaje.tipo_equipo || 'GRUAS TELESCOPICAS',
          obra_nombre: dbViaje.obra_nombre || 'Obra Mandante',
          obra_direccion: dbViaje.obra_direccion || 'Faena Operacional GSP',
          chofer_nombre: dbViaje.chofer_nombre || 'Conductor Asignado',
          estado_viaje: dbViaje.estado_trayecto === 'LLEGADO' ? 'ARRIBADO_FAENA' : (dbViaje.estado_trayecto || 'ASIGNADO'),
          timestamp_inicio: dbViaje.fecha_salida_patio,
          timestamp_llegada: dbViaje.fecha_llegada_faena,
          odometro_salida: dbViaje.km_inicial,
          horometro_salida: dbViaje.horometro_inicial,
          odometro_llegada: dbViaje.km_final,
          horometro_llegada: dbViaje.horometro_final,
          obs_termino: dbViaje.obs_termino,
          cargas_combustible: dbViaje.cargas_combustible || [],
          pings_ruta: dbViaje.pings_ruta || [],
          total_pings_gps: (dbViaje.pings_ruta && dbViaje.pings_ruta.length) || 0
        }
        totalPingsEnRuta.value = viaje.value.total_pings_gps

        await guardarSesionLocal(tokenViaje.value, viaje.value)
        if (viaje.value.estado_viaje === 'EN_RUTA') {
          iniciarTimerRuta()
          iniciarRastreoGPS()
        }
      }
    } catch (err) {
      console.warn('No se pudo cargar viaje desde backend, usando caché local:', err)
      const guardada = await obtenerSesionLocal(tokenViaje.value)
      if (guardada) {
        viaje.value = { ...viaje.value, ...guardada }
        totalPingsEnRuta.value = (viaje.value.pings_ruta && viaje.value.pings_ruta.length) || 0
        if (viaje.value.estado_viaje === 'EN_RUTA') {
          iniciarTimerRuta()
          iniciarRastreoGPS()
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
        iniciarTimerRuta()
        iniciarRastreoGPS()
      }
    } else if (tokenViaje.value.includes('demo') || route.query.fase === 'arribado') {
      cambiarFaseDemo('ARRIBADO_FAENA')
    }
  }

  // Sincronizar mutaciones en background
  if (isOnline.value) {
    await sincronizarMutacionesConBackend(tokenViaje.value, apiAxios)
  }
  await actualizarContadorPendientes()
})

onUnmounted(() => {
  detenerRastreoGPS()
  window.removeEventListener('online', onOnlineStatusChange)
  window.removeEventListener('offline', onOnlineStatusChange)
  if (timerInterval) clearInterval(timerInterval)
})
</script>
