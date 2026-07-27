<template>
    <!--v-select
        label="Equipo"
        v-model="flujo.id_user"
        :items="usuariosPorRol(flujo.name_rol)"
        item-title="nombre_user"
        item-value="id_user"
        density="compact"
        variant="underlined"
        hide-details="auto"
        clearable
        @update:modelValue="val => markDirty(flujo, val)"
    /-->
    <v-select
        label="Asignar Equipo"
        v-model="attr.value"
        :items="equiposProyectos"
        item-title="nombre_equipo"
        item-value="id_equipo_proyecto"
        density="compact"
        variant="underlined"
        hide-details="auto"
        clearable/>
    
    <v-btn color="primary" @click="asignarSurveyFlujo">Asignar</v-btn>
    
</template>
<script setup>
import apiAxios from '@/services/api'
import { toRef, onMounted, ref } from 'vue';
import { useSurveyDetailStore } from "@/store/surveyDetail";

/* eslint-disable */

/* ===== Props ===== */
const props = defineProps({
  attr: { type: Object, required: true }
})
const attr = toRef(props, 'attr')

const equiposProyectos = ref([]);
const surveys = ref([]);
const survey = ref([]);
const flujoAprobacion = ref([]);

const surveyDetailStore = useSurveyDetailStore()

onMounted(async () => {
    console.log('AsignarEquipo mounted');
    await obtenerEquiposProyectos();
    await obtenerSurveys();
});

async function obtenerEquiposProyectos () {
  try {
    const { data } = await apiAxios.get(
      '/servicio/leanglobal/obtenerEquiposProyectos'
    )
    equiposProyectos.value = Array.isArray(data) ? data : []
    console.log('Equipos de proyectos obtenidos:', equiposProyectos.value);
  } catch (err) {
    console.error(err)
    equiposProyectos.value = []
  }
}

async function obtenerSurveys () {
  try {
    const { data } = await apiAxios.get(
      '/servicio/leanglobal/procesosSurveyV3'
    )
    surveys.value = Array.isArray(data.datos) ? data.datos : []
    survey.value = surveys.value.filter(s => s.id_survey === surveyDetailStore.surveyDetail[0].id_survey);
    console.log('ID Survey actual:', surveyDetailStore.surveyDetail[0].id_survey);
    console.log('Surveys obtenidos:', survey.value[0].id_flow);
  } catch (err) {
    console.error(err)
    surveys.value = []
  }
}

async function obtenerFlujoAprobacion() {
    try {
        const { data } = await apiAxios.get(
            `/servicio/leanglobal/flujosAprobacionSteps?id_flow=${survey.value[0].id_flow}`
        )
        flujoAprobacion.value = Array.isArray(data) ? data : []
        console.log('Flujo de aprobación obtenido:', flujoAprobacion.value);
    } catch (err) {
        console.error(err)
        return []
    }
}

async function asignarSurveyFlujo() {
    if (!attr.value) {
        alert('No se ha seleccionado ningún equipo.');
        return;
    }
    const url = '/survey/UpdUserFlow'
    try{
        await obtenerFlujoAprobacion();
        if (flujoAprobacion.value.length === 0) {
            alert('No se encontró el flujo de aprobación para este survey.');
            return;
        }
        let equipo = flujoAprobacion.value.filter(f => f.flag_equipo === true);
        console.log('Equipo en flujo de aprobación:', equipo[0].id_flow_stp);
        console.log('ID Usuario asignado:', Number(props.attr.value));
        const reqs = apiAxios.put(url, {
            id_flow_stp: equipo[0].id_flow_stp,
            id_user_flujo: Number(props.attr.value),
            flag_equipo: equipo[0].flag_equipo
        })
    }    catch(error){
        console.error('Error al asignar el equipo:', error);
        alert('Error al asignar el equipo. Por favor, intente nuevamente.');
        return;
    }
    alert('Equipo asignado correctamente.');
}
</script>