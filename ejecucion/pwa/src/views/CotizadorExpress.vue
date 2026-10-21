<template>
  <div class="cotizador-express-page min-h-screen bg-slate-100 dark:bg-slate-950 pb-20 text-slate-800 dark:text-slate-100">
    <!-- BARRA SUPERIOR FIJA -->
    <div class="bg-[#0b1426] border-b border-slate-800 text-white px-3 py-3 sticky top-0 z-20 shadow-md">
      <div class="d-flex align-center justify-space-between max-w-lg mx-auto">
        <v-btn
          icon="mdi-arrow-left"
          variant="tonal"
          color="amber-accent-3"
          size="small"
          class="mr-2"
          @click="volverAtras"
        ></v-btn>
        <div class="text-center flex-grow-1">
          <div class="text-xs font-mono font-black text-amber-400 uppercase tracking-widest d-flex align-center justify-center ga-1">
            <span>⚡</span> COTIZADOR EXPRESS
          </div>
          <div class="text-[11px] text-slate-300 font-medium">
            Grúas San Pablo • Terreno
          </div>
        </div>
        <v-chip
          v-if="!cotizacionExitosa"
          size="x-small"
          color="amber-darken-2"
          variant="flat"
          class="font-black text-[10px] text-black"
        >
          {{ pasoActual }}/3
        </v-chip>
        <div v-else style="width: 32px;"></div>
      </div>
    </div>

    <div class="pa-3 max-w-lg mx-auto">
      <!-- ========================================================================= -->
      <!-- PANTALLA DE ÉXITO FINAL                                                   -->
      <!-- ========================================================================= -->
      <v-card
        v-if="cotizacionExitosa"
        class="rounded-2xl border-2 border-emerald-500/60 pa-5 text-center shadow-xl mb-4 bg-white dark:bg-slate-900"
      >
        <div class="text-5xl mb-2">🎉</div>
        <div class="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-wider">
          ¡Cotización Emitida con Éxito!
        </div>
        <div class="text-xs text-slate-600 dark:text-slate-300 mt-1 mb-4">
          Registrada en el CRM y compilada oficialmente en PDF.
        </div>

        <!-- TARJETA CON DETALLE OFICIAL -->
        <div class="pa-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left font-mono mb-4">
          <div class="d-flex justify-space-between align-center border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
            <span class="text-xs text-slate-500 dark:text-slate-400 font-sans">Folio Oficial:</span>
            <span class="text-sm font-black text-amber-600 dark:text-amber-400">{{ resultadoCotizacion.codi_proyecto }}</span>
          </div>
          <div class="d-flex justify-space-between align-center border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
            <span class="text-xs text-slate-500 dark:text-slate-400 font-sans">Mandante:</span>
            <span class="text-xs font-bold truncate max-w-[190px]">{{ form.cliente.nombre }}</span>
          </div>
          <div class="d-flex justify-space-between align-center border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
            <span class="text-xs text-slate-500 dark:text-slate-400 font-sans">Equipo / Días:</span>
            <span class="text-xs">{{ form.servicio.capacidad_label }} ({{ form.servicio.dias_servicio }} d)</span>
          </div>
          <div class="d-flex justify-space-between align-center border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
            <span class="text-xs text-slate-500 dark:text-slate-400 font-sans">Total Neto:</span>
            <span class="text-sm font-black text-emerald-600 dark:text-emerald-400">{{ formatCLP(resultadoCotizacion.total_neto) }}</span>
          </div>
          <div class="d-flex justify-space-between align-center">
            <span class="text-xs text-slate-500 dark:text-slate-400 font-sans">Validez Oferta:</span>
            <span class="text-xs text-amber-600 dark:text-amber-300 font-bold">5 Días Hábiles</span>
          </div>
        </div>

        <!-- BOTÓN MAESTRO WHATSAPP -->
        <v-btn
          color="emerald-darken-1"
          size="large"
          block
          class="font-black text-white py-3 mb-3 shadow-lg rounded-xl"
          prepend-icon="mdi-whatsapp"
          @click="despacharWhatsApp"
        >
          💬 ENVIAR POR WHATSAPP AL CLIENTE
        </v-btn>

        <!-- BOTÓN VER PDF -->
        <v-btn
          v-if="resultadoCotizacion.pdf_url"
          variant="outlined"
          color="cyan-darken-2"
          block
          class="font-black mb-4 rounded-xl"
          prepend-icon="mdi-file-pdf-box"
          @click="verPdfOficial"
        >
          📄 VER / DESCARGAR PDF OFICIAL
        </v-btn>

        <!-- ACCIONES DE SALIDA -->
        <div class="d-flex ga-2">
          <v-btn
            variant="tonal"
            color="slate-600"
            class="flex-grow-1 text-xs font-bold rounded-lg"
            @click="reiniciarFormulario"
          >
            ➕ Nueva Cotización
          </v-btn>
          <v-btn
            variant="tonal"
            color="amber-darken-3"
            class="flex-grow-1 text-xs font-bold rounded-lg"
            @click="$router.push('/surveys')"
          >
            🏠 Volver al Menú
          </v-btn>
        </div>
      </v-card>

      <!-- ========================================================================= -->
      <!-- WIZARD EN 3 PASOS                                                         -->
      <!-- ========================================================================= -->
      <div v-else>
        <!-- INDICADOR VISUAL DE PASOS -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm mb-4">
          <div class="d-flex align-center justify-space-between px-2">
            <!-- Paso 1 -->
            <div
              class="d-flex align-center ga-1.5 cursor-pointer"
              @click="pasoActual = 1"
            >
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all"
                :class="pasoActual === 1 ? 'bg-amber-400 text-black shadow-sm' : (pasoActual > 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500')"
              >
                {{ pasoActual > 1 ? '✓' : '1' }}
              </div>
              <span
                class="text-xs font-bold"
                :class="pasoActual === 1 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'"
              >
                Mandante
              </span>
            </div>

            <div class="h-0.5 flex-grow-1 mx-2 bg-slate-200 dark:bg-slate-800"></div>

            <!-- Paso 2 -->
            <div
              class="d-flex align-center ga-1.5 cursor-pointer"
              @click="paso1Valido ? pasoActual = 2 : null"
            >
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all"
                :class="pasoActual === 2 ? 'bg-amber-400 text-black shadow-sm' : (pasoActual > 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500')"
              >
                {{ pasoActual > 2 ? '✓' : '2' }}
              </div>
              <span
                class="text-xs font-bold"
                :class="pasoActual === 2 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'"
              >
                Equipo
              </span>
            </div>

            <div class="h-0.5 flex-grow-1 mx-2 bg-slate-200 dark:bg-slate-800"></div>

            <!-- Paso 3 -->
            <div
              class="d-flex align-center ga-1.5 cursor-pointer"
              @click="(paso1Valido && paso2Valido) ? pasoActual = 3 : null"
            >
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all"
                :class="pasoActual === 3 ? 'bg-amber-400 text-black shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'"
              >
                3
              </div>
              <span
                class="text-xs font-bold"
                :class="pasoActual === 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'"
              >
                Resumen
              </span>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- PASO 1: MANDANTE & FAENA                                                  -->
        <!-- ========================================================================= -->
        <v-card
          v-if="pasoActual === 1"
          class="rounded-2xl border border-slate-200 dark:border-slate-800 pa-4 shadow-sm bg-white dark:bg-slate-900"
        >
          <!-- TÍTULO DE PASO -->
          <div class="d-flex align-center ga-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span class="text-2xl">🏢</span>
            <div>
              <div class="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Paso 1: Mandante y Faena
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">
                Selecciona un cliente de cartera o ingresa un prospecto rápido
              </div>
            </div>
          </div>

          <!-- SELECTOR DE MODO (SEGMENTED CONTROL) -->
          <div class="d-flex ga-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
            <v-btn
              size="small"
              class="flex-1 font-bold text-xs rounded-lg"
              :color="modoCliente === 'buscar' ? 'amber-darken-2' : 'transparent'"
              :variant="modoCliente === 'buscar' ? 'flat' : 'text'"
              :class="modoCliente === 'buscar' ? 'text-black font-black' : 'text-slate-600 dark:text-slate-300'"
              prepend-icon="mdi-magnify"
              @click="modoCliente = 'buscar'"
            >
              Buscar Cliente
            </v-btn>
            <v-btn
              size="small"
              class="flex-1 font-bold text-xs rounded-lg"
              :color="modoCliente === 'prospecto' ? 'amber-darken-2' : 'transparent'"
              :variant="modoCliente === 'prospecto' ? 'flat' : 'text'"
              :class="modoCliente === 'prospecto' ? 'text-black font-black' : 'text-slate-600 dark:text-slate-300'"
              prepend-icon="mdi-plus-circle-outline"
              @click="activarModoProspecto"
            >
              Nuevo Prospecto
            </v-btn>
          </div>

          <!-- MODO A: BUSCADOR DE CLIENTES REGISTRADOS -->
          <div v-if="modoCliente === 'buscar'" class="mb-3">
            <div class="mb-1">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Buscar Cliente (RUT o Razón Social) <span class="text-red-500">*</span>
              </label>
              <v-text-field
                v-model="busquedaInput"
                placeholder="Ej: Besalco, Arauco, Finning, 96543..."
                density="comfortable"
                variant="outlined"
                prepend-inner-icon="mdi-magnify"
                color="amber-darken-2"
                clearable
                hide-details="auto"
                bg-color="white"
                class="rounded-lg"
                @update:model-value="onSearchInput"
              ></v-text-field>
            </div>

            <!-- RESULTADOS PREDICTIVOS -->
            <div v-if="cargandoEmpresas" class="pa-3 text-center text-xs text-slate-500 dark:text-slate-400">
              <v-progress-circular indeterminate size="18" width="2" color="amber-darken-2" class="mr-2"></v-progress-circular>
              Buscando en cartera...
            </div>
            <div
              v-else-if="resultadosBusqueda.length > 0"
              class="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-950 shadow-inner"
            >
              <div
                v-for="emp in resultadosBusqueda"
                :key="emp.id_empresa"
                class="pa-2.5 border-b border-slate-200 dark:border-slate-800 hover:bg-amber-500/10 cursor-pointer d-flex justify-space-between align-center transition-colors"
                @click="seleccionarEmpresa(emp)"
              >
                <div>
                  <div class="text-xs font-bold text-slate-900 dark:text-white">
                    {{ emp.razon_social || emp.name_empresa }}
                  </div>
                  <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {{ emp.rut_empresa || 'Sin RUT' }} • 📞 {{ emp.fono_contacto || 'Sin fono' }}
                  </div>
                </div>
                <v-icon size="small" color="amber-darken-2">mdi-chevron-right</v-icon>
              </div>
            </div>

            <!-- MANDANTE YA SELECCIONADO -->
            <div
              v-if="form.cliente.id_empresa"
              class="pa-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/50 mt-3 d-flex justify-space-between align-start"
            >
              <div>
                <div class="text-[10px] text-amber-700 dark:text-amber-400 font-black uppercase tracking-wider">
                  Mandante Seleccionado
                </div>
                <div class="text-sm font-black text-slate-900 dark:text-white">
                  {{ form.cliente.nombre }}
                </div>
                <div class="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  RUT: {{ form.cliente.rut || 'Pendiente' }}
                </div>
              </div>
              <v-btn
                icon="mdi-close"
                variant="tonal"
                size="x-small"
                color="red"
                @click="deseleccionarEmpresa"
              ></v-btn>
            </div>
          </div>

          <!-- MODO B: PROSPECTO RÁPIDO (CAMPOS DIRECTOS) -->
          <div v-if="modoCliente === 'prospecto'" class="mb-3">
            <div class="mb-2">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Razón Social o Nombre del Cliente <span class="text-red-500">*</span>
              </label>
              <v-text-field
                v-model="form.cliente.nombre"
                placeholder="Ej: Constructora El Roble SpA"
                density="comfortable"
                variant="outlined"
                color="amber-darken-2"
                hide-details="auto"
                bg-color="white"
                class="rounded-lg"
              ></v-text-field>
            </div>
            <div class="mb-2">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                RUT de la Empresa (Opcional)
              </label>
              <v-text-field
                v-model="form.cliente.rut"
                placeholder="Ej: 76.842.120-K"
                density="comfortable"
                variant="outlined"
                color="amber-darken-2"
                hide-details="auto"
                bg-color="white"
                class="rounded-lg"
              ></v-text-field>
            </div>
          </div>

          <!-- SECCIÓN: CONTACTO DIRECTO MANDANTE -->
          <div class="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
            <div class="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              👤 Contacto para Envío de Presupuesto
            </div>

            <div class="mb-2">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Persona de Contacto <span class="text-red-500">*</span>
              </label>
              <v-text-field
                v-model="form.cliente.contacto_nombre"
                placeholder="Ej: Ing. Jorge Alarcón"
                density="comfortable"
                variant="outlined"
                color="amber-darken-2"
                prepend-inner-icon="mdi-account"
                hide-details="auto"
                bg-color="white"
                class="rounded-lg"
              ></v-text-field>
            </div>

            <div class="mb-2">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono WhatsApp (Destino del Presupuesto) <span class="text-red-500">*</span>
              </label>
              <v-text-field
                v-model="form.cliente.telefono"
                placeholder="Ej: 994437725 o +56 9 9443 7725"
                density="comfortable"
                variant="outlined"
                color="amber-darken-2"
                prepend-inner-icon="mdi-whatsapp"
                hide-details="auto"
                bg-color="white"
                class="rounded-lg"
              ></v-text-field>
            </div>

            <div class="mb-2">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico (Opcional)
              </label>
              <v-text-field
                v-model="form.cliente.email"
                placeholder="Ej: jalarcon@empresa.cl"
                type="email"
                density="comfortable"
                variant="outlined"
                color="amber-darken-2"
                prepend-inner-icon="mdi-email-outline"
                hide-details="auto"
                bg-color="white"
                class="rounded-lg"
              ></v-text-field>
            </div>
          </div>

          <!-- SECCIÓN: FAENA / LUGAR DEL SERVICIO -->
          <div class="pt-2 pb-2 border-t border-slate-100 dark:border-slate-800">
            <div class="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              📍 Lugar de Faena y Fecha
            </div>

            <div class="mb-2">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de Obra / Faena <span class="text-red-500">*</span>
              </label>
              <v-text-field
                v-model="form.cliente.obra_nombre"
                placeholder="Ej: Muelle Melipeuco, Planta Arauco, Parque Eólico..."
                density="comfortable"
                variant="outlined"
                color="amber-darken-2"
                prepend-inner-icon="mdi-map-marker-outline"
                hide-details="auto"
                bg-color="white"
                class="rounded-lg"
              ></v-text-field>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ciudad / Comuna
                </label>
                <v-text-field
                  v-model="form.cliente.obra_comuna"
                  placeholder="Ej: Temuco"
                  density="comfortable"
                  variant="outlined"
                  color="amber-darken-2"
                  hide-details="auto"
                  bg-color="white"
                  class="rounded-lg"
                ></v-text-field>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha Estimada Inicio
                </label>
                <v-text-field
                  v-model="form.servicio.fecha_estimada_inicio"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                  color="amber-darken-2"
                  hide-details="auto"
                  bg-color="white"
                  class="rounded-lg"
                ></v-text-field>
              </div>
            </div>
          </div>

          <!-- AVISO DE VALIDACIÓN AMIGABLE -->
          <div v-if="!paso1Valido" class="pa-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 mb-3 d-flex align-center ga-1.5">
            <v-icon size="small" color="amber-darken-2">mdi-information-outline</v-icon>
            <span>Complete Nombre de Mandante, Contacto, Teléfono y Faena para continuar.</span>
          </div>

          <!-- BOTÓN SIGUIENTE -->
          <v-btn
            color="amber-darken-2"
            size="large"
            block
            class="font-black text-black py-3 rounded-xl elevation-2 text-sm"
            :disabled="!paso1Valido"
            @click="pasoActual = 2"
          >
            Siguiente: Configurar Equipo ➔
          </v-btn>
        </v-card>

        <!-- ========================================================================= -->
        <!-- PASO 2: EQUIPO & CONFIGURACIÓN OPERATIVA                                   -->
        <!-- ========================================================================= -->
        <v-card
          v-if="pasoActual === 2"
          class="rounded-2xl border border-slate-200 dark:border-slate-800 pa-4 shadow-sm bg-white dark:bg-slate-900"
        >
          <!-- TÍTULO DE PASO -->
          <div class="d-flex align-center ga-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span class="text-2xl">🚜</span>
            <div>
              <div class="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Paso 2: Equipo y Jornadas
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">
                Selecciona la familia de equipo, capacidad y duración del servicio
              </div>
            </div>
          </div>

          <!-- SELECTOR DE FAMILIA TÁCTIL (GRUAS VS PLUMAS) -->
          <div class="mb-3">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Maquinaria GSP <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <div
                class="pa-3 rounded-xl border-2 text-center cursor-pointer transition-all"
                :class="form.servicio.tipo_equipo === 'GRUAS_TELESCOPICAS' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-sm' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 opacity-80'"
                @click="seleccionarFamilia('GRUAS_TELESCOPICAS')"
              >
                <div class="text-2xl mb-1">🚜</div>
                <div class="text-xs font-black" :class="form.servicio.tipo_equipo === 'GRUAS_TELESCOPICAS' ? 'text-amber-800 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'">
                  Grúa Telescópica
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400">40 a 250 Toneladas</div>
              </div>

              <div
                class="pa-3 rounded-xl border-2 text-center cursor-pointer transition-all"
                :class="form.servicio.tipo_equipo === 'CAMIONES_PLUMA' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-sm' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 opacity-80'"
                @click="seleccionarFamilia('CAMIONES_PLUMA')"
              >
                <div class="text-2xl mb-1">🚛</div>
                <div class="text-xs font-black" :class="form.servicio.tipo_equipo === 'CAMIONES_PLUMA' ? 'text-amber-800 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'">
                  Camión Pluma
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400">10 a 25 Toneladas</div>
              </div>
            </div>
          </div>

          <!-- SELECCIÓN DE CAPACIDAD / TONELAJE -->
          <div class="mb-3">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Capacidad / Modelo de Flota <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pa-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <div
                v-for="op in opcionesEquipoActuales"
                :key="op.id"
                class="pa-2.5 rounded-xl border text-center cursor-pointer transition-all"
                :class="form.servicio.capacidad_label === op.label ? 'border-amber-500 bg-amber-100/70 dark:bg-amber-950/60 shadow-md font-bold' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300'"
                @click="seleccionarOpcionEquipo(op)"
              >
                <div class="text-sm font-black font-mono" :class="form.servicio.capacidad_label === op.label ? 'text-amber-900 dark:text-amber-300' : 'text-slate-800 dark:text-slate-100'">
                  {{ op.label }}
                </div>
                <div class="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">
                  {{ op.modelo_ref }}
                </div>
                <div class="text-[10.5px] font-black text-emerald-700 dark:text-emerald-400 mt-1">
                  {{ formatCLP(op.tarifa_sugerida) }}/día
                </div>
              </div>
            </div>
          </div>

          <!-- DÍAS DE SERVICIO (STEPPER NUMÉRICO TÁCTIL) -->
          <div class="pa-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-3">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Duración del Arriendo:</span>
              <span class="text-sm font-black font-mono text-amber-700 dark:text-amber-400">{{ form.servicio.dias_servicio }} día(s)</span>
            </div>
            <div class="d-flex align-center justify-center ga-3 mt-2">
              <v-btn
                icon="mdi-minus"
                size="small"
                variant="tonal"
                color="amber-darken-2"
                :disabled="form.servicio.dias_servicio <= 1"
                @click="form.servicio.dias_servicio--"
              ></v-btn>
              <div class="text-2xl font-black font-mono w-14 text-center text-slate-900 dark:text-white">
                {{ form.servicio.dias_servicio }}
              </div>
              <v-btn
                icon="mdi-plus"
                size="small"
                variant="tonal"
                color="amber-darken-2"
                @click="form.servicio.dias_servicio++"
              ></v-btn>
            </div>
          </div>

          <!-- PISO MÍNIMO CONTRACTUAL (INFORMATIVO) -->
          <div class="pa-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 mb-3 d-flex align-center ga-2">
            <span class="text-base">⏱️</span>
            <div>
              <strong>Piso Mínimo Contractual: 9 Horas / Día</strong>
              <div class="text-[10px] opacity-80">Jornada estándar con Operador y Rigger certificados.</div>
            </div>
          </div>

          <!-- TARIFA DIARIA PACTADA (EDITABLE) -->
          <div class="mb-3">
            <div class="d-flex justify-space-between align-center mb-1">
              <label class="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tarifa Diaria Acordada (CLP)
              </label>
              <span class="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Editable</span>
            </div>
            <v-text-field
              v-model.number="form.servicio.tarifa_dia"
              type="number"
              density="comfortable"
              variant="outlined"
              prefix="$"
              color="amber-darken-2"
              hide-details="auto"
              bg-color="white"
              class="rounded-lg font-mono font-bold"
            ></v-text-field>
          </div>

          <!-- MOVILIZACIÓN / TRASLADO -->
          <div class="pa-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-4">
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-200">Incluir Movilización / Traslado</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400">Flete Ida y Vuelta Faena</div>
              </div>
              <v-switch
                v-model="form.servicio.incluye_traslado"
                color="amber-darken-2"
                hide-details
                density="compact"
              ></v-switch>
            </div>

            <div v-if="form.servicio.incluye_traslado" class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monto Traslado Ida/Vuelta (CLP)
              </label>
              <v-text-field
                v-model.number="form.servicio.valor_traslado"
                type="number"
                density="comfortable"
                variant="outlined"
                prefix="$"
                color="amber-darken-2"
                hide-details="auto"
                bg-color="white"
                class="rounded-lg font-mono font-bold"
              ></v-text-field>
            </div>
          </div>

          <!-- BOTONES NAVEGACIÓN -->
          <div class="d-flex ga-2">
            <v-btn
              variant="tonal"
              color="slate-600"
              class="flex-1 font-bold rounded-xl"
              @click="pasoActual = 1"
            >
              ⬅️ Anterior
            </v-btn>
            <v-btn
              color="amber-darken-2"
              class="flex-1 font-black text-black rounded-xl text-sm"
              :disabled="!paso2Valido"
              @click="pasoActual = 3"
            >
              Ver Resumen ➔
            </v-btn>
          </div>
        </v-card>

        <!-- ========================================================================= -->
        <!-- PASO 3: RESUMEN FINANCIERO Y EMISIÓN FORMAL                               -->
        <!-- ========================================================================= -->
        <v-card
          v-if="pasoActual === 3"
          class="rounded-2xl border border-slate-200 dark:border-slate-800 pa-4 shadow-sm bg-white dark:bg-slate-900"
        >
          <!-- TÍTULO DE PASO -->
          <div class="d-flex align-center ga-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span class="text-2xl">📋</span>
            <div>
              <div class="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Paso 3: Resumen y Emisión
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">
                Verifica los valores antes de compilar el presupuesto oficial
              </div>
            </div>
          </div>

          <!-- RESUMEN OPERACIONAL -->
          <div class="pa-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-3 text-xs font-mono">
            <div class="d-flex justify-space-between py-1 border-b border-slate-200 dark:border-slate-800">
              <span class="text-slate-500 font-sans">Mandante:</span>
              <span class="font-bold text-slate-900 dark:text-white truncate max-w-[190px]">{{ form.cliente.nombre }}</span>
            </div>
            <div class="d-flex justify-space-between py-1 border-b border-slate-200 dark:border-slate-800">
              <span class="text-slate-500 font-sans">Contacto / WhatsApp:</span>
              <span class="text-amber-700 dark:text-amber-300 font-bold">{{ form.cliente.contacto_nombre }} ({{ form.cliente.telefono }})</span>
            </div>
            <div class="d-flex justify-space-between py-1 border-b border-slate-200 dark:border-slate-800">
              <span class="text-slate-500 font-sans">Faena:</span>
              <span class="text-slate-900 dark:text-white truncate max-w-[190px]">{{ form.cliente.obra_nombre }}</span>
            </div>
            <div class="d-flex justify-space-between py-1 border-b border-slate-200 dark:border-slate-800">
              <span class="text-slate-500 font-sans">Equipo:</span>
              <span class="text-amber-700 dark:text-amber-400 font-bold">{{ form.servicio.capacidad_label }}</span>
            </div>
            <div class="d-flex justify-space-between py-1">
              <span class="text-slate-500 font-sans">Jornadas / Mínimo:</span>
              <span class="text-slate-900 dark:text-white">{{ form.servicio.dias_servicio }} día(s) (Piso 9 hrs/día)</span>
            </div>
          </div>

          <!-- TABLA DE TOTALES -->
          <div class="pa-3 rounded-xl bg-slate-100 dark:bg-slate-950 border-2 border-amber-500/40 mb-3 font-mono">
            <div class="d-flex justify-space-between text-xs py-1 border-b border-slate-200 dark:border-slate-800">
              <span class="text-slate-600 dark:text-slate-400">Subtotal Equipo:</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ formatCLP(subtotalEquipo) }}</span>
            </div>
            <div v-if="form.servicio.incluye_traslado" class="d-flex justify-space-between text-xs py-1 border-b border-slate-200 dark:border-slate-800">
              <span class="text-slate-600 dark:text-slate-400">Subtotal Traslado:</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ formatCLP(form.servicio.valor_traslado) }}</span>
            </div>
            <div class="d-flex justify-space-between text-sm py-1.5 border-b border-slate-300 dark:border-slate-700 text-amber-800 dark:text-amber-300">
              <span class="font-black">TOTAL NETO:</span>
              <span class="font-black">{{ formatCLP(totalNeto) }}</span>
            </div>
            <div class="d-flex justify-space-between text-xs py-1 text-slate-500">
              <span>IVA (19%):</span>
              <span>{{ formatCLP(totalIva) }}</span>
            </div>
            <div class="d-flex justify-space-between text-base py-1.5 font-black text-emerald-700 dark:text-emerald-400 border-t-2 border-emerald-500/50 mt-1">
              <span>TOTAL GENERAL:</span>
              <span>{{ formatCLP(totalGeneral) }}</span>
            </div>
          </div>

          <!-- CONDICIONES COMERCIALES FORMALES -->
          <div class="pa-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-900 dark:text-amber-200 mb-3 space-y-0.5">
            <div class="font-black uppercase tracking-wider mb-0.5">⚖️ Cláusulas Contractuales GSP:</div>
            <div>• <strong>Validez:</strong> 5 días hábiles desde emisión.</div>
            <div>• <strong>Piso mínimo:</strong> 9 horas diarias de servicio continuo.</div>
            <div>• <strong>Personal:</strong> Incluye Operador y Rigger certificados.</div>
            <div>• <strong>Combustible:</strong> Suministrado por Grúas San Pablo.</div>
          </div>

          <!-- ERROR DE EMISIÓN SI OCURRE -->
          <v-alert
            v-if="errorEmision"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-3 text-xs"
          >
            {{ errorEmision }}
          </v-alert>

          <!-- BOTONES NAVEGACIÓN Y EMISIÓN -->
          <div class="d-flex ga-2">
            <v-btn
              variant="tonal"
              color="slate-600"
              class="flex-1 font-bold rounded-xl"
              :disabled="emitiendo"
              @click="pasoActual = 2"
            >
              ⬅️ Anterior
            </v-btn>
            <v-btn
              color="amber-darken-2"
              size="large"
              class="flex-1 font-black text-black shadow-lg rounded-xl text-sm"
              :loading="emitiendo"
              prepend-icon="mdi-flash"
              @click="emitirCotizacionExpress"
            >
              ⚡ EMITIR OFICIAL
            </v-btn>
          </div>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiAxios from '@/services/api'

