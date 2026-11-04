<template>
  <v-container class="pa-3 max-w-xl mx-auto pb-32" style="max-width: 680px;">
    
    <!-- ========================================================================= -->
    <!-- CABECERA SUPERIOR PARA CONTROL DE FLOTA (MOMENTOS 1 Y 2)                  -->
    <!-- ========================================================================= -->
    <div v-if="faseVisual !== 3" class="mb-4">
      <div class="d-flex align-center justify-space-between mb-3">
        <v-btn icon="mdi-arrow-left" size="large" variant="flat" color="slate-800" class="border-2 border-white/30 rounded-2xl" @click="volver"></v-btn>
        <div class="text-center flex-grow-1 px-2">
          <div class="text-xs sm:text-sm font-black text-amber-400 text-uppercase tracking-widest">
            GSP OPERACIONES FAENA
          </div>
          <div class="text-xl sm:text-2xl font-black text-white">
            {{ faseVisual === 1 ? 'INICIO REPORT' : 'TERMINO DE REPORT' }}
          </div>
        </div>
        <v-chip size="large" color="amber-darken-2" variant="flat" class="text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl shadow-md font-mono">
          {{ etiquetaDiaFecha }}
        </v-chip>
      </div>

      <!-- ALERTA DE SERVICIO CONCLUIDO (Spec 57 / REQ-025) -->
      <div v-if="servicioConcluido" class="bg-red-950/60 border border-red-500/60 rounded-2xl p-4 text-center text-white mb-4">
        <div class="text-2xl mb-1">🛑</div>
        <div class="text-sm font-black uppercase text-red-300">Faena Concluida</div>
        <div class="text-xs text-slate-200 mt-1">{{ mensajeConcluido }}</div>
        <v-btn color="grey-darken-3" class="mt-3 font-bold text-xs" prepend-icon="mdi-arrow-left" @click="volver">
          Volver a Mis Faenas
        </v-btn>
      </div>
    </div>

    <!-- CABECERA REPORT MANDANTE (PASO 3) -->
    <div v-else class="mb-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <v-btn prepend-icon="mdi-arrow-left" size="default" variant="outlined" color="grey-lighten-2" class="font-black text-sm rounded-xl h-10" @click="faseVisual = 2">
          Volver
        </v-btn>
        <v-chip size="large" color="emerald-darken-1" variant="flat" class="text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl shadow-md font-mono">
          {{ etiquetaDiaFecha }}
        </v-chip>
      </div>
      <div class="text-center py-1">
        <div class="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-widest">
          DOCUMENTO OFICIAL DE LIQUIDACIÓN
        </div>
        <div class="text-2xl font-black text-white">
          📋 Report Diario de Izaje
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <v-card v-if="cargando" class="pa-10 text-center rounded-3xl bg-slate-900 border-2 border-white/10">
      <v-progress-circular indeterminate color="amber" size="64" width="6" class="mb-4"></v-progress-circular>
      <div class="text-xl font-bold text-slate-200">Cargando datos de faena...</div>
    </v-card>

    <!-- REQ-1060 / SPEC-088: Error de carga del contexto (nunca mostrar formulario con valores por defecto) -->
    <v-card v-else-if="errorContexto" class="pa-6 text-center rounded-3xl bg-red-950/60 border-2 border-red-500/60 text-white">
      <div class="text-3xl mb-2">📡</div>
      <div class="text-lg font-black text-red-200 mb-1">No se pudo cargar la jornada desde el servidor</div>
      <div class="text-sm text-slate-200 mb-4">
        Revise su señal de datos y vuelva a intentar. Sus datos de inicio guardados NO se han perdido.
      </div>
      <v-btn color="amber-darken-2" size="large" class="font-black text-slate-950 rounded-xl" prepend-icon="mdi-refresh" @click="cargarContexto()">
        Reintentar
      </v-btn>
    </v-card>

    <div v-else class="space-y-6">
      <!-- REQ-1060: Aviso de jornada de un día anterior sin cerrar -->
      <div v-if="jornadaDiaAnterior" class="bg-orange-950/70 border-2 border-orange-500/70 rounded-2xl p-4 text-white">
        <div class="text-sm font-black uppercase text-orange-300 mb-1">⚠️ Jornada anterior sin cerrar</div>
        <div class="text-sm text-slate-100">
          Tiene una jornada abierta del <strong>{{ form.fecha_reporte }}</strong> (iniciada {{ form.hora_inicio }} hrs).
          Registre su término y la firma del mandante para cerrarla antes de iniciar una nueva.
        </div>
      </div>

      <!-- REQ-1060: OT sin equipo asignado -->
      <div v-if="!equipoSeleccionado" class="bg-red-950/60 border-2 border-red-500/60 rounded-2xl p-4 text-white text-sm">
        <strong class="text-red-300">Esta OT no tiene una grúa asignada.</strong>
        No es posible registrar la jornada. Contacte a Control de Gestión para asignar el equipo.
      </div>
      <!-- ========================================================================= -->
      <!-- MOMENTO 1: INICIO DE JORNADA                                              -->
      <!-- ========================================================================= -->
      <div v-show="faseVisual === 1" class="space-y-5">
        <!-- TARJETA DE ANTECEDENTES OT & FLOTA -->
        <v-card
          class="pa-5 rounded-3xl border-2 border-amber-500/40 text-white shadow-xl"
          style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-lg font-mono text-amber-300 font-black">
              OT: {{ proyecto.codi_proyecto || 'GSP-OT' }}
            </span>
            <v-chip size="default" color="success" variant="flat" class="font-black text-xs uppercase px-3 py-1 rounded-xl">
              🟢 EN FAENA
            </v-chip>
          </div>

          <div class="text-2xl font-black text-white mb-1.5 leading-tight">
            {{ proyecto.cliente_nombre || 'LeanGlobal Spa' }}
          </div>
          
          <div class="text-base text-slate-200 mb-3 font-bold leading-relaxed">
            📍 <strong class="text-white">Faena:</strong> {{ proyecto.obra_nombre || 'Faena Operativa' }}
            <span v-if="proyecto.obra_direccion" class="text-slate-300 d-block mt-0.5">• {{ proyecto.obra_direccion }}</span>
          </div>

          <v-divider class="my-3 border-white/20"></v-divider>

          <!-- GRÚA ASIGNADA Y TRIPULACIÓN -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-3.5 bg-slate-950/90 rounded-2xl border border-amber-400/40">
              <span class="text-amber-400 font-black d-block text-uppercase text-xs tracking-wider mb-0.5">🚜 Grúa Asignada</span>
              <strong class="text-amber-300 font-mono text-2xl font-black d-block tracking-wider">
                {{ equipoSeleccionado?.patente || 'SIN GRÚA ASIGNADA' }}
              </strong>
              <span class="text-white text-sm font-bold d-block mt-0.5">
                {{ equipoSeleccionado?.modelo || '-' }}
              </span>
            </div>

            <div class="p-3.5 bg-slate-950/90 rounded-2xl border border-amber-400/40">
              <span class="text-amber-400 font-black d-block text-uppercase text-xs tracking-wider mb-0.5">👷 Tripulación</span>
              <div class="text-base font-black text-white d-block mt-0.5">
                Op: {{ operadorNombre }}
              </div>
              <div v-if="riggerNombre" class="text-sm font-bold text-slate-200 d-block mt-0.5">
                Rig: {{ riggerNombre }}
              </div>
            </div>
          </div>
        </v-card>

        <!-- FORMULARIO DE INICIO REPORT -->
        <v-card
          class="pa-5 rounded-3xl border-2 border-slate-700 text-white shadow-xl"
          style="background-color: #0b1120;"
        >
          <!-- Aviso Especial para Día > 1 (Equipo en Faena) -->
          <div v-if="diaCorrelativo > 1" class="mb-4 pa-4 rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/40 text-left">
            <div class="d-flex align-center ga-2 text-emerald-400 font-black text-sm uppercase mb-1">
              <span>🏕️</span>
              <span>Servicio Multi-Día • Jornada Día {{ diaCorrelativo }}</span>
            </div>
            <p class="text-xs text-slate-300 mb-0 font-medium">
              El equipo pernocta en obra y no registra traslado. Ingrese manualmente el horómetro actual de la superestructura.
            </p>
          </div>

          <!-- Hora Inicio (Numérico HH : MM sin reloj circular) -->
          <div class="mb-4">
            <label class="text-sm font-black text-emerald-400 text-uppercase mb-1.5 d-block tracking-wider">
              🟢 HORA DE INICIO EN FAENA *
            </label>
            <div class="d-flex align-center justify-center ga-2 bg-slate-950 border-2 border-slate-700 rounded-2xl p-3">
              <div class="flex-1 text-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase d-block mb-1">HORA (00-23)</span>
                <input
                  :value="horaInicioHH"
                  type="text"
                  inputmode="numeric"
                  maxlength="2"
                  placeholder="08"
                  class="w-full bg-slate-900 border-2 border-emerald-500/50 rounded-xl py-2.5 text-white font-mono text-3xl font-black text-center focus:border-emerald-400 focus:outline-none"
                  @focus="$event.target.select()"
                  @input="onInputHora('hora_inicio', 'HH', $event)"
                  @blur="normalizarHora('hora_inicio')"
                />
              </div>
              <span class="text-3xl font-mono font-black text-emerald-400 pt-4">:</span>
              <div class="flex-1 text-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase d-block mb-1">MINUTOS (00-59)</span>
                <input
                  :value="horaInicioMM"
                  type="text"
                  inputmode="numeric"
                  maxlength="2"
                  placeholder="00"
                  class="w-full bg-slate-900 border-2 border-emerald-500/50 rounded-xl py-2.5 text-white font-mono text-3xl font-black text-center focus:border-emerald-400 focus:outline-none"
                  @focus="$event.target.select()"
                  @input="onInputHora('hora_inicio', 'MM', $event)"
                  @blur="normalizarHora('hora_inicio')"
                />
              </div>
            </div>
          </div>

          <!-- Horómetro Superestructura Inicial (OBLIGATORIO) -->
          <div class="mb-4">
            <div class="d-flex align-center justify-space-between mb-1.5">
              <label class="text-sm font-black text-amber-300 text-uppercase tracking-wider">
                ⚙️ HORÓMETRO SUPERESTRUCTURA (INICIO) *
              </label>
            </div>
            <input
              v-model.number="form.horometro_inicio"
              type="number"
              step="0.1"
              placeholder="Ej: 3450.5"
              class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-amber-300 font-mono text-2xl font-black focus:border-amber-400 focus:outline-none text-center h-16 shadow-inner"
            />
          </div>

          <!-- FOTOGRAFÍA OBLIGATORIA DEL HORÓMETRO AL INICIO (CÁMARA WEBRTC IN-APP) -->
          <div class="mb-5">
            <input
              ref="inputFotoInicio"
              type="file"
              accept="image/*"
              data-bypass-inapp="true"
              class="d-none"
              @change="onFotoInicioSeleccionada"
            />

            <div v-if="form.foto_tablero_inicio" class="position-relative space-y-3">
              <div class="rounded-2xl overflow-hidden border-2 border-amber-400 bg-black flex items-center justify-center max-h-80 shadow-md">
                <img
                  :src="form.foto_tablero_inicio"
                  alt="Foto Tablero Inicio"
                  class="w-full h-auto max-h-80 object-contain"
                />
              </div>
              <div class="d-flex ga-3 mt-3">
                <v-btn
                  color="amber"
                  variant="flat"
                  size="x-large"
                  class="flex-grow-1 font-black text-lg h-16 rounded-2xl text-slate-950"
                  @click="capturarFotoHorometro('INICIO')"
                >
                  📸 CAMBIAR FOTO
                </v-btn>
                <v-btn
                  color="red-lighten-1"
                  variant="outlined"
                  size="x-large"
                  class="font-black text-lg h-16 rounded-2xl px-5"
                  @click="form.foto_tablero_inicio = null"
                >
                  🗑️ BORRAR
                </v-btn>
              </div>
            </div>

            <div v-else>
              <v-btn
                color="amber"
                variant="flat"
                size="x-large"
                block
                class="font-black text-base h-16 rounded-2xl d-flex align-center ga-2 text-slate-950 shadow-lg py-3"
                @click="capturarFotoHorometro('INICIO')"
              >
                <span class="text-2xl">📸</span>
                <span>FOTO HOROMETRO SUPERESTRUCTURA</span>
              </v-btn>
            </div>
          </div>

          <!-- BOTÓN DE GUARDAR INICIO REPORT -->
          <v-btn
            block
            size="x-large"
            color="amber-darken-2"
            class="font-black text-uppercase rounded-2xl py-4 min-h-[62px] text-lg shadow-xl tracking-wider text-slate-950 shadow-amber-500/20"
            :loading="enviandoInicio"
            :disabled="!puedeGuardarInicio"
            @click="guardarInicioJornada"
          >
            GUARDAR INICIO REPORT
          </v-btn>
        </v-card>
      </div>

      <!-- ========================================================================= -->
      <!-- MOMENTO 2: TÉRMINO DE JORNADA                                             -->
      <!-- ========================================================================= -->
      <div v-show="faseVisual === 2" class="space-y-5">
        <!-- RESUMEN COMPLETO DE OT, GRÚA, TRIPULACIÓN Y DATOS DE INICIO REGISTRADOS -->
        <v-card
          class="pa-5 rounded-3xl border-2 border-emerald-500/50 text-white shadow-xl"
          style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-lg font-mono text-amber-300 font-black">
              OT: {{ proyecto.codi_proyecto || 'GSP-OT' }}
            </span>
            <v-chip size="default" color="emerald" variant="flat" class="font-black text-xs uppercase px-3 py-1 rounded-xl">
              🟢 EN FAENA
            </v-chip>
          </div>

          <div class="text-2xl font-black text-white mb-1.5 leading-tight">
            {{ proyecto.cliente_nombre || 'LeanGlobal Spa' }}
          </div>
          <div class="text-base text-slate-200 mb-3 font-bold">
            📍 Faena: {{ proyecto.obra_nombre || 'Faena Operativa' }}
          </div>

          <!-- GRÚA Y TRIPULACIÓN -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div class="p-3 bg-slate-950/90 rounded-2xl border border-amber-400/40">
              <span class="text-amber-400 font-black d-block text-uppercase text-xs tracking-wider mb-0.5">🚜 Grúa Asignada</span>
              <strong class="text-amber-300 font-mono text-2xl font-black d-block tracking-wider">
                {{ equipoSeleccionado?.patente || 'SIN GRÚA ASIGNADA' }}
              </strong>
              <span class="text-white text-sm font-bold d-block">
                {{ equipoSeleccionado?.modelo || '-' }}
              </span>
            </div>

            <div class="p-3 bg-slate-950/90 rounded-2xl border border-amber-400/40">
              <span class="text-amber-400 font-black d-block text-uppercase text-xs tracking-wider mb-0.5">👷 Tripulación</span>
              <div class="text-base font-black text-white d-block">
                Op: {{ operadorNombre }}
              </div>
              <div v-if="riggerNombre" class="text-sm font-bold text-slate-200 d-block mt-0.5">
                Rig: {{ riggerNombre }}
              </div>
            </div>
          </div>

          <!-- DATOS DE INICIO (SOLO HORARIO DE INICIO MODIFICABLE, OCULTAR HORÓMETRO INICIAL) -->
          <div class="p-3.5 bg-emerald-950/60 rounded-2xl border-2 border-emerald-500/60">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-xs font-black text-emerald-400 uppercase tracking-wider">
                🟢 Horario de Inicio de Faena
              </div>
              <span class="text-[10px] text-emerald-300 font-bold bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-400/40">
                ✏️ Modificable
              </span>
            </div>
            <div class="d-flex align-center justify-center ga-2 bg-slate-950/90 rounded-xl p-2.5 border border-white/10">
              <input
                :value="horaInicioHH"
                type="text"
                inputmode="numeric"
                maxlength="2"
                placeholder="08"
                class="w-20 bg-slate-900 border border-emerald-500/50 rounded-lg py-1.5 text-emerald-300 font-mono text-2xl font-black text-center focus:outline-none focus:border-emerald-400"
                @focus="$event.target.select()"
                @input="onInputHora('hora_inicio', 'HH', $event)"
                @blur="normalizarHora('hora_inicio')"
              />
              <span class="text-2xl font-mono font-black text-emerald-400">:</span>
              <input
                :value="horaInicioMM"
                type="text"
                inputmode="numeric"
                maxlength="2"
                placeholder="00"
                class="w-20 bg-slate-900 border border-emerald-500/50 rounded-lg py-1.5 text-emerald-300 font-mono text-2xl font-black text-center focus:outline-none focus:border-emerald-400"
                @focus="$event.target.select()"
                @input="onInputHora('hora_inicio', 'MM', $event)"
                @blur="normalizarHora('hora_inicio')"
              />
            </div>
          </div>
        </v-card>

        <!-- FORMULARIO DE TÉRMINO DE REPORT -->
        <v-card
          class="pa-5 rounded-3xl border-2 border-slate-700 text-white shadow-xl"
          style="background-color: #0b1120;"
        >
          <!-- Hora Término (Numérico HH : MM sin reloj circular) -->
          <div class="mb-4">
            <label class="text-sm font-black text-red-400 text-uppercase mb-1.5 d-block tracking-wider">
              🔴 HORA DE TÉRMINO DE FAENA *
            </label>
            <div class="d-flex align-center justify-center ga-2 bg-slate-950 border-2 border-slate-700 rounded-2xl p-3">
              <div class="flex-1 text-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase d-block mb-1">HORA (00-23)</span>
                <input
                  :value="horaTerminoHH"
                  type="text"
                  inputmode="numeric"
                  maxlength="2"
                  placeholder="18"
                  class="w-full bg-slate-900 border-2 border-red-500/50 rounded-xl py-2.5 text-white font-mono text-3xl font-black text-center focus:border-red-400 focus:outline-none"
                  @focus="$event.target.select()"
                  @input="onInputHora('hora_termino', 'HH', $event)"
                  @blur="normalizarHora('hora_termino')"
                />
              </div>
              <span class="text-3xl font-mono font-black text-red-400 pt-4">:</span>
              <div class="flex-1 text-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase d-block mb-1">MINUTOS (00-59)</span>
                <input
                  :value="horaTerminoMM"
                  type="text"
                  inputmode="numeric"
                  maxlength="2"
                  placeholder="00"
                  class="w-full bg-slate-900 border-2 border-red-500/50 rounded-xl py-2.5 text-white font-mono text-3xl font-black text-center focus:border-red-400 focus:outline-none"
                  @focus="$event.target.select()"
                  @input="onInputHora('hora_termino', 'MM', $event)"
                  @blur="normalizarHora('hora_termino')"
                />
              </div>
            </div>
          </div>

          <!-- Tiempo de Colación (Botones Grandes) -->
          <div class="mb-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <label class="text-sm font-black text-amber-300 text-uppercase tracking-wider">
                🥪 TIEMPO DE COLACIÓN
              </label>
              <span class="text-sm font-mono font-black text-amber-400 bg-amber-950/90 px-3 py-1 rounded-lg border border-amber-500/50">
                {{ form.minutos_colacion === 0 ? 'Sin Colación (0h)' : `${form.minutos_colacion} min (${horasColacionFormateadas}h)` }}
              </span>
            </div>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="opcion in [0, 30, 45, 60, 90]"
                :key="opcion"
                type="button"
                class="py-2.5 px-1 rounded-xl border-2 font-black text-base transition-all"
                :class="form.minutos_colacion === opcion ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black' : 'bg-slate-900 text-slate-200 border-slate-700 font-bold'"
                @click="form.minutos_colacion = opcion"
              >
                {{ opcion === 0 ? '0m' : `${opcion}m` }}
              </button>
            </div>
          </div>

          <!-- ⏱️ RESUMEN DE TIEMPOS (SOLO HORA REPORT Y HORA COLACIÓN) -->
          <div class="pa-4 rounded-3xl border-2 border-emerald-500/70 bg-emerald-950/50 mb-4 shadow-xl">
            <div class="grid grid-cols-2 gap-3 text-center">
              <div class="p-3 bg-emerald-900/90 rounded-2xl border-2 border-emerald-400 shadow-md">
                <div class="text-xs uppercase font-black text-emerald-300 tracking-wider mb-0.5">HORA REPORT</div>
                <div class="text-2xl font-mono font-black text-emerald-300">
                  {{ calculoHoras.efectivas }} hrs
                </div>
              </div>
              <div class="p-3 bg-slate-900/90 rounded-2xl border border-white/10">
                <div class="text-xs uppercase font-black text-slate-300 tracking-wider mb-0.5">HORA COLACIÓN</div>
                <div class="text-2xl font-mono font-black text-amber-300">
                  {{ horasColacionFormateadas }} hrs
                </div>
              </div>
            </div>
          </div>

          <!-- GESTIÓN DE HORAS STANDBY / DETENCIONES EN FAENA -->
          <div class="mb-4 pa-4 rounded-2xl border-2 border-slate-700 bg-slate-950/80">
            <div class="d-flex align-center justify-space-between mb-3">
              <label class="text-sm font-black text-amber-300 text-uppercase tracking-wider">
                🛑 HORAS STANDBY
              </label>
            </div>
            <div class="grid grid-cols-1 gap-3 mb-3">
              <div class="p-3 rounded-xl bg-slate-900 border border-amber-500/40">
                <label class="text-sm font-black text-amber-300 block mb-1.5 uppercase tracking-wide">
                  STAND BY CLIENTE COBRABLE
                </label>
                <input
                  v-model.number="form.horas_standby_cliente"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0.0"
                  class="w-full bg-slate-950 border-2 border-amber-500/50 rounded-xl px-3 py-2.5 text-white font-mono text-xl font-black text-center focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div class="p-3 rounded-xl bg-slate-900 border border-red-500/40">
                <label class="text-sm font-black text-red-300 block mb-1.5 uppercase tracking-wide">
                  STAND BY SAN PABLO FALLA EQUIPO SIN COBRO CLIENTE
                </label>
                <input
                  v-model.number="form.horas_standby_gsp"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0.0"
                  class="w-full bg-slate-950 border-2 border-red-500/50 rounded-xl px-3 py-2.5 text-white font-mono text-xl font-black text-center focus:border-red-400 focus:outline-none"
                />
              </div>
            </div>
            <div v-if="form.horas_standby_cliente > 0 || form.horas_standby_gsp > 0">
              <label class="text-xs font-bold text-slate-300 block mb-1">Motivo de la detención / Standby *</label>
              <input
                v-model="form.motivo_standby"
                type="text"
                placeholder="Detalle el motivo del standby..."
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <!-- 1. HORÓMETRO SUPERESTRUCTURA TÉRMINO (OBLIGATORIO) -->
          <div class="mb-4 pa-4 rounded-2xl border-2 border-slate-700 bg-slate-950/80">
            <div class="d-flex align-center justify-space-between mb-1.5">
              <label class="text-sm font-black text-amber-300 text-uppercase tracking-wider">
                ⚙️ HORÓMETRO SUPERESTRUCTURA (TÉRMINO) *
              </label>
            </div>
            <input
              v-model.number="form.horometro_termino"
              type="number"
              step="0.1"
              placeholder="Ej: 3459.0"
              class="w-full bg-slate-950 border-2 rounded-xl px-4 py-3 text-amber-300 font-mono text-2xl font-black focus:outline-none text-center h-16 shadow-inner"
              :class="estadoHorometroTermino.tipo === 'ERROR_MENOR' ? 'border-red-500 text-red-400 animate-pulse' : (estadoHorometroTermino.tipo === 'WARNING_DISPARADO' ? 'border-yellow-500 text-yellow-300' : 'border-slate-700 focus:border-amber-400')"
            />

            <!-- ALERTA: HOROMETRO MENOR -->
            <div v-if="estadoHorometroTermino.tipo === 'ERROR_MENOR'" class="mt-2 p-2 bg-red-950/80 border border-red-500/80 rounded-xl text-xs text-red-200 font-bold flex items-center justify-between">
              <span>{{ estadoHorometroTermino.mensaje }}</span>
            </div>

            <!-- ALERTA: HOROMETRO DISPARADO -->
            <div v-else-if="estadoHorometroTermino.tipo === 'WARNING_DISPARADO'" class="mt-2 p-2.5 bg-yellow-950/90 border-2 border-yellow-500 rounded-xl text-xs text-yellow-200 font-bold space-y-1.5">
              <div class="flex items-start gap-1.5">
                <span>{{ estadoHorometroTermino.mensaje }}</span>
              </div>
            </div>

            <div v-else-if="deltaHorometro !== null" class="text-xs text-slate-200 d-block mt-1.5 font-mono font-bold flex items-center justify-space-between">
              <span>Δ Superestructura: {{ deltaHorometro }} hrs</span>
            </div>

            <!-- FOTOGRAFÍA OBLIGATORIA SUPERESTRUCTURA (CÁMARA WEBRTC IN-APP) -->
            <div class="mt-3 pt-3 border-t border-slate-800">
              <input
                ref="inputFotoTermino"
                type="file"
                accept="image/*"
                data-bypass-inapp="true"
                class="d-none"
                @change="onFotoTerminoSeleccionada"
              />

              <div v-if="form.foto_tablero_termino" class="position-relative space-y-2">
                <div class="rounded-xl overflow-hidden border border-amber-400 bg-black flex items-center justify-center max-h-60 shadow-md">
                  <img
                    :src="form.foto_tablero_termino"
                    alt="Foto Horómetro Superestructura Término"
                    class="w-full h-auto max-h-60 object-contain"
                  />
                </div>
                <div class="d-flex ga-2">
                  <v-btn
                    color="amber"
                    variant="flat"
                    size="default"
                    class="flex-grow-1 font-black text-sm h-11 rounded-xl text-slate-950"
                    @click="capturarFotoHorometro('TERMINO')"
                  >
                    📸 CAMBIAR FOTO
                  </v-btn>
                  <v-btn
                    color="red-lighten-1"
                    variant="outlined"
                    size="default"
                    class="font-black text-sm h-11 rounded-xl px-4"
                    @click="form.foto_tablero_termino = null"
                  >
                    🗑️ BORRAR
                  </v-btn>
                </div>
              </div>

              <div v-else>
                <v-btn
                  color="amber"
                  variant="flat"
                  size="large"
                  block
                  class="font-black text-base h-14 rounded-xl d-flex align-center ga-2 text-slate-950 shadow py-2"
                  @click="capturarFotoHorometro('TERMINO')"
                >
                  <span class="text-xl">📸</span>
                  <span>FOTO HOROMETRO SUPERESTRUCTURA</span>
                </v-btn>
              </div>
            </div>
          </div>

          <!-- Observaciones / Maniobras -->
          <div class="mb-4">
            <label class="text-sm font-black text-amber-300 text-uppercase mb-1.5 d-block tracking-wider">
              📝 MANIOBRAS REALIZADAS (VISIBLES EN REPORT MANDANTE)
            </label>
            <textarea
              v-model="form.observacion_trabajo"
              rows="3"
              placeholder="Detalle de izajes, tonelajes, radios o condiciones de faena..."
              class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white text-base font-medium focus:border-amber-400 focus:outline-none min-h-[100px]"
            ></textarea>
          </div>

          <!-- BOTÓN: TERMINO DE REPORT -->
          <v-btn
            block
            size="x-large"
            color="amber-darken-2"
            class="font-black text-uppercase rounded-2xl text-slate-950 py-4 min-h-[62px] text-lg shadow-xl shadow-amber-500/20 tracking-wider"
            @click="irAReportMandante"
          >
            <span>TERMINO DE REPORT</span>
          </v-btn>
        </v-card>
      </div>

      <!-- ========================================================================= -->
      <!-- PASO 3: REPORT DIARIO CONTRACTUAL (CARA AL CLIENTE MANDANTE)             -->
      <!-- ========================================================================= -->
      <div v-show="faseVisual === 3" class="space-y-5">
        <!-- VOUCHER FORMAL DEL SERVICIO (SOLO TIEMPOS COMERCIALES) -->
        <v-card
          class="pa-5 rounded-3xl border-2 border-amber-500/60 text-white shadow-2xl"
          style="background: linear-gradient(135deg, #0b1120 0%, #1e1b4b 100%);"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-widest">
              RESUMEN COMERCIAL DE FAENA
            </span>
            <v-chip size="default" color="amber" variant="flat" class="font-black text-xs text-slate-950 px-3 py-1 font-mono">
              {{ etiquetaDiaFecha }}
            </v-chip>
          </div>

          <div class="text-2xl font-black text-white mb-1 leading-tight">
            {{ proyecto.cliente_nombre || 'LeanGlobal Spa' }}
          </div>
          <div class="text-base text-slate-200 mb-3 font-bold">
            OT: <span class="font-mono text-amber-300 font-black">{{ proyecto.codi_proyecto }}</span> • Faena: {{ proyecto.obra_nombre }}
          </div>

          <!-- GRÚA CERTIFICADA Y TRIPULACIÓN EN EL REPORT MANDANTE -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div class="p-3 bg-black/60 rounded-2xl border border-amber-400/40">
              <span class="text-amber-400 font-black d-block text-uppercase text-xs tracking-wider mb-0.5">🚜 Grúa Certificada</span>
              <strong class="text-amber-300 font-mono text-2xl font-black d-block tracking-wider">
                {{ equipoSeleccionado?.patente || 'SIN GRÚA ASIGNADA' }}
              </strong>
              <span class="text-slate-200 text-sm font-bold d-block">
                {{ equipoSeleccionado?.modelo || '-' }}
              </span>
            </div>
            <div class="p-3 bg-black/60 rounded-2xl border border-amber-400/40">
              <span class="text-amber-400 font-black d-block text-uppercase text-xs tracking-wider mb-0.5">👷 Personal en Faena</span>
              <div class="text-base font-black text-white d-block">
                Op: {{ operadorNombre }}
              </div>
              <div v-if="riggerNombre" class="text-sm font-bold text-slate-200 d-block mt-0.5">
                Rig: {{ riggerNombre }}
              </div>
            </div>
          </div>

          <!-- CUADRO DE HORAS CERTIFICADAS (3 COLUMNAS) -->
          <div class="pa-3.5 rounded-2xl bg-black/70 border border-white/20 mb-3">
            <div class="text-xs sm:text-sm text-amber-400 font-black uppercase mb-2 tracking-wider text-center">
              ⏱️ CERTIFICACIÓN DE TIEMPOS DE SERVICIO
            </div>
            <div class="grid grid-cols-3 gap-2.5 text-center items-center">
              <div class="p-2.5 bg-slate-900/90 rounded-2xl border border-white/10">
                <div class="text-xs uppercase font-black text-slate-300 tracking-wider">Inicio - Fin</div>
                <div class="text-lg sm:text-xl font-mono font-black text-white mt-0.5">
                  {{ form.hora_inicio }} - {{ form.hora_termino }}
                </div>
              </div>
              <div class="p-2.5 bg-slate-900/90 rounded-2xl border border-white/10">
                <div class="text-xs uppercase font-black text-slate-300 tracking-wider">Colación</div>
                <div class="text-lg sm:text-xl font-mono font-black text-amber-300 mt-0.5">
                  {{ form.minutos_colacion }} min
                </div>
              </div>
              <div class="p-2.5 bg-emerald-950/90 rounded-2xl border-2 border-emerald-400 shadow-md">
                <div class="text-xs uppercase font-black text-emerald-300 tracking-wider">HORA REPORT</div>
                <div class="text-2xl font-mono font-black text-emerald-300 mt-0.5">
                  {{ calculoHoras.efectivas }} hrs
                </div>
              </div>
            </div>

            <div v-if="calculoHoras.standbyCliente > 0 || calculoHoras.standbyGsp > 0" class="mt-2.5 pt-2 border-t border-white/20 text-xs font-mono space-y-1">
              <div v-if="calculoHoras.standbyCliente > 0" class="text-amber-300 flex justify-between">
                <span>STAND BY CLIENTE COBRABLE:</span>
                <span class="font-bold">{{ calculoHoras.standbyCliente }} hrs</span>
              </div>
              <div v-if="calculoHoras.standbyGsp > 0" class="text-red-400 flex justify-between">
                <span>STAND BY SAN PABLO FALLA EQUIPO SIN COBRO CLIENTE:</span>
                <span class="font-bold">-{{ calculoHoras.standbyGsp }} hrs</span>
              </div>
            </div>
          </div>

          <div v-if="form.observacion_trabajo" class="text-base text-slate-200 bg-slate-900/90 p-3.5 rounded-2xl border border-white/10 font-medium">
            <strong class="text-white d-block mb-1 font-bold text-base">Maniobras Realizadas:</strong>
            {{ form.observacion_trabajo }}
          </div>
        </v-card>

        <!-- FORMULARIO DE CONFORMIDAD Y FIRMA TÁCTIL MANDANTE -->
        <v-card
          class="pa-5 rounded-3xl border-2 border-emerald-500/60 text-white shadow-2xl"
          style="background-color: #0b1120;"
        >
          <div class="d-flex align-center ga-3 mb-4">
            <span class="text-3xl">✍️</span>
            <div>
              <div class="text-xl font-black text-emerald-400">Conformidad del Mandante</div>
              <div class="text-sm text-slate-300 font-medium">Firma manuscrita del receptor en terreno</div>
            </div>
          </div>

          <div class="mb-3.5">
            <label class="text-sm font-black text-slate-200 text-uppercase mb-1.5 d-block tracking-wider">
              👤 NOMBRE SUPERVISOR MANDANTE *
            </label>
            <input
              v-model="form.cliente_nombre"
              type="text"
              placeholder="Nombre y Apellido del supervisor"
              class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder:text-slate-500 placeholder:text-sm focus:border-emerald-400 focus:outline-none h-14"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
            <div>
              <label class="text-sm font-black text-slate-200 text-uppercase mb-1.5 d-block tracking-wider">
                🆔 RUT MANDANTE *
              </label>
              <input
                v-model="form.cliente_rut"
                type="text"
                placeholder="12.345.678-9"
                class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder:text-slate-500 placeholder:text-sm focus:border-emerald-400 focus:outline-none h-14"
              />
            </div>
            <div>
              <label class="text-sm font-black text-slate-200 text-uppercase mb-1.5 d-block tracking-wider">
                💼 CARGO EN FAENA
              </label>
              <input
                v-model="form.cliente_cargo"
                type="text"
                placeholder="Ej: ITO / Jefe de Terreno"
                class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder:text-slate-500 placeholder:text-sm focus:border-emerald-400 focus:outline-none h-14"
              />
            </div>
          </div>

          <!-- SignatureField (Canvas de Firma Táctil) -->
          <div class="mb-2.5">
            <SignatureField
              v-model="form.cliente_firma_canvas_base64"
              label="FIRMA MANUSCRITA DEL SUPERVISOR MANDANTE"
            />
          </div>

          <div class="text-xs text-slate-300 text-center my-3 bg-slate-900/90 py-2.5 px-3 rounded-xl border border-white/10 font-medium">
            🛰️ Al sellar se capturará geoposición GPS inmutable y estampa de tiempo oficial.
          </div>

          <!-- BOTONES DE ACCIÓN: TRANSMITIR O VOLVER A EDITAR -->
          <div class="space-y-2.5 mt-3">
            <v-btn
              block
              size="x-large"
              color="emerald-darken-1"
              class="font-black text-uppercase rounded-2xl text-white py-4 min-h-[62px] text-lg shadow-xl shadow-emerald-500/20 tracking-wider"
              :loading="enviando"
              :disabled="!puedeEnviarReport"
              @click="sellarYTransmitirReport"
            >
              🟢 Sellar y Transmitir Report Día {{ diaCorrelativo }}
            </v-btn>

            <v-btn
              block
              variant="outlined"
              color="grey-lighten-1"
              size="large"
              class="font-black text-base rounded-2xl h-12"
              @click="faseVisual = 2"
            >
              ◀ Volver a Término de Report
            </v-btn>
          </div>
        </v-card>
      </div>
    </div>

    <!-- Snackbar de Éxito / Error -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      <span class="text-xl font-bold">{{ snackbar.text }}</span>
    </v-snackbar>

    <!-- MODAL CONFIRMACIÓN TÉRMINO DE FAENA & INICIO RETORNO (REQ-988) -->
    <v-dialog v-model="mostrarModalRetorno" persistent max-width="500">
      <v-card class="rounded-3xl bg-slate-950 border-2 border-emerald-500 pa-6 text-white text-center shadow-2xl">
        <div class="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-4xl mb-4">
          🏁
        </div>
        <h3 class="text-xl font-black uppercase text-white font-mono mb-2">
          ¡Faena Concluida con Éxito!
        </h3>
        <p class="text-sm text-slate-300 mb-4">
          Has transmitido el <strong>último Report Diario</strong> programado para esta orden de trabajo.
          Se ha generado la <strong>Hoja de Ruta de RETORNO</strong> hacia la Base Central San Pablo.
        </p>
        <div class="bg-black/50 border border-white/10 rounded-2xl p-3 mb-5 text-left font-mono text-xs space-y-1">
          <div class="text-amber-400 font-bold">🚜 Origen: {{ proyecto.obra_nombre || 'Faena Operativa' }}</div>
          <div class="text-emerald-400 font-bold">🏢 Destino: Base Central San Pablo</div>
          <div class="text-slate-400 text-[10px]">Token Hoja de Ruta: {{ modalRetornoToken }}</div>
        </div>
        <v-btn
          block
          size="x-large"
          color="emerald-darken-1"
          class="font-black text-uppercase rounded-2xl text-white py-4 text-base shadow-lg tracking-wider mb-2"
          @click="irAViajeRetorno"
        >
          🚀 INICIAR VIAJE DE RETORNO ➔
        </v-btn>
        <v-btn
          block
          variant="text"
          color="grey-lighten-1"
          class="font-bold text-xs"
          @click="router.push('/surveys')"
        >
          🏠 Volver al Inicio de la App
        </v-btn>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import SignatureField from '@/components/SignatureField.vue'
