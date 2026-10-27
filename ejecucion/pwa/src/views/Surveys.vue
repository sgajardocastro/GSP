<template>
  <v-container class="surveys-page pa-3">
    <!-- 🍏 HEADER DE PANTALLA ESTILO APPLE iOS -->
    <div class="px-1 pt-1 pb-3">
      <div class="d-flex align-center justify-space-between mb-1">
        <span class="text-[11px] font-black uppercase tracking-widest text-slate-500">
          CONSOLA DE OPERACIONES EN TERRENO • GSP
        </span>
        <v-chip size="x-small" color="primary" variant="flat" class="font-bold font-mono">
          {{ userDetailStore.userDetail?.codi_user || 'OPERADOR' }}
        </v-chip>
      </div>
      <div class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
        Panel Operativo de Campo
      </div>
    </div>

    <!-- 📊 RESUMEN RÁPIDO DE PENDIENTES (2 BADGES INFORMATIVOS GRANDES) -->
    <v-row dense class="mb-3">
      <v-col cols="6">
        <v-card
          class="pa-3 rounded-xl text-center border cursor-pointer"
          :class="tieneViajeEnCurso ? 'bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'"
          @click="tieneViajeEnCurso ? abrirViajeNativo(viajeActivo.token_viaje) : null"
        >
          <div class="text-xs font-bold uppercase tracking-wider">Viajes</div>
          <div class="text-base font-black mt-0.5">
            {{ tieneViajeEnCurso ? (viajeActivo.estado_trayecto === 'EN_RUTA' ? 'En Ruta' : 'Asignado') : 'Al Día' }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="6">
        <v-card
          class="pa-3 rounded-xl text-center border cursor-pointer"
          :class="reportsPendientes.length > 0 ? 'bg-amber-50 border-amber-400 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300' : 'bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'"
          @click="abrirReportDiario((reportPrincipalPendiente || primerConcluido)?.id_proyecto, (reportPrincipalPendiente || primerConcluido)?.id_equipo, reportPrincipalPendiente?.id_reporte_avance_activo)"
        >
          <div class="text-xs font-bold uppercase tracking-wider">Reports</div>
          <div class="text-base font-black mt-0.5">
            {{ cargandoReportsPendientes && reportsPendientes.length === 0 ? 'Cargando...' : (reportsPendientes.length > 0 ? `${reportsPendientes.length} Pendiente` : 'Al Día') }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ========================================================================= -->
    <!-- 0.5 BANNER DISTINTIVO: ORDEN DE MOVIMIENTO INTERNO GSP (SPEC 87)          -->
    <!-- ========================================================================= -->
    <v-card
      v-if="esViajeInternoActivo"
      class="mb-3 rounded-2xl border-2 border-amber-400 bg-amber-950/90 text-white shadow-md overflow-hidden"
      style="border-style: dashed !important;"
    >
      <div class="pa-3.5">
        <div class="d-flex align-center justify-space-between flex-wrap ga-1 mb-1">
          <span class="text-xs font-black text-amber-300 uppercase tracking-wider font-mono">
            🔁 ORDEN DE MOVIMIENTO INTERNO GSP (NO FACTURABLE)
          </span>
          <v-chip size="x-small" color="amber-accent-3" variant="flat" class="font-bold font-mono text-black">
            {{ viajeActivo?.codi_proyecto || reportPrincipalPendiente?.codi_proyecto || 'INT-GSP' }}
          </v-chip>
        </div>
        <div class="text-xs font-mono font-bold text-white">
          📍 {{ viajeActivo?.sucursal_origen || viajeActivo?.origen_nombre || 'Base Origen GSP' }} ➔ {{ viajeActivo?.sucursal_destino || viajeActivo?.obra_nombre || reportPrincipalPendiente?.obra_nombre || 'Sucursal Destino GSP' }}
        </div>
        <div class="text-[11px] text-amber-200/90 mt-1">
          Traslado de costo propio entre sucursales/taller. No exige firma de cliente externo al arribar a destino.
        </div>
      </div>
    </v-card>

    <!-- ========================================================================= -->
    <!-- 1️⃣ BLOQUE A: REGISTRO DE TRASLADO & VIAJE (SOLO CUANDO ESTÁ EN CURSO)      -->
    <!-- ========================================================================= -->
    <v-card
      v-if="tieneViajeEnCurso"
      class="mb-4 rounded-2xl border bg-white dark:bg-zinc-800 shadow-sm overflow-hidden"
      :class="esViajeInternoActivo ? 'border-amber-400 dark:border-amber-500' : (viajeActivo ? 'border-blue-400 dark:border-blue-600' : 'border-slate-200 dark:border-zinc-700')"
    >
      <div class="h-1 bg-gradient-to-r" :class="esViajeInternoActivo ? 'from-amber-400 to-orange-500' : 'from-blue-500 to-cyan-500'"></div>
      <div class="pa-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center ga-2.5">
            <div
              class="pa-2 rounded-xl d-flex align-center justify-center"
              :class="esViajeInternoActivo ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'"
            >
              <v-icon size="22">mdi-navigation-variant-outline</v-icon>
            </div>
            <div>
              <div class="text-[11px] font-bold uppercase tracking-wider" :class="esViajeInternoActivo ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'">
                {{ esViajeInternoActivo ? '🔁 ORDEN INTERNA GSP · COSTO PROPIO' : (viajeActivo?.tipo_trayecto === 'RETORNO' ? 'Retorno a Base / Patio' : 'Desplazamiento & Traslado') }}
              </div>
              <div class="text-base font-black text-slate-900 dark:text-white leading-tight">
                {{ esViajeInternoActivo ? 'Traslado Interno entre Sucursales / Taller' : (viajeActivo?.tipo_trayecto === 'RETORNO' ? 'Registro de Viaje de Retorno' : 'Registro de Viaje en Ruta') }}
              </div>
            </div>
          </div>

          <v-chip
            size="small"
            :color="esViajeInternoActivo ? 'amber-darken-3' : (viajeActivo ? (viajeActivo.tipo_trayecto === 'RETORNO' ? 'indigo-darken-2' : 'info') : 'grey')"
            variant="flat"
            class="font-bold text-[10px] uppercase text-white"
          >
            {{ viajeActivo ? `${viajeActivo.tipo_trayecto === 'RETORNO' ? 'RETORNO: ' : ''}${viajeActivo.estado_trayecto || 'EN TRAYECTO'}` : 'Sin viaje activo' }}
          </v-chip>
        </div>

        <!-- Cuerpo del Viaje -->
        <div v-if="viajeActivo" class="rounded-xl pa-3 mb-3 border" :class="esViajeInternoActivo ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40'">
          <div class="d-flex align-center justify-space-between text-xs text-slate-700 dark:text-slate-300 mb-1">
            <span class="font-bold">{{ esViajeInternoActivo ? '🔁 Folio Interno' : 'OT' }} {{ viajeActivo.codi_proyecto }}</span>
            <v-chip size="x-small" :color="esViajeInternoActivo ? 'amber-darken-3' : 'primary'" variant="outlined" class="font-mono font-bold">
              {{ viajeActivo.patente }}
            </v-chip>
          </div>
          <div class="text-xs text-slate-600 dark:text-slate-400 truncate">
            📍 {{ esViajeInternoActivo ? `${viajeActivo.sucursal_origen || viajeActivo.origen_nombre || 'Origen GSP'} ➔ ` : 'Destino: ' }}<strong>{{ viajeActivo.tipo_trayecto === 'RETORNO' ? 'Base / Patio GSP' : (viajeActivo.sucursal_destino || viajeActivo.obra_nombre || 'Faena') }}</strong>
            <span v-if="viajeActivo.marca || viajeActivo.modelo" class="ml-1">• {{ [viajeActivo.marca, viajeActivo.modelo].filter(Boolean).join(' ') }}</span>
          </div>
        </div>
        <div v-else class="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Control de trayecto con odómetro inicial/final, horómetros y telemetría GPS para salidas de base y traslados a faena.
        </div>

        <v-btn
          color="info"
          variant="flat"
          size="large"
          class="w-100 font-black text-base text-none rounded-xl py-3.5 elevation-0"
          prepend-icon="mdi-navigation-variant-outline"
          :disabled="!viajeActivo?.token_viaje && !tokenViajePlataformaActivo"
          @click="abrirViajeNativo(viajeActivo?.token_viaje || tokenViajePlataformaActivo)"
        >
          {{
            viajeActivo?.tipo_trayecto === 'RETORNO'
              ? (viajeActivo?.estado_trayecto === 'ASIGNADO'
                  ? 'Iniciar Viaje de Retorno a Patio (Hoja de Ruta) ➔'
                  : 'Registrar Llegada a Patio (Cierre) ➔')
              : (viajeActivo?.estado_trayecto === 'ASIGNADO'
                  ? 'Iniciar Viaje de Traslado (Hoja de Ruta) ➔'
                  : viajeActivo?.estado_trayecto === 'EN_RUTA'
                    ? 'Registrar Llegada a Obra (Hoja de Ruta) ➔'
                    : (viajeActivo || tokenViajePlataformaActivo)
                      ? 'Abrir Hoja de Ruta de Viaje ➔'
                      : 'Sin Viaje Activo Asignado')
          }}
        </v-btn>
      </div>
    </v-card>

    <!-- ========================================================================= -->
    <!-- 1.5 BLOQUE BSM: PLATAFORMAS — ACTA ENTREGA 360° Y ACTA RETIRO 360°        -->
    <!-- ========================================================================= -->
    <v-card
      v-if="tienePlataformaAsignada"
      class="mb-4 rounded-2xl border border-teal-400 dark:border-teal-600 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden"
    >
      <div class="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"></div>
      <div class="pa-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center ga-2.5">
            <div class="pa-2 rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 d-flex align-center justify-center">
              <v-icon size="22">mdi-elevator-passenger-outline</v-icon>
            </div>
            <div>
              <div class="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Bestmaq (BSM) • Royal Rental • Arriendo Sin Operador
              </div>
              <div class="text-base font-black text-slate-900 dark:text-white leading-tight">
                Acta de Entrega y Retiro de Plataformas 360°
              </div>
            </div>
          </div>
          <v-chip
            size="small"
            :color="estadoPlataformaBsm.retiroSellado ? 'success' : (estadoPlataformaBsm.entregaSellada ? 'amber-darken-2' : (viajeIdaPlataformaCompletado ? 'teal-darken-2' : 'warning'))"
            variant="flat"
            class="font-bold text-[10px] text-white"
          >
            {{
              estadoPlataformaBsm.retiroSellado
                ? 'RETIRO SELLADO'
                : estadoPlataformaBsm.entregaSellada
                  ? 'ENTREGA SELLADA'
                  : viajeIdaPlataformaCompletado
                    ? 'LISTO PARA ENTREGA'
                    : 'PENDIENTE VIAJE IDA'
            }}
          </v-chip>
        </div>

        <!-- Resumen del Viaje de Traslado de Plataforma y Candado Operativo -->
        <div
          v-if="viajeProyectoBsm || formBsm.equipo_codigo"
          class="rounded-xl pa-3 mb-3 border text-xs"
          :class="viajeIdaPlataformaCompletado ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-slate-700 dark:text-slate-200' : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 text-slate-800 dark:text-slate-200'"
        >
          <div class="d-flex align-center justify-space-between flex-wrap ga-1 mb-1">
            <span class="font-bold">
              Plataforma: {{ formBsm.equipo_codigo || 'Asignada' }} ({{ formBsm.equipo_modelo || 'BSM' }})
            </span>
            <v-chip size="x-small" :color="viajeIdaPlataformaCompletado ? 'success' : 'warning'" variant="flat" class="font-bold">
              Viaje Camión {{ viajeProyectoBsm?.patente || viajeActivo?.patente || '' }}: {{ viajeProyectoBsm?.estado_trayecto || (viajeIdaPlataformaCompletado ? 'ARRIBADO' : 'ASIGNADO') }}
            </v-chip>
          </div>
          <div v-if="!viajeIdaPlataformaCompletado" class="font-bold text-amber-900 dark:text-amber-300 mt-1">
            🔒 Candado Operativo: Debe registrar primero la llegada del camión en la Hoja de Ruta superior (Salida de Base y Llegada a Obra) antes de abrir el Acta de Entrega 360°.
          </div>
          <div v-else class="text-emerald-800 dark:text-emerald-300 font-medium mt-1">
            ✅ Viaje de traslado arribado a obra. Acta de Entrega 360° desbloqueada.
          </div>
        </div>

        <div class="text-xs text-slate-600 dark:text-slate-400 mb-3">
          Inspección 360° en obra (19 ítems oficiales, 4 fotografías 360° y firma manual del cliente) para la <strong>Entrega (Columna ENTREGA)</strong> y el <strong>Retiro / Recuperación (Columna RECEPCIÓN)</strong>.
        </div>

        <div class="d-flex ga-2 flex-wrap">
          <v-btn
            :color="estadoPlataformaBsm.entregaSellada ? 'teal-darken-3' : 'teal-darken-1'"
            variant="flat"
            class="flex-1 font-bold text-none rounded-xl py-2.5 text-white"
            :prepend-icon="estadoPlataformaBsm.entregaSellada ? 'mdi-file-pdf-box' : 'mdi-clipboard-check-outline'"
            :disabled="!viajeIdaPlataformaCompletado"
            @click="estadoPlataformaBsm.entregaSellada && urlPdfEntregaBsm ? verPdfActa(urlPdfEntregaBsm) : abrirModalPlataformaBsm('ENTREGA')"
          >
            {{
              estadoPlataformaBsm.entregaSellada
                ? '✓ 1. Ver Acta Entrega (PDF)'
                : (viajeIdaPlataformaCompletado ? '1. Acta Entrega 360° ➔' : '🔒 1. Acta Entrega 360° (Requiere Viaje)')
            }}
          </v-btn>
          <v-btn
            :color="estadoPlataformaBsm.retiroSellado ? 'deep-purple-darken-3' : 'deep-purple-darken-1'"
            variant="flat"
            class="flex-1 font-bold text-none rounded-xl py-2.5 text-white"
            :prepend-icon="estadoPlataformaBsm.retiroSellado ? 'mdi-file-pdf-box' : 'mdi-lock-check-outline'"
            :disabled="!estadoPlataformaBsm.entregaSellada"
            @click="estadoPlataformaBsm.retiroSellado && urlPdfFinalBsm ? verPdfActa(urlPdfFinalBsm) : abrirModalPlataformaBsm('RETIRO')"
          >
            {{
              estadoPlataformaBsm.retiroSellado
                ? '✓ 2. Ver Acta Retiro (PDF)'
                : (estadoPlataformaBsm.entregaSellada ? '2. Acta Retiro 360° ➔' : '🔒 2. Acta Retiro (Requiere Entrega)')
            }}
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- ========================================================================= -->
    <!-- 2️⃣ BLOQUE B: REPORTS DIARIOS DE IZAJE (SIEMPRE VISIBLE)                    -->
    <!-- ========================================================================= -->
    <v-card
      class="mb-4 rounded-2xl border bg-white dark:bg-zinc-800 shadow-sm overflow-hidden"
      :class="reportsPendientes.length > 0 ? 'border-amber-400 dark:border-amber-600' : 'border-emerald-300 dark:border-emerald-700'"
    >
      <div class="h-1 bg-gradient-to-r" :class="reportsPendientes.length > 0 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'"></div>
      <div class="pa-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center ga-2.5">
            <div
              class="pa-2 rounded-xl d-flex align-center justify-center"
              :class="reportsPendientes.length > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'"
            >
              <v-icon size="22">mdi-file-document-edit-outline</v-icon>
            </div>
            <div>
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Operación en Faena
              </div>
              <div class="text-base font-black text-slate-900 dark:text-white leading-tight">
                Report Diario de Izaje
              </div>
            </div>
          </div>

          <div class="d-flex align-center ga-1">
            <v-btn
              icon="mdi-refresh"
              size="x-small"
              variant="text"
              :loading="cargandoReportsPendientes"
              title="Actualizar órdenes asignadas"
              @click.stop="refrescarOperacionTerreno"
            />
            <v-chip
              size="small"
              :color="cargandoReportsPendientes && reportsPendientes.length === 0 ? 'info' : (reportsPendientes.length > 0 ? 'warning' : 'success')"
              variant="flat"
              class="font-bold text-[10px] uppercase"
            >
              {{ cargandoReportsPendientes && reportsPendientes.length === 0 ? 'CARGANDO...' : (reportsPendientes.length > 0 ? `${reportsPendientes.length} PENDIENTE` : 'AL DÍA') }}
            </v-chip>
          </div>
        </div>

        <!-- Cuerpo del Report -->
        <div v-if="cargandoReportsPendientes && !reportPrincipalPendiente && !primerConcluido" class="bg-slate-50 dark:bg-zinc-900/60 rounded-xl pa-3 mb-3 border border-slate-200 dark:border-zinc-700 d-flex align-center ga-3">
          <v-progress-circular indeterminate size="20" width="2" color="warning" />
          <div class="text-xs font-bold text-slate-600 dark:text-slate-300">
            Sincronizando orden de trabajo y estado de jornada...
          </div>
        </div>
        <div v-else-if="reportPrincipalPendiente" class="bg-amber-50/60 dark:bg-amber-950/30 rounded-xl pa-3 mb-3 border border-amber-100 dark:border-amber-900/40">
          <div class="d-flex align-center justify-space-between text-xs text-slate-800 dark:text-slate-200 mb-1">
            <span class="font-bold">OT {{ reportPrincipalPendiente.codi_proyecto }} • Día {{ reportPrincipalPendiente.dia_a_reportar }}</span>
            <v-chip size="x-small" color="warning" variant="outlined" class="font-mono font-bold">
              {{ reportPrincipalPendiente.patente }}
            </v-chip>
          </div>
          <div class="text-xs text-slate-600 dark:text-slate-400 truncate">
            Faena: <strong>{{ reportPrincipalPendiente.obra_nombre }}</strong>
          </div>
          <div class="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-semibold">
            {{ reportPrincipalPendiente.jornada_en_curso ? '⏳ Jornada iniciada. Registra horómetro final y firma supervisor.' : '⏱️ Listo para iniciar jornada de izaje.' }}
          </div>
        </div>
        <div v-else-if="primerConcluido" class="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl pa-3 mb-3 border border-emerald-200 dark:border-emerald-900/40">
          <div class="d-flex align-center justify-space-between text-xs text-slate-800 dark:text-slate-200 mb-1">
            <span class="font-bold">OT {{ primerConcluido.codi_proyecto }} • Reportes: {{ primerConcluido.dias_reportados }}/{{ primerConcluido.total_dias }}</span>
            <v-chip size="x-small" color="success" variant="outlined" class="font-mono font-bold">
              {{ primerConcluido.patente }}
            </v-chip>
          </div>
          <div class="text-xs text-slate-600 dark:text-slate-400 truncate">
            Faena: <strong>{{ primerConcluido.obra_nombre }}</strong>
          </div>
          <div class="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
            ✅ {{ primerConcluido.mensaje || 'Jornada del día reportada conforme.' }}
          </div>
        </div>
        <div v-else class="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Registro diario de horas máquina efectivas, esperas operacionales y sellado con firma digital FES junto al supervisor mandante.
        </div>

        <v-btn
          :color="reportsPendientes.length > 0 ? 'warning' : 'success'"
          variant="flat"
          size="large"
          class="w-100 font-black text-base text-none rounded-xl py-3.5 elevation-0"
          :class="reportsPendientes.length > 0 ? 'text-black' : 'text-white'"
          prepend-icon="mdi-file-document-edit-outline"
          :loading="cargandoReportsPendientes && !reportPrincipalPendiente && !primerConcluido"
          @click="abrirReportDiario((reportPrincipalPendiente || primerConcluido)?.id_proyecto, (reportPrincipalPendiente || primerConcluido)?.id_equipo, reportPrincipalPendiente?.id_reporte_avance_activo)"
        >
          {{ reportsPendientes.length > 0 ? `Completar y Firmar Report Día ${reportPrincipalPendiente.dia_a_reportar} ➔` : (primerConcluido ? `Ver Orden OT ${primerConcluido.codi_proyecto} ➔` : 'Abrir / Ver Historial de Reports ➔') }}
        </v-btn>
      </div>
    </v-card>

    <!-- ========================================================================= -->
    <!-- 4️⃣ BLOQUE D: INSPECCIONES TÉCNICAS & SEGURIDAD EN TERRENO                 -->
    <!-- ========================================================================= -->
    <div class="mb-4">
      <div class="d-flex align-center justify-space-between px-1 mb-2">
        <span class="text-xs font-black text-slate-500 uppercase tracking-wider">
          Inspecciones Técnicas & Seguridad
        </span>
        <span class="text-[11px] text-slate-400 font-medium">Protocolos de Faena</span>
      </div>

      <!-- Tarjeta 1: AST -->
      <v-card class="mb-3 rounded-2xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 pa-3.5 shadow-sm">
        <div class="d-flex align-center justify-space-between mb-1.5">
          <div class="d-flex align-center ga-2">
            <div class="pa-1.5 rounded-lg bg-emerald-600 text-white d-flex align-center justify-center">
              <v-icon size="18">mdi-shield-check-outline</v-icon>
            </div>
            <div class="text-sm font-black text-slate-900 dark:text-white">
              AST — Charla de Seguridad de 5 Minutos
            </div>
          </div>
          <v-chip size="x-small" color="success" variant="flat" class="font-bold text-[9px]">
            SEGURIDAD
          </v-chip>
        </div>
        <div class="text-xs text-slate-600 dark:text-slate-400 mb-2">
          Análisis de Seguridad en el Trabajo y matriz de riesgos críticos antes de operar en terreno.
        </div>
        <v-btn
          color="success"
          variant="tonal"
          size="large"
          class="font-black text-sm text-none rounded-xl w-100 py-3"
          @click="abrirModalRegistrarProtocolo"
        >
          Iniciar AST de Terreno ➔
        </v-btn>
      </v-card>

      <!-- Tarjeta 2: Plan de Izaje -->
      <v-card class="mb-3 rounded-2xl border border-indigo-300 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 pa-3.5 shadow-sm">
        <div class="d-flex align-center justify-space-between mb-1.5">
          <div class="d-flex align-center ga-2">
            <div class="pa-1.5 rounded-lg bg-indigo-600 text-white d-flex align-center justify-center">
              <v-icon size="18">mdi-ruler-square</v-icon>
            </div>
            <div class="text-sm font-black text-slate-900 dark:text-white">
              Plan de Izaje & Rigging
            </div>
          </div>
          <v-chip
            size="x-small"
            :color="urlPdfPlanIzaje ? 'success' : 'indigo'"
            variant="flat"
            class="font-bold text-[9px] text-white"
          >
            {{ urlPdfPlanIzaje ? 'FIRMADO FES' : 'INGENIERÍA' }}
          </v-chip>
        </div>
        <div class="text-xs text-slate-600 dark:text-slate-400 mb-2">
          Configuración técnica de pluma telescópica, radios de trabajo, contrapesos y tablas de carga.
        </div>
        <div class="d-flex flex-column ga-2">
          <v-btn
            color="indigo"
            variant="tonal"
            size="large"
            class="font-black text-sm text-none rounded-xl w-100 py-3"
            @click="abrirModalPlanIzaje"
          >
            {{ urlPdfPlanIzaje ? 'Actualizar / Ver Plan de Izaje ➔' : 'Registrar / Ver Plan de Izaje ➔' }}
          </v-btn>
          <v-btn
            v-if="urlPdfPlanIzaje"
            color="deep-purple-darken-2"
            variant="flat"
            size="large"
            prepend-icon="mdi-file-pdf-box"
            class="font-black text-sm text-none rounded-xl w-100 py-3 text-white"
            @click="verPdfActa(urlPdfPlanIzaje)"
          >
            Ver PDF Plan de Izaje Oficial (A4 + Croquis SVG)
          </v-btn>
        </div>
      </v-card>
    </div>

    <!-- 🚧 MODAL DE INSPECCIÓN DE PATIO -->
    <v-dialog v-model="dialogPatio" max-width="540">
      <v-card class="bg-[#0f172a] text-white border border-slate-700 rounded-xl">
        <v-card-title class="d-flex align-center ga-2 text-subtitle-1 font-weight-black text-amber-400 border-b border-slate-800 pa-4">
          <v-icon color="amber-darken-2" size="24">mdi-boom-gate-up-outline</v-icon>
          <span>Inspección de Entrada / Salida de Patio</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12" class="mb-2">
              <label class="text-xs font-bold text-slate-300 d-block mb-1">Tipo de Movimiento</label>
              <div class="d-flex ga-2">
                <v-btn
                  class="flex-1 font-black text-xs py-3 rounded-lg"
                  :color="formPatio.tipo_movimiento === 'ENTRADA' ? 'emerald-darken-2' : 'grey-darken-4'"
                  :variant="formPatio.tipo_movimiento === 'ENTRADA' ? 'flat' : 'outlined'"
                  @click="formPatio.tipo_movimiento = 'ENTRADA'"
                >
                  🟢 ENTRADA A PATIO
                </v-btn>
                <v-btn
                  class="flex-1 font-black text-xs py-3 rounded-lg"
                  :color="formPatio.tipo_movimiento === 'SALIDA' ? 'amber-darken-2' : 'grey-darken-4'"
                  :variant="formPatio.tipo_movimiento === 'SALIDA' ? 'flat' : 'outlined'"
                  @click="formPatio.tipo_movimiento = 'SALIDA'"
                >
                  🔴 SALIDA A FAENA
                </v-btn>
              </div>
            </v-col>

            <v-col cols="12" class="mb-1">
              <v-autocomplete
                v-model="formPatio.equipoSeleccionado"
                :items="equiposPatio"
                item-title="display_label"
                return-object
                label="Buscar Equipo o Patente (ej: 1070, LTM, Patente)"
                placeholder="Escriba para buscar..."
                variant="outlined"
                density="comfortable"
                :loading="cargandoEquiposPatio"
                clearable
                hide-details="auto"
                prepend-inner-icon="mdi-truck-cargo-container"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="`${item.raw.tipo_equipo || 'Equipo'} • ${item.raw.marca || ''}`">
                    <template #prepend>
                      <v-chip size="x-small" color="amber" class="mr-2 font-mono font-bold">{{ item.raw.patente }}</v-chip>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="12" class="mt-2">
              <v-textarea
                v-model="formPatio.observaciones"
                label="Observación o novedad de portón (opcional)"
                variant="outlined"
                density="compact"
                rows="2"
                hide-details
              />
            </v-col>

            <v-col cols="12" v-if="errorIniciandoPatio">
              <v-alert type="error" density="compact" variant="tonal" class="mt-2 text-xs">
                {{ errorIniciandoPatio }}
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4 border-t border-slate-800 justify-end ga-2">
          <v-btn variant="text" color="slate-400" @click="dialogPatio = false">
            Cancelar
          </v-btn>
          <v-btn
            color="amber-darken-2"
            variant="flat"
            class="font-black text-black"
            :loading="iniciandoPatio"
            :disabled="!formPatio.equipoSeleccionado"
            @click="iniciarChecklistPatio"
          >
            🚀 Iniciar Checklist
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ========================================================================= -->
    <!-- MODAL BSM: ENTREGA 360°, RETIRO Y RETORNO ASÍNCRONO DE PLATAFORMAS (81)   -->
    <!-- ========================================================================= -->
    <v-dialog v-model="dialogPlataformaBsm" max-width="680" scrollable content-class="modal-acta-bsm-dialog">
      <v-card
        class="modal-acta-bsm-opaque rounded-2xl"
        style="background-color: #0b1120 !important; color: #f8fafc !important; border: 1px solid rgba(20, 184, 166, 0.45) !important; opacity: 1 !important;"
      >
        <v-card-title
          class="d-flex align-center justify-space-between pa-4"
          style="background-color: #060a14 !important; border-bottom: 1px solid #1e293b !important;"
        >
          <div class="d-flex align-center ga-2">
            <v-icon color="teal-accent-3" size="24">mdi-elevator-passenger-outline</v-icon>
            <div>
              <div class="text-xs font-black text-teal-400 uppercase tracking-wider">
                BESTMAQ (BSM) • ROYAL RENTAL • SPEC-081
              </div>
              <div class="text-subtitle-2 font-weight-black text-white">
                Acta de Entrega y Recepción de Maquinaria 360°
              </div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="dialogPlataformaBsm = false" />
        </v-card-title>

        <!-- SELECTOR DE MODO: 1. ACTA ENTREGA 360° vs 2. ACTA RETIRO 360° -->
        <div class="px-4 pt-3 pb-2" style="background-color: #0b1120 !important; border-bottom: 1px solid #1e293b !important;">
          <div class="d-flex ga-2 mb-2">
            <v-btn
              class="flex-1 font-black text-xs py-2.5 rounded-xl text-none"
              :color="modoPlataformaBsm === 'ENTREGA' ? 'teal-darken-1' : 'grey-darken-4'"
              :variant="modoPlataformaBsm === 'ENTREGA' ? 'flat' : 'outlined'"
              @click="cambiarModoPlataformaBsm('ENTREGA')"
            >
              1. Acta de Entrega 360° (Obra)
            </v-btn>
            <v-btn
              class="flex-1 font-black text-xs py-2.5 rounded-xl text-none"
              :color="modoPlataformaBsm === 'RETIRO' ? 'deep-purple-accent-3' : 'grey-darken-4'"
              :variant="modoPlataformaBsm === 'RETIRO' ? 'flat' : 'outlined'"
              :disabled="!estadoPlataformaBsm.entregaSellada"
              @click="cambiarModoPlataformaBsm('RETIRO')"
            >
              2. Acta de Retiro 360° (Obra)
            </v-btn>
          </div>
        </div>

        <v-card-text class="pa-4 space-y-4" style="max-height: 76vh; overflow-y: auto; background-color: #0b1120 !important;">
          <!-- CABECERA OFICIAL: DATOS REALES DEL SERVICIO / OT (SOLO N° CONTRATO MANUAL) -->
          <div
            class="pa-3 rounded-xl"
            style="background-color: #111827 !important; border: 1px solid #334155 !important;"
          >
            <div class="d-flex align-center justify-space-between mb-2 flex-wrap ga-2">
              <span class="text-xs font-black text-teal-300 uppercase tracking-wider">
                Cabecera Oficial • Datos Reales del Servicio
              </span>
              <v-chip size="x-small" color="teal" variant="flat" class="font-mono font-bold text-white">
                {{ formBsm.numero_contrato ? `Contrato: ${formBsm.numero_contrato}` : 'Ingrese N° Contrato' }}
              </v-chip>
            </div>

            <!-- Selector de Servicio / OT Real si existen múltiples proyectos activos -->
            <div v-if="proyectosPlataformaDisponibles.length > 0" class="mb-3">
              <v-select
                v-model="idProyectoBsmSeleccionado"
                :items="proyectosPlataformaDisponibles"
                item-title="label"
                item-value="id_proyecto"
                label="Servicio / OT Asignada (Datos Reales)"
                variant="outlined"
                density="compact"
                hide-details
                bg-color="#060a14"
                @update:model-value="onSeleccionarProyectoBsm"
              />
            </div>

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="formBsm.arrendatario || 'Sin cliente asignado'"
                  label="Arrendatario / Cliente (Dato Real OT)"
                  variant="outlined"
                  density="compact"
                  readonly
                  hide-details
                  bg-color="#060a14"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="6" sm="3">
                <v-text-field
                  :model-value="formBsm.rut_arrendatario || 'S/I'"
                  label="RUT Cliente (Real)"
                  variant="outlined"
                  density="compact"
                  readonly
                  hide-details
                  bg-color="#060a14"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="6" sm="3">
                <v-text-field
                  v-model="formBsm.numero_contrato"
                  label="N° Contrato (Manual) *"
                  placeholder="Ej: CTR-2026-001"
                  persistent-placeholder
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#0f2926"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="formBsm.direccion_obra || 'Sin dirección registrada'"
                  label="Obra / Dirección de Entrega (Real)"
                  variant="outlined"
                  density="compact"
                  readonly
                  hide-details
                  bg-color="#060a14"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="6" sm="3">
                <v-text-field
                  :model-value="formBsm.equipo_modelo || 'Plataforma según OT'"
                  label="Equipo / Modelo (Real)"
                  variant="outlined"
                  density="compact"
                  readonly
                  hide-details
                  bg-color="#060a14"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="6" sm="3">
                <v-text-field
                  :model-value="formBsm.equipo_codigo || 'Según asignación'"
                  label="Cód. Interno / Patente (Real)"
                  variant="outlined"
                  density="compact"
                  readonly
                  hide-details
                  bg-color="#060a14"
                  class="mb-2"
                />
              </v-col>
            </v-row>
          </div>

          <!-- ================================================================= -->
          <!-- MODO 1: ACTA DE ENTREGA 360° EN OBRA (COLUMNA ENTREGA)            -->
          <!-- ================================================================= -->
          <template v-if="modoPlataformaBsm === 'ENTREGA'">
            <!-- CANDADO SI NO SE HA COMPLETADO EL VIAJE DE TRASLADO A OBRA -->
            <div
              v-if="!viajeIdaPlataformaCompletado"
              class="pa-4 rounded-xl mb-3"
              style="background-color: #2a1215 !important; border: 1px solid #ef4444 !important;"
            >
              <div class="text-xs font-black text-red-300 uppercase mb-1">
                🔒 Candado Operativo: Viaje de Traslado Pendiente
              </div>
              <div class="text-xs text-slate-200 mb-3">
                No puede realizar ni sellar el Acta de Entrega 360° sin haber registrado antes el <strong>Viaje de Traslado (Salida de Base y Llegada a Faena)</strong> en la Hoja de Ruta del camión asignado.
              </div>
              <v-btn
                v-if="tokenViajePlataformaActivo"
                color="info"
                variant="flat"
                class="w-100 font-black text-none rounded-xl py-2.5 text-white"
                prepend-icon="mdi-truck-fast-outline"
                @click="abrirViajeNativo(tokenViajePlataformaActivo)"
              >
                Ir a la Hoja de Ruta para Realizar el Viaje de Traslado ➔
              </v-btn>
            </div>

            <div
              class="pa-3 rounded-xl"
              style="background-color: #111827 !important; border: 1px solid rgba(20, 184, 166, 0.45) !important;"
              :style="!viajeIdaPlataformaCompletado ? 'opacity: 0.45; pointer-events: none;' : ''"
            >
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-xs font-black text-teal-300 uppercase tracking-wider">
                  Registro de Entrega de Plataforma en Obra (Columna ENTREGA)
                </span>
                <v-chip size="x-small" :color="estadoPlataformaBsm.entregaSellada ? 'success' : (viajeIdaPlataformaCompletado ? 'warning' : 'error')" variant="flat" class="font-bold text-black">
                  {{ estadoPlataformaBsm.entregaSellada ? 'ACTA SELLADA' : (viajeIdaPlataformaCompletado ? 'REQUERIDO' : 'BLOQUEADO POR VIAJE') }}
                </v-chip>
              </div>

              <!-- HOROM. IN Y NIVEL DE PETRÓLEO / BATERÍA -->
              <v-row dense class="mb-2">
                <v-col cols="6">
                  <v-text-field
                    v-model="formBsm.horometro_in"
                    type="number"
                    step="0.1"
                    label="HOROM. IN (Horómetro Entrada) *"
                    variant="outlined"
                    density="compact"
                    hide-details
                    bg-color="#060a14"
                  />
                </v-col>
                <v-col cols="6">
                  <v-select
                    v-model="formBsm.combustible_in"
                    :items="opcionesCombustibleBsm"
                    label="Estanque Petróleo / Batería IN (%) *"
                    variant="outlined"
                    density="compact"
                    hide-details
                    bg-color="#060a14"
                  />
                </v-col>
              </v-row>

              <!-- 19 ÍTEMS OFICIALES DEL ACTA BSM (COLUMNA ENTREGA) -->
              <div class="d-flex align-center justify-space-between mb-1.5">
                <span class="text-[11px] font-bold text-white">
                  19 Ítems Oficiales BSM / Royal Rental (Columna ENTREGA)
                </span>
                <v-btn size="x-small" color="teal" variant="flat" class="text-none font-bold text-white" @click="marcarTodosItemsBsm('ENTREGA', 'SI')">
                  ✓ Marcar Todos [SI]
                </v-btn>
              </div>

              <div
                class="rounded-lg mb-3"
                style="background-color: #060a14 !important; border: 1px solid #334155 !important;"
              >
                <div
                  v-for="(item, idx) in itemsChecklistBsm"
                  :key="`ent-${idx}`"
                  class="px-2.5 py-1.5 d-flex align-center justify-space-between ga-2"
                  style="border-bottom: 1px solid #1e293b !important;"
                >
                  <div class="text-xs font-medium text-white flex-1">
                    <span class="text-slate-400 font-mono mr-1">{{ idx + 1 }}.</span>{{ item.nombre }}
                  </div>
                  <div class="d-flex ga-1">
                    <v-btn
                      v-for="val in ['SI', 'NO', 'NA']"
                      :key="val"
                      size="x-small"
                      :color="item.entrega === val ? (val === 'SI' ? 'success' : (val === 'NO' ? 'error' : 'grey')) : 'grey-darken-3'"
                      :variant="item.entrega === val ? 'flat' : 'outlined'"
                      class="font-bold px-2"
                      style="min-width: 34px;"
                      @click="item.entrega = val"
                    >
                      {{ val }}
                    </v-btn>
                  </div>
                </div>
              </div>

              <!-- EVIDENCIA FOTOGRÁFICA 360° DE ENTREGA (MÍNIMO 6 + ADICIONALES) -->
              <div class="mb-3">
                <div class="mb-1.5">
                  <span class="text-[11px] font-bold text-teal-300 uppercase">
                    📸 Evidencia Fotográfica 360° (6 base obligatorias + {{ fotosAdicionalesEntrega.length }} extras • Total: {{ conteoFotosEntregaBsm }}) *
                  </span>
                </div>
                <v-row dense>
                  <v-col cols="6" sm="4" md="2" v-for="(slot, sIdx) in slotsFotos360" :key="`foto-ent-${sIdx}`">
                    <div
                      class="pa-2 rounded-lg text-center"
                      :style="formBsm.fotos_entrega[slot.key] ? 'background-color: #062c22 !important; border: 1px solid #10b981 !important;' : 'background-color: #060a14 !important; border: 1px solid #334155 !important;'"
                    >
                      <div class="text-[10px] font-bold text-white truncate mb-1">{{ slot.label }}</div>
                      <img v-if="formBsm.fotos_entrega[slot.key]" :src="formBsm.fotos_entrega[slot.key]" class="w-100 rounded mb-1" style="height: 56px; object-fit: cover;" />
                      <v-btn
                        size="x-small"
                        :color="formBsm.fotos_entrega[slot.key] ? 'success' : 'teal-darken-1'"
                        variant="flat"
                        class="w-100 text-none font-bold text-[10px] text-white"
                        @click="seleccionarFoto360('ENTREGA', slot.key)"
                      >
                        {{ formBsm.fotos_entrega[slot.key] ? '✓ Tomada' : '📷 Capturar' }}
                      </v-btn>
                    </div>
                  </v-col>

                  <!-- Fotos Adicionales Dinámicas -->
                  <v-col cols="6" sm="4" md="2" v-for="(extra, xIdx) in fotosAdicionalesEntrega" :key="`foto-ent-extra-${xIdx}`">
                    <div
                      class="pa-2 rounded-lg text-center"
                      style="background-color: #062c22 !important; border: 1px solid #10b981 !important;"
                    >
                      <div class="d-flex align-center justify-space-between text-[10px] font-bold text-white truncate mb-1">
                        <span class="truncate">{{ extra.label || `Extra ${xIdx + 1}` }}</span>
                        <v-btn icon="mdi-close" size="18" density="compact" variant="text" color="red-lighten-2" @click="eliminarFotoAdicional('ENTREGA', xIdx)" />
                      </div>
                      <img :src="extra.data" class="w-100 rounded mb-1" style="height: 56px; object-fit: cover;" />
                      <div class="text-[9px] text-emerald-300 font-bold">✓ Adjunta</div>
                    </div>
                  </v-col>

                  <!-- Tarjeta Directa en Grilla para Agregar Más Fotos -->
                  <v-col cols="6" sm="4" md="2">
                    <div
                      class="pa-2 rounded-lg text-center d-flex flex-column align-center justify-center cursor-pointer h-100"
                      style="background-color: #060a14 !important; border: 1px dashed #14b8a6 !important; min-height: 92px;"
                      @click="agregarFotoAdicional('ENTREGA')"
                    >
                      <v-icon color="teal-accent-4" size="22" class="mb-1">mdi-camera-plus-outline</v-icon>
                      <div class="text-[10px] font-bold text-teal-300">+ Agregar Otra Foto</div>
                    </div>
                  </v-col>
                </v-row>
              </div>

              <v-textarea
                v-model="formBsm.observaciones_entrega"
                label="Observaciones / Estado de Entrega en Obra"
                variant="outlined"
                density="compact"
                rows="2"
                hide-details
                bg-color="#060a14"
                class="mb-3"
              />

              <!-- FIRMA MANUAL DEL CLIENTE (RECIBIDO POR: NOMBRE, RUT Y CARGO) -->
              <div
                class="pa-3 rounded-xl"
                style="background-color: #060a14 !important; border: 1px solid rgba(20, 184, 166, 0.35) !important;"
              >
                <div class="text-xs font-black text-teal-300 uppercase mb-2">
                  ✍️ Recepción Conforme del Cliente (Recibido por: Nombre, RUT, Cargo y Firma Manual) *
                </div>
                <v-row dense>
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model="formBsm.receptor_entrega_nombre"
                      label="Nombre Completo Cliente *"
                      variant="outlined"
                      density="compact"
                      hide-details
                      bg-color="#111827"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="6" sm="4">
                    <v-text-field
                      v-model="formBsm.receptor_entrega_rut"
                      label="RUT Receptor *"
                      variant="outlined"
                      density="compact"
                      hide-details
                      bg-color="#111827"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="6" sm="4">
                    <v-text-field
                      v-model="formBsm.receptor_entrega_cargo"
                      label="Cargo en Obra *"
                      variant="outlined"
                      density="compact"
                      hide-details
                      bg-color="#111827"
                      class="mb-2"
                    />
                  </v-col>
                </v-row>

                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="text-[11px] text-white">Dibuje la firma manual del cliente en la pantalla:</span>
                  <div class="d-flex ga-2">
                    <v-btn size="x-small" variant="text" color="error" class="text-none font-bold" @click="limpiarCanvasFirma('ENTREGA')">
                      Limpiar Firma
                    </v-btn>
                  </div>
                </div>
                <div class="bg-white rounded-lg overflow-hidden" style="border: 1px solid #475569;">
                  <canvas
                    ref="canvasEntregaRef"
                    width="560"
                    height="120"
                    style="width: 100%; height: 110px; touch-action: none; cursor: crosshair; display: block; background-color: #ffffff;"
                    @pointerdown="iniciarTrazoCanvas($event, 'ENTREGA')"
                    @pointermove="dibujarTrazoCanvas($event, 'ENTREGA')"
                    @pointerup="finalizarTrazoCanvas('ENTREGA')"
                  ></canvas>
                </div>
              </div>

              <!-- PIN de Firma Electrónica Simple (FES) Conductor / Operador -->
              <div
                class="rounded-xl p-3 my-3"
                style="background-color: #060a14 !important; border: 1px solid rgba(20, 184, 166, 0.4) !important;"
              >
                <label class="block text-xs font-bold text-teal-300 mb-1">
                  PIN del Conductor / Operador (4 Dígitos) *
                </label>
                <input
                  type="password"
                  maxlength="4"
                  v-model="formBsm.pin_entrega"
                  placeholder="••••"
                  class="w-full bg-[#050810] border border-teal-500/40 rounded-xl px-3 py-3 text-center text-xl tracking-[0.5em] text-white font-mono font-black outline-none focus:border-teal-400"
                />
                <p class="text-[10px] text-slate-400 mt-1 text-center">Firma digital FES de conformidad de entrega de plataforma.</p>
              </div>

              <!-- Indicador reactivo de requisitos pendientes Entrega -->
              <div v-if="!esActaEntregaValida && !estadoPlataformaBsm.entregaSellada" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-center text-xs space-y-1 my-3">
                <p class="font-bold text-amber-300">Requisitos para autorizar y firmar entrega:</p>
                <div class="flex flex-wrap items-center justify-center gap-2 text-[11px]">
                  <span :class="formBsm.horometro_in ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">{{ formBsm.horometro_in ? '✓' : '⚠️' }} Horómetro IN</span>
                  <span class="text-slate-600">•</span>
                  <span :class="conteoFotosEntregaBsm >= 6 ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">{{ conteoFotosEntregaBsm >= 6 ? '✓' : '⚠️' }} Fotos 360° ({{ conteoFotosEntregaBsm }}/6)</span>
                  <span class="text-slate-600">•</span>
                  <span :class="(formBsm.receptor_entrega_nombre && formBsm.receptor_entrega_rut && formBsm.firma_entrega_base64) ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">{{ (formBsm.receptor_entrega_nombre && formBsm.receptor_entrega_rut && formBsm.firma_entrega_base64) ? '✓' : '⚠️' }} Firma Mandante</span>
                  <span class="text-slate-600">•</span>
                  <span :class="(formBsm.pin_entrega && formBsm.pin_entrega.length === 4) ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">{{ (formBsm.pin_entrega && formBsm.pin_entrega.length === 4) ? '✓' : '⚠️' }} PIN ({{ formBsm.pin_entrega ? formBsm.pin_entrega.length : 0 }}/4)</span>
                </div>
              </div>

              <v-alert
                v-if="mensajeExitoBsm"
                :type="mensajeExitoBsm.startsWith('Error') ? 'error' : 'success'"
                density="compact"
                variant="flat"
                class="mt-3 text-xs font-bold"
              >
                {{ mensajeExitoBsm }}
              </v-alert>

              <button
                v-if="!estadoPlataformaBsm.entregaSellada"
                type="button"
                :disabled="guardandoActaBsm || !esActaEntregaValida"
                @click="sellarActaEntregaBsm"
                class="w-full min-h-[54px] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-xs uppercase rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer mt-3"
              >
                <span v-if="guardandoActaBsm">⏳ Firmando y Generando Acta...</span>
                <span v-else>🟢 EMITIR Y FIRMAR ACTA DE ENTREGA (FES) ➔</span>
              </button>

              <v-btn
                v-if="estadoPlataformaBsm.entregaSellada && urlPdfEntregaBsm"
                color="teal-darken-3"
                variant="flat"
                class="w-100 mt-2 font-bold text-white text-none rounded-xl py-2.5"
                prepend-icon="mdi-file-pdf-box"
                @click="verPdfActa(urlPdfEntregaBsm)"
              >
                📄 Ver Acta de Entrega Oficial (PDF)
              </v-btn>
            </div>
          </template>

          <!-- ================================================================= -->
          <!-- MODO 2: CANDADO DE ACTA DE RETIRO / RECUPERACIÓN 360° (RECEPCIÓN) -->
          <!-- ================================================================= -->
          <template v-else>
            <div
              class="pa-3 rounded-xl"
              style="background-color: #111827 !important; border: 1px solid rgba(245, 158, 11, 0.55) !important;"
            >
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Candado Previo al Retorno: Acta de Recuperación / Retiro 360° (Columna RECEPCIÓN)
                </span>
                <v-chip size="x-small" :color="estadoPlataformaBsm.retiroSellado ? 'success' : 'warning'" variant="flat" class="font-bold text-black">
                  {{ estadoPlataformaBsm.retiroSellado ? 'CANDADO LIBERADO' : 'CANDADO ACTIVO' }}
                </v-chip>
              </div>

              <!-- HOROM. OUT Y COMBUSTIBLE SALIDA -->
              <v-row dense class="mb-2">
                <v-col cols="4">
                  <v-text-field
                    :model-value="formBsm.horometro_in || 'S/I'"
                    label="HOROM. IN (Entrega)"
                    variant="outlined"
                    density="compact"
                    readonly
                    hide-details
                    bg-color="#060a14"
                  />
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    v-model="formBsm.horometro_out"
                    type="number"
                    step="0.1"
                    label="HOROM. OUT (Retiro) *"
                    variant="outlined"
                    density="compact"
                    hide-details
                    bg-color="#060a14"
                  />
                </v-col>
                <v-col cols="4">
                  <v-select
                    v-model="formBsm.combustible_out"
                    :items="opcionesCombustibleBsm"
                    label="Petróleo / Batería OUT (%) *"
                    variant="outlined"
                    density="compact"
                    hide-details
                    bg-color="#060a14"
                  />
                </v-col>
              </v-row>

              <!-- 19 ÍTEMS OFICIALES DEL ACTA BSM (COLUMNA RECEPCIÓN) -->
              <div class="d-flex align-center justify-space-between mb-1.5">
                <span class="text-[11px] font-bold text-white">
                  19 Ítems Oficiales BSM / Royal Rental (Columna RECEPCIÓN vs ENTREGA)
                </span>
                <v-btn size="x-small" color="deep-purple-lighten-1" variant="flat" class="text-none font-bold text-white" @click="marcarTodosItemsBsm('RECEPCION', 'SI')">
                  ✓ Marcar Todos [SI]
                </v-btn>
              </div>

              <div
                class="rounded-lg mb-3"
                style="background-color: #060a14 !important; border: 1px solid #334155 !important;"
              >
                <div
                  v-for="(item, idx) in itemsChecklistBsm"
                  :key="`rec-${idx}`"
                  class="px-2.5 py-1.5 d-flex align-center justify-space-between ga-2"
                  style="border-bottom: 1px solid #1e293b !important;"
                >
                  <div class="text-xs font-medium text-white flex-1">
                    <span class="text-slate-400 font-mono mr-1">{{ idx + 1 }}.</span>{{ item.nombre }}
                    <span class="text-[10px] text-teal-400 ml-1">(Ent: {{ item.entrega }})</span>
                  </div>
                  <div class="d-flex ga-1">
                    <v-btn
                      v-for="val in ['SI', 'NO', 'NA']"
                      :key="val"
                      size="x-small"
                      :color="item.recepcion === val ? (val === 'SI' ? 'success' : (val === 'NO' ? 'error' : 'grey')) : 'grey-darken-3'"
                      :variant="item.recepcion === val ? 'flat' : 'outlined'"
                      class="font-bold px-2"
                      style="min-width: 34px;"
                      @click="item.recepcion = val"
                    >
                      {{ val }}
                    </v-btn>
                  </div>
                </div>
              </div>

              <!-- EVIDENCIA FOTOGRÁFICA 360° DE RETIRO (MÍNIMO 6 + ADICIONALES) -->
              <div class="mb-3">
                <div class="mb-1.5">
                  <span class="text-[11px] font-bold text-amber-300 uppercase">
                    📸 Evidencia Fotográfica 360° de Retiro (6 base obligatorias + {{ fotosAdicionalesRetiro.length }} extras • Total: {{ conteoFotosRetiroBsm }}) *
                  </span>
                </div>
                <v-row dense>
                  <v-col cols="6" sm="4" md="2" v-for="(slot, sIdx) in slotsFotos360" :key="`foto-ret-${sIdx}`">
                    <div
                      class="pa-2 rounded-lg text-center"
                      :style="formBsm.fotos_retiro[slot.key] ? 'background-color: #062c22 !important; border: 1px solid #10b981 !important;' : 'background-color: #060a14 !important; border: 1px solid #334155 !important;'"
                    >
                      <div class="text-[10px] font-bold text-white truncate mb-1">{{ slot.label }}</div>
                      <img v-if="formBsm.fotos_retiro[slot.key]" :src="formBsm.fotos_retiro[slot.key]" class="w-100 rounded mb-1" style="height: 56px; object-fit: cover;" />
                      <v-btn
                        size="x-small"
                        :color="formBsm.fotos_retiro[slot.key] ? 'success' : 'amber-darken-2'"
                        variant="flat"
                        class="w-100 text-none font-bold text-[10px] text-white"
                        @click="seleccionarFoto360('RETIRO', slot.key)"
                      >
                        {{ formBsm.fotos_retiro[slot.key] ? '✓ Tomada' : '📷 Capturar' }}
                      </v-btn>
                    </div>
                  </v-col>

                  <!-- Fotos Adicionales Dinámicas Retiro -->
                  <v-col cols="6" sm="4" md="2" v-for="(extra, xIdx) in fotosAdicionalesRetiro" :key="`foto-ret-extra-${xIdx}`">
                    <div
                      class="pa-2 rounded-lg text-center"
                      style="background-color: #062c22 !important; border: 1px solid #10b981 !important;"
                    >
                      <div class="d-flex align-center justify-space-between text-[10px] font-bold text-white truncate mb-1">
                        <span class="truncate">{{ extra.label || `Extra ${xIdx + 1}` }}</span>
                        <v-btn icon="mdi-close" size="18" density="compact" variant="text" color="red-lighten-2" @click="eliminarFotoAdicional('RETIRO', xIdx)" />
                      </div>
                      <img :src="extra.data" class="w-100 rounded mb-1" style="height: 56px; object-fit: cover;" />
                      <div class="text-[9px] text-emerald-300 font-bold">✓ Adjunta</div>
                    </div>
                  </v-col>

                  <!-- Tarjeta Directa en Grilla para Agregar Más Fotos -->
                  <v-col cols="6" sm="4" md="2">
                    <div
                      class="pa-2 rounded-lg text-center d-flex flex-column align-center justify-center cursor-pointer h-100"
                      style="background-color: #060a14 !important; border: 1px dashed #fbbf24 !important; min-height: 92px;"
                      @click="agregarFotoAdicional('RETIRO')"
                    >
                      <v-icon color="amber-accent-4" size="22" class="mb-1">mdi-camera-plus-outline</v-icon>
                      <div class="text-[10px] font-bold text-amber-300">+ Agregar Otra Foto</div>
                    </div>
                  </v-col>
                </v-row>
              </div>

              <v-textarea
                v-model="formBsm.observaciones_retiro"
                label="Observaciones de Retiro / Daños o Faltantes Detectados"
                variant="outlined"
                density="compact"
                rows="2"
                hide-details
                bg-color="#060a14"
                class="mb-3"
              />

              <!-- FIRMA MANUAL DEL CLIENTE EN RETIRO (ENTREGADO POR: NOMBRE, RUT Y CARGO) -->
              <div
                class="pa-3 rounded-xl"
                style="background-color: #060a14 !important; border: 1px solid rgba(245, 158, 11, 0.4) !important;"
              >
                <div class="text-xs font-black text-amber-300 uppercase mb-2">
                  ✍️ Devolución del Cliente en Obra (Entregado por: Nombre, RUT, Cargo y Firma Manual) *
                </div>
                <v-row dense>
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model="formBsm.receptor_retiro_nombre"
                      label="Nombre Cliente que Entrega *"
                      variant="outlined"
                      density="compact"
                      hide-details
                      bg-color="#111827"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="6" sm="4">
                    <v-text-field
                      v-model="formBsm.receptor_retiro_rut"
                      label="RUT Cliente *"
                      variant="outlined"
                      density="compact"
                      hide-details
                      bg-color="#111827"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="6" sm="4">
                    <v-text-field
                      v-model="formBsm.receptor_retiro_cargo"
                      label="Cargo en Obra *"
                      variant="outlined"
                      density="compact"
                      hide-details
                      bg-color="#111827"
                      class="mb-2"
                    />
                  </v-col>
                </v-row>

                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="text-[11px] text-white">Dibuje la firma manual del cliente que entrega la plataforma:</span>
                  <div class="d-flex ga-2">
                    <v-btn size="x-small" variant="text" color="error" class="text-none font-bold" @click="limpiarCanvasFirma('RETIRO')">
                      Limpiar Firma
                    </v-btn>
                  </div>
                </div>
                <div class="bg-white rounded-lg overflow-hidden" style="border: 1px solid #475569;">
                  <canvas
                    ref="canvasRetiroRef"
                    width="560"
                    height="120"
                    style="width: 100%; height: 110px; touch-action: none; cursor: crosshair; display: block; background-color: #ffffff;"
                    @pointerdown="iniciarTrazoCanvas($event, 'RETIRO')"
                    @pointermove="dibujarTrazoCanvas($event, 'RETIRO')"
                    @pointerup="finalizarTrazoCanvas('RETIRO')"
                  ></canvas>
                </div>
              </div>

              <!-- PIN de Firma Electrónica Simple (FES) Conductor / Operador en Retiro -->
              <div
                class="rounded-xl p-3 my-3"
                style="background-color: #060a14 !important; border: 1px solid rgba(245, 158, 11, 0.4) !important;"
              >
                <label class="block text-xs font-bold text-amber-400 mb-1">
                  PIN del Conductor / Operador (4 Dígitos) *
                </label>
                <input
                  type="password"
                  maxlength="4"
                  v-model="formBsm.pin_retiro"
                  placeholder="••••"
                  class="w-full bg-[#050810] border border-amber-500/40 rounded-xl px-3 py-3 text-center text-xl tracking-[0.5em] text-white font-mono font-black outline-none focus:border-amber-400"
                />
                <p class="text-[10px] text-slate-400 mt-1 text-center">Firma digital FES de conformidad de retiro y recuperación de plataforma.</p>
              </div>

              <!-- Indicador reactivo de requisitos pendientes Retiro -->
              <div v-if="!esActaRetiroValida && !estadoPlataformaBsm.retiroSellado" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-center text-xs space-y-1 my-3">
                <p class="font-bold text-amber-300">Requisitos para autorizar y firmar retiro:</p>
                <div class="flex flex-wrap items-center justify-center gap-2 text-[11px]">
                  <span :class="(formBsm.horometro_out && Number(formBsm.horometro_out) >= Number(formBsm.horometro_in || 0)) ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">{{ (formBsm.horometro_out && Number(formBsm.horometro_out) >= Number(formBsm.horometro_in || 0)) ? '✓' : '⚠️' }} Horómetro OUT</span>
                  <span class="text-slate-600">•</span>
                  <span :class="conteoFotosRetiroBsm >= 6 ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">{{ conteoFotosRetiroBsm >= 6 ? '✓' : '⚠️' }} Fotos 360° ({{ conteoFotosRetiroBsm }}/6)</span>
                  <span class="text-slate-600">•</span>
                  <span :class="(formBsm.receptor_retiro_nombre && formBsm.receptor_retiro_rut && formBsm.firma_retiro_base64) ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">{{ (formBsm.receptor_retiro_nombre && formBsm.receptor_retiro_rut && formBsm.firma_retiro_base64) ? '✓' : '⚠️' }} Firma Mandante</span>
                  <span class="text-slate-600">•</span>
                  <span :class="(formBsm.pin_retiro && formBsm.pin_retiro.length === 4) ? 'text-emerald-400 font-bold' : 'text-amber-400/80'">{{ (formBsm.pin_retiro && formBsm.pin_retiro.length === 4) ? '✓' : '⚠️' }} PIN ({{ formBsm.pin_retiro ? formBsm.pin_retiro.length : 0 }}/4)</span>
                </div>
              </div>

              <v-alert
                v-if="mensajeExitoBsm"
                :type="mensajeExitoBsm.startsWith('Error') ? 'error' : 'success'"
                density="compact"
                variant="flat"
                class="mt-3 text-xs font-bold"
              >
                {{ mensajeExitoBsm }}
              </v-alert>

              <button
                v-if="!estadoPlataformaBsm.retiroSellado"
                type="button"
                :disabled="guardandoActaBsm || !esActaRetiroValida"
                @click="sellarActaRetiroBsm"
                class="w-full min-h-[54px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-xs uppercase rounded-xl tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer mt-3"
              >
                <span v-if="guardandoActaBsm">⏳ Firmando y Generando Acta...</span>
                <span v-else>🏁 EMITIR Y FIRMAR ACTA DE RETIRO (FES) ➔</span>
              </button>

              <v-btn
                v-if="estadoPlataformaBsm.retiroSellado && urlPdfFinalBsm"
                color="deep-purple-darken-3"
                variant="flat"
                class="w-100 mt-2 font-bold text-white text-none rounded-xl py-2.5"
                prepend-icon="mdi-file-pdf-box"
                @click="verPdfActa(urlPdfFinalBsm)"
              >
                📄 Ver Acta de Retiro y Cierre Oficial (PDF)
              </v-btn>

              <v-btn
                v-if="estadoPlataformaBsm.retiroSellado"
                color="info"
                variant="flat"
                class="w-100 mt-2 font-black text-white text-none rounded-xl py-3"
                @click="iniciarViajeRetornoPlataformaBsm"
              >
                🚛 Ir a la Hoja de Ruta Oficial para Registrar el Viaje de Retorno ➔
              </v-btn>
            </div>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-row dense class="align-center">
      <v-col v-if="false && !esVistaReclamos" cols="12" md="6" class="py-1">
        <div class="asignacion-dia-title">
          {{ esVistaAsignacionesCnx ? `Asignación para el día de ${tituloAsignacionDia}` : 'Protocolos e Inspecciones' }}
        </div>
      </v-col>

      <template v-else-if="false">
        <v-col cols="12" md="6" class="py-1">
          <div class="asignacion-dia-title">
            Reclamos
          </div>
        </v-col>
      </template>

      <v-col v-if="false && rolesSesionReady && !esVistaReclamos && !esVistaAsignacionesCnx" cols="6" md="6" class="py-1 d-flex align-center">
        <v-btn
          color="primary"
          prepend-icon="mdi-file-document-edit-outline"
          @click="abrirModalRegistrarProtocolo"
        >
          Registrar Inspección/Checklist
        </v-btn>
      </v-col>

      <v-dialog v-model="dialogRegistrarProtocolo" max-width="520">
        <v-card>
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Registrar Inspección/Checklist
          </v-card-title>
          <v-card-text class="pt-2">
            <v-row dense>
              <v-col cols="12">
                <v-alert
                  v-if="errorCrearProtocolo"
                  type="error"
                  density="compact"
                  variant="tonal"
                  class="mb-2"
                >
                  {{ errorCrearProtocolo }}
                </v-alert>
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProtocolo.id_empresa_cliente"
                  :items="clientesFiltrados"
                  item-title="name_empresa"
                  item-value="id_empresa"
                  label="Cliente"
                  variant="outlined"
                  density="compact"
                  :loading="loadingCatalogoProtocolo"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProtocolo.id_proyecto"
                  :items="proyectosFiltrados"
                  item-title="nombre_proyecto"
                  item-value="id_proyecto"
                  label="Proyecto"
                  variant="outlined"
                  density="compact"
                  :loading="loadingProyectosCatalogo"
                  :disabled="!formProtocolo.id_empresa_cliente"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProtocolo.area"
                  :items="areasOptions"
                  item-title="name_area"
                  item-value="name_area"
                  label="Area"
                  variant="outlined"
                  density="compact"
                  :loading="loadingCatalogoProtocolo"
                  :disabled="!formProtocolo.id_proyecto"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProtocolo.familia"
                  :items="familiasOptions"
                  item-title="familia"
                  item-value="familia"
                  label="Familia"
                  variant="outlined"
                  density="compact"
                  :loading="loadingCatalogoProtocolo"
                  :disabled="!formProtocolo.area"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="formProtocolo.id_template"
                  :items="protocolosOptions"
                  item-title="display_name"
                  item-value="id_template"
                  label="Protocolo"
                  variant="outlined"
                  density="compact"
                  :loading="loadingCatalogoProtocolo"
                  :disabled="!formProtocolo.familia"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12" class="pt-1">
                <div class="text-caption font-weight-bold text-medium-emphasis">
                  Asignación de Flujo
                </div>
              </v-col>

              <!--v-col cols="12" v-if="!surveyCreadoProtocoloId">
                <v-alert type="info" variant="tonal" density="compact">
                  Para asignar usuarios del flujo, primero presiona "Preparar Flujo".
                </v-alert>
              </v-col-->

              <v-col cols="12" v-if="loadingFlujoPlantilla">
                <v-progress-linear indeterminate color="primary" />
              </v-col>

              <v-col
                v-for="step in flujoPlantillaSteps"
                :key="`flow-step-${step.flow_tmpl_step_orden}-${step.name_rol}`"
                cols="12"
              >
                <v-select
                  v-model="step.id_user"
                  :label="step.flow_tmpl_step_name || 'Paso de flujo'"
                  :items="usuariosPorRol(step.name_rol)"
                  item-title="nombre_user"
                  item-value="id_user"
                  variant="outlined"
                  density="compact"
                  :class="{ 'flow-step-unassigned': !step.id_user }"
                  hide-details="auto"
                />
              </v-col>

              <!--v-col cols="12" v-if="!loadingFlujoPlantilla && !flujoPlantillaSteps.length">
                <v-alert type="info" variant="tonal" density="compact">
                  Este protocolo no tiene pasos de flujo configurados.
                </v-alert>
              </v-col-->
            </v-row>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn
              v-if="!surveyCreadoProtocoloId"
              color="primary"
              :loading="creandoProtocolo || loadingFlujoPlantilla"
              :disabled="!formularioProtocoloBasicoValido"
              @click="prepararFlujoModal"
            >
              Preparar Flujo
            </v-btn>
            <v-btn
              color="primary"
              v-else
              :loading="creandoProtocolo"
              :disabled="!formularioProtocoloValido"
              @click="crearSurveyDesdeModal"
            >
              Guardar Asignación
            </v-btn>
            <v-btn
              variant="text"
              @click="dialogRegistrarProtocolo = false"
            >
              Cerrar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-col v-if="false && !esVistaReclamos && !esVistaAsignacionesCnx && rolesSesionReady" cols="12" class="pt-1">
        <v-row dense>
          <v-col cols="12" md="3">
            <v-select
              v-model="filtro"
              :items="filtros"
              item-value="ID"
              item-title="NOMBRE"
              label="Filtro Estados"
              density="compact"
              variant="outlined"
              class="surveys-filter-field"
              clearable
              return-object
              hide-details
              :menu-props="{ contentClass: 'surveys-select-menu' }"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="filtroDim"
              :items="filtroDimension"
              item-value="ID"
              item-title="NOMBRE"
              label="Filtro Area"
              density="compact"
              variant="outlined"
              class="surveys-filter-field"
              clearable
              return-object
              hide-details
              :menu-props="{ contentClass: 'surveys-select-menu' }"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="filtroTexto"
              label="Buscar Texto"
              density="compact"
              variant="outlined"
              class="surveys-filter-field"
              clearable
              hide-details
            />
          </v-col>

          <v-col cols="12" md="2" class="d-flex align-center justify-end">
            <v-switch
              v-model="verTerminados"
              label="Ver Terminados"
              density="compact"
              color="primary"
              hide-details
            />
          </v-col>
        </v-row>
      </v-col>

    </v-row>

    <!-- MODAL REACTIVO: PLAN DE IZAJE DIGITAL & MEMORIA DE CÁLCULO (SPEC 37) -->
    <v-dialog v-model="dialogPlanIzaje" max-width="540" persistent scrollable>
      <v-card class="bg-[#0b1120] text-white border border-indigo-500/40 rounded-2xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 border-b border-slate-800 bg-[#0f172a]">
          <div class="d-flex align-center ga-2">
            <v-icon color="indigo-accent-2" size="22">mdi-ruler-square</v-icon>
            <div>
              <div class="text-sm font-black text-white leading-tight">Plan de Izaje Digital & Rigging</div>
              <div class="text-[10px] text-indigo-300 font-bold">Memoria de Cálculo Reactiva · Límite Mandatorio 85%</div>
            </div>
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" color="slate-400" @click="dialogPlanIzaje = false" />
        </v-card-title>

        <v-card-text class="pa-4 space-y-3" style="max-height: 78vh; overflow-y: auto;">
          <!-- Selección de OT / Proyecto -->
          <div class="pa-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div class="text-[10px] font-black uppercase text-indigo-300 mb-2">1. Orden de Trabajo / Faena Activa</div>
            <v-select
              v-model="formPlanIzaje.id_proyecto"
              :items="proyectosIzajeDisponibles"
              item-title="label"
              item-value="id_proyecto"
              label="Seleccionar OT / Proyecto"
              variant="outlined"
              density="compact"
              hide-details
              bg-color="#060a14"
              class="mb-2"
              @update:model-value="onCambiarProyectoPlanIzaje"
            />
            <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-300 mt-2">
              <div><span class="text-slate-500">Cliente:</span> <strong>{{ formPlanIzaje.cliente_nombre || 'Por definir' }}</strong></div>
              <div><span class="text-slate-500">Grúa:</span> <strong>{{ formPlanIzaje.grua_modelo || 'Grúa Móvil' }}</strong></div>
            </div>
          </div>

          <!-- Parámetros Geométricos -->
          <div class="pa-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div class="text-[10px] font-black uppercase text-indigo-300 mb-2">2. Geometría de Maniobra (Croquis Vectorial SVG)</div>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="formPlanIzaje.elemento_izar"
                  label="Elemento / Carga a Izar *"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#060a14"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="formPlanIzaje.radio_max_m"
                  type="number"
                  step="0.5"
                  label="Radio R (m)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#060a14"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="formPlanIzaje.largo_pluma_m"
                  type="number"
                  step="0.5"
                  label="Pluma L (m)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#060a14"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="formPlanIzaje.angulo_deg"
                  type="number"
                  label="Ángulo (°)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#060a14"
                />
              </v-col>
            </v-row>
          </div>

          <!-- Calculadora Reactiva de Cargas -->
          <div class="pa-3 rounded-xl bg-slate-900/90 border border-indigo-500/40">
            <div class="text-[10px] font-black uppercase text-indigo-300 mb-2">3. Memoria de Cálculo Reactiva (Pesos en kg)</div>
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  v-model.number="formPlanIzaje.peso_neto_kg"
                  type="number"
                  label="1. Peso Neto Carga (kg)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#060a14"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="formPlanIzaje.peso_gancho_kg"
                  type="number"
                  label="2. Peso Gancho / Pasteca (kg)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#060a14"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="formPlanIzaje.peso_yugo_kg"
                  type="number"
                  label="3. Peso Yugo / Separador (kg)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#060a14"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="formPlanIzaje.peso_aparejos_kg"
                  type="number"
                  label="4. Eslingas / Grilletes (kg)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#060a14"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model.number="formPlanIzaje.capacidad_tabla_kg"
                  type="number"
                  label="Capacidad Bruta según Tabla de Grúa (kg) *"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#060a14"
                />
              </v-col>
            </v-row>

            <!-- Semáforo de Factor de Utilización -->
            <div
              class="mt-3 pa-3 rounded-xl border"
              :class="excedeLimiteSeguridadIzaje ? 'bg-red-950/60 border-red-500' : 'bg-emerald-950/50 border-emerald-500/60'"
            >
              <div class="d-flex align-center justify-space-between text-xs font-black mb-1">
                <span>CARGA BRUTA TOTAL: {{ pesoBrutoTotalIzajeKg.toLocaleString('es-CL') }} kg</span>
                <span :class="excedeLimiteSeguridadIzaje ? 'text-red-300' : 'text-emerald-300'">
                  UTILIZACIÓN: {{ porcentajeUtilizacionIzaje }}% (Máx 85%)
                </span>
              </div>
              <v-progress-linear
                :model-value="Math.min(porcentajeUtilizacionIzaje, 100)"
                :color="excedeLimiteSeguridadIzaje ? 'error' : (porcentajeUtilizacionIzaje >= 75 ? 'warning' : 'success')"
                height="10"
                rounded
              />
              <div class="text-[11px] font-bold mt-1.5" :class="excedeLimiteSeguridadIzaje ? 'text-red-300' : 'text-emerald-300'">
                <span v-if="excedeLimiteSeguridadIzaje">
                  MANIOBRA BLOQUEADA POR SEGURIDAD: Supera el 85% de capacidad nominal. Reduzca radio o cambie configuración.
                </span>
                <span v-else>
                  MANIOBRA SEGURA Y APROBADA: Dentro del rango estándar GSP (menor o igual a 85%).
                </span>
              </div>
            </div>
          </div>

          <!-- Firmantes y PIN FES -->
          <div class="pa-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div class="text-[10px] font-black uppercase text-indigo-300 mb-2">4. Cuadrilla Responsable y Firma FES</div>
            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model="formPlanIzaje.operador_nombre" label="Operador Grúa" variant="outlined" density="compact" hide-details bg-color="#060a14" class="mb-2" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="formPlanIzaje.rigger_nombre" label="Rigger Calificado" variant="outlined" density="compact" hide-details bg-color="#060a14" class="mb-2" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="formPlanIzaje.supervisor_nombre" label="Supervisor / Jefe Maniobra" variant="outlined" density="compact" hide-details bg-color="#060a14" />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formPlanIzaje.pin_fes"
                  type="password"
                  maxlength="4"
                  label="PIN FES (4 dígitos) *"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#060a14"
                />
              </v-col>
            </v-row>
          </div>

          <v-alert v-if="mensajePlanIzaje" :type="errorPlanIzaje ? 'error' : 'success'" density="compact" variant="tonal" class="text-xs font-bold">
            {{ mensajePlanIzaje }}
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4 border-t border-slate-800 bg-[#0f172a] d-flex flex-column ga-2">
          <v-btn
            color="indigo-accent-3"
            variant="flat"
            class="w-100 font-black text-none rounded-xl py-3 text-white"
            :loading="guardandoPlanIzaje"
            :disabled="excedeLimiteSeguridadIzaje || !formPlanIzaje.id_proyecto || String(formPlanIzaje.pin_fes || '').length < 4"
            @click="guardarPlanIzajeFes"
          >
            Firmar Plan de Izaje (FES) y Generar PDF Oficial A4 ➔
          </v-btn>
          <v-btn
            v-if="urlPdfPlanIzaje"
            color="deep-purple-darken-2"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            class="w-100 font-bold text-none rounded-xl text-white"
            @click="verPdfActa(urlPdfPlanIzaje)"
          >
            Abrir PDF Oficial A4 con Croquis Vectorial SVG
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, reactive, computed, watch } from 'vue'
import apiAxios from '@/services/api'
import { useRouter, useRoute } from 'vue-router'
import { useUserDetailStore } from '@/store/userDetail'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { verificarEsAdminOComercial } from '@/composables/usePermisosCotizador'

/* eslint-disable */

const router = useRouter()
const route = useRoute()
const userDetailStore = useUserDetailStore()
const { isOnline } = useNetworkStatus()

// id_user seguro con fallback inmediato a localStorage ('userDetail' y 'perfil' ID_USUARIO/id_user)
const idUser = computed(() => {
  if (userDetailStore.userDetail?.id_user) return userDetailStore.userDetail.id_user
  try {
    const rawUd = localStorage.getItem('userDetail')
    if (rawUd) {
      const parsedUd = JSON.parse(rawUd)
      const udId = parsedUd?.userDetail?.id_user ?? parsedUd?.id_user
      if (udId) return udId
    }
    const rawPerfil = localStorage.getItem('perfil')
    if (rawPerfil) {
      const parsedPerfil = JSON.parse(rawPerfil)
      const pId = parsedPerfil?.id_user ?? parsedPerfil?.ID_USUARIO
      if (pId) return pId
    }
  } catch (_) {}
  return null
})

// Acceso a cotizador express exclusivo para perfiles Admin o Comerciales
const esAdminOComercial = computed(() => {
  return verificarEsAdminOComercial(userDetailStore.userDetail?.usuarioRoles)
})

// Evaluación de rol Taller / Mecánico para segmentar la interfaz del operador en terreno
const esUsuarioTaller = computed(() => {
  const roles = userDetailStore.userDetail?.usuarioRoles || []
  return roles.some(r => {
    const name = (r.name_rol || r.nombre || r.rol || '').toUpperCase()
    return name.includes('MECANICO') || name.includes('TALLER') || name.includes('MANTENCION') || name.includes('ADMIN')
  })
})

// --- MÓDULO DE VIAJE CONVOY / CHOFER PWA ---
const viajeActivo = ref(null)
const cargandoViajeActivo = ref(false)

// Detección de Requerimiento Interno GSP (Spec 87: Folio INT- o flag es_interno)
const esViajeInternoActivo = computed(() => {
  const v = viajeActivo.value
  const r = reportPrincipalPendiente.value
  const codV = String(v?.codi_proyecto || '').toUpperCase().trim()
  const codR = String(r?.codi_proyecto || '').toUpperCase().trim()
  return Boolean(
    v?.es_interno === true ||
    v?.es_requerimiento_interno === true ||
    codV.startsWith('INT-') ||
    r?.es_interno === true ||
    codR.startsWith('INT-')
  )
})

// --- MÓDULO DE REPORTS DIARIOS DISCRIMINADOS PWA (Spec 57 / REQ-025) ---
const reportsPendientes = ref([])
const reportsConcluidos = ref([])
const cargandoReportsPendientes = ref(false)
const indiceReportSeleccionado = ref(0)
const reportPrincipalPendiente = computed(() => {
  if (reportsPendientes.value.length === 0) return null
  return reportsPendientes.value[indiceReportSeleccionado.value] || reportsPendientes.value[0]
})
const primerConcluido = computed(() => {
  return reportsConcluidos.value[0] || null
})

// --- MÓDULO UNIFICADO DE FLUJO OPERATIVO EN TERRENO (VIAJE IDA -> REPORT -> RETORNO) ---
const servicioOperativoActivo = computed(() => {
  const v = viajeActivo.value
  const r = reportPrincipalPendiente.value || primerConcluido.value
  if (!v && !r) return null

  return {
    codi_proyecto: v?.codi_proyecto || r?.codi_proyecto || 'GSP-OT',
    id_proyecto: v?.id_proyecto || r?.id_proyecto,
    id_equipo: v?.id_equipo || r?.id_equipo,
    patente: v?.patente || r?.patente || 'S/P',
    modelo: v?.modelo || 'Maquinaria de Izaje GSP',
    tipo_equipo: v?.tipo_equipo || 'EQUIPO DE FLOTA',
    obra_nombre: v?.obra_nombre || r?.obra_nombre || 'Faena Operativa',
    obra_direccion: v?.obra_direccion || r?.obra_direccion || '',
    cliente_nombre: v?.cliente_nombre || r?.cliente_nombre || 'Cliente Mandante'
  }
})

const estadoPaso1ViajeIda = computed(() => {
  const v = viajeActivo.value
  if (v && v.tipo_trayecto === 'RETORNO') return 'COMPLETADO'
  if (!v || v.tipo_trayecto !== 'IDA') {
    if (reportPrincipalPendiente.value || primerConcluido.value) return 'COMPLETADO'
    return 'SIN_ASIGNAR'
  }
  if (v.estado_trayecto === 'ASIGNADO') return 'PENDIENTE'
  if (v.estado_trayecto === 'EN_RUTA') return 'EN_RUTA'
  if (v.estado_trayecto === 'ARRIBADO' || v.estado_trayecto === 'LLEGADO') return 'COMPLETADO'
  return 'COMPLETADO'
})

const estadoPaso2ReportFaena = computed(() => {
  const p1 = estadoPaso1ViajeIda.value
  const r = reportPrincipalPendiente.value
  const c = primerConcluido.value

  if (p1 !== 'COMPLETADO' && p1 !== 'SIN_ASIGNAR') return 'BLOQUEADO'

  if (r) {
    if (r.jornada_en_curso) return 'JORNADA_EN_CURSO'
    if (r.puede_reportar) return 'PENDIENTE_INICIO'
  }

  if (c) {
    if (c.motivo === 'SERVICIO_CONCLUIDO') return 'CONCLUIDO_TOTAL'
    if (c.motivo === 'AL_DIA_HOY') return 'AL_DIA_HOY'
  }

  return 'AL_DIA'
})

const estadoPaso3ViajeRetorno = computed(() => {
  const p2 = estadoPaso2ReportFaena.value
  const v = viajeActivo.value

  if (v && v.tipo_trayecto === 'RETORNO') {
    if (v.estado_trayecto === 'ASIGNADO') return 'PENDIENTE_SALIDA'
    if (v.estado_trayecto === 'EN_RUTA') return 'EN_RUTA'
    if (v.estado_trayecto === 'ARRIBADO' || v.estado_trayecto === 'LLEGADO' || v.estado_trayecto === 'CONCLUIDO') return 'COMPLETADO'
  }

  if (p2 === 'CONCLUIDO_TOTAL') {
    return 'PENDIENTE_CREACION'
  }

  return 'BLOQUEADO'
})

const proximaAccionFlujo = computed(() => {
  const v = viajeActivo.value
  const r = reportPrincipalPendiente.value
  const p1 = estadoPaso1ViajeIda.value
  const p2 = estadoPaso2ReportFaena.value
  const p3 = estadoPaso3ViajeRetorno.value

  // 1. VIAJE DE IDA PENDIENTE
  if (p1 === 'PENDIENTE') {
    return {
      paso: 1,
      titulo: '1. INICIAR VIAJE A FAENA ➔',
      subtitulo: `Registra odómetro, horómetro camión y sal de base hacia ${v?.obra_nombre || 'la obra'}`,
      badge: 'SALIDA DE PATIO',
      color: 'amber-darken-2',
      colorTexto: 'text-black',
      icono: 'mdi-truck-fast-outline',
      pulsar: true,
      accion: () => abrirViajeNativo(v?.token_viaje)
    }
  }

  // 2. VIAJE DE IDA EN RUTA
  if (p1 === 'EN_RUTA') {
    return {
      paso: 1,
      titulo: '1. EN RUTA A FAENA ➔ REGISTRAR LLEGADA ➔',
      subtitulo: `Traslado en curso hacia ${v?.obra_nombre || 'faena'}. Registra odómetro, horómetro camión y combustible`,
      badge: 'EN TRAYECTO',
      color: 'info',
      colorTexto: 'text-white',
      icono: 'mdi-map-marker-path',
      pulsar: true,
      accion: () => abrirViajeNativo(v?.token_viaje)
    }
  }

  // 3. FAENA: JORNADA EN CURSO -> FINALIZAR Y FIRMAR MANDANTE (MOMENTO 2 Y 3)
  if (p2 === 'JORNADA_EN_CURSO' && r) {
    return {
      paso: 2,
      titulo: `2. FINALIZAR FAENA & FIRMAR REPORT DÍA ${r.dia_a_reportar} ➔`,
      subtitulo: `Jornada iniciada. Toca aquí para registrar horómetro final y firmar con mandante`,
      badge: 'FAENA EN CURSO',
      color: 'amber-darken-3',
      colorTexto: 'text-white',
      icono: 'mdi-file-document-edit-outline',
      pulsar: true,
      accion: () => abrirReportDiario(r.id_proyecto, r.id_equipo, r.id_reporte_avance_activo)
    }
  }

  // 4. FAENA: INICIAR JORNADA (MOMENTO 1)
  if (p2 === 'PENDIENTE_INICIO' && r) {
    const esMultiDia = Number(r.dia_a_reportar) > 1
    return {
      paso: 2,
      titulo: esMultiDia 
        ? `2. INICIAR JORNADA DÍA ${r.dia_a_reportar} ➔` 
        : `2. INICIAR JORNADA DE FAENA (DÍA ${r.dia_a_reportar}) ➔`,
      subtitulo: esMultiDia
        ? `Equipo en obra. Registra hora de inicio (horómetro de izaje heredado del cierre previo)`
        : `Arribo cumplido. Toca para registrar horómetro inicial de izaje`,
      badge: esMultiDia ? `DÍA ${r.dia_a_reportar} EN FAENA` : 'INICIO DE FAENA',
      color: 'emerald-darken-1',
      colorTexto: 'text-white',
      icono: 'mdi-play-circle-outline',
      pulsar: true,
      accion: () => abrirReportDiario(r.id_proyecto, r.id_equipo, r.id_reporte_avance_activo)
    }
  }

  // 5. RETORNO: SALIDA DE FAENA PENDIENTE
  if (p3 === 'PENDIENTE_SALIDA' && v) {
    return {
      paso: 3,
      titulo: '3. INICIAR VIAJE DE REGRESO A PATIO ➔',
      subtitulo: 'Faena concluida. Registra salida de faena hacia patio Central San Pablo',
      badge: 'RETORNO A BASE',
      color: 'deep-purple-accent-3',
      colorTexto: 'text-white',
      icono: 'mdi-truck-cargo-container',
      pulsar: true,
      accion: () => abrirViajeNativo(v.token_viaje)
    }
  }

  // 6. RETORNO: EN RUTA A PATIO
  if (p3 === 'EN_RUTA' && v) {
    return {
      paso: 3,
      titulo: '3. RETORNO EN RUTA ➔ REGISTRAR LLEGADA A BASE ➔',
      subtitulo: 'Camino a Patio Central San Pablo. Toca aquí al ingresar a la base',
      badge: 'RETORNO EN TRAYECTO',
      color: 'cyan-darken-2',
      colorTexto: 'text-white',
      icono: 'mdi-map-marker-check',
      pulsar: true,
      accion: () => abrirViajeNativo(v.token_viaje)
    }
  }

  // 7. RETORNO CUMPLIDO / SERVICIO CONCLUIDO
  if (p3 === 'COMPLETADO') {
    return {
      paso: 3,
      titulo: '🏆 ¡SERVICIO OPERACIONAL CONCLUIDO CON ÉXITO!',
      subtitulo: 'Maquinaria recepcionada en Base Central San Pablo. El equipo ha quedado disponible.',
      badge: 'CONCLUIDO',
      color: 'emerald-darken-4',
      colorTexto: 'text-emerald-200',
      icono: 'mdi-check-decagram',
      pulsar: false,
      deshabilitado: true,
      accion: () => {}
    }
  }

  // 8. DÍA REPORTADO HOY, PERO CONTINÚA MAÑANA
  if (p2 === 'AL_DIA_HOY') {
    return {
      paso: 2,
      titulo: '✅ JORNADA DE HOY AL DÍA',
      subtitulo: primerConcluido.value?.mensaje || 'Reporte del día sellado conforme. La faena continúa mañana.',
      badge: 'AL DÍA',
      color: 'slate-800',
      colorTexto: 'text-slate-200',
      icono: 'mdi-calendar-clock',
      pulsar: false,
      deshabilitado: true,
      accion: () => {}
    }
  }

  return null
})

const expandirOperacion = ref(false)

const proximaAccionBotonCorto = computed(() => {
  const p = proximaAccionFlujo.value
  if (!p) return 'Ver Operación ➔'
  switch (p.paso) {
    case 1:
      return p.badge === 'EN TRAYECTO' ? 'Llegada ➔' : 'Iniciar Viaje ➔'
    case 2:
      return p.badge === 'FAENA EN CURSO' ? 'Firmar Report ➔' : 'Iniciar Faena ➔'
    case 3:
      return p.badge === 'RETORNO EN TRAYECTO' ? 'Llegada Base ➔' : 'Iniciar Retorno ➔'
    default:
      return 'Continuar ➔'
  }
})

// --- MÓDULO DE INSPECCIÓN AUTÓNOMA DE PATIO (TEMPLATE 79) ---
const dialogPatio = ref(false)
const cargandoEquiposPatio = ref(false)
const iniciandoPatio = ref(false)
const errorIniciandoPatio = ref('')
const equiposPatio = ref([])
const formPatio = reactive({
  tipo_movimiento: 'ENTRADA',
  equipoSeleccionado: null,
  observaciones: ''
})

const cargarEquiposPatio = async () => {
  if (equiposPatio.value.length > 0) return
  try {
    cargandoEquiposPatio.value = true
    const { data } = await apiAxios.get('/tequ-equipos')
    const lista = data?.data || []
    equiposPatio.value = lista.map(e => ({
      ...e,
      display_label: `${e.patente} • ${e.marca || ''} ${e.modelo || ''} (${e.nombre_categoria || e.tipo_equipo || 'Equipo'})`
    }))
  } catch (err) {
    console.error('Error cargando equipos de patio:', err)
  } finally {
    cargandoEquiposPatio.value = false
  }
}

const abrirModalPatio = async () => {
  dialogPatio.value = true
  errorIniciandoPatio.value = ''
  formPatio.tipo_movimiento = 'ENTRADA'
  formPatio.equipoSeleccionado = null
  formPatio.observaciones = ''
  await cargarEquiposPatio()
}

const iniciarChecklistPatio = async () => {
  if (!formPatio.equipoSeleccionado) return
  try {
    iniciandoPatio.value = true
    errorIniciandoPatio.value = ''
    const uid = idUser.value || JSON.parse(localStorage.getItem('perfil') || '{}')?.id_user
    const eq = formPatio.equipoSeleccionado
    const fechaActual = fechaActualYMD()

    // 1. Obtener la semilla canónica del Template 79
    const { data: tplData } = await apiAxios.get('/servicio/leanglobal/obtenerTemplates?id_template=79')
    const tpl = Array.isArray(tplData) ? tplData[0] : (tplData?.datos?.[0] || tplData)
    if (!tpl) throw new Error('No se pudo obtener la plantilla del checklist de patio')

    const headerSeed = typeof tpl.header_seed === 'string' ? JSON.parse(tpl.header_seed) : (tpl.header_seed || {})
    const bodySeed = typeof tpl.body_seed === 'string' ? JSON.parse(tpl.body_seed) : (tpl.body_seed || { segmentos: [] })
    const approvalSeed = typeof tpl.approval_seed === 'string' ? JSON.parse(tpl.approval_seed) : (tpl.approval_seed || {})

    // 2. Inyectar datos del equipo y movimiento en la estructura de ejecución
    const bodyExec = JSON.parse(JSON.stringify(bodySeed))
    if (bodyExec.segmentos && bodyExec.segmentos[0] && bodyExec.segmentos[0].attributes) {
      bodyExec.segmentos[0].attributes.forEach(attr => {
        if (attr.label === 'TIPO DE MOVIMIENTO' && attr.values) {
          attr.values.selected = formPatio.tipo_movimiento
          attr.default = formPatio.tipo_movimiento
        }
        if (attr.label === 'PLACA PATENTE / EQUIPO') {
          attr.default = eq.patente
          attr.text = eq.patente
        }
        if (attr.label === 'CATEGORÍA DEL EQUIPO') {
          attr.default = eq.nombre_categoria || eq.tipo_equipo || ''
          attr.text = eq.nombre_categoria || eq.tipo_equipo || ''
        }
        if (attr.label === 'SUBCATEGORÍA / MODELO') {
          attr.default = `${eq.marca || ''} ${eq.modelo || ''}`.trim()
          attr.text = `${eq.marca || ''} ${eq.modelo || ''}`.trim()
        }
      })
    }

    const headerExec = {
      ...headerSeed,
      patente: eq.patente,
      tipo_movimiento: formPatio.tipo_movimiento,
      marca: eq.marca || '',
      modelo: eq.modelo || '',
      tipo_equipo: eq.nombre_categoria || eq.tipo_equipo || '',
      id_equipo: eq.id_equipo,
      observaciones: formPatio.observaciones || ''
    }

    const payload = {
      id_tipo_srv: Number(tpl.id_tipo_srv) || 2,
      id_template: 79,
      id_survey_padre: null,
      id_user: Number(uid),
      id_user_creacion: Number(uid),
      id_empresa_cliente: Number(eq.id_empresa || 11),
      estado_srv: 'CREADO',
      header_seed: JSON.stringify(headerSeed),
      body_seed: JSON.stringify(bodySeed),
      approval_seed: JSON.stringify(approvalSeed),
      header_exec: JSON.stringify(headerExec),
      body_exec: JSON.stringify(bodyExec),
      approval_exec: JSON.stringify(approvalSeed),
      fecha_plan_ini: fechaActual,
      fecha_plan_fin: fechaActual,
      id_flow_tmpl: tpl.id_flow_tmpl || 1
    }

    const { data } = await apiAxios.post('/survey/', payload)
    const idSurvey = data?.idSurvey || data?.id_survey
    if (idSurvey) {
      dialogPatio.value = false
      router.push({
        path: '/inspeccion',
        query: { idInspeccion: String(idSurvey) }
      })
    } else {
      throw new Error(data?.message || 'No se pudo generar el checklist')
    }
  } catch (err) {
    console.error('Error iniciando checklist de patio:', err)
    errorIniciandoPatio.value = err?.response?.data?.message || err?.message || 'Error al iniciar checklist'
  } finally {
    iniciandoPatio.value = false
  }
}

// =========================================================================
// MÓDULO BSM: ENTREGA 360°, RETIRO Y RETORNO ASÍNCRONO DE PLATAFORMAS (81)
// =========================================================================
const STORAGE_KEY_BSM_81 = 'gsp_plataforma_bsm_spec81_v2'
try { localStorage.removeItem('gsp_plataforma_bsm_spec81_v1') } catch (_) {}
const dialogPlataformaBsm = ref(false)
const modoPlataformaBsm = ref('ENTREGA')
const guardandoActaBsm = ref(false)
const mensajeExitoBsm = ref('')
const canvasEntregaRef = ref(null)
const canvasRetiroRef = ref(null)
const dibujandoFirmaBsm = ref(false)
const proyectosPlataformaDisponibles = ref([])
const idProyectoBsmSeleccionado = ref(null)
const equiposCatalogoBsm = ref([])
const viajeProyectoBsm = ref(null)
const viajesProyectoListaBsm = ref([])

const slotsFotos360 = [
  { key: 'frontal', label: '1. Vista Frontal' },
  { key: 'posterior', label: '2. Vista Posterior' },
  { key: 'lateral_izq', label: '3. Lateral Izquierdo' },
  { key: 'lateral_der', label: '4. Lateral Derecho' },
  { key: 'mandos_canastillo', label: '5. Mandos / Canastillo' },
  { key: 'horometro_placa', label: '6. Horómetro / Placa' }
]

const fotosAdicionalesEntrega = ref([])
const fotosAdicionalesRetiro = ref([])
const urlPdfEntregaBsm = ref('')
const urlPdfFinalBsm = ref('')

const opcionesCombustibleBsm = [
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

const CATALOGO_19_ITEMS_BSM = [
  'Alarma Traslación',
  'Baterías',
  'Arrancador Motor Aéreo y Tierra',
  'Interruptor de Parada de Emergencia',
  'Llave de Contacto',
  'Perillas de Tablero Control Bastidor',
  'Perillas de Tablero Control Canastillo',
  'Estado de Mangueras Hidráulicas',
  'Estado General de la Pluma',
  'Pintura de Equipo',
  'Pintura de Canastillo',
  'Puerta Canastillo',
  'Estado de Capot',
  'Estado de Neumáticos',
  'Estado de Joystick',
  'Baliza',
  'Tapa de Combustible',
  'Chapa de Contacto',
  'Otros'
]

const itemsChecklistBsm = ref(
  CATALOGO_19_ITEMS_BSM.map(nombre => ({
    nombre,
    entrega: 'SI',
    recepcion: 'SI',
    comentario: ''
  }))
)

const estadoPlataformaBsm = reactive({
  viajeIdaConcluido: false,
  entregaSellada: false,
  retiroSellado: false,
  viajeRetornoConcluido: false,
  timestampEntrega: null,
  timestampRetiro: null,
  timestampRetorno: null
})

const formBsm = reactive({
  arrendatario: '',
  rut_arrendatario: '',
  numero_contrato: '',
  id_equipo: null,
  direccion_obra: '',
  equipo_modelo: '',
  equipo_codigo: '',
  horometro_in: '',
  combustible_in: '100% (Lleno)',
  fotos_entrega: {
    frontal: '',
    posterior: '',
    lateral_izq: '',
    lateral_der: '',
    mandos_canastillo: '',
    horometro_placa: ''
  },
  observaciones_entrega: '',
  receptor_entrega_nombre: '',
  receptor_entrega_rut: '',
  receptor_entrega_cargo: '',
  firma_entrega_base64: '',
  pin_entrega: '',
  horometro_out: '',
  combustible_out: '100% (Lleno)',
  fotos_retiro: {
    frontal: '',
    posterior: '',
    lateral_izq: '',
    lateral_der: '',
    mandos_canastillo: '',
    horometro_placa: ''
  },
  observaciones_retiro: '',
  receptor_retiro_nombre: '',
  receptor_retiro_rut: '',
  receptor_retiro_cargo: '',
  firma_retiro_base64: '',
  pin_retiro: ''
})

const tieneViajeEnCurso = computed(() => {
  if (!viajeActivo.value) return false
  const est = String(viajeActivo.value.estado_trayecto || '').toUpperCase()
  return ['ASIGNADO', 'EN_RUTA'].includes(est)
})

const viajeIdaPlataformaCompletado = computed(() => {
  if (estadoPlataformaBsm.entregaSellada) return true
  const v = viajeProyectoBsm.value || (
    Number(viajeActivo.value?.id_proyecto) === Number(idProyectoBsmSeleccionado.value)
      ? viajeActivo.value
      : null
  )
  if (!v) return false
  const est = String(v.estado_trayecto || '').toUpperCase()
  const tipo = String(v.tipo_trayecto || '').toUpperCase()
  return ['ARRIBADO', 'LLEGADO', 'COMPLETADO'].includes(est) || Boolean(v.fecha_llegada_faena) || tipo === 'RETORNO'
})

const tokenViajePlataformaActivo = computed(() =>
  viajeProyectoBsm.value?.token_viaje || viajeActivo.value?.token_viaje || null
)

const actasPlataformaConcluidas = computed(() =>
  Boolean(estadoPlataformaBsm.entregaSellada && estadoPlataformaBsm.retiroSellado)
)

const tienePlataformaAsignada = computed(() => {
  if (!idProyectoBsmSeleccionado.value) return false
  if (actasPlataformaConcluidas.value) return false
  const uid = Number(idUser.value || JSON.parse(localStorage.getItem('perfil') || '{}')?.id_user)
  const v = viajeProyectoBsm.value || viajeActivo.value
  const esChoferDelViaje = v && Number(v.id_proyecto) === Number(idProyectoBsmSeleccionado.value) && (Number(v.id_user_chofer) === uid || [53, 59].includes(uid))
  const tieneActaEnCurso = Boolean(estadoPlataformaBsm.entregaSellada && !estadoPlataformaBsm.retiroSellado)
  const prySel = proyectosPlataformaDisponibles.value.find(p => Number(p.id_proyecto) === Number(idProyectoBsmSeleccionado.value))
  const jf = prySel?.raw ? (typeof prySel.raw.json_field === 'string' ? JSON.parse(prySel.raw.json_field) : (prySel.raw.json_field || {})) : {}
  const extras = Array.isArray(jf.ejecucion_v1?.equipos_extra) ? jf.ejecucion_v1.equipos_extra : []
  const asignadoEnExtras = extras.some(ex => Number(ex.chofer_id) === uid)
  const asignadoEnEjec = Number(jf.ejecucion_v1?.chofer_id) === uid || Number(jf.ejecucion_v1?.operador_id) === uid
  return Boolean(esChoferDelViaje || tieneActaEnCurso || asignadoEnExtras || asignadoEnEjec || route.query?.id_proyecto)
})

const conteoFotosEntregaBsm = computed(() =>
  Object.values(formBsm.fotos_entrega).filter(Boolean).length + fotosAdicionalesEntrega.value.length
)

const conteoFotosRetiroBsm = computed(() =>
  Object.values(formBsm.fotos_retiro).filter(Boolean).length + fotosAdicionalesRetiro.value.length
)

const esActaEntregaValida = computed(() =>
  viajeIdaPlataformaCompletado.value &&
  Boolean(formBsm.numero_contrato?.trim()) &&
  Boolean(formBsm.horometro_in) &&
  conteoFotosEntregaBsm.value >= 6 &&
  Boolean(formBsm.receptor_entrega_nombre?.trim()) &&
  Boolean(formBsm.receptor_entrega_rut?.trim()) &&
  Boolean(formBsm.receptor_entrega_cargo?.trim()) &&
  Boolean(formBsm.firma_entrega_base64) &&
  Boolean(formBsm.pin_entrega && formBsm.pin_entrega.length === 4)
)

const esActaRetiroValida = computed(() =>
  estadoPlataformaBsm.entregaSellada &&
  Boolean(formBsm.horometro_out) &&
  Number(formBsm.horometro_out) >= Number(formBsm.horometro_in || 0) &&
  conteoFotosRetiroBsm.value >= 6 &&
  Boolean(formBsm.receptor_retiro_nombre?.trim()) &&
  Boolean(formBsm.receptor_retiro_rut?.trim()) &&
  Boolean(formBsm.receptor_retiro_cargo?.trim()) &&
  Boolean(formBsm.firma_retiro_base64) &&
  Boolean(formBsm.pin_retiro && formBsm.pin_retiro.length === 4)
)

const agregarFotoAdicional = (etapa) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment'
  input.onchange = (ev) => {
    const file = ev.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const lista = etapa === 'ENTREGA' ? fotosAdicionalesEntrega : fotosAdicionalesRetiro
      lista.value.push({
        label: `Foto Extra ${lista.value.length + 1}`,
        data: String(reader.result)
      })
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

const eliminarFotoAdicional = (etapa, index) => {
  const lista = etapa === 'ENTREGA' ? fotosAdicionalesEntrega : fotosAdicionalesRetiro
  lista.value.splice(index, 1)
}

const verPdfActa = (url) => {
  if (!url) return
  if (url.startsWith('http')) {
    window.open(url, '_blank')
    return
  }
  const baseApi = (apiAxios.defaults.baseURL || 'https://servidor.leanglobal.cl/lg-gsp-dev/api').replace(/\/+$/, '')
  const cleanPath = url.replace(/^\/api/, '')
  window.open(`${baseApi}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`, '_blank')
}

const persistirEstadoPlataformaBsm = () => {
  try {
    const key = idProyectoBsmSeleccionado.value
      ? `${STORAGE_KEY_BSM_81}_pry_${idProyectoBsmSeleccionado.value}`
      : STORAGE_KEY_BSM_81
    localStorage.setItem(key, JSON.stringify({
      estado: { ...estadoPlataformaBsm },
      form: { ...formBsm },
      items: itemsChecklistBsm.value
    }))
  } catch (e) {
    console.warn('No se pudo persistir estado BSM en localStorage:', e)
  }
}

const restaurarEstadoPlataformaBsm = () => {
  try {
    const key = idProyectoBsmSeleccionado.value
      ? `${STORAGE_KEY_BSM_81}_pry_${idProyectoBsmSeleccionado.value}`
      : STORAGE_KEY_BSM_81
    const raw = localStorage.getItem(key)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed?.form) Object.assign(formBsm, parsed.form)
    if (Array.isArray(parsed?.items) && parsed.items.length === 19) {
      itemsChecklistBsm.value = parsed.items
    }
  } catch (e) {
    console.warn('No se pudo restaurar estado BSM:', e)
  }
}

const hidratarCabeceraDesdeProyecto = async (pry) => {
  if (!pry) return
  const jf = typeof pry.json_field === 'string' ? JSON.parse(pry.json_field) : (pry.json_field || {})
  const crm = jf.crm_v1 || {}
  const ejec = jf.ejecucion_v1 || {}
  const ctr = jf.contrato_arriendo || crm.contrato_arriendo || crm.contrato || {}
  const lineas = Array.isArray(crm.lineas_servicio) ? crm.lineas_servicio : []

  // Resetear estado antes de hidratar el proyecto seleccionado
  estadoPlataformaBsm.viajeIdaConcluido = false
  estadoPlataformaBsm.entregaSellada = false
  estadoPlataformaBsm.retiroSellado = false
  estadoPlataformaBsm.viajeRetornoConcluido = false
  estadoPlataformaBsm.timestampEntrega = null
  estadoPlataformaBsm.timestampRetiro = null
  estadoPlataformaBsm.timestampRetorno = null
  urlPdfEntregaBsm.value = ''
  urlPdfFinalBsm.value = ''

  // Buscar línea de plataforma o equipo principal
  const lineaPlat = lineas.find(l => {
    const txt = `${l.tipo || ''} ${l.subcategoria || ''} ${l.descripcion || ''}`.toUpperCase()
    return txt.includes('PLATAFORMA') || txt.includes('ALZA') || txt.includes('MANLIFT') || txt.includes('TIJERA') || txt.includes('ARTICULAD')
  }) || lineas.find(l => !String(l.tipo || '').toUpperCase().includes('TRASLADO')) || lineas[0] || {}

  const eqId = lineaPlat.equipo_asignado_id || ejec.equipo_id || null
  const eqObj = eqId ? equiposCatalogoBsm.value.find(e => Number(e.id_equipo) === Number(eqId)) : null

  formBsm.id_equipo = eqId || eqObj?.id_equipo || null
  formBsm.arrendatario = pry.razon_social || pry.nombre_cliente || crm.razon_social || viajeActivo.value?.cliente_nombre || ''
  formBsm.rut_arrendatario = pry.rut_cliente || crm.rut_cliente || ctr.representante_rut || ''
  formBsm.direccion_obra = [crm.obra_nombre || pry.nombre_proyecto, crm.obra_direccion, crm.obra_ciudad].filter(Boolean).join(' • ') || viajeActivo.value?.obra_nombre || ''
  const marcaModelo = eqObj ? [eqObj.marca, eqObj.modelo].filter(Boolean).join(' ') : ''
  formBsm.equipo_modelo = marcaModelo || eqObj?.nombre_equipo || lineaPlat.descripcion || lineaPlat.subcategoria || lineaPlat.tipo || ''
  formBsm.equipo_codigo = eqObj?.patente || eqObj?.codigo_interno || (eqId ? `ID-${eqId}` : '') || ''
  formBsm.numero_contrato = ctr.folio || ''

  // Si el proyecto ya tiene borrador en json_field, hidratar campos del formulario (el estado de sellado manda únicamente la tabla tope_acta_plataforma)
  const actaGuardada = ejec.acta_plataforma_360
  if (actaGuardada) {
    if (actaGuardada.form) {
      formBsm.numero_contrato = actaGuardada.form.numero_contrato || formBsm.numero_contrato
      formBsm.horometro_in = actaGuardada.form.horometro_in || ''
      formBsm.combustible_in = (actaGuardada.form.combustible_in && actaGuardada.form.combustible_in.includes('%')) ? actaGuardada.form.combustible_in : '100% (Lleno)'
      formBsm.observaciones_entrega = actaGuardada.form.observaciones_entrega || ''
      formBsm.receptor_entrega_nombre = actaGuardada.form.receptor_entrega_nombre || ''
      formBsm.receptor_entrega_rut = actaGuardada.form.receptor_entrega_rut || ''
      formBsm.receptor_entrega_cargo = actaGuardada.form.receptor_entrega_cargo || ''
      formBsm.firma_entrega_base64 = actaGuardada.form.firma_entrega_base64 || ''
      if (actaGuardada.form.fotos_entrega) Object.assign(formBsm.fotos_entrega, actaGuardada.form.fotos_entrega)
      formBsm.horometro_out = actaGuardada.form.horometro_out || ''
      formBsm.combustible_out = (actaGuardada.form.combustible_out && actaGuardada.form.combustible_out.includes('%')) ? actaGuardada.form.combustible_out : '100% (Lleno)'
      formBsm.observaciones_retiro = actaGuardada.form.observaciones_retiro || ''
      formBsm.receptor_retiro_nombre = actaGuardada.form.receptor_retiro_nombre || ''
      formBsm.receptor_retiro_rut = actaGuardada.form.receptor_retiro_rut || ''
      formBsm.receptor_retiro_cargo = actaGuardada.form.receptor_retiro_cargo || ''
      formBsm.firma_retiro_base64 = actaGuardada.form.firma_retiro_base64 || ''
      if (actaGuardada.form.fotos_retiro) Object.assign(formBsm.fotos_retiro, actaGuardada.form.fotos_retiro)
    }
    if (Array.isArray(actaGuardada.items) && actaGuardada.items.length === 19) {
      itemsChecklistBsm.value = actaGuardada.items
    }
  }

  // Consultar acta oficial en BD (sch_leangsp.tope_acta_plataforma) — Única fuente de verdad del sellado
  try {
    const resActa = await apiAxios.get(`/operaciones/acta-plataforma/proyecto/${pry.id_proyecto}`).catch(() => null)
    if (resActa?.data?.success && resActa?.data?.acta) {
      const a = resActa.data.acta
      urlPdfEntregaBsm.value = resActa.data.url_pdf_entrega || (a.id_file_pdf_entrega ? `/api/archivo/ver/${a.id_file_pdf_entrega}` : '')
      urlPdfFinalBsm.value = resActa.data.url_pdf_final || (a.id_file_pdf_final ? `/api/archivo/ver/${a.id_file_pdf_final}` : '')
      const estBd = String(a.estado || a.estado_acta || '').toUpperCase()
      if (estBd === 'ENTREGADA' || estBd === 'RECIBIDA_CONFORME' || estBd === 'EMITIDA_ENTREGA' || estBd === 'CERRADA_FINAL') {
        estadoPlataformaBsm.entregaSellada = true
      }
      if (estBd === 'RECIBIDA_CONFORME' || estBd === 'CERRADA_FINAL') {
        estadoPlataformaBsm.retiroSellado = true
      }
      if (a.horometro_in) formBsm.horometro_in = a.horometro_in
      if (a.combustible_in) formBsm.combustible_in = a.combustible_in.includes('%') ? a.combustible_in : '100% (Lleno)'
      if (a.horometro_out) formBsm.horometro_out = a.horometro_out
      if (a.combustible_out) formBsm.combustible_out = a.combustible_out.includes('%') ? a.combustible_out : '100% (Lleno)'
    }
  } catch (err) {
    console.warn('No se pudo cargar acta de BD:', err)
  }
}

const cargarViajeDeProyectoBsm = async (idPry, rawPry = null) => {
  if (!idPry) return
  try {
    let res = await apiAxios.get(`/viajes/proyecto/${idPry}`).catch(() => ({ data: { data: [] } }))
    let lista = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])

    // Si el proyecto tiene camión asignado en equipos_extra con chofer_id y aún no existe fila en tlog_desplazamiento, crearla automáticamente
    if (lista.length === 0 && rawPry) {
      const jf = typeof rawPry.json_field === 'string' ? JSON.parse(rawPry.json_field) : (rawPry.json_field || {})
      const extras = Array.isArray(jf.ejecucion_v1?.equipos_extra) ? jf.ejecucion_v1.equipos_extra : []
      const cam = extras.find(ex => ex.id_equipo && ex.chofer_id)
      if (cam) {
        await apiAxios.post('/operaciones/viaje/asignar', {
          id_proyecto: Number(idPry),
          id_equipo: Number(cam.id_equipo),
          id_user_chofer: Number(cam.chofer_id),
          tipo_trayecto: 'IDA'
        }).catch(() => null)
        res = await apiAxios.get(`/viajes/proyecto/${idPry}`).catch(() => ({ data: { data: [] } }))
        lista = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
      }
    }

    viajesProyectoListaBsm.value = lista
    const vIda = lista.find(v => String(v.tipo_trayecto || 'IDA').toUpperCase() === 'IDA') || lista[0] || null
    const vActivo = lista.find(v => ['ASIGNADO', 'EN_RUTA'].includes(String(v.estado_trayecto || '').toUpperCase())) || vIda

    if (vActivo) {
      const jf = rawPry ? (typeof rawPry.json_field === 'string' ? JSON.parse(rawPry.json_field) : (rawPry.json_field || {})) : {}
      const crm = jf.crm_v1 || {}
      const enriquecido = {
        ...vActivo,
        codi_proyecto: vActivo.codi_proyecto || rawPry?.codi_proyecto || `OT-${idPry}`,
        obra_nombre: vActivo.obra_nombre || crm.obra_nombre || rawPry?.nombre_proyecto || 'Faena',
        cliente_nombre: vActivo.cliente_nombre || rawPry?.razon_social || crm.razon_social || ''
      }
      viajeProyectoBsm.value = enriquecido
      estadoPlataformaBsm.viajeIdaConcluido = ['ARRIBADO', 'LLEGADO', 'COMPLETADO'].includes(String(enriquecido.estado_trayecto || '').toUpperCase()) || Boolean(enriquecido.fecha_llegada_faena)

      // Si viajeActivo está vacío o apunta a un viaje antiguo ya ARRIBADO de otro proyecto menor, priorizar el viaje activo de este proyecto
      const estActual = String(viajeActivo.value?.estado_trayecto || '').toUpperCase()
      const estNuevo = String(enriquecido.estado_trayecto || '').toUpperCase()
      if (
        !viajeActivo.value ||
        (['ARRIBADO', 'LLEGADO', 'COMPLETADO'].includes(estActual) && Number(viajeActivo.value?.id_proyecto) < Number(idPry) && ['ASIGNADO', 'EN_RUTA'].includes(estNuevo))
      ) {
        viajeActivo.value = enriquecido
      }
    } else {
      viajeProyectoBsm.value = null
    }
  } catch (e) {
    console.warn('Error consultando viajes del proyecto BSM:', e)
  }
}

const onSeleccionarProyectoBsm = async (idPry) => {
  const found = proyectosPlataformaDisponibles.value.find(p => Number(p.id_proyecto) === Number(idPry))
  if (found?.raw) {
    await hidratarCabeceraDesdeProyecto(found.raw)
    await cargarViajeDeProyectoBsm(idPry, found.raw)
  }
}

const cargarDatosRealesPlataformaBsm = async () => {
  try {
    const [resPry, resEq] = await Promise.all([
      apiAxios.get('/proyectos').catch(() => ({ data: [] })),
      apiAxios.get('/tequ-equipos').catch(() => ({ data: [] }))
    ])
    const listaEq = Array.isArray(resEq.data?.data)
      ? resEq.data.data
      : (Array.isArray(resEq.data) ? resEq.data : (resEq.data?.equipos || []))
    equiposCatalogoBsm.value = listaEq

    const listaPry = Array.isArray(resPry.data) ? resPry.data : (resPry.data?.proyectos || [])
    // Filtrar proyectos con plataformas/arriendo y ordenar del más reciente al más antiguo
    const candidatos = listaPry.filter(p => {
      if (Number(p.id_proyecto_estado) === 99) return false
      const jf = typeof p.json_field === 'string' ? JSON.parse(p.json_field) : (p.json_field || {})
      const crm = jf.crm_v1 || {}
      const lineas = Array.isArray(crm.lineas_servicio) ? crm.lineas_servicio : []
      const tienePlat = lineas.some(l => {
        const txt = `${l.tipo || ''} ${l.subcategoria || ''} ${l.descripcion || ''}`.toUpperCase()
        return txt.includes('PLATAFORMA') || txt.includes('ALZA') || txt.includes('MANLIFT') || txt.includes('TIJERA') || txt.includes('ARTICULAD')
      })
      return tienePlat || Number(crm.tipo_caso) === 5 || Number(p.id_empresa) === 11 || String(p.codi_proyecto || '').toUpperCase().startsWith('BMQ')
    }).sort((a, b) => Number(b.id_proyecto) - Number(a.id_proyecto))

    proyectosPlataformaDisponibles.value = candidatos.map(p => {
      const jf = typeof p.json_field === 'string' ? JSON.parse(p.json_field) : (p.json_field || {})
      const crm = jf.crm_v1 || {}
      const cod = p.codi_proyecto || `OT-${p.id_proyecto}`
      const cli = p.razon_social || crm.razon_social || 'Cliente'
      const obra = crm.obra_nombre || p.nombre_proyecto || 'Obra'
      return {
        id_proyecto: p.id_proyecto,
        label: `${cod} • ${cli} (${obra})`,
        raw: p
      }
    })

    const uid = Number(idUser.value || JSON.parse(localStorage.getItem('perfil') || '{}')?.id_user)
    const queryPryId = route.query?.id_proyecto ? Number(route.query.id_proyecto) : null
    const activeIsCandidate = viajeActivo.value?.id_proyecto && candidatos.some(c => Number(c.id_proyecto) === Number(viajeActivo.value.id_proyecto))

    // Buscar si el usuario actual tiene asignación específica en alguno de los proyectos de plataforma
    const candidatoAsignado = candidatos.find(c => {
      if (viajeActivo.value?.id_proyecto && Number(c.id_proyecto) === Number(viajeActivo.value.id_proyecto)) {
        return true
      }
      const jf = typeof c.json_field === 'string' ? JSON.parse(c.json_field) : (c.json_field || {})
      const extras = Array.isArray(jf.ejecucion_v1?.equipos_extra) ? jf.ejecucion_v1.equipos_extra : []
      if (extras.some(ex => Number(ex.chofer_id) === uid)) return true
      if (Number(jf.ejecucion_v1?.chofer_id) === uid || Number(jf.ejecucion_v1?.operador_id) === uid) return true
      return false
    })

    const targetId = queryPryId || (activeIsCandidate ? viajeActivo.value.id_proyecto : null) || candidatoAsignado?.id_proyecto || (idProyectoBsmSeleccionado.value && candidatos.some(c => Number(c.id_proyecto) === Number(idProyectoBsmSeleccionado.value)) ? idProyectoBsmSeleccionado.value : null)
    if (targetId) {
      idProyectoBsmSeleccionado.value = Number(targetId)
      const sel = proyectosPlataformaDisponibles.value.find(x => Number(x.id_proyecto) === Number(targetId))
      if (sel?.raw) {
        await hidratarCabeceraDesdeProyecto(sel.raw)
        await cargarViajeDeProyectoBsm(targetId, sel.raw)
        // Si el retiro ya está sellado y no hay viaje de retorno activo, asegurar su creación inmediata
        if (estadoPlataformaBsm.retiroSellado && (!viajeActivo.value || viajeActivo.value.tipo_trayecto !== 'RETORNO')) {
          try {
            const vBase = viajeProyectoBsm.value || viajeActivo.value || {}
            await apiAxios.post('/operaciones/viaje/asignar', {
              id_proyecto: Number(targetId),
              id_equipo: Number(vBase.id_equipo || formBsm.id_equipo || 1),
              id_user_chofer: Number(vBase.id_user_chofer || uid),
              tipo_trayecto: 'RETORNO'
            })
            await consultarViajeActivo()
          } catch (_) {}
        }
      }
    } else {
      idProyectoBsmSeleccionado.value = null
    }
  } catch (e) {
    console.warn('Error cargando proyectos reales para Acta BSM:', e)
  }
}

const iniciarViajeRetornoPlataformaBsm = async () => {
  const pId = idProyectoBsmSeleccionado.value || viajeProyectoBsm.value?.id_proyecto || viajeActivo.value?.id_proyecto
  if (!pId) return
  try {
    // Verificar si ya existe un viaje de RETORNO para este proyecto
    const existenteRetorno = viajesProyectoListaBsm.value.find(v => String(v.tipo_trayecto || '').toUpperCase() === 'RETORNO')
    if (existenteRetorno?.token_viaje) {
      abrirViajeNativo(existenteRetorno.token_viaje)
      return
    }
    const vBase = viajeProyectoBsm.value || viajeActivo.value
    if (vBase?.id_equipo && vBase?.id_user_chofer) {
      const { data } = await apiAxios.post('/operaciones/viaje/asignar', {
        id_proyecto: Number(pId),
        id_equipo: Number(vBase.id_equipo),
        id_user_chofer: Number(vBase.id_user_chofer),
        tipo_trayecto: 'RETORNO'
      })
      if (data?.token_viaje) {
        abrirViajeNativo(data.token_viaje)
        return
      }
    }
    if (tokenViajePlataformaActivo.value) {
      abrirViajeNativo(tokenViajePlataformaActivo.value)
    }
  } catch (e) {
    console.warn('Error iniciando viaje de retorno de plataforma:', e)
    if (tokenViajePlataformaActivo.value) {
      abrirViajeNativo(tokenViajePlataformaActivo.value)
    }
  }
}

const abrirModalPlataformaBsm = async (modo = 'ENTREGA') => {
  await cargarDatosRealesPlataformaBsm()
  if (modo === 'ENTREGA' && !viajeIdaPlataformaCompletado.value) {
    modoPlataformaBsm.value = 'ENTREGA'
    mensajeExitoBsm.value = ''
    dialogPlataformaBsm.value = true
    return
  }
  modoPlataformaBsm.value = modo
  mensajeExitoBsm.value = ''
  dialogPlataformaBsm.value = true
}

const cambiarModoPlataformaBsm = (modo) => {
  if (modo === 'RETIRO' && !estadoPlataformaBsm.entregaSellada) return
  modoPlataformaBsm.value = modo
  mensajeExitoBsm.value = ''
}

const marcarTodosItemsBsm = (columna, valor) => {
  itemsChecklistBsm.value.forEach(it => {
    if (columna === 'ENTREGA') it.entrega = valor
    else it.recepcion = valor
  })
}

const seleccionarFoto360 = (etapa, slotKey) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment'
  input.onchange = (ev) => {
    const file = ev.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (etapa === 'ENTREGA') formBsm.fotos_entrega[slotKey] = String(reader.result)
      else formBsm.fotos_retiro[slotKey] = String(reader.result)
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

const iniciarTrazoCanvas = (e, etapa) => {
  const canvas = etapa === 'ENTREGA' ? canvasEntregaRef.value : canvasRetiroRef.value
  if (!canvas) return
  dibujandoFirmaBsm.value = true
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const ctx = canvas.getContext('2d')
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 2.6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
}

const dibujarTrazoCanvas = (e, etapa) => {
  if (!dibujandoFirmaBsm.value) return
  const canvas = etapa === 'ENTREGA' ? canvasEntregaRef.value : canvasRetiroRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const ctx = canvas.getContext('2d')
  ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
  ctx.stroke()
}

const finalizarTrazoCanvas = (etapa) => {
  if (!dibujandoFirmaBsm.value) return
  dibujandoFirmaBsm.value = false
  const canvas = etapa === 'ENTREGA' ? canvasEntregaRef.value : canvasRetiroRef.value
  if (!canvas) return
  const dataUrl = canvas.toDataURL('image/png')
  if (etapa === 'ENTREGA') formBsm.firma_entrega_base64 = dataUrl
  else formBsm.firma_retiro_base64 = dataUrl
}

const limpiarCanvasFirma = (etapa) => {
  const canvas = etapa === 'ENTREGA' ? canvasEntregaRef.value : canvasRetiroRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  if (etapa === 'ENTREGA') formBsm.firma_entrega_base64 = ''
  else formBsm.firma_retiro_base64 = ''
}

const guardarActaEnProyectoBackend = async () => {
  const pId = idProyectoBsmSeleccionado.value || viajeActivo.value?.id_proyecto
  if (!pId) return
  try {
    const { data } = await apiAxios.get(`/proyectos/${pId}`)
    const pry = data?.proyecto || data
    if (!pry) return
    const jf = typeof pry.json_field === 'string' ? JSON.parse(pry.json_field) : (pry.json_field || {})
    if (!jf.ejecucion_v1) jf.ejecucion_v1 = {}
    jf.ejecucion_v1.acta_plataforma_360 = {
      estado: { ...estadoPlataformaBsm },
      form: { ...formBsm },
      items: itemsChecklistBsm.value,
      updated_at: new Date().toISOString()
    }
    await apiAxios.put(`/proyectos/${pId}`, {
      ...pry,
      json_field: jf
    })
  } catch (err) {
    console.warn('No se pudo sincronizar acta_plataforma_360 en backend:', err)
  }
}

const sellarActaEntregaBsm = async () => {
  if (!viajeIdaPlataformaCompletado.value || !esActaEntregaValida.value) return
  guardandoActaBsm.value = true
  try {
    const pId = Number(idProyectoBsmSeleccionado.value || viajeActivo.value?.id_proyecto)
    const vObj = viajeProyectoBsm.value || viajeActivo.value || {}

    // Compilar fotos base (6 slots obligatorios) + fotos adicionales
    const fotosPayload = [
      { label: 'Frontal', data: formBsm.fotos_entrega.frontal },
      { label: 'Posterior', data: formBsm.fotos_entrega.posterior },
      { label: 'Lateral Izquierdo', data: formBsm.fotos_entrega.lateral_izq },
      { label: 'Lateral Derecho', data: formBsm.fotos_entrega.lateral_der },
      { label: 'Mandos / Canastillo', data: formBsm.fotos_entrega.mandos_canastillo },
      { label: 'Horómetro / Placa', data: formBsm.fotos_entrega.horometro_placa },
      ...fotosAdicionalesEntrega.value.map(f => ({ label: f.label || 'Foto Extra', data: f.data }))
    ].filter(f => Boolean(f.data))

    const payload = {
      id_proyecto: pId,
      id_equipo: Number(formBsm.id_equipo || vObj.id_equipo || 1),
      id_camion: Number(vObj.id_equipo || null),
      id_desplazamiento_ida: Number(vObj.id_desplazamiento || null),
      numero_contrato: formBsm.numero_contrato,
      horometro_in: formBsm.horometro_in,
      combustible_in: formBsm.combustible_in,
      checklist_entrega: itemsChecklistBsm.value.map(it => ({ id: it.id, item: it.nombre, valor: it.entrega })),
      fotos_entrega: fotosPayload,
      obs_entrega: formBsm.observaciones_entrega,
      receptor_entrega_nombre: formBsm.receptor_entrega_nombre,
      receptor_entrega_rut: formBsm.receptor_entrega_rut,
      receptor_entrega_cargo: formBsm.receptor_entrega_cargo,
      firma_entrega_base64: formBsm.firma_entrega_base64,
      pin: formBsm.pin_entrega
    }

    const { data } = await apiAxios.post('/operaciones/acta-plataforma/guardar-entrega', payload)
    if (data?.success) {
      urlPdfEntregaBsm.value = data.url_pdf || (data.acta?.id_file_pdf_entrega ? `/api/archivo/ver/${data.acta.id_file_pdf_entrega}` : '')
      estadoPlataformaBsm.entregaSellada = true
      estadoPlataformaBsm.timestampEntrega = new Date().toISOString()
      persistirEstadoPlataformaBsm()
      await guardarActaEnProyectoBackend()
      mensajeExitoBsm.value = `¡Acta de Entrega ${data.acta?.folio_acta || ''} emitida y guardada con éxito! La plataforma queda EN ARRIENDO ACTIVO en obra.`
      setTimeout(() => {
        dialogPlataformaBsm.value = false
      }, 1200)
    }
  } catch (err) {
    console.error('Error al sellar acta de entrega BSM:', err)
    mensajeExitoBsm.value = `Error al guardar acta en servidor: ${err.response?.data?.error || err.message}`
  } finally {
    guardandoActaBsm.value = false
  }
}

const sellarActaRetiroBsm = async () => {
  if (!esActaRetiroValida.value) return
  guardandoActaBsm.value = true
  try {
    const pId = Number(idProyectoBsmSeleccionado.value || viajeActivo.value?.id_proyecto)
    const vObj = viajeProyectoBsm.value || viajeActivo.value || {}

    // Compilar fotos base de retiro (6 slots obligatorios) + fotos adicionales
    const fotosPayload = [
      { label: 'Frontal', data: formBsm.fotos_retiro.frontal },
      { label: 'Posterior', data: formBsm.fotos_retiro.posterior },
      { label: 'Lateral Izquierdo', data: formBsm.fotos_retiro.lateral_izq },
      { label: 'Lateral Derecho', data: formBsm.fotos_retiro.lateral_der },
      { label: 'Mandos / Canastillo', data: formBsm.fotos_retiro.mandos_canastillo },
      { label: 'Horómetro / Placa', data: formBsm.fotos_retiro.horometro_placa },
      ...fotosAdicionalesRetiro.value.map(f => ({ label: f.label || 'Foto Extra', data: f.data }))
    ].filter(f => Boolean(f.data))

    const payload = {
      id_proyecto: pId,
      id_desplazamiento_retorno: Number(vObj.id_desplazamiento || null),
      horometro_out: formBsm.horometro_out,
      combustible_out: formBsm.combustible_out,
      checklist_retiro: itemsChecklistBsm.value.map(it => ({ id: it.id, item: it.nombre, valor: it.recepcion })),
      fotos_retiro: fotosPayload,
      obs_retiro: formBsm.observaciones_retiro,
      receptor_retiro_nombre: formBsm.receptor_retiro_nombre,
      receptor_retiro_rut: formBsm.receptor_retiro_rut,
      receptor_retiro_cargo: formBsm.receptor_retiro_cargo,
      firma_retiro_base64: formBsm.firma_retiro_base64,
      pin: formBsm.pin_retiro
    }

    const { data } = await apiAxios.post('/operaciones/acta-plataforma/guardar-retiro', payload)
    if (data?.success) {
      urlPdfFinalBsm.value = data.url_pdf || (data.acta?.id_file_pdf_final ? `/api/archivo/ver/${data.acta.id_file_pdf_final}` : '')
      estadoPlataformaBsm.retiroSellado = true
      estadoPlataformaBsm.timestampRetiro = new Date().toISOString()
      persistirEstadoPlataformaBsm()
      await guardarActaEnProyectoBackend()

      // Habilitar de inmediato el viaje de retorno en el Bloque A superior
      try {
        const uid = Number(idUser.value || JSON.parse(localStorage.getItem('perfil') || '{}')?.id_user)
        const vBase = viajeProyectoBsm.value || viajeActivo.value || {}
        await apiAxios.post('/operaciones/viaje/asignar', {
          id_proyecto: Number(pId),
          id_equipo: Number(vBase.id_equipo || formBsm.id_equipo || 1),
          id_user_chofer: Number(vBase.id_user_chofer || uid),
          tipo_trayecto: 'RETORNO'
        })
        await consultarViajeActivo()
      } catch (errViaje) {
        console.warn('Error auto-asignando viaje de retorno:', errViaje)
      }

      mensajeExitoBsm.value = `¡Acta de Recuperación y Cierre ${data.acta?.folio_acta || ''} emitida con éxito! Viaje de Retorno a Patio habilitado en su Hoja de Ruta.`
      setTimeout(() => {
        dialogPlataformaBsm.value = false
      }, 1200)
    }
  } catch (err) {
    console.error('Error al sellar acta de retiro BSM:', err)
    mensajeExitoBsm.value = `Error al guardar acta de retiro en servidor: ${err.response?.data?.error || err.message}`
  } finally {
    guardandoActaBsm.value = false
  }
}

const consultarViajeActivo = async () => {
  const perfilLocal = JSON.parse(localStorage.getItem('perfil') || '{}')
  const uid = idUser.value || perfilLocal?.id_user || perfilLocal?.ID_USUARIO
  if (!uid) return
  try {
    cargandoViajeActivo.value = true
    const { data } = await apiAxios.get('/viajes/usuario/activo', { params: { id_user: uid } })
    let viajeEncontrado = (data?.activo && data?.data) ? data.data : null

    // Si el usuario es lguser (existe duplicado id_user 53 y 59 en DEV), consultar también el homólogo
    const uInfo = userDetailStore.userDetail || perfilLocal || {}
    const uStr = `${uInfo.nombre_user || ''} ${uInfo.email || ''} ${uInfo.codi_user || ''}`.toLowerCase()
    if (!viajeEncontrado && (Number(uid) === 53 || uStr.includes('lguser'))) {
      const altId = Number(uid) === 53 ? 59 : 53
      const resAlt = await apiAxios.get('/viajes/usuario/activo', { params: { id_user: altId } }).catch(() => null)
      if (resAlt?.data?.activo && resAlt?.data?.data) {
        viajeEncontrado = resAlt.data.data
      }
    }

    viajeActivo.value = viajeEncontrado
  } catch (err) {
    console.warn('No se pudo consultar viaje activo:', err)
  } finally {
    cargandoViajeActivo.value = false
  }
}

const abrirViajeNativo = (token) => {
  if (!token) return
  router.push(`/viaje/${token}`)
}

const consultarReportsPendientes = async () => {
  const perfilLocal = JSON.parse(localStorage.getItem('perfil') || '{}')
  const uid = idUser.value || perfilLocal?.id_user || perfilLocal?.ID_USUARIO
  if (!uid) return
  try {
    cargandoReportsPendientes.value = true
    const { data } = await apiAxios.get('/reports/usuario/pendientes', { params: { id_user: uid } })
    if (data?.success) {
      reportsPendientes.value = data.pendientes || []
      reportsConcluidos.value = data.concluidos || []
      indiceReportSeleccionado.value = 0
    }
  } catch (err) {
    console.warn('No se pudo consultar reports pendientes:', err)
  } finally {
    cargandoReportsPendientes.value = false
  }
}

const abrirReportDiario = (idProyecto, idEquipo, idReporteAvance = null) => {
  if (!idProyecto) return
  // REQ-1060 / SPEC-088: se navega con la IDENTIDAD de la jornada (id_reporte_avance), no solo con el equipo
  const params = new URLSearchParams({ id_proyecto: String(idProyecto) })
  if (idEquipo) params.set('id_equipo', String(idEquipo))
  if (idReporteAvance) params.set('id_reporte_avance', String(idReporteAvance))
  const query = `?${params.toString()}`
  router.push(`/reportDiario${query}`)
}

const filtros = ref([
  { ID: 1, NOMBRE: 'Creado' },
  { ID: 2, NOMBRE: 'Ejecución' },
  { ID: 4, NOMBRE: 'VERIFICACION' },
  { ID: 5, NOMBRE: 'APROBADO' }
])

const verTerminados = ref(false)

const filtro = ref(null)
const filtroTexto = ref('')
const surveys = ref([])
const surveysRawById = ref({})
const filtroDim = ref(null)
const filtroDimension = ref([])
const dialogRegistrarProtocolo = ref(false)
const loadingCatalogoProtocolo = ref(false)
const loadingProyectosCatalogo = ref(false)
const creandoProtocolo = ref(false)
const errorCrearProtocolo = ref('')
const templatesCatalogo = ref([])
const metaByTemplateMap = ref(new Map())
const templatesEnriquecidos = computed(() => {
  const selectedClient = Number(formProtocolo.id_empresa_cliente);
  const targetClient = (selectedClient === 7 || selectedClient === 8) ? 3 : selectedClient;

  const filtrados = (templatesCatalogo.value || []).filter(t =>
    Number(t?.id_template) > 0 &&
    metaByTemplateMap.value.has(Number(t.id_template)) &&
    cumpleFiltroTemplate(t) &&
    t.flag_autonomo === true &&
    (!selectedClient || Number(t.id_empresa_cliente) === targetClient)
  )

  return filtrados.map(t => {
    const meta = metaByTemplateMap.value.get(Number(t.id_template))
    return {
      ...t,
      id_area: meta.id_area,
      name_area: meta.name_area,
      name_tipo_srv: meta.name_tipo_srv
    }
  })
})
const clientesCatalogo = ref([])
const proyectosCatalogo = ref([])
const usuariosCatalogo = ref([])
const rolesCatalogo = ref([])
const usuariosRolesCatalogo = ref([])
const rolesSesionReady = ref(false)
const flujoPlantillaSteps = ref([])
const loadingFlujoPlantilla = ref(false)
const surveyCreadoProtocoloId = ref(null)
const formProtocolo = reactive({
  area: null,
  familia: null,
  id_template: null,
  id_empresa_cliente: null,
  id_proyecto: null
})
const notificaciones = ref([])
const bodyExecDetalleBySurvey = ref({})
const surveyDetailRawById = ref({})
const surveyVinculoBySurvey = ref({})
const parentDetailByChildSurvey = ref({})
const nombresUsuariosById = ref({})
const navigatingToInspeccion = ref(false)
const lastGoToInspeccionAt = ref(0)
const expandedConexionRows = ref(new Set())

const isExternalCompany = computed(() => (
  userDetailStore.userDetail?.isExternalCompany === true ||
  localStorage.getItem('isExternalCompany') === 'true'
))

function parseLocalRolesNames() {
  const raw = localStorage.getItem('rolesNames')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map(r => (typeof r === 'string' ? r : r?.name_rol)).filter(Boolean)
    }
  } catch {}
  return String(raw)
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
}