const router = useRouter()

// Estado de pasos
const pasoActual = ref(1)
const emitiendo = ref(false)
const errorEmision = ref('')
const cotizacionExitosa = ref(false)
const resultadoCotizacion = ref({})

// Búsqueda de clientes
const modoCliente = ref('buscar') // 'buscar' | 'prospecto'
const busquedaInput = ref('')
const cargandoEmpresas = ref(false)
const resultadosBusqueda = ref([])
let searchTimeout = null

// Catálogo de Equipos y Tarifas
const catalogoFamilias = ref([])
const trasladoSugerido = ref(450000)

// Formulario reactivo
const form = ref({
  id_empresa_emisora: 9, // Grúas San Pablo
  cliente: {
    id_empresa: null,
    nombre: '',
    rut: '',
    contacto_nombre: '',
    telefono: '',
    email: '',
    obra_nombre: '',
    obra_comuna: ''
  },
  servicio: {
    tipo_equipo: 'GRUAS_TELESCOPICAS',
    capacidad_label: '70 TON',
    dias_servicio: 1,
    horas_minimas_dia: 9,
    tarifa_dia: 1650000,
    incluye_traslado: true,
    valor_traslado: 450000,
    fecha_estimada_inicio: new Date().toISOString().split('T')[0]
  },
  condiciones: {
    moneda: 'CLP',
    validez_dias: 5,
    cliente_pone_combustible: false,
    condicion_servicio: 'programado'
  }
})

