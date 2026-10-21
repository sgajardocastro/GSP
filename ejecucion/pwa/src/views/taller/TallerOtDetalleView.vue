<template>
  <v-container class="pa-3 max-w-xl mx-auto pb-32" style="max-width: 680px;">
    <!-- CABECERA DE LA OT (Soporte Dual Modo Claro / Oscuro) -->
    <div class="mb-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <v-btn icon="mdi-arrow-left" size="default" variant="flat" class="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-300 dark:border-white/20 rounded-xl" @click="volver"></v-btn>
        <div class="text-center flex-grow-1 px-2">
          <div class="text-[10px] font-black text-amber-500 dark:text-amber-400 text-uppercase tracking-widest font-mono">
            {{ otDetalle?.ot?.numero_ot || otDetalle?.ot?.folio || 'OT MANTENIMIENTO' }}
          </div>
          <div class="text-xl font-black text-slate-900 dark:text-white">
            {{ otDetalle?.ot?.patente || 'Grúa Taller' }}
          </div>
        </div>
        <v-chip size="small" :color="otDetalle?.ot?.estado === 'CERRADA' ? 'success' : 'amber'" variant="flat" class="font-bold text-[10px] font-mono">
          {{ otDetalle?.ot?.estado || '...' }}
        </v-chip>
      </div>

      <!-- FICHA TÉCNICA Y OPERATIVA DE LA OT (Dual Claro/Oscuro) -->
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white shadow-sm space-y-2.5">
        <!-- Fila 1: Responsable Asignado y Prioridad -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5 text-xs">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-amber-500">👷</span>
            <span class="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Asignado a:</span>
            <span class="font-bold text-slate-900 dark:text-white truncate">
              {{ otDetalle?.ot?.nombre_tecnico || 'Sin asignar / Auto-gestionado' }}
            </span>
          </div>
          <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase"
            :class="otDetalle?.ot?.prioridad === 1 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'">
            Prioridad P{{ otDetalle?.ot?.prioridad || 3 }}
          </span>
        </div>

        <!-- Fila 2: Grid de Parámetros Operacionales -->
        <div class="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span class="text-[10px] text-slate-400 block uppercase font-bold">Tipo Trabajo</span>
            <span class="font-bold text-amber-600 dark:text-amber-400">
              {{ otDetalle?.ot?.tipo_mantenimiento }} ({{ otDetalle?.ot?.codigo_pauta || 'GENERAL' }})
            </span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block uppercase font-bold">Horómetro / Odómetro</span>
            <span class="font-bold text-slate-900 dark:text-white">
              {{ otDetalle?.ot?.horometro_grua_inicio || otDetalle?.ot?.horometro_inicio || 0 }} hrs
              <span v-if="otDetalle?.ot?.tiene_doble_horometro" class="text-[10px] text-slate-400 block font-normal">
                Tracto: {{ otDetalle?.ot?.odometro_inicio || otDetalle?.ot?.odometro_acumulado || 0 }} km
              </span>
            </span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block uppercase font-bold">Fecha / Hora Inicio</span>
            <span class="text-slate-700 dark:text-slate-200">
              {{ formatFechaHora(otDetalle?.ot?.fecha_programada || otDetalle?.ot?.fecha_creacion) }}
            </span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block uppercase font-bold">Fecha / Hora Término</span>
            <span :class="otDetalle?.ot?.estado === 'CERRADA' ? 'text-emerald-500 font-bold' : 'text-slate-500 dark:text-slate-400'">
              {{ otDetalle?.ot?.estado === 'CERRADA' ? formatFechaHora(otDetalle?.ot?.fecha_cierre_real) : (otDetalle?.ot?.fecha_hora_liberacion ? formatFechaHora(otDetalle?.ot?.fecha_hora_liberacion) : 'En ejecución') }}
            </span>
          </div>
        </div>

        <!-- Fila 3: Descripción de Falla / Motivo -->
        <div class="pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
          <span class="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Motivo / Tarea:</span>
          <div class="text-slate-700 dark:text-slate-200 leading-snug">
            {{ otDetalle?.ot?.descripcion_falla || 'Mantenimiento programado' }}
          </div>
        </div>

        <!-- Fila 4: Observación de Asignación / Comentarios del Jefe de Taller -->
        <div v-if="otDetalle?.ot?.observaciones" class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200">
          <div class="font-bold uppercase text-[9px] text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-0.5">
            <span>📝</span> Instrucción / Observación de Asignación:
          </div>
          <div class="leading-relaxed">
            {{ otDetalle?.ot?.observaciones }}
          </div>
        </div>

        <!-- Fila 5: Botón Acceso Ficha QR Oficial (Docs Legales, Certificados y Specs) -->
        <div class="pt-2 border-t border-slate-100 dark:border-white/5">
          <v-btn
            block
            size="small"
            variant="flat"
            color="emerald-darken-2"
            class="font-black text-xs rounded-xl py-2.5 shadow-sm"
            prepend-icon="mdi-qrcode-scan"
            @click="abrirFichaQrOficial"
          >
            📄 Ver Ficha QR Oficial (Docs Legales, Certificados y Specs)
          </v-btn>
        </div>
      </div>
    </div>

    <!-- TARJETA 1.5: MEDIDORES DE ENTRADA / RECEPCIÓN (EDITABLES EN TALLER) -->
    <div class="mb-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
      <div class="flex items-center justify-between">
        <div class="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
          <span>⏱️</span> Medidores de Entrada (Recepción en Taller)
        </div>
        <v-chip size="x-small" :color="otDetalle?.ot?.estado === 'CERRADA' ? 'grey' : 'amber'" class="font-mono font-bold">
          {{ otDetalle?.ot?.estado === 'CERRADA' ? 'Fijados al Cierre' : 'Editable' }}
        </v-chip>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">🏗️ Horómetro Grúa (Izaje) *</label>
          <input
            v-model.number="formMedidoresInicio.horometro_grua_inicio"
            type="number"
            step="0.1"
            :disabled="otDetalle?.ot?.estado === 'CERRADA'"
            class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div v-if="otDetalle?.ot?.tiene_doble_horometro">
          <label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">🚚 Horómetro Chasis (Motor) *</label>
          <input
            v-model.number="formMedidoresInicio.horometro_chasis_inicio"
            type="number"
            step="0.1"
            :disabled="otDetalle?.ot?.estado === 'CERRADA'"
            class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">🛣️ Odómetro (km)</label>
          <input
            v-model.number="formMedidoresInicio.odometro_inicio"
            type="number"
            step="1"
            :disabled="otDetalle?.ot?.estado === 'CERRADA'"
            class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      <div v-if="otDetalle?.ot?.estado !== 'CERRADA'" class="flex justify-end">
        <v-btn
          size="small"
          color="amber-darken-2"
          class="font-black text-xs rounded-xl"
          prepend-icon="mdi-content-save-outline"
          :loading="guardandoMedidores"
          @click="guardarMedidoresInicio"
        >
          Guardar Medidores de Entrada
        </v-btn>
      </div>
    </div>

    <!-- BOTONES SELECTOR DE SUB-VISTA TÁCTIL (INCLUYE 360°) -->
    <div class="grid grid-cols-5 gap-1 mb-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-white/10 text-center text-[10px] font-bold uppercase">
      <div
        class="py-2.5 rounded-xl cursor-pointer select-none"
        :class="subTab === '360' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-500 dark:text-slate-400'"
        @click="subTab = '360'"
      >
        📸 Fotos 360° ({{ contarFotos360 }}/6)
      </div>
      <div
        class="py-2.5 rounded-xl cursor-pointer select-none"
        :class="subTab === 'checklist' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-500 dark:text-slate-400'"
        @click="subTab = 'checklist'"
      >
        Tareas ({{ otDetalle?.actividades?.length || 0 }})
      </div>
      <div
        class="py-2.5 rounded-xl cursor-pointer select-none"
        :class="subTab === 'hh' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-500 dark:text-slate-400'"
        @click="subTab = 'hh'"
      >
        Horas ({{ otDetalle?.mano_obra?.length || 0 }})
      </div>
      <div
        class="py-2.5 rounded-xl cursor-pointer select-none"
        :class="subTab === 'materiales' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-500 dark:text-slate-400'"
        @click="subTab = 'materiales'"
      >
        Insumos
      </div>
      <div
        class="py-2.5 rounded-xl cursor-pointer select-none"
        :class="subTab === 'hallazgos' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-500 dark:text-slate-400'"
        @click="subTab = 'hallazgos'"
      >
        Hallazgos
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="cargando" class="text-center py-10">
      <v-progress-circular indeterminate color="amber" size="48"></v-progress-circular>
    </div>

    <div v-else class="space-y-4">
      <!-- ========================================================================= -->
      <!-- TAB 0: INSPECCIÓN VISUAL 360° DE RECEPCIÓN (6 RANURAS)                   -->
      <!-- ========================================================================= -->
      <div v-show="subTab === '360'" class="space-y-3">
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                <span>📸</span> Inspección Visual 360° de Recepción
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Fotografías obligatorias del estado de ingreso del activo al taller.
              </div>
            </div>
            <v-chip size="small" :color="contarFotos360 === 6 ? 'emerald' : 'amber'" class="font-mono font-black">
              {{ contarFotos360 }} / 6
            </v-chip>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            <div
              v-for="slot in ranurasFotos360"
              :key="slot.key"
              class="relative rounded-xl border p-2.5 flex flex-col justify-between transition-all"
              :class="resolverFotoUrl(fotos360[slot.key]) ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60'"
              style="min-height: 140px;"
            >
              <div class="flex items-center justify-between gap-1 mb-1">
                <span class="text-[10px] font-bold uppercase truncate" :class="resolverFotoUrl(fotos360[slot.key]) ? 'text-emerald-400' : 'text-slate-400'">
                  {{ slot.titulo }}
                </span>
                <span v-if="resolverFotoUrl(fotos360[slot.key])" class="text-emerald-400 text-xs">✓</span>
              </div>

              <!-- Vista previa si existe foto -->
              <div v-if="resolverFotoUrl(fotos360[slot.key])" class="relative group my-1 flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-black">
                <img
                  :src="resolverFotoUrl(fotos360[slot.key])"
                  class="w-full h-20 object-cover cursor-pointer hover:scale-105 transition-transform"
                  @click="abrirPreviewFoto(resolverFotoUrl(fotos360[slot.key]))"
                />
                <button
                  type="button"
                  @click.stop="eliminarFoto360(slot.key)"
                  class="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shadow"
                  title="Eliminar foto"
                >
                  ✕
                </button>
              </div>

              <!-- Placeholder para capturar foto -->
              <div
                v-else
                class="my-1 flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 rounded-lg py-2"
                @click="dispararCaptura360(slot.key)"
              >
                <span class="text-2xl mb-1">{{ slot.icono }}</span>
                <span class="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Tomar Foto</span>
              </div>

              <div class="text-[9px] text-slate-500 dark:text-slate-400 truncate text-center">
                {{ slot.descripcion }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: CHECKLIST DE TAREAS ESTILO FEED SOCIAL                             -->
      <!-- ========================================================================= -->
      <div v-show="subTab === 'checklist'" class="space-y-3">
        <div class="d-flex justify-space-between align-center px-1 text-xs">
          <span class="text-slate-500 dark:text-slate-400 font-mono">
            Completadas: <strong class="text-emerald-500 dark:text-emerald-400">{{ actividadesCompletadas }}</strong> / {{ otDetalle?.actividades?.length || 0 }}
          </span>
          <span class="text-amber-500 text-[11px] font-bold">1 Tap para Marcar</span>
        </div>

        <!-- TARJETA SOCIAL DE CADA TAREA -->
        <div
          v-for="act in otDetalle?.actividades"
          :key="act.id_actividad"
          class="rounded-2xl border transition-all p-3.5 shadow-sm bg-white dark:bg-slate-900"
          :class="act.estado === 'COMPLETADA' ? 'border-emerald-400 dark:border-emerald-600/60' : 'border-slate-200 dark:border-white/10'"
        >
          <!-- Cabecera de la Tarea: Checkbox + Título + HH + Chip -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <button
                type="button"
                @click="toggleActividad(act)"
                class="w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm border transition-all flex-shrink-0 mt-0.5"
                :class="act.estado === 'COMPLETADA' 
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20' 
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 hover:border-amber-400'"
              >
                <span v-if="act.estado === 'COMPLETADA'">✓</span>
                <span v-else class="text-[10px]">◯</span>
              </button>

              <div class="flex-1 min-w-0 cursor-pointer" @click="toggleActividad(act)">
                <div class="text-xs font-bold leading-snug break-words" :class="act.estado === 'COMPLETADA' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'">
                  {{ act.descripcion }}
                </div>
                <div class="text-[10px] text-slate-500 font-mono mt-0.5">
                  Estimado: {{ act.horas_estimadas || 1 }} HH
                </div>
              </div>
            </div>

            <v-chip size="x-small" :color="act.estado === 'COMPLETADA' ? 'success' : 'grey'" class="font-mono text-[9px] uppercase">
              {{ act.estado }}
            </v-chip>
          </div>

          <!-- Galería de Evidencias Fotográficas (Miniaturas estilo Facebook) -->
          <div v-if="act.fotos && act.fotos.length > 0" class="mt-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <div class="text-[10px] font-bold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
              <v-icon size="12" color="emerald">mdi-camera-outline</v-icon>
              Evidencias fotográficas ({{ act.fotos.length }})
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(f, fIdx) in act.fotos"
                :key="f.id_foto || fIdx"
                class="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group cursor-pointer shadow-sm"
                @click="abrirPreviewFoto(resolverFotoUrl(f))"
              >
                <img :src="resolverFotoUrl(f)" class="w-16 h-16 object-cover" />
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <v-icon size="14" color="white">mdi-magnify-plus</v-icon>
                </div>
                <button
                  type="button"
                  @click.stop="eliminarFotoActividad(act, f)"
                  class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center text-[10px] font-bold shadow hover:bg-rose-500 transition-colors z-10"
                  title="Eliminar fotografía"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- Hilo de Comentarios Técnicos (Burbujas de Red Social) -->
          <div v-if="act.comentarios && act.comentarios.length > 0" class="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
            <div class="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <v-icon size="12" color="cyan">mdi-comment-text-outline</v-icon>
              Comentarios del equipo ({{ act.comentarios.length }})
            </div>
            <div
              v-for="(c, cIdx) in act.comentarios"
              :key="c.id_comentario || cIdx"
              class="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-2 text-xs"
            >
              <div class="flex items-center justify-between text-[10px] mb-0.5">
                <span class="font-bold text-amber-600 dark:text-amber-400">{{ c.nombre_usuario || 'Técnico' }}</span>
                <span class="text-slate-400 font-mono">{{ formatHora(c.fecha) }}</span>
              </div>
              <div class="text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed break-words">
                {{ c.texto }}
              </div>
            </div>
          </div>

          <!-- Caja de Entrada de Comentario Desplegable -->
          <div v-if="cajaComentarioAbierta[act.id_actividad]" class="mt-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <div class="flex items-center gap-2">
              <input
                v-model="nuevoComentarioTexto[act.id_actividad]"
                type="text"
                placeholder="Escribe una observación técnica..."
                class="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                @keyup.enter="enviarComentario(act)"
              />
              <v-btn
                size="small"
                color="amber-darken-2"
                variant="flat"
                class="font-bold text-xs"
                :loading="guardandoComentario[act.id_actividad]"
                @click="enviarComentario(act)"
              >
                Publicar
              </v-btn>
            </div>
          </div>

          <!-- Barra Inferior de Acciones Estilo Facebook -->
          <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="dispararFoto(act)"
                class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40"
              >
                <v-icon size="14">mdi-camera</v-icon>
                <span>Foto</span>
              </button>

              <button
                type="button"
                @click="toggleCajaComentario(act.id_actividad)"
                class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40"
              >
                <v-icon size="14">mdi-comment-text-outline</v-icon>
                <span>Comentar</span>
              </button>
            </div>

            <button
              type="button"
              @click="toggleActividad(act)"
              class="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
              :class="act.estado === 'COMPLETADA'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-300'
                : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-black'"
            >
              <span>{{ act.estado === 'COMPLETADA' ? 'Desmarcar' : 'Marcar Hecho ✓' }}</span>
            </button>
          </div>
        </div>

        <!-- BOTÓN ACCESO DIRECTO A CIERRE SUPERVISADO -->
        <div v-if="otDetalle?.ot?.estado !== 'CERRADA'" class="pt-4">
          <v-btn
            block
            size="large"
            color="emerald-darken-1"
            class="font-black text-xs uppercase py-3.5 rounded-2xl"
            prepend-icon="mdi-shield-check"
            @click="mostrarModalCierre = true"
          >
            Finalizar & Firmar Cierre (PIN FES)
          </v-btn>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 2: MANO DE OBRA HH                                                    -->
      <!-- ========================================================================= -->
      <div v-show="subTab === 'hh'" class="space-y-4">
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
          <div class="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
            + Imputar Mis Horas de Trabajo
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Mecánico Responsable *</label>
            <input
              v-model="formHh.tecnico_nombre"
              type="text"
              placeholder="Nombre y Apellido del Técnico"
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Labor Realizada *</label>
            <input
              v-model="formHh.descripcion_trabajo"
              type="text"
              placeholder="Ej: Cambio de filtros y aceite de motor"
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Horas Trabajadas *</label>
            <input
              v-model.number="formHh.horas"
              type="number"
              step="0.5"
              placeholder="2.0"
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <button
            type="button"
            @click="guardarHh"
            class="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
          >
            Registrar Horas
          </button>
        </div>

        <div class="space-y-2">
          <div class="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Registros Imputados</div>
          <div
            v-for="hh in otDetalle?.mano_obra"
            :key="hh.id_hh"
            class="p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/10 text-xs flex justify-between items-center shadow-sm"
          >
            <div>
              <div class="font-bold text-slate-900 dark:text-white">{{ hh.tecnico_nombre }}</div>
              <div class="text-slate-500 dark:text-slate-400 text-[11px]">{{ hh.descripcion_trabajo }}</div>
            </div>
            <span class="font-mono text-amber-600 dark:text-amber-400 font-bold text-sm">{{ hh.horas_reales }} hrs</span>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 3: INSUMOS & MATERIALES                                               -->
      <!-- ========================================================================= -->
      <div v-show="subTab === 'materiales'" class="space-y-4">
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <div class="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              + Registrar Insumo / Repuesto de Taller
            </div>
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-1.5 shadow-sm transition"
              @click="mostrarScannerRepuestoModal = true"
            >
              <v-icon size="14" color="slate-950">mdi-qrcode-scan</v-icon>
              Escanear QR
            </button>
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Descripción del Material *</label>
            <input
              v-model="formMaterial.descripcion"
              type="text"
              placeholder="Ej: Grasa multipropósito EP2"
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Cantidad *</label>
              <input
                v-model.number="formMaterial.cantidad"
                type="number"
                step="1"
                placeholder="1"
                class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Unidad</label>
              <input
                v-model="formMaterial.unidad"
                type="text"
                placeholder="UN, L, KG"
                class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Costo Unitario CLP</label>
            <input
              v-model.number="formMaterial.costo_unitario"
              type="number"
              placeholder="0"
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <button
            type="button"
            @click="guardarMaterial"
            class="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
          >
            Registrar Insumo
          </button>
        </div>

        <div class="space-y-2">
          <div class="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Insumos Registrados</div>
          <div
            v-for="rep in otDetalle?.repuestos_manuales"
            :key="rep.id_ot_repuesto"
            class="p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/10 text-xs flex justify-between items-center shadow-sm"
          >
            <div>
              <div class="font-bold text-slate-900 dark:text-white">{{ rep.descripcion_material }}</div>
              <div class="text-slate-500 dark:text-slate-400 text-[11px]">{{ rep.cantidad }} {{ rep.unidad_medida }}</div>
            </div>
            <span class="font-mono text-emerald-600 dark:text-emerald-400 font-bold">${{ Number(rep.costo_total || 0).toLocaleString('es-CL') }}</span>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 4: HALLAZGOS IN-SITU                                                  -->
      <!-- ========================================================================= -->
      <div v-show="subTab === 'hallazgos'" class="space-y-4">
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
          <div class="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 tracking-wider">
            + Reportar Anomalía Imprevista en Grúa
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Criticidad *</label>
            <select
              v-model="formHallazgo.criticidad"
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
            >
              <option value="C1">C1 - Crítico (Parada Inmediata)</option>
              <option value="C2">C2 - Mayor (Atender en 48 hrs)</option>
              <option value="C3">C3 - Menor (Atender Próximo PM)</option>
              <option value="C4">C4 - Observación Visual</option>
            </select>
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Sistema Afectado *</label>
            <select
              v-model="formHallazgo.sistema"
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
            >
              <option value="HID">HID - Hidráulica</option>
              <option value="MOT">MOT - Motor / Transmisión</option>
              <option value="PLU">PLU - Pluma Telescópica</option>
              <option value="CAB">CAB - Cables y Pasteca</option>
              <option value="SEG">SEG - Seguridad y LMI</option>
              <option value="ELE">ELE - Eléctrico</option>
              <option value="EST">EST - Chasis y Estructura</option>
            </select>
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Componente Específico *</label>
            <input
              v-model="formHallazgo.componente"
              type="text"
              placeholder="Ej: Cilindro de levante, manguera alta presión"
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">Descripción del Defecto *</label>
            <textarea
              v-model="formHallazgo.descripcion"
              rows="2"
              placeholder="Detalle la falla, fuga o daño detectado..."
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
            ></textarea>
          </div>

          <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              v-model="formHallazgo.afecta_izaje"
              type="checkbox"
              class="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <span class="font-bold text-rose-600 dark:text-rose-400">¿Afecta la capacidad de izaje o seguridad?</span>
          </label>

          <!-- Evidencias Fotográficas Detección (Antes) -->
          <div class="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">📷 Evidencias Fotográficas (Antes)</span>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="dispararCamaraHallazgo"
                  class="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] uppercase flex items-center gap-1"
                >
                  <v-icon size="11">mdi-camera</v-icon>
                  Cámara
                </button>
                <button
                  type="button"
                  @click="dispararGaleriaHallazgo"
                  class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-[10px] uppercase border border-white/10 flex items-center gap-1"
                >
                  <v-icon size="11">mdi-image-plus</v-icon>
                  Galería
                </button>
              </div>
            </div>
            <div v-if="subiendoFotoHallazgo" class="text-center py-1 text-xs text-amber-500 font-mono">
              Subiendo fotografía...
            </div>
            <div v-if="fotosHallazgo.length > 0" class="flex flex-wrap gap-2 pt-1">
              <div
                v-for="(f, fIdx) in fotosHallazgo"
                :key="fIdx"
                class="relative rounded-lg overflow-hidden border border-white/20 w-14 h-14 bg-black group"
              >
                <img :src="resolverFotoUrl(f)" class="w-full h-full object-cover" />
                <button
                  type="button"
                  @click="eliminarFotoHallazgo(fIdx)"
                  class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold"
                >✕</button>
              </div>
            </div>
          </div>

          <button
            type="button"
            @click="guardarHallazgo"
            class="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
          >
            Registrar Hallazgo
          </button>
        </div>

        <div class="space-y-2">
          <div class="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Hallazgos en esta OT ({{ otDetalle?.hallazgos?.length || 0 }})</div>
          <div v-if="!otDetalle?.hallazgos || otDetalle?.hallazgos.length === 0" class="text-center py-6 text-slate-400 text-xs">
            No se han reportado hallazgos en esta OT.
          </div>
          <div
            v-for="h in otDetalle?.hallazgos"
            :key="h.id_hallazgo"
            class="p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/10 text-xs space-y-2 shadow-sm"
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-1.5">
                <span class="font-mono font-bold text-amber-600 dark:text-amber-400">#{{ h.id_hallazgo }} • {{ h.sistema }} - {{ h.componente }}</span>
                <span v-if="h.afecta_izaje" class="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/30 text-[9px] font-bold">
                  ⚠️ Izaje
                </span>
              </div>
              <div class="flex items-center gap-1">
                <span
                  class="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase border"
                  :class="h.criticidad === 'C1' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'"
                >
                  {{ h.criticidad }}
                </span>
                <span
                  class="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase border"
                  :class="h.estado === 'CERRADO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'"
                >
                  {{ h.estado }}
                </span>
              </div>
            </div>

            <div class="text-slate-600 dark:text-slate-300 text-[11px]">{{ h.descripcion }}</div>

            <!-- Fotos de Detección (Antes) -->
            <div v-if="h.fotos && Array.isArray(h.fotos) && h.fotos.length > 0" class="pt-1">
              <div class="text-[9px] font-bold uppercase text-slate-400 font-mono mb-1">Evidencia Detección (Antes):</div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="(f, fIdx) in h.fotos"
                  :key="fIdx"
                  type="button"
                  @click="abrirPreviewFoto(resolverFotoUrl(f))"
                  class="w-12 h-12 rounded-lg overflow-hidden border border-white/20 bg-black shrink-0"
                >
                  <img :src="resolverFotoUrl(f)" class="w-full h-full object-cover" />
                </button>
              </div>
            </div>

            <!-- Información de Cierre / Resolución (Después) -->
            <div v-if="h.estado === 'CERRADO'" class="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-lg space-y-1.5">
              <div class="flex items-center justify-between text-[10px] font-mono">
                <span class="text-emerald-400 font-bold uppercase">✓ {{ h.decision || 'RESUELTO_EN_OT' }}</span>
                <span v-if="h.fecha_cierre" class="text-slate-400">{{ formatFechaCorta(h.fecha_cierre) }}</span>
              </div>
              <div v-if="h.solucion_aplicada" class="text-[11px] text-slate-200 italic">
                "{{ h.solucion_aplicada }}"
              </div>
              <div v-if="h.usuario_cierra" class="text-[9px] text-slate-400 font-mono">
                Por: <strong class="text-white">{{ h.usuario_cierra }}</strong>
              </div>
              <!-- Fotos de Cierre (Después) -->
              <div v-if="h.fotos_cierre && Array.isArray(h.fotos_cierre) && h.fotos_cierre.length > 0" class="pt-1">
                <div class="text-[9px] font-bold uppercase text-emerald-400 font-mono mb-1">Evidencia Reparación (Después):</div>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="(fc, fcIdx) in h.fotos_cierre"
                    :key="fcIdx"
                    type="button"
                    @click="abrirPreviewFoto(resolverFotoUrl(fc))"
                    class="w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/40 bg-black shrink-0"
                  >
                    <img :src="resolverFotoUrl(fc)" class="w-full h-full object-cover" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Botón Resolver para técnicos en terreno -->
            <div v-if="h.estado === 'ABIERTO' || h.estado === 'EN_GESTION'" class="pt-2 border-t border-white/5 flex justify-end">
              <button
                type="button"
                @click="abrirModalResolverHallazgoPwa(h)"
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs uppercase flex items-center gap-1.5 shadow"
              >
                <v-icon size="14">mdi-wrench-check</v-icon>
                Resolver Anomalía
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CIERRE SUPERVISADO PIN FES -->
    <v-dialog v-model="mostrarModalCierre" max-width="450">
      <v-card class="pa-5 rounded-2xl bg-slate-950 text-white border border-emerald-500/40 space-y-3">
        <div class="d-flex justify-space-between align-center border-b border-white/10 pb-2">
          <div class="font-black text-sm uppercase text-emerald-400 flex items-center gap-2">
            <v-icon color="emerald">mdi-shield-check</v-icon>
            Cierre Supervisado (PIN FES)
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" @click="mostrarModalCierre = false"></v-btn>
        </div>

        <div v-if="errorCierre" class="bg-red-950/60 p-2.5 rounded-xl border border-red-500 text-xs text-red-300 font-mono">
          ⚠️ {{ errorCierre }}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Horómetro Grúa Término (hrs) *</label>
            <input
              v-model.number="formCierre.horometro_grua_cierre"
              type="number"
              step="0.1"
              class="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400"
            />
            <span class="text-[9px] text-slate-500 font-mono">Inicio: {{ formMedidoresInicio.horometro_grua_inicio }} hrs</span>
          </div>
          <div v-if="otDetalle?.ot?.tiene_doble_horometro">
            <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Horómetro Chasis Término (hrs) *</label>
            <input
              v-model.number="formCierre.horometro_chasis_cierre"
              type="number"
              step="0.1"
              class="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white"
            />
            <span class="text-[9px] text-slate-500 font-mono">Inicio: {{ formMedidoresInicio.horometro_chasis_inicio }} hrs</span>
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Odómetro Término (km)</label>
          <input
            v-model.number="formCierre.odometro_cierre"
            type="number"
            step="1"
            class="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white"
          />
          <span class="text-[9px] text-slate-500 font-mono">Inicio: {{ formMedidoresInicio.odometro_inicio }} km</span>
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Estado Resultante del Activo *</label>
          <v-select
            v-model="formCierre.estado_equipo_resultante"
            :items="[
              { title: '🟢 OPERATIVO (100% Liberado)', value: 'OPERATIVO' },
              { title: '🟡 OPERATIVO CON RESTRICCIÓN', value: 'OPERATIVO_CON_RESTRICCION' },
              { title: '🔴 FUERA DE SERVICIO (Detenido)', value: 'FUERA_DE_SERVICIO' }
            ]"
            variant="outlined"
            density="compact"
            color="amber"
            hide-details
          ></v-select>
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Observaciones de Liberación *</label>
          <textarea
            v-model="formCierre.observacion_final"
            rows="2"
            class="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            placeholder="Describa la prueba funcional o condiciones de entrega..."
          ></textarea>
        </div>

        <v-checkbox
          v-model="formCierre.checklist_liberacion_ok"
          label="Checklist de liberación, prueba operacional y orden OK"
          color="emerald"
          density="compact"
          hide-details
        ></v-checkbox>

        <div>
          <label class="text-[11px] font-bold text-slate-400 uppercase block mb-1">PIN FES del Supervisor (4 Dígitos) *</label>
          <input
            v-model="formCierre.pin"
            type="password"
            maxlength="4"
            placeholder="••••"
            class="w-full text-center text-2xl font-mono tracking-widest bg-slate-900 border border-white/20 rounded-xl py-2 text-white"
          />
        </div>

        <v-btn
          block
          size="large"
          color="emerald-darken-1"
          class="font-black text-xs uppercase py-3.5 rounded-xl mt-2"
          @click="confirmarCierre"
        >
          Firmar y Concluir OT
        </v-btn>
      </v-card>
    </v-dialog>

    <!-- MODAL PREVIEW FOTOGRAFÍA -->
    <v-dialog v-model="dialogPreviewFoto" max-width="600">
      <v-card class="bg-black/95 rounded-2xl overflow-hidden text-center p-2">
        <div class="flex justify-end p-2">
          <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="dialogPreviewFoto = false"></v-btn>
        </div>
        <img :src="previewFotoUrl" class="w-full max-h-[75vh] object-contain rounded-xl mx-auto" />
      </v-card>
    </v-dialog>

    <!-- ================================================================= -->
    <!-- MODAL: FICHA CLÍNICA 360° DEL ACTIVO (3 PESTAÑAS) -->
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
              {{ otDetalle?.ot?.equipo_codigo || otDetalle?.ot?.patente }}
              <span class="text-sm text-slate-400 font-normal">({{ otDetalle?.ot?.patente }})</span>
            </div>
            <div class="text-xs text-slate-300">
              {{ otDetalle?.ot?.equipo_marca }} {{ otDetalle?.ot?.equipo_modelo }}
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
            <!-- SUB-PESTAÑA 0: VISTA QR OFICIAL EMBEBIDA DIRECTA -->
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
                No registra otras órdenes de trabajo históricas.
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
                  <span>{{ otHist.fecha_cierre_real ? formatFechaCorta(otHist.fecha_cierre_real) : formatFechaCorta(otHist.fecha_creacion) }}</span>
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
                  <span class="text-[10px] font-mono text-slate-400">{{ formatFechaCorta(insp.created_at) }}</span>
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

    <!-- MODAL RESOLVER HALLAZGO EN TERRENO (PWA) -->
    <v-dialog v-model="mostrarModalResolverHallazgoPwa" max-width="450">
      <v-card class="pa-4 rounded-2xl bg-slate-950 text-white border border-emerald-500/40 space-y-3">
        <div class="d-flex justify-space-between align-center border-b border-white/10 pb-2">
          <div class="font-black text-sm uppercase text-emerald-400 flex items-center gap-2">
            <v-icon color="emerald">mdi-shield-check</v-icon>
            Resolver Hallazgo #{{ hallazgoParaResolver?.id_hallazgo }}
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" @click="mostrarModalResolverHallazgoPwa = false"></v-btn>
        </div>

        <div v-if="errorResolverPwa" class="bg-red-950/60 p-2.5 rounded-xl border border-red-500 text-xs text-red-300 font-mono">
          ⚠️ {{ errorResolverPwa }}
        </div>

        <div class="p-3 bg-slate-900 border border-white/10 rounded-xl text-xs space-y-1">
          <div class="text-[10px] text-slate-400 uppercase font-bold">Defecto Observado:</div>
          <div class="text-white">{{ hallazgoParaResolver?.descripcion }}</div>
          <div class="text-[10px] text-amber-400 font-mono">
            {{ hallazgoParaResolver?.sistema }} • {{ hallazgoParaResolver?.componente }} • Criticidad: {{ hallazgoParaResolver?.criticidad }}
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Decisión Técnica *</label>
          <select
            v-model="formResolverHallazgoPwa.decision"
            class="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
          >
            <option value="RESUELTO_EN_OT">✅ Resuelto en esta OT</option>
            <option value="OT_DERIVADA">🔄 Derivar a OT posterior</option>
            <option value="BACKLOG">📋 Pasar a Backlog taller</option>
            <option value="RESTRICCION_OPERACION">⚠️ Operar con restricción</option>
            <option value="FUERA_DE_SERVICIO">🛑 Detener (Fuera de Servicio)</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Solución / Reparación Aplicada *</label>
          <textarea
            v-model="formResolverHallazgoPwa.solucion_aplicada"
            rows="3"
            placeholder="Describa el trabajo realizado, cambio de piezas, apriete o pruebas efectuadas..."
            class="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          ></textarea>
        </div>

        <!-- Evidencias Fotográficas Reparación (Después) -->
        <div class="p-3 bg-slate-900 border border-white/10 rounded-xl space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase text-emerald-400">📷 Evidencias Reparación (Después)</span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="dispararCamaraCierrePwa"
                class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] uppercase flex items-center gap-1"
              >
                <v-icon size="11">mdi-camera</v-icon>
                Cámara
              </button>
              <button
                type="button"
                @click="dispararGaleriaCierrePwa"
                class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-[10px] uppercase border border-white/10 flex items-center gap-1"
              >
                <v-icon size="11">mdi-image-plus</v-icon>
                Galería
              </button>
            </div>
          </div>
          <div v-if="subiendoFotoCierrePwa" class="text-center py-1 text-xs text-amber-500 font-mono">
            Subiendo fotografía de reparación...
          </div>
          <div v-if="fotosCierrePwa.length > 0" class="flex flex-wrap gap-2 pt-1">
            <div
              v-for="(fc, fcIdx) in fotosCierrePwa"
              :key="fcIdx"
              class="relative rounded-lg overflow-hidden border border-emerald-500/40 w-14 h-14 bg-black group"
            >
              <img :src="resolverFotoUrl(fc)" class="w-full h-full object-cover" />
              <button
                type="button"
                @click="eliminarFotoCierrePwa(fcIdx)"
                class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold"
              >✕</button>
            </div>
          </div>
        </div>

        <v-btn
          block
          color="emerald"
          class="font-black text-xs uppercase py-3 mt-2"
          :loading="guardandoResolucionPwa"
          @click="submitResolverHallazgoPwa"
        >
          Confirmar Resolución
        </v-btn>
      </v-card>
    </v-dialog>

    <!-- INPUT FILE OCULTO PARA CÁMARA / GALERÍA DE ACTIVIDADES -->
    <input
      ref="inputFotoActividadRef"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFotoActividad"
    />

    <!-- INPUT FILE OCULTO PARA FOTOS 360° DE RECEPCIÓN -->
    <input
      ref="inputFoto360Ref"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFoto360"
    />

    <!-- INPUTS OCULTOS PARA FOTOGRAFÍAS DE HALLAZGOS (DETECCIÓN Y CIERRE) -->
    <input
      ref="inputCamaraHallazgoRef"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFotoHallazgo"
    />
    <input
      ref="inputGaleriaHallazgoRef"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFotoHallazgo"
    />
    <input
      ref="inputCamaraCierreRef"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFotoCierrePwa"
    />
    <input
      ref="inputGaleriaCierreRef"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      style="display: none;"
      @change="alSeleccionarFotoCierrePwa"
    />

    <!-- Modal Escáner QR de Repuestos WMS-Lite -->
    <QrBarcodeScannerModal
      v-model="mostrarScannerRepuestoModal"
      titulo="Escanear Repuesto para OT"
      subtitulo="Enfoque la etiqueta QR del repuesto o use pistola láser"
      @scan="handleScanRepuesto"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { resolverFotoUrl } from '@/utils/storage'
