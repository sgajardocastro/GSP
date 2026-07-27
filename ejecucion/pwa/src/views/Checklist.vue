<template>
  <v-container>
    <v-card class="mx-auto" max-width="368">
      <div class="d-flex py-0 justify-space-between">
        <v-list-item density="compact">
          <v-list-item-subtitle>Id Inspección:</v-list-item-subtitle>
        </v-list-item>
        <v-list-item density="compact">
          <v-list-item-subtitle>{{
            inspeccion.idInspeccion
          }}</v-list-item-subtitle>
        </v-list-item>
      </div>
      <div class="d-flex py-0 justify-space-between">
        <v-list-item density="compact">
          <v-list-item-subtitle>Fecha Inspección:</v-list-item-subtitle>
        </v-list-item>
        <v-list-item density="compact">
          <v-list-item-subtitle>{{
            inspeccion.fechaCreacion
          }}</v-list-item-subtitle>
        </v-list-item>
      </div>
      <div class="d-flex py-0 justify-space-between">
        <v-list-item density="compact">
          <v-list-item-subtitle>Estado:</v-list-item-subtitle>
        </v-list-item>
        <v-list-item density="compact">
          <v-list-item-subtitle>{{
            estados[inspeccion.idEstado ? inspeccion.idEstado : 0]
          }}</v-list-item-subtitle>
        </v-list-item>
      </div>
      <div class="d-flex py-0 justify-space-between">
        <v-list-item density="compact">
          <v-list-item-subtitle>Puerto:</v-list-item-subtitle>
        </v-list-item>
        <v-list-item density="compact">
          <v-list-item-subtitle>{{
            inspeccion.nombrePuerto
          }}</v-list-item-subtitle>
        </v-list-item>
      </div>
      <div class="d-flex py-0 justify-space-between">
        <v-list-item density="compact">
          <v-list-item-subtitle>Nmro Lote:</v-list-item-subtitle>
        </v-list-item>
        <v-list-item density="compact">
          <v-list-item-subtitle>{{
            inspeccion.numeroLote
          }}</v-list-item-subtitle>
        </v-list-item>
      </div>
      <div class="d-flex py-0 justify-center">
        <v-list-item density="compact">
          <v-list-item-subtitle
            ><v-btn
              :key="btn.key"
              :color="btn.color"
              fab
              large
              dark
              bottom
              left
              @click="terminarInspeccion"
            >
              <v-icon>{{ btn.key }}</v-icon>
              Terminar
            </v-btn></v-list-item-subtitle
          >
        </v-list-item>
      </div>
    </v-card>
    <br />
    <v-row>
      <v-col cols="12" sm="6" md="8">
        <v-expansion-panels v-for="(pregunta, index) in preguntas" v-bind:key="index">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-row no-gutters>
                <v-col cols="4" class="d-flex justify-start">
                  Paq N°:
                  {{
                    pregunta.indiceNmroPaq +
                    " " +
                    (pregunta.estado != null ? pregunta.estado : "PENDIENTE")
                  }}
                </v-col>
              </v-row>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row no-gutters>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor2"
                    :label="pregunta.Etiqueta2"
                    color="success"
                    value="true"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor3"
                    :label="pregunta.Etiqueta3"
                    color="success"
                    value="success"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor4"
                    :label="pregunta.Etiqueta4"
                    color="success"
                    value="success"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor5"
                    :label="pregunta.Etiqueta5"
                    color="success"
                    value="success"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor6"
                    :label="pregunta.Etiqueta6"
                    color="success"
                    value="success"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor7"
                    :label="pregunta.Etiqueta7"
                    color="success"
                    value="success"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor8"
                    :label="pregunta.Etiqueta8"
                    color="success"
                    value="success"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor9"
                    :label="pregunta.Etiqueta9"
                    color="success"
                    value="success"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor10"
                    :label="pregunta.Etiqueta10"
                    color="success"
                    value="success"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor11"
                    :label="pregunta.Etiqueta11"
                    color="success"
                    value="success"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor12"
                    :label="pregunta.Etiqueta12"
                    color="success"
                    value="success"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="6">
                  <v-checkbox
                    v-model="pregunta.valor13"
                    :label="pregunta.Etiqueta13"
                    color="success"
                    value="success"
                    hide-details
                    @click="guardarInspeccion2"
                  ></v-checkbox>
                </v-col>
                <v-col cols="12">
                  <v-btn
                    :key="btn.key"
                    :color="btn.color"
                    fab
                    large
                    dark
                    bottom
                    left
                    @click="guardarInspeccion(pregunta)"
                  >
                    <v-icon>{{ btn.key }}</v-icon>
                    Inspeccionado
                  </v-btn>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted } from 'vue';