import { abrirCamaraWebRTC } from '@/utils/inAppCamera'

const route = useRoute()
const router = useRouter()

// Fases: 1 = Inicio Jornada | 2 = Fin Jornada | 3 = Report Mandante
const faseVisual = ref(1)

const cargando = ref(true)
const enviandoInicio = ref(false)
const enviando = ref(false)
const idProyecto = ref(route.query.id_proyecto || null)
const idEquipoSeleccionado = ref(route.query.id_equipo ? Number(route.query.id_equipo) : null)
const idReporteAvanceActivo = ref(null)
// REQ-1060 / SPEC-088: identidad explícita de la jornada recibida desde la consola (o respaldo local)
const idReporteAvanceRuta = ref(route.query.id_reporte_avance ? Number(route.query.id_reporte_avance) : null)
const errorContexto = ref(false)
const jornadaDiaAnterior = ref(false)
const jornadasAbiertas = ref([])

// Fecha local operativa (America/Santiago), nunca UTC (INV-7)
const fechaHoyChile = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })

// Usuario autenticado de la PWA (INV-8)
const idUserSesion = () => {
  try {
    const perfil = JSON.parse(localStorage.getItem('perfil') || '{}')
    return perfil?.id_user ? Number(perfil.id_user) : null
  } catch (e) {
    return null
  }
}

