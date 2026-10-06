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
            🚚 Control de Flota
          </div>
        </div>
        <v-chip size="large" color="amber-darken-2" variant="flat" class="text-base font-black px-3 py-1.5 rounded-xl shadow-md">
          DÍA {{ diaCorrelativo }}
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

      <!-- SELECTOR DE MOMENTOS (BOTONERA TÁCTIL) -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div
          class="py-3 px-3 rounded-2xl border-2 text-center transition-all cursor-pointer select-none"
          :class="faseVisual === 1 ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-lg scale-[1.01]' : 'bg-slate-900 text-slate-300 border-white/20 font-bold'"
          @click="faseVisual = 1"
        >
          <div class="text-xs uppercase tracking-wider font-bold opacity-90">Momento 1</div>
          <div class="text-base sm:text-lg font-black truncate">🟢 Inicio Faena</div>
        </div>

        <div
          class="py-3 px-3 rounded-2xl border-2 text-center transition-all cursor-pointer select-none"
          :class="faseVisual === 2 ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-lg scale-[1.01]' : 'bg-slate-900 text-slate-300 border-white/20 font-bold'"
          @click="irAMomento2"
        >
          <div class="text-xs uppercase tracking-wider font-bold opacity-90">Momento 2</div>
          <div class="text-base sm:text-lg font-black truncate">🔴 Fin Faena</div>
        </div>
      </div>
    </div>

    <!-- CABECERA REPORT MANDANTE (PASO 3) -->
    <div v-else class="mb-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <v-btn prepend-icon="mdi-arrow-left" size="default" variant="outlined" color="grey-lighten-2" class="font-black text-sm rounded-xl h-10" @click="faseVisual = 2">
          Volver a Control
        </v-btn>
        <v-chip size="large" color="emerald-darken-1" variant="flat" class="text-base font-black px-3 py-1.5 rounded-xl shadow-md">
          DÍA {{ diaCorrelativo }}
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

    <div v-else class="space-y-6">
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

          <!-- BOTONES SELECTOR MULTI-MÁQUINA -->
          <div v-if="equipos.length > 1" class="mb-4 pa-3.5 bg-slate-950/80 rounded-2xl border-2 border-slate-700">
            <label class="text-amber-400 font-black d-block text-uppercase text-xs tracking-wider mb-2.5">
              🚜 SELECCIONAR EQUIPO PARA ESTE REGISTRO (MULTI-MÁQUINA)
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                v-for="eq in equipos"
                :key="eq.id_equipo"
                type="button"
                class="py-3 px-3 rounded-xl border-2 text-left transition-all flex flex-col justify-center"
                :class="idEquipoSeleccionado === eq.id_equipo ? 'bg-emerald-600 border-emerald-300 text-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-300'"
                @click="seleccionarEquipo(eq.id_equipo)"
              >
                <div class="text-lg font-black font-mono tracking-wider flex items-center ga-1.5">
                  <span>🚜</span>
                  <span>{{ eq.patente }}</span>
                </div>
                <div class="text-xs font-bold opacity-90 mt-0.5">
                  {{ eq.modelo }}
                </div>
              </button>
            </div>
          </div>

          <v-divider class="my-3 border-white/20"></v-divider>

          <!-- GRÚA ASIGNADA Y TRIPULACIÓN -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-3.5 bg-slate-950/90 rounded-2xl border border-amber-400/40">
              <span class="text-amber-400 font-black d-block text-uppercase text-xs tracking-wider mb-0.5">🚜 Grúa Asignada</span>
              <strong class="text-amber-300 font-mono text-2xl font-black d-block tracking-wider">
                {{ equipoSeleccionado?.patente || 'BGDF.90-4' }}
              </strong>
              <span class="text-white text-sm font-bold d-block mt-0.5">
                {{ equipoSeleccionado?.modelo || 'LTM-1220' }}
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

        <!-- FORMULARIO DE INICIO DE JORNADA -->
        <v-card
          class="pa-5 rounded-3xl border-2 border-slate-700 text-white shadow-xl"
          style="background-color: #0b1120;"
        >
          <div class="d-flex align-center ga-3 mb-4">
            <span class="text-3xl">🟢</span>
            <div>
              <div class="text-xl font-black text-white">Registro de Inicio de Faena</div>
              <div class="text-sm text-slate-300 font-medium">Lectura de tableros al comenzar la jornada</div>
            </div>
          </div>

          <!-- Fecha de la Jornada -->
          <div class="mb-4">
            <label class="text-sm font-black text-amber-300 text-uppercase mb-1.5 d-block tracking-wider">
              📅 FECHA DE LA JORNADA
            </label>
            <input
              v-model="form.fecha_reporte"
              type="date"
              class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-lg font-black focus:border-amber-400 focus:outline-none h-14"
            />
          </div>

          <!-- Aviso Especial para Día > 1 (Equipo en Faena) -->
          <div v-if="diaCorrelativo > 1" class="mb-4 pa-4 rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/40 text-left">
            <div class="d-flex align-center ga-2 text-emerald-400 font-black text-sm uppercase mb-1">
              <span>🏕️</span>
              <span>Servicio Multi-Día • Jornada Día {{ diaCorrelativo }}</span>
            </div>
            <p class="text-xs text-slate-300 mb-0 font-medium">
              El equipo pernocta en obra y no registra traslado. Solo se estampa la hora de inicio. El horómetro de superestructura se hereda automáticamente del cierre previo (<strong>{{ form.horometro_inicio || '0.0' }} hrs</strong>).
            </p>
          </div>

          <!-- Hora Inicio -->
          <div class="mb-4">
            <label class="text-sm font-black text-emerald-400 text-uppercase mb-1.5 d-block tracking-wider">
              🟢 HORA DE INICIO EN FAENA
            </label>
            <input
              v-model="form.hora_inicio"
              type="time"
              class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-2xl font-black focus:border-emerald-400 focus:outline-none text-center h-16 shadow-inner"
            />
          </div>

          <!-- Horómetro Superestructura Inicial (Sin Odómetro Redundante) -->
          <div class="mb-4">
            <div class="d-flex align-center justify-space-between mb-1.5">
              <label class="text-sm font-black text-amber-300 text-uppercase tracking-wider">
                ⚙️ HORÓMETRO SUPERESTRUCTURA (INICIO) <span v-if="diaCorrelativo === 1">*</span>
              </label>
              <span v-if="diaCorrelativo > 1" class="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                Heredado Día {{ diaCorrelativo - 1 }}
              </span>
            </div>
            <input
              v-model.number="form.horometro_inicio"
              type="number"
              step="0.1"
              placeholder="Ej: 3450.5"
              class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-amber-300 font-mono text-2xl font-black focus:border-amber-400 focus:outline-none text-center h-16 shadow-inner"
            />
          </div>

          <!-- FOTOGRAFÍA DEL HORÓMETRO AL INICIO -->
          <div class="mb-5 pa-5 rounded-2xl border-2 border-slate-700 bg-slate-950/80">
            <div class="d-flex align-center justify-space-between mb-2">
              <label class="text-lg sm:text-xl font-black text-amber-300 text-uppercase tracking-wider d-flex align-center ga-2">
                <span>📸 Foto Horómetro Superestructura</span>
                <span v-if="diaCorrelativo === 1" class="text-red-400 font-black">*</span>
              </label>
              <span v-if="form.foto_tablero_inicio" class="text-base font-black text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-500">
                ✅ Foto Cargada
              </span>
              <span v-else-if="diaCorrelativo > 1" class="text-xs font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded-lg">
                Opcional en Día > 1
              </span>
              <span v-else class="text-base font-black text-amber-400 bg-amber-950 px-3 py-1.5 rounded-xl border border-amber-500">
                ⚠️ Obligatoria
              </span>
            </div>
            <p class="text-base text-slate-300 mb-4 font-medium">
              Fotografía clara del horómetro de la superestructura/grúa al iniciar la faena.
            </p>

            <input
              ref="inputFotoInicio"
              type="file"
              accept="image/*"
              capture="environment"
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
                  @click="inputFotoInicio.click()"
                >
                  📸 Cambiar Foto
                </v-btn>
                <v-btn
                  color="red-lighten-1"
                  variant="outlined"
                  size="x-large"
                  class="font-black text-lg h-16 rounded-2xl px-5"
                  @click="form.foto_tablero_inicio = null"
                >
                  🗑️ Borrar
                </v-btn>
              </div>
            </div>

            <div v-else>
              <v-btn
                color="amber"
                variant="flat"
                size="large"
                block
                class="font-black text-base h-14 rounded-2xl d-flex align-center ga-2 text-slate-950 shadow-lg py-3"
                @click="inputFotoInicio.click()"
              >
                <span class="text-2xl">📸</span>
                <span>Tomar Foto Horómetro Superestructura</span>
              </v-btn>
            </div>
          </div>

          <!-- BOTÓN DE GUARDAR INICIO DE JORNADA -->
          <v-btn
            block
            size="x-large"
            :color="diaCorrelativo > 1 ? 'emerald-darken-1' : 'amber-darken-2'"
            class="font-black text-uppercase rounded-2xl py-4 min-h-[62px] text-base sm:text-lg shadow-xl tracking-wider"
            :class="diaCorrelativo > 1 ? 'text-white shadow-emerald-500/20' : 'text-slate-950 shadow-amber-500/20'"
            :loading="enviandoInicio"
            :disabled="!puedeGuardarInicio"
            @click="guardarInicioJornada"
          >
            <span v-if="diaCorrelativo > 1">▶️ Iniciar Jornada de Faena Día {{ diaCorrelativo }} ({{ form.hora_inicio }})</span>
            <span v-else>💾 Guardar Inicio de Jornada (En Faena)</span>
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
              DÍA {{ diaCorrelativo }} • EN FAENA
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
                {{ equipoSeleccionado?.patente || 'BGDF.90-4' }}
              </strong>
              <span class="text-white text-sm font-bold d-block">
                {{ equipoSeleccionado?.modelo || 'LTM-1220' }}
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

          <!-- DATOS DE INICIO FIJOS -->
          <div class="p-3.5 bg-emerald-950/60 rounded-2xl border-2 border-emerald-500/60">
            <div class="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1.5">
              ✅ Lecturas Registradas al Inicio de Faena:
            </div>
            <div class="grid grid-cols-2 gap-2 text-center">
              <div class="p-2 bg-slate-950/80 rounded-xl border border-white/10">
                <span class="text-slate-300 text-xs font-bold uppercase d-block">🟢 Hora Entrada</span>
                <span class="text-emerald-300 font-mono text-base font-black">{{ form.hora_inicio }} hrs</span>
              </div>
              <div class="p-2 bg-slate-950/80 rounded-xl border border-white/10">
                <span class="text-slate-300 text-xs font-bold uppercase d-block">⚙️ Horómetro Grúa Inicial</span>
                <span class="text-amber-300 font-mono text-base font-black">{{ form.horometro_inicio || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </v-card>

        <!-- FORMULARIO DE TÉRMINO DE JORNADA -->
        <v-card
          class="pa-5 rounded-3xl border-2 border-slate-700 text-white shadow-xl"
          style="background-color: #0b1120;"
        >
          <div class="d-flex align-center ga-3 mb-4">
            <span class="text-3xl">🔴</span>
            <div>
              <div class="text-xl font-black text-white">Registro de Término de Faena</div>
              <div class="text-sm text-slate-300 font-medium">Cierre de operación diaria y balance horario</div>
            </div>
          </div>

          <!-- Hora Término -->
          <div class="mb-4">
            <label class="text-sm font-black text-red-400 text-uppercase mb-1.5 d-block tracking-wider">
              🔴 HORA DE TÉRMINO DE FAENA
            </label>
            <input
              v-model="form.hora_termino"
              type="time"
              class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-2xl font-black focus:border-red-400 focus:outline-none text-center h-16 shadow-inner"
            />
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

          <!-- ⏱️ CÁLCULO DE JORNADA (JUSTO DEBAJO DE COLACIÓN - GRID 3 COLUMNAS NÍTIDAS) -->
          <div class="pa-4 rounded-3xl border-2 border-emerald-500/70 bg-emerald-950/50 mb-4 shadow-xl">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-sm font-black text-emerald-400 text-uppercase tracking-wider">
                ⏱️ Resumen de Tiempos de Jornada
              </span>
              <span class="text-sm text-slate-200 font-mono font-bold">
                Base Mínima: {{ horasMinimas }} hrs
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2.5 text-center pt-1">
              <div class="p-2.5 bg-slate-900/90 rounded-2xl border border-white/10">
                <div class="text-xs uppercase font-black text-slate-300 tracking-wider mb-0.5">Jornada Total</div>
                <div class="text-xl sm:text-2xl font-mono font-black text-white">
                  {{ totalHorasJornada }} hrs
                </div>
              </div>
              <div class="p-2.5 bg-slate-900/90 rounded-2xl border border-white/10">
                <div class="text-xs uppercase font-black text-slate-300 tracking-wider mb-0.5">Colación</div>
                <div class="text-xl sm:text-2xl font-mono font-black text-amber-300">
                  {{ horasColacionFormateadas }} hrs
                </div>
              </div>
              <div class="p-2.5 bg-emerald-900/90 rounded-2xl border-2 border-emerald-400 shadow-md">
                <div class="text-xs uppercase font-black text-emerald-300 tracking-wider mb-0.5">Efectivas</div>
                <div class="text-xl sm:text-2xl font-mono font-black text-emerald-300">
                  {{ calculoHoras.efectivas }} hrs
                </div>
              </div>
            </div>

            <div v-if="calculoHoras.sobretiempo > 0" class="mt-3 text-center text-sm font-black text-amber-200 bg-amber-950/90 py-2 px-3 rounded-xl border border-amber-500/50">
              ⚡ <strong>Sobretiempo Devengado:</strong> +{{ calculoHoras.sobretiempo }} hrs (Total a Facturar: {{ calculoHoras.facturables }} hrs).
            </div>
            <div v-else class="mt-3 text-center text-xs font-bold text-emerald-300/90 bg-emerald-950/60 py-1.5 px-3 rounded-xl border border-emerald-500/30">
              ✔️ Sin sobretiempo devengado (Facturación base contractual: {{ calculoHoras.facturables }} hrs).
            </div>
          </div>

          <!-- 1. HORÓMETRO SUPERESTRUCTURA TÉRMINO (OBLIGATORIO) -->
          <div class="mb-4 pa-4 rounded-2xl border-2 border-slate-700 bg-slate-950/80">
            <div class="d-flex align-center justify-space-between mb-1.5">
              <label class="text-sm font-black text-amber-300 text-uppercase tracking-wider">
                ⚙️ HORÓMETRO SUPERESTRUCTURA (TÉRMINO) *
              </label>
              <button
                v-if="horometroPropuesto && form.horometro_termino !== horometroPropuesto"
                type="button"
                @click="aplicarHorometroSugerido"
                class="text-[11px] font-bold text-amber-400 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
              >
                💡 Usar Sugerido: {{ horometroPropuesto }}
              </button>
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
              <button @click="aplicarHorometroSugerido" type="button" class="underline text-white text-[11px] ml-2 cursor-pointer">
                Corregir
              </button>
            </div>

            <!-- ALERTA: HOROMETRO DISPARADO -->
            <div v-else-if="estadoHorometroTermino.tipo === 'WARNING_DISPARADO'" class="mt-2 p-2.5 bg-yellow-950/90 border-2 border-yellow-500 rounded-xl text-xs text-yellow-200 font-bold space-y-1.5">
              <div class="flex items-start gap-1.5">
                <span>{{ estadoHorometroTermino.mensaje }}</span>
              </div>
              <div class="flex items-center justify-between pt-1 border-t border-yellow-500/30">
                <span class="text-[11px] text-yellow-400">Sugerido estimado: {{ horometroPropuesto }} hrs</span>
                <button @click="aplicarHorometroSugerido" type="button" class="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-2.5 py-1 rounded-lg text-xs cursor-pointer shadow">
                  Reemplazar por Sugerido
                </button>
              </div>
            </div>

            <div v-else-if="deltaHorometro !== null" class="text-xs text-slate-200 d-block mt-1.5 font-mono font-bold flex items-center justify-space-between">
              <span>Δ Superestructura: {{ deltaHorometro }} hrs</span>
              <span v-if="horometroPropuesto" class="text-slate-400 text-[11px]">Sugerido: {{ horometroPropuesto }} hrs</span>
            </div>

            <!-- FOTOGRAFÍA OBLIGATORIA SUPERESTRUCTURA -->
            <div class="mt-3 pt-3 border-t border-slate-800">
              <div class="d-flex align-center justify-space-between mb-1.5">
                <label class="text-xs font-black text-amber-300 text-uppercase tracking-wider d-flex align-center ga-1.5">
                  <span>📸 Foto Tablero Superestructura (Término)</span>
                  <span class="text-red-400 font-black">*</span>
                </label>
                <span v-if="form.foto_tablero_termino" class="text-[11px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-500">
                  ✅ Foto Cargada
                </span>
                <span v-else class="text-[11px] font-black text-amber-400 bg-amber-950 px-2 py-0.5 rounded-lg border border-amber-500">
                  ⚠️ Obligatoria
                </span>
              </div>

              <input
                ref="inputFotoTermino"
                type="file"
                accept="image/*"
                capture="environment"
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
                    size="small"
                    class="flex-grow-1 font-black text-xs h-9 rounded-lg text-slate-950"
                    @click="inputFotoTermino.click()"
                  >
                    📸 Cambiar Foto Superestructura
                  </v-btn>
                  <v-btn
                    color="red-lighten-1"
                    variant="outlined"
                    size="small"
                    class="font-black text-xs h-9 rounded-lg px-3"
                    @click="form.foto_tablero_termino = null"
                  >
                    🗑️ Borrar
                  </v-btn>
                </div>
              </div>

              <div v-else>
                <v-btn
                  color="amber"
                  variant="flat"
                  size="default"
                  block
                  class="font-black text-xs h-11 rounded-xl d-flex align-center ga-2 text-slate-950 shadow py-2"
                  @click="inputFotoTermino.click()"
                >
                  <span class="text-lg">📸</span>
                  <span>Tomar Foto Horómetro Superestructura</span>
                </v-btn>
              </div>
            </div>
          </div>



          <!-- 3. HORÓMETRO CHASIS TÉRMINO (EQUIPOS BIMOTOR O DOS MOTORES) -->
          <div v-if="esGruaBimotor" class="mb-4 pa-4 rounded-2xl border-2 border-slate-700 bg-slate-950/80">
            <div class="d-flex align-center justify-space-between mb-1.5">
              <label class="text-sm font-black text-cyan-300 text-uppercase tracking-wider">
                🚜 HORÓMETRO CHASIS (TÉRMINO)
              </label>
              <span class="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">Motor Chasis</span>
            </div>
            <input
              v-model.number="form.horometro_chasis_termino"
              type="number"
              step="0.1"
              placeholder="Ej: 5120.4"
              class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-cyan-300 font-mono text-2xl font-black focus:border-cyan-400 focus:outline-none text-center h-16 shadow-inner"
            />

            <!-- FOTOGRAFÍA HORÓMETRO CHASIS -->
            <div class="mt-3 pt-3 border-t border-slate-800">
              <div class="d-flex align-center justify-space-between mb-1.5">
                <label class="text-xs font-black text-cyan-300 text-uppercase tracking-wider d-flex align-center ga-1.5">
                  <span>📸 Foto Tablero Chasis (Término)</span>
                  <span v-if="form.horometro_chasis_termino" class="text-red-400 font-black">*</span>
                </label>
                <span v-if="form.foto_horometro_chasis_termino" class="text-[11px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-500">
                  ✅ Foto Cargada
                </span>
                <span v-else-if="form.horometro_chasis_termino" class="text-[11px] font-black text-amber-400 bg-amber-950 px-2 py-0.5 rounded-lg border border-amber-500">
                  ⚠️ Obligatoria al registrar horómetro chasis
                </span>
              </div>

              <input
                ref="inputFotoChasisTermino"
                type="file"
                accept="image/*"
                capture="environment"
                class="d-none"
                @change="onFotoChasisTerminoSeleccionada"
              />

              <div v-if="form.foto_horometro_chasis_termino" class="position-relative space-y-2">
                <div class="rounded-xl overflow-hidden border border-cyan-400 bg-black flex items-center justify-center max-h-60 shadow-md">
                  <img
                    :src="form.foto_horometro_chasis_termino"
                    alt="Foto Horómetro Chasis Término"
                    class="w-full h-auto max-h-60 object-contain"
                  />
                </div>
                <div class="d-flex ga-2">
                  <v-btn
                    color="cyan-darken-2"
                    variant="flat"
                    size="small"
                    class="flex-grow-1 font-black text-xs h-9 rounded-lg text-white"
                    @click="inputFotoChasisTermino.click()"
                  >
                    📸 Cambiar Foto Chasis
                  </v-btn>
                  <v-btn
                    color="red-lighten-1"
                    variant="outlined"
                    size="small"
                    class="font-black text-xs h-9 rounded-lg px-3"
                    @click="form.foto_horometro_chasis_termino = null"
                  >
                    🗑️ Borrar
                  </v-btn>
                </div>
              </div>

              <div v-else>
                <v-btn
                  color="cyan-darken-3"
                  variant="outlined"
                  size="default"
                  block
                  class="font-bold text-xs h-11 rounded-xl d-flex align-center ga-2 text-cyan-300 border-cyan-500/50 hover:bg-cyan-950/40 py-2"
                  @click="inputFotoChasisTermino.click()"
                >
                  <span class="text-lg">📸</span>
                  <span>Tomar Foto Horómetro Chasis</span>
                </v-btn>
              </div>
            </div>
          </div>

          <!-- Observaciones / Maniobras -->
          <div class="mb-3">
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

          <!-- Notas Mecánicas Internas GSP (Confidencial Taller) -->
          <div class="mb-4">
            <label class="text-sm font-black text-slate-400 text-uppercase mb-1.5 d-block tracking-wider">
              🔒 NOTAS MECÁNICAS / TALLER GSP (USO INTERNO)
            </label>
            <textarea
              v-model="form.notas_mecanicas_gsp"
              rows="2"
              placeholder="Niveles de fluidos, desgaste de aparejos, alertas del computador de abordo..."
              class="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-3 text-slate-200 text-sm font-medium focus:border-slate-500 focus:outline-none"
            ></textarea>
          </div>

          <!-- BOTÓN: PROCEDER A REPORT MANDANTE -->
          <v-btn
            block
            size="x-large"
            color="amber-darken-2"
            class="font-black text-uppercase rounded-2xl text-slate-950 py-4 min-h-[62px] text-lg shadow-xl shadow-amber-500/20 tracking-wider"
            :disabled="!puedeAvanzarAReport"
            @click="irAReportMandante"
          >
            <span>🏁 Finalizar Jornada ➔ Proceder a Report Mandante ➔</span>
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
            <v-chip size="default" color="amber" variant="flat" class="font-black text-xs text-slate-950 px-3 py-1">
              DÍA {{ diaCorrelativo }}
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
                {{ equipoSeleccionado?.patente || 'BGDF.90-4' }}
              </strong>
              <span class="text-slate-200 text-sm font-bold d-block">
                {{ equipoSeleccionado?.modelo || 'LTM-1220' }}
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
                <div class="text-xs uppercase font-black text-emerald-300 tracking-wider">Efectivas</div>
                <div class="text-2xl font-mono font-black text-emerald-300 mt-0.5">
                  {{ calculoHoras.efectivas }} hrs
                </div>
              </div>
            </div>

            <div v-if="calculoHoras.sobretiempo > 0" class="mt-2.5 text-sm font-black text-yellow-300 text-center">
              (Incluye +{{ calculoHoras.sobretiempo }} hrs de sobretiempo sobre base contractual)
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
              ◀ Volver a Control de Flota
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
const servicioConcluido = ref(false)
const mensajeConcluido = ref('')
const mostrarModalRetorno = ref(false)
const modalRetornoToken = ref(null)

const irAViajeRetorno = () => {
  const isProd = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/lg-gsp-prod') ||
    window.location.pathname.startsWith('/pwa-gsp-prod')
  )
  const webPrefix = isProd ? '/lg-gsp-prod' : '/lg-gsp-dev'
  window.location.href = `${window.location.origin}${webPrefix}/viaje/${modalRetornoToken.value}`
}

const proyecto = ref({})
const equipos = ref([])
const personas = ref([])
const reportsPrevios = ref([])
const diaCorrelativo = ref(1)
const horasMinimas = ref(8.0)

const inputFotoInicio = ref(null)
const inputFotoTermino = ref(null)
const inputFotoChasisTermino = ref(null)

const form = reactive({
  fecha_reporte: new Date().toISOString().split('T')[0],
  hora_inicio: '08:00',
  hora_termino: '18:00',
  minutos_colacion: 60,
  horometro_inicio: null,
  horometro_termino: null,
  horometro_chasis_termino: null,
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
  if (idEquipoSeleccionado.value) {
    const match = equipos.value.find(e => Number(e.id_equipo) === idEquipoSeleccionado.value)
    if (match) return match
  }
  if (equipos.value.length > 0) return equipos.value[0]
  return { patente: 'BGDF.90-4', modelo: 'LTM-1220 (220 TON)', estado_operativo: 'ARRIBADO' }
})

const operadorNombre = computed(() => {
  const op = personas.value.find(p => (p.rol_asignado || '').toUpperCase().includes('OPERADOR'))
  if (op) return `${op.name_frst || ''} ${op.apellido_pat || ''}`.trim()
  return 'Operador Asignado'
})

const riggerNombre = computed(() => {
  const rig = personas.value.find(p => (p.rol_asignado || '').toUpperCase().includes('RIGGER'))
  if (rig) {
    const nom = `${rig.name_frst || ''} ${rig.apellido_pat || ''}`.trim()
    return nom || null
  }
  return null
})

const horasColacionFormateadas = computed(() => {
  return (form.minutos_colacion / 60).toFixed(1)
})

const totalHorasJornada = computed(() => {
  if (!form.hora_inicio || !form.hora_termino) return '0.0'
  const [hIni, mIni] = form.hora_inicio.split(':').map(Number)
  const [hFin, mFin] = form.hora_termino.split(':').map(Number)
  let minutosTotales = (hFin * 60 + mFin) - (hIni * 60 + mIni)
  if (minutosTotales < 0) minutosTotales += 24 * 60
  return (minutosTotales / 60).toFixed(1)
})

const deltaHorometro = computed(() => {
  if (form.horometro_inicio !== null && form.horometro_termino !== null) {
    const diff = form.horometro_termino - form.horometro_inicio
    return diff >= 0 ? diff.toFixed(1) : '0.0'
  }
  return null
})


const esGruaBimotor = computed(() => {
  const t = (equipoSeleccionado.value?.tipo_equipo || equipoSeleccionado.value?.modelo || '').toUpperCase()
  return t.includes('GRUA') || t.includes('TELESCOPICA') || t.includes('LTM') || equipoSeleccionado.value?.cantidad_estanques === 2 || equipoSeleccionado.value?.es_bimotor === true
})

// Acciones de cámara para foto inicio horómetro
const onFotoInicioSeleccionada = (event) => {
  comprimirYAsignar(event, (b64) => { form.foto_tablero_inicio = b64 })
}

// Acciones de cámara para foto término superestructura
const onFotoTerminoSeleccionada = (event) => {
  comprimirYAsignar(event, (b64) => { form.foto_tablero_termino = b64 })
}

// Acciones de cámara para foto término chasis (bimotor)
const onFotoChasisTerminoSeleccionada = (event) => {
  comprimirYAsignar(event, (b64) => { form.foto_horometro_chasis_termino = b64 })
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
    return { efectivas: 0, facturables: horasMinimas.value, sobretiempo: 0 }
  }

  const [hIni, mIni] = form.hora_inicio.split(':').map(Number)
  const [hFin, mFin] = form.hora_termino.split(':').map(Number)

  let minutosTotales = (hFin * 60 + mFin) - (hIni * 60 + mIni)
  if (minutosTotales < 0) minutosTotales += 24 * 60

  const minutosEfectivos = Math.max(0, minutosTotales - form.minutos_colacion)
  const efectivas = Number((minutosEfectivos / 60).toFixed(1))
  const facturables = Number(Math.max(efectivas, horasMinimas.value).toFixed(1))
  const sobretiempo = Number(Math.max(0, efectivas - horasMinimas.value).toFixed(1))

  return { efectivas, facturables, sobretiempo }
})

