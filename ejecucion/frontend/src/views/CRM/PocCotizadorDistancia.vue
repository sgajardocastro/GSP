<template>
  <div class="min-h-screen bg-[#050811] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 flex flex-col">
    
    <!-- CABECERA PRINCIPAL -->
    <header class="bg-[#090f22] border border-blue-500/30 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl flex flex-wrap justify-between items-center gap-4">
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl shadow-inner">
          🏗️
        </div>
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
              POC: Simulador Comercial de Distancia & Régimen de Flete
            </h1>
            <span class="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Sandbox de Calibración
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            Demostración en vivo de la regla de los 30 km (Urbano vs. Rural) acordada con Jorge Ponce para erradicar fugas de fletes.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button 
          @click="resetearEjemplo" 
          class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>🔄</span> <span>Reiniciar Valores</span>
        </button>
        <button 
          @click="volverAlCRM" 
          class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-900/30 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>⬅️</span> <span>Volver al Gestor CRM</span>
        </button>
      </div>
    </header>

    <!-- GRID PRINCIPAL DE 2 COLUMNAS -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
      
      <!-- ========================================== -->
      <!-- COLUMNA 1: PARÁMETROS COMERCIALES & DISTANCIA (5 cols) -->
      <!-- ========================================== -->
      <div class="lg:col-span-5 space-y-5">
        
        <!-- CARD: CLIENTE Y FAENA -->
        <div class="bg-[#080d1e] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div class="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <span class="text-base">🏢</span>
            <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              1. Identificación del Servicio & Faena
            </h3>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                Cliente Mandante:
              </label>
              <select v-model="form.cliente" class="w-full bg-[#050810] border border-white/15 rounded-lg p-2 text-white text-xs focus:border-blue-400 outline-none">
                <option value="CARTULINAS CMPC S.A.">CARTULINAS CMPC S.A. (RUT 96.731.090-6)</option>
                <option value="BESALCO MAQUINARIAS S.A.">BESALCO MAQUINARIAS S.A. (RUT 76.123.456-7)</option>
                <option value="CONSTRUCTORA VIAL SPA">CONSTRUCTORA VIAL SPA (RUT 77.987.654-3)</option>
              </select>
            </div>

            <div>
              <label class="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                Nombre de la Obra / Faena:
              </label>
              <input 
                type="text" 
                v-model="form.obra" 
                placeholder="ej. Montaje Estructura Metálica" 
                class="w-full bg-[#050810] border border-white/15 rounded-lg p-2 text-white text-xs focus:border-blue-400 outline-none"
              />
            </div>
          </div>
        </div>

        <!-- CARD CLAVE: CONTROL DE DISTANCIA & EVALUACIÓN DE RÉGIMEN -->
        <div class="bg-gradient-to-b from-[#080f26] to-[#060a1a] border-2 border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
          
          <div class="flex justify-between items-center border-b border-white/10 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-lg">📍</span>
              <div>
                <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  2. Distancia Vial (Patio GSP ➔ Faena)
                </h3>
                <p class="text-[10px] text-slate-400">Base fija: Panamericana Sur Km 678, Temuco</p>
              </div>
            </div>

            <!-- BADGE REACTIVO DEL RÉGIMEN -->
            <span 
              :class="esUrbano 
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/50 shadow-blue-900/30' 
                : 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-amber-900/30'"
              class="text-xs font-mono font-black px-3 py-1 rounded-lg border flex items-center gap-1.5 shadow-lg tracking-wider"
            >
              <span>{{ esUrbano ? '🏙️ URBANO' : '🚜 RURAL' }}</span>
              <span class="text-[10px] opacity-75 font-normal">({{ form.distancia_km }} km)</span>
            </span>
          </div>

          <!-- INPUT DIRECTO DE DISTANCIA + SLIDER -->
          <div class="space-y-3 bg-[#050810] border border-white/10 rounded-xl p-3.5">
            <div class="flex items-center justify-between gap-3">
              <label class="text-[11px] font-bold text-slate-200 font-mono">
                Distancia de Ida por Carretera:
              </label>
              <div class="relative w-28">
                <input 
                  type="number" 
                  v-model.number="form.distancia_km" 
                  min="1" 
                  max="300" 
                  class="w-full bg-[#0a1128] border border-blue-500/50 rounded-lg py-1.5 px-3 text-center text-sm font-mono font-black text-white focus:border-blue-400 outline-none shadow-inner"
                />
                <span class="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono">km</span>
              </div>
            </div>

            <!-- Range Slider con corte visual a los 30 km -->
            <div class="space-y-1">
              <input 
                type="range" 
                v-model.number="form.distancia_km" 
                min="1" 
                max="120" 
                class="w-full accent-blue-500 cursor-pointer"
              />
              <div class="flex justify-between text-[9px] font-mono text-slate-500 px-1">
                <span>0 km</span>
                <span class="text-blue-400 font-bold">▲ Límite Urbano 30 km</span>
                <span>60 km</span>
                <span>90 km</span>
                <span>120 km</span>
              </div>
            </div>

            <!-- CHIPS RÁPIDOS DE FAENAS REALES -->
            <div class="space-y-1.5 pt-2 border-t border-white/5">
              <span class="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                Probar Faenas Frecuentes (1 Clic):
              </span>
              <div class="flex flex-wrap gap-1.5 text-[10px] font-mono">
                <button type="button" @click="form.distancia_km = 8" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 cursor-pointer transition-colors">Temuco Centro (8 km)</button>
                <button type="button" @click="form.distancia_km = 5" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 cursor-pointer transition-colors">Padre Las Casas (5 km)</button>
                <button type="button" @click="form.distancia_km = 22" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 cursor-pointer transition-colors">Cajón (22 km)</button>
                <button type="button" @click="form.distancia_km = 35" class="px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 cursor-pointer transition-colors">Lautaro (35 km)</button>
                <button type="button" @click="form.distancia_km = 65" class="px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 cursor-pointer transition-colors">Victoria (65 km)</button>
                <button type="button" @click="form.distancia_km = 85" class="px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 cursor-pointer transition-colors">Villarrica (85 km)</button>
                <button type="button" @click="form.distancia_km = 130" class="px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 cursor-pointer transition-colors">Angol (130 km)</button>
              </div>
            </div>
          </div>

          <!-- TARJETA EXPLICATIVA DE LAS 2 REGLAS OPERATIVAS -->
          <div 
            :class="esUrbano ? 'bg-blue-950/30 border-blue-500/40' : 'bg-amber-950/30 border-amber-500/40'"
            class="border rounded-xl p-3.5 space-y-2.5 text-xs transition-all shadow-inner"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm">{{ esUrbano ? '📘' : '📙' }}</span>
              <strong :class="esUrbano ? 'text-blue-300' : 'text-amber-300'" class="font-mono uppercase tracking-wider">
                {{ esUrbano ? 'Directriz Oficial para Servicios Urbanos:' : 'Directriz Oficial para Servicios Rurales:' }}
              </strong>
            </div>

            <div class="grid grid-cols-1 gap-2 text-[11px] text-slate-300 leading-relaxed font-sans">
              <div class="flex items-start gap-2">
                <span class="font-mono text-blue-400">1.</span>
                <div>
                  <strong class="text-white font-mono">Tiempos de Grúa: </strong>
                  {{ esUrbano 
                    ? 'El cómputo de horas de arriendo parte formalmente en la SALIDA de Casa Matriz y concluye al TÉRMINO en obra.' 
                    : 'El cómputo de horas de arriendo parte a la LLEGADA del equipo a faena y concluye al TÉRMINO de la jornada.' }}
                </div>
              </div>

              <div class="flex items-start gap-2">
                <span class="font-mono text-blue-400">2.</span>
                <div>
                  <strong class="text-white font-mono">Cobro de Flete: </strong>
                  {{ esUrbano 
                    ? 'NO se cobra línea de flete de grúa ($0). El traslado se remunera directamente en las horas facturadas.' 
                    : 'Exige cobro OBLIGATORIO de flete/movilización en línea separada para solventar combustible de carretera, desgaste y chofer.' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD: MATRIZ LIMPIA DE REQUERIMIENTOS (SIN FLAG MANUAL DE FLETE) -->
        <div class="bg-[#080d1e] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <div class="flex items-center gap-2">
              <span class="text-base">⚙️</span>
              <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                3. Requerimientos Operacionales Limpios
              </h3>
            </div>
            <span class="text-[10px] text-emerald-400 font-mono">5 Selectores Legítimos</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label class="text-[10px] text-slate-300 font-bold block mb-1">Requiere OC / HES:</label>
              <select v-model="form.requiere_oc" class="w-full bg-[#050810] border border-white/15 rounded-lg p-1.5 text-white outline-none">
                <option :value="true">SÍ (Exige OC)</option>
                <option :value="false">NO (Sin OC)</option>
              </select>
            </div>

            <div>
              <label class="text-[10px] text-slate-300 font-bold block mb-1">Requiere Acreditación:</label>
              <select v-model="form.requiere_acreditacion" class="w-full bg-[#050810] border border-white/15 rounded-lg p-1.5 text-white outline-none">
                <option :value="true">SÍ (Faena Acreditada)</option>
                <option :value="false">NO (Sin Acreditación)</option>
              </select>
            </div>

            <div>
              <label class="text-[10px] text-slate-300 font-bold block mb-1">Requiere Rigger:</label>
              <select v-model="form.requiere_rigger" class="w-full bg-[#050810] border border-white/15 rounded-lg p-1.5 text-white outline-none">
                <option :value="true">SÍ (Incluir Rigger)</option>
                <option :value="false">NO (Rigger del Cliente)</option>
              </select>
            </div>

            <div>
              <label class="text-[10px] text-slate-300 font-bold block mb-1">Requiere Prevencionista:</label>
              <select v-model="form.requiere_prevencionista" class="w-full bg-[#050810] border border-white/15 rounded-lg p-1.5 text-white outline-none">
                <option :value="false">NO (Sin Prevencionista)</option>
                <option :value="true">SÍ (Exige APR en faena)</option>
              </select>
            </div>
          </div>
        </div>

      </div>


      <!-- ========================================== -->
      <!-- COLUMNA 2: ESTRUCTURADOR REACTIVO EN VIVO (7 cols) -->
      <!-- ========================================== -->
      <div class="lg:col-span-7 space-y-5">
        
        <div class="bg-[#080d1e] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
          
          <!-- CABECERA DEL ESTRUCTURADOR -->
          <div class="flex flex-wrap justify-between items-center gap-3 border-b border-white/10 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="text-lg">📋</span>
              <div>
                <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span>Estructurador de Líneas de Servicio</span>
                  <span class="text-[10px] text-slate-400 font-normal">({{ lineas.length }} líneas cotizadas)</span>
                </h3>
                <p class="text-[10px] text-slate-400">Las tarifas y requerimientos de flete reaccionan a la distancia seleccionada</p>
              </div>
            </div>

            <!-- Botones Rápidos de Inserción -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button 
                type="button" 
                @click="agregarGrua" 
                class="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>+ Grúa Telescópica</span>
              </button>
              <button 
                type="button" 
                @click="agregarFlete" 
                class="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>+ Flete / Traslado</span>
              </button>
            </div>
          </div>

          <!-- BANNER REACTIVO DE ALERTA COMERCIAL -->
          <div 
            v-if="!esUrbano && !tieneFleteCotizado" 
            class="bg-rose-950/40 border border-rose-500/60 rounded-xl p-3 text-xs flex items-center justify-between gap-3 animate-pulse text-rose-200"
          >
            <div class="flex items-center gap-2">
              <span class="text-xl">⚠️</span>
              <div>
                <strong class="font-mono uppercase font-bold text-rose-300 block">Alerta de Fuga de Flete (Servicio Rural):</strong>
                <span>La faena está a {{ form.distancia_km }} km (> 30 km) y <strong>no has incorporado una línea de flete</strong>. Esto genera una pérdida directa para GSP.</span>
              </div>
            </div>
            <button 
              type="button" 
              @click="inyectarFleteRecomendado"
              class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-[11px] whitespace-nowrap cursor-pointer transition-colors shadow"
            >
              + Inyectar Flete Recomendado
            </button>
          </div>

          <div 
            v-else-if="esUrbano && tieneFleteCotizado" 
            class="bg-blue-950/30 border border-blue-500/40 rounded-xl p-3 text-xs flex items-center justify-between gap-3 text-blue-200"
          >
            <div class="flex items-center gap-2">
              <span class="text-lg">ℹ️</span>
              <div>
                <strong class="font-mono uppercase font-bold text-blue-300 block">Servicio Urbano con Línea de Flete:</strong>
                <span>Verificar si el flete corresponde a <strong>camión de contrapesos</strong> (grúa pesada). En grúas convencionales el traslado va en las horas.</span>
              </div>
            </div>
            <button 
              type="button" 
              @click="eliminarFletesInnecesarios"
              class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] whitespace-nowrap cursor-pointer transition-colors"
            >
              Remover Flete
            </button>
          </div>

          <!-- TABLA DE LÍNEAS -->
          <div class="border border-white/10 rounded-xl overflow-hidden overflow-x-auto bg-[#050810]">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-[#0c132c] text-slate-300 border-b border-white/10 font-mono text-[11px] uppercase tracking-wider">
                  <th class="p-3">Concepto / Categoría</th>
                  <th class="p-3 text-center">Unidad Cobro</th>
                  <th class="p-3 text-center">Cant.</th>
                  <th class="p-3 text-right">Tarifa Pactada</th>
                  <th class="p-3 text-right text-blue-400">Subtotal Neto</th>
                  <th class="p-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 font-mono">
                <tr v-if="lineas.length === 0">
                  <td colspan="6" class="p-8 text-center text-slate-500 text-xs italic font-sans">
                    No hay líneas en el estructurador. Presiona los botones superiores para agregar ítems.
                  </td>
                </tr>

                <tr v-for="(line, idx) in lineas" :key="idx" class="hover:bg-white/[0.02] transition-colors">
                  <!-- CONCEPTO & NOTA DINÁMICA -->
                  <td class="p-3 space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs">{{ line.tipo === 'TRASLADOS' ? '🚚' : (line.tipo === 'GRUAS' ? '🏗️' : '👷') }}</span>
                      <strong class="text-white font-sans text-xs">{{ line.descripcion }}</strong>
                    </div>

                    <!-- NOTA CONTEXTUAL DEPENDIENTE DEL RÉGIMEN -->
                    <div v-if="line.tipo === 'GRUAS'" class="text-[10px] font-mono">
                      <span :class="esUrbano ? 'text-blue-400' : 'text-amber-400'" class="font-bold">
                        {{ esUrbano ? '⏰ Horas desde Portón Casa Matriz' : '⏰ Horas desde Llegada a Faena' }}
                      </span>
                    </div>

                    <div v-if="line.tipo === 'TRASLADOS'" class="text-[10px] font-mono text-emerald-400">
                      <span>🚚 Flete Cerrado Ida y Vuelta</span>
                    </div>
                  </td>

                  <!-- UNIDAD -->
                  <td class="p-3 text-center">
                    <span class="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-[10px] text-slate-300">
                      {{ line.unidad }}
                    </span>
                  </td>

                  <!-- CANTIDAD -->
                  <td class="p-3 text-center">
                    <input 
                      type="number" 
                      v-model.number="line.cantidad" 
                      min="1" 
                      class="w-16 bg-[#0a1128] border border-white/15 rounded p-1 text-center text-white text-xs font-mono outline-none"
                    />
                  </td>

                  <!-- PRECIO UNITARIO -->
                  <td class="p-3 text-right">
                    <input 
                      type="number" 
                      v-model.number="line.precio" 
                      step="1000" 
                      class="w-28 bg-[#0a1128] border border-white/15 rounded p-1 text-right text-white text-xs font-mono outline-none"
                    />
                  </td>

                  <!-- SUBTOTAL -->
                  <td class="p-3 text-right font-bold text-white">
                    {{ formatMoneda(line.cantidad * line.precio) }}
                  </td>

                  <!-- ELIMINAR -->
                  <td class="p-3 text-center">
                    <button 
                      @click="eliminarLinea(idx)" 
                      class="text-rose-400 hover:text-rose-200 p-1 text-sm cursor-pointer transition-colors"
                      title="Eliminar línea"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- TARJETAS TOTALES FINANCIEROS -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div class="bg-[#050810] border border-white/10 rounded-xl p-3 space-y-0.5">
              <span class="text-[10px] uppercase font-mono font-bold text-slate-400 block">Subtotal Grúas</span>
              <div class="text-sm sm:text-base font-black font-mono text-white">
                {{ formatMoneda(totalGruas) }}
              </div>
            </div>

            <div class="bg-[#050810] border border-white/10 rounded-xl p-3 space-y-0.5">
              <span class="text-[10px] uppercase font-mono font-bold text-slate-400 block">Subtotal Flete</span>
              <div class="text-sm sm:text-base font-black font-mono text-amber-400">
                {{ formatMoneda(totalFletes) }}
              </div>
            </div>

            <div class="bg-[#050810] border border-white/10 rounded-xl p-3 space-y-0.5">
              <span class="text-[10px] uppercase font-mono font-bold text-slate-400 block">IVA (19%)</span>
              <div class="text-sm sm:text-base font-black font-mono text-slate-300">
                {{ formatMoneda(totalIva) }}
              </div>
            </div>

            <div class="bg-blue-950/40 border border-blue-500/50 rounded-xl p-3 space-y-0.5 shadow-lg">
              <span class="text-[10px] uppercase font-mono font-black text-blue-300 block">TOTAL COTIZADO</span>
              <div class="text-base sm:text-lg font-black font-mono text-blue-400">
                {{ formatMoneda(totalBruto) }}
              </div>
            </div>
          </div>

          <!-- CLÁUSULA CONTRACTUAL DINÁMICA QUE IRÍA AL PDF DEL MANDANTE -->
          <div class="bg-[#050810] border border-white/10 rounded-xl p-3.5 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5">
                <span>📄</span> <span>Cláusula Oficial Generada para el PDF Mandante</span>
              </span>
              <span class="text-[9px] font-mono text-emerald-400">Texto Automatizado Sin Error Humano</span>
            </div>
            <p class="text-xs text-slate-300 font-sans italic bg-black/40 p-2.5 rounded-lg border border-white/5">
              "{{ clausulaPdf }}"
            </p>
          </div>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Formulario reactivo simplificado
const form = ref({
  cliente: 'CARTULINAS CMPC S.A.',
  obra: 'Mantenimiento Planta Laja - Maniobra Spot',
  distancia_km: 15, // Inicial en radio urbano (15 km)
  requiere_oc: true,
  requiere_acreditacion: true,
  requiere_rigger: true,
  requiere_prevencionista: false
});

// Evaluación del Régimen
const esUrbano = computed(() => (parseFloat(form.value.distancia_km) || 0) <= 30);

// Estructurador de líneas
const lineas = ref([
  {
    tipo: 'GRUAS',
    descripcion: 'Grúa Telescópica 70 Toneladas (XCT70SA)',
    cantidad: 8,
    unidad: 'Horas Diarias',
    precio: 45000
  },
  {
    tipo: 'PERSONAL',
    descripcion: 'Rigger Técnico Certificado',
    cantidad: 1,
    unidad: 'Jornada',
    precio: 35000
  }
]);

const tieneFleteCotizado = computed(() => {
  return lineas.value.some(l => l.tipo === 'TRASLADOS');
});

const agregarGrua = () => {
  lineas.value.push({
    tipo: 'GRUAS',
    descripcion: 'Grúa Telescópica 90 Toneladas (ZTC900V)',
    cantidad: 8,
    unidad: 'Horas Diarias',
    precio: 65000
  });
};

const agregarFlete = () => {
  const precioSugerido = esUrbano.value ? 150000 : (form.value.distancia_km > 70 ? 600000 : 380000);
  lineas.value.push({
    tipo: 'TRASLADOS',
    descripcion: 'Flete y Movilización de Grúa Ida y Retorno',
    cantidad: 1,
    unidad: 'Fijo',
    precio: precioSugerido
  });
};

const inyectarFleteRecomendado = () => {
  const precioSugerido = form.value.distancia_km > 70 ? 650000 : 400000;
  lineas.value.push({
    tipo: 'TRASLADOS',
    descripcion: `Flete / Traslado Vial (${form.value.distancia_km} km ida y retorno)`,
    cantidad: 1,
    unidad: 'Fijo',
    precio: precioSugerido
  });
};

const eliminarFletesInnecesarios = () => {
  lineas.value = lineas.value.filter(l => l.tipo !== 'TRASLADOS');
};

const eliminarLinea = (idx) => {
  lineas.value.splice(idx, 1);
};

const resetearEjemplo = () => {
  form.value.distancia_km = 15;
  lineas.value = [
    {
      tipo: 'GRUAS',
      descripcion: 'Grúa Telescópica 70 Toneladas (XCT70SA)',
      cantidad: 8,
      unidad: 'Horas Diarias',
      precio: 45000
    },
    {
      tipo: 'PERSONAL',
      descripcion: 'Rigger Técnico Certificado',
      cantidad: 1,
      unidad: 'Jornada',
      precio: 35000
    }
  ];
};

const volverAlCRM = () => {
  router.push('/crm');
};

// Totales Financieros
const totalGruas = computed(() => {
  return lineas.value
    .filter(l => l.tipo === 'GRUAS')
    .reduce((acc, l) => acc + (l.cantidad * l.precio), 0);
});

const totalFletes = computed(() => {
  return lineas.value
    .filter(l => l.tipo === 'TRASLADOS')
    .reduce((acc, l) => acc + (l.cantidad * l.precio), 0);
});

const totalNeto = computed(() => {
  return lineas.value.reduce((acc, l) => acc + (l.cantidad * l.precio), 0);
});

const totalIva = computed(() => {
  return Math.round(totalNeto.value * 0.19);
});

const totalBruto = computed(() => {
  return totalNeto.value + totalIva.value;
});

const formatMoneda = (monto) => {
  return '$ ' + Math.round(monto || 0).toLocaleString('es-CL');
};

// Cláusula Contractual para el PDF
const clausulaPdf = computed(() => {
  if (esUrbano.value) {
    return `SERVICIO URBANO (${form.value.distancia_km} KM DESDE BASE): El cómputo de horas de operación inicia formalmente al momento de la salida del equipo desde las instalaciones de Grúas San Pablo en Temuco y concluye al término de las maniobras en obra. Traslado de grúa incorporado en tarifa horaria.`;
  } else {
    return `SERVICIO RURAL / FAENA (${form.value.distancia_km} KM DESDE BASE): El cómputo de horas de operación inicia al arribo del equipo a faena. El traslado y movilización vial se encuentra estipulado en línea independiente de flete pactada.`;
  }
});
</script>