// Respaldo local durable de la jornada iniciada (P7)
const claveRespaldoJornada = () => `gsp_jornada_activa_${idProyecto.value}`
const leerRespaldoJornada = () => {
  try {
    return JSON.parse(localStorage.getItem(claveRespaldoJornada()) || 'null')
  } catch (e) {
    return null
  }
}
const guardarRespaldoJornada = (datos) => {
  try {
    localStorage.setItem(claveRespaldoJornada(), JSON.stringify(datos))
  } catch (e) { /* almacenamiento lleno o bloqueado: el servidor sigue siendo la fuente de verdad */ }
}
const borrarRespaldoJornada = () => {
  try {
    localStorage.removeItem(claveRespaldoJornada())
  } catch (e) { /* sin efecto */ }
}
const servicioConcluido = ref(false)
const mensajeConcluido = ref('')
const mostrarModalRetorno = ref(false)
const modalRetornoToken = ref(null)

const irAViajeRetorno = () => {
  if (modalRetornoToken.value) {
    router.push(`/viaje/${modalRetornoToken.value}`)
  } else {
    router.push('/surveys')
  }
}

const proyecto = ref({})
const equipos = ref([])
const personas = ref([])
const reportsPrevios = ref([])
const diaCorrelativo = ref(1)
const totalDiasContratados = ref(1)
const horasMinimas = ref(8.0)
const horometroMinimoInicio = ref(0)