// Cargar Catálogo
const cargarCatalogo = async () => {
  try {
    const { data } = await apiAxios.get('/proyectos/express/catalogo')
    if (data.success) {
      catalogoFamilias.value = data.familias || []
      trasladoSugerido.value = data.traslado_sugerido || 450000
      form.value.servicio.valor_traslado = trasladoSugerido.value
      // Inicializar equipo por defecto (70 TON si existe)
      if (catalogoFamilias.value[0]?.opciones?.[2]) {
        seleccionarOpcionEquipo(catalogoFamilias.value[0].opciones[2])
      }
    }
  } catch (err) {
    console.warn('[CotizadorExpress] No se pudo cargar catálogo, usando fallback:', err.message)
    form.value.servicio.tarifa_dia = 1650000
  }
}

// Búsqueda de Empresas
const onSearchInput = (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!val || val.trim().length < 2) {
    resultadosBusqueda.value = []
    return
  }
  searchTimeout = setTimeout(async () => {
    cargandoEmpresas.value = true
    try {
      const { data } = await apiAxios.get('/empresas', { params: { search: val } })
      resultadosBusqueda.value = Array.isArray(data) ? data : []
    } catch (e) {
      console.error('Error buscando empresas:', e)
    } finally {
      cargandoEmpresas.value = false
    }
  }, 300)
}