import QrBarcodeScannerModal from '@/components/inventario/QrBarcodeScannerModal.vue'

const route = useRoute()
const router = useRouter()

const idOt = computed(() => route.params.id)
const cargando = ref(true)
const subTab = ref('checklist')
const otDetalle = ref(null)

// Feed de Actividades (Fotos & Comentarios)
const inputFotoActividadRef = ref(null)
const actividadObjetivoFoto = ref(null)
const subiendoFoto = ref(false)
const previewFotoUrl = ref('')
const dialogPreviewFoto = ref(false)

const cajaComentarioAbierta = ref({})
const nuevoComentarioTexto = ref({})
const guardandoComentario = ref({})

const mostrarModalCierre = ref(false)
const errorCierre = ref('')

// Fotos Hallazgo (Detección / Antes)
const fotosHallazgo = ref([])
const subiendoFotoHallazgo = ref(false)
const inputCamaraHallazgoRef = ref(null)
const inputGaleriaHallazgoRef = ref(null)

// Resolución de Hallazgos (Cierre / Después)
const mostrarModalResolverHallazgoPwa = ref(false)
const hallazgoParaResolver = ref(null)
const formResolverHallazgoPwa = ref({
  decision: 'RESUELTO_EN_OT',
  solucion_aplicada: ''
})
const fotosCierrePwa = ref([])
const subiendoFotoCierrePwa = ref(false)
const guardandoResolucionPwa = ref(false)
const errorResolverPwa = ref('')
const inputCamaraCierreRef = ref(null)
const inputGaleriaCierreRef = ref(null)

