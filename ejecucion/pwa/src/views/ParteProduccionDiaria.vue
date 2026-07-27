<template>
  <div class="h-full">
    <!-- Barra superior -->
    <v-app-bar color="primary" density="compact" flat>
      <v-app-bar-title class="font-weight-bold">Parte de Producción Diaria</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip color="white" variant="outlined" label class="mr-2 font-weight-bold">
        <v-icon start icon="mdi-calendar"></v-icon>
        {{ today }}
      </v-chip>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- Partidas agrupadas: toda la página es una Cuadrilla; cada panel es una cuadrilla -->
        <h2 class="text-h6 font-weight-bold my-3 text-grey-darken-3">Partidas de Hoy</h2>
        
        <v-expansion-panels multiple>
          <v-expansion-panel
            v-for="(grupo, idx) in gruposPorCuadrilla"
            :key="`cuad-${grupo.cuadrilla}-${idx}`"
          >
            <!--pre class="json-preview mr-3">{{ formatGrupoJson(grupo) }}</pre-->
            <v-expansion-panel-title>
              <div class="d-flex align-center w-100">
                
                <v-icon class="mr-2">mdi-account-hard-hat</v-icon>
                <span class="text-subtitle-1 font-weight-medium">
                  {{ grupoTaskIdsLabel(grupo) }} | Cuadrilla {{ grupo.cuadrilla ? grupo.cuadrilla : '(SIN ASIGNAR)' }}
                </span>
                <v-spacer></v-spacer>
                <v-chip size="small" variant="tonal" color="blue-grey">{{ grupo.tasks.length }} partidas</v-chip>
                <v-chip size="small" variant="tonal" class="ml-2" color="indigo">{{ totalHorasGrupo(grupo.tasks) }} hrs</v-chip>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div class="d-flex flex-column gap-3">
                <!-- Tarjetas por Partida dentro de la Cuadrilla -->
                <v-card
                  v-for="task in grupo.tasks"
                  :key="task.id"
                  class="mb-4"
                  elevation="2"
                  :border-color="getTaskColor(task)"
                  :class="{ 'expanded': isExpanded(task) }"
                >
                  <v-card-item class="pb-2 pt-2" @click="toggleExpansion(task)">
                    <v-card-title class="d-flex justify-space-between align-center">
                      <div class="d-flex align-center">
                        <v-icon class="expand-icon mr-2">{{ isExpanded(task) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                        <span class="text-subtitle-1">{{ task.partida }}</span>
                      </div>
                      <div class="d-flex align-center gap-2">
                        <v-chip v-if="task.anticipada" color="purple" variant="flat" size="small" label>ANTICIPADA</v-chip>
                        <v-chip v-if="task.unidad" size="small" variant="outlined" color="grey">{{ task.unidad }}</v-chip>
                      </div>
                    </v-card-title>
                    <v-card-subtitle>{{ task.familia }}</v-card-subtitle>
                  </v-card-item>

                  <v-expand-transition>
                    <div v-show="isExpanded(task)">
                      <v-divider></v-divider>
                      <v-card-text>
                        <!-- Avance -->
                        <v-row dense>
                          <v-col cols="6">
                            <v-text-field
                              label="Planificado"
                              :model-value="task.plan.toString()"
                              variant="outlined"
                              density="compact"
                              readonly
                              :suffix="task.unidad"
                            />
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              label="Avance Real"
                              v-model.number="task.real"
                              variant="outlined"
                              density="compact"
                              type="number"
                              :suffix="task.unidad"
                              clearable
                              @update:model-value="() => { task.motivo = null; task.observaciones = null; task.fotos = [] }"
                            />
                          </v-col>
                        </v-row>

                        <!-- Motivo de No Cumplimiento -->
                        <v-expand-transition>
                          <div v-if="showMotivo(task)">
                            <v-select
                              label="Motivo de No Cumplimiento"
                              v-model="task.motivo"
                              :items="motivosNoCumplimiento"
                              variant="outlined"
                              density="compact"
                              prepend-inner-icon="mdi-alert-circle-outline"
                              :color="task.real === 0 ? 'red' : 'orange'"
                              class="mb-3"
                            />

                            <v-textarea
                              label="Observaciones (Obligatorio)"
                              v-model="task.observaciones"
                              variant="outlined"
                              density="compact"
                              rows="3"
                              auto-grow
                              :color="task.real === 0 ? 'red' : 'orange'"
                              class="mb-3"
                            />

                            <v-file-input
                              label="Adjuntar Fotos (Máx 5)"
                              v-model="task.fotos"
                              variant="outlined"
                              density="compact"
                              multiple
                              accept="image/*"
                              capture="environment"
                              prepend-icon="mdi-camera"
                              :rules="photoRules"
                              chips
                              counter
                            />
                          </div>
                        </v-expand-transition>

                        <!-- Horas Asignadas -->
                        <v-divider class="my-3" />
                        <div class="d-flex justify-space-between align-center mb-2">
                          <h4 class="text-subtitle-2 font-weight-bold text-grey-darken-2">Horas Asignadas</h4>
                          <v-chip color="blue-grey" size="small" variant="tonal" class="font-weight-bold">
                            Total: {{ calculateTotalHours(task.assigned_personnel) }} hrs
                          </v-chip>
                        </div>
                        <v-list lines="one" density="compact" bg-color="transparent">
                          <v-list-item v-for="person in task.assigned_personnel" :key="person.personId" class="pa-0">
                            <v-row dense align="center">
                              <v-col cols="7">
                                <v-list-item-title class="text-body-2">{{ person.nombre }}</v-list-item-title>
                              </v-col>
                              <v-col cols="5">
                                <v-text-field
                                  label="Horas"
                                  v-model.number="person.horas"
                                  variant="outlined"
                                  density="compact"
                                  type="number"
                                  suffix="hrs"
                                  hide-details
                                />
                              </v-col>
                            </v-row>
                          </v-list-item>
                        </v-list>
                      </v-card-text>
                    </div>
                  </v-expand-transition>
                </v-card>

                <!-- 🔹 Observaciones y Recursos por CUADRILLA -->
                <h3 class="text-subtitle-1 font-weight-bold mb-3 text-grey-darken-3">Observaciones Generales (Cuadrilla {{ grupo.cuadrilla }})</h3>
                <v-card class="mb-4" elevation="2" border-color="grey-lighten-2">
                  <v-card-text>
                    <v-textarea
                      label="Ingrese comentarios generales de la cuadrilla..."
                      v-model="groupStates[grupo.cuadrilla].observaciones"
                      variant="outlined"
                      rows="4"
                      auto-grow
                      hide-details
                    />
                  </v-card-text>
                </v-card>

                <h3 class="text-subtitle-1 font-weight-bold mb-3 text-grey-darken-3">Materiales e Insumos (Cuadrilla {{ grupo.cuadrilla }})</h3>
                <v-card class="mb-4" elevation="2" border-color="grey-lighten-2">
                  <v-card-text>
                    <v-list lines="one" density="compact" bg-color="transparent">
                      <v-list-item
                        v-for="item in groupStates[grupo.cuadrilla].materialesInsumos"
                        :key="item.id"
                        class="pa-0"
                      >
                        <v-row dense align="center">
                          <v-col cols="6">
                            <v-list-item-title class="text-body-2">{{ item.descripcion }}</v-list-item-title>
                          </v-col>
                          <v-col cols="2" class="unit-col">{{ item.unidad || '-' }}</v-col>
                          <v-col cols="4">
                            <v-text-field
                              label="Cant."
                              v-model.number="item.cantidad"
                              variant="outlined"
                              density="compact"
                              type="number"
                              hide-details
                            />
                          </v-col>
                        </v-row>
                        <v-divider v-if="item.id !== groupStates[grupo.cuadrilla].materialesInsumos[groupStates[grupo.cuadrilla].materialesInsumos.length - 1].id" class="mt-1" />
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>

                <h3 class="text-subtitle-1 font-weight-bold mb-3 text-grey-darken-3">Equipos, Herramientas y Fletes (Cuadrilla {{ grupo.cuadrilla }})</h3>
                <v-card class="mb-4" elevation="2" border-color="grey-lighten-2">
                  <v-card-text>
                    <v-list lines="one" density="compact" bg-color="transparent">
                      <v-list-item
                        v-for="item in groupStates[grupo.cuadrilla].equiposHerramientas"
                        :key="item.id"
                        class="pa-0"
                      >
                        <v-row dense align="center">
                          <v-col cols="6">
                            <v-list-item-title class="text-body-2">{{ item.descripcion }}</v-list-item-title>
                          </v-col>
                          <v-col cols="2" class="unit-col">{{ item.unidad || '-' }}</v-col>
                          <v-col cols="4">
                            <v-text-field
                              label="Cant."
                              v-model.number="item.cantidad"
                              variant="outlined"
                              density="compact"
                              type="number"
                              hide-details
                            />
                          </v-col>
                        </v-row>
                        <v-divider v-if="item.id !== groupStates[grupo.cuadrilla].equiposHerramientas[groupStates[grupo.cuadrilla].equiposHerramientas.length - 1].id" class="mt-1" />
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Botón para añadir partidas anticipadas -->
        <v-btn
          block
          color="blue-darken-3"
          variant="tonal"
          prepend-icon="mdi-plus-circle-outline"
          class="mb-4"
          @click="openAddDialog"
        >
          Añadir Partida No Programada
        </v-btn>
      </v-container>
    </v-main>

    <!-- Footer de envío -->
    <v-footer app class="pa-4 bg-grey-lighten-4">
      <div class="w-100 d-flex flex-column gap-2">
        <v-btn
          block
          color="primary"
          size="large"
          elevation="4"
          prepend-icon="mdi-content-save"
          @click="guardarSurvey"
        >
          Guardar
        </v-btn>
        <br>
        <v-btn
          block
          color="primary"
          size="large"
          elevation="4"
          prepend-icon="mdi-check-circle"
          @click="submitPPD"
        >
          Enviar Parte Diario
        </v-btn>
      </div>
    </v-footer>

    <!-- Diálogo Añadir Partida Anticipada -->
    <v-dialog v-model="addDialog" max-width="520px">
      <v-card>
        <v-card-title class="text-h5">Añadir Partida No Programada</v-card-title>
        <v-card-text>
          <v-autocomplete
            label="Seleccionar Partida Pendiente"
            v-model="newTaskData.selectedTask"
            :items="pendingTasks"
            item-title="partida"
            item-value="id"
            return-object
            variant="outlined"
            class="mb-3"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.familia"></v-list-item>
            </template>
          </v-autocomplete>

          <v-select
            label="Asignar a Cuadrilla"
            v-model="newTaskData.cuadrilla"
            :items="cuadrillasDisponibles"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="addDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="saveNewTask">Añadir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from "vue-router";
import apiAxios from '@/services/api'
import { DateTime } from 'luxon';

import { useFlujoAprobacion } from '@/composables/useFlujoAprobacion'
import { useUserDetailStore } from '@/store/userDetail'

/* eslint-disable */

const userDetailStore = useUserDetailStore()
const { terminarSurveyYExportar } = useFlujoAprobacion()

const route = useRoute()

const idSurvey = ref(null);
const survey = ref(null);
const idProyecto = ref(null);
const tareas = ref(null);              // (si lo sigues usando para otros endpoints)
const idEquiposProyectos = ref(null);
const equiposProyectos = ref([]); 
const equiposProyectosMiembros = ref(null);
const tareasGantt = ref(null);

// 1) Toma la fecha del query (o usa hoy)
const raw = Array.isArray(route.query.fecha) ? route.query.fecha[0] : route.query.fecha
const fecha = ref(typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : hoyISO())

// 2) Fecha “bonita” en es-CL SIN desfase de zona horaria
const today = computed(() => formatFechaLarga(fecha.value))

// --- Helpers de fecha ---
function hoyISO() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function formatFechaLarga(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
}

// --- Carga de survey ---
async function getSurvey() {
  try {
    const { data } = await apiAxios.get(
      `/servicio/leanglobal/procesosSurveyDetail?id_survey=${idSurvey.value}`
    );

    survey.value = data?.[0] ?? {};

    let bodyExec = survey.value.body_exec;
    if (typeof bodyExec === 'string') {
      const txt = bodyExec.trim();
      if (txt && txt.toLowerCase() !== 'null') {
        try {
          bodyExec = JSON.parse(txt);
        } catch (e) {
          console.error('Error parseando body_exec string:', e);
          bodyExec = {};
        }
      } else {
        bodyExec = {};
      }
    }

    if (!bodyExec || typeof bodyExec !== 'object') bodyExec = {};
    if (!Array.isArray(bodyExec.task)) bodyExec.task = [];
    survey.value.body_exec = bodyExec;

  } catch (error) {
    console.error("Error al obtener survey:", error);
    throw error;
  }
}

// ---- PROXY tasks -> survey.value.body_exec.task ----
const tasks = computed({
  get() {
    return survey.value?.body_exec?.task ?? [];
  },
  set(val) {
    if (!survey.value) survey.value = {};
    if (!survey.value.body_exec) survey.value.body_exec = {};
    survey.value.body_exec.task = Array.isArray(val) ? val : [];
  }
});

// Inicializar para cuadrillas existentes
onMounted(async () => {
  idSurvey.value = route.query.idSurvey;
  idProyecto.value = route.query.idProyecto;
  await getSurvey();
  await normalizarPlanRealDesdeGantt();
  // Nada de reasignar desde variables locales: tasks YA apunta al survey
});

// --- DATOS MOCK / catálogos ---
const masterPersonnel = ref(null);

const pendingTasks = ref([
  { id: 101, familia: 'Cierre y Restitución', partida: 'Restitución de Servidumbre', unidad: 'm²' },
  { id: 102, familia: 'Área Mecánica', partida: 'Tendido Cable Ánodo', unidad: 'Ml' },
  { id: 103, familia: 'Área Mecánica', partida: 'Instalación de Coplas', unidad: 'Un' },
  { id: 104, familia: 'Movimiento de tierras', partida: 'Humectación Camino', unidad: 'm²' },
])

const motivosNoCumplimiento = ref([
  'Condiciones climáticas (Lluvia, viento)',
  'Falla de equipo / maquinaria',
  'Falta de material',
  'Problemas de permisos / acceso',
  'Instrucciones pendientes',
  'Revisión de calidad',
  'Otro',
])

// 🔹 Estado por CUADRILLA: observaciones + recursos
const groupStates = ref({})

const defaultMateriales = () => ([
  { id: 301, descripcion: 'Pintura Protal', unidad: 'Gl', cantidad: null },
  { id: 302, descripcion: 'Cinta Premtape Tropical', unidad: 'Rollo', cantidad: null },
  { id: 303, descripcion: 'Cinta Premcote Glass', unidad: 'Rollo', cantidad: null },
  { id: 304, descripcion: 'Membrana Rockward', unidad: 'm²', cantidad: null },
  { id: 305, descripcion: 'Papel Film', unidad: 'Rollo', cantidad: null },
  { id: 306, descripcion: 'Gratas 4 1/2"', unidad: 'Un', cantidad: null },
  { id: 307, descripcion: 'Gratas 7"', unidad: 'Un', cantidad: null },
  { id: 308, descripcion: 'Sacos', unidad: 'Un', cantidad: null },
  { id: 309, descripcion: 'Chocos 4x4', unidad: 'Un', cantidad: null },
  { id: 310, descripcion: 'Barreras duras', unidad: 'Un', cantidad: null },
  { id: 311, descripcion: 'Eslinga', unidad: 'Un', cantidad: null },
  { id: 312, descripcion: 'Tecles cadena 3ton', unidad: 'Un', cantidad: null },
  { id: 313, descripcion: 'Soplete manual + galón gas', unidad: 'Set', cantidad: null },
])
const defaultEquipos = () => ([
  { id: 401, descripcion: 'Camioneta', unidad: 'Hr', cantidad: null },
  { id: 402, descripcion: 'Bulldozer', unidad: 'Hr', cantidad: null },
  { id: 403, descripcion: 'Excavadora', unidad: 'Hr', cantidad: null },
  { id: 404, descripcion: 'Retroexcavadora', unidad: 'Hr', cantidad: null },
  { id: 405, descripcion: 'Camión Aljibe', unidad: 'Hr', cantidad: null },
  { id: 406, descripcion: 'Camión cama baja', unidad: 'Viaje', cantidad: null },
  { id: 407, descripcion: 'Camión pluma', unidad: 'Hr', cantidad: null },
  { id: 408, descripcion: 'Placa o rodillo compactador', unidad: 'Hr', cantidad: null },
  { id: 409, descripcion: 'Generador', unidad: 'Hr', cantidad: null },
])
const ensureGroupState = (cuadrilla) => {
  if (!groupStates.value[cuadrilla]) {
    groupStates.value[cuadrilla] = {
      observaciones: '',
      materialesInsumos: defaultMateriales(),
      equiposHerramientas: defaultEquipos(),
    }
  }
}

// (Opcional) Endpoints complementarios que aún uses
const templatesSurvey = ref(null);
async function obtenerTemplates(id_tipo_srv) {
  try {
    const { data } = await apiAxios.get(`/servicio/leanglobal/obtenerTemplates?id_tipo_srv=${id_tipo_srv}`);
    templatesSurvey.value = data[0];
  } catch (err) {
    console.error('Error al obtener templates:', err);
  }
};
async function obtenerTareasData(){
  const url = '/servicio/leanglobal/obtenerTareasData?id_proyecto=' + idProyecto.value + '&fecha=' + fecha.value;
  try {
    const { data } = await apiAxios.get(url);
    tareas.value = data;
  } catch (error) {
    console.error('❌ obtenerTareasData', error);
  }
}
async function obtenerEquiposProyectos(idProyecto){
  const url = '/servicio/leanglobal/obtenerEquiposProyectos?id_proyecto=' + idProyecto;
  try {
    const { data } = await apiAxios.get(url);
    idEquiposProyectos.value = data;
  } catch (error) {
    console.error('❌ obtenerEquiposProyectos', error);
  }
}
async function obtenerEquiposProyectosMiembros(idEquipoProyecto) {
  const url = `/servicio/leanglobal/obtenerEquiposProyectosMiembros?id_equipo_proyecto=${idEquipoProyecto}`;
  try {
    const { data } = await apiAxios.get(url);

    // Mapea a un formato uniforme (opcional pero recomendado)
    const mapped = (Array.isArray(data) ? data : []).map(m => ({
      id:      m.id_miembro ?? m.id_usuario ?? m.id_user ?? m.id ?? m.user_id ?? null,
      nombre:  (m.nombre_user ?? m.nombre ?? [m.nombres, m.apellidos].filter(Boolean).join(' ')) || 'Sin nombre',
      horas:   null
    })).filter(p => p.id != null);

    equiposProyectosMiembros.value = mapped; // si querís guardarlo igual
    return mapped;                            // ← IMPORTANTE
  } catch (err) {
    console.error('❌ obtenerEquiposProyectosMiembros', err);
    equiposProyectosMiembros.value = [];
    return [];                                // ← IMPORTANTE
  }
}

// Si aún necesitas mapear desde "tareas" externas a tasks del survey
async function mapTareasToTasks(rawData) {
  const cuadrillas = rawData
    .filter(x => x.nivel === 1)
    .reduce((acc, x) => { acc[String(x.id_tarea)] = (x.nombre_tarea ?? '').toString().trim(); return acc; }, {});
  const partidasPorId = rawData
    .filter(x => x.nivel === 2)
    .reduce((acc, x) => {
      const id = String(x.id_tarea);
      if (!acc[id]) {
        acc[id] = { id_tarea: x.id_tarea, id_tarea_padre: x.id_tarea_padre, nombre_tarea: x.nombre_tarea, unidad: x.unidad, detalles: [] };
      }
      acc[id].detalles.push({
        fecha: x.fecha,
        plan: x.value != null ? Number(x.value) : 0,
        real: x.real != null ? Number(x.real) : null
      });
      return acc;
    }, {});
  const mapped = Object.values(partidasPorId).map((p) => {
    const planTotal = p.detalles.reduce((s, d) => s + (d.plan || 0), 0);
    const realTotal = p.detalles.reduce((s, d) => s + (d.real || 0), 0);
    const nombreCuadrilla = cuadrillas[String(p.id_tarea_padre)] ?? null;
    return {
      id: p.id_tarea,
      plan: planTotal,
      real: realTotal || null,
      fotos: [],
      motivo: null,
      unidad: p.unidad,
      familia: null,
      partida: p.nombre_tarea,
      cuadrilla: nombreCuadrilla,
      anticipada: false,
      observaciones: null,
      assigned_personnel: []
    };
  });
  // escribe directo en survey
  tasks.value = mapped;
  return mapped;
}

function toDateOnly(isoLike) {
  const s = String(isoLike ?? '').trim();
  if (!s) return '';
  return s.includes('T') ? s.split('T')[0] : s;
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function normalizarPlanRealDesdeGantt() {
  if (!idProyecto.value) return;
  if (!Array.isArray(tasks.value) || tasks.value.length === 0) return;

  await obtenerTareasParaUpdate(idProyecto.value);
  const rows = Array.isArray(tareasGantt.value) ? tareasGantt.value : [];
  const targetDate = toDateOnly(fecha.value);

  const diaByTaskId = new Map();
  for (const row of rows) {
    const idTarea = Number(row?.id_tarea);
    if (!Number.isFinite(idTarea) || idTarea <= 0) continue;
    const dias = Array.isArray(row?.json_data) ? row.json_data : [];
    const dia = dias.find(d => toDateOnly(d?.fecha) === targetDate);
    if (!dia) continue;
    diaByTaskId.set(idTarea, dia);
  }

  let cambios = 0;
  tasks.value = tasks.value.map((task) => {
    const id = Number(task?.id_tarea_n2 ?? task?.id_tarea ?? task?.id);
    const dia = diaByTaskId.get(id);
    if (!dia) return task;

    const nextPlan = toNum(dia?.value);
    const nextReal = dia?.real == null ? 0 : toNum(dia?.real);

    if (task.plan === nextPlan && task.real === nextReal) return task;
    cambios += 1;
    return {
      ...task,
      plan: nextPlan,
      real: nextReal
    };
  });

  console.log('[PPD] Normalización plan/real desde gantt', {
    fecha: targetDate,
    tareas: tasks.value.length,
    actualizadas: cambios
  });
}

function tidyName(m) {
  const completo = [
    m.nombre_completo,
    m.nombre,
    [m.nombres, m.apellidos].filter(Boolean).join(' ')
  ].find(v => v && String(v).trim().length > 0);
  const rol = m.rol?.toString().trim();
  return rol ? `${String(completo).trim()} (${rol})` : String(completo).trim();
}
function pickId(m) {
  return m.id_miembro ?? m.id_usuario ?? m.id_user ?? m.id ?? m.user_id ?? null;
}

// UI state
const addDialog = ref(false)
const newTaskData = ref({ selectedTask: null, cuadrilla: 'C-01' })
const snackbar = ref({ show: false, text: '', color: 'success' })
const photoRules = [v => !v || v.length <= 5 || 'No puedes subir más de 5 fotos']
const expandedTasks = ref(new Set())

// Helpers
const populatePersonnelForTasks = (taskList) => {
  const personnelList = JSON.parse(JSON.stringify(masterPersonnel.value))
  if (!Array.isArray(taskList)) return;
  taskList.forEach(task => {
    if (!task.assigned_personnel || task.assigned_personnel.length === 0) {
      task.assigned_personnel = (personnelList || []).map(p => ({ personId: p.id, nombre: p.nombre, horas: null }))
    }
  })
}
const showMotivo = (task) => {
  const realValue = task.real
  return realValue !== null && typeof realValue !== 'undefined' && (realValue === 0 || realValue < task.plan)
}
const getTaskColor = (task) => {
  if (task.anticipada) return 'purple'
  if (task.real === null || task.real === undefined) return 'grey-lighten-2'
  if (task.real < task.plan || task.real === 0) {
    if (task.motivo) return task.real === 0 ? 'red' : 'orange'
    return task.real === 0 ? 'red-lighten-3' : 'orange-lighten-3'
  }
  if (task.real >= task.plan) return 'green'
  return 'grey-lighten-2'
}
const openAddDialog = () => {
  newTaskData.value = { selectedTask: null, cuadrilla: cuadrillasDisponibles.value[0] || 'C-01' }
  addDialog.value = true
}
const saveNewTask = () => {
  const selected = newTaskData.value.selectedTask
  if (!selected) {
    snackbar.value = { show: true, text: 'Debe seleccionar una partida.', color: 'error' }
    return
  }
  const alreadyAdded = tasks.value.some(t => t.id === selected.id)
  if (alreadyAdded) {
    snackbar.value = { show: true, text: 'Esta partida ya está en el parte diario.', color: 'warning' }
    return
  }
  const cuad = newTaskData.value.cuadrilla || 'C-01'
  ensureGroupState(cuad)

  const newTask = {
    id: selected.id,
    cuadrilla: cuad,
    familia: selected.familia,
    partida: selected.partida,
    unidad: selected.unidad,
    plan: 0,
    real: null,
    motivo: null,
    observaciones: null,
    fotos: [],
    anticipada: true,
    assigned_personnel: [],
  }
  populatePersonnelForTasks([newTask])

  // push directo al array del survey
  tasks.value.push(newTask)

  pendingTasks.value = pendingTasks.value.filter(t => t.id !== selected.id)
  addDialog.value = false
  expandedTasks.value.add(newTask.id)
}


const submitPPD = async () => {
  // 1) Validaciones PPD (tal como ya las tenías)
  const taskSinAvance = tasks.value.some(t => t.real === null || typeof t.real === 'undefined')
  if (taskSinAvance) {
    snackbar.value = { show: true, text: 'Error: Debe ingresar el avance para todas las partidas.', color: 'error' }
    return
  }
  // VALIDACIÓN NO CUMPLIMIENTO (temporalmente desactivada)
  // Descomentar este bloque si se vuelve a exigir motivo/observaciones al enviar PPD.
  /*const taskSinMotivo = tasks.value.some(t => showMotivo(t) && !t.motivo)
  if (taskSinMotivo) {
    snackbar.value = { show: true, text: 'Error: Debe justificar las partidas con no cumplimiento.', color: 'error' }
    return
  }
  const taskSinObservaciones = tasks.value.some(
    t => showMotivo(t) && (!t.observaciones || t.observaciones.trim() === '')
  )
  if (taskSinObservaciones) {
    snackbar.value = { show: true, text: 'Error: Debe ingresar observaciones para las partidas con no cumplimiento.', color: 'error' }
    return
  }*/
  const taskSinHoras = tasks.value.some(
    t => (t.real > 0) && t.assigned_personnel.every(p => !p.horas || p.horas <= 0)
  )
  /*if (taskSinHoras) {
    snackbar.value = { show: true, text: 'Error: Una partida con avance debe tener horas asignadas.', color: 'error' }
    return
  }*/

  // 2) Construir dataToSend (si lo necesitas para log / futuro)
  const recursosPorCuadrilla = {}
  for (const [cuad, state] of Object.entries(groupStates.value)) {
    recursosPorCuadrilla[cuad] = {
      observacionesGenerales: state.observaciones,
      materiales: state.materialesInsumos
        .filter(i => i.cantidad > 0)
        .map(i => ({ id: i.id, cantidad: i.cantidad })),
      equipos: state.equiposHerramientas
        .filter(i => i.cantidad > 0)
        .map(i => ({ id: i.id, cantidad: i.cantidad })),
    }
  }

  const dataToSend = {
    fecha: new Date().toISOString().split('T')[0],
    cuadrillas: Object.keys(recursosPorCuadrilla),
    partidas: tasks.value.map(task => ({
      id: task.id,
      cuadrilla: task.cuadrilla,
      real: task.real,
      anticipada: task.anticipada,
      justificacion: { motivo: task.motivo, observaciones: task.observaciones },
      fotos: task.fotos?.length ? task.fotos : [],
      personal: task.assigned_personnel
        .filter(p => p.horas > 0)
        .map(p => ({ id: p.personId, horas: p.horas })),
    })),
    recursos: recursosPorCuadrilla,
  }

  try {

    // 3) Guardar el survey + Gantt (tu lógica actual)
    await guardarSurvey()

    // 4) MISMO FLUJO que InspeccionBHP: VERIFICACION + PDF + etc.
    await terminarSurveyYExportar(idSurvey.value)

    snackbar.value = {
      show: true,
      text: 'Parte Diario enviado y flujo de aprobación iniciado.',
      color: 'success',
    }
  } catch (err) {
    console.error('❌ Error en submitPPD:', err?.response?.data || err)
    snackbar.value = {
      show: true,
      text: 'Error al enviar el Parte Diario o al iniciar el flujo.',
      color: 'error',
    }
  }
}

const calculateTotalHours = (personnelList) => {
  if (!personnelList) return 0
  return personnelList.reduce((total, person) => {
    const hours = parseFloat(person.horas)
    return total + (isNaN(hours) ? 0 : hours)
  }, 0)
}

const isExpanded = (task) => expandedTasks.value.has(task.id)
const toggleExpansion = (task) => {
  if (expandedTasks.value.has(task.id)) expandedTasks.value.delete(task.id)
  else expandedTasks.value.add(task.id)
}

// Agrupación por Cuadrilla
const gruposPorCuadrilla = computed(() => {
  const map = new Map()
  for (const t of tasks.value) {
    const key = t.cuadrilla || 'Sin Cuadrilla'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(t)
    ensureGroupState(key)
  }
  return Array.from(map.entries()).map(([cuadrilla, list]) => ({ cuadrilla, tasks: list }))
})

const cuadrillasDisponibles = computed(() =>
  Array.from(new Set(tasks.value.map(t => t.cuadrilla))).filter(Boolean).sort()
)
const totalHorasGrupo = (list) =>
  list.reduce((acc, t) => acc + calculateTotalHours(t.assigned_personnel), 0)

const grupoTaskIdsLabel = (grupo) => {
  const ids = Array.from(
    new Set(
      (Array.isArray(grupo?.tasks) ? grupo.tasks : [])
        .map(t => t?.id)
        .filter(v => v !== null && v !== undefined && v !== '')
    )
  )
  return ids.length ? `ID ${ids.join(', ')}` : 'ID -'
}

const formatGrupoJson = (grupo) => {
  try {
    return JSON.stringify(
      {
        cuadrilla: grupo?.cuadrilla ?? null,
        tasks: Array.isArray(grupo?.tasks) ? grupo.tasks : []
      },
      null,
      2
    )
  } catch {
    return '{}'
  }
}





const guardarSurvey = async () => {
  // si faltan fotos obligatorias, no continúa
  //if (!validarFotosRequeridas()) return;
  try {
    await putSurvey(idSurvey.value);
    alert('Survey Guardado Correctamente');
  } catch (error) {
    console.error('Error guardando survey:', error);
    alert('Error al guardar el survey. Revisa conexión o datos e intenta nuevamente.');
  }
};

async function putSurvey(id_survey) {
  const coordenadas = obtenerCoordenadas(survey.value);

  const payloadSurvey = {
    estado_srv: 'Ejecución',
    body_exec: JSON.stringify(survey.value.body_exec),
    fecha_real_ini: DateTime.now().setZone('America/Santiago').toFormat("yyyy-MM-dd'T'HH:mm:ss"),
    fecha_ejec_fin: null,
    latitud: coordenadas?.lat ?? null,
    longitud: coordenadas?.lng ?? null
  };

  await obtenerTareasParaUpdate(idProyecto.value);

  const toPositiveInt = (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    // Acepta "1532" y "1532.0", pero NO "1532.4".
    if (!/^\d+(?:\.0+)?$/.test(s)) return null;
    const n = Number.parseInt(s, 10);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  };
  const normalizeTextKey = (v) =>
    String(v ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  const getRowTaskId = (row) => {
    const candidates = [
      row?.id_tarea_n2,
      row?.id_tarea,
      row?.id,
      row?.idTarea,
      row?.id_tarea_original
    ];
    for (const c of candidates) {
      const n = toPositiveInt(c);
      if (n != null) return n;
    }
    return null;
  };

  // Base segura
  const baseGantt = Array.isArray(tareasGantt.value) ? tareasGantt.value : [];
  const rowsByIdRaw = new Map(
    baseGantt
      .map(r => [toPositiveInt(r?.id_tarea), r])
      .filter(([id]) => id != null)
  );

  const isRowNivel2 = (row) => {
    if (!row || typeof row !== 'object') return false;
    if (row.nivel !== undefined && row.nivel !== null) return Number(row.nivel) === 2;
    // fallback defensivo: si no viene nivel, asumimos que es actualizable
    return true;
  };

  // Index por id_tarea para acceso rápido
  const byId = new Map(
    baseGantt
      .filter(isRowNivel2)
      .map(r => [getRowTaskId(r), r])
      .filter(([id]) => id != null)
  );
  // Aquí guardamos SOLO las filas que efectivamente cambiaron
  const cambios = new Map();
  const cambiosDetalle = [];
  const unmatched = [];
  let matchedRows = 0;

  const resolveRowForTask = (task) => {
    // Match por id de task (survey)
    const idCandidates = [task?.id_tarea_n2, task?.id_tarea, task?.id];
    for (const c of idCandidates) {
      const id = toPositiveInt(c);
      if (id != null) {
        const row = byId.get(id);
        if (row) return { idTarea: id, row, via: 'id_task' };
        // Si no existe fila en cache por ese id, igual usamos el id del task y
        // construimos json_data con upsert sobre arreglo vacío.
        return { idTarea: id, row: { id_tarea: id, json_data: [] }, via: 'id_task_direct' };
      }
    }

    return { idTarea: null, row: null, via: 'sin_match' };
  };

  for (const task of (survey.value?.body_exec?.task ?? [])) {
    const resolved = resolveRowForTask(task);
    const idTarea = resolved.idTarea;
    if (!idTarea || !resolved.row) {
      if (unmatched.length < 20) {
        unmatched.push({
          motivo: 'sin_id_valido_task',
          id_tarea_n2: task?.id_tarea_n2 ?? null,
          id_tarea: task?.id_tarea ?? null,
          id: task?.id ?? null,
          partida: task?.partida ?? null,
          via: resolved.via
        });
      }
      continue;
    }

    const row = resolved.row;

    if (!isRowNivel2(row)) {
      if (unmatched.length < 20) {
        unmatched.push({
          motivo: 'id_no_es_nivel_2',
          id_tarea: idTarea,
          nivel: row?.nivel ?? null,
          partida: task?.partida ?? null
        });
      }
      continue;
    }
    matchedRows += 1;

    const [newRow, changed] = upsertDiaEnRow(row, task, fecha.value);
    if (changed) {
      const oldDia = (Array.isArray(row?.json_data) ? row.json_data : []).find(x => x && x.fecha === fecha.value) || null;
      const newDia = (Array.isArray(newRow?.json_data) ? newRow.json_data : []).find(x => x && x.fecha === fecha.value) || null;

      cambiosDetalle.push({
        id_tarea: idTarea,
        via_match: resolved.via,
        partida: task?.partida ?? row?.nombre_tarea ?? null,
        fecha: fecha.value,
        task_real_ui: task?.real ?? null,
        antes: {
          value: oldDia?.value ?? null,
          real: oldDia?.real ?? null,
          observacion: oldDia?.observacion ?? null,
          motivo_rechazo: oldDia?.motivo_rechazo ?? null,
          fotos_count: Array.isArray(oldDia?.fotos) ? oldDia.fotos.length : 0
        },
        despues: {
          value: newDia?.value ?? null,
          real: newDia?.real ?? null,
          observacion: newDia?.observacion ?? null,
          motivo_rechazo: newDia?.motivo_rechazo ?? null,
          fotos_count: Array.isArray(newDia?.fotos) ? newDia.fotos.length : 0
        }
      });

      byId.set(idTarea, newRow);
      cambios.set(idTarea, newRow);
    }
  }

  // 👇 Esto es lo que quieres: SOLO filas modificadas
  const nuevasTareasGantt = Array.from(cambios.values());

  const response = await apiAxios.put(`/survey/${id_survey}`, payloadSurvey);

  // arma un payload mínimo (solo lo necesario para actualizar)
  const payload = nuevasTareasGantt.map(r => ({
    id_tarea: r.id_tarea,
    id_survey,
    json_data: Array.isArray(r.json_data) ? r.json_data : [],
  }));

  // 👉 Si no hay filas modificadas, no llamamos al endpoint
  if (!payload.length) {
    console.log('[PPD][CAMBIOS] No hubo cambios para actualizar', {
      id_survey,
      fecha: fecha.value,
      total_tasks_survey: (survey.value?.body_exec?.task ?? []).length,
      tareas_match_gantt: matchedRows,
      tareas_actualizadas: [],
      sin_match_muestra: unmatched
    });
    return;
  }

  const tareasActualizadas = [];

  const normalizeDiaForBackend = (d) => {
    const toNumOrNull = (v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const keepValueRaw = (v) => {
      if (v === null || v === undefined || v === '') return null;
      return v;
    };
    return {
      fecha: d?.fecha ?? null,
      // value (plan) se conserva tal cual venga en json_data para no introducir
      // decimales artificiales por normalización del frontend.
      value: keepValueRaw(d?.value),
      real: toNumOrNull(d?.real),
      observacion: null,
      motivo_rechazo: null,
      fotos: []
    };
  };

  try {
    console.log('[PPD][CAMBIOS] Antes vs Después por tarea', {
      id_survey,
      fecha: fecha.value,
      total_cambios: cambiosDetalle.length,
      cambios: cambiosDetalle
    });

    for (const item of payload) {
      const idTareaNum = Number(item.id_tarea);
      const jsonDataNorm = Array.isArray(item.json_data)
        ? item.json_data.map(normalizeDiaForBackend)
        : [];

      const bodyItem = {
        id_tarea: Number.isFinite(idTareaNum) ? idTareaNum : item.id_tarea,
        id_survey,
        json_data: jsonDataNorm
      };
      // Contrato controller: array de items o item simple (NO { tarea: [...] }).
      const body = [bodyItem];

      try {
        await apiAxios.put(
          '/tareas/updTareas',
          body,
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        const msg = String(err?.response?.data?.error ?? err?.message ?? '');
        const dotSyntax = /sintaxis en o cerca de «\.»|syntax error at or near "\."/i.test(msg);

        if (dotSyntax) {
          const jsonDataInt = (Array.isArray(bodyItem.json_data) ? bodyItem.json_data : []).map(d => ({
            ...d,
            value: (d?.value == null ? null : Math.round(Number(d.value))),
            real: (d?.real == null ? null : Math.round(Number(d.real)))
          }));
          try {
            await apiAxios.put(
              '/tareas/updTareas',
              [{ id_tarea: bodyItem.id_tarea, id_survey, json_data: jsonDataInt }],
              { headers: { 'Content-Type': 'application/json' } }
            );
            tareasActualizadas.push(item.id_tarea);
            continue;
          } catch (retryErr) {
            console.error('[PPD][UPDATE] Retry con enteros falló', {
              id_survey,
              id_tarea: bodyItem.id_tarea,
              json_data_primer_dia_retry: jsonDataInt[0] ?? null,
              detalle: retryErr?.response?.data || retryErr
            });
            throw retryErr;
          }
        }

        console.error('[PPD][UPDATE] Error por item updTareas', {
          id_survey,
          id_tarea: bodyItem?.id_tarea,
          json_data_len: Array.isArray(bodyItem?.json_data) ? bodyItem.json_data.length : null,
          json_data_primer_dia: Array.isArray(bodyItem?.json_data) ? (bodyItem.json_data[0] ?? null) : null,
          detalle: err?.response?.data || err
        });
        throw err;
      }
      tareasActualizadas.push(item.id_tarea);
    }

    console.log('[PPD][RESUMEN] Tareas actualizadas correctamente', {
      id_survey,
      fecha: fecha.value,
      total_tareas: tareasActualizadas.length,
      tareas_actualizadas: tareasActualizadas
    });
  } catch (error) {
    console.error('[PPD][UPDATE] Error final updTareas', {
      id_survey,
      tareas_intentadas: payload.map(p => p.id_tarea),
      tareas_actualizadas: tareasActualizadas,
      detalle: error?.response?.data || error
    });
    console.error('Error al actualizar tareas:', error?.response?.data || error);
    throw error;
  }
    
}

function obtenerCoordenadas(survey) {
  const segmentos = getSegmentos(survey);
  for (const segmento of segmentos) {
    const attrGeo = (segmento.attributes || []).find(attr => attr.type === 'geoLocation');
    if (attrGeo && attrGeo.default && attrGeo.default.lat && attrGeo.default.lng) {
      return {
        lat: attrGeo.default.lat,
        lng: attrGeo.default.lng
      };
    }
  }
  return null; // No se encontró geoLocation
}

const getSegmentos = (survey) => {
  try {
    const body = typeof survey.body_exec === 'string'
      ? JSON.parse(survey.body_exec)
      : survey.body_exec;

    let segmentos = Array.isArray(body?.segmentos) ? body.segmentos : [];

    return segmentos;
  } catch (error) {
    return [];
  }
};

const obtenerTareasGantt = async (id_proyecto) => {
  try {
    const response = await apiAxios.get('/servicio/leanglobal/obtenerGanttsTareasV2?id_proyecto=' + id_proyecto);
    const raw = response?.data;
    const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.datos) ? raw.datos : []);
    tareasGantt.value = arr.map((r) => {
      let jsonData = r?.json_data;
      if (typeof jsonData === 'string') {
        const txt = jsonData.trim();
        if (txt && txt.toLowerCase() !== 'null') {
          try {
            jsonData = JSON.parse(txt);
          } catch {
            jsonData = [];
          }
        } else {
          jsonData = [];
        }
      }
      if (!Array.isArray(jsonData)) jsonData = [];
      return { ...r, json_data: jsonData };
    });
  } catch (err) {
    console.error(err);
  } 
}

const obtenerTareasParaUpdate = async (id_proyecto) => {
  try {
    const responseV2 = await apiAxios.get('/servicio/leanglobal/obtenerTareasDataV2?id_proyecto=' + id_proyecto);
    const rawV2 = responseV2?.data;
    const arrV2 = Array.isArray(rawV2) ? rawV2 : (Array.isArray(rawV2?.datos) ? rawV2.datos : []);
    if (arrV2.length > 0) {
      tareasGantt.value = arrV2.map((r) => {
        let jsonData = r?.json_data;
        if (typeof jsonData === 'string') {
          const txt = jsonData.trim();
          if (txt && txt.toLowerCase() !== 'null') {
            try {
              jsonData = JSON.parse(txt);
            } catch {
              jsonData = [];
            }
          } else {
            jsonData = [];
          }
        }
        if (!Array.isArray(jsonData)) jsonData = [];
        return { ...r, json_data: jsonData };
      });
      return;
    }
  } catch (e) {
    // fallback abajo
  }

  await obtenerTareasGantt(id_proyecto);
}

/**
 * ✅ Reemplaza/Inserta el día en la fila nivel 2 con id_tarea == task.id_tarea_n2.
 * Devuelve un NUEVO arreglo tareasGantt (inmutable).
 */
function upsertDiaEnTareasGantt(arr, task, fechaISO) {
  const idBuscar = Number(task.id_tarea_n2);
  const source = Array.isArray(arr) ? arr : [];

  return source.map(row => {
    if (Number(row.id_tarea) !== idBuscar) return row;

    const dia = buildDiaDeTask(task, fechaISO);
    const json = Array.isArray(row.json_data) ? [...row.json_data] : [];

    const idx = json.findIndex(x => x && x.fecha === fechaISO);
    if (idx >= 0) {
      json[idx] = dia;     // reemplaza el día
    } else {
      json.push(dia);      // inserta el día
      json.sort((a, b) => a.fecha.localeCompare(b.fecha));
    }

    return { ...row, json_data: json };
  });
}

// --- Helpers para comparar y upsert SOLO por fila ---

// normaliza número -> string (mantén null si viene null/undefined)
const toStrOrNull = v => (v === null || v === undefined ? null : String(Number(v)));

function buildDiaDeTask(task, fechaISO) {
  const fotosNormalizadas = Array.isArray(task.fotos)
    ? task.fotos
        .map(f => {
          if (!f) return null;
          if (typeof f === 'string') return f;
          if (typeof f === 'object' && typeof f.name === 'string') return f.name;
          return null;
        })
        .filter(Boolean)
    : [];

  return {
    fecha: fechaISO,
    value: toStrOrNull(task.plan),         // usa plan, pero mantén la llave "value"
    real: toStrOrNull(task.real),
    observacion: task.observaciones ?? null,
    motivo_rechazo: task.motivo ?? null,
    fotos: fotosNormalizadas
  };
}

// comparación “shallow” del objeto día (suficiente para este caso)
function sameDia(a, b) {
  if (!a || !b) return false;
  return (
    a.fecha === b.fecha &&
    a.value === b.value &&
    a.real === b.real &&
    a.observacion === b.observacion &&
    a.motivo_rechazo === b.motivo_rechazo &&
    JSON.stringify(a.fotos || []) === JSON.stringify(b.fotos || [])
  );
}

/**
 * Upsert de UN día en UNA fila nivel 2. Devuelve [newRow, changed:boolean]
 */
function upsertDiaEnRow(row, task, fechaISO) {
  if (!row) return [row, false];

  const dia = buildDiaDeTask(task, fechaISO);
  const json = Array.isArray(row.json_data) ? [...row.json_data] : [];

  const idx = json.findIndex(x => x && x.fecha === fechaISO);
  if (idx >= 0) {
    // Si el día ya existe, conservamos el plan ("value") original para
    // evitar cambios colaterales por redondeos/decimales del UI.
    const prev = json[idx] || {};
    const merged = {
      ...dia,
      value: prev?.value ?? dia.value
    };

    // si es idéntico, no cambiamos la fila
    if (sameDia(prev, merged)) {
      return [row, false];
    }
    json[idx] = merged; // reemplazo
  } else {
    json.push(dia);  // inserción
    json.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  return [{ ...row, json_data: json }, true];
}
</script>

<style scoped>
.v-main { padding-bottom: 80px !important; }
.v-card { border-width: 2px !important; border-style: solid !important; }
.v-card-item { cursor: pointer; }
.expand-icon { transition: transform 0.2s ease-in-out; }
.expanded .expand-icon { transform: rotate(180deg); }
.unit-col { text-align: center; font-size: 0.8em; color: #666; align-self: center; }
.json-preview {
  max-width: 360px;
  max-height: 96px;
  overflow: auto;
  margin: 0;
  padding: 6px 8px;
  border: 1px solid #d9dde3;
  border-radius: 8px;
  background: #f7f9fc;
  color: #2f3b4a;
  font-size: 11px;
  line-height: 1.2;
}
</style>



