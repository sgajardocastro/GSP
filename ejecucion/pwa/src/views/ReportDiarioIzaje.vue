<template>
  <v-container class="pa-3 max-w-xl mx-auto pb-24" style="max-width: 680px;">
    <!-- TOP BAR -->
    <div class="d-flex align-center justify-space-between mb-3">
      <v-btn icon="mdi-arrow-left" size="large" variant="flat" color="slate-800" class="border border-white/20" @click="volver"></v-btn>
      <div class="text-center flex-grow-1 px-2">
        <div class="text-xs font-black text-amber-400 text-uppercase tracking-widest">
          GSP CONTROL DE FLOTA
        </div>
        <div class="text-lg sm:text-xl font-black text-white">
          {{ faseVisual === 3 ? '📋 Report Diario de Izaje' : '🚜 Control de Flota' }}
        </div>
      </div>
      <v-chip size="large" color="amber-darken-2" variant="flat" class="text-base font-black px-4 py-2">
        DÍA {{ diaCorrelativo }}
      </v-chip>
    </div>

    <!-- INDICADOR DE MOMENTO OPERACIONAL (Spec 39) -->
    <div class="d-flex ga-1.5 mb-4">
      <div
        class="flex-1 py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer"
        :class="faseVisual === 1 ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md' : 'bg-slate-900/80 text-slate-400 border-white/10 font-bold'"
        @click="faseVisual = 1"
      >
        <div class="text-[10px] uppercase tracking-wider">Momento 1</div>
        <div class="text-xs truncate">🟢 Inicio Jornada</div>
      </div>

      <div
        class="flex-1 py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer"
        :class="faseVisual === 2 ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md' : 'bg-slate-900/80 text-slate-400 border-white/10 font-bold'"
        @click="irAMomento2"
      >
        <div class="text-[10px] uppercase tracking-wider">Momento 2</div>
        <div class="text-xs truncate">🔴 Fin Jornada</div>
      </div>

      <div
        class="flex-1 py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer"
        :class="faseVisual === 3 ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md' : 'bg-slate-900/80 text-slate-400 border-white/10 font-bold'"
        @click="irAReportMandante"
      >
        <div class="text-[10px] uppercase tracking-wider">Paso 3</div>
        <div class="text-xs truncate">✍️ Report Mandante</div>
      </div>
    </div>

    <!-- Loading State -->
    <v-card v-if="cargando" class="pa-8 text-center rounded-2xl bg-slate-900 border border-white/10">
      <v-progress-circular indeterminate color="amber" size="64" width="6" class="mb-4"></v-progress-circular>
      <div class="text-lg font-bold text-grey-lighten-1">Cargando datos de la OT y faena...</div>
    </v-card>

    <div v-else class="space-y-4">
      <!-- ========================================================================= -->
      <!-- MOMENTO 1: INICIO DE JORNADA (MAÑANA / AL LLEGAR A FAENA)                 -->
      <!-- ========================================================================= -->
      <div v-show="faseVisual === 1" class="space-y-4">
        <!-- TARJETA DE ANTECEDENTES OT & FLOTA -->
        <v-card
          class="pa-5 rounded-2xl border-2 border-amber-500/40 text-white"
          style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"
          elevation="4"
        >
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-base sm:text-lg font-mono text-amber-300 font-black">
              OT: {{ proyecto.codi_proyecto || 'GSP-OT' }}
            </span>
            <v-chip size="small" color="success" variant="flat" class="font-black text-xs uppercase px-3">
              🟢 EN FAENA
            </v-chip>
          </div>

          <div class="text-xl sm:text-2xl font-black text-white mb-1 leading-tight">
            {{ proyecto.cliente_nombre || 'LeanGlobal Spa' }}
          </div>
          <div class="text-sm text-grey-lighten-1 mb-3">
            📍 <strong class="text-white">Faena:</strong> {{ proyecto.obra_nombre || 'Faena Operativa' }} 
            <span v-if="proyecto.obra_direccion" class="text-grey-lighten-2">• {{ proyecto.obra_direccion }}</span>
          </div>

          <v-divider class="my-3 border-white/20"></v-divider>

          <!-- SELECTOR MULTI-MÁQUINA SI HAY MÁS DE 1 EQUIPO -->
          <div v-if="equipos.length > 1" class="mb-3">
            <label class="text-amber-400 font-bold d-block text-uppercase text-xs tracking-wider mb-2">
              🚜 Seleccionar Equipo para este Registro (Multi-Máquina)
            </label>
            <div class="d-flex ga-2 flex-wrap">
              <v-btn
                v-for="eq in equipos"
                :key="eq.id_equipo"
                size="default"
                :variant="idEquipoSeleccionado === eq.id_equipo ? 'flat' : 'outlined'"
                :color="idEquipoSeleccionado === eq.id_equipo ? 'amber' : 'grey-lighten-2'"
                class="font-black text-xs rounded-xl flex-grow-1"
                @click="seleccionarEquipo(eq.id_equipo)"
              >
                <span class="mr-1">🚜 {{ eq.patente }}</span>
                <span class="text-caption font-normal opacity-80">({{ eq.modelo }})</span>
              </v-btn>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-6">
              <span class="text-amber-400 font-bold d-block text-uppercase text-xs tracking-wider mb-1">🚜 Grúa Asignada</span>
              <strong class="text-amber-200 font-mono text-lg sm:text-xl font-black d-block">
                {{ equipoSeleccionado?.patente || 'BGDF.90-4' }}
              </strong>
              <span class="text-grey-lighten-1 d-block text-xs sm:text-sm font-semibold">
                {{ equipoSeleccionado?.modelo || 'LTM-1220' }}
              </span>
            </div>
            <div class="col-6">
              <span class="text-amber-400 font-bold d-block text-uppercase text-xs tracking-wider mb-1">👷 Tripulación</span>
              <strong class="text-white text-sm sm:text-base font-bold d-block">Op: {{ operadorNombre }}</strong>
              <span class="text-grey-lighten-1 text-xs sm:text-sm font-semibold d-block">Rig: {{ riggerNombre }}</span>
            </div>
          </div>
        </v-card>

        <!-- FORMULARIO DE INICIO DE JORNADA -->
        <v-card
          class="pa-5 rounded-2xl border-2 border-slate-700 text-white"
          style="background-color: #0b1120;"
          elevation="4"
        >
          <div class="d-flex align-center ga-3 mb-4">
            <span class="text-2xl">🟢</span>
            <div>
              <div class="text-lg sm:text-xl font-black text-white">Registro de Inicio de Jornada</div>
              <div class="text-xs text-grey-lighten-1">Registro de encendido y estado inicial del activo</div>
            </div>
          </div>

          <!-- Fecha del servicio -->
          <div class="mb-4">
            <label class="text-sm font-black text-amber-300 text-uppercase mb-2 d-block tracking-wider">
              📅 Fecha de la Jornada
            </label>
            <input
              v-model="form.fecha_reporte"
              type="date"
              class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-base sm:text-lg font-bold focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Hora Inicio -->
          <div class="mb-4">
            <label class="text-sm font-black text-emerald-400 text-uppercase mb-2 d-block tracking-wider">
              🟢 Hora de Inicio en Faena
            </label>
            <input
              v-model="form.hora_inicio"
              type="time"
              class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-2xl font-black focus:border-emerald-400 focus:outline-none text-center h-16 shadow-inner"
            />
          </div>

          <!-- Horómetro y Odómetro Inicial -->
          <div class="row g-3 mb-4">
            <div class="col-6">
              <label class="text-sm font-black text-amber-300 text-uppercase mb-2 d-block tracking-wider">
                ⚙️ Horómetro Inicio *
              </label>
              <input
                v-model.number="form.horometro_inicio"
                type="number"
                step="0.1"
                placeholder="Ej: 3450.5"
                class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-3 text-amber-300 font-mono text-xl sm:text-2xl font-black focus:border-amber-400 focus:outline-none text-center h-16 shadow-inner"
              />
            </div>
            <div class="col-6">
              <label class="text-sm font-black text-amber-300 text-uppercase mb-2 d-block tracking-wider">
                🛣️ Odómetro Inicio
              </label>
              <input
                v-model.number="form.odometro_inicio"
                type="number"
                step="1"
                placeholder="Ej: 145000"
                class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-3 text-amber-300 font-mono text-xl sm:text-2xl font-black focus:border-amber-400 focus:outline-none text-center h-16 shadow-inner"
              />
            </div>
          </div>

          <!-- FOTOGRAFÍA OBLIGATORIA DEL TABLERO AL INICIO -->
          <div class="mb-4 pa-4 rounded-xl border-2 border-slate-700 bg-slate-950/80">
            <div class="d-flex align-center justify-space-between mb-2">
              <label class="text-sm font-black text-amber-300 text-uppercase tracking-wider d-flex align-center ga-1.5">
                <span>📸 Foto Tablero Inicio (Horómetro/Odómetro)</span>
                <span class="text-red-400 font-bold">*</span>
              </label>
              <span v-if="form.foto_tablero_inicio" class="text-xs font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-md border border-emerald-500/40">
                ✅ Foto Cargada
              </span>
              <span v-else class="text-xs font-bold text-amber-400 bg-amber-950/70 px-2.5 py-1 rounded-md border border-amber-500/40">
                ⚠️ Obligatoria
              </span>
            </div>
            <p class="text-xs text-grey-lighten-1 mb-3">
              Captura una fotografía clara del panel y horómetro al iniciar la jornada.
            </p>

            <input
              ref="inputFotoInicio"
              type="file"
              accept="image/*"
              capture="environment"
              class="d-none"
              @change="onFotoInicioSeleccionada"
            />

            <div v-if="form.foto_tablero_inicio" class="position-relative space-y-2">
              <div class="rounded-xl overflow-hidden border-2 border-amber-400 bg-black flex items-center justify-center max-h-64 shadow-md">
                <img
                  :src="form.foto_tablero_inicio"
                  alt="Foto Tablero Inicio"
                  class="w-full h-auto max-h-64 object-contain"
                />
              </div>
              <div class="d-flex ga-2 mt-2">
                <v-btn
                  color="amber"
                  variant="flat"
                  size="large"
                  class="flex-grow-1 font-bold text-sm h-12 rounded-xl text-slate-950"
                  @click="inputFotoInicio.click()"
                >
                  📸 Tomar otra foto
                </v-btn>
                <v-btn
                  color="red-lighten-1"
                  variant="outlined"
                  size="large"
                  class="font-bold text-sm h-12 rounded-xl px-4"
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
                size="x-large"
                block
                class="font-black text-base h-14 rounded-xl d-flex align-center ga-2 text-slate-950"
                @click="inputFotoInicio.click()"
              >
                <span class="text-2xl">📸</span>
                <span>Tomar Foto Tablero Inicio</span>
              </v-btn>
            </div>
          </div>

          <!-- BOTÓN DE GUARDAR INICIO DE JORNADA -->
          <v-btn
            block
            size="x-large"
            color="amber-darken-2"
            class="font-black text-uppercase rounded-2xl text-slate-950 py-5 min-h-[64px] text-base sm:text-lg shadow-xl shadow-amber-500/20 tracking-wider"
            :loading="enviandoInicio"
            @click="guardarInicioJornada"
          >
            <span>💾 Guardar Inicio de Jornada (En Faena)</span>
          </v-btn>
        </v-card>
      </div>

      <!-- ========================================================================= -->
      <!-- MOMENTO 2: TÉRMINO DE JORNADA (TARDE / AL CERRAR FAENA)                   -->
      <!-- ========================================================================= -->
      <div v-show="faseVisual === 2" class="space-y-4">
        <!-- RESUMEN FIJO DE INICIO REGISTRADO -->
        <v-card class="pa-4 rounded-2xl bg-slate-900 border border-emerald-500/40 text-white">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-xs font-black text-emerald-400 uppercase tracking-wider">
              ✅ Inicio de Jornada Registrado
            </span>
            <v-chip size="x-small" color="emerald" class="font-mono font-bold">{{ form.hora_inicio }} hrs</v-chip>
          </div>
          <div class="d-flex justify-space-between text-xs text-grey-lighten-2">
            <span>⚙️ Horóm. Inicial: <strong class="text-amber-300 font-mono">{{ form.horometro_inicio || 'N/A' }}</strong></span>
            <span>🛣️ Odóm. Inicial: <strong class="text-amber-300 font-mono">{{ form.odometro_inicio || 'N/A' }}</strong></span>
          </div>
        </v-card>

        <!-- FORMULARIO DE TÉRMINO DE JORNADA -->
        <v-card
          class="pa-5 rounded-2xl border-2 border-slate-700 text-white"
          style="background-color: #0b1120;"
          elevation="4"
        >
          <div class="d-flex align-center ga-3 mb-4">
            <span class="text-2xl">🔴</span>
            <div>
              <div class="text-lg sm:text-xl font-black text-white">Registro de Término de Jornada</div>
              <div class="text-xs text-grey-lighten-1">Cierre de operación diaria y cálculo de tiempos</div>
            </div>
          </div>

          <!-- Hora Término -->
          <div class="mb-4">
            <label class="text-sm font-black text-red-400 text-uppercase mb-2 d-block tracking-wider">
              🔴 Hora de Término de Faena
            </label>
            <input
              v-model="form.hora_termino"
              type="time"
              class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-2xl font-black focus:border-red-400 focus:outline-none text-center h-16 shadow-inner"
            />
          </div>

          <!-- Tiempo de Colación (Botones 1-tap) -->
          <div class="mb-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <label class="text-sm font-black text-amber-300 text-uppercase tracking-wider">
                🥪 Tiempo de Colación
              </label>
              <span class="text-sm sm:text-base font-mono font-black text-amber-400 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-500/30">
                {{ form.minutos_colacion === 0 ? 'Sin Colación (0h)' : `${form.minutos_colacion} min (${horasColacionFormateadas}h)` }}
              </span>
            </div>
            <div class="d-flex ga-1.5 flex-wrap">
              <v-btn
                v-for="opcion in [0, 30, 45, 60, 90]"
                :key="opcion"
                size="large"
                :variant="form.minutos_colacion === opcion ? 'flat' : 'outlined'"
                :color="form.minutos_colacion === opcion ? 'amber' : 'grey-lighten-2'"
                class="flex-grow-1 font-black text-sm sm:text-base h-12 rounded-xl"
                @click="form.minutos_colacion = opcion"
              >
                {{ opcion === 0 ? '0m' : `${opcion}m` }}
              </v-btn>
            </div>
          </div>

          <!-- ⏱️ CÁLCULO DE JORNADA (JUSTO DEBAJO DE COLACIÓN - PEDIDO POR JORGE) -->
          <div class="pa-4 rounded-2xl border-2 border-emerald-500/60 bg-emerald-950/40 mb-4 shadow-lg">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-xs text-emerald-400 text-uppercase font-black tracking-wider">
                ⏱️ Resumen de Tiempos de Jornada
              </span>
              <span class="text-xs text-grey-lighten-2 font-mono font-bold">
                Base Contractual: {{ horasMinimas }} hrs
              </span>
            </div>

            <div class="d-flex align-center justify-space-between text-center ga-2 pt-1">
              <div class="flex-grow-1">
                <div class="text-[11px] text-grey-lighten-2 uppercase font-bold">Jornada Total</div>
                <div class="text-xl sm:text-2xl font-mono font-black text-white">
                  {{ totalHorasJornada }} hrs
                </div>
              </div>
              <div class="text-grey-lighten-2 font-bold">-</div>
              <div class="flex-grow-1">
                <div class="text-[11px] text-grey-lighten-2 uppercase font-bold">Colación</div>
                <div class="text-xl sm:text-2xl font-mono font-black text-amber-300">
                  {{ horasColacionFormateadas }} hrs
                </div>
              </div>
              <div class="text-grey-lighten-2 font-bold">=</div>
              <div class="flex-grow-1 bg-emerald-900/60 py-1 px-2 rounded-xl border border-emerald-500/40">
                <div class="text-[11px] text-emerald-300 uppercase font-black">Efectivas</div>
                <div class="text-xl sm:text-2xl font-mono font-black text-emerald-400">
                  {{ calculoHoras.efectivas }} hrs
                </div>
              </div>
            </div>

            <div v-if="calculoHoras.sobretiempo > 0" class="mt-2.5 text-center text-xs sm:text-sm font-black text-amber-300 bg-amber-950/80 py-1.5 px-3 rounded-lg border border-amber-500/40">
              ⚡ <strong>Sobretiempo Devengado:</strong> +{{ calculoHoras.sobretiempo }} hrs (Facturables: {{ calculoHoras.facturables }} hrs).
            </div>
          </div>

          <!-- Horómetro y Odómetro Término -->
          <div class="row g-3 mb-4">
            <div class="col-6">
              <label class="text-sm font-black text-amber-300 text-uppercase mb-2 d-block tracking-wider">
                ⚙️ Horómetro Término *
              </label>
              <input
                v-model.number="form.horometro_termino"
                type="number"
                step="0.1"
                placeholder="Ej: 3459.0"
                class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-3 text-amber-300 font-mono text-xl sm:text-2xl font-black focus:border-amber-400 focus:outline-none text-center h-16 shadow-inner"
              />
              <span v-if="deltaHorometro !== null" class="text-[11px] text-grey-lighten-1 d-block mt-1 font-mono">
                Δ Motor: {{ deltaHorometro }} hrs
              </span>
            </div>
            <div class="col-6">
              <label class="text-sm font-black text-amber-300 text-uppercase mb-2 d-block tracking-wider">
                🛣️ Odómetro Término
              </label>
              <input
                v-model.number="form.odometro_termino"
                type="number"
                step="1"
                placeholder="Ej: 145020"
                class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-3 text-amber-300 font-mono text-xl sm:text-2xl font-black focus:border-amber-400 focus:outline-none text-center h-16 shadow-inner"
              />
              <span v-if="deltaOdometro !== null" class="text-[11px] text-grey-lighten-1 d-block mt-1 font-mono">
                Δ Distancia: {{ deltaOdometro }} km
              </span>
            </div>
          </div>

          <!-- FOTOGRAFÍA OBLIGATORIA DEL TABLERO AL TÉRMINO -->
          <div class="mb-4 pa-4 rounded-xl border-2 border-slate-700 bg-slate-950/80">
            <div class="d-flex align-center justify-space-between mb-2">
              <label class="text-sm font-black text-amber-300 text-uppercase tracking-wider d-flex align-center ga-1.5">
                <span>📸 Foto Tablero Término (Horómetro/Odómetro)</span>
                <span class="text-red-400 font-bold">*</span>
              </label>
              <span v-if="form.foto_tablero_termino" class="text-xs font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-md border border-emerald-500/40">
                ✅ Foto Cargada
              </span>
              <span v-else class="text-xs font-bold text-amber-400 bg-amber-950/70 px-2.5 py-1 rounded-md border border-amber-500/40">
                ⚠️ Obligatoria
              </span>
            </div>
            <p class="text-xs text-grey-lighten-1 mb-3">
              Captura una fotografía clara del panel del horómetro al finalizar la faena.
            </p>

            <input
              ref="inputFotoTermino"
              type="file"
              accept="image/*"
              capture="environment"
              class="d-none"
              @change="onFotoTerminoSeleccionada"
            />

            <div v-if="form.foto_tablero_termino" class="position-relative space-y-2">
              <div class="rounded-xl overflow-hidden border-2 border-amber-400 bg-black flex items-center justify-center max-h-64 shadow-md">
                <img
                  :src="form.foto_tablero_termino"
                  alt="Foto Tablero Término"
                  class="w-full h-auto max-h-64 object-contain"
                />
              </div>
              <div class="d-flex ga-2 mt-2">
                <v-btn
                  color="amber"
                  variant="flat"
                  size="large"
                  class="flex-grow-1 font-bold text-sm h-12 rounded-xl text-slate-950"
                  @click="inputFotoTermino.click()"
                >
                  📸 Tomar otra foto
                </v-btn>
                <v-btn
                  color="red-lighten-1"
                  variant="outlined"
                  size="large"
                  class="font-bold text-sm h-12 rounded-xl px-4"
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
                size="x-large"
                block
                class="font-black text-base h-14 rounded-xl d-flex align-center ga-2 text-slate-950"
                @click="inputFotoTermino.click()"
              >
                <span class="text-2xl">📸</span>
                <span>Tomar Foto Tablero Término</span>
              </v-btn>
            </div>
          </div>

          <!-- Observaciones / Maniobras -->
          <div class="mb-3">
            <label class="text-sm font-black text-amber-300 text-uppercase mb-2 d-block tracking-wider">
              📝 Maniobras Realizadas (Visibles en Report Mandante)
            </label>
            <textarea
              v-model="form.observacion_trabajo"
              rows="3"
              placeholder="Detalle de izajes, tonelajes, radios o condiciones de faena..."
              class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white text-sm sm:text-base focus:border-amber-400 focus:outline-none min-h-[85px]"
            ></textarea>
          </div>

          <!-- Notas Mecánicas Internas GSP (Confidencial Taller) -->
          <div class="mb-4">
            <label class="text-sm font-black text-slate-400 text-uppercase mb-2 d-block tracking-wider">
              🔒 Notas Mecánicas / Taller GSP (Uso Interno)
            </label>
            <textarea
              v-model="form.notas_mecanicas_gsp"
              rows="2"
              placeholder="Niveles de fluidos, desgaste de aparejos, alertas del computador de abordo..."
              class="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-3 text-slate-300 text-xs sm:text-sm focus:border-slate-500 focus:outline-none"
            ></textarea>
          </div>

          <!-- BOTÓN GIGANTE: PROCEDER A REPORT MANDANTE -->
          <v-btn
            block
            size="x-large"
            color="amber-darken-2"
            class="font-black text-uppercase rounded-2xl text-slate-950 py-5 min-h-[64px] text-base sm:text-lg shadow-xl shadow-amber-500/20 tracking-wider"
            @click="irAReportMandante"
          >
            <span>🏁 Finalizar Jornada ➔ Proceder a Report Mandante ➔</span>
          </v-btn>
        </v-card>
      </div>

      <!-- ========================================================================= -->
      <!-- PASO 3: REPORT DIARIO CONTRACTUAL (CARA AL CLIENTE MANDANTE)             -->
      <!-- ========================================================================= -->
      <div v-show="faseVisual === 3" class="space-y-4">
        <!-- RESUMEN FORMAL DEL SERVICIO (SOLO TIEMPOS COMERCIALES) -->
        <v-card
          class="pa-5 rounded-2xl border-2 border-amber-500/50 text-white"
          style="background: linear-gradient(135deg, #0b1120 0%, #1e1b4b 100%);"
          elevation="4"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-xs font-black text-amber-400 uppercase tracking-widest">
              DOCUMENTO OFICIAL DE LIQUIDACIÓN
            </div>
            <v-chip size="small" color="amber" variant="flat" class="font-black text-xs text-slate-950">
              DÍA {{ diaCorrelativo }}
            </v-chip>
          </div>

          <div class="text-2xl font-black text-white mb-1">
            {{ proyecto.cliente_nombre || 'LeanGlobal Spa' }}
          </div>
          <div class="text-sm text-grey-lighten-2 mb-3">
            OT: <span class="font-mono text-amber-300 font-bold">{{ proyecto.codi_proyecto }}</span> • Faena: {{ proyecto.obra_nombre }}
          </div>

          <!-- CUADRO DE HORAS CERTIFICADAS -->
          <div class="pa-4 rounded-xl bg-black/50 border border-white/20 mb-3">
            <div class="text-xs text-amber-400 font-bold uppercase mb-2">⏱️ Certificación de Tiempos de Servicio</div>
            <div class="row g-2 text-center">
              <div class="col-4">
                <div class="text-xs text-grey-lighten-2">Inicio - Fin</div>
                <div class="text-base font-mono font-bold text-white">{{ form.hora_inicio }} - {{ form.hora_termino }}</div>
              </div>
              <div class="col-4 border-x border-white/20">
                <div class="text-xs text-grey-lighten-2">Colación</div>
                <div class="text-base font-mono font-bold text-amber-300">{{ form.minutos_colacion }} min</div>
              </div>
              <div class="col-4">
                <div class="text-xs text-emerald-300 font-bold">Horas Efectivas</div>
                <div class="text-xl font-mono font-black text-emerald-400">{{ calculoHoras.efectivas }} hrs</div>
              </div>
            </div>
            <div v-if="calculoHoras.sobretiempo > 0" class="mt-2 text-xs font-bold text-yellow-300 text-center">
              (Incluye +{{ calculoHoras.sobretiempo }} hrs de sobretiempo sobre base contractual)
            </div>
          </div>

          <div v-if="form.observacion_trabajo" class="text-xs text-grey-lighten-2 bg-slate-900/60 p-3 rounded-lg border border-white/10">
            <strong class="text-white d-block mb-1">Maniobras Realizadas:</strong>
            {{ form.observacion_trabajo }}
          </div>
        </v-card>

        <!-- FORMULARIO DE CONFORMIDAD Y FIRMA TÁCTIL MANDANTE -->
        <v-card
          class="pa-5 rounded-2xl border-2 border-emerald-500/50 text-white"
          style="background-color: #0b1120;"
          elevation="4"
        >
          <div class="d-flex align-center ga-3 mb-4">
            <span class="text-2xl">✍️</span>
            <div>
              <div class="text-lg sm:text-xl font-black text-emerald-400">Conformidad del Mandante</div>
              <div class="text-xs text-grey-lighten-1">Firma manuscrita del receptor en terreno</div>
            </div>
          </div>

          <div class="mb-3">
            <label class="text-sm font-black text-grey-lighten-1 text-uppercase mb-2 d-block tracking-wider">
              👤 Nombre Supervisor Mandante *
            </label>
            <input
              v-model="form.cliente_nombre"
              type="text"
              placeholder="Nombre y Apellido del supervisor"
              class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white text-base sm:text-lg font-bold focus:border-emerald-400 focus:outline-none h-14"
            />
          </div>

          <div class="row g-3 mb-3">
            <div class="col-6">
              <label class="text-sm font-black text-grey-lighten-1 text-uppercase mb-2 d-block tracking-wider">
                🆔 RUT Mandante *
              </label>
              <input
                v-model="form.cliente_rut"
                type="text"
                placeholder="12.345.678-9"
                class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white text-base sm:text-lg font-bold focus:border-emerald-400 focus:outline-none h-14"
              />
            </div>
            <div class="col-6">
              <label class="text-sm font-black text-grey-lighten-1 text-uppercase mb-2 d-block tracking-wider">
                💼 Cargo en Faena
              </label>
              <input
                v-model="form.cliente_cargo"
                type="text"
                placeholder="Ej: ITO / Jefe de Terreno"
                class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white text-base sm:text-lg font-bold focus:border-emerald-400 focus:outline-none h-14"
              />
            </div>
          </div>

          <!-- SignatureField (Canvas de Firma Táctil) -->
          <SignatureField
            v-model="form.cliente_firma_canvas_base64"
            label="FIRMA MANUSCRITA DEL SUPERVISOR MANDANTE"
          />

          <div class="text-xs text-grey-lighten-2 text-center my-3 bg-slate-900/80 py-2 px-3 rounded-xl border border-white/10">
            🛰️ Al sellar se capturará geoposición GPS inmutable y estampa de tiempo oficial.
          </div>

          <!-- BOTONES DE ACCIÓN: TRANSMITIR O VOLVER A EDITAR -->
          <div class="space-y-2.5 mt-2">
            <v-btn
              block
              size="x-large"
              color="emerald-darken-1"
              class="font-black text-uppercase rounded-2xl text-white py-5 min-h-[64px] text-lg sm:text-xl shadow-xl shadow-emerald-500/20 tracking-wider"
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
              class="font-bold rounded-xl h-12"
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
      <span class="text-base font-bold">{{ snackbar.text }}</span>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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