const hasCnxRole = computed(() => {
  const uid = Number(userDetailStore.userDetail?.id_user || 0)
  const fromUserDetail = Array.isArray(userDetailStore.userDetail?.usuarioRoles)
    ? userDetailStore.userDetail.usuarioRoles.filter(r => {
      if (typeof r !== 'object' || !r) return true
      const ridUser = Number(r?.id_user || 0)
      return !ridUser || !uid || ridUser === uid
    })
    : []

  const roleNameById = new Map(
    (rolesCatalogo.value || [])
      .map(r => [Number(r?.id_rol), String(r?.name_rol || '').trim()])
      .filter(([id, name]) => id > 0 && !!name)
  )

  const fromCatalogo = (usuariosRolesCatalogo.value || [])
    .filter(ur => Number(ur?.id_user || 0) === uid)
    .map(ur => roleNameById.get(Number(ur?.id_rol || 0)))
    .filter(Boolean)

  const roleNames = [
    ...fromUserDetail.map(r => (typeof r === 'string' ? r : r?.name_rol)).filter(Boolean),
    ...fromCatalogo,
    ...parseLocalRolesNames()
  ]

  return roleNames.some(name => {
    const normalized = String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase()
    return normalized.startsWith('CNX') || normalized.includes('CONEXION')
  })
})