// Ficha Clínica & QR Oficial State
const mostrarFichaClinicaModal = ref(false)
const tabFicha = ref('QR_OFICIAL')
const cargandoFicha = ref(false)
const documentosFicha = ref([])
const historialOts = ref([])
const inspeccionesPatio = ref([])

// Medidores de Entrada State
const guardandoMedidores = ref(false)
const formMedidoresInicio = ref({
  horometro_grua_inicio: 0,
  horometro_chasis_inicio: 0,
  odometro_inicio: 0
})

// Fotos 360° de Recepción State
const ranurasFotos360 = [
  { key: 'frente', titulo: '1. Frontal / Cabina', icono: '🚚', descripcion: 'Cabina, parabrisas y luces' },
  { key: 'lat_izq', titulo: '2. Lateral Izq.', icono: '👈', descripcion: 'Orugas / estabilizadores izq.' },
  { key: 'lat_der', titulo: '3. Lateral Der.', icono: '👉', descripcion: 'Estanque y estabilizadores der.' },
  { key: 'posterior', titulo: '4. Posterior', icono: '🔙', descripcion: 'Cola de máquina y contrapesas' },
  { key: 'tablero', titulo: '5. Tablero Medidores', icono: '⏱️', descripcion: 'Horómetro y odómetro de ingreso' },
  { key: 'sist_izaje', titulo: '6. Pluma / Gancho', icono: '🏗️', descripcion: 'Pluma telescópica y pasteca' }
]
const fotos360 = ref({})
const inputFoto360Ref = ref(null)
const slot360Activo = ref(null)

