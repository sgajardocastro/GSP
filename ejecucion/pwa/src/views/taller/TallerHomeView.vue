<template>
  <v-container class="pa-3 max-w-xl mx-auto pb-32" style="max-width: 680px;">
    <!-- CABECERA TALLER MÓVIL GSP -->
    <div class="mb-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <v-btn icon="mdi-arrow-left" size="default" variant="flat" color="slate-800" class="border border-white/20 rounded-xl" @click="volver"></v-btn>
        <div class="text-center flex-grow-1 px-2">
          <div class="text-[10px] font-black text-amber-400 text-uppercase tracking-widest">
            GSP MANTENIMIENTO & TALLER
          </div>
          <div class="text-xl font-black text-white">
            🛠️ Taller Móvil
          </div>
        </div>
        <v-chip size="small" color="amber-darken-2" variant="flat" class="text-xs font-mono font-black rounded-lg">
          PWA
        </v-chip>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- 1️⃣ BLOQUE A: APERTURA DE TRABAJOS (NUEVA OTM)                             -->
    <!-- ========================================================================= -->
    <v-card class="mb-4 rounded-2xl border border-amber-400 dark:border-amber-600 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden">
      <div class="h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
      <div class="pa-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center ga-2.5">
            <div class="pa-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 d-flex align-center justify-center">
              <v-icon size="22">mdi-wrench-outline</v-icon>
            </div>
            <div>
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Apertura de Trabajos
              </div>
              <div class="text-base font-black text-slate-900 dark:text-white leading-tight">
                Nueva Orden de Trabajo (OTM)
              </div>
            </div>
          </div>

          <v-chip
            size="small"
            color="amber-darken-2"
            variant="flat"
            class="font-bold text-[10px] uppercase text-white"
          >
            DISPONIBLE
          </v-chip>
        </div>

        <div class="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Apertura in-situ de mantenimiento preventivo, correctivo o predictivo con asignación de mecánico y horómetros.
        </div>

        <v-btn
          color="amber-darken-2"
          variant="flat"
          class="w-100 font-bold text-none rounded-xl py-3 elevation-0 text-white"
          prepend-icon="mdi-plus-circle"
          @click="abrirNuevaOtModalGeneral"
        >
          ➕ Abrir Nueva Orden de Trabajo (OTM) ➔
        </v-btn>
      </div>
    </v-card>

    <!-- ========================================================================= -->
    <!-- 2️⃣ BLOQUE B: ALERTAS DE TERRENO (AVISO DE AVERÍA / FALLA)                 -->
    <!-- ========================================================================= -->
    <v-card class="mb-4 rounded-2xl border border-rose-400 dark:border-rose-600 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden">
      <div class="h-1 bg-gradient-to-r from-rose-500 to-red-600"></div>
      <div class="pa-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center ga-2.5">
            <div class="pa-2 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 d-flex align-center justify-center">
              <v-icon size="22">mdi-alert-octagon-outline</v-icon>
            </div>
            <div>
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Alertas de Terreno
              </div>
              <div class="text-base font-black text-slate-900 dark:text-white leading-tight">
                Aviso de Avería / Falla
              </div>
            </div>
          </div>

          <v-chip
            size="small"
            color="rose-darken-3"
            variant="flat"
            class="font-bold text-[10px] uppercase text-white"
          >
            URGENCIAS
          </v-chip>
        </div>

        <div class="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Reporte inmediato de anomalías mecánicas, fugas hidráulicas, ruidos o códigos de falla con captura de fotos desde terreno.
        </div>

        <v-btn
          color="rose-darken-3"
          variant="flat"
          class="w-100 font-bold text-none rounded-xl py-3 elevation-0 text-white"
          prepend-icon="mdi-alert-circle-outline"
          @click="mostrarReportarAvisoModal = true"
        >
          🚨 Reportar Avería o Falla Urgente ➔
        </v-btn>
      </div>
    </v-card>

    <!-- ========================================================================= -->
    <!-- 3️⃣ BLOQUE C: TRABAJOS EN CURSO (BANDEJA DE OTMS ACTIVAS)                  -->
    <!-- ========================================================================= -->
    <v-card class="mb-4 rounded-2xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden">
      <div class="h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
      <div class="pa-4">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="d-flex align-center ga-2.5">
            <div class="pa-2 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 d-flex align-center justify-center">
              <v-icon size="22">mdi-clipboard-list-outline</v-icon>
            </div>
            <div>
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Trabajos en Curso
              </div>
              <div class="text-base font-black text-slate-900 dark:text-white leading-tight">
                Bandeja de OTMs Activas
              </div>
            </div>
          </div>

          <v-chip
            size="small"
            color="info"
            variant="flat"
            class="font-bold text-[10px] uppercase text-white font-mono"
          >
            {{ otsFiltradasFinal.length }} ACTIVAS
          </v-chip>
        </div>

        <!-- Buscador integrado por patente o código interno -->
        <v-text-field
          v-model="busquedaTexto"
          density="compact"
          placeholder="Buscar patente, código (GPT-xxx), falla..."
          variant="outlined"
          color="primary"
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          class="mb-3 text-xs"
        ></v-text-field>

        <!-- Filtros rápidos por estado -->
        <div class="d-flex ga-2 mb-3 overflow-x-auto pb-1">
          <v-chip
            filter
            size="small"
            :color="filtroEstado === 'TODAS' ? 'primary' : 'grey'"
            @click="filtroEstado = 'TODAS'"
            class="font-bold text-[11px]"
          >
            Todas ({{ otsFiltradasPorTexto.length }})
          </v-chip>
          <v-chip
            filter
            size="small"
            :color="filtroEstado === 'EN_PROCESO' ? 'primary' : 'grey'"
            @click="filtroEstado = 'EN_PROCESO'"
            class="font-bold text-[11px]"
          >
            En Proceso ({{ otsFiltradasPorTexto.filter(o => o.estado === 'EN_PROCESO').length }})
          </v-chip>
          <v-chip
            filter
            size="small"
            :color="filtroEstado === 'ABIERTA' ? 'primary' : 'grey'"
            @click="filtroEstado = 'ABIERTA'"
            class="font-bold text-[11px]"
          >
            Abiertas ({{ otsFiltradasPorTexto.filter(o => o.estado === 'ABIERTA').length }})
          </v-chip>
        </div>

        <!-- Estado de Carga -->
        <div v-if="cargando" class="text-center py-6">
          <v-progress-circular indeterminate color="primary" size="32" class="mb-2"></v-progress-circular>
          <div class="text-xs text-slate-400 font-mono">Actualizando OTMs en curso...</div>
        </div>

        <!-- Listado de OTMs Activas -->
        <div v-else class="space-y-2">
          <div v-if="otsFiltradasFinal.length === 0" class="text-center py-8 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-white/10 p-4">
            <div class="text-2xl mb-1">🎉</div>
            <div class="text-xs font-bold text-slate-700 dark:text-white uppercase">Sin OTMs Coincidentes</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">No hay órdenes en proceso o abiertas con los filtros seleccionados.</div>
          </div>

          <div
            v-for="ot in otsFiltradasFinal"
            :key="ot.id_ot"
            class="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-sm cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all mb-2.5"
            @click="irAOt(ot.id_ot)"
          >
            <div class="d-flex align-center justify-space-between mb-1.5">
              <div class="d-flex align-center ga-2">
                <span class="text-sm font-mono font-black text-blue-600 dark:text-blue-400">
                  {{ ot.numero_ot || ot.folio }}
                </span>
                <v-chip size="x-small" :color="ot.prioridad === 1 ? 'error' : (ot.prioridad === 2 ? 'warning' : 'grey')" class="font-bold font-mono">
                  P{{ ot.prioridad || 3 }}
                </v-chip>
                <v-chip v-if="ot.tipo_mantenimiento" size="x-small" color="primary" variant="outlined" class="font-bold text-[9px]">
                  {{ ot.tipo_mantenimiento }}
                </v-chip>
              </div>
              <v-chip size="x-small" :color="ot.estado === 'CERRADA' ? 'success' : (ot.estado === 'EN_PROCESO' ? 'warning' : 'info')" variant="flat" class="font-black text-[9px] font-mono">
                {{ ot.estado }}
              </v-chip>
            </div>

            <div class="text-sm font-black text-slate-900 dark:text-white mb-1">
              {{ ot.patente || `Grúa #${ot.id_equipo}` }}
              <span v-if="ot.equipo_codigo" class="text-xs text-slate-500 dark:text-slate-400 font-mono font-normal">({{ ot.equipo_codigo }})</span>
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-400 mb-2 truncate">
              {{ ot.descripcion_falla || 'Mantenimiento preventivo programado' }}
            </div>

            <div class="d-flex align-center justify-space-between pt-2 border-t border-slate-200 dark:border-white/10 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>Mecánico: <strong class="text-slate-800 dark:text-white">{{ ot.nombre_tecnico || 'Por asignar' }}</strong></span>
              <span class="text-blue-600 dark:text-blue-400 font-bold">Atender OT ➔</span>
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- ================================================================= -->
    <!-- MODAL 1: FICHA CLÍNICA 360° DEL ACTIVO (3 PESTAÑAS) -->
    <!-- ================================================================= -->
    <v-dialog v-model="mostrarFichaClinicaModal" max-width="580" scrollable>
      <v-card class="rounded-2xl bg-slate-950 text-white border border-white/20">
        <!-- Cabecera Ficha Técnica y QR Oficial -->
        <div class="pa-4 bg-slate-900 border-b border-white/10 d-flex justify-space-between align-center">
          <div>
            <div class="text-[10px] font-mono uppercase font-black text-emerald-400 tracking-wider flex items-center gap-1">
              <span>📱</span> FICHA QR OFICIAL • GSP
            </div>
            <div class="text-lg font-black text-white">
              {{ equipoFicha?.equipo_codigo || equipoFicha?.patente }}
              <span class="text-sm text-slate-400 font-normal">({{ equipoFicha?.patente }})</span>
            </div>
            <div class="text-xs text-slate-300">
              {{ equipoFicha?.marca }} {{ equipoFicha?.modelo }}
            </div>
          </div>
          <div class="d-flex align-center ga-1">
            <v-btn
              size="small"
              variant="tonal"
              color="emerald"
              class="font-black text-xs rounded-xl"
              prepend-icon="mdi-open-in-new"
              @click="abrirEnlaceQrExterno"
            >
              Abrir QR
            </v-btn>
            <v-btn icon="mdi-close" size="small" variant="text" @click="mostrarFichaClinicaModal = false"></v-btn>
          </div>
        </div>

        <!-- Selector de Pestañas de la Ficha Clínica -->
        <div class="grid grid-cols-4 gap-1 p-2 bg-slate-900/80 border-b border-white/10 text-center">
          <v-btn
            size="small"
            :variant="tabFicha === 'QR_OFICIAL' ? 'flat' : 'text'"
            :color="tabFicha === 'QR_OFICIAL' ? 'emerald-darken-2' : 'slate-400'"
            class="text-[10px] font-bold rounded-lg"
            @click="tabFicha = 'QR_OFICIAL'"
          >
            📱 Ficha QR
          </v-btn>
          <v-btn
            size="small"
            :variant="tabFicha === 'DOCS' ? 'flat' : 'text'"
            :color="tabFicha === 'DOCS' ? 'amber-darken-2' : 'slate-400'"
            class="text-[10px] font-bold rounded-lg"
            @click="tabFicha = 'DOCS'"
          >
            📑 Docs ({{ documentosFicha.length }})
          </v-btn>
          <v-btn
            size="small"
            :variant="tabFicha === 'HISTORIAL' ? 'flat' : 'text'"
            :color="tabFicha === 'HISTORIAL' ? 'amber-darken-2' : 'slate-400'"
            class="text-[10px] font-bold rounded-lg"
            @click="tabFicha = 'HISTORIAL'"
          >
            🛠️ OTs ({{ historialOts.length }})
          </v-btn>
          <v-btn
            size="small"
            :variant="tabFicha === 'PATIO' ? 'flat' : 'text'"
            :color="tabFicha === 'PATIO' ? 'amber-darken-2' : 'slate-400'"
            class="text-[10px] font-bold rounded-lg"
            @click="tabFicha = 'PATIO'"
          >
            📋 Patio
          </v-btn>
        </div>

        <v-card-text class="pa-4" style="max-height: 520px;">
          <!-- CARGANDO FICHA -->
          <div v-if="cargandoFicha" class="text-center py-10">
            <v-progress-circular indeterminate color="amber" size="40" class="mb-2"></v-progress-circular>
            <div class="text-xs text-slate-400">Consultando antecedentes del activo...</div>
          </div>

          <div v-else>
            <!-- SUB-PESTAÑA 0: VISTA QR OFICIAL EMBEBIDA -->
            <div v-if="tabFicha === 'QR_OFICIAL'" class="h-full">
              <iframe
                v-if="urlFichaQr"
                :src="urlFichaQr"
                class="w-full rounded-xl border border-white/10"
                style="height: 480px; background: #0a0a0a;"
              ></iframe>
              <div v-else class="text-center py-8 text-slate-400 text-xs">
                No se pudo resolver la URL del código QR para este equipo.
              </div>
            </div>

            <!-- SUB-PESTAÑA 1: DOCUMENTACIÓN Y CERTIFICACIONES -->
            <div v-else-if="tabFicha === 'DOCS'" class="space-y-3">
              <div v-if="documentosFicha.length === 0" class="text-center py-6 text-slate-400 text-xs">
                No registra certificados ni documentos cargados para esta grúa.
              </div>

              <div
                v-for="(doc, idx) in documentosFicha"
                :key="idx"
                class="p-3 rounded-xl bg-slate-900 border border-white/10 d-flex justify-space-between align-center mb-2"
              >
                <div class="min-w-0 pr-2">
                  <div class="text-xs font-bold text-white truncate">{{ doc.nombre }}</div>
                  <div class="d-flex align-center ga-2 mt-1">
                    <v-chip
                      size="x-small"
                      :color="doc.estado === 'Vigente' ? 'emerald' : (doc.estado === 'Por Vencer' ? 'amber' : 'rose')"
                      class="font-black text-[9px]"
                    >
                      {{ doc.estado }}
                    </v-chip>
                    <span class="text-[10px] text-slate-400 font-mono">Vence: {{ doc.fechaVencimiento }}</span>
                  </div>
                </div>

                <v-btn
                  v-if="doc.url && doc.url !== '#'"
                  size="small"
                  variant="outlined"
                  color="amber"
                  class="font-black text-xs rounded-lg shrink-0"
                  prepend-icon="mdi-download"
                  @click="abrirDocumento(doc.url)"
                >
                  Ver PDF
                </v-btn>
              </div>
            </div>

            <!-- SUB-PESTAÑA 2: HISTORIAL DE OTS ANTERIORES -->
            <div v-else-if="tabFicha === 'HISTORIAL'" class="space-y-3">
              <div v-if="historialOts.length === 0" class="text-center py-6 text-slate-400 text-xs">
                No registra órdenes de trabajo históricas en el taller.
              </div>

              <div
                v-for="otHist in historialOts"
                :key="otHist.id_ot"
                class="p-3 rounded-xl bg-slate-900 border border-white/10 mb-2 cursor-pointer hover:border-amber-500/50"
                @click="irAOt(otHist.id_ot)"
              >
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-xs font-mono font-black text-amber-400">{{ otHist.numero_ot }}</span>
                  <v-chip size="x-small" :color="otHist.estado === 'CERRADA' ? 'emerald' : 'amber'" class="font-black text-[9px]">
                    {{ otHist.estado }}
                  </v-chip>
                </div>
                <div class="text-xs text-white font-bold mb-1 truncate">
                  {{ otHist.descripcion_falla || 'Mantenimiento' }}
                </div>
                <div class="d-flex justify-space-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                  <span>{{ otHist.tipo_mantenimiento }}</span>
                  <span>{{ otHist.fecha_cierre_real ? formatDate(otHist.fecha_cierre_real) : formatDate(otHist.fecha_creacion) }}</span>
                </div>
                <div v-if="otHist.diagnostico_final" class="mt-1 text-[11px] text-slate-300 italic bg-black/30 p-1.5 rounded">
                  Diagnóstico: {{ otHist.diagnostico_final }}
                </div>
              </div>
            </div>

            <!-- SUB-PESTAÑA 3: INSPECCIONES DE PATIO (TEMPLATE 79) -->
            <div v-else-if="tabFicha === 'PATIO'" class="space-y-3">
              <div v-if="inspeccionesPatio.length === 0" class="text-center py-6 text-slate-400 text-xs">
                No registra inspecciones de entrada/salida de patio para este equipo.
              </div>

              <div
                v-for="insp in inspeccionesPatio"
                :key="insp.id_survey"
                class="p-3 rounded-xl bg-slate-900 border border-white/10 mb-2"
              >
                <div class="d-flex justify-space-between align-center mb-1">
                  <div class="d-flex align-center ga-1.5">
                    <v-chip size="x-small" :color="insp.tipo_movimiento === 'ENTRADA' ? 'blue' : 'amber'" class="font-black text-[9px]">
                      {{ insp.tipo_movimiento || 'PATIO' }}
                    </v-chip>
                    <span class="text-xs font-bold text-white">Checklist #{{ insp.id_survey }}</span>
                  </div>
                  <span class="text-[10px] font-mono text-slate-400">{{ formatDate(insp.created_at) }}</span>
                </div>

                <div class="text-[11px] text-slate-300 mt-1">
                  Inspector: <strong class="text-white">{{ insp.inspector_nombre || 'Despachador Patio' }}</strong>
                </div>
                <div v-if="insp.observaciones" class="text-[11px] text-slate-400 mt-1 bg-black/30 p-1.5 rounded">
                  {{ insp.observaciones }}
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ================================================================= -->
    <!-- MODAL 2: ABRIR NUEVA OT DE TALLER IN-SITU -->
    <!-- ================================================================= -->
    <v-dialog v-model="mostrarNuevaOtModal" max-width="500">
      <v-card class="pa-4 rounded-2xl bg-slate-950 text-white border border-white/20">
        <div class="d-flex align-center justify-space-between mb-3">
          <div>
            <div class="text-[10px] font-mono font-black text-amber-400 uppercase">Apertura en Terreno</div>
            <div class="font-black uppercase text-base">Nueva OT de Taller</div>
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" @click="mostrarNuevaOtModal = false"></v-btn>
        </div>

        <div v-if="errorNuevaOt" class="bg-red-900/50 p-2 rounded-lg text-xs text-red-300 mb-3 font-mono">
          {{ errorNuevaOt }}
        </div>

        <!-- Selector Desplegable de Grúa de la Flota -->
        <div class="mb-3">
          <label class="block text-[11px] font-bold text-slate-300 uppercase mb-1">Grúa / Activo de Flota *</label>
          <v-autocomplete
            v-model="equipoParaOt"
            :items="radarFlota"
            item-title="label_selector"
            return-object
            placeholder="Buscar patente, código o modelo..."
            variant="outlined"
            density="compact"
            color="amber"
            clearable
            hide-details
            @update:model-value="onSeleccionarEquipoNuevaOt"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="`${item.raw.marca} ${item.raw.modelo} • ${item.raw.tonelaje_capacidad || 0}T`">
                <template #prepend>
                  <v-chip size="x-small" color="amber-darken-2" class="mr-2 font-mono font-bold">{{ item.raw.equipo_codigo || item.raw.patente }}</v-chip>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>

          <!-- Resumen de la Grúa Seleccionada -->
          <div v-if="equipoParaOt" class="p-3 bg-slate-900 rounded-xl mt-1 border border-white/10">
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-[10px] text-slate-400 uppercase font-bold">Equipo Seleccionado</div>
                <div class="text-sm font-black text-amber-400 font-mono">
                  {{ equipoParaOt.equipo_codigo || equipoParaOt.patente }} • {{ equipoParaOt.patente }}
                </div>
                <div class="text-xs text-white">
                  {{ equipoParaOt.marca }} {{ equipoParaOt.modelo }}
                </div>
              </div>
              <v-chip
                v-if="equipoParaOt.ot_activa_folio"
                size="x-small"
                color="rose-darken-3"
                class="font-mono font-bold"
              >
                ⚠️ OT: {{ equipoParaOt.ot_activa_folio }}
              </v-chip>
            </div>
          </div>
        </div>

        <!-- Tipo y Alcance -->
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-300 uppercase mb-1">Tipo Trabajo *</label>
            <v-select
              v-model="formNuevaOt.tipo_mantenimiento"
              :items="['PREVENTIVO', 'CORRECTIVO']"
              variant="outlined"
              density="compact"
              color="amber"
              hide-details
            ></v-select>
          </div>

          <div v-if="equipoParaOt?.tiene_doble_horometro">
            <label class="block text-[11px] font-bold text-slate-300 uppercase mb-1">Alcance *</label>
            <v-select
              v-model="formNuevaOt.alcance_mantenimiento"
              :items="[
                { title: '🏗️ Grúa (Izaje)', value: 'SUPERESTRUCTURA_GRUA' },
                { title: '🚚 Tracto (Chasis)', value: 'CHASIS_TRACTO' },
                { title: '⚙️ Integral (Ambos)', value: 'INTEGRAL_AMBOS' }
              ]"
              variant="outlined"
              density="compact"
              color="amber"
              hide-details
            ></v-select>
          </div>
        </div>

        <!-- Inputs de Horómetros / Odómetro Adaptativos -->
        <div class="p-3 bg-slate-900 rounded-xl mb-3 border border-white/10 space-y-2">
          <div class="text-[10px] text-amber-400 uppercase font-mono font-bold mb-1">
            Lecturas de Tablero al Ingreso
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold text-slate-300 uppercase mb-1">Horómetro Grúa (hrs) *</label>
              <input
                v-model.number="formNuevaOt.horometro_grua_inicio"
                type="number"
                step="0.1"
                placeholder="0.0"
                class="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div v-if="equipoParaOt?.tiene_doble_horometro">
              <label class="block text-[10px] font-bold text-slate-300 uppercase mb-1">Odómetro Tracto (km)</label>
              <input
                v-model.number="formNuevaOt.odometro_inicio"
                type="number"
                step="1"
                placeholder="0"
                class="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        <!-- Técnico y Prioridad -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <div>
            <label class="text-[11px] font-bold text-slate-300 uppercase block mb-1">Técnico Responsable *</label>
            <v-select
              v-model="formNuevaOt.id_tecnico_responsable"
              :items="tecnicos"
              item-title="label_display"
              item-value="id_user"
              variant="outlined"
              density="compact"
              color="amber"
              hide-details
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="item.raw.categoria_rol">
                  <template #prepend>
                    <span class="mr-2 text-sm">{{ item.raw.icono_rol }}</span>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-300 uppercase block mb-1">Prioridad *</label>
            <v-select
              v-model="formNuevaOt.prioridad"
              :items="[
                { title: '🔴 P1 - Urgente / Parada', value: 1 },
                { title: '🟡 P2 - Media', value: 2 },
                { title: '🟢 P3 - Rutinaria', value: 3 }
              ]"
              variant="outlined"
              density="compact"
              color="amber"
              hide-details
            ></v-select>
          </div>
        </div>

        <!-- Motivo o Falla -->
        <div class="mb-3">
          <label class="block text-[11px] font-bold text-slate-300 uppercase mb-1">Motivo del Trabajo o Falla Detectada *</label>
          <textarea
            v-model="formNuevaOt.descripcion_falla"
            rows="3"
            placeholder="Describa el trabajo a realizar o falla detectada..."
            class="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed"
          ></textarea>
        </div>

        <v-btn
          block
          color="amber-darken-2"
          class="font-black text-xs uppercase py-3"
          :loading="guardandoNuevaOt"
          @click="crearNuevaOtSubmit"
        >
          Iniciar Orden de Trabajo
        </v-btn>
      </v-card>
    </v-dialog>

    <!-- MODAL ESCÁNER QR -->
    <v-dialog v-model="mostrarScannerModal" max-width="400">
      <v-card class="pa-4 rounded-2xl bg-slate-950 text-white border border-white/20">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="font-black uppercase text-sm">Escanear QR de Grúa</div>
          <v-btn icon="mdi-close" size="small" variant="text" @click="mostrarScannerModal = false"></v-btn>
        </div>
        <div class="p-4 bg-slate-900 rounded-xl text-center mb-3">
          <v-icon size="64" color="amber">mdi-qrcode-scan</v-icon>
          <div class="text-xs text-slate-300 mt-2">Apunte la cámara al código QR ubicado en el chasis de la grúa.</div>
        </div>
        <label class="block text-[11px] font-bold text-slate-300 uppercase mb-1">Patente de la Grúa</label>
        <v-text-field
          v-model="busquedaTexto"
          placeholder="Ej: GPT-135, KLYT-88..."
          variant="outlined"
          density="compact"
          color="amber"
          hide-details
          class="mb-3 font-mono uppercase"
          @keyup.enter="seleccionarPorEscaneo"
        ></v-text-field>
        <v-btn block color="amber" class="font-black" @click="seleccionarPorEscaneo">
          Buscar en Catálogo
        </v-btn>
      </v-card>
    </v-dialog>

    <!-- MODAL REPORTAR AVISO DE FALLA IN-SITU -->
    <v-dialog v-model="mostrarReportarAvisoModal" max-width="500">
      <v-card class="pa-4 rounded-2xl bg-slate-950 text-white border border-white/20">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="font-black uppercase text-sm">Reportar Aviso de Avería</div>
          <v-btn icon="mdi-close" size="small" variant="text" @click="mostrarReportarAvisoModal = false"></v-btn>
        </div>

        <div v-if="errorAviso" class="bg-red-900/50 p-2 rounded-lg text-xs text-red-300 mb-3">
          {{ errorAviso }}
        </div>

        <!-- Tarjeta de Identidad del Reportante -->
        <div class="p-3 bg-slate-900 border border-white/10 rounded-xl mb-3 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="text-amber-400 text-base">👤</span>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Reportado por:</span>
              <span class="font-bold text-white">{{ usuarioReportaNombre }}</span>
            </div>
          </div>
          <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">Sesión Verificada</span>
        </div>

        <div class="mb-3">
          <label class="text-[11px] font-bold text-slate-300 uppercase block mb-1">Grúa Afectada *</label>
          <v-autocomplete
            v-model="formAviso.id_equipo"
            :items="radarFlota"
            item-title="label_selector"
            item-value="id_equipo"
            placeholder="Buscar grúa por patente, código o modelo..."
            variant="outlined"
            density="compact"
            color="amber"
            clearable
            hide-details
            @update:model-value="onSeleccionarEquipoAviso"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="`${item.raw.marca} ${item.raw.modelo} • ${item.raw.tonelaje_capacidad || 0}T`">
                <template #prepend>
                  <v-chip size="x-small" color="amber-darken-2" class="mr-2 font-mono font-bold">{{ item.raw.equipo_codigo || item.raw.patente }}</v-chip>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </div>

        <div class="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label class="text-[11px] font-bold text-slate-300 uppercase block mb-1">Criticidad del Aviso *</label>
            <v-select
              v-model="formAviso.criticidad"
              :items="[
                { title: '🔴 Parada Máquina', value: 'PARADA_MAQUINA' },
                { title: '🟡 Degradado', value: 'DEGRADADO' },
                { title: '⚪ Observación', value: 'OBSERVACION' }
              ]"
              variant="outlined"
              density="compact"
              color="amber"
              hide-details
            ></v-select>
          </div>
          <div>
            <label class="text-[11px] font-bold text-slate-300 uppercase block mb-1">Horómetro Reportado</label>
            <input
              v-model.number="formAviso.horometro"
              type="number"
              step="0.1"
              placeholder="0.0"
              class="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div class="mb-3">
          <label class="text-[11px] font-bold text-slate-300 uppercase block mb-1">Descripción de la Falla o Síntoma *</label>
          <textarea
            v-model="formAviso.descripcion_sintoma"
            rows="3"
            class="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed"
            placeholder="Describa el síntoma, fuga, ruido o código de falla..."
          ></textarea>
        </div>

        <!-- Módulo de Evidencias Fotográficas -->
        <div class="p-3 bg-slate-900 border border-white/10 rounded-xl mb-4 space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-[10px] font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span>📷</span> Evidencias Fotográficas ({{ fotosAviso.length }})
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="dispararCamaraAviso"
                class="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] uppercase flex items-center gap-1"
              >
                <v-icon size="12">mdi-camera</v-icon>
                Cámara
              </button>
              <button
                type="button"
                @click="dispararGaleriaAviso"
                class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-[10px] uppercase border border-white/10 flex items-center gap-1"
              >
                <v-icon size="12">mdi-image-plus</v-icon>
                Galería
              </button>
            </div>
          </div>

          <input
            type="file"
            ref="inputCamaraAvisoRef"
            accept="image/*"
            capture="environment"
            class="hidden"
            @change="alSeleccionarFotoAviso"
          />
          <input
            type="file"
            ref="inputGaleriaAvisoRef"
            accept="image/*"
            multiple
            class="hidden"
            @change="alSeleccionarFotoAviso"
          />

          <!-- Miniaturas de Fotos Cargadas -->
          <div v-if="subiendoFotoAviso" class="text-center py-2 text-xs text-amber-400 font-mono">
            Subiendo evidencia a almacenamiento seguro...
          </div>
          <div v-if="fotosAviso.length > 0" class="flex flex-wrap gap-2 pt-1">
            <div
              v-for="(f, fIdx) in fotosAviso"
              :key="fIdx"
              class="relative rounded-lg overflow-hidden border border-white/20 w-16 h-16 bg-black group"
            >
              <img :src="resolverFotoUrl(f)" class="w-full h-full object-cover" />
              <button
                type="button"
                @click="eliminarFotoAviso(fIdx)"
                class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold"
              >
                ✕
              </button>
            </div>
          </div>
          <div v-else-if="!subiendoFotoAviso" class="text-[10px] text-slate-500 italic">
            Puede adjuntar fotos de la fuga, tablero de control o pieza dañada.
          </div>
        </div>

        <v-btn
          block
          color="rose-darken-2"
          class="font-black text-xs uppercase py-3"
          :loading="guardandoAviso"
          @click="enviarAvisoFalla"
        >
          Emitir Aviso de Falla
        </v-btn>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
