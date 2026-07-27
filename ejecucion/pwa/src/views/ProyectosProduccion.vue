<template>
  <v-container>
    <v-row>
      <v-col cols="6" sm="6">
        <v-combobox v-model="filtro" :items="filtros" item-value="ID" item-title="NOMBRE" label="Filtro Estados"
          variant="outlined" class="bg-white" density="compact" return-object></v-combobox>
      </v-col>

      <v-col cols="6" sm="6">
        <v-combobox v-model="filtroDim" :items="filtroDimension" item-value="ID" item-title="NOMBRE"
          label="Filtro Dimensión" variant="outlined" class="bg-white" density="compact" return-object></v-combobox>
      </v-col>

      <v-col cols="12">
        <v-text-field density="compact" variant="outlined" v-model="filtroTexto" label="Buscar Texto" class="bg-white"
          required></v-text-field>
      </v-col>

      <v-col cols="12" v-for="proyecto in proyectos" v-bind:key="proyecto.id_proyecto">
        <v-card
          class="mx-auto sombra-resaltada"
          :title="`${proyecto.nombre_proyecto}`">
          <template #append>
            <v-icon color="red-darken-2" icon="mdi-bell-ring" size="30" />
          </template>
          <!--v-chip :color="getEstadoColor(proyecto.estado_color).color" label size="large" class="ml-2 text-white"
            variant="flat">
            {{ getEstadoColor(proyecto.estado_color).texto }}
            
          </v-chip-->
          <v-card-text class="py-6">
            <!-- Fecha centrada con icono -->
            <div class="d-flex justify-center">
              <v-text-field
                v-model="fecha"
                label="Fecha"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-calendar"  
                class="mx-auto"
                style="max-width: 260px"
              />
            </div>

            <!-- Botón centrado con icono -->
            <div class="d-flex justify-center mt-4">
              <v-btn
                color="blue"
                @click="crearSurvey(proyecto)"
                prepend-icon="mdi-playlist-edit" 
              >
                Declarar Parte Producción Diaria
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

    </v-row>
  </v-container>

  <v-dialog v-model="dialogLoading" persistent width="360">
    <v-card color="primary" dark>
      <v-card-text class="text-center">
        <div class="mb-3 font-weight-bold">Buscando Partidas y Cuadrillas del Día.</div>
        <v-progress-circular indeterminate color="white" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script setup>
import { onMounted, ref } from "vue";
//import apiAxios from '@/services/api'
import { useUserDetailStore } from "@/store/userDetail";
import { useRouter } from 'vue-router'
import apiAxios from '@/services/api'
const router = useRouter()
/* eslint-disable */
const userDetailStore = useUserDetailStore()
console.log("userDetailStore.userDetail", userDetailStore.userDetail.id_user);

const proyectos = ref(null)
const fecha = ref(null)
const today = new Date();
const fechaActual = new Date(today);
const templatesSurvey = ref([]);
const templateSeleccionado = ref(87);
const surveys = ref([]);
const tareas = ref([]);
const dialogLoading = ref(false);
let leafSinDiaLogCount = 0;
let sinEquipoLogCount = 0;

// ðŸ”¹ Convertir a YYYY-MM-DD
fecha.value = fechaActual.toISOString().split('T')[0];

onMounted(async () => {
  await obtenerTemplates(29);
  await obtenerProyectos();
});

function getEstadoColor(estado) {
  switch (estado) {
    case 'Azul':
      return { color: 'blue-darken-2', texto: 'A más de un día según plan' };
    case 'Amarillo':
      return { color: 'amber-darken-2', texto: 'Vence en un día' };
    case 'Verde':
      return { color: 'green-darken-2', texto: 'Terminado' };
    case 'Rojo':
      return { color: 'red-darken-2', texto: 'Vencido según plan' };
    default:
      return { color: 'grey', texto: 'Desconocido' };
  }
}