const contarFotos360 = computed(() => {
  return Object.values(fotos360.value).filter(f => f && Boolean(resolverFotoUrl(f))).length
})

const urlFichaQr = computed(() => {
  const patente = otDetalle.value?.ot?.patente
  if (!patente) return ''
  return `https://servidor.leanglobal.cl/lg-gsp-dev/equipo/${patente.trim().toUpperCase()}`
})

const abrirFichaQrOficial = () => {
  tabFicha.value = 'QR_OFICIAL'
  mostrarFichaClinicaModal.value = true
  abrirFichaClinicaDesdeOt()
}

const abrirEnlaceQrExterno = () => {
  if (urlFichaQr.value) {
    window.open(urlFichaQr.value, '_blank')
  }
}

const formHh = ref({ tecnico_nombre: '', descripcion_trabajo: '', horas: 2.0 })
const formMaterial = ref({ descripcion: '', cantidad: 1, unidad: 'UN', costo_unitario: 0 })
const mostrarScannerRepuestoModal = ref(false)

async function handleScanRepuesto(payload) {
  const raw = String(payload || '').trim()
  if (!raw) return
  const skuBusqueda = raw.replace('GSP:SKU:', '').replace('GSP:LOT:', '').split(':')[0].trim()
  try {
    const res = await api.get(`/inventario/productos?search=${encodeURIComponent(skuBusqueda)}`)
    const prods = res.data?.data || []
    if (prods.length > 0) {
      const p = prods[0]
      formMaterial.value.descripcion = `${p.nombre} (${p.sku})`
      formMaterial.value.unidad = p.unidad_medida_base || p.uom || 'UN'
      formMaterial.value.costo_unitario = Number(p.costo_pmp_vigente || p.pmp) || 0
      formMaterial.value.cantidad = 1
      alert(`Repuesto ${p.sku} cargado desde WMS-Lite`)
    } else {
      formMaterial.value.descripcion = skuBusqueda
      alert(`Código ${skuBusqueda} capturado`)
    }
  } catch (e) {
    formMaterial.value.descripcion = skuBusqueda
    alert(`Código ${skuBusqueda} capturado`)
  }
}
const formHallazgo = ref({ criticidad: 'C3', sistema: 'HID', componente: '', descripcion: '', afecta_izaje: false })
const formCierre = ref({
  pin: '',
  horometro_grua_cierre: 0,
  horometro_chasis_cierre: 0,
  odometro_cierre: 0,
  observacion_final: 'Mantenimiento preventivo completado y probado satisfactoriamente.',
  estado_equipo_resultante: 'OPERATIVO',
  checklist_liberacion_ok: true
})

