<template>
  <v-container style="padding-bottom: 80px;">
    <v-row dense>
      <v-col cols="12" v-for="survey in surveyDetailStore.surveyDetail" :key="survey.id_survey" style="padding: 0 !important;">
        <!-- Panel principal del documento -->
        <v-expansion-panels multiple>
          <v-expansion-panel class="sombra-resaltada">
            <v-expansion-panel-title>
              <div class="d-flex align-center justify-space-between w-100">
                <div>
                  <div class="text-subtitle-1 font-weight-bold">
                   {{ survey.desc_template_srv }}
                  </div>
                </div>
                <v-icon :color="getEstadoColor(survey.estado_srv)" icon="mdi-circle" />
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <!-- Info general del survey -->
              <v-row>
                <v-col cols="12" class="pl-5">
                  <strong>Área:</strong> {{ survey.name_area }}<br />
                  <strong>Familia:</strong> {{ survey.name_tipo_srv }} ({{ survey.codi_tipo_srv }})<br />
                  <strong>{{ survey.desc_template_srv }}:</strong> {{ survey.codi_template_srv }}<br />
                  <strong>Id Documento:</strong> {{ survey.id_survey }}<br />
                  <strong>{{ survey.name_empresa_cliente }}</strong> / {{ survey.nombre_proyecto }}<br />
                  <strong>Fechas Plan:</strong> {{ survey.fecha_plan_ini }} - {{ survey.fecha_plan_fin }}<br />
                  <strong>Fechas Real:</strong> {{ survey.fecha_real_ini ?? '---' }} - {{ survey.fecha_real_fin ?? '---'
                  }}
                </v-col>
              </v-row>

              <!-- Paneles por segmento -->

            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <br>
        <v-expansion-panels multiple>
          <v-expansion-panel v-for="(segmento, index) in getSegmentos(survey)" :key="segmento.posicion ?? index"
            class="mb-5">
            <v-expansion-panel-title class="bg-blue-grey-lighten-4 font-weight-bold" style="font-size: 16px;">
              <template v-if="segmento.touch">
                <!-- Cuando touch es TRUE -->
                <v-icon color="green darken-2" icon="mdi-check-circle" class="mr-2" />
              </template>
              <template v-if="segmento.touch == false">
                <!-- Cuando touch es FALSE -->
                <v-icon color="amber darken-2" icon="mdi-alert-circle-outline" class="mr-2" />
              </template>
              {{ segmento.label || `Segmento ${index + 1}` }}
            </v-expansion-panel-title>

            <v-expansion-panel-text class="bg-blue-grey-lighten-4">
              <v-row class="py-5">
                <v-col v-for="(attr, i) in getVisibleAttributes(segmento.attributes)" :key="i" cols="12">
                  
                  <div v-if="attr.type === 'textField'">
                    <v-text-field 
                      variant="outlined" 
                      v-model="attr.default" 
                      :label="attr.label" 
                      dense 
                      hide-details 
                      density="compact"
                      :class="attr.nullable === false && !attr.default ? 'text-custom-red' : ''"
                      @update:model-value="(val) => {
                        attr.default = val;
                        segmentosCompletos(); // tu función
                      }"
                      />
                  </div>

                  <div v-else-if="attr.type === 'signature'">
                    <SignatureField 
                      v-model="attr.default"
                      :label="attr.label"
                      @update:model-value="(val) => {
                        attr.default = val;
                        segmentosCompletos();
                      }"
                    />
                  </div>

                  <div v-else-if="attr.type === 'datePicker'">
                    <v-text-field 
                      variant="outlined" 
                      v-model="attr.default" 
                      :label="attr.label" 
                      type="date" 
                      dense 
                      hide-details 
                      density="compact"
                      :class="attr.nullable === false && !attr.default ? 'text-red' : ''" 
                      @update:model-value="(val) => {
                        attr.default = val;
                        segmentosCompletos(); // tu función
                      }"
                      />
                  </div>

                  <div v-else-if="attr.type === 'dateHourPicker'">
                    <v-text-field 
                      variant="outlined" 
                      v-model="attr.default" 
                      :label="attr.label" 
                      type="datetime-local" 
                      dense 
                      density="compact"
                      hide-details
                      :class="attr.nullable === false && attr.default == 'sysdatehhmm' ? 'text-red' : ''" 
                      @update:model-value="(val) => {
                        attr.default = val;
                        segmentosCompletos(); // tu función
                      }"
                      />
                  </div>

                  <div v-else-if="attr.type === 'checkList'">
                    <v-row>
                      <v-col v-for="(item) in attr.checkBoby" :key="item.id" cols="12">
                        <div style="display: flex; gap: 1rem;">
                          <div style="flex: 1;" class="font-weight-medium mb-1">
                            {{ item.label }}
                          </div>
                          <div style="flex: 2;">
                            <v-btn-toggle
                              v-model="item.default"
                              mandatory
                              density="compact"
                              class="mb-2"
                              @update:model-value="(val) => {
                                attr.default = val;
                                segmentosCompletos(); // tu función
                              }"
                            >
                              <v-btn
                                v-for="option in item.options"
                                :key="option.id || option.value"
                                :value="option.id || option.value"
                                size="small"
                                
                                class="me-2"
                              >
                                {{ option.label || option.value }}
                              </v-btn>
                            </v-btn-toggle>
                          </div>
                        </div>
                        <v-textarea v-if="item.obs !== undefined"
                          variant="outlined" 
                          v-model="item.obs" 
                          label="Observaciones" 
                          rows="2" 
                          auto-grow 
                          hide-details 
                          class="bg-white" />
                      </v-col>
                    </v-row>
                  </div>

                  <div v-else-if="attr.type === 'comboBox'">
                    <v-row>
                      <v-col v-if="attr.values" :key="attr.values.id" cols="12">
                        <div style="display: flex; gap: 1rem;">
                          <div style="flex: 1;" class="font-weight-medium mb-1">{{ attr.values.quest || 'Seleccione una opción' }}</div>

                          <v-select style="flex: 2;" density="compact" variant="outlined" v-model="attr.values.selected" :items="getSelectItems(attr.values.options, attr, survey)"
                            item-title="label" item-value="value" dense hide-details label="Selecciona una opción" class="bg-white"
                            @update:model-value="(val) => {
                              attr.default = val;
                              segmentosCompletos(); // tu función
                            }"
                          >
                            <template #selection="{ item }">
                              <span :class="['estado-select-label', getEstadoOptionClass(getEstadoItemValue(item))]">
                                {{ getEstadoItemLabel(item) }}
                              </span>
                            </template>
                            <template #item="{ props, item }">
                              <v-list-item
                                v-bind="props"
                                :class="getEstadoOptionClass(getEstadoItemValue(item))"
                              />
                            </template>
                          </v-select>
                        </div>
                      </v-col>
                    </v-row>
                  </div>

                  <div v-else-if="attr.type === 'photoCapture'">
                    <v-row>
                      <v-col class="pb-12">
                        <div>
                          <FotoCapture
                            :label="attr.label"
                            :max-fotos="attr.maxFotos"
                            :obligatorio-fotos="attr.obligatorioFotos"
                            :compression="attr.compression"
                            v-model:galeria="attr.galeria"
                            v-model:observacion="attr.obs"
                            @update:galeria="() => segmentosCompletos()"
                          />
                        </div>
                      </v-col>
                    </v-row>
                  </div>

                  <div v-else-if="attr.type === 'geoLocation'">
                    <v-row>
                      <v-col class="pb-12">
                        <div>
                          <GeoLocation
                            :label="attr.label"
                            :modelValue="attr.default"
                            @update:modelValue="(value) => attr.default = value"
                          />
                        </div>
                      </v-col>
                    </v-row>
                  </div>

                  <div v-else-if="attr.type === 'textArea'" style="padding-top: 5px;">
                    <v-textarea 
                      variant="outlined" 
                      v-model="attr.default" 
                      :label="attr.label" 
                      dense 
                      hide-details 
                      class="bg-white" 
                      @update:model-value="(val) => {
                        attr.default = val;
                        segmentosCompletos(); // tu función
                      }"
                    />
                  </div>

                  <div v-else-if="attr.type === 'photo'" class="pb-5">
                    <div class="font-weight-medium mb-1">{{ attr.label || 'Picture' }}</div>
                    <v-img
                      width="100%"
                      aspect-ratio="16/9"
                      cover
                      :src="attr.src"
                    ></v-img>
                  </div>

                  <div v-else-if="attr.type === 'fileUpload'">
                    <v-row>
                      <v-col class="pb-12">
                        <div>
                          <FileUpload
                            :max-fotos="attr.maxArchivos"                            
                            v-model:archivos="attr.archivos"
                            v-model:observacion="attr.obs"
                            @update:archivos="() => segmentosCompletos()"
                          />
                        </div>
                      </v-col>
                    </v-row>
                  </div>

                  <div v-else-if="attr.type === 'newLine'" style="padding-top: 5px;">
                    <hr />
                  </div>

                  <div v-else-if="attr.type === 'labelLine'" style="padding-top: 5px;">
                    <span>{{ attr.text }}</span>
                  </div>

                  <div v-else-if="attr.type === 'labelLineH1'" style="padding-top: 5px;">
                    <h1>{{ attr.text }}</h1>
                  </div>

                  <div v-else-if="attr.type === 'labelLineH2'" style="padding-top: 5px;">
                    <h2>{{ attr.text }}</h2>
                  </div>

                  <div v-else-if="attr.type === 'labelLineH3'" style="padding-top: 5px;">
                    <h3>{{ attr.text }}</h3>
                  </div>

                  <div v-else-if="attr.type === 'labelLineH4'" style="padding-top: 5px;">
                    <h4>{{ attr.text }}</h4>
                  </div>

                  <div v-else-if="attr.type === 'labelLineH5'" style="padding-top: 5px;">
                    <h5>{{ attr.text }}</h5>
                  </div>

                  <div v-else-if="attr.type === 'photoCheck'" style="padding-top: 5px;">
                    <FotoCeck
                      v-if="attr.type === 'photoCheck'"
                      :label="attr.label"
                      v-model="attr.default"
                      :galeria="attr.galeria"
                      :observacion="attr.obs"
                      :options="attr.options"
                      :compression="attr.compression || 10"
                      @update:galeria="val => attr.galeria = val"
                      @update:observacion="val => attr.obs = val"
                    />
                  </div>

                  <div v-else>
                    <em>Tipo {{ attr.type }} no implementado</em>
                  </div>
                </v-col>
              </v-row>

            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-btn
          color="primary"
          style="box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);"
          size="large"
          @click="guardarSurvey">
            <v-icon left>mdi-content-save</v-icon>

          Guardar Survey
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted } from 'vue';
import apiAxios from '@/services/api'
import SignatureField from '@/components/SignatureField.vue'
import FotoCapture from '@/components/FotoCapture.vue'
import FotoCeck from '@/components/FotoCheck.vue'
import GeoLocation from "@/components/GeoLocation.vue";
import FileUpload from "@/components/FileUpload.vue";
import { usePersistenciaStore } from '@/store/persistencia'
import { useSurveyDetailStore } from "@/store/surveyDetail";
/* eslint-disable */