/* eslint-disable */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import useProfileStore from '@/store/profile.js'
import { resolverFotoUrl } from '@/utils/storage'

const router = useRouter()
const profileStore = useProfileStore()
const cargando = ref(true)
const vistaActual = ref('OTS')
const filtroEstado = ref('TODAS')
const busquedaTexto = ref('')
const equipoBuscado = ref(null)

const ots = ref([])
const radarFlota = ref([])
const tecnicos = ref([])

// Modales
const mostrarScannerModal = ref(false)
const mostrarReportarAvisoModal = ref(false)
const mostrarFichaClinicaModal = ref(false)
const mostrarNuevaOtModal = ref(false)

// Ficha Clínica & QR Oficial State
const tabFicha = ref('QR_OFICIAL')
const equipoFicha = ref(null)
const cargandoFicha = ref(false)
const documentosFicha = ref([])
const historialOts = ref([])
const inspeccionesPatio = ref([])

const urlFichaQr = computed(() => {
  const patente = equipoFicha.value?.patente
  if (!patente) return ''
  return `https://servidor.leanglobal.cl/lg-gsp-dev/equipo/${patente.trim().toUpperCase()}`
})

const abrirFichaQr = (eq) => {
  equipoFicha.value = eq
  tabFicha.value = 'QR_OFICIAL'
  mostrarFichaClinicaModal.value = true
  abrirFichaClinica(eq)
}