async function goToParte(id) {
  router.push({
    path: '/parteProduccionDiaria',
    query: { idProyecto: String(id), fecha: String(fecha.value) },
  })
}

// sort helper
const sortByText = (arr, selector) =>
  [...(arr ?? [])].sort((a, b) =>
    String(selector(a) ?? '').localeCompare(String(selector(b) ?? ''), 'es', {
      sensitivity: 'base',
      numeric: true,
    })
  );

const toDateOnly = (v) => {
  if (v == null) return '';
  const s = String(v).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  if (s.includes('T')) {
    const p = s.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  }
  return s;
};

const isPPDSurvey = (s) => Number(s?.id_template) === 87 || Number(s?.id_tipo_srv) === 29;

const obtenerTemplates = async (id_tipo_srv) => {
  try {
    const { data } = await apiAxios.get(`/servicio/leanglobal/obtenerTemplates?id_tipo_srv=${id_tipo_srv}`);
    templatesSurvey.value = sortByText(data, x => x.name_template_srv);
  } catch (err) {
    console.error('Error al obtener templates:', err);
  }
};

const obtenerProyectos = async () => {
  try {
    const { data } = await apiAxios.get(`/servicio/leanglobal/obtenerProyectos`);
    proyectos.value = data;
    proyectos.value = proyectos.value.filter(p => p.id_proyecto == 1);  
    console.log("Proyectos obtenidos:", proyectos.value);
  } catch (err) {
    console.error('Error al obtener templates:', err);
  }
};

const procesosSurveyV3 = async () => {
  try {
    const { data } = await apiAxios.get(`/servicio/leanglobal/procesosSurveyV3`);
    surveys.value = data.datos;
    console.log("Surveys obtenidos:", surveys.value);
  } catch (err) {
    console.error('Error al obtener templates:', err);
  }
};

const obtenerTareas = async (id_proyecto) => {
  try {
    const { data } = await apiAxios.get(`/servicio/leanglobal/obtenerTareasDataV2?id_proyecto=${id_proyecto}`);
    tareas.value = data;
    console.log("Tareas obtenidas del proyecto:", tareas.value);
  } catch (err) {
    console.error('Error al obtener tareas del proyecto:', err);
    
  }
};

// utils
const toISO = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') {
    const s = v.trim();
    // YYYY-MM-DD o YYYY-MM-DD HH:mm:ss o YYYY-MM-DDTHH:mm:ss...
    const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];
    // DD/MM/YYYY
    const dmyMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;

    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return '';
  }
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return '';
};
const num = v => (v == null ? 0 : Number(v));

// Saca id_equipo_proyecto desde json_data de una cuadrilla (nivel 1)
function parseJsonData(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t || t.toLowerCase() === 'null') return null;
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }
  return raw;
}

function getEquipoFromJsonData(row) {
  const keyCandidates = [
    'id_equipo_proyecto',
    'id_equipos_proyecto',
    'id_equipos_proyectos',
    'idEquipoProyecto',
    'idEquipoProyectos',
    'id_equipo',
    'id_equipos',
    'idEquipo',
    'equipo_proyecto_id',
    'equipoId',
    'equipo_id',
    'id_eq_proyecto'
  ];

  const pickFromObject = (obj) => {
    if (!obj || typeof obj !== 'object') return null;

    for (const k of keyCandidates) {
      if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
        return String(obj[k]);
      }
    }

    // Búsqueda recursiva defensiva para estructuras anidadas
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) {
        for (const item of val) {
          const found = pickFromObject(item);
          if (found) return found;
        }
      } else if (val && typeof val === 'object') {
        const found = pickFromObject(val);
        if (found) return found;
      }
    }

    return null;
  };

  // 1) Campos directos en la fila (si vienen desde backend)
  const direct = pickFromObject(row);
  if (direct) return direct;

  // 2) json_data parseado
  const jd = parseJsonData(row?.json_data);
  if (Array.isArray(jd)) {
    for (const item of jd) {
      const found = pickFromObject(item);
      if (found) return found;
    }
  } else if (jd && typeof jd === 'object') {
    const found = pickFromObject(jd);
    if (found) return found;
  }

  return null;
}

