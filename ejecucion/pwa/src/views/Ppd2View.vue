<template>
  <component :is="layoutWrapper">
    <v-container
      fluid
      class="pa-4 ppd2-page"
    >
      <div class="ppd-topbar mb-4">
        <div>
          <h1 class="ppd-title">
            Parte de Producción Diaria
          </h1>
          <p class="ppd-subtitle">
            Gestión y control de mantenimiento de servidumbres
          </p>
        </div>
        <v-btn
          color="success"
          variant="flat"
          class="ppd-create-btn"
          :disabled="!tareasBase.length"
          @click="openCreateTaskModal"
        >
          <v-icon
            icon="mdi-plus"
            size="16"
            class="mr-1"
          />
          Crear Tarea
        </v-btn>
      </div>

      <v-card
        variant="flat"
        class="mb-4 ppd-filter-card"
      >
        <v-card-text>
          <v-row
            dense
            class="align-end"
          >
            <v-col
              cols="12"
              md="3"
            >
              <v-text-field
                v-model="fechaSeleccionada"
                label="Fecha"
                type="date"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              md="3"
            >
              <v-select
                v-model="clienteSeleccionado"
                :items="clientes"
                item-title="name_empresa"
                item-value="id_empresa"
                label="Cliente"
                density="compact"
                variant="outlined"
                clearable
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              md="4"
            >
              <v-select
                v-model="proyectoSeleccionado"
                :items="proyectos"
                item-title="nombre_proyecto"
                item-value="id_proyecto"
                label="Proyecto"
                density="compact"
                variant="outlined"
                clearable
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              md="2"
              class="d-flex"
            >
              <v-btn
                block
                color="primary"
                class="ppd-load-btn"
                :loading="cargando"
                @click="cargarTareas"
              >
                <v-icon
                  icon="mdi-magnify"
                  size="16"
                  class="mr-1"
                />
                Cargar
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!--
      <v-alert
        type="info"
        variant="tonal"
        class="mb-4"
      >
        {{ resumenFecha }} | API: {{ totalBase }}
      </v-alert>

      <v-alert
        v-if="syncInfoText"
        :type="syncInfoType"
        variant="tonal"
        class="mb-4"
      >
        {{ syncInfoText }}
      </v-alert>
      -->

      <v-alert
        v-if="errorCarga"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ errorCarga }}
      </v-alert>
      <v-alert
        v-if="guardarEstado.text"
        :type="guardarEstado.type"
        variant="tonal"
        class="mb-4"
      >
        {{ guardarEstado.text }}
      </v-alert>

      <v-row
        v-if="!cargando && tareasTarjeta.length"
        dense
      >
        <v-col
          v-for="t in tareasTarjeta"
          :key="t.idTarea"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            class="h-100 task-card"
            variant="flat"
          >
            <v-card-title class="task-card__title d-flex align-start justify-space-between">
              <div class="task-card__meta">
                <span
                  v-if="t.codigoEdt"
                  class="task-code-badge"
                >
                  {{ t.codigoEdt }}
                </span>
                <span class="task-card__name">
                  {{ t.nombreTarea }}
                </span>
                <span class="task-card__subtitle">{{ getTaskSubtitle(t) }}</span>
              </div>
              <v-btn
                icon
                size="x-small"
                color="red"
                variant="text"
                @click="openDeleteSurveyDialog(t)"
              >
                <v-icon icon="mdi-delete-outline" />
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div class="ppd-editor">
                <v-row
                  v-if="isUiSegmentOpen(t, 'segmento1')"
                  dense
                  class="mt-1"
                >
                  <v-col
                    cols="12"
                    md="12"
                  >
                    <v-select
                      v-model="getPpdDraft(t.idTarea, t).patrullas"
                      :items="getPatrullasOptions(t)"
                      label="Patrullas"
                      multiple
                      chips
                      closable-chips
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                </v-row>

                <v-card
                  variant="outlined"
                  class="mt-3 pa-3 ppd-section-card ppd-map-card"
                >
                  <div class="text-caption mb-2 ppd-map-label">
                    Ubicación actual
                  </div>
                  <div
                    class="ppd-map-status"
                    :class="getGeoStatusClass(t.idTarea)"
                  >
                    <div class="d-flex align-center">
                      <v-icon
                        :icon="getGeoStatusIcon(t.idTarea)"
                        size="16"
                        class="mr-2"
                      />
                      <span>
                        {{ getGeoStatusText(t.idTarea) }}
                      </span>
                    </div>
                    <v-btn
                      size="x-small"
                      color="primary"
                      variant="text"
                      @click="captureCurrentLocation(t.idTarea)"
                    >
                      <v-icon icon="mdi-refresh" />
                    </v-btn>
                  </div>
                  <div class="ppd-map-embed-wrap mt-2">
                    <iframe
                      :src="getGeoMapUrl(t.idTarea)"
                      class="ppd-map-embed"
                      loading="eager"
                    />
                  </div>
                  <div class="ppd-map-meta mt-1 text-medium-emphasis">
                    Mapa base cargado. Puedes reintentar para centrar en tu ubicación.
                  </div>
                </v-card>

                <v-card
                  v-if="isSegmentVisible(t, 'actividad') && isUiSegmentOpen(t, 'segmento2')"
                  variant="outlined"
                  class="mt-3 pa-3 ppd-section-card"
                >
                  <v-row dense>
                    <v-col cols="12">
                      <v-select
                        v-if="isActividadOtrosTask(t)"
                        v-model="getPpdDraft(t.idTarea, t).actividad.actividad"
                        :items="actividadesOtrosOptions"
                        label="Actividad Otros"
                        density="compact"
                        variant="outlined"
                        hide-details
                      />
                      <v-text-field
                        v-else
                        :model-value="getActividadNombre(t)"
                        label="Actividad"
                        density="compact"
                        variant="outlined"
                        hide-details
                        readonly
                      />
                    </v-col>
                    <template v-if="actividadRequiresPk(getActividadNombre(t))">
                      <v-col
                        cols="12"
                        md="6"
                      >
                        <div class="stack-label">
                          PK INICIO QCC
                        </div>
                        <v-select
                          v-model="getPpdDraft(t.idTarea).actividad.pkInicio"
                          :items="getPkOptions(t)"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="6"
                      >
                        <div class="stack-label">
                          PK FINAL QCC
                        </div>
                        <v-select
                          v-model="getPpdDraft(t.idTarea).actividad.pkFinal"
                          :items="getPkOptions(t)"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                    </template>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <div class="stack-label">
                        Horas realizadas
                      </div>
                      <v-text-field
                        v-model="getPpdDraft(t.idTarea).actividad.totalHorasActividad"
                        type="number"
                        density="compact"
                        variant="solo"
                        flat
                        class="ppd-field"
                        hide-details
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <div class="stack-label">
                        Horas planificadas
                      </div>
                      <v-text-field
                        v-model="getPpdDraft(t.idTarea).actividad.horasPlanificadas"
                        type="number"
                        density="compact"
                        variant="solo"
                        flat
                        class="ppd-field"
                        hide-details
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <div class="stack-label">
                        PK avance diario
                      </div>
                      <v-text-field
                        v-model="getPpdDraft(t.idTarea).actividad.pkAvanceDiario"
                        density="compact"
                        variant="solo"
                        flat
                        class="ppd-field"
                        hide-details
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <div class="stack-label">
                        Horas traslado
                      </div>
                      <v-text-field
                        v-model="getPpdDraft(t.idTarea).actividad.horasTraslado"
                        type="number"
                        hint="Considerar 2 hrs de traslado diario."
                        persistent-hint
                        density="compact"
                        variant="solo"
                        flat
                        class="ppd-field"
                        hide-details="auto"
                      />
                    </v-col>

                    <template v-if="isActividad(getActividadNombre(t), 'SEÑALETICA')">
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Total de hitos instalados
                        </div>
                        <v-text-field
                          v-model="getPpdDraft(t.idTarea).actividad.totalHitosInstalados"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Total de hitos pintados
                        </div>
                        <v-text-field
                          v-model="getPpdDraft(t.idTarea).actividad.totalHitosPintados"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Total de logotipos cambiados
                        </div>
                        <v-text-field
                          v-model="getPpdDraft(t.idTarea).actividad.totalLogotiposCambiados"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Total de PK pintados
                        </div>
                        <v-text-field
                          v-model="getPpdDraft(t.idTarea).actividad.totalPkPintados"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Reposicion de plancheta
                        </div>
                        <v-text-field
                          v-model="getPpdDraft(t.idTarea).actividad.reposicionPlancheta"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Reposicion de pilar
                        </div>
                        <v-text-field
                          v-model="getPpdDraft(t.idTarea).actividad.reposicionPilar"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col cols="12">
                        <div class="stack-label">
                          Instalacion de senaletica nueva
                        </div>
                        <v-text-field
                          v-model="getPpdDraft(t.idTarea).actividad.instalacionSenaleticaNueva"
                          type="number"
                          hint="(Pilar, plancheta y logotipos)"
                          persistent-hint
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details="auto"
                        />
                      </v-col>
                    </template>

                    <template v-if="isActividad(getActividadNombre(t), 'APOYO RECORRIDO INSPECCIÓN')">
                      <v-col cols="12">
                        <div class="stack-label">
                          KM recorridos en inspeccion
                        </div>
                        <v-text-field
                          v-model="getPpdDraft(t.idTarea).actividad.kmRecorridosInspeccion"
                          type="number"
                          hint="Ingresar en metros."
                          persistent-hint
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details="auto"
                        />
                      </v-col>
                    </template>

                    <template v-if="isActividad(getActividadNombre(t), 'CALICATAS')">
                      <v-col cols="12">
                        <div class="stack-label">
                          Total N de calicatas realizadas
                        </div>
                        <v-text-field
                          v-model="getPpdDraft(t.idTarea).actividad.totalCalicatasRealizadas"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                    </template>

                    <v-col
                      v-if="actividadShowsObservaciones(getActividadNombre(t))"
                      cols="12"
                    >
                      <v-textarea
                        v-model="getPpdDraft(t.idTarea).actividad.observaciones"
                        label="OBSERVACIONES"
                        auto-grow
                        rows="2"
                        density="compact"
                        variant="outlined"
                        hide-details
                      />
                    </v-col>
                  </v-row>
                </v-card>

                <v-card
                  v-if="isSegmentVisible(t, 'servidumbre') && isUiSegmentOpen(t, 'segmento2')"
                  variant="outlined"
                  class="mt-3 pa-3 ppd-section-card"
                >
                  <div
                    v-for="(r, rIdx) in getPrimeraRegistros(t.idTarea).slice(0, 1)"
                    :key="`pm-${t.idTarea}-${rIdx}`"
                    class="ppd-registro"
                  >
                    <v-row dense>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Horas traslado
                        </div>
                        <v-text-field
                          v-model="r.horasTraslado"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          PK inicio
                        </div>
                        <v-select
                          v-model="r.pkInicio"
                          :items="getPkOptions(t)"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          PK fin
                        </div>
                        <v-select
                          v-model="r.pkFinal"
                          :items="getPkOptions(t)"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Horas realizadas
                        </div>
                        <v-text-field
                          v-model="r.totalHorasActividad"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Horas planificadas
                        </div>
                        <v-text-field
                          v-model="r.horasPlanificadas"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          PK avance diario
                        </div>
                        <v-text-field
                          v-model="r.pkAvanceDiario"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                    </v-row>
                  </div>
                </v-card>

                <v-card
                  v-if="isSegmentVisible(t, 'camaras') && isUiSegmentOpen(t, 'segmento2')"
                  variant="outlined"
                  class="mt-3 pa-3 ppd-section-card"
                >
                  <div
                    v-for="(r, rIdx) in getCamaraRegistros(t.idTarea)"
                    :key="`cm-${t.idTarea}-${rIdx}`"
                    class="ppd-registro"
                  >
                    <v-row dense>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Horas traslado
                        </div>
                        <v-text-field
                          v-model="r.horasTraslado"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          PK inicio
                        </div>
                        <v-select
                          v-model="r.pkInicio"
                          :items="getPkOptions(t)"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          PK fin
                        </div>
                        <v-select
                          v-model="r.pkFinal"
                          :items="getPkOptions(t)"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Horas realizadas
                        </div>
                        <v-text-field
                          v-model="r.totalHorasActividad"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Horas planificadas
                        </div>
                        <v-text-field
                          v-model="r.horasPlanificadas"
                          type="number"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <div class="stack-label">
                          Cámaras realizadas
                        </div>
                        <v-text-field
                          :model-value="getCantidadCamarasRealizadas(r)"
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                          readonly
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="8"
                      >
                        <div class="stack-label">
                          Seleccione camaras realizadas
                        </div>
                        <v-select
                          v-model="r.camarasSeleccionadas"
                          :items="getCamaraOptions(t)"
                          multiple
                          chips
                          closable-chips
                          density="compact"
                          variant="solo"
                          flat
                          class="ppd-field"
                          hide-details
                          @update:model-value="syncCamarasRealizadas(r)"
                        />
                      </v-col>
                    </v-row>
                  </div>
                </v-card>

                <div class="d-flex align-center justify-space-between mt-3">
                  <div class="text-caption font-weight-bold">
                    Definición de Actividades
                  </div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="toggleUiSegment(t, 'segmentoDefActividades')"
                  >
                    <v-icon :icon="isUiSegmentOpen(t, 'segmentoDefActividades') ? 'mdi-chevron-down' : 'mdi-chevron-right'" />
                  </v-btn>
                </div>

                <v-card
                  v-if="isUiSegmentOpen(t, 'segmentoDefActividades')"
                  variant="outlined"
                  class="mt-3 pa-3 ppd-section-card"
                >
                  <div>
                    <div
                      v-for="(item, idx) in definicionActividades"
                      :key="`def-act-${idx}`"
                      class="mb-2"
                    >
                      <div class="text-caption font-weight-bold">
                        {{ item.titulo }}
                      </div>
                      <div class="text-body-2">
                        {{ item.descripcion }}
                      </div>
                    </div>
                  </div>
                </v-card>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12">
          <div class="d-flex justify-end mt-2">
            <v-btn
              color="primary"
              variant="flat"
              :loading="guardandoPPD2"
              @click="guardarPPD2"
            >
              Guardar
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <v-card
        v-else-if="!cargando"
        variant="outlined"
      >
        <v-card-text class="text-medium-emphasis">
          No hay tareas para la fecha seleccionada.
        </v-card-text>
      </v-card>

      <v-dialog
        v-model="showDeleteSurveyDialog"
        max-width="360"
      >
        <v-card>
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Confirmar eliminación
          </v-card-title>
          <v-card-text class="text-body-2">
            {{ deleteSurveyDialogText }}
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="text"
              :disabled="deletingSurvey"
              @click="closeDeleteSurveyDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              color="red"
              variant="flat"
              :loading="deletingSurvey"
              @click="confirmDeleteSurvey"
            >
              Continuar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog
        v-model="showCreateTaskModal"
        max-width="760"
      >
        <v-card>
          <v-card-text>
            <v-row dense>
              <v-col
                cols="12"
                md="4"
              >
                <v-select
                  v-model="createTaskSelection.nivel1"
                  :items="createTaskOptionsNivel1"
                  item-title="title"
                  item-value="value"
                  label="Paso 1: EDT principal"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-select
                  v-model="createTaskSelection.nivel2"
                  :items="createTaskOptionsNivel2"
                  item-title="title"
                  item-value="value"
                  label="Paso 2: Partida / Actividad"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!createTaskSelection.nivel1"
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-select
                  v-model="createTaskSelection.nivel3"
                  :items="createTaskOptionsNivel3"
                  item-title="title"
                  item-value="value"
                  label="Paso 3: Tarea final"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!createTaskSelection.nivel2"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="text"
              @click="closeCreateTaskModal"
            >
              Cancelar
            </v-btn>
            <v-btn
              color="green"
              variant="flat"
              :disabled="!createTaskSelection.nivel3"
              @click="confirmCreateTask"
            >
              Agregar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </component>