const abrirEnlaceQrExterno = () => {
  if (urlFichaQr.value) {
    window.open(urlFichaQr.value, '_blank')
  }
}

const alSeleccionarEquipoBuscador = (eq) => {
  if (!eq) {
    busquedaTexto.value = ''
    return
  }
  vistaActual.value = 'FLOTA'
  busquedaTexto.value = eq.patente || eq.equipo_codigo || ''
}

// Nueva OT State
const equipoParaOt = ref(null)
const guardandoNuevaOt = ref(false)
const errorNuevaOt = ref('')
const formNuevaOt = ref({
  id_equipo: null,
  tipo_mantenimiento: 'PREVENTIVO',
  alcance_mantenimiento: 'SUPERESTRUCTURA_GRUA',
  horometro_grua_inicio: 0,
  horometro_chasis_inicio: 0,
  odometro_inicio: 0,
  id_tecnico_responsable: null,
  prioridad: 2,
  descripcion_falla: ''
})

// Aviso State
const errorAviso = ref('')
const guardandoAviso = ref(false)
const subiendoFotoAviso = ref(false)
const inputCamaraAvisoRef = ref(null)
const inputGaleriaAvisoRef = ref(null)
const fotosAviso = ref([])
const formAviso = ref({
  id_equipo: null,
  criticidad: 'DEGRADADO',
  descripcion: '',
  descripcion_sintoma: '',
  horometro: null
})