const seleccionarEmpresa = (emp) => {
  form.value.cliente.id_empresa = emp.id_empresa
  form.value.cliente.nombre = emp.razon_social || emp.name_empresa || ''
  form.value.cliente.rut = emp.rut_empresa || ''
  form.value.cliente.telefono = emp.fono_contacto || ''
  form.value.cliente.contacto_nombre = emp.json_field?.contacto_inicial || ''
  resultadosBusqueda.value = []
  busquedaInput.value = emp.razon_social || emp.name_empresa
}

const deseleccionarEmpresa = () => {
  form.value.cliente.id_empresa = null
  form.value.cliente.nombre = ''
  form.value.cliente.rut = ''
  form.value.cliente.telefono = ''
  busquedaInput.value = ''
  resultadosBusqueda.value = []
}

const activarModoProspecto = () => {
  modoCliente.value = 'prospecto'
  deseleccionarEmpresa()
}

// Opciones del equipo según la familia seleccionada
const opcionesEquipoActuales = computed(() => {
  const fam = catalogoFamilias.value.find(f => f.id === form.value.servicio.tipo_equipo)
  return fam?.opciones || []
})

const seleccionarFamilia = (tipo) => {
  form.value.servicio.tipo_equipo = tipo
  const opciones = opcionesEquipoActuales.value
  if (opciones.length > 0) {
    seleccionarOpcionEquipo(opciones[0])
  }
}