const etiquetaDiaFecha = computed(() => {
  const raw = String(form.fecha_reporte || fechaHoyChile())
  const partes = raw.split('-')
  const fechaFmt = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : raw
  const tot = Math.max(Number(totalDiasContratados.value) || 1, Number(diaCorrelativo.value) || 1)
  return `${fechaFmt} (DIA ${diaCorrelativo.value} DE ${tot})`
})

const inputFotoInicio = ref(null)
const inputFotoTermino = ref(null)

const form = reactive({
  fecha_reporte: fechaHoyChile(),
  hora_inicio: '08:00',
  hora_termino: '18:00',
  minutos_colacion: 60,
  horometro_inicio: null,
  horometro_termino: null,
  horometro_chasis_termino: null,
  horas_standby_cliente: 0,
  horas_standby_gsp: 0,
  motivo_standby: '',
  odometro_inicio: null,
  odometro_termino: null,
  foto_tablero_inicio: null,
  foto_odometro_inicio: null,
  foto_tablero_termino: null,
  foto_odometro_termino: null,
  foto_horometro_chasis_termino: null,
  notas_mecanicas_gsp: '',
  observacion_trabajo: '',
  cliente_nombre: '',
  cliente_rut: '',
  cliente_cargo: 'Supervisor en Obra',
  cliente_firma_canvas_base64: ''
})

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
})