function hasJsonData(row) {
  return parseJsonData(row?.json_data) !== null;
}

function getDiaFromLeaf(row, hoyISO) {
  const jd = parseJsonData(row?.json_data);

  if (Array.isArray(jd)) {
    const day = jd.find(x => x && toISO(x.fecha) === hoyISO);
    if (!day) {
      if (leafSinDiaLogCount < 20) {
        console.log('[PPD] Leaf sin dia para fecha', {
          id_tarea: row?.id_tarea,
          nombre_tarea: row?.nombre_tarea,
          hoyISO
        });
      }
      leafSinDiaLogCount += 1;
      return null;
    }
    return {
      value: day?.value,
      real: day?.real
    };
  }

  if (jd && typeof jd === 'object') {
    if (!jd.fecha || toISO(jd.fecha) === hoyISO) {
      return {
        value: jd?.value,
        real: jd?.real
      };
    }
    return null;
  }

  if (row?.fecha && toISO(row.fecha) === hoyISO) {
    return {
      value: row?.value,
      real: row?.real
    };
  }

  return null;
}

function getClosestParent(row, byId) {
  if (!row?.id_tarea_padre) return null;
  return byId.get(String(row.id_tarea_padre)) || null;
}

function getEquipoFromAncestors(row, byId) {
  let current = row || null;
  const visited = new Set();
  const trace = [];

  while (current?.id_tarea != null) {
    const key = String(current.id_tarea);
    if (visited.has(key)) break;
    visited.add(key);
    trace.push({
      id_tarea: current?.id_tarea,
      id_tarea_padre: current?.id_tarea_padre,
      nombre_tarea: current?.nombre_tarea,
      nivel: current?.nivel
    });

    const equipoId = getEquipoFromJsonData(current);
    if (equipoId) {
      console.log('[PPD] Equipo encontrado en ancestros', {
        equipoId,
        trace
      });
      return equipoId;
    }

    if (!current.id_tarea_padre) break;
    current = byId.get(String(current.id_tarea_padre)) || null;
  }

  if (sinEquipoLogCount < 20) {
    console.warn('[PPD] No se encontró equipo en ancestros', { trace });
  }
  sinEquipoLogCount += 1;
  return null;
}