// Horómetro Propuesto y Diagnóstico de Consistencia
const horometroPropuesto = computed(() => {
  if (form.horometro_inicio !== null && form.horometro_inicio !== undefined && Number(form.horometro_inicio) > 0) {
    const ef = Number(calculoHoras.value.efectivas || 0)
    return Number((Number(form.horometro_inicio) + ef).toFixed(1))
  }
  return null
})

const aplicarHorometroSugerido = () => {
  if (horometroPropuesto.value !== null) {
    form.horometro_termino = horometroPropuesto.value
  }
}

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

// Auto-proponer horómetro cuando se calculan las horas efectivas si está vacío
watch(() => calculoHoras.value.efectivas, (newEf) => {
  if (newEf > 0 && form.horometro_inicio && (!form.horometro_termino || form.horometro_termino === null)) {
    form.horometro_termino = horometroPropuesto.value
  }
})

const puedeGuardarInicio = computed(() => {
  if (servicioConcluido.value) return false
  if (!form.fecha_reporte || !form.hora_inicio || enviandoInicio.value) return false
  if (diaCorrelativo.value > 1) {
    return true
  }
  return (
    form.horometro_inicio !== null &&
    Number(form.horometro_inicio) > 0 &&
    form.foto_tablero_inicio
  )
})