const equipoSeleccionado = computed(() => {
  // REQ-1060 / INV-4: el equipo canónico lo define el backend (id_equipo_seleccionado). Nunca se inventa un equipo.
  if (idEquipoSeleccionado.value) {
    const match = equipos.value.find(e => Number(e.id_equipo) === idEquipoSeleccionado.value)
    if (match) return match
  }
  if (equipos.value.length > 0) return equipos.value[0]
  return null
})

const operadorNombre = computed(() => {
  if (equipoSeleccionado.value?.operador_nombre) {
    return equipoSeleccionado.value.operador_nombre
  }
  const idEqSel = Number(equipoSeleccionado.value?.id_equipo || idEquipoSeleccionado.value || 0)
  if (idEqSel > 0) {
    const opEq = personas.value.find(p => Number(p.id_equipo) === idEqSel)
    if (opEq) return `${opEq.name_frst || ''} ${opEq.apellido_pat || ''}`.trim()
  }
  const op = personas.value.find(p => {
    const r = (p.rol_asignado || p.cargo || '').toUpperCase()
    return r.includes('OPERADOR') || r.includes('CHOFER') || r.includes('CONDUCTOR') || r.includes('MAQUINISTA')
  })
  if (op) return `${op.name_frst || ''} ${op.apellido_pat || ''}`.trim()
  if (personas.value.length > 0) {
    return `${personas.value[0].name_frst || ''} ${personas.value[0].apellido_pat || ''}`.trim()
  }
  return proyecto.value.operador_nombre || localStorage.getItem('usuario_nombre') || 'Operador Asignado'
})

const riggerNombre = computed(() => {
  const rig = personas.value.find(p => (p.rol_asignado || p.cargo || '').toUpperCase().includes('RIGGER'))
  if (rig) {
    const nom = `${rig.name_frst || ''} ${rig.apellido_pat || ''}`.trim()
    return nom || null
  }
  return proyecto.value.rigger_nombre || null
})

const horaInicioHH = ref('08')
const horaInicioMM = ref('00')
const horaTerminoHH = ref('18')
const horaTerminoMM = ref('00')

const sincronizarCajasHora = (campo) => {
  if (!campo || campo === 'hora_inicio') {
    const partesIni = String(form.hora_inicio || '08:00').split(':')
    horaInicioHH.value = String(partesIni[0] || '08').padStart(2, '0')
    horaInicioMM.value = String(partesIni[1] || '00').padStart(2, '0')
  }
  if (!campo || campo === 'hora_termino') {
    const partesTer = String(form.hora_termino || '18:00').split(':')
    horaTerminoHH.value = String(partesTer[0] || '18').padStart(2, '0')
    horaTerminoMM.value = String(partesTer[1] || '00').padStart(2, '0')
  }
}

const onInputHora = (campo, parte, event) => {
  const digits = String(event.target.value || '').replace(/\D/g, '').slice(0, 2)
  if (event.target.value !== digits) {
    event.target.value = digits
  }
  const actual = (form[campo] || (campo === 'hora_inicio' ? '08:00' : '18:00')).split(':')
  if (campo === 'hora_inicio') {
    if (parte === 'HH') horaInicioHH.value = digits
    else horaInicioMM.value = digits
    const hhRaw = horaInicioHH.value !== '' ? horaInicioHH.value : (actual[0] || '08')
    const mmRaw = horaInicioMM.value !== '' ? horaInicioMM.value : (actual[1] || '00')
    const hhNum = Math.min(23, Math.max(0, parseInt(hhRaw, 10) || 0))
    const mmNum = Math.min(59, Math.max(0, parseInt(mmRaw, 10) || 0))
    form.hora_inicio = `${String(hhNum).padStart(2, '0')}:${String(mmNum).padStart(2, '0')}`
  } else {
    if (parte === 'HH') horaTerminoHH.value = digits
    else horaTerminoMM.value = digits
    const hhRaw = horaTerminoHH.value !== '' ? horaTerminoHH.value : (actual[0] || '18')
    const mmRaw = horaTerminoMM.value !== '' ? horaTerminoMM.value : (actual[1] || '00')
    const hhNum = Math.min(23, Math.max(0, parseInt(hhRaw, 10) || 0))
    const mmNum = Math.min(59, Math.max(0, parseInt(mmRaw, 10) || 0))
    form.hora_termino = `${String(hhNum).padStart(2, '0')}:${String(mmNum).padStart(2, '0')}`
  }
}