// Nombre de Usuario Reportante Resuelto
const usuarioReportaNombre = computed(() => {
  let nombre = ''
  try {
    const perfilLocal = JSON.parse(localStorage.getItem('perfil') || '{}')
    nombre = profileStore.NOMBRE_USUARIO || 
      `${profileStore.NOMBRE || ''} ${profileStore.APELLIDO_PATERNO || ''}`.trim() ||
      perfilLocal.NOMBRE_USUARIO || 
      `${perfilLocal.NOMBRE || ''} ${perfilLocal.APELLIDO_PATERNO || ''}`.trim() ||
      perfilLocal.name_frst ||
      'Usuario Móvil GSP'
  } catch {
    nombre = 'Usuario Móvil GSP'
  }
  return nombre
})

// Helper de Normalización de Texto (ignora guiones, puntos y espacios)
const normalizar = (txt) => String(txt || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

// Equipos Filtrados en Tiempo Real
const equiposFiltrados = computed(() => {
  const q = normalizar(busquedaTexto.value)
  if (!q) return radarFlota.value
  return radarFlota.value.filter(e => {
    return (
      normalizar(e.patente).includes(q) ||
      normalizar(e.equipo_codigo).includes(q) ||
      normalizar(e.marca).includes(q) ||
      normalizar(e.modelo).includes(q) ||
      normalizar(e.equipo_nombre).includes(q)
    )
  })
})

// OTs Filtradas por Texto
const otsFiltradasPorTexto = computed(() => {
  const q = normalizar(busquedaTexto.value)
  if (!q) return ots.value
  return ots.value.filter(o => {
    return (
      normalizar(o.patente).includes(q) ||
      normalizar(o.equipo_codigo).includes(q) ||
      normalizar(o.numero_ot).includes(q) ||
      normalizar(o.folio).includes(q) ||
      normalizar(o.descripcion_falla).includes(q)
    )
  })
})

// OTs Filtradas por Estado
const otsFiltradasFinal = computed(() => {
  if (filtroEstado.value === 'TODAS') return otsFiltradasPorTexto.value
  return otsFiltradasPorTexto.value.filter(o => o.estado === filtroEstado.value)
})

const cargarDatos = async () => {
  cargando.value = true
  try {
    const [resOts, resRadar, resTecnicos] = await Promise.all([
      api.get('/mantenimiento/ots').catch(() => ({ data: { data: [] } })),
      api.get('/mantenimiento/flota/radar').catch(() => ({ data: { data: [] } })),
      api.get('/mantenimiento/tecnicos').catch(() => ({ data: { data: [] } }))
    ])

    if (Array.isArray(resOts.data?.data)) {
      ots.value = resOts.data.data
    }
    if (Array.isArray(resRadar.data?.data)) {
      radarFlota.value = resRadar.data.data.map(e => ({
        ...e,
        label_selector: `${e.equipo_codigo || e.patente} • ${e.marca} ${e.modelo} (${e.patente})`
      }))
    }
    if (Array.isArray(resTecnicos.data?.data)) {
      tecnicos.value = resTecnicos.data.data
    }
  } catch (err) {
    console.error('Error cargando taller móvil:', err)
  } finally {
    cargando.value = false
  }
}

const irAOt = (idOt) => {
  router.push(`/taller/ot/${idOt}`)
}

const irAOtFolio = (folio) => {
  const match = ots.value.find(o => (o.numero_ot === folio || o.folio === folio))
  if (match) {
    irAOt(match.id_ot)
  } else {
    alert(`OT ${folio} no encontrada en la bandeja actual.`)
  }
}

const irASurvey = (idTemplate) => {
  router.push({
    path: '/surveys',
    query: { template: idTemplate }
  })
}

const seleccionarPorEscaneo = () => {
  mostrarScannerModal.value = false
  vistaActual.value = 'FLOTA'
}

// =========================================================================
// GESTIÓN DE FICHA CLÍNICA 360°
// =========================================================================
const abrirFichaClinica = async (eq) => {
  equipoFicha.value = eq
  tabFicha.value = 'DOCS'
  mostrarFichaClinicaModal.value = true
  cargandoFicha.value = true
  documentosFicha.value = []
  historialOts.value = []
  inspeccionesPatio.value = []

  try {
    const [resCerts, resHoja] = await Promise.all([
      api.get(`/tequ-equipos/${eq.id_equipo}/certificados`).catch(() => ({ data: { data: [] } })),
      api.get(`/mantenimiento/equipo/${eq.id_equipo}/hoja-vida`).catch(() => ({ data: { data: {} } }))
    ])

    // 1. Mapear Certificados
    const certs = resCerts.data?.data || []
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const getStatusText = (dateStr) => {
      if (!dateStr) return 'Vencido'
      try {
        const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
        const expiry = new Date(y, m - 1, d)
        const diffDays = Math.floor((expiry - now) / (1000 * 60 * 60 * 24))
        if (diffDays < 0) return 'Vencido'
        if (diffDays <= 30) return 'Por Vencer'
        return 'Vigente'
      } catch { return 'Vencido' }
    }

    const apiBase = String(api.defaults.baseURL || '').replace(/\/$/, '')
    documentosFicha.value = certs.map(doc => {
      let displayDate = doc.fecha_vencimiento
      if (displayDate) {
        const parts = displayDate.split('T')[0].split('-')
        if (parts.length === 3) displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return {
        id: doc.id_certificado,
        nombre: doc.nombre_tipo || doc.name_doc_orig || 'Certificado Técnico',
        fechaVencimiento: displayDate || 'S/I',
        estado: getStatusText(doc.fecha_vencimiento),
        url: doc.id_doc ? `${apiBase}/archivo/ver/${doc.id_doc}` : '#'
      }
    })

    // 2. Mapear Historial de OTs
    const hoja = resHoja.data?.data || {}
    historialOts.value = hoja.ots || []
    inspeccionesPatio.value = hoja.inspecciones_patio || []

  } catch (err) {
    console.error('Error cargando ficha clínica:', err)
  } finally {
    cargandoFicha.value = false
  }
}

const abrirDocumento = (url) => {
  if (url && url !== '#') {
    window.open(url, '_blank')
  }
}

// =========================================================================
// GESTIÓN DE NUEVA OT IN-SITU
// =========================================================================
const onSeleccionarEquipoNuevaOt = (eq) => {
  if (!eq) {
    equipoParaOt.value = null
    formNuevaOt.value.id_equipo = null
    formNuevaOt.value.horometro_grua_inicio = 0
    formNuevaOt.value.horometro_chasis_inicio = 0
    formNuevaOt.value.odometro_inicio = 0
    return
  }
  equipoParaOt.value = eq
  formNuevaOt.value.id_equipo = eq.id_equipo
  const horoGrua = Number(eq.horometro_grua_acumulado || eq.horometro_actual || 0)
  const horoChasis = Number(eq.horometro_chasis_acumulado || 0)
  const odo = Number(eq.odometro_acumulado || 0)

  formNuevaOt.value.horometro_grua_inicio = horoGrua
  formNuevaOt.value.horometro_chasis_inicio = horoChasis
  formNuevaOt.value.odometro_inicio = odo
  formNuevaOt.value.alcance_mantenimiento = eq.tiene_doble_horometro ? 'SUPERESTRUCTURA_GRUA' : 'SUPERESTRUCTURA_GRUA'
}

const abrirNuevaOtModalGeneral = () => {
  errorNuevaOt.value = ''
  equipoParaOt.value = null
  formNuevaOt.value = {
    id_equipo: null,
    tipo_mantenimiento: 'CORRECTIVO',
    alcance_mantenimiento: 'SUPERESTRUCTURA_GRUA',
    horometro_grua_inicio: 0,
    horometro_chasis_inicio: 0,
    odometro_inicio: 0,
    id_tecnico_responsable: tecnicos.value[0]?.id_user || null,
    prioridad: 2,
    descripcion_falla: ''
  }
  mostrarNuevaOtModal.value = true
}

const abrirNuevaOtModal = (eq) => {
  errorNuevaOt.value = ''
  formNuevaOt.value = {
    id_equipo: eq.id_equipo,
    tipo_mantenimiento: 'CORRECTIVO',
    alcance_mantenimiento: eq.tiene_doble_horometro ? 'SUPERESTRUCTURA_GRUA' : 'SUPERESTRUCTURA_GRUA',
    horometro_grua_inicio: Number(eq.horometro_grua_acumulado || eq.horometro_actual || 0),
    horometro_chasis_inicio: Number(eq.horometro_chasis_acumulado || 0),
    odometro_inicio: Number(eq.odometro_acumulado || 0),
    id_tecnico_responsable: tecnicos.value[0]?.id_user || null,
    prioridad: 2,
    descripcion_falla: ''
  }
  onSeleccionarEquipoNuevaOt(eq)
  mostrarNuevaOtModal.value = true
}

const crearNuevaOtSubmit = async () => {
  errorNuevaOt.value = ''
  if (!formNuevaOt.value.id_equipo) {
    errorNuevaOt.value = 'Debe seleccionar un equipo de la flota.'
    return
  }
  if (!formNuevaOt.value.descripcion_falla || !formNuevaOt.value.id_tecnico_responsable) {
    errorNuevaOt.value = 'Debe ingresar la descripción del trabajo y seleccionar un mecánico responsable.'
    return
  }

  try {
    guardandoNuevaOt.value = true
    let idUserSesion = null
    try {
      const perfilLocal = JSON.parse(localStorage.getItem('perfil') || '{}')
      idUserSesion = profileStore.ID_USUARIO || perfilLocal.ID_USUARIO || perfilLocal.id_user || null
    } catch { /* ignore */ }

    const payload = {
      ...formNuevaOt.value,
      horometro_inicio: formNuevaOt.value.horometro_grua_inicio,
      id_user: idUserSesion,
      id_user_creador: idUserSesion
    }
    const res = await api.post('/mantenimiento/ots', payload)
    if (res.data?.success && res.data?.data?.id_ot) {
      mostrarNuevaOtModal.value = false
      router.push(`/taller/ot/${res.data.data.id_ot}`)
    } else {
      throw new Error(res.data?.error || 'No se pudo generar la OT.')
    }
  } catch (err) {
    errorNuevaOt.value = err.response?.data?.error || err.message
  } finally {
    guardandoNuevaOt.value = false
  }
}

// =========================================================================
// GESTIÓN DE AVISO DE AVERÍA & FOTOGRAFÍAS EN TERRENO
// =========================================================================
const onSeleccionarEquipoAviso = (idEquipo) => {
  if (!idEquipo) return
  const eq = radarFlota.value.find(e => e.id_equipo === idEquipo)
  if (eq) {
    formAviso.value.horometro = Number(eq.horometro_grua_acumulado || eq.horometro_actual || 0)
  }
}

const dispararCamaraAviso = () => {
  if (inputCamaraAvisoRef.value) {
    inputCamaraAvisoRef.value.value = ''
    inputCamaraAvisoRef.value.click()
  }
}

const dispararGaleriaAviso = () => {
  if (inputGaleriaAvisoRef.value) {
    inputGaleriaAvisoRef.value.value = ''
    inputGaleriaAvisoRef.value.click()
  }
}

const alSeleccionarFotoAviso = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  subiendoFotoAviso.value = true

  try {
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('archivo', file)
      formData.append('tenant_code', 'gsp')
      formData.append('modulo', 'mantenimiento')
      formData.append('tipo_doc', 'AVISO_FALLA')
      formData.append('mimetype', file.type || 'image/jpeg')
      formData.append('name_doc_orig', file.name || `falla_${Date.now()}.jpg`)
      formData.append('estado', 'A')

      const uploadRes = await api.post('/v1/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const idDoc = uploadRes.data?.data?.id_doc
      const urlFoto = uploadRes.data?.data?.url_view || (idDoc ? `/api/v1/storage/view/${idDoc}` : null)
      if (urlFoto || idDoc) {
        fotosAviso.value.push({
          id_doc: idDoc,
          url: urlFoto,
          nombre: file.name
        })
      }
    }
  } catch (err) {
    console.error('Error subiendo foto de aviso:', err)
    alert('No se pudo subir la fotografía. Reintente.')
  } finally {
    subiendoFotoAviso.value = false
  }
}

const eliminarFotoAviso = (idx) => {
  fotosAviso.value.splice(idx, 1)
}

const enviarAvisoFalla = async () => {
  errorAviso.value = ''
  const desc = formAviso.value.descripcion_sintoma || formAviso.value.descripcion
  if (!formAviso.value.id_equipo || !desc) {
    errorAviso.value = 'Debe indicar la grúa afectada y describir la falla.'
    return
  }

  guardandoAviso.value = true
  try {
    let idUser = null
    try {
      const perfilLocal = JSON.parse(localStorage.getItem('perfil') || '{}')
      idUser = profileStore.ID_USUARIO || perfilLocal.ID_USUARIO || perfilLocal.id_user || null
    } catch { /* ignore */ }

    const payload = {
      id_equipo: formAviso.value.id_equipo,
      criticidad: formAviso.value.criticidad,
      descripcion: desc,
      descripcion_sintoma: desc,
      horometro: formAviso.value.horometro || null,
      id_user: idUser,
      nombre_usuario: usuarioReportaNombre.value,
      fotos: fotosAviso.value.map(f => ({ id_doc: f.id_doc, url: f.url }))
    }
    const res = await api.post('/mantenimiento/avisos', payload)
    if (res.data?.success) {
      mostrarReportarAvisoModal.value = false
      formAviso.value = { id_equipo: null, criticidad: 'DEGRADADO', descripcion: '', descripcion_sintoma: '', horometro: null }
      fotosAviso.value = []
      alert('Aviso de falla registrado exitosamente en la bitácora.')
      cargarDatos()
    }
  } catch (err) {
    errorAviso.value = err.response?.data?.error || err.message
  } finally {
    guardandoAviso.value = false
  }
}

const formatDate = (isoStr) => {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return '' }
}

const volver = () => {
  router.push('/surveys')
}

onMounted(() => {
  cargarDatos()
})
</script>