const persistencia = usePersistenciaStore()
const surveyDetailStore = useSurveyDetailStore()

// Puedes leer el valor
console.log(persistencia.id)
const router = useRouter();
const route = useRoute();
const idSurvey = ref(null);
const show = ref(false);
const errores = ref({});

idSurvey.value = route.query.idInspeccion;

console.log(idSurvey.value);

const surveys = ref(null);

onMounted(() => {
  getSurvey();
});

async function getSurvey() {
  try {
    const response = await apiAxios.get("/servicio/leanglobal/procesosSurveyDetail?id_survey=" + idSurvey.value);
    console.log(response.data);
    surveys.value = response.data;
    surveyDetailStore.surveyDetail = response.data;
    console.log("surveyDetail", surveyDetailStore.surveyDetail);


  } catch (error) {
    console.error("Error al obtener survey:", error);
    throw error;
  }
}

function getEstadoColor(estado) {
  const colorConexion = getEstadoConexionColor(estado);
  if (colorConexion) return colorConexion;

  switch (estado) {
    case 'Creado':
      return 'yellow darken-2'; // Amarillo
    case 'Terminado':
      return 'green darken-2'; // Verde
    case 'Retrasado':
      return 'red darken-2'; // Verde
    default:
      return 'grey';
  }
}