const normalizarHora = (campo) => {
  const defHH = campo === 'hora_inicio' ? '08' : '18'
  const refHH = campo === 'hora_inicio' ? horaInicioHH : horaTerminoHH
  const refMM = campo === 'hora_inicio' ? horaInicioMM : horaTerminoMM
  const actual = (form[campo] || `${defHH}:00`).split(':')
  const hhStr = refHH.value !== '' ? refHH.value : (actual[0] || defHH)
  const mmStr = refMM.value !== '' ? refMM.value : (actual[1] || '00')
  const hhNum = Math.min(23, Math.max(0, parseInt(hhStr, 10) || 0))
  const mmNum = Math.min(59, Math.max(0, parseInt(mmStr, 10) || 0))
  refHH.value = String(hhNum).padStart(2, '0')
  refMM.value = String(mmNum).padStart(2, '0')
  form[campo] = `${refHH.value}:${refMM.value}`
}

const horasColacionFormateadas = computed(() => {
  return (form.minutos_colacion / 60).toFixed(1)
})

const deltaHorometro = computed(() => {
  if (form.horometro_inicio !== null && form.horometro_termino !== null) {
    const diff = form.horometro_termino - form.horometro_inicio
    return diff >= 0 ? diff.toFixed(1) : '0.0'
  }
  return null
})

// Persistencia en tiempo real del borrador del formulario (evita pérdida ante cualquier recarga)
const claveBorradorFormulario = () => `gsp_report_draft_${idProyecto.value || '0'}_${idEquipoSeleccionado.value || '0'}`
const guardarBorradorFormulario = () => {
  if (!idProyecto.value || cargando.value) return
  try {
    localStorage.setItem(claveBorradorFormulario(), JSON.stringify({
      ts: Date.now(),
      diaCorrelativo: diaCorrelativo.value,
      faseVisual: faseVisual.value,
      form: { ...form }
    }))
  } catch (e) { /* quota exceeded */ }
}
const restaurarBorradorFormulario = () => {
  if (!idProyecto.value) return
  try {
    const raw = localStorage.getItem(claveBorradorFormulario())
    if (!raw) return
    const saved = JSON.parse(raw)
    if (!saved || !saved.form) return
    // Solo restaurar si corresponde al mismo día correlativo
    if (saved.diaCorrelativo && Number(saved.diaCorrelativo) !== Number(diaCorrelativo.value)) return
    const f = saved.form
    if (faseVisual.value === 1) {
      if (f.hora_inicio) form.hora_inicio = f.hora_inicio
      if (f.horometro_inicio !== null && f.horometro_inicio !== undefined && f.horometro_inicio !== '') {
        form.horometro_inicio = Number(f.horometro_inicio)
      }
      if (f.foto_tablero_inicio && !form.foto_tablero_inicio) {
        form.foto_tablero_inicio = f.foto_tablero_inicio
      }
    } else {
      if (f.hora_termino) form.hora_termino = f.hora_termino
      if (f.minutos_colacion !== undefined) form.minutos_colacion = Number(f.minutos_colacion)
      if (f.horometro_termino !== null && f.horometro_termino !== undefined && f.horometro_termino !== '') {
        form.horometro_termino = Number(f.horometro_termino)
      }
      if (f.horas_standby_cliente !== undefined) form.horas_standby_cliente = Number(f.horas_standby_cliente)
      if (f.horas_standby_gsp !== undefined) form.horas_standby_gsp = Number(f.horas_standby_gsp)
      if (f.motivo_standby) form.motivo_standby = f.motivo_standby
      if (f.foto_tablero_termino && !form.foto_tablero_termino) {
        form.foto_tablero_termino = f.foto_tablero_termino
      }
      if (f.observacion_trabajo) form.observacion_trabajo = f.observacion_trabajo
      if (f.notas_mecanicas_gsp) form.notas_mecanicas_gsp = f.notas_mecanicas_gsp
      if (f.cliente_nombre) form.cliente_nombre = f.cliente_nombre
      if (f.cliente_rut) form.cliente_rut = f.cliente_rut
      if (f.cliente_cargo) form.cliente_cargo = f.cliente_cargo
      if (f.cliente_firma_canvas_base64) form.cliente_firma_canvas_base64 = f.cliente_firma_canvas_base64
    }
    sincronizarCajasHora()
  } catch (e) { /* sin efecto */ }
}
const borrarBorradorFormulario = () => {
  try {
    localStorage.removeItem(claveBorradorFormulario())
  } catch (e) { /* sin efecto */ }
}

// Acciones de cámara WebRTC In-App para foto horómetro (no sale del navegador)
const capturarFotoHorometro = async (etapa) => {
  guardarBorradorFormulario()
  const res = await abrirCamaraWebRTC({
    titulo: etapa === 'INICIO' ? 'Foto Horómetro Superestructura (Inicio)' : 'Foto Horómetro Superestructura (Término)',
    maxDimension: 1280,
    quality: 0.82
  })
  if (res && res.dataUrl) {
    if (etapa === 'INICIO') {
      form.foto_tablero_inicio = res.dataUrl
    } else {
      form.foto_tablero_termino = res.dataUrl
    }
    guardarBorradorFormulario()
  }
}

// Acciones de cámara para foto inicio horómetro
const onFotoInicioSeleccionada = (event) => {
  comprimirYAsignar(event, (b64) => {
    form.foto_tablero_inicio = b64
    guardarBorradorFormulario()
  })
}

// Acciones de cámara para foto término superestructura
const onFotoTerminoSeleccionada = (event) => {
  comprimirYAsignar(event, (b64) => {
    form.foto_tablero_termino = b64
    guardarBorradorFormulario()
  })
}