const userRoleNames = computed(() => {
  const uid = Number(idUser.value || 0)
  if (!uid) return []

  const fromUserDetail = Array.isArray(userDetailStore.userDetail?.usuarioRoles)
    ? userDetailStore.userDetail.usuarioRoles.filter(r => {
      if (typeof r !== 'object' || !r) return true
      const ridUser = Number(r?.id_user || 0)
      return !ridUser || ridUser === uid
    })
    : []

  const roleNameById = new Map(
    (rolesCatalogo.value || [])
      .map(r => [Number(r?.id_rol), String(r?.name_rol || '').trim()])
      .filter(([id, name]) => id > 0 && !!name)
  )

  const fromCatalogo = (usuariosRolesCatalogo.value || [])
    .filter(ur => Number(ur?.id_user || 0) === uid)
    .map(ur => roleNameById.get(Number(ur?.id_rol || 0)))
    .filter(Boolean)

  const names = [
    ...fromUserDetail.map(r => (typeof r === 'string' ? r : r?.name_rol)).filter(Boolean),
    ...fromCatalogo,
    ...parseLocalRolesNames()
  ]

  return [...new Set(names.map(n => String(n || '').trim().toUpperCase()))]
})

const clientesFiltrados = computed(() => {
  const rawList = clientesCatalogo.value || []
  const list = rawList.filter(c => {
    const id = Number(c.id_empresa);
    return id !== 4; // Excluir Pelambres (4) de SST
  })
  const roles = userRoleNames.value || []

  // Si es Administrador, no se restringe por contrato (comparación insensible a mayúsculas)
  if (roles.some(r => String(r).toUpperCase().includes('ADMIN'))) {
    return list
  }

  if (roles.some(r => r.startsWith('CDLC_DMH'))) {
    return list.filter(c => Number(c.id_empresa) === 3) // Codelco Ministro Hales
  }
  if (roles.some(r => r.startsWith('CDLC_DCH'))) {
    return list.filter(c => Number(c.id_empresa) === 6) // Codelco Chuquicamata
  }
  if (roles.some(r => r.startsWith('CDLC_SPOT'))) {
    return list.filter(c => [3, 6, 9].includes(Number(c.id_empresa))) // Ministro Hales, Chuquicamata, Distrito Norte
  }
  if (roles.some(r => r.startsWith('AMSA_MLP'))) {
    return list.filter(c => Number(c.id_empresa) === 4) // Minera Los Pelambres
  }
  if (roles.some(r => r.startsWith('TMAC_CALM') || r.startsWith('TMAC_LAND'))) {
    return list.filter(c => Number(c.id_empresa) === 1) // Transmac Ltda
  }
  return list
})