const getSegmentos = (survey) => {
  try {
    const body = typeof survey.body_exec === 'string'
      ? JSON.parse(survey.body_exec)
      : survey.body_exec;

    let segmentos = Array.isArray(body?.segmentos) ? body.segmentos : [];

    if (!segmentos.some(s => s.label === 'Bloque 6')) {
      segmentos.push({
        posicion: 6,
        label: "Bloque 6",
        collapsible: false,
        touch: false,
        cantidad: 3,
        attributes: [
          {
            text: "Texto de prueba",
            type: "labelLine",
            nullable: true,
          },
          {
            text: "Texto de prueba H1",
            type: "labelLineH1",
            nullable: true,
          },
          {
            text: "Texto de prueba H2",
            type: "labelLineH2",
            nullable: true,
          },
          {
            text: "Texto de prueba H3",
            type: "labelLineH3",
            nullable: true,
          },
          {
            text: "Texto de prueba H4",
            type: "labelLineH4",
            nullable: true,
          },
          {
            text: "Texto de prueba H5",
            type: "labelLineH5",
            nullable: true,
          }
        ]
      });
    }

    if (!segmentos.some(s => s.label === 'Bloque 7')) {
      segmentos.push({
        posicion: 7,
        label: "Bloque 7",
        collapsible: false,
        touch: false,
        cantidad: 3,
        attributes: [{
          type: 'photoCheck',
          posicion: 1,
          label: 'Uso excavadora nivelación camino',            
          default: '',
          options: [
            { id: 'si', label: 'Sí' },
            { id: 'no', label: 'No' },
            { id: 'n/a', label: 'N/A' },
          ],
          nullable: false,
          galeria: [],
          compression: 10,
          obs: ''
        },
        {
          type: 'photoCheck',
          posicion: 1,
          label: 'Uso excavadora nivelación camino',            
          default: '',
          options: [
            { id: 'si', label: 'Sí' },
            { id: 'no', label: 'No' },
            { id: 'n/a', label: 'N/A' },
          ],
          nullable: false,
          galeria: [],
          compression: 10,
        },
        {
          type: 'photoCheck',
          posicion: 1,
          label: 'Uso excavadora nivelación camino',            
          default: '',
          options: [
            { id: 'si', label: 'Sí' },
            { id: 'no', label: 'No' },
            { id: 'n/a', label: 'N/A' },
          ],
          nullable: false,
        },
        ]
      });
    }

    console.log(segmentos);

    return segmentos;
  } catch (error) {
    console.log(error);
    return [];
  }
};