const comprimirYAsignar = (event, callback) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX_WIDTH = 1280
      const MAX_HEIGHT = 1280
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      callback(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// Cálculo reactivo en vivo de horas
const calculoHoras = computed(() => {
  if (!form.hora_inicio || !form.hora_termino) {
    return { efectivas: 0, facturables: horasMinimas.value, sobretiempo: 0, standbyCliente: 0, standbyGsp: 0 }
  }

  const [hIni, mIni] = form.hora_inicio.split(':').map(Number)
  const [hFin, mFin] = form.hora_termino.split(':').map(Number)

  let minutosTotales = (hFin * 60 + mFin) - (hIni * 60 + mIni)
  if (minutosTotales < 0) minutosTotales += 24 * 60

  const stbyCliente = Number(form.horas_standby_cliente || 0)
  const stbyGsp = Number(form.horas_standby_gsp || 0)

  const minutosEfectivosBrutos = Math.max(0, minutosTotales - form.minutos_colacion)
  const horasBrutas = minutosEfectivosBrutos / 60

  // Horas netas computables al mandante (Faena - Colación - Standby GSP)
  const totalComputable = Number(Math.max(0, horasBrutas - stbyGsp).toFixed(1))

  // HORA REPORT: NO se rebajan las horas de STAND BY CLIENTE COBRABLE (solo se deduce colación y Standby San Pablo)
  const efectivas = totalComputable

  // Facturables: base contractual o total computable (REQ-1109: si horasMinimas <= 0 en modalidad mensual, no aplica mínimo diario)
  const minDia = Number(horasMinimas.value ?? 8.0)
  const facturables = Number((minDia > 0 ? Math.max(totalComputable, minDia) : totalComputable).toFixed(1))
  const sobretiempo = Number((minDia > 0 ? Math.max(0, totalComputable - minDia) : 0).toFixed(1))

  return {
    efectivas,
    facturables,
    sobretiempo,
    totalComputable,
    standbyCliente: stbyCliente,
    standbyGsp: stbyGsp
  }
})

// Diagnóstico de Consistencia de Horómetro Superestructura (REQ-1108: sin horómetro sugerido prellenado)

const estadoHorometroTermino = computed(() => {
  if (form.horometro_termino === null || form.horometro_termino === undefined || form.horometro_termino === '') {
    return { tipo: 'VACIO', mensaje: '' }
  }
  const inicio = Number(form.horometro_inicio || 0)
  const termino = Number(form.horometro_termino)
  const diff = termino - inicio

  if (termino < inicio) {
    return {
      tipo: 'ERROR_MENOR',
      diff: diff.toFixed(1),
      mensaje: `🚨 Error: El horómetro final (${termino}) no puede ser menor al inicial (${inicio}).`
    }
  }

  const ef = Number(calculoHoras.value.efectivas || 0)
  // Alerta si el incremento supera por mucho el tiempo de faena o supera 20 horas en un día
  if (diff > Math.max(20, ef + 4) || (termino - inicio) > 100) {
    return {
      tipo: 'WARNING_DISPARADO',
      diff: diff.toFixed(1),
      mensaje: `⚠️ Advertencia: El horómetro ingresado genera un incremento de +${diff.toFixed(1)} hrs (anómalo para una jornada de ${ef} hrs de faena). ¿Ingresaste el odómetro por error?`
    }
  }

  return { tipo: 'OK', diff: diff.toFixed(1) }
})

// REQ-1108: Prohibido prellenar horómetro de término; el operador debe digitarlo manualmente.

// Persistir automáticamente cualquier cambio del formulario en localStorage
watch(form, () => {
  guardarBorradorFormulario()
}, { deep: true })

const puedeGuardarInicio = computed(() => {
  if (servicioConcluido.value) return false
  if (errorContexto.value || !equipoSeleccionado.value) return false
  if (!form.fecha_reporte || !form.hora_inicio || enviandoInicio.value) return false
  if (form.horometro_inicio === null || form.horometro_inicio === '' || Number.isNaN(Number(form.horometro_inicio))) return false
  if (!form.foto_tablero_inicio) return false
  return true
})

const puedeEnviarReport = computed(() => {
  if (servicioConcluido.value) return false
  return (
    form.cliente_nombre.trim().length >= 3 &&
    form.cliente_rut.trim().length >= 8 &&
    form.cliente_firma_canvas_base64 &&
    !enviando.value
  )
})

const irAReportMandante = () => {
  normalizarHora('hora_inicio')
  normalizarHora('hora_termino')
  if (!form.hora_termino) {
    snackbar.text = '⚠️ Debes ingresar la Hora de Término de Faena'
    snackbar.color = 'warning'
    snackbar.show = true
    return
  }
  if (form.horometro_termino === null || form.horometro_termino === '' || Number.isNaN(Number(form.horometro_termino))) {
    snackbar.text = '⚠️ El Horómetro Superestructura (Término) es OBLIGATORIO'
    snackbar.color = 'warning'
    snackbar.show = true
    return
  }
  if (!form.foto_tablero_termino) {
    snackbar.text = '⚠️ La Foto del Horómetro Superestructura es OBLIGATORIA'
    snackbar.color = 'warning'
    snackbar.show = true
    return
  }
  if (estadoHorometroTermino.value.tipo === 'ERROR_MENOR') {
    snackbar.text = estadoHorometroTermino.value.mensaje
    snackbar.color = 'error'
    snackbar.show = true
    return
  }
  if (estadoHorometroTermino.value.tipo === 'WARNING_DISPARADO') {
    const confirma = window.confirm(`⚠️ Advertencia de Horómetro Motor:\n\nEl horómetro final (${form.horometro_termino}) genera un incremento de +${estadoHorometroTermino.value.diff} hrs de motor en una jornada de ${calculoHoras.value.efectivas} hrs.\n\n¿Estás seguro de que este valor es correcto y no corresponde al kilometraje/odómetro?`)
    if (!confirma) return
  }
  faseVisual.value = 3
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cargarContexto = async (idEqParam = null) => {
  try {
    cargando.value = true
    errorContexto.value = false
    if (!idProyecto.value) {
      const guardado = localStorage.getItem('id_proyecto_activo')
      if (guardado) idProyecto.value = guardado
    }

    if (!idProyecto.value) {
      snackbar.text = 'No se especificó la OT / Proyecto'
      snackbar.color = 'error'
      snackbar.show = true
      cargando.value = false
      return
    }

    // REQ-1060 / SPEC-088: se envía la identidad explícita de la jornada (consola o respaldo local) y el usuario
    const respaldo = leerRespaldoJornada()
    const params = {}
    const eqSolicitado = idEqParam || idEquipoSeleccionado.value
    if (eqSolicitado) params.id_equipo = eqSolicitado
    const idJornadaConocida = idReporteAvanceRuta.value || (!idEqParam ? respaldo?.id_reporte_avance : null)
    if (idJornadaConocida) params.id_reporte_avance = idJornadaConocida
    const uid = idUserSesion()
    if (uid) params.id_user = uid

    const res = await api.get(`/operaciones/report/contexto/${idProyecto.value}`, { params })
    if (!res.data || !res.data.success) {
      errorContexto.value = true
      return
    }
    if (res.data && res.data.success) {
      const d = res.data.data
      proyecto.value = d.proyecto || {}
      
      const mapEq = new Map()
      ;(d.equipos || []).forEach(e => {
        if (!mapEq.has(Number(e.id_equipo))) {
          mapEq.set(Number(e.id_equipo), e)
        }
      })
      equipos.value = Array.from(mapEq.values())

      const mapPer = new Map()
      ;(d.personas || []).forEach(p => {
        if (!mapPer.has(Number(p.id_user))) {
          mapPer.set(Number(p.id_user), p)
        }
      })
      personas.value = Array.from(mapPer.values())

      reportsPrevios.value = d.reports || []
      diaCorrelativo.value = d.dia_sugerido || 1
      totalDiasContratados.value = Number(d.total_dias || d.proyecto?.cantidad_dias || d.proyecto?.dias_contratados || diaCorrelativo.value || 1)
      if (d.horas_minimas !== undefined && d.horas_minimas !== null) {
        horasMinimas.value = Number(d.horas_minimas)
      }

      if (d.servicio_concluido) {
        servicioConcluido.value = true
        mensajeConcluido.value = `Esta orden de trabajo ya completó sus ${d.total_dias || 1} jornada(s) autorizadas (${d.dias_reportados || 1} reportes finalizados). No es posible emitir nuevos reportes.`
      } else {
        servicioConcluido.value = false
        mensajeConcluido.value = ''
      }

      // REQ-1060 / INV-4: el equipo canónico del backend SIEMPRE manda (evita guardar con un equipo y buscar con otro)
      if (d.id_equipo_seleccionado) {
        idEquipoSeleccionado.value = Number(d.id_equipo_seleccionado)
      } else if (!idEquipoSeleccionado.value && equipos.value.length > 0) {
        idEquipoSeleccionado.value = Number(equipos.value[0].id_equipo)
      }
      jornadasAbiertas.value = d.jornadas_abiertas || []
      if (d.equipo_corregido) {
        console.warn(`[REQ-1060] Equipo corregido: solicitado ${d.id_equipo_solicitado} -> canónico ${d.id_equipo_seleccionado}`)
      }

      // Si hay una jornada activa, precargarla y pasar directo a Momento 2
      if (d.jornada_activa) {
        const j = d.jornada_activa
        idReporteAvanceActivo.value = j.id_reporte_avance
        idReporteAvanceRuta.value = j.id_reporte_avance
        jornadaDiaAnterior.value = Boolean(j.es_dia_anterior)
        if (j.fecha_reporte_str) {
          form.fecha_reporte = j.fecha_reporte_str
        }
        if (j.hora_inicio_str && j.hora_inicio_str !== '00:00') {
          form.hora_inicio = j.hora_inicio_str
        }
        if (j.horas_minimas !== undefined && j.horas_minimas !== null) {
          horasMinimas.value = Number(j.horas_minimas)
        }
        form.horometro_inicio = j.horometro_inicio ? Number(j.horometro_inicio) : null
        form.odometro_inicio = j.odometro_inicio ? Number(j.odometro_inicio) : null
        form.odometro_termino = j.odometro_termino ? Number(j.odometro_termino) : null
        form.foto_tablero_inicio = j.foto_tablero_inicio || null
        form.foto_odometro_inicio = j.foto_odometro_inicio || null
        form.foto_tablero_termino = j.foto_tablero_termino || null
        form.foto_odometro_termino = j.foto_odometro_termino || null
        if (!j.hora_inicio_str && j.fecha_inicio_servicio) {
          try {
            const d = new Date(j.fecha_inicio_servicio)
            if (!isNaN(d.getTime())) {
              const hh = String(d.getHours()).padStart(2, '0')
              const mm = String(d.getMinutes()).padStart(2, '0')
              if (`${hh}:${mm}` !== '00:00') form.hora_inicio = `${hh}:${mm}`
            } else {
              const t = j.fecha_inicio_servicio.split('T')[1] || ''
              if (t.length >= 5 && t.substring(0, 5) !== '00:00') form.hora_inicio = t.substring(0, 5)
            }
          } catch (e) {
            const t = j.fecha_inicio_servicio.split('T')[1] || ''
            if (t.length >= 5 && t.substring(0, 5) !== '00:00') form.hora_inicio = t.substring(0, 5)
          }
        }
        sincronizarCajasHora()
        diaCorrelativo.value = j.dia_correlativo || diaCorrelativo.value
        faseVisual.value = 2 // Pasar directo al Momento 2 (Fin de jornada)
        guardarRespaldoJornada({
          id_reporte_avance: j.id_reporte_avance,
          id_equipo: j.id_equipo,
          fecha_reporte: j.fecha_reporte_str || form.fecha_reporte
        })

        // REQ-1108: form.horometro_termino permanece vacío (null) para obligar digitación manual
      } else {
        // Sin jornada abierta para esta OT/equipo: el respaldo local (si existía) ya no es válido
        idReporteAvanceActivo.value = null
        jornadaDiaAnterior.value = false
        faseVisual.value = 1
        sincronizarCajasHora()
        if (respaldo) borrarRespaldoJornada()
        horometroMinimoInicio.value = Number(d.horometro_sugerido || 0)
        // REQ-1108: form.horometro_inicio permanece vacío (null) para obligar digitación manual
        if (d.odometro_sugerido && form.odometro_inicio === null) {
          form.odometro_inicio = Number(d.odometro_sugerido)
        }
      }

      // Restaurar borrador local si el operador había ingresado datos o foto antes de una recarga
      restaurarBorradorFormulario()

      // Mantener la URL alineada con la identidad canónica (recargas y botón atrás)
      const nuevaQuery = { ...route.query, id_proyecto: String(idProyecto.value) }
      if (idEquipoSeleccionado.value) nuevaQuery.id_equipo = String(idEquipoSeleccionado.value)
      if (idReporteAvanceActivo.value) nuevaQuery.id_reporte_avance = String(idReporteAvanceActivo.value)
      else delete nuevaQuery.id_reporte_avance
      router.replace({ query: nuevaQuery }).catch(() => {})
    }
  } catch (err) {
    console.error('Error al cargar contexto de Control de Flota:', err)
    errorContexto.value = true
    snackbar.text = 'Error al cargar datos del proyecto desde el servidor'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    cargando.value = false
  }
}

// REQ-1060 / INV-8: operador = operador del equipo seleccionado; si no existe, persona con rol OPERADOR de la OT o el usuario autenticado. Nunca 1 ni 55.
const resolverIdOperador = () => {
  if (equipoSeleccionado.value?.id_user_operador) {
    return Number(equipoSeleccionado.value.id_user_operador)
  }
  const idEqSel = Number(equipoSeleccionado.value?.id_equipo || idEquipoSeleccionado.value || 0)
  if (idEqSel > 0) {
    const opEq = personas.value.find(p => Number(p.id_equipo) === idEqSel)
    if (opEq?.id_user) return Number(opEq.id_user)
  }
  const op = personas.value.find(p => (p.rol_asignado || '').toUpperCase().includes('OPERADOR'))
  return op?.id_user || idUserSesion() || null
}

// Guardar Momento 1 (Inicio de Jornada)
const guardarInicioJornada = async () => {
  try {
    if (!equipoSeleccionado.value?.id_equipo) {
      snackbar.text = '⚠️ Esta OT no tiene una grúa asignada. Contacte a Control de Gestión.'
      snackbar.color = 'error'
      snackbar.show = true
      return
    }
    const idOperador = resolverIdOperador()
    if (!idOperador) {
      snackbar.text = '⚠️ No se pudo identificar al operador. Cierre sesión y vuelva a ingresar.'
      snackbar.color = 'error'
      snackbar.show = true
      return
    }
    normalizarHora('hora_inicio')
    if (form.horometro_inicio === null || form.horometro_inicio === '' || !form.foto_tablero_inicio) {
      snackbar.text = '⚠️ El Horómetro Superestructura y su Foto son OBLIGATORIOS para iniciar el report.'
      snackbar.color = 'warning'
      snackbar.show = true
      return
    }
    if (horometroMinimoInicio.value > 0 && Number(form.horometro_inicio) < horometroMinimoInicio.value) {
      snackbar.text = `⚠️ El Horómetro de Inicio (${form.horometro_inicio} hrs) no puede ser menor al último horómetro registrado (${horometroMinimoInicio.value} hrs).`
      snackbar.color = 'error'
      snackbar.show = true
      return
    }
    enviandoInicio.value = true
    const payload = {
      id_proyecto: Number(idProyecto.value),
      id_equipo: Number(equipoSeleccionado.value.id_equipo),
      id_user_operador: idOperador,
      id_user_rigger: personas.value.find(p => (p.rol_asignado || '').toUpperCase().includes('RIGGER'))?.id_user || null,
      dia_correlativo: diaCorrelativo.value,
      fecha_reporte: form.fecha_reporte,
      hora_inicio: form.hora_inicio,
      horometro_inicio: form.horometro_inicio,
      odometro_inicio: null,
      foto_tablero_inicio: form.foto_tablero_inicio || null,
      foto_odometro_inicio: null,
      device_timestamp: new Date().toISOString()
    }

    const res = await api.post('/operaciones/report/inicio-jornada', payload)
    if (res.data && res.data.success) {
      if (res.data.data?.id_reporte_avance) {
        idReporteAvanceActivo.value = res.data.data.id_reporte_avance
        idReporteAvanceRuta.value = res.data.data.id_reporte_avance
        // REQ-1060 / P7: respaldo local durable de la identidad de la jornada
        guardarRespaldoJornada({
          id_reporte_avance: res.data.data.id_reporte_avance,
          id_equipo: payload.id_equipo,
          fecha_reporte: payload.fecha_reporte
        })
        router.replace({ query: { ...route.query, id_proyecto: String(idProyecto.value), id_equipo: String(payload.id_equipo), id_reporte_avance: String(res.data.data.id_reporte_avance) } }).catch(() => {})
      }
      snackbar.text = '🟢 Inicio de Jornada guardado en Control de Flota exitosamente!'
      snackbar.color = 'success'
      snackbar.show = true

      // Avanzar al Momento 2
      setTimeout(() => {
        faseVisual.value = 2
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 1000)
    }
  } catch (err) {
    console.error('Error al registrar inicio de jornada:', err)
    const data = err.response?.data || {}
    // REQ-1060: si ya existe una jornada abierta, recargar para presentarla (nunca crear otra)
    if (err.response?.status === 409 && ['JORNADA_ANTERIOR_ABIERTA', 'JORNADA_ABIERTA_OTRO_EQUIPO'].includes(data.codigo) && data.id_reporte_avance) {
      idReporteAvanceRuta.value = Number(data.id_reporte_avance)
      snackbar.text = data.error
      snackbar.color = 'warning'
      snackbar.show = true
      await cargarContexto()
      return
    }
    snackbar.text = data.error || 'Error al guardar inicio de jornada'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    enviandoInicio.value = false
  }
}

const obtenerGeolocalizacion = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitud: null, longitud: null, accuracy: null })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        })
      },
      (err) => {
        console.warn('GPS no disponible o denegado:', err)
        resolve({ latitud: null, longitud: null, accuracy: null })
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  })
}