/* eslint-disable */
  const router = useRouter();
  const trip = ref({
          name: '',
          location: null,
          start: null,
          end: null,
        })
  const locations = ref(['Australia', 'Barbados', 'Chile', 'Denmark', 'Ecuador', 'France'])
  const ex4 = ref(["red"])
  const valores = ref([])
  const btn = ref({
                  key: "mdi-playlist-edit",
                  color: "success",
                })
  const idLote = ref(0)
  const inspeccion = ref({})
  const estados = ref([
                      "",
                      "",
                      "No iniciado",
                      "En ejecución",
                      "",
                      "",
                      "Terminada",
                      "",
                      "",
                    ])
  const grupos = ref([])
  const preguntas = ref([])
  const route = useRoute();

  const latitude = ref(null);
  const longitude = ref(null);

  const getLocation = async () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            successCallback(position);
            resolve();
          },
          (error) => {
            errorCallback(error);
            reject(error);
          }
        );
      } else {
        console.error("La geolocalización no es compatible en este navegador.");
        reject(new Error("Geolocalización no compatible"));
      }
    });
  };

  const successCallback = (position) => {
    latitude.value = position.coords.latitude;
    longitude.value = position.coords.longitude;
  };

  const errorCallback = (error) => {
    console.error(`Error al obtener la ubicación: ${error.message}`);
    latitude.value = 0;
    longitude.value = 0;
  };

  idLote.value = route.params.idInspeccion;

  onMounted(async () => {
    try {
      inspeccion.value = await consultarInspeccionPorLote(idLote.value);
      grupos.value = inspeccion.value.grupos
      preguntas.value = grupos.value[0].preguntas;
      preguntas.value = preguntas.value.filter(
        (preg) => 
          preg.indiceNmroPaq < parseInt(inspeccion.value.cantidadPaquetes)
      );
    } catch (error) {
      console.error(error);
    }
  });

  async function abrirConexion() {
    return new Promise((resolve, reject) => {
      const solicitudDeConexion = indexedDB.open('TransmacSST', 1);

      solicitudDeConexion.onsuccess = (event) => {
        const db = event.target.result;
        resolve(db);
      };

      solicitudDeConexion.onerror = (event) => {
        reject('Error al abrir la base de datos');
      };
    });
  }

  const consultarInspeccionPorLote = async (numeroLote) => {
    const db = await abrirConexion();

    return new Promise((resolve, reject) => {
      const trasaccion = db.transaction(['Inspecciones'], 'readonly');
      const coleccionObjetos = trasaccion.objectStore('Inspecciones');
      const solicitud = coleccionObjetos.get(numeroLote);

      solicitud.onsuccess = (event) => {
        const inspeccionEncontrada = event.target.result;
        resolve(inspeccionEncontrada);
      };

      solicitud.onerror = (error) => {
        reject(error);
      };
    });
  };

  async function agregarInspeccion(data) {
    const db = await abrirConexion();
    const trasaccion = db.transaction(['Inspecciones'],'readwrite')
    const coleccionObjetos = trasaccion.objectStore('Inspecciones')
    const dataString = JSON.stringify(data);
    const conexion = coleccionObjetos.put(JSON.parse(dataString));
  }

  async function guardarInspeccion(pregunta){ 
    pregunta.estado = "INSPECCIONADO";
    await agregarInspeccion(inspeccion.value)
  }

  async function guardarInspeccion2(){    
    await agregarInspeccion(inspeccion.value)
  }

  function formatISODateToYYYYMMDDHHMMSS(isoDate) {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  async function terminarInspeccion() {
    inspeccion.value.idEstado = 9;
    await getLocation();
    inspeccion.value.latitud = latitude.value;
    inspeccion.value.longitud = longitude.value;    
    inspeccion.value.fechaTermino = formatISODateToYYYYMMDDHHMMSS(new Date().toISOString());
    await agregarInspeccion(inspeccion.value)
    console.log(inspeccion.value);
    const lote = await consultarLotePorNumero(idLote.value);
    lote.NOMBRE_ESTADO = 'TERMINADA SIN SINCRONIZAR'
    await actualizarLote(lote)
  }

  const consultarLotePorNumero = async (numeroLote) => {
    const db = await abrirConexion();

    return new Promise((resolve, reject) => {
      const trasaccion = db.transaction(['Lotes'], 'readonly');
      const coleccionObjetos = trasaccion.objectStore('Lotes');
      const solicitud = coleccionObjetos.get(numeroLote);

      solicitud.onsuccess = (event) => {
        const loteDetalleEncontrado = event.target.result;
        resolve(loteDetalleEncontrado);
      };

      solicitud.onerror = (error) => {
        reject(error);
      };
    });
  };

  async function actualizarLote(data) {
    const db = await abrirConexion();
    const trasaccion = db.transaction(['Lotes'],'readwrite')
    const coleccionObjetos = trasaccion.objectStore('Lotes')
    const dataString = JSON.stringify(data);
    const conexion = coleccionObjetos.put(JSON.parse(dataString));
    router.push({
      path: "/surveys",
    });
  }
</script>
<style scoped>
.v-btn--checklist {
  bottom: 0;
  right: 15px;
  position: fixed;
  margin: 0 0 16px 16px;
}
</style>