const proyectosFiltrados = computed(() => {
  const list = proyectosCatalogo.value || []
  const roles = userRoleNames.value || []

  // Si es Administrador, no se restringe por contrato (comparación insensible a mayúsculas)
  if (roles.some(r => String(r).toUpperCase().includes('ADMIN'))) {
    return list
  }

  if (roles.some(r => r.startsWith('CDLC_DMH'))) {
    return list.filter(p => [2, 4, 10].includes(Number(p.id_proyecto))) // Ministro Hales Mina, Spot, Planta
  }
  if (roles.some(r => r.startsWith('CDLC_DCH'))) {
    return list.filter(p => [1, 11].includes(Number(p.id_proyecto))) // Chuquicamata
  }
  if (roles.some(r => r.startsWith('CDLC_SPOT'))) {
    return list.filter(p => [4, 11].includes(Number(p.id_proyecto))) // Spot Ministro Hales, Spot Chuquicamata
  }
  if (roles.some(r => r.startsWith('AMSA_MLP'))) {
    return list.filter(p => Number(p.id_proyecto) === 3) // Minera Los Pelambres
  }
  if (roles.some(r => r.startsWith('TMAC_CALM'))) {
    return list.filter(p => Number(p.id_proyecto) === 7) // Suc. Calama
  }
  if (roles.some(r => r.startsWith('TMAC_LAND'))) {
    return list.filter(p => Number(p.id_proyecto) === 8) // Suc. Los Andes
  }
  return list
})