</template>

<script setup>
/* eslint-disable */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import apiAxios from '@/services/api'
import { useUserDetailStore } from '@/store/userDetail'

const fechaSeleccionada = ref('2026-01-01')
const clienteSeleccionado = ref(null)
const proyectoSeleccionado = ref(null)

const clientes = ref([])
const proyectos = ref([])
const tareasBase = ref([])
const cargando = ref(false)
const errorCarga = ref('')
const totalBase = ref(0)
const userDetailStore = useUserDetailStore()
const route = useRoute()
const layoutWrapper = 'div'
const DEFAULT_CLIENTE_NOMBRE = 'sonacol'
const DEFAULT_PROYECTO_NOMBRE = 'mantencion de servidumbre'
const PPD_TEMPLATE_ID = 87
const PPD_SYNC_SOURCE = 'PPD2_WEB'
const FLOW_FALLBACK_TEMPLATE_ID = 1
// [PPD2-ROLLBACK-MARK-2026-04-21] Inicio bloque de guard para evitar recreación automática tras eliminar.
const PPD_DELETED_GUARD_LS_KEY = 'ppd2_deleted_task_keys_v1'
const ppdSurveyByTaskKey = ref({})
const syncSummary = ref({
  fecha: '',
  total: 0,
  existentes: 0,
  creados: 0,
  errores: 0,
  detalle: '',
  loading: false,
})
const ppdTemplateMetaCache = ref(null)
let ppdTemplateMetaPromise = null
const ppdFallbackFlowTmpl = ref(undefined)
const ppdTemplateRowCache = ref({})
const ppdTemplateRowPromises = new Map()
const ppdAllTipoSrvIdsCache = ref(undefined)
let ppdAllTipoSrvIdsPromise = null
let ppdSyncPromise = null
let ppdSyncNeedsRerun = false
const ppdSurveyTaskKeyCache = ref({})
const markPpdCreatedKey = (taskKey, surveyId = 0) => {
  // Guard no-op: se evita usar localStorage como fuente de verdad porque puede
  // desincronizarse de la BD y bloquear creaciones válidas.
  void taskKey
  void surveyId
}

const loadPpdDeletedGuard = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(PPD_DELETED_GUARD_LS_KEY) || '{}')
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

const savePpdDeletedGuard = (guard) => {
  try {
    localStorage.setItem(PPD_DELETED_GUARD_LS_KEY, JSON.stringify(guard || {}))
  } catch {
    // noop
  }
}

const markPpdDeletedKey = (taskKey) => {
  const key = String(taskKey || '').trim()
  if (!key) return
  const guard = loadPpdDeletedGuard()
  guard[key] = { ts: Date.now() }
  savePpdDeletedGuard(guard)
}

const clearPpdDeletedKey = (taskKey) => {
  const key = String(taskKey || '').trim()
  if (!key) return
  const guard = loadPpdDeletedGuard()
  if (!guard[key]) return
  delete guard[key]
  savePpdDeletedGuard(guard)
}

const hasPpdDeletedKey = (taskKey) => {
  const key = String(taskKey || '').trim()
  if (!key) return false
  const guard = loadPpdDeletedGuard()
  return !!guard[key]
}
// [PPD2-ROLLBACK-MARK-2026-04-21] Fin bloque de guard.
const actividadesOptions = [
  'SEÑALETICA',
  'CORTE Y RETIRO LINEA FUERA DE SERVICIO',
  'CONTROL DE EROSIONES',
  'APOYO SERVIDUMBRE REÑACA ALTO',
  'LIMPIEZA CANAL INTERIOR Y EXTERIOR PLANTA CURACAVI',
  'APOYO RECORRIDO INSPECCIÓN',
  'MARCACION DE OLEODUCTO',
  'CALICATAS',
  'CAPACITACIONES O CURSOS',
  'REUNIÓN',
  'TRABAJOS ADICIONALES SERVIDUMBRE',
  'RETIRO Y ENTREGA DE MATERIALES/HERRAMIENTAS',
  'MANTENCIÓN DE CAMIONETAS',
  'MANTENCIÓN DE ACCESOS SERVIDUMBRE',
  'MANTENCION DE EMPALMES RECTIFICADORES Y REMOTO',
  'MANTENCIÓN DE PORTON',
  'APOYO CONEJEO',
]
const actividadesOtrosOptions = actividadesOptions.filter((item) =>
  String(item ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim() !== 'otros'
)
const definicionActividades = [
  {
    titulo: '1.MANTENCIÓN DE SERVIDUMBRES',
    descripcion: 'Limpieza de todo matorral, árbol y desmalezado de pasto que entorpezca el libre recorrido en todo su ancho de la servidumbre.',
  },
  {
    titulo: '2.MANTENCIÓN DE ACCESOS A SERVIDUMBRES',
    descripcion: 'Mantención de todos los accesos, portones, caminos de ingreso a servidumbre, cámaras y plantas de los oleoductos de Sonacol. (Detallar en observaciones).',
  },
  {
    titulo: '3.MANTENCIÓN DE CÁMARAS SONACOL',
    descripcion: 'Limpieza exterior, retiro de agua, pintura de tapa, mantención y pintura de cierres perimetrales, concertinas, plataformas de acceso, gabinetes de instrumentación, señalética, lubricación de tapas y recubrimiento exterior de muros.',
  },
  {
    titulo: '4.SEÑALETICAS',
    descripcion: 'Mantención e instalación de señaléticas como hitos, PK, letreros y logotipos: limpieza, pintura, codificación y desmalezado.',
  },
  {
    titulo: '5.CORTE Y RETIRO LINEA F.S.',
    descripcion: 'Todo trabajo relacionado al corte y retiro de líneas fuera de servicio de los oleoductos. (Detallar en observaciones).',
  },
  {
    titulo: '6.CONTROL DE EROSIONES',
    descripcion: 'Mejoramiento de erosiones que se producen por lluvias en servidumbres de Sonacol. (Detallar en observaciones).',
  },
  {
    titulo: '7.MANTENCIÓN DE EMPALMES RECTIFICADORES Y REMOTO',
    descripcion: 'Mantención, podas, limpieza y despeje de alimentaciones eléctricas de cámaras, rectificadores, drenajes y antenas de monitoreo remoto de forma trimestral. (Detallar en observaciones).',
  },
  {
    titulo: '8.APOYO SERVIDUMBRE REÑACA ALTO',
    descripcion: 'Toma de muestras de agua en Reñaca Alto PK 8+500 CCM (abril y octubre). (Detallar en observaciones).',
  },
  {
    titulo: '9.LIMPIEZA CANAL INTERIOR Y EXTERIOR PLANTA CURACAVI',
    descripcion: 'Limpieza con maquinaria de canal interior (junio y diciembre) y limpieza de canal exterior (diciembre).',
  },
  {
    titulo: '10.APOYO RECORRIDO INSPECCION',
    descripcion: 'Inspección de servidumbres oleoductos SF-M, CC-M, MAAMB y Q-CC. Se debe ingresar distancia recorrida en metros.',
  },
  {
    titulo: '11.MARCACIÓN OLEODUCTO',
    descripcion: 'Apoyo para marcación de oleoductos.',
  },
  {
    titulo: '12.CALICATAS',
    descripcion: 'Excavación de forma manual en terreno.',
  },
  {
    titulo: '13.REUNION',
    descripcion: 'Reuniones Sonacol y Terracon, presenciales u online.',
  },
  {
    titulo: '14.CAPACITACIONES Y CURSOS',
    descripcion: 'Capacitaciones de herramientas, procedimientos de trabajo y cursos mutual.',
  },
]
const patrullasFijasOptions = ['P. NORTE', 'P. SUR', 'P. CENTRO', 'P. APOYO']
const patrullasProyectoOptions = ref([])
const ppdStateByTask = ref({})
const geoByTask = ref({})
const geoUser = ref({
  loading: false,
  attempted: false,
  error: '',
  lat: null,
  lon: null,
  accuracy: null,
})
const removedTaskIds = ref(new Set())
const forceVisibleTaskIds = ref(new Set())
const showCreateTaskModal = ref(false)
const showDeleteSurveyDialog = ref(false)
const deletingSurvey = ref(false)
const deleteSurveyTarget = ref(null)
const guardandoPPD2 = ref(false)
const guardarEstado = ref({ type: 'info', text: '' })
let suppressAutoWatches = false
const manualCreatedTasks = ref([])
const createTaskSelection = ref({
  nivel1: null,
  nivel2: null,
  nivel3: null,
})

const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const toYmd = (value) => {
  if (!value) return ''
  if (typeof value === 'string') {
    const clean0 = value.trim()
    const clean = clean0.includes('T') ? clean0.split('T')[0] : clean0
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
    const ddmmyyyy = clean.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const toNumberSafe = (value) => {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const text = String(value).trim()
  const normalized = text.includes(',')
    ? text.replace(/\./g, '').replace(',', '.')
    : text
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const safeJsonParse = (raw, fallback = null) => {
  if (raw === null || raw === undefined || raw === '') return fallback
  if (typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return fallback
    }
  }
  return fallback
}

const deepClone = (value) => {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return value
  }
}

const getOptionByValue = (list, value) =>
  (Array.isArray(list) ? list : []).find((item) => String(item?.value ?? '') === String(value ?? '')) || null

const extractNameFromOptionTitle = (title) => {
  const text = String(title || '').trim()
  const dashIdx = text.indexOf(' - ')
  return dashIdx >= 0 ? text.slice(dashIdx + 3).trim() : text
}

const parseManualNivel3Title = (title) => {
  const text = String(title || '').trim()
  const m = text.match(/^(\d+(?:\.\d+)*)\s+(.+)$/)
  if (!m) return { codigo: '', nombre: text }
  return { codigo: String(m[1] || '').trim(), nombre: String(m[2] || '').trim() }
}

const normalizeDailyEntry = (entry) => {
  if (!entry) return null
  if (typeof entry !== 'object') return null
  const fecha = toYmd(entry.fecha ?? entry.date ?? entry.dia ?? '')
  if (!fecha) return null
  return {
    fecha,
    value: entry.value ?? entry.plan ?? entry.planificado ?? entry.cantidad_plan ?? entry.plan_reasignado ?? 0,
    real: entry.real ?? entry.cantidad_real ?? 0,
  }
}

const parseJsonArray = (raw) => {
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw
      .map(normalizeDailyEntry)
      .filter(Boolean)
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parseJsonArray(parsed)
    } catch {
      return []
    }
  }

  if (typeof raw === 'object') {
    if (Array.isArray(raw.datos)) return parseJsonArray(raw.datos)
    if (Array.isArray(raw.data)) return parseJsonArray(raw.data)

    const out = []
    for (const [k, v] of Object.entries(raw)) {
      const fecha = toYmd(k)
      if (!fecha) continue
      if (typeof v === 'number' || typeof v === 'string') {
        out.push({ fecha, value: v, real: 0 })
      } else if (v && typeof v === 'object') {
        out.push({
          fecha,
          value: v.value ?? v.plan ?? v.planificado ?? v.cantidad_plan ?? v.plan_reasignado ?? 0,
          real: v.real ?? v.cantidad_real ?? 0,
        })
      }
    }
    return out
  }

  return []
}

const parseJsonDataEntriesForMerge = (raw) => {
  if (Array.isArray(raw)) {
    return raw
      .filter((it) => it && typeof it === 'object')
      .map((it) => ({ ...it }))
  }
  if (typeof raw === 'string') {
    const parsed = safeJsonParse(raw, [])
    if (Array.isArray(parsed)) {
      return parsed
        .filter((it) => it && typeof it === 'object')
        .map((it) => ({ ...it }))
    }
    return []
  }
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.datos)) return parseJsonDataEntriesForMerge(raw.datos)
    if (Array.isArray(raw.data)) return parseJsonDataEntriesForMerge(raw.data)
  }
  return []
}

const parseRecursos = (raw) => {
  const recursos = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        })()
      : []

  return recursos
    .map((r) => String(r?.nombre_excel || '').trim())
    .filter(Boolean)
}

const parsePkRangeFromTitle = (titulo) => {
  const text = String(titulo || '')
  const match = text.match(/\((\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s*km\)/i)
  if (!match) return null
  const start = Number(String(match[1]).replace(',', '.'))
  const end = Number(String(match[2]).replace(',', '.'))
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return { start, end }
}

const normalizePatrullaName = (value) => String(value ?? '').trim()

const getPatrullaNameFromRow = (row) =>
  normalizePatrullaName(
    row?.nombre_equipo ??
    row?.name_equipo ??
    row?.nombre ??
    row?.equipo ??
    row?.grupo ??
    ''
  )

const dedupePatrullas = (items) => {
  const seen = new Set()
  const out = []
  for (const item of Array.isArray(items) ? items : []) {
    const nombre = normalizePatrullaName(item)
    if (!nombre) continue
    const key = normalizeText(nombre)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(nombre)
  }
  return out
}

const getTaskPatrullasFromGantt = (task) => {
  const fromTaskResources = Array.isArray(task?.recursos) ? task.recursos : []
  const fromEquiposJson = parseRecursos(task?.equipos_json)
  return dedupePatrullas([...fromTaskResources, ...fromEquiposJson])
}

const getBasePatrullasOptions = () => {
  const fromApi = dedupePatrullas(patrullasProyectoOptions.value)
  return fromApi.length ? fromApi : patrullasFijasOptions
}

const compactPatrullaKey = (value) =>
  normalizeText(value).replace(/[^a-z0-9]/g, '')

const explodePatrullaCandidates = (items) => {
  const out = []
  for (const raw of Array.isArray(items) ? items : []) {
    const text = String(raw ?? '').trim()
    if (!text) continue
    const chunks = text
      .split(/\s*(?:\/|\||;|,|\s+y\s+)\s*/i)
      .map((s) => String(s || '').trim())
      .filter(Boolean)
    if (!chunks.length) continue
    out.push(...chunks)
  }
  return out
}

const selectMatchingPatrullas = (requested, availableOptions) => {
  const mapByKey = new Map()
  const mapByCompactKey = new Map()
  for (const option of Array.isArray(availableOptions) ? availableOptions : []) {
    const normalized = normalizeText(option)
    const compact = compactPatrullaKey(option)
    if (!normalized) continue
    if (!mapByKey.has(normalized)) mapByKey.set(normalized, option)
    if (compact && !mapByCompactKey.has(compact)) mapByCompactKey.set(compact, option)
  }
  const out = []
  const seen = new Set()
  const candidates = explodePatrullaCandidates(requested)
  for (const item of candidates) {
    const key = normalizeText(item)
    const compact = compactPatrullaKey(item)
    if ((!key && !compact) || seen.has(compact || key)) continue
    const matched = mapByKey.get(key) || mapByCompactKey.get(compact)
    if (!matched) continue
    seen.add(compact || key)
    out.push(matched)
  }
  return out
}

const formatPkOption = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  const [intPart, decPart] = n.toFixed(3).split('.')
  if (Number(decPart) === 0) return `${intPart}+000`
  return `${intPart}+${decPart}`
}