const CONEXION_ESTADOS_LG = [
  'Conexión',
  'Trabajo Especial',
  'Ejecución',
  'Reactivación',
  'Prodoral',
  'En Continuación',
  'No se ejecuta',
  'Levantamiento Reclamo',
  'Ejecutado',
  'Plan CIIGE',
  'PD Terminado',
  'CCT',
  'Rechazos Serviu',
  'PD En continuación',
  'Contingencia',
  'Retiro de Empalme Existente',
  'Gasificación',
  'Evaluación Técnica',
  'Solo Empalme Existente',
  'Media Presión'
];

const ESTADOS_CONEXION_COLOR_MAP = Object.freeze({
  conexion: 'blue-darken-2',
  trabajoespecial: 'indigo-darken-1',
  ejecucion: 'orange-darken-2',
  reactivacion: 'green-darken-2',
  prodoral: 'deep-orange-darken-2',
  encontinuacion: 'cyan-darken-2'
});

const ESTADOS_CONEXION_CLASS_MAP = Object.freeze({
  conexion: 'estado-option--conexion',
  trabajoespecial: 'estado-option--trabajo-especial',
  ejecucion: 'estado-option--ejecucion',
  reactivacion: 'estado-option--reactivacion',
  prodoral: 'estado-option--prodoral',
  encontinuacion: 'estado-option--en-continuacion'
});

function normalizeEstadoLookup(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .trim()
    .toLowerCase();
}

function getEstadoConexionColor(estado) {
  return ESTADOS_CONEXION_COLOR_MAP[normalizeEstadoLookup(estado)] || '';
}

function getEstadoOptionClass(estado) {
  return ESTADOS_CONEXION_CLASS_MAP[normalizeEstadoLookup(estado)] || '';
}

function getEstadoItemValue(item) {
  return item?.raw?.value ?? item?.value ?? item?.title ?? item?.raw?.label ?? '';
}

function getEstadoItemLabel(item) {
  return item?.raw?.label ?? item?.title ?? item?.value ?? '';
}

function normalizeTextValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function isConexionSurveySimple(survey) {
  return Number(survey?.id_area || 0) === 8;
}

function isConexionEstadoSelect(attr, survey) {
  if (!isConexionSurveySimple(survey)) return false;
  if (attr?.type !== 'comboBox') return false;

  const label = normalizeTextValue(attr?.label);
  const question = normalizeTextValue(attr?.values?.quest);
  const isEstadoField = label.includes('estado') || question.includes('estado');
  if (!isEstadoField) return false;

  const rawOptions = Array.isArray(attr?.values?.options) ? attr.values.options : [];
  const joined = normalizeTextValue(rawOptions.map((o) => o?.label ?? o?.value ?? o).join(' '));
  return joined.includes('conexion') || joined.includes('trabajo especial') || joined.includes('ciige');
}