async function construirTasksHoyAsync(data, hoyISO, idProyecto) {
  leafSinDiaLogCount = 0;
  sinEquipoLogCount = 0;
  const rows = data || [];
  const byId = new Map(rows.map(r => [String(r.id_tarea), r]));
  const leaves = rows.filter(hasJsonData);
  let leavesConDia = 0;
  console.log('[PPD] Totales obtenerTareasDataV2', {
    rows: rows.length,
    leaves: leaves.length,
    hoyISO
  });

  const agg = new Map();
  for (const r of leaves) {
    const dia = getDiaFromLeaf(r, hoyISO);
    if (!dia) continue;
    leavesConDia += 1;

    const parent = getClosestParent(r, byId);
    const k = String(r.id_tarea);

    if (!agg.has(k)) {
      agg.set(k, {
        id_tarea: r.id_tarea,
        id_tarea_padre: r.id_tarea_padre,
        nombre_tarea: r.nombre_tarea,
        unidad: r.unidad,
        plan: num(dia?.value),
        real: dia?.real == null ? null : num(dia?.real),
        nombre_padre_inmediato: parent?.nombre_tarea || 'Sin Cuadrilla'
      });
    } else {
      const acc = agg.get(k);
      // Evita inflar plan por duplicados de la misma tarea en el origen.
      acc.plan = Math.max(num(acc.plan), num(dia?.value));
      // Conserva un real existente; si estaba null, toma el valor del duplicado.
      if (acc.real == null && dia?.real != null) {
        acc.real = num(dia.real);
      }
    }
  }

  console.log('[PPD] Leaves con dia para fecha', {
    leavesConDia,
    tareasUnicas: agg.size,
    idsMuestra: Array.from(agg.keys()).slice(0, 20)
  });

  const tasks = Array.from(agg.values()).map(r => ({
    id: r.id_tarea,
    // Se mantiene el nombre por compatibilidad hacia el flujo actual
    id_tarea_n2: r.id_tarea,
    id_tarea_padre_n1: r.id_tarea_padre,
    cuadrilla: r.nombre_padre_inmediato,
    familia: null,
    partida: r.nombre_tarea,
    unidad: r.unidad,
    plan: num(r.plan),
    real: r.real == null ? null : num(r.real),
    motivo: null,
    observaciones: null,
    fotos: [],
    anticipada: false,
    assigned_personnel: []
  }));

  const miembrosCache = new Map();
  let tareasConEquipo = 0;
  let tareasConPersonal = 0;
  let fallbackCargado = false;
  let fallbackMiembrosPorEquipo = new Map();
  let fallbackMiembrosProyecto = [];
  let fallbackEquipos = [];

  const normalizeText = (v) =>
    String(v ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  const cargarFallbackProyecto = async () => {
    if (fallbackCargado) return;
    fallbackCargado = true;

    fallbackEquipos = await obtenerEquiposProyectos(idProyecto);
    console.log('[PPD][FALLBACK] Equipos del proyecto', {
      idProyecto,
      totalEquipos: fallbackEquipos.length,
      equipos: fallbackEquipos.map(e => ({
        id_equipo_proyecto: e.id_equipo_proyecto,
        nombre_equipo: e.nombre_equipo
      }))
    });

    const union = new Map();
    for (const eq of fallbackEquipos) {
      const eqId = Number(eq?.id_equipo_proyecto);
      if (!Number.isFinite(eqId) || eqId <= 0) continue;
      const miembros = await obtenerEquiposProyectosMiembros(eqId);
      fallbackMiembrosPorEquipo.set(String(eqId), miembros || []);
      for (const m of (miembros || [])) {
        union.set(String(m.id), m);
      }
    }
    fallbackMiembrosProyecto = Array.from(union.values());
    console.log('[PPD][FALLBACK] Miembros consolidados del proyecto', {
      idProyecto,
      totalMiembros: fallbackMiembrosProyecto.length,
      miembros: fallbackMiembrosProyecto.map(m => ({ id: m.id, nombre: m.nombre }))
    });
  };

  for (const task of tasks) {
    const leafRow = byId.get(String(task.id));
    let equipoId = getEquipoFromAncestors(leafRow, byId);

    if (!equipoId) {
      await cargarFallbackProyecto();
      const nomCuadrilla = normalizeText(task.cuadrilla);
      const equipoMatch = fallbackEquipos.find((e) => {
        const nomEquipo = normalizeText(e?.nombre_equipo);
        return nomCuadrilla && nomEquipo && (nomCuadrilla.includes(nomEquipo) || nomEquipo.includes(nomCuadrilla));
      });

      if (equipoMatch?.id_equipo_proyecto) {
        equipoId = String(equipoMatch.id_equipo_proyecto);
        console.log('[PPD][FALLBACK] Equipo resuelto por nombre', {
          id_tarea: task.id,
          partida: task.partida,
          cuadrilla: task.cuadrilla,
          equipoId,
          nombre_equipo: equipoMatch.nombre_equipo
        });
      } else {
        console.warn('[PPD][FALLBACK] Sin equipo específico, se usará pool de miembros del proyecto', {
          id_tarea: task.id,
          partida: task.partida,
          cuadrilla: task.cuadrilla,
          totalPool: fallbackMiembrosProyecto.length
        });

        const ya = new Set(task.assigned_personnel.map(p => String(p.personId)));
        for (const m of fallbackMiembrosProyecto) {
          const pid = String(m.id);
          if (!ya.has(pid)) {
            task.assigned_personnel.push({
              personId: m.id,
              nombre: m.nombre,
              horas: m.horas ?? null
            });
            ya.add(pid);
          }
        }

        if (task.assigned_personnel.length > 0) tareasConPersonal += 1;
        continue;
      }
    }
    tareasConEquipo += 1;

    console.log('[PPD] Tarea con equipo', {
      id_tarea: task.id,
      partida: task.partida,
      equipoId
    });

    let miembros = miembrosCache.get(equipoId);
    console.log('[PPD][CACHE] lookup miembros', {
      equipoId,
      cacheHit: !!miembros,
      cacheSize: miembrosCache.size
    });

    if (!miembros) {
      console.log('[PPD][CACHE] miss -> consultando API', { equipoId });
      miembros = await obtenerEquiposProyectosMiembros(equipoId);
      miembrosCache.set(equipoId, miembros || []);
      console.log('[PPD][CACHE] guardado en cache', {
        equipoId,
        totalMiembros: (miembros || []).length,
        miembros: (miembros || []).map(m => ({ id: m.id, nombre: m.nombre }))
      });
    } else {
      console.log('[PPD][CACHE] hit -> usando cache', {
        equipoId,
        totalMiembros: (miembros || []).length,
        miembros: (miembros || []).map(m => ({ id: m.id, nombre: m.nombre }))
      });
    }

    const ya = new Set(task.assigned_personnel.map(p => String(p.personId)));
    for (const m of (miembros || [])) {
      const pid = String(m.id);
      if (!ya.has(pid)) {
        task.assigned_personnel.push({
          personId: m.id,
          nombre: m.nombre,
          horas: m.horas ?? null
        });
        ya.add(pid);
      }
    }

    console.log('[PPD] Personas asignadas a tarea', {
      id_tarea: task.id,
      total: task.assigned_personnel.length,
      nombres: task.assigned_personnel.map(p => p.nombre)
    });
    if (task.assigned_personnel.length > 0) tareasConPersonal += 1;
  }

  console.log('[PPD] Resumen asignación personal', {
    totalTareas: tasks.length,
    tareasConEquipo,
    tareasConPersonal,
    tareasSinEquipo: tasks.length - tareasConEquipo
  });

  return tasks;
}

async function obtenerEquiposProyectosMiembros(idEquipoProyecto) {
  console.log('[PPD] Entrando obtenerEquiposProyectosMiembros', { idEquipoProyecto });
  const id = Number(idEquipoProyecto);
  if (!Number.isFinite(id) || id <= 0) {
    console.warn('[PPD] id_equipo_proyecto inválido', { idEquipoProyecto, id });
    return [];
  }

  const url = `/servicio/leanglobal/obtenerEquiposProyectosMiembros?id_equipo_proyecto=${id}`;
  try {
    console.log('[PPD] GET miembros URL', url);
    const { data } = await apiAxios.get(url);
    console.log('[PPD] Respuesta cruda miembros', data);

    // Mapea a un formato uniforme (opcional pero recomendado)
    const mapped = (Array.isArray(data) ? data : []).map(m => ({
      id:      m.id_miembro ?? m.id_usuario ?? m.id_user ?? m.id ?? m.user_id ?? null,
      nombre:  (m.nombre_user ?? m.nombre ?? [m.nombres, m.apellidos].filter(Boolean).join(' ')) || 'Sin nombre',
      horas:   null
    })).filter(p => p.id != null);

    console.log('[PPD] Miembros mapeados', mapped);
    //equiposProyectosMiembros.value = mapped; // si querÃ­s guardarlo igual
    return mapped;                            // â† IMPORTANTE
  } catch (err) {
    console.error('âŒ obtenerEquiposProyectosMiembros', err);
    //equiposProyectosMiembros.value = [];
    return [];                                // â† IMPORTANTE
  }
}

async function obtenerEquiposProyectos(idProyecto) {
  const id = Number(idProyecto);
  if (!Number.isFinite(id) || id <= 0) {
    console.warn('[PPD] id_proyecto inválido para obtenerEquiposProyectos', { idProyecto });
    return [];
  }

  const url = `/servicio/leanglobal/obtenerEquiposProyectos?id_proyecto=${id}`;
  try {
    console.log('[PPD] GET equipos proyecto URL', url);
    const { data } = await apiAxios.get(url);
    const arr = Array.isArray(data) ? data : [];
    return arr;
  } catch (error) {
    console.error('[PPD] Error obtenerEquiposProyectos:', error);
    return [];
  }
}

async function completarPersonalEnSurveyExistente(idSurvey, tasksDeHoy) {
  try {
    const { data } = await apiAxios.get(`/servicio/leanglobal/procesosSurveyDetail?id_survey=${idSurvey}`);
    const surveyDetail = data?.[0] || null;
    if (!surveyDetail) return;

    let bodyExec = surveyDetail.body_exec;
    if (typeof bodyExec === 'string') {
      const txt = bodyExec.trim();
      bodyExec = txt ? JSON.parse(txt) : {};
    }
    if (!bodyExec || typeof bodyExec !== 'object') bodyExec = {};
    const tasksExistentes = Array.isArray(bodyExec.task) ? bodyExec.task : [];
    if (!tasksExistentes.length) return;

    const mapHoy = new Map();
    const normalize = (v) => String(v ?? '').trim().toLowerCase();
    for (const t of (tasksDeHoy || [])) {
      const k1 = String(t?.id ?? '');
      const k2 = String(t?.id_tarea_n2 ?? '');
      if (k1) mapHoy.set(k1, t);
      if (k2) mapHoy.set(k2, t);
      const kp = normalize(t?.partida);
      if (kp) mapHoy.set(`partida:${kp}`, t);
    }

    let cambios = 0;
    const nextTasks = tasksExistentes.map((task) => {
      const currentPersonnel = Array.isArray(task?.assigned_personnel) ? task.assigned_personnel : [];
      if (currentPersonnel.length > 0) return task;

      const match =
        mapHoy.get(String(task?.id ?? '')) ||
        mapHoy.get(String(task?.id_tarea_n2 ?? '')) ||
        mapHoy.get(`partida:${normalize(task?.partida)}`);
      const nuevos = Array.isArray(match?.assigned_personnel) ? match.assigned_personnel : [];
      if (!nuevos.length) return task;

      cambios += 1;
      return {
        ...task,
        assigned_personnel: nuevos
      };
    });

    if (cambios === 0) {
      console.log('[PPD] Survey existente sin cambios de personal');
      return;
    }

    const payload = {
      estado_srv: surveyDetail.estado_srv || 'Pre Creado',
      body_exec: JSON.stringify({ ...bodyExec, task: nextTasks }),
      fecha_real_ini: surveyDetail.fecha_real_ini || null,
      fecha_ejec_fin: surveyDetail.fecha_ejec_fin || null,
      latitud: surveyDetail.latitud ?? null,
      longitud: surveyDetail.longitud ?? null
    };

    await apiAxios.put(`/survey/${idSurvey}`, payload);
    console.log('[PPD] Personal completado en survey existente', {
      idSurvey,
      tareasActualizadas: cambios
    });
  } catch (error) {
    console.error('[PPD] Error completando personal en survey existente:', error);
  }
}

const crearSurvey = async (proyecto) => {
  dialogLoading.value = true;
  try {
    await procesosSurveyV3();
    await obtenerTareas(proyecto.id_proyecto);

    const tasksDeHoy = await construirTasksHoyAsync(tareas.value, fecha.value, proyecto.id_proyecto);
    console.log('tasksDeHoy:', tasksDeHoy);
  //console.log("Creando survey para el proyecto:", proyecto.id_proyecto);
  //console.log("Fecha seleccionada:", fecha.value);
  //console.log("User ID:", userDetailStore.userDetail?.id_user);
    let id_survey = null;
    const survey =
    (surveys.value ?? [])
      .filter(s =>
        isPPDSurvey(s) &&
        s.id_proyecto == proyecto.id_proyecto &&
        toDateOnly(s.fecha_plan_ini) === toDateOnly(fecha.value) &&
        s.id_survey != null
      )
      .sort((a, b) => Number(b.id_survey) - Number(a.id_survey))[0] ?? null;

  //console.log("Survey encontrado:", survey);
  /*if (survey) {
    console.log("Survey ya existe para este proyecto, fecha y user:", survey);
    alert("Ya existe un parte de producciÃ³n diaria para este proyecto en la fecha seleccionada con el user.");
    return;
  }
  else {*/
    if (!survey) {
      if (!userDetailStore.userDetail?.id_user) {
        console.error("El ID de usuario no está disponible.");
        return;
      }

      console.log("userDetailStore.userDetail?.id_user", userDetailStore.userDetail?.id_user);

    const header_seed   = templatesSurvey.value.find(t => t.id_template === templateSeleccionado.value)?.header_seed || {};
    const body_seed     = templatesSurvey.value.find(t => t.id_template === templateSeleccionado.value)?.body_seed || [];
    const approval_seed = templatesSurvey.value.find(t => t.id_template === templateSeleccionado.value)?.approval_seed || {};
    const id_flow_tmpl  = templatesSurvey.value.find(t => t.id_template === templateSeleccionado.value)?.id_flow_tmpl || null;

    console.log("Template seleccionado para el survey:", {
      id_template: templateSeleccionado.value,
      header_seed,
      body_seed,
      approval_seed,
      id_flow_tmpl
    });

      const data = {
        id_tipo_srv: 29,
        id_template: 87,
        id_user: userDetailStore.userDetail.id_user,
        id_user_creacion: userDetailStore.userDetail.id_user,
        id_empresa_cliente: proyecto.id_empresa_cliente,
        estado_srv: 'Pre Creado',
        header_seed: JSON.stringify(header_seed),
        body_seed: JSON.stringify(body_seed),
        approval_seed: JSON.stringify(approval_seed),
        header_exec: JSON.stringify(header_seed),
        body_exec: JSON.stringify({ task: tasksDeHoy }),
        approval_exec: JSON.stringify(approval_seed),
        fecha_plan_ini: fecha.value,
        fecha_plan_fin: fecha.value,
        fecha_real_ini: null,
        fecha_real_fin: null,
        fecha_upload: null,
        latitud: null,
        longitud: null,
        id_proyecto: proyecto.id_proyecto,
        id_flow_tmpl
      };

      console.log("Data para crear survey:", data);
    
      try {
        const resp = await apiAxios.post('/survey/', data);
        console.log('Survey creado con éxito:', resp.data);
        id_survey = resp.data.idSurvey;
        console.log("ID del survey creado:", id_survey);
      } catch (error) {
        console.error('Error al crear el survey:', error);
      }
    } else {
      await completarPersonalEnSurveyExistente(survey.id_survey, tasksDeHoy);
    }

    const finalSurveyId = id_survey || survey?.id_survey;
    if (!finalSurveyId) {
      console.error('No se pudo resolver idSurvey para PPD', {
        id_survey,
        survey
      });
      alert('No se pudo abrir el Parte de Producción Diaria. Intenta nuevamente.');
      return;
    }
    console.log('Survey destino PPD:', {
      idSurvey: finalSurveyId,
      existente: !!survey,
      fecha: fecha.value,
      proyecto: proyecto.id_proyecto
    });

    await router.push({
      path: '/parteProduccionDiaria',
      query: {
        idSurvey: String(finalSurveyId),
        idProyecto: String(proyecto.id_proyecto),
        fecha: String(fecha.value)
      },
    })
  } finally {
    dialogLoading.value = false;
  }
};
</script>
<style scoped></style>