const createPrimeraRegistro = () => ({
  horasTraslado: 2,
  pkInicio: null,
  pkFinal: null,
  horasPlanificadas: '',
  totalHorasActividad: '',
  pkAvanceDiario: '',
})

const createCamaraRegistro = () => ({
  horasTraslado: 2,
  pkInicio: null,
  pkFinal: null,
  horasPlanificadas: '',
  totalHorasActividad: '',
  camarasRealizadas: '',
  camarasSeleccionadas: [],
})

const createActividadRegistro = () => ({
  actividad: null,
  actividadEsOtros: false,
  pkInicio: null,
  pkFinal: null,
  horasPlanificadas: '',
  totalHorasActividad: '',
  pkAvanceDiario: '',
  horasTraslado: 2,
  totalHitosInstalados: '',
  totalHitosPintados: '',
  totalLogotiposCambiados: '',
  totalPkPintados: '',
  reposicionPlancheta: '',
  reposicionPilar: '',
  instalacionSenaleticaNueva: '',
  kmRecorridosInspeccion: '',
  totalCalicatasRealizadas: '',
  observaciones: '',
})

const actividadRuleByKey = {
  'senaletica': { requiresPk: true, showsObservaciones: true },
  'corte y retiro linea fuera de servicio': { requiresPk: false, showsObservaciones: true },
  'control de erosiones': { requiresPk: true, showsObservaciones: true },
  'apoyo servidumbre renaca alto': { requiresPk: false, showsObservaciones: true },
  'limpieza canal interior y exterior planta curacavi': { requiresPk: false, showsObservaciones: true },
  'apoyo recorrido inspeccion': { requiresPk: true, showsObservaciones: true },
  'marcacion de oleoducto': { requiresPk: true, showsObservaciones: true },
  'calicatas': { requiresPk: true, showsObservaciones: true },
  'capacitaciones o cursos': { requiresPk: false, showsObservaciones: true },
  'reunion': { requiresPk: false, showsObservaciones: true },
  'trabajos adicionales servidumbre': { requiresPk: true, showsObservaciones: true },
  'retiro y entrega de materiales/herramientas': { requiresPk: false, showsObservaciones: true },
  'mantencion de camionetas': { requiresPk: false, showsObservaciones: true },
  'mantencion de accesos servidumbre': { requiresPk: true, showsObservaciones: true },
  'mantencion de empalmes rectificadores y remoto': { requiresPk: true, showsObservaciones: true },
  'mantencion de porton': { requiresPk: true, showsObservaciones: false },
  'apoyo conejeo': { requiresPk: true, showsObservaciones: true },
}

const getActividadRule = (actividad) => {
  const key = normalizeText(actividad)
  return actividadRuleByKey[key] || { requiresPk: false, showsObservaciones: true }
}

const isActividad = (actividad, target) => normalizeText(actividad) === normalizeText(target)
const actividadRequiresPk = (actividad) => Boolean(getActividadRule(actividad).requiresPk)
const actividadShowsObservaciones = (actividad) => Boolean(getActividadRule(actividad).showsObservaciones)

const inferSegmentByTask = (task) => {
  if (String(task?.manualSegment || '').trim().toLowerCase() === 'actividad') return 'actividad'
  const text = normalizeText([
    task?.nombreTarea,
    task?.contextoContrato,
    task?.contextoNivel,
    task?.codigoEdt,
  ].filter(Boolean).join(' '))
  if (!text) return 'servidumbre'

  const isCamara = /(camara|camaras|cámara|cámaras)/.test(text)
  const isServidumbre = /(servidumbre|desmalezado|acceso|porton|portón|senalet|señalet|pk)/.test(text)

  if (isCamara && !isServidumbre) return 'camaras'
  if (isCamara && isServidumbre) return 'camaras'
  if (isServidumbre) return 'servidumbre'
  return 'servidumbre'
}

const inferAvailableSegmentsByTask = (task) => {
  const detected = inferSegmentByTask(task)
  return {
    actividad: detected === 'actividad',
    servidumbre: detected === 'servidumbre',
    camaras: detected === 'camaras',
  }
}

const buildInitialSegmentToggles = (task) => {
  const detected = inferSegmentByTask(task)
  return {
    actividad: detected === 'actividad',
    servidumbre: detected === 'servidumbre',
    camaras: detected === 'camaras',
  }
}

const getGeoState = (idTarea) => {
  const key = String(idTarea ?? '')
  if (!geoByTask.value[key]) {
    geoByTask.value[key] = {
      loading: false,
      attempted: false,
      error: '',
      lat: null,
      lon: null,
      accuracy: null,
    }
  }
  return geoByTask.value[key]
}

const captureCurrentLocation = (idTarea) => {
  const state = getGeoState(idTarea)
  state.attempted = true
  state.loading = true
  state.error = ''

  if (!navigator?.geolocation) {
    state.loading = false
    state.error = 'Tu navegador no soporta geolocalización.'
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.lat = pos?.coords?.latitude ?? null
      state.lon = pos?.coords?.longitude ?? null
      state.accuracy = pos?.coords?.accuracy ?? null
      state.loading = false
    },
    (err) => {
      state.loading = false
      if (err?.code === 1) state.error = 'Permiso de ubicación denegado.'
      else if (err?.code === 2) state.error = 'Ubicación no disponible.'
      else if (err?.code === 3) state.error = 'Tiempo de espera agotado para ubicación.'
      else state.error = 'Error obteniendo ubicación.'
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  )
}

const hasGeoCoords = (idTarea) => {
  const state = getGeoState(idTarea)
  return Number.isFinite(Number(state.lat)) && Number.isFinite(Number(state.lon))
}

const hasUserGeoCoords = () => {
  return Number.isFinite(Number(geoUser.value.lat)) && Number.isFinite(Number(geoUser.value.lon))
}

const captureUserLocation = () => {
  const state = geoUser.value
  state.attempted = true
  state.loading = true
  state.error = ''

  if (!navigator?.geolocation) {
    state.loading = false
    state.error = 'Tu navegador no soporta geolocalización.'
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.lat = pos?.coords?.latitude ?? null
      state.lon = pos?.coords?.longitude ?? null
      state.accuracy = pos?.coords?.accuracy ?? null
      state.loading = false
    },
    (err) => {
      state.loading = false
      if (err?.code === 1) state.error = 'Permiso de ubicación denegado.'
      else if (err?.code === 2) state.error = 'Ubicación no disponible.'
      else if (err?.code === 3) state.error = 'Tiempo de espera agotado para ubicación.'
      else state.error = 'Error obteniendo ubicación.'
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  )
}

const ensureUserGeo = () => {
  const state = geoUser.value
  if (state.loading || state.attempted || hasUserGeoCoords()) return
  captureUserLocation()
}

const getGeoStatusClass = (idTarea) => {
  const state = getGeoState(idTarea)
  if (hasGeoCoords(idTarea) || hasUserGeoCoords()) return 'ok'
  if (state.loading) return 'pending'
  if (state.attempted && state.error) return 'error'
  if (geoUser.value.loading) return 'pending'
  if (geoUser.value.attempted && geoUser.value.error) return 'error'
  return 'pending'
}

const getGeoStatusIcon = (idTarea) => {
  const state = getGeoState(idTarea)
  if (hasGeoCoords(idTarea) || hasUserGeoCoords()) return 'mdi-map-marker-check-outline'
  if (state.loading) return 'mdi-map-marker-radius-outline'
  if (state.attempted && state.error) return 'mdi-alert-circle-outline'
  if (geoUser.value.loading) return 'mdi-map-marker-radius-outline'
  if (geoUser.value.attempted && geoUser.value.error) return 'mdi-alert-circle-outline'
  return 'mdi-map-marker-outline'
}

const getGeoStatusText = (idTarea) => {
  const state = getGeoState(idTarea)
  if (state.loading) return 'Obteniendo ubicación...'
  if (hasGeoCoords(idTarea)) return 'Ubicación de tarea obtenida correctamente'
  if (geoUser.value.loading) return 'Obteniendo tu ubicación actual...'
  if (hasUserGeoCoords()) return 'Usando tu ubicación actual'
  if (state.attempted && state.error) return state.error
  if (geoUser.value.attempted && geoUser.value.error) return geoUser.value.error
  return 'Ubicación pendiente. Reintentando automáticamente.'
}

const ensureGeoForTask = (idTarea) => {
  const state = getGeoState(idTarea)
  ensureUserGeo()
  if (state.loading) return
  if (state.attempted) return
  if (hasGeoCoords(idTarea)) return
  captureCurrentLocation(idTarea)
}

const DEFAULT_MAP_CENTER = {
  lat: -33.4489,
  lon: -70.6693,
}

const getGeoMapUrl = (idTarea) => {
  const state = getGeoState(idTarea)
  const hasTaskCoords = Number.isFinite(Number(state.lat)) && Number.isFinite(Number(state.lon))
  const hasUserCoords = hasUserGeoCoords()
  const lat = hasTaskCoords
    ? Number(state.lat)
    : hasUserCoords
      ? Number(geoUser.value.lat)
      : DEFAULT_MAP_CENTER.lat
  const lon = hasTaskCoords
    ? Number(state.lon)
    : hasUserCoords
      ? Number(geoUser.value.lon)
      : DEFAULT_MAP_CENTER.lon
  const d = 0.05
  const bbox = `${lon - d}%2C${lat - d}%2C${lon + d}%2C${lat + d}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`
}

const getDailyEntryForTaskFecha = (task, fechaYmd) => {
  const idTarea = String(task?.idTarea ?? '').trim()
  const fecha = toYmd(fechaYmd)
  if (!idTarea || !fecha) return null
  const sourceTask = tareasMapById.value.get(idTarea)
  if (!sourceTask) return null
  const diarios = parseJsonDataEntriesForMerge(sourceTask?.json_data)
  const entry = diarios.find((it) => toYmd(it?.fecha ?? it?.date ?? it?.dia ?? '') === fecha)
  return entry && typeof entry === 'object' ? entry : null
}

const getPlanificadoFromTaskDb = (task, fechaYmd) => {
  const entry = getDailyEntryForTaskFecha(task, fechaYmd)
  if (!entry) return ''
  const v = entry?.value ?? entry?.plan ?? entry?.planificado ?? entry?.cantidad_plan ?? entry?.plan_reasignado
  if (v === null || v === undefined || String(v).trim?.() === '') return ''
  return String(v)
}

const getPkAvanceFromTaskDb = (task, fechaYmd) => {
  const entry = getDailyEntryForTaskFecha(task, fechaYmd)
  if (!entry) return ''
  const pk = entry?.real ?? entry?.cantidad_real ?? entry?.pk_avance_diario ?? entry?.pkAvanceDiario ?? entry?.pk_avance ?? entry?.pkAvance ?? entry?.pk
  if (pk === null || pk === undefined || String(pk).trim?.() === '') return ''
  return String(pk)
}

const removeTaskCard = (idTarea) => {
  const key = String(idTarea ?? '')
  if (!key) return
  const next = new Set(removedTaskIds.value)
  next.add(key)
  removedTaskIds.value = next
  const nextVisible = new Set(forceVisibleTaskIds.value)
  nextVisible.delete(key)
  forceVisibleTaskIds.value = nextVisible
  delete ppdStateByTask.value[key]
  delete geoByTask.value[key]
}

const getPpdDraft = (idTarea, task = null) => {
  const key = String(idTarea ?? '')
  if (!ppdStateByTask.value[key]) {
    const horasPlanificadasDb = task ? getPlanificadoFromTaskDb(task, fechaSeleccionada.value) : ''
    const pkAvanceDb = task ? getPkAvanceFromTaskDb(task, fechaSeleccionada.value) : ''
    const defaultPatrullas = selectMatchingPatrullas(
      getTaskPatrullasFromGantt(task),
      getBasePatrullasOptions()
    )
    const availableSegments = inferAvailableSegmentsByTask(task)
    const toggles = buildInitialSegmentToggles(task)
    toggles.servidumbre = availableSegments.servidumbre ? toggles.servidumbre : false
    toggles.camaras = availableSegments.camaras ? toggles.camaras : false
    ppdStateByTask.value[key] = {
      enabled: false,
      patrullas: defaultPatrullas,
      taskContextHydrated: Boolean(task),
      availableSegments,
      segmentToggles: toggles,
      uiSegments: {
        segmento1: true,
        segmento2: true,
        segmento3: true,
        segmento5: true,
        segmentoDefActividades: false,
      },
      primeraMantencion: [{ ...createPrimeraRegistro(), horasPlanificadas: horasPlanificadasDb, pkAvanceDiario: pkAvanceDb }],
      camaraMantencion: [{ ...createCamaraRegistro(), horasPlanificadas: horasPlanificadasDb, camarasRealizadas: pkAvanceDb }],
      actividad: {
        ...createActividadRegistro(),
        horasPlanificadas: horasPlanificadasDb,
        pkAvanceDiario: pkAvanceDb,
        actividad: normalizeText(String(task?.actividadNombre || '').trim()) === 'otros'
          ? null
          : (String(task?.actividadNombre || '').trim() || null),
        actividadEsOtros: normalizeText(String(task?.actividadNombre || task?.nombreTarea || '').trim()) === 'otros',
      },
    }
  } else if (task && !ppdStateByTask.value[key].taskContextHydrated) {
    // Si el draft se creó sin contexto de tarea, corregimos segmento una sola vez.
    const availableSegments = inferAvailableSegmentsByTask(task)
    ppdStateByTask.value[key].availableSegments = availableSegments
    ppdStateByTask.value[key].segmentToggles = {
      actividad: availableSegments.actividad,
      servidumbre: availableSegments.servidumbre,
      camaras: availableSegments.camaras,
    }
    ppdStateByTask.value[key].taskContextHydrated = true
    if (!ppdStateByTask.value[key].uiSegments) {
      ppdStateByTask.value[key].uiSegments = {
        segmento1: true,
        segmento2: true,
        segmento3: true,
        segmento5: true,
        segmentoDefActividades: false,
      }
    } else {
      if (ppdStateByTask.value[key].uiSegments.segmento5 === undefined) {
        ppdStateByTask.value[key].uiSegments.segmento5 = true
      }
      if (ppdStateByTask.value[key].uiSegments.segmentoDefActividades === undefined) {
        ppdStateByTask.value[key].uiSegments.segmentoDefActividades = false
      }
    }
    if (ppdStateByTask.value[key].actividad?.actividadEsOtros === undefined) {
      const baseActividad = String(task?.actividadNombre || task?.nombreTarea || '').trim()
      ppdStateByTask.value[key].actividad.actividadEsOtros = normalizeText(baseActividad) === 'otros'
    }
    if (!Array.isArray(ppdStateByTask.value[key].patrullas) || ppdStateByTask.value[key].patrullas.length === 0) {
      ppdStateByTask.value[key].patrullas = selectMatchingPatrullas(
        getTaskPatrullasFromGantt(task),
        getBasePatrullasOptions()
      )
    }
    const horasPlanificadasDb = getPlanificadoFromTaskDb(task, fechaSeleccionada.value)
    const pkAvanceDb = getPkAvanceFromTaskDb(task, fechaSeleccionada.value)
    const pm = Array.isArray(ppdStateByTask.value[key].primeraMantencion) ? ppdStateByTask.value[key].primeraMantencion[0] : null
    if (pm) {
      if ((pm.horasPlanificadas ?? '') === '' && horasPlanificadasDb !== '') pm.horasPlanificadas = horasPlanificadasDb
      if ((pm.pkAvanceDiario ?? '') === '' && pkAvanceDb !== '') pm.pkAvanceDiario = pkAvanceDb
    }
    const cm = Array.isArray(ppdStateByTask.value[key].camaraMantencion) ? ppdStateByTask.value[key].camaraMantencion[0] : null
    if (cm) {
      if ((cm.horasPlanificadas ?? '') === '' && horasPlanificadasDb !== '') cm.horasPlanificadas = horasPlanificadasDb
      if ((cm.camarasRealizadas ?? '') === '' && pkAvanceDb !== '') cm.camarasRealizadas = pkAvanceDb
    }
    const act = ppdStateByTask.value[key].actividad
    if (act) {
      if ((act.horasPlanificadas ?? '') === '' && horasPlanificadasDb !== '') act.horasPlanificadas = horasPlanificadasDb
      if ((act.pkAvanceDiario ?? '') === '' && pkAvanceDb !== '') act.pkAvanceDiario = pkAvanceDb
    }
  }
  ensureGeoForTask(idTarea)
  return ppdStateByTask.value[key]
}