const puedeAvanzarAReport = computed(() => {
  if (servicioConcluido.value) return false
  const superOk = (
    form.hora_termino &&
    form.horometro_termino !== null &&
    Number(form.horometro_termino) >= Number(form.horometro_inicio || 0) &&
    estadoHorometroTermino.value.tipo !== 'ERROR_MENOR' &&
    form.foto_tablero_termino
  )
  if (!superOk) return false
  if (esGruaBimotor.value && form.horometro_chasis_termino) {
    if (!form.foto_horometro_chasis_termino) return false
  }
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

const irAMomento2 = () => {
  if (diaCorrelativo.value === 1) {
    if (!form.horometro_inicio || Number(form.horometro_inicio) <= 0) {
      snackbar.text = '⚠️ Debes ingresar el Horómetro de Inicio en Momento 1'
      snackbar.color = 'warning'
      snackbar.show = true
      return
    }
    if (!form.foto_tablero_inicio) {
      snackbar.text = '⚠️ La Foto del Horómetro al Inicio es OBLIGATORIA'
      snackbar.color = 'warning'
      snackbar.show = true
      return
    }
  }
  faseVisual.value = 2
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const irAReportMandante = () => {
  if (!form.hora_termino) {
    snackbar.text = '⚠️ Debes ingresar la Hora de Término de Faena'
    snackbar.color = 'warning'
    snackbar.show = true
    return
  }
  if (!form.horometro_termino || Number(form.horometro_termino) <= 0) {
    snackbar.text = '⚠️ Debes ingresar el Horómetro de Término'
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
  if (!form.foto_tablero_termino) {
    snackbar.text = '⚠️ La Foto del Horómetro de Superestructura al Término es OBLIGATORIA'
    snackbar.color = 'warning'
    snackbar.show = true
    return
  }
  if (esGruaBimotor.value && form.horometro_chasis_termino && !form.foto_horometro_chasis_termino) {
    snackbar.text = '⚠️ La Foto del Horómetro de Chasis al Término es OBLIGATORIA'
    snackbar.color = 'warning'
    snackbar.show = true
    return
  }
  faseVisual.value = 3
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const seleccionarEquipo = async (idEq) => {
  idEquipoSeleccionado.value = Number(idEq)
  await cargarContexto(idEq)
}

const cargarContexto = async (idEqParam = null) => {
  try {
    cargando.value = true
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

    const eqQuery = idEqParam || idEquipoSeleccionado.value ? `?id_equipo=${idEqParam || idEquipoSeleccionado.value}` : ''
    const res = await api.get(`/operaciones/report/contexto/${idProyecto.value}${eqQuery}`)
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

      if (d.id_equipo_seleccionado && !idEquipoSeleccionado.value) {
        idEquipoSeleccionado.value = Number(d.id_equipo_seleccionado)
      } else if (!idEquipoSeleccionado.value && equipos.value.length > 0) {
        idEquipoSeleccionado.value = Number(equipos.value[0].id_equipo)
      }

      // Si hay una jornada activa (iniciada hoy), precargarla y pasar directo a Momento 2
      if (d.jornada_activa) {
        const j = d.jornada_activa
        idReporteAvanceActivo.value = j.id_reporte_avance
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
        if (j.fecha_inicio_servicio) {
          try {
            const d = new Date(j.fecha_inicio_servicio)
            if (!isNaN(d.getTime())) {
              const hh = String(d.getHours()).padStart(2, '0')
              const mm = String(d.getMinutes()).padStart(2, '0')
              form.hora_inicio = `${hh}:${mm}`
            } else {
              const t = j.fecha_inicio_servicio.split('T')[1] || ''
              if (t.length >= 5) form.hora_inicio = t.substring(0, 5)
            }
          } catch (e) {
            const t = j.fecha_inicio_servicio.split('T')[1] || ''
            if (t.length >= 5) form.hora_inicio = t.substring(0, 5)
          }
        }
        diaCorrelativo.value = j.dia_correlativo || diaCorrelativo.value
        faseVisual.value = 2 // Pasar directo al Momento 2 (Fin de jornada)

        // Preproponer horómetro de término si está disponible
        if (form.horometro_inicio && (!form.horometro_termino || form.horometro_termino === null)) {
          const ef = Number(calculoHoras.value.efectivas || 0)
          form.horometro_termino = Number((Number(form.horometro_inicio) + ef).toFixed(1))
        }
      } else {
        if (d.horometro_sugerido && form.horometro_inicio === null) {
          form.horometro_inicio = Number(d.horometro_sugerido)
        }
        if (d.odometro_sugerido && form.odometro_inicio === null) {
          form.odometro_inicio = Number(d.odometro_sugerido)
        }
      }
    }
  } catch (err) {
    console.error('Error al cargar contexto de Control de Flota:', err)
    snackbar.text = 'Error al cargar datos del proyecto desde el servidor'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    cargando.value = false
  }
}

// Guardar Momento 1 (Inicio de Jornada)
const guardarInicioJornada = async () => {
  try {
    if (diaCorrelativo.value === 1) {
      if (!form.horometro_inicio || Number(form.horometro_inicio) <= 0) {
        snackbar.text = '⚠️ Debes ingresar el Horómetro de Inicio'
        snackbar.color = 'warning'
        snackbar.show = true
        return
      }
      if (!form.foto_tablero_inicio) {
        snackbar.text = '⚠️ La Foto del Horómetro al Inicio es OBLIGATORIA'
        snackbar.color = 'warning'
        snackbar.show = true
        return
      }
    }

    enviandoInicio.value = true
    const payload = {
      id_proyecto: Number(idProyecto.value),
      id_equipo: equipoSeleccionado.value?.id_equipo || idEquipoSeleccionado.value,
      id_user_operador: personas.value.find(p => (p.rol_asignado || '').toUpperCase().includes('OPERADOR'))?.id_user || 1,
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
    snackbar.text = err.response?.data?.error || 'Error al guardar inicio de jornada'
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
      id_user_operador: personas.value.find(p => (p.rol_asignado || '').toUpperCase().includes('OPERADOR'))?.id_user || 1,
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