function getSelectItems(options, attr = null, survey = null) {
  const base = Array.isArray(options)
    ? options.map(opt => ({
      id: opt.id ?? opt.value,
      label: opt.label ?? opt.value,
      value: opt.value ?? opt.id
    }))
    : [];

  if (!isConexionEstadoSelect(attr, survey)) return base;

  const homologados = CONEXION_ESTADOS_LG.map((estado) => ({
    id: estado,
    label: estado,
    value: estado
  }));

  const selected = String(attr?.values?.selected ?? attr?.default ?? '').trim();
  if (selected && !homologados.some((x) => x.value === selected)) {
    homologados.unshift({ id: selected, label: selected, value: selected });
  }

  return homologados;
}

function isEstadoComboField(attr) {
  if (attr?.type !== 'comboBox') return false;
  const label = normalizeTextValue(attr?.label);
  const question = normalizeTextValue(attr?.values?.quest);
  return label.includes('estado') || question.includes('estado');
}

function getConexionEstadoSeleccionado(survey) {
  const segmentos = getSegmentos(survey) || [];
  for (const seg of segmentos) {
    const attrs = Array.isArray(seg?.attributes) ? seg.attributes : [];
    for (const attr of attrs) {
      if (!isEstadoComboField(attr)) continue;
      const val = String(attr?.values?.selected ?? attr?.default ?? '').trim();
      if (!val) continue;
      return val;
    }
  }
  return '';
}

function resolveEstadoSrvForSave(survey) {
  if (!survey) return 'Ejecución';
  if (!isConexionSurveySimple(survey)) return String(survey?.estado_srv || 'Ejecución');

  const selectedEstado = getConexionEstadoSeleccionado(survey);
  if (selectedEstado) return selectedEstado;

  return String(survey?.estado_srv || 'Ejecución');
}

const guardarSurvey = () => {
  // Aquí va tu lógica real
  console.log('Guardando survey...');
  if (!validarCampos()) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }
  else{
    putSurvey(surveyDetailStore.surveyDetail[0].id_survey);
    console.log(surveyDetailStore.surveyDetail);
  }
};