const isSegmentAvailable = (task, segmentKey) => {
  const draft = getPpdDraft(task?.idTarea, task)
  return Boolean(draft?.availableSegments?.[segmentKey])
}

const isSegmentVisible = (task, segmentKey) => {
  return isSegmentAvailable(task, segmentKey)
}

const getTaskSubtitle = (task) =>
  isSegmentAvailable(task, 'actividad')
    ? 'Actividad PPD2'
    : isSegmentAvailable(task, 'camaras')
    ? 'Mantención Cámaras'
    : 'Primera Mantención de Servidumbres'

const getActividadNombre = (task) => {
  const draft = getPpdDraft(task?.idTarea, task)
  return String(draft?.actividad?.actividad || task?.actividadNombre || task?.nombreTarea || '').trim()
}

const isActividadOtrosTask = (task) => {
  const draft = getPpdDraft(task?.idTarea, task)
  if (draft?.actividad?.actividadEsOtros === undefined) {
    const baseActividad = String(task?.actividadNombre || task?.nombreTarea || '').trim()
    draft.actividad.actividadEsOtros = normalizeText(baseActividad) === 'otros'
  }
  if (normalizeText(draft?.actividad?.actividad) === 'otros') {
    draft.actividad.actividad = null
  }
  return Boolean(draft?.actividad?.actividadEsOtros)
}

const isUiSegmentOpen = (task, segmentKey) => {
  const draft = getPpdDraft(task?.idTarea, task)
  return Boolean(draft?.uiSegments?.[segmentKey])
}

const setUiSegmentOpen = (task, segmentKey, value) => {
  const draft = getPpdDraft(task?.idTarea, task)
  if (!draft.uiSegments) {
    draft.uiSegments = {
      segmento1: true,
      segmento2: true,
      segmento3: true,
      segmento5: true,
      segmentoDefActividades: false,
    }
  }
  if (draft.uiSegments.segmento5 === undefined) draft.uiSegments.segmento5 = true
  if (draft.uiSegments.segmentoDefActividades === undefined) draft.uiSegments.segmentoDefActividades = false
  draft.uiSegments[segmentKey] = Boolean(value)
}

const toggleUiSegment = (task, segmentKey) => {
  const current = isUiSegmentOpen(task, segmentKey)
  setUiSegmentOpen(task, segmentKey, !current)
}

const getSegmentToggle = (task, segmentKey) => {
  if (!isSegmentAvailable(task, segmentKey)) return false
  const draft = getPpdDraft(task?.idTarea, task)
  return Boolean(draft?.segmentToggles?.[segmentKey])
}

const setSegmentToggle = (task, segmentKey, value) => {
  const draft = getPpdDraft(task?.idTarea, task)
  if (!draft?.availableSegments?.[segmentKey]) return
  if (!draft.segmentToggles) {
    draft.segmentToggles = buildInitialSegmentToggles(task)
  }
  draft.segmentToggles[segmentKey] = Boolean(value)
}

const getPatrullasOptions = (task) => {
  const base = getBasePatrullasOptions()
  void task
  return base
}

const getPkOptions = (task) => {
  const range = parsePkRangeFromTitle(task?.nombreTarea)
  if (!range) return ['PK no definida']
  const midpoint = (range.start + range.end) / 2
  return [range.start, midpoint, range.end].map(formatPkOption)
}

const getCamaraOptions = (task) => {
  const recursos = Array.isArray(task?.recursos) ? task.recursos : []
  const fromRecursos = recursos
    .map((r) => String(r || '').trim())
    .filter((r) => /camara|cámara/i.test(r))
  if (fromRecursos.length) return fromRecursos
  return Array.from({ length: 10 }, (_, i) => `Cámara ${i + 1}`)
}

const getPrimeraRegistros = (idTarea) => getPpdDraft(idTarea).primeraMantencion
const getCamaraRegistros = (idTarea) => getPpdDraft(idTarea).camaraMantencion
const getCantidadCamarasRealizadas = (registro) => {
  const seleccionadas = Array.isArray(registro?.camarasSeleccionadas) ? registro.camarasSeleccionadas.length : 0
  if (seleccionadas > 0) return seleccionadas
  const manual = toNumberIfProvided(registro?.camarasRealizadas)
  return manual === null ? 0 : manual
}

const syncCamarasRealizadas = (registro) => {
  if (!registro || typeof registro !== 'object') return
  const count = Array.isArray(registro.camarasSeleccionadas) ? registro.camarasSeleccionadas.length : 0
  registro.camarasRealizadas = count
}

const addPrimeraRegistro = (task) => {
  const registros = getPrimeraRegistros(task?.idTarea)
  registros.push(createPrimeraRegistro())
}

const removePrimeraRegistro = (idTarea, index) => {
  const registros = getPrimeraRegistros(idTarea)
  if (registros.length <= 1) return
  registros.splice(index, 1)
}

const removeCamaraRegistro = (idTarea, index) => {
  const registros = getCamaraRegistros(idTarea)
  if (registros.length <= 1) return
  registros.splice(index, 1)
}

const tareasMapById = computed(() => {
  const map = new Map()
  const list = Array.isArray(tareasBase.value) ? tareasBase.value : []
  list.forEach((t) => {
    const id = t?.id_tarea
    if (id !== null && id !== undefined && id !== '') {
      map.set(String(id), t)
    }
  })
  return map
})

const buildTaskOption = (task) => {
  const codigo = String(task?.codigo_edt || '').trim()
  const nombre = String(task?.nombre_tarea || '').trim()
  const title = [codigo, nombre].filter(Boolean).join(' - ')
  return {
    value: String(task?.id_tarea ?? ''),
    title: title || `Tarea ${String(task?.id_tarea ?? '')}`,
  }
}

const getChildrenTasks = (parentId) => {
  const parentKey = String(parentId ?? '')
  if (!parentKey) return []
  return (Array.isArray(tareasBase.value) ? tareasBase.value : [])
    .filter((t) => String(t?.id_tarea_padre ?? '') === parentKey)
    .sort((a, b) =>
      String(a?.codigo_edt || '').localeCompare(String(b?.codigo_edt || ''), 'es', { numeric: true })
    )
}

const createTaskOptionsNivel1 = computed(() =>
  (Array.isArray(tareasBase.value) ? tareasBase.value : [])
    .filter((t) => t?.id_tarea_padre === null || t?.id_tarea_padre === undefined || t?.id_tarea_padre === '')
    .sort((a, b) =>
      String(a?.codigo_edt || '').localeCompare(String(b?.codigo_edt || ''), 'es', { numeric: true })
    )
    .map(buildTaskOption)
)

const buildOtrosNivel3Option = (parentId, children = []) => {
  const parentTask = tareasMapById.value.get(String(parentId ?? ''))
  const parentCode = String(parentTask?.codigo_edt || '').trim()

  let maxSuffix = 0
  for (const child of children) {
    const childCode = String(child?.codigo_edt || '').trim()
    const match = childCode.match(/(?:^|\.)((\d+))$/)
    const suffix = Number(match?.[1])
    if (Number.isFinite(suffix)) maxSuffix = Math.max(maxSuffix, suffix)
  }

  const nextSuffix = maxSuffix > 0 ? maxSuffix + 1 : 1
  const nextCode = parentCode ? `${parentCode}.${nextSuffix}` : String(nextSuffix)
  return {
    value: `__manual_n3__:${String(parentId ?? '')}:otros`,
    title: `${nextCode} Otros`,
  }
}

const createTaskOptionsNivel2 = computed(() => {
  const nivel1 = createTaskSelection.value.nivel1
  const children = getChildrenTasks(nivel1)
  if (!nivel1) return []
  return children.map(buildTaskOption)
})

const createTaskOptionsNivel3 = computed(() => {
  const nivel2 = createTaskSelection.value.nivel2
  if (!nivel2) return []
  const childrenTasks = getChildrenTasks(nivel2)
  const baseOptions = childrenTasks.map(buildTaskOption)
  const otrosOptions = baseOptions.filter((opt) => normalizeText(extractNameFromOptionTitle(opt?.title || '')) === 'otros')
  const normalOptions = baseOptions.filter((opt) => normalizeText(extractNameFromOptionTitle(opt?.title || '')) !== 'otros')
  const orderedOptions = [...normalOptions, ...otrosOptions]
  const hasOtros = otrosOptions.length > 0
  if (hasOtros) return orderedOptions
  return [...orderedOptions, buildOtrosNivel3Option(nivel2, childrenTasks)]
})

const openCreateTaskModal = () => {
  createTaskSelection.value = { nivel1: null, nivel2: null, nivel3: null }
  showCreateTaskModal.value = true
}

const closeCreateTaskModal = () => {
  showCreateTaskModal.value = false
}

const confirmCreateTask = async () => {
  const key = String(createTaskSelection.value.nivel3 ?? '')
  if (!key) return
  const taskKey = buildPpdTaskKey({ idTarea: key }, fechaSeleccionada.value)
  clearPpdDeletedKey(taskKey)

  if (key.startsWith('__manual_n3__:')) {
    const nivel1Option = getOptionByValue(createTaskOptionsNivel1.value, createTaskSelection.value.nivel1)
    const nivel2Option = getOptionByValue(createTaskOptionsNivel2.value, createTaskSelection.value.nivel2)
    const nivel3Option = getOptionByValue(createTaskOptionsNivel3.value, createTaskSelection.value.nivel3)
    const parsedManual = parseManualNivel3Title(nivel3Option?.title || '')
    const exists = manualCreatedTasks.value.some((t) => String(t?.idTarea ?? '') === key)
    if (!exists) {
      manualCreatedTasks.value.push({
        idTarea: key,
        idPadre: createTaskSelection.value.nivel2,
        esPadre: false,
        codigoEdt: parsedManual.codigo || '',
        nombreTarea: parsedManual.nombre || 'Otros',
        actividadNombre: parsedManual.nombre || 'Otros',
        manualSegment: 'actividad',
        unidad: '',
        proyectoNombre: '',
        planDia: 0,
        realDia: 0,
        contextoContrato: extractNameFromOptionTitle(nivel1Option?.title || ''),
        contextoNivel: extractNameFromOptionTitle(nivel2Option?.title || ''),
        tieneEntradaDiaria: true,
        recursos: [],
        scopeFecha: toYmd(fechaSeleccionada.value),
        scopeProyecto: String(normalizeProyectoId(proyectoSeleccionado.value) ?? '').trim(),
        scopeCliente: String(clienteSeleccionado.value ?? '').trim(),
      })
    }
  }

  const nextVisible = new Set(forceVisibleTaskIds.value)
  nextVisible.add(key)
  forceVisibleTaskIds.value = nextVisible

  const nextRemoved = new Set(removedTaskIds.value)
  nextRemoved.delete(key)
  removedTaskIds.value = nextRemoved

  showCreateTaskModal.value = false
  await syncSurveysPpdByFecha()
}

const getTaskHierarchyNames = (task) => {
  const out = []
  const visited = new Set()
  let current = task
  let guard = 0
  while (current && guard < 30) {
    guard += 1
    const key = String(current?.id_tarea ?? '')
    if (!key || visited.has(key)) break
    visited.add(key)
    const nombre = String(current?.nombre_tarea || '').trim()
    if (nombre) out.unshift(nombre)
    const parentId = current?.id_tarea_padre
    if (parentId === null || parentId === undefined || parentId === '') break
    current = tareasMapById.value.get(String(parentId))
  }
  return out
}

const tareasTarjeta = computed(() => {
  const fecha = toYmd(fechaSeleccionada.value)
  if (!fecha) return []
  const scopeProyecto = String(normalizeProyectoId(proyectoSeleccionado.value) ?? '').trim()
  const scopeCliente = String(clienteSeleccionado.value ?? '').trim()

  const idPadres = new Set(
    (Array.isArray(tareasBase.value) ? tareasBase.value : [])
      .map((t) => t?.id_tarea_padre)
      .filter((v) => v !== null && v !== undefined && v !== '')
      .map((v) => String(v))
  )

  const baseTasks = (Array.isArray(tareasBase.value) ? tareasBase.value : [])
    .map((t) => {
      const diarios = parseJsonArray(t?.json_data)
      const diariosFecha = diarios.filter((d) => toYmd(d?.fecha) === fecha)

      const planDia = diariosFecha.reduce(
        (acc, d) =>
          acc +
          toNumberSafe(
            d?.value ??
            d?.plan ??
            d?.planificado ??
            d?.cantidad_plan ??
            d?.plan_reasignado
          ),
        0
      )
      const realDia = diariosFecha.reduce(
        (acc, d) => acc + toNumberSafe(d?.real ?? d?.cantidad_real),
        0
      )
      const jerarquia = getTaskHierarchyNames(t)
      const contextoContrato = jerarquia[0] || ''
      const contextoNivel = jerarquia[1] || ''

      return {
        idTarea: t?.id_tarea,
        idPadre: t?.id_tarea_padre,
        esPadre: idPadres.has(String(t?.id_tarea)),
        codigoEdt: t?.codigo_edt || '',
        nombreTarea: t?.nombre_tarea || 'Sin nombre',
        unidad: t?.unidad || '',
        proyectoNombre: t?.nombre_proyecto || '',
        planDia,
        realDia,
        contextoContrato,
        contextoNivel,
        tieneEntradaDiaria: diariosFecha.length > 0,
        recursos: parseRecursos(t?.equipos_json),
      }
    })
    .filter(
      (t) =>
        !t.esPadre &&
        (t.planDia > 0 || t.realDia > 0 || t.tieneEntradaDiaria || forceVisibleTaskIds.value.has(String(t.idTarea ?? '')))
    )

  const manualScoped = manualCreatedTasks.value.filter((t) => {
    const tFecha = String(t?.scopeFecha || fecha)
    const tProyecto = String(t?.scopeProyecto || scopeProyecto)
    const tCliente = String(t?.scopeCliente || scopeCliente)
    return tFecha === fecha && tProyecto === scopeProyecto && tCliente === scopeCliente
  })

  return [...baseTasks, ...manualScoped]
    .filter((t) => !removedTaskIds.value.has(String(t.idTarea ?? '')))
    .sort((a, b) => {
      const edtCmp = String(a.codigoEdt || '').localeCompare(String(b.codigoEdt || ''), 'es', { numeric: true })
      if (edtCmp !== 0) return edtCmp
      return String(a.nombreTarea || '').localeCompare(String(b.nombreTarea || ''), 'es', { sensitivity: 'base' })
    })
})