const seleccionarOpcionEquipo = (op) => {
  form.value.servicio.capacidad_label = op.label
  form.value.servicio.tarifa_dia = op.tarifa_sugerida
  form.value.servicio.horas_minimas_dia = op.horas_min || 9
}

// Cálculos Financieros Reactivos
const subtotalEquipo = computed(() => {
  const d = Math.max(1, Number(form.value.servicio.dias_servicio) || 1)
  const t = Number(form.value.servicio.tarifa_dia) || 0
  return d * t
})

const totalNeto = computed(() => {
  let net = subtotalEquipo.value
  if (form.value.servicio.incluye_traslado) {
    net += Number(form.value.servicio.valor_traslado) || 0
  }
  return net
})

const totalIva = computed(() => {
  return Math.round(totalNeto.value * 0.19)
})

const totalGeneral = computed(() => {
  return totalNeto.value + totalIva.value
})

const formatCLP = (v) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(v || 0)
}

// Validaciones
const paso1Valido = computed(() => {
  const c = form.value.cliente
  const tieneNombre = Boolean(c.nombre && c.nombre.trim())
  const tieneFono = Boolean(c.telefono && c.telefono.trim().length >= 8)
  const tieneContacto = Boolean(c.contacto_nombre && c.contacto_nombre.trim())
  const tieneObra = Boolean(c.obra_nombre && c.obra_nombre.trim())
  return tieneNombre && tieneFono && tieneContacto && tieneObra
})