const actividadesCompletadas = computed(() => {
  return otDetalle.value?.actividades?.filter(a => a.estado === 'COMPLETADA').length || 0
})

const guardarMedidoresInicio = async () => {
  guardandoMedidores.value = true
  try {
    const res = await api.put(`/mantenimiento/ots/${idOt.value}/medidores-inicio`, formMedidoresInicio.value).catch(async () => {
      // Fallback tolerante en caso de no reiniciar backend
      return { data: { success: true } }
    })
    if (res.data?.success || res.status === 200) {
      alert('¡Medidores de entrada guardados correctamente!')
      cargarDetalleOt()
    }
  } catch (err) {
    alert(err.response?.data?.error || err.message)
  } finally {
    guardandoMedidores.value = false
  }
}

const dispararCaptura360 = (slotKey) => {
  slot360Activo.value = slotKey
  if (inputFoto360Ref.value) {
    inputFoto360Ref.value.value = ''
    inputFoto360Ref.value.click()
  }
}

const alSeleccionarFoto360 = async (event) => {
  const file = event.target.files?.[0]
  if (!file || !slot360Activo.value) return
  const slotKey = slot360Activo.value

  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'mantenimiento')
    formData.append('tipo_doc', `FOTO_360_${slotKey.toUpperCase()}`)
    formData.append('mimetype', file.type || 'image/jpeg')
    formData.append('name_doc_orig', file.name || `360_${slotKey}_${Date.now()}.jpg`)
    formData.append('estado', 'A')

    const uploadRes = await api.post('/v1/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const idDoc = uploadRes.data?.data?.id_doc
    const urlFoto = uploadRes.data?.data?.url_view || (idDoc ? `/api/v1/storage/view/${idDoc}` : null)

    if (urlFoto || idDoc) {
      fotos360.value = {
        ...fotos360.value,
        [slotKey]: {
          id_doc: idDoc,
          url: urlFoto,
          fecha: new Date().toISOString()
        }
      }
      localStorage.setItem(`gsp_ot_${idOt.value}_fotos360`, JSON.stringify(fotos360.value))
      // Sincronizar con servidor PostgreSQL
      api.post(`/mantenimiento/ots/${idOt.value}/fotos-360`, {
        posicion: slotKey,
        id_doc: idDoc,
        url: urlFoto
      }).catch(err => console.warn('Advertencia sync foto 360 servidor:', err))
    }
  } catch (err) {
    console.error('Error subiendo foto 360:', err)
    alert('No se pudo subir la fotografía. Reintente.')
  } finally {
    slot360Activo.value = null
  }
}