const resumenFecha = computed(() => {
  const total = tareasTarjeta.value.length
  const fecha = toYmd(fechaSeleccionada.value) || 'sin fecha'
  return `PPD2: ${total} tarea(s) para ${fecha}.`
})

const syncInfoText = computed(() => {
  if (syncSummary.value.loading) {
    const fecha = toYmd(fechaSeleccionada.value) || syncSummary.value.fecha || 'sin fecha'
    return `Sincronizando surveys PPD para ${fecha}...`
  }
  if (!syncSummary.value.fecha) return ''
  const { fecha, total, existentes, creados, errores, detalle } = syncSummary.value
  if (!total) return `Surveys PPD ${fecha}: sin tareas para crear.`
  if (!errores) return `Surveys PPD ${fecha}: ${total} tarea(s) sincronizadas (${existentes} existentes, ${creados} creadas).`
  const motivo = String(detalle || '').trim()
  return motivo
    ? `Surveys PPD ${fecha}: ${total} tarea(s), ${existentes} existentes, ${creados} creadas y ${errores} pendientes. Motivo: ${motivo}`
    : `Surveys PPD ${fecha}: ${total} tarea(s), ${existentes} existentes, ${creados} creadas y ${errores} pendientes de crear.`
})

const syncInfoType = computed(() => {
  if (syncSummary.value.loading) return 'info'
  if (!syncSummary.value.fecha) return 'info'
  if (syncSummary.value.errores > 0) return 'warning'
  return 'success'
})

const buildPpdTaskKey = (task, fechaYmd) => {
  const fecha = toYmd(fechaYmd)
  const idProyecto = String(normalizeProyectoId(proyectoSeleccionado.value) ?? '').trim()
  const idCliente = String(clienteSeleccionado.value ?? '').trim()
  const idTarea = String(task?.idTarea ?? '').trim()
  return [fecha, idProyecto, idCliente, idTarea].join('|')
}

const parsePpdTaskKey = (taskKey) => {
  const raw = String(taskKey || '').trim()
  if (!raw) return null
  const parts = raw.split('|')
  if (parts.length < 4) return null
  const [fecha, idProyecto, idCliente] = parts
  const idTarea = parts.slice(3).join('|').trim()
  if (!fecha || !idProyecto || !idCliente || !idTarea) return null
  return {
    fecha: String(fecha).trim(),
    idProyecto: String(idProyecto).trim(),
    idCliente: String(idCliente).trim(),
    idTarea,
  }
}

const upsertManualTasksFromSurveys = (rows = [], fechaYmd = '') => {
  const fecha = toYmd(fechaYmd) || toYmd(fechaSeleccionada.value)
  const scopeProyecto = String(normalizeProyectoId(proyectoSeleccionado.value) ?? '').trim()
  const scopeCliente = String(clienteSeleccionado.value ?? '').trim()
  if (!fecha || !scopeProyecto || !scopeCliente) return

  for (const survey of Array.isArray(rows) ? rows : []) {
    const body = getBodyExecFromSurvey(survey)
    const taskRows = extractTaskRowsFromSurvey(survey)
    const taskKeys = extractTaskKeysFromSurvey(survey)
    for (let idx = 0; idx < taskRows.length; idx += 1) {
      const tarea = taskRows[idx] || {}
      const parsed = parsePpdTaskKey(taskKeys[idx] || '')
      if (!parsed) continue
      if (parsed.fecha !== fecha || parsed.idProyecto !== scopeProyecto || parsed.idCliente !== scopeCliente) continue
      if (!String(parsed.idTarea).startsWith('__manual_n3__:')) continue

      const exists = manualCreatedTasks.value.some((t) => {
        const sameTask = String(t?.idTarea ?? '') === parsed.idTarea
        const sameFecha = String(t?.scopeFecha || '') === fecha
        const sameProyecto = String(t?.scopeProyecto || '') === scopeProyecto
        const sameCliente = String(t?.scopeCliente || '') === scopeCliente
        return sameTask && sameFecha && sameProyecto && sameCliente
      })
      if (exists) continue

      const nombre = String(tarea?.nombre_tarea || tarea?.actividad_nombre || 'Otros').trim() || 'Otros'
      const draft = body?.ppd_web?.tasks?.[String(parsed.idTarea)] || {}

      manualCreatedTasks.value.push({
        idTarea: parsed.idTarea,
        idPadre: tarea?.id_tarea_padre ?? null,
        esPadre: false,
        codigoEdt: String(tarea?.codigo_edt || '').trim(),
        nombreTarea: nombre,
        actividadNombre: String(tarea?.actividad_nombre || nombre).trim() || nombre,
        manualSegment: 'actividad',
        unidad: String(tarea?.unidad || '').trim(),
        proyectoNombre: String(tarea?.proyecto_nombre || '').trim(),
        planDia: toNumberSafe(tarea?.plan_dia),
        realDia: toNumberSafe(tarea?.real_dia),
        contextoContrato: String(tarea?.contexto_contrato || '').trim(),
        contextoNivel: String(tarea?.contexto_nivel || '').trim(),
        tieneEntradaDiaria: true,
        recursos: Array.isArray(tarea?.recursos) ? tarea.recursos : [],
        scopeFecha: fecha,
        scopeProyecto,
        scopeCliente,
      })

      const draftKey = String(parsed.idTarea)
      if (draft && typeof draft === 'object') {
        ppdStateByTask.value[draftKey] = deepClone(draft)
      }
    }
  }
}

const getSurveyIdByTask = (task) => {
  const key = buildPpdTaskKey(task, fechaSeleccionada.value)
  return ppdSurveyByTaskKey.value?.[key]?.id_survey || ''
}

const deleteSurveyDialogText = computed(() => {
  const task = deleteSurveyTarget.value
  if (!task) return '¿Realmente quieres eliminar este survey?'
  const surveyId = getSurveyIdByTask(task)
  if (surveyId) {
    return '¿Realmente quieres eliminar esta Tarea?'
  }
  return 'Esta tarea no tiene survey asociado todavía. ¿Quieres quitarla de la vista actual?'
})

const openDeleteSurveyDialog = (task) => {
  deleteSurveyTarget.value = task || null
  showDeleteSurveyDialog.value = true
}

const closeDeleteSurveyDialog = () => {
  if (deletingSurvey.value) return
  showDeleteSurveyDialog.value = false
  deleteSurveyTarget.value = null
}