const paso2Valido = computed(() => {
  const s = form.value.servicio
  return Boolean(s.capacidad_label && s.dias_servicio >= 1 && s.tarifa_dia > 0)
})

// Emisión Oficial
const emitirCotizacionExpress = async () => {
  emitiendo.value = true
  errorEmision.value = ''
  try {
    const payload = JSON.parse(JSON.stringify(form.value))
    const { data } = await apiAxios.post('/proyectos/express/cotizar', payload)

    if (data.success) {
      resultadoCotizacion.value = data
      cotizacionExitosa.value = true
    } else {
      errorEmision.value = data.error || 'Ocurrió un error al emitir la cotización'
    }
  } catch (err) {
    console.error('Error al emitir cotización express:', err)
    errorEmision.value = err.response?.data?.error || err.message || 'Error de conexión al emitir'
  } finally {
    emitiendo.value = false
  }
}

const despacharWhatsApp = () => {
  if (resultadoCotizacion.value.whatsapp_share_link) {
    window.open(resultadoCotizacion.value.whatsapp_share_link, '_blank')
  }
}

const verPdfOficial = () => {
  if (resultadoCotizacion.value.pdf_url) {
    const url = resultadoCotizacion.value.pdf_full_url || resultadoCotizacion.value.pdf_url
    window.open(url, '_blank')
  }
}

const reiniciarFormulario = () => {
  cotizacionExitosa.value = false
  resultadoCotizacion.value = {}
  pasoActual.value = 1
  form.value.cliente = {
    id_empresa: null,
    nombre: '',
    rut: '',
    contacto_nombre: '',
    telefono: '',
    email: '',
    obra_nombre: '',
    obra_comuna: ''
  }
}

const volverAtras = () => {
  if (pasoActual.value > 1 && !cotizacionExitosa.value) {
    pasoActual.value--
  } else {
    router.push('/surveys')
  }
}

onMounted(() => {
  cargarCatalogo()
})
</script>

<style scoped>
.cotizador-express-page {
  font-family: inherit;
}
</style>