watch(clientesFiltrados, (newList) => {
  if (newList.length === 1 && formProtocolo.id_empresa_cliente !== newList[0].id_empresa) {
    formProtocolo.id_empresa_cliente = newList[0].id_empresa
  }
}, { immediate: true })

watch(proyectosFiltrados, (newList) => {
  if (newList.length === 1 && formProtocolo.id_proyecto !== newList[0].id_proyecto) {
    formProtocolo.id_proyecto = newList[0].id_proyecto
  }
}, { immediate: true })

watch(verTerminados, () => {
  getSurvey()
})

async function cargarRolesSesion() {
  try {
    const [{ data: rolesData }, { data: usuariosRolesData }] = await Promise.all([
      apiAxios.get('/servicio/leanglobal/obtenerRoles'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles')
    ])
    rolesCatalogo.value = Array.isArray(rolesData) ? rolesData : []
    usuariosRolesCatalogo.value = Array.isArray(usuariosRolesData) ? usuariosRolesData : []
  } catch (error) {
    console.error('[Survey] Error cargando roles de sesión:', error)
  } finally {
    rolesSesionReady.value = true
  }
}

const templateFilterMode = computed(() => {
  const fromMeta = route.meta?.templateFilter
  if (fromMeta === 'only153' || fromMeta === 'exclude153') return fromMeta
  return route.path === '/reclamos' ? 'only153' : 'exclude153'
})
const esVistaReclamos = computed(() => templateFilterMode.value === 'only153')
const esVistaAsignacionesCnx = computed(() => {
  const fromMeta = String(route.meta?.viewMode || '').trim().toLowerCase()
  return fromMeta === 'asignaciones-cnx' || route.path === '/asignaciones'
})
const tituloAsignacionDia = computed(() => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
})

const areasOptions = computed(() => {
  const uniques = new Map()
  for (const t of templatesEnriquecidos.value) {
    const key = String(t?.name_area || '').trim()
    if (!key || uniques.has(key)) continue
    // Excluir "Administración" (sin importar tildes o mayúsculas/minúsculas)
    const upperKey = key.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (upperKey.includes('ADMINISTRACION')) continue
    uniques.set(key, { name_area: key })
  }
  return [...uniques.values()].sort((a, b) => a.name_area.localeCompare(b.name_area, 'es', { sensitivity: 'base' }))
})

const familiasOptions = computed(() => {
  if (!formProtocolo.area) return []
  const uniques = new Map()
  for (const t of templatesEnriquecidos.value) {
    if (String(t?.name_area || '') !== String(formProtocolo.area)) continue
    const key = String(t?.name_tipo_srv || '').trim()
    if (!key || uniques.has(key)) continue
    uniques.set(key, { familia: key })
  }
  return [...uniques.values()].sort((a, b) => a.familia.localeCompare(b.familia, 'es', { sensitivity: 'base' }))
})

const protocolosOptions = computed(() => {
  if (!formProtocolo.area || !formProtocolo.familia) return []
  return (templatesEnriquecidos.value || [])
    .filter(t =>
      String(t?.name_area || '') === String(formProtocolo.area) &&
      String(t?.name_tipo_srv || '') === String(formProtocolo.familia)
    )
    .map(t => ({
      ...t,
      display_name: `[${t.codi_template_srv}] / ${t.name_template_srv}`
    }))
    .sort((a, b) => String(a?.codi_template_srv || '').localeCompare(String(b?.codi_template_srv || ''), 'es', { sensitivity: 'base' }))
})

const rolNameToId = computed(() => {
  const m = Object.create(null)
  for (const r of rolesCatalogo.value) m[r.name_rol] = Number(r.id_rol)
  return m
})

const usersByRolId = computed(() => {
  const m = new Map()
  for (const ur of usuariosRolesCatalogo.value) {
    const rid = Number(ur.id_rol)
    const uid = Number(ur.id_user)
    if (!rid || !uid) continue
    if (!m.has(rid)) m.set(rid, new Set())
    m.get(rid).add(uid)
  }
  return m
})

const usuariosCatalogoOrdenados = computed(() =>
  [...(usuariosCatalogo.value || [])]
    .filter(u => String(u?.nombre_user || '').trim().length > 0)
    .sort((a, b) =>
      String(a?.nombre_user || '').localeCompare(String(b?.nombre_user || ''), 'es', { sensitivity: 'base' })
    )
)

const flujoSeleccionCompleto = computed(() =>
  (flujoPlantillaSteps.value || []).every(s => !!Number(s?.id_user))
)

const formularioProtocoloBasicoValido = computed(() =>
  !!idUser.value &&
  !!formProtocolo.area &&
  !!formProtocolo.familia &&
  !!formProtocolo.id_template &&
  !!Number(formProtocolo.id_empresa_cliente) &&
  !!Number(formProtocolo.id_proyecto)
)

const formularioProtocoloValido = computed(() =>
  formularioProtocoloBasicoValido.value &&
  !!surveyCreadoProtocoloId.value &&
  flujoSeleccionCompleto.value
)

function cumpleFiltroTemplate (survey) {
  const tid = Number(survey?.id_template)
  if (templateFilterMode.value === 'only153') return tid === 153
  if (templateFilterMode.value === 'exclude153') return tid !== 153
  return true
}

// 🔹 Configuración IndexedDB para snapshot de surveys
const DB_NAME = 'TransmacSST'
const DB_VERSION = 1
const STORE_SURVEYS = 'SurveysSnapshot'

function openDb () {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Creamos el store solo si no existe
      if (!db.objectStoreNames.contains(STORE_SURVEYS)) {
        // Usamos key fija 'snapshot' para guardar el último resultado,
        // más idUser para evitar mezclar usuarios
        db.createObjectStore(STORE_SURVEYS, { keyPath: 'id' })
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      console.error('[Survey][IndexedDB] Error al abrir DB:', event.target.error)
      reject(event.target.error)
    }
  })
}

async function guardarSurveysOffline (listaSurveys) {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_SURVEYS, 'readwrite')
    const store = tx.objectStore(STORE_SURVEYS)

    const payload = {
      id: 'snapshot',                    // clave única
      idUser: idUser.value,              // usuario dueño del snapshot
      surveys: listaSurveys || [],
      updatedAt: new Date().toISOString()
    }

    store.put(payload)

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = (e) => reject(e.target.error)
      tx.onabort  = (e) => reject(e.target.error)
    })

    console.log('[Survey] Snapshot de surveys guardado en IndexedDB')
  } catch (err) {
    console.error('[Survey] Error guardando snapshot en IndexedDB:', err)
  }
}

async function cargarSurveysOffline () {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_SURVEYS, 'readonly')
    const store = tx.objectStore(STORE_SURVEYS)

    const data = await new Promise((resolve, reject) => {
      const req = store.get('snapshot')
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = (e) => reject(e.target.error)
    })

    if (!data) {
      console.log('[Survey] No hay snapshot de surveys en IndexedDB')
      return null
    }

    console.log('[Survey] Snapshot de surveys cargado desde IndexedDB:', data)
    return data
  } catch (err) {
    console.error('[Survey] Error leyendo snapshot de IndexedDB:', err)
    return null
  }
}

const refrescarOperacionTerreno = async () => {
  await Promise.all([
    consultarReportsPendientes(),
    consultarViajeActivo()
  ])
}

const onAppVisibilityOrFocus = () => {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  refrescarOperacionTerreno()
}

onMounted(async () => {
  console.log('BASE URL PWA:', apiAxios.defaults.baseURL)

  console.log('userDetailStore.userDetail en Survey:', userDetailStore.userDetail)
  console.log('idUser en Survey:', idUser.value)

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', onAppVisibilityOrFocus)
    document.addEventListener('visibilitychange', onAppVisibilityOrFocus)
  }

  // Prioridad 1: Cargar de inmediato la OT / Report Diario y el Viaje Activo sin esperar catálogos pesados
  const promesaOperacionCritica = Promise.all([
    consultarReportsPendientes(),
    consultarViajeActivo()
  ])

  await cargarRolesSesion()
  if (esVistaAsignacionesCnx.value && !hasCnxRole.value) {
    await router.replace({ path: '/surveys' })
    return
  }
  await promesaOperacionCritica
  await cargarNombresUsuarios()
  await getSurvey()
  await cargarNotificaciones()
  await cargarDatosRealesPlataformaBsm()

  const abrirModo = String(route.query?.abrir_acta_bsm || '').toUpperCase()
  if (abrirModo === 'ENTREGA' || abrirModo === 'RETIRO') {
    await abrirModalPlataformaBsm(abrirModo)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('focus', onAppVisibilityOrFocus)
    document.removeEventListener('visibilitychange', onAppVisibilityOrFocus)
  }
})

watch(() => route.path, async () => {
  if (esVistaAsignacionesCnx.value && !hasCnxRole.value) {
    await router.replace({ path: '/surveys' })
    return
  }
  await getSurvey()
  await consultarViajeActivo()
  await cargarDatosRealesPlataformaBsm()
  await consultarReportsPendientes()
})

watch(() => idUser.value, async (newVal) => {
  if (newVal) {
    await consultarViajeActivo()
    await cargarDatosRealesPlataformaBsm()
    await consultarReportsPendientes()
  }
})

watch(() => formProtocolo.id_empresa_cliente, async (idEmpresa) => {
  formProtocolo.id_proyecto = null
  formProtocolo.area = null
  formProtocolo.familia = null
  formProtocolo.id_template = null
  surveyCreadoProtocoloId.value = null
  flujoPlantillaSteps.value = []
  if (!idEmpresa) {
    proyectosCatalogo.value = []
    return
  }
  await cargarProyectosPorCliente(idEmpresa)
})

watch(() => formProtocolo.id_proyecto, () => {
  formProtocolo.area = null
  formProtocolo.familia = null
  formProtocolo.id_template = null
  surveyCreadoProtocoloId.value = null
  flujoPlantillaSteps.value = []
})

watch(() => formProtocolo.area, () => {
  formProtocolo.familia = null
  formProtocolo.id_template = null
  surveyCreadoProtocoloId.value = null
  flujoPlantillaSteps.value = []
})

watch(() => formProtocolo.familia, () => {
  formProtocolo.id_template = null
  surveyCreadoProtocoloId.value = null
  flujoPlantillaSteps.value = []
})

watch(() => formProtocolo.id_template, async (idTemplate) => {
  surveyCreadoProtocoloId.value = null
  await cargarFlujoPlantillaPorTemplate(idTemplate)
})