const removeFechaFromGanttTareaV3 = async (idTareaRaw, fechaYmd) => {
  const idTarea = String(idTareaRaw ?? '').trim()
  const fecha = toYmd(fechaYmd)
  if (!idTarea || !fecha || idTarea.startsWith('__manual_n3__:')) return

  const sourceTask = tareasMapById.value.get(idTarea)
  const currentJson = parseJsonDataEntriesForMerge(sourceTask?.json_data)
  const nextJson = currentJson.filter(
    (it) => toYmd(it?.fecha ?? it?.date ?? it?.dia ?? '') !== fecha
  )

  const idTareaNum = Number(idTarea)
  const payload = {
    id_tarea: Number.isFinite(idTareaNum) ? idTareaNum : idTarea,
    replace_json_data: true,
    json_data: nextJson,
  }

  await apiAxios.put('/tareas/updTareasV3', payload, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (sourceTask) sourceTask.json_data = nextJson
}

const confirmDeleteSurvey = async () => {
  const task = deleteSurveyTarget.value
  if (!task) {
    closeDeleteSurveyDialog()
    return
  }

  deletingSurvey.value = true
  errorCarga.value = ''
  try {
    const fecha = toYmd(fechaSeleccionada.value)
    const taskId = String(task?.idTarea ?? '').trim()
    const taskKey = buildPpdTaskKey(task, fecha)
    const scopeKey = buildPpdScopeKey(fecha)
    const idUser = Number(getCurrentUserId() || 0)

    const rowsRawForDelete = await getPpdSurveysForFecha(fecha)
    const rowsForDelete = await hydrateSurveyTaskKeys(rowsRawForDelete)

    const scopeCandidates = rowsForDelete
      .filter((s) => Number(s?.id_user ?? s?.id_user_creacion ?? 0) === idUser)
      .filter((s) => {
        const sk = String(s?.__ppd_scope_key || extractScopeKeyFromSurvey(s) || '').trim()
        if (sk) return sk === scopeKey
        return true
      })
      .sort((a, b) => Number(b?.id_survey || 0) - Number(a?.id_survey || 0))

    let targetSurvey =
      scopeCandidates.find((s) =>
        extractTaskRowsFromSurvey(s).some(
          (row) => String(row?.id_tarea ?? row?.id ?? '').trim() === taskId
        )
      ) || null

    if (!targetSurvey) {
      const surveyIdHint = Number(getSurveyIdByTask(task) || 0)
      if (surveyIdHint > 0) {
        targetSurvey = rowsForDelete.find((s) => Number(s?.id_survey || 0) === surveyIdHint) || null
      }
    }

    if (!targetSurvey) {
      // Si no hay survey asociado, se quita solo de la vista local sin error.
      await removeFechaFromGanttTareaV3(task?.idTarea, fecha)
      manualCreatedTasks.value = manualCreatedTasks.value.filter((t) => {
        const sameTask = String(t?.idTarea ?? '') === String(task?.idTarea ?? '')
        const sameFecha = String(t?.scopeFecha || '') === toYmd(fechaSeleccionada.value)
        const sameProyecto = String(t?.scopeProyecto || '') === String(normalizeProyectoId(proyectoSeleccionado.value) ?? '').trim()
        const sameCliente = String(t?.scopeCliente || '') === String(clienteSeleccionado.value ?? '').trim()
        return !(sameTask && sameFecha && sameProyecto && sameCliente)
      })
      markPpdDeletedKey(taskKey)
      removeTaskCard(task?.idTarea)
      showDeleteSurveyDialog.value = false
      deleteSurveyTarget.value = null
      return
    }

    const surveyId = Number(targetSurvey?.id_survey || 0)
    if (!surveyId) {
      throw new Error('Survey inválido para eliminar.')
    }

    const body = getBodyExecFromSurvey(targetSurvey || {})
    const taskRows = extractTaskRowsFromSurvey(targetSurvey || {})
    const filteredRows = taskRows.filter(
      (row) => String(row?.id_tarea ?? row?.id ?? '').trim() !== taskId
    )

    if (!taskRows.length) {
      throw new Error('El survey no contiene tareas en body_exec para actualizar.')
    }

    if (filteredRows.length > 0) {
      const nextBody = {
        ...body,
        generated_at: new Date().toISOString(),
        tasks: filteredRows,
        ppd_web: {
          ...(body?.ppd_web || {}),
          tasks: Object.fromEntries(
            Object.entries(body?.ppd_web?.tasks || {}).filter(([k]) => String(k).trim() !== taskId)
          ),
        },
      }
      await apiAxios.put(`/survey/${surveyId}`, {
        estado_srv: targetSurvey?.estado_srv || 'Pre Creado',
        body_exec: JSON.stringify(nextBody),
        fecha_real_ini: targetSurvey?.fecha_real_ini || null,
        fecha_ejec_fin: targetSurvey?.fecha_ejec_fin || null,
        latitud: targetSurvey?.latitud ?? null,
        longitud: targetSurvey?.longitud ?? null,
      })
    } else {
      await apiAxios.post('/survey/DelSurvey/', { id_survey: surveyId })
    }

    // Eliminar solo el día seleccionado en Gantt V3 para la tarea.
    await removeFechaFromGanttTareaV3(taskId, fecha)

    // [PPD2-ROLLBACK-MARK-2026-04-21] Al eliminar, también bloqueamos recreación automática.
    manualCreatedTasks.value = manualCreatedTasks.value.filter((t) => {
      const sameTask = String(t?.idTarea ?? '') === String(task?.idTarea ?? '')
      const sameFecha = String(t?.scopeFecha || '') === toYmd(fechaSeleccionada.value)
      const sameProyecto = String(t?.scopeProyecto || '') === String(normalizeProyectoId(proyectoSeleccionado.value) ?? '').trim()
      const sameCliente = String(t?.scopeCliente || '') === String(clienteSeleccionado.value ?? '').trim()
      return !(sameTask && sameFecha && sameProyecto && sameCliente)
    })
    markPpdDeletedKey(taskKey)

    const nextMap = { ...(ppdSurveyByTaskKey.value || {}) }
    delete nextMap[taskKey]
    ppdSurveyByTaskKey.value = nextMap

    removeTaskCard(task?.idTarea)
    showDeleteSurveyDialog.value = false
    deleteSurveyTarget.value = null
  } catch (e) {
    errorCarga.value = `No se pudo eliminar el survey: ${summarizeSyncError(e)}`
  } finally {
    deletingSurvey.value = false
  }
}

const getCurrentUserId = () => {
  const pickId = (obj) => {
    const direct = Number(obj?.id_user || obj?.id || 0)
    if (direct > 0) return direct
    const nested = Number(obj?.userDetail?.id_user || obj?.user?.id_user || obj?.user?.id || 0)
    if (nested > 0) return nested
    return 0
  }

  const fromStore = Number(userDetailStore?.userDetail?.id_user || 0)
  if (fromStore > 0) return fromStore
  try {
    const raw = JSON.parse(localStorage.getItem('userDetail') || '{}')
    const fromLocal = pickId(raw)
    if (fromLocal > 0) return fromLocal
  } catch {
    // noop
  }
  try {
    const rawUser = JSON.parse(localStorage.getItem('user') || '{}')
    const fromUser = pickId(rawUser)
    if (fromUser > 0) return fromUser
  } catch {
    // noop
  }
  try {
    const rawAuth = JSON.parse(localStorage.getItem('auth') || '{}')
    const fromAuth = pickId(rawAuth)
    if (fromAuth > 0) return fromAuth
  } catch {
    // noop
  }
  return 0
}

const summarizeSyncError = (err) => {
  const message =
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    String(err || '')
  return String(message || '').trim()
}

const buildPpdScopeKey = (fechaYmd) => {
  const fecha = toYmd(fechaYmd)
  const idProyecto = String(normalizeProyectoId(proyectoSeleccionado.value) ?? '').trim()
  const idCliente = String(clienteSeleccionado.value ?? '').trim()
  const idUser = String(getCurrentUserId() || '').trim()
  return [fecha, idProyecto, idCliente, idUser].join('|')
}

const getBodyExecFromSurvey = (survey) => (
  safeJsonParse(survey?.__ppd_body_exec ?? survey?.body_exec, {}) || {}
)

const extractTaskRowsFromSurvey = (survey) => {
  const body = getBodyExecFromSurvey(survey)
  if (Array.isArray(body?.tasks)) return body.tasks
  if (body?.tarea && typeof body.tarea === 'object') return [body.tarea]
  return []
}

const extractScopeKeyFromSurvey = (survey) => {
  const body = getBodyExecFromSurvey(survey)
  const metaScope = String(body?.meta?.ppd_scope_key || '').trim()
  if (metaScope) return metaScope
  const fecha = toYmd(body?.meta?.fecha || survey?.fecha_plan_ini || survey?.fecha_plan_fin)
  const idProyecto = String(body?.meta?.id_proyecto ?? survey?.id_proyecto ?? '').trim()
  const idCliente = String(body?.meta?.id_empresa_cliente ?? survey?.id_empresa_cliente ?? '').trim()
  const idUserRaw = survey?.id_user ?? survey?.id_user_creacion ?? getCurrentUserId() ?? ''
  const idUser = String(idUserRaw).trim()
  if (!fecha || !idProyecto || !idCliente || !idUser) return ''
  return [fecha, idProyecto, idCliente, idUser].join('|')
}

const extractTaskKeysFromSurvey = (survey) => {
  const body = getBodyExecFromSurvey(survey)
  const direct = String(body?.meta?.ppd_task_key || '').trim()
  if (direct) return [direct]

  const fecha = toYmd(body?.meta?.fecha || survey?.fecha_plan_ini || survey?.fecha_plan_fin)
  const idProyecto = String(body?.meta?.id_proyecto ?? survey?.id_proyecto ?? '').trim()
  const idCliente = String(body?.meta?.id_empresa_cliente ?? survey?.id_empresa_cliente ?? '').trim()
  if (!fecha || !idProyecto || !idCliente) return []

  const tasks = extractTaskRowsFromSurvey(survey)
  const keys = []
  for (const row of tasks) {
    const idTarea = String(row?.id_tarea ?? row?.id ?? '').trim()
    if (!idTarea) continue
    keys.push([fecha, idProyecto, idCliente, idTarea].join('|'))
  }
  return keys
}

const buildPpdBodyExecFromTasks = (tasks, fechaYmd) => {
  const fecha = toYmd(fechaYmd)
  const idProyecto = Number(normalizeProyectoId(proyectoSeleccionado.value) || 0) || null
  const idCliente = Number(clienteSeleccionado.value || 0) || null
  const idUser = Number(getCurrentUserId() || 0) || null
  const list = Array.isArray(tasks) ? tasks : []
  const taskRows = list.map((task) => ({
    id_tarea: String(task?.idTarea ?? '').trim(),
    id_tarea_padre: task?.idPadre ?? null,
    codigo_edt: task?.codigoEdt || '',
    nombre_tarea: task?.nombreTarea || '',
    unidad: task?.unidad || '',
    proyecto_nombre: task?.proyectoNombre || '',
    actividad_nombre: task?.actividadNombre || '',
    contexto_contrato: task?.contextoContrato || '',
    contexto_nivel: task?.contextoNivel || '',
    plan_dia: toNumberSafe(task?.planDia),
    real_dia: toNumberSafe(task?.realDia),
    recursos: Array.isArray(task?.recursos) ? task.recursos : [],
  }))
  const draftsByTask = {}
  for (const task of list) {
    const idTarea = String(task?.idTarea ?? '').trim()
    if (!idTarea) continue
    draftsByTask[idTarea] = deepClone(getPpdDraft(task?.idTarea, task))
  }
  return {
    source: PPD_SYNC_SOURCE,
    version: 2,
    generated_at: new Date().toISOString(),
    meta: {
      ppd_scope_key: buildPpdScopeKey(fecha),
      fecha,
      id_template: PPD_TEMPLATE_ID,
      id_user: idUser,
      id_proyecto: idProyecto,
      id_empresa_cliente: idCliente,
    },
    tasks: taskRows,
    ppd_web: {
      tasks: draftsByTask,
    },
  }
}

const getTemplateMeta87 = async () => {
  if (ppdTemplateMetaCache.value) return ppdTemplateMetaCache.value
  if (ppdTemplateMetaPromise) return ppdTemplateMetaPromise
  ppdTemplateMetaPromise = (async () => {
  const getAllTipoSrvIds = async () => {
    if (Array.isArray(ppdAllTipoSrvIdsCache.value)) return ppdAllTipoSrvIdsCache.value
    if (ppdAllTipoSrvIdsPromise) return ppdAllTipoSrvIdsPromise
    ppdAllTipoSrvIdsPromise = (async () => {
    const out = new Set()
    try {
      const { data: areasRaw } = await apiAxios.get('/servicio/leanglobal/obtenerAreas?id_empresa=2')
      const areas = Array.isArray(areasRaw) ? areasRaw : []
      for (const area of areas) {
        const idArea = Number(area?.id_area || 0)
        if (!idArea) continue
        try {
          const { data: tiposRaw } = await apiAxios.get(`/servicio/leanglobal/obtenerTipoTemplate?id_area=${idArea}`)
          const tipos = Array.isArray(tiposRaw) ? tiposRaw : []
          for (const tipo of tipos) {
            const idTipo = Number(tipo?.id_tipo_srv || 0)
            if (idTipo) out.add(idTipo)
          }
        } catch {
          // ignorar área y continuar
        }
      }
    } catch {
      // ignorar y usar fallback local
    }

    // fallback básico para no quedar sin búsqueda si falla áreas/tipos.
    if (!out.size) {
      for (let i = 1; i <= 120; i += 1) out.add(i)
    }

    ppdAllTipoSrvIdsCache.value = Array.from(out)
    return ppdAllTipoSrvIdsCache.value
    })()
    try {
      return await ppdAllTipoSrvIdsPromise
    } finally {
      ppdAllTipoSrvIdsPromise = null
    }
  }

  const findTemplateRowFromTsrv = async (templateId, preferredTipo = null) => {
    const tid = Number(templateId || 0)
    if (!tid) return null
    if (ppdTemplateRowCache.value[tid]) return ppdTemplateRowCache.value[tid]
    if (ppdTemplateRowPromises.has(tid)) return ppdTemplateRowPromises.get(tid)
    const rowPromise = (async () => {

    const findInRows = (rows) =>
      (Array.isArray(rows) ? rows : []).find((t) => Number(t?.id_template) === tid) || null

    if (preferredTipo) {
      try {
        const { data } = await apiAxios.get(`/servicio/leanglobal/obtenerTemplates?id_tipo_srv=${preferredTipo}`)
        const hit = findInRows(data)
        if (hit) {
          ppdTemplateRowCache.value[tid] = hit
          return hit
        }
      } catch {
        // continuar con búsqueda global
      }
    }

    try {
      const tipoIds = await getAllTipoSrvIds()
      for (const idTipo of tipoIds) {
        if (!Number(idTipo)) continue
        try {
          const { data: templates } = await apiAxios.get(`/servicio/leanglobal/obtenerTemplates?id_tipo_srv=${idTipo}`)
          const hit = findInRows(templates)
          if (hit) {
            ppdTemplateRowCache.value[tid] = hit
            return hit
          }
        } catch {
          // ignorar tipo y continuar
        }
      }
    } catch {
      // ignorar y devolver null
    }
    return null
    })()
    ppdTemplateRowPromises.set(tid, rowPromise)
    try {
      return await rowPromise
    } finally {
      ppdTemplateRowPromises.delete(tid)
    }
  }

  const getFallbackFlowTmpl = async () => {
    if (ppdFallbackFlowTmpl.value !== undefined) return ppdFallbackFlowTmpl.value
    const tpl = await findTemplateRowFromTsrv(FLOW_FALLBACK_TEMPLATE_ID, 1)
    ppdFallbackFlowTmpl.value = Number(tpl?.id_flow_tmpl || 0) || null
    return ppdFallbackFlowTmpl.value
  }

  const defaultMeta = {
    id_tipo_srv: 87,
    id_flow_tmpl: null,
    header_seed: {},
    body_seed: null,
    approval_seed: {},
  }

  // Buscar metadata directamente desde el registro template (tsrv_templates).
  const tpl = await findTemplateRowFromTsrv(PPD_TEMPLATE_ID, 87)
  if (tpl) {
    const fallbackFlow = await getFallbackFlowTmpl()
    const meta = {
      id_tipo_srv: Number(tpl?.id_tipo_srv || 87) || 87,
      id_flow_tmpl: Number(tpl?.id_flow_tmpl || 0) || fallbackFlow || null,
      header_seed: safeJsonParse(tpl?.header_seed, {}),
      body_seed: safeJsonParse(tpl?.body_seed, { segmentos: [] }) || { segmentos: [] },
      approval_seed: safeJsonParse(tpl?.approval_seed, {}),
    }
    ppdTemplateMetaCache.value = meta
    return meta
  }

  // No bloquear creación: usar fallback mínimo y priorizar body_exec desde web.
  defaultMeta.id_flow_tmpl = await getFallbackFlowTmpl()
  ppdTemplateMetaCache.value = defaultMeta
  return defaultMeta
  })()
  try {
    return await ppdTemplateMetaPromise
  } finally {
    ppdTemplateMetaPromise = null
  }
}

const getPpdSurveysForFecha = async (fechaYmd) => {
  const fecha = toYmd(fechaYmd)
  const idProyecto = String(normalizeProyectoId(proyectoSeleccionado.value) ?? '').trim()
  const idCliente = String(clienteSeleccionado.value ?? '').trim()
  if (!fecha || !idProyecto) return []

  const params = {
    fecha_desde: fecha,
    fecha_hasta: fecha,
    'ts.id_empresa_cliente': idCliente || '',
    'ts.id_proyecto': idProyecto,
    'ts.id_template': PPD_TEMPLATE_ID,
  }
  const [v3Resp, legacyResp] = await Promise.allSettled([
    apiAxios.get('/servicio/leanglobal/procesosSurveyV3', { params }),
    apiAxios.get('/servicio/leanglobal/procesosSurvey'),
  ])

  const v3Rows =
    v3Resp.status === 'fulfilled'
      ? normalizarPayload(v3Resp.value?.data).filter((s) => Number(s?.id_template) === PPD_TEMPLATE_ID)
      : []

  const legacyRowsRaw =
    legacyResp.status === 'fulfilled'
      ? normalizarPayload(legacyResp.value?.data)
      : []
  const legacyRows = legacyRowsRaw.filter((s) => {
    const tplOk = Number(s?.id_template) === PPD_TEMPLATE_ID
    const proyOk = String(s?.id_proyecto ?? '').trim() === idProyecto
    const cliOk = !idCliente || String(s?.id_empresa_cliente ?? '').trim() === idCliente
    const ini = toYmd(s?.fecha_plan_ini)
    const fin = toYmd(s?.fecha_plan_fin)
    const fechaOk = ini === fecha || fin === fecha
    return tplOk && proyOk && cliOk && fechaOk
  })

  const merged = {}
  for (const s of [...v3Rows, ...legacyRows]) {
    const id = String(s?.id_survey ?? '')
    if (id) {
      merged[id] = s
      continue
    }
    const key = `${String(s?.id_template ?? '')}|${String(s?.id_proyecto ?? '')}|${String(s?.id_empresa_cliente ?? '')}|${toYmd(s?.fecha_plan_ini) || toYmd(s?.fecha_plan_fin)}`
    merged[key] = s
  }
  return Object.values(merged)
}

const hydrateSurveyTaskKeys = async (rows) => {
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) return []

  const unresolved = []
  for (const survey of list) {
    const keysDirect = extractTaskKeysFromSurvey(survey)
    if (keysDirect.length) {
      survey.__ppd_task_keys = keysDirect
      survey.__ppd_task_key = keysDirect[0] || ''
      survey.__ppd_scope_key = extractScopeKeyFromSurvey(survey)
      survey.__ppd_body_exec = safeJsonParse(survey?.body_exec, null)
      continue
    }
    const idSurvey = Number(survey?.id_survey || 0)
    if (!idSurvey) continue
    const cacheHit = String(ppdSurveyTaskKeyCache.value[idSurvey] || '').trim()
    if (cacheHit) {
      survey.__ppd_task_keys = [cacheHit]
      survey.__ppd_task_key = cacheHit
      continue
    }
    unresolved.push(survey)
  }

  if (unresolved.length) {
    const detailResults = await Promise.allSettled(
      unresolved.map((survey) =>
        apiAxios.get(`/servicio/leanglobal/procesosSurveyDetail?id_survey=${Number(survey?.id_survey || 0)}`)
      )
    )

    for (let i = 0; i < unresolved.length; i += 1) {
      const survey = unresolved[i]
      const result = detailResults[i]
      if (result.status !== 'fulfilled') continue
      const detailRows = normalizarPayload(result.value?.data)
      const detail = Array.isArray(detailRows) && detailRows.length ? detailRows[0] : null
      const merged = { ...survey, ...detail }
      const keys = extractTaskKeysFromSurvey(merged)
      if (!keys.length) continue
      survey.__ppd_task_keys = keys
      survey.__ppd_task_key = keys[0] || ''
      survey.__ppd_scope_key = extractScopeKeyFromSurvey(merged)
      survey.__ppd_body_exec = safeJsonParse(detail?.body_exec ?? survey?.body_exec, null)
      const idSurvey = Number(survey?.id_survey || 0)
      if (idSurvey > 0) ppdSurveyTaskKeyCache.value[idSurvey] = keys[0] || ''
    }
  }

  return list
}