// Guardar Momento 2 + Report Mandante
const sellarYTransmitirReport = async () => {
  try {
    normalizarHora('hora_inicio')
    normalizarHora('hora_termino')
    if (form.horometro_termino !== null && form.horometro_termino !== '' && form.horometro_inicio !== null && form.horometro_inicio !== '' && Number(form.horometro_termino) < Number(form.horometro_inicio)) {
      snackbar.text = `⚠️ El Horómetro de Término (${form.horometro_termino} hrs) no puede ser menor al Horómetro de Inicio (${form.horometro_inicio} hrs).`
      snackbar.color = 'error'
      snackbar.show = true
      return
    }
    if (!form.cliente_nombre || form.cliente_nombre.trim().length < 3) {
      snackbar.text = '⚠️ Debes ingresar el Nombre del Supervisor Mandante'
      snackbar.color = 'warning'
      snackbar.show = true
      return
    }
    if (!form.cliente_rut || form.cliente_rut.trim().length < 8) {
      snackbar.text = '⚠️ Debes ingresar el RUT del Mandante'
      snackbar.color = 'warning'
      snackbar.show = true
      return
    }
    if (!form.cliente_firma_canvas_base64) {
      snackbar.text = '⚠️ La Firma Manuscrita en pantalla es OBLIGATORIA'
      snackbar.color = 'warning'
      snackbar.show = true
      return
    }

    enviando.value = true
    const geo = await obtenerGeolocalizacion()

    const payload = {
      id_reporte_avance: idReporteAvanceActivo.value || null,
      id_proyecto: Number(idProyecto.value),
      id_equipo: equipoSeleccionado.value?.id_equipo || idEquipoSeleccionado.value,
      id_user_operador: resolverIdOperador(),
      id_user_rigger: personas.value.find(p => (p.rol_asignado || '').toUpperCase().includes('RIGGER'))?.id_user || null,
      dia_correlativo: diaCorrelativo.value,
      fecha_reporte: form.fecha_reporte,
      hora_inicio: form.hora_inicio,
      hora_termino: form.hora_termino,
      horas_colacion: Number(horasColacionFormateadas.value),
      horas_operadas: calculoHoras.value.efectivas,
      horas_minimas: horasMinimas.value,
      horas_facturables: calculoHoras.value.facturables,
      horas_sobretiempo: calculoHoras.value.sobretiempo,
      horas_standby_cliente: Number(form.horas_standby_cliente || 0),
      horas_standby_gsp: Number(form.horas_standby_gsp || 0),
      motivo_standby: form.motivo_standby || null,
      horometro_inicio: form.horometro_inicio,
      horometro_termino: form.horometro_termino,
      horometro_chasis_termino: form.horometro_chasis_termino || null,
      odometro_inicio: null,
      odometro_termino: null,
      foto_tablero_inicio: form.foto_tablero_inicio,
      foto_tablero_termino: form.foto_tablero_termino,
      foto_odometro_inicio: null,
      foto_odometro_termino: null,
      foto_horometro_chasis_termino: form.foto_horometro_chasis_termino || null,
      notas_mecanicas_gsp: form.notas_mecanicas_gsp,
      observacion_trabajo: form.observacion_trabajo,
      cliente_nombre: form.cliente_nombre,
      cliente_rut: form.cliente_rut,
      cliente_cargo: form.cliente_cargo,
      cliente_firma_canvas_base64: form.cliente_firma_canvas_base64,
      latitud_inicio_servicio: geo.latitud,
      longitud_inicio_servicio: geo.longitud,
      accuracy_firma: geo.accuracy,
      device_timestamp: new Date().toISOString()
    }

    const res = await api.post('/operaciones/report/guardar', payload)
    if (res.data && res.data.success) {
      borrarRespaldoJornada() // REQ-1060: jornada cerrada, se elimina el respaldo local
      borrarBorradorFormulario()
      snackbar.text = `✅ Report Día ${diaCorrelativo.value} sellado y transmitido exitosamente!`
      snackbar.color = 'success'
      snackbar.show = true

      if (res.data.es_ultimo_report && res.data.token_viaje_retorno) {
        modalRetornoToken.value = res.data.token_viaje_retorno
        mostrarModalRetorno.value = true
      } else {
        setTimeout(() => {
          router.push('/surveys')
        }, 1500)
      }
    }
  } catch (err) {
    console.error('Error al guardar report diario:', err)
    snackbar.text = err.response?.data?.error || 'Error al sellar y transmitir el report'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    enviando.value = false
  }
}

const volver = () => {
  router.push('/surveys')
}

onMounted(async () => {
  await cargarContexto()
})
</script>

<style scoped>
input[type="time"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
  transform: scale(1.5);
}
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
  transform: scale(1.5);
}
</style>