const proyecto = ref({})
const equipos = ref([])
const personas = ref([])
const reportsPrevios = ref([])
const diaCorrelativo = ref(1)
const horasMinimas = ref(4.0)

const inputFotoInicio = ref(null)
const inputFotoTermino = ref(null)

const form = reactive({
  fecha_reporte: new Date().toISOString().split('T')[0],
  hora_inicio: '08:00',
  hora_termino: '18:00',
  minutos_colacion: 60,
  horometro_inicio: null,
  horometro_termino: null,
  odometro_inicio: null,
  odometro_termino: null,
  foto_tablero_inicio: null,
  foto_tablero_termino: null,
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
  if (rig) return `${rig.name_frst || ''} ${rig.apellido_pat || ''}`.trim()
  return 'Rigger en Faena'
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

const deltaOdometro = computed(() => {
  if (form.odometro_inicio !== null && form.odometro_termino !== null) {
    const diff = form.odometro_termino - form.odometro_inicio
    return diff >= 0 ? diff : 0
  }
  return null
})

// Acciones de cámara para foto inicio
const onFotoInicioSeleccionada = (event) => {
  comprimirYAsignar(event, (b64) => { form.foto_tablero_inicio = b64 })
}

// Acciones de cámara para foto término
const onFotoTerminoSeleccionada = (event) => {
  comprimirYAsignar(event, (b64) => { form.foto_tablero_termino = b64 })
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

const puedeEnviarReport = computed(() => {
  return (
    form.cliente_nombre.trim().length > 2 &&
    form.cliente_firma_canvas_base64 &&
    form.hora_inicio &&
    form.hora_termino &&
    !enviando.value
  )
})

const irAMomento2 = () => {
  if (!form.horometro_inicio) {
    snackbar.text = '⚠️ Completa el horómetro de inicio en Momento 1'
    snackbar.color = 'warning'
    snackbar.show = true
  }
  faseVisual.value = 2
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const irAReportMandante = () => {
  if (!form.foto_tablero_termino && !form.foto_tablero_inicio) {
    snackbar.text = '⚠️ Se recomienda adjuntar la foto del tablero en Control de Flota'
    snackbar.color = 'warning'
    snackbar.show = true
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
      horasMinimas.value = Number(d.horas_minimas) || 4.0

      if (d.id_equipo_seleccionado && !idEquipoSeleccionado.value) {
        idEquipoSeleccionado.value = Number(d.id_equipo_seleccionado)
      } else if (!idEquipoSeleccionado.value && equipos.value.length > 0) {
        idEquipoSeleccionado.value = Number(equipos.value[0].id_equipo)
      }

      // Si hay una jornada activa (iniciada hoy), precargarla y pasar directo a Momento 2
      if (d.jornada_activa) {
        const j = d.jornada_activa
        idReporteAvanceActivo.value = j.id_reporte_avance
        form.horometro_inicio = j.horometro_inicio ? Number(j.horometro_inicio) : null
        form.odometro_inicio = j.odometro_inicio ? Number(j.odometro_inicio) : null
        form.foto_tablero_inicio = j.foto_tablero_inicio || null
        if (j.fecha_inicio_servicio) {
          const t = j.fecha_inicio_servicio.split('T')[1] || ''
          if (t.length >= 5) form.hora_inicio = t.substring(0, 5)
        }
        diaCorrelativo.value = j.dia_correlativo || diaCorrelativo.value
        faseVisual.value = 2 // Pasar directo al Momento 2 (Fin de jornada)
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
      odometro_inicio: form.odometro_inicio,
      foto_tablero_inicio: form.foto_tablero_inicio
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
      odometro_inicio: form.odometro_inicio,
      odometro_termino: form.odometro_termino,
      foto_tablero_inicio: form.foto_tablero_inicio,
      foto_tablero_termino: form.foto_tablero_termino,
      notas_mecanicas_gsp: form.notas_mecanicas_gsp,
      observacion_trabajo: form.observacion_trabajo,
      cliente_nombre: form.cliente_nombre,
      cliente_rut: form.cliente_rut,
      cliente_cargo: form.cliente_cargo,
      cliente_firma_canvas_base64: form.cliente_firma_canvas_base64,
      latitud_inicio_servicio: geo.latitud,
      longitud_inicio_servicio: geo.longitud,
      accuracy_firma: geo.accuracy
    }

    const res = await api.post('/operaciones/report/guardar', payload)
    if (res.data && res.data.success) {
      snackbar.text = `✅ Report Día ${diaCorrelativo.value} sellado y transmitido exitosamente!`
      snackbar.color = 'success'
      snackbar.show = true

      setTimeout(() => {
        router.push({ name: 'Surveys' })
      }, 1500)
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
  router.push({ name: 'Surveys' })
}

onMounted(async () => {
  await cargarContexto()
})
</script>

<style scoped>
input[type="time"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}
</style>