const createPpdSurveyForScope = async (tasks, fechaYmd) => {
  const templateMeta = await getTemplateMeta87()
  const fecha = toYmd(fechaYmd)
  const idProyecto = Number(normalizeProyectoId(proyectoSeleccionado.value) || 0) || null
  const idCliente = Number(clienteSeleccionado.value || 0) || null
  const idUser = getCurrentUserId()
  if (!idUser) {
    throw new Error('No se encontró id_user del usuario logeado para crear el survey PPD.')
  }
  const bodyExecObj = buildPpdBodyExecFromTasks(tasks, fecha)
  const idFlowTmpl = Number(templateMeta?.id_flow_tmpl || 0) || null
  if (!idFlowTmpl) {
    throw new Error('No se pudo resolver id_flow_tmpl desde tsrv_templates para crear el survey PPD.')
  }

  const payload = {
    id_tipo_srv: Number(templateMeta?.id_tipo_srv || 87) || 87,
    id_template: PPD_TEMPLATE_ID,
    id_user: idUser,
    id_user_creacion: idUser,
    id_empresa_cliente: idCliente,
    estado_srv: 'Pre Creado',
    header_seed: JSON.stringify(templateMeta.header_seed || {}),
    body_seed: null,
    approval_seed: JSON.stringify(templateMeta.approval_seed || {}),
    header_exec: JSON.stringify(templateMeta.header_seed || {}),
    body_exec: JSON.stringify(bodyExecObj),
    approval_exec: JSON.stringify(templateMeta.approval_seed || {}),
    fecha_plan_ini: fecha,
    fecha_plan_fin: fecha,
    fecha_real_ini: null,
    fecha_real_fin: null,
    fecha_upload: null,
    latitud: null,
    longitud: null,
    id_proyecto: idProyecto,
    id_flow_tmpl: idFlowTmpl,
  }

  const resp = await apiAxios.post('/survey/', payload)
  return Number(resp?.data?.idSurvey || resp?.data?.id_survey || 0) || 0
}

const updatePpdSurveyForScope = async (survey, tasks, fechaYmd) => {
  const idSurvey = Number(survey?.id_survey || 0)
  if (!idSurvey) throw new Error('Survey inválido para actualizar.')
  const bodyExecObj = buildPpdBodyExecFromTasks(tasks, fechaYmd)
  const payload = {
    estado_srv: survey?.estado_srv || 'Pre Creado',
    body_exec: JSON.stringify(bodyExecObj),
    fecha_real_ini: survey?.fecha_real_ini || null,
    fecha_ejec_fin: survey?.fecha_ejec_fin || null,
    latitud: survey?.latitud ?? null,
    longitud: survey?.longitud ?? null,
  }
  await apiAxios.put(`/survey/${idSurvey}`, payload)
  return idSurvey
}

const syncSurveysPpdByFecha = async () => {
  if (ppdSyncPromise) {
    ppdSyncNeedsRerun = true
    await ppdSyncPromise
    if (ppdSyncNeedsRerun) {
      ppdSyncNeedsRerun = false
      return syncSurveysPpdByFecha()
    }
    return
  }
  ppdSyncNeedsRerun = false
  ppdSyncPromise = (async () => {
  const fecha = toYmd(fechaSeleccionada.value)
  const idProyecto = String(normalizeProyectoId(proyectoSeleccionado.value) ?? '').trim()
  const idUser = Number(getCurrentUserId() || 0)
  if (!fecha || !idProyecto) return
  if (!idUser) {
    syncSummary.value = { fecha, total: 0, existentes: 0, creados: 0, errores: 1, detalle: 'No se encontró usuario logeado.', loading: false }
    return
  }

  let tasks = (tareasTarjeta.value || []).filter((t) => {
    const id = String(t?.idTarea ?? '')
    return id
  })

  syncSummary.value = {
    fecha,
    total: tasks.length,
    existentes: 0,
    creados: 0,
    errores: 0,
    detalle: '',
    loading: true,
  }

  try {
    const existentesBase = await getPpdSurveysForFecha(fecha)
    const existentes = await hydrateSurveyTaskKeys(existentesBase)
    upsertManualTasksFromSurveys(existentes, fecha)
    tasks = (tareasTarjeta.value || []).filter((t) => {
      const id = String(t?.idTarea ?? '')
      return id
    })
    const desiredTasks = tasks.filter((task) => !hasPpdDeletedKey(buildPpdTaskKey(task, fecha)))
    const desiredKeys = new Set(desiredTasks.map((task) => buildPpdTaskKey(task, fecha)))
    const scopeKey = buildPpdScopeKey(fecha)

    const scopeCandidates = existentes
      .filter((s) => Number(s?.id_user ?? s?.id_user_creacion ?? 0) === idUser)
      .filter((s) => {
        const sk = String(s?.__ppd_scope_key || extractScopeKeyFromSurvey(s) || '').trim()
        if (sk) return sk === scopeKey
        return true
      })
      .sort((a, b) => Number(b?.id_survey || 0) - Number(a?.id_survey || 0))

    const scopeSurvey = scopeCandidates[0] || null
    const currentKeys = new Set(extractTaskKeysFromSurvey(scopeSurvey || {}))
    let creadosOk = 0
    let primerError = ''

    const keysChanged = currentKeys.size !== desiredKeys.size || [...desiredKeys].some((k) => !currentKeys.has(k))
    if (!scopeSurvey) {
      if (desiredTasks.length) {
        try {
          const createdId = await createPpdSurveyForScope(desiredTasks, fecha)
          if (createdId > 0) creadosOk = 1
        } catch (e) {
          primerError = summarizeSyncError(e)
        }
      }
    } else if (keysChanged) {
      try {
        await updatePpdSurveyForScope(scopeSurvey, desiredTasks, fecha)
      } catch (e) {
        primerError = summarizeSyncError(e)
      }
    }

    const finalRowsRaw = await getPpdSurveysForFecha(fecha)
    const finalRows = await hydrateSurveyTaskKeys(finalRowsRaw)
    upsertManualTasksFromSurveys(finalRows, fecha)
    tasks = (tareasTarjeta.value || []).filter((t) => {
      const id = String(t?.idTarea ?? '')
      return id
    })
    const finalMap = {}
    const finalScope = finalRows
      .filter((s) => Number(s?.id_user ?? s?.id_user_creacion ?? 0) === idUser)
      .filter((s) => String(s?.__ppd_scope_key || extractScopeKeyFromSurvey(s) || '').trim() === scopeKey)
      .sort((a, b) => Number(b?.id_survey || 0) - Number(a?.id_survey || 0))[0] || null
    for (const key of extractTaskKeysFromSurvey(finalScope || {})) {
      finalMap[key] = finalScope
    }
    ppdSurveyByTaskKey.value = finalMap

    // Rehidrata visibilidad local desde el survey de alcance para que tareas agregadas
    // vuelvan a mostrarse al recargar aunque aún no tengan avance diario > 0.
    const nextVisibleFromSurvey = new Set(forceVisibleTaskIds.value)
    for (const key of Object.keys(finalMap)) {
      const parsed = parsePpdTaskKey(key)
      if (!parsed) continue
      const idTarea = String(parsed.idTarea || '').trim()
      if (!idTarea || idTarea.startsWith('__manual_n3__:')) continue
      if (tareasMapById.value.has(idTarea)) nextVisibleFromSurvey.add(idTarea)
    }
    forceVisibleTaskIds.value = nextVisibleFromSurvey

    let matchedTasks = 0
    for (const task of tasks) {
      const key = buildPpdTaskKey(task, fecha)
      if (finalMap[key]) matchedTasks += 1
    }
    const pendientes = Math.max(desiredTasks.length - matchedTasks, 0)

    syncSummary.value = {
      fecha,
      total: desiredTasks.length,
      existentes: Math.max(matchedTasks - creadosOk, 0),
      creados: creadosOk,
      errores: Math.max(pendientes, primerError ? 1 : 0),
      detalle: primerError,
      loading: false,
    }
  } catch (e) {
    console.error('Error sincronizando surveys PPD2:', e)
    syncSummary.value = {
      fecha,
      total: tasks.length,
      existentes: 0,
      creados: 0,
      errores: tasks.length || 1,
      detalle: summarizeSyncError(e),
      loading: false,
    }
  }
  })()
  let syncResult
  try {
    syncResult = await ppdSyncPromise
  } finally {
    ppdSyncPromise = null
  }
  if (ppdSyncNeedsRerun) {
    ppdSyncNeedsRerun = false
    return syncSurveysPpdByFecha()
  }
  return syncResult
}

const mergeTaskJsonDataForFecha = (rawJsonData, fechaYmd, value, real, pkAvanceDiario) => {
  const fecha = toYmd(fechaYmd)
  const list = parseJsonDataEntriesForMerge(rawJsonData)
  const idx = list.findIndex((it) => toYmd(it?.fecha ?? it?.date ?? it?.dia ?? '') === fecha)

  const hasRealOverride = !(real === null || real === undefined)
  const hasPkOverride = !(pkAvanceDiario === null || pkAvanceDiario === undefined || String(pkAvanceDiario).trim() === '')
  const nextEntry = {
    fecha,
    value: toNumberSafe(value),
  }
  if (hasRealOverride) nextEntry.real = toNumberSafe(real)
  if (hasPkOverride) {
    nextEntry.pk_avance_diario = String(pkAvanceDiario).trim()
    nextEntry.pkAvanceDiario = String(pkAvanceDiario).trim()
  }

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...nextEntry }
  } else {
    list.push({
      ...nextEntry,
      real: hasRealOverride ? toNumberSafe(real) : 0,
    })
  }
  list.sort((a, b) => String(a?.fecha || '').localeCompare(String(b?.fecha || '')))
  return list
}

const toNumberIfProvided = (v) => {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (!s) return null
  const pkMatch = s.match(/^(-?\d+)\+(\d{1,3})$/)
  if (pkMatch) {
    const intPart = Number(pkMatch[1])
    const decPart = Number(String(pkMatch[2]).padEnd(3, '0'))
    if (Number.isFinite(intPart) && Number.isFinite(decPart)) {
      return intPart + decPart / 1000
    }
  }
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const getRealOverrideFromDraft = (task) => {
  const draft = getPpdDraft(task?.idTarea, task)
  if (!draft) return null

  if (isSegmentAvailable(task, 'actividad')) {
    const pkAvance = toNumberIfProvided(draft?.actividad?.pkAvanceDiario)
    if (pkAvance !== null) return pkAvance
    return toNumberIfProvided(draft?.actividad?.totalHorasActividad)
  }

  if (isSegmentAvailable(task, 'camaras')) {
    const rows = Array.isArray(draft?.camaraMantencion) ? draft.camaraMantencion : []
    const totalCamaras = rows.reduce((acc, r) => acc + getCantidadCamarasRealizadas(r), 0)
    return totalCamaras
  }

  if (isSegmentAvailable(task, 'servidumbre')) {
    const row = Array.isArray(draft?.primeraMantencion) ? draft.primeraMantencion[0] : null
    const pkAvance = toNumberIfProvided(row?.pkAvanceDiario)
    if (pkAvance !== null) return pkAvance
    return toNumberIfProvided(row?.totalHorasActividad)
  }

  return null
}

const getPlannedOverrideFromDraft = (task) => {
  const draft = getPpdDraft(task?.idTarea, task)
  if (!draft) return null

  if (isSegmentAvailable(task, 'actividad')) {
    return toNumberIfProvided(draft?.actividad?.horasPlanificadas)
  }

  if (isSegmentAvailable(task, 'camaras')) {
    const rows = Array.isArray(draft?.camaraMantencion) ? draft.camaraMantencion : []
    const values = rows
      .map((r) => toNumberIfProvided(r?.horasPlanificadas))
      .filter((v) => v !== null)
    if (!values.length) return null
    return values.reduce((acc, v) => acc + v, 0)
  }

  if (isSegmentAvailable(task, 'servidumbre')) {
    const row = Array.isArray(draft?.primeraMantencion) ? draft.primeraMantencion[0] : null
    return toNumberIfProvided(row?.horasPlanificadas)
  }

  return null
}

const getPkAvanceOverrideFromDraft = (task) => {
  const draft = getPpdDraft(task?.idTarea, task)
  if (!draft) return ''

  if (isSegmentAvailable(task, 'actividad')) {
    return String(draft?.actividad?.pkAvanceDiario ?? '').trim()
  }

  if (isSegmentAvailable(task, 'camaras')) {
    return ''
  }

  if (isSegmentAvailable(task, 'servidumbre')) {
    const row = Array.isArray(draft?.primeraMantencion) ? draft.primeraMantencion[0] : null
    return String(row?.pkAvanceDiario ?? '').trim()
  }

  return ''
}

const hasJsonDataEntryForFecha = (rawJsonData, fechaYmd) => {
  const fecha = toYmd(fechaYmd)
  return parseJsonDataEntriesForMerge(rawJsonData)
    .some((it) => toYmd(it?.fecha ?? it?.date ?? it?.dia ?? '') === fecha)
}

const guardarPPD2 = async () => {
  if (guardandoPPD2.value) return
  guardandoPPD2.value = true
  errorCarga.value = ''
  guardarEstado.value = { type: 'info', text: '' }
  try {
    const fecha = toYmd(fechaSeleccionada.value)
    if (!fecha) throw new Error('Fecha inválida para guardar.')

    const tasks = (tareasTarjeta.value || []).filter((t) => String(t?.idTarea ?? '').trim())
    if (!tasks.length) {
      guardarEstado.value = { type: 'info', text: 'No hay tareas para guardar.' }
      return
    }

    // 1) Persistir/actualizar survey (flujo actual PPD2).
    await syncSurveysPpdByFecha()

    // 2) Persistir json_data en tpry_gantt_tarea_v3 por tarea (merge por fecha, sin borrar históricos).
    let ok = 0
    let fail = 0
    let detalleError = ''
    const debugJsonDataToSave = []
    const attemptedTaskIds = []

    for (const task of tasks) {
      const idTareaRaw = String(task?.idTarea ?? '').trim()
      if (!idTareaRaw || idTareaRaw.startsWith('__manual_n3__:')) continue

      const sourceTask = tareasMapById.value.get(idTareaRaw)
      const existsFecha = hasJsonDataEntryForFecha(sourceTask?.json_data, fecha)
      const forcedVisible = forceVisibleTaskIds.value.has(idTareaRaw)
      const planDia = toNumberSafe(task?.planDia)
      const realDiaActual = toNumberSafe(task?.realDia)
      const realOverride = getRealOverrideFromDraft(task)
      const plannedOverride = getPlannedOverrideFromDraft(task)
      const pkAvanceOverride = getPkAvanceOverrideFromDraft(task)
      const valueToSave = plannedOverride !== null
        ? plannedOverride
        : ((!existsFecha && forcedVisible && planDia === 0 && realDiaActual === 0) ? 1 : planDia)
      const mergedJsonData = mergeTaskJsonDataForFecha(
        sourceTask?.json_data,
        fecha,
        valueToSave,
        realOverride,
        pkAvanceOverride
      )

      const idTareaNum = Number(idTareaRaw)
      const payload = {
        id_tarea: Number.isFinite(idTareaNum) ? idTareaNum : idTareaRaw,
        json_data: mergedJsonData,
      }
      attemptedTaskIds.push(String(payload.id_tarea))

      debugJsonDataToSave.push({
        id_tarea: payload.id_tarea,
        fecha,
        json_data: mergedJsonData,
      })
      console.log('[PPD2][GUARDAR][TAREA_JSON_DATA]', {
        id_tarea: payload.id_tarea,
        fecha,
        json_data: mergedJsonData,
      })

      try {
        const updResp = await apiAxios.put('/tareas/updTareasV3', payload, {
          headers: { 'Content-Type': 'application/json' },
        })
        console.log('[PPD2][GUARDAR][RESP_UPD_TAREA]', {
          id_tarea: payload.id_tarea,
          response: updResp?.data,
        })
        if (sourceTask) sourceTask.json_data = mergedJsonData
        ok += 1
      } catch (e) {
        fail += 1
        if (!detalleError) detalleError = summarizeSyncError(e)
      }
    }

    console.log('[PPD2][GUARDAR][RESUMEN_JSON_DATA]', {
      fecha,
      total_tareas_a_guardar: debugJsonDataToSave.length,
      items: debugJsonDataToSave,
    })

    // Verificación post-guardado: releer Gantt V3 y validar que la fecha quedó en json_data.
    let notReflectedIds = []
    try {
      const selectedProyecto = String(normalizeProyectoId(proyectoSeleccionado.value) ?? '').trim()
      const idProyectoParam = Number(selectedProyecto)
      const { data: ganttData } = await apiAxios.get('/servicio/leanglobal/obtenerGanttsTareasV3', {
        params: { id_proyecto: Number.isFinite(idProyectoParam) ? idProyectoParam : selectedProyecto },
      })
      const latestBase = normalizarPayload(ganttData)
      tareasBase.value = latestBase
      totalBase.value = latestBase.length

      const mapLatest = new Map(
        latestBase.map((row) => [String(row?.id_tarea ?? '').trim(), row])
      )
      notReflectedIds = attemptedTaskIds.filter((id) => {
        const row = mapLatest.get(String(id))
        return !hasJsonDataEntryForFecha(row?.json_data, fecha)
      })
      if (notReflectedIds.length) {
        console.warn('[PPD2][GUARDAR][NO_REFLEJADAS_EN_GANTT]', {
          fecha,
          ids: notReflectedIds,
        })
      }
    } catch (e) {
      console.warn('[PPD2][GUARDAR][POSTCHECK_ERROR]', summarizeSyncError(e))
    }

    if (fail > 0) {
      guardarEstado.value = {
        type: 'warning',
        text: `Guardado parcial: ${ok} tarea(s) guardadas, ${fail} con error.${detalleError ? ` Detalle: ${detalleError}` : ''}`,
      }
      return
    }

    if (notReflectedIds.length) {
      guardarEstado.value = {
        type: 'warning',
        text: `Guardado ejecutado, pero no se reflejó en Gantt para ${notReflectedIds.length} tarea(s): ${notReflectedIds.join(', ')}.`,
      }
      return
    }

    guardarEstado.value = {
      type: 'success',
      text: `Guardado OK: ${ok} tarea(s) actualizadas en Gantt para ${fecha}.`,
    }
  } catch (e) {
    errorCarga.value = `No se pudo guardar PPD2: ${summarizeSyncError(e)}`
  } finally {
    guardandoPPD2.value = false
  }
}

const normalizarPayload = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.datos)) return payload.datos
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const getProjectsIdsFromStorage = () => {
  try {
    const rawLegacy = JSON.parse(localStorage.getItem('proyectsIds') || '[]')
    const rawAlt = JSON.parse(localStorage.getItem('projectsIds') || '[]')
    const raw = Array.isArray(rawLegacy) && rawLegacy.length ? rawLegacy : rawAlt
    return Array.isArray(raw)
      ? raw.map((v) => String(v ?? '').trim()).filter(Boolean)
      : []
  } catch {
    return []
  }
}