function usuariosPorRol(rolName) {
  if (!rolName) return usuariosCatalogoOrdenados.value
  if (String(rolName).trim().toUpperCase() === 'FES_DIRECTA') return usuariosCatalogoOrdenados.value
  const rolId = rolNameToId.value[rolName]
  if (!rolId) return usuariosCatalogoOrdenados.value
  const ids = usersByRolId.value.get(Number(rolId))
  if (!ids) return []
  return usuariosCatalogoOrdenados.value.filter(u => ids.has(Number(u.id_user)))
}

async function goToInspeccion(survey, tieneNotif) {
  const id = Number(survey?.id_survey || 0)
  if (!id) return
  const now = Date.now()
  if (navigatingToInspeccion.value) return
  if (now - lastGoToInspeccionAt.value < 700) return
  navigatingToInspeccion.value = true
  lastGoToInspeccionAt.value = now

  console.log('Ir a inspeccion', id, tieneNotif)

  try {
    if (tieneNotif && isOnline.value) {
      try {
        const response = await apiAxios.put(
          '/notfqueue/updNotfqueue',
          {
            id_notifcation: tieneNotif,
            estado: 'DONE'
          }
        )
        console.log('Notificacion actualizada:', response.data)
      } catch (error) {
        console.error('Error al actualizar la notificacion:', error)
      }
    } else if (!isOnline.value && tieneNotif) {
      console.log('Offline: notificacion no actualizada.')
    }

    try {
      const data = getConexionCardData(survey)
      const payload = {
        id_survey: id,
        fecha: data?.fechaFila || '',
        sup_metrogas: data?.supMetrogas || '',
        sup_terracon: data?.supTerracon || '',
        tipo: data?.tipoTrabajo || '',
        orden: data?.orden || '',
        direccion: data?.direccionComuna || data?.direccion || '',
        ic: data?.ic || ''
      }
      sessionStorage.setItem(`cnx_header_${id}`, JSON.stringify(payload))

      if (isConexionSurvey(survey)) {
        const hijos = getChildRowsForParent(id)
          .map(h => Number(h?.id_survey || 0))
          .filter(cid => cid > 0)
          .sort((a, b) => b - a)
        if (hijos.length) {
          sessionStorage.setItem(`cnx_child_${id}`, String(hijos[0]))
        }
      }
    } catch {}

    // Si la encuesta está en VERIFICACION, redirigir directamente al flujo de firma electrónica
    const esVerificacion = String(survey?.estado_srv || '').trim().toUpperCase() === 'VERIFICACION'
    if (esVerificacion) {
      await router.push({
        path: '/firmaElectronica',
        query: { id_survey: String(id) }
      })
      return
    }

    await router.push({
      path: '/inspeccion',
      query: { idInspeccion: String(id) }
    })
  } finally {
    setTimeout(() => {
      navigatingToInspeccion.value = false
    }, 400)
  }
}

async function getSurvey() {
  // Si por alguna razón no tenemos idUser, no seguimos
  if (!idUser.value) {
    console.warn('[Survey] No hay id_user disponible.')
    return
  }

  let name_area = ''

  try {
    // Cargar los pasos de flujo para ver si el superior logueado tiene firmas/cierres pendientes en alguna encuesta en VERIFICACION
    const surveysConPasoPendiente = new Set()
    try {
      const { data: steps } = await apiAxios.get('/servicio/leanglobal/flujosAprobacionSteps')
      if (Array.isArray(steps)) {
        steps.forEach(s => {
          if (Number(s.id_user_flujo) === Number(idUser.value) && String(s.estado_stp).trim().toUpperCase() === 'PENDIENTE') {
            surveysConPasoPendiente.add(Number(s.id_survey))
          }
        })
      }
    } catch (e) {
      console.warn('[Surveys] Error al obtener pasos de flujo pendientes:', e)
    }

    // Lógica declarativa resiliente para SST en VERIFICACION (Paso 2 superior)
    try {
      const { data: respFlujos } = await apiAxios.get('/servicio/leanglobal/flujosAprobacion')
      const flujosSST = (respFlujos?.datos || []).filter(f => 
        String(f.estado_srv).trim().toUpperCase() === 'VERIFICACION' &&
        (/conductual|seguridad|sst|obs-|ins-/i.test(f.codi_template_srv || f.name_template_srv || ''))
      )
      
      if (flujosSST.length > 0) {
        await Promise.all(
          flujosSST.map(async (flujo) => {
            try {
              const { data: detail } = await apiAxios.get(
                `/servicio/leanglobal/procesosSurveyDetail?id_survey=${flujo.id_survey}`
              )
              const s = detail?.[0]
              if (s) {
                const bodyExec = typeof s.body_exec === 'string' ? JSON.parse(s.body_exec) : (s.body_exec || {})
                const segmentos = Array.isArray(bodyExec.segmentos) ? bodyExec.segmentos : []
                
                let superiorId = null
                for (const seg of segmentos) {
                  const attrs = Array.isArray(seg.attributes) ? seg.attributes : []
                  for (const a of attrs) {
                    if (a.type === 'checkListObservacionConductual') {
                      superiorId = a.datos?.superiorDerivado
                    } else if (a.type === 'condicionesSeguridadTrabajo') {
                      superiorId = a.superiorDerivado
                    }
                    if (superiorId) break
                  }
                  if (superiorId) break
                }

                if (superiorId && Number(superiorId) === Number(idUser.value)) {
                  console.log(`[Surveys Resiliencia] Agregando survey ${flujo.id_survey} a pendientes de superior`)
                  surveysConPasoPendiente.add(Number(flujo.id_survey))
                }
              }
            } catch (errDet) {
              console.warn(`Error al cargar detalle de resiliencia para survey ${flujo.id_survey}:`, errDet)
            }
          })
        )
      }
    } catch (errFlujos) {
      console.warn('[Surveys] Error en consulta declarativa de flujos:', errFlujos)
    }

    // 👇 Online (o con SW dando respuesta de red/cache)
    let { data } = await apiAxios.get(
      '/servicio/leanglobal/procesosSurveyV3'
    )

    data = Array.isArray(data?.datos) ? data.datos : []

    // 1) Guardar snapshot RAW por id (sin filtro por usuario) para poder resolver datos de padre/hijo en conexión.
    const rawById = {}
    ;(data ?? []).forEach((row) => {
      const id = Number(row?.id_survey || 0)
      if (id > 0) rawById[id] = row
    })
    surveysRawById.value = rawById

    // 2) Filtra
    const filtrados = (data ?? []).filter(
      it => {
        const idSrv = Number(it.id_survey)
        const esMiPasoPendiente = surveysConPasoPendiente.has(idSrv)
        
        // Si está en VERIFICACION para template 70 o 80, SOLO lo ve el superior que tiene el paso pendiente
        const idTemplate = Number(it.id_template)
        const esVerificacionDerivada = String(it.estado_srv).trim().toUpperCase() === 'VERIFICACION' && [70, 80].includes(idTemplate)
        
        const coincideUsuario = esVistaReclamos.value || 
          (esVerificacionDerivada ? esMiPasoPendiente : (Number(it.id_user) === Number(idUser.value) || esMiPasoPendiente))

        // Ocultar si está APROBADO o TERMINADO, a menos que verTerminados sea true
        const esTerminada = it.estado_srv === 'APROBADO' || it.estado_srv === 'TERMINADO' || it.estado_srv === 'Terminado'
        const coincideEstado = verTerminados.value || !esTerminada || (it.estado_srv === 'VERIFICACION' && esMiPasoPendiente)

        // Template 500 (Consentimiento Informado FES): no mostrar en la bandeja operativa de terreno si ya está aprobado o sin paso pendiente
        const esConsentimiento = Number(it.id_template) === 500 || it.desc_template_srv === 'Consentimiento'
        if (esConsentimiento && (esTerminada || !esMiPasoPendiente)) return false

        return it.estado_srv !== 'Pre Creado' &&
          coincideEstado &&
          coincideUsuario &&
          it.desc_template_srv !== 'PPD' &&
          cumpleFiltroTemplate(it)
      }
    )

    console.log('Surveys filtrados:', filtrados)

    // 3) Ordena desc por id_survey (robusto si viene como string)
    const toNum = v => (typeof v === 'number' ? v : parseInt(String(v), 10) || 0)
    surveys.value = filtrados.sort((a, b) => toNum(b.id_survey) - toNum(a.id_survey))

    // 4) Filtro de áreas (opcional, igual que antes)
    const uniqueAreas = [...new Set(surveys.value.map(it => it.name_area))]
    filtroDimension.value = uniqueAreas.map((area, i) => ({ ID: i + 1, NOMBRE: area }))
    await cargarDetalleConexiones(surveys.value)
    await cargarDetalleReclamos(surveys.value)
    await logSurveysFiltradosConDetalleReclamo(surveys.value)

    // 🔹 Guardar snapshot para offline
    await guardarSurveysOffline(surveys.value)
  } catch (error) {
    console.error('Error al obtener survey:', error)

    // 🔹 Si falla (por ejemplo sin red), intentar cargar desde IndexedDB
    const snapshot = await cargarSurveysOffline()
    if (snapshot && snapshot.idUser === idUser.value) {
      console.log('[Survey] Usando snapshot local de surveys para idUser:', idUser.value)
      surveys.value = snapshot.surveys || []
      const rawById = {}
      ;(snapshot.surveys || []).forEach((row) => {
        const id = Number(row?.id_survey || 0)
        if (id > 0) rawById[id] = row
      })
      surveysRawById.value = rawById

      const uniqueAreas = [...new Set(surveys.value.map(it => it.name_area))]
      filtroDimension.value = uniqueAreas.map((area, i) => ({ ID: i + 1, NOMBRE: area }))
      await cargarDetalleConexiones(surveys.value)
      await cargarDetalleReclamos(surveys.value)
      await logSurveysFiltradosConDetalleReclamo(surveys.value)
    } else {
      console.warn('[Survey] No hay datos locales para este usuario.')
    }
  }
}

function safeParseJson(value, fallback) {
  try {
    if (value === null || value === undefined) return fallback
    if (typeof value === 'string') return JSON.parse(value)
    if (typeof value === 'object') return value
    return fallback
  } catch {
    return fallback
  }
}

function fechaActualYMD() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function resetFormProtocolo() {
  formProtocolo.area = null
  formProtocolo.familia = null
  formProtocolo.id_template = null
  formProtocolo.id_empresa_cliente = null
  formProtocolo.id_proyecto = null
  proyectosCatalogo.value = []
  flujoPlantillaSteps.value = []
  surveyCreadoProtocoloId.value = null
}