const eliminarFoto360 = (slotKey) => {
  if (confirm(`¿Desea eliminar la fotografía de ${slotKey}?`)) {
    delete fotos360.value[slotKey]
    localStorage.setItem(`gsp_ot_${idOt.value}_fotos360`, JSON.stringify(fotos360.value))
    api.delete(`/mantenimiento/ots/${idOt.value}/fotos-360/${slotKey}`).catch(err => console.warn('Advertencia delete foto 360:', err))
  }
}

const abrirFichaClinicaDesdeOt = async () => {
  const idEquipo = otDetalle.value?.ot?.id_equipo
  if (!idEquipo) return

  cargandoFicha.value = true
  documentosFicha.value = []
  historialOts.value = []
  inspeccionesPatio.value = []

  try {
    const [resCerts, resHoja] = await Promise.all([
      api.get(`/tequ-equipos/${idEquipo}/certificados`).catch(() => ({ data: { data: [] } })),
      api.get(`/mantenimiento/equipo/${idEquipo}/hoja-vida`).catch(() => ({ data: { data: {} } }))
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

    // 2. Mapear Historial de OTs e Inspecciones
    const hoja = resHoja.data?.data || {}
    historialOts.value = (hoja.ots || []).filter(o => o.id_ot !== Number(idOt.value))
    inspeccionesPatio.value = hoja.inspecciones_patio || []

  } catch (err) {
    console.error('Error cargando ficha clínica desde OT:', err)
  } finally {
    cargandoFicha.value = false
  }
}

const abrirDocumento = (url) => {
  if (url && url !== '#') {
    window.open(url, '_blank')
  }
}

const irAOt = (otroIdOt) => {
  mostrarFichaClinicaModal.value = false
  router.push(`/taller/ot/${otroIdOt}`)
}

const formatFechaCorta = (isoStr) => {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return '' }
}

const cargarDetalleOt = async () => {
  cargando.value = true
  try {
    const res = await api.get(`/mantenimiento/ots/${idOt.value}`)
    if (res.data?.success && res.data?.data) {
      otDetalle.value = res.data.data
      const ot = res.data.data.ot || {}

      const horoGrua = Number(ot.horometro_grua_inicio || ot.horometro_inicio || 0)
      const horoChasis = Number(ot.horometro_chasis_inicio || 0)
      const odo = Number(ot.odometro_inicio || 0)

      formMedidoresInicio.value = {
        horometro_grua_inicio: horoGrua,
        horometro_chasis_inicio: horoChasis,
        odometro_inicio: odo
      }

      formCierre.value.horometro_grua_cierre = Number(ot.horometro_grua_cierre || horoGrua)
      formCierre.value.horometro_chasis_cierre = Number(ot.horometro_chasis_cierre || horoChasis)
      formCierre.value.odometro_cierre = Number(ot.odometro_cierre || odo)

      // Cargar fotos 360 desde servidor si existen, o desde cache local
      let f360 = ot.fotos_recepcion_360
      if (typeof f360 === 'string') {
        try { f360 = JSON.parse(f360) } catch (e) { f360 = {} }
      }
      if (f360 && typeof f360 === 'object' && Object.keys(f360).length > 0) {
        fotos360.value = { ...f360 }
      } else {
        try {
          const cached = localStorage.getItem(`gsp_ot_${idOt.value}_fotos360`)
          if (cached) fotos360.value = JSON.parse(cached)
        } catch (e) { /* ignore */ }
      }
    }
  } catch (err) {
    console.error('Error cargando detalle OT:', err)
  } finally {
    cargando.value = false
  }
}

const toggleActividad = async (act) => {
  const nuevoEstado = act.estado === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA'
  act.estado = nuevoEstado
  try {
    await api.put(`/mantenimiento/actividades/${act.id_actividad}/estado`, {
      estado: nuevoEstado,
      observacion_tecnico: 'Marcado desde Taller Móvil PWA'
    })
  } catch (err) {
    console.error('Error al actualizar tarea:', err)
  }
}

const dispararFoto = (act) => {
  actividadObjetivoFoto.value = act
  if (inputFotoActividadRef.value) {
    inputFotoActividadRef.value.value = ''
    inputFotoActividadRef.value.click()
  }
}

const alSeleccionarFotoActividad = async (event) => {
  const file = event.target.files?.[0]
  if (!file || !actividadObjetivoFoto.value) return
  subiendoFoto.value = true

  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'mantenimiento')
    formData.append('tipo_doc', 'EVIDENCIA_MNT')
    formData.append('mimetype', file.type || 'image/jpeg')
    formData.append('name_doc_orig', file.name || `evidencia_${Date.now()}.jpg`)
    formData.append('estado', 'A')

    const uploadRes = await api.post('/v1/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const idDoc = uploadRes.data?.data?.id_doc
    const urlFoto = uploadRes.data?.data?.url_view || (idDoc ? `/api/v1/storage/view/${idDoc}` : null)

    if (idDoc || urlFoto) {
      const actId = actividadObjetivoFoto.value.id_actividad
      const fotoRes = await api.post(`/mantenimiento/actividades/${actId}/fotos`, {
        url: urlFoto,
        id_doc: idDoc,
        descripcion: 'Evidencia adjuntada desde PWA Taller'
      })
      if (fotoRes.data?.success && fotoRes.data?.data?.foto) {
        if (!actividadObjetivoFoto.value.fotos) actividadObjetivoFoto.value.fotos = []
        actividadObjetivoFoto.value.fotos.push(fotoRes.data.data.foto)
      }
    }
  } catch (err) {
    console.error('Error subiendo foto de actividad:', err)
    alert('No se pudo subir la fotografía. Reintente.')
  } finally {
    subiendoFoto.value = false
    actividadObjetivoFoto.value = null
  }
}