const normalizeProyectoId = (v) => {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'object') return v.id_proyecto ?? v.value ?? ''
  return v
}

const cargarClientes = async () => {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerEmpresas')
    clientes.value = (Array.isArray(data) ? data : []).filter(
      (e) => !(e.flag_externo === true || e.flag_externo === 1 || e.flag_externo === '1' || e.flag_externo === 't' || e.flag_externo === 'true')
    )
  } catch (e) {
    clientes.value = []
    errorCarga.value = `No se pudieron cargar clientes: ${e?.message || e}`
  }
}

const cargarProyectos = async () => {
  try {
    const idCliente = clienteSeleccionado.value ?? ''
    const { data } = await apiAxios.get(`/servicio/leanglobal/obtenerProyectos?id_empresa_cliente=${idCliente}`)
    proyectos.value = normalizarPayload(data)
  } catch (e) {
    proyectos.value = []
    errorCarga.value = `No se pudieron cargar proyectos: ${e?.message || e}`
  }
}

const cargarTareas = async () => {
  cargando.value = true
  errorCarga.value = ''
  totalBase.value = 0
  try {
    const selectedProyecto = String(normalizeProyectoId(proyectoSeleccionado.value) ?? '').trim()

    if (!selectedProyecto) {
      tareasBase.value = []
      patrullasProyectoOptions.value = []
      errorCarga.value = 'Selecciona un proyecto para cargar tareas (igual que en GANTTV3).'
      return
    }

    const idProyectoEquiposParam = Number(selectedProyecto)
    try {
      const { data: equiposData } = await apiAxios.get('/servicio/leanglobal/obtenerEquiposProyectos', {
        params: { id_proyecto: Number.isFinite(idProyectoEquiposParam) ? idProyectoEquiposParam : selectedProyecto }
      })
      const equipos = Array.isArray(equiposData) ? equiposData : normalizarPayload(equiposData)
      patrullasProyectoOptions.value = dedupePatrullas(equipos.map(getPatrullaNameFromRow))
    } catch (e) {
      patrullasProyectoOptions.value = []
      console.error('No se pudieron cargar patrullas dinámicas del proyecto:', e)
    }

    const idProyectoParam = Number(selectedProyecto)
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerGanttsTareasV3', {
      params: { id_proyecto: Number.isFinite(idProyectoParam) ? idProyectoParam : selectedProyecto }
    })
    const base = normalizarPayload(data)
    removedTaskIds.value = new Set()
    forceVisibleTaskIds.value = new Set()
    totalBase.value = base.length
    tareasBase.value = base
    await syncSurveysPpdByFecha()
  } catch (e) {
    tareasBase.value = []
    totalBase.value = 0
    errorCarga.value = `No se pudieron cargar tareas: ${e?.message || e}`
  } finally {
    cargando.value = false
  }
}

const pickPreferredProyecto = () => {
  const ids = getProjectsIdsFromStorage()
  if (!Array.isArray(proyectos.value) || !proyectos.value.length) return null
  if (ids.length) {
    const hit = proyectos.value.find((p) => ids.includes(String(p?.id_proyecto ?? '').trim()))
    if (hit) return hit.id_proyecto
  }
  return proyectos.value[0]?.id_proyecto ?? null
}

const pickDefaultCliente = () => {
  const list = Array.isArray(clientes.value) ? clientes.value : []
  const hit = list.find((c) => normalizeText(c?.name_empresa).includes(DEFAULT_CLIENTE_NOMBRE))
  return hit?.id_empresa ?? null
}

const pickDefaultProyecto = () => {
  const list = Array.isArray(proyectos.value) ? proyectos.value : []
  const hit = list.find((p) => normalizeText(p?.nombre_proyecto).includes(DEFAULT_PROYECTO_NOMBRE))
  return hit?.id_proyecto ?? null
}

watch(clienteSeleccionado, async () => {
  if (suppressAutoWatches) return
  proyectoSeleccionado.value = null
  await cargarProyectos()
  const autoProyecto = pickDefaultProyecto() ?? pickPreferredProyecto()
  if (autoProyecto !== null && autoProyecto !== undefined) {
    proyectoSeleccionado.value = autoProyecto
  }
})

watch(proyectoSeleccionado, async (nuevo) => {
  if (suppressAutoWatches) return
  if (!nuevo) {
    tareasBase.value = []
    totalBase.value = 0
    patrullasProyectoOptions.value = []
    ppdSurveyByTaskKey.value = {}
    syncSummary.value = { fecha: '', total: 0, existentes: 0, creados: 0, errores: 0, detalle: '', loading: false }
    return
  }
  await cargarTareas()
})

watch(fechaSeleccionada, async () => {
  if (!tareasBase.value.length) return
  await syncSurveysPpdByFecha()
})

watch(
  () => createTaskSelection.value.nivel1,
  () => {
    createTaskSelection.value.nivel2 = null
    createTaskSelection.value.nivel3 = null
  }
)

watch(
  () => createTaskSelection.value.nivel2,
  () => {
    createTaskSelection.value.nivel3 = null
  }
)

onMounted(async () => {
  suppressAutoWatches = true
  try {
    const queryFecha = toYmd(route.query?.fecha)
    const queryCliente = String(route.query?.cliente ?? '').trim()
    const queryProyecto = String(route.query?.proyecto ?? '').trim()

    if (queryFecha) {
      fechaSeleccionada.value = queryFecha
    }

    await cargarClientes()

    if (queryCliente) {
      const queryClienteNum = Number(queryCliente)
      clienteSeleccionado.value = Number.isFinite(queryClienteNum) ? queryClienteNum : queryCliente
      await cargarProyectos()
      if (queryProyecto) {
        const hit = (Array.isArray(proyectos.value) ? proyectos.value : []).find(
          (p) => String(p?.id_proyecto ?? '').trim() === queryProyecto
        )
        if (hit) {
          proyectoSeleccionado.value = hit.id_proyecto
        }
      }
      if (!proyectoSeleccionado.value) {
        const autoProyecto = pickDefaultProyecto() ?? pickPreferredProyecto()
        if (autoProyecto !== null && autoProyecto !== undefined) {
          proyectoSeleccionado.value = autoProyecto
        }
      }
    } else {
      const defaultCliente = pickDefaultCliente()
      if (defaultCliente !== null && defaultCliente !== undefined) {
        clienteSeleccionado.value = defaultCliente
      } else {
        await cargarProyectos()
        const autoProyecto = pickDefaultProyecto() ?? pickPreferredProyecto()
        if (autoProyecto !== null && autoProyecto !== undefined) {
          proyectoSeleccionado.value = autoProyecto
        }
      }
    }

    if (queryProyecto && !proyectoSeleccionado.value) {
      const queryProyectoNum = Number(queryProyecto)
      proyectoSeleccionado.value = Number.isFinite(queryProyectoNum) ? queryProyectoNum : queryProyecto
    }

    if (proyectoSeleccionado.value) {
      await cargarTareas()
    }
  } finally {
    suppressAutoWatches = false
  }
})
</script>

<style scoped>
.ppd2-page {
  --ppd-bg-1: #f8fafc;
  --ppd-bg-2: #f1f5f9;
  --ppd-surface: #ffffff;
  --ppd-border: #dbe3ee;
  --ppd-border-soft: #e8eef5;
  --ppd-title: #0f172a;
  --ppd-text: #334155;
  --ppd-muted: #64748b;
  --ppd-primary: #2563eb;
  --ppd-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
  --ppd-shadow-soft: 0 3px 12px rgba(15, 23, 42, 0.05);

  background:
    linear-gradient(180deg, var(--ppd-bg-2) 0%, var(--ppd-bg-1) 42%);
  min-height: calc(100vh - 80px);
}

.ppd-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.ppd-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #0f2b53;
}

.ppd-subtitle {
  margin: 2px 0 0;
  color: #566985;
  font-size: 1.05rem;
}

.ppd-create-btn {
  min-width: 144px;
  height: 40px;
  font-weight: 700;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.28);
}

.ppd-filter-card {
  border: 1px solid var(--ppd-border-soft);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: var(--ppd-shadow-soft);
}

.ppd-load-btn {
  border-radius: 12px;
  font-weight: 700;
}

.task-card {
  border: 1px solid var(--ppd-border);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: var(--ppd-shadow-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--ppd-shadow);
  border-color: #bfdbfe;
}

.task-card__title {
  padding: 14px 16px 12px;
  border-bottom: 1px solid #e8edf3;
}

.task-card__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.task-code-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-size: 0.76rem;
  line-height: 1;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 5px 8px;
  border-radius: 8px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.task-card__name {
  display: block;
  color: var(--ppd-title);
  font-size: 1.15rem;
  line-height: 1.25;
  font-weight: 800;
  letter-spacing: 0.01em;
  margin-right: 8px;
}

.task-card__subtitle {
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.2;
  font-weight: 500;
}

.ppd-editor {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px;
  background: #f8fafc;
}

.ppd-registro {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px;
  margin-bottom: 8px;
}

.ppd-registro:last-child {
  margin-bottom: 0;
}

.ppd-section-card {
  border-color: #e2e8f0 !important;
  border-radius: 10px !important;
  background: #ffffff !important;
}

.ppd-map-placeholder {
  border: 1px dashed #93a4b8;
  border-radius: 8px;
  padding: 10px;
  font-size: 12px;
  color: var(--ppd-text);
  background: #f8fafc;
}

.ppd-map-label {
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.2;
  letter-spacing: 0.02em;
}

.ppd-map-status {
  border: 1px solid #fed7aa;
  border-radius: 10px;
  min-height: 44px;
  padding: 7px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.88rem;
  font-weight: 600;
}

.ppd-map-status.error {
  background: #fff7ed;
  color: #c2410c;
}

.ppd-map-status.ok {
  background: #ecfdf5;
  border-color: #bbf7d0;
  color: #15803d;
}

.ppd-map-embed-wrap {
  border: 1px solid var(--ppd-border);
  border-radius: 8px;
  padding: 4px;
  background: #fff;
}

.ppd-map-embed {
  width: 100%;
  height: 160px;
  border: 0;
  border-radius: 6px;
}

.ppd-map-meta {
  font-size: 0.72rem;
  color: #94a3b8;
  line-height: 1.2;
}

.stack-label {
  margin: 0 0 4px 2px;
  font-size: 10px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
  min-height: 22px;
  display: flex;
  align-items: flex-end;
}

.ppd2-page :deep(.ppd-field .v-field) {
  border-radius: 10px;
  background: #f1f5f9;
  box-shadow: none;
}

.ppd2-page :deep(.ppd-field .v-field--variant-solo) {
  box-shadow: none;
}

.ppd2-page :deep(.ppd-field .v-field__overlay) {
  opacity: 0;
}

.ppd2-page :deep(.ppd-field .v-field__input) {
  min-height: 40px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.ppd2-page :deep(.v-field) {
  border-radius: 10px;
  transition: all 0.3s ease;
}

.ppd2-page :deep(.v-field--variant-outlined) {
  background: #f1f5f9;
}

.ppd2-page :deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-opacity: 1;
  color: #e2e8f0;
}

.ppd2-page :deep(.v-field:hover .v-field__outline) {
  color: #cbd5e1;
}

.ppd2-page :deep(.v-field.v-field--focused) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14);
}

.ppd2-page :deep(.v-field.v-field--focused .v-field__outline) {
  color: #60a5fa;
}

.ppd2-page :deep(.v-label.v-field-label) {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8 !important;
  opacity: 1;
}

.ppd2-page :deep(.v-field__input) {
  color: #0f172a;
  min-height: 42px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.ppd2-page :deep(.v-field__input input::placeholder) {
  color: #94a3b8;
  opacity: 1;
}

.ppd2-page :deep(.v-field__append-inner .v-icon),
.ppd2-page :deep(.v-field__prepend-inner .v-icon) {
  color: #94a3b8;
}

@media (max-width: 960px) {
  .ppd-topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .ppd-title {
    font-size: 1.45rem;
  }

  .ppd-subtitle {
    font-size: 0.95rem;
  }

  .ppd-create-btn {
    width: 100%;
  }

  .task-card__name {
    font-size: 1rem;
  }
}
</style>