async function cargarCatalogosModalProtocolo() {
  loadingCatalogoProtocolo.value = true
  errorCrearProtocolo.value = ''

  try {
    const [{ data: tplData }, { data: areasAutonomosData }, { data: empresasData }, { data: usuariosData }, { data: rolesData }, { data: usuariosRolesData }] = await Promise.all([
      apiAxios.get('/servicio/leanglobal/obtenerTemplates'),
      apiAxios.get('/servicio/leanglobal/obtenerAreasAutonomos'),
      apiAxios.get('/servicio/leanglobal/obtenerEmpresas'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuarios'),
      apiAxios.get('/servicio/leanglobal/obtenerRoles'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles')
    ])

    templatesCatalogo.value = Array.isArray(tplData) ? tplData : []
    usuariosCatalogo.value = (Array.isArray(usuariosData) ? usuariosData : [])
      .filter(u => String(u?.nombre_user || '').trim().length > 0)
    rolesCatalogo.value = Array.isArray(rolesData) ? rolesData : []
    usuariosRolesCatalogo.value = Array.isArray(usuariosRolesData) ? usuariosRolesData : []
    clientesCatalogo.value = (Array.isArray(empresasData) ? empresasData : [])
      .filter(e => {
        const isExterno = e.flag_externo === true || e.flag_externo === 1 || e.flag_externo === '1' || e.flag_externo === 't' || e.flag_externo === 'true';
        if (isExterno) return false;
        const isInactivo = e.flag_activo === false || e.flag_activo === 'f' || e.flag_activo === 'false';
        if (isInactivo) return false;
        return true;
      })
      .sort((a, b) => String(a?.name_empresa || '').localeCompare(String(b?.name_empresa || ''), 'es', { sensitivity: 'base' }))

    const surveyRows = Array.isArray(areasAutonomosData) ? areasAutonomosData : []
    const metaByTemplate = new Map()
    for (const row of surveyRows) {
      const idTpl = Number(row?.id_template)
      if (!idTpl || metaByTemplate.has(idTpl)) continue
      const idArea = Number(row?.id_area)
      const nameArea = String(row?.name_area || '').trim()
      const nameTipo = String(row?.name_tipo_srv || '').trim()
      if (!nameArea || !nameTipo) continue
      metaByTemplate.set(idTpl, {
        id_area: idArea,
        name_area: nameArea,
        name_tipo_srv: nameTipo
      })
    }

    metaByTemplateMap.value = metaByTemplate
  } catch (error) {
    console.error('[Survey] Error cargando catálogo de protocolo:', error)
    errorCrearProtocolo.value = 'No se pudo cargar el catálogo de protocolos.'
  } finally {
    loadingCatalogoProtocolo.value = false
  }
}

async function cargarFlujoPlantillaPorTemplate(idTemplate) {
  flujoPlantillaSteps.value = []
  if (!idTemplate) return
}

async function cargarProyectosPorCliente(idEmpresa) {
  loadingProyectosCatalogo.value = true
  try {
    const { data } = await apiAxios.get(`/servicio/leanglobal/obtenerProyectos?id_empresa_cliente=${idEmpresa}`)
    proyectosCatalogo.value = (Array.isArray(data) ? data : [])
      .filter(p => Number(p.id_proyecto) !== 6)
      .sort((a, b) => String(a?.nombre_proyecto || '').localeCompare(String(b?.nombre_proyecto || ''), 'es', { sensitivity: 'base' }))
  } catch (error) {
    console.error('[Survey] Error cargando proyectos:', error)
    proyectosCatalogo.value = []
  } finally {
    loadingProyectosCatalogo.value = false
  }
}

async function abrirModalRegistrarProtocolo() {
  dialogRegistrarProtocolo.value = true
  errorCrearProtocolo.value = ''
  resetFormProtocolo()
  await cargarCatalogosModalProtocolo()
}

async function crearSurveyBaseDesdeModal() {
  const tpl = templatesCatalogo.value.find(t => Number(t.id_template) === Number(formProtocolo.id_template))
  if (!tpl) throw new Error('No se encontró el protocolo seleccionado.')

  const headerSeed = safeParseJson(tpl.header_seed, {})
  const bodySeed = safeParseJson(tpl.body_seed, { segmentos: [] })
  const approvalSeed = safeParseJson(tpl.approval_seed, {})
  const fechaActual = fechaActualYMD()

  const payload = {
    id_tipo_srv: Number(tpl.id_tipo_srv),
    id_template: Number(tpl.id_template),
    id_survey_padre: null,
    id_user: Number(idUser.value),
    id_user_creacion: Number(idUser.value),
    id_empresa_cliente: Number(formProtocolo.id_empresa_cliente),
    estado_srv: 'Pre Creado',
    header_seed: JSON.stringify(headerSeed),
    body_seed: JSON.stringify(bodySeed),
    approval_seed: JSON.stringify(approvalSeed),
    header_exec: JSON.stringify(headerSeed),
    body_exec: JSON.stringify(bodySeed),
    approval_exec: JSON.stringify(approvalSeed),
    fecha_plan_ini: fechaActual,
    fecha_plan_fin: fechaActual,
    fecha_real_ini: null,
    fecha_real_fin: null,
    fecha_upload: null,
    latitud: null,
    longitud: null,
    id_proyecto: Number(formProtocolo.id_proyecto) || null,
    id_flow_tmpl: tpl.id_flow_tmpl || null
  }

  const resp = await apiAxios.post('/survey/', payload)
  return Number(resp?.data?.idSurvey || resp?.data?.id_survey || 0) || null
}

async function prepararFlujoModal() {
  if (!formularioProtocoloBasicoValido.value) return
  creandoProtocolo.value = true
  errorCrearProtocolo.value = ''
  try {
    const nuevoSurveyId = await crearSurveyBaseDesdeModal()
    if (!nuevoSurveyId) throw new Error('No se pudo crear el survey base para cargar flujo.')
    surveyCreadoProtocoloId.value = nuevoSurveyId
    await cargarFlujoPorSurvey(nuevoSurveyId)
  } catch (error) {
    console.error('[Survey] Error preparando flujo del modal:', error)
    errorCrearProtocolo.value = error?.response?.data?.message || error?.response?.data?.error || error.message || 'No se pudo preparar el flujo.'
  } finally {
    creandoProtocolo.value = false
  }
}

async function crearSurveyDesdeModal() {
  if (!formularioProtocoloValido.value || !surveyCreadoProtocoloId.value) return
  creandoProtocolo.value = true
  errorCrearProtocolo.value = ''
  try {
    await asignarFlujoSeleccionadoSurvey(Number(surveyCreadoProtocoloId.value))
    dialogRegistrarProtocolo.value = false
    resetFormProtocolo()
    await getSurvey()
  } catch (error) {
    console.error('[Survey] Error guardando asignación de flujo:', error)
    errorCrearProtocolo.value = error?.response?.data?.message || error?.response?.data?.error || error.message || 'No se pudo guardar la asignación del flujo.'
  } finally {
    creandoProtocolo.value = false
  }
}

async function obtenerFlowIdPorSurvey(idSurvey) {
  const { data } = await apiAxios.get('/servicio/leanglobal/flujosAprobacion')
  const rows = Array.isArray(data?.datos) ? data.datos : []
  const row = rows.find(r => Number(r?.id_survey) === Number(idSurvey))
  return Number(row?.id_flow || 0) || null
}

async function obtenerFlowSteps(idFlow) {
  if (!idFlow) return []
  const { data } = await apiAxios.get(`/servicio/leanglobal/flujosAprobacionSteps?id_flow=${idFlow}`)
  return Array.isArray(data) ? data : []
}

async function cargarFlujoPorSurvey(idSurvey) {
  loadingFlujoPlantilla.value = true
  try {
    const idFlow = await obtenerFlowIdPorSurvey(idSurvey)
    const steps = await obtenerFlowSteps(idFlow)
    flujoPlantillaSteps.value = steps
      .filter(s => !s?.flag_equipo)
      .sort((a, b) => Number(a?.flow_tmpl_step_orden || 0) - Number(b?.flow_tmpl_step_orden || 0))
      .map(s => ({
        ...s,
        id_user: null
      }))
  } catch (error) {
    console.error('[Survey] Error cargando flujo por survey:', error)
    flujoPlantillaSteps.value = []
  } finally {
    loadingFlujoPlantilla.value = false
  }
}

async function asignarFlujoSeleccionadoSurvey(idSurvey) {
  try {
    const idFlow = await obtenerFlowIdPorSurvey(idSurvey)
    const steps = await obtenerFlowSteps(idFlow)
    if (!steps.length) return

    const stepByOrdenRol = new Map()
    for (const s of flujoPlantillaSteps.value || []) {
      const key = `${Number(s?.flow_tmpl_step_orden || 0)}|${String(s?.name_rol || '')}`
      stepByOrdenRol.set(key, Number(s?.id_user || 0) || null)
    }

    const reqs = steps
      .filter(s => !s?.flag_equipo && Number(s?.id_flow_stp) > 0)
      .map(s => {
        const key = `${Number(s?.flow_tmpl_step_orden || 0)}|${String(s?.name_rol || '')}`
        const selectedUser = stepByOrdenRol.get(key) || Number(idUser.value) || null
        if (!selectedUser) return null
        return apiAxios.put('/survey/UpdUserFlow', {
          id_flow_stp: Number(s.id_flow_stp),
          id_user_flujo: Number(selectedUser),
          flag_equipo: false
        })
      })
      .filter(Boolean)

    if (reqs.length) await Promise.allSettled(reqs)

    await apiAxios.post('/survey/UpdSurveyEstado', {
      id_survey: Number(idSurvey),
      estado_srv: 'Creado'
    })
  } catch (error) {
    console.error('[Survey] Error asignando flujo seleccionado al crear survey:', error)
  }
}

const filteredSurveys = computed(() => {
  const allSurveys = surveys.value ?? []
  const hayConexionConFechaHoy = esVistaAsignacionesCnx.value
    ? allSurveys
      .filter(isConexionSurvey)
      .some(s => {
        const data = getConexionCardData(s)
        const fechaTablaRaw = String(data?.fechaTablaRaw || '').trim()
        return !!fechaTablaRaw && isFechaConexionHoy(fechaTablaRaw)
      })
    : false

  return allSurveys.filter(s => {
    const coincideEstado = !filtro.value || s.estado_srv === filtro.value.NOMBRE
    const coincideDimension = !filtroDim.value || s.name_area === filtroDim.value.NOMBRE

    const texto = filtroTexto.value?.toLowerCase() ?? ''
    const coincideTexto =
      !texto ||
      s.name_template_srv?.toLowerCase().includes(texto) ||
      s.name_empresa_cliente?.toLowerCase().includes(texto) ||
      s.nombre_proyecto?.toLowerCase().includes(texto) ||
      s.codi_template_srv?.toLowerCase().includes(texto)

    // Regla PWA Conexión (CNX):
    // - si existe al menos una conexión con fecha de hoy: mostrar solo las de hoy (o sin fecha)
    // - si no existe ninguna de hoy: mostrar todas para no dejar la pantalla vacía
    if (esVistaAsignacionesCnx.value) {
      if (!isConexionSurvey(s)) return false
      if (hayConexionConFechaHoy) {
        const data = getConexionCardData(s)
        const fechaTablaRaw = String(data?.fechaTablaRaw || '').trim()
        const mostrarPorFecha = !fechaTablaRaw || isFechaConexionHoy(fechaTablaRaw)
        if (!mostrarPorFecha) return false
      }
    }
    if (esVistaReclamos.value) {
      if (!surveyReclamoAsignadoATecnicoActual(s)) return false
    }

    return coincideEstado && coincideDimension && coincideTexto
  })
})

function getIdentidadesUsuarioSesion() {
  const u = userDetailStore.userDetail || {}
  const nombres = [
    u?.nombre_user,
    [u?.name_frst, u?.name_sec, u?.apellido_pat, u?.apellido_mat].filter(Boolean).join(' '),
    [u?.name_frst, u?.apellido_pat].filter(Boolean).join(' '),
    u?.email,
    u?.codi_user
  ]
    .map(v => String(v || '').trim())
    .filter(Boolean)
    .map(v => normalizarTexto(v))
  return new Set(nombres)
}

function nombreTecnicoEsValido(nombre) {
  const raw = String(nombre || '').trim()
  if (!raw) return false
  const n = normalizarTexto(raw)
  if (!n || n === '-' || n === 'asignado' || n === 'sin asignar') return false
  // Evita tomar nombres basura como ids/archivos UUID.jpg
  if (/^[a-f0-9-]{16,}\.[a-z0-9]{2,5}$/i.test(raw)) return false
  return true
}

function nombresCompatibles(a, b) {
  const na = normalizarTexto(a)
  const nb = normalizarTexto(b)
  if (!na || !nb) return false
  if (na === nb) return true

  const ta = [...new Set(na.split(' ').filter(Boolean))]
  const tb = [...new Set(nb.split(' ').filter(Boolean))]
  const inter = ta.filter(t => tb.includes(t))
  return inter.length >= 2
}

function surveyReclamoAsignadoATecnicoActual(survey) {
  const uid = Number(idUser.value || 0)
  if (uid <= 0) return false

  const idsTecnico = [survey?.id_user_tecnico]
    .map(v => Number(v || 0))
    .filter(v => v > 0)
  if (idsTecnico.length > 0) return idsTecnico.includes(uid)

  const data = getConexionCardData(survey)
  const nombresTecnico = [
    data?.nombreTecnico,
    survey?.nombre_tecnico
  ]
    .filter(nombreTecnicoEsValido)
    .map(v => normalizarTexto(v))

  if (!nombresTecnico.length) return false
  const identidades = [...getIdentidadesUsuarioSesion()]
  return nombresTecnico.some(n => identidades.some(i => nombresCompatibles(n, i)))
}

function toYMDLocal(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDateCandidate(set, y, m, d) {
  if (!(y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return
  set.add(`${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
}

function fechaCandidatesYMD(raw) {
  const txt = String(raw || '').trim()
  const out = new Set()
  if (!txt) return out

  // yyyy-mm-dd / yyyy/mm/dd / yyyy.mm.dd
  let m = txt.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/)
  if (m) {
    addDateCandidate(out, Number(m[1]), Number(m[2]), Number(m[3]))
    return out
  }

  // dd-mm-yyyy o mm-dd-yyyy (ambiguo cuando a<=12 y b<=12)
  m = txt.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  if (m) {
    const a = Number(m[1]); const b = Number(m[2]); let y = Number(m[3])
    if (y < 100) y += 2000
    addDateCandidate(out, y, b, a) // dmy
    addDateCandidate(out, y, a, b) // mdy
    return out
  }

  const parsed = new Date(txt)
  if (!Number.isNaN(parsed.getTime())) out.add(toYMDLocal(parsed))
  return out
}

function isFechaConexionHoy(raw) {
  const hoy = toYMDLocal(new Date())
  const candidates = fechaCandidatesYMD(raw)
  return candidates.has(hoy)
}

function isConexionCompactSurvey(survey) {
  if (!isConexionSurvey(survey)) return false
  if (isExternalCompany.value) return false
  return getConexionVinculoInfo(survey).tipo === 'Padre'
}

function isConexionRowExpanded(idSurvey) {
  return expandedConexionRows.value.has(Number(idSurvey))
}

function toggleConexionRow(idSurvey) {
  const id = Number(idSurvey || 0)
  if (!id) return
  const next = new Set(expandedConexionRows.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedConexionRows.value = next
}

function getEstadoColor(estadoSrv) {
  const est = String(estadoSrv || '').trim().toUpperCase();
  switch (est) {
    case 'TERMINADO':
    case 'APROBADO':
      return { color: 'green-darken-2', texto: 'Aprobado' }
    case 'VERIFICACION':
    case 'VERIFICACIÓN':
    case 'VERIFICANDO':
      return { color: 'purple-darken-2', texto: 'En Verificación' }
    case 'EJECUCION':
    case 'EJECUCIÓN':
      return { color: 'blue-darken-2', texto: 'En Ejecución' }
    case 'CREADO':
      return { color: 'amber-darken-2', texto: 'Pendiente' }
    case 'RECHAZADO':
    case 'RECHAZADA':
      return { color: 'red-darken-2', texto: 'Rechazado' }
    case 'PRE CREADO':
    case 'PRE-CREADO':
    case 'PLANIFICADO':
      return { color: 'grey', texto: 'Planificado' }
    default:
      return { color: 'grey', texto: estadoSrv || 'Desconocido' }
  }
}

// Llama tu endpoint y normaliza
async function cargarNotificaciones() {
  if (!idUser.value) {
    console.warn('[Survey] No hay id_user para cargar notificaciones.')
    return
  }

  try {
    const { data } = await apiAxios.get(
      '/servicio/leanglobal/obtenerNortificaciones',
      {
        params: { id_user_target: idUser.value }
      }
    )
    notificaciones.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error al cargar notificaciones:', error)
  }
}

const notifSet = computed(() => {
  const s = new Set()
  for (const n of notificaciones.value) {
    const id = Number(n?.json_data?.id_survey)
    if (!Number.isNaN(id)) s.add(id)
  }
  return s
})

const hasNotif = id => notifSet.value.has(Number(id))

const notifBySurvey = computed(() => {
  const m = new Map()
  for (const n of notificaciones.value) {
    const sid = Number(n?.json_data?.id_survey)
    if (!Number.isNaN(sid)) {
      if (!m.has(sid)) m.set(sid, [])
      m.get(sid).push(n)
    }
  }
  return m
})

const notifPrimaryId = sid => {
  const arr = notifBySurvey.value.get(Number(sid))
  return arr?.[0]?.id_notification ?? null
}
const conexionCardDataCache = new Map()

function normalizarTexto(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function pareceFechaTexto(value) {
  const txt = String(value || '').trim()
  if (!txt) return false
  if (/^\d{4}[./-]\d{1,2}[./-]\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?)?$/.test(txt)) return true
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}([ T]\d{1,2}:\d{2}(:\d{2})?)?$/.test(txt)) return true
  return false
}

function esValorValidoSupMetrogas(value) {
  const txt = String(value || '').trim()
  if (!txt) return false
  if (esPlaceholderConexion(txt)) return false
  if (pareceFechaTexto(txt)) return false
  // Evita valores numéricos/horas/fechas sin letras
  if (!/[a-zA-Z\u00C0-\u024F]/.test(txt)) return false
  return true
}

function normalizeTipoEmpalmeGasificar(value) {
  const txt = normalizarTexto(value)
  if (!txt) return ''
  if (txt.includes('gasificar')) return 'Gasificar'
  if (txt.includes('empalme')) return 'Empalme Existente'
  return ''
}

function isConexionSurvey(survey) {
  const texto = normalizarTexto([
    survey?.desc_template_srv,
    survey?.name_template_srv,
    survey?.name_tipo_srv,
    survey?.codi_template_srv
  ].join(' '))

  return texto.includes('conexion') || texto.includes('conexiones')
}

function valorDesde(bodyExec, keys = []) {
  if (!bodyExec || typeof bodyExec !== 'object') return ''
  const keyNorms = (keys || []).map(normalizarCampo)
  const mapa = construirMapaBodyExec(bodyExec)

  for (const kn of keyNorms) {
    const exact = mapa.exact.get(kn)
    if (exact) return exact
  }

  for (const kn of keyNorms) {
    for (const [k, v] of mapa.exact.entries()) {
      if (k.includes(kn) || kn.includes(k)) return v
    }
  }

  for (const kn of keyNorms) {
    const byLabel = mapa.byLabel.get(kn)
    if (byLabel) return byLabel
  }

  for (const kn of keyNorms) {
    for (const [k, v] of mapa.byLabel.entries()) {
      if (k.includes(kn) || kn.includes(k)) return v
    }
  }

  return ''
}

function valorDesdeExacto(bodyExec, keys = []) {
  if (!bodyExec || typeof bodyExec !== 'object') return ''
  const keyNorms = (keys || []).map(normalizarCampo)
  const mapa = construirMapaBodyExec(bodyExec)

  for (const kn of keyNorms) {
    const exact = mapa.exact.get(kn)
    if (exact) return exact
  }

  for (const kn of keyNorms) {
    const byLabel = mapa.byLabel.get(kn)
    if (byLabel) return byLabel
  }

  return ''
}

function valorDesdeContieneSeguro(bodyExec, keys = []) {
  if (!bodyExec || typeof bodyExec !== 'object') return ''
  const keyNorms = (keys || [])
    .map(normalizarCampo)
    .filter(k => k.length >= 4)
  if (!keyNorms.length) return ''

  const mapa = construirMapaBodyExec(bodyExec)
  const findContains = (entries) => {
    for (const [k, v] of entries) {
      if (keyNorms.some(kn => k.includes(kn))) return v
    }
    return ''
  }

  return findContains(mapa.exact.entries()) || findContains(mapa.byLabel.entries()) || ''
}

function normalizarCampo(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function formatFechaConexionDisplay(raw) {
  const txt = String(raw || '').trim()
  if (!txt) return ''

  // yyyy-mm-dd / yyyy/mm/dd / yyyy.mm.dd
  let m = txt.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/)
  if (m) {
    const y = Number(m[1]); const mm = Number(m[2]); const dd = Number(m[3])
    if (y > 1900 && mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return `${String(dd).padStart(2, '0')}-${String(mm).padStart(2, '0')}-${String(y).padStart(4, '0')}`
    }
  }

  // dd-mm-yyyy / dd/mm/yyyy / dd.mm.yyyy (si d > 12 es inequívoco)
  m = txt.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  if (m) {
    let a = Number(m[1]); let b = Number(m[2]); let y = Number(m[3])
    if (y < 100) y += 2000
    if (a >= 1 && a <= 31 && b >= 1 && b <= 12) {
      // Si ambas partes <= 12, asumimos origen US (mm/dd) para evitar inversión observada en PWA.
      const isAmbiguous = a <= 12 && b <= 12
      const dd = isAmbiguous ? b : a
      const mm = isAmbiguous ? a : b
      return `${String(dd).padStart(2, '0')}-${String(mm).padStart(2, '0')}-${String(y).padStart(4, '0')}`
    }
  }

  const parsed = new Date(txt)
  if (!Number.isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, '0')
    const mm = String(parsed.getMonth() + 1).padStart(2, '0')
    const y = String(parsed.getFullYear())
    return `${dd}-${mm}-${y}`
  }
  return txt
}

function valorPlano(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    const candidatos = [
      value?.nombre_user,
      value?.name_user,
      value?.nombre,
      value?.name,
      value?.label,
      value?.title,
      value?.text,
      value?.descripcion,
      value?.gestor,
      value?.gio,
      value?.value,
      value?.selected,
      value?.default,
      value?.id_user,
      value?.id
    ]
    for (const c of candidatos) {
      if (c === null || c === undefined) continue
      if (typeof c === 'string') {
        const t = c.trim()
        if (t) return t
      } else if (typeof c === 'number' || typeof c === 'boolean') {
        return String(c)
      }
    }
  }
  return ''
}

function construirMapaBodyExec(bodyExec) {
  const exact = new Map()
  const byLabel = new Map()
  const visitados = new Set()

  const pushExact = (key, value) => {
    const k = normalizarCampo(key)
    const v = valorPlano(value)
    if (!k || !v) return
    if (!exact.has(k)) exact.set(k, v)
  }

  const pushByLabel = (label, value) => {
    const k = normalizarCampo(label)
    const v = valorPlano(value)
    if (!k || !v) return
    if (!byLabel.has(k)) byLabel.set(k, v)
  }

  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if (visitados.has(node)) return
    visitados.add(node)

    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }

    const label = node.label ?? node.nombre ?? node.name ?? node.titulo ?? node.title
    const labelValue =
      node.default ??
      node.values?.selected ??
      node.selected ??
      node.value ??
      node.valor ??
      node.texto ??
      node.text ??
      node.respuesta ??
      node.answer ??
      node.data
    if (label !== undefined && labelValue !== undefined) {
      pushByLabel(label, labelValue)
    }

    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'object' && v !== null) {
        walk(v)
      } else {
        pushExact(k, v)
      }
    }
  }

  walk(bodyExec)
  return { exact, byLabel }
}

function pickFirstAsignacionValue(obj, keys = []) {
  if (!obj || typeof obj !== 'object') return null
  for (const k of keys) {
    const v = obj[k]
    if (v === null || v === undefined || v === '') continue
    return v
  }
  return null
}

function extractAsignacionesLikeLG(detailOrRow) {
  const row = Array.isArray(detailOrRow)
    ? detailOrRow[0]
    : (detailOrRow?.surveyDetail?.[0] || detailOrRow)
  if (!row || typeof row !== 'object') return { contratista: null, supervisor: null, tecnico: null }

  const parseObj = (raw) => {
    if (!raw) return null
    if (typeof raw === 'object') return raw
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) } catch { return null }
    }
    return null
  }

  const bodyObj = parseObj(row?.body_exec || row?.json_exec)
  const segAsignaciones = Array.isArray(bodyObj?.segmentos)
    ? bodyObj.segmentos.flatMap(seg => {
      const attrs = Array.isArray(seg?.attributes) ? seg.attributes : []
      return attrs.map(a => a?.asignaciones ?? null).filter(Boolean)
    })
    : []

  const a1 = row?.asignaciones ?? row?.asignacion ?? null
  const a2 = row?.header_exec?.asignaciones ?? row?.header_exec?.asignacion ?? null
  const a3 = row?.body_exec?.asignaciones ?? row?.body_exec?.asignacion ?? null
  const a4 = bodyObj?.asignaciones ?? bodyObj?.asignacion ?? null

  const rawPool = [a1, a2, a3, a4, ...segAsignaciones, row].filter(Boolean)
  const pool = rawPool.flatMap(src => (Array.isArray(src) ? src.filter(Boolean) : [src]))

  const kContr = ['id_user_contratista', 'contratista', 'Contratista', 'id_contratista', 'id_user_contratista_asignado']
  const kSup = ['id_user_supervisor', 'supervisor', 'Supervisor', 'id_supervisor', 'id_user_supervisor_asignado']
  const kTec = ['id_user_tecnico', 'tecnico', 'Tecnico', 'Técnico', 'id_tecnico', 'id_user_tecnico_asignado', 'nombre_tecnico', 'tecnico_nombre']

  let contratista = null
  let supervisor = null
  let tecnico = null

  for (const src of pool) {
    contratista = contratista || pickFirstAsignacionValue(src, kContr)
    supervisor = supervisor || pickFirstAsignacionValue(src, kSup)
    tecnico = tecnico || pickFirstAsignacionValue(src, kTec)
  }

  return { contratista, supervisor, tecnico }
}

function getTecnicoAsignadoDesdeBodyExec(bodyExec) {
  if (!bodyExec || typeof bodyExec !== 'object') return ''
  const visited = new Set()
  let found = ''

  const walk = (node) => {
    if (!node || found) return
    if (typeof node !== 'object') return
    if (visited.has(node)) return
    visited.add(node)

    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }

    const asig = node?.asignaciones || node?.asignacion || null
    if (asig && typeof asig === 'object') {
      const idTec = Number(asig?.tecnico || asig?.id_user_tecnico || 0)
      if (idTec > 0) {
        found = resolverNombreUsuario(idTec)
        if (found) return
      }
      const nomTec = String(asig?.nombre_tecnico || asig?.tecnico_nombre || '').trim()
      if (nomTec) {
        found = nomTec
        return
      }
    }

    Object.values(node).forEach(walk)
  }

  walk(bodyExec)
  return found
}

function getTecnicoDesdeFilaYBody(row, body) {
  const asig = extractAsignacionesLikeLG(row)
  const asigBody = extractAsignacionesLikeLG({ body_exec: body })
  return (
    asigBody?.tecnico ||
    asig?.tecnico ||
    getTecnicoAsignadoDesdeBodyExec(body) ||
    valorDesde(body, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado']) ||
    valorDesde(row, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado', 'nombre_tecnico']) ||
    resolverNombreUsuario(row?.id_user_tecnico) ||
    String(row?.nombre_tecnico || '').trim() ||
    ''
  )
}

function getChildRowsForParent(parentId) {
  const pid = Number(parentId || 0)
  if (!pid) return []
  const rawRows = Object.values(surveysRawById.value || {})
  return rawRows.filter(r => Number(r?.id_survey_padre || 0) === pid && isConexionSurvey(r))
}

function getTecnicoAsignadoDesdeHijos(parentId) {
  const pid = Number(parentId || 0)
  if (!pid) return ''
  const hijos = getChildRowsForParent(pid)
  for (const h of hijos) {
    const childId = Number(h?.id_survey || 0)
    const detailRawHijo = surveyDetailRawById.value?.[childId] || null
    const asigRawHijo = extractAsignacionesLikeLG(detailRawHijo)
    const tecnicoRawAsignado = asigRawHijo?.tecnico
    const tecnicoAsignado = resolverNombreUsuario(tecnicoRawAsignado)
    if (String(tecnicoAsignado || '').trim()) return String(tecnicoAsignado).trim()

    const detailHijo = bodyExecDetalleBySurvey.value?.[childId] || null
    const bodyHijo = hasBodyExecData(detailHijo)
      ? detailHijo
      : parseBodyExecFromSurveyDetail(h?.body_exec)
    const tecnico =
      getTecnicoDesdeFilaYBody(detailHijo || h, bodyHijo) ||
      getTecnicoDesdeFilaYBody(h, bodyHijo)
    if (tecnico) return tecnico
  }
  return ''
}

function getConexionCardData(survey) {
  const idSurveyNum = Number(survey?.id_survey || 0)
  const infoVinculo = getConexionVinculoInfo(survey)
  const sourceId = infoVinculo.tipo === 'Hijo' && infoVinculo.parentId > 0 ? infoVinculo.parentId : idSurveyNum
  const parentByChild = parentDetailByChildSurvey.value[idSurveyNum]
  const parentDetailRaw = surveyDetailRawById.value[sourceId] || null
  const parentBody = bodyExecDetalleBySurvey.value[sourceId]
  const childBody = bodyExecDetalleBySurvey.value[idSurveyNum]
  const fallbackBody = parseBodyExecFromSurveyDetail(survey?.body_exec)
  const parentBodyFromDetail = parseBodyExecFromSurveyDetail(parentDetailRaw?.body_exec)
  const parentSurveyRow = surveysRawById.value[sourceId] || null
  const parentBodyFromRow = parseBodyExecFromSurveyDetail(parentSurveyRow?.body_exec || parentSurveyRow?.json_exec)
  const parentHeaderFromRow = parseBodyExecFromSurveyDetail(parentSurveyRow?.header_exec)
  const bodySnapshot = hasBodyExecData(parentByChild)
    ? parentByChild
    : hasBodyExecData(parentBody)
      ? parentBody
    : hasBodyExecData(parentBodyFromDetail)
      ? parentBodyFromDetail
    : (hasBodyExecData(childBody) ? childBody : fallbackBody)
  const bodyPadrePreferido = hasBodyExecData(parentByChild)
    ? parentByChild
    : (hasBodyExecData(parentBody) ? parentBody : (hasBodyExecData(parentBodyFromDetail) ? parentBodyFromDetail : null))
  const cacheKey = `${idSurveyNum}|${sourceId}|${JSON.stringify(bodySnapshot)}`
  if (conexionCardDataCache.has(cacheKey)) return conexionCardDataCache.get(cacheKey)
  const body = bodySnapshot
  const bodyPadre = bodyPadrePreferido || body
  const bodyHijo = hasBodyExecData(childBody) ? childBody : fallbackBody

  const fuentesPrioridadPadre = [
    bodyPadre,
    parentBodyFromDetail,
    parentBodyFromRow,
    parentHeaderFromRow,
    parentDetailRaw,
    parentSurveyRow,
    body,
    survey
  ]

  const pickExact = (keys = []) => {
    for (const src of fuentesPrioridadPadre) {
      const v = valorDesdeExacto(src, keys)
      if (v) return v
    }
    return ''
  }

  const pickAny = (keys = []) => {
    for (const src of fuentesPrioridadPadre) {
      const v = valorDesde(src, keys)
      if (v) return v
    }
    return ''
  }

  const pickContains = (keys = []) => {
    for (const src of fuentesPrioridadPadre) {
      const v = valorDesdeContieneSeguro(src, keys)
      if (v) return v
    }
    return ''
  }

  const numeroProyecto =
    pickAny(['proyecto', 'numero proyecto', 'n proyecto', 'nro proyecto', 'numero_proyecto', 'num proyecto', 'proyecto numero', 'n de proyecto', 'n proyecto']) ||
    pickContains(['numeroproyecto', 'nproyecto']) ||
    valorPlano(parentSurveyRow?.id_proyecto)

  let supMetrogasRaw =
    pickExact(['gio', 'gio a cargo', 'gio mg', 'nombre gio', 'nombre gio mg', 'gestor interior de obra']) ||
    pickExact(['sup metrogas', 'supervisor metrogas', 'sup_metrogas', 'nombre supervisor metrogas']) ||
    pickContains(['gio', 'giomg', 'gestorinteriordeobra']) ||
    pickContains(['metrogas'])

  const supTerraconRaw =
    valorDesdeExacto(body, ['sup terracon', 'supervisor terracon', 'sup_terracon', 'id_user_supervisor']) ||
    valorDesdeExacto(parentSurveyRow, ['sup terracon', 'supervisor terracon', 'sup_terracon', 'id_user_supervisor']) ||
    valorDesdeExacto(survey, ['sup terracon', 'supervisor terracon', 'sup_terracon', 'id_user_supervisor']) ||
    parentSurveyRow?.id_user ||
    parentSurveyRow?.nombre_user ||
    survey?.id_user ||
    survey?.nombre_user

  const supTerracon = resolverNombreUsuario(supTerraconRaw)
  let supMetrogas = resolverNombrePlano(supMetrogasRaw)
  if (!esValorValidoSupMetrogas(supMetrogas)) supMetrogas = ''

  if (
    supMetrogas &&
    supTerracon &&
    normalizarTexto(supMetrogas) === normalizarTexto(supTerracon)
  ) {
    const metrogasAlt =
      valorDesdeExacto(body, ['nombre certificador', 'certificador']) ||
      valorDesdeExacto(parentSurveyRow, ['nombre certificador', 'certificador']) ||
      valorDesdeExacto(survey, ['nombre certificador', 'certificador'])
    if (
      metrogasAlt &&
      normalizarTexto(metrogasAlt) !== normalizarTexto(supTerracon) &&
      esValorValidoSupMetrogas(metrogasAlt)
    ) {
      supMetrogasRaw = metrogasAlt
      supMetrogas = resolverNombrePlano(supMetrogasRaw)
    }
  }

  if (!supMetrogas || !esValorValidoSupMetrogas(supMetrogas)) {
    const metrogasAlt =
      valorDesdeExacto(body, ['nombre certificador', 'certificador']) ||
      valorDesdeExacto(parentSurveyRow, ['nombre certificador', 'certificador']) ||
      valorDesdeExacto(survey, ['nombre certificador', 'certificador'])
    if (metrogasAlt && esValorValidoSupMetrogas(metrogasAlt)) {
      supMetrogas = resolverNombrePlano(metrogasAlt)
    }
  }

  const ic =
    valorDesdeExacto(body, ['ic sap mg', 'ic_sap_mg', 'ic sap', 'ic-sap', 'ic_sap', 'icsapmg']) ||
    valorDesdeExacto(parentSurveyRow, ['ic sap mg', 'ic_sap_mg', 'ic sap', 'ic-sap', 'ic_sap', 'icsapmg']) ||
    valorDesdeExacto(survey, ['ic sap mg', 'ic_sap_mg', 'ic sap', 'ic-sap', 'ic_sap', 'icsapmg']) ||
    valorDesdeContieneSeguro(body, ['icsap', 'icsapmg']) ||
    valorDesdeContieneSeguro(parentSurveyRow, ['icsap', 'icsapmg']) ||
    valorDesdeContieneSeguro(survey, ['icsap', 'icsapmg']) ||
    valorDesdeExacto(body, ['ic']) ||
    valorDesdeExacto(parentSurveyRow, ['ic']) ||
    valorDesdeExacto(survey, ['ic'])
  const direccion = valorDesde(body, ['direccion', 'dirección', 'address', 'dir']) || valorDesde(parentSurveyRow, ['direccion', 'dirección', 'address', 'dir']) || valorDesde(survey, ['direccion', 'dirección', 'address', 'dir'])
  const comuna = valorDesde(body, ['comuna']) || valorDesde(parentSurveyRow, ['comuna']) || valorDesde(survey, ['comuna'])
  const direccionComunaRaw =
    pickAny(['direccion y comuna', 'dirección y comuna', 'direccion/comuna', 'dirección/comuna']) ||
    pickContains(['direccionycomuna'])
  const direccionComuna = (() => {
    const com = String(comuna || '').trim()
    const raw = String(direccionComunaRaw || '').trim()
    if (raw) {
      if (!com) return raw
      const rawNorm = normalizarTexto(raw)
      const comNorm = normalizarTexto(com)
      if (!comNorm || rawNorm.includes(comNorm)) return raw
      return `${raw} / ${com}`
    }
    const dir = String(direccion || '').trim()
    if (dir && com) return `${dir} / ${com}`
    return dir || com || ''
  })()
  const comunaDisplay = (() => {
    const com = String(comuna || '').trim()
    if (com) return com
    const parts = String(direccionComuna || '').split('/')
    return String(parts?.[parts.length - 1] || '').trim()
  })()
  const proyectoNombre =
    valorDesde(parentSurveyRow, ['nombre proyecto', 'proyecto', 'nombre_proyecto']) ||
    valorDesde(survey, ['nombre proyecto', 'proyecto', 'nombre_proyecto']) ||
    parentSurveyRow?.nombre_proyecto ||
    survey?.nombre_proyecto
  const orden = (() => {
    const candidates = [
      pickAny(['numero orden', 'nro orden', 'n° orden', 'orden trabajo', 'n orden', 'n de orden']),
      pickContains(['numeroorden', 'nroorden', 'ordentrabajo', 'nmroordenmg']),
      pickAny(['orden', 'ot', 'o/t'])
    ]
      .map(v => String(v || '').trim())
      .filter(v => v && v !== '-')

    return (
      candidates.find(v => /\d{5,}/.test(v)) ||
      candidates.find(v => !/^(?:ot\s*)?\d{1,3}$/i.test(v)) ||
      candidates[0] ||
      '-'
    )
  })()
  const idSurvey = String(idSurveyNum || '-')
  const fechaAsignacionRaw =
    pickAny(['fecha', 'fecha asignacion', 'fecha asignación', 'fecha_asignacion', 'fecha asig', 'fecha de asignacion', 'fecha de asignación']) ||
    pickContains(['fechaasignacion', 'fechadeasignacion', 'fecha']) ||
    ''
  const fechaFilaRaw = fechaAsignacionRaw || survey?.fecha_real_ini || survey?.fecha_real_fin || survey?.fecha_plan_ini || survey?.fecha_plan_fin || ''
  const fechaAsignacion = formatFechaConexionDisplay(fechaAsignacionRaw)
  const fechaFila = formatFechaConexionDisplay(fechaFilaRaw)
  const tipoTrabajoRaw =
    valorDesde(bodyPadre, ['tipo empalme gasificar', 'tipoempalmegasificar', 'tipo empaleme gasificar', 'tipoempalemegasificar', 'tipo empalme/gasificar']) ||
    valorDesde(body, ['tipo empalme gasificar', 'tipoempalmegasificar', 'tipo empaleme gasificar', 'tipoempalemegasificar', 'tipo empalme/gasificar']) ||
    valorDesde(parentSurveyRow, ['tipo empalme gasificar', 'tipoempalmegasificar', 'tipo empaleme gasificar', 'tipoempalemegasificar', 'tipo empalme/gasificar']) ||
    valorDesde(survey, ['tipo empalme gasificar', 'tipoempalmegasificar', 'tipo empaleme gasificar', 'tipoempalemegasificar', 'tipo empalme/gasificar'])
  const tecnicoDesdeHijo = infoVinculo.tipo === 'Padre'
    ? getTecnicoAsignadoDesdeHijos(idSurveyNum)
    : ''
  const tecnicoRaw =
    // Prioridad real para técnico:
    // - Si estamos en padre, usar primero el técnico del hijo asignado.
    // - Luego resolver por body/fila del survey actual y fallback técnico del padre.
    tecnicoDesdeHijo ||
    getTecnicoAsignadoDesdeBodyExec(bodyHijo) ||
    valorDesde(bodyHijo, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado']) ||
    valorDesde(survey, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado', 'nombre_tecnico']) ||
    resolverNombreUsuario(survey?.id_user_tecnico) ||
    survey?.nombre_tecnico ||
    getTecnicoAsignadoDesdeBodyExec(bodyPadre) ||
    valorDesde(bodyPadre, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado']) ||
    valorDesde(parentSurveyRow, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado']) ||
    resolverNombreUsuario(parentSurveyRow?.id_user_tecnico) ||
    parentSurveyRow?.nombre_tecnico
  const tecnicoNombre = resolverNombreUsuario(tecnicoRaw)
  const observacion = valorDesde(body, ['observacion', 'observación', 'observaciones', 'obs']) || valorDesde(parentSurveyRow, ['observacion', 'observación', 'observaciones', 'obs']) || valorDesde(survey, ['observacion', 'observación', 'observaciones', 'obs'])

  const result = {
    numeroProyecto: numeroProyecto || '-',
    supMetrogas: supMetrogas || '-',
    supTerracon: supTerracon || '-',
    fechaFila: fechaFila || '-',
    fechaTablaRaw: fechaAsignacionRaw || '',
    tipoTrabajo: normalizeTipoEmpalmeGasificar(tipoTrabajoRaw) || '-',
    nombreTecnico: tecnicoNombre || '-',
    ic: ic || '-',
    direccion: direccion || '-',
    direccionComuna: direccionComuna || direccion || '-',
    comuna: comunaDisplay || '-',
    proyecto: String(proyectoNombre || '-').trim() || '-',
    orden: orden || '-',
    idSurvey: idSurvey || '-',
    fechaAsignacion: fechaAsignacion || '-',
    observacion
  }
  conexionCardDataCache.set(cacheKey, result)
  return result
}

function getReclamoCardData(survey) {
  const idSurvey = Number(survey?.id_survey || 0)
  const detailRaw = surveyDetailRawById.value?.[idSurvey] || null
  const bodyFromDetail = parseBodyExecFromSurveyDetail(detailRaw?.body_exec)
  const bodyFromSurvey = parseBodyExecFromSurveyDetail(survey?.body_exec)
  const body = hasBodyExecData(bodyFromDetail)
    ? bodyFromDetail
    : (hasBodyExecData(bodyFromSurvey) ? bodyFromSurvey : {})

  const numeroReclamo = (() => {
    const candidates = [
      valorDesdeExacto(body, ['nmro reclamo', 'nro reclamo', 'numero reclamo', 'número reclamo', 'n reclamo', 'id reclamo', 'reclamo']),
      valorDesdeContieneSeguro(body, ['nmroreclamo', 'nroreclamo', 'numeroreclamo', 'idreclamo']),
      valorDesde(detailRaw, ['nmro reclamo', 'nro reclamo', 'numero reclamo', 'número reclamo', 'n reclamo', 'id reclamo', 'reclamo']),
      valorDesde(survey, ['nmro reclamo', 'nro reclamo', 'numero reclamo', 'número reclamo', 'n reclamo', 'id reclamo', 'reclamo']),
      valorDesde(body, ['ticket', 'folio', 'caso']),
      valorDesde(detailRaw, ['ticket', 'folio', 'caso']),
      valorDesde(survey, ['ticket', 'folio', 'caso'])
    ]
      .map(v => String(v || '').trim())
      .filter(Boolean)

    const withRec = candidates.find(v => /rec/i.test(v))
    return withRec || '-'
  })()

  const observacionTerraconRaw =
    valorDesdeExacto(body, [
      'observacion/descripción del problema.',
      'observacion descripcion del problema',
      'observación/descripción del problema',
      'observacion terracon',
      'observación terracon',
      'observacion planificador',
      'observación planificador'
    ]) ||
    valorDesdeContieneSeguro(body, [
      'observaciondescripciondelproblema',
      'observacionterracon',
      'observacionplanificador'
    ]) ||
    valorDesdeExacto(detailRaw, [
      'observacion/descripción del problema.',
      'observacion descripcion del problema',
      'observación/descripción del problema',
      'observacion terracon',
      'observación terracon',
      'observacion planificador',
      'observación planificador'
    ]) ||
    valorDesdeExacto(survey, [
      'observacion/descripción del problema.',
      'observacion descripcion del problema',
      'observación/descripción del problema',
      'observacion terracon',
      'observación terracon',
      'observacion planificador',
      'observación planificador'
    ]) ||
    ''
  const observacionTerracon = String(observacionTerraconRaw || '-').trim() || '-'

  const contenidoReclamoRaw =
    valorDesdeExacto(body, ['contenido del reclamo', 'contenido reclamo', 'descripcion reclamo', 'detalle reclamo']) ||
    valorDesdeContieneSeguro(body, ['contenidodelreclamo', 'contenidoreclamo', 'descripcionreclamo', 'detallereclamo']) ||
    valorDesdeExacto(detailRaw, ['contenido del reclamo', 'contenido reclamo', 'descripcion reclamo', 'detalle reclamo']) ||
    valorDesdeExacto(survey, ['contenido del reclamo', 'contenido reclamo', 'descripcion reclamo', 'detalle reclamo']) ||
    ''
  const contenidoReclamo = String(contenidoReclamoRaw || '-').trim() || '-'

  const orden = (() => {
    const candidates = [
      valorDesdeExacto(body, ['numero orden', 'nro orden', 'n° orden', 'orden trabajo', 'n orden', 'n de orden']),
      valorDesdeContieneSeguro(body, ['numeroorden', 'nroorden', 'ordentrabajo', 'nmroordenmg']),
      valorDesde(detailRaw, ['numero orden', 'nro orden', 'n° orden', 'orden trabajo', 'n orden', 'n de orden']),
      valorDesde(survey, ['numero orden', 'nro orden', 'n° orden', 'orden trabajo', 'n orden', 'n de orden']),
      valorDesdeExacto(body, ['ot', 'o/t', 'orden']),
      valorDesde(detailRaw, ['ot', 'o/t', 'orden']),
      valorDesde(survey, ['ot', 'o/t', 'orden']),
      getConexionCardData(survey).orden
    ]
      .map(v => String(v || '').trim())
      .filter(v => v && v !== '-')

    const best =
      candidates.find(v => /\d{5,}/.test(v)) ||
      candidates.find(v => !/^(?:ot\s*)?\d{1,3}$/i.test(v)) ||
      candidates[0] ||
      '-'

    return best
  })()

  const supTerraconRaw =
    // En reclamos, SUP. TERRACON debe salir de "Gio a cargo del Reclamo" / Gestor.
    valorDesdeExacto(body, ['gio a cargo del reclamo', 'gio a cargo', 'gestor', 'nombre gestor', 'id_gestor', 'id gestor', 'gio', 'gio mg', 'nombre gio', 'nombre gio mg']) ||
    valorDesdeContieneSeguro(body, ['gestor', 'idgestor', 'gio', 'giomg', 'gestorinteriordeobra']) ||
    valorDesdeExacto(detailRaw, ['gio a cargo del reclamo', 'gio a cargo', 'gestor', 'nombre gestor', 'id_gestor', 'id gestor', 'gio', 'gio mg', 'nombre gio', 'nombre gio mg']) ||
    valorDesdeContieneSeguro(detailRaw, ['gestor', 'idgestor', 'gio', 'giomg', 'gestorinteriordeobra']) ||
    valorDesdeExacto(survey, ['gio a cargo del reclamo', 'gio a cargo', 'gestor', 'nombre gestor', 'id_gestor', 'id gestor', 'gio', 'gio mg', 'nombre gio', 'nombre gio mg']) ||
    valorDesdeContieneSeguro(survey, ['gestor', 'idgestor', 'gio', 'giomg', 'gestorinteriordeobra']) ||
    getConexionCardData(survey).supTerracon ||
    ''
  const supTerracon = esValorValidoSupMetrogas(supTerraconRaw)
    ? resolverNombreUsuario(supTerraconRaw)
    : '-'

  const statusSrv = String(detailRaw?.estado_srv || survey?.estado_srv || '').trim()
  const estadoRaw = (
    (statusSrv === 'Terminado' || statusSrv === 'APROBADO' || statusSrv === 'VERIFICACION')
      ? statusSrv
      : (
          valorDesdeExacto(body, ['estado conexion', 'estado conexión', 'estado_conexion', 'estado']) ||
          valorDesdeContieneSeguro(body, ['estadoconexion', 'estado']) ||
          valorDesde(detailRaw, ['estado conexion', 'estado conexión', 'estado_conexion', 'estado']) ||
          valorDesde(survey, ['estado conexion', 'estado conexión', 'estado_conexion', 'estado']) ||
          ''
        )
  )
  const estadoNorm = normalizarTexto(estadoRaw)
  const estado = (estadoRaw === 'Terminado' || estadoRaw === 'APROBADO' || estadoRaw === 'VERIFICACION')
    ? estadoRaw
    : (estadoNorm.includes('solucion') ? 'Solucionado' : (estadoNorm.includes('pend') ? 'Pendiente' : '-'))

  const direccion =
    valorDesde(body, ['direccion', 'dirección', 'address', 'dir']) ||
    valorDesde(detailRaw, ['direccion', 'dirección', 'address', 'dir']) ||
    valorDesde(survey, ['direccion', 'dirección', 'address', 'dir'])
  const comuna =
    valorDesde(body, ['comuna']) ||
    valorDesde(detailRaw, ['comuna']) ||
    valorDesde(survey, ['comuna'])
  const direccionComunaRaw =
    valorDesdeExacto(body, ['direccion y comuna', 'dirección y comuna', 'direccion/comuna', 'dirección/comuna']) ||
    valorDesdeContieneSeguro(body, ['direccionycomuna']) ||
    valorDesde(detailRaw, ['direccion y comuna', 'dirección y comuna', 'direccion/comuna', 'dirección/comuna']) ||
    valorDesdeContieneSeguro(detailRaw, ['direccionycomuna']) ||
    valorDesde(survey, ['direccion y comuna', 'dirección y comuna', 'direccion/comuna', 'dirección/comuna'])
  const direccionComuna = (() => {
    const raw = String(direccionComunaRaw || '').trim()
    const com = String(comuna || '').trim()
    if (raw) {
      if (!com) return raw
      const rawNorm = normalizarTexto(raw)
      const comNorm = normalizarTexto(com)
      // Si el campo combinado no trae comuna, la agrega al final.
      if (!comNorm || rawNorm.includes(comNorm)) return raw
      return `${raw} / ${com}`
    }
    const dir = String(direccion || '').trim()
    if (dir && com) return `${dir} / ${com}`
    return dir || com || '-'
  })()

  return {
    numeroReclamo: String(numeroReclamo || '-').trim() || '-',
    orden,
    supTerracon,
    estado,
    observacionTerracon,
    contenidoReclamo,
    direccionComuna: String(direccionComuna || '-').trim() || '-'
  }
}

function resolverNombreUsuario(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const numeric = Number(raw)
  if (!Number.isNaN(numeric) && nombresUsuariosById.value[numeric]) {
    return nombresUsuariosById.value[numeric]
  }
  return raw
}

function resolverNombrePlano(value) {
  return String(value ?? '').trim()
}

function esPlaceholderConexion(value) {
  const n = normalizarCampo(value)
  if (!n) return true
  const placeholders = new Set([
    'medidormetrogas',
    'supmetrogas',
    'supervisormetrogas',
    'supterracon',
    'supervisorterracon',
    'icsap',
    'icsapmg'
  ])
  return placeholders.has(n)
}

function getConexionCardFields(survey) {
  const data = getConexionCardData(survey)
  const infoVinculo = getConexionVinculoInfo(survey)
  return [
    { label: 'Numero Proyecto', value: data.numeroProyecto },
    { label: 'Sup Metrogas', value: data.supMetrogas },
    { label: 'Sup Terracon', value: data.supTerracon },
    { label: 'IC', value: data.ic },
    { label: 'Direccion', value: data.direccionComuna || data.direccion },
    { label: 'Orden', value: data.orden },
    {
      label: 'ID Survey',
      value: data.idSurvey,
      metaTag: infoVinculo.tipo === 'Hijo' && infoVinculo.parentId > 0 ? `Hijo de ${infoVinculo.parentId}` : 'Padre'
    },
    { label: 'Fecha Asignacion', value: data.fechaAsignacion },
    { label: 'Tipo', value: data.tipoTrabajo },
    { label: 'Observacion', value: data.observacion, full: true }
  ]
}

function getConexionVinculoInfo(survey) {
  const idSurvey = Number(survey?.id_survey || 0)
  const fromRow = Number(survey?.id_survey_padre || 0)
  const fromDetail = Number(surveyVinculoBySurvey.value[idSurvey]?.id_survey_padre || 0)
  const parentId = fromDetail || fromRow || 0
  return {
    tipo: parentId > 0 ? 'Hijo' : 'Padre',
    parentId
  }
}

function parseBodyExecFromSurveyDetail(bodyExecRaw) {
  let bodyExec = bodyExecRaw
  if (typeof bodyExec === 'string') {
    const txt = bodyExec.trim()
    if (txt && txt.toLowerCase() !== 'null') {
      try {
        bodyExec = JSON.parse(txt)
      } catch (e) {
        console.error('[Survey] Error parseando body_exec de detail:', e)
        bodyExec = {}
      }
    } else {
      bodyExec = {}
    }
  }
  if (!bodyExec || typeof bodyExec !== 'object') bodyExec = {}
  return bodyExec
}

function hasBodyExecData(bodyExec) {
  return !!(bodyExec && typeof bodyExec === 'object' && Object.keys(bodyExec).length > 0)
}

function extractSurveyDetail(payload) {
  if (!payload) return null
  if (Array.isArray(payload)) return payload[0] || null
  if (Array.isArray(payload?.data)) return payload.data[0] || null
  if (Array.isArray(payload?.datos)) return payload.datos[0] || null
  if (Array.isArray(payload?.surveyDetail)) return payload.surveyDetail[0] || null
  if (payload?.data && typeof payload.data === 'object') return payload.data
  return (typeof payload === 'object') ? payload : null
}

async function fetchSurveyDetailById(idSurvey) {
  const id = Number(idSurvey || 0)
  if (!id) return null

  try {
    const { data } = await apiAxios.get(`/servicio/leanglobal/procesosSurveyDetail?id_survey=${id}`)
    return extractSurveyDetail(data)
  } catch (error) {
    console.error('[Survey] fetchSurveyDetailById error:', id, error?.response?.status || error?.message)
    return null
  }
}

async function cargarDetalleConexiones(listaSurveys = []) {
  const conexiones = (listaSurveys || []).filter(isConexionSurvey)
  if (!conexiones.length || !isOnline.value) return

  const idsBase = conexiones.map(s => Number(s?.id_survey)).filter(id => id > 0)
  if (!idsBase.length) return

  const nextBodyExec = { ...bodyExecDetalleBySurvey.value }
  const nextDetailRaw = { ...surveyDetailRawById.value }
  const nextVinculos = { ...surveyVinculoBySurvey.value }
  const nextParentByChild = { ...parentDetailByChildSurvey.value }
  const procesados = new Set()
  let idsPendientes = idsBase.filter(id => !hasBodyExecData(nextBodyExec[id]) || !nextVinculos[id])

  while (idsPendientes.length) {
    const lote = [...new Set(idsPendientes)].filter(id => !procesados.has(id))
    if (!lote.length) break
    lote.forEach(id => procesados.add(id))

    const resultados = await Promise.allSettled(
      lote.map(id =>
        apiAxios.get(`/servicio/leanglobal/procesosSurveyDetail?id_survey=${id}`)
      )
    )

    const nuevosPadres = []
    resultados.forEach((res, idx) => {
      if (res.status !== 'fulfilled') return
      const idSurvey = lote[idx]
      const payload = res.value?.data
      const detail = extractSurveyDetail(payload)
      if (!detail) return

      nextDetailRaw[idSurvey] = detail
      const parentId = Number(detail?.id_survey_padre || 0)
      nextVinculos[idSurvey] = { id_survey_padre: parentId }
      const bodyParsed = parseBodyExecFromSurveyDetail(detail?.body_exec)
      // Si el body_exec viene vacío (caso frecuente por perfil), usamos el detail completo como respaldo.
      nextBodyExec[idSurvey] = hasBodyExecData(bodyParsed) ? bodyParsed : (detail && typeof detail === 'object' ? detail : {})
      if (parentId > 0 && !hasBodyExecData(nextBodyExec[parentId])) nuevosPadres.push(parentId)
    })

    idsPendientes = nuevosPadres
  }

  bodyExecDetalleBySurvey.value = nextBodyExec
  surveyDetailRawById.value = nextDetailRaw
  surveyVinculoBySurvey.value = nextVinculos

  // Refuerzo: si los hijos no están visibles por filtro de usuario, igual los obtenemos
  // desde la lista RAW para resolver técnico asignado del hijo.
  const parentIdsVisibles = new Set(
    (conexiones || [])
      .map(s => Number(s?.id_survey || 0))
      .filter(id => id > 0)
  )
  const childIdsFromRaw = Object.values(surveysRawById.value || {})
    .filter(r => {
      const pid = Number(r?.id_survey_padre || 0)
      const rid = Number(r?.id_survey || 0)
      return pid > 0 && rid > 0 && parentIdsVisibles.has(pid) && isConexionSurvey(r)
    })
    .map(r => Number(r?.id_survey || 0))
    .filter(id => id > 0)

  for (const childId of [...new Set(childIdsFromRaw)]) {
    if (nextDetailRaw[childId] && hasBodyExecData(nextBodyExec[childId])) continue
    const detailHijo = await fetchSurveyDetailById(childId)
    if (!detailHijo) continue
    nextDetailRaw[childId] = detailHijo
    const parsedHijo = parseBodyExecFromSurveyDetail(detailHijo?.body_exec)
    nextBodyExec[childId] = hasBodyExecData(parsedHijo)
      ? parsedHijo
      : (detailHijo && typeof detailHijo === 'object' ? detailHijo : {})
    const pid = Number(detailHijo?.id_survey_padre || 0)
    if (pid > 0) nextVinculos[childId] = { id_survey_padre: pid }
  }

  // Refuerzo explícito: para cada hijo visible, pedir el detalle del padre por id_survey
  // incluso si no quedó en la lista filtrada del usuario actual.
  const parentIdsNecesarios = [...new Set(
    conexiones
      .map((s) => {
        const sid = Number(s?.id_survey || 0)
        const fromVinculo = Number(nextVinculos[sid]?.id_survey_padre || 0)
        const fromRow = Number(s?.id_survey_padre || 0)
        return fromVinculo || fromRow || 0
      })
      .filter((id) => id > 0 && !hasBodyExecData(nextBodyExec[id]))
  )]

  for (const parentId of parentIdsNecesarios) {
    const detailPadre = await fetchSurveyDetailById(parentId)
    if (!detailPadre) continue

    nextDetailRaw[parentId] = detailPadre
    const parsedPadre = parseBodyExecFromSurveyDetail(detailPadre?.body_exec)
    nextBodyExec[parentId] = hasBodyExecData(parsedPadre)
      ? parsedPadre
      : (detailPadre && typeof detailPadre === 'object' ? detailPadre : {})
  }

  // Llamada explícita por hijo: guarda snapshot de padre asociado al hijo
  // para usarlo directo en la tarjeta (caso técnico externo).
  for (const child of conexiones) {
    const childId = Number(child?.id_survey || 0)
    if (!childId) continue

    const parentId = Number(nextVinculos[childId]?.id_survey_padre || child?.id_survey_padre || 0)
    if (!parentId) continue

    const detailPadre = await fetchSurveyDetailById(parentId)
    if (!detailPadre) continue

    nextDetailRaw[parentId] = detailPadre
    const parsedPadre = parseBodyExecFromSurveyDetail(detailPadre?.body_exec)
    const snapshotPadre = hasBodyExecData(parsedPadre)
      ? parsedPadre
      : (detailPadre && typeof detailPadre === 'object' ? detailPadre : {})

    nextParentByChild[childId] = snapshotPadre
    if (!hasBodyExecData(nextBodyExec[parentId]) && hasBodyExecData(snapshotPadre)) {
      nextBodyExec[parentId] = snapshotPadre
    }
  }

  bodyExecDetalleBySurvey.value = nextBodyExec
  surveyDetailRawById.value = nextDetailRaw
  parentDetailByChildSurvey.value = nextParentByChild
  conexionCardDataCache.clear()
}

async function cargarDetalleReclamos(listaSurveys = []) {
  if (!esVistaReclamos.value || !isOnline.value) return

  const ids = (listaSurveys || [])
    .map(s => Number(s?.id_survey || 0))
    .filter(id => id > 0)

  if (!ids.length) return

  const nextBodyExec = { ...bodyExecDetalleBySurvey.value }
  const nextDetailRaw = { ...surveyDetailRawById.value }

  const pendientes = ids.filter(id => !nextDetailRaw[id])
  if (!pendientes.length) return

  const resultados = await Promise.allSettled(
    pendientes.map(id => apiAxios.get(`/servicio/leanglobal/procesosSurveyDetail?id_survey=${id}`))
  )

  resultados.forEach((res, idx) => {
    if (res.status !== 'fulfilled') return
    const idSurvey = pendientes[idx]
    const detail = extractSurveyDetail(res.value?.data)
    if (!detail) return
    nextDetailRaw[idSurvey] = detail
    const bodyParsed = parseBodyExecFromSurveyDetail(detail?.body_exec)
    nextBodyExec[idSurvey] = hasBodyExecData(bodyParsed)
      ? bodyParsed
      : (detail && typeof detail === 'object' ? detail : {})
  })

  surveyDetailRawById.value = nextDetailRaw
  bodyExecDetalleBySurvey.value = nextBodyExec
}

async function logSurveysFiltradosConDetalleReclamo(listaSurveys = []) {
  if (!esVistaReclamos.value) return

  const reclamos = (listaSurveys || [])
    .filter(s => Number(s?.id_survey || 0) > 0)

  if (!reclamos.length) {
    console.log('[Reclamos] Surveys filtrados + surveyDetail/body_exec: sin registros')
    return
  }

  // Refuerzo: asegura surveyDetail para cada reclamo filtrado (si falta en caché local).
  const idsFaltantes = reclamos
    .map(s => Number(s?.id_survey || 0))
    .filter(id => id > 0 && !surveyDetailRawById.value[id])

  if (idsFaltantes.length && isOnline.value) {
    const nextDetailRaw = { ...surveyDetailRawById.value }
    const nextBodyExec = { ...bodyExecDetalleBySurvey.value }
    const resultados = await Promise.allSettled(
      idsFaltantes.map(id => apiAxios.get(`/servicio/leanglobal/procesosSurveyDetail?id_survey=${id}`))
    )

    resultados.forEach((res, idx) => {
      if (res.status !== 'fulfilled') return
      const idSurvey = idsFaltantes[idx]
      const detail = extractSurveyDetail(res.value?.data)
      if (!detail) return
      nextDetailRaw[idSurvey] = detail
      const bodyParsed = parseBodyExecFromSurveyDetail(detail?.body_exec)
      nextBodyExec[idSurvey] = hasBodyExecData(bodyParsed)
        ? bodyParsed
        : (detail && typeof detail === 'object' ? detail : {})
    })

    surveyDetailRawById.value = nextDetailRaw
    bodyExecDetalleBySurvey.value = nextBodyExec
  }

  const salida = reclamos.map((s) => {
    const idSurvey = Number(s?.id_survey || 0)
    const detail = surveyDetailRawById.value?.[idSurvey] || null
    const bodyFromDetail = parseBodyExecFromSurveyDetail(detail?.body_exec)
    const bodyExec = hasBodyExecData(bodyFromDetail)
      ? bodyFromDetail
      : (bodyExecDetalleBySurvey.value?.[idSurvey] || {})
    const gestor =
      valorDesdeExacto(bodyExec, ['gestor', 'nombre gestor', 'gio', 'gio a cargo', 'nombre gio']) ||
      valorDesdeContieneSeguro(bodyExec, ['gestor', 'gio']) ||
      '-'

    return {
      id_survey: idSurvey,
      codi_template_srv: s?.codi_template_srv,
      name_template_srv: s?.name_template_srv,
      gestor,
      surveyDetail: detail,
      body_exec: bodyExec
    }
  })

  console.groupCollapsed(`[Reclamos] Surveys filtrados + surveyDetail/body_exec (${salida.length})`)
  salida.forEach(row => console.log(row))
  console.groupEnd()
}

async function cargarNombresUsuarios() {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
    const rows = Array.isArray(data) ? data : []
    const next = {}
    for (const u of rows) {
      const id = Number(u?.id_user)
      const nombre = String(u?.nombre_user ?? '').trim()
      if (!Number.isNaN(id) && nombre) next[id] = nombre
    }
    nombresUsuariosById.value = next
  } catch (error) {
    console.error('[Survey] Error cargando nombres de usuarios:', error)
  }
}

// =========================================================================
// MÓDULO SPEC 37: PLAN DE IZAJE DIGITAL REACTIVO Y CROQUIS VECTORIAL SVG
// =========================================================================
const dialogPlanIzaje = ref(false)
const guardandoPlanIzaje = ref(false)
const mensajePlanIzaje = ref('')
const errorPlanIzaje = ref(false)
const urlPdfPlanIzaje = ref('')
const proyectosIzajeDisponibles = ref([])

const formPlanIzaje = reactive({
  id_proyecto: null,
  id_equipo: null,
  cliente_nombre: '',
  grua_modelo: 'Liebherr LTM 1090-4.2 (90 Ton)',
  grua_patente: '',
  elemento_izar: 'Estructura Modular / Equipo Industrial',
  radio_max_m: 14,
  largo_pluma_m: 36.5,
  angulo_deg: 68,
  viento_kmh: 18,
  peso_neto_kg: 11200,
  peso_gancho_kg: 650,
  peso_yugo_kg: 420,
  peso_aparejos_kg: 180,
  capacidad_tabla_kg: 16800,
  operador_nombre: '',
  rigger_nombre: 'Juan Pérez Soto',
  supervisor_nombre: 'Roberto Gómez M.',
  pin_fes: ''
})

const pesoBrutoTotalIzajeKg = computed(() => {
  return (
    (Number(formPlanIzaje.peso_neto_kg) || 0) +
    (Number(formPlanIzaje.peso_gancho_kg) || 0) +
    (Number(formPlanIzaje.peso_yugo_kg) || 0) +
    (Number(formPlanIzaje.peso_aparejos_kg) || 0)
  )
})

const porcentajeUtilizacionIzaje = computed(() => {
  const cap = Number(formPlanIzaje.capacidad_tabla_kg) || 0
  if (cap <= 0) return 100
  return Number(((pesoBrutoTotalIzajeKg.value / cap) * 100).toFixed(1))
})

const excedeLimiteSeguridadIzaje = computed(() => {
  return porcentajeUtilizacionIzaje.value > 85.0
})

const cargarPlanIzajePorProyecto = async (idPry) => {
  if (!idPry) return
  try {
    const { data } = await apiAxios.get(`/operaciones/plan-izaje/proyecto/${idPry}`)
    if (data?.precarga) {
      formPlanIzaje.cliente_nombre = data.precarga.cliente_nombre || ''
      if (data.precarga.equipo) {
        formPlanIzaje.id_equipo = data.precarga.equipo.id_equipo
        formPlanIzaje.grua_modelo = data.precarga.equipo.nombre
        formPlanIzaje.grua_patente = data.precarga.equipo.patente
      }
    }
    if (data?.plan) {
      const p = data.plan
      formPlanIzaje.radio_max_m = Number(p.radio_max_m) || 14
      formPlanIzaje.largo_pluma_m = Number(p.largo_pluma_m) || 36.5
      formPlanIzaje.angulo_deg = Number(p.angulo_deg) || 68
      formPlanIzaje.elemento_izar = p.elemento_izar || formPlanIzaje.elemento_izar
      formPlanIzaje.peso_neto_kg = Number(p.peso_neto_kg) || 11200
      formPlanIzaje.peso_gancho_kg = Number(p.peso_gancho_kg) || 650
      formPlanIzaje.peso_yugo_kg = Number(p.peso_yugo_kg) || 420
      formPlanIzaje.peso_aparejos_kg = Number(p.peso_aparejos_kg) || 180
      formPlanIzaje.capacidad_tabla_kg = Number(p.capacidad_tabla_kg) || 16800
      urlPdfPlanIzaje.value = data.url_pdf || (p.id_file_pdf ? `/api/archivo/ver/${p.id_file_pdf}` : '')
    } else {
      urlPdfPlanIzaje.value = ''
    }
  } catch (err) {
    console.warn('[PlanIzaje] Aviso consultando plan por proyecto:', err)
  }
}

const onCambiarProyectoPlanIzaje = async (idPry) => {
  mensajePlanIzaje.value = ''
  errorPlanIzaje.value = false
  await cargarPlanIzajePorProyecto(idPry)
}

const abrirModalPlanIzaje = async () => {
  mensajePlanIzaje.value = ''
  errorPlanIzaje.value = false
  const perfilLocal = JSON.parse(localStorage.getItem('perfil') || '{}')
  formPlanIzaje.operador_nombre = userDetailStore.userDetail?.nombre_user || perfilLocal?.nombre_user || 'Carlos Muñoz R.'

  try {
    const { data } = await apiAxios.get('/proyectos')
    const rows = Array.isArray(data) ? data : (data?.proyectos || [])
    proyectosIzajeDisponibles.value = rows
      .filter(p => Number(p.id_proyecto_estado) !== 99)
      .sort((a, b) => Number(b.id_proyecto) - Number(a.id_proyecto))
      .map(p => ({
        id_proyecto: p.id_proyecto,
        label: `${p.codi_proyecto || 'OT-' + p.id_proyecto} • ${p.razon_social || p.nombre_proyecto || 'Obra'}`
      }))

    const defaultId =
      viajeActivo.value?.id_proyecto ||
      reportPrincipalPendiente.value?.id_proyecto ||
      proyectosIzajeDisponibles.value[0]?.id_proyecto ||
      null

    if (defaultId) {
      formPlanIzaje.id_proyecto = Number(defaultId)
      await cargarPlanIzajePorProyecto(defaultId)
    }
  } catch (err) {
    console.warn('[PlanIzaje] Error cargando proyectos:', err)
  }

  dialogPlanIzaje.value = true
}

const guardarPlanIzajeFes = async () => {
  if (excedeLimiteSeguridadIzaje.value || !formPlanIzaje.id_proyecto) return
  guardandoPlanIzaje.value = true
  mensajePlanIzaje.value = ''
  errorPlanIzaje.value = false
  try {
    const payload = {
      id_proyecto: formPlanIzaje.id_proyecto,
      id_equipo: formPlanIzaje.id_equipo,
      grua_modelo: formPlanIzaje.grua_modelo,
      grua_patente: formPlanIzaje.grua_patente,
      radio_max_m: formPlanIzaje.radio_max_m,
      largo_pluma_m: formPlanIzaje.largo_pluma_m,
      angulo_deg: formPlanIzaje.angulo_deg,
      elemento_izar: formPlanIzaje.elemento_izar,
      viento_kmh: formPlanIzaje.viento_kmh,
      peso_neto_kg: formPlanIzaje.peso_neto_kg,
      peso_gancho_kg: formPlanIzaje.peso_gancho_kg,
      peso_yugo_kg: formPlanIzaje.peso_yugo_kg,
      peso_aparejos_kg: formPlanIzaje.peso_aparejos_kg,
      capacidad_tabla_kg: formPlanIzaje.capacidad_tabla_kg,
      operador: { nombre: formPlanIzaje.operador_nombre, cargo: 'Operador Grúa' },
      rigger: { nombre: formPlanIzaje.rigger_nombre, cargo: 'Rigger Calificado' },
      supervisor: { nombre: formPlanIzaje.supervisor_nombre, cargo: 'Jefe de Maniobra' },
      pin_fes: formPlanIzaje.pin_fes
    }
    const { data } = await apiAxios.post('/operaciones/plan-izaje/guardar', payload)
    if (data?.success) {
      urlPdfPlanIzaje.value = data.url_pdf || ''
      mensajePlanIzaje.value = 'Plan de Izaje firmado (FES) y PDF A4 con Croquis Vectorial generado exitosamente.'
      errorPlanIzaje.value = false
    }
  } catch (err) {
    errorPlanIzaje.value = true
    mensajePlanIzaje.value = err?.response?.data?.error || err?.message || 'Error al guardar Plan de Izaje'
  } finally {
    guardandoPlanIzaje.value = false
  }
}
</script>

<style scoped>
.surveys-page :deep(.surveys-filter-field .v-field) {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.055) !important;
  box-shadow: none;
  transition: all 0.3s ease;
}

.surveys-page :deep(.surveys-filter-field .v-field__overlay) {
  opacity: 0;
}

.surveys-page :deep(.surveys-filter-field .v-field--variant-outlined .v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--tm-border) !important;
}

.surveys-page :deep(.surveys-filter-field .v-field:hover .v-field__outline) {
  color: rgba(52, 211, 153, 0.42) !important;
}

.surveys-page :deep(.surveys-filter-field .v-field.v-field--focused) {
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18);
}

.surveys-page :deep(.surveys-filter-field .v-field.v-field--focused .v-field__outline) {
  color: var(--tm-emerald) !important;
}

.surveys-page :deep(.surveys-filter-field .v-label.v-field-label) {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--tm-text) !important;
  opacity: 1;
}

.surveys-page :deep(.surveys-filter-field .v-field__input) {
  min-height: 42px;
  padding-top: 8px;
  padding-bottom: 8px;
  color: var(--tm-text) !important;
}

.surveys-page :deep(.surveys-filter-field input),
.surveys-page :deep(.surveys-filter-field .v-select__selection-text) {
  color: var(--tm-text) !important;
  -webkit-text-fill-color: var(--tm-text) !important;
}

.surveys-page :deep(.surveys-filter-field input::placeholder) {
  color: var(--tm-muted) !important;
  opacity: 1;
}

.surveys-page :deep(.surveys-filter-field .v-field__append-inner .v-icon),
.surveys-page :deep(.surveys-filter-field .v-field__clearable .v-icon) {
  color: var(--tm-muted) !important;
}

:global(.surveys-select-menu) {
  border: 1px solid var(--tm-border) !important;
  border-radius: 8px !important;
  background: #162033 !important;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.42) !important;
  overflow: hidden !important;
}

:global(.surveys-select-menu .v-list) {
  background: #162033 !important;
  color: var(--tm-text) !important;
  padding: 4px 0 !important;
}

:global(.surveys-select-menu .v-list-item) {
  min-height: 36px !important;
  color: var(--tm-text) !important;
  padding-inline: 12px !important;
}

:global(.surveys-select-menu .v-list-item:hover),
:global(.surveys-select-menu .v-list-item--active) {
  background: rgba(16, 185, 129, 0.14) !important;
  color: var(--tm-emerald-2) !important;
}

:global(.surveys-select-menu .v-list-item-title) {
  font-size: 0.84rem !important;
  font-weight: 700 !important;
}

:global(.surveys-select-menu ::-webkit-scrollbar) {
  width: 8px;
}

:global(.surveys-select-menu ::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.06);
}

:global(.surveys-select-menu ::-webkit-scrollbar-thumb) {
  background: rgba(156, 163, 175, 0.75);
  border-radius: 999px;
}

tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}
.sombra-resaltada {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18) !important;
  border-radius: 12px;
}
.asignacion-dia-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}
.conexion-priority-card {
  border: 1px solid #b9c8da;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
  padding: 8px;
  display: grid;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.conexion-priority-card:active {
  transform: translateY(1px);
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.12);
}
.conexion-priority-card__top {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.conexion-priority-card__meta-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #1e293b;
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  padding: 2px 6px;
  text-align: center;
  background: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conexion-priority-card__address {
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conexion-priority-card__people {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}
.conexion-priority-card__person-line {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px;
  align-items: center;
  min-width: 0;
}
.conexion-priority-card__label-inline {
  font-size: 0.66rem;
  font-weight: 700;
  color: #0f766e;
  text-transform: uppercase;
}
.conexion-priority-card__value-inline {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reclamo-priority-card {
  border: 1px solid #b9c8da;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
  padding: 8px;
  display: grid;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.reclamo-priority-card:active {
  transform: translateY(1px);
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.12);
}
.reclamo-priority-card__top {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.reclamo-priority-card__meta-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #1e293b;
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  padding: 2px 6px;
  text-align: center;
  background: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reclamo-priority-card__address {
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 8px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reclamo-priority-card__people {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}
.reclamo-priority-card__person-line {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px;
  align-items: center;
  min-width: 0;
}
.reclamo-priority-card__label-inline {
  font-size: 0.66rem;
  font-weight: 700;
  color: #0f766e;
  text-transform: uppercase;
}
.reclamo-priority-card__value-inline {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reclamo-priority-card__value-inline--multiline {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  word-break: break-word;
}
@media (max-width: 600px) {
  .conexion-priority-card {
    padding: 7px;
    gap: 5px;
  }
  .conexion-priority-card__meta-pill {
    font-size: 0.68rem;
    padding: 2px 5px;
  }
  .conexion-priority-card__address {
    font-size: 0.8rem;
  }
  .reclamo-priority-card {
    padding: 7px;
    gap: 5px;
  }
  .reclamo-priority-card__meta-pill {
    font-size: 0.68rem;
    padding: 2px 5px;
  }
  .reclamo-priority-card__address {
    font-size: 0.8rem;
  }
}
.conexion-card {
  border-radius: 14px;
  border: 1px solid #99d9cf;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.12) !important;
  overflow: hidden;
}
.conexion-card :deep(.v-card-title) {
  font-size: 1.02rem;
  line-height: 1.2;
  font-weight: 600;
  padding: 10px 12px 0 !important;
}
.conexion-card :deep(.v-card-subtitle) {
  font-size: 0.8rem;
  line-height: 1.2;
  opacity: 0.85;
  padding: 2px 12px 4px !important;
}
.conexion-card__body {
  padding: 4px 8px 8px;
}
.conexion-card__panel {
  border-radius: 12px;
  padding: 7px;
  border: 1px solid #caebe5;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #eef8f6;
}
.conexion-card__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}
.conexion-card__field {
  border: 1px solid #d7efea;
  border-radius: 10px;
  background: linear-gradient(180deg, #f9fffe 0%, #f1fbf9 100%);
  padding: 6px 8px;
}
.conexion-card__label {
  font-size: 0.6rem;
  font-weight: 700;
  color: #0f766ecc;
  line-height: 1.15;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.conexion-card__value {
  margin-top: 2px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  word-break: break-word;
}
.conexion-card__value--inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.conexion-card__mini-tag {
  font-size: 0.56rem;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 999px;
  color: #0f766e;
  background: #def7f3;
  border: 1px solid #a8ddd4;
  white-space: nowrap;
}
@media (min-width: 600px) {
  .conexion-card__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .conexion-card__field--full {
    grid-column: 1 / -1;
  }
}
.flow-step-unassigned :deep(.v-label.v-field-label) {
  color: #c62828 !important;
  font-weight: 600;
}
:deep(.modal-acta-bsm-dialog .v-overlay__content),
:deep(.modal-acta-bsm-dialog .v-card),
.modal-acta-bsm-opaque {
  background-color: #0b1120 !important;
  background: #0b1120 !important;
  color: #f8fafc !important;
  opacity: 1 !important;
  backdrop-filter: none !important;
}
.modal-acta-bsm-opaque :deep(.v-card-text),
.modal-acta-bsm-opaque :deep(.v-window),
.modal-acta-bsm-opaque :deep(.v-window-item) {
  background-color: #0b1120 !important;
  color: #f8fafc !important;
  opacity: 1 !important;
}
.modal-acta-bsm-opaque :deep(.v-field) {
  background-color: #111827 !important;
  color: #ffffff !important;
  opacity: 1 !important;
}
.modal-acta-bsm-opaque :deep(.v-field__input),
.modal-acta-bsm-opaque :deep(.v-label) {
  color: #f1f5f9 !important;
  opacity: 1 !important;
}
</style>