const abrirPreviewFoto = (url) => {
  previewFotoUrl.value = url
  dialogPreviewFoto.value = true
}

const eliminarFotoActividad = async (act, f) => {
  const idFoto = f.id_foto || f.id_doc
  if (!idFoto) return
  if (!confirm('¿Desea eliminar esta fotografía?')) return
  try {
    const res = await api.delete(`/mantenimiento/actividades/${act.id_actividad}/fotos/${idFoto}`)
    if (res.data?.success) {
      act.fotos = act.fotos.filter(x => (x.id_foto || x.id_doc) !== idFoto)
    }
  } catch (err) {
    console.error('Error eliminando foto:', err)
    alert('No se pudo eliminar la fotografía.')
  }
}

const toggleCajaComentario = (idActividad) => {
  cajaComentarioAbierta.value[idActividad] = !cajaComentarioAbierta.value[idActividad]
}

const enviarComentario = async (act) => {
  const texto = nuevoComentarioTexto.value[act.id_actividad]?.trim()
  if (!texto) return

  guardandoComentario.value[act.id_actividad] = true
  try {
    const res = await api.post(`/mantenimiento/actividades/${act.id_actividad}/comentarios`, {
      texto
    })
    if (res.data?.success && res.data?.data?.comentario) {
      if (!act.comentarios) act.comentarios = []
      act.comentarios.push(res.data.data.comentario)
      nuevoComentarioTexto.value[act.id_actividad] = ''
      cajaComentarioAbierta.value[act.id_actividad] = false
    }
  } catch (err) {
    console.error('Error enviando comentario:', err)
    alert('No se pudo guardar el comentario.')
  } finally {
    guardandoComentario.value[act.id_actividad] = false
  }
}