async function putSurvey(id_survey) {
  const formData = new FormData();
  const survey = surveyDetailStore.surveyDetail[0];
  const estadoSrv = resolveEstadoSrvForSave(survey);
  survey.estado_srv = estadoSrv;

  const coordenadas = obtenerCoordenadas(survey);

  console.log(id_survey);
  console.log(JSON.stringify(surveyDetailStore.surveyDetail[0].body_exec));

  formData.append('estado_srv', estadoSrv);
  formData.append('body_exec', JSON.stringify(survey.body_exec));
  formData.append('fecha_real_ini', new Date().toISOString());

  // Si coordenadas existen, usa lat/lng, si no, manda null o vacío
  formData.append('latitud', coordenadas?.lat ?? '');
  formData.append('longitud', coordenadas?.lng ?? '');
 
  try {
    const response = await apiAxios.put(`/survey/${id_survey}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Survey actualizado correctamente:', response.data);
  } catch (error) {
    console.error('Error al actualizar survey:', error);
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

function validarCampos() {
  errores.value = {}; // limpiar errores
  let esValido = true;

  surveyDetailStore.surveyDetail.forEach((survey, idxSurvey) => {
    const segmentos = getSegmentos(survey);

    segmentos.forEach((segmento, idxSegmento) => {
      segmento.attributes?.forEach((attr, idxAttr) => {
        if (attr.nullable !== false) return;

        let valor = true;

        switch (attr.type) {
          case 'textField':
          case 'textArea':
          case 'datePicker':
          case 'dateHourPicker':
            valor = attr.default !== null && attr.default !== undefined && attr.default !== '';
            break;

          case 'comboBox':
            valor =
              attr.values?.selected !== null &&
              attr.values?.selected !== undefined &&
              attr.values?.selected !== '';
            break;

          case 'geoLocation':
            valor =
              attr.default?.lat !== null &&
              attr.default?.lng !== null &&
              attr.default?.lat !== undefined &&
              attr.default?.lng !== undefined;
            break;

          case 'photoCapture':
            valor =
              Array.isArray(attr.galeria) &&
              attr.galeria.length >= (attr.obligatorioFotos || 1);
            break;

          case 'fileUpload':
            valor =
              Array.isArray(attr.archivos) &&
              attr.archivos.length > 0;
            break;

          default:
            valor = true;
        }

        if (!valor) {
          esValido = false;
          // Guardamos el error en una estructura para saber dónde está
          if (!errores.value[`survey-${idxSurvey}`]) {
            errores.value[`survey-${idxSurvey}`] = [];
          }
          errores.value[`survey-${idxSurvey}`].push({
            segmento: idxSegmento,
            atributo: idxAttr,
            label: attr.label,
            tipo: attr.type
          });
        }
      });
    });
  });

  console.log('Errores de validación:', errores.value);
  return esValido;
}

function segmentosCompletos() {

  //console.log("segmentosCompletos");
  surveyDetailStore.surveyDetail.forEach((survey, idxSurvey) => {
    const segmentos = getSegmentos(survey);
    console.log("segmentos", segmentos);
    segmentos.forEach((segmento, idxSegmento) => {
      segmento.attributes?.forEach((attr, idxAttr) => {
        if (attr.nullable == true) return;
        console.log("segmento.type", attr.type);
        if (['textField', 'datePicker', 'dateHourPicker', 'textArea'].includes(attr.type)) {
          if (attr.default != '') {
            segmento.touch = true;
            console.log("segmento.touch", segmento.touch)
          }
          else{
            segmento.touch = false;
            console.log("segmento.touch", segmento.touch)
          }
        }
        if (['checkList'].includes(attr.type)) {
          console.log(attr.checkBoby)
          attr.checkBoby.forEach((check) => {
            if (check.nullable == true) return;
            if (check.default != '') {
              segmento.touch = true;
              console.log("segmento.touch", segmento.touch)
            }
            else{
              segmento.touch = false;
              console.log("segmento.touch", segmento.touch)
            }
          })
        }

        if (['comboBox'].includes(attr.type)) {
          console.log("segmento.type", attr.type);
          if (attr.values.selected != '') {
            segmento.touch = true;
            console.log("segmento.touch", segmento.touch)
          }
          else{
            segmento.touch = false;
            console.log("segmento.touch", segmento.touch)
          }
        }

        if (['photoCapture'].includes(attr.type)) {
          console.log(attr)
          if (attr.galeria.length >= attr.obligatorioFotos) {
            segmento.touch = true;
            console.log("segmento.touch", segmento.touch)
          }
          else{
            segmento.touch = false;
            console.log("segmento.touch", segmento.touch)
          }
        }

        if (['fileUpload'].includes(attr.type)) {
          console.log(attr)
          if (attr.archivos.length >= attr.maxArchivos) {
            segmento.touch = true;
            console.log("segmento.touch", segmento.touch)
          }
          else{
            segmento.touch = false;
            console.log("segmento.touch", segmento.touch)
          }
        }
        
      })
    })
  });
}

function isValorServicio(attr) {
  const label = (attr?.label ?? '').toString().trim().toLowerCase();
  return label === 'valor servicio';
}

function getVisibleAttributes(attrs) {
  return (attrs || []).filter(attr => !isValorServicio(attr));
}

</script>
<style scoped>
.sombra-resaltada {
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3) !important;
  border-radius: 12px;
}

/* Quitar padding en el expansion panel */
::v-deep(.v-expansion-panel-text__wrapper) {
  padding: 0 !important;
}
.color-red input {
  border-color: red !important;
}
.text-custom-red {
  color: #f87171 !important;
}

.estado-select-label {
  font-weight: 700;
}

.estado-option--conexion {
  color: #1565c0 !important;
}

.estado-option--trabajo-especial {
  color: #3949ab !important;
}

.estado-option--ejecucion {
  color: #ef6c00 !important;
}

.estado-option--reactivacion {
  color: #2e7d32 !important;
}

.estado-option--prodoral {
  color: #d84315 !important;
}

.estado-option--en-continuacion {
  color: #00838f !important;
}

:deep(.estado-option--conexion) {
  color: #1565c0 !important;
}

:deep(.estado-option--trabajo-especial) {
  color: #3949ab !important;
}

:deep(.estado-option--ejecucion) {
  color: #ef6c00 !important;
}

:deep(.estado-option--reactivacion) {
  color: #2e7d32 !important;
}

:deep(.estado-option--prodoral) {
  color: #d84315 !important;
}

:deep(.estado-option--en-continuacion) {
  color: #00838f !important;
}
</style>