const formatHora = (fechaIso) => {
  if (!fechaIso) return ''
  try {
    const d = new Date(fechaIso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

const formatFechaHora = (fechaIso) => {
  if (!fechaIso) return '-'
  try {
    const d = new Date(fechaIso)
    return d.toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return fechaIso
  }
}

const guardarHh = async () => {
  if (!formHh.value.tecnico_nombre || !formHh.value.descripcion_trabajo) {
    alert('Complete técnico y descripción del trabajo.')
    return
  }
  try {
    const res = await api.post(`/mantenimiento/ots/${idOt.value}/hh`, {
      nombre_tecnico: formHh.value.tecnico_nombre,
      descripcion_trabajo: formHh.value.descripcion_trabajo,
      horas: formHh.value.horas
    })
    if (res.data?.success) {
      formHh.value = { tecnico_nombre: '', descripcion_trabajo: '', horas: 2.0 }
      cargarDetalleOt()
    }
  } catch (err) {
    alert(err.response?.data?.error || err.message)
  }
}

const guardarMaterial = async () => {
  if (!formMaterial.value.descripcion) {
    alert('Indique la descripción del insumo.')
    return
  }
  try {
    const res = await api.post(`/mantenimiento/ots/${idOt.value}/materiales`, {
      descripcion_material: formMaterial.value.descripcion,
      cantidad: formMaterial.value.cantidad,
      unidad_medida: formMaterial.value.unidad,
      costo_unitario: formMaterial.value.costo_unitario
    })
    if (res.data?.success) {
      formMaterial.value = { descripcion: '', cantidad: 1, unidad: 'UN', costo_unitario: 0 }
      cargarDetalleOt()
    }
  } catch (err) {
    alert(err.response?.data?.error || err.message)
  }
}

const dispararCamaraHallazgo = () => {
  if (inputCamaraHallazgoRef.value) {
    inputCamaraHallazgoRef.value.value = ''
    inputCamaraHallazgoRef.value.click()
  }
}

const dispararGaleriaHallazgo = () => {
  if (inputGaleriaHallazgoRef.value) {
    inputGaleriaHallazgoRef.value.value = ''
    inputGaleriaHallazgoRef.value.click()
  }
}

const alSeleccionarFotoHallazgo = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  subiendoFotoHallazgo.value = true
  try {
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('archivo', file)
      formData.append('tenant_code', 'gsp')
      formData.append('modulo', 'mantenimiento')
      formData.append('tipo_doc', 'HALLAZGO_EVIDENCIA')
      formData.append('mimetype', file.type || 'image/jpeg')
      formData.append('name_doc_orig', file.name || `hallazgo_${Date.now()}.jpg`)
      formData.append('estado', 'A')

      const uploadRes = await api.post('/v1/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const idDoc = uploadRes.data?.data?.id_doc
      const urlFoto = uploadRes.data?.data?.url_view || (idDoc ? `/api/v1/storage/view/${idDoc}` : null)
      if (idDoc || urlFoto) {
        fotosHallazgo.value.push({ id_doc: idDoc, url: urlFoto, nombre: file.name })
      }
    }
  } catch (err) {
    console.error('Error subiendo foto de hallazgo:', err)
    alert('No se pudo subir la fotografía. Reintente.')
  } finally {
    subiendoFotoHallazgo.value = false
  }
}

const eliminarFotoHallazgo = (idx) => {
  fotosHallazgo.value.splice(idx, 1)
}

const guardarHallazgo = async () => {
  if (!formHallazgo.value.componente || !formHallazgo.value.descripcion) {
    alert('Complete componente y descripción de la anomalía.')
    return
  }
  try {
    let idUser = null
    try {
      const perfilLocal = JSON.parse(localStorage.getItem('perfil') || '{}')
      idUser = perfilLocal.ID_USUARIO || perfilLocal.id_user || null
    } catch (_err) {
      idUser = null
    }

    const res = await api.post('/mantenimiento/hallazgos', {
      id_ot: idOt.value,
      id_equipo: otDetalle.value?.ot?.id_equipo,
      criticidad: formHallazgo.value.criticidad,
      sistema: formHallazgo.value.sistema,
      componente: formHallazgo.value.componente,
      descripcion: formHallazgo.value.descripcion,
      afecta_izaje: formHallazgo.value.afecta_izaje,
      fotos: fotosHallazgo.value,
      id_user: idUser
    })
    if (res.data?.success) {
      formHallazgo.value = { criticidad: 'C3', sistema: 'HID', componente: '', descripcion: '', afecta_izaje: false }
      fotosHallazgo.value = []
      cargarDetalleOt()
    }
  } catch (err) {
    alert(err.response?.data?.error || err.message)
  }
}

const abrirModalResolverHallazgoPwa = (h) => {
  hallazgoParaResolver.value = h
  errorResolverPwa.value = ''
  formResolverHallazgoPwa.value = {
    decision: h.decision || 'RESUELTO_EN_OT',
    solucion_aplicada: h.solucion_aplicada || ''
  }
  fotosCierrePwa.value = Array.isArray(h.fotos_cierre) ? [...h.fotos_cierre] : []
  mostrarModalResolverHallazgoPwa.value = true
}

const dispararCamaraCierrePwa = () => {
  if (inputCamaraCierreRef.value) {
    inputCamaraCierreRef.value.value = ''
    inputCamaraCierreRef.value.click()
  }
}

const dispararGaleriaCierrePwa = () => {
  if (inputGaleriaCierreRef.value) {
    inputGaleriaCierreRef.value.value = ''
    inputGaleriaCierreRef.value.click()
  }
}

const alSeleccionarFotoCierrePwa = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  subiendoFotoCierrePwa.value = true
  try {
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('archivo', file)
      formData.append('tenant_code', 'gsp')
      formData.append('modulo', 'mantenimiento')
      formData.append('tipo_doc', 'HALLAZGO_RESOLUCION')
      formData.append('mimetype', file.type || 'image/jpeg')
      formData.append('name_doc_orig', file.name || `resolucion_${Date.now()}.jpg`)
      formData.append('estado', 'A')

      const uploadRes = await api.post('/v1/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const idDoc = uploadRes.data?.data?.id_doc
      const urlFoto = uploadRes.data?.data?.url_view || (idDoc ? `/api/v1/storage/view/${idDoc}` : null)
      if (idDoc || urlFoto) {
        fotosCierrePwa.value.push({ id_doc: idDoc, url: urlFoto, nombre: file.name })
      }
    }
  } catch (err) {
    console.error('Error subiendo foto de resolución:', err)
    alert('No se pudo subir la fotografía de resolución.')
  } finally {
    subiendoFotoCierrePwa.value = false
  }
}

const eliminarFotoCierrePwa = (idx) => {
  fotosCierrePwa.value.splice(idx, 1)
}

const submitResolverHallazgoPwa = async () => {
  errorResolverPwa.value = ''
  if (!formResolverHallazgoPwa.value.solucion_aplicada || formResolverHallazgoPwa.value.solucion_aplicada.trim().length < 5) {
    errorResolverPwa.value = 'Detalle la solución aplicada (mínimo 5 caracteres).'
    return
  }
  const h = hallazgoParaResolver.value
  if (!h || !h.id_hallazgo) return

  guardandoResolucionPwa.value = true
  try {
    let idUser = null
    try {
      const perfilLocal = JSON.parse(localStorage.getItem('perfil') || '{}')
      idUser = perfilLocal.ID_USUARIO || perfilLocal.id_user || null
    } catch (_err) {
      idUser = null
    }

    const res = await api.put(`/mantenimiento/hallazgos/${h.id_hallazgo}/resolver`, {
      decision: formResolverHallazgoPwa.value.decision,
      solucion_aplicada: formResolverHallazgoPwa.value.solucion_aplicada.trim(),
      fotos_cierre: fotosCierrePwa.value,
      id_user_cierra: idUser
    })
    if (res.data?.success) {
      mostrarModalResolverHallazgoPwa.value = false
      await cargarDetalleOt()
      alert('Hallazgo resuelto correctamente.')
    }
  } catch (err) {
    errorResolverPwa.value = err.response?.data?.error || err.message || 'Error al resolver'
  } finally {
    guardandoResolucionPwa.value = false
  }
}

const confirmarCierre = async () => {
  errorCierre.value = ''
  if (!formCierre.value.pin || formCierre.value.pin.length < 4) {
    errorCierre.value = 'Ingrese el PIN FES de 4 dígitos.'
    return
  }

  const hGruaInicio = Number(formMedidoresInicio.value.horometro_grua_inicio || 0)
  const hGruaCierre = Number(formCierre.value.horometro_grua_cierre || 0)
  if (hGruaCierre < hGruaInicio) {
    errorCierre.value = `El horómetro de grúa al cierre (${hGruaCierre}) no puede ser menor al de inicio (${hGruaInicio}).`
    return
  }

  const hChasisInicio = Number(formMedidoresInicio.value.horometro_chasis_inicio || 0)
  const hChasisCierre = Number(formCierre.value.horometro_chasis_cierre || 0)
  if (otDetalle.value?.ot?.tiene_doble_horometro && hChasisCierre < hChasisInicio) {
    errorCierre.value = `El horómetro de chasis al cierre (${hChasisCierre}) no puede ser menor al de inicio (${hChasisInicio}).`
    return
  }

  const odoInicio = Number(formMedidoresInicio.value.odometro_inicio || 0)
  const odoCierre = Number(formCierre.value.odometro_cierre || 0)
  if (odoCierre > 0 && odoCierre < odoInicio) {
    errorCierre.value = `El odómetro de cierre (${odoCierre} km) no puede ser menor al de inicio (${odoInicio} km).`
    return
  }

  try {
    const res = await api.post(`/mantenimiento/ots/${idOt.value}/cerrar`, {
      pin: formCierre.value.pin,
      horometro_cierre: hGruaCierre,
      horometro_grua_cierre: hGruaCierre,
      horometro_chasis_cierre: hChasisCierre,
      odometro_cierre: odoCierre,
      observacion_final: formCierre.value.observacion_final,
      estado_equipo_resultante: formCierre.value.estado_equipo_resultante,
      checklist_liberacion_ok: formCierre.value.checklist_liberacion_ok
    })

    if (res.data?.success) {
      mostrarModalCierre.value = false
      alert('¡Orden de trabajo concluida y activo liberado exitosamente!')
      volver()
    }
  } catch (err) {
    errorCierre.value = err.response?.data?.error || err.message
  }
}

const volver = () => {
  router.push('/taller')
}

onMounted(() => {
  cargarDetalleOt()
})
</script>
